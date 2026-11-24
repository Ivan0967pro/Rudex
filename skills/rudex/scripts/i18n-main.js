"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, ipcMain, webContents, dialog, shell, protocol, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

let cachedLocale = null;
let ipcRegistered = false;
let mediaProtocolRegistered = false;
let lastHotkeyAt = 0;
let lastPanelHotkeyAt = 0;
let lastLiveEditHotkeyAt = 0;
let lastActiveChatKey = "__new__";

let studioSettingsCache = null;
let studioChatsCache = null;
let studioChatsMtimeMs = -1;
let quotaStoreCache = null;
let quotaSummaryCache = { key: "", at: 0, value: null };

let queueWatcher = null;
let deliveredWatcher = null;
let liveEditDebounceTimer = null;
let liveEditLastBroadcastSig = "";
let updateBootTimer = null;
let updateIntervalTimer = null;
let updateCheckInflight = null;
let updateInstallInflight = null;
let postAppUpdateScheduled = false;
let updateStatusState = {
  status: "idle",
  available: false,
  reason: "",
  updateKey: "",
  lastCheckedAt: 0,
  error: "",
  installed: null,
  remote: null,
};

const allowedLiveEditSourcePaths = new Set();
const listeners = new Set();
let uiMaps = null;

const MAX_PERSONA_BODY_BYTES = 23000;
const MAX_STORED_CHATS = 120;
const FIVE_HOUR_MS = 5 * 60 * 60 * 1000;
const SEVEN_DAY_MS = 7 * 24 * 60 * 60 * 1000;
const LIVE_EDIT_MAX_AGE_MS = 10 * 60 * 1000;
const LIVE_EDIT_FALLBACK_MAX_AGE_MS = 90 * 1000;

const transcriptSummaryCache = new Map();
const UUID_EXACT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_MINI_FIELDS = {
  status: true,
  lang: true,
  tps: true,
  respTokens: false,
  chatTokens: false,
  model: false,
  quota: false,
};
const VALID_APPEARANCE_PRESETS = new Set([
  "native",
  "claude-code-dark",
  "claude-code-light",
  "claude-terminal",
  "liquid-glass",
  "obsidian-glass",
  "midnight-neon",
  "warm-contrast",
  "light-paper",
  "emerald-void",
  "crimson-noir",
  "tokyo-night",
  "sakura-dusk",
  "nordic-frost",
  "custom",
]);
const VALID_WALLPAPER_TYPES = new Set(["none", "gradient", "image", "video"]);
const VALID_GRADIENT_PRESETS = new Set(["antigravity", "claude-ember", "claude-parchment", "aurora", "cosmic", "sunset", "emerald", "cyber", "silk", "sakura", "ocean", "amber", "mist"]);
const VALID_GRADIENT_STYLES = new Set(["linear", "radial", "mesh"]);
const VALID_WALLPAPER_FITS = new Set(["cover", "contain", "fill"]);
const VALID_TINT_BLENDS = new Set(["normal", "multiply", "screen", "overlay", "soft-light"]);
const VALID_MESSAGE_STYLES = new Set(["glass", "solid", "minimal"]);
const VALID_UI_FONTS = new Set(["system", "claude-sans", "claude-serif", "claude-lora", "claude-mono-ui", "geist", "segoe", "inter", "rubik", "ibm-plex", "georgia"]);
const VALID_MONO_FONTS = new Set(["system", "claude-mono", "geist-mono", "ibm-plex-mono", "cascadia", "jetbrains", "consolas", "fira"]);
const VALID_DENSITIES = new Set(["compact", "comfortable", "spacious"]);
const VALID_STUDIO_THEMES = new Set(["obsidian", "claude-dark", "claude-light", "frosted", "neon-cyber", "minimal-mono", "aurora"]);
const VALID_STUDIO_LAYOUTS = new Set(["sidebar", "rail", "topbar", "floating-glass"]);
const VALID_WIDGET_THEMES = new Set(["glass", "claude", "island", "neon", "minimal", "solid"]);
const VALID_WIDGET_SCALES = new Set(["sm", "md", "lg"]);
const DEFAULT_STUDIO_UI = {
  windowTheme: "obsidian",
  windowLayout: "sidebar",
  widgetTheme: "glass",
  widgetScale: "md",
  widgetRadius: 999,
  widgetOpacity: 88,
  studioRadius: 16,
  studioBlur: 20,
  appScale: 100,
  studioScale: 100,
  widgetZoom: 100,
};
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const SAFE_MEDIA_FILE_RE = /^[a-zA-Z0-9._-]{1,120}$/;
const STUDIO_MEDIA_MIMES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const DEFAULT_GREETING = {
  enabled: false,
  mode: "time-of-day",
  title: "",
  subtitle: "",
  displayName: "",
  placeholder: "",
};

const DEFAULT_APPEARANCE = {
  presetId: "native",
  uiPolish: true,
  customAccent: false,
  accentColor: "#3b82f6",
  canvasBg: "#070708",
  cardBg: "#15151a",
  glassOpacity: 78,
  sidebarOpacity: 72,
  glassBlur: 12,
  messageCardOpacity: 74,
  messageStyle: "glass",
  borderStrength: 50,
  highContrastText: true,
  radius: 12,
  corners: {
    mode: "linked",
    all: 12,
    messages: 12,
    composer: 12,
    buttons: 10,
    cards: 12,
    code: 10,
    sidebar: 10,
    overlays: 14,
    inputs: 10,
  },
  wallpaper: {
    type: "none",
    gradientPreset: "antigravity",
    gradStyle: "linear",
    gradColors: ["#15151a", "#0d0d11", "#070708"],
    gradAngle: 135,
    gradAnimated: true,
    gradSpeed: 18,
    mediaFile: "",
    mediaUrl: "",
    mediaMime: "",
    fit: "cover",
    posX: 50,
    posY: 50,
    offsetX: 0,
    offsetY: 0,
    dim: 45,
    blur: 0,
    opacity: 85,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hue: 0,
    scale: 100,
    rotate: 0,
    flipX: false,
    flipY: false,
    vignette: 0,
    tintEnabled: false,
    tintOpacity: 35,
    tintBlend: "normal",
    playbackRate: 1,
    pauseWhenHidden: true,
  },
  typography: {
    uiFont: "system",
    monoFont: "system",
    fontSize: 14,
    lineHeight: 1.55,
    chatMaxWidth: 0,
    density: "comfortable",
  },
};

function writeFileAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 7)}`;
  fs.writeFileSync(tmpPath, content, "utf8");
  try {
    fs.renameSync(tmpPath, filePath);
  } catch {
    fs.writeFileSync(filePath, content, "utf8");
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

function writeJsonAtomic(filePath, obj) {
  writeFileAtomic(filePath, JSON.stringify(obj, null, 2) + "\n");
}

function truncateUtf8Bytes(str, maxBytes) {
  const s = String(str || "");
  if (Buffer.byteLength(s, "utf8") <= maxBytes) return s;
  let end = Math.min(s.length, maxBytes);
  while (end > 0 && Buffer.byteLength(s.slice(0, end), "utf8") > maxBytes) {
    end -= Math.max(1, Math.floor((Buffer.byteLength(s.slice(0, end), "utf8") - maxBytes) / 2));
  }
  while (end > 0 && Buffer.byteLength(s.slice(0, end), "utf8") > maxBytes) {
    end -= 1;
  }
  return s.slice(0, Math.max(0, end));
}

function clampNum(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeHexColor(val, fallback) {
  return typeof val === "string" && HEX_COLOR_RE.test(val.trim()) ? val.trim().toLowerCase() : fallback;
}

function sanitizeMediaUrl(val) {
  if (typeof val !== "string") return "";
  const s = val.trim();
  if (!s || (!s.startsWith("agy-media://local/") && !s.startsWith("rudex-media://local/"))) return "";
  return s.slice(0, 240);
}

function sanitizeGreeting(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const mode = src.mode === "custom" || src.mode === "minimal" ? src.mode : "time-of-day";
  return {
    enabled: Boolean(src.enabled),
    mode,
    title: typeof src.title === "string" ? src.title.slice(0, 160) : "",
    subtitle: typeof src.subtitle === "string" ? src.subtitle.slice(0, 180) : "",
    displayName: typeof src.displayName === "string" ? src.displayName.slice(0, 60) : "",
    placeholder: typeof src.placeholder === "string" ? src.placeholder.slice(0, 140) : "",
  };
}

function sanitizeAppearance(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const presetId = VALID_APPEARANCE_PRESETS.has(src.presetId) ? src.presetId : "native";
  const wpSrc = src.wallpaper && typeof src.wallpaper === "object" ? src.wallpaper : {};
  const wpType = VALID_WALLPAPER_TYPES.has(wpSrc.type) ? wpSrc.type : "none";
  const gradientPreset = VALID_GRADIENT_PRESETS.has(wpSrc.gradientPreset) ? wpSrc.gradientPreset : "antigravity";
  const gradStyle = VALID_GRADIENT_STYLES.has(wpSrc.gradStyle) ? wpSrc.gradStyle : "linear";
  const rawGc = Array.isArray(wpSrc.gradColors) ? wpSrc.gradColors : DEFAULT_APPEARANCE.wallpaper.gradColors;
  const gradColors = [
    sanitizeHexColor(rawGc[0], "#15151a"),
    sanitizeHexColor(rawGc[1], "#0d0d11"),
    sanitizeHexColor(rawGc[2], "#070708"),
  ];
  const mediaUrl = sanitizeMediaUrl(wpSrc.mediaUrl);
  const mediaFile = mediaUrl && typeof wpSrc.mediaFile === "string" && SAFE_MEDIA_FILE_RE.test(wpSrc.mediaFile.trim())
    ? wpSrc.mediaFile.trim()
    : "";
  const tySrc = src.typography && typeof src.typography === "object" ? src.typography : {};
  const rawW = Math.round(clampNum(tySrc.chatMaxWidth, 0, 1200, 0));
  const chatMaxWidth = rawW > 0 && rawW < 680 ? 680 : rawW;
  const lineHeight = Math.round(clampNum(tySrc.lineHeight, 1.25, 1.9, 1.55) * 100) / 100;

  const rawRadius = Number.isFinite(Number(src.radius))
    ? Math.round(clampNum(src.radius, 0, 28, DEFAULT_APPEARANCE.radius))
    : DEFAULT_APPEARANCE.radius;
  const cSrc = src.corners && typeof src.corners === "object" ? src.corners : {};
  const cornerMode = cSrc.mode === "custom" ? "custom" : "linked";
  const allRadius = Number.isFinite(Number(cSrc.all))
    ? Math.round(clampNum(cSrc.all, 0, 28, rawRadius))
    : rawRadius;
  const effRadius = cornerMode === "linked" ? allRadius : rawRadius;
  const corners = {
    mode: cornerMode,
    all: allRadius,
    messages: Math.round(clampNum(cSrc.messages, 0, 28, allRadius)),
    composer: Math.round(clampNum(cSrc.composer, 0, 28, allRadius)),
    buttons: Math.round(clampNum(cSrc.buttons, 0, 28, cornerMode === "linked" ? allRadius : DEFAULT_APPEARANCE.corners.buttons)),
    cards: Math.round(clampNum(cSrc.cards, 0, 28, allRadius)),
    code: Math.round(clampNum(cSrc.code, 0, 24, cornerMode === "linked" ? Math.min(24, allRadius) : DEFAULT_APPEARANCE.corners.code)),
    sidebar: Math.round(clampNum(cSrc.sidebar, 0, 24, cornerMode === "linked" ? Math.min(24, allRadius) : DEFAULT_APPEARANCE.corners.sidebar)),
    overlays: Math.round(clampNum(cSrc.overlays, 0, 28, cornerMode === "linked" ? allRadius : DEFAULT_APPEARANCE.corners.overlays)),
    inputs: Math.round(clampNum(cSrc.inputs, 0, 24, cornerMode === "linked" ? Math.min(24, allRadius) : DEFAULT_APPEARANCE.corners.inputs)),
  };

  const wpFit = VALID_WALLPAPER_FITS.has(wpSrc.fit) ? wpSrc.fit : "cover";
  const tintBlend = VALID_TINT_BLENDS.has(wpSrc.tintBlend) ? wpSrc.tintBlend : "normal";
  const rawRate = Number(wpSrc.playbackRate);
  const playbackRate = Number.isFinite(rawRate) ? Math.round(clampNum(rawRate, 0.25, 2.0, 1) * 100) / 100 : 1;

  return {
    presetId,
    uiPolish: src.uiPolish !== false,
    customAccent: Boolean(src.customAccent),
    accentColor: sanitizeHexColor(src.accentColor, DEFAULT_APPEARANCE.accentColor),
    canvasBg: sanitizeHexColor(src.canvasBg, DEFAULT_APPEARANCE.canvasBg),
    cardBg: sanitizeHexColor(src.cardBg, DEFAULT_APPEARANCE.cardBg),
    glassOpacity: Math.round(clampNum(src.glassOpacity, 15, 100, DEFAULT_APPEARANCE.glassOpacity)),
    sidebarOpacity: Math.round(clampNum(src.sidebarOpacity, 15, 100, DEFAULT_APPEARANCE.sidebarOpacity)),
    glassBlur: Math.round(clampNum(src.glassBlur, 0, 36, DEFAULT_APPEARANCE.glassBlur)),
    messageCardOpacity: Math.round(clampNum(src.messageCardOpacity, 0, 96, DEFAULT_APPEARANCE.messageCardOpacity)),
    messageStyle: VALID_MESSAGE_STYLES.has(src.messageStyle) ? src.messageStyle : "glass",
    borderStrength: Math.round(clampNum(src.borderStrength, 0, 100, DEFAULT_APPEARANCE.borderStrength)),
    highContrastText: src.highContrastText !== false,
    radius: effRadius,
    corners,
    wallpaper: {
      type: wpType,
      gradientPreset,
      gradStyle,
      gradColors,
      gradAngle: Math.round(clampNum(wpSrc.gradAngle, 0, 360, 135)),
      gradAnimated: wpSrc.gradAnimated !== false,
      gradSpeed: Math.round(clampNum(wpSrc.gradSpeed, 6, 40, 18)),
      mediaFile,
      mediaUrl,
      mediaMime: typeof wpSrc.mediaMime === "string" ? wpSrc.mediaMime.slice(0, 60) : "",
      fit: wpFit,
      posX: Math.round(clampNum(wpSrc.posX, 0, 100, 50)),
      posY: Math.round(clampNum(wpSrc.posY, 0, 100, 50)),
      offsetX: Math.round(clampNum(wpSrc.offsetX, -50, 50, 0)),
      offsetY: Math.round(clampNum(wpSrc.offsetY, -50, 50, 0)),
      dim: Math.round(clampNum(wpSrc.dim, 0, 85, 45)),
      blur: Math.round(clampNum(wpSrc.blur, 0, 24, 0)),
      opacity: Math.round(clampNum(wpSrc.opacity, 15, 100, 85)),
      brightness: Math.round(clampNum(wpSrc.brightness, 40, 160, 100)),
      contrast: Math.round(clampNum(wpSrc.contrast, 50, 160, 100)),
      saturate: Math.round(clampNum(wpSrc.saturate, 0, 200, 100)),
      hue: Math.round(clampNum(wpSrc.hue, -180, 180, 0)),
      scale: Math.round(clampNum(wpSrc.scale, 50, 250, 100)),
      rotate: Math.round(clampNum(wpSrc.rotate, -180, 180, 0)),
      flipX: Boolean(wpSrc.flipX),
      flipY: Boolean(wpSrc.flipY),
      vignette: Math.round(clampNum(wpSrc.vignette, 0, 90, 0)),
      tintEnabled: Boolean(wpSrc.tintEnabled),
      tintOpacity: Math.round(clampNum(wpSrc.tintOpacity, 0, 75, 35)),
      tintBlend,
      playbackRate,
      pauseWhenHidden: wpSrc.pauseWhenHidden !== false,
    },
    typography: {
      uiFont: VALID_UI_FONTS.has(tySrc.uiFont) ? tySrc.uiFont : "system",
      monoFont: VALID_MONO_FONTS.has(tySrc.monoFont) ? tySrc.monoFont : "system",
      fontSize: Math.round(clampNum(tySrc.fontSize, 12, 18, 14)),
      lineHeight,
      chatMaxWidth,
      density: VALID_DENSITIES.has(tySrc.density) ? tySrc.density : "comfortable",
    },
  };
}

function sanitizeStudioUi(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const rawWrad = Number(src.widgetRadius);
  const widgetRadius = Number.isFinite(rawWrad) && rawWrad < 50 ? Math.round(clampNum(rawWrad, 4, 24, 999)) : 999;
  const legacyScale = VALID_WIDGET_SCALES.has(src.widgetScale) ? src.widgetScale : DEFAULT_STUDIO_UI.widgetScale;
  const hasExplicitZoom = src.widgetZoom !== undefined && src.widgetZoom !== null && Number.isFinite(Number(src.widgetZoom));
  const fallbackZoom = legacyScale === "sm" ? 85 : (legacyScale === "lg" ? 120 : 100);
  const widgetZoom = hasExplicitZoom ? Math.round(clampNum(src.widgetZoom, 70, 160, fallbackZoom)) : fallbackZoom;
  return {
    windowTheme: VALID_STUDIO_THEMES.has(src.windowTheme) ? src.windowTheme : DEFAULT_STUDIO_UI.windowTheme,
    windowLayout: VALID_STUDIO_LAYOUTS.has(src.windowLayout) ? src.windowLayout : DEFAULT_STUDIO_UI.windowLayout,
    widgetTheme: VALID_WIDGET_THEMES.has(src.widgetTheme) ? src.widgetTheme : DEFAULT_STUDIO_UI.widgetTheme,
    widgetScale: legacyScale,
    widgetRadius,
    widgetOpacity: Math.round(clampNum(src.widgetOpacity, 45, 100, DEFAULT_STUDIO_UI.widgetOpacity)),
    studioRadius: Math.round(clampNum(src.studioRadius, 8, 26, DEFAULT_STUDIO_UI.studioRadius)),
    studioBlur: Math.round(clampNum(src.studioBlur, 0, 32, DEFAULT_STUDIO_UI.studioBlur)),
    appScale: Math.round(clampNum(src.appScale, 70, 150, DEFAULT_STUDIO_UI.appScale)),
    studioScale: Math.round(clampNum(src.studioScale, 75, 140, DEFAULT_STUDIO_UI.studioScale)),
    widgetZoom,
  };
}

let zoomHookRegistered = false;

function getHubZoomTargets() {
  const targets = [];
  const seen = new Set();
  const pushWc = (wc) => {
    if (!wc || typeof wc.setZoomFactor !== "function") return;
    if (typeof wc.isDestroyed === "function" && wc.isDestroyed()) return;
    if (seen.has(wc)) return;
    seen.add(wc);
    targets.push(wc);
  };
  try {
    const utils = require("./utils");
    if (utils && typeof utils.getHubWindows === "function" && typeof utils.getHubWebContents === "function") {
      for (const w of utils.getHubWindows()) {
        if (w && !w.__isWebviewPopupWindow) pushWc(utils.getHubWebContents(w));
      }
    }
  } catch {}
  if (targets.length === 0) {
    try {
      if (BrowserWindow && typeof BrowserWindow.getAllWindows === "function") {
        for (const w of BrowserWindow.getAllWindows()) {
          if (!w || w.__isWebviewPopupWindow) continue;
          if (typeof w.isDestroyed === "function" && w.isDestroyed()) continue;
          pushWc(w.webContents);
        }
      }
    } catch {}
  }
  return targets;
}

function applyAppScaleToWindows(scalePct, targetWc) {
  const pct = Math.round(clampNum(scalePct, 70, 150, 100));
  const factor = pct / 100;
  const list = targetWc ? [targetWc] : getHubZoomTargets();
  for (const wc of list) {
    try {
      if (!wc || typeof wc.setZoomFactor !== "function") continue;
      if (typeof wc.isDestroyed === "function" && wc.isDestroyed()) continue;
      wc.setZoomFactor(factor);
    } catch {}
  }
}

const PRESET_CURTAIN_BG = {
  "claude-code-dark": "#1f1e1d",
  "claude-code-light": "#faf9f5",
  "claude-terminal": "#141413",
  "liquid-glass": "#080c16",
  "obsidian-glass": "#090a0f",
  "midnight-neon": "#070913",
  "warm-contrast": "#110f0d",
  "light-paper": "#f5f6f9",
  "emerald-void": "#060e0c",
  "crimson-noir": "#0f070a",
  "tokyo-night": "#131521",
  "sakura-dusk": "#140c14",
  "nordic-frost": "#0c1118",
};

function applyThemeCurtainToWindows(appearanceCfg) {
  try {
    const appCfg = sanitizeAppearance(appearanceCfg);
    let bgColor = "";
    if (appCfg.presetId === "custom") {
      bgColor = appCfg.canvasBg;
    } else if (appCfg.presetId && appCfg.presetId !== "native") {
      bgColor = PRESET_CURTAIN_BG[appCfg.presetId] || "";
    }
    if (!bgColor) return;
    const utils = require("./utils");
    const wins = utils && typeof utils.getHubWindows === "function"
      ? utils.getHubWindows()
      : (BrowserWindow && typeof BrowserWindow.getAllWindows === "function" ? BrowserWindow.getAllWindows() : []);
    for (const w of wins) {
      if (!w || w.__isWebviewPopupWindow || (typeof w.isDestroyed === "function" && w.isDestroyed())) continue;
      try {
        if (utils && typeof utils.setHubCurtainColor === "function") utils.setHubCurtainColor(w, bgColor);
      } catch {}
      try {
        if (typeof w.setBackgroundColor === "function") w.setBackgroundColor(bgColor);
      } catch {}
    }
  } catch {}
}

function sanitizeAppearanceProfiles(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, idx) => {
      if (!item || typeof item !== "object") return null;
      const name = typeof item.name === "string" ? item.name.trim().slice(0, 48) : "";
      if (!name) return null;
      return {
        id: typeof item.id === "string" && item.id ? item.id.slice(0, 48) : "prof-" + idx,
        name,
        appearance: sanitizeAppearance(item.appearance),
        greeting: item.greeting && typeof item.greeting === "object" ? sanitizeGreeting(item.greeting) : null,
        createdAt: typeof item.createdAt === "number" && Number.isFinite(item.createdAt) ? Math.round(item.createdAt) : 0,
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function getStudioSettingsPath() {
  return path.join(app.getPath("userData"), "agy_studio_settings.json");
}

function getStudioMediaDir() {
  return path.join(app.getPath("userData"), "studio_media");
}

function getThinkingRuFlagPath() {
  return path.join(app.getPath("userData"), "agy_studio_thinking_ru.flag");
}

function syncThinkingRuFlag(enabled, opts = {}) {
  const flagPath = getThinkingRuFlagPath();
  try {
    if (enabled) {
      writeFileAtomic(flagPath, "1\n");
    } else if (opts.wasEnabled) {
      writeFileAtomic(flagPath, "0\n");
    }
  } catch {}
}

function getPluginsBaseDir() {
  return path.join(os.homedir(), ".gemini", "config", "plugins");
}

function getPluginPersonaRulePath() {
  return path.join(getPluginsBaseDir(), "rudex", "rules", "AGENTS.md");
}

function getLegacyPluginPersonaRulePath() {
  return path.join(getPluginsBaseDir(), "antigravity-ru", "rules", "AGENTS.md");
}

function getLegacyGlobalPersonaRulePath() {
  return path.join(os.homedir(), ".gemini", "config", "rules", "antigravity-ru-persona.md");
}

function isRudexPluginInstalled() {
  try {
    return fs.existsSync(path.join(getPluginsBaseDir(), "rudex", "plugin.json"));
  } catch {
    return false;
  }
}

function isLegacyPluginInstalled() {
  try {
    return fs.existsSync(path.join(getPluginsBaseDir(), "antigravity-ru", "plugin.json"));
  } catch {
    return false;
  }
}

function getPersonaRulePath() {
  if (isRudexPluginInstalled()) return getPluginPersonaRulePath();
  if (isLegacyPluginInstalled()) return getLegacyPluginPersonaRulePath();
  return getLegacyGlobalPersonaRulePath();
}

function sanitizeStudioSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const rawDock = src.dockPosition;
  const dockAlias = rawDock === "top" ? "top-right" : rawDock === "middle" ? "middle-right" : rawDock === "bottom" ? "bottom-right" : rawDock;
  const validDock = dockAlias === "bottom-right" || dockAlias === "top-right" || dockAlias === "middle-right" || dockAlias === "bottom-left" || dockAlias === "hidden" ? dockAlias : "bottom-right";
  const rawView = src.viewMode === "large" ? "medium" : src.viewMode;
  const viewMode = rawView === "mini" || rawView === "medium" ? rawView : "mini";
  const layoutMode = src.layoutMode === "docked" || src.layoutMode === "floating" ? src.layoutMode : "docked";
  const floatX = typeof src.floatX === "number" && Number.isFinite(src.floatX) ? Math.round(src.floatX) : null;
  const floatY = typeof src.floatY === "number" && Number.isFinite(src.floatY) ? Math.round(src.floatY) : null;
  const rawMini = src.miniFields && typeof src.miniFields === "object" ? src.miniFields : {};
  const miniFields = {
    status: rawMini.status !== false,
    lang: rawMini.lang !== false,
    tps: rawMini.tps !== false,
    respTokens: Boolean(rawMini.respTokens),
    chatTokens: Boolean(rawMini.chatTokens),
    model: Boolean(rawMini.model),
    quota: Boolean(rawMini.quota),
  };
  const presets = Array.isArray(src.customPresets)
    ? src.customPresets
        .map((item, idx) => {
          if (!item || typeof item !== "object") return null;
          const rawTitle = typeof item.title === "string" ? item.title : (typeof item.name === "string" ? item.name : "");
          const rawBody = typeof item.body === "string" ? item.body : (typeof item.text === "string" ? item.text : "");
          const title = rawTitle.trim().slice(0, 60);
          const body = truncateUtf8Bytes(rawBody, MAX_PERSONA_BODY_BYTES);
          if (!title || !body.trim()) return null;
          return {
            id: typeof item.id === "string" && item.id ? item.id.slice(0, 64) : "custom-" + idx,
            title,
            body,
          };
        })
        .filter(Boolean)
        .slice(0, 20)
    : [];
  return {
    panelEnabled: src.panelEnabled !== false,
    pinned: Boolean(src.pinned),
    viewMode,
    layoutMode,
    dockPosition: validDock,
    floatX,
    floatY,
    miniFields,
    showMiniTps: miniFields.tps,
    trackHistory: src.trackHistory !== false,
    personaEnabled: Boolean(src.personaEnabled),
    personaActivePreset: typeof src.personaActivePreset === "string" && src.personaActivePreset ? src.personaActivePreset : "custom",
    personaText: typeof src.personaText === "string" ? src.personaText : "",
    personaStrictMode: src.personaStrictMode !== false,
    thinkingInRussian: Boolean(src.thinkingInRussian),
    autoCheckUpdates: src.autoCheckUpdates !== false,
    customPresets: presets,
    appearance: sanitizeAppearance(src.appearance),
    appearanceProfiles: sanitizeAppearanceProfiles(src.appearanceProfiles),
    greeting: sanitizeGreeting(src.greeting),
    studioUi: sanitizeStudioUi(src.studioUi),
  };
}

function loadStudioSettings() {
  if (studioSettingsCache) return studioSettingsCache;
  try {
    const p = getStudioSettingsPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      studioSettingsCache = sanitizeStudioSettings(parsed);
      return studioSettingsCache;
    }
  } catch {}
  studioSettingsCache = sanitizeStudioSettings({});
  return studioSettingsCache;
}

function saveStudioSettings(patch) {
  const current = loadStudioSettings();
  const pObj = patch && typeof patch === "object" ? Object.assign({}, patch) : {};
  if (pObj.miniFields && typeof pObj.miniFields === "object") {
    pObj.miniFields = Object.assign({}, current.miniFields, pObj.miniFields);
  }
  if (pObj.greeting && typeof pObj.greeting === "object") {
    pObj.greeting = Object.assign({}, current.greeting || DEFAULT_GREETING, pObj.greeting);
  }
  if (pObj.studioUi && typeof pObj.studioUi === "object") {
    pObj.studioUi = Object.assign({}, current.studioUi || DEFAULT_STUDIO_UI, pObj.studioUi);
  }
  if (pObj.appearance && typeof pObj.appearance === "object") {
    const curApp = current.appearance || DEFAULT_APPEARANCE;
    pObj.appearance = Object.assign({}, curApp, pObj.appearance, {
      corners: Object.assign({}, curApp.corners || DEFAULT_APPEARANCE.corners, pObj.appearance.corners || {}),
      wallpaper: Object.assign({}, curApp.wallpaper, pObj.appearance.wallpaper || {}),
      typography: Object.assign({}, curApp.typography, pObj.appearance.typography || {}),
    });
  }
  const next = sanitizeStudioSettings(Object.assign({}, current, pObj));
  studioSettingsCache = next;
  try {
    writeJsonAtomic(getStudioSettingsPath(), next);
  } catch (err) {
    console.warn("[Rudex] Failed to persist studio settings:", err && err.message ? err.message : err);
  }
  if (pObj.studioUi && Object.prototype.hasOwnProperty.call(pObj.studioUi, "appScale")) {
    applyAppScaleToWindows(next.studioUi.appScale);
  }
  if (pObj.appearance) {
    applyThemeCurtainToWindows(next.appearance);
  }
  if (pObj.appearance || pObj.appearanceProfiles) {
    schedulePruneOrphanedMedia(next);
  }
  if (Object.prototype.hasOwnProperty.call(pObj, "thinkingInRussian")) {
    syncThinkingRuFlag(Boolean(next.thinkingInRussian), { wasEnabled: Boolean(current.thinkingInRussian) });
    resyncActiveChatRuleFile();
  }
  if (pObj.autoCheckUpdates === true && current.autoCheckUpdates === false) {
    if (Date.now() - (updateStatusState.lastCheckedAt || 0) > 30 * 60 * 1000) {
      try { runUpdateCheck({ force: false }); } catch {}
    }
  }
  return next;
}

function schedulePruneOrphanedMedia(settings) {
  try {
    const mediaDir = getStudioMediaDir();
    if (!fs.existsSync(mediaDir)) return;
    const activeFiles = new Set();
    const s = settings || loadStudioSettings();
    if (s.appearance && s.appearance.wallpaper && s.appearance.wallpaper.mediaFile) {
      activeFiles.add(s.appearance.wallpaper.mediaFile);
    }
    const profs = Array.isArray(s.appearanceProfiles) ? s.appearanceProfiles : [];
    for (let i = 0; i < profs.length; i += 1) {
      const mf = profs[i] && profs[i].appearance && profs[i].appearance.wallpaper && profs[i].appearance.wallpaper.mediaFile;
      if (mf) activeFiles.add(mf);
    }
    const now = Date.now();
    for (const ent of fs.readdirSync(mediaDir, { withFileTypes: true })) {
      if (!ent.isFile() || activeFiles.has(ent.name)) continue;
      const full = path.join(mediaDir, ent.name);
      try {
        const st = fs.statSync(full);
        if (now - (st.mtimeMs || 0) > 120000) {
          fs.unlinkSync(full);
        }
      } catch {}
    }
  } catch {}
}

function getStudioChatsPath() {
  return path.join(app.getPath("userData"), "agy_studio_chats.json");
}

function getPersonaActiveFlagPath() {
  return path.join(app.getPath("userData"), "agy_studio_persona_active.flag");
}

function getPersonaAnchorsPath() {
  return path.join(app.getPath("userData"), "studio_persona_anchors.json");
}

function normalizeChatKey(raw) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s || s === "__new__") return "__new__";
  return s.slice(0, 160);
}

function defaultChatTelemetry() {
  return {
    lastAvgTps: 0,
    peakTps: 0,
    lastDurSec: 0,
    lastThinkingSec: 0,
    respTokens: 0,
    chatTokens: 0,
    exactRespTokens: 0,
    exactContextTokens: 0,
    exactCacheTokens: 0,
    modelName: "",
    samples: [],
    history: [],
  };
}

function defaultFamilyQuota() {
  return {
    turns: 0,
    weightedTokens: 0,
    estFiveHourPct: 0,
    estWeeklyPct: 0,
    observedFiveHourPct: 0,
    observedWeeklyPct: 0,
    lastModel: "",
    lastTurnAt: 0,
    recentTurns: [],
  };
}

function defaultChatQuota() {
  return {
    gemini: defaultFamilyQuota(),
    claudeGpt: defaultFamilyQuota(),
  };
}

function defaultChatRecord(title) {
  return {
    title: typeof title === "string" ? title.trim().slice(0, 80) : "",
    updatedAt: 0,
    personaEnabled: false,
    personaActivePreset: "custom",
    personaText: "",
    personaStrict: true,
    telemetry: defaultChatTelemetry(),
    quota: defaultChatQuota(),
  };
}

function toNonNegInt(val) {
  return typeof val === "number" && Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
}

function toNonNegFloat(val) {
  return typeof val === "number" && Number.isFinite(val) && val > 0 ? Math.round(val * 100) / 100 : 0;
}

function toQuotaPct(val) {
  return typeof val === "number" && Number.isFinite(val) && val > 0 ? Math.round(val * 1000) / 1000 : 0;
}

function sanitizeFamilyQuota(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const recent = Array.isArray(src.recentTurns)
    ? src.recentTurns
        .filter((x) => x && typeof x === "object")
        .slice(-40)
        .map((x) => ({
          ts: toNonNegInt(x.ts),
          wt: toNonNegInt(x.wt),
          est5h: toQuotaPct(x.est5h),
        }))
        .filter((x) => x.ts > 0)
    : [];
  return {
    turns: toNonNegInt(src.turns),
    weightedTokens: toNonNegInt(src.weightedTokens),
    estFiveHourPct: toQuotaPct(src.estFiveHourPct),
    estWeeklyPct: toQuotaPct(src.estWeeklyPct),
    observedFiveHourPct: toQuotaPct(src.observedFiveHourPct),
    observedWeeklyPct: toQuotaPct(src.observedWeeklyPct),
    lastModel: typeof src.lastModel === "string" ? src.lastModel.slice(0, 96) : "",
    lastTurnAt: toNonNegInt(src.lastTurnAt),
    recentTurns: recent,
  };
}

function sanitizeChatQuota(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    gemini: sanitizeFamilyQuota(src.gemini),
    claudeGpt: sanitizeFamilyQuota(src.claudeGpt),
  };
}

function isBogusHydrationSpikeEntry(h) {
  if (!h) return false;
  if (h.avgTps >= 500 || h.peakTps >= 900) return true;
  if (h.durSec > 0 && h.durSec <= 0.31 && h.tokens <= 10 && h.avgTps >= 20) return true;
  if (h.durSec > 0 && h.durSec <= 0.25 && h.tokens >= 400 && h.avgTps >= 350) return true;
  return false;
}

function sanitizeChatTelemetry(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  let samples = Array.isArray(src.samples)
    ? src.samples.slice(-24).map((n) => toNonNegInt(n)).filter((n) => n > 0 && n < 900)
    : [];
  const rawHist = Array.isArray(src.history)
    ? src.history
        .filter((h) => h && typeof h === "object")
        .slice(0, 8)
        .map((h) => {
          const avgTps = toNonNegInt(h.avgTps);
          const peakTps = Math.max(avgTps, toNonNegInt(h.peakTps));
          return {
            model: typeof h.model === "string" ? h.model.slice(0, 96) : "",
            tokens: toNonNegInt(h.tokens),
            exactOutputTokens: toNonNegInt(h.exactOutputTokens),
            exact: Boolean(h.exact),
            durSec: toNonNegFloat(h.durSec),
            avgTps,
            peakTps,
            at: typeof h.at === "string" ? h.at.slice(0, 20) : "",
          };
        })
    : [];
  const history = rawHist.filter((h) => !isBogusHydrationSpikeEntry(h));
  let lastAvgTps = toNonNegInt(src.lastAvgTps);
  let peakTps = toNonNegInt(src.peakTps);
  let lastDurSec = toNonNegFloat(src.lastDurSec);
  const respTokens = toNonNegInt(src.respTokens);
  const hasBogusMetric = lastAvgTps >= 500 || peakTps >= 900 || (lastDurSec > 0 && lastDurSec <= 0.31 && respTokens <= 12 && lastAvgTps >= 20);
  if (hasBogusMetric) {
    lastAvgTps = history[0] ? history[0].avgTps : 0;
    lastDurSec = history[0] ? history[0].durSec : 0;
    peakTps = history.reduce((mx, it) => Math.max(mx, it.peakTps < 900 ? (it.peakTps || 0) : 0), 0);
    if (samples.length === 0 && lastAvgTps > 0) {
      samples = [lastAvgTps];
    }
  }
  peakTps = Math.max(peakTps, lastAvgTps);
  return {
    lastAvgTps,
    peakTps,
    lastDurSec,
    lastThinkingSec: toNonNegFloat(src.lastThinkingSec),
    respTokens,
    chatTokens: toNonNegInt(src.chatTokens),
    exactRespTokens: toNonNegInt(src.exactRespTokens),
    exactContextTokens: toNonNegInt(src.exactContextTokens),
    exactCacheTokens: toNonNegInt(src.exactCacheTokens),
    modelName: typeof src.modelName === "string" ? src.modelName.slice(0, 96) : "",
    samples,
    history,
  };
}

function sanitizeChatRecord(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    title: typeof src.title === "string" ? src.title.trim().slice(0, 80) : "",
    updatedAt: toNonNegInt(src.updatedAt),
    personaEnabled: Boolean(src.personaEnabled),
    personaActivePreset: typeof src.personaActivePreset === "string" && src.personaActivePreset ? src.personaActivePreset : "custom",
    personaText: typeof src.personaText === "string" ? src.personaText : "",
    personaStrict: src.personaStrict !== false,
    telemetry: sanitizeChatTelemetry(src.telemetry),
    quota: sanitizeChatQuota(src.quota),
  };
}

function syncPersonaActiveFlag(store) {
  try {
    const flagPath = getPersonaActiveFlagPath();
    const s = store && typeof store === "object" ? store : {};
    let needFlag = Boolean(
      s.pendingNewChatPersona &&
      s.pendingNewChatPersona.enabled &&
      typeof s.pendingNewChatPersona.text === "string" &&
      s.pendingNewChatPersona.text.trim()
    );
    if (!needFlag && typeof s.activeAgentsMdChatKey === "string" && s.activeAgentsMdChatKey) {
      needFlag = true;
    }
    if (!needFlag && s.chats && typeof s.chats === "object") {
      for (const k of Object.keys(s.chats)) {
        const c = s.chats[k];
        if (c && c.personaEnabled && typeof c.personaText === "string" && c.personaText.trim()) {
          needFlag = true;
          break;
        }
      }
    }
    if (!needFlag) {
      try {
        const anchorsPath = getPersonaAnchorsPath();
        if (fs.existsSync(anchorsPath)) {
          const rawA = JSON.parse(fs.readFileSync(anchorsPath, "utf8"));
          const amap = rawA && rawA.anchors && typeof rawA.anchors === "object" ? rawA.anchors : {};
          for (const ak of Object.keys(amap)) {
            if (amap[ak] && amap[ak].enabled) {
              needFlag = true;
              break;
            }
          }
        }
      } catch {}
    }
    if (needFlag) {
      fs.mkdirSync(path.dirname(flagPath), { recursive: true });
      fs.writeFileSync(flagPath, "1\n", "utf8");
    } else if (fs.existsSync(flagPath)) {
      fs.unlinkSync(flagPath);
    }
  } catch {}
}

function loadStudioChatsStore() {
  const p = getStudioChatsPath();
  try {
    if (fs.existsSync(p)) {
      const st = fs.statSync(p);
      if (studioChatsCache && st.mtimeMs === studioChatsMtimeMs) {
        return studioChatsCache;
      }
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      const srcChats = parsed && typeof parsed === "object" && parsed.chats && typeof parsed.chats === "object" ? parsed.chats : {};
      const out = {};
      for (const k of Object.keys(srcChats)) {
        const nk = normalizeChatKey(k);
        if (nk === "__new__") continue;
        out[nk] = sanitizeChatRecord(srcChats[k]);
      }
      const rawPending = parsed && parsed.pendingNewChatPersona && typeof parsed.pendingNewChatPersona === "object"
        ? parsed.pendingNewChatPersona
        : null;
      const pendingNewChatPersona = rawPending && rawPending.enabled && typeof rawPending.text === "string" && rawPending.text.trim()
        ? {
            enabled: true,
            text: rawPending.text,
            activePreset: typeof rawPending.activePreset === "string" ? rawPending.activePreset : "custom",
            strict: rawPending.strict !== false,
            updatedAt: toNonNegInt(rawPending.updatedAt),
            claimedBy: typeof rawPending.claimedBy === "string" ? rawPending.claimedBy : "",
          }
        : null;
      const activeAgentsMdChatKey = parsed && typeof parsed.activeAgentsMdChatKey === "string"
        ? parsed.activeAgentsMdChatKey.trim()
        : "";
      studioChatsMtimeMs = st.mtimeMs;
      studioChatsCache = {
        version: 1,
        chats: out,
        pendingNewChatPersona,
        activeAgentsMdChatKey,
      };
      return studioChatsCache;
    }
  } catch {}
  studioChatsCache = {
    version: 1,
    chats: {},
    pendingNewChatPersona: null,
    activeAgentsMdChatKey: "",
  };
  studioChatsMtimeMs = -1;
  return studioChatsCache;
}

function saveStudioChatsStore(storeObj) {
  const s = storeObj && typeof storeObj === "object" ? storeObj : {};
  const src = s.chats && typeof s.chats === "object" ? s.chats : {};
  const entries = Object.keys(src)
    .filter((k) => k && k !== "__new__")
    .map((k) => [k, sanitizeChatRecord(src[k])])
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
    .slice(0, MAX_STORED_CHATS);
  const pruned = {};
  for (const pair of entries) {
    pruned[pair[0]] = pair[1];
  }
  const payload = {
    version: 1,
    chats: pruned,
    pendingNewChatPersona: s.pendingNewChatPersona || null,
    activeAgentsMdChatKey: typeof s.activeAgentsMdChatKey === "string" ? s.activeAgentsMdChatKey : "",
  };
  studioChatsCache = payload;
  try {
    const p = getStudioChatsPath();
    writeJsonAtomic(p, payload);
    try { studioChatsMtimeMs = fs.statSync(p).mtimeMs; } catch { studioChatsMtimeMs = -1; }
  } catch (err) {
    console.warn("[Rudex] Failed to persist studio chats:", err && err.message ? err.message : err);
  }
  syncPersonaActiveFlag(payload);
  quotaSummaryCache.at = 0;
  return payload;
}

function loadStudioChats() {
  return loadStudioChatsStore().chats;
}

function saveStudioChats(chatsMap) {
  const cur = loadStudioChatsStore();
  cur.chats = chatsMap && typeof chatsMap === "object" ? chatsMap : {};
  return saveStudioChatsStore(cur).chats;
}

function formatThinkingRuRuleBlock() {
  return [
    "# Язык внутренних размышлений агента (Rudex Studio)",
    "",
    "MANDATORY: Write ALL internal reasoning / thinking / chain-of-thought exclusively in Russian (на русском языке).",
    "Веди ВСЁ внутреннее рассуждение (thinking / chain-of-thought / этап размышления) целиком на **русском языке**.",
    "- Preserve file paths, code identifiers, symbols, and terminal commands verbatim (в точном оригинальном виде).",
  ].join("\n");
}

function formatPersonaRuleContent(trimmed, usePlugin, strictMode, thinkingInRussian) {
  const header = usePlugin ? "" : "---\ntrigger: always_on\n---\n\n";
  const sections = [];
  if (trimmed) {
    const body = [
      "# Стиль общения активного чата (Rudex Studio)",
      "",
      "Веди диалог в манере, заданной внутри <user_persona>, от первого слова до финальной строки:",
      "",
      "<user_persona>",
      trimmed,
      "</user_persona>",
      "",
      "1. Выдерживай запрошенные тон, подачу, лексику и формат естественно, без сухого шаблонного канцелярита.",
      "2. Код, пути к файлам, команды и результаты инструментов оставляй на 100% точными и фактическими.",
      "3. В допустимых рамках полностью раскрывай образ без лишних нотаций и отказов-отписок.",
    ];
    if (strictMode !== false) {
      body.push("4. Сохраняй этот же голос при переходе между планированием, выполнением и ответами субагентов.");
    }
    sections.push(body.join("\n"));
  }
  if (thinkingInRussian) {
    sections.push(formatThinkingRuRuleBlock());
  }
  return header + sections.join("\n\n") + "\n";
}

function syncPersonaRuleFile(enabled, text, strictMode) {
  const usePlugin = isRudexPluginInstalled() || isLegacyPluginInstalled();
  const rulePath = getPersonaRulePath();
  const stalePaths = [getPluginPersonaRulePath(), getLegacyPluginPersonaRulePath(), getLegacyGlobalPersonaRulePath()]
    .filter((p) => path.resolve(p).toLowerCase() !== path.resolve(rulePath).toLowerCase());
  for (const sp of stalePaths) {
    try {
      if (fs.existsSync(sp)) fs.unlinkSync(sp);
    } catch {}
  }

  const trimmed = enabled ? String(text || "").trim() : "";
  const thinkingRu = Boolean(loadStudioSettings().thinkingInRussian);
  if (!trimmed && !thinkingRu) {
    try {
      if (fs.existsSync(rulePath)) fs.unlinkSync(rulePath);
    } catch (err) {
      return { ok: false, exists: fs.existsSync(rulePath), byteLength: 0, error: err && err.message ? err.message : String(err), rulePath };
    }
    return { ok: !fs.existsSync(rulePath), exists: fs.existsSync(rulePath), byteLength: 0, rulePath };
  }
  const bodyBytes = Buffer.byteLength(trimmed, "utf8");
  if (trimmed && bodyBytes > MAX_PERSONA_BODY_BYTES) {
    return { ok: false, exists: fs.existsSync(rulePath), byteLength: bodyBytes, error: "EXCEEDS_BYTE_LIMIT", rulePath };
  }
  const content = formatPersonaRuleContent(trimmed, usePlugin, strictMode !== false, thinkingRu);
  try {
    writeFileAtomic(rulePath, content);
    const verified = fs.existsSync(rulePath);
    return { ok: verified, exists: verified, byteLength: Buffer.byteLength(content, "utf8"), rulePath };
  } catch (err) {
    return { ok: false, exists: fs.existsSync(rulePath), byteLength: bodyBytes, error: err && err.message ? err.message : String(err), rulePath };
  }
}

function resyncActiveChatRuleFile() {
  const store = loadStudioChatsStore();
  if (lastActiveChatKey === "__new__") {
    const pending = store.pendingNewChatPersona;
    if (pending && pending.enabled && typeof pending.text === "string" && pending.text.trim()) {
      return syncPersonaRuleFile(true, pending.text, pending.strict !== false);
    }
    return syncPersonaRuleFile(false, "", true);
  }
  const rec = store.chats && store.chats[lastActiveChatKey] ? sanitizeChatRecord(store.chats[lastActiveChatKey]) : null;
  return syncPersonaRuleFile(
    Boolean(rec && rec.personaEnabled),
    (rec && rec.personaText) || "",
    rec ? rec.personaStrict !== false : true
  );
}

function getStudioQuotaPath() {
  return path.join(app.getPath("userData"), "agy_studio_quota.json");
}

function classifyModelFamily(modelName) {
  const s = String(modelName || "");
  return /claude|sonnet|opus|haiku|anthropic|gpt|openai|chatgpt|\bo[134](?:[-_\s]|$)/i.test(s) ? "claudeGpt" : "gemini";
}

function getModelQuotaWeight(modelName) {
  const s = String(modelName || "").toLowerCase();
  if (/flash[_\s-]?lite|\bmini\b/.test(s)) return 0.35;
  if (/flash/.test(s)) return 0.6;
  if (/opus/.test(s)) return 1.8;
  if (/\b(pro|neon|ultra)\b|high|высок|сверхвысок/.test(s)) return 1.35;
  return 1.0;
}

function defaultQuotaFamilyState(famId) {
  const isClaude = famId === "claudeGpt";
  return {
    weeklyRem: null,
    fiveHourRem: null,
    weeklyReset: "",
    fiveHourReset: "",
    updatedAt: 0,
    resetAt: 0,
    calibrated: false,
    tokensPer1Pct5h: isClaude ? 40000 : 50000,
    tokensPer1PctWeekly: isClaude ? 180000 : 225000,
    pending5hByChat: {},
    pendingWeeklyByChat: {},
  };
}

function sanitizePendingMap(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const k of Object.keys(src)) {
    const nk = normalizeChatKey(k);
    if (nk === "__new__") continue;
    const v = toNonNegInt(src[k]);
    if (v > 0) out[nk] = v;
  }
  return out;
}

function toNullableRemPct(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;
}

function sanitizeQuotaFamilyState(famId, raw) {
  const def = defaultQuotaFamilyState(famId);
  const src = raw && typeof raw === "object" ? raw : {};
  const t5 = Number(src.tokensPer1Pct5h);
  const tw = Number(src.tokensPer1PctWeekly);
  return {
    weeklyRem: toNullableRemPct(src.weeklyRem),
    fiveHourRem: toNullableRemPct(src.fiveHourRem),
    weeklyReset: typeof src.weeklyReset === "string" ? src.weeklyReset.slice(0, 80) : "",
    fiveHourReset: typeof src.fiveHourReset === "string" ? src.fiveHourReset.slice(0, 80) : "",
    updatedAt: toNonNegInt(src.updatedAt),
    resetAt: toNonNegInt(src.resetAt),
    calibrated: Boolean(src.calibrated),
    tokensPer1Pct5h: Number.isFinite(t5) && t5 >= 5000 && t5 <= 1000000 ? Math.round(t5) : def.tokensPer1Pct5h,
    tokensPer1PctWeekly: Number.isFinite(tw) && tw >= 20000 && tw <= 5000000 ? Math.round(tw) : def.tokensPer1PctWeekly,
    pending5hByChat: sanitizePendingMap(src.pending5hByChat),
    pendingWeeklyByChat: sanitizePendingMap(src.pendingWeeklyByChat),
  };
}

function loadQuotaStore() {
  if (quotaStoreCache) return quotaStoreCache;
  try {
    const p = getStudioQuotaPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      const fams = parsed && typeof parsed === "object" && parsed.families ? parsed.families : {};
      quotaStoreCache = {
        version: 1,
        resetAt: toNonNegInt(parsed && parsed.resetAt),
        families: {
          gemini: sanitizeQuotaFamilyState("gemini", fams.gemini),
          claudeGpt: sanitizeQuotaFamilyState("claudeGpt", fams.claudeGpt),
        },
      };
      return quotaStoreCache;
    }
  } catch {}
  quotaStoreCache = {
    version: 1,
    resetAt: 0,
    families: {
      gemini: defaultQuotaFamilyState("gemini"),
      claudeGpt: defaultQuotaFamilyState("claudeGpt"),
    },
  };
  return quotaStoreCache;
}

function saveQuotaStore(store) {
  const normalized = {
    version: 1,
    resetAt: toNonNegInt(store && store.resetAt),
    families: {
      gemini: sanitizeQuotaFamilyState("gemini", store && store.families ? store.families.gemini : null),
      claudeGpt: sanitizeQuotaFamilyState("claudeGpt", store && store.families ? store.families.claudeGpt : null),
    },
  };
  quotaStoreCache = normalized;
  quotaSummaryCache.at = 0;
  try {
    writeJsonAtomic(getStudioQuotaPath(), normalized);
  } catch (err) {
    console.warn("[Rudex] Failed to persist studio quota:", err && err.message ? err.message : err);
  }
  return normalized;
}

function parseResetDurationMs(rawStr) {
  const s = String(rawStr || "").trim().toLowerCase();
  if (!s) return 0;
  let totalMs = 0;
  const re = /(\d+(?:[.,]\d+)?)\s*(?:дн[а-яё]*|д\.?|days?|d\b|час[а-яё]*|ч\.?|hours?|hrs?|h\b|мин[а-яё]*|м\.?|minutes?|mins?|m\b|сек[а-яё]*|с\.?|seconds?|secs?|s\b)/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    const val = parseFloat(m[1].replace(",", "."));
    if (!Number.isFinite(val) || val <= 0) continue;
    const tok = m[0].replace(m[1], "").trim().toLowerCase();
    if (tok.startsWith("д") || tok.startsWith("d")) totalMs += val * 86400000;
    else if (tok.startsWith("ч") || tok.startsWith("h")) totalMs += val * 3600000;
    else if (tok.startsWith("м") || tok.startsWith("m")) totalMs += val * 60000;
    else if (tok.startsWith("с") || tok.startsWith("s")) totalMs += val * 1000;
  }
  return Math.round(totalMs);
}

function readTranscriptHeadAndTail(lp, size) {
  const HEAD_CAP = 64 * 1024;
  const TAIL_CAP = 256 * 1024;
  if (size <= HEAD_CAP + TAIL_CAP) {
    return { head: fs.readFileSync(lp, "utf8"), tail: "" };
  }
  const fd = fs.openSync(lp, "r");
  try {
    const headBuf = Buffer.alloc(HEAD_CAP);
    const tailBuf = Buffer.alloc(TAIL_CAP);
    const hRead = fs.readSync(fd, headBuf, 0, HEAD_CAP, 0);
    const tRead = fs.readSync(fd, tailBuf, 0, TAIL_CAP, Math.max(0, size - TAIL_CAP));
    let tailStr = tailBuf.slice(0, tRead).toString("utf8");
    const nl = tailStr.indexOf("\n");
    if (nl !== -1) tailStr = tailStr.slice(nl + 1);
    return {
      head: headBuf.slice(0, hRead).toString("utf8"),
      tail: tailStr,
    };
  } finally {
    fs.closeSync(fd);
  }
}

function readLatestTurnMetrics(chatKey) {
  const key = normalizeChatKey(chatKey);
  if (!UUID_EXACT_RE.test(key)) {
    return { ok: false, reason: "NO_UUID" };
  }
  const lp = path.join(os.homedir(), ".gemini", "antigravity", "brain", key, ".system_generated", "logs", "transcript.jsonl");
  try {
    if (!fs.existsSync(lp)) return { ok: false, reason: "MISSING_TRANSCRIPT" };
    const st = fs.statSync(lp);
    const tailSize = Math.min(65536, st.size);
    if (tailSize <= 0) return { ok: false, reason: "EMPTY" };
    const fd = fs.openSync(lp, "r");
    let rawTail = "";
    try {
      const buf = Buffer.alloc(tailSize);
      const startPos = Math.max(0, st.size - tailSize);
      const nRead = fs.readSync(fd, buf, 0, tailSize, startPos);
      rawTail = buf.slice(0, nRead).toString("utf8");
      if (startPos > 0) {
        const firstNl = rawTail.indexOf("\n");
        if (firstNl !== -1) rawTail = rawTail.slice(firstNl + 1);
      }
    } finally {
      fs.closeSync(fd);
    }
    const lines = rawTail.split(/\r?\n/);
    let outputTokens = 0;
    let inputTokens = 0;
    let cacheReadTokens = 0;
    let model = "";
    let stepIndex = -1;
    let foundPlanner = false;
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const t = lines[i].trim();
      if (!t) continue;
      let o;
      try { o = JSON.parse(t); } catch { continue; }
      if (!o || typeof o !== "object") continue;
      if (o.type === "USER_INPUT") {
        if (foundPlanner) break;
        continue;
      }
      if (o.type === "PLANNER_RESPONSE") {
        foundPlanner = true;
        if (typeof o.output_tokens === "number" && Number.isFinite(o.output_tokens)) {
          outputTokens += Math.max(0, Math.round(o.output_tokens));
        }
        if (stepIndex === -1) {
          stepIndex = typeof o.step_index === "number" ? o.step_index : 0;
          inputTokens = typeof o.input_tokens === "number" && Number.isFinite(o.input_tokens) ? Math.max(0, Math.round(o.input_tokens)) : 0;
          cacheReadTokens = typeof o.cache_read_tokens === "number" && Number.isFinite(o.cache_read_tokens) ? Math.max(0, Math.round(o.cache_read_tokens)) : 0;
          if (typeof o.model === "string" && o.model) model = o.model;
        }
      }
    }
    if (!foundPlanner) return { ok: false, reason: "NO_PLANNER_STEP" };
    return {
      ok: true,
      outputTokens,
      inputTokens,
      cacheReadTokens,
      contextTokens: inputTokens + cacheReadTokens + outputTokens,
      model,
      stepIndex,
    };
  } catch (err) {
    return { ok: false, reason: err && err.message ? err.message : "READ_ERR" };
  }
}

function readTranscriptStepsCached(lp, mtimeMs, size) {
  const cacheKey = lp + ":" + Math.round(mtimeMs) + ":" + size;
  const cached = transcriptSummaryCache.get(cacheKey);
  if (cached) {
    transcriptSummaryCache.delete(cacheKey);
    transcriptSummaryCache.set(cacheKey, cached);
    return cached;
  }
  const steps = [];
  let titleGuess = "";
  let lastModel = "";
  try {
    const { head, tail } = readTranscriptHeadAndTail(lp, size);
    const parseBlock = (blockText, collectTitle) => {
      const lines = blockText.split(/\r?\n/);
      let runningCtxTok = 0;
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!line) continue;
        let o;
        try { o = JSON.parse(line); } catch { continue; }
        const ts = o.created_at ? Date.parse(o.created_at) : 0;
        const contentStr = typeof o.content === "string" ? o.content : "";
        const thinkStr = typeof o.thinking === "string" ? o.thinking : "";
        const toolsStr = Array.isArray(o.tool_calls) ? JSON.stringify(o.tool_calls) : "";
        if (collectTitle && !titleGuess && o.type === "USER_INPUT" && contentStr.trim()) {
          const cleanU = contentStr.replace(/\s+/g, " ").trim();
          if (cleanU && !cleanU.startsWith("<")) {
            titleGuess = cleanU.slice(0, 60);
          }
        }
        const outTok = typeof o.output_tokens === "number" && o.output_tokens > 0
          ? Math.round(o.output_tokens)
          : Math.max(20, Math.round((contentStr.length + thinkStr.length + toolsStr.length) / 3.5));
        if (o.type === "PLANNER_RESPONSE") {
          if (typeof o.model === "string" && o.model.trim()) lastModel = o.model.trim();
          const realCtx = (typeof o.input_tokens === "number" ? o.input_tokens : 0) + (typeof o.cache_read_tokens === "number" ? o.cache_read_tokens : 0);
          const ctxTok = realCtx > 0 ? realCtx : Math.min(120000, 10000 + runningCtxTok);
          const stepUnits = Math.round(outTok + ctxTok * 0.10);
          const fam = classifyModelFamily(o.model || lastModel || "");
          steps.push({ ts: Number.isFinite(ts) && ts > 0 ? ts : mtimeMs, units: stepUnits, family: fam });
        }
        runningCtxTok = Math.min(180000, runningCtxTok + Math.round((contentStr.length + toolsStr.length) / 3.5));
      }
    };
    parseBlock(head, true);
    if (tail) {
      steps.length = 0;
      parseBlock(tail, false);
    }
  } catch {}
  const entry = { steps, titleGuess, lastModel, mtimeMs };
  if (transcriptSummaryCache.size >= 260) {
    let toRemove = 60;
    for (const k of transcriptSummaryCache.keys()) {
      transcriptSummaryCache.delete(k);
      if (--toRemove <= 0) break;
    }
  }
  transcriptSummaryCache.set(cacheKey, entry);
  return entry;
}

function scanBrainTranscriptsQuota(minCutoffMs, resetWatermarkMs) {
  const out = new Map();
  const brainDir = path.join(os.homedir(), ".gemini", "antigravity", "brain");
  let entries;
  try {
    if (!fs.existsSync(brainDir)) return out;
    entries = fs.readdirSync(brainDir, { withFileTypes: true });
  } catch {
    return out;
  }
  const minCutoff = Math.max(resetWatermarkMs || 0, minCutoffMs || 0);
  for (let i = 0; i < entries.length; i += 1) {
    const ent = entries[i];
    if (!ent || !ent.isDirectory()) continue;
    const chatId = normalizeChatKey(ent.name);
    if (!chatId || chatId === "__new__") continue;
    const lp = path.join(brainDir, ent.name, ".system_generated", "logs", "transcript.jsonl");
    let st;
    try {
      if (!fs.existsSync(lp)) continue;
      st = fs.statSync(lp);
    } catch {
      continue;
    }
    if (!st || !st.isFile() || st.size < 20 || st.mtimeMs < minCutoff) continue;
    const parsed = readTranscriptStepsCached(lp, st.mtimeMs, st.size);
    if (parsed.steps.length > 0) {
      out.set(chatId, {
        chatKey: chatId,
        steps: parsed.steps,
        lastTs: Math.round(st.mtimeMs),
        titleGuess: parsed.titleGuess || "",
        lastModel: parsed.lastModel || "",
      });
    }
  }
  return out;
}

function getFamilyCycleBounds(famState, nowMs) {
  const wkRemMs = parseResetDurationMs(famState.weeklyReset);
  const fhRemMs = parseResetDurationMs(famState.fiveHourReset);
  const weeklyStartMs = wkRemMs > 0 && wkRemMs <= SEVEN_DAY_MS
    ? nowMs - (SEVEN_DAY_MS - wkRemMs)
    : nowMs - SEVEN_DAY_MS;
  const fiveHourStartMs = fhRemMs > 0 && fhRemMs <= FIVE_HOUR_MS
    ? nowMs - (FIVE_HOUR_MS - fhRemMs)
    : nowMs - FIVE_HOUR_MS;
  return { weeklyStartMs, fiveHourStartMs };
}

function buildQuotaSummary(activeChatKey, forceFresh) {
  const normActive = normalizeChatKey(activeChatKey || lastActiveChatKey);
  const nowMs = Date.now();
  if (!forceFresh && quotaSummaryCache.value && quotaSummaryCache.key === normActive && nowMs - quotaSummaryCache.at < 4000) {
    return quotaSummaryCache.value;
  }

  const store = loadQuotaStore();
  const chats = loadStudioChats();
  const resetWm = Math.max(store.resetAt || 0, store.families.gemini.resetAt || 0, store.families.claudeGpt.resetAt || 0);
  const bounds = {
    gemini: getFamilyCycleBounds(store.families.gemini, nowMs),
    claudeGpt: getFamilyCycleBounds(store.families.claudeGpt, nowMs),
  };
  const minCutoffMs = Math.min(bounds.gemini.weeklyStartMs, bounds.claudeGpt.weeklyStartMs, bounds.gemini.fiveHourStartMs, bounds.claudeGpt.fiveHourStartMs);
  const diskByChat = scanBrainTranscriptsQuota(minCutoffMs, resetWm);

  const allKeys = new Set(Object.keys(chats));
  for (const k of diskByChat.keys()) allKeys.add(k);

  const familyTotals = {
    gemini: { unitsWeekly: 0, units5h: 0 },
    claudeGpt: { unitsWeekly: 0, units5h: 0 },
  };
  const chatMeta = new Map();

  for (const key of allKeys) {
    if (!key || key === "__new__") continue;
    const rec = chats[key] ? sanitizeChatRecord(chats[key]) : defaultChatRecord("");
    const disk = diskByChat.get(key) || null;
    const modelName = (rec.telemetry && rec.telemetry.modelName) || (rec.quota.claudeGpt.lastModel) || (rec.quota.gemini.lastModel) || (disk && disk.lastModel) || "";
    const diskLastFam = disk && disk.steps.length > 0 ? disk.steps[disk.steps.length - 1].family : "";
    const hasCla = rec.quota.claudeGpt.turns > 0 || (modelName && classifyModelFamily(modelName) === "claudeGpt") || diskLastFam === "claudeGpt";
    const primaryFamily = hasCla && (rec.quota.claudeGpt.lastTurnAt >= rec.quota.gemini.lastTurnAt || diskLastFam === "claudeGpt") ? "claudeGpt" : "gemini";
    const famWeight = Math.max(0.4, getModelQuotaWeight(modelName));

    const unitsWeeklyByFam = { gemini: 0, claudeGpt: 0 };
    const units5hByFam = { gemini: 0, claudeGpt: 0 };
    const turnsByFam = { gemini: 0, claudeGpt: 0 };
    let lastStepTs = 0;

    if (disk) {
      const rawWByFam = { gemini: 0, claudeGpt: 0 };
      const raw5ByFam = { gemini: 0, claudeGpt: 0 };
      const stepsWByFam = { gemini: 0, claudeGpt: 0 };
      const steps5ByFam = { gemini: 0, claudeGpt: 0 };
      for (let i = 0; i < disk.steps.length; i += 1) {
        const stp = disk.steps[i];
        if (stp.ts < resetWm) continue;
        const fam = stp.family === "claudeGpt" ? "claudeGpt" : "gemini";
        const famBounds = bounds[fam];
        if (stp.ts >= famBounds.weeklyStartMs) {
          rawWByFam[fam] += stp.units;
          stepsWByFam[fam] += 1;
          if (stp.ts > lastStepTs) lastStepTs = stp.ts;
        }
        if (stp.ts >= famBounds.fiveHourStartMs) {
          raw5ByFam[fam] += stp.units;
          steps5ByFam[fam] += 1;
          if (stp.ts > lastStepTs) lastStepTs = stp.ts;
        }
      }
      for (const fam of ["gemini", "claudeGpt"]) {
        unitsWeeklyByFam[fam] = Math.round(rawWByFam[fam] * famWeight);
        units5hByFam[fam] = Math.round(raw5ByFam[fam] * famWeight);
        turnsByFam[fam] = Math.max(rec.quota[fam].turns || 0, stepsWByFam[fam], steps5ByFam[fam]);
      }
    } else {
      for (const fam of ["gemini", "claudeGpt"]) {
        const fqFam = rec.quota[fam];
        const famBounds = bounds[fam];
        unitsWeeklyByFam[fam] = fqFam.weightedTokens || 0;
        const recent = Array.isArray(fqFam.recentTurns) ? fqFam.recentTurns : [];
        for (let i = 0; i < recent.length; i += 1) {
          if (recent[i].ts >= famBounds.fiveHourStartMs && recent[i].ts >= resetWm) {
            units5hByFam[fam] += recent[i].wt || 0;
          }
        }
        turnsByFam[fam] = fqFam.turns || 0;
      }
    }

    for (const fam of ["gemini", "claudeGpt"]) {
      familyTotals[fam].unitsWeekly += unitsWeeklyByFam[fam];
      familyTotals[fam].units5h += units5hByFam[fam];
    }
    const turns = turnsByFam.gemini + turnsByFam.claudeGpt;
    const resolvedPrimaryFamily =
      unitsWeeklyByFam.claudeGpt > unitsWeeklyByFam.gemini ||
      units5hByFam.claudeGpt > units5hByFam.gemini ||
      (unitsWeeklyByFam.claudeGpt === unitsWeeklyByFam.gemini &&
        units5hByFam.claudeGpt === units5hByFam.gemini &&
        hasCla &&
        (rec.quota.claudeGpt.lastTurnAt >= rec.quota.gemini.lastTurnAt || diskLastFam === "claudeGpt"))
        ? "claudeGpt"
        : "gemini";
    chatMeta.set(key, { rec, disk, lastStepTs, modelName, primaryFamily: resolvedPrimaryFamily, unitsWeeklyByFam, units5hByFam, turnsByFam, turns });
  }

  const rates = {};
  for (const famId of ["gemini", "claudeGpt"]) {
    const fam = store.families[famId];
    const totW = familyTotals[famId].unitsWeekly;
    const tot5 = familyTotals[famId].units5h;
    const usedW = fam.weeklyRem !== null ? Math.max(0, 100 - fam.weeklyRem) : null;
    const used5 = fam.fiveHourRem !== null ? Math.max(0, 100 - fam.fiveHourRem) : null;
    const impliedW = usedW !== null && usedW >= 0.5 && totW > 0
      ? Math.round(clampNum(totW / usedW, 25000, 3000000, fam.tokensPer1PctWeekly))
      : fam.tokensPer1PctWeekly;
    const implied5 = used5 !== null && used5 >= 0.5 && tot5 > 0
      ? Math.round(clampNum(tot5 / used5, 8000, 800000, fam.tokensPer1Pct5h))
      : Math.max(15000, Math.round(impliedW * 0.22));
    rates[famId] = {
      usedWeeklyReal: usedW,
      used5hReal: used5,
      totW,
      tot5,
      unitsPer1PctWeekly: impliedW,
      unitsPer1Pct5h: implied5,
      calibrated: Boolean(fam.calibrated || (usedW !== null && totW > 0) || (used5 !== null && tot5 > 0)),
    };
  }

  const rows = [];
  let activeChatSummary = null;
  for (const [key, info] of chatMeta.entries()) {
    const { rec, disk, lastStepTs, modelName, primaryFamily, unitsWeeklyByFam, units5hByFam, turnsByFam, turns } = info;
    const computeFamStats = (famId) => {
      const rateInfo = rates[famId];
      const fq = rec.quota[famId];
      const uW = unitsWeeklyByFam[famId] || 0;
      const u5 = units5hByFam[famId] || 0;
      let wPct = 0;
      if (rateInfo.usedWeeklyReal !== null && rateInfo.totW > 0 && uW > 0) {
        wPct = toQuotaPct(rateInfo.usedWeeklyReal * (uW / rateInfo.totW));
      } else if (uW > 0) {
        wPct = toQuotaPct(uW / Math.max(20000, rateInfo.unitsPer1PctWeekly));
      }
      if (fq.observedWeeklyPct > wPct) wPct = fq.observedWeeklyPct;

      let f5wPct = 0;
      if (rateInfo.used5hReal !== null && rateInfo.tot5 > 0 && u5 > 0) {
        f5wPct = toQuotaPct(rateInfo.used5hReal * (u5 / rateInfo.tot5));
      } else if (u5 > 0) {
        f5wPct = toQuotaPct(u5 / Math.max(8000, rateInfo.unitsPer1Pct5h));
      }
      const f5Pct = Math.max(f5wPct, fq.observedFiveHourPct || 0);
      return {
        fiveHourPct: toQuotaPct(f5Pct),
        fiveHourWindowPct: toQuotaPct(Math.min(100, f5wPct)),
        weeklyPct: toQuotaPct(Math.min(100, wPct)),
        turns: turnsByFam[famId] || 0,
      };
    };

    const gemStats = computeFamStats("gemini");
    const claStats = computeFamStats("claudeGpt");
    const primaryStats = primaryFamily === "claudeGpt" ? claStats : gemStats;
    const rateInfo = rates[primaryFamily];
    const famState = store.families[primaryFamily];
    const fq = rec.quota[primaryFamily];

    const weeklyPct = primaryStats.weeklyPct;
    const fiveHourWindowPct = primaryStats.fiveHourWindowPct;
    const fiveHourPct = primaryStats.fiveHourPct;
    const unitsWeeklyTotal = (unitsWeeklyByFam.gemini || 0) + (unitsWeeklyByFam.claudeGpt || 0);
    const units5hTotal = (units5hByFam.gemini || 0) + (units5hByFam.claudeGpt || 0);

    const hasActivity = turns > 0 || unitsWeeklyTotal > 0 || units5hTotal > 0 || gemStats.fiveHourPct > 0 || gemStats.weeklyPct > 0 || claStats.fiveHourPct > 0 || claStats.weeklyPct > 0;
    const displayTitle = rec.title || (disk && disk.titleGuess) || modelName || key.slice(0, 12);
    const updatedAt = Math.max(rec.updatedAt || 0, lastStepTs || (disk && disk.lastTs) || 0, fq.lastTurnAt || 0, rec.quota.gemini.lastTurnAt || 0, rec.quota.claudeGpt.lastTurnAt || 0);
    const item = {
      chatKey: key,
      title: displayTitle,
      modelName,
      primaryFamily,
      turns,
      weightedTokens: Math.max(unitsWeeklyTotal, (rec.quota.gemini.weightedTokens || 0) + (rec.quota.claudeGpt.weightedTokens || 0)),
      fiveHourPct,
      fiveHourWindowPct,
      weeklyPct,
      calibrated: rateInfo.calibrated || Boolean(famState.calibrated),
      updatedAt,
      gemini: { fiveHourPct: gemStats.fiveHourPct, weeklyPct: gemStats.weeklyPct, turns: gemStats.turns },
      claudeGpt: { fiveHourPct: claStats.fiveHourPct, weeklyPct: claStats.weeklyPct, turns: claStats.turns },
    };
    if (key === normActive) {
      activeChatSummary = item;
    }
    if (hasActivity || key === normActive) {
      rows.push(item);
    }
  }

  rows.sort((a, b) => {
    const scoreA = a.fiveHourWindowPct * 3 + a.weeklyPct + (a.chatKey === normActive ? 0.0001 : 0);
    const scoreB = b.fiveHourWindowPct * 3 + b.weeklyPct + (b.chatKey === normActive ? 0.0001 : 0);
    if (Math.abs(scoreB - scoreA) > 0.0005) return scoreB - scoreA;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  const result = {
    families: {
      gemini: {
        weeklyRem: store.families.gemini.weeklyRem,
        fiveHourRem: store.families.gemini.fiveHourRem,
        weeklyReset: store.families.gemini.weeklyReset,
        fiveHourReset: store.families.gemini.fiveHourReset,
        updatedAt: store.families.gemini.updatedAt,
        calibrated: rates.gemini.calibrated,
        tokensPer1Pct5h: rates.gemini.unitsPer1Pct5h,
        tokensPer1PctWeekly: rates.gemini.unitsPer1PctWeekly,
      },
      claudeGpt: {
        weeklyRem: store.families.claudeGpt.weeklyRem,
        fiveHourRem: store.families.claudeGpt.fiveHourRem,
        weeklyReset: store.families.claudeGpt.weeklyReset,
        fiveHourReset: store.families.claudeGpt.fiveHourReset,
        updatedAt: store.families.claudeGpt.updatedAt,
        calibrated: rates.claudeGpt.calibrated,
        tokensPer1Pct5h: rates.claudeGpt.unitsPer1Pct5h,
        tokensPer1PctWeekly: rates.claudeGpt.unitsPer1PctWeekly,
      },
    },
    activeChat: activeChatSummary,
    chats: rows.slice(0, 40),
  };
  quotaSummaryCache = { key: normActive, at: nowMs, value: result };
  return result;
}

function applyQuotaDropForWindow(famId, dropPct, pendingMap, chats, activeChatKey, isWeekly) {
  let totalPending = 0;
  for (const k of Object.keys(pendingMap)) {
    totalPending += Number(pendingMap[k]) || 0;
  }
  const obsKey = isWeekly ? "observedWeeklyPct" : "observedFiveHourPct";
  if (totalPending > 0) {
    for (const k of Object.keys(pendingMap)) {
      const wt = Number(pendingMap[k]) || 0;
      if (wt <= 0) continue;
      if (!chats[k]) chats[k] = defaultChatRecord("");
      chats[k] = sanitizeChatRecord(chats[k]);
      const share = dropPct * (wt / totalPending);
      chats[k].quota[famId][obsKey] = toQuotaPct(chats[k].quota[famId][obsKey] + share);
    }
    return { distributed: true, totalPending };
  }
  if (activeChatKey && activeChatKey !== "__new__") {
    if (!chats[activeChatKey]) chats[activeChatKey] = defaultChatRecord("");
    chats[activeChatKey] = sanitizeChatRecord(chats[activeChatKey]);
    chats[activeChatKey].quota[famId][obsKey] = toQuotaPct(chats[activeChatKey].quota[famId][obsKey] + dropPct);
  }
  return { distributed: false, totalPending: 0 };
}

function getPatchMeta() {
  for (const name of ["rudex-patch-meta.json", "ru-patch-meta.json"]) {
    try {
      const p = path.join(__dirname, "..", name);
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf8"));
      }
    } catch {}
  }
  return null;
}

function getStudioState(activeChatKey) {
  const settings = loadStudioSettings();
  const rulePath = getPersonaRulePath();
  let personaFileExists = false;
  try {
    personaFileExists = fs.existsSync(rulePath);
  } catch {}
  return {
    locale: getLocale(),
    settings,
    appZoomSupported: true,
    personaFileExists,
    personaFilePath: rulePath,
    patchMeta: getPatchMeta(),
    quotaSummary: buildQuotaSummary(activeChatKey || lastActiveChatKey),
  };
}

function resolveSafeMediaFile(rawUrl) {
  if (typeof rawUrl !== "string") return null;
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if ((parsed.protocol !== "agy-media:" && parsed.protocol !== "rudex-media:") || parsed.hostname !== "local") return null;
  let decoded = "";
  try {
    decoded = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
  if (!decoded || decoded.includes("/") || decoded.includes("\\") || decoded.includes("..")) return null;
  if (!SAFE_MEDIA_FILE_RE.test(decoded)) return null;
  const ext = path.extname(decoded).toLowerCase();
  const mime = STUDIO_MEDIA_MIMES[ext];
  if (!mime) return null;
  const mediaDir = path.resolve(getStudioMediaDir());
  const fullPath = path.resolve(mediaDir, decoded);
  if (!fullPath.startsWith(mediaDir + path.sep)) return null;
  try {
    const st = fs.statSync(fullPath);
    if (!st.isFile()) return null;
    return { fileName: decoded, fullPath, mime, size: st.size };
  } catch {
    return null;
  }
}

function fileSliceToWebStream(fullPath, start, end) {
  const CHUNK_SIZE = 64 * 1024;
  let fh = null;
  let pos = Math.max(0, start);
  const limit = end;

  async function closeHandle() {
    if (fh) {
      const ref = fh;
      fh = null;
      try { await ref.close(); } catch {}
    }
  }

  return new ReadableStream({
    async start() {
      fh = await fs.promises.open(fullPath, "r");
    },
    async pull(controller) {
      try {
        if (!fh || pos > limit) {
          await closeHandle();
          controller.close();
          return;
        }
        const toRead = Math.min(CHUNK_SIZE, limit - pos + 1);
        const buf = Buffer.allocUnsafe(toRead);
        const res = await fh.read(buf, 0, toRead, pos);
        if (!res || res.bytesRead <= 0) {
          await closeHandle();
          controller.close();
          return;
        }
        pos += res.bytesRead;
        controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, res.bytesRead));
        if (pos > limit) {
          await closeHandle();
          controller.close();
        }
      } catch (err) {
        await closeHandle();
        controller.error(err);
      }
    },
    async cancel() {
      await closeHandle();
    },
  });
}

function handleStudioMediaProtocolRequest(request) {
  const method = request && request.method ? String(request.method).toUpperCase() : "GET";
  if (method !== "GET" && method !== "HEAD") {
    return new Response(null, { status: 405 });
  }
  const resolved = resolveSafeMediaFile(request ? request.url : "");
  if (!resolved) {
    return new Response(null, { status: 404 });
  }
  const { fullPath, mime, size } = resolved;
  const baseHeaders = {
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-cache",
  };
  const rangeHeader = request.headers && typeof request.headers.get === "function" ? request.headers.get("range") : null;
  if (rangeHeader && size > 0) {
    const m = /^bytes=(\d*)-(\d*)$/i.exec(String(rangeHeader).trim());
    if (m) {
      let start = m[1] ? parseInt(m[1], 10) : 0;
      let end = m[2] ? parseInt(m[2], 10) : size - 1;
      if (!m[1] && m[2]) {
        const suffix = parseInt(m[2], 10);
        start = Math.max(0, size - suffix);
        end = size - 1;
      }
      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || start > end) {
        return new Response(null, { status: 416, headers: Object.assign({}, baseHeaders, { "Content-Range": "bytes */" + size }) });
      }
      end = Math.min(size - 1, end);
      const len = end - start + 1;
      const rangeHeaders = Object.assign({}, baseHeaders, {
        "Content-Range": "bytes " + start + "-" + end + "/" + size,
        "Content-Length": String(len),
      });
      return new Response(method === "HEAD" ? null : fileSliceToWebStream(fullPath, start, end), {
        status: 206,
        headers: rangeHeaders,
      });
    }
  }
  const fullHeaders = Object.assign({}, baseHeaders, { "Content-Length": String(size) });
  if (method === "HEAD") {
    return new Response(null, { status: 200, headers: fullHeaders });
  }
  if (size === 0) {
    return new Response(Buffer.alloc(0), { status: 200, headers: fullHeaders });
  }
  return new Response(fileSliceToWebStream(fullPath, 0, size - 1), {
    status: 200,
    headers: fullHeaders,
  });
}

function registerStudioMediaProtocol() {
  if (mediaProtocolRegistered) return;
  if (!protocol || typeof protocol.handle !== "function") return;
  mediaProtocolRegistered = true;
  protocol.handle("agy-media", handleStudioMediaProtocolRequest);
}

function getFocusedOrFirstWindow() {
  try {
    if (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function") {
      const fw = BrowserWindow.getFocusedWindow();
      if (fw) return fw;
    }
    if (BrowserWindow && typeof BrowserWindow.getAllWindows === "function") {
      const list = BrowserWindow.getAllWindows();
      if (list && list.length > 0) return list[0];
    }
  } catch {}
  return undefined;
}

function loadZipBuilderModule() {
  const candidates = [
    path.join(__dirname, "i18nData", "zip-builder.js"),
    path.join(__dirname, "zip-builder.js"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return require(p);
    }
  }
  throw new Error("zip-builder.js module not found");
}

function loadUpdaterCore() {
  const candidates = [
    path.join(__dirname, "i18nData", "updater-core.js"),
    path.join(__dirname, "updater-core.js"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return require(p);
    }
  }
  throw new Error("updater-core.js module not found");
}

let thinkingTranslatorInstance = null;
function loadThinkingTranslator() {
  if (thinkingTranslatorInstance) return thinkingTranslatorInstance;
  const candidates = [
    path.join(__dirname, "i18nData", "thinking-translator.js"),
    path.join(__dirname, "thinking-translator.js"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const mod = require(p);
      thinkingTranslatorInstance = mod.createThinkingTranslator();
      return thinkingTranslatorInstance;
    }
  }
  throw new Error("thinking-translator.js module not found");
}

function getUpdateStateCachePath() {
  return path.join(app.getPath("userData"), "agy_studio_update_state.json");
}

function loadUpdateCache() {
  try {
    const p = getUpdateStateCachePath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      if (parsed && typeof parsed === "object") {
        return {
          etag: typeof parsed.etag === "string" ? parsed.etag : "",
          lastCheckedAt: toNonNegInt(parsed.lastCheckedAt),
          dismissedKey: typeof parsed.dismissedKey === "string" ? parsed.dismissedKey : "",
          dismissedUntil: toNonNegInt(parsed.dismissedUntil),
          lastKnownRemote: parsed.lastKnownRemote && typeof parsed.lastKnownRemote === "object" ? parsed.lastKnownRemote : null,
        };
      }
    }
  } catch {}
  return { etag: "", lastCheckedAt: 0, dismissedKey: "", dismissedUntil: 0, lastKnownRemote: null };
}

function saveUpdateCache(cache) {
  try {
    writeJsonAtomic(getUpdateStateCachePath(), cache);
  } catch (err) {
    console.warn("[Rudex] Failed to persist update cache:", err && err.message ? err.message : err);
  }
}

function getInstalledRudexMeta() {
  const patchMeta = getPatchMeta() || {};
  let installMeta = {};
  let pluginJson = {};
  const rudexDir = path.join(getPluginsBaseDir(), "rudex");
  try {
    const mp = path.join(rudexDir, ".rudex-install-meta.json");
    if (fs.existsSync(mp)) installMeta = JSON.parse(fs.readFileSync(mp, "utf8")) || {};
  } catch {}
  try {
    const pp = path.join(rudexDir, "plugin.json");
    if (fs.existsSync(pp)) pluginJson = JSON.parse(fs.readFileSync(pp, "utf8")) || {};
  } catch {}

  const version = String(installMeta.version || pluginJson.version || patchMeta.version || "4.4.0");
  const commitSha = String(installMeta.commitSha || patchMeta.commitSha || "");
  const commitShort = String(installMeta.commitShort || patchMeta.commitShort || (commitSha ? commitSha.slice(0, 7) : ""));
  const commitDate = String(installMeta.commitDate || patchMeta.commitDate || "");
  const patchedAt = String(installMeta.installedAt || patchMeta.patchedAt || "");
  return { version, commitSha, commitShort, commitDate, patchedAt };
}

function seedUpdateStateFromCacheIfNeeded() {
  if (updateStatusState.installed && (updateStatusState.lastCheckedAt > 0 || updateStatusState.remote)) return;
  const installed = getInstalledRudexMeta();
  updateStatusState.installed = installed;
  const cache = loadUpdateCache();
  if (cache.lastKnownRemote && updateStatusState.status === "idle") {
    try {
      const updaterCore = loadUpdaterCore();
      const avail = updaterCore.evaluateUpdateAvailability(installed, cache.lastKnownRemote);
      updateStatusState.lastCheckedAt = cache.lastCheckedAt || 0;
      updateStatusState.remote = cache.lastKnownRemote;
      updateStatusState.updateKey = avail.updateKey || "";
      updateStatusState.reason = avail.reason || "";
      updateStatusState.available = Boolean(avail.available);
      updateStatusState.status = avail.available ? "available" : "up-to-date";
    } catch {}
  }
}

function getPublicUpdateState() {
  seedUpdateStateFromCacheIfNeeded();
  const freshInstalled = getInstalledRudexMeta();
  const prevInst = updateStatusState.installed || {};
  if (
    freshInstalled.version !== prevInst.version ||
    freshInstalled.commitSha !== prevInst.commitSha
  ) {
    updateStatusState.installed = freshInstalled;
    if (updateStatusState.remote) {
      try {
        const updaterCore = loadUpdaterCore();
        const avail = updaterCore.evaluateUpdateAvailability(freshInstalled, updateStatusState.remote);
        updateStatusState.updateKey = avail.updateKey || "";
        updateStatusState.reason = avail.reason || "";
        updateStatusState.available = Boolean(avail.available);
        if (!["checking", "downloading", "extracting", "installing", "restarting"].includes(updateStatusState.status)) {
          updateStatusState.status = avail.available ? "available" : "up-to-date";
        }
      } catch {}
    }
  }
  const cache = loadUpdateCache();
  const busy = ["downloading", "extracting", "installing", "restarting"].includes(updateStatusState.status);
  const dismissed =
    !busy &&
    Boolean(cache.dismissedKey && cache.dismissedKey === updateStatusState.updateKey && Date.now() < (cache.dismissedUntil || 0));
  return {
    status: updateStatusState.status,
    available: Boolean(updateStatusState.available),
    dismissed,
    reason: updateStatusState.reason || "",
    updateKey: updateStatusState.updateKey || "",
    lastCheckedAt: updateStatusState.lastCheckedAt || 0,
    error: updateStatusState.error || "",
    installed: updateStatusState.installed || getInstalledRudexMeta(),
    remote: updateStatusState.remote || null,
  };
}

function broadcastUpdateStatus() {
  const snapshot = getPublicUpdateState();
  try {
    for (const wc of webContents.getAllWebContents()) {
      if (wc && !wc.isDestroyed()) {
        wc.send("agy-studio:update-status", snapshot);
      }
    }
  } catch {}
}

function runUpdateCheck(opts = {}) {
  const force = Boolean(opts && opts.force);
  if (updateInstallInflight) return Promise.resolve(getPublicUpdateState());
  if (updateCheckInflight) return updateCheckInflight;

  const installed = getInstalledRudexMeta();
  updateStatusState.installed = installed;
  if (force) {
    updateStatusState.status = "checking";
    updateStatusState.error = "";
    broadcastUpdateStatus();
  }

  updateCheckInflight = (async () => {
    try {
      const updaterCore = loadUpdaterCore();
      const cache = loadUpdateCache();
      const res = await updaterCore.checkRemoteRelease({
        prevEtag: cache.etag,
        prevRemote: cache.lastKnownRemote,
        bypassCache: force,
      });
      if (!res || !res.ok || !res.remote) {
        const errMsg = (res && res.error) || "Update check failed";
        if (force) {
          updateStatusState.status = "error";
          updateStatusState.error = errMsg;
          broadcastUpdateStatus();
        }
        return getPublicUpdateState();
      }

      const avail = updaterCore.evaluateUpdateAvailability(installed, res.remote);
      const now = Date.now();
      cache.etag = res.etag || cache.etag || "";
      cache.lastCheckedAt = now;
      cache.lastKnownRemote = res.remote;
      if (force && avail.available) {
        cache.dismissedKey = "";
        cache.dismissedUntil = 0;
      }
      saveUpdateCache(cache);

      updateStatusState = {
        status: avail.available ? "available" : "up-to-date",
        available: Boolean(avail.available),
        reason: avail.reason || "",
        updateKey: avail.updateKey || "",
        lastCheckedAt: now,
        error: "",
        installed,
        remote: res.remote,
      };
      broadcastUpdateStatus();
      return getPublicUpdateState();
    } catch (err) {
      if (force) {
        updateStatusState.status = "error";
        updateStatusState.error = err && err.message ? err.message : "Update check failed";
        broadcastUpdateStatus();
      }
      return getPublicUpdateState();
    } finally {
      updateCheckInflight = null;
    }
  })();

  return updateCheckInflight;
}

function startPeriodicUpdateChecks() {
  if (updateBootTimer) {
    try { clearTimeout(updateBootTimer); } catch {}
    updateBootTimer = null;
  }
  if (updateIntervalTimer) {
    try { clearInterval(updateIntervalTimer); } catch {}
    updateIntervalTimer = null;
  }
  let intervalMs = 30 * 60 * 1000;
  try {
    const core = loadUpdaterCore();
    if (core && typeof core.DEFAULT_CHECK_INTERVAL_MS === "number") {
      intervalMs = core.DEFAULT_CHECK_INTERVAL_MS;
    }
  } catch {}

  updateBootTimer = setTimeout(() => {
    updateBootTimer = null;
    try {
      if (loadStudioSettings().autoCheckUpdates !== false) {
        runUpdateCheck({ force: false });
      }
    } catch {}
  }, 20000);
  if (updateBootTimer && typeof updateBootTimer.unref === "function") updateBootTimer.unref();

  updateIntervalTimer = setInterval(() => {
    try {
      if (loadStudioSettings().autoCheckUpdates !== false) {
        runUpdateCheck({ force: false });
      }
    } catch {}
  }, intervalMs);
  if (updateIntervalTimer && typeof updateIntervalTimer.unref === "function") updateIntervalTimer.unref();
}

function writePostAppUpdateWatcherScript(opts = {}) {
  if (process.platform !== "win32") return "";
  const resDir = opts.resDir || process.resourcesPath || path.resolve(__dirname, "..", "..");
  const exePath = opts.exePath || process.execPath || "";
  const installJs = opts.installJs || path.join(getPluginsBaseDir(), "rudex", "skills", "rudex", "scripts", "install.js");
  if (!resDir || !exePath || !installJs) return "";
  const ts = Date.now();
  const outPath = opts.outPath || path.join(os.tmpdir(), `rudex-post-app-update-${ts}.cmd`);
  const logPath = path.join(os.tmpdir(), `rudex-post-app-update-${ts}.log`);
  // IMPORTANT: Never use cmd `timeout` in detached stdio:"ignore" scripts on Windows
  // because `timeout` exits immediately with "Input redirection is not supported". Use `ping` instead.
  const lines = [
    "@echo off",
    "chcp 65001 >nul",
    `set "RES_DIR=${resDir}"`,
    `set "AGY_EXE=${exePath}"`,
    `set "INSTALL_JS=${installJs}"`,
    `set "LOG_FILE=${logPath}"`,
    "setlocal EnableDelayedExpansion",
    "for /L %%I in (1,1,180) do (",
    "  ping -n 3 127.0.0.1 >nul",
    '  if exist "!RES_DIR!\\app.asar" goto repatch',
    ")",
    "goto done",
    ":repatch",
    "ping -n 4 127.0.0.1 >nul",
    'if not exist "!RES_DIR!\\app.asar" goto done',
    'if not exist "!INSTALL_JS!" goto done',
    'if not exist "!AGY_EXE!" goto done',
    'set "ELECTRON_RUN_AS_NODE=1"',
    '"!AGY_EXE!" "!INSTALL_JS!" --no-sync-plugin > "!LOG_FILE!" 2>&1',
    'set "ACT_PATH="',
    'if exist "!LOG_FILE!" (',
    '  for /f "tokens=1,* delims==" %%A in (\'findstr /B /C:"ACTIVATOR_PATH=" "!LOG_FILE!"\') do set "ACT_PATH=%%B"',
    '  del /F /Q "!LOG_FILE!" >nul 2>&1',
    ")",
    'if defined ACT_PATH if exist "!ACT_PATH!" (',
    '  call "!ACT_PATH!"',
    ")",
    ":done",
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

function schedulePostAppUpdateRepatch() {
  if (postAppUpdateScheduled || process.platform !== "win32" || globalThis.__RUDEX_DISABLED__) return false;
  const installJs = path.join(getPluginsBaseDir(), "rudex", "skills", "rudex", "scripts", "install.js");
  if (!fs.existsSync(installJs)) return false;
  const scriptPath = writePostAppUpdateWatcherScript({ installJs });
  if (!scriptPath || !fs.existsSync(scriptPath)) return false;
  postAppUpdateScheduled = true;
  try {
    const child = spawn("cmd.exe", ["/c", `"${scriptPath}"`], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      windowsVerbatimArguments: true,
    });
    if (child && typeof child.unref === "function") child.unref();
    return true;
  } catch (_e) {
    postAppUpdateScheduled = false;
    return false;
  }
}

function makeSafeExportFilename(title, chatKey) {
  const raw = (title || chatKey || "chat").trim();
  const clean = raw
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 48);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = "" + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  return "Rudex-" + (clean || "chat") + "-" + stamp + ".zip";
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

function toggleLiveEditFromHotkey(contents) {
  const now = Date.now();
  if (now - lastLiveEditHotkeyAt < 180) return;
  lastLiveEditHotkeyAt = now;
  try {
    if (contents && !contents.isDestroyed()) {
      contents.send("agy-studio:toggle-live-edit");
    }
  } catch {}
}

function getLiveEditsDir() {
  return path.join(app.getPath("userData"), "studio_live_edits");
}

function getLiveEditsQueueDir() {
  return path.join(getLiveEditsDir(), "queue");
}

function getLiveEditsDeliveredDir() {
  return path.join(getLiveEditsDir(), "delivered");
}

function getLiveEditsExpiredDir() {
  return path.join(getLiveEditsDir(), "expired");
}

function getLiveEditsFlagPath() {
  return path.join(getLiveEditsDir(), "pending.flag");
}

function getLiveEditsMediaDir() {
  return path.join(getLiveEditsDir(), "media");
}

function syncLiveEditsPendingFlag(hasPending) {
  const flagPath = getLiveEditsFlagPath();
  try {
    if (hasPending) {
      fs.mkdirSync(path.dirname(flagPath), { recursive: true });
      fs.writeFileSync(flagPath, String(Date.now()), "utf8");
    } else if (fs.existsSync(flagPath)) {
      fs.unlinkSync(flagPath);
    }
  } catch {}
}

function migrateLegacyLiveEditsInbox() {
  const legacyPath = path.join(getLiveEditsDir(), "inbox.json");
  if (!fs.existsSync(legacyPath)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
    const items = parsed && Array.isArray(parsed.items) ? parsed.items : [];
    const now = Date.now();
    for (const it of items.slice(-40)) {
      if (!it || typeof it !== "object" || typeof it.id !== "string") continue;
      const safeId = it.id.replace(/[^a-zA-Z0-9._-]/g, "");
      if (!safeId) continue;
      const fileName = safeId + ".json";
      if (it.status === "pending" && now - (Number(it.createdAt) || 0) < LIVE_EDIT_MAX_AGE_MS) {
        writeJsonAtomic(path.join(getLiveEditsQueueDir(), fileName), it);
      } else {
        const dest = it.status === "expired" ? getLiveEditsExpiredDir() : getLiveEditsDeliveredDir();
        writeJsonAtomic(path.join(dest, fileName), Object.assign({}, it, { status: it.status === "pending" ? "expired" : (it.status || "delivered") }));
      }
    }
    fs.unlinkSync(legacyPath);
  } catch {}
}

function readLiveEditDir(dirPath) {
  const out = [];
  if (!fs.existsSync(dirPath)) return out;
  try {
    const files = fs.readdirSync(dirPath).filter((n) => n.endsWith(".json") && !n.includes(".tmp-") && !n.includes(".claim-"));
    for (const f of files) {
      try {
        const full = path.join(dirPath, f);
        const obj = JSON.parse(fs.readFileSync(full, "utf8"));
        if (obj && typeof obj === "object" && typeof obj.id === "string") {
          out.push({ fileName: f, fullPath: full, item: obj });
        }
      } catch {}
    }
  } catch {}
  return out;
}

function pruneUnreferencedLiveEditMedia(items) {
  const mediaDir = getLiveEditsMediaDir();
  if (!fs.existsSync(mediaDir)) return;
  const used = new Set();
  for (const it of items) {
    const imgs = it && Array.isArray(it.images) ? it.images : [];
    for (const im of imgs) {
      if (im && typeof im.path === "string" && im.path) used.add(path.resolve(im.path).toLowerCase());
    }
  }
  try {
    for (const ent of fs.readdirSync(mediaDir, { withFileTypes: true })) {
      if (!ent.isFile()) continue;
      const full = path.resolve(mediaDir, ent.name);
      if (!used.has(full.toLowerCase())) {
        try { fs.unlinkSync(full); } catch {}
      }
    }
  } catch {}
}

function loadAllLiveEdits() {
  migrateLegacyLiveEditsInbox();
  const queueDir = getLiveEditsQueueDir();
  const deliveredDir = getLiveEditsDeliveredDir();
  const expiredDir = getLiveEditsExpiredDir();
  const now = Date.now();

  const queueEntries = readLiveEditDir(queueDir);
  const pendingItems = [];
  const expiredMoved = [];

  for (const ent of queueEntries) {
    const it = ent.item;
    const age = now - (Number(it.createdAt) || 0);
    const isUnpromoted = !it.chatKey || it.chatKey === "__new__" || String(it.chatKey).startsWith("chat-");
    if (age > LIVE_EDIT_MAX_AGE_MS || (it.fallbackAny === true && isUnpromoted && age > LIVE_EDIT_FALLBACK_MAX_AGE_MS)) {
      const nextIt = Object.assign({}, it, { status: "expired", expiredAt: now });
      try {
        writeJsonAtomic(path.join(expiredDir, ent.fileName), nextIt);
        fs.unlinkSync(ent.fullPath);
        expiredMoved.push(nextIt);
      } catch {}
    } else {
      pendingItems.push(Object.assign({}, it, { status: "pending" }));
    }
  }

  const deliveredEntries = readLiveEditDir(deliveredDir);
  const expiredEntries = readLiveEditDir(expiredDir);
  const archive = deliveredEntries.concat(expiredEntries);
  archive.sort((a, b) => (a.item.createdAt || 0) - (b.item.createdAt || 0));
  if (archive.length > 40) {
    const toRemove = archive.slice(0, archive.length - 40);
    for (const rem of toRemove) {
      try { fs.unlinkSync(rem.fullPath); } catch {}
    }
  }
  const keptArchive = archive.slice(-40).map((e) => e.item);
  const all = pendingItems.concat(keptArchive, expiredMoved.filter((x) => !keptArchive.some((k) => k.id === x.id)));
  all.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  syncLiveEditsPendingFlag(pendingItems.length > 0);
  if (pendingItems.length === 0) {
    stopLiveEditWatchers();
  }
  return { items: all.slice(-40), hasPending: pendingItems.length > 0 };
}

function filterLiveEditsForChat(items, chatKey) {
  const norm = normalizeChatKey(chatKey);
  const all = Array.isArray(items) ? items : [];
  if (!norm || norm === "__new__") {
    return all.filter((x) => x && (x.chatKey === "__new__" || x.fallbackAny)).slice(-20);
  }
  return all.filter((x) => {
    if (!x) return false;
    const xk = normalizeChatKey(x.chatKey);
    const dk = normalizeChatKey(x.deliveredConversationId);
    return xk === norm || dk === norm || (x.fallbackAny && x.status === "pending");
  }).slice(-20);
}

function broadcastLiveEditsChanged(items) {
  const list = Array.isArray(items) ? items.slice(-30) : [];
  const sig = list.map((x) => `${x.id}:${x.status}:${x.deliveredAt || 0}`).join("|");
  if (sig === liveEditLastBroadcastSig) return;
  liveEditLastBroadcastSig = sig;
  const payload = { items: list };
  try {
    for (const wc of webContents.getAllWebContents()) {
      if (wc && !wc.isDestroyed()) {
        wc.send("agy-studio:live-edits-changed", payload);
      }
    }
  } catch {}
}

function stopLiveEditWatchers() {
  if (liveEditDebounceTimer) {
    clearTimeout(liveEditDebounceTimer);
    liveEditDebounceTimer = null;
  }
  if (queueWatcher) {
    try { queueWatcher.close(); } catch {}
    queueWatcher = null;
  }
  if (deliveredWatcher) {
    try { deliveredWatcher.close(); } catch {}
    deliveredWatcher = null;
  }
}

function ensureLiveEditWatcher() {
  const queueDir = getLiveEditsQueueDir();
  const deliveredDir = getLiveEditsDeliveredDir();
  fs.mkdirSync(queueDir, { recursive: true });
  fs.mkdirSync(deliveredDir, { recursive: true });

  const scheduleSync = () => {
    if (liveEditDebounceTimer) clearTimeout(liveEditDebounceTimer);
    liveEditDebounceTimer = setTimeout(() => {
      liveEditDebounceTimer = null;
      const { items } = loadAllLiveEdits();
      broadcastLiveEditsChanged(items);
    }, 150);
  };

  if (!queueWatcher) {
    try {
      queueWatcher = fs.watch(queueDir, () => scheduleSync());
      queueWatcher.on("error", () => {});
    } catch {}
  }
  if (!deliveredWatcher) {
    try {
      deliveredWatcher = fs.watch(deliveredDir, () => scheduleSync());
      deliveredWatcher.on("error", () => {});
    } catch {}
  }
}

function promotePendingLiveEditsChatKey(oldKeys, newUuid) {
  if (!UUID_EXACT_RE.test(newUuid)) return;
  const queueDir = getLiveEditsQueueDir();
  const entries = readLiveEditDir(queueDir);
  const oldSet = new Set(oldKeys.filter(Boolean).map((k) => normalizeChatKey(k)));
  let updated = false;
  for (const ent of entries) {
    const it = ent.item;
    if (it.status !== "pending") continue;
    const xk = normalizeChatKey(it.chatKey);
    if (oldSet.has(xk) || it.fallbackAny === true) {
      const nextIt = Object.assign({}, it, { chatKey: newUuid, fallbackAny: false });
      try {
        writeJsonAtomic(ent.fullPath, nextIt);
        updated = true;
      } catch {}
    }
  }
  if (updated) {
    const { items } = loadAllLiveEdits();
    broadcastLiveEditsChanged(items);
  }
}

function saveLiveEditImagePayload(imgObj, idx) {
  if (!imgObj || typeof imgObj !== "object") return null;
  const maxBytes = 15 * 1024 * 1024;
  const mediaDir = getLiveEditsMediaDir();
  fs.mkdirSync(mediaDir, { recursive: true });
  const extFromMime = (mime) => {
    const m = String(mime || "").toLowerCase();
    if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
    if (m.includes("webp")) return ".webp";
    if (m.includes("gif")) return ".gif";
    return ".png";
  };

  if (typeof imgObj.sourcePath === "string" && imgObj.sourcePath.trim()) {
    const src = path.resolve(imgObj.sourcePath.trim());
    if (!allowedLiveEditSourcePaths.has(src)) return null;
    if (!fs.existsSync(src)) return null;
    const ext = path.extname(src).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return null;
    const st = fs.statSync(src);
    if (!st.isFile() || st.size <= 0 || st.size > maxBytes) return null;
    const destName = "le-" + Date.now() + "-" + idx + ext;
    const destPath = path.join(mediaDir, destName);
    fs.copyFileSync(src, destPath);
    return {
      name: typeof imgObj.name === "string" && imgObj.name ? imgObj.name.slice(0, 64) : path.basename(src),
      mime: STUDIO_MEDIA_MIMES[ext] || "image/png",
      path: destPath,
      sizeBytes: st.size,
    };
  }

  if (typeof imgObj.dataUrl === "string" && imgObj.dataUrl.startsWith("data:image/")) {
    const commaIdx = imgObj.dataUrl.indexOf(",");
    if (commaIdx <= 0) return null;
    const header = imgObj.dataUrl.slice(0, commaIdx);
    const b64 = imgObj.dataUrl.slice(commaIdx + 1);
    const mimeMatch = /^data:(image\/[a-z0-9+.-]+);base64$/i.exec(header);
    if (!mimeMatch) return null;
    const buf = Buffer.from(b64, "base64");
    if (!buf || buf.length === 0 || buf.length > maxBytes) return null;
    const mime = mimeMatch[1].toLowerCase();
    const ext = extFromMime(mime);
    const destName = "le-" + Date.now() + "-" + idx + ext;
    const destPath = path.join(mediaDir, destName);
    fs.writeFileSync(destPath, buf);
    return {
      name: typeof imgObj.name === "string" && imgObj.name ? imgObj.name.slice(0, 64) : ("screenshot" + ext),
      mime,
      path: destPath,
      sizeBytes: buf.length,
    };
  }
  return null;
}

function normalizeUiPunct(str) {
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\s+/g, " ")
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
    console.warn("[Rudex] Failed to load UI translation data:", err && err.message ? err.message : err);
  }
  uiMaps = { exactMap, punctMap, lowerMap, applyDynamicRules };
  return uiMaps;
}

function translateUiString(raw) {
  if (!isRu() || typeof raw !== "string" || !raw) return raw;
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
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
  if (globalThis.__RUDEX_DISABLED__) return "en";
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
    writeJsonAtomic(getStorePath(), { locale });
  } catch (err) {
    console.warn("[Rudex] Failed to persist locale:", err && err.message ? err.message : err);
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
  if (globalThis.__RUDEX_DISABLED__) return false;
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
  if (globalThis.__RUDEX_DISABLED__) {
    ipcMain.on("agy-i18n:get-locale-sync", (event) => {
      event.returnValue = "__disabled__";
    });
    return;
  }
  if (!fs.existsSync(getStorePath())) {
    saveLocale(getLocale());
  }
  try {
    registerStudioMediaProtocol();
  } catch (err) {
    console.warn("[Rudex] Failed to register agy-media protocol:", err && err.message ? err.message : err);
  }
  console.log("[Rudex] Active localization loaded (locale=" + getLocale() + ", store=" + getStorePath() + ")");
  syncPersonaActiveFlag(loadStudioChatsStore());
  const bootThinkingRu = Boolean(loadStudioSettings().thinkingInRussian);
  syncThinkingRuFlag(bootThinkingRu, { boot: true });
  if (bootThinkingRu && !fs.existsSync(getPersonaRulePath())) {
    resyncActiveChatRuleFile();
  }
  const bootSettings = loadStudioSettings();
  const bootAppScale = bootSettings.studioUi.appScale;
  if (bootSettings.appearance && bootSettings.appearance.presetId !== "native") {
    applyThemeCurtainToWindows(bootSettings.appearance);
  }
  if (bootAppScale !== 100) {
    applyAppScaleToWindows(bootAppScale);
    setTimeout(() => {
      try {
        const cur = loadStudioSettings().studioUi.appScale;
        if (cur !== 100) applyAppScaleToWindows(cur);
      } catch {}
    }, 1200);
  }
  if (!zoomHookRegistered && app && typeof app.on === "function") {
    zoomHookRegistered = true;
    app.on("browser-window-created", (_ev, win) => {
      try {
        if (!win || win.__isWebviewPopupWindow || !win.webContents) return;
        const applyCur = () => {
          try {
            if (win.__isWebviewPopupWindow) return;
            const curS = loadStudioSettings();
            if (curS.studioUi.appScale !== 100) applyAppScaleToWindows(curS.studioUi.appScale, win.webContents);
            if (curS.appearance && curS.appearance.presetId !== "native") applyThemeCurtainToWindows(curS.appearance);
          } catch {}
        };
        win.webContents.on("dom-ready", applyCur);
        win.webContents.on("did-finish-load", applyCur);
      } catch {}
    });
  }
  const bootLe = loadAllLiveEdits();
  if (bootLe.hasPending) ensureLiveEditWatcher();
  startPeriodicUpdateChecks();

  ipcMain.on("agy-i18n:get-locale-sync", (event) => {
    event.returnValue = getLocale();
  });
  ipcMain.handle("agy-i18n:get-locale", () => getLocale());
  ipcMain.handle("agy-i18n:set-locale", (_event, next) => setLocale(next));
  ipcMain.handle("agy-i18n:toggle-locale", () => toggleLocale());
  ipcMain.handle("agy-studio:get-state", (_event, payload) => {
    const key = payload && payload.chatKey ? normalizeChatKey(payload.chatKey) : lastActiveChatKey;
    return getStudioState(key);
  });
  ipcMain.handle("agy-studio:save-settings", (_event, patch) => {
    saveStudioSettings(patch);
    const state = getStudioState(lastActiveChatKey);
    broadcastStudioSettings(state);
    return state;
  });
  ipcMain.handle("agy-studio:activate-chat", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    lastActiveChatKey = key;
    const titleStr = typeof p.title === "string" ? p.title.trim().slice(0, 80) : "";
    const store = loadStudioChatsStore();
    if (key === "__new__") {
      const dp = p.draftPersona && typeof p.draftPersona === "object" ? p.draftPersona : null;
      const rec = dp && dp.personaEnabled && typeof dp.personaText === "string" && dp.personaText.trim()
        ? sanitizeChatRecord({
            personaEnabled: true,
            personaActivePreset: typeof dp.personaActivePreset === "string" ? dp.personaActivePreset : "custom",
            personaText: dp.personaText,
            personaStrict: dp.personaStrict !== false,
          })
        : defaultChatRecord("");
      store.pendingNewChatPersona = rec.personaEnabled && rec.personaText.trim()
        ? {
            enabled: true,
            text: rec.personaText.trim(),
            activePreset: rec.personaActivePreset || "custom",
            strict: rec.personaStrict !== false,
            updatedAt: Date.now(),
            claimedBy: "",
          }
        : null;
      store.activeAgentsMdChatKey = rec.personaEnabled && rec.personaText.trim() ? "__new__" : "";
      saveStudioChatsStore(store);
      const syncRes = syncPersonaRuleFile(Boolean(rec.personaEnabled), rec.personaText || "", rec.personaStrict !== false);
      return { ok: true, chatKey: "__new__", chat: rec, personaFileExists: syncRes.exists, personaFilePath: syncRes.rulePath, quotaSummary: buildQuotaSummary("__new__") };
    }
    const chats = store.chats;
    let changed = false;
    const migrateKey = normalizeChatKey(p.migrateFromKey);
    const fb = p.fallbackPersona && typeof p.fallbackPersona === "object" ? p.fallbackPersona : null;
    if (!chats[key] && migrateKey !== "__new__" && migrateKey !== key && migrateKey.startsWith("chat-") && chats[migrateKey]) {
      chats[key] = sanitizeChatRecord(Object.assign({}, chats[migrateKey], {
        title: titleStr || chats[migrateKey].title || "",
        updatedAt: Date.now(),
      }));
      delete chats[migrateKey];
      changed = true;
    } else if (!chats[key] && p.promoteFromNew && typeof p.promoteFromNew === "object") {
      const promo = p.promoteFromNew;
      chats[key] = sanitizeChatRecord(Object.assign({}, promo, {
        title: titleStr || (typeof promo.title === "string" ? promo.title : ""),
        updatedAt: Date.now(),
      }));
      changed = true;
    } else if (!chats[key] && fb && fb.personaEnabled && typeof fb.personaText === "string" && fb.personaText.trim()) {
      chats[key] = sanitizeChatRecord({
        title: titleStr,
        updatedAt: Date.now(),
        personaEnabled: true,
        personaActivePreset: typeof fb.personaActivePreset === "string" ? fb.personaActivePreset : "custom",
        personaText: fb.personaText,
        personaStrict: fb.personaStrict !== false,
      });
      changed = true;
    } else if (chats[key] && fb && fb.personaEnabled && typeof fb.personaText === "string" && fb.personaText.trim() && !chats[key].personaEnabled) {
      chats[key] = sanitizeChatRecord(Object.assign({}, chats[key], {
        title: titleStr || chats[key].title || "",
        updatedAt: Date.now(),
        personaEnabled: true,
        personaActivePreset: typeof fb.personaActivePreset === "string" ? fb.personaActivePreset : (chats[key].personaActivePreset || "custom"),
        personaText: fb.personaText,
        personaStrict: fb.personaStrict !== false,
      }));
      changed = true;
    } else if (chats[key] && titleStr && !chats[key].title) {
      chats[key].title = titleStr;
      changed = true;
    }
    if (UUID_EXACT_RE.test(key) && (p.promoteFromNew || (migrateKey && migrateKey !== "__new__"))) {
      promotePendingLiveEditsChatKey([p.promoteFromNew ? "__new__" : "", migrateKey], key);
    }
    const rec = chats[key] ? sanitizeChatRecord(chats[key]) : defaultChatRecord(titleStr);
    const nextOwner = rec.personaEnabled && rec.personaText.trim() ? key : "";
    if (store.activeAgentsMdChatKey !== nextOwner) {
      store.activeAgentsMdChatKey = nextOwner;
      changed = true;
    }
    if (changed) saveStudioChatsStore(store);
    const syncRes = syncPersonaRuleFile(Boolean(rec.personaEnabled), rec.personaText || "", rec.personaStrict !== false);
    return { ok: true, chatKey: key, chat: rec, personaFileExists: syncRes.exists, personaFilePath: syncRes.rulePath, quotaSummary: buildQuotaSummary(key) };
  });
  ipcMain.handle("agy-studio:save-persona", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    lastActiveChatKey = key;
    const titleStr = typeof p.title === "string" ? p.title.trim().slice(0, 80) : "";
    const enabled = Boolean(p.personaEnabled);
    const text = typeof p.personaText === "string" ? p.personaText : "";
    const strictMode = p.strict !== false;
    const presetId = typeof p.personaActivePreset === "string" && p.personaActivePreset ? p.personaActivePreset : "custom";
    if (Array.isArray(p.customPresets)) {
      saveStudioSettings({ customPresets: p.customPresets });
    }
    const syncRes = syncPersonaRuleFile(enabled, text, strictMode);
    if (!syncRes.ok) {
      return { ok: false, error: syncRes.error || "SAVE_FAILED", byteLength: syncRes.byteLength, exists: syncRes.exists, rulePath: syncRes.rulePath, state: getStudioState(key) };
    }
    const activeEnabled = enabled && syncRes.exists;
    const store = loadStudioChatsStore();
    let chatRec = null;
    if (key !== "__new__") {
      const prev = store.chats[key] ? sanitizeChatRecord(store.chats[key]) : defaultChatRecord(titleStr);
      store.chats[key] = sanitizeChatRecord(Object.assign({}, prev, {
        title: titleStr || prev.title || "",
        updatedAt: Date.now(),
        personaEnabled: activeEnabled,
        personaActivePreset: presetId,
        personaText: text,
        personaStrict: strictMode,
      }));
      chatRec = store.chats[key];
    } else {
      store.pendingNewChatPersona = activeEnabled && text.trim()
        ? {
            enabled: true,
            text: text.trim(),
            activePreset: presetId,
            strict: strictMode,
            updatedAt: Date.now(),
            claimedBy: "",
          }
        : null;
      chatRec = sanitizeChatRecord({
        personaEnabled: activeEnabled,
        personaActivePreset: presetId,
        personaText: text,
        personaStrict: strictMode,
      });
    }
    store.activeAgentsMdChatKey = activeEnabled && text.trim() ? key : "";
    saveStudioChatsStore(store);
    const state = getStudioState(key);
    broadcastStudioSettings(state);
    return { ok: true, exists: syncRes.exists, byteLength: syncRes.byteLength, rulePath: syncRes.rulePath, chatKey: key, chat: chatRec, state };
  });
  ipcMain.handle("agy-studio:save-chat-telemetry", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    if (key === "__new__") return { ok: true, skipped: true };
    const titleStr = typeof p.title === "string" ? p.title.trim().slice(0, 80) : "";
    const chats = loadStudioChats();
    const prev = chats[key] ? sanitizeChatRecord(chats[key]) : defaultChatRecord(titleStr);
    chats[key] = sanitizeChatRecord(Object.assign({}, prev, {
      title: titleStr || prev.title || "",
      updatedAt: Date.now(),
      telemetry: sanitizeChatTelemetry(p.telemetry),
    }));
    saveStudioChats(chats);
    return { ok: true, chatKey: key, chat: chats[key] };
  });
  ipcMain.handle("agy-studio:reset-chat-telemetry", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    if (key !== "__new__") {
      const chats = loadStudioChats();
      if (chats[key]) {
        chats[key] = sanitizeChatRecord(Object.assign({}, chats[key], {
          updatedAt: Date.now(),
          telemetry: defaultChatTelemetry(),
        }));
        saveStudioChats(chats);
      }
    }
    return { ok: true, chatKey: key };
  });
  ipcMain.handle("agy-studio:get-turn-metrics", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    return readLatestTurnMetrics(p.chatKey);
  });
  ipcMain.handle("agy-studio:pick-media", async (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const kind = p.kind === "video" ? "video" : "image";
    const allowedExts = kind === "video" ? [".mp4", ".webm"] : [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];
    const maxBytes = kind === "video" ? 250 * 1024 * 1024 : 35 * 1024 * 1024;
    if (!dialog || typeof dialog.showOpenDialog !== "function") {
      return { ok: false, error: "DIALOG_UNAVAILABLE" };
    }
    const parentWin = getFocusedOrFirstWindow();
    const res = await dialog.showOpenDialog(parentWin, {
      title: kind === "video" ? tr("Выберите видео-обои (MP4 / WebM)", "Select video wallpaper (MP4 / WebM)") : tr("Выберите изображение для обоев", "Select wallpaper image"),
      properties: ["openFile"],
      filters: [
        kind === "video"
          ? { name: "Video (MP4, WebM)", extensions: ["mp4", "webm"] }
          : { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "avif"] },
      ],
    });
    if (!res || res.canceled || !Array.isArray(res.filePaths) || !res.filePaths[0]) {
      return { ok: false, canceled: true };
    }
    const srcPath = res.filePaths[0];
    const ext = path.extname(srcPath).toLowerCase();
    if (allowedExts.indexOf(ext) === -1) {
      return { ok: false, error: "UNSUPPORTED_FORMAT" };
    }
    let st;
    try {
      st = await fs.promises.stat(srcPath);
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "STAT_FAILED" };
    }
    if (!st.isFile() || st.size <= 0 || st.size > maxBytes) {
      return { ok: false, error: "FILE_TOO_LARGE" };
    }
    const mediaDir = getStudioMediaDir();
    await fs.promises.mkdir(mediaDir, { recursive: true });
    const rawStem = path.basename(srcPath, ext).replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^_+|_+$/g, "").slice(0, 36) || "media";
    const destName = kind + "-" + Date.now() + "-" + rawStem + ext;
    const destPath = path.join(mediaDir, destName);
    await fs.promises.copyFile(srcPath, destPath);
    return {
      ok: true,
      kind,
      fileName: destName,
      mediaUrl: "agy-media://local/" + encodeURIComponent(destName),
      mime: STUDIO_MEDIA_MIMES[ext] || "application/octet-stream",
      sizeBytes: st.size,
    };
  });
  ipcMain.handle("agy-studio:list-media", () => {
    const mediaDir = getStudioMediaDir();
    if (!fs.existsSync(mediaDir)) return { ok: true, items: [] };
    const items = [];
    try {
      for (const ent of fs.readdirSync(mediaDir, { withFileTypes: true })) {
        if (!ent.isFile() || !SAFE_MEDIA_FILE_RE.test(ent.name)) continue;
        const ext = path.extname(ent.name).toLowerCase();
        const mime = STUDIO_MEDIA_MIMES[ext];
        if (!mime) continue;
        const st = fs.statSync(path.join(mediaDir, ent.name));
        items.push({
          fileName: ent.name,
          mediaUrl: "agy-media://local/" + encodeURIComponent(ent.name),
          mime,
          kind: mime.startsWith("video/") ? "video" : "image",
          sizeBytes: st.size,
        });
      }
    } catch {}
    return { ok: true, items };
  });
  ipcMain.handle("agy-studio:read-media", async (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const targetUrl = typeof p.mediaUrl === "string" && p.mediaUrl.trim()
      ? p.mediaUrl.trim()
      : (typeof p.fileName === "string" && p.fileName.trim() ? "agy-media://local/" + encodeURIComponent(p.fileName.trim()) : "");
    const resolved = resolveSafeMediaFile(targetUrl);
    if (!resolved) {
      return { ok: false, error: "MEDIA_NOT_FOUND" };
    }
    if (resolved.size > 64 * 1024 * 1024) {
      return { ok: false, fallbackToScheme: true, size: resolved.size };
    }
    try {
      const buf = await fs.promises.readFile(resolved.fullPath);
      return {
        ok: true,
        fileName: resolved.fileName,
        mime: resolved.mime,
        size: resolved.size,
        bytes: new Uint8Array(buf),
      };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "READ_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:delete-media", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const name = typeof p.fileName === "string" ? path.basename(p.fileName.trim()) : "";
    if (!name || !SAFE_MEDIA_FILE_RE.test(name)) {
      return { ok: false, error: "INVALID_FILENAME" };
    }
    const s = loadStudioSettings();
    const profs = Array.isArray(s.appearanceProfiles) ? s.appearanceProfiles : [];
    const usedInProfile = profs.some((pr) => pr && pr.appearance && pr.appearance.wallpaper && pr.appearance.wallpaper.mediaFile === name);
    if (usedInProfile) {
      return { ok: true, keptForProfile: true };
    }
    const mediaDir = path.resolve(getStudioMediaDir());
    const target = path.resolve(mediaDir, name);
    if (!target.startsWith(mediaDir + path.sep)) {
      return { ok: false, error: "INVALID_PATH" };
    }
    try {
      if (fs.existsSync(target)) fs.unlinkSync(target);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "DELETE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:export-chat-zip", async (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    const chats = loadStudioChats();
    const rec = key !== "__new__" && chats[key] ? sanitizeChatRecord(chats[key]) : defaultChatRecord(p.title || "");
    const titleStr = typeof p.title === "string" && p.title.trim() ? p.title.trim().slice(0, 80) : rec.title;
    const downloadsDir = app.getPath("downloads") || path.join(os.homedir(), "Downloads");
    const defaultName = makeSafeExportFilename(titleStr, key);
    let outPath = path.join(downloadsDir, defaultName);

    if (p.choosePath && dialog && typeof dialog.showSaveDialog !== "function") {
      return { ok: false, error: "DIALOG_UNAVAILABLE" };
    }
    if (p.choosePath && dialog && typeof dialog.showSaveDialog === "function") {
      const parentWin = getFocusedOrFirstWindow();
      const saveRes = await dialog.showSaveDialog(parentWin, {
        title: tr("Сохранить контекст чата (ZIP)", "Export chat context (ZIP)"),
        defaultPath: outPath,
        filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
      });
      if (!saveRes || saveRes.canceled || !saveRes.filePath) {
        return { ok: false, canceled: true };
      }
      outPath = saveRes.filePath.toLowerCase().endsWith(".zip") ? saveRes.filePath : saveRes.filePath + ".zip";
    }

    try {
      const zipBuilder = loadZipBuilderModule();
      const meta = getPatchMeta();
      const brainBaseDir = path.join(os.homedir(), ".gemini", "antigravity", "brain");
      const res = await zipBuilder.buildChatExportArchive({
        chatKey: key === "__new__" ? "" : key,
        title: titleStr,
        modelName: typeof p.modelName === "string" ? p.modelName : "",
        brainBaseDir,
        chatRecord: rec,
        quotaSummary: buildQuotaSummary(key),
        domMessages: Array.isArray(p.domMessages) ? p.domMessages : [],
        includeAttachments: p.includeAttachments !== false,
        includeArtifacts: p.includeArtifacts !== false,
        includePersona: p.includePersona !== false,
        includeThinking: Boolean(p.includeThinking),
        includeFullLog: Boolean(p.includeFullLog),
        locale: getLocale(),
        pluginVersion: (meta && (meta.version || meta.pluginVersion)) || "4.4.2",
        outPath,
      });
      return res;
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "EXPORT_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:reveal-file", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const fp = typeof p.filePath === "string" ? p.filePath.trim() : "";
    if (!fp || !fp.toLowerCase().endsWith(".zip") || !fs.existsSync(fp)) {
      return { ok: false, error: "FILE_NOT_FOUND" };
    }
    try {
      if (shell && typeof shell.showItemInFolder === "function") {
        shell.showItemInFolder(fp);
        return { ok: true };
      }
      return { ok: false, error: "SHELL_UNAVAILABLE" };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "REVEAL_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:record-quota-turn", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    lastActiveChatKey = key;
    if (key === "__new__") {
      return { ok: true, skipped: true, summary: buildQuotaSummary("__new__") };
    }
    const modelName = typeof p.modelName === "string" ? p.modelName.trim().slice(0, 96) : "";
    const titleStr = typeof p.title === "string" ? p.title.trim().slice(0, 80) : "";
    const outputTok = toNonNegInt(p.outputTokens);
    const contextTok = toNonNegInt(p.contextTokens);
    const famId = classifyModelFamily(modelName);
    const weight = getModelQuotaWeight(modelName);
    const wt = Math.max(100, Math.round((Math.max(20, outputTok) + 4500 + contextTok * 0.25) * weight));
    const now = Date.now();

    const store = loadQuotaStore();
    const famState = store.families[famId];
    const inc5h = wt / Math.max(5000, famState.tokensPer1Pct5h);
    const incWeek = wt / Math.max(20000, famState.tokensPer1PctWeekly);

    const chats = loadStudioChats();
    const prev = chats[key] ? sanitizeChatRecord(chats[key]) : defaultChatRecord(titleStr);
    const fq = Object.assign({}, prev.quota[famId]);
    fq.turns = (fq.turns || 0) + 1;
    fq.weightedTokens = (fq.weightedTokens || 0) + wt;
    fq.estFiveHourPct = toQuotaPct((fq.estFiveHourPct || 0) + inc5h);
    fq.estWeeklyPct = toQuotaPct((fq.estWeeklyPct || 0) + incWeek);
    if (modelName) fq.lastModel = modelName;
    fq.lastTurnAt = now;
    const recent = Array.isArray(fq.recentTurns)
      ? fq.recentTurns.filter((r) => r && now - r.ts <= FIVE_HOUR_MS)
      : [];
    recent.push({ ts: now, wt, est5h: toQuotaPct(inc5h) });
    fq.recentTurns = recent.slice(-40);

    prev.quota[famId] = fq;
    chats[key] = sanitizeChatRecord(Object.assign({}, prev, {
      title: titleStr || prev.title || "",
      updatedAt: now,
    }));
    saveStudioChats(chats);

    famState.pending5hByChat[key] = (famState.pending5hByChat[key] || 0) + wt;
    famState.pendingWeeklyByChat[key] = (famState.pendingWeeklyByChat[key] || 0) + wt;
    saveQuotaStore(store);

    return { ok: true, chatKey: key, chatQuota: chats[key].quota, summary: buildQuotaSummary(key, true) };
  });
  ipcMain.handle("agy-studio:sync-quota-snapshot", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const activeKey = normalizeChatKey(p.activeChatKey || lastActiveChatKey);
    const store = loadQuotaStore();
    const chats = loadStudioChats();
    let chatsDirty = false;
    const now = Date.now();

    for (const famId of ["gemini", "claudeGpt"]) {
      const snapFam = p[famId];
      if (!snapFam || typeof snapFam !== "object") continue;
      const famState = store.families[famId];
      const next5h = toNullableRemPct(snapFam.fiveHourRem);
      const nextWeek = toNullableRemPct(snapFam.weeklyRem);

      if (next5h !== null) {
        if (famState.fiveHourRem !== null && next5h < famState.fiveHourRem) {
          const drop5h = Math.round((famState.fiveHourRem - next5h) * 100) / 100;
          const res5h = applyQuotaDropForWindow(famId, drop5h, famState.pending5hByChat, chats, activeKey, false);
          if (res5h.distributed && res5h.totalPending > 0 && drop5h >= 0.5) {
            const observedRate = res5h.totalPending / Math.max(0.2, drop5h);
            famState.tokensPer1Pct5h = Math.round(clampNum(famState.tokensPer1Pct5h * 0.65 + observedRate * 0.35, 5000, 1000000, famState.tokensPer1Pct5h));
            famState.calibrated = true;
          }
          famState.pending5hByChat = {};
          chatsDirty = true;
        } else if (famState.fiveHourRem !== null && next5h > famState.fiveHourRem + 1) {
          famState.pending5hByChat = {};
          for (const k of Object.keys(chats)) {
            if (chats[k] && chats[k].quota && chats[k].quota[famId] && chats[k].quota[famId].observedFiveHourPct > 0) {
              chats[k].quota[famId].observedFiveHourPct = 0;
              chatsDirty = true;
            }
          }
        }
        famState.fiveHourRem = next5h;
      }

      if (nextWeek !== null) {
        if (famState.weeklyRem !== null && nextWeek < famState.weeklyRem) {
          const dropWeek = Math.round((famState.weeklyRem - nextWeek) * 100) / 100;
          const resW = applyQuotaDropForWindow(famId, dropWeek, famState.pendingWeeklyByChat, chats, activeKey, true);
          if (resW.distributed && resW.totalPending > 0 && dropWeek >= 0.5) {
            const observedRateW = resW.totalPending / Math.max(0.2, dropWeek);
            famState.tokensPer1PctWeekly = Math.round(clampNum(famState.tokensPer1PctWeekly * 0.65 + observedRateW * 0.35, 20000, 5000000, famState.tokensPer1PctWeekly));
            famState.calibrated = true;
          }
          famState.pendingWeeklyByChat = {};
          chatsDirty = true;
        } else if (famState.weeklyRem !== null && nextWeek > famState.weeklyRem + 1) {
          famState.pendingWeeklyByChat = {};
          for (const k of Object.keys(chats)) {
            if (chats[k] && chats[k].quota && chats[k].quota[famId] && chats[k].quota[famId].observedWeeklyPct > 0) {
              chats[k].quota[famId].observedWeeklyPct = 0;
              chatsDirty = true;
            }
          }
        }
        famState.weeklyRem = nextWeek;
      }

      if (typeof snapFam.fiveHourReset === "string" && snapFam.fiveHourReset.trim()) {
        famState.fiveHourReset = snapFam.fiveHourReset.trim().slice(0, 80);
      } else if (next5h === 100) {
        famState.fiveHourReset = "";
      }
      if (typeof snapFam.weeklyReset === "string" && snapFam.weeklyReset.trim()) {
        famState.weeklyReset = snapFam.weeklyReset.trim().slice(0, 80);
      } else if (nextWeek === 100) {
        famState.weeklyReset = "";
      }
      famState.updatedAt = now;
    }

    if (chatsDirty) saveStudioChats(chats);
    saveQuotaStore(store);
    return { ok: true, summary: buildQuotaSummary(activeKey, true) };
  });
  ipcMain.handle("agy-studio:get-quota-summary", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    return buildQuotaSummary(p.chatKey || lastActiveChatKey);
  });
  ipcMain.handle("agy-studio:reset-quota-stats", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const store = loadQuotaStore();
    const resetAt = Date.now();
    store.resetAt = resetAt;
    store.families.gemini.resetAt = resetAt;
    store.families.gemini.pending5hByChat = {};
    store.families.gemini.pendingWeeklyByChat = {};
    store.families.claudeGpt.resetAt = resetAt;
    store.families.claudeGpt.pending5hByChat = {};
    store.families.claudeGpt.pendingWeeklyByChat = {};
    saveQuotaStore(store);
    const chats = loadStudioChats();
    for (const k of Object.keys(chats)) {
      chats[k] = sanitizeChatRecord(Object.assign({}, chats[k], { quota: defaultChatQuota() }));
    }
    saveStudioChats(chats);
    return { ok: true, summary: buildQuotaSummary(p.chatKey || lastActiveChatKey, true) };
  });
  ipcMain.handle("agy-studio:get-live-edits", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const { items } = loadAllLiveEdits();
    const key = normalizeChatKey(p.chatKey);
    return {
      ok: true,
      chatKey: key,
      items: filterLiveEditsForChat(items, key),
      allItems: items.slice(-30),
    };
  });
  ipcMain.handle("agy-studio:send-live-edit", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    const text = typeof p.text === "string" ? p.text.trim().slice(0, 8000) : "";
    const rawImgs = Array.isArray(p.images) ? p.images.slice(0, 4) : [];
    const savedImgs = [];
    for (let i = 0; i < rawImgs.length; i += 1) {
      const saved = saveLiveEditImagePayload(rawImgs[i], i);
      if (saved) savedImgs.push(saved);
    }
    if (!text && savedImgs.length === 0) {
      return { ok: false, error: "EMPTY_LIVE_EDIT" };
    }
    const now = Date.now();
    const editId = "le-" + now + "-" + Math.random().toString(36).slice(2, 7);
    const entry = {
      id: editId,
      chatKey: key,
      title: typeof p.title === "string" ? p.title.trim().slice(0, 80) : "",
      text,
      images: savedImgs,
      status: "pending",
      fallbackAny: Boolean(p.fallbackAny || key === "__new__" || key.startsWith("chat-")),
      createdAt: now,
      deliveredAt: 0,
      deliveredConversationId: "",
    };
    const queueDir = getLiveEditsQueueDir();
    fs.mkdirSync(queueDir, { recursive: true });
    writeJsonAtomic(path.join(queueDir, editId + ".json"), entry);
    syncLiveEditsPendingFlag(true);
    ensureLiveEditWatcher();
    const { items } = loadAllLiveEdits();
    broadcastLiveEditsChanged(items);
    return {
      ok: true,
      entry,
      items: filterLiveEditsForChat(items, key),
      allItems: items.slice(-30),
    };
  });
  ipcMain.handle("agy-studio:pick-live-edit-images", async () => {
    if (!dialog || typeof dialog.showOpenDialog !== "function") {
      return { ok: false, error: "DIALOG_UNAVAILABLE" };
    }
    const parentWin = getFocusedOrFirstWindow();
    const res = await dialog.showOpenDialog(parentWin, {
      title: tr("Выберите фото для дополнения", "Select images for supplement"),
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif"] }],
    });
    if (!res || res.canceled || !Array.isArray(res.filePaths) || res.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const items = [];
    for (let i = 0; i < Math.min(res.filePaths.length, 4); i += 1) {
      const fp = path.resolve(res.filePaths[i]);
      try {
        const ext = path.extname(fp).toLowerCase();
        const st = fs.statSync(fp);
        if (!st.isFile() || st.size <= 0 || st.size > 15 * 1024 * 1024) continue;
        allowedLiveEditSourcePaths.add(fp);
        if (allowedLiveEditSourcePaths.size > 60) {
          const oldest = allowedLiveEditSourcePaths.values().next().value;
          allowedLiveEditSourcePaths.delete(oldest);
        }
        const mime = STUDIO_MEDIA_MIMES[ext] || "image/png";
        let previewDataUrl = "";
        if (st.size <= 4 * 1024 * 1024) {
          previewDataUrl = "data:" + mime + ";base64," + fs.readFileSync(fp).toString("base64");
        }
        items.push({
          name: path.basename(fp),
          sourcePath: fp,
          mime,
          sizeBytes: st.size,
          previewDataUrl,
        });
      } catch {}
    }
    return { ok: items.length > 0, items };
  });
  ipcMain.handle("agy-studio:clear-live-edits", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    const clearAll = p.all === true || !p.chatKey;
    const dirs = [getLiveEditsQueueDir(), getLiveEditsDeliveredDir(), getLiveEditsExpiredDir()];
    for (const dir of dirs) {
      const ents = readLiveEditDir(dir);
      for (const ent of ents) {
        const x = ent.item;
        const xk = normalizeChatKey(x.chatKey);
        const dk = normalizeChatKey(x.deliveredConversationId);
        const matchChat = xk === key || dk === key || (x.fallbackAny && x.status === "pending");
        if (clearAll || matchChat) {
          try { fs.unlinkSync(ent.fullPath); } catch {}
        }
      }
    }
    const { items, hasPending } = loadAllLiveEdits();
    syncLiveEditsPendingFlag(hasPending);
    pruneUnreferencedLiveEditMedia(items);
    broadcastLiveEditsChanged(items);
    return { ok: true, items: filterLiveEditsForChat(items, key), allItems: items.slice(-30) };
  });
  ipcMain.handle("agy-studio:get-update-state", () => getPublicUpdateState());
  ipcMain.handle("agy-studio:check-updates", async (_event, payload) => {
    const manual = !payload || payload.manual !== false;
    return runUpdateCheck({ force: manual });
  });
  ipcMain.handle("agy-studio:dismiss-update", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const cur = getPublicUpdateState();
    const key = typeof p.key === "string" && p.key ? p.key : (cur.updateKey || "");
    const cache = loadUpdateCache();
    let snoozeMs = 6 * 60 * 60 * 1000;
    try {
      const core = loadUpdaterCore();
      if (core && typeof core.DEFAULT_SNOOZE_MS === "number") snoozeMs = core.DEFAULT_SNOOZE_MS;
    } catch {}
    if (typeof p.snoozeMs === "number" && Number.isFinite(p.snoozeMs) && p.snoozeMs > 0) {
      snoozeMs = p.snoozeMs;
    }
    cache.dismissedKey = key;
    cache.dismissedUntil = Date.now() + snoozeMs;
    saveUpdateCache(cache);
    broadcastUpdateStatus();
    return getPublicUpdateState();
  });
  ipcMain.handle("agy-studio:install-update", async () => {
    if (updateInstallInflight) return updateInstallInflight;
    updateInstallInflight = (async () => {
      try {
        const updaterCore = loadUpdaterCore();
        const remote = updateStatusState.remote || (loadUpdateCache().lastKnownRemote) || null;
        const res = await updaterCore.installUpdateFromZip({
          remote,
          onProgress: (stage) => {
            updateStatusState.status = stage;
            updateStatusState.error = "";
            broadcastUpdateStatus();
          },
        });
        const cache = loadUpdateCache();
        cache.dismissedKey = "";
        cache.dismissedUntil = 0;
        if (remote) cache.lastKnownRemote = remote;
        saveUpdateCache(cache);

        updateStatusState.status = "restarting";
        updateStatusState.error = "";
        broadcastUpdateStatus();

        if (process.platform === "win32") {
          let cmdPath = "";
          if (res.status === "LOCKED_NEEDS_ACTIVATOR" && res.activatorPath && fs.existsSync(res.activatorPath)) {
            cmdPath = res.activatorPath;
          } else {
            const exePath = res.exePath || process.execPath;
            cmdPath = updaterCore.writeUpdaterRestartScript(exePath);
          }
          if (cmdPath && fs.existsSync(cmdPath)) {
            try {
              const child = spawn("cmd.exe", ["/c", `"${cmdPath}"`], {
                detached: true,
                stdio: "ignore",
                windowsHide: true,
                windowsVerbatimArguments: true,
              });
              if (child && typeof child.unref === "function") child.unref();
            } catch {}
          }
          setTimeout(() => {
            try { app.quit(); } catch { try { app.exit(0); } catch {} }
          }, 350);
        } else {
          setTimeout(() => {
            try {
              app.relaunch();
              app.exit(0);
            } catch {}
          }, 350);
        }

        return { ok: true, state: getPublicUpdateState(), result: res };
      } catch (err) {
        const msg = err && err.message ? err.message : "Failed to install update";
        updateStatusState.status = "error";
        updateStatusState.error = msg;
        broadcastUpdateStatus();
        return { ok: false, error: msg, state: getPublicUpdateState() };
      } finally {
        updateInstallInflight = null;
      }
    })();
    return updateInstallInflight;
  });
  ipcMain.handle("agy-studio:translate-thinking-batch", async (_event, payload) => {
    if (!loadStudioSettings().thinkingInRussian) {
      return { ok: true, disabled: true, translations: {} };
    }
    const p = payload && typeof payload === "object" ? payload : {};
    const rawTexts = Array.isArray(p.texts) ? p.texts : [];
    const safeTexts = [];
    for (let i = 0; i < rawTexts.length && safeTexts.length < 12; i += 1) {
      if (typeof rawTexts[i] === "string" && rawTexts[i].length > 0 && rawTexts[i].length <= 6000) {
        safeTexts.push(rawTexts[i]);
      }
    }
    if (safeTexts.length === 0) {
      return { ok: true, translations: {} };
    }
    try {
      const trInst = loadThinkingTranslator();
      const res = await trInst.translateBatch(safeTexts);
      return { ok: true, translations: (res && res.translations) || {} };
    } catch (err) {
      return {
        ok: false,
        translations: {},
        error: err && err.message ? err.message : "TRANSLATE_FAILED",
      };
    }
  });
}

exports.getLocale = getLocale;
exports.setLocale = setLocale;
exports.toggleLocale = toggleLocale;
exports.toggleLocaleFromHotkey = toggleLocaleFromHotkey;
exports.togglePanelFromHotkey = togglePanelFromHotkey;
exports.toggleLiveEditFromHotkey = toggleLiveEditFromHotkey;
exports.isRu = isRu;
exports.tr = tr;
exports.ruPlural = ruPlural;
exports.onLocaleChange = onLocaleChange;
exports.registerI18nIpc = registerI18nIpc;
exports.registerStudioMediaProtocol = registerStudioMediaProtocol;
exports.handleStudioMediaProtocolRequest = handleStudioMediaProtocolRequest;
exports.translateUiString = translateUiString;
exports.schedulePostAppUpdateRepatch = schedulePostAppUpdateRepatch;
exports.writePostAppUpdateWatcherScript = writePostAppUpdateWatcherScript;
exports.sanitizeStudioUi = sanitizeStudioUi;
exports.applyAppScaleToWindows = applyAppScaleToWindows;
