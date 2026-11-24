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
  customAccent: false,
  accentColor: "#3b82f6",
  canvasBg: "#09090b",
  cardBg: "#131316",
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
    gradientPreset: "aurora",
    gradStyle: "linear",
    gradColors: ["#0f172a", "#1e1b4b", "#09090b"],
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
[data-testid="user-message-content"],
[data-testid="user-message-bubble"] > div[class*="rounded"] {
  border-radius: ${c.messages}px !important;
}
form:has(textarea),
form:has([contenteditable="true"]),
[data-testid="composer"],
.composer-container,
[data-testid="composer"] > div[class*="rounded"],
div:has(> textarea[placeholder]):not(#rudex-studio-host *) {
  border-radius: ${c.composer}px !important;
}
body :where(button, [role="button"], [data-slot="button"], [data-slot="toggle"], [data-testid="model-selector-trigger"], [data-testid="send-button-loading"], [data-testid="send-button-pending"], [data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not([role="radio"]):not([class*="rounded-full"]):not([data-rudex-ignore="1"]) {
  border-radius: ${c.buttons}px !important;
}${btnPillRule}
body :where([data-slot="card"], [data-slot="collapsible"], [class*="bg-card"], details, [data-testid*="card"], [data-testid*="tool"], [data-testid*="artifact"], [data-testid="agent-response"] :where(div, section, article)[class*="border"][class*="rounded-"]):not(button):not(input):not(textarea):not(pre):not([role="dialog"]):not([role="alertdialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]):not([data-testid="agent-response"]):not([data-testid="user-message-content"]):not([data-testid="user-message-bubble"]):not([data-testid="composer"]):not(aside):not(nav):not(#rudex-studio-host):not(#rudex-studio-host *) {
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
    const secondaryHex = teMixHex(vars.cardBg, isLight ? "#000000" : "#ffffff", 0.06);
    const cardRgba = teHexToRgba(vars.cardBg, cardAlpha);
    const sidebarRgba = teHexToRgba(vars.sidebarBg, sidebarAlpha);

    chunks.push(`
:root, html, body {
  --background: ${vars.canvasBg};
  --foreground: ${vars.fgColor};
  --primary: ${vars.accentColor};
  --primary-foreground: ${primaryFg};
  --link: ${vars.accentColor};
  --secondary: ${secondaryHex};
  --secondary-foreground: ${vars.fgColor};
  --muted: ${secondaryHex};
  --muted-foreground: ${vars.mutedColor};
  --border: ${effectiveBorder};
  --card: ${(hasWallpaper || isGlassTheme) ? cardRgba : vars.cardBg};
  --card-border: ${effectiveBorder};
  --sidebar: ${(hasWallpaper || isGlassTheme) ? sidebarRgba : vars.sidebarBg};
  --sidebar-secondary: ${secondaryHex};
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
        chunks.push(`
html, body {
  background-color: ${vars.canvasBg} !important;
  color: ${vars.fgColor};
}
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
[data-testid="user-message-content"],
[data-testid="user-message-bubble"] {
  background-color: ${glassCardNoWp} !important;
  background-image: ${glassSheenGrad};
  border: 1px solid ${glassSpecBorder} !important;
  border-radius: ${cRadii.messages}px !important;
  box-shadow: ${glassFresnelShadow};
  ${opticalGlassFilter}
}
form:has(textarea[placeholder]), form:has([contenteditable="true"]), [data-testid="composer"], .composer-container {
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
    const headerAlpha = Math.min(92, Math.max(20, baseGlass - 10));
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
    const solidBorderAlpha = msgStyle === "solid" ? Math.max(borderAlpha, 0.14) : borderAlpha;
    const msgBorderCol = isLight ? `rgba(15, 23, 42, ${solidBorderAlpha})` : `rgba(255, 255, 255, ${solidBorderAlpha})`;
    const msgBlurCss = msgAlpha > 0 && msgStyle !== "solid" && blurPx > 0 ? glassBlurCss : "";
    const msgShadowCss = msgAlpha > 0
      ? (msgStyle === "glass"
          ? `box-shadow: ${glassFresnelShadow};`
          : (isLight ? "box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);" : "box-shadow: 0 4px 24px rgba(0, 0, 0, 0.34);"))
      : "";
    const msgSheenCss = msgAlpha > 0 && msgStyle === "glass" ? `background-image: ${glassSheenGrad};` : "";
    const hasCardBorder = cfg.borderStrength > 0 && msgAlpha > 0 && msgStyle !== "minimal";
    const msgContrastCss = cfg.highContrastText !== false
      ? (isLight
          ? `
[data-testid="agent-response"], [data-testid="user-message-content"], [data-markdown-root] {
  color: #111216 !important;
  --foreground: #111216;
  --muted-foreground: #3f4452;
}
[data-testid="agent-response"] a, [data-markdown-root] a {
  color: #1d4ed8 !important;
}
[data-testid="agent-response"] code:not(pre code), [data-markdown-root] code:not(pre code) {
  background-color: rgba(15, 23, 42, 0.09) !important;
  border: 1px solid rgba(15, 23, 42, 0.14);
  color: #111216 !important;
  padding: 1px 5px;
  border-radius: 5px;
}
:where([data-testid="agent-response"], [data-markdown-root]) pre {
  border: 1px solid rgba(15, 23, 42, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  border-radius: ${Math.max(6, vars.radius - 2)}px;
}`
          : `
[data-testid="agent-response"], [data-testid="user-message-content"], [data-markdown-root] {
  color: #f4f5f8 !important;
  --foreground: #f4f5f8;
  --muted-foreground: #c4c8d4;
}
[data-testid="agent-response"] a, [data-markdown-root] a {
  color: #7cb3ff !important;
}
[data-testid="agent-response"] code:not(pre code), [data-markdown-root] code:not(pre code) {
  background-color: rgba(8, 9, 14, 0.62) !important;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f8fafc !important;
  padding: 1px 5px;
  border-radius: 5px;
}
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
main:not([role="dialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]),
[data-testid="chat-container"]:not([role="dialog"]),
[data-testid="conversation-view"]:not([role="dialog"]),
:where(div, section)[class*="bg-background"]:where(:not(aside, nav, header, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"], [role="button"], [role="tab"], [role="switch"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [class*="badge"], [class*="chip"], [class*="pill"], [data-slot="badge"], [data-slot="button"], [data-rudex-ignore="1"])),
:where(div, section).bg-black:where(:not(aside, nav, header, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"], [role="button"], [role="tab"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [class*="badge"], [class*="chip"], [class*="pill"], [data-rudex-ignore="1"])) {
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
[data-rudex-bg-header="1"] {
  background-color: ${headerGlassBg} !important;
  ${msgStyle === "glass" ? "background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);" : ""}
  ${glassBlurCss}
}
[data-testid="agent-response"] {
  background-color: ${agentSurfaceBg} !important;
  ${msgSheenCss}
  border: ${hasCardBorder ? `1px solid ${msgBorderCol}` : "none"} !important;
  border-radius: ${cRadii.messages}px !important;
  ${msgAlpha > 0 ? "padding-inline: 18px !important;" : ""}
  ${msgShadowCss}
  ${msgBlurCss}
  ${msgAlpha <= 0 && cfg.highContrastText !== false ? `text-shadow: ${isLight ? "0 1px 2px rgba(255,255,255,0.85)" : "0 1px 3px rgba(0,0,0,0.85)"};` : ""}
}
[data-testid="user-message-content"],
[data-testid="user-message-bubble"] {
  background-color: ${userSurfaceBg} !important;
  ${msgStyle === "glass" ? `background-image: ${glassSheenGrad};` : ""}
  border: ${cfg.borderStrength > 0 ? `1px solid ${msgBorderCol}` : "none"} !important;
  border-radius: ${cRadii.messages}px !important;
  ${msgShadowCss}
  ${msgStyle !== "solid" ? glassBlurCss : ""}
}
${msgContrastCss}
form:has(textarea[placeholder]), form:has([contenteditable="true"]), [data-testid="composer"], .composer-container {
  background-color: ${userSurfaceBg} !important;
  ${msgStyle === "glass" ? `background-image: ${glassSheenGrad}; box-shadow: ${glassFresnelShadow};` : ""}
  border: ${cfg.borderStrength > 0 ? `1px solid ${msgBorderCol}` : "none"} !important;
  border-radius: ${cRadii.composer}px !important;
  ${msgStyle !== "solid" ? glassBlurCss : ""}
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
    const agentBorder = cfg.messageStyle === "minimal" || cfg.borderStrength === 0
      ? "none"
      : `1px solid ${dynamicBorderCol}`;
    chunks.push(`
[data-testid="agent-response"] {
  border-radius: ${cRadii.messages}px !important;
  border: ${agentBorder} !important;
  ${agentBg ? `background-color: ${agentBg} !important;` : ""}
  ${cfg.messageStyle === "solid" ? "padding: 12px 18px !important;" : ""}
}
[data-testid="user-message-content"],
[data-testid="user-message-bubble"],
form:has(textarea[placeholder]),
form:has([contenteditable="true"]),
[data-testid="composer"],
.composer-container {
  border-radius: ${cRadii.composer}px !important;
  border: ${cfg.borderStrength > 0 ? `1px solid ${dynamicBorderCol}` : "none"} !important;
}
`);
  }

  if (hasCornersOverride) {
    chunks.push(teBuildCornerRadiusCss(cfg, cRadii));
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
  max-width: min(100%, ${ty.chatMaxWidth}px) !important;
  margin-inline: auto !important;
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
  padding-top: 18px !important;
  padding-bottom: 18px !important;
  margin-bottom: 14px !important;
}
`);
  } else if (hasWallpaper) {
    if (msgAlpha > 0) {
      chunks.push(`
[data-testid="agent-response"], [data-testid="user-message-content"] {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  margin-bottom: 8px !important;
}
`);
    } else {
      chunks.push(`
[data-testid="user-message-content"] {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  margin-bottom: 8px !important;
}
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
textarea:focus, form:has(textarea[placeholder]:focus-within), [data-testid="composer"]:focus-within, .composer-container:focus-within {
  border-color: ${vars.accentColor} !important;
  box-shadow: 0 0 0 1px color-mix(in srgb, ${vars.accentColor} 55%, transparent), 0 10px 28px -8px color-mix(in srgb, ${vars.accentColor} 28%, transparent) !important;
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
  const BG_ID = "rudex-bg";
  const HOST_ID = "rudex-studio-host";
  const IGNORE_ATTR = "data-rudex-ignore";
  const SHELL_ATTRS = ["data-rudex-bg-shell", "data-rudex-bg-sidebar", "data-rudex-bg-header"];
  const SHELL_SCAN_THROTTLE_MS = 350;
  const SHELL_SKIP_TAGS = new Set(["PRE", "CODE", "BUTTON", "INPUT", "TEXTAREA", "FORM", "SVG", "IMG", "VIDEO", "CANVAS", "SCRIPT", "STYLE"]);
  const SHELL_SKIP_ROLES = new Set(["dialog", "alertdialog", "menu", "listbox", "tooltip"]);
  const SHELL_SKIP_TESTIDS = new Set(["user-message-content", "agent-response"]);
  const MUTATION_IGNORE_SELECTOR = '[data-markdown-root], [data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"], [data-browser-hole], #rudex-studio-host, #rudex-bg';
  const PROTECTED_OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [data-radix-popper-content-wrapper], .agy-overlay, [data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"], [data-markdown-root], [data-browser-hole], #rudex-studio-host, #rudex-bg';

  let currentConfig = normalizeAppearance(DEFAULT_APPEARANCE);
  let styleNode = null;
  let bgLayer = null;
  let mediaChild = null;
  let gradFlowChild = null;
  let tintChild = null;
  let vignetteChild = null;
  let scrimChild = null;
  let activeVideoUrl = "";
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
  let lastCssText = "";
  let lastHadThemeOverride = false;
  let pendingFastConfig = null;
  let fastRafId = 0;

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
      const marked = doc.querySelectorAll("[data-rudex-bg-shell], [data-rudex-bg-sidebar], [data-rudex-bg-header]");
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
    if (!wallpaperActive || !doc || !win || typeof win.getComputedStyle !== "function") return;
    const rootTarget = (typeof doc.querySelector === "function" && doc.querySelector("#root, #app")) || doc.body;
    if (!rootTarget) return;
    const vw = Number(win.innerWidth) || 0;
    const vh = Number(win.innerHeight) || 0;
    if (vw < 100 || vh < 100) return;

    lastShellScanAt = Date.now();

    // Phase 1 (Read-only Pass A: Pruned BFS + Pass B: elementsFromPoint hit-test)
    const queue = [{ el: rootTarget, depth: 0 }];
    let head = 0;
    let visited = 0;
    const maxNodes = 400;
    const maxDepth = 18;
    const visitedSet = new Set();
    const plans = [];

    while (head < queue.length && visited < maxNodes) {
      const item = queue[head++];
      const el = item.el;
      if (!el || el.nodeType !== 1 || visitedSet.has(el) || isSkippedShellNode(el)) continue;
      visitedSet.add(el);
      visited += 1;

      const tag = String(el.tagName || "").toUpperCase();
      let attr = "";
      let rect = null;
      if (typeof el.getBoundingClientRect === "function") {
        rect = el.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          if (rect.left <= 16 && rect.width >= 150 && rect.width <= 380 && rect.height >= vh * 0.65) {
            attr = "data-rudex-bg-sidebar";
          } else if (rect.width >= vw * 0.42 && rect.height >= vh * 0.42) {
            attr = "data-rudex-bg-shell";
          } else if (rect.top <= 48 && rect.height >= 24 && rect.height <= 68 && rect.width >= vw * 0.45) {
            attr = "data-rudex-bg-header";
          }
          if (attr) {
            const cs = win.getComputedStyle(el);
            plans.push({ el, attr, hasBg: hasComputedBgFill(cs) });
          } else {
            plans.push({ el, attr: "", hasBg: false });
          }
        }
      }

      // Prune non-shell subtrees (sidebars, navs, headers, and undersized leaf boxes)
      const isSidebarOrHeader =
        tag === "ASIDE" ||
        tag === "NAV" ||
        tag === "HEADER" ||
        attr === "data-rudex-bg-sidebar" ||
        attr === "data-rudex-bg-header";
      const isTooSmallSubtree = Boolean(rect && rect.width > 0 && rect.height > 0 && rect.width < vw * 0.40 && rect.height < vh * 0.40);

      if (!isSidebarOrHeader && !isTooSmallSubtree && item.depth < maxDepth && el.children) {
        for (let i = 0; i < el.children.length; i += 1) {
          queue.push({ el: el.children[i], depth: item.depth + 1 });
        }
      }
    }

    // Pass B: Point-hit scan across main chat viewport catches arbitrarily deep wrappers
    if (typeof doc.elementsFromPoint === "function") {
      const probePoints = [
        [Math.round(vw * 0.55), Math.round(vh * 0.35)],
        [Math.round(vw * 0.62), Math.round(vh * 0.65)],
        [Math.round(vw * 0.80), Math.round(vh * 0.48)],
        [Math.round(vw * 0.55), Math.round(vh * 0.86)],
        [Math.round(vw * 0.88), Math.round(vh * 0.50)],
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
            visitedSet.has(hitEl) ||
            hitEl === doc.documentElement ||
            hitEl === doc.body ||
            isInsideProtectedOverlay(hitEl)
          ) {
            continue;
          }
          visitedSet.add(hitEl);
          if (typeof hitEl.getBoundingClientRect !== "function") continue;
          const r = hitEl.getBoundingClientRect();
          if (r && r.width >= vw * 0.42 && r.height >= vh * 0.42) {
            const cs = win.getComputedStyle(hitEl);
            plans.push({ el: hitEl, attr: "data-rudex-bg-shell", hasBg: hasComputedBgFill(cs) });
          }
        }
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
    if (!wallpaperActive) return;
    if (!win || typeof win.setTimeout !== "function") {
      scanWallpaperShells();
      return;
    }
    if (shellScanTimer) return;
    const elapsed = Date.now() - lastShellScanAt;
    const delay = elapsed >= SHELL_SCAN_THROTTLE_MS ? SHELL_SCAN_THROTTLE_MS : Math.max(180, SHELL_SCAN_THROTTLE_MS - elapsed);
    shellScanTimer = win.setTimeout(() => {
      shellScanTimer = null;
      if (!wallpaperActive) return;
      const didScan = ensureShellWatchers();
      if (!didScan) scanWallpaperShells();
    }, delay);
  }

  function ensureShellWatchers() {
    if (!wallpaperActive || !doc || !win) return false;
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
        win.setTimeout(() => { if (wallpaperActive) scanWallpaperShells(); }, 350),
        win.setTimeout(() => { if (wallpaperActive) scanWallpaperShells(); }, 1200)
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
            if (!wallpaperActive) return;
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

  function removeBgLayer() {
    removeVideoListeners();
    removeGradListeners();
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
        clearWallpaperShells();
      }
      removeBgLayer();
      return;
    }
    const rawMediaUrl = wp.mediaUrl;
    const resolvedSrc = (wp.type === "image" || wp.type === "video")
      ? ((resolveMediaUrl ? resolveMediaUrl(wp.mediaFile, rawMediaUrl) : "") || rawMediaUrl)
      : "";
    if ((wp.type === "image" || wp.type === "video") && !resolvedSrc) {
      if (wallpaperActive) {
        wallpaperActive = false;
        clearWallpaperShells();
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
    const hasThemeOverride = currentConfig.presetId !== "native";
    const hasAccentOverride = Boolean(currentConfig.customAccent);
    const hasWallpaper = teHasActiveWallpaper(currentConfig);
    const hasCustomTypo = teHasCustomTypography(currentConfig);
    const hasCornersOverride = teHasCustomCorners(currentConfig);
    const hasSurfaceOverride =
      hasCornersOverride || currentConfig.radius !== 12 || currentConfig.borderStrength !== 50 || currentConfig.messageStyle !== "glass";
    const hostIsLight = resolveEffectiveHostIsLight(currentConfig);
    const isLight = hasThemeOverride
      ? teResolveThemeVars(currentConfig).mode === "light"
      : hostIsLight;

    if (!hasThemeOverride && !hasAccentOverride && !hasWallpaper && !hasCustomTypo && !hasSurfaceOverride && !currentConfig.uiPolish) {
      if (wallpaperActive) {
        wallpaperActive = false;
        clearWallpaperShells();
      }
      lastCssText = "";
      lastHadThemeOverride = false;
      removeStyleNode();
      removeBgLayer();
      return currentConfig;
    }

    const cssText = buildThemeCss(currentConfig, { hostIsLight });
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
    applyWallpaper(currentConfig, isLight);
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
      lastCssText = "";
      lastHadThemeOverride = false;
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
    CORNER_PRESETS,
    FONT_PRESETS,
    DEFAULT_APPEARANCE,
    normalizeAppearance,
    isAppearanceNativeDefault,
    teResolveCornerRadii,
    detectHostIsLight,
    buildThemeCss,
    createThemeEngine,
  };
}
