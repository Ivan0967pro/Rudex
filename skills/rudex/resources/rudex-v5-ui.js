"use strict";

/**
 * Rudex 5.0 UI Builders & Native Host Integrations (browser-safe, zero Node imports).
 * Depends on helpers from rudex-v5-core.js and theme-engine.js.
 */

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
    <details class="rx-details-block" open>
      <summary class="rx-details-summary">
        <span>${isRu ? "Раздельные шрифты по зонам (Интерфейс · Ввод · Агент · Код)" : "Per-Zone Fonts (UI · Input · Agent · Code)"}</span>
        <span style="opacity:.6;font-size:11px">${isRu ? "Детально ▾" : "Detailed ▾"}</span>
      </summary>
      <div class="rx-details-body">
        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "1. Интерфейс (меню, сайдбар, панель ввода)" : "1. Interface (menus, sidebar, toolbar)"}</span>
            <select class="select-input" data-app-field="typography.uiFont">
              ${rv5FontSelectOptions(ty.uiFont || "system", "ui", systemFonts, isRu, false)}
            </select>
            ${ty.uiFont === "custom" ? customInput("uiFontCustom", ty.uiFontCustom) : ""}
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размер UI" : "UI Size"}</span><b class="num">${ty.uiFontSize > 0 ? ty.uiFontSize + "px" : (isRu ? "Авто" : "Auto")}</b></div>
            <input type="range" class="range-input" min="0" max="20" step="1" data-app-field="typography.uiFontSize" value="${ty.uiFontSize || 0}"/>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "2. Твой текст (поле ввода)" : "2. Your Input Text (composer)"}</span>
            <select class="select-input" data-app-field="typography.inputFont">
              ${rv5FontSelectOptions(ty.inputFont || "inherit", "ui", systemFonts, isRu, true)}
            </select>
            ${ty.inputFont === "custom" ? customInput("inputFontCustom", ty.inputFontCustom) : ""}
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размер ввода" : "Input Size"}</span><b class="num">${ty.inputFontSize > 0 ? ty.inputFontSize + "px" : (isRu ? "Как чат" : "Default")}</b></div>
            <input type="range" class="range-input" min="0" max="22" step="1" data-app-field="typography.inputFontSize" value="${ty.inputFontSize || 0}"/>
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
            <div class="slider-head"><span>${isRu ? "Размер агента" : "Agent Size"}</span><b class="num">${ty.agentFontSize > 0 ? ty.agentFontSize + "px" : (isRu ? "Как чат" : "Default")}</b></div>
            <input type="range" class="range-input" min="0" max="22" step="1" data-app-field="typography.agentFontSize" value="${ty.agentFontSize || 0}"/>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "Мои сообщения (пузырь)" : "My Messages (bubble)"}</span>
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
            <div class="slider-head"><span>${isRu ? "Размер кода" : "Code Size"}</span><b class="num">${ty.codeFontSize > 0 ? ty.codeFontSize + "px" : (isRu ? "Авто" : "Auto")}</b></div>
            <input type="range" class="range-input" min="0" max="20" step="1" data-app-field="typography.codeFontSize" value="${ty.codeFontSize || 0}"/>
          </div>
        </div>
      </div>
    </details>
  `;
}

/**
 * Block Border Clarity section (Airy / Crisp default / Contrast + strength slider).
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
      <span class="row-desc" style="margin-top:4px;display:block">${isRu ? "Выделяет пузыри сообщений, шаги и мысли агента, блоки кода и поле ввода для лёгкого чтения." : "Outlines messages, agent steps/thoughts, code blocks and composer for effortless scanning."}</span>
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
      <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div>
            <div class="row-title">${isRu ? "🎯 Прицел — кликни по любому элементу" : "🎯 Live Element Picker"}</div>
            <div class="row-desc">${isRu ? "Измени размер, шрифт, цвета, обводку, скрой или переименуй любой элемент Antigravity." : "Change size, font, colors, borders, hide or rename any Antigravity UI element."}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-sm btn-primary" data-action="start-element-picker">${pickerActive ? (isRu ? "Остановить прицел" : "Stop Picker") : (isRu ? "🎯 Выбрать элемент" : "🎯 Pick Element")}</button>
            <button type="button" class="btn btn-sm" ${canUndo ? "" : "disabled"} data-action="undo-appearance" title="Undo">↶</button>
            <button type="button" class="btn btn-sm" ${canRedo ? "" : "disabled"} data-action="redo-appearance" title="Redo">↷</button>
          </div>
        </div>
        ${overrides.length > 0 ? `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px;border-top:1px solid var(--rx-border)">
            <span class="row-desc">${isRu ? "Временно отключить все правки элементов (Ctrl+Alt+Shift+R)" : "Temporarily pause all element overrides"}</span>
            <button type="button" class="btn btn-sm${paused ? " btn-primary" : ""}" data-action="toggle-overrides-paused">${paused ? (isRu ? "Возобновить правки" : "Resume Overrides") : (isRu ? "Пауза правок" : "Pause All")}</button>
          </div>
        ` : ""}
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "Карта зон интерфейса (быстрая настройка)" : "Interface Zone Map (quick edit)"}</span>
      <div class="rx-zone-grid">
        ${RUDEX_UI_ZONES.map((z) => {
          const hasOv = overrides.some((o) => o.zone === z.id || o.selector === z.selector);
          return `
            <button type="button" class="rx-zone-btn${hasOv ? " is-active" : ""}" data-action="edit-ui-zone" data-zone-id="${rv5EscapeHtml(z.id)}">
              <span>${rv5EscapeHtml(isRu ? z.nameRu : z.nameEn)}</span>
              <span style="opacity:.65;font-size:11px">${hasOv ? "●" : "→"}</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>

    <div class="section-group">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="section-label">${isRu ? `Мои правки стилей (${overrides.length})` : `My Style Overrides (${overrides.length})`}</span>
        ${overrides.length > 0 ? `<button type="button" class="btn btn-sm btn-ghost" data-action="clear-all-overrides">${isRu ? "Сбросить все" : "Clear all"}</button>` : ""}
      </div>
      ${overrides.length === 0
        ? `<div class="empty-msg">${isRu ? "Пока нет точечных правок. Нажмите «🎯 Выбрать элемент» или выберите зону выше." : "No element overrides yet. Click Pick Element or choose a zone above."}</div>`
        : `<div class="card">${overrides.map((ov) => `
            <div class="row-item">
              <div class="row-info" style="min-width:0">
                <span class="row-title">${rv5EscapeHtml(ov.name || ov.selector)}</span>
                <span class="row-desc" style="font-family:var(--rx-font-mono);font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rv5EscapeHtml(ov.selector)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                <button type="button" class="btn btn-sm" data-action="toggle-override-item" data-id="${rv5EscapeHtml(ov.id)}">${ov.enabled !== false ? "👁" : "⊘"}</button>
                <button type="button" class="btn btn-sm" data-action="edit-override-item" data-id="${rv5EscapeHtml(ov.id)}">✎</button>
                <button type="button" class="btn btn-sm" data-action="delete-override-item" data-id="${rv5EscapeHtml(ov.id)}">✕</button>
              </div>
            </div>
          `).join("")}</div>`
      }
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? `Переименование элементов интерфейса (${labels.length})` : `Custom UI Element Labels (${labels.length})`}</span>
      <div class="card card-pad" style="display:flex;flex-direction:column;gap:8px">
        <div class="control-grid-2">
          <input type="text" class="text-input" data-role="newLabelMatch" value="${rv5EscapeHtml(newLabelMatch || "")}" placeholder="${isRu ? "Исходное название (напр. Новый чат)" : "Original text (e.g. New chat)"}"/>
          <input type="text" class="text-input" data-role="newLabelText" value="${rv5EscapeHtml(newLabelText || "")}" placeholder="${isRu ? "Новое название (напр. 🚀 Миссия)" : "New label (e.g. 🚀 Mission)"}"/>
        </div>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm btn-primary" data-action="add-custom-label">${isRu ? "+ Переименовать" : "+ Add Rename"}</button>
        </div>
        ${labels.length > 0 ? labels.map((lb) => `
          <div class="row-item" style="padding:6px 0">
            <span class="row-title" style="font-size:12px"><b>${rv5EscapeHtml(lb.match)}</b> → ${rv5EscapeHtml(lb.label)}</span>
            <div style="display:flex;gap:4px">
              <button type="button" class="btn btn-sm" data-action="toggle-custom-label" data-id="${rv5EscapeHtml(lb.id)}">${lb.enabled !== false ? "✓" : "○"}</button>
              <button type="button" class="btn btn-sm" data-action="delete-custom-label" data-id="${rv5EscapeHtml(lb.id)}">✕</button>
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
function rv5BuildElementInspectorHtml(sel, draft, customLabels, systemFonts, isRu) {
  if (!sel || !sel.selector) return "";
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
  const existingLabel = sel.renameable && sel.origText
    ? (customLabels || []).find((l) => l.match.toLowerCase() === sel.origText.toLowerCase())
    : null;

  return `
    <div class="rx-inspector-card" data-role="elementInspectorCard">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="min-width:0">
          <div style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rv5EscapeHtml(existing.name || sel.name)}</div>
          <div style="font-size:10.5px;opacity:.6;font-family:var(--rx-font-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rv5EscapeHtml(sel.selector)}</div>
        </div>
        <button type="button" class="icon-btn" data-action="close-element-inspector">✕</button>
      </div>

      ${sel.canToggleScope ? `
        <div class="subtab-bar is-segmented">
          <button type="button" class="subtab-btn${sel.scope !== "similar" ? " is-active" : ""}" data-action="inspector-set-scope" data-val="exact">${isRu ? "Этот элемент" : "This element"}</button>
          <button type="button" class="subtab-btn${sel.scope === "similar" ? " is-active" : ""}" data-action="inspector-set-scope" data-val="similar">${isRu ? "Все похожие" : "All similar"}</button>
        </div>
      ` : ""}

      ${sel.renameable && sel.origText ? `
        <div class="section-group">
          <span class="section-label">${isRu ? "Название элемента (переименовать)" : "Element Label (rename)"}</span>
          <div style="display:flex;gap:6px">
            <input type="text" class="text-input" data-role="inspectorRenameInput" value="${rv5EscapeHtml(existingLabel ? existingLabel.label : (sel.currentText || sel.origText))}" placeholder="${rv5EscapeHtml(sel.origText)}"/>
            <button type="button" class="btn btn-sm btn-primary" data-action="inspector-save-rename">${isRu ? "Ок" : "Set"}</button>
          </div>
        </div>
      ` : ""}

      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${isRu ? "Шрифт" : "Font"}</span>
          <select class="select-input" data-insp-style="fontFamily">
            <option value="">${isRu ? "По умолчанию" : "Default"}</option>
            ${rv5FontSelectOptions(st.fontFamily || "", "ui", systemFonts, isRu, false)}
          </select>
        </div>
        <div class="section-group">
          <span class="section-label">${isRu ? "Размер (px)" : "Size (px)"}</span>
          <input type="number" class="text-input" min="0" max="42" data-insp-style="fontSize" value="${st.fontSize || ""}" placeholder="auto"/>
        </div>
      </div>
      ${st.fontFamily === "custom" ? `<input type="text" class="text-input" list="rudex-sys-fonts-list" data-insp-style="fontFamilyCustom" value="${rv5EscapeHtml(st.fontFamilyCustom || "")}" placeholder="${isRu ? "Имя системного шрифта…" : "System font name…"}"/>` : ""}

      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${isRu ? "Цвет текста" : "Text Color"}</span>
          <div class="rx-color-row">
            <input type="color" data-insp-style="color" value="${st.color || "#faf9f5"}"/>
            <button type="button" class="btn btn-sm btn-ghost" data-action="inspector-clear-style" data-prop="color">✕</button>
          </div>
        </div>
        <div class="section-group">
          <span class="section-label">${isRu ? "Цвет фона" : "Background"}</span>
          <div class="rx-color-row">
            <input type="color" data-insp-style="bgColor" value="${st.bgColor || "#262624"}"/>
            <button type="button" class="btn btn-sm btn-ghost" data-action="inspector-clear-style" data-prop="bgColor">✕</button>
          </div>
        </div>
      </div>

      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${isRu ? "Цвет рамки" : "Border Color"}</span>
          <div class="rx-color-row">
            <input type="color" data-insp-style="borderColor" value="${st.borderColor || "#d97757"}"/>
            <input type="number" class="text-input" style="width:52px" min="0" max="6" data-insp-style="borderWidth" value="${st.borderWidth >= 0 ? st.borderWidth : ""}" placeholder="px"/>
          </div>
        </div>
        <div class="section-group">
          <span class="section-label">${isRu ? "Скругление (px)" : "Radius (px)"}</span>
          <input type="number" class="text-input" min="0" max="40" data-insp-style="borderRadius" value="${st.borderRadius >= 0 ? st.borderRadius : ""}" placeholder="auto"/>
        </div>
      </div>

      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${isRu ? "Отступ (padding)" : "Padding (px)"}</span>
          <input type="number" class="text-input" min="0" max="48" data-insp-style="padding" value="${st.padding >= 0 ? st.padding : ""}" placeholder="auto"/>
        </div>
        <div class="section-group">
          <span class="section-label">${isRu ? "Ширина (px)" : "Width (px)"}</span>
          <input type="number" class="text-input" min="0" max="1600" data-insp-style="width" value="${st.width || ""}" placeholder="auto"/>
        </div>
      </div>

      <div class="row-item" style="padding:4px 0">
        <span class="row-title" style="font-size:12px">${isRu ? "Скрыть этот элемент" : "Hide this element"}</span>
        <button type="button" class="switch${st.hidden ? " is-on" : ""}" role="switch" aria-checked="${st.hidden ? "true" : "false"}" data-action="inspector-toggle-hidden"><span class="switch-thumb"></span></button>
      </div>

      <div style="display:flex;justify-content:space-between;gap:6px;padding-top:6px;border-top:1px solid var(--rx-border)">
        <button type="button" class="btn btn-sm" data-action="inspector-reset-element">${isRu ? "Сбросить" : "Reset"}</button>
        <button type="button" class="btn btn-sm btn-primary" data-action="close-element-inspector">${isRu ? "Готово" : "Done"}</button>
      </div>
    </div>
  `;
}

/**
 * Tab 1: Unified Agent Hub (Presets + Default for New Chats + Feature Toggles + Inline Live Edits + Persona).
 */
function rv5RenderAgentHubTabHtml(ctx) {
  const { agentProfile, defaultProfile, customPresets, liveEditInline, thinkingRu, personaHtml, isRu, newAgentPresetName } = ctx;
  const ap = rv5NormalizeAgentProfile(agentProfile);
  const le = Object.assign({}, RUDEX_LIVE_EDIT_DEFAULTS, liveEditInline || {});
  const isDefaultForNew = Boolean(defaultProfile && defaultProfile.applyToNewChats && defaultProfile.enabled);

  const seg = (field, cur, items) => `
    <div class="subtab-bar is-segmented">
      ${items.map((it) => `
        <button type="button" class="subtab-btn${cur === it.id ? " is-active" : ""}" data-action="set-agent-field" data-field="${field}" data-val="${it.id}">${rv5EscapeHtml(it.label)}</button>
      `).join("")}
    </div>
  `;

  return `
    <div class="section-group">
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Профиль возможностей активен в этом чате" : "Agent Capability Profile Active"}</span>
            <span class="row-desc">${isRu ? "Агент сразу применяет включённые фишки с первого шага задачи" : "Agent immediately uses enabled tools & strategy from step 1"}</span>
          </div>
          <button type="button" class="switch${ap.enabled ? " is-on" : ""}" role="switch" aria-checked="${ap.enabled ? "true" : "false"}" data-action="toggle-agent-enabled"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "★ Применять по умолчанию для всех новых чатов" : "★ Default for all new chats"}</span>
            <span class="row-desc">${isRu ? "Каждый новый чат автоматически стартует с этим набором фишек" : "Every new chat automatically starts with this profile"}</span>
          </div>
          <button type="button" class="switch${isDefaultForNew ? " is-on" : ""}" role="switch" aria-checked="${isDefaultForNew ? "true" : "false"}" data-action="toggle-agent-default-new"><span class="switch-thumb"></span></button>
        </div>
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "Готовые пресеты задач (1 клик)" : "Task Presets (1 click)"}</span>
      <div class="rx-preset-grid">
        ${RUDEX_AGENT_PRESETS.map((p) => {
          const sel = (ap.enabled ? ap.presetId : "default") === p.id;
          return `
            <button type="button" class="rx-preset-tile${sel ? " is-selected" : ""}" data-action="apply-agent-preset" data-id="${rv5EscapeHtml(p.id)}">
              <div style="font-weight:600;font-size:12.5px">${rv5EscapeHtml(p.icon)} ${rv5EscapeHtml(isRu ? p.nameRu : p.nameEn)}</div>
              <div class="row-desc" style="font-size:11px;line-height:1.3">${rv5EscapeHtml(isRu ? p.descRu : p.descEn)}</div>
            </button>
          `;
        }).join("")}
        ${(customPresets || []).map((cp) => {
          const sel = ap.enabled && ap.presetId === cp.id;
          return `
            <div class="rx-preset-tile${sel ? " is-selected" : ""}" style="position:relative" data-action="apply-custom-agent-preset" data-id="${rv5EscapeHtml(cp.id)}">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
                <span style="font-weight:600;font-size:12.5px">${rv5EscapeHtml(cp.icon || "⚡")} ${rv5EscapeHtml(cp.name)}</span>
                <button type="button" class="btn btn-sm btn-ghost" data-action="delete-custom-agent-preset" data-id="${rv5EscapeHtml(cp.id)}" style="padding:1px 5px">✕</button>
              </div>
              <div class="row-desc" style="font-size:11px">${isRu ? "Мой пресет" : "Custom preset"}</div>
            </div>
          `;
        }).join("")}
      </div>
      <div class="preset-add-row" style="margin-top:8px">
        <input type="text" class="text-input" data-role="newAgentPresetName" value="${rv5EscapeHtml(newAgentPresetName || "")}" placeholder="${isRu ? "Сохранить текущие тумблеры как пресет…" : "Save current toggles as preset…"}"/>
        <button type="button" class="btn btn-sm" data-action="save-custom-agent-preset">${isRu ? "+ Сохранить" : "+ Save"}</button>
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "Быстрые тумблеры фишек агента" : "Quick Agent Feature Toggles"}</span>
      <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px">
        <div>
          <div class="row-title" style="margin-bottom:5px">${isRu ? "Субагенты и параллельность" : "Subagents & Parallelism"}</div>
          ${seg("subagents", ap.subagents, [
            { id: "off", label: isRu ? "Запретить" : "Block" },
            { id: "auto", label: isRu ? "Авто" : "Auto" },
            { id: "parallel", label: isRu ? "🚀 Параллельно" : "🚀 Parallel" },
          ])}
        </div>
        <div>
          <div class="row-title" style="margin-bottom:5px">${isRu ? "Веб-поиск" : "Web Search"}</div>
          ${seg("webSearch", ap.webSearch, [
            { id: "off", label: isRu ? "Офлайн" : "Block" },
            { id: "auto", label: isRu ? "Авто" : "Auto" },
            { id: "always", label: isRu ? "Всегда проверять" : "Always check" },
          ])}
        </div>
        <div>
          <div class="row-title" style="margin-bottom:5px">${isRu ? "Браузер и Chrome DevTools" : "Browser & DevTools"}</div>
          ${seg("browser", ap.browser, [
            { id: "off", label: isRu ? "Выкл" : "Block" },
            { id: "auto", label: isRu ? "Авто" : "Auto" },
            { id: "verify", label: isRu ? "Авто-проверка UI" : "Auto-verify UI" },
          ])}
        </div>
        <div>
          <div class="row-title" style="margin-bottom:5px">${isRu ? "Планирование перед правками" : "Plan First"}</div>
          ${seg("planFirst", ap.planFirst, [
            { id: "skip", label: isRu ? "Сразу в бой" : "Skip" },
            { id: "auto", label: isRu ? "Авто" : "Auto" },
            { id: "strict", label: isRu ? "План + чеклист" : "Strict Plan" },
          ])}
        </div>
        <div class="row-item" style="padding:4px 0">
          <div class="row-info"><span class="row-title">${isRu ? "Автопроверка тестами / сборкой" : "Auto-verify with tests/build"}</span></div>
          <button type="button" class="switch${ap.autoVerify ? " is-on" : ""}" role="switch" data-action="toggle-agent-bool" data-field="autoVerify"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item" style="padding:4px 0">
          <div class="row-info"><span class="row-title">${isRu ? "Режим «До конца» (меньше вопросов)" : "Deep Mode (finish autonomously)"}</span></div>
          <button type="button" class="switch${ap.deepMode ? " is-on" : ""}" role="switch" data-action="toggle-agent-bool" data-field="deepMode"><span class="switch-thumb"></span></button>
        </div>
      </div>
    </div>

    <div class="section-group">
      <span class="section-label">${isRu ? "⚡ Правки агенту на лету прямо из чата (как в ChatGPT)" : "⚡ Live Mid-Turn Edits from Chat Input"}</span>
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Отправлять правки прямо из поля ввода без остановки агента" : "Send edits inline while agent is running"}</span>
            <span class="row-desc">${isRu ? "Печатай правку в обычный чат во время генерации — агент учтёт её на следующем шаге без прерывания задачи." : "Type into the normal composer while running — delivered via PreInvocation/Stop without cancelling."}</span>
          </div>
          <button type="button" class="switch${le.enabled ? " is-on" : ""}" role="switch" data-action="toggle-live-inline" data-field="enabled"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Клавиша отправки на лету" : "Inline send shortcut"}</span>
          </div>
          <select class="select-input" style="width:auto" data-live-inline-field="sendKey">
            <option value="enter"${le.sendKey === "enter" ? " selected" : ""}>Enter</option>
            <option value="ctrl+enter"${le.sendKey === "ctrl+enter" ? " selected" : ""}>Ctrl + Enter</option>
            <option value="button-only"${le.sendKey === "button-only" ? " selected" : ""}>${isRu ? "Только кнопкой ⚡" : "Button only ⚡"}</option>
          </select>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Срочный перехват (PreToolUse)" : "Urgent Tool Intercept (PreToolUse)"}</span>
            <span class="row-desc">${isRu ? "По умолчанию помечать правки срочными — агент остановит следующее изменение файла, чтобы сразу учесть правку." : "Mark live edits urgent by default so mutating tools pause and incorporate your edit first."}</span>
          </div>
          <button type="button" class="switch${le.urgentIntercept ? " is-on" : ""}" role="switch" data-action="toggle-live-inline" data-field="urgentIntercept"><span class="switch-thumb"></span></button>
        </div>
      </div>
    </div>

    <details class="rx-details-block">
      <summary class="rx-details-summary">
        <span>${isRu ? "Безопасность инструментов, краткость и Характер чата" : "Tool Safety, Conciseness & Chat Persona"}</span>
        <span style="opacity:.6;font-size:11px">${isRu ? "Настроить детально ▸" : "Detailed ▸"}</span>
      </summary>
      <div class="rx-details-body">
        <div>
          <div class="row-title" style="margin-bottom:5px">${isRu ? "Режим безопасности (PreToolUse)" : "Safety Policy (PreToolUse)"}</div>
          ${seg("safetyMode", ap.safetyMode, [
            { id: "normal", label: isRu ? "Обычный" : "Normal" },
            { id: "cautious", label: isRu ? "🛡️ Спрашивать команды" : "🛡️ Ask shell" },
            { id: "readonly", label: isRu ? "🔒 Только чтение" : "🔒 Read-Only" },
          ])}
        </div>
        <div>
          <div class="row-title" style="margin-bottom:5px">${isRu ? "Подробность ответов" : "Response Length"}</div>
          ${seg("conciseness", ap.conciseness, [
            { id: "short", label: isRu ? "Кратко" : "Short" },
            { id: "balanced", label: isRu ? "Баланс" : "Balanced" },
            { id: "detailed", label: isRu ? "Подробно" : "Detailed" },
          ])}
        </div>
        <div class="section-group">
          <span class="section-label">${isRu ? "Приоритетные скиллы (через запятую)" : "Pinned Skills (comma-separated)"}</span>
          <input type="text" class="text-input" data-agent-list="pinnedSkills" value="${rv5EscapeHtml((ap.pinnedSkills || []).join(", "))}" placeholder="rudex, chrome-devtools, ..."/>
        </div>
        <div class="section-group">
          <span class="section-label">${isRu ? "Заблокированные инструменты / MCP (через запятую)" : "Blocked Tools / MCP (comma-separated)"}</span>
          <input type="text" class="text-input" data-agent-list="disabledTools" value="${rv5EscapeHtml((ap.disabledTools || []).join(", "))}" placeholder="search_web, mcp:chrome-devtools"/>
        </div>
        <div style="border-top:1px solid var(--rx-border);padding-top:10px">
          ${personaHtml || ""}
        </div>
      </div>
    </details>
  `;
}

/**
 * Tab 3: Limits & Screen Hub (Standalone "Only Limits" widget + customization + Monitor/Export).
 */
function rv5RenderLimitsTabHtml(ctx) {
  const { limitsWidget, quotaSummary, systemFonts, monitorHtml, exportHtml, isRu } = ctx;
  const lw = rv5NormalizeLimitsWidget(limitsWidget);
  const layouts = [
    { id: "pill", label: isRu ? "Пилюля" : "Pill" },
    { id: "bars", label: isRu ? "Полоски" : "Bars" },
    { id: "card", label: isRu ? "Карточка" : "Card" },
    { id: "inline-header", label: isRu ? "В шапке" : "Header" },
  ];
  const positions = [
    { id: "top-right", label: isRu ? "Сверху справа" : "Top Right" },
    { id: "top-left", label: isRu ? "Сверху слева" : "Top Left" },
    { id: "bottom-right", label: isRu ? "Снизу справа" : "Bottom Right" },
    { id: "bottom-left", label: isRu ? "Снизу слева" : "Bottom Left" },
  ];

  return `
    ${rv5RenderSystemFontDatalist(systemFonts)}
    <div class="section-group">
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Вывести лимиты Antigravity на главный экран" : "Show Antigravity Limits on Main Screen"}</span>
            <span class="row-desc">${isRu ? "Показывает живые квоты (5ч / Неделя и таймер сброса) прямо поверх интерфейса." : "Displays live 5h / weekly quotas and reset timer directly on screen."}</span>
          </div>
          <button type="button" class="switch${lw.enabled ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="enabled"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Режим «Только лимиты» (скрыть TPS-виджет)" : "Limits-Only Mode (hide TPS widget)"}</span>
            <span class="row-desc">${isRu ? "Оставляет на экране только чистое окошко лимитов Antigravity без лишней телеметрии." : "Shows only the clean Antigravity limits window without TPS widgets."}</span>
          </div>
          <button type="button" class="switch${lw.onlyLimitsMode ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="onlyLimitsMode"><span class="switch-thumb"></span></button>
        </div>
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${isRu ? "Обновить снимок квот Antigravity" : "Sync Antigravity Quotas Now"}</span>
            <span class="row-desc">${isRu ? "Откроет экран использования или обновит остаток % по моделям" : "Reads current % remaining from Models & Usage"}</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary" data-action="sync-limits-now">↻ ${isRu ? "Синхронизировать" : "Sync now"}</button>
        </div>
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

    <details class="rx-details-block" open>
      <summary class="rx-details-summary">
        <span>${isRu ? "Настройка стиля, шрифта и состава окошка лимитов" : "Customize Limits Window Style, Font & Fields"}</span>
        <span style="opacity:.6;font-size:11px">${isRu ? "Детально ▾" : "Detailed ▾"}</span>
      </summary>
      <div class="rx-details-body">
        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "Шрифт окна лимитов" : "Limits Widget Font"}</span>
            <select class="select-input" data-limits-field="fontFamily">
              ${rv5FontSelectOptions(lw.fontFamily || "inherit", "ui", systemFonts, isRu, true)}
            </select>
            ${lw.fontFamily === "custom" ? `<input type="text" class="text-input" style="margin-top:5px" list="rudex-sys-fonts-list" data-limits-field="fontFamilyCustom" value="${rv5EscapeHtml(lw.fontFamilyCustom || "")}" placeholder="JetBrains Mono, Segoe UI…"/>` : ""}
          </div>
          <div class="section-group">
            <span class="section-label">${isRu ? "Позиция на экране" : "Screen Position"}</span>
            <select class="select-input" data-limits-field="position">
              ${positions.map((p) => `<option value="${p.id}"${lw.position === p.id ? " selected" : ""}>${rv5EscapeHtml(p.label)}</option>`).join("")}
              <option value="floating"${lw.position === "floating" ? " selected" : ""}>${isRu ? "Свободная (перетаскивание)" : "Free floating"}</option>
            </select>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Размер шрифта" : "Font Size"}</span><b class="num">${lw.fontSize}px</b></div>
            <input type="range" class="range-input" min="10" max="20" step="1" data-limits-field="fontSize" value="${lw.fontSize}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Масштаб окна" : "Window Scale"}</span><b class="num">${lw.scale}%</b></div>
            <input type="range" class="range-input" min="75" max="150" step="5" data-limits-field="scale" value="${lw.scale}"/>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Прозрачность фона" : "Background Opacity"}</span><b class="num">${lw.bgOpacity}%</b></div>
            <input type="range" class="range-input" min="20" max="100" step="2" data-limits-field="bgOpacity" value="${lw.bgOpacity}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${isRu ? "Скругление углов" : "Corner Radius"}</span><b class="num">${lw.borderRadius}px</b></div>
            <input type="range" class="range-input" min="0" max="28" step="1" data-limits-field="borderRadius" value="${lw.borderRadius}"/>
          </div>
        </div>

        <div class="control-grid-2">
          <div class="section-group">
            <span class="section-label">${isRu ? "Цвета (фон / текст / рамка)" : "Colors (bg / text / border)"}</span>
            <div class="rx-color-row">
              <input type="color" data-limits-field="bgColor" value="${lw.bgColor || "#1f1e1d"}" title="${isRu ? "Фон" : "Bg"}"/>
              <input type="color" data-limits-field="textColor" value="${lw.textColor || "#faf9f5"}" title="${isRu ? "Текст" : "Text"}"/>
              <input type="color" data-limits-field="borderColor" value="${lw.borderColor || "#3a3935"}" title="${isRu ? "Рамка" : "Border"}"/>
              <button type="button" class="btn btn-sm btn-ghost" data-action="reset-limits-colors">${isRu ? "Авто" : "Auto"}</button>
            </div>
          </div>
          <div class="section-group">
            <span class="section-label">${isRu ? "Какие модели показывать" : "Model Families"}</span>
            <select class="select-input" data-limits-field="families">
              <option value="both"${lw.families === "both" ? " selected" : ""}>${isRu ? "Все (Gemini + Claude/GPT)" : "Both (Gemini + Claude/GPT)"}</option>
              <option value="active"${lw.families === "active" ? " selected" : ""}>${isRu ? "Только активная модель" : "Active model only"}</option>
              <option value="gemini"${lw.families === "gemini" ? " selected" : ""}>Gemini</option>
              <option value="claudeGpt"${lw.families === "claudeGpt" ? " selected" : ""}>Claude / GPT</option>
            </select>
          </div>
        </div>

        <div class="card">
          <div class="row-item"><span class="row-title">${isRu ? "Показывать лимит 5ч" : "Show 5h limit"}</span><button type="button" class="switch${lw.show5h ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="show5h"><span class="switch-thumb"></span></button></div>
          <div class="row-item"><span class="row-title">${isRu ? "Показывать недельный лимит" : "Show Weekly limit"}</span><button type="button" class="switch${lw.showWeekly ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="showWeekly"><span class="switch-thumb"></span></button></div>
          <div class="row-item"><span class="row-title">${isRu ? "Показывать таймер сброса" : "Show reset timer"}</span><button type="button" class="switch${lw.showResetTimer ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="showResetTimer"><span class="switch-thumb"></span></button></div>
          <div class="row-item"><span class="row-title">${isRu ? "Авто-светофор (зелёный → жёлтый → красный)" : "Auto traffic-light colors"}</span><button type="button" class="switch${lw.trafficLight ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="trafficLight"><span class="switch-thumb"></span></button></div>
          <div class="row-item"><span class="row-title">${isRu ? "Закрепить положение (запретить перетаскивание)" : "Lock position"}</span><button type="button" class="switch${lw.pinned ? " is-on" : ""}" role="switch" data-action="toggle-limits-bool" data-field="pinned"><span class="switch-thumb"></span></button></div>
        </div>
      </div>
    </details>

    <details class="rx-details-block">
      <summary class="rx-details-summary">
        <span>${isRu ? "Монитор скорости (TPS), таблица расхода и Экспорт в ZIP" : "Speed Monitor (TPS), Usage Breakdown & ZIP Export"}</span>
        <span style="opacity:.6;font-size:11px">${isRu ? "Открыть ▸" : "Expand ▸"}</span>
      </summary>
      <div class="rx-details-body">
        ${monitorHtml || ""}
        <div style="border-top:1px solid var(--rx-border);padding-top:10px">${exportHtml || ""}</div>
      </div>
    </details>
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
    { id: "widgets", title: isRu ? "Виджеты и экран" : "Widgets & Screen" },
    { id: "agent", title: isRu ? "Агент и пресеты" : "Agent & Presets" },
  ];
  return `
    <div class="section-group">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <span class="row-desc">${isRu ? "Кликните на клавишу и нажмите нужную комбинацию. Backspace — отключить, Esc — отмена." : "Click a shortcut and press any key combo. Backspace clears, Esc cancels."}</span>
        <button type="button" class="btn btn-sm" data-action="reset-all-keybindings">${isRu ? "Сбросить всё" : "Reset All"}</button>
      </div>
      ${groups.map((g) => {
        const defs = RUDEX_KEYBINDING_DEFS.filter((d) => d.group === g.id);
        return `
          <div style="margin-top:8px">
            <span class="section-label">${rv5EscapeHtml(g.title)}</span>
            <div class="card">
              ${defs.map((d) => {
                const isRec = recordingId === d.id;
                const val = kb[d.id] || "";
                return `
                  <div class="row-item">
                    <span class="row-title" style="font-size:12.5px">${rv5EscapeHtml(isRu ? d.nameRu : d.nameEn)}</span>
                    <div style="display:flex;align-items:center;gap:5px">
                      <button type="button" class="rx-kb-btn${isRec ? " is-recording" : ""}" data-action="record-keybinding" data-id="${rv5EscapeHtml(d.id)}">
                        ${isRec ? (isRu ? "Нажмите клавиши…" : "Press keys…") : (val || (isRu ? "Не задано" : "Not set"))}
                      </button>
                      ${val ? `<button type="button" class="btn btn-sm btn-ghost" data-action="clear-keybinding" data-id="${rv5EscapeHtml(d.id)}" title="${isRu ? "Отключить" : "Clear"}">✕</button>` : ""}
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
function rv5RenderWorkshopHtml(wsState, isRu) {
  const data = wsState && wsState.data ? wsState.data : null;
  const scope = (wsState && wsState.scope) || "global";
  const sub = (wsState && wsState.sub) || "rules";
  const loading = Boolean(wsState && wsState.loading);
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
      <div class="rx-ws-card" style="margin-bottom:8px">
        <div class="row-title">${isRu ? "+ Новое правило (Rules)" : "+ New Rule"}</div>
        <input type="text" class="text-input" data-ws-draft="ruleFileName" value="${rv5EscapeHtml(draft.ruleFileName || "")}" placeholder="${isRu ? "Имя файла, напр. code-style.md" : "File name, e.g. code-style.md"}"/>
        <textarea class="editor-box" style="min-height:76px" data-ws-draft="ruleBody" placeholder="${isRu ? "Напишите правило в свободной форме (язык, стиль кода, запреты)…" : "Write your guideline in plain text or Markdown…"}">${rv5EscapeHtml(draft.ruleBody || "")}</textarea>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm btn-primary" data-action="ws-save-rule">${isRu ? "Создать правило" : "Create Rule"}</button>
        </div>
      </div>
      ${rules.length === 0 ? `<div class="empty-msg">${isRu ? "Правил в этой области пока нет." : "No rules found in this scope."}</div>` : rules.map((r) => `
        <div class="rx-ws-card" style="margin-bottom:6px">
          <div class="rx-ws-head">
            <div style="min-width:0">
              <div class="row-title">${rv5EscapeHtml(r.name)} <span class="nav-badge">${rv5EscapeHtml(r.scope === "workspace" ? (isRu ? "Проект" : "Project") : (isRu ? "Глобально" : "Global"))}</span></div>
              <div class="row-desc" style="font-size:10.5px;font-family:var(--rx-font-mono);overflow:hidden;text-overflow:ellipsis">${rv5EscapeHtml(r.path)}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button type="button" class="switch${r.enabled ? " is-on" : ""}" role="switch" data-action="ws-toggle-rule" data-path="${rv5EscapeHtml(r.path)}" data-enabled="${r.enabled ? "1" : "0"}"><span class="switch-thumb"></span></button>
              <button type="button" class="btn btn-sm" data-action="ws-open-path" data-path="${rv5EscapeHtml(r.path)}" title="${isRu ? "Открыть файл" : "Reveal"}">↗</button>
              <button type="button" class="btn btn-sm" data-action="ws-delete-rule" data-path="${rv5EscapeHtml(r.path)}" title="${isRu ? "Удалить" : "Delete"}">✕</button>
            </div>
          </div>
          <div class="row-desc" style="font-size:11.5px;white-space:pre-wrap;max-height:60px;overflow:hidden">${rv5EscapeHtml((r.body || r.content || "").trim().slice(0, 220))}</div>
        </div>
      `).join("")}
    `;
  } else if (sub === "skills") {
    contentHtml = `
      <div class="rx-ws-card" style="margin-bottom:8px">
        <div class="row-title">${isRu ? "+ Мастер создания скилла (без ручного YAML)" : "+ Skill Creator (no manual YAML)"}</div>
        <div class="control-grid-2">
          <input type="text" class="text-input" data-ws-draft="skillName" value="${rv5EscapeHtml(draft.skillName || "")}" placeholder="${isRu ? "Название скилла (напр. deploy-app)" : "Skill name (e.g. deploy-app)"}"/>
          <input type="text" class="text-input" data-ws-draft="skillDesc" value="${rv5EscapeHtml(draft.skillDesc || "")}" placeholder="${isRu ? "Когда агенту запускать скилл?" : "When should the agent use it?"}"/>
        </div>
        <textarea class="editor-box" style="min-height:76px" data-ws-draft="skillBody" placeholder="${isRu ? "Пошаговая инструкция скилла…" : "Step-by-step skill instructions…"}">${rv5EscapeHtml(draft.skillBody || "")}</textarea>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm btn-primary" data-action="ws-save-skill">${isRu ? "Создать скилл" : "Create Skill"}</button>
        </div>
      </div>
      ${skills.length === 0 ? `<div class="empty-msg">${isRu ? "Скиллы не найдены." : "No skills found."}</div>` : skills.map((sk) => `
        <div class="rx-ws-card" style="margin-bottom:6px">
          <div class="rx-ws-head">
            <div style="min-width:0">
              <div class="row-title">${rv5EscapeHtml(sk.name)} <span class="nav-badge">${rv5EscapeHtml(sk.plugin || sk.scope)}</span></div>
              <div class="row-desc">${rv5EscapeHtml(sk.description || sk.path)}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button type="button" class="btn btn-sm" data-action="ws-pin-skill" data-name="${rv5EscapeHtml(sk.name)}" title="${isRu ? "Прикрепить к пресету агента" : "Pin to Agent profile"}">★</button>
              <button type="button" class="btn btn-sm" data-action="ws-open-path" data-path="${rv5EscapeHtml(sk.dir || sk.path)}">↗</button>
            </div>
          </div>
        </div>
      `).join("")}
    `;
  } else if (sub === "mcp") {
    contentHtml = `
      <div class="rx-ws-card" style="margin-bottom:8px">
        <div class="row-title">${isRu ? "+ Добавить MCP-сервер (без ручного JSON)" : "+ Add MCP Server (no manual JSON)"}</div>
        <div class="control-grid-2">
          <input type="text" class="text-input" data-ws-draft="mcpName" value="${rv5EscapeHtml(draft.mcpName || "")}" placeholder="${isRu ? "Имя сервера (напр. github)" : "Server name (e.g. github)"}"/>
          <input type="text" class="text-input" data-ws-draft="mcpCommand" value="${rv5EscapeHtml(draft.mcpCommand || "")}" placeholder="${isRu ? "Команда (npx, uvx, node…)" : "Command (npx, uvx, node…)"}"/>
        </div>
        <div class="control-grid-2">
          <input type="text" class="text-input" data-ws-draft="mcpArgs" value="${rv5EscapeHtml(draft.mcpArgs || "")}" placeholder="${isRu ? "Аргументы через пробел" : "Space-separated args"}"/>
          <input type="text" class="text-input" data-ws-draft="mcpUrl" value="${rv5EscapeHtml(draft.mcpUrl || "")}" placeholder="${isRu ? "Или URL (для HTTP/SSE MCP)" : "Or URL (for HTTP/SSE MCP)"}"/>
        </div>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm btn-primary" data-action="ws-save-mcp">${isRu ? "Сохранить MCP" : "Save MCP"}</button>
        </div>
      </div>
      ${mcps.length === 0 ? `<div class="empty-msg">${isRu ? "MCP-серверы не настроены." : "No MCP servers configured."}</div>` : mcps.map((m) => `
        <div class="rx-ws-card" style="margin-bottom:6px">
          <div class="rx-ws-head">
            <div style="min-width:0">
              <div class="row-title">${rv5EscapeHtml(m.name)} <span class="nav-badge">${rv5EscapeHtml(m.scope)}</span></div>
              <div class="row-desc" style="font-family:var(--rx-font-mono);font-size:11px">${rv5EscapeHtml(m.url || [m.command].concat(m.args || []).join(" "))}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button type="button" class="switch${!m.disabled ? " is-on" : ""}" role="switch" data-action="ws-toggle-mcp" data-name="${rv5EscapeHtml(m.name)}" data-scope="${rv5EscapeHtml(m.scope)}" data-disabled="${m.disabled ? "1" : "0"}"><span class="switch-thumb"></span></button>
              <button type="button" class="btn btn-sm" data-action="ws-delete-mcp" data-name="${rv5EscapeHtml(m.name)}" data-scope="${rv5EscapeHtml(m.scope)}">✕</button>
            </div>
          </div>
        </div>
      `).join("")}
    `;
  } else {
    contentHtml = `
      <span class="section-label">${isRu ? `Плагины (${plugins.length})` : `Plugins (${plugins.length})`}</span>
      ${plugins.map((p) => `
        <div class="rx-ws-card" style="margin-bottom:6px">
          <div class="rx-ws-head">
            <div><div class="row-title">${rv5EscapeHtml(p.name)} ${p.version ? `<span class="nav-badge">v${rv5EscapeHtml(p.version)}</span>` : ""}</div><div class="row-desc">${rv5EscapeHtml(p.description || p.dir)}</div></div>
            <button type="button" class="btn btn-sm" data-action="ws-open-path" data-path="${rv5EscapeHtml(p.dir)}">↗</button>
          </div>
        </div>
      `).join("")}
      <span class="section-label" style="margin-top:8px;display:block">${isRu ? `Активные хуки (${hooks.length})` : `Active Hooks (${hooks.length})`}</span>
      ${hooks.map((h) => `
        <div class="rx-ws-card" style="margin-bottom:6px">
          <div class="rx-ws-head">
            <div><div class="row-title">${rv5EscapeHtml(h.name)} <span class="nav-badge">${rv5EscapeHtml(h.source)}</span></div><div class="row-desc">${rv5EscapeHtml((h.events || []).join(" · "))}</div></div>
            <button type="button" class="btn btn-sm" data-action="ws-open-path" data-path="${rv5EscapeHtml(h.path)}">↗</button>
          </div>
        </div>
      `).join("")}
    `;
  }

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap">
      <div class="subtab-bar is-segmented" style="margin:0">
        <button type="button" class="subtab-btn${scope === "global" ? " is-active" : ""}" data-action="ws-set-scope" data-val="global">${isRu ? "Глобально" : "Global"}</button>
        <button type="button" class="subtab-btn${scope === "workspace" ? " is-active" : ""}" data-action="ws-set-scope" data-val="workspace">${isRu ? "Этот проект" : "This Project"}</button>
        <button type="button" class="subtab-btn${scope === "all" ? " is-active" : ""}" data-action="ws-set-scope" data-val="all">${isRu ? "Всё" : "All"}</button>
      </div>
      <button type="button" class="btn btn-sm" data-action="ws-refresh">↻ ${isRu ? "Обновить" : "Refresh"}</button>
    </div>
    <div class="subtab-bar" style="margin-bottom:10px">
      <button type="button" class="subtab-btn${sub === "rules" ? " is-active" : ""}" data-action="ws-set-sub" data-val="rules">${isRu ? "Правила" : "Rules"} (${rules.length})</button>
      <button type="button" class="subtab-btn${sub === "skills" ? " is-active" : ""}" data-action="ws-set-sub" data-val="skills">${isRu ? "Скиллы" : "Skills"} (${skills.length})</button>
      <button type="button" class="subtab-btn${sub === "mcp" ? " is-active" : ""}" data-action="ws-set-sub" data-val="mcp">MCP (${mcps.length})</button>
      <button type="button" class="subtab-btn${sub === "hooks" ? " is-active" : ""}" data-action="ws-set-sub" data-val="hooks">${isRu ? "Плагины и Хуки" : "Plugins & Hooks"}</button>
    </div>
    ${contentHtml}
  `;
}

/**
 * Floating Chat Dock rendered directly above the native Antigravity composer:
 * - Quick Agent Profile chip & Popover
 * - Inline "⚡ Send Live Edit" button + Urgent toggle + Queue Capsule when agent is running
 */
function rv5BuildChatDockHtml(ctx) {
  const { agentProfile, defaultProfile, customPresets, liveEdits, isGenerating, hasComposerText, liveEditInline, urgentMode, popoverOpen, isRu } = ctx;
  const ap = rv5NormalizeAgentProfile(agentProfile);
  const le = Object.assign({}, RUDEX_LIVE_EDIT_DEFAULTS, liveEditInline || {});
  const presetObj = RUDEX_AGENT_PRESETS.find((p) => p.id === ap.presetId)
    || (customPresets || []).find((p) => p.id === ap.presetId)
    || RUDEX_AGENT_PRESETS[0];
  const featCount = rv5CountActiveAgentFeatures(ap);
  const chipLabel = ap.enabled
    ? `${presetObj.icon || "⚡"} ${isRu ? (presetObj.nameRu || presetObj.name) : (presetObj.nameEn || presetObj.name)}${featCount > 0 ? ` · ${featCount}` : ""}`
    : (isRu ? "◎ Пульт агента" : "◎ Agent Controls");

  const pendingItems = (liveEdits || []).filter((it) => it && it.status === "pending");
  const recentDelivered = (liveEdits || []).filter((it) => it && it.status === "delivered" && Date.now() - (it.deliveredAt || 0) < 12000).slice(-2);
  const queueItems = pendingItems.concat(recentDelivered);

  const showLiveBtn = Boolean(le.enabled && isGenerating && hasComposerText);
  const isDefaultNew = Boolean(defaultProfile && defaultProfile.applyToNewChats && defaultProfile.enabled);

  return `
    ${popoverOpen ? `
      <div class="rx-agent-popover" data-role="agentQuickPopover">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <strong style="font-size:12.5px">${isRu ? "Пульт агента (этот чат)" : "Agent Controls (this chat)"}</strong>
          <button type="button" class="btn btn-sm btn-ghost" data-action="open-agent-full">${isRu ? "Все настройки ↗" : "Full ↗"}</button>
        </div>
        <div class="rx-preset-grid">
          ${RUDEX_AGENT_PRESETS.map((p) => {
            const sel = (ap.enabled ? ap.presetId : "default") === p.id;
            return `<button type="button" class="rx-preset-tile${sel ? " is-selected" : ""}" style="padding:7px 8px" data-action="apply-agent-preset" data-id="${rv5EscapeHtml(p.id)}"><span style="font-size:11.5px;font-weight:600">${rv5EscapeHtml(p.icon)} ${rv5EscapeHtml(isRu ? p.nameRu : p.nameEn)}</span></button>`;
          }).join("")}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          <button type="button" class="btn btn-sm${ap.enabled && ap.subagents === "parallel" ? " btn-primary" : ""}" data-action="quick-toggle-agent" data-key="subagents">${isRu ? "🚀 Субагенты" : "🚀 Subagents"}</button>
          <button type="button" class="btn btn-sm${ap.enabled && ap.webSearch === "always" ? " btn-primary" : ""}" data-action="quick-toggle-agent" data-key="webSearch">${isRu ? "🌐 Веб" : "🌐 Web"}</button>
          <button type="button" class="btn btn-sm${ap.enabled && ap.browser === "verify" ? " btn-primary" : ""}" data-action="quick-toggle-agent" data-key="browser">${isRu ? "🖥 Браузер" : "🖥 Browser"}</button>
          <button type="button" class="btn btn-sm${ap.enabled && ap.planFirst === "strict" ? " btn-primary" : ""}" data-action="quick-toggle-agent" data-key="planFirst">${isRu ? "📋 План" : "📋 Plan"}</button>
          <button type="button" class="btn btn-sm${ap.enabled && ap.autoVerify ? " btn-primary" : ""}" data-action="quick-toggle-agent" data-key="autoVerify">${isRu ? "✓ Тесты" : "✓ Tests"}</button>
          <button type="button" class="btn btn-sm${ap.enabled && ap.safetyMode === "readonly" ? " btn-primary" : ""}" data-action="quick-toggle-agent" data-key="readonly">${isRu ? "🔒 Read-Only" : "🔒 Read-Only"}</button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:6px;border-top:1px solid var(--rx-border)">
          <span style="font-size:11.5px">${isRu ? "★ По умолчанию для новых чатов" : "★ Default for new chats"}</span>
          <button type="button" class="switch${isDefaultNew ? " is-on" : ""}" role="switch" data-action="toggle-agent-default-new"><span class="switch-thumb"></span></button>
        </div>
      </div>
    ` : ""}

    ${queueItems.length > 0 ? `
      <div class="rx-live-queue-strip">
        ${queueItems.map((it) => `
          <div class="rx-lq-item">
            <span class="rx-lq-badge${it.status === "delivered" ? " is-done" : ""}">${it.status === "delivered" ? (isRu ? "✓ Учтено" : "✓ Applied") : (it.urgent ? "⚡! Срочно" : (isRu ? "⚡ В очереди" : "⚡ Queued"))}</span>
            <span class="rx-lq-text">${rv5EscapeHtml(it.text || "")}</span>
            ${it.status === "pending" ? `<button type="button" class="rx-lim-btn" data-action="cancel-live-edit" data-id="${rv5EscapeHtml(it.id)}" title="${isRu ? "Отменить правку" : "Cancel edit"}">✕</button>` : ""}
          </div>
        `).join("")}
      </div>
    ` : ""}

    <div class="rx-chat-dock-row">
      <button type="button" class="rx-agent-chip${ap.enabled ? " is-active" : ""}" data-action="toggle-agent-popover">
        <span>${rv5EscapeHtml(chipLabel)}</span>
        <span style="opacity:.6">▾</span>
      </button>
      ${showLiveBtn ? `
        <div style="display:flex;align-items:center;gap:5px">
          <button type="button" class="rx-urgent-toggle${urgentMode ? " is-on" : ""}" data-action="toggle-urgent-live" title="${isRu ? "Срочная правка: перехватит следующий инструмент" : "Urgent: intercepts next mutating tool"}">⚡!</button>
          <button type="button" class="rx-live-send-pill${urgentMode ? " is-urgent" : ""}" data-action="send-inline-live-edit">
            ⚡ ${isRu ? "Отправить на лету" : "Send live edit"}
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

/**
 * Safely injects native "Rudex Studio" entry inside Antigravity's own Settings navigation
 * and a quick button inside Antigravity's native "Customization" screen.
 */
function rv5InjectNativeSettingsEntries(doc, isRu, onOpenTab) {
  if (!doc || typeof doc.querySelectorAll !== "function") return;
  try {
    // 1. Native Settings sidebar/dialog navigation (look for nav containing Appearance / Models / General / Настройки)
    const navs = doc.querySelectorAll('nav, [role="tablist"], [role="dialog"] aside');
    for (let i = 0; i < navs.length; i += 1) {
      const nav = navs[i];
      if (!nav || (nav.closest && nav.closest("#rudex-studio-host"))) continue;
      if (nav.querySelector('[data-rudex-native-entry="settings"]')) continue;
      const txt = (nav.textContent || "").toLowerCase();
      const looksLikeSettingsNav =
        (txt.includes("модели") || txt.includes("models") || txt.includes("учётная запись") || txt.includes("account")) &&
        (txt.includes("общие") || txt.includes("general") || txt.includes("оформление") || txt.includes("appearance") || txt.includes("уведомления") || txt.includes("notifications"));
      if (!looksLikeSettingsNav) continue;
      const sampleBtn = nav.querySelector("button, a, [role='tab']");
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-rudex-native-entry", "settings");
      btn.setAttribute("data-rudex-ignore", "1");
      if (sampleBtn && sampleBtn.className) {
        btn.className = sampleBtn.className.replace(/\bbg-[^\s]+/g, "").trim();
      }
      btn.style.cssText = "display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;margin-top:4px;border-radius:8px;border:1px solid rgba(217,119,87,0.38);background:rgba(217,119,87,0.10);color:inherit;cursor:pointer;font-size:13px;font-weight:600;text-align:left;";
      btn.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:5px;background:#d97757;color:#fff;font-size:11px;font-weight:700">R</span><span>${isRu ? "Rudex · Настройки скилла" : "Rudex · Skill Settings"}</span>`;
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof onOpenTab === "function") onOpenTab("appearance");
      });
      nav.appendChild(btn);
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
      btn.style.cssText = "margin-left:12px;padding:4px 10px;border-radius:8px;border:1px solid rgba(217,119,87,0.45);background:rgba(217,119,87,0.14);color:inherit;cursor:pointer;font-size:12px;font-weight:600;";
      btn.textContent = isRu ? "🧩 Открыть в Мастерской Rudex" : "🧩 Open in Rudex Workshop";
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof onOpenTab === "function") onOpenTab("settings", "workshop");
      });
      parent.appendChild(btn);
    }
  } catch (_e) {}
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
    rv5BuildChatDockHtml,
    rv5InjectNativeSettingsEntries,
  };
}
