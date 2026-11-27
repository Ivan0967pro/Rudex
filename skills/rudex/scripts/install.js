#!/usr/bin/env node
"use strict";

// CRITICAL: When invoked via Antigravity.exe (ELECTRON_RUN_AS_NODE=1) without system Node.js,
// Electron wraps `fs` with ASAR interception so fs.existsSync/copyFileSync/openSync treat
// `app.asar` as a virtual directory and crash with `ENOENT,  not found in ...\app.asar`.
process.noAsar = true;

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const vm = require("vm");
const { spawn, spawnSync } = require("child_process");
const { patchElectronShell } = require("./electron-shell.js");
const {
  readZipEocdComment,
  extractCommitShaFromText,
  readGitHeadMeta,
  posixShellQuote,
  wshEscapeJsString,
  resolveWscriptExe,
  spawnSilentWindowsWsh,
} = require("./updater-core.js");

const PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "..");
const RESOURCES_SRC_DIR = path.resolve(__dirname, "..", "resources");
const SCRIPTS_SRC_DIR = __dirname;
const PLUGIN_JSON_PATH = path.join(PLUGIN_ROOT, "plugin.json");
const PATCH_META_FILENAME = "rudex-patch-meta.json";
const LEGACY_META_FILENAME = "ru-patch-meta.json";

const DEFAULT_PRELOAD_ORDER = [
  "dynamic-rules-ru.js",
  // dictionary-ru.json injected between dynamic rules and dom-translator
  "dom-translator.js",
  "telemetry-engine.js",
  // STUDIO_META injected before theme/styles/panel
  "theme-engine.js",
  "studio-styles.js",
  "studio-panel.js",
];

/**
 * Resolve Antigravity desktop userData directory across Windows, macOS, Linux.
 */
function getUserDataDir(env = process.env, platform = process.platform) {
  if (env && env.AGY_STUDIO_USER_DATA && String(env.AGY_STUDIO_USER_DATA).trim()) {
    return path.resolve(String(env.AGY_STUDIO_USER_DATA).trim());
  }
  const home = (env && (env.USERPROFILE || env.HOME)) || os.homedir();
  if (platform === "win32") {
    const appData = (env && env.APPDATA) || path.join(home, "AppData", "Roaming");
    return path.join(appData, "Antigravity");
  }
  if (platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Antigravity");
  }
  const xdg = (env && env.XDG_CONFIG_HOME) || path.join(home, ".config");
  return path.join(xdg, "Antigravity");
}

/**
 * Numeric semver comparison (returns > 0 if a > b, < 0 if a < b, 0 if equal).
 */
function compareSemver(a, b) {
  const parse = (v) => {
    const clean = String(v || "").trim().replace(/^v/i, "").split(/[-+]/)[0];
    const parts = clean.split(".").map((p) => {
      const n = parseInt(p, 10);
      return Number.isFinite(n) ? n : 0;
    });
    while (parts.length < 3) parts.push(0);
    return parts;
  };
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da - db;
  }
  return String(a || "").localeCompare(String(b || ""));
}

/**
 * Find app.asar.orig-* backups sorted newest semver first.
 */
function findBackups(resourcesDir) {
  if (!resourcesDir || !fs.existsSync(resourcesDir)) return [];
  const entries = fs.readdirSync(resourcesDir);
  const backups = [];
  for (const name of entries) {
    const m = name.match(/^app\.asar\.orig-(.+)$/);
    if (!m) continue;
    const fullPath = path.join(resourcesDir, name);
    try {
      const st = fs.statSync(fullPath);
      if (st.isFile() && st.size > 0) {
        backups.push({ name, version: m[1], path: fullPath, size: st.size });
      }
    } catch (_e) {}
  }
  backups.sort((x, y) => compareSemver(y.version, x.version));
  return backups;
}

/**
 * Detect Antigravity installation resources directory and version.
 */
function detectAntigravity(options = {}) {
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const homeDir = (env && (env.HOME || env.USERPROFILE)) || os.homedir();
  const candidates = [];

  if (env.ANTIGRAVITY_RESOURCES_DIR) {
    candidates.push(path.resolve(env.ANTIGRAVITY_RESOURCES_DIR));
  }

  if (platform === "win32") {
    const localApp = env.LOCALAPPDATA || path.join(homeDir, "AppData", "Local");
    const progFiles = env.ProgramFiles || "C:\\Program Files";
    const progFiles86 = env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    candidates.push(
      path.join(localApp, "Programs", "antigravity", "resources"),
      path.join(localApp, "Programs", "Antigravity", "resources"),
      path.join(localApp, "Antigravity", "resources"),
      path.join(progFiles, "antigravity", "resources"),
      path.join(progFiles, "Antigravity", "resources"),
      path.join(progFiles86, "antigravity", "resources")
    );
  } else if (platform === "darwin") {
    candidates.push(
      "/Applications/Antigravity.app/Contents/Resources",
      path.join(homeDir, "Applications", "Antigravity.app", "Contents", "Resources"),
      "/Applications/Google Antigravity.app/Contents/Resources",
      path.join(homeDir, "Applications", "Google Antigravity.app", "Contents", "Resources")
    );
  } else {
    candidates.push(
      "/usr/share/antigravity/resources",
      "/usr/lib/antigravity/resources",
      "/usr/lib64/antigravity/resources",
      "/usr/local/share/antigravity/resources",
      "/opt/Antigravity/resources",
      "/opt/antigravity/resources",
      "/opt/google/antigravity/resources",
      path.join(homeDir, ".local", "share", "antigravity", "resources"),
      path.join(homeDir, ".local", "share", "Antigravity", "resources"),
      path.join(homeDir, ".local", "opt", "antigravity", "resources"),
      path.join(homeDir, "Applications", "antigravity", "resources"),
      path.join(homeDir, "Applications", "Antigravity", "resources"),
      path.join(homeDir, ".local", "share", "flatpak", "app", "com.google.antigravity", "current", "active", "files", "antigravity", "resources"),
      "/var/lib/flatpak/app/com.google.antigravity/current/active/files/antigravity/resources",
      "/snap/antigravity/current/resources",
      "/snap/antigravity/current/opt/antigravity/resources"
    );
    if (platform === process.platform && !options.skipPathLookup) {
      try {
        const w = spawnSync("which", ["antigravity"], { encoding: "utf8", windowsHide: true });
        if (w && w.status === 0 && w.stdout && w.stdout.trim()) {
          const realBin = fs.realpathSync(w.stdout.trim());
          candidates.push(path.join(path.dirname(realBin), "resources"));
        }
      } catch (_e) {}
    }
  }

  const seen = new Set();
  for (const dir of candidates) {
    if (!dir) continue;
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    if (!fs.existsSync(resolved)) continue;

    const asarPath = path.join(resolved, "app.asar");
    const appDir = path.join(resolved, "app");
    const backups = findBackups(resolved);
    if (!fs.existsSync(asarPath) && !fs.existsSync(appDir) && backups.length === 0) continue;

    const rootDir = path.dirname(resolved);
    const versionCandidates = [
      path.join(rootDir, "version"),
      path.join(resolved, "version"),
    ];
    let versionFileText = "";
    let appVersion = "";
    for (const vf of versionCandidates) {
      try {
        if (fs.existsSync(vf)) {
          versionFileText = fs.readFileSync(vf, "utf8").trim();
          appVersion = versionFileText.split(/\s+/)[0] || "";
          if (appVersion) break;
        }
      } catch (_e) {}
    }

    let plistText = "";
    if (platform === "darwin") {
      try {
        const plistPath = path.join(rootDir, "Info.plist");
        if (fs.existsSync(plistPath)) {
          plistText = fs.readFileSync(plistPath, "utf8");
          if (!appVersion) {
            const shortM = /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/i.exec(plistText);
            const verM = /<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/i.exec(plistText);
            if (shortM && shortM[1]) appVersion = shortM[1].trim();
            else if (verM && verM[1]) appVersion = verM[1].trim();
          }
        }
      } catch (_e) {}
    }

    let shellVersion = "";
    const pkgCandidates = [
      path.join(appDir, "package.json"),
      path.join(resolved, "package.json"),
    ];
    for (const pkgPath of pkgCandidates) {
      try {
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          if (pkg && pkg.version) {
            shellVersion = String(pkg.version);
            break;
          }
        }
      } catch (_e) {}
    }

    if (!appVersion) appVersion = shellVersion || (backups[0] ? backups[0].version : "unknown");

    let exePath = "";
    let appBundlePath = "";
    if (platform === "win32") {
      const exe = path.join(rootDir, "Antigravity.exe");
      if (fs.existsSync(exe)) exePath = exe;
    } else if (platform === "darwin") {
      appBundlePath = path.dirname(rootDir);
      const macosDir = path.join(rootDir, "MacOS");
      if (fs.existsSync(macosDir)) {
        const darwinBinCandidates = [];
        if (plistText) {
          const execM = /<key>CFBundleExecutable<\/key>\s*<string>([^<]+)<\/string>/i.exec(plistText);
          if (execM && execM[1]) darwinBinCandidates.push(path.join(macosDir, execM[1].trim()));
        }
        darwinBinCandidates.push(
          path.join(macosDir, "Antigravity"),
          path.join(macosDir, "Google Antigravity")
        );
        for (const cand of darwinBinCandidates) {
          if (fs.existsSync(cand)) { exePath = cand; break; }
        }
        if (!exePath) {
          try {
            for (const f of fs.readdirSync(macosDir)) {
              const full = path.join(macosDir, f);
              try {
                if (fs.statSync(full).isFile()) { exePath = full; break; }
              } catch (_e) {}
            }
          } catch (_e) {}
        }
      }
      if (!exePath) exePath = appBundlePath;
    } else {
      const binCandidates = [
        path.join(rootDir, "antigravity"),
        path.join(rootDir, "Antigravity"),
        "/usr/bin/antigravity",
        "/usr/bin/Antigravity",
        "/usr/local/bin/antigravity",
        "/opt/antigravity/antigravity",
        "/opt/Antigravity/Antigravity",
        "/opt/google/antigravity/antigravity",
        path.join(homeDir, ".local", "share", "antigravity", "antigravity"),
      ];
      for (const b of binCandidates) {
        if (fs.existsSync(b)) { exePath = b; break; }
      }
      if (!exePath && platform === process.platform && !options.skipPathLookup) {
        try {
          const w = spawnSync("which", ["antigravity"], { encoding: "utf8", windowsHide: true });
          if (w && w.status === 0 && w.stdout && w.stdout.trim()) {
            exePath = w.stdout.trim();
          }
        } catch (_e) {}
      }
    }

    return {
      found: true,
      resourcesDir: resolved,
      rootDir,
      asarPath,
      appDir,
      exePath,
      appBundlePath,
      appVersion,
      versionFileText,
      shellVersion: shellVersion || appVersion,
      backups,
    };
  }

  return {
    found: false,
    resourcesDir: "",
    rootDir: "",
    asarPath: "",
    appDir: "",
    exePath: "",
    appBundlePath: "",
    appVersion: "",
    versionFileText: "",
    shellVersion: "",
    backups: [],
  };
}

/**
 * Read exact byte range from file descriptor (guards against partial readSync).
 */
function readExactSync(fd, length, position) {
  const buf = Buffer.allocUnsafe(length);
  let total = 0;
  while (total < length) {
    const n = fs.readSync(fd, buf, total, length - total, position + total);
    if (n <= 0) break;
    total += n;
  }
  return total === length ? buf : buf.subarray(0, total);
}

/**
 * Extract an Electron ASAR archive into outDir safely.
 */
function unpackAsar(asarPath, outDir) {
  const fd = fs.openSync(asarPath, "r");
  try {
    const pre = readExactSync(fd, 16, 0);
    if (pre.length < 16) throw new Error(`Corrupted ASAR header (too short): ${asarPath}`);
    const headerSize = pre.readUInt32LE(4);
    const jsonSize = pre.readUInt32LE(12);
    if (!headerSize || !jsonSize || jsonSize > 64 * 1024 * 1024) {
      throw new Error(`Invalid ASAR header sizes (${headerSize}/${jsonSize})`);
    }

    const headerBuf = readExactSync(fd, jsonSize, 16);
    const headerJson = JSON.parse(headerBuf.toString("utf8"));
    const dataOffset = 8 + headerSize;
    const resolvedOut = path.resolve(outDir);
    fs.mkdirSync(resolvedOut, { recursive: true });

    let fileCount = 0;
    const walk = (node, relDir) => {
      if (!node || typeof node.files !== "object") return;
      for (const [name, entry] of Object.entries(node.files)) {
        if (!name || name === "." || name === "..") continue;
        const target = path.resolve(resolvedOut, relDir, name);
        if (target !== resolvedOut && !target.startsWith(resolvedOut + path.sep)) {
          throw new Error(`Unsafe ASAR path traversal blocked: ${relDir}/${name}`);
        }
        if (entry && entry.files) {
          fs.mkdirSync(target, { recursive: true });
          walk(entry, path.join(relDir, name));
        } else if (entry && entry.link) {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          try {
            if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
            fs.symlinkSync(entry.link, target);
          } catch (_e) {}
        } else if (entry && typeof entry.size === "number") {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          if (entry.unpacked) {
            const unpackedSrc = path.join(asarPath + ".unpacked", relDir, name);
            if (fs.existsSync(unpackedSrc)) fs.copyFileSync(unpackedSrc, target);
          } else {
            const offset = parseInt(String(entry.offset || "0"), 10);
            const size = entry.size;
            if (size === 0) {
              fs.writeFileSync(target, Buffer.alloc(0));
            } else {
              const data = readExactSync(fd, size, dataOffset + offset);
              fs.writeFileSync(target, data);
            }
          }
          if (entry.executable && process.platform !== "win32") {
            try { fs.chmodSync(target, 0o755); } catch (_e) {}
          }
          fileCount += 1;
        }
      }
    };

    walk(headerJson, "");
    return fileCount;
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Strip leading `"use strict";` and ONLY trailing EOF `if (typeof module !== "undefined" && module.exports) { ... }` block.
 * Anchored with brace matching to EOF so mid-file blocks can never be truncated.
 */
function stripCjsPrologueEpilogue(source) {
  let text = String(source || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  text = text.replace(/^\s*(["'])use strict\1;\s*/i, "");

  const modRe = /\nif\s*\(\s*typeof\s+module\s*!==\s*(['"])undefined\1\s*&&\s*module\.exports\s*\)\s*\{/g;
  let lastMatch = null;
  let m;
  while ((m = modRe.exec(text)) !== null) {
    lastMatch = m;
  }
  if (!lastMatch) return text.trimEnd();

  const braceStart = lastMatch.index + lastMatch[0].length - 1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  let endPos = -1;

  for (let i = braceStart; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        endPos = i;
        break;
      }
    }
  }

  if (endPos !== -1) {
    const trailing = text.slice(endPos + 1).trim();
    if (!trailing) {
      text = text.slice(0, lastMatch.index);
    }
  }

  return text.trimEnd();
}

function resolveSourceCommitMeta(repoRoot = PLUGIN_ROOT) {
  let commitSha = extractCommitShaFromText(process.env.RUDEX_COMMIT_SHA || "");
  if (!commitSha && Array.isArray(process.argv)) {
    for (let i = 0; i < process.argv.length; i += 1) {
      const arg = String(process.argv[i] || "");
      if (arg.startsWith("--commit-sha=")) {
        commitSha = extractCommitShaFromText(arg.slice("--commit-sha=".length));
        if (commitSha) break;
      }
    }
  }
  if (!commitSha && process.env.RUDEX_ZIP_PATH) {
    commitSha = extractCommitShaFromText(readZipEocdComment(process.env.RUDEX_ZIP_PATH));
  }
  const gitMeta = readGitHeadMeta(repoRoot);
  if (!commitSha && gitMeta.commitSha) {
    commitSha = gitMeta.commitSha;
  }
  const commitDate = String(process.env.RUDEX_COMMIT_DATE || gitMeta.commitDate || "").trim();
  return {
    commitSha,
    commitShort: commitSha ? commitSha.slice(0, 7) : "",
    commitDate,
  };
}

function readPluginMeta(resourcesDir = RESOURCES_SRC_DIR, pluginJsonPath = PLUGIN_JSON_PATH) {
  let pkg = {};
  try {
    pkg = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
  } catch (_e) {}

  let dictEntries = 0;
  try {
    const dict = JSON.parse(fs.readFileSync(path.join(resourcesDir, "dictionary-ru.json"), "utf8"));
    dictEntries = Object.keys(dict).length;
  } catch (_e) {}

  let dynamicRulesCount = 0;
  try {
    const dyn = require(path.join(resourcesDir, "dynamic-rules-ru.js"));
    if (Array.isArray(dyn.DYNAMIC_RULES)) dynamicRulesCount = dyn.DYNAMIC_RULES.length;
  } catch (_e) {}

  const commitMeta = resolveSourceCommitMeta(path.dirname(pluginJsonPath));

  return {
    name: pkg.name || "rudex",
    displayName: pkg.displayName || "Rudex",
    version: pkg.version || "5.5.6",
    dictEntries,
    dynamicRulesCount,
    commitSha: commitMeta.commitSha,
    commitShort: commitMeta.commitShort,
    commitDate: commitMeta.commitDate,
  };
}

/**
 * Assemble the sandboxed renderer preload bundle from Rudex resources.
 */
function buildPreloadSnippet(resourcesDir = RESOURCES_SRC_DIR, pluginMeta = readPluginMeta(resourcesDir)) {
  const dictPath = path.join(resourcesDir, "dictionary-ru.json");
  const dictRaw = fs.readFileSync(dictPath, "utf8");
  const dictParsed = JSON.parse(dictRaw);
  const dictJson = JSON.stringify(dictParsed);

  const loadStripped = (file) => stripCjsPrologueEpilogue(fs.readFileSync(path.join(resourcesDir, file), "utf8"));

  const dynSrc = loadStripped("dynamic-rules-ru.js");
  const domSrc = loadStripped("dom-translator.js");
  const telSrc = loadStripped("telemetry-engine.js");
  const themeSrc = loadStripped("theme-engine.js");
  const stylesSrc = loadStripped("studio-styles.js");
  const v5CorePath = path.join(resourcesDir, "rudex-v5-core.js");
  const v5CoreSrc = fs.existsSync(v5CorePath) ? loadStripped("rudex-v5-core.js") : "";
  const v5UiPath = path.join(resourcesDir, "rudex-v5-ui.js");
  const v5UiSrc = fs.existsSync(v5UiPath) ? loadStripped("rudex-v5-ui.js") : "";
  const annPath = path.join(resourcesDir, "rudex-annotator.js");
  const annSrc = fs.existsSync(annPath) ? loadStripped("rudex-annotator.js") : "";
  const optPath = path.join(resourcesDir, "rudex-optimizer.js");
  const optSrc = fs.existsSync(optPath) ? loadStripped("rudex-optimizer.js") : "";
  const panelSrc = loadStripped("studio-panel.js");

  const snippet = [
    "// === RUDEX_I18N_START ===",
    `;(() => {`,
    `"use strict";`,
    `try {`,
    `const _ipc = (typeof electron_1 !== "undefined" && electron_1 && electron_1.ipcRenderer) || (typeof require === "function" ? require("electron").ipcRenderer : null);`,
    `const _webFrame = (typeof electron_1 !== "undefined" && electron_1 && electron_1.webFrame) || (typeof require === "function" ? require("electron").webFrame : null);`,
    `if (!_ipc || typeof document === "undefined") return;`,
    dynSrc,
    `const DICT = ${dictJson};`,
    domSrc,
    telSrc,
    `const STUDIO_META = ${JSON.stringify(pluginMeta)};`,
    themeSrc,
    stylesSrc,
    v5CoreSrc,
    v5UiSrc,
    annSrc,
    optSrc,
    panelSrc,
    `const _rawBootLocale = (() => { try { return _ipc.sendSync("agy-i18n:get-locale-sync"); } catch (_e) { return "ru"; } })();`,
    `if (_rawBootLocale === "__disabled__") return;`,
    `const _bootLocale = _rawBootLocale === "en" ? "en" : "ru";`,
    `const _voiceBoot = (() => { try { return _ipc.sendSync("agy-studio:get-voice-boot-sync"); } catch (_e) { return null; } })();`,
    `const _bootState = (() => { try { return _ipc.sendSync("agy-studio:get-boot-state-sync"); } catch (_e) { return null; } })();`,
    `if (typeof bootMainWorldVoiceEarly === "function") { try { bootMainWorldVoiceEarly({ window: typeof window !== "undefined" ? window : globalThis, webFrame: _webFrame, ipcRenderer: _ipc, boot: _voiceBoot, locale: _bootLocale }); } catch (_e) {} }`,
    `const _translator = createDomTranslator({ document, window: typeof window !== "undefined" ? window : globalThis, dictionary: DICT, applyDynamicRules: typeof applyDynamicRules === "function" ? applyDynamicRules : () => null, initialLocale: _bootLocale, initialGreeting: _bootState && _bootState.greeting ? _bootState.greeting : null, initialCustomLabels: _bootState && Array.isArray(_bootState.customLabels) ? _bootState.customLabels : [] });`,
    `const _studioPanel = createStudioPanel({ document, window: typeof window !== "undefined" ? window : globalThis, ipcRenderer: _ipc, webFrame: _webFrame, translator: _translator, initialLocale: _bootLocale, initialBoot: _bootState, pluginMeta: STUDIO_META, buildStyles: typeof buildStudioStyles === "function" ? buildStudioStyles : null });`,
    `if (_bootState && typeof _studioPanel.bootEarlyTheme === "function") { try { _studioPanel.bootEarlyTheme(); } catch (_e) {} }`,
    `_ipc.on("agy-studio:local-voice-progress", (_event, payload) => { try { if (typeof _studioPanel.applyLocalVoiceProgress === "function") _studioPanel.applyLocalVoiceProgress(payload); } catch (_e) {} });`,
    `_ipc.on("agy-i18n:locale-changed", (_event, nextLocale) => { try { _translator.setLocale(nextLocale); } catch (_e) {} try { _studioPanel.setLocale(nextLocale); } catch (_e) {} });`,
    `_ipc.on("agy-studio:toggle-panel", () => { try { _studioPanel.toggleOpen(); } catch (_e) {} });`,
    `_ipc.on("agy-studio:toggle-live-edit", () => { try { _studioPanel.toggleLiveEditPopover(); } catch (_e) {} });`,
    `_ipc.on("agy-studio:hotkey-action", (_event, payload) => { try { if (typeof _studioPanel.handleHotkeyAction === "function") _studioPanel.handleHotkeyAction(payload && payload.action); } catch (_e) {} });`,
    `_ipc.on("agy-studio:live-edits-changed", (_event, payload) => { try { _studioPanel.applyLiveEditsUpdate(payload); } catch (_e) {} });`,
    `_ipc.on("agy-studio:settings-changed", (_event, nextState) => { try { _studioPanel.applyRemoteState(nextState); } catch (_e) {} });`,
    `_ipc.on("agy-studio:quota-updated", (_event, summary) => { try { if (typeof _studioPanel.applyQuotaSummary === "function") _studioPanel.applyQuotaSummary(summary); } catch (_e) {} });`,
    `_ipc.on("agy-studio:quota-restored", (_event, payload) => { try { if (typeof _studioPanel.handleQuotaRestored === "function") _studioPanel.handleQuotaRestored(payload); } catch (_e) {} });`,
    `_ipc.on("agy-studio:notification-clicked", (_event, payload) => { try { if (typeof _studioPanel.handleNotificationClicked === "function") _studioPanel.handleNotificationClicked(payload); } catch (_e) {} });`,
    `_ipc.on("agy-studio:update-status", (_event, payload) => { try { _studioPanel.applyUpdateStatus(payload); } catch (_e) {} });`,
    `_ipc.on("agy-studio:plugin-removed", () => { try { if (typeof _studioPanel.destroy === "function") _studioPanel.destroy(); } catch (_e) {} try { if (typeof _translator.setCustomLabels === "function") _translator.setCustomLabels([]); if (typeof _translator.setGreetingConfig === "function") _translator.setGreetingConfig({ enabled: false }); if (typeof _translator.setLocale === "function") _translator.setLocale("en"); if (typeof _translator.destroy === "function") _translator.destroy(); } catch (_e) {} try { if (_webFrame && typeof _webFrame.setZoomFactor === "function") _webFrame.setZoomFactor(1); } catch (_e) {} try { if (_webFrame && typeof _webFrame.executeJavaScript === "function") _webFrame.executeJavaScript("try{if(window.__RUDEX_VOICE_PATCH__){window.__RUDEX_VOICE_PATCH__.enabled=false;window.__RUDEX_VOICE_PATCH__.disabled=true;}}catch(_e){}").catch(() => {}); } catch (_e) {} });`,
    `const _bootRudex = () => { try { if (_bootState && typeof _studioPanel.bootEarlyTheme === "function") _studioPanel.bootEarlyTheme(); } catch (_e) {} try { _translator.init(); _translator.translateDocument(); } catch (_e) {} try { _studioPanel.init(); } catch (_e) {} };`,
    `if (document.readyState === "loading") { if (document.documentElement) { try { _translator.init(); } catch (_e) {} } document.addEventListener("DOMContentLoaded", _bootRudex, { once: true }); } else { _bootRudex(); }`,
    `} catch (err) { console.error("[Rudex] Preload initialization failed:", err); }`,
    `})();`,
    "// === RUDEX_I18N_END ===",
  ].join("\n\n");

  // Validate syntax at build time
  new vm.Script(snippet, { filename: "rudex-preload-bundle.js" });
  return snippet;
}

function copyI18nDataFiles(distDir, resourcesDir = RESOURCES_SRC_DIR, scriptsDir = SCRIPTS_SRC_DIR) {
  const dataDir = path.join(distDir, "i18nData");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.copyFileSync(path.join(resourcesDir, "dictionary-ru.json"), path.join(dataDir, "dictionary-ru.json"));
  fs.copyFileSync(path.join(resourcesDir, "dynamic-rules-ru.js"), path.join(dataDir, "dynamic-rules-ru.js"));
  fs.copyFileSync(path.join(scriptsDir, "zip-builder.js"), path.join(dataDir, "zip-builder.js"));
  fs.copyFileSync(path.join(scriptsDir, "updater-core.js"), path.join(dataDir, "updater-core.js"));
  fs.copyFileSync(path.join(scriptsDir, "thinking-translator.js"), path.join(dataDir, "thinking-translator.js"));
  const wsPath = path.join(scriptsDir, "agy-workshop.js");
  if (fs.existsSync(wsPath)) {
    fs.copyFileSync(wsPath, path.join(dataDir, "agy-workshop.js"));
  }
  const perfPath = path.join(scriptsDir, "perf-cache-engine.js");
  if (fs.existsSync(perfPath)) {
    fs.copyFileSync(perfPath, path.join(dataDir, "perf-cache-engine.js"));
  }
  const lvPath = path.join(scriptsDir, "local-voice-engine.js");
  if (fs.existsSync(lvPath)) {
    fs.copyFileSync(lvPath, path.join(dataDir, "local-voice-engine.js"));
  }
}

function hasSystemNode() {
  try {
    const cmd = process.platform === "win32" ? "where.exe" : "which";
    const res = spawnSync(cmd, ["node"], { stdio: "ignore", windowsHide: true });
    return res.status === 0;
  } catch (_e) {
    return false;
  }
}

const RETRYABLE_FS_CODES = new Set(["EPERM", "EBUSY", "EACCES", "ENOTEMPTY"]);

function sleepSync(ms) {
  const delay = Math.max(10, Math.min(2000, Math.round(Number(ms) || 50)));
  try {
    const buf = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(buf, 0, 0, delay);
    return;
  } catch (_e) {}
  const end = Date.now() + delay;
  while (Date.now() < end) {}
}

function ensureDirSafe(dirPath) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      if (fs.existsSync(dirPath)) {
        const st = fs.statSync(dirPath);
        if (st.isDirectory()) return;
      }
    } catch (_e) {}
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return;
    } catch (err) {
      if (err && err.code === "EEXIST") {
        try {
          if (fs.statSync(dirPath).isDirectory()) return;
        } catch (_e2) {}
      }
      if (!err || !RETRYABLE_FS_CODES.has(err.code) || attempt === 7) {
        if (err && RETRYABLE_FS_CODES.has(err.code) && process.platform === "win32") {
          err.message =
            `${err.message} (Windows NTFS lock / DELETE_PENDING on "${dirPath}". ` +
            `Close Antigravity and any Explorer or terminal windows opened inside plugins\\rudex, then re-run the installer.)`;
        } else if (err && (err.code === "EACCES" || err.code === "EROFS") && process.platform !== "win32") {
          err.message =
            `${err.message} (Insufficient permissions or read-only filesystem on "${dirPath}". ` +
            `Run install.sh with sudo support or extract AppImage and set ANTIGRAVITY_RESOURCES_DIR.)`;
        }
        throw err;
      }
      sleepSync(120 * (attempt + 1));
    }
  }
}

function copyFileSafe(srcPath, destPath) {
  ensureDirSafe(path.dirname(destPath));
  let lastErr = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.copyFileSync(srcPath, destPath);
      return;
    } catch (err) {
      lastErr = err;
      if (!err || !RETRYABLE_FS_CODES.has(err.code)) throw err;
      try {
        if (fs.existsSync(destPath)) {
          try { fs.chmodSync(destPath, 0o666); } catch (_c) {}
          const srcBuf = fs.readFileSync(srcPath);
          try {
            const dstBuf = fs.readFileSync(destPath);
            if (Buffer.compare(srcBuf, dstBuf) === 0) return;
          } catch (_r) {}
          fs.writeFileSync(destPath, srcBuf);
          return;
        }
      } catch (_w) {}
      if (attempt < 5) sleepSync(100 * (attempt + 1));
    }
  }
  throw lastErr;
}

function copyDirRecursiveSync(src, dest) {
  ensureDirSafe(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursiveSync(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      try {
        const link = fs.readlinkSync(srcPath);
        if (fs.existsSync(destPath)) fs.rmSync(destPath, { force: true });
        fs.symlinkSync(link, destPath);
      } catch (_e) {
        copyFileSafe(srcPath, destPath);
      }
    } else {
      copyFileSafe(srcPath, destPath);
    }
  }
}

function pruneObsoleteEntries(destDir, srcDir) {
  try {
    if (!fs.existsSync(destDir)) return;
    const entries = fs.readdirSync(destDir, { withFileTypes: true });
    for (let i = 0; i < entries.length; i += 1) {
      const ent = entries[i];
      const destChild = path.join(destDir, ent.name);
      const srcChild = srcDir ? path.join(srcDir, ent.name) : "";
      if (ent.isDirectory()) {
        if (!srcChild || !fs.existsSync(srcChild)) {
          try { fs.rmSync(destChild, { recursive: true, force: true }); } catch (_e) {}
        } else {
          pruneObsoleteEntries(destChild, srcChild);
        }
      } else if (!srcChild || !fs.existsSync(srcChild)) {
        try { fs.unlinkSync(destChild); } catch (_e) {}
      }
    }
  } catch (_e) {}
}

function verifyJsFilesSyntax(files) {
  for (const file of files) {
    if (!fs.existsSync(file)) throw new Error(`Missing output file for syntax check: ${file}`);
    const code = fs.readFileSync(file, "utf8");
    new vm.Script(code, { filename: path.basename(file) });
  }
}

/**
 * Sync Rudex plugin files to ~/.gemini/config/plugins/rudex and migrate/remove legacy antigravity-ru plugin.
 * Copies in-place without deleting target directories first to avoid Windows 10 NTFS DELETE_PENDING (EPERM) locks.
 */
function syncPluginToGlobalConfig(repoRoot = PLUGIN_ROOT) {
  const pluginsBase = path.join(os.homedir(), ".gemini", "config", "plugins");
  const targetDir = path.join(pluginsBase, "rudex");
  const legacyDir = path.join(pluginsBase, "antigravity-ru");
  const resolvedRepo = path.resolve(repoRoot);
  const resolvedTarget = path.resolve(targetDir);
  const isSameDir = (process.platform === "win32" || process.platform === "darwin")
    ? resolvedRepo.toLowerCase() === resolvedTarget.toLowerCase()
    : resolvedRepo === resolvedTarget;

  if (!isSameDir) {
    const targetRulePath = path.join(targetDir, "rules", "AGENTS.md");
    const legacyRulePath = path.join(legacyDir, "rules", "AGENTS.md");
    let preservedRuleContent = null;
    if (fs.existsSync(targetRulePath)) {
      preservedRuleContent = fs.readFileSync(targetRulePath, "utf8");
    } else if (fs.existsSync(legacyRulePath)) {
      preservedRuleContent = fs.readFileSync(legacyRulePath, "utf8");
    }

    ensureDirSafe(targetDir);

    copyFileSafe(path.join(repoRoot, "plugin.json"), path.join(targetDir, "plugin.json"));

    const assetsSrc = path.join(repoRoot, "assets");
    if (fs.existsSync(assetsSrc)) {
      const assetsDest = path.join(targetDir, "assets");
      copyDirRecursiveSync(assetsSrc, assetsDest);
      pruneObsoleteEntries(assetsDest, assetsSrc);
    }

    const skillSrc = path.join(repoRoot, "skills", "rudex");
    const targetSkillsDir = path.join(targetDir, "skills");
    const skillDest = path.join(targetSkillsDir, "rudex");
    copyDirRecursiveSync(skillSrc, skillDest);
    // Prune obsolete files/subdirs after in-place update without removing active directories first
    pruneObsoleteEntries(skillDest, skillSrc);
    pruneObsoleteEntries(targetSkillsDir, path.join(repoRoot, "skills"));

    if (preservedRuleContent !== null) {
      ensureDirSafe(path.dirname(targetRulePath));
      fs.writeFileSync(targetRulePath, preservedRuleContent, "utf8");
    }
  }

  if (process.platform !== "win32") {
    const execFiles = [
      path.join(targetDir, "skills", "rudex", "scripts", "hook-runner.sh"),
      path.join(targetDir, "skills", "rudex", "scripts", "install.js"),
      path.join(targetDir, "skills", "rudex", "scripts", "uninstall.js"),
      path.join(targetDir, "skills", "rudex", "scripts", "rudex-hook.js"),
    ];
    for (const ef of execFiles) {
      try {
        if (fs.existsSync(ef)) fs.chmodSync(ef, 0o755);
      } catch (_e) {}
    }
  }

  // Sync hooks.json (using hook-runner fallback on Windows/Linux without global node, and always on macOS where GUI PATH omits Homebrew/nvm)
  // Stock hooks.json omits PreToolUse by default for zero per-tool process overhead; only include it if user already has an active tool-blocking policy.
  const hooksObj = JSON.parse(fs.readFileSync(path.join(repoRoot, "hooks.json"), "utf8"));
  try {
    const toolPolicyFlag = path.join(getUserDataDir(), "agy_studio_tool_policy.flag");
    if (fs.existsSync(toolPolicyFlag) && hooksObj && hooksObj["rudex-studio"] && !hooksObj["rudex-studio"].PreToolUse) {
      hooksObj["rudex-studio"].PreToolUse = [
        {
          matcher: "search_web|read_url_content|web_search|invoke_subagent|browser_.*|call_mcp_tool|write_file|edit_file|replace_file_content|multi_replace_file_content|write_to_file",
          hooks: [
            {
              type: "command",
              command: "node ./skills/rudex/scripts/rudex-hook.js",
              timeout: 5,
            },
          ],
        },
      ];
    }
  } catch (_e) {}
  const needsHookRunner = process.platform === "darwin" || !hasSystemNode();
  if (needsHookRunner && hooksObj && typeof hooksObj === "object") {
    const targetCmd = process.platform === "win32"
      ? "cmd /c skills\\rudex\\scripts\\hook-runner.cmd"
      : "sh ./skills/rudex/scripts/hook-runner.sh";
    const rewriteHookCmd = (entry) => {
      if (entry && typeof entry.command === "string" && /rudex-hook\.js\b/.test(entry.command)) {
        entry.command = targetCmd;
      }
    };
    for (const group of Object.values(hooksObj)) {
      if (!group || typeof group !== "object") continue;
      for (const hookList of Object.values(group)) {
        if (!Array.isArray(hookList)) continue;
        for (const item of hookList) {
          rewriteHookCmd(item);
          if (item && Array.isArray(item.hooks)) {
            for (const sub of item.hooks) rewriteHookCmd(sub);
          }
        }
      }
    }
  }
  fs.writeFileSync(path.join(targetDir, "hooks.json"), JSON.stringify(hooksObj, null, 2) + "\n", "utf8");

  // Migrate and remove legacy antigravity-ru plugin so hooks never double-fire
  if (fs.existsSync(legacyDir) && path.resolve(legacyDir) !== path.resolve(targetDir)) {
    try {
      fs.rmSync(legacyDir, { recursive: true, force: true });
      console.log(`LEGACY_PLUGIN_REMOVED=${legacyDir}`);
    } catch (err) {
      console.warn(`Warning: failed to remove legacy plugin dir ${legacyDir}:`, err.message);
    }
  }

  // Write install commit metadata inside ~/.gemini/config/plugins/rudex/.rudex-install-meta.json
  try {
    let pkgVer = "5.5.6";
    try {
      const repoPkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "plugin.json"), "utf8"));
      if (repoPkg && typeof repoPkg.version === "string" && repoPkg.version.trim()) {
        pkgVer = repoPkg.version.trim();
      }
    } catch (_e) {}
    const commitMeta = resolveSourceCommitMeta(repoRoot);
    fs.writeFileSync(
      path.join(targetDir, ".rudex-install-meta.json"),
      JSON.stringify(
        {
          version: pkgVer,
          commitSha: commitMeta.commitSha || "",
          commitShort: commitMeta.commitShort || "",
          commitDate: commitMeta.commitDate || "",
          installedAt: new Date().toISOString(),
        },
        null,
        2
      ) + "\n",
      "utf8"
    );
  } catch (_e) {}

  console.log(`PLUGIN_SYNCED=${targetDir}`);
  return targetDir;
}

/**
 * Deploy staging directory into resources/app, falling back to recursive overwrite if directory swap hits Windows lock.
 */
function deployStagedApp(stagingDir, appDir) {
  const backupOldDir = `${appDir}.rudex-prev-${Date.now()}`;
  let swapped = false;
  if (fs.existsSync(appDir)) {
    try {
      fs.renameSync(appDir, backupOldDir);
      fs.renameSync(stagingDir, appDir);
      swapped = true;
    } catch (_e) {
      if (fs.existsSync(backupOldDir) && !fs.existsSync(appDir)) {
        try { fs.renameSync(backupOldDir, appDir); } catch (_e2) {}
      }
    }
  } else {
    try {
      fs.renameSync(stagingDir, appDir);
      swapped = true;
    } catch (_e) {}
  }

  if (swapped) {
    if (fs.existsSync(backupOldDir)) {
      try { fs.rmSync(backupOldDir, { recursive: true, force: true }); } catch (_e) {}
    }
    return;
  }

  copyDirRecursiveSync(stagingDir, appDir);
  try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch (_e) {}
}

/**
 * Compute SHA-256 hex digest of a file (chunked to keep memory bounded on large app.asar files).
 */
function hashFileSha256(filePath) {
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.allocUnsafe(256 * 1024);
    while (true) {
      const n = fs.readSync(fd, buf, 0, buf.length, null);
      if (n <= 0) break;
      hash.update(n === buf.length ? buf : buf.subarray(0, n));
    }
    return hash.digest("hex");
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Prepare unpatched clean source ASAR and build patched app in a staging directory.
 * Always detects content changes (via SHA-256) so third-party patches (e.g. region unblockers)
 * applied to app.asar — even same-byte-length in-place patches — are faithfully preserved.
 */
function buildPatchedStaging(info, preloadSnippet, pluginMeta, stagingDir, opts = {}) {
  const dryRun = Boolean(opts && opts.dryRun);
  let cleanAsarPath = info.backups[0] ? info.backups[0].path : "";
  let asarLocked = false;
  let sourceAsarHash = "";
  let sourceAsarSize = 0;
  let sourceAsarMtimeSec = 0;
  let sourceAsarSig = "";

  if (dryRun) {
    if (!cleanAsarPath && fs.existsSync(info.asarPath)) {
      cleanAsarPath = info.asarPath;
    }
  } else if (fs.existsSync(info.asarPath)) {
    try {
      const st = fs.statSync(info.asarPath);
      sourceAsarSize = st.size || 0;
      sourceAsarMtimeSec = Math.floor((st.mtimeMs || 0) / 1000);
      sourceAsarHash = hashFileSha256(info.asarPath);
      sourceAsarSig = `${info.appVersion || "unknown"}:${sourceAsarSize}:${sourceAsarMtimeSec}`;
    } catch (_e) {}

    const newBackupPath = path.join(info.resourcesDir, `app.asar.orig-${info.appVersion || "unknown"}`);
    if (!fs.existsSync(newBackupPath)) {
      try {
        fs.renameSync(info.asarPath, newBackupPath);
      } catch (err) {
        if (err && (err.code === "EBUSY" || err.code === "EPERM")) {
          copyFileSafe(info.asarPath, newBackupPath);
          asarLocked = true;
        } else {
          throw err;
        }
      }
      cleanAsarPath = newBackupPath;
    } else {
      try {
        let differs = true;
        if (sourceAsarHash) {
          try {
            differs = hashFileSha256(newBackupPath) !== sourceAsarHash;
          } catch (_e) {
            differs = true;
          }
        }
        if (differs) {
          copyFileSafe(info.asarPath, newBackupPath);
        }
      } catch (err) {
        if (!err || (err.code !== "EBUSY" && err.code !== "EPERM")) {
          throw err;
        }
      }
      try {
        fs.unlinkSync(info.asarPath);
      } catch (err) {
        if (err && (err.code === "EBUSY" || err.code === "EPERM")) {
          asarLocked = true;
        } else {
          throw err;
        }
      }
      cleanAsarPath = newBackupPath;
    }
  }

  if (!cleanAsarPath || !fs.existsSync(cleanAsarPath)) {
    throw new Error("Neither app.asar nor app.asar.orig-* backup found in Antigravity resources.");
  }

  if (!sourceAsarHash && !dryRun) {
    try {
      const st = fs.statSync(cleanAsarPath);
      sourceAsarSize = st.size || 0;
      sourceAsarMtimeSec = Math.floor((st.mtimeMs || 0) / 1000);
      sourceAsarHash = hashFileSha256(cleanAsarPath);
    } catch (_e) {}
  }

  if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  const unpackedCount = unpackAsar(cleanAsarPath, stagingDir);
  const stampVersion = info.appVersion || "custom";
  const patchResult = patchElectronShell(stagingDir, preloadSnippet, { stampVersion });

  const distDir = path.join(stagingDir, "dist");
  copyI18nDataFiles(distDir, RESOURCES_SRC_DIR, SCRIPTS_SRC_DIR);

  const syntaxTargets = [
    path.join(distDir, "main.js"),
    path.join(distDir, "i18nMain.js"),
    path.join(distDir, "preload.js"),
    path.join(distDir, "i18nData", "dynamic-rules-ru.js"),
    path.join(distDir, "i18nData", "zip-builder.js"),
    path.join(distDir, "i18nData", "updater-core.js"),
    path.join(distDir, "i18nData", "thinking-translator.js"),
    path.join(distDir, "i18nData", "agy-workshop.js"),
    path.join(distDir, "i18nData", "perf-cache-engine.js"),
    path.join(distDir, "i18nData", "local-voice-engine.js"),
  ];
  for (const optDistFile of ["languageServer.js", "storage.js"]) {
    const fullOpt = path.join(distDir, optDistFile);
    if (fs.existsSync(fullOpt)) syntaxTargets.push(fullOpt);
  }
  verifyJsFilesSyntax(syntaxTargets);

  return {
    unpackedCount,
    patchResult,
    cleanAsarPath,
    stampVersion,
    asarLocked,
    sourceAsarHash,
    sourceAsarSize,
    sourceAsarMtimeSec,
    sourceAsarSig,
  };
}

function runDryRun() {
  const info = detectAntigravity();
  if (!info.found) {
    console.error("Antigravity installation not detected.");
    process.exit(1);
  }
  const pluginMeta = readPluginMeta();
  const preloadSnippet = buildPreloadSnippet(RESOURCES_SRC_DIR, pluginMeta);
  const tmpStage = path.join(os.tmpdir(), `rudex-dryrun-${process.pid}-${Date.now()}`);
  try {
    const { unpackedCount, patchResult, cleanAsarPath } = buildPatchedStaging(info, preloadSnippet, pluginMeta, tmpStage, { dryRun: true });
    console.log(`Dry-run source ASAR: ${cleanAsarPath}`);
    console.log(`Unpacked files: ${unpackedCount}, Patched files: ${patchResult.patchedFiles.length}, Warnings: ${patchResult.warnings.length}`);
    for (const w of patchResult.warnings) {
      console.warn(`WARNING: ${w}`);
    }
    if (patchResult.warnings.length > 0) {
      console.error("Dry-run FAILED: warnings detected.");
      process.exit(1);
    }
    console.log("Syntax verification (vm.Script) PASSED.");
    console.log("Dry-run PASSED.");
  } finally {
    try { fs.rmSync(tmpStage, { recursive: true, force: true }); } catch (_e) {}
  }
}

function writeApplyRestartCmd(info, opts = {}) {
  if (process.platform !== "win32" || !info.exePath) return "";
  const outPath = opts.outPath || path.join(os.homedir(), "Desktop", "Rudex-Apply-Restart.cmd");
  const removeAsar = Boolean(opts.removeAsar);
  // Use `ping -n` instead of cmd `timeout` so detached stdio:"ignore" runs never abort early on Windows
  const lines = [
    "@echo off",
    "chcp 65001 >nul",
    `set "AGY_EXE=${info.exePath}"`,
    `set "RES_DIR=${info.resourcesDir}"`,
    "setlocal EnableDelayedExpansion",
    "echo Restarting Antigravity to apply Rudex...",
    "taskkill /IM Antigravity.exe >nul 2>&1",
    "ping -n 3 127.0.0.1 >nul",
    "taskkill /F /IM Antigravity.exe >nul 2>&1",
    "for /L %%I in (1,1,12) do (",
    '  tasklist /FI "IMAGENAME eq Antigravity.exe" 2>nul | find /I "Antigravity.exe" >nul',
    "  if errorlevel 1 goto after_exit",
    "  ping -n 2 127.0.0.1 >nul",
    ")",
    ":after_exit",
  ];
  if (removeAsar && info.resourcesDir) {
    lines.push(
      'if exist "!RES_DIR!\\app.asar.orig-*" if exist "!RES_DIR!\\app" (',
      "  for /L %%R in (1,1,6) do (",
      '    if not exist "!RES_DIR!\\app.asar" goto launch_app',
      '    del /F /Q "!RES_DIR!\\app.asar" >nul 2>&1',
      '    if exist "!RES_DIR!\\app.asar" ping -n 2 127.0.0.1 >nul',
      "  )",
      ")"
    );
  }
  lines.push(
    ":launch_app",
    'start "" "!AGY_EXE!"',
    'del "%~f0" >nul 2>&1',
    ""
  );
  const script = lines.join("\r\n");
  try {
    fs.writeFileSync(outPath, script, "utf8");
    return outPath;
  } catch (_e) {
    return "";
  }
}

/**
 * Passive Windows exit watcher: NEVER kills Antigravity.exe.
 * Waits until Antigravity exits cleanly on its own, then removes the unlocked stale app.asar.
 * Uses `ping -n` (never cmd timeout) so it works reliably when spawned with stdio:"ignore".
 */
function writeOnExitActivateCmd(info, opts = {}) {
  if (process.platform !== "win32" || !info || !info.resourcesDir) return "";
  const outPath = opts.outPath || path.join(os.tmpdir(), "rudex-on-exit-activate.cmd");
  const lockPath = opts.lockPath || path.join(os.tmpdir(), "rudex-on-exit-activate.lock");
  const lines = [
    "@echo off",
    "chcp 65001 >nul",
    `set "RES_DIR=${info.resourcesDir}"`,
    `set "LOCK_FILE=${lockPath}"`,
    "setlocal EnableDelayedExpansion",
    "for /L %%I in (1,1,3600) do (",
    '  if not exist "!RES_DIR!\\app.asar" goto cleanup',
    '  tasklist /FI "IMAGENAME eq Antigravity.exe" 2>nul | find /I "Antigravity.exe" >nul',
    "  if errorlevel 1 goto unlock",
    "  ping -n 3 127.0.0.1 >nul",
    ")",
    "goto cleanup",
    ":unlock",
    "ping -n 2 127.0.0.1 >nul",
    'if exist "!RES_DIR!\\app.asar.orig-*" if exist "!RES_DIR!\\app\\rudex-patch-meta.json" (',
    "  for /L %%R in (1,1,6) do (",
    '    if not exist "!RES_DIR!\\app.asar" goto cleanup',
    '    del /F /Q "!RES_DIR!\\app.asar" >nul 2>&1',
    '    if exist "!RES_DIR!\\app.asar" ping -n 2 127.0.0.1 >nul',
    "  )",
    ")",
    ":cleanup",
    'if exist "!LOCK_FILE!" del /F /Q "!LOCK_FILE!" >nul 2>&1',
    'del "%~f0" >nul 2>&1',
    "",
  ];
  try {
    fs.writeFileSync(outPath, lines.join("\r\n"), "utf8");
    return outPath;
  } catch (_e) {
    return "";
  }
}

/**
 * Invisible WSH JScript passive exit watcher (runs under wscript.exe WINDOWS_GUI subsystem).
 * - NEVER opens a console, cmd.exe, PowerShell, or Windows Terminal window.
 * - NEVER kills Antigravity.exe.
 * - Waits silently via WScript.Sleep + WMI until Antigravity exits on its own.
 * - If app.asar still matches the staged snapshot -> deletes app.asar so next boot uses Rudex.
 * - If app.asar was changed after staging (e.g. third-party unblocker/patcher) -> waits for write
 *   stability and silently re-layers Rudex on top of the new app.asar via SW_HIDE.
 */
function writeOnExitActivateWsh(info, opts = {}) {
  if (process.platform !== "win32" || !info || !info.resourcesDir) return "";
  const outPath = opts.outPath || path.join(os.tmpdir(), "rudex-on-exit-activate.js");
  const lockPath = opts.lockPath || path.join(os.tmpdir(), "rudex-on-exit-activate.lock");
  const installJs = opts.installJs || path.join(os.homedir(), ".gemini", "config", "plugins", "rudex", "skills", "rudex", "scripts", "install.js");
  const exePath = (info && info.exePath) || "";
  const expectedSize = Number(opts.expectedAsarSize) || 0;
  const expectedMtimeSec = Number(opts.expectedAsarMtimeSec) || 0;
  const lines = [
    "var fso = new ActiveXObject('Scripting.FileSystemObject');",
    "var sh = new ActiveXObject('WScript.Shell');",
    `var resDir = ${wshEscapeJsString(info.resourcesDir)};`,
    `var lockFile = ${wshEscapeJsString(lockPath)};`,
    `var installJs = ${wshEscapeJsString(installJs)};`,
    `var agyExe = ${wshEscapeJsString(exePath)};`,
    `var expectedSize = ${expectedSize};`,
    `var expectedMtimeSec = ${expectedMtimeSec};`,
    "var asarPath = resDir + '\\\\app.asar';",
    "var metaPath = resDir + '\\\\app\\\\rudex-patch-meta.json';",
    "function countProcs(query) {",
    "  try {",
    "    var wmi = GetObject('winmgmts:{impersonationLevel=impersonate}!\\\\\\\\.\\\\root\\\\cimv2');",
    "    var res = wmi.ExecQuery(query);",
    "    return res.Count;",
    "  } catch (e) { return -1; }",
    "}",
    "function hasOrigBackup(dir) {",
    "  try {",
    "    var folder = fso.GetFolder(dir);",
    "    var en = new Enumerator(folder.Files);",
    "    for (; !en.atEnd(); en.moveNext()) {",
    "      if (String(en.item().Name).toLowerCase().indexOf('app.asar.orig-') === 0) return true;",
    "    }",
    "  } catch (e) {}",
    "  return false;",
    "}",
    "function fileStamp(p) {",
    "  try {",
    "    if (!fso.FileExists(p)) return '';",
    "    var f = fso.GetFile(p);",
    "    return String(f.Size) + ':' + String(Math.floor(new Date(f.DateLastModified).getTime() / 1000));",
    "  } catch (e) { return ''; }",
    "}",
    "function runHiddenInstall() {",
    "  if (!fso.FileExists(installJs)) return;",
    "  var env = sh.Environment('Process');",
    "  env('ELECTRON_RUN_AS_NODE') = '1';",
    "  env('ELECTRON_NO_ASAR') = '1';",
    "  env('ANTIGRAVITY_RESOURCES_DIR') = resDir;",
    "  var runner = (agyExe && fso.FileExists(agyExe)) ? ('\"' + agyExe + '\"') : 'node';",
    "  try { sh.Run(runner + ' \"' + installJs + '\" --no-sync-plugin', 0, true); } catch (e) {}",
    "}",
    "try {",
    "  var dup = countProcs(\"SELECT ProcessId FROM Win32_Process WHERE Name = 'wscript.exe' AND CommandLine LIKE '%rudex-on-exit-activate.js%'\");",
    "  if (dup > 1) WScript.Quit(0);",
    "  for (var i = 0; i < 21600; i++) {",
    "    if (!fso.FileExists(asarPath)) break;",
    "    var running = countProcs(\"SELECT ProcessId FROM Win32_Process WHERE Name = 'Antigravity.exe'\");",
    "    if (running === 0) {",
    "      WScript.Sleep(350);",
    "      if (countProcs(\"SELECT ProcessId FROM Win32_Process WHERE Name = 'Antigravity.exe'\") !== 0) continue;",
    "      if (!fso.FileExists(asarPath)) break;",
    "      var curChanged = false;",
    "      if (expectedSize > 0) {",
    "        try {",
    "          var af = fso.GetFile(asarPath);",
    "          var curM = Math.floor(new Date(af.DateLastModified).getTime() / 1000);",
    "          if (af.Size !== expectedSize || (expectedMtimeSec > 0 && curM !== expectedMtimeSec)) curChanged = true;",
    "        } catch (e) {}",
    "      }",
    "      if (curChanged) {",
    "        var s1 = fileStamp(asarPath);",
    "        WScript.Sleep(1200);",
    "        var s2 = fileStamp(asarPath);",
    "        if (s1 && s1 === s2 && countProcs(\"SELECT ProcessId FROM Win32_Process WHERE Name = 'Antigravity.exe'\") === 0) {",
    "          runHiddenInstall();",
    "        }",
    "      } else if (fso.FileExists(metaPath) && hasOrigBackup(resDir)) {",
    "        for (var r = 0; r < 10; r++) {",
    "          if (!fso.FileExists(asarPath)) break;",
    "          try { fso.DeleteFile(asarPath, true); } catch (e) {}",
    "          if (fso.FileExists(asarPath)) WScript.Sleep(300);",
    "        }",
    "      }",
    "      break;",
    "    }",
    "    WScript.Sleep(500);",
    "  }",
    "} catch (e) {",
    "} finally {",
    "  try { if (fso.FileExists(lockFile)) fso.DeleteFile(lockFile, true); } catch (e1) {}",
    "  try { fso.DeleteFile(WScript.ScriptFullName, true); } catch (e2) {}",
    "}",
    "",
  ];
  try {
    fs.writeFileSync(outPath, lines.join("\r\n"), "ascii");
    return outPath;
  } catch (_e) {
    return "";
  }
}

function writeOnExitActivatePosix(info, opts = {}) {
  if (!info || !info.resourcesDir) return "";
  const outPath = opts.outPath || path.join(os.tmpdir(), "rudex-on-exit-activate.sh");
  const lockPath = opts.lockPath || path.join(os.tmpdir(), "rudex-on-exit-activate.lock");
  const installJs = opts.installJs || path.join(os.homedir(), ".gemini", "config", "plugins", "rudex", "skills", "rudex", "scripts", "install.js");
  const expectedSize = Number(opts.expectedAsarSize) || 0;
  const expectedMtimeSec = Number(opts.expectedAsarMtimeSec) || 0;
  const runnerBin = info.exePath && fs.existsSync(info.exePath) ? info.exePath : process.execPath;
  const q = posixShellQuote;
  const lines = [
    "#!/bin/sh",
    `RES_DIR=${q(info.resourcesDir)}`,
    `ASAR_PATH=${q(info.asarPath)}`,
    `APP_DIR=${q(info.appDir)}`,
    `META_PATH=${q(path.join(info.appDir, PATCH_META_FILENAME))}`,
    `LOCK_FILE=${q(lockPath)}`,
    `INSTALL_JS=${q(installJs)}`,
    `RUNNER_BIN=${q(runnerBin)}`,
    `EXPECTED_SIZE=${expectedSize}`,
    `EXPECTED_MTIME=${expectedMtimeSec}`,
    `SELF_PATH=${q(outPath)}`,
    "cleanup() {",
    '  rm -f "$LOCK_FILE" "$SELF_PATH" 2>/dev/null || true',
    "}",
    "trap cleanup EXIT INT TERM",
    "is_running() {",
    '  pgrep -x "Antigravity" >/dev/null 2>&1 || pgrep -x "antigravity" >/dev/null 2>&1 || pgrep -x "Google Antigravity" >/dev/null 2>&1',
    "}",
    "file_size() {",
    '  wc -c < "$1" 2>/dev/null | tr -d " "',
    "}",
    "file_mtime() {",
    '  stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null || echo 0',
    "}",
    "i=0",
    "while [ $i -lt 7200 ]; do",
    '  [ ! -f "$ASAR_PATH" ] && break',
    "  if ! is_running; then",
    "    sleep 1",
    "    is_running && continue",
    '    [ ! -f "$ASAR_PATH" ] && break',
    "    CUR_CHANGED=0",
    '    if [ "$EXPECTED_SIZE" -gt 0 ] 2>/dev/null; then',
    '      CUR_SIZE="$(file_size "$ASAR_PATH")"',
    '      CUR_MTIME="$(file_mtime "$ASAR_PATH")"',
    '      if [ "$CUR_SIZE" != "$EXPECTED_SIZE" ] || { [ "$EXPECTED_MTIME" -gt 0 ] 2>/dev/null && [ "$CUR_MTIME" != "$EXPECTED_MTIME" ]; }; then',
    "        CUR_CHANGED=1",
    "      fi",
    "    fi",
    '    if [ "$CUR_CHANGED" -eq 1 ]; then',
    '      S1="$(file_size "$ASAR_PATH"):$(file_mtime "$ASAR_PATH")"',
    "      sleep 1",
    '      S2="$(file_size "$ASAR_PATH"):$(file_mtime "$ASAR_PATH")"',
    '      if [ -n "$S1" ] && [ "$S1" = "$S2" ] && ! is_running && [ -f "$INSTALL_JS" ]; then',
    '        ELECTRON_RUN_AS_NODE=1 ELECTRON_NO_ASAR=1 ANTIGRAVITY_RESOURCES_DIR="$RES_DIR" "$RUNNER_BIN" "$INSTALL_JS" --no-sync-plugin >/dev/null 2>&1 || true',
    "      fi",
    '    elif [ -f "$META_PATH" ] && ls "$RES_DIR"/app.asar.orig-* >/dev/null 2>&1 && [ -d "$APP_DIR" ]; then',
    '      rm -f "$ASAR_PATH" 2>/dev/null || true',
    "    fi",
    "    break",
    "  fi",
    "  sleep 1",
    "  i=$((i + 1))",
    "done",
    "",
  ];
  try {
    fs.writeFileSync(outPath, lines.join("\n"), "utf8");
    try { fs.chmodSync(outPath, 0o755); } catch (_c) {}
    return outPath;
  } catch (_e) {
    return "";
  }
}

function spawnOnExitActivatorIfNeeded(info, extraOpts = {}) {
  if (!info || !info.resourcesDir) return false;
  if (process.platform !== "win32") {
    const shTarget = path.join(os.tmpdir(), "rudex-on-exit-activate.sh");
    const lockPath = path.join(os.tmpdir(), "rudex-on-exit-activate.lock");
    try {
      if (fs.existsSync(lockPath) && fs.existsSync(shTarget)) {
        const st = fs.statSync(lockPath);
        if (Date.now() - st.mtimeMs < 90 * 60 * 1000) return true;
      }
      fs.writeFileSync(lockPath, String(Date.now()), "utf8");
      const shPath = writeOnExitActivatePosix(info, {
        outPath: shTarget,
        lockPath,
        expectedAsarSize: extraOpts.expectedAsarSize || 0,
        expectedAsarMtimeSec: extraOpts.expectedAsarMtimeSec || 0,
      });
      if (!shPath || !fs.existsSync(shPath)) return false;
      const child = spawn("sh", [shPath], { detached: true, stdio: "ignore" });
      if (child && typeof child.unref === "function") child.unref();
      return true;
    } catch (_e) {
      return false;
    }
  }
  const wshTarget = path.join(os.tmpdir(), "rudex-on-exit-activate.js");
  const cmdTarget = path.join(os.tmpdir(), "rudex-on-exit-activate.cmd");
  const lockPath = path.join(os.tmpdir(), "rudex-on-exit-activate.lock");
  const expectedStamp = `${Number(extraOpts.expectedAsarSize) || 0}:${Number(extraOpts.expectedAsarMtimeSec) || 0}`;
  try {
    if (fs.existsSync(lockPath) && (fs.existsSync(wshTarget) || fs.existsSync(cmdTarget))) {
      const st = fs.statSync(lockPath);
      const lockText = fs.readFileSync(lockPath, "utf8").trim();
      const sameStamp = !expectedStamp || expectedStamp === "0:0" || lockText.endsWith(`|${expectedStamp}`);
      if (sameStamp && Date.now() - st.mtimeMs < 90 * 60 * 1000) {
        return true;
      }
    }
  } catch (_e) {}

  try {
    fs.writeFileSync(lockPath, `${Date.now()}|${expectedStamp}`, "utf8");
    if (resolveWscriptExe()) {
      const wshPath = writeOnExitActivateWsh(info, {
        outPath: wshTarget,
        lockPath,
        expectedAsarSize: extraOpts.expectedAsarSize || 0,
        expectedAsarMtimeSec: extraOpts.expectedAsarMtimeSec || 0,
      });
      if (wshPath && fs.existsSync(wshPath) && spawnSilentWindowsWsh(wshPath)) {
        return true;
      }
    }
    const cmdPath = writeOnExitActivateCmd(info, { outPath: cmdTarget, lockPath });
    if (!cmdPath || !fs.existsSync(cmdPath)) return false;
    const child = spawn("cmd.exe", ["/c", `"${cmdPath}"`], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      windowsVerbatimArguments: true,
    });
    if (child && typeof child.unref === "function") child.unref();
    return true;
  } catch (_e) {
    return false;
  }
}

function syncPerfFlagAndLightMaintenance() {
  // Never create root-owned files inside user home when invoked via `sudo` on macOS/Linux
  if (process.platform !== "win32" && typeof process.getuid === "function" && process.getuid() === 0 && process.env.SUDO_UID) {
    return;
  }
  try {
    const userDataDir = getUserDataDir();
    fs.mkdirSync(userDataDir, { recursive: true });
    const settingsPath = path.join(userDataDir, "agy_studio_settings.json");
    let userEnabledPerfAgent = false;
    if (fs.existsSync(settingsPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
        if (parsed && parsed.optimization && parsed.optimization.geminiFileCacheProtocol === true) {
          userEnabledPerfAgent = true;
        }
      } catch (_e) {}
    }
    const perfFlagPath = path.join(userDataDir, "agy_studio_perf_agent.flag");
    if (userEnabledPerfAgent) {
      fs.writeFileSync(perfFlagPath, "1\n", "utf8");
    } else if (fs.existsSync(perfFlagPath)) {
      try { fs.unlinkSync(perfFlagPath); } catch (_e) {}
    }
    // Safe light maintenance on install: clear only expired live edits & orphaned *.tmp-* files
    const perfMod = require("./perf-cache-engine.js");
    if (perfMod && typeof perfMod.cleanSafeCaches === "function") {
      perfMod.cleanSafeCaches({ userDataDir, includeChromium: false, includePartitions: false, includeRudexTemp: true });
    }
  } catch (_e) {}
}

function runInstall(options = {}) {
  const info = detectAntigravity();
  if (!info.found) {
    console.error("Antigravity installation directory not found.");
    process.exit(1);
  }

  // Verify resourcesDir write access BEFORE syncing plugin metadata so failed EACCES installs
  // on Linux/macOS never poison ~/.gemini/config/plugins/rudex/.rudex-install-meta.json.
  try {
    fs.accessSync(info.resourcesDir, fs.constants.W_OK);
  } catch (err) {
    if (process.platform !== "win32") {
      throw new Error(
        `No write permission to "${info.resourcesDir}" (${err.code || "EACCES"}). ` +
        `Run the installer with sudo support: bash ~/.gemini/config/plugins/rudex/install.sh (or set ANTIGRAVITY_RESOURCES_DIR for extracted AppImage).`
      );
    }
    throw err;
  }

  const pluginMeta = readPluginMeta();
  const preloadSnippet = buildPreloadSnippet(RESOURCES_SRC_DIR, pluginMeta);
  const stagingDir = path.join(info.resourcesDir, `.rudex-staging-${process.pid}-${Date.now()}`);

  try {
    const {
      unpackedCount,
      patchResult,
      stampVersion,
      asarLocked,
      sourceAsarHash,
      sourceAsarSize,
      sourceAsarMtimeSec,
      sourceAsarSig,
    } = buildPatchedStaging(info, preloadSnippet, pluginMeta, stagingDir);
    const metaPayload = {
      name: "rudex",
      displayName: pluginMeta.displayName,
      version: pluginMeta.version,
      commitSha: pluginMeta.commitSha || "",
      commitShort: pluginMeta.commitShort || "",
      commitDate: pluginMeta.commitDate || "",
      managedByPlugin: true,
      appVersion: info.appVersion,
      shellVersion: info.shellVersion,
      stampVersion,
      sourceAsarHash: sourceAsarHash || "",
      sourceAsarSize: sourceAsarSize || 0,
      sourceAsarMtimeSec: sourceAsarMtimeSec || 0,
      sourceAsarSig: sourceAsarSig || "",
      patchedAt: new Date().toISOString(),
      unpackedCount,
      patchedFiles: patchResult.patchedFiles,
      warnings: patchResult.warnings,
    };
    fs.writeFileSync(path.join(stagingDir, PATCH_META_FILENAME), JSON.stringify(metaPayload, null, 2), "utf8");

    deployStagedApp(stagingDir, info.appDir);

    // Clean up legacy meta and stale removed/outdated directories
    const staleLegacyMeta = path.join(info.appDir, LEGACY_META_FILENAME);
    if (fs.existsSync(staleLegacyMeta)) {
      try { fs.unlinkSync(staleLegacyMeta); } catch (_e) {}
    }
    try {
      for (const entryName of fs.readdirSync(info.resourcesDir)) {
        if (/^app\.(rudex|ru)-(removed|outdated|prev)-/.test(entryName)) {
          fs.rmSync(path.join(info.resourcesDir, entryName), { recursive: true, force: true });
        }
      }
    } catch (_e) {}

    const postInstallSyntaxTargets = [
      path.join(info.appDir, "dist", "main.js"),
      path.join(info.appDir, "dist", "i18nMain.js"),
      path.join(info.appDir, "dist", "preload.js"),
    ];
    for (const optDistFile of ["languageServer.js", "storage.js"]) {
      const fullOpt = path.join(info.appDir, "dist", optDistFile);
      if (fs.existsSync(fullOpt)) postInstallSyntaxTargets.push(fullOpt);
    }
    verifyJsFilesSyntax(postInstallSyntaxTargets);

    // Sync plugin & .rudex-install-meta.json ONLY after app patching & syntax verification succeed
    if (options.syncPlugin !== false) {
      syncPluginToGlobalConfig(PLUGIN_ROOT);
    }

    // Auto-activate Gemini File & Prompt Cache SessionStart protocol unless explicitly disabled by user
    syncPerfFlagAndLightMaintenance();

    // Remove obsolete app.asar.orig-* backups from older Antigravity versions once current backup & patched app are verified
    if (info.appVersion && info.appVersion !== "unknown") {
      const keepBackupName = `app.asar.orig-${info.appVersion}`;
      const keepBackupPath = path.join(info.resourcesDir, keepBackupName);
      try {
        if (fs.existsSync(keepBackupPath) && fs.statSync(keepBackupPath).size > 0) {
          for (const entryName of fs.readdirSync(info.resourcesDir)) {
            if (/^app\.asar\.orig-.+$/.test(entryName) && entryName !== keepBackupName) {
              try { fs.unlinkSync(path.join(info.resourcesDir, entryName)); } catch (_e) {}
            }
          }
        }
      } catch (_e) {}
    }

    console.log(`Syntax verification (vm.Script) PASSED.`);
    console.log(`Patched ${patchResult.patchedFiles.length} files (${info.appDir}) [warnings=${patchResult.warnings.length}]`);
    if (info.exePath) {
      console.log(`AGY_EXE=${info.exePath}`);
    }
    if (asarLocked) {
      if (options.onExitActivate) {
        if (spawnOnExitActivatorIfNeeded(info, { expectedAsarSize: sourceAsarSize, expectedAsarMtimeSec: sourceAsarMtimeSec })) {
          console.log("ON_EXIT_ACTIVATOR=ARMED");
        }
      }
      if (!options.onExitActivate || options.writeRestartCmd) {
        const activatorOutPath = options.writeRestartCmd
          ? path.join(os.homedir(), "Desktop", "Rudex-Apply-Restart.cmd")
          : path.join(os.tmpdir(), `rudex-activate-${Date.now()}.cmd`);
        const cmdPath = writeApplyRestartCmd(info, { outPath: activatorOutPath, removeAsar: true });
        if (cmdPath) {
          console.log(`ACTIVATOR_PATH=${cmdPath}`);
          if (options.writeRestartCmd) console.log(`RESTART_CMD=${cmdPath}`);
        }
      }
      console.log("STATUS=LOCKED_NEEDS_ACTIVATOR");
    } else {
      if (options.writeRestartCmd) {
        const cmdPath = writeApplyRestartCmd(info, { removeAsar: false });
        if (cmdPath) console.log(`RESTART_CMD=${cmdPath}`);
      }
      console.log("STATUS=ACTIVATED");
    }
  } finally {
    if (fs.existsSync(stagingDir)) {
      try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch (_e) {}
    }
  }
}

function runStatus() {
  const info = detectAntigravity();
  const pluginsBase = path.join(os.homedir(), ".gemini", "config", "plugins");
  const rudexPlugin = path.join(pluginsBase, "rudex");
  const legacyPlugin = path.join(pluginsBase, "antigravity-ru");
  const userDataDir = getUserDataDir();
  const metaPath = info.found ? path.join(info.appDir, PATCH_META_FILENAME) : "";
  let meta = null;
  if (metaPath && fs.existsSync(metaPath)) {
    try { meta = JSON.parse(fs.readFileSync(metaPath, "utf8")); } catch (_e) {}
  }

  let locale = "unknown";
  const localePath = path.join(userDataDir, "agy_locale.json");
  if (fs.existsSync(localePath)) {
    try { locale = JSON.parse(fs.readFileSync(localePath, "utf8")).locale || "ru"; } catch (_e) {}
  }

  console.log("=== Rudex Status ===");
  console.log(`App detected: ${info.found ? "YES" : "NO"}`);
  if (info.found) {
    console.log(`Resources dir: ${info.resourcesDir}`);
    console.log(`App version: ${info.appVersion} (shell: ${info.shellVersion})`);
    console.log(`Patched app dir: ${fs.existsSync(info.appDir) ? "PRESENT" : "NONE"}`);
    console.log(`Rudex patch meta: ${meta ? `v${meta.version} @ ${meta.patchedAt} (${meta.appVersion})` : "NOT_PATCHED"}`);
    console.log(`Original ASAR backups: ${info.backups.map((b) => b.name).join(", ") || "NONE"}`);
  }
  console.log(`Rudex plugin: ${fs.existsSync(path.join(rudexPlugin, "plugin.json")) ? rudexPlugin : "NOT_INSTALLED"}`);
  console.log(`Legacy antigravity-ru plugin: ${fs.existsSync(legacyPlugin) ? `STILL_PRESENT (${legacyPlugin})` : "CLEAN"}`);
  console.log(`User data dir: ${userDataDir}`);
  console.log(`Active locale: ${locale}`);
}

function printResourcesInfo() {
  const info = detectAntigravity();
  console.log(`FOUND=${info.found ? "YES" : "NO"}`);
  if (info.resourcesDir) console.log(`RESOURCES_DIR=${info.resourcesDir}`);
  if (info.exePath) console.log(`AGY_EXE=${info.exePath}`);
  if (info.appBundlePath) console.log(`APP_BUNDLE=${info.appBundlePath}`);
  if (info.appVersion) console.log(`APP_VERSION=${info.appVersion}`);
}

function runDiagnostics(cleanNow) {
  const perfMod = require("./perf-cache-engine.js");
  const userDataDir = getUserDataDir();
  const geminiDir = path.join(os.homedir(), ".gemini", "antigravity");
  let opt = {};
  try {
    const sp = path.join(userDataDir, "agy_studio_settings.json");
    if (fs.existsSync(sp)) {
      const parsed = JSON.parse(fs.readFileSync(sp, "utf8"));
      if (parsed && parsed.optimization) opt = parsed.optimization;
    }
  } catch (_e) {}
  if (cleanNow) {
    const cleaned = perfMod.cleanSafeCaches({ userDataDir, includeChromium: true, includePartitions: true, includeRudexTemp: true });
    const pruned = perfMod.pruneStaleAppStorage({ userDataDir, geminiDir, dryRun: false });
    console.log(`CACHE_CLEANED_MB=${(cleaned.freedBytes / (1024 * 1024)).toFixed(2)}`);
    console.log(`CACHE_FILES_REMOVED=${cleaned.removedFiles}`);
    console.log(`STORAGE_PRUNED_KEYS=${pruned.removedKeys}`);
    console.log(`STORAGE_FREED_KB=${(pruned.freedBytes / 1024).toFixed(1)}`);
  }
  const diag = perfMod.inspectCacheDiagnostics({ userDataDir, geminiDir, optimization: opt });
  console.log("=== Rudex Performance & Cache Diagnostics ===");
  console.log(`LS CPU Threads: ${diag.lsTuning.maxProcs} / ${diag.lsTuning.cpuCount} (fileWatchMaxDirs=${diag.lsTuning.fileWatchMaxDirs}, workspaces=${diag.lsTuning.maxTrackedWorkspaces}, GOMEMLIMIT=${diag.lsTuning.goMemLimit || "default"})`);
  console.log(`Prompt Cache Hit Rate: ${diag.promptCache.cacheHitRatePct}% (${diag.promptCache.turnsSampled} turns across ${diag.promptCache.chatsSampled} chats)`);
  console.log(`Chromium Cache: ${(diag.buckets.chromiumCache.bytes / (1024 * 1024)).toFixed(1)} MB (${diag.buckets.chromiumCache.files} files)`);
  console.log(`Partitions Cache: ${(diag.buckets.partitionsCache.bytes / (1024 * 1024)).toFixed(1)} MB (${diag.buckets.partitionsCache.files} files)`);
  console.log(`Rudex Temp: ${(diag.buckets.rudexTemp.bytes / (1024 * 1024)).toFixed(2)} MB (${diag.buckets.rudexTemp.files} files)`);
  console.log(`app_storage.json: ${(diag.appStorage.bytes / 1024).toFixed(1)} KB (${diag.appStorage.staleLayoutKeys.length} stale layout keys)`);
  try {
    const lvMod = require("./local-voice-engine.js");
    const lvMgr = lvMod.createLocalVoiceManager({ userDataDir });
    const lvSt = lvMgr.getStatus(opt.voiceLocalModel || "ru-fast");
    console.log(`Local Instant Voice (Sherpa-ONNX): ${lvSt.installed ? `READY (model=${lvSt.modelId}, installed=[${lvSt.installedModels.join(", ")}])` : "NOT INSTALLED (run --install-voice or install in Studio)"}`);
  } catch (_e) {}
  console.log("STATUS=DIAGNOSTICS_OK");
}

async function runInstallVoice(rawArg) {
  const lvMod = require("./local-voice-engine.js");
  const userDataDir = getUserDataDir();
  const mMatch = /^--install-voice=(.+)$/.exec(String(rawArg || ""));
  const modelId = mMatch && mMatch[1] ? mMatch[1].trim() : "ru-fast";
  console.log(`Installing Rudex Local Instant Voice (Sherpa-ONNX, model=${modelId})...`);
  let lastLine = "";
  const res = await lvMod.downloadAndInstallLocalVoice(userDataDir, modelId, (p) => {
    const line = `[${p.pct}%] ${p.message}`;
    if (line !== lastLine) {
      lastLine = line;
      console.log(line);
    }
  });
  console.log(`Local voice binary: ${res.exePath}`);
  console.log(`Local voice model:  ${res.modelFiles.modelDir}`);
  console.log("STATUS=LOCAL_VOICE_INSTALLED");
}

function main() {
  const argv = process.argv.slice(2);
  const args = new Set(argv);
  const voiceInstallArg = argv.find((a) => a === "--install-voice" || a.startsWith("--install-voice="));
  if (args.has("--print-resources")) {
    printResourcesInfo();
  } else if (args.has("--dry-run")) {
    runDryRun();
  } else if (args.has("--status")) {
    runStatus();
  } else if (args.has("--diagnostics") || args.has("--clean-cache")) {
    runDiagnostics(args.has("--clean-cache"));
  } else if (voiceInstallArg) {
    runInstallVoice(voiceInstallArg).catch((err) => {
      console.error(`Local voice install failed: ${err && err.message ? err.message : err}`);
      process.exit(1);
    });
  } else if (args.has("--plugin-only")) {
    syncPluginToGlobalConfig(PLUGIN_ROOT);
    syncPerfFlagAndLightMaintenance();
    console.log("STATUS=PLUGIN_ONLY");
  } else {
    runInstall({
      syncPlugin: !args.has("--no-sync-plugin"),
      onExitActivate: args.has("--on-exit-activate"),
      writeRestartCmd: args.has("--write-restart-cmd"),
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  detectAntigravity,
  getUserDataDir,
  compareSemver,
  findBackups,
  unpackAsar,
  stripCjsPrologueEpilogue,
  buildPreloadSnippet,
  syncPluginToGlobalConfig,
  readPluginMeta,
  hashFileSha256,
  posixShellQuote,
  writeOnExitActivateCmd,
  writeOnExitActivateWsh,
  writeOnExitActivatePosix,
};
