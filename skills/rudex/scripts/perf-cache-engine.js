"use strict";

/**
 * Rudex Performance, Language Server Tuning & Cache Hygiene Engine (Node.js).
 * Used by Electron main process (i18nMain.js, languageServer.js, main.js),
 * installer CLI (--diagnostics / --clean-cache), and unit tests.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const LAYOUT_KEY_PREFIX = "antigravity-multi-conversation-layout-v3-";

const SAFE_CHROMIUM_CACHE_DIRS = [
  "Cache",
  "Code Cache",
  "GPUCache",
  "GrShaderCache",
  "ShaderCache",
  "DawnGraphiteCache",
  "DawnWebGPUCache",
];

const SAFE_PARTITION_SUBDIRS = [
  "Cache",
  "Code Cache",
  "GPUCache",
  "GrShaderCache",
  "ShaderCache",
];

function clampNum(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Computes safe, hardware-aware CLI flags and environment variables for language_server.
 * Lifts the default GOMAXPROCS=4 cap on multi-core CPUs, raises file watcher & tracked workspace
 * limits, tunes Go GC memory ceiling, and expands Node libuv I/O threadpool.
 */
function computeOptimalLsTuning(rawOpt, sysInfo = {}) {
  const opt = rawOpt && typeof rawOpt === "object" ? rawOpt : {};
  const enabled = opt.lsTuningEnabled === true;
  const cpuCount = Math.max(1, Number(sysInfo.cpuCount) || (os.cpus() ? os.cpus().length : 4) || 4);
  const totalMemBytes = Math.max(0, Number(sysInfo.totalMemBytes) || os.totalmem() || 0);
  const totalMemGb = totalMemBytes / (1024 * 1024 * 1024);

  if (!enabled) {
    return {
      enabled: false,
      args: [],
      env: {},
      summary: {
        cpuCount,
        maxProcs: 4,
        fileWatchMaxDirs: 0,
        maxTrackedWorkspaces: 10,
        goMemLimit: "",
        uvThreadpoolSize: 4,
      },
    };
  }

  const requestedProcs = Number(opt.lsMaxProcs);
  const autoProcs = Math.min(16, Math.max(4, cpuCount - 2));
  const maxProcs = Number.isFinite(requestedProcs) && requestedProcs > 0
    ? Math.round(clampNum(requestedProcs, 2, 32, autoProcs))
    : autoProcs;

  let fileWatchMaxDirs = Math.round(clampNum(opt.lsFileWatchMaxDirs, 4096, 131072, 32768));
  // On Linux, never exceed 50% of kernel fs.inotify.max_user_watches to avoid ENOSPC watcher exhaustion
  if ((sysInfo.platform || process.platform) === "linux") {
    try {
      const rawMax = typeof sysInfo.linuxMaxUserWatches === "number"
        ? sysInfo.linuxMaxUserWatches
        : Number(fs.readFileSync("/proc/sys/fs/inotify/max_user_watches", "utf8").trim());
      if (Number.isFinite(rawMax) && rawMax > 0) {
        fileWatchMaxDirs = Math.min(fileWatchMaxDirs, Math.max(4096, Math.floor(rawMax * 0.5)));
      }
    } catch {}
  }
  const maxTrackedWorkspaces = Math.round(clampNum(opt.lsMaxTrackedWorkspaces, 10, 64, 24));

  const args = [
    `--limit_go_max_procs=${maxProcs}`,
    `--file_watch_max_dir_count=${fileWatchMaxDirs}`,
    `--max_num_tracked_workspaces=${maxTrackedWorkspaces}`,
  ];

  const env = {};
  let goMemLimit = "";
  if (totalMemGb >= 8) {
    const limitMb = Math.round(clampNum(totalMemGb * 1024 * 0.2, 2048, 6144, 3072));
    goMemLimit = `${limitMb}MiB`;
    env.GOMEMLIMIT = goMemLimit;
  }
  if (totalMemGb >= 16) {
    env.GOGC = "150";
  }
  const uvThreads = Math.min(16, Math.max(8, cpuCount));
  env.UV_THREADPOOL_SIZE = String(uvThreads);

  return {
    enabled: true,
    args,
    env,
    summary: {
      cpuCount,
      maxProcs,
      fileWatchMaxDirs,
      maxTrackedWorkspaces,
      goMemLimit,
      uvThreadpoolSize: uvThreads,
    },
  };
}

/**
 * Computes universally safe Electron Chromium startup switches (disk cache cap + smooth scrolling).
 * Intentionally avoids --enable-zero-copy / forced --enable-gpu-rasterization which can cause
 * black screens or GPU crashes on Linux Wayland/Mesa, older iGPUs, RDP, or VMs.
 * Never touches sandbox, security, or CalculateNativeWinOcclusion flags.
 */
function computeChromiumPerfSwitches(rawOpt) {
  const opt = rawOpt && typeof rawOpt === "object" ? rawOpt : {};
  const switches = [];
  const rawCap = Number(opt.chromiumCacheCapMb);
  const capMb = Number.isFinite(rawCap) && rawCap > 0 ? Math.round(clampNum(rawCap, 50, 512, 100)) : 0;
  if (capMb > 0) {
    switches.push(["disk-cache-size", String(capMb * 1024 * 1024)]);
    switches.push(["media-cache-size", String(Math.round((capMb / 2) * 1024 * 1024))]);
  }
  if (opt.gpuAccel === true) {
    switches.push(["enable-smooth-scrolling"]);
  }
  return switches;
}

/**
 * Bounded recursive directory size calculator (never throws on locked files or missing dirs).
 */
function measureDirSizeSafe(dirPath, maxDepth = 6) {
  const result = { bytes: 0, files: 0 };
  if (!dirPath || !fs.existsSync(dirPath)) return result;

  function walk(cur, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      return;
    }
    for (let i = 0; i < entries.length; i += 1) {
      const ent = entries[i];
      const full = path.join(cur, ent.name);
      if (ent.isSymbolicLink()) continue;
      if (ent.isDirectory()) {
        walk(full, depth + 1);
      } else if (ent.isFile()) {
        try {
          const st = fs.statSync(full);
          result.bytes += st.size || 0;
          result.files += 1;
        } catch {}
      }
    }
  }

  walk(dirPath, 0);
  return result;
}

function collectKnownConversationIds(geminiDir) {
  const ids = new Set();
  const base = geminiDir || path.join(os.homedir(), ".gemini", "antigravity");
  const convDir = path.join(base, "conversations");
  const brainDir = path.join(base, "brain");

  for (const dir of [convDir, brainDir]) {
    try {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir);
      for (let i = 0; i < entries.length; i += 1) {
        const m = UUID_RE.exec(entries[i]);
        if (m) ids.add(m[0].toLowerCase());
      }
    } catch {}
  }
  return ids;
}

/**
 * Analyzes app_storage.json for stale multi-conversation layout entries whose
 * conversations no longer exist on disk.
 */
function analyzeAppStorageBloat(userDataDir, geminiDir) {
  const storagePath = path.join(userDataDir, "app_storage.json");
  const out = {
    exists: false,
    bytes: 0,
    totalKeys: 0,
    layoutKeys: 0,
    staleLayoutKeys: [],
    estimatedReclaimBytes: 0,
  };
  if (!userDataDir || !fs.existsSync(storagePath)) return out;
  try {
    const raw = fs.readFileSync(storagePath, "utf8");
    out.exists = true;
    out.bytes = Buffer.byteLength(raw, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return out;
    const keys = Object.keys(parsed);
    out.totalKeys = keys.length;

    const knownIds = collectKnownConversationIds(geminiDir);
    // Only mark keys stale when we actually discovered the conversations directory
    const canVerify = knownIds.size > 0;
    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      if (!k.startsWith(LAYOUT_KEY_PREFIX) || k === `${LAYOUT_KEY_PREFIX}index`) continue;
      out.layoutKeys += 1;
      if (!canVerify) continue;
      const tail = k.slice(LAYOUT_KEY_PREFIX.length);
      const uuids = tail.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [];
      if (uuids.length > 0 && uuids.every((u) => !knownIds.has(u.toLowerCase()))) {
        out.staleLayoutKeys.push(k);
        out.estimatedReclaimBytes += Buffer.byteLength(k, "utf8") + Buffer.byteLength(String(parsed[k] || ""), "utf8") + 10;
      }
    }
  } catch {}
  return out;
}

/**
 * Safely prunes dead conversation layout keys from app_storage.json after creating a backup.
 */
function pruneStaleAppStorage(options = {}) {
  const userDataDir = options.userDataDir;
  const geminiDir = options.geminiDir || path.join(os.homedir(), ".gemini", "antigravity");
  const dryRun = Boolean(options.dryRun);
  const storagePath = path.join(userDataDir, "app_storage.json");

  const analysis = analyzeAppStorageBloat(userDataDir, geminiDir);
  if (!analysis.exists || analysis.staleLayoutKeys.length === 0) {
    return {
      ok: true,
      dryRun,
      removedKeys: 0,
      bytesBefore: analysis.bytes,
      bytesAfter: analysis.bytes,
      freedBytes: 0,
    };
  }

  try {
    const raw = fs.readFileSync(storagePath, "utf8");
    const parsed = JSON.parse(raw);
    const bytesBefore = Buffer.byteLength(raw, "utf8");
    for (let i = 0; i < analysis.staleLayoutKeys.length; i += 1) {
      delete parsed[analysis.staleLayoutKeys[i]];
    }
    const nextRaw = JSON.stringify(parsed, null, 2);
    const bytesAfter = Buffer.byteLength(nextRaw, "utf8");
    if (!dryRun) {
      const bakPath = `${storagePath}.rudex-bak`;
      try { fs.copyFileSync(storagePath, bakPath); } catch {}
      const tmpPath = `${storagePath}.rudex-prune-${process.pid}.tmp`;
      fs.writeFileSync(tmpPath, nextRaw, "utf8");
      try {
        fs.renameSync(tmpPath, storagePath);
      } catch {
        fs.writeFileSync(storagePath, nextRaw, "utf8");
        try { fs.unlinkSync(tmpPath); } catch {}
      }
    }
    return {
      ok: true,
      dryRun,
      removedKeys: analysis.staleLayoutKeys.length,
      bytesBefore,
      bytesAfter,
      freedBytes: Math.max(0, bytesBefore - bytesAfter),
    };
  } catch (err) {
    return {
      ok: false,
      dryRun,
      error: err && err.message ? err.message : String(err),
      removedKeys: 0,
      bytesBefore: analysis.bytes,
      bytesAfter: analysis.bytes,
      freedBytes: 0,
    };
  }
}

/**
 * Computes real-time Prompt Cache Hit Rate (%) from recent Antigravity transcripts.
 */
function samplePromptCacheMetrics(geminiDir, maxFiles = 20) {
  const base = geminiDir || path.join(os.homedir(), ".gemini", "antigravity");
  const brainDir = path.join(base, "brain");
  const out = {
    turnsSampled: 0,
    chatsSampled: 0,
    totalInputTokens: 0,
    totalCacheReadTokens: 0,
    totalOutputTokens: 0,
    cacheHitRatePct: 0,
  };
  if (!fs.existsSync(brainDir)) return out;

  const candidates = [];
  try {
    const dirs = fs.readdirSync(brainDir, { withFileTypes: true });
    for (let i = 0; i < dirs.length; i += 1) {
      if (!dirs[i].isDirectory()) continue;
      const lp = path.join(brainDir, dirs[i].name, ".system_generated", "logs", "transcript.jsonl");
      try {
        if (!fs.existsSync(lp)) continue;
        const st = fs.statSync(lp);
        if (st.size > 0) candidates.push({ lp, mtimeMs: st.mtimeMs || 0, size: st.size });
      } catch {}
    }
  } catch {
    return out;
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const picked = candidates.slice(0, maxFiles);

  for (let i = 0; i < picked.length; i += 1) {
    const c = picked[i];
    try {
      let text = "";
      if (c.size <= 512 * 1024) {
        text = fs.readFileSync(c.lp, "utf8");
      } else {
        const fd = fs.openSync(c.lp, "r");
        try {
          const tailLen = Math.min(c.size, 384 * 1024);
          const buf = Buffer.alloc(tailLen);
          fs.readSync(fd, buf, 0, tailLen, c.size - tailLen);
          text = buf.toString("utf8");
        } finally {
          fs.closeSync(fd);
        }
      }
      const lines = text.split(/\r?\n/);
      let chatHasTurn = false;
      for (let j = 0; j < lines.length; j += 1) {
        const line = lines[j];
        if (!line || line.indexOf("cache_read_tokens") === -1) continue;
        try {
          const obj = JSON.parse(line);
          const inTok = Number(obj.input_tokens) || 0;
          const cacheTok = Number(obj.cache_read_tokens) || 0;
          const outTok = Number(obj.output_tokens) || 0;
          if (inTok > 0 || cacheTok > 0) {
            out.totalInputTokens += Math.max(0, Math.round(inTok));
            out.totalCacheReadTokens += Math.max(0, Math.round(cacheTok));
            out.totalOutputTokens += Math.max(0, Math.round(outTok));
            out.turnsSampled += 1;
            chatHasTurn = true;
          }
        } catch {}
      }
      if (chatHasTurn) out.chatsSampled += 1;
    } catch {}
  }

  const denom = out.totalInputTokens + out.totalCacheReadTokens;
  if (denom > 0) {
    out.cacheHitRatePct = Math.round((out.totalCacheReadTokens / denom) * 1000) / 10;
  }
  return out;
}

/**
 * Collects full disk cache, storage bloat, LS hardware allocation, and prompt cache metrics.
 */
function inspectCacheDiagnostics(options = {}) {
  const userDataDir = options.userDataDir || "";
  const geminiDir = options.geminiDir || path.join(os.homedir(), ".gemini", "antigravity");
  const opt = options.optimization || {};

  let chromiumCacheBytes = 0;
  let chromiumCacheFiles = 0;
  if (userDataDir) {
    for (let i = 0; i < SAFE_CHROMIUM_CACHE_DIRS.length; i += 1) {
      const m = measureDirSizeSafe(path.join(userDataDir, SAFE_CHROMIUM_CACHE_DIRS[i]), 4);
      chromiumCacheBytes += m.bytes;
      chromiumCacheFiles += m.files;
    }
  }

  let partitionsCacheBytes = 0;
  let partitionsCacheFiles = 0;
  const partRoot = userDataDir ? path.join(userDataDir, "Partitions") : "";
  if (partRoot && fs.existsSync(partRoot)) {
    try {
      const parts = fs.readdirSync(partRoot, { withFileTypes: true });
      for (let i = 0; i < parts.length; i += 1) {
        if (!parts[i].isDirectory()) continue;
        for (let j = 0; j < SAFE_PARTITION_SUBDIRS.length; j += 1) {
          const m = measureDirSizeSafe(path.join(partRoot, parts[i].name, SAFE_PARTITION_SUBDIRS[j]), 4);
          partitionsCacheBytes += m.bytes;
          partitionsCacheFiles += m.files;
        }
      }
    } catch {}
  }

  let rudexTempBytes = 0;
  let rudexTempFiles = 0;
  if (userDataDir) {
    const exp = measureDirSizeSafe(path.join(userDataDir, "studio_live_edits", "expired"), 3);
    rudexTempBytes += exp.bytes;
    rudexTempFiles += exp.files;
    // Count orphaned *.tmp-* files in userDataDir
    try {
      const top = fs.readdirSync(userDataDir);
      const cutoff = Date.now() - 5 * 60 * 1000;
      for (let i = 0; i < top.length; i += 1) {
        if (!/\.tmp-/.test(top[i])) continue;
        const fp = path.join(userDataDir, top[i]);
        try {
          const st = fs.statSync(fp);
          if (st.isFile() && (st.mtimeMs || 0) < cutoff) {
            rudexTempBytes += st.size || 0;
            rudexTempFiles += 1;
          }
        } catch {}
      }
    } catch {}
  }

  const appStorage = analyzeAppStorageBloat(userDataDir, geminiDir);
  const promptCache = samplePromptCacheMetrics(geminiDir, 20);
  const lsTuning = computeOptimalLsTuning(opt);

  return {
    checkedAt: Date.now(),
    cleanableTotalBytes: chromiumCacheBytes + partitionsCacheBytes + rudexTempBytes,
    buckets: {
      chromiumCache: { bytes: chromiumCacheBytes, files: chromiumCacheFiles },
      partitionsCache: { bytes: partitionsCacheBytes, files: partitionsCacheFiles },
      rudexTemp: { bytes: rudexTempBytes, files: rudexTempFiles },
    },
    appStorage,
    promptCache,
    lsTuning: lsTuning.summary,
  };
}

function emptyDirContentsSafe(dirPath, stats) {
  if (!dirPath || !fs.existsSync(dirPath)) return;
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (let i = 0; i < entries.length; i += 1) {
    const ent = entries[i];
    const full = path.join(dirPath, ent.name);
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) {
      emptyDirContentsSafe(full, stats);
      try { fs.rmdirSync(full); } catch {}
    } else if (ent.isFile()) {
      let sz = 0;
      try { sz = fs.statSync(full).size || 0; } catch {}
      try {
        fs.unlinkSync(full);
        stats.freedBytes += sz;
        stats.removedFiles += 1;
      } catch {
        stats.skippedLocked += 1;
      }
    }
  }
}

/**
 * Safely clears ONLY regenerable cache files (Chromium HTTP/Code/GPU caches,
 * Partition caches, expired Rudex live edits, orphaned .tmp files).
 * Never removes chats, cookies, Local Storage, credentials, or user settings.
 */
function cleanSafeCaches(options = {}) {
  const userDataDir = options.userDataDir || "";
  const includeChromium = options.includeChromium !== false;
  const includePartitions = options.includePartitions !== false;
  const includeRudexTemp = options.includeRudexTemp !== false;

  const stats = { ok: true, freedBytes: 0, removedFiles: 0, skippedLocked: 0 };
  if (!userDataDir || !fs.existsSync(userDataDir)) return stats;

  if (includeChromium) {
    for (let i = 0; i < SAFE_CHROMIUM_CACHE_DIRS.length; i += 1) {
      emptyDirContentsSafe(path.join(userDataDir, SAFE_CHROMIUM_CACHE_DIRS[i]), stats);
    }
  }

  if (includePartitions) {
    const partRoot = path.join(userDataDir, "Partitions");
    if (fs.existsSync(partRoot)) {
      try {
        const parts = fs.readdirSync(partRoot, { withFileTypes: true });
        for (let i = 0; i < parts.length; i += 1) {
          if (!parts[i].isDirectory()) continue;
          for (let j = 0; j < SAFE_PARTITION_SUBDIRS.length; j += 1) {
            emptyDirContentsSafe(path.join(partRoot, parts[i].name, SAFE_PARTITION_SUBDIRS[j]), stats);
          }
        }
      } catch {}
    }
  }

  if (includeRudexTemp) {
    emptyDirContentsSafe(path.join(userDataDir, "studio_live_edits", "expired"), stats);
    const cutoff = Date.now() - 5 * 60 * 1000;
    try {
      const top = fs.readdirSync(userDataDir);
      for (let i = 0; i < top.length; i += 1) {
        if (!/\.tmp-/.test(top[i])) continue;
        const fp = path.join(userDataDir, top[i]);
        try {
          const st = fs.statSync(fp);
          if (st.isFile() && (st.mtimeMs || 0) < cutoff) {
            fs.unlinkSync(fp);
            stats.freedBytes += st.size || 0;
            stats.removedFiles += 1;
          }
        } catch {
          stats.skippedLocked += 1;
        }
      }
    } catch {}
  }

  return stats;
}

module.exports = {
  SAFE_CHROMIUM_CACHE_DIRS,
  SAFE_PARTITION_SUBDIRS,
  computeOptimalLsTuning,
  computeChromiumPerfSwitches,
  measureDirSizeSafe,
  analyzeAppStorageBloat,
  pruneStaleAppStorage,
  samplePromptCacheMetrics,
  inspectCacheDiagnostics,
  cleanSafeCaches,
};
