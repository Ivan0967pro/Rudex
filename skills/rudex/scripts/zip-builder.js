"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STORE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
  ".mp4",
  ".webm",
  ".zip",
  ".gz",
  ".pdf",
]);

const MAX_SINGLE_FILE_BYTES = 50 * 1024 * 1024;
const MAX_FULL_LOG_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_ARTIFACTS_BYTES = 150 * 1024 * 1024;
const INLINE_TRANSCRIPT_READ_BYTES = 8 * 1024 * 1024;
const STREAM_DEFLATE_MEM_CAP_BYTES = 16 * 1024 * 1024;
const STREAM_HIGH_WATER_MARK = 64 * 1024;
const LOG_SLICE_BYTES = 256 * 1024;
const MAX_BRAIN_CANDIDATES = 60;

const ZIP32_MAX_ENTRIES = 0xffff;
const ZIP32_MAX_UINT32 = 0xffffffff;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_VERSION_MADE_BY_UNIX = 0x0314;
const ZIP_VERSION_NEEDED = 20;
const POSIX_FILE_EXTERNAL_ATTR = (0o100644 << 16) >>> 0;

const CRC_TABLE = (() => {
  const tbl = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tbl[i] = c >>> 0;
  }
  return tbl;
})();

function crc32Update(crc, buf) {
  let c = crc >>> 0;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c >>> 0;
}

function crc32(buf) {
  const b = toRawBuffer(buf);
  return (crc32Update(0xffffffff, b) ^ 0xffffffff) >>> 0;
}

function toDosTimeDate(dateObj) {
  const d = dateObj instanceof Date && !Number.isNaN(dateObj.getTime()) ? dateObj : new Date();
  const year = Math.max(1980, Math.min(2107, d.getFullYear()));
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = Math.floor(d.getSeconds() / 2);
  const dosTime = ((hours & 0x1f) << 11) | ((minutes & 0x3f) << 5) | (seconds & 0x1f);
  const dosDate = (((year - 1980) & 0x7f) << 9) | ((month & 0x0f) << 5) | (day & 0x1f);
  return { dosTime, dosDate };
}

function normalizeZipEntryName(rawName) {
  let s = String(rawName || "").replace(/^[a-zA-Z]:/, "");
  s = s.replace(/\\/g, "/");
  const parts = s
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .map((seg) => seg.replace(/[:*?"<>|\x00-\x1f]/g, "_"))
    .filter((seg) => seg && seg !== "." && seg !== "..");
  return parts.join("/");
}

function makeUniqueEntryName(rawName, seenLowerSet) {
  const clean = normalizeZipEntryName(rawName) || "file.bin";
  const lowerClean = clean.toLowerCase();
  if (!seenLowerSet.has(lowerClean)) {
    seenLowerSet.add(lowerClean);
    return clean;
  }
  const dotIdx = clean.lastIndexOf(".");
  const slashIdx = clean.lastIndexOf("/");
  const hasExt = dotIdx > slashIdx + 1 && dotIdx > 0;
  const base = hasExt ? clean.slice(0, dotIdx) : clean;
  const ext = hasExt ? clean.slice(dotIdx) : "";
  let n = 2;
  let candidate = `${base} (${n})${ext}`;
  while (seenLowerSet.has(candidate.toLowerCase())) {
    n++;
    candidate = `${base} (${n})${ext}`;
  }
  seenLowerSet.add(candidate.toLowerCase());
  return candidate;
}

function shouldStoreUncompressed(entryName) {
  const dot = entryName.lastIndexOf(".");
  if (dot === -1) return false;
  return STORE_EXTENSIONS.has(entryName.slice(dot).toLowerCase());
}

function assertZip32EntryLimits(entryCount, offset, compSize, uncompSize, nameLen) {
  if (entryCount >= ZIP32_MAX_ENTRIES) {
    throw new Error(`ZIP32 entry limit exceeded (max ${ZIP32_MAX_ENTRIES})`);
  }
  if (nameLen > 0xffff) {
    throw new Error(`ZIP entry filename too long (${nameLen} bytes)`);
  }
  if (compSize > ZIP32_MAX_UINT32 || uncompSize > ZIP32_MAX_UINT32) {
    throw new Error(`ZIP32 single file size limit exceeded (${uncompSize} bytes)`);
  }
  if (offset > ZIP32_MAX_UINT32 || offset + 30 + nameLen + compSize > ZIP32_MAX_UINT32) {
    throw new Error("ZIP32 4GB archive offset limit exceeded");
  }
}

function assertZip32ArchiveLimits(entryCount, centralDirSize, centralOffset) {
  if (entryCount > ZIP32_MAX_ENTRIES) {
    throw new Error(`ZIP32 entry count limit exceeded (${entryCount})`);
  }
  if (centralDirSize > ZIP32_MAX_UINT32) {
    throw new Error(`ZIP32 central directory size limit exceeded (${centralDirSize})`);
  }
  if (centralOffset > ZIP32_MAX_UINT32) {
    throw new Error(`ZIP32 central directory offset limit exceeded (${centralOffset})`);
  }
}

function buildLocalHeader(nameLen, method, dosTime, dosDate, crc, compSize, uncompSize) {
  const hdr = Buffer.alloc(30);
  hdr.writeUInt32LE(0x04034b50, 0);
  hdr.writeUInt16LE(ZIP_VERSION_NEEDED, 4);
  hdr.writeUInt16LE(ZIP_UTF8_FLAG, 6);
  hdr.writeUInt16LE(method, 8);
  hdr.writeUInt16LE(dosTime, 10);
  hdr.writeUInt16LE(dosDate, 12);
  hdr.writeUInt32LE(crc >>> 0, 14);
  hdr.writeUInt32LE(compSize >>> 0, 18);
  hdr.writeUInt32LE(uncompSize >>> 0, 22);
  hdr.writeUInt16LE(nameLen, 26);
  hdr.writeUInt16LE(0, 28);
  return hdr;
}

function buildCentralHeader(nameLen, method, dosTime, dosDate, crc, compSize, uncompSize, offset) {
  const hdr = Buffer.alloc(46);
  hdr.writeUInt32LE(0x02014b50, 0);
  hdr.writeUInt16LE(ZIP_VERSION_MADE_BY_UNIX, 4);
  hdr.writeUInt16LE(ZIP_VERSION_NEEDED, 6);
  hdr.writeUInt16LE(ZIP_UTF8_FLAG, 8);
  hdr.writeUInt16LE(method, 10);
  hdr.writeUInt16LE(dosTime, 12);
  hdr.writeUInt16LE(dosDate, 14);
  hdr.writeUInt32LE(crc >>> 0, 16);
  hdr.writeUInt32LE(compSize >>> 0, 20);
  hdr.writeUInt32LE(uncompSize >>> 0, 24);
  hdr.writeUInt16LE(nameLen, 28);
  hdr.writeUInt16LE(0, 30);
  hdr.writeUInt16LE(0, 32);
  hdr.writeUInt16LE(0, 34);
  hdr.writeUInt16LE(0, 36);
  hdr.writeUInt32LE(POSIX_FILE_EXTERNAL_ATTR, 38);
  hdr.writeUInt32LE(offset >>> 0, 42);
  return hdr;
}

function buildEocd(entryCount, centralDirSize, centralOffset) {
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entryCount, 8);
  eocd.writeUInt16LE(entryCount, 10);
  eocd.writeUInt32LE(centralDirSize >>> 0, 12);
  eocd.writeUInt32LE(centralOffset >>> 0, 16);
  eocd.writeUInt16LE(0, 20);
  return eocd;
}

function toRawBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  return Buffer.from(typeof data === "string" ? data : String(data ?? ""), "utf8");
}

function createZipBuffer(entries, mtime) {
  const list = Array.isArray(entries) ? entries : [];
  const seenLower = new Set();
  const localChunks = [];
  const centralChunks = [];
  let centralDirSize = 0;
  let entryCount = 0;
  let offset = 0;

  for (const item of list) {
    if (!item) continue;
    const name = makeUniqueEntryName(item.name, seenLower);
    const nameBuf = Buffer.from(name, "utf8");
    const entryMtime = item.mtime || mtime || new Date();
    const { dosTime, dosDate } = toDosTimeDate(entryMtime);

    let rawBuf;
    if (item.data === undefined && typeof item.filePath === "string" && item.filePath) {
      rawBuf = fs.readFileSync(item.filePath);
    } else {
      rawBuf = toRawBuffer(item.data);
    }

    const crc = crc32(rawBuf);
    let method = 0;
    let payloadBuf = rawBuf;

    if (rawBuf.length > 0 && !shouldStoreUncompressed(name)) {
      const deflated = zlib.deflateRawSync(rawBuf, { level: 6 });
      if (deflated.length < rawBuf.length) {
        method = 8;
        payloadBuf = deflated;
      }
    }

    assertZip32EntryLimits(entryCount, offset, payloadBuf.length, rawBuf.length, nameBuf.length);

    const localHeader = buildLocalHeader(
      nameBuf.length,
      method,
      dosTime,
      dosDate,
      crc,
      payloadBuf.length,
      rawBuf.length
    );
    localChunks.push(localHeader, nameBuf, payloadBuf);

    const centralHeader = buildCentralHeader(
      nameBuf.length,
      method,
      dosTime,
      dosDate,
      crc,
      payloadBuf.length,
      rawBuf.length,
      offset
    );
    centralChunks.push(centralHeader, nameBuf);
    centralDirSize += 46 + nameBuf.length;
    offset += 30 + nameBuf.length + payloadBuf.length;
    entryCount++;
  }

  assertZip32ArchiveLimits(entryCount, centralDirSize, offset);

  const centralDirBuf = Buffer.concat(centralChunks, centralDirSize);
  const eocd = buildEocd(entryCount, centralDirSize, offset);

  return Buffer.concat([...localChunks, centralDirBuf, eocd]);
}

function deflateRawAsync(buf) {
  return new Promise((resolve, reject) => {
    zlib.deflateRaw(buf, { level: 6 }, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function measureFileCrcAndSize(filePath, maxBytes) {
  if (typeof maxBytes === "number" && Number.isFinite(maxBytes) && maxBytes <= 0) {
    return Promise.resolve({ crc: 0, size: 0 });
  }
  return new Promise((resolve, reject) => {
    let crcState = 0xffffffff;
    let size = 0;
    const streamOpts = { highWaterMark: STREAM_HIGH_WATER_MARK };
    if (typeof maxBytes === "number" && Number.isFinite(maxBytes) && maxBytes > 0) {
      streamOpts.end = maxBytes - 1;
    }
    const rs = fs.createReadStream(filePath, streamOpts);
    rs.on("data", (chunk) => {
      crcState = crc32Update(crcState, chunk);
      size += chunk.length;
    });
    rs.on("error", reject);
    rs.on("end", () => {
      resolve({
        crc: (crcState ^ 0xffffffff) >>> 0,
        size,
      });
    });
  });
}

async function prepareDiskEntryPayload(filePath, allowDeflate, spillPath, snapshotBytes) {
  const hasSnapshot = typeof snapshotBytes === "number" && Number.isFinite(snapshotBytes) && snapshotBytes >= 0;
  if (hasSnapshot && snapshotBytes === 0) {
    return { method: 0, crc: 0, compSize: 0, uncompSize: 0, chunks: null, spillFile: null };
  }
  if (!allowDeflate) {
    const { crc, size } = await measureFileCrcAndSize(filePath, hasSnapshot ? snapshotBytes : undefined);
    return { method: 0, crc, compSize: size, uncompSize: size, chunks: null, spillFile: null };
  }

  let crcState = 0xffffffff;
  let uncompSize = 0;
  let compSize = 0;
  let chunks = [];
  let spillStream = null;
  let usedSpill = false;

  const rsOpts = { highWaterMark: STREAM_HIGH_WATER_MARK };
  if (hasSnapshot && snapshotBytes > 0) {
    rsOpts.end = snapshotBytes - 1;
  }
  const rs = fs.createReadStream(filePath, rsOpts);
  const deflater = zlib.createDeflateRaw({ level: 6 });

  rs.on("data", (chunk) => {
    crcState = crc32Update(crcState, chunk);
    uncompSize += chunk.length;
  });

  const pipePromise = new Promise((resolve, reject) => {
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      rs.destroy();
      deflater.destroy();
      if (spillStream) spillStream.destroy();
      reject(err);
    };

    rs.on("error", fail);
    deflater.on("error", fail);
    rs.pipe(deflater);

    deflater.on("data", (c) => {
      if (settled) return;
      compSize += c.length;
      if (!usedSpill && compSize <= STREAM_DEFLATE_MEM_CAP_BYTES) {
        chunks.push(c);
        return;
      }
      if (!usedSpill) {
        usedSpill = true;
        spillStream = fs.createWriteStream(spillPath);
        spillStream.on("error", fail);
        let ok = true;
        for (const prev of chunks) {
          ok = spillStream.write(prev) && ok;
        }
        chunks = [];
        ok = spillStream.write(c) && ok;
        if (!ok) {
          deflater.pause();
          spillStream.once("drain", () => {
            if (!settled) deflater.resume();
          });
        }
        return;
      }
      if (!spillStream.write(c)) {
        deflater.pause();
        spillStream.once("drain", () => {
          if (!settled) deflater.resume();
        });
      }
    });

    deflater.on("end", () => {
      if (settled) return;
      if (usedSpill && spillStream) {
        spillStream.once("close", () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        });
        spillStream.end();
      } else {
        settled = true;
        resolve();
      }
    });
  });

  try {
    await pipePromise;
  } catch (err) {
    if (usedSpill) {
      await fs.promises.unlink(spillPath).catch(() => {});
    }
    throw err;
  }

  const crc = (crcState ^ 0xffffffff) >>> 0;
  if (uncompSize === 0 || compSize >= uncompSize) {
    chunks = [];
    if (usedSpill) {
      await fs.promises.unlink(spillPath).catch(() => {});
    }
    return { method: 0, crc, compSize: uncompSize, uncompSize, chunks: null, spillFile: null };
  }

  return {
    method: 8,
    crc,
    compSize,
    uncompSize,
    chunks: usedSpill ? null : chunks,
    spillFile: usedSpill ? spillPath : null,
  };
}

function createStreamWriter(outStream) {
  let streamError = null;
  const onFatalError = (err) => {
    if (!streamError) streamError = err;
  };
  outStream.on("error", onFatalError);

  function ensureAlive() {
    if (streamError) throw streamError;
    if (outStream.destroyed || outStream.writableEnded) {
      throw new Error("Output write stream closed unexpectedly");
    }
  }

  function writeChunk(chunk) {
    ensureAlive();
    if (!chunk || chunk.length === 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let done = false;
      const cleanup = () => {
        outStream.off("error", onErr);
        outStream.off("drain", onDrain);
        outStream.off("close", onClose);
      };
      const onErr = (err) => {
        if (done) return;
        done = true;
        cleanup();
        reject(err);
      };
      const onClose = () => {
        if (done) return;
        done = true;
        cleanup();
        reject(streamError || new Error("Output stream closed before draining"));
      };
      const onDrain = () => {
        if (done) return;
        done = true;
        cleanup();
        resolve();
      };
      outStream.once("error", onErr);
      outStream.once("close", onClose);
      const ok = outStream.write(chunk);
      if (ok) {
        done = true;
        cleanup();
        resolve();
      } else {
        outStream.once("drain", onDrain);
      }
    });
  }

  function endAndClose() {
    if (streamError) return Promise.reject(streamError);
    if (outStream.closed) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let done = false;
      const cleanup = () => {
        outStream.off("error", onErr);
        outStream.off("close", onClose);
      };
      const onErr = (err) => {
        if (done) return;
        done = true;
        cleanup();
        reject(err);
      };
      const onClose = () => {
        if (done) return;
        done = true;
        cleanup();
        if (streamError) reject(streamError);
        else resolve();
      };
      outStream.once("error", onErr);
      outStream.once("close", onClose);
      outStream.end();
    });
  }

  function destroyAndWait() {
    if (outStream.closed || outStream.destroyed) return Promise.resolve();
    return new Promise((resolve) => {
      outStream.once("close", resolve);
      outStream.destroy();
    });
  }

  return { ensureAlive, writeChunk, endAndClose, destroyAndWait };
}

async function pipeFileToWriter(filePath, writer, expectedBytes) {
  if (expectedBytes === 0) return;
  let streamed = 0;
  const rs = fs.createReadStream(filePath, {
    highWaterMark: STREAM_HIGH_WATER_MARK,
    end: expectedBytes - 1,
  });
  try {
    for await (const chunk of rs) {
      writer.ensureAlive();
      streamed += chunk.length;
      if (streamed > expectedBytes) {
        throw new Error(`File grew while streaming into ZIP: ${filePath}`);
      }
      await writer.writeChunk(chunk);
    }
    if (streamed !== expectedBytes) {
      throw new Error(`File size changed while streaming into ZIP: ${filePath}`);
    }
  } finally {
    rs.destroy();
  }
}

async function writeZipFile(outPath, entries, mtime) {
  if (!outPath) {
    throw new Error("outPath is required for writeZipFile");
  }
  const list = Array.isArray(entries) ? entries : [];
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });

  const outStream = fs.createWriteStream(outPath, { highWaterMark: STREAM_HIGH_WATER_MARK });
  const writer = createStreamWriter(outStream);
  const seenLower = new Set();
  const centralChunks = [];
  let centralDirSize = 0;
  let entryCount = 0;
  let offset = 0;
  const spillBase = `${outPath}.part-${process.pid}-${Math.random().toString(36).slice(2, 7)}.tmp`;

  try {
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item) continue;

      const name = makeUniqueEntryName(item.name, seenLower);
      const nameBuf = Buffer.from(name, "utf8");
      const isDiskEntry = item.data === undefined && typeof item.filePath === "string" && item.filePath;

      if (isDiskEntry) {
        let fallbackStat = null;
        if (!item.mtime && !mtime) {
          fallbackStat = await fs.promises.stat(item.filePath);
        }
        const entryMtime = item.mtime || mtime || (fallbackStat && fallbackStat.mtime) || new Date();
        const { dosTime, dosDate } = toDosTimeDate(entryMtime);
        const allowDeflate = !shouldStoreUncompressed(name);
        const snapSize = typeof item.size === "number" && Number.isFinite(item.size) && item.size >= 0 ? item.size : undefined;
        const payload = await prepareDiskEntryPayload(item.filePath, allowDeflate, `${spillBase}.${i}`, snapSize);

        try {
          assertZip32EntryLimits(entryCount, offset, payload.compSize, payload.uncompSize, nameBuf.length);

          const localHeader = buildLocalHeader(
            nameBuf.length,
            payload.method,
            dosTime,
            dosDate,
            payload.crc,
            payload.compSize,
            payload.uncompSize
          );
          await writer.writeChunk(localHeader);
          await writer.writeChunk(nameBuf);

          if (payload.chunks) {
            for (const c of payload.chunks) {
              await writer.writeChunk(c);
            }
            payload.chunks = null;
          } else if (payload.spillFile) {
            await pipeFileToWriter(payload.spillFile, writer, payload.compSize);
          } else if (payload.compSize > 0) {
            await pipeFileToWriter(item.filePath, writer, payload.compSize);
          }

          const centralHeader = buildCentralHeader(
            nameBuf.length,
            payload.method,
            dosTime,
            dosDate,
            payload.crc,
            payload.compSize,
            payload.uncompSize,
            offset
          );
          centralChunks.push(centralHeader, nameBuf);
          centralDirSize += 46 + nameBuf.length;
          offset += 30 + nameBuf.length + payload.compSize;
          entryCount++;
        } finally {
          if (payload.spillFile) {
            await fs.promises.unlink(payload.spillFile).catch(() => {});
          }
        }
      } else {
        const entryMtime = item.mtime || mtime || new Date();
        const { dosTime, dosDate } = toDosTimeDate(entryMtime);
        let rawBuf = toRawBuffer(item.data);
        const uncompSize = rawBuf.length;
        const crc = crc32(rawBuf);
        let method = 0;
        let payloadBuf = rawBuf;

        if (uncompSize > 0 && !shouldStoreUncompressed(name)) {
          const deflated = await deflateRawAsync(rawBuf);
          if (deflated.length < uncompSize) {
            method = 8;
            payloadBuf = deflated;
          }
        }

        const compSize = payloadBuf.length;
        assertZip32EntryLimits(entryCount, offset, compSize, uncompSize, nameBuf.length);

        const localHeader = buildLocalHeader(
          nameBuf.length,
          method,
          dosTime,
          dosDate,
          crc,
          compSize,
          uncompSize
        );
        await writer.writeChunk(localHeader);
        await writer.writeChunk(nameBuf);
        if (compSize > 0) {
          await writer.writeChunk(payloadBuf);
        }
        rawBuf = null;
        payloadBuf = null;

        const centralHeader = buildCentralHeader(
          nameBuf.length,
          method,
          dosTime,
          dosDate,
          crc,
          compSize,
          uncompSize,
          offset
        );
        centralChunks.push(centralHeader, nameBuf);
        centralDirSize += 46 + nameBuf.length;
        offset += 30 + nameBuf.length + compSize;
        entryCount++;
      }
    }

    assertZip32ArchiveLimits(entryCount, centralDirSize, offset);

    for (const c of centralChunks) {
      await writer.writeChunk(c);
    }
    const eocd = buildEocd(entryCount, centralDirSize, offset);
    await writer.writeChunk(eocd);
    await writer.endAndClose();

    return offset + centralDirSize + 22;
  } catch (err) {
    await writer.destroyAndWait().catch(() => {});
    await fs.promises.unlink(outPath).catch(() => {});
    throw err;
  }
}

function normalizePromptCompare(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 120);
}

function normalizeLocale(locale) {
  return String(locale || "ru").trim().toLowerCase().startsWith("en") ? "en" : "ru";
}

function extractMediaInfo(item) {
  if (!item) return { raw: "", basename: "" };
  if (typeof item === "string") {
    const norm = item.trim().replace(/\\/g, "/");
    return { raw: norm, basename: norm ? path.posix.basename(norm) : "" };
  }
  const raw = String(item.uri || item.path || item.name || item.fileName || "").trim();
  const norm = raw.replace(/\\/g, "/");
  return { raw: norm, basename: norm ? path.posix.basename(norm) : "" };
}

function buildLookupMap(src) {
  const exact = new Map();
  const lower = new Map();
  if (!src) return { exact, lower };
  const entries = src instanceof Map ? src.entries() : Object.entries(src);
  for (const [k, v] of entries) {
    if (!k || !v) continue;
    const key = String(k).replace(/\\/g, "/");
    const val = String(v).replace(/\\/g, "/");
    if (!exact.has(key)) exact.set(key, val);
    const lk = key.toLowerCase();
    if (!lower.has(lk)) lower.set(lk, val);
  }
  return { exact, lower };
}

function resolveFromLookup(key, lookup) {
  if (!key) return "";
  if (lookup.exact.has(key)) return lookup.exact.get(key);
  const lk = key.toLowerCase();
  if (lookup.lower.has(lk)) return lookup.lower.get(lk);
  return "";
}

function resolveMediaPath(info, attachLookup, artifactLookup, allowArtifactLookup) {
  const rawLower = info.raw.toLowerCase();
  const uploadMarker = "/.user_uploaded/";
  const markerIdx = rawLower.indexOf(uploadMarker);
  let uploadRel = "";
  if (markerIdx !== -1) {
    uploadRel = info.raw.slice(markerIdx + uploadMarker.length).replace(/^\/+/, "");
  } else if (rawLower.startsWith(".user_uploaded/")) {
    uploadRel = info.raw.slice(".user_uploaded/".length).replace(/^\/+/, "");
  }
  if (uploadRel) {
    const byRel = resolveFromLookup(uploadRel, attachLookup);
    if (byRel) return byRel;
  }

  const byAttachBase = resolveFromLookup(info.basename, attachLookup);
  if (byAttachBase) return byAttachBase;

  if (allowArtifactLookup && artifactLookup) {
    const byArtifactBase = resolveFromLookup(info.basename, artifactLookup);
    if (byArtifactBase) return byArtifactBase;
  }

  return `attachments/${info.basename}`;
}

function formatMarkdownLink(label, targetPath) {
  const safeLabel = String(label || "file").replace(/[\[\]]/g, "\\$&");
  const safeTarget = /[\s()<>]/.test(targetPath) ? `<${targetPath}>` : targetPath;
  return `[${safeLabel}](${safeTarget})`;
}

function createTranscriptFormatterState(opts = {}) {
  const isEn = normalizeLocale(opts.locale) === "en";
  const title = opts.title ? String(opts.title).trim() : "";
  const blocks = [];
  const counts = { messages: 0, userMessages: 0, agentResponses: 0 };

  blocks.push(`# ${title || (isEn ? "Rudex Studio Chat Export" : "Rudex Studio — Экспорт чата")}`);
  blocks.push("");
  if (opts.chatKey) blocks.push(`- **Chat Key:** \`${opts.chatKey}\``);
  if (opts.modelName) blocks.push(`- **Model:** ${opts.modelName}`);
  blocks.push(`- **Exported At:** ${new Date().toISOString()}`);
  blocks.push("");
  blocks.push("---");
  blocks.push("");

  return {
    blocks,
    counts,
    isEn,
    includeThinking: Boolean(opts.includeThinking),
    attachLookup: buildLookupMap(opts.attachmentMap),
    artifactLookup: buildLookupMap(opts.artifactMap),
  };
}

function processTranscriptLine(line, state) {
  const trimmed = line.trim();
  if (!trimmed) return;
  let obj;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    return;
  }
  if (!obj || typeof obj !== "object") return;

  const { blocks, counts, isEn, includeThinking, attachLookup, artifactLookup } = state;
  const ts = obj.created_at ? ` _(${obj.created_at})_` : "";
  const mediaInfos = Array.isArray(obj.media)
    ? obj.media.map(extractMediaInfo).filter((m) => Boolean(m.basename))
    : [];

  if (obj.type === "USER_INPUT") {
    counts.userMessages++;
    counts.messages++;
    blocks.push(`## ${isEn ? "User" : "Пользователь"}${ts}`);
    blocks.push("");
    if (obj.content) blocks.push(String(obj.content).trim());
    if (mediaInfos.length > 0) {
      blocks.push("");
      const links = mediaInfos.map((m) =>
        formatMarkdownLink(m.basename, resolveMediaPath(m, attachLookup, null, false))
      );
      blocks.push(`${isEn ? "Attachments" : "Вложения"}: ` + links.join(", "));
    }
    blocks.push("");
    blocks.push("---");
    blocks.push("");
  } else if (obj.type === "PLANNER_RESPONSE") {
    const content = typeof obj.content === "string" ? obj.content.trim() : "";
    const toolCalls = Array.isArray(obj.tool_calls) ? obj.tool_calls : [];
    const thinking = typeof obj.thinking === "string" ? obj.thinking.trim() : "";
    if (!content && toolCalls.length === 0 && (!includeThinking || !thinking) && mediaInfos.length === 0) {
      return;
    }

    counts.agentResponses++;
    counts.messages++;
    blocks.push(`## ${isEn ? "Agent" : "Агент"}${ts}`);
    blocks.push("");
    if (includeThinking && thinking) {
      blocks.push(`<details><summary>${isEn ? "Thinking" : "Размышления"}</summary>`);
      blocks.push("");
      blocks.push(thinking);
      blocks.push("");
      blocks.push("</details>");
      blocks.push("");
    }
    if (content) {
      blocks.push(content);
      blocks.push("");
    }
    if (toolCalls.length > 0) {
      const names = toolCalls
        .map((tc) => (tc && (tc.name || (tc.function && tc.function.name))) || "tool")
        .slice(0, 24);
      blocks.push(
        `> ${isEn ? "Tool calls" : "Вызовы инструментов"} (${toolCalls.length}): ${names.map((n) => `\`${n}\``).join(", ")}`
      );
      blocks.push("");
    }
    if (mediaInfos.length > 0) {
      const links = mediaInfos.map((m) =>
        formatMarkdownLink(m.basename, resolveMediaPath(m, attachLookup, artifactLookup, true))
      );
      blocks.push(`${isEn ? "Media" : "Медиа"}: ` + links.join(", "));
      blocks.push("");
    }
    blocks.push("---");
    blocks.push("");
  } else if (obj.type === "ERROR_MESSAGE") {
    const content = typeof obj.content === "string" ? obj.content.trim() : "";
    if (!content) return;
    counts.messages++;
    blocks.push(`## ${isEn ? "System Error" : "Ошибка системы"}${ts}`);
    blocks.push("");
    blocks.push(content);
    blocks.push("");
    blocks.push("---");
    blocks.push("");
  }
}

function formatTranscriptToMarkdown(jsonlText, opts = {}) {
  const state = createTranscriptFormatterState(opts);
  const lines = String(jsonlText || "").split(/\r?\n/);
  for (const line of lines) {
    processTranscriptLine(line, state);
  }
  return { markdown: state.blocks.join("\n"), counts: state.counts };
}

async function streamTranscriptToMarkdown(filePath, opts = {}) {
  const state = createTranscriptFormatterState(opts);
  const rs = fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: STREAM_HIGH_WATER_MARK });
  let carry = "";
  try {
    for await (const chunk of rs) {
      const text = carry + chunk;
      const lines = text.split(/\r?\n/);
      carry = lines.pop() ?? "";
      for (const line of lines) {
        processTranscriptLine(line, state);
      }
    }
    if (carry) {
      processTranscriptLine(carry, state);
    }
  } finally {
    rs.destroy();
  }
  return { markdown: state.blocks.join("\n"), counts: state.counts };
}

function formatDomMessagesToMarkdown(domMessages, opts = {}) {
  const isEn = normalizeLocale(opts.locale) === "en";
  const list = Array.isArray(domMessages) ? domMessages : [];
  const blocks = [];
  const counts = { messages: 0, userMessages: 0, agentResponses: 0 };
  const title = opts.title ? String(opts.title).trim() : "";

  blocks.push(`# ${title || (isEn ? "Rudex Studio Chat Export (DOM Snapshot)" : "Rudex Studio — Экспорт чата (DOM-снимок)")}`);
  blocks.push("");
  if (opts.chatKey) blocks.push(`- **Chat Key:** \`${opts.chatKey}\``);
  if (opts.modelName) blocks.push(`- **Model:** ${opts.modelName}`);
  blocks.push(`- **Exported At:** ${new Date().toISOString()}`);
  blocks.push("");
  blocks.push("---");
  blocks.push("");

  for (const msg of list) {
    if (!msg || typeof msg !== "object") continue;
    const text = typeof msg.text === "string" ? msg.text.trim() : "";
    if (!text) continue;
    const isUser = msg.role === "user";
    if (isUser) counts.userMessages++;
    else counts.agentResponses++;
    counts.messages++;
    blocks.push(isUser ? (isEn ? "## User" : "## Пользователь") : (isEn ? "## Agent" : "## Агент"));
    blocks.push("");
    blocks.push(text);
    blocks.push("");
    blocks.push("---");
    blocks.push("");
  }

  return { markdown: blocks.join("\n"), counts };
}

function extractFirstUserInputFromLogSlice(transcriptPath) {
  if (!fs.existsSync(transcriptPath)) return "";
  try {
    const fd = fs.openSync(transcriptPath, "r");
    try {
      const buf = Buffer.alloc(LOG_SLICE_BYTES);
      const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
      if (bytesRead <= 0) return "";
      const chunk = buf.slice(0, bytesRead).toString("utf8");
      const lines = chunk.split(/\r?\n/);
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        try {
          const obj = JSON.parse(t);
          if (obj && obj.type === "USER_INPUT" && typeof obj.content === "string") {
            return normalizePromptCompare(obj.content);
          }
        } catch {
          // ignore partial trailing line
        }
      }
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return "";
  }
  return "";
}

function findBrainDirForChat({ brainBaseDir, chatKey, domMessages }) {
  if (!brainBaseDir || !fs.existsSync(brainBaseDir)) return null;
  const keyStr = typeof chatKey === "string" ? chatKey.trim() : "";

  if (UUID_RE.test(keyStr)) {
    const direct = path.join(brainBaseDir, keyStr);
    try {
      if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) {
        return { brainDir: direct, brainUuid: keyStr };
      }
    } catch {}
  }

  const msgs = Array.isArray(domMessages) ? domMessages : [];
  const firstUser = msgs.find((m) => m && m.role === "user" && typeof m.text === "string" && m.text.trim());
  const firstNorm = firstUser ? normalizePromptCompare(firstUser.text) : "";
  if (!firstNorm || firstNorm.length < 2) return null;

  let candidates = [];
  try {
    for (const ent of fs.readdirSync(brainBaseDir, { withFileTypes: true })) {
      if (!ent.isDirectory() || !UUID_RE.test(ent.name)) continue;
      const full = path.join(brainBaseDir, ent.name);
      const tPath = path.join(full, ".system_generated", "logs", "transcript.jsonl");
      if (!fs.existsSync(tPath)) continue;
      try {
        const st = fs.statSync(tPath);
        candidates.push({ uuid: ent.name, dir: full, tPath, mtimeMs: st.mtimeMs || 0 });
      } catch {}
    }
  } catch {
    return null;
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  candidates = candidates.slice(0, MAX_BRAIN_CANDIDATES);

  let prefixMatch = null;
  for (const cand of candidates) {
    const logFirst = extractFirstUserInputFromLogSlice(cand.tPath);
    if (!logFirst) continue;
    if (logFirst === firstNorm) {
      return { brainDir: cand.dir, brainUuid: cand.uuid };
    }
    if (
      !prefixMatch &&
      firstNorm.length >= 24 &&
      logFirst.length >= 24 &&
      (logFirst.startsWith(firstNorm.slice(0, 48)) || firstNorm.startsWith(logFirst.slice(0, 48)))
    ) {
      prefixMatch = { brainDir: cand.dir, brainUuid: cand.uuid };
    }
  }
  return prefixMatch;
}

async function collectFilesSafe(dirPath, relPrefix, outList, stats, skipTopDirs, skippedFiles, zipPrefix, resolvedOutPath) {
  let dirExists = false;
  try {
    const dirStat = await fs.promises.stat(dirPath);
    dirExists = dirStat.isDirectory();
  } catch {
    return;
  }
  if (!dirExists) return;

  let ents;
  try {
    ents = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (err) {
    skippedFiles.push({
      path: relPrefix ? `${zipPrefix}/${relPrefix}` : zipPrefix,
      reason: "dir_unreadable",
      error: err && err.message ? err.message : String(err),
    });
    return;
  }

  for (const ent of ents) {
    if (skipTopDirs && skipTopDirs.has(ent.name)) continue;
    if (ent.name === ".git" || ent.name === "node_modules") continue;
    const full = path.join(dirPath, ent.name);
    const rel = relPrefix ? `${relPrefix}/${ent.name}` : ent.name;

    if (ent.isDirectory()) {
      await collectFilesSafe(full, rel, outList, stats, null, skippedFiles, zipPrefix, resolvedOutPath);
    } else if (ent.isFile()) {
      if (resolvedOutPath) {
        const candPath = path.resolve(full);
        const sameOut = process.platform === "win32"
          ? candPath.toLowerCase() === resolvedOutPath.toLowerCase()
          : candPath === resolvedOutPath;
        if (sameOut) continue;
      }
      const zipRelPath = `${zipPrefix}/${rel}`;
      try {
        const st = await fs.promises.stat(full);
        if (st.size > MAX_SINGLE_FILE_BYTES) {
          skippedFiles.push({
            path: zipRelPath,
            size: st.size,
            reason: "exceeds_single_file_limit",
            limit: MAX_SINGLE_FILE_BYTES,
          });
          continue;
        }
        if (stats.totalBytes + st.size > MAX_TOTAL_ARTIFACTS_BYTES) {
          skippedFiles.push({
            path: zipRelPath,
            size: st.size,
            reason: "exceeds_total_archive_limit",
            limit: MAX_TOTAL_ARTIFACTS_BYTES,
          });
          continue;
        }
        const fh = await fs.promises.open(full, "r");
        await fh.close();

        stats.totalBytes += st.size;
        outList.push({ full, rel, size: st.size, mtime: st.mtime });
      } catch (err) {
        skippedFiles.push({
          path: zipRelPath,
          reason: "unreadable",
          error: err && err.message ? err.message : String(err),
        });
      }
    }
  }
}

function registerMediaPaths(fileList, zipPrefix, mapObj) {
  for (const f of fileList) {
    const relNorm = f.rel.replace(/\\/g, "/");
    const zipPath = `${zipPrefix}/${relNorm}`;
    if (!mapObj.has(relNorm)) mapObj.set(relNorm, zipPath);
    const base = path.posix.basename(relNorm);
    if (base && !mapObj.has(base)) mapObj.set(base, zipPath);
  }
}

async function buildChatExportArchive(options = {}) {
  const {
    chatKey = "",
    title = "",
    brainBaseDir = "",
    chatRecord = null,
    quotaSummary = null,
    domMessages = [],
    includeAttachments = true,
    includeArtifacts = true,
    includePersona = true,
    includeFullLog = false,
    includeThinking = false,
    locale = "ru",
    pluginVersion = "5.0.2",
    outPath = "",
  } = options;

  if (!outPath) {
    throw new Error("outPath is required for buildChatExportArchive");
  }

  const normLocale = normalizeLocale(locale);
  const isEn = normLocale === "en";
  const resolvedOutPath = path.resolve(outPath);

  const found = findBrainDirForChat({ brainBaseDir, chatKey, domMessages });
  const brainDir = found ? found.brainDir : null;
  const brainUuid = found ? found.brainUuid : null;

  const entries = [];
  const skippedFiles = [];
  const counts = {
    messages: 0,
    userMessages: 0,
    agentResponses: 0,
    attachments: 0,
    artifacts: 0,
  };

  const rec = chatRecord && typeof chatRecord === "object" ? chatRecord : {};
  const modelName =
    (rec.telemetry && rec.telemetry.modelName) ||
    (typeof options.modelName === "string" ? options.modelName : "") ||
    "";
  const resolvedTitle = title || rec.title || "";
  const resolvedChatKey = chatKey || brainUuid || "";

  const mediaStats = { totalBytes: 0 };
  const attachFiles = [];
  const artifactFiles = [];
  const attachmentMap = new Map();
  const artifactMap = new Map();

  if (brainDir && includeAttachments) {
    const uploadDir = path.join(brainDir, ".user_uploaded");
    await collectFilesSafe(uploadDir, "", attachFiles, mediaStats, null, skippedFiles, "attachments", resolvedOutPath);
    registerMediaPaths(attachFiles, "attachments", attachmentMap);
  }

  if (brainDir && includeArtifacts) {
    const skipTop = new Set([".system_generated", ".user_uploaded", "browser_sandbox"]);
    await collectFilesSafe(brainDir, "", artifactFiles, mediaStats, skipTop, skippedFiles, "artifacts", resolvedOutPath);
    registerMediaPaths(artifactFiles, "artifacts", artifactMap);
  }

  let convResult = null;
  let transcriptSource = "dom";
  let transcriptMtime = null;
  const logEntries = [];

  if (brainDir) {
    const tPath = path.join(brainDir, ".system_generated", "logs", "transcript.jsonl");
    try {
      const tStat = await fs.promises.stat(tPath);
      if (tStat.isFile()) {
        if (tStat.size > MAX_FULL_LOG_BYTES) {
          skippedFiles.push({
            path: "logs/transcript.jsonl",
            size: tStat.size,
            reason: "exceeds_log_limit",
            limit: MAX_FULL_LOG_BYTES,
          });
        } else {
          const fh = await fs.promises.open(tPath, "r");
          await fh.close();
          transcriptMtime = tStat.mtime;

          const mdOpts = {
            title: resolvedTitle,
            chatKey: resolvedChatKey,
            modelName,
            includeThinking: Boolean(includeThinking),
            locale: normLocale,
            attachmentMap,
            artifactMap,
          };

          if (tStat.size <= INLINE_TRANSCRIPT_READ_BYTES) {
            const tBuf = await fs.promises.readFile(tPath);
            convResult = formatTranscriptToMarkdown(tBuf.toString("utf8"), mdOpts);
            transcriptSource = "disk";
            logEntries.push({
              name: "logs/transcript.jsonl",
              data: tBuf,
              mtime: tStat.mtime,
            });
          } else {
            convResult = await streamTranscriptToMarkdown(tPath, mdOpts);
            transcriptSource = "disk";
            logEntries.push({
              name: "logs/transcript.jsonl",
              filePath: tPath,
              size: tStat.size,
              mtime: tStat.mtime,
            });
          }
        }
      }
    } catch (err) {
      if (!err || err.code !== "ENOENT") {
        skippedFiles.push({
          path: "logs/transcript.jsonl",
          reason: "unreadable",
          error: err && err.message ? err.message : String(err),
        });
      }
    }

    if (includeFullLog) {
      const tfPath = path.join(brainDir, ".system_generated", "logs", "transcript_full.jsonl");
      try {
        const tfStat = await fs.promises.stat(tfPath);
        if (tfStat.isFile()) {
          if (tfStat.size > MAX_FULL_LOG_BYTES) {
            skippedFiles.push({
              path: "logs/transcript_full.jsonl",
              size: tfStat.size,
              reason: "exceeds_log_limit",
              limit: MAX_FULL_LOG_BYTES,
            });
          } else {
            const fh = await fs.promises.open(tfPath, "r");
            await fh.close();
            logEntries.push({
              name: "logs/transcript_full.jsonl",
              filePath: tfPath,
              size: tfStat.size,
              mtime: tfStat.mtime,
            });
          }
        }
      } catch (err) {
        if (!err || err.code !== "ENOENT") {
          skippedFiles.push({
            path: "logs/transcript_full.jsonl",
            reason: "unreadable",
            error: err && err.message ? err.message : String(err),
          });
        }
      }
    }
  }

  if (!convResult) {
    convResult = formatDomMessagesToMarkdown(domMessages, {
      title: resolvedTitle,
      chatKey: chatKey || "",
      modelName,
      locale: normLocale,
    });
  }

  counts.messages = convResult.counts.messages;
  counts.userMessages = convResult.counts.userMessages;
  counts.agentResponses = convResult.counts.agentResponses;

  const exportTime = new Date();
  entries.push({
    name: "conversation.md",
    data: convResult.markdown,
    mtime: transcriptMtime || exportTime,
  });

  for (const le of logEntries) {
    entries.push(le);
  }

  for (const f of attachFiles) {
    entries.push({
      name: `attachments/${f.rel}`,
      filePath: f.full,
      size: f.size,
      mtime: f.mtime,
    });
    counts.attachments++;
  }

  for (const f of artifactFiles) {
    entries.push({
      name: `artifacts/${f.rel}`,
      filePath: f.full,
      size: f.size,
      mtime: f.mtime,
    });
    counts.artifacts++;
  }

  const personaText = typeof rec.personaText === "string" ? rec.personaText.trim() : "";
  if (includePersona && personaText) {
    const personaMd = isEn
      ? [
          "# Agent Persona (Rudex Studio)",
          "",
          `- **Active:** ${rec.personaEnabled ? "Yes" : "No (saved in chat draft)"}`,
          `- **Preset:** ${rec.personaActivePreset || "custom"}`,
          "",
          "## Instruction",
          "",
          personaText,
          "",
        ].join("\n")
      : [
          "# Характер агента (Rudex Studio)",
          "",
          `- **Активен:** ${rec.personaEnabled ? "Да" : "Нет (сохранён в черновике чата)"}`,
          `- **Пресет:** ${rec.personaActivePreset || "custom"}`,
          "",
          "## Инструкция",
          "",
          personaText,
          "",
        ].join("\n");
    entries.push({ name: "persona/character-prompt.md", data: personaMd, mtime: exportTime });
  }

  const telemetryDump = {
    chatKey: resolvedChatKey,
    title: resolvedTitle,
    telemetry: rec.telemetry || null,
    quota: rec.quota || null,
    globalQuotaSummary: quotaSummary || null,
  };
  entries.push({
    name: "studio/telemetry-and-limits.json",
    data: JSON.stringify(telemetryDump, null, 2) + "\n",
    mtime: exportTime,
  });

  const manifest = {
    exportedAt: exportTime.toISOString(),
    pluginVersion,
    chatKey: resolvedChatKey,
    brainUuid: brainUuid || null,
    title: resolvedTitle,
    modelName,
    locale: normLocale,
    source: transcriptSource,
    counts,
    skippedFiles,
    personaEnabled: Boolean(rec.personaEnabled),
    telemetrySummary: rec.telemetry
      ? {
          lastAvgTps: rec.telemetry.lastAvgTps || 0,
          peakTps: rec.telemetry.peakTps || 0,
          chatTokens: rec.telemetry.chatTokens || 0,
        }
      : null,
  };
  entries.unshift({
    name: "manifest.json",
    data: JSON.stringify(manifest, null, 2) + "\n",
    mtime: exportTime,
  });

  const readmeTxt = [
    "Rudex Studio - Full Chat Context Export",
    "=======================================",
    `Plugin Version: ${pluginVersion}`,
    `Chat Title: ${manifest.title || "(untitled)"}`,
    `Chat Key: ${manifest.chatKey || "(unknown)"}`,
    `Transcript Source: ${transcriptSource}`,
    `Messages: ${counts.messages} (User: ${counts.userMessages}, Agent: ${counts.agentResponses})`,
    `Attachments: ${counts.attachments}`,
    `Artifacts: ${counts.artifacts}`,
    `Skipped Files: ${skippedFiles.length}`,
    `Exported At: ${manifest.exportedAt}`,
    "",
    "Contents:",
    "- manifest.json                     Export metadata, counts, and skipped files",
    "- conversation.md                   Formatted Markdown conversation log",
    "- logs/transcript*.jsonl            Raw Antigravity JSONL logs (when available on disk)",
    "- attachments/                      Uploaded photos and files (.user_uploaded)",
    "- artifacts/                        Workspace artifacts & scratch files",
    "- persona/character-prompt.md       Chat persona instruction (when present)",
    "- studio/telemetry-and-limits.json  TPS telemetry & 5h/weekly quota usage",
    "",
  ].join("\r\n");
  entries.unshift({ name: "README-EXPORT.txt", data: readmeTxt, mtime: exportTime });

  const sizeBytes = await writeZipFile(outPath, entries, exportTime);
  return {
    ok: true,
    zipPath: outPath,
    fileName: path.basename(outPath),
    sizeBytes,
    brainFound: Boolean(brainDir),
    brainUuid: brainUuid || "",
    source: transcriptSource,
    counts,
    skippedFiles,
  };
}

module.exports = {
  crc32,
  createZipBuffer,
  writeZipFile,
  formatTranscriptToMarkdown,
  formatDomMessagesToMarkdown,
  findBrainDirForChat,
  buildChatExportArchive,
};
