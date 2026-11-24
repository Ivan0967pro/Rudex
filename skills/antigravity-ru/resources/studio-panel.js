"use strict";

/**
 * Antigravity RU Studio — draggable, dockable 3-mode minimalist widget (mini / medium / large).
 * Pure browser-compatible JS (no Node requires) using an isolated Shadow DOM root.
 */

const BUILTIN_PERSONA_PRESETS = [
  {
    id: "concise",
    labelRu: "Кратко и по делу",
    labelEn: "Concise",
    text: "Отвечай максимально кратко и по существу, без лишних вступлений и воды. Приоритет — готовый код и точные команды.",
  },
  {
    id: "mentor",
    labelRu: "Наставник",
    labelEn: "Mentor",
    text: "Объясняй решения шаг за шагом как дружелюбный опытный наставник: кратко поясняй, почему выбран этот подход, и приводи понятные примеры.",
  },
  {
    id: "senior",
    labelRu: "Senior-ревьюер",
    labelEn: "Senior Reviewer",
    text: "Проводи строгий инженерный разбор: проверяй крайние случаи, архитектуру, производительность и безопасность. Сразу указывай на слабые места.",
  },
  {
    id: "simple",
    labelRu: "Простым языком",
    labelEn: "Plain Language",
    text: "Объясняй всё простым, понятным человеческим языком без перегруженного жаргона. Если используешь сложный термин — сразу поясняй его в скобках.",
  },
  {
    id: "ru_only",
    labelRu: "Всегда на русском",
    labelEn: "Always Russian",
    text: "Всегда отвечай на грамотном русском языке, сохраняя технические идентификаторы, пути, команды и фрагменты кода в оригинале на английском.",
  },
];

function estimateTokens(text) {
  if (typeof text !== "string" || !text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  let cyr = 0;
  let ascii = 0;
  let other = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code >= 0x0400 && code <= 0x04ff) cyr++;
    else if (code <= 0x7f) ascii++;
    else other++;
  }
  const est = Math.round(cyr / 2.4 + ascii / 3.8 + other / 1.5);
  return Math.max(1, est);
}

function measureUtf8Bytes(str) {
  const s = String(str || "");
  if (typeof TextEncoder === "function") {
    return new TextEncoder().encode(s).length;
  }
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}

function createStudioPanel(options) {
  const doc = options && options.document;
  const win = (options && options.window) || (doc && doc.defaultView) || {};
  const ipc = options && options.ipcRenderer;
  const pluginMeta = (options && options.pluginMeta) || {};
  const MAX_PERSONA_BYTES = 23500;

  let locale = options && options.initialLocale === "en" ? "en" : "ru";
  let activeTab = "monitor"; // "monitor" | "persona" | "settings"
  let lastCompactMode = "mini"; // "mini" | "medium"
  let showSavePresetBar = false;
  let personaSaveFeedback = null;
  let personaDirty = false;
  let initialized = false;
  let pollTimer = null;
  let isDragging = false;

  let settings = {
    panelEnabled: true,
    viewMode: "mini", // "mini" | "medium" | "large"
    layoutMode: "docked", // "docked" | "floating"
    dockPosition: "bottom", // "top" | "middle" | "bottom" | "hidden"
    floatX: null,
    floatY: null,
    miniFields: {
      status: true,
      lang: true,
      tps: true,
      respTokens: false,
      chatTokens: false,
      model: false,
    },
    trackHistory: true,
    personaEnabled: false,
    personaActivePreset: "custom",
    personaText: "",
    customPresets: [],
  };
  let personaFileExists = false;

  const monitor = {
    phase: "idle", // "idle" | "thinking" | "streaming"
    thinkingSec: 0,
    modelName: "",
    contextNote: "",
    liveTps: 0,
    lastAvgTps: 0,
    peakTps: 0,
    responseTokens: 0,
    responseChars: 0,
    chatTokens: 0,
    sparkline: [],
    history: [],
  };

  let lastConvKey = "";
  let activeResponseEl = null;
  let isWorking = false;
  let turnStartMs = 0;
  let turnBaselineTokens = 0;
  let turnPeakTps = 0;
  let windowSamples = [];
  let turnCounter = 0;

  let hostEl = null;
  let shadow = null;
  let ui = {};

  const I18N = {
    ru: {
      brand: "Antigravity RU Studio",
      brandShort: "RU Studio",
      tabMonitor: "Монитор",
      tabPersona: "Характер",
      tabSettings: "Настройки",
      modeMini: "Мини",
      modeMed: "Средний",
      modeLarge: "Большой",
      sizeTitle: "Размер окна",
      statusIdle: "Ожидание",
      statusThinking: "Думает…",
      statusStreaming: "Генерация…",
      modelUnknown: "Модель не определена",
      tpsLabel: "Скорость (TPS)",
      tpsUnit: "т/с",
      peakPrefix: "Пик:",
      respLabel: "Ответ",
      chatLabel: "Чат",
      tokUnit: "ток",
      charsUnit: "симв.",
      sparkTitle: "График скорости генерации",
      historyTitle: "Последние ответы",
      historyEmpty: "Отправьте сообщение, чтобы увидеть живую скорость и оценку токенов.",
      resetStats: "Сбросить",
      estNote: "* Оценка по потоку в DOM (±10–15%). Точный счётчик сервера в UI недоступен.",
      personaToggle: "Включить правила характера",
      personaActive: "Активно",
      personaOff: "Выключено",
      personaHint: "Сохраняется как официальное Global Rule (always_on) и действует со следующего нового чата.",
      presetsLabel: "Пресеты",
      personaPlaceholder: "Опишите желаемый характер, стиль ответов, формат кода или ограничения агента...",
      saveAndApply: "Сохранить и применить",
      addToPresets: "+ В пресеты",
      clearText: "Очистить",
      presetNamePlaceholder: "Название пресета...",
      savePresetBtn: "Сохранить",
      cancelBtn: "Отмена",
      savedOk: "Сохранено в antigravity-ru-persona.md — применится в следующем чате",
      disabledOk: "Правило характера отключено (файл удалён)",
      limitErr: "Превышен лимит 23 500 байт — сократите текст",
      bytesLabel: "байт",
      langTitle: "Язык интерфейса",
      dockTitle: "Привязка и позиция окна",
      dockTop: "Правый верх",
      dockMiddle: "По центру",
      dockBottom: "Правый низ",
      dockHidden: "Скрыт",
      resetPos: "Сбросить позицию",
      pinTipDocked: "Прикреплено справа (потяните за шапку, чтобы переместить)",
      pinTipFloating: "Свободное окно (нажмите, чтобы закрепить справа)",
      dragTip: "Перетащите в любое место экрана",
      miniFieldsTitle: "Параметры в Мини-режиме",
      mfStatus: "Индикатор статуса",
      mfLang: "Язык (RU/EN)",
      mfTps: "Скорость (TPS)",
      mfRespTok: "Токены ответа",
      mfChatTok: "Токены чата",
      mfModel: "Название модели",
      hotkeyHintDock: "Перетаскивайте окно за шапку. Ctrl+Alt+P — свернуть/развернуть",
      hotkeyHintLang: "Быстрое переключение: Ctrl+Alt+L",
      trackHistoryLabel: "Сохранять историю скорости ответов",
      pluginInfoTitle: "О плагине",
      infoVersion: "Версия",
      infoDict: "Строк в словаре",
      infoRules: "Динамических правил",
      infoRepo: "Репозиторий на GitHub",
      stage2Title: "Скоро в Этапе 2",
      stage2Desc: "Режимы оформления (Стандартный / Улучшенный / Стекло / Неон / Кастом), студия обоев (фото, градиенты, видео с предпросмотром) и выбор шрифтов.",
      collapseTip: "Свернуть (Esc)",
      expandMedTip: "Средний вид",
      expandLargeTip: "Открыть Studio (Ctrl+Alt+P)",
    },
    en: {
      brand: "Antigravity RU Studio",
      brandShort: "RU Studio",
      tabMonitor: "Monitor",
      tabPersona: "Persona",
      tabSettings: "Settings",
      modeMini: "Mini",
      modeMed: "Medium",
      modeLarge: "Large",
      sizeTitle: "Widget Size",
      statusIdle: "Idle",
      statusThinking: "Thinking…",
      statusStreaming: "Streaming…",
      modelUnknown: "Model not detected",
      tpsLabel: "Speed (TPS)",
      tpsUnit: "t/s",
      peakPrefix: "Peak:",
      respLabel: "Response",
      chatLabel: "Chat",
      tokUnit: "tok",
      charsUnit: "chars",
      sparkTitle: "Live generation speed",
      historyTitle: "Recent responses",
      historyEmpty: "Send a message to see live generation speed and token estimates.",
      resetStats: "Reset",
      estNote: "* Estimated from live DOM stream (±10–15%). Exact server token counts are not exposed to UI.",
      personaToggle: "Enable persona rules",
      personaActive: "Active",
      personaOff: "Disabled",
      personaHint: "Saved as an official Global Rule (always_on) and takes effect starting from the next new chat.",
      presetsLabel: "Presets",
      personaPlaceholder: "Describe desired agent personality, tone, coding style, or constraints...",
      saveAndApply: "Save & Apply",
      addToPresets: "+ Save Preset",
      clearText: "Clear",
      presetNamePlaceholder: "Preset name...",
      savePresetBtn: "Save",
      cancelBtn: "Cancel",
      savedOk: "Saved to antigravity-ru-persona.md — applies in the next new chat",
      disabledOk: "Persona rule disabled (file removed)",
      limitErr: "Exceeds 23,500 byte limit — please shorten the text",
      bytesLabel: "bytes",
      langTitle: "Interface Language",
      dockTitle: "Position & Docking",
      dockTop: "Top Right",
      dockMiddle: "Center",
      dockBottom: "Bottom Right",
      dockHidden: "Hidden",
      resetPos: "Reset position",
      pinTipDocked: "Docked to right edge (drag header to float)",
      pinTipFloating: "Floating (click to snap back to right edge)",
      dragTip: "Drag anywhere on screen",
      miniFieldsTitle: "Visible Fields in Mini Mode",
      mfStatus: "Status dot",
      mfLang: "Language (RU/EN)",
      mfTps: "Speed (TPS)",
      mfRespTok: "Response tokens",
      mfChatTok: "Chat tokens",
      mfModel: "Model name",
      hotkeyHintDock: "Drag header to reposition. Ctrl+Alt+P toggles compact/large",
      hotkeyHintLang: "Quick switch: Ctrl+Alt+L",
      trackHistoryLabel: "Keep response speed history",
      pluginInfoTitle: "Plugin Info",
      infoVersion: "Version",
      infoDict: "Dictionary entries",
      infoRules: "Dynamic rules",
      infoRepo: "GitHub Repository",
      stage2Title: "Coming in Stage 2",
      stage2Desc: "Theme presets (Default / Enhanced / Glass / Neon / Custom), Wallpaper Studio (images, gradients, video with live preview), and custom fonts.",
      collapseTip: "Collapse (Esc)",
      expandMedTip: "Medium view",
      expandLargeTip: "Open Studio (Ctrl+Alt+P)",
    },
  };

  function t(key) {
    return (I18N[locale] && I18N[locale][key]) || I18N.ru[key] || key;
  }

  function formatInt(n) {
    return Math.max(0, Math.round(Number(n) || 0)).toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
  }

  function getStylesheet() {
    return `
      :host {
        all: initial;
        font-family: var(--font-sans, "Inter", "Segoe UI", system-ui, -apple-system, sans-serif);
        color: var(--foreground, #e4e4e7);
        font-size: 12.5px;
        line-height: 1.45;
      }
      * { box-sizing: border-box; }
      button, input, textarea { font-family: inherit; color: inherit; }

      .widget {
        position: fixed;
        z-index: 2147483000;
        background: color-mix(in srgb, var(--background, #121215) 90%, transparent);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--card-border, rgba(255,255,255,0.13));
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
        color: var(--foreground, #e4e4e7);
        transition: box-shadow 0.18s ease, border-color 0.18s ease;
      }
      .widget.dragging {
        transition: none !important;
        border-color: var(--primary, #007acc);
        box-shadow: 0 20px 52px rgba(0, 0, 0, 0.62);
        user-select: none;
      }
      .widget.mode-mini {
        border-radius: 11px;
        width: auto;
        max-width: min(420px, calc(100vw - 16px));
      }
      .widget.mode-medium {
        border-radius: 13px;
        width: 264px;
        max-width: calc(100vw - 16px);
      }
      .widget.mode-large {
        border-radius: 14px;
        width: 356px;
        max-width: calc(100vw - 16px);
        max-height: calc(100vh - 76px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Docked snapping */
      .widget.dock-top { top: 72px; right: 10px; }
      .widget.dock-middle { top: 50%; right: 10px; transform: translateY(-50%); }
      .widget.dock-bottom { bottom: 84px; right: 10px; }
      .widget.dock-hidden.mode-mini { display: none; }
      .widget.dock-hidden.mode-medium,
      .widget.dock-hidden.mode-large { bottom: 84px; right: 10px; }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--muted-foreground, #71717a);
        flex-shrink: 0;
        transition: background 0.2s ease, box-shadow 0.2s ease;
      }
      .dot.thinking {
        background: var(--warning, #e8975f);
        box-shadow: 0 0 8px var(--warning, #e8975f);
        animation: agyPulse 1.2s ease-in-out infinite;
      }
      .dot.streaming {
        background: var(--success, #34d399);
        box-shadow: 0 0 8px var(--success, #34d399);
        animation: agyPulse 0.9s ease-in-out infinite;
      }
      @keyframes agyPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.45; transform: scale(0.85); }
      }

      /* MINI VIEW */
      .mini-bar {
        display: none;
        align-items: center;
        gap: 6px;
        padding: 5px 7px;
        cursor: grab;
        user-select: none;
      }
      .mini-bar:active { cursor: grabbing; }
      .widget.mode-mini .mini-bar { display: flex; }
      .grip {
        font-size: 11px;
        line-height: 1;
        letter-spacing: -1px;
        color: var(--muted-foreground, #71717a);
        cursor: grab;
        padding: 1px 2px;
        flex-shrink: 0;
      }
      .mini-lang {
        border: none;
        background: var(--secondary, #27272a);
        color: var(--foreground, #f4f4f5);
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 5px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .mini-lang:hover { background: var(--primary, #007acc); color: #fff; }
      .mini-stat {
        font-size: 11px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        color: var(--foreground, #e4e4e7);
      }
      .mini-stat.tps { color: var(--primary, #38bdf8); }
      .mini-model {
        font-size: 10.5px;
        color: var(--muted-foreground, #a1a1aa);
        max-width: 110px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mini-actions {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        margin-left: 1px;
        padding-left: 5px;
        border-left: 1px solid var(--card-border, rgba(255,255,255,0.1));
      }
      .sz-btn {
        border: none;
        background: transparent;
        color: var(--muted-foreground, #a1a1aa);
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 5px;
        border-radius: 5px;
        cursor: pointer;
      }
      .sz-btn:hover { background: var(--secondary, #27272a); color: var(--foreground, #fff); }
      .sz-btn.active { background: var(--primary, #007acc); color: var(--primary-foreground, #fff); }

      /* MEDIUM & LARGE SHARED HEADER */
      .med-wrap, .large-wrap { display: none; flex-direction: column; }
      .widget.mode-medium .med-wrap { display: flex; }
      .widget.mode-large .large-wrap { display: flex; height: 100%; max-height: calc(100vh - 76px); }

      .hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 8px 10px;
        border-bottom: 1px solid var(--card-border, rgba(255,255,255,0.09));
        background: color-mix(in srgb, var(--card, #18181b) 78%, transparent);
        cursor: grab;
        user-select: none;
      }
      .hdr:active { cursor: grabbing; }
      .hdr-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
      .logo-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 21px;
        height: 21px;
        border-radius: 6px;
        font-size: 9.5px;
        font-weight: 800;
        background: linear-gradient(135deg, #1d4ed8, #0284c7);
        color: #fff;
        flex-shrink: 0;
      }
      .hdr-title {
        font-size: 12px;
        font-weight: 650;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hdr-ver { font-size: 10px; color: var(--muted-foreground, #8a8a93); }
      .hdr-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

      .seg {
        display: inline-flex;
        padding: 2px;
        border-radius: 7px;
        background: var(--secondary, #27272a);
        border: 1px solid var(--card-border, rgba(255,255,255,0.08));
      }
      .seg button {
        border: none;
        background: transparent;
        padding: 2px 6px;
        font-size: 10.5px;
        font-weight: 650;
        border-radius: 5px;
        cursor: pointer;
        color: var(--muted-foreground, #a1a1aa);
        transition: background 0.14s ease, color 0.14s ease;
      }
      .seg button.active {
        background: var(--primary, #007acc);
        color: var(--primary-foreground, #ffffff);
      }

      .icon-btn {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--muted-foreground, #a1a1aa);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        line-height: 1;
        padding: 0;
      }
      .icon-btn:hover { background: var(--secondary, #27272a); color: var(--foreground, #fff); }
      .icon-btn.pinned { color: var(--primary, #38bdf8); }

      /* MEDIUM BODY */
      .med-body {
        padding: 9px 10px 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .med-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
      }
      .med-metric {
        background: var(--card, #18181b);
        border: 1px solid var(--card-border, rgba(255,255,255,0.09));
        border-radius: 8px;
        padding: 6px 7px;
        min-width: 0;
      }
      .med-metric .metric-val { font-size: 13px; }
      .spark-svg {
        width: 100%;
        height: 56px;
        display: block;
        border-radius: 6px;
        background: color-mix(in srgb, var(--muted, #111113) 75%, transparent);
      }
      .med-spark-svg {
        width: 100%;
        height: 44px;
        display: block;
        border-radius: 6px;
        background: color-mix(in srgb, var(--muted, #111113) 75%, transparent);
      }

      /* LARGE TABS & BODY */
      .tabs {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        padding: 7px 10px 6px;
        border-bottom: 1px solid var(--card-border, rgba(255,255,255,0.08));
        flex-shrink: 0;
      }
      .tab-btn {
        border: 1px solid transparent;
        background: transparent;
        padding: 5px 6px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--muted-foreground, #a1a1aa);
        cursor: pointer;
      }
      .tab-btn:hover { color: var(--foreground, #fff); background: color-mix(in srgb, var(--secondary, #27272a) 60%, transparent); }
      .tab-btn.active { color: var(--foreground, #fff); background: var(--secondary, #27272a); border-color: var(--card-border, rgba(255,255,255,0.12)); }

      .body {
        flex: 1;
        overflow-y: auto;
        padding: 11px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .body::-webkit-scrollbar { width: 5px; }
      .body::-webkit-scrollbar-thumb { background: var(--card-border, rgba(255,255,255,0.15)); border-radius: 999px; }
      .pane { display: none; flex-direction: column; gap: 10px; }
      .pane.active { display: flex; }

      .card {
        background: var(--card, #18181b);
        border: 1px solid var(--card-border, rgba(255,255,255,0.09));
        border-radius: 10px;
        padding: 9px 10px;
      }
      .status-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .status-left { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 11.5px; }
      .model-pill { font-size: 10.5px; color: var(--muted-foreground, #a1a1aa); max-width: 155px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
      .metric {
        background: var(--card, #18181b);
        border: 1px solid var(--card-border, rgba(255,255,255,0.09));
        border-radius: 10px;
        padding: 8px 9px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .metric-lbl { font-size: 10px; color: var(--muted-foreground, #8a8a93); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .metric-val { font-size: 14.5px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--foreground, #fff); white-space: nowrap; }
      .metric-sub { font-size: 10px; color: var(--muted-foreground, #8a8a93); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      .spark-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
      .sec-title { font-size: 11.5px; font-weight: 600; color: var(--secondary-foreground, #d4d4d8); }
      .link-btn { border: none; background: transparent; padding: 2px 5px; font-size: 11px; color: var(--muted-foreground, #a1a1aa); cursor: pointer; border-radius: 5px; }
      .link-btn:hover { color: var(--foreground, #fff); background: var(--secondary, #27272a); }

      .hist-list { display: flex; flex-direction: column; gap: 5px; margin-top: 6px; }
      .hist-row {
        display: grid;
        grid-template-columns: 28px 1fr auto auto;
        gap: 8px;
        align-items: center;
        padding: 5px 7px;
        border-radius: 7px;
        background: color-mix(in srgb, var(--secondary, #27272a) 55%, transparent);
        font-size: 11px;
        font-variant-numeric: tabular-nums;
      }
      .hist-empty { font-size: 11.5px; color: var(--muted-foreground, #8a8a93); margin-top: 4px; }
      .footnote { font-size: 10.5px; color: var(--muted-foreground, #8a8a93); line-height: 1.35; }

      .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .switch-btn {
        position: relative;
        width: 34px;
        height: 19px;
        border-radius: 999px;
        border: none;
        background: var(--secondary, #3f3f46);
        cursor: pointer;
        padding: 0;
        flex-shrink: 0;
        transition: background 0.18s ease;
      }
      .switch-btn[aria-checked="true"] { background: var(--primary, #007acc); }
      .switch-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.18s ease;
      }
      .switch-btn[aria-checked="true"] .switch-knob { transform: translateX(15px); }
      .pill-tag { font-size: 10.5px; font-weight: 600; padding: 2px 7px; border-radius: 999px; background: var(--secondary, #27272a); color: var(--muted-foreground, #a1a1aa); }
      .pill-tag.on { background: color-mix(in srgb, var(--success, #34d399) 18%, transparent); color: var(--success, #34d399); }

      .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 8px;
        border-radius: 7px;
        border: 1px solid var(--card-border, rgba(255,255,255,0.1));
        background: var(--secondary, #27272a);
        color: var(--foreground, #e4e4e7);
        font-size: 11px;
        cursor: pointer;
      }
      .chip:hover { border-color: var(--primary, #007acc); }
      .chip.active { border-color: var(--primary, #007acc); background: color-mix(in srgb, var(--primary, #007acc) 22%, var(--secondary, #27272a)); }
      .chip-del { font-size: 12px; line-height: 1; opacity: 0.65; padding-left: 2px; }
      .chip-del:hover { opacity: 1; color: var(--error, #de5555); }

      textarea.persona-ta {
        width: 100%;
        min-height: 124px;
        resize: vertical;
        padding: 9px 10px;
        border-radius: 9px;
        border: 1px solid var(--card-border, rgba(255,255,255,0.14));
        background: var(--muted, #141417);
        color: var(--foreground, #f4f4f5);
        font-size: 12px;
        line-height: 1.45;
        outline: none;
      }
      textarea.persona-ta:focus { border-color: var(--primary, #007acc); }
      .meter-row { display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: var(--muted-foreground, #8a8a93); font-variant-numeric: tabular-nums; }
      .meter-row.warn { color: var(--warning, #e8975f); }
      .meter-row.over { color: var(--error, #de5555); font-weight: 600; }

      .btn-row { display: flex; flex-wrap: wrap; gap: 6px; }
      .btn {
        border: 1px solid var(--card-border, rgba(255,255,255,0.12));
        background: var(--secondary, #27272a);
        color: var(--foreground, #f4f4f5);
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn:hover { opacity: 0.9; }
      .btn:disabled { opacity: 0.45; cursor: not-allowed; }
      .btn-primary { background: var(--primary, #007acc); border-color: var(--primary, #007acc); color: var(--primary-foreground, #fff); flex: 1; }

      .preset-bar { display: flex; gap: 6px; align-items: center; }
      .preset-bar input {
        flex: 1; min-width: 0; padding: 5px 8px; border-radius: 7px;
        border: 1px solid var(--card-border, rgba(255,255,255,0.14));
        background: var(--muted, #141417); font-size: 11.5px; outline: none;
      }
      .preset-bar input:focus { border-color: var(--primary, #007acc); }
      .toast { font-size: 11px; padding: 7px 9px; border-radius: 8px; border: 1px solid var(--card-border, rgba(255,255,255,0.1)); }
      .toast.ok { background: color-mix(in srgb, var(--success, #34d399) 14%, transparent); border-color: color-mix(in srgb, var(--success, #34d399) 35%, transparent); color: var(--success, #34d399); }
      .toast.err { background: color-mix(in srgb, var(--error, #de5555) 14%, transparent); border-color: color-mix(in srgb, var(--error, #de5555) 35%, transparent); color: var(--error, #de5555); }

      .info-grid { display: grid; grid-template-columns: 1fr auto; gap: 5px 10px; font-size: 11.5px; margin-top: 6px; }
      .info-k { color: var(--muted-foreground, #8a8a93); }
      .info-v { font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
      .soon-card {
        border-style: dashed;
        border-color: color-mix(in srgb, var(--primary, #007acc) 45%, transparent);
        background: color-mix(in srgb, var(--primary, #007acc) 6%, var(--card, #18181b));
      }
      .gh-link { color: var(--link, #6a9fcb); text-decoration: none; font-size: 11.5px; font-weight: 600; }
      .gh-link:hover { text-decoration: underline; }
    `;
  }

  function buildDom() {
    if (!doc || !doc.createElement) return;
    if (hostEl && hostEl.parentNode) return;

    const mountTarget = doc.body || doc.documentElement;
    if (!mountTarget || typeof mountTarget.appendChild !== "function") return;

    hostEl = doc.createElement("div");
    hostEl.id = "agy-ru-studio-host";
    if (typeof hostEl.setAttribute === "function") {
      hostEl.setAttribute("data-agy-ru-ignore", "1");
    }

    shadow = typeof hostEl.attachShadow === "function" ? hostEl.attachShadow({ mode: "open" }) : hostEl;

    const styleEl = doc.createElement("style");
    styleEl.textContent = getStylesheet();
    shadow.appendChild(styleEl);

    const wrap = doc.createElement("div");
    wrap.innerHTML = `
      <div class="widget mode-mini dock-bottom" data-id="widget">
        <!-- MINI MODE -->
        <div class="mini-bar" data-id="miniBar">
          <span class="grip" data-id="miniGrip">⋮⋮</span>
          <span class="dot" data-id="miniDot"></span>
          <button type="button" class="mini-lang" data-id="miniLang">RU</button>
          <span class="mini-stat tps" data-id="miniTps"></span>
          <span class="mini-stat" data-id="miniRespTok"></span>
          <span class="mini-stat" data-id="miniChatTok"></span>
          <span class="mini-model" data-id="miniModel"></span>
          <span class="mini-actions">
            <button type="button" class="sz-btn" data-id="miniToMed">M</button>
            <button type="button" class="sz-btn" data-id="miniToLarge">L</button>
          </span>
        </div>

        <!-- MEDIUM MODE -->
        <div class="med-wrap">
          <div class="hdr" data-id="medHdr">
            <div class="hdr-left">
              <span class="grip">⋮⋮</span>
              <span class="logo-pill">RU</span>
              <span class="hdr-title" data-id="medTitle"></span>
            </div>
            <div class="hdr-actions">
              <div class="seg">
                <button type="button" class="sz-btn" data-mode="mini">S</button>
                <button type="button" class="sz-btn active" data-mode="medium">M</button>
                <button type="button" class="sz-btn" data-mode="large">L</button>
              </div>
              <button type="button" class="mini-lang" data-id="medLang">RU</button>
              <button type="button" class="icon-btn" data-id="medPin">📌</button>
            </div>
          </div>
          <div class="med-body">
            <div class="status-row">
              <div class="status-left">
                <span class="dot" data-id="medDot"></span>
                <span data-id="medPhase"></span>
              </div>
              <span class="model-pill" data-id="medModel"></span>
            </div>
            <div class="med-metrics">
              <div class="med-metric">
                <div class="metric-lbl" data-id="medLblTps"></div>
                <div class="metric-val" data-id="medValTps">0</div>
                <div class="metric-sub" data-id="medSubTps"></div>
              </div>
              <div class="med-metric">
                <div class="metric-lbl" data-id="medLblResp"></div>
                <div class="metric-val" data-id="medValResp">~0</div>
                <div class="metric-sub" data-id="medSubResp"></div>
              </div>
              <div class="med-metric">
                <div class="metric-lbl" data-id="medLblChat"></div>
                <div class="metric-val" data-id="medValChat">~0</div>
                <div class="metric-sub" data-id="medSubChat"></div>
              </div>
            </div>
            <svg class="med-spark-svg" viewBox="0 0 240 44" preserveAspectRatio="none">
              <defs>
                <linearGradient id="agySparkGradMed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.38"/>
                  <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02"/>
                </linearGradient>
              </defs>
              <polygon points="" fill="url(#agySparkGradMed)" data-id="medSparkArea"></polygon>
              <polyline points="" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-id="medSparkLine"></polyline>
            </svg>
          </div>
        </div>

        <!-- LARGE MODE -->
        <div class="large-wrap">
          <div class="hdr" data-id="largeHdr">
            <div class="hdr-left">
              <span class="grip">⋮⋮</span>
              <span class="logo-pill">RU</span>
              <div style="min-width:0">
                <div class="hdr-title" data-id="hdrTitle"></div>
                <div class="hdr-ver" data-id="hdrVer"></div>
              </div>
            </div>
            <div class="hdr-actions">
              <div class="seg">
                <button type="button" class="sz-btn" data-mode="mini">S</button>
                <button type="button" class="sz-btn" data-mode="medium">M</button>
                <button type="button" class="sz-btn active" data-mode="large">L</button>
              </div>
              <button type="button" class="mini-lang" data-id="hdrLang">RU</button>
              <button type="button" class="icon-btn" data-id="largePin">📌</button>
              <button type="button" class="icon-btn" data-id="closeBtn">&times;</button>
            </div>
          </div>

          <div class="tabs">
            <button type="button" class="tab-btn active" data-tab="monitor" data-id="tabMonitor"></button>
            <button type="button" class="tab-btn" data-tab="persona" data-id="tabPersona"></button>
            <button type="button" class="tab-btn" data-tab="settings" data-id="tabSettings"></button>
          </div>

          <div class="body">
            <div class="pane active" data-pane="monitor">
              <div class="card">
                <div class="status-row">
                  <div class="status-left">
                    <span class="dot" data-id="monDot"></span>
                    <span data-id="monPhase"></span>
                  </div>
                  <span class="model-pill" data-id="monModel"></span>
                </div>
              </div>
              <div class="metrics">
                <div class="metric">
                  <span class="metric-lbl" data-id="lblTps"></span>
                  <span class="metric-val" data-id="valTps">0</span>
                  <span class="metric-sub" data-id="subTps"></span>
                </div>
                <div class="metric">
                  <span class="metric-lbl" data-id="lblResp"></span>
                  <span class="metric-val" data-id="valResp">~0</span>
                  <span class="metric-sub" data-id="subResp"></span>
                </div>
                <div class="metric">
                  <span class="metric-lbl" data-id="lblChat"></span>
                  <span class="metric-val" data-id="valChat">~0</span>
                  <span class="metric-sub" data-id="subChat"></span>
                </div>
              </div>
              <div class="card">
                <div class="spark-hdr">
                  <span class="sec-title" data-id="sparkTitle"></span>
                  <button type="button" class="link-btn" data-id="resetStatsBtn"></button>
                </div>
                <svg class="spark-svg" viewBox="0 0 300 58" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="agySparkGradLarge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.38"/>
                      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02"/>
                    </linearGradient>
                  </defs>
                  <polygon points="" fill="url(#agySparkGradLarge)" data-id="sparkArea"></polygon>
                  <polyline points="" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-id="sparkLine"></polyline>
                </svg>
              </div>
              <div class="card" data-id="histCard">
                <div class="sec-title" data-id="histTitle"></div>
                <div class="hist-list" data-id="histList"></div>
              </div>
              <div class="footnote" data-id="estNote"></div>
            </div>

            <div class="pane" data-pane="persona">
              <div class="card">
                <div class="switch-row">
                  <div style="min-width:0">
                    <div class="sec-title" data-id="personaToggleLbl"></div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="pill-tag" data-id="personaStatusPill"></span>
                    <button type="button" class="switch-btn" role="switch" aria-checked="false" data-id="personaSwitch">
                      <span class="switch-knob"></span>
                    </button>
                  </div>
                </div>
                <div class="footnote" style="margin-top:6px" data-id="personaHint"></div>
              </div>

              <div class="card">
                <div class="sec-title" data-id="presetsLbl"></div>
                <div class="chips" data-id="presetChips"></div>
              </div>

              <div class="card" style="display:flex;flex-direction:column;gap:8px">
                <textarea class="persona-ta" rows="6" data-id="personaTextarea"></textarea>
                <div class="meter-row" data-id="meterRow">
                  <span data-id="meterBytes"></span>
                  <span data-id="meterTokens"></span>
                </div>
                <div class="preset-bar" data-id="presetSaveBar" style="display:none">
                  <input type="text" maxlength="60" data-id="presetNameInput" />
                  <button type="button" class="btn btn-primary" style="flex:0" data-id="presetConfirmBtn"></button>
                  <button type="button" class="btn" data-id="presetCancelBtn"></button>
                </div>
                <div class="btn-row">
                  <button type="button" class="btn btn-primary" data-id="savePersonaBtn"></button>
                  <button type="button" class="btn" data-id="addPresetBtn"></button>
                  <button type="button" class="btn" data-id="clearPersonaBtn"></button>
                </div>
                <div class="toast" data-id="personaToast" style="display:none"></div>
              </div>
            </div>

            <div class="pane" data-pane="settings">
              <div class="card" style="display:flex;flex-direction:column;gap:8px">
                <div class="sec-title" data-id="sizeTitle"></div>
                <div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr)">
                  <button type="button" data-set-mode="mini" data-id="setModeMini"></button>
                  <button type="button" data-set-mode="medium" data-id="setModeMed"></button>
                  <button type="button" data-set-mode="large" data-id="setModeLarge"></button>
                </div>
              </div>

              <div class="card" style="display:flex;flex-direction:column;gap:8px">
                <div class="sec-title" data-id="miniFieldsTitle"></div>
                <div class="switch-row"><span data-id="mfStatusLbl"></span><button type="button" class="switch-btn" role="switch" data-mf="status"><span class="switch-knob"></span></button></div>
                <div class="switch-row"><span data-id="mfLangLbl"></span><button type="button" class="switch-btn" role="switch" data-mf="lang"><span class="switch-knob"></span></button></div>
                <div class="switch-row"><span data-id="mfTpsLbl"></span><button type="button" class="switch-btn" role="switch" data-mf="tps"><span class="switch-knob"></span></button></div>
                <div class="switch-row"><span data-id="mfRespLbl"></span><button type="button" class="switch-btn" role="switch" data-mf="respTokens"><span class="switch-knob"></span></button></div>
                <div class="switch-row"><span data-id="mfChatLbl"></span><button type="button" class="switch-btn" role="switch" data-mf="chatTokens"><span class="switch-knob"></span></button></div>
                <div class="switch-row"><span data-id="mfModelLbl"></span><button type="button" class="switch-btn" role="switch" data-mf="model"><span class="switch-knob"></span></button></div>
              </div>

              <div class="card" style="display:flex;flex-direction:column;gap:8px">
                <div class="spark-hdr" style="margin-bottom:0">
                  <span class="sec-title" data-id="dockTitle"></span>
                  <button type="button" class="link-btn" data-id="resetPosBtn"></button>
                </div>
                <div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(4,1fr)">
                  <button type="button" data-dock="top" data-id="dockTop"></button>
                  <button type="button" data-dock="middle" data-id="dockMiddle"></button>
                  <button type="button" data-dock="bottom" data-id="dockBottom"></button>
                  <button type="button" data-dock="hidden" data-id="dockHidden"></button>
                </div>
                <div class="footnote" data-id="hotkeyHintDock"></div>
              </div>

              <div class="card" style="display:flex;flex-direction:column;gap:8px">
                <div class="switch-row">
                  <span class="sec-title" data-id="langTitle"></span>
                  <div class="seg">
                    <button type="button" data-id="setRuBtn">Русский</button>
                    <button type="button" data-id="setEnBtn">English</button>
                  </div>
                </div>
                <div class="footnote" data-id="hotkeyHintLang"></div>
              </div>

              <div class="card">
                <div class="switch-row">
                  <span class="sec-title" data-id="trackHistLbl"></span>
                  <button type="button" class="switch-btn" role="switch" aria-checked="true" data-id="trackHistSwitch">
                    <span class="switch-knob"></span>
                  </button>
                </div>
              </div>

              <div class="card">
                <div class="sec-title" data-id="pluginInfoTitle"></div>
                <div class="info-grid">
                  <span class="info-k" data-id="infoVerK"></span><span class="info-v" data-id="infoVerV"></span>
                  <span class="info-k" data-id="infoDictK"></span><span class="info-v" data-id="infoDictV"></span>
                  <span class="info-k" data-id="infoRulesK"></span><span class="info-v" data-id="infoRulesV"></span>
                </div>
                <div style="margin-top:8px">
                  <a class="gh-link" href="https://github.com/Ivan0967pro/antigravity-ru" target="_blank" rel="noopener noreferrer" data-id="repoLink"></a>
                </div>
              </div>

              <div class="card soon-card">
                <div class="sec-title" data-id="stage2Title"></div>
                <div class="footnote" style="margin-top:4px" data-id="stage2Desc"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    shadow.appendChild(wrap);

    ui = {};
    if (typeof wrap.querySelectorAll === "function") {
      const nodes = wrap.querySelectorAll("[data-id]");
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        ui[el.getAttribute("data-id")] = el;
      }
      ui.tabBtns = Array.from(wrap.querySelectorAll("[data-tab]"));
      ui.panes = Array.from(wrap.querySelectorAll("[data-pane]"));
      ui.dockPosBtns = Array.from(wrap.querySelectorAll("[data-dock]"));
      ui.modeBtns = Array.from(wrap.querySelectorAll("[data-mode]"));
      ui.setModeBtns = Array.from(wrap.querySelectorAll("[data-set-mode]"));
      ui.mfSwitches = Array.from(wrap.querySelectorAll("[data-mf]"));
    }

    bindEvents();
    mountTarget.appendChild(hostEl);
  }

  function stopTypingLeak(el) {
    if (!el || typeof el.addEventListener !== "function") return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") return;
      if ((e.ctrlKey || e.metaKey) && e.altKey) return;
      e.stopPropagation();
    });
  }

  function getEstimatedSize() {
    if (ui.widget && typeof ui.widget.getBoundingClientRect === "function") {
      const r = ui.widget.getBoundingClientRect();
      if (r && r.width > 10 && r.height > 10) {
        return { w: r.width, h: r.height };
      }
    }
    if (settings.viewMode === "large") return { w: 356, h: 520 };
    if (settings.viewMode === "medium") return { w: 264, h: 220 };
    return { w: 210, h: 34 };
  }

  function clampPosition(x, y) {
    const vw = typeof win.innerWidth === "number" && win.innerWidth > 0 ? win.innerWidth : 1280;
    const vh = typeof win.innerHeight === "number" && win.innerHeight > 0 ? win.innerHeight : 800;
    const sz = getEstimatedSize();
    const maxX = Math.max(8, vw - sz.w - 8);
    const maxY = Math.max(44, vh - sz.h - 8);
    return {
      x: Math.round(Math.max(8, Math.min(maxX, x))),
      y: Math.round(Math.max(44, Math.min(maxY, y))),
    };
  }

  function applyPosition() {
    if (!ui.widget) return;
    const mode = settings.viewMode || "mini";
    const layout = settings.layoutMode === "floating" ? "floating" : "docked";
    const dockPos = settings.dockPosition || "bottom";

    const cls = ["widget", "mode-" + mode];
    if (isDragging) cls.push("dragging");
    if (layout === "docked") {
      cls.push("dock-" + dockPos);
      ui.widget.style.left = "";
      ui.widget.style.top = "";
      ui.widget.style.right = "";
      ui.widget.style.bottom = "";
      ui.widget.style.transform = "";
    } else {
      const vw = typeof win.innerWidth === "number" && win.innerWidth > 0 ? win.innerWidth : 1280;
      const vh = typeof win.innerHeight === "number" && win.innerHeight > 0 ? win.innerHeight : 800;
      const sz = getEstimatedSize();
      const rawX = typeof settings.floatX === "number" ? settings.floatX : vw - sz.w - 16;
      const rawY = typeof settings.floatY === "number" ? settings.floatY : vh - sz.h - 84;
      const clamped = clampPosition(rawX, rawY);
      settings.floatX = clamped.x;
      settings.floatY = clamped.y;
      ui.widget.style.left = clamped.x + "px";
      ui.widget.style.top = clamped.y + "px";
      ui.widget.style.right = "auto";
      ui.widget.style.bottom = "auto";
      ui.widget.style.transform = "none";
    }
    ui.widget.className = cls.join(" ");
  }

  function attachDrag(handleEl) {
    if (!handleEl || typeof handleEl.addEventListener !== "function") return;
    handleEl.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      const target = e.target;
      if (target && typeof target.closest === "function" && target.closest("button, a, input, textarea")) {
        return;
      }
      if (!ui.widget || typeof win.addEventListener !== "function") return;

      const rect = typeof ui.widget.getBoundingClientRect === "function"
        ? ui.widget.getBoundingClientRect()
        : { left: settings.floatX || 900, top: settings.floatY || 500 };

      const startClientX = e.clientX || 0;
      const startClientY = e.clientY || 0;
      const startLeft = rect.left;
      const startTop = rect.top;
      let moved = false;

      const onMove = (ev) => {
        const dx = (ev.clientX || 0) - startClientX;
        const dy = (ev.clientY || 0) - startClientY;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = true;
        isDragging = true;
        settings.layoutMode = "floating";
        const clamped = clampPosition(startLeft + dx, startTop + dy);
        settings.floatX = clamped.x;
        settings.floatY = clamped.y;
        applyPosition();
      };

      const onUp = () => {
        if (typeof win.removeEventListener === "function") {
          win.removeEventListener("pointermove", onMove);
          win.removeEventListener("pointerup", onUp);
          win.removeEventListener("pointercancel", onUp);
        }
        if (moved) {
          isDragging = false;
          applyPosition();
          saveSettings({
            layoutMode: "floating",
            floatX: settings.floatX,
            floatY: settings.floatY,
          });
        }
      };

      win.addEventListener("pointermove", onMove);
      win.addEventListener("pointerup", onUp);
      win.addEventListener("pointercancel", onUp);
    });
  }

  function bindEvents() {
    if (!ui.widget) return;

    attachDrag(ui.miniBar);
    attachDrag(ui.medHdr);
    attachDrag(ui.largeHdr);

    ui.miniToMed.addEventListener("click", () => setViewMode("medium"));
    ui.miniToLarge.addEventListener("click", () => setViewMode("large"));
    ui.closeBtn.addEventListener("click", () => setViewMode(lastCompactMode));

    for (const btn of ui.modeBtns || []) {
      btn.addEventListener("click", () => setViewMode(btn.getAttribute("data-mode") || "mini"));
    }
    for (const btn of ui.setModeBtns || []) {
      btn.addEventListener("click", () => setViewMode(btn.getAttribute("data-set-mode") || "mini"));
    }

    const togglePin = () => {
      if (settings.layoutMode === "floating") {
        saveSettings({ layoutMode: "docked" });
      } else {
        const rect = typeof ui.widget.getBoundingClientRect === "function" ? ui.widget.getBoundingClientRect() : { left: 900, top: 400 };
        saveSettings({ layoutMode: "floating", floatX: Math.round(rect.left), floatY: Math.round(rect.top) });
      }
    };
    ui.medPin.addEventListener("click", togglePin);
    ui.largePin.addEventListener("click", togglePin);

    ui.miniLang.addEventListener("click", () => switchLocale(locale === "ru" ? "en" : "ru"));
    ui.medLang.addEventListener("click", () => switchLocale(locale === "ru" ? "en" : "ru"));
    ui.hdrLang.addEventListener("click", () => switchLocale(locale === "ru" ? "en" : "ru"));
    ui.setRuBtn.addEventListener("click", () => switchLocale("ru"));
    ui.setEnBtn.addEventListener("click", () => switchLocale("en"));

    for (const btn of ui.tabBtns || []) {
      btn.addEventListener("click", () => {
        activeTab = btn.getAttribute("data-tab") || "monitor";
        renderTabs();
      });
    }

    for (const btn of ui.dockPosBtns || []) {
      btn.addEventListener("click", () => {
        const pos = btn.getAttribute("data-dock") || "bottom";
        saveSettings({ layoutMode: "docked", dockPosition: pos });
      });
    }

    ui.resetPosBtn.addEventListener("click", () => {
      saveSettings({ layoutMode: "docked", dockPosition: "bottom", floatX: null, floatY: null });
    });

    for (const sw of ui.mfSwitches || []) {
      sw.addEventListener("click", () => {
        const key = sw.getAttribute("data-mf");
        if (!key) return;
        const nextMini = Object.assign({}, settings.miniFields, { [key]: !settings.miniFields[key] });
        saveSettings({ miniFields: nextMini });
      });
    }

    ui.trackHistSwitch.addEventListener("click", () => {
      saveSettings({ trackHistory: !settings.trackHistory });
    });

    ui.resetStatsBtn.addEventListener("click", () => {
      monitor.liveTps = 0;
      monitor.lastAvgTps = 0;
      monitor.peakTps = 0;
      monitor.sparkline = [];
      monitor.history = [];
      turnCounter = 0;
      renderMonitor();
    });

    ui.personaSwitch.addEventListener("click", () => {
      settings.personaEnabled = !settings.personaEnabled;
      savePersonaNow();
    });

    stopTypingLeak(ui.personaTextarea);
    stopTypingLeak(ui.presetNameInput);

    ui.personaTextarea.addEventListener("input", () => {
      settings.personaText = ui.personaTextarea.value;
      settings.personaActivePreset = "custom";
      personaDirty = true;
      renderPersona();
    });

    ui.savePersonaBtn.addEventListener("click", () => {
      if (String(settings.personaText || "").trim().length > 0) {
        settings.personaEnabled = true;
      }
      savePersonaNow();
    });

    ui.clearPersonaBtn.addEventListener("click", () => {
      settings.personaText = "";
      settings.personaActivePreset = "custom";
      settings.personaEnabled = false;
      personaDirty = false;
      savePersonaNow();
    });

    ui.addPresetBtn.addEventListener("click", () => {
      showSavePresetBar = !showSavePresetBar;
      renderPersona();
      if (showSavePresetBar && ui.presetNameInput && typeof ui.presetNameInput.focus === "function") {
        ui.presetNameInput.value = "";
        ui.presetNameInput.focus();
      }
    });

    ui.presetCancelBtn.addEventListener("click", () => {
      showSavePresetBar = false;
      renderPersona();
    });

    ui.presetConfirmBtn.addEventListener("click", () => {
      const name = String((ui.presetNameInput && ui.presetNameInput.value) || "").trim();
      const text = String(settings.personaText || "").trim();
      if (!name || !text) return;
      const id = "custom-" + Date.now();
      const nextPresets = (settings.customPresets || []).concat([{ id, name, text }]).slice(-20);
      settings.customPresets = nextPresets;
      settings.personaActivePreset = id;
      showSavePresetBar = false;
      saveSettings({ customPresets: nextPresets, personaActivePreset: id });
      renderPersona();
    });

    if (typeof win.addEventListener === "function") {
      win.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && settings.viewMode === "large") {
          setViewMode(lastCompactMode);
        }
      });
      win.addEventListener("resize", () => {
        if (settings.layoutMode === "floating") {
          applyPosition();
        }
      });
    }
  }

  function setViewMode(nextMode) {
    const mode = nextMode === "large" || nextMode === "medium" || nextMode === "mini" ? nextMode : "mini";
    if (mode === "mini" || mode === "medium") {
      lastCompactMode = mode;
    }
    settings.viewMode = mode;
    renderAll();
    if (typeof win.requestAnimationFrame === "function") {
      win.requestAnimationFrame(() => applyPosition());
    }
    if (ipc && typeof ipc.invoke === "function") {
      try {
        ipc.invoke("agy-studio:save-settings", { viewMode: mode }).catch(() => {});
      } catch {}
    }
  }

  function switchLocale(next) {
    const normalized = next === "en" ? "en" : "ru";
    if (normalized === locale) return;
    locale = normalized;
    renderAll();
    if (ipc && typeof ipc.invoke === "function") {
      try {
        ipc.invoke("agy-i18n:set-locale", normalized).catch(() => {});
      } catch {}
    }
  }

  function saveSettings(patch) {
    const pObj = patch && typeof patch === "object" ? Object.assign({}, patch) : {};
    if (pObj.miniFields && typeof pObj.miniFields === "object") {
      pObj.miniFields = Object.assign({}, settings.miniFields, pObj.miniFields);
    }
    settings = Object.assign({}, settings, pObj);
    if (settings.viewMode === "mini" || settings.viewMode === "medium") {
      lastCompactMode = settings.viewMode;
    }
    renderAll();
    if (ipc && typeof ipc.invoke === "function") {
      try {
        ipc
          .invoke("agy-studio:save-settings", pObj)
          .then((st) => {
            if (st) applyRemoteState(st);
          })
          .catch(() => {});
      } catch {}
    }
  }

  function savePersonaNow() {
    const bytes = measureUtf8Bytes(String(settings.personaText || "").trim());
    if (settings.personaEnabled && bytes > MAX_PERSONA_BYTES) {
      personaSaveFeedback = { ok: false, msg: t("limitErr") };
      renderPersona();
      return;
    }
    personaDirty = false;
    renderPersona();
    if (ipc && typeof ipc.invoke === "function") {
      try {
        ipc
          .invoke("agy-studio:save-persona", {
            personaEnabled: settings.personaEnabled,
            personaText: settings.personaText,
            personaActivePreset: settings.personaActivePreset,
            customPresets: settings.customPresets,
          })
          .then((res) => {
            if (res && res.state) applyRemoteState(res.state);
            if (res && res.ok) {
              personaSaveFeedback = { ok: true, msg: res.exists ? t("savedOk") : t("disabledOk") };
            } else {
              personaSaveFeedback = {
                ok: false,
                msg: (res && res.error === "EXCEEDS_BYTE_LIMIT" ? t("limitErr") : res && res.error) || "Error",
              };
            }
            renderPersona();
          })
          .catch((err) => {
            personaSaveFeedback = { ok: false, msg: err && err.message ? err.message : "Error" };
            renderPersona();
          });
      } catch {}
    }
  }

  function renderTabs() {
    if (!ui.tabBtns || !ui.panes) return;
    for (const btn of ui.tabBtns) {
      btn.className = btn.getAttribute("data-tab") === activeTab ? "tab-btn active" : "tab-btn";
    }
    for (const pane of ui.panes) {
      pane.className = pane.getAttribute("data-pane") === activeTab ? "pane active" : "pane";
    }
  }

  function renderChrome() {
    if (!ui.widget) return;
    applyPosition();

    const mf = settings.miniFields || {};
    const dotClass =
      monitor.phase === "streaming" ? "dot streaming" : monitor.phase === "thinking" ? "dot thinking" : "dot";
    const shownTps = monitor.phase === "streaming" ? monitor.liveTps : monitor.lastAvgTps;

    // Mini view
    ui.miniGrip.title = t("dragTip");
    ui.miniDot.className = dotClass;
    ui.miniDot.style.display = mf.status !== false ? "inline-block" : "none";
    ui.miniLang.style.display = mf.lang !== false ? "inline-block" : "none";
    ui.miniLang.textContent = locale.toUpperCase();

    ui.miniTps.style.display = mf.tps !== false ? "inline" : "none";
    ui.miniTps.textContent = `${shownTps} ${t("tpsUnit")}`;

    ui.miniRespTok.style.display = mf.respTokens ? "inline" : "none";
    ui.miniRespTok.textContent = `R:~${formatInt(monitor.responseTokens)}`;

    ui.miniChatTok.style.display = mf.chatTokens ? "inline" : "none";
    ui.miniChatTok.textContent = `C:~${formatInt(monitor.chatTokens)}`;

    ui.miniModel.style.display = mf.model ? "inline" : "none";
    ui.miniModel.textContent = monitor.modelName || t("modelUnknown");

    ui.miniToMed.title = t("expandMedTip");
    ui.miniToLarge.title = t("expandLargeTip");

    // Medium & Large headers
    ui.medTitle.textContent = t("brandShort");
    ui.medLang.textContent = locale.toUpperCase();
    ui.hdrTitle.textContent = t("brand");
    ui.hdrVer.textContent = "v" + (pluginMeta.version || "2.2.1");
    ui.hdrLang.textContent = locale.toUpperCase();
    ui.closeBtn.title = t("collapseTip");

    const isFloat = settings.layoutMode === "floating";
    ui.medPin.className = isFloat ? "icon-btn" : "icon-btn pinned";
    ui.largePin.className = isFloat ? "icon-btn" : "icon-btn pinned";
    ui.medPin.title = isFloat ? t("pinTipFloating") : t("pinTipDocked");
    ui.largePin.title = isFloat ? t("pinTipFloating") : t("pinTipDocked");

    for (const btn of ui.modeBtns || []) {
      btn.className = btn.getAttribute("data-mode") === settings.viewMode ? "sz-btn active" : "sz-btn";
    }

    ui.tabMonitor.textContent = t("tabMonitor");
    ui.tabPersona.textContent = t("tabPersona");
    ui.tabSettings.textContent = t("tabSettings");
  }

  function buildSparkPoints(pts, w, h, padY) {
    if (!pts || pts.length === 0) return { line: "", area: "" };
    const maxVal = Math.max(20, ...pts);
    const coords = pts.map((v, idx) => {
      const x = pts.length === 1 ? w : Math.round((idx / (pts.length - 1)) * w * 10) / 10;
      const y = Math.round((h - padY - (v / maxVal) * (h - padY * 2)) * 10) / 10;
      return `${x},${y}`;
    });
    return {
      line: coords.join(" "),
      area: `0,${h} ${coords.join(" ")} ${w},${h}`,
    };
  }

  function renderMonitor() {
    if (!ui.monPhase) return;
    const dotClass =
      monitor.phase === "streaming" ? "dot streaming" : monitor.phase === "thinking" ? "dot thinking" : "dot";
    ui.monDot.className = dotClass;
    ui.medDot.className = dotClass;

    let phaseTxt = t("statusIdle");
    if (monitor.phase === "streaming") phaseTxt = t("statusStreaming");
    else if (monitor.phase === "thinking") {
      phaseTxt = monitor.thinkingSec > 0 ? `${t("statusThinking")} ${monitor.thinkingSec}${locale === "ru" ? " с" : "s"}` : t("statusThinking");
    }
    ui.monPhase.textContent = phaseTxt;
    ui.medPhase.textContent = phaseTxt;

    const modelTxt = monitor.modelName || t("modelUnknown");
    ui.monModel.textContent = modelTxt;
    ui.monModel.title = monitor.modelName || "";
    ui.medModel.textContent = modelTxt;
    ui.medModel.title = monitor.modelName || "";

    const mainTps = monitor.phase === "streaming" ? monitor.liveTps : monitor.lastAvgTps;
    const tpsVal = `${mainTps} ${t("tpsUnit")}`;
    const peakSub = `${t("peakPrefix")} ${monitor.peakTps} ${t("tpsUnit")}`;
    const respVal = `~${formatInt(monitor.responseTokens)} ${t("tokUnit")}`;
    const respSub = `${formatInt(monitor.responseChars)} ${t("charsUnit")}`;
    const chatVal = `~${formatInt(monitor.chatTokens)} ${t("tokUnit")}`;

    ui.lblTps.textContent = t("tpsLabel");
    ui.valTps.textContent = tpsVal;
    ui.subTps.textContent = peakSub;
    ui.lblResp.textContent = t("respLabel");
    ui.valResp.textContent = respVal;
    ui.subResp.textContent = respSub;
    ui.lblChat.textContent = t("chatLabel");
    ui.valChat.textContent = chatVal;
    ui.subChat.textContent = monitor.contextNote || "";

    ui.medLblTps.textContent = "TPS";
    ui.medValTps.textContent = tpsVal;
    ui.medSubTps.textContent = peakSub;
    ui.medLblResp.textContent = t("respLabel");
    ui.medValResp.textContent = respVal;
    ui.medSubResp.textContent = respSub;
    ui.medLblChat.textContent = t("chatLabel");
    ui.medValChat.textContent = chatVal;
    ui.medSubChat.textContent = monitor.contextNote || "";

    ui.sparkTitle.textContent = t("sparkTitle");
    ui.resetStatsBtn.textContent = t("resetStats");

    const largeSpark = buildSparkPoints(monitor.sparkline, 300, 58, 5);
    ui.sparkLine.setAttribute("points", largeSpark.line);
    ui.sparkArea.setAttribute("points", largeSpark.area);

    const medSpark = buildSparkPoints(monitor.sparkline, 240, 44, 4);
    ui.medSparkLine.setAttribute("points", medSpark.line);
    ui.medSparkArea.setAttribute("points", medSpark.area);

    ui.histCard.style.display = settings.trackHistory ? "block" : "none";
    ui.histTitle.textContent = t("historyTitle");
    if (ui.histList) {
      ui.histList.innerHTML = "";
      if (!monitor.history.length) {
        const emp = doc.createElement("div");
        emp.className = "hist-empty";
        emp.textContent = t("historyEmpty");
        ui.histList.appendChild(emp);
      } else {
        for (const item of monitor.history) {
          const row = doc.createElement("div");
          row.className = "hist-row";
          const c1 = doc.createElement("span");
          c1.style.color = "var(--muted-foreground, #8a8a93)";
          c1.textContent = `#${item.idx}`;
          const c2 = doc.createElement("span");
          c2.textContent = `~${formatInt(item.tokens)} ${t("tokUnit")}`;
          const c3 = doc.createElement("span");
          c3.style.color = "var(--muted-foreground, #8a8a93)";
          c3.textContent = `${item.durSec.toFixed(1)}${locale === "ru" ? "с" : "s"}`;
          const c4 = doc.createElement("span");
          c4.style.fontWeight = "600";
          c4.style.color = "var(--primary, #38bdf8)";
          c4.textContent = `${item.avgTps} ${t("tpsUnit")}`;
          row.appendChild(c1);
          row.appendChild(c2);
          row.appendChild(c3);
          row.appendChild(c4);
          ui.histList.appendChild(row);
        }
      }
    }
    ui.estNote.textContent = t("estNote");
  }

  function renderPersona() {
    if (!ui.personaSwitch) return;
    ui.personaToggleLbl.textContent = t("personaToggle");
    ui.personaSwitch.setAttribute("aria-checked", settings.personaEnabled ? "true" : "false");

    const isActiveOnDisk = settings.personaEnabled && personaFileExists;
    ui.personaStatusPill.className = isActiveOnDisk ? "pill-tag on" : "pill-tag";
    ui.personaStatusPill.textContent = isActiveOnDisk ? t("personaActive") : t("personaOff");
    ui.personaHint.textContent = t("personaHint");
    ui.presetsLbl.textContent = t("presetsLabel");

    if (ui.presetChips) {
      ui.presetChips.innerHTML = "";
      for (const p of BUILTIN_PERSONA_PRESETS) {
        const chip = doc.createElement("button");
        chip.type = "button";
        chip.className = settings.personaActivePreset === p.id ? "chip active" : "chip";
        chip.textContent = locale === "ru" ? p.labelRu : p.labelEn;
        chip.addEventListener("click", () => {
          settings.personaText = p.text;
          settings.personaActivePreset = p.id;
          personaDirty = true;
          renderPersona();
        });
        ui.presetChips.appendChild(chip);
      }
      for (const cp of settings.customPresets || []) {
        const chip = doc.createElement("button");
        chip.type = "button";
        chip.className = settings.personaActivePreset === cp.id ? "chip active" : "chip";
        const lbl = doc.createElement("span");
        lbl.textContent = cp.name;
        const del = doc.createElement("span");
        del.className = "chip-del";
        del.textContent = "×";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          const next = (settings.customPresets || []).filter((x) => x.id !== cp.id);
          saveSettings({
            customPresets: next,
            personaActivePreset: settings.personaActivePreset === cp.id ? "custom" : settings.personaActivePreset,
          });
        });
        chip.appendChild(lbl);
        chip.appendChild(del);
        chip.addEventListener("click", () => {
          settings.personaText = cp.text;
          settings.personaActivePreset = cp.id;
          personaDirty = true;
          renderPersona();
        });
        ui.presetChips.appendChild(chip);
      }
    }

    if (ui.personaTextarea.value !== settings.personaText) {
      ui.personaTextarea.value = settings.personaText || "";
    }
    ui.personaTextarea.placeholder = t("personaPlaceholder");

    const trimmed = String(settings.personaText || "").trim();
    const bytes = measureUtf8Bytes(trimmed);
    const estTok = estimateTokens(trimmed);
    ui.meterBytes.textContent = `${formatInt(bytes)} / ${formatInt(MAX_PERSONA_BYTES)} ${t("bytesLabel")}`;
    ui.meterTokens.textContent = `~${formatInt(estTok)} ${t("tokUnit")}`;
    ui.meterRow.className = bytes > MAX_PERSONA_BYTES ? "meter-row over" : bytes > 20000 ? "meter-row warn" : "meter-row";

    ui.savePersonaBtn.textContent = t("saveAndApply");
    ui.savePersonaBtn.disabled = bytes > MAX_PERSONA_BYTES;
    ui.addPresetBtn.textContent = t("addToPresets");
    ui.clearPersonaBtn.textContent = t("clearText");

    ui.presetSaveBar.style.display = showSavePresetBar ? "flex" : "none";
    ui.presetNameInput.placeholder = t("presetNamePlaceholder");
    ui.presetConfirmBtn.textContent = t("savePresetBtn");
    ui.presetCancelBtn.textContent = t("cancelBtn");

    if (personaSaveFeedback) {
      ui.personaToast.style.display = "block";
      ui.personaToast.className = personaSaveFeedback.ok ? "toast ok" : "toast err";
      ui.personaToast.textContent = personaSaveFeedback.msg;
    } else {
      ui.personaToast.style.display = "none";
    }
  }

  function renderSettingsTab() {
    if (!ui.sizeTitle) return;
    ui.sizeTitle.textContent = t("sizeTitle");
    ui.setModeMini.textContent = "S " + t("modeMini");
    ui.setModeMed.textContent = "M " + t("modeMed");
    ui.setModeLarge.textContent = "L " + t("modeLarge");
    for (const btn of ui.setModeBtns || []) {
      btn.className = btn.getAttribute("data-set-mode") === settings.viewMode ? "active" : "";
    }

    ui.miniFieldsTitle.textContent = t("miniFieldsTitle");
    ui.mfStatusLbl.textContent = t("mfStatus");
    ui.mfLangLbl.textContent = t("mfLang");
    ui.mfTpsLbl.textContent = t("mfTps");
    ui.mfRespLbl.textContent = t("mfRespTok");
    ui.mfChatLbl.textContent = t("mfChatTok");
    ui.mfModelLbl.textContent = t("mfModel");
    for (const sw of ui.mfSwitches || []) {
      const k = sw.getAttribute("data-mf");
      sw.setAttribute("aria-checked", settings.miniFields && settings.miniFields[k] ? "true" : "false");
    }

    ui.dockTitle.textContent = t("dockTitle");
    ui.resetPosBtn.textContent = t("resetPos");
    ui.dockTop.textContent = t("dockTop");
    ui.dockMiddle.textContent = t("dockMiddle");
    ui.dockBottom.textContent = t("dockBottom");
    ui.dockHidden.textContent = t("dockHidden");
    for (const btn of ui.dockPosBtns || []) {
      const pos = btn.getAttribute("data-dock");
      btn.className = settings.layoutMode === "docked" && pos === settings.dockPosition ? "active" : "";
    }
    ui.hotkeyHintDock.textContent = t("hotkeyHintDock");

    ui.langTitle.textContent = t("langTitle");
    ui.setRuBtn.className = locale === "ru" ? "active" : "";
    ui.setEnBtn.className = locale === "en" ? "active" : "";
    ui.hotkeyHintLang.textContent = t("hotkeyHintLang");

    ui.trackHistLbl.textContent = t("trackHistoryLabel");
    ui.trackHistSwitch.setAttribute("aria-checked", settings.trackHistory ? "true" : "false");

    ui.pluginInfoTitle.textContent = t("pluginInfoTitle");
    ui.infoVerK.textContent = t("infoVersion");
    ui.infoVerV.textContent = "v" + (pluginMeta.version || "2.2.1");
    ui.infoDictK.textContent = t("infoDict");
    ui.infoDictV.textContent = formatInt(pluginMeta.dictEntries || 0);
    ui.infoRulesK.textContent = t("infoRules");
    ui.infoRulesV.textContent = formatInt(pluginMeta.dynamicRulesCount || 0);
    ui.repoLink.textContent = t("infoRepo") + " ↗";

    ui.stage2Title.textContent = t("stage2Title");
    ui.stage2Desc.textContent = t("stage2Desc");
  }

  function renderAll() {
    renderChrome();
    renderTabs();
    renderMonitor();
    renderPersona();
    renderSettingsTab();
  }

  function readLatestResponseState() {
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return { latestResp: null, text: "", working: false, modelName: "", chatTokens: 0, contextNote: "" };
    }

    let modelName = "";
    const modelBtn = doc.querySelector('[data-testid="model-selector-trigger"]');
    if (modelBtn && modelBtn.textContent) {
      modelName = modelBtn.textContent.replace(/\s+/g, " ").trim();
    }

    let chatTokens = 0;
    const userMsgs = doc.querySelectorAll('[data-testid="user-message-content"]');
    for (let i = 0; i < userMsgs.length; i++) {
      chatTokens += estimateTokens(userMsgs[i].textContent || "");
    }

    const resps = doc.querySelectorAll('[data-testid="agent-response"]');
    let latestResp = null;
    let latestRespText = "";
    for (let i = 0; i < resps.length; i++) {
      const r = resps[i];
      const mds = r.querySelectorAll ? r.querySelectorAll("[data-markdown-root]") : [];
      let respTxt = "";
      if (mds && mds.length > 0) {
        for (let j = 0; j < mds.length; j++) {
          respTxt += (mds[j].textContent || "") + "\n";
        }
      } else {
        respTxt = r.textContent || "";
      }
      chatTokens += estimateTokens(respTxt);
      if (i === resps.length - 1) {
        latestResp = r;
        latestRespText = respTxt;
      }
    }

    let working = false;
    if (latestResp && typeof latestResp.querySelector === "function") {
      const sr = latestResp.querySelector("h6");
      if (sr && sr.textContent && /working|работает/i.test(sr.textContent)) {
        working = true;
      }
    }
    if (!working && doc.querySelector) {
      const cancelBtn = doc.querySelector('[data-testid="cancel-invocation-button"]');
      if (cancelBtn) working = true;
    }

    let thinkingSec = 0;
    if (working && latestResp && latestResp.textContent) {
      const m = /(?:Thinking|Думаю)[^0-9]*(\d+)\s*(?:s|с)/i.exec(latestResp.textContent);
      if (m) thinkingSec = Number(m[1]) || 0;
    }

    let contextNote = "";
    if (doc.querySelector) {
      const ctxEl = doc.querySelector('[data-testid="context-usage-indicator"]');
      if (ctxEl && ctxEl.textContent) {
        contextNote = ctxEl.textContent.replace(/\s+/g, " ").trim();
      }
    }

    return { latestResp, text: latestRespText, working, thinkingSec, modelName, chatTokens, contextNote };
  }

  function pollStream() {
    const now = Date.now();
    const convKey = win && win.location ? `${win.location.pathname || ""}${win.location.search || ""}${win.location.hash || ""}` : "";
    const snap = readLatestResponseState();

    monitor.modelName = snap.modelName;
    monitor.chatTokens = snap.chatTokens;
    monitor.contextNote = snap.contextNote;

    const curChars = snap.text.trim().length;
    const curTokens = estimateTokens(snap.text);

    if (convKey !== lastConvKey) {
      lastConvKey = convKey;
      activeResponseEl = snap.latestResp;
      isWorking = false;
      turnStartMs = 0;
      turnBaselineTokens = curTokens;
      turnPeakTps = 0;
      windowSamples = [];
      monitor.phase = snap.working ? (curTokens > 0 ? "streaming" : "thinking") : "idle";
      monitor.thinkingSec = snap.thinkingSec;
      monitor.liveTps = 0;
      monitor.responseTokens = curTokens;
      monitor.responseChars = curChars;
      if (snap.working) {
        isWorking = true;
        turnStartMs = now;
      }
      renderChrome();
      if (settings.viewMode === "medium" || (settings.viewMode === "large" && activeTab === "monitor")) {
        renderMonitor();
      }
      return;
    }

    if (snap.latestResp !== activeResponseEl) {
      if (isWorking && turnStartMs > 0) {
        const prevGained = Math.max(0, monitor.responseTokens - turnBaselineTokens);
        if (prevGained > 0) {
          const durSec = Math.max(0.25, (now - turnStartMs) / 1000);
          const avgTps = Math.round(prevGained / durSec);
          monitor.lastAvgTps = avgTps;
          if (settings.trackHistory) {
            monitor.history = [{ idx: ++turnCounter, tokens: prevGained, durSec, avgTps, peakTps: turnPeakTps }].concat(monitor.history).slice(0, 5);
          }
        }
      }
      activeResponseEl = snap.latestResp;
      windowSamples = [];
      turnPeakTps = 0;
      if (snap.working) {
        isWorking = true;
        turnStartMs = now;
        turnBaselineTokens = 0;
      } else {
        isWorking = false;
        turnStartMs = 0;
        turnBaselineTokens = curTokens;
      }
    }

    if (snap.working && !isWorking) {
      isWorking = true;
      turnStartMs = now;
      turnBaselineTokens = curTokens;
      turnPeakTps = 0;
      windowSamples = [{ t: now, tokens: curTokens }];
    }

    if (isWorking && snap.working) {
      windowSamples.push({ t: now, tokens: curTokens });
      while (windowSamples.length > 1 && now - windowSamples[0].t > 1500) {
        windowSamples.shift();
      }
      const oldest = windowSamples[0];
      const dtSec = (now - oldest.t) / 1000;
      const gainedInWin = Math.max(0, curTokens - oldest.tokens);
      const gainedTotal = Math.max(0, curTokens - turnBaselineTokens);
      if (dtSec >= 0.35 && gainedInWin > 0) {
        monitor.liveTps = Math.round(gainedInWin / dtSec);
      } else if (gainedTotal === 0) {
        monitor.liveTps = 0;
      }
      if ((now - turnStartMs) >= 400 && gainedTotal >= 3 && monitor.liveTps > turnPeakTps) {
        turnPeakTps = monitor.liveTps;
      }
      if (turnPeakTps > monitor.peakTps) {
        monitor.peakTps = turnPeakTps;
      }
      monitor.phase = gainedTotal > 0 || curTokens > 0 ? "streaming" : "thinking";
      monitor.thinkingSec = snap.thinkingSec;
      if (monitor.phase === "streaming") {
        monitor.sparkline = monitor.sparkline.concat([monitor.liveTps]).slice(-40);
      }
    } else if (isWorking && !snap.working) {
      isWorking = false;
      const gained = Math.max(0, curTokens - turnBaselineTokens);
      if (gained > 0 && turnStartMs > 0) {
        const durSec = Math.max(0.25, (now - turnStartMs) / 1000);
        const avgTps = Math.round(gained / durSec);
        monitor.lastAvgTps = avgTps;
        if (avgTps > monitor.peakTps) monitor.peakTps = avgTps;
        if (settings.trackHistory) {
          monitor.history = [{ idx: ++turnCounter, tokens: gained, durSec, avgTps, peakTps: Math.max(turnPeakTps, avgTps) }].concat(monitor.history).slice(0, 5);
        }
      }
      monitor.phase = "idle";
      monitor.liveTps = 0;
      windowSamples = [];
    } else {
      monitor.phase = "idle";
    }

    monitor.responseTokens = curTokens;
    monitor.responseChars = curChars;
    renderChrome();
    if (settings.viewMode === "medium" || (settings.viewMode === "large" && activeTab === "monitor")) {
      renderMonitor();
    }
  }

  function setOpen(next) {
    setViewMode(next ? "large" : lastCompactMode);
  }

  function toggleOpen() {
    setViewMode(settings.viewMode === "large" ? lastCompactMode : "large");
  }

  function setLocale(next) {
    const normalized = next === "en" ? "en" : "ru";
    if (normalized === locale) return;
    locale = normalized;
    renderAll();
  }

  function applyRemoteState(state) {
    if (!state || typeof state !== "object") return;
    if (state.locale === "ru" || state.locale === "en") {
      locale = state.locale;
    }
    if (state.settings && typeof state.settings === "object") {
      const prevText = settings.personaText;
      const mergedMini = Object.assign({}, settings.miniFields, state.settings.miniFields || {});
      settings = Object.assign({}, settings, state.settings, { miniFields: mergedMini });
      if (settings.viewMode === "mini" || settings.viewMode === "medium") {
        lastCompactMode = settings.viewMode;
      }
      if (personaDirty) {
        settings.personaText = prevText;
      }
    }
    personaFileExists = Boolean(state.personaFileExists);
    renderAll();
  }

  function init() {
    if (initialized) return;
    initialized = true;
    buildDom();

    const snap = readLatestResponseState();
    lastConvKey = win && win.location ? `${win.location.pathname || ""}${win.location.search || ""}${win.location.hash || ""}` : "";
    activeResponseEl = snap.latestResp;
    turnBaselineTokens = estimateTokens(snap.text);
    monitor.responseTokens = turnBaselineTokens;
    monitor.responseChars = snap.text.trim().length;
    monitor.chatTokens = snap.chatTokens;
    monitor.modelName = snap.modelName;
    monitor.contextNote = snap.contextNote;

    renderAll();

    if (ipc && typeof ipc.invoke === "function") {
      try {
        ipc
          .invoke("agy-studio:get-state")
          .then((st) => {
            if (st) applyRemoteState(st);
          })
          .catch(() => {});
      } catch {}
    }

    if (typeof win.setInterval === "function") {
      pollTimer = win.setInterval(pollStream, 250);
    } else if (typeof setInterval === "function") {
      pollTimer = setInterval(pollStream, 250);
    }
  }

  function destroy() {
    if (pollTimer !== null) {
      if (typeof win.clearInterval === "function") win.clearInterval(pollTimer);
      else if (typeof clearInterval === "function") clearInterval(pollTimer);
      pollTimer = null;
    }
    if (hostEl && hostEl.parentNode && typeof hostEl.parentNode.removeChild === "function") {
      hostEl.parentNode.removeChild(hostEl);
    }
    hostEl = null;
    shadow = null;
    initialized = false;
  }

  return {
    init,
    destroy,
    setOpen,
    toggleOpen,
    setViewMode,
    setLocale,
    applyRemoteState,
    estimateTokens,
    pollStream,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { createStudioPanel, estimateTokens, BUILTIN_PERSONA_PRESETS };
}
