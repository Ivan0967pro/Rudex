"use strict";

/**
 * Rudex 5.0 Core Module (browser-safe, zero Node imports):
 * - Agent Feature Toggles (all default to Auto; optional quick presets)
 * - Configurable Keybinding definitions & recorder formatter
 * - Standalone "Only Limits" screen widget renderer & styling
 * - Visual UI Zones map & Live Element Picker (smart stable selector + floating inspector)
 * - Native Composer Inline "Send Live Edit" + Quick Agent Popover bridge
 * - Extra Shadow DOM CSS strictly aligned with studio-styles.js editorial design tokens
 */

const RV5_ICON_PATHS = {
  crosshair: '<circle cx="12" cy="12" r="7"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  starFilled: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  auto: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
  arrowUpRight: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
  refresh: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/>',
};

function rv5IconSvg(name, size) {
  const s = size || 13;
  const p = RV5_ICON_PATHS[name] || RV5_ICON_PATHS.gear;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

const RUDEX_AGENT_PRESETS = [
  {
    id: "default",
    iconKey: "auto",
    icon: "",
    nameRu: "Авто (по умолчанию)",
    nameEn: "Auto (default)",
    descRu: "Все тумблеры в Авто — агент сам выбирает инструменты по задаче",
    descEn: "All toggles on Auto — agent decides per task",
    profile: {
      presetId: "default",
      presetLabel: "Авто",
      enabled: false,
      subagents: "auto",
      webSearch: "auto",
      browser: "auto",
      planFirst: "auto",
      autoVerify: false,
      deepMode: false,
      conciseness: "balanced",
      safetyMode: "normal",
    },
  },
  {
    id: "all-tools",
    iconKey: "sparkles",
    icon: "",
    nameRu: "Все инструменты",
    nameEn: "All Tools",
    descRu: "Субагенты параллельно, веб-поиск, план, автопроверка и режим «До конца»",
    descEn: "Parallel subagents, web search, plan checklist, auto-tests & finish thoroughly",
    profile: {
      presetId: "all-tools",
      presetLabel: "Все инструменты",
      enabled: true,
      subagents: "parallel",
      webSearch: "always",
      browser: "auto",
      planFirst: "strict",
      autoVerify: true,
      deepMode: true,
      conciseness: "balanced",
      safetyMode: "normal",
    },
  },
  {
    id: "fast-fix",
    iconKey: "bolt",
    icon: "",
    nameRu: "Быстрый ответ",
    nameEn: "Quick Answer",
    descRu: "Без субагентов и длинных планов — точечное действие и краткий ответ",
    descEn: "No subagents or long plans — direct fix and concise reply",
    profile: {
      presetId: "fast-fix",
      presetLabel: "Быстрый ответ",
      enabled: true,
      subagents: "off",
      webSearch: "auto",
      browser: "off",
      planFirst: "skip",
      autoVerify: false,
      deepMode: false,
      conciseness: "short",
      safetyMode: "normal",
    },
  },
  {
    id: "architect-ro",
    iconKey: "lock",
    icon: "",
    nameRu: "Только чтение",
    nameEn: "Read-Only",
    descRu: "Без изменения файлов и команд — только разбор кода, план и советы",
    descEn: "No file edits or shell commands — pure analysis and planning",
    profile: {
      presetId: "architect-ro",
      presetLabel: "Только чтение",
      enabled: true,
      subagents: "parallel",
      webSearch: "auto",
      browser: "auto",
      planFirst: "strict",
      autoVerify: false,
      deepMode: false,
      conciseness: "detailed",
      safetyMode: "readonly",
    },
  },
  {
    id: "frontend-ui",
    iconKey: "monitor",
    icon: "",
    nameRu: "Проверка UI",
    nameEn: "UI Check",
    descRu: "Браузерный агент и визуальная проверка вёрстки после правок",
    descEn: "Browser agent + visual layout verification after edits",
    profile: {
      presetId: "frontend-ui",
      presetLabel: "Проверка UI",
      enabled: true,
      subagents: "auto",
      webSearch: "auto",
      browser: "verify",
      planFirst: "auto",
      autoVerify: true,
      deepMode: false,
      conciseness: "balanced",
      safetyMode: "normal",
    },
  },
];

const RUDEX_UI_ZONES = [
  { id: "header", nameRu: "Верхняя шапка", nameEn: "Top Header", selector: 'header:not(#rudex-studio-host *), [data-rudex-bg-header="1"]', area: "top" },
  { id: "sidebar", nameRu: "Боковая панель", nameEn: "Left Sidebar", selector: 'aside:not(#rudex-studio-host *), [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]', area: "left" },
  { id: "sidebar-panels", nameRu: "Блоки боковой панели", nameEn: "Sidebar Panels", selector: ':where(aside, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]) :where([data-rudex-sidebar-surface="panel"], section, [data-slot="sidebar-group"])', area: "left-panel" },
  { id: "sidebar-items", nameRu: "Пункты и чаты сайдбара", nameEn: "Sidebar Items & Chats", selector: ':where(aside, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]) :where(a, button, [role="listitem"], [role="treeitem"], [data-rudex-sidebar-surface="item"])', area: "left-list" },
  { id: "sidebar-active", nameRu: "Активный пункт сайдбара", nameEn: "Active Sidebar Item", selector: ':where(aside, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]) :where([aria-current="page"], [aria-current="true"], [aria-selected="true"], [data-active="true"], [data-selected="true"], [data-state="active"], [data-rudex-sidebar-surface="active"])', area: "left-active" },
  { id: "user-bubble", nameRu: "Мои сообщения", nameEn: "User Messages", selector: '[data-testid="user-message-bubble"], [data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *)', area: "chat-user" },
  { id: "agent-reply", nameRu: "Ответы агента", nameEn: "Agent Replies", selector: '[data-testid="agent-response"]', area: "chat-agent" },
  { id: "thinking", nameRu: "Мысли и шаги агента", nameEn: "Agent Thoughts & Steps", selector: 'main :where([data-testid*="thought"], [data-testid*="thinking"], [data-rudex-zone="steps"], [data-rudex-zone="thinking"]):not([data-testid="agent-response"])', area: "chat-steps" },
  { id: "code", nameRu: "Блоки кода", nameEn: "Code Blocks", selector: ':where([data-testid="agent-response"], [data-markdown-root], main) pre:not(#rudex-studio-host *)', area: "chat-code" },
  { id: "composer", nameRu: "Поле ввода (Композер)", nameEn: "Input Composer", selector: '[data-rudex-theme-composer="1"]', area: "bottom" },
  { id: "composer-bar", nameRu: "Нижняя строка ввода", nameEn: "Composer Toolbar", selector: '[data-rudex-theme-composer="1"] :where(button, [role="button"])', area: "bottom-bar" },
  { id: "dividers", nameRu: "Линии и разделители", nameEn: "Lines & Dividers", selector: ':where(hr, [role="separator"], [data-slot="separator"]):not(#rudex-studio-host):not(#rudex-studio-host *)', area: "dividers" },
  { id: "buttons", nameRu: "Кнопки интерфейса", nameEn: "UI Buttons", selector: ':where(main, header, aside) button:not(#rudex-studio-host *):not([role="switch"]):not([data-rudex-comp-send="1"])', area: "buttons" },
  { id: "overlays", nameRu: "Меню и всплывающие окна", nameEn: "Menus & Tooltips", selector: ':where([role="menu"], [role="listbox"], [role="tooltip"], [role="dialog"]):not(#rudex-studio-host):not(#rudex-studio-host *)', area: "overlay" },
];

const RUDEX_KEYBINDING_DEFS = [
  { id: "toggleStudio", group: "menu", nameRu: "Открыть / закрыть Rudex Studio", nameEn: "Open / close Rudex Studio", def: "Ctrl+Alt+P" },
  { id: "toggleZenUi", group: "menu", nameRu: "Скрыть / показать все элементы Rudex (Дзен)", nameEn: "Hide / show all Rudex UI (Zen)", def: "Ctrl+Alt+H" },
  { id: "toggleLocale", group: "menu", nameRu: "Переключить язык (RU ↔ EN)", nameEn: "Toggle language (RU ↔ EN)", def: "Ctrl+Alt+L" },
  { id: "openTabAgent", group: "menu", nameRu: "Открыть раздел «Агент»", nameEn: "Open Agent tab", def: "" },
  { id: "openTabDesign", group: "menu", nameRu: "Открыть раздел «Оформление»", nameEn: "Open Appearance tab", def: "" },
  { id: "openTabLimits", group: "menu", nameRu: "Открыть раздел «Лимиты»", nameEn: "Open Limits tab", def: "" },
  { id: "openTabWorkshop", group: "menu", nameRu: "Открыть «Мастерскую AGY»", nameEn: "Open AGY Workshop", def: "" },
  { id: "togglePicker", group: "design", nameRu: "Включить / выключить «Прицел» (элементы)", nameEn: "Toggle Element Picker", def: "Ctrl+Alt+E" },
  { id: "cycleWallpaper", group: "design", nameRu: "Сменить обои (следующие / градиент)", nameEn: "Cycle wallpaper / gradient", def: "Ctrl+Alt+W" },
  { id: "toggleWallpaper", group: "design", nameRu: "Включить / выключить обои", nameEn: "Toggle wallpaper on/off", def: "Ctrl+Alt+Shift+W" },
  { id: "cycleTheme", group: "design", nameRu: "Переключить тему (следующая)", nameEn: "Cycle theme preset", def: "Ctrl+Alt+T" },
  { id: "toggleDarkLight", group: "design", nameRu: "Тёмная ↔ Светлая тема Claude Code", nameEn: "Toggle Dark ↔ Light Claude theme", def: "Ctrl+Alt+D" },
  { id: "emergencyResetOverrides", group: "design", nameRu: "Пауза / сброс правок элементов", nameEn: "Pause / resume element overrides", def: "Ctrl+Alt+Shift+R" },
  { id: "toggleLimitsWidget", group: "widgets", nameRu: "Показать / скрыть окно «Только лимиты»", nameEn: "Show / hide Limits widget", def: "Ctrl+Alt+Q" },
  { id: "openAnnotator", group: "widgets", nameRu: "Правки на скриншоте карандашом", nameEn: "Screenshot Pencil Annotator", def: "Ctrl+Alt+S" },
  { id: "toggleDictation", group: "agent", nameRu: "Старт / стоп голосового ввода (диктовки)", nameEn: "Start / stop voice dictation", def: "Ctrl+Alt+V" },
  { id: "toggleAgentPopover", group: "agent", nameRu: "Открыть быстрые тумблеры агента", nameEn: "Toggle Quick Agent Toggles", def: "Ctrl+Alt+A" },
  { id: "cycleAgentPreset", group: "agent", nameRu: "Переключить профиль агента", nameEn: "Cycle Agent Profile", def: "Ctrl+Alt+Shift+A" },
];

const RUDEX_LIMITS_DEFAULTS = {
  enabled: false,
  onlyLimitsMode: false,
  layout: "bars",
  position: "top-right",
  floatX: null,
  floatY: null,
  pinned: true,
  width: 0,
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
  families: "both",
  show5h: true,
  showWeekly: true,
  showResetTimer: true,
  displayMode: "remaining",
};

const RUDEX_KEYBINDINGS_DEFAULTS = (() => {
  const m = {};
  for (let i = 0; i < RUDEX_KEYBINDING_DEFS.length; i += 1) {
    m[RUDEX_KEYBINDING_DEFS[i].id] = RUDEX_KEYBINDING_DEFS[i].def;
  }
  return m;
})();

const RUDEX_LIVE_EDIT_DEFAULTS = {
  enabled: true,
  sendKey: "enter",
  urgentIntercept: false,
  showChatDock: true,
  showContextMeter: false,
  showInChat: true,
  showDeliveredBadge: true,
  showQueueStrip: false,
  chatBubbleStyle: "native",
  chatBubblePos: "after-user",
};

const RUDEX_QUOTA_AUTOMATION_DEFAULTS = {
  notifyOnReset: true,
  notifyWhenClosed: false,
  notifySound: true,
  autoContinueEnabled: false,
  autoContinueScope: "all",
  autoContinueChatKeys: [],
  autoContinueCurrentKey: "",
  autoContinuePrompt: "",
  autoContinueRetryFirst: true,
};

function rv5NormalizeQuotaAutomation(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const validScopes = { all: 1, selected: 1, current: 1 };
  return {
    notifyOnReset: src.notifyOnReset !== false,
    notifyWhenClosed: src.notifyWhenClosed === true,
    notifySound: src.notifySound !== false,
    autoContinueEnabled: Boolean(src.autoContinueEnabled),
    autoContinueScope: validScopes[src.autoContinueScope] ? src.autoContinueScope : "all",
    autoContinueChatKeys: Array.isArray(src.autoContinueChatKeys) ? src.autoContinueChatKeys.filter((k) => typeof k === "string" && k.trim()).slice(0, 40) : [],
    autoContinueCurrentKey: typeof src.autoContinueCurrentKey === "string" ? src.autoContinueCurrentKey.trim() : "",
    autoContinuePrompt: typeof src.autoContinuePrompt === "string" ? src.autoContinuePrompt.slice(0, 500) : "",
    autoContinueRetryFirst: src.autoContinueRetryFirst !== false,
  };
}

function rv5FormatContextTokens(n) {
  const num = Math.max(0, Math.round(Number(n) || 0));
  if (num >= 1000000) {
    const m = num / 1000000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(m % 1 === 0 ? 0 : 1)}M`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(k % 1 === 0 ? 0 : 1)}K`;
  }
  return String(num);
}

function rv5ResolveModelContextWindow(rawModelName) {
  const name = String(rawModelName || "").trim();
  const low = name.toLowerCase();
  let maxTokens = 200000;
  let explicit = false;

  const mMatch = /\b([12])m\b/i.exec(low);
  const kMatch = /\b(\d{2,4})k\b/i.exec(low);
  if (mMatch) {
    maxTokens = parseInt(mMatch[1], 10) * 1000000;
    explicit = true;
  } else if (kMatch) {
    const kv = parseInt(kMatch[1], 10);
    if (kv >= 32 && kv <= 4096) {
      maxTokens = kv * 1000;
      explicit = true;
    }
  }

  if (!explicit) {
    if (/gemini/.test(low)) {
      maxTokens = /1\.5\s*pro/.test(low) ? 2000000 : 1000000;
    } else if (/claude|opus|sonnet|haiku/.test(low)) {
      maxTokens = 200000;
    } else if (/gpt-?4\.1/.test(low)) {
      maxTokens = 1000000;
    } else if (/gpt-?5|codex/.test(low)) {
      maxTokens = 400000;
    } else if (/\bo[134](?:\b|-)/.test(low)) {
      maxTokens = 200000;
    } else if (/grok/.test(low)) {
      maxTokens = 256000;
    } else if (/gpt-?4|chatgpt|deepseek|qwen|llama|mistral/.test(low)) {
      maxTokens = 128000;
    }
  }

  let shortModel = name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+(?:сверхвысокий|высокий|средний|низкий|авто|xhigh|extra\s*high|high|medium|low|minimal|thinking|fast)\b/gi, "")
    .replace(/^claude\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (shortModel.length > 20) shortModel = shortModel.slice(0, 19).trim() + "…";

  return {
    maxTokens,
    windowLabel: rv5FormatContextTokens(maxTokens),
    shortModel,
  };
}

const RUDEX_AGENT_PROFILE_DEFAULTS = {
  presetId: "default",
  presetLabel: "",
  enabled: false,
  applyToNewChats: false,
  subagents: "auto",
  webSearch: "auto",
  browser: "auto",
  planFirst: "auto",
  autoVerify: false,
  deepMode: false,
  conciseness: "balanced",
  safetyMode: "normal",
  pinnedSkills: [],
  disabledTools: [],
};

function rv5EscapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const RV5_CODE_PUNCT_MAP = {
  BracketLeft: "[",
  BracketRight: "]",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backslash: "\\",
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  Space: "Space",
};

function rv5FormatKeyboardEvent(ev) {
  if (!ev) return "";
  const key = String(ev.key || "");
  if (key === "Control" || key === "Alt" || key === "Shift" || key === "Meta" || key === "Dead") return "";
  if (key === "Escape") return "__CANCEL__";
  if (key === "Backspace" || key === "Delete") return "__CLEAR__";
  if (typeof ev.getModifierState === "function" && ev.getModifierState("AltGraph")) return "";
  const isFnKey = /^F(?:[1-9]|1[0-2])$/i.test(key);
  const hasCtrl = Boolean(ev.ctrlKey || ev.metaKey);
  const hasAlt = Boolean(ev.altKey);
  const hasShift = Boolean(ev.shiftKey);
  // Prevent binding bare Shift+<letter> (would hijack typing capital letters!) or unmodified keys
  if (!hasCtrl && !hasAlt && !isFnKey) return "";
  const parts = [];
  if (hasCtrl) parts.push("Ctrl");
  if (hasAlt) parts.push("Alt");
  if (hasShift) parts.push("Shift");
  let main = key === " " ? "Space" : key;
  const code = String(ev.code || "");
  if (/^Key([A-Z])$/.test(code)) main = code.slice(3);
  else if (/^Digit(\d)$/.test(code)) main = code.slice(5);
  else if (RV5_CODE_PUNCT_MAP[code]) main = RV5_CODE_PUNCT_MAP[code];
  else if (main === "+") main = "Plus";
  else if (main.length === 1) main = main.toUpperCase();
  parts.push(main);
  return parts.join("+");
}

function rv5NormalizeLimitsWidget(raw) {
  const merged = Object.assign({}, RUDEX_LIMITS_DEFAULTS, raw && typeof raw === "object" ? raw : {});
  if (merged.position === "sidebar-bottom") merged.position = "top-right";
  return merged;
}

function rv5NormalizeKeybindings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (let i = 0; i < RUDEX_KEYBINDING_DEFS.length; i += 1) {
    const d = RUDEX_KEYBINDING_DEFS[i];
    out[d.id] = Object.prototype.hasOwnProperty.call(src, d.id) ? String(src[d.id] || "") : d.def;
  }
  return out;
}

function rv5NormalizeAgentProfile(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const merged = Object.assign({}, RUDEX_AGENT_PROFILE_DEFAULTS, src, {
    pinnedSkills: Array.isArray(src.pinnedSkills) ? src.pinnedSkills.slice() : [],
    disabledTools: Array.isArray(src.disabledTools) ? src.disabledTools.slice() : [],
  });
  // Migrate legacy "turbo" id cleanly to "all-tools"
  if (merged.presetId === "turbo") {
    merged.presetId = "all-tools";
    if (merged.presetLabel === "Полный турбо" || merged.presetLabel === "Full Turbo") {
      merged.presetLabel = "Все инструменты";
    }
  }
  return merged;
}

function rv5CountActiveAgentFeatures(prof) {
  if (!prof) return 0;
  let n = 0;
  if (prof.subagents && prof.subagents !== "auto") n += 1;
  if (prof.webSearch && prof.webSearch !== "auto") n += 1;
  if (prof.browser && prof.browser !== "auto") n += 1;
  if (prof.planFirst && prof.planFirst !== "auto") n += 1;
  if (prof.autoVerify) n += 1;
  if (prof.deepMode) n += 1;
  if (prof.conciseness && prof.conciseness !== "balanced") n += 1;
  if (prof.safetyMode && prof.safetyMode !== "normal") n += 1;
  if (Array.isArray(prof.pinnedSkills) && prof.pinnedSkills.length > 0) n += 1;
  if (Array.isArray(prof.disabledTools) && prof.disabledTools.length > 0) n += 1;
  return n;
}

function rv5SummarizeActiveToggles(prof, isRu) {
  if (!prof || !prof.enabled) return [];
  const tags = [];
  if (prof.subagents === "parallel") tags.push(isRu ? "Субагенты" : "Subagents");
  else if (prof.subagents === "off") tags.push(isRu ? "Без субагентов" : "No subagents");
  if (prof.webSearch === "always") tags.push(isRu ? "Веб" : "Web");
  else if (prof.webSearch === "off") tags.push(isRu ? "Офлайн" : "Offline");
  if (prof.browser === "verify") tags.push(isRu ? "Браузер" : "Browser");
  else if (prof.browser === "off") tags.push(isRu ? "Без браузера" : "No browser");
  if (prof.planFirst === "strict") tags.push(isRu ? "План" : "Plan");
  else if (prof.planFirst === "skip") tags.push(isRu ? "Без плана" : "Skip plan");
  if (prof.autoVerify) tags.push(isRu ? "Тесты" : "Tests");
  if (prof.deepMode) tags.push(isRu ? "До конца" : "Deep");
  if (prof.safetyMode === "readonly") tags.push(isRu ? "Только чтение" : "Read-Only");
  if (prof.conciseness === "short") tags.push(isRu ? "Кратко" : "Short");
  else if (prof.conciseness === "detailed") tags.push(isRu ? "Подробно" : "Detailed");
  if (Array.isArray(prof.pinnedSkills) && prof.pinnedSkills.length > 0) {
    tags.push(isRu ? `Скиллы (${prof.pinnedSkills.length})` : `Skills (${prof.pinnedSkills.length})`);
  }
  if (Array.isArray(prof.disabledTools) && prof.disabledTools.length > 0) {
    tags.push(isRu ? `Фильтр (${prof.disabledTools.length})` : `Filter (${prof.disabledTools.length})`);
  }
  return tags;
}

function rv5GetTrafficColor(remPct, fallbackAccent) {
  if (typeof remPct !== "number" || !Number.isFinite(remPct)) return fallbackAccent || "var(--rx-accent)";
  if (remPct <= 18) return "var(--rx-danger, #ef4444)";
  if (remPct <= 45) return "var(--rx-warning, #f59e0b)";
  return "var(--rx-success, #22c55e)";
}

function rv5HexToRgba(hex, pct) {
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex.trim())) return "";
  const h = hex.trim().slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0.15, Math.min(1, (Number(pct) || 88) / 100));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Render standalone "Only Limits" screen widget HTML.
 * Pass isPreview=true inside Settings tab to render sample preview cleanly.
 */
function rv5BuildLimitsWidgetHtml(cfgRaw, quotaSummary, activeModelName, isRu, isPreview) {
  const cfg = rv5NormalizeLimitsWidget(cfgRaw);
  const qs = quotaSummary && typeof quotaSummary === "object" ? quotaSummary : {};
  const fams = qs.families && typeof qs.families === "object" ? qs.families : {};
  const hasReal = Boolean(
    (fams.gemini && (typeof fams.gemini.fiveHourRem === "number" || typeof fams.gemini.weeklyRem === "number")) ||
    (fams.claudeGpt && (typeof fams.claudeGpt.fiveHourRem === "number" || typeof fams.claudeGpt.weeklyRem === "number"))
  );
  const gem = hasReal
    ? (fams.gemini || {})
    : (isPreview ? { fiveHourRem: 82, weeklyRem: 64, fiveHourReset: isRu ? "3ч 15м" : "3h 15m" } : {});
  const cl = hasReal
    ? (fams.claudeGpt || {})
    : (isPreview ? { fiveHourRem: 38, weeklyRem: 71, fiveHourReset: isRu ? "1ч 40м" : "1h 40m" } : {});
  const modelLow = String(activeModelName || "").toLowerCase();
  const activeFam = /claude|gpt|sonnet|opus|haiku|anthropic|openai|chatgpt|\bo[134](?:\b|-)/.test(modelLow)
    ? "claudeGpt"
    : "gemini";

  const rows = [];
  if (cfg.families === "both" || cfg.families === "gemini" || (cfg.families === "active" && activeFam === "gemini")) {
    rows.push({ id: "gemini", label: "Gemini", data: gem });
  }
  if (cfg.families === "both" || cfg.families === "claudeGpt" || (cfg.families === "active" && activeFam === "claudeGpt")) {
    rows.push({ id: "claudeGpt", label: "Claude / GPT", data: cl });
  }

  const fmtVal = (rem) => {
    if (typeof rem !== "number" || !Number.isFinite(rem)) return "—";
    const v = cfg.displayMode === "used" ? Math.max(0, Math.min(100, Math.round(100 - rem))) : Math.max(0, Math.min(100, Math.round(rem)));
    return `${v}%`;
  };
  const barPct = (rem) => {
    if (typeof rem !== "number" || !Number.isFinite(rem)) return 0;
    return cfg.displayMode === "used" ? Math.max(0, Math.min(100, 100 - rem)) : Math.max(0, Math.min(100, rem));
  };
  const barCol = (rem) => (cfg.trafficLight ? rv5GetTrafficColor(rem, cfg.barColor || "var(--rx-accent)") : (cfg.barColor || "var(--rx-accent)"));

  const fontStack = cfg.fontFamily && cfg.fontFamily !== "inherit" && typeof teResolveFontStack === "function"
    ? teResolveFontStack("ui", cfg.fontFamily, cfg.fontFamilyCustom)
    : "";
  const isDockedUi = Boolean(cfg.pinned && cfg.position !== "floating");
  const modeCls = isDockedUi ? " is-docked-ui" : " is-floating-ui";
  const widthCss = Number(cfg.width) >= 180 && cfg.layout !== "pill" && cfg.layout !== "inline-header" && cfg.position !== "inline-header"
    ? `width:${Math.round(cfg.width)}px;min-width:${Math.round(cfg.width)}px;max-width:${Math.round(cfg.width)}px;`
    : "";
  const bgCss = cfg.bgColor
    ? `background:${rv5HexToRgba(cfg.bgColor, cfg.bgOpacity)};`
    : `background:color-mix(in srgb, var(--rx-theme-surface, var(--rx-surface)) ${Math.max(20, Math.min(100, Math.round(cfg.bgOpacity || 90)))}%, transparent);`;
  const customVars = [
    fontStack ? `font-family:${fontStack};` : "",
    `font-size:${cfg.fontSize}px;`,
    widthCss,
    bgCss,
    cfg.textColor ? `color:${cfg.textColor};` : "",
    cfg.borderColor ? `border-color:${cfg.borderColor};` : "",
    `border-radius:${cfg.borderRadius}px;`,
    cfg.blur > 0 ? `backdrop-filter:blur(${cfg.blur}px) saturate(135%);-webkit-backdrop-filter:blur(${cfg.blur}px) saturate(135%);` : "backdrop-filter:none;-webkit-backdrop-filter:none;",
    cfg.scale !== 100 ? `zoom:${(cfg.scale / 100).toFixed(2)};` : "",
  ].filter(Boolean).join("");

  const label5h = isRu ? "5ч" : "5h";
  const labelWk = isRu ? "Нед" : "Wk";
  const estHint = "";
  const hasAnyValues = rows.some((r) => typeof r.data.fiveHourRem === "number" || typeof r.data.weeklyRem === "number");
  const latestQuotaTs = Math.max(Number(gem.updatedAt) || 0, Number(cl.updatedAt) || 0);
  let freshnessSuffix = "";
  if (hasReal && latestQuotaTs > 0 && !isPreview) {
    const ageMin = Math.max(0, Math.floor((Date.now() - latestQuotaTs) / 60000));
    freshnessSuffix = ageMin < 1
      ? (isRu ? " · обновлено только что" : " · updated just now")
      : (ageMin < 60
        ? (isRu ? ` · обновлено ${ageMin} мин назад` : ` · updated ${ageMin}m ago`)
        : (isRu ? ` · обновлено ${Math.floor(ageMin / 60)} ч назад` : ` · updated ${Math.floor(ageMin / 60)}h ago`));
  }
  const titleHint = (isRu ? "Лимиты Antigravity" : "Antigravity Limits") + freshnessSuffix;
  const pinTitle = isDockedUi
    ? (isRu ? "Открепить (плавающее окно)" : "Undock (floating window)")
    : (isRu ? "Закрепить как часть интерфейса" : "Dock into UI");
  const pinIconSvg = rv5IconSvg("pin", 11);
  const gearIconSvg = rv5IconSvg("gear", 11);
  const clockIconSvg = rv5IconSvg("clock", 10);
  const resizeGripHtml = isPreview
    ? ""
    : `<span class="rx-lim-resize-grip" data-limits-resize="1" title="${rv5EscapeHtml(isRu ? "Потяните, чтобы изменить размер (двойной клик — сброс)" : "Drag to resize (double-click to reset)")}"></span>`;

  if (cfg.layout === "pill" || cfg.layout === "inline-header" || cfg.position === "inline-header") {
    const effLay = cfg.position === "inline-header" ? "inline-header" : cfg.layout;
    const chunks = rows.map((r) => {
      const parts = [];
      if (cfg.showWeekly) {
        const c = barCol(r.data.weeklyRem);
        parts.push(`<span class="rx-lim-kv"${r.data.weeklyEstimated ? ` title="${estHint}"` : ""}><i class="rx-lim-dot" style="background:${c}"></i>${labelWk} <b>${fmtVal(r.data.weeklyRem, r.data.weeklyEstimated)}</b></span>`);
      }
      if (cfg.show5h) {
        const c = barCol(r.data.fiveHourRem);
        parts.push(`<span class="rx-lim-kv"${r.data.fiveHourEstimated ? ` title="${estHint}"` : ""}><i class="rx-lim-dot" style="background:${c}"></i>${label5h} <b>${fmtVal(r.data.fiveHourRem, r.data.fiveHourEstimated)}</b></span>`);
      }
      return `<span class="rx-lim-fam"><strong>${rv5EscapeHtml(r.label)}</strong> ${parts.join(" · ")}</span>`;
    }).join('<span class="rx-lim-sep">|</span>');
    return `
      <div class="rx-limits-box is-${rv5EscapeHtml(effLay)}${cfg.pinned ? " is-pinned" : ""}${modeCls}" data-role="limitsWidgetBox" style="${rv5EscapeHtml(customVars)}" title="${rv5EscapeHtml(titleHint)}">
        ${isPreview || isDockedUi ? "" : `<span class="rx-lim-drag" data-limits-drag="1" title="${isRu ? "Перетащить" : "Drag"}">⋮⋮</span>`}
        ${chunks}
        ${isPreview ? "" : `
          <button type="button" class="rx-lim-btn${isDockedUi ? " is-pinned" : ""}" data-action="toggle-limits-pin" title="${rv5EscapeHtml(pinTitle)}">${pinIconSvg}</button>
          <button type="button" class="rx-lim-btn" data-action="open-limits-settings" title="${isRu ? "Настроить окно лимитов" : "Configure limits widget"}">${gearIconSvg}</button>
        `}
        ${effLay !== "inline-header" ? resizeGripHtml : ""}
      </div>
    `;
  }

  return `
    <div class="rx-limits-box is-${rv5EscapeHtml(cfg.layout)}${cfg.pinned ? " is-pinned" : ""}${modeCls}" data-role="limitsWidgetBox" style="${rv5EscapeHtml(customVars)}" title="${rv5EscapeHtml(titleHint)}">
      <div class="rx-lim-head" ${isPreview || isDockedUi ? "" : 'data-limits-drag="1"'}>
        <span class="rx-lim-title">${isPreview || isDockedUi ? "" : '<span class="rx-lim-drag">⋮⋮</span> '}${isRu ? "Лимиты Antigravity" : "Antigravity Limits"}${isPreview && !hasReal ? ` <em style="font-style:normal;opacity:.55;font-weight:400;font-size:.85em">(${isRu ? "пример" : "sample"})</em>` : ""}</span>
        ${isPreview ? "" : `
          <div class="rx-lim-acts">
            <button type="button" class="rx-lim-btn${isDockedUi ? " is-pinned" : ""}" data-action="toggle-limits-pin" title="${rv5EscapeHtml(pinTitle)}">${pinIconSvg}</button>
            <button type="button" class="rx-lim-btn" data-action="open-limits-settings" title="${isRu ? "Настройки окна лимитов" : "Limits settings"}">${gearIconSvg}</button>
          </div>
        `}
      </div>
      <div class="rx-lim-body">
        ${rows.map((r) => {
          const d = r.data;
          const reset5 = cfg.showResetTimer && d.fiveHourReset ? d.fiveHourReset : "";
          const resetW = cfg.showResetTimer && d.weeklyReset ? d.weeklyReset : "";
          const has5 = typeof d.fiveHourRem === "number" && Number.isFinite(d.fiveHourRem);
          const hasW = typeof d.weeklyRem === "number" && Number.isFinite(d.weeklyRem);
          const showWRow = cfg.showWeekly && (hasW || !has5);
          const show5Row = cfg.show5h && (has5 || !hasW);
          const headResetText = resetW && !reset5 ? `${labelWk} ${resetW}` : (!resetW && reset5 ? `${label5h} ${reset5}` : (resetW && reset5 ? `${resetW} · ${reset5}` : ""));
          return `
            <div class="rx-lim-row">
              <div class="rx-lim-row-top">
                <span class="rx-lim-name">${rv5EscapeHtml(r.label)}</span>
                ${headResetText ? `<span class="rx-lim-reset">${clockIconSvg}<span>${rv5EscapeHtml(headResetText)}</span></span>` : ""}
              </div>
              ${showWRow ? `
                <div class="rx-lim-bar-line">
                  <span class="rx-lim-lbl">${labelWk}</span>
                  <div class="rx-lim-track"><div class="rx-lim-fill" style="width:${barPct(d.weeklyRem)}%;background:${barCol(d.weeklyRem)}"></div></div>
                  <span class="rx-lim-pct"${d.weeklyEstimated ? ` title="${estHint}"` : ""}>${fmtVal(d.weeklyRem, d.weeklyEstimated)}</span>
                </div>
              ` : ""}
              ${show5Row ? `
                <div class="rx-lim-bar-line">
                  <span class="rx-lim-lbl">${label5h}</span>
                  <div class="rx-lim-track"><div class="rx-lim-fill" style="width:${barPct(d.fiveHourRem)}%;background:${barCol(d.fiveHourRem)}"></div></div>
                  <span class="rx-lim-pct"${d.fiveHourEstimated ? ` title="${estHint}"` : ""}>${fmtVal(d.fiveHourRem, d.fiveHourEstimated)}</span>
                </div>
              ` : ""}
            </div>
          `;
        }).join("")}
        ${!hasAnyValues && !isPreview ? `<div class="rx-lim-tip">${isRu ? "Синхронизируется автоматически при открытии Настройки → Модели и использование" : "Auto-syncs when opening Settings → Models & Usage"}</div>` : ""}
      </div>
      ${resizeGripHtml}
    </div>
  `;
}

/**
 * Build smart, React-safe CSS selector for any element clicked in Element Picker.
 */
function rv5BuildSmartSelector(el, scope, rootDoc) {
  if (!el || el.nodeType !== 1) return "";
  const safeAttrVal = (v) => String(v || "").replace(/["\\;{}<>]/g, "").trim();
  const ownerDoc = rootDoc || el.ownerDocument || (typeof document !== "undefined" ? document : null);
  const canVerifyUnique = Boolean(
    scope !== "similar" &&
    ownerDoc &&
    typeof ownerDoc.querySelectorAll === "function" &&
    ownerDoc.body &&
    typeof ownerDoc.body.contains === "function" &&
    ownerDoc.body.contains(el)
  );
  const isUniqueSelectorFor = (sel, targetEl) => {
    if (!canVerifyUnique) return true;
    if (!sel) return false;
    try {
      const list = ownerDoc.querySelectorAll(sel);
      return Boolean(list && list.length === 1 && list[0] === targetEl);
    } catch (_e) {
      return false;
    }
  };
  const isUniqueMatch = (sel) => isUniqueSelectorFor(sel, el);
  const tag = (el.tagName || "div").toLowerCase();
  if (
    el.getAttribute("data-rudex-theme-composer") === "1" ||
    el.getAttribute("data-rudex-comp-input-row") === "1" ||
    el.getAttribute("data-rudex-comp-editor") === "1" ||
    el.getAttribute("data-rudex-comp-editor-wrap") === "1" ||
    (typeof el.closest === "function" && el.closest('[data-rudex-theme-composer="1"]') && (tag === "textarea" || el.getAttribute("contenteditable") === "true" || el.getAttribute("role") === "textbox"))
  ) {
    return '[data-rudex-theme-composer="1"]';
  }
  const testId = typeof el.getAttribute === "function" ? safeAttrVal(el.getAttribute("data-testid")) : "";
  if (testId) {
    const sel = `[data-testid="${testId}"]`;
    if (scope === "similar" || isUniqueMatch(sel)) return sel;
  }
  const zone = typeof el.getAttribute === "function" ? safeAttrVal(el.getAttribute("data-rudex-zone")) : "";
  if (zone) {
    const sel = `[data-rudex-zone="${zone}"]`;
    if (scope === "similar" || isUniqueMatch(sel)) return sel;
  }
  if (typeof el.getAttribute === "function" && el.getAttribute("data-rudex-bg-sidebar") === "1") {
    const sel = '[data-rudex-bg-sidebar="1"]';
    if (scope === "similar" || isUniqueMatch(sel)) return sel;
  }
  if (typeof el.getAttribute === "function" && el.getAttribute("data-rudex-bg-header") === "1") {
    const sel = '[data-rudex-bg-header="1"]';
    if (scope === "similar" || isUniqueMatch(sel)) return sel;
  }
  const aria = typeof el.getAttribute === "function" ? safeAttrVal(el.getAttribute("aria-label")) : "";
  // Avoid translated Cyrillic aria-labels so selectors survive RU <-> EN switching cleanly
  if (scope !== "similar" && aria && aria.length <= 64 && /^[\x20-\x7E]+$/.test(aria)) {
    const sel = `${tag}[aria-label="${aria}"]`;
    if (isUniqueMatch(sel)) return sel;
  }
  const role = typeof el.getAttribute === "function" ? safeAttrVal(el.getAttribute("role")) : "";
  const sideSurf = typeof el.getAttribute === "function" ? safeAttrVal(el.getAttribute("data-rudex-sidebar-surface")) : "";
  const slotAttr = typeof el.getAttribute === "function" ? safeAttrVal(el.getAttribute("data-slot")) : "";
  if (scope === "similar") {
    if (sideSurf) return `[data-rudex-sidebar-surface="${sideSurf}"]:not(#rudex-studio-host *)`;
    if (slotAttr) return `[data-slot="${slotAttr}"]:not(#rudex-studio-host *)`;
    if (role) return `${tag}[role="${role}"]:not(#rudex-studio-host *)`;
    const parent = el.parentElement;
    const pTest = parent && typeof parent.getAttribute === "function" ? safeAttrVal(parent.getAttribute("data-testid")) : "";
    if (pTest) return `[data-testid="${pTest}"] > ${tag}`;
    if (tag === "aside" || tag === "header" || tag === "nav" || tag === "pre" || tag === "blockquote") {
      return `${tag}:not(#rudex-studio-host *)`;
    }
  }
  const segs = [];
  let cur = el;
  let depth = 0;
  let anchored = false;
  while (cur && cur.nodeType === 1 && depth < 40) {
    const t = (cur.tagName || "div").toLowerCase();
    if (t === "body" || t === "html") {
      if (t === "body" && segs.length > 0 && !anchored) {
        segs.unshift("body");
        anchored = true;
      }
      break;
    }
    const tryAnchor = (anchorSel) => {
      if (scope === "similar") {
        segs.unshift(anchorSel);
        anchored = true;
        return true;
      }
      const cand = segs.length > 0 ? `${anchorSel} > ${segs.join(" > ")}` : anchorSel;
      if (isUniqueSelectorFor(anchorSel, cur) || isUniqueSelectorFor(cand, el)) {
        segs.unshift(anchorSel);
        anchored = true;
        return true;
      }
      return false;
    };
    const tid = typeof cur.getAttribute === "function" ? safeAttrVal(cur.getAttribute("data-testid")) : "";
    if (tid && tryAnchor(`[data-testid="${tid}"]`)) break;
    if (depth > 0 && typeof cur.getAttribute === "function") {
      if (cur.getAttribute("data-rudex-bg-sidebar") === "1" && tryAnchor('[data-rudex-bg-sidebar="1"]')) break;
      if (cur.getAttribute("data-rudex-bg-header") === "1" && tryAnchor('[data-rudex-bg-header="1"]')) break;
      if (cur.getAttribute("data-rudex-theme-composer") === "1" && tryAnchor('[data-rudex-theme-composer="1"]')) break;
      const cSlot = safeAttrVal(cur.getAttribute("data-slot"));
      if (cSlot && cSlot.length <= 42 && tryAnchor(`[data-slot="${cSlot}"]`)) break;
    }
    if (cur.id && /^[a-zA-Z][a-zA-Z0-9_-]{1,40}$/.test(cur.id) && !cur.id.startsWith("radix-")) {
      if (tryAnchor(`#${cur.id}`)) break;
    }
    if (depth > 0 && (t === "main" || t === "aside" || t === "header" || t === "nav")) {
      if (tryAnchor(t)) break;
    }
    let idx = 1;
    if (cur.previousElementSibling) {
      let sib = cur.previousElementSibling;
      while (sib) {
        if ((sib.tagName || "").toLowerCase() === t) idx += 1;
        sib = sib.previousElementSibling;
      }
    } else if (cur.parentElement && cur.parentElement.children) {
      const ch = cur.parentElement.children;
      for (let ci = 0; ci < ch.length; ci += 1) {
        if (ch[ci] === cur) break;
        if (ch[ci] && (ch[ci].tagName || "").toLowerCase() === t) idx += 1;
      }
    }
    segs.unshift(scope === "similar" && depth === 0 ? t : `${t}:nth-of-type(${idx})`);
    cur = cur.parentElement;
    depth += 1;
  }
  return segs.join(" > ") || `${tag}:not(#rudex-studio-host *)`;
}

function rv5DescribeElementFriendly(el, isRu, origText) {
  if (!el || el.nodeType !== 1) return isRu ? "Элемент" : "Element";
  const tid = typeof el.getAttribute === "function" ? (el.getAttribute("data-testid") || "") : "";
  const sideSurf = typeof el.getAttribute === "function" ? (el.getAttribute("data-rudex-sidebar-surface") || "") : "";
  const tag = (el.tagName || "").toLowerCase();
  if (tid === "user-message-bubble" || tid === "user-message-content") return isRu ? "Сообщение пользователя" : "User Message";
  if (tid === "agent-response") return isRu ? "Ответ агента" : "Agent Response";
  if (tid === "sidebar" || tag === "aside" || el.getAttribute("data-rudex-bg-sidebar") === "1") return isRu ? "Боковая панель" : "Sidebar";
  if (sideSurf === "panel") return isRu ? "Блок боковой панели" : "Sidebar Panel";
  if (sideSurf === "active") return isRu ? "Активный пункт сайдбара" : "Active Sidebar Item";
  if (sideSurf === "item") return isRu ? "Строка сайдбара" : "Sidebar Row";
  if (tag === "header" || el.getAttribute("data-rudex-bg-header") === "1") return isRu ? "Верхняя шапка" : "Top Header";
  if (
    el.getAttribute("data-rudex-theme-composer") === "1" ||
    el.getAttribute("data-rudex-comp-input-row") === "1" ||
    el.getAttribute("data-rudex-comp-editor") === "1" ||
    el.getAttribute("data-rudex-comp-editor-wrap") === "1" ||
    tid === "composer"
  ) return isRu ? "Поле ввода (Композер)" : "Input Composer";
  if (tid.includes("thought") || tid.includes("thinking")) return isRu ? "Блок мыслей агента" : "Agent Thinking Block";
  if (tag === "pre" || tag === "code") return isRu ? "Блок кода" : "Code Block";
  const txt = String(origText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 28);
  if (tag === "button" || el.getAttribute("role") === "button") {
    return txt ? (isRu ? `Кнопка «${txt}»` : `Button "${txt}"`) : (isRu ? "Кнопка" : "Button");
  }
  if (tag === "a") return txt ? (isRu ? `Пункт «${txt}»` : `Link "${txt}"`) : (isRu ? "Ссылка" : "Link");
  if (tag === "textarea" || tag === "input") return isRu ? "Поле текста" : "Text Input";
  return txt ? `${tag} · «${txt}»` : (tid || tag);
}

function rv5IsRenameSafeElement(el) {
  if (!el || el.nodeType !== 1) return false;
  let cur = el;
  let d = 0;
  while (cur && cur.nodeType === 1 && d < 12) {
    const tid = typeof cur.getAttribute === "function" ? cur.getAttribute("data-testid") : "";
    if (tid === "user-message-content" || tid === "user-message-bubble" || tid === "agent-response") return false;
    if (typeof cur.getAttribute === "function" && cur.getAttribute("data-markdown-root") !== null) return false;
    const tag = (cur.tagName || "").toUpperCase();
    if (tag === "CODE" || tag === "PRE" || tag === "TEXTAREA") return false;
    cur = cur.parentElement;
    d += 1;
  }
  return true;
}

/**
 * Find the native Antigravity chat composer container and editable element.
 */
function rv5FindNativeComposer(doc) {
  if (!doc || typeof doc.querySelector !== "function") return { container: null, editable: null };
  const isSkippedEditable = (c) => {
    if (!c) return true;
    if (typeof c.closest === "function" && c.closest('#rudex-studio-host, [data-testid="user-message-content"], [data-testid="agent-response"], .monaco-editor, [role="dialog"], [role="alertdialog"]')) return true;
    const cls = typeof c.className === "string" ? c.className : "";
    if (/\b(?:inputarea|ime-text-area)\b/.test(cls)) return true;
    return false;
  };
  const isVisibleRect = (el) => {
    if (!el || typeof el.getBoundingClientRect !== "function") return true;
    const r = el.getBoundingClientRect();
    if (!r) return true;
    // Allow mock DOM rects (0x0 default in tests without layout), reject explicitly collapsed hidden nodes only when other visible ones exist
    return r.width > 0 && r.height > 0;
  };
  const walkToComposerContainer = (editableNode) => {
    if (!editableNode) return null;
    const direct = typeof editableNode.closest === "function"
      ? editableNode.closest('[data-rudex-theme-composer="1"], form, [data-testid="composer"], .composer-container')
      : null;
    if (direct) return direct;
    let cur = editableNode.parentElement;
    let best = editableNode.parentElement;
    let d = 0;
    while (cur && cur.nodeType === 1 && cur !== doc.body && cur.tagName !== "MAIN" && d < 6) {
      if (typeof cur.querySelector === "function") {
        if (cur.querySelector('[data-testid="agent-response"], [data-testid="user-message-content"]')) break;
        if (cur.querySelector('[data-testid="model-selector-trigger"], button[type="submit"], [data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"]')) {
          best = cur;
          break;
        }
      }
      cur = cur.parentElement;
      d += 1;
    }
    return best;
  };

  // 1) Prefer the composer that currently holds focus (critical when multiple tabs/panes or stale hidden composers exist!)
  const activeEl = doc.activeElement;
  if (activeEl && typeof activeEl.closest === "function") {
    const activeEd = activeEl.closest('textarea, [contenteditable="true"], [role="textbox"]');
    if (activeEd && !isSkippedEditable(activeEd)) {
      const activeCont = walkToComposerContainer(activeEd);
      if (activeCont) return { container: activeCont, editable: activeEd };
    }
  }

  // 2) Scan all tagged composers, preferring visible ones
  let container = null;
  let editable = null;
  if (typeof doc.querySelectorAll === "function") {
    const tagged = doc.querySelectorAll('[data-rudex-theme-composer="1"]');
    let fallbackTagged = null;
    let fallbackContOnly = null;
    for (let i = tagged.length - 1; i >= 0; i -= 1) {
      const candCont = tagged[i];
      if (!candCont || typeof candCont.querySelector !== "function") continue;
      if (!fallbackContOnly) fallbackContOnly = candCont;
      const candEd = candCont.querySelector('textarea, [contenteditable="true"], [role="textbox"]');
      if (!candEd || isSkippedEditable(candEd)) continue;
      if (!fallbackTagged) fallbackTagged = { container: candCont, editable: candEd };
      if (isVisibleRect(candCont) && isVisibleRect(candEd)) {
        container = candCont;
        editable = candEd;
        break;
      }
    }
    if (!editable && fallbackTagged) {
      container = fallbackTagged.container;
      editable = fallbackTagged.editable;
    } else if (!container && fallbackContOnly) {
      container = fallbackContOnly;
    }
  } else {
    container = doc.querySelector('[data-rudex-theme-composer="1"]');
    editable = container ? container.querySelector('textarea, [contenteditable="true"], [role="textbox"]') : null;
  }

  // 3) Fallback scan across main/form and then whole document for untagged chat composers
  if (!editable && typeof doc.querySelectorAll === "function") {
    const primaryCands = doc.querySelectorAll('main textarea, main [contenteditable="true"], form textarea, form [contenteditable="true"]');
    const allCands = primaryCands && primaryCands.length > 0
      ? primaryCands
      : doc.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]');
    let fallbackUn = null;
    for (let i = allCands.length - 1; i >= 0; i -= 1) {
      const c = allCands[i];
      if (isSkippedEditable(c)) continue;
      const cont = walkToComposerContainer(c);
      if (!fallbackUn) fallbackUn = { container: cont, editable: c };
      if (isVisibleRect(c)) {
        editable = c;
        container = cont;
        break;
      }
    }
    if (!editable && fallbackUn) {
      editable = fallbackUn.editable;
      container = fallbackUn.container;
    }
  }
  return { container, editable };
}

function rv5ReadEditableText(editable) {
  if (!editable) return "";
  if (editable.tagName === "TEXTAREA" || editable.tagName === "INPUT") {
    return String(editable.value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  }
  return String(editable.innerText || editable.textContent || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function rv5ClearEditableText(editable, win, opts) {
  if (!editable) return;
  const skipRawFallback = Boolean(opts && opts.skipRawTextFallback);
  try {
    if (editable.tagName === "TEXTAREA" || editable.tagName === "INPUT") {
      const proto = editable.tagName === "TEXTAREA"
        ? (win && win.HTMLTextAreaElement ? win.HTMLTextAreaElement.prototype : null)
        : (win && win.HTMLInputElement ? win.HTMLInputElement.prototype : null);
      const desc = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
      if (desc && typeof desc.set === "function") desc.set.call(editable, "");
      else editable.value = "";
      editable.dispatchEvent(new ((win && win.Event) || Event)("input", { bubbles: true }));
    } else {
      const ownerDoc = editable.ownerDocument || (win && win.document) || null;
      if (typeof editable.focus === "function") editable.focus();
      let clearedViaExec = false;
      const hasExecCmd = Boolean(ownerDoc && typeof ownerDoc.execCommand === "function");
      try {
        const sel = win && typeof win.getSelection === "function" ? win.getSelection() : null;
        if (sel && ownerDoc && typeof ownerDoc.createRange === "function") {
          const range = ownerDoc.createRange();
          range.selectNodeContents(editable);
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (hasExecCmd) {
          ownerDoc.execCommand("selectAll", false, null);
        }
        const InpEvt = (win && win.InputEvent) || (typeof InputEvent !== "undefined" ? InputEvent : null);
        if (InpEvt) {
          editable.dispatchEvent(new InpEvt("beforeinput", { inputType: "deleteContentBackward", bubbles: true, cancelable: true }));
        }
        if (hasExecCmd) {
          if (rv5ReadEditableText(editable).length > 0) {
            ownerDoc.execCommand("selectAll", false, null);
            ownerDoc.execCommand("delete", false, null);
          }
        }
        clearedViaExec = rv5ReadEditableText(editable).length === 0;
      } catch (_ex) {}
      if (!clearedViaExec && (!skipRawFallback || !hasExecCmd)) {
        editable.textContent = "";
        const InpEvt2 = (win && win.InputEvent) || (typeof InputEvent !== "undefined" ? InputEvent : null);
        if (InpEvt2) {
          try { editable.dispatchEvent(new InpEvt2("input", { inputType: "deleteContentBackward", bubbles: true })); } catch (_e) {}
        }
        try { editable.dispatchEvent(new ((win && win.Event) || Event)("input", { bubbles: true })); } catch (_e) {}
      }
    }
  } catch (_e) {}
}

/**
 * Extra CSS injected inside Rudex Studio shadow root for v5 components.
 * Uses strictly the exact tokens from studio-styles.js (--rx-surface, --rx-surface-2,
 * --rx-bg, --rx-glass-strong, --rx-fg, --rx-fg-strong, --rx-muted, --rx-border, --rx-border-strong, --rx-accent).
 */
function rv5BuildExtraShadowCss() {
  return `
/* === RUDEX 5.0 EDITORIAL SHADOW UI === */
.rx-zen-hidden { display: none !important; }

/* Standalone Limits Widget (strictly below .modal-backdrop 2147483200 so it dims cleanly behind Studio modal) */
.rx-limits-mount {
  position: fixed;
  z-index: 41;
  pointer-events: auto;
  user-select: none;
  max-width: calc(100vw - 24px);
  transition: right 0.16s ease, left 0.16s ease;
}
.rx-limits-mount.is-dragging {
  transition: none !important;
}
.rx-limits-mount.pos-top-right { top: 76px; right: 18px; }
.rx-limits-mount.pos-top-left { top: 76px; left: 268px; }
.rx-limits-mount.pos-bottom-right { bottom: 14px; right: 18px; }
.rx-limits-mount.pos-bottom-left { bottom: 14px; left: 268px; }
.rx-limits-mount.pos-inline-header { top: 34px; right: 204px; }
.rx-limits-box {
  position: relative;
  box-sizing: border-box;
  max-width: 100%;
  overflow: hidden;
  background: color-mix(in srgb, var(--rx-theme-surface, var(--rx-surface)) 90%, transparent);
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
  border: 1px solid var(--rx-theme-border-strong, var(--rx-border-strong));
  box-shadow: var(--rx-widget-shadow);
  font-family: var(--rx-font-ui);
  transition: border-color 0.14s ease, box-shadow 0.14s ease, background 0.14s ease;
}
.rx-limits-mount.is-resizing .rx-limits-box {
  transition: none !important;
  border-color: var(--rx-accent) !important;
}
.rx-lim-resize-grip {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  opacity: 0.22;
  border-radius: 3px;
  background: linear-gradient(135deg, transparent 48%, currentColor 48%, currentColor 58%, transparent 58%, transparent 74%, currentColor 74%, currentColor 84%, transparent 84%);
  transition: opacity 0.14s ease, color 0.14s ease;
  z-index: 3;
}
.rx-limits-box:hover .rx-lim-resize-grip { opacity: 0.62; }
.rx-lim-resize-grip:hover, .rx-limits-mount.is-resizing .rx-lim-resize-grip { opacity: 1; color: var(--rx-accent); }
.rx-limits-box.is-docked-ui {
  box-shadow: 0 2px 10px -2px rgba(0, 0, 0, 0.12);
}
.rx-limits-box.is-floating-ui {
  box-shadow: var(--rx-widget-shadow);
}
.rx-limits-box.is-pill, .rx-limits-box.is-inline-header {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  width: fit-content;
  max-width: 100%;
  padding: 5px 10px;
  white-space: normal;
}
.rx-limits-box.is-inline-header {
  min-height: 28px;
  padding: 2px 9px;
}
.rx-limits-box.is-bars, .rx-limits-box.is-card {
  min-width: min(224px, 100%);
  max-width: min(440px, calc(100vw - 32px));
  padding: 10px 12px;
}
.rx-lim-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  cursor: grab;
}
.rx-limits-box.is-pinned .rx-lim-head, .rx-limits-box.is-pinned .rx-lim-drag, .rx-limits-box.is-docked-ui .rx-lim-head { cursor: default; }
.rx-limits-box.is-docked-ui .rx-lim-drag { display: none; }
.rx-lim-title { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; font-size: 0.96em; color: inherit; }
.rx-lim-acts { display: flex; align-items: center; gap: 2px; }
.rx-lim-drag { cursor: grab; opacity: 0.45; font-size: 11px; letter-spacing: -1px; }
.rx-lim-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.62;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 5px;
  font-size: 11.5px;
  line-height: 1;
  transition: opacity 0.12s ease, background 0.12s ease, color 0.12s ease;
}
.rx-lim-btn:hover { opacity: 1; background: var(--rx-hover); }
.rx-lim-btn.is-pinned { opacity: 0.92; color: var(--rx-accent); }
.rx-lim-fam { display: inline-flex; align-items: center; gap: 5px; }
.rx-lim-kv { display: inline-flex; align-items: center; gap: 4px; }
.rx-lim-dot { width: 6px; height: 6px; border-radius: 999px; display: inline-block; flex-shrink: 0; }
.rx-lim-sep { opacity: 0.28; }
.rx-lim-body { display: flex; flex-direction: column; gap: 7px; }
.rx-lim-row { display: flex; flex-direction: column; gap: 3px; }
.rx-lim-row-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.rx-lim-name { font-weight: 600; font-size: 0.92em; }
.rx-lim-reset { display: inline-flex; align-items: center; gap: 3px; font-size: 0.82em; opacity: 0.65; }
.rx-lim-bar-line { display: grid; grid-template-columns: 32px minmax(64px, 1fr) 44px; align-items: center; gap: 6px; }
.rx-lim-lbl { font-size: 0.84em; opacity: 0.68; }
.rx-lim-track { height: 5px; border-radius: 999px; background: var(--rx-border-strong); overflow: hidden; }
.rx-lim-fill { height: 100%; border-radius: 999px; transition: width 0.22s ease; }
.rx-lim-pct { font-variant-numeric: tabular-nums; text-align: right; font-weight: 600; font-size: 0.86em; }
.rx-lim-tip { font-size: 0.82em; opacity: 0.65; line-height: 1.35; margin-top: 2px; }

/* Slim Chat Quick Bar & Inline Live-Edit Capsule (anchored cleanly above composer, below modal backdrop) */
.rx-chat-dock {
  position: fixed;
  z-index: 42;
  display: flex;
  flex-direction: column;
  gap: 5px;
  pointer-events: none;
}
.rx-chat-dock:has(.rx-agent-popover),
.rx-chat-dock:has(.rx-ctx-popover) {
  z-index: 2147483140;
}
.rx-chat-dock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}
.rx-dock-right {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  pointer-events: none;
}
.rx-agent-chip, .rx-dock-tool-btn, .rx-live-send-pill, .rx-ctx-pill {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--rx-comp-radius, 9px);
  font-size: 11px;
  font-weight: 500;
  font-family: var(--rx-font-ui);
  border: 1px solid var(--rx-comp-border, color-mix(in srgb, var(--rx-theme-fg-strong, var(--rx-fg-strong)) 16%, var(--rx-theme-border-strong, var(--rx-border-strong))));
  background-color: var(--rx-comp-bg, var(--rx-theme-surface, var(--rx-surface)));
  background-image: var(--rx-comp-bg-image, none);
  color: color-mix(in srgb, var(--rx-theme-fg-strong, var(--rx-fg-strong)) 90%, var(--rx-theme-muted, var(--rx-muted)));
  backdrop-filter: blur(var(--rx-comp-blur, 14px)) saturate(160%);
  -webkit-backdrop-filter: blur(var(--rx-comp-blur, 14px)) saturate(160%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.14s ease, color 0.14s ease, border-color 0.14s ease, background-color 0.14s ease, box-shadow 0.14s ease;
}
.studio-root[data-app-theme="light"] .rx-agent-chip,
.studio-root[data-app-theme="light"] .rx-dock-tool-btn,
.studio-root[data-app-theme="light"] .rx-ctx-pill {
  border-color: var(--rx-comp-border, color-mix(in srgb, var(--rx-theme-fg-strong, var(--rx-fg-strong)) 15%, var(--rx-theme-border-strong, var(--rx-border-strong))));
  background-color: var(--rx-comp-bg, var(--rx-theme-surface, var(--rx-surface)));
  background-image: var(--rx-comp-bg-image, none);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.10);
}
.rx-agent-chip:hover, .rx-dock-tool-btn:hover, .rx-ctx-pill:hover {
  opacity: 1;
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
  border-color: color-mix(in srgb, var(--rx-accent) 48%, var(--rx-comp-border, var(--rx-theme-border-strong, var(--rx-border-strong))));
}
.studio-root[data-app-theme="light"] .rx-agent-chip.is-active {
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.12), 0 0 0 1px color-mix(in srgb, var(--rx-accent) 26%, transparent);
}
.rx-agent-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--rx-accent) 65%, var(--rx-theme-muted, var(--rx-muted)));
  flex-shrink: 0;
}
.rx-agent-chip.is-active .rx-agent-dot {
  background: var(--rx-accent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--rx-accent) 70%, transparent);
}
.rx-ctx-pill {
  font-variant-numeric: tabular-nums;
  gap: 6px;
  padding: 0 9px;
}
.rx-ctx-pill.is-warn {
  border-color: color-mix(in srgb, var(--rx-warning, #f59e0b) 55%, var(--rx-theme-border-strong, var(--rx-border-strong)));
}
.rx-ctx-pill.is-crit {
  border-color: color-mix(in srgb, var(--rx-danger, #ef4444) 65%, var(--rx-theme-border-strong, var(--rx-border-strong)));
  background: color-mix(in srgb, var(--rx-danger, #ef4444) 14%, var(--rx-theme-surface, var(--rx-surface)));
}
.rx-ctx-bar {
  width: 34px;
  height: 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rx-theme-fg-strong, var(--rx-fg-strong)) 14%, transparent);
  overflow: hidden;
  flex-shrink: 0;
}
.rx-ctx-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--rx-success, #22c55e);
  transition: width 0.22s ease, background-color 0.22s ease;
}
.rx-ctx-pill.is-warn .rx-ctx-fill { background: var(--rx-warning, #f59e0b); }
.rx-ctx-pill.is-crit .rx-ctx-fill { background: var(--rx-danger, #ef4444); }
.rx-ctx-model {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rx-theme-muted, var(--rx-muted));
  font-weight: 500;
}
.rx-ctx-nums {
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
  font-weight: 600;
}
.rx-ctx-pct {
  font-weight: 700;
  color: var(--rx-success, #22c55e);
}
.rx-ctx-pill.is-warn .rx-ctx-pct { color: var(--rx-warning, #f59e0b); }
.rx-ctx-pill.is-crit .rx-ctx-pct { color: var(--rx-danger, #ef4444); }
.rx-ctx-popover {
  pointer-events: auto;
  align-self: flex-end;
  width: 300px;
  max-width: 92vw;
  padding: 11px 12px;
  border-radius: var(--rx-r-lg, 12px);
  background: color-mix(in srgb, var(--rx-theme-surface, var(--rx-surface)) 97%, var(--rx-theme-fg-strong, var(--rx-fg-strong)) 3%);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid color-mix(in srgb, var(--rx-theme-fg-strong, var(--rx-fg-strong)) 20%, var(--rx-theme-border-strong, var(--rx-border-strong)));
  box-shadow: var(--rx-shadow);
  color: var(--rx-theme-fg, var(--rx-fg));
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}
.rx-ctx-pop-track {
  height: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rx-theme-fg-strong, var(--rx-fg-strong)) 12%, transparent);
  overflow: hidden;
}
.rx-ctx-pop-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--rx-success, #22c55e);
  transition: width 0.22s ease;
}
.rx-ctx-pop-fill.is-warn { background: var(--rx-warning, #f59e0b); }
.rx-ctx-pop-fill.is-crit { background: var(--rx-danger, #ef4444); }
.rx-ctx-pop-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border-radius: var(--rx-r-sm, 6px);
  background: color-mix(in srgb, var(--rx-theme-fg-strong, var(--rx-fg-strong)) 4%, transparent);
  border: 1px solid var(--rx-theme-border, var(--rx-border));
}
.rx-ctx-pop-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}
.rx-ctx-pop-row span { color: var(--rx-theme-muted, var(--rx-muted)); }
.rx-ctx-pop-row b { color: var(--rx-theme-fg-strong, var(--rx-fg-strong)); font-weight: 600; max-width: 175px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rx-ac-pill {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px 0 9px;
  border-radius: var(--rx-r-sm, 6px);
  font-size: 11px;
  font-weight: 550;
  font-family: var(--rx-font-ui);
  border: 1px solid color-mix(in srgb, var(--rx-accent) 52%, var(--rx-theme-border-strong, var(--rx-border-strong)));
  background: color-mix(in srgb, var(--rx-accent) 15%, var(--rx-theme-surface-2, var(--rx-theme-surface, var(--rx-surface))));
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 3px 10px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.studio-root[data-app-theme="light"] .rx-ac-pill {
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
}
.rx-ac-cancel {
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.72;
  cursor: pointer;
  padding: 0 2px;
  font-size: 11px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
}
.rx-ac-cancel:hover { opacity: 1; color: var(--rx-danger, #ef4444); }
.rx-ac-chat-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 175px;
  overflow-y: auto;
  padding-right: 2px;
}
.rx-ac-chat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 9px;
  border-radius: var(--rx-r-sm, 6px);
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  font-size: 11.5px;
}
.rx-ac-chat-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rx-fg-strong);
  font-weight: 500;
}
.rx-live-send-pill {
  opacity: 1;
  background: var(--rx-accent);
  color: var(--rx-accent-fg);
  border-color: var(--rx-accent);
  font-weight: 600;
}
.rx-live-send-pill:hover {
  background: color-mix(in srgb, var(--rx-accent) 88%, #ffffff);
  color: var(--rx-accent-fg);
}
.rx-live-queue-strip {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 5px 9px;
  border-radius: var(--rx-r-md, 9px);
  background: color-mix(in srgb, var(--rx-theme-surface, var(--rx-surface)) 96%, transparent);
  border: 1px solid var(--rx-theme-border-strong, var(--rx-border-strong));
  box-shadow: var(--rx-widget-shadow);
  font-size: 11.5px;
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
  backdrop-filter: blur(12px);
}
.rx-lq-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rx-lq-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  color: var(--rx-theme-fg, var(--rx-fg));
}
.rx-lq-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1.5px 6px;
  border-radius: var(--rx-r-xs, 4px);
  background: var(--rx-accent-soft);
  color: var(--rx-accent);
  flex-shrink: 0;
}
.rx-lq-badge.is-done {
  background: var(--rx-success-soft);
  color: var(--rx-success);
}
.rx-agent-popover {
  pointer-events: auto;
  width: 316px;
  max-width: 92vw;
  max-height: var(--rx-pop-max-h, min(62vh, 380px));
  overflow-y: auto;
  padding: 12px;
  border-radius: var(--rx-r-lg, 12px);
  background: color-mix(in srgb, var(--rx-theme-surface, var(--rx-surface)) 97%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--rx-theme-border-strong, var(--rx-border-strong));
  box-shadow: var(--rx-shadow);
  color: var(--rx-theme-fg, var(--rx-fg));
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.rx-pop-toggles {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--rx-theme-border, var(--rx-border));
  border-radius: var(--rx-r-md, 9px);
  background: var(--rx-theme-bg, var(--rx-surface));
  overflow: hidden;
}
.rx-pop-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  font-size: 12px;
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
}
.rx-pop-row + .rx-pop-row {
  border-top: 1px solid var(--rx-theme-border, var(--rx-border));
}
.rx-pop-pill {
  padding: 2.5px 8px;
  border-radius: var(--rx-r-xs, 4px);
  border: 1px solid var(--rx-theme-border-strong, var(--rx-border-strong));
  background: var(--rx-theme-surface, var(--rx-bg));
  color: var(--rx-theme-muted, var(--rx-muted));
  font-family: inherit;
  font-size: 11px;
  font-weight: 550;
  cursor: pointer;
  min-width: 68px;
  text-align: center;
  transition: color 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.12s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.12s cubic-bezier(0.16, 1, 0.3, 1);
}
.rx-pop-pill:hover { color: var(--rx-theme-fg-strong, var(--rx-fg-strong)); border-color: color-mix(in srgb, var(--rx-theme-fg-strong, var(--rx-fg)) 28%, transparent); }
.rx-pop-pill.is-on {
  background: var(--rx-accent-soft);
  border-color: var(--rx-accent-border);
  color: var(--rx-accent);
}
.rx-pop-pill.is-off {
  background: var(--rx-danger-soft);
  border-color: color-mix(in srgb, var(--rx-danger) 35%, transparent);
  color: var(--rx-danger);
}

/* Native-style Model Usage Popover (accessible even while agent is busy) */
.studio-root.is-auth-screen .widget-wrap,
.studio-root.is-auth-screen .rx-limits-mount,
.studio-root.is-auth-screen .rx-chat-dock,
.studio-root.is-auth-screen .rx-usage-pop-mount,
.studio-root.is-auth-screen .le-popover-mount,
.studio-root.is-auth-screen .update-toast-mount {
  display: none !important;
}
.rx-usage-pop-mount {
  position: fixed;
  z-index: 2147483150;
  pointer-events: none;
}
.rx-usage-pop {
  pointer-events: auto;
  width: 316px;
  max-width: calc(100vw - 24px);
  padding: 12px 14px;
  border-radius: var(--rx-r-lg, 12px);
  background: var(--rx-theme-surface, var(--rx-surface));
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
  border: 1px solid var(--rx-theme-border-strong, var(--rx-border-strong));
  box-shadow: 0 14px 36px -6px rgba(0, 0, 0, 0.34);
  font-family: var(--rx-font-ui);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.studio-root[data-app-theme="light"] .rx-usage-pop {
  box-shadow: 0 12px 32px -6px rgba(15, 23, 42, 0.16);
}
.rx-usage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--rx-theme-border, var(--rx-border));
}
.rx-usage-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
}
.rx-usage-lock-note {
  font-size: 10.5px;
  line-height: 1.35;
  padding: 5px 8px;
  border-radius: 7px;
  background: var(--rx-theme-surface-2, var(--rx-surface-2));
  color: var(--rx-theme-muted, var(--rx-muted));
  border: 1px solid var(--rx-theme-border, var(--rx-border));
}
.rx-usage-sec {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.rx-usage-sec + .rx-usage-sec {
  padding-top: 8px;
  border-top: 1px solid var(--rx-theme-border, var(--rx-border));
}
.rx-usage-sec-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
}
.rx-usage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.rx-usage-row-left {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.rx-usage-lbl {
  font-size: 11.5px;
  color: var(--rx-theme-fg, var(--rx-fg));
}
.rx-usage-reset {
  font-size: 10.5px;
  color: var(--rx-theme-muted, var(--rx-muted));
  white-space: nowrap;
}
.rx-usage-row-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 550;
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
  font-variant-numeric: tabular-nums;
}
.rx-usage-ring {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transform: rotate(-90deg);
}
.rx-usage-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding-top: 7px;
  border-top: 1px solid var(--rx-theme-border, var(--rx-border));
}
.rx-usage-foot-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--rx-theme-border-strong, var(--rx-border-strong));
  background: var(--rx-theme-surface-2, var(--rx-surface-2));
  color: var(--rx-theme-fg-strong, var(--rx-fg-strong));
  border-radius: 6px;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;
}
.rx-usage-foot-btn:hover {
  border-color: var(--rx-accent-border);
  color: var(--rx-accent);
}

/* Live Element Picker Overlay & Floating Inspector */
.rx-picker-banner {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483640;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 13px;
  border-radius: var(--rx-r-md, 9px);
  background: var(--rx-glass-strong);
  backdrop-filter: blur(16px);
  color: var(--rx-fg-strong);
  border: 1px solid var(--rx-accent-border);
  box-shadow: var(--rx-shadow);
  font-size: 12px;
  pointer-events: auto;
}
.rx-picker-highlight {
  position: fixed;
  z-index: 2147483635;
  pointer-events: none;
  border: 2px solid var(--rx-accent);
  background: var(--rx-accent-soft);
  border-radius: var(--rx-r-sm, 5px);
  transition: top 0.06s ease-out, left 0.06s ease-out, width 0.06s ease-out, height 0.06s ease-out, opacity 0.08s ease-out;
  will-change: top, left, width, height;
}
.rx-picker-tag {
  position: absolute;
  top: -23px;
  left: 0;
  padding: 2px 7px;
  border-radius: var(--rx-r-xs, 4px);
  background: var(--rx-accent);
  color: var(--rx-accent-fg);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.rx-picker-highlight.is-tag-below .rx-picker-tag {
  top: calc(100% + 4px);
}
.rx-picker-marquee {
  position: fixed;
  z-index: 2147483638;
  pointer-events: none;
  border: 1.5px dashed var(--rx-accent);
  background: color-mix(in srgb, var(--rx-accent) 14%, transparent);
  border-radius: 4px;
}
.rx-picker-match-box {
  position: fixed;
  z-index: 2147483634;
  pointer-events: none;
  border: 1.5px dashed color-mix(in srgb, var(--rx-accent) 88%, #fff);
  background: color-mix(in srgb, var(--rx-accent) 9%, transparent);
  border-radius: 4px;
  transition: top 0.06s ease-out, left 0.06s ease-out, width 0.06s ease-out, height 0.06s ease-out;
}
.rx-picker-match-num {
  position: absolute;
  top: -1px;
  left: -1px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 3px 0 4px 0;
  background: var(--rx-accent);
  color: var(--rx-accent-fg);
  font-size: 9.5px;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
}
.rx-picker-mode-pills {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px;
  border-radius: 7px;
  background: var(--rx-surface);
  border: 1px solid var(--rx-border);
}
.rx-picker-mode-btn {
  border: none;
  background: transparent;
  color: var(--rx-muted);
  font-family: inherit;
  font-size: 11px;
  font-weight: 550;
  padding: 3px 7px;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
}
.rx-picker-mode-btn:hover {
  color: var(--rx-fg-strong);
}
.rx-picker-mode-btn.is-active {
  background: var(--rx-accent);
  color: var(--rx-accent-fg);
}
.rx-insp-match-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 600;
  background: var(--rx-accent-soft);
  color: var(--rx-accent);
  border: 1px solid var(--rx-accent-border);
  white-space: nowrap;
}
.rx-insp-match-badge.is-warn {
  background: rgba(245, 158, 11, 0.14);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.4);
}
.rx-insp-group-bar {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px 8px;
  border-radius: var(--rx-r-md, 9px);
  border: 1px solid var(--rx-accent-border);
  background: var(--rx-surface);
}
.rx-insp-group-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.rx-insp-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 165px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10.5px;
  background: var(--rx-surface-2);
  border: 1px solid var(--rx-border);
  color: var(--rx-fg);
}
.rx-insp-chip-lbl {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rx-insp-chip-x {
  border: none;
  background: transparent;
  color: var(--rx-muted);
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 0 2px;
}
.rx-insp-chip-x:hover {
  color: var(--rx-danger);
}
.rx-insp-pos-box {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 8px;
  border-radius: var(--rx-r-md, 9px);
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
}
.rx-insp-pos-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rx-insp-dpad {
  display: grid;
  grid-template-columns: repeat(3, 28px);
  grid-template-rows: repeat(3, 24px);
  gap: 3px;
  flex-shrink: 0;
}
.rx-insp-dpad-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rx-border-strong);
  background: var(--rx-surface-2);
  color: var(--rx-fg-strong);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  padding: 0;
}
.rx-insp-dpad-btn:hover {
  border-color: var(--rx-accent-border);
  color: var(--rx-accent);
}
.rx-insp-dpad-btn.is-zero {
  font-size: 10px;
  color: var(--rx-muted);
}
.rx-insp-pos-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}
.rx-insp-step-pills {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}
.rx-insp-step-pill {
  border: 1px solid var(--rx-border);
  background: transparent;
  color: var(--rx-muted);
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 10.5px;
  font-family: var(--rx-font-mono);
  cursor: pointer;
}
.rx-insp-step-pill.is-active {
  background: var(--rx-accent-soft);
  border-color: var(--rx-accent-border);
  color: var(--rx-accent);
  font-weight: 650;
}
.rx-insp-drag-btn {
  width: 100%;
  justify-content: center;
}
.rx-insp-drag-btn.is-active {
  background: var(--rx-accent) !important;
  color: var(--rx-accent-fg) !important;
  border-color: var(--rx-accent) !important;
}
.rx-inspector-card {
  position: fixed;
  right: 18px;
  top: 46px;
  width: 396px;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 62px);
  overflow-y: auto;
  z-index: 2147483642;
  padding: 12px 13px;
  border-radius: var(--rx-r-lg, 12px);
  background: var(--rx-glass-strong);
  backdrop-filter: blur(18px);
  color: var(--rx-fg);
  border: 1px solid var(--rx-border-strong);
  box-shadow: var(--rx-shadow);
  display: flex;
  flex-direction: column;
  gap: 7px;
  pointer-events: auto;
  transition: right 0.16s ease, left 0.16s ease;
}
.rx-inspector-card.is-drawer-open {
  right: calc(min(478px, 100vw - 28px) + 28px);
}
@media (max-width: 960px) {
  .rx-inspector-card.is-drawer-open {
    right: auto;
    left: 14px;
    width: min(360px, calc(100vw - 28px));
  }
}
.rx-insp-sec-title {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rx-muted);
  margin-top: 2px;
}
.rx-insp-slider-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.rx-insp-slider-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border-radius: var(--rx-r-md, 9px);
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  min-width: 0;
}
.rx-insp-slider-item.is-custom {
  border-color: var(--rx-accent-border);
}
.rx-insp-slider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  font-size: 11px;
  color: var(--rx-fg);
}
.rx-insp-slider-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.rx-insp-slider-row .range-input {
  flex: 1;
  min-width: 0;
}
.rx-insp-num {
  width: 50px !important;
  padding: 2px 5px !important;
  font-size: 11.5px !important;
  font-family: var(--rx-font-mono);
  text-align: right;
  flex-shrink: 0;
}
.rx-insp-unit {
  font-size: 10px;
  color: var(--rx-muted);
  font-family: var(--rx-font-mono);
  min-width: 12px;
}
.rx-insp-reset-btn {
  padding: 1px 4px !important;
  min-height: 18px;
  font-size: 10.5px !important;
  line-height: 1;
}
.rx-insp-hex {
  font-size: 10px;
  font-family: var(--rx-font-mono);
  color: var(--rx-muted);
  white-space: nowrap;
}
.rx-insp-hex-input {
  width: 72px !important;
  min-width: 64px;
  padding: 2px 5px !important;
  font-size: 11px !important;
  font-family: var(--rx-font-mono);
  text-transform: lowercase;
  flex-shrink: 0;
}
.rx-insp-tree-btn {
  min-width: 24px;
  padding: 2px 6px !important;
  font-size: 11px !important;
  font-weight: 600;
}
.rx-insp-tree-btn:disabled {
  opacity: 0.38;
  cursor: default;
}
.rx-insp-nudge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 8px;
  border-radius: var(--rx-r-md, 9px);
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  font-size: 11px;
  color: var(--rx-muted);
}
.rx-insp-nudge-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}
.rx-insp-nudge-btn {
  min-width: 24px;
  padding: 2px 6px !important;
  font-size: 11px !important;
  font-family: var(--rx-font-mono);
}
.rx-insp-footer {
  position: sticky;
  bottom: -12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 8px 0 2px;
  margin-top: 2px;
  background: var(--rx-glass-strong);
  border-top: 1px solid var(--rx-border);
  z-index: 2;
}

/* Sidebar Search, Zone Map, Keybindings, Workshop */
.rx-search-wrap {
  padding: 0 2px 4px;
}
.rx-search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 9px;
  border-radius: var(--rx-r-sm, 6px);
  border: 1px solid var(--rx-border);
  background: var(--rx-bg);
  color: var(--rx-fg-strong);
  font-family: inherit;
  font-size: 11.5px;
  outline: none;
  transition: border-color 0.12s ease;
}
.rx-search-input::placeholder { color: var(--rx-muted); }
.rx-search-input:focus { border-color: var(--rx-accent); }
.modal-shell[data-studio-layout="rail"] .rx-search-wrap,
.modal-shell[data-studio-layout="topbar"] .rx-search-wrap {
  display: none;
}

.rx-zone-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.rx-zone-btn {
  text-align: left;
  padding: 7.5px 10px;
  border-radius: var(--rx-r-sm, 6px);
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  color: var(--rx-fg-strong);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  transition: border-color 0.12s ease, background 0.12s ease;
}
.rx-zone-btn:hover { border-color: var(--rx-border-strong); background: var(--rx-surface-2); }
.rx-zone-btn.is-active {
  border-color: var(--rx-accent);
  background: var(--rx-accent-soft);
}
.rx-kb-btn {
  min-width: 118px;
  padding: 4px 9px;
  border-radius: var(--rx-r-sm, 6px);
  border: 1px solid var(--rx-border-strong);
  background: var(--rx-bg);
  color: var(--rx-fg-strong);
  font-family: var(--rx-font-mono);
  font-size: 11px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.12s ease, color 0.12s ease;
}
.rx-kb-btn:hover { border-color: color-mix(in srgb, var(--rx-fg) 30%, transparent); }
.rx-kb-btn.is-recording {
  border-color: var(--rx-accent);
  color: var(--rx-accent);
  background: var(--rx-accent-soft);
}
.rx-preset-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rx-preset-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5.5px 10px;
  border-radius: var(--rx-r-sm, 6px);
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  color: var(--rx-fg-strong);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 550;
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;
}
.rx-preset-chip:hover { border-color: var(--rx-border-strong); background: var(--rx-surface-2); }
.rx-preset-chip.is-selected {
  border-color: var(--rx-accent);
  background: var(--rx-accent-soft);
}
.rx-ws-card {
  padding: 10px 12px;
  border-radius: var(--rx-r-md, 9px);
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.rx-ws-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rx-color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Screenshot Pencil Annotator Overlay — Full-Viewport Studio Canvas */
.rx-annotator-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483645;
  background: rgba(6, 6, 8, 0.80);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.studio-root[data-theme="light"] .rx-annotator-backdrop,
.studio-root[data-studio-theme="claude-light"] .rx-annotator-backdrop {
  background: rgba(15, 23, 42, 0.42);
}
.rx-annotator-shell {
  width: min(94vw, 1560px);
  height: min(92vh, 980px);
  border-radius: var(--rx-r-lg, 14px);
  background: var(--rx-shell-bg);
  border: 1px solid var(--rx-border-strong);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--rx-fg-strong);
}
.studio-root[data-theme="light"] .rx-annotator-shell,
.studio-root[data-studio-theme="claude-light"] .rx-annotator-shell {
  box-shadow: 0 22px 64px rgba(15, 23, 42, 0.24);
}
.rx-ann-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--rx-border);
  background: var(--rx-sidebar-bg);
  flex-wrap: wrap;
}
.rx-ann-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.rx-ann-seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  background: var(--rx-bg);
  border: 1px solid var(--rx-border);
}
.rx-ann-sep {
  width: 1px;
  height: 18px;
  background: var(--rx-border-strong);
  margin: 0 5px;
}
.rx-ann-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 28px;
  padding: 0 9px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--rx-muted);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 550;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}
.rx-ann-tool-btn:hover:not(:disabled) { background: var(--rx-hover); color: var(--rx-fg-strong); }
.rx-ann-tool-btn:disabled { opacity: 0.35; cursor: default; }
.rx-ann-tool-btn.is-active {
  background: var(--rx-accent-soft);
  border-color: var(--rx-accent-border);
  color: var(--rx-accent);
}
.rx-ann-dot-sz {
  display: inline-block;
  border-radius: 50%;
  background: currentColor;
}
.rx-ann-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s ease, border-color 0.12s ease;
}
.rx-ann-color:hover { transform: scale(1.1); }
.rx-ann-color.is-active {
  border-color: var(--rx-fg-strong);
  box-shadow: 0 0 0 2px var(--rx-bg) inset;
  transform: scale(1.08);
}
.rx-ann-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
  background-color: var(--rx-bg);
  background-image: radial-gradient(color-mix(in srgb, var(--rx-fg) 10%, transparent) 1px, transparent 1px);
  background-size: 18px 18px;
}
.rx-ann-canvas-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin: auto;
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.55);
  border: 1px solid var(--rx-border-strong);
  border-radius: var(--rx-r-md, 9px);
  overflow: hidden;
  background: #0d0d0f;
}
.studio-root[data-theme="light"] .rx-ann-canvas-wrap,
.studio-root[data-studio-theme="claude-light"] .rx-ann-canvas-wrap {
  background: var(--rx-surface);
  box-shadow: 0 14px 42px rgba(15, 23, 42, 0.18);
}
.rx-ann-canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
}
.rx-ann-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--rx-muted);
  font-size: 13px;
  text-align: center;
  max-width: 380px;
}
.rx-ann-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid var(--rx-border);
  background: var(--rx-sidebar-bg);
  flex-wrap: wrap;
}
.rx-ann-zoom-bar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid var(--rx-border);
  background: var(--rx-bg);
}
.rx-ann-dims {
  font-size: 11px;
  color: var(--rx-muted);
  font-family: var(--rx-font-mono);
  margin-left: 6px;
}
.rx-ann-note {
  flex: 1;
  min-width: 160px;
  max-width: 440px;
}

/* Input History & Composer Drafts */
.rx-hist-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rx-hist-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--rx-r-md, 9px);
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
}
.rx-hist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.rx-hist-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 11px;
  color: var(--rx-muted);
}
.rx-hist-chat {
  font-weight: 600;
  color: var(--rx-fg);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rx-hist-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  color: var(--rx-accent);
  border: 1px solid var(--rx-accent-border);
  background: var(--rx-accent-soft);
}
.rx-hist-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.rx-hist-text {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--rx-r-sm, 6px);
  border: 1px solid var(--rx-border);
  background: var(--rx-bg);
  color: var(--rx-fg-strong);
  font-size: 12.5px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 132px;
  overflow-y: auto;
  user-select: text;
}
.rx-hist-atts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rx-hist-att {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: var(--rx-r-sm, 6px);
  border: 1px solid var(--rx-border);
  background: var(--rx-bg);
  max-width: 100%;
}
.rx-hist-thumb {
  width: 40px;
  height: 40px;
  border-radius: var(--rx-r-sm, 6px);
  object-fit: cover;
  border: 1px solid var(--rx-border);
  flex-shrink: 0;
}
.rx-hist-file-ico {
  width: 34px;
  height: 34px;
  border-radius: var(--rx-r-sm, 6px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--rx-surface-2);
  border: 1px solid var(--rx-border);
  color: var(--rx-muted);
  flex-shrink: 0;
}
.rx-inspector-card::-webkit-scrollbar,
.rx-agent-popover::-webkit-scrollbar,
.rx-hist-text::-webkit-scrollbar,
.rx-ac-chat-list::-webkit-scrollbar { width: 5px; height: 5px; }
.rx-inspector-card::-webkit-scrollbar-track,
.rx-agent-popover::-webkit-scrollbar-track,
.rx-hist-text::-webkit-scrollbar-track,
.rx-ac-chat-list::-webkit-scrollbar-track { background: transparent; }
.rx-inspector-card::-webkit-scrollbar-thumb,
.rx-agent-popover::-webkit-scrollbar-thumb,
.rx-hist-text::-webkit-scrollbar-thumb,
.rx-ac-chat-list::-webkit-scrollbar-thumb { background: var(--rx-border-strong); border-radius: 999px; }
.rx-hist-att-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}
.rx-hist-att-name {
  font-size: 11.5px;
  font-weight: 550;
  color: var(--rx-fg-strong);
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rx-hist-att-size {
  font-size: 10.5px;
  color: var(--rx-muted);
  font-family: var(--rx-font-mono);
}
`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    rv5IconSvg,
    RUDEX_AGENT_PRESETS,
    RUDEX_UI_ZONES,
    RUDEX_KEYBINDING_DEFS,
    RUDEX_LIMITS_DEFAULTS,
    RUDEX_KEYBINDINGS_DEFAULTS,
    RUDEX_LIVE_EDIT_DEFAULTS,
    RUDEX_QUOTA_AUTOMATION_DEFAULTS,
    RUDEX_AGENT_PROFILE_DEFAULTS,
    rv5NormalizeQuotaAutomation,
    rv5FormatContextTokens,
    rv5ResolveModelContextWindow,
    rv5EscapeHtml,
    rv5FormatKeyboardEvent,
    rv5NormalizeLimitsWidget,
    rv5NormalizeKeybindings,
    rv5NormalizeAgentProfile,
    rv5CountActiveAgentFeatures,
    rv5SummarizeActiveToggles,
    rv5BuildLimitsWidgetHtml,
    rv5BuildSmartSelector,
    rv5DescribeElementFriendly,
    rv5IsRenameSafeElement,
    rv5FindNativeComposer,
    rv5ReadEditableText,
    rv5ClearEditableText,
    rv5BuildExtraShadowCss,
  };
}
