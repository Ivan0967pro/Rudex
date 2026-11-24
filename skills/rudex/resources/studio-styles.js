"use strict";

function buildStudioStyles() {
  return `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Inter, system-ui, sans-serif;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }

    .studio-root {
      --rx-bg: #0c0c0f;
      --rx-surface: #131318;
      --rx-surface-2: #191920;
      --rx-glass: rgba(14, 15, 20, 0.88);
      --rx-glass-strong: rgba(14, 15, 20, 0.96);
      --rx-fg: #d4d6de;
      --rx-fg-strong: #f4f5f8;
      --rx-muted: #808494;
      --rx-border: rgba(255, 255, 255, 0.08);
      --rx-border-strong: rgba(255, 255, 255, 0.15);
      --rx-hover: rgba(255, 255, 255, 0.055);
      --rx-accent: #3b82f6;
      --rx-accent-fg: #ffffff;
      --rx-accent-soft: color-mix(in srgb, var(--rx-accent) 16%, transparent);
      --rx-accent-border: color-mix(in srgb, var(--rx-accent) 44%, transparent);
      --rx-success: #22c55e;
      --rx-success-soft: rgba(34, 197, 94, 0.14);
      --rx-warning: #f59e0b;
      --rx-warning-soft: rgba(245, 158, 11, 0.14);
      --rx-danger: #ef4444;
      --rx-danger-soft: rgba(239, 68, 68, 0.14);
      --rx-shadow: 0 22px 60px rgba(0, 0, 0, 0.56);
      --rx-widget-shadow: 0 8px 26px rgba(0, 0, 0, 0.42);
      --rx-mono: ui-monospace, "Cascadia Code", Consolas, monospace;
      color: var(--rx-fg);
      font-size: 13px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }

    .studio-root[data-theme="light"] {
      --rx-bg: #ffffff;
      --rx-surface: #f7f7f9;
      --rx-surface-2: #efeff4;
      --rx-glass: rgba(252, 252, 254, 0.90);
      --rx-glass-strong: rgba(255, 255, 255, 0.97);
      --rx-fg: #27272e;
      --rx-fg-strong: #0e0e12;
      --rx-muted: #686d7d;
      --rx-border: rgba(15, 23, 42, 0.09);
      --rx-border-strong: rgba(15, 23, 42, 0.16);
      --rx-hover: rgba(15, 23, 42, 0.045);
      --rx-shadow: 0 20px 52px rgba(15, 23, 42, 0.14);
      --rx-widget-shadow: 0 8px 24px rgba(15, 23, 42, 0.10);
    }

    .num { font-variant-numeric: tabular-nums; }

    button:focus-visible,
    input:focus-visible,
    textarea:focus-visible,
    select:focus-visible,
    [role="button"]:focus-visible {
      outline: 2px solid var(--rx-accent);
      outline-offset: 2px;
    }

    @keyframes rxWidgetIn {
      from { opacity: 0; transform: translateY(4px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes rxModalIn {
      from { opacity: 0; transform: scale(0.985) translateY(5px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes rxDrawerIn {
      from { opacity: 0; transform: translateX(12px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes rxPulse {
      0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--rx-accent) 50%, transparent); }
      60% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--rx-accent) 0%, transparent); }
    }

    /* === Floating Widget === */
    .widget-wrap {
      position: fixed;
      z-index: 2147483000;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      font-family: inherit;
    }
    .widget-wrap.is-hidden { display: none; }
    .widget-wrap.dock-bottom-right { right: 16px; bottom: 16px; }
    .widget-wrap.dock-top-right { right: 16px; top: 52px; }
    .widget-wrap.dock-middle-right { right: 16px; top: 50%; transform: translateY(-50%); }
    .widget-wrap.dock-bottom-left { left: 16px; bottom: 16px; }
    .widget-wrap.is-dragging { opacity: 0.94; }

    .mini-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 32px;
      max-width: min(560px, calc(100vw - 24px));
      padding: 0 6px 0 9px;
      border-radius: 999px;
      background: var(--rx-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-widget-shadow);
      color: var(--rx-fg);
      font-size: 11.5px;
      font-weight: 500;
      cursor: grab;
      animation: rxWidgetIn 0.16s ease-out;
      transition: border-color 0.15s ease;
    }
    .preview-stage .mini-pill {
      animation: none !important;
      cursor: default;
    }
    .widget-wrap.is-locked .mini-pill,
    .widget-wrap.is-locked .med-card { cursor: pointer; }
    .widget-wrap.is-dragging .mini-pill,
    .widget-wrap.is-dragging .med-card { cursor: grabbing; }
    .mini-pill:hover { border-color: color-mix(in srgb, var(--rx-fg) 22%, transparent); }

    .drag-grip {
      display: inline-flex;
      align-items: center;
      color: var(--rx-muted);
      opacity: 0.55;
      flex-shrink: 0;
    }
    .widget-wrap.is-locked .drag-grip { display: none; }

    .pill-sep {
      width: 1px;
      height: 13px;
      background: var(--rx-border-strong);
      flex-shrink: 0;
    }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--rx-fg-strong);
      font-weight: 600;
      white-space: nowrap;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--rx-success);
      flex-shrink: 0;
    }
    .status-dot.is-live {
      background: var(--rx-accent);
      animation: rxPulse 1.3s ease-in-out infinite;
    }

    .metric-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      color: var(--rx-fg);
    }
    .metric-chip b { font-weight: 650; color: var(--rx-fg-strong); }
    .metric-chip.is-muted { color: var(--rx-muted); }
    .metric-chip.is-muted b { color: var(--rx-fg); font-weight: 600; }

    .model-badge {
      max-width: 148px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      color: var(--rx-muted);
      font-size: 10.5px;
      font-weight: 500;
    }

    .lang-pill-btn {
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-surface-2);
      color: var(--rx-fg-strong);
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      flex-shrink: 0;
      transition: border-color 0.14s ease, background 0.14s ease;
    }
    .lang-pill-btn:hover {
      border-color: var(--rx-accent-border);
      background: var(--rx-accent-soft);
    }

    .icon-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      border: none;
      background: transparent;
      color: var(--rx-muted);
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      transition: background 0.14s ease, color 0.14s ease;
    }
    .icon-btn:hover { background: var(--rx-hover); color: var(--rx-fg-strong); }
    .icon-btn.is-primary { color: var(--rx-accent); }
    .icon-btn.is-pinned { color: var(--rx-accent); background: var(--rx-accent-soft); }

    .le-dot-ind {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--rx-warning);
    }

    /* === Medium Card (M) === */
    .med-card {
      width: 316px;
      border-radius: 14px;
      background: var(--rx-glass-strong);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow);
      overflow: hidden;
      cursor: grab;
      animation: rxWidgetIn 0.16s ease-out;
    }
    .med-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 9px 11px;
      border-bottom: 1px solid var(--rx-border);
    }
    .med-head-left {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }
    .med-phase {
      font-size: 12px;
      font-weight: 600;
      color: var(--rx-fg-strong);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .med-head-actions {
      display: flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
    }
    .med-body {
      padding: 11px 12px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .med-tps-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }
    .med-tps-hero {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }
    .med-tps-num {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--rx-fg-strong);
      line-height: 1;
    }
    .med-tps-unit {
      font-size: 11px;
      font-weight: 600;
      color: var(--rx-accent);
    }
    .med-peak {
      font-size: 11px;
      color: var(--rx-muted);
    }
    .med-peak b { color: var(--rx-fg-strong); font-weight: 600; }

    .med-spark-box {
      height: 44px;
      border-radius: 8px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      padding: 4px;
      display: flex;
      align-items: center;
    }
    .med-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .med-stat-tile {
      padding: 7px 9px;
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .med-stat-label { font-size: 10.5px; color: var(--rx-muted); }
    .med-stat-val { font-size: 13px; font-weight: 650; color: var(--rx-fg-strong); }

    .med-quota-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
      color: var(--rx-muted);
      padding: 0 2px;
    }
    .med-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 7px;
      border-top: 1px solid var(--rx-border);
      font-size: 11px;
    }
    .med-model-tag {
      color: var(--rx-muted);
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .med-persona-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 10.5px;
      cursor: pointer;
      max-width: 126px;
      flex-shrink: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .med-persona-pill:hover { border-color: var(--rx-border-strong); color: var(--rx-fg-strong); }

    /* === Settings Modal & Floating Appearance Drawer === */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483200;
      background: rgba(6, 7, 10, 0.56);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-backdrop.is-appearance-live {
      background: rgba(0, 0, 0, 0.08);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      justify-content: flex-end;
      align-items: stretch;
      padding: 16px;
    }

    .modal-shell {
      width: min(840px, calc(100vw - 32px));
      height: min(540px, calc(100vh - 36px));
      border-radius: 14px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow);
      display: flex;
      overflow: hidden;
      animation: rxModalIn 0.16s ease-out;
    }
    .modal-shell.is-appearance-live {
      width: min(388px, calc(100vw - 24px));
      height: calc(100vh - 32px);
      border-radius: 14px;
      background: var(--rx-glass-strong);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      animation: rxDrawerIn 0.16s ease-out;
    }

    .modal-sidebar {
      width: 192px;
      flex-shrink: 0;
      background: var(--rx-surface);
      border-right: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      padding: 14px 10px;
      gap: 4px;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px 12px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--rx-border);
    }
    .brand-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--rx-fg-strong);
    }
    .brand-ver {
      font-size: 10.5px;
      color: var(--rx-muted);
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--rx-muted);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .nav-item:hover { background: var(--rx-hover); color: var(--rx-fg-strong); }
    .nav-item.is-active {
      background: var(--rx-accent-soft);
      border-color: var(--rx-accent-border);
      color: var(--rx-fg-strong);
      font-weight: 600;
    }
    .nav-ic { display: inline-flex; align-items: center; flex-shrink: 0; opacity: 0.9; }
    .nav-label { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nav-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--rx-success); flex-shrink: 0; }
    .nav-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      color: var(--rx-muted);
      white-space: nowrap;
    }
    .badge-active {
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--rx-success-soft);
      color: var(--rx-success);
      white-space: nowrap;
    }

    .sidebar-foot {
      padding: 10px 8px 2px;
      border-top: 1px solid var(--rx-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--rx-muted);
    }

    .modal-main {
      flex: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--rx-bg);
    }
    .modal-shell.is-appearance-live .modal-main { background: transparent; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--rx-border);
      flex-shrink: 0;
    }
    .modal-shell.is-appearance-live .modal-header { padding: 12px 16px; }
    .modal-title {
      font-size: 15px;
      font-weight: 650;
      letter-spacing: -0.015em;
      color: var(--rx-fg-strong);
      margin: 0;
    }
    .modal-sub {
      font-size: 11.5px;
      color: var(--rx-muted);
      margin: 2px 0 0;
    }

    .modal-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .modal-body > *,
    .section-group > *,
    .rx-details-body > *,
    .persona-stack > * {
      flex-shrink: 0;
    }
    .modal-shell.is-appearance-live .modal-body {
      padding: 14px 16px;
      gap: 14px;
    }
    .modal-body::-webkit-scrollbar,
    .le-feed::-webkit-scrollbar { width: 5px; height: 5px; }
    .modal-body::-webkit-scrollbar-track,
    .le-feed::-webkit-scrollbar-track { background: transparent; }
    .modal-body::-webkit-scrollbar-thumb,
    .le-feed::-webkit-scrollbar-thumb { background: var(--rx-border-strong); border-radius: 999px; }

    /* Sub-tabs (Segmented Pills) */
    .subtab-bar {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 3px;
      border-radius: 10px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      flex-shrink: 0;
    }
    .subtab-btn {
      flex: 1 1 0;
      min-width: 0;
      border: none;
      background: transparent;
      color: var(--rx-muted);
      font-size: 11.5px;
      font-weight: 600;
      padding: 6px 8px;
      border-radius: 7px;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .subtab-btn:hover { color: var(--rx-fg-strong); }
    .subtab-btn.is-active {
      background: var(--rx-surface-2);
      color: var(--rx-fg-strong);
      box-shadow: inset 0 0 0 1px var(--rx-border-strong);
    }

    /* === Primitives === */
    .section-group { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .section-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--rx-muted);
    }
    .card {
      border-radius: 11px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      overflow: hidden;
      flex-shrink: 0;
    }
    .card-pad { padding: 12px 14px; }

    .row-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 13px;
    }
    .row-item + .row-item { border-top: 1px solid var(--rx-border); }
    .row-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .row-title { font-size: 12.5px; font-weight: 550; color: var(--rx-fg-strong); }
    .row-desc { font-size: 11.5px; color: var(--rx-muted); line-height: 1.38; }

    .switch {
      position: relative;
      width: 34px;
      height: 19px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border-strong);
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: var(--rx-muted);
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .switch.is-on {
      background: var(--rx-accent);
      border-color: var(--rx-accent);
    }
    .switch.is-on .switch-thumb {
      transform: translateX(15px);
      background: #ffffff;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-surface-2);
      color: var(--rx-fg-strong);
      font-size: 12px;
      font-weight: 550;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
    }
    .btn:hover:not(:disabled) { background: var(--rx-hover); border-color: color-mix(in srgb, var(--rx-fg) 24%, transparent); }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-primary {
      background: var(--rx-accent);
      border-color: var(--rx-accent);
      color: var(--rx-accent-fg);
    }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
    .btn-sm { padding: 5px 10px; font-size: 11.5px; border-radius: 7px; }
    .btn-ghost { background: transparent; border-color: transparent; color: var(--rx-muted); }
    .btn-ghost:hover:not(:disabled) { background: var(--rx-hover); color: var(--rx-fg-strong); border-color: transparent; }

    .text-input, .select-input {
      width: 100%;
      border-radius: 8px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      color: var(--rx-fg-strong);
      padding: 7px 10px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      min-width: 0;
    }
    .text-input:focus, .select-input:focus { border-color: var(--rx-accent); }

    .kbd {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border-strong);
      color: var(--rx-fg-strong);
      font-family: var(--rx-mono);
      font-size: 10.5px;
      white-space: nowrap;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      min-width: 0;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      font-size: 11.5px;
      color: var(--rx-fg-strong);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status-pill-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .hint-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 10px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 11.5px;
      color: var(--rx-muted);
      flex-shrink: 0;
    }
    .empty-msg {
      padding: 18px 14px;
      border-radius: 10px;
      background: var(--rx-surface);
      border: 1px dashed var(--rx-border-strong);
      text-align: center;
      font-size: 12px;
      color: var(--rx-muted);
      flex-shrink: 0;
    }

    /* === Collapsible Disclosure === */
    .rx-details {
      border-radius: 10px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      overflow: hidden;
      flex-shrink: 0;
    }
    .rx-details > summary {
      list-style: none;
      cursor: pointer;
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--rx-fg-strong);
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    }
    .rx-details > summary::-webkit-details-marker { display: none; }
    .rx-details > summary::after {
      content: "›";
      font-size: 15px;
      color: var(--rx-muted);
      transition: transform 0.14s ease;
    }
    .rx-details[open] > summary::after { transform: rotate(90deg); }
    .rx-details-body {
      padding: 10px 12px 12px;
      border-top: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* === Monitor Tab === */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 9px;
      flex-shrink: 0;
    }
    .kpi-card {
      padding: 12px 13px;
      border-radius: 10px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .kpi-label { font-size: 11px; color: var(--rx-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-val {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--rx-fg-strong);
      line-height: 1.15;
      white-space: nowrap;
    }
    .kpi-unit { font-size: 11.5px; font-weight: 600; color: var(--rx-muted); }
    .kpi-unit.is-accent { color: var(--rx-accent); }
    .kpi-sub { font-size: 10.5px; color: var(--rx-muted); }

    .spark-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: nowrap;
      margin-bottom: 10px;
    }
    .spark-meta { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; overflow: hidden; }
    .modal-spark-box {
      height: 116px;
      border-radius: 8px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border);
      padding: 6px;
      display: flex;
      align-items: center;
    }
    .spark-card-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 10px;
      padding-top: 9px;
      border-top: 1px solid var(--rx-border);
      font-size: 11.5px;
      color: var(--rx-muted);
    }
    .spark-chat-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    .quota-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      padding: 10px 13px;
      border-radius: 10px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      flex-shrink: 0;
    }

    /* === Appearance Drawer === */
    .drawer-sticky-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 11px 16px;
      border-top: 1px solid var(--rx-border);
      background: var(--rx-glass-strong);
      flex-shrink: 0;
    }
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }
    .theme-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 11px;
      border-radius: 9px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg-strong);
      font-size: 12px;
      font-weight: 550;
      cursor: pointer;
      text-align: left;
      transition: border-color 0.12s ease, background 0.12s ease;
    }
    .theme-card:hover { border-color: var(--rx-border-strong); }
    .theme-card.is-selected {
      border-color: var(--rx-accent);
      background: var(--rx-accent-soft);
    }
    .theme-dots {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
    }
    .theme-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.22);
    }

    .accent-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .accent-dot-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
      transition: transform 0.12s ease, border-color 0.12s ease;
    }
    .accent-dot-btn:hover { transform: scale(1.08); }
    .accent-dot-btn.is-selected {
      border-color: var(--rx-fg-strong);
      box-shadow: 0 0 0 2px var(--rx-bg) inset;
    }

    .control-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .control-grid-2 > :last-child:nth-child(odd),
    .export-checks > :last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
    .control-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
    }
    .slider-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 9px 11px;
      border-radius: 9px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border);
    }
    .slider-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11.5px;
      color: var(--rx-muted);
    }
    .slider-head b { color: var(--rx-fg-strong); font-weight: 600; }
    .range-input {
      width: 100%;
      accent-color: var(--rx-accent);
      cursor: pointer;
      margin: 0;
    }
    .color-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 7px 9px;
      border-radius: 9px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border);
      font-size: 11px;
      color: var(--rx-muted);
    }
    .color-input {
      width: 24px;
      height: 20px;
      border: 1px solid var(--rx-border-strong);
      border-radius: 5px;
      background: transparent;
      padding: 0;
      cursor: pointer;
    }

    .grad-chips {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
    }
    .grad-chip {
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--rx-border-strong);
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
      cursor: pointer;
      transition: border-color 0.12s ease, transform 0.12s ease;
    }
    .grad-chip:hover { transform: translateY(-1px); }
    .grad-chip.is-selected {
      border-color: var(--rx-fg-strong);
      box-shadow: 0 0 0 2px var(--rx-accent);
    }

    .media-file-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 11px;
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
    }

    /* === Greeting Studio === */
    .greeting-preview-card {
      padding: 16px 14px;
      border-radius: 10px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .greeting-preview-title {
      font-size: 17px;
      font-weight: 650;
      letter-spacing: -0.02em;
      color: var(--rx-fg-strong);
      line-height: 1.25;
      word-break: break-word;
    }
    .greeting-preview-sub {
      font-size: 12px;
      color: var(--rx-muted);
      margin-top: -6px;
    }
    .greeting-preview-composer {
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 11.5px;
      color: var(--rx-muted);
    }
    .token-chips {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
    }
    .token-chip {
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      border-radius: 6px;
      padding: 3px 7px;
      font-size: 11px;
      font-family: var(--rx-mono);
      cursor: pointer;
    }
    .token-chip:hover { border-color: var(--rx-accent-border); color: var(--rx-fg-strong); }

    .profile-strip { display: flex; flex-wrap: wrap; gap: 6px; }
    .profile-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 9px;
      border-radius: 999px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 11.5px;
      color: var(--rx-fg-strong);
      cursor: pointer;
    }
    .profile-chip:hover { border-color: var(--rx-accent-border); }

    /* === Widget & Language Cards === */
    .preview-stage {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 14px;
      border-radius: 10px;
      background: var(--rx-surface);
      border: 1px dashed var(--rx-border-strong);
      flex-shrink: 0;
    }
    .segmented-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }
    .choice-card {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 11px 13px;
      border-radius: 10px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      cursor: pointer;
      text-align: left;
      transition: border-color 0.12s ease, background 0.12s ease;
    }
    .choice-card:hover { border-color: var(--rx-border-strong); }
    .choice-card.is-selected {
      border-color: var(--rx-accent);
      background: var(--rx-accent-soft);
    }
    .choice-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--rx-fg-strong);
    }
    .choice-desc { font-size: 11.5px; color: var(--rx-muted); line-height: 1.35; }

    .dock-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 6px;
    }
    .dock-btn {
      padding: 7px 6px;
      border-radius: 8px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dock-btn:hover { border-color: var(--rx-border-strong); color: var(--rx-fg-strong); }
    .dock-btn.is-selected {
      background: var(--rx-accent-soft);
      border-color: var(--rx-accent);
      color: var(--rx-fg-strong);
      font-weight: 600;
    }

    /* === Persona Tab === */
    .persona-stack { display: flex; flex-direction: column; gap: 14px; }
    .editor-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11.5px;
    }
    .editor-box {
      width: 100%;
      min-height: 150px;
      resize: vertical;
      border-radius: 10px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      color: var(--rx-fg-strong);
      padding: 11px 12px;
      font-family: var(--rx-mono);
      font-size: 12px;
      line-height: 1.5;
      outline: none;
    }
    .editor-box:focus { border-color: var(--rx-accent); }

    .action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .action-btns { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
    .toast-text { font-size: 11.5px; color: var(--rx-success); min-height: 16px; }
    .toast-text.is-err { color: var(--rx-danger); }

    .preset-strip { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 7px; }
    .preset-card {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 9px 11px;
      border-radius: 9px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      cursor: pointer;
    }
    .preset-card:hover { border-color: var(--rx-border-strong); }
    .preset-card.is-selected { border-color: var(--rx-accent); background: var(--rx-accent-soft); }
    .preset-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .preset-name { font-size: 12px; font-weight: 600; color: var(--rx-fg-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .preset-del-btn {
      border: none;
      background: transparent;
      color: var(--rx-muted);
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
    }
    .preset-del-btn:hover { color: var(--rx-danger); background: var(--rx-danger-soft); }
    .preset-add-row { display: flex; gap: 7px; align-items: center; }
    .preset-add-row .text-input { flex: 1; width: auto; }

    /* === Export & Quota === */
    .export-checks {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }
    .export-check-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 12px;
      color: var(--rx-fg-strong);
      cursor: pointer;
    }
    .export-check-item input { accent-color: var(--rx-accent); margin: 0; }
    .export-result-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 13px;
      border-radius: 10px;
      background: var(--rx-success-soft);
      border: 1px solid rgba(34, 197, 94, 0.28);
    }

    .quota-fam-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }
    .quota-fam-card {
      padding: 11px 13px;
      border-radius: 10px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .quota-fam-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .quota-bar-row { display: flex; flex-direction: column; gap: 4px; font-size: 11px; }
    .quota-bar-labels { display: flex; justify-content: space-between; color: var(--rx-muted); gap: 8px; }
    .quota-bar-labels b { color: var(--rx-fg-strong); }
    .quota-bar-track { height: 5px; border-radius: 999px; background: var(--rx-surface-2); overflow: hidden; }
    .quota-bar-fill { height: 100%; border-radius: 999px; background: var(--rx-accent); }

    .quota-table-wrap {
      border-radius: 10px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      overflow-x: auto;
      flex-shrink: 0;
    }
    .quota-table-row {
      display: grid;
      grid-template-columns: minmax(120px, 1.5fr) minmax(90px, 1fr) 82px 62px 46px;
      gap: 8px;
      align-items: center;
      min-width: 470px;
      padding: 8px 12px;
      font-size: 11.5px;
    }
    .quota-table-row.is-head {
      background: var(--rx-surface-2);
      color: var(--rx-muted);
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .quota-table-row + .quota-table-row { border-top: 1px solid var(--rx-border); }
    .quota-table-row.is-active { background: var(--rx-accent-soft); }
    .quota-chat-name { font-weight: 550; color: var(--rx-fg-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* === Supplements ("Дополнения") Popover & Feed === */
    .le-popover-mount {
      position: fixed;
      z-index: 2147483400;
      pointer-events: none;
    }
    .live-edit-popover {
      pointer-events: auto;
      width: min(372px, calc(100vw - 24px));
      border-radius: 13px;
      background: var(--rx-glass-strong);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow);
      overflow: hidden;
      animation: rxModalIn 0.14s ease-out;
    }
    .le-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 13px;
      border-bottom: 1px solid var(--rx-border);
    }
    .le-title-col { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .le-title { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 650; color: var(--rx-fg-strong); }
    .le-sub { font-size: 11px; color: var(--rx-muted); }
    .le-body { padding: 11px 13px; display: flex; flex-direction: column; gap: 9px; }

    .le-textarea {
      width: 100%;
      min-height: 68px;
      max-height: 150px;
      resize: vertical;
      border-radius: 9px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      color: var(--rx-fg-strong);
      padding: 9px 10px;
      font-family: inherit;
      font-size: 12px;
      line-height: 1.45;
      outline: none;
    }
    .le-textarea:focus { border-color: var(--rx-accent); }

    .le-thumbs { display: flex; flex-wrap: wrap; gap: 6px; }
    .le-thumb-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 7px 3px 4px;
      border-radius: 7px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 11px;
      color: var(--rx-fg-strong);
      max-width: 156px;
    }
    .le-thumb-img { width: 22px; height: 22px; border-radius: 4px; object-fit: cover; }
    .le-thumb-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .le-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .le-feed {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 190px;
      overflow-y: auto;
    }
    .le-item {
      padding: 8px 10px;
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11.5px;
    }
    .le-item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 10.5px;
      color: var(--rx-muted);
    }
    .le-status-pill {
      padding: 1px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
    }
    .le-status-pill.is-pending { background: var(--rx-warning-soft); color: var(--rx-warning); }
    .le-status-pill.is-delivered { background: var(--rx-success-soft); color: var(--rx-success); }
    .le-status-pill.is-expired { background: var(--rx-surface-2); color: var(--rx-muted); }

    .repo-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--rx-accent);
      text-decoration: none;
      font-size: 12px;
      font-weight: 500;
    }
    .repo-link:hover { text-decoration: underline; }

    @media (max-width: 700px) {
      .modal-shell { flex-direction: column; height: min(640px, calc(100vh - 24px)); }
      .modal-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--rx-border); padding: 10px; }
      .nav-list { flex-direction: row; overflow-x: auto; gap: 4px; }
      .nav-item { width: auto; padding: 6px 10px; }
      .sidebar-foot { display: none; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .segmented-2, .quota-fam-grid, .export-checks { grid-template-columns: 1fr; }
      .dock-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    }
  `;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildStudioStyles };
}
