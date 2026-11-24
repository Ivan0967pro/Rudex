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
      accentColor: "#3b82f6",
      canvasBg: "#070708",
      cardBg: "#15151a",
      sidebarBg: "#0d0d11",
      fgColor: "#ececef",
      mutedColor: "#9a9aa6",
      borderColor: "#252527",
      glassOpacity: 82,
      glassBlur: 12,
      radius: 12,
    },
  },
  {
    id: "claude-code-dark",
    nameRu: "Claude Code · Тёмная",
    nameEn: "Claude Code Dark",
    descRu: "Тёплый уголь Anthropic, мягкий крем и терракотовый акцент #D97757",
    descEn: "Anthropic warm charcoal, cream ink, and signature #D97757 terracotta",
    mode: "dark",
    badge: "Claude Code",
    vars: {
      accentColor: "#d97757",
      canvasBg: "#1f1e1d",
      cardBg: "#262624",
      sidebarBg: "#1a1918",
      fgColor: "#faf9f5",
      mutedColor: "#b0aea5",
      borderColor: "#3a3935",
      glassOpacity: 92,
      glassBlur: 10,
      radius: 10,
    },
  },
  {
    id: "claude-code-light",
    nameRu: "Claude Code · Светлая",
    nameEn: "Claude Code Light",
    descRu: "Пергаментный крем #FAF9F5, глубокие чернила и терракота #C15F3C",
    descEn: "Warm ivory parchment #FAF9F5, deep charcoal ink, and #C15F3C terracotta",
    mode: "light",
    badge: "Claude Code",
    vars: {
      accentColor: "#c15f3c",
      canvasBg: "#faf9f5",
      cardBg: "#ffffff",
      sidebarBg: "#f0eee6",
      fgColor: "#141413",
      mutedColor: "#6b6961",
      borderColor: "#e3e0d5",
      glassOpacity: 94,
      glassBlur: 8,
      radius: 10,
    },
  },
  {
    id: "claude-terminal",
    nameRu: "Claude Code · Терминал",
    nameEn: "Claude Code Terminal",
    descRu: "Глубокий уголь #141413 и строгий контраст терминала CLI",
    descEn: "Deep #141413 Anthropic ink with crisp CLI terminal contrast",
    mode: "dark",
    badge: "CLI",
    vars: {
      accentColor: "#da7756",
      canvasBg: "#141413",
      cardBg: "#1c1c1a",
      sidebarBg: "#111110",
      fgColor: "#eeece2",
      mutedColor: "#9e9b91",
      borderColor: "#2d2c29",
      glassOpacity: 94,
      glassBlur: 8,
      radius: 8,
    },
  },
  {
    id: "liquid-glass",
    nameRu: "Жидкое стекло (iOS 26)",
    nameEn: "Liquid Glass (iOS 26)",
    descRu: "Прозрачные хрустальные линзы с оптическим бликом и глубиной",
    descEn: "Translucent crystal lenses with optical specular rim & depth",
    mode: "dark",
    vars: {
      accentColor: "#0a84ff",
      canvasBg: "#070910",
      cardBg: "#121726",
      sidebarBg: "#0d111d",
      fgColor: "#f5f7ff",
      mutedColor: "#9aa6c0",
      borderColor: "rgba(255, 255, 255, 0.18)",
      glassOpacity: 46,
      glassBlur: 24,
      radius: 18,
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
      glassOpacity: 58,
      glassBlur: 20,
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
    id: "emerald-void",
    nameRu: "Изумрудная ночь",
    nameEn: "Emerald Void",
    descRu: "Глубокий тёмно-изумрудный тон с чистыми контрастами",
    descEn: "Deep emerald night surfaces with crisp contrast",
    mode: "dark",
    vars: {
      accentColor: "#10b981",
      canvasBg: "#071210",
      cardBg: "#0e1d1a",
      sidebarBg: "#0a1614",
      fgColor: "#ecfdf5",
      mutedColor: "#86a89e",
      borderColor: "#1c352f",
      glassOpacity: 76,
      glassBlur: 14,
      radius: 12,
    },
  },
  {
    id: "crimson-noir",
    nameRu: "Бордовый нуар",
    nameEn: "Crimson Noir",
    descRu: "Тёмный винно-бордовый фон и розовый акцент",
    descEn: "Rich crimson noir backdrop with rose accent",
    mode: "dark",
    vars: {
      accentColor: "#f43f5e",
      canvasBg: "#13090d",
      cardBg: "#1e1016",
      sidebarBg: "#180c11",
      fgColor: "#fff1f2",
      mutedColor: "#b3939c",
      borderColor: "#381d27",
      glassOpacity: 78,
      glassBlur: 14,
      radius: 12,
    },
  },
  {
    id: "tokyo-night",
    nameRu: "Токийская ночь",
    nameEn: "Tokyo Night",
    descRu: "Неоново-синий сумрак мегаполиса с мягким контрастом",
    descEn: "Deep Tokyo twilight with luminous blue accent",
    mode: "dark",
    vars: {
      accentColor: "#7aa2f7",
      canvasBg: "#0b0e18",
      cardBg: "#131829",
      sidebarBg: "#0e1220",
      fgColor: "#e2e8f0",
      mutedColor: "#8896b3",
      borderColor: "#242d4a",
      glassOpacity: 76,
      glassBlur: 14,
      radius: 12,
    },
  },
  {
    id: "sakura-dusk",
    nameRu: "Сумерки сакуры",
    nameEn: "Sakura Dusk",
    descRu: "Глубокий сливовый вечер и нежно-розовый акцент",
    descEn: "Velvet plum dusk with soft sakura rose accent",
    mode: "dark",
    vars: {
      accentColor: "#f472b6",
      canvasBg: "#140b12",
      cardBg: "#20121d",
      sidebarBg: "#190e17",
      fgColor: "#fdf2f8",
      mutedColor: "#b896aa",
      borderColor: "#3b2134",
      glassOpacity: 76,
      glassBlur: 15,
      radius: 14,
    },
  },
  {
    id: "nordic-frost",
    nameRu: "Скандинавский лёд",
    nameEn: "Nordic Frost",
    descRu: "Прохладные ледяные поверхности и небесно-синий акцент",
    descEn: "Crisp arctic light surfaces with sky blue accent",
    mode: "light",
    vars: {
      accentColor: "#0284c7",
      canvasBg: "#f1f5f9",
      cardBg: "#ffffff",
      sidebarBg: "#e6edf5",
      fgColor: "#0f172a",
      mutedColor: "#475569",
      borderColor: "#cbd5e1",
      glassOpacity: 84,
      glassBlur: 12,
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
  { id: "antigravity", nameRu: "Antigravity", nameEn: "Antigravity", colors: ["#15151a", "#0d0d11", "#070708"], angle: 135 },
  { id: "claude-ember", nameRu: "Claude Терракота", nameEn: "Claude Ember", colors: ["#2b221d", "#1f1e1d", "#141413"], angle: 135 },
  { id: "claude-parchment", nameRu: "Claude Пергамент", nameEn: "Claude Parchment", colors: ["#faf9f5", "#f0eee6", "#e6e2d5"], angle: 145 },
  { id: "aurora", nameRu: "Аврора", nameEn: "Aurora", colors: ["#0f172a", "#1e1b4b", "#09090b"], angle: 135 },
  { id: "cosmic", nameRu: "Космос", nameEn: "Cosmic", colors: ["#090d1e", "#311042", "#0d1b2a"], angle: 125 },
  { id: "sunset", nameRu: "Закат", nameEn: "Sunset", colors: ["#1f121b", "#4a1c2d", "#171426"], angle: 145 },
  { id: "emerald", nameRu: "Изумруд", nameEn: "Emerald", colors: ["#071714", "#0d3b32", "#091015"], angle: 135 },
  { id: "cyber", nameRu: "Киберпанк", nameEn: "Cyber", colors: ["#090b1a", "#172554", "#3b0764"], angle: 120 },
  { id: "silk", nameRu: "Тёплый шёлк", nameEn: "Warm Silk", colors: ["#1a1715", "#2d241c", "#141210"], angle: 140 },
  { id: "sakura", nameRu: "Сакура", nameEn: "Sakura", colors: ["#1f1024", "#4c1d4b", "#130d1d"], angle: 130 },
  { id: "ocean", nameRu: "Глубокий океан", nameEn: "Deep Ocean", colors: ["#061320", "#0c3559", "#071824"], angle: 140 },
  { id: "amber", nameRu: "Янтарный закат", nameEn: "Amber Glow", colors: ["#1c1108", "#4d280d", "#150e0a"], angle: 135 },
  { id: "mist", nameRu: "Обсидиановый туман", nameEn: "Obsidian Mist", colors: ["#0d0f14", "#1f2433", "#0a0b0e"], angle: 150 },
];

const CORNER_PRESETS = [
  { id: "sharp", nameRu: "Острые", nameEn: "Sharp", mode: "linked", all: 0 },
  { id: "crisp", nameRu: "Чёткие", nameEn: "Crisp", mode: "linked", all: 6 },
  { id: "balanced", nameRu: "Баланс", nameEn: "Balanced", mode: "linked", all: 12 },
  { id: "soft", nameRu: "Мягкие", nameEn: "Soft", mode: "linked", all: 18 },
  { id: "pill", nameRu: "Капсулы", nameEn: "Pill", mode: "linked", all: 24 },
  {
    id: "editorial",
    nameRu: "Контраст",
    nameEn: "Editorial",
    mode: "custom",
    all: 12,
    messages: 18,
    composer: 22,
    buttons: 8,
    cards: 14,
    code: 6,
    sidebar: 8,
    overlays: 20,
    inputs: 10,
  },
];

const FONT_PRESETS = {
  ui: [
    { id: "system", label: "Системный (Default)", labelEn: "System Default", stack: "", googleQuery: "" },
    {
      id: "claude-sans",
      label: "Claude Sans (Anthropic)",
      labelEn: "Claude Sans (Anthropic)",
      badge: "Claude",
      stack: '"Anthropic Sans", "Styrene B", "Styrene A", "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      googleQuery: "family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700",
    },
    {
      id: "claude-serif",
      label: "Claude Editorial (Serif)",
      labelEn: "Claude Editorial (Serif)",
      badge: "Claude",
      stack: '"Anthropic Serif", "Tiempos Text", "Source Serif 4", "Lora", Georgia, Cambria, serif',
      googleQuery: "family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..600",
    },
    {
      id: "claude-lora",
      label: "Claude Reading (Lora)",
      labelEn: "Claude Reading (Lora)",
      badge: "Claude",
      stack: '"Lora", "Tiempos Text", Georgia, Cambria, serif',
      googleQuery: "family=Lora:ital,wght@0,400..700;1,400..600",
    },
    {
      id: "claude-mono-ui",
      label: "Claude Code CLI (Mono)",
      labelEn: "Claude Code CLI (Mono)",
      badge: "Claude Code",
      stack: '"Anthropic Mono", "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      googleQuery: "family=JetBrains+Mono:wght@400;500;600;700",
    },
    {
      id: "geist",
      label: "Geist Sans",
      labelEn: "Geist Sans",
      stack: '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      googleQuery: "family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600;700",
    },
    { id: "segoe", label: "Segoe UI", labelEn: "Segoe UI", stack: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif', googleQuery: "" },
    { id: "inter", label: "Inter", labelEn: "Inter", stack: '"Inter", "Segoe UI", system-ui, sans-serif', googleQuery: "family=Inter:wght@400;500;600;700" },
    { id: "rubik", label: "Rubik", labelEn: "Rubik", stack: '"Rubik", "Segoe UI", system-ui, sans-serif', googleQuery: "family=Rubik:wght@400;500;600;700" },
    { id: "ibm-plex", label: "IBM Plex Sans", labelEn: "IBM Plex Sans", stack: '"IBM Plex Sans", "Segoe UI", sans-serif', googleQuery: "family=IBM+Plex+Sans:wght@400;500;600;700" },
    { id: "georgia", label: "Georgia (Serif)", labelEn: "Georgia (Serif)", stack: 'Georgia, "Times New Roman", serif', googleQuery: "" },
  ],
  mono: [
    { id: "system", label: "Стандартный (Default)", labelEn: "System Mono", stack: "", googleQuery: "" },
    {
      id: "claude-mono",
      label: "Claude Code Mono (JetBrains)",
      labelEn: "Claude Code Mono (JetBrains)",
      badge: "Claude Code",
      stack: '"Anthropic Mono", "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      googleQuery: "family=JetBrains+Mono:wght@400;500;600;700",
    },
    {
      id: "geist-mono",
      label: "Geist Mono",
      labelEn: "Geist Mono",
      stack: '"Geist Mono", "JetBrains Mono", Consolas, monospace',
      googleQuery: "family=Geist+Mono:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600",
    },
    {
      id: "ibm-plex-mono",
      label: "IBM Plex Mono",
      labelEn: "IBM Plex Mono",
      stack: '"IBM Plex Mono", "JetBrains Mono", Consolas, monospace',
      googleQuery: "family=IBM+Plex+Mono:wght@400;500;600",
    },
    { id: "cascadia", label: "Cascadia Code", labelEn: "Cascadia Code", stack: '"Cascadia Code", Consolas, monospace', googleQuery: "" },
    { id: "jetbrains", label: "JetBrains Mono", labelEn: "JetBrains Mono", stack: '"JetBrains Mono", Consolas, monospace', googleQuery: "family=JetBrains+Mono:wght@400;500;600;700" },
    { id: "consolas", label: "Consolas", labelEn: "Consolas", stack: 'Consolas, "Courier New", monospace', googleQuery: "" },
    { id: "fira", label: "Fira Code", labelEn: "Fira Code", stack: '"Fira Code", Consolas, monospace', googleQuery: "family=Fira+Code:wght@400;500;600;700" },
  ],
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
  return list[0] || { id: "system", stack: "", googleQuery: "" };
}

function teBuildWebFontUrl(rawOrNormalized) {
  const cfg = rawOrNormalized && rawOrNormalized.typography ? rawOrNormalized : normalizeAppearance(rawOrNormalized);
  const ty = cfg.typography || DEFAULT_APPEARANCE.typography;
  const uiFont = teFindFont("ui", ty.uiFont);
  const monoFont = teFindFont("mono", ty.monoFont);
  const parts = [];
  const seen = new Set();
  const pushQuery = (q) => {
    if (!q || typeof q !== "string") return;
    const items = q.split("&");
    for (let i = 0; i < items.length; i += 1) {
      const tok = items[i].trim();
      if (tok && !seen.has(tok)) {
        seen.add(tok);
        parts.push(tok);
      }
    }
  };
  pushQuery(uiFont.googleQuery);
  pushQuery(monoFont.googleQuery);
  if (parts.length === 0) return "";
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
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

function teGetYiq(hex) {
  const { r, g, b } = teHexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function teIsLightColor(hex) {
  return teGetYiq(hex) > 145;
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
  if (s.startsWith("rudex-media://local/") || s.startsWith("agy-media://local/")) {
    return s.slice(0, 240);
  }
  if (s.startsWith("blob:") && s.length <= 240 && !/[\s"'<>]/.test(s)) return s;
  return "";
}

function teParseCssAlpha(rawAlpha) {
  const s = String(rawAlpha || "").trim();
  if (!s) return 1;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 1;
  return s.endsWith("%") ? n / 100 : n;
}

function teParseColorIsLight(rawColor) {
  const s = String(rawColor || "").trim().toLowerCase();
  if (!s || s === "transparent" || s === "none" || s === "initial" || s === "inherit") {
    return null;
  }

  const hexM = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
  if (hexM) {
    const h = hexM[1];
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 1;
    if (h.length === 3 || h.length === 4) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
      if (h.length === 4) a = parseInt(h[3] + h[3], 16) / 255;
    } else {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
      if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
    }
    if (a <= 0.05) return null;
    return (r * 299 + g * 587 + b * 114) / 1000 > 145;
  }

  const rgbM = /^rgba?\(\s*([^)]+)\s*\)$/i.exec(s);
  if (rgbM) {
    const slashParts = rgbM[1].split("/");
    if (slashParts.length > 1 && teParseCssAlpha(slashParts[1]) <= 0.05) {
      return null;
    }
    const comps = slashParts[0].trim().split(/[\s,]+/);
    if (comps.length < 3) return null;
    if (slashParts.length === 1 && comps.length >= 4 && teParseCssAlpha(comps[3]) <= 0.05) {
      return null;
    }
    const parseChannel = (tok) => {
      const n = parseFloat(tok);
      if (!Number.isFinite(n)) return NaN;
      return tok.endsWith("%") ? n * 2.55 : n;
    };
    const r = parseChannel(comps[0]);
    const g = parseChannel(comps[1]);
    const b = parseChannel(comps[2]);
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return null;
    return (r * 299 + g * 587 + b * 114) / 1000 > 145;
  }

  const okM = /^okl(?:ch|ab)\(\s*([^)]+)\s*\)$/i.exec(s);
  if (okM) {
    const slashParts = okM[1].split("/");
    if (slashParts.length > 1 && teParseCssAlpha(slashParts[1]) <= 0.05) {
      return null;
    }
    const comps = slashParts[0].trim().split(/[\s,]+/);
    if (!comps[0]) return null;
    const rawL = parseFloat(comps[0]);
    if (!Number.isFinite(rawL)) return null;
    const L = comps[0].endsWith("%") ? rawL / 100 : rawL;
    return L > 0.65;
  }

  const hslM = /^hsla?\(\s*([^)]+)\s*\)$/i.exec(s);
  if (hslM) {
    const slashParts = hslM[1].split("/");
    if (slashParts.length > 1 && teParseCssAlpha(slashParts[1]) <= 0.05) {
      return null;
    }
    const comps = slashParts[0].trim().split(/[\s,]+/);
    if (comps.length < 3) return null;
    if (slashParts.length === 1 && comps.length >= 4 && teParseCssAlpha(comps[3]) <= 0.05) {
      return null;
    }
    const l = parseFloat(comps[2]);
    if (!Number.isFinite(l)) return null;
    return l > 55;
  }

  return null;
}

function teHasClass(el, cls) {
  if (!el) return false;
  if (el.classList && typeof el.classList.contains === "function") {
    return el.classList.contains(cls);
  }
  if (typeof el.getAttribute === "function") {
    const raw = el.getAttribute("class");
    return typeof raw === "string" && raw.split(/\s+/).includes(cls);
  }
  return false;
}

function teGetAttr(el, name) {
  if (!el || typeof el.getAttribute !== "function") return "";
  const val = el.getAttribute(name);
  return typeof val === "string" ? val : "";
}

function detectHostIsLight(doc, win) {
  try {
    const htmlEl = doc && doc.documentElement ? doc.documentElement : null;
    const bodyEl = doc && doc.body ? doc.body : null;

    if (htmlEl) {
      const htmlTheme = teGetAttr(htmlEl, "data-theme").trim().toLowerCase();
      if (htmlTheme === "light" || teHasClass(htmlEl, "light")) return true;
      if (htmlTheme === "dark" || teHasClass(htmlEl, "dark")) return false;
    }

    if (bodyEl) {
      const bodyTheme = teGetAttr(bodyEl, "data-theme").trim().toLowerCase();
      if (
        bodyTheme === "light" ||
        teHasClass(bodyEl, "light") ||
        teHasClass(bodyEl, "vscode-light")
      ) {
        return true;
      }
      if (
        bodyTheme === "dark" ||
        teHasClass(bodyEl, "dark") ||
        teHasClass(bodyEl, "vscode-dark")
      ) {
        return false;
      }
    }

    const targets = [htmlEl, bodyEl];
    for (let i = 0; i < targets.length; i += 1) {
      const el = targets[i];
      if (!el) continue;
      if (win && typeof win.getComputedStyle === "function") {
        const cs = win.getComputedStyle(el);
        if (cs) {
          if (typeof cs.getPropertyValue === "function") {
            const bgVar = teParseColorIsLight(cs.getPropertyValue("--background"));
            if (bgVar !== null) return bgVar;
          }
          const bgCol = teParseColorIsLight(cs.backgroundColor);
          if (bgCol !== null) return bgCol;
        }
      } else if (el.style && el.style.backgroundColor) {
        const inlineCol = teParseColorIsLight(el.style.backgroundColor);
        if (inlineCol !== null) return inlineCol;
      }
    }

    if (win && typeof win.matchMedia === "function") {
      const mq = win.matchMedia("(prefers-color-scheme: light)");
      if (mq && mq.matches) return true;
    }
  } catch (_e) {}
  return false;
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

  const messageStyle =
    src.messageStyle === "solid" || src.messageStyle === "minimal" ? src.messageStyle : "glass";

  const rawRadius = Number.isFinite(Number(src.radius))
    ? Math.round(teClamp(src.radius, 0, 28, DEFAULT_APPEARANCE.radius))
    : DEFAULT_APPEARANCE.radius;
  const cSrc = src.corners && typeof src.corners === "object" ? src.corners : {};
  const cornerMode = cSrc.mode === "custom" ? "custom" : "linked";
  const allRadius = Number.isFinite(Number(cSrc.all))
    ? Math.round(teClamp(cSrc.all, 0, 28, rawRadius))
    : rawRadius;
  const effRadius = cornerMode === "linked" ? allRadius : rawRadius;

  const corners = {
    mode: cornerMode,
    all: allRadius,
    messages: Math.round(teClamp(cSrc.messages, 0, 28, allRadius)),
    composer: Math.round(teClamp(cSrc.composer, 0, 28, allRadius)),
    buttons: Math.round(teClamp(cSrc.buttons, 0, 28, cornerMode === "linked" ? allRadius : DEFAULT_APPEARANCE.corners.buttons)),
    cards: Math.round(teClamp(cSrc.cards, 0, 28, allRadius)),
    code: Math.round(teClamp(cSrc.code, 0, 24, cornerMode === "linked" ? Math.min(24, allRadius) : DEFAULT_APPEARANCE.corners.code)),
    sidebar: Math.round(teClamp(cSrc.sidebar, 0, 24, cornerMode === "linked" ? Math.min(24, allRadius) : DEFAULT_APPEARANCE.corners.sidebar)),
    overlays: Math.round(teClamp(cSrc.overlays, 0, 28, cornerMode === "linked" ? allRadius : DEFAULT_APPEARANCE.corners.overlays)),
    inputs: Math.round(teClamp(cSrc.inputs, 0, 24, cornerMode === "linked" ? Math.min(24, allRadius) : DEFAULT_APPEARANCE.corners.inputs)),
  };

  const gradStyle =
    wpSrc.gradStyle === "radial" || wpSrc.gradStyle === "mesh" ? wpSrc.gradStyle : "linear";
  const wpFit =
    wpSrc.fit === "contain" || wpSrc.fit === "fill" ? wpSrc.fit : "cover";
  const tintBlend =
    wpSrc.tintBlend === "multiply" ||
    wpSrc.tintBlend === "screen" ||
    wpSrc.tintBlend === "overlay" ||
    wpSrc.tintBlend === "soft-light"
      ? wpSrc.tintBlend
      : "normal";
  const rawRate = Number(wpSrc.playbackRate);
  const playbackRate = Number.isFinite(rawRate)
    ? Math.round(teClamp(rawRate, 0.25, 2.0, 1) * 100) / 100
    : 1;

  return {
    presetId,
    uiPolish: src.uiPolish !== false,
    customAccent: Boolean(src.customAccent),
    accentColor: teValidHex(src.accentColor, DEFAULT_APPEARANCE.accentColor),
    canvasBg: teValidHex(src.canvasBg, DEFAULT_APPEARANCE.canvasBg),
    cardBg: teValidHex(src.cardBg, DEFAULT_APPEARANCE.cardBg),
    glassOpacity: Math.round(teClamp(src.glassOpacity, 15, 100, DEFAULT_APPEARANCE.glassOpacity)),
    sidebarOpacity: Math.round(teClamp(src.sidebarOpacity, 15, 100, DEFAULT_APPEARANCE.sidebarOpacity)),
    glassBlur: Math.round(teClamp(src.glassBlur, 0, 36, DEFAULT_APPEARANCE.glassBlur)),
    messageCardOpacity: Math.round(teClamp(src.messageCardOpacity, 0, 96, DEFAULT_APPEARANCE.messageCardOpacity)),
    messageStyle,
    borderStrength: Math.round(teClamp(src.borderStrength, 0, 100, DEFAULT_APPEARANCE.borderStrength)),
    highContrastText: src.highContrastText !== false,
    radius: effRadius,
    corners,
    wallpaper: {
      type: wpType,
      gradientPreset: gradPresetObj.id,
      gradStyle,
      gradColors,
      gradAngle: Math.round(teClamp(wpSrc.gradAngle, 0, 360, gradPresetObj.angle)),
      gradAnimated: wpSrc.gradAnimated !== false,
      gradSpeed: Math.round(teClamp(wpSrc.gradSpeed, 6, 40, DEFAULT_APPEARANCE.wallpaper.gradSpeed)),
      mediaFile: mediaUrl ? mediaFile : "",
      mediaUrl,
      mediaMime: typeof wpSrc.mediaMime === "string" ? wpSrc.mediaMime.slice(0, 60) : "",
      fit: wpFit,
      posX: Math.round(teClamp(wpSrc.posX, 0, 100, 50)),
      posY: Math.round(teClamp(wpSrc.posY, 0, 100, 50)),
      offsetX: Math.round(teClamp(wpSrc.offsetX, -50, 50, 0)),
      offsetY: Math.round(teClamp(wpSrc.offsetY, -50, 50, 0)),
      dim: Math.round(teClamp(wpSrc.dim, 0, 85, DEFAULT_APPEARANCE.wallpaper.dim)),
      blur: Math.round(teClamp(wpSrc.blur, 0, 24, DEFAULT_APPEARANCE.wallpaper.blur)),
      opacity: Math.round(teClamp(wpSrc.opacity, 15, 100, DEFAULT_APPEARANCE.wallpaper.opacity)),
      brightness: Math.round(teClamp(wpSrc.brightness, 40, 160, 100)),
      contrast: Math.round(teClamp(wpSrc.contrast, 50, 160, 100)),
      saturate: Math.round(teClamp(wpSrc.saturate, 0, 200, DEFAULT_APPEARANCE.wallpaper.saturate)),
      hue: Math.round(teClamp(wpSrc.hue, -180, 180, 0)),
      scale: Math.round(teClamp(wpSrc.scale, 50, 250, DEFAULT_APPEARANCE.wallpaper.scale)),
      rotate: Math.round(teClamp(wpSrc.rotate, -180, 180, 0)),
      flipX: Boolean(wpSrc.flipX),
      flipY: Boolean(wpSrc.flipY),
      vignette: Math.round(teClamp(wpSrc.vignette, 0, 90, 0)),
      tintEnabled: Boolean(wpSrc.tintEnabled),
      tintOpacity: Math.round(teClamp(wpSrc.tintOpacity, 0, 75, DEFAULT_APPEARANCE.wallpaper.tintOpacity)),
      tintBlend,
      playbackRate,
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

function teHasCustomCorners(cfg) {
  const c = cfg && cfg.corners ? cfg.corners : DEFAULT_APPEARANCE.corners;
  if (c.mode === "custom") return true;
  return c.all !== 12 || cfg.radius !== 12;
}

function teResolveCornerRadii(rawOrNormalized) {
  const cfg = rawOrNormalized && rawOrNormalized.corners ? rawOrNormalized : normalizeAppearance(rawOrNormalized);
  const c = cfg.corners || DEFAULT_APPEARANCE.corners;
  if (c.mode === "custom") {
    return {
      mode: "custom",
      base: c.all,
      messages: c.messages,
      composer: c.composer,
      buttons: c.buttons,
      cards: c.cards,
      code: c.code,
      inlineCode: Math.max(0, Math.min(c.code, Math.round(c.code * 0.5))),
      sidebar: c.sidebar,
      tabs: Math.max(0, c.sidebar - 2),
      overlays: c.overlays,
      menuItem: Math.max(0, Math.round(c.overlays * 0.65)),
      inputs: c.inputs,
    };
  }
  const r = c.all;
  return {
    mode: "linked",
    base: r,
    messages: r,
    composer: r,
    buttons: r,
    cards: r,
    code: r,
    inlineCode: Math.max(0, Math.min(r, Math.round(r * 0.5))),
    sidebar: r,
    tabs: Math.max(0, r - 2),
    overlays: r,
    menuItem: Math.max(0, Math.round(r * 0.7)),
    inputs: r,
  };
}

function teHasCustomTypography(cfg) {
  const ty = cfg.typography;
  return (
    ty.uiFont !== "system" ||
    ty.monoFont !== "system" ||
    ty.fontSize !== 14 ||
    ty.lineHeight !== 1.55 ||
    ty.chatMaxWidth !== 0 ||
    ty.density !== "comfortable"
  );
}

function teHasActiveWallpaper(cfg) {
  const wp = cfg.wallpaper;
  return wp.type !== "none" && (wp.type === "gradient" || Boolean(wp.mediaUrl));
}

function isAppearanceNativeDefault(raw) {
  const cfg = normalizeAppearance(raw);
  return (
    cfg.presetId === "native" &&
    !cfg.customAccent &&
    cfg.uiPolish === true &&
    cfg.borderStrength === 50 &&
    cfg.radius === 12 &&
    !teHasCustomCorners(cfg) &&
    cfg.messageStyle === "glass" &&
    cfg.wallpaper.type === "none" &&
    !teHasCustomTypography(cfg)
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
      sidebarOpacity: cfg.sidebarOpacity,
      glassBlur: cfg.glassBlur,
      borderStrength: cfg.borderStrength,
      messageStyle: cfg.messageStyle,
      radius: cfg.radius,
    };
  }
  return Object.assign({}, preset.vars, {
    mode: preset.mode,
    accentColor: cfg.customAccent ? cfg.accentColor : preset.vars.accentColor,
    glassOpacity: cfg.glassOpacity,
    sidebarOpacity: cfg.sidebarOpacity,
    glassBlur: cfg.glassBlur,
    borderStrength: cfg.borderStrength,
    messageStyle: cfg.messageStyle,
    radius: cfg.radius,
  });
}

function teBuildGradientCss(wp) {
  const c1 = teValidHex(wp.gradColors && wp.gradColors[0], "#0f172a");
  const c2 = teValidHex(wp.gradColors && wp.gradColors[1], "#1e1b4b");
  const c3 = teValidHex(wp.gradColors && wp.gradColors[2], "#09090b");
  const posX = Math.round(teClamp(wp.posX, 0, 100, 50));
  const posY = Math.round(teClamp(wp.posY, 0, 100, 50));
  if (wp.gradStyle === "radial") {
    return `radial-gradient(circle at ${posX}% ${posY}%, ${c1} 0%, ${c2} 52%, ${c3} 100%)`;
  }
  if (wp.gradStyle === "mesh") {
    return `radial-gradient(at ${Math.max(10, posX - 25)}% ${Math.max(10, posY - 25)}%, ${c1} 0px, transparent 58%), radial-gradient(at ${Math.min(90, posX + 25)}% ${Math.min(90, posY + 15)}%, ${c2} 0px, transparent 60%), radial-gradient(at 50% 90%, ${c1} 0px, ${c3} 72%)`;
  }
  return `linear-gradient(${Math.round(teClamp(wp.gradAngle, 0, 360, 135))}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`;
}

function teBuildCornerRadiusCss(cfg, c) {
  const isCustom = c.mode === "custom";
  const base = c.base;
  const xs = base === 0 ? 0 : Math.max(2, Math.round(base * 0.35));
  const sm = base === 0 ? 0 : Math.max(3, Math.round(base * 0.6));
  const md = base === 0 ? 0 : Math.max(4, Math.round(base * 0.8));
  const lg = base;
  const xl = base === 0 ? 0 : Math.round(base * 1.25);
  const xl2 = base === 0 ? 0 : Math.round(base * 1.6);
  const xl3 = base === 0 ? 0 : Math.round(base * 2.0);
  const xl4 = base === 0 ? 0 : Math.round(base * 2.4);

  const btnPillRule = c.buttons <= 6 || isCustom
    ? `
body :where(button[class*="rounded-full"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not([role="radio"]):not([class*="size-4"]):not([class*="size-5"]):not([class*="size-6"]):not([class*="w-4"]):not([class*="w-5"]):not([class*="w-6"]):not([data-rudex-ignore="1"]) {
  border-radius: ${c.buttons}px !important;
}`
    : "";

  const linkedFallbackCss = !isCustom
    ? `
:where([class*="rounded-"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg):not(#rudex-bg *):not([data-rudex-ignore="1"]):not(.rounded-none):not(.rounded-full):not([class*="rounded-full"]):not([role="switch"]):not([role="switch"] *):not([role="radio"]):not(input[type="radio"]):not(input[type="checkbox"]):not(svg):not(svg *):not(.katex):not(.mermaid) {
  border-radius: ${base}px !important;
}
:where([class*="rounded-sm"], [class*="rounded-xs"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not([role="radio"]):not([data-rudex-ignore="1"]) {
  border-radius: ${sm}px !important;
}
:where([class*="rounded-md"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not([role="radio"]):not([data-rudex-ignore="1"]) {
  border-radius: ${md}px !important;
}
:where([class*="rounded-lg"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not([role="radio"]):not([data-rudex-ignore="1"]) {
  border-radius: ${lg}px !important;
}
:where([class*="rounded-xl"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not([role="radio"]):not([data-rudex-ignore="1"]) {
  border-radius: ${xl}px !important;
}
:where([class*="rounded-2xl"], [class*="rounded-3xl"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not([role="radio"]):not([data-rudex-ignore="1"]) {
  border-radius: ${xl2}px !important;
}`
    : "";

  return `
:root, html, body {
  --radius: ${base}px !important;
  --radius-xs: ${xs}px !important;
  --radius-sm: ${sm}px !important;
  --radius-md: ${md}px !important;
  --radius-lg: ${lg}px !important;
  --radius-xl: ${xl}px !important;
  --radius-2xl: ${xl2}px !important;
  --radius-3xl: ${xl3}px !important;
  --radius-4xl: ${xl4}px !important;
  --rudex-r-messages: ${c.messages}px;
  --rudex-r-composer: ${c.composer}px;
  --rudex-r-buttons: ${c.buttons}px;
  --rudex-r-cards: ${c.cards}px;
  --rudex-r-code: ${c.code}px;
  --rudex-r-sidebar: ${c.sidebar}px;
  --rudex-r-overlays: ${c.overlays}px;
  --rudex-r-inputs: ${c.inputs}px;
}
${linkedFallbackCss}
[data-testid="agent-response"],
[data-testid="user-message-bubble"],
[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  border-radius: ${c.messages}px !important;
}
[data-rudex-theme-composer="1"],
form:has(textarea):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
form:has([contenteditable="true"]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
[data-testid="composer"]:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
.composer-container:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
div:has(> textarea[placeholder]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])):not(#rudex-studio-host *) {
  border-radius: ${c.composer}px !important;
}
body :where(button, [role="button"], [data-slot="button"], [data-slot="toggle"], [data-testid="model-selector-trigger"], [data-testid="send-button-loading"], [data-testid="send-button-pending"], [data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not([role="radio"]):not([class*="rounded-full"]):not([data-rudex-ignore="1"]) {
  border-radius: ${c.buttons}px !important;
}${btnPillRule}
body :where([data-slot="card"], [class*="bg-card"], details, [data-testid*="card"], [data-testid*="tool"], [data-testid*="artifact"], [data-testid="agent-response"] :where(div, section, article)[class*="border"][class*="rounded-"]):not(button):not(input):not(textarea):not(pre):not([role="dialog"]):not([role="alertdialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]):not([data-testid="agent-response"]):not([data-testid="user-message-content"]):not([data-testid="user-message-bubble"]):not([data-testid="composer"]):not(aside):not(nav):not(#rudex-studio-host):not(#rudex-studio-host *) {
  border-radius: ${c.cards}px !important;
}
:where([data-testid="agent-response"], [data-markdown-root], main) :where(pre, [class*="code-block"], [data-testid*="code-block"], div:has(> pre)) {
  border-radius: ${c.code}px !important;
}
:where([data-testid="agent-response"], [data-markdown-root]) code:not(pre code) {
  border-radius: ${c.inlineCode}px !important;
}
:where(aside, nav[aria-label], [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]) :where(a, button, [role="listitem"], [role="treeitem"], [role="option"], [data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id], [class*="rounded-"]):not([role="switch"]):not([role="radio"]):not([class*="rounded-full"]):not(svg):not(img),
[role="tablist"],
[data-slot="tabs-list"] {
  border-radius: ${c.sidebar}px !important;
}
[role="tab"],
[data-slot="tabs-trigger"] {
  border-radius: ${c.tabs}px !important;
}
:where([role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [data-radix-popper-content-wrapper] > *, [data-radix-menu-content], .agy-overlay, [data-slot="dialog-content"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"], [data-slot="select-content"], [data-slot="tooltip-content"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  border-radius: ${c.overlays}px !important;
}
:where([role="menuitem"], [role="option"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  border-radius: ${c.menuItem}px !important;
}
:where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, [role="combobox"], [role="textbox"], [data-slot="input"], [data-slot="badge"], [class*="badge"], [class*="chip"], [class*="pill"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]) {
  border-radius: ${c.inputs}px !important;
}
`.trim();
}

function buildThemeCss(rawAppearance, options) {
  const cfg = normalizeAppearance(rawAppearance);
  const opts = options && typeof options === "object" ? options : {};
  const hasThemeOverride = cfg.presetId !== "native";
  const hasAccentOverride = Boolean(cfg.customAccent);
  const hasWallpaper = teHasActiveWallpaper(cfg);
  const hasCustomTypo = teHasCustomTypography(cfg);
  const hasCornersOverride = teHasCustomCorners(cfg);
  const hasSurfaceOverride =
    hasCornersOverride || cfg.radius !== 12 || cfg.borderStrength !== 50 || cfg.messageStyle !== "glass";

  if (!hasThemeOverride && !hasAccentOverride && !hasWallpaper && !hasCustomTypo && !hasSurfaceOverride && !cfg.uiPolish) {
    return "";
  }

  const vars = teResolveThemeVars(cfg);
  const cRadii = teResolveCornerRadii(cfg);
  const ty = cfg.typography;
  const uiFontObj = teFindFont("ui", ty.uiFont);
  const monoFontObj = teFindFont("mono", ty.monoFont);
  const isLight = hasThemeOverride ? vars.mode === "light" : Boolean(opts.hostIsLight);
  const borderAlpha = Math.round(teClamp(cfg.borderStrength, 0, 100, 50) * (isLight ? 0.28 : 0.26)) / 100;
  const dynamicBorderCol = isLight ? `rgba(15, 23, 42, ${borderAlpha})` : `rgba(255, 255, 255, ${borderAlpha})`;
  const effectiveBorder = cfg.borderStrength !== 50 ? dynamicBorderCol : vars.borderColor;
  const primaryFg = teGetYiq(vars.accentColor) > 155 ? "#111216" : "#ffffff";
  const chunks = [];

  const isGlassTheme = cfg.presetId === "liquid-glass" || cfg.presetId === "obsidian-glass" || cfg.presetId === "midnight-neon";
  const isClaudeTheme = cfg.presetId === "claude-code-dark" || cfg.presetId === "claude-code-light" || cfg.presetId === "claude-terminal";
  const effectiveBlurPx = Math.max(0, Math.round(teClamp(cfg.glassBlur, 0, 36, 12)));
  const opticalGlassFilter = effectiveBlurPx > 0
    ? `backdrop-filter: blur(${effectiveBlurPx}px) saturate(195%) brightness(${isLight ? "1.05" : "1.08"}) contrast(1.03); -webkit-backdrop-filter: blur(${effectiveBlurPx}px) saturate(195%) brightness(${isLight ? "1.05" : "1.08"}) contrast(1.03);`
    : "";
  const overlayGlassFilter = `backdrop-filter: blur(${Math.max(18, effectiveBlurPx)}px) saturate(195%) brightness(${isLight ? "1.04" : "1.06"}); -webkit-backdrop-filter: blur(${Math.max(18, effectiveBlurPx)}px) saturate(195%) brightness(${isLight ? "1.04" : "1.06"});`;
  const glassSheenGrad = isLight
    ? "linear-gradient(155deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.34) 50%, rgba(255, 255, 255, 0.52) 100%)"
    : "linear-gradient(155deg, rgba(255, 255, 255, 0.13) 0%, rgba(255, 255, 255, 0.025) 45%, rgba(255, 255, 255, 0.06) 100%)";
  const glassFresnelShadow = isLight
    ? "0 12px 30px -8px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.92), inset 0 -1px 0 rgba(15, 23, 42, 0.05)"
    : "0 14px 36px -8px rgba(0, 0, 0, 0.42), inset 0 1px 0.5px rgba(255, 255, 255, 0.28), inset 0 -1px 0 rgba(255, 255, 255, 0.07)";
  const glassSpecBorder = isLight ? "rgba(255, 255, 255, 0.65)" : "rgba(255, 255, 255, 0.18)";

  if (hasThemeOverride) {
    const cardAlpha = hasWallpaper ? Math.min(vars.glassOpacity, 88) : (isGlassTheme ? Math.min(vars.glassOpacity, 76) : Math.max(vars.glassOpacity, 90));
    const sidebarAlpha = hasWallpaper ? Math.min(vars.sidebarOpacity + 4, 94) : (isGlassTheme ? Math.min(vars.sidebarOpacity, 78) : 96);
    const secondaryHex = isClaudeTheme
      ? (isLight ? "#f0eee6" : (cfg.presetId === "claude-terminal" ? "#252422" : "#30302e"))
      : teMixHex(vars.cardBg, isLight ? "#000000" : "#ffffff", 0.06);
    const cardRgba = teHexToRgba(vars.cardBg, cardAlpha);
    const sidebarRgba = teHexToRgba(vars.sidebarBg, sidebarAlpha);

    const effectiveCard = (hasWallpaper || isGlassTheme) ? cardRgba : vars.cardBg;
    const effectiveSidebar = (hasWallpaper || isGlassTheme) ? sidebarRgba : vars.sidebarBg;

    chunks.push(`
:root, :root.dark, :root.light, html, html.dark, html.light, body, body.dark, body.light, .dark, .light {
  --background: ${vars.canvasBg} !important;
  --color-background: ${vars.canvasBg} !important;
  --bg-canvas: ${vars.canvasBg} !important;
  --bg-primary: ${vars.canvasBg} !important;
  --surface-0: ${vars.canvasBg} !important;
  --foreground: ${vars.fgColor} !important;
  --color-foreground: ${vars.fgColor} !important;
  --text-primary: ${vars.fgColor} !important;
  --primary: ${vars.accentColor} !important;
  --color-primary: ${vars.accentColor} !important;
  --accent-primary: ${vars.accentColor} !important;
  --brand: ${vars.accentColor} !important;
  --primary-foreground: ${primaryFg} !important;
  --color-primary-foreground: ${primaryFg} !important;
  --ring: ${vars.accentColor} !important;
  --color-ring: ${vars.accentColor} !important;
  --focus-border: ${vars.accentColor} !important;
  --link: ${vars.accentColor} !important;
  --color-link: ${vars.accentColor} !important;
  --link-foreground: ${vars.accentColor} !important;
  --secondary: ${secondaryHex} !important;
  --color-secondary: ${secondaryHex} !important;
  --bg-secondary: ${secondaryHex} !important;
  --surface-2: ${secondaryHex} !important;
  --secondary-foreground: ${vars.fgColor} !important;
  --color-secondary-foreground: ${vars.fgColor} !important;
  --accent: ${secondaryHex} !important;
  --color-accent: ${secondaryHex} !important;
  --accent-foreground: ${vars.fgColor} !important;
  --color-accent-foreground: ${vars.fgColor} !important;
  --muted: ${secondaryHex} !important;
  --color-muted: ${secondaryHex} !important;
  --muted-foreground: ${vars.mutedColor} !important;
  --color-muted-foreground: ${vars.mutedColor} !important;
  --text-secondary: ${vars.mutedColor} !important;
  --text-muted: ${vars.mutedColor} !important;
  --border: ${effectiveBorder} !important;
  --color-border: ${effectiveBorder} !important;
  --border-subtle: ${effectiveBorder} !important;
  --border-default: ${effectiveBorder} !important;
  --input: ${effectiveBorder} !important;
  --color-input: ${effectiveBorder} !important;
  --input-background: ${effectiveCard} !important;
  --bg-input: ${effectiveCard} !important;
  --bg-composer: ${effectiveCard} !important;
  --card: ${effectiveCard} !important;
  --color-card: ${effectiveCard} !important;
  --bg-surface: ${effectiveCard} !important;
  --bg-elevated: ${effectiveCard} !important;
  --surface-1: ${effectiveCard} !important;
  --card-foreground: ${vars.fgColor} !important;
  --color-card-foreground: ${vars.fgColor} !important;
  --card-border: ${effectiveBorder} !important;
  --popover: ${vars.cardBg} !important;
  --color-popover: ${vars.cardBg} !important;
  --popover-foreground: ${vars.fgColor} !important;
  --color-popover-foreground: ${vars.fgColor} !important;
  --sidebar: ${effectiveSidebar} !important;
  --sidebar-background: ${effectiveSidebar} !important;
  --bg-sidebar: ${effectiveSidebar} !important;
  --color-sidebar: ${effectiveSidebar} !important;
  --sidebar-foreground: ${vars.fgColor} !important;
  --color-sidebar-foreground: ${vars.fgColor} !important;
  --sidebar-border: ${effectiveBorder} !important;
  --color-sidebar-border: ${effectiveBorder} !important;
  --sidebar-accent: ${secondaryHex} !important;
  --color-sidebar-accent: ${secondaryHex} !important;
  --sidebar-accent-foreground: ${vars.fgColor} !important;
  --sidebar-primary: ${vars.accentColor} !important;
  --sidebar-secondary: ${secondaryHex} !important;
}
::selection {
  background-color: color-mix(in srgb, ${vars.accentColor} 28%, transparent);
  color: ${vars.fgColor};
}
`);
    if (isClaudeTheme) {
      const codeInlineBg = isLight ? "rgba(193, 95, 60, 0.10)" : "rgba(217, 119, 87, 0.14)";
      const codeInlineFg = isLight ? "#9e4425" : "#e89b76";
      const codeBlockBg = isLight ? "#f4f2eb" : (cfg.presetId === "claude-terminal" ? "#10100f" : "#191817");
      chunks.push(`
[data-testid="agent-response"] code:not(pre code),
[data-markdown-root] code:not(pre code) {
  background-color: ${codeInlineBg} !important;
  color: ${codeInlineFg} !important;
  border: 1px solid color-mix(in srgb, ${vars.accentColor} 22%, transparent);
  padding: 1px 5px;
  border-radius: 5px;
}
:where([data-testid="agent-response"], [data-markdown-root]) pre {
  background-color: ${codeBlockBg} !important;
  border: 1px solid ${effectiveBorder} !important;
}
[data-testid="agent-response"] blockquote,
[data-markdown-root] blockquote {
  border-left: 2px solid ${vars.accentColor} !important;
  color: ${vars.mutedColor};
}
`);
    }
    // Unify blue/link/accent utility classes & unread dots across Antigravity with active theme accent
    chunks.push(`
[data-testid="agent-response"] a,
[data-markdown-root] a,
main a:not(#rudex-studio-host *):not([role="button"]),
:where(a, span, button, svg)[class*="text-blue-"]:not(#rudex-studio-host):not(#rudex-studio-host *),
:where(a, span, button, svg)[class*="text-sky-"]:not(#rudex-studio-host):not(#rudex-studio-host *),
:where(a, span, button, svg)[class*="text-indigo-"]:not(#rudex-studio-host):not(#rudex-studio-host *),
:where(a, span, button, svg)[class*="text-cyan-"]:not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.accentColor} !important;
  text-decoration-color: color-mix(in srgb, ${vars.accentColor} 45%, transparent);
}
[data-rudex-theme-accent-dot="1"],
:where(div, span, button)[class*="bg-blue-"]:not(#rudex-studio-host):not(#rudex-studio-host *),
:where(div, span, button)[class*="bg-sky-"]:not(#rudex-studio-host):not(#rudex-studio-host *),
:where(div, span, button)[class*="bg-indigo-"]:not(#rudex-studio-host):not(#rudex-studio-host *),
:where(div, span, button)[class*="bg-cyan-5"]:not(#rudex-studio-host):not(#rudex-studio-host *),
:where(button, [role="button"])[class*="bg-primary"]:not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${vars.accentColor} !important;
}
:where(button, [role="button"]):where([class*="bg-primary"], [class*="bg-blue-"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${primaryFg} !important;
}
:where(div, button, input, textarea)[class*="border-blue-"]:not(#rudex-studio-host):not(#rudex-studio-host *),
:where(div, button, input, textarea)[class*="border-sky-"]:not(#rudex-studio-host):not(#rudex-studio-host *) {
  border-color: ${vars.accentColor} !important;
}
`);
    if (!hasWallpaper) {
      if (cfg.presetId === "liquid-glass") {
        chunks.push(`
html, body {
  background-color: ${vars.canvasBg} !important;
  background-image: radial-gradient(62% 54% at 14% 12%, rgba(10, 132, 255, 0.24), transparent 72%), radial-gradient(56% 52% at 88% 18%, rgba(99, 102, 241, 0.20), transparent 74%), radial-gradient(60% 58% at 54% 92%, rgba(6, 182, 212, 0.16), transparent 76%) !important;
  background-attachment: fixed !important;
  color: ${vars.fgColor};
}
`);
      } else {
        const lightTextFixCss = isLight
          ? `
:where(div, span, p, h1, h2, h3, h4, li, button, a, label)[class*="text-white"]:not([class*="bg-primary"]):not([class*="bg-blue-"]):not(#rudex-studio-host):not(#rudex-studio-host *),
:where(div, span, p, h1, h2, h3, h4, li, button, a, label):where([class*="text-zinc-1"], [class*="text-zinc-2"], [class*="text-zinc-3"], [class*="text-neutral-1"], [class*="text-neutral-2"], [class*="text-neutral-3"], [class*="text-gray-1"], [class*="text-gray-2"], [class*="text-gray-3"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.fgColor} !important;
}
:where(div, span, p, li, button, label):where([class*="text-zinc-4"], [class*="text-zinc-5"], [class*="text-neutral-4"], [class*="text-neutral-5"], [class*="text-gray-4"], [class*="text-gray-5"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.mutedColor} !important;
}`
          : "";
        chunks.push(`
html, body, #root, #app {
  background-color: ${vars.canvasBg} !important;
  color: ${vars.fgColor} !important;
}
[data-rudex-bg-shell="1"],
main:not([role="dialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]),
[data-testid="chat-container"]:not([role="dialog"]),
[data-testid="conversation-view"]:not([role="dialog"]),
:where(div, section)[class*="bg-background"]:where(:not(aside, nav, header, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"], [data-rudex-theme-composer="1"], [role="button"], [role="tab"], [role="switch"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [class*="badge"], [class*="chip"], [class*="pill"], [data-slot="badge"], [data-slot="button"], [data-rudex-ignore="1"])) {
  background-color: ${vars.canvasBg} !important;
  color: ${vars.fgColor};
}
[data-rudex-bg-fade="1"],
[data-rudex-bg-fade="1"]::before,
[data-rudex-bg-fade="1"]::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
}
[data-rudex-bg-sidebar="1"],
aside,
nav[aria-label],
[data-testid="sidebar"],
:where(div, aside, nav)[class*="bg-sidebar"]:not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${vars.sidebarBg} !important;
  border-color: ${effectiveBorder} !important;
  color: ${vars.fgColor};
}
[data-rudex-bg-header="1"],
header:not(#rudex-studio-host *) {
  background-color: ${vars.sidebarBg} !important;
  border-color: ${effectiveBorder} !important;
  color: ${vars.fgColor};
  z-index: 30 !important;
  isolation: isolate;
}
:where([data-rudex-bg-sidebar="1"], aside, [data-testid="sidebar"]) :where([aria-current="page"], [aria-selected="true"], [data-active="true"], [data-state="active"]):not(#rudex-studio-host *) {
  background-color: ${secondaryHex} !important;
  color: ${vars.fgColor} !important;
}
[data-rudex-theme-composer="1"],
form:has(textarea):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
form:has([contenteditable="true"]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
[data-testid="composer"]:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
.composer-container:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
div:has(> textarea[placeholder]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])):not(#rudex-studio-host *),
div:has(> [contenteditable="true"]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])):not([data-rudex-bg-shell="1"]):not(main):not(#rudex-studio-host *) {
  background-color: ${vars.cardBg} !important;
  border-color: ${effectiveBorder} !important;
  color: ${vars.fgColor} !important;
}
[data-rudex-theme-composer="1"] :where(textarea, [contenteditable="true"]),
[data-rudex-theme-composer="1"] :where(form, [data-testid="composer"], .composer-container),
[data-rudex-theme-composer="1"] div:has(> textarea),
[data-rudex-theme-composer="1"] div:has(> [contenteditable="true"]) {
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  color: ${vars.fgColor} !important;
  caret-color: ${vars.accentColor} !important;
}
[data-testid="user-message-bubble"],
[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  background-color: ${vars.cardBg} !important;
  border-color: ${effectiveBorder} !important;
  color: ${vars.fgColor} !important;
}
[data-testid="user-message-bubble"] [data-testid="user-message-content"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  margin-bottom: 0 !important;
}
[role="dialog"],
[role="alertdialog"],
[role="menu"],
[role="listbox"],
[role="tooltip"],
[data-radix-popper-content-wrapper] > *,
.agy-overlay,
:where([data-slot="card"], [class*="bg-card"], [class*="bg-popover"]):not([data-testid="agent-response"]):not([data-slot="collapsible"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${vars.cardBg} !important;
  border-color: ${effectiveBorder} !important;
  color: ${vars.fgColor};
}
[data-testid="agent-response"] [data-slot="collapsible"]:not([class*="border"]):not([class*="bg-"]) {
  background-color: transparent !important;
}
:where(div, section, aside, header, nav)[class*="bg-zinc-950"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(pre),
:where(div, section, aside, header, nav)[class*="bg-neutral-950"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(pre),
:where(div, section, aside, header, nav)[class*="bg-gray-950"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(pre),
:where(div, section, aside, header, nav)[class*="bg-slate-950"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(pre),
:where(div, section, aside, header, nav)[class*="bg-stone-950"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(pre) {
  background-color: ${vars.sidebarBg} !important;
}
:where(div, section, form, article)[class*="bg-zinc-900"]:not([data-testid="agent-response"]):not([data-slot="collapsible"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(pre):not(code),
:where(div, section, form, article)[class*="bg-neutral-900"]:not([data-testid="agent-response"]):not([data-slot="collapsible"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(pre):not(code),
:where(div, section, form, article)[class*="bg-gray-900"]:not([data-testid="agent-response"]):not([data-slot="collapsible"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(pre):not(code),
:where(div, section, form, article)[class*="bg-slate-900"]:not([data-testid="agent-response"]):not([data-slot="collapsible"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(pre):not(code),
:where(div, section, form, article)[class*="bg-stone-900"]:not([data-testid="agent-response"]):not([data-slot="collapsible"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(pre):not(code) {
  background-color: ${vars.cardBg} !important;
}
:where(div, section, button, span)[class*="bg-secondary"]:not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]),
:where(div, section, button, span)[class*="bg-muted"]:not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]),
:where(div, section, button)[class*="bg-zinc-800"]:not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not(pre):not(code),
:where(div, section, button)[class*="bg-neutral-800"]:not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not(pre):not(code),
:where(div, section, button)[class*="bg-gray-800"]:not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not(pre):not(code) {
  background-color: ${secondaryHex} !important;
}
:where(div, section, aside, header, main, form, button, input, textarea):where([class*="border-zinc-"], [class*="border-neutral-"], [class*="border-gray-"], [class*="border-slate-"], [class*="border-stone-"], [class*="border-white/"], [class*="border-black/"], [class*="border-border"], [class*="border-input"], [class*="border-sidebar-border"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class*="border-transparent"]):not([class*="border-none"]):not([class*="border-0"]):not([class*="border-blue-"]):not([class*="border-primary"]) {
  border-color: ${effectiveBorder};
}
:where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.fgColor} !important;
  caret-color: ${vars.accentColor} !important;
}${lightTextFixCss}
`);
      }
      if (isGlassTheme && cfg.messageStyle === "glass") {
        const glassSidebarNoWp = teHexToRgba(vars.sidebarBg, Math.round(teClamp(cfg.sidebarOpacity, 15, 100, 62)));
        const glassCardNoWp = teHexToRgba(vars.cardBg, Math.round(teClamp(cfg.glassOpacity, 15, 100, 56)));
        const glassMsgNoWp = teHexToRgba(vars.cardBg, Math.round(teClamp(cfg.messageCardOpacity, 0, 96, 58)));
        const glassOverlayNoWp = isLight ? "rgba(255, 255, 255, 0.78)" : teHexToRgba(vars.cardBg, Math.min(88, Math.max(66, cfg.glassOpacity + 16)));
        chunks.push(`
[data-rudex-bg-sidebar="1"],
aside,
nav[aria-label],
[data-testid="sidebar"] {
  background-color: ${glassSidebarNoWp} !important;
  background-image: ${glassSheenGrad};
  border-right: 1px solid ${glassSpecBorder};
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
  ${opticalGlassFilter}
}
[data-rudex-bg-header="1"],
header {
  background-color: ${glassSidebarNoWp} !important;
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
  ${opticalGlassFilter}
}
[data-testid="agent-response"] {
  background-color: ${glassMsgNoWp} !important;
  background-image: ${glassSheenGrad};
  border: 1px solid ${glassSpecBorder} !important;
  border-radius: ${cRadii.messages}px !important;
  padding-inline: 18px !important;
  box-shadow: ${glassFresnelShadow};
  ${opticalGlassFilter}
}
[data-testid="user-message-bubble"],
[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  background-color: ${glassCardNoWp} !important;
  background-image: ${glassSheenGrad};
  border: 1px solid ${glassSpecBorder} !important;
  border-radius: ${cRadii.messages}px !important;
  box-shadow: ${glassFresnelShadow};
  ${opticalGlassFilter}
}
[data-testid="user-message-bubble"] [data-testid="user-message-content"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  margin-bottom: 0 !important;
}
[data-rudex-theme-composer="1"],
form:has(textarea[placeholder]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
form:has([contenteditable="true"]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
[data-testid="composer"]:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
.composer-container:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])) {
  background-color: ${glassCardNoWp} !important;
  background-image: ${glassSheenGrad};
  border: 1px solid ${glassSpecBorder} !important;
  border-radius: ${cRadii.composer}px !important;
  box-shadow: ${glassFresnelShadow};
  ${opticalGlassFilter}
}
[role="dialog"],
[role="alertdialog"],
[role="menu"],
[role="listbox"],
[role="tooltip"],
[data-radix-popper-content-wrapper] > *,
.agy-overlay {
  background-color: ${glassOverlayNoWp} !important;
  background-image: ${glassSheenGrad};
  border: 1px solid ${glassSpecBorder};
  box-shadow: ${glassFresnelShadow};
  ${overlayGlassFilter}
}
`);
      }
    }
  } else if (hasAccentOverride || cfg.borderStrength !== 50) {
    const nativeVars = [];
    if (hasAccentOverride) {
      nativeVars.push(`  --primary: ${vars.accentColor};`, `  --primary-foreground: ${primaryFg};`, `  --link: ${vars.accentColor};`);
    }
    if (cfg.borderStrength !== 50) {
      nativeVars.push(`  --border: ${dynamicBorderCol};`, `  --card-border: ${dynamicBorderCol};`);
    }
    chunks.push(`:root, html, body {\n${nativeVars.join("\n")}\n}`);
  }

  let msgAlpha = 0;
  if (hasWallpaper) {
    const baseGlass = hasThemeOverride ? vars.glassOpacity : cfg.glassOpacity;
    const surfaceBg = hasThemeOverride
      ? teHexToRgba(vars.cardBg, vars.glassOpacity)
      : teHexToRgba(isLight ? "#ffffff" : "#131316", cfg.glassOpacity);
    const sidebarAlpha = Math.round(teClamp(cfg.sidebarOpacity, 20, 100, 72));
    const headerAlpha = Math.min(96, Math.max(82, Math.max(sidebarAlpha - 2, baseGlass)));
    const sidebarGlassBg = hasThemeOverride
      ? teHexToRgba(vars.sidebarBg, sidebarAlpha)
      : teHexToRgba(isLight ? "#f4f5f8" : "#0e0e12", sidebarAlpha);
    const headerGlassBg = hasThemeOverride
      ? teHexToRgba(vars.sidebarBg, headerAlpha)
      : teHexToRgba(isLight ? "#f4f5f8" : "#0e0e12", headerAlpha);
    const popoverBg = hasThemeOverride
      ? teHexToRgba(vars.cardBg, Math.min(96, Math.max(78, vars.glassOpacity + 14)))
      : (isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(18, 20, 28, 0.86)");
    const blurPx = effectiveBlurPx;
    const glassBlurCss = opticalGlassFilter;
    const msgStyle = cfg.messageStyle;
    const rawMsgAlpha = Math.round(teClamp(cfg.messageCardOpacity, 0, 96, 74));
    msgAlpha = msgStyle === "minimal" ? 0 : (msgStyle === "solid" ? Math.max(92, rawMsgAlpha) : rawMsgAlpha);
    const agentSurfaceBg = msgAlpha <= 0
      ? "transparent"
      : (hasThemeOverride
          ? (isLight
              ? teHexToRgba("#ffffff", Math.min(96, msgAlpha + 8))
              : teHexToRgba(vars.cardBg, msgAlpha))
          : (isLight
              ? teHexToRgba("#ffffff", Math.min(96, msgAlpha + 8))
              : teHexToRgba("#0c0d12", msgAlpha)));
    const userAlpha = msgStyle === "minimal" ? Math.min(80, Math.max(28, Math.round(rawMsgAlpha * 0.48))) : Math.min(96, msgAlpha + 6);
    const userSurfaceBg = msgStyle !== "minimal" && msgAlpha <= 0
      ? surfaceBg
      : (hasThemeOverride
          ? (isLight
              ? teHexToRgba("#ffffff", Math.min(96, userAlpha + 6))
              : teHexToRgba(vars.cardBg, userAlpha))
          : (isLight
              ? teHexToRgba("#ffffff", Math.min(96, userAlpha + 6))
              : teHexToRgba("#12141c", userAlpha)));
    const composerAlpha = Math.min(96, Math.max(82, userAlpha));
    const composerSurfaceBg = hasThemeOverride
      ? teHexToRgba(vars.cardBg, composerAlpha)
      : (isLight ? teHexToRgba("#ffffff", Math.min(96, composerAlpha + 4)) : teHexToRgba("#15151a", composerAlpha));
    const solidBorderAlpha = msgStyle === "solid" ? Math.max(borderAlpha, 0.14) : borderAlpha;
    const msgBorderCol = isLight ? `rgba(15, 23, 42, ${solidBorderAlpha})` : `rgba(255, 255, 255, ${solidBorderAlpha})`;
    const composerBorderCol = hasThemeOverride ? effectiveBorder : msgBorderCol;
    const msgBlurCss = msgAlpha > 0 && msgStyle !== "solid" && blurPx > 0 ? glassBlurCss : "";
    const msgShadowCss = msgAlpha > 0
      ? (msgStyle === "glass"
          ? `box-shadow: ${glassFresnelShadow};`
          : (isLight ? "box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);" : "box-shadow: 0 4px 24px rgba(0, 0, 0, 0.34);"))
      : "";
    const msgSheenCss = msgAlpha > 0 && msgStyle === "glass" ? `background-image: ${glassSheenGrad};` : "";
    const hasCardBorder = cfg.borderStrength > 0 && msgAlpha > 0 && msgStyle !== "minimal";
    const linkColWp = hasThemeOverride ? vars.accentColor : (isLight ? "#1d4ed8" : "#7cb3ff");
    const wpInlineCodeCss = isClaudeTheme
      ? ""
      : (isLight
          ? `
[data-testid="agent-response"] code:not(pre code), [data-markdown-root] code:not(pre code) {
  background-color: rgba(15, 23, 42, 0.09) !important;
  border: 1px solid rgba(15, 23, 42, 0.14);
  color: #111216 !important;
  padding: 1px 5px;
  border-radius: 5px;
}`
          : `
[data-testid="agent-response"] code:not(pre code), [data-markdown-root] code:not(pre code) {
  background-color: rgba(8, 9, 14, 0.62) !important;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f8fafc !important;
  padding: 1px 5px;
  border-radius: 5px;
}`);
    const msgContrastCss = cfg.highContrastText !== false
      ? (isLight
          ? `
[data-testid="agent-response"], [data-testid="user-message-content"], [data-markdown-root] {
  color: ${hasThemeOverride ? vars.fgColor : "#111216"} !important;
  --foreground: ${hasThemeOverride ? vars.fgColor : "#111216"};
  --muted-foreground: ${hasThemeOverride ? vars.mutedColor : "#3f4452"};
}
[data-testid="agent-response"] a, [data-markdown-root] a {
  color: ${linkColWp} !important;
}${wpInlineCodeCss}
:where([data-testid="agent-response"], [data-markdown-root]) pre {
  border: 1px solid rgba(15, 23, 42, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  border-radius: ${Math.max(6, vars.radius - 2)}px;
}`
          : `
[data-testid="agent-response"], [data-testid="user-message-content"], [data-markdown-root] {
  color: ${hasThemeOverride ? vars.fgColor : "#f4f5f8"} !important;
  --foreground: ${hasThemeOverride ? vars.fgColor : "#f4f5f8"};
  --muted-foreground: ${hasThemeOverride ? vars.mutedColor : "#c4c8d4"};
}
[data-testid="agent-response"] a, [data-markdown-root] a {
  color: ${linkColWp} !important;
}${wpInlineCodeCss}
:where([data-testid="agent-response"], [data-markdown-root]) pre {
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border-radius: ${Math.max(6, vars.radius - 2)}px;
}`)
      : "";
    const fallbackBg = hasThemeOverride ? vars.canvasBg : (isLight ? "#f6f7fa" : "#09090b");

    if (cfg.wallpaper.type === "gradient") {
      chunks.push(`
@keyframes rudex-grad-flow {
  0% { transform: translate3d(-16%, -14%, 0); }
  50% { transform: translate3d(16%, 14%, 0); }
  100% { transform: translate3d(-16%, -14%, 0); }
}
#rudex-bg[data-hidden="1"] [data-role="bg-gradient-flow"] {
  animation-play-state: paused !important;
}
@media (prefers-reduced-motion: reduce) {
  #rudex-bg [data-role="bg-gradient-flow"] {
    animation-play-state: paused !important;
  }
}
`);
    }

    chunks.push(`
:root, :root.dark, :root.light, html, html.dark, html.light, body, body.dark, body.light, .dark, .light {
  --background: transparent !important;
  --color-background: transparent !important;
  --canvas: transparent !important;
  --bg-canvas: transparent !important;
  --bg-primary: transparent !important;
  --surface-0: transparent !important;
  --sidebar: ${sidebarGlassBg} !important;
  --sidebar-background: ${sidebarGlassBg} !important;
  --bg-sidebar: ${sidebarGlassBg} !important;
  --color-sidebar: ${sidebarGlassBg} !important;
  --card: ${surfaceBg} !important;
  --color-card: ${surfaceBg} !important;
}
html {
  background-color: ${fallbackBg} !important;
}
body {
  background-color: transparent !important;
  background-image: none !important;
  isolation: isolate;
}
#root, #app {
  background-color: transparent !important;
  background-image: none !important;
}
#rudex-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
[data-rudex-bg-shell="1"] {
  background-color: transparent !important;
  background-image: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
[data-rudex-bg-fade="1"],
[data-rudex-bg-fade="1"]::before,
[data-rudex-bg-fade="1"]::after,
:where(div, section)[class*="bg-gradient-"]:where(:not(#rudex-studio-host, #rudex-studio-host *, [role="dialog"], [role="button"], button, [data-testid="agent-response"], [data-testid="user-message-bubble"], [data-rudex-theme-composer="1"], [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"])),
:where(div, section)[class*="bg-linear-"]:where(:not(#rudex-studio-host, #rudex-studio-host *, [role="dialog"], [role="button"], button, [data-testid="agent-response"], [data-testid="user-message-bubble"], [data-rudex-theme-composer="1"], [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"])) {
  background-image: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border-color: transparent !important;
}
main:not([role="dialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]),
[data-testid="chat-container"]:not([role="dialog"]),
[data-testid="conversation-view"]:not([role="dialog"]),
:where(div, section)[class*="bg-background"]:where(:not(aside, nav, header, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"], [data-rudex-theme-composer="1"], [role="button"], [role="tab"], [role="switch"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [class*="badge"], [class*="chip"], [class*="pill"], [data-slot="badge"], [data-slot="button"], [data-rudex-ignore="1"])),
:where(div, section).bg-black:where(:not(aside, nav, header, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"], [data-rudex-theme-composer="1"], [role="button"], [role="tab"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [class*="badge"], [class*="chip"], [class*="pill"], [data-rudex-ignore="1"])) {
  background-color: transparent !important;
}
[data-rudex-bg-sidebar="1"],
aside,
nav[aria-label],
[data-testid="sidebar"] {
  background-color: ${sidebarGlassBg} !important;
  ${msgStyle === "glass" ? `background-image: ${glassSheenGrad}; box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.07);` : ""}
  ${glassBlurCss}
}
[data-rudex-bg-header="1"],
header:not(#rudex-studio-host *) {
  background-color: ${headerGlassBg} !important;
  border-bottom-color: ${effectiveBorder} !important;
  z-index: 30 !important;
  isolation: isolate;
  ${msgStyle === "glass" ? "background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%);" : ""}
  ${glassBlurCss}
}
[data-testid="agent-response"] {
  position: relative;
  z-index: 0;
  background-color: ${agentSurfaceBg} !important;
  ${msgSheenCss}
  border: ${hasCardBorder ? `1px solid ${msgBorderCol}` : "none"} !important;
  border-radius: ${cRadii.messages}px !important;
  ${msgAlpha > 0 ? "padding-inline: 18px !important;" : ""}
  ${msgShadowCss}
  ${msgBlurCss}
  ${msgAlpha <= 0 && cfg.highContrastText !== false ? `text-shadow: ${isLight ? "0 1px 2px rgba(255,255,255,0.85)" : "0 1px 3px rgba(0,0,0,0.85)"};` : ""}
}
[data-testid="user-message-bubble"],
[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  background-color: ${userSurfaceBg} !important;
  ${msgStyle === "glass" ? `background-image: ${glassSheenGrad};` : ""}
  border: ${cfg.borderStrength > 0 ? `1px solid ${msgBorderCol}` : "none"} !important;
  border-radius: ${cRadii.messages}px !important;
  ${msgShadowCss}
  ${msgStyle !== "solid" ? glassBlurCss : ""}
}
[data-testid="user-message-bubble"] [data-testid="user-message-content"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  margin-bottom: 0 !important;
}
${msgContrastCss}
[data-rudex-theme-composer="1"],
form:has(textarea):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
form:has([contenteditable="true"]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
[data-testid="composer"]:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
.composer-container:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
div:has(> textarea[placeholder]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])):not(#rudex-studio-host *),
div:has(> [contenteditable="true"]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])):not([data-rudex-bg-shell="1"]):not(main):not(#rudex-studio-host *) {
  background-color: ${composerSurfaceBg} !important;
  ${msgStyle === "glass" ? `background-image: ${glassSheenGrad}; box-shadow: ${glassFresnelShadow};` : ""}
  border: ${cfg.borderStrength > 0 ? `1px solid ${composerBorderCol}` : "none"} !important;
  border-radius: ${cRadii.composer}px !important;
  color: ${vars.fgColor} !important;
  ${msgStyle !== "solid" ? glassBlurCss : ""}
}
[data-rudex-theme-composer="1"] :where(textarea, [contenteditable="true"]),
[data-rudex-theme-composer="1"] :where(form, [data-testid="composer"], .composer-container),
[data-rudex-theme-composer="1"] div:has(> textarea),
[data-rudex-theme-composer="1"] div:has(> [contenteditable="true"]) {
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  color: ${vars.fgColor} !important;
  caret-color: ${vars.accentColor} !important;
}
[role="dialog"],
[role="alertdialog"],
[role="menu"],
[role="listbox"],
[role="tooltip"],
[data-radix-popper-content-wrapper] > *,
.agy-overlay {
  background-color: ${popoverBg} !important;
  ${msgStyle === "glass" ? `background-image: ${glassSheenGrad}; border: 1px solid ${glassSpecBorder}; box-shadow: ${glassFresnelShadow}; ${overlayGlassFilter}` : ""}
}
`);
  } else if (hasSurfaceOverride) {
    const surfaceBg = hasThemeOverride
      ? teHexToRgba(vars.cardBg, Math.max(85, cfg.messageCardOpacity))
      : (isLight ? "rgba(255, 255, 255, 0.94)" : "rgba(22, 22, 28, 0.92)");
    const agentBg = cfg.messageStyle === "solid"
      ? surfaceBg
      : (cfg.messageStyle === "minimal" ? "transparent" : "");
    const agentBorder = cfg.messageStyle === "minimal" || cfg.borderStrength === 0 || (cfg.messageStyle === "glass" && cfg.borderStrength === 50)
      ? "none"
      : `1px solid ${dynamicBorderCol}`;
    const needsAgentPad = agentBorder !== "none" || (Boolean(agentBg) && agentBg !== "transparent");
    chunks.push(`
[data-testid="agent-response"] {
  border-radius: ${cRadii.messages}px !important;
  ${agentBorder !== "none" ? `border: ${agentBorder} !important;` : "border: none !important;"}
  ${needsAgentPad ? "padding: 14px 18px !important;" : ""}
  ${agentBg ? `background-color: ${agentBg} !important;` : ""}
}
[data-testid="user-message-bubble"],
[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *),
[data-rudex-theme-composer="1"],
form:has(textarea[placeholder]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
form:has([contenteditable="true"]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
[data-testid="composer"]:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
.composer-container:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])) {
  border-radius: ${cRadii.composer}px !important;
  border: ${cfg.borderStrength > 0 ? `1px solid ${dynamicBorderCol}` : "none"} !important;
}
[data-testid="user-message-bubble"] [data-testid="user-message-content"] {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  margin-bottom: 0 !important;
}
`);
  }

  if (hasCornersOverride) {
    chunks.push(teBuildCornerRadiusCss(cfg, cRadii));
  }

  if (uiFontObj.stack) {
    const isSerifUi = uiFontObj.id === "claude-serif" || uiFontObj.id === "claude-lora" || uiFontObj.id === "georgia";
    chunks.push(`
:root, html, body {
  --font-sans: ${uiFontObj.stack};
  --font-body: ${uiFontObj.stack};
}
body, input, textarea, button, select, [data-markdown-root], [data-testid="agent-response"], [data-testid="user-message-content"] {
  font-family: ${uiFontObj.stack} !important;
  ${isSerifUi ? 'text-rendering: optimizeLegibility; font-feature-settings: "kern" 1, "liga" 1;' : ""}
}
`);
  }

  if (monoFontObj.stack) {
    chunks.push(`
:root, html, body {
  --font-mono: ${monoFontObj.stack};
}
code, pre, kbd, samp, [class*="font-mono"] {
  font-family: ${monoFontObj.stack} !important;
  font-variant-ligatures: contextual;
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
[data-testid="agent-response"], [data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  max-width: min(100%, ${ty.chatMaxWidth}px) !important;
  margin-inline: auto !important;
}
`);
  }

  if (ty.density === "compact") {
    chunks.push(`
[data-testid="agent-response"], [data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  margin-bottom: 4px !important;
}
[data-testid="user-message-bubble"] {
  margin-bottom: 4px !important;
}
`);
  } else if (ty.density === "spacious") {
    chunks.push(`
[data-testid="agent-response"], [data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  padding-top: 18px !important;
  padding-bottom: 18px !important;
  margin-bottom: 14px !important;
}
[data-testid="user-message-bubble"] {
  margin-bottom: 14px !important;
}
`);
  } else if (hasWallpaper) {
    if (msgAlpha > 0) {
      chunks.push(`
[data-testid="agent-response"], [data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  margin-bottom: 8px !important;
}
[data-testid="user-message-bubble"] {
  margin-bottom: 8px !important;
}
`);
    } else {
      chunks.push(`
[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  margin-bottom: 8px !important;
}
[data-testid="user-message-bubble"],
[data-testid="agent-response"] {
  margin-bottom: 8px !important;
}
`);
    }
  }

  if (cfg.uiPolish) {
    const thumbRad = hasCornersOverride && cRadii.base === 0 ? "0px" : "999px";
    chunks.push(`
::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: ${isLight ? "rgba(20, 20, 24, 0.22)" : "rgba(255, 255, 255, 0.16)"};
  border-radius: ${thumbRad};
}
::-webkit-scrollbar-thumb:hover {
  background: ${isLight ? "rgba(20, 20, 24, 0.36)" : "rgba(255, 255, 255, 0.28)"};
}
[data-rudex-theme-composer="1"]:focus-within,
textarea:focus:not([data-rudex-theme-composer="1"] *),
form:has(textarea[placeholder]:focus-within):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
[data-testid="composer"]:focus-within:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
.composer-container:focus-within:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])) {
  border-color: color-mix(in srgb, ${vars.accentColor} 68%, ${effectiveBorder}) !important;
  box-shadow: 0 8px 24px -10px color-mix(in srgb, ${vars.accentColor} 22%, transparent) !important;
}
`);
  }

  return chunks.join("\n").trim();
}

function createThemeEngine(options = {}) {
  const doc = options.document || (typeof document !== "undefined" ? document : null);
  const win = options.window || (typeof window !== "undefined" ? window : null);
  const resolveMediaUrl = typeof options.resolveMediaUrl === "function" ? options.resolveMediaUrl : null;

  const STYLE_ID = "rudex-studio-theme";
  const FONT_LINK_ID = "rudex-studio-fonts";
  const BG_ID = "rudex-bg";
  const HOST_ID = "rudex-studio-host";
  const IGNORE_ATTR = "data-rudex-ignore";
  const SHELL_ATTRS = [
    "data-rudex-bg-shell",
    "data-rudex-bg-sidebar",
    "data-rudex-bg-header",
    "data-rudex-bg-fade",
    "data-rudex-theme-composer",
    "data-rudex-theme-accent-dot",
  ];
  const SHELL_SCAN_THROTTLE_MS = 350;
  const SHELL_SKIP_TAGS = new Set(["PRE", "CODE", "BUTTON", "INPUT", "TEXTAREA", "FORM", "SVG", "IMG", "VIDEO", "CANVAS", "SCRIPT", "STYLE"]);
  const SHELL_SKIP_ROLES = new Set(["dialog", "alertdialog", "menu", "listbox", "tooltip"]);
  const SHELL_SKIP_TESTIDS = new Set(["user-message-content", "agent-response"]);
  const MUTATION_IGNORE_SELECTOR = '[data-markdown-root], [data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"], [data-browser-hole], #rudex-studio-host, #rudex-bg';
  const PROTECTED_OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [data-radix-popper-content-wrapper], .agy-overlay, [data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"], [data-markdown-root], [data-browser-hole], #rudex-studio-host, #rudex-bg';

  let currentConfig = normalizeAppearance(DEFAULT_APPEARANCE);
  let styleNode = null;
  let fontLinkNode = null;
  let lastFontHref = "";
  let bgLayer = null;
  let mediaChild = null;
  let gradFlowChild = null;
  let tintChild = null;
  let vignetteChild = null;
  let scrimChild = null;
  let activeVideoUrl = "";
  let failedMediaUrl = "";
  let lastAttemptedMediaSrc = "";
  let videoVisEl = null;
  let videoVisHandler = null;
  let videoPauseWhenHidden = true;
  let gradVisHandler = null;
  let domReadyHandler = null;
  let shellScanTimer = null;
  let shellRescanTimers = [];
  let lastShellScanAt = 0;
  let shellObserver = null;
  let shellObservedTarget = null;
  let shellWatchersAttached = false;
  let shellResizeHandler = null;
  let wallpaperActive = false;
  let themeScanActive = false;
  let lastCssText = "";
  let lastHadThemeOverride = false;
  let pendingFastConfig = null;
  let fastRafId = 0;

  function resolveWallpaperSrc(cfg) {
    const wp = cfg && cfg.wallpaper ? cfg.wallpaper : null;
    if (!wp || (wp.type !== "image" && wp.type !== "video")) return "";
    const rawMediaUrl = wp.mediaUrl;
    return (resolveMediaUrl ? resolveMediaUrl(wp.mediaFile, rawMediaUrl) : "") || rawMediaUrl || "";
  }

  function teParseBgAlpha(bgStr) {
    const s = String(bgStr || "").trim().toLowerCase();
    if (!s || s === "transparent" || s === "none") return 0;
    const slashM = /\/\s*([\d.]+)(%?)\s*\)$/.exec(s);
    if (slashM) {
      const a = parseFloat(slashM[1]);
      if (!Number.isFinite(a)) return 0;
      return slashM[2] === "%" ? a / 100 : a;
    }
    const commaAlphaM = /^(?:rgba|hsla)\([^,]+,[^,]+,[^,]+,\s*([\d.]+)(%?)\s*\)$/.exec(s);
    if (commaAlphaM) {
      const a = parseFloat(commaAlphaM[1]);
      if (!Number.isFinite(a)) return 0;
      return commaAlphaM[2] === "%" ? a / 100 : a;
    }
    if (/^(?:rgb|hsl|oklch|oklab|lab|lch|color)\(/.test(s)) {
      return 1;
    }
    return 0;
  }

  function teIsBlueAccentColor(bgStr) {
    const s = String(bgStr || "").trim().toLowerCase();
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+%?))?/.exec(s);
    if (!m) return false;
    const r = parseFloat(m[1]);
    const g = parseFloat(m[2]);
    const b = parseFloat(m[3]);
    if (m[4] !== undefined) {
      const a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      if (!Number.isFinite(a) || a < 0.35) return false;
    }
    return b >= 135 && b > r + 40 && b >= g - 12;
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

  function clearShellRescanTimers() {
    if (win && typeof win.clearTimeout === "function") {
      for (let i = 0; i < shellRescanTimers.length; i += 1) {
        try { win.clearTimeout(shellRescanTimers[i]); } catch (_e) {}
      }
    }
    shellRescanTimers = [];
  }

  function clearWallpaperShells() {
    if (shellScanTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(shellScanTimer);
      shellScanTimer = null;
    }
    clearShellRescanTimers();
    lastShellScanAt = 0;
    shellWatchersAttached = false;
    shellObservedTarget = null;
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
      const marked = doc.querySelectorAll(
        "[data-rudex-bg-shell], [data-rudex-bg-sidebar], [data-rudex-bg-header], [data-rudex-bg-fade], [data-rudex-theme-composer], [data-rudex-theme-accent-dot]"
      );
      for (let i = 0; marked && i < marked.length; i += 1) {
        clearShellAttrsOnElement(marked[i]);
      }
    } catch (_e) {}
  }

  function isSkippedShellNode(el) {
    if (!el || el.nodeType !== 1) return true;
    const id = el.id || "";
    if (id === HOST_ID || id === BG_ID || id === STYLE_ID) return true;
    const tag = String(el.tagName || "").toUpperCase();
    if (SHELL_SKIP_TAGS.has(tag)) return true;
    if (teHasClass(el, "agy-overlay")) return true;
    if (typeof el.getAttribute === "function") {
      if (el.getAttribute(IGNORE_ATTR) === "1") return true;
      const role = el.getAttribute("role");
      if (role && SHELL_SKIP_ROLES.has(role)) return true;
      const tid = el.getAttribute("data-testid");
      if (tid && SHELL_SKIP_TESTIDS.has(tid)) return true;
      if (typeof el.hasAttribute === "function") {
        if (el.hasAttribute("data-markdown-root")) return true;
        if (el.hasAttribute("data-radix-popper-content-wrapper")) return true;
        if (el.hasAttribute("data-browser-hole")) return true;
      } else {
        if (el.getAttribute("data-markdown-root") !== null) return true;
        if (el.getAttribute("data-radix-popper-content-wrapper") !== null) return true;
        if (el.getAttribute("data-browser-hole") !== null) return true;
      }
    }
    return false;
  }

  function isInsideProtectedOverlay(el) {
    if (!el || el.nodeType !== 1) return true;
    if (isSkippedShellNode(el)) return true;
    if (typeof el.closest === "function") {
      try {
        if (el.closest(PROTECTED_OVERLAY_SELECTOR)) return true;
      } catch (_e) {}
    }
    let cur = el.parentElement || el.parentNode;
    while (cur && cur.nodeType === 1) {
      if (isSkippedShellNode(cur)) return true;
      cur = cur.parentElement || cur.parentNode;
    }
    return false;
  }

  function hasComputedBgFill(cs) {
    if (!cs) return false;
    if (teParseBgAlpha(cs.backgroundColor) >= 0.12) return true;
    if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
    return false;
  }

  function isIgnoredMutationTarget(node) {
    if (!node) return false;
    let cur = node.nodeType === 1 ? node : (node.parentElement || node.parentNode);
    if (!cur || cur.nodeType !== 1) return false;
    if (typeof cur.closest === "function") {
      try {
        if (cur.closest(MUTATION_IGNORE_SELECTOR)) return true;
      } catch (_e) {}
    }
    while (cur && cur.nodeType === 1) {
      const id = cur.id || "";
      if (id === HOST_ID || id === BG_ID) return true;
      if (typeof cur.getAttribute === "function") {
        const tid = cur.getAttribute("data-testid");
        if (tid === "agent-response" || tid === "user-message-content") return true;
        if (typeof cur.hasAttribute === "function") {
          if (cur.hasAttribute("data-markdown-root")) return true;
        } else if (cur.getAttribute("data-markdown-root") !== null) {
          return true;
        }
      }
      cur = cur.parentElement || cur.parentNode;
    }
    return false;
  }

  function scanWallpaperShells() {
    if ((!wallpaperActive && !themeScanActive) || !doc || !win || typeof win.getComputedStyle !== "function") return;
    const rootTarget = (typeof doc.querySelector === "function" && doc.querySelector("#root, #app")) || doc.body;
    if (!rootTarget) return;
    const vw = Number(win.innerWidth) || 0;
    const vh = Number(win.innerHeight) || 0;
    if (vw < 100 || vh < 100) return;

    lastShellScanAt = Date.now();

    // Phase 1 (Read-only Pass A: Pruned BFS + Pass B: elementsFromPoint hit-test + Pass C: composer, fade bars & accent dots)
    const queue = [{ el: rootTarget, depth: 0, regionDepth: 0 }];
    let head = 0;
    let visited = 0;
    const maxNodes = 480;
    const maxDepth = 20;
    const visitedSet = new Set();
    const headerElSet = new Set();
    const plans = [];

    const hasHeaderAncestor = (node) => {
      let p = node && (node.parentElement || node.parentNode);
      while (p && p.nodeType === 1) {
        if (headerElSet.has(p)) return true;
        p = p.parentElement || p.parentNode;
      }
      return false;
    };

    const isSafeHeaderBar = (node, rect, cs) => {
      if (!node || !rect) return false;
      const t = String(node.tagName || "").toUpperCase();
      if (t === "MAIN" || t === "ASIDE" || t === "NAV") return false;
      if (cs && (cs.overflowY === "auto" || cs.overflowY === "scroll")) return false;
      if (typeof node.querySelector === "function") {
        try {
          if (node.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"], textarea, [contenteditable="true"]')) {
            return false;
          }
        } catch (_e) {}
      }
      return true;
    };

    const shouldMarkHeader = (node, rect, cs, hasBg) => {
      if (!isSafeHeaderBar(node, rect, cs)) return false;
      if (hasHeaderAncestor(node)) return false;
      if (hasBg) return true;
      if (typeof node.hasAttribute === "function" && node.hasAttribute("data-rudex-bg-header")) return true;
      if (!wallpaperActive) return false;
      const t = String(node.tagName || "").toUpperCase();
      if (t === "HEADER") return true;
      if (cs && (cs.position === "sticky" || cs.position === "fixed" || cs.position === "absolute")) return true;
      const hasBorderBottom = cs && cs.borderBottomWidth && parseFloat(cs.borderBottomWidth) > 0 && teParseBgAlpha(cs.borderBottomColor) >= 0.04;
      if (hasBorderBottom && rect.height >= 24) return true;
      if (rect.top >= -2 && rect.top <= 84 && rect.height >= 26 && rect.height <= 64 && rect.width >= vw * 0.42) {
        const hasInteractive = typeof node.querySelector === "function"
          ? Boolean(node.querySelector("button, a, [role='button'], h1, h2, h3, span"))
          : Boolean(node.textContent && String(node.textContent).trim());
        if (hasInteractive) return true;
      }
      return false;
    };

    while (head < queue.length && visited < maxNodes) {
      const item = queue[head++];
      const el = item.el;
      if (!el || el.nodeType !== 1 || visitedSet.has(el) || isSkippedShellNode(el)) continue;
      visitedSet.add(el);
      visited += 1;

      const tag = String(el.tagName || "").toUpperCase();
      let attr = "";
      let hasBg = false;
      let rect = null;
      if (typeof el.getBoundingClientRect === "function") {
        rect = el.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          if (rect.left <= 16 && rect.width >= 150 && rect.width <= 380 && rect.height >= vh * 0.65) {
            attr = "data-rudex-bg-sidebar";
          } else if (rect.width >= vw * 0.42 && rect.height >= vh * 0.42) {
            attr = "data-rudex-bg-shell";
          } else if (rect.top <= 88 && rect.height >= 22 && rect.height <= 74 && rect.width >= vw * 0.35) {
            attr = "data-rudex-bg-header";
          }
          if (attr) {
            const cs = win.getComputedStyle(el);
            hasBg = hasComputedBgFill(cs);
            if (attr === "data-rudex-bg-header") {
              if (shouldMarkHeader(el, rect, cs, hasBg)) {
                headerElSet.add(el);
                plans.push({ el, attr, hasBg: true });
              } else {
                plans.push({ el, attr: "", hasBg: false });
              }
            } else {
              plans.push({ el, attr, hasBg });
            }
          } else {
            plans.push({ el, attr: "", hasBg: false });
          }
        }
      }

      // Allow descending through transparent sidebar/header wrappers so inner painted bars are caught
      const isSidebarOrHeader =
        tag === "ASIDE" ||
        tag === "NAV" ||
        tag === "HEADER" ||
        attr === "data-rudex-bg-sidebar" ||
        attr === "data-rudex-bg-header";
      const nextRegionDepth = isSidebarOrHeader ? item.regionDepth + 1 : item.regionDepth;
      const shouldPruneRegion = isSidebarOrHeader && hasBg && nextRegionDepth >= 3;
      const isTooSmallSubtree = Boolean(rect && rect.width > 0 && rect.height > 0 && rect.width < vw * 0.35 && rect.height < vh * 0.35);

      if (!shouldPruneRegion && !isTooSmallSubtree && item.depth < maxDepth && el.children) {
        for (let i = 0; i < el.children.length; i += 1) {
          queue.push({ el: el.children[i], depth: item.depth + 1, regionDepth: nextRegionDepth });
        }
      }
    }

    // Pass B: Point-hit scan across main chat viewport, left sidebar, top titlebar/header, and lower chat fade zone
    const hitPointEls = [];
    if (typeof doc.elementsFromPoint === "function") {
      const probePoints = [
        [Math.round(vw * 0.55), Math.round(vh * 0.35)],
        [Math.round(vw * 0.62), Math.round(vh * 0.65)],
        [Math.round(vw * 0.80), Math.round(vh * 0.48)],
        [Math.round(vw * 0.55), Math.round(vh * 0.86)],
        [Math.round(vw * 0.88), Math.round(vh * 0.50)],
        [Math.min(110, Math.round(vw * 0.07)), Math.round(vh * 0.24)],
        [Math.min(110, Math.round(vw * 0.07)), Math.round(vh * 0.58)],
        [Math.min(110, Math.round(vw * 0.07)), Math.round(vh * 0.84)],
        [Math.round(vw * 0.50), 14],
        [Math.round(vw * 0.50), 48],
        [Math.round(vw * 0.25), 14],
        [Math.round(vw * 0.55), Math.max(90, vh - 125)],
        [Math.round(vw * 0.84), Math.max(90, vh - 115)],
      ];
      for (let pi = 0; pi < probePoints.length; pi += 1) {
        let hits = null;
        try {
          hits = doc.elementsFromPoint(probePoints[pi][0], probePoints[pi][1]);
        } catch (_e) {
          hits = null;
        }
        if (!Array.isArray(hits)) continue;
        for (let hi = 0; hi < hits.length; hi += 1) {
          const hitEl = hits[hi];
          if (
            !hitEl ||
            hitEl.nodeType !== 1 ||
            hitEl === doc.documentElement ||
            hitEl === doc.body ||
            isInsideProtectedOverlay(hitEl)
          ) {
            continue;
          }
          hitPointEls.push(hitEl);
          if (visitedSet.has(hitEl)) continue;
          visitedSet.add(hitEl);
          if (typeof hitEl.getBoundingClientRect !== "function") continue;
          const r = hitEl.getBoundingClientRect();
          if (!r || r.width <= 0 || r.height <= 0) continue;
          let hitAttr = "";
          if (r.left <= 20 && r.width >= 140 && r.width <= 400 && r.height >= vh * 0.50) {
            hitAttr = "data-rudex-bg-sidebar";
          } else if (r.width >= vw * 0.42 && r.height >= vh * 0.42) {
            hitAttr = "data-rudex-bg-shell";
          } else if (r.top <= 88 && r.height >= 22 && r.height <= 74 && r.width >= vw * 0.35) {
            hitAttr = "data-rudex-bg-header";
          }
          if (hitAttr) {
            const cs = win.getComputedStyle(hitEl);
            const hitHasBg = hasComputedBgFill(cs);
            if (hitAttr === "data-rudex-bg-header") {
              if (shouldMarkHeader(hitEl, r, cs, hitHasBg)) {
                headerElSet.add(hitEl);
                plans.push({ el: hitEl, attr: hitAttr, hasBg: true });
              }
            } else {
              plans.push({ el: hitEl, attr: hitAttr, hasBg: hitHasBg });
            }
          }
        }
      }
    }

    // Pass C: Semantic composer container, scroll-fade bar cleanup, and sidebar blue unread dot unification
    if ((themeScanActive || wallpaperActive) && typeof doc.querySelectorAll === "function") {
      const isProtectedForTheme = (node) => {
        if (!node || node.nodeType !== 1) return true;
        const id = node.id || "";
        if (id === HOST_ID || id === BG_ID || id === STYLE_ID) return true;
        if (teHasClass(node, "agy-overlay")) return true;
        if (typeof node.getAttribute === "function") {
          if (node.getAttribute(IGNORE_ATTR) === "1") return true;
          const role = node.getAttribute("role");
          if (role && SHELL_SKIP_ROLES.has(role)) return true;
        }
        if (typeof node.closest === "function") {
          try {
            if (node.closest(PROTECTED_OVERLAY_SELECTOR)) return true;
          } catch (_e) {}
        }
        return false;
      };

      const composerEls = new Set();
      const composerInfos = [];
      try {
        const inputs = doc.querySelectorAll('textarea, [contenteditable="true"]');
        const maxComposerW = Math.min(Math.round(vw * 0.78), 1080);
        const maxComposerH = Math.min(340, Math.round(vh * 0.44));
        for (let i = 0; inputs && i < inputs.length && i < 6; i += 1) {
          const inp = inputs[i];
          if (!inp || isProtectedForTheme(inp)) continue;
          let cur = inp.parentElement;
          let depth = 0;
          let best = null;
          let bestRect = null;
          while (cur && cur.nodeType === 1 && depth < 8) {
            if (cur === doc.body || cur === rootTarget || isProtectedForTheme(cur)) break;
            if (typeof cur.querySelector === "function") {
              try {
                if (cur.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"]')) break;
              } catch (_e) {}
            }
            if (typeof cur.getBoundingClientRect === "function") {
              const cr = cur.getBoundingClientRect();
              if (cr && cr.height > Math.min(380, vh * 0.48)) break;
              if (cr && cr.width >= 200 && cr.width <= maxComposerW && cr.height >= 36 && cr.height <= maxComposerH) {
                const ccs = win.getComputedStyle(cur);
                const alreadyComposer = typeof cur.hasAttribute === "function" && cur.hasAttribute("data-rudex-theme-composer");
                const hasBorder = ccs && ccs.borderTopWidth && parseFloat(ccs.borderTopWidth) > 0 && teParseBgAlpha(ccs.borderTopColor) >= 0.04;
                const radiusPx = ccs && ccs.borderTopLeftRadius ? parseFloat(ccs.borderTopLeftRadius) : 0;
                if (alreadyComposer || hasComputedBgFill(ccs) || hasBorder || (Number.isFinite(radiusPx) && radiusPx >= 8)) {
                  best = cur;
                  bestRect = cr;
                }
              }
            }
            cur = cur.parentElement;
            depth += 1;
          }
          if (best) {
            composerEls.add(best);
            composerInfos.push({ el: best, rect: bestRect });
            plans.push({ el: best, attr: "data-rudex-theme-composer", hasBg: true });
          }
        }
      } catch (_e) {}

      // Remove dark scroll-fade gradient bars above/around the composer so wallpaper & custom themes stay clean
      const isRelatedToComposer = (node) => {
        if (composerEls.has(node)) return true;
        for (const c of composerEls) {
          if (typeof c.contains === "function" && c.contains(node)) return true;
        }
        return false;
      };

      try {
        const fadeChecked = new Set();
        const tryMarkFade = (node, allowWrappingComposer) => {
          if (!node || node.nodeType !== 1 || fadeChecked.has(node)) return;
          fadeChecked.add(node);
          if (node === doc.body || node === rootTarget || isProtectedForTheme(node)) return;
          if (headerElSet.has(node) || hasHeaderAncestor(node)) return;
          if (isRelatedToComposer(node)) return;
          const tag = String(node.tagName || "").toUpperCase();
          if (tag === "MAIN" || tag === "ASIDE" || tag === "NAV" || tag === "HEADER" || tag === "BUTTON" || tag === "A") return;
          if (typeof node.querySelector === "function") {
            try {
              if (node.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"]')) return;
              if (!allowWrappingComposer && node.querySelector('textarea, [contenteditable="true"]')) return;
            } catch (_e) {}
          }
          if (typeof node.getBoundingClientRect !== "function") return;
          const fr = node.getBoundingClientRect();
          if (!fr || fr.width < vw * 0.32 || fr.height < 6) return;
          if (fr.left <= 20 && fr.width <= 400 && fr.height >= vh * 0.50) return;
          const maxFadeH = allowWrappingComposer ? Math.min(260, Math.round(vh * 0.36)) : 145;
          if (fr.top < 58 || fr.height > maxFadeH) return;
          const fcs = win.getComputedStyle(node);
          if (!fcs) return;
          const alreadyFade = typeof node.hasAttribute === "function" && node.hasAttribute("data-rudex-bg-fade");
          const hasGradient = Boolean(fcs.backgroundImage && fcs.backgroundImage.indexOf("gradient(") >= 0);
          const isPointerNoneOverlay = wallpaperActive && fcs.pointerEvents === "none" && (hasComputedBgFill(fcs) || (fcs.boxShadow && fcs.boxShadow !== "none"));
          const isOpaqueWrapperUnderWp = allowWrappingComposer && wallpaperActive && hasComputedBgFill(fcs);
          if (alreadyFade || hasGradient || isPointerNoneOverlay || isOpaqueWrapperUnderWp) {
            plans.push({ el: node, attr: "data-rudex-bg-fade", hasBg: true });
          }
        };

        // Check wide wrapper ancestors above the composer card (e.g. full-width bottom dock with gradient fade)
        for (let ci = 0; ci < composerInfos.length; ci += 1) {
          const info = composerInfos[ci];
          let anc = info.el.parentElement;
          let up = 0;
          while (anc && anc.nodeType === 1 && up < 4) {
            if (anc === doc.body || anc === rootTarget) break;
            if (typeof anc.getBoundingClientRect === "function") {
              const ar = anc.getBoundingClientRect();
              if (ar && info.rect && ar.width >= Math.max(info.rect.width + 60, vw * 0.42)) {
                tryMarkFade(anc, true);
              }
            }
            anc = anc.parentElement;
            up += 1;
          }
        }

        for (let hi = 0; hi < hitPointEls.length; hi += 1) {
          tryMarkFade(hitPointEls[hi], false);
        }

        const fadeCands = rootTarget.querySelectorAll("div, section, footer");
        for (let fi = 0; fadeCands && fi < fadeCands.length && fi < 360; fi += 1) {
          tryMarkFade(fadeCands[fi], false);
        }
      } catch (_e) {}

      if (themeScanActive) {
        try {
          const sideRootSet = new Set();
          for (let i = 0; i < plans.length; i += 1) {
            if (plans[i].attr === "data-rudex-bg-sidebar" && plans[i].hasBg) {
              sideRootSet.add(plans[i].el);
            }
          }
          const domSides = doc.querySelectorAll('aside, nav, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]');
          for (let s = 0; domSides && s < domSides.length; s += 1) {
            sideRootSet.add(domSides[s]);
          }
          const sideRoots = Array.from(sideRootSet);
          const checkedDots = new Set();
          for (let s = 0; s < sideRoots.length && s < 6; s += 1) {
            const sr = sideRoots[s];
            if (!sr || typeof sr.querySelectorAll !== "function" || isProtectedForTheme(sr)) continue;
            const cand = sr.querySelectorAll("span, div");
            for (let c = 0; cand && c < cand.length && c < 240; c += 1) {
              const node = cand[c];
              if (!node || checkedDots.has(node)) continue;
              if ((node.children && node.children.length > 0) || (node.childNodes && node.childNodes.length > 0)) continue;
              checkedDots.add(node);
              if (typeof node.getBoundingClientRect !== "function") continue;
              const nr = node.getBoundingClientRect();
              if (!nr || nr.width < 4 || nr.width > 14 || nr.height < 4 || nr.height > 14) continue;
              const alreadyDot = typeof node.hasAttribute === "function" && node.hasAttribute("data-rudex-theme-accent-dot");
              const ncs = win.getComputedStyle(node);
              if (alreadyDot || (ncs && teIsBlueAccentColor(ncs.backgroundColor))) {
                plans.push({ el: node, attr: "data-rudex-theme-accent-dot", hasBg: true });
              }
            }
          }
        } catch (_e) {}
      }
    }

    // Phase 2 (Write-only): batch attribute updates after all reads finish
    for (let i = 0; i < plans.length; i += 1) {
      const p = plans[i];
      if (p.attr && (p.hasBg || (typeof p.el.hasAttribute === "function" && p.el.hasAttribute(p.attr)))) {
        setExclusiveShellAttr(p.el, p.attr);
      } else {
        clearShellAttrsOnElement(p.el);
      }
    }
  }

  function scheduleShellScan() {
    if (!wallpaperActive && !themeScanActive) return;
    if (!win || typeof win.setTimeout !== "function") {
      scanWallpaperShells();
      return;
    }
    if (shellScanTimer) return;
    const elapsed = Date.now() - lastShellScanAt;
    const delay = elapsed >= SHELL_SCAN_THROTTLE_MS ? SHELL_SCAN_THROTTLE_MS : Math.max(180, SHELL_SCAN_THROTTLE_MS - elapsed);
    shellScanTimer = win.setTimeout(() => {
      shellScanTimer = null;
      if (!wallpaperActive && !themeScanActive) return;
      const didScan = ensureShellWatchers();
      if (!didScan) scanWallpaperShells();
    }, delay);
  }

  function ensureShellWatchers() {
    if ((!wallpaperActive && !themeScanActive) || !doc || !win) return false;
    const preferredRoot = typeof doc.querySelector === "function" ? doc.querySelector("#root, #app") : null;
    const watchTarget = preferredRoot || doc.body;
    if (!watchTarget) {
      shellWatchersAttached = false;
      return false;
    }

    const isFirstAttach = !shellWatchersAttached;
    let didScan = false;
    if (!shellWatchersAttached || (preferredRoot && shellObservedTarget !== preferredRoot)) {
      scanWallpaperShells();
      didScan = true;
    }

    if (isFirstAttach && typeof win.setTimeout === "function") {
      clearShellRescanTimers();
      shellRescanTimers.push(
        win.setTimeout(() => { if (wallpaperActive || themeScanActive) scanWallpaperShells(); }, 350),
        win.setTimeout(() => { if (wallpaperActive || themeScanActive) scanWallpaperShells(); }, 1200)
      );
    }

    const hasMo = typeof win.MutationObserver === "function";
    if (hasMo) {
      if (!shellObserver || (preferredRoot && shellObservedTarget !== preferredRoot)) {
        if (shellObserver && typeof shellObserver.disconnect === "function") {
          shellObserver.disconnect();
        }
        try {
          shellObserver = new win.MutationObserver((muts) => {
            if (!wallpaperActive && !themeScanActive) return;
            for (let i = 0; i < muts.length; i += 1) {
              const m = muts[i];
              if (m.type === "attributes" && SHELL_ATTRS.indexOf(m.attributeName) >= 0) continue;
              if (isIgnoredMutationTarget(m.target)) continue;
              scheduleShellScan();
              break;
            }
          });
          shellObserver.observe(watchTarget, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
          shellObservedTarget = watchTarget;
        } catch (_e) {
          shellObserver = null;
          shellObservedTarget = null;
        }
      }
    }

    if (!shellResizeHandler && typeof win.addEventListener === "function") {
      shellResizeHandler = () => scheduleShellScan();
      win.addEventListener("resize", shellResizeHandler);
    }

    shellWatchersAttached = !hasMo || Boolean(shellObserver);
    return didScan;
  }

  function safePlayVideo(videoEl) {
    if (!videoEl || typeof videoEl.play !== "function") return;
    try {
      const res = videoEl.play();
      if (res && typeof res.catch === "function") res.catch(() => {});
    } catch (_e) {}
  }

  function safePauseVideo(videoEl) {
    if (!videoEl || typeof videoEl.pause !== "function") return;
    try {
      videoEl.pause();
    } catch (_e) {}
  }

  function removeVideoListeners() {
    if (doc && videoVisHandler && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("visibilitychange", videoVisHandler);
    }
    videoVisHandler = null;
    videoVisEl = null;
  }

  function attachVideoVisibilityOnce(videoEl) {
    if (!videoEl || videoVisEl === videoEl) return;
    removeVideoListeners();
    videoVisEl = videoEl;
    if (doc && typeof doc.addEventListener === "function") {
      videoVisHandler = () => {
        if (videoVisEl !== videoEl) return;
        if (videoPauseWhenHidden && doc.hidden) {
          safePauseVideo(videoEl);
        } else {
          safePlayVideo(videoEl);
        }
      };
      doc.addEventListener("visibilitychange", videoVisHandler);
    }
  }

  function syncGradVisibilityState() {
    const hidden = Boolean(doc && doc.hidden);
    if (bgLayer && typeof bgLayer.setAttribute === "function") {
      bgLayer.setAttribute("data-hidden", hidden ? "1" : "0");
    }
    if (gradFlowChild && gradFlowChild.style) {
      gradFlowChild.style.animationPlayState = hidden ? "paused" : "";
    }
  }

  function removeGradListeners() {
    if (doc && gradVisHandler && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("visibilitychange", gradVisHandler);
    }
    gradVisHandler = null;
  }

  function attachGradVisibility() {
    syncGradVisibilityState();
    if (gradVisHandler || !doc || typeof doc.addEventListener !== "function") return;
    gradVisHandler = () => syncGradVisibilityState();
    doc.addEventListener("visibilitychange", gradVisHandler);
  }

  function removeDomReadyListener() {
    if (doc && domReadyHandler && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("DOMContentLoaded", domReadyHandler);
    }
    domReadyHandler = null;
  }

  function scheduleDomReadyRetry() {
    if (domReadyHandler || !doc || typeof doc.addEventListener !== "function") return;
    domReadyHandler = () => {
      removeDomReadyListener();
      applySync(currentConfig);
    };
    doc.addEventListener("DOMContentLoaded", domReadyHandler, { once: true });
  }

  function removeStyleNode() {
    if (!doc) return;
    const found = typeof doc.getElementById === "function" ? doc.getElementById(STYLE_ID) : styleNode;
    if (found && found.parentNode) {
      found.parentNode.removeChild(found);
    }
    styleNode = null;
  }

  function removeFontLinkNode() {
    if (!doc) return;
    const found = typeof doc.getElementById === "function" ? doc.getElementById(FONT_LINK_ID) : fontLinkNode;
    if (found && found.parentNode) {
      found.parentNode.removeChild(found);
    }
    fontLinkNode = null;
    lastFontHref = "";
  }

  function ensureFontLinkNode(href) {
    if (!doc || typeof doc.createElement !== "function") return;
    if (!href) {
      removeFontLinkNode();
      return;
    }
    if (href === lastFontHref && fontLinkNode && fontLinkNode.parentNode) return;
    let node = typeof doc.getElementById === "function" ? doc.getElementById(FONT_LINK_ID) : fontLinkNode;
    if (!node) {
      node = doc.createElement("link");
      node.id = FONT_LINK_ID;
      node.setAttribute("rel", "stylesheet");
      node.setAttribute(IGNORE_ATTR, "1");
      const target = doc.head || doc.documentElement || doc.body;
      if (!target) return;
      target.appendChild(node);
    }
    if (typeof node.setAttribute === "function") {
      node.setAttribute("href", href);
    } else {
      node.href = href;
    }
    fontLinkNode = node;
    lastFontHref = href;
  }

  function removeBgLayer() {
    removeVideoListeners();
    removeGradListeners();
    if (mediaChild) {
      try {
        mediaChild.onerror = null;
        mediaChild.onload = null;
      } catch (_e) {}
    }
    if (mediaChild && mediaChild.tagName === "VIDEO") {
      safePauseVideo(mediaChild);
      if (typeof mediaChild.removeAttribute === "function") {
        mediaChild.removeAttribute("src");
      }
    }
    if (!doc) return;
    const found = typeof doc.getElementById === "function" ? doc.getElementById(BG_ID) : bgLayer;
    if (found && found.parentNode) {
      found.parentNode.removeChild(found);
    }
    bgLayer = null;
    mediaChild = null;
    gradFlowChild = null;
    tintChild = null;
    vignetteChild = null;
    scrimChild = null;
    activeVideoUrl = "";
  }

  function ensureStyleNode(cssText) {
    if (!doc || typeof doc.createElement !== "function") return;
    if (!cssText) {
      removeStyleNode();
      return;
    }
    let node = typeof doc.getElementById === "function" ? doc.getElementById(STYLE_ID) : styleNode;
    if (!node) {
      node = doc.createElement("style");
      node.id = STYLE_ID;
      node.setAttribute(IGNORE_ATTR, "1");
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
    let layer = typeof doc.getElementById === "function" ? doc.getElementById(BG_ID) : bgLayer;
    if (!layer) {
      if (!doc.body && doc.readyState === "loading") {
        scheduleDomReadyRetry();
        return null;
      }
      const mountTarget = doc.body || doc.documentElement;
      if (!mountTarget) return null;
      layer = doc.createElement("div");
      layer.id = BG_ID;
      layer.setAttribute(IGNORE_ATTR, "1");
      layer.setAttribute("aria-hidden", "true");
      layer.style.position = "fixed";
      layer.style.inset = "0";
      layer.style.zIndex = mountTarget === doc.body ? "-1" : "0";
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

  function ensureScrim(layer, dimPct, isLight) {
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
    scrimChild.style.backgroundColor = isLight
      ? `rgba(246, 247, 250, ${dimAlpha})`
      : `rgba(6, 7, 10, ${dimAlpha})`;
  }

  function removeTintChild() {
    if (tintChild && tintChild.parentNode) {
      tintChild.parentNode.removeChild(tintChild);
    }
    tintChild = null;
  }

  function removeVignetteChild() {
    if (vignetteChild && vignetteChild.parentNode) {
      vignetteChild.parentNode.removeChild(vignetteChild);
    }
    vignetteChild = null;
  }

  function ensureVignetteLayer(layer, wp) {
    const vig = Math.round(teClamp(wp.vignette, 0, 90, 0));
    if (!doc || !layer || vig <= 0) {
      removeVignetteChild();
      return;
    }
    if (!vignetteChild || vignetteChild.parentNode !== layer) {
      vignetteChild = doc.createElement("div");
      vignetteChild.setAttribute("data-role", "bg-vignette");
      vignetteChild.style.position = "absolute";
      vignetteChild.style.inset = "0";
      vignetteChild.style.pointerEvents = "none";
      if (scrimChild && scrimChild.parentNode === layer && typeof layer.insertBefore === "function") {
        layer.insertBefore(vignetteChild, scrimChild);
      } else {
        layer.appendChild(vignetteChild);
      }
    }
    const innerStop = Math.max(15, 65 - Math.round(vig * 0.45));
    const alpha = (vig / 100).toFixed(2);
    vignetteChild.style.backgroundImage = `radial-gradient(ellipse at center, transparent ${innerStop}%, rgba(0, 0, 0, ${alpha}) 100%)`;
  }

  function ensureTintLayer(layer, wp) {
    if (!doc || !layer || !wp.tintEnabled || wp.tintOpacity <= 0) {
      removeTintChild();
      return;
    }
    if (!tintChild || tintChild.parentNode !== layer) {
      tintChild = doc.createElement("div");
      tintChild.setAttribute("data-role", "bg-tint");
      tintChild.style.position = "absolute";
      tintChild.style.inset = "0";
      tintChild.style.pointerEvents = "none";
      if (vignetteChild && vignetteChild.parentNode === layer && typeof layer.insertBefore === "function") {
        layer.insertBefore(tintChild, vignetteChild);
      } else if (scrimChild && scrimChild.parentNode === layer && typeof layer.insertBefore === "function") {
        layer.insertBefore(tintChild, scrimChild);
      } else {
        layer.appendChild(tintChild);
      }
    }
    tintChild.style.backgroundImage = teBuildGradientCss(wp);
    tintChild.style.opacity = String(Math.round(teClamp(wp.tintOpacity, 0, 75, 35)) / 100);
    tintChild.style.mixBlendMode = wp.tintBlend || "normal";
  }

  function applyWallpaper(cfg, isLight) {
    const wp = cfg.wallpaper;
    if (wp.type === "none") {
      if (wallpaperActive) {
        wallpaperActive = false;
        if (!themeScanActive) clearWallpaperShells();
      }
      removeBgLayer();
      return;
    }
    const resolvedSrc = resolveWallpaperSrc(cfg);
    if ((wp.type === "image" || wp.type === "video") && !resolvedSrc) {
      if (wallpaperActive) {
        wallpaperActive = false;
        if (!themeScanActive) clearWallpaperShells();
      }
      removeBgLayer();
      return;
    }

    const layer = ensureBgLayer();
    if (!layer) return;

    wallpaperActive = true;
    ensureShellWatchers();

    const filterParts = [];
    if (wp.blur > 0) filterParts.push(`blur(${wp.blur}px)`);
    if (wp.brightness !== 100) filterParts.push(`brightness(${wp.brightness}%)`);
    if (wp.contrast !== 100) filterParts.push(`contrast(${wp.contrast}%)`);
    if (wp.saturate !== 100) filterParts.push(`saturate(${wp.saturate}%)`);
    if (wp.hue !== 0) filterParts.push(`hue-rotate(${wp.hue}deg)`);
    const filterCss = filterParts.length > 0 ? filterParts.join(" ") : "none";
    const opacityVal = String(Math.round(teClamp(wp.opacity, 15, 100, 85)) / 100);
    const effScale = wp.blur > 0 ? Math.max(wp.scale / 100, 1.06) : (wp.scale / 100);
    const posStr = `${Math.round(teClamp(wp.posX, 0, 100, 50))}% ${Math.round(teClamp(wp.posY, 0, 100, 50))}%`;
    const transformParts = [];
    if (wp.offsetX !== 0 || wp.offsetY !== 0) {
      transformParts.push(`translate3d(${wp.offsetX}%, ${wp.offsetY}%, 0)`);
    }
    if (wp.rotate !== 0) {
      transformParts.push(`rotate(${wp.rotate}deg)`);
    }
    if (wp.flipX || wp.flipY) {
      const sx = wp.flipX ? -effScale : effScale;
      const sy = wp.flipY ? -effScale : effScale;
      transformParts.push(`scale(${sx.toFixed(2)}, ${sy.toFixed(2)})`);
    } else if (Math.abs(effScale - 1) > 0.001) {
      transformParts.push(`scale(${effScale.toFixed(2)})`);
    }
    const transformCss = transformParts.length > 0 ? transformParts.join(" ") : "none";

    if (wp.type === "video") {
      removeGradListeners();
      gradFlowChild = null;
      const prevPauseWhenHidden = videoPauseWhenHidden;
      videoPauseWhenHidden = Boolean(wp.pauseWhenHidden);
      const needNewVideo = !mediaChild || mediaChild.tagName !== "VIDEO" || activeVideoUrl !== resolvedSrc;
      if (needNewVideo) {
        removeVideoListeners();
        if (mediaChild && mediaChild.parentNode) {
          try {
            mediaChild.onerror = null;
            mediaChild.onload = null;
          } catch (_e) {}
          if (mediaChild.tagName === "VIDEO") safePauseVideo(mediaChild);
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
        const targetVideoSrc = resolvedSrc;
        vid.onerror = () => {
          if (activeVideoUrl === targetVideoSrc && failedMediaUrl !== targetVideoSrc) {
            failedMediaUrl = targetVideoSrc;
            applySync(currentConfig);
          }
        };
        vid.src = resolvedSrc;
        vid.style.position = "absolute";
        vid.style.inset = "0";
        vid.style.width = "100%";
        vid.style.height = "100%";
        vid.style.pointerEvents = "none";
        if (scrimChild && scrimChild.parentNode === layer && typeof layer.insertBefore === "function") {
          layer.insertBefore(vid, scrimChild);
        } else {
          layer.appendChild(vid);
        }
        mediaChild = vid;
        activeVideoUrl = resolvedSrc;
        if (!(videoPauseWhenHidden && doc && doc.hidden)) {
          safePlayVideo(vid);
        }
      } else if (prevPauseWhenHidden && !videoPauseWhenHidden) {
        safePlayVideo(mediaChild);
      }
      mediaChild.style.objectFit = wp.fit || "cover";
      mediaChild.style.objectPosition = posStr;
      mediaChild.style.transformOrigin = posStr;
      mediaChild.style.filter = filterCss;
      mediaChild.style.opacity = opacityVal;
      mediaChild.style.transform = transformCss;
      try {
        if (Number.isFinite(wp.playbackRate)) {
          mediaChild.playbackRate = wp.playbackRate;
        }
      } catch (_e) {}
      ensureTintLayer(layer, wp);
      ensureVignetteLayer(layer, wp);
      attachVideoVisibilityOnce(mediaChild);
      ensureScrim(layer, wp.dim, isLight);
      return;
    }

    removeVideoListeners();
    activeVideoUrl = "";

    if (wp.type === "image") {
      removeGradListeners();
      gradFlowChild = null;
      if (!mediaChild || mediaChild.tagName !== "IMG") {
        if (mediaChild && mediaChild.parentNode) {
          try {
            mediaChild.onerror = null;
            mediaChild.onload = null;
          } catch (_e) {}
          if (mediaChild.tagName === "VIDEO") safePauseVideo(mediaChild);
          mediaChild.parentNode.removeChild(mediaChild);
        }
        const img = doc.createElement("img");
        img.setAttribute("data-role", "bg-image");
        img.alt = "";
        img.style.position = "absolute";
        img.style.inset = "0";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.pointerEvents = "none";
        if (scrimChild && scrimChild.parentNode === layer && typeof layer.insertBefore === "function") {
          layer.insertBefore(img, scrimChild);
        } else {
          layer.appendChild(img);
        }
        mediaChild = img;
      }
      const targetImgSrc = resolvedSrc;
      mediaChild.onerror = () => {
        const curSrc = typeof mediaChild.getAttribute === "function" ? (mediaChild.getAttribute("src") || mediaChild.src) : mediaChild.src;
        if (curSrc === targetImgSrc && failedMediaUrl !== targetImgSrc) {
          failedMediaUrl = targetImgSrc;
          applySync(currentConfig);
        }
      };
      mediaChild.onload = () => {
        if (failedMediaUrl === targetImgSrc) {
          failedMediaUrl = "";
        }
      };
      if (mediaChild.getAttribute("src") !== resolvedSrc) {
        mediaChild.setAttribute("src", resolvedSrc);
      }
      mediaChild.style.objectFit = wp.fit || "cover";
      mediaChild.style.objectPosition = posStr;
      mediaChild.style.transformOrigin = posStr;
      mediaChild.style.filter = filterCss;
      mediaChild.style.opacity = opacityVal;
      mediaChild.style.transform = transformCss;
      ensureTintLayer(layer, wp);
      ensureVignetteLayer(layer, wp);
      ensureScrim(layer, wp.dim, isLight);
      return;
    }

    removeTintChild();
    if (!mediaChild || mediaChild.getAttribute("data-role") !== "bg-gradient") {
      if (mediaChild && mediaChild.parentNode) {
        try {
          mediaChild.onerror = null;
          mediaChild.onload = null;
        } catch (_e) {}
        if (mediaChild.tagName === "VIDEO") safePauseVideo(mediaChild);
        mediaChild.parentNode.removeChild(mediaChild);
      }
      const gradWrap = doc.createElement("div");
      gradWrap.setAttribute("data-role", "bg-gradient");
      gradWrap.style.position = "absolute";
      gradWrap.style.inset = "0";
      gradWrap.style.overflow = "hidden";
      gradWrap.style.pointerEvents = "none";

      const flowEl = doc.createElement("div");
      flowEl.setAttribute("data-role", "bg-gradient-flow");
      flowEl.style.position = "absolute";
      flowEl.style.pointerEvents = "none";
      gradWrap.appendChild(flowEl);

      if (scrimChild && scrimChild.parentNode === layer && typeof layer.insertBefore === "function") {
        layer.insertBefore(gradWrap, scrimChild);
      } else {
        layer.appendChild(gradWrap);
      }
      mediaChild = gradWrap;
      gradFlowChild = flowEl;
    } else if (!gradFlowChild || gradFlowChild.parentNode !== mediaChild) {
      const flowEl = doc.createElement("div");
      flowEl.setAttribute("data-role", "bg-gradient-flow");
      flowEl.style.position = "absolute";
      flowEl.style.pointerEvents = "none";
      mediaChild.appendChild(flowEl);
      gradFlowChild = flowEl;
    }

    mediaChild.style.filter = filterCss;
    mediaChild.style.opacity = opacityVal;
    mediaChild.style.transform = transformCss;

    gradFlowChild.style.backgroundImage = teBuildGradientCss(wp);
    if (wp.gradAnimated) {
      gradFlowChild.style.inset = "-50%";
      gradFlowChild.style.width = "200%";
      gradFlowChild.style.height = "200%";
      gradFlowChild.style.willChange = "transform";
      gradFlowChild.style.animation = `rudex-grad-flow ${wp.gradSpeed}s ease-in-out infinite`;
      attachGradVisibility();
    } else {
      removeGradListeners();
      gradFlowChild.style.inset = "0";
      gradFlowChild.style.width = "100%";
      gradFlowChild.style.height = "100%";
      gradFlowChild.style.willChange = "auto";
      gradFlowChild.style.animation = "none";
      gradFlowChild.style.animationPlayState = "";
      gradFlowChild.style.transform = "none";
    }

    ensureVignetteLayer(layer, wp);
    ensureScrim(layer, Math.round(wp.dim * 0.55), isLight);
  }

  function resolveEffectiveHostIsLight(cfg) {
    if (cfg.presetId !== "native") return false;
    const existing = doc && typeof doc.getElementById === "function" ? doc.getElementById(STYLE_ID) : styleNode;
    if (existing && lastHadThemeOverride && typeof existing.disabled === "boolean") {
      existing.disabled = true;
      const detected = detectHostIsLight(doc, win);
      existing.disabled = false;
      return detected;
    }
    return detectHostIsLight(doc, win);
  }

  function applySync(rawAppearance) {
    currentConfig = normalizeAppearance(rawAppearance);
    const resolvedSrcCheck = resolveWallpaperSrc(currentConfig);
    if (resolvedSrcCheck !== lastAttemptedMediaSrc) {
      lastAttemptedMediaSrc = resolvedSrcCheck;
      failedMediaUrl = "";
    }
    const isMediaBroken = Boolean(
      (currentConfig.wallpaper.type === "image" || currentConfig.wallpaper.type === "video") &&
      resolvedSrcCheck &&
      failedMediaUrl === resolvedSrcCheck
    );
    const effectiveConfig = isMediaBroken
      ? Object.assign({}, currentConfig, {
          wallpaper: Object.assign({}, currentConfig.wallpaper, { type: "none" }),
        })
      : currentConfig;

    const hasThemeOverride = effectiveConfig.presetId !== "native";
    const hasAccentOverride = Boolean(effectiveConfig.customAccent);
    const hasWallpaper = teHasActiveWallpaper(effectiveConfig);
    const hasCustomTypo = teHasCustomTypography(effectiveConfig);
    const hasCornersOverride = teHasCustomCorners(effectiveConfig);
    const hasSurfaceOverride =
      hasCornersOverride || effectiveConfig.radius !== 12 || effectiveConfig.borderStrength !== 50 || effectiveConfig.messageStyle !== "glass";
    const hostIsLight = resolveEffectiveHostIsLight(effectiveConfig);
    const isLight = hasThemeOverride
      ? teResolveThemeVars(effectiveConfig).mode === "light"
      : hostIsLight;

    if (!hasThemeOverride && !hasAccentOverride && !hasWallpaper && !hasCustomTypo && !hasSurfaceOverride && !effectiveConfig.uiPolish) {
      if (wallpaperActive || themeScanActive) {
        wallpaperActive = false;
        themeScanActive = false;
        clearWallpaperShells();
      }
      lastCssText = "";
      lastHadThemeOverride = false;
      removeStyleNode();
      removeFontLinkNode();
      removeBgLayer();
      return currentConfig;
    }

    ensureFontLinkNode(teBuildWebFontUrl(effectiveConfig));
    const cssText = buildThemeCss(effectiveConfig, { hostIsLight });
    const existingStyle = doc && typeof doc.getElementById === "function"
      ? doc.getElementById(STYLE_ID)
      : styleNode;

    if (!cssText) {
      lastCssText = "";
      removeStyleNode();
    } else if (cssText !== lastCssText || !existingStyle) {
      lastCssText = cssText;
      ensureStyleNode(cssText);
    }

    lastHadThemeOverride = hasThemeOverride;
    themeScanActive = hasThemeOverride;
    applyWallpaper(effectiveConfig, isLight);
    if (themeScanActive && !wallpaperActive) {
      ensureShellWatchers();
    } else if (!themeScanActive && !wallpaperActive) {
      clearWallpaperShells();
    }
    return currentConfig;
  }

  function apply(rawAppearance) {
    pendingFastConfig = null;
    if (fastRafId && win && typeof win.cancelAnimationFrame === "function") {
      try { win.cancelAnimationFrame(fastRafId); } catch (_e) {}
      fastRafId = 0;
    }
    return applySync(rawAppearance);
  }

  function applyFast(rawAppearance) {
    pendingFastConfig = rawAppearance;
    if (!win || typeof win.requestAnimationFrame !== "function") {
      const cfgToApply = pendingFastConfig;
      pendingFastConfig = null;
      return applySync(cfgToApply);
    }
    if (fastRafId) return currentConfig;
    fastRafId = win.requestAnimationFrame(() => {
      fastRafId = 0;
      if (pendingFastConfig !== null) {
        const nextCfg = pendingFastConfig;
        pendingFastConfig = null;
        applySync(nextCfg);
      }
    });
    return currentConfig;
  }

  return {
    apply,
    applyFast,
    scanWallpaperShells,
    clearWallpaperShells,
    getCurrent: () => normalizeAppearance(currentConfig),
    destroy: () => {
      pendingFastConfig = null;
      if (fastRafId && win && typeof win.cancelAnimationFrame === "function") {
        try { win.cancelAnimationFrame(fastRafId); } catch (_e) {}
        fastRafId = 0;
      }
      removeDomReadyListener();
      wallpaperActive = false;
      themeScanActive = false;
      failedMediaUrl = "";
      lastAttemptedMediaSrc = "";
      lastCssText = "";
      lastHadThemeOverride = false;
      clearWallpaperShells();
      removeStyleNode();
      removeFontLinkNode();
      removeBgLayer();
    },
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    THEME_PRESETS,
    GRADIENT_PRESETS,
    CORNER_PRESETS,
    FONT_PRESETS,
    DEFAULT_APPEARANCE,
    normalizeAppearance,
    isAppearanceNativeDefault,
    teResolveCornerRadii,
    teFindFont,
    teMixHex,
    teBuildWebFontUrl,
    detectHostIsLight,
    buildThemeCss,
    createThemeEngine,
  };
}
