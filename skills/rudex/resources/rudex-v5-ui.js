"use strict";

/**
 * Rudex 5.0 UI Builders & Native Host Integrations (browser-safe, zero Node imports).
 * Styled strictly with studio-styles.js editorial primitives (.card, .row-item, .rx-details, .color-box).
 */

function rv5UiIcon(name, size) {
  if (typeof rv5IconSvg === "function") return rv5IconSvg(name, size);
  return "";
}

function rv5FontSelectOptions(selectedVal, group, systemFonts, isRu, allowInherit) {
  const fonts = typeof FONT_PRESETS !== "undefined" ? FONT_PRESETS : { ui: [], mono: [] };
  const primary = group === "mono" ? (fonts.mono || []) : (fonts.ui || []);
  const alt = group === "mono" ? (fonts.ui || []) : (fonts.mono || []);
  const opts = [];
  if (allowInherit) {
    opts.push(`<option value="inherit"${selectedVal === "inherit" ? " selected" : ""}>${isRu ? "Как интерфейс (авто)" : "Inherit UI font"}</option>`);
  }
  const seen = new Set();
  for (let i = 0; i < primary.length; i += 1) {
    const f = primary[i];
    if (!f || seen.has(f.id)) continue;
    seen.add(f.id);
    opts.push(`<option value="${rv5EscapeHtml(f.id)}"${selectedVal === f.id ? " selected" : ""}>${rv5EscapeHtml(isRu ? f.label : (f.labelEn || f.label))}</option>`);
  }
  if (allowInherit) {
    for (let i = 0; i < alt.length; i += 1) {
      const f = alt[i];
      if (!f || f.id === "system" || seen.has(f.id)) continue;
      seen.add(f.id);
      opts.push(`<option value="${rv5EscapeHtml(f.id)}"${selectedVal === f.id ? " selected" : ""}>${rv5EscapeHtml(isRu ? f.label : (f.labelEn || f.label))}</option>`);
    }
  }
  opts.push(`<option value="custom"${selectedVal === "custom" ? " selected" : ""}>${isRu ? "Свой системный шрифт…" : "Custom system font…"}</option>`);
  return opts.join("");
}

function rv5RenderSystemFontDatalist(systemFonts) {
  const list = Array.isArray(systemFonts) ? systemFonts : [];
  if (list.length === 0) return "";
  return `<datalist id="rudex-sys-fonts-list">${list.map((f) => `<option value="${rv5EscapeHtml(f)}"></option>`).join("")}</datalist>`;
}

/**
 * Detailed 4-slot typography section (Interface / My Input & Messages / Agent Replies & Thinking / Code).
 */
function rv5RenderDetailedTypographyHtml(draft, systemFonts, isRu) {
  const ty = (draft && draft.typography) || {};
  const customInput = (field, val) => `
    <input type="text" class="text-input" style="margin-top:5px" list="rudex-sys-fonts-list" data-app-field="typography.${field}" value="${rv5EscapeHtml(val || "")}" placeholder="${isRu ? "Например: Segoe UI, Cascadia Code, Arial…" : "e.g. Segoe UI, Cascadia Code, Arial…"}"/>
  `;
  return `
    ${rv5RenderSystemFontDatalist(systemFonts)}
    <details class="rx-details" data-disc="typoSlots" open>
      <summary>${isRu ? "Раздельные шрифты по зонам (Интерфейс · Ввод · Агент · Код)" : "Per-Zone Fonts (UI · Input · Agent · Code)"}</summary>
      <div class="rx-details-body">
        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "1. Интерфейс (меню, панель ввода)" : "1. Interface (menus, toolbar)"}</span>
            <select class="select-input" data-app-field="typography.uiFont">
              ${rv5FontSelectOptions(ty.uiFont || "system", "ui", systemFonts, isRu, false)}
            </select>
            ${ty.uiFont === "custom" ? customInput("uiFontCustom", ty.uiFontCustom) : ""}
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размер UI" : "UI Size"}</span><b class="num" data-live-app-val="typography.uiFontSize">${ty.uiFontSize >= 11 ? ty.uiFontSize + "px" : (isRu ? "Авто" : "Auto")}</b></div>
            <input type="range" class="range-input" min="10" max="20" step="1" data-app-field="typography.uiFontSize" value="${ty.uiFontSize >= 11 ? ty.uiFontSize : 10}"/>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "2. Твой текст (поле ввода)" : "2. Your Input Text"}</span>
            <select class="select-input" data-app-field="typography.inputFont">
              ${rv5FontSelectOptions(ty.inputFont || "inherit", "ui", systemFonts, isRu, true)}
            </select>
            ${ty.inputFont === "custom" ? customInput("inputFontCustom", ty.inputFontCustom) : ""}
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размер ввода" : "Input Size"}</span><b class="num" data-live-app-val="typography.inputFontSize">${ty.inputFontSize >= 12 ? ty.inputFontSize + "px" : (isRu ? "Как чат" : "Default")}</b></div>
            <input type="range" class="range-input" min="11" max="22" step="1" data-app-field="typography.inputFontSize" value="${ty.inputFontSize >= 12 ? ty.inputFontSize : 11}"/>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "3. Ответы агента" : "3. Agent Responses"}</span>
            <select class="select-input" data-app-field="typography.agentFont">
              ${rv5FontSelectOptions(ty.agentFont || "inherit", "ui", systemFonts, isRu, true)}
            </select>
            ${ty.agentFont === "custom" ? customInput("agentFontCustom", ty.agentFontCustom) : ""}
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размер агента" : "Agent Size"}</span><b class="num" data-live-app-val="typography.agentFontSize">${ty.agentFontSize >= 12 ? ty.agentFontSize + "px" : (isRu ? "Как чат" : "Default")}</b></div>
            <input type="range" class="range-input" min="11" max="22" step="1" data-app-field="typography.agentFontSize" value="${ty.agentFontSize >= 12 ? ty.agentFontSize : 11}"/>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "Мои сообщения (пузырь)" : "My Messages"}</span>
            <select class="select-input" data-app-field="typography.userMsgFont">
              ${rv5FontSelectOptions(ty.userMsgFont || "inherit", "ui", systemFonts, isRu, true)}
            </select>
            ${ty.userMsgFont === "custom" ? customInput("userMsgFontCustom", ty.userMsgFontCustom) : ""}
          </div>
          <div class="section-group">
            <span class="section-label">${isRu ? "Мысли агента" : "Agent Thoughts"}</span>
            <select class="select-input" data-app-field="typography.thinkingFont">
              ${rv5FontSelectOptions(ty.thinkingFont || "inherit", "ui", systemFonts, isRu, true)}
            </select>
            ${ty.thinkingFont === "custom" ? customInput("thinkingFontCustom", ty.thinkingFontCustom) : ""}
          </div>
        </div>

        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "4. Код и терминал" : "4. Code & Terminal"}</span>
            <select class="select-input" data-app-field="typography.monoFont">
              ${rv5FontSelectOptions(ty.monoFont || "system", "mono", systemFonts, isRu, false)}
            </select>
            ${ty.monoFont === "custom" ? customInput("monoFontCustom", ty.monoFontCustom) : ""}
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размер кода" : "Code Size"}</span><b class="num" data-live-app-val="typography.codeFontSize">${ty.codeFontSize >= 11 ? ty.codeFontSize + "px" : (isRu ? "Авто" : "Auto")}</b></div>
            <input type="range" class="range-input" min="10" max="20" step="1" data-app-field="typography.codeFontSize" value="${ty.codeFontSize >= 11 ? ty.codeFontSize : 10}"/>
          </div>
        </div>
      </div>
    </details>
  `;
}

/**
 * Block Border Clarity section (Airy / Crisp default / Contrast).
 */
function rv5RenderBorderPresetSectionHtml(draft, isRu) {
  const bp = draft && draft.borderPreset ? draft.borderPreset : "crisp";
  const presets = [
    { id: "airy", label: isRu ? "Воздушные" : "Airy" },
    { id: "crisp", label: isRu ? "Чёткие (рек.)" : "Crisp (default)" },
    { id: "contrast", label: isRu ? "Контрастные" : "Contrast" },
  ];
  return `
    <div class="section-group">
      <span class="section-label">${isRu ? "Чёткость границ и обводки блоков" : "Block Border Clarity & Outlines"}</span>
      <div class="subtab-bar is-segmented">
        ${presets.map((p) => `
          <button type="button" class="subtab-btn${bp === p.id ? " is-active" : ""}" data-action="set-border-preset" data-val="${p.id}">${rv5EscapeHtml(p.label)}</button>
        `).join("")}
      </div>
      <span class="row-desc">${isRu ? "Аккуратно отделяет сообщения, шаги агента, код и поле ввода для удобного чтения." : "Cleanly frames messages, steps, code blocks and composer for effortless scanning."}</span>
    </div>
  `;
}

/**
 * Element Constructor & Custom Renaming subtab (Picker + Zone Map + Overrides + Labels).
 */
function rv5RenderElementsBuilderHtml(ctx) {
  const { draft, customLabels, isRu, pickerActive, canUndo, canRedo, newLabelMatch, newLabelText } = ctx;
  const overrides = Array.isArray(draft && draft.elementOverrides) ? draft.elementOverrides : [];
  const labels = Array.isArray(customLabels) ? customLabels : [];
  const paused = Boolean(draft && draft.overridesPaused);

  return `
    <div class="section-group">
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Прицел и выделение области" : "Live Element & Region Picker"}</span>
            <span class="row-desc">${isRu ? "Клик — 1 элемент, протяжка рамкой — сразу несколько окон синхронно. Настройка положения, размеров, цветов, прозрачности и скрытия." : "Click 1 element or drag a box to edit multiple windows synchronously — position, size, colors, opacity and visibility."}</span>
          </div>
          <div style="display:flex;gap:5px;flex-shrink:0">
            <button type="button" class="btn btn-sm btn-primary" data-action="start-element-picker">${pickerActive ? (isRu ? "Стоп" : "Stop") : `${rv5UiIcon("crosshair", 12)}<span>${isRu ? "Выбрать" : "Pick"}</span>`}</button>
            <button type="button" class="btn btn-sm" data-action="start-region-picker" title="${isRu ? "Выделить область рамкой (сразу 2+ окна)" : "Drag region to select 2+ windows"}">▢ ${isRu ? "Область" : "Region"}</button>
            <button type="button" class="btn btn-sm" ${canUndo ? "" : "disabled"} data-action="undo-appearance" title="${isRu ? "Отменить" : "Undo"}">${rv5UiIcon("undo", 12)}</button>
            <button type="button" class="btn btn-sm" ${canRedo ? "" : "disabled"} data-action="redo-appearance" title="${isRu ? "Повторить" : "Redo"}">${rv5UiIcon("redo", 12)}</button>
          </div>
        </div>
        ${overrides.length > 0 ? `
          <div class="row-item">
            <span class="row-desc">${isRu ? "Временно отключить правки элементов (Ctrl+Alt+Shift+R)" : "Temporarily pause all element overrides"}</span>
            <button type="button" class="btn btn-sm${paused ? " btn-primary" : ""}" data-action="toggle-overrides-paused">${paused ? (isRu ? "Возобновить" : "Resume") : (isRu ? "Пауза" : "Pause")}</button>
          </div>
        ` : ""}
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "Быстрая настройка по зонам" : "Quick Edit by Zone"}</span>
      <div class="rx-zone-grid">
        ${RUDEX_UI_ZONES.map((z) => {
          const hasOv = overrides.some((o) => o.zone === z.id || o.selector === z.selector);
          return `
            <button type="button" class="rx-zone-btn${hasOv ? " is-active" : ""}" data-action="edit-ui-zone" data-zone-id="${rv5EscapeHtml(z.id)}">
              <span>${rv5EscapeHtml(isRu ? z.nameRu : z.nameEn)}</span>
              <span style="opacity:.55;font-size:11px">${hasOv ? "●" : "→"}</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>

    <div class="section-group">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="section-label">${isRu ? `Мои правки стилей (${overrides.length})` : `Style Overrides (${overrides.length})`}</span>
        ${overrides.length > 0 ? `<button type="button" class="btn btn-sm btn-ghost" data-action="clear-all-overrides">${isRu ? "Сбросить все" : "Clear all"}</button>` : ""}
      </div>
      ${overrides.length === 0
        ? `<div class="empty-msg">${isRu ? "Пока нет правок. Нажмите «Выбрать» или выберите любую зону выше." : "No overrides yet. Click Pick or select a zone above."}</div>`
        : `<div class="card">${overrides.map((ov) => `
            <div class="row-item">
              <div class="row-info" style="min-width:0">
                <span class="row-title">${rv5EscapeHtml(ov.name || ov.selector)}</span>
                <span class="row-desc" style="font-family:var(--rx-font-mono);font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rv5EscapeHtml(ov.selector)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
                <button type="button" class="btn btn-sm" data-action="toggle-override-item" data-id="${rv5EscapeHtml(ov.id)}" title="${ov.enabled !== false ? (isRu ? "Скрыть правку" : "Disable") : (isRu ? "Включить правку" : "Enable")}">${rv5UiIcon(ov.enabled !== false ? "eye" : "eyeOff", 12)}</button>
                <button type="button" class="btn btn-sm" data-action="edit-override-item" data-id="${rv5EscapeHtml(ov.id)}" title="${isRu ? "Редактировать" : "Edit"}">${rv5UiIcon("edit", 12)}</button>
                <button type="button" class="btn btn-sm" data-action="delete-override-item" data-id="${rv5EscapeHtml(ov.id)}" title="${isRu ? "Удалить" : "Delete"}">${rv5UiIcon("close", 12)}</button>
              </div>
            </div>
          `).join("")}</div>`
      }
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? `Переименование элементов (${labels.length})` : `Custom Element Labels (${labels.length})`}</span>
      <div class="card card-pad" style="display:flex;flex-direction:column;gap:8px">
        <div class="control-grid-2">
          <input type="text" class="text-input" data-role="newLabelMatch" value="${rv5EscapeHtml(newLabelMatch || "")}" placeholder="${isRu ? "Было (напр. Новый чат)" : "Original (e.g. New chat)"}"/>
          <input type="text" class="text-input" data-role="newLabelText" value="${rv5EscapeHtml(newLabelText || "")}" placeholder="${isRu ? "Станет (напр. Новая задача)" : "New label"}"/>
        </div>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm btn-primary" data-action="add-custom-label">${isRu ? "+ Переименовать" : "+ Add Rename"}</button>
        </div>
        ${labels.length > 0 ? labels.map((lb) => `
          <div class="row-item" style="padding:7px 0">
            <span class="row-title" style="font-size:12px"><b>${rv5EscapeHtml(lb.match)}</b> → ${rv5EscapeHtml(lb.label)}</span>
            <div style="display:flex;gap:4px">
              <button type="button" class="btn btn-sm" data-action="toggle-custom-label" data-id="${rv5EscapeHtml(lb.id)}" title="${lb.enabled !== false ? (isRu ? "Отключить" : "Disable") : (isRu ? "Включить" : "Enable")}">${rv5UiIcon(lb.enabled !== false ? "check" : "eyeOff", 12)}</button>
              <button type="button" class="btn btn-sm" data-action="delete-custom-label" data-id="${rv5EscapeHtml(lb.id)}" title="${isRu ? "Удалить" : "Delete"}">${rv5UiIcon("close", 12)}</button>
            </div>
          </div>
        `).join("") : ""}
      </div>
    </div>
  `;
}

/**
 * Floating Mini-Inspector Card when an element is selected in Live Picker or Zone Map.
 */
function rv5BuildElementInspectorHtml(sel, draft, customLabels, systemFonts, isRu, opts) {
  if (!sel || !sel.selector) return "";
  const drawerOpen = Boolean(opts && opts.drawerOpen);
  const ovs = Array.isArray(draft && draft.elementOverrides) ? draft.elementOverrides : [];
  const existing = ovs.find((o) => o.id === sel.overrideId || o.selector === sel.selector) || {
    id: sel.overrideId || ("ov-" + Date.now()),
    name: sel.name || sel.selector,
    selector: sel.selector,
    zone: sel.zone || "",
    scope: sel.scope || "exact",
    enabled: true,
    styles: {},
  };
  const st = existing.styles || {};
  const cmp = sel.computed && typeof sel.computed === "object" ? sel.computed : {};
  const existingLabel = sel.renameable && sel.origText
    ? (customLabels || []).find((l) => l.match.toLowerCase() === sel.origText.toLowerCase())
    : null;

  const isCustomNum = (prop, allowZero, allowNeg) => {
    let v = st[prop];
    if ((prop === "paddingY" || prop === "paddingX") && (v === "" || v === null || v === undefined || Number(v) < 0)) {
      v = st.padding;
    }
    if (v === "" || v === null || v === undefined) return false;
    const n = Number(v);
    if (!Number.isFinite(n)) return false;
    if (allowNeg) return n !== 0;
    return allowZero ? n >= 0 : n > 0;
  };
  const numSlider = (prop, label, unit, min, max, fallbackDef, allowZero, allowNeg, stepVal) => {
    const step = stepVal || 1;
    const isFloat = step < 1;
    const fmt = (n) => (isFloat ? Math.round(Number(n) * 100) / 100 : Math.round(Number(n)));
    const custom = isCustomNum(prop, allowZero, allowNeg);
    let rawCmp = cmp[prop];
    if ((prop === "paddingY" || prop === "paddingX") && !Number.isFinite(Number(rawCmp))) {
      rawCmp = cmp.padding;
    }
    const baseVal = Number.isFinite(Number(rawCmp)) ? fmt(rawCmp) : fallbackDef;
    let effectiveVal = st[prop];
    if ((prop === "paddingY" || prop === "paddingX") && (effectiveVal === "" || effectiveVal === null || effectiveVal === undefined || Number(effectiveVal) < 0)) {
      effectiveVal = st.padding;
    }
    const val = custom ? fmt(effectiveVal) : baseVal;
    const clampedRange = Math.max(min, Math.min(max, val));
    return `
      <div class="rx-insp-slider-item${custom ? " is-custom" : ""}" data-insp-wrap="${prop}">
        <div class="rx-insp-slider-head">
          <span>${rv5EscapeHtml(label)}</span>
          <div style="display:flex;align-items:center;gap:4px">
            <span class="rx-insp-hex" data-insp-badge="${prop}">${custom ? (isRu ? "изменено" : "custom") : (isRu ? `сейчас ${baseVal}${unit}` : `now ${baseVal}${unit}`)}</span>
            ${custom ? `<button type="button" class="btn btn-sm btn-ghost rx-insp-reset-btn" data-action="inspector-clear-style" data-prop="${prop}" title="${isRu ? "Сбросить по умолчанию" : "Reset to default"}">↺</button>` : ""}
          </div>
        </div>
        <div class="rx-insp-slider-row">
          <input type="range" class="range-input" min="${min}" max="${max}" step="${step}" data-insp-range="${prop}" value="${clampedRange}"/>
          <input type="number" class="text-input rx-insp-num" min="${min}" max="${max}" step="${step}" data-insp-num="${prop}" value="${val}"/>
          <span class="rx-insp-unit">${unit}</span>
        </div>
      </div>
    `;
  };

  const curColor = st.color || cmp.color || "#faf9f5";
  const curBg = st.bgColor || cmp.bgColor || "#262624";
  const curBorder = st.borderColor || cmp.borderColor || "#d97757";
  const hasCustomBgOp = st.bgOpacity === 0 || (Number.isFinite(Number(st.bgOpacity)) && Number(st.bgOpacity) < 100);
  const curBgOp = (st.bgColor || hasCustomBgOp) && Number.isFinite(Number(st.bgOpacity))
    ? Math.round(Number(st.bgOpacity))
    : (Number.isFinite(Number(cmp.bgOpacity)) ? Math.round(Number(cmp.bgOpacity)) : 100);
  const hasAnyOverride = ovs.some((o) => o.id === existing.id || o.selector === sel.selector) || Boolean(existingLabel);
  const groupTargets = Array.isArray(sel.groupTargets) ? sel.groupTargets : [];
  const isGroup = groupTargets.length >= 2;
  const matchCount = Number.isFinite(Number(sel.matchCount)) && Number(sel.matchCount) > 0 ? Math.round(Number(sel.matchCount)) : (isGroup ? groupTargets.length : 1);
  const canParent = !isGroup && Boolean(sel.canSelectParent);
  const canChild = !isGroup && Boolean(sel.canSelectChild);
  const nudgeStep = [1, 4, 16, 40].includes(Number(opts && opts.nudgeStep)) ? Number(opts.nudgeStep) : 4;
  const dragMoveActive = Boolean(opts && opts.dragMoveActive);
  const curAlign = st.align === "left" || st.align === "center" || st.align === "right" ? st.align : "";
  const warnMultiExact = !isGroup && sel.scope === "exact" && matchCount > 1;
  const matchBadgeText = isGroup
    ? (isRu ? `Синхронно: ${groupTargets.length}` : `Sync: ${groupTargets.length}`)
    : (isRu ? `${matchCount} эл.` : `${matchCount} match${matchCount === 1 ? "" : "es"}`);

  return `
    <div class="rx-inspector-card${drawerOpen ? " is-drawer-open" : ""}" data-role="elementInspectorCard"${drawerOpen ? ' data-inspector-drawer-open="1"' : ""}>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="min-width:0">
          <div style="display:flex;align-items:center;gap:6px;min-width:0">
            <div style="font-weight:650;font-size:13px;color:var(--rx-fg-strong);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rv5EscapeHtml(existing.name || sel.name)}</div>
            <span class="rx-insp-match-badge${warnMultiExact ? " is-warn" : ""}" data-role="inspectorMatchBadge">${rv5EscapeHtml(matchBadgeText)}</span>
          </div>
          <div style="font-size:10.5px;color:var(--rx-muted);font-family:var(--rx-font-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${rv5EscapeHtml(sel.selector)}">${rv5EscapeHtml(sel.selector)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:3px;flex-shrink:0">
          <button type="button" class="btn btn-sm btn-ghost rx-insp-tree-btn" data-action="inspector-select-parent"${canParent ? "" : " disabled"} title="${isRu ? "Родительский блок (шире)" : "Select parent block"}">↑</button>
          <button type="button" class="btn btn-sm btn-ghost rx-insp-tree-btn" data-action="inspector-select-child"${canChild ? "" : " disabled"} title="${isRu ? "Вложенный элемент (уже)" : "Return to child element"}">↓</button>
          <button type="button" class="btn btn-sm btn-ghost rx-insp-tree-btn" data-action="inspector-add-element" title="${isRu ? "Добавить ещё элемент (синхронная настройка)" : "Add element to sync group"}">+</button>
          <button type="button" class="btn btn-sm btn-ghost rx-insp-tree-btn" data-action="start-region-picker" title="${isRu ? "Выделить область рамкой (2+ окна сразу)" : "Drag region to select multiple windows"}">▢</button>
          <button type="button" class="btn btn-sm btn-ghost" data-action="start-element-picker" title="${isRu ? "Выбрать другой элемент" : "Pick another element"}">${rv5UiIcon("crosshair", 12)}</button>
          <button type="button" class="icon-btn" data-action="close-element-inspector" title="${isRu ? "Закрыть" : "Close"}">${rv5UiIcon("close", 13)}</button>
        </div>
      </div>

      ${isGroup ? `
        <div class="rx-insp-group-bar" data-role="inspectorGroupBar">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
            <span class="rx-insp-sec-title" style="margin:0">${isRu ? "Выбранная область (синхронно)" : "Selected group (synced)"}</span>
            <button type="button" class="btn btn-sm btn-ghost rx-insp-reset-btn" data-action="inspector-add-element">+ ${isRu ? "Добавить" : "Add"}</button>
          </div>
          <div class="rx-insp-group-chips">
            ${groupTargets.map((gt, gi) => `
              <span class="rx-insp-chip" title="${rv5EscapeHtml(gt.selector || "")}">
                <span class="rx-insp-chip-lbl">${gi + 1}. ${rv5EscapeHtml(gt.name || gt.selector || "")}</span>
                <button type="button" class="rx-insp-chip-x" data-action="inspector-remove-group-target" data-idx="${gi}" title="${isRu ? "Убрать из группы" : "Remove from group"}">×</button>
              </span>
            `).join("")}
          </div>
        </div>
      ` : ""}

      ${!isGroup && sel.canToggleScope ? `
        <div class="subtab-bar is-segmented">
          <button type="button" class="subtab-btn${sel.scope !== "similar" ? " is-active" : ""}" data-action="inspector-set-scope" data-val="exact">${isRu ? "Этот элемент" : "This element"}</button>
          <button type="button" class="subtab-btn${sel.scope === "similar" ? " is-active" : ""}" data-action="inspector-set-scope" data-val="similar">${isRu ? "Все похожие" : "All similar"}</button>
        </div>
      ` : ""}

      ${sel.renameable && sel.origText ? `
        <div class="section-group">
          <span class="section-label">${isRu ? "Переименовать" : "Rename Label"}</span>
          <div style="display:flex;gap:6px">
            <input type="text" class="text-input" data-role="inspectorRenameInput" value="${rv5EscapeHtml(existingLabel ? existingLabel.label : (sel.currentText || sel.origText))}" placeholder="${rv5EscapeHtml(sel.origText)}"/>
            <button type="button" class="btn btn-sm btn-primary" data-action="inspector-save-rename">${isRu ? "Ок" : "Set"}</button>
            ${existingLabel ? `<button type="button" class="btn btn-sm btn-ghost" data-action="inspector-clear-rename" title="${isRu ? "Вернуть исходное название" : "Restore original label"}">↺</button>` : ""}
          </div>
        </div>
      ` : ""}

      <span class="rx-insp-sec-title">${isRu ? "Типографика и форма" : "Typography & Shape"}</span>
      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span class="section-label">${isRu ? "Шрифт" : "Font"}</span>
          ${st.fontFamily ? `<button type="button" class="btn btn-sm btn-ghost rx-insp-reset-btn" data-action="inspector-clear-style" data-prop="fontFamily">↺</button>` : ""}
        </div>
        <select class="select-input" data-insp-style="fontFamily">
          <option value="">${isRu ? "По умолчанию (из темы)" : "Default (from theme)"}</option>
          ${rv5FontSelectOptions(st.fontFamily || "", "ui", systemFonts, isRu, false)}
        </select>
        ${st.fontFamily === "custom" ? `<input type="text" class="text-input" list="rudex-sys-fonts-list" data-insp-style="fontFamilyCustom" data-insp-live-text="1" value="${rv5EscapeHtml(st.fontFamilyCustom || "")}" placeholder="${isRu ? "Имя системного шрифта…" : "System font name…"}"/>` : ""}
      </div>

      <div class="rx-insp-slider-grid">
        ${numSlider("fontSize", isRu ? "Размер шрифта" : "Font Size", "px", 8, 48, 14, false)}
        ${numSlider("fontWeight", isRu ? "Жирность" : "Font Weight", "", 300, 900, 400, false, false, 100)}
        ${numSlider("lineHeight", isRu ? "Межстрочный" : "Line Height", "", 1.0, 2.2, 1.45, false, false, 0.05)}
        ${numSlider("borderRadius", isRu ? "Скругление" : "Radius", "px", 0, 48, 8, true)}
        ${numSlider("paddingY", isRu ? "Отступ ↕" : "Padding Y", "px", 0, 64, 8, true)}
        ${numSlider("paddingX", isRu ? "Отступ ↔" : "Padding X", "px", 0, 64, 8, true)}
      </div>
      ${numSlider("borderWidth", isRu ? "Рамка" : "Border", "px", 0, 6, 1, true)}

      <span class="rx-insp-sec-title">${isRu ? "Цвета и прозрачность" : "Colors & Opacity"}</span>
      <div class="control-grid-2">
        <div class="color-box">
          <span>${isRu ? "Текст" : "Text"}</span>
          <div class="rx-color-row">
            <input type="color" class="color-input" data-insp-style="color" value="${rv5EscapeHtml(curColor)}"/>
            <input type="text" class="text-input rx-insp-hex-input" data-insp-hex-input="color" value="${rv5EscapeHtml(curColor)}" placeholder="#rrggbb" maxlength="9" spellcheck="false" autocomplete="off"/>
            ${st.color ? `<button type="button" class="btn btn-sm btn-ghost rx-insp-reset-btn" data-action="inspector-clear-style" data-prop="color" title="${isRu ? "Сбросить цвет" : "Reset color"}">↺</button>` : ""}
          </div>
        </div>
        <div class="color-box">
          <span>${isRu ? "Фон" : "Background"}</span>
          <div class="rx-color-row">
            <input type="color" class="color-input" data-insp-style="bgColor" value="${rv5EscapeHtml(curBg)}"/>
            <input type="text" class="text-input rx-insp-hex-input" data-insp-hex-input="bgColor" value="${rv5EscapeHtml(curBg)}" placeholder="#rrggbb" maxlength="9" spellcheck="false" autocomplete="off"/>
            ${st.bgColor ? `<button type="button" class="btn btn-sm btn-ghost rx-insp-reset-btn" data-action="inspector-clear-style" data-prop="bgColor" title="${isRu ? "Сбросить фон" : "Reset bg"}">↺</button>` : ""}
          </div>
        </div>
      </div>

      <div class="color-box">
        <span>${isRu ? "Цвет рамки" : "Border Color"}</span>
        <div class="rx-color-row">
          <input type="color" class="color-input" data-insp-style="borderColor" value="${rv5EscapeHtml(curBorder)}"/>
          <input type="text" class="text-input rx-insp-hex-input" data-insp-hex-input="borderColor" value="${rv5EscapeHtml(curBorder)}" placeholder="#rrggbb" maxlength="9" spellcheck="false" autocomplete="off"/>
          ${st.borderColor ? `<button type="button" class="btn btn-sm btn-ghost rx-insp-reset-btn" data-action="inspector-clear-style" data-prop="borderColor" title="${isRu ? "Сбросить цвет рамки" : "Reset border color"}">↺</button>` : ""}
        </div>
      </div>

      <div class="rx-insp-slider-item${st.bgColor || hasCustomBgOp ? " is-custom" : ""}" data-insp-wrap="bgOpacity">
        <div class="rx-insp-slider-head">
          <span>${isRu ? "Прозрачность фона (без иконок)" : "Background Opacity (keep icons)"}</span>
          <span class="rx-insp-hex" data-insp-badge="bgOpacity">${curBgOp}%</span>
        </div>
        <div class="rx-insp-slider-row">
          <input type="range" class="range-input" min="0" max="100" step="1" data-insp-range="bgOpacity" value="${curBgOp}"/>
          <input type="number" class="text-input rx-insp-num" min="0" max="100" step="1" data-insp-num="bgOpacity" value="${curBgOp}"/>
          <span class="rx-insp-unit">%</span>
        </div>
      </div>

      <span class="rx-insp-sec-title">${isRu ? "Расположение (вверх / вниз / влево / вправо)" : "Position (Up / Down / Left / Right)"}</span>
      <div class="rx-insp-pos-box" data-role="inspectorPositionBox">
        <div class="rx-insp-pos-top">
          <div class="rx-insp-dpad" aria-label="${isRu ? "Сдвиг элемента" : "Move element"}">
            <span></span>
            <button type="button" class="rx-insp-dpad-btn" data-action="inspector-nudge-offset" data-axis="offsetY" data-delta="${-nudgeStep}" title="${isRu ? `Поднять вверх на ${nudgeStep}px` : `Move up ${nudgeStep}px`}">↑</button>
            <span></span>
            <button type="button" class="rx-insp-dpad-btn" data-action="inspector-nudge-offset" data-axis="offsetX" data-delta="${-nudgeStep}" title="${isRu ? `Сдвинуть влево на ${nudgeStep}px` : `Move left ${nudgeStep}px`}">←</button>
            <button type="button" class="rx-insp-dpad-btn is-zero" data-action="inspector-nudge-offset" data-axis="reset" data-delta="0" title="${isRu ? "Вернуть на место (0, 0)" : "Reset position (0, 0)"}">0</button>
            <button type="button" class="rx-insp-dpad-btn" data-action="inspector-nudge-offset" data-axis="offsetX" data-delta="${nudgeStep}" title="${isRu ? `Сдвинуть вправо на ${nudgeStep}px` : `Move right ${nudgeStep}px`}">→</button>
            <span></span>
            <button type="button" class="rx-insp-dpad-btn" data-action="inspector-nudge-offset" data-axis="offsetY" data-delta="${nudgeStep}" title="${isRu ? `Опустить вниз на ${nudgeStep}px` : `Move down ${nudgeStep}px`}">↓</button>
            <span></span>
          </div>
          <div class="rx-insp-pos-meta">
            <span style="font-size:10.5px;color:var(--rx-muted)">${isRu ? "Шаг сдвига:" : "Move step:"}</span>
            <div class="rx-insp-step-pills">
              ${[1, 4, 16, 40].map((sp) => `<button type="button" class="rx-insp-step-pill${nudgeStep === sp ? " is-active" : ""}" data-action="inspector-set-nudge-step" data-val="${sp}">${sp}px</button>`).join("")}
            </div>
            <button type="button" class="btn btn-sm rx-insp-drag-btn${dragMoveActive ? " is-active" : ""}" data-action="inspector-toggle-drag-move">${dragMoveActive ? (isRu ? "Перетаскивание активно (Esc — стоп)" : "Dragging active (Esc to stop)") : (isRu ? "Двигать мышкой на экране" : "Drag on screen")}</button>
          </div>
        </div>
        <div class="rx-insp-slider-grid">
          ${numSlider("offsetX", isRu ? "Влево / Вправо (X)" : "Left / Right (X)", "px", -800, 800, 0, true, true)}
          ${numSlider("offsetY", isRu ? "Вверх / Вниз (Y)" : "Up / Down (Y)", "px", -800, 800, 0, true, true)}
        </div>
        <div class="subtab-bar is-segmented" data-role="inspectorAlignBar">
          <button type="button" class="subtab-btn${!curAlign ? " is-active" : ""}" data-action="inspector-set-align" data-val="">${isRu ? "Авто" : "Auto"}</button>
          <button type="button" class="subtab-btn${curAlign === "left" ? " is-active" : ""}" data-action="inspector-set-align" data-val="left">${isRu ? "Слева" : "Left"}</button>
          <button type="button" class="subtab-btn${curAlign === "center" ? " is-active" : ""}" data-action="inspector-set-align" data-val="center">${isRu ? "Центр" : "Center"}</button>
          <button type="button" class="subtab-btn${curAlign === "right" ? " is-active" : ""}" data-action="inspector-set-align" data-val="right">${isRu ? "Справа" : "Right"}</button>
        </div>
      </div>

      <span class="rx-insp-sec-title">${isRu ? "Размеры и видимость" : "Dimensions & Visibility"}</span>
      <div class="rx-insp-slider-grid">
        ${numSlider("width", isRu ? "Ширина" : "Width", "px", 24, 1600, 320, false)}
        ${numSlider("minHeight", isRu ? "Мин. высота" : "Min Height", "px", 16, 600, 36, false)}
      </div>
      ${numSlider("opacity", isRu ? "Непрозрачность (весь элемент)" : "Element Opacity (all)", "%", 0, 100, 100, true)}

      <div class="card">
        <div class="row-item">
          <span class="row-title">${isRu ? "Скрыть элемент" : "Hide element"}</span>
          <button type="button" class="switch${st.hidden ? " is-on" : ""}" role="switch" aria-checked="${st.hidden ? "true" : "false"}" data-action="inspector-toggle-hidden"><span class="switch-thumb"></span></button>
        </div>
      </div>

      <div class="rx-insp-footer">
        <button type="button" class="btn btn-sm${hasAnyOverride ? " btn-danger" : ""}" data-action="inspector-reset-element">↺ ${isRu ? "Сбросить по умолчанию" : "Reset to Default"}</button>
        <button type="button" class="btn btn-sm btn-primary" data-action="close-element-inspector">${isRu ? "Готово" : "Done"}</button>
      </div>
    </div>
  `;
}

/**
 * Tab 1: Clean Agent Hub — Simple Auto-by-default Toggles + New-Chat Default + Inline Live Edits + Persona.
 */
function rv5RenderAgentHubTabHtml(ctx) {
  const { agentProfile, defaultProfile, customPresets, liveEditInline, personaHtml, isRu, newAgentPresetName, agentSubTab, chatBadgeLabel } = ctx;
  const ap = rv5NormalizeAgentProfile(agentProfile);
  const le = Object.assign({}, RUDEX_LIVE_EDIT_DEFAULTS, liveEditInline || {});
  const isDefaultForNew = Boolean(defaultProfile && defaultProfile.applyToNewChats && defaultProfile.enabled);
  const activeCount = ap.enabled ? rv5CountActiveAgentFeatures(ap) : 0;
  const sub = agentSubTab || "all";

  const seg = (field, cur, items) => `
    <div class="subtab-bar is-segmented" style="max-width:260px;flex-shrink:0">
      ${items.map((it) => `
        <button type="button" class="subtab-btn${(ap.enabled ? cur : "auto") === it.id ? " is-active" : ""}" data-action="set-agent-field" data-field="${field}" data-val="${it.id}">${rv5EscapeHtml(it.label)}</button>
      `).join("")}
    </div>
  `;

  const scopeBanner = chatBadgeLabel ? `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 11px;border-radius:8px;background:var(--rx-surface);border:1px solid var(--rx-border)">
      <span class="status-chip" data-live="chatBadge" style="min-width:0;overflow:hidden;text-overflow:ellipsis">${rv5EscapeHtml(chatBadgeLabel)}</span>
      ${activeCount > 0
        ? `<button type="button" class="btn btn-sm btn-ghost" data-action="reset-agent-auto">${isRu ? `Сбросить (${activeCount})` : `Reset (${activeCount})`}</button>`
        : `<span class="nav-badge">${isRu ? "Режим: Авто" : "Mode: Auto"}</span>`}
    </div>
  ` : "";

  const toolsSectionHtml = `
    ${scopeBanner}
    <div class="section-group">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="section-label">${isRu ? "Тумблеры инструментов агента (по умолчанию — Авто)" : "Agent Tool Toggles (Auto by default)"}</span>
        ${!chatBadgeLabel ? (activeCount > 0 ? `<button type="button" class="btn btn-sm btn-ghost" data-action="reset-agent-auto">${isRu ? "Сбросить в Авто" : "Reset to Auto"}</button>` : `<span class="nav-badge">${isRu ? "Агент решает сам" : "Auto"}</span>`) : ""}
      </div>
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Субагенты" : "Subagents"}</span>
            <span class="row-desc">${isRu ? "Параллельный поиск и делегирование подзадач" : "Parallel search & subtask delegation"}</span>
          </div>
          ${seg("subagents", ap.subagents, [
            { id: "off", label: isRu ? "Выкл" : "Off" },
            { id: "auto", label: isRu ? "Авто" : "Auto" },
            { id: "parallel", label: isRu ? "Вкл" : "On" },
          ])}
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Веб-поиск" : "Web Search"}</span>
            <span class="row-desc">${isRu ? "Проверка свежей документации и фактов в сети" : "Verify fresh docs & facts online"}</span>
          </div>
          ${seg("webSearch", ap.webSearch, [
            { id: "off", label: isRu ? "Выкл" : "Off" },
            { id: "auto", label: isRu ? "Авто" : "Auto" },
            { id: "always", label: isRu ? "Вкл" : "On" },
          ])}
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Браузер и проверка UI" : "Browser & UI Check"}</span>
            <span class="row-desc">${isRu ? "Открывать и проверять интерфейс в браузере" : "Open and visually inspect UI in browser"}</span>
          </div>
          ${seg("browser", ap.browser, [
            { id: "off", label: isRu ? "Выкл" : "Off" },
            { id: "auto", label: isRu ? "Авто" : "Auto" },
            { id: "verify", label: isRu ? "Вкл" : "On" },
          ])}
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "План перед правками" : "Plan First"}</span>
            <span class="row-desc">${isRu ? "Составлять чеклист шагов перед изменениями" : "Build a step checklist before editing"}</span>
          </div>
          ${seg("planFirst", ap.planFirst, [
            { id: "skip", label: isRu ? "Выкл" : "Off" },
            { id: "auto", label: isRu ? "Авто" : "Auto" },
            { id: "strict", label: isRu ? "Вкл" : "On" },
          ])}
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Автопроверка тестами и сборкой" : "Auto-verify with tests & build"}</span>
            <span class="row-desc">${isRu ? "Прогонять проверки после правок автоматически" : "Run checks automatically after changes"}</span>
          </div>
          <button type="button" class="switch${ap.enabled && ap.autoVerify ? " is-on" : ""}" role="switch" data-action="toggle-agent-bool" data-field="autoVerify"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Режим «До конца»" : "Finish Thoroughly"}</span>
            <span class="row-desc">${isRu ? "Доводить задачу до результата без лишних пауз" : "Complete tasks end-to-end with fewer pauses"}</span>
          </div>
          <button type="button" class="switch${ap.enabled && ap.deepMode ? " is-on" : ""}" role="switch" data-action="toggle-agent-bool" data-field="deepMode"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Только чтение (без правок файлов)" : "Read-Only (no file edits)"}</span>
            <span class="row-desc">${isRu ? "Агент анализирует и предлагает решения, не трогая код" : "Analyze and advise without editing files"}</span>
          </div>
          <button type="button" class="switch${ap.enabled && ap.safetyMode === "readonly" ? " is-on" : ""}" role="switch" data-action="quick-toggle-agent" data-key="readonly"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Применять по умолчанию в новых чатах" : "Use as default for new chats"}</span>
            <span class="row-desc">${isRu ? "Новые чаты стартуют с этими тумблерами сразу" : "New chats inherit these toggles automatically"}</span>
          </div>
          <button type="button" class="switch${isDefaultForNew ? " is-on" : ""}" role="switch" aria-checked="${isDefaultForNew ? "true" : "false"}" data-action="toggle-agent-default-new"><span class="switch-thumb"></span></button>
        </div>
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "Правки на лету и отображение в чате" : "Live Mid-Turn Edits & Chat Display"}</span>
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Отправлять правки прямо из поля ввода без остановки" : "Send edits inline while agent is running"}</span>
            <span class="row-desc">${isRu ? "Печатай правку в обычный чат во время генерации — агент учтёт её на следующем шаге." : "Type into the normal composer while generating — delivered without interrupting."}</span>
          </div>
          <button type="button" class="switch${le.enabled ? " is-on" : ""}" role="switch" data-action="toggle-live-inline" data-field="enabled"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Показывать дополнения красиво прямо в ленте чата" : "Show live edits inside chat timeline"}</span>
            <span class="row-desc">${isRu ? "Отправленная на лету правка появляется как сообщение в чате со статусом доставки («В очереди» → «Учтено»)." : "Renders mid-turn edits neatly inside the chat feed with live delivery status."}</span>
          </div>
          <button type="button" class="switch${le.showInChat !== false ? " is-on" : ""}" role="switch" data-action="toggle-live-inline" data-field="showInChat"><span class="switch-thumb"></span></button>
        </div>
        ${le.showInChat !== false ? `
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${isRu ? "Стиль дополнений в чате" : "Chat bubble style"}</span>
            </div>
            <div class="subtab-bar is-segmented" style="max-width:270px;flex-shrink:0">
              ${[
                { id: "native", label: isRu ? "Как сообщение" : "Native" },
                { id: "accent", label: isRu ? "С акцентом" : "Accent" },
                { id: "subtle", label: isRu ? "Компактно" : "Subtle" },
              ].map((st) => `
                <button type="button" class="subtab-btn${(le.chatBubbleStyle || "native") === st.id ? " is-active" : ""}" data-action="set-live-inline-field" data-field="chatBubbleStyle" data-val="${st.id}">${rv5EscapeHtml(st.label)}</button>
              `).join("")}
            </div>
          </div>
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${isRu ? "Где показывать дополнение" : "Bubble placement"}</span>
            </div>
            <div class="subtab-bar is-segmented" style="max-width:270px;flex-shrink:0">
              ${[
                { id: "after-user", label: isRu ? "Рядом с моим сообщ." : "By my message" },
                { id: "after-agent", label: isRu ? "Под ответом агента" : "After reply" },
              ].map((pos) => `
                <button type="button" class="subtab-btn${(le.chatBubblePos || "after-user") === pos.id ? " is-active" : ""}" data-action="set-live-inline-field" data-field="chatBubblePos" data-val="${pos.id}">${rv5EscapeHtml(pos.label)}</button>
              `).join("")}
            </div>
          </div>
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${isRu ? "Подпись «Учтено агентом»" : "Show \"Applied by agent\" label"}</span>
              <span class="row-desc">${isRu ? "Показывать зелёный статус доставки под отправленным дополнением в чате." : "Show the green delivery label under applied live edits in chat."}</span>
            </div>
            <button type="button" class="switch${le.showDeliveredBadge !== false ? " is-on" : ""}" role="switch" data-action="toggle-live-inline" data-field="showDeliveredBadge"><span class="switch-thumb"></span></button>
          </div>
        ` : ""}
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Показывать мини-полоску очереди над полем ввода" : "Show compact queue strip above composer"}</span>
            <span class="row-desc">${isRu ? "Дополнительная строчка над вводом (по умолчанию выключена, если правки видны в чате)." : "Optional compact bar above input (off by default when shown in chat)."}</span>
          </div>
          <button type="button" class="switch${le.showQueueStrip ? " is-on" : ""}" role="switch" data-action="toggle-live-inline" data-field="showQueueStrip"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Отправка правки во время генерации" : "Inline live-edit trigger"}</span>
            <span class="row-desc">${isRu ? "Без лишних кнопок — просто отправьте сообщение из обычного поля ввода." : "No extra buttons — just submit normally from the chat composer."}</span>
          </div>
          <select class="select-input" style="width:auto" data-live-inline-field="sendKey">
            <option value="enter"${le.sendKey !== "ctrl+enter" ? " selected" : ""}>${isRu ? "Enter и кнопка отправки" : "Enter & Send button"}</option>
            <option value="ctrl+enter"${le.sendKey === "ctrl+enter" ? " selected" : ""}>Ctrl + Enter</option>
          </select>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Показывать кнопку «Инструменты» над полем ввода" : "Show «Tools» button above chat composer"}</span>
            <span class="row-desc">${isRu ? "Компактная кнопка тумблеров прямо над полем ввода (можно скрыть в любой момент)" : "Compact tool toggles chip right above input (hide anytime)"}</span>
          </div>
          <button type="button" class="switch${le.showChatDock !== false ? " is-on" : ""}" role="switch" data-action="toggle-live-inline" data-field="showChatDock"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Контекстное окно модели в чате" : "Show model context window in chat"}</span>
            <span class="row-desc">${isRu ? "Показывает над вводом, какой объём контекстного окна выбранной модели занят этим чатом (по умолч. выкл.)" : "Shows above composer how much of the selected model's context window this chat occupies (off by default)"}</span>
          </div>
          <button type="button" class="switch${le.showContextMeter === true ? " is-on" : ""}" role="switch" data-action="toggle-live-inline" data-field="showContextMeter"><span class="switch-thumb"></span></button>
        </div>
      </div>
    </div>
  `;

  const presetsSectionHtml = `
    <div class="section-group">
      <span class="section-label">${isRu ? "Готовые и сохранённые пресеты тумблеров" : "Built-in & Custom Toggle Presets"}</span>
      <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px">
        <div class="rx-preset-strip">
          ${RUDEX_AGENT_PRESETS.map((p) => {
            const sel = (ap.enabled ? ap.presetId : "default") === p.id;
            return `<button type="button" class="rx-preset-chip${sel ? " is-selected" : ""}" data-action="apply-agent-preset" data-id="${rv5EscapeHtml(p.id)}" title="${rv5EscapeHtml(isRu ? p.descRu : p.descEn)}">${p.iconKey ? rv5UiIcon(p.iconKey, 12) : ""}<span>${rv5EscapeHtml(isRu ? p.nameRu : p.nameEn)}</span></button>`;
          }).join("")}
          ${(customPresets || []).map((cp) => {
            const sel = ap.enabled && ap.presetId === cp.id;
            return `<span class="rx-preset-chip${sel ? " is-selected" : ""}" role="button" tabindex="0" data-action="apply-custom-agent-preset" data-id="${rv5EscapeHtml(cp.id)}"><span>${rv5EscapeHtml(cp.name)}</span><button type="button" class="preset-del-btn" data-action="delete-custom-agent-preset" data-id="${rv5EscapeHtml(cp.id)}">${rv5UiIcon("close", 10)}</button></span>`;
          }).join("")}
        </div>
        <div class="preset-add-row">
          <input type="text" class="text-input" data-role="newAgentPresetName" value="${rv5EscapeHtml(newAgentPresetName || "")}" placeholder="${isRu ? "Название своего пресета…" : "Save current toggles as…"}"/>
          <button type="button" class="btn btn-sm btn-primary" data-action="save-custom-agent-preset">${isRu ? "+ Сохранить" : "+ Save"}</button>
        </div>
      </div>
    </div>
  `;

  const personaSectionHtml = `
    <div class="section-group">
      <span class="section-label">${isRu ? "Подробность ответов" : "Response Length"}</span>
      <div class="subtab-bar is-segmented">
        ${[
          { id: "short", label: isRu ? "Кратко" : "Short" },
          { id: "balanced", label: isRu ? "Баланс" : "Balanced" },
          { id: "detailed", label: isRu ? "Подробно" : "Detailed" },
        ].map((it) => `
          <button type="button" class="subtab-btn${(ap.enabled ? ap.conciseness : "balanced") === it.id ? " is-active" : ""}" data-action="set-agent-field" data-field="conciseness" data-val="${it.id}">${rv5EscapeHtml(it.label)}</button>
        `).join("")}
      </div>
    </div>
    <div class="section-group">
      <span class="section-label">${isRu ? "Приоритетные скиллы (через запятую, Enter — сохранить)" : "Pinned Skills (comma-separated, press Enter to save)"}</span>
      <input type="text" class="text-input" data-agent-list="pinnedSkills" value="${rv5EscapeHtml((ap.pinnedSkills || []).join(", "))}" placeholder="rudex, chrome-devtools, ..."/>
    </div>
    <div style="border-top:1px solid var(--rx-border);padding-top:10px">
      ${personaHtml || ""}
    </div>
  `;

  if (sub === "tools") return toolsSectionHtml;
  if (sub === "persona") return personaSectionHtml;
  if (sub === "presets") return presetsSectionHtml;

  return `
    ${toolsSectionHtml}
    <details class="rx-details" data-disc="agentPresets">
      <summary>${isRu ? "Сохранённые пресеты тумблеров" : "Saved Toggle Presets"}</summary>
      <div class="rx-details-body">${presetsSectionHtml}</div>
    </details>
    <details class="rx-details" data-disc="agentPersona">
      <summary>${isRu ? "Характер чата, краткость и скиллы" : "Chat Persona, Length & Skills"}</summary>
      <div class="rx-details-body">${personaSectionHtml}</div>
    </details>
  `;
}

/**
 * Tab 3: Limits & Screen Hub (Live Preview + Standalone "Only Limits" widget + Monitor/Export).
 */
function rv5RenderLimitsTabHtml(ctx) {
  const { limitsWidget, quotaSummary, quotaAutomation, quotaAlerts, activeChatKey, activeChatTitle, activeModelName, systemFonts, monitorHtml, exportHtml, isRu, isLight } = ctx;
  const lw = rv5NormalizeLimitsWidget(limitsWidget);
  const qa = typeof rv5NormalizeQuotaAutomation === "function"
    ? rv5NormalizeQuotaAutomation(quotaAutomation)
    : Object.assign({ notifyOnReset: true, notifyWhenClosed: false, notifySound: true, autoContinueEnabled: false, autoContinueScope: "all", autoContinueChatKeys: [], autoContinueCurrentKey: "", autoContinuePrompt: "", autoContinueRetryFirst: true }, quotaAutomation || {});
  const waitingMap = (quotaAlerts && quotaAlerts.waitingChats && typeof quotaAlerts.waitingChats === "object") ? quotaAlerts.waitingChats : {};
  const waitingList = Object.values(waitingMap).filter(Boolean);
  const curKey = typeof activeChatKey === "string" && activeChatKey && activeChatKey !== "__new__" ? activeChatKey : "";
  const curTitle = String(activeChatTitle || "").trim() || (isRu ? "Текущий чат" : "Current chat");
  const curIsArmed = Boolean(curKey && waitingMap[curKey]);
  const selectedSet = new Set(qa.autoContinueChatKeys || []);
  const knownChats = [];
  const seenChatKeys = new Set();
  if (curKey) {
    seenChatKeys.add(curKey);
    knownChats.push({ chatKey: curKey, title: curTitle, isCurrent: true });
  }
  const qRows = (quotaSummary && Array.isArray(quotaSummary.chats)) ? quotaSummary.chats : [];
  for (let i = 0; i < qRows.length && knownChats.length < 14; i += 1) {
    const r = qRows[i];
    if (!r || !r.chatKey || seenChatKeys.has(r.chatKey)) continue;
    seenChatKeys.add(r.chatKey);
    knownChats.push({ chatKey: r.chatKey, title: r.title || r.chatKey.slice(0, 12), isCurrent: false });
  }
  for (let i = 0; i < (qa.autoContinueChatKeys || []).length; i += 1) {
    const k = qa.autoContinueChatKeys[i];
    if (!k || seenChatKeys.has(k)) continue;
    seenChatKeys.add(k);
    knownChats.push({ chatKey: k, title: k.slice(0, 14), isCurrent: false });
  }
  const defaultContinuePrompt = isRu
    ? "Лимиты восстановились. Продолжи выполнение незавершённой задачи с того места, на котором остановился."
    : "Limits have been restored. Please continue completing the unfinished task from where you left off.";
  const isDockedUi = Boolean(lw.pinned && lw.position !== "floating");
  const layouts = [
    { id: "pill", label: isRu ? "Пилюля" : "Pill" },
    { id: "bars", label: isRu ? "Полоски" : "Bars" },
    { id: "card", label: isRu ? "Карточка" : "Card" },
    { id: "inline-header", label: isRu ? "В шапке" : "Header" },
  ];
  const positions = [
    { id: "inline-header", label: isRu ? "В шапке (UI)" : "Header bar" },
    { id: "top-right", label: isRu ? "Правый верх" : "Top right" },
    { id: "top-left", label: isRu ? "Левый верх" : "Top left" },
    { id: "bottom-right", label: isRu ? "Правый низ" : "Bottom right" },
    { id: "bottom-left", label: isRu ? "Левый низ" : "Bottom left" },
  ];
  const hasCustomColors = Boolean(lw.bgColor || lw.textColor || lw.borderColor);
  const defBgHex = isLight ? "#fbfaf6" : "#1f1e1d";
  const defFgHex = isLight ? "#1b1a18" : "#faf9f5";
  const defBrdHex = isLight ? "#d9d5c9" : "#3a3935";

  const previewHtml = typeof rv5BuildLimitsWidgetHtml === "function"
    ? rv5BuildLimitsWidgetHtml(lw, quotaSummary, activeModelName || "", isRu, true)
    : "";

  return `
    ${rv5RenderSystemFontDatalist(systemFonts)}
    <div class="section-group">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="section-label">${isRu ? "Предпросмотр окна лимитов" : "Limits Window Preview"}</span>
        <span class="nav-badge">${isRu ? "Автосинхронизация" : "Auto-sync"}</span>
      </div>
      <div class="preview-stage" data-role="limitsPreviewStage" style="min-height:92px">${previewHtml}</div>
    </div>

    <div class="section-group">
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Вывести лимиты Antigravity в интерфейс" : "Show Antigravity Limits in UI"}</span>
            <span class="row-desc">${isRu ? "Только реальные квоты из Antigravity (Неделя / 5ч и таймер сброса) без локальных догадок." : "Strictly real quotas from Antigravity (Weekly / 5h and reset timer) with zero local guesses."}</span>
          </div>
          <button type="button" class="switch${lw.enabled ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="enabled"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Режим «Только лимиты» (скрыть TPS-виджет)" : "Limits-Only Mode (hide TPS widget)"}</span>
            <span class="row-desc">${isRu ? "Оставляет на экране только окошко лимитов без лишней телеметрии." : "Shows only the clean limits window without TPS widgets."}</span>
          </div>
          <button type="button" class="switch${lw.onlyLimitsMode ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="onlyLimitsMode"><span class="switch-thumb"></span></button>
        </div>
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "Режим окна лимитов" : "Window Mode"}</span>
      <div class="segmented-2">
        <button type="button" class="choice-card${isDockedUi ? " is-selected" : ""}" data-action="set-limits-window-mode" data-val="docked">
          <span class="choice-title"><span>${isRu ? "Часть интерфейса (закреплён)" : "Docked UI (pinned)"}</span></span>
          <span class="choice-desc">${isRu ? "Встроен в выбранный угол, сайдбар или шапку в стиле темы" : "Embedded cleanly into corner, sidebar, or header"}</span>
        </button>
        <button type="button" class="choice-card${!isDockedUi ? " is-selected" : ""}" data-action="set-limits-window-mode" data-val="floating">
          <span class="choice-title"><span>${isRu ? "Плавающее окно" : "Floating Window"}</span></span>
          <span class="choice-desc">${isRu ? "Свободно перетаскивается мышкой в любое место экрана" : "Drag freely anywhere on the screen"}</span>
        </button>
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "Расположение по углам и в интерфейсе" : "Standard Corner & UI Slot"}</span>
      <div class="dock-grid">
        ${positions.map((p) => `
          <button type="button" class="dock-btn${lw.position === p.id ? " is-selected" : ""}" data-action="set-limits-position" data-val="${p.id}">${rv5EscapeHtml(p.label)}</button>
        `).join("")}
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "Формат окошка лимитов" : "Limits Window Style"}</span>
      <div class="subtab-bar is-segmented">
        ${layouts.map((l) => `
          <button type="button" class="subtab-btn${lw.layout === l.id ? " is-active" : ""}" data-action="set-limits-field" data-field="layout" data-val="${l.id}">${rv5EscapeHtml(l.label)}</button>
        `).join("")}
      </div>
    </div>

    <details class="rx-details" data-disc="limitsStyle">
      <summary>${isRu ? "Размер, шрифт, адаптация стиля и поля" : "Size, Font, Theme Styling & Fields"}</summary>
      <div class="rx-details-body">
        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "Шрифт окна" : "Widget Font"}</span>
            <select class="select-input" data-limits-field="fontFamily">
              ${rv5FontSelectOptions(lw.fontFamily || "inherit", "ui", systemFonts, isRu, true)}
            </select>
            ${lw.fontFamily === "custom" ? `<input type="text" class="text-input" style="margin-top:5px" list="rudex-sys-fonts-list" data-limits-field="fontFamilyCustom" data-limits-live-text="1" value="${rv5EscapeHtml(lw.fontFamilyCustom || "")}" placeholder="JetBrains Mono, Segoe UI…"/>` : ""}
          </div>
          <div class="section-group">
            <span class="section-label">${isRu ? "Модели в окне" : "Models"}</span>
            <select class="select-input" data-limits-field="families">
              <option value="both"${lw.families === "both" ? " selected" : ""}>${isRu ? "Все (Gemini + Claude/GPT)" : "Both"}</option>
              <option value="active"${lw.families === "active" ? " selected" : ""}>${isRu ? "Только активная" : "Active model"}</option>
              <option value="gemini"${lw.families === "gemini" ? " selected" : ""}>Gemini</option>
              <option value="claudeGpt"${lw.families === "claudeGpt" ? " selected" : ""}>Claude / GPT</option>
            </select>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размер шрифта" : "Font Size"}</span><b class="num" data-live-lim-val="fontSize">${lw.fontSize}px</b></div>
            <input type="range" class="range-input" min="10" max="22" step="1" data-limits-field="fontSize" value="${lw.fontSize}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Масштаб окна" : "Scale"}</span><b class="num" data-live-lim-val="scale">${lw.scale}%</b></div>
            <input type="range" class="range-input" min="70" max="160" step="5" data-limits-field="scale" value="${lw.scale}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Ширина карточки" : "Card Width"}</span><b class="num" data-live-lim-val="width">${Number(lw.width) >= 180 ? `${lw.width}px` : (isRu ? "Авто" : "Auto")}</b></div>
            <input type="range" class="range-input" min="175" max="420" step="5" data-limits-field="width" value="${Number(lw.width) >= 180 ? lw.width : 175}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Скругление углов" : "Radius"}</span><b class="num" data-live-lim-val="borderRadius">${lw.borderRadius}px</b></div>
            <input type="range" class="range-input" min="0" max="28" step="1" data-limits-field="borderRadius" value="${lw.borderRadius}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Непрозрачность фона" : "Background Opacity"}</span><b class="num" data-live-lim-val="bgOpacity">${lw.bgOpacity}%</b></div>
            <input type="range" class="range-input" min="20" max="100" step="2" data-limits-field="bgOpacity" value="${lw.bgOpacity}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размытие фона (Blur)" : "Backdrop Blur"}</span><b class="num" data-live-lim-val="blur">${lw.blur}px</b></div>
            <input type="range" class="range-input" min="0" max="28" step="1" data-limits-field="blur" value="${lw.blur}"/>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px">
          <span class="section-label">${isRu ? "Цвета" : "Colors"} · ${hasCustomColors ? (isRu ? "свои" : "custom") : (isRu ? "авто в тон теме" : "auto follow theme")}</span>
          ${hasCustomColors ? `<button type="button" class="btn btn-sm" data-action="reset-limits-colors">↺ ${isRu ? "В тон теме" : "Follow Theme"}</button>` : ""}
        </div>
        <div class="control-grid-3">
          <label class="color-box"><span>${isRu ? "Фон" : "Bg"}</span><input type="color" class="color-input" data-limits-field="bgColor" value="${lw.bgColor || defBgHex}"/></label>
          <label class="color-box"><span>${isRu ? "Текст" : "Text"}</span><input type="color" class="color-input" data-limits-field="textColor" value="${lw.textColor || defFgHex}"/></label>
          <label class="color-box"><span>${isRu ? "Рамка" : "Border"}</span><input type="color" class="color-input" data-limits-field="borderColor" value="${lw.borderColor || defBrdHex}"/></label>
        </div>

        <div class="card">
          <div class="row-item">
            <span class="row-title">${isRu ? "Формат процентов" : "Percentage display"}</span>
            <div class="subtab-bar is-segmented" style="max-width:240px;flex-shrink:0">
              <button type="button" class="subtab-btn${lw.displayMode !== "used" ? " is-active" : ""}" data-action="set-limits-field" data-field="displayMode" data-val="remaining">${isRu ? "Осталось %" : "Remaining %"}</button>
              <button type="button" class="subtab-btn${lw.displayMode === "used" ? " is-active" : ""}" data-action="set-limits-field" data-field="displayMode" data-val="used">${isRu ? "Потрачено %" : "Used %"}</button>
            </div>
          </div>
          <div class="row-item"><span class="row-title">${isRu ? "Показывать недельный лимит" : "Show Weekly limit"}</span><button type="button" class="switch${lw.showWeekly ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="showWeekly"><span class="switch-thumb"></span></button></div>
          <div class="row-item"><span class="row-title">${isRu ? "Показывать лимит 5ч" : "Show 5h limit"}</span><button type="button" class="switch${lw.show5h ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="show5h"><span class="switch-thumb"></span></button></div>
          <div class="row-item"><span class="row-title">${isRu ? "Показывать таймер сброса" : "Show reset timer"}</span><button type="button" class="switch${lw.showResetTimer ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="showResetTimer"><span class="switch-thumb"></span></button></div>
          <div class="row-item"><span class="row-title">${isRu ? "Авто-светофор (зелёный → жёлтый → красный)" : "Auto traffic-light colors"}</span><button type="button" class="switch${lw.trafficLight ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="trafficLight"><span class="switch-thumb"></span></button></div>
          ${!lw.trafficLight ? `
            <div class="row-item">
              <span class="row-title">${isRu ? "Цвет полосы прогресса" : "Progress bar color"}</span>
              <input type="color" class="color-input" data-limits-field="barColor" value="${lw.barColor || "#d97757"}"/>
            </div>
          ` : ""}
        </div>
      </div>
    </details>

    <div class="section-group">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="section-label">${isRu ? "Уведомления и автопродолжение чата" : "Limit Reset Alerts & Auto-Continue"}</span>
        <button type="button" class="btn btn-sm btn-ghost" data-action="test-quota-notification">${rv5UiIcon("bell", 12)}<span>${isRu ? "Тест уведомления" : "Test alert"}</span></button>
      </div>
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Уведомлять на рабочий стол, когда лимиты обновятся" : "Desktop notification when limits restore"}</span>
            <span class="row-desc">${isRu ? "Кликабельное системное уведомление — нажатие сразу открывает Antigravity (вкл. по умолчанию)." : "Clickable desktop toast — clicking opens & focuses Antigravity (on by default)."}</span>
          </div>
          <button type="button" class="switch${qa.notifyOnReset ? " is-on" : ""}" role="switch" aria-checked="${qa.notifyOnReset ? "true" : "false"}" data-action="toggle-quota-auto-bool" data-field="notifyOnReset"><span class="switch-thumb"></span></button>
        </div>
        ${qa.notifyOnReset ? `
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${isRu ? "Присылать уведомление, даже если Antigravity закрыт" : "Notify even when Antigravity is closed"}</span>
              <span class="row-desc">${isRu ? "Выкл. по умолчанию. При включении создаёт локальную задачу Планировщика ОС (Windows Task Scheduler / macOS LaunchAgent / Linux systemd) без консольных окон." : "Off by default. When enabled, creates a local OS scheduled task (Windows Task Scheduler / macOS LaunchAgent / Linux systemd) with zero console popups."}</span>
            </div>
            <button type="button" class="switch${qa.notifyWhenClosed ? " is-on" : ""}" role="switch" aria-checked="${qa.notifyWhenClosed ? "true" : "false"}" data-action="toggle-quota-auto-bool" data-field="notifyWhenClosed"><span class="switch-thumb"></span></button>
          </div>
        ` : ""}
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Автопродолжение чата после восстановления лимитов" : "Auto-continue chat when limits restore"}</span>
            <span class="row-desc">${isRu ? "Если агент не успел закончить задачу из-за лимита, он автоматически продолжит работу после сброса (выкл. по умолчанию)." : "If the agent stopped due to a quota limit, automatically resume once limits reset (off by default)."}</span>
          </div>
          <button type="button" class="switch${qa.autoContinueEnabled ? " is-on" : ""}" role="switch" aria-checked="${qa.autoContinueEnabled ? "true" : "false"}" data-action="toggle-quota-auto-bool" data-field="autoContinueEnabled"><span class="switch-thumb"></span></button>
        </div>
      </div>

      ${qa.autoContinueEnabled ? `
        <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;margin-top:6px">
          <div class="section-group" style="gap:5px">
            <span class="section-label">${isRu ? "Для каких чатов работает автопродолжение" : "Auto-Continue Scope"}</span>
            <div class="subtab-bar is-segmented">
              <button type="button" class="subtab-btn${qa.autoContinueScope === "all" ? " is-active" : ""}" data-action="set-quota-auto-scope" data-val="all">${isRu ? "Все чаты" : "All chats"}</button>
              <button type="button" class="subtab-btn${qa.autoContinueScope === "selected" ? " is-active" : ""}" data-action="set-quota-auto-scope" data-val="selected">${isRu ? "Выбранные" : "Selected"}</button>
              <button type="button" class="subtab-btn${qa.autoContinueScope === "current" ? " is-active" : ""}" data-action="set-quota-auto-scope" data-val="current">${isRu ? "Текущий чат" : "Current chat"}</button>
            </div>
          </div>

          ${qa.autoContinueScope === "selected" ? `
            <div class="section-group" style="gap:5px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                <span class="section-label">${isRu ? "Выбранные чаты" : "Selected Chats"} (${selectedSet.size})</span>
                ${curKey && !selectedSet.has(curKey) ? `<button type="button" class="btn btn-sm" data-action="add-current-chat-auto-continue">${isRu ? "+ Добавить текущий" : "+ Add current"}</button>` : ""}
              </div>
              ${knownChats.length > 0 ? `
                <div class="rx-ac-chat-list">
                  ${knownChats.map((ch) => {
                    const checked = selectedSet.has(ch.chatKey);
                    return `
                      <div class="rx-ac-chat-row">
                        <span class="rx-ac-chat-name" title="${rv5EscapeHtml(ch.title)}">${rv5EscapeHtml(ch.title)}${ch.isCurrent ? ` <span class="nav-badge" style="margin-left:4px">${isRu ? "текущий" : "active"}</span>` : ""}</span>
                        <button type="button" class="switch${checked ? " is-on" : ""}" role="switch" aria-checked="${checked ? "true" : "false"}" data-action="toggle-quota-auto-chat" data-chat-key="${rv5EscapeHtml(ch.chatKey)}"><span class="switch-thumb"></span></button>
                      </div>
                    `;
                  }).join("")}
                </div>
              ` : `<span class="row-desc">${isRu ? "Откройте нужный чат и нажмите «+ Добавить текущий»." : "Open a chat and click «+ Add current»."}</span>`}
            </div>
          ` : ""}

          ${qa.autoContinueScope === "current" ? `
            <div class="row-desc">${curKey
              ? (isRu ? `Привязано к чату: «${rv5EscapeHtml(curTitle)}»` : `Targeted chat: "${rv5EscapeHtml(curTitle)}"`)
              : (isRu ? "Откройте нужный чат — автопродолжение применится к нему." : "Open any chat — auto-continue will target it.")}</div>
          ` : ""}

          <div class="section-group" style="gap:5px">
            <span class="section-label">${isRu ? "Сообщение для автопродолжения" : "Auto-Continue Prompt"}</span>
            <input type="text" class="text-input" data-quota-auto-field="autoContinuePrompt" value="${rv5EscapeHtml(qa.autoContinuePrompt || "")}" placeholder="${rv5EscapeHtml(defaultContinuePrompt)}"/>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <span class="row-title" style="font-size:12px">${isRu ? "Сначала нажимать родную кнопку «Повторить»" : "Click native «Retry» button first if shown"}</span>
            <button type="button" class="switch${qa.autoContinueRetryFirst ? " is-on" : ""}" role="switch" aria-checked="${qa.autoContinueRetryFirst ? "true" : "false"}" data-action="toggle-quota-auto-bool" data-field="autoContinueRetryFirst"><span class="switch-thumb"></span></button>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:4px;border-top:1px solid var(--rx-border)">
            <span class="row-desc">${waitingList.length > 0
              ? (isRu ? `В очереди ожидания лимита: ${waitingList.length}` : `Waiting for limit reset: ${waitingList.length}`)
              : (isRu ? "Сработает автоматически при ошибке лимита или по кнопке справа." : "Triggers automatically on limit error or via the manual arm button.")}</span>
            ${curKey ? (curIsArmed
              ? `<button type="button" class="btn btn-sm btn-danger" data-action="disarm-auto-continue" data-chat-key="${rv5EscapeHtml(curKey)}">${rv5UiIcon("close", 11)}<span>${isRu ? "Отменить для чата" : "Cancel for chat"}</span></button>`
              : `<button type="button" class="btn btn-sm btn-primary" data-action="arm-current-auto-continue">${rv5UiIcon("clock", 12)}<span>${isRu ? "Ждать лимит для этого чата" : "Arm for this chat"}</span></button>`) : ""}
          </div>

          ${waitingList.length > 0 ? `
            <div class="rx-ac-chat-list">
              ${waitingList.map((w) => `
                <div class="rx-ac-chat-row">
                  <span class="rx-ac-chat-name" style="display:inline-flex;align-items:center;gap:5px">${rv5UiIcon("clock", 11)}<span>${rv5EscapeHtml(w.title || w.chatKey.slice(0, 12))} · ${rv5EscapeHtml(w.family === "gemini" ? "Gemini" : (w.family === "claudeGpt" ? "Claude/GPT" : (isRu ? "Любой" : "Any")))}</span></span>
                  <button type="button" class="btn btn-sm btn-ghost" style="padding:2px 6px" data-action="disarm-auto-continue" data-chat-key="${rv5EscapeHtml(w.chatKey)}" title="${isRu ? "Убрать из очереди" : "Remove"}">${rv5UiIcon("close", 11)}</button>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>
      ` : ""}
    </div>

    ${monitorHtml || exportHtml ? `
      <details class="rx-details" data-disc="limitsMonitor">
        <summary>${isRu ? "Монитор скорости (TPS) и Экспорт в ZIP" : "Speed Monitor (TPS) & ZIP Export"}</summary>
        <div class="rx-details-body">
          ${monitorHtml || ""}
          ${exportHtml ? `<div style="border-top:1px solid var(--rx-border);padding-top:10px">${exportHtml}</div>` : ""}
        </div>
      </details>
    ` : ""}
  `;
}

/**
 * Interactive Keybinding Editor section.
 */
function rv5RenderKeybindingsHtml(keybindings, recordingId, isRu) {
  const kb = rv5NormalizeKeybindings(keybindings);
  const groups = [
    { id: "menu", title: isRu ? "Меню и навигация" : "Menu & Navigation" },
    { id: "design", title: isRu ? "Дизайн, темы и обои" : "Design, Themes & Wallpapers" },
    { id: "widgets", title: isRu ? "Виджеты, лимиты и скрины" : "Widgets, Limits & Screenshots" },
    { id: "agent", title: isRu ? "Агент и тумблеры" : "Agent & Toggles" },
  ];
  return `
    <div class="section-group">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="row-desc">${isRu ? "Кликните на клавишу и нажмите нужную комбинацию. Backspace — убрать, Esc — отмена." : "Click a shortcut and press any combo. Backspace clears, Esc cancels."}</span>
        <button type="button" class="btn btn-sm" data-action="reset-all-keybindings">${isRu ? "Сбросить" : "Reset All"}</button>
      </div>
      ${groups.map((g) => {
        const defs = RUDEX_KEYBINDING_DEFS.filter((d) => d.group === g.id);
        return `
          <div class="section-group" style="margin-top:6px">
            <span class="section-label">${rv5EscapeHtml(g.title)}</span>
            <div class="card">
              ${defs.map((d) => {
                const isRec = recordingId === d.id;
                const val = kb[d.id] || "";
                return `
                  <div class="row-item">
                    <span class="row-title">${rv5EscapeHtml(isRu ? d.nameRu : d.nameEn)}</span>
                    <div style="display:flex;align-items:center;gap:4px">
                      <button type="button" class="rx-kb-btn${isRec ? " is-recording" : ""}" data-action="record-keybinding" data-id="${rv5EscapeHtml(d.id)}">
                        ${isRec ? (isRu ? "Нажмите клавиши…" : "Press keys…") : (val || (isRu ? "Не задано" : "Not set"))}
                      </button>
                      ${val ? `<button type="button" class="btn btn-sm btn-ghost" data-action="clear-keybinding" data-id="${rv5EscapeHtml(d.id)}" title="${isRu ? "Отключить" : "Clear"}">${rv5UiIcon("close", 11)}</button>` : ""}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/**
 * AGY Customization Workshop (Visual Rules, Skills, MCP Servers, Plugins & Hooks manager).
 */
function rv5RenderWorkshopHtml(wsState, isRu, pinnedSkills, opts) {
  const hideSubTabs = Boolean(opts && opts.hideSubTabs);
  const data = wsState && wsState.data ? wsState.data : null;
  const scope = (wsState && wsState.scope) || "global";
  const sub = (wsState && wsState.sub) || "rules";
  const loading = Boolean(wsState && wsState.loading);
  const pinnedSet = new Set(Array.isArray(pinnedSkills) ? pinnedSkills : []);
  const filterScope = (arr) => (arr || []).filter((it) => scope === "all" || it.scope === scope || (scope === "global" && it.scope === "plugin"));

  const rules = filterScope(data && data.rules);
  const skills = filterScope(data && data.skills);
  const mcps = filterScope(data && data.mcpServers);
  const plugins = (data && data.plugins) || [];
  const hooks = filterScope(data && data.hooks);
  const draft = (wsState && wsState.draft) || {};

  let contentHtml = "";
  if (loading && !data) {
    contentHtml = `<div class="empty-msg">${isRu ? "Сканирую кастомизации Antigravity…" : "Scanning Antigravity customizations…"}</div>`;
  } else if (sub === "rules") {
    contentHtml = `
      <div class="rx-ws-card">
        <div class="row-title">${isRu ? "+ Новое правило (Rules)" : "+ New Rule"}</div>
        <input type="text" class="text-input" data-ws-draft="ruleFileName" value="${rv5EscapeHtml(draft.ruleFileName || "")}" placeholder="${isRu ? "Имя файла, напр. code-style.md" : "File name, e.g. code-style.md"}"/>
        <textarea class="editor-box" style="min-height:74px" data-ws-draft="ruleBody" placeholder="${isRu ? "Напишите правило в свободной форме…" : "Write your guideline…"}">${rv5EscapeHtml(draft.ruleBody || "")}</textarea>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm btn-primary" data-action="ws-save-rule">${isRu ? "Создать правило" : "Create Rule"}</button>
        </div>
      </div>
      ${rules.length === 0 ? `<div class="empty-msg">${isRu ? "Правил в этой области пока нет." : "No rules found."}</div>` : rules.map((r) => `
        <div class="rx-ws-card">
          <div class="rx-ws-head">
            <div style="min-width:0">
              <div class="row-title">${rv5EscapeHtml(r.name)} <span class="nav-badge">${rv5EscapeHtml(r.scope === "workspace" ? (isRu ? "Проект" : "Project") : (isRu ? "Глобально" : "Global"))}</span></div>
              <div class="row-desc" style="font-size:10.5px;font-family:var(--rx-font-mono);overflow:hidden;text-overflow:ellipsis">${rv5EscapeHtml(r.path)}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button type="button" class="switch${r.enabled ? " is-on" : ""}" role="switch" data-action="ws-toggle-rule" data-path="${rv5EscapeHtml(r.path)}" data-enabled="${r.enabled ? "1" : "0"}"><span class="switch-thumb"></span></button>
              <button type="button" class="btn btn-sm" data-action="ws-open-path" data-path="${rv5EscapeHtml(r.path)}" title="${isRu ? "Открыть файл" : "Reveal"}">${rv5UiIcon("arrowUpRight", 12)}</button>
              <button type="button" class="btn btn-sm" data-action="ws-delete-rule" data-path="${rv5EscapeHtml(r.path)}" title="${isRu ? "Удалить" : "Delete"}">${rv5UiIcon("close", 12)}</button>
            </div>
          </div>
          <div class="row-desc" style="font-size:11.5px;white-space:pre-wrap;max-height:56px;overflow:hidden">${rv5EscapeHtml((r.body || r.content || "").trim().slice(0, 220))}</div>
        </div>
      `).join("")}
    `;
  } else if (sub === "skills") {
    contentHtml = `
      <div class="rx-ws-card">
        <div class="row-title">${isRu ? "+ Создать скилл (без ручного YAML)" : "+ Skill Creator"}</div>
        <div class="control-grid-2">
          <input type="text" class="text-input" data-ws-draft="skillName" value="${rv5EscapeHtml(draft.skillName || "")}" placeholder="${isRu ? "Название скилла" : "Skill name"}"/>
          <input type="text" class="text-input" data-ws-draft="skillDesc" value="${rv5EscapeHtml(draft.skillDesc || "")}" placeholder="${isRu ? "Когда запускать скилл?" : "When to trigger?"}"/>
        </div>
        <textarea class="editor-box" style="min-height:74px" data-ws-draft="skillBody" placeholder="${isRu ? "Инструкция скилла…" : "Skill instructions…"}">${rv5EscapeHtml(draft.skillBody || "")}</textarea>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm btn-primary" data-action="ws-save-skill">${isRu ? "Создать скилл" : "Create Skill"}</button>
        </div>
      </div>
      ${skills.length === 0 ? `<div class="empty-msg">${isRu ? "Скиллы не найдены." : "No skills found."}</div>` : skills.map((sk) => {
        const isPinned = pinnedSet.has(sk.name);
        return `
        <div class="rx-ws-card">
          <div class="rx-ws-head">
            <div style="min-width:0">
              <div class="row-title">${rv5EscapeHtml(sk.name)} <span class="nav-badge">${rv5EscapeHtml(sk.plugin || sk.scope)}</span>${isPinned ? ` <span class="badge-active">${rv5UiIcon("starFilled", 10)}<span>${isRu ? "Закреплён" : "Pinned"}</span></span>` : ""}</div>
              <div class="row-desc">${rv5EscapeHtml(sk.description || sk.path)}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button type="button" class="btn btn-sm${isPinned ? " btn-primary" : ""}" data-action="ws-pin-skill" data-name="${rv5EscapeHtml(sk.name)}" title="${isPinned ? (isRu ? "Открепить от агента" : "Unpin from Agent") : (isRu ? "Прикрепить к агенту" : "Pin to Agent")}">${rv5UiIcon(isPinned ? "starFilled" : "star", 12)}</button>
              <button type="button" class="btn btn-sm" data-action="ws-open-path" data-path="${rv5EscapeHtml(sk.dir || sk.path)}" title="${isRu ? "Открыть папку" : "Reveal"}">${rv5UiIcon("arrowUpRight", 12)}</button>
            </div>
          </div>
        </div>
      `;
      }).join("")}
    `;
  } else if (sub === "mcp") {
    contentHtml = `
      <div class="rx-ws-card">
        <div class="row-title">${isRu ? "+ Добавить MCP-сервер" : "+ Add MCP Server"}</div>
        <div class="control-grid-2">
          <input type="text" class="text-input" data-ws-draft="mcpName" value="${rv5EscapeHtml(draft.mcpName || "")}" placeholder="${isRu ? "Имя (напр. github)" : "Name"}"/>
          <input type="text" class="text-input" data-ws-draft="mcpCommand" value="${rv5EscapeHtml(draft.mcpCommand || "")}" placeholder="${isRu ? "Команда (npx, uvx…)" : "Command"}"/>
        </div>
        <div class="control-grid-2">
          <input type="text" class="text-input" data-ws-draft="mcpArgs" value="${rv5EscapeHtml(draft.mcpArgs || "")}" placeholder="${isRu ? "Аргументы через пробел" : "Args"}"/>
          <input type="text" class="text-input" data-ws-draft="mcpUrl" value="${rv5EscapeHtml(draft.mcpUrl || "")}" placeholder="${isRu ? "Или HTTP/SSE URL" : "Or URL"}"/>
        </div>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm btn-primary" data-action="ws-save-mcp">${isRu ? "Сохранить MCP" : "Save MCP"}</button>
        </div>
      </div>
      ${mcps.length === 0 ? `<div class="empty-msg">${isRu ? "MCP-серверы не настроены." : "No MCP servers configured."}</div>` : mcps.map((m) => `
        <div class="rx-ws-card">
          <div class="rx-ws-head">
            <div style="min-width:0">
              <div class="row-title">${rv5EscapeHtml(m.name)} <span class="nav-badge">${rv5EscapeHtml(m.scope)}</span></div>
              <div class="row-desc" style="font-family:var(--rx-font-mono);font-size:11px">${rv5EscapeHtml(m.url || [m.command].concat(m.args || []).join(" "))}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button type="button" class="switch${!m.disabled ? " is-on" : ""}" role="switch" data-action="ws-toggle-mcp" data-name="${rv5EscapeHtml(m.name)}" data-scope="${rv5EscapeHtml(m.scope)}" data-disabled="${m.disabled ? "1" : "0"}"><span class="switch-thumb"></span></button>
              <button type="button" class="btn btn-sm" data-action="ws-delete-mcp" data-name="${rv5EscapeHtml(m.name)}" data-scope="${rv5EscapeHtml(m.scope)}" title="${isRu ? "Удалить" : "Delete"}">${rv5UiIcon("close", 12)}</button>
            </div>
          </div>
        </div>
      `).join("")}
    `;
  } else {
    contentHtml = `
      <span class="section-label">${isRu ? `Плагины (${plugins.length})` : `Plugins (${plugins.length})`}</span>
      ${plugins.map((p) => `
        <div class="rx-ws-card">
          <div class="rx-ws-head">
            <div><div class="row-title">${rv5EscapeHtml(p.name)} ${p.version ? `<span class="nav-badge">v${rv5EscapeHtml(p.version)}</span>` : ""}</div><div class="row-desc">${rv5EscapeHtml(p.description || p.dir)}</div></div>
            <button type="button" class="btn btn-sm" data-action="ws-open-path" data-path="${rv5EscapeHtml(p.dir)}" title="${isRu ? "Открыть папку" : "Reveal"}">${rv5UiIcon("arrowUpRight", 12)}</button>
          </div>
        </div>
      `).join("")}
      <span class="section-label" style="margin-top:6px">${isRu ? `Активные хуки (${hooks.length})` : `Active Hooks (${hooks.length})`}</span>
      ${hooks.map((h) => `
        <div class="rx-ws-card">
          <div class="rx-ws-head">
            <div><div class="row-title">${rv5EscapeHtml(h.name)} <span class="nav-badge">${rv5EscapeHtml(h.source)}</span></div><div class="row-desc">${rv5EscapeHtml((h.events || []).join(" · "))}</div></div>
            <button type="button" class="btn btn-sm" data-action="ws-open-path" data-path="${rv5EscapeHtml(h.path)}" title="${isRu ? "Открыть файл" : "Reveal"}">${rv5UiIcon("arrowUpRight", 12)}</button>
          </div>
        </div>
      `).join("")}
    `;
  }

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
      <div class="subtab-bar is-segmented" style="margin:0">
        <button type="button" class="subtab-btn${scope === "global" ? " is-active" : ""}" data-action="ws-set-scope" data-val="global">${isRu ? "Глобально" : "Global"}</button>
        <button type="button" class="subtab-btn${scope === "workspace" ? " is-active" : ""}" data-action="ws-set-scope" data-val="workspace">${isRu ? "Проект" : "Project"}</button>
        <button type="button" class="subtab-btn${scope === "all" ? " is-active" : ""}" data-action="ws-set-scope" data-val="all">${isRu ? "Всё" : "All"}</button>
      </div>
      <button type="button" class="btn btn-sm" data-action="ws-refresh">${rv5UiIcon("refresh", 12)}<span>${isRu ? "Обновить" : "Refresh"}</span></button>
    </div>
    ${hideSubTabs ? "" : `
      <div class="subtab-bar">
        <button type="button" class="subtab-btn${sub === "rules" ? " is-active" : ""}" data-action="ws-set-sub" data-val="rules">${isRu ? "Правила" : "Rules"} (${rules.length})</button>
        <button type="button" class="subtab-btn${sub === "skills" ? " is-active" : ""}" data-action="ws-set-sub" data-val="skills">${isRu ? "Скиллы" : "Skills"} (${skills.length})</button>
        <button type="button" class="subtab-btn${sub === "mcp" ? " is-active" : ""}" data-action="ws-set-sub" data-val="mcp">MCP (${mcps.length})</button>
        <button type="button" class="subtab-btn${sub === "hooks" ? " is-active" : ""}" data-action="ws-set-sub" data-val="hooks">${isRu ? "Плагины и Хуки" : "Plugins & Hooks"}</button>
      </div>
    `}
    ${contentHtml}
  `;
}

/**
 * Slim, unobtrusive Chat Dock directly above native Antigravity composer:
 * - Left: Simple Agent Toggles chip ("Инструменты · Авто ▾" or active toggle names)
 * - No extra "Screen" or "Live edit" clutter buttons (live edits work via native Enter/Send,
 *   and screenshot pencil editing opens directly from any opened screenshot / attached thumbnail).
 * - Queue capsule auto-hides delivered items after 4 seconds (plus manual ✕ dismiss)
 */
function rv5BuildChatDockHtml(ctx) {
  const { agentProfile, defaultProfile, liveEdits, dismissedIds, liveEditInline, popoverOpen, contextPopoverOpen, contextInfo, waitingEntry, isRu } = ctx;
  const ap = rv5NormalizeAgentProfile(agentProfile);
  const le = Object.assign({}, RUDEX_LIVE_EDIT_DEFAULTS, liveEditInline || {});
  const dismissed = dismissedIds || new Set();

  const pendingItems = (liveEdits || []).filter((it) => it && it.status === "pending");
  const recentDelivered = (liveEdits || []).filter(
    (it) => it && it.status === "delivered" && !dismissed.has(it.id) && Date.now() - (it.deliveredAt || 0) < 4000
  ).slice(-1);
  const showStrip = Boolean(le.showQueueStrip);
  const queueItems = showStrip ? pendingItems.concat(recentDelivered) : [];

  const showBar = le.showChatDock !== false;
  const showCtx = le.showContextMeter === true;
  const hasWaiting = Boolean(waitingEntry && waitingEntry.chatKey);
  if (!showBar && !showCtx && !hasWaiting && queueItems.length === 0 && !popoverOpen && !contextPopoverOpen) return "";

  let ctxPillHtml = "";
  let ctxPopHtml = "";
  if (showCtx) {
    const ci = contextInfo && typeof contextInfo === "object" ? contextInfo : {};
    const rawModel = String(ci.modelName || "").trim();
    const resolved = typeof rv5ResolveModelContextWindow === "function"
      ? rv5ResolveModelContextWindow(rawModel)
      : { maxTokens: 200000, windowLabel: "200K", shortModel: rawModel.slice(0, 18) };
    const fmtTok = typeof rv5FormatContextTokens === "function" ? rv5FormatContextTokens : (v) => String(v);
    const usedTokens = Math.max(0, Math.round(Number(ci.usedTokens) || 0));
    const maxTokens = Math.max(1000, resolved.maxTokens);
    const rawPct = (usedTokens / maxTokens) * 100;
    const pctClamped = Math.max(0, Math.min(100, rawPct));
    const pctDisp = pctClamped > 0 && pctClamped < 1 ? "<1%" : `${Math.round(pctClamped)}%`;
    const pctExact = `${pctClamped.toFixed(pctClamped >= 10 ? 0 : 1)}%`;
    const sevCls = pctClamped >= 85 ? " is-crit" : (pctClamped >= 60 ? " is-warn" : "");
    const approx = !ci.exact && usedTokens > 0 ? "~" : "";
    const usedStr = `${approx}${fmtTok(usedTokens)}`;
    const remTokens = Math.max(0, maxTokens - usedTokens);
    const chatLabel = ci.isNewChat
      ? (isRu ? "Новый чат" : "New chat")
      : (String(ci.chatTitle || "").trim() || (isRu ? "Текущий чат" : "Current chat"));
    const tip = isRu
      ? `Контекст чата «${chatLabel}»: ${usedStr} / ${resolved.windowLabel} (${pctExact}) · Модель: ${rawModel || "не определена"}`
      : `Chat "${chatLabel}" context: ${usedStr} / ${resolved.windowLabel} (${pctExact}) · Model: ${rawModel || "unknown"}`;

    ctxPillHtml = `
      <div class="rx-dock-right">
        <button type="button" class="rx-ctx-pill${sevCls}" data-action="toggle-context-popover" title="${rv5EscapeHtml(tip)}">
          <span class="rx-ctx-bar"><span class="rx-ctx-fill" style="width:${pctClamped.toFixed(1)}%"></span></span>
          ${resolved.shortModel ? `<span class="rx-ctx-model">${rv5EscapeHtml(resolved.shortModel)}</span>` : ""}
          <span class="rx-ctx-nums">${rv5EscapeHtml(usedStr)} / ${rv5EscapeHtml(resolved.windowLabel)}</span>
          <span class="rx-ctx-pct">${rv5EscapeHtml(pctDisp)}</span>
        </button>
      </div>
    `;

    if (contextPopoverOpen) {
      ctxPopHtml = `
        <div class="rx-ctx-popover" data-role="contextWindowPopover">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
            <strong style="font-size:12px;color:var(--rx-fg-strong)">${isRu ? "Контекстное окно модели" : "Model Context Window"}</strong>
            <span class="rx-ctx-pct" style="font-size:12px${sevCls === " is-crit" ? ";color:var(--rx-danger,#ef4444)" : (sevCls === " is-warn" ? ";color:var(--rx-warning,#f59e0b)" : "")}">${rv5EscapeHtml(pctExact)}</span>
          </div>
          <div class="rx-ctx-pop-track"><div class="rx-ctx-pop-fill${sevCls}" style="width:${pctClamped.toFixed(1)}%"></div></div>
          <div class="rx-ctx-pop-grid">
            <div class="rx-ctx-pop-row"><span>${isRu ? "Чат" : "Chat"}</span><b title="${rv5EscapeHtml(chatLabel)}">${rv5EscapeHtml(chatLabel)}</b></div>
            <div class="rx-ctx-pop-row"><span>${isRu ? "Модель" : "Model"}</span><b title="${rv5EscapeHtml(rawModel || "—")}">${rv5EscapeHtml(rawModel || (isRu ? "Не определена" : "Unknown"))}</b></div>
            <div class="rx-ctx-pop-row"><span>${isRu ? "Занято / Окно" : "Used / Window"}</span><b>${rv5EscapeHtml(usedStr)} / ${rv5EscapeHtml(resolved.windowLabel)}</b></div>
            <div class="rx-ctx-pop-row"><span>${isRu ? "Свободно" : "Remaining"}</span><b>${rv5EscapeHtml(fmtTok(remTokens))} ${isRu ? "ток." : "tok"}</b></div>
            <div class="rx-ctx-pop-row"><span>${isRu ? "Источник" : "Source"}</span><b>${ci.exact ? (isRu ? "Точно (лог чата)" : "Exact (transcript)") : (isRu ? "Оценка по чату" : "Chat estimate")}</b></div>
          </div>
        </div>
      `;
    }
  }

  const activeTags = typeof rv5SummarizeActiveToggles === "function" ? rv5SummarizeActiveToggles(ap, isRu) : [];
  const isCustomActive = ap.enabled && activeTags.length > 0;
  let chipLabel = isRu ? "Инструменты · Авто" : "Tools · Auto";
  if (isCustomActive) {
    chipLabel = activeTags.length <= 2
      ? activeTags.join(" · ")
      : `${activeTags.slice(0, 2).join(" · ")} +${activeTags.length - 2}`;
  }

  const isDefaultNew = Boolean(defaultProfile && defaultProfile.applyToNewChats && defaultProfile.enabled);

  const triLabel = (val, onTxt, offTxt) => {
    const eff = ap.enabled ? val : "auto";
    if (eff === onTxt) return { text: isRu ? "Вкл" : "On", cls: "is-on" };
    if (eff === offTxt) return { text: isRu ? "Выкл" : "Off", cls: "is-off" };
    return { text: isRu ? "Авто" : "Auto", cls: "" };
  };
  const boolLabel = (flag) => (ap.enabled && flag ? { text: isRu ? "Вкл" : "On", cls: "is-on" } : { text: isRu ? "Авто" : "Auto", cls: "" });

  const subSt = triLabel(ap.subagents, "parallel", "off");
  const webSt = triLabel(ap.webSearch, "always", "off");
  const brwSt = triLabel(ap.browser, "verify", "off");
  const plnSt = triLabel(ap.planFirst, "strict", "skip");
  const verSt = boolLabel(ap.autoVerify);
  const deepSt = boolLabel(ap.deepMode);
  const roSt = ap.enabled && ap.safetyMode === "readonly" ? { text: isRu ? "Вкл" : "On", cls: "is-on" } : { text: isRu ? "Выкл" : "Off", cls: "" };

  return `
    ${popoverOpen ? `
      <div class="rx-agent-popover" data-role="agentQuickPopover">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
          <strong style="font-size:12px;color:var(--rx-fg-strong)">${isRu ? "Инструменты агента" : "Agent Tools"}</strong>
          <div style="display:flex;gap:4px">
            ${isCustomActive ? `<button type="button" class="btn btn-sm btn-ghost" style="padding:2px 6px" data-action="reset-agent-auto">${isRu ? "Авто" : "Reset"}</button>` : ""}
            <button type="button" class="btn btn-sm btn-ghost" style="padding:2px 6px" data-action="open-agent-full">${isRu ? "Все ↗" : "All ↗"}</button>
          </div>
        </div>
        <div class="rx-pop-toggles">
          <div class="rx-pop-row"><span>${isRu ? "Субагенты" : "Subagents"}</span><button type="button" class="rx-pop-pill ${subSt.cls}" data-action="quick-toggle-agent" data-key="subagents">${subSt.text}</button></div>
          <div class="rx-pop-row"><span>${isRu ? "Веб-поиск" : "Web Search"}</span><button type="button" class="rx-pop-pill ${webSt.cls}" data-action="quick-toggle-agent" data-key="webSearch">${webSt.text}</button></div>
          <div class="rx-pop-row"><span>${isRu ? "Браузер (UI)" : "Browser"}</span><button type="button" class="rx-pop-pill ${brwSt.cls}" data-action="quick-toggle-agent" data-key="browser">${brwSt.text}</button></div>
          <div class="rx-pop-row"><span>${isRu ? "План перед правками" : "Plan First"}</span><button type="button" class="rx-pop-pill ${plnSt.cls}" data-action="quick-toggle-agent" data-key="planFirst">${plnSt.text}</button></div>
          <div class="rx-pop-row"><span>${isRu ? "Автопроверка тестами" : "Auto-Tests"}</span><button type="button" class="rx-pop-pill ${verSt.cls}" data-action="quick-toggle-agent" data-key="autoVerify">${verSt.text}</button></div>
          <div class="rx-pop-row"><span>${isRu ? "Режим «До конца»" : "Finish Deep"}</span><button type="button" class="rx-pop-pill ${deepSt.cls}" data-action="quick-toggle-agent" data-key="deepMode">${deepSt.text}</button></div>
          <div class="rx-pop-row"><span>${isRu ? "Только чтение" : "Read-Only"}</span><button type="button" class="rx-pop-pill ${roSt.cls}" data-action="quick-toggle-agent" data-key="readonly">${roSt.text}</button></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:4px">
          <span style="font-size:11.5px;color:var(--rx-muted)">${isRu ? "По умолчанию для новых чатов" : "Default for new chats"}</span>
          <button type="button" class="switch${isDefaultNew ? " is-on" : ""}" role="switch" data-action="toggle-agent-default-new"><span class="switch-thumb"></span></button>
        </div>
        <div style="display:flex;align-items:center;justify-content:flex-end;padding-top:4px;border-top:1px solid var(--rx-border)">
          <button type="button" class="btn btn-sm btn-ghost" style="font-size:11px;padding:2px 7px" data-action="hide-tools-chip">${isRu ? "Скрыть кнопку «Инструменты»" : "Hide «Tools» button"}</button>
        </div>
      </div>
    ` : ""}

    ${ctxPopHtml}

    ${queueItems.length > 0 ? `
      <div class="rx-live-queue-strip">
        ${queueItems.map((it) => `
          <div class="rx-lq-item">
            <span class="rx-lq-badge${it.status === "delivered" ? " is-done" : ""}">${it.status === "delivered" ? (isRu ? "Учтено" : "Applied") : (isRu ? "В очереди" : "Queued")}</span>
            <span class="rx-lq-text">${rv5EscapeHtml(it.text || (isRu ? "Скриншот с правкой" : "Annotated screenshot"))}</span>
            ${it.status === "pending"
              ? `<button type="button" class="rx-lim-btn" data-action="cancel-live-edit" data-id="${rv5EscapeHtml(it.id)}" title="${isRu ? "Отменить правку" : "Cancel edit"}">${rv5UiIcon("close", 11)}</button>`
              : `<button type="button" class="rx-lim-btn" data-action="dismiss-live-edit-toast" data-id="${rv5EscapeHtml(it.id)}" title="${isRu ? "Скрыть" : "Dismiss"}">${rv5UiIcon("close", 11)}</button>`}
          </div>
        `).join("")}
      </div>
    ` : ""}

    ${(showBar || showCtx || hasWaiting) ? `
      <div class="rx-chat-dock-row">
        ${showBar ? `
          <button type="button" class="rx-agent-chip${isCustomActive ? " is-active" : ""}" data-action="toggle-agent-popover">
            <span class="rx-agent-dot"></span>
            <span>${rv5EscapeHtml(chipLabel)}</span>
            <span style="opacity:.7">▾</span>
          </button>
        ` : ""}
        ${hasWaiting ? `
          <span class="rx-ac-pill" title="${rv5EscapeHtml(isRu ? "Чат автоматически продолжится, когда лимиты восстановятся" : "Chat will auto-continue once limits restore")}">
            ${rv5UiIcon("clock", 11)}<span>${isRu ? "Автопродолжение после лимита" : "Auto-continue armed"}</span>
            <button type="button" class="rx-ac-cancel" data-action="disarm-auto-continue" data-chat-key="${rv5EscapeHtml(waitingEntry.chatKey)}" title="${isRu ? "Отменить" : "Cancel"}">${rv5UiIcon("close", 10)}</button>
          </span>
        ` : ""}
        ${ctxPillHtml}
      </div>
    ` : ""}
  `;
}

/**
 * Contextually injects pencil edit triggers ONLY where screenshots already live:
 * 1) Inside any opened image preview / lightbox dialog ("✎ Редактировать")
 * 2) Subtle corner "✎" badge on attached image thumbnails inside the native composer
 */
function rv5InjectImageEditTriggers(doc, isRu, onEditImage) {
  if (!doc || typeof doc.querySelectorAll !== "function" || typeof onEditImage !== "function") return;
  const win = doc.defaultView || (typeof window !== "undefined" ? window : null);
  try {
    // 1. Opened screenshot preview / lightbox modal
    const dialogs = doc.querySelectorAll('[role="dialog"], [role="alertdialog"], [data-state="open"]');
    for (let i = 0; i < dialogs.length; i += 1) {
      const dlg = dialogs[i];
      if (!dlg || (dlg.closest && dlg.closest("#rudex-studio-host"))) continue;
      const existingLbBtn = dlg.querySelector ? dlg.querySelector('[data-rudex-img-edit-btn="lightbox"]') : null;
      if (existingLbBtn) {
        const wantTxt = isRu ? "Редактировать" : "Edit";
        if (existingLbBtn.getAttribute("data-rudex-lbl") !== wantTxt) {
          existingLbBtn.setAttribute("data-rudex-lbl", wantTxt);
          existingLbBtn.innerHTML = `${rv5UiIcon("edit", 12)}<span>${rv5EscapeHtml(wantTxt)}</span>`;
          existingLbBtn.title = isRu ? "Нарисовать правки карандашом" : "Draw edits on screenshot";
        }
        continue;
      }
      const imgs = dlg.querySelectorAll ? dlg.querySelectorAll("img") : [];
      if (!imgs || imgs.length === 0) continue;
      let targetImg = null;
      for (let j = 0; j < imgs.length; j += 1) {
        const im = imgs[j];
        if (!im || (im.closest && im.closest("#rudex-studio-host"))) continue;
        const src = String(im.getAttribute ? (im.getAttribute("src") || "") : (im.src || ""));
        if (!src) continue;
        const rect = typeof im.getBoundingClientRect === "function" ? im.getBoundingClientRect() : null;
        const w = (rect && rect.width) || Number(im.naturalWidth) || Number(im.width) || 0;
        const h = (rect && rect.height) || Number(im.naturalHeight) || Number(im.height) || 0;
        const looksLarge = (w >= 120 && h >= 80) || ((w === 0 && h === 0) && (src.startsWith("data:image/") || src.startsWith("blob:")));
        if (looksLarge) {
          targetImg = im;
          break;
        }
      }
      if (!targetImg) continue;
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-rudex-img-edit-btn", "lightbox");
      btn.setAttribute("data-rudex-ignore", "1");
      btn.title = isRu ? "Нарисовать правки карандашом" : "Draw edits on screenshot";
      btn.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483500;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.22);background:rgba(24,24,23,0.92);color:#faf9f5;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.45);backdrop-filter:blur(10px);";
      const lbTxt = isRu ? "Редактировать" : "Edit";
      btn.setAttribute("data-rudex-lbl", lbTxt);
      btn.innerHTML = `${rv5UiIcon("edit", 12)}<span>${rv5EscapeHtml(lbTxt)}</span>`;
      btn.addEventListener("click", (ev) => {
        if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
        if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
        const liveImg = (dlg.querySelector && dlg.querySelector("img")) || targetImg;
        onEditImage({ imgEl: liveImg, fromLightbox: true, dialogEl: dlg });
      });
      dlg.appendChild(btn);
    }

    // 2. Attached image thumbnails inside native composer
    const comp = typeof rv5FindNativeComposer === "function" ? rv5FindNativeComposer(doc).container : doc.querySelector('[data-rudex-theme-composer="1"], [data-testid="composer"], form');
    if (comp && typeof comp.querySelectorAll === "function") {
      const thumbs = comp.querySelectorAll("img");
      for (let i = 0; i < thumbs.length; i += 1) {
        const im = thumbs[i];
        if (!im || (im.closest && im.closest("#rudex-studio-host"))) continue;
        const src = String(im.getAttribute ? (im.getAttribute("src") || "") : (im.src || ""));
        if (!src) continue;
        const rect = typeof im.getBoundingClientRect === "function" ? im.getBoundingClientRect() : null;
        if (rect && rect.width > 0 && rect.height > 0 && (rect.width < 18 || rect.height < 18)) continue;
        const wrap = im.parentElement;
        if (!wrap || wrap === comp || wrap === doc.body) continue;
        if (wrap.querySelector && wrap.querySelector('[data-rudex-img-edit-btn="thumb"]')) continue;
        try {
          const cs = win && typeof win.getComputedStyle === "function" ? win.getComputedStyle(wrap) : null;
          if (cs && cs.position === "static" && wrap.style) wrap.style.position = "relative";
        } catch (_e) {}
        const tBtn = doc.createElement("button");
        tBtn.type = "button";
        tBtn.setAttribute("data-rudex-img-edit-btn", "thumb");
        tBtn.setAttribute("data-rudex-ignore", "1");
        tBtn.title = isRu ? "Редактировать скрин карандашом" : "Annotate screenshot";
        tBtn.style.cssText = "position:absolute;left:2px;bottom:2px;z-index:12;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;border:1px solid rgba(255,255,255,0.26);background:rgba(20,20,19,0.82);color:#faf9f5;font-size:10px;line-height:1;padding:0;cursor:pointer;opacity:0.74;transition:opacity 0.12s ease;";
        tBtn.innerHTML = rv5UiIcon("edit", 10);
        tBtn.addEventListener("mouseenter", () => { tBtn.style.opacity = "1"; });
        tBtn.addEventListener("mouseleave", () => { tBtn.style.opacity = "0.74"; });
        tBtn.addEventListener("click", (ev) => {
          if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
          if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
          const liveIm = (wrap && typeof wrap.querySelector === "function" && wrap.querySelector("img")) || im;
          onEditImage({ imgEl: liveIm, fromLightbox: false, thumbWrapper: wrap });
        });
        wrap.appendChild(tBtn);
      }
    }
  } catch (_e) {}
}

/**
 * Safely injects a clean, native-looking "Rudex Studio" entry inside Antigravity's Settings navigation
 * and a quick button inside Antigravity's native "Customization" screen.
 */
function rv5InjectNativeSettingsEntries(doc, isRu, onOpenTab) {
  if (!doc || typeof doc.querySelectorAll !== "function") return;
  try {
    // 1. Native Settings sidebar/dialog navigation — inject AT MOST ONCE into the deepest settings nav list
    const existingEntries = doc.querySelectorAll('[data-rudex-native-entry="settings"]');
    if (existingEntries && existingEntries.length > 1) {
      for (let k = 1; k < existingEntries.length; k += 1) {
        if (existingEntries[k] && existingEntries[k].parentNode) {
          existingEntries[k].parentNode.removeChild(existingEntries[k]);
        }
      }
    }
    if (!existingEntries || existingEntries.length === 0) {
      const candidates = doc.querySelectorAll('nav, [role="tablist"], [role="dialog"] aside, [role="dialog"] div, main aside');
      const matchesNav = (el) => {
        if (!el || (el.closest && el.closest("#rudex-studio-host"))) return false;
        const items = el.querySelectorAll("button, a, [role='tab']");
        if (items.length < 2 || items.length > 20) return false;
        const txt = (el.textContent || "").toLowerCase();
        if (txt.length > 700) return false;
        const hasCoreA = txt.includes("модели") || txt.includes("models") || txt.includes("браузер") || txt.includes("browser") || txt.includes("горячие клавиши") || txt.includes("keybindings");
        const hasCoreB = txt.includes("основные") || txt.includes("общие") || txt.includes("general") || txt.includes("внешний вид") || txt.includes("оформление") || txt.includes("appearance") || txt.includes("уведомления") || txt.includes("notifications");
        return hasCoreA && hasCoreB;
      };
      // Pick the deepest / tightest matching container (avoids outer sidebar wrappers & footer profile/feedback sections)
      let bestNav = null;
      let bestScore = Infinity;
      for (let i = 0; i < candidates.length; i += 1) {
        const nav = candidates[i];
        if (!matchesNav(nav)) continue;
        // Skip if a child inside nav already matches the settings nav list
        let hasChildMatch = false;
        for (let j = 0; j < candidates.length; j += 1) {
          if (i !== j && candidates[j] && typeof nav.contains === "function" && nav.contains(candidates[j]) && matchesNav(candidates[j])) {
            hasChildMatch = true;
            break;
          }
        }
        if (hasChildMatch) continue;
        const score = (nav.textContent || "").length;
        if (score < bestScore) {
          bestScore = score;
          bestNav = nav;
        }
      }
      if (bestNav) {
        const items = bestNav.querySelectorAll("button, a, [role='tab']");
        const sampleBtn = items[0];
        const btn = doc.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-rudex-native-entry", "settings");
        btn.setAttribute("data-rudex-ignore", "1");
        if (sampleBtn && sampleBtn.className) {
          btn.className = sampleBtn.className.replace(/\bbg-[^\s]+/g, "").trim();
        }
        btn.style.cssText = "display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;margin-top:4px;border-radius:7px;border:1px solid rgba(128,128,128,0.22);background:transparent;color:inherit;cursor:pointer;font-size:13px;font-weight:500;text-align:left;";
        btn.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:4px;background:var(--primary, #d97757);color:#fff;font-size:10.5px;font-weight:700;flex-shrink:0">R</span><span>${isRu ? "Rudex Studio" : "Rudex Studio"}</span>`;
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          try {
            const parentDlg = btn.closest && btn.closest('[role="dialog"]');
            if (parentDlg && typeof parentDlg.querySelector === "function") {
              const closeBtn = parentDlg.querySelector('button[aria-label*="Close" i], button[aria-label*="Закры" i], button[data-slot="dialog-close"]');
              if (closeBtn && typeof closeBtn.click === "function") closeBtn.click();
            }
          } catch (_e) {}
          if (typeof onOpenTab === "function") onOpenTab("appearance");
        });
        bestNav.appendChild(btn);
      }
    }

    // 2. Native Customization page header ("Кастомизация" / "Customization")
    const headings = doc.querySelectorAll("main h1, main h2, header h1, header h2");
    for (let i = 0; i < headings.length; i += 1) {
      const h = headings[i];
      if (!h || (h.closest && h.closest("#rudex-studio-host"))) continue;
      const hTxt = (h.textContent || "").trim().toLowerCase();
      if (hTxt !== "кастомизация" && hTxt !== "customization" && hTxt !== "customizations") continue;
      const parent = h.parentElement;
      if (!parent || parent.querySelector('[data-rudex-native-entry="workshop"]')) continue;
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-rudex-native-entry", "workshop");
      btn.setAttribute("data-rudex-ignore", "1");
      btn.style.cssText = "margin-left:12px;padding:4px 10px;border-radius:7px;border:1px solid rgba(128,128,128,0.28);background:transparent;color:inherit;cursor:pointer;font-size:12px;font-weight:550;";
      btn.textContent = isRu ? "Открыть в Rudex Studio" : "Open in Rudex Studio";
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof onOpenTab === "function") onOpenTab("settings", "workshop");
      });
      parent.appendChild(btn);
    }
  } catch (_e) {}
}

/**
 * Renders live mid-turn user supplements anchored directly to the exact conversation turn
 * where each supplement was sent — so they stay in place inside the chat history and NEVER
 * float or stick permanently at the bottom of later messages.
 */
function rv5SyncLiveChatBubbles(doc, ctx) {
  if (!doc || typeof doc.querySelectorAll !== "function") return;
  const { liveEdits, liveEditInline, dismissedIds, isRu, isLight, accentColor, onCancel, onDismiss } = ctx || {};
  const le = Object.assign({}, RUDEX_LIVE_EDIT_DEFAULTS, liveEditInline || {});
  const styleId = "rudex-live-chat-style";
  const slotAttr = "data-rudex-live-slot";

  // Clean up any legacy monolithic bottom container if present
  const legacyMount = typeof doc.getElementById === "function" ? doc.getElementById("rudex-live-chat-bubbles") : null;
  if (legacyMount && legacyMount.parentNode) legacyMount.parentNode.removeChild(legacyMount);

  const removeAllSlots = () => {
    const oldSlots = doc.querySelectorAll(`[${slotAttr}]`);
    for (let i = 0; oldSlots && i < oldSlots.length; i += 1) {
      if (oldSlots[i] && oldSlots[i].parentNode) oldSlots[i].parentNode.removeChild(oldSlots[i]);
    }
  };

  const dismissed = dismissedIds || new Set();
  const visibleItems = le.enabled && le.showInChat !== false
    ? (liveEdits || []).filter((it) => {
        if (!it || dismissed.has(it.id)) return false;
        if (it.status === "expired") return false;
        if (it.status === "pending") return true;
        // Require stable anchorUserText for delivered edits so virtualized DOM recycling NEVER attaches old edits to a brand-new message!
        return typeof it.anchorUserText === "string" && it.anchorUserText.trim().length > 0;
      }).slice(-10)
    : [];

  if (visibleItems.length === 0) {
    removeAllSlots();
    return;
  }

  // Inject lightweight stylesheet once
  const acc = accentColor || "#d97757";
  const styleText = `
@keyframes rudexLivePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.84); } }
[${slotAttr}] {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  width: 100%;
  max-width: var(--rudex-chat-max-w, 768px);
  margin: 6px auto 12px auto;
  padding: 0 4px;
  box-sizing: border-box;
  pointer-events: auto;
}
[${slotAttr}] .rx-cb-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  max-width: min(82%, 580px);
}
[${slotAttr}][data-align="left"] {
  align-items: flex-start;
}
[${slotAttr}][data-align="left"] .rx-cb-item {
  align-items: flex-start;
}
[${slotAttr}][data-align="full"] {
  align-items: stretch;
}
[${slotAttr}][data-align="full"] .rx-cb-item {
  align-items: stretch;
  max-width: 100%;
  width: 100%;
}
[${slotAttr}][data-align="full"] .rx-cb-imgs,
[${slotAttr}][data-align="full"] .rx-cb-files,
[${slotAttr}][data-align="left"] .rx-cb-imgs,
[${slotAttr}][data-align="left"] .rx-cb-files {
  justify-content: flex-start;
}
[${slotAttr}] .rx-cb-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}
[${slotAttr}][data-theme="dark"] .rx-cb-bubble.is-native {
  background: var(--rx-cb-bg, var(--card, #262624)) !important;
  color: var(--rx-cb-fg, var(--foreground, #f4f3ee)) !important;
  border: var(--rx-cb-border, 1px solid var(--border, rgba(255, 255, 255, 0.11))) !important;
  border-left: var(--rx-cb-border-left, var(--rx-cb-border, 1px solid var(--border, rgba(255, 255, 255, 0.11)))) !important;
  border-radius: var(--rx-cb-radius, 16px) !important;
  box-shadow: var(--rx-cb-shadow, none);
}
[${slotAttr}][data-theme="light"] .rx-cb-bubble.is-native {
  background: var(--rx-cb-bg, var(--card, #ffffff)) !important;
  color: var(--rx-cb-fg, var(--foreground, #141413)) !important;
  border: var(--rx-cb-border, 1px solid var(--border, rgba(20, 20, 19, 0.16))) !important;
  border-left: var(--rx-cb-border-left, var(--rx-cb-border, 1px solid var(--border, rgba(20, 20, 19, 0.16)))) !important;
  border-radius: var(--rx-cb-radius, 16px) !important;
  box-shadow: var(--rx-cb-shadow, 0 1px 4px rgba(15, 23, 42, 0.06));
}
[${slotAttr}] .rx-cb-bubble.is-accent {
  background: color-mix(in srgb, ${acc} ${isLight ? "14%" : "12%"}, ${isLight ? "#ffffff" : "#222120"}) !important;
  color: ${isLight ? "#141413" : "#faf9f5"} !important;
  border: 1px solid color-mix(in srgb, ${acc} ${isLight ? "52%" : "44%"}, transparent) !important;
}
[${slotAttr}] .rx-cb-bubble.is-subtle {
  padding: 6px 11px;
  border-radius: 11px;
  font-size: 12.5px;
  background: ${isLight ? "rgba(20, 20, 19, 0.065)" : "rgba(255, 255, 255, 0.05)"} !important;
  color: ${isLight ? "#1b1a18" : "#d8d6cf"} !important;
  border: 1px dashed ${isLight ? "rgba(20, 20, 19, 0.24)" : "rgba(255, 255, 255, 0.16)"} !important;
}
[${slotAttr}] .rx-cb-imgs {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 4px;
}
[${slotAttr}] .rx-cb-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(128,128,128,0.28);
}
[${slotAttr}] .rx-cb-files {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
  margin-bottom: 3px;
}
[${slotAttr}] .rx-cb-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 11.5px;
  background: ${isLight ? "rgba(20, 20, 19, 0.075)" : "rgba(255, 255, 255, 0.08)"} !important;
  color: ${isLight ? "#141413" : "#e8e6df"} !important;
  border: 1px solid ${isLight ? "rgba(20, 20, 19, 0.18)" : "rgba(255, 255, 255, 0.14)"} !important;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[${slotAttr}] .rx-cb-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
  font-size: 11px;
  color: ${isLight ? "rgba(20, 20, 19, 0.68)" : "rgba(250, 249, 245, 0.56)"} !important;
}
[${slotAttr}] .rx-cb-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${acc};
  animation: rudexLivePulse 1.3s ease-in-out infinite;
  display: inline-block;
}
[${slotAttr}] .rx-cb-done {
  color: ${isLight ? "#15803d" : "#34d399"} !important;
  font-weight: 600;
}
[${slotAttr}] .rx-cb-act {
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
}
[${slotAttr}] .rx-cb-act:hover {
  opacity: 1;
  background: rgba(128,128,128,0.16);
}
`;
  let styleEl = typeof doc.getElementById === "function" ? doc.getElementById(styleId) : null;
  if (!styleEl && doc.head) {
    styleEl = doc.createElement("style");
    styleEl.id = styleId;
    doc.head.appendChild(styleEl);
  }
  if (styleEl && styleEl.textContent !== styleText) {
    styleEl.textContent = styleText;
  }

  // Collect visible agent-response & user-message turns inside the active chat
  const rawResps = doc.querySelectorAll('[data-testid="agent-response"]');
  const resps = [];
  for (let i = 0; rawResps && i < rawResps.length; i += 1) {
    const r = rawResps[i];
    if (!r || (r.closest && r.closest("#rudex-studio-host"))) continue;
    resps.push(r);
  }
  const rawUsers = doc.querySelectorAll('[data-testid="user-message-bubble"], [data-testid="user-message-content"]');
  const users = [];
  for (let i = 0; rawUsers && i < rawUsers.length; i += 1) {
    const u = rawUsers[i];
    if (!u || (u.closest && u.closest("#rudex-studio-host"))) continue;
    if (u.getAttribute && u.getAttribute("data-testid") === "user-message-content" && u.closest && u.closest('[data-testid="user-message-bubble"]')) continue;
    users.push(u);
  }

  const win = doc.defaultView || (typeof window !== "undefined" ? window : null);

  // Climb from a user-message bubble out of any horizontal flex-row wrapper so the supplement stacks cleanly right underneath it
  const resolveBlockAnchor = (el) => {
    if (!el) return null;
    let cur = el;
    let depth = 0;
    while (cur && cur.parentElement && depth < 5) {
      const parent = cur.parentElement;
      if (parent === doc.body || parent === doc.documentElement || parent.tagName === "MAIN") break;
      // Stop before climbing into a container that already holds an agent-response or multiple user messages
      if (typeof parent.querySelectorAll === "function") {
        const hasResp = Boolean(parent.querySelector && parent.querySelector('[data-testid="agent-response"]'));
        if (hasResp) break;
        const multiUsers = parent.querySelectorAll('[data-testid="user-message-content"]');
        if (multiUsers && multiUsers.length > 1) break;
      }
      let isRowParent = false;
      try {
        const pcs = win && typeof win.getComputedStyle === "function" ? win.getComputedStyle(parent) : null;
        if (pcs && pcs.display && pcs.display.includes("flex") && pcs.flexDirection !== "column" && pcs.flexDirection !== "column-reverse") {
          isRowParent = true;
        }
      } catch (_e) {}
      if (isRowParent) {
        cur = parent;
        depth += 1;
        continue;
      }
      break;
    }
    return cur;
  };

  // Group visible live edits by their exact turn anchor element (matched by user message text so virtualized DOM never shifts old edits onto new messages)
  const normAnchorTxt = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 120).toLowerCase();
  const userTexts = users.map((u) => normAnchorTxt(u && u.textContent));
  const findMatchedUserIdx = (targetText) => {
    const needle = normAnchorTxt(targetText);
    if (!needle) return -1;
    for (let j = userTexts.length - 1; j >= 0; j -= 1) {
      const hay = userTexts[j];
      if (!hay) continue;
      if (hay === needle) return j;
      const minLen = Math.min(hay.length, needle.length);
      if (minLen >= 16 && (hay.startsWith(needle) || needle.startsWith(hay))) return j;
    }
    return -1;
  };
  const findFollowingResp = (userNode, fallbackIdx) => {
    if (userNode && typeof userNode.compareDocumentPosition === "function") {
      for (let r = 0; r < resps.length; r += 1) {
        if (resps[r] && (userNode.compareDocumentPosition(resps[r]) & 4)) {
          return resps[r];
        }
      }
    }
    return resps[fallbackIdx] || null;
  };
  const preferAgent = le.chatBubblePos === "after-agent";
  const groups = new Map(); // key -> { anchorEl, refBubbleEl, items: [] }
  for (let i = 0; i < visibleItems.length; i += 1) {
    const it = visibleItems[i];
    let anchorEl = null;
    let refBubbleEl = null;
    let slotKey = "";
    const matchedUserIdx = findMatchedUserIdx(it.anchorUserText);
    const hasTextAnchor = typeof it.anchorUserText === "string" && it.anchorUserText.trim().length > 0;
    const rIdx = typeof it.anchorRespIdx === "number" && it.anchorRespIdx >= 0 ? it.anchorRespIdx : -1;

    if (hasTextAnchor) {
      if (matchedUserIdx >= 0 && users[matchedUserIdx]) {
        refBubbleEl = users[matchedUserIdx];
        const nextResp = preferAgent ? findFollowingResp(users[matchedUserIdx], matchedUserIdx) : null;
        if (preferAgent && nextResp) {
          anchorEl = nextResp;
          slotKey = `resp-${matchedUserIdx}`;
        } else {
          anchorEl = resolveBlockAnchor(users[matchedUserIdx]);
          slotKey = `user-${matchedUserIdx}`;
        }
      } else if (it.status === "pending" && users.length > 0) {
        refBubbleEl = users[users.length - 1];
        anchorEl = resolveBlockAnchor(refBubbleEl);
        slotKey = `user-${users.length - 1}`;
      } else {
        // The anchored past user message is scrolled/virtualized out of DOM: never re-attach to a different newer message!
        continue;
      }
    } else if (it.status === "pending") {
      if (users.length > 0) refBubbleEl = users[users.length - 1];
      if (preferAgent && resps.length > 0) {
        anchorEl = resps[resps.length - 1];
        slotKey = `resp-${resps.length - 1}`;
      } else if (users.length > 0) {
        anchorEl = resolveBlockAnchor(users[users.length - 1]);
        slotKey = `user-${users.length - 1}`;
      } else if (rIdx >= 0 && resps[rIdx]) {
        anchorEl = resps[rIdx];
        slotKey = `resp-${rIdx}`;
      }
    }
    if (!anchorEl) continue;
    if (!groups.has(slotKey)) groups.set(slotKey, { anchorEl, refBubbleEl, items: [] });
    groups.get(slotKey).items.push(it);
  }

  // Helper: sample exact visual styling of the live native user bubble so live-edit bubbles match 1-to-1 in every theme & UI style
  const isNonTransparentBg = (val) => {
    const s = String(val || "").trim().toLowerCase();
    if (!s || s === "transparent" || s === "none") return false;
    const m = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)$/.exec(s);
    if (m && parseFloat(m[1]) <= 0.02) return false;
    return true;
  };
  const findStyledBubbleNode = (el) => {
    if (!el || !win || typeof win.getComputedStyle !== "function") return null;
    let cur = el;
    for (let depth = 0; cur && depth < 4; depth += 1) {
      if (cur === doc.body || cur === doc.documentElement) break;
      try {
        const cs = win.getComputedStyle(cur);
        if (cs && isNonTransparentBg(cs.backgroundColor)) return { el: cur, cs };
      } catch (_e) {}
      cur = cur.parentElement;
    }
    return null;
  };

  // Remove slots that are no longer needed
  const existingSlots = doc.querySelectorAll(`[${slotAttr}]`);
  const slotByKey = new Map();
  for (let i = 0; existingSlots && i < existingSlots.length; i += 1) {
    const sl = existingSlots[i];
    const k = sl && sl.getAttribute ? sl.getAttribute(slotAttr) : "";
    if (!k || !groups.has(k)) {
      if (sl && sl.parentNode) sl.parentNode.removeChild(sl);
    } else {
      slotByKey.set(k, sl);
    }
  }

  const styleVariant = le.chatBubbleStyle === "accent" || le.chatBubbleStyle === "subtle" ? le.chatBubbleStyle : "native";
  const showDeliveredBadge = le.showDeliveredBadge !== false;
  groups.forEach((grp, slotKey) => {
    let slot = slotByKey.get(slotKey);
    if (!slot) {
      slot = doc.createElement("div");
      slot.setAttribute(slotAttr, slotKey);
      slot.setAttribute("data-rudex-ignore", "1");
      slot.setAttribute("data-rudex-live-bubbles", "1");
    }
    // Mount immediately after the exact anchored turn block (never floating to the bottom of later turns!)
    const hostParent = grp.anchorEl.parentNode;
    if (hostParent && slot.parentNode !== hostParent) {
      if (typeof hostParent.insertBefore === "function") {
        let refNode = grp.anchorEl.nextSibling || null;
        if (!refNode && hostParent.childNodes) {
          const idx = Array.prototype.indexOf.call(hostParent.childNodes, grp.anchorEl);
          if (idx >= 0 && idx + 1 < hostParent.childNodes.length) refNode = hostParent.childNodes[idx + 1];
        }
        hostParent.insertBefore(slot, refNode);
      } else if (typeof grp.anchorEl.appendChild === "function") {
        grp.anchorEl.appendChild(slot);
      }
    }
    slot.setAttribute("data-theme", isLight ? "light" : "dark");

    // Sync exact color, border, radius and alignment from the live user message bubble above this slot
    const refSample = findStyledBubbleNode(grp.refBubbleEl || (users.length > 0 ? users[users.length - 1] : null));
    if (slot.style && typeof slot.style.setProperty === "function") {
      const setVar = (name, val) => {
        if (val) slot.style.setProperty(name, val);
        else if (typeof slot.style.removeProperty === "function") slot.style.removeProperty(name);
      };
      if (refSample && refSample.cs) {
        const cs = refSample.cs;
        setVar("--rx-cb-bg", isNonTransparentBg(cs.backgroundColor) ? cs.backgroundColor : "");
        setVar("--rx-cb-fg", cs.color && cs.color !== "rgba(0, 0, 0, 0)" ? cs.color : "");
        const btw = parseFloat(cs.borderTopWidth || "0");
        const bts = cs.borderTopStyle && cs.borderTopStyle !== "none" ? cs.borderTopStyle : "solid";
        const btc = cs.borderTopColor || "";
        setVar("--rx-cb-border", btw > 0 && btc ? `${cs.borderTopWidth} ${bts} ${btc}` : "none");
        const blw = parseFloat(cs.borderLeftWidth || "0");
        const bls = cs.borderLeftStyle && cs.borderLeftStyle !== "none" ? cs.borderLeftStyle : "solid";
        const blc = cs.borderLeftColor || "";
        setVar("--rx-cb-border-left", blw > 0 && blc ? `${cs.borderLeftWidth} ${bls} ${blc}` : (btw > 0 && btc ? `${cs.borderTopWidth} ${bts} ${btc}` : "none"));
        setVar("--rx-cb-radius", cs.borderRadius && cs.borderRadius !== "0px" ? cs.borderRadius : "");
        setVar("--rx-cb-shadow", cs.boxShadow && cs.boxShadow !== "none" ? cs.boxShadow : "none");

        // Match alignment (OpenCode full-width or left-aligned chat styles)
        let alignVal = "right";
        try {
          if (typeof refSample.el.getBoundingClientRect === "function" && typeof slot.getBoundingClientRect === "function") {
            const rr = refSample.el.getBoundingClientRect();
            const sr = slot.getBoundingClientRect();
            if (rr && sr && sr.width > 240 && rr.width > 0) {
              if (rr.width >= sr.width * 0.9) alignVal = "full";
              else if (rr.left - sr.left <= 24 && sr.right - rr.right >= 64) alignVal = "left";
            }
          }
        } catch (_e) {}
        slot.setAttribute("data-align", alignVal);
      } else {
        setVar("--rx-cb-bg", "");
        setVar("--rx-cb-fg", "");
        setVar("--rx-cb-border", "");
        setVar("--rx-cb-border-left", "");
        setVar("--rx-cb-radius", "");
        setVar("--rx-cb-shadow", "");
        slot.setAttribute("data-align", "right");
      }
    }

    const nextHtml = grp.items.map((it) => {
      const isDone = it.status === "delivered" || it.status === "applied";
      const rawImgs = Array.isArray(it.images) ? it.images.filter(Boolean) : [];
      const previewImgs = rawImgs.filter((im) => im.previewDataUrl || im.dataUrl);
      const fallbackImgChips = rawImgs.filter((im) => !(im.previewDataUrl || im.dataUrl));
      const rawFiles = Array.isArray(it.files) ? it.files.filter(Boolean) : [];
      const textVal = String(it.text || "").trim();
      const imgHtml = previewImgs.length > 0
        ? `<div class="rx-cb-imgs">${previewImgs.map((im) => `<img class="rx-cb-img" src="${rv5EscapeHtml(im.previewDataUrl || im.dataUrl)}" alt=""/>`).join("")}</div>`
        : "";
      const fileChipsHtml = (fallbackImgChips.length > 0 || rawFiles.length > 0)
        ? `<div class="rx-cb-files">${fallbackImgChips.map((im) => `<span class="rx-cb-file-chip">${rv5UiIcon("image", 11)}<span>${rv5EscapeHtml(im.name || "screenshot.png")}</span></span>`).join("")}${rawFiles.map((fl) => `<span class="rx-cb-file-chip">${rv5UiIcon("file", 11)}<span>${rv5EscapeHtml(fl.name || "file")}</span></span>`).join("")}</div>`
        : "";
      const metaHtml = !isDone
        ? `<div class="rx-cb-meta"><span class="rx-cb-dot"></span><span>${isRu ? "Дополнение · в очереди" : "Live edit · queued"}</span><button type="button" class="rx-cb-act" data-rx-cb-act="cancel" data-id="${rv5EscapeHtml(it.id)}">${isRu ? "Отменить" : "Cancel"}</button></div>`
        : (showDeliveredBadge
            ? `<div class="rx-cb-meta"><span class="rx-cb-done">${rv5UiIcon("check", 11)}<span>${isRu ? "Учтено агентом" : "Applied by agent"}</span></span></div>`
            : "");
      return `
        <div class="rx-cb-item" data-live-id="${rv5EscapeHtml(it.id)}">
          ${imgHtml}
          ${fileChipsHtml}
          ${textVal ? `<div class="rx-cb-bubble is-${styleVariant}">${rv5EscapeHtml(textVal)}</div>` : ""}
          ${metaHtml}
        </div>
      `;
    }).join("");

    if (slot.innerHTML !== nextHtml) {
      slot.innerHTML = nextHtml;
    }
    slot._rxOnCancel = onCancel;
    slot._rxOnDismiss = onDismiss;
    if (!slot._rxBoundClick) {
      slot._rxBoundClick = true;
      slot.addEventListener("click", (ev) => {
        const t = ev && ev.target && typeof ev.target.closest === "function" ? ev.target.closest("[data-rx-cb-act]") : null;
        if (!t) return;
        if (typeof ev.preventDefault === "function") ev.preventDefault();
        if (typeof ev.stopPropagation === "function") ev.stopPropagation();
        const act = t.getAttribute("data-rx-cb-act");
        const id = t.getAttribute("data-id");
        if (act === "cancel" && typeof slot._rxOnCancel === "function" && id) slot._rxOnCancel(id);
        else if (act === "dismiss" && typeof slot._rxOnDismiss === "function" && id) slot._rxOnDismiss(id);
      });
    }
  });
}

function rv5FormatBytesShort(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function rv5FormatHistTime(ts, isRu) {
  const d = new Date(Number(ts) || 0);
  if (!ts || Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleString(isRu ? "ru-RU" : "en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_e) {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
}

/**
 * Renders Settings -> Input History & Auto-Saved Composer Drafts subtab.
 */
function rv5RenderInputHistoryHtml(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const isRu = c.isRu !== false;
  const draftsOn = c.composerDraftsEnabled !== false;
  const historyOn = c.inputHistoryEnabled !== false;
  const draftCount = Number(c.draftCount) || 0;
  const items = Array.isArray(c.items) ? c.items : [];
  const searchQuery = String(c.searchQuery || "").trim().toLowerCase();
  const filteredItems = searchQuery
    ? items.filter((it) => {
        const hay = `${it.text || ""} ${it.chatTitle || ""} ${(it.attachments || []).map((a) => a.name || "").join(" ")}`.toLowerCase();
        return hay.includes(searchQuery);
      })
    : items;
  const loading = Boolean(c.loading);

  return `
    <div class="section-group">
      <span class="section-label">${isRu ? "Черновики и история ввода" : "Composer Drafts & Input History"}</span>
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Автосохранение черновиков (текст и файлы)" : "Auto-save chat drafts (text & files)"}</span>
            <span class="row-desc">${isRu
              ? "Бессрочно сохраняет введённый текст и прикреплённые файлы отдельно для каждого чата и Нового чата. Моментально восстанавливает их после перезапуска или принудительного закрытия Antigravity."
              : "Permanently preserves typed text & attached files per chat (including New Chat) and restores them instantaneously after restarts or forced close."}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            ${draftCount > 0 ? `<button type="button" class="btn btn-sm btn-ghost" data-action="clear-all-drafts" title="${isRu ? "Очистить сохранённые черновики" : "Clear saved drafts"}">${isRu ? `Очистить (${draftCount})` : `Clear (${draftCount})`}</button>` : ""}
            <button type="button" class="switch${draftsOn ? " is-on" : ""}" role="switch" aria-checked="${draftsOn ? "true" : "false"}" data-action="toggle-composer-drafts"><span class="switch-thumb"></span></button>
          </div>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "История последних 20 сообщений и файлов" : "Keep history of last 20 messages & files"}</span>
            <span class="row-desc">${isRu
              ? "Запоминает последние 20 отправленных сообщений вместе со скриншотами и файлами для быстрого копирования."
              : "Stores your last 20 sent messages along with screenshots & files for one-click copy or reuse."}</span>
          </div>
          <button type="button" class="switch${historyOn ? " is-on" : ""}" role="switch" aria-checked="${historyOn ? "true" : "false"}" data-action="toggle-input-history"><span class="switch-thumb"></span></button>
        </div>
      </div>
    </div>

    <div class="section-group">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <span class="section-label" data-role="historyCount" data-total="${items.length}">${isRu ? `Последние сообщения (${filteredItems.length} / ${items.length})` : `Recent messages (${filteredItems.length} / ${items.length})`}</span>
        <div style="display:flex;gap:6px;align-items:center">
          <input type="text" class="text-input" style="width:170px;padding:4px 8px;font-size:11.5px" data-role="historySearch" value="${rv5EscapeHtml(c.searchQuery || "")}" placeholder="${isRu ? "Фильтр по тексту…" : "Filter messages…"}"/>
          <button type="button" class="btn btn-sm btn-ghost" data-action="refresh-input-history">${isRu ? "Обновить" : "Refresh"}</button>
          ${items.length > 0 ? `<button type="button" class="btn btn-sm btn-danger" data-action="clear-input-history">${isRu ? "Очистить всё" : "Clear all"}</button>` : ""}
        </div>
      </div>

      ${loading && items.length === 0 ? `<div class="empty-msg">${isRu ? "Загрузка истории…" : "Loading history…"}</div>` : ""}

      ${!loading && filteredItems.length === 0 ? `
        <div class="empty-msg">${searchQuery
          ? (isRu ? "По этому запросу ничего не найдено." : "No messages match your filter.")
          : (historyOn
              ? (isRu ? "История пока пуста — отправленные вами сообщения и прикреплённые файлы появятся здесь автоматически." : "No messages recorded yet — your sent prompts & attachments will appear here automatically.")
              : (isRu ? "Запись истории отключена. Включите тумблер выше, чтобы сохранять последние 20 сообщений." : "Input history is paused. Enable the toggle above to record your last 20 messages."))}</div>
      ` : ""}

      ${filteredItems.length > 0 ? `
        <div class="empty-msg" data-role="historyFilterEmpty" style="display:none">${isRu ? "По этому запросу ничего не найдено." : "No messages match your filter."}</div>
        <div class="rx-hist-list" data-role="historyList">
          ${filteredItems.map((it) => {
            const atts = Array.isArray(it.attachments) ? it.attachments : [];
            const hasText = Boolean(it.text && String(it.text).trim());
            const chatLabel = it.chatTitle || (it.chatKey === "__new__" ? (isRu ? "Новый чат" : "New chat") : (isRu ? "Чат" : "Chat"));
            const timeLabel = rv5FormatHistTime(it.createdAt, isRu);
            const searchHay = [String(it.text || ""), String(chatLabel || "")].concat(atts.map((a) => String((a && a.name) || ""))).join(" ").toLowerCase();
            return `
              <div class="rx-hist-card" data-history-id="${rv5EscapeHtml(it.id)}" data-hist-search="${rv5EscapeHtml(searchHay)}">
                <div class="rx-hist-head">
                  <div class="rx-hist-meta">
                    <span class="rx-hist-chat" title="${rv5EscapeHtml(chatLabel)}">${rv5EscapeHtml(chatLabel)}</span>
                    ${it.source === "live-edit" ? `<span class="rx-hist-badge">${isRu ? "На лету" : "Live"}</span>` : ""}
                    ${timeLabel ? `<span>· ${rv5EscapeHtml(timeLabel)}</span>` : ""}
                  </div>
                  <div class="rx-hist-actions">
                    ${hasText ? `<button type="button" class="btn btn-sm" data-action="copy-history-text" data-id="${rv5EscapeHtml(it.id)}">${rv5UiIcon("copy", 12)}<span>${isRu ? "Текст" : "Copy"}</span></button>` : ""}
                    <button type="button" class="btn btn-sm btn-ghost" data-action="insert-history-item" data-id="${rv5EscapeHtml(it.id)}" title="${isRu ? "Вставить текст и файлы в поле ввода" : "Insert text & files into composer"}">↩ ${isRu ? "В чат" : "Insert"}</button>
                    <button type="button" class="icon-btn" data-action="delete-history-item" data-id="${rv5EscapeHtml(it.id)}" title="${isRu ? "Удалить" : "Delete"}">${rv5UiIcon("close", 12)}</button>
                  </div>
                </div>
                ${hasText ? `<pre class="rx-hist-text">${rv5EscapeHtml(it.text)}</pre>` : ""}
                ${atts.length > 0 ? `
                  <div class="rx-hist-atts">
                    ${atts.map((att) => `
                      <div class="rx-hist-att">
                        ${att.previewDataUrl
                          ? `<img class="rx-hist-thumb" src="${rv5EscapeHtml(att.previewDataUrl)}" alt=""/>`
                          : `<span class="rx-hist-file-ico">${rv5UiIcon(att.isImage ? "image" : "file", 15)}</span>`}
                        <div class="rx-hist-att-info">
                          <span class="rx-hist-att-name" title="${rv5EscapeHtml(att.name)}">${rv5EscapeHtml(att.name)}</span>
                          <span class="rx-hist-att-size">${rv5EscapeHtml(rv5FormatBytesShort(att.sizeBytes))}</span>
                        </div>
                        ${att.exists !== false ? `
                          <button type="button" class="btn btn-sm" data-action="copy-history-file" data-file="${rv5EscapeHtml(att.fileName)}" data-name="${rv5EscapeHtml(att.name)}" data-mime="${rv5EscapeHtml(att.mime)}" data-is-img="${att.isImage ? "1" : "0"}" title="${isRu ? "Скопировать в буфер обмена (Ctrl+V)" : "Copy to clipboard (Ctrl+V)"}">${rv5UiIcon("copy", 12)}<span>${isRu ? "Копир." : "Copy"}</span></button>
                          <button type="button" class="icon-btn" data-action="reveal-history-file" data-file="${rv5EscapeHtml(att.fileName)}" title="${isRu ? "Показать в папке" : "Reveal in folder"}">${rv5UiIcon("folder", 12)}</button>
                        ` : `<span class="rx-hist-att-size">${isRu ? "удалён" : "missing"}</span>`}
                      </div>
                    `).join("")}
                  </div>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    rv5FontSelectOptions,
    rv5RenderDetailedTypographyHtml,
    rv5RenderBorderPresetSectionHtml,
    rv5RenderElementsBuilderHtml,
    rv5BuildElementInspectorHtml,
    rv5RenderAgentHubTabHtml,
    rv5RenderLimitsTabHtml,
    rv5RenderKeybindingsHtml,
    rv5RenderWorkshopHtml,
    rv5RenderInputHistoryHtml,
    rv5BuildChatDockHtml,
    rv5InjectImageEditTriggers,
    rv5SyncLiveChatBubbles,
    rv5InjectNativeSettingsEntries,
  };
}
