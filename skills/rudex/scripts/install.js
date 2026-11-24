#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const vm = require("vm");
const { spawnSync } = require("child_process");
const { patchElectronShell } = require("./electron-shell.js");

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
  const candidates = [];

  if (env.ANTIGRAVITY_RESOURCES_DIR) {
    candidates.push(path.resolve(env.ANTIGRAVITY_RESOURCES_DIR));
  }

  if (platform === "win32") {
    const localApp = env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
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
      path.join(os.homedir(), "Applications", "Antigravity.app", "Contents", "Resources")
    );
  } else {
    candidates.push(
      "/usr/share/antigravity/resources",
      "/opt/Antigravity/resources",
      "/opt/antigravity/resources",
      path.join(os.homedir(), ".local", "share", "antigravity", "resources")
    );
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
    const versionFile = path.join(rootDir, "version");
    let versionFileText = "";
    let appVersion = "";
    try {
      if (fs.existsSync(versionFile)) {
        versionFileText = fs.readFileSync(versionFile, "utf8").trim();
        appVersion = versionFileText.split(/\s+/)[0] || "";
      }
    } catch (_e) {}

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
    if (platform === "win32") {
      const exe = path.join(rootDir, "Antigravity.exe");
      if (fs.existsSync(exe)) exePath = exe;
    } else if (platform === "darwin") {
      exePath = path.dirname(rootDir);
    } else {
      const bin = path.join(rootDir, "antigravity");
      if (fs.existsSync(bin)) exePath = bin;
    }

    return {
      found: true,
      resourcesDir: resolved,
      rootDir,
      asarPath,
      appDir,
      exePath,
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

  return {
    name: pkg.name || "rudex",
    displayName: pkg.displayName || "Rudex",
    version: pkg.version || "4.0.0",
    dictEntries,
    dynamicRulesCount,
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
  const panelSrc = loadStripped("studio-panel.js");

  const snippet = [
    "// === RUDEX_I18N_START ===",
    `;(() => {`,
    `"use strict";`,
    `try {`,
    `const _ipc = (typeof electron_1 !== "undefined" && electron_1 && electron_1.ipcRenderer) || (typeof require === "function" ? require("electron").ipcRenderer : null);`,
    `if (!_ipc || typeof document === "undefined") return;`,
    dynSrc,
    `const DICT = ${dictJson};`,
    domSrc,
    telSrc,
    `const STUDIO_META = ${JSON.stringify(pluginMeta)};`,
    themeSrc,
    stylesSrc,
    panelSrc,
    `const _rawBootLocale = (() => { try { return _ipc.sendSync("agy-i18n:get-locale-sync"); } catch (_e) { return "ru"; } })();`,
    `if (_rawBootLocale === "__disabled__") return;`,
    `const _bootLocale = _rawBootLocale === "en" ? "en" : "ru";`,
    `const _translator = createDomTranslator({ document, window: typeof window !== "undefined" ? window : globalThis, dictionary: DICT, applyDynamicRules: typeof applyDynamicRules === "function" ? applyDynamicRules : () => null, initialLocale: _bootLocale });`,
    `const _studioPanel = createStudioPanel({ document, window: typeof window !== "undefined" ? window : globalThis, ipcRenderer: _ipc, translator: _translator, initialLocale: _bootLocale, pluginMeta: STUDIO_META, buildStyles: typeof buildStudioStyles === "function" ? buildStudioStyles : null });`,
    `_ipc.on("agy-i18n:locale-changed", (_event, nextLocale) => { try { _translator.setLocale(nextLocale); } catch (_e) {} try { _studioPanel.setLocale(nextLocale); } catch (_e) {} });`,
    `_ipc.on("agy-studio:toggle-panel", () => { try { _studioPanel.toggleOpen(); } catch (_e) {} });`,
    `_ipc.on("agy-studio:toggle-live-edit", () => { try { _studioPanel.toggleLiveEditPopover(); } catch (_e) {} });`,
    `_ipc.on("agy-studio:live-edits-changed", (_event, payload) => { try { _studioPanel.applyLiveEditsUpdate(payload); } catch (_e) {} });`,
    `_ipc.on("agy-studio:settings-changed", (_event, nextState) => { try { _studioPanel.applyRemoteState(nextState); } catch (_e) {} });`,
    `const _bootRudex = () => { try { _translator.init(); _translator.translateDocument(); } catch (_e) {} try { _studioPanel.init(); } catch (_e) {} };`,
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

function copyDirRecursiveSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
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
        fs.copyFileSync(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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
 */
function syncPluginToGlobalConfig(repoRoot = PLUGIN_ROOT) {
  const pluginsBase = path.join(os.homedir(), ".gemini", "config", "plugins");
  const targetDir = path.join(pluginsBase, "rudex");
  const legacyDir = path.join(pluginsBase, "antigravity-ru");
  const isSameDir = path.resolve(repoRoot).toLowerCase() === path.resolve(targetDir).toLowerCase();

  if (!isSameDir) {
    const targetRulePath = path.join(targetDir, "rules", "AGENTS.md");
    const legacyRulePath = path.join(legacyDir, "rules", "AGENTS.md");
    let preservedRuleContent = null;
    if (fs.existsSync(targetRulePath)) {
      preservedRuleContent = fs.readFileSync(targetRulePath, "utf8");
    } else if (fs.existsSync(legacyRulePath)) {
      preservedRuleContent = fs.readFileSync(legacyRulePath, "utf8");
    }

    fs.mkdirSync(targetDir, { recursive: true });

    // Clean obsolete skill files inside target/skills while keeping rules/
    const targetSkillsDir = path.join(targetDir, "skills");
    if (fs.existsSync(targetSkillsDir)) {
      fs.rmSync(targetSkillsDir, { recursive: true, force: true });
    }

    fs.copyFileSync(path.join(repoRoot, "plugin.json"), path.join(targetDir, "plugin.json"));

    const assetsSrc = path.join(repoRoot, "assets");
    if (fs.existsSync(assetsSrc)) {
      copyDirRecursiveSync(assetsSrc, path.join(targetDir, "assets"));
    }
    const skillSrc = path.join(repoRoot, "skills", "rudex");
    copyDirRecursiveSync(skillSrc, path.join(targetDir, "skills", "rudex"));

    if (preservedRuleContent !== null) {
      fs.mkdirSync(path.dirname(targetRulePath), { recursive: true });
      fs.writeFileSync(targetRulePath, preservedRuleContent, "utf8");
    }
  }

  // Sync hooks.json (using hook-runner.cmd fallback on Windows if node isn't on global PATH)
  const hooksObj = JSON.parse(fs.readFileSync(path.join(repoRoot, "hooks.json"), "utf8"));
  if (process.platform === "win32" && !hasSystemNode() && hooksObj && typeof hooksObj === "object") {
    for (const group of Object.values(hooksObj)) {
      if (!group || typeof group !== "object") continue;
      for (const hookList of Object.values(group)) {
        if (!Array.isArray(hookList)) continue;
        for (const item of hookList) {
          if (item && typeof item.command === "string" && /rudex-hook\.js\b/.test(item.command)) {
            item.command = "cmd /c skills\\rudex\\scripts\\hook-runner.cmd";
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
 * Prepare unpatched clean source ASAR and build patched app in a staging directory.
 */
function buildPatchedStaging(info, preloadSnippet, pluginMeta, stagingDir, opts = {}) {
  const dryRun = Boolean(opts && opts.dryRun);
  let cleanAsarPath = info.backups[0] ? info.backups[0].path : "";
  let asarLocked = false;

  if (dryRun) {
    if (!cleanAsarPath && fs.existsSync(info.asarPath)) {
      cleanAsarPath = info.asarPath;
    }
  } else if (fs.existsSync(info.asarPath)) {
    const newBackupPath = path.join(info.resourcesDir, `app.asar.orig-${info.appVersion || "unknown"}`);
    if (!fs.existsSync(newBackupPath)) {
      try {
        fs.renameSync(info.asarPath, newBackupPath);
      } catch (err) {
        if (err && (err.code === "EBUSY" || err.code === "EPERM")) {
          fs.copyFileSync(info.asarPath, newBackupPath);
          asarLocked = true;
        } else {
          throw err;
        }
      }
      cleanAsarPath = newBackupPath;
    } else {
      try {
        const bakStat = fs.statSync(newBackupPath);
        const asarStat = fs.statSync(info.asarPath);
        if (bakStat.size !== asarStat.size) {
          fs.copyFileSync(info.asarPath, newBackupPath);
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

  if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  const unpackedCount = unpackAsar(cleanAsarPath, stagingDir);
  const stampVersion = info.versionFileText || info.appVersion || "custom";
  const patchResult = patchElectronShell(stagingDir, preloadSnippet, { stampVersion });

  const distDir = path.join(stagingDir, "dist");
  copyI18nDataFiles(distDir, RESOURCES_SRC_DIR, SCRIPTS_SRC_DIR);

  verifyJsFilesSyntax([
    path.join(distDir, "main.js"),
    path.join(distDir, "i18nMain.js"),
    path.join(distDir, "preload.js"),
    path.join(distDir, "i18nData", "dynamic-rules-ru.js"),
    path.join(distDir, "i18nData", "zip-builder.js"),
  ]);

  return { unpackedCount, patchResult, cleanAsarPath, stampVersion, asarLocked };
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
  const lines = [
    "@echo off",
    `set "AGY_EXE=${info.exePath}"`,
    `set "RES_DIR=${info.resourcesDir}"`,
    "setlocal EnableDelayedExpansion",
    "echo Restarting Antigravity to apply Rudex...",
    "taskkill /F /IM Antigravity.exe >nul 2>&1",
    "timeout /t 2 /nobreak >nul",
  ];
  if (removeAsar && info.resourcesDir) {
    lines.push(
      'if exist "!RES_DIR!\\app.asar.orig-*" if exist "!RES_DIR!\\app" (',
      '  del /F /Q "!RES_DIR!\\app.asar" >nul 2>&1',
      '  if exist "!RES_DIR!\\app.asar" (',
      "    timeout /t 1 /nobreak >nul",
      '    del /F /Q "!RES_DIR!\\app.asar" >nul 2>&1',
      "  )",
      ")"
    );
  }
  lines.push(
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

function runInstall(options = {}) {
  if (options.syncPlugin !== false) {
    syncPluginToGlobalConfig(PLUGIN_ROOT);
  }
  const info = detectAntigravity();
  if (!info.found) {
    console.error("Antigravity installation directory not found.");
    process.exit(1);
  }

  const pluginMeta = readPluginMeta();
  const preloadSnippet = buildPreloadSnippet(RESOURCES_SRC_DIR, pluginMeta);
  const stagingDir = path.join(info.resourcesDir, `.rudex-staging-${process.pid}-${Date.now()}`);

  try {
    const { unpackedCount, patchResult, stampVersion, asarLocked } = buildPatchedStaging(info, preloadSnippet, pluginMeta, stagingDir);
    const metaPayload = {
      name: "rudex",
      displayName: pluginMeta.displayName,
      version: pluginMeta.version,
      managedByPlugin: true,
      appVersion: info.appVersion,
      shellVersion: info.shellVersion,
      stampVersion,
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

    verifyJsFilesSyntax([
      path.join(info.appDir, "dist", "main.js"),
      path.join(info.appDir, "dist", "i18nMain.js"),
      path.join(info.appDir, "dist", "preload.js"),
    ]);

    console.log(`Syntax verification (vm.Script) PASSED.`);
    console.log(`Patched ${patchResult.patchedFiles.length} files (${info.appDir}) [warnings=${patchResult.warnings.length}]`);
    if (info.exePath) {
      console.log(`AGY_EXE=${info.exePath}`);
    }
    if (asarLocked) {
      const activatorOutPath = options.writeRestartCmd
        ? path.join(os.homedir(), "Desktop", "Rudex-Apply-Restart.cmd")
        : path.join(os.tmpdir(), `rudex-activate-${Date.now()}.cmd`);
      const cmdPath = writeApplyRestartCmd(info, { outPath: activatorOutPath, removeAsar: true });
      if (cmdPath) {
        console.log(`ACTIVATOR_PATH=${cmdPath}`);
        if (options.writeRestartCmd) console.log(`RESTART_CMD=${cmdPath}`);
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

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--dry-run")) {
    runDryRun();
  } else if (args.has("--status")) {
    runStatus();
  } else if (args.has("--plugin-only")) {
    syncPluginToGlobalConfig(PLUGIN_ROOT);
    console.log("STATUS=PLUGIN_ONLY");
  } else if (args.has("--sync-plugin")) {
    runInstall({ syncPlugin: true, writeRestartCmd: args.has("--write-restart-cmd") });
  } else {
    runInstall({ syncPlugin: true, writeRestartCmd: args.has("--write-restart-cmd") });
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
};
