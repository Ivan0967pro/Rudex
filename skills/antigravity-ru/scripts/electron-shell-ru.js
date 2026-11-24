"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

function replaceExact(src, target, replacement, desc) {
  const idx = src.indexOf(target);
  if (idx === -1) {
    throw new Error(`Required patch target not found [${desc}]: ${target.slice(0, 120)}...`);
  }
  return src.slice(0, idx) + replacement + src.slice(idx + target.length);
}

function tryReplaceExact(src, target, replacement, desc, warnings) {
  const idx = src.indexOf(target);
  if (idx === -1) {
    warnings.push(`Optional patch target not found [${desc}]`);
    return { text: src, applied: false };
  }
  return {
    text: src.slice(0, idx) + replacement + src.slice(idx + target.length),
    applied: true,
  };
}

function applySecondaryFile(src, requireTarget, requireReplacement, desc, fn, warnings) {
  if (!src.includes(requireTarget)) {
    warnings.push(`Skipped optional file patch [${desc}]: anchor not found`);
    return src;
  }
  const withReq = replaceExact(src, requireTarget, requireReplacement, desc);
  return fn(withReq, warnings);
}

const I18N_MAIN_SOURCE = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, ipcMain, webContents } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

let cachedLocale = null;
let ipcRegistered = false;
let lastHotkeyAt = 0;
let lastPanelHotkeyAt = 0;
const listeners = new Set();
let uiMaps = null;

const MAX_PERSONA_BODY_BYTES = 23500;
const DEFAULT_STUDIO_SETTINGS = {
  panelEnabled: true,
  dockPosition: "middle",
  showMiniTps: true,
  trackHistory: true,
  personaEnabled: false,
  personaActivePreset: "custom",
  personaText: "",
  customPresets: [],
};

function getStudioSettingsPath() {
  return path.join(app.getPath("userData"), "agy_studio_settings.json");
}

function getPersonaRulePath() {
  return path.join(os.homedir(), ".gemini", "config", "rules", "antigravity-ru-persona.md");
}

function sanitizeStudioSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const dock = src.dockPosition;
  const validDock = dock === "top" || dock === "middle" || dock === "bottom" || dock === "hidden" ? dock : "middle";
  const presets = Array.isArray(src.customPresets)
    ? src.customPresets
        .filter((item) => item && typeof item === "object" && typeof item.name === "string" && typeof item.text === "string")
        .slice(0, 20)
        .map((item, idx) => ({
          id: typeof item.id === "string" && item.id ? item.id : "custom-" + idx,
          name: item.name.trim().slice(0, 60) || "Preset",
          text: item.text,
        }))
    : [];
  return {
    panelEnabled: src.panelEnabled !== false,
    dockPosition: validDock,
    showMiniTps: src.showMiniTps !== false,
    trackHistory: src.trackHistory !== false,
    personaEnabled: Boolean(src.personaEnabled),
    personaActivePreset: typeof src.personaActivePreset === "string" && src.personaActivePreset ? src.personaActivePreset : "custom",
    personaText: typeof src.personaText === "string" ? src.personaText : "",
    customPresets: presets,
  };
}

function loadStudioSettings() {
  try {
    const p = getStudioSettingsPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      return sanitizeStudioSettings(parsed);
    }
  } catch {}
  return sanitizeStudioSettings({});
}

function saveStudioSettings(patch) {
  const current = loadStudioSettings();
  const next = sanitizeStudioSettings(Object.assign({}, current, patch && typeof patch === "object" ? patch : {}));
  try {
    const p = getStudioSettingsPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(next, null, 2) + "\\n", "utf8");
  } catch (err) {
    console.warn("[i18nMain] Failed to persist studio settings:", err && err.message ? err.message : err);
  }
  return next;
}

function stripRuleFrontmatter(md) {
  return String(md || "").replace(/^---\\r?\\n[\\s\\S]*?\\r?\\n---\\r?\\n*/, "");
}

function syncPersonaRuleFile(enabled, text) {
  const rulePath = getPersonaRulePath();
  const trimmed = String(text || "").trim();
  if (!enabled || !trimmed) {
    try {
      if (fs.existsSync(rulePath)) {
        fs.unlinkSync(rulePath);
      }
    } catch (err) {
      return { ok: false, exists: fs.existsSync(rulePath), byteLength: 0, error: err && err.message ? err.message : String(err) };
    }
    return { ok: true, exists: false, byteLength: 0 };
  }
  const bodyBytes = Buffer.byteLength(trimmed, "utf8");
  if (bodyBytes > MAX_PERSONA_BODY_BYTES) {
    return { ok: false, exists: fs.existsSync(rulePath), byteLength: bodyBytes, error: "EXCEEDS_BYTE_LIMIT" };
  }
  const header = "---\\ntrigger: always_on\\ndescription: \\"Пользовательский характер и инструкции агента (Antigravity RU Studio)\\"\\n---\\n\\n";
  const content = header + trimmed + "\\n";
  try {
    fs.mkdirSync(path.dirname(rulePath), { recursive: true });
    fs.writeFileSync(rulePath, content, "utf8");
    return { ok: true, exists: true, byteLength: Buffer.byteLength(content, "utf8") };
  } catch (err) {
    return { ok: false, exists: fs.existsSync(rulePath), byteLength: bodyBytes, error: err && err.message ? err.message : String(err) };
  }
}

function getPatchMeta() {
  try {
    const p = path.join(__dirname, "..", "ru-patch-meta.json");
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  } catch {}
  return null;
}

function getStudioState() {
  const settings = loadStudioSettings();
  const rulePath = getPersonaRulePath();
  let personaFileExists = false;
  try {
    personaFileExists = fs.existsSync(rulePath);
    if (personaFileExists) {
      const diskBody = stripRuleFrontmatter(fs.readFileSync(rulePath, "utf8")).trim();
      if (diskBody && (settings.personaEnabled || !settings.personaText)) {
        settings.personaText = diskBody;
      }
    }
  } catch {}
  return {
    locale: getLocale(),
    settings,
    personaFileExists,
    personaFilePath: rulePath,
    patchMeta: getPatchMeta(),
  };
}

function broadcastStudioSettings(state) {
  try {
    for (const wc of webContents.getAllWebContents()) {
      if (wc && !wc.isDestroyed()) {
        wc.send("agy-studio:settings-changed", state);
      }
    }
  } catch {}
}

function togglePanelFromHotkey(contents) {
  const now = Date.now();
  if (now - lastPanelHotkeyAt < 180) return;
  lastPanelHotkeyAt = now;
  try {
    if (contents && !contents.isDestroyed()) {
      contents.send("agy-studio:toggle-panel");
    }
  } catch {}
}

function normalizeUiPunct(str) {
  return String(str)
    .replace(/[\\u2018\\u2019]/g, "'")
    .replace(/[\\u201C\\u201D]/g, '"')
    .replace(/\\u2026/g, "...")
    .replace(/\\s+/g, " ")
    .trim();
}

function ensureUiTranslatorData() {
  if (uiMaps) return uiMaps;
  const exactMap = new Map();
  const punctMap = new Map();
  const lowerMap = new Map();
  let applyDynamicRules = () => null;
  try {
    const dictPath = path.join(__dirname, "i18nData", "dictionary-ru.json");
    const dynPath = path.join(__dirname, "i18nData", "dynamic-rules-ru.js");
    if (fs.existsSync(dictPath)) {
      const rawDict = JSON.parse(fs.readFileSync(dictPath, "utf8"));
      for (const key in rawDict) {
        if (!Object.prototype.hasOwnProperty.call(rawDict, key)) continue;
        const val = rawDict[key];
        if (typeof val !== "string" || !val || val === "__KEEP__") continue;
        const trimmed = key.trim();
        if (!trimmed) continue;
        exactMap.set(trimmed, val);
        const norm = normalizeUiPunct(trimmed);
        if (!punctMap.has(norm)) punctMap.set(norm, val);
        if (trimmed.length >= 4) {
          const low = norm.toLowerCase();
          if (!lowerMap.has(low)) lowerMap.set(low, val);
        }
      }
    }
    if (fs.existsSync(dynPath)) {
      const dynMod = require(dynPath);
      if (typeof dynMod.applyDynamicRules === "function") {
        applyDynamicRules = dynMod.applyDynamicRules;
      }
    }
  } catch (err) {
    console.warn("[i18nMain] Failed to load UI translation data:", err && err.message ? err.message : err);
  }
  uiMaps = { exactMap, punctMap, lowerMap, applyDynamicRules };
  return uiMaps;
}

function translateUiString(raw) {
  if (!isRu() || typeof raw !== "string" || !raw) return raw;
  const m = /^(\\s*)([\\s\\S]*?)(\\s*)$/.exec(raw);
  if (!m || !m[2]) return raw;
  const lead = m[1], core = m[2], tail = m[3];
  const { exactMap, punctMap, lowerMap, applyDynamicRules } = ensureUiTranslatorData();
  let translated = exactMap.get(core);
  if (translated === undefined) {
    const norm = normalizeUiPunct(core);
    translated = punctMap.get(norm);
    if (translated === undefined) {
      translated = applyDynamicRules(core) || (norm !== core ? applyDynamicRules(norm) : null) || undefined;
    }
    if (translated === undefined && core.length >= 4) {
      translated = lowerMap.get(norm.toLowerCase());
    }
  }
  if (translated === "__EMPTY__") return "";
  if (!translated || translated === core) return raw;
  return lead + translated + tail;
}

function getStorePath() {
  return path.join(app.getPath("userData"), "agy_locale.json");
}

function getLocale() {
  if (cachedLocale === "ru" || cachedLocale === "en") {
    return cachedLocale;
  }
  try {
    const raw = fs.readFileSync(getStorePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.locale === "ru" || parsed.locale === "en")) {
      cachedLocale = parsed.locale;
      return cachedLocale;
    }
  } catch {}
  cachedLocale = "ru";
  return cachedLocale;
}

function saveLocale(locale) {
  try {
    const p = getStorePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ locale }, null, 2) + "\\n", "utf8");
  } catch (err) {
    console.warn("[i18nMain] Failed to persist locale:", err && err.message ? err.message : err);
  }
}

function setLocale(next) {
  const normalized = next === "en" ? "en" : "ru";
  const changed = normalized !== getLocale();
  cachedLocale = normalized;
  saveLocale(normalized);
  if (changed) {
    try {
      for (const wc of webContents.getAllWebContents()) {
        if (wc && !wc.isDestroyed()) {
          wc.send("agy-i18n:locale-changed", normalized);
        }
      }
    } catch {}
    for (const cb of listeners) {
      try {
        cb(normalized);
      } catch {}
    }
  }
  return normalized;
}

function toggleLocale() {
  return setLocale(getLocale() === "ru" ? "en" : "ru");
}

function toggleLocaleFromHotkey() {
  const now = Date.now();
  if (now - lastHotkeyAt < 180) {
    return getLocale();
  }
  lastHotkeyAt = now;
  return toggleLocale();
}

function isRu() {
  return getLocale() !== "en";
}

function tr(ru, en) {
  return isRu() ? ru : en;
}

function ruPlural(n, one, few, many) {
  const num = Number(n);
  if (!Number.isFinite(num)) return many;
  if (!Number.isInteger(num)) return few;
  const abs = Math.abs(Math.trunc(num));
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function onLocaleChange(cb) {
  if (typeof cb === "function") {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }
  return () => {};
}

function registerI18nIpc() {
  if (ipcRegistered) return;
  ipcRegistered = true;
  if (!fs.existsSync(getStorePath())) {
    saveLocale(getLocale());
  }
  console.log("[antigravity-ru] Active Russian localization loaded (locale=" + getLocale() + ", store=" + getStorePath() + ")");
  ipcMain.on("agy-i18n:get-locale-sync", (event) => {
    event.returnValue = getLocale();
  });
  ipcMain.handle("agy-i18n:get-locale", () => getLocale());
  ipcMain.handle("agy-i18n:set-locale", (_event, next) => setLocale(next));
  ipcMain.handle("agy-i18n:toggle-locale", () => toggleLocale());
  ipcMain.handle("agy-studio:get-state", () => getStudioState());
  ipcMain.handle("agy-studio:save-settings", (_event, patch) => {
    saveStudioSettings(patch);
    const state = getStudioState();
    broadcastStudioSettings(state);
    return state;
  });
  ipcMain.handle("agy-studio:save-persona", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const enabled = Boolean(p.personaEnabled);
    const text = typeof p.personaText === "string" ? p.personaText : "";
    const syncRes = syncPersonaRuleFile(enabled, text);
    if (!syncRes.ok) {
      return { ok: false, error: syncRes.error || "SAVE_FAILED", byteLength: syncRes.byteLength, exists: syncRes.exists, state: getStudioState() };
    }
    saveStudioSettings({
      personaEnabled: enabled && syncRes.exists,
      personaText: text,
      personaActivePreset: typeof p.personaActivePreset === "string" ? p.personaActivePreset : "custom",
      customPresets: Array.isArray(p.customPresets) ? p.customPresets : undefined,
    });
    const state = getStudioState();
    broadcastStudioSettings(state);
    return { ok: true, exists: syncRes.exists, byteLength: syncRes.byteLength, state };
  });
}

exports.getLocale = getLocale;
exports.setLocale = setLocale;
exports.toggleLocale = toggleLocale;
exports.toggleLocaleFromHotkey = toggleLocaleFromHotkey;
exports.togglePanelFromHotkey = togglePanelFromHotkey;
exports.isRu = isRu;
exports.tr = tr;
exports.ruPlural = ruPlural;
exports.onLocaleChange = onLocaleChange;
exports.registerI18nIpc = registerI18nIpc;
exports.translateUiString = translateUiString;
`;

function patchMainJs(src, stampVersion, warnings) {
  const safeStamp = JSON.stringify(String(stampVersion || "custom"));
  const versionGuard = `"use strict";
;(() => {
    try {
        const _fs = require("fs");
        const _path = require("path");
        const { app: _app } = require("electron");
        const _resDir = process.resourcesPath || _path.resolve(__dirname, "..", "..");
        const _verPath = _path.join(_resDir, "..", "version");
        const _appDir = _path.join(_resDir, "app");
        const _STAMP = ${safeStamp};
        if (_fs.existsSync(_verPath) && _fs.existsSync(_appDir) && _fs.existsSync(_path.join(_resDir, "app.asar"))) {
            const _cur = _fs.readFileSync(_verPath, "utf8").trim();
            if (_cur && _cur !== _STAMP) {
                try {
                    _fs.renameSync(_appDir, _appDir + ".ru-outdated-" + _STAMP);
                    _app.relaunch();
                    _app.exit(0);
                    return;
                } catch {}
            }
        }
    } catch {}
})();`;

  src = replaceExact(src, `"use strict";`, versionGuard, "main.js version guard");

  if (src.includes(`const menu_1 = require("./menu");`)) {
    src = replaceExact(
      src,
      `const menu_1 = require("./menu");`,
      `const menu_1 = require("./menu");\nconst i18nMain_1 = require("./i18nMain");`,
      "main.js require i18nMain"
    );
  } else {
    src = replaceExact(
      src,
      `const electron_1 = require("electron");`,
      `const electron_1 = require("electron");\nconst i18nMain_1 = require("./i18nMain");`,
      "main.js require i18nMain fallback"
    );
  }

  src = replaceExact(
    src,
    `    const ipc = (0, ipcHandlers_1.registerIpcHandlers)(storageManager, {`,
    `    i18nMain_1.registerI18nIpc();\n    const ipc = (0, ipcHandlers_1.registerIpcHandlers)(storageManager, {`,
    "main.js registerI18nIpc"
  );

  src = tryReplaceExact(
    src,
    `electron_1.app.on('web-contents-created', (_event, contents) => {`,
    `electron_1.app.on('web-contents-created', (_event, contents) => {
    if (!(0, scriptJail_1.isScriptJailSession)(contents.session) &&
        !(0, captureWindow_1.isBrowserStreamSession)(contents.session)) {
        contents.on('before-input-event', (event, input) => {
            if (input.type === 'keyDown' &&
                (input.control || input.meta) &&
                input.alt &&
                !input.shift &&
                !input.isAutoRepeat &&
                (input.code === 'KeyL' || (input.key && input.key.toLowerCase() === 'l'))) {
                event.preventDefault();
                i18nMain_1.toggleLocaleFromHotkey();
            } else if (input.type === 'keyDown' &&
                (input.control || input.meta) &&
                input.alt &&
                !input.shift &&
                !input.isAutoRepeat &&
                (input.code === 'KeyP' || (input.key && input.key.toLowerCase() === 'p'))) {
                event.preventDefault();
                i18nMain_1.togglePanelFromHotkey(contents);
            }
        });
    }`,
    "main.js web-contents-created Ctrl+Alt+L",
    warnings
  ).text;

  src = tryReplaceExact(
    src,
    `        const msg = \`language_server binary not found at:\\n\${languageServer_1.LS_BINARY}\\n\\nPlease build set a valid location.\`;
        if (HEADLESS) {
            console.error('ERROR:', msg);
        }
        else {
            await electron_1.dialog.showErrorBox('Binary not found', msg);
        }`,
    `        const msg = i18nMain_1.tr(
            \`Бинарный файл language_server не найден по пути:\\n\${languageServer_1.LS_BINARY}\\n\\nУкажите корректный путь или переустановите приложение.\`,
            \`language_server binary not found at:\\n\${languageServer_1.LS_BINARY}\\n\\nPlease build set a valid location.\`
        );
        if (HEADLESS) {
            console.error('ERROR:', msg);
        }
        else {
            await electron_1.dialog.showErrorBox(i18nMain_1.tr('Файл не найден', 'Binary not found'), msg);
        }`,
    "main.js binary not found dialog",
    warnings
  ).text;

  src = tryReplaceExact(
    src,
    `            void electron_1.dialog.showMessageBox({
                type: 'warning',
                title: 'WSL distro not found',
                message: \`The WSL distro "\${WSL_DISTRO}" is no longer installed.\`,
                detail: 'Antigravity opened on Windows instead.',
            });`,
    `            void electron_1.dialog.showMessageBox({
                type: 'warning',
                title: i18nMain_1.tr('Дистрибутив WSL не найден', 'WSL distro not found'),
                message: i18nMain_1.tr(\`Дистрибутив WSL «\${WSL_DISTRO}» больше не установлен.\`, \`The WSL distro "\${WSL_DISTRO}" is no longer installed.\`),
                detail: i18nMain_1.tr('Вместо этого Antigravity открыт в Windows.', 'Antigravity opened on Windows instead.'),
            });`,
    "main.js WSL distro not found dialog",
    warnings
  ).text;

  src = tryReplaceExact(
    src,
    `            const msg = \`Failed to install the server into WSL distro "\${WSL_DISTRO}":\\n\${err.message}\`;
            (0, wsl_1.persistWslDistro)(path.join(electron_1.app.getPath('userData'), wsl_1.WSL_STATE_FILE), '');
            if (HEADLESS) {
                console.error('ERROR:', msg);
            }
            else {
                await electron_1.dialog.showErrorBox('WSL setup failed', msg);
            }`,
    `            const msg = i18nMain_1.tr(
                \`Не удалось установить сервер в дистрибутив WSL «\${WSL_DISTRO}»:\\n\${err.message}\`,
                \`Failed to install the server into WSL distro "\${WSL_DISTRO}":\\n\${err.message}\`
            );
            (0, wsl_1.persistWslDistro)(path.join(electron_1.app.getPath('userData'), wsl_1.WSL_STATE_FILE), '');
            if (HEADLESS) {
                console.error('ERROR:', msg);
            }
            else {
                await electron_1.dialog.showErrorBox(i18nMain_1.tr('Ошибка настройки WSL', 'WSL setup failed'), msg);
            }`,
    "main.js WSL setup failed dialog",
    warnings
  ).text;

  src = tryReplaceExact(
    src,
    `            await electron_1.dialog.showErrorBox('Startup failed', msg);`,
    `            await electron_1.dialog.showErrorBox(i18nMain_1.tr('Ошибка запуска', 'Startup failed'), msg);`,
    "main.js Startup failed dialog",
    warnings
  ).text;

  src = tryReplaceExact(
    src,
    `                    label: 'New Window',`,
    `                    label: i18nMain_1.tr('Новое окно', 'New Window'),`,
    "main.js dock New Window",
    warnings
  ).text;

  src = tryReplaceExact(
    src,
    `        (0, tray_1.createTray)([
            {
                id: 'running-agents',
                label: 'No agents running',
                enabled: false,
            },
            { type: 'separator' },
            {
                label: \`Open \${electron_1.app.getName()}\`,
                click: () => (0, utils_1.showOrCreateWindow)((0, languageServer_1.getLsPort)()),
            },
            {
                label: 'Quit',
                click: () => {
                    // Triggers 'before-quit' to run graceful cleanup without confirmation.
                    electron_1.app.quit();
                },
            },
        ],`,
    `        (0, tray_1.createTray)([
            {
                id: 'running-agents',
                label: i18nMain_1.tr('Агенты не запущены', 'No agents running'),
                enabled: false,
            },
            { type: 'separator' },
            {
                id: 'open-app',
                label: i18nMain_1.tr(\`Открыть \${electron_1.app.getName()}\`, \`Open \${electron_1.app.getName()}\`),
                click: () => (0, utils_1.showOrCreateWindow)((0, languageServer_1.getLsPort)()),
            },
            {
                id: 'toggle-locale',
                label: i18nMain_1.tr('Язык: Русский (переключить на EN)', 'Language: English (switch to RU)'),
                click: () => i18nMain_1.toggleLocale(),
            },
            {
                id: 'quit-app',
                label: i18nMain_1.tr('Выход', 'Quit'),
                click: () => {
                    // Triggers 'before-quit' to run graceful cleanup without confirmation.
                    electron_1.app.quit();
                },
            },
        ],`,
    "main.js tray menu",
    warnings
  ).text;

  src = tryReplaceExact(
    src,
    `    const options = {
        type: 'question',
        buttons: ['Cancel', 'Quit'],
        defaultId: 1,
        cancelId: 0,
        title: 'Confirm Quit',
        message: 'Are you sure you want to quit?',
        detail: 'There may be agents or background tasks running.',
    };`,
    `    const options = {
        type: 'question',
        buttons: [i18nMain_1.tr('Отмена', 'Cancel'), i18nMain_1.tr('Выход', 'Quit')],
        defaultId: 1,
        cancelId: 0,
        title: i18nMain_1.tr('Подтвердите выход', 'Confirm Quit'),
        message: i18nMain_1.tr('Вы уверены, что хотите выйти?', 'Are you sure you want to quit?'),
        detail: i18nMain_1.tr('Возможно, сейчас выполняются агенты или фоновые задачи.', 'There may be agents or background tasks running.'),
    };`,
    "main.js quit confirmation dialog",
    warnings
  ).text;

  return src;
}

function patchTrayJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const utils_1 = require("./utils");
// Keep tray as a global variable to prevent it from being garbage collected.
let tray = null;
let contextMenu = null;`,
    `const utils_1 = require("./utils");
const i18nMain_1 = require("./i18nMain");
// Keep tray as a global variable to prevent it from being garbage collected.
let tray = null;
let contextMenu = null;
let lastAgentCount = 0;

function formatAgentCountLabel(count) {
    if (i18nMain_1.isRu()) {
        if (count <= 0) return 'Агенты не запущены';
        const verb = i18nMain_1.ruPlural(count, 'Запущен', 'Запущено', 'Запущено');
        const noun = i18nMain_1.ruPlural(count, 'агент', 'агента', 'агентов');
        return \`\${verb} \${count} \${noun}\`;
    }
    return (count > 0 ? \`\${count}\` : 'No') + ' agent' + (count === 1 ? '' : 's') + ' running';
}

function refreshTrayLocale() {
    if (!tray || !contextMenu) return;
    const countItem = contextMenu.items.find((item) => item.id === 'running-agents');
    if (countItem) countItem.label = formatAgentCountLabel(lastAgentCount);
    const openItem = contextMenu.items.find((item) => item.id === 'open-app');
    if (openItem) openItem.label = i18nMain_1.tr(\`Открыть \${electron_1.app.getName()}\`, \`Open \${electron_1.app.getName()}\`);
    const toggleItem = contextMenu.items.find((item) => item.id === 'toggle-locale');
    if (toggleItem) toggleItem.label = i18nMain_1.tr('Язык: Русский (переключить на EN)', 'Language: English (switch to RU)');
    const quitItem = contextMenu.items.find((item) => item.id === 'quit-app');
    if (quitItem) quitItem.label = i18nMain_1.tr('Выход', 'Quit');
    const wslItem = contextMenu.items.find((item) => item.id === 'connect-to-wsl');
    if (wslItem) wslItem.label = i18nMain_1.tr('Подключиться к WSL', 'Connect to WSL');
    const reopenItem = contextMenu.items.find((item) => item.id === 'wsl-reopen-locally');
    if (reopenItem) reopenItem.label = i18nMain_1.tr('Открыть локально', 'Reopen Locally');
    tray.setContextMenu(contextMenu);
}
i18nMain_1.onLocaleChange(refreshTrayLocale);`,
    "tray.js setup + refreshTrayLocale",
    (text, warns) =>
      tryReplaceExact(
        text,
        `function updateTrayAgentCount(count) {
    if (tray && contextMenu) {
        const countItem = contextMenu.items.find((item) => item.id === 'running-agents');
        if (countItem) {
            countItem.label =
                (count > 0 ? \`\${count}\` : 'No') +
                    ' agent' +
                    (count === 1 ? '' : 's') +
                    ' running';
            tray.setContextMenu(contextMenu);
        }
    }
}`,
        `function updateTrayAgentCount(count) {
    lastAgentCount = count;
    if (tray && contextMenu) {
        const countItem = contextMenu.items.find((item) => item.id === 'running-agents');
        if (countItem) {
            countItem.label = formatAgentCountLabel(count);
            tray.setContextMenu(contextMenu);
        }
    }
}`,
        "tray.js updateTrayAgentCount",
        warns
      ).text,
    warnings
  );
}

function patchUpdaterJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const utils_1 = require("./utils");`,
    `const utils_1 = require("./utils");\nconst i18nMain_1 = require("./i18nMain");`,
    "updater.js require i18nMain",
    (text, warns) => {
      const helpersStep = tryReplaceExact(
        text,
        `exports.updateActions = {
    [MenuUpdateStep.CheckForUpdates]: () => checkForUpdates(true),
    [MenuUpdateStep.CheckingForUpdates]: undefined,
    [MenuUpdateStep.DownloadingUpdate]: undefined,
    [MenuUpdateStep.RestartToUpdate]: () => void quitAndInstall(),
};`,
        `exports.updateActions = {
    [MenuUpdateStep.CheckForUpdates]: () => checkForUpdates(true),
    [MenuUpdateStep.CheckingForUpdates]: undefined,
    [MenuUpdateStep.DownloadingUpdate]: undefined,
    [MenuUpdateStep.RestartToUpdate]: () => void quitAndInstall(),
};
let currentStep = MenuUpdateStep.CheckForUpdates;
function getStepLabel(step) {
    switch (step) {
        case MenuUpdateStep.CheckingForUpdates:
            return i18nMain_1.tr('Проверка обновлений…', 'Checking for Updates...');
        case MenuUpdateStep.DownloadingUpdate:
            return i18nMain_1.tr('Загрузка обновления…', 'Downloading Update...');
        case MenuUpdateStep.RestartToUpdate:
            return i18nMain_1.tr('Перезапустить для обновления', 'Restart to Update');
        case MenuUpdateStep.CheckForUpdates:
        default:
            return i18nMain_1.tr('Проверить обновления', 'Check for Updates');
    }
}
function getCurrentStepLabel() {
    return getStepLabel(currentStep);
}
function triggerCurrentUpdateAction() {
    const action = exports.updateActions[currentStep];
    action?.();
}`,
        "updater.js step helpers",
        warns
      );

      let out = helpersStep.text;
      if (helpersStep.applied) {
        out = tryReplaceExact(
          out,
          `exports.applyHostUpdate = applyHostUpdate;`,
          `exports.applyHostUpdate = applyHostUpdate;\nexports.getStepLabel = getStepLabel;\nexports.getCurrentStepLabel = getCurrentStepLabel;\nexports.triggerCurrentUpdateAction = triggerCurrentUpdateAction;`,
          "updater.js exports",
          warns
        ).text;
        out = tryReplaceExact(
          out,
          `function updateMenuState(step) {
    const menu = electron_1.Menu.getApplicationMenu();
    if (menu) {
        const item = menu.getMenuItemById('check-for-updates');
        if (item) {
            item.label = step;
            item.enabled = exports.updateActions[step] !== undefined;
        }
    }
}`,
          `function updateMenuState(step) {
    currentStep = step;
    const menu = electron_1.Menu.getApplicationMenu();
    if (menu) {
        const item = menu.getMenuItemById('check-for-updates');
        if (item) {
            item.label = getStepLabel(step);
            item.enabled = exports.updateActions[step] !== undefined;
        }
    }
}
i18nMain_1.onLocaleChange(() => updateMenuState(currentStep));`,
          "updater.js updateMenuState",
          warns
        ).text;
      }

      out = tryReplaceExact(
        out,
        `            const options = {
                type: 'info',
                title: 'Check for Updates',
                message: 'No updates available',
                buttons: ['OK'],
            };`,
        `            const options = {
                type: 'info',
                title: i18nMain_1.tr('Проверка обновлений', 'Check for Updates'),
                message: i18nMain_1.tr('Доступных обновлений нет', 'No updates available'),
                buttons: ['OK'],
            };`,
        "updater.js no updates dialog",
        warns
      ).text;
      return out;
    },
    warnings
  );
}

function patchMenuJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const hubZoom_1 = require("./hubZoom");`,
    `const hubZoom_1 = require("./hubZoom");\nconst i18nMain_1 = require("./i18nMain");`,
    "menu.js require i18nMain",
    (text, warns) => {
      let out = text;
      const helperStep = tryReplaceExact(
        out,
        `function configureViewZoomMenu(appMenu) {
    const viewMenuItem = appMenu.items?.find((item) => item.label === 'View');`,
        `function findSubmenuItem(appMenu, enLabel, ruLabel) {
    return appMenu.items?.find((item) => item.label === enLabel || item.label === ruLabel);
}
function configureViewZoomMenu(appMenu) {
    const viewMenuItem = findSubmenuItem(appMenu, 'View', 'Вид');`,
        "menu.js configureViewZoomMenu view lookup",
        warns
      );
      out = helperStep.text;

      out = tryReplaceExact(
        out,
        `        if (role === 'resetzoom') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-reset-zoom',
                label: item.label || 'Actual Size',
                accelerator: item.accelerator || 'CmdOrCtrl+0',
                action: 'reset',
                enabled: item.enabled,
                visible: item.visible,
            }));
        }
        else if (role === 'zoomin') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-zoom-in',
                label: item.label || 'Zoom In',
                accelerator: item.accelerator || 'CmdOrCtrl+Plus',
                action: 'in',
                enabled: item.enabled,
                visible: item.visible,
            }), 
            // Electron's default \`CommandOrControl+Plus\` only matches shifted \`+\`
            // on Linux/Windows; register a hidden \`CmdOrCtrl+=\` alias so unshifted
            // \`Ctrl+=\` / \`Cmd+=\` zooms the Hub UI without duplicating the menu row.
            createHubZoomMenuItem({
                id: 'hub-zoom-in-equal',
                label: 'Zoom In',
                accelerator: 'CmdOrCtrl+=',
                action: 'in',
                enabled: item.enabled,
                visible: false,
                acceleratorWorksWhenHidden: true,
            }));
        }
        else if (role === 'zoomout') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-zoom-out',
                label: item.label || 'Zoom Out',
                accelerator: item.accelerator || 'CmdOrCtrl+-',
                action: 'out',
                enabled: item.enabled,
                visible: item.visible,
            }));
        }`,
        `        if (role === 'resetzoom') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-reset-zoom',
                label: i18nMain_1.tr('Масштаб 100%', item.label || 'Actual Size'),
                accelerator: item.accelerator || 'CmdOrCtrl+0',
                action: 'reset',
                enabled: item.enabled,
                visible: item.visible,
            }));
        }
        else if (role === 'zoomin') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-zoom-in',
                label: i18nMain_1.tr('Увеличить', item.label || 'Zoom In'),
                accelerator: item.accelerator || 'CmdOrCtrl+Plus',
                action: 'in',
                enabled: item.enabled,
                visible: item.visible,
            }), 
            // Electron's default \`CommandOrControl+Plus\` only matches shifted \`+\`
            // on Linux/Windows; register a hidden \`CmdOrCtrl+=\` alias so unshifted
            // \`Ctrl+=\` / \`Cmd+=\` zooms the Hub UI without duplicating the menu row.
            createHubZoomMenuItem({
                id: 'hub-zoom-in-equal',
                label: i18nMain_1.tr('Увеличить', 'Zoom In'),
                accelerator: 'CmdOrCtrl+=',
                action: 'in',
                enabled: item.enabled,
                visible: false,
                acceleratorWorksWhenHidden: true,
            }));
        }
        else if (role === 'zoomout') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-zoom-out',
                label: i18nMain_1.tr('Уменьшить', item.label || 'Zoom Out'),
                accelerator: item.accelerator || 'CmdOrCtrl+-',
                action: 'out',
                enabled: item.enabled,
                visible: item.visible,
            }));
        }`,
        "menu.js zoom labels",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `    else {
        viewSubmenu.items.splice(0, viewSubmenu.items.length, ...nextItems);
    }
}`,
        `    else {
        viewSubmenu.items.splice(0, viewSubmenu.items.length, ...nextItems);
    }
    if (!viewSubmenu.items.some((i) => i.id === 'agy-toggle-locale')) {
        viewSubmenu.append(new electron_1.MenuItem({ type: 'separator' }));
        viewSubmenu.append(new electron_1.MenuItem({
            id: 'agy-toggle-locale',
            label: i18nMain_1.tr('Язык интерфейса: Русский (RU / EN) — Ctrl+Alt+L', 'Interface Language: English (RU / EN) — Ctrl+Alt+L'),
            click: () => i18nMain_1.toggleLocale(),
        }));
    }
}`,
        "menu.js append toggle locale item",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `    // Adds a "New Window" item to the top of the existing File menu.
    addItemToSubmenu(menu, 'File', 0, new electron_1.MenuItem({
        label: 'New Window',
        accelerator: 'CmdOrCtrl+Shift+N',`,
        `    // Adds a "New Window" item to the top of the existing File menu.
    addItemToSubmenu(menu, 'File', 0, new electron_1.MenuItem({
        id: 'agy-new-window',
        label: i18nMain_1.tr('Новое окно', 'New Window'),
        accelerator: 'CmdOrCtrl+Shift+N',`,
        "menu.js New Window",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `            appSubmenu.insert(1, new electron_1.MenuItem({
                id: 'check-for-updates',
                label: updater_1.MenuUpdateStep.CheckForUpdates,
                click: (menuItem) => {
                    const action = updater_1.updateActions[menuItem.label];
                    action?.();
                },
            }));`,
        `            appSubmenu.insert(1, new electron_1.MenuItem({
                id: 'check-for-updates',
                label: updater_1.getCurrentStepLabel ? updater_1.getCurrentStepLabel() : updater_1.MenuUpdateStep.CheckForUpdates,
                click: (menuItem) => {
                    if (updater_1.triggerCurrentUpdateAction) {
                        updater_1.triggerCurrentUpdateAction();
                    } else {
                        const action = updater_1.updateActions[menuItem.label];
                        action?.();
                    }
                },
            }));`,
        "menu.js check-for-updates click",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `    // Adds Docs to the Help menu.
    addItemToSubmenu(menu, 'Help', 0, new electron_1.MenuItem({
        label: 'Docs',`,
        `    // Adds Docs to the Help menu.
    addItemToSubmenu(menu, 'Help', 0, new electron_1.MenuItem({
        id: 'agy-docs',
        label: i18nMain_1.tr('Документация', 'Docs'),`,
        "menu.js Docs",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `    return { label: 'Connect to WSL', submenu };`,
        `    return { id: 'connect-to-wsl', label: i18nMain_1.tr('Подключиться к WSL', 'Connect to WSL'), submenu };`,
        "menu.js Connect to WSL",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `    return { label: 'Reopen Locally', click: () => relaunchWithWslDistro('') };`,
        `    return { id: 'wsl-reopen-locally', label: i18nMain_1.tr('Открыть локально', 'Reopen Locally'), click: () => relaunchWithWslDistro('') };`,
        "menu.js Reopen Locally",
        warns
      ).text;

      if (helperStep.applied) {
        out = tryReplaceExact(
          out,
          `function addItemToSubmenu(appMenu, submenuLabel, position, item) {
    const submenuItem = appMenu.items.find((item) => item.label === submenuLabel);
    if (!submenuItem?.submenu) {
        return;
    }
    submenuItem.submenu.insert(position, item);
}`,
          `const SUBMENU_ALIASES = {
    File: 'Файл',
    View: 'Вид',
    Help: 'Справка',
};
function addItemToSubmenu(appMenu, submenuLabel, position, item) {
    const submenuItem = findSubmenuItem(appMenu, submenuLabel, SUBMENU_ALIASES[submenuLabel] || submenuLabel);
    if (!submenuItem?.submenu) {
        return;
    }
    submenuItem.submenu.insert(position, item);
}
i18nMain_1.onLocaleChange(() => {
    const appMenu = electron_1.Menu.getApplicationMenu();
    if (!appMenu) return;
    const setL = (id, ru, en) => {
        const it = appMenu.getMenuItemById(id);
        if (it) it.label = i18nMain_1.tr(ru, en);
    };
    setL('agy-new-window', 'Новое окно', 'New Window');
    setL('agy-docs', 'Документация', 'Docs');
    setL('hub-reset-zoom', 'Масштаб 100%', 'Actual Size');
    setL('hub-zoom-in', 'Увеличить', 'Zoom In');
    setL('hub-zoom-out', 'Уменьшить', 'Zoom Out');
    setL('connect-to-wsl', 'Подключиться к WSL', 'Connect to WSL');
    setL('wsl-reopen-locally', 'Открыть локально', 'Reopen Locally');
    setL('agy-toggle-locale', 'Язык интерфейса: Русский (RU / EN) — Ctrl+Alt+L', 'Interface Language: English (RU / EN) — Ctrl+Alt+L');
    electron_1.Menu.setApplicationMenu(appMenu);
});`,
          "menu.js addItemToSubmenu + onLocaleChange",
          warns
        ).text;
      }

      return out;
    },
    warnings
  );
}

function patchIpcHandlersJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const paths_1 = require("./paths");`,
    `const paths_1 = require("./paths");\nconst i18nMain_1 = require("./i18nMain");`,
    "ipcHandlers.js require i18nMain",
    (text, warns) => {
      let out = text;
      out = tryReplaceExact(
        out,
        `exports.registerIpcHandlers = registerIpcHandlers;`,
        `exports.registerIpcHandlers = registerIpcHandlers;\nexports.buildContextMenuTemplate = buildContextMenuTemplate;`,
        "ipcHandlers.js export buildContextMenuTemplate",
        warns
      ).text;
      out = tryReplaceExact(
        out,
        `        if (item.type === 'submenu' || (item.submenu && item.submenu.length > 0)) {
            return {
                id: item.id,
                label: item.label ?? '',
                type: 'submenu',
                enabled: !item.disabled,
                submenu: buildContextMenuTemplate(item.submenu ?? [], onSelect),
            };
        }
        return {
            id: item.id,
            label: item.label ?? '',`,
        `        if (item.type === 'submenu' || (item.submenu && item.submenu.length > 0)) {
            return {
                id: item.id,
                label: i18nMain_1.translateUiString(item.label ?? ''),
                ...(typeof item.sublabel === 'string' ? { sublabel: i18nMain_1.translateUiString(item.sublabel) } : {}),
                type: 'submenu',
                enabled: !item.disabled,
                submenu: buildContextMenuTemplate(item.submenu ?? [], onSelect),
            };
        }
        return {
            id: item.id,
            label: i18nMain_1.translateUiString(item.label ?? ''),
            ...(typeof item.sublabel === 'string' ? { sublabel: i18nMain_1.translateUiString(item.sublabel) } : {}),`,
        "ipcHandlers.js buildContextMenuTemplate",
        warns
      ).text;
      out = tryReplaceExact(
        out,
        `        if (t.error) {
            electron_1.dialog.showErrorBox('Cannot open folder', t.error);
            return undefined;
        }
        if (t.warning) {
            void electron_1.dialog.showMessageBox({
                type: 'warning',
                message: 'Folder is on the Windows filesystem',
                detail: t.warning,
            });
        }
        return t.path;
    }
    localOnly('dialog:open-workspace', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: 'Open workspace',`,
        `        if (t.error) {
            electron_1.dialog.showErrorBox(i18nMain_1.tr('Не удалось открыть папку', 'Cannot open folder'), t.error);
            return undefined;
        }
        if (t.warning) {
            void electron_1.dialog.showMessageBox({
                type: 'warning',
                message: i18nMain_1.tr('Папка находится в файловой системе Windows', 'Folder is on the Windows filesystem'),
                detail: t.warning,
            });
        }
        return t.path;
    }
    localOnly('dialog:open-workspace', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: i18nMain_1.tr('Открыть рабочую область', 'Open workspace'),`,
        "ipcHandlers.js open-workspace dialog",
        warns
      ).text;
      out = tryReplaceExact(
        out,
        `            title: 'Open workspaces',`,
        `            title: i18nMain_1.tr('Открыть рабочие области', 'Open workspaces'),`,
        "ipcHandlers.js open-workspaces dialog",
        warns
      ).text;
      out = tryReplaceExact(
        out,
        `            title: 'Select Download Folder',`,
        `            title: i18nMain_1.tr('Выберите папку для загрузок', 'Select Download Folder'),`,
        "ipcHandlers.js select download folder",
        warns
      ).text;
      return out;
    },
    warnings
  );
}

function patchProvisionSplashJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const electron_1 = require("electron");`,
    `const electron_1 = require("electron");\nconst i18nMain_1 = require("./i18nMain");`,
    "provisionSplash.js require i18nMain",
    (text, warns) =>
      tryReplaceExact(
        text,
        `<div>Setting up WSL: \${escapeHtml(distro)}</div>`,
        `<div>\${i18nMain_1.tr('Настройка WSL', 'Setting up WSL')}: \${escapeHtml(distro)}</div>`,
        "provisionSplash.js heading",
        warns
      ).text,
    warnings
  );
}

function patchWizardHtmlJs(src, warnings) {
  return applySecondaryFile(
    src,
    `exports.getWizardHtml = getWizardHtml;`,
    `exports.getWizardHtml = getWizardHtml;\nconst i18nMain_1 = require("../i18nMain");`,
    "wizardHtml.js require i18nMain",
    (text, warns) => {
      let out = text;
      out = tryReplaceExact(out, `<html lang="en">`, `<html lang="\${i18nMain_1.getLocale()}">`, "wizardHtml.js lang", warns).text;
      out = tryReplaceExact(out, `<title>Welcome to Antigravity</title>`, `<title>\${i18nMain_1.tr('Добро пожаловать в Antigravity', 'Welcome to Antigravity')}</title>`, "wizardHtml.js title", warns).text;
      out = tryReplaceExact(out, `Setting up…`, `\${i18nMain_1.tr('Настройка…', 'Setting up…')}`, "wizardHtml.js setting up", warns).text;
      out = tryReplaceExact(
        out,
        `<h1>Welcome to the new Antigravity!</h1>
      <p>Antigravity has been redesigned to put agents first with new capabilities. If you'd still like a code editor, you can download it as a separate app named <b>Antigravity IDE</b>.</p>`,
        `<h1>\${i18nMain_1.tr('Добро пожаловать в новый Antigravity!', 'Welcome to the new Antigravity!')}</h1>
      <p>\${i18nMain_1.tr('Antigravity был обновлён: теперь агенты и новые возможности находятся в центре рабочего процесса. Если вам по-прежнему нужен редактор кода, вы можете скачать его в виде отдельного приложения <b>Antigravity IDE</b>.', "Antigravity has been redesigned to put agents first with new capabilities. If you'd still like a code editor, you can download it as a separate app named <b>Antigravity IDE</b>.")}</p>`,
        "wizardHtml.js welcome body",
        warns
      ).text;
      out = tryReplaceExact(out, `<span>Download the Antigravity IDE</span>`, `<span>\${i18nMain_1.tr('Скачать Antigravity IDE', 'Download the Antigravity IDE')}</span>`, "wizardHtml.js checkbox", warns).text;
      out = tryReplaceExact(out, `<button class="btn-primary" id="btn-skip">Explore the new Antigravity</button>`, `<button class="btn-primary" id="btn-skip">\${i18nMain_1.tr('Начать работу с Antigravity', 'Explore the new Antigravity')}</button>`, "wizardHtml.js button", warns).text;
      return out;
    },
    warnings
  );
}

function patchDisconnectedPageJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const crypto = __importStar(require("crypto"));`,
    `const crypto = __importStar(require("crypto"));\nconst i18nMain_1 = require("../i18nMain");`,
    "disconnectedPage.js require i18nMain",
    (text, warns) => {
      const btnStep = tryReplaceExact(
        text,
        `const BUTTON_LABELS = {
    reconnect: 'Reconnect',
    stop: 'Stop Server',
    close: 'Close',
};`,
        `function getButtonLabels() {
    return {
        reconnect: i18nMain_1.tr('Переподключиться', 'Reconnect'),
        stop: i18nMain_1.tr('Остановить сервер', 'Stop Server'),
        close: i18nMain_1.tr('Закрыть', 'Close'),
    };
}`,
        "disconnectedPage.js button labels",
        warns
      );
      if (!btnStep.applied) return text;
      const bodyStep = tryReplaceExact(
        btnStep.text,
        `    const title = restarting
        ? 'Restarting…'
        : connecting
            ? 'Reconnecting…'
            : 'Disconnected';
    const heading = restarting
        ? \`Restarting the Antigravity server on \${host}…\`
        : connecting
            ? \`Reconnecting to \${host}…\`
            : \`Disconnected from \${host}\`;
    const details = connecting
        ? []
        : (page.detail ?? '').split('\\n').filter((l) => l.trim());
    const body = restarting
        ? 'This window opens it again once it has started.'
        : connecting
            ? page.serverStopped
                ? \`Its server on \${host} stopped, and its agents with it.\`
                : \`Agents keep running on \${host}.\`
            : page.serverStopped
                ? \`Its agents on \${host} stopped with it.\`
                : \`Agents keep running on \${host} unless its server stopped.\`;
    const action = (name) => \`\${ACTION_ORIGIN}/\${name}?page=\${encodeURIComponent(token)}\`;
    const spinner = connecting ? '<div class="spinner"></div>' : '';
    const buttons = actionsOf(page)
        .map((name) => \`<a class="button\${name === 'reconnect' ? ' primary' : ''}" href="\${action(name)}">\${BUTTON_LABELS[name]}</a>\`)
        .join('');
    const html = \`<!DOCTYPE html>
<html lang="en">`,
        `    const title = restarting
        ? i18nMain_1.tr('Перезапуск…', 'Restarting…')
        : connecting
            ? i18nMain_1.tr('Переподключение…', 'Reconnecting…')
            : i18nMain_1.tr('Отключено', 'Disconnected');
    const heading = restarting
        ? i18nMain_1.tr(\`Перезапуск сервера Antigravity на \${host}…\`, \`Restarting the Antigravity server on \${host}…\`)
        : connecting
            ? i18nMain_1.tr(\`Переподключение к \${host}…\`, \`Reconnecting to \${host}…\`)
            : i18nMain_1.tr(\`Отключено от \${host}\`, \`Disconnected from \${host}\`);
    const details = connecting
        ? []
        : (page.detail ?? '').split('\\n').filter((l) => l.trim());
    const body = restarting
        ? i18nMain_1.tr('Это окно снова откроет подключение, как только сервер запустится.', 'This window opens it again once it has started.')
        : connecting
            ? page.serverStopped
                ? i18nMain_1.tr(\`Сервер на \${host} остановлен вместе со всеми агентами.\`, \`Its server on \${host} stopped, and its agents with it.\`)
                : i18nMain_1.tr(\`Агенты продолжают работать на \${host}.\`, \`Agents keep running on \${host}.\`)
            : page.serverStopped
                ? i18nMain_1.tr(\`Агенты на \${host} были остановлены вместе с сервером.\`, \`Its agents on \${host} stopped with it.\`)
                : i18nMain_1.tr(\`Агенты продолжают работать на \${host}, если сервер не был остановлен.\`, \`Agents keep running on \${host} unless its server stopped.\`);
    const action = (name) => \`\${ACTION_ORIGIN}/\${name}?page=\${encodeURIComponent(token)}\`;
    const spinner = connecting ? '<div class="spinner"></div>' : '';
    const buttonLabels = getButtonLabels();
    const buttons = actionsOf(page)
        .map((name) => \`<a class="button\${name === 'reconnect' ? ' primary' : ''}" href="\${action(name)}">\${buttonLabels[name]}</a>\`)
        .join('');
    const html = \`<!DOCTYPE html>
<html lang="\${i18nMain_1.getLocale()}">`,
        "disconnectedPage.js body + lang",
        warns
      );
      return bodyStep.applied ? bodyStep.text : text;
    },
    warnings
  );
}

function patchSshPromptsJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const electron_1 = require("electron");`,
    `const electron_1 = require("electron");\nconst i18nMain_1 = require("../i18nMain");`,
    "sshPrompts.js require i18nMain",
    (text, warns) => {
      let out = text;

      const touchDef = tryReplaceExact(
        out,
        `const TOUCH_TITLE = 'Touch your security key';`,
        `const getTouchTitle = () => i18nMain_1.tr('Коснитесь ключа безопасности', 'Touch your security key');`,
        "sshPrompts.js TOUCH_TITLE",
        warns
      );
      if (touchDef.applied) {
        const touchUse = tryReplaceExact(
          touchDef.text,
          `    if (kind === 'notice') {
        return TOUCH_TITLE;
    }`,
          `    if (kind === 'notice') {
        return getTouchTitle();
    }`,
          "sshPrompts.js notice title",
          warns
        );
        if (touchUse.applied) {
          out = touchUse.text;
        }
      }

      out = tryReplaceExact(
        out,
        `    [
        '',
        "'s password:",
        (who) => (isAccount(who) ? ['Password', who] : undefined),
    ],
    [
        'Enter ',
        "'s old password:",
        (who) => (isAccount(who) ? ['Current password', who] : undefined),
    ],
    [
        'Enter ',
        "'s new password:",
        (who) => (isAccount(who) ? ['New password', who] : undefined),
    ],
    [
        'Retype ',
        "'s new password:",
        (who) => (isAccount(who) ? ['Confirm new password', who] : undefined),
    ],
    ["Enter passphrase for key '", "':", (key) => ['Passphrase', baseName(key)]],
    [
        'Enter PIN for ',
        ':',
        (what) => {
            // A PKCS#11 token's label, quoted.
            if (what.length > 2 && what.startsWith("'") && what.endsWith("'")) {
                return ['PIN', what.slice(1, -1)];
            }
            // A FIDO key's type and file.
            const key = what.indexOf(' key ');
            return key < 0 ? undefined : ['PIN', baseName(what.slice(key + 5))];
        },
    ],`,
        `    [
        '',
        "'s password:",
        (who) => (isAccount(who) ? [i18nMain_1.tr('Пароль', 'Password'), who] : undefined),
    ],
    [
        'Enter ',
        "'s old password:",
        (who) => (isAccount(who) ? [i18nMain_1.tr('Текущий пароль', 'Current password'), who] : undefined),
    ],
    [
        'Enter ',
        "'s new password:",
        (who) => (isAccount(who) ? [i18nMain_1.tr('Новый пароль', 'New password'), who] : undefined),
    ],
    [
        'Retype ',
        "'s new password:",
        (who) => (isAccount(who) ? [i18nMain_1.tr('Подтверждение нового пароля', 'Confirm new password'), who] : undefined),
    ],
    ["Enter passphrase for key '", "':", (key) => [i18nMain_1.tr('Парольная фраза', 'Passphrase'), baseName(key)]],
    [
        'Enter PIN for ',
        ':',
        (what) => {
            // A PKCS#11 token's label, quoted.
            if (what.length > 2 && what.startsWith("'") && what.endsWith("'")) {
                return [i18nMain_1.tr('PIN-код', 'PIN'), what.slice(1, -1)];
            }
            // A FIDO key's type and file.
            const key = what.indexOf(' key ');
            return key < 0 ? undefined : [i18nMain_1.tr('PIN-код', 'PIN'), baseName(what.slice(key + 5))];
        },
    ],`,
        "sshPrompts.js SSH_SECRETS",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `        return host && hostPromptsMarked
            ? \`Trust \${hostName(host.split(' (')[0])}?\`
            : undefined;`,
        `        return host && hostPromptsMarked
            ? i18nMain_1.tr(\`Доверять \${hostName(host.split(' (')[0])}?\`, \`Trust \${hostName(host.split(' (')[0])}?\`)
            : undefined;`,
        "sshPrompts.js Trust host",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `        return host && hostPromptsMarked
            ? \`Connect to \${hostName(host)} anyway?\`
            : undefined;
    }
    if (text.startsWith('Accept updated hostkeys?')) {
        return 'Accept updated host keys?';
    }
    // 'Add key %s (%s) to agent?': the key's file, then its comment. Only ssh's
    // \`confirm\` hint makes it a question, so no host words it.
    const key = between(text, 'Add key ', ' to agent?');
    return key ? \`Add \${baseName(key.split(' (')[0])} to ssh-agent?\` : undefined;`,
        `        return host && hostPromptsMarked
            ? i18nMain_1.tr(\`Всё равно подключиться к \${hostName(host)}?\`, \`Connect to \${hostName(host)} anyway?\`)
            : undefined;
    }
    if (text.startsWith('Accept updated hostkeys?')) {
        return i18nMain_1.tr('Принять обновлённые ключи хоста?', 'Accept updated host keys?');
    }
    // 'Add key %s (%s) to agent?': the key's file, then its comment. Only ssh's
    // \`confirm\` hint makes it a question, so no host words it.
    const key = between(text, 'Add key ', ' to agent?');
    return key ? i18nMain_1.tr(\`Добавить \${baseName(key.split(' (')[0])} в ssh-agent?\`, \`Add \${baseName(key.split(' (')[0])} to ssh-agent?\`) : undefined;`,
        "sshPrompts.js sshQuestionTitle",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `function wordedTitle(kind, text, who) {
    if (kind === 'confirm') {
        return \`Question from \${who}\`;
    }
    if (CODE_WORDS.test(text)) {
        return \`Verification code for \${who}\`;
    }
    if (/password/i.test(text)) {
        return \`Password for \${who}\`;
    }
    return /\\bpin\\b/i.test(text) ? \`PIN for \${who}\` : \`Sign in to \${who}\`;
}`,
        `function wordedTitle(kind, text, who) {
    if (kind === 'confirm') {
        return i18nMain_1.tr(\`Вопрос от \${who}\`, \`Question from \${who}\`);
    }
    if (CODE_WORDS.test(text)) {
        return i18nMain_1.tr(\`Код подтверждения для \${who}\`, \`Verification code for \${who}\`);
    }
    if (/password/i.test(text)) {
        return i18nMain_1.tr(\`Пароль для \${who}\`, \`Password for \${who}\`);
    }
    return /\\bpin\\b/i.test(text)
        ? i18nMain_1.tr(\`PIN-код для \${who}\`, \`PIN for \${who}\`)
        : i18nMain_1.tr(\`Вход на \${who}\`, \`Sign in to \${who}\`);
}`,
        "sshPrompts.js wordedTitle",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `        title = asked
            ? \`\${asked[0]} for \${hostPromptsMarked ? asked[1] : label}\`
            : wordedTitle(kind, text, label);`,
        `        title = asked
            ? i18nMain_1.tr(\`\${asked[0]} для \${hostPromptsMarked ? asked[1] : label}\`, \`\${asked[0]} for \${hostPromptsMarked ? asked[1] : label}\`)
            : wordedTitle(kind, text, label);`,
        "sshPrompts.js asked title",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `<p class="context">Connecting to <span id="label"></span></p>
<h1 id="title"></h1>
<div id="message"></div>
<input id="answer" type="password" maxlength="1023" autocomplete="off" aria-labelledby="title" aria-describedby="message">
<div id="retry" class="note" hidden>Asked again: your last answer may not have worked.</div>
<div id="long" class="note" role="alert" hidden>That's too long.</div>
<div class="buttons"><button id="cancel" class="secondary">Cancel</button><button id="continue" class="primary">Continue</button></div>`,
        `<p class="context">\${i18nMain_1.tr('Подключение к', 'Connecting to')} <span id="label"></span></p>
<h1 id="title"></h1>
<div id="message"></div>
<input id="answer" type="password" maxlength="1023" autocomplete="off" aria-labelledby="title" aria-describedby="message">
<div id="retry" class="note" hidden>\${i18nMain_1.tr('Повторный запрос: возможно, предыдущий ответ не подошёл.', 'Asked again: your last answer may not have worked.')}</div>
<div id="long" class="note" role="alert" hidden>\${i18nMain_1.tr('Слишком длинное значение.', "That's too long.")}</div>
<div class="buttons"><button id="cancel" class="secondary">\${i18nMain_1.tr('Отмена', 'Cancel')}</button><button id="continue" class="primary">\${i18nMain_1.tr('Продолжить', 'Continue')}</button></div>`,
        "sshPrompts.js HTML template",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `            buttons: confirm ? ['Yes', 'No'] : ['Cancel'],`,
        `            buttons: confirm ? [i18nMain_1.tr('Да', 'Yes'), i18nMain_1.tr('Нет', 'No')] : [i18nMain_1.tr('Отмена', 'Cancel')],`,
        "sshPrompts.js dialog buttons",
        warns
      ).text;

      return out;
    },
    warnings
  );
}

function patchDeviceChooserJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const utils_1 = require("./utils");`,
    `const utils_1 = require("./utils");\nconst i18nMain_1 = require("./i18nMain");`,
    "deviceChooser.js require i18nMain",
    (text, warns) => {
      const lblStep = tryReplaceExact(
        text,
        `const KIND_NOUNS = {
    hid: 'HID device',
    usb: 'USB device',
    serial: 'serial port',
};
const hex4 = (n) => n.toString(16).padStart(4, '0');
const hidItem = (d) => ({
    id: d.deviceId,
    label: \`\${d.name?.trim() || 'Unknown device'} (\${hex4(d.vendorId)}:\${hex4(d.productId)})\`,
});
const usbItem = (d) => ({
    id: d.deviceId,
    label: \`\${d.productName ?? 'Unknown device'} (\${hex4(d.vendorId)}:\${hex4(d.productId)})\`,
});`,
        `const getKindNoun = (kind) => ({
    hid: i18nMain_1.tr('HID-устройству', 'HID device'),
    usb: i18nMain_1.tr('USB-устройству', 'USB device'),
    serial: i18nMain_1.tr('последовательному порту', 'serial port'),
})[kind] || kind;
const hex4 = (n) => n.toString(16).padStart(4, '0');
const hidItem = (d) => ({
    id: d.deviceId,
    label: \`\${d.name?.trim() || i18nMain_1.tr('Неизвестное устройство', 'Unknown device')} (\${hex4(d.vendorId)}:\${hex4(d.productId)})\`,
});
const usbItem = (d) => ({
    id: d.deviceId,
    label: \`\${d.productName ?? i18nMain_1.tr('Неизвестное устройство', 'Unknown device')} (\${hex4(d.vendorId)}:\${hex4(d.productId)})\`,
});`,
        "deviceChooser.js labels",
        warns
      );
      if (!lblStep.applied) return text;
      const boxStep = tryReplaceExact(
        lblStep.text,
        `                        title: 'Connect a device',
                        message: \`\${origin} wants to connect to a \${KIND_NOUNS[kind]}\`,
                        detail: cancelId
                            ? 'Select a device:'
                            : 'No compatible devices found.',
                        buttons: [...snapshot.map(({ label }) => label), 'Cancel'],`,
        `                        title: i18nMain_1.tr('Подключение устройства', 'Connect a device'),
                        message: i18nMain_1.tr(\`\${origin} запрашивает подключение к \${getKindNoun(kind)}\`, \`\${origin} wants to connect to a \${getKindNoun(kind)}\`),
                        detail: cancelId
                            ? i18nMain_1.tr('Выберите устройство:', 'Select a device:')
                            : i18nMain_1.tr('Совместимые устройства не найдены.', 'No compatible devices found.'),
                        buttons: [...snapshot.map(({ label }) => label), i18nMain_1.tr('Отмена', 'Cancel')],`,
        "deviceChooser.js messageBox",
        warns
      );
      return boxStep.applied ? boxStep.text : text;
    },
    warnings
  );
}

function patchWebviewPopupSecurityJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const electron_1 = require("electron");`,
    `const electron_1 = require("electron");\nconst i18nMain_1 = require("./i18nMain");`,
    "webviewPopupSecurity.js require i18nMain",
    (text, warns) => {
      let out = text;

      out = tryReplaceExact(
        out,
        `    return POPUP_TITLE_SECURITY_LABELS[state.level];`,
        `    const lbl = POPUP_TITLE_SECURITY_LABELS[state.level];
    if (lbl === 'Not secure') return i18nMain_1.tr('Небезопасно', 'Not secure');
    if (lbl === '⚠ Not secure') return i18nMain_1.tr('⚠ Небезопасно', '⚠ Not secure');
    return lbl;`,
        "webviewPopupSecurity.js popup title label",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `function formatDate(ms) {
    return ms > 0 ? new Date(ms).toLocaleString() : 'unknown';
}
/** Formats \`state\` as the message and detail lines of a connection dialog. */
function formatConnectionInfo(state) {
    const lines = [...SECURITY_LEVEL_SUMMARIES[state.level]];
    const certificate = state.certificate;
    if (certificate) {
        lines.push('', state.level === 'secure' ? 'Certificate is valid' : 'Certificate details');
        if (state.certificateError) {
            lines.push(\`Error: \${state.certificateError}\`);
        }
        lines.push(\`Issued to: \${certificate.subjectName}\`, \`Issued by: \${certificate.issuer}\`, \`Valid from: \${formatDate(certificate.validFromMs)}\`, \`Valid until: \${formatDate(certificate.validToMs)}\`);
        if (certificate.protocol) {
            lines.push(\`Protocol: \${certificate.protocol}\`);
        }
    }
    return {
        message: extractOrigin(state.url) ?? (state.url || 'This page'),
        detail: lines.join('\\n'),
    };
}`,
        `function formatDate(ms) {
    return ms > 0 ? new Date(ms).toLocaleString() : i18nMain_1.tr('неизвестно', 'unknown');
}
/** Formats \`state\` as the message and detail lines of a connection dialog. */
function formatConnectionInfo(state) {
    const summaryMap = {
        secure: [
            i18nMain_1.tr('Подключение защищено', 'Connection is secure'),
            i18nMain_1.tr('Ваши данные (например, пароли и номера банковских карт) передаются на этот сайт в зашифрованном виде.', 'Your information (for example, passwords or credit card numbers) is private when it is sent to this site.'),
        ],
        insecure: [
            i18nMain_1.tr('Подключение к этому сайту не защищено', 'Your connection to this site is not secure'),
            i18nMain_1.tr('Не рекомендуется вводить на этом сайте конфиденциальную информацию (например, пароли или данные банковских карт) — она может быть перехвачена злоумышленниками.', 'You should not enter any sensitive information on this site (for example, passwords or credit cards), because it could be stolen by attackers.'),
        ],
        neutral: [i18nMain_1.tr('Сведения о безопасности подключения для этой страницы недоступны', 'Connection security information is not available for this page')],
    };
    summaryMap.dangerous = summaryMap.insecure;
    const lines = [...(summaryMap[state.level] || SECURITY_LEVEL_SUMMARIES[state.level])];
    const certificate = state.certificate;
    if (certificate) {
        lines.push('', state.level === 'secure' ? i18nMain_1.tr('Сертификат действителен', 'Certificate is valid') : i18nMain_1.tr('Сведения о сертификате', 'Certificate details'));
        if (state.certificateError) {
            lines.push(\`\${i18nMain_1.tr('Ошибка', 'Error')}: \${state.certificateError}\`);
        }
        lines.push(\`\${i18nMain_1.tr('Выдан для', 'Issued to')}: \${certificate.subjectName}\`, \`\${i18nMain_1.tr('Кем выдан', 'Issued by')}: \${certificate.issuer}\`, \`\${i18nMain_1.tr('Действителен с', 'Valid from')}: \${formatDate(certificate.validFromMs)}\`, \`\${i18nMain_1.tr('Действителен по', 'Valid until')}: \${formatDate(certificate.validToMs)}\`);
        if (certificate.protocol) {
            lines.push(\`\${i18nMain_1.tr('Протокол', 'Protocol')}: \${certificate.protocol}\`);
        }
    }
    return {
        message: extractOrigin(state.url) ?? (state.url || i18nMain_1.tr('Эта страница', 'This page')),
        detail: lines.join('\\n'),
    };
}`,
        "webviewPopupSecurity.js formatConnectionInfo",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `        electron_1.Menu.buildFromTemplate([
            { role: 'cut', enabled: canCut },
            { role: 'copy', enabled: canCopy },
            { role: 'paste', enabled: canPaste },
            { role: 'selectAll', enabled: canSelectAll },
            { type: 'separator' },
            {
                label: 'Connection info…',`,
        `        electron_1.Menu.buildFromTemplate([
            { role: 'cut', label: i18nMain_1.tr('Вырезать', 'Cut'), enabled: canCut },
            { role: 'copy', label: i18nMain_1.tr('Копировать', 'Copy'), enabled: canCopy },
            { role: 'paste', label: i18nMain_1.tr('Вставить', 'Paste'), enabled: canPaste },
            { role: 'selectAll', label: i18nMain_1.tr('Выделить всё', 'Select All'), enabled: canSelectAll },
            { type: 'separator' },
            {
                label: i18nMain_1.tr('Сведения о подключении…', 'Connection info…'),`,
        "webviewPopupSecurity.js context menu",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `                        title: 'Connection info',
                        message,
                        detail,
                        buttons: ['OK'],`,
        `                        title: i18nMain_1.tr('Сведения о подключении', 'Connection info'),
                        message,
                        detail,
                        buttons: [i18nMain_1.tr('ОК', 'OK')],`,
        "webviewPopupSecurity.js messageBox",
        warns
      ).text;

      return out;
    },
    warnings
  );
}

function patchWebauthnJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const utils_1 = require("./utils");`,
    `const utils_1 = require("./utils");\nconst i18nMain_1 = require("./i18nMain");`,
    "webauthn.js require i18nMain",
    (text, warns) => {
      return tryReplaceExact(
        text,
        `                    const rpLabel = details.relyingPartyId || 'this site';
                    const result = await showMessageBox(win, {
                        type: 'question',
                        title: 'Choose a Passkey',
                        message: \`Sign in to \${rpLabel}\`,
                        detail: 'Select a passkey account to continue:',
                        buttons: [...accountLabels, 'Cancel'],`,
        `                    const rpLabel = details.relyingPartyId || i18nMain_1.tr('этот сайт', 'this site');
                    const result = await showMessageBox(win, {
                        type: 'question',
                        title: i18nMain_1.tr('Выбор ключа доступа (Passkey)', 'Choose a Passkey'),
                        message: i18nMain_1.tr(\`Вход в \${rpLabel}\`, \`Sign in to \${rpLabel}\`),
                        detail: i18nMain_1.tr('Выберите аккаунт ключа доступа для продолжения:', 'Select a passkey account to continue:'),
                        buttons: [...accountLabels, i18nMain_1.tr('Отмена', 'Cancel')],`,
        "webauthn.js passkey dialog",
        warns
      ).text;
    },
    warnings
  );
}

function patchRemoteManagerJs(src, warnings) {
  return applySecondaryFile(
    src,
    `const utils_1 = require("../utils");`,
    `const utils_1 = require("../utils");\nconst i18nMain_1 = require("../i18nMain");`,
    "remoteManager.js require i18nMain",
    (text, warns) => {
      let out = text;

      out = tryReplaceExact(
        out,
        `            const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(parent, {
                title: 'Choose an SSH config file',`,
        `            const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(parent, {
                title: i18nMain_1.tr('Выберите файл конфигурации SSH', 'Choose an SSH config file'),`,
        "remoteManager.js open SSH config dialog",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `            const { response } = await electron_1.dialog.showMessageBox(parent, {
                type: 'warning',
                title: 'Choose another SSH config file',
                ...refusal,
                buttons: ['Choose Another File…', 'Cancel'],`,
        `            const { response } = await electron_1.dialog.showMessageBox(parent, {
                type: 'warning',
                title: i18nMain_1.tr('Выберите другой файл конфигурации SSH', 'Choose another SSH config file'),
                ...refusal,
                buttons: [i18nMain_1.tr('Выбрать другой файл…', 'Choose Another File…'), i18nMain_1.tr('Отмена', 'Cancel')],`,
        "remoteManager.js choose another SSH config dialog",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `                return electron_1.dialog.showMessageBox(win, {
                    type: 'warning',
                    buttons: ['Stop Server', 'Cancel'],
                    defaultId: 1,
                    cancelId: 1,
                    title: 'Stop SSH server',
                    message: \`Stop the Antigravity server on \${entry.label}?\`,
                    detail: 'Agents running on this host will stop and its window will close. ' +
                        'The server starts again the next time you connect.',`,
        `                return electron_1.dialog.showMessageBox(win, {
                    type: 'warning',
                    buttons: [i18nMain_1.tr('Остановить сервер', 'Stop Server'), i18nMain_1.tr('Отмена', 'Cancel')],
                    defaultId: 1,
                    cancelId: 1,
                    title: i18nMain_1.tr('Остановка SSH-сервера', 'Stop SSH server'),
                    message: i18nMain_1.tr(\`Остановить сервер Antigravity на \${entry.label}?\`, \`Stop the Antigravity server on \${entry.label}?\`),
                    detail: i18nMain_1.tr(
                        'Агенты, запущенные на этом хосте, будут остановлены, а его окно закроется. Сервер запустится снова при следующем подключении.',
                        'Agents running on this host will stop and its window will close. The server starts again the next time you connect.'
                    ),`,
        "remoteManager.js stop SSH server dialog",
        warns
      ).text;

      out = tryReplaceExact(
        out,
        `    tellNotConnected(win, label) {
        return this.showSheet(win, {
            type: 'info',
            title: 'Stop SSH server',
            message: \`Not connected to \${label}\`,
            detail: 'Reconnect first, then stop its server.',
        });
    }`,
        `    tellNotConnected(win, label) {
        return this.showSheet(win, {
            type: 'info',
            title: i18nMain_1.tr('Остановка SSH-сервера', 'Stop SSH server'),
            message: i18nMain_1.tr(\`Нет подключения к \${label}\`, \`Not connected to \${label}\`),
            detail: i18nMain_1.tr('Сначала переподключитесь, затем остановите сервер.', 'Reconnect first, then stop its server.'),
        });
    }`,
        "remoteManager.js tellNotConnected dialog",
        warns
      ).text;

      return out;
    },
    warnings
  );
}

function patchPreloadJs(src, preloadSnippet) {
  const marker = "\n// === ANTIGRAVITY_RU_I18N_START ===";
  const idx = src.indexOf(marker);
  const base = idx === -1 ? src : src.slice(0, idx);
  return base.trimEnd() + "\n" + preloadSnippet + "\n";
}

function patchElectronShell(appDir, preloadSnippet, options = {}) {
  const stampVersion = options.stampVersion || "custom";
  const distDir = path.join(appDir, "dist");
  const warnings = [];
  const patchedFiles = [];

  fs.writeFileSync(path.join(distDir, "i18nMain.js"), I18N_MAIN_SOURCE, "utf8");
  patchedFiles.push("i18nMain.js");

  const mainPath = path.join(distDir, "main.js");
  if (!fs.existsSync(mainPath)) {
    throw new Error(`Required core file not found: ${mainPath}`);
  }
  const mainOrig = fs.readFileSync(mainPath, "utf8");
  fs.writeFileSync(mainPath, patchMainJs(mainOrig, stampVersion, warnings), "utf8");
  patchedFiles.push("main.js");

  const preloadPath = path.join(distDir, "preload.js");
  if (!fs.existsSync(preloadPath)) {
    throw new Error(`Required core file not found: ${preloadPath}`);
  }
  const preloadOrig = fs.readFileSync(preloadPath, "utf8");
  fs.writeFileSync(preloadPath, patchPreloadJs(preloadOrig, preloadSnippet), "utf8");
  patchedFiles.push("preload.js");

  const secondaryPatches = [
    ["tray.js", patchTrayJs],
    ["updater.js", patchUpdaterJs],
    ["menu.js", patchMenuJs],
    ["ipcHandlers.js", patchIpcHandlersJs],
    ["provisionSplash.js", patchProvisionSplashJs],
    [path.join("ideInstall", "wizardHtml.js"), patchWizardHtmlJs],
    [path.join("remote", "disconnectedPage.js"), patchDisconnectedPageJs],
    [path.join("remote", "sshPrompts.js"), patchSshPromptsJs],
    ["deviceChooser.js", patchDeviceChooserJs],
    ["webviewPopupSecurity.js", patchWebviewPopupSecurityJs],
    ["webauthn.js", patchWebauthnJs],
    [path.join("remote", "remoteManager.js"), patchRemoteManagerJs],
  ];

  for (const [rel, fn] of secondaryPatches) {
    const full = path.join(distDir, rel);
    if (!fs.existsSync(full)) {
      warnings.push(`Optional file not present in this version: ${rel}`);
      continue;
    }
    const orig = fs.readFileSync(full, "utf8");
    const updated = fn(orig, warnings);
    fs.writeFileSync(full, updated, "utf8");
    patchedFiles.push(rel);
  }

  return { patchedFiles, warnings };
}

module.exports = {
  I18N_MAIN_SOURCE,
  patchElectronShell,
};
