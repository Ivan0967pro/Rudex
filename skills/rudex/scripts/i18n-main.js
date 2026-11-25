"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, ipcMain, webContents, dialog, shell, protocol, BrowserWindow, clipboard, nativeImage } = require("electron");
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
const VALID_BORDER_PRESETS = new Set(["airy", "crisp", "contrast"]);
const VALID_UI_STYLE_PARTS = new Set(["antigravity", "claude-code", "codex", "opencode"]);
const DEFAULT_UI_STYLE = {
  preset: "antigravity",
  composer: "antigravity",
  chat: "antigravity",
  modelSelector: "antigravity",
  composerRadius: 0,
  composerMaxWidth: 0,
  composerPadY: 0,
  composerShadow: "preset",
  userBubbleAlign: "preset",
  userBubbleMaxWidth: 0,
  chatGap: 0,
  agentAccentBar: "preset",
  modelBtnStyle: "preset",
  modelMenuDensity: "preset",
};
const VALID_UI_FONTS = new Set([
  "system", "custom", "chatgpt-sans", "opencode-mono",
  "claude-sans", "claude-serif", "claude-lora", "claude-mono-ui",
  "geist", "golos", "onest", "manrope", "plus-jakarta",
  "segoe", "inter", "rubik", "nunito", "ibm-plex", "georgia",
]);
const VALID_MONO_FONTS = new Set([
  "system", "custom", "opencode-mono", "claude-mono",
  "geist-mono", "fira", "ibm-plex-mono", "source-code-pro",
  "space-mono", "ubuntu-mono", "cascadia", "jetbrains", "consolas",
]);
const VALID_ANY_SLOT_FONTS = new Set(["inherit", "custom", ...VALID_UI_FONTS, ...VALID_MONO_FONTS]);
const SAFE_FONT_NAME_RE = /[^a-zA-Zа-яА-ЯёЁ0-9 _\-().]/g;
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
  widgetFont: "inherit",
  widgetFontCustom: "",
  widgetFontSize: 12,
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
  borderPreset: "crisp",
  borderStrength: 50,
  highContrastText: true,
  overridesPaused: false,
  elementOverrides: [],
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
    inputFont: "inherit",
    userMsgFont: "inherit",
    agentFont: "inherit",
    thinkingFont: "inherit",
    uiFontCustom: "",
    inputFontCustom: "",
    userMsgFontCustom: "",
    agentFontCustom: "",
    thinkingFontCustom: "",
    monoFontCustom: "",
    fontSize: 14,
    uiFontSize: 0,
    inputFontSize: 0,
    agentFontSize: 0,
    codeFontSize: 0,
    lineHeight: 1.55,
    chatMaxWidth: 0,
    density: "comfortable",
  },
  uiStyle: Object.assign({}, DEFAULT_UI_STYLE),
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

function sanitizeCustomFontName(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(SAFE_FONT_NAME_RE, "").trim().slice(0, 64);
}

function sanitizeElementOverrides(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const hasNum = (v) => v !== "" && v !== null && v !== undefined && Number.isFinite(Number(v));
  for (let i = 0; i < raw.length && out.length < 80; i += 1) {
    const it = raw[i];
    if (!it || typeof it !== "object") continue;
    const selector = typeof it.selector === "string" ? it.selector.trim().slice(0, 260) : "";
    if (!selector || /[{}<>\\]/.test(selector) || /url\s*\(|expression\s*\(|@import/i.test(selector)) continue;
    const st = it.styles && typeof it.styles === "object" ? it.styles : {};
    out.push({
      id: typeof it.id === "string" && it.id ? it.id.slice(0, 64) : "ov-" + i,
      name: typeof it.name === "string" ? it.name.trim().slice(0, 80) : selector.slice(0, 48),
      selector,
      zone: typeof it.zone === "string" ? it.zone.trim().slice(0, 48) : "",
      scope: it.scope === "similar" ? "similar" : "exact",
      enabled: it.enabled !== false,
      styles: {
        fontFamily: typeof st.fontFamily === "string" ? st.fontFamily.trim().slice(0, 64) : "",
        fontFamilyCustom: sanitizeCustomFontName(st.fontFamilyCustom),
        fontSize: hasNum(st.fontSize) && Number(st.fontSize) > 0 ? Math.round(clampNum(st.fontSize, 8, 64, 0)) : 0,
        fontWeight: hasNum(st.fontWeight) && Number(st.fontWeight) > 0 ? Math.round(clampNum(st.fontWeight, 300, 900, 0)) : 0,
        lineHeight: hasNum(st.lineHeight) && Number(st.lineHeight) > 0 ? Math.round(clampNum(st.lineHeight, 1.0, 2.4, 0) * 100) / 100 : 0,
        color: sanitizeHexColor(st.color, ""),
        bgColor: sanitizeHexColor(st.bgColor, ""),
        bgOpacity: hasNum(st.bgOpacity) ? Math.round(clampNum(st.bgOpacity, 0, 100, 100)) : 100,
        opacity: hasNum(st.opacity) && Number(st.opacity) >= 0 ? Math.round(clampNum(st.opacity, 5, 100, -1)) : -1,
        borderColor: sanitizeHexColor(st.borderColor, ""),
        borderWidth: hasNum(st.borderWidth) && Number(st.borderWidth) >= 0 ? Math.round(clampNum(st.borderWidth, 0, 8, -1)) : -1,
        borderRadius: hasNum(st.borderRadius) && Number(st.borderRadius) >= 0 ? Math.round(clampNum(st.borderRadius, 0, 64, -1)) : -1,
        padding: hasNum(st.padding) && Number(st.padding) >= 0 ? Math.round(clampNum(st.padding, 0, 64, -1)) : -1,
        width: hasNum(st.width) && Number(st.width) > 0 ? Math.round(clampNum(st.width, 24, 1800, 0)) : 0,
        minHeight: hasNum(st.minHeight) && Number(st.minHeight) > 0 ? Math.round(clampNum(st.minHeight, 16, 800, 0)) : 0,
        hidden: Boolean(st.hidden),
      },
    });
  }
  return out;
}

function sanitizeCustomLabels(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length && out.length < 120; i += 1) {
    const it = raw[i];
    if (!it || typeof it !== "object") continue;
    const matchType = it.matchType === "testid" || it.matchType === "selector" ? it.matchType : "exact";
    const match = typeof it.match === "string" ? it.match.trim().slice(0, 180) : "";
    const label = typeof it.label === "string" ? it.label.slice(0, 160) : "";
    if (!match || !label.trim()) continue;
    out.push({
      id: typeof it.id === "string" && it.id ? it.id.slice(0, 64) : "lbl-" + i,
      matchType,
      match,
      label,
      enabled: it.enabled !== false,
    });
  }
  return out;
}

function sanitizeUiStyle(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const basePreset = VALID_UI_STYLE_PARTS.has(src.preset) ? src.preset : "antigravity";
  const composer = VALID_UI_STYLE_PARTS.has(src.composer) ? src.composer : basePreset;
  const chat = VALID_UI_STYLE_PARTS.has(src.chat) ? src.chat : basePreset;
  const modelSelector = VALID_UI_STYLE_PARTS.has(src.modelSelector) ? src.modelSelector : basePreset;
  const preset = composer === chat && chat === modelSelector ? composer : "custom";
  const normOptRange = (val, min, max) => {
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(clampNum(n, min, max, 0));
  };
  return {
    preset,
    composer,
    chat,
    modelSelector,
    composerRadius: normOptRange(src.composerRadius, 4, 32),
    composerMaxWidth: normOptRange(src.composerMaxWidth, 560, 1120),
    composerPadY: normOptRange(src.composerPadY, 6, 24),
    composerShadow: src.composerShadow === "none" || src.composerShadow === "soft" || src.composerShadow === "elevated" ? src.composerShadow : "preset",
    userBubbleAlign: src.userBubbleAlign === "right" || src.userBubbleAlign === "left" || src.userBubbleAlign === "full" ? src.userBubbleAlign : "preset",
    userBubbleMaxWidth: normOptRange(src.userBubbleMaxWidth, 45, 100),
    chatGap: normOptRange(src.chatGap, 4, 28),
    agentAccentBar: src.agentAccentBar === "on" || src.agentAccentBar === "off" ? src.agentAccentBar : "preset",
    modelBtnStyle:
      src.modelBtnStyle === "ghost" ||
      src.modelBtnStyle === "pill" ||
      src.modelBtnStyle === "bordered" ||
      src.modelBtnStyle === "mono"
        ? src.modelBtnStyle
        : "preset",
    modelMenuDensity: src.modelMenuDensity === "compact" || src.modelMenuDensity === "comfortable" ? src.modelMenuDensity : "preset",
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
    borderPreset: VALID_BORDER_PRESETS.has(src.borderPreset) ? src.borderPreset : "crisp",
    borderStrength: Math.round(clampNum(src.borderStrength, 0, 100, DEFAULT_APPEARANCE.borderStrength)),
    highContrastText: src.highContrastText !== false,
    overridesPaused: Boolean(src.overridesPaused),
    elementOverrides: sanitizeElementOverrides(src.elementOverrides),
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
      inputFont: VALID_ANY_SLOT_FONTS.has(tySrc.inputFont) ? tySrc.inputFont : "inherit",
      userMsgFont: VALID_ANY_SLOT_FONTS.has(tySrc.userMsgFont) ? tySrc.userMsgFont : "inherit",
      agentFont: VALID_ANY_SLOT_FONTS.has(tySrc.agentFont) ? tySrc.agentFont : "inherit",
      thinkingFont: VALID_ANY_SLOT_FONTS.has(tySrc.thinkingFont) ? tySrc.thinkingFont : "inherit",
      uiFontCustom: sanitizeCustomFontName(tySrc.uiFontCustom),
      inputFontCustom: sanitizeCustomFontName(tySrc.inputFontCustom),
      userMsgFontCustom: sanitizeCustomFontName(tySrc.userMsgFontCustom),
      agentFontCustom: sanitizeCustomFontName(tySrc.agentFontCustom),
      thinkingFontCustom: sanitizeCustomFontName(tySrc.thinkingFontCustom),
      monoFontCustom: sanitizeCustomFontName(tySrc.monoFontCustom),
      fontSize: Math.round(clampNum(tySrc.fontSize, 12, 18, 14)),
      uiFontSize: Number(tySrc.uiFontSize) > 0 ? Math.round(clampNum(tySrc.uiFontSize, 11, 20, 0)) : 0,
      inputFontSize: Number(tySrc.inputFontSize) > 0 ? Math.round(clampNum(tySrc.inputFontSize, 12, 22, 0)) : 0,
      agentFontSize: Number(tySrc.agentFontSize) > 0 ? Math.round(clampNum(tySrc.agentFontSize, 12, 22, 0)) : 0,
      codeFontSize: Number(tySrc.codeFontSize) > 0 ? Math.round(clampNum(tySrc.codeFontSize, 11, 20, 0)) : 0,
      lineHeight,
      chatMaxWidth,
      density: VALID_DENSITIES.has(tySrc.density) ? tySrc.density : "comfortable",
    },
    uiStyle: sanitizeUiStyle(src.uiStyle),
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
    widgetFont: VALID_ANY_SLOT_FONTS.has(src.widgetFont) ? src.widgetFont : DEFAULT_STUDIO_UI.widgetFont,
    widgetFontCustom: sanitizeCustomFontName(src.widgetFontCustom),
    widgetFontSize: Math.round(clampNum(src.widgetFontSize, 10, 18, DEFAULT_STUDIO_UI.widgetFontSize)),
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
  "claude-code-light": "#f5f3ec",
  "claude-terminal": "#141413",
  "liquid-glass": "#080c16",
  "obsidian-glass": "#090a0f",
  "midnight-neon": "#070913",
  "warm-contrast": "#110f0d",
  "light-paper": "#f2f1ec",
  "emerald-void": "#071210",
  "crimson-noir": "#13090d",
  "tokyo-night": "#0b0e18",
  "sakura-dusk": "#140b12",
  "nordic-frost": "#edf2f7",
};

const PRESET_TITLEBAR_CHROME = {
  native: { color: "#0d0d11", symbolColor: "#ececef" },
  "claude-code-dark": { color: "#1a1918", symbolColor: "#faf9f5" },
  "claude-code-light": { color: "#ebe8de", symbolColor: "#1b1a18" },
  "claude-terminal": { color: "#111110", symbolColor: "#eeece2" },
  "liquid-glass": { color: "#0d111d", symbolColor: "#f5f7ff" },
  "obsidian-glass": { color: "#0d0d11", symbolColor: "#f1f2f6" },
  "midnight-neon": { color: "#0b0d1b", symbolColor: "#eef2ff" },
  "warm-contrast": { color: "#161310", symbolColor: "#f5f1ea" },
  "light-paper": { color: "#e8e6df", symbolColor: "#1c1c20" },
  "emerald-void": { color: "#0a1614", symbolColor: "#ecfdf5" },
  "crimson-noir": { color: "#180c11", symbolColor: "#fff1f2" },
  "tokyo-night": { color: "#0e1220", symbolColor: "#e2e8f0" },
  "sakura-dusk": { color: "#190e17", symbolColor: "#fdf2f8" },
  "nordic-frost": { color: "#e2e8f0", symbolColor: "#142033" },
};

function resolveTitleBarChromeForAppearance(appearanceCfg) {
  const appCfg = sanitizeAppearance(appearanceCfg);
  if (appCfg.presetId === "custom") {
    const bg = appCfg.canvasBg || "#09090b";
    const h = bg.slice(1);
    const r = parseInt(h.slice(0, 2), 16) || 0;
    const g = parseInt(h.slice(2, 4), 16) || 0;
    const b = parseInt(h.slice(4, 6), 16) || 0;
    const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 145;
    return { color: bg, symbolColor: isLight ? "#141418" : "#f1f2f6" };
  }
  return PRESET_TITLEBAR_CHROME[appCfg.presetId] || PRESET_TITLEBAR_CHROME.native;
}

function applyThemeCurtainToWindows(appearanceCfg) {
  try {
    const appCfg = sanitizeAppearance(appearanceCfg);
    let bgColor = "";
    if (appCfg.presetId === "custom") {
      bgColor = appCfg.canvasBg;
    } else if (appCfg.presetId && appCfg.presetId !== "native") {
      bgColor = PRESET_CURTAIN_BG[appCfg.presetId] || "";
    }
    const chrome = resolveTitleBarChromeForAppearance(appCfg);
    const utils = require("./utils");
    const wins = utils && typeof utils.getHubWindows === "function"
      ? utils.getHubWindows()
      : (BrowserWindow && typeof BrowserWindow.getAllWindows === "function" ? BrowserWindow.getAllWindows() : []);
    for (const w of wins) {
      if (!w || w.__isWebviewPopupWindow || (typeof w.isDestroyed === "function" && w.isDestroyed())) continue;
      if (bgColor) {
        try {
          if (utils && typeof utils.setHubCurtainColor === "function") utils.setHubCurtainColor(w, bgColor);
        } catch {}
        try {
          if (typeof w.setBackgroundColor === "function") w.setBackgroundColor(bgColor);
        } catch {}
      }
      if (process.platform !== "darwin" && chrome && chrome.color && typeof w.setTitleBarOverlay === "function") {
        try {
          const hasCustomCtrls = Boolean(utils && typeof utils.hasCustomWindowControls === "function" && utils.hasCustomWindowControls(w));
          if (!hasCustomCtrls) {
            w.setTitleBarOverlay({ color: chrome.color, symbolColor: chrome.symbolColor });
          }
        } catch {}
      }
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

function syncThinkingRuFlag(_enabled, _opts = {}) {
  // Agent thinking translation now runs 100% client-side via free DOM translator (0 Antigravity tokens/quota).
  // Clean up legacy hook flag & anchor store if present from older Rudex versions.
  const flagPath = getThinkingRuFlagPath();
  try {
    if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath);
  } catch {}
  try {
    const anchorsPath = path.join(app.getPath("userData"), "studio_thinking_anchors.json");
    if (fs.existsSync(anchorsPath)) fs.unlinkSync(anchorsPath);
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

const DEFAULT_LIMITS_WIDGET = {
  enabled: false,
  onlyLimitsMode: false,
  layout: "bars", // "pill" | "bars" | "card" | "inline-header"
  position: "top-right", // "top-right" | "top-left" | "bottom-right" | "bottom-left" | "sidebar-bottom" | "inline-header" | "floating"
  floatX: null,
  floatY: null,
  pinned: true,
  width: 0, // 0 = auto, or 180..420 px
  fontFamily: "inherit",
  fontFamilyCustom: "",
  fontSize: 12,
  bgColor: "",
  bgOpacity: 90,
  textColor: "",
  borderColor: "",
  borderRadius: 11,
  blur: 14,
  scale: 100,
  trafficLight: true,
  barColor: "",
  families: "both", // "active" | "both" | "gemini" | "claudeGpt"
  show5h: true,
  showWeekly: true,
  showResetTimer: true,
  displayMode: "remaining", // "remaining" | "used"
};

const DEFAULT_KEYBINDINGS = {
  toggleStudio: "Ctrl+Alt+P",
  toggleZenUi: "Ctrl+Alt+H",
  toggleLocale: "Ctrl+Alt+L",
  togglePicker: "Ctrl+Alt+E",
  toggleLimitsWidget: "Ctrl+Alt+Q",
  toggleAgentPopover: "Ctrl+Alt+A",
  cycleAgentPreset: "Ctrl+Alt+Shift+A",
  cycleWallpaper: "Ctrl+Alt+W",
  toggleWallpaper: "Ctrl+Alt+Shift+W",
  cycleTheme: "Ctrl+Alt+T",
  toggleDarkLight: "Ctrl+Alt+D",
  openTabAgent: "",
  openTabDesign: "",
  openTabLimits: "",
  openTabWorkshop: "",
  openAnnotator: "Ctrl+Alt+S",
  emergencyResetOverrides: "Ctrl+Alt+Shift+R",
};

const DEFAULT_LIVE_EDIT_INLINE = {
  enabled: true,
  sendKey: "enter", // "enter" | "ctrl+enter" | "button-only"
  urgentIntercept: false,
  showChatDock: true,
};

const DEFAULT_AGENT_PROFILE = {
  presetId: "default",
  presetLabel: "",
  enabled: false,
  applyToNewChats: false,
  subagents: "auto", // "off" | "auto" | "parallel"
  webSearch: "auto", // "off" | "auto" | "always"
  browser: "auto", // "off" | "auto" | "verify"
  planFirst: "auto", // "skip" | "auto" | "strict"
  autoVerify: false,
  deepMode: false,
  conciseness: "balanced", // "short" | "balanced" | "detailed"
  safetyMode: "normal", // "normal" | "cautious" | "readonly"
  pinnedSkills: [],
  disabledTools: [],
};

const VALID_LIMITS_LAYOUTS = new Set(["pill", "bars", "card", "inline-header"]);
const VALID_LIMITS_POSITIONS = new Set(["top-right", "top-left", "bottom-right", "bottom-left", "inline-header", "floating"]);
const VALID_LIMITS_FAMILIES = new Set(["active", "both", "gemini", "claudeGpt"]);
const VALID_AGENT_SUBAGENTS = new Set(["off", "auto", "parallel"]);
const VALID_AGENT_WEB = new Set(["off", "auto", "always"]);
const VALID_AGENT_BROWSER = new Set(["off", "auto", "verify"]);
const VALID_AGENT_PLAN = new Set(["skip", "auto", "strict"]);
const VALID_AGENT_CONCISE = new Set(["short", "balanced", "detailed"]);
const VALID_AGENT_SAFETY = new Set(["normal", "cautious", "readonly"]);

function sanitizeLimitsWidget(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const rawW = Number(src.width);
  const width = Number.isFinite(rawW) && rawW >= 180 ? Math.round(clampNum(rawW, 180, 420, 0)) : 0;
  return {
    enabled: Boolean(src.enabled),
    onlyLimitsMode: Boolean(src.onlyLimitsMode),
    layout: VALID_LIMITS_LAYOUTS.has(src.layout) ? src.layout : DEFAULT_LIMITS_WIDGET.layout,
    position: VALID_LIMITS_POSITIONS.has(src.position) ? src.position : DEFAULT_LIMITS_WIDGET.position,
    floatX: typeof src.floatX === "number" && Number.isFinite(src.floatX) ? Math.round(src.floatX) : null,
    floatY: typeof src.floatY === "number" && Number.isFinite(src.floatY) ? Math.round(src.floatY) : null,
    pinned: src.pinned !== false,
    width,
    fontFamily: VALID_ANY_SLOT_FONTS.has(src.fontFamily) ? src.fontFamily : "inherit",
    fontFamilyCustom: sanitizeCustomFontName(src.fontFamilyCustom),
    fontSize: Math.round(clampNum(src.fontSize, 10, 22, DEFAULT_LIMITS_WIDGET.fontSize)),
    bgColor: sanitizeHexColor(src.bgColor, ""),
    bgOpacity: Math.round(clampNum(src.bgOpacity, 20, 100, DEFAULT_LIMITS_WIDGET.bgOpacity)),
    textColor: sanitizeHexColor(src.textColor, ""),
    borderColor: sanitizeHexColor(src.borderColor, ""),
    borderRadius: Math.round(clampNum(src.borderRadius, 0, 28, DEFAULT_LIMITS_WIDGET.borderRadius)),
    blur: Math.round(clampNum(src.blur, 0, 32, DEFAULT_LIMITS_WIDGET.blur)),
    scale: Math.round(clampNum(src.scale, 70, 160, DEFAULT_LIMITS_WIDGET.scale)),
    trafficLight: src.trafficLight !== false,
    barColor: sanitizeHexColor(src.barColor, ""),
    families: VALID_LIMITS_FAMILIES.has(src.families) ? src.families : DEFAULT_LIMITS_WIDGET.families,
    show5h: src.show5h !== false,
    showWeekly: src.showWeekly !== false,
    showResetTimer: src.showResetTimer !== false,
    displayMode: src.displayMode === "used" ? "used" : "remaining",
  };
}

function normalizeKeybindingCombo(raw) {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const parts = trimmed.split("+").map((p) => p.trim()).filter(Boolean);
  let ctrl = false;
  let alt = false;
  let shift = false;
  let mainKey = "";
  for (let i = 0; i < parts.length; i += 1) {
    const low = parts[i].toLowerCase();
    if (low === "ctrl" || low === "control" || low === "cmd" || low === "meta" || low === "cmdorctrl") ctrl = true;
    else if (low === "alt" || low === "option") alt = true;
    else if (low === "shift") shift = true;
    else mainKey = parts[i].length === 1 ? parts[i].toUpperCase() : parts[i];
  }
  if (!mainKey) return "";
  const out = [];
  if (ctrl) out.push("Ctrl");
  if (alt) out.push("Alt");
  if (shift) out.push("Shift");
  out.push(mainKey.slice(0, 16));
  return out.join("+");
}

function sanitizeKeybindings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const key of Object.keys(DEFAULT_KEYBINDINGS)) {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      out[key] = normalizeKeybindingCombo(src[key]);
    } else {
      out[key] = DEFAULT_KEYBINDINGS[key];
    }
  }
  return out;
}

function sanitizeLiveEditInline(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const sendKey = src.sendKey === "ctrl+enter" ? "ctrl+enter" : "enter";
  const chatBubbleStyle = src.chatBubbleStyle === "accent" || src.chatBubbleStyle === "subtle" ? src.chatBubbleStyle : "native";
  const chatBubblePos = src.chatBubblePos === "after-agent" ? "after-agent" : "after-user";
  return {
    enabled: src.enabled !== false,
    sendKey,
    urgentIntercept: Boolean(src.urgentIntercept),
    showChatDock: src.showChatDock !== false,
    showInChat: src.showInChat !== false,
    showDeliveredBadge: src.showDeliveredBadge !== false,
    showQueueStrip: Boolean(src.showQueueStrip),
    chatBubbleStyle,
    chatBubblePos,
  };
}

function sanitizeStringList(raw, maxItems, maxLen) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (let i = 0; i < raw.length && out.length < maxItems; i += 1) {
    const s = typeof raw[i] === "string" ? raw[i].trim().slice(0, maxLen) : "";
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function sanitizeAgentProfile(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    presetId: typeof src.presetId === "string" && src.presetId.trim() ? src.presetId.trim().slice(0, 48) : "default",
    presetLabel: typeof src.presetLabel === "string" ? src.presetLabel.trim().slice(0, 64) : "",
    enabled: Boolean(src.enabled),
    applyToNewChats: Boolean(src.applyToNewChats),
    subagents: VALID_AGENT_SUBAGENTS.has(src.subagents) ? src.subagents : "auto",
    webSearch: VALID_AGENT_WEB.has(src.webSearch) ? src.webSearch : "auto",
    browser: VALID_AGENT_BROWSER.has(src.browser) ? src.browser : "auto",
    planFirst: VALID_AGENT_PLAN.has(src.planFirst) ? src.planFirst : "auto",
    autoVerify: Boolean(src.autoVerify),
    deepMode: Boolean(src.deepMode),
    conciseness: VALID_AGENT_CONCISE.has(src.conciseness) ? src.conciseness : "balanced",
    safetyMode: VALID_AGENT_SAFETY.has(src.safetyMode) ? src.safetyMode : "normal",
    pinnedSkills: sanitizeStringList(src.pinnedSkills, 20, 64),
    disabledTools: sanitizeStringList(src.disabledTools, 30, 80),
  };
}

function sanitizeCustomAgentPresets(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length && out.length < 20; i += 1) {
    const it = raw[i];
    if (!it || typeof it !== "object") continue;
    const name = typeof it.name === "string" ? it.name.trim().slice(0, 48) : "";
    if (!name) continue;
    out.push({
      id: typeof it.id === "string" && it.id ? it.id.slice(0, 48) : "ap-" + i,
      name,
      icon: typeof it.icon === "string" ? it.icon.trim().slice(0, 8) : "⚡",
      profile: sanitizeAgentProfile(it.profile),
      personaText: typeof it.personaText === "string" ? truncateUtf8Bytes(it.personaText, MAX_PERSONA_BODY_BYTES) : "",
    });
  }
  return out;
}

function profileHasToolPolicy(prof) {
  if (!prof || !prof.enabled) return false;
  return (
    prof.safetyMode === "readonly" ||
    prof.safetyMode === "cautious" ||
    prof.subagents === "off" ||
    prof.webSearch === "off" ||
    prof.browser === "off" ||
    (Array.isArray(prof.disabledTools) && prof.disabledTools.length > 0)
  );
}

function syncAgentProfileFlags(settingsArg, chatsArg, storeArg) {
  try {
    const userDataDir = app.getPath("userData");
    const agentFlag = path.join(userDataDir, "agy_studio_agent_profile.flag");
    const policyFlag = path.join(userDataDir, "agy_studio_tool_policy.flag");
    const s = settingsArg || loadStudioSettings();
    const store = storeArg || loadStudioChatsStore();
    const chats = chatsArg || (store && store.chats) || {};
    const defProf = s && s.agentProfileDefault ? s.agentProfileDefault : null;
    let needAgent = Boolean(defProf && defProf.enabled && defProf.applyToNewChats);
    let needPolicy = Boolean(defProf && defProf.applyToNewChats && profileHasToolPolicy(defProf));
    const pendingAp = store && store.pendingNewChatAgentProfile && store.pendingNewChatAgentProfile.profile
      ? store.pendingNewChatAgentProfile.profile
      : null;
    if (pendingAp && pendingAp.enabled) {
      needAgent = true;
      if (profileHasToolPolicy(pendingAp)) needPolicy = true;
    }
    if (chats && typeof chats === "object") {
      for (const k of Object.keys(chats)) {
        const c = chats[k];
        const ap = c && c.agentProfile ? c.agentProfile : null;
        if (ap && ap.enabled) {
          needAgent = true;
          if (profileHasToolPolicy(ap)) needPolicy = true;
        }
      }
    }
    if (needAgent) writeFileAtomic(agentFlag, "1\n");
    else if (fs.existsSync(agentFlag)) try { fs.unlinkSync(agentFlag); } catch {}
    if (needPolicy) writeFileAtomic(policyFlag, "1\n");
    else if (fs.existsSync(policyFlag)) try { fs.unlinkSync(policyFlag); } catch {}
  } catch {}
}

let cachedWorkshopMod = null;
function loadWorkshopMod() {
  if (cachedWorkshopMod) return cachedWorkshopMod;
  const candidates = [
    path.join(__dirname, "i18nData", "agy-workshop.js"),
    path.join(__dirname, "agy-workshop.js"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        cachedWorkshopMod = require(p);
        return cachedWorkshopMod;
      }
    } catch {}
  }
  return null;
}

function sanitizeStudioSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const rawDock = src.dockPosition;
  const dockAlias = rawDock === "top" ? "top-right" : rawDock === "middle" ? "middle-right" : rawDock === "bottom" ? "bottom-right" : rawDock;
  const validDock = dockAlias === "bottom-right" || dockAlias === "top-right" || dockAlias === "top-left" || dockAlias === "middle-right" || dockAlias === "bottom-left" || dockAlias === "inline-header" || dockAlias === "hidden" ? dockAlias : "bottom-right";
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
    pinned: src.pinned !== false,
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
    thinkingInRussian: src.thinkingInRussian !== false,
    composerDraftsEnabled: src.composerDraftsEnabled !== false,
    inputHistoryEnabled: src.inputHistoryEnabled !== false,
    autoCheckUpdates: src.autoCheckUpdates !== false,
    customPresets: presets,
    appearance: sanitizeAppearance(src.appearance),
    appearanceProfiles: sanitizeAppearanceProfiles(src.appearanceProfiles),
    greeting: sanitizeGreeting(src.greeting),
    studioUi: sanitizeStudioUi(src.studioUi),
    customLabels: sanitizeCustomLabels(src.customLabels),
    limitsWidget: sanitizeLimitsWidget(src.limitsWidget),
    keybindings: sanitizeKeybindings(src.keybindings),
    zenMode: Boolean(src.zenMode),
    liveEditInline: sanitizeLiveEditInline(src.liveEditInline),
    agentProfileDefault: sanitizeAgentProfile(src.agentProfileDefault),
    customAgentPresets: sanitizeCustomAgentPresets(src.customAgentPresets),
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
  if (pObj.limitsWidget && typeof pObj.limitsWidget === "object") {
    pObj.limitsWidget = Object.assign({}, current.limitsWidget || DEFAULT_LIMITS_WIDGET, pObj.limitsWidget);
  }
  if (pObj.keybindings && typeof pObj.keybindings === "object") {
    pObj.keybindings = Object.assign({}, current.keybindings || DEFAULT_KEYBINDINGS, pObj.keybindings);
  }
  if (pObj.liveEditInline && typeof pObj.liveEditInline === "object") {
    pObj.liveEditInline = Object.assign({}, current.liveEditInline || DEFAULT_LIVE_EDIT_INLINE, pObj.liveEditInline);
  }
  if (pObj.agentProfileDefault && typeof pObj.agentProfileDefault === "object") {
    pObj.agentProfileDefault = Object.assign({}, current.agentProfileDefault || DEFAULT_AGENT_PROFILE, pObj.agentProfileDefault);
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
  if (pObj.agentProfileDefault) {
    syncAgentProfileFlags(next, loadStudioChats());
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
    agentProfile: src.agentProfile && typeof src.agentProfile === "object" ? sanitizeAgentProfile(src.agentProfile) : null,
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
      const rawPendingAp = parsed && parsed.pendingNewChatAgentProfile && typeof parsed.pendingNewChatAgentProfile === "object"
        ? parsed.pendingNewChatAgentProfile
        : null;
      const pendingNewChatAgentProfile = rawPendingAp && rawPendingAp.profile && typeof rawPendingAp.profile === "object" && rawPendingAp.profile.enabled
        ? {
            profile: sanitizeAgentProfile(rawPendingAp.profile),
            updatedAt: toNonNegInt(rawPendingAp.updatedAt),
            claimedBy: typeof rawPendingAp.claimedBy === "string" ? rawPendingAp.claimedBy : "",
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
        pendingNewChatAgentProfile,
        activeAgentsMdChatKey,
      };
      return studioChatsCache;
    }
  } catch {}
  studioChatsCache = {
    version: 1,
    chats: {},
    pendingNewChatPersona: null,
    pendingNewChatAgentProfile: null,
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
    pendingNewChatAgentProfile: s.pendingNewChatAgentProfile || null,
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

function formatPersonaRuleContent(trimmed, usePlugin, strictMode) {
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
  if (!trimmed) {
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
  const content = formatPersonaRuleContent(trimmed, usePlugin, strictMode !== false);
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
    tokensPer1Pct5h: isClaude ? 45000 : 60000,
    tokensPer1PctWeekly: isClaude ? 200000 : 260000,
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
    tokensPer1Pct5h: Number.isFinite(t5) && t5 >= 20000 && t5 <= 1500000 ? Math.round(t5) : def.tokensPer1Pct5h,
    tokensPer1PctWeekly: Number.isFinite(tw) && tw >= 80000 && tw <= 6000000 ? Math.round(tw) : def.tokensPer1PctWeekly,
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
    // Scan full file up to 16MB (skipping non-PLANNER_RESPONSE lines without JSON.parse for ~3-5ms speed)
    // so long coding sessions NEVER drop pre-snapshot calibration history!
    const FULL_CAP = 16 * 1024 * 1024;
    let rawText = "";
    if (size <= FULL_CAP) {
      rawText = fs.readFileSync(lp, "utf8");
    } else {
      const fd = fs.openSync(lp, "r");
      try {
        const headBuf = Buffer.alloc(32 * 1024);
        const hRead = fs.readSync(fd, headBuf, 0, headBuf.length, 0);
        const headLines = headBuf.slice(0, hRead).toString("utf8").split(/\r?\n/);
        for (let hi = 0; hi < headLines.length; hi += 1) {
          const hl = headLines[hi];
          if (!hl || hl.indexOf('"USER_INPUT"') === -1) continue;
          try {
            const ho = JSON.parse(hl);
            if (ho && ho.type === "USER_INPUT" && typeof ho.content === "string") {
              const cleanU = ho.content.replace(/\s+/g, " ").trim();
              if (cleanU && !cleanU.startsWith("<")) { titleGuess = cleanU.slice(0, 60); break; }
            }
          } catch {}
        }
        const tailBuf = Buffer.alloc(FULL_CAP);
        const tRead = fs.readSync(fd, tailBuf, 0, FULL_CAP, Math.max(0, size - FULL_CAP));
        rawText = tailBuf.slice(0, tRead).toString("utf8");
        const firstNl = rawText.indexOf("\n");
        if (firstNl !== -1) rawText = rawText.slice(firstNl + 1);
      } finally {
        fs.closeSync(fd);
      }
    }
    const lines = rawText.split(/\r?\n/);
    let runningCtxTok = 0;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line) continue;
      if (!titleGuess && line.indexOf('"USER_INPUT"') !== -1) {
        try {
          const uo = JSON.parse(line);
          if (uo && uo.type === "USER_INPUT" && typeof uo.content === "string") {
            const cleanU = uo.content.replace(/\s+/g, " ").trim();
            if (cleanU && !cleanU.startsWith("<")) titleGuess = cleanU.slice(0, 60);
          }
        } catch {}
        continue;
      }
      if (line.indexOf('"PLANNER_RESPONSE"') === -1) continue;
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      if (!o || o.type !== "PLANNER_RESPONSE") continue;
      const ts = o.created_at ? Date.parse(o.created_at) : 0;
      const contentStr = typeof o.content === "string" ? o.content : "";
      const thinkStr = typeof o.thinking === "string" ? o.thinking : "";
      const toolsStr = Array.isArray(o.tool_calls) ? JSON.stringify(o.tool_calls) : "";
      const outTok = typeof o.output_tokens === "number" && o.output_tokens > 0
        ? Math.round(o.output_tokens)
        : Math.max(20, Math.round((contentStr.length + thinkStr.length + toolsStr.length) / 3.5));
      if (typeof o.model === "string" && o.model.trim()) lastModel = o.model.trim();
      const hasRealIn = typeof o.input_tokens === "number" && o.input_tokens > 0;
      const hasRealCache = typeof o.cache_read_tokens === "number" && o.cache_read_tokens > 0;
      let stepUnits;
      if (hasRealIn || hasRealCache) {
        // Realistic billing weight: output 1.0x, uncached input 0.20x, prompt cache read 0.02x
        const inTok = hasRealIn ? o.input_tokens : 0;
        const cacheTok = hasRealCache ? o.cache_read_tokens : 0;
        stepUnits = Math.round(outTok + inTok * 0.20 + cacheTok * 0.02);
      } else {
        const ctxTok = Math.min(120000, 10000 + runningCtxTok);
        stepUnits = Math.round(outTok + ctxTok * 0.04);
      }
      const fam = classifyModelFamily(o.model || lastModel || "");
      steps.push({ ts: Number.isFinite(ts) && ts > 0 ? ts : mtimeMs, units: Math.max(20, stepUnits), family: fam });
      runningCtxTok = Math.min(180000, runningCtxTok + Math.round((contentStr.length + toolsStr.length) / 3.5));
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

function formatLiveResetRemaining(rawResetStr, updatedAtMs, nowMs, locale) {
  const raw = typeof rawResetStr === "string" ? rawResetStr.trim() : "";
  if (!raw) return { text: "", expired: false, resetAtMs: 0, remainingMs: 0 };
  const origMs = parseResetDurationMs(raw);
  if (origMs <= 0) return { text: raw, expired: false, resetAtMs: 0, remainingMs: 0 };
  const upd = Number(updatedAtMs) || 0;
  const elapsed = upd > 0 && nowMs > upd ? nowMs - upd : 0;
  const remMs = origMs - elapsed;
  if (remMs <= 0) {
    return { text: "", expired: true, resetAtMs: upd > 0 ? upd + origMs : nowMs, remainingMs: 0 };
  }
  const ru = locale !== "en";
  const totalMin = Math.max(1, Math.ceil(remMs / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  let text = "";
  if (days > 0) {
    text = ru
      ? (hours > 0 ? `${days} д ${hours} ч` : `${days} д`)
      : (hours > 0 ? `${days}d ${hours}h` : `${days}d`);
  } else if (hours > 0) {
    text = ru
      ? (mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`)
      : (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`);
  } else {
    text = ru ? `${mins} мин` : `${mins}m`;
  }
  return { text, expired: false, resetAtMs: upd > 0 ? upd + origMs : nowMs + remMs, remainingMs: remMs };
}

function getFamilyCycleBounds(famState, nowMs) {
  const wkLive = formatLiveResetRemaining(famState.weeklyReset, famState.updatedAt, nowMs, "en");
  const fhLive = formatLiveResetRemaining(famState.fiveHourReset, famState.updatedAt, nowMs, "en");
  const weeklyStartMs = wkLive.expired
    ? wkLive.resetAtMs
    : (wkLive.remainingMs > 0 && wkLive.remainingMs <= SEVEN_DAY_MS
        ? nowMs - (SEVEN_DAY_MS - wkLive.remainingMs)
        : nowMs - SEVEN_DAY_MS);
  const fiveHourStartMs = fhLive.expired
    ? fhLive.resetAtMs
    : (fhLive.remainingMs > 0 && fhLive.remainingMs <= FIVE_HOUR_MS
        ? nowMs - (FIVE_HOUR_MS - fhLive.remainingMs)
        : nowMs - FIVE_HOUR_MS);
  return { weeklyStartMs, fiveHourStartMs, wkLive, fhLive };
}

function buildQuotaSummary(activeChatKey, forceFresh, opts) {
  const normActive = normalizeChatKey(activeChatKey || lastActiveChatKey);
  const nowMs = opts && typeof opts.nowMs === "number" && Number.isFinite(opts.nowMs) ? opts.nowMs : Date.now();
  const locale = getLocale();
  if (!forceFresh && !opts && quotaSummaryCache.value && quotaSummaryCache.key === normActive && nowMs - quotaSummaryCache.at < 4000) {
    return quotaSummaryCache.value;
  }

  const store = loadQuotaStore();
  const chats = loadStudioChats();
  const resetWm = Math.max(store.resetAt || 0, store.families.gemini.resetAt || 0, store.families.claudeGpt.resetAt || 0);
  const bounds = {
    gemini: getFamilyCycleBounds(store.families.gemini, nowMs),
    claudeGpt: getFamilyCycleBounds(store.families.claudeGpt, nowMs),
  };
  const liveResetInfo = {
    gemini: {
      fiveHour: formatLiveResetRemaining(store.families.gemini.fiveHourReset, store.families.gemini.updatedAt, nowMs, locale),
      weekly: formatLiveResetRemaining(store.families.gemini.weeklyReset, store.families.gemini.updatedAt, nowMs, locale),
    },
    claudeGpt: {
      fiveHour: formatLiveResetRemaining(store.families.claudeGpt.fiveHourReset, store.families.claudeGpt.updatedAt, nowMs, locale),
      weekly: formatLiveResetRemaining(store.families.claudeGpt.weeklyReset, store.families.claudeGpt.updatedAt, nowMs, locale),
    },
  };
  const sinceSnapCutoff = {
    gemini: {
      fiveHour: liveResetInfo.gemini.fiveHour.expired ? liveResetInfo.gemini.fiveHour.resetAtMs : (store.families.gemini.updatedAt || 0),
      weekly: liveResetInfo.gemini.weekly.expired ? liveResetInfo.gemini.weekly.resetAtMs : (store.families.gemini.updatedAt || 0),
    },
    claudeGpt: {
      fiveHour: liveResetInfo.claudeGpt.fiveHour.expired ? liveResetInfo.claudeGpt.fiveHour.resetAtMs : (store.families.claudeGpt.updatedAt || 0),
      weekly: liveResetInfo.claudeGpt.weekly.expired ? liveResetInfo.claudeGpt.weekly.resetAtMs : (store.families.claudeGpt.updatedAt || 0),
    },
  };
  const minCutoffMs = Math.min(bounds.gemini.weeklyStartMs, bounds.claudeGpt.weeklyStartMs, bounds.gemini.fiveHourStartMs, bounds.claudeGpt.fiveHourStartMs);
  const diskByChat = opts && opts.diskByChat instanceof Map ? opts.diskByChat : scanBrainTranscriptsQuota(minCutoffMs, resetWm);

  const allKeys = new Set(Object.keys(chats));
  for (const k of diskByChat.keys()) allKeys.add(k);

  const familyTotals = {
    gemini: { unitsWeekly: 0, units5h: 0, unitsWeeklyBeforeSnap: 0, units5hBeforeSnap: 0, unitsWeeklySinceSnap: 0, units5hSinceSnap: 0 },
    claudeGpt: { unitsWeekly: 0, units5h: 0, unitsWeeklyBeforeSnap: 0, units5hBeforeSnap: 0, unitsWeeklySinceSnap: 0, units5hSinceSnap: 0 },
  };
  const chatMeta = new Map();

  for (const key of allKeys) {
    if (!key || key === "__new__") continue;
    const rec = chats[key] ? sanitizeChatRecord(chats[key]) : defaultChatRecord("");
    const disk = diskByChat.get(key) || null;
    const modelName = (rec.telemetry && rec.telemetry.modelName) || (rec.quota.claudeGpt.lastModel) || (rec.quota.gemini.lastModel) || (disk && disk.lastModel) || "";
    const diskLastFam = disk && disk.steps.length > 0 ? disk.steps[disk.steps.length - 1].family : "";
    const hasCla = rec.quota.claudeGpt.turns > 0 || (modelName && classifyModelFamily(modelName) === "claudeGpt") || diskLastFam === "claudeGpt";
    const famWeight = Math.max(0.4, getModelQuotaWeight(modelName));

    const unitsWeeklyByFam = { gemini: 0, claudeGpt: 0 };
    const units5hByFam = { gemini: 0, claudeGpt: 0 };
    const turnsByFam = { gemini: 0, claudeGpt: 0 };
    let lastStepTs = 0;

    if (disk) {
      const rawWByFam = { gemini: 0, claudeGpt: 0 };
      const raw5ByFam = { gemini: 0, claudeGpt: 0 };
      const rawWBeforeByFam = { gemini: 0, claudeGpt: 0 };
      const raw5BeforeByFam = { gemini: 0, claudeGpt: 0 };
      const rawWSinceByFam = { gemini: 0, claudeGpt: 0 };
      const raw5SinceByFam = { gemini: 0, claudeGpt: 0 };
      const stepsWByFam = { gemini: 0, claudeGpt: 0 };
      const steps5ByFam = { gemini: 0, claudeGpt: 0 };
      for (let i = 0; i < disk.steps.length; i += 1) {
        const stp = disk.steps[i];
        if (stp.ts < resetWm) continue;
        const fam = stp.family === "claudeGpt" ? "claudeGpt" : "gemini";
        const famBounds = bounds[fam];
        const snapCut = sinceSnapCutoff[fam];
        if (stp.ts >= famBounds.weeklyStartMs) {
          rawWByFam[fam] += stp.units;
          stepsWByFam[fam] += 1;
          if (stp.ts > lastStepTs) lastStepTs = stp.ts;
          if (snapCut.weekly > 0) {
            if (stp.ts > snapCut.weekly) rawWSinceByFam[fam] += stp.units;
            else rawWBeforeByFam[fam] += stp.units;
          }
        }
        if (stp.ts >= famBounds.fiveHourStartMs) {
          raw5ByFam[fam] += stp.units;
          steps5ByFam[fam] += 1;
          if (stp.ts > lastStepTs) lastStepTs = stp.ts;
          if (snapCut.fiveHour > 0) {
            if (stp.ts > snapCut.fiveHour) raw5SinceByFam[fam] += stp.units;
            else raw5BeforeByFam[fam] += stp.units;
          }
        }
      }
      for (const fam of ["gemini", "claudeGpt"]) {
        unitsWeeklyByFam[fam] = Math.round(rawWByFam[fam] * famWeight);
        units5hByFam[fam] = Math.round(raw5ByFam[fam] * famWeight);
        familyTotals[fam].unitsWeeklyBeforeSnap += Math.round(rawWBeforeByFam[fam] * famWeight);
        familyTotals[fam].units5hBeforeSnap += Math.round(raw5BeforeByFam[fam] * famWeight);
        familyTotals[fam].unitsWeeklySinceSnap += Math.round(rawWSinceByFam[fam] * famWeight);
        familyTotals[fam].units5hSinceSnap += Math.round(raw5SinceByFam[fam] * famWeight);
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
    const calW = familyTotals[famId].unitsWeeklyBeforeSnap > 0 ? familyTotals[famId].unitsWeeklyBeforeSnap : totW;
    const cal5 = familyTotals[famId].units5hBeforeSnap > 0 ? familyTotals[famId].units5hBeforeSnap : tot5;
    const usedW = fam.weeklyRem !== null ? Math.max(0, 100 - fam.weeklyRem) : null;
    const used5 = fam.fiveHourRem !== null ? Math.max(0, 100 - fam.fiveHourRem) : null;
    const impliedW = usedW !== null && usedW >= 0.5 && calW > 0
      ? Math.round(clampNum(calW / usedW, 80000, 6000000, fam.tokensPer1PctWeekly))
      : fam.tokensPer1PctWeekly;
    const implied5 = used5 !== null && used5 >= 0.5 && cal5 > 0
      ? Math.round(clampNum(cal5 / used5, 20000, 1500000, fam.tokensPer1Pct5h))
      : Math.max(25000, Math.round(impliedW * 0.24));
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

  const sumPending = (mapObj) => {
    if (!mapObj || typeof mapObj !== "object") return 0;
    let total = 0;
    for (const k of Object.keys(mapObj)) total += Math.max(0, Number(mapObj[k]) || 0);
    return total;
  };
  const buildFamilyDisplay = (famId) => {
    const fam = store.families[famId];
    const r = rates[famId];
    const lr5 = liveResetInfo[famId].fiveHour;
    const lrW = liveResetInfo[famId].weekly;
    const pend5 = sumPending(fam.pending5hByChat);
    const pendW = sumPending(fam.pendingWeeklyByChat);
    const diskSince5 = familyTotals[famId].units5hSinceSnap || 0;
    const diskSinceW = familyTotals[famId].unitsWeeklySinceSnap || 0;

    const base5 = fam.fiveHourRem !== null ? (lr5.expired ? 100 : fam.fiveHourRem) : null;
    const baseW = fam.weeklyRem !== null ? (lrW.expired ? 100 : fam.weeklyRem) : null;
    // Prefer same-scale transcript.jsonl delta when available; only fall back to DOM pending turns when disk has no steps yet
    const effPend5 = lr5.expired ? diskSince5 : (diskSince5 > 0 ? diskSince5 : pend5);
    const effPendW = lrW.expired ? diskSinceW : (diskSinceW > 0 ? diskSinceW : pendW);

    const estDrop5 = base5 !== null && effPend5 > 0 ? effPend5 / Math.max(20000, r.unitsPer1Pct5h) : 0;
    const estDropW = baseW !== null && effPendW > 0 ? effPendW / Math.max(80000, r.unitsPer1PctWeekly) : 0;
    // Never falsely drop an *estimated* value all the way to 0% while the last official snapshot was > 0%
    const minEst5 = base5 !== null && base5 > 0 && estDrop5 > 0 ? 1 : 0;
    const minEstW = baseW !== null && baseW > 0 && estDropW > 0 ? 1 : 0;
    const live5 = base5 !== null ? Math.max(minEst5, Math.min(100, Math.round(base5 - estDrop5))) : null;
    const liveW = baseW !== null ? Math.max(minEstW, Math.min(100, Math.round(baseW - estDropW))) : null;
    return {
      weeklyRem: liveW,
      fiveHourRem: live5,
      weeklyRawRem: fam.weeklyRem,
      fiveHourRawRem: fam.fiveHourRem,
      weeklyEstimated: (estDropW >= 0.5 && liveW !== fam.weeklyRem) || (lrW.expired && liveW !== fam.weeklyRem),
      fiveHourEstimated: (estDrop5 >= 0.5 && live5 !== fam.fiveHourRem) || (lr5.expired && live5 !== fam.fiveHourRem),
      weeklyReset: lrW.text,
      fiveHourReset: lr5.text,
      fiveHourWindowResetDetected: Boolean(lr5.expired),
      weeklyWindowResetDetected: Boolean(lrW.expired),
      updatedAt: fam.updatedAt,
      liveUpdatedAt: nowMs,
      calibrated: r.calibrated,
      tokensPer1Pct5h: r.unitsPer1Pct5h,
      tokensPer1PctWeekly: r.unitsPer1PctWeekly,
    };
  };

  const result = {
    families: {
      gemini: buildFamilyDisplay("gemini"),
      claudeGpt: buildFamilyDisplay("claudeGpt"),
    },
    activeChat: activeChatSummary,
    chats: rows.slice(0, 40),
  };
  if (!opts) {
    quotaSummaryCache = { key: normActive, at: nowMs, value: result };
  }
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

function broadcastQuotaSummary(summary) {
  if (!summary || typeof summary !== "object") return;
  try {
    for (const wc of webContents.getAllWebContents()) {
      if (wc && !wc.isDestroyed()) {
        wc.send("agy-studio:quota-updated", summary);
      }
    }
  } catch {}
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
    'set "ELECTRON_NO_ASAR=1"',
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

let lastCustomHotkeyAt = 0;

function matchInputToCombo(input, comboStr) {
  if (!input || !comboStr) return false;
  const parts = String(comboStr).split("+").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  let wantCtrl = false;
  let wantAlt = false;
  let wantShift = false;
  let wantKey = "";
  for (let i = 0; i < parts.length; i += 1) {
    const low = parts[i].toLowerCase();
    if (low === "ctrl" || low === "control" || low === "cmd" || low === "meta") wantCtrl = true;
    else if (low === "alt") wantAlt = true;
    else if (low === "shift") wantShift = true;
    else wantKey = parts[i].toLowerCase();
  }
  if (!wantKey) return false;
  const hasCtrl = Boolean(input.control || input.meta);
  const hasAlt = Boolean(input.alt);
  const hasShift = Boolean(input.shift);
  if (hasCtrl !== wantCtrl || hasAlt !== wantAlt || hasShift !== wantShift) return false;
  const inKey = typeof input.key === "string" ? input.key.toLowerCase() : "";
  const inCode = typeof input.code === "string" ? input.code.toLowerCase() : "";
  if (inKey === wantKey) return true;
  if (wantKey.length === 1 && inCode === "key" + wantKey) return true;
  if (/^\d$/.test(wantKey) && inCode === "digit" + wantKey) return true;
  if (inCode === wantKey) return true;
  return false;
}

function handleKeybindingEvent(contents, input) {
  if (!input || input.type !== "keyDown" || input.isAutoRepeat) return false;
  const settings = loadStudioSettings();
  const kb = settings && settings.keybindings ? settings.keybindings : DEFAULT_KEYBINDINGS;
  for (const action of Object.keys(kb)) {
    const combo = kb[action];
    if (!combo) continue;
    if (!matchInputToCombo(input, combo)) continue;
    const now = Date.now();
    if (now - lastCustomHotkeyAt < 160) return true;
    lastCustomHotkeyAt = now;
    if (action === "toggleLocale") {
      toggleLocaleFromHotkey();
      return true;
    }
    if (action === "toggleStudio") {
      togglePanelFromHotkey(contents);
      return true;
    }
    try {
      if (contents && !contents.isDestroyed()) {
        contents.send("agy-studio:hotkey-action", { action });
      }
    } catch {}
    return true;
  }
  return false;
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
  const maxBytes = 20 * 1024 * 1024;
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

function saveLiveEditFilePayload(fileObj, idx) {
  if (!fileObj || typeof fileObj !== "object") return null;
  const maxBytes = 20 * 1024 * 1024;
  const mediaDir = getLiveEditsMediaDir();
  fs.mkdirSync(mediaDir, { recursive: true });
  const rawName = typeof fileObj.name === "string" && fileObj.name.trim() ? path.basename(fileObj.name.trim()) : `attachment-${idx + 1}.bin`;
  const cleanName = rawName.replace(/[^a-zA-Z0-9._\u0400-\u04FF-]/g, "_").replace(/^\.+/, "").slice(0, 72) || `attachment-${idx + 1}.bin`;

  if (typeof fileObj.dataUrl === "string" && fileObj.dataUrl.startsWith("data:")) {
    const commaIdx = fileObj.dataUrl.indexOf(",");
    if (commaIdx <= 0) return null;
    const header = fileObj.dataUrl.slice(0, commaIdx);
    const b64 = fileObj.dataUrl.slice(commaIdx + 1);
    if (!/;base64$/i.test(header)) return null;
    const buf = Buffer.from(b64, "base64");
    if (!buf || buf.length === 0 || buf.length > maxBytes) return null;
    const mimeMatch = /^data:([^;,]+)/i.exec(header);
    const mime = mimeMatch ? mimeMatch[1].toLowerCase() : (typeof fileObj.mime === "string" ? fileObj.mime : "application/octet-stream");
    const destName = `le-file-${Date.now()}-${idx}-${cleanName}`;
    const destPath = path.join(mediaDir, destName);
    fs.writeFileSync(destPath, buf);
    return {
      name: cleanName,
      mime,
      path: destPath,
      sizeBytes: buf.length,
    };
  }
  return null;
}

const MAX_COMPOSER_DRAFTS = 40;
const MAX_DRAFT_ATTACHMENTS = 8;
const MAX_INPUT_HISTORY_ITEMS = 20;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getComposerDraftsPath() {
  return path.join(app.getPath("userData"), "agy_studio_drafts.json");
}

function getComposerDraftsMediaDir() {
  return path.join(app.getPath("userData"), "studio_drafts_media");
}

function getInputHistoryPath() {
  return path.join(app.getPath("userData"), "agy_studio_input_history.json");
}

function getInputHistoryMediaDir() {
  return path.join(app.getPath("userData"), "studio_history_media");
}

function sanitizeAttachmentFileName(rawName, fallbackName) {
  const base = typeof rawName === "string" && rawName.trim() ? path.basename(rawName.trim()) : fallbackName;
  return base.replace(/[^a-zA-Z0-9._\u0400-\u04FF-]/g, "_").replace(/^\.+/, "").slice(0, 72) || fallbackName;
}

function saveAttachmentPayloadToDir(attObj, dirPath, prefix, idx, reuseDirs) {
  if (!attObj || typeof attObj !== "object") return null;
  fs.mkdirSync(dirPath, { recursive: true });
  const fallbackName = `attachment-${idx + 1}.bin`;
  const cleanName = sanitizeAttachmentFileName(attObj.name, fallbackName);

  // 1. Reuse existing file already persisted inside dirPath (or copy from an allowed sibling media dir)
  const existingName = typeof attObj.fileName === "string" ? path.basename(attObj.fileName.trim()) : "";
  if (existingName && existingName === attObj.fileName.trim()) {
    const ownPath = path.join(dirPath, existingName);
    if (fs.existsSync(ownPath)) {
      try {
        const st = fs.statSync(ownPath);
        if (st.isFile() && st.size > 0 && st.size <= MAX_ATTACHMENT_BYTES) {
          const mime = typeof attObj.mime === "string" && attObj.mime ? attObj.mime.toLowerCase() : "application/octet-stream";
          const isImage = Boolean(attObj.isImage || mime.startsWith("image/"));
          return {
            id: typeof attObj.id === "string" && attObj.id ? attObj.id : `att-${Date.now()}-${idx}`,
            name: cleanName,
            mime,
            isImage,
            fileName: existingName,
            sizeBytes: st.size,
          };
        }
      } catch {}
    }
    const copySources = Array.isArray(reuseDirs) ? reuseDirs : [];
    for (let s = 0; s < copySources.length; s += 1) {
      const srcPath = path.join(copySources[s], existingName);
      if (fs.existsSync(srcPath)) {
        try {
          const st = fs.statSync(srcPath);
          if (st.isFile() && st.size > 0 && st.size <= MAX_ATTACHMENT_BYTES) {
            const destName = `${prefix}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}-${cleanName}`;
            const destPath = path.join(dirPath, destName);
            fs.copyFileSync(srcPath, destPath);
            const mime = typeof attObj.mime === "string" && attObj.mime ? attObj.mime.toLowerCase() : "application/octet-stream";
            const isImage = Boolean(attObj.isImage || mime.startsWith("image/"));
            return {
              id: typeof attObj.id === "string" && attObj.id ? attObj.id : `att-${Date.now()}-${idx}`,
              name: cleanName,
              mime,
              isImage,
              fileName: destName,
              sizeBytes: st.size,
            };
          }
        } catch {}
      }
    }
  }

  // 2. Decode base64 data URL
  if (typeof attObj.dataUrl === "string" && attObj.dataUrl.startsWith("data:")) {
    const commaIdx = attObj.dataUrl.indexOf(",");
    if (commaIdx <= 0) return null;
    const header = attObj.dataUrl.slice(0, commaIdx);
    const b64 = attObj.dataUrl.slice(commaIdx + 1);
    if (!/;base64$/i.test(header)) return null;
    const buf = Buffer.from(b64, "base64");
    if (!buf || buf.length === 0 || buf.length > MAX_ATTACHMENT_BYTES) return null;
    const mimeMatch = /^data:([^;,]+)/i.exec(header);
    const mime = mimeMatch ? mimeMatch[1].toLowerCase() : (typeof attObj.mime === "string" && attObj.mime ? attObj.mime.toLowerCase() : "application/octet-stream");
    const isImage = Boolean(attObj.isImage || mime.startsWith("image/"));
    let finalName = cleanName;
    if (isImage && !/\.(?:png|jpe?g|webp|gif|bmp)$/i.test(finalName)) {
      const ext = mime.includes("jpeg") || mime.includes("jpg") ? ".jpg" : mime.includes("webp") ? ".webp" : mime.includes("gif") ? ".gif" : ".png";
      finalName = (finalName.replace(/\.[^.]+$/, "") || "screenshot") + ext;
    }
    const destName = `${prefix}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}-${finalName}`;
    const destPath = path.join(dirPath, destName);
    fs.writeFileSync(destPath, buf);
    return {
      id: typeof attObj.id === "string" && attObj.id ? attObj.id : `att-${Date.now()}-${idx}`,
      name: finalName,
      mime,
      isImage,
      fileName: destName,
      sizeBytes: buf.length,
    };
  }
  return null;
}

function pruneOrphanedFilesInDir(dirPath, keepSet) {
  try {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      if (!keepSet.has(f)) {
        try { fs.unlinkSync(path.join(dirPath, f)); } catch {}
      }
    }
  } catch {}
}

function loadComposerDraftsStore() {
  try {
    const p = getComposerDraftsPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      if (parsed && typeof parsed === "object" && parsed.drafts && typeof parsed.drafts === "object") {
        return { version: 1, drafts: parsed.drafts };
      }
    }
  } catch {}
  return { version: 1, drafts: {} };
}

function persistComposerDraftsStore(store) {
  const now = Date.now();
  const entries = Object.entries(store.drafts || {}).filter(([, v]) => {
    if (!v || typeof v !== "object") return false;
    const hasTxt = typeof v.text === "string" && v.text.trim().length > 0;
    const hasAtt = Array.isArray(v.attachments) && v.attachments.length > 0;
    if (!hasTxt && !hasAtt) return false;
    if (v.updatedAt && now - v.updatedAt > DRAFT_TTL_MS) return false;
    return true;
  });
  entries.sort((a, b) => (Number(b[1].updatedAt) || 0) - (Number(a[1].updatedAt) || 0));
  const kept = entries.slice(0, MAX_COMPOSER_DRAFTS);
  const nextDrafts = {};
  const keepFiles = new Set();
  for (let i = 0; i < kept.length; i += 1) {
    const [k, v] = kept[i];
    nextDrafts[k] = v;
    const atts = Array.isArray(v.attachments) ? v.attachments : [];
    for (let j = 0; j < atts.length; j += 1) {
      if (atts[j] && atts[j].fileName) keepFiles.add(atts[j].fileName);
    }
  }
  const out = { version: 1, drafts: nextDrafts };
  try {
    writeJsonAtomic(getComposerDraftsPath(), out);
  } catch {}
  pruneOrphanedFilesInDir(getComposerDraftsMediaDir(), keepFiles);
  return out;
}

function saveComposerDraft(payload) {
  const settings = loadStudioSettings();
  if (settings.composerDraftsEnabled === false) {
    return { ok: true, disabled: true, draft: null };
  }
  const p = payload && typeof payload === "object" ? payload : {};
  const key = normalizeChatKey(p.chatKey);
  const text = typeof p.text === "string" ? p.text.slice(0, 64000) : "";
  const rawAtts = Array.isArray(p.attachments) ? p.attachments.slice(0, MAX_DRAFT_ATTACHMENTS) : [];
  const mediaDir = getComposerDraftsMediaDir();
  const savedAtts = [];
  for (let i = 0; i < rawAtts.length; i += 1) {
    const saved = saveAttachmentPayloadToDir(rawAtts[i], mediaDir, "dr", i, []);
    if (saved) savedAtts.push(saved);
  }
  const store = loadComposerDraftsStore();
  if (!text.trim() && savedAtts.length === 0) {
    if (Object.prototype.hasOwnProperty.call(store.drafts, key)) {
      delete store.drafts[key];
      persistComposerDraftsStore(store);
    }
    return { ok: true, draft: null };
  }
  const draft = {
    chatKey: key,
    title: typeof p.title === "string" ? p.title.trim().slice(0, 96) : "",
    text,
    attachments: savedAtts,
    updatedAt: Date.now(),
  };
  store.drafts[key] = draft;
  persistComposerDraftsStore(store);
  return { ok: true, draft };
}

function getComposerDraftWithData(chatKey) {
  const settings = loadStudioSettings();
  if (settings.composerDraftsEnabled === false) {
    return { ok: true, disabled: true, draft: null };
  }
  const key = normalizeChatKey(chatKey);
  const store = loadComposerDraftsStore();
  const raw = store.drafts[key];
  if (!raw || typeof raw !== "object") {
    return { ok: true, draft: null };
  }
  const mediaDir = getComposerDraftsMediaDir();
  const attsWithData = [];
  const rawAtts = Array.isArray(raw.attachments) ? raw.attachments : [];
  for (let i = 0; i < rawAtts.length; i += 1) {
    const a = rawAtts[i];
    if (!a || !a.fileName) continue;
    const safeName = path.basename(String(a.fileName));
    const fullPath = path.join(mediaDir, safeName);
    if (!fs.existsSync(fullPath)) continue;
    try {
      const buf = fs.readFileSync(fullPath);
      if (!buf || buf.length === 0 || buf.length > MAX_ATTACHMENT_BYTES) continue;
      const mime = a.mime || "application/octet-stream";
      attsWithData.push({
        id: a.id || `att-${i}`,
        name: a.name || safeName,
        mime,
        isImage: Boolean(a.isImage || String(mime).startsWith("image/")),
        fileName: safeName,
        sizeBytes: buf.length,
        dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
      });
    } catch {}
  }
  if (!String(raw.text || "").trim() && attsWithData.length === 0) {
    return { ok: true, draft: null };
  }
  return {
    ok: true,
    draft: {
      chatKey: key,
      title: raw.title || "",
      text: typeof raw.text === "string" ? raw.text : "",
      attachments: attsWithData,
      updatedAt: Number(raw.updatedAt) || 0,
    },
  };
}

function clearComposerDraft(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const store = loadComposerDraftsStore();
  if (p.all) {
    store.drafts = {};
    persistComposerDraftsStore(store);
    return { ok: true, draftCount: 0 };
  }
  const key = normalizeChatKey(p.chatKey);
  if (Object.prototype.hasOwnProperty.call(store.drafts, key)) {
    delete store.drafts[key];
    persistComposerDraftsStore(store);
  }
  return { ok: true, draftCount: Object.keys(store.drafts || {}).length };
}

function loadInputHistoryStore() {
  try {
    const p = getInputHistoryPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return { version: 1, items: parsed.items };
      }
    }
  } catch {}
  return { version: 1, items: [] };
}

function persistInputHistoryStore(store) {
  const items = Array.isArray(store.items) ? store.items.slice(0, MAX_INPUT_HISTORY_ITEMS) : [];
  const keepFiles = new Set();
  for (let i = 0; i < items.length; i += 1) {
    const atts = Array.isArray(items[i] && items[i].attachments) ? items[i].attachments : [];
    for (let j = 0; j < atts.length; j += 1) {
      if (atts[j] && atts[j].fileName) keepFiles.add(atts[j].fileName);
    }
  }
  const out = { version: 1, items };
  try {
    writeJsonAtomic(getInputHistoryPath(), out);
  } catch {}
  pruneOrphanedFilesInDir(getInputHistoryMediaDir(), keepFiles);
  return out;
}

function recordInputHistoryItem(payload) {
  const settings = loadStudioSettings();
  if (settings.inputHistoryEnabled === false) {
    return { ok: true, disabled: true };
  }
  const p = payload && typeof payload === "object" ? payload : {};
  const text = typeof p.text === "string" ? p.text.trim().slice(0, 32000) : "";
  const rawAtts = Array.isArray(p.attachments) ? p.attachments.slice(0, MAX_DRAFT_ATTACHMENTS) : [];
  const store = loadInputHistoryStore();
  const now = Date.now();

  // Deduplicate rapid double-capture (e.g. Enter + click or live-edit) within 2.5s
  const head = store.items[0];
  if (head && now - (Number(head.createdAt) || 0) < 2500) {
    const sameText = String(head.text || "") === text;
    const headNames = (Array.isArray(head.attachments) ? head.attachments : []).map((a) => a.name).join("|");
    const newNames = rawAtts.map((a) => sanitizeAttachmentFileName(a && a.name, "")).join("|");
    if (sameText && (headNames === newNames || (!headNames && !newNames))) {
      return { ok: true, deduplicated: true, item: head };
    }
  }

  const histDir = getInputHistoryMediaDir();
  const draftDir = getComposerDraftsMediaDir();
  const savedAtts = [];
  for (let i = 0; i < rawAtts.length; i += 1) {
    const saved = saveAttachmentPayloadToDir(rawAtts[i], histDir, "ih", i, [draftDir]);
    if (saved) savedAtts.push(saved);
  }
  if (!text && savedAtts.length === 0) {
    return { ok: false, error: "EMPTY_HISTORY_ITEM" };
  }
  const entry = {
    id: `ih-${now}-${Math.random().toString(36).slice(2, 7)}`,
    chatKey: normalizeChatKey(p.chatKey),
    chatTitle: typeof p.title === "string" ? p.title.trim().slice(0, 96) : "",
    text,
    source: p.source === "live-edit" ? "live-edit" : "chat",
    attachments: savedAtts,
    createdAt: now,
  };
  store.items.unshift(entry);
  persistInputHistoryStore(store);
  return { ok: true, item: entry, total: Math.min(store.items.length, MAX_INPUT_HISTORY_ITEMS) };
}

function buildThumbnailDataUrl(fullPath, mime) {
  try {
    if (nativeImage && typeof nativeImage.createFromPath === "function") {
      const img = nativeImage.createFromPath(fullPath);
      if (img && !(typeof img.isEmpty === "function" && img.isEmpty())) {
        const sz = typeof img.getSize === "function" ? img.getSize() : { width: 0, height: 0 };
        const resized = sz.width > 200 && typeof img.resize === "function" ? img.resize({ width: 200 }) : img;
        if (typeof resized.toDataURL === "function") return resized.toDataURL();
      }
    }
  } catch {}
  try {
    const st = fs.statSync(fullPath);
    if (st.size <= 160 * 1024) {
      return `data:${mime || "image/png"};base64,${fs.readFileSync(fullPath).toString("base64")}`;
    }
  } catch {}
  return "";
}

function getInputHistoryForUi() {
  const settings = loadStudioSettings();
  const store = loadInputHistoryStore();
  const draftsStore = loadComposerDraftsStore();
  const histDir = getInputHistoryMediaDir();
  const items = (store.items || []).slice(0, MAX_INPUT_HISTORY_ITEMS).map((it) => {
    const atts = (Array.isArray(it.attachments) ? it.attachments : []).map((a) => {
      if (!a || !a.fileName) return null;
      const safeName = path.basename(String(a.fileName));
      const fullPath = path.join(histDir, safeName);
      const exists = fs.existsSync(fullPath);
      return {
        id: a.id || safeName,
        name: a.name || safeName,
        mime: a.mime || "application/octet-stream",
        isImage: Boolean(a.isImage || String(a.mime || "").startsWith("image/")),
        fileName: safeName,
        sizeBytes: Number(a.sizeBytes) || 0,
        exists,
        previewDataUrl: exists && (a.isImage || String(a.mime || "").startsWith("image/"))
          ? buildThumbnailDataUrl(fullPath, a.mime)
          : "",
      };
    }).filter(Boolean);
    return {
      id: it.id,
      chatKey: it.chatKey || "__new__",
      chatTitle: it.chatTitle || "",
      text: it.text || "",
      source: it.source || "chat",
      attachments: atts,
      createdAt: Number(it.createdAt) || 0,
    };
  });
  return {
    ok: true,
    enabled: settings.inputHistoryEnabled !== false,
    draftsEnabled: settings.composerDraftsEnabled !== false,
    draftCount: Object.keys(draftsStore.drafts || {}).length,
    items,
  };
}

function deleteInputHistoryItem(id) {
  const targetId = typeof id === "string" ? id.trim() : "";
  const store = loadInputHistoryStore();
  if (!targetId) return { ok: false };
  store.items = (store.items || []).filter((it) => it && it.id !== targetId);
  persistInputHistoryStore(store);
  return getInputHistoryForUi();
}

function clearInputHistory() {
  persistInputHistoryStore({ version: 1, items: [] });
  return getInputHistoryForUi();
}

function copyFileToWindowsClipboard(fullPath) {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      try {
        if (clipboard && typeof clipboard.writeText === "function") clipboard.writeText(fullPath);
      } catch {}
      resolve({ ok: true, fallbackPath: true });
      return;
    }
    try {
      const ps = spawn(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-STA",
          "-Command",
          "Add-Type -AssemblyName System.Windows.Forms; $c = New-Object System.Collections.Specialized.StringCollection; [void]$c.Add($env:RUDEX_CLIP_FILE); [System.Windows.Forms.Clipboard]::SetFileDropList($c)",
        ],
        {
          env: Object.assign({}, process.env, { RUDEX_CLIP_FILE: fullPath }),
          windowsHide: true,
          stdio: "ignore",
        }
      );
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (!ok) {
          try { if (clipboard && typeof clipboard.writeText === "function") clipboard.writeText(fullPath); } catch {}
        }
        resolve({ ok: true, fileDrop: ok });
      };
      const timer = setTimeout(() => {
        try { ps.kill(); } catch {}
        done(false);
      }, 4000);
      ps.on("exit", (code) => done(code === 0));
      ps.on("error", () => done(false));
    } catch {
      try { if (clipboard && typeof clipboard.writeText === "function") clipboard.writeText(fullPath); } catch {}
      resolve({ ok: true, fileDrop: false });
    }
  });
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
  syncThinkingRuFlag(false, { boot: true });
  try {
    const rp = getPersonaRulePath();
    if (fs.existsSync(rp)) {
      const existingRule = fs.readFileSync(rp, "utf8");
      if (existingRule.includes("Язык внутренних размышлений агента")) {
        resyncActiveChatRuleFile();
      }
    }
  } catch {}
  const bootSettings = loadStudioSettings();
  syncAgentProfileFlags(bootSettings);
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
            if (curS.appearance && curS.appearance.presetId !== "native") {
              applyThemeCurtainToWindows(curS.appearance);
              setTimeout(() => {
                try {
                  const latestS = loadStudioSettings();
                  if (latestS.appearance && latestS.appearance.presetId !== "native") {
                    applyThemeCurtainToWindows(latestS.appearance);
                  }
                } catch {}
              }, 1100);
            }
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
  ipcMain.handle("agy-studio:sync-titlebar-overlay", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    if (p.appearance && typeof p.appearance === "object") {
      applyThemeCurtainToWindows(p.appearance);
      return { ok: true };
    }
    const curS = loadStudioSettings();
    if (curS && curS.appearance) applyThemeCurtainToWindows(curS.appearance);
    return { ok: true };
  });
  ipcMain.handle("agy-studio:activate-chat", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    lastActiveChatKey = key;
    const titleStr = typeof p.title === "string" ? p.title.trim().slice(0, 80) : "";
    const store = loadStudioChatsStore();
    if (key === "__new__") {
      const dp = p.draftPersona && typeof p.draftPersona === "object" ? p.draftPersona : null;
      const dap = p.draftAgentProfile && typeof p.draftAgentProfile === "object" ? sanitizeAgentProfile(p.draftAgentProfile) : null;
      const existingPendingAp = store.pendingNewChatAgentProfile && !store.pendingNewChatAgentProfile.claimedBy && store.pendingNewChatAgentProfile.profile
        ? sanitizeAgentProfile(store.pendingNewChatAgentProfile.profile)
        : null;
      const effNewAp = dap && dap.enabled ? dap : (p.draftAgentProfile === null ? null : existingPendingAp);
      const rec = sanitizeChatRecord({
        personaEnabled: Boolean(dp && dp.personaEnabled && typeof dp.personaText === "string" && dp.personaText.trim()),
        personaActivePreset: dp && typeof dp.personaActivePreset === "string" ? dp.personaActivePreset : "custom",
        personaText: dp && typeof dp.personaText === "string" ? dp.personaText : "",
        personaStrict: dp ? dp.personaStrict !== false : true,
        agentProfile: effNewAp,
      });
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
      store.pendingNewChatAgentProfile = effNewAp && effNewAp.enabled
        ? {
            profile: effNewAp,
            updatedAt: Date.now(),
            claimedBy: "",
          }
        : null;
      store.activeAgentsMdChatKey = rec.personaEnabled && rec.personaText.trim() ? "__new__" : "";
      saveStudioChatsStore(store);
      syncAgentProfileFlags(loadStudioSettings(), store.chats, store);
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
      const pendingAp = store.pendingNewChatAgentProfile && store.pendingNewChatAgentProfile.profile && (!store.pendingNewChatAgentProfile.claimedBy || store.pendingNewChatAgentProfile.claimedBy === key)
        ? store.pendingNewChatAgentProfile.profile
        : null;
      chats[key] = sanitizeChatRecord(Object.assign({}, promo, {
        title: titleStr || (typeof promo.title === "string" ? promo.title : ""),
        agentProfile: promo.agentProfile || pendingAp || null,
        updatedAt: Date.now(),
      }));
      if (store.pendingNewChatAgentProfile) {
        store.pendingNewChatAgentProfile = Object.assign({}, store.pendingNewChatAgentProfile, { claimedBy: key });
      }
      changed = true;
    } else if (chats[key] && p.promoteFromNew && p.promoteFromNew.agentProfile && !chats[key].agentProfile) {
      chats[key] = sanitizeChatRecord(Object.assign({}, chats[key], {
        agentProfile: p.promoteFromNew.agentProfile,
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
    if (changed) {
      saveStudioChatsStore(store);
      syncAgentProfileFlags(loadStudioSettings(), store.chats, store);
    }
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
    const res = readLatestTurnMetrics(p.chatKey);
    if (res && res.ok) {
      try {
        broadcastQuotaSummary(buildQuotaSummary(p.chatKey || lastActiveChatKey, true));
      } catch {}
    }
    return res;
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
    const activeMediaFile = s && s.appearance && s.appearance.wallpaper ? s.appearance.wallpaper.mediaFile : "";
    if (activeMediaFile && activeMediaFile === name) {
      return { ok: true, keptForActive: true };
    }
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
        pluginVersion: (meta && (meta.version || meta.pluginVersion)) || "4.4.7",
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
    const wt = Math.max(100, Math.round((Math.max(20, outputTok) + 1500 + contextTok * 0.03) * weight));
    const now = Date.now();

    const store = loadQuotaStore();
    const famState = store.families[famId];
    const inc5h = wt / Math.max(20000, famState.tokensPer1Pct5h);
    const incWeek = wt / Math.max(80000, famState.tokensPer1PctWeekly);

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

    const nextSummary = buildQuotaSummary(key, true);
    broadcastQuotaSummary(nextSummary);
    return { ok: true, chatKey: key, chatQuota: chats[key].quota, summary: nextSummary };
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
          if (res5h.distributed && res5h.totalPending >= 15000 && drop5h >= 0.5) {
            const observedRate = res5h.totalPending / Math.max(0.2, drop5h);
            famState.tokensPer1Pct5h = Math.round(clampNum(famState.tokensPer1Pct5h * 0.65 + observedRate * 0.35, 20000, 1500000, famState.tokensPer1Pct5h));
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
        } else {
          famState.pending5hByChat = {};
        }
        famState.fiveHourRem = next5h;
      } else if (nextWeek !== null) {
        // Antigravity rendered this family in 1-bucket mode (weekly only, no active 5h bucket): clear stale 5h value so it never shows fake 100%
        famState.fiveHourRem = null;
        famState.fiveHourReset = "";
        famState.pending5hByChat = {};
      }

      if (nextWeek !== null) {
        if (famState.weeklyRem !== null && nextWeek < famState.weeklyRem) {
          const dropWeek = Math.round((famState.weeklyRem - nextWeek) * 100) / 100;
          const resW = applyQuotaDropForWindow(famId, dropWeek, famState.pendingWeeklyByChat, chats, activeKey, true);
          if (resW.distributed && resW.totalPending >= 25000 && dropWeek >= 0.5) {
            const observedRateW = resW.totalPending / Math.max(0.2, dropWeek);
            famState.tokensPer1PctWeekly = Math.round(clampNum(famState.tokensPer1PctWeekly * 0.65 + observedRateW * 0.35, 80000, 6000000, famState.tokensPer1PctWeekly));
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
        } else {
          famState.pendingWeeklyByChat = {};
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
    const nextSummary = buildQuotaSummary(activeKey, true);
    broadcastQuotaSummary(nextSummary);
    return { ok: true, summary: nextSummary };
  });
  ipcMain.handle("agy-studio:get-quota-summary", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    return buildQuotaSummary(p.chatKey || lastActiveChatKey, Boolean(p.forceFresh));
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
    const rawFiles = Array.isArray(p.files) ? p.files.slice(0, 6) : [];
    const savedFiles = [];
    for (let i = 0; i < rawFiles.length; i += 1) {
      const saved = saveLiveEditFilePayload(rawFiles[i], i);
      if (saved) savedFiles.push(saved);
    }
    if (!text && savedImgs.length === 0 && savedFiles.length === 0) {
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
      files: savedFiles,
      status: "pending",
      urgent: Boolean(p.urgent),
      fallbackAny: Boolean(p.fallbackAny || key === "__new__" || key.startsWith("chat-")),
      anchorRespIdx: typeof p.anchorRespIdx === "number" && Number.isFinite(p.anchorRespIdx) && p.anchorRespIdx >= 0 ? Math.floor(p.anchorRespIdx) : -1,
      anchorUserCount: typeof p.anchorUserCount === "number" && Number.isFinite(p.anchorUserCount) && p.anchorUserCount >= 0 ? Math.floor(p.anchorUserCount) : -1,
      anchorUserText: typeof p.anchorUserText === "string" ? p.anchorUserText.replace(/\s+/g, " ").trim().slice(0, 140) : "",
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
  ipcMain.handle("agy-studio:cancel-live-edit", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const editId = typeof p.id === "string" ? p.id.trim() : "";
    const key = normalizeChatKey(p.chatKey || lastActiveChatKey);
    if (!editId || /[^a-zA-Z0-9._-]/.test(editId)) return { ok: false, error: "INVALID_ID" };
    const queueFile = path.join(getLiveEditsQueueDir(), `${editId}.json`);
    try {
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    } catch {}
    const { items, hasPending } = loadAllLiveEdits();
    syncLiveEditsPendingFlag(hasPending);
    broadcastLiveEditsChanged(items);
    return { ok: true, items: filterLiveEditsForChat(items, key), allItems: items.slice(-30) };
  });
  ipcMain.handle("agy-studio:update-live-edit", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const editId = typeof p.id === "string" ? p.id.trim() : "";
    const nextText = typeof p.text === "string" ? p.text.trim().slice(0, 8000) : "";
    const key = normalizeChatKey(p.chatKey || lastActiveChatKey);
    if (!editId || /[^a-zA-Z0-9._-]/.test(editId) || !nextText) return { ok: false, error: "INVALID_ARGS" };
    const queueFile = path.join(getLiveEditsQueueDir(), `${editId}.json`);
    if (!fs.existsSync(queueFile)) return { ok: false, error: "NOT_IN_QUEUE" };
    try {
      const cur = JSON.parse(fs.readFileSync(queueFile, "utf8"));
      cur.text = nextText;
      if (typeof p.urgent === "boolean") cur.urgent = p.urgent;
      writeJsonAtomic(queueFile, cur);
    } catch {
      return { ok: false, error: "WRITE_FAILED" };
    }
    const { items } = loadAllLiveEdits();
    broadcastLiveEditsChanged(items);
    return { ok: true, items: filterLiveEditsForChat(items, key), allItems: items.slice(-30) };
  });
  ipcMain.handle("agy-studio:save-chat-agent-profile", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey || lastActiveChatKey);
    const prof = sanitizeAgentProfile(p.profile);
    if (p.setAsDefault === true || prof.applyToNewChats === true) {
      saveStudioSettings({ agentProfileDefault: Object.assign({}, prof, { applyToNewChats: Boolean(prof.applyToNewChats) }) });
    }
    const store = loadStudioChatsStore();
    if (key !== "__new__") {
      const prev = store.chats[key] ? sanitizeChatRecord(store.chats[key]) : defaultChatRecord(p.title || "");
      store.chats[key] = sanitizeChatRecord(Object.assign({}, prev, {
        title: typeof p.title === "string" && p.title.trim() ? p.title.trim().slice(0, 80) : prev.title,
        agentProfile: prof,
        updatedAt: Date.now(),
      }));
    } else {
      store.pendingNewChatAgentProfile = prof.enabled
        ? {
            profile: prof,
            updatedAt: Date.now(),
            claimedBy: "",
          }
        : null;
    }
    saveStudioChatsStore(store);
    syncAgentProfileFlags(loadStudioSettings(), store.chats, store);
    const state = getStudioState(key);
    broadcastStudioSettings(state);
    return { ok: true, chatKey: key, agentProfile: prof, state };
  });
  ipcMain.handle("agy-studio:list-system-fonts", () => {
    try {
      const ws = loadWorkshopMod();
      if (ws && typeof ws.listSystemFonts === "function") {
        return { ok: true, fonts: ws.listSystemFonts() };
      }
    } catch {}
    return { ok: true, fonts: ["Segoe UI", "Inter", "JetBrains Mono", "Consolas", "Georgia", "Arial"] };
  });
  ipcMain.handle("agy-studio:workshop-list", (_event, payload) => {
    try {
      const ws = loadWorkshopMod();
      if (!ws) return { ok: false, error: "WORKSHOP_UNAVAILABLE" };
      return ws.listCustomizations(payload && typeof payload === "object" ? payload : {});
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "WORKSHOP_LIST_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:workshop-save-rule", (_event, payload) => {
    try {
      const ws = loadWorkshopMod();
      if (!ws) return { ok: false, error: "WORKSHOP_UNAVAILABLE" };
      return ws.saveRule(payload && typeof payload === "object" ? payload : {});
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "RULE_SAVE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:workshop-delete-rule", (_event, payload) => {
    try {
      const ws = loadWorkshopMod();
      if (!ws) return { ok: false, error: "WORKSHOP_UNAVAILABLE" };
      return ws.deleteRule(payload && typeof payload === "object" ? payload : {});
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "RULE_DELETE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:workshop-save-skill", (_event, payload) => {
    try {
      const ws = loadWorkshopMod();
      if (!ws) return { ok: false, error: "WORKSHOP_UNAVAILABLE" };
      return ws.saveSkill(payload && typeof payload === "object" ? payload : {});
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "SKILL_SAVE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:workshop-save-mcp", (_event, payload) => {
    try {
      const ws = loadWorkshopMod();
      if (!ws) return { ok: false, error: "WORKSHOP_UNAVAILABLE" };
      return ws.saveMcpServer(payload && typeof payload === "object" ? payload : {});
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "MCP_SAVE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:workshop-delete-mcp", (_event, payload) => {
    try {
      const ws = loadWorkshopMod();
      if (!ws) return { ok: false, error: "WORKSHOP_UNAVAILABLE" };
      return ws.deleteMcpServer(payload && typeof payload === "object" ? payload : {});
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "MCP_DELETE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:open-path", async (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const rawPath = typeof p.path === "string" ? p.path.trim() : "";
    if (!rawPath) return { ok: false, error: "EMPTY_PATH" };
    try {
      const target = path.resolve(rawPath);
      if (fs.existsSync(target) && shell) {
        if (fs.statSync(target).isDirectory() && typeof shell.openPath === "function") {
          await shell.openPath(target);
        } else if (typeof shell.showItemInFolder === "function") {
          shell.showItemInFolder(target);
        }
        return { ok: true };
      }
      return { ok: false, error: "NOT_FOUND" };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "OPEN_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:capture-window-screenshot", async (event) => {
    try {
      const wc = event && event.sender && typeof event.sender.capturePage === "function"
        ? event.sender
        : (getHubZoomTargets()[0] || null);
      if (!wc || typeof wc.capturePage !== "function") return { ok: false, error: "CAPTURE_UNAVAILABLE" };
      const img = await wc.capturePage();
      if (!img || (typeof img.isEmpty === "function" && img.isEmpty())) return { ok: false, error: "EMPTY_CAPTURE" };
      return { ok: true, dataUrl: img.toDataURL() };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "CAPTURE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:read-clipboard-image", () => {
    try {
      if (!clipboard || typeof clipboard.readImage !== "function") return { ok: false, error: "CLIPBOARD_UNAVAILABLE" };
      const img = clipboard.readImage();
      if (!img || (typeof img.isEmpty === "function" && img.isEmpty())) return { ok: false, empty: true };
      return { ok: true, dataUrl: img.toDataURL() };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "CLIPBOARD_READ_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:write-clipboard-image", (_event, payload) => {
    try {
      const dataUrl = payload && typeof payload.dataUrl === "string" ? payload.dataUrl : "";
      if (!dataUrl.startsWith("data:image/") || !clipboard || !nativeImage || typeof nativeImage.createFromDataURL !== "function") {
        return { ok: false, error: "INVALID_IMAGE" };
      }
      const img = nativeImage.createFromDataURL(dataUrl);
      if (!img || (typeof img.isEmpty === "function" && img.isEmpty())) return { ok: false, error: "EMPTY_IMAGE" };
      clipboard.writeImage(img);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "CLIPBOARD_WRITE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:clear-focused-input", (event) => {
    try {
      const wc = event && event.sender;
      if (!wc || (typeof wc.isDestroyed === "function" && wc.isDestroyed())) return { ok: false };
      if (typeof wc.selectAll === "function") wc.selectAll();
      if (typeof wc.delete === "function") wc.delete();
      return { ok: true };
    } catch (_err) {
      return { ok: false };
    }
  });
  ipcMain.handle("agy-studio:insert-text-into-focused", async (event, payload) => {
    try {
      const text = payload && typeof payload.text === "string" ? payload.text : "";
      if (!text) return { ok: false };
      const wc = event && event.sender;
      if (!wc || (typeof wc.isDestroyed === "function" && wc.isDestroyed()) || typeof wc.insertText !== "function") {
        return { ok: false };
      }
      await wc.insertText(text);
      return { ok: true };
    } catch (_err) {
      return { ok: false };
    }
  });
  ipcMain.handle("agy-studio:save-composer-draft", (_event, payload) => {
    try {
      return saveComposerDraft(payload);
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "DRAFT_SAVE_FAILED" };
    }
  });
  ipcMain.on("agy-studio:save-composer-draft-sync", (_event, payload) => {
    try {
      saveComposerDraft(payload);
    } catch {}
  });
  ipcMain.handle("agy-studio:get-composer-draft", (_event, payload) => {
    try {
      const p = payload && typeof payload === "object" ? payload : {};
      return getComposerDraftWithData(p.chatKey);
    } catch (err) {
      return { ok: false, draft: null, error: err && err.message ? err.message : "DRAFT_READ_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:clear-composer-draft", (_event, payload) => {
    try {
      return clearComposerDraft(payload);
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "DRAFT_CLEAR_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:record-input-history", (_event, payload) => {
    try {
      return recordInputHistoryItem(payload);
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "HISTORY_RECORD_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:get-input-history", () => {
    try {
      return getInputHistoryForUi();
    } catch (err) {
      return { ok: false, items: [], error: err && err.message ? err.message : "HISTORY_READ_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:delete-input-history-item", (_event, payload) => {
    try {
      const p = payload && typeof payload === "object" ? payload : {};
      return deleteInputHistoryItem(p.id);
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "HISTORY_DELETE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:clear-input-history", () => {
    try {
      return clearInputHistory();
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "HISTORY_CLEAR_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:copy-history-text", (_event, payload) => {
    try {
      const text = payload && typeof payload.text === "string" ? payload.text : "";
      if (!text || !clipboard || typeof clipboard.writeText !== "function") return { ok: false };
      clipboard.writeText(text);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "CLIPBOARD_WRITE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:copy-history-file", async (_event, payload) => {
    try {
      const p = payload && typeof payload === "object" ? payload : {};
      const safeName = typeof p.fileName === "string" ? path.basename(p.fileName.trim()) : "";
      if (!safeName || safeName !== String(p.fileName || "").trim()) return { ok: false, error: "INVALID_FILE" };
      const histDir = getInputHistoryMediaDir();
      const fullPath = path.resolve(path.join(histDir, safeName));
      if (!fullPath.startsWith(path.resolve(histDir) + path.sep) || !fs.existsSync(fullPath)) {
        return { ok: false, error: "FILE_NOT_FOUND" };
      }
      const mode = p.mode || "clipboard";
      const mime = typeof p.mime === "string" && p.mime ? p.mime.toLowerCase() : "application/octet-stream";
      const isImage = Boolean(p.isImage || mime.startsWith("image/") || /\.(?:png|jpe?g|webp|gif|bmp)$/i.test(safeName));
      if (mode === "reveal") {
        if (shell && typeof shell.showItemInFolder === "function") shell.showItemInFolder(fullPath);
        return { ok: true };
      }
      if (mode === "dataUrl") {
        const buf = fs.readFileSync(fullPath);
        return {
          ok: true,
          name: typeof p.name === "string" && p.name ? p.name : safeName,
          mime,
          isImage,
          dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
        };
      }
      if (isImage && clipboard && nativeImage && typeof nativeImage.createFromPath === "function") {
        const img = nativeImage.createFromPath(fullPath);
        if (img && !(typeof img.isEmpty === "function" && img.isEmpty())) {
          clipboard.writeImage(img);
          return { ok: true, copiedAs: "image" };
        }
      }
      const res = await copyFileToWindowsClipboard(fullPath);
      return Object.assign({ ok: true, copiedAs: "file" }, res);
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "COPY_FILE_FAILED" };
    }
  });
  ipcMain.handle("agy-studio:export-config-json", async () => {
    if (!dialog || typeof dialog.showSaveDialog !== "function") return { ok: false, error: "DIALOG_UNAVAILABLE" };
    const parentWin = getFocusedOrFirstWindow();
    const res = await dialog.showSaveDialog(parentWin, {
      title: tr("Экспорт профиля Rudex", "Export Rudex Profile"),
      defaultPath: path.join(os.homedir(), "Desktop", "rudex-profile-v5.json"),
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!res || res.canceled || !res.filePath) return { ok: false, canceled: true };
    const s = loadStudioSettings();
    const bundle = {
      format: "rudex-profile-v5",
      exportedAt: new Date().toISOString(),
      settings: s,
    };
    writeJsonAtomic(res.filePath, bundle);
    return { ok: true, filePath: res.filePath };
  });
  ipcMain.handle("agy-studio:import-config-json", async () => {
    if (!dialog || typeof dialog.showOpenDialog !== "function") return { ok: false, error: "DIALOG_UNAVAILABLE" };
    const parentWin = getFocusedOrFirstWindow();
    const res = await dialog.showOpenDialog(parentWin, {
      title: tr("Импорт профиля Rudex", "Import Rudex Profile"),
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!res || res.canceled || !Array.isArray(res.filePaths) || !res.filePaths[0]) return { ok: false, canceled: true };
    try {
      const parsed = JSON.parse(fs.readFileSync(res.filePaths[0], "utf8"));
      const rawSettings = parsed && parsed.settings && typeof parsed.settings === "object" ? parsed.settings : parsed;
      if (!rawSettings || typeof rawSettings !== "object") return { ok: false, error: "INVALID_PROFILE" };
      saveStudioSettings(rawSettings);
      const state = getStudioState(lastActiveChatKey);
      broadcastStudioSettings(state);
      return { ok: true, state };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "IMPORT_FAILED" };
    }
  });
}

exports.getLocale = getLocale;
exports.setLocale = setLocale;
exports.toggleLocale = toggleLocale;
exports.toggleLocaleFromHotkey = toggleLocaleFromHotkey;
exports.togglePanelFromHotkey = togglePanelFromHotkey;
exports.toggleLiveEditFromHotkey = toggleLiveEditFromHotkey;
exports.handleKeybindingEvent = handleKeybindingEvent;
exports.matchInputToCombo = matchInputToCombo;
exports.sanitizeLimitsWidget = sanitizeLimitsWidget;
exports.sanitizeKeybindings = sanitizeKeybindings;
exports.sanitizeAgentProfile = sanitizeAgentProfile;
exports.DEFAULT_LIMITS_WIDGET = DEFAULT_LIMITS_WIDGET;
exports.DEFAULT_KEYBINDINGS = DEFAULT_KEYBINDINGS;
exports.DEFAULT_AGENT_PROFILE = DEFAULT_AGENT_PROFILE;
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
exports.sanitizeStudioSettings = sanitizeStudioSettings;
exports.sanitizeAppearance = sanitizeAppearance;
exports.sanitizeUiStyle = sanitizeUiStyle;
exports.formatLiveResetRemaining = formatLiveResetRemaining;
exports.buildQuotaSummary = buildQuotaSummary;
exports.saveQuotaStore = saveQuotaStore;
exports.loadQuotaStore = loadQuotaStore;
exports.applyAppScaleToWindows = applyAppScaleToWindows;
exports.saveComposerDraft = saveComposerDraft;
exports.getComposerDraftWithData = getComposerDraftWithData;
exports.clearComposerDraft = clearComposerDraft;
exports.recordInputHistoryItem = recordInputHistoryItem;
exports.getInputHistoryForUi = getInputHistoryForUi;
exports.deleteInputHistoryItem = deleteInputHistoryItem;
exports.clearInputHistory = clearInputHistory;
