"use strict";

// Node test-runner fallback when studio-panel.js is required standalone without preload bundle
if (typeof RUDEX_AGENT_PRESETS === "undefined" && typeof require === "function") {
  try {
    Object.assign(globalThis, require("./rudex-v5-core.js"));
  } catch (_e) {}
}
if (typeof rv5RenderAgentHubTabHtml === "undefined" && typeof require === "function") {
  try {
    Object.assign(globalThis, require("./rudex-v5-ui.js"));
  } catch (_e) {}
}
if (typeof createScreenshotAnnotator === "undefined" && typeof require === "function") {
  try {
    Object.assign(globalThis, require("./rudex-annotator.js"));
  } catch (_e) {}
}

const MAX_PERSONA_BODY_BYTES = 23000;
const DOCK_POSITIONS = ["inline-header", "top-left", "top-right", "bottom-right", "bottom-left", "middle-right", "hidden"];
const MINI_FIELD_KEYS = ["status", "lang", "tps", "respTokens", "chatTokens", "model", "quota"];
const DEFAULT_MINI_FIELDS = {
  status: true,
  lang: true,
  tps: true,
  respTokens: false,
  chatTokens: false,
  model: false,
  quota: false,
};

const CURATED_ACCENTS = ["#d97757", "#c15f3c", "#788c5d", "#6a9bcc", "#3b82f6", "#10b981", "#f59e0b", "#e11d48", "#8b5cf6"];

const DEFAULT_STUDIO_UI = {
  windowTheme: "obsidian",
  windowLayout: "sidebar",
  widgetTheme: "glass",
  widgetScale: "md",
  widgetRadius: 999,
  widgetOpacity: 92,
  widgetFont: "inherit",
  widgetFontCustom: "",
  widgetFontSize: 12,
  studioRadius: 14,
  studioBlur: 18,
  appScale: 100,
  studioScale: 100,
  widgetZoom: 100,
};

const STUDIO_WINDOW_THEMES = [
  { id: "obsidian", nameRu: "В тон теме", nameEn: "Follow Theme", descRu: "Адаптивный графит — наследует палитру активной темы", descEn: "Adaptive slate that inherits the active theme palette", bg: "#070708", side: "#0c0c0f" },
  { id: "claude-dark", nameRu: "Claude Code · Тёмная", nameEn: "Claude Code Dark", descRu: "Тёплый уголь #1F1E1D, крем и терракота #D97757", descEn: "Warm #1F1E1D charcoal, cream ink & #D97757 terracotta", bg: "#1f1e1d", side: "#181716", accent: "#d97757" },
  { id: "claude-light", nameRu: "Claude Code · Светлая", nameEn: "Claude Code Light", descRu: "Пергамент #FAF9F5, чернила #141413 и терракота", descEn: "Ivory #FAF9F5 parchment, #141413 ink & terracotta", bg: "#faf9f5", side: "#f0eee6", accent: "#c15f3c", isLight: true },
  { id: "frosted", nameRu: "Матовое стекло", nameEn: "Frosted Glass", descRu: "Полупрозрачный акрил поверх фона и обоев", descEn: "Translucent acrylic glass over wallpaper", bg: "rgba(21,21,26,0.74)", side: "rgba(28,28,34,0.72)" },
  { id: "minimal-mono", nameRu: "Минимализм", nameEn: "Minimal Mono", descRu: "Единая плоскость с тонкими 1px-разделителями", descEn: "Single flat plane with crisp hairline dividers", bg: "#070708", side: "#070708" },
  { id: "aurora", nameRu: "Графит с тоном", nameEn: "Tinted Graphite", descRu: "Спокойный графит с лёгким оттенком акцента", descEn: "Calm graphite tinted subtly by your accent color", bg: "#0b0c12", side: "#10121c" },
  { id: "neon-cyber", nameRu: "Контрастный HUD", nameEn: "Contrast HUD", descRu: "Тёмный контрастный контур с акцентной рамкой", descEn: "High-contrast dark shell with accent border", bg: "#08090f", side: "#0b0c14" },
];

const STUDIO_WINDOW_LAYOUTS = [
  { id: "sidebar", nameRu: "Классический сайдбар", nameEn: "Classic Sidebar", descRu: "Боковое меню с подписями и статусом", descEn: "Full left sidebar with labels & status" },
  { id: "rail", nameRu: "Компактный рейл", nameEn: "Compact Rail", descRu: "Узкая полоса иконок — максимум пространства", descEn: "Slim icon rail for maximum workspace" },
  { id: "topbar", nameRu: "Верхняя панель", nameEn: "Top Bar", descRu: "Горизонтальная навигация сверху окна", descEn: "Horizontal tab bar across the top" },
  { id: "floating-glass", nameRu: "Раздельные панели", nameEn: "Split Panels", descRu: "Две раздельные карточки навигации и контента", descEn: "Detached sidebar & content cards" },
];

const WIDGET_DESIGN_THEMES = [
  { id: "glass", nameRu: "В тон теме", nameEn: "Adaptive Glass", descRu: "Полупрозрачная поверхность в цветах активной темы", descEn: "Translucent surface matched to your active theme" },
  { id: "claude", nameRu: "Claude Code", nameEn: "Claude Code", descRu: "Тёплый уголь / пергамент и терракотовый акцент", descEn: "Warm Anthropic charcoal / parchment & terracotta" },
  { id: "island", nameRu: "Монолит Dark", nameEn: "Dark Island", descRu: "Глубокий тёмный остров с контрастными цифрами", descEn: "Deep dark capsule with crisp metrics" },
  { id: "minimal", nameRu: "Невесомый", nameEn: "Minimal", descRu: "Ультра-лёгкая сдержанная рамка без лишнего фона", descEn: "Featherweight ultra-clean frame" },
  { id: "solid", nameRu: "Плотный", nameEn: "Solid", descRu: "Непрозрачная матовая карточка для ярких обоев", descEn: "Opaque matte card for bright wallpapers" },
  { id: "neon", nameRu: "Контрастный контур", nameEn: "Accent Ring", descRu: "Тёмный виджет с тонкой акцентной рамкой", descEn: "Dark widget with crisp accent outline" },
];

const FONT_PAIR_PRESETS = [
  { id: "chatgpt", nameRu: "ChatGPT", nameEn: "ChatGPT", descRu: "OpenAI Sans / Inter + Fira Code", descEn: "OpenAI Sans / Inter + Fira Code", uiFont: "chatgpt-sans", monoFont: "fira" },
  { id: "opencode", nameRu: "OpenCode", nameEn: "OpenCode", descRu: "JetBrains Mono везде (терминальный код)", descEn: "JetBrains Mono everywhere (terminal coder)", uiFont: "opencode-mono", monoFont: "opencode-mono" },
  { id: "claude-default", nameRu: "Claude Code", nameEn: "Claude Code", descRu: "Claude Sans + JetBrains Mono", descEn: "Claude Sans + JetBrains Mono", uiFont: "claude-sans", monoFont: "claude-mono" },
  { id: "claude-editorial", nameRu: "Claude Editorial", nameEn: "Claude Editorial", descRu: "Source Serif 4 + JetBrains Mono", descEn: "Source Serif 4 + JetBrains Mono", uiFont: "claude-serif", monoFont: "claude-mono" },
  { id: "cursor", nameRu: "Cursor / Linear", nameEn: "Cursor / Linear", descRu: "Geist Sans + Geist Mono", descEn: "Geist Sans + Geist Mono", uiFont: "geist", monoFont: "geist-mono" },
  { id: "cyrillic-pro", nameRu: "Кириллица Pro", nameEn: "Cyrillic Pro", descRu: "Golos Text + JetBrains Mono", descEn: "Golos Text + JetBrains Mono", uiFont: "golos", monoFont: "jetbrains" },
  { id: "claude-cli", nameRu: "Claude Code CLI", nameEn: "Claude Code CLI", descRu: "Моноширинный терминал везде", descEn: "Monospace terminal everywhere", uiFont: "claude-mono-ui", monoFont: "claude-mono" },
  { id: "system", nameRu: "Стандартный", nameEn: "System Default", descRu: "Системные шрифты Antigravity", descEn: "Native Antigravity system fonts", uiFont: "system", monoFont: "system" },
];

const WALLPAPER_ATMOS_PRESETS = [
  { id: "original", nameRu: "Оригинал", nameEn: "Original", dim: 35, blur: 0, brightness: 100, contrast: 100, saturate: 100, hue: 0, vignette: 0 },
  { id: "cinema", nameRu: "Кино", nameEn: "Cinema", dim: 48, blur: 2, brightness: 92, contrast: 118, saturate: 110, hue: 0, vignette: 55 },
  { id: "soft-blur", nameRu: "Нежный блюр", nameEn: "Soft Blur", dim: 42, blur: 10, brightness: 96, contrast: 96, saturate: 120, hue: 0, vignette: 20 },
  { id: "noir", nameRu: "Нуар Ч/Б", nameEn: "Noir B&W", dim: 50, blur: 0, brightness: 94, contrast: 126, saturate: 0, hue: 0, vignette: 65 },
  { id: "neon-pop", nameRu: "Неон поп", nameEn: "Neon Pop", dim: 40, blur: 0, brightness: 104, contrast: 116, saturate: 155, hue: 14, vignette: 35 },
  { id: "airy", nameRu: "Лёгкая дымка", nameEn: "Airy Haze", dim: 58, blur: 6, brightness: 86, contrast: 90, saturate: 85, hue: 0, vignette: 15 },
];

const GREETING_QUICK_PRESETS = {
  ru: [
    { id: "time", label: "По времени", mode: "time-of-day", title: "{time}, {name}", subtitle: "" },
    { id: "short", label: "Коротко", mode: "custom", title: "Привет, {name}", subtitle: "" },
    { id: "focus", label: "Фокус", mode: "custom", title: "{weekday} · В работе", subtitle: "{date}" },
    { id: "zen", label: "Минимализм", mode: "minimal", title: "Готов.", subtitle: "" },
  ],
  en: [
    { id: "time", label: "Time of day", mode: "time-of-day", title: "{time}, {name}", subtitle: "" },
    { id: "short", label: "Short", mode: "custom", title: "Hey, {name}", subtitle: "" },
    { id: "focus", label: "Focus", mode: "custom", title: "{weekday} · Ready", subtitle: "{date}" },
    { id: "zen", label: "Minimal", mode: "minimal", title: "Ready.", subtitle: "" },
  ],
};

const ICON_PATHS = {
  grip: '<circle cx="9" cy="6" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.15" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.15" fill="currentColor" stroke="none"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  expand: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
  minimize: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  back: '<polyline points="15 18 9 12 15 6"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  rudexMark: '<path d="M7 19V5h6.2a4 4 0 0 1 0 8H7" stroke-width="2.1"/><path d="M12.5 13 17.5 19" stroke="var(--rx-accent)" stroke-width="2.2"/>',
  persona: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".75" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".75" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".75" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".75" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  panelRight: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/>',
  panelCenter: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  corners: '<path d="M3 9V6a3 3 0 0 1 3-3h3"/><path d="M15 3h3a3 3 0 0 1 3 3v3"/><path d="M21 15v3a3 3 0 0 1-3 3h-3"/><path d="M9 21H6a3 3 0 0 1-3-3v-3"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="9" y1="9" x2="21" y2="9"/>',
  rotateLeft: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/>',
  rotateRight: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><polyline points="21 3 21 8 16 8"/>',
  flipH: '<path d="M12 3v18"/><polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/>',
  flipV: '<path d="M3 12h18"/><polyline points="7 8 12 3 17 8"/><polyline points="7 16 12 21 17 16"/>',
  wand: '<path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>',
  move: '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  puzzle: '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  crosshair: '<circle cx="12" cy="12" r="7"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
};

const TEXT = {
  ru: {
    brandTitle: "Rudex",
    navMonitor: "Монитор",
    navAppearance: "Оформление",
    navPersona: "Характер",
    navSupplements: "Дополнения",
    navSettings: "Настройки",
    modalTitleMonitor: "Монитор генерации",
    modalSubMonitor: "Скорость потока (TPS) и объём контекста в активном чате",
    modalTitleAppearance: "Оформление",
    modalSubAppearance: "Комбинация темы, акцента, обоев и стекла",
    appDockRightBtn: "Справа · Обзор",
    appDockCenterBtn: "В центр",
    appLayerTheme: "Тема",
    appLayerAccent: "Акцент",
    appLayerWallpaper: "Обои",
    appLayerSurface: "Стекло",
    appLayerGreeting: "Приветствие",
    appLayerText: "Шрифт",
    claudeSuiteTitle: "Стиль Claude Code",
    claudeSuiteDesc: "Цвета и шрифты Anthropic для всего Antigravity и меню Rudex",
    claudeSuiteDarkBtn: "Тёмная",
    claudeSuiteLightBtn: "Светлая",
    claudeSuiteApplied: "Применён стиль Claude Code (цвета + шрифты)",
    themeTagDark: "Тёмная",
    themeTagLight: "Светлая",
    themeTagNative: "Базовая",
    fontPairsTitle: "Готовые шрифтовые пары Claude Code",
    fontPreviewLabel: "Живой образец типографики",
    fontPreviewTitle: "Чистая типографика интерфейса",
    fontPreviewBody: "Шрифты применяются одновременно ко всему интерфейсу Antigravity, ответам агента и окну Rudex Studio.",
    modalTitlePersona: "Характер агента",
    modalSubPersona: "Персональная инструкция для текущего чата",
    modalTitleSupplements: "Дополнения агенту",
    modalSubSupplements: "Указания и фото во время работы без отмены задачи",
    modalTitleSettings: "Настройки",
    modalSubSettings: "Виджет, экспорт чата в ZIP, лимиты и язык",
    backToSettings: "Назад",
    appSubTheme: "Тема",
    appSubWallpaper: "Обои",
    appSubCorners: "Углы",
    appSubSurface: "Стекло",
    appSubGreeting: "Приветствие",
    appSubText: "Текст",
    setSubWidget: "Мини-окно",
    setSubStudio: "Дизайн окна",
    setSubExport: "Экспорт и лимиты",
    setSubSystem: "Язык и система",
    appLayerCorners: "Углы",
    appGradFineTitle: "Цвета и движение градиента",
    appGradStyleLabel: "Тип градиента",
    appGradLinear: "Линейный",
    appGradRadial: "Радиальный",
    appGradMesh: "Меш-аврора",
    appWpStageTitle: "Кадр и позиция обоев",
    appWpStageEmptyHint: "Выберите фото или видео, чтобы двигать и кадрировать обои мышкой",
    appWpDragCrop: "Кадр",
    appWpDragOffset: "Сдвиг",
    appWpDragHint: "Тяни мышкой · Ctrl + колесо — зум",
    appWpFitCover: "Заполнить",
    appWpFitContain: "Вписать",
    appWpFitFill: "Растянуть",
    appWpAnchorTitle: "Якорь",
    appWpResetFrame: "Сброс",
    appWpGalleryTitle: "Недавние обои",
    appWpAtmosTitle: "Атмосфера и пресеты",
    appWpGeoTitle: "Геометрия и кадрирование",
    appWpColorTitle: "Цветокоррекция",
    appWpPosX: "Позиция X",
    appWpPosY: "Позиция Y",
    appWpOffsetX: "Сдвиг X",
    appWpOffsetY: "Сдвиг Y",
    appWpRotate: "Поворот",
    appWpBrightness: "Яркость света",
    appWpContrast: "Контраст",
    appWpHue: "Оттенок",
    appWpVignette: "Виньетка",
    appWpPlaybackRate: "Скорость видео",
    appWpTintBlend: "Наложение",
    appWpBlendNormal: "Обычный",
    appWpBlendMultiply: "Умножение",
    appWpBlendScreen: "Экран",
    appWpBlendOverlay: "Перекрытие",
    appWpBlendSoftLight: "Мягкий свет",
    cornersTitle: "Скругление углов Antigravity",
    cornersModeLinked: "Все элементы вместе",
    cornersModeCustom: "Отдельно по элементам",
    cornersPresetsTitle: "Готовые формы углов",
    cornersAllLabel: "Общий радиус всех элементов",
    cornersSwitchCustomBtn: "Настроить элементы отдельно →",
    cornersSyncAllBtn: "Выровнять все по общему",
    cornersPreviewLabel: "Живой макет интерфейса",
    cornersMsgLabel: "Сообщения чата",
    cornersComposerLabel: "Поле ввода (Composer)",
    cornersButtonsLabel: "Кнопки и триггеры",
    cornersCardsLabel: "Карточки, мысли и инструменты",
    cornersCodeLabel: "Блоки кода",
    cornersSidebarLabel: "Сайдбар, чаты и вкладки",
    cornersOverlaysLabel: "Меню, диалоги и поповеры",
    cornersInputsLabel: "Поля ввода и бейджи",
    cornersStudioQuickLabel: "Скругление окна Rudex Studio",
    studioDesignTitle: "Стиль окна Rudex Studio",
    studioLayoutTitle: "Навигация и макет окна",
    studioWindowSliders: "Геометрия и стекло окна Studio",
    studioRadiusLabel: "Скругление углов Studio",
    studioBlurLabel: "Размытие стекла Studio",
    studioScaleTitle: "Масштаб окна Rudex Studio",
    studioScaleHint: "Можно также долго удерживать (~0.5 с) правый нижний уголок окна и потянуть (двойной клик — 100%).",
    studioResizeGripTip: "Удерживайте ~0.5 с и потяните для масштаба окна (двойной клик — 100%)",
    studioResetBtn: "Сбросить дизайн окна",
    studioThemeCycleTip: "Сменить стиль окна Rudex",
    studioDesignQuickBtn: "Окно",
    widgetThemeTitle: "Дизайн мини-окна",
    widgetScaleTitle: "Масштаб виджета",
    widgetScaleHint: "В закреплённом положении удерживайте виджет (~0.5 с) и потяните, чтобы плавно изменить его масштаб в пределах экрана.",
    widgetScaleSm: "Компактный (S)",
    widgetScaleMd: "Обычный (M)",
    widgetScaleLg: "Крупный (L)",
    appScaleTitle: "Масштаб интерфейса Antigravity",
    appScaleDesc: "Масштабирует весь интерфейс Antigravity и все его элементы. Окно и виджет Rudex масштабируются отдельно.",
    widgetOpacityLabel: "Прозрачность мини-окна",
    widgetRadiusLabel: "Скругление мини-окна",
    widgetRadiusPill: "Капсула",
    widgetPreviewMiniBtn: "Капсула (S)",
    widgetPreviewMedBtn: "Карточка (M)",
    appDirtyBadge: "Черновик",
    thinkUnit: "мысль",
    appThemesTitle: "Палитра",
    appAccentQuick: "Независимый акцент",
    appAccentReset: "Как в теме",
    appCustomColor: "Свой",
    appFineTune: "Тонкие цвета и скроллбары",
    appCanvasColor: "Фон окна",
    appCardColor: "Фон карточек",
    appRadius: "Скругление",
    appBorderStrength: "Чёткость рамок",
    appPolishLabel: "Мягкие скроллбары и фокус",
    appWpNone: "Нет",
    appWpGradient: "Градиент",
    appWpImage: "Фото",
    appWpVideo: "Видео",
    appWpNoneHint: "Чистый фон темы без обоев. При желании выберите градиент, фото или видео — их можно сочетать с любой темой и акцентом.",
    appWpPickImage: "Выбрать фото…",
    appWpPickVideo: "Выбрать видео…",
    appWpClearMedia: "Убрать",
    appWpNoFileHint: "PNG, JPG, WebP или зацикленное видео MP4/WebM",
    appWpAnimated: "Плавная анимация",
    appWpDim: "Затемнение",
    appWpBlur: "Размытие",
    appWpOpacity: "Непрозрачность",
    appWpSaturate: "Насыщенность",
    appWpScale: "Масштаб",
    appWpSpeed: "Скорость",
    appWpAngle: "Угол",
    appWpAutoPause: "Пауза видео в фоне",
    appWpTintTitle: "Градиентная вуаль поверх обоев",
    appWpTintDesc: "Накладывает цветовой градиент поверх фото или видео для тонировки и глубины",
    appWpTintOpacity: "Плотность вуали",
    appWpReadability: "Читаемость и стекло",
    appGlassOpacity: "Плотность панелей",
    appSidebarOpacity: "Стекло сайдбара",
    appGlassBlur: "Размытие стекла",
    appMessageCardOpacity: "Подложка сообщений",
    appMsgStyleLabel: "Карточки сообщений",
    appMsgStyleGlass: "Стекло",
    appMsgStyleSolid: "Чёткие",
    appMsgStyleMinimal: "Без рамок",
    appHighContrastText: "Высокий контраст текста",
    appColorLabels: ["Цвет 1", "Цвет 2", "Цвет 3"],
    greetMasterTitle: "Своё приветствие на главном экране",
    greetMasterDesc: "Заменяет стандартную фразу нового чата и (опционально) подсказку ввода",
    greetModeTime: "По времени суток",
    greetModeCustom: "Свой текст",
    greetModeMinimal: "Минимализм",
    greetPresetsLabel: "Быстрые варианты",
    greetTitleLabel: "Заголовок",
    greetTitlePlaceholder: "Например: {time}, {name}",
    greetSubtitleLabel: "Подзаголовок (необязательно)",
    greetSubtitlePlaceholder: "Например: {weekday}, {date}",
    greetNameLabel: "Имя для {name}",
    greetNameAutoPrefix: "Авто:",
    greetPlaceholderLabel: "Подсказка в поле ввода",
    greetPlaceholderDefault: "Спросите что угодно… (оставьте пустым для стандарта)",
    greetPreviewLabel: "Предпросмотр нового чата",
    greetPreviewInputFallback: "Спросите что угодно, @ — упомянуть",
    appUiFont: "Шрифт интерфейса",
    appMonoFont: "Шрифт кода",
    appFontSize: "Размер текста",
    appLineHeight: "Интервал строк",
    appChatWidth: "Ширина ленты",
    appChatWidthAuto: "Авто",
    appDensity: "Плотность отступов",
    appDensityCompact: "Компактно",
    appDensityComfort: "Обычно",
    appDensitySpacious: "Просторно",
    appProfilesTitle: "Профили вида",
    appProfilePlaceholder: "Название профиля…",
    appSaveProfile: "Сохранить",
    appApplyBtn: "Применить",
    appCancelBtn: "Отмена",
    appResetBtn: "Сброс",
    appAppliedMsg: "Оформление сохранено",
    appResetMsg: "Возвращён стандартный вид",
    appMediaPickedMsg: "Файл загружен",
    appMediaErrMsg: "Не удалось загрузить файл",
    appProfileSavedMsg: "Профиль сохранён",
    appProfileDeletedMsg: "Профиль удалён",
    suppTitle: "Дополнение агенту",
    suppActiveHint: "Агент работает — дополнение вклинится на следующем шаге или продолжит ответ.",
    suppIdleHint: "Агент сейчас свободен — можете вставить текст сразу в чат или оставить в очереди.",
    suppPlaceholder: "Дополнение или Ctrl+V фото… Enter — отправить",
    suppPickPhoto: "Фото",
    suppSendBtn: "Отправить",
    suppInsertChatBtn: "В чат",
    suppInsertedToast: "Вставлено в поле чата",
    suppClearBtn: "Очистить",
    suppEmpty: "Очередь дополнений пуста. Прикрепите текст или скриншот во время ответа агента.",
    suppStatusPending: "В очереди",
    suppStatusDelivered: "Передано",
    suppStatusExpired: "Истекло",
    suppPhotoCount: "фото",
    tooltipSupplement: "Отправить дополнение агенту (Ctrl+Alt+E)",
    hkSupplement: "Открыть панель дополнений",
    personaStrictLabel: "100% удержание характера (PreInvocation + анти-дрифт)",
    personaStrictDesc: "Якорь на старте, освежение на длинных цепочках шагов и изоляция соседних чатов",
    personaHookBadge: "Hook + AGENTS.md",
    quotaSectionTitle: "Лимиты моделей (Неделя / 5ч)",
    quotaGeminiLabel: "Модели Gemini",
    quotaClaudeLabel: "Модели Claude и GPT",
    quotaCalibratedBadge: "Точные",
    quotaEstimatedBadge: "Нет данных",
    quotaCalibrateTip: "Откройте «Посмотреть использование» или Настройки → Модели в Antigravity — Rudex сразу считает реальные % без догадок.",
    quotaRemShort: "Осталось:",
    quotaOpenLimitsLink: "Детали лимитов →",
    quotaTableTitle: "Расход по чатам (Неделя / 5ч)",
    quotaColChat: "Чат",
    quotaColModel: "Модель",
    quotaCol5h: "5ч",
    quotaColWeek: "Неделя",
    quotaColTurns: "Ходы",
    quotaTableEmpty: "Пока нет учтённых ходов.",
    quotaResetBtn: "Сбросить",
    quotaResetDone: "Счётчики лимитов сброшены",
    quotaNoData: "нет снимка",
    exportTitle: "Экспорт чата в ZIP",
    exportDesc: "Упаковывает диалог, вложения, артефакты, характер и статистику чата в стандартный ZIP.",
    exportOptAttachments: "Фото и вложения",
    exportOptArtifacts: "Артефакты и scratch",
    exportOptPersona: "Характер агента",
    exportOptThinking: "Размышления (<details>)",
    exportOptFullLog: "Сырой лог transcript_full",
    exportBtnDownloads: "В Загрузки (ZIP)",
    exportBtnSaveAs: "Сохранить как…",
    exportBusy: "Упаковка…",
    exportSuccess: "Сохранено:",
    exportErr: "Ошибка экспорта:",
    exportRevealBtn: "Открыть папку",
    exportSummaryMsgs: "сообщ.",
    exportSummaryAttach: "влож.",
    exportSummaryArtifacts: "артеф.",
    exportSourceDisk: "полный архив с диска",
    exportSourceDom: "снимок открытого чата",
    statusReady: "Готов",
    statusWriting: "Генерация",
    phaseThinking: "Думает…",
    phaseIdle: "Ожидание",
    phaseLive: "Идёт генерация",
    kpiTps: "Скорость потока",
    kpiPeak: "Пиковая",
    kpiResp: "Последний ответ",
    kpiChat: "Контекст чата",
    kpiSubLive: "поток",
    kpiSubReady: "готов",
    kpiSubPeak: "макс. TPS",
    kpiSubExact: "точно по логу",
    kpiSubEst: "оценка",
    tpsUnit: "TPS",
    avgPrefix: "ср.",
    secUnit: "с",
    chatScopeNew: "Новый чат",
    chatScopeNamed: "Чат:",
    chatScopeHint: "Характер и статистика сохраняются отдельно для каждого чата.",
    tokShort: "ток.",
    peakLabel: "Пик",
    respLabel: "Ответ",
    chatLabel: "Чат",
    modelUnknown: "Модель не определена",
    resetStats: "Сбросить",
    cacheLabel: "Кэш",
    quota5hShort: "5ч",
    quotaWeekShort: "Нед.",
    previewTitle: "Живой вид мини-капсулы",
    modeTitle: "Размер виджета",
    modeMiniTitle: "Мини-капсула (S)",
    modeMiniDesc: "Компактная строка статуса и скорости",
    modeMedTitle: "Карточка (M)",
    modeMedDesc: "График TPS, токены, лимиты и характер",
    fieldsTitle: "Поля мини-капсулы",
    fieldStatus: "Индикатор состояния",
    fieldLang: "Кнопка RU / EN",
    fieldTps: "Скорость (TPS)",
    fieldResp: "Токены ответа",
    fieldChat: "Контекст чата",
    fieldModel: "Название модели",
    fieldQuota: "Лимиты (Нед. / 5ч)",
    dockTitle: "Позиция на экране",
    pinLockLabel: "Закрепить виджет",
    pinLockDesc: "Фиксирует позицию; в закреплённом виде долго удерживайте (~0.5 с) и потяните, чтобы изменить масштаб (клик открывает Rudex)",
    dockResetBtn: "К якорю",
    dockInlineHeader: "В шапке (UI)",
    dockTopLeft: "Левый верх",
    dockBottomRight: "Правый низ",
    dockTopRight: "Правый верх",
    dockMiddleRight: "Справа по центру",
    dockBottomLeft: "Левый низ",
    dockHidden: "Скрыт",
    dockHiddenHint: "При скрытом виджете панель всегда открывается по Ctrl+Alt+P.",
    personaMasterTitle: "Характер активен в этом чате",
    personaMasterDesc: "Автоматически переключается при смене чата",
    personaActiveTag: "Активен",
    personaUnsavedTag: "Не применено",
    personaOffTag: "Выкл",
    personaPresetsLabel: "Мои шаблоны",
    personaCustomLabel: "Шаблон",
    personaEditorLabel: "Инструкция (Markdown)",
    personaEditorPlaceholder: "Например: Отвечай кратко, структурно и сразу переходи к решению…",
    personaBytes: "байт",
    personaSavePresetPlaceholder: "Название шаблона…",
    personaAddPresetBtn: "Сохранить",
    personaApplyBtn: "Применить для чата",
    personaClearBtn: "Очистить",
    personaRulePathLabel: "Файл правила:",
    personaSavedMsg: "Применено для текущего чата",
    personaDisabledMsg: "Характер отключён (текст сохранён)",
    personaEmptyWarn: "Введите текст инструкции",
    personaPresetEmptyWarn: "Укажите название шаблона и текст",
    personaWriteErr: "Ошибка записи файла правила",
    personaTooLargeErr: "Превышен лимит (23 000 байт)",
    personaClearedMsg: "Очищено",
    personaDeletedPreset: "Шаблон удалён",
    personaSavedPreset: "Шаблон сохранён",
    personaLimitWarn: "Близко к лимиту",
    langCardsTitle: "Язык интерфейса Antigravity",
    langRuTitle: "Русский (RU)",
    langRuDesc: "Полный перевод меню, диалогов и настроек",
    langEnTitle: "English (EN)",
    langEnDesc: "Оригинальный английский интерфейс",
    langActiveBadge: "Активен",
    thinkingRuTitle: "Автоперевод мыслей агента на русский",
    thinkingRuDesc: "Выкл. по умолчанию (0 сетевых запросов). При включении переводит мысли через Google Translate или ваш локальный LibreTranslate (127.0.0.1), не тратя токены Antigravity.",
    thinkingRuGlobalDesc: "Выкл. по умолчанию. При включении переводит мысли прямо в интерфейсе без расхода квот Antigravity.",
    thinkingRuOn: "Русский (авто)",
    thinkingRuDefault: "По умолчанию",
    workLogRuTitle: "Автоперевод хода работы агента («Работал …»)",
    workLogRuDesc: "Отдельно от мыслей переводит промежуточные сообщения, статусы и пояснения агента внутри раскрытых блоков «Работал …» (без расхода токенов Antigravity).",
    thinkingLocalTitle: "Локальный переводчик (опционально, 100% офлайн)",
    thinkingLocalDesc: "Пусто = Google Translate. Укажите локальный LibreTranslate на 127.0.0.1 / localhost, чтобы мысли вообще не покидали ваш ПК.",
    thinkingLocalPlaceholder: "http://127.0.0.1:5000/translate",
    updateSectionTitle: "Обновления Rudex",
    updateBadgeNew: "Есть обновление",
    updateAutoTitle: "Автопроверка обновлений",
    updateAutoDesc: "Проверяет только номер версии на GitHub (ничего не скачивает и не ставит без вашего клика)",
    updateStatusLabel: "Статус",
    updateStatusIdle: "Автопроверка включена",
    updateStatusChecking: "Проверяем GitHub…",
    updateStatusUpToDate: "Установлена последняя версия",
    updateStatusAvailable: "Доступна новая версия",
    updateStatusDownloading: "Скачивание архива…",
    updateStatusVerifying: "Проверка SHA-256…",
    updateStatusExtracting: "Распаковка архива…",
    updateStatusInstalling: "Установка обновления…",
    updateStatusRestarting: "Перезапуск Antigravity…",
    updateStatusError: "Ошибка обновления",
    updateBtnCheck: "Проверить",
    updateBtnPreview: "Тест уведомления",
    updateLastCheckLabel: "Проверка",
    updatePreviewBadge: "Предпросмотр уведомления",
    updateBtnNow: "Обновить",
    updateBtnInstallRestart: "Обновить и перезапустить",
    updateBtnLater: "Позже",
    updateBtnRetry: "Повторить",
    updateToastTitle: "Доступно обновление Rudex",
    updateToastBusyTitle: "Обновление Rudex",
    updateToastDesc: "Нажмите «Обновить», чтобы установить новую версию и перезапустить Antigravity.",
    hotkeysTitle: "Горячие клавиши и управление",
    hkAppScale: "Масштаб интерфейса Antigravity",
    hkWidgetResize: "Масштаб виджета (закреплён)",
    hkWidgetResizeKey: "Зажать и потянуть",
    hkToggleLang: "Переключить язык RU / EN",
    hkToggleModal: "Открыть / закрыть Rudex",
    hkDoubleClick: "Открыть настройки по виджету",
    hkDoubleClickKey: "1 клик",
    hkEsc: "Закрыть окно",
    pluginInfoTitle: "О плагине Rudex",
    pluginVersion: "Версия",
    pluginDict: "Строк в словаре",
    pluginRules: "Динамических правил",
    pluginRepo: "Репозиторий",
    tooltipExpand: "Карточка (M)",
    tooltipMini: "Мини-капсула (S)",
    tooltipSettings: "Настройки Rudex (Ctrl+Alt+P)",
    tooltipPinLock: "Закрепить",
    tooltipPinUnlock: "Открепить",
    tooltipLang: "RU / EN",
    tooltipClose: "Закрыть (Esc)",
    tooltipRemove: "Убрать",
    tooltipDelete: "Удалить",
    sidebarFooterHint: "Открыть Rudex",
    personaBadgeOn: "Характер:",
    personaBadgeOff: "Без характера",
    customPresetTitle: "Свой",
  },
  en: {
    brandTitle: "Rudex",
    navMonitor: "Monitor",
    navAppearance: "Appearance",
    navPersona: "Persona",
    navSupplements: "Supplements",
    navSettings: "Settings",
    modalTitleMonitor: "Generation Monitor",
    modalSubMonitor: "Live token throughput (TPS) and active chat context",
    modalTitleAppearance: "Appearance",
    modalSubAppearance: "Mix and combine themes, accent, wallpaper, glass, and greeting",
    appDockRightBtn: "Dock right",
    appDockCenterBtn: "Center view",
    appLayerTheme: "Theme",
    appLayerAccent: "Accent",
    appLayerWallpaper: "Wallpaper",
    appLayerSurface: "Glass",
    appLayerGreeting: "Greeting",
    appLayerText: "Font",
    claudeSuiteTitle: "Claude Code Style",
    claudeSuiteDesc: "Anthropic palette & typography for Antigravity UI and Rudex menu",
    claudeSuiteDarkBtn: "Dark",
    claudeSuiteLightBtn: "Light",
    claudeSuiteApplied: "Claude Code palette & fonts applied",
    themeTagDark: "Dark",
    themeTagLight: "Light",
    themeTagNative: "Native",
    fontPairsTitle: "Claude Code Font Pairings",
    fontPreviewLabel: "Live typography specimen",
    fontPreviewTitle: "Editorial interface typography",
    fontPreviewBody: "Selected fonts apply across the entire Antigravity UI, agent responses, and the Rudex Studio menu.",
    modalTitlePersona: "Agent Persona",
    modalSubPersona: "Per-chat persona instruction (active from next reply)",
    modalTitleSupplements: "Agent Supplements",
    modalSubSupplements: "Send instructions or images mid-task without canceling",
    modalTitleSettings: "Settings",
    modalSubSettings: "Floating widget, ZIP export, quotas, and UI language",
    backToSettings: "Back",
    appSubTheme: "Theme",
    appSubWallpaper: "Wallpaper",
    appSubCorners: "Corners",
    appSubSurface: "Glass",
    appSubGreeting: "Greeting",
    appSubText: "Text",
    setSubWidget: "Mini Window",
    setSubStudio: "Window Design",
    setSubExport: "Export & Limits",
    setSubSystem: "Language & System",
    appLayerCorners: "Corners",
    appGradFineTitle: "Gradient colors & motion",
    appGradStyleLabel: "Gradient style",
    appGradLinear: "Linear",
    appGradRadial: "Radial",
    appGradMesh: "Mesh Aura",
    appWpStageTitle: "Wallpaper frame & position",
    appWpStageEmptyHint: "Choose an image or video to drag, pan, and zoom live",
    appWpDragCrop: "Frame",
    appWpDragOffset: "Offset",
    appWpDragHint: "Drag to move · Ctrl + scroll to zoom",
    appWpFitCover: "Cover",
    appWpFitContain: "Contain",
    appWpFitFill: "Stretch",
    appWpAnchorTitle: "Anchor",
    appWpResetFrame: "Reset",
    appWpGalleryTitle: "Recent wallpapers",
    appWpAtmosTitle: "Atmosphere presets",
    appWpGeoTitle: "Geometry & framing",
    appWpColorTitle: "Color grading",
    appWpPosX: "Position X",
    appWpPosY: "Position Y",
    appWpOffsetX: "Offset X",
    appWpOffsetY: "Offset Y",
    appWpRotate: "Rotate",
    appWpBrightness: "Brightness",
    appWpContrast: "Contrast",
    appWpHue: "Hue shift",
    appWpVignette: "Vignette",
    appWpPlaybackRate: "Video speed",
    appWpTintBlend: "Blend mode",
    appWpBlendNormal: "Normal",
    appWpBlendMultiply: "Multiply",
    appWpBlendScreen: "Screen",
    appWpBlendOverlay: "Overlay",
    appWpBlendSoftLight: "Soft Light",
    cornersTitle: "Antigravity Corner Radii",
    cornersModeLinked: "All elements together",
    cornersModeCustom: "Per-element control",
    cornersPresetsTitle: "Corner shape presets",
    cornersAllLabel: "Global radius for all elements",
    cornersSwitchCustomBtn: "Customize elements individually →",
    cornersSyncAllBtn: "Sync all to global",
    cornersPreviewLabel: "Live UI wireframe",
    cornersMsgLabel: "Chat messages",
    cornersComposerLabel: "Input composer",
    cornersButtonsLabel: "Buttons & triggers",
    cornersCardsLabel: "Cards, thinking & tools",
    cornersCodeLabel: "Code blocks",
    cornersSidebarLabel: "Sidebar, chats & tabs",
    cornersOverlaysLabel: "Menus, dialogs & popovers",
    cornersInputsLabel: "Inputs & badges",
    cornersStudioQuickLabel: "Rudex Studio window radius",
    studioDesignTitle: "Rudex Studio Window Style",
    studioLayoutTitle: "Navigation & Window Layout",
    studioWindowSliders: "Studio Geometry & Glass",
    studioRadiusLabel: "Studio corner radius",
    studioBlurLabel: "Studio backdrop blur",
    studioScaleTitle: "Rudex Studio Window Scale",
    studioScaleHint: "You can also long-press (~0.5s) and drag the bottom-right corner grip of Studio (double-click resets to 100%).",
    studioResizeGripTip: "Hold ~0.5s and drag to scale Studio window (double-click resets to 100%)",
    studioResetBtn: "Reset window design",
    studioThemeCycleTip: "Cycle Rudex window theme",
    studioDesignQuickBtn: "Window",
    widgetThemeTitle: "Mini Window Design",
    widgetScaleTitle: "Widget scale",
    widgetScaleHint: "When pinned, long-press (~0.5s) and drag the widget to smoothly resize it within screen bounds.",
    widgetScaleSm: "Compact (S)",
    widgetScaleMd: "Regular (M)",
    widgetScaleLg: "Large (L)",
    appScaleTitle: "Antigravity Interface Scale",
    appScaleDesc: "Scales the entire Antigravity UI and all elements. Rudex Studio and widget scale independently.",
    widgetOpacityLabel: "Mini window opacity",
    widgetRadiusLabel: "Mini window radius",
    widgetRadiusPill: "Capsule",
    widgetPreviewMiniBtn: "Capsule (S)",
    widgetPreviewMedBtn: "Card (M)",
    appDirtyBadge: "Draft",
    thinkUnit: "think",
    appThemesTitle: "Palette",
    appAccentQuick: "Independent Accent",
    appAccentReset: "Use theme default",
    appCustomColor: "Custom",
    appFineTune: "Fine colors & scrollbars",
    appCanvasColor: "Window background",
    appCardColor: "Card background",
    appRadius: "Corner radius",
    appBorderStrength: "Border sharpness",
    appPolishLabel: "Refined scrollbars & focus ring",
    appWpNone: "None",
    appWpGradient: "Gradient",
    appWpImage: "Image",
    appWpVideo: "Video",
    appWpNoneHint: "Clean theme background with no wallpaper. You can freely mix a gradient, image, or video with any theme and accent.",
    appWpPickImage: "Choose image…",
    appWpPickVideo: "Choose video…",
    appWpClearMedia: "Clear",
    appWpNoFileHint: "PNG, JPG, WebP or looping MP4/WebM video",
    appWpAnimated: "Smooth animation",
    appWpDim: "Dim",
    appWpBlur: "Blur",
    appWpOpacity: "Opacity",
    appWpSaturate: "Saturation",
    appWpScale: "Scale",
    appWpSpeed: "Cycle",
    appWpAngle: "Angle",
    appWpAutoPause: "Pause video when hidden",
    appWpTintTitle: "Gradient tint overlay",
    appWpTintDesc: "Blends a gradient wash over image or video wallpapers",
    appWpTintOpacity: "Tint opacity",
    appWpReadability: "Readability & glass",
    appGlassOpacity: "Panel opacity",
    appSidebarOpacity: "Sidebar glass",
    appGlassBlur: "Glass blur",
    appMessageCardOpacity: "Message backing",
    appMsgStyleLabel: "Message card style",
    appMsgStyleGlass: "Glass",
    appMsgStyleSolid: "Solid",
    appMsgStyleMinimal: "Borderless",
    appHighContrastText: "High-contrast message text",
    appColorLabels: ["Color 1", "Color 2", "Color 3"],
    greetMasterTitle: "Custom new-chat greeting",
    greetMasterDesc: "Replaces the default new-chat headline and optional composer hint",
    greetModeTime: "Time of day",
    greetModeCustom: "Custom",
    greetModeMinimal: "Minimal",
    greetPresetsLabel: "Quick presets",
    greetTitleLabel: "Headline",
    greetTitlePlaceholder: "Example: {time}, {name}",
    greetSubtitleLabel: "Subtitle (optional)",
    greetSubtitlePlaceholder: "Example: {weekday}, {date}",
    greetNameLabel: "Name for {name}",
    greetNameAutoPrefix: "Auto:",
    greetPlaceholderLabel: "Composer placeholder",
    greetPlaceholderDefault: "Ask anything… (leave blank for default)",
    greetPreviewLabel: "New chat preview",
    greetPreviewInputFallback: "Ask anything, @ to mention",
    appUiFont: "UI font",
    appMonoFont: "Code font",
    appFontSize: "Font size",
    appLineHeight: "Line height",
    appChatWidth: "Feed width",
    appChatWidthAuto: "Auto",
    appDensity: "Spacing density",
    appDensityCompact: "Compact",
    appDensityComfort: "Default",
    appDensitySpacious: "Spacious",
    appProfilesTitle: "Appearance profiles",
    appProfilePlaceholder: "Profile name…",
    appSaveProfile: "Save",
    appApplyBtn: "Apply",
    appCancelBtn: "Discard",
    appResetBtn: "Reset",
    appAppliedMsg: "Appearance saved",
    appResetMsg: "Restored native Antigravity appearance",
    appMediaPickedMsg: "Media loaded",
    appMediaErrMsg: "Failed to load media",
    appProfileSavedMsg: "Profile saved",
    appProfileDeletedMsg: "Profile removed",
    suppTitle: "Agent Supplement",
    suppActiveHint: "Agent is busy — delivered on the next step or right when the turn wraps.",
    suppIdleHint: "Agent is idle — insert directly into the chat box or queue for the next turn.",
    suppPlaceholder: "Instruction or Ctrl+V image… Enter to send",
    suppPickPhoto: "Photo",
    suppSendBtn: "Send",
    suppInsertChatBtn: "To chat",
    suppInsertedToast: "Inserted into chat input",
    suppClearBtn: "Clear",
    suppEmpty: "No supplements queued. Attach text or a screenshot anytime.",
    suppStatusPending: "Queued",
    suppStatusDelivered: "Delivered",
    suppStatusExpired: "Expired",
    suppPhotoCount: "photos",
    tooltipSupplement: "Send supplement to agent (Ctrl+Alt+E)",
    hkSupplement: "Toggle supplements popover",
    personaStrictLabel: "100% Persona Lock (PreInvocation + Anti-Drift)",
    personaStrictDesc: "Anchors turn 1, refreshes across long tool chains, isolates sibling chats",
    personaHookBadge: "Hook + AGENTS.md",
    quotaSectionTitle: "Model Quotas (5h / Weekly)",
    quotaGeminiLabel: "Gemini Models",
    quotaClaudeLabel: "Claude & GPT Models",
    quotaCalibratedBadge: "Exact",
    quotaEstimatedBadge: "Not synced",
    quotaCalibrateTip: "Open View Usage or Settings → Models in Antigravity — Rudex reads real % with zero guesses.",
    quotaRemShort: "Remaining:",
    quotaOpenLimitsLink: "Quota details →",
    quotaTableTitle: "Per-Chat Quota Breakdown (Weekly / 5h)",
    quotaColChat: "Chat",
    quotaColModel: "Model",
    quotaCol5h: "5h",
    quotaColWeek: "Weekly",
    quotaColTurns: "Turns",
    quotaTableEmpty: "No turns recorded yet.",
    quotaResetBtn: "Reset",
    quotaResetDone: "Quota counters reset",
    quotaNoData: "no snapshot",
    exportTitle: "Export Chat to ZIP",
    exportDesc: "Packages conversation markdown, attachments, artifacts, persona, and telemetry into a ZIP.",
    exportOptAttachments: "Uploaded files",
    exportOptArtifacts: "Artifacts & scratch",
    exportOptPersona: "Agent persona",
    exportOptThinking: "Thinking (<details>)",
    exportOptFullLog: "Raw transcript_full log",
    exportBtnDownloads: "Save to Downloads",
    exportBtnSaveAs: "Save As…",
    exportBusy: "Packaging…",
    exportSuccess: "Saved:",
    exportErr: "Export failed:",
    exportRevealBtn: "Open folder",
    exportSummaryMsgs: "msgs",
    exportSummaryAttach: "files",
    exportSummaryArtifacts: "artifacts",
    exportSourceDisk: "full disk archive",
    exportSourceDom: "DOM chat snapshot",
    statusReady: "Ready",
    statusWriting: "Writing",
    phaseThinking: "Thinking…",
    phaseIdle: "Idle",
    phaseLive: "Streaming",
    kpiTps: "Stream speed",
    kpiPeak: "Peak",
    kpiResp: "Latest reply",
    kpiChat: "Chat context",
    kpiSubLive: "streaming",
    kpiSubReady: "ready",
    kpiSubPeak: "max TPS",
    kpiSubExact: "exact log",
    kpiSubEst: "estimate",
    tpsUnit: "TPS",
    avgPrefix: "avg",
    secUnit: "s",
    chatScopeNew: "New chat",
    chatScopeNamed: "Chat:",
    chatScopeHint: "Persona and TPS stats are stored independently per chat.",
    tokShort: "tok",
    peakLabel: "Peak",
    respLabel: "Reply",
    chatLabel: "Chat",
    modelUnknown: "Model not detected",
    resetStats: "Reset",
    cacheLabel: "Cache",
    quota5hShort: "5h",
    quotaWeekShort: "Wk",
    previewTitle: "Mini capsule preview",
    modeTitle: "Widget size",
    modeMiniTitle: "Mini Capsule (S)",
    modeMiniDesc: "Slim status & speed pill",
    modeMedTitle: "Telemetry Card (M)",
    modeMedDesc: "TPS sparkline, tokens, limits & persona",
    fieldsTitle: "Mini capsule fields",
    fieldStatus: "Status dot",
    fieldLang: "RU / EN switch",
    fieldTps: "Speed (TPS)",
    fieldResp: "Reply tokens",
    fieldChat: "Chat context",
    fieldModel: "Model name",
    fieldQuota: "Quota (Wk / 5h)",
    dockTitle: "Position",
    pinLockLabel: "Lock widget in place",
    pinLockDesc: "Locks position; when pinned, hold and drag the widget to scale it (click opens Rudex)",
    dockResetBtn: "Snap to anchor",
    dockInlineHeader: "Header bar",
    dockTopLeft: "Top left",
    dockBottomRight: "Bottom right",
    dockTopRight: "Top right",
    dockMiddleRight: "Middle right",
    dockBottomLeft: "Bottom left",
    dockHidden: "Hidden",
    dockHiddenHint: "Press Ctrl+Alt+P anytime to open Rudex even when hidden.",
    personaMasterTitle: "Persona enabled in this chat",
    personaMasterDesc: "Automatically switches per chat",
    personaActiveTag: "Active",
    personaUnsavedTag: "Unsaved",
    personaOffTag: "Off",
    personaPresetsLabel: "My templates",
    personaCustomLabel: "Template",
    personaEditorLabel: "Instruction (Markdown)",
    personaEditorPlaceholder: "Example: Reply concisely, focus on code and avoid filler…",
    personaBytes: "bytes",
    personaSavePresetPlaceholder: "Template name…",
    personaAddPresetBtn: "Save",
    personaApplyBtn: "Apply to chat",
    personaClearBtn: "Clear",
    personaRulePathLabel: "Rule file:",
    personaSavedMsg: "Applied to active chat",
    personaDisabledMsg: "Persona disabled (draft kept)",
    personaEmptyWarn: "Enter a persona instruction first",
    personaPresetEmptyWarn: "Provide both template title and instruction text",
    personaWriteErr: "Failed to write rule file",
    personaTooLargeErr: "Rule exceeds 23,000 bytes",
    personaClearedMsg: "Cleared",
    personaDeletedPreset: "Template deleted",
    personaSavedPreset: "Template saved",
    personaLimitWarn: "Near limit",
    langCardsTitle: "Antigravity Interface Language",
    langRuTitle: "Русский (RU)",
    langRuDesc: "Complete Russian UI localization",
    langEnTitle: "English (EN)",
    langEnDesc: "Native English Antigravity UI",
    langActiveBadge: "Active",
    thinkingRuTitle: "Auto-translate agent thinking to Russian",
    thinkingRuDesc: "Off by default (0 network requests). When enabled, translates thinking via Google Translate or your local LibreTranslate (127.0.0.1) with zero Antigravity tokens.",
    thinkingRuGlobalDesc: "Off by default. When enabled, translates thinking in the UI without spending Antigravity quota.",
    thinkingRuOn: "Russian (auto)",
    thinkingRuDefault: "Default",
    workLogRuTitle: "Auto-translate agent work log (“Worked for…”)",
    workLogRuDesc: "Independently translates intermediate agent status updates and progress notes inside expanded “Worked for…” blocks with zero Antigravity tokens.",
    thinkingLocalTitle: "Local translator URL (optional, 100% offline)",
    thinkingLocalDesc: "Empty = Google Translate. Enter a local LibreTranslate endpoint on 127.0.0.1 / localhost to keep thinking strictly on your machine.",
    thinkingLocalPlaceholder: "http://127.0.0.1:5000/translate",
    updateSectionTitle: "Rudex Updates",
    updateBadgeNew: "Update available",
    updateAutoTitle: "Auto-check updates",
    updateAutoDesc: "Checks release version on GitHub only (never downloads or installs without your click)",
    updateStatusLabel: "Status",
    updateStatusIdle: "Auto-check enabled",
    updateStatusChecking: "Checking GitHub…",
    updateStatusUpToDate: "Up to date",
    updateStatusAvailable: "New version available",
    updateStatusDownloading: "Downloading archive…",
    updateStatusVerifying: "Verifying SHA-256…",
    updateStatusExtracting: "Extracting package…",
    updateStatusInstalling: "Installing update…",
    updateStatusRestarting: "Restarting Antigravity…",
    updateStatusError: "Update failed",
    updateBtnCheck: "Check now",
    updateBtnPreview: "Test toast",
    updateLastCheckLabel: "Checked",
    updatePreviewBadge: "Notification preview",
    updateBtnNow: "Update",
    updateBtnInstallRestart: "Update & Restart",
    updateBtnLater: "Later",
    updateBtnRetry: "Retry",
    updateToastTitle: "Rudex Update Available",
    updateToastBusyTitle: "Updating Rudex",
    updateToastDesc: "Click Update to install the latest skill release and restart Antigravity.",
    hotkeysTitle: "Shortcuts & Controls",
    hkAppScale: "Antigravity interface scale",
    hkWidgetResize: "Scale pinned widget",
    hkWidgetResizeKey: "Hold & drag",
    hkToggleLang: "Toggle RU / EN localization",
    hkToggleModal: "Toggle Rudex Studio",
    hkDoubleClick: "Open Rudex from widget",
    hkDoubleClickKey: "1 click",
    hkEsc: "Close dialog",
    pluginInfoTitle: "About Rudex",
    pluginVersion: "Version",
    pluginDict: "Dictionary entries",
    pluginRules: "Dynamic rules",
    pluginRepo: "Repository",
    tooltipExpand: "Card (M)",
    tooltipMini: "Mini pill (S)",
    tooltipSettings: "Open Rudex Settings (Ctrl+Alt+P)",
    tooltipPinLock: "Lock",
    tooltipPinUnlock: "Unlock",
    tooltipLang: "RU / EN",
    tooltipClose: "Close (Esc)",
    tooltipRemove: "Remove",
    tooltipDelete: "Delete",
    sidebarFooterHint: "Open Rudex",
    personaBadgeOn: "Persona:",
    personaBadgeOff: "Persona off",
    customPresetTitle: "Custom",
  },
};

function escHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(str) {
  return escHtml(str).replace(/'/g, "&#39;");
}

function formatCompact(num) {
  const n = Math.max(0, Math.round(Number(num) || 0));
  if (n >= 10000) return (n / 1000).toFixed(0) + "k";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function utf8ByteLength(str) {
  const text = String(str || "");
  if (typeof TextEncoder !== "undefined") {
    try {
      return new TextEncoder().encode(text).length;
    } catch (_e) {}
  }
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      bytes += 4;
      i += 1;
    } else bytes += 3;
  }
  return bytes;
}

function truncateToUtf8Bytes(str, maxBytes) {
  const text = String(str || "");
  if (utf8ByteLength(text) <= maxBytes) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (utf8ByteLength(text.slice(0, mid)) <= maxBytes) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo);
}

function iconSvg(name, size) {
  const s = size || 14;
  const paths = ICON_PATHS[name] || ICON_PATHS.gear;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

function normalizeMiniFields(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    status: src.status !== false,
    lang: src.lang !== false,
    tps: src.tps !== false,
    respTokens: src.respTokens === true,
    chatTokens: src.chatTokens === true,
    model: src.model === true,
    quota: src.quota === true,
  };
}

function normalizeDockPosition(rawDock) {
  if (rawDock === "top") return "top-right";
  if (rawDock === "middle") return "middle-right";
  if (rawDock === "bottom") return "bottom-right";
  return DOCK_POSITIONS.indexOf(rawDock) >= 0 ? rawDock : "bottom-right";
}

function normalizeViewMode(rawMode) {
  return rawMode === "medium" || rawMode === "large" ? "medium" : "mini";
}

function normalizeCustomPresets(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (let i = 0; i < list.length && out.length < 20; i += 1) {
    const p = list[i];
    if (!p || typeof p !== "object") continue;
    const id = String(p.id || "").trim();
    const rawTitle = typeof p.title === "string" ? p.title : (typeof p.name === "string" ? p.name : "");
    const rawBody = typeof p.body === "string" ? p.body : (typeof p.text === "string" ? p.text : "");
    const title = rawTitle.trim();
    const body = truncateToUtf8Bytes(rawBody, MAX_PERSONA_BODY_BYTES);
    if (!id || !title || !body.trim()) continue;
    out.push({ id, title: title.slice(0, 60), body });
  }
  return out;
}

function spNormalizeGreeting(raw) {
  if (typeof normalizeGreetingConfig === "function") return normalizeGreetingConfig(raw);
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

function spCloneGreeting(raw) {
  return Object.assign({}, spNormalizeGreeting(raw));
}

function spDefaultUiStyle() {
  if (typeof DEFAULT_UI_STYLE !== "undefined") return Object.assign({}, DEFAULT_UI_STYLE);
  return {
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
}

function spGetUiStylePresets() {
  if (typeof UI_STYLE_PRESETS !== "undefined" && Array.isArray(UI_STYLE_PRESETS)) return UI_STYLE_PRESETS;
  const mod = spGetThemeMod();
  if (mod && Array.isArray(mod.UI_STYLE_PRESETS)) return mod.UI_STYLE_PRESETS;
  return [
    { id: "antigravity", nameRu: "Antigravity", nameEn: "Antigravity", badge: "Базовый", badgeEn: "Default", descRu: "Оригинальный стиль поля ввода, чата и меню моделей Antigravity", descEn: "Original Antigravity composer, chat layout, and model selector" },
    { id: "claude-code", nameRu: "Claude Code", nameEn: "Claude Code", badge: "Anthropic", badgeEn: "Anthropic", descRu: "Редакторская строка Reply, спокойный текстовый выбор модели без рамок и компактные тёплые баблы", descEn: "Editorial Reply bar, quiet borderless model selector, and compact warm right bubbles" },
    { id: "codex", nameRu: "OpenAI Codex", nameEn: "OpenAI Codex", badge: "Codex Desktop", badgeEn: "Codex Desktop", descRu: "Объёмная командная капсула (20px), пилюльная кнопка модели и структурные карточки шагов", descEn: "Elevated 20px command capsule, pill model picker, and structured turn/tool cards" },
    { id: "opencode", nameRu: "OpenCode", nameEn: "OpenCode", badge: "SST TUI", badgeEn: "SST TUI", descRu: "Чёткий терминальный фрейм (6px), левая акцент-полоса сообщений и моноширинный бейдж моделей", descEn: "Crisp 6px terminal frame, left-accent session timeline bubbles, and mono model badge" },
  ];
}

function spDefaultAppearance() {
  if (typeof DEFAULT_APPEARANCE !== "undefined") return JSON.parse(JSON.stringify(DEFAULT_APPEARANCE));
  return {
    presetId: "native",
    uiPolish: true,
    customAccent: false,
    accentColor: "#3b82f6",
    canvasBg: "#070708",
    cardBg: "#15151a",
    customSidebarBg: false,
    sidebarBg: "#0f0f14",
    customBorderColor: false,
    borderColor: "#262630",
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
    uiStyle: spDefaultUiStyle(),
  };
}

function spNormalizeAppearance(raw) {
  if (typeof normalizeAppearance === "function") return normalizeAppearance(raw);
  const def = spDefaultAppearance();
  const src = raw && typeof raw === "object" ? raw : {};
  return Object.assign({}, def, src, {
    corners: Object.assign({}, def.corners, src.corners || {}),
    wallpaper: Object.assign({}, def.wallpaper, src.wallpaper || {}),
    typography: Object.assign({}, def.typography, src.typography || {}),
    uiStyle: Object.assign({}, def.uiStyle, src.uiStyle || {}),
  });
}

function widgetZoomToBucket(z) {
  const n = Number(z) || 100;
  return n <= 90 ? "sm" : (n >= 112 ? "lg" : "md");
}

function spNormalizeStudioUi(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const clampInt = (v, min, max, fb) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fb;
  };
  const winThemes = STUDIO_WINDOW_THEMES.map((x) => x.id);
  const winLayouts = STUDIO_WINDOW_LAYOUTS.map((x) => x.id);
  const widThemes = WIDGET_DESIGN_THEMES.map((x) => x.id);
  const rawWrad = Number(src.widgetRadius);
  const widgetRadius = Number.isFinite(rawWrad) && rawWrad < 50 ? clampInt(rawWrad, 4, 24, 999) : 999;
  const legacyScale = src.widgetScale === "sm" || src.widgetScale === "lg" ? src.widgetScale : "md";
  const hasExplicitZoom = src.widgetZoom !== undefined && src.widgetZoom !== null && Number.isFinite(Number(src.widgetZoom));
  const fallbackZoom = legacyScale === "sm" ? 85 : (legacyScale === "lg" ? 120 : 100);
  const widgetZoom = hasExplicitZoom ? clampInt(src.widgetZoom, 70, 160, fallbackZoom) : fallbackZoom;
  return {
    windowTheme: winThemes.indexOf(src.windowTheme) >= 0 ? src.windowTheme : DEFAULT_STUDIO_UI.windowTheme,
    windowLayout: winLayouts.indexOf(src.windowLayout) >= 0 ? src.windowLayout : DEFAULT_STUDIO_UI.windowLayout,
    widgetTheme: widThemes.indexOf(src.widgetTheme) >= 0 ? src.widgetTheme : DEFAULT_STUDIO_UI.widgetTheme,
    widgetScale: legacyScale,
    widgetZoom,
    widgetRadius,
    widgetOpacity: clampInt(src.widgetOpacity, 45, 100, DEFAULT_STUDIO_UI.widgetOpacity),
    widgetFont: typeof src.widgetFont === "string" && src.widgetFont.trim() ? src.widgetFont.trim().slice(0, 40) : DEFAULT_STUDIO_UI.widgetFont,
    widgetFontCustom: typeof src.widgetFontCustom === "string" ? src.widgetFontCustom.trim().slice(0, 80) : "",
    widgetFontSize: clampInt(src.widgetFontSize, 10, 18, DEFAULT_STUDIO_UI.widgetFontSize),
    studioRadius: clampInt(src.studioRadius, 8, 26, DEFAULT_STUDIO_UI.studioRadius),
    studioBlur: clampInt(src.studioBlur, 0, 32, DEFAULT_STUDIO_UI.studioBlur),
    appScale: clampInt(src.appScale, 70, 150, DEFAULT_STUDIO_UI.appScale),
    studioScale: clampInt(src.studioScale, 75, 140, DEFAULT_STUDIO_UI.studioScale),
  };
}

function spGetCornerPresets() {
  if (typeof CORNER_PRESETS !== "undefined" && Array.isArray(CORNER_PRESETS)) return CORNER_PRESETS;
  return [
    { id: "sharp", nameRu: "Острые", nameEn: "Sharp", mode: "linked", all: 0 },
    { id: "crisp", nameRu: "Чёткие", nameEn: "Crisp", mode: "linked", all: 6 },
    { id: "balanced", nameRu: "Баланс", nameEn: "Balanced", mode: "linked", all: 12 },
    { id: "soft", nameRu: "Мягкие", nameEn: "Soft", mode: "linked", all: 18 },
    { id: "pill", nameRu: "Капсулы", nameEn: "Pill", mode: "linked", all: 24 },
    { id: "editorial", nameRu: "Контраст", nameEn: "Editorial", mode: "custom", all: 12, messages: 18, composer: 22, buttons: 8, cards: 14, code: 6, sidebar: 8, overlays: 20, inputs: 10 },
  ];
}

function spCloneAppearance(raw) {
  return JSON.parse(JSON.stringify(spNormalizeAppearance(raw)));
}

let _spThemeModCache = null;
function spGetThemeMod() {
  if (_spThemeModCache !== null) return _spThemeModCache;
  if (typeof THEME_PRESETS === "undefined" && typeof module !== "undefined" && typeof require === "function") {
    try { _spThemeModCache = require("./theme-engine.js"); return _spThemeModCache; } catch (_e) {}
  }
  _spThemeModCache = false;
  return false;
}

function spGetThemePresets() {
  if (typeof THEME_PRESETS !== "undefined" && Array.isArray(THEME_PRESETS)) return THEME_PRESETS;
  const mod = spGetThemeMod();
  return mod && Array.isArray(mod.THEME_PRESETS) ? mod.THEME_PRESETS : [];
}

function spGetGradientPresets() {
  if (typeof GRADIENT_PRESETS !== "undefined" && Array.isArray(GRADIENT_PRESETS)) return GRADIENT_PRESETS;
  const mod = spGetThemeMod();
  return mod && Array.isArray(mod.GRADIENT_PRESETS) ? mod.GRADIENT_PRESETS : [];
}

function spGetFontPresets() {
  if (typeof FONT_PRESETS !== "undefined" && FONT_PRESETS) return FONT_PRESETS;
  const mod = spGetThemeMod();
  if (mod && mod.FONT_PRESETS) return mod.FONT_PRESETS;
  return { ui: [{ id: "system", label: "System", labelEn: "System", stack: "" }], mono: [{ id: "system", label: "System Mono", labelEn: "System Mono", stack: "" }] };
}

function spFindFont(group, id) {
  if (typeof teFindFont === "function") return teFindFont(group, id);
  const mod = spGetThemeMod();
  if (mod && typeof mod.teFindFont === "function") return mod.teFindFont(group, id);
  const list = (spGetFontPresets()[group]) || [];
  return list.find((f) => f.id === id) || list[0] || { id: "system", stack: "" };
}

function spMixHexColor(hexA, hexB, ratio) {
  if (typeof teMixHex === "function") return teMixHex(hexA, hexB, ratio);
  const mod = spGetThemeMod();
  if (mod && typeof mod.teMixHex === "function") return mod.teMixHex(hexA, hexB, ratio);
  return hexA;
}

function spFindThemePreset(id) {
  const list = spGetThemePresets();
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i];
  }
  return list[0] || { id: "native", vars: spDefaultAppearance() };
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function hashDjb2(str) {
  let h = 5381;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function extractUuid(str) {
  const m = UUID_RE.exec(String(str || ""));
  return m ? m[0].toLowerCase() : "";
}

function isHiddenAncestor(el, stopAt) {
  let cur = el;
  while (cur && cur !== stopAt) {
    if (cur.nodeType === 1) {
      const tag = String(cur.tagName || "").toUpperCase();
      const hasOpen = typeof cur.hasAttribute === "function" ? cur.hasAttribute("open") : Boolean(cur.open);
      if (tag === "DETAILS" && !hasOpen) return true;
      const hasHidden = typeof cur.hasAttribute === "function" ? cur.hasAttribute("hidden") : Boolean(cur.hidden);
      const ariaHidden = typeof cur.getAttribute === "function" ? cur.getAttribute("aria-hidden") : "";
      if (hasHidden || ariaHidden === "true") return true;
    }
    cur = cur.parentNode;
  }
  return false;
}

function hasMarkdownRootAncestor(el, stopAt) {
  let cur = el;
  while (cur && cur !== stopAt) {
    if (cur.nodeType === 1 && typeof cur.hasAttribute === "function" && cur.hasAttribute("data-markdown-root")) {
      return true;
    }
    cur = cur.parentNode;
  }
  return false;
}

function formatQuotaPct(val) {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return "0%";
  if (n < 0.1) return n.toFixed(2) + "%";
  if (n < 10) return n.toFixed(1) + "%";
  return Math.round(n) + "%";
}

function formatBytesCompact(bytes) {
  const b = Math.max(0, Number(bytes) || 0);
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + " MB";
  if (b >= 1024) return Math.round(b / 1024) + " KB";
  return b + " B";
}

const QUOTA_RESET_RE = /(?:refresh(?:ed|ing|es)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·,;]{2,48})/i;

function cleanQuotaResetText(raw) {
  return String(raw || "")
    .replace(/[.,;\s]+$/, "")
    .replace(/^\s+/, "")
    .trim()
    .slice(0, 80);
}

function extractBoundedReset(textSlice, crossBoundaryRe) {
  if (!textSlice) return "";
  let chunk = String(textSlice);
  if (crossBoundaryRe) {
    const boundM = crossBoundaryRe.exec(chunk);
    if (boundM) chunk = chunk.slice(0, boundM.index);
  }
  const rM = QUOTA_RESET_RE.exec(chunk);
  return rM ? cleanQuotaResetText(rM[1]) : "";
}

function extractPctForLabel(slice, labelRe, crossBoundaryRe) {
  let m;
  const globalLabel = new RegExp(labelRe.source, "gi");
  while ((m = globalLabel.exec(slice)) !== null) {
    const startIdx = m.index;
    const afterLabel = slice.slice(m.index + m[0].length, m.index + m[0].length + 260);
    const beforeSlice = slice.slice(Math.max(0, startIdx - 140), startIdx);
    const pctM = /(\d{1,3}(?:[.,]\d+)?)\s*%/.exec(afterLabel);
    const betweenAfter = pctM ? afterLabel.slice(0, pctM.index) : "";
    const afterHasPct = Boolean(pctM && !crossBoundaryRe.test(betweenAfter));
    const sameLineAfter = Boolean(afterHasPct && !/[\r\n]/.test(betweenAfter));

    const revMatches = [];
    const pctGlobal = /(\d{1,3}(?:[.,]\d+)?)\s*%/g;
    let pm;
    while ((pm = pctGlobal.exec(beforeSlice)) !== null) revMatches.push(pm);
    const lastPm = revMatches.length > 0 ? revMatches[revMatches.length - 1] : null;
    const gapBefore = lastPm ? beforeSlice.slice(lastPm.index + lastPm[0].length) : "";
    const beforeHasPct = Boolean(lastPm && !crossBoundaryRe.test(gapBefore));
    const sameLineBefore = Boolean(beforeHasPct && !/[\r\n]/.test(gapBefore));

    const pctIndicatesUsed = (nearby) => {
      const s = String(nearby || "");
      if (/\b(?:left|remaining)\b|остал[а-яё]*|остаток/i.test(s)) return false;
      return /\bused\b|использован[а-яё]*|израсходован[а-яё]*/i.test(s);
    };

    const readAfterMatch = () => {
      let val = parseFloat(pctM[1].replace(",", "."));
      if (!Number.isFinite(val) || val < 0 || val > 100) return null;
      const rightTail = afterLabel.slice(pctM.index + pctM[0].length, pctM.index + pctM[0].length + 28);
      if (pctIndicatesUsed(rightTail)) val = Math.max(0, Math.min(100, Math.round((100 - val) * 10) / 10));
      const resetFromBetween = extractBoundedReset(betweenAfter, crossBoundaryRe);
      const resetFromAfterPct = extractBoundedReset(
        afterLabel.slice(pctM.index + pctM[0].length, pctM.index + pctM[0].length + 140),
        crossBoundaryRe
      );
      return { val, reset: resetFromBetween || resetFromAfterPct };
    };

    const readBeforeMatch = () => {
      let val = parseFloat(lastPm[1].replace(",", "."));
      if (!Number.isFinite(val) || val < 0 || val > 100) return null;
      const rightTail = gapBefore.slice(0, 28);
      if (pctIndicatesUsed(rightTail)) val = Math.max(0, Math.min(100, Math.round((100 - val) * 10) / 10));
      const reset = extractBoundedReset(afterLabel.slice(0, 140), crossBoundaryRe);
      return { val, reset };
    };

    if (sameLineAfter) {
      const hit = readAfterMatch();
      if (hit) return hit;
    }
    if (sameLineBefore) {
      const hit = readBeforeMatch();
      if (hit) return hit;
    }
    if (afterHasPct) {
      const hit = readAfterMatch();
      if (hit) return hit;
    }
    if (beforeHasPct) {
      const hit = readBeforeMatch();
      if (hit) return hit;
    }
  }
  return null;
}

function parseQuotaSectionFromSlice(slice) {
  if (!slice) return null;
  let weeklyRem = null;
  let fiveHourRem = null;
  let weeklyReset = "";
  let fiveHourReset = "";

  const headerCrossPattern =
    "(?:gemini(?:\\s+(?:pro|flash))?\\s+models?|модели\\s+gemini|(?:claude|anthropic|gpt|openai)(?:\\s*(?:and|&|и|\\/|,)\\s*(?:claude|anthropic|gpt|openai|other))*\\s+models?|(?:claude|anthropic)\\s*(?:and|&|и|\\/)\\s*(?:gpt|openai)|(?:gpt|openai)\\s*(?:and|&|и|\\/)\\s*(?:claude|anthropic)|модели\\s+(?:claude|anthropic|gpt|openai))";
  const wkLabelRe = /(?:weekly\s+limit(?:\s+remaining)?|остаток\s+недельн[а-яё]*\s+лимит[а-яё]*|недельн[а-яё]*\s+лимит(?:\s+осталось|\s+исчерпан)?|осталось\s+за\s+недел[а-яё]*)/i;
  const fhLabelPart = "(?:(?:five[- ]?hour|5[-\\s]*hour|5\\s*h)\\s+limit(?:\\s+remaining)?|лимит\\s*\\(\\s*5\\s*ч\\s*\\)|остаток\\s+(?:5|пяти)[-\\s]*часов[а-яё]*\\s+лимит[а-яё]*|(?:5|пяти)[-\\s]*часов[а-яё]*\\s+лимит(?:\\s+осталось|\\s+исчерпан)?|осталось\\s+за\\s+5\\s*ч[а-яё]*|\\b5\\s*ч\\s+лимит)";
  const wkCrossRe = new RegExp(`(?:${fhLabelPart}|daily\\s+limit|дневн[а-яё]*\\s+лимит|${headerCrossPattern})`, "i");
  const fhLabelRe = new RegExp(fhLabelPart, "i");
  const fhCrossRe = new RegExp(`(?:weekly\\s+limit|остаток\\s+недельн[а-яё]*\\s+лимит|недельн[а-яё]*\\s+лимит|daily\\s+limit|дневн[а-яё]*\\s+лимит|${headerCrossPattern})`, "i");

  const wkUnusedM = /(?:not\s+used\s+any\s+of\s+your\s+weekly\s+limit|ещё\s+не\s+расходовали\s+недельн[а-яё]*\s+лимит)[\s\S]{0,140}/i.exec(slice);
  if (wkUnusedM) {
    weeklyRem = 100;
    weeklyReset = extractBoundedReset(wkUnusedM[0], wkCrossRe);
  } else {
    const wkHit = extractPctForLabel(slice, wkLabelRe, wkCrossRe);
    const wkExhM = /(?:used\s+all\s+of|reached|exhausted)\s+your\s+weekly\s+limit|исчерпали\s+недельн[а-яё]*\s+лимит|недельн[а-яё]*\s+лимит\s+исчерпан/i.exec(slice);
    if (wkHit) {
      weeklyRem = wkHit.val;
      weeklyReset = wkHit.reset;
    } else if (wkExhM) {
      weeklyRem = 0;
      weeklyReset = extractBoundedReset(slice.slice(wkExhM.index), wkCrossRe);
    }
  }

  const fhUnusedM = /(?:not\s+used\s+any\s+of\s+your\s+(?:5-hour|five[- ]hour)\s+limit|ещё\s+не\s+расходовали\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит)[\s\S]{0,140}/i.exec(slice);
  if (fhUnusedM) {
    fiveHourRem = 100;
    fiveHourReset = extractBoundedReset(fhUnusedM[0], fhCrossRe);
  } else {
    const fhHit = extractPctForLabel(slice, fhLabelRe, fhCrossRe);
    const fhExhM = /(?:used\s+all\s+of|reached|exhausted)\s+your\s+(?:5-hour|five[- ]hour)\s+limit|исчерпали\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит|лимит\s*\(\s*5\s*ч\s*\)\s+исчерпан/i.exec(slice);
    if (fhHit) {
      fiveHourRem = fhHit.val;
      fiveHourReset = fhHit.reset;
    } else if (fhExhM) {
      fiveHourRem = 0;
      fiveHourReset = extractBoundedReset(slice.slice(fhExhM.index), fhCrossRe);
    }
  }

  if (weeklyRem === null && fiveHourRem === null) return null;
  return { weeklyRem, fiveHourRem, weeklyReset, fiveHourReset };
}

function mergeParsedQuotaFamily(prev, next) {
  if (!next) return prev;
  if (!prev) return next;
  return {
    weeklyRem: next.weeklyRem !== null ? next.weeklyRem : prev.weeklyRem,
    fiveHourRem: next.fiveHourRem !== null ? next.fiveHourRem : prev.fiveHourRem,
    weeklyReset: next.weeklyReset || prev.weeklyReset || "",
    fiveHourReset: next.fiveHourReset || prev.fiveHourReset || "",
  };
}

function parseQuotaFromDocumentText(fullText, activeModelName) {
  const txt = String(fullText || "");
  if (!txt || txt.length < 20) return null;
  if (!/limit\s+remaining|weekly\s+limit|five\s*hour|5[-\s]*hour|5h\s+limit|лимит\s*\(\s*5\s*ч\s*\)|остаток\s+(?:недельн|5|пяти)|недельн[а-яё]*\s+лимит|пятичас|5[-\s]*часов/i.test(txt)) {
    return null;
  }
  const gemHeadRe = /(?:gemini(?:\s+(?:pro|flash))?\s+models?|модели\s+gemini(?:\s+(?:pro|flash))?)/gi;
  const claHeadRe = /(?:(?:claude|anthropic|gpt|openai)(?:\s*(?:and|&|и|\/|,)\s*(?:claude|anthropic|gpt|openai|other))*\s+models?|(?:claude|anthropic)\s*(?:and|&|и|\/)\s*(?:gpt|openai)|(?:gpt|openai)\s*(?:and|&|и|\/)\s*(?:claude|anthropic)|модели\s+(?:claude|anthropic|gpt|openai)(?:\s*(?:и|and|&|\/|,)\s*(?:claude|anthropic|gpt|openai))*)/gi;

  const findAllIndices = (re, fam) => {
    const res = [];
    let m;
    while ((m = re.exec(txt)) !== null) res.push({ fam, index: m.index, end: m.index + m[0].length });
    return res;
  };

  const gemIdxs = findAllIndices(gemHeadRe, "gemini");
  const claIdxs = findAllIndices(claHeadRe, "claudeGpt");
  const rawHeaders = gemIdxs.concat(claIdxs).sort((a, b) => a.index - b.index || b.end - a.end);
  const allHeaders = [];
  for (let i = 0; i < rawHeaders.length; i += 1) {
    const cur = rawHeaders[i];
    const prev = allHeaders.length > 0 ? allHeaders[allHeaders.length - 1] : null;
    if (prev && cur.index < prev.end) continue;
    allHeaders.push(cur);
  }

  let gemini = null;
  let claudeGpt = null;
  for (let i = 0; i < allHeaders.length; i += 1) {
    const cur = allHeaders[i];
    const next = allHeaders[i + 1];
    const sliceEnd = next ? Math.min(cur.index + 2400, next.index) : cur.index + 2400;
    const parsed = parseQuotaSectionFromSlice(txt.slice(cur.index, sliceEnd));
    if (!parsed) continue;
    if (cur.fam === "gemini") gemini = mergeParsedQuotaFamily(gemini, parsed);
    else claudeGpt = mergeParsedQuotaFamily(claudeGpt, parsed);
  }

  if (!gemini && !claudeGpt) {
    const fallbackParsed = parseQuotaSectionFromSlice(txt.slice(-3000));
    if (fallbackParsed) {
      const isCla = /claude|sonnet|opus|haiku|anthropic|gpt|openai|chatgpt|\bo[134](?:[-_\s]|$)/i.test(String(activeModelName || ""));
      if (isCla) claudeGpt = fallbackParsed;
      else gemini = fallbackParsed;
    }
  }

  if (!gemini && !claudeGpt) return null;
  return { gemini, claudeGpt };
}

function buildSparklineMarkup(samples, width, height, idPrefix) {
  const pts = Array.isArray(samples) && samples.length > 0 ? samples.slice(-24) : [0, 0];
  const padded = pts.length === 1 ? [pts[0], pts[0]] : pts;
  const peakVal = Math.max(0, ...padded);
  const maxVal = Math.max(12, peakVal);
  const padX = 5;
  const padY = 6;
  const innerW = Math.max(10, width - padX * 2);
  const innerH = Math.max(10, height - padY * 2);
  const coords = padded.map((v, idx) => {
    const x = padX + (idx / Math.max(1, padded.length - 1)) * innerW;
    const y = padY + innerH - (Math.max(0, v) / maxVal) * innerH;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  });
  let lineD = `M${coords[0][0]} ${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i > 0 ? i - 1 : i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];
    const cp1x = Number((p1[0] + (p2[0] - p0[0]) / 6).toFixed(1));
    const cp1y = Number(Math.max(padY, Math.min(height - padY, p1[1] + (p2[1] - p0[1]) / 6)).toFixed(1));
    const cp2x = Number((p2[0] - (p3[0] - p1[0]) / 6).toFixed(1));
    const cp2y = Number(Math.max(padY, Math.min(height - padY, p2[1] - (p3[1] - p1[1]) / 6)).toFixed(1));
    lineD += ` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  const last = coords[coords.length - 1];
  const first = coords[0];
  const baseY = (height - padY).toFixed(1);
  const areaD = `${lineD} L${last[0]} ${baseY} L${first[0]} ${baseY} Z`;
  const gradId = `rxSparkGrad_${idPrefix}`;
  const guideTopY = (padY + innerH * 0.28).toFixed(1);
  const guideBotY = (padY + innerH * 0.72).toFixed(1);
  const isIdle = peakVal <= 0.05;
  return `<svg class="spark-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--rx-accent)" stop-opacity="${isIdle ? "0.06" : "0.22"}"/>
        <stop offset="70%" stop-color="var(--rx-accent)" stop-opacity="${isIdle ? "0.02" : "0.05"}"/>
        <stop offset="100%" stop-color="var(--rx-accent)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line x1="${padX}" y1="${guideTopY}" x2="${width - padX}" y2="${guideTopY}" stroke="var(--rx-border)" stroke-dasharray="2 4" stroke-width="1"/>
    <line x1="${padX}" y1="${guideBotY}" x2="${width - padX}" y2="${guideBotY}" stroke="var(--rx-border)" stroke-dasharray="2 4" stroke-width="1"/>
    <path d="${areaD}" fill="url(#${gradId})"/>
    <path d="${lineD}" fill="none" stroke="var(--rx-accent)" stroke-opacity="${isIdle ? "0.45" : "0.95"}" stroke-width="${isIdle ? "1.3" : "1.75"}" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="2.4" fill="var(--rx-bg)" stroke="var(--rx-accent)" stroke-width="1.6"/>
  </svg>`;
}

function spTokenEstFloat(text) {
  return typeof estimateTokensFloat === "function" ? estimateTokensFloat(text) : Math.max(0, String(text || "").trim().length / 3.5);
}

function spTokenEst(text) {
  return typeof estimateTokens === "function" ? estimateTokens(text) : Math.round(spTokenEstFloat(text));
}

function spEmptyTelemetry() {
  if (typeof createEmptyTelemetry === "function") return createEmptyTelemetry();
  return {
    isGenerating: false,
    phase: "idle",
    currentTps: 0,
    lastAvgTps: 0,
    peakTps: 0,
    lastDurSec: 0,
    lastThinkingSec: 0,
    respTokens: 0,
    chatTokens: 0,
    exactRespTokens: 0,
    exactContextTokens: 0,
    exactCacheTokens: 0,
    contextLabel: "",
    modelName: "",
    samples: [],
    history: [],
    turnStartMs: 0,
    firstGrowthAt: 0,
    lastGrowthAt: 0,
    preTokenAt: 0,
    seedSliceMs: 160,
    activeStreamMs: 0,
    lastSparkAt: 0,
    turnStartFloatTok: 0,
    prevFloatTok: 0,
    prevRawFloatTok: 0,
    highWaterBubbleTok: 0,
    bankedTurnTokens: 0,
    activeRespEl: null,
    prevRespCount: 0,
    prevUserCount: 0,
    firstUserNorm: "",
    unconfirmedGrowthTicks: 0,
    unconfirmedFirstTok: 0,
    growthTicks: 0,
    tpsWindow: [],
    wasGenerating: false,
    dirty: false,
  };
}

function createStudioPanel(options) {
  const opts = options && typeof options === "object" ? options : {};
  const doc = opts.document || (typeof document !== "undefined" ? document : null);
  const win = opts.window || (typeof window !== "undefined" ? window : null);
  const ipc = opts.ipcRenderer || null;
  const webFrame = opts.webFrame || null;
  const translator = opts.translator || null;
  const stylesFn = typeof opts.buildStyles === "function"
    ? opts.buildStyles
    : (typeof buildStudioStyles === "function" ? buildStudioStyles : () => "");
  const pluginMeta = opts.pluginMeta && typeof opts.pluginMeta === "object"
    ? opts.pluginMeta
    : { version: "5.5.1", dictEntries: 4068, dynamicRulesCount: 485 };

  const telemetryEngine = opts.telemetryEngine || (typeof createTelemetryEngine === "function" ? createTelemetryEngine() : null);

  const mediaBlobCache = new Map();
  const mediaLoadInflight = new Set();

  function invokeIpc(channel, payload) {
    if (!ipc || typeof ipc.invoke !== "function") return Promise.resolve(null);
    try {
      return Promise.resolve(ipc.invoke(channel, payload)).catch(() => null);
    } catch (_e) {
      return Promise.resolve(null);
    }
  }

  function extractMediaFileName(fileName, mediaUrl) {
    if (typeof fileName === "string" && fileName.trim()) return fileName.trim();
    const s = String(mediaUrl || "").trim();
    if (s.startsWith("agy-media://local/")) {
      try { return decodeURIComponent(s.slice("agy-media://local/".length)); } catch (_e) {}
    }
    if (s.startsWith("rudex-media://local/")) {
      try { return decodeURIComponent(s.slice("rudex-media://local/".length)); } catch (_e) {}
    }
    return "";
  }

  function revokeCachedMedia(keepKey) {
    const revokeApi = win && win.URL && typeof win.URL.revokeObjectURL === "function"
      ? win.URL
      : (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function" ? URL : null);
    mediaBlobCache.forEach((blobUrl, key) => {
      if (keepKey && key === keepKey) return;
      if (revokeApi) {
        try { revokeApi.revokeObjectURL(blobUrl); } catch (_e) {}
      }
      mediaBlobCache.delete(key);
    });
  }

  function evictOldCachedMedia(maxEntries) {
    const limit = typeof maxEntries === "number" ? maxEntries : 24;
    if (mediaBlobCache.size <= limit) return;
    const revokeApi = win && win.URL && typeof win.URL.revokeObjectURL === "function"
      ? win.URL
      : (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function" ? URL : null);
    while (mediaBlobCache.size > limit) {
      const oldestKey = mediaBlobCache.keys().next().value;
      const oldUrl = mediaBlobCache.get(oldestKey);
      if (revokeApi && oldUrl) {
        try { revokeApi.revokeObjectURL(oldUrl); } catch (_e) {}
      }
      mediaBlobCache.delete(oldestKey);
    }
  }

  function resolveStudioMediaUrl(fileName, mediaUrl) {
    const key = extractMediaFileName(fileName, mediaUrl);
    if (!key) return mediaUrl || "";
    const cached = mediaBlobCache.get(key);
    if (cached) {
      mediaBlobCache.delete(key);
      mediaBlobCache.set(key, cached);
      return cached;
    }
    if (mediaUrl && mediaUrl.startsWith("agy-media://local/")) {
      return mediaUrl;
    }
    const BlobCtor = win && typeof win.Blob === "function" ? win.Blob : (typeof Blob === "function" ? Blob : null);
    const UrlApi = win && win.URL && typeof win.URL.createObjectURL === "function" ? win.URL : (typeof URL !== "undefined" && typeof URL.createObjectURL === "function" ? URL : null);
    if (!mediaLoadInflight.has(key) && ipc && BlobCtor && UrlApi) {
      mediaLoadInflight.add(key);
      invokeIpc("agy-studio:read-media", { fileName: key, mediaUrl }).then((res) => {
        mediaLoadInflight.delete(key);
        if (state.destroyed || !res || !res.ok || !res.bytes) return;
        try {
          const blob = new BlobCtor([res.bytes], { type: res.mime || "application/octet-stream" });
          const blobUrl = UrlApi.createObjectURL(blob);
          mediaBlobCache.set(key, blobUrl);
          evictOldCachedMedia(24);
          if (state.mounted || earlyThemeBooted) {
            applyThemeToHost(state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance);
          }
        } catch (_e) {}
      });
    }
    return mediaUrl || "";
  }

  const themeEngine = opts.themeEngine || (typeof createThemeEngine === "function" ? createThemeEngine({ document: doc, window: win, resolveMediaUrl: resolveStudioMediaUrl }) : null);
  let rudexOptimizer = null;
  function ensureRudexOptimizer() {
    if (rudexOptimizer) return rudexOptimizer;
    if (typeof createRudexOptimizer !== "function") return null;
    rudexOptimizer = createRudexOptimizer({
      document: doc,
      window: win,
      webFrame,
      initialSettings: state.settings.optimization,
      initialLocale: state.locale,
    });
    return rudexOptimizer;
  }
  function refreshLocalVoiceStatus(modelIdOverride) {
    if (state.destroyed || !state.localVoice) return;
    state.localVoice.loading = true;
    const modelId = modelIdOverride || (state.settings.optimization && state.settings.optimization.voiceLocalModel) || "ru-fast";
    invokeIpc("agy-studio:local-voice-status", { modelId }).then((res) => {
      if (state.destroyed) return;
      state.localVoice.loading = false;
      if (res && res.ok && res.status) {
        state.localVoice.status = res.status;
        const optCtrl = ensureRudexOptimizer();
        if (optCtrl && typeof optCtrl.setLocalVoiceReady === "function") {
          optCtrl.setLocalVoiceReady(Boolean(res.status.installed));
        }
      }
      if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "optimization") {
        renderStructure();
      }
    });
  }
  function applyLocalVoiceProgress(prog) {
    if (state.destroyed || !state.localVoice || !prog || typeof prog !== "object") return;
    state.localVoice.installing = prog.stage !== "done";
    state.localVoice.progressPct = Math.max(0, Math.min(100, Math.round(Number(prog.pct) || 0)));
    state.localVoice.progressMsg = String(prog.message || "");
    if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "optimization") {
      renderStructure();
    }
  }
  function refreshPerfDiagnostics() {
    if (state.destroyed || !state.perfDiag) return;
    state.perfDiag.loading = true;
    renderStructure();
    refreshLocalVoiceStatus();
    invokeIpc("agy-studio:get-cache-diagnostics").then((res) => {
      if (state.destroyed) return;
      state.perfDiag.loading = false;
      if (res && res.ok && res.diagnostics) {
        state.perfDiag.data = res.diagnostics;
      }
      if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "optimization") {
        renderStructure();
      }
    });
  }

  const state = {
    initialized: false,
    mounted: false,
    destroyed: false,
    locale: opts.initialLocale === "en" ? "en" : "ru",
    isOpen: false,
    activeTab: "appearance",
    appearanceSubTab: "theme",
    settingsSubTab: "system",
    widgetSubSection: "limits",
    agentSubTab: "tools",
    themeModeFilter: "all",
    historySearchQuery: "",
    lastRenderedNavKey: "",
    detectedWorkspacePath: "",
    lastHostMetricsSig: "",
    lastHostMetricsAt: 0,
    openDisclosures: {},
    theme: "dark",
    activeChatKey: "__new__",
    activeChatTitle: "",
    activeChatSwitchSeq: 0,
    personaSaveSeq: 0,
    settingsSaveSeq: 0,
    lastRemoteStateSig: "",
    hasActivatedChat: false,
    appZoomSupported: false,
    hydrationIgnoreUntil: 0,
    pendingNewSendAt: 0,
    lastCancelClickAt: 0,
    lastPromotedPersona: null,
    lastTempKey: "",
    lastTempKeyAt: 0,
    lastTempFirstUserNorm: "",
    lastFocusSyncAt: 0,
    lastPollAt: 0,
    lastDomMutationAt: 0,
    lastPreviewCapsuleHtml: "",
    lastSparkMedSig: "",
    lastSparkModalSig: "",
    lastSupplementSendAt: 0,
    lastSupplementSendSig: "",
    chatPersona: {
      enabled: false,
      activePreset: "custom",
      text: "",
      strict: true,
    },
    newChatDraftPersona: null,
    settings: {
      panelEnabled: true,
      pinned: true,
      viewMode: "mini",
      layoutMode: "docked",
      dockPosition: "bottom-right",
      floatX: null,
      floatY: null,
      miniFields: Object.assign({}, DEFAULT_MINI_FIELDS),
      trackHistory: true,
      personaStrictMode: true,
      thinkingInRussian: false,
      workLogInRussian: false,
      thinkingTranslatorUrl: "",
      composerDraftsEnabled: true,
      inputHistoryEnabled: true,
      autoCheckUpdates: true,
      customPresets: [],
      appearance: spCloneAppearance(spDefaultAppearance()),
      appearanceProfiles: [],
      greeting: spCloneGreeting(null),
      studioUi: Object.assign({}, DEFAULT_STUDIO_UI),
      customLabels: [],
      limitsWidget: typeof RUDEX_LIMITS_DEFAULTS !== "undefined" ? Object.assign({}, RUDEX_LIMITS_DEFAULTS) : { enabled: false },
      keybindings: typeof RUDEX_KEYBINDINGS_DEFAULTS !== "undefined" ? Object.assign({}, RUDEX_KEYBINDINGS_DEFAULTS) : {},
      zenMode: false,
      liveEditInline: typeof RUDEX_LIVE_EDIT_DEFAULTS !== "undefined" ? Object.assign({}, RUDEX_LIVE_EDIT_DEFAULTS) : { enabled: true, sendKey: "enter", urgentIntercept: false },
      agentProfileDefault: typeof RUDEX_AGENT_PROFILE_DEFAULTS !== "undefined" ? Object.assign({}, RUDEX_AGENT_PROFILE_DEFAULTS) : { enabled: false },
      customAgentPresets: [],
      quotaAutomation: typeof RUDEX_QUOTA_AUTOMATION_DEFAULTS !== "undefined" ? Object.assign({}, RUDEX_QUOTA_AUTOMATION_DEFAULTS) : { notifyOnReset: true, notifyWhenClosed: false, notifySound: true, autoContinueEnabled: false, autoContinueScope: "all", autoContinueChatKeys: [], autoContinueCurrentKey: "", autoContinuePrompt: "", autoContinueRetryFirst: true },
      optimization: typeof DEFAULT_OPTIMIZATION_SETTINGS !== "undefined" ? Object.assign({}, DEFAULT_OPTIMIZATION_SETTINGS) : { voiceEnabled: true, voiceEngine: "auto", voiceLocalModel: "ru-fast", voiceLangPreset: "auto", voiceCustomLangs: "", voiceExplicitLang: true, voiceChunkMs: 80, voiceDspFilter: true, voiceDisableWinIsolation: true, voiceAutoGain: true, voicePauseHeavyUi: true, voiceTextCleanup: true, voiceShowBadge: true, animMode: "smooth", animFixTransitionAll: true, animContainChat: true, animFreezeHidden: true, gpuAccel: false, lsTuningEnabled: false, lsMaxProcs: 0, lsFileWatchMaxDirs: 32768, lsMaxTrackedWorkspaces: 24, storageRamCache: false, chromiumCacheCapMb: 0, geminiFileCacheProtocol: false },
    },
    perfDiag: { loading: false, busy: false, data: null, lastMsg: "" },
    localVoice: { loading: false, installing: false, progressPct: 0, progressMsg: "", status: null, error: "" },
    quotaAlerts: { waitingChats: {} },
    lastRateLimitScanAt: 0,
    autoContinueInflight: false,
    pendingAutoResume: null,
    chatAgentProfile: typeof RUDEX_AGENT_PROFILE_DEFAULTS !== "undefined" ? Object.assign({}, RUDEX_AGENT_PROFILE_DEFAULTS) : { enabled: false },
    agentPopoverOpen: false,
    contextPopoverOpen: false,
    inlineUrgent: false,
    hasComposerText: false,
    pickerActive: false,
    pickerMode: "single", // "single" | "region" | "multi"
    pickerMultiItems: [],
    pickerMarqueeRect: null,
    pickerNudgeStep: 4,
    inspectorDragMoveActive: false,
    pickerSelected: null,
    pickerHoverRect: null,
    pickerHoverLabel: "",
    systemFonts: [],
    appearanceUndoStack: [],
    appearanceRedoStack: [],
    recordingKeybindingId: "",
    settingsSearchQuery: "",
    newLabelMatch: "",
    newLabelText: "",
    newAgentPresetName: "",
    newChatDraftAgentProfile: null,
    lastNativeInjectAt: 0,
    lastImgInjectAt: 0,
    lastChatDockHtml: "",
    inputHistory: { loading: false, items: [], draftCount: 0 },
    dismissedLiveEditIds: new Set(),
    workshop: {
      loading: false,
      scope: "global",
      sub: "rules",
      data: null,
      draft: {},
    },
    appearanceDraft: spCloneAppearance(spDefaultAppearance()),
    greetingDraft: spCloneGreeting(null),
    appearanceDirty: false,
    appearanceLivePreview: false,
    appearanceDockedRight: false,
    mediaLibrary: [],
    tempUploadedMediaFiles: [],
    wpDragMode: "crop",
    widgetPreviewMode: "mini",
    newProfileName: "",
    quotaSummary: null,
    initAtMs: Date.now(),
    userEditedComposerInChat: false,
    lastRpcQuotaAt: 0,
    lastQuotaScrapeAt: 0,
    lastQuotaScrapeSig: "",
    lastQuotaSyncAt: 0,
    lastAutoQuotaPollAt: 0,
    quotaPollInflight: false,
    lastQuotaFamiliesSig: "",
    exportOpts: {
      includeAttachments: true,
      includeArtifacts: true,
      includePersona: true,
      includeThinking: false,
      includeFullLog: false,
    },
    exportBusy: false,
    exportResult: null,
    exportError: "",
    draftPersonaText: "",
    draftDirty: false,
    newPresetName: "",
    personaFilePath: "~/.gemini/config/plugins/rudex/rules/AGENTS.md",
    toastMsg: "",
    toastError: false,
    liveEditOpen: false,
    liveEditDraftText: "",
    liveEditDraftImages: [],
    liveEditBusy: false,
    liveEditError: "",
    liveEdits: [],
    usagePopOpen: false,
    usagePopAnchor: null,
    lastUsagePopHtml: "",
    onAuthScreen: false,
    appTheme: "dark",
    updatePreviewActive: false,
    update: {
      status: "idle",
      available: false,
      dismissed: false,
      reason: "",
      updateKey: "",
      lastCheckedAt: 0,
      error: "",
      installed: null,
      remote: null,
    },
    telemetry: spEmptyTelemetry(),
  };

  let hostEl = null;
  let shadowRoot = null;
  let styleEl = null;
  let rootEl = null;
  let widgetMountEl = null;
  let popoverMountEl = null;
  let updateToastMountEl = null;
  let modalMountEl = null;
  let limitsMountEl = null;
  let chatDockMountEl = null;
  let usagePopMountEl = null;
  let pickerMountEl = null;
  let annotatorMountEl = null;
  let annotatorCtrl = null;
  let docPasteHandler = null;
  let docDropHandler = null;
  let docFileChangeHandler = null;
  let docInputHandler = null;
  let docCompEndHandler = null;
  let beforeUnloadDraftHandler = null;
  let quotaRpcMsgHandler = null;
  let draftRestoreVerifyTimers = [];
  let outsidePopoverHandler = null;
  let modelTriggerClickHandler = null;
  let modelTriggerSuppressClickHandler = null;
  let composerSendClickHandler = null;
  let composerSendPointerHandler = null;
  let lastLiveSendInterceptAt = 0;
  let earlyCaptureAttached = false;
  let earlyKeydownCapture = null;
  let earlyPointerDownCapture = null;
  let earlyClickCapture = null;
  let earlyPasteCapture = null;
  let quotaSilentSyncInflight = false;
  let lastTitleBarOverlaySig = "";
  let titleBarBootTimer = null;
  let quotaScrapeTimers = [];
  const composerOrigImages = []; // Ring buffer of full-resolution pasted/dropped/uploaded images before Antigravity downscales thumbnails
  const composerOrigFiles = []; // Ring buffer of attached non-image files (PDF, code, docs, etc.)
  const pendingComposerReads = new Set(); // In-flight FileReader promises so instant Enter after paste/drop never races
  const liveEditLocalPreviews = new Map(); // id -> { images: [{ name, previewDataUrl }], files: [{ name }] }
  const draftDataUrlToFileName = new Map(); // dataUrlSig -> persisted draft fileName (avoids re-sending MBs on every keystroke)
  const lastSavedDraftByChat = new Map(); // chatKey -> { text, atts: [{ name, mime, isImage, fileName }] }
  const draftTextCacheByChat = new Map(); // chatKey -> instant synchronous text cache (pre-warmed from boot-state-sync)
  let draftSaveTimer = null;
  let draftFollowupTimer = null;
  let lastDraftDiskSaveAt = 0;
  let draftRestoreTimer = null;
  let draftEarlyTextTimer = null;
  let draftStickinessObserver = null;
  let draftRestoreSeq = 0;
  let isRestoringDraft = false;
  let draftJustSubmittedUntil = 0;
  let lastDraftObsSig = "";
  let liveEditSendInFlight = false;
  let liveEditClearToken = 0;
  let userTypedAfterLiveEdit = false;
  let lastLiveEditSendAt = 0;
  let lastLiveEditSendText = "";
  let liveEditSentAtMs = 0;
  let normalSubmitClearToken = 0;
  let userTypedAfterNormalSubmit = false;
  let normalSubmitAtMs = 0;
  let limitsDragState = null;
  let limitsResizeState = null;
  let limitsSaveTimer = null;
  let limitsLiveEditUntil = 0;
  let studioUiSaveTimer = null;
  let studioUiLiveEditUntil = 0;
  let quotaAutoSaveTimer = null;
  let quotaAutoLiveEditUntil = 0;
  let pickerMoveHandler = null;
  let pickerClickHandler = null;
  let pickerKeyHandler = null;
  let pickerWheelHandler = null;
  let thinkingScanTimer = null;
  let isApplyingThinkingTranslation = false;
  const thinkingNodeMap = new WeakMap();
  const trackedThinkingNodes = new Set();
  const thinkingCache = new Map();
  const thinkingInflight = new Set();
  let pollTimer = null;
  let repaintTimer = null;
  let streamSampleTimer = null;
  let turnSyncTimer = null;
  let readyTimer = null;
  let settleTimer = null;
  let readyObserver = null;
  let domObserver = null;
  let themeObserver = null;
  let toastTimer = null;
  let keydownHandler = null;
  let cancelClickHandler = null;
  let sidebarNavClickHandler = null;
  let navChangeHandler = null;
  let navBurstTimers = [];
  let resizeHandler = null;
  let focusSyncHandler = null;
  let blurDragHandler = null;
  let visChangeHandler = null;
  let pointerMoveHandler = null;
  let pointerUpHandler = null;
  let dragState = null;
  let wpDragState = null;
  let widgetResizeState = null;
  let studioResizeState = null;
  let lastBodyClickAt = 0;
  let lastDragEndedAt = 0;

  function nowHiRes() {
    try {
      if (win && win.performance && typeof win.performance.now === "function") return win.performance.now();
      if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
    } catch (_e) {}
    return Date.now();
  }

  function isRealHttpPage() {
    try {
      return Boolean(win && win.location && typeof win.location.protocol === "string" && /^https?:$/i.test(win.location.protocol));
    } catch (_e) {
      return false;
    }
  }

  function isAntigravityUiReady() {
    if (!doc || typeof doc.querySelector !== "function") return true;
    if (!isRealHttpPage()) return true;
    try {
      if (doc.querySelector('[data-testid="model-selector-trigger"], [data-testid="user-message-content"], [data-testid="agent-response"]')) {
        return true;
      }
      if (doc.querySelector('textarea, [contenteditable="true"], [data-testid="composer"]') && doc.querySelector("nav, aside, main, header")) {
        return true;
      }
    } catch (_e) {}
    return false;
  }

  function t() {
    return TEXT[state.locale] || TEXT.ru;
  }

  function parseColorLightness(raw) {
    const s = String(raw || "").trim().toLowerCase();
    if (!s || s === "transparent" || s === "none") return null;
    const hexM = /^#([0-9a-f]{6})$/i.exec(s);
    if (hexM) {
      const h = hexM[1];
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 / 255;
    }
    const rgbM = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+%?))?/.exec(s);
    if (rgbM) {
      if (rgbM[4] !== undefined) {
        const a = rgbM[4].endsWith("%") ? parseFloat(rgbM[4]) / 100 : parseFloat(rgbM[4]);
        if (Number.isFinite(a) && a < 0.25) return null;
      }
      return (parseFloat(rgbM[1]) * 299 + parseFloat(rgbM[2]) * 587 + parseFloat(rgbM[3]) * 114) / 1000 / 255;
    }
    const okM = /^oklch\(\s*([\d.]+%?)/.exec(s);
    if (okM) {
      const l = okM[1].endsWith("%") ? parseFloat(okM[1]) / 100 : parseFloat(okM[1]);
      return Number.isFinite(l) ? l : null;
    }
    return null;
  }

  function detectAppTheme() {
    const activeApp = state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance;
    if (activeApp && activeApp.presetId && activeApp.presetId !== "native") {
      if (activeApp.presetId === "custom") {
        const customL = parseColorLightness(activeApp.canvasBg);
        if (customL !== null) return customL > 0.58 ? "light" : "dark";
      } else {
        const pr = spFindThemePreset(activeApp.presetId);
        if (pr && pr.mode === "light") return "light";
        if (pr && pr.mode === "dark") return "dark";
      }
    }
    if (!doc || !win) return "dark";
    try {
      const htmlEl = doc.documentElement;
      const bodyEl = doc.body;
      if (htmlEl && ((htmlEl.classList && htmlEl.classList.contains("light")) || (typeof htmlEl.getAttribute === "function" && htmlEl.getAttribute("data-theme") === "light"))) {
        return "light";
      }
      if (bodyEl && bodyEl.classList && (bodyEl.classList.contains("light") || bodyEl.classList.contains("vscode-light"))) {
        return "light";
      }
      if (typeof win.getComputedStyle === "function" && htmlEl) {
        const cs = win.getComputedStyle(htmlEl);
        const l1 = parseColorLightness(cs.getPropertyValue("--background"));
        if (l1 !== null) return l1 > 0.58 ? "light" : "dark";
        const l2 = parseColorLightness(cs.backgroundColor);
        if (l2 !== null) return l2 > 0.58 ? "light" : "dark";
      }
      if (htmlEl && htmlEl.classList && htmlEl.classList.contains("dark")) return "dark";
      if (typeof win.matchMedia === "function" && win.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    } catch (_e) {}
    return "dark";
  }

  function detectTheme() {
    const sui = spNormalizeStudioUi(state.settings.studioUi);
    if (sui.windowTheme === "claude-light") return "light";
    if (sui.windowTheme === "claude-dark") return "dark";
    return detectAppTheme();
  }

  const RESIZE_HOLD_MS = 450;
  const RESIZE_CANCEL_MOVE_PX = 10;

  function getEffectiveAppFactor() {
    const sui = spNormalizeStudioUi(state.settings.studioUi);
    return state.appZoomSupported ? Math.max(0.5, sui.appScale / 100) : 1;
  }

  function getMaxSafeStudioScale() {
    const vw = (win && Number(win.innerWidth)) || 1280;
    const vh = (win && Number(win.innerHeight)) || 800;
    const isDrawer = Boolean(state.isOpen && state.activeTab === "appearance" && state.appearanceDockedRight);
    const baseW = isDrawer ? 478 : 920;
    const baseH = isDrawer ? 600 : 648;
    const padX = isDrawer ? 28 : 40;
    const padY = isDrawer ? 32 : 44;
    const maxEffZoom = Math.min((vw - padX) / baseW, (vh - padY) / baseH);
    const appFactor = getEffectiveAppFactor();
    if (!Number.isFinite(maxEffZoom) || maxEffZoom <= 0) return 100;
    return Math.max(75, Math.min(140, Math.floor(maxEffZoom * appFactor * 100)));
  }

  function getMaxSafeWidgetZoom() {
    const vw = (win && Number(win.innerWidth)) || 1280;
    const vh = (win && Number(win.innerHeight)) || 800;
    const appFactor = getEffectiveAppFactor();
    const isMed = state.settings.viewMode === "medium";
    let baseW = isMed ? 318 : 280;
    let baseH = isMed ? 310 : 36;
    if (widgetMountEl && typeof widgetMountEl.getBoundingClientRect === "function") {
      try {
        const curZoom = parseFloat(rootEl && rootEl.style && rootEl.style.getPropertyValue("--rx-widget-zoom")) || 1;
        const r = widgetMountEl.getBoundingClientRect();
        if (r && r.width > 24 && r.height > 20 && curZoom > 0.2) {
          baseW = Math.max(120, r.width / curZoom);
          baseH = Math.max(30, r.height / curZoom);
        }
      } catch (_e) {}
    }
    const dock = normalizeDockPosition(state.settings.dockPosition);
    const topReserve = state.settings.layoutMode === "docked" && (dock === "top-right" || dock === "top-left") ? 68 : 28;
    const availW = Math.max(120, vw - 28);
    const availH = Math.max(48, vh - topReserve);
    const maxEffZoom = Math.min(availW / baseW, availH / baseH);
    if (!Number.isFinite(maxEffZoom) || maxEffZoom <= 0) return 100;
    return Math.max(70, Math.min(160, Math.floor(maxEffZoom * appFactor * 100)));
  }

  function syncTheme() {
    const appNext = detectAppTheme();
    const next = detectTheme();
    const prevAppTheme = state.appTheme;
    state.appTheme = appNext;
    state.theme = next;
    if (rootEl) {
      const sui = spNormalizeStudioUi(state.settings.studioUi);
      rootEl.setAttribute("data-theme", next);
      rootEl.setAttribute("data-app-theme", appNext);
      rootEl.setAttribute("data-studio-theme", sui.windowTheme);
      rootEl.style.setProperty("--rx-studio-radius", `${sui.studioRadius}px`);
      rootEl.style.setProperty("--rx-studio-blur", `${sui.studioBlur}px`);
      rootEl.style.setProperty("--rx-widget-opacity", (sui.widgetOpacity / 100).toFixed(2));
      rootEl.style.setProperty("--rx-widget-radius", sui.widgetRadius >= 999 ? "999px" : `${sui.widgetRadius}px`);
      rootEl.style.setProperty("--rx-widget-font-size", `${sui.widgetFontSize || 12}px`);
      const wfStack = sui.widgetFont && sui.widgetFont !== "inherit" && typeof teResolveFontStack === "function"
        ? teResolveFontStack("ui", sui.widgetFont, sui.widgetFontCustom)
        : "";
      if (wfStack) rootEl.style.setProperty("--rx-widget-font-family", wfStack);
      else rootEl.style.removeProperty("--rx-widget-font-family");
      const appFactor = state.appZoomSupported ? (sui.appScale / 100) : 1;
      const vw = (win && Number(win.innerWidth)) || 1280;
      const vh = (win && Number(win.innerHeight)) || 800;
      const isDrawer = Boolean(state.isOpen && state.activeTab === "appearance" && state.appearanceDockedRight);
      const maxStudioEffZoom = Math.max(0.55, Math.min(2.0, (vw - (isDrawer ? 28 : 40)) / (isDrawer ? 478 : 920), (vh - (isDrawer ? 32 : 44)) / (isDrawer ? 600 : 648)));
      const rawStudioZoom = (sui.studioScale / 100) / appFactor;
      const studioZoom = Math.max(0.55, Math.min(maxStudioEffZoom, rawStudioZoom));

      const isMed = state.settings.viewMode === "medium";
      const minWidgetW = isMed ? 318 : 260;
      const minWidgetH = isMed ? 310 : 36;
      const dock = normalizeDockPosition(state.settings.dockPosition);
      const topRes = state.settings.layoutMode === "docked" && (dock === "top-right" || dock === "top-left") ? 68 : 28;
      const maxWidgetEffZoom = Math.max(0.55, Math.min(2.2, (vw - 28) / minWidgetW, (vh - topRes) / minWidgetH));
      const rawWidgetZoom = (sui.widgetZoom / 100) / appFactor;
      const widgetZoom = Math.max(0.55, Math.min(maxWidgetEffZoom, rawWidgetZoom));
      const previewZoom = Math.max(0.7, Math.min(1.25, sui.widgetZoom / 100));
      rootEl.style.setProperty("--rx-studio-zoom", studioZoom.toFixed(4));
      rootEl.style.setProperty("--rx-widget-zoom", widgetZoom.toFixed(4));
      rootEl.style.setProperty("--rx-widget-preview-zoom", previewZoom.toFixed(4));
      clampWidgetToViewport();

      const activeApp = spNormalizeAppearance(state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance);
      const preset = spFindThemePreset(activeApp && activeApp.presetId);
      const hasThemePalette = activeApp && activeApp.presetId && activeApp.presetId !== "native";

      // Sync full active theme palette into Rudex Studio & widget bridge variables
      const themePropNames = [
        "--rx-theme-bg",
        "--rx-theme-sidebar",
        "--rx-theme-surface",
        "--rx-theme-surface-2",
        "--rx-theme-fg",
        "--rx-theme-fg-strong",
        "--rx-theme-muted",
        "--rx-theme-border",
        "--rx-theme-border-strong",
      ];
      if (hasThemePalette) {
        const vars = activeApp.presetId === "custom"
          ? {
              mode: appNext,
              canvasBg: activeApp.canvasBg,
              cardBg: activeApp.cardBg,
              sidebarBg: activeApp.customSidebarBg ? activeApp.sidebarBg : spMixHexColor(activeApp.canvasBg, activeApp.cardBg, 0.45),
              fgColor: appNext === "light" ? "#141418" : "#ececef",
              mutedColor: appNext === "light" ? "#5c5c66" : "#9a9aa6",
              borderColor: activeApp.customBorderColor ? activeApp.borderColor : (appNext === "light" ? "rgba(17, 18, 24, 0.14)" : "rgba(255, 255, 255, 0.10)"),
            }
          : (preset && preset.vars
              ? Object.assign({}, preset.vars, {
                  sidebarBg: activeApp.customSidebarBg ? activeApp.sidebarBg : preset.vars.sidebarBg,
                  borderColor: activeApp.customBorderColor ? activeApp.borderColor : preset.vars.borderColor,
                })
              : null);
        if (vars) {
          const isThemeLight = (preset && preset.mode === "light") || (activeApp.presetId === "custom" && appNext === "light");
          const surface2 = spMixHexColor(vars.cardBg, isThemeLight ? "#000000" : "#ffffff", isThemeLight ? 0.05 : 0.065);
          const softFg = spMixHexColor(vars.fgColor, vars.canvasBg, 0.14);
          rootEl.style.setProperty("--rx-theme-bg", vars.canvasBg);
          rootEl.style.setProperty("--rx-theme-sidebar", vars.sidebarBg || vars.canvasBg);
          rootEl.style.setProperty("--rx-theme-surface", vars.cardBg);
          rootEl.style.setProperty("--rx-theme-surface-2", surface2);
          rootEl.style.setProperty("--rx-theme-fg", softFg);
          rootEl.style.setProperty("--rx-theme-fg-strong", vars.fgColor);
          rootEl.style.setProperty("--rx-theme-muted", vars.mutedColor);
          rootEl.style.setProperty("--rx-theme-border", activeApp.customBorderColor ? activeApp.borderColor : (isThemeLight ? "rgba(20, 20, 19, 0.09)" : "rgba(255, 255, 255, 0.08)"));
          rootEl.style.setProperty("--rx-theme-border-strong", vars.borderColor || (isThemeLight ? "rgba(20, 20, 19, 0.16)" : "rgba(255, 255, 255, 0.15)"));
        }
      } else {
        for (let i = 0; i < themePropNames.length; i += 1) {
          rootEl.style.removeProperty(themePropNames[i]);
        }
      }

      // Sync exact composer surface/glass/border/blur/radius tokens so the "Tools" chip & context pill
      // share the EXACT same frosted glass material & gradient as the chat input box below them
      try {
        const isCompLight = appNext === "light";
        const wpObj = activeApp && activeApp.wallpaper ? activeApp.wallpaper : null;
        const hasWpActive = Boolean(wpObj && wpObj.type && wpObj.type !== "none" && (wpObj.type === "gradient" || wpObj.mediaUrl));
        const usObj = activeApp && activeApp.uiStyle ? activeApp.uiStyle : {};
        const compStyle = usObj.composer || usObj.preset || "antigravity";
        const themeVars = activeApp.presetId === "custom"
          ? { canvasBg: activeApp.canvasBg, cardBg: activeApp.cardBg, fgColor: isCompLight ? "#141418" : "#ececef", borderColor: isCompLight ? "rgba(17,18,24,0.14)" : "rgba(255,255,255,0.10)" }
          : (preset && preset.vars ? preset.vars : null);
        let baseCard = hasThemePalette && themeVars && themeVars.cardBg
          ? themeVars.cardBg
          : (compStyle === "claude-code" ? (isCompLight ? "#faf9f5" : "#262624") : (compStyle === "codex" ? (isCompLight ? "#ffffff" : "#18181b") : (isCompLight ? "#faf9f5" : "#1f1e1d")));
        if (hasThemePalette && themeVars && themeVars.canvasBg && typeof teGetYiq === "function") {
          if (Math.abs(teGetYiq(baseCard) - teGetYiq(themeVars.canvasBg)) < 14) {
            baseCard = spMixHexColor(baseCard, isCompLight ? "#000000" : "#ffffff", isCompLight ? 0.03 : 0.045);
          }
        }
        const glassPct = Math.min(94, Math.max(78, Number(activeApp.glassOpacity) || 86));
        const compBgCss = hasWpActive
          ? (typeof teHexToRgba === "function" ? teHexToRgba(baseCard, glassPct) : `color-mix(in srgb, ${baseCard} ${glassPct}%, transparent)`)
          : baseCard;
        const compBrdCss = hasThemePalette && themeVars && themeVars.borderColor
          ? `color-mix(in srgb, ${themeVars.fgColor || (isCompLight ? "#141418" : "#ececef")} ${isCompLight ? "14%" : "15%"}, ${themeVars.borderColor})`
          : (isCompLight ? "rgba(31, 30, 29, 0.16)" : "rgba(250, 249, 245, 0.16)");
        const compBlurVal = hasWpActive ? Math.max(10, Number(activeApp.glassBlur) || 16) : 14;
        const rawCompRad = Number(usObj.composerRadius) > 0
          ? Number(usObj.composerRadius)
          : (compStyle === "claude-code" ? 14 : (compStyle === "codex" ? 20 : (compStyle === "opencode" ? 6 : 12)));
        const chipRadVal = activeApp.corners && activeApp.corners.mode === "linked" && Number(activeApp.corners.all) === 0
          ? 0
          : Math.max(6, Math.min(11, Math.round(rawCompRad * 0.72)));
        const compGradImg = activeApp.presetId === "liquid-glass"
          ? (isCompLight
              ? "linear-gradient(180deg, rgba(255, 255, 255, 0.36) 0%, rgba(255, 255, 255, 0.08) 100%)"
              : "linear-gradient(180deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.02) 100%)")
          : "none";
        rootEl.style.setProperty("--rx-comp-bg", compBgCss);
        rootEl.style.setProperty("--rx-comp-bg-image", compGradImg);
        rootEl.style.setProperty("--rx-comp-border", compBrdCss);
        rootEl.style.setProperty("--rx-comp-blur", `${compBlurVal}px`);
        rootEl.style.setProperty("--rx-comp-radius", `${chipRadVal}px`);
      } catch (_e) {}
      if (prevAppTheme !== appNext && state.liveEdits && state.liveEdits.length > 0) {
        syncLiveChatBubbles(false);
      }

      // Sync accent color (respect explicit Claude Studio theme accent when on native Antigravity)
      let accent = (activeApp && (activeApp.customAccent || activeApp.presetId === "custom"))
        ? (activeApp.accentColor || "#3b82f6")
        : ((preset && preset.vars && preset.vars.accentColor) || (activeApp && activeApp.accentColor) || "#3b82f6");
      if (!activeApp.customAccent && activeApp.presetId === "native") {
        if (sui.windowTheme === "claude-dark") accent = "#d97757";
        else if (sui.windowTheme === "claude-light") accent = "#c15f3c";
      }
      rootEl.style.setProperty("--rx-accent", accent);
      const l = parseColorLightness(accent);
      rootEl.style.setProperty("--rx-accent-fg", l !== null && l > 0.62 ? "#141413" : "#ffffff");

      // Sync selected UI & Mono fonts (including custom system fonts and Claude Code fonts) into Rudex Studio & widget
      const ty = activeApp.typography || {};
      const uiStack = typeof teResolveFontStack === "function"
        ? teResolveFontStack("ui", ty.uiFont, ty.uiFontCustom)
        : ((spFindFont("ui", ty.uiFont) || {}).stack || "");
      const monoStack = typeof teResolveFontStack === "function"
        ? teResolveFontStack("mono", ty.monoFont, ty.monoFontCustom)
        : ((spFindFont("mono", ty.monoFont) || {}).stack || "");
      if (uiStack) {
        rootEl.style.setProperty("--rx-font-ui", uiStack);
      } else {
        rootEl.style.removeProperty("--rx-font-ui");
      }
      if (monoStack) {
        rootEl.style.setProperty("--rx-font-mono", monoStack);
      } else {
        rootEl.style.removeProperty("--rx-font-mono");
      }
    }
  }

  function syncTranslatorGreeting(cfg) {
    if (translator && typeof translator.setGreetingConfig === "function") {
      try { translator.setGreetingConfig(spNormalizeGreeting(cfg)); } catch (_e) {}
    }
  }

  function updateToastNodes() {
    if (!modalMountEl || typeof modalMountEl.querySelectorAll !== "function") return;
    const nodes = modalMountEl.querySelectorAll('[data-role="toast"]');
    const hasMsg = Boolean(state.toastMsg);
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (!el) continue;
      el.textContent = state.toastMsg;
      if (el.classList) {
        el.classList.toggle("is-err", Boolean(state.toastError));
        el.classList.toggle("is-visible", hasMsg);
      } else {
        el.className = "toast-text" + (state.toastError ? " is-err" : "");
      }
    }
  }

  function setToast(msg, isErr) {
    state.toastMsg = msg || "";
    state.toastError = Boolean(isErr);
    if (toastTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(toastTimer);
    }
    updateToastNodes();
    if (msg && win && typeof win.setTimeout === "function") {
      toastTimer = win.setTimeout(() => {
        state.toastMsg = "";
        state.toastError = false;
        updateToastNodes();
      }, 3200);
    }
  }

  function computeSettingsStateSig(remote) {
    try {
      const s = remote && remote.settings ? remote.settings : remote;
      const qa = remote && remote.quotaAlerts ? remote.quotaAlerts : null;
      return JSON.stringify({ l: remote && remote.locale, s, qa });
    } catch (_e) {
      return "";
    }
  }

  function saveSettingsPatch(patch) {
    const seq = ++state.settingsSaveSeq;
    const prevThinkRu = Boolean(state.settings.thinkingInRussian);
    const prevWorkLogRu = Boolean(state.settings.workLogInRussian);
    Object.assign(state.settings, patch);
    if (patch.miniFields) {
      state.settings.miniFields = normalizeMiniFields(patch.miniFields);
    }
    if (patch.dockPosition) {
      state.settings.dockPosition = normalizeDockPosition(patch.dockPosition);
    }
    if (patch.viewMode) {
      state.settings.viewMode = normalizeViewMode(patch.viewMode);
    }
    if (patch.greeting) {
      state.settings.greeting = spCloneGreeting(patch.greeting);
      state.greetingDraft = spCloneGreeting(state.settings.greeting);
      syncTranslatorGreeting(state.settings.greeting);
    }
    if (patch.appearance) {
      state.settings.appearance = spCloneAppearance(patch.appearance);
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.appearanceDirty = false;
      applyThemeToHost(state.settings.appearance);
    }
    if (patch.studioUi) {
      state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, patch.studioUi));
    }
    if (Array.isArray(patch.customLabels)) {
      state.settings.customLabels = patch.customLabels.slice(0, 120);
      if (translator && typeof translator.setCustomLabels === "function") {
        try { translator.setCustomLabels(state.settings.customLabels); } catch (_e) {}
      }
    }
    renderStructure();
    if (typeof patch.thinkingInRussian === "boolean" && patch.thinkingInRussian !== prevThinkRu) {
      if (state.settings.thinkingInRussian) scanThinkingBlocks(true);
      else restoreThinkingNodesByKind("thinking");
    }
    if (typeof patch.workLogInRussian === "boolean" && patch.workLogInRussian !== prevWorkLogRu) {
      if (state.settings.workLogInRussian) scanThinkingBlocks(true);
      else restoreThinkingNodesByKind("worklog");
    }
    return invokeIpc("agy-studio:save-settings", patch).then((res) => {
      if (state.destroyed || seq !== state.settingsSaveSeq) return res;
      if (res && res.settings) {
        const sig = computeSettingsStateSig(res);
        if (sig && sig !== state.lastRemoteStateSig) {
          applyRemoteState(res, false);
        }
      }
      return res;
    });
  }

  function isControlActivelyFocused(attrName, prefix) {
    try {
      const ae = (shadowRoot && shadowRoot.activeElement) || (doc && doc.activeElement) || null;
      if (!ae || typeof ae.getAttribute !== "function") return false;
      const v = ae.getAttribute(attrName);
      if (v === null) return false;
      if (prefix) return String(v).startsWith(prefix);
      return true;
    } catch (_e) {
      return false;
    }
  }

  function isLimitsLiveEditingNow() {
    if (limitsResizeState || limitsDragState) return true;
    if (Date.now() < limitsLiveEditUntil) return true;
    return isControlActivelyFocused("data-limits-field", "");
  }

  function isStudioUiLiveEditingNow() {
    if (studioResizeState || widgetResizeState) return true;
    if (Date.now() < studioUiLiveEditUntil) return true;
    return isControlActivelyFocused("data-app-field", "studioUi.");
  }

  function isQuotaAutoLiveEditingNow() {
    if (Date.now() < quotaAutoLiveEditUntil) return true;
    return isControlActivelyFocused("data-quota-auto-field", "");
  }

  const debouncedSaveTimers = Object.create(null);
  const debouncedSavePending = Object.create(null);

  function flushDebouncedSettingsSave(kind, patch) {
    const now = Date.now();
    const effectivePatch = patch || debouncedSavePending[kind];
    if (debouncedSaveTimers[kind] && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(debouncedSaveTimers[kind]);
    }
    delete debouncedSaveTimers[kind];
    delete debouncedSavePending[kind];
    if (kind === "limits") {
      if (limitsSaveTimer && win && typeof win.clearTimeout === "function") win.clearTimeout(limitsSaveTimer);
      limitsSaveTimer = null;
      limitsLiveEditUntil = now + 420;
    } else if (kind === "studioUi") {
      if (studioUiSaveTimer && win && typeof win.clearTimeout === "function") win.clearTimeout(studioUiSaveTimer);
      studioUiSaveTimer = null;
      studioUiLiveEditUntil = now + 420;
    } else if (kind === "quotaAuto") {
      if (quotaAutoSaveTimer && win && typeof win.clearTimeout === "function") win.clearTimeout(quotaAutoSaveTimer);
      quotaAutoSaveTimer = null;
      quotaAutoLiveEditUntil = now + 420;
    }
    if (!effectivePatch) return Promise.resolve({ ok: true });
    const seq = ++state.settingsSaveSeq;
    return invokeIpc("agy-studio:save-settings", effectivePatch).then((res) => {
      if (state.destroyed || seq !== state.settingsSaveSeq) return res;
      if (res && res.settings) {
        const sig = computeSettingsStateSig(res);
        if (sig) state.lastRemoteStateSig = sig;
      }
      return res;
    });
  }

  function flushAllDebouncedSettingsSaves() {
    const kinds = Object.keys(debouncedSavePending);
    for (let i = 0; i < kinds.length; i += 1) {
      flushDebouncedSettingsSave(kinds[i]);
    }
  }

  function scheduleDebouncedSettingsSave(kind, patch, delayMs) {
    const now = Date.now();
    const wait = typeof delayMs === "number" ? delayMs : 160;
    if (kind === "limits") limitsLiveEditUntil = now + Math.max(850, wait + 600);
    else if (kind === "studioUi") studioUiLiveEditUntil = now + Math.max(850, wait + 600);
    else if (kind === "quotaAuto") quotaAutoLiveEditUntil = now + Math.max(850, wait + 600);

    debouncedSavePending[kind] = patch;
    if (debouncedSaveTimers[kind] && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(debouncedSaveTimers[kind]);
    }
    if (win && typeof win.setTimeout === "function") {
      const tid = win.setTimeout(() => {
        delete debouncedSaveTimers[kind];
        if (kind === "limits") limitsSaveTimer = null;
        else if (kind === "studioUi") studioUiSaveTimer = null;
        else if (kind === "quotaAuto") quotaAutoSaveTimer = null;
        flushDebouncedSettingsSave(kind);
      }, wait);
      debouncedSaveTimers[kind] = tid;
      if (kind === "limits") limitsSaveTimer = tid;
      else if (kind === "studioUi") studioUiSaveTimer = tid;
      else if (kind === "quotaAuto") quotaAutoSaveTimer = tid;
    } else {
      flushDebouncedSettingsSave(kind, patch);
    }
  }

  let inspectorLiveEditUntil = 0;
  let inspectorPendingSaveSeq = 0;
  let inspectorLastNudgeAt = 0;

  function isInspectorControlActive() {
    if (inspectorDragMoveState || inspSaveTimer || inspectorPendingSaveSeq > 0 || Date.now() < inspectorLiveEditUntil) {
      return true;
    }
    if (
      isControlActivelyFocused("data-insp-range") ||
      isControlActivelyFocused("data-insp-num") ||
      isControlActivelyFocused("data-insp-style") ||
      isControlActivelyFocused("data-insp-hex-input")
    ) {
      return true;
    }
    try {
      const ae = (shadowRoot && shadowRoot.activeElement) || (doc && doc.activeElement) || null;
      return Boolean(ae && pickerMountEl && typeof pickerMountEl.contains === "function" && pickerMountEl.contains(ae));
    } catch (_e) {
      return false;
    }
  }

  function applyRemoteState(remote, forceRender) {
    if (!remote || typeof remote !== "object") return;
    const sig = computeSettingsStateSig(remote);
    if (!forceRender && sig && sig === state.lastRemoteStateSig) return;
    if (sig) state.lastRemoteStateSig = sig;

    const editingLimits = !forceRender && isLimitsLiveEditingNow();
    const editingStudioUi = !forceRender && isStudioUiLiveEditingNow();
    const editingQuotaAuto = !forceRender && isQuotaAutoLiveEditingNow();
    const editingInspector = isInspectorControlActive();
    const prevThinkRu = Boolean(state.settings.thinkingInRussian);
    const prevWorkLogRu = Boolean(state.settings.workLogInRussian);
    if (typeof remote.appZoomSupported === "boolean") {
      state.appZoomSupported = remote.appZoomSupported;
    }
    if (remote.locale === "ru" || remote.locale === "en") {
      state.locale = remote.locale;
    }
    const rawSettings = remote.settings && typeof remote.settings === "object" ? remote.settings : remote;
    if (rawSettings && typeof rawSettings === "object") {
      if (typeof rawSettings.panelEnabled === "boolean") state.settings.panelEnabled = rawSettings.panelEnabled;
      if (typeof rawSettings.pinned === "boolean") state.settings.pinned = rawSettings.pinned;
      if (rawSettings.viewMode) state.settings.viewMode = normalizeViewMode(rawSettings.viewMode);
      if (rawSettings.layoutMode === "floating" || rawSettings.layoutMode === "docked") {
        state.settings.layoutMode = rawSettings.layoutMode;
      }
      if (rawSettings.dockPosition) state.settings.dockPosition = normalizeDockPosition(rawSettings.dockPosition);
      if ("floatX" in rawSettings) {
        state.settings.floatX = typeof rawSettings.floatX === "number" && Number.isFinite(rawSettings.floatX) ? rawSettings.floatX : null;
      }
      if ("floatY" in rawSettings) {
        state.settings.floatY = typeof rawSettings.floatY === "number" && Number.isFinite(rawSettings.floatY) ? rawSettings.floatY : null;
      }
      if (rawSettings.miniFields) state.settings.miniFields = normalizeMiniFields(rawSettings.miniFields);
      if (typeof rawSettings.trackHistory === "boolean") state.settings.trackHistory = rawSettings.trackHistory;
      if (typeof rawSettings.personaStrictMode === "boolean") state.settings.personaStrictMode = rawSettings.personaStrictMode;
      if (typeof rawSettings.thinkingInRussian === "boolean") state.settings.thinkingInRussian = rawSettings.thinkingInRussian;
      if (typeof rawSettings.workLogInRussian === "boolean") state.settings.workLogInRussian = rawSettings.workLogInRussian;
      if (typeof rawSettings.thinkingTranslatorUrl === "string") state.settings.thinkingTranslatorUrl = rawSettings.thinkingTranslatorUrl;
      if (typeof rawSettings.composerDraftsEnabled === "boolean") state.settings.composerDraftsEnabled = rawSettings.composerDraftsEnabled;
      if (typeof rawSettings.inputHistoryEnabled === "boolean") state.settings.inputHistoryEnabled = rawSettings.inputHistoryEnabled;
      if (typeof rawSettings.autoCheckUpdates === "boolean") state.settings.autoCheckUpdates = rawSettings.autoCheckUpdates;
      if (Array.isArray(rawSettings.customPresets)) state.settings.customPresets = normalizeCustomPresets(rawSettings.customPresets);
      if (rawSettings.greeting && typeof rawSettings.greeting === "object") {
        state.settings.greeting = spCloneGreeting(rawSettings.greeting);
        if (!state.appearanceDirty) {
          state.greetingDraft = spCloneGreeting(state.settings.greeting);
          syncTranslatorGreeting(state.settings.greeting);
        }
      }
      if (rawSettings.appearance && typeof rawSettings.appearance === "object" && !editingInspector) {
        state.settings.appearance = spCloneAppearance(rawSettings.appearance);
        if (!state.appearanceDirty) {
          state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        }
        if (!state.appearanceLivePreview) {
          applyThemeToHost(state.settings.appearance);
        }
      }
      if (Array.isArray(rawSettings.appearanceProfiles)) {
        state.settings.appearanceProfiles = rawSettings.appearanceProfiles.slice(0, 12);
      }
      if (rawSettings.studioUi && typeof rawSettings.studioUi === "object" && !editingStudioUi) {
        state.settings.studioUi = spNormalizeStudioUi(rawSettings.studioUi);
      }
      if (Array.isArray(rawSettings.customLabels)) {
        state.settings.customLabels = rawSettings.customLabels.slice(0, 120);
        if (translator && typeof translator.setCustomLabels === "function") {
          try { translator.setCustomLabels(state.settings.customLabels); } catch (_e) {}
        }
      }
      if (rawSettings.limitsWidget && typeof rawSettings.limitsWidget === "object" && !editingLimits) {
        state.settings.limitsWidget = typeof rv5NormalizeLimitsWidget === "function"
          ? rv5NormalizeLimitsWidget(rawSettings.limitsWidget)
          : Object.assign({}, state.settings.limitsWidget, rawSettings.limitsWidget);
      }
      if (rawSettings.keybindings && typeof rawSettings.keybindings === "object") {
        state.settings.keybindings = typeof rv5NormalizeKeybindings === "function"
          ? rv5NormalizeKeybindings(rawSettings.keybindings)
          : Object.assign({}, state.settings.keybindings, rawSettings.keybindings);
      }
      if (typeof rawSettings.zenMode === "boolean") {
        state.settings.zenMode = rawSettings.zenMode;
      }
      if (rawSettings.liveEditInline && typeof rawSettings.liveEditInline === "object") {
        const prevUrgent = Boolean(state.settings.liveEditInline && state.settings.liveEditInline.urgentIntercept);
        state.settings.liveEditInline = Object.assign({}, state.settings.liveEditInline, rawSettings.liveEditInline);
        if (typeof rawSettings.liveEditInline.urgentIntercept === "boolean" && rawSettings.liveEditInline.urgentIntercept !== prevUrgent) {
          state.inlineUrgent = rawSettings.liveEditInline.urgentIntercept;
        }
      }
      if (rawSettings.agentProfileDefault && typeof rawSettings.agentProfileDefault === "object") {
        state.settings.agentProfileDefault = typeof rv5NormalizeAgentProfile === "function"
          ? rv5NormalizeAgentProfile(rawSettings.agentProfileDefault)
          : Object.assign({}, state.settings.agentProfileDefault, rawSettings.agentProfileDefault);
      }
      if (Array.isArray(rawSettings.customAgentPresets)) {
        state.settings.customAgentPresets = rawSettings.customAgentPresets.slice(0, 20);
      }
      if (rawSettings.quotaAutomation && typeof rawSettings.quotaAutomation === "object" && !editingQuotaAuto) {
        state.settings.quotaAutomation = typeof rv5NormalizeQuotaAutomation === "function"
          ? rv5NormalizeQuotaAutomation(rawSettings.quotaAutomation)
          : Object.assign({}, state.settings.quotaAutomation, rawSettings.quotaAutomation);
      }
      if (rawSettings.optimization && typeof rawSettings.optimization === "object") {
        state.settings.optimization = typeof sanitizeOptimizationSettings === "function"
          ? sanitizeOptimizationSettings(rawSettings.optimization)
          : Object.assign({}, state.settings.optimization, rawSettings.optimization);
        const optCtrl = ensureRudexOptimizer();
        if (optCtrl) optCtrl.apply(state.settings.optimization, state.locale);
      }
    }
    if (remote.quotaAlerts && typeof remote.quotaAlerts === "object") {
      state.quotaAlerts = {
        waitingChats: remote.quotaAlerts.waitingChats && typeof remote.quotaAlerts.waitingChats === "object"
          ? Object.assign({}, remote.quotaAlerts.waitingChats)
          : {},
      };
    }
    if (remote.chat && remote.chat.agentProfile && typeof remote.chat.agentProfile === "object") {
      state.chatAgentProfile = typeof rv5NormalizeAgentProfile === "function"
        ? rv5NormalizeAgentProfile(remote.chat.agentProfile)
        : Object.assign({}, remote.chat.agentProfile);
    } else if (!state.chatAgentProfile || !state.chatAgentProfile.enabled) {
      if (state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats && state.settings.agentProfileDefault.enabled) {
        state.chatAgentProfile = Object.assign({}, state.settings.agentProfileDefault);
      }
    }
    if (remote.quotaSummary && typeof remote.quotaSummary === "object") {
      state.quotaSummary = remote.quotaSummary;
    }
    if (typeof remote.personaFilePath === "string" && remote.personaFilePath) state.personaFilePath = remote.personaFilePath;
    if (editingLimits || editingStudioUi || editingQuotaAuto || editingInspector) {
      syncTheme();
      if (!editingLimits) renderLimitsWidgetMount();
    } else {
      renderStructure();
    }
    if (state.settings.thinkingInRussian !== prevThinkRu) {
      if (state.settings.thinkingInRussian) scanThinkingBlocks(true);
      else restoreThinkingNodesByKind("thinking");
    }
    if (state.settings.workLogInRussian !== prevWorkLogRu) {
      if (state.settings.workLogInRussian) scanThinkingBlocks(true);
      else restoreThinkingNodesByKind("worklog");
    }
  }

  function serializeChatTelemetry(tel) {
    return {
      lastAvgTps: Math.max(0, Math.round(Number(tel.lastAvgTps) || 0)),
      peakTps: Math.max(0, Math.round(Number(tel.peakTps) || 0)),
      lastDurSec: typeof tel.lastDurSec === "number" && Number.isFinite(tel.lastDurSec) && tel.lastDurSec > 0 ? Math.round(tel.lastDurSec * 100) / 100 : 0,
      lastThinkingSec: typeof tel.lastThinkingSec === "number" && Number.isFinite(tel.lastThinkingSec) && tel.lastThinkingSec > 0 ? Math.round(tel.lastThinkingSec * 100) / 100 : 0,
      respTokens: Math.max(0, Math.round(Number(tel.respTokens) || 0)),
      chatTokens: Math.max(0, Math.round(Number(tel.chatTokens) || 0)),
      exactRespTokens: Math.max(0, Math.round(Number(tel.exactRespTokens) || 0)),
      exactContextTokens: Math.max(0, Math.round(Number(tel.exactContextTokens) || 0)),
      exactCacheTokens: Math.max(0, Math.round(Number(tel.exactCacheTokens) || 0)),
      modelName: String(tel.modelName || "").slice(0, 96),
      samples: Array.isArray(tel.samples) ? tel.samples.slice(-24) : [],
      history: Array.isArray(tel.history) ? tel.history.slice(0, 8) : [],
    };
  }

  function cleanTitleStr(raw) {
    return String(raw || "")
      .replace(/\s*[-—|]\s*Antigravity.*$/i, "")
      .replace(/\s*[-—|·]\s*(?:Outside of Project|Вне проекта)\b.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectChatTitle() {
    if (!doc) return "";
    try {
      const ignored = /^(antigravity|new chat|новый чат|untitled)$/i;
      if (typeof doc.querySelector === "function") {
        const titleEl = doc.querySelector('[data-testid="conversation-title"], [data-testid="chat-title"], main header h1, main header h2');
        const t1 = titleEl && titleEl.textContent ? cleanTitleStr(titleEl.textContent) : "";
        if (t1 && !ignored.test(t1)) return t1.slice(0, 60);
        const navEl = doc.querySelector('[aria-current="page"], [aria-selected="true"], [data-active="true"], [data-state="active"]');
        if (navEl && typeof navEl.getAttribute === "function" && (!hostEl || (typeof hostEl.contains !== "function" || !hostEl.contains(navEl)))) {
          const t2 = cleanTitleStr(navEl.getAttribute("title") || navEl.textContent || "");
          if (t2 && !ignored.test(t2)) return t2.slice(0, 60);
        }
      }
      const dt = cleanTitleStr(doc.title || "");
      if (dt && !ignored.test(dt)) return dt.slice(0, 60);
    } catch (_e) {}
    return "";
  }

  function extractKeyPartsFromEl(el) {
    if (!el || typeof el.getAttribute !== "function") return { uuid: "", stable: "" };
    const attrs = ["data-conversation-id", "data-cascade-id", "data-session-id", "data-chat-id", "href", "id", "data-testid"];
    let stable = "";
    for (let a = 0; a < attrs.length; a += 1) {
      const v = el.getAttribute(attrs[a]) || "";
      if (!v) continue;
      const u = extractUuid(v);
      if (u) return { uuid: u, stable: u };
      if (!stable && (attrs[a] === "href" || attrs[a] === "id" || attrs[a].startsWith("data-"))) {
        stable = attrs[a] + "=" + v;
      }
    }
    return { uuid: "", stable };
  }

  function isUiOverlayNode(el) {
    if (!el) return false;
    if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) return true;
    if (typeof el.closest === "function" && el.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="tablist"]')) {
      return true;
    }
    return false;
  }

  function findActiveSidebarKeyParts(activeTitle) {
    if (!doc || typeof doc.querySelectorAll !== "function") return { uuid: "", stable: "" };
    try {
      const activeNodes = doc.querySelectorAll('[aria-current="page"], [aria-current="true"], [aria-selected="true"], [data-active="true"], [data-selected="true"], [data-state="active"]');
      let stable = "";
      for (let i = 0; activeNodes && i < activeNodes.length; i += 1) {
        const el = activeNodes[i];
        if (!el || isUiOverlayNode(el)) continue;
        const pSelf = extractKeyPartsFromEl(el);
        if (pSelf.uuid) return pSelf;
        if (!stable && pSelf.stable) stable = pSelf.stable;
        if (typeof el.closest === "function") {
          const anc = el.closest('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id], a[href]');
          if (anc && !isUiOverlayNode(anc)) {
            const pAnc = extractKeyPartsFromEl(anc);
            if (pAnc.uuid) return pAnc;
            if (!stable && pAnc.stable) stable = pAnc.stable;
          }
        }
        if (typeof el.querySelector === "function") {
          const desc = el.querySelector('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id], a[href]');
          if (desc && !isUiOverlayNode(desc)) {
            const pDesc = extractKeyPartsFromEl(desc);
            if (pDesc.uuid) return pDesc;
          }
        }
      }

      const mainArea = typeof doc.querySelector === "function"
        ? doc.querySelector('main, [data-testid="chat-container"], [data-testid="conversation-view"]')
        : null;
      if (mainArea && typeof mainArea.querySelector === "function") {
        const mainConv = mainArea.querySelector('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id]');
        if (mainConv && !isUiOverlayNode(mainConv)) {
          const pMain = extractKeyPartsFromEl(mainConv);
          if (pMain.uuid) return pMain;
          if (!stable && pMain.stable) stable = pMain.stable;
        }
      }

      const sideRows = doc.querySelectorAll('aside [data-conversation-id], aside [data-cascade-id], aside [data-session-id], aside [data-chat-id], nav [data-conversation-id], nav [data-cascade-id], nav [data-session-id], nav [data-chat-id], [data-testid="sidebar"] [data-conversation-id], [data-testid="sidebar"] [data-cascade-id], [data-testid="sidebar"] [data-session-id], [data-testid="sidebar"] [data-chat-id]');
      const rows = (sideRows && sideRows.length > 0)
        ? sideRows
        : doc.querySelectorAll('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id]');
      if (rows && rows.length > 0) {
        for (let i = 0; i < rows.length; i += 1) {
          const r = rows[i];
          if (!r || isUiOverlayNode(r)) continue;
          const cls = typeof r.className === "string" ? r.className : "";
          const ariaSel = typeof r.getAttribute === "function" ? (r.getAttribute("aria-selected") || r.getAttribute("data-active") || r.getAttribute("data-state") || "") : "";
          if (/\b(?:active|selected|current)\b/i.test(cls) || ariaSel === "true" || ariaSel === "active") {
            const pCls = extractKeyPartsFromEl(r);
            if (pCls.uuid) return pCls;
          }
        }
        if (activeTitle) {
          const normActiveTitle = cleanTitleStr(activeTitle).toLowerCase();
          if (normActiveTitle) {
            const titleMatches = [];
            for (let i = 0; i < Math.min(rows.length, 40); i += 1) {
              const r = rows[i];
              if (!r || isUiOverlayNode(r)) continue;
              const rawTxt = (r.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
              if (rawTxt && rawTxt.includes(normActiveTitle)) titleMatches.push({ r, rawTxt });
            }
            if (titleMatches.length === 1) {
              const pTm = extractKeyPartsFromEl(titleMatches[0].r);
              if (pTm.uuid) return pTm;
            } else if (titleMatches.length > 1) {
              const justNowMatch = titleMatches.find((m) => /\b(?:just now|now)\b|сейчас/i.test(m.rawTxt));
              if (justNowMatch) {
                const pJn = extractKeyPartsFromEl(justNowMatch.r);
                if (pJn.uuid) return pJn;
              }
            }
          }
        }
        if (win && typeof win.getComputedStyle === "function" && rows.length >= 2) {
          // Prefer non-hovered explicitly marked active row first
          for (let i = 0; i < Math.min(rows.length, 40); i += 1) {
            const r = rows[i];
            if (!r || isUiOverlayNode(r)) continue;
            if (typeof r.getAttribute === "function" && r.getAttribute("data-rudex-sidebar-surface") === "active") {
              const pAct = extractKeyPartsFromEl(r);
              if (pAct.uuid) return pAct;
            }
          }
          const bgCounts = new Map();
          const rowStyles = [];
          for (let i = 0; i < Math.min(rows.length, 25); i += 1) {
            const r = rows[i];
            if (!r || isUiOverlayNode(r)) continue;
            let hovered = false;
            try { hovered = typeof r.matches === "function" && r.matches(":hover"); } catch (_e) {}
            const bg = hovered ? "rgba(0, 0, 0, 0)" : String(win.getComputedStyle(r).backgroundColor || "").trim();
            rowStyles.push({ r, bg, hovered });
            bgCounts.set(bg, (bgCounts.get(bg) || 0) + 1);
          }
          let majorityBg = "";
          let majorityCnt = 0;
          bgCounts.forEach((cnt, bg) => {
            if (cnt > majorityCnt) { majorityCnt = cnt; majorityBg = bg; }
          });
          const distinctActive = [];
          for (let i = 0; i < rowStyles.length; i += 1) {
            if (rowStyles[i].hovered) continue;
            const bg = rowStyles[i].bg;
            if (!bg || bg === majorityBg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") continue;
            distinctActive.push(rowStyles[i].r);
          }
          if (distinctActive.length === 1) {
            const pBg = extractKeyPartsFromEl(distinctActive[0]);
            if (pBg.uuid) return pBg;
          }
        }
      }
      return { uuid: "", stable };
    } catch (_e) {
      return { uuid: "", stable: "" };
    }
  }

  function findExplicitActiveSidebarUuid(activeTitle) {
    if (!doc || typeof doc.querySelectorAll !== "function") return "";
    try {
      // 1. Explicitly marked active sidebar/nav conversation rows (never triggers on blank New Chat where no chat row is active)
      const activeNodes = doc.querySelectorAll('[aria-current="page"], [aria-current="true"], [aria-selected="true"], [data-active="true"], [data-selected="true"], [data-state="active"], [data-rudex-sidebar-surface="active"], aside [class*="bg-sidebar-accent"], nav [class*="bg-sidebar-accent"]');
      for (let i = 0; activeNodes && i < activeNodes.length; i += 1) {
        const el = activeNodes[i];
        if (!el || isUiOverlayNode(el)) continue;
        const pSelf = extractKeyPartsFromEl(el);
        if (pSelf.uuid) return pSelf.uuid;
        if (typeof el.closest === "function") {
          const anc = el.closest('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id], a[href]');
          if (anc && !isUiOverlayNode(anc)) {
            const pAnc = extractKeyPartsFromEl(anc);
            if (pAnc.uuid) return pAnc.uuid;
          }
        }
        if (typeof el.querySelector === "function") {
          const desc = el.querySelector('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id], a[href]');
          if (desc && !isUiOverlayNode(desc)) {
            const pDesc = extractKeyPartsFromEl(desc);
            if (pDesc.uuid) return pDesc.uuid;
          }
        }
      }
      // 2. Non-empty conversation title already rendered in header -> match unique sidebar row BEFORE messages finish hydrating!
      if (activeTitle) {
        const normTitle = cleanTitleStr(activeTitle).toLowerCase();
        if (normTitle) {
          const rows = doc.querySelectorAll('aside [data-conversation-id], aside [data-cascade-id], aside [data-session-id], aside [data-chat-id], nav [data-conversation-id], nav [data-cascade-id], nav [data-session-id], nav [data-chat-id], [data-testid="sidebar"] [data-conversation-id], [data-testid="sidebar"] [data-cascade-id], [data-testid="sidebar"] [data-session-id], [data-testid="sidebar"] [data-chat-id]');
          const matches = [];
          for (let i = 0; rows && i < Math.min(rows.length, 40); i += 1) {
            const r = rows[i];
            if (!r || isUiOverlayNode(r)) continue;
            const rawTxt = (r.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
            if (rawTxt && rawTxt.includes(normTitle)) matches.push({ r, rawTxt });
          }
          if (matches.length === 1) {
            const pTm = extractKeyPartsFromEl(matches[0].r);
            if (pTm.uuid) return pTm.uuid;
          } else if (matches.length > 1) {
            const justNowMatch = matches.find((m) => /\b(?:just now|now)\b|сейчас/i.test(m.rawTxt));
            if (justNowMatch) {
              const pJn = extractKeyPartsFromEl(justNowMatch.r);
              if (pJn.uuid) return pJn.uuid;
            }
          }
        }
      }
    } catch (_e) {}
    return "";
  }

  function detectChatIdentity(snap) {
    let rawUrl = "";
    try {
      if (win && win.location) {
        rawUrl = String(win.location.pathname || "") + String(win.location.search || "") + String(win.location.hash || "");
      }
    } catch (_e) {}
    const cleanUrl = rawUrl.replace(/([?&#](?:token|bootstrap|bootstrapToken)=[^&#]*)/gi, "");
    const title = detectChatTitle();

    const urlUuid = extractUuid(cleanUrl);
    if (urlUuid) return { key: urlUuid, isNew: false, title };

    if (snap.userMsgCount === 0 && snap.respCount === 0) {
      // On cold boot or chat switch, sidebar active UUID / header title often appear 300-1500ms BEFORE chat messages finish hydrating!
      const explicitSideUuid = findExplicitActiveSidebarUuid(title);
      if (explicitSideUuid) return { key: explicitSideUuid, isNew: false, title };
      state.pendingNewSendAt = 0;
      return { key: "__new__", isNew: true, title: "" };
    }

    const domParts = findActiveSidebarKeyParts(title);
    if (domParts.uuid) return { key: domParts.uuid, isNew: false, title };

    if (state.hasActivatedChat && state.activeChatKey === "__new__" && snap.userMsgCount <= 1) {
      const now = Date.now();
      if (!state.pendingNewSendAt) state.pendingNewSendAt = now;
      if (now - state.pendingNewSendAt < 2500) {
        return { key: "__new__", isNew: true, title };
      }
    }

    if (state.hasActivatedChat && state.activeChatKey && state.activeChatKey !== "__new__" && (snap.userMsgCount > 0 || snap.respCount > 0)) {
      if (snap.isGenerating || state.telemetry.isGenerating) {
        return { key: state.activeChatKey, isNew: false, title: title || state.activeChatTitle || "" };
      }
      if (
        UUID_RE.test(state.activeChatKey) &&
        (!title || !state.activeChatTitle || cleanTitleStr(title) === cleanTitleStr(state.activeChatTitle))
      ) {
        return { key: state.activeChatKey, isNew: false, title: title || state.activeChatTitle || "" };
      }
    }

    const cleanPath = cleanUrl.split(/[?#]/)[0] || "/";
    const fpSource = `${cleanPath}||${domParts.stable}||${snap.firstUserNorm}`;
    return { key: "chat-" + hashDjb2(fpSource), isNew: false, title };
  }

  function detectModelName() {
    if (!doc || typeof doc.querySelector !== "function") return "";
    try {
      const el = doc.querySelector('[data-testid="model-selector-trigger"]');
      const raw = el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim() : "";
      return raw.slice(0, 96);
    } catch (_e) {
      return "";
    }
  }

  function detectContextLabel() {
    if (!doc || typeof doc.querySelector !== "function") return "";
    try {
      const el = doc.querySelector('[data-testid="context-usage-indicator"]');
      return el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim().slice(0, 28) : "";
    } catch (_e) {
      return "";
    }
  }

  function collectDomTelemetry() {
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return { isGenerating: false, hasCancelBtn: false, isThinking: false, thinkingSec: 0, respFloatTok: 0, respTokens: 0, chatTokens: 0, userMsgCount: 0, respCount: 0, lastResp: null, firstUserNorm: "", modelName: "", contextLabel: "" };
    }
    try {
      const rawResponses = doc.querySelectorAll('[data-testid="agent-response"]');
      const rawUserMsgs = doc.querySelectorAll('[data-testid="user-message-content"]');
      const responses = [];
      for (let i = 0; rawResponses && i < rawResponses.length; i += 1) {
        const r = rawResponses[i];
        if (!r || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(r))) continue;
        if (isHiddenAncestor(r, doc.body)) continue;
        responses.push(r);
      }
      const userMsgs = [];
      for (let i = 0; rawUserMsgs && i < rawUserMsgs.length; i += 1) {
        const u = rawUserMsgs[i];
        if (!u || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(u))) continue;
        if (isHiddenAncestor(u, doc.body)) continue;
        userMsgs.push(u);
      }
      const respCount = responses.length;
      const userMsgCount = userMsgs.length;
      const lastResp = respCount > 0 ? responses[respCount - 1] : null;

      let hasCancelBtn = false;
      if (typeof doc.querySelectorAll === "function") {
        const cancelEls = doc.querySelectorAll('[data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"]');
        for (let i = 0; cancelEls && i < cancelEls.length; i += 1) {
          const cb = cancelEls[i];
          if (!cb || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(cb))) continue;
          if (!isHiddenAncestor(cb, doc.body)) {
            hasCancelBtn = true;
            break;
          }
        }
      }
      let isGenerating = hasCancelBtn;
      if (!isGenerating && typeof doc.querySelectorAll === "function") {
        const pendingBtns = doc.querySelectorAll('[data-testid="send-button-loading"], [data-testid="send-button-pending"]');
        for (let i = 0; pendingBtns && i < pendingBtns.length; i += 1) {
          const pb = pendingBtns[i];
          if (!pb || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(pb))) continue;
          if (!isHiddenAncestor(pb, doc.body)) {
            isGenerating = true;
            break;
          }
        }
      }
      let isThinking = false;
      if (lastResp) {
        const h6List = typeof lastResp.querySelectorAll === "function"
          ? lastResp.querySelectorAll("h6")
          : (typeof lastResp.querySelector === "function" && lastResp.querySelector("h6") ? [lastResp.querySelector("h6")] : []);
        for (let i = 0; h6List && i < h6List.length; i += 1) {
          if (!h6List[i] || hasMarkdownRootAncestor(h6List[i], lastResp)) continue;
          const txt = (h6List[i].textContent || "").replace(/\s+/g, " ").trim();
          if (!txt || txt.length > 48) continue;
          if (/agent\s+working|агент\s+работает|\bworking\b|\bgenerating\b|\bthinking\b|\bstreaming\b|работает|думает|генерац|выполня|пишет/i.test(txt)) {
            isGenerating = true;
            if (/thinking|думает/i.test(txt)) isThinking = true;
            break;
          }
        }
      }
      if (!isGenerating) {
        const composerBtnSet = new Set();
        const composerBtns = doc.querySelectorAll('form button[aria-label], [data-testid="composer"] button[aria-label], .composer-container button[aria-label], [data-rudex-theme-composer="1"] button[aria-label], [data-rudex-theme-composer="1"] button[title], button[data-testid="input-cancel-button"]');
        for (let i = 0; composerBtns && i < composerBtns.length; i += 1) composerBtnSet.add(composerBtns[i]);
        if (typeof rv5FindNativeComposer === "function") {
          const nativeComp = rv5FindNativeComposer(doc);
          if (nativeComp && nativeComp.container && typeof nativeComp.container.querySelectorAll === "function") {
            const ncBtns = nativeComp.container.querySelectorAll("button[aria-label], button[title]");
            for (let i = 0; ncBtns && i < ncBtns.length; i += 1) composerBtnSet.add(ncBtns[i]);
          }
        }
        for (const b of composerBtnSet) {
          if (!b || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(b))) continue;
          if (isHiddenAncestor(b, doc.body)) continue;
          const lbl = typeof b.getAttribute === "function" ? ((b.getAttribute("aria-label") || b.getAttribute("title") || "").replace(/\s+/g, " ").trim()) : "";
          if (/voice|mic|dictat|record|голос|диктов|запис/i.test(lbl)) continue;
          if (/^(?:stop(?:\s+(?:generat|respond|stream|agent|exec|task)|$)|cancel(?:\s*\(|$|\s+(?:invoc|generat|request|task))|остановить(?:\s+(?:генерац|ответ|агент|работ)|$)|прервать(?:\s+(?:генерац|ответ|работ)|$)|отмен(?:а|ить)(?:\s*\(|$|\s+(?:генерац|запрос)))/i.test(lbl)) {
            isGenerating = true;
            break;
          }
        }
      }

      const visibleRespText = lastResp
        ? (typeof extractVisibleResponseText === "function" ? extractVisibleResponseText(lastResp) : (lastResp.textContent || ""))
        : "";
      const respFloatTok = spTokenEstFloat(visibleRespText);
      const respTokens = respFloatTok > 0 ? Math.max(1, Math.round(respFloatTok)) : 0;
      const thinkingSec = lastResp && typeof extractThinkingSeconds === "function" ? extractThinkingSeconds(lastResp) : 0;
      const chatTokens = telemetryEngine && typeof telemetryEngine.countChatTokens === "function"
        ? telemetryEngine.countChatTokens(userMsgs, responses, lastResp, respTokens)
        : respTokens;
      const firstUserNorm = userMsgCount > 0 ? (userMsgs[0].textContent || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 120) : "";

      return {
        isGenerating,
        hasCancelBtn,
        isThinking,
        thinkingSec,
        respFloatTok,
        respTokens,
        chatTokens,
        userMsgCount,
        respCount,
        lastResp,
        firstUserNorm,
        modelName: detectModelName(),
        contextLabel: detectContextLabel(),
      };
    } catch (_e) {
      return { isGenerating: false, hasCancelBtn: false, isThinking: false, thinkingSec: 0, respFloatTok: 0, respTokens: 0, chatTokens: 0, userMsgCount: 0, respCount: 0, lastResp: null, firstUserNorm: "", modelName: "", contextLabel: "" };
    }
  }

  function flushChatTelemetry(chatKey, title, tel) {
    if (!chatKey || chatKey === "__new__") return;
    tel.dirty = false;
    invokeIpc("agy-studio:save-chat-telemetry", {
      chatKey,
      title: title || "",
      telemetry: serializeChatTelemetry(tel),
    });
  }

  function scheduleTurnTranscriptSync(chatKey, title) {
    if (!UUID_RE.test(String(chatKey || "")) || !win || typeof win.setTimeout !== "function") return;
    if (turnSyncTimer && typeof win.clearTimeout === "function") win.clearTimeout(turnSyncTimer);
    turnSyncTimer = win.setTimeout(() => {
      turnSyncTimer = null;
      if (state.destroyed || state.activeChatKey !== chatKey) return;
      invokeIpc("agy-studio:get-turn-metrics", { chatKey }).then((res) => {
        if (state.destroyed || state.activeChatKey !== chatKey) return;
        if (res && res.ok && telemetryEngine && typeof telemetryEngine.applyExactTranscriptMetrics === "function") {
          telemetryEngine.applyExactTranscriptMetrics(state.telemetry, res);
          flushChatTelemetry(chatKey, title, state.telemetry);
          updateLiveDom();
        }
        invokeIpc("agy-studio:get-quota-summary", { chatKey, forceFresh: true }).then((qs) => {
          if (!state.destroyed && qs) applyQuotaSummary(qs);
        });
      });
    }, 850);
  }

  function switchChatIfNeeded(detected, snap) {
    const needActivate = !state.hasActivatedChat || detected.key !== state.activeChatKey;
    if (!needActivate) {
      if (detected.title && !state.activeChatTitle) {
        state.activeChatTitle = detected.title;
        updateLiveDom();
      }
      return { switched: false, promoted: false };
    }

    const prevKey = state.activeChatKey;
    const prevTitle = state.activeChatTitle;
    const wasActivated = state.hasActivatedChat;
    const tel = state.telemetry;

    const pastColdBoot = Date.now() - (state.initAtMs || 0) > 4000;
    const isPromotion = wasActivated && prevKey === "__new__" && detected.key !== "__new__" && snap.userMsgCount <= 1 && (
      state.pendingNewSendAt > 0 ||
      Date.now() < draftJustSubmittedUntil ||
      state.newChatDraftPersona !== null ||
      state.newChatDraftAgentProfile !== null ||
      (pastColdBoot && (snap.isGenerating || tel.isGenerating))
    );
    state.pendingNewSendAt = 0;

    if (wasActivated && prevKey.startsWith("chat-")) {
      state.lastTempKey = prevKey;
      state.lastTempKeyAt = Date.now();
      state.lastTempFirstUserNorm = tel.firstUserNorm || snap.firstUserNorm || "";
    }

    let migrateFromKey = "";
    if (!isPromotion && !detected.isNew && UUID_RE.test(detected.key) && state.lastTempKey && (Date.now() - state.lastTempKeyAt < 15000)) {
      if (!state.lastTempFirstUserNorm || !snap.firstUserNorm || state.lastTempFirstUserNorm === snap.firstUserNorm) {
        migrateFromKey = state.lastTempKey;
        state.lastTempKey = "";
      }
    }

    if (wasActivated && prevKey !== "__new__" && tel.dirty && !migrateFromKey) {
      flushChatTelemetry(prevKey, prevTitle, tel);
    }

    let promoPayload = null;
    let fallbackPersona = null;
    if (isPromotion) {
      const draft = state.newChatDraftPersona || (state.chatPersona.enabled && state.chatPersona.text.trim()
        ? { personaEnabled: true, personaActivePreset: state.chatPersona.activePreset || "custom", personaText: state.chatPersona.text, personaStrict: state.chatPersona.strict !== false }
        : null);
      const draftAp = state.newChatDraftAgentProfile || (state.chatAgentProfile && state.chatAgentProfile.enabled ? Object.assign({}, state.chatAgentProfile) : null);
      promoPayload = {
        title: detected.title,
        personaEnabled: Boolean(draft && draft.personaEnabled),
        personaActivePreset: draft && draft.personaActivePreset ? draft.personaActivePreset : state.chatPersona.activePreset || "custom",
        personaText: draft && typeof draft.personaText === "string" ? draft.personaText : "",
        personaStrict: draft ? draft.personaStrict !== false : state.chatPersona.strict !== false,
        agentProfile: draftAp,
        telemetry: serializeChatTelemetry(tel),
      };
      if (promoPayload.personaEnabled && promoPayload.personaText.trim()) {
        state.lastPromotedPersona = {
          personaEnabled: true,
          personaActivePreset: promoPayload.personaActivePreset,
          personaText: promoPayload.personaText,
          personaStrict: promoPayload.personaStrict !== false,
          at: Date.now(),
        };
        fallbackPersona = {
          personaEnabled: true,
          personaActivePreset: promoPayload.personaActivePreset,
          personaText: promoPayload.personaText,
          personaStrict: promoPayload.personaStrict !== false,
        };
      }
      if (!snap.isGenerating && !tel.isGenerating && snap.respCount >= 1 && tel.prevRespCount === 0) {
        tel.prevFloatTok = snap.respFloatTok;
        tel.turnStartFloatTok = snap.respFloatTok;
        tel.highWaterBubbleTok = snap.respFloatTok;
      }
      state.newChatDraftPersona = null;
      state.newChatDraftAgentProfile = null;
    } else if (migrateFromKey) {
      if (state.chatPersona.enabled && state.chatPersona.text.trim()) {
        fallbackPersona = {
          personaEnabled: true,
          personaActivePreset: state.chatPersona.activePreset || "custom",
          personaText: state.chatPersona.text,
          personaStrict: state.chatPersona.strict !== false,
        };
      } else if (state.lastPromotedPersona && Date.now() - state.lastPromotedPersona.at < 20000) {
        fallbackPersona = {
          personaEnabled: true,
          personaActivePreset: state.lastPromotedPersona.personaActivePreset || "custom",
          personaText: state.lastPromotedPersona.personaText,
          personaStrict: state.lastPromotedPersona.personaStrict !== false,
        };
      }
    } else {
      state.newChatDraftPersona = null;
      state.newChatDraftAgentProfile = null;
      state.lastPromotedPersona = null;
      if (wasActivated && ((UUID_RE.test(prevKey) && UUID_RE.test(detected.key) && prevKey !== detected.key) || (prevKey !== "__new__" && detected.isNew))) {
        state.agentPopoverOpen = false;
        state.contextPopoverOpen = false;
      }
      removeAllLiveChatBubbleSlots();
      const defAp = state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats && state.settings.agentProfileDefault.enabled
        ? Object.assign({}, state.settings.agentProfileDefault)
        : (typeof rv5NormalizeAgentProfile === "function" ? rv5NormalizeAgentProfile(null) : { enabled: false });
      state.chatAgentProfile = detected.isNew ? defAp : (typeof rv5NormalizeAgentProfile === "function" ? rv5NormalizeAgentProfile(null) : { enabled: false });
      state.hydrationIgnoreUntil = nowHiRes() + 2000;
      const freshTel = spEmptyTelemetry();
      freshTel.respTokens = detected.isNew ? 0 : snap.respTokens;
      freshTel.chatTokens = detected.isNew ? 0 : snap.chatTokens;
      freshTel.prevFloatTok = snap.respFloatTok;
      freshTel.prevRawFloatTok = snap.respFloatTok;
      freshTel.turnStartFloatTok = snap.respFloatTok;
      freshTel.highWaterBubbleTok = snap.respFloatTok;
      freshTel.preTokenAt = nowHiRes();
      freshTel.activeRespEl = snap.lastResp;
      freshTel.prevRespCount = snap.respCount;
      freshTel.prevUserCount = snap.userMsgCount;
      freshTel.firstUserNorm = snap.firstUserNorm;
      freshTel.modelName = snap.modelName;
      freshTel.contextLabel = detected.isNew ? "" : snap.contextLabel;
      if (!detected.isNew && snap.isGenerating) {
        freshTel.isGenerating = true;
        freshTel.phase = "thinking";
      }
      state.telemetry = freshTel;
      state.chatPersona = { enabled: false, activePreset: "custom", text: "", strict: state.settings.personaStrictMode !== false };
      state.draftPersonaText = "";
      state.draftDirty = false;
      state.toastMsg = "";
      state.toastError = false;
    }

    // Cancel any pending debounced draft save from the previous chat so it can NEVER overwrite the incoming chat's draft!
    if (draftSaveTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftSaveTimer);
      draftSaveTimer = null;
    }
    if (draftFollowupTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftFollowupTimer);
      draftFollowupTimer = null;
    }
    draftSaveSeq += 1;

    if (wasActivated && !isPromotion && !migrateFromKey && Date.now() > draftJustSubmittedUntil) {
      flushComposerDraftSync(prevKey, prevTitle, true);
    }

    state.hasActivatedChat = true;
    state.activeChatKey = detected.key;
    state.activeChatTitle = detected.title;
    if (!migrateFromKey) state.userEditedComposerInChat = false;
    lastDraftObsSig = "";
    const seq = ++state.activeChatSwitchSeq;
    renderStructure();
    updateLiveDom();

    // Always invoke activate-chat BEFORE get-composer-draft so migrateFromKey migrates the disk draft key first!
    invokeIpc("agy-studio:activate-chat", {
      chatKey: detected.key,
      title: detected.title,
      promoteFromNew: promoPayload,
      migrateFromKey,
      fallbackPersona,
      draftPersona: detected.isNew ? state.newChatDraftPersona : null,
      draftAgentProfile: detected.isNew ? state.newChatDraftAgentProfile : null,
    }).then((res) => {
      if (state.destroyed || seq !== state.activeChatSwitchSeq || !res || !res.chat) return;
      const rec = res.chat;
      if (typeof res.personaFilePath === "string" && res.personaFilePath) state.personaFilePath = res.personaFilePath;
      if (rec.title && !state.activeChatTitle) state.activeChatTitle = rec.title;
      state.chatPersona = {
        enabled: Boolean(rec.personaEnabled),
        activePreset: rec.personaActivePreset || "custom",
        text: typeof rec.personaText === "string" ? rec.personaText : "",
        strict: typeof rec.personaStrict === "boolean" ? rec.personaStrict : state.settings.personaStrictMode !== false,
      };
      if (rec.agentProfile && typeof rec.agentProfile === "object") {
        state.chatAgentProfile = typeof rv5NormalizeAgentProfile === "function"
          ? rv5NormalizeAgentProfile(rec.agentProfile)
          : Object.assign({}, rec.agentProfile);
      } else if (detected.isNew && state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats && state.settings.agentProfileDefault.enabled) {
        state.chatAgentProfile = Object.assign({}, state.settings.agentProfileDefault);
      } else if (!isPromotion) {
        state.chatAgentProfile = typeof rv5NormalizeAgentProfile === "function" ? rv5NormalizeAgentProfile(null) : { enabled: false };
      }
      if (!state.draftDirty) {
        state.draftPersonaText = state.chatPersona.text;
      }
      const rt = typeof sanitizeTelemetryRecord === "function" ? sanitizeTelemetryRecord(rec.telemetry) : rec.telemetry;
      const curTel = state.telemetry;
      if (detected.isNew) {
        if (!curTel.isGenerating) {
          curTel.lastAvgTps = 0;
          curTel.peakTps = 0;
          curTel.currentTps = 0;
          curTel.lastDurSec = 0;
          curTel.lastThinkingSec = 0;
          curTel.exactCacheTokens = 0;
          curTel.samples = [];
          curTel.history = [];
        }
      } else if (rt && !curTel.isGenerating && !curTel.wasGenerating && (rt.lastAvgTps > 0 || rt.peakTps > 0 || rt.exactRespTokens > 0)) {
        curTel.lastAvgTps = rt.lastAvgTps || 0;
        curTel.peakTps = Math.max(rt.peakTps || 0, rt.lastAvgTps || 0);
        curTel.lastDurSec = rt.lastDurSec || 0;
        curTel.lastThinkingSec = rt.lastThinkingSec || 0;
        curTel.exactRespTokens = rt.exactRespTokens || 0;
        curTel.exactContextTokens = rt.exactContextTokens || 0;
        curTel.exactCacheTokens = rt.exactCacheTokens || 0;
        if (!curTel.modelName && rt.modelName) curTel.modelName = rt.modelName;
        if (Array.isArray(rt.samples) && rt.samples.length > 0) curTel.samples = rt.samples.slice(-24);
      }
      if (res.quotaSummary && typeof res.quotaSummary === "object") {
        state.quotaSummary = res.quotaSummary;
      }
      refreshLiveEdits();
      renderStructure();
      updateLiveDom();
      const wantCtxSync = !detected.isNew && UUID_RE.test(detected.key) && (
        curTel.exactContextTokens <= 0 ||
        Boolean(state.settings.liveEditInline && state.settings.liveEditInline.showContextMeter)
      );
      if (wantCtxSync) {
        invokeIpc("agy-studio:get-turn-metrics", { chatKey: detected.key }).then((mRes) => {
          if (state.destroyed || state.activeChatKey !== detected.key) return;
          if (mRes && mRes.ok && telemetryEngine && typeof telemetryEngine.applyExactTranscriptMetrics === "function") {
            telemetryEngine.applyExactTranscriptMetrics(state.telemetry, mRes);
            updateLiveDom();
          }
        });
      }
    });

    if (isPromotion) {
      lastSavedDraftByChat.delete("__new__");
      lastKnownComposerSnapByChat.delete("__new__");
      draftTextCacheByChat.delete("__new__");
      invokeIpc("agy-studio:clear-composer-draft", { chatKey: "__new__" });
    } else if (!migrateFromKey) {
      restoreComposerDraftForChat(detected.key);
    } else {
      if (draftTextCacheByChat.has(migrateFromKey) && !draftTextCacheByChat.has(detected.key)) {
        draftTextCacheByChat.set(detected.key, draftTextCacheByChat.get(migrateFromKey));
        draftTextCacheByChat.delete(migrateFromKey);
      }
      // Cold restart often briefly detects temp chat-<hash> before URL/sidebar UUID hydrates.
      // If composer is still empty, ALWAYS restore the saved UUID draft instead of skipping!
      const foundMig = typeof rv5FindNativeComposer === "function" ? rv5FindNativeComposer(doc) : { container: null, editable: null };
      const curMigTxt = foundMig && foundMig.editable && typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(foundMig.editable) : "";
      const curMigAtt = foundMig && foundMig.editable ? hasComposerAttachments(foundMig.container, foundMig.editable) : false;
      if (!curMigTxt && !curMigAtt) {
        restoreComposerDraftForChat(detected.key);
      }
    }

    return { switched: true, promoted: isPromotion };
  }

  function recordTurnQuotaImpact(outputTokens, contextTokens, modelName) {
    if (!state.activeChatKey || state.activeChatKey === "__new__") return;
    invokeIpc("agy-studio:record-quota-turn", {
      chatKey: state.activeChatKey,
      title: state.activeChatTitle || "",
      modelName: modelName || "",
      outputTokens: Math.max(1, Math.round(outputTokens || 1)),
      contextTokens: Math.max(0, Math.round(contextTokens || 0)),
    }).then((res) => {
      if (!state.destroyed && res && res.summary) {
        applyQuotaSummary(res.summary);
      }
    });
  }

  function sampleStreamTick() {
    if (state.destroyed) return;
    const hiNow = nowHiRes();
    const snap = collectDomTelemetry();
    const detected = detectChatIdentity(snap);
    const sw = switchChatIfNeeded(detected, snap);
    const tel = state.telemetry;

    if (snap.modelName) tel.modelName = snap.modelName;
    if (snap.contextLabel) tel.contextLabel = snap.contextLabel;
    tel.chatTokens = snap.chatTokens;

    if (!sw.switched && telemetryEngine && typeof telemetryEngine.processTick === "function") {
      const outcome = telemetryEngine.processTick({
        tel,
        snap,
        hiNow,
        hydrationIgnoreUntil: state.hydrationIgnoreUntil,
        lastCancelClickAt: state.lastCancelClickAt,
        unknownModelLabel: t().modelUnknown,
        trackHistory: state.settings.trackHistory !== false,
      });
      if (outcome && outcome.finalizedTurn) {
        recordTurnQuotaImpact(outcome.finalizedTurn.tokens, snap.chatTokens, tel.modelName || snap.modelName || "");
        scheduleTurnTranscriptSync(state.activeChatKey, state.activeChatTitle);
        state.lastAutoQuotaPollAt = 0;
        if (win && typeof win.setTimeout === "function") {
          const finChatKey = state.activeChatKey || "__new__";
          win.setTimeout(() => {
            if (state.destroyed) return;
            invokeIpc("agy-studio:get-quota-summary", { chatKey: finChatKey, forceFresh: true }).then((qs) => {
              if (!state.destroyed && qs) applyQuotaSummary(qs);
            });
          }, 1800);
        }
      }
      if (outcome && outcome.flushNeeded && state.activeChatKey !== "__new__") {
        flushChatTelemetry(state.activeChatKey, state.activeChatTitle, tel);
      }
    } else if (sw.promoted && (snap.isGenerating || snap.respFloatTok > tel.prevFloatTok)) {
      const gained = Math.max(0, snap.respFloatTok - tel.prevFloatTok);
      if (gained > 0) {
        const seedSec = Math.max(0.35, (tel.preTokenAt > 0 ? Math.min(800, hiNow - tel.preTokenAt) : 450) / 1000);
        tel.lastGrowthAt = hiNow;
        if (!tel.firstGrowthAt) tel.firstGrowthAt = hiNow;
        if (!tel.turnStartMs) tel.turnStartMs = hiNow;
        tel.growthTicks = (tel.growthTicks || 0) + 1;
        const rawTps = Math.min(350, Math.max(1, Math.round(gained / seedSec)));
        tel.currentTps = rawTps;
        if (tel.growthTicks >= 2 && snap.respFloatTok >= 4) {
          tel.peakTps = Math.max(tel.peakTps, rawTps);
          tel.samples.push(rawTps);
          if (tel.samples.length > 24) tel.samples.shift();
        }
        tel.dirty = true;
      } else {
        tel.preTokenAt = hiNow;
        if (!tel.turnStartMs) tel.turnStartMs = hiNow;
      }
      tel.prevFloatTok = snap.respFloatTok;
      tel.highWaterBubbleTok = snap.respFloatTok;
      tel.isGenerating = Boolean(snap.isGenerating || gained > 0);
      tel.wasGenerating = tel.isGenerating;
      tel.phase = tel.isGenerating ? (tel.firstGrowthAt ? "streaming" : "thinking") : "idle";
      tel.prevRespCount = snap.respCount;
      tel.prevUserCount = snap.userMsgCount;
      tel.respTokens = snap.respTokens;
    }
  }

  function scheduleStreamSample() {
    if (state.destroyed || !state.mounted) return;
    state.lastDomMutationAt = Date.now();
    if (!win || typeof win.setTimeout !== "function") {
      sampleStreamTick();
      scheduleRepaint();
      return;
    }
    if (streamSampleTimer) return;
    streamSampleTimer = win.setTimeout(() => {
      streamSampleTimer = null;
      if (state.destroyed || !state.mounted) return;
      sampleStreamTick();
      scheduleRepaint();
    }, 95);
  }

  function scheduleRepaint() {
    if (state.destroyed || !state.mounted) return;
    if (repaintTimer || !win || typeof win.setTimeout !== "function") {
      if (!repaintTimer) updateLiveDom();
      return;
    }
    repaintTimer = win.setTimeout(() => {
      repaintTimer = null;
      if (!state.destroyed && state.mounted) {
        updateLiveDom();
        positionChatDock();
      }
    }, 95);
  }

  function syncHostTitleBarOverlay(appCfg, force) {
    const cfg = spNormalizeAppearance(appCfg || (state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance));
    const preset = spFindThemePreset(cfg.presetId);
    const hasWp = Boolean(cfg.wallpaper && cfg.wallpaper.type && cfg.wallpaper.type !== "none");
    const isGlassPreset = cfg.presetId === "liquid-glass" || cfg.presetId === "obsidian-glass" || cfg.presetId === "midnight-neon";
    const sig = `${cfg.presetId}|${cfg.canvasBg}|${cfg.cardBg}|${cfg.customSidebarBg ? cfg.sidebarBg : ""}|${hasWp ? "wp" : "no"}`;
    if (!force && sig === lastTitleBarOverlaySig) return;
    lastTitleBarOverlaySig = sig;
    try {
      invokeIpc("agy-studio:sync-titlebar-overlay", { appearance: cfg });
    } catch (_e) {}
    try {
      if (win && win.electronNativeAPI && typeof win.electronNativeAPI.setTitleBarOverlay === "function") {
        let color = "#0d0d11";
        let symbolColor = "#ececef";
        if (cfg.presetId === "custom") {
          color = (cfg.customSidebarBg && cfg.sidebarBg) ? cfg.sidebarBg : (cfg.canvasBg || "#09090b");
          const l = parseColorLightness(color);
          symbolColor = l !== null && l > 0.58 ? "#141418" : "#f1f2f6";
        } else if (cfg.presetId !== "native" && preset && preset.vars) {
          color = (cfg.customSidebarBg && cfg.sidebarBg) ? cfg.sidebarBg : (preset.vars.sidebarBg || preset.vars.canvasBg || color);
          const l = cfg.customSidebarBg && cfg.sidebarBg ? parseColorLightness(cfg.sidebarBg) : null;
          symbolColor = l !== null ? (l > 0.58 ? "#141418" : "#f1f2f6") : (preset.vars.fgColor || symbolColor);
        } else if (cfg.customSidebarBg && cfg.sidebarBg) {
          color = cfg.sidebarBg;
          const l = parseColorLightness(color);
          symbolColor = l !== null && l > 0.58 ? "#141418" : "#f1f2f6";
        }
        // Under wallpaper or glass themes the titlebar is translucent over the backdrop,
        // so use transparent overlay (#00000000) to prevent black squares behind — □ ×.
        if (hasWp || isGlassPreset) {
          color = "#00000000";
        }
        win.electronNativeAPI.setTitleBarOverlay({ color, symbolColor });
      }
    } catch (_e) {}
  }

  function applyThemeToHost(appCfg) {
    const cfg = appCfg || state.settings.appearance;
    if (themeEngine) {
      if (state.mounted && typeof themeEngine.setBootWallpaperDeferred === "function") {
        try { themeEngine.setBootWallpaperDeferred(false); } catch (_e) {}
      }
      if (typeof themeEngine.apply === "function") {
        try { themeEngine.apply(cfg); } catch (_e) {}
      }
    }
    syncTheme();
    syncHostTitleBarOverlay(cfg, false);
  }

  function applyThemeFastToHost(appCfg) {
    const cfg = appCfg || state.appearanceDraft;
    if (themeEngine) {
      if (state.mounted && typeof themeEngine.setBootWallpaperDeferred === "function") {
        try { themeEngine.setBootWallpaperDeferred(false); } catch (_e) {}
      }
      try {
        if (typeof themeEngine.applyFast === "function") themeEngine.applyFast(cfg);
        else if (typeof themeEngine.apply === "function") themeEngine.apply(cfg);
      } catch (_e) {}
    }
    syncTheme();
    syncHostTitleBarOverlay(cfg, false);
  }

  function applyLiveEditsPayload(payload) {
    if (!payload || typeof payload !== "object") return;
    const all = Array.isArray(payload.allItems) ? payload.allItems : (Array.isArray(payload.items) ? payload.items : []);
    const curKey = state.activeChatKey || "__new__";
    state.liveEdits = all.filter((x) => {
      if (!x) return false;
      if (curKey === "__new__") return x.chatKey === "__new__" || x.fallbackAny;
      return x.chatKey === curKey || x.deliveredConversationId === curKey || (x.fallbackAny && x.status === "pending");
    }).slice(-20).map((it) => {
      const cached = liveEditLocalPreviews.get(it.id);
      if (!cached) return it;
      const mergedImgs = Array.isArray(it.images) && it.images.length > 0
        ? it.images.map((im, idx) => Object.assign({}, im, {
            previewDataUrl: im.previewDataUrl || (cached.images && cached.images[idx] ? cached.images[idx].previewDataUrl : ""),
          }))
        : (cached.images || []);
      return Object.assign({}, it, { images: mergedImgs });
    });
  }

  function countPendingLiveEdits() {
    let n = 0;
    for (let i = 0; i < state.liveEdits.length; i += 1) {
      if (state.liveEdits[i] && state.liveEdits[i].status === "pending") n += 1;
    }
    return n;
  }

  function refreshLiveEdits() {
    return invokeIpc("agy-studio:get-live-edits", { chatKey: state.activeChatKey || "__new__" }).then((res) => {
      if (state.destroyed || !res || !res.ok) return res;
      applyLiveEditsPayload(res);
      renderPopoverStructure();
      updateLiveDom();
      if (state.isOpen && state.activeTab === "live-edits") {
        renderStructure();
      }
      return res;
    });
  }

  function insertTextIntoMainComposer(rawText) {
    const text = String(rawText || "").trim();
    if (!text || !doc || typeof doc.querySelector !== "function") return false;
    const candidates = doc.querySelectorAll('textarea, [contenteditable="true"]');
    for (let i = 0; i < candidates.length; i += 1) {
      const el = candidates[i];
      if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
      if (isHiddenAncestor(el, doc.body)) continue;
      try {
        el.focus();
        if (el.tagName === "TEXTAREA") {
          const proto = win && win.HTMLTextAreaElement && win.HTMLTextAreaElement.prototype;
          const desc = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
          if (desc && typeof desc.set === "function") desc.set.call(el, text);
          else el.value = text;
          const Evt = win && typeof win.Event === "function" ? win.Event : Event;
          el.dispatchEvent(new Evt("input", { bubbles: true }));
          return true;
        }
        el.textContent = text;
        const Evt = win && typeof win.Event === "function" ? win.Event : Event;
        el.dispatchEvent(new Evt("input", { bubbles: true }));
        return true;
      } catch (_e) {}
    }
    return false;
  }

  function sendLiveEditFromDraft() {
    if (state.liveEditBusy) return;
    const text = String(state.liveEditDraftText || "").trim();
    const imgs = Array.isArray(state.liveEditDraftImages) ? state.liveEditDraftImages.slice(0, 4) : [];
    if (!text && imgs.length === 0) return;

    const now = Date.now();
    const sig = text + "|" + imgs.map((x) => x.name).join(",");
    if (sig === state.lastSupplementSendSig && now - state.lastSupplementSendAt < 1500) {
      return;
    }
    state.lastSupplementSendSig = sig;
    state.lastSupplementSendAt = now;

    state.liveEditBusy = true;
    state.liveEditError = "";
    renderPopoverStructure();
    if (state.isOpen && state.activeTab === "live-edits") renderStructure();
    invokeIpc("agy-studio:send-live-edit", {
      chatKey: state.activeChatKey || "__new__",
      title: state.activeChatTitle || "",
      text,
      images: imgs.map((im) => ({ name: im.name, sourcePath: im.sourcePath || "", dataUrl: im.dataUrl || "" })),
      fallbackAny: !UUID_RE.test(String(state.activeChatKey || "")),
    }).then((res) => {
      if (state.destroyed) return;
      state.liveEditBusy = false;
      if (res && res.ok) {
        state.liveEditDraftText = "";
        state.liveEditDraftImages = [];
        state.liveEditError = "";
        applyLiveEditsPayload(res);
      } else {
        state.liveEditError = (res && res.error) || "SEND_FAILED";
      }
      renderPopoverStructure();
      updateLiveDom();
      if (state.isOpen && state.activeTab === "live-edits") renderStructure();
    });
  }

  function formatLiveEditStatus(status, tr) {
    if (status === "delivered" || status === "applied") return { label: tr.suppStatusDelivered, cls: "is-delivered" };
    if (status === "expired") return { label: tr.suppStatusExpired, cls: "is-expired" };
    return { label: tr.suppStatusPending, cls: "is-pending" };
  }

  function positionPopover() {
    if (!popoverMountEl || !win) return;
    if (!state.liveEditOpen) {
      popoverMountEl.style.left = "";
      popoverMountEl.style.top = "";
      popoverMountEl.style.right = "";
      popoverMountEl.style.bottom = "";
      return;
    }
    const vw = Number(win.innerWidth) || 1280;
    const vh = Number(win.innerHeight) || 800;
    const popW = Math.min(372, vw - 24);
    const popH = Math.min(360, vh - 24);
    let left = vw - popW - 16;
    let top = vh - popH - 64;

    if (widgetMountEl && state.settings.dockPosition !== "hidden" && typeof widgetMountEl.getBoundingClientRect === "function") {
      const r = widgetMountEl.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        if (r.top >= popH + 20) {
          top = r.top - popH - 10;
          left = r.right - popW;
        } else if (vh - r.bottom >= popH + 20) {
          top = r.bottom + 10;
          left = r.right - popW;
        } else if (r.left >= popW + 20) {
          left = r.left - popW - 10;
          top = r.top;
        } else {
          left = r.right + 10;
          top = r.top;
        }
      }
    }
    left = Math.max(12, Math.min(vw - popW - 12, Math.round(left)));
    top = Math.max(12, Math.min(vh - popH - 12, Math.round(top)));
    popoverMountEl.style.right = "";
    popoverMountEl.style.bottom = "";
    popoverMountEl.style.left = `${left}px`;
    popoverMountEl.style.top = `${top}px`;
  }

  function renderLiveEditPopoverMarkup() {
    if (!state.liveEditOpen) return "";
    const tr = t();
    const list = state.liveEdits || [];
    const draftImgs = state.liveEditDraftImages || [];
    const canSend = Boolean((state.liveEditDraftText && state.liveEditDraftText.trim()) || draftImgs.length > 0) && !state.liveEditBusy;
    const isBusy = state.telemetry.isGenerating;

    return `
      <div class="live-edit-popover" role="dialog" aria-label="${escAttr(tr.suppTitle)}">
        <div class="le-head">
          <div class="le-title-col">
            <span class="le-title">${iconSvg("bolt", 13)}<span>${escHtml(tr.suppTitle)}</span></span>
            <span class="le-sub">${escHtml(isBusy ? tr.suppActiveHint : tr.suppIdleHint)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <button type="button" class="icon-btn" data-action="open-live-edits-tab" title="${escAttr(tr.modalTitleSupplements)}">${iconSvg("expand", 12)}</button>
            <button type="button" class="icon-btn" data-action="close-live-edit" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 13)}</button>
          </div>
        </div>
        <div class="le-body">
          <textarea class="le-textarea" data-role="liveEditInput" placeholder="${escAttr(tr.suppPlaceholder)}">${escHtml(state.liveEditDraftText)}</textarea>
          ${draftImgs.length > 0 ? `
            <div class="le-thumbs">
              ${draftImgs.map((im, idx) => `
                <div class="le-thumb-chip">
                  ${im.previewDataUrl ? `<img class="le-thumb-img" src="${escAttr(im.previewDataUrl)}" alt=""/>` : iconSvg("image", 14)}
                  <span class="le-thumb-name">${escHtml(im.name || ("img-" + (idx + 1)))}</span>
                  <button type="button" class="preset-del-btn" data-action="remove-live-edit-img" data-idx="${idx}" title="${escAttr(tr.tooltipRemove)}">${iconSvg("close", 11)}</button>
                </div>
              `).join("")}
            </div>
          ` : ""}
          ${state.liveEditError ? `<span class="toast-text is-err" style="font-size:11px">${escHtml(state.liveEditError)}</span>` : ""}
          <div class="le-actions">
            <button type="button" class="btn btn-sm" data-action="pick-live-edit-images">${iconSvg("image", 12)}${escHtml(tr.suppPickPhoto)}</button>
            <div style="display:flex;align-items:center;gap:6px">
              ${list.length > 0 ? `<button type="button" class="btn btn-sm" data-action="clear-live-edits" title="${escAttr(tr.suppClearBtn)}">${iconSvg("trash", 12)}</button>` : ""}
              ${!isBusy && state.liveEditDraftText.trim() ? `<button type="button" class="btn btn-sm" data-action="insert-supplement-to-chat">${escHtml(tr.suppInsertChatBtn)}</button>` : ""}
              <button type="button" class="btn btn-sm btn-primary" ${canSend ? "" : "disabled"} data-action="send-live-edit">${iconSvg("send", 12)}${escHtml(tr.suppSendBtn)}</button>
            </div>
          </div>
          ${list.length > 0 ? renderLiveEditFeedHtml(list.slice().reverse().slice(0, 5), tr) : ""}
        </div>
      </div>
    `;
  }

  function renderLiveEditFeedHtml(items, tr) {
    return `
      <div class="le-feed" data-live="leFeed">
        ${items.map((it) => {
          const st = formatLiveEditStatus(it.status, tr);
          const tStr = new Date(it.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const imgCount = Array.isArray(it.images) ? it.images.length : 0;
          return `
            <div class="le-item">
              <div class="le-item-top">
                <span class="num">${escHtml(tStr)}${imgCount > 0 ? ` · ${imgCount} ${escHtml(tr.suppPhotoCount)}` : ""}</span>
                <span class="le-status-pill ${st.cls}">${escHtml(st.label)}</span>
              </div>
              ${it.text ? `<span style="color:var(--rx-fg-strong);word-break:break-word">${escHtml(it.text.slice(0, 140))}</span>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderPopoverStructure() {
    if (!popoverMountEl || state.destroyed) return;
    const tr = t();
    if (state.liveEditOpen && shadowRoot && shadowRoot.activeElement && popoverMountEl.contains(shadowRoot.activeElement) && shadowRoot.activeElement.getAttribute("data-role") === "liveEditInput") {
      const feedEl = popoverMountEl.querySelector('[data-live="leFeed"]');
      if (feedEl && state.liveEdits.length > 0) {
        const tmp = doc.createElement("div");
        tmp.innerHTML = renderLiveEditFeedHtml(state.liveEdits.slice().reverse().slice(0, 5), tr);
        if (tmp.firstElementChild) feedEl.replaceWith(tmp.firstElementChild);
      }
      positionPopover();
      return;
    }
    popoverMountEl.innerHTML = renderLiveEditPopoverMarkup();
    positionPopover();
  }

  function formatUpdateVersionBadge(u) {
    const inst = u && u.installed ? u.installed : null;
    const rem = u && u.remote ? u.remote : null;
    const instVer = (inst && inst.version) || pluginMeta.version || "5.5.1";
    const remVer = (rem && rem.version) || "";
    const remShort = (rem && rem.commitShort) || "";
    if (remVer && remVer !== instVer) {
      return `v${instVer} → v${remVer}`;
    }
    if (remVer && remShort) {
      return `v${remVer} · #${remShort}`;
    }
    return remVer ? `v${remVer}` : `v${instVer}`;
  }

  function formatUpdateStatusLabel(u, tr) {
    const st = u && u.status ? u.status : "idle";
    if (st === "checking") return tr.updateStatusChecking;
    if (st === "downloading") return tr.updateStatusDownloading;
    if (st === "verifying") return tr.updateStatusVerifying || tr.updateStatusDownloading;
    if (st === "extracting") return tr.updateStatusExtracting;
    if (st === "installing") return tr.updateStatusInstalling;
    if (st === "restarting") return tr.updateStatusRestarting;
    if (st === "error") return `${tr.updateStatusError}${u.error ? ": " + u.error : ""}`;
    if (u && u.available) return tr.updateStatusAvailable;
    if (st === "up-to-date") return tr.updateStatusUpToDate;
    return tr.updateStatusIdle;
  }

  function formatLastCheckTime(ts) {
    const n = Number(ts) || 0;
    if (n <= 0) return "";
    try {
      const d = new Date(n);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch (_e) {
      return "";
    }
  }

  function renderUpdateToast() {
    if (!updateToastMountEl || state.destroyed) return;
    const tr = t();
    const realU = state.update || {};
    const isPreview = Boolean(state.updatePreviewActive && !realU.available);
    const u = isPreview
      ? {
          status: "available",
          available: true,
          dismissed: false,
          installed: realU.installed || { version: pluginMeta.version || "5.5.1" },
          remote: {
            version: pluginMeta.version || "5.5.1",
            commitShort: (realU.installed && realU.installed.commitShort) || "preview",
            commitMessage: tr.updatePreviewBadge,
          },
        }
      : realU;
    const st = u.status || "idle";
    const isBusyStage = st === "downloading" || st === "extracting" || st === "installing" || st === "restarting";
    const hasErrOnToast = st === "error" && Boolean(u.available) && !u.dismissed;
    const shouldShow = isPreview || isBusyStage || hasErrOnToast || (Boolean(u.available) && !u.dismissed);

    // Never cover Rudex Studio Settings modal or auth screen with an unsolicited floating update popup
    if (!shouldShow || state.onAuthScreen || (state.isOpen && !isPreview && !isBusyStage)) {
      updateToastMountEl.innerHTML = "";
      return;
    }

    const vw = win && win.innerWidth ? Number(win.innerWidth) : 1280;
    const isRightDrawerOpen = Boolean(state.isOpen && state.activeTab === "appearance" && state.appearanceDockedRight);
    const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : (state.settings.limitsWidget || {});
    const limitsAtTopRight = Boolean(lw && lw.enabled && lw.position === "top-right");
    const limitsAtBottomRight = Boolean(lw && lw.enabled && lw.position === "bottom-right");
    const isTopRightDocked = state.settings.layoutMode === "docked" && state.settings.dockPosition === "top-right";
    const isBottomRightDocked = state.settings.layoutMode === "docked" && state.settings.dockPosition === "bottom-right";
    const isTopRightFloating =
      state.settings.layoutMode === "floating" &&
      typeof state.settings.floatY === "number" &&
      typeof state.settings.floatX === "number" &&
      state.settings.floatY < 160 &&
      state.settings.floatX > Math.max(0, vw - 460);

    let posCls = "";
    if (isRightDrawerOpen || (state.isOpen && isPreview)) {
      // Park cleanly at bottom-left so Settings modal / Appearance drawer is 100% unobstructed
      posCls = " is-left-bottom";
    } else if (isTopRightDocked || isTopRightFloating || limitsAtTopRight) {
      posCls = (isBottomRightDocked || limitsAtBottomRight) ? " is-left-bottom" : " is-bottom";
    }
    updateToastMountEl.className = "update-toast-mount" + posCls + (isPreview ? " is-preview" : "");

    const verLabel = formatUpdateVersionBadge(u);
    const stageText = formatUpdateStatusLabel(u, tr);
    const rawCommitMsg = u.remote && u.remote.commitMessage ? String(u.remote.commitMessage).trim() : "";
    const cleanCommitMsg = rawCommitMsg
      .replace(/^(?:docs|fix|feat|chore|refactor|style|test|perf|ci|build)(?:\([^)]*\))?:\s*/i, "")
      .trim();
    const isRedundantVer = !cleanCommitMsg || /^rudex\s+v?\d+\.\d+(?:\.\d+)?$/i.test(cleanCommitMsg);
    const title = isBusyStage ? tr.updateToastBusyTitle : tr.updateToastTitle;
    let bodyHtml = "";
    if (isBusyStage || st === "error") {
      bodyHtml = `<div class="update-toast-msg">${escHtml(stageText)}</div>`;
    } else if (!isRedundantVer) {
      bodyHtml = `<div class="update-toast-msg"><div style="color:var(--rx-fg-strong);font-weight:500;margin-bottom:4px">${escHtml(cleanCommitMsg)}</div><div>${escHtml(tr.updateToastDesc)}</div></div>`;
    } else {
      bodyHtml = `<div class="update-toast-msg">${escHtml(tr.updateToastDesc)}</div>`;
    }

    updateToastMountEl.innerHTML = `
      <div class="update-toast" role="status" aria-live="polite">
        <div class="update-toast-head">
          <div class="update-toast-title-wrap">
            <span class="update-toast-title">${iconSvg("download", 13)}<span>${escHtml(title)}</span></span>
            <span class="update-toast-ver num">${escHtml(verLabel)}</span>
          </div>
          ${isBusyStage ? "" : `<button type="button" class="icon-btn" data-action="dismiss-update" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 13)}</button>`}
        </div>
        ${bodyHtml}
        ${isBusyStage ? `<div class="update-toast-progress"><div class="update-toast-bar"></div></div>` : ""}
        ${isBusyStage ? "" : `
          <div class="update-toast-actions">
            <button type="button" class="btn btn-sm" data-action="dismiss-update">${escHtml(tr.updateBtnLater)}</button>
            ${isPreview ? "" : `<button type="button" class="btn btn-sm btn-primary" data-action="install-update">${iconSvg("download", 12)}${escHtml(st === "error" ? tr.updateBtnRetry : tr.updateBtnNow)}</button>`}
          </div>
        `}
      </div>
    `;
  }

  function applyQuotaSummary(summary) {
    if (state.destroyed || !summary || typeof summary !== "object") return;
    state.quotaSummary = summary;
    try {
      state.lastQuotaFamiliesSig = JSON.stringify(summary.families || {});
    } catch (_e) {}
    updateLiveDom();
    renderLimitsWidgetMount();
    if (state.usagePopOpen) renderModelUsagePopover();
    if (state.isOpen && (state.activeTab === "widgets" || (state.activeTab === "settings" && (state.settingsSubTab === "export" || (state.settingsSubTab === "widget" && state.widgetSubSection === "limits"))))) {
      const ae = shadowRoot && shadowRoot.activeElement ? shadowRoot.activeElement : null;
      const isEditingControl = Boolean(ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT" || ae.tagName === "TEXTAREA"));
      if (isEditingControl && state.settingsSubTab === "widget" && modalMountEl && typeof rv5BuildLimitsWidgetHtml === "function") {
        const stage = modalMountEl.querySelector(".preview-stage");
        if (stage) {
          const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : state.settings.limitsWidget;
          stage.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, (state.telemetry && state.telemetry.modelName) || "", state.locale !== "en", true);
        }
      } else {
        renderStructure();
      }
    }
  }

  function scheduleQuotaDomScrapeBurst() {
    if (!win || typeof win.setTimeout !== "function") {
      scrapeDomQuotaSnapshot(true);
      return;
    }
    const delays = [90, 260, 680, 1450];
    for (let i = 0; i < delays.length; i += 1) {
      const tid = win.setTimeout(() => {
        quotaScrapeTimers = quotaScrapeTimers.filter((t) => t !== tid);
        if (!state.destroyed) scrapeDomQuotaSnapshot(true);
      }, delays[i]);
      quotaScrapeTimers.push(tid);
    }
  }

  function pollQuotaSummaryIfDue(now) {
    if (state.destroyed || state.quotaPollInflight || !ipc) return;
    const limUiVisible = Boolean(
      state.usagePopOpen ||
      (state.settings.limitsWidget && state.settings.limitsWidget.enabled) ||
      state.settings.viewMode === "medium" ||
      (state.settings.miniFields && state.settings.miniFields.quota) ||
      (state.isOpen && (state.activeTab === "widgets" || (state.activeTab === "settings" && (state.settingsSubTab === "export" || (state.settingsSubTab === "widget" && state.widgetSubSection === "limits")))))
    );
    const intervalMs = state.telemetry.isGenerating
      ? 4000
      : (limUiVisible ? 9000 : 45000);
    if (now - (state.lastAutoQuotaPollAt || 0) < intervalMs) return;
    state.lastAutoQuotaPollAt = now;
    state.quotaPollInflight = true;
    invokeIpc("agy-studio:get-quota-summary", {
      chatKey: state.activeChatKey || "__new__",
      forceFresh: true,
    }).then((qs) => {
      state.quotaPollInflight = false;
      if (state.destroyed || !qs || typeof qs !== "object") return;
      let nextSig = "";
      try { nextSig = JSON.stringify(qs.families || {}); } catch (_e) {}
      if (!state.quotaSummary || nextSig !== state.lastQuotaFamiliesSig) {
        applyQuotaSummary(qs);
      } else {
        state.quotaSummary = qs;
      }
    }).catch(() => {
      state.quotaPollInflight = false;
    });
  }

  function applyUpdateStatus(payload) {
    if (!payload || typeof payload !== "object" || state.destroyed) return;
    const prevAvailable = Boolean(state.update && state.update.available);
    state.update = {
      status: typeof payload.status === "string" ? payload.status : "idle",
      available: Boolean(payload.available),
      dismissed: Boolean(payload.dismissed),
      reason: typeof payload.reason === "string" ? payload.reason : "",
      updateKey: typeof payload.updateKey === "string" ? payload.updateKey : "",
      lastCheckedAt: typeof payload.lastCheckedAt === "number" ? payload.lastCheckedAt : 0,
      error: typeof payload.error === "string" ? payload.error : "",
      installed: payload.installed && typeof payload.installed === "object" ? payload.installed : state.update.installed,
      remote: payload.remote && typeof payload.remote === "object" ? payload.remote : state.update.remote,
    };
    renderUpdateToast();
    const normSub = ["system", "optimization", "studio", "hotkeys"].indexOf(state.settingsSubTab) >= 0 ? state.settingsSubTab : "system";
    if (state.isOpen && ((state.activeTab === "settings" && normSub === "system") || prevAvailable !== state.update.available)) {
      renderStructure();
    }
  }

  function extractClipboardImages(clipboardData, onComplete) {
    const items = clipboardData && clipboardData.items ? clipboardData.items : null;
    if (!items || typeof items.length !== "number") return false;
    const files = [];
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      if (it && typeof it.type === "string" && it.type.indexOf("image/") === 0 && typeof it.getAsFile === "function") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length === 0) return false;
    const ReaderCtor = win && typeof win.FileReader === "function" ? win.FileReader : (typeof FileReader === "function" ? FileReader : null);
    if (!ReaderCtor) return false;
    files.forEach((file, idx) => {
      if (!Array.isArray(state.liveEditDraftImages)) state.liveEditDraftImages = [];
      if (state.liveEditDraftImages.length >= 4) return;
      const reader = new ReaderCtor();
      reader.onload = () => {
        if (state.destroyed || typeof reader.result !== "string") return;
        if (state.liveEditDraftImages.length >= 4) return;
        const rawExt = file.type && file.type.split("/")[1] ? file.type.split("/")[1].replace(/[^a-z0-9]/gi, "") : "png";
        state.liveEditDraftImages.push({
          name: file.name || `clipboard-${Date.now()}-${idx + 1}.${rawExt || "png"}`,
          sourcePath: "",
          dataUrl: reader.result,
          previewDataUrl: reader.result,
        });
        if (typeof onComplete === "function") onComplete();
      };
      try { reader.readAsDataURL(file); } catch (_err) {}
    });
    return true;
  }

  function isQuotaHiddenEl(el) {
    if (!el || el.nodeType !== 1) return false;
    if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) return true;
    const tag = String(el.tagName || "").toUpperCase();
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "NOSCRIPT") return true;
    if (typeof el.hasAttribute === "function" && el.hasAttribute("hidden")) return true;
    if (el.hidden === true) return true;
    if (typeof el.getAttribute === "function" && el.getAttribute("aria-hidden") === "true") return true;
    const cls = typeof el.getAttribute === "function"
      ? (el.getAttribute("class") || "")
      : (typeof el.className === "string" ? el.className : "");
    if (cls && /\binvisible\b/.test(cls)) return true;
    if (el.style && (el.style.display === "none" || el.style.visibility === "hidden" || el.style.opacity === "0")) {
      return true;
    }
    return false;
  }

  function collectVisibleQuotaText(node, chunks) {
    if (!node) return;
    if (node.nodeType === 3) {
      const val = node.nodeValue;
      if (val) chunks.push(val);
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    if (node.nodeType === 1 && isQuotaHiddenEl(node)) return;
    const tag = node.nodeType === 1 ? String(node.tagName || "").toUpperCase() : "";
    const cls = node.nodeType === 1
      ? (typeof node.getAttribute === "function" ? (node.getAttribute("class") || "") : (typeof node.className === "string" ? node.className : ""))
      : "";
    const isBlock =
      tag === "DIV" ||
      tag === "P" ||
      tag === "LI" ||
      tag === "SECTION" ||
      tag === "ARTICLE" ||
      tag === "TR" ||
      /^H[1-6]$/.test(tag) ||
      /\b(?:col-span-|block)\b/.test(cls);
    const children = node.childNodes;
    if (children && typeof children.length === "number") {
      for (let i = 0; i < children.length; i += 1) {
        collectVisibleQuotaText(children[i], chunks);
      }
    } else if (typeof node.textContent === "string") {
      chunks.push(node.textContent);
    }
    if (isBlock) {
      chunks.push("\n");
    } else if (tag === "SPAN") {
      chunks.push(" ");
    }
  }

  function findQuotaCirclesContainer(circles) {
    if (!circles || circles.length === 0) return null;
    const ancLists = [];
    for (let i = 0; i < circles.length; i += 1) {
      const c = circles[i];
      if (!c || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(c))) continue;
      if (typeof c.closest === "function") {
        const directBox = c.closest('.agy-overlay, [role="dialog"], [role="menu"]');
        if (directBox && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(directBox))) {
          return directBox;
        }
      }
      const chain = [];
      let cur = c.parentNode;
      while (cur && cur !== doc) {
        chain.push(cur);
        cur = cur.parentNode;
      }
      ancLists.push(chain);
    }
    if (ancLists.length === 0) return null;
    if (ancLists.length === 1) {
      let cur = ancLists[0][0] || null;
      for (let step = 0; step < 5 && cur && cur.parentNode && cur.parentNode !== doc.body && cur.parentNode !== doc; step += 1) {
        cur = cur.parentNode;
      }
      return cur;
    }
    const first = ancLists[0];
    for (let i = 0; i < first.length; i += 1) {
      const candidate = first[i];
      if (!candidate || candidate === doc.body || candidate === doc.documentElement) continue;
      if (ancLists.every((lst) => lst.indexOf(candidate) !== -1)) {
        return candidate;
      }
    }
    return doc.body;
  }

  function scrapeDomQuotaSnapshot(force) {
    if (!doc || !doc.body) return false;
    const now = Date.now();
    try {
      const circles = typeof doc.querySelectorAll === "function"
        ? doc.querySelectorAll('[data-testid="quota-progress-circle"]')
        : null;
      const hasCircles = Boolean(circles && circles.length > 0);
      const overlays = !hasCircles && typeof doc.querySelectorAll === "function"
        ? doc.querySelectorAll('[role="dialog"], .agy-overlay, [data-radix-popper-content-wrapper], [role="menu"], [role="listbox"], [data-slot="popover-content"]')
        : null;
      const hasOpenOverlay = Boolean(overlays && overlays.length > 0);
      const minInterval = hasCircles ? 450 : (hasOpenOverlay ? 550 : 3500);
      if (!force && now - state.lastQuotaScrapeAt < minInterval) return false;
      state.lastQuotaScrapeAt = now;

      const quotaHintRe = /limit\s*remaining|weekly\s*limit|five\s*hour|5[-\s]*hour|5h\s+limit|лимит\s*\(\s*5\s*ч\s*\)|остаток\s*(?:недельн|5|пяти)|недельн[а-яё]*\s*лимит|5[-\s]*часов|%\s*(?:left|осталось)/i;
      let txt = "";
      if (hasCircles) {
        const box = findQuotaCirclesContainer(circles);
        if (box) {
          const chunks = [];
          collectVisibleQuotaText(box, chunks);
          txt = chunks.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
        }
      } else if (overlays && overlays.length > 0) {
        for (let i = 0; i < overlays.length; i += 1) {
          const ov = overlays[i];
          if (!ov || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(ov))) continue;
          const chunks = [];
          collectVisibleQuotaText(ov, chunks);
          const candidateTxt = chunks.join("").replace(/[ \t]+\n/g, "\n").trim();
          if (candidateTxt && quotaHintRe.test(candidateTxt)) {
            txt = candidateTxt;
            break;
          }
        }
      }
      // Also scrape full-page Antigravity Settings -> Models view inside <main> (excluding chat messages so chat prose can NEVER spoof real limits!)
      if (!txt && typeof doc.querySelector === "function") {
        const mainEl = doc.querySelector("main");
        if (mainEl && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(mainEl))) {
          const hasChatMsgs = typeof mainEl.querySelector === "function" && Boolean(mainEl.querySelector('[data-testid="agent-response"], [data-testid="user-message-bubble"], [data-testid="user-message-content"]'));
          if (!hasChatMsgs) {
            const chunks = [];
            collectVisibleQuotaText(mainEl, chunks);
            const mainTxt = chunks.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
            if (mainTxt && mainTxt.length < 18000 && quotaHintRe.test(mainTxt)) {
              txt = mainTxt;
            }
          }
        }
      }

      if (!txt || txt.length < 20) return false;
      const parsed = parseQuotaFromDocumentText(txt, state.telemetry.modelName);
      if (!parsed) return false;
      const sig = JSON.stringify(parsed);
      if (!force && sig === state.lastQuotaScrapeSig && now - state.lastQuotaSyncAt < 8000) return false;
      state.lastQuotaScrapeSig = sig;
      state.lastQuotaSyncAt = now;
      invokeIpc("agy-studio:sync-quota-snapshot", {
        gemini: parsed.gemini,
        claudeGpt: parsed.claudeGpt,
        activeChatKey: state.activeChatKey || "__new__",
      }).then((res) => {
        if (!state.destroyed && res && res.summary) {
          applyQuotaSummary(res.summary);
        }
      });
      return true;
    } catch (_e) {}
    return false;
  }

  function collectDomConversation() {
    if (!doc || typeof doc.querySelectorAll !== "function") return [];
    const out = [];
    try {
      const nodes = doc.querySelectorAll('[data-testid="user-message-content"], [data-testid="agent-response"]');
      for (let i = 0; nodes && i < nodes.length; i += 1) {
        const el = nodes[i];
        if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
        const tid = typeof el.getAttribute === "function" ? el.getAttribute("data-testid") : "";
        const isUser = tid === "user-message-content";
        const text = isUser
          ? (el.textContent || "").trim()
          : (typeof extractVisibleResponseText === "function" ? extractVisibleResponseText(el) : (el.textContent || "")).trim();
        if (text) out.push({ role: isUser ? "user" : "agent", text });
      }
    } catch (_e) {}
    return out;
  }

  function getActiveChatQuotaDisplay() {
    const tr = t();
    const qs = state.quotaSummary;
    const ac = qs && qs.activeChat ? qs.activeChat : null;
    const fams = qs && qs.families ? qs.families : null;
    const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : (state.settings.limitsWidget || {});
    const isUsedMode = lw && lw.displayMode === "used";
    const mLow = String((state.telemetry && state.telemetry.modelName) || "").toLowerCase();
    const activeFamKey = mLow.includes("claude") || mLow.includes("gpt") || mLow.includes("sonnet") || mLow.includes("opus")
      ? "claudeGpt"
      : "gemini";
    const fam = fams && (fams[activeFamKey] || fams.gemini || fams.claudeGpt) ? (fams[activeFamKey] || fams.gemini || fams.claudeGpt) : null;
    const hasReal5 = Boolean(fam && typeof fam.fiveHourRem === "number" && Number.isFinite(fam.fiveHourRem));
    const hasRealW = Boolean(fam && typeof fam.weeklyRem === "number" && Number.isFinite(fam.weeklyRem));
    if (hasReal5 || hasRealW) {
      const fmtFam = (rem) => {
        if (typeof rem !== "number" || !Number.isFinite(rem)) return "—";
        const val = isUsedMode ? Math.max(0, Math.min(100, Math.round(100 - rem))) : Math.max(0, Math.min(100, Math.round(rem)));
        return `${val}%`;
      };
      const fiveHour = fmtFam(fam.fiveHourRem);
      const week = fmtFam(fam.weeklyRem);
      const parts = [];
      if (hasRealW) parts.push(`${tr.quotaWeekShort} ${week}`);
      if (hasReal5) parts.push(`${tr.quota5hShort} ${fiveHour}`);
      return { fiveHour, week, miniText: parts.join(" · "), activeChat: ac, family: fam };
    }
    const fiveHour = ac ? formatQuotaPct(ac.fiveHourWindowPct || ac.fiveHourPct) : "—";
    const week = ac ? formatQuotaPct(ac.weeklyPct) : "—";
    const miniText = ac && ((ac.fiveHourWindowPct || ac.fiveHourPct) > 0 || ac.weeklyPct > 0)
      ? `${tr.quotaWeekShort} -${week} · ${tr.quota5hShort} -${fiveHour}`
      : `${tr.quotaWeekShort} — · ${tr.quota5hShort} —`;
    return { fiveHour, week, miniText, activeChat: ac, family: fam };
  }

  function spNeedsRuThinking(str) {
    const s = String(str || "").trim();
    if (s.length < 3 || s.length > 6000) return false;
    if (/^https?:\/\/\S+$/i.test(s)) return false;
    if (/^[A-Za-z]:\\[^\s]+$/i.test(s) || /^\/[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/.test(s)) return false;
    if (!/\s/.test(s) && /[\\/_=()[\]{}<>`]/.test(s)) return false;
    const latin = s.match(/[A-Za-z]/g);
    const latinCount = latin ? latin.length : 0;
    if (latinCount < 3) return false;
    const cyr = s.match(/[\u0410-\u042f\u0430-\u044f\u0401\u0451]/g);
    const cyrCount = cyr ? cyr.length : 0;
    return cyrCount / (latinCount + cyrCount) < 0.35;
  }

  function wrapEdgeSpaces(orig, translated) {
    const raw = String(orig || "");
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
    if (!m) return String(translated || "");
    return m[1] + String(translated || "").trim() + m[3];
  }

  function setThinkingCacheEntry(key, val) {
    if (thinkingCache.has(key)) thinkingCache.delete(key);
    thinkingCache.set(key, val);
    while (thinkingCache.size > 500) {
      const oldest = thinkingCache.keys().next().value;
      thinkingCache.delete(oldest);
    }
  }

  function applyThinkingNodeValue(node, nextVal) {
    if (!node || node.nodeValue === nextVal) return;
    isApplyingThinkingTranslation = true;
    try {
      node.nodeValue = nextVal;
    } finally {
      isApplyingThinkingTranslation = false;
    }
    if (!state.telemetry.isGenerating) {
      state.hydrationIgnoreUntil = Math.max(state.hydrationIgnoreUntil || 0, nowHiRes() + 700);
    }
  }

  function findThinkingContentSibling(container, afterEl) {
    if (!container || !container.children || typeof container.children.length !== "number") return null;
    const children = container.children;
    let startIdx = -1;
    for (let i = 0; i < children.length; i += 1) {
      if (children[i] === afterEl) {
        startIdx = i + 1;
        break;
      }
    }
    if (startIdx < 0 || startIdx >= children.length) return null;

    for (let i = startIdx; i < children.length; i += 1) {
      const ch = children[i];
      if (!ch || (hostEl && (ch === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(ch))))) continue;
      const tag = String(ch.tagName || "").toUpperCase();
      if (tag === "BUTTON" || tag === "SVG" || tag === "STYLE") continue;
      const cls = typeof ch.getAttribute === "function" ? (ch.getAttribute("class") || "") : (typeof ch.className === "string" ? ch.className : "");
      if (/\b(?:overflow-y-auto|bleed-contain)\b/.test(cls)) return ch;
    }

    for (let i = startIdx; i < children.length; i += 1) {
      const ch = children[i];
      if (!ch || (hostEl && (ch === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(ch))))) continue;
      if (typeof ch.getAttribute === "function" && ch.getAttribute("data-rudex-ignore")) continue;
      const tag = String(ch.tagName || "").toUpperCase();
      if (tag === "BUTTON" || tag === "SVG" || tag === "STYLE" || tag === "INPUT" || tag === "TEXTAREA") continue;
      if (ch.childNodes && ch.childNodes.length > 0) return ch;
    }
    return null;
  }

  function isThinkingTriggerLabel(labelTxt) {
    return /^(?:Thought\s+for\b|Thought\s+Process\b|Thinking\b|(?:Думал|Думает|Размышлял|Размышляет|Процесс\s+мышления|Размышлени[яей]?)(?=\s|·|:|\(|$))/i.test(labelTxt);
  }

  function isWorkLogTriggerLabel(labelTxt) {
    return /^(?:Worked\s+for\b|Working\b|(?:Работал|Работает)(?=\s|·|:|\(|$))/i.test(labelTxt);
  }

  function findExpandedThinkingPanels(wantThinking, wantWorkLog) {
    if (!doc || typeof doc.querySelectorAll !== "function") return { items: [], thinkingPanelSet: new Set() };
    const items = [];
    const seenThinking = new Set();
    const seenWorkLog = new Set();
    const thinkingPanelSet = new Set();
    try {
      const selector = wantWorkLog
        ? 'button[data-testid="thinking-collapsible-trigger"][aria-expanded="true"], button[aria-expanded="true"], button[data-state="open"], main button, [data-testid="conversation-view"] button'
        : 'button[data-testid="thinking-collapsible-trigger"][aria-expanded="true"], button[aria-expanded="true"]';
      const triggers = doc.querySelectorAll(selector);
      const checkedBtns = new Set();
      for (let i = 0; triggers && i < triggers.length; i += 1) {
        const btn = triggers[i];
        if (!btn || checkedBtns.has(btn)) continue;
        checkedBtns.add(btn);
        if (hostEl && (btn === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(btn)))) continue;
        const ariaExp = typeof btn.getAttribute === "function" ? btn.getAttribute("aria-expanded") : null;
        const dataSt = typeof btn.getAttribute === "function" ? btn.getAttribute("data-state") : null;
        if (ariaExp === "false" || dataSt === "closed") continue;
        const testId = typeof btn.getAttribute === "function" ? (btn.getAttribute("data-testid") || "") : "";
        const aria = typeof btn.getAttribute === "function" ? (btn.getAttribute("aria-label") || "").trim() : "";
        const labelTxt = aria || String(btn.textContent || "").replace(/\s+/g, " ").trim();
        const isThinkBtn = testId === "thinking-collapsible-trigger" || (ariaExp === "true" && isThinkingTriggerLabel(labelTxt));
        const isWorkBtn = !isThinkBtn && isWorkLogTriggerLabel(labelTxt);
        if (!isThinkBtn && !isWorkBtn) continue;

        const parent = btn.parentNode;
        let panel = findThinkingContentSibling(parent, btn);
        if (!panel && parent && parent !== doc.body && parent !== doc.documentElement && parent.parentNode) {
          panel = findThinkingContentSibling(parent.parentNode, parent);
        }
        if (!panel) continue;

        if (isThinkBtn) {
          thinkingPanelSet.add(panel);
          if (wantThinking && !seenThinking.has(panel)) {
            seenThinking.add(panel);
            items.push({ panel, kind: "thinking" });
          }
        } else if (isWorkBtn && wantWorkLog && !seenWorkLog.has(panel)) {
          seenWorkLog.add(panel);
          items.push({ panel, kind: "worklog" });
        }
      }
    } catch (_e) {}
    return { items, thinkingPanelSet };
  }

  const THINKING_SKIP_TAGS = new Set(["CODE", "PRE", "KBD", "SAMP", "SCRIPT", "STYLE", "SVG", "NOSCRIPT", "BUTTON", "TEXTAREA", "INPUT"]);
  const THINKING_BLOCK_TAGS = new Set(["P", "DIV", "LI", "UL", "OL", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6", "SECTION", "ARTICLE", "HEADER", "FOOTER", "TR", "TD", "TH", "HR", "BR", "DETAILS", "SUMMARY"]);

  // Group contiguous inline text nodes (including word-by-word streaming <span>s inside a <p>/<li>/<div>)
  // into full sentence/paragraph runs so Google Translate receives complete grammatical context
  // instead of translating single words and skipping 2-letter prepositions ("of", "by", "at", "if")!
  function collectTranslatableThinkingRuns(rootNode, outRuns, skipPanelsSet) {
    let curRun = [];
    const flushRun = () => {
      if (curRun.length > 0) {
        outRuns.push(curRun);
        curRun = [];
      }
    };
    const walk = (node) => {
      if (!node) return;
      if (node.nodeType === 3) {
        const val = node.nodeValue || "";
        const rec = thinkingNodeMap.get(node);
        // Keep tracked cleared follower spans (rec.applied && val === "") inside the same run so streaming updates reconstruct the full original sentence!
        if (val || (rec && rec.applied)) {
          curRun.push(node);
        }
        return;
      }
      if (node.nodeType !== 1 && node.nodeType !== 11) return;
      let isBlock = false;
      if (node.nodeType === 1) {
        if (skipPanelsSet && skipPanelsSet.has(node)) {
          flushRun();
          return;
        }
        if (hostEl && (node === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(node)))) {
          flushRun();
          return;
        }
        if (typeof node.getAttribute === "function" && node.getAttribute("data-rudex-ignore")) {
          flushRun();
          return;
        }
        const tag = String(node.tagName || "").toUpperCase();
        if (THINKING_SKIP_TAGS.has(tag)) {
          flushRun();
          return;
        }
        isBlock = THINKING_BLOCK_TAGS.has(tag);
        if (isBlock) flushRun();
      }
      const children = node.childNodes;
      if (children && typeof children.length === "number") {
        for (let i = 0; i < children.length; i += 1) {
          walk(children[i]);
        }
      }
      if (isBlock) flushRun();
    };
    walk(rootNode);
    flushRun();
  }

  function restoreThinkingNodesByKind(targetKind) {
    if (!targetKind && thinkingScanTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(thinkingScanTimer);
      thinkingScanTimer = null;
    }
    if (trackedThinkingNodes.size === 0) return;
    isApplyingThinkingTranslation = true;
    try {
      const toDelete = [];
      trackedThinkingNodes.forEach((tn) => {
        const rec = thinkingNodeMap.get(tn);
        if (targetKind && rec && (rec.kind || "thinking") !== targetKind) return;
        if (rec && rec.applied && tn.nodeValue === rec.translated) {
          tn.nodeValue = rec.orig;
          rec.translated = "";
          rec.applied = false;
          rec.runJoined = "";
        }
        toDelete.push(tn);
      });
      for (let i = 0; i < toDelete.length; i += 1) trackedThinkingNodes.delete(toDelete[i]);
    } finally {
      isApplyingThinkingTranslation = false;
    }
  }

  function restoreAllThinkingNodes() {
    restoreThinkingNodesByKind("");
  }

  function scheduleThinkingScan(delayMs) {
    if (state.destroyed || !state.mounted || (!state.settings.thinkingInRussian && !state.settings.workLogInRussian)) return;
    if (!win || typeof win.setTimeout !== "function") {
      scanThinkingBlocks(false);
      return;
    }
    if (thinkingScanTimer) return;
    thinkingScanTimer = win.setTimeout(() => {
      thinkingScanTimer = null;
      if (!state.destroyed && state.mounted) scanThinkingBlocks(false);
    }, typeof delayMs === "number" ? delayMs : 140);
  }

  function applyTranslatedRun(runNodes, origParts, origJoined, trText, kind) {
    const full = wrapEdgeSpaces(origJoined, trText);
    const nowTs = Date.now();
    for (let k = 0; k < runNodes.length; k += 1) {
      const tn = runNodes[k];
      const nextVal = k === 0 ? full : "";
      applyThinkingNodeValue(tn, nextVal);
      const prev = thinkingNodeMap.get(tn);
      thinkingNodeMap.set(tn, {
        orig: origParts[k],
        translated: nextVal,
        applied: true,
        runJoined: origJoined,
        stableSince: prev ? prev.stableSince : nowTs,
        kind,
      });
      trackedThinkingNodes.add(tn);
    }
  }

  function scanThinkingBlocks(immediate) {
    if (state.destroyed || !doc) return;
    const wantThinking = Boolean(state.settings.thinkingInRussian);
    const wantWorkLog = Boolean(state.settings.workLogInRussian);
    if (!wantThinking && !wantWorkLog) {
      restoreAllThinkingNodes();
      return;
    }
    const { items: panels, thinkingPanelSet } = findExpandedThinkingPanels(wantThinking, wantWorkLog);
    if (panels.length === 0) return;

    const runs = [];
    const seenFirst = new Set();
    for (let i = 0; i < panels.length; i += 1) {
      const item = panels[i];
      const subRuns = [];
      const skipSet = item.kind === "worklog" && !wantThinking ? thinkingPanelSet : null;
      collectTranslatableThinkingRuns(item.panel, subRuns, skipSet);
      for (let k = 0; k < subRuns.length; k += 1) {
        const rn = subRuns[k];
        if (!rn || rn.length === 0 || seenFirst.has(rn[0])) continue;
        seenFirst.add(rn[0]);
        runs.push({ nodes: rn, kind: item.kind });
      }
    }
    if (runs.length === 0) return;

    const now = Date.now();
    const isGen = Boolean(state.telemetry && state.telemetry.isGenerating);
    const activeRespEl = state.telemetry ? state.telemetry.activeRespEl : null;
    const batch = [];
    const runGroups = new Map();
    let needsFollowup = false;
    let remainingReady = false;

    for (let i = 0; i < runs.length; i += 1) {
      const runNodes = runs[i].nodes;
      const kind = runs[i].kind;
      const origParts = [];
      let allAppliedSameRun = true;
      let latestStableSince = 0;

      for (let k = 0; k < runNodes.length; k += 1) {
        const tn = runNodes[k];
        const curVal = tn.nodeValue || "";
        let rec = thinkingNodeMap.get(tn);
        if (rec && rec.applied && curVal === rec.translated) {
          origParts.push(rec.orig);
          rec.kind = kind;
          if (rec.stableSince > latestStableSince) latestStableSince = rec.stableSince;
        } else {
          allAppliedSameRun = false;
          if (!rec || curVal !== rec.orig) {
            rec = { orig: curVal, translated: "", applied: false, runJoined: "", stableSince: now, kind };
            thinkingNodeMap.set(tn, rec);
          } else {
            rec.kind = kind;
          }
          origParts.push(curVal);
          if (rec.stableSince > latestStableSince) latestStableSince = rec.stableSince;
        }
      }

      const origJoined = origParts.join("");
      const core = origJoined.trim();
      if (!core) continue;

      const firstRec = thinkingNodeMap.get(runNodes[0]);
      if (allAppliedSameRun && firstRec && firstRec.runJoined === origJoined) {
        continue;
      }
      if (!spNeedsRuThinking(core)) continue;

      if (thinkingCache.has(core)) {
        const cached = thinkingCache.get(core);
        setThinkingCacheEntry(core, cached);
        applyTranslatedRun(runNodes, origParts, origJoined, cached, kind);
        continue;
      }

      if (thinkingInflight.has(core)) continue;

      const insideActiveResp = Boolean(
        activeRespEl && typeof activeRespEl.contains === "function" && activeRespEl.contains(runNodes[0])
      );
      const isReady = Boolean(immediate || !isGen || !insideActiveResp || now - latestStableSince >= 420);
      if (!isReady) {
        needsFollowup = true;
        continue;
      }

      if (!runGroups.has(core)) {
        if (batch.length >= 10) {
          remainingReady = true;
          continue;
        }
        batch.push(core);
        runGroups.set(core, []);
      }
      runGroups.get(core).push({ nodes: runNodes, origParts, origJoined, kind });
    }

    if (batch.length > 0) {
      for (let i = 0; i < batch.length; i += 1) thinkingInflight.add(batch[i]);
      invokeIpc("agy-studio:translate-thinking-batch", { texts: batch }).then((res) => {
        for (let i = 0; i < batch.length; i += 1) thinkingInflight.delete(batch[i]);
        if (state.destroyed || (!state.settings.thinkingInRussian && !state.settings.workLogInRussian)) return;
        const map = res && res.translations && typeof res.translations === "object" ? res.translations : null;
        if (map) {
          for (let i = 0; i < batch.length; i += 1) {
            const core = batch[i];
            const trText = map[core];
            if (typeof trText !== "string" || !trText.trim()) continue;
            setThinkingCacheEntry(core, trText);
            const list = runGroups.get(core) || [];
            for (let j = 0; j < list.length; j += 1) {
              const entry = list[j];
              if (entry.kind === "thinking" && !state.settings.thinkingInRussian) continue;
              if (entry.kind === "worklog" && !state.settings.workLogInRussian) continue;
              // Verify none of the nodes mutated externally while translation was in flight
              let stillIntact = true;
              for (let k = 0; k < entry.nodes.length; k += 1) {
                const tn = entry.nodes[k];
                const rec = thinkingNodeMap.get(tn);
                const curV = tn.nodeValue || "";
                const expectedV = rec && rec.applied ? rec.translated : entry.origParts[k];
                if (curV !== expectedV) {
                  stillIntact = false;
                  break;
                }
              }
              if (!stillIntact) continue;
              applyTranslatedRun(entry.nodes, entry.origParts, entry.origJoined, trText, entry.kind);
            }
          }
        }
        if (remainingReady) scheduleThinkingScan(60);
      });
    } else if (needsFollowup) {
      scheduleThinkingScan(460);
    }
  }

  function detectAuthScreen() {
    if (!doc || !doc.body || typeof doc.querySelector !== "function") return false;
    try {
      // If any normal workspace/chat element exists outside our host, we are inside the app (not on login/account switch)
      const wsNodes = doc.querySelectorAll('[data-testid="sidebar"], aside, [data-testid="model-selector-trigger"], [data-testid="user-message-bubble"], [data-testid="agent-response"], [data-testid="composer"], textarea, [contenteditable="true"]');
      for (let i = 0; wsNodes && i < wsNodes.length; i += 1) {
        const el = wsNodes[i];
        if (!el) continue;
        if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) continue;
        return false;
      }
      const candidates = doc.querySelectorAll("h1, h2, button, a, p");
      const authRe = /welcome\s+to\s+antigravity|добро\s+пожаловать\s+в\s+antigravity|continue\s+with\s+google|продолжить\s+через\s+google|use\s+business\s+account|использовать\s+бизнес-аккаунт|having\s+trouble\s+signing\s+in|не\s+удалось\s+войти|sign\s+in\s+to\s+antigravity|войти\s+в\s+antigravity/i;
      for (let i = 0; candidates && i < candidates.length && i < 48; i += 1) {
        const el = candidates[i];
        if (!el) continue;
        if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) continue;
        const t = String(el.textContent || "").trim();
        if (t && authRe.test(t)) return true;
      }
    } catch (_e) {}
    return false;
  }

  function syncAuthScreenVisibility() {
    const isAuth = detectAuthScreen();
    const prev = Boolean(state.onAuthScreen);
    state.onAuthScreen = isAuth;
    if (rootEl && rootEl.classList) {
      if (isAuth && typeof rootEl.classList.add === "function") rootEl.classList.add("is-auth-screen");
      else if (!isAuth && typeof rootEl.classList.remove === "function") rootEl.classList.remove("is-auth-screen");
    }
    if (isAuth && !prev) {
      if (state.usagePopOpen) { state.usagePopOpen = false; renderModelUsagePopover(); }
      if (state.agentPopoverOpen || state.contextPopoverOpen) {
        state.agentPopoverOpen = false;
        state.contextPopoverOpen = false;
        renderChatDockMount();
      }
      if (state.liveEditOpen) { state.liveEditOpen = false; renderPopoverStructure(); }
    } else if (!isAuth && prev) {
      state.lastQuotaScrapeSig = "";
      state.lastAutoQuotaPollAt = 0;
      pollQuotaSummaryIfDue(Date.now());
    }
    return isAuth;
  }

  function isSendButtonEl(el) {
    if (!el || typeof el.getAttribute !== "function") return false;
    if (el.getAttribute("data-rudex-comp-send") === "1") return true;
    const meta = `${el.getAttribute("data-testid") || ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""}`;
    return /\b(?:send|submit|queue|enqueue)\b|отправ|очеред/i.test(meta);
  }

  function findActiveVoiceDictationButton() {
    if (!doc || typeof doc.querySelectorAll !== "function") return null;
    try {
      const sel =
        '[data-rudex-comp-mic-active="1"], ' +
        'button[aria-label="Stop recording"], ' +
        'button[aria-label="Остановить запись"], ' +
        'button[data-tooltip-id="input-send-button-record-tooltip"].bg-red-500, ' +
        'button[aria-pressed="true"][aria-label*="dictat" i], ' +
        'button[aria-pressed="true"][aria-label*="record" i], ' +
        'button[aria-pressed="true"][aria-label*="запис" i], ' +
        'button[aria-pressed="true"][aria-label*="voice" i], ' +
        'button[aria-label*="stop dictat" i], ' +
        'button[aria-label*="stop record" i], ' +
        'button[aria-label*="cancel record" i], ' +
        'button[aria-label*="останов" i][aria-label*="запис" i], ' +
        'button[aria-label*="отмен" i][aria-label*="запис" i]';
      const nodes = doc.querySelectorAll(sel);
      for (let i = 0; nodes && i < nodes.length; i += 1) {
        const cand = nodes[i];
        if (!cand) continue;
        if (hostEl && typeof hostEl.contains === "function" && hostEl.contains(cand)) continue;
        if (isSendButtonEl(cand)) continue;
        return cand;
      }
    } catch (_e) {}
    return null;
  }

  function isVoiceDictationActive() {
    if (rudexOptimizer && typeof rudexOptimizer.isDictating === "function" && rudexOptimizer.isDictating()) {
      return true;
    }
    return Boolean(findActiveVoiceDictationButton());
  }

  function pollStream() {
    if (state.destroyed) return;
    if (doc && doc.hidden) return;
    const now = Date.now();
    const domMicActive = Boolean(findActiveVoiceDictationButton());
    const optCtrl = rudexOptimizer;
    if (optCtrl && typeof optCtrl.setDictating === "function") {
      if (domMicActive && !optCtrl.isDictating()) {
        state._domDictatingSync = true;
        optCtrl.setDictating(true);
      } else if (!domMicActive && state._domDictatingSync) {
        state._domDictatingSync = false;
        optCtrl.setDictating(false);
      }
    }
    const dictatingNow = domMicActive || Boolean(optCtrl && optCtrl.isDictating());
    const pauseForVoice = Boolean(dictatingNow && (!state.settings.optimization || state.settings.optimization.voicePauseHeavyUi !== false));
    if (pauseForVoice) {
      if (now - state.lastPollAt < 500) return;
      state.lastPollAt = now;
      return;
    }
    const curUrlSig = win && win.location ? `${win.location.pathname || ""}${win.location.search || ""}${win.location.hash || ""}` : "";
    const urlChanged = Boolean(curUrlSig && curUrlSig !== state.lastObservedUrlSig);
    if (curUrlSig) state.lastObservedUrlSig = curUrlSig;
    const isBusy = urlChanged || state.telemetry.isGenerating || (!dictatingNow && now - state.lastDomMutationAt < 3000);
    if (!isBusy && now - state.lastPollAt < (dictatingNow ? 550 : 600)) return;
    state.lastPollAt = now;

    if (syncAuthScreenVisibility()) {
      return;
    }

    sampleStreamTick();
    if (!dictatingNow) scrapeDomQuotaSnapshot(false);
    pollQuotaSummaryIfDue(now);
    checkAutoContinueMonitoring(now);
    if ((state.settings.thinkingInRussian || state.settings.workLogInRussian) && !dictatingNow) scanThinkingBlocks(false);
    updateLiveDom();
    syncChatDockLiveState();
    if (!dictatingNow && now - (state.lastHostMetricsAt || 0) > 900) {
      state.lastHostMetricsAt = now;
      const hm = measureHostUiMetrics();
      const mSig = `${hm.vw}|${hm.vh}|${hm.drawerRightReserve}|${hm.sidebarRight}|${hm.headerTop}|${hm.headerBottom}|${hm.headerRightClear}|${hm.composerLeft}|${hm.composerRight}`;
      if (mSig !== state.lastHostMetricsSig) {
        state.lastHostMetricsSig = mSig;
        applyWidgetPosition();
        if (!limitsResizeState && !limitsDragState) renderLimitsWidgetMount();
      }
    }
    if (!dictatingNow && typeof rv5InjectImageEditTriggers === "function" && now - state.lastImgInjectAt > 350) {
      state.lastImgInjectAt = now;
      rv5InjectImageEditTriggers(doc, state.locale !== "en", handleEditImageFromDom);
    }
    if (!dictatingNow && typeof rv5InjectNativeSettingsEntries === "function" && now - state.lastNativeInjectAt > 1600) {
      state.lastNativeInjectAt = now;
      rv5InjectNativeSettingsEntries(doc, state.locale !== "en", (tab, sub) => {
        if (sub && tab === "settings") state.settingsSubTab = sub;
        setOpen(true, { tab: tab || "appearance", subTab: sub });
        if (sub === "workshop") refreshWorkshopData();
      });
    }
  }

  function formatChatBadgeLabel() {
    const tr = t();
    if (state.activeChatKey === "__new__") return tr.chatScopeNew;
    const label = state.activeChatTitle || state.activeChatKey.slice(0, 12);
    return `${tr.chatScopeNamed} ${label}`;
  }

  function getDisplayedTps(tel) {
    return tel.isGenerating ? tel.currentTps : (tel.lastAvgTps || 0);
  }

  function getDisplayedPeakTps(tel) {
    return Math.max(tel.peakTps || 0, getDisplayedTps(tel) || 0);
  }

  function getDisplayedTpsUnit(tel, tr) {
    return !tel.isGenerating && tel.lastAvgTps > 0 ? `${tr.avgPrefix} ${tr.tpsUnit}` : tr.tpsUnit;
  }

  function findActivePresetLabel() {
    const id = state.chatPersona.activePreset;
    const customs = state.settings.customPresets || [];
    for (let i = 0; i < customs.length; i += 1) {
      if (customs[i].id === id) return customs[i].title;
    }
    return t().customPresetTitle;
  }

  function renderMiniCapsuleMarkup(isPreview) {
    const tr = t();
    const mf = state.settings.miniFields;
    const tel = state.telemetry;
    const chips = [];

    if (mf.status) {
      const label = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.statusWriting : tr.statusReady);
      chips.push(
        `<span class="status-chip"><span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span><span data-live="statusText">${escHtml(label)}</span></span>`
      );
    }
    if (mf.lang) {
      const langLabel = state.locale === "en" ? "EN" : "RU";
      if (isPreview) {
        chips.push(`<span class="lang-pill-btn">${langLabel}</span>`);
      } else {
        chips.push(
          `<button type="button" class="lang-pill-btn" data-action="toggle-locale" data-no-drag="1" title="${escAttr(tr.tooltipLang)}">${langLabel}</button>`
        );
      }
    }
    if (mf.tps) {
      const val = getDisplayedTps(tel);
      const tag = getDisplayedTpsUnit(tel, tr);
      chips.push(`<span class="metric-chip num"><b data-live="tps">${val}</b> <span data-live="tpsUnit">${escHtml(tag)}</span></span>`);
    }
    if (mf.respTokens) {
      const rStr = tel.exactRespTokens > 0 ? formatCompact(tel.exactRespTokens) : `~${formatCompact(tel.respTokens)}`;
      chips.push(`<span class="metric-chip is-muted num">${escHtml(tr.respLabel)}: <b data-live="resp">${escHtml(rStr)}</b></span>`);
    }
    if (mf.chatTokens) {
      const chatText = tel.contextLabel || (tel.exactContextTokens > 0 ? formatCompact(tel.exactContextTokens) : `~${formatCompact(tel.chatTokens)}`);
      chips.push(`<span class="metric-chip is-muted num">${escHtml(tr.chatLabel)}: <b data-live="chat">${escHtml(chatText)}</b></span>`);
    }
    if (mf.model) {
      const modelTxt = tel.modelName || "AI";
      chips.push(`<span class="model-badge" data-live="model" title="${escAttr(modelTxt)}">${escHtml(modelTxt)}</span>`);
    }
    if (mf.quota) {
      const qd = getActiveChatQuotaDisplay();
      chips.push(`<span class="metric-chip is-muted num" data-live="quotaMini">${escHtml(qd.miniText)}</span>`);
    }

    if (chips.length === 0) {
      chips.push(`<span class="status-chip"><span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>Rudex</span>`);
    }

    const isPinned = Boolean(state.settings.pinned);
    const joined = chips.join('<span class="pill-sep"></span>');
    const grip = `<span class="drag-grip">${iconSvg("grip", 12)}</span>`;
    const btns = isPreview
      ? `<span class="pill-actions"><span class="icon-btn">${iconSvg("expand", 12)}</span><span class="icon-btn${isPinned ? " is-pinned" : ""}">${iconSvg("pin", 12)}</span><span class="icon-btn is-primary">${iconSvg("gear", 12)}</span></span>`
      : `<span class="pill-actions"><button type="button" class="icon-btn" data-action="to-medium" data-no-drag="1" title="${escAttr(tr.tooltipExpand)}">${iconSvg("expand", 12)}</button><button type="button" class="icon-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-no-drag="1" title="${escAttr(isPinned ? tr.tooltipPinUnlock : tr.tooltipPinLock)}">${iconSvg("pin", 12)}</button><button type="button" class="icon-btn is-primary" data-action="open-settings" data-no-drag="1" title="${escAttr(tr.tooltipSettings)}">${iconSvg("gear", 12)}</button></span>`;

    const bodyAttrs = isPreview ? "" : ` data-widget-body="1"${isPinned ? "" : ' data-drag-handle="1"'}`;
    return `<div class="mini-pill"${bodyAttrs}>${grip}${joined}${btns}</div>`;
  }

  function renderMediumCardMarkup(isPreview) {
    const tr = t();
    const tel = state.telemetry;
    const isPinned = Boolean(state.settings.pinned);
    const phase = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const chatVal = tel.contextLabel || (tel.exactContextTokens > 0 ? `${formatCompact(tel.exactContextTokens)} ${tr.tokShort}` : `~${formatCompact(tel.chatTokens)} ${tr.tokShort}`);
    const respVal = tel.exactRespTokens > 0 ? `${formatCompact(tel.exactRespTokens)} ${tr.tokShort}` : `~${formatCompact(tel.respTokens)} ${tr.tokShort}`;
    const personaName = findActivePresetLabel();
    const personaLabel = state.chatPersona.enabled ? `${tr.personaBadgeOn} ${personaName}` : tr.personaBadgeOff;
    const langText = state.locale === "en" ? "EN" : "RU";
    const shownTps = getDisplayedTps(tel);
    const shownUnit = getDisplayedTpsUnit(tel, tr);
    const bodyAttrs = isPreview ? "" : ` data-widget-body="1"${isPinned ? "" : ' data-drag-handle="1"'}`;
    const headActionsHtml = isPreview
      ? `<span class="lang-pill-btn">${langText}</span>
         <span class="pill-actions">
           <span class="icon-btn${isPinned ? " is-pinned" : ""}">${iconSvg("pin", 12)}</span>
           <span class="icon-btn">${iconSvg("minimize", 12)}</span>
           <span class="icon-btn is-primary">${iconSvg("gear", 12)}</span>
         </span>`
      : `<button type="button" class="lang-pill-btn" data-action="toggle-locale" data-no-drag="1" title="${escAttr(tr.tooltipLang)}">${langText}</button>
         <span class="pill-actions">
           <button type="button" class="icon-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-no-drag="1" title="${escAttr(isPinned ? tr.tooltipPinUnlock : tr.tooltipPinLock)}">${iconSvg("pin", 12)}</button>
           <button type="button" class="icon-btn" data-action="to-mini" data-no-drag="1" title="${escAttr(tr.tooltipMini)}">${iconSvg("minimize", 12)}</button>
           <button type="button" class="icon-btn is-primary" data-action="open-settings" data-no-drag="1" title="${escAttr(tr.tooltipSettings)}">${iconSvg("gear", 12)}</button>
         </span>`;
    const personaElHtml = isPreview
      ? `<span class="med-persona-pill">
           <span class="status-dot" style="background:${state.chatPersona.enabled ? "var(--rx-success)" : "var(--rx-muted)"};box-shadow:none"></span>
           <span>${escHtml(personaLabel)}</span>
         </span>`
      : `<button type="button" class="med-persona-pill" data-action="open-persona-tab" data-no-drag="1">
           <span class="status-dot" style="background:${state.chatPersona.enabled ? "var(--rx-success)" : "var(--rx-muted)"};box-shadow:none"></span>
           <span>${escHtml(personaLabel)}</span>
         </button>`;

    return `
      <div class="med-card"${bodyAttrs}>
        <div class="med-header">
          <div class="med-head-left">
            <span class="drag-grip">${iconSvg("grip", 12)}</span>
            <span class="med-status-badge">
              <span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>
              <span class="med-phase" data-live="phase">${escHtml(phase)}</span>
            </span>
          </div>
          <div class="med-head-actions">
            ${headActionsHtml}
          </div>
        </div>
        <div class="med-body">
          <div class="med-telemetry-stage">
            <div class="med-tps-row">
              <div class="med-tps-hero">
                <span class="med-tps-num num" data-live="tps">${shownTps}</span>
                <span class="med-tps-unit" data-live="tpsUnit">${escHtml(shownUnit)}</span>
              </div>
              <span class="med-peak-pill num">${escHtml(tr.peakLabel)} <b data-live="peak">${getDisplayedPeakTps(tel)}</b></span>
            </div>
            <div class="med-spark-box" data-live="sparkMed">${buildSparklineMarkup(tel.samples, 260, 40, isPreview ? "medPrev" : "med")}</div>
          </div>
          <div class="med-stats-grid">
            <div class="med-stat-tile">
              <span class="med-stat-label">${escHtml(tr.kpiResp)}</span>
              <span class="med-stat-val num" data-live="resp">${escHtml(respVal)}</span>
            </div>
            <div class="med-stat-tile">
              <span class="med-stat-label">${escHtml(tr.kpiChat)}</span>
              <span class="med-stat-val num" data-live="chat">${escHtml(chatVal)}</span>
            </div>
          </div>
          <div class="med-quota-card">
            <span>${escHtml(tr.quotaSectionTitle)}</span>
            <span class="num med-quota-val" style="color:var(--rx-theme-fg-strong, var(--rx-fg-strong));font-weight:600" data-live="quotaMed">${escHtml(getActiveChatQuotaDisplay().miniText)}</span>
          </div>
          <div class="med-footer">
            <span class="med-model-tag" data-live="model" title="${escAttr(tel.modelName || tr.modelUnknown)}">${escHtml(tel.modelName || "—")}</span>
            ${personaElHtml}
          </div>
        </div>
      </div>
    `;
  }

  function refreshMediaLibrary() {
    return invokeIpc("agy-studio:list-media").then((res) => {
      if (state.destroyed) return;
      if (res && res.ok && Array.isArray(res.items)) {
        state.mediaLibrary = res.items.slice(0, 20);
        if (state.isOpen && state.activeTab === "appearance" && state.appearanceSubTab === "wallpaper") {
          renderStructure();
        }
      }
    });
  }

  function cleanupTempUploadedMedia() {
    if (!Array.isArray(state.tempUploadedMediaFiles) || state.tempUploadedMediaFiles.length === 0) return;
    const protectedFiles = new Set();
    const savedFile = state.settings.appearance && state.settings.appearance.wallpaper ? state.settings.appearance.wallpaper.mediaFile : "";
    const draftFile = state.appearanceDraft && state.appearanceDraft.wallpaper ? state.appearanceDraft.wallpaper.mediaFile : "";
    if (savedFile) protectedFiles.add(savedFile);
    if (draftFile) protectedFiles.add(draftFile);
    const profiles = Array.isArray(state.settings.appearanceProfiles) ? state.settings.appearanceProfiles : [];
    for (let i = 0; i < profiles.length; i += 1) {
      const pf = profiles[i] && profiles[i].appearance && profiles[i].appearance.wallpaper
        ? profiles[i].appearance.wallpaper.mediaFile
        : "";
      if (pf) protectedFiles.add(pf);
    }
    const list = state.tempUploadedMediaFiles.slice();
    state.tempUploadedMediaFiles = [];
    for (let i = 0; i < list.length; i += 1) {
      const f = list[i];
      if (f && !protectedFiles.has(f)) {
        invokeIpc("agy-studio:delete-media", { fileName: f });
      }
    }
  }

  function spBuildWallpaperFilterCss(wp) {
    const parts = [];
    if (wp.blur > 0) parts.push(`blur(${wp.blur}px)`);
    if (wp.brightness !== 100) parts.push(`brightness(${wp.brightness}%)`);
    if (wp.contrast !== 100) parts.push(`contrast(${wp.contrast}%)`);
    if (wp.saturate !== 100) parts.push(`saturate(${wp.saturate}%)`);
    if (wp.hue !== 0) parts.push(`hue-rotate(${wp.hue}deg)`);
    return parts.length > 0 ? parts.join(" ") : "none";
  }

  function spBuildWallpaperTransformCss(wp) {
    const baseScale = wp.scale / 100;
    const effScale = wp.blur > 0 ? (wp.scale >= 100 ? Math.max(baseScale, 1.06) : baseScale * 1.04) : baseScale;
    const parts = [];
    if (wp.offsetX !== 0 || wp.offsetY !== 0) parts.push(`translate3d(${wp.offsetX}%, ${wp.offsetY}%, 0)`);
    if (wp.rotate !== 0) parts.push(`rotate(${wp.rotate}deg)`);
    if (wp.flipX || wp.flipY) {
      const sx = wp.flipX ? -effScale : effScale;
      const sy = wp.flipY ? -effScale : effScale;
      parts.push(`scale(${sx.toFixed(2)}, ${sy.toFixed(2)})`);
    } else if (Math.abs(effScale - 1) > 0.001) {
      parts.push(`scale(${effScale.toFixed(2)})`);
    }
    return parts.length > 0 ? parts.join(" ") : "none";
  }

  function spBuildGradientPreviewCss(wp) {
    const c1 = (wp.gradColors && wp.gradColors[0]) || "#0f172a";
    const c2 = (wp.gradColors && wp.gradColors[1]) || "#1e1b4b";
    const c3 = (wp.gradColors && wp.gradColors[2]) || "#09090b";
    if (wp.gradStyle === "radial") return `radial-gradient(circle at ${wp.posX}% ${wp.posY}%, ${c1} 0%, ${c2} 52%, ${c3} 100%)`;
    if (wp.gradStyle === "mesh") return `radial-gradient(at 25% 25%, ${c1} 0px, transparent 58%), radial-gradient(at 78% 72%, ${c2} 0px, transparent 60%), radial-gradient(at 50% 90%, ${c1} 0px, ${c3} 72%)`;
    return `linear-gradient(${wp.gradAngle}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`;
  }

  function updateLiveWallpaperPreviewDom() {
    if (!modalMountEl) return;
    const wp = spNormalizeAppearance(state.appearanceDraft).wallpaper;
    const mediaEl = modalMountEl.querySelector('[data-wp-role="media"]');
    if (mediaEl) {
      const posStr = `${wp.posX}% ${wp.posY}%`;
      mediaEl.style.objectFit = wp.fit || "cover";
      mediaEl.style.objectPosition = posStr;
      mediaEl.style.transformOrigin = posStr;
      mediaEl.style.filter = spBuildWallpaperFilterCss(wp);
      mediaEl.style.opacity = String(wp.opacity / 100);
      mediaEl.style.transform = spBuildWallpaperTransformCss(wp);
      if (mediaEl.tagName === "VIDEO") {
        try { mediaEl.playbackRate = wp.playbackRate || 1; } catch (_e) {}
      }
    }
    const dot = modalMountEl.querySelector('[data-wp-role="focusDot"]');
    if (dot) {
      dot.style.left = `${wp.posX}%`;
      dot.style.top = `${wp.posY}%`;
    }
    const scrim = modalMountEl.querySelector('[data-wp-role="scrim"]');
    if (scrim) {
      scrim.style.backgroundColor = `rgba(6, 7, 10, ${wp.dim / 100})`;
    }
    const vig = modalMountEl.querySelector('[data-wp-role="vignette"]');
    if (vig) {
      const innerStop = Math.max(15, 65 - Math.round(wp.vignette * 0.45));
      vig.style.backgroundImage = wp.vignette > 0
        ? `radial-gradient(ellipse at center, transparent ${innerStop}%, rgba(0, 0, 0, ${(wp.vignette / 100).toFixed(2)}) 100%)`
        : "none";
    }
    const tint = modalMountEl.querySelector('[data-wp-role="tint"]');
    if (tint) {
      tint.style.backgroundImage = wp.tintEnabled ? spBuildGradientPreviewCss(wp) : "none";
      tint.style.opacity = wp.tintEnabled ? String(wp.tintOpacity / 100) : "0";
      tint.style.mixBlendMode = wp.tintBlend || "normal";
    }
    const hud = modalMountEl.querySelector('[data-wp-role="hudCoords"]');
    if (hud) {
      hud.textContent = state.wpDragMode === "offset"
        ? `dX:${wp.offsetX}% · dY:${wp.offsetY}% · ${wp.scale}%`
        : `X:${wp.posX}% · Y:${wp.posY}% · ${wp.scale}%`;
    }
  }

  function updateLiveCornersPreviewDom() {
    if (!modalMountEl) return;
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const c = typeof teResolveCornerRadii === "function"
      ? teResolveCornerRadii(draft)
      : {
          messages: draft.corners.mode === "custom" ? draft.corners.messages : draft.corners.all,
          composer: draft.corners.mode === "custom" ? draft.corners.composer : draft.corners.all,
          buttons: draft.corners.mode === "custom" ? draft.corners.buttons : draft.corners.all,
          cards: draft.corners.mode === "custom" ? draft.corners.cards : draft.corners.all,
          code: draft.corners.mode === "custom" ? draft.corners.code : draft.corners.all,
          sidebar: draft.corners.mode === "custom" ? draft.corners.sidebar : draft.corners.all,
          overlays: draft.corners.mode === "custom" ? draft.corners.overlays : draft.corners.all,
          inputs: draft.corners.mode === "custom" ? draft.corners.inputs : draft.corners.all,
        };
    const setRad = (sel, val) => {
      const list = modalMountEl.querySelectorAll(sel);
      for (let i = 0; i < list.length; i += 1) list[i].style.borderRadius = `${val}px`;
    };
    setRad('[data-cp-role="sidebar"]', Math.min(18, c.sidebar));
    setRad('[data-cp-role="nav"]', Math.max(0, c.sidebar - 2));
    setRad('[data-cp-role="bubble"]', c.messages);
    setRad('[data-cp-role="card"]', c.cards);
    setRad('[data-cp-role="code"]', c.code);
    setRad('[data-cp-role="composer"]', c.composer);
    setRad('[data-cp-role="btn"]', c.buttons);
    setRad('[data-cp-role="popup"]', c.overlays);
    setRad('[data-cp-role="input"]', c.inputs);
  }

  function formatSparkFootMeta(tel, tr) {
    const parts = [];
    if (tel.exactCacheTokens > 0) parts.push(`${tr.cacheLabel}: ${formatCompact(tel.exactCacheTokens)}`);
    if (tel.lastDurSec > 0) parts.push(`${tel.lastDurSec}${tr.secUnit}`);
    if (tel.lastThinkingSec > 0) parts.push(`${tel.lastThinkingSec}${tr.secUnit} ${tr.thinkUnit}`);
    return parts.join(" · ");
  }

  function renderMonitorTab() {
    const tr = t();
    const tel = state.telemetry;
    const chatNum = tel.contextLabel || (tel.exactContextTokens > 0 ? formatCompact(tel.exactContextTokens) : `~${formatCompact(tel.chatTokens)}`);
    const respNum = tel.exactRespTokens > 0 ? formatCompact(tel.exactRespTokens) : `~${formatCompact(tel.respTokens)}`;
    const phase = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const shownTps = getDisplayedTps(tel);
    const shownUnit = getDisplayedTpsUnit(tel, tr);
    const footMeta = formatSparkFootMeta(tel, tr);
    return `
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiTps)}</span>
          <span class="kpi-val num"><span data-live="tps">${shownTps}</span><span class="kpi-unit is-accent" data-live="tpsUnit">${escHtml(shownUnit)}</span></span>
          <span class="kpi-sub" data-live="kpiState">${escHtml(tel.isGenerating ? tr.kpiSubLive : tr.kpiSubReady)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiPeak)}</span>
          <span class="kpi-val num"><span data-live="peak">${getDisplayedPeakTps(tel)}</span><span class="kpi-unit">TPS</span></span>
          <span class="kpi-sub">${escHtml(tr.kpiSubPeak)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiResp)}</span>
          <span class="kpi-val num"><span data-live="respNum">${escHtml(respNum)}</span><span class="kpi-unit">${escHtml(tr.tokShort)}</span></span>
          <span class="kpi-sub" data-live="respSub">${escHtml(tel.exactRespTokens > 0 ? tr.kpiSubExact : tr.kpiSubEst)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiChat)}</span>
          <span class="kpi-val num"><span data-live="chatNum">${escHtml(chatNum)}</span><span class="kpi-unit" data-live="chatUnit" style="${tel.contextLabel ? "display:none" : ""}">${escHtml(tr.tokShort)}</span></span>
          <span class="kpi-sub" data-live="chatSub">${escHtml(tel.exactContextTokens > 0 ? tr.kpiSubExact : tr.kpiSubEst)}</span>
        </div>
      </div>

      <div class="card card-pad">
        <div class="spark-panel-head">
          <div class="spark-meta">
            <span class="status-chip" style="flex-shrink:0">
              <span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>
              <span data-live="phase">${escHtml(phase)}</span>
            </span>
            <span class="layer-sep">·</span>
            <span class="spark-model-inline" title="${escAttr(tel.modelName || tr.modelUnknown)}" data-live="model">${escHtml(tel.modelName || tr.modelUnknown)}</span>
          </div>
          <button type="button" class="btn btn-sm btn-ghost" data-action="reset-telemetry">${iconSvg("reset", 12)}${escHtml(tr.resetStats)}</button>
        </div>
        <div class="modal-spark-box" data-live="sparkModal">${buildSparklineMarkup(tel.samples, 560, 102, "modal")}</div>
        <div class="spark-card-foot">
          <span class="spark-chat-label" data-live="chatBadge">${escHtml(formatChatBadgeLabel())}</span>
          <span class="num" style="flex-shrink:0" data-live="sparkFootMeta">${escHtml(footMeta)}</span>
        </div>
      </div>

      <div class="quota-strip">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="row-title" style="font-size:12px">${escHtml(tr.quotaSectionTitle)}</span>
          <span class="layer-sep">·</span>
          <span class="num" style="font-size:11.5px;color:var(--rx-fg-strong);font-weight:550" data-live="quotaMed">${escHtml(getActiveChatQuotaDisplay().miniText)}</span>
        </div>
        <button type="button" class="btn btn-sm" data-action="open-export-limits">${escHtml(tr.quotaOpenLimitsLink)}</button>
      </div>
    `;
  }

  function renderAppearanceDrawerBody() {
    const tr = t();
    const isRu = state.locale !== "en";
    const sub = state.appearanceSubTab || "theme";
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const presetObj = spFindThemePreset(draft.presetId);
    const wp = draft.wallpaper;
    const grads = spGetGradientPresets();

    const themeLabel = presetObj ? (isRu ? presetObj.nameRu : presetObj.nameEn) : draft.presetId;
    const usObj = draft.uiStyle || spDefaultUiStyle();
    const uiStylePresets = spGetUiStylePresets();
    const usPresetFound = uiStylePresets.find((p) => p.id === usObj.preset);
    const uiStyleShortLabel = usPresetFound
      ? (isRu ? usPresetFound.nameRu : usPresetFound.nameEn)
      : (isRu ? "Микс" : "Mix");
    const effAccent = draft.customAccent ? draft.accentColor : ((presetObj && presetObj.vars && presetObj.vars.accentColor) || draft.accentColor);
    const wpMap = { none: tr.appWpNone, gradient: tr.appWpGradient, image: tr.appWpImage, video: tr.appWpVideo };
    let wpLabel = wpMap[wp.type] || tr.appWpNone;
    if (wp.type === "gradient") {
      const gp = grads.find((g) => g.id === wp.gradientPreset);
      if (gp) wpLabel = isRu ? gp.nameRu : gp.nameEn;
    } else if ((wp.type === "image" || wp.type === "video") && wp.tintEnabled) {
      wpLabel += ` + ${tr.appWpGradient}`;
    }

    let inner = "";
    if (sub === "theme") inner = renderAppearanceThemeSub(tr, isRu);
    else if (sub === "uistyle") inner = renderAppearanceUiStyleSub(tr, isRu);
    else if (sub === "elements" && typeof rv5RenderElementsBuilderHtml === "function") {
      inner = rv5RenderElementsBuilderHtml({
        draft,
        customLabels: state.settings.customLabels || [],
        isRu,
        pickerActive: state.pickerActive,
        canUndo: state.appearanceUndoStack.length > 0,
        canRedo: state.appearanceRedoStack.length > 0,
        newLabelMatch: state.newLabelMatch,
        newLabelText: state.newLabelText,
      });
    }
    else if (sub === "wallpaper") inner = renderAppearanceWallpaperSub(tr, isRu);
    else if (sub === "corners") inner = renderAppearanceCornersSub(tr, isRu);
    else if (sub === "surface") inner = renderAppearanceSurfaceSub(tr, isRu);
    else if (sub === "greeting") inner = renderAppearanceGreetingSub(tr, isRu);
    else inner = renderAppearanceTextSub(tr, isRu);

    return `
      <div class="layer-summary-strip">
        <button type="button" class="layer-pill${sub === "theme" ? " is-active" : ""}" data-action="set-app-subtab" data-val="theme">
          <span class="layer-dot" style="background:${escAttr(effAccent)}"></span>
          <span>${escHtml(themeLabel)}</span>
        </button>
        <span class="layer-sep">·</span>
        <button type="button" class="layer-pill${sub === "uistyle" ? " is-active" : ""}" data-action="set-app-subtab" data-val="uistyle">
          <span>${escHtml(uiStyleShortLabel)}</span>
        </button>
        ${wp.type !== "none" ? `
          <span class="layer-sep">·</span>
          <button type="button" class="layer-pill${sub === "wallpaper" ? " is-active" : ""}" data-action="set-app-subtab" data-val="wallpaper">
            <span>${escHtml(wpLabel)}</span>
          </button>
        ` : ""}
        <button type="button" class="layer-pill" style="margin-left:auto" data-action="start-element-picker" title="${escAttr(isRu ? "Ткнуть в элемент Antigravity" : "Pick any Antigravity element")}">
          ${iconSvg("crosshair", 12)}<span>${escHtml(isRu ? "Прицел" : "Picker")}</span>
        </button>
        <button type="button" class="layer-pill" data-action="start-region-picker" title="${escAttr(isRu ? "Выделить область рамкой (сразу 2+ окна синхронно)" : "Drag region to select 2+ windows synchronously")}">
          <span>▢ ${escHtml(isRu ? "Область" : "Region")}</span>
        </button>
      </div>
      ${inner}
    `;
  }

  function buildUiStyleLivePreviewStyles(us) {
    const isCC = us.composer === "claude-code";
    const isCodex = us.composer === "codex";
    const isOC = us.composer === "opencode";
    const compRad = us.composerRadius > 0
      ? us.composerRadius
      : (isCC ? 14 : (isCodex ? 20 : (isOC ? 6 : 12)));
    const compPadY = us.composerPadY > 0
      ? Math.max(6, Math.min(18, Math.round(us.composerPadY * 0.78)))
      : (isCodex ? 10 : (isCC ? 9 : (isOC ? 7 : 8)));
    const compShadow = us.composerShadow === "none"
      ? "none"
      : (us.composerShadow === "elevated" || (us.composerShadow === "preset" && isCodex)
          ? "0 8px 22px -6px rgba(0, 0, 0, 0.42)"
          : (us.composerShadow === "soft"
              ? "0 2px 10px rgba(0, 0, 0, 0.18)"
              : "none"));
    const sendRad = isOC ? "5px" : "999px";
    const sendStyle = isCodex
      ? `border-radius:999px;background:var(--rx-fg-strong);color:var(--rx-bg);`
      : `border-radius:${sendRad};`;

    const effAlign = us.userBubbleAlign !== "preset"
      ? us.userBubbleAlign
      : (us.chat === "opencode" ? "full" : "right");
    const bubRad = us.chat === "opencode" ? 6 : (us.chat === "codex" ? 16 : (us.chat === "claude-code" ? 13 : 11));
    const bubMaxW = effAlign === "full"
      ? "100%"
      : (us.userBubbleMaxWidth >= 45 ? `${us.userBubbleMaxWidth}%` : (us.chat === "claude-code" ? "72%" : "80%"));
    const bubSelf = effAlign === "left" ? "flex-start" : (effAlign === "full" ? "stretch" : "flex-end");
    const bubLeftBrd = us.chat === "opencode" ? "3px solid var(--rx-accent)" : "";
    const gapPx = us.chatGap >= 4 ? Math.max(4, Math.min(20, Math.round(us.chatGap * 0.75))) : 7;
    const showAgentBar = us.agentAccentBar === "on" || (us.agentAccentBar === "preset" && us.chat === "opencode");

    const effModelBtn = us.modelBtnStyle !== "preset"
      ? us.modelBtnStyle
      : (us.modelSelector === "claude-code" ? "ghost" : (us.modelSelector === "codex" ? "pill" : (us.modelSelector === "opencode" ? "mono" : "bordered")));
    let modelStyle = "background:var(--rx-surface-2);border:1px solid var(--rx-border-strong);border-radius:7px;";
    if (effModelBtn === "ghost") {
      modelStyle = "background:transparent;border:1px solid transparent;border-radius:6px;padding:1px 4px;";
    } else if (effModelBtn === "pill") {
      modelStyle = "background:var(--rx-surface-2);border:1px solid var(--rx-border-strong);border-radius:999px;padding:2px 9px;";
    } else if (effModelBtn === "mono") {
      modelStyle = "background:var(--rx-bg);border:1px solid var(--rx-border-strong);border-left:2.5px solid var(--rx-accent);border-radius:5px;font-family:var(--rx-font-mono);font-size:10px;";
    }

    const wrapWidth = us.composerMaxWidth >= 560
      ? `width:${Math.max(66, Math.min(100, Math.round((us.composerMaxWidth / 1120) * 100)))}%;margin-inline:auto;`
      : "";

    let compWrapStyle = wrapWidth;
    let inputRowStyle = "";
    let toolbarStyle = "";

    if (isCC) {
      // Split Claude Code: outer container transparent, top input row is the rounded bordered bar, bottom toolbar is outside on canvas
      compWrapStyle += "background:transparent;border:none;padding:0;box-shadow:none;";
      inputRowStyle = `background:var(--rx-surface);border:1px solid var(--rx-border-strong);border-radius:${compRad}px;padding:${compPadY}px 11px;box-shadow:${compShadow};`;
      toolbarStyle = "padding:6px 4px 0;background:transparent;border:none;";
    } else if (isCodex) {
      compWrapStyle += `background:var(--rx-surface);border:1.5px solid var(--rx-border-strong);border-radius:${compRad}px;overflow:hidden;box-shadow:${compShadow};padding:0;`;
      inputRowStyle = `padding:${compPadY}px 12px;`;
      toolbarStyle = "padding:6px 11px;border-top:1px solid var(--rx-border);background:color-mix(in srgb, var(--rx-fg) 3%, transparent);";
    } else if (isOC) {
      compWrapStyle += `background:var(--rx-surface);border:1px solid var(--rx-border-strong);border-left:3px solid var(--rx-accent);border-radius:${compRad}px;overflow:hidden;box-shadow:${compShadow};padding:0;`;
      inputRowStyle = `padding:${compPadY}px 10px;`;
      toolbarStyle = "padding:5px 10px;border-top:1px solid var(--rx-border);background:color-mix(in srgb, var(--rx-bg) 55%, transparent);font-family:var(--rx-font-mono);";
    } else {
      compWrapStyle += `background:var(--rx-surface);border:1px solid var(--rx-border-strong);border-radius:${compRad}px;padding:${compPadY}px 11px;box-shadow:${compShadow};gap:7px;`;
      inputRowStyle = "padding:0;";
      toolbarStyle = "padding:0;";
    }

    const bubStyle = [
      `border-radius:${bubRad}px`,
      `max-width:${bubMaxW}`,
      `align-self:${bubSelf}`,
      effAlign === "full" ? "width:100%" : "",
      bubLeftBrd ? `border-left:${bubLeftBrd}` : "",
    ].filter(Boolean).join(";");

    const agentStyle = showAgentBar
      ? "border-left:2px solid color-mix(in srgb, var(--rx-accent) 55%, transparent);padding-left:9px;"
      : "";

    return { compWrapStyle, inputRowStyle, toolbarStyle, bubStyle, agentStyle, modelStyle, sendStyle, gapPx };
  }

  function updateLiveUiStylePreviewDom() {
    if (!modalMountEl) return;
    const stage = modalMountEl.querySelector('[data-live="uiStyleStage"]');
    if (!stage) return;
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const us = draft.uiStyle || spDefaultUiStyle();
    const st = buildUiStyleLivePreviewStyles(us);
    const chatEl = stage.querySelector('[data-live="uiStyleChat"]');
    const userEl = stage.querySelector('[data-live="uiStyleUser"]');
    const agentEl = stage.querySelector('[data-live="uiStyleAgent"]');
    const compEl = stage.querySelector('[data-live="uiStyleComposer"]');
    const inRowEl = stage.querySelector('[data-live="uiStyleInputRow"]');
    const barEl = stage.querySelector('[data-live="uiStyleToolbar"]');
    const modelEl = stage.querySelector('[data-live="uiStyleModel"]');
    const sendEl = stage.querySelector('[data-live="uiStyleSend"]');
    if (chatEl) chatEl.style.gap = `${st.gapPx}px`;
    if (userEl) userEl.setAttribute("style", st.bubStyle);
    if (agentEl) agentEl.setAttribute("style", st.agentStyle);
    if (compEl) compEl.setAttribute("style", st.compWrapStyle);
    if (inRowEl) inRowEl.setAttribute("style", st.inputRowStyle);
    if (barEl) barEl.setAttribute("style", st.toolbarStyle);
    if (modelEl) modelEl.setAttribute("style", st.modelStyle);
    if (sendEl) sendEl.setAttribute("style", st.sendStyle);
  }

  function renderAppearanceUiStyleSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const us = draft.uiStyle || spDefaultUiStyle();
    const presets = spGetUiStylePresets();
    const hasCustom = typeof teHasCustomUiStyle === "function"
      ? teHasCustomUiStyle(draft)
      : (us.preset !== "antigravity" || us.composer !== "antigravity" || us.chat !== "antigravity" || us.modelSelector !== "antigravity");
    const fineOpen = state.openDisclosures.uiStyleFine !== false;
    const st = buildUiStyleLivePreviewStyles(us);
    const autoLbl = isRu ? "По стилю" : "Preset";

    const partName = (id) => {
      const f = presets.find((p) => p.id === id);
      return f ? (isRu ? f.nameRu : f.nameEn) : "Antigravity";
    };

    const zoneDefs = [
      { key: "composer", label: isRu ? "Поле ввода (Композер)" : "Message Composer", cur: us.composer },
      { key: "chat", label: isRu ? "Чат, баблы и шаги агента" : "Chat, Bubbles & Agent Steps", cur: us.chat },
      { key: "modelSelector", label: isRu ? "Кнопка и меню моделей" : "Model Button & Dropdown", cur: us.modelSelector },
    ];

    const optBtn = (field, val, curVal, lbl) =>
      `<button type="button" class="uistyle-opt-btn${curVal === val ? " is-active" : ""}" data-action="set-uistyle-opt" data-field="${field}" data-val="${val}">${escHtml(lbl)}</button>`;

    const placeholderTxt = us.composer === "claude-code"
      ? (isRu ? "Ответить…" : "Reply…")
      : (us.composer === "opencode"
          ? (isRu ? "введите задачу или /команду…" : "ask anything or /command…")
          : (isRu ? "Спросите что угодно, @ — упомянуть…" : "Ask anything, @ to mention…"));
    const modelSample = us.modelSelector === "claude-code"
      ? "Opus 5.5 Extra"
      : (us.modelSelector === "codex"
          ? "GPT-5 Codex · High"
          : (us.modelSelector === "opencode" ? "opencode/sonnet-4.5" : "Gemini 4 Neon"));

    const isCC = us.composer === "claude-code";
    const toolbarInnerHtml = isCC
      ? `
        <span class="uistyle-live-tools-l"><span>+</span>${iconSvg("mic", 11)}</span>
        <span class="uistyle-live-tools-r">
          <span class="uistyle-live-model" data-live="uiStyleModel" style="${escAttr(st.modelStyle)}">${escHtml(modelSample)}</span>
          <span class="uistyle-live-mode">${isRu ? "Турбо" : "Turbo"}</span>
        </span>`
      : `
        <span class="uistyle-live-tools-l">
          <span>+</span>
          <span class="uistyle-live-model" data-live="uiStyleModel" style="${escAttr(st.modelStyle)}">${escHtml(modelSample)} ▾</span>
        </span>
        <span class="uistyle-live-tools-r">
          <span class="uistyle-live-send" data-live="uiStyleSend" style="${escAttr(st.sendStyle)}">↑</span>
        </span>`;

    return `
      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span class="section-label">${isRu ? "Живое превью стиля" : "Live Style Specimen"}</span>
          ${hasCustom ? `<button type="button" class="btn btn-sm btn-ghost" style="padding:2px 8px;font-size:11px" data-action="reset-uistyle">${isRu ? "Сбросить к Antigravity" : "Reset to Antigravity"}</button>` : ""}
        </div>
        <div class="uistyle-live-stage" data-live="uiStyleStage">
          <div class="uistyle-live-chat" data-live="uiStyleChat" style="gap:${st.gapPx}px">
            <div class="uistyle-live-user" data-live="uiStyleUser" style="${escAttr(st.bubStyle)}">${escHtml(isRu ? "Сделай стиль чата как в любимой IDE" : "Match my favorite coding IDE style")}</div>
            <div class="uistyle-live-agent" data-live="uiStyleAgent" style="${escAttr(st.agentStyle)}">
              <div class="uistyle-live-agent-meta">${escHtml(us.chat === "claude-code" ? (isRu ? "Размышление · 3с" : "Working out · 3s") : (us.chat === "opencode" ? "▶ step: apply_ui_style" : (isRu ? "Выполнено · 2 шага" : "Completed · 2 steps")))}</div>
              <div>${escHtml(isRu ? "Готово — поле ввода, сообщения и меню моделей подстроены под выбранную платформу." : "Done — composer, chat messages, and model menu now match your chosen platform.")}</div>
            </div>
          </div>
          <div class="uistyle-live-composer-wrap is-${escAttr(us.composer)}" data-live="uiStyleComposer" style="${escAttr(st.compWrapStyle)}">
            <div class="uistyle-live-input-row" data-live="uiStyleInputRow" style="${escAttr(st.inputRowStyle)}">
              <div style="display:flex;align-items:center;gap:6px;min-width:0">
                <span class="uistyle-live-chevron">❯</span>
                <span class="uistyle-live-placeholder">${escHtml(placeholderTxt)}</span>
              </div>
              <span class="uistyle-live-cc-enter">↵</span>
            </div>
            <div class="uistyle-live-toolbar" data-live="uiStyleToolbar" style="${escAttr(st.toolbarStyle)}">
              ${toolbarInnerHtml}
            </div>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${isRu ? "Готовые стили платформ (все 3 зоны сразу)" : "Platform Style Presets (All 3 Zones)"}</span>
        <div class="uistyle-grid">
          ${presets.map((pr) => {
            const sel = us.preset === pr.id;
            return `
              <button type="button" class="uistyle-card${sel ? " is-selected" : ""}" data-action="set-uistyle-preset" data-id="${escAttr(pr.id)}">
                <div class="uistyle-mini-mock is-${escAttr(pr.id)}">
                  <div class="uistyle-mock-msg"></div>
                  <div class="uistyle-mock-agent"></div>
                  <div class="uistyle-mock-comp">
                    <span class="uistyle-mock-model"></span>
                    <span class="uistyle-mock-send"></span>
                  </div>
                  <div class="uistyle-mock-extbar">
                    <span class="uistyle-mock-ext-l"><span class="uistyle-mock-ext-dot"></span><span class="uistyle-mock-ext-dot"></span></span>
                    <span class="uistyle-mock-ext-r"></span>
                  </div>
                </div>
                <div class="uistyle-card-head">
                  <span class="uistyle-card-name">${escHtml(isRu ? pr.nameRu : pr.nameEn)}</span>
                  <span class="uistyle-card-badge">${escHtml(isRu ? pr.badge : (pr.badgeEn || pr.badge))}</span>
                </div>
                <div class="uistyle-card-desc">${escHtml(isRu ? pr.descRu : pr.descEn)}</div>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${isRu ? "Раздельный выбор (Mix & Match по зонам)" : "Mix & Match per Zone"}</span>
        <div style="display:flex;flex-direction:column;gap:7px">
          ${zoneDefs.map((z) => `
            <div class="uistyle-zone-row">
              <div class="uistyle-zone-head">
                <span>${escHtml(z.label)}</span>
                <span class="uistyle-zone-cur">${escHtml(partName(z.cur))}</span>
              </div>
              <div class="subtab-bar is-segmented">
                ${presets.map((pr) => `
                  <button type="button" class="subtab-btn${z.cur === pr.id ? " is-active" : ""}" data-action="set-uistyle-part" data-part="${z.key}" data-val="${escAttr(pr.id)}">${escHtml(pr.id === "codex" ? "Codex" : (pr.id === "claude-code" ? "Claude" : (isRu ? pr.nameRu : pr.nameEn)))}</button>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <details class="rx-details" data-disc="uiStyleFine"${fineOpen ? " open" : ""}>
        <summary>${isRu ? "Детальная настройка композера, чата и моделей" : "Fine-Tune Composer, Chat & Models"}</summary>
        <div class="rx-details-body">
          <div class="control-grid-2">
            <div class="slider-box">
              <div class="slider-head">
                <span>${isRu ? "Скругление ввода" : "Composer Radius"}</span>
                <b class="num" data-live-app-val="uiStyle.composerRadius">${us.composerRadius > 0 ? `${us.composerRadius}px` : autoLbl}</b>
              </div>
              <input type="range" class="range-input" min="0" max="32" step="1" data-app-field="uiStyle.composerRadius" value="${us.composerRadius}"/>
            </div>
            <div class="slider-box">
              <div class="slider-head">
                <span>${isRu ? "Ширина ввода" : "Composer Max Width"}</span>
                <b class="num" data-live-app-val="uiStyle.composerMaxWidth">${us.composerMaxWidth >= 560 ? `${us.composerMaxWidth}px` : autoLbl}</b>
              </div>
              <input type="range" class="range-input" min="540" max="1120" step="20" data-app-field="uiStyle.composerMaxWidth" value="${us.composerMaxWidth >= 560 ? us.composerMaxWidth : 540}"/>
            </div>
            <div class="slider-box">
              <div class="slider-head">
                <span>${isRu ? "Внутр. отступ Y" : "Composer Padding Y"}</span>
                <b class="num" data-live-app-val="uiStyle.composerPadY">${us.composerPadY >= 6 ? `${us.composerPadY}px` : autoLbl}</b>
              </div>
              <input type="range" class="range-input" min="4" max="24" step="1" data-app-field="uiStyle.composerPadY" value="${us.composerPadY >= 6 ? us.composerPadY : 4}"/>
            </div>
            <div class="slider-box">
              <div class="slider-head">
                <span>${isRu ? "Ширина бабла юзера" : "User Bubble Width"}</span>
                <b class="num" data-live-app-val="uiStyle.userBubbleMaxWidth">${us.userBubbleMaxWidth >= 45 ? `${us.userBubbleMaxWidth}%` : autoLbl}</b>
              </div>
              <input type="range" class="range-input" min="40" max="100" step="2" data-app-field="uiStyle.userBubbleMaxWidth" value="${us.userBubbleMaxWidth >= 45 ? us.userBubbleMaxWidth : 40}"/>
            </div>
            <div class="slider-box" style="grid-column:span 2">
              <div class="slider-head">
                <span>${isRu ? "Отступ между сообщениями" : "Message Spacing"}</span>
                <b class="num" data-live-app-val="uiStyle.chatGap">${us.chatGap >= 4 ? `${us.chatGap}px` : autoLbl}</b>
              </div>
              <input type="range" class="range-input" min="2" max="28" step="1" data-app-field="uiStyle.chatGap" value="${us.chatGap >= 4 ? us.chatGap : 2}"/>
            </div>
          </div>

          <div class="section-group">
            <span class="section-label">${isRu ? "Тень поля ввода" : "Composer Shadow"}</span>
            <div class="uistyle-opt-strip">
              ${optBtn("composerShadow", "preset", us.composerShadow, autoLbl)}
              ${optBtn("composerShadow", "none", us.composerShadow, isRu ? "Нет" : "None")}
              ${optBtn("composerShadow", "soft", us.composerShadow, isRu ? "Мягкая" : "Soft")}
              ${optBtn("composerShadow", "elevated", us.composerShadow, isRu ? "Объёмная" : "Elevated")}
            </div>
          </div>

          <div class="section-group">
            <span class="section-label">${isRu ? "Выравнивание сообщений пользователя" : "User Message Alignment"}</span>
            <div class="uistyle-opt-strip">
              ${optBtn("userBubbleAlign", "preset", us.userBubbleAlign, autoLbl)}
              ${optBtn("userBubbleAlign", "right", us.userBubbleAlign, isRu ? "Справа" : "Right")}
              ${optBtn("userBubbleAlign", "left", us.userBubbleAlign, isRu ? "Слева" : "Left")}
              ${optBtn("userBubbleAlign", "full", us.userBubbleAlign, isRu ? "Во всю ширину" : "Full width")}
            </div>
          </div>

          <div class="section-group">
            <span class="section-label">${isRu ? "Левая акцент-полоса у ответов агента" : "Agent Response Accent Bar"}</span>
            <div class="uistyle-opt-strip">
              ${optBtn("agentAccentBar", "preset", us.agentAccentBar, autoLbl)}
              ${optBtn("agentAccentBar", "on", us.agentAccentBar, isRu ? "Вкл" : "On")}
              ${optBtn("agentAccentBar", "off", us.agentAccentBar, isRu ? "Выкл" : "Off")}
            </div>
          </div>

          <div class="section-group">
            <span class="section-label">${isRu ? "Вид кнопки выбора модели" : "Model Trigger Button Style"}</span>
            <div class="uistyle-opt-strip">
              ${optBtn("modelBtnStyle", "preset", us.modelBtnStyle, autoLbl)}
              ${optBtn("modelBtnStyle", "ghost", us.modelBtnStyle, isRu ? "Минимализм (текст)" : "Minimal (ghost)")}
              ${optBtn("modelBtnStyle", "pill", us.modelBtnStyle, isRu ? "Капсула (Codex)" : "Pill (Codex)")}
              ${optBtn("modelBtnStyle", "bordered", us.modelBtnStyle, isRu ? "Рамка" : "Bordered")}
              ${optBtn("modelBtnStyle", "mono", us.modelBtnStyle, isRu ? "Моно-бейдж (OpenCode)" : "Mono badge")}
            </div>
          </div>

          <div class="section-group">
            <span class="section-label">${isRu ? "Плотность выпадающего меню моделей" : "Model Dropdown Density"}</span>
            <div class="uistyle-opt-strip">
              ${optBtn("modelMenuDensity", "preset", us.modelMenuDensity, autoLbl)}
              ${optBtn("modelMenuDensity", "compact", us.modelMenuDensity, isRu ? "Компактная" : "Compact")}
              ${optBtn("modelMenuDensity", "comfortable", us.modelMenuDensity, isRu ? "Обычная" : "Comfortable")}
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end">
            <button type="button" class="btn btn-sm" data-action="reset-uistyle-fine">${isRu ? "Сбросить только тонкие правки" : "Reset Fine Overrides Only"}</button>
          </div>
        </div>
      </details>
    `;
  }

  function renderAppearanceThemeSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const presets = spGetThemePresets();
    const curPreset = spFindThemePreset(draft.presetId);
    const effAccent = draft.customAccent
      ? draft.accentColor
      : ((curPreset && curPreset.vars && curPreset.vars.accentColor) || draft.accentColor);
    const effSidebarBg = draft.customSidebarBg
      ? draft.sidebarBg
      : ((curPreset && curPreset.vars && curPreset.vars.sidebarBg) || spMixHexColor(draft.canvasBg, draft.cardBg, 0.55));
    const effBorderCol = draft.customBorderColor
      ? draft.borderColor
      : ((curPreset && curPreset.vars && curPreset.vars.borderColor && /^#[0-9a-f]{6}$/i.test(curPreset.vars.borderColor))
          ? curPreset.vars.borderColor
          : "#2a2b36");
    const fineOpen = state.openDisclosures.themeFine !== false;
    const profiles = state.settings.appearanceProfiles || [];
    const us = draft.uiStyle || spDefaultUiStyle();
    const isClaudeDarkActive = draft.presetId === "claude-code-dark" && us.preset === "claude-code";
    const isClaudeLightActive = draft.presetId === "claude-code-light" && us.preset === "claude-code";
    const isNativeSuiteActive = draft.presetId === "native" && us.preset === "antigravity" && !draft.customAccent && !draft.customSidebarBg && !draft.customBorderColor;
    const isCodexSuiteActive = us.preset === "codex";
    const isOpenCodeSuiteActive = us.preset === "opencode";
    const modeFilter = state.themeModeFilter === "dark" || state.themeModeFilter === "light" ? state.themeModeFilter : "all";
    const visiblePresets = presets.filter((pr) => {
      if (modeFilter === "all") return true;
      if (modeFilter === "light") return pr.mode === "light";
      return pr.mode !== "light";
    });

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(isRu ? "Готовые образы в 1 клик (тема + стиль интерфейса + шрифты)" : "1-Click Complete Suites (Theme + UI Style + Fonts)")}</span>
        <div class="suite-quick-grid claude-spotlight">
          <button type="button" class="claude-preset-btn${isNativeSuiteActive ? " is-active" : ""}" data-action="apply-platform-suite" data-val="antigravity">
            <span class="claude-chip-swatch" style="background:linear-gradient(135deg,#18191e 55%,#7c9bff 55%)"></span>
            <span>Antigravity</span>
          </button>
          <button type="button" class="claude-preset-btn${isClaudeDarkActive ? " is-active" : ""}" data-action="apply-claude-suite" data-val="dark">
            <span class="claude-chip-swatch" style="background:linear-gradient(135deg,#1f1e1d 55%,#d97757 55%)"></span>
            <span>Claude Dark</span>
          </button>
          <button type="button" class="claude-preset-btn${isClaudeLightActive ? " is-active" : ""}" data-action="apply-claude-suite" data-val="light">
            <span class="claude-chip-swatch" style="background:linear-gradient(135deg,#faf9f5 55%,#c15f3c 55%)"></span>
            <span>Claude Light</span>
          </button>
          <button type="button" class="claude-preset-btn${isCodexSuiteActive ? " is-active" : ""}" data-action="apply-platform-suite" data-val="codex">
            <span class="claude-chip-swatch" style="background:linear-gradient(135deg,#111114 55%,#f4f4f5 55%)"></span>
            <span>Codex</span>
          </button>
          <button type="button" class="claude-preset-btn${isOpenCodeSuiteActive ? " is-active" : ""}" data-action="apply-platform-suite" data-val="opencode">
            <span class="claude-chip-swatch" style="background:linear-gradient(135deg,#141413 55%,#38bdf8 55%)"></span>
            <span>OpenCode</span>
          </button>
        </div>
      </div>

      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <span class="section-label">${escHtml(tr.appThemesTitle)}</span>
          <div class="theme-filter-pills">
            <button type="button" class="theme-filter-pill${modeFilter === "all" ? " is-active" : ""}" data-action="set-theme-filter" data-val="all">${escHtml(isRu ? "Все" : "All")} (${presets.length})</button>
            <button type="button" class="theme-filter-pill${modeFilter === "dark" ? " is-active" : ""}" data-action="set-theme-filter" data-val="dark">${escHtml(tr.themeTagDark)}</button>
            <button type="button" class="theme-filter-pill${modeFilter === "light" ? " is-active" : ""}" data-action="set-theme-filter" data-val="light">${escHtml(tr.themeTagLight)}</button>
          </div>
        </div>
        <div class="theme-grid">
          ${visiblePresets.map((pr) => {
            const sel = draft.presetId === pr.id;
            const sw = pr.vars;
            const tagText = pr.badge || (pr.mode === "light" ? tr.themeTagLight : (pr.mode === "native" ? tr.themeTagNative : tr.themeTagDark));
            return `
              <button type="button" class="theme-card${sel ? " is-selected" : ""}" data-action="select-theme-preset" data-id="${escAttr(pr.id)}">
                <span class="theme-swatch-mini" style="background:${escAttr(sw.canvasBg)}">
                  <span class="theme-swatch-side" style="background:${escAttr(sw.sidebarBg || sw.canvasBg)}"></span>
                  <span class="theme-swatch-body">
                    <span class="theme-swatch-card" style="background:${escAttr(sw.cardBg)}"></span>
                    <span class="theme-swatch-accent" style="background:${escAttr(sw.accentColor)}"></span>
                  </span>
                </span>
                <span class="theme-card-meta">
                  <span class="theme-card-name">${escHtml(isRu ? pr.nameRu : pr.nameEn)}</span>
                  <span class="theme-card-tag">${escHtml(tagText)}</span>
                </span>
                ${sel ? `<span class="theme-check">${iconSvg("check", 13)}</span>` : ""}
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span class="section-label">${escHtml(tr.appAccentQuick)}</span>
          ${draft.customAccent ? `<button type="button" class="btn btn-sm btn-ghost" style="padding:2px 7px;font-size:11px" data-action="reset-custom-accent">${escHtml(tr.appAccentReset)}</button>` : ""}
        </div>
        <div class="accent-row">
          ${CURATED_ACCENTS.map((hex) => `
            <button type="button" class="accent-dot-btn${effAccent.toLowerCase() === hex ? " is-selected" : ""}" data-action="pick-accent-dot" data-val="${hex}" style="background:${hex}" aria-label="${hex}"></button>
          `).join("")}
          <label class="color-box" style="margin-left:auto">
            <span>${escHtml(tr.appCustomColor)}</span>
            <span class="rx-color-row">
              <input type="color" class="color-input" data-app-field="accentColor" value="${escAttr(effAccent)}"/>
              <input type="text" class="app-hex-input" data-app-hex-field="accentColor" value="${escAttr(effAccent)}" placeholder="#rrggbb" maxlength="7" spellcheck="false" autocomplete="off"/>
            </span>
          </label>
        </div>
      </div>

      <details class="rx-details" data-disc="themeFine"${fineOpen ? " open" : ""}>
        <summary>${escHtml(isRu ? "Цвета фона, карточек, сайдбара и границ" : "Canvas, Cards, Sidebar & Border Colors")}</summary>
        <div class="rx-details-body">
          <div class="control-grid-2">
            <div class="color-box">
              <span>${escHtml(tr.appCanvasColor)}</span>
              <span class="rx-color-row">
                <input type="color" class="color-input" data-app-field="canvasBg" value="${escAttr(draft.canvasBg)}"/>
                <input type="text" class="app-hex-input" data-app-hex-field="canvasBg" value="${escAttr(draft.canvasBg)}" placeholder="#rrggbb" maxlength="7" spellcheck="false" autocomplete="off"/>
              </span>
            </div>
            <div class="color-box">
              <span>${escHtml(tr.appCardColor)}</span>
              <span class="rx-color-row">
                <input type="color" class="color-input" data-app-field="cardBg" value="${escAttr(draft.cardBg)}"/>
                <input type="text" class="app-hex-input" data-app-hex-field="cardBg" value="${escAttr(draft.cardBg)}" placeholder="#rrggbb" maxlength="7" spellcheck="false" autocomplete="off"/>
              </span>
            </div>
            <div class="color-box">
              <span>${escHtml(isRu ? "Боковая панель" : "Left Sidebar")}</span>
              <span class="rx-color-row">
                <input type="color" class="color-input" data-app-field="sidebarBg" value="${escAttr(effSidebarBg)}"/>
                <input type="text" class="app-hex-input" data-app-hex-field="sidebarBg" value="${escAttr(effSidebarBg)}" placeholder="#rrggbb" maxlength="7" spellcheck="false" autocomplete="off"/>
                ${draft.customSidebarBg ? `<button type="button" class="btn btn-sm btn-ghost rx-insp-reset-btn" data-action="reset-custom-sidebar-bg" title="${escAttr(isRu ? "Вернуть цвет из темы" : "Reset to theme sidebar color")}">↺</button>` : ""}
              </span>
            </div>
            <div class="color-box">
              <span>${escHtml(isRu ? "Линии и границы" : "Lines & Borders")}</span>
              <span class="rx-color-row">
                <input type="color" class="color-input" data-app-field="borderColor" value="${escAttr(effBorderCol)}"/>
                <input type="text" class="app-hex-input" data-app-hex-field="borderColor" value="${escAttr(effBorderCol)}" placeholder="#rrggbb" maxlength="7" spellcheck="false" autocomplete="off"/>
                ${draft.customBorderColor ? `<button type="button" class="btn btn-sm btn-ghost rx-insp-reset-btn" data-action="reset-custom-border-color" title="${escAttr(isRu ? "Вернуть цвет границ из темы" : "Reset to theme border color")}">↺</button>` : ""}
              </span>
            </div>
          </div>
          <div class="card">
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appPolishLabel)}</span>
              <button type="button" class="switch${draft.uiPolish ? " is-on" : ""}" role="switch" aria-checked="${draft.uiPolish ? "true" : "false"}" data-action="toggle-appearance-polish"><span class="switch-thumb"></span></button>
            </div>
          </div>
        </div>
      </details>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appProfilesTitle)}</span>
        ${profiles.length > 0 ? `
          <div class="profile-strip">
            ${profiles.map((prof) => `
              <div class="profile-chip" role="button" tabindex="0" data-action="apply-appearance-profile" data-id="${escAttr(prof.id)}">
                <span>${escHtml(prof.name)}</span>
                <button type="button" class="preset-del-btn" data-action="delete-appearance-profile" data-id="${escAttr(prof.id)}" title="${escAttr(tr.tooltipDelete)}">${iconSvg("trash", 11)}</button>
              </div>
            `).join("")}
          </div>
        ` : ""}
        <div class="preset-add-row">
          <input type="text" class="text-input" data-role="newProfileInput" maxlength="44" value="${escAttr(state.newProfileName)}" placeholder="${escAttr(tr.appProfilePlaceholder)}"/>
          <button type="button" class="btn btn-sm" data-action="save-appearance-profile">${iconSvg("plus", 12)}${escHtml(tr.appSaveProfile)}</button>
        </div>
      </div>
    `;
  }

  function renderAppearanceWallpaperSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const wp = draft.wallpaper;
    const grads = spGetGradientPresets();
    const modes = [
      { id: "none", label: tr.appWpNone },
      { id: "gradient", label: tr.appWpGradient },
      { id: "image", label: tr.appWpImage },
      { id: "video", label: tr.appWpVideo },
    ];
    const gradFineOpen = Boolean(state.openDisclosures.gradFine);
    const colorOpen = state.openDisclosures.wpColor !== false;

    let modeBody = "";
    if (wp.type === "none") {
      modeBody = `<div class="empty-msg">${escHtml(tr.appWpNoneHint)}</div>`;
    } else if (wp.type === "gradient") {
      const gradStyles = [
        { id: "linear", label: tr.appGradLinear },
        { id: "radial", label: tr.appGradRadial },
        { id: "mesh", label: tr.appGradMesh },
      ];
      modeBody = `
        <div class="section-group">
          <span class="section-label">${escHtml(tr.appGradStyleLabel)}</span>
          <div class="subtab-bar is-segmented">
            ${gradStyles.map((gs) => `
              <button type="button" class="subtab-btn${wp.gradStyle === gs.id ? " is-active" : ""}" data-action="set-wallpaper-grad-style" data-val="${gs.id}">${escHtml(gs.label)}</button>
            `).join("")}
          </div>
        </div>
        <div class="grad-chips">
          ${grads.map((g) => `
            <button type="button" class="grad-chip${wp.gradientPreset === g.id ? " is-selected" : ""}" data-action="select-gradient-preset" data-id="${escAttr(g.id)}" style="background:linear-gradient(${g.angle}deg, ${escAttr(g.colors[0])}, ${escAttr(g.colors[1])}, ${escAttr(g.colors[2])})">${escHtml(isRu ? g.nameRu : g.nameEn)}</button>
          `).join("")}
        </div>
        <div class="card">
          <div class="row-item">
            <span class="row-title">${escHtml(tr.appWpAnimated)}</span>
            <button type="button" class="switch${wp.gradAnimated ? " is-on" : ""}" role="switch" aria-checked="${wp.gradAnimated ? "true" : "false"}" data-action="toggle-wallpaper-animated"><span class="switch-thumb"></span></button>
          </div>
        </div>
        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpDim)}</span><b class="num" data-live-app-val="wallpaper.dim">${wp.dim}%</b></div>
            <input type="range" class="range-input" min="0" max="85" step="1" data-app-field="wallpaper.dim" value="${wp.dim}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpOpacity)}</span><b class="num" data-live-app-val="wallpaper.opacity">${wp.opacity}%</b></div>
            <input type="range" class="range-input" min="15" max="100" step="1" data-app-field="wallpaper.opacity" value="${wp.opacity}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpSaturate)}</span><b class="num" data-live-app-val="wallpaper.saturate">${wp.saturate}%</b></div>
            <input type="range" class="range-input" min="0" max="200" step="5" data-app-field="wallpaper.saturate" value="${wp.saturate}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpVignette)}</span><b class="num" data-live-app-val="wallpaper.vignette">${wp.vignette}%</b></div>
            <input type="range" class="range-input" min="0" max="90" step="5" data-app-field="wallpaper.vignette" value="${wp.vignette}"/>
          </div>
        </div>
        <details class="rx-details" data-disc="gradFine"${gradFineOpen ? " open" : ""}>
          <summary>${escHtml(tr.appGradFineTitle)}</summary>
          <div class="rx-details-body">
            <div class="control-grid-3">
              <div class="color-box"><span>${escHtml(tr.appColorLabels[0])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor0" value="${escAttr(wp.gradColors[0])}"/></div>
              <div class="color-box"><span>${escHtml(tr.appColorLabels[1])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor1" value="${escAttr(wp.gradColors[1])}"/></div>
              <div class="color-box"><span>${escHtml(tr.appColorLabels[2])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor2" value="${escAttr(wp.gradColors[2])}"/></div>
            </div>
            <div class="control-grid-2">
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpAngle)}</span><b class="num" data-live-app-val="wallpaper.gradAngle">${wp.gradAngle}°</b></div>
                <input type="range" class="range-input" min="0" max="360" step="5" data-app-field="wallpaper.gradAngle" value="${wp.gradAngle}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpSpeed)}</span><b class="num" data-live-app-val="wallpaper.gradSpeed">${wp.gradSpeed}s</b></div>
                <input type="range" class="range-input" min="6" max="40" step="1" data-app-field="wallpaper.gradSpeed" value="${wp.gradSpeed}"/>
              </div>
            </div>
          </div>
        </details>
      `;
    } else {
      const isVid = wp.type === "video";
      const resolvedUrl = wp.mediaUrl ? resolveStudioMediaUrl(wp.mediaFile, wp.mediaUrl) : "";
      const filterCss = spBuildWallpaperFilterCss(wp);
      const transformCss = spBuildWallpaperTransformCss(wp);
      const posStr = `${wp.posX}% ${wp.posY}%`;
      const anchors = [
        [0, 0], [50, 0], [100, 0],
        [0, 50], [50, 50], [100, 50],
        [0, 100], [50, 100], [100, 100],
      ];
      const fits = [
        { id: "cover", label: tr.appWpFitCover },
        { id: "contain", label: tr.appWpFitContain },
        { id: "fill", label: tr.appWpFitFill },
      ];
      const blends = [
        { id: "normal", label: tr.appWpBlendNormal },
        { id: "multiply", label: tr.appWpBlendMultiply },
        { id: "screen", label: tr.appWpBlendScreen },
        { id: "overlay", label: tr.appWpBlendOverlay },
        { id: "soft-light", label: tr.appWpBlendSoftLight },
      ];
      const mediaItems = (state.mediaLibrary || []).filter((m) => (isVid ? m.kind === "video" : m.kind === "image"));
      const vigInner = Math.max(15, 65 - Math.round(wp.vignette * 0.45));
      const hudTxt = state.wpDragMode === "offset"
        ? `dX:${wp.offsetX}% · dY:${wp.offsetY}% · ${wp.scale}%`
        : `X:${wp.posX}% · Y:${wp.posY}% · ${wp.scale}%`;

      modeBody = `
        <div class="media-file-bar">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
            <button type="button" class="btn btn-sm btn-primary" data-action="pick-media" data-kind="${isVid ? "video" : "image"}">${iconSvg("upload", 12)}${escHtml(isVid ? tr.appWpPickVideo : tr.appWpPickImage)}</button>
            <span style="font-size:11px;color:${wp.mediaFile ? "var(--rx-fg-strong)" : "var(--rx-muted)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(wp.mediaFile || tr.appWpNoFileHint)}</span>
          </div>
          ${wp.mediaUrl ? `<button type="button" class="btn btn-sm" data-action="clear-wallpaper-media">${escHtml(tr.appWpClearMedia)}</button>` : ""}
        </div>

        ${resolvedUrl ? `
          <div class="wp-stage-wrap">
            <div class="wp-stage-canvas" data-wp-stage="1" title="${escAttr(tr.appWpDragHint)}">
              ${isVid
                ? `<video class="wp-stage-media" data-wp-role="media" src="${escAttr(resolvedUrl)}" autoplay muted loop playsinline style="object-fit:${escAttr(wp.fit)};object-position:${posStr};transform-origin:${posStr};filter:${escAttr(filterCss)};opacity:${wp.opacity / 100};transform:${escAttr(transformCss)}"></video>`
                : `<img class="wp-stage-media" data-wp-role="media" src="${escAttr(resolvedUrl)}" alt="" style="object-fit:${escAttr(wp.fit)};object-position:${posStr};transform-origin:${posStr};filter:${escAttr(filterCss)};opacity:${wp.opacity / 100};transform:${escAttr(transformCss)}"/>`}
              <div class="wp-stage-tint" data-wp-role="tint" style="background-image:${wp.tintEnabled ? escAttr(spBuildGradientPreviewCss(wp)) : "none"};opacity:${wp.tintEnabled ? wp.tintOpacity / 100 : 0};mix-blend-mode:${escAttr(wp.tintBlend || "normal")}"></div>
              <div class="wp-stage-vignette" data-wp-role="vignette" style="background-image:${wp.vignette > 0 ? `radial-gradient(ellipse at center, transparent ${vigInner}%, rgba(0, 0, 0, ${(wp.vignette / 100).toFixed(2)}) 100%)` : "none"}"></div>
              <div class="wp-stage-scrim" data-wp-role="scrim" style="background-color:rgba(6, 7, 10, ${wp.dim / 100})"></div>
              <div class="wp-stage-grid"></div>
              <div class="wp-focus-dot" data-wp-role="focusDot" style="left:${wp.posX}%;top:${wp.posY}%"></div>
              <div class="wp-stage-hud">
                <span class="wp-hud-pill num" data-wp-role="hudCoords">${escHtml(hudTxt)}</span>
                <div style="display:flex;gap:4px">
                  <button type="button" class="wp-hud-btn${state.wpDragMode === "crop" ? " is-active" : ""}" data-action="set-wp-drag-mode" data-val="crop">${escHtml(tr.appWpDragCrop)}</button>
                  <button type="button" class="wp-hud-btn${state.wpDragMode === "offset" ? " is-active" : ""}" data-action="set-wp-drag-mode" data-val="offset">${escHtml(tr.appWpDragOffset)}</button>
                </div>
              </div>
            </div>
            <div class="wp-side-controls">
              <div>
                <div class="section-label" style="margin-bottom:5px">${escHtml(tr.appWpAnchorTitle)}</div>
                <div class="wp-anchor-grid">
                  ${anchors.map(([ax, ay]) => `
                    <button type="button" class="wp-anchor-dot${wp.posX === ax && wp.posY === ay ? " is-active" : ""}" data-action="set-wp-anchor" data-x="${ax}" data-y="${ay}" aria-label="${ax}% ${ay}%"></button>
                  `).join("")}
                </div>
              </div>
              <div class="wp-tool-row">
                <button type="button" class="wp-tool-btn" data-action="wp-rotate-step" data-delta="-90" title="-90°">${iconSvg("rotateLeft", 12)}</button>
                <button type="button" class="wp-tool-btn" data-action="wp-rotate-step" data-delta="90" title="+90°">${iconSvg("rotateRight", 12)}</button>
                <button type="button" class="wp-tool-btn${wp.flipX ? " is-active" : ""}" data-action="wp-toggle-flip" data-axis="x" title="${escAttr(isRu ? "Отразить по горизонтали" : "Flip horizontal")}">${iconSvg("flipH", 12)}</button>
                <button type="button" class="wp-tool-btn${wp.flipY ? " is-active" : ""}" data-action="wp-toggle-flip" data-axis="y" title="${escAttr(isRu ? "Отразить по вертикали" : "Flip vertical")}">${iconSvg("flipV", 12)}</button>
                <button type="button" class="wp-tool-btn" style="flex-basis:100%" data-action="wp-reset-transform">${escHtml(tr.appWpResetFrame)}</button>
              </div>
            </div>
          </div>
        ` : `
          <div class="wp-stage-canvas is-empty" data-action="pick-media" data-kind="${isVid ? "video" : "image"}">
            ${iconSvg("image", 24)}
            <span class="row-desc" style="text-align:center;max-width:260px">${escHtml(tr.appWpStageEmptyHint)}</span>
          </div>
        `}

        ${mediaItems.length > 0 ? `
          <div class="section-group">
            <span class="section-label">${escHtml(tr.appWpGalleryTitle)}</span>
            <div class="wp-gallery-strip">
              ${mediaItems.map((it) => `
                <button type="button" class="wp-gallery-thumb${wp.mediaFile === it.fileName ? " is-selected" : ""}" data-action="select-library-media" data-file="${escAttr(it.fileName)}" data-url="${escAttr(it.mediaUrl)}" data-mime="${escAttr(it.mime)}" data-kind="${escAttr(it.kind)}" title="${escAttr(it.fileName)}">
                  ${it.kind === "video"
                    ? iconSvg("upload", 14)
                    : `<img src="${escAttr(resolveStudioMediaUrl(it.fileName, it.mediaUrl))}" alt=""/>`}
                </button>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <div class="subtab-bar is-segmented">
          ${fits.map((ft) => `
            <button type="button" class="subtab-btn${wp.fit === ft.id ? " is-active" : ""}" data-action="set-wp-fit" data-val="${ft.id}">${escHtml(ft.label)}</button>
          `).join("")}
        </div>

        <div class="section-group">
          <span class="section-label">${escHtml(tr.appWpAtmosTitle)}</span>
          <div class="wp-atmos-grid">
            ${WALLPAPER_ATMOS_PRESETS.map((ap) => {
              const isMatch =
                wp.dim === ap.dim &&
                wp.blur === ap.blur &&
                wp.brightness === ap.brightness &&
                wp.contrast === ap.contrast &&
                wp.saturate === ap.saturate &&
                wp.hue === ap.hue &&
                wp.vignette === ap.vignette &&
                (ap.id !== "original" || (wp.fit === "cover" && wp.scale === 100 && wp.rotate === 0 && !wp.flipX && !wp.flipY && wp.offsetX === 0 && wp.offsetY === 0));
              return `<button type="button" class="btn btn-sm${isMatch ? " btn-primary" : ""}" data-action="apply-wp-atmos" data-id="${escAttr(ap.id)}">${escHtml(isRu ? ap.nameRu : ap.nameEn)}</button>`;
            }).join("")}
          </div>
        </div>

        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpScale)}</span><b class="num" data-live-app-val="wallpaper.scale">${wp.scale}%</b></div>
            <input type="range" class="range-input" min="50" max="250" step="1" data-app-field="wallpaper.scale" value="${wp.scale}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpRotate)}</span><b class="num" data-live-app-val="wallpaper.rotate">${wp.rotate}°</b></div>
            <input type="range" class="range-input" min="-180" max="180" step="1" data-app-field="wallpaper.rotate" value="${wp.rotate}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpPosX)}</span><b class="num" data-live-app-val="wallpaper.posX">${wp.posX}%</b></div>
            <input type="range" class="range-input" min="0" max="100" step="1" data-app-field="wallpaper.posX" value="${wp.posX}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpPosY)}</span><b class="num" data-live-app-val="wallpaper.posY">${wp.posY}%</b></div>
            <input type="range" class="range-input" min="0" max="100" step="1" data-app-field="wallpaper.posY" value="${wp.posY}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpOffsetX)}</span><b class="num" data-live-app-val="wallpaper.offsetX">${wp.offsetX}%</b></div>
            <input type="range" class="range-input" min="-50" max="50" step="1" data-app-field="wallpaper.offsetX" value="${wp.offsetX}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpOffsetY)}</span><b class="num" data-live-app-val="wallpaper.offsetY">${wp.offsetY}%</b></div>
            <input type="range" class="range-input" min="-50" max="50" step="1" data-app-field="wallpaper.offsetY" value="${wp.offsetY}"/>
          </div>
        </div>

        <details class="rx-details" data-disc="wpColor"${colorOpen ? " open" : ""}>
          <summary>${escHtml(tr.appWpColorTitle)}</summary>
          <div class="rx-details-body">
            <div class="control-grid-2">
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpDim)}</span><b class="num" data-live-app-val="wallpaper.dim">${wp.dim}%</b></div>
                <input type="range" class="range-input" min="0" max="85" step="1" data-app-field="wallpaper.dim" value="${wp.dim}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpBlur)}</span><b class="num" data-live-app-val="wallpaper.blur">${wp.blur}px</b></div>
                <input type="range" class="range-input" min="0" max="24" step="1" data-app-field="wallpaper.blur" value="${wp.blur}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpOpacity)}</span><b class="num" data-live-app-val="wallpaper.opacity">${wp.opacity}%</b></div>
                <input type="range" class="range-input" min="15" max="100" step="1" data-app-field="wallpaper.opacity" value="${wp.opacity}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpVignette)}</span><b class="num" data-live-app-val="wallpaper.vignette">${wp.vignette}%</b></div>
                <input type="range" class="range-input" min="0" max="90" step="2" data-app-field="wallpaper.vignette" value="${wp.vignette}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpBrightness)}</span><b class="num" data-live-app-val="wallpaper.brightness">${wp.brightness}%</b></div>
                <input type="range" class="range-input" min="40" max="160" step="2" data-app-field="wallpaper.brightness" value="${wp.brightness}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpContrast)}</span><b class="num" data-live-app-val="wallpaper.contrast">${wp.contrast}%</b></div>
                <input type="range" class="range-input" min="50" max="160" step="2" data-app-field="wallpaper.contrast" value="${wp.contrast}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpSaturate)}</span><b class="num" data-live-app-val="wallpaper.saturate">${wp.saturate}%</b></div>
                <input type="range" class="range-input" min="0" max="200" step="5" data-app-field="wallpaper.saturate" value="${wp.saturate}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpHue)}</span><b class="num" data-live-app-val="wallpaper.hue">${wp.hue}°</b></div>
                <input type="range" class="range-input" min="-180" max="180" step="5" data-app-field="wallpaper.hue" value="${wp.hue}"/>
              </div>
            </div>
          </div>
        </details>

        ${isVid ? `
          <div class="card">
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appWpPlaybackRate)}</span>
              <b class="num" data-live-app-val="wallpaper.playbackRate">${wp.playbackRate}x</b>
            </div>
            <div style="padding:0 13px 10px">
              <input type="range" class="range-input" min="0.25" max="2" step="0.25" data-app-field="wallpaper.playbackRate" value="${wp.playbackRate}"/>
            </div>
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appWpAutoPause)}</span>
              <button type="button" class="switch${wp.pauseWhenHidden ? " is-on" : ""}" role="switch" aria-checked="${wp.pauseWhenHidden ? "true" : "false"}" data-action="toggle-wallpaper-autopause"><span class="switch-thumb"></span></button>
            </div>
          </div>
        ` : ""}

        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.appWpTintTitle)}</span>
              <span class="row-desc">${escHtml(tr.appWpTintDesc)}</span>
            </div>
            <button type="button" class="switch${wp.tintEnabled ? " is-on" : ""}" role="switch" aria-checked="${wp.tintEnabled ? "true" : "false"}" data-action="toggle-wallpaper-tint"><span class="switch-thumb"></span></button>
          </div>
          ${wp.tintEnabled ? `
            <div style="padding:10px 13px;border-top:1px solid var(--rx-border);display:flex;flex-direction:column;gap:9px">
              <div class="control-grid-2">
                <div class="slider-box">
                  <div class="slider-head"><span>${escHtml(tr.appWpTintOpacity)}</span><b class="num" data-live-app-val="wallpaper.tintOpacity">${wp.tintOpacity}%</b></div>
                  <input type="range" class="range-input" min="5" max="75" step="1" data-app-field="wallpaper.tintOpacity" value="${wp.tintOpacity}"/>
                </div>
                <div class="slider-box">
                  <div class="slider-head"><span>${escHtml(tr.appWpTintBlend)}</span></div>
                  <select class="select-input" style="padding:4px 8px;font-size:11px" data-app-field="wallpaper.tintBlend">
                    ${blends.map((b) => `<option value="${b.id}"${wp.tintBlend === b.id ? " selected" : ""}>${escHtml(b.label)}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="control-grid-3">
                <div class="color-box"><span>${escHtml(tr.appColorLabels[0])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor0" value="${escAttr(wp.gradColors[0])}"/></div>
                <div class="color-box"><span>${escHtml(tr.appColorLabels[1])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor1" value="${escAttr(wp.gradColors[1])}"/></div>
                <div class="color-box"><span>${escHtml(tr.appColorLabels[2])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor2" value="${escAttr(wp.gradColors[2])}"/></div>
              </div>
              <div class="grad-chips">
                ${grads.map((g) => `
                  <button type="button" class="grad-chip${wp.gradientPreset === g.id ? " is-selected" : ""}" data-action="select-gradient-preset" data-id="${escAttr(g.id)}" style="background:linear-gradient(${g.angle}deg, ${escAttr(g.colors[0])}, ${escAttr(g.colors[1])}, ${escAttr(g.colors[2])})">${escHtml(isRu ? g.nameRu : g.nameEn)}</button>
                `).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }

    return `
      <div class="subtab-bar is-segmented">
        ${modes.map((m) => `
          <button type="button" class="subtab-btn${wp.type === m.id ? " is-active" : ""}" data-action="set-wallpaper-type" data-val="${m.id}">${escHtml(m.label)}</button>
        `).join("")}
      </div>
      ${modeBody}
    `;
  }

  function renderAppearanceCornersSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const c = draft.corners;
    const eff = typeof teResolveCornerRadii === "function"
      ? teResolveCornerRadii(draft)
      : { messages: c.all, composer: c.all, buttons: c.all, cards: c.all, code: c.all, sidebar: c.all, overlays: c.all, inputs: c.all };
    const presets = spGetCornerPresets();
    const sui = spNormalizeStudioUi(state.settings.studioUi);

    const isPresetSelected = (pr) => {
      if (pr.mode !== c.mode) return false;
      if (pr.mode === "linked") return c.all === pr.all;
      return c.messages === pr.messages && c.composer === pr.composer && c.buttons === pr.buttons && c.code === pr.code;
    };

    const categories = [
      { key: "corners.messages", label: tr.cornersMsgLabel, val: c.messages, max: 28 },
      { key: "corners.composer", label: tr.cornersComposerLabel, val: c.composer, max: 28 },
      { key: "corners.buttons", label: tr.cornersButtonsLabel, val: c.buttons, max: 28 },
      { key: "corners.cards", label: tr.cornersCardsLabel, val: c.cards, max: 28 },
      { key: "corners.code", label: tr.cornersCodeLabel, val: c.code, max: 24 },
      { key: "corners.sidebar", label: tr.cornersSidebarLabel, val: c.sidebar, max: 24 },
      { key: "corners.overlays", label: tr.cornersOverlaysLabel, val: c.overlays, max: 28 },
      { key: "corners.inputs", label: tr.cornersInputsLabel, val: c.inputs, max: 24 },
    ];

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.cornersPreviewLabel)}</span>
        <div class="corners-preview-stage">
          <div class="cp-sidebar" data-cp-role="sidebar" style="border-radius:${Math.min(18, eff.sidebar)}px">
            <div class="cp-nav-item is-on" data-cp-role="nav" style="border-radius:${Math.max(0, eff.sidebar - 2)}px"></div>
            <div class="cp-nav-item" data-cp-role="nav" style="border-radius:${Math.max(0, eff.sidebar - 2)}px"></div>
            <div class="cp-nav-item" data-cp-role="nav" style="border-radius:${Math.max(0, eff.sidebar - 2)}px"></div>
          </div>
          <div class="cp-main">
            <div class="cp-top-row">
              <span class="cp-badge" data-cp-role="input" style="border-radius:${eff.inputs}px">Gemini</span>
              <span class="cp-popup" data-cp-role="popup" style="border-radius:${eff.overlays}px">${escHtml(isRu ? "Меню / Окно" : "Menu / Dialog")}</span>
            </div>
            <div class="cp-bubble" data-cp-role="bubble" style="border-radius:${eff.messages}px">
              <div class="cp-card" data-cp-role="card" style="border-radius:${eff.cards}px">${escHtml(isRu ? "Мысли · Шаг" : "Thinking · Tool call")}</div>
              <div class="cp-code" data-cp-role="code" style="border-radius:${eff.code}px">const radius = "${eff.code}px";</div>
            </div>
            <div class="cp-composer" data-cp-role="composer" style="border-radius:${eff.composer}px">
              <div class="cp-input" data-cp-role="input" style="border-radius:${eff.inputs}px">${escHtml(isRu ? "Спросите что угодно…" : "Ask anything…")}</div>
              <button type="button" class="cp-btn" data-cp-role="btn" style="border-radius:${eff.buttons}px">${escHtml(isRu ? "Отправить" : "Send")}</button>
            </div>
          </div>
        </div>
        ${draft.uiStyle && draft.uiStyle.composer && draft.uiStyle.composer !== "antigravity" ? `
          <span class="row-desc" style="font-size:11px">${escHtml(isRu ? "Совет: скругление поля ввода сейчас задаёт выбранный Стиль UI — его можно изменить во вкладке «Стиль UI»." : "Tip: composer radius is currently governed by the active UI Style — tweak it under the UI Style tab.")}</span>
        ` : ""}
      </div>

      <div class="subtab-bar is-segmented">
        <button type="button" class="subtab-btn${c.mode === "linked" ? " is-active" : ""}" data-action="set-corners-mode" data-val="linked">${escHtml(tr.cornersModeLinked)}</button>
        <button type="button" class="subtab-btn${c.mode === "custom" ? " is-active" : ""}" data-action="set-corners-mode" data-val="custom">${escHtml(tr.cornersModeCustom)}</button>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.cornersPresetsTitle)}</span>
        <div class="corner-preset-grid">
          ${presets.map((pr) => `
            <button type="button" class="corner-preset-btn${isPresetSelected(pr) ? " is-selected" : ""}" data-action="apply-corner-preset" data-id="${escAttr(pr.id)}">
              <span class="corner-swatch" style="border-radius:${pr.mode === "custom" ? "9px 3px 9px 3px" : Math.min(10, Math.round(pr.all * 0.45)) + "px"}"></span>
              <span>${escHtml(isRu ? pr.nameRu : pr.nameEn)}</span>
            </button>
          `).join("")}
        </div>
      </div>

      ${c.mode === "linked" ? `
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.cornersAllLabel)}</span><b class="num" data-live-app-val="corners.all">${c.all}px</b></div>
          <input type="range" class="range-input" min="0" max="28" step="1" data-app-field="corners.all" value="${c.all}"/>
        </div>
      ` : `
        <div class="control-grid-2">
          ${categories.map((cat) => `
            <div class="slider-box">
              <div class="slider-head"><span>${escHtml(cat.label)}</span><b class="num" data-live-app-val="${cat.key}">${cat.val}px</b></div>
              <input type="range" class="range-input" min="0" max="${cat.max}" step="1" data-app-field="${cat.key}" value="${cat.val}"/>
            </div>
          `).join("")}
        </div>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm" data-action="sync-all-corners">${escHtml(tr.cornersSyncAllBtn)}</button>
        </div>
      `}
    `;
  }

  function renderAppearanceSurfaceSub(tr, _isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const styles = [
      { id: "glass", label: tr.appMsgStyleGlass },
      { id: "solid", label: tr.appMsgStyleSolid },
      { id: "minimal", label: tr.appMsgStyleMinimal },
    ];

    return `
      ${typeof rv5RenderBorderPresetSectionHtml === "function" ? rv5RenderBorderPresetSectionHtml(draft, _isRu) : ""}

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appMsgStyleLabel)}</span>
        <div class="subtab-bar is-segmented">
          ${styles.map((st) => `
            <button type="button" class="subtab-btn${draft.messageStyle === st.id ? " is-active" : ""}" data-action="set-message-style" data-val="${st.id}">${escHtml(st.label)}</button>
          `).join("")}
        </div>
      </div>

      <div class="control-grid-2">
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appGlassOpacity)}</span><b class="num" data-live-app-val="glassOpacity">${draft.glassOpacity}%</b></div>
          <input type="range" class="range-input" min="15" max="100" step="1" data-app-field="glassOpacity" value="${draft.glassOpacity}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appSidebarOpacity)}</span><b class="num" data-live-app-val="sidebarOpacity">${draft.sidebarOpacity}%</b></div>
          <input type="range" class="range-input" min="15" max="100" step="1" data-app-field="sidebarOpacity" value="${draft.sidebarOpacity}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appGlassBlur)}</span><b class="num" data-live-app-val="glassBlur">${draft.glassBlur}px</b></div>
          <input type="range" class="range-input" min="0" max="36" step="1" data-app-field="glassBlur" value="${draft.glassBlur}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appMessageCardOpacity)}</span><b class="num" data-live-app-val="messageCardOpacity">${draft.messageCardOpacity}%</b></div>
          <input type="range" class="range-input" min="0" max="96" step="2" data-app-field="messageCardOpacity" value="${draft.messageCardOpacity}"/>
        </div>
      </div>

      <div class="slider-box">
        <div class="slider-head"><span>${escHtml(tr.appBorderStrength)}</span><b class="num" data-live-app-val="borderStrength">${draft.borderStrength}%</b></div>
        <input type="range" class="range-input" min="0" max="100" step="5" data-app-field="borderStrength" value="${draft.borderStrength}"/>
      </div>

      <div class="card">
        <div class="row-item">
          <span class="row-title">${escHtml(tr.appHighContrastText)}</span>
          <button type="button" class="switch${draft.highContrastText !== false ? " is-on" : ""}" role="switch" aria-checked="${draft.highContrastText !== false ? "true" : "false"}" data-action="toggle-appearance-contrast"><span class="switch-thumb"></span></button>
        </div>
      </div>
    `;
  }

  function resolvePreviewGreeting(gd) {
    const captured = translator && typeof translator.getCapturedUserName === "function" ? translator.getCapturedUserName() : "";
    const nameVal = (gd.displayName || "").trim() || captured || (state.locale === "en" ? "Ivan" : "Иван");
    let rawTitle = (gd.title || "").trim();
    if (!rawTitle) {
      rawTitle = gd.mode === "minimal"
        ? (state.locale === "en" ? "Ready." : "Готов к работе.")
        : "{time}, {name}";
    }
    if (translator && typeof translator.resolveGreetingTemplate === "function") {
      return {
        title: translator.resolveGreetingTemplate(rawTitle, nameVal, state.locale, new Date()),
        subtitle: gd.subtitle.trim() ? translator.resolveGreetingTemplate(gd.subtitle.trim(), nameVal, state.locale, new Date()) : "",
      };
    }
    return { title: rawTitle.replace(/\{name\}/gi, nameVal), subtitle: gd.subtitle || "" };
  }

  function renderAppearanceGreetingSub(tr, isRu) {
    const gd = spNormalizeGreeting(state.greetingDraft);
    const presets = isRu ? GREETING_QUICK_PRESETS.ru : GREETING_QUICK_PRESETS.en;
    const modes = [
      { id: "time-of-day", label: tr.greetModeTime },
      { id: "custom", label: tr.greetModeCustom },
      { id: "minimal", label: tr.greetModeMinimal },
    ];
    const autoName = (translator && typeof translator.getCapturedUserName === "function" ? translator.getCapturedUserName() : "") || (isRu ? "Иван" : "Ivan");
    const preview = resolvePreviewGreeting(gd);

    return `
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${escHtml(tr.greetMasterTitle)}</span>
            <span class="row-desc">${escHtml(tr.greetMasterDesc)}</span>
          </div>
          <button type="button" class="switch${gd.enabled ? " is-on" : ""}" role="switch" aria-checked="${gd.enabled ? "true" : "false"}" data-action="toggle-greeting-enabled"><span class="switch-thumb"></span></button>
        </div>
      </div>

      <div class="subtab-bar is-segmented">
        ${modes.map((m) => `
          <button type="button" class="subtab-btn${gd.mode === m.id ? " is-active" : ""}" data-action="set-greeting-mode" data-val="${m.id}">${escHtml(m.label)}</button>
        `).join("")}
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.greetPresetsLabel)}</span>
        <div class="token-chips">
          ${presets.map((p) => `
            <button type="button" class="btn btn-sm" data-action="apply-greeting-preset" data-id="${escAttr(p.id)}">${escHtml(p.label)}</button>
          `).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.greetTitleLabel)}</span>
        <input type="text" class="text-input" data-greet-field="title" maxlength="160" value="${escAttr(gd.title)}" placeholder="${escAttr(tr.greetTitlePlaceholder)}"/>
        <div class="token-chips">
          ${["{name}", "{time}", "{weekday}", "{date}"].map((tok) => `
            <button type="button" class="token-chip" data-action="insert-greeting-token" data-val="${tok}">${tok}</button>
          `).join("")}
        </div>
      </div>

      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${escHtml(tr.greetNameLabel)}</span>
          <input type="text" class="text-input" data-greet-field="displayName" maxlength="60" value="${escAttr(gd.displayName)}" placeholder="${escAttr(tr.greetNameAutoPrefix + " " + autoName)}"/>
        </div>
        <div class="section-group">
          <span class="section-label">${escHtml(tr.greetSubtitleLabel)}</span>
          <input type="text" class="text-input" data-greet-field="subtitle" maxlength="180" value="${escAttr(gd.subtitle)}" placeholder="${escAttr(tr.greetSubtitlePlaceholder)}"/>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.greetPlaceholderLabel)}</span>
        <input type="text" class="text-input" data-greet-field="placeholder" maxlength="140" value="${escAttr(gd.placeholder)}" placeholder="${escAttr(tr.greetPlaceholderDefault)}"/>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.greetPreviewLabel)}</span>
        <div class="greeting-preview-card">
          <div class="greeting-preview-title" data-live="greetPreviewTitle">${escHtml(gd.enabled ? preview.title : (isRu ? `Привет, ${autoName}! Что создадим сегодня?` : `Hey ${autoName}, what should we build today?`))}</div>
          <div class="greeting-preview-sub" data-live="greetPreviewSub" style="${gd.enabled && preview.subtitle ? "" : "display:none"}">${escHtml(preview.subtitle)}</div>
          <div class="greeting-preview-composer" data-live="greetPreviewComposer">${escHtml(gd.enabled && gd.placeholder.trim() ? gd.placeholder.trim() : tr.greetPreviewInputFallback)}</div>
        </div>
      </div>
    `;
  }

  function renderAppearanceTextSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const ty = draft.typography;
    const uiStack = (typeof teResolveFontStack === "function" ? teResolveFontStack("ui", ty.uiFont, ty.uiFontCustom) : "") || "var(--rx-font-ui)";
    const monoStack = (typeof teResolveFontStack === "function" ? teResolveFontStack("mono", ty.monoFont, ty.monoFontCustom) : "") || "var(--rx-font-mono)";
    const densities = [
      { id: "compact", label: tr.appDensityCompact },
      { id: "comfortable", label: tr.appDensityComfort },
      { id: "spacious", label: tr.appDensitySpacious },
    ];

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.fontPairsTitle)}</span>
        <div class="font-pair-grid">
          ${FONT_PAIR_PRESETS.map((fp) => {
            const sel = ty.uiFont === fp.uiFont && ty.monoFont === fp.monoFont;
            return `
              <button type="button" class="font-pair-btn${sel ? " is-selected" : ""}" data-action="apply-font-pair" data-id="${escAttr(fp.id)}">
                <span class="font-pair-title">${escHtml(isRu ? fp.nameRu : fp.nameEn)}</span>
                <span class="font-pair-sub">${escHtml(isRu ? fp.descRu : fp.descEn)}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.fontPreviewLabel)}</span>
        <div class="typo-preview-card">
          <div class="typo-preview-head" data-live="typoPreviewHead" style="font-family:${escAttr(uiStack)};font-size:${Math.min(18, ty.fontSize + 1)}px">${escHtml(tr.fontPreviewTitle)}</div>
          <p class="typo-preview-body" data-live="typoPreviewBody" style="font-family:${escAttr(uiStack)};font-size:${ty.fontSize}px;line-height:${ty.lineHeight}">${escHtml(tr.fontPreviewBody)}</p>
          <div class="typo-preview-code" data-live="typoPreviewCode" style="font-family:${escAttr(monoStack)}">const theme = { palette: "claude-code", accent: "#d97757" };</div>
        </div>
      </div>

      ${typeof rv5RenderDetailedTypographyHtml === "function" ? rv5RenderDetailedTypographyHtml(draft, state.systemFonts, isRu) : ""}

      <div class="control-grid-2">
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appFontSize)}</span><b class="num" data-live-app-val="typography.fontSize">${ty.fontSize}px</b></div>
          <input type="range" class="range-input" min="12" max="18" step="1" data-app-field="typography.fontSize" value="${ty.fontSize}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appLineHeight)}</span><b class="num" data-live-app-val="typography.lineHeight">${ty.lineHeight}</b></div>
          <input type="range" class="range-input" min="1.25" max="1.9" step="0.05" data-app-field="typography.lineHeight" value="${ty.lineHeight}"/>
        </div>
      </div>

      <div class="slider-box">
        <div class="slider-head"><span>${escHtml(tr.appChatWidth)}</span><b class="num" data-live-app-val="typography.chatMaxWidth">${ty.chatMaxWidth >= 680 ? ty.chatMaxWidth + "px" : tr.appChatWidthAuto}</b></div>
        <input type="range" class="range-input" min="640" max="1180" step="20" data-app-field="typography.chatMaxWidth" value="${ty.chatMaxWidth >= 680 ? ty.chatMaxWidth : 640}"/>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appDensity)}</span>
        <div class="subtab-bar is-segmented">
          ${densities.map((d) => `
            <button type="button" class="subtab-btn${ty.density === d.id ? " is-active" : ""}" data-action="set-density" data-val="${d.id}">${escHtml(d.label)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderPersonaTab() {
    const tr = t();
    const s = state.settings;
    const cp = state.chatPersona;
    const bytes = utf8ByteLength(state.draftPersonaText);
    const estTok = spTokenEst(state.draftPersonaText);
    const overWarn = bytes >= 20000;
    const customs = s.customPresets || [];
    const hasUnsaved = Boolean(state.draftDirty && state.draftPersonaText.trim() !== (cp.text || "").trim());
    const strictOn = cp.strict !== false;

    return `
      <div class="persona-stack">
        <div class="persona-scope-bar">
          <div class="persona-scope-top">
            <span class="status-chip" data-live="chatBadge" style="min-width:0;overflow:hidden;text-overflow:ellipsis">
              <span class="status-dot" style="background:${state.activeChatKey === "__new__" ? "var(--rx-muted)" : "var(--rx-accent)"}"></span>
              <span style="overflow:hidden;text-overflow:ellipsis">${escHtml(formatChatBadgeLabel())}</span>
            </span>
            <span class="nav-badge" style="flex-shrink:0">${escHtml(tr.personaHookBadge)}</span>
          </div>
          <span class="row-desc">${escHtml(tr.chatScopeHint)}</span>
        </div>

        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.personaMasterTitle)}</span>
              <span class="row-desc">${escHtml(tr.personaMasterDesc)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end">
              ${hasUnsaved ? `<span class="nav-badge" style="color:var(--rx-warning);border-color:var(--rx-warning)">${escHtml(tr.personaUnsavedTag)}</span>` : ""}
              <span class="${cp.enabled ? "badge-active" : "nav-badge"}">${escHtml(cp.enabled ? tr.personaActiveTag : tr.personaOffTag)}</span>
              <button type="button" class="switch${cp.enabled ? " is-on" : ""}" role="switch" aria-checked="${cp.enabled ? "true" : "false"}" data-action="toggle-persona-enabled"><span class="switch-thumb"></span></button>
            </div>
          </div>
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.personaStrictLabel)}</span>
              <span class="row-desc">${escHtml(tr.personaStrictDesc)}</span>
            </div>
            <button type="button" class="switch${strictOn ? " is-on" : ""}" role="switch" aria-checked="${strictOn ? "true" : "false"}" data-action="toggle-persona-strict"><span class="switch-thumb"></span></button>
          </div>
        </div>

        <div class="section-group">
          <div class="editor-meta-row">
            <span class="section-label">${escHtml(tr.personaEditorLabel)}</span>
            <span class="num" data-role="byteCounter" style="color:${overWarn ? "var(--rx-warning)" : "var(--rx-muted)"}">${bytes.toLocaleString()} / ${MAX_PERSONA_BODY_BYTES.toLocaleString()} ${escHtml(tr.personaBytes)} · ~${estTok.toLocaleString()} ${escHtml(tr.tokShort)}${overWarn ? " · " + escHtml(tr.personaLimitWarn) : ""}</span>
          </div>
          <textarea class="editor-box" data-role="personaEditor" spellcheck="false" placeholder="${escAttr(tr.personaEditorPlaceholder)}">${escHtml(state.draftPersonaText)}</textarea>
        </div>

        <div class="action-bar">
          <div class="action-btns">
            <button type="button" class="btn btn-primary" data-action="save-persona">${iconSvg("check", 13)}${escHtml(tr.personaApplyBtn)}</button>
            <button type="button" class="btn" data-action="clear-persona">${escHtml(tr.personaClearBtn)}</button>
          </div>
          <span class="toast-text${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>
        </div>

        <div class="section-group">
          <span class="section-label">${escHtml(tr.personaPresetsLabel)}</span>
          ${customs.length > 0 ? `
            <div class="preset-strip">
              ${customs.map((item) => `
                <div class="preset-card${cp.activePreset === item.id ? " is-selected" : ""}" role="button" tabindex="0" data-action="select-preset" data-id="${escAttr(item.id)}">
                  <div class="preset-head">
                    <span class="preset-name">${escHtml(item.title)}</span>
                    <button type="button" class="preset-del-btn" data-action="delete-custom-preset" data-id="${escAttr(item.id)}" title="${escAttr(tr.tooltipDelete)}">${iconSvg("trash", 12)}</button>
                  </div>
                  <span class="choice-desc">${escHtml(tr.personaCustomLabel)}</span>
                </div>
              `).join("")}
            </div>
          ` : ""}
          <div class="preset-add-row">
            <input type="text" class="text-input" data-role="newPresetInput" maxlength="44" value="${escAttr(state.newPresetName)}" placeholder="${escAttr(tr.personaSavePresetPlaceholder)}"/>
            <button type="button" class="btn btn-sm" data-action="save-custom-preset">${iconSvg("plus", 12)}${escHtml(tr.personaAddPresetBtn)}</button>
          </div>
        </div>

        <div class="row-desc" style="font-family:var(--rx-mono);font-size:11px;word-break:break-all">
          ${escHtml(tr.personaRulePathLabel)} ${escHtml(state.personaFilePath)}
        </div>
      </div>
    `;
  }

  function renderSupplementsTab() {
    const tr = t();
    const list = state.liveEdits || [];
    const draftImgs = state.liveEditDraftImages || [];
    const isBusy = state.telemetry.isGenerating;
    const canSend = Boolean((state.liveEditDraftText && state.liveEditDraftText.trim()) || draftImgs.length > 0) && !state.liveEditBusy;

    return `
      <div class="hint-banner">${iconSvg("bolt", 14)}<span>${escHtml(isBusy ? tr.suppActiveHint : tr.suppIdleHint)}</span></div>

      <div class="section-group">
        <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px">
          <textarea class="le-textarea" style="min-height:92px" data-role="liveEditInput" placeholder="${escAttr(tr.suppPlaceholder)}">${escHtml(state.liveEditDraftText)}</textarea>
          ${draftImgs.length > 0 ? `
            <div class="le-thumbs">
              ${draftImgs.map((im, idx) => `
                <div class="le-thumb-chip">
                  ${im.previewDataUrl ? `<img class="le-thumb-img" src="${escAttr(im.previewDataUrl)}" alt=""/>` : iconSvg("image", 14)}
                  <span class="le-thumb-name">${escHtml(im.name || ("img-" + (idx + 1)))}</span>
                  <button type="button" class="preset-del-btn" data-action="remove-live-edit-img" data-idx="${idx}" title="${escAttr(tr.tooltipRemove)}">${iconSvg("close", 11)}</button>
                </div>
              `).join("")}
            </div>
          ` : ""}
          ${state.liveEditError ? `<span class="toast-text is-err">${escHtml(state.liveEditError)}</span>` : ""}
          <div class="le-actions">
            <button type="button" class="btn btn-sm" data-action="pick-live-edit-images">${iconSvg("image", 13)}${escHtml(tr.suppPickPhoto)}</button>
            <div style="display:flex;align-items:center;gap:8px">
              ${list.length > 0 ? `<button type="button" class="btn btn-sm" data-action="clear-live-edits">${iconSvg("trash", 12)}${escHtml(tr.suppClearBtn)}</button>` : ""}
              ${!isBusy && state.liveEditDraftText.trim() ? `<button type="button" class="btn btn-sm" data-action="insert-supplement-to-chat">${escHtml(tr.suppInsertChatBtn)}</button>` : ""}
              <button type="button" class="btn btn-sm btn-primary" ${canSend ? "" : "disabled"} data-action="send-live-edit">${iconSvg("send", 12)}${escHtml(tr.suppSendBtn)}</button>
            </div>
          </div>
        </div>
        <span class="toast-text${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>
      </div>

      <div class="section-group">
        ${list.length === 0 ? `<div class="empty-msg">${escHtml(tr.suppEmpty)}</div>` : `
          <div class="le-feed" style="max-height:260px">
            ${list.slice().reverse().map((it) => {
              const st = formatLiveEditStatus(it.status, tr);
              const tStr = new Date(it.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const imgs = Array.isArray(it.images) ? it.images : [];
              return `
                <div class="le-item">
                  <div class="le-item-top">
                    <span class="num">${escHtml(tStr)}${imgs.length > 0 ? ` · ${imgs.length} ${escHtml(tr.suppPhotoCount)}` : ""}</span>
                    <span class="le-status-pill ${st.cls}">${escHtml(st.label)}</span>
                  </div>
                  ${it.text ? `<span style="color:var(--rx-fg-strong);word-break:break-word;white-space:pre-wrap">${escHtml(it.text)}</span>` : ""}
                  ${imgs.length > 0 ? `
                    <div class="le-thumbs">
                      ${imgs.map((im) => `<span class="le-thumb-chip">${iconSvg("image", 12)}<span class="le-thumb-name">${escHtml(im.name || "image")}</span></span>`).join("")}
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    `;
  }

  function renderOptimizationSub(isRu) {
    const opt = typeof sanitizeOptimizationSettings === "function"
      ? sanitizeOptimizationSettings(state.settings.optimization)
      : Object.assign({}, state.settings.optimization);
    const diag = state.perfDiag && state.perfDiag.data ? state.perfDiag.data : null;
    const diagLoading = Boolean(state.perfDiag && state.perfDiag.loading);
    const diagBusy = Boolean(state.perfDiag && state.perfDiag.busy);
    const lastMsg = (state.perfDiag && state.perfDiag.lastMsg) || "";
    const kbDict = (state.settings.keybindings && state.settings.keybindings.toggleDictation) || "Ctrl+Alt+V";

    const optToggle = (key, title, desc) => {
      const on = Boolean(opt[key]);
      return `
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${escHtml(title)}</span>
            <span class="row-desc">${escHtml(desc)}</span>
          </div>
          <button type="button" class="switch${on ? " is-on" : ""}" role="switch" aria-checked="${on ? "true" : "false"}" data-action="toggle-opt" data-key="${escAttr(key)}" aria-label="${escAttr(title)}"><span class="switch-thumb"></span></button>
        </div>
      `;
    };

    const langPresets = [
      { id: "auto", label: isRu ? "Авто" : "Auto" },
      { id: "ru-en", label: "RU + EN" },
      { id: "ru", label: "RU" },
      { id: "en-ru", label: "EN + RU" },
      { id: "en", label: "EN" },
      { id: "uk-ru-en", label: "UK+RU+EN" },
      { id: "custom", label: isRu ? "Свои" : "Custom" },
    ];
    const chunkOpts = [
      { id: "80", label: isRu ? "80 мс (баланс)" : "80 ms (balanced)" },
      { id: "100", label: isRu ? "100 мс (эконом)" : "100 ms (low RPC)" },
      { id: "40", label: isRu ? "40 мс (сток)" : "40 ms (stock)" },
    ];
    const animModes = [
      { id: "smooth", label: isRu ? "Плавные 60–144 FPS" : "Smooth 60–144 FPS" },
      { id: "snappy", label: isRu ? "Молниеносные" : "Snappy" },
      { id: "reduced", label: isRu ? "Минимум" : "Reduced" },
      { id: "native", label: isRu ? "Стандарт" : "Native" },
    ];
    const capOpts = [
      { id: "0", label: isRu ? "Стандарт (выкл.)" : "Default (off)" },
      { id: "50", label: "50 MB" },
      { id: "100", label: "100 MB" },
      { id: "256", label: "256 MB" },
    ];

    const fmtMb = (b) => `${((Number(b) || 0) / (1024 * 1024)).toFixed(1)} MB`;
    const fmtKb = (b) => `${((Number(b) || 0) / 1024).toFixed(1)} KB`;
    const cacheHitStr = diag && diag.promptCache && diag.promptCache.turnsSampled > 0
      ? `${diag.promptCache.cacheHitRatePct}%`
      : "—";
    const lsThreadsStr = diag && diag.lsTuning
      ? `${diag.lsTuning.maxProcs} / ${diag.lsTuning.cpuCount}`
      : (opt.lsTuningEnabled ? "Auto" : (isRu ? "Сток (4)" : "Stock (4)"));
    const cleanableStr = diag ? fmtMb(diag.cleanableTotalBytes) : (diagLoading ? "…" : "—");
    const staleKeysCount = diag && diag.appStorage && Array.isArray(diag.appStorage.staleLayoutKeys)
      ? diag.appStorage.staleLayoutKeys.length
      : 0;

    const lv = state.localVoice || { loading: false, installing: false, progressPct: 0, progressMsg: "", status: null, error: "" };
    const lvSt = lv.status;
    const lvInstalled = Boolean(lvSt && lvSt.installed);
    const lvRunning = Boolean(lvSt && lvSt.running);
    const lvModel = opt.voiceLocalModel || "ru-fast";
    const modelMeta = {
      "ru-tone": {
        nameRu: "RU T-one Pro",
        nameEn: "RU T-one Pro",
        descRu: "80Kч живой русской речи · 8 кГц",
        descEn: "80Kh conversational Russian · 8 kHz",
      },
      "ru-fast": {
        nameRu: "RU Быстрая",
        nameEn: "RU Fast",
        descRu: "16 кГц + IT-словарь · мгновенный старт",
        descEn: "16 kHz + dev hotwords · instant boot",
      },
      "ru-hq": {
        nameRu: "RU Точная (FP32)",
        nameEn: "RU Accurate (FP32)",
        descRu: "16 кГц FP32 + IT-словарь · макс. точность",
        descEn: "16 kHz FP32 + dev hotwords · high precision",
      },
      "multi-ru-en": {
        nameRu: "RU + EN Мульти",
        nameEn: "RU + EN Multi",
        descRu: "Русский и English в одной модели",
        descEn: "Mixed Russian & English in one model",
      },
      "en-fast": {
        nameRu: "EN Быстрая",
        nameEn: "EN Fast",
        descRu: "English 16 кГц потоковая",
        descEn: "English 16 kHz streaming",
      },
    };
    const lvModels = (lvSt && Array.isArray(lvSt.models) && lvSt.models.length > 0)
      ? lvSt.models
      : [
          { id: "ru-tone", sizeMb: 122.5, labelRu: "RU T-one Pro (80Kч, 122 МБ)", labelEn: "RU T-one Pro (80Kh, 122 MB)", installed: false },
          { id: "ru-fast", sizeMb: 23, labelRu: "RU Быстрая (23 МБ)", labelEn: "RU Fast (23 MB)", installed: false },
          { id: "ru-hq", sizeMb: 85.5, labelRu: "RU Точная (85 МБ)", labelEn: "RU Accurate (85 MB)", installed: false },
          { id: "multi-ru-en", sizeMb: 247.1, labelRu: "RU + EN Мульти (247 МБ)", labelEn: "RU + EN Multi (247 MB)", installed: false },
          { id: "en-fast", sizeMb: 122, labelRu: "EN Быстрая (122 МБ)", labelEn: "EN Fast (122 MB)", installed: false },
        ];
    const activeModelInfo = lvModels.find((m) => m.id === lvModel) || lvModels[0];
    const engineOpts = [
      {
        id: "auto",
        title: isRu ? "Локальный мгновенный (~8 мс)" : "Local Instant (~8 ms)",
        desc: isRu ? "Sherpa-ONNX офлайн на вашем ПК" : "Sherpa-ONNX offline on your machine",
      },
      {
        id: "cloud",
        title: isRu ? "Облачный Antigravity" : "Antigravity Cloud",
        desc: isRu ? "Штатный облачный стрим с тюнингом" : "Stock cloud stream with Rudex tuning",
      },
    ];
    const effectiveEngine = opt.voiceEngine === "cloud" ? "cloud" : "auto";
    const lvStatusText = lv.installing
      ? (lv.progressMsg ? `${lv.progressPct}% · ${lv.progressMsg}` : `${lv.progressPct}%`)
      : (lvInstalled
        ? (lvRunning
          ? (isRu ? `Локальный сервер активен (порт ${lvSt.port}) · финализация ~8 мс` : `Local server warm (port ${lvSt.port}) · ~8 ms finalize`)
          : (isRu ? "Локальный движок готов · запускается мгновенно при старте диктовки" : "Local engine ready · starts instantly on dictation"))
        : (isRu ? "Модель ещё не скачана — нажмите кнопку справа (работает 100% офлайн)" : "Model not downloaded yet — click button on the right (100% offline)"));

    return `
      <div class="opt-jump-bar">
        <button type="button" class="opt-jump-pill" data-action="scroll-opt-section" data-target="opt-sec-voice">${isRu ? "Голос (Pro)" : "Voice (Pro)"}</button>
        <button type="button" class="opt-jump-pill" data-action="scroll-opt-section" data-target="opt-sec-cache">${isRu ? "Файлы и кэш" : "Files & Cache"}</button>
        <button type="button" class="opt-jump-pill" data-action="scroll-opt-section" data-target="opt-sec-anim">${isRu ? "Анимации" : "Animations"}</button>
      </div>
      <div class="section-group" data-opt-sec="opt-sec-voice">
        <div class="opt-section-head">
          <span class="section-label">${isRu ? "Голосовой ввод (Voice Dictation Pro)" : "Voice Input (Voice Dictation Pro)"}</span>
          <span class="kbd">${escHtml(kbDict)}</span>
        </div>
        <div class="card">
          ${optToggle("voiceEnabled", isRu ? "Ускорение и исправление голосового ввода" : "Enhanced Voice Dictation Engine", isRu ? `Мгновенная локальная потоковая диктовка (Sherpa-ONNX) или улучшенный облачный стрим + хоткей ${kbDict}` : `Instant local streaming dictation (Sherpa-ONNX) or enhanced cloud stream & hotkey ${kbDict}`)}
          <div class="row-item opt-row-stack">
            <div class="row-info">
              <span class="row-title">${isRu ? "Движок распознавания речи" : "Speech Recognition Engine"}</span>
              <span class="row-desc">${isRu ? "Локальный Sherpa-ONNX печатает слова прямо во время речи (~100 мс) и закрывает запись за ~8 мс без облачной задержки." : "Local Sherpa-ONNX streams words live (~100 ms) and finalizes in ~8 ms with zero cloud wait."}</span>
            </div>
            <div class="segmented-2">
              ${engineOpts.map((eo) => `
                <button type="button" class="choice-card${effectiveEngine === eo.id ? " is-selected" : ""}" data-action="set-opt-val" data-key="voiceEngine" data-val="${eo.id}">
                  <span class="choice-title">
                    <span>${escHtml(eo.title)}</span>
                    ${effectiveEngine === eo.id ? `<span class="badge-active">${isRu ? "Активен" : "Active"}</span>` : ""}
                  </span>
                  <span class="choice-desc">${escHtml(eo.desc)}</span>
                </button>
              `).join("")}
            </div>
            ${effectiveEngine !== "cloud" ? `
              <div class="opt-model-box">
                <div class="opt-model-head">
                  <div class="row-info">
                    <span class="row-title">${isRu ? "Модель голосового ввода по умолчанию" : "Default Voice Input Model"}</span>
                    <span class="opt-model-status${lvInstalled ? " is-ready" : ""}">${escHtml(lvStatusText)}</span>
                  </div>
                  <button type="button" class="btn btn-sm${lvInstalled ? "" : " btn-primary"}" ${lv.installing ? "disabled" : ""} data-action="install-local-voice" data-model="${escAttr(lvModel)}">${escHtml(lv.installing ? (isRu ? `Загрузка ${lv.progressPct}%…` : `Downloading ${lv.progressPct}%…`) : (lvInstalled ? (isRu ? "Активна · Прогреть" : "Active · Warm Up") : (isRu ? `Скачать (${activeModelInfo.sizeMb} МБ)` : `Download (${activeModelInfo.sizeMb} MB)`)))}</button>
                </div>
                ${lv.installing ? `<div class="opt-progress-track"><div class="opt-progress-fill" style="width:${lv.progressPct}%"></div></div>` : ""}
                ${lv.error ? `<div class="row-desc" style="color:var(--rx-danger)">${escHtml(lv.error)}</div>` : ""}
                <div class="opt-model-grid">
                  ${lvModels.map((m) => {
                    const meta = modelMeta[m.id] || {};
                    const isSel = lvModel === m.id;
                    const title = isRu ? (meta.nameRu || m.labelRu) : (meta.nameEn || m.labelEn);
                    const sub = isRu
                      ? `${meta.descRu || m.labelRu} · ${m.sizeMb} МБ`
                      : `${meta.descEn || m.labelEn} · ${m.sizeMb} MB`;
                    const badgeHtml = isSel && m.installed
                      ? `<span class="badge-active">${isRu ? "По умолчанию" : "Default"}</span>`
                      : (m.installed
                        ? `<span class="nav-badge">OK</span>`
                        : `<span class="nav-badge num">${m.sizeMb} ${isRu ? "МБ" : "MB"}</span>`);
                    return `
                      <button type="button" class="opt-model-card${isSel ? " is-selected" : ""}" data-action="select-local-voice-model" data-val="${escAttr(m.id)}">
                        <span class="opt-model-card-top">
                          <span class="opt-model-name">${escHtml(title)}</span>
                          ${badgeHtml}
                        </span>
                        <span class="opt-model-sub">${escHtml(sub)}</span>
                      </button>
                    `;
                  }).join("")}
                </div>
                <span class="row-desc">${isRu ? "Переключение между скачанными моделями происходит мгновенно без перезапуска Antigravity." : "Switching between downloaded models takes effect immediately without restarting Antigravity."}</span>
              </div>
            ` : ""}
          </div>
          <div class="row-item opt-row-stack">
            <div class="row-info">
              <span class="row-title">${isRu ? "Приоритет языков распознавания" : "Speech Recognition Language Priority"}</span>
              <span class="row-desc">${isRu ? "Передаёт languageCodes в облачном движке диктовки — меньше ошибок на русском и англ. терминах." : "Sends languageCodes in cloud dictation for faster, accurate multilingual recognition."}</span>
            </div>
            <div class="token-chips">
              ${langPresets.map((lp) => `<button type="button" class="btn btn-sm${opt.voiceLangPreset === lp.id ? " btn-primary" : ""}" data-action="set-opt-val" data-key="voiceLangPreset" data-val="${lp.id}">${escHtml(lp.label)}</button>`).join("")}
            </div>
            ${opt.voiceLangPreset === "custom" ? `<input type="text" class="text-input" data-opt-field="voiceCustomLangs" value="${escAttr(opt.voiceCustomLangs || "")}" placeholder="ru-RU, en-US, de-DE" spellcheck="false" autocomplete="off"/>` : ""}
          </div>
          <div class="row-item opt-row-stack">
            <div class="row-info">
              <span class="row-title">${isRu ? "Размер аудио-чанка (облачный RPC)" : "Audio Streaming Chunk Size (Cloud RPC)"}</span>
              <span class="row-desc">${isRu ? "80 мс снижает число сетевых SendAudioChunk запросов в 2 раза без ощутимой задержки." : "80 ms cuts SendAudioChunk RPC frequency by 50% with imperceptible latency."}</span>
            </div>
            <div class="token-chips">
              ${chunkOpts.map((co) => `<button type="button" class="btn btn-sm${String(opt.voiceChunkMs) === co.id ? " btn-primary" : ""}" data-action="set-opt-val" data-key="voiceChunkMs" data-val="${co.id}">${escHtml(co.label)}</button>`).join("")}
            </div>
          </div>
          ${optToggle("voiceDspFilter", isRu ? "DSP-фильтр диктовки (HPF 65 Гц + антиалиасинг 7.4 кГц)" : "Dictation DSP Filter (65 Hz HPF + 7.4 kHz LPF)", isRu ? "Убирает гул сети и искажение шипящих при ресемплинге 48 → 16 кГц (не затрагивает Голосовой режим)." : "Removes hum and aliasing on sibilants during 48 → 16 kHz resampling (never touches Live Voice Mode).")}
          ${optToggle("voiceDisableWinIsolation", isRu ? "Фикс задержки микрофона Windows WASAPI" : "Windows WASAPI Latency Fix", isRu ? "Отключает проблемный voiceIsolation в Chromium, убирая проглатывание первых слов." : "Disables buggy Chromium voiceIsolation flag that delays/muffles mic startup on Windows.")}
          ${optToggle("voiceAutoGain", isRu ? "Автоусиление микрофона (AGC)" : "Microphone Auto Gain Control (AGC)", isRu ? "Выравнивает громкость тихой речи для стабильного распознавания." : "Normalizes quiet microphone levels for consistent speech capture.")}
          ${optToggle("voiceTextCleanup", isRu ? "Умная очистка текста диктовки" : "Smart Dictation Text Cleanup", isRu ? "Убирает двойные пробелы, пробелы перед знаками препинания и повторы слов на стыках." : "Fixes double spaces, stray spaces before punctuation, and duplicate word stutters.")}
          ${optToggle("voicePauseHeavyUi", isRu ? "Приостанавливать тяжёлый UI и blur при диктовке" : "Pause Heavy UI & Blur While Dictating", isRu ? "Исключает микрофризы во время записи голоса." : "Eliminates UI frame drops and observer load during active dictation.")}
          ${optToggle("voiceShowBadge", isRu ? "Таймер рядом с кнопкой записи" : "Inline Timer Next to Record Button", isRu ? "Компактный индикатор времени (0:12) справа от красной кнопки диктовки — не перекрывает текст." : "Compact elapsed timer (0:12) right beside the red stop-recording button — never covers text.")}
        </div>
      </div>

      <div class="section-group" data-opt-sec="opt-sec-cache">
        <div class="opt-section-head">
          <span class="section-label">${isRu ? "Агенты Gemini, файлы ПК и кэш" : "Gemini Agents, Files & Cache"}</span>
          <span class="opt-badge-exp">${isRu ? "Экспериментально · Выкл. по умолчанию" : "Experimental · Off by default"}</span>
        </div>
        <div class="card">
          <div class="card-pad opt-diag-head">
            <div class="opt-kpi-grid">
              <div class="opt-kpi-card">
                <span class="opt-kpi-label">${isRu ? "Попадание в Prompt Cache" : "Prompt Cache Hit Rate"}</span>
                <span class="opt-kpi-val is-accent num">${escHtml(cacheHitStr)}</span>
                <span class="opt-kpi-sub">${diag && diag.promptCache ? (isRu ? `${diag.promptCache.turnsSampled} ходов · ${diag.promptCache.chatsSampled} чатов` : `${diag.promptCache.turnsSampled} turns · ${diag.promptCache.chatsSampled} chats`) : (isRu ? "Нажмите «Обновить»" : "Click Refresh")}</span>
              </div>
              <div class="opt-kpi-card">
                <span class="opt-kpi-label">${isRu ? "Потоки Language Server" : "Language Server Threads"}</span>
                <span class="opt-kpi-val num">${escHtml(lsThreadsStr)}</span>
                <span class="opt-kpi-sub">${diag && diag.lsTuning && opt.lsTuningEnabled ? `Watcher: ${diag.lsTuning.fileWatchMaxDirs} · ${diag.lsTuning.goMemLimit || "auto"}` : (isRu ? "Стандартный режим Antigravity" : "Stock Antigravity default")}</span>
              </div>
              <div class="opt-kpi-card">
                <span class="opt-kpi-label">${isRu ? "Временные кэши на диске" : "Cleanable Disk Caches"}</span>
                <span class="opt-kpi-val num">${escHtml(cleanableStr)}</span>
                <span class="opt-kpi-sub">${diag ? `Chromium ${fmtMb(diag.buckets.chromiumCache.bytes)} · Part ${fmtMb(diag.buckets.partitionsCache.bytes)}` : "—"}</span>
              </div>
              <div class="opt-kpi-card">
                <span class="opt-kpi-label">app_storage.json</span>
                <span class="opt-kpi-val num">${diag && diag.appStorage ? escHtml(fmtKb(diag.appStorage.bytes)) : "—"}</span>
                <span class="opt-kpi-sub">${isRu ? `Мёртвых макетов: ${staleKeysCount}` : `Stale layout keys: ${staleKeysCount}`}</span>
              </div>
            </div>
            <div class="opt-actions-bar">
              <button type="button" class="btn btn-sm" ${diagBusy ? "disabled" : ""} data-action="clean-caches">${isRu ? "Очистить временные кэши" : "Clean Temp Caches"}</button>
              <button type="button" class="btn btn-sm" ${diagBusy ? "disabled" : ""} data-action="prune-app-storage">${isRu ? "Сжать app_storage.json" : "Compact app_storage.json"}</button>
              <button type="button" class="btn btn-sm btn-ghost" ${diagLoading ? "disabled" : ""} data-action="refresh-perf-diag">${iconSvg("reset", 12)}${isRu ? "Обновить" : "Refresh"}</button>
            </div>
            ${lastMsg ? `<div class="opt-diag-msg">${escHtml(lastMsg)}</div>` : ""}
          </div>
          ${optToggle("geminiFileCacheProtocol", isRu ? "Протокол Gemini для файлов и Prompt Cache (SessionStart)" : "Gemini File I/O & Prompt Cache Protocol (SessionStart)", isRu ? "Выкл. по умолчанию. Добавляет компактное правило на 0-м ходе: пакетные чтения, точечные edit_file и бережное кэширование префикса." : "Off by default. Adds a compact turn-0 rule for parallel reads, surgical edits & prefix cache stability.")}
          ${optToggle("lsTuningEnabled", isRu ? "Тюнинг потоков language_server (после перезапуска)" : "Language Server Thread Tuning (on restart)", isRu ? "Выкл. по умолчанию. Подбирает GOMAXPROCS, File Watcher (с учётом Linux inotify), GOMEMLIMIT и UV_THREADPOOL_SIZE." : "Off by default. Auto-scales GOMAXPROCS, File Watcher (Linux inotify-safe), GOMEMLIMIT & UV_THREADPOOL_SIZE.")}
          ${optToggle("storageRamCache", isRu ? "RAM-кэш для Electron StorageManager" : "Electron StorageManager RAM Cache", isRu ? "Выкл. по умолчанию. Кэширует в памяти повторные синхронные чтения app_storage.json с проверкой mtime/ctime/size/ino." : "Off by default. Caches repeated sync app_storage.json reads in RAM guarded by mtime/ctime/size/ino.")}
          <div class="row-item opt-row-stack">
            <div class="row-info">
              <span class="row-title">${isRu ? "Лимит HTTP-кэша Chromium (после перезапуска)" : "Chromium Disk Cache Cap (on restart)"}</span>
              <span class="row-desc">${isRu ? "Выкл. по умолчанию. Ограничивает размер временного кэша Chromium на диске (50–256 МБ)." : "Off by default. Caps temporary Chromium disk cache size (50–256 MB)."}</span>
            </div>
            <div class="token-chips">
              ${capOpts.map((c) => `<button type="button" class="btn btn-sm${String(opt.chromiumCacheCapMb || 0) === c.id ? " btn-primary" : ""}" data-action="set-opt-val" data-key="chromiumCacheCapMb" data-val="${c.id}">${escHtml(c.label)}</button>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="section-group" data-opt-sec="opt-sec-anim">
        <span class="section-label">${isRu ? "Анимации и плавность интерфейса" : "Animations & 60–144 FPS Smoothness"}</span>
        <div class="card">
          <div class="row-item opt-row-stack">
            <div class="row-info">
              <span class="row-title">${isRu ? "Режим анимаций Antigravity и Rudex" : "Antigravity & Rudex Animation Curve"}</span>
              <span class="row-desc">${isRu ? "GPU-кривые cubic-bezier(0.16, 1, 0.3, 1) без дёрганий и задержек." : "GPU-composited expo-out curves without layout jank."}</span>
            </div>
            <div class="token-chips">
              ${animModes.map((am) => `<button type="button" class="btn btn-sm${opt.animMode === am.id ? " btn-primary" : ""}" data-action="set-opt-val" data-key="animMode" data-val="${am.id}">${escHtml(am.label)}</button>`).join("")}
            </div>
          </div>
          ${optToggle("animFixTransitionAll", isRu ? "Убрать layout-лаги от transition: all и skeleton-shimmer" : "Fix transition: all & skeleton-shimmer Paint Jank", isRu ? "Ограничивает CSS-переходы безопасными GPU-свойствами (opacity/transform/color)." : "Scopes transitions to compositor-safe properties so streaming never janks.")}
          ${optToggle("animContainChat", isRu ? "Изоляция слоёв сообщений чата (contain: layout style)" : "Isolate Chat Message Layout Layers (contain: layout style)", isRu ? "Ускоряет скролл и рендер в длинных переписках." : "Speeds up scrolling & token streaming in long conversations.")}
          ${optToggle("animFreezeHidden", isRu ? "Замораживать анимации в свёрнутом/скрытом окне" : "Pause Infinite Animations When Window Is Hidden", isRu ? "Обнуляет фоновый расход GPU и CPU при свёрнутом Antigravity." : "Stops idle GPU/CPU drain when Antigravity is minimized or occluded.")}
          ${optToggle("gpuAccel", isRu ? "Плавный скроллинг Chromium (после перезапуска)" : "Chromium Smooth Scrolling Flag (on restart)", isRu ? "Экспериментально (выкл. по умолчанию). Добавляет безопасный флаг --enable-smooth-scrolling." : "Experimental (off by default). Appends the safe --enable-smooth-scrolling switch.")}
        </div>
      </div>
    `;
  }

  function renderSettingsTab() {
    const tr = t();
    const isRu = state.locale !== "en";
    const sub = ["system", "optimization", "studio", "hotkeys"].indexOf(state.settingsSubTab) >= 0 ? state.settingsSubTab : "system";
    if (sub === "optimization") return renderOptimizationSub(isRu);
    if (sub === "hotkeys" && typeof rv5RenderKeybindingsHtml === "function") {
      return rv5RenderKeybindingsHtml(state.settings.keybindings, state.recordingKeybindingId, isRu);
    }
    if (sub === "studio") return renderStudioDesignSub(tr, isRu);
    return renderSystemSub(tr);
  }

  function renderWidgetsTab() {
    const tr = t();
    const isRu = state.locale !== "en";
    const wSec = state.widgetSubSection || "limits";
    if (wSec === "monitor") {
      return renderMonitorTab() + `<div style="border-top:1px solid var(--rx-border);margin-top:14px;padding-top:14px">${renderExportSub(tr)}</div>`;
    }
    if (wSec === "limits" && typeof rv5RenderLimitsTabHtml === "function") {
      return rv5RenderLimitsTabHtml({
        limitsWidget: state.settings.limitsWidget,
        quotaSummary: state.quotaSummary,
        quotaAutomation: state.settings.quotaAutomation,
        quotaAlerts: state.quotaAlerts,
        activeChatKey: state.activeChatKey,
        activeChatTitle: state.activeChatTitle,
        activeModelName: state.telemetry.modelName,
        systemFonts: state.systemFonts,
        monitorHtml: "",
        exportHtml: "",
        isRu,
        isLight: state.theme === "light",
      });
    }
    return renderWidgetSub(tr, isRu);
  }

  function renderHistoryTab() {
    const isRu = state.locale !== "en";
    if (typeof rv5RenderInputHistoryHtml !== "function") return "";
    return rv5RenderInputHistoryHtml({
      isRu,
      composerDraftsEnabled: state.settings.composerDraftsEnabled !== false,
      inputHistoryEnabled: state.settings.inputHistoryEnabled !== false,
      draftCount: state.inputHistory ? state.inputHistory.draftCount : 0,
      items: state.inputHistory ? state.inputHistory.items : [],
      loading: Boolean(state.inputHistory && state.inputHistory.loading),
      searchQuery: state.historySearchQuery || "",
    });
  }

  function renderWorkshopTab() {
    const isRu = state.locale !== "en";
    if (typeof rv5RenderWorkshopHtml !== "function") return "";
    return rv5RenderWorkshopHtml(state.workshop, isRu, state.chatAgentProfile && state.chatAgentProfile.pinnedSkills, { hideSubTabs: true });
  }

  function renderStudioDesignSub(tr, isRu) {
    const sui = spNormalizeStudioUi(state.settings.studioUi);
    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.studioDesignTitle)}</span>
        <div class="design-card-grid">
          ${STUDIO_WINDOW_THEMES.map((wt) => {
            const sel = sui.windowTheme === wt.id;
            const bodyPaneBg = wt.isLight ? "rgba(20,20,19,0.06)" : "rgba(255,255,255,0.07)";
            const accentBar = wt.accent ? `<span style="position:absolute;left:5px;top:6px;width:2px;height:10px;border-radius:1px;background:${escAttr(wt.accent)}"></span>` : "";
            return `
              <button type="button" class="design-card${sel ? " is-selected" : ""}" data-action="set-studio-theme" data-val="${wt.id}">
                <span class="design-thumb" style="background:${escAttr(wt.bg)};${wt.id === "neon-cyber" ? "border-color:var(--rx-accent)" : (wt.isLight ? "border-color:rgba(20,20,19,0.22)" : "")}">
                  <span style="width:12px;height:100%;border-radius:3px;background:${escAttr(wt.side)}"></span>
                  <span style="flex:1;height:100%;border-radius:3px;background:${bodyPaneBg}"></span>
                  ${accentBar}
                </span>
                <span class="design-meta">
                  <span class="design-title">${escHtml(isRu ? wt.nameRu : wt.nameEn)}</span>
                  <span class="design-desc">${escHtml(isRu ? wt.descRu : wt.descEn)}</span>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.studioLayoutTitle)}</span>
        <div class="design-card-grid">
          ${STUDIO_WINDOW_LAYOUTS.map((wl) => {
            const sel = sui.windowLayout === wl.id;
            let thumbInner = '<span style="width:12px;height:100%;border-radius:3px;background:var(--rx-accent-soft)"></span><span style="flex:1;height:100%;border-radius:3px;background:var(--rx-surface-2)"></span>';
            if (wl.id === "rail") thumbInner = '<span style="width:6px;height:100%;border-radius:2px;background:var(--rx-accent-soft)"></span><span style="flex:1;height:100%;border-radius:3px;background:var(--rx-surface-2)"></span>';
            else if (wl.id === "topbar") thumbInner = '<span style="width:100%;height:7px;border-radius:2px;background:var(--rx-accent-soft)"></span><span style="width:100%;flex:1;border-radius:3px;background:var(--rx-surface-2)"></span>';
            else if (wl.id === "floating-glass") thumbInner = '<span style="width:11px;height:100%;border-radius:4px;border:1px solid var(--rx-accent-border);background:var(--rx-surface-2)"></span><span style="flex:1;height:100%;border-radius:4px;border:1px solid var(--rx-border-strong);background:var(--rx-surface-2)"></span>';
            return `
              <button type="button" class="design-card${sel ? " is-selected" : ""}" data-action="set-studio-layout" data-val="${wl.id}">
                <span class="design-thumb" style="background:var(--rx-bg);${wl.id === "topbar" ? "flex-direction:column" : ""}">${thumbInner}</span>
                <span class="design-meta">
                  <span class="design-title">${escHtml(isRu ? wl.nameRu : wl.nameEn)}</span>
                  <span class="design-desc">${escHtml(isRu ? wl.descRu : wl.descEn)}</span>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.studioWindowSliders)}</span>
        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.studioRadiusLabel)}</span><b class="num" data-live-app-val="studioUi.studioRadius">${sui.studioRadius}px</b></div>
            <input type="range" class="range-input" min="8" max="26" step="1" data-app-field="studioUi.studioRadius" value="${sui.studioRadius}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.studioBlurLabel)}</span><b class="num" data-live-app-val="studioUi.studioBlur">${sui.studioBlur}px</b></div>
            <input type="range" class="range-input" min="0" max="32" step="1" data-app-field="studioUi.studioBlur" value="${sui.studioBlur}"/>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.studioScaleTitle)}</span>
        <div class="slider-box">
          <div class="scale-stepper">
            <button type="button" class="scale-step-btn" data-action="step-scale" data-target="studioScale" data-delta="-5">−</button>
            <button type="button" class="scale-pct-btn num" data-action="step-scale" data-target="studioScale" data-delta="reset" data-live-app-val="studioUi.studioScale">${sui.studioScale}%</button>
            <button type="button" class="scale-step-btn" data-action="step-scale" data-target="studioScale" data-delta="5">+</button>
            <input type="range" class="range-input" min="75" max="140" step="5" data-app-field="studioUi.studioScale" value="${sui.studioScale}"/>
          </div>
          <span class="row-desc" style="margin-top:6px;display:block">${escHtml(tr.studioScaleHint)}</span>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button type="button" class="btn btn-sm" data-action="reset-studio-ui">${iconSvg("reset", 12)}${escHtml(tr.studioResetBtn)}</button>
      </div>
    `;
  }

  function renderWidgetSub(tr, isRu) {
    const s = state.settings;
    const sui = spNormalizeStudioUi(s.studioUi);
    const mf = s.miniFields;
    const fieldSpecs = [
      { key: "status", title: tr.fieldStatus },
      { key: "lang", title: tr.fieldLang },
      { key: "tps", title: tr.fieldTps },
      { key: "respTokens", title: tr.fieldResp },
      { key: "chatTokens", title: tr.fieldChat },
      { key: "model", title: tr.fieldModel },
      { key: "quota", title: tr.fieldQuota },
    ];
    const docks = [
      { id: "inline-header", label: tr.dockInlineHeader },
      { id: "top-left", label: tr.dockTopLeft },
      { id: "top-right", label: tr.dockTopRight },
      { id: "bottom-right", label: tr.dockBottomRight },
      { id: "bottom-left", label: tr.dockBottomLeft },
      { id: "middle-right", label: tr.dockMiddleRight },
      { id: "hidden", label: tr.dockHidden },
    ];
    const isWidgetDockedUi = Boolean(s.pinned && s.layoutMode !== "floating");
    const fontOptsHtml = typeof rv5FontSelectOptions === "function"
      ? rv5FontSelectOptions(sui.widgetFont || "inherit", "ui", state.systemFonts, isRu, true)
      : `<option value="inherit">${escHtml(isRu ? "Наследовать из темы" : "Inherit from theme")}</option>`;
    const fontDatalistHtml = typeof rv5RenderSystemFontDatalist === "function" ? rv5RenderSystemFontDatalist(state.systemFonts) : "";
    const scales = [
      { id: "sm", label: tr.widgetScaleSm },
      { id: "md", label: tr.widgetScaleMd },
      { id: "lg", label: tr.widgetScaleLg },
    ];
    const isMedPrev = state.widgetPreviewMode === "medium";
    const previewMarkup = isMedPrev ? renderMediumCardMarkup(true) : renderMiniCapsuleMarkup(true);
    state.lastPreviewCapsuleHtml = previewMarkup;

    return `
      ${fontDatalistHtml}
      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span class="section-label">${escHtml(tr.previewTitle)}</span>
          <div style="display:flex;gap:4px">
            <button type="button" class="btn btn-sm${!isMedPrev ? " btn-primary" : ""}" data-action="set-widget-preview-mode" data-val="mini">${escHtml(tr.widgetPreviewMiniBtn)}</button>
            <button type="button" class="btn btn-sm${isMedPrev ? " btn-primary" : ""}" data-action="set-widget-preview-mode" data-val="medium">${escHtml(tr.widgetPreviewMedBtn)}</button>
          </div>
        </div>
        <div class="preview-stage" data-widget-theme="${escAttr(sui.widgetTheme)}" data-widget-scale="${escAttr(sui.widgetScale)}" data-live="previewCapsule">${previewMarkup}</div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(isRu ? "Режим мини-окна" : "Mini Window Mode")}</span>
        <div class="segmented-2">
          <button type="button" class="choice-card${isWidgetDockedUi ? " is-selected" : ""}" data-action="set-widget-window-mode" data-val="docked">
            <span class="choice-title"><span>${escHtml(isRu ? "Часть интерфейса (закреплён)" : "Docked UI (pinned)")}</span>${isWidgetDockedUi ? iconSvg("check", 13) : ""}</span>
            <span class="choice-desc">${escHtml(isRu ? "Встроен в выбранный угол или шапку в стиле темы" : "Embedded cleanly in corner or header matching your theme")}</span>
          </button>
          <button type="button" class="choice-card${!isWidgetDockedUi ? " is-selected" : ""}" data-action="set-widget-window-mode" data-val="floating">
            <span class="choice-title"><span>${escHtml(isRu ? "Плавающее окно" : "Floating Window")}</span>${!isWidgetDockedUi ? iconSvg("check", 13) : ""}</span>
            <span class="choice-desc">${escHtml(isRu ? "Свободно перетаскивается мышкой в любое место экрана" : "Drag freely anywhere on the screen")}</span>
          </button>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(isRu ? "Расположение по углам и в интерфейсе" : "Standard Corner & UI Slot")}</span>
        <div class="dock-grid">
          ${docks.map((d) => `
            <button type="button" class="dock-btn${s.dockPosition === d.id && s.layoutMode !== "floating" ? " is-selected" : ""}" data-action="set-dock" data-val="${d.id}">${escHtml(d.label)}</button>
          `).join("")}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span class="row-desc">${escHtml(tr.dockHiddenHint)}</span>
          ${s.layoutMode === "floating" ? `<button type="button" class="btn btn-sm" data-action="reset-position">${iconSvg("reset", 12)}${escHtml(tr.dockResetBtn)}</button>` : ""}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.widgetThemeTitle)}</span>
        <div class="design-card-grid">
          ${WIDGET_DESIGN_THEMES.map((wt) => {
            const sel = sui.widgetTheme === wt.id;
            let thumbStyle = "background:#111217;border-color:rgba(255,255,255,0.18)";
            let capsuleStyle = "width:28px;height:11px;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.28)";
            if (wt.id === "claude") {
              thumbStyle = "background:#1f1e1d;border-color:#d97757";
              capsuleStyle = "width:28px;height:11px;border-radius:999px;background:#262624;border:1px solid rgba(217,119,87,0.75)";
            } else if (wt.id === "island") {
              thumbStyle = "background:#060608;border-color:rgba(255,255,255,0.18)";
              capsuleStyle = "width:28px;height:11px;border-radius:999px;background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.20)";
            } else if (wt.id === "neon") {
              thumbStyle = "background:#090b14;border-color:var(--rx-accent)";
              capsuleStyle = "width:28px;height:11px;border-radius:999px;background:var(--rx-accent-soft);border:1px solid var(--rx-accent)";
            } else if (wt.id === "minimal") {
              thumbStyle = "background:var(--rx-bg);border-color:var(--rx-border-strong)";
              capsuleStyle = "width:28px;height:10px;border-radius:999px;background:var(--rx-surface);border:1px solid var(--rx-border-strong)";
            } else if (wt.id === "solid") {
              thumbStyle = "background:#191a20;border-color:rgba(255,255,255,0.16)";
              capsuleStyle = "width:28px;height:11px;border-radius:999px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.14)";
            }
            return `
              <button type="button" class="design-card${sel ? " is-selected" : ""}" data-action="set-widget-theme" data-val="${wt.id}">
                <span class="design-thumb" style="align-items:center;justify-content:center;${thumbStyle}">
                  <span style="${capsuleStyle}"></span>
                </span>
                <span class="design-meta">
                  <span class="design-title">${escHtml(isRu ? wt.nameRu : wt.nameEn)}</span>
                  <span class="design-desc">${escHtml(isRu ? wt.descRu : wt.descEn)}</span>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.modeTitle)}</span>
        <div class="segmented-2">
          <button type="button" class="choice-card${s.viewMode === "mini" ? " is-selected" : ""}" data-action="set-view-mode" data-val="mini">
            <span class="choice-title"><span>${escHtml(tr.modeMiniTitle)}</span>${s.viewMode === "mini" ? iconSvg("check", 13) : ""}</span>
            <span class="choice-desc">${escHtml(tr.modeMiniDesc)}</span>
          </button>
          <button type="button" class="choice-card${s.viewMode === "medium" ? " is-selected" : ""}" data-action="set-view-mode" data-val="medium">
            <span class="choice-title"><span>${escHtml(tr.modeMedTitle)}</span>${s.viewMode === "medium" ? iconSvg("check", 13) : ""}</span>
            <span class="choice-desc">${escHtml(tr.modeMedDesc)}</span>
          </button>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.widgetScaleTitle)}</span>
        <div class="subtab-bar is-segmented">
          ${scales.map((sc) => `
            <button type="button" class="subtab-btn${sui.widgetScale === sc.id ? " is-active" : ""}" data-action="set-widget-scale" data-val="${sc.id}">${escHtml(sc.label)}</button>
          `).join("")}
        </div>
        <div class="slider-box" style="margin-top:8px">
          <div class="scale-stepper">
            <button type="button" class="scale-step-btn" data-action="step-scale" data-target="widgetZoom" data-delta="-5">−</button>
            <button type="button" class="scale-pct-btn num" data-action="step-scale" data-target="widgetZoom" data-delta="reset" data-live-app-val="studioUi.widgetZoom">${sui.widgetZoom}%</button>
            <button type="button" class="scale-step-btn" data-action="step-scale" data-target="widgetZoom" data-delta="5">+</button>
            <input type="range" class="range-input" min="70" max="160" step="5" data-app-field="studioUi.widgetZoom" value="${sui.widgetZoom}"/>
          </div>
          <span class="row-desc" style="margin-top:6px;display:block">${escHtml(tr.widgetScaleHint)}</span>
        </div>
      </div>

      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${escHtml(isRu ? "Шрифт мини-окна" : "Widget Font")}</span>
          <select class="select-input" data-app-field="studioUi.widgetFont">${fontOptsHtml}</select>
          ${sui.widgetFont === "custom" ? `<input type="text" class="text-input" style="margin-top:5px" list="rudex-sys-fonts-list" data-app-field="studioUi.widgetFontCustom" value="${escAttr(sui.widgetFontCustom || "")}" placeholder="JetBrains Mono, Segoe UI…"/>` : ""}
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(isRu ? "Размер шрифта" : "Font Size")}</span><b class="num" data-live-app-val="studioUi.widgetFontSize">${sui.widgetFontSize || 12}px</b></div>
          <input type="range" class="range-input" min="10" max="18" step="1" data-app-field="studioUi.widgetFontSize" value="${sui.widgetFontSize || 12}"/>
        </div>
      </div>

      <div class="control-grid-2">
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.widgetOpacityLabel)}</span><b class="num" data-live-app-val="studioUi.widgetOpacity">${sui.widgetOpacity}%</b></div>
          <input type="range" class="range-input" min="45" max="100" step="1" data-app-field="studioUi.widgetOpacity" value="${sui.widgetOpacity}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.widgetRadiusLabel)}</span><b class="num" data-live-app-val="studioUi.widgetRadius">${sui.widgetRadius >= 999 ? tr.widgetRadiusPill : sui.widgetRadius + "px"}</b></div>
          <input type="range" class="range-input" min="4" max="25" step="1" data-app-field="studioUi.widgetRadius" value="${sui.widgetRadius >= 999 ? 25 : sui.widgetRadius}"/>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.fieldsTitle)}</span>
        <div class="control-grid-2">
          ${fieldSpecs.map((f) => `
            <div class="card" style="padding:8px 11px;display:flex;align-items:center;justify-content:space-between;gap:8px">
              <span class="row-title" style="font-size:12px">${escHtml(f.title)}</span>
              <button type="button" class="switch${mf[f.key] ? " is-on" : ""}" role="switch" aria-checked="${mf[f.key] ? "true" : "false"}" data-action="toggle-mini-field" data-key="${f.key}"><span class="switch-thumb"></span></button>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(isRu ? "Элементы над полем ввода" : "In-Chat Composer Bar")}</span>
        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(isRu ? "Кнопка «Инструменты» и контекстное окно модели" : "«Tools» button & model context meter")}</span>
              <span class="row-desc">${escHtml(isRu ? "Управление планками над полем ввода перенесено в единый раздел «Агент → Инструменты и правки»." : "Composer bar toggles live in one place under Agent → Tools & Live Edits.")}</span>
            </div>
            <button type="button" class="btn btn-sm" data-action="jump-search-hit" data-tab="persona" data-agent-sub="tools">${escHtml(isRu ? "Настроить →" : "Configure →")}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderExportSub(tr) {
    const qs = state.quotaSummary || {};
    const fams = qs.families || {};
    const gem = fams.gemini || {};
    const cla = fams.claudeGpt || {};
    const rows = Array.isArray(qs.chats) ? qs.chats : [];
    const eo = state.exportOpts;

    const renderFamCard = (title, famData) => {
      const rem5 = typeof famData.fiveHourRem === "number" ? famData.fiveHourRem : null;
      const remW = typeof famData.weeklyRem === "number" ? famData.weeklyRem : null;
      const hasFamSnapshot = Boolean((famData.updatedAt && famData.updatedAt > 0) || rem5 !== null || remW !== null);
      const missing5hLabel = hasFamSnapshot ? "—" : tr.quotaNoData;
      const missingWkLabel = hasFamSnapshot ? "—" : tr.quotaNoData;
      const badge = famData.calibrated ? tr.quotaCalibratedBadge : tr.quotaEstimatedBadge;
      return `
        <div class="quota-fam-card">
          <div class="quota-fam-head">
            <span class="row-title" style="font-size:12px">${escHtml(title)}</span>
            <span class="${famData.calibrated ? "badge-active" : "nav-badge"}">${escHtml(badge)}</span>
          </div>
          <div class="quota-bar-row">
            <div class="quota-bar-labels">
              <span>${escHtml(tr.quotaWeekShort)} ${escHtml(tr.quotaRemShort)} ${famData.weeklyReset ? "(" + escHtml(famData.weeklyReset) + ")" : ""}</span>
              <b class="num">${remW !== null ? remW + "%" : escHtml(missingWkLabel)}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${remW !== null ? remW : 0}%;background:var(--rx-success)"></div></div>
          </div>
          <div class="quota-bar-row">
            <div class="quota-bar-labels">
              <span>${escHtml(tr.quota5hShort)} ${escHtml(tr.quotaRemShort)} ${famData.fiveHourReset ? "(" + escHtml(famData.fiveHourReset) + ")" : ""}</span>
              <b class="num">${rem5 !== null ? rem5 + "%" : escHtml(missing5hLabel)}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${rem5 !== null ? rem5 : 0}%"></div></div>
          </div>
        </div>
      `;
    };

    const optSpecs = [
      { key: "includeAttachments", label: tr.exportOptAttachments },
      { key: "includeArtifacts", label: tr.exportOptArtifacts },
      { key: "includePersona", label: tr.exportOptPersona },
      { key: "includeThinking", label: tr.exportOptThinking },
      { key: "includeFullLog", label: tr.exportOptFullLog },
    ];
    const er = state.exportResult;

    return `
      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <span class="section-label">${escHtml(tr.exportTitle)}</span>
          <span class="status-pill" data-live="chatBadge">${escHtml(formatChatBadgeLabel())}</span>
        </div>
        <span class="row-desc">${escHtml(tr.exportDesc)}</span>
        <div class="export-checks">
          ${optSpecs.map((op) => `
            <label class="export-check-item">
              <input type="checkbox" ${eo[op.key] ? "checked" : ""} data-action="toggle-export-opt" data-key="${op.key}"/>
              <span>${escHtml(op.label)}</span>
            </label>
          `).join("")}
        </div>
        <div class="action-bar">
          <div class="action-btns">
            <button type="button" class="btn btn-primary" ${state.exportBusy ? "disabled" : ""} data-action="export-chat-zip" data-choose="0">${iconSvg("download", 13)}${escHtml(state.exportBusy ? tr.exportBusy : tr.exportBtnDownloads)}</button>
            <button type="button" class="btn" ${state.exportBusy ? "disabled" : ""} data-action="export-chat-zip" data-choose="1">${escHtml(tr.exportBtnSaveAs)}</button>
          </div>
          ${state.exportError ? `<span class="toast-text is-err">${escHtml(tr.exportErr)} ${escHtml(state.exportError)}</span>` : ""}
        </div>
        ${er && er.ok ? `
          <div class="export-result-card">
            <div class="row-info">
              <span class="row-title" style="font-size:12px">${escHtml(tr.exportSuccess)} <span class="num">${escHtml(er.fileName)}</span> (${escHtml(formatBytesCompact(er.sizeBytes))})</span>
              <span class="row-desc num">${er.counts ? `${er.counts.messages || 0} ${escHtml(tr.exportSummaryMsgs)} · ${er.counts.attachments || 0} ${escHtml(tr.exportSummaryAttach)} · ${er.counts.artifacts || 0} ${escHtml(tr.exportSummaryArtifacts)}` : ""} · ${escHtml(er.source === "disk" ? tr.exportSourceDisk : tr.exportSourceDom)}</span>
            </div>
            <button type="button" class="btn btn-sm" data-action="reveal-export-file" data-path="${escAttr(er.zipPath)}">${iconSvg("folder", 12)}${escHtml(tr.exportRevealBtn)}</button>
          </div>
        ` : ""}
      </div>

      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <span class="section-label">${escHtml(tr.quotaTableTitle)}</span>
          <button type="button" class="btn btn-sm" data-action="reset-quota-stats">${iconSvg("reset", 12)}${escHtml(tr.quotaResetBtn)}</button>
        </div>
        <div class="quota-fam-grid">
          ${renderFamCard(tr.quotaGeminiLabel, gem)}
          ${renderFamCard(tr.quotaClaudeLabel, cla)}
        </div>
        <span class="row-desc">${escHtml(tr.quotaCalibrateTip)}</span>
        <div class="quota-table-wrap">
          ${rows.length === 0 ? `<div class="card-pad" style="font-size:12px;color:var(--rx-muted)">${escHtml(tr.quotaTableEmpty)}</div>` : `
            <div class="quota-table-row is-head">
              <span>${escHtml(tr.quotaColChat)}</span>
              <span>${escHtml(tr.quotaColModel)}</span>
              <span>${escHtml(tr.quotaColWeek)}</span>
              <span>${escHtml(tr.quotaCol5h)}</span>
              <span>${escHtml(tr.quotaColTurns)}</span>
            </div>
            ${rows.map((r) => `
              <div class="quota-table-row${r.chatKey === state.activeChatKey ? " is-active" : ""}">
                <span class="quota-chat-name" title="${escAttr(r.title)}">${escHtml(r.title)}</span>
                <span class="quota-chat-name" style="font-weight:400;color:var(--rx-muted)" title="${escAttr(r.modelName)}">${escHtml(r.modelName || r.primaryFamily)}</span>
                <span class="num">${escHtml(formatQuotaPct(r.weeklyPct))}</span>
                <span class="num">${escHtml(formatQuotaPct(r.fiveHourWindowPct))} / ${escHtml(formatQuotaPct(r.fiveHourPct))}</span>
                <span class="num">${r.turns || 0}</span>
              </div>
            `).join("")}
          `}
        </div>
      </div>
    `;
  }

  function renderSystemSub(tr) {
    const isRu = state.locale !== "en";
    const sui = spNormalizeStudioUi(state.settings.studioUi);
    const thinkingRu = Boolean(state.settings.thinkingInRussian);
    const workLogRu = Boolean(state.settings.workLogInRussian);
    const autoUpdates = state.settings.autoCheckUpdates !== false;
    const u = state.update || {};
    const uStatus = u.status || "idle";
    const uBusy = uStatus === "checking" || uStatus === "downloading" || uStatus === "verifying" || uStatus === "extracting" || uStatus === "installing" || uStatus === "restarting";
    const inst = u.installed || {};
    const ver = inst.version || pluginMeta.version || "5.5.1";
    const verDisplay = inst.commitShort ? `v${ver} · #${inst.commitShort}` : `v${ver}`;
    const dictCount = pluginMeta.dictEntries || 4068;
    const dynCount = pluginMeta.dynamicRulesCount || 485;

    const checkedTime = formatLastCheckTime(u.lastCheckedAt);
    const instShaTag = inst.commitShort ? ` · #${inst.commitShort}` : "";
    const remShaTag = u.remote && u.remote.commitShort ? ` → #${u.remote.commitShort}` : "";
    const hasReleaseSha256 = Boolean(u.remote && u.remote.sha256);

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.langCardsTitle)}</span>
        <div class="segmented-2">
          <button type="button" class="choice-card${isRu ? " is-selected" : ""}" data-action="set-locale" data-val="ru">
            <span class="choice-title"><span>${escHtml(tr.langRuTitle)}</span>${isRu ? `<span class="badge-active">${escHtml(tr.langActiveBadge)}</span>` : ""}</span>
            <span class="choice-desc">${escHtml(tr.langRuDesc)}</span>
          </button>
          <button type="button" class="choice-card${!isRu ? " is-selected" : ""}" data-action="set-locale" data-val="en">
            <span class="choice-title"><span>${escHtml(tr.langEnTitle)}</span>${!isRu ? `<span class="badge-active">${escHtml(tr.langActiveBadge)}</span>` : ""}</span>
            <span class="choice-desc">${escHtml(tr.langEnDesc)}</span>
          </button>
        </div>
        <div class="card" style="margin-top:8px">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.thinkingRuTitle)}</span>
              <span class="row-desc">${escHtml(tr.thinkingRuDesc)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span class="${thinkingRu ? "badge-active" : "nav-badge"}">${escHtml(thinkingRu ? tr.thinkingRuOn : tr.thinkingRuDefault)}</span>
              <button type="button" class="switch${thinkingRu ? " is-on" : ""}" role="switch" aria-checked="${thinkingRu ? "true" : "false"}" data-action="toggle-thinking-ru" aria-label="${escAttr(tr.thinkingRuTitle)}"><span class="switch-thumb"></span></button>
            </div>
          </div>
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.workLogRuTitle)}</span>
              <span class="row-desc">${escHtml(tr.workLogRuDesc)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span class="${workLogRu ? "badge-active" : "nav-badge"}">${escHtml(workLogRu ? tr.thinkingRuOn : tr.thinkingRuDefault)}</span>
              <button type="button" class="switch${workLogRu ? " is-on" : ""}" role="switch" aria-checked="${workLogRu ? "true" : "false"}" data-action="toggle-worklog-ru" aria-label="${escAttr(tr.workLogRuTitle)}"><span class="switch-thumb"></span></button>
            </div>
          </div>
          ${thinkingRu || workLogRu ? `
            <div class="row-item opt-row-stack">
              <div class="row-info">
                <span class="row-title">${escHtml(tr.thinkingLocalTitle)}</span>
                <span class="row-desc">${escHtml(tr.thinkingLocalDesc)}</span>
              </div>
              <input type="text" class="text-input" data-sys-field="thinkingTranslatorUrl" value="${escAttr(state.settings.thinkingTranslatorUrl || "")}" placeholder="${escAttr(tr.thinkingLocalPlaceholder)}" spellcheck="false" autocomplete="off"/>
            </div>
          ` : ""}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appScaleTitle)}</span>
        <div class="slider-box">
          <div class="scale-stepper">
            <button type="button" class="scale-step-btn" data-action="step-scale" data-target="appScale" data-delta="-5">−</button>
            <button type="button" class="scale-pct-btn num" data-action="step-scale" data-target="appScale" data-delta="reset" data-live-app-val="studioUi.appScale">${sui.appScale}%</button>
            <button type="button" class="scale-step-btn" data-action="step-scale" data-delta="5" data-target="appScale">+</button>
            <input type="range" class="range-input" min="70" max="150" step="5" data-app-field="studioUi.appScale" value="${sui.appScale}"/>
          </div>
          <div class="token-chips" style="margin-top:8px">
            ${[80, 90, 100, 110, 125].map((pct) => `
              <button type="button" class="btn btn-sm${sui.appScale === pct ? " btn-primary" : ""}" data-action="set-app-scale" data-val="${pct}">${pct}%</button>
            `).join("")}
          </div>
          <span class="row-desc" style="margin-top:6px;display:block">${escHtml(tr.appScaleDesc)}</span>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.updateSectionTitle)}</span>
        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.updateAutoTitle)}</span>
              <span class="row-desc">${escHtml(tr.updateAutoDesc)}</span>
            </div>
            <button type="button" class="switch${autoUpdates ? " is-on" : ""}" role="switch" aria-checked="${autoUpdates ? "true" : "false"}" data-action="toggle-auto-updates" aria-label="${escAttr(tr.updateAutoTitle)}"><span class="switch-thumb"></span></button>
          </div>
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.updateStatusLabel)}</span>
              <span class="row-desc num">${escHtml(formatUpdateStatusLabel(u, tr))}${u.available && u.remote ? ` (${escHtml(formatUpdateVersionBadge(u))})` : escHtml(instShaTag)}${u.available && remShaTag ? escHtml(remShaTag) : ""}${checkedTime ? ` · ${escHtml(tr.updateLastCheckLabel)} ${escHtml(checkedTime)}` : ""}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              ${hasReleaseSha256 ? `<span class="nav-badge">SHA-256</span>` : ""}
              ${u.available ? `<span class="badge-active">${escHtml(tr.updateBadgeNew)}</span>` : ""}
              <button type="button" class="btn btn-sm btn-ghost" data-action="preview-update-toast">${escHtml(tr.updateBtnPreview)}</button>
              <button type="button" class="btn btn-sm" ${uBusy ? "disabled" : ""} data-action="check-updates">${iconSvg("reset", 12)}${escHtml(tr.updateBtnCheck)}</button>
              ${u.available ? `<button type="button" class="btn btn-sm btn-primary" ${uBusy ? "disabled" : ""} data-action="install-update">${iconSvg("download", 12)}${escHtml(tr.updateBtnInstallRestart)}</button>` : ""}
            </div>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.pluginInfoTitle)}</span>
        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${state.locale !== "en" ? "Резервная копия профиля Rudex (JSON)" : "Backup / Share Rudex Profile (JSON)"}</span>
              <span class="row-desc">${state.locale !== "en" ? "Темы, шрифты, правки элементов, переименования, хоткеи, лимиты и пресеты агента" : "Themes, fonts, element overrides, custom labels, hotkeys, limits & agent presets"}</span>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button type="button" class="btn btn-sm" data-action="export-config-json">${state.locale !== "en" ? "Экспорт" : "Export"}</button>
              <button type="button" class="btn btn-sm" data-action="import-config-json">${state.locale !== "en" ? "Импорт" : "Import"}</button>
            </div>
          </div>
          <div class="row-item"><span class="row-title">${escHtml(tr.pluginVersion)}</span><span class="kbd num">${escHtml(verDisplay)}</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.pluginDict)}</span><span class="row-title num">${Number(dictCount).toLocaleString()}</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.pluginRules)}</span><span class="row-title num">${Number(dynCount).toLocaleString()}</span></div>
          <div class="row-item">
            <span class="row-title">${escHtml(tr.pluginRepo)}</span>
            <a class="repo-link" href="https://github.com/Ivan0967pro/Rudex" target="_blank" rel="noopener noreferrer">Rudex (GitHub) ${iconSvg("external", 12)}</a>
          </div>
        </div>
      </div>
    `;
  }

  function getSearchQuickHits(queryStr, isRu) {
    const searchQ = String(queryStr || "").trim().toLowerCase();
    if (!searchQ) return [];
    return [
      { k: "тема палитра цвет акцент темная светлая claude сайдбар боковая панель проекты черный фон карточк линии границ theme palette accent dark light sidebar projects border", label: isRu ? "Темы, цвета сайдбара и границ" : "Themes, Sidebar & Border Colors", path: isRu ? "Оформление → Тема" : "Appearance → Theme", tab: "appearance", appSub: "theme" },
      { k: "стиль ui композер ввод чат модел claude code codex opencode antigravity style composer bubble model", label: isRu ? "Стиль UI (Claude Code / Codex / OpenCode)" : "UI Style (Claude Code / Codex / OpenCode)", path: isRu ? "Оформление → Стиль UI" : "Appearance → UI Style", tab: "appearance", appSub: "uistyle" },
      { k: "обои градиент видео картинк фон wallpaper gradient image video", label: isRu ? "Обои, фото, видео и градиенты" : "Wallpaper, Video & Gradients", path: isRu ? "Оформление → Обои" : "Appearance → Wallpaper", tab: "appearance", appSub: "wallpaper" },
      { k: "границ обводк линии разделител стекло прозрачн размыт border divider surface glass blur", label: isRu ? "Стекло, размытие, линии и границы" : "Glass, Blur, Lines & Borders", path: isRu ? "Оформление → Стекло" : "Appearance → Glass", tab: "appearance", appSub: "surface" },
      { k: "шрифт font типографика размер текст код ввод агент жирност межстрочн", label: isRu ? "Шрифты (4 слота) и типографика" : "Fonts (4 slots) & Typography", path: isRu ? "Оформление → Шрифты" : "Appearance → Fonts", tab: "appearance", appSub: "text" },
      { k: "угл радиус скруглен corner radius", label: isRu ? "Скругление углов" : "Corner Radii", path: isRu ? "Оформление → Углы" : "Appearance → Corners", tab: "appearance", appSub: "corners" },
      { k: "приветств экран шаблон greeting welcome placeholder", label: isRu ? "Приветствие на новом чате" : "New Chat Greeting", path: isRu ? "Оформление → Приветствие" : "Appearance → Greeting", tab: "appearance", appSub: "greeting" },
      { k: "прицел элемент цвет размер переимен скрыть проекты сайдбар зоны расположение сдвиг двигать область рамка группа picker inspector rename override zones position offset marquee region", label: isRu ? "Прицел, область и расположение элементов" : "Element Picker, Region & Positioning", path: isRu ? "Оформление → Элементы" : "Appearance → Elements", tab: "appearance", appSub: "elements" },
      { k: "лимит квот экран 5ч недел уведомлен восстановлен закрыт автопродолжен продолж quota limit bar notify alert reset auto continue resume", label: isRu ? "Лимиты, уведомления о сбросе и автопродолжение" : "Limits, Reset Notifications & Auto-Continue", path: isRu ? "Виджеты → Лимиты" : "Widgets → Limits", tab: "widgets", widgetSub: "limits" },
      { k: "мини окно виджет капсул tps плавающ закреп mini widget capsule dock", label: isRu ? "Мини-окно (TPS) и расположение" : "Mini Widget (TPS) & Placement", path: isRu ? "Виджеты → Мини-окно" : "Widgets → Mini", tab: "widgets", widgetSub: "mini" },
      { k: "монитор tps график экспорт zip архив чат квот monitor export archive", label: isRu ? "Монитор TPS и экспорт чата в ZIP" : "TPS Monitor & Chat ZIP Export", path: isRu ? "Виджеты → Монитор" : "Widgets → Monitor", tab: "widgets", widgetSub: "monitor" },
      { k: "инструмент субагент тумблер браузер поиск на лету правк контекст модел tool subagent browser live edit context window", label: isRu ? "Инструменты агента, контекст и правки на лету" : "Agent Tools, Context Meter & Live Edits", path: isRu ? "Агент → Инструменты" : "Agent → Tools", tab: "persona", agentSub: "tools" },
      { k: "характер персона промпт инструкц agents.md persona system prompt", label: isRu ? "Характер агента (для текущего чата)" : "Chat Agent Persona", path: isRu ? "Агент → Характер" : "Agent → Persona", tab: "persona", agentSub: "persona" },
      { k: "пресет режим агент preset mode", label: isRu ? "Пресеты поведения агента" : "Agent Behavior Presets", path: isRu ? "Агент → Пресеты" : "Agent → Presets", tab: "persona", agentSub: "presets" },
      { k: "история черновик сообщен буфер навсегда бессрочно draft history last 20 permanent", label: isRu ? "Черновики и история последних 20 сообщений" : "Drafts & Last 20 Messages History", path: isRu ? "История" : "History", tab: "history" },
      { k: "мастерская правил скилл skill rule mcp хук hook плагин workshop", label: isRu ? "Мастерская AGY (Rules / Skills / MCP)" : "AGY Workshop (Rules / Skills / MCP)", path: isRu ? "Мастерская" : "Workshop", tab: "workshop" },
      { k: "язык перевод мысл рабочий лог действия шаги работал локальн переводчик масштаб scale zoom обновл бекап json system language update backup translator worklog", label: isRu ? "Язык, перевод мыслей и шагов, масштаб и бекап" : "Language, Thinking & Work Log Translator, Scale & Backup", path: isRu ? "Настройки → Система" : "Settings → System", tab: "settings", setSub: "system" },
      { k: "окно studio макет сайдбар тема дизайн window layout sidebar rail topbar", label: isRu ? "Дизайн и макет окна Rudex Studio" : "Rudex Studio Window & Layout", path: isRu ? "Настройки → Окно Studio" : "Settings → Studio", tab: "settings", setSub: "studio" },
      { k: "клавиш хоткей shortcut hotkey keybind дзен zen", label: isRu ? "Горячие клавиши и режим Дзен" : "Hotkeys & Zen Mode", path: isRu ? "Настройки → Клавиши" : "Settings → Hotkeys", tab: "settings", setSub: "hotkeys" },
      { k: "голос диктовк микрофон аудио sherpa t-one кэш файл анимац плавност ускорен оптимиз voice dictation mic audio cache file animation performance", label: isRu ? "Оптимизация: Голос Pro, Файлы, Кэш и Анимации" : "Optimization: Voice Pro, Files, Cache & Animations", path: isRu ? "Настройки → Оптимизация" : "Settings → Optimization", tab: "settings", setSub: "optimization" },
    ].filter((it) => it.k.includes(searchQ) || it.label.toLowerCase().includes(searchQ) || (it.path && it.path.toLowerCase().includes(searchQ)));
  }

  function buildSearchHitsHtml(queryStr, isRu) {
    const qTrim = String(queryStr || "").trim();
    if (!qTrim) return "";
    const hits = getSearchQuickHits(qTrim, isRu);
    if (hits.length === 0) {
      return `<div class="rx-search-empty">${escHtml(isRu ? "Ничего не найдено" : "No matches")}</div>`;
    }
    return `<div class="rx-search-hits">${hits.slice(0, 6).map((q) =>
      `<button type="button" class="btn btn-sm rx-search-hit-btn" data-action="jump-search-hit" data-tab="${escAttr(q.tab)}" data-app-sub="${escAttr(q.appSub || "")}" data-set-sub="${escAttr(q.setSub || "")}" data-widget-sub="${escAttr(q.widgetSub || "")}" data-agent-sub="${escAttr(q.agentSub || "")}"><span class="rx-search-hit-label">${escHtml(q.label)}</span>${q.path ? `<span class="rx-search-hit-path">${escHtml(q.path)}</span>` : ""}</button>`
    ).join("")}</div>`;
  }

  function renderModalShell() {
    if (!state.isOpen) return "";
    const tr = t();
    const sui = spNormalizeStudioUi(state.settings.studioUi);
    const isRu = state.locale !== "en";
    const lwOn = Boolean(state.settings.limitsWidget && state.settings.limitsWidget.enabled);
    const navGroups = [
      {
        label: isRu ? "Внешний вид" : "Look & Widgets",
        items: [
          {
            id: "appearance",
            label: isRu ? "Оформление" : "Appearance",
            ic: "palette",
            title: tr.modalTitleAppearance,
            sub: isRu ? "Темы, цвета сайдбара и границ, стили UI, обои, шрифты и прицел" : "Themes, sidebar & border colors, UI styles, wallpaper, fonts & picker",
            dot: Boolean(state.appearanceDirty),
          },
          {
            id: "widgets",
            label: isRu ? "Виджеты" : "Widgets",
            ic: "gauge",
            title: isRu ? "Виджеты, лимиты и монитор" : "Widgets, Limits & Monitor",
            sub: isRu ? "Живые лимиты Antigravity, мини-окно TPS и экспорт чата в ZIP" : "Live Antigravity limits, mini TPS capsule & chat ZIP export",
            dot: lwOn,
          },
        ],
      },
      {
        label: isRu ? "Работа с агентом" : "Agent & Workspace",
        items: [
          {
            id: "persona",
            label: isRu ? "Агент" : "Agent",
            ic: "persona",
            title: isRu ? "Пульт агента и характер" : "Agent Hub & Persona",
            sub: isRu ? "Инструменты, правки на лету без остановки, характер чата и пресеты" : "Tool toggles, inline live edits, chat persona & presets",
            dot: Boolean(state.chatPersona.enabled || (state.chatAgentProfile && state.chatAgentProfile.enabled)),
          },
          {
            id: "history",
            label: isRu ? "История" : "History",
            ic: "clock",
            title: isRu ? "Черновики и история ввода" : "Drafts & Input History",
            sub: isRu ? "Автосохранение текста и вложений в каждом чате + последние 20 отправок" : "Per-chat auto-saved drafts & your last 20 messages and attachments",
            badge: state.inputHistory && state.inputHistory.draftCount > 0 ? String(state.inputHistory.draftCount) : "",
          },
          {
            id: "workshop",
            label: isRu ? "Мастерская" : "Workshop",
            ic: "puzzle",
            title: isRu ? "Мастерская AGY" : "AGY Workshop",
            sub: isRu ? "Глобальные и проектные Rules, Skills, MCP-серверы и Hooks" : "Global & project Rules, Skills, MCP servers & Hooks",
          },
        ],
      },
      {
        label: isRu ? "Система" : "System",
        items: [
          {
            id: "settings",
            label: isRu ? "Настройки" : "Settings",
            ic: "gear",
            title: isRu ? "Настройки и система" : "Settings & System",
            sub: isRu ? "Язык, перевод мыслей, голос Pro, кэш, дизайн окна Studio и клавиши" : "Language, thinking translation, Voice Pro, cache, Studio window & hotkeys",
            dot: Boolean(state.update && state.update.available),
          },
        ],
      },
    ];
    const allTabs = navGroups.reduce((acc, g) => acc.concat(g.items), []);
    const effTabId = state.activeTab === "monitor" || state.activeTab === "live-edits"
      ? (state.activeTab === "live-edits" ? "persona" : "widgets")
      : state.activeTab;
    const current = allTabs.find((x) => x.id === effTabId) || allTabs[0];
    const isAppearanceTab = current.id === "appearance";
    const isAppearanceDrawer = isAppearanceTab && Boolean(state.appearanceDockedRight);

    let stickySubTabsHtml = "";
    let bodyHtml = "";
    if (current.id === "appearance") {
      const appSub = state.appearanceSubTab || "theme";
      const appSubTabs = [
        { id: "theme", label: tr.appSubTheme },
        { id: "uistyle", label: isRu ? "Стиль UI" : "UI Style" },
        { id: "wallpaper", label: tr.appSubWallpaper },
        { id: "surface", label: isRu ? "Стекло" : "Glass" },
        { id: "text", label: isRu ? "Шрифты" : "Fonts" },
        { id: "corners", label: tr.appSubCorners },
        { id: "greeting", label: tr.appSubGreeting },
        { id: "elements", label: isRu ? "Элементы" : "Elements" },
      ];
      stickySubTabsHtml = `
        <div class="modal-sticky-subtabs">
          <div class="subtab-bar">
            ${appSubTabs.map((st) => `<button type="button" class="subtab-btn${st.id === appSub ? " is-active" : ""}" data-action="set-app-subtab" data-val="${st.id}">${escHtml(st.label)}</button>`).join("")}
          </div>
        </div>
      `;
      bodyHtml = renderAppearanceDrawerBody();
    } else if (current.id === "widgets") {
      const wSec = state.widgetSubSection || "limits";
      const wTabs = [
        { id: "limits", label: isRu ? "Лимиты Antigravity" : "Antigravity Limits", dot: lwOn },
        { id: "mini", label: isRu ? "Мини-окно (TPS)" : "Mini Widget (TPS)" },
        { id: "monitor", label: isRu ? "Монитор и Экспорт" : "Monitor & Export" },
      ];
      stickySubTabsHtml = `
        <div class="modal-sticky-subtabs">
          <div class="subtab-bar">
            ${wTabs.map((st) => `<button type="button" class="subtab-btn${st.id === wSec ? " is-active" : ""}" data-action="set-widget-subsection" data-val="${st.id}">${escHtml(st.label)}${st.dot ? ' <span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:var(--rx-accent);margin-left:4px;vertical-align:middle"></span>' : ""}</button>`).join("")}
          </div>
        </div>
      `;
      bodyHtml = renderWidgetsTab();
    } else if (current.id === "persona") {
      const aSub = state.agentSubTab || "tools";
      const aTabs = [
        { id: "tools", label: isRu ? "Инструменты и правки" : "Tools & Live Edits" },
        { id: "persona", label: isRu ? "Характер чата" : "Chat Persona", dot: Boolean(state.chatPersona.enabled) },
        { id: "presets", label: isRu ? "Пресеты" : "Presets" },
      ];
      stickySubTabsHtml = `
        <div class="modal-sticky-subtabs">
          <div class="subtab-bar">
            ${aTabs.map((st) => `<button type="button" class="subtab-btn${st.id === aSub ? " is-active" : ""}" data-action="set-agent-subtab" data-val="${st.id}">${escHtml(st.label)}${st.dot ? ' <span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:var(--rx-success);margin-left:4px;vertical-align:middle"></span>' : ""}</button>`).join("")}
          </div>
        </div>
      `;
      bodyHtml = typeof rv5RenderAgentHubTabHtml === "function"
        ? rv5RenderAgentHubTabHtml({
            agentProfile: state.chatAgentProfile,
            defaultProfile: state.settings.agentProfileDefault,
            customPresets: state.settings.customAgentPresets || [],
            liveEditInline: state.settings.liveEditInline,
            personaHtml: renderPersonaTab(),
            isRu,
            newAgentPresetName: state.newAgentPresetName,
            agentSubTab: aSub,
            chatBadgeLabel: formatChatBadgeLabel(),
          })
        : renderPersonaTab();
    } else if (current.id === "history") {
      bodyHtml = renderHistoryTab();
    } else if (current.id === "workshop") {
      const wsScope = (state.workshop && state.workshop.scope) || "global";
      const wsSub = (state.workshop && state.workshop.sub) || "rules";
      const wsData = state.workshop && state.workshop.data ? state.workshop.data : null;
      const wsCount = (arr) => (arr || []).filter((it) => wsScope === "all" || it.scope === wsScope || (wsScope === "global" && it.scope === "plugin")).length;
      const wsTabs = [
        { id: "rules", label: `${isRu ? "Правила" : "Rules"} (${wsCount(wsData && wsData.rules)})` },
        { id: "skills", label: `${isRu ? "Скиллы" : "Skills"} (${wsCount(wsData && wsData.skills)})` },
        { id: "mcp", label: `MCP (${wsCount(wsData && wsData.mcpServers)})` },
        { id: "hooks", label: isRu ? "Плагины и Хуки" : "Plugins & Hooks" },
      ];
      stickySubTabsHtml = `
        <div class="modal-sticky-subtabs">
          <div class="subtab-bar">
            ${wsTabs.map((st) => `<button type="button" class="subtab-btn${st.id === wsSub ? " is-active" : ""}" data-action="ws-set-sub" data-val="${st.id}">${escHtml(st.label)}</button>`).join("")}
          </div>
        </div>
      `;
      bodyHtml = renderWorkshopTab();
    } else {
      const sSub = ["system", "optimization", "studio", "hotkeys"].indexOf(state.settingsSubTab) >= 0 ? state.settingsSubTab : "system";
      const sTabs = [
        { id: "system", label: isRu ? "Система и язык" : "System & Language" },
        { id: "optimization", label: isRu ? "Оптимизация и Голос" : "Performance & Voice" },
        { id: "studio", label: isRu ? "Окно Studio" : "Studio Window" },
        { id: "hotkeys", label: isRu ? "Горячие клавиши" : "Hotkeys" },
      ];
      stickySubTabsHtml = `
        <div class="modal-sticky-subtabs">
          <div class="subtab-bar">
            ${sTabs.map((st) => `<button type="button" class="subtab-btn${st.id === sSub ? " is-active" : ""}" data-action="set-settings-subtab" data-val="${st.id}">${escHtml(st.label)}</button>`).join("")}
          </div>
        </div>
      `;
      bodyHtml = renderSettingsTab();
    }

    const searchHitsHtml = buildSearchHitsHtml(state.settingsSearchQuery, isRu);
    const hasSearchVal = Boolean(String(state.settingsSearchQuery || "").trim());
    const toggleStudioKb = (state.settings.keybindings && state.settings.keybindings.toggleStudio) || "Ctrl+Alt+P";
    const showHeaderSearch = !isAppearanceDrawer && (sui.windowLayout === "rail" || sui.windowLayout === "topbar");
    const canUndo = state.appearanceUndoStack.length > 0;
    const canRedo = state.appearanceRedoStack.length > 0;

    return `
      <div class="modal-backdrop${isAppearanceDrawer ? " is-appearance-live" : ""}" data-action="backdrop-close">
        <div class="modal-shell${isAppearanceDrawer ? " is-appearance-live" : ""}" data-studio-layout="${isAppearanceDrawer ? "drawer" : escAttr(sui.windowLayout)}" role="dialog" aria-modal="${isAppearanceDrawer ? "false" : "true"}" aria-label="${escAttr(tr.brandTitle)}">
          ${isAppearanceDrawer ? "" : `
            <aside class="modal-sidebar">
              <div class="sidebar-brand">
                <span class="brand-title-wrap">
                  <span class="brand-logo-dot">${iconSvg("rudexMark", 13)}</span>
                  <span class="brand-title">${escHtml(tr.brandTitle)}</span>
                </span>
                <span class="brand-ver num">v${escHtml(pluginMeta.version || "5.5.1")}</span>
              </div>
              <div class="rx-search-wrap">
                <div class="rx-search-box">
                  <input type="text" class="rx-search-input" data-role="settingsSearch" value="${escAttr(state.settingsSearchQuery || "")}" placeholder="${isRu ? "Поиск настроек…" : "Search settings…"}"/>
                  <button type="button" class="rx-search-clear${hasSearchVal ? " is-shown" : ""}" data-action="clear-search" data-role="searchClear" aria-label="${isRu ? "Очистить" : "Clear"}">×</button>
                </div>
                <div data-role="searchHits">${searchHitsHtml}</div>
              </div>
              <nav class="nav-list">
                ${navGroups.map((grp) => `
                  <div class="nav-group-label">${escHtml(grp.label)}</div>
                  ${grp.items.map((tb) => `
                    <button type="button" class="nav-item${tb.id === current.id ? " is-active" : ""}" data-action="switch-tab" data-tab="${tb.id}" title="${escAttr(tb.label)}">
                      <span class="nav-ic">${iconSvg(tb.ic, 15)}</span>
                      <span class="nav-label">${escHtml(tb.label)}</span>
                      ${tb.dot ? '<span class="nav-dot"></span>' : ""}
                      ${tb.badge ? `<span class="nav-badge">${escHtml(tb.badge)}</span>` : ""}
                    </button>
                  `).join("")}
                `).join("")}
              </nav>
              <div class="sidebar-foot">
                <div class="sidebar-foot-row">
                  <div class="sidebar-quick-actions">
                    <button type="button" class="lang-pill-btn" data-action="toggle-locale" title="${escAttr(tr.tooltipLang)}">${state.locale === "en" ? "EN" : "RU"}</button>
                    <button type="button" class="icon-btn" data-action="cycle-studio-theme" title="${escAttr(tr.studioThemeCycleTip)}">${iconSvg("palette", 13)}</button>
                    <button type="button" class="icon-btn" data-action="open-studio-design" title="${escAttr(tr.setSubStudio)}">${iconSvg("layout", 13)}</button>
                  </div>
                  <span class="kbd" title="${escAttr(tr.hkToggleModal)}">${escHtml(toggleStudioKb)}</span>
                </div>
              </div>
            </aside>
          `}
          <section class="modal-main">
            <header class="modal-header">
              <div style="display:flex;align-items:center;gap:8px;min-width:0">
                ${isAppearanceDrawer ? `<button type="button" class="icon-btn" data-action="toggle-appearance-dock" title="${escAttr(tr.appDockCenterBtn)}">${iconSvg("back", 15)}</button>` : ""}
                <div style="min-width:0">
                  <h2 class="modal-title">${escHtml(current.title)}</h2>
                  <p class="modal-sub">${escHtml(current.sub)}</p>
                </div>
              </div>
              <div class="modal-header-actions">
                ${showHeaderSearch ? `
                  <div class="modal-header-search">
                    <div class="rx-search-box">
                      <input type="text" class="rx-search-input" data-role="settingsSearch" value="${escAttr(state.settingsSearchQuery || "")}" placeholder="${isRu ? "Поиск…" : "Search…"}"/>
                      <button type="button" class="rx-search-clear${hasSearchVal ? " is-shown" : ""}" data-action="clear-search" data-role="searchClear" aria-label="${isRu ? "Очистить" : "Clear"}">×</button>
                    </div>
                    <div data-role="searchHits">${searchHitsHtml}</div>
                  </div>
                ` : ""}
                ${isAppearanceTab ? `
                  <button type="button" class="btn btn-sm" data-action="toggle-appearance-dock">
                    ${iconSvg(isAppearanceDrawer ? "panelCenter" : "panelRight", 13)}
                    <span>${escHtml(isAppearanceDrawer ? tr.appDockCenterBtn : tr.appDockRightBtn)}</span>
                  </button>
                ` : ""}
                <button type="button" class="icon-btn" data-action="close-modal" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 15)}</button>
              </div>
            </header>
            ${stickySubTabsHtml}
            <div class="modal-body">${bodyHtml}</div>
            ${isAppearanceTab ? `
              <footer class="drawer-sticky-footer">
                <div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1">
                  <button type="button" class="icon-btn" data-action="undo-appearance" data-role="appUndoBtn" ${canUndo ? "" : "disabled"} title="${escAttr(isRu ? "Отменить изменение" : "Undo")}">${iconSvg("undo", 13)}</button>
                  <button type="button" class="icon-btn" data-action="redo-appearance" data-role="appRedoBtn" ${canRedo ? "" : "disabled"} title="${escAttr(isRu ? "Повторить изменение" : "Redo")}">${iconSvg("redo", 13)}</button>
                  <button type="button" class="btn btn-sm btn-ghost" data-action="reset-appearance">${escHtml(tr.appResetBtn)}</button>
                  <span class="${state.toastMsg ? "studio-toast-pill" : (state.appearanceDirty ? "studio-dirty-pill" : "studio-toast-pill")}${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg || (state.appearanceDirty ? tr.appDirtyBadge : ""))}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  <button type="button" class="btn btn-sm" data-action="discard-appearance">${escHtml(tr.appCancelBtn)}</button>
                  <button type="button" class="btn btn-sm${state.appearanceDirty ? " btn-primary" : ""}" data-action="apply-appearance">${iconSvg("check", 12)}${escHtml(tr.appApplyBtn)}</button>
                </div>
              </footer>
            ` : `<div class="modal-global-toast${state.toastMsg ? " is-visible" : ""}${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</div>`}
          </section>
          <span class="resize-hud-badge" data-role="studioResizeHud"></span>
          <div class="modal-resize-grip" data-studio-resize="1" title="${escAttr(tr.studioResizeGripTip)}"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M11 5L5 11M11 9L9 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
        </div>
      </div>
    `;
  }

  function measureHostUiMetrics() {
    const vw = (win && Number(win.innerWidth)) || 1280;
    const vh = (win && Number(win.innerHeight)) || 800;
    let sidebarRight = 0;
    let headerTop = 0;
    let headerBottom = 0;
    let headerRightClear = 188;
    let composerLeft = 0;
    let composerRight = 0;
    try {
      if (doc && typeof doc.querySelectorAll === "function") {
        // 1. Measure real visible left sidebar so left-side widgets NEVER overlap chats or Settings
        const sides = doc.querySelectorAll('aside, [data-rudex-bg-sidebar="1"], [data-testid="sidebar"]');
        for (let i = 0; sides && i < sides.length; i += 1) {
          const el = sides[i];
          if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
          if (typeof el.getBoundingClientRect !== "function") continue;
          const r = el.getBoundingClientRect();
          if (r && r.width > 80 && r.height > 200 && r.left < 60 && r.right < vw * 0.45) {
            if (r.right > sidebarRight) sidebarRight = Math.round(r.right);
          }
        }
        // 1b. Measure chat composer so bottom-left / bottom-right widgets NEVER overlap the input box
        const compEl = typeof doc.querySelector === "function" ? doc.querySelector('[data-rudex-theme-composer="1"]') : null;
        if (compEl && typeof compEl.getBoundingClientRect === "function") {
          const cr = compEl.getBoundingClientRect();
          if (cr && cr.width > 180 && cr.height > 24 && cr.bottom > vh * 0.55) {
            composerLeft = Math.round(cr.left);
            composerRight = Math.round(cr.right);
          }
        }
        // 2. Measure real top chat header bar (below Electron titlebar if present)
        const hdrs = doc.querySelectorAll('header, [data-rudex-bg-header="1"]');
        for (let i = 0; hdrs && i < hdrs.length; i += 1) {
          const el = hdrs[i];
          if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
          if (typeof el.getBoundingClientRect !== "function") continue;
          const r = el.getBoundingClientRect();
          if (r && r.width > 200 && r.height >= 22 && r.height <= 96 && r.top >= 0 && r.bottom <= 125) {
            if (r.bottom > headerBottom) {
              headerTop = Math.round(r.top);
              headerBottom = Math.round(r.bottom);
            }
          }
        }
        // 3. Measure header action buttons & right-pane tab bar ("Открыть IDE", top-right toggle-panel [◫], artifact tabs)
        // so docked top-right / inline-header widgets NEVER cover header controls even when a right side panel is open!
        const btns = doc.querySelectorAll('button, [role="button"], [role="tab"], [role="tablist"], a');
        let ideLeft = vw;
        let ideTop = 0;
        let ideBottom = 0;
        let topBarMaxBottom = headerBottom;
        for (let i = 0; btns && i < btns.length; i += 1) {
          const b = btns[i];
          if (!b || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(b))) continue;
          if (typeof b.getBoundingClientRect !== "function") continue;
          const r = b.getBoundingClientRect();
          if (!r || r.width < 12 || r.height < 12 || r.height > 56 || r.top < 0 || r.bottom > 106) continue;
          const txt = String(b.textContent || "").trim().toLowerCase();
          const role = typeof b.getAttribute === "function" ? (b.getAttribute("role") || "") : "";
          const isIdeBtn = txt.includes("открыть ide") || txt.includes("open ide");
          const isTopRightCtrl = r.right > vw - 260 && r.top >= 20 && r.bottom <= 104;
          const isTopTab = (role === "tab" || role === "tablist") && r.top >= 20 && r.bottom <= 104 && r.right > vw * 0.35;
          if (isIdeBtn || isTopRightCtrl || isTopTab) {
            if (r.bottom + 6 > topBarMaxBottom) topBarMaxBottom = Math.round(r.bottom) + 6;
          }
          if (r.left >= vw * 0.55 && (isIdeBtn || isTopRightCtrl || (headerBottom > 0 && r.top >= headerTop - 2 && r.bottom <= headerBottom + 4))) {
            if (r.left < ideLeft) ideLeft = Math.round(r.left);
            if (r.bottom > ideBottom) {
              ideTop = Math.round(r.top);
              ideBottom = Math.round(r.bottom);
            }
          }
        }
        if (topBarMaxBottom > headerBottom) {
          if (headerTop <= 0 && ideTop > 0) headerTop = Math.max(0, ideTop - 4);
          headerBottom = topBarMaxBottom;
        }
        if (ideBottom > 0) {
          if (headerBottom === 0 || ideBottom + 5 > headerBottom) {
            headerTop = Math.max(0, ideTop - 4);
            headerBottom = ideBottom + 5;
          }
          const calcClear = Math.round(vw - ideLeft + 18);
          if (calcClear > 40 && calcClear < vw * 0.45) headerRightClear = calcClear;
        }
      }
    } catch (_e) {}
    let drawerRightReserve = 0;
    if (state.isOpen && state.activeTab === "appearance" && state.appearanceDockedRight) {
      drawerRightReserve = 504;
      try {
        const sh = modalMountEl && typeof modalMountEl.querySelector === "function"
          ? modalMountEl.querySelector(".modal-shell.is-appearance-live")
          : null;
        if (sh && typeof sh.getBoundingClientRect === "function") {
          const sr = sh.getBoundingClientRect();
          if (sr && sr.width > 120) {
            drawerRightReserve = Math.round(vw - sr.left + 12);
          }
        }
      } catch (_e) {}
    }
    if (headerBottom < 28) {
      headerTop = 30;
      headerBottom = 68;
    }
    return { vw, vh, sidebarRight, headerTop, headerBottom, headerRightClear, composerLeft, composerRight, drawerRightReserve };
  }

  function applyWidgetPosition() {
    if (!widgetMountEl) return;
    const s = state.settings;
    const sui = spNormalizeStudioUi(s.studioUi);
    const dock = normalizeDockPosition(s.dockPosition);
    const shouldHide = dock === "hidden" || Boolean(state.settings.zenMode) || Boolean(state.settings.limitsWidget && state.settings.limitsWidget.enabled && state.settings.limitsWidget.onlyLimitsMode);
    const lockedCls = s.pinned ? " is-locked" : "";
    const isFloatingPos = s.layoutMode === "floating" && typeof s.floatX === "number" && typeof s.floatY === "number";
    const uiModeCls = s.pinned && s.layoutMode !== "floating" ? " is-docked-ui" : " is-floating-ui";
    widgetMountEl.setAttribute("data-widget-theme", sui.widgetTheme);
    widgetMountEl.setAttribute("data-widget-scale", sui.widgetScale);
    widgetMountEl.className = "widget-wrap" + lockedCls + uiModeCls + (shouldHide ? " is-hidden" : "");

    widgetMountEl.style.left = "";
    widgetMountEl.style.top = "";
    widgetMountEl.style.right = "";
    widgetMountEl.style.bottom = "";
    if (shouldHide) return;

    const hm = measureHostUiMetrics();
    const isRightSideDock = dock === "top-right" || dock === "bottom-right" || dock === "middle-right" || dock === "inline-header";
    if (hm.drawerRightReserve > 0 && (isRightSideDock || (isFloatingPos && Number(s.floatX) > hm.vw - hm.drawerRightReserve - 240))) {
      widgetMountEl.className = "widget-wrap is-hidden";
      return;
    }
    if (isFloatingPos) {
      widgetMountEl.style.left = `${Math.max(8, Math.round(s.floatX))}px`;
      widgetMountEl.style.top = `${Math.max(8, Math.round(s.floatY))}px`;
      clampWidgetToViewport();
    } else {
      widgetMountEl.className = `widget-wrap dock-${dock}${lockedCls}${uiModeCls}`;
      const safeLeft = hm.sidebarRight > 0 ? hm.sidebarRight + 16 : 16;
      const safeTop = hm.headerBottom + 12;
      if (dock === "inline-header") {
        const hdrH = Math.max(28, hm.headerBottom - hm.headerTop);
        widgetMountEl.style.top = `${Math.max(4, Math.round(hm.headerTop + (hdrH - 28) / 2))}px`;
        widgetMountEl.style.right = `${hm.headerRightClear}px`;
      } else if (dock === "top-right") {
        widgetMountEl.style.top = `${safeTop}px`;
        widgetMountEl.style.right = "18px";
      } else if (dock === "top-left") {
        widgetMountEl.style.top = `${safeTop}px`;
        widgetMountEl.style.left = `${safeLeft}px`;
      } else if (dock === "bottom-left") {
        widgetMountEl.style.bottom = "14px";
        widgetMountEl.style.left = `${safeLeft}px`;
      } else if (dock === "bottom-right") {
        widgetMountEl.style.bottom = "14px";
        widgetMountEl.style.right = "18px";
      }
    }
  }

  function measureWidgetBoxRect() {
    if (!widgetMountEl) return null;
    const bodyEl = typeof widgetMountEl.querySelector === "function" ? widgetMountEl.querySelector('[data-widget-body="1"]') : null;
    const target = bodyEl || widgetMountEl;
    return typeof target.getBoundingClientRect === "function" ? target.getBoundingClientRect() : null;
  }

  function clampWidgetToViewport() {
    if (!widgetMountEl || !win || state.settings.layoutMode !== "floating") return;
    try {
      const vw = Number(win.innerWidth) || 0;
      const vh = Number(win.innerHeight) || 0;
      if (vw <= 40 || vh <= 40) return;
      const rect = measureWidgetBoxRect();
      const w = rect && rect.width > 20 ? rect.width : 240;
      const h = rect && rect.height > 16 ? rect.height : 40;
      const maxX = Math.max(8, vw - w - 8);
      const maxY = Math.max(8, vh - h - 8);
      const curX = typeof state.settings.floatX === "number" ? state.settings.floatX : 18;
      const curY = typeof state.settings.floatY === "number" ? state.settings.floatY : 18;
      const nextX = Math.min(maxX, Math.max(8, Math.round(curX)));
      const nextY = Math.min(maxY, Math.max(8, Math.round(curY)));
      widgetMountEl.style.left = `${nextX}px`;
      widgetMountEl.style.top = `${nextY}px`;
    } catch (_e) {}
  }

  function setLiveSlot(container, selector, val, isHtml) {
    if (!container || typeof container.querySelectorAll !== "function") return;
    const els = container.querySelectorAll(selector);
    for (let i = 0; i < els.length; i += 1) {
      if (isHtml) {
        if (els[i].innerHTML !== val) els[i].innerHTML = val;
      } else if (els[i].textContent !== val) {
        els[i].textContent = val;
      }
    }
  }

  function updateLiveDom() {
    const tr = t();
    const tel = state.telemetry;
    const tpsText = String(getDisplayedTps(tel));
    const tpsUnitText = getDisplayedTpsUnit(tel, tr);
    const hasExactR = tel.exactRespTokens > 0;
    const hasExactC = tel.exactContextTokens > 0;
    const respCountVal = hasExactR ? tel.exactRespTokens : tel.respTokens;
    const respNumText = `${hasExactR ? "" : "~"}${formatCompact(respCountVal)}`;
    const respText = `${respNumText} ${tr.tokShort}`;
    const miniRespText = respNumText;
    const chatCountVal = hasExactC ? tel.exactContextTokens : tel.chatTokens;
    const chatNumText = tel.contextLabel || `${hasExactC ? "" : "~"}${formatCompact(chatCountVal)}`;
    const chatText = chatNumText;
    const fullChatText = tel.contextLabel || `${chatNumText} ${tr.tokShort}`;
    const statusText = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.statusWriting : tr.statusReady);
    const phaseText = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const modelText = tel.modelName || tr.modelUnknown;
    const chatBadgeText = formatChatBadgeLabel();
    const qMiniText = getActiveChatQuotaDisplay().miniText;

    const hasPendingLe = countPendingLiveEdits() > 0;
    const containers = [widgetMountEl, modalMountEl].filter(Boolean);
    for (let i = 0; i < containers.length; i += 1) {
      const box = containers[i];
      if (typeof box.querySelectorAll !== "function") continue;
      const dots = box.querySelectorAll('[data-live="dot"]');
      for (let d = 0; d < dots.length; d += 1) {
        const cls = "status-dot" + (tel.isGenerating ? " is-live" : "");
        if (dots[d].className !== cls) dots[d].className = cls;
      }
      const leDots = box.querySelectorAll('[data-live="liveEditDot"]');
      for (let ld = 0; ld < leDots.length; ld += 1) {
        leDots[ld].style.display = hasPendingLe ? "" : "none";
      }
      setLiveSlot(box, '[data-live="tps"]', tpsText, false);
      setLiveSlot(box, '[data-live="tpsUnit"]', tpsUnitText, false);
      setLiveSlot(box, '[data-live="statusText"]', statusText, false);
      setLiveSlot(box, '[data-live="phase"]', phaseText, false);
      setLiveSlot(box, '[data-live="peak"]', String(getDisplayedPeakTps(tel)), false);
      setLiveSlot(box, '[data-live="chatBadge"]', chatBadgeText, false);
    }

    if (widgetMountEl) {
      setLiveSlot(widgetMountEl, '[data-live="resp"]', state.settings.viewMode === "mini" ? miniRespText : respText, false);
      setLiveSlot(widgetMountEl, '[data-live="chat"]', state.settings.viewMode === "mini" ? chatText : fullChatText, false);
      setLiveSlot(widgetMountEl, '[data-live="model"]', tel.modelName || (state.settings.viewMode === "mini" ? "AI" : "—"), false);
      const sparkSig = (tel.samples || []).join(",");
      if (sparkSig !== state.lastSparkMedSig) {
        state.lastSparkMedSig = sparkSig;
        setLiveSlot(widgetMountEl, '[data-live="sparkMed"]', buildSparklineMarkup(tel.samples, 260, 38, "med"), true);
      }
      setLiveSlot(widgetMountEl, '[data-live="quotaMini"]', qMiniText, false);
      setLiveSlot(widgetMountEl, '[data-live="quotaMed"]', qMiniText, false);
      if (state.settings.layoutMode === "floating" && !dragState) {
        clampWidgetToViewport();
      }
    }

    if (state.settings.limitsWidget && state.settings.limitsWidget.enabled && limitsMountEl) {
      const f = state.quotaSummary && state.quotaSummary.families ? state.quotaSummary.families : null;
      const g = f && f.gemini ? `${f.gemini.fiveHourRem}/${f.gemini.weeklyRem}/${f.gemini.fiveHourReset}/${f.gemini.weeklyReset}/${f.gemini.fiveHourEstimated ? 1 : 0}` : "";
      const c = f && f.claudeGpt ? `${f.claudeGpt.fiveHourRem}/${f.claudeGpt.weeklyRem}/${f.claudeGpt.fiveHourReset}/${f.claudeGpt.weeklyReset}/${f.claudeGpt.fiveHourEstimated ? 1 : 0}` : "";
      const limSig = `${g}|${c}|${tel.modelName || ""}`;
      if (limSig !== state.lastLimitsQuotaSig) {
        state.lastLimitsQuotaSig = limSig;
        renderLimitsWidgetMount();
      }
    }
    if (state.settings.liveEditInline && state.settings.liveEditInline.showContextMeter && chatDockMountEl) {
      renderChatDockMount();
    }
    if (modalMountEl && state.isOpen) {
      setLiveSlot(modalMountEl, '[data-live="resp"]', respText, false);
      setLiveSlot(modalMountEl, '[data-live="respNum"]', respNumText, false);
      setLiveSlot(modalMountEl, '[data-live="respSub"]', hasExactR ? tr.kpiSubExact : tr.kpiSubEst, false);
      setLiveSlot(modalMountEl, '[data-live="chat"]', fullChatText, false);
      setLiveSlot(modalMountEl, '[data-live="chatNum"]', chatNumText, false);
      if (typeof modalMountEl.querySelectorAll === "function") {
        const unitEls = modalMountEl.querySelectorAll('[data-live="chatUnit"]');
        for (let u = 0; u < unitEls.length; u += 1) {
          unitEls[u].style.display = tel.contextLabel ? "none" : "";
        }
      }
      setLiveSlot(modalMountEl, '[data-live="chatSub"]', hasExactC ? tr.kpiSubExact : tr.kpiSubEst, false);
      setLiveSlot(modalMountEl, '[data-live="kpiState"]', tel.isGenerating ? tr.kpiSubLive : tr.kpiSubReady, false);
      setLiveSlot(modalMountEl, '[data-live="model"]', modelText, false);
      setLiveSlot(modalMountEl, '[data-live="sparkFootMeta"]', formatSparkFootMeta(tel, tr), false);
      const sparkModalSig = (tel.samples || []).join(",");
      if (sparkModalSig !== state.lastSparkModalSig) {
        state.lastSparkModalSig = sparkModalSig;
        setLiveSlot(modalMountEl, '[data-live="sparkModal"]', buildSparklineMarkup(tel.samples, 560, 102, "modal"), true);
      }
      setLiveSlot(modalMountEl, '[data-live="quotaMed"]', qMiniText, false);
      if (state.activeTab === "widgets") {
        if (state.widgetSubSection === "limits") {
          const prevStage = typeof modalMountEl.querySelector === "function" ? modalMountEl.querySelector('[data-role="limitsPreviewStage"]') : null;
          if (prevStage && typeof rv5BuildLimitsWidgetHtml === "function") {
            const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : state.settings.limitsWidget;
            prevStage.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, tel.modelName || "", state.locale !== "en", true);
          }
        } else if (state.widgetSubSection === "mini") {
          const nextPreview = state.widgetPreviewMode === "medium" ? renderMediumCardMarkup(true) : renderMiniCapsuleMarkup(true);
          if (nextPreview !== state.lastPreviewCapsuleHtml) {
            state.lastPreviewCapsuleHtml = nextPreview;
            setLiveSlot(modalMountEl, '[data-live="previewCapsule"]', nextPreview, true);
          }
        }
      }
    }
    if (state.usagePopOpen) {
      renderModelUsagePopover();
    }
  }

  function renderStructure() {
    if (!rootEl || state.destroyed) return;
    syncTheme();
    if (modalMountEl) {
      let prevScrollTop = 0;
      let focusedSel = "";
      let selStart = null;
      let selEnd = null;
      const oldBody = modalMountEl.querySelector(".modal-body");
      if (oldBody) prevScrollTop = oldBody.scrollTop || 0;

      const activeEl = shadowRoot && shadowRoot.activeElement;
      if (activeEl && modalMountEl.contains(activeEl)) {
        const tag = String(activeEl.tagName || "").toUpperCase();
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
          const role = activeEl.getAttribute("data-role");
          const gf = activeEl.getAttribute("data-greet-field");
          const af = activeEl.getAttribute("data-app-field");
          if (role) focusedSel = `[data-role="${role}"]`;
          else if (gf) focusedSel = `[data-greet-field="${gf}"]`;
          else if (af) focusedSel = `[data-app-field="${af}"]`;
          if (typeof activeEl.selectionStart === "number") {
            selStart = activeEl.selectionStart;
            selEnd = activeEl.selectionEnd;
          }
        }
      }

      const navKey = `${state.activeTab}|${state.appearanceSubTab}|${state.widgetSubSection}|${state.agentSubTab}|${state.settingsSubTab}`;
      const navChanged = navKey !== state.lastRenderedNavKey;
      state.lastRenderedNavKey = navKey;

      modalMountEl.innerHTML = state.isOpen ? renderModalShell() : "";
      state.lastSparkModalSig = (state.telemetry.samples || []).join(",");

      if (state.isOpen) {
        const newBody = modalMountEl.querySelector(".modal-body");
        if (newBody) newBody.scrollTop = navChanged ? 0 : prevScrollTop;
      }
      if (state.isOpen && focusedSel) {
        const restored = modalMountEl.querySelector(focusedSel);
        if (restored && typeof restored.focus === "function") {
          try {
            restored.focus({ preventScroll: true });
            if (selStart !== null && typeof restored.setSelectionRange === "function") {
              restored.setSelectionRange(selStart, selEnd !== null ? selEnd : selStart);
            }
          } catch (_e) {}
        }
      }
    }
    if (widgetMountEl) {
      const bodyMarkup = state.settings.viewMode === "medium"
        ? renderMediumCardMarkup()
        : renderMiniCapsuleMarkup(false);
      widgetMountEl.innerHTML = bodyMarkup + `<span class="resize-hud-badge" data-role="widgetResizeHud"></span>`;
      state.lastSparkMedSig = (state.telemetry.samples || []).join(",");
      applyWidgetPosition();
    }
    if (popoverMountEl) {
      renderPopoverStructure();
    }
    if (updateToastMountEl) {
      renderUpdateToast();
    }
    renderLimitsWidgetMount();
    renderChatDockMount();
    renderModelUsagePopover();
    if (!isInspectorControlActive()) renderPickerMount();
  }

  // === RUDEX 5.0 LIVE CONTROLLERS ===

  function loadSystemFontsOnce() {
    if (state.systemFonts && state.systemFonts.length > 0) return;
    invokeIpc("agy-studio:list-system-fonts").then((res) => {
      if (!state.destroyed && res && Array.isArray(res.fonts)) {
        state.systemFonts = res.fonts;
        if (state.isOpen) renderStructure();
      }
    });
  }

  function resolveWorkshopWorkspacePath() {
    if (state.detectedWorkspacePath) return Promise.resolve(state.detectedWorkspacePath);
    return invokeIpc("agy-studio:get-workspace-path").then((res) => {
      if (res && typeof res.workspacePath === "string" && res.workspacePath) {
        state.detectedWorkspacePath = res.workspacePath;
        return res.workspacePath;
      }
      return "";
    });
  }

  function refreshWorkshopData() {
    state.workshop.loading = true;
    resolveWorkshopWorkspacePath().then((wsPath) => {
      if (state.destroyed) return;
      invokeIpc("agy-studio:workshop-list", { workspacePath: wsPath || "" }).then((res) => {
        if (state.destroyed) return;
        state.workshop.loading = false;
        if (res && res.ok) state.workshop.data = res;
        if (state.isOpen && state.activeTab === "workshop") {
          renderStructure();
        }
      });
    });
  }

  function pushAppearanceUndo() {
    try {
      state.appearanceUndoStack.push(JSON.stringify(state.appearanceDraft));
      if (state.appearanceUndoStack.length > 25) state.appearanceUndoStack.shift();
      state.appearanceRedoStack = [];
    } catch (_e) {}
  }

  function saveChatAgentProfile(nextProf, extraOpts) {
    const norm = typeof rv5NormalizeAgentProfile === "function" ? rv5NormalizeAgentProfile(nextProf) : Object.assign({}, nextProf);
    state.chatAgentProfile = norm;
    if ((state.activeChatKey || "__new__") === "__new__") {
      state.newChatDraftAgentProfile = norm.enabled ? Object.assign({}, norm) : null;
    }
    const optsObj = extraOpts && typeof extraOpts === "object" ? extraOpts : {};
    if (optsObj.setAsDefault) {
      state.settings.agentProfileDefault = Object.assign({}, norm);
    }
    renderChatDockMount();
    if (state.isOpen) renderStructure();
    return invokeIpc("agy-studio:save-chat-agent-profile", {
      chatKey: state.activeChatKey || "__new__",
      title: state.activeChatTitle || "",
      profile: norm,
      setAsDefault: Boolean(optsObj.setAsDefault),
    }).then((res) => {
      if (!state.destroyed && res && res.state) applyRemoteState(res.state, false);
      return res;
    });
  }

  function renderLimitsWidgetMount() {
    if (!limitsMountEl) return;
    const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : state.settings.limitsWidget;
    const hidden = !lw || !lw.enabled || Boolean(state.settings.zenMode);
    if (hidden) {
      limitsMountEl.className = "rx-limits-mount rx-zen-hidden";
      limitsMountEl.innerHTML = "";
      return;
    }
    const effPos = lw.position === "floating"
      ? "floating"
      : (lw.position === "inline-header" || lw.layout === "inline-header" ? "inline-header" : (lw.position || "top-right"));
    const posCls = effPos === "floating" ? "" : `pos-${effPos}`;
    limitsMountEl.className = `rx-limits-mount ${posCls}`.trim();
    limitsMountEl.style.left = "";
    limitsMountEl.style.top = "";
    limitsMountEl.style.right = "";
    limitsMountEl.style.bottom = "";
    limitsMountEl.style.maxWidth = "";
    const hm = measureHostUiMetrics();
    const isLimRightSlot = effPos === "top-right" || effPos === "bottom-right" || effPos === "inline-header";
    if (hm.drawerRightReserve > 0 && (isLimRightSlot || (effPos === "floating" && typeof lw.floatX === "number" && lw.floatX > hm.vw - hm.drawerRightReserve - 240))) {
      limitsMountEl.className = "rx-limits-mount rx-zen-hidden";
      limitsMountEl.innerHTML = "";
      return;
    }
    if (typeof rv5BuildLimitsWidgetHtml === "function") {
      limitsMountEl.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, state.telemetry.modelName, state.locale !== "en");
    }
    if (effPos === "floating" && typeof lw.floatX === "number" && typeof lw.floatY === "number") {
      const boxEl = typeof limitsMountEl.querySelector === "function" ? limitsMountEl.querySelector(".rx-limits-box") : null;
      const br = boxEl && typeof boxEl.getBoundingClientRect === "function" ? boxEl.getBoundingClientRect() : null;
      const bw = br && br.width > 30 ? br.width : 220;
      const bh = br && br.height > 20 ? br.height : 60;
      const nx = Math.max(8, Math.min(Math.max(8, hm.vw - bw - 8), Math.round(lw.floatX)));
      const ny = Math.max(8, Math.min(Math.max(8, hm.vh - bh - 8), Math.round(lw.floatY)));
      limitsMountEl.style.left = `${nx}px`;
      limitsMountEl.style.top = `${ny}px`;
    } else {
      const safeLeft = hm.sidebarRight > 0 ? hm.sidebarRight + 16 : 16;
      const safeTop = hm.headerBottom + 12;
      const miniVisible = !lw.onlyLimitsMode && state.settings.dockPosition !== "hidden" && state.settings.layoutMode !== "floating";
      const miniDock = normalizeDockPosition(state.settings.dockPosition);
      const miniRect = miniVisible ? measureWidgetBoxRect() : null;
      const miniH = miniRect && miniRect.height > 16 ? Math.round(miniRect.height) : 34;
      const miniW = miniRect && miniRect.width > 40 ? Math.round(miniRect.width) : 220;
      const sameSlot = miniVisible && effPos === miniDock;

      if (effPos === "inline-header") {
        const hdrH = Math.max(28, hm.headerBottom - hm.headerTop);
        limitsMountEl.style.top = `${Math.max(4, Math.round(hm.headerTop + (hdrH - 28) / 2))}px`;
        limitsMountEl.style.right = `${hm.headerRightClear + (sameSlot ? miniW + 10 : 0)}px`;
      } else if (effPos === "top-right") {
        limitsMountEl.style.top = `${safeTop + (sameSlot ? miniH + 10 : 0)}px`;
        limitsMountEl.style.right = "18px";
      } else if (effPos === "top-left") {
        limitsMountEl.style.top = `${safeTop + (sameSlot ? miniH + 10 : 0)}px`;
        limitsMountEl.style.left = `${safeLeft}px`;
      } else if (effPos === "bottom-right") {
        limitsMountEl.style.bottom = `${14 + (sameSlot ? miniH + 10 : 0)}px`;
        limitsMountEl.style.right = "18px";
        if (!lw.width && hm.composerRight > 0 && hm.vw - hm.composerRight > 200) {
          limitsMountEl.style.maxWidth = `${Math.max(190, hm.vw - hm.composerRight - 32)}px`;
        }
      } else if (effPos === "bottom-left") {
        limitsMountEl.style.bottom = `${14 + (sameSlot ? miniH + 10 : 0)}px`;
        limitsMountEl.style.left = `${safeLeft}px`;
        if (!lw.width && hm.composerLeft > safeLeft + 180) {
          limitsMountEl.style.maxWidth = `${Math.max(190, hm.composerLeft - safeLeft - 14)}px`;
        }
      }
    }
  }

  function hasVisibleNativeModal() {
    if (!doc || typeof doc.querySelectorAll !== "function") return false;
    try {
      const dlgs = doc.querySelectorAll('[role="dialog"], [role="alertdialog"]');
      for (let i = 0; dlgs && i < dlgs.length; i += 1) {
        const d = dlgs[i];
        if (!d) continue;
        if (hostEl && (d === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(d)))) continue;
        if (isHiddenAncestor(d, doc.body)) continue;
        if (typeof d.getBoundingClientRect === "function") {
          const r = d.getBoundingClientRect();
          if (r && r.width > 40 && r.height > 40) return true;
        } else {
          return true;
        }
      }
    } catch (_e) {}
    return false;
  }

  function isAgentRunningNow() {
    if (state.telemetry && state.telemetry.isGenerating) return true;
    if (!doc || typeof doc.querySelectorAll !== "function") return false;
    try {
      const busyBtns = doc.querySelectorAll('[data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"], [data-testid="send-button-loading"], [data-testid="send-button-pending"], [data-testid="stop-button"], [data-testid="cancel-button"]');
      for (let i = 0; busyBtns && i < busyBtns.length; i += 1) {
        const b = busyBtns[i];
        if (!b) continue;
        if (hostEl && (b === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(b)))) continue;
        if (!isHiddenAncestor(b, doc.body)) return true;
      }
      // Also check composer stop/cancel buttons by aria-label/title (works even if Antigravity omits input-cancel-button testid or uses a div composer!)
      const compBtnSet = new Set();
      const labeledBtns = doc.querySelectorAll('form button[aria-label], [data-testid="composer"] button[aria-label], .composer-container button[aria-label], [data-rudex-theme-composer="1"] button[aria-label], [data-rudex-theme-composer="1"] button[title]');
      for (let i = 0; labeledBtns && i < labeledBtns.length; i += 1) compBtnSet.add(labeledBtns[i]);
      if (typeof rv5FindNativeComposer === "function") {
        const nc = rv5FindNativeComposer(doc);
        if (nc && nc.container && typeof nc.container.querySelectorAll === "function") {
          const ncBtns = nc.container.querySelectorAll("button[aria-label], button[title]");
          for (let i = 0; ncBtns && i < ncBtns.length; i += 1) compBtnSet.add(ncBtns[i]);
        }
      }
      for (const b of compBtnSet) {
        if (!b || (hostEl && (b === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(b))))) continue;
        if (isHiddenAncestor(b, doc.body)) continue;
        const lbl = typeof b.getAttribute === "function" ? ((b.getAttribute("aria-label") || b.getAttribute("title") || "").replace(/\s+/g, " ").trim()) : "";
        if (!lbl || /voice|mic|dictat|record|голос|диктов|запис/i.test(lbl)) continue;
        if (/^(?:stop(?:\s+(?:generat|respond|stream|agent|exec|task)|$)|cancel(?:\s*\(|$|\s+(?:invoc|generat|request|task))|остановить(?:\s+(?:генерац|ответ|агент|работ)|$)|прервать(?:\s+(?:генерац|ответ|работ)|$)|отмен(?:а|ить)(?:\s*\(|$|\s+(?:генерац|запрос)))/i.test(lbl)) {
          return true;
        }
      }
      // Check visible streaming status heading inside the latest agent response if pollStream hasn't ticked yet
      const resps = doc.querySelectorAll('[data-testid="agent-response"]');
      if (resps && resps.length > 0) {
        const lastR = resps[resps.length - 1];
        if (lastR && !isHiddenAncestor(lastR, doc.body) && typeof lastR.querySelectorAll === "function") {
          const h6s = lastR.querySelectorAll("h6");
          for (let i = 0; h6s && i < h6s.length; i += 1) {
            if (!h6s[i] || hasMarkdownRootAncestor(h6s[i], lastR)) continue;
            const t = (h6s[i].textContent || "").replace(/\s+/g, " ").trim();
            if (t && t.length <= 48 && /agent\s+working|агент\s+работает|\bworking\b|\bgenerating\b|\bthinking\b|\bstreaming\b|работает|думает|генерац|выполня|пишет/i.test(t)) {
              return true;
            }
          }
        }
      }
      // If Antigravity's native "Queued messages / Сообщения в очереди" bar is currently visible above the composer, the agent is definitely running
      if (typeof rv5FindNativeComposer === "function") {
        const nc = rv5FindNativeComposer(doc);
        const scope = nc && nc.container && nc.container.parentElement ? nc.container.parentElement : (nc && nc.container);
        if (scope && typeof scope.querySelectorAll === "function") {
          const qEls = scope.querySelectorAll("span, div, p");
          for (let qi = 0; qEls && qi < qEls.length && qi < 40; qi += 1) {
            const qe = qEls[qi];
            if (!qe || (nc.editable && (qe === nc.editable || (typeof nc.editable.contains === "function" && nc.editable.contains(qe))))) continue;
            if (isHiddenAncestor(qe, doc.body)) continue;
            const qt = String(qe.textContent || "").replace(/\s+/g, " ").trim();
            if (qt.length >= 10 && qt.length <= 120 && /(?:сообщения\s+в\s+очереди|отправится\s+после\s+завершения|queued\s+messages|will\s+send\s+after\s+agent)/i.test(qt)) {
              return true;
            }
          }
        }
      }
    } catch (_e) {}
    return false;
  }

  function imageElToDataUrl(imgEl) {
    if (!imgEl) return "";
    const src = String((imgEl.getAttribute && imgEl.getAttribute("src")) || imgEl.src || "");
    if (src.startsWith("data:image/")) return src;
    try {
      if (doc && typeof doc.createElement === "function") {
        const w = Number(imgEl.naturalWidth) || Number(imgEl.width) || 0;
        const h = Number(imgEl.naturalHeight) || Number(imgEl.height) || 0;
        if (w > 0 && h > 0) {
          const maxDim = 2200;
          const scale = Math.min(1, maxDim / Math.max(w, h));
          const c = doc.createElement("canvas");
          c.width = Math.max(1, Math.round(w * scale));
          c.height = Math.max(1, Math.round(h * scale));
          const ctx = typeof c.getContext === "function" ? c.getContext("2d") : null;
          if (ctx && typeof ctx.drawImage === "function") {
            ctx.drawImage(imgEl, 0, 0, c.width, c.height);
            const png = typeof c.toDataURL === "function" ? c.toDataURL("image/png") : "";
            if (png && png.startsWith("data:image/")) return png;
          }
        }
      }
    } catch (_e) {}
    return src;
  }

  const thumbSrcToOrigSig = new Map();

  function computeImageVisualFingerprint(imgSource) {
    if (!imgSource || !doc || typeof doc.createElement !== "function") return null;
    try {
      const w = Number(imgSource.naturalWidth) || Number(imgSource.width) || 0;
      const h = Number(imgSource.naturalHeight) || Number(imgSource.height) || 0;
      if (w < 2 || h < 2) return null;
      const cv = doc.createElement("canvas");
      if (!cv || typeof cv.getContext !== "function") return null;
      cv.width = 16;
      cv.height = 16;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      if (!ctx || typeof ctx.drawImage !== "function" || typeof ctx.getImageData !== "function") return null;
      ctx.drawImage(imgSource, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;
      if (!data || data.length < 16 * 16 * 4) return null;
      const fp = new Uint8Array(16 * 16 * 3);
      for (let i = 0, o = 0; i < data.length; i += 4, o += 3) {
        fp[o] = data[i];
        fp[o + 1] = data[i + 1];
        fp[o + 2] = data[i + 2];
      }
      return fp;
    } catch (_e) {
      return null;
    }
  }

  function visualFingerprintMae(fpA, fpB) {
    if (!fpA || !fpB || fpA.length !== fpB.length || fpA.length === 0) return Infinity;
    let sum = 0;
    for (let i = 0; i < fpA.length; i += 1) {
      sum += Math.abs(fpA[i] - fpB[i]);
    }
    return sum / fpA.length;
  }

  function cacheOriginalImageDataUrl(dataUrl, fname, mime) {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return null;
    const sig = `${dataUrl.length}:${dataUrl.slice(0, 64)}:${dataUrl.slice(-48)}`;
    for (let i = composerOrigImages.length - 1; i >= 0; i -= 1) {
      if (composerOrigImages[i] && composerOrigImages[i].sig === sig) {
        composerOrigImages[i].ts = Date.now();
        return null;
      }
    }
    const entry = {
      sig,
      name: fname || `screenshot-${Date.now()}.png`,
      mime: mime || "image/png",
      dataUrl,
      width: 0,
      height: 0,
      aspect: 0,
      fp: null,
      ts: Date.now(),
    };
    composerOrigImages.push(entry);
    if (composerOrigImages.length > 16) composerOrigImages.shift();
    const ImgCtor = (win && win.Image) || (typeof Image !== "undefined" ? Image : null);
    if (!ImgCtor) return null;
    const p = new Promise((resolve) => {
      const probe = new ImgCtor();
      probe.onload = () => {
        entry.width = probe.naturalWidth || probe.width || 0;
        entry.height = probe.naturalHeight || probe.height || 0;
        entry.aspect = entry.height > 0 ? entry.width / entry.height : 0;
        entry.fp = computeImageVisualFingerprint(probe);
        resolve();
      };
      probe.onerror = () => resolve();
      probe.src = dataUrl;
    });
    pendingComposerReads.add(p);
    p.then(() => pendingComposerReads.delete(p), () => pendingComposerReads.delete(p));
    return p;
  }

  function cacheOriginalComposerFile(fileOrBlob) {
    if (!fileOrBlob || typeof FileReader === "undefined") return;
    const mime = String(fileOrBlob.type || "").toLowerCase();
    const fname = String(fileOrBlob.name || "").trim();
    const size = Number(fileOrBlob.size) || 0;
    const isImg = mime.startsWith("image/") || /\.(?:png|jpe?g|webp|gif|bmp)$/i.test(fname);
    if (size > 20 * 1024 * 1024) return;
    try {
      const readPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (state.destroyed || typeof reader.result !== "string" || !reader.result.startsWith("data:")) {
            resolve();
            return;
          }
          const dataUrl = reader.result;
          if (isImg && dataUrl.startsWith("data:image/")) {
            const p = cacheOriginalImageDataUrl(dataUrl, fname, mime || "image/png");
            if (p) p.then(() => resolve(), () => resolve());
            else resolve();
          } else if (fname) {
            composerOrigFiles.push({
              name: fname,
              mime: mime || "application/octet-stream",
              size,
              dataUrl,
              ts: Date.now(),
            });
            if (composerOrigFiles.length > 10) composerOrigFiles.shift();
            resolve();
          } else {
            resolve();
          }
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(fileOrBlob);
      });
      pendingComposerReads.add(readPromise);
      readPromise.then(() => pendingComposerReads.delete(readPromise), () => pendingComposerReads.delete(readPromise));
    } catch (_e) {}
  }

  function blobOrHttpUrlToDataUrl(url) {
    if (!url || typeof url !== "string") return Promise.resolve("");
    if (url.startsWith("data:")) return Promise.resolve(url);
    const fetchFn = (win && typeof win.fetch === "function" ? win.fetch.bind(win) : null) || (typeof fetch === "function" ? fetch : null);
    if (!fetchFn || typeof FileReader === "undefined") return Promise.resolve("");
    return fetchFn(url)
      .then((resp) => (resp && resp.ok && typeof resp.blob === "function" ? resp.blob() : null))
      .then((blob) => {
        if (!blob) return "";
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      })
      .catch(() => "");
  }

  function isComposerAttachmentImg(imgEl) {
    if (!imgEl || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(imgEl))) return false;
    const rawSrc = String((imgEl.getAttribute && imgEl.getAttribute("src")) || imgEl.src || "").trim().toLowerCase();
    if (rawSrc.startsWith("data:image/svg+xml") || /\.svg(?:\?|#|$)/.test(rawSrc)) return false;
    const alt = String((imgEl.getAttribute && imgEl.getAttribute("alt")) || "").toLowerCase();
    if (/\b(?:avatar|profile|logo)\b/.test(alt)) return false;
    const nw = Number(imgEl.naturalWidth) || Number(imgEl.width) || 0;
    const nh = Number(imgEl.naturalHeight) || Number(imgEl.height) || 0;
    if (nw > 0 && nh > 0 && nw <= 24 && nh <= 24) return false;
    return true;
  }

  function getComposerAttachmentScope(container) {
    if (!container) return null;
    let best = container;
    let cur = container.parentElement;
    for (let hop = 0; hop < 5 && cur && cur !== doc.body && cur !== doc.documentElement && cur.tagName !== "MAIN"; hop += 1) {
      if (typeof cur.querySelector === "function") {
        try {
          if (cur.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"]')) {
            break;
          }
          best = cur;
        } catch (_e) {
          break;
        }
      }
      cur = cur.parentElement;
    }
    return best;
  }

  function collectComposerChipFileMatches(scopeEl, editable, usedOrigImages) {
    if (!scopeEl || (composerOrigFiles.length === 0 && composerOrigImages.length === 0)) return [];
    const now = Date.now();
    // Read text + title/aria-label/alt attributes outside the editable box so Antigravity's attachment file chips are always detected
    let scopeText = "";
    try {
      const fullTxt = String(scopeEl.textContent || "");
      const edTxt = editable ? String(editable.textContent || "") : "";
      const parts = [edTxt ? fullTxt.replace(edTxt, " ") : fullTxt];
      if (typeof scopeEl.querySelectorAll === "function") {
        const metaNodes = scopeEl.querySelectorAll("[title], [aria-label], [alt]");
        for (let m = 0; metaNodes && m < metaNodes.length && m < 80; m += 1) {
          const el = metaNodes[m];
          if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
          if (editable && (el === editable || (typeof editable.contains === "function" && editable.contains(el)))) continue;
          const t = el.getAttribute && el.getAttribute("title");
          const a = el.getAttribute && el.getAttribute("aria-label");
          const alt = el.getAttribute && el.getAttribute("alt");
          if (t) parts.push(t);
          if (a) parts.push(a);
          if (alt) parts.push(alt);
        }
      }
      scopeText = parts.join(" ").toLowerCase();
    } catch (_e) {}
    const matched = [];
    const seen = new Set();
    const matchPool = (pool, isImgPool) => {
      for (let i = pool.length - 1; i >= 0 && matched.length < 6; i -= 1) {
        const f = pool[i];
        if (!f || !f.name || !f.dataUrl || seen.has(f.name) || now - f.ts > 20 * 60 * 1000) continue;
        if (isImgPool && usedOrigImages && usedOrigImages.has(f)) continue;
        const lowName = f.name.toLowerCase();
        const baseNoExt = lowName.replace(/\.[^.]+$/, "");
        const truncPrefix = baseNoExt.length >= 6 ? baseNoExt.slice(0, 6) : "";
        const hitExact = scopeText.includes(lowName);
        const hitBase = baseNoExt.length >= 3 && scopeText.includes(baseNoExt);
        const hitTrunc = truncPrefix && (scopeText.includes(truncPrefix + "…") || scopeText.includes(truncPrefix + "..."));
        if (hitExact || hitBase || hitTrunc) {
          seen.add(f.name);
          matched.push({ file: f, cacheIdx: i, isImage: Boolean(isImgPool) });
        }
      }
    };
    matchPool(composerOrigFiles, false);
    matchPool(composerOrigImages, true);
    return matched;
  }

  function hasComposerAttachments(container, editable) {
    const scope = getComposerAttachmentScope(container);
    if (!scope || typeof scope.querySelectorAll !== "function") return false;
    const imgs = scope.querySelectorAll("img");
    for (let i = 0; imgs && i < imgs.length; i += 1) {
      if (isComposerAttachmentImg(imgs[i])) return true;
    }
    return collectComposerChipFileMatches(scope, editable).length > 0;
  }

  function isAspectRatioMatch(origW, origH, thumbW, thumbH) {
    if (!origW || !origH || !thumbW || !thumbH) return true;
    const origAsp = origW / origH;
    const thumbAsp = thumbW / thumbH;
    // Relative aspect ratio comparison (works for ultra-wide 1920x210 -> 320x36 AND tall screenshots where absolute diff fails!)
    const ratio = Math.max(origAsp / thumbAsp, thumbAsp / origAsp);
    if (ratio <= 1.18) return true;
    // Also account for ±2.5px integer rounding when Antigravity shrinks wide/tall screenshots down to tiny thumbnails (e.g. 320x36)
    const expectedH = thumbW / origAsp;
    const expectedW = thumbH * origAsp;
    if (Math.abs(thumbH - expectedH) <= 2.5 || Math.abs(thumbW - expectedW) <= 2.5) return true;
    return false;
  }

  function findFullResForThumbnail(imgEl, usedCacheSet) {
    const tw = (imgEl && (Number(imgEl.naturalWidth) || Number(imgEl.width))) || 0;
    const th = (imgEl && (Number(imgEl.naturalHeight) || Number(imgEl.height))) || 0;
    const rawSrc = imgEl ? String((imgEl.getAttribute && imgEl.getAttribute("src")) || imgEl.src || "") : "";
    const srcKey = rawSrc.length >= 48 ? `${rawSrc.length}:${rawSrc.slice(0, 64)}:${rawSrc.slice(-48)}` : "";
    const now = Date.now();
    const eligible = [];
    for (let i = 0; i < composerOrigImages.length; i += 1) {
      const c = composerOrigImages[i];
      if (!c || !c.dataUrl) continue;
      if (usedCacheSet && usedCacheSet.has(c)) continue;
      if (now - c.ts > 30 * 60 * 1000) continue;
      const isHigherRes = c.width > 0
        ? (c.width > tw * 1.12 || c.height > th * 1.12)
        : (tw < 500 || th < 500);
      if (!isHigherRes) continue;
      eligible.push(c);
    }
    if (eligible.length === 0) return "";

    const rememberAndReturn = (c) => {
      if (usedCacheSet) usedCacheSet.add(c);
      if (srcKey && c.sig) {
        thumbSrcToOrigSig.set(srcKey, c.sig);
        if (thumbSrcToOrigSig.size > 48) {
          const oldest = thumbSrcToOrigSig.keys().next().value;
          thumbSrcToOrigSig.delete(oldest);
        }
      }
      return c.dataUrl;
    };

    // Pass 0: Exact remembered binding for this specific thumbnail src
    if (srcKey && thumbSrcToOrigSig.has(srcKey)) {
      const boundSig = thumbSrcToOrigSig.get(srcKey);
      const bound = eligible.find((c) => c.sig === boundSig);
      if (bound) return rememberAndReturn(bound);
    }

    const aspectMatches = eligible.filter((c) => c.width === 0 || isAspectRatioMatch(c.width, c.height, tw, th));
    const smallThumb = tw > 0 && tw <= 420 && th > 0 && th <= 420;
    const poolForFp = aspectMatches.length > 0 ? aspectMatches : (smallThumb ? eligible : []);

    // Pass 1: Visual 16x16 RGB fingerprint comparison (distinguishes identical-aspect screenshots 100% accurately!)
    const thumbFp = computeImageVisualFingerprint(imgEl);
    if (thumbFp && poolForFp.length > 0) {
      let bestCand = null;
      let bestMae = Infinity;
      let comparedCount = 0;
      for (let i = poolForFp.length - 1; i >= 0; i -= 1) {
        const c = poolForFp[i];
        if (!c.fp) continue;
        comparedCount += 1;
        const mae = visualFingerprintMae(thumbFp, c.fp);
        if (mae < bestMae) {
          bestMae = mae;
          bestCand = c;
        }
      }
      if (bestCand && bestMae <= 28) {
        return rememberAndReturn(bestCand);
      }
      // If EVERY candidate in the pool had a valid fingerprint and NONE visually matched this thumbnail,
      // do NOT open a completely different screenshot by mistake!
      if (comparedCount > 0 && comparedCount === poolForFp.length) {
        return "";
      }
    }

    // Pass 2: DOM thumbnail index alignment (prevents clicking thumb #0 from opening thumb #2 when canvas pixels aren't readable)
    let domImgs = [];
    let domIdx = -1;
    if (imgEl && typeof rv5FindNativeComposer === "function") {
      try {
        const nc = rv5FindNativeComposer(doc);
        const scope = getComposerAttachmentScope(nc && nc.container);
        domImgs = scope && typeof scope.querySelectorAll === "function"
          ? Array.from(scope.querySelectorAll("img")).filter((x) => x && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(x)))
          : [];
        domIdx = domImgs.indexOf(imgEl);
      } catch (_e) {}
    }

    if (domImgs.length > 1 && domIdx >= 0) {
      // Align chronologically with the most recent domImgs.length cached originals in composer order
      if (eligible.length >= domImgs.length) {
        const aligned = eligible[eligible.length - domImgs.length + domIdx];
        if (aligned && (aligned.width === 0 || isAspectRatioMatch(aligned.width, aligned.height, tw, th) || smallThumb)) {
          return rememberAndReturn(aligned);
        }
      }
      if (aspectMatches.length === 1) {
        return rememberAndReturn(aspectMatches[0]);
      }
      if (aspectMatches.length > 1) {
        // Count how many thumbnails in composer share this aspect ratio and match by ordinal index among them
        const sameAspectDom = domImgs.filter((x) => {
          const xw = Number(x.naturalWidth) || Number(x.width) || 0;
          const xh = Number(x.naturalHeight) || Number(x.height) || 0;
          return isAspectRatioMatch(xw, xh, tw, th);
        });
        const ordIdx = sameAspectDom.indexOf(imgEl);
        if (ordIdx >= 0 && aspectMatches.length >= sameAspectDom.length) {
          const picked = aspectMatches[aspectMatches.length - sameAspectDom.length + ordIdx];
          if (picked) return rememberAndReturn(picked);
        }
      }
      return "";
    }

    // Pass 3: Single-thumbnail composer fallback (aspect match first, then single fresh candidate for square-cropped previews)
    if (aspectMatches.length > 0) {
      return rememberAndReturn(aspectMatches[aspectMatches.length - 1]);
    }
    if (smallThumb && eligible.length === 1 && now - eligible[0].ts <= 15 * 60 * 1000) {
      return rememberAndReturn(eligible[0]);
    }
    return "";
  }

  async function handleEditImageFromDom(info) {
    if (!info || !info.imgEl) return;
    if (pendingComposerReads.size > 0) {
      try {
        await Promise.race([
          Promise.all(Array.from(pendingComposerReads)),
          new Promise((r) => (win && typeof win.setTimeout === "function" ? win.setTimeout(r, 900) : setTimeout(r, 900))),
        ]);
      } catch (_e) {}
      if (state.destroyed) return;
    }
    const im = info.imgEl;
    const rawSrc = String((im.getAttribute && im.getAttribute("src")) || im.src || "");
    const natW = Number(im.naturalWidth) || Number(im.width) || 0;
    const natH = Number(im.naturalHeight) || Number(im.height) || 0;
    const openWith = (url) => {
      if (!url || state.destroyed) return;
      openAnnotator({
        dataUrl: url,
        sourceImgEl: im,
        thumbWrapper: info.thumbWrapper || null,
        dialogEl: info.dialogEl || null,
        fromLightbox: Boolean(info.fromLightbox),
      });
    };

    // 1. If the DOM image itself is already high-resolution (>=600px on longest side), use it directly
    if (Math.max(natW, natH) >= 600) {
      const directUrl = (rawSrc.startsWith("data:image/") || rawSrc.startsWith("blob:")) ? rawSrc : imageElToDataUrl(im);
      openWith(directUrl);
      return;
    }

    // 2. Antigravity downscales composer thumbnails (~160-320px): check our full-res paste/drop/upload cache first!
    const cachedFull = findFullResForThumbnail(im);
    if (cachedFull) {
      openWith(cachedFull);
      return;
    }

    // 3. Fallback: if clipboard still holds the full-res screenshot with matching aspect ratio AND visual fingerprint, grab it seamlessly!
    const fallbackUrl = (rawSrc.startsWith("data:image/") || rawSrc.startsWith("blob:")) ? rawSrc : imageElToDataUrl(im);
    const thumbFp = computeImageVisualFingerprint(im);
    invokeIpc("agy-studio:read-clipboard-image").then((res) => {
      if (state.destroyed) return;
      if (res && res.ok && res.dataUrl) {
        const ImgCtor = (win && win.Image) || (typeof Image !== "undefined" ? Image : null);
        if (ImgCtor && natW > 0 && natH > 0) {
          const probe = new ImgCtor();
          probe.onload = () => {
            const cw = probe.naturalWidth || probe.width || 0;
            const ch = probe.naturalHeight || probe.height || 0;
            const clipFp = thumbFp ? computeImageVisualFingerprint(probe) : null;
            const visuallyMatches = !(thumbFp && clipFp) || visualFingerprintMae(thumbFp, clipFp) <= 28;
            if (visuallyMatches && (cw > natW * 1.25 || ch > natH * 1.25) && isAspectRatioMatch(cw, ch, natW, natH)) {
              cacheOriginalImageDataUrl(res.dataUrl, `clipboard-${Date.now()}.png`, "image/png");
              openWith(res.dataUrl);
            } else {
              openWith(fallbackUrl);
            }
          };
          probe.onerror = () => openWith(fallbackUrl);
          probe.src = res.dataUrl;
          return;
        }
      }
      openWith(fallbackUrl);
    });
  }

  function removeAllLiveChatBubbleSlots() {
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    const slots = doc.querySelectorAll("[data-rudex-live-slot], #rudex-live-chat-bubbles");
    for (let i = 0; slots && i < slots.length; i += 1) {
      if (slots[i] && slots[i].parentNode) slots[i].parentNode.removeChild(slots[i]);
    }
  }

  function syncLiveChatBubbles(scrollAfter) {
    if (!doc || typeof rv5SyncLiveChatBubbles !== "function") return;
    if (state.settings.zenMode) {
      removeAllLiveChatBubbleSlots();
      return;
    }
    const app = state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance;
    rv5SyncLiveChatBubbles(doc, {
      liveEdits: state.liveEdits || [],
      liveEditInline: state.settings.liveEditInline,
      dismissedIds: state.dismissedLiveEditIds,
      isRu: state.locale !== "en",
      isLight: detectAppTheme() === "light",
      accentColor: (app && app.accentColor) || "#d97757",
      onCancel: (eid) => {
        invokeIpc("agy-studio:cancel-live-edit", { id: eid, chatKey: state.activeChatKey || "__new__" }).then((res) => {
          if (!state.destroyed && res && res.ok) {
            applyLiveEditsPayload(res);
            renderChatDockMount();
          }
        });
      },
      onDismiss: (eid) => {
        state.dismissedLiveEditIds.add(eid);
        renderChatDockMount();
      },
    });
    if (scrollAfter && typeof doc.querySelectorAll === "function") {
      const slots = doc.querySelectorAll("[data-rudex-live-slot]");
      const lastSlot = slots && slots.length > 0 ? slots[slots.length - 1] : null;
      if (lastSlot && typeof lastSlot.scrollIntoView === "function") {
        try { lastSlot.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (_e) {}
      }
    }
  }

  function hasOverlappingNativePopover(dockBox) {
    if (!doc || !dockBox || typeof doc.querySelectorAll !== "function") return false;
    try {
      const nodes = doc.querySelectorAll(
        '[role="menu"], [role="listbox"], [data-radix-popper-content-wrapper] > *, [data-slot="popover-content"], [data-slot="dropdown-menu-content"], [data-slot="select-content"], [data-state="open"][data-side]'
      );
      for (let i = 0; nodes && i < nodes.length; i += 1) {
        const el = nodes[i];
        if (!el) continue;
        if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) continue;
        const role = typeof el.getAttribute === "function" ? String(el.getAttribute("role") || "").toLowerCase() : "";
        const slot = typeof el.getAttribute === "function" ? String(el.getAttribute("data-slot") || "").toLowerCase() : "";
        const st = typeof el.getAttribute === "function" ? String(el.getAttribute("data-state") || "").toLowerCase() : "";
        if (role === "tooltip" || slot === "tooltip-content" || st === "closed") continue;
        if (isHiddenAncestor(el, doc.body)) continue;
        if (typeof el.getBoundingClientRect !== "function") continue;
        const r = el.getBoundingClientRect();
        if (!r || r.width < 40 || r.height < 24) continue;
        if (
          r.left <= dockBox.right + 8 &&
          r.right >= dockBox.left - 8 &&
          r.top <= dockBox.bottom + 8 &&
          r.bottom >= dockBox.top - 8
        ) {
          return true;
        }
      }
    } catch (_e) {}
    return false;
  }

  let dockComposerObserver = null;
  let dockObservedComposerEl = null;

  function syncDockComposerResizeObserver(container) {
    if (!win || typeof win.ResizeObserver !== "function") return;
    if (!container) {
      if (dockComposerObserver && dockObservedComposerEl) {
        try { dockComposerObserver.unobserve(dockObservedComposerEl); } catch (_e) {}
      }
      dockObservedComposerEl = null;
      return;
    }
    if (dockObservedComposerEl === container) return;
    if (!dockComposerObserver) {
      try {
        dockComposerObserver = new win.ResizeObserver(() => {
          if (!state.destroyed) positionChatDock();
        });
      } catch (_e) {
        dockComposerObserver = null;
        return;
      }
    }
    if (dockObservedComposerEl) {
      try { dockComposerObserver.unobserve(dockObservedComposerEl); } catch (_e) {}
    }
    dockObservedComposerEl = container;
    try { dockComposerObserver.observe(container); } catch (_e) {}
  }

  function positionChatDock() {
    if (!chatDockMountEl || !doc || typeof rv5FindNativeComposer !== "function") return;
    if (state.settings.zenMode || hasVisibleNativeModal()) {
      chatDockMountEl.style.display = "none";
      return;
    }
    const { container } = rv5FindNativeComposer(doc);
    syncDockComposerResizeObserver(container);
    if (!container || typeof container.getBoundingClientRect !== "function") {
      chatDockMountEl.style.display = "none";
      return;
    }
    const rect = container.getBoundingClientRect();
    if (!rect || rect.width < 120 || rect.height < 24) {
      chatDockMountEl.style.display = "none";
      return;
    }
    const vw = (win && win.innerWidth) || 1280;
    const vh = (win && win.innerHeight) || 800;
    const hm = measureHostUiMetrics();
    let anchorTop = rect.top;
    // Lift Tools dock cleanly above any visible native tray directly above the composer (e.g. Antigravity's native "Queued messages" bar)
    try {
      const trayCandidates = [];
      const addPrevSibs = (node) => {
        if (!node) return;
        if (node.previousElementSibling) {
          trayCandidates.push(node.previousElementSibling);
          return;
        }
        const p = node.parentElement;
        if (p && p.children && p.children.length > 1) {
          for (let ci = 0; ci < p.children.length; ci += 1) {
            if (p.children[ci] === node) {
              if (ci > 0) trayCandidates.push(p.children[ci - 1]);
              break;
            }
          }
        }
      };
      addPrevSibs(container);
      if (container.parentElement) addPrevSibs(container.parentElement);
      for (let ti = 0; ti < trayCandidates.length; ti += 1) {
        const sib = trayCandidates[ti];
        if (!sib || sib === hostEl || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(sib))) continue;
        if (typeof sib.getBoundingClientRect !== "function" || isHiddenAncestor(sib, doc.body)) continue;
        const sr = sib.getBoundingClientRect();
        if (!sr || sr.height < 24 || sr.height > 260 || sr.width < 120) continue;
        const gapToComp = anchorTop - sr.bottom;
        const horizOverlap = Math.min(rect.right, sr.right) - Math.max(rect.left, sr.left);
        if (gapToComp >= -4 && gapToComp <= 28 && horizOverlap >= Math.min(rect.width, sr.width) * 0.5) {
          const sibTxt = String(sib.textContent || "");
          const isNativeTray = /сообщения в очереди|queued messages|отправится после заверш|will send after|pending/i.test(sibTxt) ||
            (typeof sib.querySelector === "function" && !sib.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"], [data-markdown-root]'));
          if (isNativeTray) {
            anchorTop = Math.min(anchorTop, sr.top);
          }
        }
      }
    } catch (_e) {}
    const dockLeft = Math.max(8, Math.round(rect.left));
    const dockRightLimit = hm.drawerRightReserve > 0 ? vw - hm.drawerRightReserve - 12 : vw - 8;
    if (hm.drawerRightReserve > 0 && dockLeft + 180 > dockRightLimit) {
      chatDockMountEl.style.display = "none";
      return;
    }
    const dockBottom = Math.max(12, Math.round(vh - anchorTop + 6));
    const dockBox = {
      left: dockLeft,
      right: dockLeft + Math.min(260, Math.round(rect.width)),
      top: vh - dockBottom - 32,
      bottom: vh - dockBottom,
    };
    if (!state.agentPopoverOpen && !state.contextPopoverOpen && hasOverlappingNativePopover(dockBox)) {
      chatDockMountEl.style.display = "none";
      return;
    }
    const availW = Math.max(160, Math.min(Math.round(rect.width), dockRightLimit - dockLeft));
    const popMaxH = Math.max(180, Math.min(440, Math.round(anchorTop - 24)));
    chatDockMountEl.style.display = "flex";
    chatDockMountEl.style.left = `${dockLeft}px`;
    chatDockMountEl.style.width = `${availW}px`;
    chatDockMountEl.style.bottom = `${dockBottom}px`;
    if (typeof chatDockMountEl.style.setProperty === "function") {
      chatDockMountEl.style.setProperty("--rx-pop-max-h", `${popMaxH}px`);
    }
  }

  function renderChatDockMount() {
    if (!chatDockMountEl || typeof rv5BuildChatDockHtml !== "function") return;
    if (state.settings.zenMode) {
      chatDockMountEl.className = "rx-chat-dock rx-zen-hidden";
      if (state.lastChatDockHtml !== "") {
        state.lastChatDockHtml = "";
        chatDockMountEl.innerHTML = "";
      }
      return;
    }
    const tel = state.telemetry || {};
    const hasExactCtx = Number(tel.exactContextTokens) > 0;
    const usedCtxTok = hasExactCtx ? Number(tel.exactContextTokens) : Number(tel.chatTokens) || 0;
    const nextHtml = rv5BuildChatDockHtml({
      agentProfile: state.chatAgentProfile,
      defaultProfile: state.settings.agentProfileDefault,
      customPresets: state.settings.customAgentPresets || [],
      liveEdits: state.liveEdits || [],
      dismissedIds: state.dismissedLiveEditIds,
      isGenerating: Boolean(state.telemetry.isGenerating),
      hasComposerText: Boolean(state.hasComposerText),
      liveEditInline: state.settings.liveEditInline,
      urgentMode: Boolean(state.inlineUrgent),
      popoverOpen: Boolean(state.agentPopoverOpen),
      contextPopoverOpen: Boolean(state.contextPopoverOpen),
      contextInfo: {
        modelName: tel.modelName || "",
        usedTokens: usedCtxTok,
        exact: hasExactCtx,
        chatTitle: state.activeChatTitle || "",
        isNewChat: !state.activeChatKey || state.activeChatKey === "__new__",
      },
      waitingEntry: (state.activeChatKey && state.activeChatKey !== "__new__" && state.quotaAlerts && state.quotaAlerts.waitingChats)
        ? (state.quotaAlerts.waitingChats[state.activeChatKey] || null)
        : null,
      isRu: state.locale !== "en",
    });
    if (!nextHtml) {
      chatDockMountEl.className = "rx-chat-dock rx-zen-hidden";
      if (state.lastChatDockHtml !== "") {
        state.lastChatDockHtml = "";
        chatDockMountEl.innerHTML = "";
      }
      syncLiveChatBubbles(false);
      return;
    }
    chatDockMountEl.className = "rx-chat-dock";
    if (nextHtml !== state.lastChatDockHtml) {
      state.lastChatDockHtml = nextHtml;
      chatDockMountEl.innerHTML = nextHtml;
    }
    positionChatDock();
    syncLiveChatBubbles(false);
  }

  function buildUsageRingSvg(remPct) {
    const r = 5.2;
    const c = 2 * Math.PI * r;
    const hasVal = typeof remPct === "number" && Number.isFinite(remPct);
    const pct = hasVal ? Math.max(0, Math.min(100, remPct)) : 0;
    const dash = (c * pct) / 100;
    const strokeCol = !hasVal
      ? "var(--rx-theme-muted, var(--rx-muted))"
      : (pct <= 18 ? "var(--rx-danger, #ef4444)" : (pct <= 45 ? "var(--rx-warning, #f59e0b)" : "var(--rx-success, #22c55e)"));
    return `<svg class="rx-usage-ring" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="${r}" fill="none" stroke="var(--rx-theme-border-strong, rgba(128,128,128,0.28))" stroke-width="2"/><circle cx="7" cy="7" r="${r}" fill="none" stroke="${strokeCol}" stroke-width="2" stroke-dasharray="${dash.toFixed(2)} ${c.toFixed(2)}" stroke-linecap="round"/></svg>`;
  }

  function setUsagePopTooltipGuard(isOpen) {
    if (!doc || !doc.documentElement) return;
    try {
      if (isOpen) {
        doc.documentElement.setAttribute("data-rudex-usage-pop-open", "1");
        let st = typeof doc.getElementById === "function" ? doc.getElementById("rudex-usage-pop-guard") : null;
        if (!st && doc.head && typeof doc.createElement === "function") {
          st = doc.createElement("style");
          st.id = "rudex-usage-pop-guard";
          st.textContent = `html[data-rudex-usage-pop-open="1"] [data-radix-popper-content-wrapper]:has([role="tooltip"]), html[data-rudex-usage-pop-open="1"] [role="tooltip"] { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }`;
          doc.head.appendChild(st);
        }
      } else {
        doc.documentElement.removeAttribute("data-rudex-usage-pop-open");
      }
    } catch (_e) {}
  }

  function renderModelUsagePopover() {
    if (!usagePopMountEl) return;
    if (!state.usagePopOpen || state.settings.zenMode) {
      setUsagePopTooltipGuard(false);
      if (state.lastUsagePopHtml !== "" || usagePopMountEl.style.display !== "none") {
        state.lastUsagePopHtml = "";
        usagePopMountEl.innerHTML = "";
        usagePopMountEl.style.display = "none";
      }
      return;
    }
    setUsagePopTooltipGuard(true);
    const isRu = state.locale !== "en";
    const qs = state.quotaSummary || {};
    const fams = qs.families || {};
    const gem = fams.gemini || {};
    const cla = fams.claudeGpt || {};
    const renderRow = (label, rem, _isEst, resetStr) => {
      const hasVal = typeof rem === "number" && Number.isFinite(rem);
      const pctText = hasVal
        ? `${Math.max(0, Math.min(100, Math.round(rem)))}% ${isRu ? "осталось" : "left"}`
        : (isRu ? "Нет снимка" : "No data");
      return `
        <div class="rx-usage-row">
          <div class="rx-usage-row-left">
            <span class="rx-usage-lbl">${escHtml(label)}</span>
            ${resetStr ? `<span class="rx-usage-reset">${escHtml(isRu ? `Сбросится через ${resetStr}` : `Resets in ${resetStr}`)}</span>` : ""}
          </div>
          <span class="rx-usage-row-right">${escHtml(pctText)}${buildUsageRingSvg(rem)}</span>
        </div>
      `;
    };
    const renderFamSec = (title, d) => {
      const has5 = typeof d.fiveHourRem === "number" && Number.isFinite(d.fiveHourRem);
      const hasW = typeof d.weeklyRem === "number" && Number.isFinite(d.weeklyRem);
      return `
        <div class="rx-usage-sec">
          <span class="rx-usage-sec-title">${escHtml(title)}</span>
          ${hasW || !has5 ? renderRow(isRu ? "Недельный лимит" : "Weekly limit", d.weeklyRem, d.weeklyEstimated, d.weeklyReset) : ""}
          ${has5 || !hasW ? renderRow(isRu ? "Лимит (5 ч)" : "5-hour limit", d.fiveHourRem, d.fiveHourEstimated, d.fiveHourReset) : ""}
        </div>
      `;
    };
    const lockNoteHtml = state.telemetry && state.telemetry.isGenerating
      ? `<div class="rx-usage-lock-note">${escHtml(isRu ? "Агент сейчас работает — сменить модель в этом чате нельзя, но лимиты доступны для просмотра." : "Agent is running — model switching is locked in this chat, but limits remain viewable.")}</div>`
      : `<div class="rx-usage-lock-note">${escHtml(isRu ? "Смена модели в этом чате сейчас недоступна, но лимиты доступны для просмотра." : "Model switching is currently locked in this chat, but limits remain viewable.")}</div>`;
    const nextHtml = `
      <div class="rx-usage-pop" role="dialog" aria-label="${escAttr(isRu ? "Использование моделей" : "Model Usage")}">
        <div class="rx-usage-head">
          <span class="rx-usage-title">${escHtml(isRu ? "Использование" : "Usage")}</span>
          <button type="button" class="rx-lim-btn" data-action="close-model-usage-pop" title="${escAttr(isRu ? "Закрыть" : "Close")}">${iconSvg("close", 12)}</button>
        </div>
        ${lockNoteHtml}
        ${renderFamSec(isRu ? "Модели Gemini" : "Gemini Models", gem)}
        ${renderFamSec(isRu ? "Модели Claude и GPT" : "Claude & GPT Models", cla)}
        <div class="rx-usage-foot">
          <button type="button" class="rx-usage-foot-btn" data-action="open-native-usage-settings">${escHtml(isRu ? "Настройки Antigravity →" : "Antigravity Settings →")}</button>
        </div>
      </div>
    `;
    if (nextHtml !== state.lastUsagePopHtml) {
      state.lastUsagePopHtml = nextHtml;
      usagePopMountEl.innerHTML = nextHtml;
    }
    usagePopMountEl.style.display = "block";
    const vw = (win && Number(win.innerWidth)) || 1280;
    const vh = (win && Number(win.innerHeight)) || 800;
    let rect = state.usagePopAnchor;
    try {
      const trig = doc && typeof doc.querySelector === "function" ? doc.querySelector('[data-testid="model-selector-trigger"]') : null;
      if (trig && typeof trig.getBoundingClientRect === "function") {
        const r = trig.getBoundingClientRect();
        if (r && r.width > 10 && r.height > 8) rect = r;
      }
    } catch (_e) {}
    const popBox = typeof usagePopMountEl.querySelector === "function" ? usagePopMountEl.querySelector(".rx-usage-pop") : null;
    const popRect = popBox && typeof popBox.getBoundingClientRect === "function" ? popBox.getBoundingClientRect() : null;
    const popW = popRect && popRect.width > 100 ? Math.round(popRect.width) : 316;
    const popH = popRect && popRect.height > 80 ? Math.round(popRect.height) : 310;
    const desiredLeft = rect
      ? (rect.left > vw * 0.45 ? Math.round(rect.right - popW) : Math.round(rect.left))
      : Math.round(vw / 2 - popW / 2);
    const left = Math.max(12, Math.min(vw - popW - 12, desiredLeft));
    const maxBottom = Math.max(14, vh - popH - 12);
    const bottom = rect ? Math.max(14, Math.min(maxBottom, Math.round(vh - rect.top + 10))) : 88;
    usagePopMountEl.style.left = `${left}px`;
    usagePopMountEl.style.bottom = `${bottom}px`;
    usagePopMountEl.style.top = "";
    usagePopMountEl.style.right = "";
  }

  function openNativeAntigravityUsageSettings() {
    state.usagePopOpen = false;
    renderModelUsagePopover();
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    const isExcludedHostEl = (el) => {
      if (!el) return true;
      if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) return true;
      if (typeof el.hasAttribute === "function" && (el.hasAttribute("data-rudex-native-entry") || el.hasAttribute("data-rudex-img-edit-btn"))) return true;
      if (typeof el.closest === "function" && el.closest('#rudex-studio-host, [data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"]')) return true;
      return false;
    };
    const isNativeSettingsViewOpen = () => {
      try {
        const items = doc.querySelectorAll('[role="dialog"] button, [role="dialog"] [role="tab"], main button, main [role="tab"], nav button, aside button');
        let hasGeneral = false;
        let hasModels = false;
        for (let i = 0; items && i < items.length; i += 1) {
          const it = items[i];
          if (isExcludedHostEl(it) || isHiddenAncestor(it, doc.body)) continue;
          const tLow = String(it.textContent || it.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().toLowerCase();
          if (tLow.length > 48) continue;
          if (tLow === "модели" || tLow === "models" || tLow.includes("модели и использован") || tLow.includes("models & usage") || tLow.includes("models and usage")) hasModels = true;
          if (tLow === "общие" || tLow === "основные" || tLow === "general" || tLow === "внешний вид" || tLow === "appearance" || tLow === "браузер" || tLow === "browser") hasGeneral = true;
          if (hasGeneral && hasModels) return true;
        }
      } catch (_e) {}
      return false;
    };
    const trySelectModelsTab = () => {
      try {
        const items = doc.querySelectorAll('[role="dialog"] button, [role="dialog"] [role="tab"], [role="dialog"] a, main button, main [role="tab"], main a, nav button, aside button, [data-rudex-bg-sidebar="1"] button');
        for (let j = 0; items && j < items.length; j += 1) {
          const it = items[j];
          if (isExcludedHostEl(it) || isHiddenAncestor(it, doc.body)) continue;
          const tLow = String(it.textContent || it.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().toLowerCase();
          if (!tLow || tLow.length > 48) continue;
          if (tLow === "модели" || tLow === "models" || tLow.includes("модели и использован") || tLow.includes("models & usage") || tLow.includes("models and usage")) {
            if (typeof it.click === "function") it.click();
            if (win && typeof win.setTimeout === "function") {
              win.setTimeout(() => scrapeDomQuotaSnapshot(true), 320);
            } else {
              scrapeDomQuotaSnapshot(true);
            }
            return true;
          }
        }
      } catch (_e2) {}
      return false;
    };
    const triggerNativeSettingsShortcut = () => {
      try {
        invokeIpc("agy-studio:open-native-settings");
      } catch (_e) {}
      try {
        const KeyEv = (win && win.KeyboardEvent) || (typeof KeyboardEvent !== "undefined" ? KeyboardEvent : null);
        if (KeyEv) {
          const isMac = typeof navigator !== "undefined" && /mac/i.test(String(navigator.platform || ""));
          const ev = new KeyEv("keydown", { key: ",", code: "Comma", keyCode: 188, which: 188, ctrlKey: !isMac, metaKey: isMac, bubbles: true, cancelable: true });
          if (doc && typeof doc.dispatchEvent === "function") doc.dispatchEvent(ev);
          if (win && typeof win.dispatchEvent === "function") win.dispatchEvent(ev);
        }
      } catch (_e) {}
    };
    try {
      if (isNativeSettingsViewOpen()) {
        trySelectModelsTab();
        return;
      }
      const allBtns = doc.querySelectorAll('button, a, [role="button"], [role="menuitem"]');
      let settingsBtn = null;
      let settingsScore = -1;
      for (let i = 0; allBtns && i < allBtns.length; i += 1) {
        const b = allBtns[i];
        if (isExcludedHostEl(b) || isHiddenAncestor(b, doc.body)) continue;
        const tid = String((b.getAttribute && b.getAttribute("data-testid")) || "").trim().toLowerCase();
        const aria = String((b.getAttribute && (b.getAttribute("aria-label") || b.getAttribute("title") || b.getAttribute("data-tooltip"))) || "").replace(/\s+/g, " ").trim().toLowerCase();
        const txt = String(b.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
        const combined = `${tid} ${aria} ${txt}`;
        if (/(?:rudex|studio|voice|голос|агент|agent|browser|браузер|лимит|limit|model|модел|mcp|plugin|плагин|skill|скилл|profile|профил)/.test(combined)) continue;
        const cleanTxt = txt.replace(/\s*(?:\([^)]*\)|\[[^\]]*\]|ctrl\s*\+.*|cmd\s*\+.*|⌘.*)$/i, "").trim();
        const cleanAria = aria.replace(/\s*(?:\([^)]*\)|\[[^\]]*\]|ctrl\s*\+.*|cmd\s*\+.*|⌘.*)$/i, "").trim();
        const matchExact = cleanTxt === "настройки" || cleanTxt === "settings" || cleanAria === "настройки" || cleanAria === "settings" || cleanAria === "open settings" || cleanAria === "открыть настройки";
        const matchTestId = tid === "settings" || tid === "settings-button" || tid === "open-settings" || tid === "sidebar-settings";
        if (!matchExact && !matchTestId) continue;
        let score = matchTestId ? 4 : 2;
        if (typeof b.closest === "function" && b.closest('aside, nav, [data-rudex-bg-sidebar="1"], [data-testid*="sidebar"]')) score += 3;
        if (score >= settingsScore) {
          settingsScore = score;
          settingsBtn = b;
        }
      }
      if (settingsBtn && typeof settingsBtn.click === "function") {
        settingsBtn.click();
      } else {
        triggerNativeSettingsShortcut();
      }
      if (win && typeof win.setTimeout === "function") {
        let selected = false;
        win.setTimeout(() => {
          if (state.destroyed) return;
          if (!isNativeSettingsViewOpen() && settingsBtn) {
            triggerNativeSettingsShortcut();
          } else {
            selected = trySelectModelsTab();
          }
        }, 160);
        win.setTimeout(() => {
          if (!state.destroyed && !selected) selected = trySelectModelsTab();
        }, 360);
        win.setTimeout(() => {
          if (!state.destroyed && !selected) trySelectModelsTab();
        }, 650);
      } else {
        trySelectModelsTab();
      }
    } catch (_e) {}
  }

  const lastKnownComposerSnapByChat = new Map();
  let draftSaveSeq = 0;

  function syncChatDockLiveState() {
    if (!doc || typeof rv5FindNativeComposer !== "function") return;
    const { container, editable } = rv5FindNativeComposer(doc);
    const curTxt = editable && typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
    const hasTxt = curTxt.length > 0;
    const hasExpiredDoneToast = state.lastChatDockHtml.includes("is-done") &&
      !(state.liveEdits || []).some((it) => it && it.status === "delivered" && !state.dismissedLiveEditIds.has(it.id) && Date.now() - (it.deliveredAt || 0) < 4000);
    if (hasTxt !== state.hasComposerText) {
      state.hasComposerText = hasTxt;
      if (state.telemetry.isGenerating || hasExpiredDoneToast) {
        renderChatDockMount();
      } else {
        positionChatDock();
      }
    } else if (hasExpiredDoneToast) {
      renderChatDockMount();
    } else {
      positionChatDock();
      if (state.liveEdits && state.liveEdits.length > 0) syncLiveChatBubbles(false);
    }
    // Observe composer content/attachment changes to persist chat draft reliably (defer during active voice dictation so speech stays silky smooth)
    if (state.hasActivatedChat && state.settings.composerDraftsEnabled !== false && !isRestoringDraft && Date.now() > draftJustSubmittedUntil && editable && !isVoiceDictationActive()) {
      const scope = getComposerAttachmentScope(container);
      let imgCnt = 0;
      if (scope && typeof scope.querySelectorAll === "function") {
        const imgs = scope.querySelectorAll("img");
        for (let i = 0; imgs && i < imgs.length; i += 1) {
          if (isComposerAttachmentImg(imgs[i])) imgCnt += 1;
        }
      }
      const chipCnt = composerOrigFiles.length > 0 ? collectComposerChipFileMatches(scope, editable).length : 0;
      const curKey = state.activeChatKey || "__new__";
      const obsSig = `${curKey}|${curTxt.length}|${curTxt.slice(0, 40)}|${curTxt.slice(-24)}|${imgCnt}|${chipCnt}`;
      if (obsSig !== lastDraftObsSig) {
        const hadPrev = lastDraftObsSig.startsWith(curKey + "|");
        lastDraftObsSig = obsSig;
        if (hasTxt || imgCnt > 0 || chipCnt > 0) {
          if (hasTxt) draftTextCacheByChat.set(curKey, curTxt);
          else draftTextCacheByChat.delete(curKey);
          const snap = imgCnt === 0 && chipCnt === 0
            ? { text: curTxt, items: [], cleared: false }
            : Object.assign(collectComposerSnapshotSync(container, editable), { cleared: false });
          lastKnownComposerSnapByChat.set(curKey, snap);
          if (lastKnownComposerSnapByChat.size > 16) {
            const oldest = lastKnownComposerSnapByChat.keys().next().value;
            lastKnownComposerSnapByChat.delete(oldest);
          }
          scheduleComposerDraftSave(260);
        } else if (hadPrev && state.userEditedComposerInChat) {
          // Only record cleared tombstone & erase disk draft when the user ACTUALLY edited/cleared the composer in this chat
          // (never let an empty composer after cold-boot React hydration wipe a saved disk draft!).
          draftTextCacheByChat.delete(curKey);
          lastKnownComposerSnapByChat.set(curKey, { text: "", items: [], cleared: true });
          scheduleComposerDraftSave(350);
        }
      }
    }
  }

  function openAnnotator(opts) {
    if (annotatorCtrl && typeof annotatorCtrl.open === "function") {
      if (state.agentPopoverOpen || state.contextPopoverOpen) {
        state.agentPopoverOpen = false;
        state.contextPopoverOpen = false;
        renderChatDockMount();
      }
      annotatorCtrl.open(opts);
    }
  }

  function normalizeSpeechText(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[\s\u00A0]+/g, " ")
      .replace(/[.,!?;:…—–\-«»"'()[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isResidualOfSentText(curNow, sentText, userTyped) {
    const nc = normalizeSpeechText(curNow);
    if (!nc) return false;
    const normSent = normalizeSpeechText(sentText);
    if (!normSent) return !userTyped;
    if (nc === normSent || nc.startsWith(normSent) || normSent.startsWith(nc)) return true;
    const probeSent = normSent.slice(0, Math.min(24, normSent.length));
    const probeCur = nc.slice(0, Math.min(24, nc.length));
    if (probeSent.length >= 4 && nc.includes(probeSent)) return true;
    if (probeCur.length >= 4 && normSent.includes(probeCur)) return true;
    const curWords = nc.split(" ").filter(Boolean);
    const sentWords = normSent.split(" ").filter(Boolean);
    if (curWords.length > 0 && sentWords.length > 0) {
      const sentSet = new Set(sentWords);
      let overlap = 0;
      for (let i = 0; i < curWords.length; i += 1) {
        if (sentSet.has(curWords[i])) overlap += 1;
      }
      if (overlap / curWords.length >= 0.6) return true;
      const tailSent = sentWords.slice(-3).join(" ");
      if (tailSent.length >= 4 && (nc.includes(tailSent) || tailSent.includes(nc))) return true;
    }
    return false;
  }

  function stopActiveVoiceDictationIfAny(opts) {
    const abortStream = Boolean(opts && opts.abortStream);
    let stopped = false;
    if (abortStream && rudexOptimizer && typeof rudexOptimizer.abortVoiceOnSend === "function") {
      try {
        rudexOptimizer.abortVoiceOnSend();
        stopped = true;
      } catch (_e) {}
    }
    const activeMic = findActiveVoiceDictationButton();
    if (activeMic && typeof activeMic.click === "function") {
      try {
        activeMic.click();
        stopped = true;
      } catch (_e) {}
    }
    if (stopped && rudexOptimizer && typeof rudexOptimizer.setDictating === "function") {
      try { rudexOptimizer.setDictating(false); } catch (_e) {}
    }
    return stopped;
  }

  function countHostUserMessages() {
    let cnt = 0;
    let lastText = "";
    try {
      const uNodes = doc && typeof doc.querySelectorAll === "function"
        ? doc.querySelectorAll('[data-testid="user-message-content"]')
        : [];
      for (let i = 0; uNodes && i < uNodes.length; i += 1) {
        const u = uNodes[i];
        if (!u || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(u))) continue;
        cnt += 1;
        lastText = String(u.textContent || "");
      }
    } catch (_e) {}
    return { count: cnt, lastText };
  }

  function clearEditableRobust(editable, sentText, opts) {
    const o = opts && typeof opts === "object" ? opts : {};
    const allowRaw = o.allowRaw;
    const forceKeystroke = Boolean(o.forceKeystroke);
    const resetComposition = Boolean(o.resetComposition);
    const isCancelled = typeof o.isCancelled === "function" ? o.isCancelled : () => false;
    if (state.destroyed || !editable || isCancelled()) return;
    const curNow = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
    if (!curNow) return;
    if (allowRaw !== "initial" && !isResidualOfSentText(curNow, sentText, false)) return;

    const isContentEditableLexical = editable.tagName !== "TEXTAREA" && editable.tagName !== "INPUT";
    if (resetComposition && isContentEditableLexical) {
      try {
        if (typeof editable.blur === "function") editable.blur();
        if (typeof editable.focus === "function") editable.focus();
      } catch (_e) {}
    }

    if (typeof rv5ClearEditableText === "function") {
      rv5ClearEditableText(editable, win, { skipRawTextFallback: isContentEditableLexical && allowRaw !== true });
    }
    if (isContentEditableLexical) {
      try { if (typeof editable.focus === "function") editable.focus(); } catch (_e) {}
      const ae = doc && doc.activeElement;
      const focused = Boolean(ae && (ae === editable || (typeof editable.contains === "function" && editable.contains(ae))));
      const stillHasText = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
      if ((stillHasText || allowRaw === "initial") && focused) {
        invokeIpc("agy-studio:clear-focused-input", forceKeystroke ? { forceKeystroke: true } : undefined).then(() => {
          if (state.destroyed || isCancelled()) return;
          const after = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
          if (after && isResidualOfSentText(after, sentText, false) && typeof rv5ClearEditableText === "function") {
            rv5ClearEditableText(editable, win, { skipRawTextFallback: allowRaw !== true });
          }
        });
      }
    }
  }

  async function sendInlineLiveEditFromComposer() {
    if (!doc || typeof rv5FindNativeComposer !== "function" || liveEditSendInFlight) return false;
    liveEditSendInFlight = true;
    try {
      if (pendingComposerReads.size > 0) {
        await Promise.race([
          Promise.all(Array.from(pendingComposerReads)),
          new Promise((r) => (win && typeof win.setTimeout === "function" ? win.setTimeout(r, 1500) : setTimeout(r, 1500))),
        ]);
      }
      const { container, editable } = rv5FindNativeComposer(doc);
      if (!editable || typeof rv5ReadEditableText !== "function") return false;
      const text = rv5ReadEditableText(editable);
      const scope = getComposerAttachmentScope(container);
      const images = [];
      const files = [];
      const removeBtns = [];
      const usedOrigImages = new Set();

      // 1. Collect all attached screenshots/images in full resolution (cache -> data: -> blob fetch -> canvas)
      if (scope && typeof scope.querySelectorAll === "function") {
        const imgs = scope.querySelectorAll("img");
        for (let i = 0; i < imgs.length && images.length < 4; i += 1) {
          const im = imgs[i];
          if (!im || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(im))) continue;
          let dataUrl = findFullResForThumbnail(im, usedOrigImages);
          if (!dataUrl || !dataUrl.startsWith("data:image/")) {
            dataUrl = imageElToDataUrl(im);
          }
          if (!dataUrl || !dataUrl.startsWith("data:image/")) {
            const rawSrc = String((im.getAttribute && im.getAttribute("src")) || im.src || "");
            if (rawSrc) {
              const fetched = await blobOrHttpUrlToDataUrl(rawSrc);
              if (fetched && fetched.startsWith("data:image/")) dataUrl = fetched;
            }
          }
          if (dataUrl && dataUrl.startsWith("data:image/")) {
            images.push({ name: `screenshot-${Date.now()}-${images.length + 1}.png`, dataUrl });
            const wraps = [im.parentElement, im.parentElement && im.parentElement.parentElement, im.parentElement && im.parentElement.parentElement && im.parentElement.parentElement.parentElement];
            for (let w = 0; w < wraps.length; w += 1) {
              const box = wraps[w];
              if (!box || box === container || box === scope || typeof box.querySelectorAll !== "function") continue;
              if (editable && (box === editable || (typeof box.contains === "function" && box.contains(editable)))) continue;
              const btns = box.querySelectorAll("button");
              let foundBtn = false;
              for (let b = 0; b < btns.length; b += 1) {
                const cand = btns[b];
                if (!cand || cand.hasAttribute("data-rudex-img-edit-btn")) continue;
                // Never click a preview/lightbox button that wraps the <img> itself
                if (typeof cand.contains === "function" && cand.contains(im)) continue;
                if (typeof cand.querySelector === "function" && cand.querySelector("img")) continue;
                removeBtns.push(cand);
                foundBtn = true;
                break;
              }
              if (foundBtn) break;
            }
          }
        }
      }

      // 2. Collect all attached non-image files (PDF, code, text, archives, etc.) visible in composer chips
      const matchedFiles = collectComposerChipFileMatches(scope, editable);
      for (let i = 0; i < matchedFiles.length; i += 1) {
        const mf = matchedFiles[i].file;
        files.push({ name: mf.name, mime: mf.mime, dataUrl: mf.dataUrl });
        if (scope && typeof scope.querySelectorAll === "function") {
          const chipEls = scope.querySelectorAll("div, span, li");
          const lowName = mf.name.toLowerCase();
          for (let c = 0; c < chipEls.length; c += 1) {
            const el = chipEls[c];
            if (!el || (editable && (el === editable || (typeof editable.contains === "function" && editable.contains(el))))) continue;
            const t = String(el.textContent || "").toLowerCase();
            if (t.length <= 160 && t.includes(lowName)) {
              const btn = el.querySelector && el.querySelector("button:not([data-rudex-img-edit-btn])");
              if (btn) {
                removeBtns.push(btn);
                break;
              }
            }
          }
        }
      }

      if (!text && images.length === 0 && files.length === 0) return false;
      const sendNowMs = Date.now();
      if (text && text === lastLiveEditSendText && sendNowMs - lastLiveEditSendAt < 2000 && images.length === 0 && files.length === 0) {
        return false;
      }
      const wasVoiceActive = isVoiceDictationActive();
      if (wasVoiceActive) {
        stopActiveVoiceDictationIfAny({ abortStream: true });
      }
      lastLiveEditSendAt = sendNowMs;
      lastLiveEditSendText = text;
      liveEditSentAtMs = sendNowMs;
      draftJustSubmittedUntil = sendNowMs + (wasVoiceActive ? 3200 : 2200);
      if (draftSaveTimer && win && typeof win.clearTimeout === "function") {
        win.clearTimeout(draftSaveTimer);
        draftSaveTimer = null;
      }
      const submitKey = state.activeChatKey || "__new__";
      const submitTitle = state.activeChatTitle || "";
      lastSavedDraftByChat.delete(submitKey);
      lastKnownComposerSnapByChat.delete(submitKey);
      draftDataUrlToFileName.clear();
      draftSaveSeq += 1;
      invokeIpc("agy-studio:clear-composer-draft", { chatKey: submitKey });
      if (state.settings.inputHistoryEnabled !== false) {
        const histAtts = [
          ...images.map((im) => ({ name: im.name, mime: "image/png", isImage: true, dataUrl: im.dataUrl })),
          ...files.map((fl) => ({ name: fl.name, mime: fl.mime || "application/octet-stream", isImage: false, dataUrl: fl.dataUrl })),
        ];
        invokeIpc("agy-studio:record-input-history", {
          chatKey: submitKey,
          title: submitTitle,
          text,
          source: "live-edit",
          attachments: histAtts,
        }).then(() => {
          if (!state.destroyed && state.isOpen && state.activeTab === "history") {
            refreshInputHistory();
          }
        });
      }
      const clearToken = ++liveEditClearToken;
      userTypedAfterLiveEdit = false;
      const isLiveCancelled = () => clearToken !== liveEditClearToken || userTypedAfterLiveEdit || (!wasVoiceActive && isVoiceDictationActive());
      // Pass 0: Clear Lexical cleanly via native selection/delete without desyncing EditorState
      clearEditableRobust(editable, text, { allowRaw: "initial", forceKeystroke: false, resetComposition: wasVoiceActive, isCancelled: isLiveCancelled });
      // Follow-up passes catch speech-to-text / voice-typing converters that flush trailing text up to 2s after Enter/Send
      if (win && typeof win.setTimeout === "function") {
        win.setTimeout(() => clearEditableRobust(editable, text, { allowRaw: false, forceKeystroke: false, isCancelled: isLiveCancelled }), 35);
        win.setTimeout(() => clearEditableRobust(editable, text, { allowRaw: false, forceKeystroke: false, isCancelled: isLiveCancelled }), 120);
        win.setTimeout(() => clearEditableRobust(editable, text, { allowRaw: true, forceKeystroke: false, isCancelled: isLiveCancelled }), 260);
        win.setTimeout(() => clearEditableRobust(editable, text, { allowRaw: true, forceKeystroke: true, resetComposition: wasVoiceActive, isCancelled: isLiveCancelled }), 500);
        win.setTimeout(() => clearEditableRobust(editable, text, { allowRaw: true, forceKeystroke: true, resetComposition: wasVoiceActive, isCancelled: isLiveCancelled }), 900);
        win.setTimeout(() => clearEditableRobust(editable, text, { allowRaw: true, forceKeystroke: true, resetComposition: wasVoiceActive, isCancelled: isLiveCancelled }), 1400);
        if (wasVoiceActive) {
          win.setTimeout(() => clearEditableRobust(editable, text, { allowRaw: true, forceKeystroke: true, resetComposition: true, isCancelled: isLiveCancelled }), 2000);
        }
      }
      const clickedSet = new Set();
      for (let i = 0; i < removeBtns.length; i += 1) {
        const b = removeBtns[i];
        if (!b || clickedSet.has(b)) continue;
        clickedSet.add(b);
        try { if (typeof b.click === "function") b.click(); } catch (_e) {}
      }
      // Remove consumed cached originals so they don't re-attach on next edit
      if (usedOrigImages.size > 0) {
        for (let i = composerOrigImages.length - 1; i >= 0; i -= 1) {
          if (usedOrigImages.has(composerOrigImages[i])) composerOrigImages.splice(i, 1);
        }
      }
      if (matchedFiles.length > 0) {
        const usedSet = new Set(matchedFiles.map((m) => m.file));
        for (let i = composerOrigFiles.length - 1; i >= 0; i -= 1) {
          if (usedSet.has(composerOrigFiles[i])) composerOrigFiles.splice(i, 1);
        }
      }
      state.hasComposerText = false;
      const urgent = Boolean(state.inlineUrgent || (state.settings.liveEditInline && state.settings.liveEditInline.urgentIntercept));
      let anchorRespIdx = -1;
      let anchorUserCount = 0;
      let anchorUserText = "";
      try {
        const rNodes = doc.querySelectorAll('[data-testid="agent-response"]');
        let rCnt = 0;
        for (let i = 0; rNodes && i < rNodes.length; i += 1) {
          if (rNodes[i] && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(rNodes[i]))) rCnt += 1;
        }
        anchorRespIdx = rCnt > 0 ? rCnt - 1 : -1;
        const uNodes = doc.querySelectorAll('[data-testid="user-message-content"]');
        let uCnt = 0;
        let lastUserNode = null;
        for (let i = 0; uNodes && i < uNodes.length; i += 1) {
          if (uNodes[i] && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(uNodes[i]))) {
            uCnt += 1;
            lastUserNode = uNodes[i];
          }
        }
        anchorUserCount = uCnt;
        if (lastUserNode) {
          anchorUserText = String(lastUserNode.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140);
        }
      } catch (_e) {}
      const previewImgs = images.map((im) => ({ name: im.name, previewDataUrl: im.dataUrl }));
      const previewFiles = files.map((fl) => ({ name: fl.name, mime: fl.mime }));
      const tempId = "pending-" + Date.now();
      state.liveEdits = (state.liveEdits || []).concat([{
        id: tempId,
        chatKey: state.activeChatKey || "__new__",
        text,
        images: previewImgs,
        files: previewFiles,
        status: "pending",
        anchorRespIdx,
        anchorUserCount,
        anchorUserText,
        createdAt: Date.now(),
      }]).slice(-20);
      renderChatDockMount();
      syncLiveChatBubbles(true);
      invokeIpc("agy-studio:send-live-edit", {
        chatKey: state.activeChatKey || "__new__",
        title: state.activeChatTitle || "",
        text,
        images,
        files,
        urgent,
        anchorRespIdx,
        anchorUserCount,
        anchorUserText,
        fallbackAny: !UUID_RE.test(String(state.activeChatKey || "")),
      }).then((res) => {
        if (!state.destroyed && res && res.ok) {
          if (res.entry && res.entry.id && (previewImgs.length > 0 || previewFiles.length > 0)) {
            liveEditLocalPreviews.set(res.entry.id, { images: previewImgs, files: previewFiles });
            if (liveEditLocalPreviews.size > 24) {
              const oldestKey = liveEditLocalPreviews.keys().next().value;
              liveEditLocalPreviews.delete(oldestKey);
            }
          }
          applyLiveEditsPayload(res);
          renderChatDockMount();
        }
      });
      return true;
    } finally {
      liveEditSendInFlight = false;
    }
  }

  // === COMPOSER DRAFTS (PER-CHAT AUTO-SAVE & RESTORE) + INPUT HISTORY (LAST 20) ===
  function draftSigForDataUrl(dataUrl) {
    const s = String(dataUrl || "");
    if (!s) return "";
    return `${s.length}:${s.slice(0, 64)}:${s.slice(-64)}`;
  }

  function draftDataUrlToBlob(dataUrl, fallbackMime) {
    try {
      const s = String(dataUrl || "");
      const idx = s.indexOf(",");
      if (idx <= 0) return null;
      const header = s.slice(0, idx);
      const mimeMatch = /^data:([^;,]+)/i.exec(header);
      const mime = mimeMatch ? mimeMatch[1] : (fallbackMime || "application/octet-stream");
      const bin = atob(s.slice(idx + 1));
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
      const BlobCtor = (win && win.Blob) || (typeof Blob !== "undefined" ? Blob : null);
      return BlobCtor ? new BlobCtor([arr], { type: mime }) : null;
    } catch (_e) {
      return null;
    }
  }

  function buildMainWorldComposerTextInjectScript(rawText) {
    const safeText = JSON.stringify(String(rawText || ""));
    return `(async () => {
      try {
        const text = ${safeText};
        if (!text) return { ok: false, reason: "empty" };
        const isSkipped = (el) => !el || Boolean(el.closest('#rudex-studio-host, [data-testid="user-message-content"], [data-testid="agent-response"], .monaco-editor, [role="dialog"], [role="alertdialog"]')) || /\\b(?:inputarea|ime-text-area)\\b/.test(String(el.className || ""));
        const isVis = (el) => { const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null; return Boolean(r && r.width > 0 && r.height > 0); };
        const findEd = () => {
          const tagged = document.querySelectorAll('[data-rudex-theme-composer="1"] textarea, [data-rudex-theme-composer="1"] [contenteditable="true"], [data-rudex-theme-composer="1"] [role="textbox"]');
          for (let i = tagged.length - 1; i >= 0; i -= 1) if (!isSkipped(tagged[i]) && isVis(tagged[i])) return tagged[i];
          const all = document.querySelectorAll('main textarea, main [contenteditable="true"], form textarea, form [contenteditable="true"], [contenteditable="true"], textarea');
          for (let i = all.length - 1; i >= 0; i -= 1) if (!isSkipped(all[i]) && isVis(all[i])) return all[i];
          return null;
        };
        const ed = findEd();
        if (!ed) return { ok: false, reason: "no-editable" };
        const readTxt = () => (ed.tagName === "TEXTAREA" || ed.tagName === "INPUT" ? String(ed.value || "") : String(ed.innerText || ed.textContent || "")).replace(/[\\u200B-\\u200D\\uFEFF]/g, "").trim();
        if (readTxt().length > 0) return { ok: true, already: true };
        if (ed.tagName === "TEXTAREA" || ed.tagName === "INPUT") {
          const proto = ed.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
          const desc = Object.getOwnPropertyDescriptor(proto, "value");
          if (desc && desc.set) desc.set.call(ed, text);
          else ed.value = text;
          ed.dispatchEvent(new Event("input", { bubbles: true }));
          return { ok: readTxt().length > 0 };
        }
        const waitCommitted = async (maxMs) => {
          if (readTxt().length > 0) return true;
          const endAt = Date.now() + maxMs;
          while (Date.now() < endAt) {
            await new Promise((r) => setTimeout(r, 5));
            if (readTxt().length > 0) return true;
          }
          return readTxt().length > 0;
        };
        const placeCaret = () => {
          try {
            if (ed.__lexicalEditor && typeof ed.__lexicalEditor.focus === "function") {
              ed.__lexicalEditor.focus();
            }
          } catch (_e) {}
          try { ed.focus(); } catch (_e) {}
          try {
            const sel = window.getSelection();
            if (sel) {
              const rng = document.createRange();
              const inner = ed.querySelector("p, div") || ed;
              rng.selectNodeContents(inner);
              rng.collapse(false);
              sel.removeAllRanges();
              sel.addRange(rng);
              document.dispatchEvent(new Event("selectionchange"));
            }
          } catch (_e) {}
        };
        placeCaret();
        // 0. Instant 0ms synchronous Blink execCommand("insertText") for single-line drafts (Lexical handles trusted beforeinput synchronously!)
        if (!text.includes("\\n")) {
          try {
            document.execCommand("insertText", false, text);
            if (readTxt().length > 0) return { ok: true, method: "mw-exec-sync" };
          } catch (_e) {}
        }
        // 1. Real Main-World ClipboardEvent("paste") with genuine Main-World DataTransfer (preserves multi-line breaks natively!)
        try {
          const dt = new DataTransfer();
          dt.setData("text/plain", text);
          ed.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
          if (await waitCommitted(22)) return { ok: true, method: "mw-paste" };
        } catch (_e) {}
        // 2. Real Main-World execCommand("insertText") (for multi-line or deferred caret)
        try {
          placeCaret();
          document.execCommand("insertText", false, text);
          if (await waitCommitted(16)) return { ok: true, method: "mw-exec" };
        } catch (_e) {}
        // 3. Real Main-World InputEvent("beforeinput")
        try {
          placeCaret();
          ed.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: text, bubbles: true, cancelable: true }));
          if (await waitCommitted(18)) return { ok: true, method: "mw-beforeinput" };
        } catch (_e) {}
        return { ok: false, reason: "not-committed" };
      } catch (_err) {
        return { ok: false, reason: "err" };
      }
    })()`;
  }

  function buildMainWorldComposerAttachInjectScript(attachments) {
    const safeList = JSON.stringify((Array.isArray(attachments) ? attachments : []).slice(0, 6).map((a) => ({
      name: String(a.name || "attachment.bin"),
      mime: String(a.mime || "application/octet-stream"),
      isImage: Boolean(a.isImage),
      dataUrl: String(a.dataUrl || ""),
    })).filter((a) => a.dataUrl.startsWith("data:")));
    return `(async () => {
      try {
        const list = ${safeList};
        if (!list.length) return { ok: false, count: 0 };
        const isSkipped = (el) => !el || Boolean(el.closest('#rudex-studio-host, [data-testid="user-message-content"], [data-testid="agent-response"], .monaco-editor, [role="dialog"], [role="alertdialog"]')) || /\\b(?:inputarea|ime-text-area)\\b/.test(String(el.className || ""));
        const isVis = (el) => { const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null; return Boolean(r && r.width > 0 && r.height > 0); };
        const findEd = () => {
          const tagged = document.querySelectorAll('[data-rudex-theme-composer="1"] textarea, [data-rudex-theme-composer="1"] [contenteditable="true"], [data-rudex-theme-composer="1"] [role="textbox"]');
          for (let i = tagged.length - 1; i >= 0; i -= 1) if (!isSkipped(tagged[i]) && isVis(tagged[i])) return tagged[i];
          const all = document.querySelectorAll('main textarea, main [contenteditable="true"], form textarea, form [contenteditable="true"], [contenteditable="true"], textarea');
          for (let i = all.length - 1; i >= 0; i -= 1) if (!isSkipped(all[i]) && isVis(all[i])) return all[i];
          return null;
        };
        const ed = findEd();
        if (!ed) return { ok: false, count: 0 };
        const cont = ed.closest('[data-rudex-theme-composer="1"], form, [data-testid="composer"], .composer-container') || ed.parentElement || ed;
        let scope = cont;
        let p = cont.parentElement;
        for (let h = 0; h < 5 && p && p !== document.body && p.tagName !== "MAIN"; h += 1) {
          if (p.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"]')) break;
          scope = p;
          p = p.parentElement;
        }
        const countImgs = () => {
          let n = 0;
          const imgs = scope.querySelectorAll("img");
          for (let i = 0; i < imgs.length; i += 1) {
            const im = imgs[i];
            if (!im || im.closest("#rudex-studio-host")) continue;
            const rawSrc = String(im.getAttribute("src") || im.src || "").trim().toLowerCase();
            if (rawSrc.startsWith("data:image/svg+xml") || /\\.svg(?:\\?|#|$)/.test(rawSrc)) continue;
            const alt = String(im.getAttribute("alt") || "").toLowerCase();
            if (/\\b(?:avatar|profile|logo)\\b/.test(alt)) continue;
            const nw = im.naturalWidth || im.width || 0;
            const nh = im.naturalHeight || im.height || 0;
            if (nw > 0 && nh > 0 && nw <= 24 && nh <= 24) continue;
            n += 1;
          }
          return n;
        };
        const readScopeMeta = () => {
          const parts = [String(scope.textContent || "")];
          const metas = scope.querySelectorAll("[title], [aria-label], [alt]");
          for (let m = 0; m < metas.length && m < 80; m += 1) {
            const el = metas[m];
            if (!el || el.closest("#rudex-studio-host")) continue;
            const t = el.getAttribute("title");
            const a = el.getAttribute("aria-label");
            const alt = el.getAttribute("alt");
            if (t) parts.push(t);
            if (a) parts.push(a);
            if (alt) parts.push(alt);
          }
          return parts.join(" ").toLowerCase();
        };
        const toFile = (a, idx) => {
          const comma = a.dataUrl.indexOf(",");
          if (comma <= 0) return null;
          const bin = atob(a.dataUrl.slice(comma + 1));
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
          const mime = a.mime || "application/octet-stream";
          return new File([new Blob([arr], { type: mime })], a.name || ("file-" + (idx + 1)), { type: mime });
        };
        const waitAdded = async (fn, maxMs) => {
          if (fn()) return true;
          const endAt = Date.now() + maxMs;
          while (Date.now() < endAt) {
            await new Promise((r) => setTimeout(r, 16));
            if (fn()) return true;
          }
          return fn();
        };
        try { ed.focus(); } catch (_e) {}
        let attached = 0;
        for (let i = 0; i < list.length; i += 1) {
          const item = list[i];
          const file = toFile(item, i);
          if (!file) continue;
          const imgsBefore = countImgs();
          const txtBefore = String(scope.textContent || "").length;
          const btnsBefore = scope.querySelectorAll("button").length;
          const checkAdded = () => {
            if (item.isImage || file.type.startsWith("image/")) {
              if (countImgs() > imgsBefore) return true;
            }
            const lowNow = readScopeMeta();
            const fLow = file.name.toLowerCase();
            const stem = fLow.replace(/\\.[^.]+$/, "").slice(0, 8);
            if (lowNow.includes(fLow) || (stem.length >= 3 && lowNow.includes(stem))) return true;
            return scope.querySelectorAll("button").length > btnsBefore || String(scope.textContent || "").length > txtBefore + 3;
          };
          // 1. Genuine Main-World ClipboardEvent("paste")
          try {
            const dt = new DataTransfer();
            dt.items.add(file);
            ed.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
            if (await waitAdded(checkAdded, 120)) { attached += 1; continue; }
          } catch (_e) {}
          // 2. Genuine Main-World dragenter + dragover + drop on composer container & scope
          const dropTargets = scope && scope !== cont ? [cont, scope] : [cont];
          let dropOk = false;
          for (let dti = 0; dti < dropTargets.length; dti += 1) {
            try {
              const dt2 = new DataTransfer();
              dt2.items.add(file);
              const tgt = dropTargets[dti];
              tgt.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: dt2 }));
              tgt.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt2 }));
              tgt.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt2 }));
              if (await waitAdded(checkAdded, 120)) { attached += 1; dropOk = true; break; }
            } catch (_e) {}
          }
          if (dropOk) continue;
          // 3. Fallback: live <input type="file"> inside composer scope or main
          try {
            const fileInputs = Array.from(scope.querySelectorAll('input[type="file"]')).concat(Array.from(document.querySelectorAll('main input[type="file"]')));
            const fileInp = fileInputs.find((el) => el && !el.closest("#rudex-studio-host"));
            if (fileInp) {
              const dt3 = new DataTransfer();
              dt3.items.add(file);
              const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files");
              if (desc && desc.set) desc.set.call(fileInp, dt3.files);
              else fileInp.files = dt3.files;
              fileInp.dispatchEvent(new Event("input", { bubbles: true }));
              fileInp.dispatchEvent(new Event("change", { bubbles: true }));
              if (await waitAdded(checkAdded, 110)) { attached += 1; continue; }
            }
          } catch (_e) {}
        }
        return { ok: attached > 0, count: attached };
      } catch (_err) {
        return { ok: false, count: 0 };
      }
    })()`;
  }

  async function insertTextIntoNativeComposerRich(editable, rawText) {
    const text = String(rawText || "");
    if (!editable || !text) return false;
    const readCur = () => (typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "");
    const waitCommit = (ms) => new Promise((resolve) => {
      if (win && typeof win.setTimeout === "function") win.setTimeout(resolve, ms);
      else resolve();
    });
    // Never append onto already-present text (prevents duplicated drafts!)
    if (readCur().trim().length > 0) return true;
    // 0. Main-World injection (crucial in Electron contextIsolation: true so Lexical receives genuine Main-World Selection + DataTransfer!)
    let ranMainWorld = false;
    if (webFrame && typeof webFrame.executeJavaScript === "function") {
      try {
        ranMainWorld = true;
        const mwRes = await webFrame.executeJavaScript(buildMainWorldComposerTextInjectScript(text), true);
        if (mwRes && mwRes.ok && readCur().trim().length > 0) return true;
      } catch (_e) {}
    }
    try { if (typeof editable.focus === "function") editable.focus(); } catch (_e) {}
    // Ensure a collapsed caret selection exists inside Lexical's inner paragraph before dispatching paste/beforeinput
    try {
      const sel = win && typeof win.getSelection === "function" ? win.getSelection() : null;
      if (sel && doc && typeof doc.createRange === "function") {
        const rng = doc.createRange();
        const inner = typeof editable.querySelector === "function" ? (editable.querySelector("p, div") || editable) : editable;
        rng.selectNodeContents(inner);
        rng.collapse(false);
        sel.removeAllRanges();
        sel.addRange(rng);
      }
    } catch (_e) {}
    const tag = String(editable.tagName || "").toUpperCase();
    if (tag === "TEXTAREA" || tag === "INPUT") {
      try {
        const proto = tag === "INPUT"
          ? (win && win.HTMLInputElement && win.HTMLInputElement.prototype)
          : (win && win.HTMLTextAreaElement && win.HTMLTextAreaElement.prototype);
        const desc = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
        if (desc && typeof desc.set === "function") desc.set.call(editable, text);
        else editable.value = text;
        const Evt = (win && typeof win.Event === "function" ? win.Event : (typeof Event === "function" ? Event : null));
        if (Evt) editable.dispatchEvent(new Evt("input", { bubbles: true }));
        return true;
      } catch (_e) {}
    }
    // 1-2. Isolated-World paste / beforeinput fallback ONLY when Main-World webFrame was unavailable (avoids 130ms duplicate sleep in Electron!)
    if (!ranMainWorld) {
      try {
        const DtCtor = (win && win.DataTransfer) || (typeof DataTransfer !== "undefined" ? DataTransfer : null);
        const PasteEvt = (win && win.ClipboardEvent) || (typeof ClipboardEvent !== "undefined" ? ClipboardEvent : null);
        if (DtCtor && PasteEvt) {
          const dt = new DtCtor();
          dt.setData("text/plain", text);
          editable.dispatchEvent(new PasteEvt("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
          if (readCur().trim().length > 0) return true;
          await waitCommit(65);
          if (readCur().trim().length > 0) return true;
        }
      } catch (_e) {}
      try {
        if (readCur().trim().length > 0) return true;
        const InpEvt = (win && win.InputEvent) || (typeof InputEvent !== "undefined" ? InputEvent : null);
        if (InpEvt) {
          editable.dispatchEvent(new InpEvt("beforeinput", { inputType: "insertText", data: text, bubbles: true, cancelable: true }));
          if (readCur().trim().length > 0) return true;
          await waitCommit(65);
          if (readCur().trim().length > 0) return true;
        }
      } catch (_e) {}
    }
    // 3. Native Chromium webContents.insertText via Electron main process (~2ms, works even without synthetic event support!)
    try {
      if (readCur().trim().length > 0) return true;
      if (typeof editable.focus === "function") editable.focus();
      const res = await invokeIpc("agy-studio:insert-text-into-focused", { text });
      if (res && res.ok) {
        if (readCur().trim().length > 0) return true;
        const endWait = Date.now() + 36;
        while (Date.now() < endWait) {
          await waitCommit(10);
          if (readCur().trim().length > 0) return true;
        }
      }
    } catch (_e) {}
    // 4. Fallback execCommand / textContent
    try {
      if (readCur().trim().length > 0) return true;
      if (doc && typeof doc.execCommand === "function" && doc.execCommand("insertText", false, text)) {
        if (readCur().trim().length > 0) return true;
        await waitCommit(45);
        if (readCur().trim().length > 0) return true;
      }
    } catch (_e) {}
    try {
      if (readCur().trim().length > 0) return true;
      editable.textContent = text;
      const Evt = (win && typeof win.Event === "function" ? win.Event : (typeof Event === "function" ? Event : null));
      if (Evt) editable.dispatchEvent(new Evt("input", { bubbles: true }));
      return true;
    } catch (_e) {}
    return false;
  }

  async function insertAttachmentsIntoNativeComposer(attachments, container, editable) {
    const list = Array.isArray(attachments) ? attachments : [];
    if (!list.length || !editable) return 0;
    const DtCtor = (win && win.DataTransfer) || (typeof DataTransfer !== "undefined" ? DataTransfer : null);
    const FileCtor = (win && win.File) || (typeof File !== "undefined" ? File : null);
    const PasteEvt = (win && win.ClipboardEvent) || (typeof ClipboardEvent !== "undefined" ? ClipboardEvent : null);
    const DragEvt = (win && win.DragEvent) || (typeof DragEvent !== "undefined" ? DragEvent : null);

    // Pre-register all restored attachments in Full HD & file caches regardless of injection world
    const validAtts = [];
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      if (!a || !a.dataUrl) continue;
      const mime = a.mime || "application/octet-stream";
      const fname = a.name || (a.isImage ? `screenshot-${i + 1}.png` : `file-${i + 1}.bin`);
      const sig = draftSigForDataUrl(a.dataUrl);
      if (a.fileName && sig) draftDataUrlToFileName.set(sig, a.fileName);
      if (a.isImage || mime.startsWith("image/")) {
        cacheOriginalImageDataUrl(a.dataUrl, fname, mime);
      } else {
        const exists = composerOrigFiles.some((x) => x && x.name === fname && x.dataUrl === a.dataUrl);
        if (!exists) {
          composerOrigFiles.push({ name: fname, mime, size: Number(a.sizeBytes) || 0, dataUrl: a.dataUrl, ts: Date.now() });
          if (composerOrigFiles.length > 10) composerOrigFiles.shift();
        }
      }
      validAtts.push({ name: fname, mime, isImage: Boolean(a.isImage || mime.startsWith("image/")), dataUrl: a.dataUrl, fileName: a.fileName || "" });
    }
    if (validAtts.length === 0) return 0;

    // 0. Main-World attachment injection (genuine Main-World File + DataTransfer across contextIsolation!)
    if (webFrame && typeof webFrame.executeJavaScript === "function") {
      try {
        const mwRes = await webFrame.executeJavaScript(buildMainWorldComposerAttachInjectScript(validAtts), true);
        if (mwRes && mwRes.count > 0) return mwRes.count;
      } catch (_e) {}
    }

    if (!DtCtor || !FileCtor) return 0;
    let attached = 0;
    const filesToAttach = [];
    for (let i = 0; i < validAtts.length; i += 1) {
      const a = validAtts[i];
      const blob = draftDataUrlToBlob(a.dataUrl, a.mime);
      if (!blob) continue;
      const mime = a.mime || blob.type || "application/octet-stream";
      const fname = a.name;
      const file = new FileCtor([blob], fname, { type: mime });
      filesToAttach.push({ file, att: a, mime, fname });
    }
    if (filesToAttach.length === 0) return 0;
    try { if (typeof editable.focus === "function") editable.focus(); } catch (_e) {}
    for (let i = 0; i < filesToAttach.length; i += 1) {
      const item = filesToAttach[i];
      try {
        const dt = new DtCtor();
        dt.items.add(item.file);
        if (item.att.isImage || item.mime.startsWith("image/")) {
          if (PasteEvt) {
            editable.dispatchEvent(new PasteEvt("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
            attached += 1;
          }
        } else {
          const scopeBefore = getComposerAttachmentScope(container);
          const beforeTextLen = scopeBefore ? String(scopeBefore.textContent || "").length : 0;
          const beforeBtnCnt = scopeBefore && typeof scopeBefore.querySelectorAll === "function" ? scopeBefore.querySelectorAll("button").length : 0;
          let sent = false;
          if (PasteEvt) {
            editable.dispatchEvent(new PasteEvt("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
            sent = true;
          }
          // Also try drop on composer container ONLY if paste did not visibly add any attachment chip
          if (DragEvt && container && win && typeof win.setTimeout === "function") {
            const targetBox = container;
            const fileObj = item.file;
            const fnameLow = item.fname.toLowerCase();
            const baseStem = fnameLow.replace(/\.[^.]+$/, "").slice(0, 12);
            win.setTimeout(() => {
              if (state.destroyed) return;
              const scopeNow = getComposerAttachmentScope(targetBox);
              const txtNow = scopeNow ? String(scopeNow.textContent || "").toLowerCase() : "";
              const btnCntNow = scopeNow && typeof scopeNow.querySelectorAll === "function" ? scopeNow.querySelectorAll("button").length : 0;
              const looksAttached = txtNow.includes(fnameLow) || (baseStem.length >= 4 && txtNow.includes(baseStem)) || btnCntNow > beforeBtnCnt || txtNow.length > beforeTextLen + 4;
              if (!looksAttached) {
                try {
                  const dt2 = new DtCtor();
                  dt2.items.add(fileObj);
                  targetBox.dispatchEvent(new DragEvt("drop", { bubbles: true, cancelable: true, dataTransfer: dt2 }));
                } catch (_e) {}
              }
            }, 90);
          }
          if (sent) attached += 1;
        }
      } catch (_e) {}
    }
    return attached;
  }

  function collectComposerSnapshotSync(container, editable) {
    const text = editable && typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
    const scope = getComposerAttachmentScope(container);
    const items = [];
    const usedOrig = new Set();
    if (scope && typeof scope.querySelectorAll === "function") {
      const imgs = scope.querySelectorAll("img");
      for (let i = 0; imgs && i < imgs.length && items.length < 6; i += 1) {
        const im = imgs[i];
        if (!isComposerAttachmentImg(im)) continue;
        let dataUrl = findFullResForThumbnail(im, usedOrig);
        if (!dataUrl || !dataUrl.startsWith("data:image/")) dataUrl = imageElToDataUrl(im);
        const rawSrc = (!dataUrl || !dataUrl.startsWith("data:image/")) ? String((im.getAttribute && im.getAttribute("src")) || im.src || "") : "";
        const sig = dataUrl ? draftSigForDataUrl(dataUrl) : "";
        const cachedFileName = sig ? (draftDataUrlToFileName.get(sig) || "") : "";
        items.push({
          name: `screenshot-${items.length + 1}.png`,
          mime: "image/png",
          isImage: true,
          dataUrl: dataUrl && dataUrl.startsWith("data:image/") ? dataUrl : "",
          rawSrc,
          sig,
          fileName: cachedFileName,
        });
      }
    }
    const matchedFiles = collectComposerChipFileMatches(scope, editable, usedOrig);
    for (let i = 0; i < matchedFiles.length && items.length < 8; i += 1) {
      const mf = matchedFiles[i].file;
      const isImgChip = Boolean(matchedFiles[i].isImage);
      const sig = draftSigForDataUrl(mf.dataUrl);
      const cachedFileName = sig ? (draftDataUrlToFileName.get(sig) || "") : "";
      items.push({
        name: mf.name,
        mime: mf.mime || (isImgChip ? "image/png" : "application/octet-stream"),
        isImage: isImgChip,
        dataUrl: mf.dataUrl,
        rawSrc: "",
        sig,
        fileName: cachedFileName,
      });
    }
    return { text, items };
  }

  async function resolveSnapshotAttachments(items, reuseFileNames) {
    const out = [];
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      if (!it) continue;
      let dataUrl = it.dataUrl || "";
      if (!dataUrl && it.rawSrc) {
        const fetched = await blobOrHttpUrlToDataUrl(it.rawSrc);
        if (fetched && fetched.startsWith("data:")) dataUrl = fetched;
      }
      const sig = dataUrl ? draftSigForDataUrl(dataUrl) : (it.sig || "");
      const fileName = reuseFileNames && (it.fileName || (sig ? draftDataUrlToFileName.get(sig) : ""));
      if (fileName) {
        out.push({ name: it.name, mime: it.mime, isImage: it.isImage, fileName, _sig: sig });
      } else if (dataUrl && dataUrl.startsWith("data:")) {
        out.push({ name: it.name, mime: it.mime, isImage: it.isImage, dataUrl, _sig: sig });
      }
    }
    return out;
  }

  async function saveComposerDraftNow(explicitKey, explicitTitle) {
    if (state.destroyed || isRestoringDraft || state.settings.composerDraftsEnabled === false) return;
    if (Date.now() < draftJustSubmittedUntil) return;
    if (!doc || typeof rv5FindNativeComposer !== "function") return;
    const key = explicitKey || state.activeChatKey || "__new__";
    const saveSeq = ++draftSaveSeq;
    if (pendingComposerReads.size > 0) {
      await Promise.race([
        Promise.all(Array.from(pendingComposerReads)),
        new Promise((r) => (win && typeof win.setTimeout === "function" ? win.setTimeout(r, 1200) : setTimeout(r, 1200))),
      ]);
    }
    if (state.destroyed || isRestoringDraft || saveSeq !== draftSaveSeq || Date.now() < draftJustSubmittedUntil) return;
    if (!explicitKey && (state.activeChatKey || "__new__") !== key) return;
    const { container, editable } = rv5FindNativeComposer(doc);
    if (!editable) return;
    const title = typeof explicitTitle === "string" ? explicitTitle : (state.activeChatTitle || "");
    const snap = collectComposerSnapshotSync(container, editable);
    const resolvedAtts = await resolveSnapshotAttachments(snap.items, true);
    if (state.destroyed || isRestoringDraft || saveSeq !== draftSaveSeq || Date.now() < draftJustSubmittedUntil) return;
    if (!explicitKey && (state.activeChatKey || "__new__") !== key) return;
    const payloadAtts = resolvedAtts.map((a) => ({
      name: a.name,
      mime: a.mime,
      isImage: a.isImage,
      fileName: a.fileName || undefined,
      dataUrl: a.fileName ? undefined : a.dataUrl,
    }));
    const res = await invokeIpc("agy-studio:save-composer-draft", {
      chatKey: key,
      title,
      text: snap.text,
      attachments: payloadAtts,
    });
    if (!state.destroyed && saveSeq === draftSaveSeq && res && res.ok) {
      lastDraftDiskSaveAt = Date.now();
      if (res.draft && Array.isArray(res.draft.attachments)) {
        for (let i = 0; i < res.draft.attachments.length && i < resolvedAtts.length; i += 1) {
          const saved = res.draft.attachments[i];
          const src = resolvedAtts[i];
          if (saved && saved.fileName && src && src._sig) {
            draftDataUrlToFileName.set(src._sig, saved.fileName);
          }
        }
        lastSavedDraftByChat.set(key, res.draft);
        if (String(snap.text || "").trim()) draftTextCacheByChat.set(key, snap.text);
        else draftTextCacheByChat.delete(key);
        lastKnownComposerSnapByChat.set(key, {
          text: snap.text,
          items: res.draft.attachments.map((a, idx) => ({
            name: a.name || (resolvedAtts[idx] && resolvedAtts[idx].name) || `file-${idx + 1}`,
            mime: a.mime || (resolvedAtts[idx] && resolvedAtts[idx].mime) || "application/octet-stream",
            isImage: Boolean(a.isImage),
            fileName: a.fileName || "",
            dataUrl: (resolvedAtts[idx] && resolvedAtts[idx].dataUrl) || "",
          })),
          cleared: false,
        });
      } else {
        lastSavedDraftByChat.delete(key);
        draftTextCacheByChat.delete(key);
      }
    }
  }

  function flushComposerDraftSync(explicitKey, explicitTitle, isChatSwitch) {
    if (state.destroyed || isRestoringDraft || state.settings.composerDraftsEnabled === false) return;
    if (Date.now() < draftJustSubmittedUntil) return;
    if (!doc || typeof rv5FindNativeComposer !== "function" || !ipc || typeof ipc.send !== "function") return;
    const key = explicitKey || state.activeChatKey || "__new__";
    const title = typeof explicitTitle === "string" ? explicitTitle : (state.activeChatTitle || "");
    let snap = null;
    if (isChatSwitch) {
      // On chat switch, the live DOM composer may ALREADY belong to the incoming chat!
      // NEVER read live DOM into prevKey (prevents cross-chat text leak!) — ONLY flush prevKey's cached snapshot.
      const cached = lastKnownComposerSnapByChat.get(key);
      if (!cached) return;
      if (cached.cleared || (!String(cached.text || "").trim() && (!cached.items || cached.items.length === 0))) {
        lastSavedDraftByChat.delete(key);
        lastKnownComposerSnapByChat.delete(key);
        draftTextCacheByChat.delete(key);
        try {
          ipc.send("agy-studio:save-composer-draft-sync", { chatKey: key, title, text: "", attachments: [] });
        } catch (_e) {}
        return;
      }
      snap = cached;
    } else {
      const { container, editable } = rv5FindNativeComposer(doc);
      snap = editable ? collectComposerSnapshotSync(container, editable) : { text: "", items: [] };
      const isSnapEmpty = !String(snap.text || "").trim() && (!snap.items || snap.items.length === 0);
      if (isSnapEmpty) {
        const cached = lastKnownComposerSnapByChat.get(key);
        if (cached && !cached.cleared && (String(cached.text || "").trim() || (cached.items && cached.items.length > 0))) {
          snap = cached;
        } else if (!cached || !cached.cleared) {
          // NEVER overwrite an existing disk draft with "" during Electron shutdown/unmount/blur when user did not clear it!
          return;
        }
      }
    }
    const atts = [];
    for (let i = 0; i < snap.items.length; i += 1) {
      const it = snap.items[i];
      if (it.fileName) {
        atts.push({ name: it.name, mime: it.mime, isImage: it.isImage, fileName: it.fileName });
      } else if (it.dataUrl) {
        atts.push({ name: it.name, mime: it.mime, isImage: it.isImage, dataUrl: it.dataUrl });
      }
    }
    try {
      if (typeof ipc.sendSync === "function" && !isChatSwitch) {
        ipc.sendSync("agy-studio:save-composer-draft-sync", { chatKey: key, title, text: snap.text, attachments: atts });
      } else {
        ipc.send("agy-studio:save-composer-draft-sync", { chatKey: key, title, text: snap.text, attachments: atts });
      }
    } catch (_e) {}
  }

  function scheduleComposerDraftSave(delayMs, withAttachmentFollowup) {
    if (state.destroyed || isRestoringDraft || state.settings.composerDraftsEnabled === false) return;
    if (Date.now() < draftJustSubmittedUntil) return;
    if (!win || typeof win.setTimeout !== "function") {
      saveComposerDraftNow();
      return;
    }
    const now = Date.now();
    // During continuous typing without pauses, guarantee a disk save at least every 1100ms so force-kill (taskkill /F) never loses typed text!
    if (lastDraftDiskSaveAt > 0 && now - lastDraftDiskSaveAt >= 1100 && !withAttachmentFollowup) {
      lastDraftDiskSaveAt = now;
      if (draftSaveTimer && typeof win.clearTimeout === "function") {
        win.clearTimeout(draftSaveTimer);
        draftSaveTimer = null;
      }
      saveComposerDraftNow();
      return;
    }
    if (draftSaveTimer && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftSaveTimer);
    }
    draftSaveTimer = win.setTimeout(() => {
      draftSaveTimer = null;
      saveComposerDraftNow();
    }, typeof delayMs === "number" ? delayMs : 180);
    // Attachment chips/thumbnails can take 300-700ms for React to mount after paste/drop/upload — schedule a clean follow-up capture!
    if (withAttachmentFollowup) {
      if (draftFollowupTimer && typeof win.clearTimeout === "function") win.clearTimeout(draftFollowupTimer);
      draftFollowupTimer = win.setTimeout(() => {
        draftFollowupTimer = null;
        if (!state.destroyed && !isRestoringDraft && Date.now() > draftJustSubmittedUntil) {
          saveComposerDraftNow();
        }
      }, 780);
    }
  }

  function clearDraftRestoreVerifyTimers() {
    if (win && typeof win.clearTimeout === "function") {
      if (draftEarlyTextTimer) {
        win.clearTimeout(draftEarlyTextTimer);
        draftEarlyTextTimer = null;
      }
      for (let i = 0; i < draftRestoreVerifyTimers.length; i += 1) {
        win.clearTimeout(draftRestoreVerifyTimers[i]);
      }
    }
    draftRestoreVerifyTimers = [];
    if (draftStickinessObserver && typeof draftStickinessObserver.disconnect === "function") {
      try { draftStickinessObserver.disconnect(); } catch (_e) {}
    }
    draftStickinessObserver = null;
  }

  function restoreComposerDraftForChat(chatKey) {
    if (state.destroyed || state.settings.composerDraftsEnabled === false || !chatKey) return;
    const seq = ++draftRestoreSeq;
    if (draftRestoreTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftRestoreTimer);
      draftRestoreTimer = null;
    }
    clearDraftRestoreVerifyTimers();
    // Block auto-saving an empty composer over the incoming chat's disk draft while IPC + restore are in-flight!
    isRestoringDraft = true;
    const releaseIfCurrent = () => {
      if (seq === draftRestoreSeq) {
        isRestoringDraft = false;
        lastDraftObsSig = "";
      }
    };

    // STEP 0 (0ms INSTANT TEXT): Pre-warmed synchronous cache from boot-state-sync / live session!
    // Injects text IMMEDIATELY without waiting for async disk IPC or binary attachments!
    let earlyInjectedText = false;
    const cachedText = draftTextCacheByChat.get(chatKey) || "";
    if (cachedText && String(cachedText).trim()) {
      let earlyAttempts = 0;
      const tryEarlyText = () => {
        if (state.destroyed || seq !== draftRestoreSeq || state.activeChatKey !== chatKey || state.userEditedComposerInChat) return;
        const foundEarly = typeof rv5FindNativeComposer === "function" ? rv5FindNativeComposer(doc) : { container: null, editable: null };
        if (!foundEarly || !foundEarly.editable) {
          earlyAttempts += 1;
          if (earlyAttempts < 240 && win && typeof win.setTimeout === "function") {
            draftEarlyTextTimer = win.setTimeout(tryEarlyText, 25);
          }
          return;
        }
        const curEarly = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(foundEarly.editable) : "";
        if (curEarly.length === 0) {
          earlyInjectedText = true;
          insertTextIntoNativeComposerRich(foundEarly.editable, cachedText).catch(() => {});
        }
      };
      tryEarlyText();
    }

    invokeIpc("agy-studio:get-composer-draft", { chatKey }).then((res) => {
      if (state.destroyed || seq !== draftRestoreSeq || state.activeChatKey !== chatKey) {
        releaseIfCurrent();
        return;
      }
      if (draftEarlyTextTimer && win && typeof win.clearTimeout === "function") {
        win.clearTimeout(draftEarlyTextTimer);
        draftEarlyTextTimer = null;
      }
      if (!res || !res.ok || !res.draft) {
        draftTextCacheByChat.delete(chatKey);
        releaseIfCurrent();
        return;
      }
      const draft = res.draft;
      const hasText = Boolean(draft.text && String(draft.text).trim());
      const hasAtts = Array.isArray(draft.attachments) && draft.attachments.length > 0;
      if (hasText) draftTextCacheByChat.set(chatKey, draft.text);
      else draftTextCacheByChat.delete(chatKey);
      if (!hasText && !hasAtts) {
        releaseIfCurrent();
        return;
      }

      let attempts = 0;
      let rehydrateRetries = 0;
      let stickinessInFlight = false;
      const runStickinessRecovery = async () => {
        if (stickinessInFlight || state.destroyed || seq !== draftRestoreSeq || state.activeChatKey !== chatKey) return;
        if (state.userEditedComposerInChat || Date.now() < draftJustSubmittedUntil) return;
        if (rehydrateRetries >= 4) return;
        const foundNow = typeof rv5FindNativeComposer === "function" ? rv5FindNativeComposer(doc) : { container: null, editable: null };
        if (!foundNow || !foundNow.editable) return;
        const curNow = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(foundNow.editable) : "";
        const needText = hasText && curNow.trim().length === 0;
        const needAtts = hasAtts && !hasComposerAttachments(foundNow.container, foundNow.editable);
        if (!needText && !needAtts) return;
        // React cold-hydration reset or remounted Lexical/attachments over our restored draft — re-apply cleanly!
        stickinessInFlight = true;
        rehydrateRetries += 1;
        isRestoringDraft = true;
        try {
          if (needText) {
            await insertTextIntoNativeComposerRich(foundNow.editable, draft.text);
          }
          if (needAtts) {
            await insertAttachmentsIntoNativeComposer(draft.attachments, foundNow.container, foundNow.editable);
          }
        } finally {
          stickinessInFlight = false;
          if (win && typeof win.setTimeout === "function") win.setTimeout(releaseIfCurrent, needAtts ? 600 : 350);
          else releaseIfCurrent();
        }
      };

      const scheduleStickinessCheck = (targetContainer, targetEditable) => {
        if ((!hasText && !hasAtts) || !win || typeof win.setTimeout !== "function") return;
        // Instant MutationObserver recovery on composer container (catches BOTH in-place Lexical clears AND full DOM remounts!)
        const obsRoot = targetContainer || targetEditable;
        if (hasText && obsRoot && typeof win.MutationObserver === "function") {
          try {
            if (draftStickinessObserver) draftStickinessObserver.disconnect();
            draftStickinessObserver = new win.MutationObserver(() => {
              if (state.destroyed || seq !== draftRestoreSeq || state.activeChatKey !== chatKey || state.userEditedComposerInChat) {
                if (draftStickinessObserver) {
                  try { draftStickinessObserver.disconnect(); } catch (_e) {}
                  draftStickinessObserver = null;
                }
                return;
              }
              const curFound = typeof rv5FindNativeComposer === "function" ? rv5FindNativeComposer(doc) : { editable: targetEditable };
              const edNow = (curFound && curFound.editable) || targetEditable;
              const txtNow = edNow && typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(edNow) : "";
              if (txtNow.length === 0) runStickinessRecovery();
            });
            draftStickinessObserver.observe(obsRoot, { childList: true, subtree: true, characterData: true });
            const stopObsTid = win.setTimeout(() => {
              if (draftStickinessObserver) {
                try { draftStickinessObserver.disconnect(); } catch (_e) {}
                draftStickinessObserver = null;
              }
            }, 1500);
            draftRestoreVerifyTimers.push(stopObsTid);
          } catch (_e) {}
        }
        const delays = [50, 150, 380, 900];
        for (let di = 0; di < delays.length; di += 1) {
          const tid = win.setTimeout(runStickinessRecovery, delays[di]);
          draftRestoreVerifyTimers.push(tid);
        }
      };

      const tryApply = async () => {
        if (state.destroyed || seq !== draftRestoreSeq || state.activeChatKey !== chatKey) {
          releaseIfCurrent();
          return;
        }
        const found = typeof rv5FindNativeComposer === "function" ? rv5FindNativeComposer(doc) : { container: null, editable: null };
        if (!found || !found.editable) {
          attempts += 1;
          // Cold Antigravity restarts can take 3-8s before React mounts the Lexical composer — poll fast (35ms)!
          if (attempts < 240 && win && typeof win.setTimeout === "function") {
            draftRestoreTimer = win.setTimeout(tryApply, 35);
          } else {
            releaseIfCurrent();
          }
          return;
        }
        const existingTxt = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(found.editable) : "";
        const existingAtt = hasComposerAttachments(found.container, found.editable);
        if ((existingTxt.length > 0 && !earlyInjectedText) || (!hasText && existingAtt)) {
          lastKnownComposerSnapByChat.set(chatKey, collectComposerSnapshotSync(found.container, found.editable));
          releaseIfCurrent();
          return;
        }

        try {
          // Inject TEXT FIRST (instant!) so binary attachments never delay text visibility!
          if (hasText && existingTxt.length === 0) {
            await insertTextIntoNativeComposerRich(found.editable, draft.text);
          }
          if (hasAtts && !existingAtt) {
            await insertAttachmentsIntoNativeComposer(draft.attachments, found.container, found.editable);
          }
          lastSavedDraftByChat.set(chatKey, draft);
          lastKnownComposerSnapByChat.set(chatKey, {
            text: draft.text || "",
            items: Array.isArray(draft.attachments)
              ? draft.attachments.map((a) => ({
                  name: a.name,
                  mime: a.mime,
                  isImage: Boolean(a.isImage),
                  fileName: a.fileName || "",
                  dataUrl: a.dataUrl || "",
                }))
              : [],
            cleared: false,
          });
          scheduleStickinessCheck(found.container, found.editable);
        } finally {
          if (win && typeof win.setTimeout === "function") win.setTimeout(releaseIfCurrent, hasAtts ? 600 : 360);
          else releaseIfCurrent();
        }
      };

      // Run IMMEDIATELY (0ms delay!) instead of waiting 160ms
      tryApply();
    }).catch(() => {
      releaseIfCurrent();
    });
  }

  function captureAndRecordUserSubmission(container, editable, source, submitOpts) {
    if (!editable) return;
    const sOpts = submitOpts && typeof submitOpts === "object" ? submitOpts : {};
    const viaStopAndSendButton = Boolean(sOpts.viaStopAndSendButton);
    const chatKey = state.activeChatKey || "__new__";
    const title = state.activeChatTitle || "";
    const snap = collectComposerSnapshotSync(container, editable);
    if (!snap.text.trim() && snap.items.length === 0) return;

    const wasVoiceActive = isVoiceDictationActive() || viaStopAndSendButton;
    const sentText = snap.text;
    const prevMsgSnap = countHostUserMessages();
    const submitToken = ++normalSubmitClearToken;
    userTypedAfterNormalSubmit = false;
    normalSubmitAtMs = Date.now();

    draftJustSubmittedUntil = normalSubmitAtMs + (wasVoiceActive ? 3200 : 2200);
    draftSaveSeq += 1;
    if (draftSaveTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftSaveTimer);
      draftSaveTimer = null;
    }
    if (draftFollowupTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftFollowupTimer);
      draftFollowupTimer = null;
    }
    lastSavedDraftByChat.delete(chatKey);
    lastKnownComposerSnapByChat.delete(chatKey);
    draftTextCacheByChat.delete(chatKey);
    draftDataUrlToFileName.clear();
    invokeIpc("agy-studio:clear-composer-draft", { chatKey });

    // Schedule delayed post-send sweep ONLY after confirming Antigravity accepted the message
    // (never clear synchronously at t=0 so native Enter/Send sees the prompt text!)
    if (sentText.trim() && win && typeof win.setTimeout === "function") {
      if (wasVoiceActive && !viaStopAndSendButton) {
        win.setTimeout(() => {
          if (!state.destroyed && submitToken === normalSubmitClearToken) {
            stopActiveVoiceDictationIfAny({ abortStream: true });
          }
        }, 35);
      }
      const normSentFull = normalizeSpeechText(sentText);
      const isSubmitConfirmed = () => {
        const curMsgs = countHostUserMessages();
        if (curMsgs.count > prevMsgSnap.count) return true;
        if (normSentFull && normalizeSpeechText(curMsgs.lastText) === normSentFull) return true;
        if (isAgentRunningNow()) return true;
        return false;
      };
      const isNormalCancelled = () => submitToken !== normalSubmitClearToken || userTypedAfterNormalSubmit || (!wasVoiceActive && isVoiceDictationActive());
      const runConfirmedSweep = (passIdx) => {
        if (state.destroyed || isNormalCancelled()) return;
        const confirmed = isSubmitConfirmed();
        if (wasVoiceActive && (confirmed || passIdx >= 2)) {
          stopActiveVoiceDictationIfAny({ abortStream: true });
        }
        if (!confirmed) return;
        const curText = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
        if (!curText) return;
        const isVoiceTrailingGhost = Boolean(wasVoiceActive && !userTypedAfterNormalSubmit && Date.now() - normalSubmitAtMs < 1500);
        if (!isVoiceTrailingGhost && !isResidualOfSentText(curText, sentText, false)) return;
        clearEditableRobust(editable, isVoiceTrailingGhost ? curText : sentText, {
          allowRaw: passIdx >= 2,
          forceKeystroke: passIdx >= 1,
          resetComposition: wasVoiceActive,
          isCancelled: isNormalCancelled,
        });
      };
      const delays = wasVoiceActive ? [110, 260, 520, 950, 1500, 2100] : [220, 550, 1100];
      for (let di = 0; di < delays.length; di += 1) {
        win.setTimeout(() => runConfirmedSweep(di), delays[di]);
      }
    }

    if (state.settings.inputHistoryEnabled === false) return;
    (async () => {
      if (pendingComposerReads.size > 0) {
        await Promise.race([
          Promise.all(Array.from(pendingComposerReads)),
          new Promise((r) => (win && typeof win.setTimeout === "function" ? win.setTimeout(r, 800) : setTimeout(r, 800))),
        ]);
      }
      const atts = await resolveSnapshotAttachments(snap.items, true);
      const payloadAtts = atts.map((a) => ({
        name: a.name,
        mime: a.mime,
        isImage: a.isImage,
        fileName: a.fileName || undefined,
        dataUrl: a.dataUrl || undefined,
      }));
      await invokeIpc("agy-studio:record-input-history", {
        chatKey,
        title,
        text: snap.text,
        source: source || "chat",
        attachments: payloadAtts,
      });
      if (!state.destroyed && state.isOpen && state.activeTab === "history") {
        refreshInputHistory();
      }
    })();
  }

  function refreshInputHistory() {
    state.inputHistory = Object.assign({}, state.inputHistory || {}, { loading: true });
    if (state.isOpen && state.activeTab === "history") renderStructure();
    return invokeIpc("agy-studio:get-input-history").then((res) => {
      if (state.destroyed) return res;
      state.inputHistory = {
        loading: false,
        items: res && Array.isArray(res.items) ? res.items : [],
        draftCount: res && typeof res.draftCount === "number" ? res.draftCount : 0,
      };
      if (state.isOpen && state.activeTab === "history") {
        renderStructure();
      }
      return res;
    });
  }

  let pickerMoveRafId = 0;
  let pickerPendingEl = null;
  let pickerPointerDownHandler = null;
  let pickerPointerUpHandler = null;
  let pickerMarqueeState = null;
  let suppressNextPickerClickUntil = 0;
  let inspectorDragUndoCaptured = false;
  let inspectorDragMoveState = null;
  let inspectorDragMoveDownHandler = null;
  let inspectorDragMoveMoveHandler = null;
  let inspectorDragMoveUpHandler = null;
  let inspectorDragMoveKeyHandler = null;

  let pickerHoverEl = null;
  let pickerHoverChildStack = [];

  function isIgnoredPickerTarget(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el === doc.body || el === doc.documentElement) return true;
    if (el.id === "rudex-bg" || el.id === "rudex-studio-host") return true;
    if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) return true;
    if (typeof el.closest === "function") {
      try {
        if (el.closest("#rudex-bg, [data-rudex-live-slot], [data-rudex-native-entry], [data-rudex-img-edit-btn]")) return true;
      } catch (_e) {}
    }
    return false;
  }

  function resolvePickerTargetAtPoint(ev) {
    if (!ev) return null;
    const cx = typeof ev.clientX === "number" && Number.isFinite(ev.clientX) ? ev.clientX : null;
    const cy = typeof ev.clientY === "number" && Number.isFinite(ev.clientY) ? ev.clientY : null;
    const SKIP_SVG_PARTS = new Set(["PATH", "CIRCLE", "RECT", "LINE", "POLYLINE", "POLYGON", "ELLIPSE", "G", "USE", "DEFS", "CLIPPATH", "MASK"]);
    const normalizePickedNode = (node) => {
      if (!node) return null;
      let cur = node.nodeType === 3 ? node.parentElement : node;
      while (cur && cur.nodeType === 1 && SKIP_SVG_PARTS.has(String(cur.tagName || "").toUpperCase())) {
        cur = cur.parentElement;
      }
      if (!cur || cur.nodeType !== 1 || isIgnoredPickerTarget(cur)) return null;
      return cur;
    };

    const stackCands = [];
    const stackSet = new Set();
    const pushStack = (el) => {
      const norm = normalizePickedNode(el);
      if (!norm || stackSet.has(norm)) return;
      stackSet.add(norm);
      stackCands.push(norm);
    };
    pushStack(ev.target);
    if (cx !== null && cy !== null && doc && typeof doc.elementsFromPoint === "function") {
      try {
        const stack = doc.elementsFromPoint(cx, cy) || [];
        for (let i = 0; i < stack.length && stackCands.length < 18; i += 1) {
          pushStack(stack[i]);
        }
      } catch (_e) {}
    }
    const raw = stackCands[0] || null;
    if (!raw) return null;
    if (cx === null || cy === null || typeof raw.getBoundingClientRect !== "function") return raw;

    const getDepth = (el) => {
      let d = 0;
      let p = el && el.parentElement;
      while (p && p !== doc.body && d < 64) { d += 1; p = p.parentElement; }
      return d;
    };
    const isVisiblePickerNode = (el) => {
      if (!win || typeof win.getComputedStyle !== "function") return true;
      try {
        const cs = win.getComputedStyle(el);
        if (cs && (cs.display === "none" || cs.visibility === "hidden")) return false;
      } catch (_e) {}
      return true;
    };
    const isInteractiveHint = (el) => {
      const t = String(el.tagName || "").toUpperCase();
      if (t === "BUTTON" || t === "A" || t === "INPUT" || t === "SELECT" || t === "TEXTAREA" || t === "SVG") return true;
      const role = typeof el.getAttribute === "function" ? (el.getAttribute("role") || "") : "";
      return role === "button" || role === "tab" || role === "switch" || role === "listitem" || role === "menuitem" || role === "option";
    };

    const rawRect = raw.getBoundingClientRect();
    const rawArea = Math.max(1, (rawRect.width || 0) * (rawRect.height || 0));

    // Seed search with ALL elementsFromPoint candidates + immediate parent of raw (catches pointer-events:none siblings & small buttons/dots under wrappers!)
    const seen = new Set();
    const queue = [];
    const enqueue = (el) => {
      if (!el || el.nodeType !== 1 || seen.has(el) || isIgnoredPickerTarget(el)) return;
      seen.add(el);
      queue.push(el);
    };
    for (let si = 0; si < stackCands.length; si += 1) {
      enqueue(stackCands[si]);
    }
    if (raw.parentElement && raw.parentElement !== doc.body && raw.parentElement !== doc.documentElement) {
      const pChs = raw.parentElement.children;
      for (let ci = 0; pChs && ci < pChs.length && ci < 48; ci += 1) enqueue(pChs[ci]);
    }

    let bestStrict = null;
    let bestStrictScore = Infinity;
    let bestStrictDepth = -1;
    let bestFuzzy = null;
    let bestFuzzyScore = Infinity;

    let scanned = 0;
    while (queue.length > 0 && scanned < 420) {
      const cand = queue.shift();
      scanned += 1;
      const tag = String(cand.tagName || "").toUpperCase();
      if (SKIP_SVG_PARTS.has(tag)) continue;
      if (typeof cand.getBoundingClientRect !== "function") continue;
      const r = cand.getBoundingClientRect();
      if (!r || r.width < 4 || r.height < 4) continue;
      if (!isVisiblePickerNode(cand)) continue;

      const strictHit = cx >= r.left - 0.5 && cx <= r.right + 0.5 && cy >= r.top - 0.5 && cy <= r.bottom + 0.5;
      const isUltraThin = r.width <= 16 || r.height <= 16;
      const fuzzyPad = isUltraThin ? 4 : 1.5;
      const fuzzyHit = strictHit || (cx >= r.left - fuzzyPad && cx <= r.right + fuzzyPad && cy >= r.top - fuzzyPad && cy <= r.bottom + fuzzyPad);

      // Pruned descent: descend into children ONLY if cursor is inside/near this container (or container has zero-clipped overflow)
      if (cand.children && cand.children.length > 0 && tag !== "SVG") {
        const nearBox = cx >= r.left - 18 && cx <= r.right + 18 && cy >= r.top - 18 && cy <= r.bottom + 18;
        if (nearBox) {
          for (let j = 0; j < cand.children.length && queue.length < 480; j += 1) {
            enqueue(cand.children[j]);
          }
        }
      }

      if (!fuzzyHit) continue;
      const area = Math.max(1, r.width * r.height);
      const depth = getDepth(cand);
      const isSlimRail = (r.width <= 64 && r.height >= 48) || (r.height <= 44 && r.width >= 96);
      const isInsideRaw = raw === cand || (typeof raw.contains === "function" && raw.contains(cand));
      if (!isInsideRaw && !stackSet.has(cand) && area > rawArea * 0.9 && !isSlimRail) continue;

      // Prefer exact compact targets (dots, buttons, icons, tight wrappers) over huge containers
      const interFactor = isInteractiveHint(cand) && area <= 60000 ? 0.86 : 1.0;
      const railFactor = isSlimRail && area < rawArea * 0.35 ? 0.72 : 1.0;
      const score = area * interFactor * railFactor;

      if (strictHit) {
        if (score < bestStrictScore * 0.98 || (Math.abs(score - bestStrictScore) <= bestStrictScore * 0.02 && depth > bestStrictDepth)) {
          bestStrict = cand;
          bestStrictScore = score;
          bestStrictDepth = depth;
        }
      } else if (score < bestFuzzyScore) {
        bestFuzzy = cand;
        bestFuzzyScore = score;
      }
    }
    return bestStrict || bestFuzzy || raw;
  }

  function splitTopLevelCssSelectors(rawSelector) {
    const s = String(rawSelector || "").trim();
    if (!s) return [];
    const out = [];
    let cur = "";
    let paren = 0;
    let bracket = 0;
    let quote = "";
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i];
      if (quote) {
        cur += ch;
        if (ch === "\\" && i + 1 < s.length) {
          i += 1;
          cur += s[i];
        } else if (ch === quote) {
          quote = "";
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        cur += ch;
      } else if (ch === "(") {
        paren += 1;
        cur += ch;
      } else if (ch === ")") {
        paren = Math.max(0, paren - 1);
        cur += ch;
      } else if (ch === "[") {
        bracket += 1;
        cur += ch;
      } else if (ch === "]") {
        bracket = Math.max(0, bracket - 1);
        cur += ch;
      } else if (ch === "," && paren === 0 && bracket === 0) {
        const part = cur.trim();
        if (part) out.push(part);
        cur = "";
      } else {
        cur += ch;
      }
    }
    const tail = cur.trim();
    if (tail) out.push(tail);
    return out;
  }

  function querySelectedElements(selector) {
    const out = [];
    if (!selector || !doc || typeof doc.querySelectorAll !== "function") return out;
    const seen = new Set();
    const branches = splitTopLevelCssSelectors(selector);
    const listToQuery = branches.length > 0 ? branches : [selector];
    for (let bi = 0; bi < listToQuery.length; bi += 1) {
      try {
        const matches = doc.querySelectorAll(listToQuery[bi]);
        for (let mi = 0; matches && mi < matches.length; mi += 1) {
          const el = matches[mi];
          if (!el || seen.has(el) || isIgnoredPickerTarget(el)) continue;
          seen.add(el);
          out.push(el);
        }
      } catch (_e) {}
    }
    return out;
  }

  function collectElementsInMarqueeRect(box) {
    if (!box || !doc || !doc.body) return [];
    const bLeft = Number(box.left) || 0;
    const bTop = Number(box.top) || 0;
    const bRight = Number(box.right !== undefined ? box.right : bLeft + (Number(box.width) || 0));
    const bBottom = Number(box.bottom !== undefined ? box.bottom : bTop + (Number(box.height) || 0));
    const bw = bRight - bLeft;
    const bh = bBottom - bTop;
    if (bw < 8 || bh < 8) return [];

    const vpW = (win && Number(win.innerWidth)) || 1440;
    const vpH = (win && Number(win.innerHeight)) || 900;
    const vpArea = Math.max(1, vpW * vpH);
    const SKIP_TAGS = new Set([
      "SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "BR", "HR", "HEAD", "TITLE",
      "PATH", "CIRCLE", "RECT", "LINE", "POLYLINE", "POLYGON", "ELLIPSE", "G", "USE", "DEFS", "CLIPPATH", "MASK",
    ]);
    const SEMANTIC_TAGS = new Set(["ASIDE", "HEADER", "MAIN", "SECTION", "NAV", "FOOTER", "ARTICLE", "BUTTON", "A", "INPUT", "TEXTAREA", "SELECT", "FORM"]);
    const isRu = state.locale !== "en";

    const isVisibleEl = (el) => {
      if (!win || typeof win.getComputedStyle !== "function") return true;
      try {
        const cs = win.getComputedStyle(el);
        if (!cs) return true;
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        const op = parseFloat(cs.opacity);
        if (Number.isFinite(op) && op <= 0.01) return false;
      } catch (_e) {}
      return true;
    };

    const hasOwnVisualOrSemantic = (el) => {
      const tag = String(el.tagName || "").toUpperCase();
      if (SEMANTIC_TAGS.has(tag)) return true;
      if (typeof el.getAttribute === "function") {
        if (
          el.getAttribute("data-testid") ||
          el.getAttribute("role") ||
          el.getAttribute("aria-label") ||
          el.getAttribute("data-rudex-bg-sidebar") ||
          el.getAttribute("data-rudex-bg-header") ||
          el.getAttribute("data-rudex-theme-composer")
        ) {
          return true;
        }
      }
      if (win && typeof win.getComputedStyle === "function") {
        try {
          const cs = win.getComputedStyle(el);
          if (cs) {
            const bg = parseCssColorToHex(cs.backgroundColor, "");
            if (bg && bg.alphaPct > 2) return true;
            const bTopW = parseFloat(cs.borderTopWidth) || 0;
            const bLeftW = parseFloat(cs.borderLeftWidth) || 0;
            if (bTopW >= 0.5 || bLeftW >= 0.5) return true;
            if (cs.boxShadow && cs.boxShadow !== "none") return true;
          }
        } catch (_e) {}
      }
      return false;
    };

    const allNodes = [];
    const queue = [];
    if (doc.body.children) {
      for (let i = 0; i < doc.body.children.length; i += 1) queue.push(doc.body.children[i]);
    }
    let scanned = 0;
    while (queue.length > 0 && scanned < 1400) {
      const el = queue.shift();
      scanned += 1;
      if (!el || el.nodeType !== 1 || isIgnoredPickerTarget(el)) continue;
      const tag = String(el.tagName || "").toUpperCase();
      if (SKIP_TAGS.has(tag)) continue;
      if (typeof el.getBoundingClientRect !== "function") continue;
      const r = el.getBoundingClientRect();
      if (!r || r.width < 10 || r.height < 10) continue;
      const ixL = Math.max(bLeft, r.left);
      const ixT = Math.max(bTop, r.top);
      const ixR = Math.min(bRight, r.right);
      const ixB = Math.min(bBottom, r.bottom);
      const ixW = ixR - ixL;
      const ixH = ixB - ixT;
      if (ixW <= 0 || ixH <= 0) continue;
      if (!isVisibleEl(el)) continue;

      if (el.children && el.children.length > 0 && tag !== "SVG") {
        for (let ci = 0; ci < el.children.length && queue.length < 1800; ci += 1) {
          queue.push(el.children[ci]);
        }
      }
      const area = Math.max(1, r.width * r.height);
      if (area >= vpArea * 0.88) continue;
      const ixArea = ixW * ixH;
      const elCoverage = ixArea / area;
      const envelopsBox = r.left <= bLeft + 2 && r.right >= bRight - 2 && r.top <= bTop + 2 && r.bottom >= bBottom - 2;
      allNodes.push({ el, rect: r, area, ixW, ixH, ixArea, elCoverage, envelopsBox });
    }

    const isAncestorOf = (anc, desc) => {
      if (!anc || !desc || anc === desc) return false;
      if (typeof anc.contains === "function") return anc.contains(desc);
      let p = desc.parentElement;
      while (p) {
        if (p === anc) return true;
        p = p.parentElement;
      }
      return false;
    };

    const unwrapAndPrune = (pool) => {
      // Unwrap transparent non-semantic layout containers that wrap >=2 distinct candidates in pool
      const unwrapped = pool.filter((item) => {
        if (hasOwnVisualOrSemantic(item.el)) return true;
        let childHits = 0;
        for (let j = 0; j < pool.length; j += 1) {
          if (pool[j] !== item && isAncestorOf(item.el, pool[j].el)) {
            childHits += 1;
            if (childHits >= 1) return false;
          }
        }
        return true;
      });
      // Keep topmost candidates (drop descendants of an already selected candidate)
      const kept = [];
      for (let i = 0; i < unwrapped.length; i += 1) {
        const cur = unwrapped[i];
        let coveredByAnc = false;
        for (let j = 0; j < unwrapped.length; j += 1) {
          if (i !== j && isAncestorOf(unwrapped[j].el, cur.el)) {
            coveredByAnc = true;
            break;
          }
        }
        if (!coveredByAnc) kept.push(cur);
      }
      return kept;
    };

    // Pass 1: Elements mostly contained (>= 55%) inside the marquee rectangle
    const containedPool = allNodes.filter((n) => n.elCoverage >= 0.55 && !n.envelopsBox);
    let chosen = unwrapAndPrune(containedPool);

    // Pass 2: Crossing fallback — e.g. dragging across 2 tall full-height windows / panels
    if (chosen.length < 2) {
      const crossingPool = allNodes.filter((n) => !n.envelopsBox && n.ixW >= 12 && n.ixH >= 12 && (n.rect.width >= 24 && n.rect.height >= 24));
      const crossingChosen = unwrapAndPrune(crossingPool);
      if (crossingChosen.length > chosen.length) {
        chosen = crossingChosen;
      }
    }

    // Sort top-to-bottom, left-to-right for predictable chip numbering
    chosen.sort((a, b) => {
      if (Math.abs(a.rect.top - b.rect.top) > 18) return a.rect.top - b.rect.top;
      return a.rect.left - b.rect.left;
    });

    const targets = [];
    const seenSel = new Set();
    for (let i = 0; i < chosen.length && targets.length < 12; i += 1) {
      const el = chosen[i].el;
      const sel = typeof rv5BuildSmartSelector === "function" ? rv5BuildSmartSelector(el, "exact", doc) : "";
      if (!sel || seenSel.has(sel)) continue;
      seenSel.add(sel);
      const origTxt = translator && typeof translator.getOriginalTextForElement === "function" ? translator.getOriginalTextForElement(el) : "";
      const name = typeof rv5DescribeElementFriendly === "function" ? rv5DescribeElementFriendly(el, isRu, origTxt) : sel;
      targets.push({ el, selector: sel, name });
    }
    return targets;
  }

  function updatePickerHighlightFast() {
    if (!pickerMountEl) return;
    const hl = typeof pickerMountEl.querySelector === "function" ? pickerMountEl.querySelector('[data-role="pickerHighlight"]') : null;
    if (!hl) {
      renderPickerMount();
      return;
    }
    const r = state.pickerHoverRect;
    if (!r || state.pickerMarqueeRect) {
      hl.style.display = "none";
      return;
    }
    hl.style.display = "block";
    hl.style.left = `${Math.round(r.left)}px`;
    hl.style.top = `${Math.round(r.top)}px`;
    hl.style.width = `${Math.round(r.width)}px`;
    hl.style.height = `${Math.round(r.height)}px`;
    if (hl.classList) hl.classList.toggle("is-tag-below", r.top < 28);
    const tag = typeof hl.querySelector === "function" ? hl.querySelector(".rx-picker-tag") : null;
    if (tag) tag.textContent = state.pickerHoverLabel || "";
  }

  function updateInspectorMatchBoxesFast() {
    if (!pickerMountEl || !state.pickerSelected || state.pickerActive) return;
    const layer = typeof pickerMountEl.querySelector === "function" ? pickerMountEl.querySelector('[data-role="inspectorMatchLayer"]') : null;
    if (!layer) return;
    const matched = querySelectedElements(state.pickerSelected.selector);
    const boxes = [];
    for (let i = 0; i < matched.length && boxes.length < 16; i += 1) {
      const el = matched[i];
      if (!el || typeof el.getBoundingClientRect !== "function") continue;
      const r = el.getBoundingClientRect();
      if (!r || r.width < 2 || r.height < 2) continue;
      const badge = matched.length > 1 ? `<span class="rx-picker-match-num">${i + 1}</span>` : "";
      boxes.push(`<div class="rx-picker-match-box" style="left:${Math.round(r.left)}px;top:${Math.round(r.top)}px;width:${Math.round(r.width)}px;height:${Math.round(r.height)}px">${badge}</div>`);
    }
    layer.innerHTML = boxes.join("");
  }

  function renderPickerMount() {
    if (!pickerMountEl) return;
    const isRu = state.locale !== "en";
    const parts = [];
    if (state.pickerActive) {
      const mode = state.pickerMode || "single";
      const multiCount = Array.isArray(state.pickerMultiItems) ? state.pickerMultiItems.length : 0;
      const hintText = mode === "region"
        ? (isRu ? "Область: протяните рамку по окнам (или клик — 1 эл.)" : "Region: drag a box over windows (or click 1 el)")
        : (mode === "multi"
          ? (isRu ? "Группа: кликайте по элементам или рамкой → «Настроить»" : "Group: click elements or drag box → Edit")
          : (isRu ? "Клик — 1 эл. · Протяжка — область · Ctrl+клик — группа" : "Click — 1 el · Drag — region · Ctrl+click — group"));
      parts.push(`
        <div class="rx-picker-banner">
          ${iconSvg("crosshair", 13)}
          <div class="rx-picker-mode-pills">
            <button type="button" class="rx-picker-mode-btn${mode === "single" ? " is-active" : ""}" data-action="picker-set-mode" data-val="single">${isRu ? "1 элемент" : "Single"}</button>
            <button type="button" class="rx-picker-mode-btn${mode === "region" ? " is-active" : ""}" data-action="picker-set-mode" data-val="region">${isRu ? "Область" : "Region"}</button>
            <button type="button" class="rx-picker-mode-btn${mode === "multi" ? " is-active" : ""}" data-action="picker-set-mode" data-val="multi">${isRu ? "Группа (+)" : "Group (+)"}</button>
          </div>
          <span>${escHtml(hintText)}</span>
          ${multiCount > 0 ? `<button type="button" class="btn btn-sm btn-primary" data-action="picker-commit-multi">${isRu ? `Настроить (${multiCount})` : `Edit (${multiCount})`}</button>` : ""}
          <button type="button" class="btn btn-sm" data-action="stop-element-picker">${isRu ? "Выход" : "Exit"}</button>
        </div>
      `);
      const mq = state.pickerMarqueeRect;
      if (mq && mq.width >= 4 && mq.height >= 4) {
        parts.push(`<div class="rx-picker-marquee" data-role="pickerMarquee" style="left:${Math.round(mq.left)}px;top:${Math.round(mq.top)}px;width:${Math.round(mq.width)}px;height:${Math.round(mq.height)}px"></div>`);
      }
      if (multiCount > 0) {
        for (let mi = 0; mi < state.pickerMultiItems.length && mi < 16; mi += 1) {
          const item = state.pickerMultiItems[mi];
          const el = (item && item.el && item.el.nodeType === 1) ? item.el : (item && item.selector ? querySelectedElements(item.selector)[0] : null);
          if (!el || typeof el.getBoundingClientRect !== "function") continue;
          const mr = el.getBoundingClientRect();
          if (!mr || mr.width < 2 || mr.height < 2) continue;
          parts.push(`<div class="rx-picker-match-box" style="left:${Math.round(mr.left)}px;top:${Math.round(mr.top)}px;width:${Math.round(mr.width)}px;height:${Math.round(mr.height)}px"><span class="rx-picker-match-num">${mi + 1}</span></div>`);
        }
      }
      const r = state.pickerHoverRect;
      const styleStr = (r && !mq)
        ? `left:${Math.round(r.left)}px;top:${Math.round(r.top)}px;width:${Math.round(r.width)}px;height:${Math.round(r.height)}px`
        : "display:none";
      const belowCls = r && r.top < 28 ? " is-tag-below" : "";
      parts.push(`
        <div class="rx-picker-highlight${belowCls}" data-role="pickerHighlight" style="${styleStr}">
          <span class="rx-picker-tag">${escHtml(state.pickerHoverLabel || "")}</span>
        </div>
      `);
    }
    if (state.pickerSelected && typeof rv5BuildElementInspectorHtml === "function") {
      if (!state.pickerActive) {
        const matched = querySelectedElements(state.pickerSelected.selector);
        const matchHtml = [];
        for (let i = 0; i < matched.length && matchHtml.length < 16; i += 1) {
          const mel = matched[i];
          if (!mel || typeof mel.getBoundingClientRect !== "function") continue;
          const mr = mel.getBoundingClientRect();
          if (!mr || mr.width < 2 || mr.height < 2) continue;
          const num = matched.length > 1 ? `<span class="rx-picker-match-num">${i + 1}</span>` : "";
          matchHtml.push(`<div class="rx-picker-match-box" style="left:${Math.round(mr.left)}px;top:${Math.round(mr.top)}px;width:${Math.round(mr.width)}px;height:${Math.round(mr.height)}px">${num}</div>`);
        }
        parts.push(`<div data-role="inspectorMatchLayer">${matchHtml.join("")}</div>`);
      }
      parts.push(rv5BuildElementInspectorHtml(
        state.pickerSelected,
        state.appearanceDraft,
        state.settings.customLabels || [],
        state.systemFonts,
        isRu,
        {
          drawerOpen: Boolean(state.isOpen && state.activeTab === "appearance" && state.appearanceDockedRight),
          nudgeStep: state.pickerNudgeStep || 4,
          dragMoveActive: Boolean(state.inspectorDragMoveActive),
        }
      ));
    }
    pickerMountEl.innerHTML = parts.join("");
  }

  function setPickerCursorStyle(active, cursorKind) {
    if (!doc) return;
    const id = "rudex-picker-cursor-style";
    try {
      const existing = typeof doc.getElementById === "function" ? doc.getElementById(id) : null;
      if (!active) {
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        return;
      }
      const cur = cursorKind === "move" ? "move" : "crosshair";
      const css = `body *:not(#rudex-studio-host):not(#rudex-studio-host *) { cursor: ${cur} !important; user-select: none !important; }`;
      if (existing) {
        existing.textContent = css;
        return;
      }
      if (doc.head && typeof doc.createElement === "function") {
        const st = doc.createElement("style");
        st.id = id;
        st.setAttribute("data-rudex-ignore", "1");
        st.textContent = css;
        doc.head.appendChild(st);
      }
    } catch (_e) {}
  }

  function stopInspectorDragMove(skipRender) {
    const wasActive = Boolean(state.inspectorDragMoveActive);
    state.inspectorDragMoveActive = false;
    inspectorDragMoveState = null;
    inspectorDragUndoCaptured = false;
    if (doc && typeof doc.removeEventListener === "function") {
      if (inspectorDragMoveDownHandler) { doc.removeEventListener("pointerdown", inspectorDragMoveDownHandler, true); inspectorDragMoveDownHandler = null; }
      if (inspectorDragMoveMoveHandler) { doc.removeEventListener("mousemove", inspectorDragMoveMoveHandler, true); inspectorDragMoveMoveHandler = null; }
      if (inspectorDragMoveUpHandler) { doc.removeEventListener("pointerup", inspectorDragMoveUpHandler, true); inspectorDragMoveUpHandler = null; }
      if (inspectorDragMoveKeyHandler) { doc.removeEventListener("keydown", inspectorDragMoveKeyHandler, true); inspectorDragMoveKeyHandler = null; }
    }
    if (!state.pickerActive) setPickerCursorStyle(false);
    if (wasActive && !skipRender) renderPickerMount();
  }

  function startInspectorDragMove() {
    if (!state.pickerSelected) return;
    if (state.inspectorDragMoveActive) {
      stopInspectorDragMove();
      return;
    }
    if (state.pickerActive) stopElementPicker();
    state.inspectorDragMoveActive = true;
    setPickerCursorStyle(true, "move");
    inspectorDragMoveDownHandler = (e) => {
      if (!state.inspectorDragMoveActive || !state.pickerSelected || !e) return;
      if (e.target && isIgnoredPickerTarget(e.target)) return;
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      const sel = state.pickerSelected;
      const ov = (state.appearanceDraft.elementOverrides || []).find((o) => o.id === sel.overrideId || o.selector === sel.selector);
      const st = ov && ov.styles ? ov.styles : {};
      const baseX = Number.isFinite(Number(st.offsetX)) ? Math.round(Number(st.offsetX)) : 0;
      const baseY = Number.isFinite(Number(st.offsetY)) ? Math.round(Number(st.offsetY)) : 0;
      inspectorDragMoveState = {
        startX: Number(e.clientX) || 0,
        startY: Number(e.clientY) || 0,
        baseX,
        baseY,
      };
    };
    inspectorDragMoveMoveHandler = (e) => {
      if (!state.inspectorDragMoveActive || !inspectorDragMoveState || !state.pickerSelected || !e) return;
      const dx = Math.round((Number(e.clientX) || 0) - inspectorDragMoveState.startX);
      const dy = Math.round((Number(e.clientY) || 0) - inspectorDragMoveState.startY);
      const nextX = Math.max(-800, Math.min(800, inspectorDragMoveState.baseX + dx));
      const nextY = Math.max(-800, Math.min(800, inspectorDragMoveState.baseY + dy));
      upsertSelectedElementStyle("offsetX", nextX, { preserveDom: true, liveOnly: true, skipUndo: true });
      upsertSelectedElementStyle("offsetY", nextY, { preserveDom: true, liveOnly: true, skipUndo: true });
      if (pickerMountEl && typeof pickerMountEl.querySelector === "function") {
        const rx = pickerMountEl.querySelector('[data-insp-range="offsetX"]');
        const nx = pickerMountEl.querySelector('[data-insp-num="offsetX"]');
        const ry = pickerMountEl.querySelector('[data-insp-range="offsetY"]');
        const ny = pickerMountEl.querySelector('[data-insp-num="offsetY"]');
        if (rx) rx.value = String(nextX);
        if (nx) nx.value = String(nextX);
        if (ry) ry.value = String(nextY);
        if (ny) ny.value = String(nextY);
      }
    };
    inspectorDragMoveUpHandler = () => {
      if (!inspectorDragMoveState) return;
      inspectorDragMoveState = null;
      inspectorDragUndoCaptured = false;
      applyThemeToHost(state.appearanceDraft);
      flushInspectorPersist();
      updateInspectorMatchBoxesFast();
    };
    inspectorDragMoveKeyHandler = (e) => {
      if (!state.inspectorDragMoveActive || !e) return;
      if (e.key === "Escape") {
        if (typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
        stopInspectorDragMove();
      }
    };
    if (doc && typeof doc.addEventListener === "function") {
      doc.addEventListener("pointerdown", inspectorDragMoveDownHandler, true);
      doc.addEventListener("mousemove", inspectorDragMoveMoveHandler, true);
      doc.addEventListener("pointerup", inspectorDragMoveUpHandler, true);
      doc.addEventListener("keydown", inspectorDragMoveKeyHandler, true);
    }
    renderPickerMount();
  }

  function stopElementPicker() {
    state.pickerActive = false;
    state.pickerHoverRect = null;
    state.pickerHoverLabel = "";
    state.pickerMarqueeRect = null;
    state.pickerMultiItems = [];
    pickerMarqueeState = null;
    pickerPendingEl = null;
    pickerHoverEl = null;
    pickerHoverChildStack = [];
    if (pickerMoveRafId && win && typeof win.cancelAnimationFrame === "function") {
      try { win.cancelAnimationFrame(pickerMoveRafId); } catch (_e) {}
      pickerMoveRafId = 0;
    }
    if (!state.inspectorDragMoveActive) setPickerCursorStyle(false);
    if (doc && typeof doc.removeEventListener === "function") {
      if (pickerMoveHandler) { doc.removeEventListener("mousemove", pickerMoveHandler, true); pickerMoveHandler = null; }
      if (pickerPointerDownHandler) { doc.removeEventListener("pointerdown", pickerPointerDownHandler, true); pickerPointerDownHandler = null; }
      if (pickerPointerUpHandler) { doc.removeEventListener("pointerup", pickerPointerUpHandler, true); pickerPointerUpHandler = null; }
      if (pickerClickHandler) { doc.removeEventListener("click", pickerClickHandler, true); pickerClickHandler = null; }
      if (pickerKeyHandler) { doc.removeEventListener("keydown", pickerKeyHandler, true); pickerKeyHandler = null; }
      if (pickerWheelHandler) { doc.removeEventListener("wheel", pickerWheelHandler, true); pickerWheelHandler = null; }
    }
    if (!state.isOpen && !state.pickerSelected) {
      state.appearanceLivePreview = false;
    }
    renderPickerMount();
    if (state.isOpen) renderStructure();
  }

  let cssColorProbeCtx = null;
  function getCssColorProbeCtx() {
    if (cssColorProbeCtx !== null) return cssColorProbeCtx || null;
    try {
      if (doc && typeof doc.createElement === "function") {
        const cv = doc.createElement("canvas");
        if (cv && typeof cv.getContext === "function") {
          cv.width = 1;
          cv.height = 1;
          const ctx = cv.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            cssColorProbeCtx = ctx;
            return ctx;
          }
        }
      }
    } catch (_e) {}
    cssColorProbeCtx = false;
    return null;
  }

  function parseUserHexInput(raw) {
    const clean = String(raw || "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(clean)) {
      const hex = "#" + clean.split("").map((ch) => ch + ch).join("").toLowerCase();
      return { hex, alphaPct: null };
    }
    if (/^[0-9a-f]{6}$/i.test(clean)) {
      return { hex: "#" + clean.toLowerCase(), alphaPct: null };
    }
    if (/^[0-9a-f]{8}$/i.test(clean)) {
      const hex = "#" + clean.slice(0, 6).toLowerCase();
      const alphaPct = Math.round((parseInt(clean.slice(6, 8), 16) / 255) * 100);
      return { hex, alphaPct };
    }
    return null;
  }

  function parseCssColorToHex(raw, fallbackHex) {
    const s = String(raw || "").trim();
    if (!s || /^transparent$/i.test(s) || /^none$/i.test(s)) {
      return { hex: fallbackHex || "#262624", alphaPct: 0 };
    }
    if (/^#[0-9a-f]{6}$/i.test(s)) return { hex: s.toLowerCase(), alphaPct: 100 };
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      return { hex: "#" + s.slice(1).split("").map((c) => c + c).join("").toLowerCase(), alphaPct: 100 };
    }
    if (/^#[0-9a-f]{8}$/i.test(s)) {
      return {
        hex: "#" + s.slice(1, 7).toLowerCase(),
        alphaPct: Math.max(0, Math.min(100, Math.round((parseInt(s.slice(7, 9), 16) / 255) * 100))),
      };
    }
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(s);
    if (m) {
      const r = Math.max(0, Math.min(255, Math.round(Number(m[1]) || 0)));
      const g = Math.max(0, Math.min(255, Math.round(Number(m[2]) || 0)));
      const b = Math.max(0, Math.min(255, Math.round(Number(m[3]) || 0)));
      let a = 1;
      if (m[4] !== undefined) {
        a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
        if (!Number.isFinite(a)) a = 1;
      }
      const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
      return { hex, alphaPct: Math.max(0, Math.min(100, Math.round(a * 100))) };
    }
    const srgbM = /^color\(\s*srgb\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)(?:\s*\/\s*([\d.eE+-]+%?))?\s*\)$/i.exec(s);
    if (srgbM) {
      const r = Math.max(0, Math.min(255, Math.round((parseFloat(srgbM[1]) || 0) * 255)));
      const g = Math.max(0, Math.min(255, Math.round((parseFloat(srgbM[2]) || 0) * 255)));
      const b = Math.max(0, Math.min(255, Math.round((parseFloat(srgbM[3]) || 0) * 255)));
      let a = 1;
      if (srgbM[4] !== undefined) {
        a = srgbM[4].endsWith("%") ? parseFloat(srgbM[4]) / 100 : parseFloat(srgbM[4]);
        if (!Number.isFinite(a)) a = 1;
      }
      const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
      return { hex, alphaPct: Math.max(0, Math.min(100, Math.round(a * 100))) };
    }
    // Modern CSS Color 4 (oklch, oklab, color-mix, hsl, display-p3, named colors): convert via 1x1 Canvas 2D
    const ctx = getCssColorProbeCtx();
    if (ctx) {
      try {
        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fillStyle = s;
        if (ctx.fillStyle !== "rgba(0, 0, 0, 0)") {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillRect(0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          const a = d[3];
          if (a === 0) return { hex: fallbackHex || "#262624", alphaPct: 0 };
          // Unpremultiply RGB for semi-transparent colors
          const factor = a < 255 ? 255 / a : 1;
          const r = Math.max(0, Math.min(255, Math.round(d[0] * factor)));
          const g = Math.max(0, Math.min(255, Math.round(d[1] * factor)));
          const b = Math.max(0, Math.min(255, Math.round(d[2] * factor)));
          const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
          return { hex, alphaPct: Math.max(0, Math.min(100, Math.round((a / 255) * 100))) };
        }
      } catch (_e) {}
    }
    return { hex: fallbackHex || "#262624", alphaPct: 100 };
  }

  function readElementComputedMetrics(elOrSelector) {
    let el = elOrSelector;
    if (typeof el === "string" && doc && typeof doc.querySelector === "function") {
      try {
        const list = doc.querySelectorAll(el);
        el = null;
        for (let i = 0; list && i < list.length; i += 1) {
          if (list[i] && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(list[i]))) {
            el = list[i];
            break;
          }
        }
      } catch (_e) {
        el = null;
      }
    }
    const defaults = {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.45,
      borderRadius: 8,
      padding: 8,
      paddingY: 8,
      paddingX: 8,
      borderWidth: 1,
      width: 320,
      minHeight: 36,
      offsetX: 0,
      offsetY: 0,
      opacity: 100,
      bgOpacity: 100,
      color: detectAppTheme() === "light" ? "#1b1a18" : "#faf9f5",
      bgColor: detectAppTheme() === "light" ? "#fbfaf6" : "#262624",
      borderColor: detectAppTheme() === "light" ? "#d9d5c9" : "#3a3935",
    };
    if (!el || !win || typeof win.getComputedStyle !== "function") return defaults;
    try {
      let cs = win.getComputedStyle(el);
      const rect = typeof el.getBoundingClientRect === "function" ? el.getBoundingClientRect() : null;
      let bg = parseCssColorToHex(cs.backgroundColor, defaults.bgColor);
      let surfaceEl = el;
      if (
        typeof el.getAttribute === "function" &&
        el.getAttribute("data-rudex-theme-composer") === "1" &&
        bg.alphaPct === 0 &&
        typeof el.querySelector === "function"
      ) {
        const innerRow = el.querySelector('[data-rudex-comp-input-row="1"]');
        if (innerRow) {
          surfaceEl = innerRow;
          cs = win.getComputedStyle(innerRow);
          bg = parseCssColorToHex(cs.backgroundColor, defaults.bgColor);
        }
      }
      let resolvedBgHex = bg.alphaPct > 0 ? bg.hex : "";
      if (!resolvedBgHex) {
        let p = surfaceEl.parentElement;
        for (let hops = 0; p && hops < 8 && p !== doc; hops += 1) {
          try {
            const pCs = win.getComputedStyle(p);
            if (pCs && pCs.backgroundColor) {
              const pBg = parseCssColorToHex(pCs.backgroundColor, "");
              if (pBg.alphaPct > 0 && pBg.hex) {
                resolvedBgHex = pBg.hex;
                break;
              }
            }
          } catch (_e) {}
          p = p.parentElement;
        }
      }
      const surfaceRect = surfaceEl === el
        ? rect
        : (typeof surfaceEl.getBoundingClientRect === "function" ? surfaceEl.getBoundingClientRect() : rect);
      const col = parseCssColorToHex(cs.color, defaults.color);
      const brd = parseCssColorToHex(cs.borderTopColor, defaults.borderColor);
      const fs = Math.round(parseFloat(cs.fontSize));
      const rawFw = parseInt(cs.fontWeight, 10);
      const fw = Number.isFinite(rawFw) ? Math.max(300, Math.min(900, Math.round(rawFw / 100) * 100)) : defaults.fontWeight;
      const rawLhPx = parseFloat(cs.lineHeight);
      const lh = Number.isFinite(rawLhPx) && Number.isFinite(fs) && fs > 0
        ? Math.max(1.0, Math.min(2.2, Math.round((rawLhPx / fs) * 20) / 20))
        : defaults.lineHeight;
      const rad = Math.round(parseFloat(cs.borderTopLeftRadius));
      const padT = parseFloat(cs.paddingTop) || 0;
      const padB = parseFloat(cs.paddingBottom) || 0;
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const padY = Math.round((padT + padB) / 2);
      const padX = Math.round((padL + padR) / 2);
      const pad = Math.round(Math.max(padT, padL) > 0 ? (padT > 0 && padL > 0 ? (padT + padL) / 2 : Math.max(padT, padL)) : 0);
      const bw = Math.round(parseFloat(cs.borderTopWidth) || 0);
      const outerCs = surfaceEl === el ? cs : win.getComputedStyle(el);
      const op = outerCs.opacity !== "" && Number.isFinite(parseFloat(outerCs.opacity)) ? Math.round(parseFloat(outerCs.opacity) * 100) : 100;
      let offX = 0;
      let offY = 0;
      if (typeof outerCs.translate === "string" && outerCs.translate && outerCs.translate !== "none") {
        const tParts = outerCs.translate.trim().split(/\s+/);
        const pxX = parseFloat(tParts[0]);
        const pxY = tParts.length > 1 ? parseFloat(tParts[1]) : 0;
        if (Number.isFinite(pxX)) offX = Math.round(Math.max(-800, Math.min(800, pxX)));
        if (Number.isFinite(pxY)) offY = Math.round(Math.max(-800, Math.min(800, pxY)));
      }
      return {
        fontSize: Number.isFinite(fs) && fs > 0 ? Math.max(8, Math.min(64, fs)) : defaults.fontSize,
        fontWeight: fw,
        lineHeight: lh,
        borderRadius: Number.isFinite(rad) && rad >= 0 ? Math.max(0, Math.min(64, rad)) : defaults.borderRadius,
        padding: Number.isFinite(pad) && pad >= 0 ? Math.max(0, Math.min(64, pad)) : defaults.padding,
        paddingY: Number.isFinite(padY) && padY >= 0 ? Math.max(0, Math.min(64, padY)) : defaults.paddingY,
        paddingX: Number.isFinite(padX) && padX >= 0 ? Math.max(0, Math.min(64, padX)) : defaults.paddingX,
        borderWidth: Number.isFinite(bw) && bw >= 0 ? Math.max(0, Math.min(8, bw)) : defaults.borderWidth,
        width: rect && rect.width > 0 ? Math.max(24, Math.min(1800, Math.round(rect.width))) : defaults.width,
        minHeight: surfaceRect && surfaceRect.height > 0 ? Math.max(16, Math.min(800, Math.round(surfaceRect.height))) : defaults.minHeight,
        offsetX: offX,
        offsetY: offY,
        opacity: Math.max(0, Math.min(100, op)),
        bgOpacity: bg.alphaPct > 0 ? bg.alphaPct : 100,
        color: col.hex,
        bgColor: resolvedBgHex || defaults.bgColor,
        borderColor: brd.alphaPct > 0 ? brd.hex : defaults.borderColor,
      };
    } catch (_e) {
      return defaults;
    }
  }

  let inspSaveTimer = null;
  function commitInspectorAppearanceQuietly() {
    const nextApp = spCloneAppearance(state.appearanceDraft);
    state.settings.appearance = spCloneAppearance(nextApp);
    state.appearanceDirty = false;
    const seq = ++state.settingsSaveSeq;
    inspectorPendingSaveSeq = seq;
    inspectorLiveEditUntil = Date.now() + 800;
    const p = invokeIpc("agy-studio:save-settings", { appearance: nextApp });
    if (p && typeof p.then === "function") {
      p.then((res) => {
        if (seq === inspectorPendingSaveSeq) inspectorPendingSaveSeq = 0;
        if (state.destroyed || seq !== state.settingsSaveSeq) return;
        if (res && res.settings) {
          const sig = computeSettingsStateSig(res);
          if (sig) state.lastRemoteStateSig = sig;
        }
      }, () => {
        if (seq === inspectorPendingSaveSeq) inspectorPendingSaveSeq = 0;
      });
    } else {
      inspectorPendingSaveSeq = 0;
    }
  }
  function flushInspectorPersist() {
    if (inspSaveTimer) {
      if (win && typeof win.clearTimeout === "function") win.clearTimeout(inspSaveTimer);
      inspSaveTimer = null;
      if (!state.destroyed) {
        commitInspectorAppearanceQuietly();
      }
    }
  }
  function scheduleInspectorPersist() {
    inspectorLiveEditUntil = Date.now() + 950;
    if (!win || typeof win.setTimeout !== "function") {
      commitInspectorAppearanceQuietly();
      return;
    }
    if (inspSaveTimer && typeof win.clearTimeout === "function") win.clearTimeout(inspSaveTimer);
    inspSaveTimer = win.setTimeout(() => {
      inspSaveTimer = null;
      if (!state.destroyed) {
        commitInspectorAppearanceQuietly();
      }
    }, 220);
  }
  function syncInspectorOffsetInputsInPlace(nextX, nextY) {
    if (!pickerMountEl || typeof pickerMountEl.querySelector !== "function") return;
    if (nextX !== undefined) {
      const rx = pickerMountEl.querySelector('[data-insp-range="offsetX"]');
      const nx = pickerMountEl.querySelector('[data-insp-num="offsetX"]');
      if (rx) rx.value = String(nextX);
      if (nx) nx.value = String(nextX);
    }
    if (nextY !== undefined) {
      const ry = pickerMountEl.querySelector('[data-insp-range="offsetY"]');
      const ny = pickerMountEl.querySelector('[data-insp-num="offsetY"]');
      if (ry) ry.value = String(nextY);
      if (ny) ny.value = String(nextY);
    }
  }

  function selectElementForInspector(el, opts) {
    if (!el || el.nodeType !== 1 || isIgnoredPickerTarget(el)) return;
    stopInspectorDragMove(true);
    const isRu = state.locale !== "en";
    const o = opts && typeof opts === "object" ? opts : {};
    const origTxt = translator && typeof translator.getOriginalTextForElement === "function" ? translator.getOriginalTextForElement(el) : "";
    const curTxt = String(el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const exactSel = typeof rv5BuildSmartSelector === "function" ? rv5BuildSmartSelector(el, "exact", doc) : "";
    const simSel = typeof rv5BuildSmartSelector === "function" ? rv5BuildSmartSelector(el, "similar", doc) : exactSel;
    const friendly = typeof rv5DescribeElementFriendly === "function" ? rv5DescribeElementFriendly(el, isRu, origTxt) : exactSel;
    const renameable = typeof rv5IsRenameSafeElement === "function" ? rv5IsRenameSafeElement(el) : false;
    const isComposerSel = exactSel === '[data-rudex-theme-composer="1"]';
    const existingPickedOv = (state.appearanceDraft.elementOverrides || []).find(
      (ov) => (isComposerSel && ov.zone === "composer") || ov.selector === exactSel
    );
    const resolvedEl = isComposerSel && doc && typeof doc.querySelector === "function"
      ? (doc.querySelector('[data-rudex-theme-composer="1"]') || el)
      : el;
    const pEl = resolvedEl.parentElement;
    const canParent = Boolean(pEl && pEl !== doc.body && pEl !== doc.documentElement && !isIgnoredPickerTarget(pEl));
    const childStack = Array.isArray(o.childStack) ? o.childStack : [];
    const matchCount = querySelectedElements(exactSel).length || 1;
    state.pickerSelectedEl = resolvedEl;
    state.pickerChildStack = childStack;
    state.pickerSelected = {
      overrideId: existingPickedOv ? existingPickedOv.id : (isComposerSel ? "zone-composer" : undefined),
      name: friendly,
      selector: exactSel,
      exactSelector: exactSel,
      similarSelector: simSel,
      scope: isComposerSel ? "similar" : "exact",
      canToggleScope: !isComposerSel && exactSel !== simSel,
      canSelectParent: canParent,
      canSelectChild: childStack.length > 0,
      renameable,
      origText: origTxt || curTxt,
      currentText: curTxt,
      zone: isComposerSel ? "composer" : "",
      groupTargets: [],
      matchCount,
      computed: readElementComputedMetrics(resolvedEl),
    };
    renderPickerMount();
  }

  function selectGroupForInspector(rawTargets) {
    const isRu = state.locale !== "en";
    const dedup = [];
    const seenSel = new Set();
    for (let i = 0; Array.isArray(rawTargets) && i < rawTargets.length && dedup.length < 12; i += 1) {
      const t = rawTargets[i];
      if (!t) continue;
      let sel = String(t.selector || "").trim();
      let el = t.el && t.el.nodeType === 1 ? t.el : null;
      if (!sel && el && typeof rv5BuildSmartSelector === "function") {
        sel = rv5BuildSmartSelector(el, "exact", doc);
      }
      if (!sel || seenSel.has(sel)) continue;
      seenSel.add(sel);
      if (!el) el = querySelectedElements(sel)[0] || null;
      const origTxt = el && translator && typeof translator.getOriginalTextForElement === "function" ? translator.getOriginalTextForElement(el) : "";
      const name = String(t.name || "").trim() || (el && typeof rv5DescribeElementFriendly === "function" ? rv5DescribeElementFriendly(el, isRu, origTxt) : sel);
      dedup.push({ el, selector: sel, name });
    }
    if (dedup.length === 0) return;
    if (dedup.length === 1) {
      if (dedup[0].el) {
        selectElementForInspector(dedup[0].el);
      } else {
        stopInspectorDragMove(true);
        const existingSingle = (state.appearanceDraft.elementOverrides || []).find((o) => o.selector === dedup[0].selector);
        state.pickerSelectedEl = null;
        state.pickerChildStack = [];
        state.pickerSelected = {
          overrideId: existingSingle ? existingSingle.id : undefined,
          name: dedup[0].name,
          selector: dedup[0].selector,
          exactSelector: dedup[0].selector,
          similarSelector: dedup[0].selector,
          scope: "exact",
          canToggleScope: false,
          canSelectParent: false,
          canSelectChild: false,
          renameable: false,
          origText: "",
          currentText: "",
          zone: "",
          groupTargets: [],
          matchCount: querySelectedElements(dedup[0].selector).length || 1,
          computed: readElementComputedMetrics(dedup[0].selector),
        };
        renderPickerMount();
      }
      return;
    }
    stopInspectorDragMove(true);
    const combinedSel = dedup.map((t) => t.selector).join(", ");
    const shortNames = dedup.slice(0, 2).map((t) => t.name).join(" + ") + (dedup.length > 2 ? "…" : "");
    const groupName = (isRu ? `Группа (${dedup.length}): ` : `Group (${dedup.length}): `) + shortNames;
    const existingGroupOv = (state.appearanceDraft.elementOverrides || []).find((o) => o.selector === combinedSel);
    const firstEl = dedup[0].el || querySelectedElements(dedup[0].selector)[0] || null;
    state.pickerSelectedEl = firstEl;
    state.pickerChildStack = [];
    state.pickerSelected = {
      overrideId: existingGroupOv ? existingGroupOv.id : undefined,
      name: existingGroupOv ? (existingGroupOv.name || groupName) : groupName,
      selector: combinedSel,
      exactSelector: combinedSel,
      similarSelector: combinedSel,
      scope: "group",
      canToggleScope: false,
      canSelectParent: false,
      canSelectChild: false,
      renameable: false,
      origText: "",
      currentText: "",
      zone: "",
      groupTargets: dedup.map((t) => ({ selector: t.selector, name: t.name })),
      matchCount: querySelectedElements(combinedSel).length || dedup.length,
      computed: readElementComputedMetrics(firstEl || dedup[0].selector),
    };
    renderPickerMount();
  }

  function startElementPicker(modeOrOpts) {
    const opts = typeof modeOrOpts === "string"
      ? { mode: modeOrOpts }
      : (modeOrOpts && typeof modeOrOpts === "object" ? modeOrOpts : null);
    if (state.pickerActive && !opts) {
      stopElementPicker();
      return;
    }
    stopInspectorDragMove(true);
    const requestedMode = opts && (opts.mode === "region" || opts.mode === "multi" || opts.mode === "single") ? opts.mode : "single";
    if (state.pickerActive && opts) {
      state.pickerMode = requestedMode;
      if (Array.isArray(opts.seedTargets)) {
        state.pickerMultiItems = opts.seedTargets.slice(0, 12);
      }
      renderPickerMount();
      return;
    }
    loadSystemFontsOnce();
    state.pickerActive = true;
    state.pickerMode = requestedMode;
    state.pickerMultiItems = opts && Array.isArray(opts.seedTargets) ? opts.seedTargets.slice(0, 12) : [];
    state.pickerMarqueeRect = null;
    pickerMarqueeState = null;
    suppressNextPickerClickUntil = 0;
    setPickerCursorStyle(true, "crosshair");
    state.appearanceDraft = spCloneAppearance(state.settings.appearance);
    state.appearanceLivePreview = true;
    // Close modal visually without discarding appearanceLivePreview/appearanceDraft
    if (state.isOpen) {
      state.isOpen = false;
      state.appearanceDockedRight = false;
      if (modalMountEl) modalMountEl.innerHTML = "";
    }
    const isRu = state.locale !== "en";
    const toggleMultiTarget = (el) => {
      if (!el || el.nodeType !== 1 || isIgnoredPickerTarget(el)) return;
      const sel = typeof rv5BuildSmartSelector === "function" ? rv5BuildSmartSelector(el, "exact", doc) : "";
      if (!sel) return;
      const list = Array.isArray(state.pickerMultiItems) ? state.pickerMultiItems.slice() : [];
      const idx = list.findIndex((x) => x.selector === sel);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else if (list.length < 12) {
        const origTxt = translator && typeof translator.getOriginalTextForElement === "function" ? translator.getOriginalTextForElement(el) : "";
        const name = typeof rv5DescribeElementFriendly === "function" ? rv5DescribeElementFriendly(el, isRu, origTxt) : sel;
        list.push({ el, selector: sel, name });
      }
      state.pickerMultiItems = list;
      state.pickerMode = "multi";
      renderPickerMount();
    };
    const applyHoverTarget = (el, resetStack) => {
      if (!state.pickerActive || !el || isIgnoredPickerTarget(el)) return;
      if (typeof el.getBoundingClientRect !== "function") return;
      const rect = el.getBoundingClientRect();
      if (!rect || rect.width < 4 || rect.height < 4) return;
      pickerHoverEl = el;
      if (resetStack) pickerHoverChildStack = [];
      state.pickerHoverRect = rect;
      const origTxt = translator && typeof translator.getOriginalTextForElement === "function" ? translator.getOriginalTextForElement(el) : "";
      state.pickerHoverLabel = typeof rv5DescribeElementFriendly === "function" ? rv5DescribeElementFriendly(el, isRu, origTxt) : (el.tagName || "");
      updatePickerHighlightFast();
    };
    const flushHover = () => {
      pickerMoveRafId = 0;
      const el = pickerPendingEl;
      pickerPendingEl = null;
      applyHoverTarget(el, true);
    };
    pickerMoveHandler = (e) => {
      if (!state.pickerActive || !e) return;
      if (pickerMarqueeState) {
        const cx = Number(e.clientX) || 0;
        const cy = Number(e.clientY) || 0;
        const dist = Math.hypot(cx - pickerMarqueeState.startX, cy - pickerMarqueeState.startY);
        if (dist >= 10 || pickerMarqueeState.active) {
          pickerMarqueeState.active = true;
          const left = Math.min(pickerMarqueeState.startX, cx);
          const top = Math.min(pickerMarqueeState.startY, cy);
          const width = Math.abs(cx - pickerMarqueeState.startX);
          const height = Math.abs(cy - pickerMarqueeState.startY);
          const rect = { left, top, right: left + width, bottom: top + height, width, height };
          state.pickerMarqueeRect = rect;
          state.pickerHoverRect = null;
          if (state.pickerMode !== "multi") {
            state.pickerMultiItems = collectElementsInMarqueeRect(rect);
          }
          renderPickerMount();
          return;
        }
      }
      const resolved = resolvePickerTargetAtPoint(e);
      if (!resolved) return;
      pickerPendingEl = resolved;
      if (win && typeof win.requestAnimationFrame === "function") {
        if (!pickerMoveRafId) pickerMoveRafId = win.requestAnimationFrame(flushHover);
      } else {
        flushHover();
      }
    };
    pickerPointerDownHandler = (e) => {
      if (!state.pickerActive || !e || !e.target) return;
      if (isIgnoredPickerTarget(e.target)) return;
      if (typeof e.button === "number" && e.button !== 0) return;
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      if (typeof e.clientX === "number" && typeof e.clientY === "number") {
        pickerMarqueeState = { startX: e.clientX, startY: e.clientY, active: false };
      }
    };
    pickerPointerUpHandler = (e) => {
      if (!state.pickerActive || !pickerMarqueeState) return;
      const mq = pickerMarqueeState;
      pickerMarqueeState = null;
      if (!mq.active) {
        state.pickerMarqueeRect = null;
        return;
      }
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      suppressNextPickerClickUntil = Date.now() + 260;
      const cx = typeof e.clientX === "number" ? e.clientX : mq.startX;
      const cy = typeof e.clientY === "number" ? e.clientY : mq.startY;
      const left = Math.min(mq.startX, cx);
      const top = Math.min(mq.startY, cy);
      const width = Math.abs(cx - mq.startX);
      const height = Math.abs(cy - mq.startY);
      const rect = { left, top, right: left + width, bottom: top + height, width, height };
      state.pickerMarqueeRect = null;
      const hits = collectElementsInMarqueeRect(rect);
      if (state.pickerMode === "multi") {
        const merged = Array.isArray(state.pickerMultiItems) ? state.pickerMultiItems.slice() : [];
        const seen = new Set(merged.map((x) => x.selector));
        for (let hi = 0; hi < hits.length && merged.length < 12; hi += 1) {
          if (!seen.has(hits[hi].selector)) {
            seen.add(hits[hi].selector);
            merged.push(hits[hi]);
          }
        }
        state.pickerMultiItems = merged;
        renderPickerMount();
        return;
      }
      if (hits.length > 0) {
        stopElementPicker();
        selectGroupForInspector(hits);
      } else {
        state.pickerMultiItems = [];
        renderPickerMount();
        showToast(isRu ? "В выделенной области нет подходящих элементов" : "No elements inside selected region", false);
      }
    };
    pickerClickHandler = (e) => {
      if (!state.pickerActive || !e) return;
      if (e.target && isIgnoredPickerTarget(e.target)) return;
      if (suppressNextPickerClickUntil && Date.now() < suppressNextPickerClickUntil) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        return;
      }
      const picked = (pickerHoverEl && pickerHoverChildStack.length > 0)
        ? pickerHoverEl
        : (resolvePickerTargetAtPoint(e) || pickerHoverEl || e.target);
      if (!picked || isIgnoredPickerTarget(picked)) return;
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      if (state.pickerMode === "multi" || e.ctrlKey || e.metaKey || e.shiftKey) {
        toggleMultiTarget(picked);
        return;
      }
      const childStackCopy = pickerHoverChildStack.slice();
      stopElementPicker();
      selectElementForInspector(picked, { childStack: childStackCopy });
    };
    pickerKeyHandler = (e) => {
      if (!state.pickerActive || !e) return;
      if (e.key === "Enter" && Array.isArray(state.pickerMultiItems) && state.pickerMultiItems.length > 0) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
        const itemsCopy = state.pickerMultiItems.slice();
        stopElementPicker();
        selectGroupForInspector(itemsCopy);
        return;
      }
      if (e.key === "ArrowUp") {
        const cur = pickerHoverEl || pickerPendingEl;
        const p = cur && cur.parentElement;
        if (p && p !== doc.body && p !== doc.documentElement && !isIgnoredPickerTarget(p)) {
          if (typeof e.preventDefault === "function") e.preventDefault();
          if (typeof e.stopPropagation === "function") e.stopPropagation();
          pickerHoverChildStack.push(cur);
          applyHoverTarget(p, false);
        }
      } else if (e.key === "ArrowDown") {
        if (pickerHoverChildStack.length > 0) {
          if (typeof e.preventDefault === "function") e.preventDefault();
          if (typeof e.stopPropagation === "function") e.stopPropagation();
          const ch = pickerHoverChildStack.pop();
          applyHoverTarget(ch, false);
        }
      }
    };
    pickerWheelHandler = (e) => {
      if (!state.pickerActive || !e) return;
      if (e.target && isIgnoredPickerTarget(e.target)) return;
      const dy = Number(e.deltaY) || 0;
      if (!dy) return;
      if (dy < 0) {
        const cur = pickerHoverEl || pickerPendingEl;
        const p = cur && cur.parentElement;
        if (p && p !== doc.body && p !== doc.documentElement && !isIgnoredPickerTarget(p)) {
          if (typeof e.preventDefault === "function") e.preventDefault();
          if (typeof e.stopPropagation === "function") e.stopPropagation();
          pickerHoverChildStack.push(cur);
          applyHoverTarget(p, false);
        }
      } else if (pickerHoverChildStack.length > 0) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
        const ch = pickerHoverChildStack.pop();
        applyHoverTarget(ch, false);
      }
    };
    if (doc && typeof doc.addEventListener === "function") {
      doc.addEventListener("mousemove", pickerMoveHandler, true);
      doc.addEventListener("pointerdown", pickerPointerDownHandler, true);
      doc.addEventListener("pointerup", pickerPointerUpHandler, true);
      doc.addEventListener("click", pickerClickHandler, true);
      doc.addEventListener("keydown", pickerKeyHandler, true);
      doc.addEventListener("wheel", pickerWheelHandler, { capture: true, passive: false });
    }
    renderPickerMount();
  }

  function upsertSelectedElementStyle(prop, rawVal, opts) {
    if (!state.pickerSelected || !state.pickerSelected.selector) return;
    const o = opts && typeof opts === "object" ? opts : {};
    if (o.skipUndo) {
      if (!inspectorDragUndoCaptured) {
        pushAppearanceUndo();
        inspectorDragUndoCaptured = true;
      }
    } else {
      inspectorDragUndoCaptured = false;
      pushAppearanceUndo();
    }
    const sel = state.pickerSelected;
    const list = Array.isArray(state.appearanceDraft.elementOverrides) ? state.appearanceDraft.elementOverrides.slice() : [];
    let idx = list.findIndex((x) => x.id === sel.overrideId || x.selector === sel.selector);
    let item = idx >= 0 ? Object.assign({}, list[idx], { styles: Object.assign({}, list[idx].styles) }) : {
      id: sel.overrideId || ("ov-" + Date.now()),
      name: sel.name || sel.selector,
      selector: sel.selector,
      zone: sel.zone || "",
      scope: sel.scope || "exact",
      enabled: true,
      styles: {},
    };
    sel.overrideId = item.id;
    if (prop === "bgOpacity" && !item.styles.bgColor && rawVal > 0 && rawVal < 100) {
      item.styles.bgColor = (sel.computed && sel.computed.bgColor) || (detectAppTheme() === "light" ? "#fbfaf6" : "#262624");
    }
    item.styles[prop] = rawVal;
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    state.appearanceDraft.elementOverrides = list;
    inspectorLiveEditUntil = Date.now() + 950;
    applyThemeFastToHost(state.appearanceDraft);
    if (o.liveOnly) {
      scheduleInspectorPersist();
    } else {
      if (inspSaveTimer && win && typeof win.clearTimeout === "function") {
        win.clearTimeout(inspSaveTimer);
        inspSaveTimer = null;
      }
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
    }
    if (!o.preserveDom) {
      renderPickerMount();
    } else {
      updateInspectorMatchBoxesFast();
    }
  }

  function triggerQuotaSyncClick() {
    const scrapedImmediately = scrapeDomQuotaSnapshot(true);
    invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
      if (!state.destroyed && qs) {
        applyQuotaSummary(qs);
      }
    });
    if (scrapedImmediately) {
      setToast(state.locale !== "en" ? "Лимиты синхронизированы" : "Limits synced", false);
      return;
    }
    // When idle and user explicitly clicks Refresh (↻), briefly open & read the native model-selector popover to sync exact live % from Antigravity
    if (!quotaSilentSyncInflight && !isAgentRunningNow() && doc && typeof doc.querySelector === "function") {
      const trig = doc.querySelector('[data-testid="model-selector-trigger"]');
      const trigDisabled = Boolean(
        !trig ||
        trig.disabled ||
        (typeof trig.getAttribute === "function" && (trig.getAttribute("disabled") !== null || trig.getAttribute("aria-disabled") === "true" || trig.getAttribute("data-disabled") !== null))
      );
      const alreadyOpen = Boolean(
        trig && typeof trig.getAttribute === "function" && (trig.getAttribute("aria-expanded") === "true" || trig.getAttribute("data-state") === "open")
      );
      if (!trigDisabled && !alreadyOpen && typeof trig.click === "function") {
        quotaSilentSyncInflight = true;
        try { trig.click(); } catch (_e) {}
        scheduleQuotaDomScrapeBurst();
        const finishSync = () => {
          quotaSilentSyncInflight = false;
          if (state.destroyed) return;
          const gotIt = scrapeDomQuotaSnapshot(true);
          try {
            const KeyEv = (win && win.KeyboardEvent) || (typeof KeyboardEvent !== "undefined" ? KeyboardEvent : null);
            if (KeyEv && typeof doc.dispatchEvent === "function") {
              doc.dispatchEvent(new KeyEv("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true }));
            } else if (typeof trig.click === "function") {
              trig.click();
            }
          } catch (_e) {}
          if (gotIt) {
            setToast(state.locale !== "en" ? "Лимиты синхронизированы с Antigravity" : "Limits synced with Antigravity", false);
          }
        };
        if (win && typeof win.setTimeout === "function") {
          win.setTimeout(() => {
            if (!state.destroyed && scrapeDomQuotaSnapshot(true)) {
              finishSync();
            } else {
              win.setTimeout(finishSync, 260);
            }
          }, 220);
        } else {
          finishSync();
        }
        return;
      }
    }
    // Fallback: check if View Usage button exists in DOM to trigger native refresh if user has no snapshot
    if (doc && typeof doc.querySelectorAll === "function") {
      const qs = state.quotaSummary;
      const fams = qs && qs.families ? qs.families : null;
      const gemRem = fams && fams.gemini ? fams.gemini.fiveHourRem : null;
      const claRem = fams && fams.claudeGpt ? fams.claudeGpt.fiveHourRem : null;
      const hasSnap = Boolean(gemRem !== null || claRem !== null);
      if (!hasSnap) {
        const btns = doc.querySelectorAll("button, a");
        for (let i = 0; i < btns.length; i += 1) {
          const b = btns[i];
          if (!b || (hostEl && hostEl.contains(b))) continue;
          const txt = (b.textContent || "").trim().toLowerCase();
          if (txt === "посмотреть использование" || txt === "view usage") {
            try { b.click(); } catch (_e) {}
            break;
          }
        }
      }
    }
  }

  function handleHotkeyAction(action) {
    if (!action || state.destroyed) return;
    if (action === "toggleZenUi") {
      saveSettingsPatch({ zenMode: !state.settings.zenMode });
      return;
    }
    if (action === "togglePicker") {
      startElementPicker();
      return;
    }
    if (action === "toggleLimitsWidget") {
      const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : state.settings.limitsWidget;
      saveSettingsPatch({ limitsWidget: Object.assign({}, lw, { enabled: !lw.enabled }) });
      return;
    }
    if (action === "openAnnotator") {
      openAnnotator();
      return;
    }
    if (action === "toggleDictation") {
      const optCtrl = ensureRudexOptimizer();
      if (optCtrl) {
        const res = optCtrl.triggerNativeDictation(hostEl);
        if (!res.triggered) {
          setToast(state.locale !== "en" ? "Кнопка диктовки не найдена в текущем чате" : "Dictation button not found in current chat", true);
        }
      }
      return;
    }
    if (action === "toggleAgentPopover") {
      state.agentPopoverOpen = !state.agentPopoverOpen;
      renderChatDockMount();
      return;
    }
    if (action === "cycleAgentPreset" && typeof RUDEX_AGENT_PRESETS !== "undefined") {
      const curId = state.chatAgentProfile && state.chatAgentProfile.enabled ? state.chatAgentProfile.presetId : "default";
      const idx = RUDEX_AGENT_PRESETS.findIndex((p) => p.id === curId);
      const next = RUDEX_AGENT_PRESETS[(idx + 1) % RUDEX_AGENT_PRESETS.length];
      if (next) saveChatAgentProfile(Object.assign({}, next.profile, { applyToNewChats: Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats) }));
      return;
    }
    if (action === "cycleWallpaper") {
      const app = spCloneAppearance(state.settings.appearance);
      const grads = spGetGradientPresets();
      if (state.mediaLibrary && state.mediaLibrary.length > 0 && (app.wallpaper.type === "image" || app.wallpaper.type === "video")) {
        const curIdx = state.mediaLibrary.findIndex((m) => m.fileName === app.wallpaper.mediaFile);
        const nxt = state.mediaLibrary[(curIdx + 1) % state.mediaLibrary.length];
        if (nxt) {
          app.wallpaper.mediaFile = nxt.fileName || "";
          app.wallpaper.mediaUrl = nxt.mediaUrl || nxt.url || "";
          app.wallpaper.mediaMime = nxt.mime || "";
          const isVid = nxt.kind === "video" || nxt.type === "video" || String(nxt.mime || "").startsWith("video/") || /\.(?:mp4|webm|mov)$/i.test(nxt.fileName || "");
          app.wallpaper.type = isVid ? "video" : "image";
        }
      } else {
        const curIdx = grads.findIndex((g) => g.id === app.wallpaper.gradientPreset);
        const nxt = grads[(curIdx + 1) % grads.length];
        app.wallpaper.type = "gradient";
        app.wallpaper.gradientPreset = nxt.id;
        app.wallpaper.gradColors = nxt.colors.slice();
        app.wallpaper.gradAngle = nxt.angle;
      }
      state.appearanceDraft = spCloneAppearance(app);
      saveSettingsPatch({ appearance: app });
      return;
    }
    if (action === "toggleWallpaper") {
      const app = spCloneAppearance(state.settings.appearance);
      if (app.wallpaper.type === "none") {
        if (app.wallpaper.mediaUrl) {
          const isVid = String(app.wallpaper.mediaMime || "").startsWith("video/") || /\.(?:mp4|webm|mov)$/i.test(app.wallpaper.mediaFile || app.wallpaper.mediaUrl || "");
          app.wallpaper.type = isVid ? "video" : "image";
        } else {
          app.wallpaper.type = "gradient";
        }
      } else {
        app.wallpaper.type = "none";
      }
      state.appearanceDraft = spCloneAppearance(app);
      saveSettingsPatch({ appearance: app });
      return;
    }
    if (action === "cycleTheme") {
      const presets = spGetThemePresets();
      const app = spCloneAppearance(state.settings.appearance);
      const idx = presets.findIndex((p) => p.id === app.presetId);
      const next = presets[(idx + 1) % presets.length];
      if (next) {
        app.presetId = next.id;
        if (next.vars) {
          app.accentColor = next.vars.accentColor;
          app.canvasBg = next.vars.canvasBg;
          app.cardBg = next.vars.cardBg;
        }
        state.appearanceDraft = spCloneAppearance(app);
        saveSettingsPatch({ appearance: app });
      }
      return;
    }
    if (action === "toggleDarkLight") {
      const app = spCloneAppearance(state.settings.appearance);
      const nextId = app.presetId === "claude-code-light" ? "claude-code-dark" : "claude-code-light";
      const found = spFindThemePreset(nextId);
      if (found) {
        app.presetId = found.id;
        app.accentColor = found.vars.accentColor;
        app.canvasBg = found.vars.canvasBg;
        app.cardBg = found.vars.cardBg;
        state.appearanceDraft = spCloneAppearance(app);
        saveSettingsPatch({ appearance: app });
      }
      return;
    }
    if (action === "openTabAgent") { setOpen(true, { tab: "persona" }); return; }
    if (action === "openTabDesign") { setOpen(true, { tab: "appearance" }); return; }
    if (action === "openTabLimits") {
      setOpen(true, { tab: "widgets", widgetSub: "limits" });
      return;
    }
    if (action === "openTabWorkshop") { setOpen(true, { tab: "workshop" }); return; }
    if (action === "emergencyResetOverrides") {
      const app = spCloneAppearance(state.settings.appearance);
      app.overridesPaused = !app.overridesPaused;
      state.appearanceDraft = spCloneAppearance(app);
      saveSettingsPatch({ appearance: app });
    }
  }

  function selectPreset(id) {
    let body = null;
    const customs = state.settings.customPresets || [];
    for (let i = 0; i < customs.length; i += 1) {
      if (customs[i].id === id) { body = customs[i].body; break; }
    }
    if (body === null) return;
    state.chatPersona.activePreset = id;
    state.draftPersonaText = body;
    if (state.chatPersona.enabled && body.trim()) {
      persistPersona(true);
    } else {
      state.draftDirty = true;
      renderStructure();
    }
  }

  function persistPersona(enabledOverride) {
    const nextEnabled = typeof enabledOverride === "boolean" ? enabledOverride : state.chatPersona.enabled;
    const presetId = state.chatPersona.activePreset || "custom";
    const textVal = state.draftPersonaText;
    const targetChatKey = state.activeChatKey || "__new__";
    const targetChatTitle = state.activeChatTitle || "";
    const tr = t();
    const saveSeq = ++state.personaSaveSeq;

    if (targetChatKey === "__new__") {
      state.newChatDraftPersona = nextEnabled && textVal.trim()
        ? { personaEnabled: true, personaActivePreset: presetId, personaText: textVal, personaStrict: state.chatPersona.strict !== false }
        : null;
    }

    return invokeIpc("agy-studio:save-persona", {
      chatKey: targetChatKey,
      title: targetChatTitle,
      personaEnabled: nextEnabled,
      personaText: textVal,
      personaActivePreset: presetId,
      strict: state.chatPersona.strict !== false,
      customPresets: state.settings.customPresets || [],
    }).then((res) => {
      if (state.destroyed) return res;
      if (saveSeq === state.personaSaveSeq) {
        state.draftDirty = false;
      }
      if (res && res.state) applyRemoteState(res.state, false);
      if (res && res.chat && targetChatKey === state.activeChatKey && saveSeq === state.personaSaveSeq) {
        state.chatPersona = {
          enabled: Boolean(res.chat.personaEnabled),
          activePreset: res.chat.personaActivePreset || presetId,
          text: typeof res.chat.personaText === "string" ? res.chat.personaText : textVal,
          strict: typeof res.chat.personaStrict === "boolean" ? res.chat.personaStrict : state.chatPersona.strict !== false,
        };
        if (typeof res.rulePath === "string" && res.rulePath) state.personaFilePath = res.rulePath;
        renderStructure();
      }
      if (res && res.ok === false) {
        setToast(res.error === "EXCEEDS_BYTE_LIMIT" ? tr.personaTooLargeErr : (res.error || tr.personaWriteErr), true);
      } else if (nextEnabled) {
        setToast(res && res.exists ? tr.personaSavedMsg : tr.personaWriteErr, !(res && res.exists));
      } else {
        setToast(textVal.trim() ? tr.personaDisabledMsg : tr.personaClearedMsg, false);
      }
      return res;
    });
  }

  function markAppearanceDirty() {
    state.appearanceDirty = true;
    state.appearanceLivePreview = true;
    applyThemeFastToHost(state.appearanceDraft);
    if (modalMountEl && typeof modalMountEl.querySelector === "function") {
      const applyBtn = modalMountEl.querySelector('[data-action="apply-appearance"]');
      if (applyBtn && applyBtn.classList) applyBtn.classList.add("btn-primary");
      const toastEl = modalMountEl.querySelector('.drawer-sticky-footer [data-role="toast"]');
      if (toastEl && !state.toastMsg) {
        toastEl.className = "studio-dirty-pill";
        toastEl.textContent = t().appDirtyBadge;
      }
      const undoBtn = modalMountEl.querySelector('[data-role="appUndoBtn"]');
      const redoBtn = modalMountEl.querySelector('[data-role="appRedoBtn"]');
      if (undoBtn) undoBtn.disabled = state.appearanceUndoStack.length === 0;
      if (redoBtn) redoBtn.disabled = state.appearanceRedoStack.length === 0;
    }
  }

  function updateGreetingLivePreview() {
    if (!modalMountEl) return;
    const tr = t();
    const isRu = state.locale !== "en";
    const gd = spNormalizeGreeting(state.greetingDraft);
    const autoName = (translator && typeof translator.getCapturedUserName === "function" ? translator.getCapturedUserName() : "") || (isRu ? "Иван" : "Ivan");
    const preview = resolvePreviewGreeting(gd);
    setLiveSlot(modalMountEl, '[data-live="greetPreviewTitle"]', gd.enabled ? preview.title : (isRu ? `Привет, ${autoName}! Что создадим сегодня?` : `Hey ${autoName}, what should we build today?`), false);
    const subEl = modalMountEl.querySelector('[data-live="greetPreviewSub"]');
    if (subEl) {
      subEl.textContent = preview.subtitle;
      subEl.style.display = gd.enabled && preview.subtitle ? "" : "none";
    }
    setLiveSlot(modalMountEl, '[data-live="greetPreviewComposer"]', gd.enabled && gd.placeholder.trim() ? gd.placeholder.trim() : tr.greetPreviewInputFallback, false);
  }

  function handleActionClick(targetEl) {
    if (!targetEl || typeof targetEl.closest !== "function") return;
    const actionEl = targetEl.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-action");
    const tr = t();

    if (action === "backdrop-close") {
      if (targetEl === actionEl) setOpen(false);
      return;
    }
    if (action === "close-modal") { setOpen(false); return; }
    // === RUDEX 5.0 ACTIONS ===
    if (action === "clear-search") {
      state.settingsSearchQuery = "";
      if (modalMountEl) {
        const inputs = modalMountEl.querySelectorAll('[data-role="settingsSearch"]');
        for (let i = 0; i < inputs.length; i += 1) inputs[i].value = "";
        const hitsBoxes = modalMountEl.querySelectorAll('[data-role="searchHits"]');
        for (let i = 0; i < hitsBoxes.length; i += 1) hitsBoxes[i].innerHTML = "";
        const clearBtns = modalMountEl.querySelectorAll('[data-role="searchClear"]');
        for (let i = 0; i < clearBtns.length; i += 1) {
          if (clearBtns[i].classList) clearBtns[i].classList.remove("is-shown");
        }
      }
      return;
    }
    if (action === "set-theme-filter") {
      const f = actionEl.getAttribute("data-val") || "all";
      state.themeModeFilter = f === "dark" || f === "light" ? f : "all";
      renderStructure();
      return;
    }
    if (action === "set-agent-subtab") {
      const s = actionEl.getAttribute("data-val") || "tools";
      state.agentSubTab = s === "persona" || s === "presets" ? s : "tools";
      renderStructure();
      return;
    }
    if (action === "jump-search-hit") {
      const tab = actionEl.getAttribute("data-tab") || "appearance";
      const appSub = actionEl.getAttribute("data-app-sub") || "";
      const setSub = actionEl.getAttribute("data-set-sub") || "";
      const widgetSub = actionEl.getAttribute("data-widget-sub") || "";
      const agentSub = actionEl.getAttribute("data-agent-sub") || "";
      state.settingsSearchQuery = "";
      setOpen(true, {
        tab,
        appSubTab: appSub || undefined,
        subTab: setSub || undefined,
        widgetSub: widgetSub || undefined,
        agentSub: agentSub || undefined,
      });
      return;
    }
    if (action === "set-border-preset") {
      const val = actionEl.getAttribute("data-val") || "crisp";
      pushAppearanceUndo();
      state.appearanceDraft.borderPreset = val === "airy" || val === "contrast" ? val : "crisp";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "undo-appearance") {
      if (state.appearanceUndoStack.length > 0) {
        state.appearanceRedoStack.push(JSON.stringify(state.appearanceDraft));
        const prevJson = state.appearanceUndoStack.pop();
        try {
          state.appearanceDraft = spCloneAppearance(JSON.parse(prevJson));
          markAppearanceDirty();
          saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
        } catch (_e) {}
      }
      return;
    }
    if (action === "redo-appearance") {
      if (state.appearanceRedoStack.length > 0) {
        state.appearanceUndoStack.push(JSON.stringify(state.appearanceDraft));
        const nextJson = state.appearanceRedoStack.pop();
        try {
          state.appearanceDraft = spCloneAppearance(JSON.parse(nextJson));
          markAppearanceDirty();
          saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
        } catch (_e) {}
      }
      return;
    }
    if (action === "start-element-picker") { startElementPicker(); return; }
    if (action === "start-region-picker") { startElementPicker({ mode: "region" }); return; }
    if (action === "picker-set-mode" && state.pickerActive) {
      const m = actionEl.getAttribute("data-val");
      state.pickerMode = (m === "region" || m === "multi") ? m : "single";
      if (state.pickerMode !== "multi") state.pickerMultiItems = [];
      renderPickerMount();
      return;
    }
    if (action === "picker-commit-multi" && state.pickerActive) {
      const itemsCopy = Array.isArray(state.pickerMultiItems) ? state.pickerMultiItems.slice() : [];
      stopElementPicker();
      if (itemsCopy.length > 0) selectGroupForInspector(itemsCopy);
      return;
    }
    if (action === "stop-element-picker") { stopElementPicker(); return; }
    if (action === "close-element-inspector") {
      stopInspectorDragMove(true);
      flushInspectorPersist();
      state.pickerSelected = null;
      inspectorDragUndoCaptured = false;
      if (!state.isOpen && !state.pickerActive) state.appearanceLivePreview = false;
      renderPickerMount();
      return;
    }
    if (action === "close-model-usage-pop") { state.usagePopOpen = false; renderModelUsagePopover(); return; }
    if (action === "open-native-usage-settings") { openNativeAntigravityUsageSettings(); return; }
    if (action === "toggle-overrides-paused") {
      pushAppearanceUndo();
      state.appearanceDraft.overridesPaused = !state.appearanceDraft.overridesPaused;
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      return;
    }
    if (action === "edit-ui-zone" && typeof RUDEX_UI_ZONES !== "undefined") {
      loadSystemFontsOnce();
      const zid = actionEl.getAttribute("data-zone-id");
      const zone = RUDEX_UI_ZONES.find((z) => z.id === zid);
      if (zone) {
        const existing = (state.appearanceDraft.elementOverrides || []).find((o) => o.zone === zone.id || o.selector === zone.selector);
        let liveEl = null;
        if (doc && typeof doc.querySelectorAll === "function") {
          try {
            const matches = doc.querySelectorAll(zone.selector);
            for (let mi = 0; matches && mi < matches.length; mi += 1) {
              if (matches[mi] && !isIgnoredPickerTarget(matches[mi])) {
                liveEl = matches[mi];
                break;
              }
            }
          } catch (_e) {}
        }
        const pEl = liveEl ? liveEl.parentElement : null;
        const matchedEls = querySelectedElements(zone.selector);
        state.pickerSelectedEl = liveEl;
        state.pickerChildStack = [];
        state.pickerSelected = {
          overrideId: existing ? existing.id : ("zone-" + zone.id),
          name: state.locale !== "en" ? zone.nameRu : zone.nameEn,
          selector: zone.selector,
          zone: zone.id,
          scope: "similar",
          canToggleScope: false,
          canSelectParent: Boolean(pEl && pEl !== doc.body && pEl !== doc.documentElement && !isIgnoredPickerTarget(pEl)),
          canSelectChild: false,
          renameable: false,
          origText: "",
          groupTargets: [],
          matchCount: matchedEls.length || 1,
          computed: readElementComputedMetrics(liveEl || zone.selector),
        };
        if (state.isOpen && state.activeTab === "appearance" && !state.appearanceDockedRight) {
          state.appearanceDockedRight = true;
          renderStructure();
        }
        renderPickerMount();
      }
      return;
    }
    if (action === "edit-override-item") {
      loadSystemFontsOnce();
      const oid = actionEl.getAttribute("data-id");
      const ov = (state.appearanceDraft.elementOverrides || []).find((o) => o.id === oid);
      if (ov) {
        let liveEl = null;
        if (doc && typeof doc.querySelectorAll === "function") {
          try {
            const matches = doc.querySelectorAll(ov.selector);
            for (let mi = 0; matches && mi < matches.length; mi += 1) {
              if (matches[mi] && !isIgnoredPickerTarget(matches[mi])) {
                liveEl = matches[mi];
                break;
              }
            }
          } catch (_e) {}
        }
        const pEl = liveEl ? liveEl.parentElement : null;
        const isRu = state.locale !== "en";
        const splitSels = splitTopLevelCssSelectors(ov.selector);
        const groupTargets = (ov.scope === "group" || splitSels.length >= 2)
          ? splitSels.map((s) => {
              const hit = querySelectedElements(s)[0] || null;
              const origTxt = hit && translator && typeof translator.getOriginalTextForElement === "function" ? translator.getOriginalTextForElement(hit) : "";
              const lbl = hit && typeof rv5DescribeElementFriendly === "function" ? rv5DescribeElementFriendly(hit, isRu, origTxt) : s;
              return { selector: s, name: lbl };
            })
          : [];
        const matchedEls = querySelectedElements(ov.selector);
        state.pickerSelectedEl = liveEl;
        state.pickerChildStack = [];
        state.pickerSelected = {
          overrideId: ov.id,
          name: ov.name || ov.selector,
          selector: ov.selector,
          zone: ov.zone || "",
          scope: groupTargets.length >= 2 ? "group" : (ov.scope || "exact"),
          canToggleScope: false,
          canSelectParent: groupTargets.length < 2 && Boolean(pEl && pEl !== doc.body && pEl !== doc.documentElement && !isIgnoredPickerTarget(pEl)),
          canSelectChild: false,
          renameable: false,
          origText: "",
          groupTargets,
          matchCount: matchedEls.length || (groupTargets.length || 1),
          computed: readElementComputedMetrics(liveEl || ov.selector),
        };
        if (state.isOpen && state.activeTab === "appearance" && !state.appearanceDockedRight) {
          state.appearanceDockedRight = true;
          renderStructure();
        }
        renderPickerMount();
      }
      return;
    }
    if (action === "toggle-override-item") {
      pushAppearanceUndo();
      const oid = actionEl.getAttribute("data-id");
      state.appearanceDraft.elementOverrides = (state.appearanceDraft.elementOverrides || []).map((o) =>
        o.id === oid ? Object.assign({}, o, { enabled: o.enabled === false }) : o
      );
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      return;
    }
    if (action === "delete-override-item") {
      pushAppearanceUndo();
      const oid = actionEl.getAttribute("data-id");
      state.appearanceDraft.elementOverrides = (state.appearanceDraft.elementOverrides || []).filter((o) => o.id !== oid);
      if (state.pickerSelected && state.pickerSelected.overrideId === oid) {
        stopInspectorDragMove(true);
        state.pickerSelected = null;
      }
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      renderPickerMount();
      return;
    }
    if (action === "clear-all-overrides") {
      pushAppearanceUndo();
      stopInspectorDragMove(true);
      state.appearanceDraft.elementOverrides = [];
      state.pickerSelected = null;
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      renderPickerMount();
      return;
    }
    if (action === "inspector-set-scope" && state.pickerSelected) {
      const sc = actionEl.getAttribute("data-val") === "similar" ? "similar" : "exact";
      const nextSel = sc === "similar" ? state.pickerSelected.similarSelector : state.pickerSelected.exactSelector;
      const oldId = state.pickerSelected.overrideId;
      state.pickerSelected.scope = sc;
      state.pickerSelected.selector = nextSel;
      state.pickerSelected.matchCount = querySelectedElements(nextSel).length || 1;
      const list = Array.isArray(state.appearanceDraft.elementOverrides) ? state.appearanceDraft.elementOverrides.slice() : [];
      const idx = oldId ? list.findIndex((o) => o.id === oldId) : -1;
      if (idx >= 0 && nextSel) {
        pushAppearanceUndo();
        list[idx] = Object.assign({}, list[idx], { scope: sc, selector: nextSel });
        state.appearanceDraft.elementOverrides = list;
        applyThemeFastToHost(state.appearanceDraft);
        saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      } else {
        const match = list.find((o) => o.selector === nextSel);
        state.pickerSelected.overrideId = match ? match.id : "";
      }
      renderPickerMount();
      return;
    }
    if (action === "inspector-add-element" && state.pickerSelected) {
      const sel = state.pickerSelected;
      const seed = Array.isArray(sel.groupTargets) && sel.groupTargets.length >= 2
        ? sel.groupTargets.map((gt) => ({ el: querySelectedElements(gt.selector)[0] || null, selector: gt.selector, name: gt.name }))
        : [{ el: state.pickerSelectedEl || querySelectedElements(sel.selector)[0] || null, selector: sel.selector, name: sel.name }];
      startElementPicker({ mode: "multi", seedTargets: seed });
      return;
    }
    if (action === "inspector-remove-group-target" && state.pickerSelected && Array.isArray(state.pickerSelected.groupTargets)) {
      const idxToDrop = parseInt(actionEl.getAttribute("data-idx"), 10);
      const curTargets = state.pickerSelected.groupTargets.slice();
      if (Number.isFinite(idxToDrop) && idxToDrop >= 0 && idxToDrop < curTargets.length) {
        curTargets.splice(idxToDrop, 1);
        const sel = state.pickerSelected;
        const isRu = state.locale !== "en";
        const list = Array.isArray(state.appearanceDraft.elementOverrides) ? state.appearanceDraft.elementOverrides.slice() : [];
        const ovIdx = list.findIndex((o) => o.id === sel.overrideId || o.selector === sel.selector);
        if (curTargets.length === 0) {
          stopInspectorDragMove(true);
          state.pickerSelected = null;
          renderPickerMount();
          return;
        }
        const nextSel = curTargets.map((t) => t.selector).join(", ");
        const nextScope = curTargets.length >= 2 ? "group" : "exact";
        const nextName = curTargets.length >= 2
          ? (isRu ? `Группа (${curTargets.length}): ` : `Group (${curTargets.length}): `) + curTargets.slice(0, 2).map((t) => t.name).join(" + ") + (curTargets.length > 2 ? "…" : "")
          : curTargets[0].name;
        const nextFirstEl = querySelectedElements(curTargets[0].selector)[0] || null;
        if (ovIdx >= 0) {
          pushAppearanceUndo();
          list[ovIdx] = Object.assign({}, list[ovIdx], { selector: nextSel, scope: nextScope, name: nextName });
          state.appearanceDraft.elementOverrides = list;
          applyThemeFastToHost(state.appearanceDraft);
          saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
        }
        state.pickerSelectedEl = nextFirstEl;
        sel.selector = nextSel;
        sel.exactSelector = nextSel;
        sel.similarSelector = nextSel;
        sel.scope = nextScope;
        sel.name = nextName;
        sel.groupTargets = curTargets.length >= 2 ? curTargets : [];
        sel.matchCount = querySelectedElements(nextSel).length || curTargets.length;
        sel.computed = readElementComputedMetrics(nextFirstEl || nextSel);
        renderPickerMount();
      }
      return;
    }
    if (action === "inspector-set-nudge-step") {
      const nextStep = Math.round(Number(actionEl.getAttribute("data-val")) || 4);
      if ([1, 4, 16, 40].includes(nextStep)) {
        state.pickerNudgeStep = nextStep;
        renderPickerMount();
      }
      return;
    }
    if (action === "inspector-set-align" && state.pickerSelected) {
      const rawAl = actionEl.getAttribute("data-val") || "";
      const nextAl = rawAl === "left" || rawAl === "center" || rawAl === "right" ? rawAl : "";
      upsertSelectedElementStyle("align", nextAl);
      return;
    }
    if (action === "inspector-toggle-drag-move" && state.pickerSelected) {
      if (state.inspectorDragMoveActive) stopInspectorDragMove();
      else startInspectorDragMove();
      return;
    }
    if (action === "inspector-select-parent" && state.pickerSelectedEl) {
      const p = state.pickerSelectedEl.parentElement;
      if (p && p !== doc.body && p !== doc.documentElement && !isIgnoredPickerTarget(p)) {
        const stack = Array.isArray(state.pickerChildStack) ? state.pickerChildStack.slice() : [];
        stack.push(state.pickerSelectedEl);
        selectElementForInspector(p, { childStack: stack });
      }
      return;
    }
    if (action === "inspector-select-child" && Array.isArray(state.pickerChildStack) && state.pickerChildStack.length > 0) {
      const stack = state.pickerChildStack.slice();
      const ch = stack.pop();
      if (ch && ch.nodeType === 1) {
        selectElementForInspector(ch, { childStack: stack });
      }
      return;
    }
    if (action === "inspector-nudge-offset" && state.pickerSelected) {
      const axis = actionEl.getAttribute("data-axis") || "";
      const delta = Math.round(Number(actionEl.getAttribute("data-delta")) || 0);
      const ov = (state.appearanceDraft.elementOverrides || []).find((o) => o.id === state.pickerSelected.overrideId || o.selector === state.pickerSelected.selector);
      const st = ov && ov.styles ? ov.styles : {};
      const nowNudge = Date.now();
      const isRapidBurst = nowNudge - inspectorLastNudgeAt < 450;
      inspectorLastNudgeAt = nowNudge;
      if (!isRapidBurst) inspectorDragUndoCaptured = false;
      if (axis === "reset") {
        upsertSelectedElementStyle("offsetX", 0, { preserveDom: true, liveOnly: true, skipUndo: false });
        upsertSelectedElementStyle("offsetY", 0, { preserveDom: true, liveOnly: true, skipUndo: true });
        syncInspectorOffsetInputsInPlace(0, 0);
      } else if (axis === "offsetX" || axis === "offsetY") {
        const cur = Number.isFinite(Number(st[axis])) ? Math.round(Number(st[axis])) : 0;
        const nextVal = Math.max(-800, Math.min(800, cur + delta));
        upsertSelectedElementStyle(axis, nextVal, { preserveDom: true, liveOnly: true, skipUndo: isRapidBurst });
        if (axis === "offsetX") syncInspectorOffsetInputsInPlace(nextVal, undefined);
        else syncInspectorOffsetInputsInPlace(undefined, nextVal);
      }
      if (win && typeof win.requestAnimationFrame === "function") {
        win.requestAnimationFrame(() => updateInspectorMatchBoxesFast());
      }
      return;
    }
    if (action === "inspector-clear-style" && state.pickerSelected) {
      const prop = actionEl.getAttribute("data-prop");
      if (prop) {
        if (prop === "paddingY" || prop === "paddingX") {
          const ov = (state.appearanceDraft.elementOverrides || []).find((o) => o.id === state.pickerSelected.overrideId || o.selector === state.pickerSelected.selector);
          const st = ov && ov.styles ? ov.styles : null;
          if (st && Number(st.padding) >= 0) {
            const other = prop === "paddingY" ? "paddingX" : "paddingY";
            if (!(Number(st[other]) >= 0)) {
              upsertSelectedElementStyle(other, Math.round(Number(st.padding)), { preserveDom: true, liveOnly: true, skipUndo: true });
            }
            upsertSelectedElementStyle("padding", -1, { preserveDom: true, liveOnly: true, skipUndo: true });
          }
        }
        const negOneProps = new Set(["borderWidth", "borderRadius", "padding", "paddingY", "paddingX", "opacity"]);
        const zeroProps = new Set(["fontSize", "fontWeight", "lineHeight", "width", "minHeight", "offsetX", "offsetY"]);
        const resetVal = negOneProps.has(prop) ? -1 : (zeroProps.has(prop) ? 0 : (prop === "bgOpacity" ? 100 : ""));
        upsertSelectedElementStyle(prop, resetVal);
      }
      return;
    }
    if (action === "inspector-toggle-hidden" && state.pickerSelected) {
      const ov = (state.appearanceDraft.elementOverrides || []).find((o) => o.id === state.pickerSelected.overrideId || o.selector === state.pickerSelected.selector);
      upsertSelectedElementStyle("hidden", !(ov && ov.styles && ov.styles.hidden));
      return;
    }
    if (action === "inspector-reset-element" && state.pickerSelected) {
      pushAppearanceUndo();
      const sel = state.pickerSelected;
      state.appearanceDraft.elementOverrides = (state.appearanceDraft.elementOverrides || []).filter((o) => o.id !== sel.overrideId && o.selector !== sel.selector);
      applyThemeToHost(state.appearanceDraft);
      const patch = { appearance: spCloneAppearance(state.appearanceDraft) };
      if (sel.renameable && sel.origText) {
        const low = sel.origText.trim().toLowerCase();
        const nextLabels = (state.settings.customLabels || []).filter((l) => l.match.toLowerCase() !== low);
        if (nextLabels.length !== (state.settings.customLabels || []).length) {
          patch.customLabels = nextLabels;
        }
      }
      saveSettingsPatch(patch);
      sel.computed = readElementComputedMetrics(sel.selector);
      renderPickerMount();
      return;
    }
    if (action === "inspector-save-rename" && state.pickerSelected) {
      const inp = pickerMountEl ? pickerMountEl.querySelector('[data-role="inspectorRenameInput"]') : null;
      const nextLbl = inp ? String(inp.value || "").trim() : "";
      const match = String(state.pickerSelected.origText || "").trim();
      if (match) {
        const cur = (state.settings.customLabels || []).filter((l) => l.match.toLowerCase() !== match.toLowerCase());
        if (nextLbl && nextLbl !== match) {
          cur.push({ id: "lbl-" + Date.now(), matchType: "exact", match, label: nextLbl, enabled: true });
        }
        saveSettingsPatch({ customLabels: cur });
        renderPickerMount();
      }
      return;
    }
    if (action === "inspector-clear-rename" && state.pickerSelected) {
      const match = String(state.pickerSelected.origText || "").trim();
      if (match) {
        const cur = (state.settings.customLabels || []).filter((l) => l.match.toLowerCase() !== match.toLowerCase());
        saveSettingsPatch({ customLabels: cur });
        renderPickerMount();
      }
      return;
    }
    if (action === "add-custom-label") {
      const m = String(state.newLabelMatch || "").trim();
      const l = String(state.newLabelText || "").trim();
      if (m && l) {
        const next = (state.settings.customLabels || []).concat([{ id: "lbl-" + Date.now(), matchType: "exact", match: m, label: l, enabled: true }]);
        state.newLabelMatch = "";
        state.newLabelText = "";
        saveSettingsPatch({ customLabels: next });
      }
      return;
    }
    if (action === "toggle-custom-label") {
      const lid = actionEl.getAttribute("data-id");
      const next = (state.settings.customLabels || []).map((l) => l.id === lid ? Object.assign({}, l, { enabled: l.enabled === false }) : l);
      saveSettingsPatch({ customLabels: next });
      return;
    }
    if (action === "delete-custom-label") {
      const lid = actionEl.getAttribute("data-id");
      const next = (state.settings.customLabels || []).filter((l) => l.id !== lid);
      saveSettingsPatch({ customLabels: next });
      return;
    }
    if (action === "toggle-agent-popover") {
      state.agentPopoverOpen = !state.agentPopoverOpen;
      if (state.agentPopoverOpen) state.contextPopoverOpen = false;
      renderChatDockMount();
      return;
    }
    if (action === "toggle-context-popover") {
      state.contextPopoverOpen = !state.contextPopoverOpen;
      if (state.contextPopoverOpen) state.agentPopoverOpen = false;
      renderChatDockMount();
      return;
    }
    if (action === "open-agent-full") {
      state.agentPopoverOpen = false;
      setOpen(true, { tab: "persona" });
      return;
    }
    if (action === "toggle-agent-enabled") {
      const next = Object.assign({}, state.chatAgentProfile, { enabled: !state.chatAgentProfile.enabled });
      saveChatAgentProfile(next);
      return;
    }
    if (action === "toggle-agent-default-new") {
      const curDef = Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats && state.settings.agentProfileDefault.enabled);
      const next = Object.assign({}, state.chatAgentProfile, { enabled: !curDef ? true : state.chatAgentProfile.enabled, applyToNewChats: !curDef });
      saveChatAgentProfile(next, { setAsDefault: true });
      return;
    }
    if (action === "apply-agent-preset" && typeof RUDEX_AGENT_PRESETS !== "undefined") {
      const pid = actionEl.getAttribute("data-id");
      const preset = RUDEX_AGENT_PRESETS.find((p) => p.id === pid);
      if (preset) {
        const keepDef = Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats);
        const next = Object.assign({}, state.chatAgentProfile, preset.profile, { applyToNewChats: keepDef });
        saveChatAgentProfile(next, { setAsDefault: keepDef });
      }
      return;
    }
    if (action === "apply-custom-agent-preset") {
      if (targetEl.closest && targetEl.closest('[data-action="delete-custom-agent-preset"]')) return;
      const pid = actionEl.getAttribute("data-id");
      const found = (state.settings.customAgentPresets || []).find((p) => p.id === pid);
      if (found && found.profile) {
        saveChatAgentProfile(Object.assign({}, found.profile, { presetId: found.id, presetLabel: found.name, enabled: true }));
      }
      return;
    }
    if (action === "delete-custom-agent-preset") {
      const pid = actionEl.getAttribute("data-id");
      const next = (state.settings.customAgentPresets || []).filter((p) => p.id !== pid);
      saveSettingsPatch({ customAgentPresets: next });
      return;
    }
    if (action === "save-custom-agent-preset") {
      const name = String(state.newAgentPresetName || "").trim().slice(0, 44);
      if (!name) return;
      const id = "ap-" + Date.now();
      const next = (state.settings.customAgentPresets || []).concat([{
        id,
        name,
        icon: "",
        profile: Object.assign({}, state.chatAgentProfile, { presetId: id, presetLabel: name, enabled: true }),
      }]).slice(-20);
      state.newAgentPresetName = "";
      saveSettingsPatch({ customAgentPresets: next });
      return;
    }
    if (action === "set-agent-field") {
      const f = actionEl.getAttribute("data-field");
      const v = actionEl.getAttribute("data-val");
      if (f && v) {
        const keepDef = Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats);
        const next = Object.assign({}, state.chatAgentProfile, { [f]: v, presetId: "custom", applyToNewChats: keepDef });
        const cnt = typeof rv5CountActiveAgentFeatures === "function" ? rv5CountActiveAgentFeatures(next) : 1;
        next.enabled = cnt > 0;
        if (!next.enabled) next.presetId = "default";
        saveChatAgentProfile(next, { setAsDefault: keepDef });
      }
      return;
    }
    if (action === "toggle-agent-bool") {
      const f = actionEl.getAttribute("data-field");
      if (f) {
        const keepDef = Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats);
        const curOn = Boolean(state.chatAgentProfile.enabled && state.chatAgentProfile[f]);
        const next = Object.assign({}, state.chatAgentProfile, { [f]: !curOn, presetId: "custom", applyToNewChats: keepDef });
        const cnt = typeof rv5CountActiveAgentFeatures === "function" ? rv5CountActiveAgentFeatures(next) : 1;
        next.enabled = cnt > 0;
        if (!next.enabled) next.presetId = "default";
        saveChatAgentProfile(next, { setAsDefault: keepDef });
      }
      return;
    }
    if (action === "reset-agent-auto") {
      const keepDef = Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats);
      const clean = typeof rv5NormalizeAgentProfile === "function"
        ? rv5NormalizeAgentProfile({ enabled: false, presetId: "default", applyToNewChats: false })
        : { enabled: false, presetId: "default", applyToNewChats: false };
      saveChatAgentProfile(clean, { setAsDefault: keepDef });
      return;
    }
    if (action === "quick-toggle-agent") {
      const k = actionEl.getAttribute("data-key");
      const keepDef = Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats);
      const next = Object.assign({}, state.chatAgentProfile, { presetId: "custom", applyToNewChats: keepDef });
      if (!next.enabled) {
        next.subagents = "auto";
        next.webSearch = "auto";
        next.browser = "auto";
        next.planFirst = "auto";
        next.autoVerify = false;
        next.deepMode = false;
        next.safetyMode = "normal";
      }
      if (k === "subagents") next.subagents = next.subagents === "auto" ? "parallel" : (next.subagents === "parallel" ? "off" : "auto");
      else if (k === "webSearch") next.webSearch = next.webSearch === "auto" ? "always" : (next.webSearch === "always" ? "off" : "auto");
      else if (k === "browser") next.browser = next.browser === "auto" ? "verify" : (next.browser === "verify" ? "off" : "auto");
      else if (k === "planFirst") next.planFirst = next.planFirst === "auto" ? "strict" : (next.planFirst === "strict" ? "skip" : "auto");
      else if (k === "autoVerify") next.autoVerify = !next.autoVerify;
      else if (k === "deepMode") next.deepMode = !next.deepMode;
      else if (k === "readonly") next.safetyMode = next.safetyMode === "readonly" ? "normal" : "readonly";
      const cnt = typeof rv5CountActiveAgentFeatures === "function" ? rv5CountActiveAgentFeatures(next) : 1;
      next.enabled = cnt > 0;
      if (!next.enabled) next.presetId = "default";
      saveChatAgentProfile(next, { setAsDefault: keepDef });
      return;
    }
    if (action === "open-annotator") {
      openAnnotator();
      return;
    }
    if (action === "dismiss-live-edit-toast") {
      const eid = actionEl.getAttribute("data-id");
      if (eid) {
        state.dismissedLiveEditIds.add(eid);
        renderChatDockMount();
      }
      return;
    }
    if (action === "hide-tools-chip") {
      state.agentPopoverOpen = false;
      const cur = Object.assign({}, state.settings.liveEditInline || {});
      cur.showChatDock = false;
      saveSettingsPatch({ liveEditInline: cur });
      setToast(state.locale !== "en" ? "Кнопка «Инструменты» скрыта (вернуть: Виджеты → Мини-окно)" : "«Tools» button hidden (restore in Widgets → Mini)", false);
      return;
    }
    if (action === "toggle-quota-auto-bool") {
      const f = actionEl.getAttribute("data-field");
      if (f) {
        const qa = typeof rv5NormalizeQuotaAutomation === "function"
          ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
          : Object.assign({}, state.settings.quotaAutomation || {});
        qa[f] = !qa[f];
        if (f === "autoContinueEnabled" && qa.autoContinueEnabled && qa.autoContinueScope === "current" && state.activeChatKey && state.activeChatKey !== "__new__") {
          qa.autoContinueCurrentKey = state.activeChatKey;
        }
        saveSettingsPatch({ quotaAutomation: qa });
      }
      return;
    }
    if (action === "set-quota-auto-scope") {
      const v = actionEl.getAttribute("data-val") || "all";
      const qa = typeof rv5NormalizeQuotaAutomation === "function"
        ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
        : Object.assign({}, state.settings.quotaAutomation || {});
      qa.autoContinueScope = (v === "selected" || v === "current") ? v : "all";
      if (qa.autoContinueScope === "current" && state.activeChatKey && state.activeChatKey !== "__new__") {
        qa.autoContinueCurrentKey = state.activeChatKey;
      }
      saveSettingsPatch({ quotaAutomation: qa });
      return;
    }
    if (action === "toggle-quota-auto-chat") {
      const ck = String(actionEl.getAttribute("data-chat-key") || "").trim().toLowerCase();
      if (ck && ck !== "__new__") {
        const qa = typeof rv5NormalizeQuotaAutomation === "function"
          ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
          : Object.assign({}, state.settings.quotaAutomation || {});
        const list = Array.isArray(qa.autoContinueChatKeys) ? qa.autoContinueChatKeys.slice() : [];
        const idx = list.indexOf(ck);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(ck);
        qa.autoContinueChatKeys = list.slice(0, 40);
        saveSettingsPatch({ quotaAutomation: qa });
      }
      return;
    }
    if (action === "add-current-chat-auto-continue") {
      const ck = state.activeChatKey && state.activeChatKey !== "__new__" ? state.activeChatKey : "";
      if (ck) {
        const qa = typeof rv5NormalizeQuotaAutomation === "function"
          ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
          : Object.assign({}, state.settings.quotaAutomation || {});
        const list = Array.isArray(qa.autoContinueChatKeys) ? qa.autoContinueChatKeys.slice() : [];
        if (list.indexOf(ck) === -1) list.push(ck);
        qa.autoContinueChatKeys = list.slice(0, 40);
        saveSettingsPatch({ quotaAutomation: qa });
      }
      return;
    }
    if (action === "test-quota-notification") {
      invokeIpc("agy-studio:test-quota-notification", {}).then((res) => {
        if (!state.destroyed) {
          setToast(
            res && res.ok
              ? (state.locale !== "en" ? "Тестовое уведомление отправлено" : "Test notification sent")
              : (state.locale !== "en" ? "Уведомления недоступны в системе" : "Notifications unavailable"),
            !(res && res.ok)
          );
        }
      });
      return;
    }
    if (action === "arm-current-auto-continue") {
      const ck = state.activeChatKey && state.activeChatKey !== "__new__" ? state.activeChatKey : "";
      if (ck) {
        const fam = classifyModelFamilyLocal(state.telemetry && state.telemetry.modelName);
        invokeIpc("agy-studio:arm-auto-continue", {
          chatKey: ck,
          title: state.activeChatTitle || "",
          family: fam,
          modelName: (state.telemetry && state.telemetry.modelName) || "",
          reason: "manual",
        }).then((res) => {
          if (!state.destroyed && res && res.ok) {
            if (res.quotaAlerts) state.quotaAlerts = res.quotaAlerts;
            renderChatDockMount();
            if (state.isOpen) renderStructure();
            setToast(state.locale !== "en" ? "Чат поставлен в очередь автопродолжения" : "Chat armed for auto-continue", false);
          }
        });
      }
      return;
    }
    if (action === "disarm-auto-continue") {
      const ck = String(actionEl.getAttribute("data-chat-key") || state.activeChatKey || "").trim().toLowerCase();
      if (ck && ck !== "__new__") {
        invokeIpc("agy-studio:disarm-auto-continue", { chatKey: ck }).then((res) => {
          if (!state.destroyed && res && res.ok) {
            if (res.quotaAlerts) state.quotaAlerts = res.quotaAlerts;
            renderChatDockMount();
            if (state.isOpen) renderStructure();
            setToast(state.locale !== "en" ? "Автопродолжение для чата отменено" : "Auto-continue cancelled for chat", false);
          }
        });
      }
      return;
    }
    if (action === "toggle-live-inline") {
      const f = actionEl.getAttribute("data-field");
      if (f) {
        const cur = Object.assign({}, state.settings.liveEditInline || {});
        const defaultTrue = f === "showChatDock" || f === "showInChat" || f === "showDeliveredBadge" || f === "enabled";
        const prevVal = defaultTrue ? cur[f] !== false : Boolean(cur[f]);
        cur[f] = !prevVal;
        if (f === "showChatDock" && !cur[f]) state.agentPopoverOpen = false;
        if (f === "showContextMeter" && !cur[f]) state.contextPopoverOpen = false;
        if (f === "urgentIntercept") state.inlineUrgent = Boolean(cur[f]);
        saveSettingsPatch({ liveEditInline: cur });
      }
      return;
    }
    if (action === "set-live-inline-field") {
      const f = actionEl.getAttribute("data-field");
      const v = actionEl.getAttribute("data-val");
      if (f && v) {
        const cur = Object.assign({}, state.settings.liveEditInline || {});
        cur[f] = v;
        saveSettingsPatch({ liveEditInline: cur });
      }
      return;
    }
    if (action === "toggle-urgent-live") {
      state.inlineUrgent = !state.inlineUrgent;
      renderChatDockMount();
      return;
    }
    if (action === "send-inline-live-edit") {
      sendInlineLiveEditFromComposer();
      return;
    }
    if (action === "cancel-live-edit") {
      const eid = actionEl.getAttribute("data-id");
      if (eid) {
        invokeIpc("agy-studio:cancel-live-edit", { id: eid, chatKey: state.activeChatKey || "__new__" }).then((res) => {
          if (!state.destroyed && res && res.ok) {
            applyLiveEditsPayload(res);
            renderChatDockMount();
          }
        });
      }
      return;
    }
    if (action === "toggle-limits-bool") {
      const f = actionEl.getAttribute("data-field");
      if (f) {
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        lw[f] = !lw[f];
        if (f === "onlyLimitsMode" && lw.onlyLimitsMode) lw.enabled = true;
        saveSettingsPatch({ limitsWidget: lw });
      }
      return;
    }
    if (action === "set-limits-window-mode") {
      const mode = actionEl.getAttribute("data-val") || "docked";
      const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
      if (mode === "floating") {
        lw.pinned = false;
        lw.position = "floating";
        if (typeof lw.floatX !== "number" || typeof lw.floatY !== "number") {
          const r = limitsMountEl && typeof limitsMountEl.getBoundingClientRect === "function" ? limitsMountEl.getBoundingClientRect() : null;
          lw.floatX = r && r.width > 20 ? Math.max(8, Math.round(r.left)) : Math.max(16, ((win && win.innerWidth) || 1280) - 270);
          lw.floatY = r && r.height > 20 ? Math.max(8, Math.round(r.top)) : 60;
        }
      } else {
        lw.pinned = true;
        if (lw.position === "floating") lw.position = "top-right";
        lw.floatX = null;
        lw.floatY = null;
      }
      saveSettingsPatch({ limitsWidget: lw });
      return;
    }
    if (action === "set-limits-position") {
      const pos = actionEl.getAttribute("data-val") || "top-right";
      const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
      lw.position = pos;
      lw.pinned = pos !== "floating";
      if (pos !== "floating") {
        lw.floatX = null;
        lw.floatY = null;
      }
      if (pos === "inline-header" && lw.layout !== "pill" && lw.layout !== "inline-header") {
        lw.layout = "inline-header";
      } else if (pos !== "inline-header" && lw.layout === "inline-header") {
        lw.layout = "bars";
      }
      saveSettingsPatch({ limitsWidget: lw });
      return;
    }
    if (action === "toggle-limits-pin") {
      const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
      const isCurrentlyDocked = Boolean(lw.pinned && lw.position !== "floating");
      if (isCurrentlyDocked) {
        lw.pinned = false;
        lw.position = "floating";
        const r = limitsMountEl && typeof limitsMountEl.getBoundingClientRect === "function" ? limitsMountEl.getBoundingClientRect() : null;
        if (r && r.width > 20) {
          lw.floatX = Math.max(8, Math.round(r.left));
          lw.floatY = Math.max(8, Math.round(r.top));
        }
      } else {
        lw.pinned = true;
        if (lw.position === "floating") lw.position = "top-right";
        lw.floatX = null;
        lw.floatY = null;
      }
      saveSettingsPatch({ limitsWidget: lw });
      return;
    }
    if (action === "set-limits-field") {
      const f = actionEl.getAttribute("data-field");
      const v = actionEl.getAttribute("data-val");
      if (f) {
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        lw[f] = v;
        if (f === "layout" && v === "inline-header") {
          lw.position = "inline-header";
          lw.pinned = true;
        } else if (f === "layout" && v !== "inline-header" && lw.position === "inline-header") {
          lw.position = "top-right";
        }
        saveSettingsPatch({ limitsWidget: lw });
      }
      return;
    }
    if (action === "reset-limits-colors") {
      const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
      lw.bgColor = "";
      lw.textColor = "";
      lw.borderColor = "";
      lw.barColor = "";
      saveSettingsPatch({ limitsWidget: lw });
      return;
    }
    if (action === "sync-limits-now") { triggerQuotaSyncClick(); return; }
    if (action === "open-limits-settings") {
      setOpen(true, { tab: "widgets", widgetSub: "limits" });
      return;
    }
    if (action === "set-widget-subsection") {
      const v = actionEl.getAttribute("data-val") || "limits";
      state.widgetSubSection = v === "mini" || v === "monitor" ? v : "limits";
      loadSystemFontsOnce();
      if (state.widgetSubSection === "limits" || state.widgetSubSection === "monitor") {
        invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
          if (!state.destroyed && qs) applyQuotaSummary(qs);
        });
      }
      renderStructure();
      return;
    }
    if (action === "record-keybinding") {
      const id = actionEl.getAttribute("data-id") || "";
      state.recordingKeybindingId = state.recordingKeybindingId === id ? "" : id;
      invokeIpc("agy-studio:set-recording-keybinding", { active: Boolean(state.recordingKeybindingId) });
      renderStructure();
      return;
    }
    if (action === "clear-keybinding") {
      const id = actionEl.getAttribute("data-id") || "";
      if (id) {
        const kb = Object.assign({}, state.settings.keybindings || {});
        kb[id] = "";
        saveSettingsPatch({ keybindings: kb });
      }
      return;
    }
    if (action === "reset-all-keybindings" && typeof RUDEX_KEYBINDINGS_DEFAULTS !== "undefined") {
      state.recordingKeybindingId = "";
      invokeIpc("agy-studio:set-recording-keybinding", { active: false });
      saveSettingsPatch({ keybindings: Object.assign({}, RUDEX_KEYBINDINGS_DEFAULTS) });
      return;
    }
    if (action === "ws-set-scope") {
      state.workshop.scope = actionEl.getAttribute("data-val") || "global";
      renderStructure();
      return;
    }
    if (action === "ws-set-sub") {
      state.workshop.sub = actionEl.getAttribute("data-val") || "rules";
      renderStructure();
      return;
    }
    if (action === "ws-refresh") { refreshWorkshopData(); return; }
    if (action === "ws-open-path") {
      const fp = actionEl.getAttribute("data-path");
      if (fp) invokeIpc("agy-studio:open-path", { path: fp });
      return;
    }
    if (action === "ws-save-rule") {
      const d = state.workshop.draft || {};
      if (!String(d.ruleBody || "").trim()) return;
      resolveWorkshopWorkspacePath().then((wsPath) => {
        invokeIpc("agy-studio:workshop-save-rule", {
          scope: state.workshop.scope === "workspace" ? "workspace" : "global",
          workspacePath: wsPath || "",
          fileName: d.ruleFileName || "custom-rule.md",
          body: d.ruleBody,
          enabled: true,
        }).then((res) => {
          if (state.destroyed) return;
          if (res && res.ok) {
            state.workshop.draft.ruleFileName = "";
            state.workshop.draft.ruleBody = "";
            setToast(state.locale !== "en" ? "Правило сохранено" : "Rule saved", false);
            refreshWorkshopData();
          } else {
            setToast((res && res.error) || (state.locale !== "en" ? "Не удалось сохранить правило" : "Failed to save rule"), true);
          }
        });
      });
      return;
    }
    if (action === "ws-toggle-rule") {
      const fp = actionEl.getAttribute("data-path");
      const wasEn = actionEl.getAttribute("data-enabled") === "1";
      if (fp) {
        invokeIpc("agy-studio:workshop-save-rule", { path: fp, enabled: !wasEn }).then(() => refreshWorkshopData());
      }
      return;
    }
    if (action === "ws-delete-rule") {
      const fp = actionEl.getAttribute("data-path");
      if (fp) invokeIpc("agy-studio:workshop-delete-rule", { path: fp }).then(() => refreshWorkshopData());
      return;
    }
    if (action === "ws-save-skill") {
      const d = state.workshop.draft || {};
      if (!String(d.skillName || "").trim()) return;
      resolveWorkshopWorkspacePath().then((wsPath) => {
        invokeIpc("agy-studio:workshop-save-skill", {
          scope: state.workshop.scope === "workspace" ? "workspace" : "global",
          workspacePath: wsPath || "",
          name: d.skillName,
          description: d.skillDesc || "",
          body: d.skillBody || "",
        }).then((res) => {
          if (state.destroyed) return;
          if (res && res.ok) {
            state.workshop.draft.skillName = "";
            state.workshop.draft.skillDesc = "";
            state.workshop.draft.skillBody = "";
            setToast(state.locale !== "en" ? "Скилл создан" : "Skill created", false);
            refreshWorkshopData();
          } else {
            setToast((res && res.error) || (state.locale !== "en" ? "Не удалось создать скилл" : "Failed to create skill"), true);
          }
        });
      });
      return;
    }
    if (action === "ws-pin-skill") {
      const sname = actionEl.getAttribute("data-name");
      if (sname) {
        const cur = Array.isArray(state.chatAgentProfile.pinnedSkills) ? state.chatAgentProfile.pinnedSkills.slice() : [];
        const idx = cur.indexOf(sname);
        if (idx >= 0) {
          cur.splice(idx, 1);
          const next = Object.assign({}, state.chatAgentProfile, { pinnedSkills: cur });
          const cnt = typeof rv5CountActiveAgentFeatures === "function" ? rv5CountActiveAgentFeatures(next) : cur.length;
          next.enabled = cnt > 0;
          saveChatAgentProfile(next);
          setToast(state.locale !== "en" ? `Скилл «${sname}» откреплён` : `Unpinned "${sname}"`, false);
        } else {
          cur.push(sname);
          saveChatAgentProfile(Object.assign({}, state.chatAgentProfile, { pinnedSkills: cur, enabled: true }));
          setToast(state.locale !== "en" ? `Скилл «${sname}» закреплён у агента` : `Pinned "${sname}" to Agent`, false);
        }
      }
      return;
    }
    if (action === "ws-save-mcp") {
      const d = state.workshop.draft || {};
      if (!String(d.mcpName || "").trim()) return;
      resolveWorkshopWorkspacePath().then((wsPath) => {
        invokeIpc("agy-studio:workshop-save-mcp", {
          scope: state.workshop.scope === "workspace" ? "workspace" : "global",
          workspacePath: wsPath || "",
          name: d.mcpName,
          command: d.mcpCommand || "",
          argsText: d.mcpArgs || "",
          url: d.mcpUrl || "",
        }).then((res) => {
          if (state.destroyed) return;
          if (res && res.ok) {
            state.workshop.draft.mcpName = "";
            state.workshop.draft.mcpCommand = "";
            state.workshop.draft.mcpArgs = "";
            state.workshop.draft.mcpUrl = "";
            setToast(state.locale !== "en" ? "MCP-сервер сохранён" : "MCP server saved", false);
            refreshWorkshopData();
          } else {
            setToast((res && res.error) || (state.locale !== "en" ? "Ошибка сохранения MCP (проверьте mcp_config.json)" : "Failed to save MCP server"), true);
          }
        });
      });
      return;
    }
    if (action === "ws-toggle-mcp") {
      const mname = actionEl.getAttribute("data-name");
      const mscope = actionEl.getAttribute("data-scope") || "global";
      const wasDis = actionEl.getAttribute("data-disabled") === "1";
      if (mname) {
        resolveWorkshopWorkspacePath().then((wsPath) => {
          invokeIpc("agy-studio:workshop-save-mcp", { scope: mscope, workspacePath: wsPath || "", name: mname, disabled: !wasDis }).then((res) => {
            if (res && res.ok === false) setToast(res.error || "MCP error", true);
            refreshWorkshopData();
          });
        });
      }
      return;
    }
    if (action === "ws-delete-mcp") {
      const mname = actionEl.getAttribute("data-name");
      const mscope = actionEl.getAttribute("data-scope") || "global";
      if (mname) {
        resolveWorkshopWorkspacePath().then((wsPath) => {
          invokeIpc("agy-studio:workshop-delete-mcp", { scope: mscope, workspacePath: wsPath || "", name: mname }).then(() => refreshWorkshopData());
        });
      }
      return;
    }
    if (action === "export-config-json") {
      invokeIpc("agy-studio:export-config-json").then((res) => {
        if (res && res.ok) setToast(state.locale !== "en" ? "Профиль Rudex сохранён в JSON" : "Rudex profile exported to JSON", false);
      });
      return;
    }
    if (action === "import-config-json") {
      invokeIpc("agy-studio:import-config-json").then((res) => {
        if (res && res.ok && res.state) {
          applyRemoteState(res.state, false);
          setToast(state.locale !== "en" ? "Профиль Rudex импортирован" : "Rudex profile imported", false);
        }
      });
      return;
    }
    if (action === "open-settings") { setOpen(true); return; }
    if (action === "open-persona-tab") { setOpen(true, { tab: "persona", agentSub: "persona" }); return; }
    if (action === "open-export-limits") {
      setOpen(true, { tab: "widgets", widgetSub: "monitor" });
      return;
    }
    if (action === "switch-tab") {
      flushInspectorPersist();
      const prevTab = state.activeTab;
      const tab = actionEl.getAttribute("data-tab") || "appearance";
      if (state.recordingKeybindingId) {
        state.recordingKeybindingId = "";
        invokeIpc("agy-studio:set-recording-keybinding", { active: false });
      }
      state.activeTab = tab;
      if (prevTab === "appearance" && tab !== "appearance") {
        cleanupTempUploadedMedia();
        state.appearanceLivePreview = false;
        state.appearanceDockedRight = false;
        state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        state.greetingDraft = spCloneGreeting(state.settings.greeting);
        state.appearanceDirty = false;
        applyThemeToHost(state.settings.appearance);
        syncTranslatorGreeting(state.settings.greeting);
        if (state.pickerSelected) renderPickerMount();
      }
      if (tab === "appearance") {
        state.appearanceLivePreview = true;
        loadSystemFontsOnce();
        if (!state.appearanceDirty) {
          state.appearanceDraft = spCloneAppearance(state.settings.appearance);
          state.greetingDraft = spCloneGreeting(state.settings.greeting);
        }
        applyThemeFastToHost(state.appearanceDraft);
        if (state.appearanceSubTab === "wallpaper") refreshMediaLibrary();
      } else if (tab === "widgets") {
        loadSystemFontsOnce();
        invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
          if (!state.destroyed && qs) applyQuotaSummary(qs);
        });
      } else if (tab === "history") {
        refreshInputHistory();
      } else if (tab === "workshop") {
        refreshWorkshopData();
      } else if (tab === "live-edits") {
        refreshLiveEdits();
      }
      renderStructure();
      return;
    }
    if (action === "open-studio-design") {
      if (state.activeTab === "appearance") {
        cleanupTempUploadedMedia();
        state.appearanceLivePreview = false;
        state.appearanceDockedRight = false;
        state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        state.greetingDraft = spCloneGreeting(state.settings.greeting);
        state.appearanceDirty = false;
        applyThemeToHost(state.settings.appearance);
      }
      state.activeTab = "settings";
      state.settingsSubTab = "studio";
      setOpen(true);
      return;
    }
    if (action === "cycle-studio-theme") {
      const cur = spNormalizeStudioUi(state.settings.studioUi).windowTheme;
      const idx = STUDIO_WINDOW_THEMES.findIndex((x) => x.id === cur);
      const nextTheme = STUDIO_WINDOW_THEMES[(idx + 1) % STUDIO_WINDOW_THEMES.length].id;
      saveSettingsPatch({ studioUi: { windowTheme: nextTheme } });
      return;
    }
    if (action === "set-studio-theme") {
      saveSettingsPatch({ studioUi: { windowTheme: actionEl.getAttribute("data-val") || "obsidian" } });
      return;
    }
    if (action === "set-studio-layout") {
      saveSettingsPatch({ studioUi: { windowLayout: actionEl.getAttribute("data-val") || "sidebar" } });
      return;
    }
    if (action === "set-widget-theme") {
      saveSettingsPatch({ studioUi: { widgetTheme: actionEl.getAttribute("data-val") || "glass" } });
      return;
    }
    if (action === "set-widget-scale") {
      const sc = actionEl.getAttribute("data-val") || "md";
      const z = sc === "sm" ? 85 : (sc === "lg" ? 120 : 100);
      saveSettingsPatch({ studioUi: { widgetScale: sc, widgetZoom: z } });
      return;
    }
    if (action === "set-app-scale") {
      const val = Math.max(70, Math.min(150, Math.round(Number(actionEl.getAttribute("data-val")) || 100)));
      saveSettingsPatch({ studioUi: { appScale: val } });
      return;
    }
    if (action === "step-scale") {
      const target = actionEl.getAttribute("data-target");
      const rawDelta = actionEl.getAttribute("data-delta");
      const sui = spNormalizeStudioUi(state.settings.studioUi);
      if (target === "appScale") {
        const next = rawDelta === "reset" ? 100 : Math.max(70, Math.min(150, sui.appScale + (Number(rawDelta) || 0)));
        saveSettingsPatch({ studioUi: { appScale: next } });
      } else if (target === "studioScale") {
        const next = rawDelta === "reset" ? 100 : Math.max(75, Math.min(140, sui.studioScale + (Number(rawDelta) || 0)));
        saveSettingsPatch({ studioUi: { studioScale: next } });
      } else if (target === "widgetZoom") {
        const next = rawDelta === "reset" ? 100 : Math.max(70, Math.min(160, sui.widgetZoom + (Number(rawDelta) || 0)));
        saveSettingsPatch({ studioUi: { widgetZoom: next, widgetScale: widgetZoomToBucket(next) } });
      }
      return;
    }
    if (action === "set-widget-preview-mode") {
      state.widgetPreviewMode = actionEl.getAttribute("data-val") === "medium" ? "medium" : "mini";
      renderStructure();
      return;
    }
    if (action === "reset-studio-ui") {
      saveSettingsPatch({ studioUi: Object.assign({}, DEFAULT_STUDIO_UI) });
      return;
    }
    if (action === "toggle-appearance-dock") {
      state.appearanceDockedRight = !state.appearanceDockedRight;
      state.appearanceLivePreview = true;
      applyThemeFastToHost(state.appearanceDraft);
      renderStructure();
      if (state.pickerSelected) renderPickerMount();
      return;
    }
    if (action === "scroll-opt-section") {
      const secId = actionEl.getAttribute("data-target") || "";
      if (secId && modalMountEl) {
        const targetSec = modalMountEl.querySelector(`[data-opt-sec="${secId}"]`);
        if (targetSec && typeof targetSec.scrollIntoView === "function") {
          try { targetSec.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_e) { targetSec.scrollIntoView(); }
        }
      }
      return;
    }
    if (action === "set-app-subtab") {
      const sub = actionEl.getAttribute("data-val") || "theme";
      state.appearanceSubTab = sub;
      if (sub === "wallpaper") refreshMediaLibrary();
      if (sub === "text" || sub === "elements") loadSystemFontsOnce();
      renderStructure();
      return;
    }
    if (action === "set-settings-subtab") {
      const rawSub = actionEl.getAttribute("data-val") || "system";
      const sub = ["system", "optimization", "studio", "hotkeys"].indexOf(rawSub) >= 0 ? rawSub : "system";
      state.settingsSubTab = sub;
      if (sub === "system") {
        invokeIpc("agy-studio:get-update-state").then((upd) => {
          if (!state.destroyed && upd) applyUpdateStatus(upd);
        });
      }
      if (sub === "optimization") refreshPerfDiagnostics();
      renderStructure();
      return;
    }
    if (action === "open-input-history") {
      setOpen(true, { tab: "history" });
      return;
    }
    if (action === "toggle-composer-drafts") {
      saveSettingsPatch({ composerDraftsEnabled: state.settings.composerDraftsEnabled === false });
      return;
    }
    if (action === "toggle-input-history") {
      saveSettingsPatch({ inputHistoryEnabled: state.settings.inputHistoryEnabled === false });
      return;
    }
    if (action === "refresh-input-history") {
      refreshInputHistory();
      return;
    }
    if (action === "clear-all-drafts") {
      invokeIpc("agy-studio:clear-composer-draft", { all: true }).then(() => {
        if (state.destroyed) return;
        lastSavedDraftByChat.clear();
        lastKnownComposerSnapByChat.clear();
        draftTextCacheByChat.clear();
        draftDataUrlToFileName.clear();
        if (state.inputHistory) state.inputHistory.draftCount = 0;
        setToast(state.locale !== "en" ? "Все черновики чатов очищены" : "All saved drafts cleared", false);
        renderStructure();
      });
      return;
    }
    if (action === "clear-input-history") {
      invokeIpc("agy-studio:clear-input-history").then((res) => {
        if (state.destroyed) return;
        state.inputHistory = {
          loading: false,
          items: res && Array.isArray(res.items) ? res.items : [],
          draftCount: res && typeof res.draftCount === "number" ? res.draftCount : (state.inputHistory ? state.inputHistory.draftCount : 0),
        };
        setToast(state.locale !== "en" ? "История ввода очищена" : "Input history cleared", false);
        renderStructure();
      });
      return;
    }
    if (action === "delete-history-item") {
      const id = actionEl.getAttribute("data-id") || "";
      if (id) {
        invokeIpc("agy-studio:delete-input-history-item", { id }).then((res) => {
          if (state.destroyed) return;
          if (res && Array.isArray(res.items)) {
            state.inputHistory = {
              loading: false,
              items: res.items,
              draftCount: typeof res.draftCount === "number" ? res.draftCount : (state.inputHistory ? state.inputHistory.draftCount : 0),
            };
          }
          renderStructure();
        });
      }
      return;
    }
    if (action === "copy-history-text") {
      const id = actionEl.getAttribute("data-id") || "";
      const list = state.inputHistory && Array.isArray(state.inputHistory.items) ? state.inputHistory.items : [];
      const found = list.find((x) => x && x.id === id);
      if (found && found.text) {
        invokeIpc("agy-studio:copy-history-text", { text: found.text }).then(() => {
          if (!state.destroyed) setToast(state.locale !== "en" ? "Текст скопирован в буфер обмена" : "Text copied to clipboard", false);
        });
      }
      return;
    }
    if (action === "copy-history-file") {
      const fileName = actionEl.getAttribute("data-file") || "";
      const name = actionEl.getAttribute("data-name") || fileName;
      const mime = actionEl.getAttribute("data-mime") || "";
      const isImage = actionEl.getAttribute("data-is-img") === "1";
      if (fileName) {
        invokeIpc("agy-studio:copy-history-file", { fileName, name, mime, isImage, mode: "clipboard" }).then((res) => {
          if (state.destroyed) return;
          if (res && res.ok) {
            setToast(
              state.locale !== "en"
                ? (isImage ? "Скриншот скопирован — вставьте Ctrl+V" : `Файл «${name}» скопирован — вставьте Ctrl+V`)
                : (isImage ? "Image copied — press Ctrl+V" : `File "${name}" copied — press Ctrl+V`),
              false
            );
          } else {
            setToast(state.locale !== "en" ? "Не удалось скопировать файл" : "Failed to copy file", true);
          }
        });
      }
      return;
    }
    if (action === "reveal-history-file") {
      const fileName = actionEl.getAttribute("data-file") || "";
      if (fileName) {
        invokeIpc("agy-studio:copy-history-file", { fileName, mode: "reveal" });
      }
      return;
    }
    if (action === "insert-history-item") {
      const id = actionEl.getAttribute("data-id") || "";
      const list = state.inputHistory && Array.isArray(state.inputHistory.items) ? state.inputHistory.items : [];
      const found = list.find((x) => x && x.id === id);
      if (found) {
        setOpen(false);
        (async () => {
          const atts = [];
          const srcAtts = Array.isArray(found.attachments) ? found.attachments : [];
          for (let i = 0; i < srcAtts.length; i += 1) {
            const a = srcAtts[i];
            if (!a || !a.fileName || a.exists === false) continue;
            const res = await invokeIpc("agy-studio:copy-history-file", {
              fileName: a.fileName,
              name: a.name,
              mime: a.mime,
              isImage: a.isImage,
              mode: "dataUrl",
            });
            if (res && res.ok && res.dataUrl) {
              atts.push({ name: res.name || a.name, mime: res.mime || a.mime, isImage: Boolean(res.isImage || a.isImage), dataUrl: res.dataUrl });
            }
          }
          if (state.destroyed || typeof rv5FindNativeComposer !== "function") return;
          const { container, editable } = rv5FindNativeComposer(doc);
          if (!editable) return;
          isRestoringDraft = true;
          try {
            if (typeof rv5ClearEditableText === "function") rv5ClearEditableText(editable, win);
            if (atts.length > 0) await insertAttachmentsIntoNativeComposer(atts, container, editable);
            if (found.text) await insertTextIntoNativeComposerRich(editable, found.text);
          } finally {
            isRestoringDraft = false;
            lastDraftObsSig = "";
          }
          scheduleComposerDraftSave(250);
        })();
      }
      return;
    }
    if (action === "to-medium") { setViewMode("medium"); return; }
    if (action === "to-mini") { setViewMode("mini"); return; }
    if (action === "set-view-mode") {
      setViewMode(actionEl.getAttribute("data-val") === "medium" ? "medium" : "mini");
      return;
    }
    if (action === "toggle-locale") {
      const next = state.locale === "ru" ? "en" : "ru";
      setLocale(next);
      invokeIpc("agy-i18n:set-locale", next);
      return;
    }
    if (action === "set-locale") {
      const next = actionEl.getAttribute("data-val") === "en" ? "en" : "ru";
      if (next !== state.locale) {
        setLocale(next);
        invokeIpc("agy-i18n:set-locale", next);
      }
      return;
    }
    if (action === "toggle-thinking-ru") {
      saveSettingsPatch({ thinkingInRussian: !state.settings.thinkingInRussian });
      return;
    }
    if (action === "toggle-worklog-ru") {
      saveSettingsPatch({ workLogInRussian: !state.settings.workLogInRussian });
      return;
    }
    if (action === "toggle-auto-updates") {
      saveSettingsPatch({ autoCheckUpdates: state.settings.autoCheckUpdates === false });
      return;
    }
    if (action === "check-updates") {
      const curSt = state.update && state.update.status;
      if (curSt === "checking" || curSt === "downloading" || curSt === "extracting" || curSt === "installing" || curSt === "restarting") return;
      state.update.status = "checking";
      state.update.error = "";
      renderStructure();
      invokeIpc("agy-studio:check-updates", { manual: true }).then((res) => {
        if (state.destroyed) return;
        if (res && typeof res === "object") {
          applyUpdateStatus(res);
        } else {
          applyUpdateStatus(Object.assign({}, state.update, { status: "error", error: tr.updateStatusError }));
        }
      });
      return;
    }
    if (action === "preview-update-toast") {
      state.updatePreviewActive = !state.updatePreviewActive;
      renderUpdateToast();
      return;
    }
    if (action === "dismiss-update") {
      if (state.updatePreviewActive && !(state.update && state.update.available)) {
        state.updatePreviewActive = false;
        renderUpdateToast();
        return;
      }
      state.updatePreviewActive = false;
      state.update.dismissed = true;
      renderUpdateToast();
      invokeIpc("agy-studio:dismiss-update", { key: state.update.updateKey || "" }).then((res) => {
        if (!state.destroyed && res) applyUpdateStatus(res);
      });
      return;
    }
    if (action === "install-update") {
      const curSt = state.update && state.update.status;
      if (curSt === "downloading" || curSt === "extracting" || curSt === "installing" || curSt === "restarting") return;
      state.update.status = "downloading";
      state.update.error = "";
      state.update.dismissed = false;
      renderUpdateToast();
      if (state.isOpen && state.activeTab === "settings" && (state.settingsSubTab || "system") === "system") {
        renderStructure();
      }
      invokeIpc("agy-studio:install-update", {}).then((res) => {
        if (state.destroyed) return;
        if (res && res.state) applyUpdateStatus(res.state);
        else if (!res || res.ok === false) {
          applyUpdateStatus(Object.assign({}, state.update, { status: "error", error: (res && res.error) || tr.updateStatusError }));
        }
      });
      return;
    }
    if (action === "toggle-mini-field") {
      const key = actionEl.getAttribute("data-key");
      if (MINI_FIELD_KEYS.indexOf(key) >= 0) {
        const nextFields = Object.assign({}, state.settings.miniFields);
        nextFields[key] = !nextFields[key];
        saveSettingsPatch({ miniFields: nextFields });
      }
      return;
    }
    if (action === "set-dock") {
      const dock = normalizeDockPosition(actionEl.getAttribute("data-val"));
      saveSettingsPatch({ dockPosition: dock, layoutMode: "docked", pinned: true, floatX: null, floatY: null });
      return;
    }
    if (action === "set-widget-window-mode") {
      const mode = actionEl.getAttribute("data-val") || "docked";
      if (mode === "floating") {
        const r = widgetMountEl && typeof widgetMountEl.getBoundingClientRect === "function" ? widgetMountEl.getBoundingClientRect() : null;
        const fx = typeof state.settings.floatX === "number" ? state.settings.floatX : (r && r.width > 20 ? Math.max(8, Math.round(r.left)) : null);
        const fy = typeof state.settings.floatY === "number" ? state.settings.floatY : (r && r.height > 20 ? Math.max(8, Math.round(r.top)) : null);
        saveSettingsPatch({ pinned: false, layoutMode: fx !== null && fy !== null ? "floating" : "docked", floatX: fx, floatY: fy });
      } else {
        const dock = state.settings.dockPosition === "hidden" ? "bottom-right" : state.settings.dockPosition;
        saveSettingsPatch({ pinned: true, layoutMode: "docked", dockPosition: dock, floatX: null, floatY: null });
      }
      return;
    }
    if (action === "toggle-pin") {
      const nextPinned = !state.settings.pinned;
      if (nextPinned) {
        const dock = state.settings.dockPosition === "hidden" ? "bottom-right" : state.settings.dockPosition;
        saveSettingsPatch({ pinned: true, layoutMode: "docked", dockPosition: dock, floatX: null, floatY: null });
      } else {
        const r = measureWidgetBoxRect();
        const fx = r && r.width > 20 ? Math.max(8, Math.round(r.left)) : (typeof state.settings.floatX === "number" ? state.settings.floatX : 18);
        const fy = r && r.height > 16 ? Math.max(8, Math.round(r.top)) : (typeof state.settings.floatY === "number" ? state.settings.floatY : 18);
        saveSettingsPatch({ pinned: false, layoutMode: "floating", floatX: fx, floatY: fy });
      }
      return;
    }
    if (action === "reset-position") {
      const dock = state.settings.dockPosition === "hidden" ? "bottom-right" : state.settings.dockPosition;
      saveSettingsPatch({ dockPosition: dock, layoutMode: "docked", pinned: true, floatX: null, floatY: null });
      return;
    }
    if (action === "reset-telemetry") {
      state.telemetry.currentTps = 0;
      state.telemetry.lastAvgTps = 0;
      state.telemetry.peakTps = 0;
      state.telemetry.lastDurSec = 0;
      state.telemetry.lastThinkingSec = 0;
      state.telemetry.exactRespTokens = 0;
      state.telemetry.exactContextTokens = 0;
      state.telemetry.exactCacheTokens = 0;
      state.telemetry.samples = [];
      state.telemetry.history = [];
      state.telemetry.dirty = false;
      updateLiveDom();
      if (state.activeChatKey && state.activeChatKey !== "__new__") {
        invokeIpc("agy-studio:reset-chat-telemetry", { chatKey: state.activeChatKey });
      }
      return;
    }
    if (action === "toggle-persona-enabled") {
      const next = !state.chatPersona.enabled;
      if (next && !state.draftPersonaText.trim()) {
        setToast(tr.personaEmptyWarn, true);
        return;
      }
      state.chatPersona.enabled = next;
      renderStructure();
      persistPersona(next);
      return;
    }
    if (action === "toggle-persona-strict") {
      const nextStrict = state.chatPersona.strict === false;
      state.chatPersona.strict = nextStrict;
      saveSettingsPatch({ personaStrictMode: nextStrict });
      if (state.chatPersona.enabled && state.draftPersonaText.trim()) persistPersona(true);
      else renderStructure();
      return;
    }
    if (action === "select-preset") {
      if (targetEl.closest && targetEl.closest('[data-action="delete-custom-preset"]')) return;
      selectPreset(actionEl.getAttribute("data-id") || "");
      return;
    }
    if (action === "delete-custom-preset") {
      const id = actionEl.getAttribute("data-id");
      const next = (state.settings.customPresets || []).filter((p) => p.id !== id);
      if (state.chatPersona.activePreset === id) state.chatPersona.activePreset = "custom";
      saveSettingsPatch({ customPresets: next });
      setToast(tr.personaDeletedPreset, false);
      return;
    }
    if (action === "save-custom-preset") {
      const title = String(state.newPresetName || "").trim().slice(0, 44);
      const rawBody = String(state.draftPersonaText || "").trim();
      if (!title || !rawBody) {
        setToast(tr.personaPresetEmptyWarn, true);
        return;
      }
      if (utf8ByteLength(rawBody) > MAX_PERSONA_BODY_BYTES) {
        setToast(tr.personaTooLargeErr, true);
        return;
      }
      const id = "custom-" + Date.now();
      const next = (state.settings.customPresets || []).concat([{ id, title, body: rawBody }]).slice(-20);
      state.newPresetName = "";
      state.chatPersona.activePreset = id;
      saveSettingsPatch({ customPresets: next });
      setToast(tr.personaSavedPreset, false);
      return;
    }
    if (action === "save-persona") {
      const hasText = Boolean(state.draftPersonaText.trim());
      state.chatPersona.enabled = hasText;
      persistPersona(hasText);
      return;
    }
    if (action === "clear-persona") {
      state.draftPersonaText = "";
      state.draftDirty = true;
      state.chatPersona.enabled = false;
      state.chatPersona.activePreset = "custom";
      renderStructure();
      persistPersona(false);
      return;
    }
    if (action === "toggle-live-edit") {
      toggleLiveEditPopover();
      return;
    }
    if (action === "close-live-edit") {
      state.liveEditOpen = false;
      renderPopoverStructure();
      return;
    }
    if (action === "open-live-edits-tab") {
      state.liveEditOpen = false;
      state.activeTab = "live-edits";
      renderPopoverStructure();
      setOpen(true);
      return;
    }
    if (action === "pick-live-edit-images") {
      invokeIpc("agy-studio:pick-live-edit-images").then((res) => {
        if (state.destroyed || !res || !res.ok || !Array.isArray(res.items)) return;
        const cur = Array.isArray(state.liveEditDraftImages) ? state.liveEditDraftImages.slice() : [];
        for (let i = 0; i < res.items.length && cur.length < 4; i += 1) {
          const it = res.items[i];
          if (!it) continue;
          cur.push({
            name: it.name || ("img-" + (cur.length + 1)),
            sourcePath: it.sourcePath || "",
            dataUrl: it.sourcePath ? "" : (it.previewDataUrl || ""),
            previewDataUrl: it.previewDataUrl || "",
          });
        }
        state.liveEditDraftImages = cur;
        renderPopoverStructure();
        if (state.isOpen && state.activeTab === "live-edits") renderStructure();
      });
      return;
    }
    if (action === "remove-live-edit-img") {
      const idx = parseInt(actionEl.getAttribute("data-idx"), 10);
      if (!isNaN(idx) && idx >= 0 && Array.isArray(state.liveEditDraftImages)) {
        state.liveEditDraftImages.splice(idx, 1);
        renderPopoverStructure();
        if (state.isOpen && state.activeTab === "live-edits") renderStructure();
      }
      return;
    }
    if (action === "insert-supplement-to-chat") {
      if (insertTextIntoMainComposer(state.liveEditDraftText)) {
        state.liveEditDraftText = "";
        renderPopoverStructure();
        if (state.isOpen && state.activeTab === "live-edits") {
          renderStructure();
          setToast(tr.suppInsertedToast, false);
        }
      }
      return;
    }
    if (action === "send-live-edit") {
      sendLiveEditFromDraft();
      return;
    }
    if (action === "clear-live-edits") {
      invokeIpc("agy-studio:clear-live-edits", { chatKey: state.activeChatKey || "__new__" }).then((res) => {
        if (state.destroyed || !res) return;
        applyLiveEditsPayload(res);
        renderPopoverStructure();
        updateLiveDom();
        if (state.isOpen && state.activeTab === "live-edits") renderStructure();
      });
      return;
    }
    if (action === "apply-claude-suite") {
      const variant = actionEl.getAttribute("data-val") === "light" ? "light" : "dark";
      const presetId = variant === "light" ? "claude-code-light" : "claude-code-dark";
      const pr = spFindThemePreset(presetId);
      const sw = pr && pr.vars ? pr.vars : null;
      pushAppearanceUndo();
      state.appearanceDraft.presetId = presetId;
      state.appearanceDraft.customAccent = false;
      if (sw) {
        state.appearanceDraft.accentColor = sw.accentColor;
        state.appearanceDraft.canvasBg = sw.canvasBg;
        state.appearanceDraft.cardBg = sw.cardBg;
        state.appearanceDraft.radius = sw.radius;
        if (state.appearanceDraft.corners) {
          state.appearanceDraft.corners.mode = "linked";
          state.appearanceDraft.corners.all = sw.radius;
        }
      }
      if (!state.appearanceDraft.typography) state.appearanceDraft.typography = spDefaultAppearance().typography;
      state.appearanceDraft.typography.uiFont = "claude-sans";
      state.appearanceDraft.typography.monoFont = "claude-mono";
      if (!state.appearanceDraft.uiStyle) state.appearanceDraft.uiStyle = spDefaultUiStyle();
      state.appearanceDraft.uiStyle.preset = "claude-code";
      state.appearanceDraft.uiStyle.composer = "claude-code";
      state.appearanceDraft.uiStyle.chat = "claude-code";
      state.appearanceDraft.uiStyle.modelSelector = "claude-code";
      const suiPatch = { windowTheme: variant === "light" ? "claude-light" : "claude-dark", widgetTheme: "claude" };
      state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, suiPatch));
      invokeIpc("agy-studio:save-settings", { studioUi: suiPatch });
      markAppearanceDirty();
      applyThemeToHost(state.appearanceDraft);
      setToast(tr.claudeSuiteApplied, false);
      renderStructure();
      return;
    }
    if (action === "apply-platform-suite") {
      const suite = actionEl.getAttribute("data-val") || "codex";
      if (suite === "antigravity") {
        const prNative = spFindThemePreset("native");
        const swNative = prNative && prNative.vars ? prNative.vars : null;
        pushAppearanceUndo();
        state.appearanceDraft.presetId = "native";
        state.appearanceDraft.customAccent = false;
        state.appearanceDraft.customSidebarBg = false;
        state.appearanceDraft.customBorderColor = false;
        state.appearanceDraft.accentColor = swNative && swNative.accentColor ? swNative.accentColor : "#7c9bff";
        if (swNative) {
          state.appearanceDraft.canvasBg = swNative.canvasBg;
          state.appearanceDraft.cardBg = swNative.cardBg;
          if (swNative.sidebarBg) state.appearanceDraft.sidebarBg = swNative.sidebarBg;
        }
        state.appearanceDraft.radius = 12;
        if (state.appearanceDraft.corners) {
          state.appearanceDraft.corners.mode = "linked";
          state.appearanceDraft.corners.all = 12;
        }
        if (!state.appearanceDraft.typography) state.appearanceDraft.typography = spDefaultAppearance().typography;
        state.appearanceDraft.typography.uiFont = "system";
        state.appearanceDraft.typography.monoFont = "system";
        state.appearanceDraft.uiStyle = spDefaultUiStyle();
        const suiPatchNative = { windowTheme: "obsidian", widgetTheme: "glass" };
        state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, suiPatchNative));
        invokeIpc("agy-studio:save-settings", { studioUi: suiPatchNative });
        markAppearanceDirty();
        applyThemeToHost(state.appearanceDraft);
        setToast(state.locale !== "en" ? "Применён стандартный образ Antigravity (нажмите «Применить»)" : "Previewing default Antigravity suite (click Apply)", false);
        renderStructure();
        return;
      }
      const isCodex = suite === "codex";
      const presetId = isCodex ? "obsidian-glass" : "claude-terminal";
      const pr = spFindThemePreset(presetId);
      const sw = pr && pr.vars ? pr.vars : null;
      pushAppearanceUndo();
      state.appearanceDraft.presetId = presetId;
      state.appearanceDraft.customAccent = true;
      state.appearanceDraft.accentColor = isCodex ? "#e4e4e7" : "#38bdf8";
      if (sw) {
        state.appearanceDraft.canvasBg = sw.canvasBg;
        state.appearanceDraft.cardBg = sw.cardBg;
      }
      state.appearanceDraft.radius = isCodex ? 14 : 6;
      if (state.appearanceDraft.corners) {
        state.appearanceDraft.corners.mode = "linked";
        state.appearanceDraft.corners.all = isCodex ? 14 : 6;
      }
      if (!state.appearanceDraft.typography) state.appearanceDraft.typography = spDefaultAppearance().typography;
      state.appearanceDraft.typography.uiFont = isCodex ? "chatgpt-sans" : "opencode-mono";
      state.appearanceDraft.typography.monoFont = isCodex ? "jetbrains" : "opencode-mono";
      if (!state.appearanceDraft.uiStyle) state.appearanceDraft.uiStyle = spDefaultUiStyle();
      const targetStyle = isCodex ? "codex" : "opencode";
      state.appearanceDraft.uiStyle.preset = targetStyle;
      state.appearanceDraft.uiStyle.composer = targetStyle;
      state.appearanceDraft.uiStyle.chat = targetStyle;
      state.appearanceDraft.uiStyle.modelSelector = targetStyle;
      const suiPatch = { windowTheme: isCodex ? "obsidian" : "minimal-mono", widgetTheme: isCodex ? "island" : "solid" };
      state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, suiPatch));
      invokeIpc("agy-studio:save-settings", { studioUi: suiPatch });
      markAppearanceDirty();
      applyThemeToHost(state.appearanceDraft);
      setToast(state.locale !== "en" ? `Применён образ ${isCodex ? "Codex" : "OpenCode"} (нажмите «Применить»)` : `Previewing ${isCodex ? "Codex" : "OpenCode"} suite (click Apply)`, false);
      renderStructure();
      return;
    }
    if (action === "apply-font-pair") {
      const pid = actionEl.getAttribute("data-id") || "";
      const found = FONT_PAIR_PRESETS.find((x) => x.id === pid);
      if (found) {
        pushAppearanceUndo();
        if (!state.appearanceDraft.typography) state.appearanceDraft.typography = spDefaultAppearance().typography;
        state.appearanceDraft.typography.uiFont = found.uiFont;
        state.appearanceDraft.typography.monoFont = found.monoFont;
        markAppearanceDirty();
        applyThemeToHost(state.appearanceDraft);
        renderStructure();
      }
      return;
    }
    if (action === "set-uistyle-preset") {
      const id = actionEl.getAttribute("data-id") || "antigravity";
      const valid = id === "claude-code" || id === "codex" || id === "opencode" ? id : "antigravity";
      pushAppearanceUndo();
      if (!state.appearanceDraft.uiStyle) state.appearanceDraft.uiStyle = spDefaultUiStyle();
      state.appearanceDraft.uiStyle.preset = valid;
      state.appearanceDraft.uiStyle.composer = valid;
      state.appearanceDraft.uiStyle.chat = valid;
      state.appearanceDraft.uiStyle.modelSelector = valid;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-uistyle-part") {
      const part = actionEl.getAttribute("data-part") || "";
      const val = actionEl.getAttribute("data-val") || "antigravity";
      const valid = val === "claude-code" || val === "codex" || val === "opencode" ? val : "antigravity";
      if (part === "composer" || part === "chat" || part === "modelSelector") {
        pushAppearanceUndo();
        if (!state.appearanceDraft.uiStyle) state.appearanceDraft.uiStyle = spDefaultUiStyle();
        state.appearanceDraft.uiStyle[part] = valid;
        const us = state.appearanceDraft.uiStyle;
        us.preset = us.composer === us.chat && us.chat === us.modelSelector ? us.composer : "custom";
        markAppearanceDirty();
        renderStructure();
      }
      return;
    }
    if (action === "set-uistyle-opt") {
      const field = actionEl.getAttribute("data-field") || "";
      const val = actionEl.getAttribute("data-val") || "preset";
      if (
        field === "composerShadow" ||
        field === "userBubbleAlign" ||
        field === "agentAccentBar" ||
        field === "modelBtnStyle" ||
        field === "modelMenuDensity"
      ) {
        pushAppearanceUndo();
        if (!state.appearanceDraft.uiStyle) state.appearanceDraft.uiStyle = spDefaultUiStyle();
        state.appearanceDraft.uiStyle[field] = val;
        markAppearanceDirty();
        renderStructure();
      }
      return;
    }
    if (action === "reset-uistyle") {
      pushAppearanceUndo();
      state.appearanceDraft.uiStyle = spDefaultUiStyle();
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "reset-uistyle-fine") {
      pushAppearanceUndo();
      const cur = state.appearanceDraft.uiStyle || spDefaultUiStyle();
      state.appearanceDraft.uiStyle = Object.assign(spDefaultUiStyle(), {
        preset: cur.preset,
        composer: cur.composer,
        chat: cur.chat,
        modelSelector: cur.modelSelector,
      });
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "select-theme-preset") {
      const pid = actionEl.getAttribute("data-id") || "native";
      const pr = spFindThemePreset(pid);
      pushAppearanceUndo();
      state.appearanceDraft.presetId = pr.id;
      if (pr.id !== "custom" && pr.vars) {
        if (!state.appearanceDraft.customAccent) {
          state.appearanceDraft.accentColor = pr.vars.accentColor;
        }
        if (!state.appearanceDraft.customSidebarBg && pr.vars.sidebarBg) {
          state.appearanceDraft.sidebarBg = pr.vars.sidebarBg;
        }
        if (!state.appearanceDraft.customBorderColor && pr.vars.borderColor && /^#[0-9a-f]{6}$/i.test(pr.vars.borderColor)) {
          state.appearanceDraft.borderColor = pr.vars.borderColor;
        }
        state.appearanceDraft.canvasBg = pr.vars.canvasBg;
        state.appearanceDraft.cardBg = pr.vars.cardBg;
      }
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "pick-accent-dot") {
      const hex = actionEl.getAttribute("data-val") || "#3b82f6";
      pushAppearanceUndo();
      state.appearanceDraft.accentColor = hex.toLowerCase();
      state.appearanceDraft.customAccent = true;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "reset-custom-accent") {
      const pr = spFindThemePreset(state.appearanceDraft.presetId || "native");
      pushAppearanceUndo();
      state.appearanceDraft.customAccent = false;
      state.appearanceDraft.accentColor = (pr && pr.vars && pr.vars.accentColor) || "#3b82f6";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "reset-custom-sidebar-bg") {
      const pr = spFindThemePreset(state.appearanceDraft.presetId || "native");
      pushAppearanceUndo();
      state.appearanceDraft.customSidebarBg = false;
      state.appearanceDraft.sidebarBg = (pr && pr.vars && pr.vars.sidebarBg) || "#0f0f14";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "reset-custom-border-color") {
      const pr = spFindThemePreset(state.appearanceDraft.presetId || "native");
      pushAppearanceUndo();
      state.appearanceDraft.customBorderColor = false;
      state.appearanceDraft.borderColor = (pr && pr.vars && pr.vars.borderColor && /^#[0-9a-f]{6}$/i.test(pr.vars.borderColor))
        ? pr.vars.borderColor
        : "#262630";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-message-style") {
      const val = actionEl.getAttribute("data-val");
      pushAppearanceUndo();
      state.appearanceDraft.messageStyle = val === "solid" || val === "minimal" ? val : "glass";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-appearance-polish") {
      state.appearanceDraft.uiPolish = !state.appearanceDraft.uiPolish;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-appearance-contrast") {
      state.appearanceDraft.highContrastText = state.appearanceDraft.highContrastText === false;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-wallpaper-type") {
      const val = actionEl.getAttribute("data-val");
      state.appearanceDraft.wallpaper.type = val === "gradient" || val === "image" || val === "video" ? val : "none";
      if (val === "image" || val === "video") refreshMediaLibrary();
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-wallpaper-grad-style") {
      const val = actionEl.getAttribute("data-val");
      state.appearanceDraft.wallpaper.gradStyle = val === "radial" || val === "mesh" ? val : "linear";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-wp-drag-mode") {
      state.wpDragMode = actionEl.getAttribute("data-val") === "offset" ? "offset" : "crop";
      renderStructure();
      return;
    }
    if (action === "set-wp-fit") {
      const val = actionEl.getAttribute("data-val");
      state.appearanceDraft.wallpaper.fit = val === "contain" || val === "fill" ? val : "cover";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-wp-anchor") {
      const ax = Math.max(0, Math.min(100, Math.round(Number(actionEl.getAttribute("data-x")) || 50)));
      const ay = Math.max(0, Math.min(100, Math.round(Number(actionEl.getAttribute("data-y")) || 50)));
      state.appearanceDraft.wallpaper.posX = ax;
      state.appearanceDraft.wallpaper.posY = ay;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "wp-rotate-step") {
      const delta = Number(actionEl.getAttribute("data-delta")) || 0;
      let nextRot = (Number(state.appearanceDraft.wallpaper.rotate) || 0) + delta;
      if (nextRot > 180) nextRot -= 360;
      if (nextRot < -180) nextRot += 360;
      state.appearanceDraft.wallpaper.rotate = nextRot;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "wp-toggle-flip") {
      const axis = actionEl.getAttribute("data-axis");
      if (axis === "y") state.appearanceDraft.wallpaper.flipY = !state.appearanceDraft.wallpaper.flipY;
      else state.appearanceDraft.wallpaper.flipX = !state.appearanceDraft.wallpaper.flipX;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "wp-reset-transform") {
      const wp = state.appearanceDraft.wallpaper;
      wp.fit = "cover";
      wp.posX = 50;
      wp.posY = 50;
      wp.offsetX = 0;
      wp.offsetY = 0;
      wp.scale = 100;
      wp.rotate = 0;
      wp.flipX = false;
      wp.flipY = false;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "apply-wp-atmos") {
      const pid = actionEl.getAttribute("data-id");
      const found = WALLPAPER_ATMOS_PRESETS.find((x) => x.id === pid);
      if (found) {
        pushAppearanceUndo();
        const wp = state.appearanceDraft.wallpaper;
        wp.dim = found.dim;
        wp.blur = found.blur;
        wp.brightness = found.brightness;
        wp.contrast = found.contrast;
        wp.saturate = found.saturate;
        wp.hue = found.hue;
        wp.vignette = found.vignette;
        if (found.id === "original") {
          wp.fit = "cover";
          wp.scale = 100;
          wp.posX = 50;
          wp.posY = 50;
          wp.offsetX = 0;
          wp.offsetY = 0;
          wp.rotate = 0;
          wp.flipX = false;
          wp.flipY = false;
          wp.opacity = 85;
          wp.tintEnabled = false;
        }
        markAppearanceDirty();
        renderStructure();
      }
      return;
    }
    if (action === "select-library-media") {
      const fn = actionEl.getAttribute("data-file") || "";
      const url = actionEl.getAttribute("data-url") || "";
      const mime = actionEl.getAttribute("data-mime") || "";
      const kind = actionEl.getAttribute("data-kind") === "video" ? "video" : "image";
      if (url) {
        state.appearanceDraft.wallpaper.type = kind;
        state.appearanceDraft.wallpaper.mediaFile = fn;
        state.appearanceDraft.wallpaper.mediaUrl = url;
        state.appearanceDraft.wallpaper.mediaMime = mime;
        markAppearanceDirty();
        renderStructure();
      }
      return;
    }
    if (action === "set-corners-mode") {
      const mode = actionEl.getAttribute("data-val") === "custom" ? "custom" : "linked";
      pushAppearanceUndo();
      const c = state.appearanceDraft.corners;
      if (mode === "custom" && c.mode === "linked") {
        const v = c.all;
        c.messages = v;
        c.composer = v;
        c.buttons = v;
        c.cards = v;
        c.code = Math.min(24, v);
        c.sidebar = Math.min(24, v);
        c.overlays = v;
        c.inputs = Math.min(24, v);
      }
      c.mode = mode;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "apply-corner-preset") {
      const pid = actionEl.getAttribute("data-id");
      const pr = spGetCornerPresets().find((x) => x.id === pid);
      if (pr) {
        pushAppearanceUndo();
        const c = state.appearanceDraft.corners;
        c.mode = pr.mode === "custom" ? "custom" : "linked";
        c.all = pr.all;
        state.appearanceDraft.radius = pr.all;
        if (pr.mode === "custom") {
          c.messages = pr.messages;
          c.composer = pr.composer;
          c.buttons = pr.buttons;
          c.cards = pr.cards;
          c.code = pr.code;
          c.sidebar = pr.sidebar;
          c.overlays = pr.overlays;
          c.inputs = pr.inputs;
        } else {
          c.messages = pr.all;
          c.composer = pr.all;
          c.buttons = pr.all;
          c.cards = pr.all;
          c.code = Math.min(24, pr.all);
          c.sidebar = Math.min(24, pr.all);
          c.overlays = pr.all;
          c.inputs = Math.min(24, pr.all);
        }
        markAppearanceDirty();
        renderStructure();
      }
      return;
    }
    if (action === "sync-all-corners") {
      const c = state.appearanceDraft.corners;
      const v = c.all;
      c.messages = v;
      c.composer = v;
      c.buttons = v;
      c.cards = v;
      c.code = Math.min(24, v);
      c.sidebar = Math.min(24, v);
      c.overlays = v;
      c.inputs = Math.min(24, v);
      state.appearanceDraft.radius = v;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "select-gradient-preset") {
      const gid = actionEl.getAttribute("data-id");
      const grads = spGetGradientPresets();
      const found = grads.find((g) => g.id === gid) || grads[0];
      if (found) {
        if (state.appearanceDraft.wallpaper.type === "image" || state.appearanceDraft.wallpaper.type === "video") {
          state.appearanceDraft.wallpaper.tintEnabled = true;
        } else {
          state.appearanceDraft.wallpaper.type = "gradient";
        }
        state.appearanceDraft.wallpaper.gradientPreset = found.id;
        state.appearanceDraft.wallpaper.gradColors = found.colors.slice(0, 3);
        state.appearanceDraft.wallpaper.gradAngle = found.angle;
      }
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-wallpaper-tint") {
      state.appearanceDraft.wallpaper.tintEnabled = !state.appearanceDraft.wallpaper.tintEnabled;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-wallpaper-animated") {
      state.appearanceDraft.wallpaper.gradAnimated = !state.appearanceDraft.wallpaper.gradAnimated;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-wallpaper-autopause") {
      state.appearanceDraft.wallpaper.pauseWhenHidden = !state.appearanceDraft.wallpaper.pauseWhenHidden;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "pick-media") {
      const kind = actionEl.getAttribute("data-kind") === "video" ? "video" : "image";
      invokeIpc("agy-studio:pick-media", { kind }).then((res) => {
        if (state.destroyed) return;
        if (res && res.ok && res.mediaUrl) {
          if (res.fileName && state.tempUploadedMediaFiles.indexOf(res.fileName) === -1) {
            state.tempUploadedMediaFiles.push(res.fileName);
          }
          state.appearanceDraft.wallpaper.type = kind;
          state.appearanceDraft.wallpaper.mediaFile = res.fileName || "";
          state.appearanceDraft.wallpaper.mediaUrl = res.mediaUrl;
          state.appearanceDraft.wallpaper.mediaMime = res.mime || "";
          markAppearanceDirty();
          refreshMediaLibrary();
          setToast(tr.appMediaPickedMsg, false);
          renderStructure();
        } else if (res && !res.canceled) {
          setToast(tr.appMediaErrMsg + (res.error ? ` (${res.error})` : ""), true);
        }
      });
      return;
    }
    if (action === "clear-wallpaper-media") {
      state.appearanceDraft.wallpaper.mediaFile = "";
      state.appearanceDraft.wallpaper.mediaUrl = "";
      state.appearanceDraft.wallpaper.mediaMime = "";
      state.appearanceDraft.wallpaper.type = "none";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-greeting-enabled") {
      state.greetingDraft.enabled = !state.greetingDraft.enabled;
      state.appearanceDirty = true;
      syncTranslatorGreeting(state.greetingDraft);
      renderStructure();
      return;
    }
    if (action === "set-greeting-mode") {
      const mode = actionEl.getAttribute("data-val");
      state.greetingDraft.mode = mode === "custom" || mode === "minimal" ? mode : "time-of-day";
      state.greetingDraft.enabled = true;
      state.appearanceDirty = true;
      syncTranslatorGreeting(state.greetingDraft);
      renderStructure();
      return;
    }
    if (action === "apply-greeting-preset") {
      const pid = actionEl.getAttribute("data-id");
      const list = state.locale === "en" ? GREETING_QUICK_PRESETS.en : GREETING_QUICK_PRESETS.ru;
      const found = list.find((p) => p.id === pid);
      if (found) {
        state.greetingDraft.enabled = true;
        state.greetingDraft.mode = found.mode;
        state.greetingDraft.title = found.title;
        state.greetingDraft.subtitle = found.subtitle;
        state.appearanceDirty = true;
        syncTranslatorGreeting(state.greetingDraft);
        renderStructure();
      }
      return;
    }
    if (action === "insert-greeting-token") {
      const tok = actionEl.getAttribute("data-val") || "{name}";
      const inp = modalMountEl ? modalMountEl.querySelector('[data-greet-field="title"]') : null;
      const cur = state.greetingDraft.title || "";
      if (inp && typeof inp.selectionStart === "number" && typeof inp.selectionEnd === "number") {
        const sPos = inp.selectionStart;
        const ePos = inp.selectionEnd;
        const prefix = cur.slice(0, sPos);
        const suffix = cur.slice(ePos);
        const spacer = prefix && !/\s$/.test(prefix) ? " " : "";
        state.greetingDraft.title = (prefix + spacer + tok + suffix).slice(0, 160);
      } else {
        state.greetingDraft.title = ((cur ? cur + " " : "") + tok).slice(0, 160);
      }
      state.greetingDraft.enabled = true;
      state.appearanceDirty = true;
      syncTranslatorGreeting(state.greetingDraft);
      renderStructure();
      return;
    }
    if (action === "set-density") {
      const d = actionEl.getAttribute("data-val");
      state.appearanceDraft.typography.density = d === "compact" || d === "spacious" ? d : "comfortable";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "apply-appearance-profile") {
      if (targetEl.closest && targetEl.closest('[data-action="delete-appearance-profile"]')) return;
      const pid = actionEl.getAttribute("data-id");
      const prof = (state.settings.appearanceProfiles || []).find((p) => p.id === pid);
      if (prof && prof.appearance) {
        state.appearanceDraft = spCloneAppearance(prof.appearance);
        const nextPatch = { appearance: spCloneAppearance(prof.appearance) };
        if (prof.greeting && typeof prof.greeting === "object") {
          state.greetingDraft = spCloneGreeting(prof.greeting);
          nextPatch.greeting = spCloneGreeting(prof.greeting);
        }
        state.appearanceDirty = false;
        saveSettingsPatch(nextPatch);
      }
      return;
    }
    if (action === "delete-appearance-profile") {
      const pid = actionEl.getAttribute("data-id");
      const next = (state.settings.appearanceProfiles || []).filter((p) => p.id !== pid);
      saveSettingsPatch({ appearanceProfiles: next });
      return;
    }
    if (action === "save-appearance-profile") {
      const name = String(state.newProfileName || "").trim().slice(0, 44);
      if (!name) return;
      const id = "prof-" + Date.now();
      const next = (state.settings.appearanceProfiles || []).concat([{
        id,
        name,
        appearance: spCloneAppearance(state.appearanceDraft),
        greeting: spCloneGreeting(state.greetingDraft),
        createdAt: Date.now(),
      }]).slice(-12);
      state.newProfileName = "";
      saveSettingsPatch({ appearanceProfiles: next });
      return;
    }
    if (action === "apply-appearance") {
      const newSavedFile = state.appearanceDraft.wallpaper && state.appearanceDraft.wallpaper.mediaFile;
      state.tempUploadedMediaFiles = (state.tempUploadedMediaFiles || []).filter((f) => f && f !== newSavedFile);
      state.appearanceDirty = false;
      state.appearanceLivePreview = state.isOpen && state.activeTab === "appearance";
      saveSettingsPatch({
        appearance: spCloneAppearance(state.appearanceDraft),
        greeting: spCloneGreeting(state.greetingDraft),
      });
      cleanupTempUploadedMedia();
      state.tempUploadedMediaFiles = [];
      setToast(tr.appAppliedMsg, false);
      return;
    }
    if (action === "discard-appearance") {
      cleanupTempUploadedMedia();
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.greetingDraft = spCloneGreeting(state.settings.greeting);
      state.appearanceDirty = false;
      state.appearanceLivePreview = state.isOpen && state.activeTab === "appearance";
      applyThemeFastToHost(state.settings.appearance);
      syncTranslatorGreeting(state.settings.greeting);
      renderStructure();
      return;
    }
    if (action === "reset-appearance") {
      cleanupTempUploadedMedia();
      const defApp = spCloneAppearance(spDefaultAppearance());
      const defGreet = spCloneGreeting(null);
      state.appearanceDraft = spCloneAppearance(defApp);
      state.greetingDraft = spCloneGreeting(defGreet);
      state.appearanceDirty = false;
      state.appearanceLivePreview = state.isOpen && state.activeTab === "appearance";
      saveSettingsPatch({ appearance: defApp, greeting: defGreet });
      setToast(tr.appResetMsg, false);
      return;
    }
    if (action === "toggle-export-opt") {
      const key = actionEl.getAttribute("data-key");
      if (key && key in state.exportOpts) state.exportOpts[key] = !state.exportOpts[key];
      return;
    }
    if (action === "export-chat-zip") {
      if (state.exportBusy) return;
      const choosePath = actionEl.getAttribute("data-choose") === "1";
      state.exportBusy = true;
      state.exportError = "";
      renderStructure();
      invokeIpc("agy-studio:export-chat-zip", Object.assign({
        chatKey: state.activeChatKey || "__new__",
        title: state.activeChatTitle || "",
        modelName: state.telemetry.modelName || "",
        choosePath,
        domMessages: collectDomConversation(),
      }, state.exportOpts)).then((res) => {
        if (state.destroyed) return;
        state.exportBusy = false;
        if (res && res.ok) {
          state.exportResult = res;
          state.exportError = "";
        } else if (!res || !res.canceled) {
          state.exportError = (res && res.error) || "EXPORT_FAILED";
        }
        renderStructure();
      });
      return;
    }
    if (action === "reveal-export-file") {
      const fp = actionEl.getAttribute("data-path");
      if (fp) invokeIpc("agy-studio:reveal-file", { filePath: fp });
      return;
    }
    if (action === "reset-quota-stats") {
      invokeIpc("agy-studio:reset-quota-stats", { chatKey: state.activeChatKey || "__new__" }).then((res) => {
        if (state.destroyed) return;
        if (res && res.summary) state.quotaSummary = res.summary;
        updateLiveDom();
        renderStructure();
      });
      return;
    }
    if (action === "toggle-opt") {
      const key = actionEl.getAttribute("data-key");
      if (key) {
        const curOpt = Object.assign({}, state.settings.optimization || {});
        const nextVal = !curOpt[key];
        curOpt[key] = nextVal;
        state.settings.optimization = typeof sanitizeOptimizationSettings === "function" ? sanitizeOptimizationSettings(curOpt) : curOpt;
        const optCtrl = ensureRudexOptimizer();
        if (optCtrl) optCtrl.apply(state.settings.optimization, state.locale);
        saveSettingsPatch({ optimization: { [key]: nextVal } });
        renderStructure();
      }
      return;
    }
    if (action === "set-opt-val") {
      const key = actionEl.getAttribute("data-key");
      const rawV = actionEl.getAttribute("data-val");
      if (key && rawV !== null) {
        const val = (key === "voiceChunkMs" || key === "chromiumCacheCapMb" || key === "lsMaxProcs" || key === "lsFileWatchMaxDirs" || key === "lsMaxTrackedWorkspaces")
          ? Number(rawV)
          : rawV;
        const curOpt = Object.assign({}, state.settings.optimization || {}, { [key]: val });
        state.settings.optimization = typeof sanitizeOptimizationSettings === "function" ? sanitizeOptimizationSettings(curOpt) : curOpt;
        const optCtrl = ensureRudexOptimizer();
        if (optCtrl) optCtrl.apply(state.settings.optimization, state.locale);
        saveSettingsPatch({ optimization: { [key]: val } });
        renderStructure();
      }
      return;
    }
    if (action === "refresh-perf-diag") {
      refreshPerfDiagnostics();
      return;
    }
    if (action === "select-local-voice-model") {
      const modelId = actionEl.getAttribute("data-val") || "ru-fast";
      const curOpt = Object.assign({}, state.settings.optimization || {}, { voiceLocalModel: modelId, voiceEngine: "auto" });
      state.settings.optimization = typeof sanitizeOptimizationSettings === "function" ? sanitizeOptimizationSettings(curOpt) : curOpt;
      const optCtrl = ensureRudexOptimizer();
      if (optCtrl) optCtrl.apply(state.settings.optimization, state.locale);
      saveSettingsPatch({ optimization: { voiceLocalModel: modelId, voiceEngine: "auto" } });
      refreshLocalVoiceStatus(modelId);
      renderStructure();
      return;
    }
    if (action === "install-local-voice") {
      if (state.localVoice && state.localVoice.installing) return;
      const modelId = actionEl.getAttribute("data-model") || (state.settings.optimization && state.settings.optimization.voiceLocalModel) || "ru-fast";
      state.localVoice.installing = true;
      state.localVoice.progressPct = 2;
      state.localVoice.progressMsg = state.locale !== "en" ? "Подготовка загрузки..." : "Preparing download...";
      state.localVoice.error = "";
      renderStructure();
      invokeIpc("agy-studio:local-voice-install", { modelId }).then((res) => {
        if (state.destroyed) return;
        state.localVoice.installing = false;
        if (res && res.ok && res.status) {
          state.localVoice.status = res.status;
          state.localVoice.progressPct = 100;
          state.localVoice.progressMsg = "";
          saveSettingsPatch({ optimization: { voiceLocalModel: modelId, voiceEngine: "auto" } });
          const optCtrl = ensureRudexOptimizer();
          if (optCtrl && typeof optCtrl.setLocalVoiceReady === "function") {
            optCtrl.setLocalVoiceReady(Boolean(res.status.installed));
          }
          setToast(state.locale !== "en" ? "Модель установлена и выбрана по умолчанию" : "Model installed and set as default", false);
        } else {
          state.localVoice.error = (res && res.error) ? String(res.error) : "Install failed";
          setToast(state.localVoice.error, true);
        }
        renderStructure();
      });
      return;
    }
    if (action === "clean-caches") {
      if (state.perfDiag && state.perfDiag.busy) return;
      state.perfDiag.busy = true;
      state.perfDiag.lastMsg = "";
      renderStructure();
      invokeIpc("agy-studio:clean-caches").then((res) => {
        if (state.destroyed) return;
        state.perfDiag.busy = false;
        if (res && res.ok) {
          if (res.diagnostics) state.perfDiag.data = res.diagnostics;
          const mb = (((res.cleaned && res.cleaned.freedBytes) || 0) / (1024 * 1024)).toFixed(1);
          const cnt = (res.cleaned && res.cleaned.removedFiles) || 0;
          state.perfDiag.lastMsg = state.locale !== "en"
            ? `Очищено ${mb} МБ (${cnt} временных файлов)`
            : `Freed ${mb} MB (${cnt} temp cache files)`;
          setToast(state.perfDiag.lastMsg, false);
        }
        renderStructure();
      });
      return;
    }
    if (action === "prune-app-storage") {
      if (state.perfDiag && state.perfDiag.busy) return;
      state.perfDiag.busy = true;
      state.perfDiag.lastMsg = "";
      renderStructure();
      invokeIpc("agy-studio:prune-app-storage").then((res) => {
        if (state.destroyed) return;
        state.perfDiag.busy = false;
        if (res && res.ok) {
          if (res.diagnostics) state.perfDiag.data = res.diagnostics;
          const rk = (res.pruned && res.pruned.removedKeys) || 0;
          const kb = (((res.pruned && res.pruned.freedBytes) || 0) / 1024).toFixed(1);
          state.perfDiag.lastMsg = state.locale !== "en"
            ? (rk > 0 ? `Удалено мёртвых макетов: ${rk} (-${kb} КБ)` : "app_storage.json уже оптимизирован")
            : (rk > 0 ? `Removed ${rk} stale layout keys (-${kb} KB)` : "app_storage.json is already clean");
          setToast(state.perfDiag.lastMsg, false);
        }
        renderStructure();
      });
    }
  }

  function handleAppearanceFieldInput(target) {
    const field = target.getAttribute("data-app-field");
    if (!field) return false;
    const rawVal = target.value;
    const tr = t();
    const draft = state.appearanceDraft;
    let labelText = null;
    let needsRerenderDots = false;

    if (field === "accentColor") {
      draft.accentColor = String(rawVal || "#3b82f6").toLowerCase();
      draft.customAccent = true;
      needsRerenderDots = true;
      if (modalMountEl) {
        const hEl = modalMountEl.querySelector('[data-app-hex-field="accentColor"]');
        if (hEl) hEl.value = draft.accentColor;
      }
    } else if (field === "canvasBg" || field === "cardBg") {
      draft[field] = String(rawVal || "#09090b").toLowerCase();
      draft.presetId = "custom";
      needsRerenderDots = true;
      if (modalMountEl) {
        const hEl = modalMountEl.querySelector(`[data-app-hex-field="${field}"]`);
        if (hEl) hEl.value = draft[field];
      }
    } else if (field === "sidebarBg") {
      draft.sidebarBg = String(rawVal || "#0f0f14").toLowerCase();
      draft.customSidebarBg = true;
      if (modalMountEl) {
        const hEl = modalMountEl.querySelector('[data-app-hex-field="sidebarBg"]');
        if (hEl) hEl.value = draft.sidebarBg;
      }
    } else if (field === "borderColor") {
      draft.borderColor = String(rawVal || "#262630").toLowerCase();
      draft.customBorderColor = true;
      if (modalMountEl) {
        const hEl = modalMountEl.querySelector('[data-app-hex-field="borderColor"]');
        if (hEl) hEl.value = draft.borderColor;
      }
    } else if (field === "glassOpacity" || field === "sidebarOpacity" || field === "glassBlur" || field === "radius" || field === "messageCardOpacity" || field === "borderStrength") {
      const n = Math.round(Number(rawVal) || 0);
      draft[field] = n;
      if (field === "radius" && draft.corners) draft.corners.all = n;
      labelText = (field === "glassBlur" || field === "radius") ? `${n}px` : `${n}%`;
    } else if (field.startsWith("corners.")) {
      const sub = field.split(".")[1];
      const n = Math.round(Number(rawVal) || 0);
      if (!draft.corners) draft.corners = spDefaultAppearance().corners;
      draft.corners[sub] = n;
      if (sub === "all") draft.radius = n;
      labelText = `${n}px`;
      updateLiveCornersPreviewDom();
    } else if (field.startsWith("studioUi.")) {
      const sub = field.split(".")[1];
      if (sub === "widgetFont" || sub === "widgetFontCustom") {
        const strVal = String(rawVal || (sub === "widgetFont" ? "inherit" : "")).trim();
        const uiPatch = { [sub]: strVal };
        state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, uiPatch));
        syncTheme();
        if (sub === "widgetFont") {
          flushDebouncedSettingsSave("studioUi", { studioUi: uiPatch });
          renderStructure();
        } else {
          scheduleDebouncedSettingsSave("studioUi", { studioUi: uiPatch }, 220);
        }
        return true;
      }
      const rawNum = Number(rawVal) || 0;
      const val = sub === "widgetRadius" && rawNum >= 25 ? 999 : Math.round(rawNum);
      const uiPatch = { [sub]: val };
      if (sub === "widgetZoom") uiPatch.widgetScale = widgetZoomToBucket(val);
      state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, uiPatch));
      syncTheme();
      const pctFields = sub === "widgetOpacity" || sub === "appScale" || sub === "studioScale" || sub === "widgetZoom";
      const suiLabel = pctFields
        ? `${val}%`
        : (sub === "widgetRadius" && val >= 999 ? tr.widgetRadiusPill : `${val}px`);
      if (modalMountEl) {
        setLiveSlot(modalMountEl, `[data-live-app-val="${field}"]`, suiLabel, false);
        if (sub === "widgetZoom") {
          const bucket = widgetZoomToBucket(val);
          const scBtns = modalMountEl.querySelectorAll('[data-action="set-widget-scale"]');
          for (let i = 0; i < scBtns.length; i += 1) {
            if (scBtns[i].classList) scBtns[i].classList.toggle("is-active", scBtns[i].getAttribute("data-val") === bucket);
          }
        }
        if (sub === "appScale") {
          const appBtns = modalMountEl.querySelectorAll('[data-action="set-app-scale"]');
          for (let i = 0; i < appBtns.length; i += 1) {
            if (appBtns[i].classList) appBtns[i].classList.toggle("btn-primary", Number(appBtns[i].getAttribute("data-val")) === val);
          }
        }
      }
      scheduleDebouncedSettingsSave("studioUi", { studioUi: uiPatch }, 160);
      return true;
    } else if (field === "wallpaper.gradColor0" || field === "wallpaper.gradColor1" || field === "wallpaper.gradColor2") {
      const idx = parseInt(field.slice(-1), 10);
      if (draft.wallpaper.type === "image" || draft.wallpaper.type === "video") {
        draft.wallpaper.tintEnabled = true;
      } else {
        draft.wallpaper.type = "gradient";
      }
      draft.wallpaper.gradColors[idx] = String(rawVal || "#0f172a").toLowerCase();
      updateLiveWallpaperPreviewDom();
    } else if (field === "wallpaper.tintBlend") {
      draft.wallpaper.tintBlend = String(rawVal || "normal");
      updateLiveWallpaperPreviewDom();
    } else if (field === "wallpaper.gradAngle") {
      const n = Math.round(Number(rawVal) || 0);
      draft.wallpaper.gradAngle = n;
      labelText = `${n}°`;
    } else if (field === "wallpaper.gradSpeed") {
      const n = Math.round(Number(rawVal) || 18);
      draft.wallpaper.gradSpeed = n;
      labelText = `${n}s`;
    } else if (field === "wallpaper.playbackRate") {
      const n = Math.round((Number(rawVal) || 1) * 100) / 100;
      draft.wallpaper.playbackRate = n;
      labelText = `${n}x`;
      updateLiveWallpaperPreviewDom();
    } else if (
      field === "wallpaper.dim" ||
      field === "wallpaper.blur" ||
      field === "wallpaper.opacity" ||
      field === "wallpaper.brightness" ||
      field === "wallpaper.contrast" ||
      field === "wallpaper.saturate" ||
      field === "wallpaper.hue" ||
      field === "wallpaper.scale" ||
      field === "wallpaper.rotate" ||
      field === "wallpaper.posX" ||
      field === "wallpaper.posY" ||
      field === "wallpaper.offsetX" ||
      field === "wallpaper.offsetY" ||
      field === "wallpaper.vignette" ||
      field === "wallpaper.tintOpacity"
    ) {
      const sub = field.split(".")[1];
      const n = Math.round(Number(rawVal) || 0);
      draft.wallpaper[sub] = n;
      if (sub === "blur") labelText = `${n}px`;
      else if (sub === "rotate" || sub === "hue") labelText = `${n}°`;
      else labelText = `${n}%`;
      updateLiveWallpaperPreviewDom();
    } else if (
      field === "typography.uiFont" ||
      field === "typography.monoFont" ||
      field === "typography.inputFont" ||
      field === "typography.userMsgFont" ||
      field === "typography.agentFont" ||
      field === "typography.thinkingFont"
    ) {
      const sub = field.split(".")[1];
      pushAppearanceUndo();
      draft.typography[sub] = String(rawVal || "system");
      markAppearanceDirty();
      renderStructure();
      return true;
    } else if (
      field === "typography.uiFontCustom" ||
      field === "typography.inputFontCustom" ||
      field === "typography.userMsgFontCustom" ||
      field === "typography.agentFontCustom" ||
      field === "typography.thinkingFontCustom" ||
      field === "typography.monoFontCustom"
    ) {
      const sub = field.split(".")[1];
      draft.typography[sub] = String(rawVal || "").slice(0, 64);
      markAppearanceDirty();
      return true;
    } else if (
      field === "typography.uiFontSize" ||
      field === "typography.inputFontSize" ||
      field === "typography.agentFontSize" ||
      field === "typography.codeFontSize"
    ) {
      const sub = field.split(".")[1];
      const n = Math.round(Number(rawVal) || 0);
      const isUiOrCode = sub === "uiFontSize" || sub === "codeFontSize";
      const minActive = isUiOrCode ? 11 : 12;
      draft.typography[sub] = n >= minActive ? n : 0;
      const isRu = state.locale !== "en";
      labelText = draft.typography[sub] > 0
        ? `${draft.typography[sub]}px`
        : (isUiOrCode ? (isRu ? "Авто" : "Auto") : (isRu ? "Как чат" : "Default"));
    } else if (field === "typography.fontSize") {
      const n = Math.round(Number(rawVal) || 14);
      draft.typography.fontSize = n;
      labelText = `${n}px`;
      if (modalMountEl) {
        const ph = modalMountEl.querySelector('[data-live="typoPreviewHead"]');
        const pb = modalMountEl.querySelector('[data-live="typoPreviewBody"]');
        if (ph) ph.style.fontSize = `${Math.min(18, n + 1)}px`;
        if (pb) pb.style.fontSize = `${n}px`;
      }
    } else if (field === "typography.lineHeight") {
      const n = Math.round((Number(rawVal) || 1.55) * 100) / 100;
      draft.typography.lineHeight = n;
      labelText = String(n);
      if (modalMountEl) {
        const pb = modalMountEl.querySelector('[data-live="typoPreviewBody"]');
        if (pb) pb.style.lineHeight = String(n);
      }
    } else if (field === "typography.chatMaxWidth") {
      const n = Math.round(Number(rawVal) || 0);
      draft.typography.chatMaxWidth = n < 680 ? 0 : n;
      labelText = draft.typography.chatMaxWidth >= 680 ? `${draft.typography.chatMaxWidth}px` : tr.appChatWidthAuto;
    } else if (field.startsWith("uiStyle.")) {
      const sub = field.split(".")[1];
      const n = Math.round(Number(rawVal) || 0);
      const autoLbl = state.locale !== "en" ? "По стилю" : "Preset";
      if (!draft.uiStyle) draft.uiStyle = spDefaultUiStyle();
      if (sub === "composerRadius") {
        draft.uiStyle.composerRadius = n < 4 ? 0 : Math.min(32, n);
        labelText = draft.uiStyle.composerRadius > 0 ? `${draft.uiStyle.composerRadius}px` : autoLbl;
      } else if (sub === "composerMaxWidth") {
        draft.uiStyle.composerMaxWidth = n < 560 ? 0 : Math.min(1120, n);
        labelText = draft.uiStyle.composerMaxWidth >= 560 ? `${draft.uiStyle.composerMaxWidth}px` : autoLbl;
      } else if (sub === "composerPadY") {
        draft.uiStyle.composerPadY = n < 6 ? 0 : Math.min(24, n);
        labelText = draft.uiStyle.composerPadY >= 6 ? `${draft.uiStyle.composerPadY}px` : autoLbl;
      } else if (sub === "userBubbleMaxWidth") {
        draft.uiStyle.userBubbleMaxWidth = n < 45 ? 0 : Math.min(100, n);
        labelText = draft.uiStyle.userBubbleMaxWidth >= 45 ? `${draft.uiStyle.userBubbleMaxWidth}%` : autoLbl;
      } else if (sub === "chatGap") {
        draft.uiStyle.chatGap = n < 4 ? 0 : Math.min(28, n);
        labelText = draft.uiStyle.chatGap >= 4 ? `${draft.uiStyle.chatGap}px` : autoLbl;
      } else {
        return false;
      }
      updateLiveUiStylePreviewDom();
    } else {
      return false;
    }

    markAppearanceDirty();
    if (labelText !== null && modalMountEl) {
      setLiveSlot(modalMountEl, `[data-live-app-val="${field}"]`, labelText, false);
    }
    if (needsRerenderDots && modalMountEl) {
      const cards = modalMountEl.querySelectorAll(".theme-card");
      for (let i = 0; i < cards.length; i += 1) {
        cards[i].classList.toggle("is-selected", cards[i].getAttribute("data-id") === draft.presetId);
      }
      const dots = modalMountEl.querySelectorAll(".accent-dot-btn");
      for (let i = 0; i < dots.length; i += 1) {
        dots[i].classList.toggle("is-selected", dots[i].getAttribute("data-val") === draft.accentColor);
      }
    }
    return true;
  }

  function cancelPendingResizeHold(st, el) {
    if (!st) return;
    if (st.holdTimer && win && typeof win.clearTimeout === "function") {
      try { win.clearTimeout(st.holdTimer); } catch (_e) {}
      st.holdTimer = null;
    }
    if (el && el.classList && typeof el.classList.remove === "function") {
      el.classList.remove("is-resize-holding");
      el.classList.remove("is-resizing");
    }
  }

  function handlePointerDown(e) {
    if (!widgetMountEl || !e || (typeof e.button === "number" && e.button !== 0)) return;
    const tEl = e.target;
    if (!tEl || typeof tEl.closest !== "function") return;
    if (tEl.closest('[data-no-drag="1"]') || tEl.closest("button")) return;

    if (state.settings.pinned) {
      const body = tEl.closest('[data-widget-body="1"]');
      if (!body) return;
      if (widgetResizeState) {
        cancelPendingResizeHold(widgetResizeState, widgetMountEl);
        widgetResizeState = null;
      }
      if (typeof widgetMountEl.setPointerCapture === "function" && e.pointerId !== undefined) {
        try { widgetMountEl.setPointerCapture(e.pointerId); } catch (_e) {}
      }
      const rect = typeof widgetMountEl.getBoundingClientRect === "function"
        ? widgetMountEl.getBoundingClientRect()
        : { left: 900, top: 700, width: 240, height: 40 };
      const vw = win && win.innerWidth ? win.innerWidth : 1280;
      const vh = win && win.innerHeight ? win.innerHeight : 800;
      const sui = spNormalizeStudioUi(state.settings.studioUi);
      const st = {
        pointerId: e.pointerId,
        downX: e.clientX,
        downY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        startZoom: sui.widgetZoom,
        currentZoom: sui.widgetZoom,
        signX: (rect.left + rect.width / 2) > vw / 2 ? -1 : 1,
        signY: (rect.top + rect.height / 2) > vh / 2 ? -1 : 1,
        armed: false,
        moved: false,
        holdTimer: null,
      };
      widgetResizeState = st;
      if (widgetMountEl.classList && typeof widgetMountEl.classList.add === "function") {
        widgetMountEl.classList.add("is-resize-holding");
      }
      const armWidgetResize = () => {
        if (widgetResizeState !== st || state.destroyed || !widgetMountEl) return;
        st.holdTimer = null;
        st.armed = true;
        st.startX = st.lastX;
        st.startY = st.lastY;
        if (widgetMountEl.classList) {
          if (typeof widgetMountEl.classList.remove === "function") widgetMountEl.classList.remove("is-resize-holding");
          if (typeof widgetMountEl.classList.add === "function") widgetMountEl.classList.add("is-resizing");
        }
        const hud = typeof widgetMountEl.querySelector === "function" ? widgetMountEl.querySelector('[data-role="widgetResizeHud"]') : null;
        if (hud) hud.textContent = `${st.currentZoom}%`;
      };
      if (win && typeof win.setTimeout === "function") {
        st.holdTimer = win.setTimeout(armWidgetResize, RESIZE_HOLD_MS);
      } else {
        st.holdTimer = setTimeout(armWidgetResize, RESIZE_HOLD_MS);
      }
      return;
    }

    const handle = tEl.closest('[data-drag-handle="1"]');
    if (!handle) return;

    if (typeof widgetMountEl.setPointerCapture === "function" && e.pointerId !== undefined) {
      try { widgetMountEl.setPointerCapture(e.pointerId); } catch (_e) {}
    }

    const rect = measureWidgetBoxRect() || { left: 16, top: 16, width: 220, height: 36 };
    dragState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      width: rect.width || 220,
      height: rect.height || 36,
      lastX: rect.left,
      lastY: rect.top,
      moved: false,
    };
  }

  function handlePointerMove(e) {
    if (studioResizeState) {
      const st = studioResizeState;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      if (!st.armed) {
        if (Math.hypot(e.clientX - st.downX, e.clientY - st.downY) > RESIZE_CANCEL_MOVE_PX) {
          const sh = modalMountEl ? modalMountEl.querySelector(".modal-shell") : null;
          cancelPendingResizeHold(st, sh);
          studioResizeState = null;
        }
        return;
      }
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      if (!st.moved && Math.hypot(dx, dy) < 4) return;
      st.moved = true;
      const maxScale = getMaxSafeStudioScale();
      const nextScale = Math.max(75, Math.min(maxScale, Math.round(st.startScale + (dx + dy) * 0.25)));
      st.currentScale = nextScale;
      state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, { studioScale: nextScale }));
      syncTheme();
      if (modalMountEl) {
        const sh = modalMountEl.querySelector(".modal-shell");
        if (sh && sh.classList && typeof sh.classList.add === "function") sh.classList.add("is-resizing");
        const hud = modalMountEl.querySelector('[data-role="studioResizeHud"]');
        if (hud) hud.textContent = `${nextScale}%`;
        setLiveSlot(modalMountEl, '[data-live-app-val="studioUi.studioScale"]', `${nextScale}%`, false);
        const inp = modalMountEl.querySelector('[data-app-field="studioUi.studioScale"]');
        if (inp) inp.value = String(nextScale);
      }
      return;
    }
    if (widgetResizeState && widgetMountEl) {
      const st = widgetResizeState;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      if (!st.armed) {
        if (Math.hypot(e.clientX - st.downX, e.clientY - st.downY) > RESIZE_CANCEL_MOVE_PX) {
          cancelPendingResizeHold(st, widgetMountEl);
          widgetResizeState = null;
        }
        return;
      }
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      if (!st.moved && Math.hypot(dx, dy) < 4) return;
      st.moved = true;
      if (widgetMountEl.classList && typeof widgetMountEl.classList.add === "function") widgetMountEl.classList.add("is-resizing");
      const delta = dx * st.signX * 0.75 + dy * st.signY * 0.75;
      const maxZoom = getMaxSafeWidgetZoom();
      const nextZoom = Math.max(70, Math.min(maxZoom, Math.round(st.startZoom + delta * 0.45)));
      const nextBucket = widgetZoomToBucket(nextZoom);
      st.currentZoom = nextZoom;
      state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, { widgetZoom: nextZoom, widgetScale: nextBucket }));
      syncTheme();
      clampWidgetToViewport();
      renderLimitsWidgetMount();
      const hud = typeof widgetMountEl.querySelector === "function" ? widgetMountEl.querySelector('[data-role="widgetResizeHud"]') : null;
      if (hud) hud.textContent = `${nextZoom}%`;
      if (modalMountEl) {
        setLiveSlot(modalMountEl, '[data-live-app-val="studioUi.widgetZoom"]', `${nextZoom}%`, false);
        const inp = modalMountEl.querySelector('[data-app-field="studioUi.widgetZoom"]');
        if (inp) inp.value = String(nextZoom);
      }
      return;
    }
    if (wpDragState && modalMountEl) {
      const wp = state.appearanceDraft.wallpaper;
      const dxPct = ((e.clientX - wpDragState.startX) / Math.max(40, wpDragState.width)) * 100;
      const dyPct = ((e.clientY - wpDragState.startY) / Math.max(40, wpDragState.height)) * 100;
      if (state.wpDragMode === "offset") {
        wp.offsetX = Math.max(-50, Math.min(50, Math.round(wpDragState.startOffX + dxPct)));
        wp.offsetY = Math.max(-50, Math.min(50, Math.round(wpDragState.startOffY + dyPct)));
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.offsetX"]', `${wp.offsetX}%`, false);
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.offsetY"]', `${wp.offsetY}%`, false);
        const rx = modalMountEl.querySelector('[data-app-field="wallpaper.offsetX"]');
        const ry = modalMountEl.querySelector('[data-app-field="wallpaper.offsetY"]');
        if (rx) rx.value = String(wp.offsetX);
        if (ry) ry.value = String(wp.offsetY);
      } else {
        wp.posX = Math.max(0, Math.min(100, Math.round(wpDragState.startPosX - dxPct)));
        wp.posY = Math.max(0, Math.min(100, Math.round(wpDragState.startPosY - dyPct)));
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.posX"]', `${wp.posX}%`, false);
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.posY"]', `${wp.posY}%`, false);
        const rx = modalMountEl.querySelector('[data-app-field="wallpaper.posX"]');
        const ry = modalMountEl.querySelector('[data-app-field="wallpaper.posY"]');
        if (rx) rx.value = String(wp.posX);
        if (ry) ry.value = String(wp.posY);
      }
      markAppearanceDirty();
      updateLiveWallpaperPreviewDom();
      return;
    }
    if (limitsResizeState && limitsMountEl) {
      const rs = limitsResizeState;
      const dx = e.clientX - rs.startX;
      const dy = e.clientY - rs.startY;
      if (!rs.moved && Math.hypot(dx, dy) < 4) return;
      rs.moved = true;
      limitsLiveEditUntil = Date.now() + 900;
      if (limitsMountEl.classList && typeof limitsMountEl.classList.add === "function") {
        limitsMountEl.classList.add("is-resizing");
      }
      const boxEl = typeof limitsMountEl.querySelector === "function" ? limitsMountEl.querySelector(".rx-limits-box") : null;
      const lw = typeof rv5NormalizeLimitsWidget === "function"
        ? rv5NormalizeLimitsWidget(state.settings.limitsWidget)
        : Object.assign({}, state.settings.limitsWidget);
      if (rs.mode === "scale") {
        const delta = (dx * rs.signX + dy * rs.signY) * 0.45;
        const nextScale = Math.max(70, Math.min(160, Math.round((rs.startScale + delta) / 5) * 5));
        rs.currentScale = nextScale;
        lw.scale = nextScale;
        state.settings.limitsWidget = lw;
        if (boxEl && boxEl.style) boxEl.style.zoom = (nextScale / 100).toFixed(2);
        if (modalMountEl) {
          setLiveSlot(modalMountEl, '[data-live-lim-val="scale"]', `${nextScale}%`, false);
          const inp = modalMountEl.querySelector('[data-limits-field="scale"]');
          if (inp) inp.value = String(nextScale);
        }
      } else {
        const nextW = Math.max(180, Math.min(420, Math.round((rs.startWidth + dx * rs.signX) / 5) * 5));
        rs.currentWidth = nextW;
        lw.width = nextW;
        state.settings.limitsWidget = lw;
        if (boxEl && boxEl.style) {
          boxEl.style.width = `${nextW}px`;
          boxEl.style.minWidth = `${nextW}px`;
          boxEl.style.maxWidth = `${nextW}px`;
        }
        limitsMountEl.style.maxWidth = "";
        if (modalMountEl) {
          setLiveSlot(modalMountEl, '[data-live-lim-val="width"]', `${nextW}px`, false);
          const inp = modalMountEl.querySelector('[data-limits-field="width"]');
          if (inp) inp.value = String(nextW);
        }
      }
      return;
    }
    if (limitsDragState && limitsMountEl) {
      const dx = e.clientX - limitsDragState.startX;
      const dy = e.clientY - limitsDragState.startY;
      if (!limitsDragState.moved && Math.hypot(dx, dy) < 5) return;
      limitsDragState.moved = true;
      const vw = (win && win.innerWidth) || 1280;
      const vh = (win && win.innerHeight) || 800;
      const maxX = Math.max(8, vw - (limitsDragState.width || 220) - 8);
      const maxY = Math.max(8, vh - (limitsDragState.height || 60) - 8);
      const nx = Math.max(8, Math.min(maxX, Math.round(limitsDragState.origLeft + dx)));
      const ny = Math.max(8, Math.min(maxY, Math.round(limitsDragState.origTop + dy)));
      limitsDragState.lastX = nx;
      limitsDragState.lastY = ny;
      limitsMountEl.className = "rx-limits-mount is-dragging";
      limitsMountEl.style.left = `${nx}px`;
      limitsMountEl.style.top = `${ny}px`;
      limitsMountEl.style.right = "";
      limitsMountEl.style.bottom = "";
      return;
    }
    if (!dragState || !widgetMountEl || state.settings.pinned) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) < 6) return;

    if (!dragState.moved) {
      dragState.moved = true;
      widgetMountEl.className = "widget-wrap is-dragging";
      widgetMountEl.style.right = "";
      widgetMountEl.style.bottom = "";
    }
    const vw = win && win.innerWidth ? win.innerWidth : 1280;
    const vh = win && win.innerHeight ? win.innerHeight : 800;
    const maxX = Math.max(8, vw - dragState.width - 8);
    const maxY = Math.max(8, vh - dragState.height - 8);
    const nextX = Math.min(maxX, Math.max(8, Math.round(dragState.origLeft + dx)));
    const nextY = Math.min(maxY, Math.max(8, Math.round(dragState.origTop + dy)));
    dragState.lastX = nextX;
    dragState.lastY = nextY;
    widgetMountEl.style.left = `${nextX}px`;
    widgetMountEl.style.top = `${nextY}px`;
    positionPopover();
  }

  function handlePointerUp() {
    if (studioResizeState) {
      const st = studioResizeState;
      studioResizeState = null;
      const sh = modalMountEl ? modalMountEl.querySelector(".modal-shell") : null;
      cancelPendingResizeHold(st, sh);
      if (st.gripEl && typeof st.gripEl.releasePointerCapture === "function" && st.pointerId !== undefined) {
        try { st.gripEl.releasePointerCapture(st.pointerId); } catch (_e) {}
      }
      if (st.armed && (st.moved || st.currentScale !== st.startScale)) {
        saveSettingsPatch({ studioUi: { studioScale: st.currentScale } });
      }
      return;
    }
    if (widgetResizeState) {
      const st = widgetResizeState;
      widgetResizeState = null;
      cancelPendingResizeHold(st, widgetMountEl);
      if (widgetMountEl && typeof widgetMountEl.releasePointerCapture === "function" && st.pointerId !== undefined) {
        try { widgetMountEl.releasePointerCapture(st.pointerId); } catch (_e) {}
      }
      if (st.armed) {
        lastDragEndedAt = Date.now();
        if (st.moved || st.currentZoom !== st.startZoom) {
          saveSettingsPatch({ studioUi: { widgetZoom: st.currentZoom, widgetScale: widgetZoomToBucket(st.currentZoom) } });
        }
      }
      return;
    }
    if (wpDragState) {
      const stageEl = wpDragState.stageEl;
      const pid = wpDragState.pointerId;
      wpDragState = null;
      if (stageEl) {
        if (stageEl.classList && typeof stageEl.classList.remove === "function") stageEl.classList.remove("is-dragging");
        if (typeof stageEl.releasePointerCapture === "function" && pid !== undefined) {
          try { stageEl.releasePointerCapture(pid); } catch (_e) {}
        }
      }
    }
    if (limitsResizeState) {
      const rs = limitsResizeState;
      limitsResizeState = null;
      if (limitsMountEl) {
        if (limitsMountEl.classList && typeof limitsMountEl.classList.remove === "function") limitsMountEl.classList.remove("is-resizing");
        if (typeof limitsMountEl.releasePointerCapture === "function" && rs.pointerId !== undefined) {
          try { limitsMountEl.releasePointerCapture(rs.pointerId); } catch (_e) {}
        }
      }
      if (rs.moved) {
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        if (rs.mode === "scale") lw.scale = rs.currentScale;
        else lw.width = rs.currentWidth;
        state.settings.limitsWidget = lw;
        renderLimitsWidgetMount();
        if (modalMountEl) {
          const prevStage = modalMountEl.querySelector('[data-role="limitsPreviewStage"]') || modalMountEl.querySelector(".preview-stage");
          if (prevStage && typeof rv5BuildLimitsWidgetHtml === "function") {
            prevStage.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, state.telemetry.modelName || "", state.locale !== "en", true);
          }
        }
        flushDebouncedSettingsSave("limits", { limitsWidget: lw });
      }
      return;
    }
    if (limitsDragState) {
      const ls = limitsDragState;
      limitsDragState = null;
      if (limitsMountEl) {
        if (limitsMountEl.classList && typeof limitsMountEl.classList.remove === "function") limitsMountEl.classList.remove("is-dragging");
        if (typeof limitsMountEl.releasePointerCapture === "function" && ls.pointerId !== undefined) {
          try { limitsMountEl.releasePointerCapture(ls.pointerId); } catch (_e) {}
        }
      }
      if (ls.moved) {
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        lw.position = "floating";
        lw.pinned = false;
        lw.floatX = ls.lastX;
        lw.floatY = ls.lastY;
        saveSettingsPatch({ limitsWidget: lw });
      }
      return;
    }
    if (!dragState) return;
    const wasMoved = dragState.moved;
    const finalX = dragState.lastX;
    const finalY = dragState.lastY;
    const pid = dragState.pointerId;
    dragState = null;
    if (widgetMountEl && typeof widgetMountEl.releasePointerCapture === "function" && pid !== undefined) {
      try { widgetMountEl.releasePointerCapture(pid); } catch (_e) {}
    }
    if (wasMoved && widgetMountEl) {
      lastDragEndedAt = Date.now();
      if (widgetMountEl.classList && typeof widgetMountEl.classList.remove === "function") {
        widgetMountEl.classList.remove("is-dragging");
      }
      saveSettingsPatch({ layoutMode: "floating", floatX: finalX, floatY: finalY });
    }
  }

  function attachDomEvents() {
    if (!rootEl) return;
    rootEl.addEventListener("toggle", (e) => {
      const target = e && e.target;
      if (!target || typeof target.getAttribute !== "function") return;
      const key = target.getAttribute("data-disc");
      if (key) state.openDisclosures[key] = Boolean(target.open);
    }, true);

    rootEl.addEventListener("click", (e) => {
      const target = e ? e.target : null;
      if (!target) return;
      if (typeof target.closest === "function") {
        if (target.closest("[data-action]") || target.closest("button") || target.closest('[data-no-drag="1"]')) {
          handleActionClick(target);
          return;
        }
        if (target.closest('[data-widget-body="1"]') && Date.now() - lastDragEndedAt > 250) {
          lastBodyClickAt = 0;
          setOpen(true);
          return;
        }
      }
      handleActionClick(target);
    });

    rootEl.addEventListener("input", (e) => {
      const target = e.target;
      if (!target || typeof target.getAttribute !== "function") return;
      if (String(target.tagName || "").toUpperCase() === "SELECT") return;
      if (handleAppearanceFieldInput(target)) return;
      const gf = target.getAttribute("data-greet-field");
      if (gf) {
        const wasOff = !state.greetingDraft.enabled;
        state.greetingDraft[gf] = target.value || "";
        state.greetingDraft.enabled = true;
        state.appearanceDirty = true;
        syncTranslatorGreeting(state.greetingDraft);
        updateGreetingLivePreview();
        if (wasOff && modalMountEl) {
          const sw = modalMountEl.querySelector('[data-action="toggle-greeting-enabled"]');
          if (sw) {
            sw.className = "switch is-on";
            sw.setAttribute("aria-checked", "true");
          }
        }
        return;
      }
      const role = target.getAttribute("data-role");
      if (role === "personaEditor") {
        state.draftPersonaText = target.value || "";
        state.draftDirty = true;
        const counter = modalMountEl ? modalMountEl.querySelector('[data-role="byteCounter"]') : null;
        if (counter) {
          const bytes = utf8ByteLength(state.draftPersonaText);
          const estTok = spTokenEst(state.draftPersonaText);
          const warn = bytes >= 20000;
          const tr = t();
          counter.textContent = `${bytes.toLocaleString()} / ${MAX_PERSONA_BODY_BYTES.toLocaleString()} ${tr.personaBytes} · ~${estTok.toLocaleString()} ${tr.tokShort}${warn ? " · " + tr.personaLimitWarn : ""}`;
          counter.style.color = warn ? "var(--rx-warning)" : "var(--rx-muted)";
        }
      } else if (role === "newPresetInput") {
        state.newPresetName = target.value || "";
      } else if (role === "newProfileInput") {
        state.newProfileName = target.value || "";
      } else if (role === "settingsSearch") {
        state.settingsSearchQuery = target.value || "";
        const hitsHtml = buildSearchHitsHtml(state.settingsSearchQuery, state.locale !== "en");
        const hasVal = Boolean(state.settingsSearchQuery.trim());
        if (modalMountEl) {
          const hitsBoxes = modalMountEl.querySelectorAll('[data-role="searchHits"]');
          for (let i = 0; i < hitsBoxes.length; i += 1) hitsBoxes[i].innerHTML = hitsHtml;
          const clearBtns = modalMountEl.querySelectorAll('[data-role="searchClear"]');
          for (let i = 0; i < clearBtns.length; i += 1) {
            if (clearBtns[i].classList) clearBtns[i].classList.toggle("is-shown", hasVal);
          }
        }
        return;
      } else if (role === "historySearch") {
        state.historySearchQuery = target.value || "";
        if (modalMountEl) {
          const qLow = state.historySearchQuery.trim().toLowerCase();
          const cards = modalMountEl.querySelectorAll('[data-role="historyList"] .rx-hist-card');
          let visibleCount = 0;
          for (let i = 0; i < cards.length; i += 1) {
            const hay = cards[i].getAttribute("data-hist-search") || "";
            const show = !qLow || hay.includes(qLow);
            cards[i].style.display = show ? "" : "none";
            if (show) visibleCount += 1;
          }
          const cntEl = modalMountEl.querySelector('[data-role="historyCount"]');
          if (cntEl) {
            const total = Number(cntEl.getAttribute("data-total")) || cards.length;
            cntEl.textContent = state.locale !== "en"
              ? `Последние сообщения (${visibleCount} / ${total})`
              : `Recent messages (${visibleCount} / ${total})`;
          }
          const emptyEl = modalMountEl.querySelector('[data-role="historyFilterEmpty"]');
          if (emptyEl) {
            emptyEl.style.display = cards.length > 0 && visibleCount === 0 ? "" : "none";
          }
        }
        return;
      } else if (role === "newLabelMatch") {
        state.newLabelMatch = target.value || "";
      } else if (role === "newLabelText") {
        state.newLabelText = target.value || "";
      } else if (role === "newAgentPresetName") {
        state.newAgentPresetName = target.value || "";
      } else if (role === "liveEditInput") {
        state.liveEditDraftText = target.value || "";
        const canSend = Boolean(state.liveEditDraftText.trim() || (state.liveEditDraftImages && state.liveEditDraftImages.length > 0)) && !state.liveEditBusy;
        const sendBtns = rootEl.querySelectorAll('[data-action="send-live-edit"]');
        for (let b = 0; b < sendBtns.length; b += 1) {
          sendBtns[b].disabled = !canSend;
        }
      }
      const optField = target.getAttribute("data-opt-field");
      if (optField === "voiceCustomLangs") {
        const curOpt = Object.assign({}, state.settings.optimization || {}, { voiceCustomLangs: target.value || "" });
        state.settings.optimization = typeof sanitizeOptimizationSettings === "function" ? sanitizeOptimizationSettings(curOpt) : curOpt;
        const optCtrl = ensureRudexOptimizer();
        if (optCtrl) optCtrl.apply(state.settings.optimization, state.locale);
        scheduleDebouncedSettingsSave("optVoiceLangs", { optimization: { voiceCustomLangs: target.value || "" } }, 220);
        return;
      }
      const sysField = target.getAttribute("data-sys-field");
      if (sysField === "thinkingTranslatorUrl") {
        const val = String(target.value || "").trim();
        state.settings.thinkingTranslatorUrl = val;
        scheduleDebouncedSettingsSave("thinkingTranslatorUrl", { thinkingTranslatorUrl: val }, 260);
        return;
      }
      const lf = target.getAttribute("data-limits-field");
      if (lf) {
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        if (lf === "fontSize" || lf === "scale" || lf === "bgOpacity" || lf === "borderRadius" || lf === "blur" || lf === "width") {
          const numV = Math.round(Number(target.value) || 0);
          lw[lf] = lf === "width" && numV < 180 ? 0 : numV;
          state.settings.limitsWidget = lw;
          renderLimitsWidgetMount();
          if (modalMountEl) {
            const lbl = lf === "scale" || lf === "bgOpacity"
              ? `${lw[lf]}%`
              : (lf === "width" ? (lw.width >= 180 ? `${lw.width}px` : (state.locale !== "en" ? "Авто" : "Auto")) : `${lw[lf]}px`);
            setLiveSlot(modalMountEl, `[data-live-lim-val="${lf}"]`, lbl, false);
            const prevStage = modalMountEl.querySelector('[data-role="limitsPreviewStage"]') || modalMountEl.querySelector(".preview-stage");
            if (prevStage && typeof rv5BuildLimitsWidgetHtml === "function") {
              prevStage.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, state.telemetry.modelName || "", state.locale !== "en", true);
            }
          }
          scheduleDebouncedSettingsSave("limits", { limitsWidget: lw }, 160);
          return;
        }
        if (target.getAttribute("data-limits-live-text") === "1" || target.type === "color") {
          lw[lf] = target.value || "";
          state.settings.limitsWidget = lw;
          renderLimitsWidgetMount();
          if (modalMountEl) {
            const prevStage = modalMountEl.querySelector('[data-role="limitsPreviewStage"]') || modalMountEl.querySelector(".preview-stage");
            if (prevStage && typeof rv5BuildLimitsWidgetHtml === "function") {
              prevStage.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, state.telemetry.modelName || "", state.locale !== "en", true);
            }
          }
          scheduleDebouncedSettingsSave("limits", { limitsWidget: lw }, 180);
          return;
        }
        lw[lf] = target.value || "";
        saveSettingsPatch({ limitsWidget: lw });
        return;
      }
      const inspRangeProp = target.getAttribute("data-insp-range");
      if (inspRangeProp) {
        const isFloat = inspRangeProp === "lineHeight";
        const val = isFloat ? Math.round(Number(target.value) * 100) / 100 : Math.round(Number(target.value));
        if (Number.isFinite(val)) {
          if (pickerMountEl) {
            const pairNum = pickerMountEl.querySelector(`[data-insp-num="${inspRangeProp}"]`);
            if (pairNum) pairNum.value = String(val);
            const wrap = pickerMountEl.querySelector(`[data-insp-wrap="${inspRangeProp}"]`);
            if (wrap) wrap.classList.add("is-custom");
            const badge = pickerMountEl.querySelector(`[data-insp-badge="${inspRangeProp}"]`);
            if (badge) badge.textContent = inspRangeProp === "bgOpacity" ? `${val}%` : (state.locale !== "en" ? "изменено" : "custom");
          }
          upsertSelectedElementStyle(inspRangeProp, val, { preserveDom: true, liveOnly: true, skipUndo: true });
        }
        return;
      }
      const inspNumProp = target.getAttribute("data-insp-num");
      if (inspNumProp) {
        const rawStr = String(target.value || "").trim();
        if (rawStr === "") return; // Wait until user finishes typing or clears on blur/change
        const isFloat = inspNumProp === "lineHeight";
        const val = isFloat ? Math.round(Number(rawStr) * 100) / 100 : Math.round(Number(rawStr));
        if (Number.isFinite(val)) {
          const rawMin = target.getAttribute("min");
          const rawMax = target.getAttribute("max");
          const minAttr = rawMin !== null && rawMin !== "" ? Number(rawMin) : NaN;
          const maxAttr = rawMax !== null && rawMax !== "" ? Number(rawMax) : NaN;
          if (pickerMountEl) {
            const pairRange = pickerMountEl.querySelector(`[data-insp-range="${inspNumProp}"]`);
            if (pairRange) pairRange.value = String(Math.max(Number.isFinite(minAttr) ? minAttr : 0, Math.min(Number.isFinite(maxAttr) ? maxAttr : 1600, val)));
            const wrap = pickerMountEl.querySelector(`[data-insp-wrap="${inspNumProp}"]`);
            if (wrap) wrap.classList.add("is-custom");
            const badge = pickerMountEl.querySelector(`[data-insp-badge="${inspNumProp}"]`);
            if (badge) badge.textContent = inspNumProp === "bgOpacity" ? `${val}%` : (state.locale !== "en" ? "изменено" : "custom");
          }
          if ((!Number.isFinite(minAttr) || val >= minAttr) && (!Number.isFinite(maxAttr) || val <= maxAttr)) {
            upsertSelectedElementStyle(inspNumProp, val, { preserveDom: true, liveOnly: true, skipUndo: true });
          }
        }
        return;
      }
      const appHexField = target.getAttribute("data-app-hex-field");
      if (appHexField === "accentColor" || appHexField === "canvasBg" || appHexField === "cardBg" || appHexField === "sidebarBg" || appHexField === "borderColor") {
        const parsedHex = parseUserHexInput(target.value);
        if (parsedHex) {
          const pickerEl = modalMountEl ? modalMountEl.querySelector(`[data-app-field="${appHexField}"]`) : null;
          if (pickerEl) pickerEl.value = parsedHex.hex;
          if (appHexField === "accentColor") {
            state.appearanceDraft.accentColor = parsedHex.hex;
            state.appearanceDraft.customAccent = true;
          } else if (appHexField === "sidebarBg") {
            state.appearanceDraft.sidebarBg = parsedHex.hex;
            state.appearanceDraft.customSidebarBg = true;
          } else if (appHexField === "borderColor") {
            state.appearanceDraft.borderColor = parsedHex.hex;
            state.appearanceDraft.customBorderColor = true;
          } else {
            state.appearanceDraft[appHexField] = parsedHex.hex;
            state.appearanceDraft.presetId = "custom";
          }
          markAppearanceDirty();
          syncTheme();
          if (modalMountEl) {
            const cards = modalMountEl.querySelectorAll(".theme-card");
            for (let i = 0; i < cards.length; i += 1) {
              cards[i].classList.toggle("is-selected", cards[i].getAttribute("data-id") === state.appearanceDraft.presetId);
            }
            const dots = modalMountEl.querySelectorAll(".accent-dot-btn");
            for (let i = 0; i < dots.length; i += 1) {
              dots[i].classList.toggle("is-selected", dots[i].getAttribute("data-val") === state.appearanceDraft.accentColor);
            }
          }
        }
        return;
      }
      const inspHexProp = target.getAttribute("data-insp-hex-input");
      if (inspHexProp) {
        const parsedHex = parseUserHexInput(target.value);
        if (parsedHex) {
          if (pickerMountEl) {
            const pairColor = pickerMountEl.querySelector(`[data-insp-style="${inspHexProp}"]`);
            if (pairColor) pairColor.value = parsedHex.hex;
          }
          upsertSelectedElementStyle(inspHexProp, parsedHex.hex, { preserveDom: true, liveOnly: true, skipUndo: true });
          if (inspHexProp === "bgColor" && parsedHex.alphaPct !== null) {
            if (pickerMountEl) {
              const pairRange = pickerMountEl.querySelector('[data-insp-range="bgOpacity"]');
              const pairNum = pickerMountEl.querySelector('[data-insp-num="bgOpacity"]');
              const badge = pickerMountEl.querySelector('[data-insp-badge="bgOpacity"]');
              if (pairRange) pairRange.value = String(parsedHex.alphaPct);
              if (pairNum) pairNum.value = String(parsedHex.alphaPct);
              if (badge) badge.textContent = `${parsedHex.alphaPct}%`;
            }
            upsertSelectedElementStyle("bgOpacity", parsedHex.alphaPct, { preserveDom: true, liveOnly: true, skipUndo: true });
          }
        }
        return;
      }
      const inspProp = target.getAttribute("data-insp-style");
      if (inspProp) {
        const isColor = target.type === "color";
        const isLiveText = target.getAttribute("data-insp-live-text") === "1";
        if (isColor && pickerMountEl) {
          const hexInp = pickerMountEl.querySelector(`[data-insp-hex-input="${inspProp}"]`);
          if (hexInp) hexInp.value = String(target.value || "").toLowerCase();
          const hexEl = pickerMountEl.querySelector(`[data-insp-hex="${inspProp}"]`);
          if (hexEl) hexEl.textContent = String(target.value || "").toLowerCase();
        }
        upsertSelectedElementStyle(inspProp, target.value || "", { preserveDom: isColor || isLiveText, liveOnly: isColor || isLiveText, skipUndo: isColor || isLiveText });
        return;
      }
      const wsDraftKey = target.getAttribute("data-ws-draft");
      if (wsDraftKey) {
        state.workshop.draft[wsDraftKey] = target.value || "";
        return;
      }
      const agentListKey = target.getAttribute("data-agent-list");
      if (agentListKey) {
        // Keep raw typing buffer untouched until change/blur so trailing commas aren't wiped mid-edit
        state.workshop.draft["agentList_" + agentListKey] = target.value || "";
        return;
      }
      const liveInlineField = target.getAttribute("data-live-inline-field");
      if (liveInlineField) {
        const cur = Object.assign({}, state.settings.liveEditInline || {});
        cur[liveInlineField] = target.value || "enter";
        saveSettingsPatch({ liveEditInline: cur });
        return;
      }
      const quotaAutoField = target.getAttribute("data-quota-auto-field");
      if (quotaAutoField) {
        const qa = typeof rv5NormalizeQuotaAutomation === "function"
          ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
          : Object.assign({}, state.settings.quotaAutomation || {});
        qa[quotaAutoField] = String(target.value || "").slice(0, 500);
        state.settings.quotaAutomation = qa;
        scheduleDebouncedSettingsSave("quotaAuto", { quotaAutomation: qa }, 220);
        return;
      }
    });

    rootEl.addEventListener("keydown", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.getAttribute !== "function") return;
      if (target.getAttribute("data-role") === "settingsSearch" && e.key === "Enter" && !e.isComposing) {
        const firstHit = modalMountEl ? modalMountEl.querySelector('[data-role="searchHits"] [data-action="jump-search-hit"]') : null;
        if (firstHit) {
          if (typeof e.preventDefault === "function") e.preventDefault();
          handleActionClick(firstHit);
        }
        return;
      }
      if (target.getAttribute("data-role") === "liveEditInput" && e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.isComposing) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        sendLiveEditFromDraft();
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && target.getAttribute("role") === "button" && target.hasAttribute("data-action")) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        handleActionClick(target);
      }
    });

    rootEl.addEventListener("paste", (e) => {
      if (!state.liveEditOpen && !(state.isOpen && state.activeTab === "live-edits")) return;
      const handled = extractClipboardImages(e && e.clipboardData, () => {
        renderPopoverStructure();
        if (state.isOpen && state.activeTab === "live-edits") renderStructure();
      });
      if (handled && typeof e.preventDefault === "function") e.preventDefault();
    });

    rootEl.addEventListener("pointerdown", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.closest !== "function" || (typeof e.button === "number" && e.button !== 0)) return;
      const grip = target.closest('[data-studio-resize="1"]');
      if (grip) {
        const sh = modalMountEl ? modalMountEl.querySelector(".modal-shell") : null;
        if (studioResizeState) {
          cancelPendingResizeHold(studioResizeState, sh);
          studioResizeState = null;
        }
        const sui = spNormalizeStudioUi(state.settings.studioUi);
        const st = {
          gripEl: grip,
          pointerId: e.pointerId,
          downX: e.clientX,
          downY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          startX: e.clientX,
          startY: e.clientY,
          startScale: sui.studioScale,
          currentScale: sui.studioScale,
          armed: false,
          moved: false,
          holdTimer: null,
        };
        studioResizeState = st;
        if (sh && sh.classList && typeof sh.classList.add === "function") {
          sh.classList.add("is-resize-holding");
        }
        const armStudioResize = () => {
          if (studioResizeState !== st || state.destroyed) return;
          st.holdTimer = null;
          st.armed = true;
          st.startX = st.lastX;
          st.startY = st.lastY;
          const curShell = modalMountEl ? modalMountEl.querySelector(".modal-shell") : null;
          if (curShell && curShell.classList) {
            if (typeof curShell.classList.remove === "function") curShell.classList.remove("is-resize-holding");
            if (typeof curShell.classList.add === "function") curShell.classList.add("is-resizing");
          }
          const hud = modalMountEl ? modalMountEl.querySelector('[data-role="studioResizeHud"]') : null;
          if (hud) hud.textContent = `${st.currentScale}%`;
        };
        if (win && typeof win.setTimeout === "function") {
          st.holdTimer = win.setTimeout(armStudioResize, RESIZE_HOLD_MS);
        } else {
          st.holdTimer = setTimeout(armStudioResize, RESIZE_HOLD_MS);
        }
        if (typeof grip.setPointerCapture === "function" && e.pointerId !== undefined) {
          try { grip.setPointerCapture(e.pointerId); } catch (_e) {}
        }
        if (typeof e.preventDefault === "function") e.preventDefault();
        return;
      }
      if (target.closest("button") || target.closest("[data-action]")) return;
      const stage = target.closest('[data-wp-stage="1"]');
      if (!stage || (stage.classList && stage.classList.contains("is-empty"))) return;
      const rect = typeof stage.getBoundingClientRect === "function"
        ? stage.getBoundingClientRect()
        : { width: 320, height: 196 };
      const wp = state.appearanceDraft.wallpaper;
      wpDragState = {
        stageEl: stage,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        width: rect.width || 320,
        height: rect.height || 196,
        startPosX: wp.posX,
        startPosY: wp.posY,
        startOffX: wp.offsetX,
        startOffY: wp.offsetY,
      };
      if (stage.classList && typeof stage.classList.add === "function") stage.classList.add("is-dragging");
      if (typeof stage.setPointerCapture === "function" && e.pointerId !== undefined) {
        try { stage.setPointerCapture(e.pointerId); } catch (_e) {}
      }
    });

    rootEl.addEventListener("dblclick", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.closest !== "function") return;
      if (target.closest('[data-studio-resize="1"]')) {
        saveSettingsPatch({ studioUi: { studioScale: 100 } });
      }
    });

    rootEl.addEventListener("wheel", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.closest !== "function") return;
      const stage = target.closest('[data-wp-stage="1"]');
      if (!stage || (stage.classList && stage.classList.contains("is-empty"))) return;
      // Only zoom preview stage when Ctrl/Cmd is held so normal panel scrolling never shrinks wp.scale!
      if (!e.ctrlKey && !e.metaKey) return;
      if (typeof e.preventDefault === "function") e.preventDefault();
      const wp = state.appearanceDraft.wallpaper;
      const step = (e.deltaY || 0) < 0 ? 5 : -5;
      wp.scale = Math.max(50, Math.min(250, (Number(wp.scale) || 100) + step));
      markAppearanceDirty();
      updateLiveWallpaperPreviewDom();
      if (modalMountEl) {
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.scale"]', `${wp.scale}%`, false);
        const rScale = modalMountEl.querySelector('[data-app-field="wallpaper.scale"]');
        if (rScale) rScale.value = String(wp.scale);
      }
    }, { passive: false });

    rootEl.addEventListener("change", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.getAttribute !== "function") return;
      if (target.tagName === "SELECT" && target.getAttribute("data-app-field")) {
        handleAppearanceFieldInput(target);
      } else if (target.getAttribute("data-app-field") && String(target.getAttribute("data-app-field")).startsWith("studioUi.")) {
        handleAppearanceFieldInput(target);
        flushDebouncedSettingsSave("studioUi", { studioUi: spNormalizeStudioUi(state.settings.studioUi) });
      } else if (target.tagName === "SELECT" && target.getAttribute("data-limits-field")) {
        const lf = target.getAttribute("data-limits-field");
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        lw[lf] = target.value || "";
        saveSettingsPatch({ limitsWidget: lw });
      } else if (target.getAttribute("data-limits-field")) {
        const lf = target.getAttribute("data-limits-field");
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        if (lf === "fontSize" || lf === "scale" || lf === "bgOpacity" || lf === "borderRadius" || lf === "blur" || lf === "width") {
          const numV = Math.round(Number(target.value) || 0);
          lw[lf] = lf === "width" && numV < 180 ? 0 : numV;
        } else {
          lw[lf] = target.value || "";
        }
        state.settings.limitsWidget = lw;
        renderLimitsWidgetMount();
        flushDebouncedSettingsSave("limits", { limitsWidget: lw });
      } else if (target.getAttribute("data-opt-field") === "voiceCustomLangs") {
        const curOpt = Object.assign({}, state.settings.optimization || {}, { voiceCustomLangs: target.value || "" });
        state.settings.optimization = typeof sanitizeOptimizationSettings === "function" ? sanitizeOptimizationSettings(curOpt) : curOpt;
        const optCtrl = ensureRudexOptimizer();
        if (optCtrl) optCtrl.apply(state.settings.optimization, state.locale);
        flushDebouncedSettingsSave("optVoiceLangs", { optimization: { voiceCustomLangs: target.value || "" } });
      } else if (target.getAttribute("data-sys-field") === "thinkingTranslatorUrl") {
        const val = String(target.value || "").trim();
        state.settings.thinkingTranslatorUrl = val;
        flushDebouncedSettingsSave("thinkingTranslatorUrl", { thinkingTranslatorUrl: val });
      } else if (target.getAttribute("data-quota-auto-field")) {
        const qf = target.getAttribute("data-quota-auto-field");
        const qa = typeof rv5NormalizeQuotaAutomation === "function"
          ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
          : Object.assign({}, state.settings.quotaAutomation || {});
        qa[qf] = String(target.value || "").slice(0, 500);
        state.settings.quotaAutomation = qa;
        flushDebouncedSettingsSave("quotaAuto", { quotaAutomation: qa });
      } else if (target.tagName === "SELECT" && target.getAttribute("data-insp-style")) {
        upsertSelectedElementStyle(target.getAttribute("data-insp-style"), target.value || "");
      } else if (target.getAttribute("data-insp-range") || target.getAttribute("data-insp-num")) {
        const prop = target.getAttribute("data-insp-range") || target.getAttribute("data-insp-num");
        const rawStr = String(target.value || "").trim();
        const negOneProps = new Set(["borderWidth", "borderRadius", "padding", "paddingY", "paddingX", "opacity"]);
        if (rawStr === "") {
          upsertSelectedElementStyle(prop, negOneProps.has(prop) ? -1 : 0);
        } else {
          const rawMin = target.getAttribute("min");
          const rawMax = target.getAttribute("max");
          const minAttr = rawMin !== null && rawMin !== "" ? Number(rawMin) : NaN;
          const maxAttr = rawMax !== null && rawMax !== "" ? Number(rawMax) : NaN;
          let val = prop === "lineHeight" ? Math.round(Number(rawStr) * 100) / 100 : Math.round(Number(rawStr));
          if (Number.isFinite(val)) {
            if (Number.isFinite(minAttr)) val = Math.max(minAttr, val);
            if (Number.isFinite(maxAttr)) val = Math.min(maxAttr, val);
            upsertSelectedElementStyle(prop, val);
          }
        }
      } else if (target.type === "color" && target.getAttribute("data-insp-style")) {
        upsertSelectedElementStyle(target.getAttribute("data-insp-style"), target.value || "");
      } else if (target.getAttribute("data-insp-hex-input")) {
        const prop = target.getAttribute("data-insp-hex-input");
        const parsedHex = parseUserHexInput(target.value);
        if (parsedHex) {
          target.value = parsedHex.hex;
          if (prop === "bgColor" && parsedHex.alphaPct !== null) {
            upsertSelectedElementStyle("bgOpacity", parsedHex.alphaPct, { preserveDom: true, liveOnly: true });
          }
          upsertSelectedElementStyle(prop, parsedHex.hex);
        } else if (String(target.value || "").trim() === "") {
          upsertSelectedElementStyle(prop, "");
        }
      } else if (target.getAttribute("data-app-hex-field")) {
        const appF = target.getAttribute("data-app-hex-field");
        const parsedHex = parseUserHexInput(target.value);
        if (parsedHex) {
          target.value = parsedHex.hex;
          const pickerEl = modalMountEl ? modalMountEl.querySelector(`[data-app-field="${appF}"]`) : null;
          if (pickerEl) pickerEl.value = parsedHex.hex;
          if (appF === "accentColor") {
            state.appearanceDraft.accentColor = parsedHex.hex;
            state.appearanceDraft.customAccent = true;
          } else if (appF === "sidebarBg") {
            state.appearanceDraft.sidebarBg = parsedHex.hex;
            state.appearanceDraft.customSidebarBg = true;
          } else if (appF === "borderColor") {
            state.appearanceDraft.borderColor = parsedHex.hex;
            state.appearanceDraft.customBorderColor = true;
          } else if (appF === "canvasBg" || appF === "cardBg") {
            state.appearanceDraft[appF] = parsedHex.hex;
            state.appearanceDraft.presetId = "custom";
          }
          markAppearanceDirty();
          syncTheme();
          renderStructure();
        }
      } else if (target.getAttribute("data-insp-live-text") === "1" && target.getAttribute("data-insp-style")) {
        upsertSelectedElementStyle(target.getAttribute("data-insp-style"), target.value || "");
      } else if (target.getAttribute("data-limits-live-text") === "1" && target.getAttribute("data-limits-field")) {
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        lw[target.getAttribute("data-limits-field")] = target.value || "";
        saveSettingsPatch({ limitsWidget: lw });
      } else if (target.getAttribute("data-agent-list")) {
        const agentListKey = target.getAttribute("data-agent-list");
        const arr = String(target.value || "").split(",").map((s) => s.trim()).filter(Boolean);
        const keepDef = Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats);
        const next = Object.assign({}, state.chatAgentProfile, { [agentListKey]: arr, applyToNewChats: keepDef });
        const cnt = typeof rv5CountActiveAgentFeatures === "function" ? rv5CountActiveAgentFeatures(next) : arr.length;
        next.enabled = cnt > 0;
        saveChatAgentProfile(next, { setAsDefault: keepDef });
      } else if (target.tagName === "SELECT" && target.getAttribute("data-live-inline-field")) {
        const cur = Object.assign({}, state.settings.liveEditInline || {});
        cur[target.getAttribute("data-live-inline-field")] = target.value || "enter";
        saveSettingsPatch({ liveEditInline: cur });
      }
    });

    if (widgetMountEl) {
      if (win && "PointerEvent" in win) {
        widgetMountEl.addEventListener("pointerdown", handlePointerDown);
      } else {
        widgetMountEl.addEventListener("mousedown", handlePointerDown);
      }
    }

    if (win && typeof win.addEventListener === "function") {
      pointerMoveHandler = handlePointerMove;
      pointerUpHandler = handlePointerUp;
      blurDragHandler = handlePointerUp;
      if ("PointerEvent" in win) {
        win.addEventListener("pointermove", pointerMoveHandler);
        win.addEventListener("pointerup", pointerUpHandler);
        win.addEventListener("pointercancel", pointerUpHandler);
      } else {
        win.addEventListener("mousemove", pointerMoveHandler);
        win.addEventListener("mouseup", pointerUpHandler);
      }
      win.addEventListener("blur", blurDragHandler);

      resizeHandler = () => {
        syncTheme();
        applyWidgetPosition();
        clampWidgetToViewport();
        renderLimitsWidgetMount();
        positionPopover();
        positionChatDock();
        if (annotatorCtrl && typeof annotatorCtrl.isOpen === "function" && annotatorCtrl.isOpen() && typeof annotatorCtrl.fitCanvasDisplay === "function") {
          annotatorCtrl.fitCanvasDisplay();
        }
      };
      win.addEventListener("resize", resizeHandler);

      focusSyncHandler = () => {
        if (state.destroyed || !state.hasActivatedChat || state.draftDirty) return;
        const now = Date.now();
        if (now - state.lastFocusSyncAt < 500) return;
        state.lastFocusSyncAt = now;
        invokeIpc("agy-studio:activate-chat", {
          chatKey: state.activeChatKey || "__new__",
          title: state.activeChatTitle || "",
          draftPersona: state.activeChatKey === "__new__" ? state.newChatDraftPersona : null,
        });
      };
      win.addEventListener("focus", focusSyncHandler);

      beforeUnloadDraftHandler = () => {
        flushComposerDraftSync(state.activeChatKey || "__new__", state.activeChatTitle || "");
      };
      win.addEventListener("beforeunload", beforeUnloadDraftHandler);
      win.addEventListener("pagehide", beforeUnloadDraftHandler);
      win.addEventListener("blur", beforeUnloadDraftHandler);

      const triggerFastNavSample = () => {
        if (state.destroyed || !state.mounted) return;
        if (win && typeof win.clearTimeout === "function") {
          for (let i = 0; i < navBurstTimers.length; i += 1) win.clearTimeout(navBurstTimers[i]);
        }
        navBurstTimers = [];
        try { sampleStreamTick(); } catch (_e) {}
        if (win && typeof win.setTimeout === "function") {
          for (const d of [16, 55]) {
            navBurstTimers.push(win.setTimeout(() => {
              if (!state.destroyed && state.mounted) {
                try { sampleStreamTick(); } catch (_e) {}
              }
            }, d));
          }
        }
      };

      quotaRpcMsgHandler = (ev) => {
        if (state.destroyed || !ev || ev.source !== win || !ev.data || typeof ev.data !== "object") return;
        const kind = ev.data.__rudexVoice;
        const p = ev.data.payload;
        if (!p || typeof p !== "object") return;
        if (kind === "nav-change") {
          triggerFastNavSample();
          return;
        }
        if (kind === "quota-rpc") {
          if (!p.gemini && !p.claudeGpt) return;
          state.lastRpcQuotaAt = Date.now();
          invokeIpc("agy-studio:sync-quota-snapshot", {
            gemini: p.gemini || null,
            claudeGpt: p.claudeGpt || null,
            activeChatKey: state.activeChatKey || "__new__",
            source: "official-rpc",
          }).then((res) => {
            if (!state.destroyed && res && res.summary) {
              applyQuotaSummary(res.summary);
            }
          });
          return;
        }
        if (kind === "composer-file" && typeof p.dataUrl === "string" && p.dataUrl.startsWith("data:")) {
          const mime = String(p.mime || "").toLowerCase();
          const fname = String(p.name || "").trim() || `file-${Date.now()}`;
          const isImg = mime.startsWith("image/") || p.dataUrl.startsWith("data:image/") || /\.(?:png|jpe?g|webp|gif|bmp)$/i.test(fname);
          if (isImg && p.dataUrl.startsWith("data:image/")) {
            cacheOriginalImageDataUrl(p.dataUrl, fname, mime || "image/png");
          } else {
            const exists = composerOrigFiles.some((x) => x && x.name === fname && x.dataUrl === p.dataUrl);
            if (!exists) {
              composerOrigFiles.push({ name: fname, mime: mime || "application/octet-stream", size: Number(p.size) || 0, dataUrl: p.dataUrl, ts: Date.now() });
              if (composerOrigFiles.length > 10) composerOrigFiles.shift();
            }
          }
          if (!isRestoringDraft && Date.now() > draftJustSubmittedUntil) {
            state.userEditedComposerInChat = true;
            scheduleComposerDraftSave(220, true);
          }
        }
      };
      win.addEventListener("message", quotaRpcMsgHandler);
      navChangeHandler = () => triggerFastNavSample();
      win.addEventListener("popstate", navChangeHandler, true);
      win.addEventListener("hashchange", navChangeHandler, true);
    }

    if (doc && typeof doc.addEventListener === "function") {
      sidebarNavClickHandler = (e) => {
        if (state.destroyed || !state.mounted || !e || !e.target) return;
        const rawT = e.target.nodeType === 3 ? e.target.parentElement : e.target;
        if (!rawT || typeof rawT.closest !== "function") return;
        if (hostEl && (rawT === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(rawT)))) return;
        if (rawT.closest('aside, nav, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]')) {
          if (typeof navChangeHandler === "function") navChangeHandler();
        }
      };
      doc.addEventListener("click", sidebarNavClickHandler, true);
      visChangeHandler = () => {
        if (doc.hidden) {
          flushComposerDraftSync(state.activeChatKey || "__new__", state.activeChatTitle || "");
        } else if (!state.destroyed && state.mounted) {
          state.lastPollAt = 0;
          pollStream();
        }
      };
      doc.addEventListener("visibilitychange", visChangeHandler);

      keydownHandler = (e) => {
        if (!e || e.__rudexKeyHandled) return;
        e.__rudexKeyHandled = true;
        // 0. Screenshot Annotator shortcuts (Esc / Ctrl+Z / Ctrl+Y / Text Enter)
        if (annotatorCtrl && typeof annotatorCtrl.handleKeydown === "function" && annotatorCtrl.handleKeydown(e)) {
          return;
        }
        // 1. Keybinding recorder mode
        if (state.recordingKeybindingId && typeof rv5FormatKeyboardEvent === "function") {
          const formatted = rv5FormatKeyboardEvent(e);
          if (formatted) {
            if (typeof e.preventDefault === "function") e.preventDefault();
            if (typeof e.stopPropagation === "function") e.stopPropagation();
            if (formatted === "__CANCEL__") {
              state.recordingKeybindingId = "";
              invokeIpc("agy-studio:set-recording-keybinding", { active: false });
              renderStructure();
              return;
            }
            const kb = Object.assign({}, state.settings.keybindings || {});
            const targetId = state.recordingKeybindingId;
            const nextVal = formatted === "__CLEAR__" ? "" : formatted;
            let clearedDup = false;
            if (nextVal) {
              for (const k of Object.keys(kb)) {
                if (k !== targetId && kb[k] === nextVal) {
                  kb[k] = "";
                  clearedDup = true;
                }
              }
            }
            kb[targetId] = nextVal;
            state.recordingKeybindingId = "";
            invokeIpc("agy-studio:set-recording-keybinding", { active: false });
            saveSettingsPatch({ keybindings: kb });
            if (clearedDup) {
              setToast(state.locale !== "en" ? `Клавиша ${nextVal} переназначена (дубликат снят)` : `Reassigned ${nextVal} (previous duplicate cleared)`, false);
            }
            return;
          }
        }
        // 2. Escape closes Picker / Inspector / Popovers / Studio
        if (e.key === "Escape") {
          const consumeEsc = () => {
            if (typeof e.preventDefault === "function") e.preventDefault();
            if (typeof e.stopPropagation === "function") e.stopPropagation();
          };
          if (state.pickerActive) {
            consumeEsc();
            stopElementPicker();
            return;
          }
          if (state.inspectorDragMoveActive) {
            consumeEsc();
            stopInspectorDragMove();
            return;
          }
          if (state.pickerSelected) {
            consumeEsc();
            stopInspectorDragMove(true);
            flushInspectorPersist();
            state.pickerSelected = null;
            inspectorDragUndoCaptured = false;
            if (!state.isOpen) state.appearanceLivePreview = false;
            renderPickerMount();
            return;
          }
          if (state.usagePopOpen) {
            consumeEsc();
            state.usagePopOpen = false;
            renderModelUsagePopover();
            return;
          }
          if (state.agentPopoverOpen || state.contextPopoverOpen) {
            consumeEsc();
            state.agentPopoverOpen = false;
            state.contextPopoverOpen = false;
            renderChatDockMount();
            return;
          }
          if (state.liveEditOpen) {
            consumeEsc();
            state.liveEditOpen = false;
            renderPopoverStructure();
          } else if (state.isOpen) {
            consumeEsc();
            setOpen(false);
          }
          return;
        }
        // 2.4 Abort any pending post-submit residual clear immediately if the user manually starts typing a new message
        if (e.isTrusted !== false && e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const isPunctOrSpace = /^[\s.,!?;:…\-]$/.test(e.key);
          if (!isPunctOrSpace && !isVoiceDictationActive() && typeof rv5FindNativeComposer === "function") {
            const { editable: edCheck } = rv5FindNativeComposer(doc);
            if (edCheck && (e.target === edCheck || (typeof edCheck.contains === "function" && edCheck.contains(e.target)))) {
              const nowKeyMs = Date.now();
              if (!userTypedAfterLiveEdit && nowKeyMs - liveEditSentAtMs > 220) {
                userTypedAfterLiveEdit = true;
              }
              if (!userTypedAfterNormalSubmit && nowKeyMs - normalSubmitAtMs > 250) {
                userTypedAfterNormalSubmit = true;
              }
            }
          }
        }
        // 2.5 Auto-close Agent Tools / Context popovers whenever the user submits a message via Enter
        if ((state.agentPopoverOpen || state.contextPopoverOpen) && !e.isComposing && e.key === "Enter" && !e.shiftKey && !e.altKey) {
          if (typeof rv5FindNativeComposer === "function") {
            const { editable } = rv5FindNativeComposer(doc);
            if (editable && (e.target === editable || (typeof editable.contains === "function" && editable.contains(e.target)))) {
              state.agentPopoverOpen = false;
              state.contextPopoverOpen = false;
              renderChatDockMount();
            }
          }
        }
        // 3. Inline live-edit capture OR normal user prompt submission capture (clears draft & saves to last-20 history)
        const le = state.settings.liveEditInline;
        if (!e.isComposing && e.key === "Enter" && !e.shiftKey && !e.altKey && typeof rv5FindNativeComposer === "function") {
          const rawTarget = e.target;
          const targetEl = rawTarget && rawTarget.nodeType === 3 ? rawTarget.parentElement : rawTarget;
          const activeEl = doc.activeElement && doc.activeElement.nodeType === 3 ? doc.activeElement.parentElement : doc.activeElement;
          const isNodeInEditable = (ed, node) => Boolean(ed && node && (node === ed || (typeof ed.contains === "function" && ed.contains(node))));
          let { container, editable } = rv5FindNativeComposer(doc);
          const pathHasEditable = (ed) => {
            if (!ed || typeof e.composedPath !== "function") return false;
            try {
              const cp = e.composedPath();
              return Array.isArray(cp) && cp.indexOf(ed) !== -1;
            } catch (_e) {
              return false;
            }
          };
          let targetInEditable = isNodeInEditable(editable, targetEl) || isNodeInEditable(editable, activeEl) || pathHasEditable(editable);
          if (!targetInEditable) {
            const probeNode = targetEl && typeof targetEl.closest === "function" ? targetEl : (activeEl && typeof activeEl.closest === "function" ? activeEl : null);
            const directEd = probeNode ? probeNode.closest('textarea, [contenteditable="true"], [role="textbox"]') : null;
            if (directEd && !directEd.closest('#rudex-studio-host, [data-testid="user-message-content"], [data-testid="agent-response"], .monaco-editor, [role="dialog"], [role="alertdialog"]')) {
              const cls = typeof directEd.className === "string" ? directEd.className : "";
              if (!/\b(?:inputarea|ime-text-area)\b/.test(cls)) {
                editable = directEd;
                container = directEd.closest('[data-rudex-theme-composer="1"], form, [data-testid="composer"], .composer-container') || directEd.parentElement;
                targetInEditable = true;
              }
            }
          }
          if (editable && targetInEditable) {
            // Skip ONLY when a genuinely visible autocomplete/mention/slash popup attached to the composer is open!
            // Ignore hidden/collapsed 0x0 menus (even if they have child nodes!), header/sidebar menus, and unrelated popups.
            let hasOpenPopup = false;
            try {
              const edRect = typeof editable.getBoundingClientRect === "function" ? editable.getBoundingClientRect() : null;
              const contRect = container && typeof container.getBoundingClientRect === "function" ? container.getBoundingClientRect() : edRect;
              const hasRealLayout = Boolean(edRect && edRect.width > 0 && edRect.height > 0);
              const edControlsId = typeof editable.getAttribute === "function" ? (editable.getAttribute("aria-controls") || "") : "";
              const edActiveDescId = typeof editable.getAttribute === "function" ? (editable.getAttribute("aria-activedescendant") || "") : "";
              const popups = doc.querySelectorAll('[role="listbox"], [role="menu"]');
              for (let pi = 0; popups && pi < popups.length; pi += 1) {
                const p = popups[pi];
                if (!p || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(p))) continue;
                if (typeof p.getAttribute === "function" && (p.getAttribute("aria-hidden") === "true" || p.getAttribute("data-state") === "closed")) continue;
                if (typeof p.closest === "function" && p.closest('aside, header, nav, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"]')) continue;
                if (isHiddenAncestor(p, doc.body)) continue;
                if (win && typeof win.getComputedStyle === "function") {
                  const pcs = win.getComputedStyle(p);
                  if (pcs && (pcs.opacity === "0" || pcs.pointerEvents === "none" || pcs.display === "none" || pcs.visibility === "hidden")) continue;
                }
                const pr = typeof p.getBoundingClientRect === "function" ? p.getBoundingClientRect() : null;
                if (hasRealLayout && pr) {
                  // In real DOM, any collapsed/0x0 popup is NOT open even if it still has childElementCount > 0!
                  if (pr.width < 24 || pr.height < 16) continue;
                  const isLinkedToEd = Boolean(
                    (edControlsId && p.id === edControlsId) ||
                    (edActiveDescId && typeof p.querySelector === "function" && p.querySelector(`#${edActiveDescId.replace(/[^a-zA-Z0-9_-]/g, "\\$&")}`)) ||
                    (container && typeof container.contains === "function" && container.contains(p))
                  );
                  if (!isLinkedToEd && contRect) {
                    const horizOverlap = pr.right >= contRect.left - 80 && pr.left <= contRect.right + 80;
                    const vertNear = pr.bottom >= edRect.top - 360 && pr.top <= edRect.bottom + 140;
                    const hasSelectableItems = typeof p.querySelector === "function"
                      ? Boolean(p.querySelector('[role="option"], [role="menuitem"], [aria-selected="true"], [data-highlighted]'))
                      : true;
                    if (!horizOverlap || !vertNear || !hasSelectableItems) continue;
                  }
                } else if (pr && pr.width === 0 && pr.height === 0 && !p.childElementCount) {
                  continue;
                }
                hasOpenPopup = true;
                break;
              }
            } catch (_e) {}
            if (hasOpenPopup) return;
            const runningNow = isAgentRunningNow();
            const hasCtrl = Boolean(e.ctrlKey || e.metaKey);
            if (le && le.enabled && runningNow) {
              const wantCtrl = le.sendKey === "ctrl+enter";
              if (wantCtrl === hasCtrl) {
                const txt = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
                const hasAtt = hasComposerAttachments(container, editable);
                if (txt || hasAtt) {
                  if (typeof e.preventDefault === "function") e.preventDefault();
                  if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                  if (typeof e.stopPropagation === "function") e.stopPropagation();
                  sendInlineLiveEditFromComposer();
                }
              }
            } else if (!runningNow) {
              captureAndRecordUserSubmission(container, editable, "chat");
            }
          }
        }
      };

      const handleComposerSendTrigger = (e, isPointerPhase) => {
        if (!e || e.__rudexSendHandled || !e.target) return;
        const rawT = e.target.nodeType === 3 ? e.target.parentElement : e.target;
        if (!rawT || typeof rawT.closest !== "function") return;
        if (isPointerPhase && typeof e.button === "number" && e.button !== 0) return;
        const btn = rawT.closest("button");
        if (!btn) return;
        if (hostEl && (btn === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(btn)))) return;
        if (btn.hasAttribute("data-rudex-img-edit-btn") || btn.hasAttribute("data-rudex-native-entry")) return;
        if (typeof rv5FindNativeComposer !== "function") return;
        const { container, editable } = rv5FindNativeComposer(doc);
        if (!container || !editable || (typeof container.contains === "function" && !container.contains(btn))) return;
        const tid = String(btn.getAttribute("data-testid") || "").toLowerCase();
        const lbl = String(btn.getAttribute("aria-label") || btn.getAttribute("title") || "").toLowerCase();
        const typeAttr = String(btn.getAttribute("type") || "").toLowerCase();
        const meta = tid + " " + lbl;
        const hasSendAttr = btn.getAttribute("data-rudex-comp-send") === "1";
        const hasSendWord = /\b(?:send|submit|queue|enqueue)\b|отправ|очеред/i.test(meta);
        const isCancelBtn = !hasSendWord && (tid === "input-cancel-button" || tid === "cancel-invocation-button" || /^(?:cancel|abort|stop|останов|прерв|отмен)/i.test(lbl));
        if (isCancelBtn) return;
        if (!hasSendAttr && !hasSendWord && /cancel|abort|отмен|model|mode|attach|upload|plus|add|remove|delete|close|удал|закры/.test(meta)) return;
        if (!hasSendAttr && !hasSendWord && /mic|voice|dictat|record|stop|останов/.test(meta)) return;
        const looksSend = hasSendAttr || typeAttr === "submit" || hasSendWord;
        if (!looksSend) return;
        const viaStopAndSendButton = Boolean(hasSendWord && /stop|record|dictat|останов|запис|диктов/i.test(meta));
        if (!isPointerPhase && Date.now() - lastLiveSendInterceptAt < 450) {
          e.__rudexSendHandled = true;
          if (typeof e.preventDefault === "function") e.preventDefault();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          if (typeof e.stopPropagation === "function") e.stopPropagation();
          return;
        }
        const txt = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
        const hasAtt = hasComposerAttachments(container, editable);
        if (!txt && !hasAtt) return;
        const le = state.settings.liveEditInline;
        const runningNow = isAgentRunningNow();
        if (le && le.enabled && runningNow) {
          e.__rudexSendHandled = true;
          lastLiveSendInterceptAt = Date.now();
          if (typeof e.preventDefault === "function") e.preventDefault();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          if (typeof e.stopPropagation === "function") e.stopPropagation();
          sendInlineLiveEditFromComposer();
        } else if (!isPointerPhase && !runningNow) {
          e.__rudexSendHandled = true;
          captureAndRecordUserSubmission(container, editable, "chat", { viaStopAndSendButton });
        }
      };
      composerSendPointerHandler = (e) => handleComposerSendTrigger(e, true);
      composerSendClickHandler = (e) => handleComposerSendTrigger(e, false);

      cancelClickHandler = (e) => {
        const tEl = e && e.target;
        if (!tEl || typeof tEl.closest !== "function") return;
        if (tEl.closest('[data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"]')) {
          state.lastCancelClickAt = nowHiRes();
        }
      };
      doc.addEventListener("click", cancelClickHandler, true);

      docPasteHandler = (e) => {
        if (!e || e.__rudexPasteHandled) return;
        e.__rudexPasteHandled = true;
        if (annotatorCtrl && typeof annotatorCtrl.isOpen === "function" && annotatorCtrl.isOpen()) {
          annotatorCtrl.handlePaste(e);
          return;
        }
        // Passively cache full-resolution pasted images & files before Antigravity downscales thumbnails
        const items = e && e.clipboardData && e.clipboardData.items;
        let sawImage = false;
        let sawFile = false;
        if (items && items.length) {
          for (let i = 0; i < items.length; i += 1) {
            if (items[i] && items[i].kind === "file" && typeof items[i].getAsFile === "function") {
              const f = items[i].getAsFile();
              if (f) {
                const fMime = String(f.type || "").toLowerCase();
                if (fMime.startsWith("image/") || /\.(?:png|jpe?g|webp|gif|bmp)$/i.test(String(f.name || ""))) sawImage = true;
                cacheOriginalComposerFile(f);
                sawFile = true;
              }
            }
          }
          if (sawFile && !isRestoringDraft) {
            state.userEditedComposerInChat = true;
            scheduleComposerDraftSave(240, true);
          }
        }
        // Electron native clipboard fallback: if browser clipboardData didn't expose the image file, grab full-res PNG via main process IPC
        if (!sawImage && ipc && typeof rv5FindNativeComposer === "function") {
          const rawT = e.target && e.target.nodeType === 3 ? e.target.parentElement : e.target;
          const { container, editable } = rv5FindNativeComposer(doc);
          const inComp = Boolean(
            (editable && (rawT === editable || (typeof editable.contains === "function" && editable.contains(rawT)))) ||
            (container && (rawT === container || (typeof container.contains === "function" && container.contains(rawT))))
          );
          if (inComp) {
            invokeIpc("agy-studio:read-clipboard-image").then((res) => {
              if (!state.destroyed && res && res.ok && res.dataUrl && res.dataUrl.startsWith("data:image/")) {
                cacheOriginalImageDataUrl(res.dataUrl, `clipboard-${Date.now()}.png`, "image/png");
                if (!isRestoringDraft && Date.now() > draftJustSubmittedUntil) {
                  state.userEditedComposerInChat = true;
                  scheduleComposerDraftSave(240, true);
                }
              }
            });
          }
        }
      };

      // Ensure early capture handlers are attached (already attached in init() BEFORE React/Lexical loaded; attach here if mountStudioUi was called directly)
      attachEarlyCaptureHandlers();

      docDropHandler = (e) => {
        const files = e && e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) {
          for (let i = 0; i < files.length; i += 1) {
            if (files[i]) cacheOriginalComposerFile(files[i]);
          }
          if (!isRestoringDraft) {
            state.userEditedComposerInChat = true;
            scheduleComposerDraftSave(240, true);
          }
        }
      };
      doc.addEventListener("drop", docDropHandler, true);

      docFileChangeHandler = (e) => {
        const inp = e && e.target;
        if (!inp || inp.tagName !== "INPUT" || inp.type !== "file" || !inp.files) return;
        if (hostEl && typeof hostEl.contains === "function" && hostEl.contains(inp)) return;
        for (let i = 0; i < inp.files.length; i += 1) {
          if (inp.files[i]) cacheOriginalComposerFile(inp.files[i]);
        }
        if (inp.files.length > 0 && !isRestoringDraft) {
          state.userEditedComposerInChat = true;
          scheduleComposerDraftSave(240, true);
        }
      };
      doc.addEventListener("change", docFileChangeHandler, true);

      docInputHandler = (e) => {
        if (state.destroyed || isRestoringDraft || state.settings.composerDraftsEnabled === false) return;
        if (Date.now() < draftJustSubmittedUntil) return;
        const tEl = e && e.target;
        if (!tEl || (hostEl && (tEl === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(tEl))))) return;
        if (typeof rv5FindNativeComposer === "function") {
          const { container, editable } = rv5FindNativeComposer(doc);
          if (editable && (tEl === editable || (typeof editable.contains === "function" && editable.contains(tEl)))) {
            state.userEditedComposerInChat = true;
            // Cache snapshot immediately on every keystroke so rapid chat switching or sudden force-close NEVER loses text!
            const curKey = state.activeChatKey || "__new__";
            const snap = collectComposerSnapshotSync(container, editable);
            const hasContent = Boolean(String(snap.text || "").trim() || (snap.items && snap.items.length > 0));
            if (String(snap.text || "").trim()) draftTextCacheByChat.set(curKey, snap.text);
            else draftTextCacheByChat.delete(curKey);
            lastKnownComposerSnapByChat.set(curKey, Object.assign(snap, { cleared: !hasContent }));
            scheduleComposerDraftSave(isVoiceDictationActive() ? 1200 : 180);
          }
        }
      };
      doc.addEventListener("input", docInputHandler, true);
      docCompEndHandler = (e) => docInputHandler(e);
      doc.addEventListener("compositionend", docCompEndHandler, true);

      outsidePopoverHandler = (e) => {
        if (!e) return;
        const cPath = typeof e.composedPath === "function" ? e.composedPath() : [];
        if (state.agentPopoverOpen || state.contextPopoverOpen) {
          const insideDock = Boolean(chatDockMountEl && (cPath.indexOf(chatDockMountEl) !== -1 || e.target === chatDockMountEl)) ||
            (cPath.length === 0 && hostEl && (e.target === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(e.target))));
          if (!insideDock) {
            state.agentPopoverOpen = false;
            state.contextPopoverOpen = false;
            renderChatDockMount();
          }
        }
        if (state.usagePopOpen) {
          const insideUsage = Boolean(
            usagePopMountEl && (
              cPath.indexOf(usagePopMountEl) !== -1 ||
              e.target === usagePopMountEl ||
              (typeof usagePopMountEl.contains === "function" && usagePopMountEl.contains(e.target)) ||
              (e.target && typeof e.target.closest === "function" && e.target.closest(".rx-usage-pop-mount"))
            )
          );
          const trig = typeof doc.querySelector === "function" ? doc.querySelector('[data-testid="model-selector-trigger"]') : null;
          let onTrigger = false;
          if (trig) {
            if (e.target === trig || (typeof trig.contains === "function" && trig.contains(e.target))) {
              onTrigger = true;
            } else if (typeof trig.getBoundingClientRect === "function" && typeof e.clientX === "number" && typeof e.clientY === "number") {
              const r = trig.getBoundingClientRect();
              if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) onTrigger = true;
            }
          }
          if (!insideUsage && !onTrigger) {
            state.usagePopOpen = false;
            renderModelUsagePopover();
          }
        }
      };
      doc.addEventListener("pointerdown", outsidePopoverHandler, true);

      let lastUsagePopInterceptAt = 0;
      modelTriggerClickHandler = (e) => {
        if (state.destroyed || !e || (typeof e.button === "number" && e.button !== 0)) return;
        if (hostEl && e.target && (e.target === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(e.target)))) return;
        let trig = null;
        if (e.target && typeof e.target.closest === "function") {
          trig = e.target.closest('[data-testid="model-selector-trigger"]');
        }
        if (!trig && typeof doc.querySelector === "function" && typeof e.clientX === "number" && typeof e.clientY === "number") {
          const cand = doc.querySelector('[data-testid="model-selector-trigger"]');
          if (cand && typeof cand.getBoundingClientRect === "function") {
            const r = cand.getBoundingClientRect();
            if (r && r.width > 12 && r.height > 8 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
              trig = cand;
            }
          }
        }
        if (!trig) return;
        const isDisabled = Boolean(
          trig.disabled ||
          (typeof trig.getAttribute === "function" && (trig.getAttribute("disabled") !== null || trig.getAttribute("aria-disabled") === "true" || trig.getAttribute("data-disabled") !== null))
        );
        if (!isDisabled && !state.telemetry.isGenerating) {
          scheduleQuotaDomScrapeBurst();
          return;
        }
        lastUsagePopInterceptAt = Date.now();
        if (typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        state.usagePopOpen = !state.usagePopOpen;
        if (state.usagePopOpen) {
          try { if (typeof trig.blur === "function") trig.blur(); } catch (_e) {}
          try { state.usagePopAnchor = typeof trig.getBoundingClientRect === "function" ? trig.getBoundingClientRect() : null; } catch (_e) {}
          invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
            if (!state.destroyed && qs) {
              applyQuotaSummary(qs);
            }
          });
        }
        renderModelUsagePopover();
      };
      modelTriggerSuppressClickHandler = (e) => {
        if (!e || Date.now() - lastUsagePopInterceptAt > 400) return;
        const trig = e.target && typeof e.target.closest === "function" ? e.target.closest('[data-testid="model-selector-trigger"]') : null;
        if (trig) {
          if (typeof e.preventDefault === "function") e.preventDefault();
          if (typeof e.stopPropagation === "function") e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        }
      };
      doc.addEventListener("pointerdown", modelTriggerClickHandler, true);
      doc.addEventListener("click", modelTriggerSuppressClickHandler, true);
    }
  }

  function mountStudioUi() {
    if (state.mounted || state.destroyed || !doc) return;
    const mountTarget = doc.body || doc.documentElement;
    if (!mountTarget || typeof doc.createElement !== "function") return;

    for (const oldId of ["rudex-studio-host", "agy-ru-studio-host"]) {
      const existing = typeof doc.getElementById === "function" ? doc.getElementById(oldId) : null;
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }

    hostEl = doc.createElement("div");
    hostEl.id = "rudex-studio-host";
    hostEl.setAttribute("data-rudex-ignore", "1");
    hostEl.setAttribute("data-agy-ru-ignore", "1");
    mountTarget.appendChild(hostEl);

    if (typeof hostEl.attachShadow === "function") {
      shadowRoot = hostEl.attachShadow({ mode: "open" });
    } else {
      shadowRoot = hostEl;
    }

    styleEl = doc.createElement("style");
    styleEl.textContent = stylesFn() + (typeof rv5BuildExtraShadowCss === "function" ? "\n" + rv5BuildExtraShadowCss() : "");
    rootEl = doc.createElement("div");
    rootEl.className = "studio-root";
    rootEl.setAttribute("data-rudex-ignore", "1");
    widgetMountEl = doc.createElement("div");
    widgetMountEl.className = "widget-wrap";
    limitsMountEl = doc.createElement("div");
    limitsMountEl.className = "rx-limits-mount rx-zen-hidden";
    chatDockMountEl = doc.createElement("div");
    chatDockMountEl.className = "rx-chat-dock";
    usagePopMountEl = doc.createElement("div");
    usagePopMountEl.className = "rx-usage-pop-mount";
    usagePopMountEl.style.display = "none";
    pickerMountEl = doc.createElement("div");
    pickerMountEl.className = "rx-picker-mount";
    annotatorMountEl = doc.createElement("div");
    annotatorMountEl.className = "rx-annotator-mount";
    popoverMountEl = doc.createElement("div");
    popoverMountEl.className = "le-popover-mount";
    updateToastMountEl = doc.createElement("div");
    updateToastMountEl.className = "update-toast-mount";
    modalMountEl = doc.createElement("div");
    modalMountEl.className = "modal-mount";

    rootEl.appendChild(widgetMountEl);
    rootEl.appendChild(limitsMountEl);
    rootEl.appendChild(chatDockMountEl);
    rootEl.appendChild(usagePopMountEl);
    rootEl.appendChild(popoverMountEl);
    rootEl.appendChild(updateToastMountEl);
    rootEl.appendChild(modalMountEl);
    rootEl.appendChild(pickerMountEl);
    rootEl.appendChild(annotatorMountEl);
    shadowRoot.appendChild(styleEl);
    shadowRoot.appendChild(rootEl);

    if (typeof createScreenshotAnnotator === "function") {
      annotatorCtrl = createScreenshotAnnotator({
        mountEl: annotatorMountEl,
        doc,
        win,
        invokeIpc,
        getLocale: () => state.locale,
        isGenerating: () => Boolean(state.telemetry.isGenerating),
        onSendLiveEdit: ({ dataUrl, text }) => {
          invokeIpc("agy-studio:send-live-edit", {
            chatKey: state.activeChatKey || "__new__",
            title: state.activeChatTitle || "",
            text: text || (state.locale !== "en" ? "Скриншот с правками карандашом" : "Annotated screenshot"),
            images: [{ name: `rudex-edit-${Date.now()}.png`, dataUrl }],
            fallbackAny: state.activeChatKey === "__new__" || state.activeChatKey.startsWith("chat-"),
          }).then((res) => {
            if (!state.destroyed && res && res.ok) {
              applyLiveEditsPayload(res);
              renderChatDockMount();
            }
          });
        },
        onNotify: (msg) => {
          setToast(msg, false);
        },
      });
    }

    if (limitsMountEl) {
      limitsMountEl.addEventListener("pointerdown", (e) => {
        if (!e || (typeof e.button === "number" && e.button !== 0)) return;
        const tEl = e.target;
        if (!tEl || typeof tEl.closest !== "function" || tEl.closest("button")) return;
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : state.settings.limitsWidget;
        const resizeGrip = tEl.closest('[data-limits-resize="1"]');
        if (resizeGrip) {
          if (typeof limitsMountEl.setPointerCapture === "function" && e.pointerId !== undefined) {
            try { limitsMountEl.setPointerCapture(e.pointerId); } catch (_e) {}
          }
          const boxEl = typeof limitsMountEl.querySelector === "function" ? limitsMountEl.querySelector(".rx-limits-box") : null;
          const rect = boxEl && typeof boxEl.getBoundingClientRect === "function" ? boxEl.getBoundingClientRect() : { left: 20, top: 44, width: 260, height: 80 };
          const isPill = lw && (lw.layout === "pill" || lw.layout === "inline-header" || lw.position === "inline-header");
          const effPos = lw && lw.position ? lw.position : "top-right";
          const isRightAnchored = effPos === "top-right" || effPos === "bottom-right" || effPos === "inline-header";
          const isBottomAnchored = effPos === "bottom-right" || effPos === "bottom-left";
          const curW = lw && Number(lw.width) >= 180 ? Math.round(lw.width) : Math.max(180, Math.min(420, Math.round(rect.width || 260)));
          const curScale = lw && Number(lw.scale) ? Math.round(lw.scale) : 100;
          limitsResizeState = {
            pointerId: e.pointerId,
            mode: isPill ? "scale" : "width",
            startX: e.clientX,
            startY: e.clientY,
            startWidth: curW,
            currentWidth: curW,
            startScale: curScale,
            currentScale: curScale,
            signX: isRightAnchored && lw && lw.pinned ? -1 : 1,
            signY: isBottomAnchored && lw && lw.pinned ? -1 : 1,
            moved: false,
          };
          limitsLiveEditUntil = Date.now() + 900;
          if (typeof e.preventDefault === "function") e.preventDefault();
          return;
        }
        if (lw && lw.pinned) return;
        if (!tEl.closest('[data-limits-drag="1"]')) return;
        if (typeof limitsMountEl.setPointerCapture === "function" && e.pointerId !== undefined) {
          try { limitsMountEl.setPointerCapture(e.pointerId); } catch (_e) {}
        }
        const boxEl = typeof limitsMountEl.querySelector === "function" ? limitsMountEl.querySelector(".rx-limits-box") : null;
        const targetEl = boxEl || limitsMountEl;
        const rect = typeof targetEl.getBoundingClientRect === "function" ? targetEl.getBoundingClientRect() : { left: 20, top: 44, width: 240, height: 60 };
        limitsDragState = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          origLeft: rect.left,
          origTop: rect.top,
          width: rect.width || 240,
          height: rect.height || 60,
          lastX: rect.left,
          lastY: rect.top,
          moved: false,
        };
      });
      limitsMountEl.addEventListener("dblclick", (e) => {
        const tEl = e && e.target;
        if (!tEl || typeof tEl.closest !== "function" || !tEl.closest('[data-limits-resize="1"]')) return;
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        lw.width = 0;
        lw.scale = 100;
        state.settings.limitsWidget = lw;
        renderLimitsWidgetMount();
        flushDebouncedSettingsSave("limits", { limitsWidget: lw });
      });
    }

    attachDomEvents();
    state.mounted = true;
    state.hydrationIgnoreUntil = nowHiRes() + 2500;
    if (themeEngine && typeof themeEngine.setBootWallpaperDeferred === "function") {
      try { themeEngine.setBootWallpaperDeferred(false); } catch (_e) {}
    }
    const bootOpt = ensureRudexOptimizer();
    if (bootOpt) bootOpt.apply(state.settings.optimization, state.locale);
    renderStructure();
    refreshLiveEdits();
    pollStream();

    if (win && typeof win.setInterval === "function") {
      pollTimer = win.setInterval(() => pollStream(), 120);
    }
    if (win && typeof win.setTimeout === "function") {
      titleBarBootTimer = win.setTimeout(() => {
        titleBarBootTimer = null;
        if (!state.destroyed && state.settings && state.settings.appearance && state.settings.appearance.presetId !== "native") {
          syncHostTitleBarOverlay(state.settings.appearance, true);
        }
      }, 1300);
    }

    if (typeof win !== "undefined" && typeof win.MutationObserver === "function" && doc.body) {
      try {
        domObserver = new win.MutationObserver((muts) => {
          if (state.destroyed || isApplyingThinkingTranslation) return;
          if (Array.isArray(muts) && muts.length > 0) {
            let hasExternal = false;
            for (let i = 0; i < muts.length; i += 1) {
              const m = muts[i];
              if (!m) continue;
              const tNode = m.target;
              if (!tNode) continue;
              const tId = tNode.id || "";
              if (tId === "rudex-studio-host" || tId === "rudex-bg" || tId === "rudex-studio-theme" || tId === "rudex-greeting-style" || tId === "agy-ru-studio-host" || tId === "agy-ru-studio-bg" || tId === "agy-ru-studio-theme") continue;
              if (hostEl && (tNode === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(tNode)))) continue;
              const tEl = tNode.nodeType === 1 ? tNode : tNode.parentElement;
              if (tEl) {
                const tTag = tEl.tagName ? String(tEl.tagName).toUpperCase() : "";
                if (tTag === "TEXTAREA" || tTag === "INPUT" || tTag === "SVG" || tTag === "PATH" || tTag === "RECT" || tTag === "CIRCLE" || tTag === "LINE" || tTag === "CANVAS") continue;
                if (typeof tEl.closest === "function") {
                  try {
                    if (tEl.closest('[contenteditable="true"], [role="textbox"], [data-rudex-comp-mic-active="1"], [data-rudex-comp-mic="1"], [data-rudex-comp-voice="1"]')) continue;
                  } catch (_e) {}
                }
              }
              hasExternal = true;
              break;
            }
            if (!hasExternal) return;
          }
          const obsUrlSig = win && win.location ? `${win.location.pathname || ""}${win.location.search || ""}${win.location.hash || ""}` : "";
          if (obsUrlSig && obsUrlSig !== state.lastObservedUrlSig) {
            state.lastObservedUrlSig = obsUrlSig;
            try { sampleStreamTick(); } catch (_e) {}
          } else {
            scheduleStreamSample();
          }
          if (state.settings.thinkingInRussian || state.settings.workLogInRussian) scheduleThinkingScan(160);
          if (Array.isArray(muts)) {
            for (let mi = 0; mi < muts.length; mi += 1) {
              const added = muts[mi] && muts[mi].addedNodes;
              if (!added || !added.length) continue;
              let hitOverlay = false;
              for (let ai = 0; ai < added.length; ai += 1) {
                const an = added[ai];
                if (!an || an.nodeType !== 1) continue;
                if (hostEl && (an === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(an)))) continue;
                const role = typeof an.getAttribute === "function" ? (an.getAttribute("role") || "") : "";
                if (role === "dialog" || role === "menu" || role === "listbox" || (typeof an.hasAttribute === "function" && an.hasAttribute("data-radix-popper-content-wrapper")) || (typeof an.querySelector === "function" && an.querySelector('[data-testid="quota-progress-circle"], [data-radix-popper-content-wrapper], [role="dialog"]'))) {
                  hitOverlay = true;
                  break;
                }
              }
              if (hitOverlay) {
                scheduleQuotaDomScrapeBurst();
                break;
              }
            }
          }
        });
        domObserver.observe(doc.body, { childList: true, subtree: true, characterData: true });
      } catch (_e) {}
    }

    if (typeof win !== "undefined" && typeof win.MutationObserver === "function" && doc.documentElement) {
      try {
        themeObserver = new win.MutationObserver(() => syncTheme());
        themeObserver.observe(doc.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
      } catch (_e) {}
    }

    invokeIpc("agy-studio:get-state", { chatKey: state.activeChatKey || "__new__" }).then((remote) => {
      if (remote) applyRemoteState(remote, true);
    });
    invokeIpc("agy-studio:get-update-state").then((upd) => {
      if (!state.destroyed && upd) applyUpdateStatus(upd);
    });
  }

  function clearReadinessWatchers() {
    if (readyTimer && win && typeof win.clearInterval === "function") {
      win.clearInterval(readyTimer);
      readyTimer = null;
    }
    if (readyObserver && typeof readyObserver.disconnect === "function") {
      readyObserver.disconnect();
      readyObserver = null;
    }
  }

  let earlyThemeBooted = false;
  if (opts.initialBoot && typeof opts.initialBoot === "object") {
    const ib = opts.initialBoot;
    if (ib.appearance && typeof ib.appearance === "object") {
      state.settings.appearance = spCloneAppearance(ib.appearance);
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
    }
    if (ib.greeting && typeof ib.greeting === "object") {
      state.settings.greeting = spCloneGreeting(ib.greeting);
      state.greetingDraft = spCloneGreeting(state.settings.greeting);
    }
    if (Array.isArray(ib.customLabels)) {
      state.settings.customLabels = ib.customLabels.slice(0, 120);
    }
    if (ib.studioUi && typeof ib.studioUi === "object") {
      state.settings.studioUi = spNormalizeStudioUi(ib.studioUi);
    }
    if (ib.optimization && typeof ib.optimization === "object") {
      state.settings.optimization = typeof sanitizeOptimizationSettings === "function"
        ? sanitizeOptimizationSettings(ib.optimization)
        : Object.assign({}, state.settings.optimization, ib.optimization);
    }
    if (typeof ib.zenMode === "boolean") {
      state.settings.zenMode = ib.zenMode;
    }
    if (typeof ib.composerDraftsEnabled === "boolean") {
      state.settings.composerDraftsEnabled = ib.composerDraftsEnabled;
    }
    if (ib.draftTexts && typeof ib.draftTexts === "object") {
      for (const [dk, dv] of Object.entries(ib.draftTexts)) {
        if (dk && typeof dv === "string" && dv.trim()) {
          draftTextCacheByChat.set(dk, dv);
        }
      }
    }
  }

  function bootEarlyTheme() {
    if (state.destroyed || !doc) return;
    try {
      const proto = win && win.location && typeof win.location.protocol === "string" ? win.location.protocol : "";
      if (/^(data:|about:)$/i.test(proto)) return;
    } catch (_e) {}
    earlyThemeBooted = true;
    try {
      const appScale = state.settings.studioUi && Number(state.settings.studioUi.appScale);
      if (webFrame && typeof webFrame.setZoomFactor === "function" && Number.isFinite(appScale) && appScale >= 70 && appScale <= 150 && appScale !== 100) {
        webFrame.setZoomFactor(appScale / 100);
      }
    } catch (_e) {}
    if (translator) {
      try {
        if (typeof translator.setCustomLabels === "function" && Array.isArray(state.settings.customLabels) && state.settings.customLabels.length > 0) {
          translator.setCustomLabels(state.settings.customLabels);
        }
        if (typeof translator.setGreetingConfig === "function" && state.settings.greeting) {
          translator.setGreetingConfig(state.settings.greeting);
        }
      } catch (_e) {}
    }
    if (themeEngine && typeof themeEngine.setBootWallpaperDeferred === "function") {
      try { themeEngine.setBootWallpaperDeferred(!state.mounted && !isAntigravityUiReady()); } catch (_e) {}
    }
    applyThemeToHost(state.settings.appearance);
    try {
      const optCtrl = ensureRudexOptimizer();
      if (optCtrl) optCtrl.apply(state.settings.optimization, state.locale);
    } catch (_e) {}
  }

  function scheduleMountAfterSettle() {
    if (state.mounted || state.destroyed || settleTimer) return;
    clearReadinessWatchers();
    mountStudioUi();
  }

  function attachEarlyCaptureHandlers() {
    if (earlyCaptureAttached || state.destroyed) return;
    earlyCaptureAttached = true;
    earlyKeydownCapture = (e) => {
      if (!state.destroyed && typeof keydownHandler === "function") keydownHandler(e);
    };
    earlyPointerDownCapture = (e) => {
      if (!state.destroyed && typeof composerSendPointerHandler === "function") composerSendPointerHandler(e);
    };
    earlyClickCapture = (e) => {
      if (!state.destroyed && typeof composerSendClickHandler === "function") composerSendClickHandler(e);
    };
    earlyPasteCapture = (e) => {
      if (!state.destroyed && typeof docPasteHandler === "function") docPasteHandler(e);
    };
    if (win && typeof win.addEventListener === "function") {
      win.addEventListener("keydown", earlyKeydownCapture, true);
      win.addEventListener("pointerdown", earlyPointerDownCapture, true);
      win.addEventListener("click", earlyClickCapture, true);
      win.addEventListener("paste", earlyPasteCapture, true);
    }
    if (doc && typeof doc.addEventListener === "function") {
      doc.addEventListener("keydown", earlyKeydownCapture, true);
      doc.addEventListener("pointerdown", earlyPointerDownCapture, true);
      doc.addEventListener("click", earlyClickCapture, true);
      doc.addEventListener("paste", earlyPasteCapture, true);
    }
  }

  function init() {
    if (state.initialized || state.destroyed || !doc) return;
    try {
      const proto = win && win.location && typeof win.location.protocol === "string" ? win.location.protocol : "";
      if (/^(data:|about:)$/i.test(proto)) return;
    } catch (_e) {}

    state.initialized = true;
    if (opts.initialBoot && !earlyThemeBooted) {
      bootEarlyTheme();
    }
    // CRITICAL: Register window/document capture listeners IMMEDIATELY at preload init() — BEFORE React/Lexical mounts!
    // Guarantees Rudex live-edit Enter/Send and full-res Paste interception ALWAYS run first in capture order.
    attachEarlyCaptureHandlers();
    if (isAntigravityUiReady()) {
      mountStudioUi();
      return;
    }

    const obsTarget = doc.documentElement || doc.body;
    if (typeof win !== "undefined" && typeof win.MutationObserver === "function" && obsTarget) {
      try {
        readyObserver = new win.MutationObserver(() => {
          if (isAntigravityUiReady()) scheduleMountAfterSettle();
        });
        readyObserver.observe(obsTarget, { childList: true, subtree: true });
      } catch (_e) {}
    }

    if (win && typeof win.setInterval === "function") {
      const startAt = Date.now();
      readyTimer = win.setInterval(() => {
        if (state.destroyed || state.mounted) {
          clearReadinessWatchers();
          return;
        }
        if (isAntigravityUiReady()) {
          scheduleMountAfterSettle();
          return;
        }
        const elapsed = Date.now() - startAt;
        if (elapsed >= 12000) {
          clearReadinessWatchers();
          const bodyText = doc.body ? ((doc.body.textContent || "").trim()) : "";
          if (bodyText.length > 80) scheduleMountAfterSettle();
        }
      }, 220);
    }
  }

  function setOpen(nextOpen, opts) {
    const next = Boolean(nextOpen);
    if (next && opts && typeof opts === "object") {
      const reqTab = opts.tab ? String(opts.tab) : "";
      const reqSub = opts.subTab ? String(opts.subTab) : "";
      if (reqTab === "monitor") {
        state.activeTab = "widgets";
        state.widgetSubSection = "monitor";
      } else if (reqTab === "live-edits") {
        state.activeTab = "persona";
        state.agentSubTab = "tools";
      } else if (reqTab === "settings" && reqSub === "widget") {
        state.activeTab = "widgets";
        state.widgetSubSection = opts.widgetSub ? String(opts.widgetSub) : "mini";
      } else if (reqTab === "settings" && reqSub === "export") {
        state.activeTab = "widgets";
        state.widgetSubSection = "monitor";
      } else if (reqTab === "settings" && reqSub === "history") {
        state.activeTab = "history";
      } else if (reqTab === "settings" && reqSub === "workshop") {
        state.activeTab = "workshop";
      } else if (reqTab) {
        state.activeTab = reqTab;
        if (reqSub && reqTab === "settings") state.settingsSubTab = reqSub;
      } else if (reqSub) {
        if (reqSub === "widget") {
          state.activeTab = "widgets";
          state.widgetSubSection = "mini";
        } else if (reqSub === "export") {
          state.activeTab = "widgets";
          state.widgetSubSection = "monitor";
        } else if (reqSub === "history") {
          state.activeTab = "history";
        } else if (reqSub === "workshop") {
          state.activeTab = "workshop";
        } else {
          state.activeTab = "settings";
          state.settingsSubTab = reqSub;
        }
      }
      if (opts.widgetSub) state.widgetSubSection = String(opts.widgetSub);
      if (opts.agentSub) state.agentSubTab = String(opts.agentSub);
      if (opts.appSubTab) state.appearanceSubTab = String(opts.appSubTab);
      if (typeof opts.dockedRight === "boolean") state.appearanceDockedRight = opts.dockedRight;
    }
    if (!next && state.recordingKeybindingId) {
      state.recordingKeybindingId = "";
      invokeIpc("agy-studio:set-recording-keybinding", { active: false });
    }
    if (!next) {
      flushInspectorPersist();
      flushAllDebouncedSettingsSaves();
    }
    if (!next && (state.appearanceLivePreview || state.activeTab === "appearance")) {
      cleanupTempUploadedMedia();
      state.appearanceLivePreview = false;
      state.appearanceDockedRight = false;
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.greetingDraft = spCloneGreeting(state.settings.greeting);
      state.appearanceDirty = false;
      applyThemeToHost(state.settings.appearance);
      syncTranslatorGreeting(state.settings.greeting);
      if (state.pickerSelected) renderPickerMount();
    } else if (!next) {
      state.appearanceDockedRight = false;
    }
    state.isOpen = next;
    if (next && state.activeTab === "appearance") {
      state.appearanceLivePreview = true;
      loadSystemFontsOnce();
      if (!state.appearanceDirty) {
        state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        state.greetingDraft = spCloneGreeting(state.settings.greeting);
      }
      applyThemeFastToHost(state.appearanceDraft);
      if (state.appearanceSubTab === "wallpaper") refreshMediaLibrary();
    }
    if (next && state.activeTab === "widgets") {
      loadSystemFontsOnce();
      invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
        if (!state.destroyed && qs) applyQuotaSummary(qs);
      });
    }
    if (next && state.activeTab === "workshop") {
      refreshWorkshopData();
    }
    if (next && state.activeTab === "history") {
      refreshInputHistory();
    }
    if (next && state.activeTab === "persona") {
      refreshLiveEdits();
    }
    renderStructure();
  }

  function toggleOpen() {
    setOpen(!state.isOpen);
  }

  function toggleLiveEditPopover() {
    state.liveEditOpen = !state.liveEditOpen;
    state.liveEditError = "";
    renderPopoverStructure();
    if (state.liveEditOpen) {
      refreshLiveEdits();
      if (win && typeof win.setTimeout === "function") {
        win.setTimeout(() => {
          try {
            const inp = popoverMountEl && popoverMountEl.querySelector('[data-role="liveEditInput"]');
            if (inp && typeof inp.focus === "function") inp.focus();
          } catch (_e) {}
        }, 25);
      }
    }
  }

  function applyLiveEditsUpdate(payload) {
    applyLiveEditsPayload(payload);
    renderPopoverStructure();
    renderChatDockMount();
    updateLiveDom();
    if (state.isOpen && state.activeTab === "live-edits") renderStructure();
  }

  function setViewMode(mode) {
    saveSettingsPatch({ viewMode: normalizeViewMode(mode) });
  }

  function setLocale(nextLocale) {
    state.locale = nextLocale === "en" ? "en" : "ru";
    if (rudexOptimizer) rudexOptimizer.apply(state.settings.optimization, state.locale);
    renderStructure();
  }

  function destroy() {
    state.destroyed = true;
    if (rudexOptimizer) {
      try { rudexOptimizer.destroy(); } catch (_e) {}
      rudexOptimizer = null;
    }
    clearReadinessWatchers();
    if (widgetResizeState) {
      cancelPendingResizeHold(widgetResizeState, widgetMountEl);
      widgetResizeState = null;
    }
    if (studioResizeState) {
      const sh = modalMountEl ? modalMountEl.querySelector(".modal-shell") : null;
      cancelPendingResizeHold(studioResizeState, sh);
      studioResizeState = null;
    }
    const extraDebouncedTimers = Object.keys(debouncedSaveTimers).map((k) => debouncedSaveTimers[k]);
    for (const k of Object.keys(debouncedSaveTimers)) delete debouncedSaveTimers[k];
    for (const k of Object.keys(debouncedSavePending)) delete debouncedSavePending[k];
    for (const timer of [settleTimer, repaintTimer, streamSampleTimer, turnSyncTimer, toastTimer, thinkingScanTimer, draftSaveTimer, draftFollowupTimer, draftRestoreTimer, draftEarlyTextTimer, titleBarBootTimer, inspSaveTimer, limitsSaveTimer, studioUiSaveTimer, quotaAutoSaveTimer].concat(extraDebouncedTimers)) {
      if (timer && win && typeof win.clearTimeout === "function") win.clearTimeout(timer);
    }
    for (const qt of quotaScrapeTimers.concat(navBurstTimers)) {
      if (qt && win && typeof win.clearTimeout === "function") win.clearTimeout(qt);
    }
    quotaScrapeTimers = [];
    navBurstTimers = [];
    settleTimer = repaintTimer = streamSampleTimer = turnSyncTimer = toastTimer = thinkingScanTimer = draftSaveTimer = draftFollowupTimer = draftRestoreTimer = draftEarlyTextTimer = titleBarBootTimer = inspSaveTimer = limitsSaveTimer = studioUiSaveTimer = quotaAutoSaveTimer = null;
    limitsResizeState = null;
    if (dockComposerObserver && typeof dockComposerObserver.disconnect === "function") {
      try { dockComposerObserver.disconnect(); } catch (_e) {}
      dockComposerObserver = null;
      dockObservedComposerEl = null;
    }
    if (state.recordingKeybindingId) {
      state.recordingKeybindingId = "";
      invokeIpc("agy-studio:set-recording-keybinding", { active: false });
    }
    restoreAllThinkingNodes();
    thinkingCache.clear();
    thinkingInflight.clear();
    if (pollTimer && win && typeof win.clearInterval === "function") {
      win.clearInterval(pollTimer);
      pollTimer = null;
    }
    if (domObserver && typeof domObserver.disconnect === "function") { domObserver.disconnect(); domObserver = null; }
    if (themeObserver && typeof themeObserver.disconnect === "function") { themeObserver.disconnect(); themeObserver = null; }
    clearDraftRestoreVerifyTimers();
    if (win && typeof win.removeEventListener === "function") {
      if (pointerMoveHandler) {
        win.removeEventListener("pointermove", pointerMoveHandler);
        win.removeEventListener("mousemove", pointerMoveHandler);
      }
      if (pointerUpHandler) {
        win.removeEventListener("pointerup", pointerUpHandler);
        win.removeEventListener("pointercancel", pointerUpHandler);
        win.removeEventListener("mouseup", pointerUpHandler);
      }
      if (blurDragHandler) win.removeEventListener("blur", blurDragHandler);
      if (resizeHandler) win.removeEventListener("resize", resizeHandler);
      if (focusSyncHandler) win.removeEventListener("focus", focusSyncHandler);
      if (beforeUnloadDraftHandler) {
        win.removeEventListener("beforeunload", beforeUnloadDraftHandler);
        win.removeEventListener("pagehide", beforeUnloadDraftHandler);
        win.removeEventListener("blur", beforeUnloadDraftHandler);
      }
      if (quotaRpcMsgHandler) win.removeEventListener("message", quotaRpcMsgHandler);
      if (navChangeHandler) {
        win.removeEventListener("popstate", navChangeHandler, true);
        win.removeEventListener("hashchange", navChangeHandler, true);
      }
      if (earlyKeydownCapture) win.removeEventListener("keydown", earlyKeydownCapture, true);
      if (earlyPointerDownCapture) win.removeEventListener("pointerdown", earlyPointerDownCapture, true);
      if (earlyClickCapture) win.removeEventListener("click", earlyClickCapture, true);
      if (earlyPasteCapture) win.removeEventListener("paste", earlyPasteCapture, true);
      if (keydownHandler) win.removeEventListener("keydown", keydownHandler, true);
      if (composerSendPointerHandler) win.removeEventListener("pointerdown", composerSendPointerHandler, true);
      if (composerSendClickHandler) win.removeEventListener("click", composerSendClickHandler, true);
    }
    if (doc && typeof doc.removeEventListener === "function") {
      if (visChangeHandler) doc.removeEventListener("visibilitychange", visChangeHandler);
      if (earlyKeydownCapture) doc.removeEventListener("keydown", earlyKeydownCapture, true);
      if (earlyPointerDownCapture) doc.removeEventListener("pointerdown", earlyPointerDownCapture, true);
      if (earlyClickCapture) doc.removeEventListener("click", earlyClickCapture, true);
      if (earlyPasteCapture) doc.removeEventListener("paste", earlyPasteCapture, true);
      if (keydownHandler) doc.removeEventListener("keydown", keydownHandler, true);
      if (composerSendPointerHandler) doc.removeEventListener("pointerdown", composerSendPointerHandler, true);
      if (composerSendClickHandler) doc.removeEventListener("click", composerSendClickHandler, true);
      if (cancelClickHandler) doc.removeEventListener("click", cancelClickHandler, true);
      if (sidebarNavClickHandler) doc.removeEventListener("click", sidebarNavClickHandler, true);
      if (docPasteHandler) doc.removeEventListener("paste", docPasteHandler, true);
      if (docDropHandler) doc.removeEventListener("drop", docDropHandler, true);
      if (docFileChangeHandler) doc.removeEventListener("change", docFileChangeHandler, true);
      if (docInputHandler) doc.removeEventListener("input", docInputHandler, true);
      if (docCompEndHandler) doc.removeEventListener("compositionend", docCompEndHandler, true);
      if (outsidePopoverHandler) doc.removeEventListener("pointerdown", outsidePopoverHandler, true);
      if (modelTriggerClickHandler) doc.removeEventListener("pointerdown", modelTriggerClickHandler, true);
      if (modelTriggerSuppressClickHandler) doc.removeEventListener("click", modelTriggerSuppressClickHandler, true);
    }
    earlyCaptureAttached = false;
    earlyKeydownCapture = earlyPointerDownCapture = earlyClickCapture = earlyPasteCapture = null;
    revokeCachedMedia("");
    mediaLoadInflight.clear();
    stopInspectorDragMove(true);
    stopElementPicker();
    setPickerCursorStyle(false);
    setUsagePopTooltipGuard(false);
    if (annotatorCtrl && typeof annotatorCtrl.close === "function") annotatorCtrl.close();
    annotatorCtrl = null;
    removeAllLiveChatBubbleSlots();
    if (doc && typeof doc.getElementById === "function") {
      const leStyle = doc.getElementById("rudex-live-chat-style");
      if (leStyle && leStyle.parentNode) leStyle.parentNode.removeChild(leStyle);
      const ugStyle = doc.getElementById("rudex-usage-pop-guard");
      if (ugStyle && ugStyle.parentNode) ugStyle.parentNode.removeChild(ugStyle);
    }
    if (hostEl && hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
    if (themeEngine && typeof themeEngine.destroy === "function") {
      try { themeEngine.destroy(); } catch (_e) {}
    }
    hostEl = shadowRoot = rootEl = widgetMountEl = limitsMountEl = chatDockMountEl = usagePopMountEl = pickerMountEl = annotatorMountEl = popoverMountEl = updateToastMountEl = modalMountEl = null;
  }

  function classifyModelFamilyLocal(modelName) {
    const s = String(modelName || "").toLowerCase();
    if (!s) return "any";
    if (/gemini|imagen|veo/.test(s)) return "gemini";
    if (/claude|opus|sonnet|haiku|gpt|codex|o1|o3|o4|anthropic|openai/.test(s)) return "claudeGpt";
    return "any";
  }

  function isChatEligibleForAutoContinue(chatKey, qa) {
    if (!qa || !qa.autoContinueEnabled) return false;
    const ck = String(chatKey || "").trim().toLowerCase();
    if (!ck || ck === "__new__") return false;
    if (qa.autoContinueScope === "all") return true;
    if (qa.autoContinueScope === "selected") {
      return Array.isArray(qa.autoContinueChatKeys) && qa.autoContinueChatKeys.includes(ck);
    }
    if (qa.autoContinueScope === "current") {
      const target = qa.autoContinueCurrentKey || state.activeChatKey || "";
      return Boolean(target && target === ck);
    }
    return false;
  }

  const RATE_LIMIT_TEXT_RE = /model\s+quota\s+limit\s+reached|quota\s+(?:limit\s+)?exceeded|reached\s+your\s+(?:usage|rate|model)\s+limit|rate\s+limit\s+(?:exceeded|reached)|out\s+of\s+quota|usage\s+limit\s+reached|try\s+again\s+(?:in|after)\s+\d|лимит\s+(?:модели|использования|запросов)\s+(?:исчерпан|превышен|достигнут)|исчерпан\s+лимит|превышен\s+лимит|квота\s+исчерпана|попробуйте\s+снова\s+через/i;

  function detectRateLimitInChatDom() {
    if (!doc || typeof doc.querySelectorAll !== "function") return { detected: false, retryBtn: null };
    try {
      const candidates = doc.querySelectorAll('[role="alert"], [data-testid*="error"], [data-testid*="limit"], [data-testid*="quota"], [data-testid="agent-response"], main section, main div');
      let hitContainer = null;
      const startIdx = Math.max(0, (candidates ? candidates.length : 0) - 90);
      for (let i = (candidates ? candidates.length : 0) - 1; i >= startIdx; i -= 1) {
        const el = candidates[i];
        if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
        if (typeof el.closest === "function" && el.closest('[data-testid="user-message-content"], [data-testid="user-message-bubble"], pre, code, [data-rudex-live-slot]')) continue;
        const txt = String(el.textContent || "").replace(/\s+/g, " ").trim();
        if (!txt || txt.length > 520) continue;
        if (RATE_LIMIT_TEXT_RE.test(txt)) {
          hitContainer = el;
          break;
        }
      }
      if (!hitContainer) return { detected: false, retryBtn: null };
      let retryBtn = null;
      const searchScope = hitContainer.parentElement || hitContainer;
      if (searchScope && typeof searchScope.querySelectorAll === "function") {
        const btns = searchScope.querySelectorAll("button");
        for (let b = 0; btns && b < btns.length; b += 1) {
          const btn = btns[b];
          if (!btn || btn.disabled) continue;
          const bTxt = String(btn.textContent || btn.getAttribute("aria-label") || "").trim();
          if (/^(?:retry|try\s+again|resume|continue|повторить|попробовать\s+снова|продолжить)$/i.test(bTxt)) {
            retryBtn = btn;
            break;
          }
        }
      }
      return { detected: true, retryBtn };
    } catch (_e) {
      return { detected: false, retryBtn: null };
    }
  }

  function trySelectChatInSidebar(targetChatKey, targetTitle) {
    if (!doc || typeof doc.querySelectorAll !== "function") return false;
    const ck = String(targetChatKey || "").trim().toLowerCase();
    const titleLow = String(targetTitle || "").trim().toLowerCase();
    try {
      const links = doc.querySelectorAll('aside a, aside button, nav a, nav button, [data-testid="sidebar"] a, [data-testid="sidebar"] button, [data-rudex-bg-sidebar="1"] a, [data-rudex-bg-sidebar="1"] button');
      for (let i = 0; links && i < links.length; i += 1) {
        const el = links[i];
        if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
        const href = String((el.getAttribute && (el.getAttribute("href") || el.getAttribute("data-conversation-id") || el.getAttribute("data-chat-id"))) || "").toLowerCase();
        if (ck && href.includes(ck)) {
          if (typeof el.click === "function") el.click();
          return true;
        }
      }
      if (titleLow && titleLow.length >= 3) {
        for (let i = 0; links && i < links.length; i += 1) {
          const el = links[i];
          if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
          const txt = String(el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
          if (txt === titleLow || (txt.length >= 4 && txt.includes(titleLow))) {
            if (typeof el.click === "function") el.click();
            return true;
          }
        }
      }
    } catch (_e) {}
    return false;
  }

  function submitTextToNativeComposer(promptText) {
    if (!doc || typeof rv5FindNativeComposer !== "function") return false;
    const { container, editable } = rv5FindNativeComposer(doc);
    if (!editable) return false;
    try {
      if (typeof editable.focus === "function") editable.focus();
      if (typeof rv5ClearEditableText === "function") rv5ClearEditableText(editable);
      let inserted = false;
      if (typeof doc.execCommand === "function") {
        try {
          inserted = Boolean(doc.execCommand("insertText", false, promptText));
        } catch (_e) { inserted = false; }
      }
      if (!inserted) {
        if ("value" in editable && (editable.tagName === "TEXTAREA" || editable.tagName === "INPUT")) {
          editable.value = promptText;
        } else {
          editable.textContent = promptText;
        }
        try {
          const Ev = (win && win.InputEvent) || (typeof InputEvent !== "undefined" ? InputEvent : null) || (win && win.Event) || Event;
          if (Ev) editable.dispatchEvent(new Ev("input", { bubbles: true, cancelable: true, data: promptText }));
        } catch (_e) {}
      }
      const clickSend = () => {
        try {
          let sendBtn = null;
          if (container && typeof container.querySelector === "function") {
            sendBtn = container.querySelector('[data-rudex-comp-send="1"], button[type="submit"], button[data-testid*="send"], button[aria-label*="Send"], button[aria-label*="Отправить"]');
          }
          if (sendBtn && !sendBtn.disabled && typeof sendBtn.click === "function") {
            sendBtn.click();
            return true;
          }
          const KeyEv = (win && win.KeyboardEvent) || (typeof KeyboardEvent !== "undefined" ? KeyboardEvent : null);
          if (KeyEv && typeof editable.dispatchEvent === "function") {
            editable.dispatchEvent(new KeyEv("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
            return true;
          }
        } catch (_e) {}
        return false;
      };
      if (win && typeof win.setTimeout === "function") {
        win.setTimeout(clickSend, 120);
      } else {
        clickSend();
      }
      return true;
    } catch (_e) {
      return false;
    }
  }

  async function executeAutoContinueEntry(entry, cycleKey) {
    if (!entry || !entry.chatKey || state.destroyed || state.autoContinueInflight) return false;
    const qa = typeof rv5NormalizeQuotaAutomation === "function"
      ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
      : state.settings.quotaAutomation;
    if (!isChatEligibleForAutoContinue(entry.chatKey, qa)) return false;
    if (state.telemetry && state.telemetry.isGenerating) return false;

    state.autoContinueInflight = true;
    try {
      const curKey = state.activeChatKey || "__new__";
      if (curKey !== entry.chatKey) {
        const switched = trySelectChatInSidebar(entry.chatKey, entry.title);
        if (!switched) {
          state.pendingAutoResume = { entry, cycleKey };
          return false;
        }
        await new Promise((r) => (win && typeof win.setTimeout === "function" ? win.setTimeout(r, 1100) : setTimeout(r, 1100)));
        if (state.destroyed) return false;
      }

      const markRes = await invokeIpc("agy-studio:mark-auto-continue-resumed", {
        chatKey: entry.chatKey,
        cycleKey: cycleKey || `resumed-${Date.now()}`,
      });
      if (!markRes || markRes.alreadyResumed) {
        return false;
      }
      if (markRes.quotaAlerts) state.quotaAlerts = markRes.quotaAlerts;
      state.pendingAutoResume = null;

      let sent = false;
      if (qa.autoContinueRetryFirst !== false) {
        const rl = detectRateLimitInChatDom();
        if (rl.detected && rl.retryBtn && typeof rl.retryBtn.click === "function") {
          try {
            rl.retryBtn.click();
            sent = true;
          } catch (_e) {}
        }
      }
      if (!sent) {
        const isRu = state.locale !== "en";
        const defaultPrompt = isRu
          ? "Лимиты восстановились. Продолжи выполнение незавершённой задачи с того места, на котором остановился."
          : "Limits have been restored. Please continue completing the unfinished task from where you left off.";
        const promptText = String(qa.autoContinuePrompt || "").trim() || defaultPrompt;
        sent = submitTextToNativeComposer(promptText);
      }
      if (sent) {
        setToast(state.locale !== "en" ? "Лимиты восстановились — чат продолжен автоматически" : "Limits restored — chat resumed automatically", false);
      }
      renderChatDockMount();
      if (state.isOpen) renderStructure();
      return sent;
    } finally {
      state.autoContinueInflight = false;
    }
  }

  function checkAutoContinueMonitoring(now) {
    if (state.destroyed) return;
    if (now - (state.lastRateLimitScanAt || 0) < 2500) return;
    state.lastRateLimitScanAt = now;
    const qa = typeof rv5NormalizeQuotaAutomation === "function"
      ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
      : state.settings.quotaAutomation;
    if (!qa || !qa.autoContinueEnabled) return;

    const curKey = state.activeChatKey && state.activeChatKey !== "__new__" ? state.activeChatKey : "";
    if (state.pendingAutoResume && curKey && state.pendingAutoResume.entry && state.pendingAutoResume.entry.chatKey === curKey) {
      const pending = state.pendingAutoResume;
      state.pendingAutoResume = null;
      void executeAutoContinueEntry(pending.entry, pending.cycleKey);
      return;
    }

    const waitingMap = (state.quotaAlerts && state.quotaAlerts.waitingChats) || {};
    // Check if an armed chat's targetResetAt already passed (e.g. reopened Antigravity after offline notification!)
    if (curKey && waitingMap[curKey] && waitingMap[curKey].targetResetAt > 0 && now >= waitingMap[curKey].targetResetAt) {
      const w = waitingMap[curKey];
      void executeAutoContinueEntry(w, `${w.family}:offline:${Math.round(w.targetResetAt / 60000)}`);
      return;
    }

    if (!curKey || waitingMap[curKey] || (state.telemetry && state.telemetry.isGenerating)) return;
    if (!isChatEligibleForAutoContinue(curKey, qa)) return;

    const rl = detectRateLimitInChatDom();
    if (rl.detected) {
      const fam = classifyModelFamilyLocal(state.telemetry && state.telemetry.modelName);
      invokeIpc("agy-studio:arm-auto-continue", {
        chatKey: curKey,
        title: state.activeChatTitle || "",
        family: fam,
        modelName: (state.telemetry && state.telemetry.modelName) || "",
        reason: "limit-error",
      }).then((res) => {
        if (!state.destroyed && res && res.ok) {
          if (res.quotaAlerts) state.quotaAlerts = res.quotaAlerts;
          renderChatDockMount();
          if (state.isOpen) renderStructure();
        }
      });
    }
  }

  function handleQuotaRestored(payload) {
    if (state.destroyed || !payload || typeof payload !== "object") return;
    const fam = payload.family || "any";
    const cycleKey = payload.cycleKey || `${fam}:${Date.now()}`;
    if (payload.waitingChats && typeof payload.waitingChats === "object") {
      state.quotaAlerts = { waitingChats: Object.assign({}, payload.waitingChats) };
    }
    invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
      if (!state.destroyed && qs) applyQuotaSummary(qs);
    });
    const qa = typeof rv5NormalizeQuotaAutomation === "function"
      ? rv5NormalizeQuotaAutomation(state.settings.quotaAutomation)
      : state.settings.quotaAutomation;
    if (!qa || !qa.autoContinueEnabled) return;
    const waitingMap = (state.quotaAlerts && state.quotaAlerts.waitingChats) || {};
    const matching = Object.values(waitingMap).filter(
      (w) => w && (w.family === "any" || fam === "any" || w.family === fam) && isChatEligibleForAutoContinue(w.chatKey, qa)
    );
    if (matching.length === 0) return;
    // Prefer resuming currently open chat first, otherwise first matching armed chat
    const preferred = matching.find((w) => w.chatKey === state.activeChatKey) || matching[0];
    void executeAutoContinueEntry(preferred, cycleKey);
  }

  function handleNotificationClicked(payload) {
    if (state.destroyed || !payload || typeof payload !== "object") return;
    if (payload.type === "quota-reset" || payload.type === "quota-reset-test") {
      invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
        if (!state.destroyed && qs) applyQuotaSummary(qs);
      });
    }
  }

  return {
    init,
    bootEarlyTheme,
    destroy,
    setOpen,
    toggleOpen,
    toggleLiveEditPopover,
    handleHotkeyAction,
    startElementPicker,
    stopElementPicker,
    selectElementForInspector,
    openAnnotator,
    applyLiveEditsUpdate,
    applyQuotaSummary,
    handleQuotaRestored,
    handleNotificationClicked,
    applyUpdateStatus,
    applyLocalVoiceProgress,
    setViewMode,
    setLocale,
    applyRemoteState,
    estimateTokens: spTokenEst,
    pollStream,
    resolveMediaUrl: resolveStudioMediaUrl,
    parseCssColorToHex,
    parseUserHexInput,
    resolvePickerTargetAtPoint,
    collectElementsInMarqueeRect,
    splitTopLevelCssSelectors,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    createStudioPanel,
    parseQuotaFromDocumentText,
    formatQuotaPct,
    formatBytesCompact,
  };
}
