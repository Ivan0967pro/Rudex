"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const vm = require("vm");
const Module = require("module");
const { patchElectronShell } = require("./electron-shell-ru");

const SCRIPT_DIR = __dirname;
const SKILL_DIR = path.resolve(SCRIPT_DIR, "..");
const PLUGIN_ROOT = path.resolve(SKILL_DIR, "..", "..");
const RESOURCES_SRC_DIR = path.join(SKILL_DIR, "resources");
const DICT_PATH = path.join(RESOURCES_SRC_DIR, "dictionary-ru.json");
const DYNAMIC_RULES_PATH = path.join(RESOURCES_SRC_DIR, "dynamic-rules-ru.js");
const DOM_TRANSLATOR_PATH = path.join(RESOURCES_SRC_DIR, "dom-translator.js");
const THEME_ENGINE_PATH = path.join(RESOURCES_SRC_DIR, "theme-engine.js");
const STUDIO_PANEL_PATH = path.join(RESOURCES_SRC_DIR, "studio-panel.js");
const ZIP_BUILDER_PATH = path.join(SCRIPT_DIR, "zip-builder.js");

function getUserDataDir() {
  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "Antigravity"
    );
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Antigravity");
  }
  return path.join(
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
    "Antigravity"
  );
}

function findBackups(resourcesDir) {
  try {
    return fs
      .readdirSync(resourcesDir)
      .filter((f) => /^app\.asar\.orig-/.test(f))
      .sort();
  } catch {
    return [];
  }
}

function probeCandidate(rawPath) {
  if (!rawPath) return null;
  let resolved;
  try {
    resolved = path.resolve(rawPath);
  } catch {
    return null;
  }
  if (!fs.existsSync(resolved)) return null;

  try {
    if (fs.statSync(resolved).isFile()) {
      resolved = path.dirname(resolved);
    }
  } catch {
    return null;
  }

  const attempts = [
    { installDir: path.dirname(resolved), resourcesDir: resolved },
    { installDir: resolved, resourcesDir: path.join(resolved, "resources") },
    { installDir: resolved, resourcesDir: path.join(resolved, "Resources") },
    { installDir: path.join(resolved, "Contents"), resourcesDir: path.join(resolved, "Contents", "Resources") },
  ];

  for (const cand of attempts) {
    if (!fs.existsSync(cand.resourcesDir)) continue;
    const asarPath = path.join(cand.resourcesDir, "app.asar");
    const backups = findBackups(cand.resourcesDir);
    if (!fs.existsSync(asarPath) && backups.length === 0) continue;

    let exePath = null;
    if (process.platform === "win32") {
      const p = path.join(cand.installDir, "Antigravity.exe");
      if (fs.existsSync(p)) exePath = p;
    } else if (process.platform === "darwin") {
      const p = path.join(cand.installDir, "MacOS", "Antigravity");
      if (fs.existsSync(p)) exePath = p;
    } else {
      const p = path.join(cand.installDir, "antigravity");
      if (fs.existsSync(p)) exePath = p;
    }

    const versionFile = path.join(cand.installDir, "version");
    let stampVersion = null;
    if (fs.existsSync(versionFile)) {
      stampVersion = fs.readFileSync(versionFile, "utf8").trim() || null;
    }
    if (!stampVersion && backups.length > 0) {
      stampVersion = backups[backups.length - 1].replace(/^app\.asar\.orig-/, "") || null;
    }

    return {
      installDir: cand.installDir,
      resourcesDir: cand.resourcesDir,
      asarPath,
      backups,
      latestBackupPath: backups.length > 0 ? path.join(cand.resourcesDir, backups[backups.length - 1]) : null,
      appDir: path.join(cand.resourcesDir, "app"),
      versionFile,
      stampVersion,
      exePath,
    };
  }
  return null;
}

function detectAntigravity(explicitDir) {
  const candidates = [];
  if (explicitDir) candidates.push(explicitDir);
  if (process.env.ANTIGRAVITY_INSTALL_DIR) candidates.push(process.env.ANTIGRAVITY_INSTALL_DIR);

  const execBase = path.basename(process.execPath).toLowerCase();
  if (execBase.includes("antigravity")) {
    candidates.push(path.dirname(process.execPath));
  }

  if (process.platform === "win32") {
    const localApp = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    candidates.push(
      path.join(localApp, "Programs", "antigravity"),
      path.join(localApp, "Antigravity"),
      process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "Antigravity") : "",
      process.env["ProgramFiles(x86)"] ? path.join(process.env["ProgramFiles(x86)"], "Antigravity") : ""
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Antigravity.app/Contents",
      path.join(os.homedir(), "Applications", "Antigravity.app", "Contents")
    );
  } else {
    candidates.push(
      "/opt/Antigravity",
      "/usr/lib/antigravity",
      "/usr/share/antigravity",
      path.join(os.homedir(), ".local", "share", "antigravity")
    );
  }

  for (const cand of candidates) {
    const found = probeCandidate(cand);
    if (found) return found;
  }

  throw new Error(
    "Antigravity installation not found. Pass --app-dir <path> or set ANTIGRAVITY_INSTALL_DIR."
  );
}

function unpackAsar(asarPath, destDir) {
  const fd = fs.openSync(asarPath, "r");
  let unpackedFiles = 0;
  let skippedUnpacked = 0;
  try {
    const lenBuf = Buffer.alloc(16);
    fs.readSync(fd, lenBuf, 0, 16, 0);
    const headerSize = lenBuf.readUInt32LE(4);
    const strLen = lenBuf.readUInt32LE(12);
    const jsonBuf = Buffer.alloc(strLen);
    fs.readSync(fd, jsonBuf, 0, strLen, 16);
    const header = JSON.parse(jsonBuf.toString("utf8"));
    const baseOffset = 8 + headerSize;

    fs.mkdirSync(destDir, { recursive: true });

    function walk(node, relDir) {
      if (!node || !node.files) return;
      for (const [name, entry] of Object.entries(node.files)) {
        const relPath = relDir ? path.join(relDir, name) : name;
        const targetPath = path.join(destDir, relPath);
        if (entry.files) {
          fs.mkdirSync(targetPath, { recursive: true });
          walk(entry, relPath);
        } else if (entry.unpacked) {
          skippedUnpacked++;
        } else {
          const size = Number(entry.size || 0);
          const offset = baseOffset + parseInt(entry.offset || "0", 10);
          const buf = Buffer.alloc(size);
          if (size > 0) {
            fs.readSync(fd, buf, 0, size, offset);
          }
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          try {
            fs.writeFileSync(targetPath, buf);
          } catch (err) {
            if (
              err &&
              (err.code === "EBUSY" || err.code === "EPERM") &&
              !relPath.startsWith("dist" + path.sep) &&
              fs.existsSync(targetPath)
            ) {
              // Locked non-dist asset while running; keep existing identical file
            } else {
              throw err;
            }
          }
          unpackedFiles++;
        }
      }
    }

    walk(header, "");
  } finally {
    fs.closeSync(fd);
  }
  return { unpackedFiles, skippedUnpacked };
}

function stripCjsPrologueEpilogue(source) {
  return source
    .replace(/^\s*["']use strict["'];\s*/m, "")
    .replace(/\nif\s*\(typeof module\s*!==\s*["']undefined["'][\s\S]*$/m, "")
    .trim();
}

function buildPreloadSnippet(dictObj, pluginMeta) {
  const dynSrc = stripCjsPrologueEpilogue(fs.readFileSync(DYNAMIC_RULES_PATH, "utf8"));
  const domSrc = stripCjsPrologueEpilogue(fs.readFileSync(DOM_TRANSLATOR_PATH, "utf8"));
  const themeSrc = stripCjsPrologueEpilogue(fs.readFileSync(THEME_ENGINE_PATH, "utf8"));
  const studioSrc = stripCjsPrologueEpilogue(fs.readFileSync(STUDIO_PANEL_PATH, "utf8"));
  const dictJson = JSON.stringify(dictObj)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const metaJson = JSON.stringify(pluginMeta || { version: "3.0.1", dictEntries: Object.keys(dictObj).length, dynamicRulesCount: 0 });

  return [
    "// === ANTIGRAVITY_RU_I18N_START ===",
    ";(() => {",
    "  try {",
    "    const g = globalThis;",
    "    if (!g.document || (g.top && g.self && g.top !== g.self)) {",
    "      return;",
    "    }",
    dynSrc,
    `    const DICT = ${dictJson};`,
    domSrc,
    `    const STUDIO_META = ${metaJson};`,
    themeSrc,
    studioSrc,
    `    let initialLocale = "ru";`,
    `    try {`,
    `      initialLocale = electron_1.ipcRenderer.sendSync("agy-i18n:get-locale-sync") === "en" ? "en" : "ru";`,
    `    } catch {}`,
    `    const translator = createDomTranslator({`,
    `      document: g.document,`,
    `      window: g.window || g,`,
    `      dictionary: DICT,`,
    `      applyDynamicRules,`,
    `      initialLocale,`,
    `    });`,
    `    const themeEngine = createThemeEngine({`,
    `      document: g.document,`,
    `      window: g.window || g,`,
    `    });`,
    `    const studioPanel = createStudioPanel({`,
    `      document: g.document,`,
    `      window: g.window || g,`,
    `      ipcRenderer: electron_1.ipcRenderer,`,
    `      initialLocale,`,
    `      pluginMeta: STUDIO_META,`,
    `      themeEngine,`,
    `    });`,
    `    const start = () => {`,
    `      try { translator.init(); } catch {}`,
    `      try {`,
    `        const proto = g.location && g.location.protocol;`,
    `        if (proto === "http:" || proto === "https:") {`,
    `          studioPanel.init();`,
    `        }`,
    `      } catch {}`,
    `    };`,
    `    if (g.document.readyState === "loading") {`,
    `      g.document.addEventListener("DOMContentLoaded", start, { once: true });`,
    `    } else {`,
    `      start();`,
    `    }`,
    `    g.addEventListener?.("load", () => {`,
    `      try { translator.translateDocument(); } catch {}`,
    `    });`,
    `    electron_1.ipcRenderer.on("agy-i18n:locale-changed", (_event, next) => {`,
    `      try { translator.setLocale(next); } catch {}`,
    `      try { studioPanel.setLocale(next); } catch {}`,
    `    });`,
    `    electron_1.ipcRenderer.on("agy-studio:toggle-panel", () => {`,
    `      try { studioPanel.toggleOpen(); } catch {}`,
    `    });`,
    `    electron_1.ipcRenderer.on("agy-studio:settings-changed", (_event, nextState) => {`,
    `      try { studioPanel.applyRemoteState(nextState); } catch {}`,
    `    });`,
    "  } catch (err) {",
    `    try { console.warn("[antigravity-ru] preload i18n error:", err); } catch {}`,
    "  }",
    "})();",
    "// === ANTIGRAVITY_RU_I18N_END ===",
  ].join("\n");
}

function checkJsSyntaxInProcess(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  const stripped = code.charCodeAt(0) === 0xfeff ? code.slice(1) : code;
  const wrapped = Module.wrap(stripped.replace(/^#!.*(?:\r?\n|$)/, ""));
  new vm.Script(wrapped, { filename: filePath });
}

function copyDirRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name === ".git" || ent.name === "Apply-Russian-And-Restart.cmd") continue;
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) {
      copyDirRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function syncPluginToGlobalConfig() {
  if (!fs.existsSync(path.join(PLUGIN_ROOT, "plugin.json"))) {
    return null;
  }
  const destDir = path.join(os.homedir(), ".gemini", "config", "plugins", "antigravity-ru");
  const normSrc = path.resolve(PLUGIN_ROOT).toLowerCase();
  const normDst = path.resolve(destDir).toLowerCase();
  if (normSrc === normDst) {
    return destDir;
  }
  copyDirRecursive(PLUGIN_ROOT, destDir);
  return destDir;
}

function writeActivatorCmd(envInfo, backupAsarPath) {
  const outPath = path.join(os.tmpdir(), "Antigravity-RU-Apply-Restart.cmd");
  const exePath = envInfo.exePath || path.join(envInfo.installDir, "Antigravity.exe");
  const lines = [
    "@echo off",
    "chcp 65001 >nul",
    "setlocal EnableDelayedExpansion",
    'set "ELECTRON_RUN_AS_NODE="',
    `set "ASAR=${envInfo.asarPath}"`,
    `set "BAK=${backupAsarPath}"`,
    `set "APP_PKG=${path.join(envInfo.appDir, "package.json")}"`,
    `set "EXE=${exePath}"`,
    "",
    "echo [Antigravity RU] Завершение Antigravity для активации русского интерфейса...",
    "taskkill /IM Antigravity.exe >nul 2>&1",
    "timeout /t 2 /nobreak >nul",
    "taskkill /F /IM Antigravity.exe >nul 2>&1",
    "",
    'if not exist "%APP_PKG%" (',
    "  echo ОШИБКА: не найден локализованный resources\\app\\package.json!",
    "  pause",
    "  exit /b 1",
    ")",
    "",
    'if exist "%ASAR%" (',
    "  for /l %%i in (1,1,15) do (",
    '    if exist "%ASAR%" (',
    '      move /Y "%ASAR%" "%BAK%" >nul 2>&1',
    '      if exist "%ASAR%" timeout /t 1 /nobreak >nul',
    "    )",
    "  )",
    ")",
    "",
    'if exist "%ASAR%" (',
    "  echo ОШИБКА: не удалось переименовать app.asar. Закройте все окна Antigravity вручную и повторите попытку.",
    "  pause",
    "  exit /b 1",
    ")",
    "",
    "echo [Antigravity RU] Русификация активирована! Запуск Antigravity...",
    'start "" "%EXE%"',
    "exit /b 0",
  ];
  fs.writeFileSync(outPath, lines.join("\r\n") + "\r\n", "utf8");
  return outPath;
}

function parseArgs(argv) {
  const opts = {
    appDir: null,
    dryRun: false,
    status: false,
    syncPlugin: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--status") opts.status = true;
    else if (a === "--sync-plugin") opts.syncPlugin = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--app-dir" && i + 1 < argv.length) opts.appDir = argv[++i];
    else if (a.startsWith("--app-dir=")) opts.appDir = a.slice("--app-dir=".length);
  }
  return opts;
}

function printStatus(envInfo) {
  const metaPath = path.join(envInfo.appDir, "ru-patch-meta.json");
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : null;
  const localePath = path.join(getUserDataDir(), "agy_locale.json");
  let localeState = null;
  if (fs.existsSync(localePath)) {
    try {
      localeState = JSON.parse(fs.readFileSync(localePath, "utf8"));
    } catch {}
  }
  const asarExists = fs.existsSync(envInfo.asarPath);
  const appExists = fs.existsSync(envInfo.appDir);
  const activeMode = !asarExists && appExists && meta ? "russian_active" : asarExists && appExists && meta ? "staged_waiting_restart" : "stock_english";
  console.log(
    JSON.stringify(
      {
        activeMode,
        installDir: envInfo.installDir,
        resourcesDir: envInfo.resourcesDir,
        exePath: envInfo.exePath,
        stampVersion: envInfo.stampVersion,
        appAsarPresent: asarExists,
        backupAsars: envInfo.backups,
        localizedAppPresent: appExists,
        patchMeta: meta,
        localeFile: localePath,
        localeState,
      },
      null,
      2
    )
  );
}

function runInstall(targetAppDir, sourceAsar, stampVersion, dictObj, dynRuleCount) {
  const unpackStats = unpackAsar(sourceAsar, targetAppDir);
  console.log(`Unpacked ${unpackStats.unpackedFiles} files (kept ${unpackStats.skippedUnpacked} unpacked entries).`);

  const i18nDataDir = path.join(targetAppDir, "dist", "i18nData");
  fs.mkdirSync(i18nDataDir, { recursive: true });
  fs.copyFileSync(DICT_PATH, path.join(i18nDataDir, "dictionary-ru.json"));
  fs.copyFileSync(DYNAMIC_RULES_PATH, path.join(i18nDataDir, "dynamic-rules-ru.js"));
  fs.copyFileSync(ZIP_BUILDER_PATH, path.join(i18nDataDir, "zip-builder.js"));

  const pkg = JSON.parse(fs.readFileSync(path.join(targetAppDir, "package.json"), "utf8"));
  const resolvedStamp = stampVersion || pkg.version || "custom";
  let pluginVersion = "3.0.1";
  try {
    const pluginJsonPath = path.join(PLUGIN_ROOT, "plugin.json");
    if (fs.existsSync(pluginJsonPath)) {
      const pj = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
      if (pj && pj.version) pluginVersion = String(pj.version);
    }
  } catch {}
  const preloadSnippet = buildPreloadSnippet(dictObj, {
    version: pluginVersion,
    dictEntries: Object.keys(dictObj).length,
    dynamicRulesCount: dynRuleCount,
  });
  const { patchedFiles, warnings } = patchElectronShell(targetAppDir, preloadSnippet, {
    stampVersion: resolvedStamp,
  });

  const filesToCheck = patchedFiles.concat([
    path.join("i18nData", "dynamic-rules-ru.js"),
    path.join("i18nData", "zip-builder.js"),
  ]);
  for (const rel of filesToCheck) {
    checkJsSyntaxInProcess(path.join(targetAppDir, "dist", rel));
  }

  fs.writeFileSync(
    path.join(targetAppDir, "ru-patch-meta.json"),
    JSON.stringify(
      {
        pluginVersion,
        appVersion: pkg.version,
        installStamp: resolvedStamp,
        installedAt: new Date().toISOString(),
        dictEntries: Object.keys(dictObj).length,
        dynamicRulesCount: dynRuleCount,
        patchedFiles: filesToCheck,
        warnings,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  return { pkg, resolvedStamp, filesToCheck, warnings };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log("Usage: install-ru.js [--app-dir <path>] [--dry-run] [--status] [--sync-plugin]");
    return;
  }

  const envInfo = detectAntigravity(opts.appDir);

  if (opts.status) {
    printStatus(envInfo);
    return;
  }

  if (
    !fs.existsSync(DICT_PATH) ||
    !fs.existsSync(DYNAMIC_RULES_PATH) ||
    !fs.existsSync(DOM_TRANSLATOR_PATH) ||
    !fs.existsSync(THEME_ENGINE_PATH) ||
    !fs.existsSync(STUDIO_PANEL_PATH) ||
    !fs.existsSync(ZIP_BUILDER_PATH)
  ) {
    throw new Error(`Missing localization resources in ${RESOURCES_SRC_DIR}`);
  }

  const dictObj = JSON.parse(fs.readFileSync(DICT_PATH, "utf8"));
  const { DYNAMIC_RULES } = require(DYNAMIC_RULES_PATH);
  const sourceAsar = fs.existsSync(envInfo.asarPath) ? envInfo.asarPath : envInfo.latestBackupPath;
  if (!sourceAsar) {
    throw new Error(`No app.asar or backup found in ${envInfo.resourcesDir}`);
  }

  if (opts.dryRun) {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "agy-ru-dryrun-"));
    try {
      const tmpAppDir = path.join(tmpBase, "app");
      console.log(`[dry-run] Source ASAR: ${sourceAsar}`);
      console.log(`[dry-run] Target installDir: ${envInfo.installDir}`);
      const res = runInstall(tmpAppDir, sourceAsar, envInfo.stampVersion, dictObj, DYNAMIC_RULES.length);
      console.log(`[dry-run] Patched ${res.filesToCheck.length} files, version=${res.pkg.version}, stamp=${res.resolvedStamp}`);
      console.log(`[dry-run] Warnings: ${res.warnings.length}`);
      for (const w of res.warnings) console.log("  [WARN]", w);
      console.log("Dry-run PASSED.");
    } finally {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    return;
  }

  if (opts.syncPlugin) {
    const syncedPath = syncPluginToGlobalConfig();
    if (syncedPath) {
      console.log(`PLUGIN_SYNCED=${syncedPath}`);
    }
  }

  if (fs.existsSync(envInfo.appDir)) {
    try {
      fs.rmSync(envInfo.appDir, { recursive: true, force: true });
    } catch (err) {
      if (err && (err.code === "EBUSY" || err.code === "EPERM" || err.code === "ENOTEMPTY")) {
        console.log("Notice: resources\\app is in use by running Antigravity; updating in place.");
      } else {
        throw err;
      }
    }
  }

  console.log(`Installing Antigravity RU into: ${envInfo.installDir}`);
  const res = runInstall(envInfo.appDir, sourceAsar, envInfo.stampVersion, dictObj, DYNAMIC_RULES.length);
  console.log(`Successfully patched ${res.filesToCheck.length} files (dict=${Object.keys(dictObj).length}, rules=${DYNAMIC_RULES.length}).`);
  if (res.warnings.length > 0) {
    console.log(`Optional patch warnings (${res.warnings.length}):`);
    for (const w of res.warnings) console.log("  [WARN]", w);
  }
  console.log("Syntax verification (vm.Script) PASSED.");
  console.log(`INSTALL_DIR=${envInfo.installDir}`);
  if (envInfo.exePath) {
    console.log(`AGY_EXE=${envInfo.exePath}`);
  }

  const backupAsarPath = path.join(envInfo.resourcesDir, `app.asar.orig-${res.resolvedStamp}`);
  if (fs.existsSync(envInfo.asarPath)) {
    try {
      fs.renameSync(envInfo.asarPath, backupAsarPath);
      console.log(`Backup saved: ${backupAsarPath}`);
      console.log("STATUS=ACTIVATED");
    } catch (err) {
      if (err && (err.code === "EBUSY" || err.code === "EPERM" || err.code === "EACCES")) {
        if (process.platform === "win32") {
          const activatorPath = writeActivatorCmd(envInfo, backupAsarPath);
          console.log(`app.asar is locked by running Antigravity (${err.code}).`);
          console.log("STATUS=LOCKED_NEEDS_ACTIVATOR");
          console.log(`ACTIVATOR_PATH=${activatorPath}`);
        } else {
          console.log(`app.asar is locked (${err.code}). Close Antigravity and rename ${envInfo.asarPath} -> ${backupAsarPath}.`);
          console.log("STATUS=LOCKED_NEEDS_CLOSE");
        }
      } else {
        throw err;
      }
    }
  } else {
    console.log(`app.asar already backed up at ${path.basename(envInfo.latestBackupPath || backupAsarPath)}.`);
    console.log("STATUS=ACTIVATED");
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  detectAntigravity,
  getUserDataDir,
};
