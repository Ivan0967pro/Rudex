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

function crc32(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf || ""), "utf8");
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) {
    c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
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
  const replaced = String(rawName || "").replace(/\\/g, "/");
  const parts = replaced.split("/").filter((seg) => seg && seg !== "." && seg !== "..");
  return parts.join("/");
}

function makeUniqueEntryName(rawName, seenSet) {
  const clean = normalizeZipEntryName(rawName) || "file.bin";
  if (!seenSet.has(clean)) {
    seenSet.add(clean);
    return clean;
  }
  const dotIdx = clean.lastIndexOf(".");
  const slashIdx = clean.lastIndexOf("/");
  const hasExt = dotIdx > slashIdx && dotIdx > 0;
  const base = hasExt ? clean.slice(0, dotIdx) : clean;
  const ext = hasExt ? clean.slice(dotIdx) : "";
  let n = 2;
  while (seenSet.has(`${base} (${n})${ext}`)) {
    n++;
  }
  const finalName = `${base} (${n})${ext}`;
  seenSet.add(finalName);
  return finalName;
}

function shouldStoreUncompressed(entryName) {
  const dot = entryName.lastIndexOf(".");
  if (dot === -1) return false;
  return STORE_EXTENSIONS.has(entryName.slice(dot).toLowerCase());
}

function createZipBuffer(entries, mtime) {
  const list = Array.isArray(entries) ? entries : [];
  const { dosTime, dosDate } = toDosTimeDate(mtime);
  const seenNames = new Set();
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const item of list) {
    if (!item) continue;
    const name = makeUniqueEntryName(item.name, seenNames);
    const nameBuf = Buffer.from(name, "utf8");
    const rawBuf = Buffer.isBuffer(item.data)
      ? item.data
      : Buffer.from(typeof item.data === "string" ? item.data : String(item.data ?? ""), "utf8");

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

    const flags = 0x0800; // UTF-8 filename encoding
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(flags, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payloadBuf.length, 18);
    localHeader.writeUInt32LE(rawBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localChunks.push(localHeader, nameBuf, payloadBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(0x0314, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(flags, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payloadBuf.length, 20);
    centralHeader.writeUInt32LE(rawBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralChunks.push(centralHeader, nameBuf);
    offset += 30 + nameBuf.length + payloadBuf.length;
  }

  const centralDirBuf = Buffer.concat(centralChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(seenNames.size, 8);
  eocd.writeUInt16LE(seenNames.size, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, centralDirBuf, eocd]);
}

function writeZipFile(outPath, entries, mtime) {
  const buf = createZipBuffer(entries, mtime);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

function normalizePromptCompare(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 120);
}

function extractMediaPathLabel(item) {
  if (!item) return "";
  if (typeof item === "string") return path.basename(item);
  const raw = item.uri || item.path || item.name || item.fileName || "";
  return raw ? path.basename(String(raw)) : "";
}

function formatTranscriptToMarkdown(jsonlText, opts = {}) {
  const lines = String(jsonlText || "").split(/\r?\n/);
  const blocks = [];
  const counts = { messages: 0, userMessages: 0, agentResponses: 0 };
  const title = opts.title ? String(opts.title).trim() : "";

  blocks.push(`# ${title || "Antigravity Chat Export"}`);
  blocks.push("");
  if (opts.chatKey) blocks.push(`- **Chat Key:** \`${opts.chatKey}\``);
  if (opts.modelName) blocks.push(`- **Model:** ${opts.modelName}`);
  blocks.push(`- **Exported At:** ${new Date().toISOString()}`);
  blocks.push("");
  blocks.push("---");
  blocks.push("");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (!obj || typeof obj !== "object") continue;

    const ts = obj.created_at ? ` _(${obj.created_at})_` : "";
    const mediaList = Array.isArray(obj.media) ? obj.media.map(extractMediaPathLabel).filter(Boolean) : [];

    if (obj.type === "USER_INPUT") {
      counts.userMessages++;
      counts.messages++;
      blocks.push(`## Пользователь${ts}`);
      blocks.push("");
      if (obj.content) blocks.push(String(obj.content).trim());
      if (mediaList.length > 0) {
        blocks.push("");
        blocks.push("Вложения: " + mediaList.map((m) => `\`attachments/${m}\``).join(", "));
      }
      blocks.push("");
      blocks.push("---");
      blocks.push("");
    } else if (obj.type === "PLANNER_RESPONSE") {
      const content = typeof obj.content === "string" ? obj.content.trim() : "";
      const toolCalls = Array.isArray(obj.tool_calls) ? obj.tool_calls : [];
      const thinking = typeof obj.thinking === "string" ? obj.thinking.trim() : "";
      if (!content && toolCalls.length === 0 && !thinking) continue;

      counts.agentResponses++;
      counts.messages++;
      blocks.push(`## Агент${ts}`);
      blocks.push("");
      if (opts.includeThinking && thinking) {
        blocks.push("<details><summary>Thinking</summary>");
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
        blocks.push(`> Вызовы инструментов (${toolCalls.length}): ${names.map((n) => `\`${n}\``).join(", ")}`);
        blocks.push("");
      }
      if (mediaList.length > 0) {
        blocks.push("Медиа: " + mediaList.map((m) => `\`${m}\``).join(", "));
        blocks.push("");
      }
      blocks.push("---");
      blocks.push("");
    } else if (obj.type === "ERROR_MESSAGE") {
      const content = typeof obj.content === "string" ? obj.content.trim() : "";
      if (!content) continue;
      counts.messages++;
      blocks.push(`## Ошибка системы${ts}`);
      blocks.push("");
      blocks.push(content);
      blocks.push("");
      blocks.push("---");
      blocks.push("");
    }
  }

  return { markdown: blocks.join("\n"), counts };
}

function formatDomMessagesToMarkdown(domMessages, opts = {}) {
  const list = Array.isArray(domMessages) ? domMessages : [];
  const blocks = [];
  const counts = { messages: 0, userMessages: 0, agentResponses: 0 };
  const title = opts.title ? String(opts.title).trim() : "";

  blocks.push(`# ${title || "Antigravity Chat Export (DOM Snapshot)"}`);
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
    blocks.push(isUser ? "## Пользователь" : "## Агент");
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
      const buf = Buffer.alloc(32 * 1024);
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
    if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) {
      return { brainDir: direct, brainUuid: keyStr };
    }
  }

  const msgs = Array.isArray(domMessages) ? domMessages : [];
  const firstUser = msgs.find((m) => m && m.role === "user" && typeof m.text === "string" && m.text.trim());
  const firstNorm = firstUser ? normalizePromptCompare(firstUser.text) : "";
  if (!firstNorm || firstNorm.length < 8) return null;

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
  candidates = candidates.slice(0, 25);

  for (const cand of candidates) {
    const logFirst = extractFirstUserInputFromLogSlice(cand.tPath);
    if (!logFirst) continue;
    if (
      logFirst === firstNorm ||
      logFirst.startsWith(firstNorm.slice(0, 48)) ||
      firstNorm.startsWith(logFirst.slice(0, 48))
    ) {
      return { brainDir: cand.dir, brainUuid: cand.uuid };
    }
  }
  return null;
}

function collectFilesRecursive(dirPath, relPrefix, outList, stats, skipTopDirs) {
  if (!fs.existsSync(dirPath)) return;
  let ents;
  try {
    ents = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of ents) {
    if (skipTopDirs && skipTopDirs.has(ent.name)) continue;
    if (ent.name === ".git" || ent.name === "node_modules") continue;
    const full = path.join(dirPath, ent.name);
    const rel = relPrefix ? `${relPrefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      collectFilesRecursive(full, rel, outList, stats, null);
    } else if (ent.isFile()) {
      try {
        const st = fs.statSync(full);
        if (st.size > MAX_SINGLE_FILE_BYTES) continue;
        if (stats.totalBytes + st.size > MAX_TOTAL_ARTIFACTS_BYTES) continue;
        stats.totalBytes += st.size;
        outList.push({ full, rel, size: st.size });
      } catch {}
    }
  }
}

function buildChatExportArchive(options = {}) {
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
    pluginVersion = "3.0.0",
    outPath = "",
  } = options;

  if (!outPath) {
    throw new Error("outPath is required for buildChatExportArchive");
  }

  const found = findBrainDirForChat({ brainBaseDir, chatKey, domMessages });
  const brainDir = found ? found.brainDir : null;
  const brainUuid = found ? found.brainUuid : null;

  const entries = [];
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

  let convResult = null;
  let transcriptSource = "dom";

  if (brainDir) {
    const tPath = path.join(brainDir, ".system_generated", "logs", "transcript.jsonl");
    if (fs.existsSync(tPath)) {
      const tStat = fs.statSync(tPath);
      if (tStat.size <= MAX_FULL_LOG_BYTES) {
        const tRaw = fs.readFileSync(tPath, "utf8");
        convResult = formatTranscriptToMarkdown(tRaw, {
          title: title || rec.title || "",
          chatKey: chatKey || brainUuid || "",
          modelName,
        });
        transcriptSource = "disk";
        entries.push({ name: "logs/transcript.jsonl", data: fs.readFileSync(tPath) });
      }
    }
    if (includeFullLog) {
      const tfPath = path.join(brainDir, ".system_generated", "logs", "transcript_full.jsonl");
      if (fs.existsSync(tfPath)) {
        const tfStat = fs.statSync(tfPath);
        if (tfStat.size <= MAX_FULL_LOG_BYTES) {
          entries.push({ name: "logs/transcript_full.jsonl", data: fs.readFileSync(tfPath) });
        }
      }
    }
  }

  if (!convResult) {
    convResult = formatDomMessagesToMarkdown(domMessages, {
      title: title || rec.title || "",
      chatKey: chatKey || "",
      modelName,
    });
  }

  counts.messages = convResult.counts.messages;
  counts.userMessages = convResult.counts.userMessages;
  counts.agentResponses = convResult.counts.agentResponses;
  entries.push({ name: "conversation.md", data: convResult.markdown });

  const mediaStats = { totalBytes: 0 };
  if (brainDir && includeAttachments) {
    const uploadDir = path.join(brainDir, ".user_uploaded");
    const attachFiles = [];
    collectFilesRecursive(uploadDir, "", attachFiles, mediaStats, null);
    for (const f of attachFiles) {
      entries.push({ name: `attachments/${f.rel}`, data: fs.readFileSync(f.full) });
      counts.attachments++;
    }
  }

  if (brainDir && includeArtifacts) {
    const artifactFiles = [];
    const skipTop = new Set([".system_generated", ".user_uploaded", "browser_sandbox"]);
    collectFilesRecursive(brainDir, "", artifactFiles, mediaStats, skipTop);
    for (const f of artifactFiles) {
      entries.push({ name: `artifacts/${f.rel}`, data: fs.readFileSync(f.full) });
      counts.artifacts++;
    }
  }

  const personaText = typeof rec.personaText === "string" ? rec.personaText.trim() : "";
  if (includePersona && personaText) {
    const personaMd = [
      "# Характер агента (Antigravity Studio)",
      "",
      `- **Активен:** ${rec.personaEnabled ? "Да" : "Нет (сохранён в черновике чата)"}`,
      `- **Пресет:** ${rec.personaActivePreset || "custom"}`,
      "",
      "## Инструкция",
      "",
      personaText,
      "",
    ].join("\n");
    entries.push({ name: "persona/character-prompt.md", data: personaMd });
  }

  const telemetryDump = {
    chatKey: chatKey || brainUuid || "",
    title: title || rec.title || "",
    telemetry: rec.telemetry || null,
    quota: rec.quota || null,
    globalQuotaSummary: quotaSummary || null,
  };
  entries.push({
    name: "studio/telemetry-and-limits.json",
    data: JSON.stringify(telemetryDump, null, 2) + "\n",
  });

  const manifest = {
    exportedAt: new Date().toISOString(),
    pluginVersion,
    chatKey: chatKey || brainUuid || "",
    brainUuid: brainUuid || null,
    title: title || rec.title || "",
    modelName,
    source: transcriptSource,
    counts,
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
  });

  const readmeTxt = [
    "Antigravity RU Studio - Full Chat Context Export",
    "================================================",
    `Chat Title: ${manifest.title || "(untitled)"}`,
    `Chat Key: ${manifest.chatKey || "(unknown)"}`,
    `Transcript Source: ${transcriptSource}`,
    `Messages: ${counts.messages} (User: ${counts.userMessages}, Agent: ${counts.agentResponses})`,
    `Attachments: ${counts.attachments}`,
    `Artifacts: ${counts.artifacts}`,
    `Exported At: ${manifest.exportedAt}`,
    "",
    "Contents:",
    "- manifest.json                 Export metadata and counts",
    "- conversation.md               Formatted Markdown conversation log",
    "- logs/transcript*.jsonl        Raw Antigravity JSONL logs (when available on disk)",
    "- attachments/                  Uploaded photos and files (.user_uploaded)",
    "- artifacts/                    Workspace artifacts & scratch files",
    "- persona/character-prompt.md   Chat persona instruction (when present)",
    "- studio/telemetry-and-limits.json  TPS telemetry & 5h/weekly quota usage",
    "",
  ].join("\r\n");
  entries.unshift({ name: "README-EXPORT.txt", data: readmeTxt });

  const sizeBytes = writeZipFile(outPath, entries);
  return {
    ok: true,
    zipPath: outPath,
    fileName: path.basename(outPath),
    sizeBytes,
    brainFound: Boolean(brainDir),
    brainUuid: brainUuid || "",
    source: transcriptSource,
    counts,
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
