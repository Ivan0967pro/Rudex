"use strict";

const THEME_PRESETS = [
  {
    id: "native",
    nameRu: "Стандартная Antigravity",
    nameEn: "Native Antigravity",
    descRu: "Оригинальная палитра без переопределений",
    descEn: "Original palette without overrides",
    mode: "native",
    vars: {
      accentColor: "#2563eb",
      canvasBg: "#0c0c0e",
      cardBg: "#131316",
      sidebarBg: "#0f0f12",
      fgColor: "#ececef",
      mutedColor: "#9a9aa6",
      borderColor: "#27272e",
      glassOpacity: 82,
      glassBlur: 12,
      radius: 12,
    },
  },
  {
    id: "obsidian-glass",
    nameRu: "Обсидиановое стекло",
    nameEn: "Obsidian Glass",
    descRu: "Глубокий тёмный неон и матовые стеклянные карточки",
    descEn: "Deep obsidian tones with frosted glass cards",
    mode: "dark",
    vars: {
      accentColor: "#3b82f6",
      canvasBg: "#09090b",
      cardBg: "#121216",
      sidebarBg: "#0d0d11",
      fgColor: "#f1f2f6",
      mutedColor: "#9aa0b0",
      borderColor: "#262833",
      glassOpacity: 74,
      glassBlur: 14,
      radius: 12,
    },
  },
  {
    id: "midnight-neon",
    nameRu: "Полуночный неон",
    nameEn: "Midnight Neon",
    descRu: "Индиго-палитра с мягким акцентом и свечением фокуса",
    descEn: "Deep indigo glass with subtle luminous focus ring",
    mode: "dark",
    vars: {
      accentColor: "#6366f1",
      canvasBg: "#070814",
      cardBg: "#0f1224",
      sidebarBg: "#0b0d1b",
      fgColor: "#eef2ff",
      mutedColor: "#94a3b8",
      borderColor: "#232949",
      glassOpacity: 76,
      glassBlur: 16,
      radius: 14,
    },
  },
  {
    id: "warm-contrast",
    nameRu: "Тёплый графит",
    nameEn: "Warm Contrast",
    descRu: "Мягкий тёмно-янтарный графит с высокой читаемостью",
    descEn: "Warm charcoal surfaces with crisp contrast",
    mode: "dark",
    vars: {
      accentColor: "#f59e0b",
      canvasBg: "#12100e",
      cardBg: "#1b1815",
      sidebarBg: "#161310",
      fgColor: "#f5f1ea",
      mutedColor: "#a89f94",
      borderColor: "#312b24",
      glassOpacity: 82,
      glassBlur: 12,
      radius: 10,
    },
  },
  {
    id: "light-paper",
    nameRu: "Светлая бумага",
    nameEn: "Light Paper",
    descRu: "Светлые бумажные поверхности и чёткая типографика",
    descEn: "Crisp light paper surfaces with ink typography",
    mode: "light",
    vars: {
      accentColor: "#2563eb",
      canvasBg: "#f8f7f4",
      cardBg: "#ffffff",
      sidebarBg: "#f1efe9",
      fgColor: "#141418",
      mutedColor: "#5c5c66",
      borderColor: "#e2dfd7",
      glassOpacity: 86,
      glassBlur: 10,
      radius: 12,
    },
  },
  {
    id: "custom",
    nameRu: "Своя тема",
    nameEn: "Custom Theme",
    descRu: "Полностью ручной подбор цветов, стекла и скруглений",
    descEn: "Full manual control over colors, glass and radius",
    mode: "dark",
    vars: {
      accentColor: "#3b82f6",
      canvasBg: "#09090b",
      cardBg: "#131316",
      sidebarBg: "#0f0f12",
      fgColor: "#f1f2f6",
      mutedColor: "#9a9aa6",
      borderColor: "#272730",
      glassOpacity: 78,
      glassBlur: 12,
      radius: 12,
    },
  },
];

const GRADIENT_PRESETS = [
  { id: "aurora", nameRu: "Аврора", nameEn: "Aurora", colors: ["#0f172a", "#1e1b4b", "#09090b"], angle: 135 },
  { id: "cosmic", nameRu: "Космос", nameEn: "Cosmic", colors: ["#090d1e", "#311042", "#0d1b2a"], angle: 125 },
  { id: "sunset", nameRu: "Закат", nameEn: "Sunset", colors: ["#1f121b", "#4a1c2d", "#171426"], angle: 145 },
  { id: "emerald", nameRu: "Изумруд", nameEn: "Emerald", colors: ["#071714", "#0d3b32", "#091015"], angle: 135 },
  { id: "cyber", nameRu: "Киберпанк", nameEn: "Cyber", colors: ["#090b1a", "#172554", "#3b0764"], angle: 120 },
  { id: "silk", nameRu: "Тёплый шёлк", nameEn: "Warm Silk", colors: ["#1a1715", "#2d241c", "#141210"], angle: 140 },
];

const FONT_PRESETS = {
  ui: [
    { id: "system", label: "Системный (Default)", labelEn: "System Default", stack: "" },
    { id: "segoe", label: "Segoe UI", labelEn: "Segoe UI", stack: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif' },
    { id: "inter", label: "Inter", labelEn: "Inter", stack: '"Inter", "Segoe UI", system-ui, sans-serif' },
    { id: "rubik", label: "Rubik", labelEn: "Rubik", stack: '"Rubik", "Segoe UI", system-ui, sans-serif' },
    { id: "ibm-plex", label: "IBM Plex Sans", labelEn: "IBM Plex Sans", stack: '"IBM Plex Sans", "Segoe UI", sans-serif' },
    { id: "georgia", label: "Georgia (Serif)", labelEn: "Georgia (Serif)", stack: 'Georgia, "Times New Roman", serif' },
  ],
  mono: [
    { id: "system", label: "Стандартный (Default)", labelEn: "System Mono", stack: "" },
    { id: "cascadia", label: "Cascadia Code", labelEn: "Cascadia Code", stack: '"Cascadia Code", Consolas, monospace' },
    { id: "jetbrains", label: "JetBrains Mono", labelEn: "JetBrains Mono", stack: '"JetBrains Mono", Consolas, monospace' },
    { id: "consolas", label: "Consolas", labelEn: "Consolas", stack: 'Consolas, "Courier New", monospace' },
    { id: "fira", label: "Fira Code", labelEn: "Fira Code", stack: '"Fira Code", Consolas, monospace' },
  ],
};

const DEFAULT_APPEARANCE = {
  presetId: "native",
  uiPolish: true,
  accentColor: "#3b82f6",
  canvasBg: "#09090b",
  cardBg: "#131316",
  glassOpacity: 78,
  glassBlur: 12,
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

const TE_HEX_RE = /^#[0-9a-fA-F]{6}$/;

function teClamp(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function teValidHex(val, fallback) {
  return typeof val === "string" && TE_HEX_RE.test(val.trim()) ? val.trim().toLowerCase() : fallback;
}

function teFindThemePreset(id) {
  for (let i = 0; i < THEME_PRESETS.length; i += 1) {
    if (THEME_PRESETS[i].id === id) return THEME_PRESETS[i];
  }
  return null;
}

function teFindGradientPreset(id) {
  for (let i = 0; i < GRADIENT_PRESETS.length; i += 1) {
    if (GRADIENT_PRESETS[i].id === id) return GRADIENT_PRESETS[i];
  }
  return null;
}

function teFindFont(group, id) {
  const list = FONT_PRESETS[group] || [];
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i];
  }
  return list[0] || { id: "system", stack: "" };
}

function teHexToRgb(hex) {
  const h = teValidHex(hex, "#131316").slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function teHexToRgba(hex, alphaPct) {
  const { r, g, b } = teHexToRgb(hex);
  const a = Math.round(teClamp(alphaPct, 0, 100, 80)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function teIsLightColor(hex) {
  const { r, g, b } = teHexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}

function teMixHex(hexA, hexB, ratio) {
  const a = teHexToRgb(hexA);
  const b = teHexToRgb(hexB);
  const t = teClamp(ratio, 0, 1, 0.5);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function teValidMediaUrl(raw) {
  if (typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  if (s.startsWith("agy-media://local/")) return s.slice(0, 240);
  if (s.startsWith("blob:") && s.length <= 240 && !/[\s"'<>]/.test(s)) return s;
  return "";
}

function teEscapeAttr(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeAppearance(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const preset = teFindThemePreset(src.presetId);
  const presetId = preset ? preset.id : "native";

  const wpSrc = src.wallpaper && typeof src.wallpaper === "object" ? src.wallpaper : {};
  const wpType =
    wpSrc.type === "gradient" || wpSrc.type === "image" || wpSrc.type === "video"
      ? wpSrc.type
      : "none";
  const gradPresetObj = teFindGradientPreset(wpSrc.gradientPreset) || GRADIENT_PRESETS[0];
  const rawGradColors = Array.isArray(wpSrc.gradColors) ? wpSrc.gradColors : gradPresetObj.colors;
  const gradColors = [
    teValidHex(rawGradColors[0], gradPresetObj.colors[0]),
    teValidHex(rawGradColors[1], gradPresetObj.colors[1]),
    teValidHex(rawGradColors[2], gradPresetObj.colors[2] || gradPresetObj.colors[1]),
  ];

  const tySrc = src.typography && typeof src.typography === "object" ? src.typography : {};
  const uiFontId = teFindFont("ui", tySrc.uiFont).id;
  const monoFontId = teFindFont("mono", tySrc.monoFont).id;
  const rawChatW = teClamp(Math.round(Number(tySrc.chatMaxWidth) || 0), 0, 1200, 0);
  const chatMaxWidth = rawChatW > 0 && rawChatW < 680 ? 680 : rawChatW;
  const density =
    tySrc.density === "compact" || tySrc.density === "spacious" ? tySrc.density : "comfortable";

  const rawLineHeight = Number(tySrc.lineHeight);
  const lineHeight = Number.isFinite(rawLineHeight)
    ? Math.round(teClamp(rawLineHeight, 1.25, 1.9, 1.55) * 100) / 100
    : 1.55;

  const mediaFile =
    typeof wpSrc.mediaFile === "string" && /^[a-zA-Z0-9._-]{1,120}$/.test(wpSrc.mediaFile.trim())
      ? wpSrc.mediaFile.trim()
      : "";
  const mediaUrl = teValidMediaUrl(wpSrc.mediaUrl);

  return {
    presetId,
    uiPolish: src.uiPolish !== false,
    accentColor: teValidHex(src.accentColor, DEFAULT_APPEARANCE.accentColor),
    canvasBg: teValidHex(src.canvasBg, DEFAULT_APPEARANCE.canvasBg),
    cardBg: teValidHex(src.cardBg, DEFAULT_APPEARANCE.cardBg),
    glassOpacity: Math.round(teClamp(src.glassOpacity, 25, 100, DEFAULT_APPEARANCE.glassOpacity)),
    glassBlur: Math.round(teClamp(src.glassBlur, 0, 24, DEFAULT_APPEARANCE.glassBlur)),
    radius: Math.round(teClamp(src.radius, 4, 20, DEFAULT_APPEARANCE.radius)),
    wallpaper: {
      type: wpType,
      gradientPreset: gradPresetObj.id,
      gradColors,
      gradAngle: Math.round(teClamp(wpSrc.gradAngle, 0, 360, gradPresetObj.angle)),
      gradAnimated: wpSrc.gradAnimated !== false,
      gradSpeed: Math.round(teClamp(wpSrc.gradSpeed, 6, 40, DEFAULT_APPEARANCE.wallpaper.gradSpeed)),
      mediaFile: mediaUrl ? mediaFile : "",
      mediaUrl,
      mediaMime: typeof wpSrc.mediaMime === "string" ? wpSrc.mediaMime.slice(0, 60) : "",
      dim: Math.round(teClamp(wpSrc.dim, 0, 85, DEFAULT_APPEARANCE.wallpaper.dim)),
      blur: Math.round(teClamp(wpSrc.blur, 0, 24, DEFAULT_APPEARANCE.wallpaper.blur)),
      opacity: Math.round(teClamp(wpSrc.opacity, 15, 100, DEFAULT_APPEARANCE.wallpaper.opacity)),
      scale: Math.round(teClamp(wpSrc.scale, 100, 130, DEFAULT_APPEARANCE.wallpaper.scale)),
      pauseWhenHidden: wpSrc.pauseWhenHidden !== false,
    },
    typography: {
      uiFont: uiFontId,
      monoFont: monoFontId,
      fontSize: Math.round(teClamp(tySrc.fontSize, 12, 18, DEFAULT_APPEARANCE.typography.fontSize)),
      lineHeight,
      chatMaxWidth,
      density,
    },
  };
}

function isAppearanceNativeDefault(raw) {
  const cfg = normalizeAppearance(raw);
  return (
    cfg.presetId === "native" &&
    cfg.wallpaper.type === "none" &&
    cfg.typography.uiFont === "system" &&
    cfg.typography.monoFont === "system" &&
    cfg.typography.fontSize === 14 &&
    cfg.typography.lineHeight === 1.55 &&
    cfg.typography.chatMaxWidth === 0 &&
    cfg.typography.density === "comfortable"
  );
}

function teResolveThemeVars(cfg) {
  const preset = teFindThemePreset(cfg.presetId) || THEME_PRESETS[0];
  if (cfg.presetId === "custom") {
    const light = teIsLightColor(cfg.canvasBg);
    return {
      mode: light ? "light" : "dark",
      accentColor: cfg.accentColor,
      canvasBg: cfg.canvasBg,
      cardBg: cfg.cardBg,
      sidebarBg: teMixHex(cfg.canvasBg, cfg.cardBg, 0.55),
      fgColor: light ? "#141418" : "#f1f2f6",
      mutedColor: light ? "#5c5c66" : "#9aa0b0",
      borderColor: light ? teMixHex(cfg.cardBg, "#000000", 0.12) : teMixHex(cfg.cardBg, "#ffffff", 0.12),
      glassOpacity: cfg.glassOpacity,
      glassBlur: cfg.glassBlur,
      radius: cfg.radius,
    };
  }
  return Object.assign({}, preset.vars, {
    mode: preset.mode,
    glassOpacity: cfg.glassOpacity,
    glassBlur: cfg.glassBlur,
    radius: cfg.radius,
  });
}

function buildThemeCss(rawAppearance) {
  const cfg = normalizeAppearance(rawAppearance);
  if (isAppearanceNativeDefault(cfg)) {
    return "";
  }

  const vars = teResolveThemeVars(cfg);
  const hasThemeOverride = cfg.presetId !== "native";
  const hasWallpaper = cfg.wallpaper.type !== "none" && (cfg.wallpaper.type === "gradient" || Boolean(cfg.wallpaper.mediaUrl));
  const ty = cfg.typography;
  const uiFontObj = teFindFont("ui", ty.uiFont);
  const monoFontObj = teFindFont("mono", ty.monoFont);
  const isLight = hasThemeOverride ? vars.mode === "light" : false;
  const chunks = [];

  chunks.push(`
@keyframes agy-ru-grad-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`);

  if (hasThemeOverride) {
    const cardAlpha = hasWallpaper ? Math.min(vars.glassOpacity, 88) : Math.max(vars.glassOpacity, 90);
    const sidebarAlpha = hasWallpaper ? Math.min(vars.glassOpacity + 6, 92) : 96;
    const secondaryHex = teMixHex(vars.cardBg, isLight ? "#000000" : "#ffffff", 0.06);
    const cardRgba = teHexToRgba(vars.cardBg, cardAlpha);
    const sidebarRgba = teHexToRgba(vars.sidebarBg, sidebarAlpha);

    chunks.push(`
:root, html, body {
  --background: ${vars.canvasBg};
  --foreground: ${vars.fgColor};
  --primary: ${vars.accentColor};
  --primary-foreground: #ffffff;
  --link: ${vars.accentColor};
  --secondary: ${secondaryHex};
  --secondary-foreground: ${vars.fgColor};
  --muted: ${secondaryHex};
  --muted-foreground: ${vars.mutedColor};
  --border: ${vars.borderColor};
  --card: ${hasWallpaper ? cardRgba : vars.cardBg};
  --card-border: ${vars.borderColor};
  --sidebar: ${hasWallpaper ? sidebarRgba : vars.sidebarBg};
  --sidebar-secondary: ${secondaryHex};
}
`);
    if (!hasWallpaper) {
      chunks.push(`
html, body {
  background-color: ${vars.canvasBg} !important;
  color: ${vars.fgColor};
}
`);
    }
  }

  if (hasWallpaper) {
    const surfaceBg = hasThemeOverride
      ? teHexToRgba(vars.cardBg, vars.glassOpacity)
      : `rgba(19, 19, 22, ${Math.round(cfg.glassOpacity) / 100})`;
    const sidebarGlassBg = hasThemeOverride
      ? teHexToRgba(vars.sidebarBg, Math.min(100, vars.glassOpacity + 8))
      : `rgba(14, 14, 18, ${Math.min(100, cfg.glassOpacity + 8) / 100})`;
    const headerGlassBg = hasThemeOverride
      ? teHexToRgba(vars.sidebarBg, Math.min(100, vars.glassOpacity + 4))
      : `rgba(14, 14, 18, ${Math.min(100, cfg.glassOpacity + 4) / 100})`;
    const popoverBg = hasThemeOverride
      ? teHexToRgba(vars.cardBg, Math.min(98, Math.max(92, vars.glassOpacity + 14)))
      : "rgba(22, 22, 28, 0.96)";
    const blurPx = cfg.glassBlur;
    const fallbackBg = hasThemeOverride ? vars.canvasBg : "#09090b";

    chunks.push(`
:root, html, body {
  --background: transparent !important;
  --color-background: transparent !important;
  --canvas: transparent !important;
  --bg-canvas: transparent !important;
  --sidebar: ${sidebarGlassBg} !important;
  --card: ${surfaceBg} !important;
}
html {
  background-color: ${fallbackBg} !important;
}
body, #root, #app {
  background-color: transparent !important;
  background-image: none !important;
}
#root, #app {
  position: relative;
  z-index: 1;
}
[data-agy-ru-bg-shell="1"] {
  background-color: transparent !important;
  background-image: none !important;
}
[data-agy-ru-bg-sidebar="1"],
aside,
nav[aria-label],
[data-testid="sidebar"] {
  background-color: ${sidebarGlassBg} !important;
}
[data-agy-ru-bg-header="1"] {
  background-color: ${headerGlassBg} !important;
}
main:not([role="dialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]),
[data-testid="chat-container"]:not([role="dialog"]),
[data-testid="conversation-view"]:not([role="dialog"]),
[class*="bg-background"]:not([role="dialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]),
.bg-black:not([role="dialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]) {
  background-color: transparent !important;
}
[data-testid="agent-response"], [data-testid="user-message-content"] {
  border-radius: ${vars.radius}px;
}
[data-testid="user-message-content"] {
  background-color: ${surfaceBg};
  backdrop-filter: blur(${blurPx}px);
  -webkit-backdrop-filter: blur(${blurPx}px);
}
form:has(textarea), [data-testid="composer"], .composer-container {
  background-color: ${surfaceBg} !important;
  border-radius: ${vars.radius}px;
}
[role="dialog"],
[role="alertdialog"],
[role="menu"],
[role="listbox"],
[role="tooltip"],
[data-radix-popper-content-wrapper] > * {
  background-color: ${popoverBg} !important;
}
`);
  }

  if (uiFontObj.stack) {
    chunks.push(`
body, input, textarea, button, select {
  font-family: ${uiFontObj.stack} !important;
}
`);
  }

  if (monoFontObj.stack) {
    chunks.push(`
code, pre, kbd, samp {
  font-family: ${monoFontObj.stack} !important;
}
`);
  }

  if (ty.fontSize !== 14 || ty.lineHeight !== 1.55) {
    chunks.push(`
[data-markdown-root], [data-testid="agent-response"], [data-testid="user-message-content"] {
  font-size: ${ty.fontSize}px !important;
  line-height: ${ty.lineHeight} !important;
}
`);
  }

  if (ty.chatMaxWidth >= 680) {
    chunks.push(`
[data-testid="agent-response"], [data-testid="user-message-content"] {
  max-width: min(100%, ${ty.chatMaxWidth}px);
}
`);
  }

  if (ty.density === "compact") {
    chunks.push(`
[data-testid="agent-response"], [data-testid="user-message-content"] {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  margin-bottom: 4px !important;
}
`);
  } else if (ty.density === "spacious") {
    chunks.push(`
[data-testid="agent-response"], [data-testid="user-message-content"] {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  margin-bottom: 12px !important;
}
`);
  }

  if (cfg.uiPolish) {
    chunks.push(`
::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: ${hasThemeOverride && isLight ? "rgba(20, 20, 24, 0.22)" : "rgba(255, 255, 255, 0.16)"};
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: ${hasThemeOverride && isLight ? "rgba(20, 20, 24, 0.36)" : "rgba(255, 255, 255, 0.28)"};
}
textarea:focus, form:has(textarea:focus-within) {
  border-color: ${vars.accentColor} !important;
}
`);
  }

  return chunks.join("\n").trim();
}

function teBuildGradientCss(wp) {
  const c1 = teValidHex(wp.gradColors && wp.gradColors[0], "#0f172a");
  const c2 = teValidHex(wp.gradColors && wp.gradColors[1], "#1e1b4b");
  const c3 = teValidHex(wp.gradColors && wp.gradColors[2], "#09090b");
  return `linear-gradient(${Math.round(teClamp(wp.gradAngle, 0, 360, 135))}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`;
}

function createThemeEngine(options = {}) {
  const doc = options.document || (typeof document !== "undefined" ? document : null);
  const win = options.window || (typeof window !== "undefined" ? window : null);
  const resolveMediaUrl = typeof options.resolveMediaUrl === "function" ? options.resolveMediaUrl : null;

  let currentConfig = normalizeAppearance(DEFAULT_APPEARANCE);
  let styleNode = null;
  let bgLayer = null;
  let mediaChild = null;
  let scrimChild = null;
  let activeVideoUrl = "";
  let visHandler = null;
  let blurHandler = null;
  let focusHandler = null;
  let shellScanTimer = null;
  let shellObserver = null;
  let shellResizeHandler = null;
  let wallpaperActive = false;

  const SHELL_ATTRS = ["data-agy-ru-bg-shell", "data-agy-ru-bg-sidebar", "data-agy-ru-bg-header"];
  const SHELL_SKIP_TAGS = new Set(["PRE", "CODE", "BUTTON", "INPUT", "TEXTAREA", "FORM", "SVG", "IMG", "VIDEO", "CANVAS", "SCRIPT", "STYLE"]);
  const SHELL_SKIP_ROLES = new Set(["dialog", "alertdialog", "menu", "listbox", "tooltip"]);
  const SHELL_SKIP_TESTIDS = new Set(["user-message-content", "agent-response"]);

  function teParseBgAlpha(bgStr) {
    if (!bgStr || bgStr === "transparent") return 0;
    const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(String(bgStr).trim());
    if (!m) return 0;
    const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;
    return Number.isFinite(alpha) ? alpha : 0;
  }

  function clearShellAttrsOnElement(el) {
    if (!el || typeof el.removeAttribute !== "function") return;
    for (let i = 0; i < SHELL_ATTRS.length; i += 1) {
      if (typeof el.hasAttribute !== "function" || el.hasAttribute(SHELL_ATTRS[i])) {
        el.removeAttribute(SHELL_ATTRS[i]);
      }
    }
  }

  function setExclusiveShellAttr(el, targetAttr) {
    if (!el || typeof el.setAttribute !== "function") return;
    for (let i = 0; i < SHELL_ATTRS.length; i += 1) {
      const a = SHELL_ATTRS[i];
      if (a === targetAttr) {
        if (typeof el.getAttribute !== "function" || el.getAttribute(a) !== "1") {
          el.setAttribute(a, "1");
        }
      } else if (typeof el.removeAttribute === "function") {
        if (typeof el.hasAttribute !== "function" || el.hasAttribute(a)) {
          el.removeAttribute(a);
        }
      }
    }
  }

  function clearWallpaperShells() {
    if (shellScanTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(shellScanTimer);
      shellScanTimer = null;
    }
    if (shellObserver && typeof shellObserver.disconnect === "function") {
      shellObserver.disconnect();
      shellObserver = null;
    }
    if (shellResizeHandler && win && typeof win.removeEventListener === "function") {
      win.removeEventListener("resize", shellResizeHandler);
      shellResizeHandler = null;
    }
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    try {
      const marked = doc.querySelectorAll("[data-agy-ru-bg-shell], [data-agy-ru-bg-sidebar], [data-agy-ru-bg-header]");
      for (let i = 0; marked && i < marked.length; i += 1) {
        clearShellAttrsOnElement(marked[i]);
      }
    } catch (_e) {}
  }

  function isSkippedShellNode(el) {
    if (!el || el.nodeType !== 1) return true;
    const id = el.id || "";
    if (id === "agy-ru-studio-host" || id === "agy-ru-studio-bg" || id === "agy-ru-studio-theme") return true;
    const tag = String(el.tagName || "").toUpperCase();
    if (SHELL_SKIP_TAGS.has(tag)) return true;
    if (typeof el.getAttribute === "function") {
      const role = el.getAttribute("role");
      if (role && SHELL_SKIP_ROLES.has(role)) return true;
      const tid = el.getAttribute("data-testid");
      if (tid && SHELL_SKIP_TESTIDS.has(tid)) return true;
      if (el.hasAttribute("data-markdown-root")) return true;
      if (el.hasAttribute("data-radix-popper-content-wrapper")) return true;
    }
    return false;
  }

  function scanWallpaperShells() {
    if (!wallpaperActive || !doc || !win || typeof win.getComputedStyle !== "function") return;
    const rootTarget = (typeof doc.querySelector === "function" && doc.querySelector("#root, #app")) || doc.body;
    if (!rootTarget) return;
    const vw = Number(win.innerWidth) || 0;
    const vh = Number(win.innerHeight) || 0;
    if (vw < 100 || vh < 100) return;

    const queue = [{ el: rootTarget, depth: 0 }];
    let visited = 0;
    const maxNodes = 160;
    const maxDepth = 7;

    while (queue.length > 0 && visited < maxNodes) {
      const item = queue.shift();
      const el = item.el;
      if (isSkippedShellNode(el)) continue;
      visited += 1;

      if (typeof el.getBoundingClientRect === "function") {
        const rect = el.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          let attr = "";
          if (rect.width >= vw * 0.5 && rect.height >= vh * 0.5) {
            attr = "data-agy-ru-bg-shell";
          } else if (rect.left <= 16 && rect.width >= 150 && rect.width <= 420 && rect.height >= vh * 0.65) {
            attr = "data-agy-ru-bg-sidebar";
          } else if (rect.top <= 16 && rect.height >= 26 && rect.height <= 68 && rect.width >= vw * 0.5) {
            attr = "data-agy-ru-bg-header";
          }
          if (attr) {
            const bgAlpha = teParseBgAlpha(win.getComputedStyle(el).backgroundColor);
            if (bgAlpha >= 0.85 || (typeof el.hasAttribute === "function" && el.hasAttribute(attr))) {
              setExclusiveShellAttr(el, attr);
            }
          } else {
            clearShellAttrsOnElement(el);
          }
        }
      }

      if (item.depth < maxDepth && el.children) {
        for (let i = 0; i < el.children.length; i += 1) {
          queue.push({ el: el.children[i], depth: item.depth + 1 });
        }
      }
    }
  }

  function scheduleShellScan() {
    if (!wallpaperActive) return;
    if (!win || typeof win.setTimeout !== "function") {
      scanWallpaperShells();
      return;
    }
    if (shellScanTimer) return;
    shellScanTimer = win.setTimeout(() => {
      shellScanTimer = null;
      scanWallpaperShells();
    }, 180);
  }

  function ensureShellWatchers() {
    if (!wallpaperActive || !doc || !win) return;
    scanWallpaperShells();
    if (!shellObserver && typeof win.MutationObserver === "function") {
      const watchTarget = (typeof doc.querySelector === "function" && doc.querySelector("#root, #app")) || doc.body;
      if (watchTarget) {
        try {
          shellObserver = new win.MutationObserver((muts) => {
            if (!wallpaperActive) return;
            for (let i = 0; i < muts.length; i += 1) {
              const m = muts[i];
              if (m.type === "attributes" && SHELL_ATTRS.indexOf(m.attributeName) >= 0) continue;
              scheduleShellScan();
              break;
            }
          });
          shellObserver.observe(watchTarget, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
        } catch (_e) {}
      }
    }
    if (!shellResizeHandler && typeof win.addEventListener === "function") {
      shellResizeHandler = () => scheduleShellScan();
      win.addEventListener("resize", shellResizeHandler);
    }
  }

  function removeVideoListeners() {
    if (doc && visHandler && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("visibilitychange", visHandler);
    }
    if (win && typeof win.removeEventListener === "function") {
      if (blurHandler) win.removeEventListener("blur", blurHandler);
      if (focusHandler) win.removeEventListener("focus", focusHandler);
    }
    visHandler = null;
    blurHandler = null;
    focusHandler = null;
  }

  function removeStyleNode() {
    if (!doc) return;
    const found = typeof doc.getElementById === "function" ? doc.getElementById("agy-ru-studio-theme") : styleNode;
    if (found && found.parentNode) {
      found.parentNode.removeChild(found);
    }
    styleNode = null;
  }

  function removeBgLayer() {
    removeVideoListeners();
    if (!doc) return;
    const found = typeof doc.getElementById === "function" ? doc.getElementById("agy-ru-studio-bg") : bgLayer;
    if (found && found.parentNode) {
      found.parentNode.removeChild(found);
    }
    bgLayer = null;
    mediaChild = null;
    scrimChild = null;
    activeVideoUrl = "";
  }

  function ensureStyleNode(cssText) {
    if (!doc || typeof doc.createElement !== "function") return;
    if (!cssText) {
      removeStyleNode();
      return;
    }
    let node = typeof doc.getElementById === "function" ? doc.getElementById("agy-ru-studio-theme") : styleNode;
    if (!node) {
      node = doc.createElement("style");
      node.id = "agy-ru-studio-theme";
      node.setAttribute("data-agy-ru-ignore", "1");
      const target = doc.head || doc.documentElement || doc.body;
      if (!target) return;
      target.appendChild(node);
    }
    if (node.textContent !== cssText) {
      node.textContent = cssText;
    }
    styleNode = node;
  }

  function ensureBgLayer() {
    if (!doc || typeof doc.createElement !== "function") return null;
    let layer = typeof doc.getElementById === "function" ? doc.getElementById("agy-ru-studio-bg") : bgLayer;
    if (!layer) {
      const mountTarget = doc.body || doc.documentElement;
      if (!mountTarget) return null;
      layer = doc.createElement("div");
      layer.id = "agy-ru-studio-bg";
      layer.setAttribute("data-agy-ru-ignore", "1");
      layer.setAttribute("aria-hidden", "true");
      layer.style.position = "fixed";
      layer.style.inset = "0";
      layer.style.zIndex = "0";
      layer.style.pointerEvents = "none";
      layer.style.overflow = "hidden";
      if (mountTarget.firstChild && typeof mountTarget.insertBefore === "function") {
        mountTarget.insertBefore(layer, mountTarget.firstChild);
      } else {
        mountTarget.appendChild(layer);
      }
    }
    bgLayer = layer;
    return layer;
  }

  function ensureScrim(layer, dimPct) {
    if (!doc || !layer) return;
    if (!scrimChild || scrimChild.parentNode !== layer) {
      scrimChild = doc.createElement("div");
      scrimChild.setAttribute("data-role", "scrim");
      scrimChild.style.position = "absolute";
      scrimChild.style.inset = "0";
      scrimChild.style.pointerEvents = "none";
      layer.appendChild(scrimChild);
    }
    const dimAlpha = Math.round(teClamp(dimPct, 0, 85, 45)) / 100;
    scrimChild.style.backgroundColor = `rgba(6, 7, 10, ${dimAlpha})`;
  }

  function attachVideoPauseLifecycle(videoEl, pauseWhenHidden) {
    removeVideoListeners();
    if (!pauseWhenHidden || !videoEl) return;
    const syncPlayback = () => {
      try {
        if (doc && doc.hidden) {
          if (typeof videoEl.pause === "function") videoEl.pause();
        } else if (typeof videoEl.play === "function") {
          const res = videoEl.play();
          if (res && typeof res.catch === "function") res.catch(() => {});
        }
      } catch (_e) {}
    };
    visHandler = () => syncPlayback();
    blurHandler = () => {
      try {
        if (typeof videoEl.pause === "function") videoEl.pause();
      } catch (_e) {}
    };
    focusHandler = () => syncPlayback();
    if (doc && typeof doc.addEventListener === "function") {
      doc.addEventListener("visibilitychange", visHandler);
    }
    if (win && typeof win.addEventListener === "function") {
      win.addEventListener("blur", blurHandler);
      win.addEventListener("focus", focusHandler);
    }
  }

  function applyWallpaper(cfg) {
    const wp = cfg.wallpaper;
    if (wp.type === "none") {
      wallpaperActive = false;
      clearWallpaperShells();
      removeBgLayer();
      return;
    }
    const rawMediaUrl = wp.mediaUrl;
    const resolvedSrc = (wp.type === "image" || wp.type === "video")
      ? ((resolveMediaUrl ? resolveMediaUrl(wp.mediaFile, rawMediaUrl) : "") || rawMediaUrl)
      : "";
    if ((wp.type === "image" || wp.type === "video") && !resolvedSrc) {
      wallpaperActive = false;
      clearWallpaperShells();
      removeBgLayer();
      return;
    }

    wallpaperActive = true;
    ensureShellWatchers();

    const layer = ensureBgLayer();
    if (!layer) return;

    const filterCss = wp.blur > 0 ? `blur(${wp.blur}px)` : "none";
    const opacityVal = String(Math.round(teClamp(wp.opacity, 15, 100, 85)) / 100);
    const scaleVal = wp.scale > 100 ? `scale(${(wp.scale / 100).toFixed(2)})` : (wp.blur > 0 ? "scale(1.06)" : "none");

    if (wp.type === "video") {
      const needNewVideo = !mediaChild || mediaChild.tagName !== "VIDEO" || activeVideoUrl !== resolvedSrc;
      if (needNewVideo) {
        removeVideoListeners();
        if (mediaChild && mediaChild.parentNode) {
          mediaChild.parentNode.removeChild(mediaChild);
        }
        const vid = doc.createElement("video");
        vid.setAttribute("data-role", "bg-video");
        vid.setAttribute("autoplay", "");
        vid.setAttribute("muted", "");
        vid.setAttribute("loop", "");
        vid.setAttribute("playsinline", "");
        vid.autoplay = true;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.preload = "metadata";
        vid.src = resolvedSrc;
        vid.style.position = "absolute";
        vid.style.inset = "0";
        vid.style.width = "100%";
        vid.style.height = "100%";
        vid.style.objectFit = "cover";
        vid.style.pointerEvents = "none";
        if (scrimChild && scrimChild.parentNode === layer && typeof layer.insertBefore === "function") {
          layer.insertBefore(vid, scrimChild);
        } else {
          layer.appendChild(vid);
        }
        mediaChild = vid;
        activeVideoUrl = resolvedSrc;
        try {
          if (typeof vid.play === "function") {
            const p = vid.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          }
        } catch (_e) {}
      }
      mediaChild.style.filter = filterCss;
      mediaChild.style.opacity = opacityVal;
      mediaChild.style.transform = scaleVal;
      attachVideoPauseLifecycle(mediaChild, wp.pauseWhenHidden);
      ensureScrim(layer, wp.dim);
      return;
    }

    removeVideoListeners();
    activeVideoUrl = "";

    if (wp.type === "image") {
      if (!mediaChild || mediaChild.tagName !== "IMG") {
        if (mediaChild && mediaChild.parentNode) {
          mediaChild.parentNode.removeChild(mediaChild);
        }
        const img = doc.createElement("img");
        img.setAttribute("data-role", "bg-image");
        img.alt = "";
        img.style.position = "absolute";
        img.style.inset = "0";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.pointerEvents = "none";
        if (scrimChild && scrimChild.parentNode === layer && typeof layer.insertBefore === "function") {
          layer.insertBefore(img, scrimChild);
        } else {
          layer.appendChild(img);
        }
        mediaChild = img;
      }
      if (mediaChild.getAttribute("src") !== resolvedSrc) {
        mediaChild.setAttribute("src", resolvedSrc);
      }
      mediaChild.style.filter = filterCss;
      mediaChild.style.opacity = opacityVal;
      mediaChild.style.transform = scaleVal;
      ensureScrim(layer, wp.dim);
      return;
    }

    if (!mediaChild || mediaChild.getAttribute("data-role") !== "bg-gradient") {
      if (mediaChild && mediaChild.parentNode) {
        mediaChild.parentNode.removeChild(mediaChild);
      }
      const gradDiv = doc.createElement("div");
      gradDiv.setAttribute("data-role", "bg-gradient");
      gradDiv.style.position = "absolute";
      gradDiv.style.inset = "0";
      gradDiv.style.pointerEvents = "none";
      if (scrimChild && scrimChild.parentNode === layer && typeof layer.insertBefore === "function") {
        layer.insertBefore(gradDiv, scrimChild);
      } else {
        layer.appendChild(gradDiv);
      }
      mediaChild = gradDiv;
    }
    mediaChild.style.backgroundImage = teBuildGradientCss(wp);
    mediaChild.style.backgroundSize = wp.gradAnimated ? "220% 220%" : "100% 100%";
    mediaChild.style.animation = wp.gradAnimated
      ? `agy-ru-grad-shift ${wp.gradSpeed}s ease infinite`
      : "none";
    mediaChild.style.filter = filterCss;
    mediaChild.style.opacity = opacityVal;
    ensureScrim(layer, Math.round(wp.dim * 0.55));
  }

  function apply(rawAppearance) {
    currentConfig = normalizeAppearance(rawAppearance);
    if (isAppearanceNativeDefault(currentConfig)) {
      wallpaperActive = false;
      clearWallpaperShells();
      removeStyleNode();
      removeBgLayer();
      return currentConfig;
    }
    const cssText = buildThemeCss(currentConfig);
    ensureStyleNode(cssText);
    applyWallpaper(currentConfig);
    return currentConfig;
  }

  function buildPreviewMarkup(rawAppearance, locale, resolvedMediaOverride) {
    const cfg = normalizeAppearance(rawAppearance);
    const vars = teResolveThemeVars(cfg);
    const wp = cfg.wallpaper;
    const ty = cfg.typography;
    const isRu = locale !== "en";
    const uiFontObj = teFindFont("ui", ty.uiFont);
    const uiFontCss = uiFontObj.stack || '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const isLight = cfg.presetId === "light-paper" || (cfg.presetId === "custom" && vars.mode === "light");
    const userLabel = isRu ? "Привет! Покажи стиль." : "Hi! Preview this look.";
    const agentLabel = isRu ? "Готово! Обновлены цвета, обои и шрифт." : "Done! Theme, wallpaper and font applied.";
    const inputLabel = isRu ? "Написать сообщение..." : "Ask anything...";

    const mediaSrc = teValidMediaUrl(resolvedMediaOverride) || (resolveMediaUrl && wp.mediaFile ? resolveMediaUrl(wp.mediaFile, wp.mediaUrl) : "") || wp.mediaUrl;
    let bgHtml = "";
    if (wp.type === "gradient") {
      const gradBg = teBuildGradientCss(wp);
      const animStyle = wp.gradAnimated ? `background-size:220% 220%;animation:agy-ru-grad-shift ${wp.gradSpeed}s ease infinite;` : "";
      bgHtml = `<div style="position:absolute;inset:0;background-image:${teEscapeAttr(gradBg)};${animStyle}opacity:${(wp.opacity / 100).toFixed(2)};filter:blur(${Math.round(wp.blur * 0.45)}px)"></div>`;
    } else if (wp.type === "image" && mediaSrc) {
      bgHtml = `<img src="${teEscapeAttr(mediaSrc)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${(wp.opacity / 100).toFixed(2)};filter:blur(${Math.round(wp.blur * 0.45)}px);transform:scale(${(wp.scale / 100).toFixed(2)})"/>`;
    } else if (wp.type === "video" && mediaSrc) {
      bgHtml = `<video src="${teEscapeAttr(mediaSrc)}" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${(wp.opacity / 100).toFixed(2)};filter:blur(${Math.round(wp.blur * 0.45)}px)"></video>`;
    }

    const dimOpacity = wp.type === "none" ? 0 : (wp.type === "gradient" ? (wp.dim * 0.55) / 100 : wp.dim / 100);
    const cardAlpha = wp.type === "none" ? 1 : Math.max(0.42, cfg.glassOpacity / 100);
    const bubbleBg = wp.type === "none" ? vars.cardBg : teHexToRgba(vars.cardBg, Math.round(cardAlpha * 100));
    const sideBg = wp.type === "none" ? vars.sidebarBg : teHexToRgba(vars.sidebarBg, Math.min(95, Math.round(cardAlpha * 100) + 8));
    const previewFontSize = Math.max(10, Math.min(13, Math.round(ty.fontSize * 0.82)));
    const padY = ty.density === "compact" ? 5 : ty.density === "spacious" ? 10 : 7;

    return `
      <div class="vp-stage" style="position:relative;overflow:hidden;border-radius:10px;border:1px solid ${teEscapeAttr(vars.borderColor)};background:${teEscapeAttr(vars.canvasBg)};font-family:${teEscapeAttr(uiFontCss)};color:${teEscapeAttr(vars.fgColor)};height:132px;display:flex">
        ${bgHtml}
        ${wp.type !== "none" ? `<div style="position:absolute;inset:0;background:rgba(6,7,10,${dimOpacity.toFixed(2)})"></div>` : ""}
        <div style="position:relative;z-index:1;width:78px;border-right:1px solid ${teEscapeAttr(vars.borderColor)};background:${teEscapeAttr(sideBg)};padding:10px 8px;display:flex;flex-direction:column;gap:6px;backdrop-filter:blur(${Math.min(10, cfg.glassBlur)}px)">
          <div style="height:8px;width:44px;border-radius:4px;background:${teEscapeAttr(vars.accentColor)};opacity:0.9"></div>
          <div style="height:6px;width:54px;border-radius:3px;background:${teEscapeAttr(vars.mutedColor)};opacity:0.45"></div>
          <div style="height:6px;width:48px;border-radius:3px;background:${teEscapeAttr(vars.mutedColor)};opacity:0.3"></div>
          <div style="height:6px;width:52px;border-radius:3px;background:${teEscapeAttr(vars.mutedColor)};opacity:0.3"></div>
        </div>
        <div style="position:relative;z-index:1;flex:1;padding:10px 12px;display:flex;flex-direction:column;justify-content:space-between;gap:6px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <div style="align-self:flex-end;background:${teEscapeAttr(bubbleBg)};border:1px solid ${teEscapeAttr(vars.borderColor)};border-radius:${Math.min(12, vars.radius)}px;padding:${padY - 2}px 9px;font-size:${previewFontSize}px;line-height:${ty.lineHeight};backdrop-filter:blur(${Math.min(10, cfg.glassBlur)}px)">
              ${teEscapeAttr(userLabel)}
            </div>
            <div style="align-self:flex-start;max-width:86%;background:${isLight ? "rgba(255,255,255,0.68)" : "rgba(18,18,22,0.52)"};border:1px solid ${teEscapeAttr(vars.borderColor)};border-radius:${Math.min(12, vars.radius)}px;padding:${padY}px 10px;font-size:${previewFontSize}px;line-height:${ty.lineHeight};backdrop-filter:blur(${Math.min(10, cfg.glassBlur)}px)">
              <span style="display:inline-block;width:6px;height:6px;border-radius:99px;background:${teEscapeAttr(vars.accentColor)};margin-right:5px;vertical-align:middle"></span>
              ${teEscapeAttr(agentLabel)}
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid ${teEscapeAttr(vars.borderColor)};background:${teEscapeAttr(bubbleBg)};border-radius:${Math.min(10, vars.radius)}px;padding:4px 8px;font-size:10.5px;color:${teEscapeAttr(vars.mutedColor)};backdrop-filter:blur(${Math.min(10, cfg.glassBlur)}px)">
            <span>${teEscapeAttr(inputLabel)}</span>
            <span style="width:16px;height:16px;border-radius:5px;background:${teEscapeAttr(vars.accentColor)};display:inline-block"></span>
          </div>
        </div>
      </div>
    `;
  }

  return {
    apply,
    buildPreviewMarkup,
    scanWallpaperShells,
    clearWallpaperShells,
    getCurrent: () => normalizeAppearance(currentConfig),
    destroy: () => {
      wallpaperActive = false;
      clearWallpaperShells();
      removeStyleNode();
      removeBgLayer();
    },
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    THEME_PRESETS,
    GRADIENT_PRESETS,
    FONT_PRESETS,
    DEFAULT_APPEARANCE,
    normalizeAppearance,
    isAppearanceNativeDefault,
    buildThemeCss,
    createThemeEngine,
  };
}
