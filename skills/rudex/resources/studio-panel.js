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
    appWpDragHint: "Тяни мышкой · Колёсико — зум",
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
    appWpOpacity: "Яркость",
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
    quotaSectionTitle: "Лимиты моделей (5ч / Неделя)",
    quotaGeminiLabel: "Модели Gemini",
    quotaClaudeLabel: "Модели Claude и GPT",
    quotaCalibratedBadge: "Откалибровано",
    quotaEstimatedBadge: "Оценка",
    quotaCalibrateTip: "Откройте «Посмотреть использование» или Настройки → Модели и использование в Antigravity для точной калибровки %.",
    quotaRemShort: "Осталось:",
    quotaOpenLimitsLink: "Детали лимитов →",
    quotaTableTitle: "Расход по чатам (5ч / Неделя)",
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
    fieldQuota: "Лимиты (5ч / Нед.)",
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
    thinkingRuDesc: "Бесплатно переводит размышления агента прямо в интерфейсе (0 токенов и 0 расхода лимитов Antigravity).",
    thinkingRuGlobalDesc: "Работает автоматически во всех чатах через бесплатный переводчик — лимиты не расходуются.",
    thinkingRuOn: "Русский (авто)",
    thinkingRuDefault: "По умолчанию",
    updateSectionTitle: "Обновления Rudex",
    updateBadgeNew: "Есть обновление",
    updateAutoTitle: "Автопроверка обновлений",
    updateAutoDesc: "Фоновая проверка новых версий на GitHub с уведомлением «Обновить»",
    updateStatusLabel: "Статус",
    updateStatusIdle: "Автопроверка включена",
    updateStatusChecking: "Проверяем GitHub…",
    updateStatusUpToDate: "Установлена последняя версия",
    updateStatusAvailable: "Доступна новая версия",
    updateStatusDownloading: "Скачивание архива…",
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
    updateToastDesc: "Нажмите «Обновить» — Antigravity перезапустится с новой версией скилла.",
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
    appWpDragHint: "Drag to move · Scroll to zoom",
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
    quotaCalibratedBadge: "Calibrated",
    quotaEstimatedBadge: "Estimated",
    quotaCalibrateTip: "Open View Usage or Settings → Models & Usage in Antigravity to calibrate exact %.",
    quotaRemShort: "Remaining:",
    quotaOpenLimitsLink: "Quota details →",
    quotaTableTitle: "Per-Chat Quota Breakdown (5h / Weekly)",
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
    fieldQuota: "Quota (5h / Wk)",
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
    thinkingRuDesc: "Translates agent thinking blocks right in the UI for free (0 tokens & 0 Antigravity quota used).",
    thinkingRuGlobalDesc: "Runs automatically across all chats via free translator — zero Antigravity quota cost.",
    thinkingRuOn: "Russian (auto)",
    thinkingRuDefault: "Default",
    updateSectionTitle: "Rudex Updates",
    updateBadgeNew: "Update available",
    updateAutoTitle: "Auto-check updates",
    updateAutoDesc: "Periodically checks GitHub for updates and prompts to restart",
    updateStatusLabel: "Status",
    updateStatusIdle: "Auto-check enabled",
    updateStatusChecking: "Checking GitHub…",
    updateStatusUpToDate: "Up to date",
    updateStatusAvailable: "New version available",
    updateStatusDownloading: "Downloading archive…",
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
    if (wkHit) {
      weeklyRem = wkHit.val;
      weeklyReset = wkHit.reset;
    } else if (/(?:used\s+all\s+of|reached|exhausted)\s+your\s+weekly\s+limit|исчерпали\s+недельн[а-яё]*\s+лимит|недельн[а-яё]*\s+лимит\s+исчерпан/i.test(slice)) {
      weeklyRem = 0;
      weeklyReset = extractBoundedReset(slice, wkCrossRe);
    }
  }

  const fhUnusedM = /(?:not\s+used\s+any\s+of\s+your\s+(?:5-hour|five[- ]hour)\s+limit|ещё\s+не\s+расходовали\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит)[\s\S]{0,140}/i.exec(slice);
  if (fhUnusedM) {
    fiveHourRem = 100;
    fiveHourReset = extractBoundedReset(fhUnusedM[0], fhCrossRe);
  } else {
    const fhHit = extractPctForLabel(slice, fhLabelRe, fhCrossRe);
    if (fhHit) {
      fiveHourRem = fhHit.val;
      fiveHourReset = fhHit.reset;
    } else if (/(?:used\s+all\s+of|reached|exhausted)\s+your\s+(?:5-hour|five[- ]hour)\s+limit|исчерпали\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит|лимит\s*\(\s*5\s*ч\s*\)\s+исчерпан/i.test(slice)) {
      fiveHourRem = 0;
      fiveHourReset = extractBoundedReset(slice, fhCrossRe);
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
  const translator = opts.translator || null;
  const stylesFn = typeof opts.buildStyles === "function"
    ? opts.buildStyles
    : (typeof buildStudioStyles === "function" ? buildStudioStyles : () => "");
  const pluginMeta = opts.pluginMeta && typeof opts.pluginMeta === "object"
    ? opts.pluginMeta
    : { version: "4.4.7", dictEntries: 4048, dynamicRulesCount: 474 };

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

  function resolveStudioMediaUrl(fileName, mediaUrl) {
    const key = extractMediaFileName(fileName, mediaUrl);
    if (!key) return mediaUrl || "";
    const cached = mediaBlobCache.get(key);
    if (cached) return cached;
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
          revokeCachedMedia(key);
          const blob = new BlobCtor([res.bytes], { type: res.mime || "application/octet-stream" });
          const blobUrl = UrlApi.createObjectURL(blob);
          mediaBlobCache.set(key, blobUrl);
          if (state.mounted) {
            applyThemeToHost(state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance);
          }
        } catch (_e) {}
      });
    }
    return mediaUrl || "";
  }

  const themeEngine = opts.themeEngine || (typeof createThemeEngine === "function" ? createThemeEngine({ document: doc, window: win, resolveMediaUrl: resolveStudioMediaUrl }) : null);

  const state = {
    initialized: false,
    mounted: false,
    destroyed: false,
    locale: opts.initialLocale === "en" ? "en" : "ru",
    isOpen: false,
    activeTab: "persona",
    appearanceSubTab: "theme",
    settingsSubTab: "system",
    widgetSubSection: "mini",
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
      thinkingInRussian: true,
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
    },
    chatAgentProfile: typeof RUDEX_AGENT_PROFILE_DEFAULTS !== "undefined" ? Object.assign({}, RUDEX_AGENT_PROFILE_DEFAULTS) : { enabled: false },
    agentPopoverOpen: false,
    inlineUrgent: false,
    hasComposerText: false,
    pickerActive: false,
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
  let beforeUnloadDraftHandler = null;
  let outsidePopoverHandler = null;
  let modelTriggerClickHandler = null;
  let composerSendClickHandler = null;
  let lastTitleBarOverlaySig = "";
  let titleBarBootTimer = null;
  let quotaScrapeTimers = [];
  const composerOrigImages = []; // Ring buffer of full-resolution pasted/dropped/uploaded images before Antigravity downscales thumbnails
  const composerOrigFiles = []; // Ring buffer of attached non-image files (PDF, code, docs, etc.)
  const pendingComposerReads = new Set(); // In-flight FileReader promises so instant Enter after paste/drop never races
  const liveEditLocalPreviews = new Map(); // id -> { images: [{ name, previewDataUrl }], files: [{ name }] }
  const draftDataUrlToFileName = new Map(); // dataUrlSig -> persisted draft fileName (avoids re-sending MBs on every keystroke)
  const lastSavedDraftByChat = new Map(); // chatKey -> { text, atts: [{ name, mime, isImage, fileName }] }
  let draftSaveTimer = null;
  let draftRestoreTimer = null;
  let draftRestoreSeq = 0;
  let isRestoringDraft = false;
  let draftJustSubmittedUntil = 0;
  let lastDraftObsSig = "";
  let liveEditSendInFlight = false;
  let limitsDragState = null;
  let pickerMoveHandler = null;
  let pickerClickHandler = null;
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
      if (doc.querySelector('textarea, [contenteditable="true"]') && doc.querySelector("nav, aside")) {
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
              sidebarBg: spMixHexColor(activeApp.canvasBg, activeApp.cardBg, 0.45),
              fgColor: appNext === "light" ? "#141418" : "#ececef",
              mutedColor: appNext === "light" ? "#5c5c66" : "#9a9aa6",
              borderColor: appNext === "light" ? "rgba(17, 18, 24, 0.14)" : "rgba(255, 255, 255, 0.10)",
            }
          : (preset && preset.vars ? preset.vars : null);
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
          rootEl.style.setProperty("--rx-theme-border", isThemeLight ? "rgba(20, 20, 19, 0.09)" : "rgba(255, 255, 255, 0.08)");
          rootEl.style.setProperty("--rx-theme-border-strong", vars.borderColor || (isThemeLight ? "rgba(20, 20, 19, 0.16)" : "rgba(255, 255, 255, 0.15)"));
        }
      } else {
        for (let i = 0; i < themePropNames.length; i += 1) {
          rootEl.style.removeProperty(themePropNames[i]);
        }
      }
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

      // Sync selected UI & Mono fonts (including Claude Code fonts) into Rudex Studio & widget
      const ty = activeApp.typography || {};
      const uiFontObj = spFindFont("ui", ty.uiFont);
      const monoFontObj = spFindFont("mono", ty.monoFont);
      if (uiFontObj && uiFontObj.stack) {
        rootEl.style.setProperty("--rx-font-ui", uiFontObj.stack);
      } else {
        rootEl.style.removeProperty("--rx-font-ui");
      }
      if (monoFontObj && monoFontObj.stack) {
        rootEl.style.setProperty("--rx-font-mono", monoFontObj.stack);
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

  function setToast(msg, isErr) {
    state.toastMsg = msg || "";
    state.toastError = Boolean(isErr);
    if (toastTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(toastTimer);
    }
    const toastEl = modalMountEl ? modalMountEl.querySelector('[data-role="toast"]') : null;
    if (toastEl) {
      toastEl.textContent = state.toastMsg;
      toastEl.className = "toast-text" + (state.toastError ? " is-err" : "");
    }
    if (msg && win && typeof win.setTimeout === "function") {
      toastTimer = win.setTimeout(() => {
        state.toastMsg = "";
        const el = modalMountEl ? modalMountEl.querySelector('[data-role="toast"]') : null;
        if (el) el.textContent = "";
      }, 3200);
    }
  }

  function computeSettingsStateSig(remote) {
    try {
      const s = remote && remote.settings ? remote.settings : remote;
      return JSON.stringify({ l: remote && remote.locale, s });
    } catch (_e) {
      return "";
    }
  }

  function saveSettingsPatch(patch) {
    const seq = ++state.settingsSaveSeq;
    const prevThinkRu = Boolean(state.settings.thinkingInRussian);
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
    renderStructure();
    if (typeof patch.thinkingInRussian === "boolean" && patch.thinkingInRussian !== prevThinkRu) {
      if (state.settings.thinkingInRussian) scanThinkingBlocks(true);
      else restoreAllThinkingNodes();
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

  function applyRemoteState(remote, forceRender) {
    if (!remote || typeof remote !== "object") return;
    const sig = computeSettingsStateSig(remote);
    if (!forceRender && sig && sig === state.lastRemoteStateSig) return;
    if (sig) state.lastRemoteStateSig = sig;

    const prevThinkRu = Boolean(state.settings.thinkingInRussian);
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
      if (rawSettings.appearance && typeof rawSettings.appearance === "object") {
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
      if (rawSettings.studioUi && typeof rawSettings.studioUi === "object") {
        state.settings.studioUi = spNormalizeStudioUi(rawSettings.studioUi);
      }
      if (Array.isArray(rawSettings.customLabels)) {
        state.settings.customLabels = rawSettings.customLabels.slice(0, 120);
        if (translator && typeof translator.setCustomLabels === "function") {
          try { translator.setCustomLabels(state.settings.customLabels); } catch (_e) {}
        }
      }
      if (rawSettings.limitsWidget && typeof rawSettings.limitsWidget === "object") {
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
        state.settings.liveEditInline = Object.assign({}, state.settings.liveEditInline, rawSettings.liveEditInline);
        if (typeof rawSettings.liveEditInline.urgentIntercept === "boolean" && !state.inlineUrgent) {
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
    renderStructure();
    if (state.settings.thinkingInRussian !== prevThinkRu) {
      if (state.settings.thinkingInRussian) scanThinkingBlocks(true);
      else restoreAllThinkingNodes();
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

      const rows = doc.querySelectorAll('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id]');
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
          const bgCounts = new Map();
          const rowStyles = [];
          for (let i = 0; i < Math.min(rows.length, 25); i += 1) {
            const r = rows[i];
            if (!r || isUiOverlayNode(r)) continue;
            const bg = String(win.getComputedStyle(r).backgroundColor || "").trim();
            rowStyles.push({ r, bg });
            bgCounts.set(bg, (bgCounts.get(bg) || 0) + 1);
          }
          let majorityBg = "";
          let majorityCnt = 0;
          bgCounts.forEach((cnt, bg) => {
            if (cnt > majorityCnt) { majorityCnt = cnt; majorityBg = bg; }
          });
          const distinctActive = [];
          for (let i = 0; i < rowStyles.length; i += 1) {
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
        const composerBtns = doc.querySelectorAll('form button[aria-label], [data-testid="composer"] button[aria-label], .composer-container button[aria-label], button[data-testid="input-cancel-button"]');
        for (let i = 0; composerBtns && i < composerBtns.length; i += 1) {
          const b = composerBtns[i];
          if (!b || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(b))) continue;
          if (isHiddenAncestor(b, doc.body)) continue;
          const lbl = typeof b.getAttribute === "function" ? (b.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim() : "";
          if (/^(?:stop\s+(?:generat|respond|stream|agent)|cancel(?:\s*\(|$|\s+(?:invoc|generat|request))|остановить\s+(?:генерац|ответ|агент)|прервать\s+(?:генерац|ответ)|отмен(?:а|ить)(?:\s*\(|$|\s+(?:генерац|запрос)))/i.test(lbl)) {
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

    const isPromotion = wasActivated && prevKey === "__new__" && detected.key !== "__new__" && snap.userMsgCount <= 1 && (state.newChatDraftPersona !== null || state.newChatDraftAgentProfile !== null || snap.isGenerating || tel.isGenerating || state.pendingNewSendAt > 0);
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

    if (wasActivated && !isPromotion && !migrateFromKey && Date.now() > draftJustSubmittedUntil) {
      flushComposerDraftSync(prevKey, prevTitle);
    }

    state.hasActivatedChat = true;
    state.activeChatKey = detected.key;
    state.activeChatTitle = detected.title;
    lastDraftObsSig = "";
    const seq = ++state.activeChatSwitchSeq;
    renderStructure();
    updateLiveDom();

    if (isPromotion) {
      lastSavedDraftByChat.delete("__new__");
      invokeIpc("agy-studio:clear-composer-draft", { chatKey: "__new__" });
    } else if (!migrateFromKey) {
      restoreComposerDraftForChat(detected.key);
    }

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
    });

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
        trackHistory: false,
      });
      if (outcome && outcome.finalizedTurn) {
        recordTurnQuotaImpact(outcome.finalizedTurn.tokens, snap.chatTokens, tel.modelName || snap.modelName || "");
        scheduleTurnTranscriptSync(state.activeChatKey, state.activeChatTitle);
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
    const sig = `${cfg.presetId}|${cfg.canvasBg}|${cfg.cardBg}`;
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
          color = cfg.canvasBg || "#09090b";
          const l = parseColorLightness(color);
          symbolColor = l !== null && l > 0.58 ? "#141418" : "#f1f2f6";
        } else if (cfg.presetId !== "native" && preset && preset.vars) {
          color = preset.vars.sidebarBg || preset.vars.canvasBg || color;
          symbolColor = preset.vars.fgColor || symbolColor;
        }
        win.electronNativeAPI.setTitleBarOverlay({ color, symbolColor });
      }
    } catch (_e) {}
  }

  function applyThemeToHost(appCfg) {
    const cfg = appCfg || state.settings.appearance;
    if (themeEngine && typeof themeEngine.apply === "function") {
      try { themeEngine.apply(cfg); } catch (_e) {}
    }
    syncTheme();
    syncHostTitleBarOverlay(cfg, false);
  }

  function applyThemeFastToHost(appCfg) {
    const cfg = appCfg || state.appearanceDraft;
    if (themeEngine) {
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
    const instVer = (inst && inst.version) || pluginMeta.version || "4.4.7";
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
          installed: realU.installed || { version: pluginMeta.version || "4.4.7" },
          remote: {
            version: pluginMeta.version || "4.4.7",
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
    const commitMsg = u.remote && u.remote.commitMessage ? u.remote.commitMessage : "";
    const title = isBusyStage ? tr.updateToastBusyTitle : tr.updateToastTitle;
    const bodyMsg = isBusyStage ? stageText : (st === "error" ? stageText : (commitMsg ? `${commitMsg} — ${tr.updateToastDesc}` : tr.updateToastDesc));

    updateToastMountEl.innerHTML = `
      <div class="update-toast" role="status" aria-live="polite">
        <div class="update-toast-head">
          <div class="update-toast-title-wrap">
            <span class="update-toast-title">${iconSvg("download", 13)}<span>${escHtml(title)}</span></span>
            <span class="update-toast-ver num">${escHtml(verLabel)}</span>
          </div>
          ${isBusyStage ? "" : `<button type="button" class="icon-btn" data-action="dismiss-update" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 13)}</button>`}
        </div>
        <div class="update-toast-msg">${escHtml(bodyMsg)}</div>
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
    if (state.isOpen && state.activeTab === "settings" && (state.settingsSubTab === "export" || (state.settingsSubTab === "widget" && state.widgetSubSection === "limits"))) {
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
    const delays = [220, 680, 1450];
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
      (state.isOpen && state.activeTab === "settings" && (state.settingsSubTab === "export" || (state.settingsSubTab === "widget" && state.widgetSubSection === "limits")))
    );
    const intervalMs = state.telemetry.isGenerating
      ? 10000
      : (limUiVisible ? 22000 : 60000);
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
    if (state.isOpen && ((state.activeTab === "settings" && state.settingsSubTab === "system") || prevAvailable !== state.update.available)) {
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
    if (!doc || !doc.body) return;
    const now = Date.now();
    try {
      const circles = typeof doc.querySelectorAll === "function"
        ? doc.querySelectorAll('[data-testid="quota-progress-circle"]')
        : null;
      const hasCircles = Boolean(circles && circles.length > 0);
      const minInterval = hasCircles ? 600 : 4000;
      if (!force && now - state.lastQuotaScrapeAt < minInterval) return;
      state.lastQuotaScrapeAt = now;

      let txt = "";
      if (hasCircles) {
        const box = findQuotaCirclesContainer(circles);
        if (box) {
          const chunks = [];
          collectVisibleQuotaText(box, chunks);
          txt = chunks.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
        }
      } else if (typeof doc.querySelectorAll === "function") {
        const overlays = doc.querySelectorAll('[role="dialog"], .agy-overlay');
        for (let i = 0; overlays && i < overlays.length; i += 1) {
          const ov = overlays[i];
          if (!ov || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(ov))) continue;
          const chunks = [];
          collectVisibleQuotaText(ov, chunks);
          const candidateTxt = chunks.join("").replace(/[ \t]+\n/g, "\n").trim();
          if (candidateTxt && /limit\s*remaining|weekly\s*limit|five\s*hour|5[-\s]*hour|5h\s+limit|лимит\s*\(\s*5\s*ч\s*\)|остаток\s*(?:недельн|5|пяти)|недельн[а-яё]*\s*лимит|5[-\s]*часов|%\s*(?:left|осталось)/i.test(candidateTxt)) {
            txt = candidateTxt;
            break;
          }
        }
      }

      if (!txt || txt.length < 20) return;
      const parsed = parseQuotaFromDocumentText(txt, state.telemetry.modelName);
      if (!parsed) return;
      const sig = JSON.stringify(parsed);
      if (sig === state.lastQuotaScrapeSig && now - state.lastQuotaSyncAt < 30000) return;
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
    } catch (_e) {}
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
      const fmtFam = (rem, isEst) => {
        if (typeof rem !== "number" || !Number.isFinite(rem)) return "—";
        const val = isUsedMode ? Math.max(0, Math.min(100, Math.round(100 - rem))) : Math.max(0, Math.min(100, Math.round(rem)));
        return `${isEst ? "~" : ""}${val}%`;
      };
      const fiveHour = fmtFam(fam.fiveHourRem, fam.fiveHourEstimated);
      const week = fmtFam(fam.weeklyRem, fam.weeklyEstimated);
      const parts = [];
      if (hasReal5) parts.push(`${tr.quota5hShort} ${fiveHour}`);
      if (hasRealW) parts.push(`${tr.quotaWeekShort} ${week}`);
      return { fiveHour, week, miniText: parts.join(" · "), activeChat: ac, family: fam };
    }
    const fiveHour = ac ? formatQuotaPct(ac.fiveHourWindowPct || ac.fiveHourPct) : "—";
    const week = ac ? formatQuotaPct(ac.weeklyPct) : "—";
    const miniText = ac && ((ac.fiveHourWindowPct || ac.fiveHourPct) > 0 || ac.weeklyPct > 0)
      ? `${tr.quota5hShort} -${fiveHour} · ${tr.quotaWeekShort} -${week}`
      : `${tr.quota5hShort} — · ${tr.quotaWeekShort} —`;
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

  function findExpandedThinkingPanels() {
    if (!doc || typeof doc.querySelectorAll !== "function") return [];
    const panels = [];
    const seen = new Set();
    try {
      const triggers = doc.querySelectorAll(
        'button[data-testid="thinking-collapsible-trigger"][aria-expanded="true"], button[aria-expanded="true"]'
      );
      for (let i = 0; triggers && i < triggers.length; i += 1) {
        const btn = triggers[i];
        if (!btn || (hostEl && (btn === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(btn))))) continue;
        const testId = typeof btn.getAttribute === "function" ? (btn.getAttribute("data-testid") || "") : "";
        if (testId !== "thinking-collapsible-trigger") {
          const aria = typeof btn.getAttribute === "function" ? (btn.getAttribute("aria-label") || "").trim() : "";
          const labelTxt = aria || String(btn.textContent || "").replace(/\s+/g, " ").trim();
          if (!/^(?:Thought\s+for\b|Thought\s+Process\b|Thinking\b|Думал\b|Думает\b|Размышлял\b|Размышляет\b|Процесс\s+мышления\b|Размышлени)/i.test(labelTxt)) {
            continue;
          }
        }
        const parent = btn.parentNode;
        let panel = findThinkingContentSibling(parent, btn);
        if (!panel && parent && parent !== doc.body && parent !== doc.documentElement && parent.parentNode) {
          panel = findThinkingContentSibling(parent.parentNode, parent);
        }
        if (panel && !seen.has(panel)) {
          seen.add(panel);
          panels.push(panel);
        }
      }
    } catch (_e) {}
    return panels;
  }

  function collectTranslatableThinkingNodes(node, out) {
    if (!node) return;
    if (node.nodeType === 3) {
      const val = node.nodeValue || "";
      if (val.trim()) out.push(node);
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    if (node.nodeType === 1) {
      if (hostEl && (node === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(node)))) return;
      if (typeof node.getAttribute === "function" && node.getAttribute("data-rudex-ignore")) return;
      const tag = String(node.tagName || "").toUpperCase();
      if (
        tag === "CODE" ||
        tag === "PRE" ||
        tag === "KBD" ||
        tag === "SAMP" ||
        tag === "SCRIPT" ||
        tag === "STYLE" ||
        tag === "SVG" ||
        tag === "NOSCRIPT" ||
        tag === "BUTTON" ||
        tag === "TEXTAREA" ||
        tag === "INPUT"
      ) {
        return;
      }
    }
    const children = node.childNodes;
    if (children && typeof children.length === "number") {
      for (let i = 0; i < children.length; i += 1) {
        collectTranslatableThinkingNodes(children[i], out);
      }
    }
  }

  function restoreAllThinkingNodes() {
    if (thinkingScanTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(thinkingScanTimer);
      thinkingScanTimer = null;
    }
    if (trackedThinkingNodes.size === 0) return;
    isApplyingThinkingTranslation = true;
    try {
      trackedThinkingNodes.forEach((tn) => {
        const rec = thinkingNodeMap.get(tn);
        if (rec && rec.translated && tn.nodeValue === rec.translated) {
          tn.nodeValue = rec.orig;
          rec.translated = "";
        }
      });
      trackedThinkingNodes.clear();
    } finally {
      isApplyingThinkingTranslation = false;
    }
  }

  function scheduleThinkingScan(delayMs) {
    if (state.destroyed || !state.mounted || !state.settings.thinkingInRussian) return;
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

  function scanThinkingBlocks(immediate) {
    if (state.destroyed || !doc) return;
    if (!state.settings.thinkingInRussian) {
      restoreAllThinkingNodes();
      return;
    }
    const panels = findExpandedThinkingPanels();
    if (panels.length === 0) return;

    const nodes = [];
    for (let i = 0; i < panels.length; i += 1) {
      collectTranslatableThinkingNodes(panels[i], nodes);
    }
    if (nodes.length === 0) return;

    const now = Date.now();
    const isGen = Boolean(state.telemetry && state.telemetry.isGenerating);
    const activeRespEl = state.telemetry ? state.telemetry.activeRespEl : null;
    const batch = [];
    const nodeGroups = new Map();
    let needsFollowup = false;
    let remainingReady = false;

    for (let i = 0; i < nodes.length; i += 1) {
      const tn = nodes[i];
      const curVal = tn.nodeValue || "";
      let rec = thinkingNodeMap.get(tn);
      if (rec && rec.translated && curVal === rec.translated) {
        continue;
      }
      if (!rec || curVal !== rec.orig) {
        rec = { orig: curVal, translated: "", stableSince: now };
        thinkingNodeMap.set(tn, rec);
      }
      const core = curVal.trim();
      if (!spNeedsRuThinking(core)) continue;

      if (thinkingCache.has(core)) {
        const cached = thinkingCache.get(core);
        setThinkingCacheEntry(core, cached);
        const full = wrapEdgeSpaces(curVal, cached);
        applyThinkingNodeValue(tn, full);
        rec.translated = full;
        trackedThinkingNodes.add(tn);
        continue;
      }

      if (thinkingInflight.has(core)) continue;

      const insideActiveResp = Boolean(
        activeRespEl && typeof activeRespEl.contains === "function" && activeRespEl.contains(tn)
      );
      const isReady = Boolean(immediate || !isGen || !insideActiveResp || now - rec.stableSince >= 420);
      if (!isReady) {
        needsFollowup = true;
        continue;
      }

      if (!nodeGroups.has(core)) {
        if (batch.length >= 10) {
          remainingReady = true;
          continue;
        }
        batch.push(core);
        nodeGroups.set(core, []);
      }
      nodeGroups.get(core).push(tn);
    }

    if (batch.length > 0) {
      for (let i = 0; i < batch.length; i += 1) thinkingInflight.add(batch[i]);
      invokeIpc("agy-studio:translate-thinking-batch", { texts: batch }).then((res) => {
        for (let i = 0; i < batch.length; i += 1) thinkingInflight.delete(batch[i]);
        if (state.destroyed || !state.settings.thinkingInRussian) return;
        const map = res && res.translations && typeof res.translations === "object" ? res.translations : null;
        if (map) {
          for (let i = 0; i < batch.length; i += 1) {
            const core = batch[i];
            const trText = map[core];
            if (typeof trText !== "string" || !trText.trim()) continue;
            setThinkingCacheEntry(core, trText);
            const list = nodeGroups.get(core) || [];
            for (let j = 0; j < list.length; j += 1) {
              const tn = list[j];
              const rec = thinkingNodeMap.get(tn);
              if (!rec) continue;
              if ((tn.nodeValue || "") !== rec.orig) continue;
              const full = wrapEdgeSpaces(rec.orig, trText);
              applyThinkingNodeValue(tn, full);
              rec.translated = full;
              trackedThinkingNodes.add(tn);
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
      if (state.agentPopoverOpen) { state.agentPopoverOpen = false; renderChatDockMount(); }
      if (state.liveEditOpen) { state.liveEditOpen = false; renderPopoverStructure(); }
    } else if (!isAuth && prev) {
      state.lastQuotaScrapeSig = "";
      state.lastQuotaPollAt = 0;
      pollQuotaSummaryIfDue(Date.now());
    }
    return isAuth;
  }

  function pollStream() {
    if (state.destroyed) return;
    if (doc && doc.hidden) return;
    const now = Date.now();
    const isBusy = state.telemetry.isGenerating || (now - state.lastDomMutationAt < 3000);
    if (!isBusy && now - state.lastPollAt < 650) return;
    state.lastPollAt = now;

    if (syncAuthScreenVisibility()) {
      return;
    }

    sampleStreamTick();
    scrapeDomQuotaSnapshot(false);
    pollQuotaSummaryIfDue(now);
    if (state.settings.thinkingInRussian) scanThinkingBlocks(false);
    updateLiveDom();
    syncChatDockLiveState();
    if (now - (state.lastHostMetricsAt || 0) > 900) {
      state.lastHostMetricsAt = now;
      const hm = measureHostUiMetrics();
      const mSig = `${hm.sidebarRight}|${hm.headerTop}|${hm.headerBottom}|${hm.headerRightClear}`;
      if (mSig !== state.lastHostMetricsSig) {
        state.lastHostMetricsSig = mSig;
        applyWidgetPosition();
        renderLimitsWidgetMount();
      }
    }
    if (typeof rv5InjectImageEditTriggers === "function" && now - state.lastImgInjectAt > 350) {
      state.lastImgInjectAt = now;
      rv5InjectImageEditTriggers(doc, state.locale !== "en", handleEditImageFromDom);
    }
    if (typeof rv5InjectNativeSettingsEntries === "function" && now - state.lastNativeInjectAt > 1600) {
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

  function renderMediumCardMarkup() {
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

    return `
      <div class="med-card" data-widget-body="1"${isPinned ? "" : ' data-drag-handle="1"'}>
        <div class="med-header">
          <div class="med-head-left">
            <span class="drag-grip">${iconSvg("grip", 12)}</span>
            <span class="med-status-badge">
              <span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>
              <span class="med-phase" data-live="phase">${escHtml(phase)}</span>
            </span>
          </div>
          <div class="med-head-actions">
            <button type="button" class="lang-pill-btn" data-action="toggle-locale" data-no-drag="1" title="${escAttr(tr.tooltipLang)}">${langText}</button>
            <span class="pill-actions">
              <button type="button" class="icon-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-no-drag="1" title="${escAttr(isPinned ? tr.tooltipPinUnlock : tr.tooltipPinLock)}">${iconSvg("pin", 12)}</button>
              <button type="button" class="icon-btn" data-action="to-mini" data-no-drag="1" title="${escAttr(tr.tooltipMini)}">${iconSvg("minimize", 12)}</button>
              <button type="button" class="icon-btn is-primary" data-action="open-settings" data-no-drag="1" title="${escAttr(tr.tooltipSettings)}">${iconSvg("gear", 12)}</button>
            </span>
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
            <div class="med-spark-box" data-live="sparkMed">${buildSparklineMarkup(tel.samples, 260, 40, "med")}</div>
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
            <button type="button" class="med-persona-pill" data-action="open-persona-tab" data-no-drag="1">
              <span class="status-dot" style="background:${state.chatPersona.enabled ? "var(--rx-success)" : "var(--rx-muted)"};box-shadow:none"></span>
              <span>${escHtml(personaLabel)}</span>
            </button>
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
    const effScale = wp.blur > 0 ? Math.max(wp.scale / 100, 1.06) : (wp.scale / 100);
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
    const gd = spNormalizeGreeting(state.greetingDraft);
    const presetObj = spFindThemePreset(draft.presetId);
    const wp = draft.wallpaper;
    const grads = spGetGradientPresets();
    const cRadii = typeof teResolveCornerRadii === "function" ? teResolveCornerRadii(draft) : draft.corners;

    const subTabs = [
      { id: "theme", label: tr.appSubTheme },
      { id: "uistyle", label: isRu ? "Стиль UI" : "UI Style" },
      { id: "elements", label: isRu ? "🎯 Элементы" : "🎯 Elements" },
      { id: "text", label: tr.appSubText },
      { id: "surface", label: tr.appSubSurface },
      { id: "wallpaper", label: tr.appSubWallpaper },
      { id: "corners", label: tr.appSubCorners },
      { id: "greeting", label: tr.appSubGreeting },
    ];

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
    const cornersLabel = draft.corners.mode === "custom" ? tr.cornersModeCustom.split(" ")[0] : `${cRadii.base}px`;
    const styleLabelMap = { glass: tr.appMsgStyleGlass, solid: tr.appMsgStyleSolid, minimal: tr.appMsgStyleMinimal };
    const surfaceLabel = `${styleLabelMap[draft.messageStyle] || tr.appMsgStyleGlass} · ${draft.glassOpacity}%`;

    const fonts = spGetFontPresets();
    const uiFontObj = (fonts.ui || []).find((f) => f.id === (draft.typography && draft.typography.uiFont)) || (fonts.ui && fonts.ui[0]);
    const fontShortLabel = uiFontObj ? (uiFontObj.id === "system" ? (isRu ? "Системный" : "System") : (isRu ? uiFontObj.label : (uiFontObj.labelEn || uiFontObj.label)).split(" (")[0]) : "System";

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
      <div class="subtab-bar">
        ${subTabs.map((st) => `
          <button type="button" class="subtab-btn${st.id === sub ? " is-active" : ""}" data-action="set-app-subtab" data-val="${st.id}">${escHtml(st.label)}</button>
        `).join("")}
      </div>
      <div class="layer-summary-strip">
        <button type="button" class="layer-pill${sub === "theme" ? " is-active" : ""}" data-action="set-app-subtab" data-val="theme">
          <span class="layer-dot" style="background:${escAttr(effAccent)}"></span>
          <span>${escHtml(themeLabel)}</span>
        </button>
        <span class="layer-sep">·</span>
        <button type="button" class="layer-pill${sub === "uistyle" ? " is-active" : ""}" data-action="set-app-subtab" data-val="uistyle">
          <span>${escHtml(isRu ? "Стиль" : "Style")}: ${escHtml(uiStyleShortLabel)}</span>
        </button>
        <span class="layer-sep">·</span>
        <button type="button" class="layer-pill${sub === "wallpaper" ? " is-active" : ""}" data-action="set-app-subtab" data-val="wallpaper">
          <span>${escHtml(tr.appLayerWallpaper)}: ${escHtml(wpLabel)}</span>
        </button>
        <span class="layer-sep">·</span>
        <button type="button" class="layer-pill${sub === "corners" ? " is-active" : ""}" data-action="set-app-subtab" data-val="corners">
          <span>${escHtml(cornersLabel)}</span>
        </button>
        <span class="layer-sep">·</span>
        <button type="button" class="layer-pill${sub === "text" ? " is-active" : ""}" data-action="set-app-subtab" data-val="text">
          <span>${escHtml(tr.appLayerText)}: ${escHtml(fontShortLabel)}</span>
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
      ? (isRu ? "Reply" : "Reply")
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
        <span class="uistyle-live-tools-l"><span>+</span><span>🎤</span></span>
        <span class="uistyle-live-tools-r">
          <span class="uistyle-live-model" data-live="uiStyleModel" style="${escAttr(st.modelStyle)}">${escHtml(modelSample)}</span>
          <span class="uistyle-live-mode">${isRu ? "Турбо" : "Manual"}</span>
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
    const fineOpen = Boolean(state.openDisclosures.themeFine);
    const profiles = state.settings.appearanceProfiles || [];
    const isClaudeDarkActive = draft.presetId === "claude-code-dark";
    const isClaudeLightActive = draft.presetId === "claude-code-light";

    return `
      <div class="claude-spotlight">
        <div class="claude-spot-info">
          <span class="claude-spot-title">
            <span class="claude-spot-dot"></span>
            <span>${escHtml(tr.claudeSuiteTitle)}</span>
          </span>
          <span class="claude-spot-desc">${escHtml(tr.claudeSuiteDesc)}</span>
        </div>
        <div class="claude-spot-actions">
          <button type="button" class="claude-preset-btn${isClaudeDarkActive ? " is-active" : ""}" data-action="apply-claude-suite" data-val="dark">
            <span class="claude-chip-swatch" style="background:linear-gradient(135deg,#1f1e1d 55%,#d97757 55%)"></span>
            <span>${escHtml(tr.claudeSuiteDarkBtn)}</span>
          </button>
          <button type="button" class="claude-preset-btn${isClaudeLightActive ? " is-active" : ""}" data-action="apply-claude-suite" data-val="light">
            <span class="claude-chip-swatch" style="background:linear-gradient(135deg,#faf9f5 55%,#c15f3c 55%)"></span>
            <span>${escHtml(tr.claudeSuiteLightBtn)}</span>
          </button>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appThemesTitle)}</span>
        <div class="theme-grid">
          ${presets.map((pr) => {
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
            <input type="color" class="color-input" data-app-field="accentColor" value="${escAttr(effAccent)}"/>
          </label>
        </div>
      </div>

      <details class="rx-details" data-disc="themeFine"${fineOpen ? " open" : ""}>
        <summary>${escHtml(tr.appFineTune)}</summary>
        <div class="rx-details-body">
          <div class="control-grid-2">
            <div class="color-box"><span>${escHtml(tr.appCanvasColor)}</span><input type="color" class="color-input" data-app-field="canvasBg" value="${escAttr(draft.canvasBg)}"/></div>
            <div class="color-box"><span>${escHtml(tr.appCardColor)}</span><input type="color" class="color-input" data-app-field="cardBg" value="${escAttr(draft.cardBg)}"/></div>
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
                <button type="button" class="wp-tool-btn${wp.flipX ? " is-active" : ""}" data-action="wp-toggle-flip" data-axis="x" title="Flip X">${iconSvg("flipH", 12)}</button>
                <button type="button" class="wp-tool-btn${wp.flipY ? " is-active" : ""}" data-action="wp-toggle-flip" data-axis="y" title="Flip Y">${iconSvg("flipV", 12)}</button>
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
            ${WALLPAPER_ATMOS_PRESETS.map((ap) => `
              <button type="button" class="btn btn-sm" data-action="apply-wp-atmos" data-id="${escAttr(ap.id)}">${escHtml(isRu ? ap.nameRu : ap.nameEn)}</button>
            `).join("")}
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
              <span class="cp-popup" data-cp-role="popup" style="border-radius:${eff.overlays}px">Menu / Dialog</span>
            </div>
            <div class="cp-bubble" data-cp-role="bubble" style="border-radius:${eff.messages}px">
              <div class="cp-card" data-cp-role="card" style="border-radius:${eff.cards}px">Thinking · Tool call</div>
              <div class="cp-code" data-cp-role="code" style="border-radius:${eff.code}px">const radius = "${eff.code}px";</div>
            </div>
            <div class="cp-composer" data-cp-role="composer" style="border-radius:${eff.composer}px">
              <div class="cp-input" data-cp-role="input" style="border-radius:${eff.inputs}px">Ask anything…</div>
              <button type="button" class="cp-btn" data-cp-role="btn" style="border-radius:${eff.buttons}px">Send</button>
            </div>
          </div>
        </div>
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
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm" data-action="set-corners-mode" data-val="custom">${escHtml(tr.cornersSwitchCustomBtn)}</button>
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
    const fonts = spGetFontPresets();
    const uiFontObj = (fonts.ui || []).find((f) => f.id === ty.uiFont) || { stack: "" };
    const monoFontObj = (fonts.mono || []).find((f) => f.id === ty.monoFont) || { stack: "" };
    const uiStack = uiFontObj.stack || "var(--rx-font-ui)";
    const monoStack = monoFontObj.stack || "var(--rx-font-mono)";
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

      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${escHtml(tr.appUiFont)}</span>
          <select class="select-input" data-app-field="typography.uiFont">
            ${(fonts.ui || []).map((f) => `<option value="${escAttr(f.id)}"${ty.uiFont === f.id ? " selected" : ""}>${escHtml(isRu ? f.label : (f.labelEn || f.label))}</option>`).join("")}
          </select>
        </div>
        <div class="section-group">
          <span class="section-label">${escHtml(tr.appMonoFont)}</span>
          <select class="select-input" data-app-field="typography.monoFont">
            ${(fonts.mono || []).map((f) => `<option value="${escAttr(f.id)}"${ty.monoFont === f.id ? " selected" : ""}>${escHtml(isRu ? f.label : (f.labelEn || f.label))}</option>`).join("")}
          </select>
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

  function renderSettingsTab() {
    const tr = t();
    const isRu = state.locale !== "en";
    const sub = state.settingsSubTab || "system";
    const subTabs = [
      { id: "system", label: isRu ? "Система" : "System" },
      { id: "widget", label: isRu ? "Виджеты" : "Widgets" },
      { id: "studio", label: isRu ? "Окно" : "Window" },
      { id: "history", label: isRu ? "История" : "History" },
      { id: "workshop", label: isRu ? "Мастерская" : "Workshop" },
      { id: "hotkeys", label: isRu ? "Клавиши" : "Hotkeys" },
      { id: "export", label: isRu ? "Экспорт" : "Export" },
    ];
    let body = "";
    if (sub === "workshop" && typeof rv5RenderWorkshopHtml === "function") body = rv5RenderWorkshopHtml(state.workshop, isRu);
    else if (sub === "history" && typeof rv5RenderInputHistoryHtml === "function") {
      body = rv5RenderInputHistoryHtml({
        isRu,
        composerDraftsEnabled: state.settings.composerDraftsEnabled !== false,
        inputHistoryEnabled: state.settings.inputHistoryEnabled !== false,
        draftCount: state.inputHistory ? state.inputHistory.draftCount : 0,
        items: state.inputHistory ? state.inputHistory.items : [],
        loading: Boolean(state.inputHistory && state.inputHistory.loading),
      });
    }
    else if (sub === "hotkeys" && typeof rv5RenderKeybindingsHtml === "function") body = rv5RenderKeybindingsHtml(state.settings.keybindings, state.recordingKeybindingId, isRu);
    else if (sub === "studio") body = renderStudioDesignSub(tr, isRu);
    else if (sub === "widget") body = renderWidgetSub(tr, isRu);
    else if (sub === "export") body = renderMonitorTab() + `<div style="border-top:1px solid var(--rx-border);margin-top:12px;padding-top:12px">${renderExportSub(tr)}</div>`;
    else body = renderSystemSub(tr);

    return `
      <div class="subtab-bar">
        ${subTabs.map((st) => `
          <button type="button" class="subtab-btn${st.id === sub ? " is-active" : ""}" data-action="set-settings-subtab" data-val="${st.id}">${escHtml(st.label)}</button>
        `).join("")}
      </div>
      ${body}
    `;
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
    const wSec = state.widgetSubSection === "limits" ? "limits" : "mini";
    const lwOn = Boolean(s.limitsWidget && s.limitsWidget.enabled);
    const secBar = `
      <div class="subtab-bar is-segmented" style="margin-bottom:4px">
        <button type="button" class="subtab-btn${wSec === "mini" ? " is-active" : ""}" data-action="set-widget-subsection" data-val="mini">${escHtml(isRu ? "Мини-окно (TPS / RU)" : "Mini Widget (TPS / RU)")}</button>
        <button type="button" class="subtab-btn${wSec === "limits" ? " is-active" : ""}" data-action="set-widget-subsection" data-val="limits">${escHtml(isRu ? "Лимиты Antigravity" : "Antigravity Limits")}${lwOn ? ' <span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:var(--rx-accent);margin-left:4px;vertical-align:middle"></span>' : ""}</button>
      </div>
    `;
    if (wSec === "limits" && typeof rv5RenderLimitsTabHtml === "function") {
      return secBar + rv5RenderLimitsTabHtml({
        limitsWidget: state.settings.limitsWidget,
        quotaSummary: state.quotaSummary,
        activeModelName: state.telemetry.modelName,
        systemFonts: state.systemFonts,
        monitorHtml: "",
        exportHtml: "",
        isRu,
        isLight: state.theme === "light",
      });
    }
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
    const previewMarkup = isMedPrev ? renderMediumCardMarkup() : renderMiniCapsuleMarkup(true);
    state.lastPreviewCapsuleHtml = previewMarkup;

    return `
      ${secBar}
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
              thumbStyle = "background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.14)";
              capsuleStyle = "width:28px;height:10px;border-radius:999px;background:transparent;border:1px solid rgba(255,255,255,0.24)";
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
              <span>${escHtml(tr.quota5hShort)} ${escHtml(tr.quotaRemShort)} ${famData.fiveHourReset ? "(" + escHtml(famData.fiveHourReset) + ")" : ""}</span>
              <b class="num">${rem5 !== null ? rem5 + "%" : escHtml(missing5hLabel)}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${rem5 !== null ? rem5 : 0}%"></div></div>
          </div>
          <div class="quota-bar-row">
            <div class="quota-bar-labels">
              <span>${escHtml(tr.quotaWeekShort)} ${escHtml(tr.quotaRemShort)} ${famData.weeklyReset ? "(" + escHtml(famData.weeklyReset) + ")" : ""}</span>
              <b class="num">${remW !== null ? remW + "%" : escHtml(missingWkLabel)}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${remW !== null ? remW : 0}%;background:var(--rx-success)"></div></div>
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
              <span>${escHtml(tr.quotaCol5h)}</span>
              <span>${escHtml(tr.quotaColWeek)}</span>
              <span>${escHtml(tr.quotaColTurns)}</span>
            </div>
            ${rows.map((r) => `
              <div class="quota-table-row${r.chatKey === state.activeChatKey ? " is-active" : ""}">
                <span class="quota-chat-name" title="${escAttr(r.title)}">${escHtml(r.title)}</span>
                <span class="quota-chat-name" style="font-weight:400;color:var(--rx-muted)" title="${escAttr(r.modelName)}">${escHtml(r.modelName || r.primaryFamily)}</span>
                <span class="num">${escHtml(formatQuotaPct(r.fiveHourWindowPct))} / ${escHtml(formatQuotaPct(r.fiveHourPct))}</span>
                <span class="num">${escHtml(formatQuotaPct(r.weeklyPct))}</span>
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
    const autoUpdates = state.settings.autoCheckUpdates !== false;
    const u = state.update || {};
    const uStatus = u.status || "idle";
    const uBusy = uStatus === "checking" || uStatus === "downloading" || uStatus === "extracting" || uStatus === "installing" || uStatus === "restarting";
    const inst = u.installed || {};
    const ver = inst.version || pluginMeta.version || "4.4.7";
    const verDisplay = inst.commitShort ? `v${ver} · #${inst.commitShort}` : `v${ver}`;
    const dictCount = pluginMeta.dictEntries || 4048;
    const dynCount = pluginMeta.dynamicRulesCount || 474;

    const checkedTime = formatLastCheckTime(u.lastCheckedAt);
    const instShaTag = inst.commitShort ? ` · #${inst.commitShort}` : "";
    const remShaTag = u.remote && u.remote.commitShort ? ` → #${u.remote.commitShort}` : "";

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
              <span class="row-title">${isRu ? "Черновики чатов и история ввода (последние 20)" : "Chat drafts & input history (last 20)"}</span>
              <span class="row-desc">${isRu ? "Автосохранение текста и файлов в чатах + копирование последних 20 сообщений и файлов." : "Auto-saves composer text & files per chat + copy your last 20 messages & files."}</span>
            </div>
            <button type="button" class="btn btn-sm" data-action="open-input-history">${isRu ? "Открыть →" : "Open →"}</button>
          </div>
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
              ${u.available ? `<span class="badge-active">${escHtml(tr.updateBadgeNew)}</span>` : ""}
              <button type="button" class="btn btn-sm btn-ghost" data-action="preview-update-toast">${escHtml(tr.updateBtnPreview)}</button>
              <button type="button" class="btn btn-sm" ${uBusy ? "disabled" : ""} data-action="check-updates">${iconSvg("reset", 12)}${escHtml(tr.updateBtnCheck)}</button>
              ${u.available ? `<button type="button" class="btn btn-sm btn-primary" ${uBusy ? "disabled" : ""} data-action="install-update">${iconSvg("download", 12)}${escHtml(tr.updateBtnInstallRestart)}</button>` : ""}
            </div>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.hotkeysTitle)}</span>
        <div class="card">
          <div class="row-item"><span class="row-title">${escHtml(tr.hkToggleLang)}</span><span class="kbd">Ctrl + Alt + L</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkToggleModal)}</span><span class="kbd">Ctrl + Alt + P</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkAppScale)}</span><span class="kbd">Ctrl + / − / 0</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkWidgetResize)}</span><span class="kbd">${escHtml(tr.hkWidgetResizeKey)}</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkDoubleClick)}</span><span class="kbd">${escHtml(tr.hkDoubleClickKey)}</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkEsc)}</span><span class="kbd">Esc</span></div>
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

  function renderModalShell() {
    if (!state.isOpen) return "";
    const tr = t();
    const sui = spNormalizeStudioUi(state.settings.studioUi);
    const isRu = state.locale !== "en";
    const tabs = [
      { id: "persona", label: isRu ? "Агент" : "Agent", ic: "persona", title: isRu ? "Агент и правки на лету" : "Agent & Live Edits", sub: isRu ? "Тумблеры инструментов (по умолчанию Авто), правки без остановки и характер" : "Tool toggles (Auto by default), inline live edits & persona", dot: Boolean(state.chatPersona.enabled || (state.chatAgentProfile && state.chatAgentProfile.enabled)) },
      { id: "appearance", label: isRu ? "Оформление" : "Appearance", ic: "palette", title: tr.modalTitleAppearance, sub: isRu ? "Темы, 4 слота шрифтов, прицел по элементам, границы, обои и углы" : "Themes, 4 font slots, element picker, borders, wallpaper & corners" },
      { id: "settings", label: isRu ? "Настройки" : "Settings", ic: "gear", title: isRu ? "Виджеты, лимиты, мастерская и система" : "Widgets, Limits, Workshop & System", sub: isRu ? "Мини-окно, лимиты, история, мастерская AGY, клавиши, монитор и язык" : "Mini widget, limits, history, AGY workshop, hotkeys, monitor & language", dot: Boolean((state.update && state.update.available) || (state.settings.limitsWidget && state.settings.limitsWidget.enabled)) },
    ];
    const effTabId = state.activeTab === "monitor" ? "settings" : state.activeTab;
    const current = tabs.find((x) => x.id === effTabId) || tabs[0];
    const isAppearanceTab = current.id === "appearance";
    const isAppearanceDrawer = isAppearanceTab && Boolean(state.appearanceDockedRight);
    let bodyHtml = "";
    if (current.id === "appearance") {
      bodyHtml = renderAppearanceDrawerBody();
    } else if (current.id === "persona") {
      bodyHtml = typeof rv5RenderAgentHubTabHtml === "function"
        ? rv5RenderAgentHubTabHtml({
            agentProfile: state.chatAgentProfile,
            defaultProfile: state.settings.agentProfileDefault,
            customPresets: state.settings.customAgentPresets || [],
            liveEditInline: state.settings.liveEditInline,
            personaHtml: renderPersonaTab(),
            isRu,
            newAgentPresetName: state.newAgentPresetName,
          })
        : renderPersonaTab();
    } else {
      bodyHtml = renderSettingsTab();
    }

    const searchQ = String(state.settingsSearchQuery || "").trim().toLowerCase();
    const quickIndex = searchQ ? [
      { k: "стиль ui композер ввод чат модел claude code codex opencode antigravity style composer bubble model", label: isRu ? "Стиль UI (Antigravity / Claude Code / Codex / OpenCode)" : "UI Style (Antigravity / Claude Code / Codex / OpenCode)", tab: "appearance", appSub: "uistyle" },
      { k: "шрифт font типографика ввод агент код", label: isRu ? "Шрифты (4 слота)" : "Fonts (4 slots)", tab: "appearance", appSub: "text" },
      { k: "прицел элемент цвет размер переимен скрыть picker rename", label: isRu ? "🎯 Прицел и переименование элементов" : "🎯 Element Picker & Rename", tab: "appearance", appSub: "elements" },
      { k: "границ обводк стекло прозрачн border surface", label: isRu ? "Границы блоков и обводка" : "Block Borders & Surface", tab: "appearance", appSub: "surface" },
      { k: "обои градиент видео картинк wallpaper", label: isRu ? "Обои и градиенты" : "Wallpaper & Gradients", tab: "appearance", appSub: "wallpaper" },
      { k: "лимит квот экран 5ч недел quota limit виджет мини", label: isRu ? "Виджеты и Лимиты Antigravity" : "Widgets & Antigravity Limits", tab: "settings", setSub: "widget" },
      { k: "субагент тумблер пресет инструмент чат на лету правк характер agent preset subagent", label: isRu ? "Пульт агента, пресеты и правки на лету" : "Agent Presets & Live Edits", tab: "persona" },
      { k: "клавиш хоткей shortcut hotkey keybind дзен", label: isRu ? "⌨ Редактор горячих клавиш" : "⌨ Keybindings Editor", tab: "settings", setSub: "hotkeys" },
      { k: "правил скилл skill rule mcp хук hook плагин кастом workshop", label: isRu ? "🧩 Мастерская AGY (Rules / Skills / MCP)" : "🧩 AGY Workshop", tab: "settings", setSub: "workshop" },
      { k: "масштаб scale zoom язык бекап экспорт json монитор tps", label: isRu ? "Система, масштаб и JSON-бекап" : "System, Scale & JSON Backup", tab: "settings", setSub: "system" },
    ].filter((it) => it.k.includes(searchQ) || it.label.toLowerCase().includes(searchQ)) : [];

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
                <span class="brand-ver num">v${escHtml(pluginMeta.version || "5.0.0")}</span>
              </div>
              <div class="rx-search-wrap">
                <input type="text" class="rx-search-input" data-role="settingsSearch" value="${escAttr(state.settingsSearchQuery || "")}" placeholder="${isRu ? "Поиск настроек…" : "Search settings…"}"/>
                ${quickIndex.length > 0 ? `
                  <div style="display:flex;flex-direction:column;gap:3px;margin-top:6px">
                    ${quickIndex.slice(0, 5).map((q) => `<button type="button" class="btn btn-sm" style="justify-content:flex-start;text-align:left;font-size:11px" data-action="jump-search-hit" data-tab="${escAttr(q.tab)}" data-app-sub="${escAttr(q.appSub || "")}" data-set-sub="${escAttr(q.setSub || "")}">${escHtml(q.label)}</button>`).join("")}
                  </div>
                ` : ""}
              </div>
              <nav class="nav-list">
                ${tabs.map((tb) => `
                  <button type="button" class="nav-item${tb.id === current.id ? " is-active" : ""}" data-action="switch-tab" data-tab="${tb.id}" title="${escAttr(tb.label)}">
                    <span class="nav-ic">${iconSvg(tb.ic, 15)}</span>
                    <span class="nav-label">${escHtml(tb.label)}</span>
                    ${tb.dot ? '<span class="nav-dot"></span>' : ""}
                    ${tb.badge ? `<span class="nav-badge">${escHtml(tb.badge)}</span>` : ""}
                  </button>
                `).join("")}
              </nav>
              <div class="sidebar-foot">
                <div class="sidebar-foot-row">
                  <div class="sidebar-quick-actions">
                    <button type="button" class="lang-pill-btn" data-action="toggle-locale" title="${escAttr(tr.tooltipLang)}">${state.locale === "en" ? "EN" : "RU"}</button>
                    <button type="button" class="icon-btn" data-action="cycle-studio-theme" title="${escAttr(tr.studioThemeCycleTip)}">${iconSvg("palette", 13)}</button>
                    <button type="button" class="icon-btn" data-action="open-studio-design" title="${escAttr(tr.setSubStudio)}">${iconSvg("layout", 13)}</button>
                  </div>
                  <span class="kbd">Ctrl+Alt+P</span>
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
                ${isAppearanceTab ? `
                  <button type="button" class="btn btn-sm" data-action="toggle-appearance-dock">
                    ${iconSvg(isAppearanceDrawer ? "panelCenter" : "panelRight", 13)}
                    <span>${escHtml(isAppearanceDrawer ? tr.appDockCenterBtn : tr.appDockRightBtn)}</span>
                  </button>
                ` : (current.id !== "settings" ? `
                  <button type="button" class="btn btn-sm btn-ghost" data-action="open-studio-design" title="${escAttr(tr.setSubStudio)}">
                    ${iconSvg("layout", 13)}
                    <span>${escHtml(tr.studioDesignQuickBtn)}</span>
                  </button>
                ` : "")}
                <button type="button" class="icon-btn" data-action="close-modal" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 15)}</button>
              </div>
            </header>
            <div class="modal-body">${bodyHtml}</div>
            ${isAppearanceTab ? `
              <footer class="drawer-sticky-footer">
                <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
                  <button type="button" class="btn btn-sm btn-ghost" data-action="reset-appearance">${escHtml(tr.appResetBtn)}</button>
                  ${state.toastMsg
                    ? `<span class="studio-toast-pill${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>`
                    : (state.appearanceDirty ? `<span class="studio-dirty-pill" data-role="toast">${escHtml(tr.appDirtyBadge)}</span>` : `<span class="studio-toast-pill" data-role="toast"></span>`)}
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  <button type="button" class="btn btn-sm" data-action="discard-appearance">${escHtml(tr.appCancelBtn)}</button>
                  <button type="button" class="btn btn-sm${state.appearanceDirty ? " btn-primary" : ""}" data-action="apply-appearance">${iconSvg("check", 12)}${escHtml(tr.appApplyBtn)}</button>
                </div>
              </footer>
            ` : ""}
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
        // 3. Measure right-side header action cluster ("Открыть IDE" / "Open IDE" + pane icons) so inline-header widgets NEVER collide with it
        const btns = doc.querySelectorAll('button, [role="button"], a');
        let ideLeft = vw;
        let ideTop = 0;
        let ideBottom = 0;
        for (let i = 0; btns && i < btns.length; i += 1) {
          const b = btns[i];
          if (!b || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(b))) continue;
          if (typeof b.getBoundingClientRect !== "function") continue;
          const r = b.getBoundingClientRect();
          if (!r || r.width < 12 || r.height < 12 || r.top < 0 || r.bottom > 110 || r.left < vw * 0.55) continue;
          const txt = String(b.textContent || "").trim().toLowerCase();
          if (txt.includes("открыть ide") || txt.includes("open ide") || (headerBottom > 0 && r.top >= headerTop - 2 && r.bottom <= headerBottom + 4)) {
            if (r.left < ideLeft) ideLeft = Math.round(r.left);
            if (r.bottom > ideBottom) {
              ideTop = Math.round(r.top);
              ideBottom = Math.round(r.bottom);
            }
          }
        }
        if (ideBottom > 0) {
          if (headerBottom === 0 || ideBottom > headerBottom) {
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

  function clampWidgetToViewport() {
    if (!widgetMountEl || !win || state.settings.layoutMode !== "floating") return;
    try {
      const vw = Number(win.innerWidth) || 0;
      const vh = Number(win.innerHeight) || 0;
      if (vw <= 40 || vh <= 40) return;
      const rect = typeof widgetMountEl.getBoundingClientRect === "function" ? widgetMountEl.getBoundingClientRect() : null;
      const w = rect && rect.width ? rect.width : 240;
      const h = rect && rect.height ? rect.height : 40;
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
      if (state.activeTab === "settings" && state.settingsSubTab === "widget") {
        if (state.widgetSubSection === "limits") {
          const prevStage = typeof modalMountEl.querySelector === "function" ? modalMountEl.querySelector('[data-role="limitsPreviewStage"]') : null;
          if (prevStage && typeof rv5BuildLimitsWidgetHtml === "function") {
            const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : state.settings.limitsWidget;
            prevStage.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, tel.modelName || "", state.locale !== "en", true);
          }
        } else {
          const nextPreview = renderMiniCapsuleMarkup(true);
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

      modalMountEl.innerHTML = state.isOpen ? renderModalShell() : "";
      state.lastSparkModalSig = (state.telemetry.samples || []).join(",");

      if (state.isOpen && prevScrollTop > 0) {
        const newBody = modalMountEl.querySelector(".modal-body");
        if (newBody) newBody.scrollTop = prevScrollTop;
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
    renderPickerMount();
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

  function refreshWorkshopData() {
    state.workshop.loading = true;
    invokeIpc("agy-studio:workshop-list", { workspacePath: "" }).then((res) => {
      if (state.destroyed) return;
      state.workshop.loading = false;
      if (res && res.ok) state.workshop.data = res;
      if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "workshop") {
        renderStructure();
      }
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
    if (effPos === "floating" && typeof lw.floatX === "number" && typeof lw.floatY === "number") {
      const nx = Math.max(8, Math.min(Math.max(8, hm.vw - 140), Math.round(lw.floatX)));
      const ny = Math.max(8, Math.min(Math.max(8, hm.vh - 44), Math.round(lw.floatY)));
      limitsMountEl.style.left = `${nx}px`;
      limitsMountEl.style.top = `${ny}px`;
    } else {
      const safeLeft = hm.sidebarRight > 0 ? hm.sidebarRight + 16 : 16;
      const safeTop = hm.headerBottom + 12;
      const miniVisible = !lw.onlyLimitsMode && state.settings.dockPosition !== "hidden" && state.settings.layoutMode !== "floating";
      const miniDock = normalizeDockPosition(state.settings.dockPosition);
      const miniRect = miniVisible && widgetMountEl && typeof widgetMountEl.getBoundingClientRect === "function" ? widgetMountEl.getBoundingClientRect() : null;
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
        if (hm.composerRight > 0 && hm.vw - hm.composerRight > 200) {
          limitsMountEl.style.maxWidth = `${Math.max(190, hm.vw - hm.composerRight - 32)}px`;
        }
      } else if (effPos === "bottom-left") {
        limitsMountEl.style.bottom = `${14 + (sameSlot ? miniH + 10 : 0)}px`;
        limitsMountEl.style.left = `${safeLeft}px`;
        if (hm.composerLeft > safeLeft + 180) {
          limitsMountEl.style.maxWidth = `${Math.max(190, hm.composerLeft - safeLeft - 14)}px`;
        }
      }
    }
    if (typeof rv5BuildLimitsWidgetHtml === "function") {
      limitsMountEl.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, state.telemetry.modelName, state.locale !== "en");
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
      const busyBtns = doc.querySelectorAll('[data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"], [data-testid="send-button-loading"], [data-testid="send-button-pending"]');
      for (let i = 0; busyBtns && i < busyBtns.length; i += 1) {
        const b = busyBtns[i];
        if (!b) continue;
        if (hostEl && (b === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(b)))) continue;
        if (!isHiddenAncestor(b, doc.body)) return true;
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
            const entry = { name: fname || `screenshot-${Date.now()}.png`, mime: mime || "image/png", dataUrl, width: 0, height: 0, aspect: 0, ts: Date.now() };
            composerOrigImages.push(entry);
            if (composerOrigImages.length > 8) composerOrigImages.shift();
            const ImgCtor = (win && win.Image) || (typeof Image !== "undefined" ? Image : null);
            if (ImgCtor) {
              const probe = new ImgCtor();
              probe.onload = () => {
                entry.width = probe.naturalWidth || probe.width || 0;
                entry.height = probe.naturalHeight || probe.height || 0;
                entry.aspect = entry.height > 0 ? entry.width / entry.height : 0;
                resolve();
              };
              probe.onerror = () => resolve();
              probe.src = dataUrl;
            } else {
              resolve();
            }
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

  function getComposerAttachmentScope(container) {
    if (!container) return null;
    const p = container.parentElement;
    if (p && p !== doc.body && p !== doc.documentElement && p.tagName !== "MAIN" && typeof p.querySelector === "function") {
      try {
        if (!p.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"]')) {
          return p;
        }
      } catch (_e) {}
    }
    return container;
  }

  function collectComposerChipFileMatches(scopeEl, editable) {
    if (!scopeEl || composerOrigFiles.length === 0) return [];
    const now = Date.now();
    // Read text outside the editable box so we detect Antigravity's attachment file chips reliably
    let scopeText = "";
    try {
      const fullTxt = String(scopeEl.textContent || "");
      const edTxt = editable ? String(editable.textContent || "") : "";
      scopeText = (edTxt ? fullTxt.replace(edTxt, " ") : fullTxt).toLowerCase();
    } catch (_e) {}
    const matched = [];
    const seen = new Set();
    for (let i = composerOrigFiles.length - 1; i >= 0 && matched.length < 6; i -= 1) {
      const f = composerOrigFiles[i];
      if (!f || !f.name || !f.dataUrl || seen.has(f.name) || now - f.ts > 20 * 60 * 1000) continue;
      const lowName = f.name.toLowerCase();
      const baseNoExt = lowName.replace(/\.[^.]+$/, "");
      if (scopeText.includes(lowName) || (baseNoExt.length >= 4 && scopeText.includes(baseNoExt))) {
        seen.add(f.name);
        matched.push({ file: f, cacheIdx: i });
      }
    }
    return matched;
  }

  function hasComposerAttachments(container, editable) {
    const scope = getComposerAttachmentScope(container);
    if (!scope || typeof scope.querySelectorAll !== "function") return false;
    const imgs = scope.querySelectorAll("img");
    for (let i = 0; imgs && i < imgs.length; i += 1) {
      if (imgs[i] && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(imgs[i]))) return true;
    }
    return collectComposerChipFileMatches(scope, editable).length > 0;
  }

  function findFullResForThumbnail(imgEl, usedCacheSet) {
    const tw = (imgEl && (Number(imgEl.naturalWidth) || Number(imgEl.width))) || 0;
    const th = (imgEl && (Number(imgEl.naturalHeight) || Number(imgEl.height))) || 0;
    const tAspect = th > 0 ? tw / th : 0;
    // Match against our ring buffer of original full-res pasted/dropped images by aspect ratio & recency
    for (let i = composerOrigImages.length - 1; i >= 0; i -= 1) {
      const c = composerOrigImages[i];
      if (!c || !c.dataUrl) continue;
      if (usedCacheSet && usedCacheSet.has(c)) continue;
      if (Date.now() - c.ts > 30 * 60 * 1000) continue;
      if (c.width > 0 && c.width > tw * 1.15) {
        if (!tAspect || !c.aspect || Math.abs(c.aspect - tAspect) < 0.14) {
          if (usedCacheSet) usedCacheSet.add(c);
          return c.dataUrl;
        }
      } else if (c.width === 0 && tw < 450) {
        if (usedCacheSet) usedCacheSet.add(c);
        return c.dataUrl;
      }
    }
    return "";
  }

  function handleEditImageFromDom(info) {
    if (!info || !info.imgEl) return;
    const im = info.imgEl;
    const rawSrc = String((im.getAttribute && im.getAttribute("src")) || im.src || "");
    const natW = Number(im.naturalWidth) || Number(im.width) || 0;
    const natH = Number(im.naturalHeight) || Number(im.height) || 0;
    const openWith = (url) => {
      if (!url) return;
      openAnnotator({
        dataUrl: url,
        sourceImgEl: im,
        thumbWrapper: info.thumbWrapper || null,
        dialogEl: info.dialogEl || null,
        fromLightbox: Boolean(info.fromLightbox),
      });
    };

    // 1. If the DOM image itself is already high-resolution (>=600px), use it directly
    if (natW >= 600) {
      const directUrl = (rawSrc.startsWith("data:image/") || rawSrc.startsWith("blob:")) ? rawSrc : imageElToDataUrl(im);
      openWith(directUrl);
      return;
    }

    // 2. Antigravity downscales composer thumbnails (~160-240px): check our full-res paste/drop/upload cache first!
    const cachedFull = findFullResForThumbnail(im);
    if (cachedFull) {
      openWith(cachedFull);
      return;
    }

    // 3. Fallback: if clipboard still holds the full-res screenshot with matching aspect ratio, grab it seamlessly!
    const fallbackUrl = (rawSrc.startsWith("data:image/") || rawSrc.startsWith("blob:")) ? rawSrc : imageElToDataUrl(im);
    invokeIpc("agy-studio:read-clipboard-image").then((res) => {
      if (state.destroyed) return;
      if (res && res.ok && res.dataUrl) {
        const ImgCtor = (win && win.Image) || (typeof Image !== "undefined" ? Image : null);
        if (ImgCtor && natW > 0 && natH > 0) {
          const probe = new ImgCtor();
          probe.onload = () => {
            const cw = probe.naturalWidth || probe.width || 0;
            const ch = probe.naturalHeight || probe.height || 0;
            const clipAsp = ch > 0 ? cw / ch : 0;
            const thumbAsp = natW / natH;
            if (cw > natW * 1.35 && (!clipAsp || Math.abs(clipAsp - thumbAsp) < 0.14)) {
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

  function positionChatDock() {
    if (!chatDockMountEl || !doc || typeof rv5FindNativeComposer !== "function") return;
    if (state.settings.zenMode || hasVisibleNativeModal()) {
      chatDockMountEl.style.display = "none";
      return;
    }
    const { container } = rv5FindNativeComposer(doc);
    if (!container || typeof container.getBoundingClientRect !== "function") {
      chatDockMountEl.style.display = "none";
      return;
    }
    const rect = container.getBoundingClientRect();
    if (!rect || rect.width < 120 || rect.height < 24) {
      chatDockMountEl.style.display = "none";
      return;
    }
    const vh = (win && win.innerHeight) || 800;
    const dockLeft = Math.max(8, Math.round(rect.left));
    const dockBottom = Math.max(12, Math.round(vh - rect.top + 6));
    const dockBox = {
      left: dockLeft,
      right: dockLeft + Math.min(260, Math.round(rect.width)),
      top: vh - dockBottom - 32,
      bottom: vh - dockBottom,
    };
    if (!state.agentPopoverOpen && hasOverlappingNativePopover(dockBox)) {
      chatDockMountEl.style.display = "none";
      return;
    }
    chatDockMountEl.style.display = "flex";
    chatDockMountEl.style.left = `${dockLeft}px`;
    chatDockMountEl.style.width = `${Math.round(rect.width)}px`;
    chatDockMountEl.style.bottom = `${dockBottom}px`;
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
    const renderRow = (label, rem, isEst, resetStr) => {
      const hasVal = typeof rem === "number" && Number.isFinite(rem);
      const pctText = hasVal
        ? `${isEst ? "~" : ""}${Math.max(0, Math.min(100, Math.round(rem)))}% ${isRu ? "осталось" : "left"}`
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
    const nextHtml = `
      <div class="rx-usage-pop" role="dialog" aria-label="${escAttr(isRu ? "Использование моделей" : "Model Usage")}">
        <div class="rx-usage-head">
          <span class="rx-usage-title">${escHtml(isRu ? "Использование" : "Usage")}</span>
          <button type="button" class="rx-lim-btn" data-action="close-model-usage-pop" title="${escAttr(isRu ? "Закрыть" : "Close")}">✕</button>
        </div>
        <div class="rx-usage-lock-note">${escHtml(isRu ? "Агент сейчас работает — сменить модель в этом чате нельзя, но лимиты доступны для просмотра." : "Agent is running — model switching is locked in this chat, but limits remain viewable.")}</div>
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
    const popW = 316;
    const desiredLeft = rect
      ? (rect.left > vw * 0.45 ? Math.round(rect.right - popW) : Math.round(rect.left))
      : Math.round(vw / 2 - popW / 2);
    const left = Math.max(12, Math.min(vw - popW - 12, desiredLeft));
    const bottom = rect ? Math.max(14, Math.min(vh - 180, Math.round(vh - rect.top + 10))) : 88;
    usagePopMountEl.style.left = `${left}px`;
    usagePopMountEl.style.bottom = `${bottom}px`;
    usagePopMountEl.style.top = "";
    usagePopMountEl.style.right = "";
  }

  function openNativeAntigravityUsageSettings() {
    state.usagePopOpen = false;
    renderModelUsagePopover();
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    try {
      const btns = doc.querySelectorAll('aside button, aside a, nav button, nav a, button[aria-label*="Settings" i], button[aria-label*="Настройк" i]');
      let settingsBtn = null;
      for (let i = btns.length - 1; i >= 0; i -= 1) {
        const b = btns[i];
        if (!b || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(b))) continue;
        const txt = String(b.textContent || b.getAttribute("aria-label") || "").trim().toLowerCase();
        if (txt === "настройки" || txt === "settings") {
          settingsBtn = b;
          break;
        }
      }
      if (settingsBtn && typeof settingsBtn.click === "function") {
        settingsBtn.click();
        if (win && typeof win.setTimeout === "function") {
          win.setTimeout(() => {
            try {
              const items = doc.querySelectorAll('[role="dialog"] button, [role="dialog"] [role="tab"], aside button, nav button');
              for (let j = 0; items && j < items.length; j += 1) {
                const it = items[j];
                if (!it || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(it))) continue;
                const tLow = String(it.textContent || "").trim().toLowerCase();
                if (tLow.includes("модели") || tLow.includes("models")) {
                  it.click();
                  win.setTimeout(() => scrapeDomQuotaSnapshot(true), 320);
                  break;
                }
              }
            } catch (_e2) {}
          }, 260);
        }
      }
    } catch (_e) {}
  }

  function syncChatDockLiveState() {
    if (!doc || typeof rv5FindNativeComposer !== "function") return;
    const { container, editable } = rv5FindNativeComposer(doc);
    const curTxt = editable && typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
    const hasTxt = curTxt.length > 0;
    const hasExpiredDoneToast = state.lastChatDockHtml.includes("is-done") &&
      !(state.liveEdits || []).some((it) => it && it.status === "delivered" && !state.dismissedLiveEditIds.has(it.id) && Date.now() - (it.deliveredAt || 0) < 4000);
    if (hasTxt !== state.hasComposerText || hasExpiredDoneToast) {
      state.hasComposerText = hasTxt;
      renderChatDockMount();
    } else {
      positionChatDock();
      if (state.liveEdits && state.liveEdits.length > 0) syncLiveChatBubbles(false);
    }
    // Observe composer content/attachment changes to persist chat draft reliably (even when clicking attachment ×)
    if (state.hasActivatedChat && state.settings.composerDraftsEnabled !== false && !isRestoringDraft && Date.now() > draftJustSubmittedUntil && editable) {
      const scope = getComposerAttachmentScope(container);
      let imgCnt = 0;
      if (scope && typeof scope.querySelectorAll === "function") {
        const imgs = scope.querySelectorAll("img");
        for (let i = 0; imgs && i < imgs.length; i += 1) {
          if (imgs[i] && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(imgs[i]))) imgCnt += 1;
        }
      }
      const chipCnt = collectComposerChipFileMatches(scope, editable).length;
      const obsSig = `${state.activeChatKey || "__new__"}|${curTxt.length}|${curTxt.slice(0, 40)}|${curTxt.slice(-24)}|${imgCnt}|${chipCnt}`;
      if (obsSig !== lastDraftObsSig) {
        const hadPrev = lastDraftObsSig.startsWith((state.activeChatKey || "__new__") + "|");
        lastDraftObsSig = obsSig;
        if (hadPrev || hasTxt || imgCnt > 0 || chipCnt > 0) {
          scheduleComposerDraftSave(350);
        }
      }
    }
  }

  function openAnnotator(opts) {
    if (annotatorCtrl && typeof annotatorCtrl.open === "function") {
      if (state.agentPopoverOpen) {
        state.agentPopoverOpen = false;
        renderChatDockMount();
      }
      annotatorCtrl.open(opts);
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
      draftJustSubmittedUntil = Date.now() + 2000;
      if (draftSaveTimer && win && typeof win.clearTimeout === "function") {
        win.clearTimeout(draftSaveTimer);
        draftSaveTimer = null;
      }
      const submitKey = state.activeChatKey || "__new__";
      const submitTitle = state.activeChatTitle || "";
      lastSavedDraftByChat.delete(submitKey);
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
          if (!state.destroyed && state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "history") {
            refreshInputHistory();
          }
        });
      }
      if (typeof rv5ClearEditableText === "function") rv5ClearEditableText(editable, win);
      // Guarantee Lexical/ProseMirror/React editor state clears via native Chromium webContents.selectAll + delete if DOM text remains
      const ensureClearedNative = () => {
        if (state.destroyed || !editable) return;
        const stillHas = typeof rv5ReadEditableText === "function" && rv5ReadEditableText(editable).length > 0;
        if (!stillHas) return;
        try {
          if (typeof editable.focus === "function") editable.focus();
        } catch (_e) {}
        invokeIpc("agy-studio:clear-focused-input").then(() => {
          if (!state.destroyed && typeof rv5ReadEditableText === "function" && rv5ReadEditableText(editable).length > 0) {
            if (typeof rv5ClearEditableText === "function") rv5ClearEditableText(editable, win);
          }
        });
      };
      if (win && typeof win.setTimeout === "function") {
        win.setTimeout(ensureClearedNative, 16);
        win.setTimeout(ensureClearedNative, 85);
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

  async function insertTextIntoNativeComposerRich(editable, rawText) {
    const text = String(rawText || "");
    if (!editable || !text) return false;
    try { if (typeof editable.focus === "function") editable.focus(); } catch (_e) {}
    const tag = String(editable.tagName || "").toUpperCase();
    if (tag === "TEXTAREA" || tag === "INPUT") {
      try {
        const proto = win && win.HTMLTextAreaElement && win.HTMLTextAreaElement.prototype;
        const desc = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
        if (desc && typeof desc.set === "function") desc.set.call(editable, text);
        else editable.value = text;
        const Evt = (win && typeof win.Event === "function" ? win.Event : (typeof Event === "function" ? Event : null));
        if (Evt) editable.dispatchEvent(new Evt("input", { bubbles: true }));
        return true;
      } catch (_e) {}
    }
    // 1. Lexical / ProseMirror native paste (preserves multi-line breaks cleanly)
    try {
      const DtCtor = (win && win.DataTransfer) || (typeof DataTransfer !== "undefined" ? DataTransfer : null);
      const PasteEvt = (win && win.ClipboardEvent) || (typeof ClipboardEvent !== "undefined" ? ClipboardEvent : null);
      if (DtCtor && PasteEvt) {
        const dt = new DtCtor();
        dt.setData("text/plain", text);
        editable.dispatchEvent(new PasteEvt("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
        if (typeof rv5ReadEditableText === "function" && rv5ReadEditableText(editable).trim().length > 0) {
          return true;
        }
      }
    } catch (_e) {}
    // 2. Native Chromium webContents.insertText via Electron main process
    try {
      if (typeof editable.focus === "function") editable.focus();
      const res = await invokeIpc("agy-studio:insert-text-into-focused", { text });
      if (res && res.ok && typeof rv5ReadEditableText === "function" && rv5ReadEditableText(editable).trim().length > 0) {
        return true;
      }
    } catch (_e) {}
    // 3. Fallback execCommand / textContent
    try {
      if (doc && typeof doc.execCommand === "function" && doc.execCommand("insertText", false, text)) {
        if (typeof rv5ReadEditableText === "function" && rv5ReadEditableText(editable).trim().length > 0) return true;
      }
    } catch (_e) {}
    try {
      editable.textContent = text;
      const Evt = (win && typeof win.Event === "function" ? win.Event : (typeof Event === "function" ? Event : null));
      if (Evt) editable.dispatchEvent(new Evt("input", { bubbles: true }));
      return true;
    } catch (_e) {}
    return false;
  }

  function insertAttachmentsIntoNativeComposer(attachments, container, editable) {
    const list = Array.isArray(attachments) ? attachments : [];
    if (!list.length || !editable) return 0;
    const DtCtor = (win && win.DataTransfer) || (typeof DataTransfer !== "undefined" ? DataTransfer : null);
    const FileCtor = (win && win.File) || (typeof File !== "undefined" ? File : null);
    const PasteEvt = (win && win.ClipboardEvent) || (typeof ClipboardEvent !== "undefined" ? ClipboardEvent : null);
    const DragEvt = (win && win.DragEvent) || (typeof DragEvent !== "undefined" ? DragEvent : null);
    if (!DtCtor || !FileCtor) return 0;

    let attached = 0;
    const filesToAttach = [];
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      if (!a || !a.dataUrl) continue;
      const blob = draftDataUrlToBlob(a.dataUrl, a.mime);
      if (!blob) continue;
      const mime = a.mime || blob.type || "application/octet-stream";
      const fname = a.name || (a.isImage ? `screenshot-${i + 1}.png` : `file-${i + 1}.bin`);
      const file = new FileCtor([blob], fname, { type: mime });
      filesToAttach.push({ file, att: a, mime, fname });
      // Pre-register in Full HD cache & fileName map so editing & re-saving work immediately
      const sig = draftSigForDataUrl(a.dataUrl);
      if (a.fileName && sig) draftDataUrlToFileName.set(sig, a.fileName);
      if (a.isImage || mime.startsWith("image/")) {
        const entry = { name: fname, mime, dataUrl: a.dataUrl, width: 0, height: 0, aspect: 0, ts: Date.now() };
        composerOrigImages.push(entry);
        if (composerOrigImages.length > 8) composerOrigImages.shift();
        const ImgCtor = (win && win.Image) || (typeof Image !== "undefined" ? Image : null);
        if (ImgCtor) {
          try {
            const probe = new ImgCtor();
            probe.onload = () => {
              entry.width = probe.naturalWidth || probe.width || 0;
              entry.height = probe.naturalHeight || probe.height || 0;
              entry.aspect = entry.height > 0 ? entry.width / entry.height : 0;
            };
            probe.src = a.dataUrl;
          } catch (_e) {}
        }
      } else {
        composerOrigFiles.push({ name: fname, mime, size: blob.size || 0, dataUrl: a.dataUrl, ts: Date.now() });
        if (composerOrigFiles.length > 10) composerOrigFiles.shift();
      }
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
          let sent = false;
          if (PasteEvt) {
            editable.dispatchEvent(new PasteEvt("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
            sent = true;
          }
          // Also try drop on composer container if paste did not pick up non-image files
          if (DragEvt && container && win && typeof win.setTimeout === "function") {
            const targetBox = container;
            const fileObj = item.file;
            const fnameLow = item.fname.toLowerCase();
            win.setTimeout(() => {
              if (state.destroyed) return;
              const scopeNow = getComposerAttachmentScope(targetBox);
              const txtNow = scopeNow ? String(scopeNow.textContent || "").toLowerCase() : "";
              if (!txtNow.includes(fnameLow)) {
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
        if (!im || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(im))) continue;
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
    const matchedFiles = collectComposerChipFileMatches(scope, editable);
    for (let i = 0; i < matchedFiles.length && items.length < 8; i += 1) {
      const mf = matchedFiles[i].file;
      const sig = draftSigForDataUrl(mf.dataUrl);
      const cachedFileName = sig ? (draftDataUrlToFileName.get(sig) || "") : "";
      items.push({
        name: mf.name,
        mime: mf.mime || "application/octet-stream",
        isImage: false,
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
    if (pendingComposerReads.size > 0) {
      await Promise.race([
        Promise.all(Array.from(pendingComposerReads)),
        new Promise((r) => (win && typeof win.setTimeout === "function" ? win.setTimeout(r, 1200) : setTimeout(r, 1200))),
      ]);
    }
    if (state.destroyed || isRestoringDraft || Date.now() < draftJustSubmittedUntil) return;
    const { container, editable } = rv5FindNativeComposer(doc);
    if (!editable) return;
    const key = explicitKey || state.activeChatKey || "__new__";
    const title = typeof explicitTitle === "string" ? explicitTitle : (state.activeChatTitle || "");
    const snap = collectComposerSnapshotSync(container, editable);
    const resolvedAtts = await resolveSnapshotAttachments(snap.items, true);
    if (state.destroyed || isRestoringDraft || Date.now() < draftJustSubmittedUntil) return;
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
    if (!state.destroyed && res && res.ok) {
      if (res.draft && Array.isArray(res.draft.attachments)) {
        for (let i = 0; i < res.draft.attachments.length && i < resolvedAtts.length; i += 1) {
          const saved = res.draft.attachments[i];
          const src = resolvedAtts[i];
          if (saved && saved.fileName && src && src._sig) {
            draftDataUrlToFileName.set(src._sig, saved.fileName);
          }
        }
        lastSavedDraftByChat.set(key, res.draft);
      } else {
        lastSavedDraftByChat.delete(key);
      }
    }
  }

  function flushComposerDraftSync(explicitKey, explicitTitle) {
    if (state.destroyed || isRestoringDraft || state.settings.composerDraftsEnabled === false) return;
    if (Date.now() < draftJustSubmittedUntil) return;
    if (!doc || typeof rv5FindNativeComposer !== "function" || !ipc || typeof ipc.send !== "function") return;
    const { container, editable } = rv5FindNativeComposer(doc);
    if (!editable) return;
    const key = explicitKey || state.activeChatKey || "__new__";
    const title = typeof explicitTitle === "string" ? explicitTitle : (state.activeChatTitle || "");
    const snap = collectComposerSnapshotSync(container, editable);
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
      ipc.send("agy-studio:save-composer-draft-sync", { chatKey: key, title, text: snap.text, attachments: atts });
    } catch (_e) {}
  }

  function scheduleComposerDraftSave(delayMs) {
    if (state.destroyed || isRestoringDraft || state.settings.composerDraftsEnabled === false) return;
    if (Date.now() < draftJustSubmittedUntil) return;
    if (!win || typeof win.setTimeout !== "function") {
      saveComposerDraftNow();
      return;
    }
    if (draftSaveTimer && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftSaveTimer);
    }
    draftSaveTimer = win.setTimeout(() => {
      draftSaveTimer = null;
      saveComposerDraftNow();
    }, typeof delayMs === "number" ? delayMs : 350);
  }

  function restoreComposerDraftForChat(chatKey) {
    if (state.destroyed || state.settings.composerDraftsEnabled === false || !chatKey) return;
    const seq = ++draftRestoreSeq;
    if (draftRestoreTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftRestoreTimer);
      draftRestoreTimer = null;
    }
    invokeIpc("agy-studio:get-composer-draft", { chatKey }).then((res) => {
      if (state.destroyed || seq !== draftRestoreSeq || state.activeChatKey !== chatKey) return;
      if (!res || !res.ok || !res.draft) return;
      const draft = res.draft;
      const hasText = Boolean(draft.text && String(draft.text).trim());
      const hasAtts = Array.isArray(draft.attachments) && draft.attachments.length > 0;
      if (!hasText && !hasAtts) return;

      let attempts = 0;
      const tryApply = async () => {
        if (state.destroyed || seq !== draftRestoreSeq || state.activeChatKey !== chatKey) return;
        const found = typeof rv5FindNativeComposer === "function" ? rv5FindNativeComposer(doc) : { container: null, editable: null };
        if (!found || !found.editable) {
          attempts += 1;
          if (attempts < 20 && win && typeof win.setTimeout === "function") {
            draftRestoreTimer = win.setTimeout(tryApply, 120);
          }
          return;
        }
        const existingTxt = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(found.editable) : "";
        const existingAtt = hasComposerAttachments(found.container, found.editable);
        if (existingTxt.length > 0 || existingAtt) return;

        isRestoringDraft = true;
        try {
          if (hasAtts) {
            insertAttachmentsIntoNativeComposer(draft.attachments, found.container, found.editable);
          }
          if (hasText) {
            await insertTextIntoNativeComposerRich(found.editable, draft.text);
          }
          lastSavedDraftByChat.set(chatKey, draft);
        } finally {
          const release = () => {
            isRestoringDraft = false;
            lastDraftObsSig = "";
          };
          if (win && typeof win.setTimeout === "function") win.setTimeout(release, 450);
          else release();
        }
      };

      if (win && typeof win.setTimeout === "function") {
        draftRestoreTimer = win.setTimeout(tryApply, 90);
      } else {
        tryApply();
      }
    });
  }

  function captureAndRecordUserSubmission(container, editable, source) {
    if (!editable) return;
    const chatKey = state.activeChatKey || "__new__";
    const title = state.activeChatTitle || "";
    const snap = collectComposerSnapshotSync(container, editable);
    if (!snap.text.trim() && snap.items.length === 0) return;

    draftJustSubmittedUntil = Date.now() + 2000;
    if (draftSaveTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(draftSaveTimer);
      draftSaveTimer = null;
    }
    lastSavedDraftByChat.delete(chatKey);
    invokeIpc("agy-studio:clear-composer-draft", { chatKey });

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
      if (!state.destroyed && state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "history") {
        refreshInputHistory();
      }
    })();
  }

  function refreshInputHistory() {
    state.inputHistory = Object.assign({}, state.inputHistory || {}, { loading: true });
    if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "history") renderStructure();
    return invokeIpc("agy-studio:get-input-history").then((res) => {
      if (state.destroyed) return res;
      state.inputHistory = {
        loading: false,
        items: res && Array.isArray(res.items) ? res.items : [],
        draftCount: res && typeof res.draftCount === "number" ? res.draftCount : 0,
      };
      if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "history") {
        renderStructure();
      }
      return res;
    });
  }

  function renderPickerMount() {
    if (!pickerMountEl) return;
    const isRu = state.locale !== "en";
    const parts = [];
    if (state.pickerActive) {
      parts.push(`
        <div class="rx-picker-banner">
          <span>🎯 ${isRu ? "Прицел активен — кликните по любому элементу Antigravity (Esc — выход)" : "Picker active — click any Antigravity element (Esc to exit)"}</span>
          <button type="button" class="btn btn-sm" data-action="stop-element-picker">${isRu ? "Готово" : "Done"}</button>
        </div>
      `);
      if (state.pickerHoverRect) {
        const r = state.pickerHoverRect;
        parts.push(`
          <div class="rx-picker-highlight" style="left:${Math.round(r.left)}px;top:${Math.round(r.top)}px;width:${Math.round(r.width)}px;height:${Math.round(r.height)}px">
            <span class="rx-picker-tag">${escHtml(state.pickerHoverLabel || "")}</span>
          </div>
        `);
      }
    }
    if (state.pickerSelected && typeof rv5BuildElementInspectorHtml === "function") {
      parts.push(rv5BuildElementInspectorHtml(
        state.pickerSelected,
        state.appearanceDraft,
        state.settings.customLabels || [],
        state.systemFonts,
        isRu
      ));
    }
    pickerMountEl.innerHTML = parts.join("");
  }

  function setPickerCursorStyle(active) {
    if (!doc) return;
    const id = "rudex-picker-cursor-style";
    try {
      const existing = typeof doc.getElementById === "function" ? doc.getElementById(id) : null;
      if (!active) {
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        return;
      }
      if (!existing && doc.head && typeof doc.createElement === "function") {
        const st = doc.createElement("style");
        st.id = id;
        st.setAttribute("data-rudex-ignore", "1");
        st.textContent = "body *:not(#rudex-studio-host):not(#rudex-studio-host *) { cursor: crosshair !important; }";
        doc.head.appendChild(st);
      }
    } catch (_e) {}
  }

  function stopElementPicker() {
    state.pickerActive = false;
    state.pickerHoverRect = null;
    state.pickerHoverLabel = "";
    setPickerCursorStyle(false);
    if (doc && typeof doc.removeEventListener === "function") {
      if (pickerMoveHandler) { doc.removeEventListener("mousemove", pickerMoveHandler, true); pickerMoveHandler = null; }
      if (pickerClickHandler) { doc.removeEventListener("click", pickerClickHandler, true); pickerClickHandler = null; }
    }
    renderPickerMount();
    if (state.isOpen) renderStructure();
  }

  function parseCssColorToHex(raw, fallbackHex) {
    const s = String(raw || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(s)) return { hex: s.toLowerCase(), alphaPct: 100 };
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
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      width: 320,
      minHeight: 36,
      opacity: 100,
      bgOpacity: 100,
      color: detectAppTheme() === "light" ? "#1b1a18" : "#faf9f5",
      bgColor: detectAppTheme() === "light" ? "#fbfaf6" : "#262624",
      borderColor: detectAppTheme() === "light" ? "#d9d5c9" : "#3a3935",
    };
    if (!el || !win || typeof win.getComputedStyle !== "function") return defaults;
    try {
      const cs = win.getComputedStyle(el);
      const rect = typeof el.getBoundingClientRect === "function" ? el.getBoundingClientRect() : null;
      const col = parseCssColorToHex(cs.color, defaults.color);
      const bg = parseCssColorToHex(cs.backgroundColor, defaults.bgColor);
      const brd = parseCssColorToHex(cs.borderTopColor, defaults.borderColor);
      const fs = Math.round(parseFloat(cs.fontSize));
      const rad = Math.round(parseFloat(cs.borderTopLeftRadius));
      const padT = parseFloat(cs.paddingTop) || 0;
      const padL = parseFloat(cs.paddingLeft) || 0;
      const pad = Math.round(Math.max(padT, padL) > 0 ? (padT > 0 && padL > 0 ? (padT + padL) / 2 : Math.max(padT, padL)) : 0);
      const bw = Math.round(parseFloat(cs.borderTopWidth) || 0);
      const op = cs.opacity !== "" && Number.isFinite(parseFloat(cs.opacity)) ? Math.round(parseFloat(cs.opacity) * 100) : 100;
      return {
        fontSize: Number.isFinite(fs) && fs > 0 ? Math.max(8, Math.min(64, fs)) : defaults.fontSize,
        borderRadius: Number.isFinite(rad) && rad >= 0 ? Math.max(0, Math.min(64, rad)) : defaults.borderRadius,
        padding: Number.isFinite(pad) && pad >= 0 ? Math.max(0, Math.min(64, pad)) : defaults.padding,
        borderWidth: Number.isFinite(bw) && bw >= 0 ? Math.max(0, Math.min(8, bw)) : defaults.borderWidth,
        width: rect && rect.width > 0 ? Math.max(24, Math.min(1800, Math.round(rect.width))) : defaults.width,
        minHeight: rect && rect.height > 0 ? Math.max(16, Math.min(800, Math.round(rect.height))) : defaults.minHeight,
        opacity: Math.max(5, Math.min(100, op)),
        bgOpacity: bg.alphaPct > 0 ? bg.alphaPct : 100,
        color: col.hex,
        bgColor: bg.alphaPct > 0 ? bg.hex : defaults.bgColor,
        borderColor: brd.alphaPct > 0 ? brd.hex : defaults.borderColor,
      };
    } catch (_e) {
      return defaults;
    }
  }

  let inspSaveTimer = null;
  function scheduleInspectorPersist() {
    if (!win || typeof win.setTimeout !== "function") {
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      return;
    }
    if (inspSaveTimer && typeof win.clearTimeout === "function") win.clearTimeout(inspSaveTimer);
    inspSaveTimer = win.setTimeout(() => {
      inspSaveTimer = null;
      if (!state.destroyed) {
        saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      }
    }, 180);
  }

  function startElementPicker() {
    if (state.pickerActive) {
      stopElementPicker();
      return;
    }
    loadSystemFontsOnce();
    state.pickerActive = true;
    setPickerCursorStyle(true);
    state.appearanceDraft = spCloneAppearance(state.settings.appearance);
    state.appearanceLivePreview = true;
    // Close modal visually without discarding appearanceLivePreview/appearanceDraft
    if (state.isOpen) {
      state.isOpen = false;
      state.appearanceDockedRight = false;
      if (modalMountEl) modalMountEl.innerHTML = "";
    }
    const isRu = state.locale !== "en";
    pickerMoveHandler = (e) => {
      if (!state.pickerActive || !e || !e.target) return;
      const el = e.target;
      if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) return;
      if (typeof el.getBoundingClientRect !== "function") return;
      const rect = el.getBoundingClientRect();
      if (!rect || rect.width < 4 || rect.height < 4) return;
      state.pickerHoverRect = rect;
      const origTxt = translator && typeof translator.getOriginalTextForElement === "function" ? translator.getOriginalTextForElement(el) : "";
      state.pickerHoverLabel = typeof rv5DescribeElementFriendly === "function" ? rv5DescribeElementFriendly(el, isRu, origTxt) : (el.tagName || "");
      renderPickerMount();
    };
    pickerClickHandler = (e) => {
      if (!state.pickerActive || !e || !e.target) return;
      const el = e.target;
      if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) return;
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      const origTxt = translator && typeof translator.getOriginalTextForElement === "function" ? translator.getOriginalTextForElement(el) : "";
      const curTxt = String(el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
      const exactSel = typeof rv5BuildSmartSelector === "function" ? rv5BuildSmartSelector(el, "exact") : "";
      const simSel = typeof rv5BuildSmartSelector === "function" ? rv5BuildSmartSelector(el, "similar") : exactSel;
      const friendly = typeof rv5DescribeElementFriendly === "function" ? rv5DescribeElementFriendly(el, isRu, origTxt) : exactSel;
      const renameable = typeof rv5IsRenameSafeElement === "function" ? rv5IsRenameSafeElement(el) : false;
      state.pickerSelected = {
        name: friendly,
        selector: exactSel,
        exactSelector: exactSel,
        similarSelector: simSel,
        scope: "exact",
        canToggleScope: exactSel !== simSel,
        renameable,
        origText: origTxt || curTxt,
        currentText: curTxt,
        zone: "",
        computed: readElementComputedMetrics(el),
      };
      stopElementPicker();
      renderPickerMount();
    };
    if (doc && typeof doc.addEventListener === "function") {
      doc.addEventListener("mousemove", pickerMoveHandler, true);
      doc.addEventListener("click", pickerClickHandler, true);
    }
    renderPickerMount();
  }

  function upsertSelectedElementStyle(prop, rawVal, opts) {
    if (!state.pickerSelected || !state.pickerSelected.selector) return;
    const o = opts && typeof opts === "object" ? opts : {};
    if (!o.skipUndo) pushAppearanceUndo();
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
    item.styles[prop] = rawVal;
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    state.appearanceDraft.elementOverrides = list;
    applyThemeFastToHost(state.appearanceDraft);
    if (o.liveOnly) {
      scheduleInspectorPersist();
    } else {
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
    }
    if (!o.preserveDom) {
      renderPickerMount();
    }
  }

  function triggerQuotaSyncClick() {
    scrapeDomQuotaSnapshot(true);
    invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__" }).then((qs) => {
      if (!state.destroyed && qs) {
        state.quotaSummary = qs;
        renderLimitsWidgetMount();
        if (state.isOpen) renderStructure();
      }
    });
    // Also check if View Usage button exists in DOM to trigger native refresh if user has no snapshot
    if (doc && typeof doc.querySelectorAll === "function") {
      const qs = state.quotaSummary;
      const hasSnap = Boolean(qs && qs.families && (qs.families.gemini.fiveHourRem !== null || qs.families.claudeGpt.fiveHourRem !== null));
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
      if (state.mediaLibrary && state.mediaLibrary.length > 0 && app.wallpaper.type === "image") {
        const curIdx = state.mediaLibrary.findIndex((m) => m.fileName === app.wallpaper.mediaFile);
        const nxt = state.mediaLibrary[(curIdx + 1) % state.mediaLibrary.length];
        if (nxt) {
          app.wallpaper.mediaFile = nxt.fileName;
          app.wallpaper.mediaUrl = nxt.url;
          app.wallpaper.type = nxt.type === "video" ? "video" : "image";
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
      app.wallpaper.type = app.wallpaper.type === "none" ? (app.wallpaper.mediaUrl ? "image" : "gradient") : "none";
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
      state.widgetSubSection = "limits";
      setOpen(true, { tab: "settings", subTab: "widget" });
      return;
    }
    if (action === "openTabWorkshop") { setOpen(true, { tab: "settings", subTab: "workshop" }); refreshWorkshopData(); return; }
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
    if (action === "jump-search-hit") {
      const tab = actionEl.getAttribute("data-tab") || "appearance";
      const appSub = actionEl.getAttribute("data-app-sub") || "";
      const setSub = actionEl.getAttribute("data-set-sub") || "";
      state.settingsSearchQuery = "";
      state.activeTab = tab;
      if (appSub) state.appearanceSubTab = appSub;
      if (setSub) state.settingsSubTab = setSub;
      if (tab === "appearance" && (appSub === "text" || appSub === "elements")) loadSystemFontsOnce();
      if (setSub === "workshop") refreshWorkshopData();
      renderStructure();
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
    if (action === "stop-element-picker") { stopElementPicker(); return; }
    if (action === "close-element-inspector") { state.pickerSelected = null; renderPickerMount(); return; }
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
        state.pickerSelected = {
          overrideId: existing ? existing.id : ("zone-" + zone.id),
          name: state.locale !== "en" ? zone.nameRu : zone.nameEn,
          selector: zone.selector,
          zone: zone.id,
          scope: "similar",
          canToggleScope: false,
          renameable: false,
          origText: "",
          computed: readElementComputedMetrics(zone.selector),
        };
        renderPickerMount();
      }
      return;
    }
    if (action === "edit-override-item") {
      loadSystemFontsOnce();
      const oid = actionEl.getAttribute("data-id");
      const ov = (state.appearanceDraft.elementOverrides || []).find((o) => o.id === oid);
      if (ov) {
        state.pickerSelected = {
          overrideId: ov.id,
          name: ov.name || ov.selector,
          selector: ov.selector,
          zone: ov.zone || "",
          scope: ov.scope || "exact",
          canToggleScope: false,
          renameable: false,
          origText: "",
          computed: readElementComputedMetrics(ov.selector),
        };
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
      if (state.pickerSelected && state.pickerSelected.overrideId === oid) state.pickerSelected = null;
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      renderPickerMount();
      return;
    }
    if (action === "clear-all-overrides") {
      pushAppearanceUndo();
      state.appearanceDraft.elementOverrides = [];
      state.pickerSelected = null;
      saveSettingsPatch({ appearance: spCloneAppearance(state.appearanceDraft) });
      renderPickerMount();
      return;
    }
    if (action === "inspector-set-scope" && state.pickerSelected) {
      const sc = actionEl.getAttribute("data-val") === "similar" ? "similar" : "exact";
      state.pickerSelected.scope = sc;
      state.pickerSelected.selector = sc === "similar" ? state.pickerSelected.similarSelector : state.pickerSelected.exactSelector;
      renderPickerMount();
      return;
    }
    if (action === "inspector-clear-style" && state.pickerSelected) {
      const prop = actionEl.getAttribute("data-prop");
      if (prop) {
        const negOneProps = new Set(["borderWidth", "borderRadius", "padding", "opacity"]);
        const zeroProps = new Set(["fontSize", "fontWeight", "lineHeight", "width", "minHeight"]);
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
      if (match && nextLbl) {
        const cur = (state.settings.customLabels || []).filter((l) => l.match.toLowerCase() !== match.toLowerCase());
        cur.push({ id: "lbl-" + Date.now(), matchType: "exact", match, label: nextLbl, enabled: true });
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
        icon: "⚡",
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
        const next = Object.assign({}, state.chatAgentProfile, { [f]: v, presetId: "custom" });
        const cnt = typeof rv5CountActiveAgentFeatures === "function" ? rv5CountActiveAgentFeatures(next) : 1;
        next.enabled = cnt > 0;
        if (!next.enabled) next.presetId = "default";
        saveChatAgentProfile(next, { setAsDefault: Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats) });
      }
      return;
    }
    if (action === "toggle-agent-bool") {
      const f = actionEl.getAttribute("data-field");
      if (f) {
        const curOn = Boolean(state.chatAgentProfile.enabled && state.chatAgentProfile[f]);
        const next = Object.assign({}, state.chatAgentProfile, { [f]: !curOn, presetId: "custom" });
        const cnt = typeof rv5CountActiveAgentFeatures === "function" ? rv5CountActiveAgentFeatures(next) : 1;
        next.enabled = cnt > 0;
        if (!next.enabled) next.presetId = "default";
        saveChatAgentProfile(next, { setAsDefault: Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats) });
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
      const next = Object.assign({}, state.chatAgentProfile, { presetId: "custom" });
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
      saveChatAgentProfile(next, { setAsDefault: Boolean(state.settings.agentProfileDefault && state.settings.agentProfileDefault.applyToNewChats) });
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
    if (action === "toggle-live-inline") {
      const f = actionEl.getAttribute("data-field");
      if (f) {
        const cur = Object.assign({}, state.settings.liveEditInline || {});
        const defaultTrue = f === "showChatDock" || f === "showInChat" || f === "showDeliveredBadge" || f === "enabled";
        const prevVal = defaultTrue ? cur[f] !== false : Boolean(cur[f]);
        cur[f] = !prevVal;
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
      saveSettingsPatch({ limitsWidget: lw });
      return;
    }
    if (action === "sync-limits-now") { triggerQuotaSyncClick(); return; }
    if (action === "open-limits-settings") {
      state.widgetSubSection = "limits";
      setOpen(true, { tab: "settings", subTab: "widget" });
      return;
    }
    if (action === "set-widget-subsection") {
      state.widgetSubSection = actionEl.getAttribute("data-val") === "limits" ? "limits" : "mini";
      loadSystemFontsOnce();
      if (state.widgetSubSection === "limits") {
        invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__" }).then((qs) => {
          if (!state.destroyed && qs) {
            state.quotaSummary = qs;
            if (state.isOpen) renderStructure();
          }
        });
      }
      renderStructure();
      return;
    }
    if (action === "record-keybinding") {
      const id = actionEl.getAttribute("data-id") || "";
      state.recordingKeybindingId = state.recordingKeybindingId === id ? "" : id;
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
      invokeIpc("agy-studio:workshop-save-rule", {
        scope: state.workshop.scope === "workspace" ? "workspace" : "global",
        fileName: d.ruleFileName || "custom-rule.md",
        body: d.ruleBody,
        enabled: true,
      }).then((res) => {
        if (res && res.ok) {
          state.workshop.draft.ruleFileName = "";
          state.workshop.draft.ruleBody = "";
          refreshWorkshopData();
        }
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
      invokeIpc("agy-studio:workshop-save-skill", {
        scope: state.workshop.scope === "workspace" ? "workspace" : "global",
        name: d.skillName,
        description: d.skillDesc || "",
        body: d.skillBody || "",
      }).then((res) => {
        if (res && res.ok) {
          state.workshop.draft.skillName = "";
          state.workshop.draft.skillDesc = "";
          state.workshop.draft.skillBody = "";
          refreshWorkshopData();
        }
      });
      return;
    }
    if (action === "ws-pin-skill") {
      const sname = actionEl.getAttribute("data-name");
      if (sname) {
        const cur = Array.isArray(state.chatAgentProfile.pinnedSkills) ? state.chatAgentProfile.pinnedSkills.slice() : [];
        if (!cur.includes(sname)) cur.push(sname);
        saveChatAgentProfile(Object.assign({}, state.chatAgentProfile, { pinnedSkills: cur, enabled: true }));
        setToast(state.locale !== "en" ? `Скилл «${sname}» прикреплён к агенту` : `Pinned "${sname}" to Agent`, false);
      }
      return;
    }
    if (action === "ws-save-mcp") {
      const d = state.workshop.draft || {};
      if (!String(d.mcpName || "").trim()) return;
      invokeIpc("agy-studio:workshop-save-mcp", {
        scope: state.workshop.scope === "workspace" ? "workspace" : "global",
        name: d.mcpName,
        command: d.mcpCommand || "",
        argsText: d.mcpArgs || "",
        url: d.mcpUrl || "",
      }).then((res) => {
        if (res && res.ok) {
          state.workshop.draft.mcpName = "";
          state.workshop.draft.mcpCommand = "";
          state.workshop.draft.mcpArgs = "";
          state.workshop.draft.mcpUrl = "";
          refreshWorkshopData();
        }
      });
      return;
    }
    if (action === "ws-toggle-mcp") {
      const mname = actionEl.getAttribute("data-name");
      const mscope = actionEl.getAttribute("data-scope") || "global";
      const wasDis = actionEl.getAttribute("data-disabled") === "1";
      if (mname) {
        invokeIpc("agy-studio:workshop-save-mcp", { scope: mscope, name: mname, disabled: !wasDis }).then(() => refreshWorkshopData());
      }
      return;
    }
    if (action === "ws-delete-mcp") {
      const mname = actionEl.getAttribute("data-name");
      const mscope = actionEl.getAttribute("data-scope") || "global";
      if (mname) invokeIpc("agy-studio:workshop-delete-mcp", { scope: mscope, name: mname }).then(() => refreshWorkshopData());
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
    if (action === "open-persona-tab") { state.activeTab = "persona"; setOpen(true); return; }
    if (action === "open-export-limits") {
      state.activeTab = "settings";
      state.settingsSubTab = "export";
      invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__" }).then((qs) => {
        if (!state.destroyed && qs) {
          state.quotaSummary = qs;
          if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "export") renderStructure();
        }
      });
      setOpen(true);
      return;
    }
    if (action === "switch-tab") {
      const prevTab = state.activeTab;
      const tab = actionEl.getAttribute("data-tab") || "monitor";
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
      }
      if (tab === "appearance") {
        state.appearanceLivePreview = true;
        if (!state.appearanceDirty) {
          state.appearanceDraft = spCloneAppearance(state.settings.appearance);
          state.greetingDraft = spCloneGreeting(state.settings.greeting);
        }
        applyThemeFastToHost(state.appearanceDraft);
        if (state.appearanceSubTab === "wallpaper") refreshMediaLibrary();
      }
      if (tab === "live-edits") refreshLiveEdits();
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
      const sub = actionEl.getAttribute("data-val") || "widget";
      state.settingsSubTab = sub;
      if (sub === "widget") {
        loadSystemFontsOnce();
        invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
          if (!state.destroyed && qs) applyQuotaSummary(qs);
        });
      }
      if (sub === "workshop") refreshWorkshopData();
      if (sub === "history") refreshInputHistory();
      if (sub === "export") {
        invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
          if (!state.destroyed && qs) applyQuotaSummary(qs);
        });
      }
      renderStructure();
      return;
    }
    if (action === "open-input-history") {
      state.activeTab = "settings";
      state.settingsSubTab = "history";
      refreshInputHistory();
      renderStructure();
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
          if (atts.length > 0) insertAttachmentsIntoNativeComposer(atts, container, editable);
          if (found.text) await insertTextIntoNativeComposerRich(editable, found.text);
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
        if (!state.destroyed && res) applyUpdateStatus(res);
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
      if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "system") {
        renderStructure();
      }
      invokeIpc("agy-studio:install-update", {}).then((res) => {
        if (state.destroyed || !res) return;
        if (res.state) applyUpdateStatus(res.state);
        else if (res.ok === false) {
          applyUpdateStatus(Object.assign({}, state.update, { status: "error", error: res.error || tr.updateStatusError }));
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
      if (nextPinned && state.settings.layoutMode === "floating") {
        saveSettingsPatch({ pinned: true });
      } else {
        saveSettingsPatch({ pinned: nextPinned });
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
      saveSettingsPatch({
        studioUi: {
          windowTheme: variant === "light" ? "claude-light" : "claude-dark",
          widgetTheme: "claude",
        },
      });
      state.appearanceDirty = true;
      state.appearanceLivePreview = true;
      applyThemeToHost(state.appearanceDraft);
      setToast(tr.claudeSuiteApplied, false);
      renderStructure();
      return;
    }
    if (action === "apply-font-pair") {
      const pid = actionEl.getAttribute("data-id") || "";
      const found = FONT_PAIR_PRESETS.find((x) => x.id === pid);
      if (found) {
        if (!state.appearanceDraft.typography) state.appearanceDraft.typography = spDefaultAppearance().typography;
        state.appearanceDraft.typography.uiFont = found.uiFont;
        state.appearanceDraft.typography.monoFont = found.monoFont;
        state.appearanceDirty = true;
        state.appearanceLivePreview = true;
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
      state.appearanceDraft.presetId = pr.id;
      if (pr.id !== "custom" && pr.vars) {
        if (!state.appearanceDraft.customAccent) {
          state.appearanceDraft.accentColor = pr.vars.accentColor;
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
      state.appearanceDraft.accentColor = hex.toLowerCase();
      state.appearanceDraft.customAccent = true;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "reset-custom-accent") {
      const pr = spFindThemePreset(state.appearanceDraft.presetId || "native");
      state.appearanceDraft.customAccent = false;
      state.appearanceDraft.accentColor = (pr && pr.vars && pr.vars.accentColor) || "#3b82f6";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-message-style") {
      const val = actionEl.getAttribute("data-val");
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
        const wp = state.appearanceDraft.wallpaper;
        wp.dim = found.dim;
        wp.blur = found.blur;
        wp.brightness = found.brightness;
        wp.contrast = found.contrast;
        wp.saturate = found.saturate;
        wp.hue = found.hue;
        wp.vignette = found.vignette;
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
    } else if (field === "canvasBg" || field === "cardBg") {
      draft[field] = String(rawVal || "#09090b").toLowerCase();
      draft.presetId = "custom";
      needsRerenderDots = true;
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
        invokeIpc("agy-studio:save-settings", { studioUi: uiPatch });
        if (sub === "widgetFont") renderStructure();
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
      invokeIpc("agy-studio:save-settings", { studioUi: uiPatch });
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
      draft.typography[sub] = n > 0 ? n : 0;
      markAppearanceDirty();
      renderStructure();
      return true;
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

    const rect = typeof widgetMountEl.getBoundingClientRect === "function"
      ? widgetMountEl.getBoundingClientRect()
      : { left: 16, top: 16, width: 220, height: 36 };
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
    if (limitsDragState && limitsMountEl) {
      const dx = e.clientX - limitsDragState.startX;
      const dy = e.clientY - limitsDragState.startY;
      if (!limitsDragState.moved && Math.hypot(dx, dy) < 5) return;
      limitsDragState.moved = true;
      const vw = (win && win.innerWidth) || 1280;
      const vh = (win && win.innerHeight) || 800;
      const nx = Math.max(8, Math.min(vw - 120, Math.round(limitsDragState.origLeft + dx)));
      const ny = Math.max(8, Math.min(vh - 40, Math.round(limitsDragState.origTop + dy)));
      limitsDragState.lastX = nx;
      limitsDragState.lastY = ny;
      limitsMountEl.className = "rx-limits-mount";
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
    if (limitsDragState) {
      const ls = limitsDragState;
      limitsDragState = null;
      if (ls.moved) {
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        lw.position = "floating";
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
        renderStructure();
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
            const prevStage = modalMountEl.querySelector(".preview-stage");
            if (prevStage && typeof rv5BuildLimitsWidgetHtml === "function") {
              prevStage.innerHTML = rv5BuildLimitsWidgetHtml(lw, state.quotaSummary, state.telemetry.modelName || "", state.locale !== "en", true);
            }
          }
          invokeIpc("agy-studio:save-settings", { limitsWidget: lw });
          return;
        }
        lw[lf] = target.value || "";
        saveSettingsPatch({ limitsWidget: lw });
        return;
      }
      const inspRangeProp = target.getAttribute("data-insp-range");
      if (inspRangeProp) {
        const val = Math.round(Number(target.value));
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
        const val = Math.round(Number(rawStr));
        if (Number.isFinite(val)) {
          const minAttr = Number(target.getAttribute("min"));
          const maxAttr = Number(target.getAttribute("max"));
          if (pickerMountEl) {
            const pairRange = pickerMountEl.querySelector(`[data-insp-range="${inspNumProp}"]`);
            if (pairRange) pairRange.value = String(Math.max(minAttr || 0, Math.min(maxAttr || 1600, val)));
            const wrap = pickerMountEl.querySelector(`[data-insp-wrap="${inspNumProp}"]`);
            if (wrap) wrap.classList.add("is-custom");
            const badge = pickerMountEl.querySelector(`[data-insp-badge="${inspNumProp}"]`);
            if (badge) badge.textContent = inspNumProp === "bgOpacity" ? `${val}%` : (state.locale !== "en" ? "изменено" : "custom");
          }
          // Only apply live once value is within valid bounds so typing multi-digit numbers (e.g. "16" or "320") never jumps
          if ((!Number.isFinite(minAttr) || val >= minAttr) && (!Number.isFinite(maxAttr) || val <= maxAttr)) {
            upsertSelectedElementStyle(inspNumProp, val, { preserveDom: true, liveOnly: true, skipUndo: true });
          }
        }
        return;
      }
      const inspProp = target.getAttribute("data-insp-style");
      if (inspProp) {
        const isColor = target.type === "color";
        if (isColor && pickerMountEl) {
          const hexEl = pickerMountEl.querySelector(`[data-insp-hex="${inspProp}"]`);
          if (hexEl) hexEl.textContent = String(target.value || "").toLowerCase();
        }
        upsertSelectedElementStyle(inspProp, target.value || "", { preserveDom: isColor, liveOnly: isColor, skipUndo: isColor });
        return;
      }
      const wsDraftKey = target.getAttribute("data-ws-draft");
      if (wsDraftKey) {
        state.workshop.draft[wsDraftKey] = target.value || "";
        return;
      }
      const agentListKey = target.getAttribute("data-agent-list");
      if (agentListKey) {
        const arr = String(target.value || "").split(",").map((s) => s.trim()).filter(Boolean);
        saveChatAgentProfile(Object.assign({}, state.chatAgentProfile, { [agentListKey]: arr, enabled: true }));
        return;
      }
      const liveInlineField = target.getAttribute("data-live-inline-field");
      if (liveInlineField) {
        const cur = Object.assign({}, state.settings.liveEditInline || {});
        cur[liveInlineField] = target.value || "enter";
        saveSettingsPatch({ liveEditInline: cur });
        return;
      }
    });

    rootEl.addEventListener("keydown", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.getAttribute !== "function") return;
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
      } else if (target.tagName === "SELECT" && target.getAttribute("data-limits-field")) {
        const lf = target.getAttribute("data-limits-field");
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : Object.assign({}, state.settings.limitsWidget);
        lw[lf] = target.value || "";
        saveSettingsPatch({ limitsWidget: lw });
      } else if (target.tagName === "SELECT" && target.getAttribute("data-insp-style")) {
        upsertSelectedElementStyle(target.getAttribute("data-insp-style"), target.value || "");
      } else if (target.getAttribute("data-insp-range") || target.getAttribute("data-insp-num")) {
        const prop = target.getAttribute("data-insp-range") || target.getAttribute("data-insp-num");
        const rawStr = String(target.value || "").trim();
        const negOneProps = new Set(["borderWidth", "borderRadius", "padding", "opacity"]);
        if (rawStr === "") {
          upsertSelectedElementStyle(prop, negOneProps.has(prop) ? -1 : 0);
        } else {
          const minAttr = Number(target.getAttribute("min"));
          const maxAttr = Number(target.getAttribute("max"));
          let val = Math.round(Number(rawStr));
          if (Number.isFinite(val)) {
            if (Number.isFinite(minAttr)) val = Math.max(minAttr, val);
            if (Number.isFinite(maxAttr)) val = Math.min(maxAttr, val);
            upsertSelectedElementStyle(prop, val);
          }
        }
      } else if (target.type === "color" && target.getAttribute("data-insp-style")) {
        upsertSelectedElementStyle(target.getAttribute("data-insp-style"), target.value || "");
      } else if (target.tagName === "SELECT" && target.getAttribute("data-live-inline-field")) {
        const cur = Object.assign({}, state.settings.liveEditInline || {});
        cur[target.getAttribute("data-live-inline-field")] = target.value || "enter";
        saveSettingsPatch({ liveEditInline: cur });
      }
    });

    let sheenRaf = 0;
    let pendingSheenEvt = null;
    const applyPointerSheen = () => {
      sheenRaf = 0;
      const ev = pendingSheenEvt;
      pendingSheenEvt = null;
      if (!ev || !ev.target || typeof ev.target.closest !== "function") return;
      const surface = ev.target.closest(".mini-pill, .med-card, .modal-shell");
      if (!surface || typeof surface.getBoundingClientRect !== "function" || !surface.style) return;
      const r = surface.getBoundingClientRect();
      if (!r || r.width <= 0 || r.height <= 0) return;
      const mx = Math.round(ev.clientX - r.left);
      const my = Math.round(ev.clientY - r.top);
      surface.style.setProperty("--rx-mx", `${mx}px`);
      surface.style.setProperty("--rx-my", `${my}px`);
    };
    rootEl.addEventListener("pointermove", (e) => {
      pendingSheenEvt = e;
      if (win && typeof win.requestAnimationFrame === "function") {
        if (!sheenRaf) sheenRaf = win.requestAnimationFrame(applyPointerSheen);
      } else {
        applyPointerSheen();
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
        clampWidgetToViewport();
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
    }

    if (doc && typeof doc.addEventListener === "function") {
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
        if (!e) return;
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
              renderStructure();
              return;
            }
            const kb = Object.assign({}, state.settings.keybindings || {});
            kb[state.recordingKeybindingId] = formatted === "__CLEAR__" ? "" : formatted;
            state.recordingKeybindingId = "";
            saveSettingsPatch({ keybindings: kb });
            return;
          }
        }
        // 2. Escape closes Picker / Inspector / Popovers / Studio
        if (e.key === "Escape") {
          if (state.pickerActive) {
            stopElementPicker();
            return;
          }
          if (state.pickerSelected) {
            state.pickerSelected = null;
            renderPickerMount();
            return;
          }
          if (state.usagePopOpen) {
            state.usagePopOpen = false;
            renderModelUsagePopover();
            return;
          }
          if (state.agentPopoverOpen) {
            state.agentPopoverOpen = false;
            renderChatDockMount();
            return;
          }
          if (state.liveEditOpen) {
            state.liveEditOpen = false;
            renderPopoverStructure();
          } else if (state.isOpen) {
            setOpen(false);
          }
          return;
        }
        // 2.5 Auto-close Agent Tools popover whenever the user submits a message via Enter
        if (state.agentPopoverOpen && !e.isComposing && e.key === "Enter" && !e.shiftKey && !e.altKey) {
          if (typeof rv5FindNativeComposer === "function") {
            const { editable } = rv5FindNativeComposer(doc);
            if (editable && (e.target === editable || (typeof editable.contains === "function" && editable.contains(e.target)))) {
              state.agentPopoverOpen = false;
              renderChatDockMount();
            }
          }
        }
        // 3. Inline live-edit capture OR normal user prompt submission capture (clears draft & saves to last-20 history)
        const le = state.settings.liveEditInline;
        if (!e.isComposing && e.key === "Enter" && !e.shiftKey && !e.altKey && typeof rv5FindNativeComposer === "function") {
          const { container, editable } = rv5FindNativeComposer(doc);
          if (editable && (e.target === editable || (typeof editable.contains === "function" && editable.contains(e.target)))) {
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
            } else if (!runningNow && !hasCtrl) {
              captureAndRecordUserSubmission(container, editable, "chat");
            }
          }
        }
      };
      doc.addEventListener("keydown", keydownHandler, true);

      composerSendClickHandler = (e) => {
        if (!e || !e.target || typeof e.target.closest !== "function") return;
        const btn = e.target.closest("button");
        if (!btn) return;
        if (hostEl && (btn === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(btn)))) return;
        if (btn.hasAttribute("data-rudex-img-edit-btn") || btn.hasAttribute("data-rudex-native-entry")) return;
        if (typeof rv5FindNativeComposer !== "function") return;
        const { container, editable } = rv5FindNativeComposer(doc);
        if (!container || !editable || (typeof container.contains === "function" && !container.contains(btn))) return;
        const tid = String(btn.getAttribute("data-testid") || "").toLowerCase();
        const lbl = String(btn.getAttribute("aria-label") || btn.getAttribute("title") || "").toLowerCase();
        const typeAttr = String(btn.getAttribute("type") || "").toLowerCase();
        if (/cancel|stop|abort|останов|отмен|model|mode|mic|voice|attach|upload|plus|add|remove|delete|close|удал|закры/.test(tid + " " + lbl)) return;
        const looksSend = typeAttr === "submit" || /send|submit|отправ/.test(tid + " " + lbl);
        if (!looksSend) return;
        const txt = typeof rv5ReadEditableText === "function" ? rv5ReadEditableText(editable) : "";
        const hasAtt = hasComposerAttachments(container, editable);
        if (!txt && !hasAtt) return;
        const le = state.settings.liveEditInline;
        if (le && le.enabled && isAgentRunningNow()) {
          if (typeof e.preventDefault === "function") e.preventDefault();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          if (typeof e.stopPropagation === "function") e.stopPropagation();
          sendInlineLiveEditFromComposer();
        } else if (!isAgentRunningNow()) {
          captureAndRecordUserSubmission(container, editable, "chat");
        }
      };
      doc.addEventListener("click", composerSendClickHandler, true);

      cancelClickHandler = (e) => {
        const tEl = e && e.target;
        if (!tEl || typeof tEl.closest !== "function") return;
        if (tEl.closest('[data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"]')) {
          state.lastCancelClickAt = nowHiRes();
        }
      };
      doc.addEventListener("click", cancelClickHandler, true);

      docPasteHandler = (e) => {
        if (annotatorCtrl && typeof annotatorCtrl.isOpen === "function" && annotatorCtrl.isOpen()) {
          annotatorCtrl.handlePaste(e);
          return;
        }
        // Passively cache full-resolution pasted images & files before Antigravity downscales thumbnails
        const items = e && e.clipboardData && e.clipboardData.items;
        if (items && items.length) {
          let sawFile = false;
          for (let i = 0; i < items.length; i += 1) {
            if (items[i] && items[i].kind === "file" && typeof items[i].getAsFile === "function") {
              cacheOriginalComposerFile(items[i].getAsFile());
              sawFile = true;
            }
          }
          if (sawFile && !isRestoringDraft) scheduleComposerDraftSave(450);
        }
      };
      doc.addEventListener("paste", docPasteHandler, true);

      docDropHandler = (e) => {
        const files = e && e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) {
          for (let i = 0; i < files.length; i += 1) {
            if (files[i]) cacheOriginalComposerFile(files[i]);
          }
          if (!isRestoringDraft) scheduleComposerDraftSave(450);
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
        if (inp.files.length > 0 && !isRestoringDraft) scheduleComposerDraftSave(450);
      };
      doc.addEventListener("change", docFileChangeHandler, true);

      docInputHandler = (e) => {
        if (state.destroyed || isRestoringDraft || state.settings.composerDraftsEnabled === false) return;
        const tEl = e && e.target;
        if (!tEl || (hostEl && (tEl === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(tEl))))) return;
        if (typeof rv5FindNativeComposer === "function") {
          const { editable } = rv5FindNativeComposer(doc);
          if (editable && (tEl === editable || (typeof editable.contains === "function" && editable.contains(tEl)))) {
            scheduleComposerDraftSave(350);
          }
        }
      };
      doc.addEventListener("input", docInputHandler, true);

      outsidePopoverHandler = (e) => {
        if (!e) return;
        const cPath = typeof e.composedPath === "function" ? e.composedPath() : [];
        if (state.agentPopoverOpen) {
          const insideDock = Boolean(chatDockMountEl && (cPath.indexOf(chatDockMountEl) !== -1 || e.target === chatDockMountEl)) ||
            (cPath.length === 0 && hostEl && (e.target === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(e.target))));
          if (!insideDock) {
            state.agentPopoverOpen = false;
            renderChatDockMount();
          }
        }
        if (state.usagePopOpen) {
          const insideUsage = Boolean(usagePopMountEl && (cPath.indexOf(usagePopMountEl) !== -1 || e.target === usagePopMountEl));
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
      doc.addEventListener("pointerdown", modelTriggerClickHandler, true);
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
        const lw = typeof rv5NormalizeLimitsWidget === "function" ? rv5NormalizeLimitsWidget(state.settings.limitsWidget) : state.settings.limitsWidget;
        if (lw && lw.pinned) return;
        const tEl = e.target;
        if (!tEl || typeof tEl.closest !== "function" || tEl.closest("button")) return;
        if (!tEl.closest('[data-limits-drag="1"]')) return;
        const rect = typeof limitsMountEl.getBoundingClientRect === "function" ? limitsMountEl.getBoundingClientRect() : { left: 20, top: 44, width: 240, height: 60 };
        limitsDragState = { startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top, lastX: rect.left, lastY: rect.top, moved: false };
      });
    }

    attachDomEvents();
    state.mounted = true;
    state.hydrationIgnoreUntil = nowHiRes() + 2500;
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
              hasExternal = true;
              break;
            }
            if (!hasExternal) return;
          }
          scheduleStreamSample();
          if (state.settings.thinkingInRussian) scheduleThinkingScan(160);
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

  function scheduleMountAfterSettle() {
    if (state.mounted || state.destroyed || settleTimer) return;
    clearReadinessWatchers();
    if (win && typeof win.setTimeout === "function") {
      settleTimer = win.setTimeout(() => {
        settleTimer = null;
        mountStudioUi();
      }, 150);
    } else {
      mountStudioUi();
    }
  }

  function init() {
    if (state.initialized || state.destroyed || !doc) return;
    try {
      const proto = win && win.location && typeof win.location.protocol === "string" ? win.location.protocol : "";
      if (/^(data:|about:)$/i.test(proto)) return;
    } catch (_e) {}

    state.initialized = true;
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
      if (opts.tab) {
        const reqTab = String(opts.tab);
        if (reqTab === "monitor" || reqTab === "live-edits") {
          state.activeTab = "settings";
          if (!opts.subTab) {
            state.settingsSubTab = "widget";
            state.widgetSubSection = "limits";
          }
        } else {
          state.activeTab = reqTab;
        }
      }
      if (opts.subTab) state.settingsSubTab = String(opts.subTab);
      if (opts.appSubTab) state.appearanceSubTab = String(opts.appSubTab);
      if (typeof opts.dockedRight === "boolean") state.appearanceDockedRight = opts.dockedRight;
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
    if (next && state.activeTab === "settings" && state.settingsSubTab === "widget") {
      loadSystemFontsOnce();
      invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
        if (!state.destroyed && qs) applyQuotaSummary(qs);
      });
    }
    if (next && state.activeTab === "settings" && state.settingsSubTab === "workshop") {
      refreshWorkshopData();
    }
    if (next && state.activeTab === "settings" && state.settingsSubTab === "history") {
      refreshInputHistory();
    }
    if (next && state.activeTab === "live-edits") {
      refreshLiveEdits();
    }
    if (next && state.activeTab === "settings" && state.settingsSubTab === "export") {
      invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__", forceFresh: true }).then((qs) => {
        if (!state.destroyed && qs) applyQuotaSummary(qs);
      });
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
    renderStructure();
  }

  function destroy() {
    state.destroyed = true;
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
    for (const timer of [settleTimer, repaintTimer, streamSampleTimer, turnSyncTimer, toastTimer, thinkingScanTimer, draftSaveTimer, draftRestoreTimer, titleBarBootTimer]) {
      if (timer && win && typeof win.clearTimeout === "function") win.clearTimeout(timer);
    }
    for (const qt of quotaScrapeTimers) {
      if (qt && win && typeof win.clearTimeout === "function") win.clearTimeout(qt);
    }
    quotaScrapeTimers = [];
    settleTimer = repaintTimer = streamSampleTimer = turnSyncTimer = toastTimer = thinkingScanTimer = draftSaveTimer = draftRestoreTimer = titleBarBootTimer = null;
    restoreAllThinkingNodes();
    thinkingCache.clear();
    thinkingInflight.clear();
    if (pollTimer && win && typeof win.clearInterval === "function") {
      win.clearInterval(pollTimer);
      pollTimer = null;
    }
    if (domObserver && typeof domObserver.disconnect === "function") { domObserver.disconnect(); domObserver = null; }
    if (themeObserver && typeof themeObserver.disconnect === "function") { themeObserver.disconnect(); themeObserver = null; }
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
      }
    }
    if (doc && typeof doc.removeEventListener === "function") {
      if (visChangeHandler) doc.removeEventListener("visibilitychange", visChangeHandler);
      if (keydownHandler) doc.removeEventListener("keydown", keydownHandler, true);
      if (composerSendClickHandler) doc.removeEventListener("click", composerSendClickHandler, true);
      if (cancelClickHandler) doc.removeEventListener("click", cancelClickHandler, true);
      if (docPasteHandler) doc.removeEventListener("paste", docPasteHandler, true);
      if (docDropHandler) doc.removeEventListener("drop", docDropHandler, true);
      if (docFileChangeHandler) doc.removeEventListener("change", docFileChangeHandler, true);
      if (docInputHandler) doc.removeEventListener("input", docInputHandler, true);
      if (outsidePopoverHandler) doc.removeEventListener("pointerdown", outsidePopoverHandler, true);
      if (modelTriggerClickHandler) doc.removeEventListener("pointerdown", modelTriggerClickHandler, true);
    }
    revokeCachedMedia("");
    mediaLoadInflight.clear();
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

  return {
    init,
    destroy,
    setOpen,
    toggleOpen,
    toggleLiveEditPopover,
    handleHotkeyAction,
    startElementPicker,
    stopElementPicker,
    openAnnotator,
    applyLiveEditsUpdate,
    applyQuotaSummary,
    applyUpdateStatus,
    setViewMode,
    setLocale,
    applyRemoteState,
    estimateTokens: spTokenEst,
    pollStream,
    resolveMediaUrl: resolveStudioMediaUrl,
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
