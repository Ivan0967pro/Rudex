"use strict";

/**
 * Antigravity RU Studio — right-side floating dock & slide-over panel.
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
  let isOpen = false;
  let activeTab = "monitor"; // "monitor" | "persona" | "settings"
  let showSavePresetBar = false;
  let personaSaveFeedback = null; // { ok: boolean, msg: string }
  let personaDirty = false;
  let initialized = false;
  let pollTimer = null;

  let settings = {
    panelEnabled: true,
    dockPosition: "middle",
    showMiniTps: true,
    trackHistory: true,
    personaEnabled: false,
    personaActivePreset: "custom",
    personaText: "",
    customPresets: [],
  };
  let personaFileExists = false;
  let personaFilePath = "~/.gemini/config/rules/antigravity-ru-persona.md";

  // Live TPS & token state
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
    history: [], // [{ idx, tokens, durSec, avgTps, peakTps }]
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
      tabMonitor: "Монитор",
      tabPersona: "Характер",
      tabSettings: "Настройки",
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
      dockTitle: "Положение ярлычка справа",
      dockTop: "Сверху",
      dockMiddle: "По центру",
      dockBottom: "Снизу",
      dockHidden: "Скрыт",
      hotkeyHintDock: "Открыть/скрыть панель: Ctrl+Alt+P",
      hotkeyHintLang: "Быстрое переключение: Ctrl+Alt+L",
      showMiniTpsLabel: "Показывать мини-TPS на ярлычке",
      trackHistoryLabel: "Сохранять историю скорости ответов",
      pluginInfoTitle: "О плагине",
      infoVersion: "Версия",
      infoDict: "Строк в словаре",
      infoRules: "Динамических правил",
      infoRepo: "Репозиторий на GitHub",
      stage2Title: "Скоро в Этапе 2",
      stage2Desc: "Режимы оформления (Стандартный / Улучшенный / Стекло / Неон / Кастом), студия обоев (фото, градиенты, видео с предпросмотром) и выбор шрифтов.",
      closeTip: "Закрыть (Esc)",
      openTip: "Открыть Antigravity RU Studio (Ctrl+Alt+P)",
    },
    en: {
      brand: "Antigravity RU Studio",
      tabMonitor: "Monitor",
      tabPersona: "Persona",
      tabSettings: "Settings",
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
      dockTitle: "Right-edge dock position",
      dockTop: "Top",
      dockMiddle: "Center",
      dockBottom: "Bottom",
      dockHidden: "Hidden",
      hotkeyHintDock: "Toggle panel: Ctrl+Alt+P",
      hotkeyHintLang: "Quick switch: Ctrl+Alt+L",
      showMiniTpsLabel: "Show mini TPS on edge pill",
      trackHistoryLabel: "Keep response speed history",
      pluginInfoTitle: "Plugin Info",
      infoVersion: "Version",
      infoDict: "Dictionary entries",
      infoRules: "Dynamic rules",
      infoRepo: "GitHub Repository",
      stage2Title: "Coming in Stage 2",
      stage2Desc: "Theme presets (Default / Enhanced / Glass / Neon / Custom), Wallpaper Studio (images, gradients, video with live preview), and custom fonts.",
      closeTip: "Close (Esc)",
      openTip: "Open Antigravity RU Studio (Ctrl+Alt+P)",
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
      button, input, textarea {
        font-family: inherit;
        color: inherit;
      }
      .dock {
        position: fixed;
        right: 0;
        z-index: 2147483000;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px 7px 9px;
        background: color-mix(in srgb, var(--card, #18181b) 88%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--card-border, rgba(255,255,255,0.12));
        border-right: none;
        border-radius: 10px 0 0 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        user-select: none;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s ease, border-color 0.18s ease;
        transform: translateX(3px);
      }
      .dock:hover {
        transform: translateX(0);
        border-color: var(--primary, #007acc);
      }
      .dock.pos-top { top: 76px; }
      .dock.pos-middle { top: 50%; transform: translateY(-50%) translateX(3px); }
      .dock.pos-middle:hover { transform: translateY(-50%) translateX(0); }
      .dock.pos-bottom { bottom: 92px; }
      .dock.pos-hidden { display: none; }
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
      .dock-badge {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 1px 5px;
        border-radius: 5px;
        background: var(--secondary, #27272a);
        color: var(--foreground, #f4f4f5);
      }
      .dock-tps {
        font-size: 11px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: var(--primary, #38bdf8);
      }

      .drawer {
        position: fixed;
        top: 52px;
        right: 12px;
        bottom: 16px;
        width: 348px;
        max-width: calc(100vw - 24px);
        z-index: 2147483001;
        display: flex;
        flex-direction: column;
        background: color-mix(in srgb, var(--background, #121215) 94%, transparent);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--card-border, rgba(255,255,255,0.12));
        border-radius: 14px;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
        transform: translateX(370px);
        transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      }
      .drawer.open {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(0);
      }
      .hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 11px 12px;
        border-bottom: 1px solid var(--card-border, rgba(255,255,255,0.09));
        background: color-mix(in srgb, var(--card, #18181b) 75%, transparent);
      }
      .hdr-left {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .logo-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 7px;
        font-size: 10px;
        font-weight: 800;
        background: linear-gradient(135deg, #1d4ed8, #0284c7);
        color: #fff;
        flex-shrink: 0;
      }
      .hdr-title {
        font-size: 13px;
        font-weight: 650;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hdr-ver {
        font-size: 10px;
        color: var(--muted-foreground, #8a8a93);
      }
      .hdr-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .seg {
        display: inline-flex;
        padding: 2px;
        border-radius: 8px;
        background: var(--secondary, #27272a);
        border: 1px solid var(--card-border, rgba(255,255,255,0.08));
      }
      .seg button {
        border: none;
        background: transparent;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        color: var(--muted-foreground, #a1a1aa);
        transition: background 0.15s ease, color 0.15s ease;
      }
      .seg button.active {
        background: var(--primary, #007acc);
        color: var(--primary-foreground, #ffffff);
      }
      .close-btn {
        width: 26px;
        height: 26px;
        border-radius: 7px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--muted-foreground, #a1a1aa);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        line-height: 1;
      }
      .close-btn:hover {
        background: var(--secondary, #27272a);
        color: var(--foreground, #fff);
      }

      .tabs {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        padding: 8px 10px 6px;
        border-bottom: 1px solid var(--card-border, rgba(255,255,255,0.08));
      }
      .tab-btn {
        border: 1px solid transparent;
        background: transparent;
        padding: 6px 6px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--muted-foreground, #a1a1aa);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .tab-btn:hover {
        color: var(--foreground, #fff);
        background: color-mix(in srgb, var(--secondary, #27272a) 60%, transparent);
      }
      .tab-btn.active {
        color: var(--foreground, #fff);
        background: var(--secondary, #27272a);
        border-color: var(--card-border, rgba(255,255,255,0.12));
      }

      .body {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 11px;
      }
      .body::-webkit-scrollbar { width: 5px; }
      .body::-webkit-scrollbar-thumb {
        background: var(--card-border, rgba(255,255,255,0.15));
        border-radius: 999px;
      }
      .pane { display: none; flex-direction: column; gap: 11px; }
      .pane.active { display: flex; }

      .card {
        background: var(--card, #18181b);
        border: 1px solid var(--card-border, rgba(255,255,255,0.09));
        border-radius: 10px;
        padding: 10px 11px;
      }
      .status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .status-left {
        display: flex;
        align-items: center;
        gap: 7px;
        font-weight: 600;
        font-size: 12px;
      }
      .model-pill {
        font-size: 11px;
        color: var(--muted-foreground, #a1a1aa);
        max-width: 170px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 7px;
      }
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
      .metric-lbl {
        font-size: 10.5px;
        color: var(--muted-foreground, #8a8a93);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .metric-val {
        font-size: 15px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--foreground, #fff);
        white-space: nowrap;
      }
      .metric-sub {
        font-size: 10px;
        color: var(--muted-foreground, #8a8a93);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .spark-hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .sec-title {
        font-size: 11.5px;
        font-weight: 600;
        color: var(--secondary-foreground, #d4d4d8);
      }
      .link-btn {
        border: none;
        background: transparent;
        padding: 2px 5px;
        font-size: 11px;
        color: var(--muted-foreground, #a1a1aa);
        cursor: pointer;
        border-radius: 5px;
      }
      .link-btn:hover {
        color: var(--foreground, #fff);
        background: var(--secondary, #27272a);
      }
      .spark-svg {
        width: 100%;
        height: 58px;
        display: block;
        border-radius: 6px;
        background: color-mix(in srgb, var(--muted, #111113) 75%, transparent);
      }

      .hist-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-top: 6px;
      }
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
      .hist-empty {
        font-size: 11.5px;
        color: var(--muted-foreground, #8a8a93);
        margin-top: 4px;
      }
      .footnote {
        font-size: 10.5px;
        color: var(--muted-foreground, #8a8a93);
        line-height: 1.35;
      }

      .switch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .switch-btn {
        position: relative;
        width: 36px;
        height: 20px;
        border-radius: 999px;
        border: none;
        background: var(--secondary, #3f3f46);
        cursor: pointer;
        padding: 0;
        flex-shrink: 0;
        transition: background 0.18s ease;
      }
      .switch-btn[aria-checked="true"] {
        background: var(--primary, #007acc);
      }
      .switch-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.18s ease;
      }
      .switch-btn[aria-checked="true"] .switch-knob {
        transform: translateX(16px);
      }
      .pill-tag {
        font-size: 10.5px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 999px;
        background: var(--secondary, #27272a);
        color: var(--muted-foreground, #a1a1aa);
      }
      .pill-tag.on {
        background: color-mix(in srgb, var(--success, #34d399) 18%, transparent);
        color: var(--success, #34d399);
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 6px;
      }
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
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      .chip:hover {
        border-color: var(--primary, #007acc);
      }
      .chip.active {
        border-color: var(--primary, #007acc);
        background: color-mix(in srgb, var(--primary, #007acc) 22%, var(--secondary, #27272a));
      }
      .chip-del {
        font-size: 12px;
        line-height: 1;
        opacity: 0.65;
        padding-left: 2px;
      }
      .chip-del:hover { opacity: 1; color: var(--error, #de5555); }

      textarea.persona-ta {
        width: 100%;
        min-height: 132px;
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
      textarea.persona-ta:focus {
        border-color: var(--primary, #007acc);
      }
      .meter-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10.5px;
        color: var(--muted-foreground, #8a8a93);
        font-variant-numeric: tabular-nums;
      }
      .meter-row.warn { color: var(--warning, #e8975f); }
      .meter-row.over { color: var(--error, #de5555); font-weight: 600; }

      .btn-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .btn {
        border: 1px solid var(--card-border, rgba(255,255,255,0.12));
        background: var(--secondary, #27272a);
        color: var(--foreground, #f4f4f5);
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s ease, background 0.15s ease;
      }
      .btn:hover { opacity: 0.9; }
      .btn:disabled { opacity: 0.45; cursor: not-allowed; }
      .btn-primary {
        background: var(--primary, #007acc);
        border-color: var(--primary, #007acc);
        color: var(--primary-foreground, #fff);
        flex: 1;
      }
      .preset-bar {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .preset-bar input {
        flex: 1;
        min-width: 0;
        padding: 5px 8px;
        border-radius: 7px;
        border: 1px solid var(--card-border, rgba(255,255,255,0.14));
        background: var(--muted, #141417);
        font-size: 11.5px;
        outline: none;
      }
      .preset-bar input:focus { border-color: var(--primary, #007acc); }
      .toast {
        font-size: 11px;
        padding: 7px 9px;
        border-radius: 8px;
        border: 1px solid var(--card-border, rgba(255,255,255,0.1));
      }
      .toast.ok {
        background: color-mix(in srgb, var(--success, #34d399) 14%, transparent);
        border-color: color-mix(in srgb, var(--success, #34d399) 35%, transparent);
        color: var(--success, #34d399);
      }
      .toast.err {
        background: color-mix(in srgb, var(--error, #de5555) 14%, transparent);
        border-color: color-mix(in srgb, var(--error, #de5555) 35%, transparent);
        color: var(--error, #de5555);
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 5px 10px;
        font-size: 11.5px;
        margin-top: 6px;
      }
      .info-k { color: var(--muted-foreground, #8a8a93); }
      .info-v { font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
      .soon-card {
        border-style: dashed;
        border-color: color-mix(in srgb, var(--primary, #007acc) 45%, transparent);
        background: color-mix(in srgb, var(--primary, #007acc) 6%, var(--card, #18181b));
      }
      .gh-link {
        color: var(--link, #6a9fcb);
        text-decoration: none;
        font-size: 11.5px;
        font-weight: 600;
      }
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

    if (typeof hostEl.attachShadow === "function") {
      shadow = hostEl.attachShadow({ mode: "open" });
    } else {
      shadow = hostEl;
    }

    const styleEl = doc.createElement("style");
    styleEl.textContent = getStylesheet();
    shadow.appendChild(styleEl);

    const rootWrap = doc.createElement("div");
    rootWrap.innerHTML = `
      <button type="button" class="dock pos-middle" data-id="dock">
        <span class="dot" data-id="dockDot"></span>
        <span class="dock-badge" data-id="dockLang">RU</span>
        <span class="dock-tps" data-id="dockTps" style="display:none"></span>
      </button>
      <aside class="drawer" data-id="drawer" role="complementary">
        <div class="hdr">
          <div class="hdr-left">
            <span class="logo-pill">RU</span>
            <div style="min-width:0">
              <div class="hdr-title" data-id="hdrTitle"></div>
              <div class="hdr-ver" data-id="hdrVer"></div>
            </div>
          </div>
          <div class="hdr-actions">
            <div class="seg">
              <button type="button" data-id="hdrRu">RU</button>
              <button type="button" data-id="hdrEn">EN</button>
            </div>
            <button type="button" class="close-btn" data-id="closeBtn">&times;</button>
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
              <svg class="spark-svg" viewBox="0 0 300 58" preserveAspectRatio="none" data-id="sparkSvg">
                <defs>
                  <linearGradient id="agySparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.38"/>
                    <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02"/>
                  </linearGradient>
                </defs>
                <polygon points="" fill="url(#agySparkGrad)" data-id="sparkArea"></polygon>
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
              <textarea class="persona-ta" rows="7" data-id="personaTextarea"></textarea>
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
              <div class="switch-row">
                <span class="sec-title" data-id="langTitle"></span>
                <div class="seg">
                  <button type="button" data-id="setRuBtn">Русский</button>
                  <button type="button" data-id="setEnBtn">English</button>
                </div>
              </div>
              <div class="footnote" data-id="hotkeyHintLang"></div>
            </div>

            <div class="card" style="display:flex;flex-direction:column;gap:8px">
              <div class="sec-title" data-id="dockTitle"></div>
              <div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(4,1fr)">
                <button type="button" data-dock="top" data-id="dockTop"></button>
                <button type="button" data-dock="middle" data-id="dockMiddle"></button>
                <button type="button" data-dock="bottom" data-id="dockBottom"></button>
                <button type="button" data-dock="hidden" data-id="dockHidden"></button>
              </div>
              <div class="footnote" data-id="hotkeyHintDock"></div>
            </div>

            <div class="card" style="display:flex;flex-direction:column;gap:10px">
              <div class="switch-row">
                <span class="sec-title" data-id="showMiniTpsLbl"></span>
                <button type="button" class="switch-btn" role="switch" aria-checked="true" data-id="miniTpsSwitch">
                  <span class="switch-knob"></span>
                </button>
              </div>
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
      </aside>
    `;
    shadow.appendChild(rootWrap);

    ui = {};
    if (typeof rootWrap.querySelectorAll === "function") {
      const nodes = rootWrap.querySelectorAll("[data-id]");
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        ui[el.getAttribute("data-id")] = el;
      }
      ui.tabBtns = Array.from(rootWrap.querySelectorAll("[data-tab]"));
      ui.panes = Array.from(rootWrap.querySelectorAll("[data-pane]"));
      ui.dockPosBtns = Array.from(rootWrap.querySelectorAll("[data-dock]"));
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

  function bindEvents() {
    if (!ui.dock) return;

    ui.dock.addEventListener("click", () => toggleOpen());
    ui.closeBtn.addEventListener("click", () => setOpen(false));

    ui.hdrRu.addEventListener("click", () => switchLocale("ru"));
    ui.hdrEn.addEventListener("click", () => switchLocale("en"));
    ui.setRuBtn.addEventListener("click", () => switchLocale("ru"));
    ui.setEnBtn.addEventListener("click", () => switchLocale("en"));

    if (ui.tabBtns) {
      for (const btn of ui.tabBtns) {
        btn.addEventListener("click", () => {
          activeTab = btn.getAttribute("data-tab") || "monitor";
          renderTabs();
        });
      }
    }

    if (ui.dockPosBtns) {
      for (const btn of ui.dockPosBtns) {
        btn.addEventListener("click", () => {
          const pos = btn.getAttribute("data-dock") || "middle";
          saveSettings({ dockPosition: pos });
        });
      }
    }

    ui.miniTpsSwitch.addEventListener("click", () => {
      saveSettings({ showMiniTps: !settings.showMiniTps });
    });
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
        if (e.key === "Escape" && isOpen) {
          setOpen(false);
        }
      });
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
    settings = Object.assign({}, settings, patch || {});
    renderAll();
    if (ipc && typeof ipc.invoke === "function") {
      try {
        ipc
          .invoke("agy-studio:save-settings", patch)
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
            if (res && res.state) {
              applyRemoteState(res.state);
            }
            if (res && res.ok) {
              personaSaveFeedback = {
                ok: true,
                msg: res.exists ? t("savedOk") : t("disabledOk"),
              };
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
      const isAct = btn.getAttribute("data-tab") === activeTab;
      btn.className = isAct ? "tab-btn active" : "tab-btn";
    }
    for (const pane of ui.panes) {
      const isAct = pane.getAttribute("data-pane") === activeTab;
      pane.className = isAct ? "pane active" : "pane";
    }
  }

  function renderChrome() {
    if (!ui.dock) return;
    ui.dock.className = "dock pos-" + (settings.dockPosition || "middle");
    ui.dock.title = t("openTip");
    ui.dockLang.textContent = locale.toUpperCase();

    const dotClass =
      monitor.phase === "streaming" ? "dot streaming" : monitor.phase === "thinking" ? "dot thinking" : "dot";
    ui.dockDot.className = dotClass;
    ui.monDot.className = dotClass;

    const shownTps = monitor.phase === "streaming" ? monitor.liveTps : monitor.lastAvgTps;
    if (settings.showMiniTps && shownTps > 0) {
      ui.dockTps.style.display = "inline";
      ui.dockTps.textContent = shownTps + " " + t("tpsUnit");
    } else {
      ui.dockTps.style.display = "none";
    }

    ui.drawer.className = isOpen ? "drawer open" : "drawer";
    ui.hdrTitle.textContent = t("brand");
    ui.hdrVer.textContent = "v" + (pluginMeta.version || "2.2.0");
    ui.closeBtn.title = t("closeTip");

    ui.hdrRu.className = locale === "ru" ? "active" : "";
    ui.hdrEn.className = locale === "en" ? "active" : "";

    ui.tabMonitor.textContent = t("tabMonitor");
    ui.tabPersona.textContent = t("tabPersona");
    ui.tabSettings.textContent = t("tabSettings");
  }

  function renderSparkline() {
    if (!ui.sparkLine || !ui.sparkArea) return;
    const pts = monitor.sparkline;
    if (!pts || pts.length === 0) {
      ui.sparkLine.setAttribute("points", "");
      ui.sparkArea.setAttribute("points", "");
      return;
    }
    const w = 300;
    const h = 58;
    const padY = 5;
    const maxVal = Math.max(20, ...pts);
    const coords = pts.map((v, idx) => {
      const x = pts.length === 1 ? w : Math.round((idx / (pts.length - 1)) * w * 10) / 10;
      const y = Math.round((h - padY - (v / maxVal) * (h - padY * 2)) * 10) / 10;
      return `${x},${y}`;
    });
    ui.sparkLine.setAttribute("points", coords.join(" "));
    ui.sparkArea.setAttribute("points", `0,${h} ${coords.join(" ")} ${w},${h}`);
  }

  function renderMonitor() {
    if (!ui.monPhase) return;
    if (monitor.phase === "streaming") {
      ui.monPhase.textContent = t("statusStreaming");
    } else if (monitor.phase === "thinking") {
      ui.monPhase.textContent =
        monitor.thinkingSec > 0 ? `${t("statusThinking")} ${monitor.thinkingSec}${locale === "ru" ? " с" : "s"}` : t("statusThinking");
    } else {
      ui.monPhase.textContent = t("statusIdle");
    }

    ui.monModel.textContent = monitor.modelName || t("modelUnknown");
    ui.monModel.title = monitor.modelName || "";

    ui.lblTps.textContent = t("tpsLabel");
    const mainTps = monitor.phase === "streaming" ? monitor.liveTps : monitor.lastAvgTps;
    ui.valTps.textContent = `${mainTps} ${t("tpsUnit")}`;
    ui.subTps.textContent = `${t("peakPrefix")} ${monitor.peakTps} ${t("tpsUnit")}`;

    ui.lblResp.textContent = t("respLabel");
    ui.valResp.textContent = `~${formatInt(monitor.responseTokens)} ${t("tokUnit")}`;
    ui.subResp.textContent = `${formatInt(monitor.responseChars)} ${t("charsUnit")}`;

    ui.lblChat.textContent = t("chatLabel");
    ui.valChat.textContent = `~${formatInt(monitor.chatTokens)} ${t("tokUnit")}`;
    ui.subChat.textContent = monitor.contextNote || "";

    ui.sparkTitle.textContent = t("sparkTitle");
    ui.resetStatsBtn.textContent = t("resetStats");
    renderSparkline();

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

    ui.presetsLabel = ui.presetsLbl;
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
    if (!ui.langTitle) return;
    ui.langTitle.textContent = t("langTitle");
    ui.setRuBtn.className = locale === "ru" ? "active" : "";
    ui.setEnBtn.className = locale === "en" ? "active" : "";
    ui.hotkeyHintLang.textContent = t("hotkeyHintLang");

    ui.dockTitle.textContent = t("dockTitle");
    ui.dockTop.textContent = t("dockTop");
    ui.dockMiddle.textContent = t("dockMiddle");
    ui.dockBottom.textContent = t("dockBottom");
    ui.dockHidden.textContent = t("dockHidden");
    for (const btn of ui.dockPosBtns || []) {
      const pos = btn.getAttribute("data-dock");
      btn.className = pos === settings.dockPosition ? "active" : "";
    }
    ui.hotkeyHintDock.textContent = t("hotkeyHintDock");

    ui.showMiniTpsLbl.textContent = t("showMiniTpsLabel");
    ui.miniTpsSwitch.setAttribute("aria-checked", settings.showMiniTps ? "true" : "false");
    ui.trackHistLbl.textContent = t("trackHistoryLabel");
    ui.trackHistSwitch.setAttribute("aria-checked", settings.trackHistory ? "true" : "false");

    ui.pluginInfoTitle.textContent = t("pluginInfoTitle");
    ui.infoVerK.textContent = t("infoVersion");
    ui.infoVerV.textContent = "v" + (pluginMeta.version || "2.2.0");
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

    // Anti-spike protection on conversation switch
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
      if (isOpen && activeTab === "monitor") renderMonitor();
      return;
    }

    // Response element switched (e.g. user sent a new prompt)
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
    if (isOpen && activeTab === "monitor") {
      renderMonitor();
    }
  }

  function setOpen(next) {
    isOpen = Boolean(next);
    renderChrome();
    if (isOpen) {
      pollStream();
      renderTabs();
      renderPersona();
      renderSettingsTab();
    }
  }

  function toggleOpen() {
    setOpen(!isOpen);
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
      settings = Object.assign({}, settings, state.settings);
      if (personaDirty) {
        settings.personaText = prevText;
      }
    }
    personaFileExists = Boolean(state.personaFileExists);
    if (typeof state.personaFilePath === "string" && state.personaFilePath) {
      personaFilePath = state.personaFilePath;
    }
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
    setLocale,
    applyRemoteState,
    estimateTokens,
    pollStream,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { createStudioPanel, estimateTokens, BUILTIN_PERSONA_PRESETS };
}
