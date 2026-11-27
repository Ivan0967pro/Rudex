"use strict";

/**
 * Rudex Local Instant Streaming Voice Engine (Node.js, zero npm dependencies).
 * Manages the official k2-fsa/sherpa-onnx streaming C++ WebSocket server on 127.0.0.1
 * for real-time word-by-word dictation (~100ms live, ~10-50ms post-stop finalization).
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const https = require("https");
const http = require("http");
const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");

const SHERPA_RELEASE_TAG = "v2.0.3";
const SHERPA_RELEASE_BASE = `https://github.com/k2-fsa/sherpa-onnx/releases/download/${SHERPA_RELEASE_TAG}`;
const SHERPA_MODELS_BASE = "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models";

const SHERPA_PLATFORM_BINARIES = {
  "win32-x64": {
    archive: `sherpa-onnx-${SHERPA_RELEASE_TAG}-win-x64-shared-MT-Release-no-tts.tar.bz2`,
    dirName: `sherpa-onnx-${SHERPA_RELEASE_TAG}-win-x64-shared-MT-Release-no-tts`,
    exeRel: path.join("bin", "sherpa-onnx-online-websocket-server.exe"),
    sizeMb: 29.4,
  },
  "darwin-arm64": {
    archive: `sherpa-onnx-${SHERPA_RELEASE_TAG}-osx-universal2-shared-no-tts.tar.bz2`,
    dirName: `sherpa-onnx-${SHERPA_RELEASE_TAG}-osx-universal2-shared-no-tts`,
    exeRel: path.join("bin", "sherpa-onnx-online-websocket-server"),
    sizeMb: 41.4,
  },
  "darwin-x64": {
    archive: `sherpa-onnx-${SHERPA_RELEASE_TAG}-osx-universal2-shared-no-tts.tar.bz2`,
    dirName: `sherpa-onnx-${SHERPA_RELEASE_TAG}-osx-universal2-shared-no-tts`,
    exeRel: path.join("bin", "sherpa-onnx-online-websocket-server"),
    sizeMb: 41.4,
  },
  "linux-x64": {
    archive: `sherpa-onnx-${SHERPA_RELEASE_TAG}-linux-x64-shared-no-tts.tar.bz2`,
    dirName: `sherpa-onnx-${SHERPA_RELEASE_TAG}-linux-x64-shared-no-tts`,
    exeRel: path.join("bin", "sherpa-onnx-online-websocket-server"),
    sizeMb: 26.0,
  },
};

const LOCAL_VOICE_MODELS = {
  "ru-tone": {
    id: "ru-tone",
    kind: "t-one-ctc",
    sampleRate: 8000,
    dirName: "sherpa-onnx-streaming-t-one-russian-2025-09-08",
    archive: "sherpa-onnx-streaming-t-one-russian-2025-09-08.tar.bz2",
    sizeMb: 122.5,
    labelRu: "RU T-one Pro (80Kч, 122 МБ)",
    labelEn: "RU T-one Pro (80Kh, 122 MB)",
    langs: ["ru"],
  },
  "ru-fast": {
    id: "ru-fast",
    kind: "zipformer2",
    sampleRate: 16000,
    dirName: "sherpa-onnx-streaming-zipformer-small-ru-vosk-int8-2025-08-16",
    archive: "sherpa-onnx-streaming-zipformer-small-ru-vosk-int8-2025-08-16.tar.bz2",
    sizeMb: 23.0,
    labelRu: "RU Быстрая (INT8, 23 МБ)",
    labelEn: "RU Fast (INT8, 23 MB)",
    langs: ["ru"],
  },
  "ru-hq": {
    id: "ru-hq",
    kind: "zipformer2",
    sampleRate: 16000,
    dirName: "sherpa-onnx-streaming-zipformer-small-ru-vosk-2025-08-16",
    archive: "sherpa-onnx-streaming-zipformer-small-ru-vosk-2025-08-16.tar.bz2",
    sizeMb: 85.5,
    labelRu: "RU Точная (FP32, 85 МБ)",
    labelEn: "RU Accurate (FP32, 85 MB)",
    langs: ["ru"],
  },
  "multi-ru-en": {
    id: "multi-ru-en",
    kind: "zipformer2",
    sampleRate: 16000,
    dirName: "sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10",
    archive: "sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10.tar.bz2",
    sizeMb: 247.1,
    labelRu: "RU + EN Мульти (247 МБ)",
    labelEn: "RU + EN Multilingual (247 MB)",
    langs: ["ru", "en"],
  },
  "en-fast": {
    id: "en-fast",
    kind: "zipformer2",
    sampleRate: 16000,
    dirName: "sherpa-onnx-streaming-zipformer-en-20M-2023-02-17",
    archive: "sherpa-onnx-streaming-zipformer-en-20M-2023-02-17.tar.bz2",
    sizeMb: 122.0,
    labelRu: "EN Быстрая (122 МБ)",
    labelEn: "EN Fast (122 MB)",
    langs: ["en"],
  },
};

const DEFAULT_RU_HOTWORDS = [
  "антигравити",
  "рудекс",
  "гитхаб",
  "гит",
  "коммит",
  "пуш",
  "репозиторий",
  "перезапустить",
  "голосовой ввод",
  "голосовой режим",
  "диктовка",
  "интерфейс",
  "скилл",
  "плагин",
  "кэш",
  "кэширование",
  "кэширования",
  "токены",
  "токенов",
  "лимиты",
  "агент",
  "субагент",
  "браузер",
  "терминал",
  "скрипт",
  "настройки",
  "тумблер",
  "кнопка",
  "модель",
  "моделей",
  "гемини",
  "клод",
  "код",
  "файл",
  "файлы",
  "файлов",
  "баг",
  "фикс",
  "патч",
  "анимации",
  "точность",
  "моменты",
  "ветка",
  "тесты",
  "сборка",
  "сервер",
];

function getPlatformKey(platform, arch) {
  return `${platform || process.platform}-${arch || process.arch}`;
}

function getPlatformBinarySpec(platform, arch) {
  return SHERPA_PLATFORM_BINARIES[getPlatformKey(platform, arch)] || null;
}

function getVoiceModelSpec(modelId) {
  return LOCAL_VOICE_MODELS[modelId] || LOCAL_VOICE_MODELS["ru-fast"];
}

function getVoiceRootDir(userDataDir) {
  return path.join(userDataDir, "rudex_voice");
}

function resolveBinaryPath(userDataDir, platform, arch) {
  const spec = getPlatformBinarySpec(platform, arch);
  if (!spec || !userDataDir) return "";
  const root = getVoiceRootDir(userDataDir);
  const direct = path.join(root, "bin", spec.dirName, spec.exeRel);
  if (fs.existsSync(direct)) return direct;
  // Also allow any versioned sherpa-onnx-* folder inside bin/
  try {
    const binParent = path.join(root, "bin");
    if (fs.existsSync(binParent)) {
      const exeName = path.basename(spec.exeRel);
      for (const ent of fs.readdirSync(binParent, { withFileTypes: true })) {
        if (!ent.isDirectory()) continue;
        const cand = path.join(binParent, ent.name, "bin", exeName);
        if (fs.existsSync(cand)) return cand;
      }
    }
  } catch {}
  return "";
}

/**
 * Resolves model files inside a sherpa-onnx streaming model folder
 * (supports both Zipformer transducer models and T-one Russian CTC models).
 */
function resolveModelFiles(userDataDir, modelId) {
  if (!userDataDir) return null;
  const spec = getVoiceModelSpec(modelId);
  const modelDir = path.join(getVoiceRootDir(userDataDir), "models", spec.dirName);
  if (!fs.existsSync(modelDir)) return null;

  let entries;
  try {
    entries = fs.readdirSync(modelDir);
  } catch {
    return null;
  }

  const tokens = entries.includes("tokens.txt") ? path.join(modelDir, "tokens.txt") : "";
  if (!tokens) return null;

  if (spec.kind === "t-one-ctc") {
    const ctcFile = entries.find((f) => f === "model.onnx") || entries.find((f) => f.endsWith(".onnx"));
    if (!ctcFile) return null;
    return {
      modelId: spec.id,
      kind: "t-one-ctc",
      sampleRate: spec.sampleRate || 8000,
      modelDir,
      tokens,
      ctcModel: path.join(modelDir, ctcFile),
    };
  }

  const pickFile = (prefix, preferInt8) => {
    const matches = entries.filter((f) => f.startsWith(prefix) && f.endsWith(".onnx"));
    if (matches.length === 0) return "";
    if (preferInt8) {
      const int8 = matches.find((f) => f.includes(".int8."));
      if (int8) return path.join(modelDir, int8);
    }
    const fp = matches.find((f) => !f.includes(".int8."));
    return path.join(modelDir, fp || matches[0]);
  };

  const preferInt8 = spec.id === "ru-fast" || spec.id === "multi-ru-en";
  const encoder = pickFile("encoder", preferInt8);
  const decoder = pickFile("decoder", false);
  const joiner = pickFile("joiner", preferInt8);

  if (!encoder || !decoder || !joiner) return null;
  return {
    modelId: spec.id,
    kind: spec.kind || "zipformer2",
    sampleRate: spec.sampleRate || 16000,
    modelDir,
    tokens,
    encoder,
    decoder,
    joiner,
  };
}

/**
 * Generates a SentencePiece-compatible bpe.vocab (from tokens.txt) and Russian dev hotwords file
 * so Zipformer modified_beam_search natively boosts Antigravity/Rudex/Git/IT terms.
 */
function ensureRuHotwordsFiles(userDataDir, modelFiles) {
  try {
    if (!userDataDir || !modelFiles || modelFiles.kind === "t-one-ctc" || !modelFiles.tokens) return null;
    const rawTokens = fs.readFileSync(modelFiles.tokens, "utf8");
    // Only BPE models use SentencePiece ▁ (U+2581) word-start tokens
    if (rawTokens.indexOf("\u2581") === -1) return null;
    const root = getVoiceRootDir(userDataDir);
    fs.mkdirSync(root, { recursive: true });
    const vocabPath = path.join(root, `bpe-${modelFiles.modelId}.vocab`);
    const hotwordsPath = path.join(root, "rudex-hotwords-ru.txt");
    const lines = rawTokens.split(/\r?\n/).filter(Boolean);
    const vocabOut = lines.map((line, idx) => {
      const tok = line.split(/\s+/)[0];
      return `${tok}\t${idx < 3 ? 0 : -(idx * 0.01).toFixed(4)}`;
    });
    fs.writeFileSync(vocabPath, vocabOut.join("\n") + "\n", "utf8");
    fs.writeFileSync(hotwordsPath, DEFAULT_RU_HOTWORDS.join("\n") + "\n", "utf8");
    return { vocabPath, hotwordsPath };
  } catch {
    return null;
  }
}

function listInstalledModels(userDataDir) {
  const out = [];
  for (const id of Object.keys(LOCAL_VOICE_MODELS)) {
    if (resolveModelFiles(userDataDir, id)) out.push(id);
  }
  return out;
}

/**
 * Converts base64-encoded 16-bit signed LE PCM into a 32-bit float LE PCM Buffer (-1..+1)
 * expected by sherpa-onnx-online-websocket-server.
 */
function pcm16Base64ToFloat32Buffer(input) {
  if (!input) return Buffer.alloc(0);
  const raw = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "base64");
  const sampleCount = Math.floor(raw.length / 2);
  if (sampleCount <= 0) return Buffer.alloc(0);
  const out = Buffer.allocUnsafe(sampleCount * 4);
  for (let i = 0; i < sampleCount; i += 1) {
    out.writeFloatLE(raw.readInt16LE(i * 2) / 32768.0, i * 4);
  }
  return out;
}

/**
 * Formats accumulated streaming dictation segments cleanly (dedup spaces, capitalize start).
 */
function formatAccumulatedSegments(segmentMap, capitalizeStart = true) {
  const parts = Array.from(segmentMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, txt]) => String(txt || "").trim())
    .filter(Boolean);
  let text = parts.join(" ").replace(/[ \t]{2,}/g, " ").trim();
  if (!text) return "";
  text = text.replace(/\s+([.,!?;:])/g, "$1");
  text = text.replace(/(^|[^\p{L}\p{N}_])([\p{L}]{3,})\s+\2(?=$|[^\p{L}\p{N}_])/giu, "$1$2");
  if (capitalizeStart && text.length > 0) {
    text = text[0].toUpperCase() + text.slice(1);
  }
  return text;
}

/**
 * Zero-dependency RFC6455 WebSocket client over loopback TCP (127.0.0.1).
 */
function connectLocalWs(portNum, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let upgraded = false;
    let closed = false;
    let buf = Buffer.alloc(0);
    const msgListeners = [];
    const closeListeners = [];

    const sock = net.createConnection({ host: "127.0.0.1", port: portNum });
    const key = crypto.randomBytes(16).toString("base64");

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { sock.destroy(); } catch {}
        reject(new Error(`Local voice WS connect timeout (${portNum})`));
      }
    }, timeoutMs);

    function emitClose() {
      if (closed) return;
      closed = true;
      for (let i = 0; i < closeListeners.length; i += 1) {
        try { closeListeners[i](); } catch {}
      }
    }

    function sendFrame(opcode, dataBuf) {
      if (closed || sock.destroyed) return false;
      const payload = Buffer.isBuffer(dataBuf) ? dataBuf : Buffer.from(dataBuf);
      const len = payload.length;
      const mask = crypto.randomBytes(4);
      let hdr;
      if (len < 126) {
        hdr = Buffer.allocUnsafe(6);
        hdr[0] = 0x80 | opcode;
        hdr[1] = 0x80 | len;
        mask.copy(hdr, 2);
      } else if (len < 65536) {
        hdr = Buffer.allocUnsafe(8);
        hdr[0] = 0x80 | opcode;
        hdr[1] = 0x80 | 126;
        hdr.writeUInt16BE(len, 2);
        mask.copy(hdr, 4);
      } else {
        hdr = Buffer.allocUnsafe(14);
        hdr[0] = 0x80 | opcode;
        hdr[1] = 0x80 | 127;
        hdr.writeBigUInt64BE(BigInt(len), 2);
        mask.copy(hdr, 10);
      }
      const masked = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i += 1) masked[i] = payload[i] ^ mask[i & 3];
      try {
        sock.write(Buffer.concat([hdr, masked]));
        return true;
      } catch {
        return false;
      }
    }

    function parseFrames() {
      while (buf.length >= 2) {
        const b0 = buf[0];
        const b1 = buf[1];
        const opcode = b0 & 0x0f;
        const masked = (b1 & 0x80) !== 0;
        let len = b1 & 0x7f;
        let off = 2;
        if (len === 126) {
          if (buf.length < 4) return;
          len = buf.readUInt16BE(2);
          off = 4;
        } else if (len === 127) {
          if (buf.length < 10) return;
          len = Number(buf.readBigUInt64BE(2));
          off = 10;
        }
        const maskLen = masked ? 4 : 0;
        if (buf.length < off + maskLen + len) return;
        let payload = buf.subarray(off + maskLen, off + maskLen + len);
        if (masked) {
          const m = buf.subarray(off, off + 4);
          payload = Buffer.from(payload);
          for (let i = 0; i < payload.length; i += 1) payload[i] ^= m[i & 3];
        }
        buf = buf.subarray(off + maskLen + len);

        if (opcode === 1) {
          const text = payload.toString("utf8");
          for (let i = 0; i < msgListeners.length; i += 1) {
            try { msgListeners[i](text); } catch {}
          }
        } else if (opcode === 9) {
          sendFrame(10, payload); // Pong
        } else if (opcode === 8) {
          emitClose();
          try { sock.end(); } catch {}
          return;
        }
      }
    }

    sock.setNoDelay(true);
    sock.on("connect", () => {
      sock.write(
        `GET / HTTP/1.1\r\n` +
        `Host: 127.0.0.1:${portNum}\r\n` +
        `Upgrade: websocket\r\n` +
        `Connection: Upgrade\r\n` +
        `Sec-WebSocket-Key: ${key}\r\n` +
        `Sec-WebSocket-Version: 13\r\n\r\n`
      );
    });
    sock.on("data", (chunk) => {
      buf = buf.length === 0 ? chunk : Buffer.concat([buf, chunk]);
      if (!upgraded) {
        const hdrEnd = buf.indexOf("\r\n\r\n");
        if (hdrEnd === -1) return;
        const hdrStr = buf.subarray(0, hdrEnd).toString("latin1");
        if (!/^HTTP\/1\.1 101\b/i.test(hdrStr)) {
          clearTimeout(timer);
          if (!settled) {
            settled = true;
            try { sock.destroy(); } catch {}
            reject(new Error(`WS handshake failed: ${hdrStr.split("\r\n")[0]}`));
          }
          return;
        }
        upgraded = true;
        buf = buf.subarray(hdrEnd + 4);
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve({
            sendBinary: (b) => sendFrame(2, b),
            sendText: (t) => sendFrame(1, Buffer.from(String(t), "utf8")),
            onMessage: (fn) => msgListeners.push(fn),
            onClose: (fn) => closeListeners.push(fn),
            close: () => {
              if (!closed) {
                try { sendFrame(8, Buffer.alloc(0)); } catch {}
                try { sock.end(); } catch {}
                emitClose();
              }
            },
            isClosed: () => closed,
          });
        }
      }
      parseFrames();
    });
    sock.on("error", (err) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(err);
      } else {
        emitClose();
      }
    });
    sock.on("close", () => {
      clearTimeout(timer);
      emitClose();
    });
  });
}

function pickFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = addr && typeof addr === "object" ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

function downloadFileWithRedirects(url, destPath, onProgress, maxRedirects = 6) {
  return new Promise((resolve, reject) => {
    const go = (curUrl, depth) => {
      if (depth > maxRedirects) {
        reject(new Error("Too many HTTP redirects"));
        return;
      }
      const mod = curUrl.startsWith("https:") ? https : http;
      const req = mod.get(
        curUrl,
        { headers: { "User-Agent": "Rudex-Voice-Installer/5.0" }, timeout: 30000 },
        (res) => {
          const code = res.statusCode || 0;
          if (code >= 300 && code < 400 && res.headers.location) {
            res.resume();
            const nextUrl = new URL(res.headers.location, curUrl).toString();
            go(nextUrl, depth + 1);
            return;
          }
          if (code < 200 || code >= 300) {
            res.resume();
            reject(new Error(`HTTP ${code} downloading ${curUrl}`));
            return;
          }
          const total = Number(res.headers["content-length"]) || 0;
          let received = 0;
          let lastEmit = 0;
          const tmpPath = `${destPath}.tmp-${process.pid}`;
          const ws = fs.createWriteStream(tmpPath);
          res.on("data", (chunk) => {
            received += chunk.length;
            const now = Date.now();
            if (typeof onProgress === "function" && (now - lastEmit > 180 || (total > 0 && received >= total))) {
              lastEmit = now;
              onProgress({ received, total, pct: total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0 });
            }
          });
          res.pipe(ws);
          ws.on("finish", () => {
            ws.close(() => {
              try {
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                fs.renameSync(tmpPath, destPath);
                resolve(destPath);
              } catch (err) {
                try { fs.unlinkSync(tmpPath); } catch {}
                reject(err);
              }
            });
          });
          ws.on("error", (err) => {
            try { ws.destroy(); } catch {}
            try { fs.unlinkSync(tmpPath); } catch {}
            reject(err);
          });
        }
      );
      req.on("timeout", () => {
        req.destroy(new Error("Download timed out"));
      });
      req.on("error", reject);
    };
    go(url, 0);
  });
}

function extractTarBz2(archivePath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  let tarCmd = process.platform === "win32" ? "tar.exe" : "tar";
  if (process.platform === "win32") {
    const sysTar = path.join(process.env.SystemRoot || process.env.WINDIR || "C:\\Windows", "System32", "tar.exe");
    if (fs.existsSync(sysTar)) tarCmd = sysTar;
  }
  const r = spawnSync(tarCmd, ["-xjf", archivePath, "-C", destDir], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 180000,
  });
  if (!r.error && r.status === 0) return;

  // Fallback on minimal Linux/macOS environments lacking the `bzip2` CLI: Python 3 stdlib handles tar.bz2 natively
  if (process.platform !== "win32") {
    const py = spawnSync(
      "python3",
      ["-c", "import sys, tarfile; tf = tarfile.open(sys.argv[1], 'r:bz2'); tf.extractall(sys.argv[2]); tf.close()", archivePath, destDir],
      { encoding: "utf8", timeout: 180000 }
    );
    if (!py.error && py.status === 0) return;
  }

  if (r.error) throw r.error;
  throw new Error(`tar extraction failed (code ${r.status}): ${(r.stderr || r.stdout || "").trim()}`);
}

async function downloadAndInstallLocalVoice(userDataDir, modelId = "ru-fast", onProgress) {
  const binSpec = getPlatformBinarySpec();
  if (!binSpec) {
    throw new Error(`Unsupported platform for local voice engine: ${getPlatformKey()}`);
  }
  const modSpec = getVoiceModelSpec(modelId);
  const rootDir = getVoiceRootDir(userDataDir);
  const binParent = path.join(rootDir, "bin");
  const modParent = path.join(rootDir, "models");
  fs.mkdirSync(binParent, { recursive: true });
  fs.mkdirSync(modParent, { recursive: true });

  const emit = (stage, pct, message) => {
    if (typeof onProgress === "function") {
      try { onProgress({ stage, pct, message, modelId: modSpec.id }); } catch {}
    }
  };

  if (!resolveBinaryPath(userDataDir)) {
    const binArc = path.join(rootDir, binSpec.archive);
    emit("binary-download", 2, `Downloading Sherpa-ONNX (${binSpec.sizeMb} MB)...`);
    await downloadFileWithRedirects(`${SHERPA_RELEASE_BASE}/${binSpec.archive}`, binArc, (p) => {
      emit("binary-download", Math.round(p.pct * 0.45), `Downloading engine (${p.pct}%)`);
    });
    emit("binary-extract", 48, "Extracting Sherpa-ONNX binary...");
    extractTarBz2(binArc, binParent);
    try { fs.unlinkSync(binArc); } catch {}
  }

  if (!resolveModelFiles(userDataDir, modSpec.id)) {
    const modArc = path.join(rootDir, modSpec.archive);
    emit("model-download", 52, `Downloading model ${modSpec.id} (${modSpec.sizeMb} MB)...`);
    await downloadFileWithRedirects(`${SHERPA_MODELS_BASE}/${modSpec.archive}`, modArc, (p) => {
      emit("model-download", 52 + Math.round(p.pct * 0.43), `Downloading model (${p.pct}%)`);
    });
    emit("model-extract", 96, "Extracting speech model...");
    extractTarBz2(modArc, modParent);
    try { fs.unlinkSync(modArc); } catch {}
  }

  const exe = resolveBinaryPath(userDataDir);
  const files = resolveModelFiles(userDataDir, modSpec.id);
  if (!exe || !files) {
    throw new Error("Installation finished but binary or model files could not be verified.");
  }
  if (process.platform !== "win32") {
    try { fs.chmodSync(exe, 0o755); } catch {}
    if (process.platform === "darwin") {
      try {
        const bundleDir = path.resolve(path.dirname(exe), "..");
        spawnSync("xattr", ["-dr", "com.apple.quarantine", bundleDir], { stdio: "ignore", timeout: 10000 });
      } catch {}
    }
  }
  emit("done", 100, "Local instant voice engine ready");
  return { ok: true, exePath: exe, modelFiles: files };
}

/**
 * Persistent loopback streaming server + session router for Electron Main process.
 */
function createLocalVoiceManager(options = {}) {
  const getUserDataDir = typeof options.getUserDataDir === "function"
    ? options.getUserDataDir
    : () => options.userDataDir || "";

  let proc = null;
  let activePort = 0;
  let activeModelId = "";
  let startPromise = null;
  let installPromise = null;
  let lastError = "";
  const sessions = new Map();

  function getStatus(modelId = "ru-fast") {
    const ud = getUserDataDir();
    const spec = getVoiceModelSpec(modelId);
    const binSpec = getPlatformBinarySpec();
    const exePath = resolveBinaryPath(ud);
    const modelFiles = resolveModelFiles(ud, spec.id);
    const installedModels = listInstalledModels(ud);
    return {
      platformSupported: Boolean(binSpec),
      binaryReady: Boolean(exePath),
      modelReady: Boolean(modelFiles),
      installed: Boolean(exePath && modelFiles),
      running: Boolean(proc && !proc.killed && activePort > 0),
      runningModelId: activeModelId || "",
      port: activePort,
      modelId: spec.id,
      installedModels,
      installing: Boolean(installPromise),
      error: lastError,
      models: Object.values(LOCAL_VOICE_MODELS).map((m) => ({
        id: m.id,
        sizeMb: m.sizeMb,
        labelRu: m.labelRu,
        labelEn: m.labelEn,
        installed: installedModels.includes(m.id),
      })),
    };
  }

  function stopServer() {
    for (const sess of sessions.values()) {
      try { if (sess.doneTimer) clearTimeout(sess.doneTimer); } catch {}
      try { if (sess.ws) sess.ws.close(); } catch {}
    }
    sessions.clear();
    if (proc) {
      const p = proc;
      proc = null;
      activePort = 0;
      activeModelId = "";
      try { p.kill(); } catch {}
    }
    startPromise = null;
  }

  async function ensureServer(modelId = "ru-fast") {
    const spec = getVoiceModelSpec(modelId);
    const ud = getUserDataDir();
    const exePath = resolveBinaryPath(ud);
    const modelFiles = resolveModelFiles(ud, spec.id);
    if (!exePath || !modelFiles) {
      throw new Error("LOCAL_VOICE_NOT_INSTALLED");
    }

    if (proc && !proc.killed && activePort > 0 && activeModelId === spec.id) {
      return { port: activePort, modelId: spec.id };
    }

    if (proc && activeModelId !== spec.id) {
      stopServer();
    }

    if (startPromise) return startPromise;

    startPromise = (async () => {
      lastError = "";
      const port = await pickFreePort();
      const cpus = (os.cpus() ? os.cpus().length : 4) || 4;
      // Keep thread pool lean (2 work threads x <=4 ONNX threads) so Sherpa-ONNX never starves Antigravity or Voice Mode
      const onnxThreads = Math.min(4, Math.max(2, Math.floor(cpus / 2)));
      const logFile = path.join(getVoiceRootDir(ud), "sherpa-server.log");
      const args = [
        `--port=${port}`,
        "--num-io-threads=1",
        "--num-work-threads=2",
        `--num-threads=${onnxThreads}`,
        `--tokens=${modelFiles.tokens}`,
        `--log-file=${logFile}`,
        "--loop-interval-ms=10",
        "--max-batch-size=2",
        "--input-sample-rate=16000",
      ];

      if (modelFiles.kind === "t-one-ctc") {
        args.push(
          `--t-one-ctc-model=${modelFiles.ctcModel}`,
          `--sample-rate=${modelFiles.sampleRate || 8000}`,
          "--end-tail-padding=0.8",
          "--rule1-min-trailing-silence=3.2",
          "--rule2-min-trailing-silence=2.0"
        );
      } else {
        args.push(
          "--model-type=zipformer2",
          `--encoder=${modelFiles.encoder}`,
          `--decoder=${modelFiles.decoder}`,
          `--joiner=${modelFiles.joiner}`,
          "--decoding-method=modified_beam_search",
          "--max-active-paths=4",
          "--end-tail-padding=0.5",
          "--rule1-min-trailing-silence=3.0",
          "--rule2-min-trailing-silence=1.8"
        );
        if (spec.id === "ru-fast" || spec.id === "ru-hq") {
          const hw = ensureRuHotwordsFiles(ud, modelFiles);
          if (hw) {
            args.push(
              "--modeling-unit=bpe",
              `--bpe-vocab=${hw.vocabPath}`,
              `--hotwords-file=${hw.hotwordsPath}`,
              "--hotwords-score=2.0"
            );
          }
        }
      }

      const spawnEnv = Object.assign({}, process.env);
      const libDir = path.resolve(path.dirname(exePath), "..", "lib");
      if (process.platform === "linux" && fs.existsSync(libDir)) {
        spawnEnv.LD_LIBRARY_PATH = spawnEnv.LD_LIBRARY_PATH ? `${libDir}:${spawnEnv.LD_LIBRARY_PATH}` : libDir;
      } else if (process.platform === "darwin" && fs.existsSync(libDir)) {
        spawnEnv.DYLD_LIBRARY_PATH = spawnEnv.DYLD_LIBRARY_PATH ? `${libDir}:${spawnEnv.DYLD_LIBRARY_PATH}` : libDir;
      }

      const child = spawn(exePath, args, {
        cwd: path.dirname(exePath),
        env: spawnEnv,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });

      let exited = false;
      let errBuf = "";
      child.stderr.on("data", (d) => {
        errBuf = (errBuf + d.toString("utf8")).slice(-2000);
      });
      child.on("exit", (code) => {
        exited = true;
        if (proc === child) {
          proc = null;
          activePort = 0;
          activeModelId = "";
        }
        if (code && code !== 0) {
          lastError = `sherpa-onnx exited with code ${code}`;
        }
      });

      // Wait until TCP port starts accepting connections (typical ~1.1-1.6s cold boot)
      let ready = false;
      const deadline = Date.now() + 12000;
      while (Date.now() < deadline && !exited) {
        try {
          await new Promise((res, rej) => {
            const probe = net.createConnection({ host: "127.0.0.1", port });
            probe.once("connect", () => { probe.destroy(); res(); });
            probe.once("error", (e) => { probe.destroy(); rej(e); });
          });
          ready = true;
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 70));
        }
      }

      if (!ready || exited) {
        try { child.kill(); } catch {}
        lastError = errBuf.trim() || "Local voice server failed to start";
        throw new Error(lastError);
      }

      proc = child;
      activePort = port;
      activeModelId = spec.id;
      return { port, modelId: spec.id };
    })().finally(() => {
      startPromise = null;
    });

    return startPromise;
  }

  async function install(modelId = "ru-fast", onProgress) {
    if (installPromise) return installPromise;
    installPromise = (async () => {
      try {
        const res = await downloadAndInstallLocalVoice(getUserDataDir(), modelId, onProgress);
        lastError = "";
        // Pre-warm immediately after install so first click is instant
        try { await ensureServer(modelId); } catch {}
        return res;
      } catch (err) {
        lastError = err && err.message ? err.message : String(err);
        throw err;
      } finally {
        installPromise = null;
      }
    })();
    return installPromise;
  }

  async function startSession({ sessionId, streamId, modelId = "ru-fast", onPartial, onFinal, onError }) {
    if (!sessionId) throw new Error("Missing sessionId");
    cancelSession(sessionId);

    const sess = {
      sessionId,
      streamId,
      ws: null,
      ready: false,
      ended: false,
      finalEmitted: false,
      cancelled: false,
      pendingChunks: [],
      segments: new Map(),
      lastText: "",
      doneTimer: null,
      onPartial,
      onFinal,
      onError,
    };
    sessions.set(sessionId, sess);

    const finishOnce = () => {
      if (sess.finalEmitted || sess.cancelled) return;
      sess.finalEmitted = true;
      if (sess.doneTimer) {
        clearTimeout(sess.doneTimer);
        sess.doneTimer = null;
      }
      const finalText = formatAccumulatedSegments(sess.segments, true) || sess.lastText || "";
      try { if (sess.ws) sess.ws.close(); } catch {}
      sessions.delete(sessionId);
      if (typeof sess.onFinal === "function") {
        try { sess.onFinal(finalText); } catch {}
      }
    };

    try {
      const { port } = await ensureServer(modelId);
      if (sess.cancelled) {
        sessions.delete(sessionId);
        return { ok: false, cancelled: true };
      }
      const ws = await connectLocalWs(port, 4000);
      if (sess.cancelled) {
        ws.close();
        sessions.delete(sessionId);
        return { ok: false, cancelled: true };
      }
      sess.ws = ws;
      sess.ready = true;

      ws.onMessage((msg) => {
        if (sess.cancelled) return;
        const trimmed = String(msg || "").trim();
        if (trimmed === "Done!") {
          finishOnce();
          return;
        }
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed.text === "string") {
            const seg = Number.isFinite(Number(parsed.segment)) ? Number(parsed.segment) : 0;
            const segTxt = parsed.text.trim();
            if (segTxt) {
              sess.segments.set(seg, segTxt);
            }
            const combined = formatAccumulatedSegments(sess.segments, true);
            if (combined && combined !== sess.lastText) {
              sess.lastText = combined;
              if (!sess.finalEmitted && typeof sess.onPartial === "function") {
                try { sess.onPartial(combined); } catch {}
              }
            }
          }
        } catch {}
      });

      ws.onClose(() => {
        if (!sess.cancelled && !sess.finalEmitted) {
          finishOnce();
        }
      });

      // Flush buffered chunks that arrived while connecting
      if (sess.pendingChunks.length > 0) {
        for (let i = 0; i < sess.pendingChunks.length; i += 1) {
          ws.sendBinary(sess.pendingChunks[i]);
        }
        sess.pendingChunks.length = 0;
      }

      if (sess.ended) {
        ws.sendText("Done");
        sess.doneTimer = setTimeout(finishOnce, 500);
      }

      return { ok: true, port };
    } catch (err) {
      sessions.delete(sessionId);
      const msg = err && err.message ? err.message : String(err);
      if (!sess.cancelled && typeof onError === "function") {
        try { onError(msg); } catch {}
      }
      return { ok: false, error: msg };
    }
  }

  function pushChunk(sessionId, pcm16Base64OrBuf) {
    const sess = sessions.get(sessionId);
    if (!sess || sess.cancelled || sess.ended) return false;
    const f32Buf = pcm16Base64ToFloat32Buffer(pcm16Base64OrBuf);
    if (f32Buf.length === 0) return false;
    if (sess.ready && sess.ws && !sess.ws.isClosed()) {
      return sess.ws.sendBinary(f32Buf);
    }
    if (sess.pendingChunks.length < 120) {
      sess.pendingChunks.push(f32Buf);
    }
    return true;
  }

  function endSession(sessionId) {
    const sess = sessions.get(sessionId);
    if (!sess || sess.cancelled || sess.ended) return false;
    sess.ended = true;
    const finishFallback = () => {
      if (sess.finalEmitted || sess.cancelled) return;
      sess.finalEmitted = true;
      const finalText = formatAccumulatedSegments(sess.segments, true) || sess.lastText || "";
      try { if (sess.ws) sess.ws.close(); } catch {}
      sessions.delete(sessionId);
      if (typeof sess.onFinal === "function") {
        try { sess.onFinal(finalText); } catch {}
      }
    };
    if (sess.ready && sess.ws && !sess.ws.isClosed()) {
      sess.ws.sendText("Done");
      sess.doneTimer = setTimeout(finishFallback, 600);
    } else {
      sess.doneTimer = setTimeout(finishFallback, 1500);
    }
    return true;
  }

  function cancelSession(sessionId) {
    const sess = sessions.get(sessionId);
    if (!sess) return false;
    sess.cancelled = true;
    if (sess.doneTimer) {
      clearTimeout(sess.doneTimer);
      sess.doneTimer = null;
    }
    try { if (sess.ws) sess.ws.close(); } catch {}
    sessions.delete(sessionId);
    return true;
  }

  return {
    getStatus,
    ensureServer,
    install,
    startSession,
    pushChunk,
    endSession,
    cancelSession,
    stopServer,
  };
}

module.exports = {
  SHERPA_RELEASE_TAG,
  SHERPA_PLATFORM_BINARIES,
  LOCAL_VOICE_MODELS,
  DEFAULT_RU_HOTWORDS,
  getPlatformKey,
  getPlatformBinarySpec,
  getVoiceModelSpec,
  getVoiceRootDir,
  resolveBinaryPath,
  resolveModelFiles,
  ensureRuHotwordsFiles,
  listInstalledModels,
  pcm16Base64ToFloat32Buffer,
  formatAccumulatedSegments,
  connectLocalWs,
  downloadAndInstallLocalVoice,
  createLocalVoiceManager,
};
