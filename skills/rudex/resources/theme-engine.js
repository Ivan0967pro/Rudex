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
    descRu: "Тёплый пергамент #F5F3EC без бликов, глубокие чернила и терракота #C15F3C",
    descEn: "Warm eye-friendly ivory parchment #F5F3EC, charcoal ink, and #C15F3C terracotta",
    mode: "light",
    badge: "Claude Code",
    vars: {
      accentColor: "#c15f3c",
      canvasBg: "#f5f3ec",
      cardBg: "#fbfaf6",
      sidebarBg: "#ebe8de",
      fgColor: "#1b1a18",
      mutedColor: "#636058",
      borderColor: "#d9d5c9",
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
      borderColor: "#2a3552",
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
    descRu: "Мягкие бумажные поверхности без рези в глазах и чёткая типографика",
    descEn: "Soft glare-free paper surfaces with crisp ink typography",
    mode: "light",
    vars: {
      accentColor: "#2563eb",
      canvasBg: "#f2f1ec",
      cardBg: "#faf9f6",
      sidebarBg: "#e8e6df",
      fgColor: "#1c1c20",
      mutedColor: "#585862",
      borderColor: "#d6d3c9",
      glassOpacity: 88,
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
    descRu: "Мягкие арктические поверхности без бликов и небесно-синий акцент",
    descEn: "Soft glare-free arctic light surfaces with sky blue accent",
    mode: "light",
    vars: {
      accentColor: "#0284c7",
      canvasBg: "#edf2f7",
      cardBg: "#f7fafc",
      sidebarBg: "#e2e8f0",
      fgColor: "#142033",
      mutedColor: "#4b5c73",
      borderColor: "#c4d1df",
      glassOpacity: 86,
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

const UI_STYLE_PRESETS = [
  {
    id: "antigravity",
    nameRu: "Antigravity",
    nameEn: "Antigravity",
    badge: "Базовый",
    badgeEn: "Default",
    descRu: "Оригинальный стиль поля ввода, чата и меню моделей Antigravity",
    descEn: "Original Antigravity composer, chat layout, and model selector",
  },
  {
    id: "claude-code",
    nameRu: "Claude Code",
    nameEn: "Claude Code",
    badge: "Anthropic",
    badgeEn: "Anthropic",
    descRu: "Редакторская строка Reply, спокойный текстовый выбор модели без рамок и компактные тёплые баблы",
    descEn: "Editorial Reply bar, quiet borderless model selector, and compact warm right bubbles",
  },
  {
    id: "codex",
    nameRu: "OpenAI Codex",
    nameEn: "OpenAI Codex",
    badge: "Codex Desktop",
    badgeEn: "Codex Desktop",
    descRu: "Объёмная командная капсула (20px), пилюльная кнопка модели и структурные карточки шагов",
    descEn: "Elevated 20px command capsule, pill model picker, and structured turn/tool cards",
  },
  {
    id: "opencode",
    nameRu: "OpenCode",
    nameEn: "OpenCode",
    badge: "SST TUI",
    badgeEn: "SST TUI",
    descRu: "Чёткий терминальный фрейм (6px), левая акцент-полоса сообщений и моноширинный бейдж моделей",
    descEn: "Crisp 6px terminal frame, left-accent session timeline bubbles, and mono model badge",
  },
];

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

const FONT_PRESETS = {
  ui: [
    { id: "system", label: "Системный (Default)", labelEn: "System Default", stack: "", googleQuery: "" },
    {
      id: "chatgpt-sans",
      label: "ChatGPT (OpenAI Sans / Inter)",
      labelEn: "ChatGPT (OpenAI Sans / Inter)",
      badge: "ChatGPT",
      stack: '"OpenAI Sans", "Söhne", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      googleQuery: "family=Inter:wght@400;500;600;700",
    },
    {
      id: "opencode-mono",
      label: "OpenCode (JetBrains Mono)",
      labelEn: "OpenCode (JetBrains Mono)",
      badge: "OpenCode",
      stack: '"JetBrains Mono", "Geist Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      googleQuery: "family=JetBrains+Mono:wght@400;500;600;700",
    },
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
      label: "Claude Editorial (Source Serif 4)",
      labelEn: "Claude Editorial (Source Serif 4)",
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
      label: "Cursor / Linear (Geist Sans)",
      labelEn: "Cursor / Linear (Geist Sans)",
      badge: "Cursor",
      stack: '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      googleQuery: "family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600;700",
    },
    {
      id: "golos",
      label: "Golos Text (Кириллица Pro)",
      labelEn: "Golos Text (Cyrillic Pro)",
      badge: "RU",
      stack: '"Golos Text", "Inter", "Segoe UI", system-ui, sans-serif',
      googleQuery: "family=Golos+Text:wght@400;500;600;700",
    },
    {
      id: "onest",
      label: "Onest (Кириллица · Современный)",
      labelEn: "Onest (Modern Cyrillic)",
      badge: "RU",
      stack: '"Onest", "Inter", "Segoe UI", system-ui, sans-serif',
      googleQuery: "family=Onest:wght@400;500;600;700",
    },
    {
      id: "manrope",
      label: "Manrope (Мягкий геом.)",
      labelEn: "Manrope (Geometric)",
      stack: '"Manrope", "Inter", "Segoe UI", system-ui, sans-serif',
      googleQuery: "family=Manrope:wght@400;500;600;700",
    },
    {
      id: "plus-jakarta",
      label: "Plus Jakarta Sans",
      labelEn: "Plus Jakarta Sans",
      stack: '"Plus Jakarta Sans", "Inter", "Segoe UI", sans-serif',
      googleQuery: "family=Plus+Jakarta+Sans:wght@400;500;600;700",
    },
    { id: "segoe", label: "Segoe UI (Windows 11)", labelEn: "Segoe UI (Windows 11)", stack: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif', googleQuery: "" },
    { id: "inter", label: "Inter", labelEn: "Inter", stack: '"Inter", "Segoe UI", system-ui, sans-serif', googleQuery: "family=Inter:wght@400;500;600;700" },
    { id: "rubik", label: "Rubik", labelEn: "Rubik", stack: '"Rubik", "Segoe UI", system-ui, sans-serif', googleQuery: "family=Rubik:wght@400;500;600;700" },
    { id: "nunito", label: "Nunito (Мягкий)", labelEn: "Nunito (Rounded)", stack: '"Nunito", "Segoe UI", system-ui, sans-serif', googleQuery: "family=Nunito:wght@400;500;600;700" },
    { id: "ibm-plex", label: "IBM Plex Sans", labelEn: "IBM Plex Sans", stack: '"IBM Plex Sans", "Segoe UI", sans-serif', googleQuery: "family=IBM+Plex+Sans:wght@400;500;600;700" },
    { id: "georgia", label: "Georgia (Serif)", labelEn: "Georgia (Serif)", stack: 'Georgia, "Times New Roman", serif', googleQuery: "" },
  ],
  mono: [
    { id: "system", label: "Стандартный (Default)", labelEn: "System Mono", stack: "", googleQuery: "" },
    {
      id: "opencode-mono",
      label: "OpenCode Mono (JetBrains)",
      labelEn: "OpenCode Mono (JetBrains)",
      badge: "OpenCode",
      stack: '"JetBrains Mono", "Geist Mono", "Fira Code", Consolas, monospace',
      googleQuery: "family=JetBrains+Mono:wght@400;500;600;700",
    },
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
      label: "Vercel / Cursor (Geist Mono)",
      labelEn: "Vercel / Cursor (Geist Mono)",
      badge: "Cursor",
      stack: '"Geist Mono", "JetBrains Mono", Consolas, monospace',
      googleQuery: "family=Geist+Mono:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600",
    },
    {
      id: "fira",
      label: "ChatGPT / Fira Code (Лигатуры)",
      labelEn: "ChatGPT / Fira Code (Ligatures)",
      badge: "ChatGPT",
      stack: '"Fira Code", "JetBrains Mono", Consolas, monospace',
      googleQuery: "family=Fira+Code:wght@400;500;600;700",
    },
    {
      id: "ibm-plex-mono",
      label: "IBM Plex Mono",
      labelEn: "IBM Plex Mono",
      stack: '"IBM Plex Mono", "JetBrains Mono", Consolas, monospace',
      googleQuery: "family=IBM+Plex+Mono:wght@400;500;600",
    },
    {
      id: "source-code-pro",
      label: "Source Code Pro (Adobe)",
      labelEn: "Source Code Pro (Adobe)",
      stack: '"Source Code Pro", Consolas, monospace',
      googleQuery: "family=Source+Code+Pro:wght@400;500;600;700",
    },
    {
      id: "space-mono",
      label: "Space Mono (Терминал)",
      labelEn: "Space Mono (Terminal)",
      stack: '"Space Mono", Consolas, monospace',
      googleQuery: "family=Space+Mono:wght@400;700",
    },
    {
      id: "ubuntu-mono",
      label: "Ubuntu Mono (Кириллица)",
      labelEn: "Ubuntu Mono (Cyrillic)",
      stack: '"Ubuntu Mono", Consolas, monospace',
      googleQuery: "family=Ubuntu+Mono:wght@400;700",
    },
    { id: "cascadia", label: "VS Code (Cascadia Code)", labelEn: "VS Code (Cascadia Code)", stack: '"Cascadia Code", Consolas, monospace', googleQuery: "" },
    { id: "jetbrains", label: "JetBrains Mono", labelEn: "JetBrains Mono", stack: '"JetBrains Mono", Consolas, monospace', googleQuery: "family=JetBrains+Mono:wght@400;500;600;700" },
    { id: "consolas", label: "Consolas", labelEn: "Consolas", stack: 'Consolas, "Courier New", monospace', googleQuery: "" },
  ],
};

const DEFAULT_APPEARANCE = {
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
  borderPreset: "crisp", // "airy" | "crisp" | "contrast"
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

const TE_HEX_RE = /^#[0-9a-fA-F]{6}$/;
const TE_SAFE_FONT_NAME_RE = /[^a-zA-Zа-яА-ЯёЁ0-9 _\-().]/g;

function teSanitizeCustomFontName(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(TE_SAFE_FONT_NAME_RE, "").trim().slice(0, 64);
}

function teFindFontAny(preferredGroup, id) {
  if (!id || id === "inherit") return { id: "inherit", stack: "", googleQuery: "" };
  if (id === "custom") return { id: "custom", stack: "", googleQuery: "" };
  const primary = FONT_PRESETS[preferredGroup] || [];
  for (let i = 0; i < primary.length; i += 1) {
    if (primary[i].id === id) return primary[i];
  }
  const altGroup = preferredGroup === "mono" ? "ui" : "mono";
  const secondary = FONT_PRESETS[altGroup] || [];
  for (let i = 0; i < secondary.length; i += 1) {
    if (secondary[i].id === id) return secondary[i];
  }
  return null;
}

function teResolveFontStack(preferredGroup, fontId, customName) {
  if (!fontId || fontId === "system" || fontId === "inherit") return "";
  if (fontId === "custom") {
    const clean = teSanitizeCustomFontName(customName);
    if (!clean) return "";
    return preferredGroup === "mono"
      ? `"${clean}", "JetBrains Mono", Consolas, monospace`
      : `"${clean}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  }
  const found = teFindFontAny(preferredGroup, fontId);
  return found && found.stack ? found.stack : "";
}

function teNormalizeElementOverrides(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const hexOrRgba = (v) => {
    if (typeof v !== "string") return "";
    const s = v.trim();
    if (TE_HEX_RE.test(s)) return s.toLowerCase();
    return "";
  };
  const hasNum = (v) => v !== "" && v !== null && v !== undefined && Number.isFinite(Number(v));
  for (let i = 0; i < raw.length && out.length < 80; i += 1) {
    const it = raw[i];
    if (!it || typeof it !== "object") continue;
    const selector = typeof it.selector === "string" ? it.selector.trim().slice(0, 1600) : "";
    if (!selector || /[{}<\\;]|\/\*/.test(selector) || /url\s*\(|expression\s*\(|@import/i.test(selector)) continue;
    const st = it.styles && typeof it.styles === "object" ? it.styles : {};
    const validScope = it.scope === "similar" || it.scope === "group" ? it.scope : "exact";
    const validAlign = st.align === "left" || st.align === "center" || st.align === "right" ? st.align : "";
    out.push({
      id: typeof it.id === "string" && it.id ? it.id.slice(0, 64) : "ov-" + i,
      name: typeof it.name === "string" ? it.name.trim().slice(0, 80) : selector.slice(0, 48),
      selector,
      zone: typeof it.zone === "string" ? it.zone.trim().slice(0, 48) : "",
      scope: validScope,
      enabled: it.enabled !== false,
      styles: {
        fontFamily: typeof st.fontFamily === "string" ? st.fontFamily.trim().slice(0, 64) : "",
        fontFamilyCustom: teSanitizeCustomFontName(st.fontFamilyCustom),
        fontSize: hasNum(st.fontSize) && Number(st.fontSize) > 0 ? Math.round(teClamp(st.fontSize, 8, 64, 0)) : 0,
        fontWeight: hasNum(st.fontWeight) && Number(st.fontWeight) > 0 ? Math.round(teClamp(st.fontWeight, 300, 900, 0)) : 0,
        lineHeight: hasNum(st.lineHeight) && Number(st.lineHeight) > 0 ? Math.round(teClamp(st.lineHeight, 1.0, 2.4, 0) * 100) / 100 : 0,
        color: hexOrRgba(st.color),
        bgColor: hexOrRgba(st.bgColor),
        bgOpacity: hasNum(st.bgOpacity) ? Math.round(teClamp(st.bgOpacity, 0, 100, 100)) : 100,
        opacity: hasNum(st.opacity) && Number(st.opacity) >= 0 ? Math.round(teClamp(st.opacity, 0, 100, -1)) : -1,
        borderColor: hexOrRgba(st.borderColor),
        borderWidth: hasNum(st.borderWidth) && Number(st.borderWidth) >= 0 ? Math.round(teClamp(st.borderWidth, 0, 8, -1)) : -1,
        borderRadius: hasNum(st.borderRadius) && Number(st.borderRadius) >= 0 ? Math.round(teClamp(st.borderRadius, 0, 64, -1)) : -1,
        padding: hasNum(st.padding) && Number(st.padding) >= 0 ? Math.round(teClamp(st.padding, 0, 64, -1)) : -1,
        paddingY: hasNum(st.paddingY) && Number(st.paddingY) >= 0 ? Math.round(teClamp(st.paddingY, 0, 64, -1)) : -1,
        paddingX: hasNum(st.paddingX) && Number(st.paddingX) >= 0 ? Math.round(teClamp(st.paddingX, 0, 64, -1)) : -1,
        offsetX: hasNum(st.offsetX) ? Math.round(teClamp(st.offsetX, -800, 800, 0)) : 0,
        offsetY: hasNum(st.offsetY) ? Math.round(teClamp(st.offsetY, -800, 800, 0)) : 0,
        align: validAlign,
        width: hasNum(st.width) && Number(st.width) > 0 ? Math.round(teClamp(st.width, 24, 1800, 0)) : 0,
        minHeight: hasNum(st.minHeight) && Number(st.minHeight) > 0 ? Math.round(teClamp(st.minHeight, 16, 800, 0)) : 0,
        hidden: Boolean(st.hidden),
      },
    });
  }
  return out;
}

function teSplitTopLevelCommas(sel) {
  const out = [];
  let cur = "";
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote = "";
  for (let i = 0; i < sel.length; i += 1) {
    const ch = sel[i];
    if (quote) {
      cur += ch;
      if (ch === quote && sel[i - 1] !== "\\") quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "(") parenDepth += 1;
    else if (ch === ")" && parenDepth > 0) parenDepth -= 1;
    else if (ch === "[") bracketDepth += 1;
    else if (ch === "]" && bracketDepth > 0) bracketDepth -= 1;
    if (ch === "," && parenDepth === 0 && bracketDepth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function teBoostOverrideSelector(rawSel) {
  const boostPrefix = ":not(#_rx1):not(#_rx2):not(#_rx3):not(#_rx4)";
  const branches = teSplitTopLevelCommas(String(rawSel || "").trim());
  if (branches.length === 0) return rawSel;
  return branches.map((b) => {
    if (/^(?:html|:root)(?=[\s.:#[>+~]|$)/i.test(b)) {
      return b.replace(/^(html|:root)/i, `$1${boostPrefix}`);
    }
    return `html${boostPrefix} ${b}`;
  }).join(",\n");
}

function teBuildElementOverridesCss(overrides, paused, cfg) {
  if (paused || !Array.isArray(overrides) || overrides.length === 0) return "";
  const usCfg = cfg && cfg.uiStyle ? cfg.uiStyle : null;
  const isClaudeSplit = Boolean(usCfg && (usCfg.composer === "claude-code" || (usCfg.composer === "preset" && usCfg.preset === "claude-code")));
  const blocks = [];
  for (let i = 0; i < overrides.length; i += 1) {
    const ov = overrides[i];
    if (!ov || ov.enabled === false || !ov.selector) continue;
    const st = ov.styles || {};
    const splitComposerSurface = isClaudeSplit && (ov.zone === "composer" || ov.selector.trim() === '[data-rudex-theme-composer="1"]') && !st.hidden;
    const outerDecls = [];
    const surfaceDecls = [];
    const targetSurface = splitComposerSurface ? surfaceDecls : outerDecls;
    if (st.hidden) {
      outerDecls.push("display: none !important;");
    } else {
      const fStack = st.fontFamily ? teResolveFontStack("ui", st.fontFamily, st.fontFamilyCustom) : "";
      if (fStack) outerDecls.push(`font-family: ${fStack} !important;`);
      if (st.fontSize > 0) outerDecls.push(`font-size: ${st.fontSize}px !important;`);
      if (st.fontWeight > 0) outerDecls.push(`font-weight: ${st.fontWeight} !important;`);
      if (st.lineHeight > 0) outerDecls.push(`line-height: ${st.lineHeight} !important;`);
      if (st.color) outerDecls.push(`color: ${st.color} !important;`);
      if (st.bgOpacity === 0) {
        // 0% background opacity must strip ALL background fill, glass blur & shadow while keeping child dots/icons/text at 100% contrast!
        targetSurface.push("background: transparent !important;");
        targetSurface.push("background-color: transparent !important;");
        targetSurface.push("background-image: none !important;");
        targetSurface.push("backdrop-filter: none !important;");
        targetSurface.push("-webkit-backdrop-filter: none !important;");
        targetSurface.push("box-shadow: none !important;");
      } else if (st.bgColor) {
        const bgVal = st.bgOpacity < 100 ? teHexToRgba(st.bgColor, st.bgOpacity) : st.bgColor;
        targetSurface.push(`background: ${bgVal} !important;`);
        targetSurface.push(`background-color: ${bgVal} !important;`);
        targetSurface.push("background-image: none !important;");
      }
      if (st.opacity >= 0 && st.opacity <= 100) {
        outerDecls.push(`opacity: ${(st.opacity / 100).toFixed(2)} !important;`);
      }
      if (st.borderColor && st.borderWidth >= 0) {
        targetSurface.push(st.borderWidth === 0 ? "border: none !important;" : `border: ${st.borderWidth}px solid ${st.borderColor} !important;`);
      } else if (st.borderColor) {
        targetSurface.push(`border-color: ${st.borderColor} !important;`);
      } else if (st.borderWidth === 0) {
        targetSurface.push("border: none !important;");
      } else if (st.borderWidth > 0) {
        targetSurface.push(`border-width: ${st.borderWidth}px !important; border-style: solid !important;`);
      }
      if (st.borderRadius >= 0) targetSurface.push(`border-radius: ${st.borderRadius}px !important;`);
      if (st.paddingY >= 0 || st.paddingX >= 0) {
        if (st.padding >= 0 && (st.paddingY < 0 || st.paddingX < 0)) {
          targetSurface.push(`padding: ${st.padding}px !important;`);
        }
        if (st.paddingY >= 0) {
          targetSurface.push(`padding-top: ${st.paddingY}px !important;`, `padding-bottom: ${st.paddingY}px !important;`);
        }
        if (st.paddingX >= 0) {
          targetSurface.push(`padding-left: ${st.paddingX}px !important;`, `padding-right: ${st.paddingX}px !important;`);
        }
      } else if (st.padding >= 0) {
        targetSurface.push(`padding: ${st.padding}px !important;`);
      }
      if (st.width > 0) {
        // Only auto-center dedicated chat/composer zones unless user explicitly chose alignment (prevents pushing sibling flex items!)
        const shouldCenter = !st.align && (ov.zone === "composer" || ov.zone === "agent-reply" || ov.zone === "user-bubble");
        outerDecls.push(`width: ${st.width}px !important; max-width: min(100%, ${st.width}px) !important;${shouldCenter ? " margin-inline: auto !important;" : ""}`);
      }
      if (st.minHeight > 0) targetSurface.push(`min-height: ${st.minHeight}px !important;`);
      if (st.align === "left") {
        outerDecls.push("margin-left: 0 !important;", "margin-right: auto !important;", "align-self: flex-start !important;", "justify-self: start !important;");
      } else if (st.align === "center") {
        outerDecls.push("margin-inline: auto !important;", "align-self: center !important;", "justify-self: center !important;");
      } else if (st.align === "right") {
        outerDecls.push("margin-left: auto !important;", "margin-right: 0 !important;", "align-self: flex-end !important;", "justify-self: end !important;");
      }
      if ((st.offsetX && st.offsetX !== 0) || (st.offsetY && st.offsetY !== 0)) {
        outerDecls.push(`translate: ${st.offsetX || 0}px ${st.offsetY || 0}px !important;`);
        const branches = teSplitTopLevelCommas(ov.selector);
        const hasInlineLeaf = branches.some((b) => /(?:^|[\s>+~])(?:span|a|label|small|strong|em|b|i)(?:[:.[\s]|$)/i.test(b.trim().split(/[\s>+~]+/).pop() || ""));
        if (hasInlineLeaf) {
          outerDecls.push("display: inline-block;");
        }
      }
    }
    if (outerDecls.length > 0) {
      blocks.push(`${teBoostOverrideSelector(ov.selector)} {\n  ${outerDecls.join("\n  ")}\n}`);
    }
    if (splitComposerSurface && surfaceDecls.length > 0) {
      const innerSel = `${ov.selector} [data-rudex-comp-input-row="1"]`;
      blocks.push(`${teBoostOverrideSelector(innerSel)} {\n  ${surfaceDecls.join("\n  ")}\n}`);
    }
    if (!st.hidden && (st.fontFamily || st.fontSize > 0 || st.fontWeight > 0 || st.lineHeight > 0 || st.color)) {
      const subDecls = [];
      const fStack = st.fontFamily ? teResolveFontStack("ui", st.fontFamily, st.fontFamilyCustom) : "";
      if (fStack) subDecls.push(`font-family: ${fStack} !important;`);
      if (st.fontSize > 0) subDecls.push(`font-size: inherit !important;`);
      if (st.fontWeight > 0) subDecls.push(`font-weight: ${st.fontWeight} !important;`);
      if (st.lineHeight > 0) subDecls.push(`line-height: ${st.lineHeight} !important;`);
      if (st.color) subDecls.push(`color: ${st.color} !important;`);
      const descSel = teSplitTopLevelCommas(ov.selector)
        .map((b) => `${b} :where(span, p, div, label, h1, h2, h3, h4, h5, h6, li, strong, small, button, a, svg):not(code):not(pre)`)
        .join(", ");
      blocks.push(`${teBoostOverrideSelector(descSel)} {\n  ${subDecls.join("\n  ")}\n}`);
    }
  }
  return blocks.join("\n");
}

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
  const slotDefs = [
    ["ui", ty.uiFont],
    ["mono", ty.monoFont],
    ["ui", ty.inputFont],
    ["ui", ty.userMsgFont],
    ["ui", ty.agentFont],
    ["ui", ty.thinkingFont],
  ];
  for (let i = 0; i < slotDefs.length; i += 1) {
    const f = teFindFontAny(slotDefs[i][0], slotDefs[i][1]);
    if (f && f.googleQuery) pushQuery(f.googleQuery);
  }
  const ovs = Array.isArray(cfg.elementOverrides) ? cfg.elementOverrides : [];
  for (let i = 0; i < ovs.length; i += 1) {
    const ov = ovs[i];
    if (ov && ov.enabled !== false && ov.styles && ov.styles.fontFamily) {
      const f = teFindFontAny("ui", ov.styles.fontFamily);
      if (f && f.googleQuery) pushQuery(f.googleQuery);
    }
  }
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

function teNormalizeUiStyle(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const validPart = (v, fb) =>
    v === "antigravity" || v === "claude-code" || v === "codex" || v === "opencode" ? v : fb;
  const basePreset =
    src.preset === "antigravity" || src.preset === "claude-code" || src.preset === "codex" || src.preset === "opencode"
      ? src.preset
      : "antigravity";
  const composer = validPart(src.composer, basePreset);
  const chat = validPart(src.chat, basePreset);
  const modelSelector = validPart(src.modelSelector, basePreset);
  const preset = composer === chat && chat === modelSelector ? composer : "custom";

  const normZeroOrRange = (val, min, max) => {
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(teClamp(n, min, max, 0));
  };
  const composerShadow =
    src.composerShadow === "none" || src.composerShadow === "soft" || src.composerShadow === "elevated"
      ? src.composerShadow
      : "preset";
  const userBubbleAlign =
    src.userBubbleAlign === "right" || src.userBubbleAlign === "left" || src.userBubbleAlign === "full"
      ? src.userBubbleAlign
      : "preset";
  const agentAccentBar =
    src.agentAccentBar === "on" || src.agentAccentBar === "off"
      ? src.agentAccentBar
      : "preset";
  const modelBtnStyle =
    src.modelBtnStyle === "ghost" ||
    src.modelBtnStyle === "pill" ||
    src.modelBtnStyle === "bordered" ||
    src.modelBtnStyle === "mono"
      ? src.modelBtnStyle
      : "preset";
  const modelMenuDensity =
    src.modelMenuDensity === "compact" || src.modelMenuDensity === "comfortable"
      ? src.modelMenuDensity
      : "preset";

  return {
    preset,
    composer,
    chat,
    modelSelector,
    composerRadius: normZeroOrRange(src.composerRadius, 4, 32),
    composerMaxWidth: normZeroOrRange(src.composerMaxWidth, 560, 1120),
    composerPadY: normZeroOrRange(src.composerPadY, 6, 24),
    composerShadow,
    userBubbleAlign,
    userBubbleMaxWidth: normZeroOrRange(src.userBubbleMaxWidth, 45, 100),
    chatGap: normZeroOrRange(src.chatGap, 4, 28),
    agentAccentBar,
    modelBtnStyle,
    modelMenuDensity,
  };
}

function teHasCustomUiStyle(cfg) {
  const us = cfg && cfg.uiStyle ? cfg.uiStyle : DEFAULT_UI_STYLE;
  return (
    us.composer !== "antigravity" ||
    us.chat !== "antigravity" ||
    us.modelSelector !== "antigravity" ||
    us.composerRadius > 0 ||
    us.composerMaxWidth > 0 ||
    us.composerPadY > 0 ||
    us.composerShadow !== "preset" ||
    us.userBubbleAlign !== "preset" ||
    us.userBubbleMaxWidth > 0 ||
    us.chatGap > 0 ||
    us.agentAccentBar !== "preset" ||
    us.modelBtnStyle !== "preset" ||
    us.modelMenuDensity !== "preset"
  );
}

function teBuildUiStyleCss(cfg, vars, isLight, hasThemeOverride, hasWallpaper, effectiveBlurPxArg) {
  const us = teNormalizeUiStyle(cfg && cfg.uiStyle);
  if (!teHasCustomUiStyle({ uiStyle: us })) return "";

  const effectiveBlurPx = typeof effectiveBlurPxArg === "number" && Number.isFinite(effectiveBlurPxArg)
    ? Math.max(0, Math.round(effectiveBlurPxArg))
    : Math.max(0, Math.round(teClamp(cfg && cfg.glassBlur, 0, 36, 12)));
  const rules = [];
  const fgCol = hasThemeOverride ? vars.fgColor : (isLight ? "#18181b" : "#f4f4f5");
  const mutedCol = hasThemeOverride ? vars.mutedColor : (isLight ? "#52525b" : "#a1a1aa");
  const hairline = isLight ? "rgba(24, 24, 27, 0.13)" : "rgba(255, 255, 255, 0.12)";
  const strongBrd = isLight ? "rgba(24, 24, 27, 0.22)" : "rgba(255, 255, 255, 0.18)";
  const hoverBg = isLight ? "rgba(24, 24, 27, 0.06)" : "rgba(255, 255, 255, 0.07)";
  const surfaceSoft = hasThemeOverride
    ? teMixHex(vars.cardBg, isLight ? vars.fgColor : "#ffffff", isLight ? 0.045 : 0.06)
    : (isLight ? "#f3f2ee" : "#222226");
  const pillHoverBg = hasThemeOverride
    ? teMixHex(surfaceSoft, isLight ? "#000000" : "#ffffff", isLight ? 0.05 : 0.07)
    : (isLight ? "#e9e7e2" : "#2b2b30");

  const resolveStyleAccent = (styleId) => {
    if (hasThemeOverride || cfg.customAccent) return vars.accentColor;
    if (styleId === "claude-code") return isLight ? "#c15f3c" : "#d97757";
    if (styleId === "codex") return isLight ? "#18181b" : "#f4f4f5";
    if (styleId === "opencode") return isLight ? "#0f766e" : "#5eead4";
    return vars.accentColor;
  };

  const composerAccent = resolveStyleAccent(us.composer);
  const chatAccent = resolveStyleAccent(us.chat);
  const modelAccent = resolveStyleAccent(us.modelSelector);
  const compAccentFg = teGetYiq(composerAccent) > 155 ? "#111216" : "#ffffff";

  // === 1. COMPOSER (Message Input — True Structural Platform Layouts) ===
  const compSel = `[data-rudex-theme-composer="1"],
form:has(textarea):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
form:has([contenteditable="true"]):not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
[data-testid="composer"]:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"])),
.composer-container:not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"]))`;

  const compDecls = [];
  const compFocusDecls = [];
  const compBlocks = [];

  const resolveShadowCss = (mode, defaultMode) => {
    const eff = mode === "preset" ? defaultMode : mode;
    if (eff === "none") return "none";
    if (eff === "soft") {
      return isLight
        ? "0 2px 12px rgba(24, 24, 27, 0.07)"
        : "0 2px 16px rgba(0, 0, 0, 0.24)";
    }
    if (eff === "elevated") {
      return isLight
        ? "0 10px 30px -6px rgba(15, 23, 42, 0.13), 0 1px 3px rgba(15, 23, 42, 0.05)"
        : "0 14px 36px -6px rgba(0, 0, 0, 0.52), 0 0 0 1px rgba(255, 255, 255, 0.04)";
    }
    return "";
  };

  if (us.composer === "claude-code") {
    // Authentic Claude Code 2026 Split Layout:
    // Top: crisp bordered Reply box (single-line or clean multiline scroll) with return arrow (↵) inside right edge
    // Bottom (outside box, on canvas): + & mic on left, quiet borderless Model + Mode text on right
    const cRad = us.composerRadius > 0 ? us.composerRadius : 14;
    const padY = us.composerPadY >= 6 ? us.composerPadY : 9;
    const tyInputSz = cfg && cfg.typography && Number(cfg.typography.inputFontSize) > 0 ? Number(cfg.typography.inputFontSize) : 0;
    const linePx = tyInputSz > 16 ? Math.round(tyInputSz * 1.5) : 24;
    const boxH = padY * 2 + 2 + linePx;
    const idleArrowBottom = Math.max(9, Math.round((padY * 2 + linePx - 16) / 2));
    const sendFallbackTop = Math.max(6, Math.round((boxH - 28) / 2));
    const baseCardHex = hasThemeOverride ? vars.cardBg : (isLight ? "#faf9f5" : "#262624");
    const canvasYiq = hasThemeOverride ? teGetYiq(vars.canvasBg) : (isLight ? 245 : 22);
    const cardYiq = teGetYiq(baseCardHex);
    const liftedCardHex = hasThemeOverride && Math.abs(cardYiq - canvasYiq) < 14
      ? teMixHex(baseCardHex, isLight ? "#000000" : "#ffffff", isLight ? 0.03 : 0.045)
      : baseCardHex;
    const cBg = hasWallpaper
      ? teHexToRgba(liftedCardHex, Math.min(94, Math.max(78, (cfg && cfg.glassOpacity) || 86)))
      : liftedCardHex;
    const stripBg = hasWallpaper
      ? teHexToRgba(liftedCardHex, Math.min(90, Math.max(74, ((cfg && cfg.glassOpacity) || 86) - 6)))
      : "transparent";
    const stripBrd = isLight ? "rgba(31, 30, 29, 0.14)" : "rgba(250, 249, 245, 0.13)";
    const stripBlurPx = hasWallpaper ? Math.max(10, effectiveBlurPx || 12) : 0;
    const toolbarIconCol = hasWallpaper
      ? `color-mix(in srgb, ${fgCol} ${isLight ? "76%" : "82%"}, ${mutedCol})`
      : mutedCol;
    const cBrd = hasThemeOverride
      ? `color-mix(in srgb, ${fgCol} ${isLight ? "14%" : "15%"}, ${vars.borderColor})`
      : (isLight ? "rgba(31, 30, 29, 0.16)" : "rgba(250, 249, 245, 0.16)");
    const effShadow = resolveShadowCss(us.composerShadow, "none");
    const ccSendIconMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 10 4 15 9 20'/%3E%3Cpath d='M20 4v7a4 4 0 0 1-4 4H4'/%3E%3C/svg%3E")`;
    const ccVoiceAuto = 'button:where([aria-label*="voice mode" i], [aria-label*="live voice" i], [aria-label*="голосов" i], [title*="voice mode" i], [title*="голосов" i], [data-testid*="voice" i]):not([data-rudex-comp-mic-active="1"]):not([aria-pressed="true"]):not([hidden]):not(.hidden):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg)';
    const ccSendAuto = 'button:where([type="submit"], [data-testid="send-button"], [data-testid="input-send-button"], [data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"], [aria-label*="send" i], [aria-label*="отправ" i]):not([data-rudex-comp-voice="1"]):not([data-rudex-comp-mic="1"]):not([data-rudex-comp-mic-active="1"]):not([data-rudex-comp-plus="1"]):not([aria-label*="voice" i]):not([aria-label*="голосов" i]):not(#rudex-studio-host):not(#rudex-studio-host *)';

    compDecls.push(
      `position: relative !important;`,
      `background: transparent !important;`,
      `background-color: transparent !important;`,
      `background-image: none !important;`,
      `border: none !important;`,
      `box-shadow: none !important;`,
      `padding: 0 !important;`,
      `border-radius: 0 !important;`,
      `backdrop-filter: none !important;`,
      `-webkit-backdrop-filter: none !important;`,
      `overflow: visible !important;`
    );
    if (us.composerMaxWidth >= 560) {
      compDecls.push(`max-width: min(100%, ${us.composerMaxWidth}px) !important;`, `width: 100%;`, `margin-inline: auto !important;`);
    }

    compBlocks.push(`
[data-rudex-theme-composer="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg),
[data-rudex-theme-composer="1"] [data-rudex-comp-stack="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  display: flex !important;
  flex-direction: column !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  min-height: 0 !important;
  gap: 0 !important;
  border-radius: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}
:where(div, form, section):has(> [data-rudex-theme-composer="1"]):not(main):not(body):not([data-rudex-bg-shell="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg),
[data-rudex-comp-wrap="1"]:not(main):not(body):not([data-rudex-bg-shell="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  overflow: visible !important;
}
[data-rudex-comp-wrap="1"]:not(main):not(body):not([data-rudex-bg-shell="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
  gap: 0 !important;
}
[data-rudex-comp-dock="1"]:not(main):not(body):not([data-rudex-bg-shell="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  padding-bottom: 8px !important;
  margin-bottom: 0 !important;
  overflow: visible !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-stack="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  position: static !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-top-row="1"]:empty {
  display: none !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-top-row="1"] {
  ${hasWallpaper ? `display: inline-flex !important;
  align-items: center !important;
  width: fit-content !important;
  max-width: 100% !important;
  padding: 3px 10px !important;
  margin: 0 0 6px 0 !important;
  background-color: ${stripBg} !important;
  border: 1px solid ${stripBrd} !important;
  border-radius: ${Math.min(cRad, 10)}px !important;
  backdrop-filter: blur(${stripBlurPx}px) saturate(150%) !important;
  -webkit-backdrop-filter: blur(${stripBlurPx}px) saturate(150%) !important;` : `padding: 0 2px 6px !important;
  margin: 0 !important;`}
}
${hasWallpaper ? `[data-rudex-theme-composer="1"] [data-rudex-comp-top-row="1"],
[data-rudex-theme-composer="1"] [data-rudex-comp-top-row="1"] :where(button, a, span, svg) {
  color: ${toolbarIconCol} !important;
}` : ""}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg),
[data-rudex-theme-composer="1"] textarea[data-rudex-comp-input-row="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  position: relative !important;
  width: 100% !important;
  min-height: ${boxH}px !important;
  height: auto !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  background-color: ${cBg} !important;
  border: 1px solid ${cBrd} !important;
  border-radius: ${cRad}px !important;
  padding: ${padY}px 12px ${padY}px 14px !important;
  box-shadow: ${effShadow || "none"} !important;
  overflow: visible !important;
  ${hasWallpaper && effectiveBlurPx > 0 ? `backdrop-filter: blur(${effectiveBlurPx}px) saturate(160%); -webkit-backdrop-filter: blur(${effectiveBlurPx}px) saturate(160%);` : ""}
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"]:is(textarea, [contenteditable="true"], [role="textbox"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  padding: ${padY}px 44px ${padY}px 14px !important;
  overflow-y: auto !important;
  max-height: min(40vh, 280px) !important;
}
[data-rudex-theme-composer="1"]:not(:has([data-rudex-comp-send="1"], button[type="submit"], [data-testid="send-button"], [data-testid="input-send-button"])) [data-rudex-comp-input-row="1"]:not(textarea):not([contenteditable="true"]):not([role="textbox"])::after {
  content: "";
  position: absolute;
  right: 16px;
  bottom: ${idleArrowBottom}px;
  width: 16px;
  height: 16px;
  background-color: ${mutedCol};
  opacity: 0.48;
  pointer-events: none;
  -webkit-mask: ${ccSendIconMask} center / contain no-repeat;
  mask: ${ccSendIconMask} center / contain no-repeat;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"]:not(textarea):not([contenteditable="true"]):not([role="textbox"]) {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  align-items: stretch !important;
  gap: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-empty-slot="1"] {
  display: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-attach-row="1"] {
  margin-bottom: 6px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-editor-wrap="1"],
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where(div, section):has(:is(textarea, [contenteditable="true"], [role="textbox"])):not(#rudex-studio-host *) {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  min-height: ${linePx}px !important;
  height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  box-shadow: none !important;
  box-sizing: border-box !important;
  max-height: min(40vh, 280px);
}
[data-rudex-theme-composer="1"] [data-rudex-comp-editor="1"],
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where(textarea, [contenteditable="true"], [role="textbox"]) {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  min-height: ${linePx}px !important;
  max-height: min(40vh, 280px);
  padding: 0 36px 0 0 !important;
  margin: 0 !important;
  border: none !important;
  box-sizing: border-box !important;
  line-height: ${linePx}px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-editor="1"]:not(textarea),
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where([contenteditable="true"], [role="textbox"]):not(textarea) {
  height: auto !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where([contenteditable="true"], [role="textbox"]) > :where(p, div) {
  margin: 0 !important;
  padding: 0 !important;
  min-height: ${linePx}px !important;
  line-height: ${linePx}px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where([contenteditable="true"], [role="textbox"], [contenteditable="true"] > p, [role="textbox"] > p)::before {
  top: 0 !important;
  left: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  line-height: ${linePx}px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder="wrap"],
[data-rudex-theme-composer="1"] [data-rudex-comp-editor-wrap="1"] > :where(div, span, p):where(.pointer-events-none, [class*="pointer-events-none"], [class*="placeholder"], .absolute, [style*="pointer-events: none"]):not(.sr-only):not([class~="sr-only"]):not([hidden]):not(.hidden):not([contenteditable="true"]):not([role="textbox"]):not(:has(button, [role="button"], img, video, svg, canvas)) {
  position: absolute !important;
  inset: 0 36px auto 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 36px !important;
  bottom: auto !important;
  transform: none !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  height: ${linePx}px !important;
  min-height: ${linePx}px !important;
  display: flex !important;
  align-items: center !important;
  line-height: ${linePx}px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  pointer-events: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder="row"] {
  position: absolute !important;
  inset: ${padY}px 48px auto 14px !important;
  top: ${padY}px !important;
  left: 14px !important;
  right: 48px !important;
  bottom: auto !important;
  transform: none !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  height: ${linePx}px !important;
  min-height: ${linePx}px !important;
  display: flex !important;
  align-items: center !important;
  line-height: ${linePx}px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  pointer-events: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder-inner="1"] {
  position: static !important;
  padding: 0 !important;
  margin: 0 !important;
  transform: none !important;
  line-height: ${linePx}px !important;
}
[data-rudex-theme-composer="1"]:focus-within [data-rudex-comp-input-row="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  border-color: color-mix(in srgb, ${fgCol} 32%, ${cBrd}) !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  position: static !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transform: none !important;
  filter: none !important;
  contain: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 4px !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  ${hasWallpaper ? `padding: 3px 8px !important;
  margin: 5px 0 0 0 !important;
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  background-color: ${stripBg} !important;
  background-image: none !important;
  border: 1px solid ${stripBrd} !important;
  border-radius: ${Math.min(cRad, 11)}px !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, ${isLight ? "0.08" : "0.20"}) !important;` : `padding: 4px 2px 0 !important;
  margin: 0 !important;
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;`}
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] > :not(#rudex-studio-host *) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-group="1"] {
  display: contents !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] :where([data-rudex-comp-plus="1"], [data-rudex-comp-mic="1"], [data-rudex-comp-voice="1"]):not([hidden]):not(.hidden):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg):not([data-rudex-comp-mic-active="1"]),
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] :where([data-rudex-comp-plus="1"], [data-rudex-comp-mic="1"], [data-rudex-comp-voice="1"]):not([data-rudex-comp-mic-active="1"]) :where(button, [role="button"]):not([data-rudex-comp-mic-active="1"]):not([hidden]):not(.hidden):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  position: relative !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  color: ${toolbarIconCol} !important;
  border-radius: 7px !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  padding: 0 !important;
  margin: 0 !important;
  flex-shrink: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] :where([data-rudex-comp-plus="1"], [data-rudex-comp-mic="1"]:not([data-rudex-comp-mic-active="1"]), [data-rudex-comp-voice="1"]:not([data-rudex-comp-mic-active="1"])):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) :where(svg, span, path, rect, circle, g) {
  color: ${toolbarIconCol} !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] [data-rudex-comp-voice="1"]:not([data-rudex-comp-mic-active="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) svg:not([fill="none"]):not([class*="fill-none"]),
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] [data-rudex-comp-voice="1"]:not([data-rudex-comp-mic-active="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) svg:not([fill="none"]):not([class*="fill-none"]) :where(path, rect, circle, polygon):not([fill="none"]) {
  fill: currentColor !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] [data-rudex-comp-voice="1"]:not([data-rudex-comp-mic-active="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) svg[fill="none"],
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] [data-rudex-comp-voice="1"]:not([data-rudex-comp-mic-active="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) svg[fill="none"] :where(path, rect, circle, line, polyline, polygon):not([stroke="none"]) {
  stroke: currentColor !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] [data-rudex-comp-voice="1"]:not([data-rudex-comp-mic-active="1"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) :where(div, span),
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] ${ccVoiceAuto} :where(div, span) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] ${ccVoiceAuto} {
  position: relative !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  color: ${toolbarIconCol} !important;
  border-radius: 7px !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  padding: 0 !important;
  margin: 0 !important;
  flex-shrink: 0 !important;
  order: -8 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] ${ccVoiceAuto} :where(svg, span, path, rect, circle, g) {
  color: ${toolbarIconCol} !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] ${ccVoiceAuto} svg:not([fill="none"]):not([class*="fill-none"]) :where(path, rect, circle, polygon):not([fill="none"]) {
  fill: currentColor !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] [data-rudex-comp-mic-active="1"]:not([hidden]):not(.hidden):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  position: relative !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: auto !important;
  height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  flex-shrink: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] :where(button, [role="button"])[data-rudex-comp-mic-active="1"]:not([hidden]):not(.hidden):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) {
  gap: 5px !important;
  width: auto !important;
  min-width: 28px !important;
  height: 28px !important;
  min-height: 28px !important;
  padding: 0 7px !important;
  border-radius: 999px !important;
  background-color: color-mix(in srgb, #ef4444 16%, transparent) !important;
  border: 1px solid color-mix(in srgb, #ef4444 48%, transparent) !important;
  color: ${isLight ? "#dc2626" : "#f87171"} !important;
  cursor: pointer !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] :where(button, [role="button"])[data-rudex-comp-mic-active="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg) :where(svg, span) {
  color: ${isLight ? "#dc2626" : "#f87171"} !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] :where([data-rudex-comp-plus="1"], [data-rudex-comp-mic="1"]:not([data-rudex-comp-mic-active="1"]), [data-rudex-comp-voice="1"]:not([data-rudex-comp-mic-active="1"])):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg):hover {
  background-color: ${hoverBg} !important;
  color: ${fgCol} !important;
  cursor: pointer !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] :where([data-rudex-comp-plus="1"], [data-rudex-comp-mic="1"]:not([data-rudex-comp-mic-active="1"]), [data-rudex-comp-voice="1"]:not([data-rudex-comp-mic-active="1"])):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg):hover :where(button, [role="button"], svg, span, path, rect, circle, g) {
  color: ${fgCol} !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-plus="1"] {
  order: -10 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-mic="1"] {
  order: -9 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-voice="1"] {
  order: -8 !important;
}
[data-rudex-theme-composer="1"] [data-testid="model-selector-trigger"],
[data-rudex-theme-composer="1"] [data-rudex-comp-model="1"] {
  order: 20 !important;
  margin-left: auto !important;
  height: 28px !important;
  min-height: 28px !important;
  display: inline-flex !important;
  align-items: center !important;
  box-sizing: border-box !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-mode="1"],
[data-rudex-theme-composer="1"] [data-rudex-comp-mode="1"] :where(button, [role="button"]) {
  order: 21 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: ${fgCol} !important;
  font-weight: 600 !important;
  font-size: 12.5px !important;
  height: 28px !important;
  min-height: 28px !important;
  display: inline-flex !important;
  align-items: center !important;
  box-sizing: border-box !important;
  border-radius: 7px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-mode="1"] :where(button, [role="button"]),
[data-rudex-theme-composer="1"] button[data-rudex-comp-mode="1"] {
  padding: 0 7px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-mode="1"]:hover {
  background-color: ${hoverBg} !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not(#rudex-studio-host):not(#rudex-studio-host *),
[data-rudex-theme-composer="1"] ${ccSendAuto} {
  position: absolute !important;
  right: 10px !important;
  top: var(--rudex-cc-send-top, ${sendFallbackTop}px) !important;
  z-index: 5 !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 8px !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  color: ${mutedCol} !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: background-color 0.12s ease, color 0.12s ease;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not(#rudex-studio-host):not(#rudex-studio-host *):hover,
[data-rudex-theme-composer="1"] ${ccSendAuto}:hover {
  background-color: ${hoverBg} !important;
  color: ${fgCol} !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not([data-testid="input-cancel-button"]):not([data-testid="cancel-invocation-button"]):not(#rudex-studio-host):not(#rudex-studio-host *),
[data-rudex-theme-composer="1"] ${ccSendAuto}:not([data-testid="input-cancel-button"]):not([data-testid="cancel-invocation-button"]) {
  font-size: 0 !important;
  line-height: 0 !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not([data-testid="input-cancel-button"]):not([data-testid="cancel-invocation-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) > *,
[data-rudex-theme-composer="1"] ${ccSendAuto}:not([data-testid="input-cancel-button"]):not([data-testid="cancel-invocation-button"]) > * {
  display: none !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not([data-testid="input-cancel-button"]):not([data-testid="cancel-invocation-button"]):not(#rudex-studio-host):not(#rudex-studio-host *)::after,
[data-rudex-theme-composer="1"] ${ccSendAuto}:not([data-testid="input-cancel-button"]):not([data-testid="cancel-invocation-button"])::after {
  content: "";
  display: block;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  -webkit-mask: ${ccSendIconMask} center / contain no-repeat;
  mask: ${ccSendIconMask} center / contain no-repeat;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:where([data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: color-mix(in srgb, ${composerAccent} 16%, transparent) !important;
  color: ${composerAccent} !important;
  border: 1px solid color-mix(in srgb, ${composerAccent} 45%, transparent) !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:where([data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) :where(svg, span) {
  color: ${composerAccent} !important;
}`.trim());
  } else if (us.composer === "codex") {
    // OpenAI Codex Desktop 2026: elevated 22px command card with separated footer bar & crisp monochrome send circle
    const cRad = us.composerRadius > 0 ? us.composerRadius : 22;
    const padY = us.composerPadY >= 6 ? us.composerPadY : 13;
    const cBg = hasThemeOverride ? vars.cardBg : (isLight ? "#ffffff" : "#18181b");
    const cBrd = hasThemeOverride ? strongBrd : (isLight ? "rgba(24, 24, 27, 0.17)" : "rgba(255, 255, 255, 0.15)");
    const footerBg = isLight ? "rgba(15, 23, 42, 0.028)" : "rgba(255, 255, 255, 0.028)";
    const codexSendBg = isLight ? "#18181b" : "#f4f4f5";
    const codexSendFg = isLight ? "#ffffff" : "#09090b";
    const effShadow = resolveShadowCss(us.composerShadow, "elevated");

    compDecls.push(
      `border-radius: ${cRad}px !important;`,
      `border: 1.5px solid ${cBrd} !important;`,
      `padding: 0 !important;`,
      `overflow: visible !important;`,
      `box-shadow: ${effShadow || "none"} !important;`,
      `transition: border-color 0.15s ease, box-shadow 0.15s ease;`
    );
    if (!hasWallpaper) compDecls.push(`background-color: ${cBg} !important;`);
    if (us.composerMaxWidth >= 560) {
      compDecls.push(`max-width: min(100%, ${us.composerMaxWidth}px) !important;`, `width: 100%;`, `margin-inline: auto !important;`);
    }
    compFocusDecls.push(`border-color: color-mix(in srgb, ${fgCol} 36%, ${cBrd}) !important;`);

    compBlocks.push(`
[data-rudex-theme-composer="1"] [data-rudex-comp-stack="1"] {
  gap: 0 !important;
  padding: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-top-row="1"] {
  padding: 9px 16px 6px !important;
  border-bottom: 1px solid ${hairline} !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] {
  position: relative !important;
  padding: ${padY}px 18px ${Math.max(8, padY - 2)}px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  gap: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-empty-slot="1"] {
  display: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-attach-row="1"] {
  margin-bottom: 6px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-editor-wrap="1"],
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where(div, section):has(:is(textarea, [contenteditable="true"], [role="textbox"])):not(#rudex-studio-host *) {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  min-height: 0 !important;
  height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-editor="1"],
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where(textarea, [contenteditable="true"], [role="textbox"]) {
  flex: 1 1 auto !important;
  width: 100% !important;
  min-width: 0 !important;
  min-height: 22px !important;
  padding: 0 !important;
  margin: 0 !important;
  line-height: 1.5 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where([contenteditable="true"], [role="textbox"]) > :where(p, div) {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.5 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder="wrap"],
[data-rudex-theme-composer="1"] [data-rudex-comp-editor-wrap="1"] > :where(div, span, p):where(.pointer-events-none, [class*="pointer-events-none"], [class*="placeholder"], .absolute, [style*="pointer-events: none"]):not(.sr-only):not([class~="sr-only"]):not([hidden]):not(.hidden):not([contenteditable="true"]):not([role="textbox"]):not(:has(button, [role="button"], img, video, svg, canvas)) {
  position: absolute !important;
  inset: 0 0 auto 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: auto !important;
  transform: none !important;
  padding: 0 !important;
  margin: 0 !important;
  min-height: 22px !important;
  display: flex !important;
  align-items: center !important;
  line-height: 1.5 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  pointer-events: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder="row"] {
  position: absolute !important;
  inset: ${padY}px 18px auto 18px !important;
  top: ${padY}px !important;
  left: 18px !important;
  right: 18px !important;
  bottom: auto !important;
  transform: none !important;
  padding: 0 !important;
  margin: 0 !important;
  min-height: 22px !important;
  display: flex !important;
  align-items: center !important;
  line-height: 1.5 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  pointer-events: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder-inner="1"] {
  position: static !important;
  padding: 0 !important;
  margin: 0 !important;
  transform: none !important;
  line-height: 1.5 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] {
  padding: 8px 14px !important;
  border-top: 1px solid ${hairline} !important;
  background-color: ${footerBg} !important;
  border-radius: 0 0 ${Math.max(0, cRad - 2)}px ${Math.max(0, cRad - 2)}px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-mode="1"] {
  border-radius: 999px !important;
  border: 1px solid ${hairline} !important;
  background-color: ${surfaceSoft} !important;
  padding: 3px 10px !important;
  font-size: 12px !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not([data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *),
[data-rudex-theme-composer="1"] button:where([type="submit"], [data-testid*="send"], [aria-label*="Send" i], [aria-label*="Отправ" i], [class~="bg-primary"]):not([data-rudex-comp-voice="1"]):not([data-rudex-comp-voice="1"] *):not([data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  border-radius: 999px !important;
  background-color: ${codexSendBg} !important;
  color: ${codexSendFg} !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not([data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) :where(svg, span),
[data-rudex-theme-composer="1"] button:where([type="submit"], [data-testid*="send"], [aria-label*="Send" i], [aria-label*="Отправ" i], [class~="bg-primary"]):not([data-rudex-comp-voice="1"]):not([data-rudex-comp-voice="1"] *):not([data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) :where(svg, span) {
  color: ${codexSendFg} !important;
}`.trim());
  } else if (us.composer === "opencode") {
    // OpenCode SST Desktop / TUI 2026: sharp 6px frame, 3px left accent rail, terminal chevron (❯), mono status bar & square key send
    const cRad = us.composerRadius > 0 ? us.composerRadius : 6;
    const padY = us.composerPadY >= 6 ? us.composerPadY : 10;
    const cBg = hasThemeOverride ? vars.cardBg : (isLight ? "#f4f5f7" : "#141518");
    const cBrd = hasThemeOverride ? vars.borderColor : (isLight ? "rgba(15, 23, 42, 0.18)" : "rgba(255, 255, 255, 0.14)");
    const barBg = isLight ? "rgba(15, 23, 42, 0.035)" : "rgba(0, 0, 0, 0.22)";
    const effShadow = resolveShadowCss(us.composerShadow, "none");

    compDecls.push(
      `border-radius: ${cRad}px !important;`,
      `border: 1px solid ${cBrd} !important;`,
      `border-left: 3px solid ${composerAccent} !important;`,
      `padding: 0 !important;`,
      `overflow: visible !important;`,
      `box-shadow: ${effShadow || "none"} !important;`,
      `transition: border-color 0.12s ease;`
    );
    if (!hasWallpaper) compDecls.push(`background-color: ${cBg} !important;`);
    if (us.composerMaxWidth >= 560) {
      compDecls.push(`max-width: min(100%, ${us.composerMaxWidth}px) !important;`, `width: 100%;`, `margin-inline: auto !important;`);
    }
    compFocusDecls.push(`border-color: color-mix(in srgb, ${composerAccent} 55%, ${cBrd}) !important;`, `border-left-color: ${composerAccent} !important;`);

    compBlocks.push(`
[data-rudex-theme-composer="1"] [data-rudex-comp-stack="1"] {
  gap: 0 !important;
  padding: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-top-row="1"] {
  padding: 7px 12px 5px !important;
  border-bottom: 1px solid ${hairline} !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] {
  position: relative !important;
  min-height: 42px !important;
  padding: ${padY}px 13px ${padY}px 28px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"]:not(textarea):not([contenteditable="true"]):not([role="textbox"]) {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  gap: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-empty-slot="1"] {
  display: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-attach-row="1"] {
  margin-bottom: 6px !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-editor-wrap="1"],
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where(div, section):has(:is(textarea, [contenteditable="true"], [role="textbox"])):not(#rudex-studio-host *) {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  min-height: 0 !important;
  height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-editor="1"],
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where(textarea, [contenteditable="true"], [role="textbox"]) {
  flex: 1 1 auto !important;
  width: 100% !important;
  min-width: 0 !important;
  min-height: 22px !important;
  padding: 0 !important;
  margin: 0 !important;
  line-height: 1.5 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] :where([contenteditable="true"], [role="textbox"]) > :where(p, div) {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.5 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder="wrap"],
[data-rudex-theme-composer="1"] [data-rudex-comp-editor-wrap="1"] > :where(div, span, p):where(.pointer-events-none, [class*="pointer-events-none"], [class*="placeholder"], .absolute, [style*="pointer-events: none"]):not(.sr-only):not([class~="sr-only"]):not([hidden]):not(.hidden):not([contenteditable="true"]):not([role="textbox"]):not(:has(button, [role="button"], img, video, svg, canvas)) {
  position: absolute !important;
  inset: 0 0 auto 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: auto !important;
  transform: none !important;
  padding: 0 !important;
  margin: 0 !important;
  min-height: 22px !important;
  display: flex !important;
  align-items: center !important;
  line-height: 1.5 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  pointer-events: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder="row"] {
  position: absolute !important;
  inset: ${padY}px 13px auto 28px !important;
  top: ${padY}px !important;
  left: 28px !important;
  right: 13px !important;
  bottom: auto !important;
  transform: none !important;
  padding: 0 !important;
  margin: 0 !important;
  min-height: 22px !important;
  display: flex !important;
  align-items: center !important;
  line-height: 1.5 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  pointer-events: none !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"] [data-rudex-comp-placeholder-inner="1"] {
  position: static !important;
  padding: 0 !important;
  margin: 0 !important;
  transform: none !important;
  line-height: 1.5 !important;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"]:not(textarea):not([contenteditable="true"]):not([role="textbox"])::before {
  content: "❯";
  position: absolute;
  left: 11px;
  top: ${padY}px;
  height: 22px;
  display: flex;
  align-items: center;
  color: ${composerAccent};
  font-family: var(--font-mono, "JetBrains Mono", Consolas, monospace);
  font-weight: 700;
  font-size: 13px;
  line-height: 1.5;
  pointer-events: none;
  user-select: none;
}
[data-rudex-theme-composer="1"] [data-rudex-comp-toolbar="1"] {
  padding: 6px 11px !important;
  border-top: 1px solid ${hairline} !important;
  background-color: ${barBg} !important;
  border-radius: 0 0 ${Math.max(0, cRad - 1)}px ${Math.max(0, cRad - 1)}px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  font-family: var(--font-mono, "JetBrains Mono", Consolas, monospace) !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"]):not([data-testid="model-selector-trigger"]):not([data-rudex-comp-send="1"]):not([role="switch"]):not([role="radio"]):not([class*="rounded-full"]) {
  border-radius: 5px !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not([data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *),
[data-rudex-theme-composer="1"] button:where([type="submit"], [data-testid*="send"], [aria-label*="Send" i], [aria-label*="Отправ" i], [class~="bg-primary"]):not([data-rudex-comp-voice="1"]):not([data-rudex-comp-voice="1"] *):not([data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  border-radius: 5px !important;
  background-color: ${composerAccent} !important;
  color: ${compAccentFg} !important;
  border: 1px solid color-mix(in srgb, ${composerAccent} 78%, transparent) !important;
}
[data-rudex-theme-composer="1"] :where(button, [role="button"])[data-rudex-comp-send="1"]:not([data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) :where(svg, span),
[data-rudex-theme-composer="1"] button:where([type="submit"], [data-testid*="send"], [aria-label*="Send" i], [aria-label*="Отправ" i], [class~="bg-primary"]):not([data-rudex-comp-voice="1"]):not([data-rudex-comp-voice="1"] *):not([data-testid="input-cancel-button"]):not(#rudex-studio-host):not(#rudex-studio-host *) :where(svg, span) {
  color: ${compAccentFg} !important;
}`.trim());
  } else {
    // Antigravity base + optional granular overrides
    if (us.composerRadius > 0) compDecls.push(`border-radius: ${us.composerRadius}px !important;`);
    if (us.composerPadY > 0) {
      compDecls.push(`padding-top: ${us.composerPadY}px !important;`, `padding-bottom: ${us.composerPadY}px !important;`);
    }
    if (us.composerMaxWidth >= 560) {
      compDecls.push(`max-width: min(100%, ${us.composerMaxWidth}px) !important;`, `width: 100%;`, `margin-inline: auto !important;`);
    }
    const baseShadow = resolveShadowCss(us.composerShadow, "");
    if (baseShadow) compDecls.push(`box-shadow: ${baseShadow} !important;`);
  }

  if (us.composer !== "antigravity" && !hasThemeOverride && !hasWallpaper) {
    // Strip Antigravity's native inner card frame on default native theme when a custom platform composer is active
    rules.push(`
[data-rudex-theme-composer="1"] :where(textarea, [contenteditable="true"], [role="textbox"]),
[data-rudex-theme-composer="1"] :where(div, section):has(:is(textarea, [contenteditable="true"], [role="textbox"])):not([data-rudex-comp-input-row="1"]) {
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  border-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  --tw-ring-color: transparent !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
}`.trim());
  }

  if (compDecls.length > 0) {
    rules.push(`${compSel} {\n  ${compDecls.join("\n  ")}\n}`);
  }
  if (compFocusDecls.length > 0) {
    rules.push(`[data-rudex-theme-composer="1"]:focus-within {\n  ${compFocusDecls.join("\n  ")}\n}`);
  }
  for (let bi = 0; bi < compBlocks.length; bi += 1) {
    rules.push(compBlocks[bi]);
  }

  // === 2. CHAT (User Messages, Agent Responses, Steps & Code) ===
  const userBubbleSel = `[data-testid="user-message-bubble"],\n[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *)`;
  const bubbleDecls = [];
  const bubbleWrapDecls = [];
  const agentDecls = [];
  let chatExtraCss = "";

  const effAlign = us.userBubbleAlign !== "preset"
    ? us.userBubbleAlign
    : (us.chat === "opencode" ? "full" : (us.chat === "claude-code" || us.chat === "codex" ? "right" : "preset"));

  if (us.chat === "claude-code") {
    const bBg = hasThemeOverride ? surfaceSoft : (isLight ? "#ebe8de" : "#2f2e2b");
    const bBrd = hasThemeOverride ? hairline : (isLight ? "rgba(31, 30, 29, 0.10)" : "rgba(250, 249, 245, 0.10)");
    bubbleDecls.push(
      `border-radius: 14px !important;`,
      `padding: 9px 14px !important;`,
      `border: 1px solid ${bBrd} !important;`,
      `box-shadow: none !important;`
    );
    if (!hasWallpaper) bubbleDecls.push(`background-color: ${bBg} !important;`);
    if (us.userBubbleMaxWidth <= 0) bubbleDecls.push(`max-width: min(100%, max(74%, 180px), 640px) !important;`, `width: fit-content !important;`);
    agentDecls.push(`line-height: 1.62;`, `letter-spacing: -0.005em;`);
    chatExtraCss = `
main :where([data-testid*="thought"], [data-testid*="thinking"], [data-rudex-zone="thinking"]):not(#rudex-studio-host *) {
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
  color: ${mutedCol} !important;
  padding-left: 0 !important;
}
:where([data-testid="agent-response"], [data-markdown-root]) pre:not(#rudex-studio-host *) {
  border-radius: 10px !important;
  border: 1px solid ${hairline} !important;
}
:where([data-testid="agent-response"], [data-markdown-root]) code:not(pre code) {
  border-radius: 5px !important;
}`;
  } else if (us.chat === "codex") {
    const bBg = hasThemeOverride ? surfaceSoft : (isLight ? "#f4f4f5" : "#222226");
    const bBrd = hasThemeOverride ? strongBrd : (isLight ? "rgba(24, 24, 27, 0.14)" : "rgba(255, 255, 255, 0.13)");
    bubbleDecls.push(
      `border-radius: 18px !important;`,
      `padding: 10px 16px !important;`,
      `border: 1px solid ${bBrd} !important;`,
      isLight ? `box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05) !important;` : `box-shadow: 0 3px 12px rgba(0, 0, 0, 0.24) !important;`
    );
    if (!hasWallpaper) bubbleDecls.push(`background-color: ${bBg} !important;`);
    if (us.userBubbleMaxWidth <= 0) bubbleDecls.push(`max-width: min(100%, max(80%, 180px), 700px) !important;`, `width: fit-content !important;`);
    agentDecls.push(`line-height: 1.56;`);
    chatExtraCss = `
main :where([data-testid*="thought"], [data-testid*="thinking"], [data-testid*="step-group"], [data-testid*="tool-call"], [data-rudex-zone="steps"], [data-rudex-zone="thinking"]):not(#rudex-studio-host *) {
  border: 1px solid ${hairline} !important;
  box-shadow: none !important;
  border-radius: 12px !important;
  background-color: ${isLight ? "rgba(24, 24, 27, 0.028)" : "rgba(255, 255, 255, 0.03)"} !important;
}
:where([data-testid="agent-response"], [data-markdown-root]) pre:not(#rudex-studio-host *) {
  border-radius: 12px !important;
  border: 1px solid ${strongBrd} !important;
}`;
  } else if (us.chat === "opencode") {
    const bBg = hasThemeOverride
      ? `color-mix(in srgb, ${chatAccent} ${isLight ? "8%" : "10%"}, ${vars.cardBg})`
      : (isLight ? "#eef1f4" : "#181a1f");
    const bBrd = hasThemeOverride ? hairline : (isLight ? "rgba(15, 23, 42, 0.14)" : "rgba(255, 255, 255, 0.11)");
    bubbleDecls.push(
      `border-radius: 6px !important;`,
      `padding: 9px 14px !important;`,
      `border: 1px solid ${bBrd} !important;`,
      `border-left: 3px solid ${chatAccent} !important;`,
      `box-shadow: none !important;`
    );
    if (!hasWallpaper) bubbleDecls.push(`background-color: ${bBg} !important;`);
    agentDecls.push(`line-height: 1.54;`);
    chatExtraCss = `
main :where([data-testid*="thought"], [data-testid*="thinking"], [data-testid*="step-group"], [data-testid*="tool-call"], [data-rudex-zone="steps"], [data-rudex-zone="thinking"]):not(#rudex-studio-host *) {
  border-radius: 6px !important;
  border: 1px solid ${hairline} !important;
  border-left: 2px solid color-mix(in srgb, ${chatAccent} 62%, transparent) !important;
  box-shadow: none !important;
  background-color: ${isLight ? "rgba(15, 23, 42, 0.026)" : "rgba(255, 255, 255, 0.025)"} !important;
}
:where([data-testid="agent-response"], [data-markdown-root]) pre:not(#rudex-studio-host *) {
  border-radius: 6px !important;
  border: 1px solid ${strongBrd} !important;
}
:where([data-testid="agent-response"], [data-markdown-root]) code:not(pre code) {
  border-radius: 4px !important;
}`;
  }

  if (effAlign === "right") {
    bubbleDecls.push(`margin-left: auto !important;`, `margin-right: 0 !important;`, `box-sizing: border-box !important;`);
    bubbleWrapDecls.push(`align-items: flex-end !important;`, `justify-content: flex-end !important;`, `width: 100% !important;`);
  } else if (effAlign === "left") {
    bubbleDecls.push(`margin-left: 0 !important;`, `margin-right: auto !important;`, `box-sizing: border-box !important;`);
    bubbleWrapDecls.push(`align-items: flex-start !important;`, `justify-content: flex-start !important;`, `width: 100% !important;`);
  } else if (effAlign === "full") {
    bubbleDecls.push(`width: 100% !important;`, `max-width: 100% !important;`, `margin-left: 0 !important;`, `margin-right: 0 !important;`);
    bubbleWrapDecls.push(`align-items: stretch !important;`, `justify-content: flex-start !important;`, `width: 100% !important;`);
  }

  if (us.userBubbleMaxWidth >= 45 && effAlign !== "full") {
    bubbleDecls.push(`max-width: min(100%, max(${us.userBubbleMaxWidth}%, 180px)) !important;`, `width: fit-content !important;`);
  }
  if (us.chatGap >= 4) {
    bubbleDecls.push(`margin-bottom: ${us.chatGap}px !important;`);
    agentDecls.push(`margin-bottom: ${us.chatGap}px !important;`);
  }

  const showAgentBar = us.agentAccentBar === "on" || (us.agentAccentBar === "preset" && us.chat === "opencode");
  if (showAgentBar) {
    agentDecls.push(
      `border-left: 2px solid color-mix(in srgb, ${chatAccent} 42%, transparent) !important;`,
      `padding-left: 14px !important;`
    );
  } else if (us.agentAccentBar === "off") {
    agentDecls.push(`border-left: none !important;`);
  }

  if (bubbleWrapDecls.length > 0) {
    rules.push(`:where(div, section, article):has(> [data-testid="user-message-bubble"]):not(:has([data-testid="agent-response"])):not(#rudex-studio-host *) {\n  ${bubbleWrapDecls.join("\n  ")}\n}`);
  }
  if (bubbleDecls.length > 0) {
    rules.push(`${userBubbleSel} {\n  ${bubbleDecls.join("\n  ")}\n}`);
    rules.push(`[data-testid="user-message-bubble"] [data-testid="user-message-content"] {\n  background: transparent !important;\n  border: none !important;\n  padding: 0 !important;\n  margin: 0 !important;\n  box-shadow: none !important;\n  max-width: 100% !important;\n  word-break: normal !important;\n  overflow-wrap: break-word !important;\n}`);
  }
  if (agentDecls.length > 0) {
    rules.push(`[data-testid="agent-response"] {\n  ${agentDecls.join("\n  ")}\n}`);
  }
  if (chatExtraCss) rules.push(chatExtraCss.trim());

  // === 3. MODEL SELECTOR (Trigger Button & Dropdown Menu) ===
  const effModelBtn = us.modelBtnStyle !== "preset"
    ? us.modelBtnStyle
    : (us.modelSelector === "claude-code" ? "ghost" : (us.modelSelector === "codex" ? "pill" : (us.modelSelector === "opencode" ? "mono" : "none")));

  if (effModelBtn === "ghost") {
    rules.push(`
[data-testid="model-selector-trigger"] {
  background-color: transparent !important;
  border: 1px solid transparent !important;
  border-radius: 8px !important;
  padding: 3px 8px !important;
  font-weight: 550 !important;
  letter-spacing: -0.01em !important;
  box-shadow: none !important;
  transition: background-color 0.12s ease, color 0.12s ease;
}
[data-testid="model-selector-trigger"]:hover {
  background-color: ${hoverBg} !important;
}`.trim());
  } else if (effModelBtn === "pill") {
    rules.push(`
[data-testid="model-selector-trigger"] {
  background-color: ${surfaceSoft} !important;
  border: 1px solid ${strongBrd} !important;
  border-radius: 999px !important;
  padding: 4px 11px !important;
  font-weight: 550 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, ${isLight ? "0.04" : "0.18"}) !important;
  transition: background-color 0.12s ease, border-color 0.12s ease;
}
[data-testid="model-selector-trigger"]:hover {
  border-color: color-mix(in srgb, ${modelAccent} 50%, ${strongBrd}) !important;
  background-color: ${pillHoverBg} !important;
}`.trim());
  } else if (effModelBtn === "bordered") {
    rules.push(`
[data-testid="model-selector-trigger"] {
  background-color: ${surfaceSoft} !important;
  border: 1px solid ${strongBrd} !important;
  border-radius: 8px !important;
  padding: 3px 9px !important;
  font-weight: 550 !important;
}
[data-testid="model-selector-trigger"]:hover {
  border-color: color-mix(in srgb, ${modelAccent} 52%, ${strongBrd}) !important;
}`.trim());
  } else if (effModelBtn === "mono") {
    rules.push(`
[data-testid="model-selector-trigger"],
[data-testid="model-selector-trigger"] * {
  font-family: var(--font-mono, "JetBrains Mono", "Cascadia Code", Consolas, monospace) !important;
}
[data-testid="model-selector-trigger"] {
  background-color: ${isLight ? "rgba(15, 23, 42, 0.045)" : "rgba(255, 255, 255, 0.045)"} !important;
  border: 1px solid ${strongBrd} !important;
  border-left: 2.5px solid ${modelAccent} !important;
  border-radius: 6px !important;
  padding: 3px 9px !important;
  font-size: 11.5px !important;
  font-weight: 550 !important;
  letter-spacing: -0.01em !important;
}
[data-testid="model-selector-trigger"]:hover {
  border-color: color-mix(in srgb, ${modelAccent} 58%, ${strongBrd}) !important;
  background-color: ${hoverBg} !important;
}`.trim());
  }

  const menuSel = `:where([role="menu"], [role="listbox"], [data-radix-menu-content], [data-slot="dropdown-menu-content"], [data-slot="select-content"]):not(#rudex-studio-host):not(#rudex-studio-host *)`;
  const menuItemSel = `:where([role="menu"], [role="listbox"], [data-radix-menu-content], [data-slot="dropdown-menu-content"], [data-slot="select-content"]):not(#rudex-studio-host):not(#rudex-studio-host *) :where([role="menuitem"], [role="option"])`;

  if (us.modelSelector === "claude-code") {
    rules.push(`
${menuSel} {
  border-radius: 12px !important;
  border: 1px solid ${hairline} !important;
  padding: 6px !important;
  box-shadow: ${isLight ? "0 12px 32px rgba(31, 30, 29, 0.12)" : "0 16px 40px rgba(0, 0, 0, 0.45)"} !important;
}
${menuItemSel} {
  border-radius: 8px !important;
  padding: 7px 10px !important;
  transition: background-color 0.1s ease;
}
${menuItemSel}:where([data-highlighted], [aria-selected="true"], [data-state="checked"]) {
  background-color: color-mix(in srgb, ${modelAccent} ${isLight ? "12%" : "17%"}, transparent) !important;
}`.trim());
  } else if (us.modelSelector === "codex") {
    rules.push(`
${menuSel} {
  border-radius: 14px !important;
  border: 1px solid ${strongBrd} !important;
  padding: 6px !important;
  box-shadow: ${isLight ? "0 14px 36px rgba(15, 23, 42, 0.14)" : "0 18px 44px rgba(0, 0, 0, 0.56)"} !important;
}
${menuItemSel} {
  border-radius: 9px !important;
  padding: 7px 11px !important;
  font-weight: 500;
}
${menuItemSel}:where([data-highlighted], [aria-selected="true"], [data-state="checked"]) {
  background-color: ${hoverBg} !important;
  box-shadow: inset 2px 0 0 ${modelAccent};
}`.trim());
  } else if (us.modelSelector === "opencode") {
    rules.push(`
${menuSel} {
  border-radius: 6px !important;
  border: 1px solid ${strongBrd} !important;
  padding: 4px !important;
  box-shadow: ${isLight ? "0 10px 24px rgba(15, 23, 42, 0.12)" : "0 14px 32px rgba(0, 0, 0, 0.52)"} !important;
}
${menuItemSel} {
  border-radius: 4px !important;
  padding: 5px 8px !important;
  font-family: var(--font-mono, "JetBrains Mono", Consolas, monospace) !important;
  font-size: 12px !important;
}
${menuItemSel}:where([data-highlighted], [aria-selected="true"], [data-state="checked"]) {
  background-color: color-mix(in srgb, ${modelAccent} ${isLight ? "14%" : "18%"}, transparent) !important;
  box-shadow: inset 2px 0 0 ${modelAccent};
}`.trim());
  }

  if (us.modelMenuDensity === "compact") {
    rules.push(`${menuItemSel} {\n  padding-top: 4px !important;\n  padding-bottom: 4px !important;\n  min-height: 26px !important;\n}`);
  } else if (us.modelMenuDensity === "comfortable") {
    rules.push(`${menuItemSel} {\n  padding-top: 8px !important;\n  padding-bottom: 8px !important;\n  min-height: 36px !important;\n}`);
  }

  return rules.join("\n");
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
  const sanitizeSlotFont = (val, fallback, group) => {
    if (!val || val === "inherit") return fallback;
    if (val === "custom") return "custom";
    const found = teFindFontAny(group, val);
    return found ? found.id : fallback;
  };
  const uiFontId = sanitizeSlotFont(tySrc.uiFont, "system", "ui");
  const monoFontId = sanitizeSlotFont(tySrc.monoFont, "system", "mono");
  const inputFontId = sanitizeSlotFont(tySrc.inputFont, "inherit", "ui");
  const userMsgFontId = sanitizeSlotFont(tySrc.userMsgFont, "inherit", "ui");
  const agentFontId = sanitizeSlotFont(tySrc.agentFont, "inherit", "ui");
  const thinkingFontId = sanitizeSlotFont(tySrc.thinkingFont, "inherit", "ui");
  const rawChatW = teClamp(Math.round(Number(tySrc.chatMaxWidth) || 0), 0, 1200, 0);
  const chatMaxWidth = rawChatW > 0 && rawChatW < 680 ? 680 : rawChatW;
  const density =
    tySrc.density === "compact" || tySrc.density === "spacious" ? tySrc.density : "comfortable";

  const rawLineHeight = Number(tySrc.lineHeight);
  const lineHeight = Number.isFinite(rawLineHeight)
    ? Math.round(teClamp(rawLineHeight, 1.25, 1.9, 1.55) * 100) / 100
    : 1.55;
  const normSlotSize = (val, min, max) => {
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(teClamp(n, min, max, 0));
  };

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
    customSidebarBg: Boolean(src.customSidebarBg),
    sidebarBg: teValidHex(src.sidebarBg, DEFAULT_APPEARANCE.sidebarBg),
    customBorderColor: Boolean(src.customBorderColor),
    borderColor: teValidHex(src.borderColor, DEFAULT_APPEARANCE.borderColor),
    glassOpacity: Math.round(teClamp(src.glassOpacity, 15, 100, DEFAULT_APPEARANCE.glassOpacity)),
    sidebarOpacity: Math.round(teClamp(src.sidebarOpacity, 15, 100, DEFAULT_APPEARANCE.sidebarOpacity)),
    glassBlur: Math.round(teClamp(src.glassBlur, 0, 36, DEFAULT_APPEARANCE.glassBlur)),
    messageCardOpacity: Math.round(teClamp(src.messageCardOpacity, 0, 96, DEFAULT_APPEARANCE.messageCardOpacity)),
    messageStyle,
    borderPreset: src.borderPreset === "airy" || src.borderPreset === "contrast" ? src.borderPreset : "crisp",
    borderStrength: Math.round(teClamp(src.borderStrength, 0, 100, DEFAULT_APPEARANCE.borderStrength)),
    highContrastText: src.highContrastText !== false,
    overridesPaused: Boolean(src.overridesPaused),
    elementOverrides: teNormalizeElementOverrides(src.elementOverrides),
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
      inputFont: inputFontId,
      userMsgFont: userMsgFontId,
      agentFont: agentFontId,
      thinkingFont: thinkingFontId,
      uiFontCustom: teSanitizeCustomFontName(tySrc.uiFontCustom),
      inputFontCustom: teSanitizeCustomFontName(tySrc.inputFontCustom),
      userMsgFontCustom: teSanitizeCustomFontName(tySrc.userMsgFontCustom),
      agentFontCustom: teSanitizeCustomFontName(tySrc.agentFontCustom),
      thinkingFontCustom: teSanitizeCustomFontName(tySrc.thinkingFontCustom),
      monoFontCustom: teSanitizeCustomFontName(tySrc.monoFontCustom),
      fontSize: Math.round(teClamp(tySrc.fontSize, 12, 18, DEFAULT_APPEARANCE.typography.fontSize)),
      uiFontSize: normSlotSize(tySrc.uiFontSize, 11, 20),
      inputFontSize: normSlotSize(tySrc.inputFontSize, 12, 22),
      agentFontSize: normSlotSize(tySrc.agentFontSize, 12, 22),
      codeFontSize: normSlotSize(tySrc.codeFontSize, 11, 20),
      lineHeight,
      chatMaxWidth,
      density,
    },
    uiStyle: teNormalizeUiStyle(src.uiStyle),
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
    ty.inputFont !== "inherit" ||
    ty.userMsgFont !== "inherit" ||
    ty.agentFont !== "inherit" ||
    ty.thinkingFont !== "inherit" ||
    ty.fontSize !== 14 ||
    ty.uiFontSize !== 0 ||
    ty.inputFontSize !== 0 ||
    ty.agentFontSize !== 0 ||
    ty.codeFontSize !== 0 ||
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
    !cfg.customSidebarBg &&
    !cfg.customBorderColor &&
    cfg.uiPolish === true &&
    cfg.borderPreset === "crisp" &&
    cfg.borderStrength === 50 &&
    cfg.radius === 12 &&
    !teHasCustomCorners(cfg) &&
    cfg.messageStyle === "glass" &&
    cfg.wallpaper.type === "none" &&
    !teHasCustomTypography(cfg) &&
    !teHasCustomUiStyle(cfg) &&
    (!Array.isArray(cfg.elementOverrides) || cfg.elementOverrides.length === 0)
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
      sidebarBg: cfg.customSidebarBg ? cfg.sidebarBg : teMixHex(cfg.canvasBg, cfg.cardBg, 0.55),
      fgColor: light ? "#141418" : "#f1f2f6",
      mutedColor: light ? "#5c5c66" : "#9aa0b0",
      borderColor: cfg.customBorderColor
        ? cfg.borderColor
        : (light ? teMixHex(cfg.cardBg, "#000000", 0.12) : teMixHex(cfg.cardBg, "#ffffff", 0.12)),
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
    sidebarBg: cfg.customSidebarBg ? cfg.sidebarBg : preset.vars.sidebarBg,
    borderColor: cfg.customBorderColor ? cfg.borderColor : preset.vars.borderColor,
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
body :where(button[class*="rounded-full"]:not(#rudex-studio-host):not(#rudex-studio-host *):not([data-rudex-comp-send="1"]):not([role="switch"]):not([role="radio"]):not([class*="size-4"]):not([class*="size-5"]):not([class*="size-6"]):not([class*="w-4"]):not([class*="w-5"]):not([class*="w-6"]):not([data-rudex-ignore="1"])) {
  border-radius: ${c.buttons}px !important;
}`
    : "";

  const linkedFallbackCss = !isCustom
    ? `
:where([class*="rounded-"]):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg):not(#rudex-bg *):not([data-rudex-ignore="1"]):not(.rounded-none):not(.rounded-full):not([class*="rounded-full"]):not([role="switch"]):not([role="switch"] *):not([role="radio"]):not(input[type="radio"]):not(input[type="checkbox"]):not(svg):not(svg *):not(.katex):not(.mermaid) {
  border-radius: ${base}px !important;
}
:where([class*="rounded-sm"], [class*="rounded-xs"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class*="rounded-full"]):not([role="switch"]):not([role="radio"]):not(svg):not(svg *):not([data-rudex-ignore="1"]) {
  border-radius: ${sm}px !important;
}
:where([class*="rounded-md"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class*="rounded-full"]):not([role="switch"]):not([role="radio"]):not(svg):not(svg *):not([data-rudex-ignore="1"]) {
  border-radius: ${md}px !important;
}
:where([class*="rounded-lg"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class*="rounded-full"]):not([role="switch"]):not([role="radio"]):not(svg):not(svg *):not([data-rudex-ignore="1"]) {
  border-radius: ${lg}px !important;
}
:where([class*="rounded-xl"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class*="rounded-full"]):not([role="switch"]):not([role="radio"]):not(svg):not(svg *):not([data-rudex-ignore="1"]) {
  border-radius: ${xl}px !important;
}
:where([class*="rounded-2xl"], [class*="rounded-3xl"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class*="rounded-full"]):not([role="switch"]):not([role="radio"]):not(svg):not(svg *):not([data-rudex-ignore="1"]) {
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
:where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, [role="combobox"], [data-slot="input"], [data-slot="badge"], [class*="badge"], [class*="chip"], [class*="pill"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]) {
  border-radius: ${c.inputs}px !important;
}
`.trim();
}

function buildThemeCss(rawAppearance, options) {
  const cfg = normalizeAppearance(rawAppearance);
  const opts = options && typeof options === "object" ? options : {};
  const hasThemeOverride = cfg.presetId !== "native";
  const hasAccentOverride = Boolean(cfg.customAccent);
  const hasSidebarOverride = Boolean(cfg.customSidebarBg);
  const hasBorderColorOverride = Boolean(cfg.customBorderColor);
  const hasWallpaper = teHasActiveWallpaper(cfg);
  const hasCustomTypo = teHasCustomTypography(cfg);
  const hasCornersOverride = teHasCustomCorners(cfg);
  const hasBorderPreset = cfg.borderPreset !== "crisp";
  const hasUiStyle = teHasCustomUiStyle(cfg);
  const hasElementOverrides = !cfg.overridesPaused && Array.isArray(cfg.elementOverrides) && cfg.elementOverrides.length > 0;
  const hasSurfaceOverride =
    hasCornersOverride || hasBorderPreset || cfg.radius !== 12 || cfg.borderStrength !== 50 || cfg.messageStyle !== "glass";

  if (!hasThemeOverride && !hasAccentOverride && !hasSidebarOverride && !hasBorderColorOverride && !hasWallpaper && !hasCustomTypo && !hasSurfaceOverride && !hasUiStyle && !hasElementOverrides && !cfg.uiPolish) {
    return "";
  }

  const vars = teResolveThemeVars(cfg);
  const cRadii = teResolveCornerRadii(cfg);
  const ty = cfg.typography;
  const uiFontObj = teFindFont("ui", ty.uiFont);
  const monoFontObj = teFindFont("mono", ty.monoFont);
  const isLight = hasThemeOverride ? vars.mode === "light" : Boolean(opts.hostIsLight);
  const borderPresetMult = cfg.borderPreset === "contrast" ? 1.55 : (cfg.borderPreset === "airy" ? 0.55 : 1.0);
  const baseBorderAlpha = Math.round(teClamp(cfg.borderStrength, 0, 100, 50) * (isLight ? 0.28 : 0.26) * borderPresetMult) / 100;
  const borderAlpha = Math.min(0.55, baseBorderAlpha);
  const dynamicBorderCol = hasBorderColorOverride
    ? (cfg.borderStrength === 0
        ? "transparent"
        : (cfg.borderStrength === 50 && cfg.borderPreset === "crisp"
            ? vars.borderColor
            : `color-mix(in srgb, ${vars.borderColor} ${Math.round(teClamp(cfg.borderStrength * 1.65 * borderPresetMult, 12, 100, 85))}%, transparent)`))
    : (isLight ? `rgba(15, 23, 42, ${borderAlpha})` : `rgba(255, 255, 255, ${borderAlpha})`);
  const effectiveBorder = hasBorderColorOverride
    ? dynamicBorderCol
    : ((cfg.borderStrength !== 50 || cfg.borderPreset !== "crisp") ? dynamicBorderCol : vars.borderColor);
  const crispFloorAlpha = cfg.borderStrength === 0
    ? 0
    : Math.min(0.48, Math.max(borderAlpha, cfg.borderPreset === "airy" ? 0.08 : (cfg.borderPreset === "contrast" ? 0.28 : (isLight ? 0.14 : 0.17))));
  const crispBorderCol = crispFloorAlpha <= 0
    ? "transparent"
    : (hasBorderColorOverride
        ? effectiveBorder
        : (isLight ? `rgba(15, 23, 42, ${crispFloorAlpha})` : `rgba(255, 255, 255, ${crispFloorAlpha})`));
  const stepBorderCol = crispFloorAlpha <= 0
    ? "transparent"
    : (hasBorderColorOverride
        ? `color-mix(in srgb, ${vars.borderColor} 78%, transparent)`
        : (isLight ? `rgba(15, 23, 42, ${Math.min(0.36, Math.round(crispFloorAlpha * 0.85 * 100) / 100)})` : `rgba(255, 255, 255, ${Math.min(0.34, Math.round(crispFloorAlpha * 0.85 * 100) / 100)})`));
  const stepSurfaceBg = isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.028)";
  const primaryFg = teGetYiq(vars.accentColor) > 155 ? "#111216" : "#ffffff";
  const sidebarItemBg = isLight
    ? "rgba(15, 23, 42, 0.045)"
    : "rgba(255, 255, 255, 0.055)";
  const sidebarItemHoverBg = isLight
    ? "rgba(15, 23, 42, 0.085)"
    : "rgba(255, 255, 255, 0.095)";
  const sidebarItemActiveBg = isLight
    ? (hasWallpaper
        ? `color-mix(in srgb, ${vars.accentColor} 20%, rgba(255, 255, 255, 0.62))`
        : `color-mix(in srgb, ${vars.accentColor} 16%, color-mix(in srgb, #000000 5%, ${vars.sidebarBg}))`)
    : (hasWallpaper
        ? `color-mix(in srgb, ${vars.accentColor} 28%, rgba(255, 255, 255, 0.12))`
        : `color-mix(in srgb, ${vars.accentColor} 24%, color-mix(in srgb, #ffffff 10%, ${vars.sidebarBg}))`);
  const sidebarItemActiveRing = isLight
    ? `inset 0px 0px 0px 1px color-mix(in srgb, ${vars.accentColor} 40%, rgba(15, 23, 42, 0.10))`
    : `inset 0px 0px 0px 1px color-mix(in srgb, ${vars.accentColor} 48%, rgba(255, 255, 255, 0.16))`;
  const sideRowRad = cRadii.base === 0 ? 0 : Math.max(6, Math.min(10, cRadii.sidebar || 8));
  const sidebarActiveSel = `:where([data-rudex-bg-sidebar="1"], aside, nav[aria-label], [data-testid="sidebar"]) :where([aria-current="page"], [aria-current="true"], [aria-selected="true"], [data-active="true"], [data-selected="true"], [data-state="active"], [data-rudex-sidebar-surface="active"], :where(a, button, li, [role="listitem"], [role="treeitem"], [role="button"]):where([class~="bg-sidebar-accent"], [class~="dark:bg-sidebar-accent"], [class~="bg-accent"], [class~="dark:bg-accent"])):not(#rudex-studio-host *):not([role="switch"]):not([role="checkbox"]):not([role="tab"]):not([data-rudex-sidebar-surface="panel"])`;
  const sidebarFlattenCss = `
:where([data-rudex-bg-sidebar="1"], aside, nav[aria-label], [data-testid="sidebar"]) :where([data-rudex-bg-sidebar="1"], aside, nav[aria-label], [data-testid="sidebar"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  border-right: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
[data-rudex-sidebar-surface="panel"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  border-color: ${effectiveBorder} !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
[data-rudex-sidebar-surface="item"] {
  background-color: ${sidebarItemBg} !important;
  background-image: none !important;
  border-color: ${effectiveBorder} !important;
  border-radius: ${sideRowRad}px !important;
  color: ${vars.fgColor} !important;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}
[data-rudex-sidebar-surface="item"]:hover {
  background-color: ${sidebarItemHoverBg} !important;
}
${sidebarActiveSel} {
  background-color: ${sidebarItemActiveBg} !important;
  background-image: none !important;
  color: ${vars.fgColor} !important;
  border-radius: ${sideRowRad}px !important;
  box-shadow: ${sidebarItemActiveRing} !important;
  font-weight: 500;
  transition: background-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
}
${sidebarActiveSel} :where(span, p, a, svg):not([class*="text-green-"]):not([class*="text-emerald-"]):not([class*="text-red-"]):not([class*="text-amber-"]):not([class*="text-blue-"]) {
  color: ${vars.fgColor} !important;
}
:where([data-rudex-bg-sidebar="1"], aside, nav[aria-label], [data-testid="sidebar"]) :where(a, button, [role="listitem"], [role="treeitem"], [role="button"]):not(#rudex-studio-host *):not([role="switch"]):not([role="checkbox"]):not([class*="rounded-full"]) {
  border-radius: ${sideRowRad}px;
}
:where([data-rudex-bg-sidebar="1"], aside, nav[aria-label], [data-testid="sidebar"]) :where(div, section, ul, ol, header, nav):where([class~="bg-black"], [class~="dark:bg-black"], [class~="bg-black/80"], [class~="bg-black/70"], [class~="bg-black/60"], [class~="bg-black/50"], [class~="bg-black/40"], [class~="bg-zinc-950"], [class~="dark:bg-zinc-950"], [class~="bg-zinc-950/90"], [class~="bg-zinc-950/80"], [class~="bg-zinc-950/60"], [class~="bg-neutral-950"], [class~="dark:bg-neutral-950"], [class~="bg-neutral-950/90"], [class~="bg-neutral-950/80"], [class~="bg-gray-950"], [class~="bg-slate-950"], [class~="bg-stone-950"]):not(#rudex-studio-host *):not([role="button"]):not([role="listitem"]):not([role="treeitem"]):not([role="switch"]):not(pre):not(code) {
  background-color: transparent !important;
  background-image: none !important;
}
:where([data-rudex-bg-sidebar="1"], aside, nav[aria-label], [data-testid="sidebar"]) :where(a, button, li, [role="listitem"], [role="treeitem"], [role="button"]):where([class~="bg-black"], [class~="dark:bg-black"], [class~="bg-zinc-950"], [class~="dark:bg-zinc-950"], [class~="bg-zinc-900"], [class~="dark:bg-zinc-900"], [class~="bg-neutral-950"], [class~="dark:bg-neutral-950"], [class~="bg-neutral-900"], [class~="dark:bg-neutral-900"]):not(#rudex-studio-host *):not([aria-current="page"]):not([aria-current="true"]):not([aria-selected="true"]):not([data-active="true"]):not([data-selected="true"]):not([data-state="active"]):not([data-rudex-sidebar-surface="active"]):not([aria-expanded]):not([role="switch"]) {
  background-color: ${sidebarItemBg} !important;
  border-radius: ${sideRowRad}px !important;
  color: ${vars.fgColor} !important;
}
:where([data-rudex-bg-sidebar="1"], aside, nav[aria-label], [data-testid="sidebar"]) :where(button, [role="button"], [role="treeitem"])[aria-expanded]:not(#rudex-studio-host *):not([aria-current="page"]):not([aria-current="true"]):not([data-rudex-sidebar-surface="active"]) {
  background-color: transparent !important;
  background-image: none !important;
  border-radius: ${sideRowRad}px !important;
}
:where([data-rudex-bg-sidebar="1"], aside, nav[aria-label], [data-testid="sidebar"]) :where(button, [role="button"], [role="treeitem"])[aria-expanded]:not(#rudex-studio-host *):not([aria-current="page"]):not([aria-current="true"]):not([data-rudex-sidebar-surface="active"]):hover {
  background-color: ${sidebarItemHoverBg} !important;
}
:where([data-rudex-bg-header="1"], header:not(#rudex-studio-host *)) :where(div, span, nav, a, button):where([class~="bg-black"], [class~="dark:bg-black"], [class~="bg-zinc-950"], [class~="dark:bg-zinc-950"], [class~="bg-neutral-950"], [class~="dark:bg-neutral-950"], [class~="bg-background"], [class~="dark:bg-background"], [class~="bg-sidebar"], [class~="dark:bg-sidebar"]):not(#rudex-studio-host *):not([role="switch"]):not([role="checkbox"]) {
  background-color: transparent !important;
  background-image: none !important;
}`;
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
  const glassSpecBorder = hasBorderColorOverride ? effectiveBorder : (isLight ? "rgba(255, 255, 255, 0.65)" : "rgba(255, 255, 255, 0.18)");

  if (hasThemeOverride) {
    const cardAlpha = hasWallpaper ? Math.min(vars.glassOpacity, 88) : (isGlassTheme ? Math.min(vars.glassOpacity, 76) : Math.max(vars.glassOpacity, 90));
    const sidebarAlpha = hasWallpaper ? Math.min(vars.sidebarOpacity + 4, 94) : (isGlassTheme ? Math.min(vars.sidebarOpacity, 78) : 96);
    const secondaryHex = isClaudeTheme
      ? (isLight ? "#e8e4d8" : (cfg.presetId === "claude-terminal" ? "#252422" : "#30302e"))
      : teMixHex(vars.cardBg, isLight ? vars.fgColor : "#ffffff", isLight ? 0.065 : 0.08);
    const cardRgba = teHexToRgba(vars.cardBg, cardAlpha);
    const sidebarRgba = teHexToRgba(vars.sidebarBg, sidebarAlpha);

    const effectiveCard = (hasWallpaper || isGlassTheme) ? cardRgba : vars.cardBg;
    const effectiveSidebar = (hasWallpaper || isGlassTheme) ? sidebarRgba : vars.sidebarBg;
    const activeItemBg = sidebarItemActiveBg;
    const hoverSurfaceBg = isLight ? teHexToRgba(vars.fgColor, 6) : "rgba(255, 255, 255, 0.065)";
    const menuHoverBg = `color-mix(in srgb, ${vars.accentColor} ${isLight ? "13%" : "18%"}, ${vars.cardBg})`;
    const switchOffTrack = isLight ? teMixHex(vars.borderColor, vars.fgColor, 0.14) : teMixHex(vars.cardBg, "#ffffff", 0.16);

    chunks.push(`
:root, :root.dark, :root.light, html, html.dark, html.light, body, body.dark, body.light, .dark, .light {
  color-scheme: ${isLight ? "light" : "dark"} !important;
  accent-color: ${vars.accentColor} !important;
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
  --ring: color-mix(in srgb, ${vars.accentColor} 42%, ${effectiveBorder}) !important;
  --color-ring: color-mix(in srgb, ${vars.accentColor} 42%, ${effectiveBorder}) !important;
  --focus-border: color-mix(in srgb, ${vars.accentColor} 45%, ${effectiveBorder}) !important;
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
  --sidebar-panel: transparent !important;
  --sidebar-card: transparent !important;
  --sidebar-surface: ${sidebarItemBg} !important;
  --sidebar-item: ${sidebarItemBg} !important;
  --sidebar-item-hover: ${sidebarItemHoverBg} !important;
  --sidebar-item-active: ${activeItemBg} !important;
  --sidebar-muted: ${sidebarItemBg} !important;
  --color-sidebar-muted: ${sidebarItemBg} !important;
  --surface-3: ${secondaryHex} !important;
  --bg-tertiary: ${secondaryHex} !important;
  --bg-card: ${effectiveCard} !important;
  --bg-panel: ${effectiveSidebar} !important;
  --panel-background: ${effectiveSidebar} !important;
  --divider: ${effectiveBorder} !important;
  --color-divider: ${effectiveBorder} !important;
  --separator: ${effectiveBorder} !important;
  --color-separator: ${effectiveBorder} !important;
  --border-muted: ${effectiveBorder} !important;
  --border-strong: ${crispBorderCol} !important;
}
::selection {
  background-color: color-mix(in srgb, ${vars.accentColor} 28%, transparent);
  color: ${vars.fgColor};
}
::placeholder {
  color: ${vars.mutedColor} !important;
  opacity: 0.85 !important;
}
`);
    // Harmonious inline code, code blocks & blockquotes for ALL custom themes (light & dark, not just Claude)
    const codeInlineBg = isClaudeTheme
      ? (isLight ? "rgba(193, 95, 60, 0.11)" : "rgba(217, 119, 87, 0.14)")
      : (isLight ? `color-mix(in srgb, ${vars.accentColor} 10%, ${vars.sidebarBg})` : `color-mix(in srgb, ${vars.accentColor} 15%, ${vars.cardBg})`);
    const codeInlineFg = isClaudeTheme
      ? (isLight ? "#9e4425" : "#e89b76")
      : (isLight ? teMixHex(vars.accentColor, "#000000", 0.34) : teMixHex(vars.accentColor, "#ffffff", 0.36));
    const codeBlockBgRaw = isClaudeTheme
      ? (isLight ? "#ece9df" : (cfg.presetId === "claude-terminal" ? "#10100f" : "#191817"))
      : (isLight ? teMixHex(vars.canvasBg, vars.fgColor, 0.055) : teMixHex(vars.canvasBg, "#000000", 0.24));
    const codeBlockBg = isGlassTheme && !isLight ? teHexToRgba(codeBlockBgRaw, 68) : codeBlockBgRaw;
    chunks.push(`
[data-testid="agent-response"] code:not(pre code),
[data-markdown-root] code:not(pre code) {
  background-color: ${codeInlineBg} !important;
  color: ${codeInlineFg} !important;
  border: 1px solid color-mix(in srgb, ${vars.accentColor} 22%, transparent);
  padding: 1px 5px;
  border-radius: ${cRadii.inlineCode}px;
}
:where([data-testid="agent-response"], [data-markdown-root]) pre {
  background-color: ${codeBlockBg} !important;
  color: ${vars.fgColor} !important;
  border: 1px solid ${effectiveBorder} !important;
}
:where([data-testid="agent-response"], [data-markdown-root]) pre code {
  background-color: transparent !important;
  color: ${vars.fgColor};
}
[data-testid="agent-response"] blockquote,
[data-markdown-root] blockquote {
  border-left: 2px solid ${vars.accentColor} !important;
  color: ${vars.mutedColor};
}
`);
    // Unify blue/link/accent utility classes, switches, checkboxes, active tabs, menu highlights & unread dots with active theme accent
    // NOTE: Always use exact class-token matching [class~="..."] (never substring [class*="..."])
    // so Tailwind modifiers like hover:bg-muted, prose-code:bg-muted, [&_pre]:bg-zinc-900 never fire at rest!
    chunks.push(`
[data-testid="agent-response"] a,
[data-markdown-root] a,
main a:not(#rudex-studio-host *):not([role="button"]),
:where(a, span, button, svg):where([class~="text-blue-400"], [class~="text-blue-500"], [class~="text-blue-600"], [class~="dark:text-blue-400"], [class~="text-sky-400"], [class~="text-sky-500"], [class~="text-indigo-400"], [class~="text-indigo-500"], [class~="text-cyan-400"], [class~="text-cyan-500"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.accentColor} !important;
  text-decoration-color: color-mix(in srgb, ${vars.accentColor} 45%, transparent);
}
[data-rudex-theme-accent-dot="1"],
:where(div, span, button):where([class~="bg-blue-500"], [class~="bg-blue-600"], [class~="dark:bg-blue-500"], [class~="dark:bg-blue-600"], [class~="bg-sky-500"], [class~="bg-indigo-500"], [class~="bg-cyan-500"]):not(#rudex-studio-host):not(#rudex-studio-host *),
:where(button, [role="button"]):where([class~="bg-primary"], [class~="dark:bg-primary"]):not(#rudex-studio-host):not(#rudex-studio-host *),
:where([role="switch"][data-state="checked"], [role="switch"][aria-checked="true"], [role="checkbox"][data-state="checked"], [role="checkbox"][aria-checked="true"], [data-slot="slider-range"], [data-slot="progress-indicator"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${vars.accentColor} !important;
  border-color: ${vars.accentColor} !important;
}
:where([role="switch"][data-state="unchecked"], [role="switch"][aria-checked="false"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${switchOffTrack} !important;
  border-color: ${effectiveBorder} !important;
}
:where([role="switch"] > span, [data-slot="switch-thumb"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: #ffffff !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
}
:where(button, [role="button"]):where([class~="bg-primary"], [class~="dark:bg-primary"], [class~="bg-blue-500"], [class~="bg-blue-600"], [class~="bg-sky-500"], [class~="bg-indigo-500"]):not(#rudex-studio-host):not(#rudex-studio-host *),
:where(button, [role="button"]):where([class~="bg-primary"], [class~="dark:bg-primary"], [class~="bg-blue-500"], [class~="bg-blue-600"], [class~="bg-sky-500"], [class~="bg-indigo-500"]):not(#rudex-studio-host):not(#rudex-studio-host *) :where(span, svg),
:where([role="checkbox"][data-state="checked"], [role="checkbox"][aria-checked="true"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${primaryFg} !important;
}
:where(div, span, button, a):where([class~="bg-blue-500/10"], [class~="bg-blue-500/15"], [class~="bg-blue-500/20"], [class~="bg-sky-500/10"], [class~="bg-sky-500/15"], [class~="bg-indigo-500/15"], [class~="bg-primary/10"], [class~="bg-primary/15"], [class~="bg-primary/20"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([data-rudex-timeline-rail="1"] *) {
  background-color: color-mix(in srgb, ${vars.accentColor} ${isLight ? "13%" : "17%"}, transparent) !important;
}
:where(div, button, input, textarea, span):where([class~="border-blue-500"], [class~="border-blue-600"], [class~="border-sky-500"], [class~="border-indigo-500"], [class~="border-primary"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([data-rudex-timeline-rail="1"] *) {
  border-color: ${vars.accentColor} !important;
}
:where(div, button, span):where([class~="border-blue-500/30"], [class~="border-blue-500/40"], [class~="border-blue-500/50"], [class~="border-primary/30"], [class~="border-primary/40"], [class~="border-primary/50"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([data-rudex-timeline-rail="1"] *) {
  border-color: color-mix(in srgb, ${vars.accentColor} 42%, transparent) !important;
}
:where([data-rudex-bg-sidebar="1"], aside, [data-testid="sidebar"]) :where(a, button, [role="listitem"], [role="treeitem"]):not(#rudex-studio-host *):not([aria-current="page"]):not([aria-current="true"]):not([aria-selected="true"]):not([data-active="true"]):not([data-selected="true"]):not([data-state="active"]):not([data-rudex-sidebar-surface="active"]):hover {
  background-color: ${hoverSurfaceBg} !important;
}
:where([role="menu"], [role="listbox"]) :where([role="menuitem"], [role="option"]):where([data-highlighted], [aria-selected="true"], :hover):not(#rudex-studio-host *) {
  background-color: ${menuHoverBg} !important;
  color: ${vars.fgColor} !important;
}
:where([role="tablist"], [data-slot="tabs-list"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${secondaryHex} !important;
  border: 1px solid ${effectiveBorder} !important;
}
:where([role="tab"], [data-slot="tabs-trigger"]):not([data-state="active"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.mutedColor} !important;
}
:where([role="tab"], [data-slot="tabs-trigger"]):not([data-state="active"]):hover:not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.fgColor} !important;
}
:where([role="tab"][data-state="active"], [data-slot="tabs-trigger"][data-state="active"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${vars.cardBg} !important;
  color: ${vars.fgColor} !important;
  box-shadow: inset 0 -2px 0 ${vars.accentColor};
}
[data-rudex-theme-composer="1"] button:where([class~="bg-white"], [class~="dark:bg-white"], [class~="bg-zinc-100"], [class~="bg-neutral-100"]):not([data-rudex-comp-voice="1"]):not([data-rudex-comp-voice="1"] *):not([data-rudex-comp-mic="1"]):not([data-rudex-comp-mic="1"] *):not([data-rudex-comp-mic-active="1"]):not([aria-label*="voice" i]):not([aria-label*="голосов" i]):not([title*="voice" i]):not([title*="голосов" i]):not([data-testid*="voice" i]):not(#rudex-studio-host *) {
  background-color: ${vars.accentColor} !important;
  color: ${primaryFg} !important;
  border-color: transparent !important;
}
[data-rudex-theme-composer="1"] button:where([class~="bg-white"], [class~="dark:bg-white"], [class~="bg-zinc-100"], [class~="bg-neutral-100"]):not([data-rudex-comp-voice="1"]):not([data-rudex-comp-voice="1"] *):not([data-rudex-comp-mic="1"]):not([data-rudex-comp-mic="1"] *):not([data-rudex-comp-mic-active="1"]):not([aria-label*="voice" i]):not([aria-label*="голосов" i]):not([title*="voice" i]):not([title*="голосов" i]):not([data-testid*="voice" i]) :where(svg, span) {
  color: ${primaryFg} !important;
}
`);
    if (isLight) {
      chunks.push(`
/* Light-mode contrast & dark-class neutralization over Antigravity's dark DOM */
:where(div, span, p, h1, h2, h3, h4, h5, h6, li, button, a, label, td, th, svg):where(
  [class~="text-white"], [class~="dark:text-white"],
  [class~="text-white/95"], [class~="text-white/90"], [class~="text-white/85"], [class~="text-white/80"], [class~="text-white/75"], [class~="text-white/70"], [class~="dark:text-white/90"], [class~="dark:text-white/80"],
  [class~="text-zinc-50"], [class~="text-zinc-100"], [class~="text-zinc-200"], [class~="text-zinc-300"],
  [class~="dark:text-zinc-50"], [class~="dark:text-zinc-100"], [class~="dark:text-zinc-200"], [class~="dark:text-zinc-300"],
  [class~="text-neutral-50"], [class~="text-neutral-100"], [class~="text-neutral-200"], [class~="text-neutral-300"],
  [class~="dark:text-neutral-50"], [class~="dark:text-neutral-100"], [class~="dark:text-neutral-200"], [class~="dark:text-neutral-300"],
  [class~="text-gray-50"], [class~="text-gray-100"], [class~="text-gray-200"], [class~="text-gray-300"],
  [class~="dark:text-gray-50"], [class~="dark:text-gray-100"], [class~="dark:text-gray-200"], [class~="dark:text-gray-300"],
  [class~="text-slate-50"], [class~="text-slate-100"], [class~="text-slate-200"], [class~="text-slate-300"],
  [class~="dark:text-slate-50"], [class~="dark:text-slate-100"], [class~="dark:text-slate-200"], [class~="dark:text-slate-300"],
  [class~="text-stone-100"], [class~="text-stone-200"], [class~="text-stone-300"]
):not([class~="bg-primary"]):not([class~="dark:bg-primary"]):not([class~="bg-blue-500"]):not([class~="bg-blue-600"]):not([class~="bg-red-500"]):not([class~="bg-red-600"]):not([class~="bg-emerald-500"]):not([class~="bg-emerald-600"]):not([class~="bg-green-600"]):not([class~="bg-black"]):not([data-state="checked"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.fgColor} !important;
}
:where(div, span, p, li, button, label, svg):where(
  [class~="text-white/60"], [class~="text-white/50"], [class~="text-white/40"], [class~="dark:text-white/60"], [class~="dark:text-white/50"],
  [class~="text-zinc-400"], [class~="text-zinc-500"], [class~="dark:text-zinc-400"], [class~="dark:text-zinc-500"],
  [class~="text-neutral-400"], [class~="text-neutral-500"], [class~="dark:text-neutral-400"], [class~="dark:text-neutral-500"],
  [class~="text-gray-400"], [class~="text-gray-500"], [class~="dark:text-gray-400"], [class~="dark:text-gray-500"],
  [class~="text-slate-400"], [class~="text-slate-500"], [class~="dark:text-slate-400"], [class~="dark:text-slate-500"],
  [class~="text-stone-400"], [class~="text-stone-500"]
):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.mutedColor} !important;
}
:where(div, section, button, span, a, li):where(
  [class~="bg-white/5"], [class~="bg-white/10"], [class~="bg-white/15"], [class~="dark:bg-white/5"], [class~="dark:bg-white/10"], [class~="dark:bg-white/15"],
  [class~="bg-zinc-950/50"], [class~="bg-zinc-950/80"], [class~="bg-zinc-900/50"], [class~="bg-zinc-900/80"], [class~="bg-zinc-900/90"], [class~="dark:bg-zinc-900/50"], [class~="dark:bg-zinc-800/50"], [class~="bg-zinc-800/50"], [class~="bg-zinc-800/80"],
  [class~="bg-neutral-950/50"], [class~="bg-neutral-950/80"], [class~="bg-neutral-900/50"], [class~="bg-neutral-900/80"], [class~="dark:bg-neutral-900/50"], [class~="bg-neutral-800/50"], [class~="bg-neutral-800/80"],
  [class~="bg-gray-900/50"], [class~="bg-gray-900/80"], [class~="bg-slate-900/50"], [class~="bg-slate-900/80"]
):not([data-testid="agent-response"]):not([data-markdown-root]):not([role="dialog"]):not([role="alertdialog"]):not([aria-hidden="true"]):not([data-slot*="overlay"]):not([data-slot*="backdrop"]):not([role="switch"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${secondaryHex} !important;
  color: ${vars.fgColor} !important;
}
:where([data-rudex-bg-sidebar="1"], aside, [data-testid="sidebar"]) :where([class~="bg-black"], [class~="dark:bg-black"], [class~="bg-zinc-900"], [class~="bg-zinc-950"], [class~="bg-neutral-900"], [class~="bg-neutral-950"], [class~="bg-gray-900"], [class~="bg-slate-900"], [class~="bg-stone-900"]):not(#rudex-studio-host *) {
  background-color: ${activeItemBg} !important;
  color: ${vars.fgColor} !important;
}
[data-rudex-light-fix="sidebar"] {
  background-color: ${secondaryHex} !important;
  color: ${vars.fgColor} !important;
}
[data-rudex-light-fix="sidebar-active"] {
  background-color: ${sidebarItemActiveBg} !important;
  color: ${vars.fgColor} !important;
  box-shadow: ${sidebarItemActiveRing} !important;
  font-weight: 500;
}
[data-rudex-light-fix="sidebar"] :where(span, div, p, a, svg, label),
[data-rudex-light-fix="sidebar-active"] :where(span, div, p, a, svg, label) {
  color: ${vars.fgColor} !important;
}
[data-rudex-light-fix="header"] {
  background-color: ${secondaryHex} !important;
  color: ${vars.fgColor} !important;
  border-color: ${effectiveBorder} !important;
}
[data-rudex-light-fix="header"] :where(span, svg) {
  color: ${vars.fgColor} !important;
}
[data-rudex-light-fix="surface"] {
  background-color: ${secondaryHex} !important;
  color: ${vars.fgColor} !important;
  border-color: ${effectiveBorder} !important;
}
[data-rudex-light-fix="surface"] :where(span, p, label, svg):not([class*="text-green-"]):not([class*="text-emerald-"]):not([class*="text-red-"]):not([class*="text-rose-"]):not([class*="text-amber-"]) {
  color: ${vars.fgColor} !important;
}
[data-rudex-light-text="1"] {
  color: ${vars.fgColor} !important;
}
[data-testid="agent-response"],
[data-markdown-root],
[data-testid="agent-response"] :where(p, li, h1, h2, h3, h4, h5, h6, strong, b, em, td, th, dt, dd, span, div):where(:not(a):not(a *):not(blockquote):not(code):not(pre):not(pre *):not([class*="text-muted"]):not([class*="text-green-"]):not([class*="text-emerald-"]):not([class*="text-red-"]):not([class*="text-rose-"]):not([class*="text-amber-"]):not([class*="bg-primary"] *):not([data-rudex-live-slot]):not([data-rudex-live-slot] *)),
[data-testid="model-selector-trigger"],
[data-rudex-theme-composer="1"] :where(button, [role="button"]):where(:not([data-rudex-comp-send="1"]):not([class~="bg-primary"]):not([class~="bg-white"]):not([class~="dark:bg-white"]):not([class~="bg-blue-500"]):not([class~="bg-blue-600"]):not([class~="bg-red-500"]):not([data-testid="input-cancel-button"])) {
  color: ${vars.fgColor} !important;
}
:where(aside, main, header, [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-rudex-theme-composer="1"]) :where(div, section, button, a, input, select, textarea, hr, span):where(:not(#rudex-studio-host):not(#rudex-studio-host *):not([class~="border-transparent"]):not([class~="border-none"]):not([class~="border-0"]):not([class~="border-primary"]):not([class*="border-blue-"]):not([class*="border-red-"]):not([class*="border-rose-"]):not([class*="border-amber-"]):not([class*="border-green-"]):not([class*="border-emerald-"]):not([class*="border-destructive"]):not([role="switch"][data-state="checked"]):not([role="switch"][aria-checked="true"]):not([role="checkbox"][data-state="checked"]):not([role="checkbox"][aria-checked="true"]):not(blockquote):not(code)) {
  border-color: ${effectiveBorder} !important;
}
:where(span, div, p):where([class~="text-green-400"], [class~="text-emerald-400"], [class~="dark:text-green-400"], [class~="dark:text-emerald-400"]):not(#rudex-studio-host *) {
  color: #15803d !important;
}
:where(span, div, p):where([class~="text-red-400"], [class~="text-rose-400"], [class~="dark:text-red-400"], [class~="dark:text-rose-400"]):not(#rudex-studio-host *) {
  color: #dc2626 !important;
}
:where(span, div, p):where([class~="text-amber-400"], [class~="text-yellow-400"], [class~="dark:text-amber-400"], [class~="dark:text-yellow-400"]):not(#rudex-studio-host *) {
  color: #b45309 !important;
}
`);
    }
    // Header action button & mismatched inner surface rules are emitted via sidebarFlattenCss for both themed and wallpaper modes.
    if (!hasWallpaper) {
      const isGlassNoWp = isGlassTheme;
      const shellCanvasBg = isGlassNoWp ? "transparent" : vars.canvasBg;
      const cleanAgentCanvasCss = (!isGlassTheme && cfg.messageStyle !== "solid")
        ? `
[data-testid="agent-response"],
[data-testid="agent-response"] :where([data-markdown-root], div:has(> [data-markdown-root])),
[data-markdown-root] {
  background-color: transparent !important;
  background-image: none !important;
}`
        : "";
      const glassAmbientBgImage = cfg.presetId === "liquid-glass"
        ? "radial-gradient(62% 54% at 14% 12%, rgba(10, 132, 255, 0.24), transparent 72%), radial-gradient(56% 52% at 88% 18%, rgba(99, 102, 241, 0.20), transparent 74%), radial-gradient(60% 58% at 54% 92%, rgba(6, 182, 212, 0.16), transparent 76%)"
        : (cfg.presetId === "midnight-neon"
          ? "radial-gradient(58% 52% at 16% 14%, rgba(56, 189, 248, 0.17), transparent 72%), radial-gradient(52% 48% at 86% 20%, rgba(168, 85, 247, 0.14), transparent 74%), radial-gradient(56% 52% at 50% 94%, rgba(14, 165, 233, 0.11), transparent 74%)"
          : "radial-gradient(60% 54% at 18% 12%, rgba(99, 102, 241, 0.16), transparent 72%), radial-gradient(52% 48% at 84% 22%, rgba(139, 92, 246, 0.12), transparent 74%), radial-gradient(56% 52% at 52% 94%, rgba(59, 130, 246, 0.10), transparent 76%)");
      const liquidBackdropCss = isGlassNoWp
        ? `
html, body {
  background-color: ${vars.canvasBg} !important;
  background-image: ${glassAmbientBgImage} !important;
  background-attachment: fixed !important;
  color: ${vars.fgColor} !important;
}
#root, #app {
  background-color: transparent !important;
  color: ${vars.fgColor} !important;
}`
        : `
html, body, #root, #app {
  background-color: ${vars.canvasBg} !important;
  color: ${vars.fgColor} !important;
}`;
      chunks.push(`
${liquidBackdropCss}
[data-rudex-bg-shell="1"]:not([data-state]):not([aria-hidden="true"]):not([role="dialog"]):not([role="alertdialog"]),
main:not([role="dialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]),
[data-testid="chat-container"]:not([role="dialog"]),
[data-testid="conversation-view"]:not([role="dialog"]),
:where(div, section):where([class~="bg-background"], [class~="dark:bg-background"]):where(:not(aside, nav, header, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"], [data-rudex-theme-composer="1"], [role="button"], [role="tab"], [role="switch"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [class*="badge"], [class*="chip"], [class*="pill"], [data-slot="badge"], [data-slot="button"], [data-rudex-ignore="1"])) {
  background-color: ${shellCanvasBg} !important;
  color: ${vars.fgColor};
}
[data-rudex-bg-fade="1"],
[data-rudex-bg-fade="1"]::before,
[data-rudex-bg-fade="1"]::after,
[data-rudex-timeline-rail="1"],
[data-rudex-timeline-rail="1"]::before,
[data-rudex-timeline-rail="1"]::after,
:where(div, section)[class*="bg-gradient-"]:where(:not(#rudex-studio-host, #rudex-studio-host *, [role="dialog"], [role="alertdialog"], [role="button"], button, a, [data-testid="agent-response"], [data-testid="agent-response"] *, [data-testid="user-message-bubble"], [data-testid="user-message-bubble"] *, [data-rudex-theme-composer="1"], [data-rudex-theme-composer="1"] *, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"])),
:where(div, section)[class*="bg-linear-"]:where(:not(#rudex-studio-host, #rudex-studio-host *, [role="dialog"], [role="alertdialog"], [role="button"], button, a, [data-testid="agent-response"], [data-testid="agent-response"] *, [data-testid="user-message-bubble"], [data-testid="user-message-bubble"] *, [data-rudex-theme-composer="1"], [data-rudex-theme-composer="1"] *, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"])) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border-color: transparent !important;
}
[data-rudex-bg-sidebar="1"],
aside,
nav[aria-label],
[data-testid="sidebar"],
:where(div, aside, nav):where([class~="bg-sidebar"], [class~="dark:bg-sidebar"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
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
[data-rudex-theme-composer="1"] :where(textarea, [contenteditable="true"], [role="textbox"]):not([data-rudex-comp-input-row="1"]),
[data-rudex-theme-composer="1"] :where(form, [data-testid="composer"], .composer-container):not([data-rudex-comp-input-row="1"]),
[data-rudex-theme-composer="1"] :where(div, section):has(:is(textarea, [contenteditable="true"], [role="textbox"])):not([data-rudex-comp-input-row="1"]) {
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  border-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  --tw-ring-color: transparent !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
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
:where([data-slot="card"], [class~="bg-card"], [class~="dark:bg-card"], [class~="bg-popover"], [class~="dark:bg-popover"]):not([data-testid="agent-response"]):not([data-markdown-root]):not([data-slot="collapsible"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${vars.cardBg} !important;
  border-color: ${effectiveBorder} !important;
  color: ${vars.fgColor};
}
:where(div, section, aside, header, nav):where([class~="bg-black"], [class~="dark:bg-black"], [class~="bg-zinc-950"], [class~="dark:bg-zinc-950"], [class~="bg-zinc-950/90"], [class~="bg-zinc-950/80"], [class~="bg-neutral-950"], [class~="dark:bg-neutral-950"], [class~="bg-neutral-950/90"], [class~="bg-neutral-950/80"], [class~="bg-gray-950"], [class~="dark:bg-gray-950"], [class~="bg-slate-950"], [class~="dark:bg-slate-950"], [class~="bg-stone-950"], [class~="dark:bg-stone-950"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="dialog"]):not([role="alertdialog"]):not([aria-hidden="true"]):not([data-slot*="overlay"]):not([data-slot*="backdrop"]):not([data-rudex-bg-header="1"] *):not(header *):not(pre):not(code) {
  background-color: ${vars.sidebarBg} !important;
}
:where(div, section, form, article):where([class~="bg-zinc-900"], [class~="dark:bg-zinc-900"], [class~="bg-neutral-900"], [class~="dark:bg-neutral-900"], [class~="bg-gray-900"], [class~="dark:bg-gray-900"], [class~="bg-slate-900"], [class~="dark:bg-slate-900"], [class~="bg-stone-900"], [class~="dark:bg-stone-900"]):not([data-testid="agent-response"]):not([data-markdown-root]):not([data-slot="collapsible"]):not([data-rudex-bg-header="1"]):not([data-rudex-bg-header="1"] *):not(header):not(header *):not(#rudex-studio-host):not(#rudex-studio-host *):not(pre):not(code) {
  background-color: ${vars.cardBg} !important;
}
:where(div, section, button, span):where([class~="bg-secondary"], [class~="dark:bg-secondary"], [class~="bg-muted"], [class~="dark:bg-muted"], [class~="bg-zinc-800"], [class~="dark:bg-zinc-800"], [class~="bg-neutral-800"], [class~="dark:bg-neutral-800"], [class~="bg-gray-800"], [class~="dark:bg-gray-800"]):not([data-testid="agent-response"]):not([data-markdown-root]):not([data-slot="collapsible"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([role="switch"]):not(pre):not(code) {
  background-color: ${secondaryHex} !important;
}
:where(hr, [role="separator"], [data-slot="separator"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([data-panel-resize-handle-id]):not([data-resize-handle]):not([data-panel-resize-handle-enabled]):not([aria-orientation="vertical"]):not([class*="cursor-col-resize"]):not([class*="cursor-ew-resize"]) {
  border-color: ${effectiveBorder} !important;
  background-color: ${effectiveBorder} !important;
}
:where([data-panel-resize-handle-id], [data-resize-handle], [data-panel-resize-handle-enabled], [role="separator"][aria-orientation="vertical"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
:where([class~="divide-y"] > *, [class~="divide-x"] > *):not(#rudex-studio-host):not(#rudex-studio-host *) {
  border-color: ${effectiveBorder} !important;
}
:where(div, section, aside, header, main, form, button, input, textarea):where([class~="border-zinc-800"], [class~="border-zinc-700"], [class~="dark:border-zinc-800"], [class~="border-neutral-800"], [class~="border-neutral-700"], [class~="dark:border-neutral-800"], [class~="border-gray-800"], [class~="border-slate-800"], [class~="border-stone-800"], [class~="border-white/10"], [class~="border-white/15"], [class~="border-white/20"], [class~="border-black/10"], [class~="border-border"], [class~="border-input"], [class~="border-sidebar-border"], [class~="border-b"], [class~="border-t"], [class~="border-r"], [class~="border-l"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class~="border-transparent"]):not([class~="border-none"]):not([class~="border-0"]):not([class~="border-blue-500"]):not([class~="border-primary"]):not([class*="border-red-"]):not([class*="border-green-"]):not([class*="border-emerald-"]):not([class*="border-amber-"]) {
  border-color: ${effectiveBorder};
}
${sidebarFlattenCss}
:where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea):not(#rudex-studio-host):not(#rudex-studio-host *) {
  color: ${vars.fgColor} !important;
  caret-color: ${vars.accentColor} !important;
}${cleanAgentCanvasCss}
`);
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
  padding: 16px 18px !important;
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
  } else if (hasAccentOverride || hasSidebarOverride || hasBorderColorOverride || cfg.borderStrength !== 50 || hasBorderPreset) {
    const nativeVars = [];
    if (hasAccentOverride) {
      nativeVars.push(`  --primary: ${vars.accentColor};`, `  --primary-foreground: ${primaryFg};`, `  --link: ${vars.accentColor};`);
    }
    if (hasSidebarOverride) {
      nativeVars.push(
        `  --sidebar: ${vars.sidebarBg} !important;`,
        `  --sidebar-background: ${vars.sidebarBg} !important;`,
        `  --bg-sidebar: ${vars.sidebarBg} !important;`,
        `  --color-sidebar: ${vars.sidebarBg} !important;`,
        `  --sidebar-panel: transparent !important;`,
        `  --sidebar-card: transparent !important;`
      );
    }
    if (hasBorderColorOverride || cfg.borderStrength !== 50 || hasBorderPreset) {
      nativeVars.push(
        `  --border: ${effectiveBorder} !important;`,
        `  --color-border: ${effectiveBorder} !important;`,
        `  --card-border: ${effectiveBorder} !important;`,
        `  --sidebar-border: ${effectiveBorder} !important;`,
        `  --color-sidebar-border: ${effectiveBorder} !important;`,
        `  --divider: ${effectiveBorder} !important;`,
        `  --separator: ${effectiveBorder} !important;`
      );
    }
    chunks.push(`:root, html, body {\n${nativeVars.join("\n")}\n}`);
    if (hasSidebarOverride && !hasWallpaper) {
      chunks.push(`
[data-rudex-bg-sidebar="1"],
aside,
nav[aria-label],
[data-testid="sidebar"],
:where(div, aside, nav):where([class~="bg-sidebar"], [class~="dark:bg-sidebar"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: ${vars.sidebarBg} !important;
  border-color: ${effectiveBorder} !important;
}
[data-rudex-bg-header="1"],
header:not(#rudex-studio-host *) {
  background-color: ${vars.sidebarBg} !important;
  border-color: ${effectiveBorder} !important;
}
${sidebarFlattenCss}`);
    }
    if (hasBorderColorOverride) {
      chunks.push(`
:where(hr, [role="separator"], [data-slot="separator"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([data-panel-resize-handle-id]):not([data-resize-handle]):not([data-panel-resize-handle-enabled]):not([aria-orientation="vertical"]):not([class*="cursor-col-resize"]):not([class*="cursor-ew-resize"]) {
  border-color: ${effectiveBorder} !important;
  background-color: ${effectiveBorder} !important;
}
:where([data-panel-resize-handle-id], [data-resize-handle], [data-panel-resize-handle-enabled], [role="separator"][aria-orientation="vertical"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
:where([class~="divide-y"] > *, [class~="divide-x"] > *):not(#rudex-studio-host):not(#rudex-studio-host *),
:where(div, section, aside, header, main, form, button, input, textarea):where([class~="border-zinc-800"], [class~="border-zinc-700"], [class~="dark:border-zinc-800"], [class~="border-neutral-800"], [class~="border-neutral-700"], [class~="dark:border-neutral-800"], [class~="border-white/10"], [class~="border-white/15"], [class~="border-black/10"], [class~="border-border"], [class~="border-input"], [class~="border-sidebar-border"], [class~="border-b"], [class~="border-t"], [class~="border-r"], [class~="border-l"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class~="border-transparent"]):not([class~="border-none"]):not([class~="border-0"]):not([class~="border-blue-500"]):not([class~="border-primary"]) {
  border-color: ${effectiveBorder} !important;
}`);
    }
  }

  let msgAlpha = 0;
  if (hasWallpaper) {
    const baseGlass = hasThemeOverride ? vars.glassOpacity : cfg.glassOpacity;
    const surfaceBg = hasThemeOverride
      ? teHexToRgba(vars.cardBg, vars.glassOpacity)
      : teHexToRgba(isLight ? "#ffffff" : "#131316", cfg.glassOpacity);
    const sidebarAlpha = Math.round(teClamp(cfg.sidebarOpacity, 20, 100, 72));
    const headerAlpha = Math.min(96, Math.max(82, Math.max(sidebarAlpha - 2, baseGlass)));
    const sidebarGlassBg = (hasThemeOverride || hasSidebarOverride)
      ? teHexToRgba(vars.sidebarBg, sidebarAlpha)
      : teHexToRgba(isLight ? "#f4f5f8" : "#0e0e12", sidebarAlpha);
    const headerGlassBg = (hasThemeOverride || hasSidebarOverride)
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
  border-radius: ${cRadii.inlineCode}px;
}`
          : `
[data-testid="agent-response"] code:not(pre code), [data-markdown-root] code:not(pre code) {
  background-color: rgba(8, 9, 14, 0.62) !important;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f8fafc !important;
  padding: 1px 5px;
  border-radius: ${cRadii.inlineCode}px;
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
  border-radius: ${cRadii.code}px;
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
  border-radius: ${cRadii.code}px;
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
  --sidebar-panel: transparent !important;
  --sidebar-card: transparent !important;
  --sidebar-surface: ${sidebarItemBg} !important;
  --sidebar-item: ${sidebarItemBg} !important;
  --sidebar-item-hover: ${sidebarItemHoverBg} !important;
  --sidebar-item-active: ${sidebarItemActiveBg} !important;
  --sidebar-accent: ${sidebarItemBg} !important;
  --color-sidebar-accent: ${sidebarItemBg} !important;
  --sidebar-border: ${effectiveBorder} !important;
  --color-sidebar-border: ${effectiveBorder} !important;
  --card: ${surfaceBg} !important;
  --color-card: ${surfaceBg} !important;
  --surface-1: ${surfaceBg} !important;
  --surface-2: ${sidebarItemBg} !important;
  --secondary: ${sidebarItemBg} !important;
  --color-secondary: ${sidebarItemBg} !important;
  --muted: ${sidebarItemBg} !important;
  --color-muted: ${sidebarItemBg} !important;
  --popover: ${popoverBg} !important;
  --color-popover: ${popoverBg} !important;
  --border: ${effectiveBorder} !important;
  --color-border: ${effectiveBorder} !important;
  --divider: ${effectiveBorder} !important;
  --separator: ${effectiveBorder} !important;
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
  transform: translate3d(0, 0, 0);
}
#rudex-bg[data-boot-hidden="1"] {
  opacity: 0 !important;
  visibility: hidden !important;
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
  mask-image: none !important;
  -webkit-mask-image: none !important;
}
main:not([role="dialog"]):not([role="menu"]):not([role="listbox"]):not([role="tooltip"]),
[data-testid="chat-container"]:not([role="dialog"]),
[data-testid="conversation-view"]:not([role="dialog"]),
:where(div, section):where([class~="bg-background"], [class~="dark:bg-background"]):where(:not(aside, nav, header, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"], [data-rudex-theme-composer="1"], [role="button"], [role="tab"], [role="switch"], [role="dialog"], [role="dialog"] *, [role="alertdialog"], [role="alertdialog"] *, [role="menu"], [role="listbox"], [role="tooltip"], [class*="badge"], [class*="chip"], [class*="pill"], [data-slot="badge"], [data-slot="button"], [data-rudex-ignore="1"])),
:where(div, section).bg-black:where(:not(aside, nav, header, [data-rudex-bg-sidebar="1"], [data-rudex-bg-header="1"], [data-rudex-theme-composer="1"], [role="button"], [role="tab"], [role="dialog"], [role="dialog"] *, [role="alertdialog"], [role="alertdialog"] *, [role="menu"], [role="listbox"], [role="tooltip"], [class*="badge"], [class*="chip"], [class*="pill"], [data-rudex-ignore="1"])) {
  background-color: transparent !important;
}
[data-rudex-bg-sidebar="1"],
aside,
nav[aria-label],
[data-testid="sidebar"] {
  background-color: ${sidebarGlassBg} !important;
  border-color: ${effectiveBorder} !important;
  ${msgStyle === "glass" ? `background-image: ${glassSheenGrad}; box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.07);` : ""}
  ${glassBlurCss}
}
${sidebarFlattenCss}
:where(hr, [role="separator"], [data-slot="separator"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([data-panel-resize-handle-id]):not([data-resize-handle]):not([data-panel-resize-handle-enabled]):not([aria-orientation="vertical"]):not([class*="cursor-col-resize"]):not([class*="cursor-ew-resize"]) {
  border-color: ${effectiveBorder} !important;
  background-color: ${effectiveBorder} !important;
}
:where([data-panel-resize-handle-id], [data-resize-handle], [data-panel-resize-handle-enabled], [role="separator"][aria-orientation="vertical"]):not(#rudex-studio-host):not(#rudex-studio-host *) {
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
:where([class~="divide-y"] > *, [class~="divide-x"] > *):not(#rudex-studio-host):not(#rudex-studio-host *),
:where(div, section, aside, header, main, form, button, input, textarea):where([class~="border-zinc-800"], [class~="border-zinc-700"], [class~="dark:border-zinc-800"], [class~="border-neutral-800"], [class~="border-neutral-700"], [class~="dark:border-neutral-800"], [class~="border-white/10"], [class~="border-white/15"], [class~="border-black/10"], [class~="border-border"], [class~="border-input"], [class~="border-sidebar-border"], [class~="border-b"], [class~="border-t"], [class~="border-r"], [class~="border-l"]):not(#rudex-studio-host):not(#rudex-studio-host *):not([class~="border-transparent"]):not([class~="border-none"]):not([class~="border-0"]):not([class~="border-blue-500"]):not([class~="border-primary"]):not([class*="border-red-"]):not([class*="border-green-"]):not([class*="border-emerald-"]):not([class*="border-amber-"]) {
  border-color: ${effectiveBorder};
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
[data-rudex-theme-composer="1"] :where(textarea, [contenteditable="true"], [role="textbox"]):not([data-rudex-comp-input-row="1"]),
[data-rudex-theme-composer="1"] :where(form, [data-testid="composer"], .composer-container):not([data-rudex-comp-input-row="1"]),
[data-rudex-theme-composer="1"] :where(div, section):has(:is(textarea, [contenteditable="true"], [role="textbox"])):not([data-rudex-comp-input-row="1"]) {
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  border-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  --tw-ring-color: transparent !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
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
[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  border-radius: ${cRadii.messages}px !important;
  border: ${cfg.borderStrength > 0 ? `1px solid ${dynamicBorderCol}` : "none"} !important;
}
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

  // Crisp structural block borders across themes (zero layout shift: no forced padding/margin on collapsibles, no double borders on nested sidebar/composer)
  if ((hasThemeOverride || hasBorderColorOverride || hasBorderPreset || cfg.borderStrength !== 50) && cfg.borderStrength > 0) {
    const contrastAgentCss = cfg.borderPreset === "contrast" && !hasWallpaper && cfg.messageStyle !== "minimal"
      ? `
[data-testid="agent-response"] {
  border: 1px solid ${crispBorderCol} !important;
  border-radius: ${cRadii.messages}px !important;
  padding: 12px 16px !important;
}`
      : "";
    chunks.push(`
[data-testid="user-message-bubble"],
[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *) {
  border: 1px solid ${crispBorderCol} !important;
  box-shadow: ${isLight ? "0 1px 4px rgba(15, 23, 42, 0.06)" : "0 2px 10px rgba(0, 0, 0, 0.22)"};
}
[data-testid="user-message-bubble"] [data-testid="user-message-content"] {
  border: none !important;
  box-shadow: none !important;
}
[data-rudex-theme-composer="1"] {
  border: 1px solid ${crispBorderCol} !important;
  outline: none !important;
  ${isGlassTheme ? "" : "box-shadow: none !important;"}
  --tw-ring-color: transparent !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
  --tw-ring-offset-color: transparent !important;
}
:where(div, form, section):has(> [data-rudex-theme-composer="1"]) {
  outline: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
  --tw-ring-color: transparent !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
  --tw-ring-offset-color: transparent !important;
}
[data-rudex-theme-composer="1"] *:not(button):not([role="button"]):not(svg):not(img):not([class*="badge"]):not([class*="chip"]):not([class*="pill"]) {
  outline: none !important;
  --tw-ring-color: transparent !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
}
main:focus,
main:focus-visible,
[data-rudex-bg-shell="1"]:focus,
[data-rudex-bg-shell="1"]:focus-visible,
[data-testid="chat-container"]:focus,
[data-testid="chat-container"]:focus-visible,
[data-testid="conversation-view"]:focus,
[data-testid="conversation-view"]:focus-visible,
main div[tabindex]:focus,
main div[tabindex]:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  --tw-ring-color: transparent !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
}
[data-rudex-bg-sidebar="1"] [data-rudex-bg-sidebar="1"],
[data-rudex-bg-sidebar="1"] aside {
  border-right: none !important;
}
main :where([data-testid*="thought"], [data-testid*="thinking"], [data-testid*="step-group"], [data-testid*="tool-call"], [data-rudex-zone="steps"], [data-rudex-zone="thinking"]):not(#rudex-studio-host *) {
  box-shadow: inset 0 0 0 1px ${stepBorderCol};
  background-color: ${stepSurfaceBg};
  border-radius: ${cRadii.cards === 0 ? 0 : Math.max(4, Math.min(10, cRadii.cards))}px;
}
:where([data-testid="agent-response"], [data-markdown-root], main) pre:not(#rudex-studio-host *) {
  border: 1px solid ${crispBorderCol} !important;
}${contrastAgentCss}
`);
  }

  const uiStack = teResolveFontStack("ui", ty.uiFont, ty.uiFontCustom);
  const monoStack = teResolveFontStack("mono", ty.monoFont, ty.monoFontCustom);
  const inputStack = teResolveFontStack("ui", ty.inputFont, ty.inputFontCustom);
  const userMsgStack = teResolveFontStack("ui", ty.userMsgFont, ty.userMsgFontCustom);
  const agentStack = teResolveFontStack("ui", ty.agentFont, ty.agentFontCustom);
  const thinkingStack = teResolveFontStack("ui", ty.thinkingFont, ty.thinkingFontCustom);

  if (uiStack) {
    const isSerifUi = uiFontObj.id === "claude-serif" || uiFontObj.id === "claude-lora" || uiFontObj.id === "georgia";
    chunks.push(`
:root, html, body {
  --font-sans: ${uiStack} !important;
  --font-body: ${uiStack} !important;
  --default-font-family: ${uiStack} !important;
  --font-ui: ${uiStack} !important;
}
body, input, textarea, button, button :where(*:not(code):not(pre):not([class*="font-mono"]):not([class*="codicon"])), [role="button"], [role="button"] :where(*:not(code):not(pre):not([class*="font-mono"]):not([class*="codicon"])), select, label, [role="tooltip"], [role="tooltip"] *, [role="menu"], [role="menu"] *, [role="listbox"], [role="listbox"] *, [data-rudex-theme-composer="1"], [data-rudex-theme-composer="1"] :where(button, span, div, p, label):not([contenteditable="true"]):not([contenteditable="true"] *), [data-rudex-theme-composer="1"] *:not(code):not(pre):not(svg):not(svg *):not(textarea):not([contenteditable="true"]):not([contenteditable="true"] *):not([class*="font-mono"]), :where([class~="font-sans"]):not(#rudex-studio-host):not(#rudex-studio-host *), [data-markdown-root], [data-testid="agent-response"], [data-testid="user-message-content"] {
  font-family: ${uiStack} !important;
  ${isSerifUi ? 'text-rendering: optimizeLegibility; font-feature-settings: "kern" 1, "liga" 1;' : ""}
}
`);
  }

  if (ty.uiFontSize > 0) {
    chunks.push(`
:where(aside, nav[aria-label], [data-testid="sidebar"], [data-rudex-bg-sidebar="1"], header:not(#rudex-studio-host *), [data-rudex-bg-header="1"], [role="menu"], [role="listbox"], [role="tooltip"], [data-rudex-theme-composer="1"] button):not(#rudex-studio-host):not(#rudex-studio-host *) {
  font-size: ${ty.uiFontSize}px !important;
}
`);
  }

  if (inputStack || ty.inputFontSize > 0) {
    chunks.push(`
[data-rudex-theme-composer="1"] :is(textarea, [contenteditable="true"], [contenteditable="true"] *),
[data-rudex-theme-composer="1"] [data-rudex-comp-placeholder],
[data-rudex-theme-composer="1"] [data-rudex-comp-placeholder-inner="1"],
form:not(#rudex-studio-host *) :is(textarea, [contenteditable="true"]),
[data-testid="composer"] :is(textarea, [contenteditable="true"], [contenteditable="true"] *) {
  ${inputStack ? `font-family: ${inputStack} !important;` : ""}
  ${ty.inputFontSize > 0 ? `font-size: ${ty.inputFontSize}px !important;` : ""}
}
`);
  }

  const effUserMsgStack = userMsgStack || inputStack;
  if (effUserMsgStack || ty.inputFontSize > 0) {
    chunks.push(`
[data-testid="user-message-bubble"],
[data-testid="user-message-content"],
[data-testid="user-message-content"] :where(p, span, div, li):where(:not(code):not(pre):not(code *):not(pre *)) {
  ${effUserMsgStack ? `font-family: ${effUserMsgStack} !important;` : ""}
  ${ty.inputFontSize > 0 ? `font-size: ${ty.inputFontSize}px !important;` : ""}
}
`);
  }

  if (agentStack) {
    chunks.push(`
[data-testid="agent-response"],
[data-testid="agent-response"] :where([data-markdown-root], p, li, span, div, h1, h2, h3, h4, h5, h6, td, th, blockquote):where(:not(code):not(pre):not(code *):not(pre *):not([data-testid*="thought"] *):not([data-testid*="thinking"] *):not([data-rudex-zone="thinking"] *)) {
  font-family: ${agentStack} !important;
}
`);
  }
  if (ty.agentFontSize > 0) {
    chunks.push(`
[data-testid="agent-response"],
[data-testid="agent-response"] :where([data-markdown-root], p, li, td, th, blockquote):where(:not(code):not(pre):not(code *):not(pre *):not([data-testid*="thought"] *):not([data-testid*="thinking"] *):not([data-rudex-zone="thinking"] *)) {
  font-size: ${ty.agentFontSize}px !important;
}
`);
  }

  if (thinkingStack) {
    chunks.push(`
[data-testid*="thought"], [data-testid*="thought"] :where(p, span, div, li):not(code):not(pre),
[data-testid*="thinking"], [data-testid*="thinking"] :where(p, span, div, li):not(code):not(pre),
[data-rudex-zone="thinking"], [data-rudex-zone="thinking"] * {
  font-family: ${thinkingStack} !important;
}
`);
  }

  if (monoStack || ty.codeFontSize > 0) {
    chunks.push(`
${monoStack ? `:root, html, body {\n  --font-mono: ${monoStack} !important;\n}\n` : ""}code, pre, pre *, kbd, samp, [class*="font-mono"] {
  ${monoStack ? `font-family: ${monoStack} !important;\n  font-variant-ligatures: contextual;` : ""}
  ${ty.codeFontSize > 0 ? `font-size: ${ty.codeFontSize}px !important;` : ""}
}
`);
  }

  if (ty.fontSize !== 14) {
    const fsTargets = [];
    if (ty.agentFontSize <= 0) fsTargets.push('[data-markdown-root]', '[data-testid="agent-response"]');
    if (ty.inputFontSize <= 0) fsTargets.push('[data-testid="user-message-content"]');
    if (fsTargets.length > 0) {
      chunks.push(`
${fsTargets.join(", ")} {
  font-size: ${ty.fontSize}px !important;
}
`);
    }
  }
  if (ty.lineHeight !== 1.55) {
    chunks.push(`
[data-markdown-root], [data-testid="agent-response"], [data-testid="user-message-content"] {
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
[data-testid="model-selector-trigger"]:disabled,
[data-testid="model-selector-trigger"][aria-disabled="true"],
[data-testid="model-selector-trigger"][data-disabled] {
  pointer-events: auto !important;
  cursor: pointer !important;
}
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
  border-color: color-mix(in srgb, ${vars.fgColor} 26%, ${effectiveBorder}) !important;
  outline: none !important;
  box-shadow: none !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
}${hasThemeOverride || hasWallpaper || hasSidebarOverride ? `
:where(aside, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]) :where(a, button, [role="listitem"], [role="treeitem"]):not(#rudex-studio-host *),
:where(header, [data-rudex-bg-header="1"]) :where(button, [role="button"]):not(#rudex-studio-host *) {
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}` : ""}
`);
  }

  if (hasUiStyle) {
    const uiStyleCss = teBuildUiStyleCss(cfg, vars, isLight, hasThemeOverride, hasWallpaper, effectiveBlurPx);
    if (uiStyleCss) chunks.push(uiStyleCss);
  }

  if (hasThemeOverride || hasWallpaper || hasUiStyle) {
    // High-specificity (3,1,1) end-of-stylesheet overrides placed AFTER all border/bg/uiStyle rules:
    // 1) Strips dark rectangle boxes behind header breadcrumb titles & action buttons (beats (2,X,0) bg-black/bg-card rules!)
    // 2) Strips ALL timeline dot capsule borders, rings, shadows & background fills — leaves ONLY the crisp accent dot!
    chunks.push(`
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-header-surface="clean"],
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-header-surface="clean"]::before,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-header-surface="clean"]::after,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) :where([data-rudex-bg-header="1"], header:not(#rudex-studio-host *)) :where(div, nav, section, h1, h2, h3, p, span):not([role="dialog"]):not([role="dialog"] *):not([role="menu"]):not([role="menu"] *):not([role="listbox"]):not([role="listbox"] *):not([role="tooltip"]):not([role="switch"]):not([role="checkbox"]):not([role="progressbar"]):not([data-slot="badge"]):not([class*="badge"]):not([class*="pill"]):not([class*="rounded-full"]):not([contenteditable="true"]):not([data-rudex-ignore="1"]):not(:hover),
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) :where([data-rudex-bg-header="1"], header:not(#rudex-studio-host *)) :where(div, nav, section, h1, h2, h3, p, span):not([role="dialog"]):not([role="dialog"] *):not([role="menu"]):not([role="menu"] *):not([role="listbox"]):not([role="listbox"] *):not([role="tooltip"]):not([role="switch"]):not([role="checkbox"]):not([role="progressbar"]):not([data-slot="badge"]):not([class*="badge"]):not([class*="pill"]):not([class*="rounded-full"]):not([contenteditable="true"]):not([data-rudex-ignore="1"]):not(:hover)::before,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) :where([data-rudex-bg-header="1"], header:not(#rudex-studio-host *)) :where(div, nav, section, h1, h2, h3, p, span):not([role="dialog"]):not([role="dialog"] *):not([role="menu"]):not([role="menu"] *):not([role="listbox"]):not([role="listbox"] *):not([role="tooltip"]):not([role="switch"]):not([role="checkbox"]):not([role="progressbar"]):not([data-slot="badge"]):not([class*="badge"]):not([class*="pill"]):not([class*="rounded-full"]):not([contenteditable="true"]):not([data-rudex-ignore="1"]):not(:hover)::after,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) :where([data-rudex-bg-header="1"], header:not(#rudex-studio-host *)) :where(button, a, [role="button"]):not([class*="bg-primary"]):not([class*="bg-blue-500"]):not([class*="bg-red-"]):not([class*="bg-emerald-"]):not([role="switch"]):not([data-state="open"]):not([data-rudex-ignore="1"]):not(:hover) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-header-btn-fix="1"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  color: ${vars.fgColor} !important;
  border-color: transparent !important;
  box-shadow: none !important;
  border-radius: ${sideRowRad}px !important;
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-header-btn-fix="1"]:hover {
  background-color: ${sidebarItemHoverBg} !important;
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-header-btn-fix="1"] :where(svg, span) {
  color: ${vars.fgColor} !important;
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"],
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"]::before,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"]::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: 0 none transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] *,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] *::before,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] *::after {
  border: 0 none transparent !important;
  border-width: 0 !important;
  border-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
  --tw-shadow: 0 0 #0000 !important;
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] :where(button, [role="button"], a, li, div:not(:empty), span:not(:empty)),
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] :where(button, [role="button"], a, li, div:not(:empty), span:not(:empty))::before,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] :where(button, [role="button"], a, li, div:not(:empty), span:not(:empty))::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] :where([data-rudex-timeline-pill="1"], :where(div, span):empty:where([class*="border"], [class*="ring"], [class*="bg-primary/"], [class*="bg-blue-500/"], [class*="bg-sky-500/"], [class*="bg-indigo-500/"], [class*="bg-accent"], [class*="bg-white/"])) {
  background: transparent !important;
  background-color: transparent !important;
  border: 0 none transparent !important;
  box-shadow: none !important;
  opacity: 0 !important;
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] :where(button, [role="button"], a, div, span):where([aria-current], [aria-selected="true"], [data-active="true"], [data-selected="true"], [data-state="active"], [class*="border-primary"], [class*="border-blue"], [class*="bg-primary/"], [class*="bg-blue-500/"], [class*="ring-"]) :where(span, div):empty:not([data-rudex-timeline-pill="1"]) {
  background-color: ${vars.accentColor} !important;
  border: 0 none transparent !important;
  box-shadow: none !important;
  opacity: 1 !important;
  transform: scale(1.18);
}
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] :where(button, [role="button"], a):hover :where(span, div):empty:not([data-rudex-timeline-pill="1"]) {
  opacity: 1 !important;
  transform: scale(1.15);
}
`);
  }

  if (hasThemeOverride || hasWallpaper || hasSurfaceOverride || hasUiStyle || hasCornersOverride || hasBorderPreset || cfg.borderStrength !== 50) {
    // Never draw an empty horizontal glass/bordered pill before the agent streams its first text or step
    chunks.push(`
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-testid="agent-response"]:empty,
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-testid="agent-response"]:has(> :only-child:empty),
html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-testid="agent-response"][data-rudex-empty-response="1"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  border-left: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  padding: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  min-height: 0 !important;
}
`);
  }

  const overridesCss = teBuildElementOverridesCss(cfg.elementOverrides, cfg.overridesPaused, cfg);
  if (overridesCss) {
    chunks.push(overridesCss);
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
    "data-rudex-timeline-rail",
    "data-rudex-timeline-pill",
    "data-rudex-theme-composer",
    "data-rudex-theme-accent-dot",
    "data-rudex-light-fix",
    "data-rudex-light-text",
    "data-rudex-header-btn-fix",
    "data-rudex-header-surface",
    "data-rudex-sidebar-surface",
    "data-rudex-comp-wrap",
    "data-rudex-comp-dock",
    "data-rudex-comp-stack",
    "data-rudex-comp-top-row",
    "data-rudex-comp-input-row",
    "data-rudex-comp-editor",
    "data-rudex-comp-editor-wrap",
    "data-rudex-comp-placeholder",
    "data-rudex-comp-placeholder-inner",
    "data-rudex-comp-attach-row",
    "data-rudex-comp-empty-slot",
    "data-rudex-comp-toolbar",
    "data-rudex-comp-group",
    "data-rudex-comp-plus",
    "data-rudex-comp-mic",
    "data-rudex-comp-mic-active",
    "data-rudex-comp-voice",
    "data-rudex-comp-model",
    "data-rudex-comp-mode",
    "data-rudex-comp-send",
    "data-rudex-empty-response",
  ];
  const COMP_PART_ATTRS = [
    "data-rudex-comp-wrap",
    "data-rudex-comp-dock",
    "data-rudex-comp-stack",
    "data-rudex-comp-top-row",
    "data-rudex-comp-input-row",
    "data-rudex-comp-editor",
    "data-rudex-comp-editor-wrap",
    "data-rudex-comp-placeholder",
    "data-rudex-comp-placeholder-inner",
    "data-rudex-comp-attach-row",
    "data-rudex-comp-empty-slot",
    "data-rudex-comp-toolbar",
    "data-rudex-comp-group",
    "data-rudex-comp-plus",
    "data-rudex-comp-mic",
    "data-rudex-comp-mic-active",
    "data-rudex-comp-voice",
    "data-rudex-comp-model",
    "data-rudex-comp-mode",
    "data-rudex-comp-send",
  ];
  const SHELL_SCAN_THROTTLE_MS = 350;
  const SHELL_SKIP_TAGS = new Set(["PRE", "CODE", "BUTTON", "INPUT", "TEXTAREA", "FORM", "SVG", "IMG", "VIDEO", "CANVAS", "SCRIPT", "STYLE"]);
  const SHELL_SKIP_ROLES = new Set(["dialog", "alertdialog", "menu", "listbox", "tooltip"]);
  const SHELL_SKIP_TESTIDS = new Set(["user-message-content", "agent-response"]);
  const MUTATION_IGNORE_SELECTOR = '[data-markdown-root], [data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"], [data-browser-hole], #rudex-studio-host, #rudex-bg';
  const PROTECTED_OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [data-radix-popper-content-wrapper], [data-radix-focus-guard], [data-slot*="dialog"], [data-slot*="overlay"], [data-slot*="backdrop"], .agy-overlay, [data-testid="agent-response"], [data-testid="user-message-content"], [data-testid="user-message-bubble"], [data-markdown-root], [data-browser-hole], #rudex-studio-host, #rudex-bg';

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
  let compQuickScanTimer = null;
  let shellRescanTimers = [];
  let lastShellScanAt = 0;
  let shellObserver = null;
  let shellObservedTarget = null;
  let shellWatchersAttached = false;
  let hasPaintedShellScan = false;
  let shellResizeHandler = null;
  let wallpaperActive = false;
  let themeScanActive = false;
  let emptyRespWatchActive = false;
  let bootWallpaperDeferred = Boolean(options.deferWallpaperUntilReady);
  let activeThemeIsLight = false;
  let activeSidebarYiq = 20;
  let lastCssText = "";
  let lastHadThemeOverride = false;
  let pendingFastConfig = null;
  let fastRafId = 0;
  let sendAlignRafId = 0;
  let compResizeObserver = null;
  let observedCompEls = new Set();
  let isWritingInternalStyle = false;
  let isSyncingComposer = false;
  let isSyncingSidebar = false;
  const sideSurfaceMeta = typeof WeakMap === "function" ? new WeakMap() : null;
  const lightFixMeta = typeof WeakMap === "function" ? new WeakMap() : null;

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

  function computeCcSendTopPx(comp, inputRow, sendBtn, inpEl) {
    if (!comp || !inputRow || typeof inputRow.getBoundingClientRect !== "function") return null;
    // Always measure relative to composer root (never a child toolbar/strip!) unless offsetParent is an intentional intermediate wrapper
    const op = sendBtn && sendBtn.offsetParent ? sendBtn.offsetParent : null;
    const isOpToolbar = Boolean(op && typeof op.getAttribute === "function" && op.getAttribute("data-rudex-comp-toolbar") === "1");
    const refParent = op && !isOpToolbar && (op === comp || comp.contains(op)) ? op : comp;
    const refRect = refParent && typeof refParent.getBoundingClientRect === "function"
      ? refParent.getBoundingClientRect()
      : (typeof comp.getBoundingClientRect === "function" ? comp.getBoundingClientRect() : null);
    const ir = inputRow.getBoundingClientRect();
    const sr = sendBtn && typeof sendBtn.getBoundingClientRect === "function" ? sendBtn.getBoundingClientRect() : null;
    const sendH = sr && sr.height >= 16 && sr.height <= 40 ? sr.height : 28;
    if (!ir || !refRect || ir.height < 24) return null;
    const targetInp = inpEl || (typeof inputRow.querySelector === "function" ? inputRow.querySelector('textarea, [contenteditable="true"], [role="textbox"]') : null);
    const inpR = targetInp && typeof targetInp.getBoundingClientRect === "function" ? targetInp.getBoundingClientRect() : null;
    const minTop = Math.max(4, Math.round(ir.top - refRect.top) + 6);
    const maxTop = Math.max(minTop, Math.round(ir.bottom - refRect.top) - sendH - 8);
    // Multiline Reply box: anchor return arrow (↵) cleanly at bottom-right instead of floating halfway up the scrollbar
    const isMultiline = ir.height > 72 && (!inpR || inpR.height > 52);
    if (isMultiline) {
      return maxTop;
    }
    let centerY = ir.top + ir.height / 2;
    if (inpR && inpR.height >= 16 && inpR.height <= 52 && ir.height > inpR.height + 28) {
      centerY = inpR.top + inpR.height / 2;
    }
    const rawTop = Math.round((centerY - refRect.top) - sendH / 2);
    return Math.max(minTop, Math.min(maxTop, rawTop));
  }

  function applyCompSendTop(comp, topPx) {
    if (!comp || !comp.style || typeof comp.style.setProperty !== "function" || typeof topPx !== "number") return;
    const val = `${topPx}px`;
    if (comp.style.getPropertyValue("--rudex-cc-send-top") !== val) {
      isWritingInternalStyle = true;
      try {
        comp.style.setProperty("--rudex-cc-send-top", val);
      } finally {
        isWritingInternalStyle = false;
      }
    }
  }

  function syncObservedComposerResize(composers) {
    if (!win || typeof win.ResizeObserver !== "function") return;
    const nextEls = new Set();
    for (let i = 0; i < composers.length; i += 1) {
      const c = composers[i];
      if (!c) continue;
      nextEls.add(c);
      const ir = typeof c.querySelector === "function" ? c.querySelector('[data-rudex-comp-input-row="1"]') : null;
      if (ir) nextEls.add(ir);
    }
    if (nextEls.size === 0) {
      if (compResizeObserver) {
        try { compResizeObserver.disconnect(); } catch (_e) {}
        compResizeObserver = null;
      }
      observedCompEls.clear();
      return;
    }
    if (!compResizeObserver) {
      try {
        compResizeObserver = new win.ResizeObserver(() => {
          if ((!wallpaperActive && !themeScanActive) || !doc || typeof doc.querySelectorAll !== "function") return;
          const runAlign = () => {
            sendAlignRafId = 0;
            if ((!wallpaperActive && !themeScanActive) || !doc || typeof doc.querySelectorAll !== "function") return;
            const activeComps = doc.querySelectorAll('[data-rudex-theme-composer="1"]');
            for (let i = 0; activeComps && i < activeComps.length; i += 1) {
              const comp = activeComps[i];
              if (!comp || typeof comp.querySelector !== "function") continue;
              const inRow = comp.querySelector('[data-rudex-comp-input-row="1"]');
              if (!inRow) continue;
              const sendEl = comp.querySelector('[data-rudex-comp-send="1"]');
              const topPx = computeCcSendTopPx(comp, inRow, sendEl, null);
              if (topPx !== null) applyCompSendTop(comp, topPx);
            }
          };
          if (win && typeof win.requestAnimationFrame === "function") {
            if (sendAlignRafId) return;
            sendAlignRafId = win.requestAnimationFrame(runAlign);
          } else {
            runAlign();
          }
        });
      } catch (_e) {
        compResizeObserver = null;
        return;
      }
    }
    for (const prev of observedCompEls) {
      if (!nextEls.has(prev)) {
        try { compResizeObserver.unobserve(prev); } catch (_e) {}
      }
    }
    for (const el of nextEls) {
      if (!observedCompEls.has(el)) {
        try { compResizeObserver.observe(el); } catch (_e) {}
      }
    }
    observedCompEls = nextEls;
  }

  function clearWallpaperShells() {
    if (shellScanTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(shellScanTimer);
      shellScanTimer = null;
    }
    if (compQuickScanTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(compQuickScanTimer);
      compQuickScanTimer = null;
    }
    if (sendAlignRafId && win && typeof win.cancelAnimationFrame === "function") {
      try { win.cancelAnimationFrame(sendAlignRafId); } catch (_e) {}
      sendAlignRafId = 0;
    }
    if (compResizeObserver && typeof compResizeObserver.disconnect === "function") {
      try { compResizeObserver.disconnect(); } catch (_e) {}
      compResizeObserver = null;
    }
    observedCompEls.clear();
    clearShellRescanTimers();
    lastShellScanAt = 0;
    shellWatchersAttached = false;
    hasPaintedShellScan = false;
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
        "[data-rudex-bg-shell], [data-rudex-bg-sidebar], [data-rudex-bg-header], [data-rudex-bg-fade], [data-rudex-timeline-rail], [data-rudex-timeline-pill], [data-rudex-theme-composer], [data-rudex-theme-accent-dot], [data-rudex-light-fix], [data-rudex-light-text], [data-rudex-header-btn-fix], [data-rudex-header-surface], [data-rudex-sidebar-surface], [data-rudex-comp-wrap], [data-rudex-comp-dock], [data-rudex-comp-stack], [data-rudex-comp-top-row], [data-rudex-comp-input-row], [data-rudex-comp-editor], [data-rudex-comp-editor-wrap], [data-rudex-comp-placeholder], [data-rudex-comp-placeholder-inner], [data-rudex-comp-attach-row], [data-rudex-comp-empty-slot], [data-rudex-comp-toolbar], [data-rudex-comp-group], [data-rudex-comp-plus], [data-rudex-comp-mic], [data-rudex-comp-mic-active], [data-rudex-comp-voice], [data-rudex-comp-model], [data-rudex-comp-mode], [data-rudex-comp-send], [data-rudex-empty-response]"
      );
      for (let i = 0; marked && i < marked.length; i += 1) {
        if (marked[i] && marked[i].style && typeof marked[i].style.removeProperty === "function") {
          marked[i].style.removeProperty("--rudex-cc-send-top");
        }
        clearShellAttrsOnElement(marked[i]);
      }
    } catch (_e) {}
  }

  function isNodeVisiblyShownInResp(node, stopAt) {
    let cur = node;
    let depth = 0;
    while (cur && cur !== stopAt && depth < 14) {
      if (cur.nodeType === 1) {
        const tag = String(cur.tagName || "").toUpperCase();
        if (tag === "STYLE" || tag === "SCRIPT" || tag === "NOSCRIPT" || tag === "TEMPLATE") return false;
        if (typeof cur.hasAttribute === "function") {
          if (cur.hasAttribute("hidden") || cur.getAttribute("aria-hidden") === "true") return false;
          const tid = String(cur.getAttribute("data-testid") || "").toLowerCase();
          if (tid && (tid.includes("actions") || tid.includes("toolbar"))) return false;
        }
        const cls = typeof cur.className === "string" ? cur.className : "";
        if (cls && /\b(?:sr-only|visually-hidden|hidden|invisible|opacity-0)\b/.test(cls)) return false;
        if (win && typeof win.getComputedStyle === "function") {
          const cs = win.getComputedStyle(cur);
          if (cs) {
            if (cs.display === "none" || cs.visibility === "hidden") return false;
            const op = parseFloat(cs.opacity);
            if (Number.isFinite(op) && op <= 0.02) return false;
          }
        }
        if (typeof cur.getBoundingClientRect === "function") {
          const r = cur.getBoundingClientRect();
          if (r && r.width === 0 && r.height === 0) return false;
        }
      }
      cur = cur.parentElement || cur.parentNode;
      depth += 1;
    }
    return true;
  }

  function hasVisibleTextInsideResp(node, rootEl, depth) {
    if (!node || depth > 14) return false;
    if (node.nodeType === 3) {
      const s = String(node.nodeValue || "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "");
      return s.length > 0;
    }
    if (node.nodeType === 1) {
      if (node !== rootEl && !isNodeVisiblyShownInResp(node, rootEl)) return false;
      const kids = node.childNodes;
      if (kids && typeof kids.length === "number" && kids.length > 0) {
        for (let i = 0; i < kids.length; i += 1) {
          if (hasVisibleTextInsideResp(kids[i], rootEl, depth + 1)) return true;
        }
        return false;
      }
      const raw = String(node.textContent || "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "");
      return raw.length > 0;
    }
    return false;
  }

  function isAgentResponseVisuallyEmpty(el) {
    if (!el || el.nodeType !== 1) return false;
    const wasEmpty = typeof el.getAttribute === "function" && el.getAttribute("data-rudex-empty-response") === "1";
    // Geometric safety net: if live rendered element has <= 4px of inner content height (pure padding pill!), treat as visually empty
    if (!wasEmpty && typeof el.getBoundingClientRect === "function" && win && typeof win.getComputedStyle === "function") {
      try {
        const er = el.getBoundingClientRect();
        if (er && er.width > 60 && er.height > 0 && er.height <= 42) {
          const ecs = win.getComputedStyle(el);
          if (ecs) {
            const padV = (parseFloat(ecs.paddingTop) || 0) + (parseFloat(ecs.paddingBottom) || 0);
            const brdV = (parseFloat(ecs.borderTopWidth) || 0) + (parseFloat(ecs.borderBottomWidth) || 0);
            if (er.height - padV - brdV <= 4) return true;
          }
        }
      } catch (_e) {}
    }
    if (hasVisibleTextInsideResp(el, el, 0)) return false;
    if (typeof el.querySelectorAll === "function") {
      try {
        const visualNodes = el.querySelectorAll('img, video, canvas, iframe, pre, table, hr, [role="progressbar"], [data-rudex-live-slot]');
        for (let i = 0; visualNodes && i < visualNodes.length; i += 1) {
          const vn = visualNodes[i];
          if (!vn || !isNodeVisiblyShownInResp(vn, el)) continue;
          return false;
        }
        const btns = el.querySelectorAll('button, [role="button"]');
        for (let i = 0; btns && i < btns.length; i += 1) {
          const b = btns[i];
          if (!b || !isNodeVisiblyShownInResp(b, el)) continue;
          if (typeof b.getBoundingClientRect === "function") {
            const br = b.getBoundingClientRect();
            if (br && (br.width < 4 || br.height < 4)) continue;
          }
          return false;
        }
      } catch (_e) {}
    }
    return true;
  }

  function syncEmptyAgentResponsesNow() {
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    try {
      const nodes = doc.querySelectorAll('[data-testid="agent-response"]');
      for (let i = 0; nodes && i < nodes.length; i += 1) {
        const el = nodes[i];
        if (!el || el.nodeType !== 1) continue;
        if (typeof el.closest === "function" && el.closest("#rudex-studio-host")) continue;
        const empty = isAgentResponseVisuallyEmpty(el);
        const wasEmpty = typeof el.getAttribute === "function" && el.getAttribute("data-rudex-empty-response") === "1";
        if (empty && !wasEmpty && typeof el.setAttribute === "function") {
          el.setAttribute("data-rudex-empty-response", "1");
        } else if (!empty && wasEmpty && typeof el.removeAttribute === "function") {
          el.removeAttribute("data-rudex-empty-response");
        }
      }
    } catch (_e) {}
  }

  function isHostAppShellPresent() {
    if (!doc || typeof doc.querySelector !== "function") return true;
    try {
      if (doc.querySelector('[data-testid="model-selector-trigger"], [data-testid="user-message-content"], [data-testid="agent-response"]')) {
        return true;
      }
      if (doc.querySelector('textarea, [contenteditable="true"], [data-testid="composer"]') && doc.querySelector('aside, nav, header, main, [data-testid="sidebar"]')) {
        return true;
      }
    } catch (_e) {}
    return false;
  }

  function syncBgBootVisibility() {
    if (!bgLayer) return;
    if (bootWallpaperDeferred) {
      if (typeof bgLayer.setAttribute === "function") bgLayer.setAttribute("data-boot-hidden", "1");
      if (mediaChild && mediaChild.tagName === "VIDEO") safePauseVideo(mediaChild);
    } else {
      if (typeof bgLayer.removeAttribute === "function") bgLayer.removeAttribute("data-boot-hidden");
      if (mediaChild && mediaChild.tagName === "VIDEO" && !(videoPauseWhenHidden && doc && doc.hidden)) {
        safePlayVideo(mediaChild);
      }
    }
  }

  function setBootWallpaperDeferred(nextDeferred) {
    const next = Boolean(nextDeferred);
    if (next === bootWallpaperDeferred) {
      syncBgBootVisibility();
      return;
    }
    bootWallpaperDeferred = next;
    if (!bootWallpaperDeferred && (wallpaperActive || themeScanActive)) {
      if (!hasPaintedShellScan || (doc && typeof doc.querySelector === "function" && !doc.querySelector('[data-rudex-bg-sidebar="1"], [data-rudex-sidebar-surface]'))) {
        scanWallpaperShells();
      }
    }
    syncBgBootVisibility();
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
      if (el.getAttribute("aria-modal") === "true" || el.getAttribute("aria-hidden") === "true") return true;
      const dSlot = el.getAttribute("data-slot") || "";
      if (dSlot && /dialog|overlay|backdrop|modal|popover|sheet|drawer/i.test(dSlot)) return true;
      const dState = el.getAttribute("data-state") || "";
      if (dState === "open" || dState === "closed") {
        const clsStr = typeof el.className === "string" ? el.className : "";
        if (/\b(?:fixed|inset-0|z-50)\b/.test(clsStr)) return true;
      }
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

  function isProtectedForThemeNode(node) {
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
  }

  function hasUntaggedComposerInDoc() {
    if (!doc || typeof doc.querySelectorAll !== "function") return false;
    try {
      const inputs = doc.querySelectorAll('textarea, [contenteditable="true"]');
      for (let i = 0; inputs && i < inputs.length && i < 20; i += 1) {
        const inp = inputs[i];
        if (!inp || isProtectedForThemeNode(inp)) continue;
        if (teHasClass(inp, "inputarea") || teHasClass(inp, "ime-text-area")) continue;
        if (typeof inp.closest === "function" && !inp.closest('[data-rudex-theme-composer="1"]')) {
          return true;
        }
      }
    } catch (_e) {}
    return false;
  }

  /**
   * Ultra-fast (<0.3ms) synchronous composer annotator (Pass C1 + C2 + composer attribute writes + Send alignment).
   * Invoked directly inside the MutationObserver microtask BEFORE Chromium paints the frame so
   * switching chats, typing the first character, or sending a message NEVER flashes stock Antigravity layout.
   */
  function syncComposerPartsNow(rootTargetArg, vwArg, vhArg) {
    const emptyRes = { composerEls: new Set(), composerInfos: [] };
    if ((!wallpaperActive && !themeScanActive) || !doc || !win || typeof win.getComputedStyle !== "function" || isSyncingComposer) {
      return emptyRes;
    }
    if (typeof doc.querySelectorAll !== "function") return emptyRes;
    const rootTarget = rootTargetArg || (typeof doc.querySelector === "function" && doc.querySelector("#root, #app")) || doc.body;
    if (!rootTarget) return emptyRes;
    const vw = Number(vwArg || win.innerWidth) || 0;
    const vh = Number(vhArg || win.innerHeight) || 0;
    if (vw < 100 || vh < 100) return emptyRes;

    isSyncingComposer = true;
    const composerEls = new Set();
    const composerInfos = [];
    const compPartFixes = [];
    const compPartSet = new Set();
    const compDesiredAttrs = new Map();
    const compLayoutMeta = [];

    try {
      const inputs = doc.querySelectorAll('textarea, [contenteditable="true"]');
      const maxComposerW = Math.min(Math.round(vw * 0.94), 1160);
      const maxComposerH = Math.max(480, Math.round(vh * 0.72));
      const breakComposerH = Math.max(540, Math.round(vh * 0.78));
      for (let i = 0; inputs && i < inputs.length && i < 20; i += 1) {
        const inp = inputs[i];
        if (!inp || isProtectedForThemeNode(inp)) continue;
        if (teHasClass(inp, "inputarea") || teHasClass(inp, "ime-text-area")) continue;
        if (typeof inp.getBoundingClientRect === "function") {
          const irCheck = inp.getBoundingClientRect();
          if (irCheck && (irCheck.width < 40 || irCheck.height < 14)) continue;
        }
        let cur = inp.parentElement;
        let depth = 0;
        let best = null;
        let bestRect = null;
        while (cur && cur.nodeType === 1 && depth < 8) {
          if (cur === doc.body || cur === rootTarget || isProtectedForThemeNode(cur)) break;
          if (typeof cur.querySelector === "function") {
            try {
              if (cur.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"]')) break;
            } catch (_e) {}
          }
          if (typeof cur.getBoundingClientRect === "function") {
            const cr = cur.getBoundingClientRect();
            const alreadyComposer = typeof cur.hasAttribute === "function" && cur.hasAttribute("data-rudex-theme-composer");
            if (!alreadyComposer && cr && cr.height > breakComposerH) break;
            const isInnerPart = typeof cur.hasAttribute === "function" && cur.hasAttribute("data-rudex-comp-input-row");
            if (!isInnerPart && cr && cr.width >= 200 && cr.width <= maxComposerW && cr.height >= 36 && (alreadyComposer || cr.height <= maxComposerH)) {
              const isSemanticComposer =
                String(cur.tagName || "").toUpperCase() === "FORM" ||
                (typeof cur.getAttribute === "function" && cur.getAttribute("data-testid") === "composer") ||
                teHasClass(cur, "composer-container");
              const ccs = win.getComputedStyle(cur);
              const hasBorder = ccs && ccs.borderTopWidth && parseFloat(ccs.borderTopWidth) > 0 && teParseBgAlpha(ccs.borderTopColor) >= 0.04;
              const radiusPx = ccs && ccs.borderTopLeftRadius ? parseFloat(ccs.borderTopLeftRadius) : 0;
              if (alreadyComposer || isSemanticComposer || hasComputedBgFill(ccs) || hasBorder || (Number.isFinite(radiusPx) && radiusPx >= 8)) {
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
          composerInfos.push({ el: best, rect: bestRect, inp });
        }
      }

      // Pass C2: Semantic annotation of composer sub-parts (input row, bottom toolbar, +, mic, voice, mode, send)
      const markCompPart = (el, attr, val) => {
        if (!el || el.nodeType !== 1) return;
        compPartSet.add(el);
        if (!compDesiredAttrs.has(el)) compDesiredAttrs.set(el, new Set());
        compDesiredAttrs.get(el).add(attr);
        compPartFixes.push({ el, attr, val: val !== undefined ? String(val) : "1" });
      };
      const directChildUnder = (ancestor, node) => {
        let p = node;
        while (p && p.parentElement && p.parentElement !== ancestor) {
          p = p.parentElement;
        }
        return p && p.parentElement === ancestor ? p : null;
      };
      const findLcaInside = (root, a, b) => {
        if (!root || !a || !b) return null;
        const chainA = new Set();
        let p = a;
        while (p && p !== root.parentElement) {
          chainA.add(p);
          if (p === root) break;
          p = p.parentElement;
        }
        let q = b;
        while (q && q !== root.parentElement) {
          if (chainA.has(q)) return q;
          if (q === root) break;
          q = q.parentElement;
        }
        return root;
      };

      for (let ci = 0; ci < composerInfos.length; ci += 1) {
        const info = composerInfos[ci];
        const comp = info.el;
        const inp = info.inp;
        if (!comp || !inp || typeof comp.querySelectorAll !== "function") continue;
        const modelTrig = comp.querySelector('[data-testid="model-selector-trigger"]');
        const allBtns = Array.from(comp.querySelectorAll('button, [role="button"]')).filter((b) => {
          if (!b || b === inp) return false;
          if (typeof b.getBoundingClientRect !== "function") return true;
          const r = b.getBoundingClientRect();
          return r && r.width > 4 && r.height > 4;
        });
        let anchorBtn = modelTrig || null;
        if (!anchorBtn && allBtns.length > 0) {
          let bestB = null;
          let bestTop = -Infinity;
          for (let bi = 0; bi < allBtns.length; bi += 1) {
            const b = allBtns[bi];
            const br = typeof b.getBoundingClientRect === "function" ? b.getBoundingClientRect() : null;
            const topVal = br ? br.top : 0;
            if (topVal >= bestTop) {
              bestTop = topVal;
              bestB = b;
            }
          }
          anchorBtn = bestB;
        }
        if (!anchorBtn) continue;

        const stack = findLcaInside(comp, inp, anchorBtn);
        if (!stack) continue;
        const inputRow = directChildUnder(stack, inp);
        const toolbar = directChildUnder(stack, anchorBtn);
        if (!inputRow || !toolbar || inputRow === toolbar) continue;

        let stackAnc = stack;
        while (stackAnc && stackAnc !== comp && comp.contains(stackAnc)) {
          markCompPart(stackAnc, "data-rudex-comp-stack");
          stackAnc = stackAnc.parentElement;
        }
        markCompPart(inputRow, "data-rudex-comp-input-row");
        markCompPart(toolbar, "data-rudex-comp-toolbar");

        if (inp !== inputRow) {
          markCompPart(inp, "data-rudex-comp-editor");
          const editorWrapSet = new Set();
          let ew = inp.parentElement;
          let editorBranchChild = inp;
          while (ew && ew !== inputRow && inputRow.contains(ew)) {
            markCompPart(ew, "data-rudex-comp-editor-wrap");
            editorWrapSet.add(ew);
            editorBranchChild = ew;
            ew = ew.parentElement;
          }
          const placeholderSet = new Set();
          if (typeof inputRow.querySelectorAll === "function") {
            const innerNodes = Array.from(inputRow.querySelectorAll("div, span, p"));
            for (let pi = 0; pi < innerNodes.length && pi < 48; pi += 1) {
              const el = innerNodes[pi];
              if (!el || el === inp || editorWrapSet.has(el)) continue;
              if (typeof el.contains === "function" && (el.contains(inp) || (typeof inp.contains === "function" && inp.contains(el)))) continue;
              let insidePh = false;
              let pp = el.parentElement;
              while (pp && pp !== inputRow) {
                if (placeholderSet.has(pp)) {
                  insidePh = true;
                  break;
                }
                pp = pp.parentElement;
              }
              if (insidePh) {
                markCompPart(el, "data-rudex-comp-placeholder-inner");
                continue;
              }
              if (typeof el.querySelector === "function" && el.querySelector('button, [role="button"], input, textarea, img, video, svg, canvas, a')) {
                continue;
              }
              const eTxt = String(el.textContent || "").trim();
              if (!eTxt) continue;
              const eCls = typeof el.className === "string" ? el.className : "";
              if (/\b(?:sr-only|visually-hidden|hidden)\b/i.test(eCls)) continue;
              const ecs = typeof win.getComputedStyle === "function" ? win.getComputedStyle(el) : null;
              if (ecs && (ecs.display === "none" || ecs.visibility === "hidden" || ecs.opacity === "0")) continue;
              if (typeof el.getBoundingClientRect === "function") {
                const er = el.getBoundingClientRect();
                if (er && er.width > 0 && er.height > 0 && (er.width <= 2 || er.height <= 2)) continue;
              }
              const eTid = typeof el.getAttribute === "function" ? String(el.getAttribute("data-testid") || "") : "";
              const isPlaceholderCand =
                (ecs && (ecs.pointerEvents === "none" || ecs.position === "absolute")) ||
                /\b(?:pointer-events-none|absolute|placeholder)\b/i.test(eCls + " " + eTid) ||
                (typeof el.getAttribute === "function" && el.getAttribute("aria-hidden") === "true");
              if (isPlaceholderCand) {
                placeholderSet.add(el);
                let inWrap = false;
                let anc = el.parentElement;
                while (anc && anc !== inputRow) {
                  if (editorWrapSet.has(anc)) {
                    inWrap = true;
                    break;
                  }
                  anc = anc.parentElement;
                }
                markCompPart(el, "data-rudex-comp-placeholder", inWrap ? "wrap" : "row");
              }
            }
          }
          if (inputRow.children && inputRow.children.length > 1) {
            let seenEditorBranch = false;
            for (let si = 0; si < inputRow.children.length; si += 1) {
              const ch = inputRow.children[si];
              if (!ch || ch === editorBranchChild) {
                seenEditorBranch = true;
                continue;
              }
              if (placeholderSet.has(ch)) continue;
              const hasMediaOrCtrl = typeof ch.querySelector === "function" && Boolean(ch.querySelector('button, [role="button"], img, video, svg, canvas, input, textarea'));
              const chTxt = String(ch.textContent || "").trim();
              if (!hasMediaOrCtrl && !chTxt) {
                markCompPart(ch, "data-rudex-comp-empty-slot");
              } else if (!seenEditorBranch) {
                markCompPart(ch, "data-rudex-comp-attach-row");
              }
            }
          }
        }

        // Normalize tight composer footer wrapper chain (depth-independent across New Chat vs Started Chat -> 0px vertical jump!)
        const dockChain = [];
        let dockAnc = comp.parentElement;
        let dockDepth = 0;
        const maxDockH = Math.max(260, Math.round(vh * 0.42));
        while (dockAnc && dockAnc.nodeType === 1 && dockDepth < 4) {
          if (dockAnc === doc.body || dockAnc === rootTarget || isProtectedForThemeNode(dockAnc)) break;
          const aTag = String(dockAnc.tagName || "").toUpperCase();
          if (aTag === "MAIN" || aTag === "BODY" || aTag === "HTML" || aTag === "ASIDE" || aTag === "HEADER" || aTag === "NAV") break;
          if (typeof dockAnc.getAttribute === "function" && dockAnc.getAttribute("data-rudex-bg-shell") === "1") break;
          const aCls = typeof dockAnc.className === "string" ? dockAnc.className : "";
          if (/\b(?:my-auto|m-auto|justify-center)\b/.test(aCls)) break;
          if (typeof dockAnc.querySelector === "function") {
            try {
              if (dockAnc.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"], [data-markdown-root], h1, h2')) break;
            } catch (_e) {}
          }
          if (typeof dockAnc.getBoundingClientRect === "function") {
            const ar = dockAnc.getBoundingClientRect();
            if (ar && ar.height > maxDockH) break;
          }
          dockChain.push(dockAnc);
          dockAnc = dockAnc.parentElement;
          dockDepth += 1;
        }
        if (dockChain.length > 0) {
          for (let di = 0; di < dockChain.length - 1; di += 1) {
            markCompPart(dockChain[di], "data-rudex-comp-wrap");
          }
          markCompPart(dockChain[dockChain.length - 1], "data-rudex-comp-dock");
        }

        let branchChild = inputRow;
        let lvl = stack;
        while (lvl && (lvl === comp || comp.contains(lvl))) {
          if (lvl.children && lvl.children.length > 1) {
            let passedBranch = false;
            for (let si = 0; si < lvl.children.length; si += 1) {
              const ch = lvl.children[si];
              if (ch === branchChild) {
                passedBranch = true;
                continue;
              }
              if (!ch || ch === toolbar || ch === inputRow) continue;
              const chHasMediaOrCtrl = typeof ch.querySelector === "function" && Boolean(ch.querySelector('button, [role="button"], a, img, video, svg, canvas, input, select'));
              const chTxt = String(ch.textContent || "").trim();
              const chCs = typeof win.getComputedStyle === "function" ? win.getComputedStyle(ch) : null;
              const chRect = typeof ch.getBoundingClientRect === "function" ? ch.getBoundingClientRect() : null;
              const chHidden = Boolean(
                (chCs && (chCs.display === "none" || chCs.visibility === "hidden")) ||
                (chRect && chRect.width > 0 && chRect.height > 0 && chRect.height <= 2)
              );
              if (chHidden || (!chTxt && !chHasMediaOrCtrl)) {
                markCompPart(ch, "data-rudex-comp-empty-slot");
              } else if (!passedBranch) {
                markCompPart(ch, "data-rudex-comp-top-row");
              }
            }
          }
          if (lvl === comp) break;
          branchChild = lvl;
          lvl = lvl.parentElement;
        }

        const barBtns = Array.from(toolbar.querySelectorAll('button, [role="button"]')).filter((b) => {
          if (!b) return false;
          if (typeof b.getBoundingClientRect !== "function") return true;
          const r = b.getBoundingClientRect();
          return r && r.width > 4 && r.height > 4;
        });

        const getBtnMeta = (b) => {
          const tid = String((b && b.getAttribute && b.getAttribute("data-testid")) || "").toLowerCase();
          const al = String((b && b.getAttribute && (b.getAttribute("aria-label") || b.getAttribute("title"))) || "").toLowerCase();
          const txt = String((b && b.textContent) || "").trim();
          const cls = typeof (b && b.className) === "string" ? b.className : "";
          return { tid, al, txt, cls };
        };
        const isPlusLabel = (meta) => meta.txt === "+" || /attach|add\s*context|upload|context|контекст|файл|прикреп|добав/i.test(meta.tid + " " + meta.al);
        const isVoiceModeLabel = (meta) => /voice\s*mode|live\s*voice|talk|conversation|audio\s*mode|end\s+voice|start\s+voice\s+mode|голосов[а-яё]*\s*режим|разговор|живой\s*голос/i.test(meta.tid + " " + meta.al);
        const isSendActionLabel = (meta) => /\b(?:send|submit|queue|enqueue)\b|отправ|очеред/i.test(meta.tid + " " + meta.al);
        const isMicLabel = (meta) =>
          !isVoiceModeLabel(meta) &&
          !isSendActionLabel(meta) &&
          /mic|dictat|voice\s*record|speech|transcrib|(?:start|stop|cancel|toggle)\s+(?:voice\s+)?record|(?:mute|unmute|switch)\s+mic|микроф|диктов|запис[а-яё]*\s*голос|голосов[а-яё]*\s*ввод|распознав|(?:начать|остановить|отменить|переключить)\s+запис/i.test(meta.tid + " " + meta.al + " " + meta.txt);
        const isExplicitAgentCancel = (b, meta) => {
          if (!b) return false;
          const tid = meta.tid;
          if (tid === "input-cancel-button" || tid === "cancel-invocation-button") return true;
          return /(?:stop|cancel)\s+(?:generat|agent|exec|stream|respond|invoc|send|task)|(?:останов|отмен|прерв)[а-яё]*\s+(?:генерац|агент|выполнен|ответ|отправ|задач)/i.test(tid + " " + meta.al);
        };
        const isRecordingActiveBtn = (b, meta) => {
          if (!b) return false;
          if (isSendActionLabel(meta)) return false;
          const ga = typeof b.getAttribute === "function" ? (k) => String(b.getAttribute(k) || "").toLowerCase() : () => "";
          if (ga("aria-pressed") === "true" || ga("data-recording") === "true") return true;
          const st = ga("data-state");
          if (st === "recording" || st === "listening") return true;
          const combined = meta.tid + " " + meta.al + " " + meta.txt;
          if (/stop\s+(?:voice\s+)?record|cancel\s+record|stop\s+transcrib|end\s+voice|listening|recording|останов[а-яё]*\s+запис|отмен[а-яё]*\s+запис|останов[а-яё]*\s+распознав|заверш[а-яё]*\s+голосов|слуша/i.test(combined)) {
            return true;
          }
          if (/\b(?:bg-red-|text-red-|bg-rose-|text-rose-|bg-destructive|text-destructive|animate-pulse|animate-ping)/i.test(meta.cls) && !isExplicitAgentCancel(b, meta)) {
            return true;
          }
          if (typeof b.querySelector === "function" && b.querySelector("canvas")) return true;
          if (/^\d{1,2}:\d{2}$/.test(meta.txt)) return true;
          return false;
        };
        const isExplicitSend = (b, meta) => {
          if (!b || b === modelTrig) return false;
          if (isExplicitAgentCancel(b, meta)) return true;
          if (isSendActionLabel(meta) && !isPlusLabel(meta) && !isVoiceModeLabel(meta)) return true;
          if (isPlusLabel(meta) || isMicLabel(meta) || isVoiceModeLabel(meta) || isRecordingActiveBtn(b, meta)) return false;
          if (b.getAttribute && String(b.getAttribute("type") || "").toLowerCase() === "submit") return true;
          if (teHasClass(b, "bg-primary") && meta.txt.length <= 2) return true;
          return false;
        };

        let sendBtn = null;
        for (let bi = 0; bi < barBtns.length; bi += 1) {
          const b = barBtns[bi];
          const meta = getBtnMeta(b);
          if (isExplicitSend(b, meta)) {
            sendBtn = b;
            if (isExplicitAgentCancel(b, meta)) break;
          }
        }
        if (sendBtn) markCompPart(sendBtn, "data-rudex-comp-send");

        const modelIdx = modelTrig ? barBtns.indexOf(modelTrig) : -1;
        let plusBtn = null;
        const micEntries = [];
        let modeBtn = null;
        const voiceEntries = [];

        for (let bi = 0; bi < barBtns.length; bi += 1) {
          const b = barBtns[bi];
          if (b === sendBtn || b === modelTrig) continue;
          const br = typeof b.getBoundingClientRect === "function" ? b.getBoundingClientRect() : null;
          const meta = getBtnMeta(b);
          const txt = meta.txt;
          const isBeforeModel = modelIdx >= 0 ? bi < modelIdx : bi === 0;
          const isRecAct = isRecordingActiveBtn(b, meta);

          if (!plusBtn && !isRecAct && !isMicLabel(meta) && !isVoiceModeLabel(meta) && (isPlusLabel(meta) || (isBeforeModel && !txt && (!br || br.width <= 44)))) {
            plusBtn = b;
            continue;
          }
          if (isMicLabel(meta) || isRecAct) {
            if (isVoiceModeLabel(meta)) {
              voiceEntries.push({ btn: b, active: isRecAct });
            } else {
              micEntries.push({ btn: b, active: isRecAct });
            }
            continue;
          }
          if (isVoiceModeLabel(meta)) {
            voiceEntries.push({ btn: b, active: isRecAct });
            continue;
          }
          if (!modeBtn && txt.length >= 2 && txt.length <= 28 && !/^\d{1,2}:\d{2}$/.test(txt)) {
            modeBtn = b;
            continue;
          }
          if (!txt) {
            const isWhiteCircle = teHasClass(b, "bg-white") || teHasClass(b, "dark:bg-white");
            if (!isWhiteCircle && micEntries.length === 0) {
              micEntries.push({ btn: b, active: false });
            } else {
              voiceEntries.push({ btn: b, active: false });
            }
          }
        }
        const getAtomicSlot = (btn) => {
          if (!btn) return null;
          let slot = btn;
          let p = btn.parentElement;
          while (p && p !== toolbar && toolbar.contains(p)) {
            const subBtns = typeof p.querySelectorAll === "function" ? p.querySelectorAll('button, [role="button"]') : null;
            if (subBtns && subBtns.length === 1) {
              slot = p;
              p = p.parentElement;
              continue;
            }
            break;
          }
          return slot;
        };

        const plusSlot = getAtomicSlot(plusBtn);
        const micSlots = micEntries.map((e) => ({ slot: getAtomicSlot(e.btn), btn: e.btn, active: e.active })).filter((e) => e.slot);
        const modeSlot = getAtomicSlot(modeBtn);
        const modelSlot = getAtomicSlot(modelTrig);
        const voiceSlots = voiceEntries.map((e) => ({ slot: getAtomicSlot(e.btn), btn: e.btn, active: e.active })).filter((e) => e.slot);

        if (plusSlot) markCompPart(plusSlot, "data-rudex-comp-plus");
        for (let mi = 0; mi < micSlots.length; mi += 1) {
          markCompPart(micSlots[mi].slot, "data-rudex-comp-mic");
          if (micSlots[mi].active) {
            markCompPart(micSlots[mi].slot, "data-rudex-comp-mic-active");
            if (micSlots[mi].btn !== micSlots[mi].slot) markCompPart(micSlots[mi].btn, "data-rudex-comp-mic-active");
          }
        }
        if (modeSlot) markCompPart(modeSlot, "data-rudex-comp-mode");
        if (modelSlot && modelSlot !== modelTrig) markCompPart(modelSlot, "data-rudex-comp-model");
        for (let vi = 0; vi < voiceSlots.length; vi += 1) {
          markCompPart(voiceSlots[vi].slot, "data-rudex-comp-voice");
          if (voiceSlots[vi].active) {
            markCompPart(voiceSlots[vi].slot, "data-rudex-comp-mic-active");
            if (voiceSlots[vi].btn !== voiceSlots[vi].slot) markCompPart(voiceSlots[vi].btn, "data-rudex-comp-mic-active");
          }
        }

        const slotAnchors = [plusSlot, ...micSlots.map((m) => m.slot), modeSlot, modelSlot, ...voiceSlots.map((v) => v.slot)].filter(Boolean);
        for (let ki = 0; ki < slotAnchors.length; ki += 1) {
          let p = slotAnchors[ki].parentElement;
          while (p && p !== toolbar && toolbar.contains(p)) {
            markCompPart(p, "data-rudex-comp-group");
            p = p.parentElement;
          }
        }
        if (sendBtn) {
          let p = sendBtn.parentElement;
          while (p && p !== toolbar && toolbar.contains(p)) {
            markCompPart(p, "data-rudex-comp-group");
            p = p.parentElement;
          }
        }

        compLayoutMeta.push({ comp, inputRow, sendBtn, inp });
      }

      // Apply composer root tags & sub-part tags BEFORE measuring --rudex-cc-send-top so Frame #1 is 100% aligned!
      for (const compEl of composerEls) {
        setExclusiveShellAttr(compEl, "data-rudex-theme-composer");
      }
      const prevComps = doc.querySelectorAll('[data-rudex-theme-composer="1"]');
      for (let i = 0; prevComps && i < prevComps.length; i += 1) {
        const pc = prevComps[i];
        if (pc && !composerEls.has(pc)) {
          if (pc.style && typeof pc.style.removeProperty === "function") {
            isWritingInternalStyle = true;
            try { pc.style.removeProperty("--rudex-cc-send-top"); } finally { isWritingInternalStyle = false; }
          }
          if (typeof pc.removeAttribute === "function") pc.removeAttribute("data-rudex-theme-composer");
        }
      }
      const prevCompParts = doc.querySelectorAll(
        "[data-rudex-comp-wrap], [data-rudex-comp-dock], [data-rudex-comp-stack], [data-rudex-comp-top-row], [data-rudex-comp-input-row], [data-rudex-comp-editor], [data-rudex-comp-editor-wrap], [data-rudex-comp-placeholder], [data-rudex-comp-placeholder-inner], [data-rudex-comp-attach-row], [data-rudex-comp-empty-slot], [data-rudex-comp-toolbar], [data-rudex-comp-group], [data-rudex-comp-plus], [data-rudex-comp-mic], [data-rudex-comp-mic-active], [data-rudex-comp-voice], [data-rudex-comp-model], [data-rudex-comp-mode], [data-rudex-comp-send]"
      );
      for (let i = 0; prevCompParts && i < prevCompParts.length; i += 1) {
        const pc = prevCompParts[i];
        if (!pc || typeof pc.removeAttribute !== "function") continue;
        const desired = compDesiredAttrs.get(pc);
        for (let a = 0; a < COMP_PART_ATTRS.length; a += 1) {
          const attrName = COMP_PART_ATTRS[a];
          if (pc.hasAttribute(attrName) && (!desired || !desired.has(attrName))) {
            pc.removeAttribute(attrName);
          }
        }
      }
      for (let i = 0; i < compPartFixes.length; i += 1) {
        const cf = compPartFixes[i];
        if (cf && cf.el && typeof cf.el.setAttribute === "function" && cf.el.getAttribute(cf.attr) !== cf.val) {
          cf.el.setAttribute(cf.attr, cf.val);
        }
      }

      // Compute & apply exact Send arrow vertical offset AFTER styled attributes are in place
      const alignedComps = [];
      for (let i = 0; i < compLayoutMeta.length; i += 1) {
        const lm = compLayoutMeta[i];
        const topPx = computeCcSendTopPx(lm.comp, lm.inputRow, lm.sendBtn, lm.inp);
        if (topPx !== null) {
          applyCompSendTop(lm.comp, topPx);
          alignedComps.push(lm.comp);
        }
      }
      syncObservedComposerResize(Array.from(composerEls));

      if (alignedComps.length > 0 && win && typeof win.requestAnimationFrame === "function") {
        if (sendAlignRafId && typeof win.cancelAnimationFrame === "function") {
          try { win.cancelAnimationFrame(sendAlignRafId); } catch (_e) {}
        }
        sendAlignRafId = win.requestAnimationFrame(() => {
          sendAlignRafId = 0;
          if (!wallpaperActive && !themeScanActive) return;
          for (let i = 0; i < alignedComps.length; i += 1) {
            const comp = alignedComps[i];
            if (!comp || typeof comp.querySelector !== "function") continue;
            const inRow = comp.querySelector('[data-rudex-comp-input-row="1"]');
            if (!inRow) continue;
            const sendEl = comp.querySelector('[data-rudex-comp-send="1"]');
            const topPx = computeCcSendTopPx(comp, inRow, sendEl, null);
            if (topPx !== null) applyCompSendTop(comp, topPx);
          }
        });
      }
    } catch (_e) {
    } finally {
      isSyncingComposer = false;
    }
    return { composerEls, composerInfos };
  }

  function scanWallpaperShells() {
    if (emptyRespWatchActive || wallpaperActive || themeScanActive) {
      syncEmptyAgentResponsesNow();
    }
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
    let composerEls = new Set();

    const isLikelyComposerContainer = (node) => {
      if (!node || node.nodeType !== 1) return false;
      if (typeof node.hasAttribute === "function" && (node.hasAttribute("data-rudex-theme-composer") || node.hasAttribute("data-rudex-comp-input-row") || node.hasAttribute("data-rudex-comp-stack"))) {
        return true;
      }
      if (typeof node.querySelector === "function") {
        try {
          if (node.querySelector('textarea, [contenteditable="true"]') && !node.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"]')) {
            if (typeof node.getBoundingClientRect === "function") {
              const nr = node.getBoundingClientRect();
              if (nr && nr.width <= Math.min(Math.round(vw * 0.94), 1180) && nr.height <= Math.max(540, Math.round(vh * 0.78))) {
                return true;
              }
            }
          }
        } catch (_e) {}
      }
      return false;
    };

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
      if (!wallpaperActive) return false;
      if (typeof node.hasAttribute === "function" && node.hasAttribute("data-rudex-bg-header")) return true;
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
          } else if (rect.width >= vw * 0.42 && rect.height >= vh * 0.42 && !isLikelyComposerContainer(el)) {
            attr = "data-rudex-bg-shell";
          } else if (rect.top <= 88 && rect.height >= 22 && rect.height <= 74 && rect.width >= vw * 0.35) {
            attr = "data-rudex-bg-header";
          }
          if (attr) {
            const cs = win.getComputedStyle(el);
            const isFixedOverlay = cs && cs.position === "fixed" && tag !== "HEADER" && tag !== "ASIDE" && tag !== "NAV";
            const bgAlpha = cs ? teParseBgAlpha(cs.backgroundColor) : 0;
            const isTranslucentBackdrop = attr === "data-rudex-bg-shell" && bgAlpha > 0 && bgAlpha < 0.85 && cs && (cs.position === "fixed" || cs.position === "absolute");
            if (isFixedOverlay || isTranslucentBackdrop) {
              plans.push({ el, attr: "", hasBg: false });
            } else {
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
          // Skip React portals mounted directly under document.body outside #root/#app (e.g., Radix Dialog backdrops)
          const isBodyPortal =
            rootTarget !== doc.body &&
            doc.body &&
            typeof doc.body.contains === "function" &&
            doc.body.contains(hitEl) &&
            typeof rootTarget.contains === "function" &&
            !rootTarget.contains(hitEl);
          if (isBodyPortal) {
            continue;
          }
          hitPointEls.push(hitEl);
          if (visitedSet.has(hitEl)) continue;
          visitedSet.add(hitEl);
          if (typeof hitEl.getBoundingClientRect !== "function") continue;
          const r = hitEl.getBoundingClientRect();
          if (!r || r.width <= 0 || r.height <= 0) continue;
          const hitCs = win.getComputedStyle(hitEl);
          const hitTag = String(hitEl.tagName || "").toUpperCase();
          if (hitCs && hitCs.position === "fixed" && hitTag !== "HEADER" && hitTag !== "ASIDE" && hitTag !== "NAV") {
            continue;
          }
          let hitAttr = "";
          if (r.left <= 20 && r.width >= 140 && r.width <= 400 && r.height >= vh * 0.50) {
            hitAttr = "data-rudex-bg-sidebar";
          } else if (r.width >= vw * 0.42 && r.height >= vh * 0.42 && !isLikelyComposerContainer(hitEl)) {
            const hitBgAlpha = hitCs ? teParseBgAlpha(hitCs.backgroundColor) : 0;
            if (hitBgAlpha > 0 && hitBgAlpha < 0.85 && hitCs && hitCs.position === "absolute") continue;
            hitAttr = "data-rudex-bg-shell";
          } else if (r.top <= 88 && r.height >= 22 && r.height <= 74 && r.width >= vw * 0.35) {
            hitAttr = "data-rudex-bg-header";
          }
          if (hitAttr) {
            const cs = hitCs;
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

    const extraFixAttrsByEl = new Map();
    const extraFixes = [];
    const recordExtraFix = (el, attr, val) => {
      if (!el || !attr) return;
      let am = extraFixAttrsByEl.get(el);
      if (!am) {
        am = new Map();
        extraFixAttrsByEl.set(el, am);
      }
      am.set(attr, val);
      extraFixes.push({ el, attr, val });
    };

    // Pass C: Semantic composer container (shared single source of truth), scroll-fade bar cleanup, and sidebar blue unread dot unification
    if ((themeScanActive || wallpaperActive) && typeof doc.querySelectorAll === "function") {
      const isProtectedForTheme = isProtectedForThemeNode;
      const syncedComp = syncComposerPartsNow(rootTarget, vw, vh);
      composerEls = syncedComp.composerEls;
      const composerInfos = syncedComp.composerInfos;

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
        const tryMarkFade = (node, allowWrappingComposer, allowNarrowFade) => {
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
          if (!fr || fr.height < 6) return;
          if (fr.left <= 20 && fr.width <= 400 && fr.height >= vh * 0.50) return;
          const maxFadeH = allowWrappingComposer ? Math.min(440, Math.round(vh * 0.54)) : 180;
          if (fr.top < 58 || fr.height > maxFadeH) return;
          const fcs = win.getComputedStyle(node);
          if (!fcs) return;
          const alreadyFade = typeof node.hasAttribute === "function" && node.hasAttribute("data-rudex-bg-fade");
          let hasGradient = Boolean(fcs.backgroundImage && fcs.backgroundImage.indexOf("gradient(") >= 0);
          const hasMask = Boolean((fcs.maskImage && fcs.maskImage !== "none") || (fcs.webkitMaskImage && fcs.webkitMaskImage !== "none"));
          if (!hasGradient && (allowWrappingComposer || allowNarrowFade)) {
            try {
              const bcs = win.getComputedStyle(node, "::before");
              const acs = win.getComputedStyle(node, "::after");
              if ((bcs && bcs.backgroundImage && bcs.backgroundImage.indexOf("gradient(") >= 0) || (acs && acs.backgroundImage && acs.backgroundImage.indexOf("gradient(") >= 0)) {
                hasGradient = true;
              }
            } catch (_e) {}
          }
          const isEmptyPointerNone = fcs.pointerEvents === "none" && (!node.children || node.children.length === 0) && !String(node.textContent || "").trim();
          const minW = (allowNarrowFade && isEmptyPointerNone && (hasGradient || hasMask) && fr.top >= vh * 0.45) ? 4 : vw * 0.28;
          if (fr.width < minW) return;
          const hasShadow = Boolean(fcs.boxShadow && fcs.boxShadow !== "none");
          const hasBackdrop = Boolean((fcs.backdropFilter && fcs.backdropFilter !== "none") || (fcs.webkitBackdropFilter && fcs.webkitBackdropFilter !== "none"));
          const isPointerNoneOverlay = (wallpaperActive || themeScanActive) && fcs.pointerEvents === "none" && (hasComputedBgFill(fcs) || hasShadow || hasBackdrop);
          const isOpaqueWrapperUnderTheme = allowWrappingComposer && (wallpaperActive || themeScanActive) && (hasComputedBgFill(fcs) || hasShadow || hasBackdrop);
          if (alreadyFade || hasGradient || hasMask || isPointerNoneOverlay || isOpaqueWrapperUnderTheme) {
            plans.push({ el: node, attr: "data-rudex-bg-fade", hasBg: true });
          }
        };

        // Check wide wrapper ancestors & their siblings above/around the composer card (e.g. full-width bottom dock with gradient fade)
        for (let ci = 0; ci < composerInfos.length; ci += 1) {
          const info = composerInfos[ci];
          let anc = info.el.parentElement;
          let up = 0;
          while (anc && anc.nodeType === 1 && up < 5) {
            if (anc === doc.body || anc === rootTarget) break;
            if (typeof anc.getBoundingClientRect === "function") {
              const ar = anc.getBoundingClientRect();
              if (ar && info.rect && ar.width >= Math.max(info.rect.width + 40, vw * 0.36)) {
                tryMarkFade(anc, true, false);
              }
            }
            if (anc.children && anc.children.length > 0) {
              for (let si = 0; si < anc.children.length && si < 24; si += 1) {
                const sib = anc.children[si];
                if (!sib || sib === info.el) continue;
                tryMarkFade(sib, false, true);
                if (sib.children && sib.children.length > 0 && sib.children.length <= 6) {
                  for (let sj = 0; sj < sib.children.length; sj += 1) {
                    tryMarkFade(sib.children[sj], false, true);
                  }
                }
              }
            }
            anc = anc.parentElement;
            up += 1;
          }
          // Dynamic point probes directly above & left of the composer (catches tall composer with attached screenshots)
          if (info.rect && typeof doc.elementsFromPoint === "function") {
            const cr = info.rect;
            const probeYs = [
              Math.max(72, Math.round(cr.top - 42)),
              Math.max(72, Math.round(cr.top - 22)),
              Math.max(72, Math.round(cr.top - 8)),
              Math.max(72, Math.round(cr.top + 8)),
            ];
            const probeXs = [
              Math.max(40, Math.round(cr.left - 36)),
              Math.round(cr.left + 24),
              Math.round(cr.left + cr.width * 0.5),
            ];
            for (let py = 0; py < probeYs.length; py += 1) {
              for (let px = 0; px < probeXs.length; px += 1) {
                try {
                  const chits = doc.elementsFromPoint(probeXs[px], probeYs[py]);
                  if (Array.isArray(chits)) {
                    for (let chi = 0; chi < chits.length && chi < 14; chi += 1) {
                      tryMarkFade(chits[chi], false, true);
                    }
                  }
                } catch (_e) {}
              }
            }
          }
        }

        for (let hi = 0; hi < hitPointEls.length; hi += 1) {
          tryMarkFade(hitPointEls[hi], false, false);
        }

        // Targeted scan for gradient / fade / pointer-events-none overlays anywhere in the chat DOM (even in long chats > 360 divs)
        try {
          const targetedFades = rootTarget.querySelectorAll('[class*="bg-gradient-"], [class*="bg-linear-"], [class*="pointer-events-none"], [class*="fade"]');
          for (let ti = 0; targetedFades && ti < targetedFades.length && ti < 240; ti += 1) {
            tryMarkFade(targetedFades[ti], false, true);
          }
        } catch (_e) {}

        const fadeCands = rootTarget.querySelectorAll("div, section, footer");
        for (let fi = 0; fadeCands && fi < fadeCands.length && fi < 360; fi += 1) {
          tryMarkFade(fadeCands[fi], false, false);
        }

        // Clear narrow vertical timeline/gutter rails inside conversation-view/main (e.g. 28px x 800px rail with navigation dots)
        // so wallpaper stays clean while child indicator dots keep 100% contrast!
        try {
          const railChecked = new Set();
          const railParents = rootTarget.querySelectorAll('[data-testid="conversation-view"], [data-testid="chat-container"], main');
          for (let rpi = 0; railParents && rpi < railParents.length && rpi < 8; rpi += 1) {
            const rp = railParents[rpi];
            if (!rp || isProtectedForTheme(rp) || typeof rp.querySelectorAll !== "function") continue;
            const railCands = rp.querySelectorAll("div, aside, nav");
            for (let rci = 0; railCands && rci < railCands.length && rci < 160; rci += 1) {
              const rc = railCands[rci];
              if (!rc || railChecked.has(rc) || isProtectedForTheme(rc) || isRelatedToComposer(rc)) continue;
              railChecked.add(rc);
              if (typeof rc.getBoundingClientRect !== "function") continue;
              const rr = rc.getBoundingClientRect();
              if (!rr || rr.width < 8 || rr.width > 48 || rr.height < vh * 0.35) continue;
              if (typeof rc.closest === "function" && rc.closest('aside, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"], [data-testid="agent-response"], [data-testid="user-message-content"]')) continue;
              const rcs = win.getComputedStyle(rc);
              if (!rcs) continue;
              const hasRailBg = hasComputedBgFill(rcs) || Boolean(rcs.backgroundImage && rcs.backgroundImage.indexOf("gradient(") >= 0);
              const hasRailBlur = Boolean((rcs.backdropFilter && rcs.backdropFilter !== "none") || (rcs.webkitBackdropFilter && rcs.webkitBackdropFilter !== "none"));
              const hasRailShadow = Boolean(rcs.boxShadow && rcs.boxShadow !== "none");
              const railBtns = typeof rc.querySelectorAll === "function" ? rc.querySelectorAll('button, [role="button"]') : [];
              const hasTimelineDots = Boolean(railBtns && railBtns.length >= 2);
              if (hasTimelineDots) {
                recordExtraFix(rc, "data-rudex-timeline-rail", "1");
                // Also detect any standalone empty wide horizontal capsule/pill inside the rail (>=14px wide) so CSS hides it cleanly while preserving tiny circular dots
                try {
                  const railNodes = rc.querySelectorAll("div, span");
                  for (let rni = 0; railNodes && rni < railNodes.length && rni < 120; rni += 1) {
                    const rn = railNodes[rni];
                    if (!rn || (rn.children && rn.children.length > 0) || typeof rn.getBoundingClientRect !== "function") continue;
                    const rnr = rn.getBoundingClientRect();
                    if (rnr && rnr.width >= 14 && rnr.height > 0 && rnr.height <= 26 && rnr.width > rnr.height * 1.25) {
                      recordExtraFix(rn, "data-rudex-timeline-pill", "1");
                    }
                  }
                } catch (_e) {}
              }
              if (hasRailBg || hasRailBlur || hasRailShadow) {
                plans.push({ el: rc, attr: "data-rudex-bg-fade", hasBg: true });
              }
            }
          }
        } catch (_e) {}
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

    // Pass D: Neutralize mismatched dark header buttons & inner title/icon boxes (all custom themes & wallpapers) + light-theme dark surfaces
    if ((themeScanActive || wallpaperActive) && typeof doc.querySelectorAll === "function") {
      try {
        const isProtectedFixNode = (node) => {
          if (!node || node.nodeType !== 1) return true;
          const id = node.id || "";
          if (id === HOST_ID || id === BG_ID || id === STYLE_ID) return true;
          const tag = String(node.tagName || "").toUpperCase();
          if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SVG" || tag === "PRE" || tag === "CODE" || tag === "SCRIPT" || tag === "STYLE") return true;
          if (typeof node.getAttribute === "function") {
            if (node.getAttribute(IGNORE_ATTR) === "1") return true;
            const role = node.getAttribute("role");
            if (role === "switch" || role === "checkbox") return true;
          }
          if (typeof node.closest === "function") {
            try {
              if (node.closest('#rudex-studio-host, #rudex-bg, pre, code, [data-rudex-ignore="1"]')) return true;
            } catch (_e) {}
          }
          return false;
        };

        // D1. Mismatched dark/black header action buttons (e.g. right sidebar toggle [◫]) AND dark title/wrapper boxes
        // (e.g. "antigravity-ru / Chat Title" rectangle) inside the top 0..86px header band.
        // Gather via header subtrees + horizontal elementsFromPoint sweep + full fallback so long sidebars (>180 buttons) NEVER starve the top bar!
        const topCandSet = new Set();
        const pushTopCand = (el) => {
          if (!el || el.nodeType !== 1 || topCandSet.has(el) || isProtectedFixNode(el)) return;
          if (el === doc.body || el === doc.documentElement || el === rootTarget || headerElSet.has(el)) return;
          if (typeof el.hasAttribute === "function" && (el.hasAttribute("data-rudex-bg-header") || el.hasAttribute("data-rudex-bg-sidebar") || el.hasAttribute("data-rudex-bg-shell"))) return;
          topCandSet.add(el);
        };
        const hdrSubNodes = rootTarget.querySelectorAll('header :where(button, [role="button"], a, div, span, nav), [data-rudex-bg-header="1"] :where(button, [role="button"], a, div, span, nav)');
        for (let i = 0; hdrSubNodes && i < hdrSubNodes.length && i < 240; i += 1) pushTopCand(hdrSubNodes[i]);
        if (typeof doc.elementsFromPoint === "function") {
          const hdrYs = [16, 44, 52];
          const hdrXs = [
            Math.min(180, Math.round(vw * 0.14)),
            Math.min(310, Math.round(vw * 0.24)),
            Math.min(460, Math.round(vw * 0.36)),
            Math.round(vw * 0.52),
            Math.max(320, vw - 170),
            Math.max(320, vw - 96),
            Math.max(320, vw - 54),
            Math.max(320, vw - 20),
          ];
          for (let yi = 0; yi < hdrYs.length; yi += 1) {
            for (let xi = 0; xi < hdrXs.length; xi += 1) {
              try {
                const hits = doc.elementsFromPoint(hdrXs[xi], hdrYs[yi]);
                if (Array.isArray(hits)) {
                  for (let hi = 0; hi < hits.length && hi < 14; hi += 1) pushTopCand(hits[hi]);
                }
              } catch (_e) {}
            }
          }
        }
        // Fallback sweep across top-band buttons & containers (up to 1200 nodes, skipping sidebar & chat messages)
        const allTopBtns = rootTarget.querySelectorAll('button, [role="button"], [data-rudex-header-btn-fix="1"], [data-rudex-header-surface="clean"], div, span, a, h1, h2, p');
        for (let i = 0; allTopBtns && i < allTopBtns.length && i < 1200; i += 1) {
          const el = allTopBtns[i];
          if (!el || topCandSet.has(el) || typeof el.getBoundingClientRect !== "function") continue;
          const r = el.getBoundingClientRect();
          if (!r || r.top < -2 || r.bottom > 86 || r.height < 14 || r.height > 56 || r.width < 14) continue;
          if (typeof el.closest === "function" && el.closest('aside, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"], [data-testid="agent-response"], [data-testid="user-message-content"]')) continue;
          pushTopCand(el);
        }

        for (const node of topCandSet) {
          if (!node || typeof node.getBoundingClientRect !== "function") continue;
          const br = node.getBoundingClientRect();
          if (!br || br.width < 14 || br.height < 14 || br.height > 56 || br.top < -2 || br.bottom > 86) continue;
          // Never strip the full-width top bar container itself
          const tag = String(node.tagName || "").toUpperCase();
          if (tag === "HEADER" || tag === "MAIN" || tag === "ASIDE" || br.width >= vw * 0.62) continue;
          if (typeof node.closest === "function" && node.closest('aside, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]')) continue;
          const role = typeof node.getAttribute === "function" ? (node.getAttribute("role") || "") : "";
          const isBtn = tag === "BUTTON" || tag === "A" || role === "button";
          const alreadyBtnFix = typeof node.getAttribute === "function" && node.getAttribute("data-rudex-header-btn-fix") === "1";
          const alreadySurfFix = typeof node.getAttribute === "function" && node.getAttribute("data-rudex-header-surface") === "clean";
          if (alreadyBtnFix) {
            recordExtraFix(node, "data-rudex-header-btn-fix", "1");
            continue;
          }
          if (alreadySurfFix) {
            recordExtraFix(node, "data-rudex-header-surface", "clean");
            continue;
          }
          const bcs = win.getComputedStyle(node);
          if (!bcs) continue;
          const bg = parseRgbaColor(bcs.backgroundColor);
          if (!bg || bg.a < 0.25 || bg.chroma > 36) continue;
          if (isBtn) {
            const isBadDarkOnLight = activeThemeIsLight && bg.yiq < 135;
            const isBadDarkOnTheme = !activeThemeIsLight && (bg.yiq < 42 || (wallpaperActive && bg.a >= 0.45 && bg.yiq < 62));
            if (isBadDarkOnLight || isBadDarkOnTheme) {
              recordExtraFix(node, "data-rudex-header-btn-fix", "1");
            }
          } else if (br.top >= 10) {
            // Non-button dark rectangle inside the header row (e.g. breadcrumb "antigravity-ru / Chat Title" or icon wrapper behind [◫])
            const isBadDarkBox = activeThemeIsLight ? bg.yiq < 135 : bg.yiq < 42;
            if (isBadDarkBox) {
              recordExtraFix(node, "data-rudex-header-surface", "clean");
            }
          }
        }

        // D2. Hardcoded dark sidebar/composer/surface chips & invisible light text when a light theme is active over dark Antigravity DOM
        if (activeThemeIsLight) {
          const isExplicitLightSideAct = (node) => Boolean(node && node.getAttribute && (
            node.getAttribute("aria-current") === "page" ||
            node.getAttribute("aria-current") === "true" ||
            node.getAttribute("aria-selected") === "true" ||
            node.getAttribute("data-active") === "true" ||
            node.getAttribute("data-selected") === "true" ||
            (node.getAttribute("data-state") === "active" && node.getAttribute("role") !== "tab")
          ));
          const sideContainers = doc.querySelectorAll('aside, nav[aria-label], [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]');
          const checkedSide = new Set();
          for (let s = 0; sideContainers && s < sideContainers.length && s < 6; s += 1) {
            const sc = sideContainers[s];
            if (!sc || isProtectedFixNode(sc)) continue;
            const items = sc.querySelectorAll("div, a, button, li, section");
            for (let j = 0; items && j < items.length && j < 260; j += 1) {
              const el = items[j];
              if (!el || checkedSide.has(el) || isProtectedFixNode(el)) continue;
              checkedSide.add(el);
              if (el.getAttribute && el.getAttribute("data-rudex-bg-sidebar") === "1") continue;
              const curCls = typeof el.className === "string" ? el.className : "";
              const prevFix = typeof el.getAttribute === "function" ? el.getAttribute("data-rudex-light-fix") : "";
              const prevTextFix = typeof el.getAttribute === "function" ? el.getAttribute("data-rudex-light-text") : "";
              const isAct = isExplicitLightSideAct(el);
              if (prevFix) {
                const lfMeta = lightFixMeta ? lightFixMeta.get(el) : null;
                if (prevFix === "sidebar-active") {
                  if (isAct) {
                    recordExtraFix(el, "data-rudex-light-fix", "sidebar-active");
                    if (lightFixMeta) lightFixMeta.set(el, { val: "sidebar-active", cls: curCls });
                    continue;
                  }
                  if (lfMeta && lfMeta.cls !== curCls) {
                    // Active class was removed -> drop stale light fix cleanly instead of freezing grey
                    continue;
                  }
                } else if (!lfMeta || lfMeta.cls === curCls) {
                  const nextVal = isAct ? "sidebar-active" : "sidebar";
                  recordExtraFix(el, "data-rudex-light-fix", nextVal);
                  if (lightFixMeta) lightFixMeta.set(el, { val: nextVal, cls: curCls });
                  continue;
                }
              }
              if (prevTextFix === "1") {
                recordExtraFix(el, "data-rudex-light-text", "1");
                continue;
              }
              const cs = win.getComputedStyle(el);
              if (!cs) continue;
              const bg = parseRgbaColor(cs.backgroundColor);
              if (bg && bg.a >= 0.35 && bg.yiq < 105 && bg.chroma <= 38) {
                const nextVal = isAct ? "sidebar-active" : "sidebar";
                recordExtraFix(el, "data-rudex-light-fix", nextVal);
                if (lightFixMeta) lightFixMeta.set(el, { val: nextVal, cls: curCls });
              } else {
                const fg = parseRgbaColor(cs.color);
                if (fg && fg.a >= 0.45 && fg.yiq > 165 && fg.chroma <= 34) {
                  recordExtraFix(el, "data-rudex-light-text", "1");
                }
              }
            }
          }

          const compAndMain = doc.querySelectorAll('[data-rudex-theme-composer="1"] :where(button, a, div, span), header :where(button, a, div, span), [data-rudex-bg-header="1"] :where(button, a, div, span)');
          for (let k = 0; compAndMain && k < compAndMain.length && k < 220; k += 1) {
            const el = compAndMain[k];
            if (!el || extraFixAttrsByEl.has(el) || isProtectedFixNode(el)) continue;
            if (el.getAttribute && (el.getAttribute("data-rudex-theme-composer") === "1" || el.getAttribute("data-rudex-bg-header") === "1" || el.getAttribute("data-rudex-comp-send") === "1" || el.getAttribute("data-rudex-comp-voice") === "1" || el.getAttribute("data-rudex-comp-mic-active") === "1")) continue;
            if (typeof el.closest === "function") {
              try {
                if (el.closest('[data-rudex-comp-send="1"], [data-rudex-comp-voice="1"], [data-rudex-comp-mic-active="1"]')) continue;
              } catch (_e) {}
            }
            // Do not repaint thumbnail containers that wrap an uploaded image
            if (typeof el.querySelector === "function" && el.querySelector("img, video, canvas")) continue;
            if (typeof el.getBoundingClientRect === "function") {
              const er = el.getBoundingClientRect();
              if (!er || er.width > vw * 0.72 || er.height > vh * 0.55) continue;
            }
            const prevFix = typeof el.getAttribute === "function" ? el.getAttribute("data-rudex-light-fix") : "";
            const prevTextFix = typeof el.getAttribute === "function" ? el.getAttribute("data-rudex-light-text") : "";
            if (prevFix) {
              recordExtraFix(el, "data-rudex-light-fix", prevFix);
              continue;
            }
            if (prevTextFix === "1") {
              recordExtraFix(el, "data-rudex-light-text", "1");
              continue;
            }
            const cs = win.getComputedStyle(el);
            if (!cs) continue;
            const bg = parseRgbaColor(cs.backgroundColor);
            if (bg && bg.a >= 0.42 && bg.yiq < 95 && bg.chroma <= 34) {
              const inHdr = typeof el.closest === "function" && Boolean(el.closest('header, [data-rudex-bg-header="1"]'));
              recordExtraFix(el, "data-rudex-light-fix", inHdr ? "header" : "surface");
            } else {
              const fg = parseRgbaColor(cs.color);
              if (fg && fg.a >= 0.45 && fg.yiq > 210 && fg.chroma <= 30) {
                // Only fix light text if its own background is NOT an intentional dark/colored accent pill
                if (!bg || bg.a < 0.35 || bg.yiq > 140) {
                  recordExtraFix(el, "data-rudex-light-text", "1");
                }
              }
            }
          }
        }
      } catch (_e) {}
    }

    // Phase 2 (Write-only): batch attribute updates after all reads finish (composer tags already written in syncComposerPartsNow)
    for (let i = 0; i < plans.length; i += 1) {
      const p = plans[i];
      if (composerEls.has(p.el)) continue;
      if (p.attr && (p.hasBg || (typeof p.el.hasAttribute === "function" && p.el.hasAttribute(p.attr)))) {
        setExclusiveShellAttr(p.el, p.attr);
      } else if (!(typeof p.el.hasAttribute === "function" && p.el.hasAttribute("data-rudex-theme-composer"))) {
        clearShellAttrsOnElement(p.el);
      }
    }
    try {
      const managedAttrs = ["data-rudex-light-fix", "data-rudex-light-text", "data-rudex-header-btn-fix", "data-rudex-header-surface", "data-rudex-timeline-rail", "data-rudex-timeline-pill"];
      const prevFixes = doc.querySelectorAll("[data-rudex-light-fix], [data-rudex-light-text], [data-rudex-header-btn-fix], [data-rudex-header-surface], [data-rudex-timeline-rail], [data-rudex-timeline-pill]");
      for (let i = 0; prevFixes && i < prevFixes.length; i += 1) {
        const pf = prevFixes[i];
        if (!pf || typeof pf.removeAttribute !== "function") continue;
        const desiredMap = extraFixAttrsByEl.get(pf);
        for (let a = 0; a < managedAttrs.length; a += 1) {
          const attrName = managedAttrs[a];
          if ((!desiredMap || !desiredMap.has(attrName)) && pf.getAttribute(attrName) !== null) {
            pf.removeAttribute(attrName);
          }
        }
      }
      for (let i = 0; i < extraFixes.length; i += 1) {
        const fx = extraFixes[i];
        if (fx && fx.el && typeof fx.el.setAttribute === "function" && fx.el.getAttribute(fx.attr) !== fx.val) {
          fx.el.setAttribute(fx.attr, fx.val);
        }
      }
    } catch (_e) {}

    // Pass D3: synchronous sidebar surface flattener & live active chat highlight tracker
    const sideRootsFromPlans = [];
    for (let i = 0; i < plans.length; i += 1) {
      if (plans[i].attr === "data-rudex-bg-sidebar" && plans[i].el) sideRootsFromPlans.push(plans[i].el);
    }
    syncSidebarSurfacesNow(sideRootsFromPlans);
    if (plans.length > 0 || composerEls.size > 0 || sideRootsFromPlans.length > 0 || extraFixes.length > 0) {
      hasPaintedShellScan = true;
    }
  }

  function parseRgbaColor(str) {
    const s = String(str || "").trim().toLowerCase();
    if (!s || s === "transparent" || s === "none") return null;
    let r = NaN;
    let g = NaN;
    let b = NaN;
    let a = 1;
    const parseAlpha = (rawA) => {
      if (rawA === undefined || rawA === null || rawA === "") return 1;
      return rawA.endsWith("%") ? parseFloat(rawA) / 100 : parseFloat(rawA);
    };
    const mRgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(s);
    if (mRgb) {
      r = parseFloat(mRgb[1]);
      g = parseFloat(mRgb[2]);
      b = parseFloat(mRgb[3]);
      a = parseAlpha(mRgb[4]);
    } else {
      const mSrgb = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(s);
      if (mSrgb) {
        r = Math.max(0, Math.min(255, parseFloat(mSrgb[1]) * 255));
        g = Math.max(0, Math.min(255, parseFloat(mSrgb[2]) * 255));
        b = Math.max(0, Math.min(255, parseFloat(mSrgb[3]) * 255));
        a = parseAlpha(mSrgb[4]);
      } else {
        // Tailwind v4 / Chromium CSS Color 4 oklch() / oklab()
        const mOklch = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(s);
        const mOklab = !mOklch ? /^oklab\(\s*([\d.]+%?)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(s) : null;
        if (mOklch || mOklab) {
          const m = mOklch || mOklab;
          const L = m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
          let oa = 0;
          let ob = 0;
          if (mOklch) {
            const C = parseFloat(m[2]);
            const Hrad = (parseFloat(m[3]) * Math.PI) / 180;
            oa = C * Math.cos(Hrad);
            ob = C * Math.sin(Hrad);
          } else {
            oa = parseFloat(m[2]);
            ob = parseFloat(m[3]);
          }
          a = parseAlpha(m[4]);
          const l_ = L + 0.3963377774 * oa + 0.2158037573 * ob;
          const m_ = L - 0.1055613458 * oa - 0.0638541728 * ob;
          const s_ = L - 0.0894841775 * oa - 1.2914855480 * ob;
          const l3 = l_ * l_ * l_;
          const m3 = m_ * m_ * m_;
          const s3 = s_ * s_ * s_;
          const toSrgb = (c) => {
            const clamped = Math.max(0, Math.min(1, c));
            return Math.round((clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
          };
          r = toSrgb(+4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3);
          g = toSrgb(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3);
          b = toSrgb(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3);
        } else {
          return null;
        }
      }
    }
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b) || !Number.isFinite(a)) return null;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    return { r, g, b, a, yiq, chroma };
  }

  /**
   * Fast synchronous sidebar surface flattener & active-chat tracker (Pass D3).
   * - Flattens nested pitch-black structural panels (e.g. dark sidebar boxes) to "panel" and opaque pitch-black static cards to "item".
   * - Tracks active chat rows live (explicit aria-current/aria-selected/data-active/data-state="active" AND React class-divergent sibling rows).
   * - NEVER freezes stale "active" or "item" tags across chat switches or hover states: removes attribute immediately (0ms) when state/class clears.
   */
  function syncSidebarSurfacesNow(extraSideRoots) {
    if ((!wallpaperActive && !themeScanActive) || !doc || !win || typeof win.getComputedStyle !== "function" || isSyncingSidebar) return;
    if (typeof doc.querySelectorAll !== "function") return;
    isSyncingSidebar = true;
    try {
      const isProtectedSideSurface = (node) => {
        if (!node || node.nodeType !== 1) return true;
        const id = node.id || "";
        if (id === HOST_ID || id === BG_ID || id === STYLE_ID) return true;
        const tag = String(node.tagName || "").toUpperCase();
        if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SVG" || tag === "PRE" || tag === "CODE" || tag === "SCRIPT" || tag === "STYLE") return true;
        if (typeof node.getAttribute === "function") {
          if (node.getAttribute(IGNORE_ATTR) === "1") return true;
          const role = node.getAttribute("role");
          if (role === "switch" || role === "checkbox" || role === "tab") return true;
        }
        if (typeof node.closest === "function") {
          try {
            if (node.closest('#rudex-studio-host, #rudex-bg, pre, code, [data-rudex-ignore="1"]')) return true;
          } catch (_e) {}
        }
        return false;
      };
      const isExplicitSideActive = (node) => {
        if (!node || typeof node.getAttribute !== "function") return false;
        const ac = node.getAttribute("aria-current");
        if (ac === "page" || ac === "true") return true;
        if (node.getAttribute("aria-selected") === "true") return true;
        if (node.getAttribute("data-active") === "true") return true;
        if (node.getAttribute("data-selected") === "true") return true;
        const ds = node.getAttribute("data-state");
        const role = node.getAttribute("role") || "";
        if (ds === "active" && role !== "tab") return true;
        return false;
      };
      const isNodeHovered = (node) => {
        if (!node || typeof node.matches !== "function") return false;
        try { return Boolean(node.matches(":hover")); } catch (_e) { return false; }
      };

      const sideRootSet = new Set();
      if (Array.isArray(extraSideRoots)) {
        for (let i = 0; i < extraSideRoots.length; i += 1) {
          if (extraSideRoots[i]) sideRootSet.add(extraSideRoots[i]);
        }
      }
      const domSides = doc.querySelectorAll('aside, nav[aria-label], [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]');
      for (let s = 0; domSides && s < domSides.length; s += 1) {
        sideRootSet.add(domSides[s]);
      }

      const desiredSurface = new Map();
      const checked = new Set();
      const siblingGroups = new Map();

      for (const sc of sideRootSet) {
        if (!sc || isProtectedSideSurface(sc) || typeof sc.querySelectorAll !== "function") continue;
        const nodes = sc.querySelectorAll('div, section, ul, ol, li, a, button, header, nav, [role="listitem"], [role="treeitem"], [role="button"]');
        for (let j = 0; nodes && j < nodes.length && j < 340; j += 1) {
          const el = nodes[j];
          if (!el || el === sc || checked.has(el) || isProtectedSideSurface(el)) continue;
          checked.add(el);
          if (typeof el.getAttribute === "function" && el.getAttribute("data-rudex-bg-sidebar") === "1") continue;
          if (typeof el.getAttribute === "function" && el.getAttribute("data-rudex-theme-accent-dot") === "1") continue;
          const rect = typeof el.getBoundingClientRect === "function" ? el.getBoundingClientRect() : null;
          if (rect && rect.width > 0 && rect.height > 0 && rect.width <= 18 && rect.height <= 18) continue;

          const tag = String(el.tagName || "").toUpperCase();
          const role = typeof el.getAttribute === "function" ? (el.getAttribute("role") || "") : "";
          const curCls = typeof el.className === "string" ? el.className.replace(/\s+/g, " ").trim() : "";
          const isInteractiveLeaf = tag === "A" || tag === "BUTTON" || role === "button" || role === "listitem" || role === "treeitem" || role === "option";
          const isAct = isExplicitSideActive(el);
          const prevSurf = typeof el.getAttribute === "function" ? (el.getAttribute("data-rudex-sidebar-surface") || "") : "";
          const prevMeta = sideSurfaceMeta ? sideSurfaceMeta.get(el) : null;

          // Collect candidate leaf chat rows per parent for sibling-based active detection (when no aria-current is set)
          // Strictly exclude action/navigation buttons like "+ Новый чат" / "New Chat" / "Settings" / accordions / dropdown triggers!
          const hasConvAttr = typeof el.getAttribute === "function" && Boolean(
            el.getAttribute("data-conversation-id") || el.getAttribute("data-cascade-id") || el.getAttribute("data-session-id") || el.getAttribute("data-chat-id")
          );
          const isAccordionOrPopup = typeof el.hasAttribute === "function" && (el.hasAttribute("aria-expanded") || el.hasAttribute("aria-haspopup"));
          const rawLeafTxt = !hasConvAttr ? String(el.textContent || "").replace(/\s+/g, " ").trim() : "";
          const isStaticNavActionBtn = !hasConvAttr && /^(?:\+\s*)?(?:новый чат|new chat|new conversation|автоматизац[а-яё]*|automations?|кастомизац[а-яё]*|customiz[a-z]*|настройки|settings|проекты|projects|чаты|chats|входящие|inbox|поиск|search|архив|archive|обновлен[а-яё]*|updates?|браузер|browser|навыки|skills|агенты|agents)$/i.test(rawLeafTxt);
          if ((isInteractiveLeaf || hasConvAttr) && !isAccordionOrPopup && !isStaticNavActionBtn && el.parentElement) {
            const p = el.parentElement;
            let grp = siblingGroups.get(p);
            if (!grp) {
              grp = [];
              siblingGroups.set(p, grp);
            }
            grp.push({ el, cls: curCls, isAct, prevSurf, hasConvAttr });
          }

          // 1) Explicit active state ALWAYS wins (and NEVER sticks once isAct turns false!)
          if (isAct) {
            desiredSurface.set(el, { val: "active", cls: curCls });
            continue;
          }

          // 2) Preserve previously flattened static "panel" or "item" ONLY while className has not changed
          if (prevSurf === "panel" && (!prevMeta || prevMeta.cls === curCls)) {
            desiredSurface.set(el, { val: "panel", cls: curCls });
            continue;
          }
          const cs = win.getComputedStyle(el);
          if (!cs) continue;
          const isStickyHeaderRow = cs.position === "sticky";
          if (prevSurf === "item" && (!prevMeta || prevMeta.cls === curCls) && !isNodeHovered(el) && !isAccordionOrPopup && !isStickyHeaderRow) {
            desiredSurface.set(el, { val: "item", cls: curCls });
            continue;
          }
          // If prevSurf === "active" and isAct is now false: DO NOT preserve blindly!
          if (prevSurf === "active") {
            continue;
          }

          const bg = parseRgbaColor(cs.backgroundColor);
          const hasGradBg = Boolean(cs.backgroundImage && cs.backgroundImage.indexOf("gradient(") >= 0);

          let hasNestedItems = false;
          if (!isInteractiveLeaf && typeof el.querySelector === "function") {
            try {
              const subInteractive = el.querySelector('a, button, [role="button"], [role="listitem"], [role="treeitem"], ul, ol');
              const subCount = el.children ? el.children.length : 0;
              const tallEnough = !rect || rect.height === 0 || rect.height >= 48;
              if ((subInteractive && tallEnough) || subCount >= 2 || isStickyHeaderRow) {
                hasNestedItems = true;
              }
            } catch (_e) {}
          }
          const isStructuralPanel = isStickyHeaderRow || (!isInteractiveLeaf && (hasNestedItems || tag === "SECTION" || tag === "UL" || tag === "OL" || tag === "HEADER" || tag === "NAV"));

          if (isStructuralPanel) {
            const isDarkPanel = Boolean(bg && bg.a >= 0.35 && bg.chroma <= 28 && (activeThemeIsLight ? bg.yiq < 135 : bg.yiq < 72));
            const isWallpaperDarkPanel = Boolean(wallpaperActive && bg && bg.a >= 0.35 && bg.chroma <= 28 && !activeThemeIsLight && bg.yiq < 105);
            if (isDarkPanel || isWallpaperDarkPanel || hasGradBg || (isStickyHeaderRow && bg && bg.a >= 0.04)) {
              desiredSurface.set(el, { val: "panel", cls: curCls });
            }
          } else if (!isNodeHovered(el)) {
            // Only flatten truly opaque pitch-black static cards; collapsible folder headers (aria-expanded) & section headers flatten cleanly to transparent ("panel") instead of sharp full-bleed grey bars!
            const isPitchBlackStaticItem = Boolean(bg && bg.a >= 0.72 && bg.chroma <= 24 && (activeThemeIsLight ? bg.yiq < 105 : bg.yiq < 36));
            if (isPitchBlackStaticItem) {
              const isFolderOrSectionRow = isAccordionOrPopup || /^(?:проекты|projects|чаты|chats|рабочие области|workspaces)$/i.test(rawLeafTxt);
              desiredSurface.set(el, { val: isFolderOrSectionRow ? "panel" : "item", cls: curCls });
            }
          }
        }
      }

      // Exact unprefixed Tailwind/CSS active-state token checker:
      // NEVER matches hover:*, focus:*, group-hover:*, active:* modifiers (prevents hover flicker on "+ Новый чат" and other buttons!)
      const isUnprefixedActiveToken = (rawTok) => {
        if (!rawTok) return false;
        const tok = String(rawTok).trim();
        if (!tok) return false;
        let base = tok;
        if (tok.includes(":")) {
          if (tok.startsWith("dark:") && tok.indexOf(":", 5) === -1) {
            base = tok.slice(5);
          } else {
            return false;
          }
        }
        return (
          base === "active" ||
          base === "is-active" ||
          base === "selected" ||
          base === "is-selected" ||
          base === "current" ||
          base === "bg-sidebar-accent" ||
          base === "bg-accent" ||
          base === "bg-zinc-800" ||
          base === "bg-neutral-800" ||
          base === "bg-gray-800" ||
          base === "bg-slate-800" ||
          base === "bg-muted" ||
          base === "bg-secondary" ||
          /^bg-(?:white|zinc-800|neutral-800|gray-800|slate-800|muted|secondary|accent|sidebar-accent)\//.test(base)
        );
      };
      const hasAddedActiveToken = (clsStr, baselineSet) => {
        const toks = clsStr ? clsStr.split(/\s+/) : [];
        for (let i = 0; i < toks.length; i += 1) {
          const t = toks[i];
          if (!t || (baselineSet && baselineSet.has(t))) continue;
          if (isUnprefixedActiveToken(t)) return true;
        }
        return false;
      };

      // Sibling-based active chat detection for lists that mark the selected chat purely via React className (no aria-current).
      // Purely compares exact added unprefixed class tokens (never computed :hover backgroundColor!), so mouse movement can NEVER flicker!
      siblingGroups.forEach((grp) => {
        if (!grp || grp.length < 2) return;
        let hasExplicit = false;
        const clsCounts = new Map();
        for (let i = 0; i < grp.length; i += 1) {
          if (grp[i].isAct) { hasExplicit = true; break; }
          clsCounts.set(grp[i].cls, (clsCounts.get(grp[i].cls) || 0) + 1);
        }
        if (hasExplicit) return;
        let majorityCls = "";
        let majorityCnt = 0;
        clsCounts.forEach((cnt, clsKey) => {
          if (cnt > majorityCnt) { majorityCnt = cnt; majorityCls = clsKey; }
        });
        const candidates = [];
        if (grp.length >= 3 && majorityCnt >= 2) {
          const majTokens = new Set(majorityCls ? majorityCls.split(/\s+/) : []);
          for (let i = 0; i < grp.length; i += 1) {
            const g = grp[i];
            if (g.cls === majorityCls) continue;
            if (hasAddedActiveToken(g.cls, majTokens)) {
              candidates.push(g);
            }
          }
        } else if (grp.length === 2 && grp[0].cls !== grp[1].cls) {
          const t0 = new Set(grp[0].cls ? grp[0].cls.split(/\s+/) : []);
          const t1 = new Set(grp[1].cls ? grp[1].cls.split(/\s+/) : []);
          const a0 = hasAddedActiveToken(grp[0].cls, t1);
          const a1 = hasAddedActiveToken(grp[1].cls, t0);
          if (a0 !== a1) {
            candidates.push(a0 ? grp[0] : grp[1]);
          }
        }
        if (candidates.length === 1) {
          const winner = candidates[0];
          desiredSurface.set(winner.el, { val: "active", cls: winner.cls });
        }
      });

      // Write-only batch for data-rudex-sidebar-surface (clears stale active/item rows immediately!)
      const prevNodes = doc.querySelectorAll("[data-rudex-sidebar-surface]");
      for (let i = 0; prevNodes && i < prevNodes.length; i += 1) {
        const pf = prevNodes[i];
        if (!pf || typeof pf.removeAttribute !== "function") continue;
        if (!desiredSurface.has(pf)) {
          pf.removeAttribute("data-rudex-sidebar-surface");
          if (sideSurfaceMeta) sideSurfaceMeta.delete(pf);
        }
      }
      desiredSurface.forEach((info, el) => {
        if (el && typeof el.setAttribute === "function") {
          if (el.getAttribute("data-rudex-sidebar-surface") !== info.val) {
            el.setAttribute("data-rudex-sidebar-surface", info.val);
          }
          if (sideSurfaceMeta) sideSurfaceMeta.set(el, { val: info.val, cls: info.cls });
        }
      });
    } catch (_e) {
    } finally {
      isSyncingSidebar = false;
    }
  }

  const DICTATION_ANIM_TAGS = new Set(["SVG", "PATH", "RECT", "CIRCLE", "LINE", "POLYLINE", "POLYGON", "G", "CANVAS"]);

  function isDictationActiveInDoc() {
    if (!doc) return false;
    try {
      if (doc.documentElement && typeof doc.documentElement.getAttribute === "function" && doc.documentElement.getAttribute("data-rudex-dictating") === "1") {
        return true;
      }
      if (typeof doc.querySelectorAll !== "function") return false;
      const cands = doc.querySelectorAll(
        '[data-rudex-comp-mic-active="1"], button[aria-label="Stop recording"], button[aria-label*="stop record" i], button[aria-label*="остановить запись" i], button[data-tooltip-id="input-send-button-record-tooltip"].bg-red-500'
      );
      for (let i = 0; cands && i < cands.length; i += 1) {
        const b = cands[i];
        if (!b) continue;
        if (typeof b.getAttribute === "function") {
          if (b.getAttribute("data-rudex-comp-send") === "1") continue;
          const meta = `${b.getAttribute("data-testid") || ""} ${b.getAttribute("aria-label") || ""} ${b.getAttribute("title") || ""}`;
          if (/\b(?:send|submit|queue|enqueue)\b|отправ|очеред/i.test(meta)) continue;
        }
        return true;
      }
      return false;
    } catch (_e) {
      return false;
    }
  }

  function scheduleQuickComposerScan() {
    if (!wallpaperActive && !themeScanActive) return;
    syncComposerPartsNow();
  }

  function scheduleShellScan() {
    if (!wallpaperActive && !themeScanActive) return;
    if (!win || typeof win.setTimeout !== "function") {
      scanWallpaperShells();
      return;
    }
    if (shellScanTimer) return;
    const baseThrottle = isDictationActiveInDoc() ? Math.max(1200, SHELL_SCAN_THROTTLE_MS) : SHELL_SCAN_THROTTLE_MS;
    const elapsed = Date.now() - lastShellScanAt;
    const delay = elapsed >= baseThrottle ? baseThrottle : Math.max(180, baseThrottle - elapsed);
    shellScanTimer = win.setTimeout(() => {
      shellScanTimer = null;
      if (!wallpaperActive && !themeScanActive) return;
      const didScan = ensureShellWatchers();
      if (!didScan) scanWallpaperShells();
    }, delay);
  }

  function ensureShellWatchers() {
    if ((!wallpaperActive && !themeScanActive && !emptyRespWatchActive) || !doc || !win) return false;
    const preferredRoot = typeof doc.querySelector === "function" ? doc.querySelector("#root, #app") : null;
    const watchTarget = preferredRoot || doc.body;
    if (!watchTarget) {
      shellWatchersAttached = false;
      if (doc.readyState === "loading") scheduleDomReadyRetry();
      return false;
    }

    const isFirstAttach = !shellWatchersAttached;
    let didScan = false;
    if (!shellWatchersAttached || (preferredRoot && shellObservedTarget !== preferredRoot)) {
      if (wallpaperActive || themeScanActive) {
        scanWallpaperShells();
      } else if (emptyRespWatchActive) {
        syncEmptyAgentResponsesNow();
      }
      didScan = true;
    }

    if (isFirstAttach && (wallpaperActive || themeScanActive) && typeof win.setTimeout === "function") {
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
            if ((!wallpaperActive && !themeScanActive && !emptyRespWatchActive) || isWritingInternalStyle || isSyncingComposer || isSyncingSidebar) return;
            let needsComposerSync = false;
            let needsSidebarSync = false;
            let needsFullShellScan = false;
            let needsEmptyRespSync = false;
            let sawChildListOutsideEditor = false;
            const fullWatchActive = wallpaperActive || themeScanActive;
            for (let i = 0; i < muts.length; i += 1) {
              const m = muts[i];
              if (m.type === "attributes" && (SHELL_ATTRS.indexOf(m.attributeName) >= 0 || COMP_PART_ATTRS.indexOf(m.attributeName) >= 0)) continue;
              if (m.type === "attributes" && m.attributeName === "style" && m.target && typeof m.target.hasAttribute === "function" && m.target.hasAttribute("data-rudex-theme-composer")) continue;
              if (emptyRespWatchActive || fullWatchActive) {
                if (m.type === "characterData") {
                  const pEl = m.target && (m.target.parentElement || m.target.parentNode);
                  if (pEl && typeof pEl.closest === "function") {
                    try {
                      if (pEl.closest('[data-testid="agent-response"][data-rudex-empty-response="1"]')) {
                        needsEmptyRespSync = true;
                      }
                    } catch (_e) {}
                  }
                  continue;
                }
                if (m.type === "childList") {
                  if (m.target && typeof m.target.closest === "function") {
                    try {
                      const respHost = m.target.closest('[data-testid="agent-response"]');
                      if (respHost && ((typeof respHost.getAttribute === "function" && respHost.getAttribute("data-rudex-empty-response") === "1") || (m.removedNodes && m.removedNodes.length > 0))) {
                        needsEmptyRespSync = true;
                      }
                    } catch (_e) {}
                  }
                  if (!needsEmptyRespSync && m.addedNodes && m.addedNodes.length > 0) {
                    for (let ai = 0; ai < m.addedNodes.length; ai += 1) {
                      const an = m.addedNodes[ai];
                      if (!an || an.nodeType !== 1) continue;
                      const isResp = (typeof an.getAttribute === "function" && an.getAttribute("data-testid") === "agent-response") ||
                        (typeof an.querySelector === "function" && Boolean(an.querySelector('[data-testid="agent-response"]')));
                      if (isResp) {
                        needsEmptyRespSync = true;
                        break;
                      }
                    }
                  }
                }
              } else if (m.type === "characterData") {
                continue;
              }
              if (!fullWatchActive) continue;
              if (isIgnoredMutationTarget(m.target)) continue;
              const isSideActiveAttr = m.type === "attributes" && (
                m.attributeName === "aria-current" ||
                m.attributeName === "aria-selected" ||
                m.attributeName === "data-active" ||
                m.attributeName === "data-selected" ||
                m.attributeName === "data-state"
              );
              const isStateAttr = isSideActiveAttr || (m.type === "attributes" && (m.attributeName === "aria-label" || m.attributeName === "aria-pressed" || m.attributeName === "type"));
              const tTag = m.target && m.target.tagName ? String(m.target.tagName).toUpperCase() : "";
              if (!isStateAttr && tTag && DICTATION_ANIM_TAGS.has(tTag)) continue;
              // Skip pure style/animation mutations (virtualizer translateY, shimmers, spinners, progress bars) that never change shell structure
              if (m.type === "attributes" && m.attributeName === "style" && m.target && typeof m.target.closest === "function") {
                try {
                  if (m.target.closest('[data-testid="agent-response"], [data-testid="user-message-bubble"], [data-index], [role="progressbar"], .animate-spin, .animate-pulse')) continue;
                } catch (_se) {}
              }
              if (m.target && typeof m.target.closest === "function") {
                try {
                  // Skip Lexical text edits inside the editor node itself, but DO catch placeholder/slot mounts on editor-wrap & input-row!
                  if (m.target.closest('[contenteditable="true"], [role="textbox"], [data-rudex-comp-editor="1"]')) continue;
                  const insideComposer = Boolean(m.target.closest('[data-rudex-theme-composer="1"]'));
                  if (insideComposer) {
                    if (!isStateAttr && m.type === "attributes" && m.attributeName === "style" && m.target.closest('[data-rudex-comp-mic-active="1"], [data-rudex-comp-mic="1"], [data-rudex-comp-voice="1"]')) {
                      continue;
                    }
                    if (m.type === "childList" || isStateAttr || m.attributeName === "class") {
                      needsComposerSync = true;
                      continue;
                    }
                  }
                  const insideSidebar = Boolean(m.target.closest('aside, nav[aria-label], [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]'));
                  if (insideSidebar) {
                    // Ignore Radix tooltip hover state flips (data-state="closed" <-> "delayed-open"/"instant-open") on sidebar buttons!
                    if (m.type === "attributes" && m.attributeName === "data-state") {
                      const dsVal = typeof m.target.getAttribute === "function" ? (m.target.getAttribute("data-state") || "") : "";
                      const wasAct = typeof m.target.getAttribute === "function" && m.target.getAttribute("data-rudex-sidebar-surface") === "active";
                      if (dsVal === "active" || dsVal === "inactive" || wasAct) {
                        needsSidebarSync = true;
                      }
                      continue;
                    }
                    if (isSideActiveAttr || m.attributeName === "class") {
                      needsSidebarSync = true;
                      continue;
                    }
                    if (m.type === "childList") {
                      needsSidebarSync = true;
                    }
                  }
                } catch (_e) {}
              }
              if (m.type === "childList" && m.addedNodes && m.addedNodes.length > 0) {
                sawChildListOutsideEditor = true;
              }
              needsFullShellScan = true;
            }
            if (needsEmptyRespSync) {
              syncEmptyAgentResponsesNow();
            }
            if (!needsComposerSync && fullWatchActive && sawChildListOutsideEditor && hasUntaggedComposerInDoc()) {
              needsComposerSync = true;
            }
            if (needsComposerSync && fullWatchActive) {
              if (compQuickScanTimer && win && typeof win.clearTimeout === "function") {
                win.clearTimeout(compQuickScanTimer);
                compQuickScanTimer = null;
              }
              // Tag composer & buttons synchronously inside MutationObserver microtask (BEFORE browser paints frame -> 0ms flash!)
              syncComposerPartsNow();
            }
            if (needsSidebarSync && fullWatchActive) {
              // Sync active chat highlight & sidebar panels synchronously inside microtask (0ms switch, zero stuck highlights!)
              syncSidebarSurfacesNow();
            }
            if (bootWallpaperDeferred && isHostAppShellPresent()) {
              if (fullWatchActive) scanWallpaperShells();
              bootWallpaperDeferred = false;
              syncBgBootVisibility();
            } else if (needsFullShellScan && fullWatchActive) {
              // On initial React app mount (before first painted shell scan) or whenever sidebar/header just mounted,
              // scan SYNCHRONOUSLY inside MutationObserver microtask so Frame 1 NEVER flashes stock Antigravity UI!
              const needImmediateBootScan = Boolean(
                sawChildListOutsideEditor && (
                  !hasPaintedShellScan ||
                  (typeof doc.querySelector === "function" &&
                    !doc.querySelector('[data-rudex-bg-sidebar="1"], [data-rudex-sidebar-surface]') &&
                    doc.querySelector('aside, [data-testid="sidebar"], header, [data-testid="conversation-view"]'))
                )
              );
              if (needImmediateBootScan) {
                scanWallpaperShells();
              } else {
                scheduleShellScan();
              }
            }
          });
          shellObserver.observe(watchTarget, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "aria-label", "aria-pressed", "aria-current", "aria-selected", "data-active", "data-selected", "data-state", "type"] });
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
    } else if (doc.head && typeof doc.head.appendChild === "function" && (node.parentNode !== doc.head || (doc.head.lastElementChild && doc.head.lastElementChild !== node))) {
      // Keep Rudex theme stylesheet at the very end of <head> so early t=0ms injection ALWAYS overrides Antigravity's later <link> stylesheets
      doc.head.appendChild(node);
    }
    if (node.textContent !== cssText) {
      node.textContent = cssText;
    }
    styleNode = node;
  }

  function ensureBgLayer(canvasBgHint) {
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
      layer.style.width = "100%";
      layer.style.height = "100%";
      layer.style.zIndex = mountTarget === doc.body ? "-1" : "0";
      layer.style.pointerEvents = "none";
      layer.style.overflow = "hidden";
      if (canvasBgHint) layer.style.backgroundColor = canvasBgHint;
      if (mountTarget.firstChild && typeof mountTarget.insertBefore === "function") {
        mountTarget.insertBefore(layer, mountTarget.firstChild);
      } else {
        mountTarget.appendChild(layer);
      }
    } else if (canvasBgHint && layer.style) {
      layer.style.backgroundColor = canvasBgHint;
    }
    bgLayer = layer;
    syncBgBootVisibility();
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

    const rvBg = cfg.presetId !== "native" ? teResolveThemeVars(cfg) : null;
    const layer = ensureBgLayer(rvBg ? rvBg.canvasBg : "");
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
    const baseScale = wp.scale / 100;
    const effScale = wp.blur > 0 ? (wp.scale >= 100 ? Math.max(baseScale, 1.06) : baseScale * 1.04) : baseScale;
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
        vid.style.minWidth = "100%";
        vid.style.minHeight = "100%";
        vid.style.maxWidth = "none";
        vid.style.maxHeight = "none";
        vid.style.display = "block";
        vid.style.pointerEvents = "none";
        const beforeOverlay = (tintChild && tintChild.parentNode === layer)
          ? tintChild
          : ((vignetteChild && vignetteChild.parentNode === layer)
            ? vignetteChild
            : ((scrimChild && scrimChild.parentNode === layer) ? scrimChild : null));
        if (beforeOverlay && typeof layer.insertBefore === "function") {
          layer.insertBefore(vid, beforeOverlay);
        } else {
          layer.appendChild(vid);
        }
        mediaChild = vid;
        activeVideoUrl = resolvedSrc;
        if (!bootWallpaperDeferred && !(videoPauseWhenHidden && doc && doc.hidden)) {
          safePlayVideo(vid);
        }
      } else if (prevPauseWhenHidden && !videoPauseWhenHidden && !bootWallpaperDeferred) {
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
        img.style.minWidth = "100%";
        img.style.minHeight = "100%";
        img.style.maxWidth = "none";
        img.style.maxHeight = "none";
        img.style.display = "block";
        img.style.pointerEvents = "none";
        const beforeOverlay = (tintChild && tintChild.parentNode === layer)
          ? tintChild
          : ((vignetteChild && vignetteChild.parentNode === layer)
            ? vignetteChild
            : ((scrimChild && scrimChild.parentNode === layer) ? scrimChild : null));
        if (beforeOverlay && typeof layer.insertBefore === "function") {
          layer.insertBefore(img, beforeOverlay);
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

      const beforeOverlay = (tintChild && tintChild.parentNode === layer)
        ? tintChild
        : ((vignetteChild && vignetteChild.parentNode === layer)
          ? vignetteChild
          : ((scrimChild && scrimChild.parentNode === layer) ? scrimChild : null));
      if (beforeOverlay && typeof layer.insertBefore === "function") {
        layer.insertBefore(gradWrap, beforeOverlay);
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
    const hasSidebarOverride = Boolean(effectiveConfig.customSidebarBg);
    const hasBorderColorOverride = Boolean(effectiveConfig.customBorderColor);
    const hasWallpaper = teHasActiveWallpaper(effectiveConfig);
    const hasCustomTypo = teHasCustomTypography(effectiveConfig);
    const hasCornersOverride = teHasCustomCorners(effectiveConfig);
    const hasUiStyle = teHasCustomUiStyle(effectiveConfig);
    const hasElementOverrides = !effectiveConfig.overridesPaused && Array.isArray(effectiveConfig.elementOverrides) && effectiveConfig.elementOverrides.length > 0;
    const hasBorderPreset = effectiveConfig.borderPreset !== "crisp";
    const hasSurfaceOverride =
      hasCornersOverride || hasBorderPreset || effectiveConfig.radius !== 12 || effectiveConfig.borderStrength !== 50 || effectiveConfig.messageStyle !== "glass";
    const hostIsLight = resolveEffectiveHostIsLight(effectiveConfig);
    const isLight = hasThemeOverride
      ? teResolveThemeVars(effectiveConfig).mode === "light"
      : hostIsLight;

    if (!hasThemeOverride && !hasAccentOverride && !hasSidebarOverride && !hasBorderColorOverride && !hasWallpaper && !hasCustomTypo && !hasSurfaceOverride && !hasUiStyle && !hasElementOverrides && !effectiveConfig.uiPolish) {
      if (wallpaperActive || themeScanActive || emptyRespWatchActive) {
        wallpaperActive = false;
        themeScanActive = false;
        emptyRespWatchActive = false;
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
    } else if (cssText !== lastCssText || !existingStyle || (doc.head && existingStyle.parentNode !== doc.head)) {
      lastCssText = cssText;
      ensureStyleNode(cssText);
    }

    lastHadThemeOverride = hasThemeOverride;
    themeScanActive = hasThemeOverride || hasUiStyle || hasSidebarOverride || hasBorderColorOverride;
    emptyRespWatchActive = hasWallpaper || hasThemeOverride || hasSurfaceOverride || hasUiStyle || hasCornersOverride || hasBorderPreset || effectiveConfig.borderStrength !== 50;
    activeThemeIsLight = Boolean(hasThemeOverride && isLight);
    try {
      const rv = teResolveThemeVars(effectiveConfig);
      activeSidebarYiq = teGetYiq((rv && (rv.sidebarBg || rv.canvasBg)) || "#141416");
    } catch (_e) {
      activeSidebarYiq = isLight ? 235 : 20;
    }
    applyWallpaper(effectiveConfig, isLight);
    if (emptyRespWatchActive) {
      syncEmptyAgentResponsesNow();
    }
    if (themeScanActive && !wallpaperActive) {
      if (!ensureShellWatchers()) scanWallpaperShells();
    } else if (emptyRespWatchActive && !themeScanActive && !wallpaperActive) {
      ensureShellWatchers();
    } else if (!themeScanActive && !wallpaperActive && !emptyRespWatchActive) {
      clearWallpaperShells();
    } else if ((themeScanActive || wallpaperActive) && hasUntaggedComposerInDoc()) {
      syncComposerPartsNow();
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
    syncEmptyAgentResponsesNow,
    setBootWallpaperDeferred,
    isBootWallpaperDeferred: () => bootWallpaperDeferred,
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
      emptyRespWatchActive = false;
      bootWallpaperDeferred = false;
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
    UI_STYLE_PRESETS,
    DEFAULT_UI_STYLE,
    FONT_PRESETS,
    DEFAULT_APPEARANCE,
    normalizeAppearance,
    teNormalizeUiStyle,
    teHasCustomUiStyle,
    teBuildUiStyleCss,
    isAppearanceNativeDefault,
    teResolveCornerRadii,
    teFindFont,
    teFindFontAny,
    teResolveFontStack,
    teNormalizeElementOverrides,
    teBuildElementOverridesCss,
    teMixHex,
    teBuildWebFontUrl,
    detectHostIsLight,
    buildThemeCss,
    createThemeEngine,
  };
}
