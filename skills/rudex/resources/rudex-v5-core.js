"use strict";

/**
 * Rudex 5.0 Core Module (browser-safe, zero Node imports):
 * - Built-in Agent Capability Presets & Feature Toggles
 * - Configurable Keybinding definitions & recorder formatter
 * - Standalone "Only Limits" screen widget renderer & styling
 * - Visual UI Zones map & Live Element Picker (smart stable selector + floating inspector)
 * - Native Composer Inline "Send Live Edit" + Quick Agent Popover bridge
 * - Native Antigravity Settings & Customization menu integration
 */

const RUDEX_AGENT_PRESETS = [
  {
    id: "default",
    icon: "◎",
    nameRu: "Стандартный",
    nameEn: "Standard",
    descRu: "Обычное поведение Antigravity без ограничений",
    descEn: "Default Antigravity behavior without overrides",
    profile: {
      presetId: "default",
      presetLabel: "Стандартный",
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
    id: "turbo",
    icon: "🚀",
    nameRu: "Полный турбо",
    nameEn: "Full Turbo",
    descRu: "Параллельные субагенты, веб-поиск, план, авто-тесты и режим «До конца»",
    descEn: "Parallel subagents, web search, plan checklist, auto-tests & deep finish",
    profile: {
      presetId: "turbo",
      presetLabel: "Полный турбо",
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
    icon: "⚡",
    nameRu: "Быстрый фикс",
    nameEn: "Quick Fix",
    descRu: "Без субагентов и длинных планов — сразу точечная правка и краткий ответ",
    descEn: "No heavy subagents or long plans — straight to the fix, concise reply",
    profile: {
      presetId: "fast-fix",
      presetLabel: "Быстрый фикс",
      enabled: true,
      subagents: "off",
      webSearch: "auto",
      browser: "off",
      planFirst: "skip",
      autoVerify: true,
      deepMode: false,
      conciseness: "short",
      safetyMode: "normal",
    },
  },
  {
    id: "architect-ro",
    icon: "🧠",
    nameRu: "Архитектор (Read-Only)",
    nameEn: "Architect (Read-Only)",
    descRu: "Правки файлов и команды заблокированы; глубокий анализ с субагентами и вебом",
    descEn: "File writes & shell blocked via PreToolUse; deep research + web analysis",
    profile: {
      presetId: "architect-ro",
      presetLabel: "Архитектор (Read-Only)",
      enabled: true,
      subagents: "parallel",
      webSearch: "always",
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
    icon: "🎨",
    nameRu: "Фронтенд / UI",
    nameEn: "Frontend / UI",
    descRu: "Браузерный агент, Chrome DevTools и визуальная проверка вёрстки после правок",
    descEn: "Browser agent + DevTools + visual UI check after edits",
    profile: {
      presetId: "frontend-ui",
      presetLabel: "Фронтенд / UI",
      enabled: true,
      subagents: "parallel",
      webSearch: "auto",
      browser: "verify",
      planFirst: "auto",
      autoVerify: true,
      deepMode: true,
      conciseness: "balanced",
      safetyMode: "normal",
    },
  },
  {
    id: "safe-audit",
    icon: "🛡️",
    nameRu: "Безопасный аудит",
    nameEn: "Safe Audit",
    descRu: "Запрос подтверждения перед каждой командой терминала + подробный разбор",
    descEn: "Force confirmation before every terminal command + detailed review",
    profile: {
      presetId: "safe-audit",
      presetLabel: "Безопасный аудит",
      enabled: true,
      subagents: "auto",
      webSearch: "auto",
      browser: "off",
      planFirst: "strict",
      autoVerify: true,
      deepMode: false,
      conciseness: "detailed",
      safetyMode: "cautious",
    },
  },
];

const RUDEX_UI_ZONES = [
  { id: "header", nameRu: "Верхняя шапка", nameEn: "Top Header", selector: 'header:not(#rudex-studio-host *), [data-rudex-bg-header="1"]', area: "top" },
  { id: "sidebar", nameRu: "Боковая панель", nameEn: "Left Sidebar", selector: 'aside:not(#rudex-studio-host *), [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]', area: "left" },
  { id: "sidebar-items", nameRu: "Пункты и чаты сайдбара", nameEn: "Sidebar Items & Chats", selector: ':where(aside, [data-testid="sidebar"], [data-rudex-bg-sidebar="1"]) :where(a, button, [role="listitem"])', area: "left-list" },
  { id: "user-bubble", nameRu: "Мои сообщения", nameEn: "User Messages", selector: '[data-testid="user-message-bubble"], [data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *)', area: "chat-user" },
  { id: "agent-reply", nameRu: "Ответы агента", nameEn: "Agent Replies", selector: '[data-testid="agent-response"]', area: "chat-agent" },
  { id: "thinking", nameRu: "Мысли и шаги агента", nameEn: "Agent Thoughts & Steps", selector: 'main :where([data-testid*="thought"], [data-testid*="thinking"], [data-slot="collapsible"]:has(> button)):not([data-testid="agent-response"])', area: "chat-steps" },
  { id: "code", nameRu: "Блоки кода", nameEn: "Code Blocks", selector: ':where([data-testid="agent-response"], [data-markdown-root], main) pre:not(#rudex-studio-host *)', area: "chat-code" },
  { id: "composer", nameRu: "Поле ввода (Композер)", nameEn: "Input Composer", selector: '[data-rudex-theme-composer="1"]', area: "bottom" },
  { id: "composer-bar", nameRu: "Нижняя строка ввода", nameEn: "Composer Toolbar", selector: '[data-rudex-theme-composer="1"] :where(button, [role="button"])', area: "bottom-bar" },
  { id: "overlays", nameRu: "Меню и всплывающие окна", nameEn: "Menus & Tooltips", selector: ':where([role="menu"], [role="listbox"], [role="tooltip"], [role="dialog"]):not(#rudex-studio-host):not(#rudex-studio-host *)', area: "overlay" },
];

const RUDEX_KEYBINDING_DEFS = [
  { id: "toggleStudio", group: "menu", nameRu: "Открыть / закрыть Rudex Studio", nameEn: "Open / close Rudex Studio", def: "Ctrl+Alt+P" },
  { id: "toggleZenUi", group: "menu", nameRu: "Скрыть / показать все элементы Rudex (Дзен)", nameEn: "Hide / show all Rudex UI (Zen)", def: "Ctrl+Alt+H" },
  { id: "toggleLocale", group: "menu", nameRu: "Переключить язык (RU ↔ EN)", nameEn: "Toggle language (RU ↔ EN)", def: "Ctrl+Alt+L" },
  { id: "openTabAgent", group: "menu", nameRu: "Открыть раздел «Агент»", nameEn: "Open Agent tab", def: "" },
  { id: "openTabDesign", group: "menu", nameRu: "Открыть раздел «Внешний вид»", nameEn: "Open Appearance tab", def: "" },
  { id: "openTabLimits", group: "menu", nameRu: "Открыть раздел «Лимиты»", nameEn: "Open Limits tab", def: "" },
  { id: "openTabWorkshop", group: "menu", nameRu: "Открыть «Мастерскую AGY»", nameEn: "Open AGY Workshop", def: "" },
  { id: "togglePicker", group: "design", nameRu: "Включить / выключить «Прицел» (элементы)", nameEn: "Toggle Element Picker", def: "Ctrl+Alt+E" },
  { id: "cycleWallpaper", group: "design", nameRu: "Сменить обои (следующие / градиент)", nameEn: "Cycle wallpaper / gradient", def: "Ctrl+Alt+W" },
  { id: "toggleWallpaper", group: "design", nameRu: "Включить / выключить обои", nameEn: "Toggle wallpaper on/off", def: "Ctrl+Alt+Shift+W" },
  { id: "cycleTheme", group: "design", nameRu: "Переключить тему (следующая)", nameEn: "Cycle theme preset", def: "Ctrl+Alt+T" },
  { id: "toggleDarkLight", group: "design", nameRu: "Тёмная ↔ Светлая тема Claude Code", nameEn: "Toggle Dark ↔ Light Claude theme", def: "Ctrl+Alt+D" },
  { id: "emergencyResetOverrides", group: "design", nameRu: "Пауза / сброс правок элементов", nameEn: "Pause / resume element overrides", def: "Ctrl+Alt+Shift+R" },
  { id: "toggleLimitsWidget", group: "widgets", nameRu: "Показать / скрыть окно «Только лимиты»", nameEn: "Show / hide Limits widget", def: "Ctrl+Alt+Q" },
  { id: "toggleAgentPopover", group: "agent", nameRu: "Открыть быстрый «Пульт агента»", nameEn: "Toggle Quick Agent Controls", def: "Ctrl+Alt+A" },
  { id: "cycleAgentPreset", group: "agent", nameRu: "Переключить пресет агента", nameEn: "Cycle Agent Preset", def: "Ctrl+Alt+Shift+A" },
];

const RUDEX_LIMITS_DEFAULTS = {
  enabled: false,
  onlyLimitsMode: false,
  layout: "bars",
  position: "top-right",
  floatX: null,
  floatY: null,
  pinned: false,
  fontFamily: "inherit",
  fontFamilyCustom: "",
  fontSize: 12,
  bgColor: "",
  bgOpacity: 88,
  textColor: "",
  borderColor: "",
  borderRadius: 12,
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
};

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

function rv5FormatKeyboardEvent(ev) {
  if (!ev) return "";
  const key = String(ev.key || "");
  if (key === "Control" || key === "Alt" || key === "Shift" || key === "Meta" || key === "Dead") return "";
  if (key === "Escape") return "__CANCEL__";
  if (key === "Backspace" || key === "Delete") return "__CLEAR__";
  const parts = [];
  if (ev.ctrlKey || ev.metaKey) parts.push("Ctrl");
  if (ev.altKey) parts.push("Alt");
  if (ev.shiftKey) parts.push("Shift");
  if (parts.length === 0 && !/^F\d{1,2}$/i.test(key)) return "";
  let main = key;
  const code = String(ev.code || "");
  if (/^Key([A-Z])$/.test(code)) main = code.slice(3);
  else if (/^Digit(\d)$/.test(code)) main = code.slice(5);
  else if (main.length === 1) main = main.toUpperCase();
  parts.push(main);
  return parts.join("+");
}

function rv5NormalizeLimitsWidget(raw) {
  return Object.assign({}, RUDEX_LIMITS_DEFAULTS, raw && typeof raw === "object" ? raw : {});
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
  return Object.assign({}, RUDEX_AGENT_PROFILE_DEFAULTS, src, {
    pinnedSkills: Array.isArray(src.pinnedSkills) ? src.pinnedSkills.slice() : [],
    disabledTools: Array.isArray(src.disabledTools) ? src.disabledTools.slice() : [],
  });
}

function rv5CountActiveAgentFeatures(prof) {
  if (!prof || !prof.enabled) return 0;
  let n = 0;
  if (prof.subagents !== "auto") n += 1;
  if (prof.webSearch !== "auto") n += 1;
  if (prof.browser !== "auto") n += 1;
  if (prof.planFirst !== "auto") n += 1;
  if (prof.autoVerify) n += 1;
  if (prof.deepMode) n += 1;
  if (prof.conciseness !== "balanced") n += 1;
  if (prof.safetyMode !== "normal") n += 1;
  if (Array.isArray(prof.pinnedSkills) && prof.pinnedSkills.length > 0) n += 1;
  if (Array.isArray(prof.disabledTools) && prof.disabledTools.length > 0) n += 1;
  return n;
}

function rv5GetTrafficColor(remPct, fallbackAccent) {
  if (typeof remPct !== "number" || !Number.isFinite(remPct)) return fallbackAccent || "var(--rx-accent)";
  if (remPct <= 18) return "#ef4444";
  if (remPct <= 45) return "#f59e0b";
  return "#22c55e";
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
 */
function rv5BuildLimitsWidgetHtml(cfgRaw, quotaSummary, activeModelName, isRu) {
  const cfg = rv5NormalizeLimitsWidget(cfgRaw);
  const qs = quotaSummary && typeof quotaSummary === "object" ? quotaSummary : {};
  const fams = qs.families && typeof qs.families === "object" ? qs.families : {};
  const gem = fams.gemini || {};
  const cl = fams.claudeGpt || {};
  const modelLow = String(activeModelName || "").toLowerCase();
  const activeFam = modelLow.includes("claude") || modelLow.includes("gpt") || modelLow.includes("sonnet") || modelLow.includes("opus")
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
  const customVars = [
    fontStack ? `font-family:${fontStack};` : "",
    `font-size:${cfg.fontSize}px;`,
    cfg.bgColor ? `background:${rv5HexToRgba(cfg.bgColor, cfg.bgOpacity)};` : "",
    cfg.textColor ? `color:${cfg.textColor};` : "",
    cfg.borderColor ? `border-color:${cfg.borderColor};` : "",
    `border-radius:${cfg.borderRadius}px;`,
    cfg.blur > 0 ? `backdrop-filter:blur(${cfg.blur}px);-webkit-backdrop-filter:blur(${cfg.blur}px);` : "backdrop-filter:none;",
    cfg.scale !== 100 ? `zoom:${(cfg.scale / 100).toFixed(2)};` : "",
  ].filter(Boolean).join("");

  const label5h = isRu ? "5ч" : "5h";
  const labelWk = isRu ? "Нед" : "Wk";
  const hasAnyReal = rows.some((r) => typeof r.data.fiveHourRem === "number" || typeof r.data.weeklyRem === "number");
  const titleHint = isRu ? "Лимиты Antigravity (клик — настройки)" : "Antigravity Limits (click for settings)";

  if (cfg.layout === "pill" || cfg.layout === "inline-header") {
    const chunks = rows.map((r) => {
      const parts = [];
      if (cfg.show5h) {
        const c = barCol(r.data.fiveHourRem);
        parts.push(`<span class="rx-lim-kv"><i class="rx-lim-dot" style="background:${c}"></i>${label5h} <b>${fmtVal(r.data.fiveHourRem)}</b></span>`);
      }
      if (cfg.showWeekly) {
        const c = barCol(r.data.weeklyRem);
        parts.push(`<span class="rx-lim-kv"><i class="rx-lim-dot" style="background:${c}"></i>${labelWk} <b>${fmtVal(r.data.weeklyRem)}</b></span>`);
      }
      return `<span class="rx-lim-fam"><strong>${rv5EscapeHtml(r.label)}</strong> ${parts.join(" · ")}</span>`;
    }).join('<span class="rx-lim-sep">|</span>');
    return `
      <div class="rx-limits-box is-${rv5EscapeHtml(cfg.layout)}${cfg.pinned ? " is-pinned" : ""}" data-role="limitsWidgetBox" style="${rv5EscapeHtml(customVars)}" title="${rv5EscapeHtml(titleHint)}">
        <span class="rx-lim-drag" data-limits-drag="1" title="${isRu ? "Перетащить" : "Drag"}">⋮⋮</span>
        ${chunks}
        <button type="button" class="rx-lim-btn" data-action="sync-limits-now" title="${isRu ? "Обновить лимиты (открыть Usage)" : "Refresh limits"}">↻</button>
        <button type="button" class="rx-lim-btn" data-action="open-limits-settings" title="${isRu ? "Настроить окно лимитов" : "Configure limits widget"}">⚙</button>
      </div>
    `;
  }

  return `
    <div class="rx-limits-box is-${rv5EscapeHtml(cfg.layout)}${cfg.pinned ? " is-pinned" : ""}" data-role="limitsWidgetBox" style="${rv5EscapeHtml(customVars)}">
      <div class="rx-lim-head" data-limits-drag="1">
        <span class="rx-lim-title">${isRu ? "Лимиты Antigravity" : "Antigravity Limits"}</span>
        <div class="rx-lim-acts">
          <button type="button" class="rx-lim-btn" data-action="sync-limits-now" title="${isRu ? "Синхронизировать лимиты" : "Sync limits"}">↻</button>
          <button type="button" class="rx-lim-btn" data-action="open-limits-settings" title="${isRu ? "Настройки окна лимитов" : "Limits settings"}">⚙</button>
        </div>
      </div>
      <div class="rx-lim-body">
        ${rows.map((r) => {
          const d = r.data;
          const resetStr = cfg.showResetTimer ? (d.fiveHourReset || d.weeklyReset || "") : "";
          return `
            <div class="rx-lim-row">
              <div class="rx-lim-row-top">
                <span class="rx-lim-name">${rv5EscapeHtml(r.label)}</span>
                ${resetStr ? `<span class="rx-lim-reset">⏱ ${rv5EscapeHtml(resetStr)}</span>` : ""}
              </div>
              ${cfg.show5h ? `
                <div class="rx-lim-bar-line">
                  <span class="rx-lim-lbl">${label5h}</span>
                  <div class="rx-lim-track"><div class="rx-lim-fill" style="width:${barPct(d.fiveHourRem)}%;background:${barCol(d.fiveHourRem)}"></div></div>
                  <span class="rx-lim-pct">${fmtVal(d.fiveHourRem)}</span>
                </div>
              ` : ""}
              ${cfg.showWeekly ? `
                <div class="rx-lim-bar-line">
                  <span class="rx-lim-lbl">${labelWk}</span>
                  <div class="rx-lim-track"><div class="rx-lim-fill" style="width:${barPct(d.weeklyRem)}%;background:${barCol(d.weeklyRem)}"></div></div>
                  <span class="rx-lim-pct">${fmtVal(d.weeklyRem)}</span>
                </div>
              ` : ""}
            </div>
          `;
        }).join("")}
        ${!hasAnyReal ? `<div class="rx-lim-tip">${isRu ? "Нажмите ↻ или откройте Настройки → Модели и использование для снимка %" : "Click ↻ or open Settings → Models & Usage to calibrate %"}</div>` : ""}
      </div>
    </div>
  `;
}

/**
 * Build smart, React-safe CSS selector for any element clicked in Element Picker.
 */
function rv5BuildSmartSelector(el, scope) {
  if (!el || el.nodeType !== 1) return "";
  const testId = typeof el.getAttribute === "function" ? el.getAttribute("data-testid") : "";
  if (testId) {
    return `[data-testid="${testId.replace(/"/g, '\\"')}"]`;
  }
  const zone = typeof el.getAttribute === "function" ? el.getAttribute("data-rudex-zone") : "";
  if (zone) {
    return `[data-rudex-zone="${zone.replace(/"/g, '\\"')}"]`;
  }
  if (typeof el.getAttribute === "function" && el.getAttribute("data-rudex-theme-composer") === "1") {
    return '[data-rudex-theme-composer="1"]';
  }
  if (typeof el.getAttribute === "function" && el.getAttribute("data-rudex-bg-sidebar") === "1") {
    return '[data-rudex-bg-sidebar="1"]';
  }
  if (typeof el.getAttribute === "function" && el.getAttribute("data-rudex-bg-header") === "1") {
    return '[data-rudex-bg-header="1"]';
  }
  const tag = (el.tagName || "div").toLowerCase();
  const aria = typeof el.getAttribute === "function" ? (el.getAttribute("aria-label") || "").trim() : "";
  if (scope !== "similar" && aria && aria.length <= 64 && !/["\\]/.test(aria)) {
    return `${tag}[aria-label="${aria}"]`;
  }
  const role = typeof el.getAttribute === "function" ? (el.getAttribute("role") || "").trim() : "";
  if (scope === "similar") {
    if (role) return `${tag}[role="${role}"]:not(#rudex-studio-host *)`;
    const parent = el.parentElement;
    const pTest = parent && typeof parent.getAttribute === "function" ? parent.getAttribute("data-testid") : "";
    if (pTest) return `[data-testid="${pTest}"] > ${tag}`;
    if (tag === "aside" || tag === "header" || tag === "nav" || tag === "pre" || tag === "blockquote") {
      return `${tag}:not(#rudex-studio-host *)`;
    }
  }
  // Structural path up to nearest semantic ancestor (max 4 levels)
  const segs = [];
  let cur = el;
  let depth = 0;
  while (cur && cur.nodeType === 1 && depth < 4) {
    const t = (cur.tagName || "div").toLowerCase();
    if (t === "body" || t === "html") break;
    const tid = typeof cur.getAttribute === "function" ? cur.getAttribute("data-testid") : "";
    if (tid) {
      segs.unshift(`[data-testid="${tid.replace(/"/g, '\\"')}"]`);
      break;
    }
    if (cur.id && /^[a-zA-Z][a-zA-Z0-9_-]{1,40}$/.test(cur.id) && !cur.id.startsWith("radix-")) {
      segs.unshift(`#${cur.id}`);
      break;
    }
    let idx = 1;
    let sib = cur.previousElementSibling;
    while (sib) {
      if ((sib.tagName || "").toLowerCase() === t) idx += 1;
      sib = sib.previousElementSibling;
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
  const tag = (el.tagName || "").toLowerCase();
  if (tid === "user-message-bubble" || tid === "user-message-content") return isRu ? "Сообщение пользователя" : "User Message";
  if (tid === "agent-response") return isRu ? "Ответ агента" : "Agent Response";
  if (tid === "sidebar" || tag === "aside" || el.getAttribute("data-rudex-bg-sidebar") === "1") return isRu ? "Боковая панель" : "Sidebar";
  if (tag === "header" || el.getAttribute("data-rudex-bg-header") === "1") return isRu ? "Верхняя шапка" : "Top Header";
  if (el.getAttribute("data-rudex-theme-composer") === "1" || tid === "composer") return isRu ? "Поле ввода (Композер)" : "Input Composer";
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
  let container = doc.querySelector('[data-rudex-theme-composer="1"]');
  let editable = container ? container.querySelector('textarea, [contenteditable="true"]') : null;
  if (!editable) {
    const cands = doc.querySelectorAll('main textarea, main [contenteditable="true"], form textarea, form [contenteditable="true"]');
    for (let i = cands.length - 1; i >= 0; i -= 1) {
      const c = cands[i];
      if (!c || (c.closest && c.closest("#rudex-studio-host"))) continue;
      editable = c;
      container = c.closest('[data-rudex-theme-composer="1"], form, [data-testid="composer"], .composer-container') || c.parentElement;
      break;
    }
  }
  return { container, editable };
}

function rv5ReadEditableText(editable) {
  if (!editable) return "";
  if (editable.tagName === "TEXTAREA" || editable.tagName === "INPUT") {
    return String(editable.value || "").trim();
  }
  return String(editable.innerText || editable.textContent || "").trim();
}

function rv5ClearEditableText(editable, win) {
  if (!editable) return;
  try {
    if (editable.tagName === "TEXTAREA" || editable.tagName === "INPUT") {
      const proto = editable.tagName === "TEXTAREA"
        ? (win && win.HTMLTextAreaElement ? win.HTMLTextAreaElement.prototype : null)
        : (win && win.HTMLInputElement ? win.HTMLInputElement.prototype : null);
      const desc = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
      if (desc && typeof desc.set === "function") desc.set.call(editable, "");
      else editable.value = "";
      editable.dispatchEvent(new (win.Event || Event)("input", { bubbles: true }));
    } else {
      editable.textContent = "";
      editable.dispatchEvent(new (win.Event || Event)("input", { bubbles: true }));
    }
  } catch (_e) {}
}

/**
 * Extra CSS injected inside Rudex Studio shadow root for v5 components:
 * - Limits widget (pill / bars / card / inline-header)
 * - Floating Agent Quick Bar & Inline Live Edit Queue Capsule above composer
 * - Live Element Picker overlay + Inspector card
 * - Search bar, Keybinding recorder, Workshop cards, Zone map
 */
function rv5BuildExtraShadowCss() {
  return `
/* === RUDEX 5.0 EXTRA SHADOW UI === */
.rx-zen-hidden { display: none !important; }

/* Standalone Limits Widget */
.rx-limits-mount {
  position: fixed;
  z-index: 2147483590;
  pointer-events: auto;
  user-select: none;
}
.rx-limits-mount.pos-top-right { top: 44px; right: 16px; }
.rx-limits-mount.pos-top-left { top: 44px; left: 268px; }
.rx-limits-mount.pos-bottom-right { bottom: 68px; right: 16px; }
.rx-limits-mount.pos-bottom-left { bottom: 68px; left: 268px; }
.rx-limits-mount.pos-inline-header { top: 6px; right: 148px; }
.rx-limits-box {
  background: var(--rx-bg-elev, rgba(24, 24, 27, 0.88));
  color: var(--rx-fg, #f4f4f5);
  border: 1px solid var(--rx-border, rgba(255, 255, 255, 0.14));
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.34);
  font-family: var(--rx-font-ui);
  transition: box-shadow 0.16s ease, border-color 0.16s ease;
}
.rx-limits-box.is-pill, .rx-limits-box.is-inline-header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  white-space: nowrap;
}
.rx-limits-box.is-bars, .rx-limits-box.is-card {
  min-width: 224px;
  max-width: 310px;
  padding: 9px 11px;
}
.rx-lim-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
  cursor: grab;
}
.rx-limits-box.is-pinned .rx-lim-head, .rx-limits-box.is-pinned .rx-lim-drag { cursor: default; }
.rx-lim-title { font-weight: 600; font-size: 1em; opacity: 0.92; }
.rx-lim-acts { display: flex; align-items: center; gap: 4px; }
.rx-lim-drag { cursor: grab; opacity: 0.45; font-size: 11px; letter-spacing: -1px; }
.rx-lim-btn {
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.65;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 5px;
  font-size: 12px;
  line-height: 1;
}
.rx-lim-btn:hover { opacity: 1; background: rgba(255, 255, 255, 0.09); }
.rx-lim-fam { display: inline-flex; align-items: center; gap: 5px; }
.rx-lim-kv { display: inline-flex; align-items: center; gap: 4px; }
.rx-lim-dot { width: 7px; height: 7px; border-radius: 999px; display: inline-block; }
.rx-lim-sep { opacity: 0.35; }
.rx-lim-body { display: flex; flex-direction: column; gap: 7px; }
.rx-lim-row { display: flex; flex-direction: column; gap: 3px; }
.rx-lim-row-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.rx-lim-name { font-weight: 600; font-size: 0.95em; }
.rx-lim-reset { font-size: 0.84em; opacity: 0.68; }
.rx-lim-bar-line { display: grid; grid-template-columns: 32px 1fr 34px; align-items: center; gap: 6px; }
.rx-lim-lbl { font-size: 0.85em; opacity: 0.72; }
.rx-lim-track { height: 6px; border-radius: 999px; background: rgba(128, 128, 140, 0.24); overflow: hidden; }
.rx-lim-fill { height: 100%; border-radius: 999px; transition: width 0.25s ease; }
.rx-lim-pct { font-variant-numeric: tabular-nums; text-align: right; font-weight: 600; font-size: 0.88em; }
.rx-lim-tip { font-size: 0.82em; opacity: 0.68; line-height: 1.3; margin-top: 2px; }

/* Chat Quick Bar & Inline Live-Edit Capsule (anchored above native composer) */
.rx-chat-dock {
  position: fixed;
  z-index: 2147483585;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
}
.rx-chat-dock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}
.rx-agent-chip, .rx-live-send-pill {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  font-family: var(--rx-font-ui);
  border: 1px solid var(--rx-border, rgba(255, 255, 255, 0.14));
  background: var(--rx-bg-elev, rgba(24, 24, 27, 0.9));
  color: var(--rx-fg, #f4f4f5);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
  cursor: pointer;
}
.rx-agent-chip.is-active {
  border-color: color-mix(in srgb, var(--rx-accent, #d97757) 58%, transparent);
}
.rx-live-send-pill {
  background: var(--rx-accent, #d97757);
  color: #fff;
  border-color: transparent;
}
.rx-live-send-pill.is-urgent {
  background: #dc2626;
}
.rx-urgent-toggle {
  pointer-events: auto;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid var(--rx-border, rgba(255,255,255,0.16));
  background: var(--rx-bg-elev, rgba(24,24,27,0.9));
  color: var(--rx-fg, #f4f4f5);
  cursor: pointer;
}
.rx-urgent-toggle.is-on {
  border-color: #ef4444;
  color: #fca5a5;
}
.rx-live-queue-strip {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--rx-bg-elev, rgba(24, 24, 27, 0.94));
  border: 1px solid color-mix(in srgb, var(--rx-accent, #d97757) 42%, var(--rx-border, rgba(255,255,255,0.14)));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.34);
  font-size: 11.5px;
  color: var(--rx-fg, #f4f4f5);
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
}
.rx-lq-badge {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(217, 119, 87, 0.18);
  color: var(--rx-accent, #d97757);
  flex-shrink: 0;
}
.rx-lq-badge.is-done {
  background: rgba(34, 197, 94, 0.18);
  color: #4ade80;
}
.rx-agent-popover {
  pointer-events: auto;
  width: 340px;
  max-width: 92vw;
  max-height: 68vh;
  overflow-y: auto;
  padding: 12px;
  border-radius: 14px;
  background: var(--rx-bg-elev, #1e1e1c);
  border: 1px solid var(--rx-border, rgba(255, 255, 255, 0.16));
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.48);
  color: var(--rx-fg, #f4f4f5);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Live Element Picker Overlay & Mini Inspector */
.rx-picker-banner {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483640;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--rx-bg-elev, #1c1c1a);
  color: var(--rx-fg, #faf9f5);
  border: 1px solid var(--rx-accent, #d97757);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.45);
  font-size: 12px;
  pointer-events: auto;
}
.rx-picker-highlight {
  position: fixed;
  z-index: 2147483635;
  pointer-events: none;
  border: 2px solid var(--rx-accent, #d97757);
  background: color-mix(in srgb, var(--rx-accent, #d97757) 14%, transparent);
  border-radius: 6px;
  transition: all 0.06s ease-out;
}
.rx-picker-tag {
  position: absolute;
  top: -24px;
  left: 0;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--rx-accent, #d97757);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.rx-inspector-card {
  position: fixed;
  right: 18px;
  top: 62px;
  width: 332px;
  max-height: calc(100vh - 88px);
  overflow-y: auto;
  z-index: 2147483642;
  padding: 14px;
  border-radius: 14px;
  background: var(--rx-bg-elev, #1f1e1d);
  color: var(--rx-fg, #faf9f5);
  border: 1px solid var(--rx-border, rgba(255, 255, 255, 0.16));
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.52);
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
}

/* Search, Progressive Details, Zone Map, Keybindings, Workshop */
.rx-search-wrap {
  padding: 0 0 10px 0;
}
.rx-search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 11px;
  border-radius: 8px;
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  color: var(--rx-fg);
  font-size: 12.5px;
  outline: none;
}
.rx-search-input:focus { border-color: var(--rx-accent); }
.rx-details-block {
  border: 1px solid var(--rx-border);
  border-radius: 10px;
  background: var(--rx-surface);
  overflow: hidden;
  margin-top: 8px;
}
.rx-details-summary {
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  list-style: none;
}
.rx-details-body {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--rx-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rx-zone-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.rx-zone-btn {
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  color: var(--rx-fg);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.rx-zone-btn:hover, .rx-zone-btn.is-active {
  border-color: var(--rx-accent);
}
.rx-kb-btn {
  min-width: 124px;
  padding: 4px 10px;
  border-radius: 7px;
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  color: var(--rx-fg);
  font-family: var(--rx-font-mono);
  font-size: 11.5px;
  cursor: pointer;
  text-align: center;
}
.rx-kb-btn.is-recording {
  border-color: var(--rx-accent);
  color: var(--rx-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--rx-accent) 24%, transparent);
}
.rx-preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.rx-preset-tile {
  text-align: left;
  padding: 10px 11px;
  border-radius: 10px;
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  color: var(--rx-fg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rx-preset-tile.is-selected {
  border-color: var(--rx-accent);
  background: color-mix(in srgb, var(--rx-accent) 10%, var(--rx-surface));
}
.rx-ws-card {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--rx-border);
  background: var(--rx-surface);
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  gap: 8px;
}
`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    RUDEX_AGENT_PRESETS,
    RUDEX_UI_ZONES,
    RUDEX_KEYBINDING_DEFS,
    RUDEX_LIMITS_DEFAULTS,
    RUDEX_KEYBINDINGS_DEFAULTS,
    RUDEX_LIVE_EDIT_DEFAULTS,
    RUDEX_AGENT_PROFILE_DEFAULTS,
    rv5EscapeHtml,
    rv5FormatKeyboardEvent,
    rv5NormalizeLimitsWidget,
    rv5NormalizeKeybindings,
    rv5NormalizeAgentProfile,
    rv5CountActiveAgentFeatures,
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
