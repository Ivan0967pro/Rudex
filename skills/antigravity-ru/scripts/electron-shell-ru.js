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
const { app, ipcMain, webContents, dialog, shell, protocol, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

let cachedLocale = null;
let ipcRegistered = false;
let mediaProtocolRegistered = false;
let lastHotkeyAt = 0;
let lastPanelHotkeyAt = 0;
let lastLiveEditHotkeyAt = 0;
let liveEditWatcherTimer = null;
let liveEditLastSig = "";
let liveEditWatchUntil = 0;
const listeners = new Set();
let uiMaps = null;

const MAX_PERSONA_BODY_BYTES = 23000;
const FIVE_HOUR_MS = 5 * 60 * 60 * 1000;
const SEVEN_DAY_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_TRANSCRIPT_UNITS_PER_1PCT_5H = 50000;
const DEFAULT_TRANSCRIPT_UNITS_PER_1PCT_WEEKLY = 225000;
const transcriptSummaryCache = new Map();
const DEFAULT_MINI_FIELDS = {
  status: true,
  lang: true,
  tps: true,
  respTokens: false,
  chatTokens: false,
  model: false,
  quota: false,
};
const VALID_APPEARANCE_PRESETS = new Set(["native", "obsidian-glass", "midnight-neon", "warm-contrast", "light-paper", "custom"]);
const VALID_WALLPAPER_TYPES = new Set(["none", "gradient", "image", "video"]);
const VALID_GRADIENT_PRESETS = new Set(["aurora", "cosmic", "sunset", "emerald", "cyber", "silk"]);
const VALID_UI_FONTS = new Set(["system", "segoe", "inter", "rubik", "ibm-plex", "georgia"]);
const VALID_MONO_FONTS = new Set(["system", "cascadia", "jetbrains", "consolas", "fira"]);
const VALID_DENSITIES = new Set(["compact", "comfortable", "spacious"]);
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

const DEFAULT_APPEARANCE = {
  presetId: "native",
  uiPolish: true,
  accentColor: "#3b82f6",
  canvasBg: "#09090b",
  cardBg: "#131316",
  glassOpacity: 78,
  glassBlur: 12,
  messageCardOpacity: 74,
  highContrastText: true,
  radius: 12,
  wallpaper: {
    type: "none",
    gradientPreset: "aurora",
    gradColors: ["#0f172a", "#1e1b4b", "#09090b"],
    gradAngle: 135,
    gradAnimated: true,
    gradSpeed: 18,
    mediaFile: "",
    mediaUrl: "",
    mediaMime: "",
    dim: 45,
    blur: 0,
    opacity: 85,
    scale: 100,
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

const DEFAULT_STUDIO_SETTINGS = {
  panelEnabled: true,
  pinned: false,
  viewMode: "mini",
  layoutMode: "docked",
  dockPosition: "bottom-right",
  floatX: null,
  floatY: null,
  miniFields: DEFAULT_MINI_FIELDS,
  showMiniTps: true,
  trackHistory: true,
  personaEnabled: false,
  personaActivePreset: "custom",
  personaText: "",
  customPresets: [],
  appearance: DEFAULT_APPEARANCE,
  appearanceProfiles: [],
};

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
  if (!s || !s.startsWith("agy-media://local/")) return "";
  return s.slice(0, 240);
}

function sanitizeAppearance(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const presetId = VALID_APPEARANCE_PRESETS.has(src.presetId) ? src.presetId : "native";
  const wpSrc = src.wallpaper && typeof src.wallpaper === "object" ? src.wallpaper : {};
  const wpType = VALID_WALLPAPER_TYPES.has(wpSrc.type) ? wpSrc.type : "none";
  const gradientPreset = VALID_GRADIENT_PRESETS.has(wpSrc.gradientPreset) ? wpSrc.gradientPreset : "aurora";
  const rawGc = Array.isArray(wpSrc.gradColors) ? wpSrc.gradColors : DEFAULT_APPEARANCE.wallpaper.gradColors;
  const gradColors = [
    sanitizeHexColor(rawGc[0], "#0f172a"),
    sanitizeHexColor(rawGc[1], "#1e1b4b"),
    sanitizeHexColor(rawGc[2], "#09090b"),
  ];
  const mediaUrl = sanitizeMediaUrl(wpSrc.mediaUrl);
  const mediaFile = mediaUrl && typeof wpSrc.mediaFile === "string" && SAFE_MEDIA_FILE_RE.test(wpSrc.mediaFile.trim())
    ? wpSrc.mediaFile.trim()
    : "";
  const tySrc = src.typography && typeof src.typography === "object" ? src.typography : {};
  const rawW = Math.round(clampNum(tySrc.chatMaxWidth, 0, 1200, 0));
  const chatMaxWidth = rawW > 0 && rawW < 680 ? 680 : rawW;
  const lineHeight = Math.round(clampNum(tySrc.lineHeight, 1.25, 1.9, 1.55) * 100) / 100;
  return {
    presetId,
    uiPolish: src.uiPolish !== false,
    accentColor: sanitizeHexColor(src.accentColor, DEFAULT_APPEARANCE.accentColor),
    canvasBg: sanitizeHexColor(src.canvasBg, DEFAULT_APPEARANCE.canvasBg),
    cardBg: sanitizeHexColor(src.cardBg, DEFAULT_APPEARANCE.cardBg),
    glassOpacity: Math.round(clampNum(src.glassOpacity, 25, 100, DEFAULT_APPEARANCE.glassOpacity)),
    glassBlur: Math.round(clampNum(src.glassBlur, 0, 24, DEFAULT_APPEARANCE.glassBlur)),
    messageCardOpacity: Math.round(clampNum(src.messageCardOpacity, 0, 96, DEFAULT_APPEARANCE.messageCardOpacity)),
    highContrastText: src.highContrastText !== false,
    radius: Math.round(clampNum(src.radius, 4, 20, DEFAULT_APPEARANCE.radius)),
    wallpaper: {
      type: wpType,
      gradientPreset,
      gradColors,
      gradAngle: Math.round(clampNum(wpSrc.gradAngle, 0, 360, 135)),
      gradAnimated: wpSrc.gradAnimated !== false,
      gradSpeed: Math.round(clampNum(wpSrc.gradSpeed, 6, 40, 18)),
      mediaFile,
      mediaUrl,
      mediaMime: typeof wpSrc.mediaMime === "string" ? wpSrc.mediaMime.slice(0, 60) : "",
      dim: Math.round(clampNum(wpSrc.dim, 0, 85, 45)),
      blur: Math.round(clampNum(wpSrc.blur, 0, 24, 0)),
      opacity: Math.round(clampNum(wpSrc.opacity, 15, 100, 85)),
      scale: Math.round(clampNum(wpSrc.scale, 100, 130, 100)),
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

function getPluginPersonaRulePath() {
  return path.join(os.homedir(), ".gemini", "config", "plugins", "antigravity-ru", "rules", "AGENTS.md");
}

function getLegacyPersonaRulePath() {
  return path.join(os.homedir(), ".gemini", "config", "rules", "antigravity-ru-persona.md");
}

function isPluginInstalled() {
  try {
    return fs.existsSync(path.join(os.homedir(), ".gemini", "config", "plugins", "antigravity-ru", "plugin.json"));
  } catch {
    return false;
  }
}

function getPersonaRulePath() {
  return isPluginInstalled() ? getPluginPersonaRulePath() : getLegacyPersonaRulePath();
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
          if (!title || !rawBody) return null;
          return {
            id: typeof item.id === "string" && item.id ? item.id : "custom-" + idx,
            title,
            body: rawBody.slice(0, MAX_PERSONA_BODY_BYTES),
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
    customPresets: presets,
    appearance: sanitizeAppearance(src.appearance),
    appearanceProfiles: sanitizeAppearanceProfiles(src.appearanceProfiles),
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
  const pObj = patch && typeof patch === "object" ? Object.assign({}, patch) : {};
  if (pObj.miniFields && typeof pObj.miniFields === "object") {
    pObj.miniFields = Object.assign({}, current.miniFields, pObj.miniFields);
  }
  if (pObj.appearance && typeof pObj.appearance === "object") {
    const curApp = current.appearance || DEFAULT_APPEARANCE;
    pObj.appearance = Object.assign({}, curApp, pObj.appearance, {
      wallpaper: Object.assign({}, curApp.wallpaper, pObj.appearance.wallpaper || {}),
      typography: Object.assign({}, curApp.typography, pObj.appearance.typography || {}),
    });
  }
  const next = sanitizeStudioSettings(Object.assign({}, current, pObj));
  try {
    const p = getStudioSettingsPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(next, null, 2) + "\\n", "utf8");
  } catch (err) {
    console.warn("[i18nMain] Failed to persist studio settings:", err && err.message ? err.message : err);
  }
  return next;
}

const MAX_STORED_CHATS = 120;

function getStudioChatsPath() {
  return path.join(app.getPath("userData"), "agy_studio_chats.json");
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
  if (h.avgTps >= 900 || h.peakTps >= 900) return true;
  if (h.durSec > 0 && h.durSec <= 0.25 && h.avgTps >= 450) return true;
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
        .map((h) => ({
          model: typeof h.model === "string" ? h.model.slice(0, 96) : "",
          tokens: toNonNegInt(h.tokens),
          durSec: toNonNegFloat(h.durSec),
          avgTps: toNonNegInt(h.avgTps),
          peakTps: toNonNegInt(h.peakTps),
          at: typeof h.at === "string" ? h.at.slice(0, 20) : "",
        }))
    : [];
  const history = rawHist.filter((h) => !isBogusHydrationSpikeEntry(h));
  let lastAvgTps = toNonNegInt(src.lastAvgTps);
  let peakTps = toNonNegInt(src.peakTps);
  let lastDurSec = toNonNegFloat(src.lastDurSec);
  const respTokens = toNonNegInt(src.respTokens);
  const hasBogusMetric = lastAvgTps >= 900 || peakTps >= 900 || (lastDurSec > 0 && lastDurSec <= 0.25 && lastAvgTps >= 450);
  if (hasBogusMetric) {
    lastAvgTps = history[0] ? history[0].avgTps : 0;
    lastDurSec = history[0] ? history[0].durSec : 0;
    peakTps = history.reduce((mx, it) => Math.max(mx, it.peakTps < 900 ? (it.peakTps || 0) : 0), 0);
    if (samples.length === 0 && lastAvgTps > 0) {
      samples = [lastAvgTps];
    }
  }
  return {
    lastAvgTps,
    peakTps,
    lastDurSec,
    lastThinkingSec: toNonNegFloat(src.lastThinkingSec),
    respTokens,
    chatTokens: toNonNegInt(src.chatTokens),
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
    telemetry: sanitizeChatTelemetry(src.telemetry),
    quota: sanitizeChatQuota(src.quota),
  };
}

function loadStudioChats() {
  try {
    const p = getStudioChatsPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      const srcChats = parsed && typeof parsed === "object" && parsed.chats && typeof parsed.chats === "object" ? parsed.chats : {};
      const out = {};
      for (const k of Object.keys(srcChats)) {
        const nk = normalizeChatKey(k);
        if (nk === "__new__") continue;
        out[nk] = sanitizeChatRecord(srcChats[k]);
      }
      return out;
    }
  } catch {}
  return {};
}

function saveStudioChats(chatsMap) {
  const src = chatsMap && typeof chatsMap === "object" ? chatsMap : {};
  const entries = Object.keys(src)
    .filter((k) => k && k !== "__new__")
    .map((k) => [k, sanitizeChatRecord(src[k])])
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
    .slice(0, MAX_STORED_CHATS);
  const pruned = {};
  for (const pair of entries) {
    pruned[pair[0]] = pair[1];
  }
  try {
    const p = getStudioChatsPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ version: 1, chats: pruned }, null, 2) + "\\n", "utf8");
  } catch (err) {
    console.warn("[i18nMain] Failed to persist studio chats:", err && err.message ? err.message : err);
  }
  return pruned;
}

function stripRuleFrontmatter(md) {
  return String(md || "").replace(/^---\\r?\\n[\\s\\S]*?\\r?\\n---\\r?\\n*/, "");
}

function formatPersonaRuleContent(trimmed, usePlugin) {
  const header = usePlugin ? "" : "---\\ntrigger: always_on\\n---\\n\\n";
  const body = [
    "# Active Chat Persona & Response Rules (Antigravity Studio)",
    "",
    "You MUST follow every instruction inside <user_persona> strictly, completely, and consistently in EVERY user-facing message of this conversation (orchestrator, planner, executor, and all subagents), including after tool calls, long multi-step runs, and status updates:",
    "",
    "<user_persona>",
    trimmed,
    "</user_persona>",
    "",
    "## Strict Adherence Requirements",
    "- **Full compliance from first word to last:** Adopt the exact persona, voice, tone, directness, formatting, and length preferences specified above in every paragraph and sentence of your response.",
    "- **No silent drift or unrequested hedging:** Never revert to a bland default voice after calling tools or subagents, and do not add unsolicited lectures, caveats, or stylistic filler that contradict the active <user_persona>.",
    "- **Factual precision preserved:** While writing 100% of prose strictly in the active style/persona, keep all code blocks, file paths, commands, and verified facts accurate.",
    "",
  ].join("\\n");
  return header + body;
}

function syncPersonaRuleFile(enabled, text) {
  const usePlugin = isPluginInstalled();
  const rulePath = usePlugin ? getPluginPersonaRulePath() : getLegacyPersonaRulePath();
  const otherPath = usePlugin ? getLegacyPersonaRulePath() : getPluginPersonaRulePath();
  try {
    if (fs.existsSync(otherPath)) {
      fs.unlinkSync(otherPath);
    }
  } catch {}
  const trimmed = String(text || "").trim();
  if (!enabled || !trimmed) {
    try {
      if (fs.existsSync(rulePath)) {
        fs.unlinkSync(rulePath);
      }
    } catch (err) {
      return { ok: false, exists: fs.existsSync(rulePath), byteLength: 0, error: err && err.message ? err.message : String(err), rulePath };
    }
    return { ok: !fs.existsSync(rulePath), exists: fs.existsSync(rulePath), byteLength: 0, rulePath };
  }
  const bodyBytes = Buffer.byteLength(trimmed, "utf8");
  if (bodyBytes > MAX_PERSONA_BODY_BYTES) {
    return { ok: false, exists: fs.existsSync(rulePath), byteLength: bodyBytes, error: "EXCEEDS_BYTE_LIMIT", rulePath };
  }
  const content = formatPersonaRuleContent(trimmed, usePlugin);
  try {
    fs.mkdirSync(path.dirname(rulePath), { recursive: true });
    const tmpRule = rulePath + ".tmp";
    fs.writeFileSync(tmpRule, content, "utf8");
    fs.renameSync(tmpRule, rulePath);
    const verified = fs.existsSync(rulePath);
    return { ok: verified, exists: verified, byteLength: Buffer.byteLength(content, "utf8"), rulePath };
  } catch (err) {
    try {
      fs.writeFileSync(rulePath, content, "utf8");
      const verifiedFallback = fs.existsSync(rulePath);
      return { ok: verifiedFallback, exists: verifiedFallback, byteLength: Buffer.byteLength(content, "utf8"), rulePath };
    } catch {}
    return { ok: false, exists: fs.existsSync(rulePath), byteLength: bodyBytes, error: err && err.message ? err.message : String(err), rulePath };
  }
}

function getStudioQuotaPath() {
  return path.join(app.getPath("userData"), "agy_studio_quota.json");
}

function classifyModelFamily(modelName) {
  const s = String(modelName || "");
  return /claude|sonnet|opus|haiku|gpt|openai|\\bo[134]\\b/i.test(s) ? "claudeGpt" : "gemini";
}

function getModelQuotaWeight(modelName) {
  const s = String(modelName || "").toLowerCase();
  if (/flash[_\\s-]?lite|\\bmini\\b/.test(s)) return 0.35;
  if (/flash/.test(s)) return 0.6;
  if (/opus/.test(s)) return 1.8;
  if (/\\b(pro|neon|ultra)\\b|high|высок|сверхвысок/.test(s)) return 1.35;
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
  try {
    const p = getStudioQuotaPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      const fams = parsed && typeof parsed === "object" && parsed.families ? parsed.families : {};
      return {
        version: 1,
        resetAt: toNonNegInt(parsed && parsed.resetAt),
        families: {
          gemini: sanitizeQuotaFamilyState("gemini", fams.gemini),
          claudeGpt: sanitizeQuotaFamilyState("claudeGpt", fams.claudeGpt),
        },
      };
    }
  } catch {}
  return {
    version: 1,
    resetAt: 0,
    families: {
      gemini: defaultQuotaFamilyState("gemini"),
      claudeGpt: defaultQuotaFamilyState("claudeGpt"),
    },
  };
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
  try {
    const p = getStudioQuotaPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(normalized, null, 2) + "\\n", "utf8");
  } catch (err) {
    console.warn("[i18nMain] Failed to persist studio quota:", err && err.message ? err.message : err);
  }
  return normalized;
}

function parseResetDurationMs(rawStr) {
  const s = String(rawStr || "").trim().toLowerCase();
  if (!s) return 0;
  let totalMs = 0;
  const re = /(\\d+(?:[.,]\\d+)?)\\s*(?:дн[а-яё]*|д\\.?|days?|d\\b|час[а-яё]*|ч\\.?|hours?|hrs?|h\\b|мин[а-яё]*|м\\.?|minutes?|mins?|m\\b|сек[а-яё]*|с\\.?|seconds?|secs?|s\\b)/gi;
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

function readTranscriptStepsCached(lp, mtimeMs, size) {
  const cacheKey = lp + ":" + Math.round(mtimeMs) + ":" + size;
  const cached = transcriptSummaryCache.get(cacheKey);
  if (cached) return cached;
  let steps = [];
  let titleGuess = "";
  try {
    const raw = fs.readFileSync(lp, "utf8");
    const lines = raw.split(/\\r?\\n/);
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
      if (!titleGuess && o.type === "USER_INPUT" && contentStr.trim()) {
        const cleanU = contentStr.replace(/\\s+/g, " ").trim();
        if (cleanU && !cleanU.startsWith("<")) {
          titleGuess = cleanU.slice(0, 60);
        }
      }
      const stepOutTok = Math.max(20, Math.round((contentStr.length + thinkStr.length + toolsStr.length) / 3.5));
      if (o.type === "PLANNER_RESPONSE") {
        const ctxTok = Math.min(120000, 10000 + runningCtxTok);
        const stepUnits = Math.round(stepOutTok + ctxTok * 0.10);
        steps.push({ ts: Number.isFinite(ts) && ts > 0 ? ts : mtimeMs, units: stepUnits });
      }
      runningCtxTok = Math.min(180000, runningCtxTok + Math.round((contentStr.length + toolsStr.length) / 3.5));
    }
  } catch {}
  const entry = { steps, titleGuess, mtimeMs };
  if (transcriptSummaryCache.size > 260) {
    transcriptSummaryCache.clear();
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

function buildQuotaSummary(activeChatKey) {
  const store = loadQuotaStore();
  const chats = loadStudioChats();
  const normActive = normalizeChatKey(activeChatKey);
  const nowMs = Date.now();
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
    const modelName = (rec.telemetry && rec.telemetry.modelName) || (rec.quota.claudeGpt.lastModel) || (rec.quota.gemini.lastModel) || "";
    const hasCla = rec.quota.claudeGpt.turns > 0 || (modelName && classifyModelFamily(modelName) === "claudeGpt");
    const primaryFamily = hasCla && rec.quota.claudeGpt.lastTurnAt >= rec.quota.gemini.lastTurnAt ? "claudeGpt" : "gemini";
    const famWeight = Math.max(0.4, getModelQuotaWeight(modelName));
    const famBounds = bounds[primaryFamily];

    let unitsWeekly = 0;
    let units5h = 0;
    let turns = (rec.quota.gemini.turns || 0) + (rec.quota.claudeGpt.turns || 0);
    let lastStepTs = 0;
    if (disk) {
      let rawW = 0;
      let raw5 = 0;
      let stepsW = 0;
      let steps5 = 0;
      for (let i = 0; i < disk.steps.length; i += 1) {
        const stp = disk.steps[i];
        if (stp.ts < resetWm) continue;
        if (stp.ts >= famBounds.weeklyStartMs) {
          rawW += stp.units;
          stepsW += 1;
          if (stp.ts > lastStepTs) lastStepTs = stp.ts;
        }
        if (stp.ts >= famBounds.fiveHourStartMs) {
          raw5 += stp.units;
          steps5 += 1;
          if (stp.ts > lastStepTs) lastStepTs = stp.ts;
        }
      }
      unitsWeekly = Math.round(rawW * famWeight);
      units5h = Math.round(raw5 * famWeight);
      turns = Math.max(turns, stepsW, steps5);
    } else {
      const fqPrimary = rec.quota[primaryFamily];
      unitsWeekly = fqPrimary.weightedTokens || 0;
      const recent = Array.isArray(fqPrimary.recentTurns) ? fqPrimary.recentTurns : [];
      for (let i = 0; i < recent.length; i += 1) {
        if (recent[i].ts >= famBounds.fiveHourStartMs && recent[i].ts >= resetWm) {
          units5h += recent[i].wt || 0;
        }
      }
    }
    familyTotals[primaryFamily].unitsWeekly += unitsWeekly;
    familyTotals[primaryFamily].units5h += units5h;
    chatMeta.set(key, { rec, disk, lastStepTs, modelName, primaryFamily, unitsWeekly, units5h, turns });
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
    const { rec, disk, lastStepTs, modelName, primaryFamily, unitsWeekly, units5h, turns } = info;
    const rateInfo = rates[primaryFamily];
    const famState = store.families[primaryFamily];
    const fq = rec.quota[primaryFamily];

    let weeklyPct = 0;
    if (rateInfo.usedWeeklyReal !== null && rateInfo.totW > 0 && unitsWeekly > 0) {
      weeklyPct = toQuotaPct(rateInfo.usedWeeklyReal * (unitsWeekly / rateInfo.totW));
    } else if (unitsWeekly > 0) {
      weeklyPct = toQuotaPct(unitsWeekly / Math.max(20000, rateInfo.unitsPer1PctWeekly));
    }
    if (fq.observedWeeklyPct > weeklyPct) weeklyPct = fq.observedWeeklyPct;

    let fiveHourWindowPct = 0;
    if (rateInfo.used5hReal !== null && rateInfo.tot5 > 0 && units5h > 0) {
      fiveHourWindowPct = toQuotaPct(rateInfo.used5hReal * (units5h / rateInfo.tot5));
    } else if (units5h > 0) {
      fiveHourWindowPct = toQuotaPct(units5h / Math.max(8000, rateInfo.unitsPer1Pct5h));
    }
    const fiveHourPct = Math.max(fiveHourWindowPct, fq.observedFiveHourPct || 0);

    const hasActivity = turns > 0 || unitsWeekly > 0 || units5h > 0 || fiveHourPct > 0 || weeklyPct > 0;
    const displayTitle = rec.title || (disk && disk.titleGuess) || modelName || key.slice(0, 12);
    const updatedAt = Math.max(rec.updatedAt || 0, lastStepTs || (disk && disk.lastTs) || 0, fq.lastTurnAt || 0);
    const item = {
      chatKey: key,
      title: displayTitle,
      modelName,
      primaryFamily,
      turns,
      weightedTokens: Math.max(unitsWeekly, fq.weightedTokens || 0),
      fiveHourPct: toQuotaPct(fiveHourPct),
      fiveHourWindowPct: toQuotaPct(Math.min(100, fiveHourWindowPct)),
      weeklyPct: toQuotaPct(Math.min(100, weeklyPct)),
      calibrated: rateInfo.calibrated || Boolean(famState.calibrated),
      updatedAt,
      gemini: primaryFamily === "gemini" ? { fiveHourPct, weeklyPct, turns } : { fiveHourPct: 0, weeklyPct: 0, turns: 0 },
      claudeGpt: primaryFamily === "claudeGpt" ? { fiveHourPct, weeklyPct, turns } : { fiveHourPct: 0, weeklyPct: 0, turns: 0 },
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

  return {
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
  } catch {}
  return {
    locale: getLocale(),
    settings,
    personaFileExists,
    personaFilePath: rulePath,
    patchMeta: getPatchMeta(),
    quotaSummary: buildQuotaSummary("__new__"),
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
  if (parsed.protocol !== "agy-media:" || parsed.hostname !== "local") return null;
  let decoded = "";
  try {
    decoded = decodeURIComponent(parsed.pathname.replace(/^\\/+/, ""));
  } catch {
    return null;
  }
  if (!decoded || decoded.includes("/") || decoded.includes("\\\\") || decoded.includes("..")) return null;
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
  let rs = null;
  return new ReadableStream({
    start(controller) {
      rs = fs.createReadStream(fullPath, { start, end });
      rs.on("data", (chunk) => {
        try { controller.enqueue(new Uint8Array(chunk)); } catch {}
      });
      rs.on("end", () => {
        try { controller.close(); } catch {}
      });
      rs.on("error", (err) => {
        try { controller.error(err); } catch {}
      });
    },
    cancel() {
      try { if (rs) rs.destroy(); } catch {}
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
    const m = /^bytes=(\\d*)-(\\d*)$/i.exec(String(rangeHeader).trim());
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

function makeSafeExportFilename(title, chatKey) {
  const raw = (title || chatKey || "chat").trim();
  const clean = raw
    .replace(/[<>:"/\\\\|?*\\x00-\\x1f]/g, " ")
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 48);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = "" + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  return "Antigravity-" + (clean || "chat") + "-" + stamp + ".zip";
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

function getLiveEditsInboxPath() {
  return path.join(getLiveEditsDir(), "inbox.json");
}

function getLiveEditsFlagPath() {
  return path.join(getLiveEditsDir(), "pending.flag");
}

function getLiveEditsMediaDir() {
  return path.join(getLiveEditsDir(), "media");
}

function sanitizeLiveEditStatus(raw) {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s === "delivered" || s === "applied" || s === "canceled") return s;
  return "pending";
}

function loadLiveEditsInbox() {
  const inboxPath = getLiveEditsInboxPath();
  try {
    if (fs.existsSync(inboxPath)) {
      const parsed = JSON.parse(fs.readFileSync(inboxPath, "utf8"));
      if (parsed && Array.isArray(parsed.items)) {
        return {
          version: 1,
          items: parsed.items.filter((x) => x && typeof x === "object" && typeof x.id === "string").slice(-60),
        };
      }
    }
  } catch {}
  return { version: 1, items: [] };
}

function saveLiveEditsInbox(inboxObj) {
  const inboxPath = getLiveEditsInboxPath();
  const flagPath = getLiveEditsFlagPath();
  const normalized = {
    version: 1,
    items: Array.isArray(inboxObj && inboxObj.items) ? inboxObj.items.slice(-60) : [],
  };
  fs.mkdirSync(path.dirname(inboxPath), { recursive: true });
  const tmpPath = inboxPath + ".tmp-" + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(normalized, null, 2) + "\\n", "utf8");
  try {
    fs.renameSync(tmpPath, inboxPath);
  } catch {
    fs.writeFileSync(inboxPath, JSON.stringify(normalized, null, 2) + "\\n", "utf8");
    try { fs.unlinkSync(tmpPath); } catch {}
  }
  const hasPending = normalized.items.some((x) => x && x.status === "pending");
  try {
    if (hasPending) {
      fs.writeFileSync(flagPath, String(Date.now()), "utf8");
    } else if (fs.existsSync(flagPath)) {
      fs.unlinkSync(flagPath);
    }
  } catch {}
  return normalized;
}

function filterLiveEditsForChat(inbox, chatKey) {
  const norm = normalizeChatKey(chatKey);
  const all = Array.isArray(inbox && inbox.items) ? inbox.items : [];
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

function broadcastLiveEditsChanged(inboxObj) {
  const payload = {
    items: Array.isArray(inboxObj && inboxObj.items) ? inboxObj.items.slice(-30) : [],
  };
  try {
    for (const wc of webContents.getAllWebContents()) {
      if (wc && !wc.isDestroyed()) {
        wc.send("agy-studio:live-edits-changed", payload);
      }
    }
  } catch {}
}

function ensureLiveEditWatcher() {
  liveEditWatchUntil = Math.max(liveEditWatchUntil, Date.now() + 180000);
  if (liveEditWatcherTimer) return;
  liveEditWatcherTimer = setInterval(() => {
    try {
      const inboxPath = getLiveEditsInboxPath();
      let sig = "";
      if (fs.existsSync(inboxPath)) {
        const st = fs.statSync(inboxPath);
        sig = st.mtimeMs + ":" + st.size;
      }
      const inbox = loadLiveEditsInbox();
      const hasPending = inbox.items.some((x) => x && x.status === "pending");
      if (sig && sig !== liveEditLastSig) {
        liveEditLastSig = sig;
        broadcastLiveEditsChanged(inbox);
      }
      if (!hasPending && Date.now() > liveEditWatchUntil) {
        clearInterval(liveEditWatcherTimer);
        liveEditWatcherTimer = null;
      }
    } catch {}
  }, 1100);
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
    const src = imgObj.sourcePath.trim();
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
    const mimeMatch = /^data:(image\\/[a-z0-9+.-]+);base64$/i.exec(header);
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
  try {
    registerStudioMediaProtocol();
  } catch (err) {
    console.warn("[antigravity-ru] Failed to register agy-media protocol:", err && err.message ? err.message : err);
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
  ipcMain.handle("agy-studio:activate-chat", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    const titleStr = typeof p.title === "string" ? p.title.trim().slice(0, 80) : "";
    if (key === "__new__") {
      const dp = p.draftPersona && typeof p.draftPersona === "object" ? p.draftPersona : null;
      const rec = dp && dp.personaEnabled && typeof dp.personaText === "string" && dp.personaText.trim()
        ? sanitizeChatRecord({
            personaEnabled: true,
            personaActivePreset: typeof dp.personaActivePreset === "string" ? dp.personaActivePreset : "custom",
            personaText: dp.personaText,
          })
        : defaultChatRecord("");
      const syncRes = syncPersonaRuleFile(Boolean(rec.personaEnabled), rec.personaText || "");
      return { ok: true, chatKey: "__new__", chat: rec, personaFileExists: syncRes.exists, personaFilePath: syncRes.rulePath, quotaSummary: buildQuotaSummary("__new__") };
    }
    const chats = loadStudioChats();
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
      });
      changed = true;
    } else if (chats[key] && fb && fb.personaEnabled && typeof fb.personaText === "string" && fb.personaText.trim() && !chats[key].personaEnabled) {
      chats[key] = sanitizeChatRecord(Object.assign({}, chats[key], {
        title: titleStr || chats[key].title || "",
        updatedAt: Date.now(),
        personaEnabled: true,
        personaActivePreset: typeof fb.personaActivePreset === "string" ? fb.personaActivePreset : (chats[key].personaActivePreset || "custom"),
        personaText: fb.personaText,
      }));
      changed = true;
    } else if (chats[key] && titleStr && !chats[key].title) {
      chats[key].title = titleStr;
      changed = true;
    }
    if (changed) saveStudioChats(chats);
    const rec = chats[key] ? sanitizeChatRecord(chats[key]) : defaultChatRecord(titleStr);
    const syncRes = syncPersonaRuleFile(Boolean(rec.personaEnabled), rec.personaText || "");
    return { ok: true, chatKey: key, chat: rec, personaFileExists: syncRes.exists, personaFilePath: syncRes.rulePath, quotaSummary: buildQuotaSummary(key) };
  });
  ipcMain.handle("agy-studio:save-persona", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const key = normalizeChatKey(p.chatKey);
    const titleStr = typeof p.title === "string" ? p.title.trim().slice(0, 80) : "";
    const enabled = Boolean(p.personaEnabled);
    const text = typeof p.personaText === "string" ? p.personaText : "";
    const presetId = typeof p.personaActivePreset === "string" && p.personaActivePreset ? p.personaActivePreset : "custom";
    if (Array.isArray(p.customPresets)) {
      saveStudioSettings({ customPresets: p.customPresets });
    }
    const syncRes = syncPersonaRuleFile(enabled, text);
    if (!syncRes.ok) {
      return { ok: false, error: syncRes.error || "SAVE_FAILED", byteLength: syncRes.byteLength, exists: syncRes.exists, rulePath: syncRes.rulePath, state: getStudioState() };
    }
    const activeEnabled = enabled && syncRes.exists;
    let chatRec = null;
    if (key !== "__new__") {
      const chats = loadStudioChats();
      const prev = chats[key] ? sanitizeChatRecord(chats[key]) : defaultChatRecord(titleStr);
      chats[key] = sanitizeChatRecord(Object.assign({}, prev, {
        title: titleStr || prev.title || "",
        updatedAt: Date.now(),
        personaEnabled: activeEnabled,
        personaActivePreset: presetId,
        personaText: text,
      }));
      saveStudioChats(chats);
      chatRec = chats[key];
    } else {
      chatRec = sanitizeChatRecord({
        personaEnabled: activeEnabled,
        personaActivePreset: presetId,
        personaText: text,
      });
    }
    const state = getStudioState();
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
      st = fs.statSync(srcPath);
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "STAT_FAILED" };
    }
    if (!st.isFile() || st.size <= 0 || st.size > maxBytes) {
      return { ok: false, error: "FILE_TOO_LARGE" };
    }
    const mediaDir = getStudioMediaDir();
    fs.mkdirSync(mediaDir, { recursive: true });
    const rawStem = path.basename(srcPath, ext).replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^_+|_+$/g, "").slice(0, 36) || "media";
    const destName = kind + "-" + Date.now() + "-" + rawStem + ext;
    const destPath = path.join(mediaDir, destName);
    fs.copyFileSync(srcPath, destPath);
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
      const res = zipBuilder.buildChatExportArchive({
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
        includeFullLog: Boolean(p.includeFullLog),
        pluginVersion: (meta && meta.pluginVersion) || "3.1.0",
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

    return { ok: true, chatKey: key, chatQuota: chats[key].quota, summary: buildQuotaSummary(key) };
  });
  ipcMain.handle("agy-studio:sync-quota-snapshot", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const activeKey = normalizeChatKey(p.activeChatKey);
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
        }
        famState.weeklyRem = nextWeek;
      }

      if (typeof snapFam.fiveHourReset === "string" && snapFam.fiveHourReset.trim()) {
        famState.fiveHourReset = snapFam.fiveHourReset.trim().slice(0, 80);
      }
      if (typeof snapFam.weeklyReset === "string" && snapFam.weeklyReset.trim()) {
        famState.weeklyReset = snapFam.weeklyReset.trim().slice(0, 80);
      }
      famState.updatedAt = now;
    }

    if (chatsDirty) saveStudioChats(chats);
    saveQuotaStore(store);
    return { ok: true, summary: buildQuotaSummary(activeKey) };
  });
  ipcMain.handle("agy-studio:get-quota-summary", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    return buildQuotaSummary(p.chatKey);
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
    return { ok: true, summary: buildQuotaSummary(p.chatKey) };
  });
  ipcMain.handle("agy-studio:get-live-edits", (_event, payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const inbox = loadLiveEditsInbox();
    const key = normalizeChatKey(p.chatKey);
    return {
      ok: true,
      chatKey: key,
      items: filterLiveEditsForChat(inbox, key),
      allItems: inbox.items.slice(-30),
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
      agentReply: "",
    };
    const inbox = loadLiveEditsInbox();
    inbox.items.push(entry);
    const savedInbox = saveLiveEditsInbox(inbox);
    ensureLiveEditWatcher();
    broadcastLiveEditsChanged(savedInbox);
    return {
      ok: true,
      entry,
      items: filterLiveEditsForChat(savedInbox, key),
      allItems: savedInbox.items.slice(-30),
    };
  });
  ipcMain.handle("agy-studio:pick-live-edit-images", async () => {
    if (!dialog || typeof dialog.showOpenDialog !== "function") {
      return { ok: false, error: "DIALOG_UNAVAILABLE" };
    }
    const parentWin = getFocusedOrFirstWindow();
    const res = await dialog.showOpenDialog(parentWin, {
      title: tr("Выберите фото для живой правки", "Select images for live edit"),
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif"] }],
    });
    if (!res || res.canceled || !Array.isArray(res.filePaths) || res.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const items = [];
    for (let i = 0; i < Math.min(res.filePaths.length, 4); i += 1) {
      const fp = res.filePaths[i];
      try {
        const ext = path.extname(fp).toLowerCase();
        const st = fs.statSync(fp);
        if (!st.isFile() || st.size <= 0 || st.size > 15 * 1024 * 1024) continue;
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
    const inbox = loadLiveEditsInbox();
    if (!p.chatKey || key === "__new__" && p.all === true) {
      inbox.items = [];
    } else {
      inbox.items = inbox.items.filter((x) => {
        if (!x) return false;
        const xk = normalizeChatKey(x.chatKey);
        const dk = normalizeChatKey(x.deliveredConversationId);
        return xk !== key && dk !== key;
      });
    }
    const savedInbox = saveLiveEditsInbox(inbox);
    broadcastLiveEditsChanged(savedInbox);
    return { ok: true, items: filterLiveEditsForChat(savedInbox, key), allItems: savedInbox.items.slice(-30) };
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
            } else if (input.type === 'keyDown' &&
                (input.control || input.meta) &&
                input.alt &&
                !input.shift &&
                !input.isAutoRepeat &&
                (input.code === 'KeyE' || (input.key && input.key.toLowerCase() === 'e'))) {
                event.preventDefault();
                i18nMain_1.toggleLiveEditFromHotkey(contents);
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

function patchCustomSchemeJs(src, warnings) {
  return tryReplaceExact(
    src,
    `        {
            // Serves the isolated capture page and script in its own partition only;
            // never bound on defaultSession and granted no fetch, CORS, or SW.
            scheme: exports.BROWSER_STREAM_SCHEME,
            privileges: { standard: true, secure: true },
        },
    ]);`,
    `        {
            // Serves the isolated capture page and script in its own partition only;
            // never bound on defaultSession and granted no fetch, CORS, or SW.
            scheme: exports.BROWSER_STREAM_SCHEME,
            privileges: { standard: true, secure: true },
        },
        {
            scheme: 'agy-media',
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
                stream: true,
                corsEnabled: true,
            },
        },
    ]);`,
    "customScheme.js register agy-media",
    warnings
  ).text;
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
    ["customScheme.js", patchCustomSchemeJs],
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
