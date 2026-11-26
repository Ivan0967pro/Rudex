"use strict";

function buildStudioStyles() {
  return `
    :host {
      all: initial;
      font-family: var(--rx-font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Inter, system-ui, sans-serif);
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }

    .studio-root {
      --rx-font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Inter, system-ui, sans-serif;
      --rx-font-mono: ui-monospace, "Cascadia Code", "JetBrains Mono", Consolas, monospace;
      --rx-mono: var(--rx-font-mono);

      /* Dynamic theme bridge (overridden by syncTheme when a custom/preset theme is active) */
      --rx-theme-bg: #070708;
      --rx-theme-sidebar: #0c0c0f;
      --rx-theme-surface: #15151a;
      --rx-theme-surface-2: #1c1c22;
      --rx-theme-fg: #d4d6e0;
      --rx-theme-fg-strong: #f4f5f8;
      --rx-theme-muted: #828696;
      --rx-theme-border: rgba(255, 255, 255, 0.075);
      --rx-theme-border-strong: #252527;

      /* Active surface tokens */
      --rx-bg: var(--rx-theme-bg);
      --rx-surface: var(--rx-theme-surface);
      --rx-surface-2: var(--rx-theme-surface-2);
      --rx-glass: color-mix(in srgb, var(--rx-surface) 92%, transparent);
      --rx-glass-strong: color-mix(in srgb, var(--rx-bg) 96%, transparent);
      --rx-fg: var(--rx-theme-fg);
      --rx-fg-strong: var(--rx-theme-fg-strong);
      --rx-muted: var(--rx-theme-muted);
      --rx-border: var(--rx-theme-border);
      --rx-border-strong: var(--rx-theme-border-strong);
      --rx-hover: rgba(255, 255, 255, 0.05);
      --rx-accent: #3b82f6;
      --rx-accent-fg: #ffffff;
      --rx-accent-soft: color-mix(in srgb, var(--rx-accent) 13%, transparent);
      --rx-accent-border: color-mix(in srgb, var(--rx-accent) 38%, transparent);
      --rx-success: #4ade80;
      --rx-success-soft: rgba(74, 222, 128, 0.11);
      --rx-warning: #e89b76;
      --rx-warning-soft: rgba(232, 155, 118, 0.13);
      --rx-danger: #f87171;
      --rx-danger-soft: rgba(248, 113, 113, 0.12);
      --rx-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.62), 0 0 0 1px var(--rx-border);
      --rx-widget-shadow: 0 12px 32px -6px rgba(0, 0, 0, 0.48);
      --rx-studio-radius: 14px;
      --rx-studio-blur: 18px;
      --rx-studio-zoom: 1;
      --rx-widget-opacity: 0.92;
      --rx-widget-radius: 999px;
      --rx-widget-zoom: 1;
      --rx-widget-preview-zoom: 1;
      --rx-widget-font-family: var(--rx-font-ui);
      --rx-widget-font-size: 12px;
      --rx-card-sheen: rgba(255, 255, 255, 0.04);
      --rx-shell-bg: var(--rx-bg);
      --rx-sidebar-bg: var(--rx-theme-sidebar);
      --rx-main-bg: var(--rx-bg);
      --rx-shell-glow: none;

      font-family: var(--rx-font-ui);
      color: var(--rx-fg);
      font-size: 13px;
      line-height: 1.48;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    .studio-root[data-theme="light"] {
      --rx-theme-bg: #f3f2ec;
      --rx-theme-sidebar: #eae8e0;
      --rx-theme-surface: #faf9f5;
      --rx-theme-surface-2: #e6e4db;
      --rx-theme-fg: #262730;
      --rx-theme-fg-strong: #15161c;
      --rx-theme-muted: #5d606e;
      --rx-theme-border: rgba(20, 22, 28, 0.10);
      --rx-theme-border-strong: rgba(20, 22, 28, 0.18);
      --rx-hover: rgba(20, 22, 28, 0.048);
      --rx-success: #2f855a;
      --rx-success-soft: rgba(47, 133, 90, 0.11);
      --rx-warning: #b45309;
      --rx-warning-soft: rgba(180, 83, 9, 0.10);
      --rx-danger: #c53030;
      --rx-danger-soft: rgba(197, 48, 48, 0.10);
      --rx-shadow: 0 22px 54px -10px rgba(15, 23, 42, 0.15), 0 0 0 1px var(--rx-border);
      --rx-widget-shadow: 0 10px 26px -6px rgba(15, 23, 42, 0.11);
      --rx-card-sheen: rgba(255, 255, 255, 0.55);
    }

    /* === Studio Window Themes === */
    .studio-root[data-studio-theme="obsidian"] .modal-shell {
      background: var(--rx-shell-bg);
      box-shadow: var(--rx-shadow);
    }

    /* Claude Code Dark (Anthropic Editorial Charcoal & Terracotta) */
    .studio-root[data-studio-theme="claude-dark"] {
      --rx-bg: #1f1e1d;
      --rx-sidebar-bg: #181716;
      --rx-main-bg: #1f1e1d;
      --rx-shell-bg: #1f1e1d;
      --rx-surface: #262624;
      --rx-surface-2: #30302e;
      --rx-glass: rgba(38, 38, 36, 0.94);
      --rx-glass-strong: rgba(28, 27, 26, 0.97);
      --rx-fg: #dcd9d0;
      --rx-fg-strong: #faf9f5;
      --rx-muted: #9e9b91;
      --rx-border: rgba(250, 249, 245, 0.08);
      --rx-border-strong: rgba(250, 249, 245, 0.15);
      --rx-hover: rgba(250, 249, 245, 0.055);
      --rx-success: #8fba6a;
      --rx-success-soft: rgba(143, 186, 106, 0.13);
      --rx-warning: #e89b76;
      --rx-warning-soft: rgba(232, 155, 118, 0.14);
      --rx-danger: #e06c65;
      --rx-danger-soft: rgba(224, 108, 101, 0.14);
      --rx-shadow: 0 26px 68px -12px rgba(0, 0, 0, 0.66), 0 0 0 1px rgba(250, 249, 245, 0.09);
      --rx-shell-glow: none;
    }

    /* Claude Code Light (Anthropic Warm Parchment & Charcoal Ink) */
    .studio-root[data-studio-theme="claude-light"] {
      --rx-bg: #f5f3ec;
      --rx-sidebar-bg: #ebe8de;
      --rx-main-bg: #f5f3ec;
      --rx-shell-bg: #f5f3ec;
      --rx-surface: #fbfaf6;
      --rx-surface-2: #e7e4d8;
      --rx-glass: rgba(251, 250, 246, 0.94);
      --rx-glass-strong: rgba(245, 243, 236, 0.97);
      --rx-fg: #3b3a36;
      --rx-fg-strong: #141413;
      --rx-muted: #727067;
      --rx-border: rgba(20, 20, 19, 0.09);
      --rx-border-strong: rgba(20, 20, 19, 0.16);
      --rx-hover: rgba(20, 20, 19, 0.045);
      --rx-success: #5d7a46;
      --rx-success-soft: rgba(93, 122, 70, 0.12);
      --rx-warning: #b86234;
      --rx-warning-soft: rgba(184, 98, 52, 0.12);
      --rx-danger: #c4433d;
      --rx-danger-soft: rgba(196, 67, 61, 0.11);
      --rx-shadow: 0 24px 58px -12px rgba(20, 20, 19, 0.18), 0 0 0 1px rgba(20, 20, 19, 0.10);
      --rx-shell-glow: none;
    }

    .studio-root[data-studio-theme="frosted"] {
      --rx-shell-bg: color-mix(in srgb, var(--rx-bg) 78%, transparent);
      --rx-sidebar-bg: color-mix(in srgb, var(--rx-surface) 66%, transparent);
      --rx-main-bg: color-mix(in srgb, var(--rx-bg) 60%, transparent);
      --rx-surface: color-mix(in srgb, var(--rx-theme-surface) 74%, transparent);
      --rx-surface-2: color-mix(in srgb, var(--rx-theme-surface-2) 82%, transparent);
    }
    .studio-root[data-studio-theme="frosted"] .modal-shell {
      backdrop-filter: blur(var(--rx-studio-blur)) saturate(160%);
      -webkit-backdrop-filter: blur(var(--rx-studio-blur)) saturate(160%);
      box-shadow: var(--rx-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.09);
    }

    .studio-root[data-studio-theme="neon-cyber"] {
      --rx-bg: #08090f;
      --rx-surface: #0f111c;
      --rx-surface-2: #16192a;
      --rx-shell-bg: #08090f;
      --rx-sidebar-bg: #0b0c14;
      --rx-main-bg: #08090f;
      --rx-border: color-mix(in srgb, var(--rx-accent) 22%, rgba(255, 255, 255, 0.06));
      --rx-border-strong: color-mix(in srgb, var(--rx-accent) 36%, rgba(255, 255, 255, 0.10));
    }
    .studio-root[data-studio-theme="neon-cyber"][data-theme="light"] {
      --rx-bg: #f6f8ff;
      --rx-surface: #eef2ff;
      --rx-surface-2: #e4e9ff;
      --rx-shell-bg: #f6f8ff;
      --rx-sidebar-bg: #edf1ff;
      --rx-main-bg: #f8faff;
      --rx-border: color-mix(in srgb, var(--rx-accent) 22%, rgba(15, 23, 42, 0.08));
      --rx-border-strong: color-mix(in srgb, var(--rx-accent) 34%, rgba(15, 23, 42, 0.14));
    }
    .studio-root[data-studio-theme="neon-cyber"] .modal-shell {
      border-color: color-mix(in srgb, var(--rx-accent) 44%, transparent);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.62), 0 0 0 1px color-mix(in srgb, var(--rx-accent) 30%, transparent);
    }
    .studio-root[data-studio-theme="neon-cyber"][data-theme="light"] .modal-shell {
      box-shadow: 0 18px 46px rgba(15, 23, 42, 0.16), 0 0 0 1px color-mix(in srgb, var(--rx-accent) 28%, transparent);
    }

    .studio-root[data-studio-theme="minimal-mono"] {
      --rx-shell-glow: none;
      --rx-sidebar-bg: var(--rx-bg);
      --rx-main-bg: var(--rx-bg);
    }
    .studio-root[data-studio-theme="minimal-mono"] .modal-shell {
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.42);
      border-color: var(--rx-border-strong);
    }

    .studio-root[data-studio-theme="aurora"] {
      --rx-shell-bg: #0b0c12;
      --rx-sidebar-bg: color-mix(in srgb, var(--rx-accent) 6%, #0f111a);
      --rx-main-bg: transparent;
      --rx-shell-glow: radial-gradient(520px circle at 12% 0%, color-mix(in srgb, var(--rx-accent) 11%, transparent), transparent 62%);
    }
    .studio-root[data-studio-theme="aurora"][data-theme="light"] {
      --rx-shell-bg: #f8f9fc;
      --rx-sidebar-bg: color-mix(in srgb, var(--rx-accent) 4%, #f2f4f9);
    }
    .studio-root[data-studio-theme="aurora"] .modal-shell {
      backdrop-filter: blur(var(--rx-studio-blur)) saturate(145%);
      -webkit-backdrop-filter: blur(var(--rx-studio-blur)) saturate(145%);
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
      from { opacity: 0.92; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes rxModalIn {
      from { opacity: 0.95; transform: scale(0.994) translateY(3px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes rxDrawerIn {
      from { opacity: 0.95; transform: translateX(6px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes rxPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.42; }
    }

    /* === Floating Widget === */
    .widget-wrap {
      position: fixed;
      z-index: 40;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      font-family: var(--rx-font-ui);
      width: max-content;
      max-width: calc(100vw - 16px);
      max-height: calc(100vh - 16px);
    }
    .widget-wrap.is-hidden { display: none; }
    .widget-wrap.dock-bottom-right { right: 18px; bottom: 14px; }
    .widget-wrap.dock-top-right { right: 18px; top: 76px; }
    .widget-wrap.dock-top-left { left: 268px; top: 76px; }
    .widget-wrap.dock-middle-right { right: 18px; top: 50%; transform: translateY(-50%); }
    .widget-wrap.dock-bottom-left { left: 268px; bottom: 14px; }
    .widget-wrap.dock-inline-header { right: 204px; top: 34px; }
    .widget-wrap.is-dragging { opacity: 0.94; }

    .mini-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 32px;
      max-width: min(580px, calc((100vw - 24px) / var(--rx-widget-zoom)));
      padding: 0 6px 0 11px;
      border-radius: var(--rx-widget-radius);
      background: color-mix(in srgb, var(--rx-theme-surface, var(--rx-surface)) calc(var(--rx-widget-opacity) * 100%), transparent);
      backdrop-filter: blur(16px) saturate(140%);
      -webkit-backdrop-filter: blur(16px) saturate(140%);
      border: 1px solid var(--rx-theme-border-strong, var(--rx-border-strong));
      box-shadow: var(--rx-widget-shadow);
      color: var(--rx-theme-fg, var(--rx-fg));
      font-family: var(--rx-widget-font-family, var(--rx-font-ui));
      font-size: var(--rx-widget-font-size, 12px);
      font-weight: 500;
      cursor: pointer;
      animation: rxWidgetIn 0.14s ease-out;
      transition: border-color 0.14s ease, transform 0.14s ease, box-shadow 0.14s ease;
    }
    .widget-wrap.is-docked-ui .mini-pill,
    .widget-wrap.is-docked-ui .med-card {
      box-shadow: 0 2px 10px -2px rgba(0, 0, 0, 0.14);
    }
    .widget-wrap.dock-inline-header .mini-pill {
      height: 28px;
      padding: 0 5px 0 9px;
      border-radius: min(var(--rx-widget-radius), 8px);
      box-shadow: none;
    }
    .preview-stage .mini-pill,
    .preview-stage .med-card {
      zoom: var(--rx-widget-preview-zoom);
      animation: none !important;
      cursor: default;
    }
    .widget-wrap .mini-pill,
    .widget-wrap .med-card {
      zoom: var(--rx-widget-zoom);
    }
    .widget-wrap.is-locked .mini-pill,
    .widget-wrap.is-locked .med-card { cursor: pointer; }
    .widget-wrap.is-dragging .mini-pill,
    .widget-wrap.is-dragging .med-card { cursor: grabbing; }
    .widget-wrap.is-resize-holding .mini-pill,
    .widget-wrap.is-resize-holding .med-card {
      border-color: color-mix(in srgb, var(--rx-accent) 62%, var(--rx-border-strong));
    }
    .widget-wrap.is-resizing .mini-pill,
    .widget-wrap.is-resizing .med-card {
      cursor: nwse-resize;
      border-color: var(--rx-accent) !important;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--rx-accent) 36%, transparent), var(--rx-widget-shadow) !important;
    }
    .widget-wrap.is-resizing.dock-bottom-left .mini-pill,
    .widget-wrap.is-resizing.dock-bottom-left .med-card,
    .widget-wrap.is-resizing.dock-top-right .mini-pill,
    .widget-wrap.is-resizing.dock-top-right .med-card { cursor: nesw-resize; }
    .mini-pill:hover { border-color: color-mix(in srgb, var(--rx-fg) 26%, transparent); }

    .resize-hud-badge {
      position: absolute;
      top: -28px;
      right: 0;
      display: none;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 6px;
      background: var(--rx-accent);
      color: var(--rx-accent-fg);
      font-family: var(--rx-font-mono);
      font-size: 10.5px;
      font-weight: 600;
      line-height: 1.3;
      pointer-events: none;
      z-index: 30;
      white-space: nowrap;
    }
    .widget-wrap.is-resizing .resize-hud-badge,
    .modal-shell.is-resizing .resize-hud-badge { display: inline-flex; }
    .modal-shell .resize-hud-badge {
      top: auto;
      bottom: 14px;
      right: 26px;
    }

    .pill-actions {
      display: inline-flex;
      align-items: center;
      gap: 1px;
      padding-left: 4px;
      margin-left: 1px;
      border-left: 1px solid var(--rx-border);
      flex-shrink: 0;
    }

    /* === Widget Themes === */
    [data-widget-theme="glass"] .mini-pill,
    [data-widget-theme="glass"] .med-card {
      background: color-mix(in srgb, var(--rx-theme-surface, var(--rx-surface)) calc(var(--rx-widget-opacity) * 94%), transparent);
      border-color: var(--rx-theme-border-strong, var(--rx-border-strong));
      color: var(--rx-theme-fg, var(--rx-fg));
      box-shadow: var(--rx-widget-shadow), inset 0 1px 0 var(--rx-card-sheen);
    }

    /* Claude Code Widget Theme */
    [data-widget-theme="claude"] .mini-pill,
    [data-widget-theme="claude"] .med-card {
      background: color-mix(in srgb, #242321 calc(var(--rx-widget-opacity) * 100%), transparent);
      border-color: rgba(250, 249, 245, 0.14);
      color: #e6e3da;
      box-shadow: 0 14px 36px -8px rgba(0, 0, 0, 0.55);
    }
    [data-widget-theme="claude"] .med-tps-num,
    [data-widget-theme="claude"] .med-stat-val,
    [data-widget-theme="claude"] .med-phase,
    [data-widget-theme="claude"] .status-chip,
    [data-widget-theme="claude"] .metric-chip b { color: #faf9f5; }
    [data-widget-theme="claude"] .med-tps-unit { color: #d97757; }
    [data-widget-theme="claude"] .lang-pill-btn {
      background: #30302e;
      border-color: rgba(250, 249, 245, 0.14);
      color: #faf9f5;
    }
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .mini-pill,
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .med-card,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .mini-pill,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .med-card,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .mini-pill,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .med-card {
      background: color-mix(in srgb, var(--rx-theme-surface, #faf9f5) calc(var(--rx-widget-opacity) * 100%), transparent);
      border-color: var(--rx-theme-border-strong, rgba(20, 20, 19, 0.16));
      color: var(--rx-theme-fg, #3b3a36);
      box-shadow: 0 8px 24px -6px rgba(20, 20, 19, 0.13);
    }
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .med-tps-num,
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .med-stat-val,
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .med-phase,
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .status-chip,
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .metric-chip b,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .med-tps-num,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .med-stat-val,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .med-phase,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .status-chip,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .metric-chip b,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .med-tps-num,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .med-stat-val,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .med-phase,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .status-chip,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .metric-chip b { color: var(--rx-theme-fg-strong, #141413); }
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .med-tps-unit,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .med-tps-unit,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .med-tps-unit { color: var(--rx-accent, #c15f3c); }
    .studio-root[data-theme="light"] [data-widget-theme="claude"] .lang-pill-btn,
    .studio-root[data-app-theme="light"] .widget-wrap[data-widget-theme="claude"] .lang-pill-btn,
    .studio-root[data-studio-theme="claude-light"] [data-widget-theme="claude"] .lang-pill-btn {
      background: var(--rx-theme-surface-2, #ebe8de);
      border-color: var(--rx-theme-border-strong, rgba(20, 20, 19, 0.16));
      color: var(--rx-theme-fg-strong, #141413);
    }
    .studio-root[data-app-theme="light"] .widget-wrap .med-header,
    .studio-root[data-app-theme="light"] .widget-wrap .med-stats-grid,
    .studio-root[data-app-theme="light"] .widget-wrap .med-stat-tile + .med-stat-tile,
    .studio-root[data-app-theme="light"] .widget-wrap .med-quota-card,
    .studio-root[data-app-theme="light"] .widget-wrap .med-footer,
    .studio-root[data-app-theme="light"] .widget-wrap .pill-actions,
    .studio-root[data-app-theme="light"] .widget-wrap .pill-sep { border-color: var(--rx-theme-border-strong, rgba(20, 20, 19, 0.14)); }
    .studio-root[data-app-theme="light"] .widget-wrap .med-spark-box,
    .studio-root[data-app-theme="light"] .widget-wrap .med-footer { background: color-mix(in srgb, var(--rx-theme-bg, #f5f3ec) 68%, transparent); }
    .studio-root[data-app-theme="light"] .widget-wrap .med-stat-label,
    .studio-root[data-app-theme="light"] .widget-wrap .med-quota-card,
    .studio-root[data-app-theme="light"] .widget-wrap .med-model-tag,
    .studio-root[data-app-theme="light"] .widget-wrap .med-peak-pill,
    .studio-root[data-app-theme="light"] .widget-wrap .icon-btn,
    .studio-root[data-app-theme="light"] .widget-wrap .metric-chip.is-muted { color: var(--rx-theme-muted, #5d606e); }
    .studio-root[data-app-theme="light"] .widget-wrap .icon-btn:hover,
    .studio-root[data-app-theme="light"] .widget-wrap .med-persona-pill,
    .studio-root[data-app-theme="light"] .widget-wrap .med-peak-pill b,
    .studio-root[data-app-theme="light"] .widget-wrap .status-chip,
    .studio-root[data-app-theme="light"] .widget-wrap .metric-chip,
    .studio-root[data-app-theme="light"] .widget-wrap .metric-chip b { color: var(--rx-theme-fg-strong, #141413); }
    .studio-root[data-app-theme="light"] .widget-wrap .med-quota-val { color: var(--rx-theme-fg-strong, #141413) !important; }
    .studio-root[data-app-theme="light"] .widget-wrap .lang-pill-btn {
      background: var(--rx-theme-surface-2, #ebe8de);
      border-color: var(--rx-theme-border-strong, rgba(20, 20, 19, 0.16));
      color: var(--rx-theme-fg-strong, #141413);
    }

    /* Dynamic Island (always dark high-contrast surface even on light app themes) */
    [data-widget-theme="island"] .mini-pill,
    [data-widget-theme="island"] .med-card {
      background: #08080a !important;
      border-color: rgba(255, 255, 255, 0.14) !important;
      color: #e5e7ef !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.64);
    }
    [data-widget-theme="island"] .med-tps-num,
    [data-widget-theme="island"] .med-stat-val,
    [data-widget-theme="island"] .med-phase,
    [data-widget-theme="island"] .status-chip,
    [data-widget-theme="island"] .med-persona-pill,
    [data-widget-theme="island"] .med-peak-pill b,
    [data-widget-theme="island"] .icon-btn:hover { color: #ffffff !important; }
    [data-widget-theme="island"] .metric-chip,
    [data-widget-theme="island"] .metric-chip b,
    [data-widget-theme="island"] .med-quota-val { color: #f4f5f8 !important; }
    [data-widget-theme="island"] .metric-chip.is-muted,
    [data-widget-theme="island"] .med-stat-label,
    [data-widget-theme="island"] .med-quota-card,
    [data-widget-theme="island"] .med-model-tag,
    [data-widget-theme="island"] .med-peak-pill,
    [data-widget-theme="island"] .icon-btn { color: #a1a1aa !important; }
    [data-widget-theme="island"] .lang-pill-btn {
      background: rgba(255, 255, 255, 0.10) !important;
      border-color: rgba(255, 255, 255, 0.16) !important;
      color: #ffffff !important;
    }
    [data-widget-theme="island"] .med-spark-box,
    [data-widget-theme="island"] .med-footer { background: rgba(255, 255, 255, 0.04) !important; }
    [data-widget-theme="island"] .med-header,
    [data-widget-theme="island"] .med-stats-grid,
    [data-widget-theme="island"] .med-stat-tile + .med-stat-tile,
    [data-widget-theme="island"] .med-quota-card,
    [data-widget-theme="island"] .med-footer,
    [data-widget-theme="island"] .pill-actions,
    [data-widget-theme="island"] .pill-sep { border-color: rgba(255, 255, 255, 0.12) !important; }

    /* Neon HUD (always dark high-contrast surface even on light app themes) */
    [data-widget-theme="neon"] .mini-pill,
    [data-widget-theme="neon"] .med-card {
      background: color-mix(in srgb, #090b14 calc(var(--rx-widget-opacity) * 96%), transparent) !important;
      border-color: color-mix(in srgb, var(--rx-accent) 52%, transparent) !important;
      color: #e5e7ef !important;
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--rx-accent) 22%, transparent), var(--rx-widget-shadow);
    }
    [data-widget-theme="neon"] .metric-chip,
    [data-widget-theme="neon"] .metric-chip b,
    [data-widget-theme="neon"] .med-tps-num,
    [data-widget-theme="neon"] .med-stat-val,
    [data-widget-theme="neon"] .med-phase,
    [data-widget-theme="neon"] .status-chip,
    [data-widget-theme="neon"] .med-persona-pill,
    [data-widget-theme="neon"] .med-peak-pill b,
    [data-widget-theme="neon"] .med-quota-val,
    [data-widget-theme="neon"] .icon-btn:hover { color: #ffffff !important; }
    [data-widget-theme="neon"] .metric-chip.is-muted,
    [data-widget-theme="neon"] .med-stat-label,
    [data-widget-theme="neon"] .med-quota-card,
    [data-widget-theme="neon"] .med-model-tag,
    [data-widget-theme="neon"] .med-peak-pill,
    [data-widget-theme="neon"] .icon-btn { color: #a1a1aa !important; }
    [data-widget-theme="neon"] .lang-pill-btn {
      background: rgba(255, 255, 255, 0.10) !important;
      border-color: color-mix(in srgb, var(--rx-accent) 36%, rgba(255, 255, 255, 0.14)) !important;
      color: #ffffff !important;
    }
    [data-widget-theme="neon"] .med-spark-box,
    [data-widget-theme="neon"] .med-footer { background: rgba(255, 255, 255, 0.04) !important; }
    [data-widget-theme="neon"] .med-header,
    [data-widget-theme="neon"] .med-stats-grid,
    [data-widget-theme="neon"] .med-stat-tile + .med-stat-tile,
    [data-widget-theme="neon"] .med-quota-card,
    [data-widget-theme="neon"] .med-footer,
    [data-widget-theme="neon"] .pill-actions,
    [data-widget-theme="neon"] .pill-sep { border-color: rgba(255, 255, 255, 0.12) !important; }

    /* Minimal */
    [data-widget-theme="minimal"] .mini-pill,
    [data-widget-theme="minimal"] .med-card {
      background: color-mix(in srgb, var(--rx-theme-bg, var(--rx-bg)) 82%, transparent);
      border-color: var(--rx-theme-border-strong, var(--rx-border));
      color: var(--rx-theme-fg, var(--rx-fg));
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
    }

    /* Solid Contrast */
    [data-widget-theme="solid"] .mini-pill,
    [data-widget-theme="solid"] .med-card {
      background: var(--rx-theme-surface, var(--rx-surface));
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border-color: var(--rx-theme-border-strong, var(--rx-border-strong));
      color: var(--rx-theme-fg, var(--rx-fg));
      box-shadow: var(--rx-widget-shadow);
    }

    .drag-grip {
      display: inline-flex;
      align-items: center;
      color: var(--rx-muted);
      opacity: 0.45;
      flex-shrink: 0;
    }
    .widget-wrap.is-locked .drag-grip { display: none; }

    .pill-sep {
      width: 1px;
      height: 12px;
      background: var(--rx-border-strong);
      flex-shrink: 0;
    }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--rx-fg-strong);
      font-weight: 550;
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
    .metric-chip b { font-weight: 600; color: var(--rx-fg-strong); }
    .metric-chip.is-muted { color: var(--rx-muted); }
    .metric-chip.is-muted b { color: var(--rx-fg); font-weight: 550; }

    .model-badge {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 1px 6px;
      border-radius: 4px;
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
      border-radius: 5px;
      padding: 2px 6px;
      font-family: var(--rx-font-mono);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
      cursor: pointer;
      flex-shrink: 0;
      transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
    }
    .lang-pill-btn:hover {
      border-color: var(--rx-accent-border);
      background: var(--rx-accent-soft);
      color: var(--rx-accent);
    }

    .icon-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--rx-muted);
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .icon-btn:hover { background: var(--rx-hover); color: var(--rx-fg-strong); }
    .icon-btn.is-primary { color: var(--rx-fg); }
    .icon-btn.is-primary:hover { color: var(--rx-accent); }
    .icon-btn.is-pinned { color: var(--rx-accent); background: var(--rx-accent-soft); }

    .le-dot-ind {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--rx-warning);
    }

    /* === Medium Card (M) — Clean Hairline Architecture === */
    .med-card {
      width: 318px;
      max-width: calc((100vw - 24px) / var(--rx-widget-zoom));
      max-height: calc((100vh - 24px) / var(--rx-widget-zoom));
      border-radius: min(var(--rx-widget-radius), 14px);
      background: color-mix(in srgb, var(--rx-theme-surface, var(--rx-surface)) calc(var(--rx-widget-opacity) * 100%), transparent);
      backdrop-filter: blur(18px) saturate(145%);
      -webkit-backdrop-filter: blur(18px) saturate(145%);
      border: 1px solid var(--rx-theme-border-strong, var(--rx-border-strong));
      box-shadow: var(--rx-shadow);
      font-family: var(--rx-widget-font-family, var(--rx-font-ui));
      font-size: var(--rx-widget-font-size, 12px);
      overflow: hidden;
      cursor: grab;
      animation: rxWidgetIn 0.14s ease-out;
    }
    .med-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--rx-border);
    }
    .med-head-left {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .med-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .med-phase {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--rx-fg-strong);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .med-head-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .med-body {
      display: flex;
      flex-direction: column;
    }
    .med-telemetry-stage {
      padding: 12px 13px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
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
      gap: 6px;
    }
    .med-tps-num {
      font-size: 26px;
      font-weight: 650;
      letter-spacing: -0.03em;
      color: var(--rx-fg-strong);
      line-height: 1;
    }
    .med-tps-unit {
      font-size: 11px;
      font-weight: 600;
      color: var(--rx-accent);
    }
    .med-peak,
    .med-peak-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--rx-muted);
    }
    .med-peak b,
    .med-peak-pill b { color: var(--rx-fg-strong); font-weight: 600; }

    .med-spark-box {
      height: 40px;
      border-radius: 6px;
      background: color-mix(in srgb, var(--rx-bg) 72%, transparent);
      border: 1px solid var(--rx-border);
      padding: 3px 4px;
      display: flex;
      align-items: center;
    }
    .med-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-top: 1px solid var(--rx-border);
    }
    .med-stat-tile {
      padding: 8px 13px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .med-stat-tile + .med-stat-tile {
      border-left: 1px solid var(--rx-border);
    }
    .med-stat-label { font-size: 10px; color: var(--rx-muted); }
    .med-stat-val { font-size: 12.5px; font-weight: 600; color: var(--rx-fg-strong); }

    .med-quota-row,
    .med-quota-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
      color: var(--rx-muted);
      padding: 8px 13px;
      border-top: 1px solid var(--rx-border);
    }
    .med-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 13px;
      border-top: 1px solid var(--rx-border);
      background: color-mix(in srgb, var(--rx-bg) 44%, transparent);
      font-size: 11px;
    }
    .med-model-tag {
      color: var(--rx-muted);
      flex: 0 1 auto;
      min-width: 68px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }
    .med-persona-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid var(--rx-border);
      background: transparent;
      color: var(--rx-fg);
      border-radius: 5px;
      padding: 2.5px 7px;
      font-size: 10.5px;
      font-weight: 500;
      cursor: pointer;
      max-width: 175px;
      flex-shrink: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
    }
    .med-persona-pill:hover {
      border-color: var(--rx-border-strong);
      background: var(--rx-hover);
      color: var(--rx-fg-strong);
    }

    /* === Settings Modal & Floating Appearance Drawer === */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483200;
      background: rgba(8, 8, 10, 0.54);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
    }
    .modal-backdrop.is-appearance-live {
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      justify-content: flex-end;
      align-items: stretch;
      padding: 14px;
      pointer-events: none;
    }

    .modal-shell {
      position: relative;
      pointer-events: auto;
      zoom: var(--rx-studio-zoom);
      width: min(940px, calc((100vw - 40px) / var(--rx-studio-zoom)));
      height: min(664px, calc((100vh - 44px) / var(--rx-studio-zoom)));
      max-width: calc((100vw - 40px) / var(--rx-studio-zoom));
      max-height: calc((100vh - 44px) / var(--rx-studio-zoom));
      border-radius: var(--rx-studio-radius);
      background: var(--rx-shell-bg);
      background-image: var(--rx-shell-glow);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow);
      display: flex;
      overflow: hidden;
      animation: rxModalIn 0.15s ease-out;
    }
    .modal-shell.is-appearance-live {
      pointer-events: auto;
      width: min(478px, calc((100vw - 28px) / var(--rx-studio-zoom)));
      height: calc((100vh - 32px) / var(--rx-studio-zoom));
      max-width: calc((100vw - 28px) / var(--rx-studio-zoom));
      max-height: calc((100vh - 32px) / var(--rx-studio-zoom));
      border-radius: var(--rx-studio-radius);
      background: var(--rx-glass-strong);
      background-image: var(--rx-shell-glow);
      backdrop-filter: blur(var(--rx-studio-blur));
      -webkit-backdrop-filter: blur(var(--rx-studio-blur));
      animation: rxDrawerIn 0.15s ease-out;
    }
    .modal-shell.is-resize-holding {
      border-color: color-mix(in srgb, var(--rx-accent) 62%, var(--rx-border-strong));
    }
    .modal-shell.is-resizing {
      border-color: var(--rx-accent) !important;
      animation: none;
      cursor: nwse-resize;
    }
    .modal-resize-grip {
      position: absolute;
      right: 3px;
      bottom: 3px;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 3px;
      cursor: pointer;
      color: var(--rx-muted);
      opacity: 0.4;
      z-index: 25;
      user-select: none;
      -webkit-user-select: none;
    }
    .modal-resize-grip:hover { opacity: 0.85; color: var(--rx-accent); }
    .modal-shell.is-resizing .modal-resize-grip { cursor: nwse-resize; opacity: 1; color: var(--rx-accent); }

    /* === Sidebar (Calm Editorial Chrome) === */
    .modal-sidebar {
      width: 204px;
      flex-shrink: 0;
      background: var(--rx-sidebar-bg);
      border-right: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      padding: 16px 10px 12px;
      gap: 8px;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 8px 14px;
      margin-bottom: 2px;
      border-bottom: 1px solid var(--rx-border);
    }
    .brand-title-wrap {
      display: inline-flex;
      align-items: center;
      gap: 9px;
    }
    .brand-logo-dot {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border-strong);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--rx-fg-strong);
      flex-shrink: 0;
    }
    .brand-title {
      font-size: 14px;
      font-weight: 650;
      letter-spacing: -0.02em;
      color: var(--rx-fg-strong);
    }
    .brand-ver {
      font-family: var(--rx-font-mono);
      font-size: 10px;
      color: var(--rx-muted);
      letter-spacing: 0.01em;
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    .nav-group-label {
      font-size: 9.5px;
      font-weight: 650;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--rx-muted);
      opacity: 0.72;
      padding: 8px 10px 3px;
      user-select: none;
    }
    .nav-group-label:first-child { padding-top: 2px; }
    .rx-search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .rx-search-box .rx-search-input {
      padding-right: 24px;
    }
    .rx-search-clear {
      position: absolute;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--rx-muted);
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .rx-search-clear:hover { background: var(--rx-hover); color: var(--rx-fg-strong); }
    .rx-search-hits {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-top: 6px;
      max-height: 210px;
      overflow-y: auto;
    }
    .rx-search-empty {
      font-size: 11px;
      color: var(--rx-muted);
      padding: 5px 7px;
      border-radius: 6px;
      background: var(--rx-surface);
      border: 1px dashed var(--rx-border);
    }
    .modal-shell[data-studio-layout="rail"] .nav-group-label,
    .modal-shell[data-studio-layout="rail"] .rx-search-wrap,
    .modal-shell[data-studio-layout="topbar"] .nav-group-label,
    .modal-shell[data-studio-layout="topbar"] .rx-search-wrap {
      display: none;
    }
    .modal-header-search {
      display: none;
      position: relative;
      width: 176px;
    }
    .modal-shell[data-studio-layout="rail"] .modal-header-search,
    .modal-shell[data-studio-layout="topbar"] .modal-header-search {
      display: block;
    }
    .modal-header-search .rx-search-hits {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      width: 260px;
      padding: 6px;
      border-radius: 9px;
      background: var(--rx-shell-bg);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow);
      z-index: 40;
    }
    .modal-sticky-subtabs {
      padding: 0 22px;
      background: var(--rx-main-bg);
      border-bottom: 1px solid var(--rx-border);
      flex-shrink: 0;
    }
    .modal-shell.is-appearance-live .modal-sticky-subtabs {
      padding: 0 14px;
      background: transparent;
    }
    .modal-sticky-subtabs .subtab-bar {
      border-bottom: none;
      overflow-x: auto;
      flex-wrap: nowrap;
      scrollbar-width: none;
    }
    .modal-sticky-subtabs .subtab-bar::-webkit-scrollbar { display: none; }
    .modal-global-toast {
      position: absolute;
      left: 50%;
      bottom: 14px;
      transform: translateX(-50%);
      z-index: 35;
      pointer-events: none;
      max-width: min(440px, 86%);
      padding: 6px 12px;
      border-radius: 8px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border-strong);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.34);
      font-size: 11.5px;
      font-weight: 550;
      color: var(--rx-success);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .modal-global-toast.is-err { color: var(--rx-danger); border-color: color-mix(in srgb, var(--rx-danger) 40%, var(--rx-border-strong)); }
    .modal-global-toast:empty { display: none; }
    .suite-quick-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }
    .theme-filter-pills {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px;
      border-radius: 6px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
    }
    .theme-filter-pill {
      border: none;
      background: transparent;
      color: var(--rx-muted);
      font-family: inherit;
      font-size: 10.5px;
      font-weight: 550;
      padding: 2.5px 7px;
      border-radius: 4px;
      cursor: pointer;
    }
    .theme-filter-pill:hover { color: var(--rx-fg-strong); }
    .theme-filter-pill.is-active {
      background: var(--rx-surface-2);
      color: var(--rx-fg-strong);
      box-shadow: inset 0 0 0 1px var(--rx-border-strong);
    }
    .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 7.5px 10px;
      border-radius: 7px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--rx-muted);
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .nav-item:hover { background: var(--rx-hover); color: var(--rx-fg-strong); }
    .nav-item.is-active {
      background: var(--rx-surface-2);
      color: var(--rx-fg-strong);
      font-weight: 600;
    }
    .nav-item.is-active::before {
      content: "";
      position: absolute;
      left: 0;
      top: 7px;
      bottom: 7px;
      width: 2.5px;
      border-radius: 2px;
      background: var(--rx-accent);
    }
    .nav-ic { display: inline-flex; align-items: center; flex-shrink: 0; opacity: 0.82; }
    .nav-item.is-active .nav-ic { opacity: 1; color: var(--rx-accent); }
    .nav-label { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nav-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--rx-success); flex-shrink: 0; }
    .nav-badge {
      font-size: 10px;
      font-weight: 550;
      padding: 1.5px 6px;
      border-radius: 4px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      color: var(--rx-muted);
      white-space: nowrap;
    }
    .badge-active {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10.5px;
      font-weight: 550;
      padding: 1.5px 7px;
      border-radius: 4px;
      background: var(--rx-success-soft);
      border: 1px solid color-mix(in srgb, var(--rx-success) 26%, transparent);
      color: var(--rx-success);
      white-space: nowrap;
    }

    .sidebar-foot {
      padding: 10px 6px 2px;
      border-top: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 11px;
      color: var(--rx-muted);
    }
    .sidebar-foot-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .sidebar-quick-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .modal-main {
      flex: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--rx-main-bg);
    }
    .modal-shell.is-appearance-live .modal-main { background: transparent; }

    /* === Studio Window Layouts === */
    .modal-shell[data-studio-layout="rail"] .modal-sidebar {
      width: 70px;
      padding: 14px 6px;
      align-items: center;
    }
    .modal-shell[data-studio-layout="rail"] .sidebar-brand {
      justify-content: center;
      padding: 2px 0 12px;
    }
    .modal-shell[data-studio-layout="rail"] .brand-title,
    .modal-shell[data-studio-layout="rail"] .brand-ver,
    .modal-shell[data-studio-layout="rail"] .sidebar-foot-hint,
    .modal-shell[data-studio-layout="rail"] .nav-dot,
    .modal-shell[data-studio-layout="rail"] .sidebar-foot .kbd {
      display: none;
    }
    .modal-shell[data-studio-layout="rail"] .nav-list { width: 100%; align-items: center; }
    .modal-shell[data-studio-layout="rail"] .nav-item {
      flex-direction: column;
      justify-content: center;
      gap: 3px;
      padding: 7px 4px;
      text-align: center;
    }
    .modal-shell[data-studio-layout="rail"] .nav-label { font-size: 9.5px; width: 100%; text-align: center; }
    .modal-shell[data-studio-layout="rail"] .nav-badge { position: absolute; top: 3px; right: 4px; padding: 0 4px; font-size: 9px; }
    .modal-shell[data-studio-layout="rail"] .sidebar-foot { width: 100%; align-items: center; padding: 8px 2px 2px; }
    .modal-shell[data-studio-layout="rail"] .sidebar-foot-row { flex-direction: column; align-items: center; gap: 6px; }
    .modal-shell[data-studio-layout="rail"] .sidebar-quick-actions { flex-direction: column; gap: 4px; }

    .modal-shell[data-studio-layout="topbar"] { flex-direction: column; }
    .modal-shell[data-studio-layout="topbar"] .modal-sidebar {
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-right: none;
      border-bottom: 1px solid var(--rx-border);
      padding: 9px 16px;
      gap: 12px;
    }
    .modal-shell[data-studio-layout="topbar"] .sidebar-brand {
      padding: 0;
      margin: 0;
      border-bottom: none;
      gap: 8px;
      flex-shrink: 0;
    }
    .modal-shell[data-studio-layout="topbar"] .nav-list {
      flex-direction: row;
      align-items: center;
      justify-content: safe center;
      gap: 3px;
      overflow-x: auto;
      flex: 1 1 auto;
      scrollbar-width: none;
    }
    .modal-shell[data-studio-layout="topbar"] .nav-list::-webkit-scrollbar { display: none; }
    .modal-shell[data-studio-layout="topbar"] .nav-item {
      width: auto;
      padding: 6px 11px;
      flex-shrink: 0;
    }
    .modal-shell[data-studio-layout="topbar"] .nav-item.is-active::before {
      left: 8px;
      right: 8px;
      top: auto;
      bottom: 0;
      width: auto;
      height: 2px;
    }
    .modal-shell[data-studio-layout="topbar"] .sidebar-foot {
      border-top: none;
      padding: 0;
      flex-direction: row;
      align-items: center;
      flex-shrink: 0;
    }
    .modal-shell[data-studio-layout="topbar"] .sidebar-foot-hint { display: none; }

    .modal-shell[data-studio-layout="floating-glass"] {
      padding: 10px;
      gap: 10px;
      background: color-mix(in srgb, var(--rx-bg) 56%, transparent);
      backdrop-filter: blur(var(--rx-studio-blur));
      -webkit-backdrop-filter: blur(var(--rx-studio-blur));
    }
    .modal-shell[data-studio-layout="floating-glass"] .modal-sidebar,
    .modal-shell[data-studio-layout="floating-glass"] .modal-main {
      border: 1px solid var(--rx-border-strong);
      border-radius: max(8px, calc(var(--rx-studio-radius) - 4px));
    }
    .modal-shell[data-studio-layout="floating-glass"] .modal-main {
      background: color-mix(in srgb, var(--rx-bg) 88%, transparent);
    }

    /* === Header & Body === */
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 15px 22px 13px;
      border-bottom: 1px solid var(--rx-border);
      flex-shrink: 0;
    }
    .modal-header-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .modal-shell.is-appearance-live .modal-header { padding: 13px 16px; }
    .modal-title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.02em;
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
      padding: 16px 22px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-body > *,
    .section-group > *,
    .rx-details-body > *,
    .persona-stack > * {
      flex-shrink: 0;
    }
    .modal-shell.is-appearance-live .modal-body {
      padding: 14px 16px 18px;
      gap: 14px;
    }
    .modal-body::-webkit-scrollbar,
    .le-feed::-webkit-scrollbar { width: 5px; height: 5px; }
    .modal-body::-webkit-scrollbar-track,
    .le-feed::-webkit-scrollbar-track { background: transparent; }
    .modal-body::-webkit-scrollbar-thumb,
    .le-feed::-webkit-scrollbar-thumb { background: var(--rx-border-strong); border-radius: 999px; }

    /* === Sub-tabs (Editorial Underline Tabs + Segmented Option) === */
    .subtab-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px 4px;
      border-bottom: 1px solid var(--rx-border);
      flex-shrink: 0;
    }
    .subtab-bar.is-segmented {
      flex-wrap: nowrap;
    }
    .subtab-btn {
      position: relative;
      border: none;
      background: transparent;
      color: var(--rx-muted);
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      padding: 7px 10px 8px;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: color 0.12s ease;
    }
    .modal-shell.is-appearance-live .subtab-btn {
      padding: 6px 8px 7px;
    }
    .subtab-btn:hover { color: var(--rx-fg-strong); }
    .subtab-btn.is-active {
      color: var(--rx-fg-strong);
      font-weight: 600;
    }
    .subtab-btn.is-active::after {
      content: "";
      position: absolute;
      left: 6px;
      right: 6px;
      bottom: -1px;
      height: 2px;
      border-radius: 2px 2px 0 0;
      background: var(--rx-accent);
    }

    .subtab-bar.is-segmented {
      gap: 2px;
      padding: 2px;
      border-radius: 7px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
    }
    .subtab-bar.is-segmented .subtab-btn {
      flex: 1 1 auto;
      min-width: 0;
      padding: 5.5px 8px;
      border-radius: 5px;
      font-size: 11.5px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .subtab-bar.is-segmented .subtab-btn.is-active {
      background: var(--rx-surface-2);
      box-shadow: inset 0 0 0 1px var(--rx-border-strong);
    }
    .subtab-bar.is-segmented .subtab-btn.is-active::after { display: none; }

    /* === Primitives === */
    .section-group { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .section-label {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--rx-muted);
    }
    .card {
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      overflow: hidden;
      flex-shrink: 0;
    }
    .card-pad { padding: 13px 15px; }

    .row-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
    }
    .row-item + .row-item { border-top: 1px solid var(--rx-border); }
    .row-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .row-title { font-size: 12.5px; font-weight: 550; color: var(--rx-fg-strong); }
    .row-desc { font-size: 11.5px; color: var(--rx-muted); line-height: 1.4; }

    /* Tactile Flat Switch (No Neon Glow) */
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
      transition: background 0.16s ease, border-color 0.16s ease;
    }
    .switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: var(--rx-muted);
      transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), background 0.16s ease;
    }
    .switch.is-on {
      background: var(--rx-accent);
      border-color: var(--rx-accent);
    }
    .switch.is-on .switch-thumb {
      transform: translateX(15px);
      background: var(--rx-accent-fg);
    }

    /* Tactile Flat Buttons (No Glossy AI Gradients) */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6.5px 12px;
      border-radius: 7px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-surface);
      color: var(--rx-fg-strong);
      font-family: inherit;
      font-size: 12px;
      font-weight: 550;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease, opacity 0.12s ease;
    }
    .btn:hover:not(:disabled) {
      background: var(--rx-surface-2);
      border-color: color-mix(in srgb, var(--rx-fg) 26%, transparent);
    }
    .btn:active:not(:disabled) { transform: translateY(0.5px); }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-primary {
      background: var(--rx-accent);
      border-color: var(--rx-accent);
      color: var(--rx-accent-fg);
    }
    .btn-primary:hover:not(:disabled) {
      background: color-mix(in srgb, var(--rx-accent) 88%, #ffffff);
      border-color: color-mix(in srgb, var(--rx-accent) 88%, #ffffff);
    }
    .btn-sm { padding: 5px 10px; font-size: 11.5px; border-radius: 6px; }
    .btn-ghost { background: transparent; border-color: transparent; color: var(--rx-muted); }
    .btn-ghost:hover:not(:disabled) { background: var(--rx-hover); color: var(--rx-fg-strong); border-color: transparent; }
    .btn-danger {
      background: var(--rx-danger-soft);
      border-color: color-mix(in srgb, var(--rx-danger) 40%, transparent);
      color: var(--rx-danger);
    }
    .btn-danger:hover:not(:disabled) {
      background: color-mix(in srgb, var(--rx-danger) 22%, transparent);
      border-color: color-mix(in srgb, var(--rx-danger) 62%, transparent);
      color: var(--rx-danger);
    }

    .text-input, .select-input {
      width: 100%;
      border-radius: 7px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      color: var(--rx-fg-strong);
      padding: 7px 10px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      min-width: 0;
      transition: border-color 0.12s ease;
    }
    .text-input:focus, .select-input:focus { border-color: var(--rx-accent); }

    .kbd {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      border-radius: 5px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      color: var(--rx-fg);
      font-family: var(--rx-font-mono);
      font-size: 10.5px;
      white-space: nowrap;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      min-width: 0;
      padding: 3px 8px;
      border-radius: 5px;
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
      border-radius: 8px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 11.5px;
      color: var(--rx-muted);
      flex-shrink: 0;
    }
    .empty-msg {
      padding: 18px 14px;
      border-radius: 8px;
      background: var(--rx-surface);
      border: 1px dashed var(--rx-border-strong);
      text-align: center;
      font-size: 12px;
      color: var(--rx-muted);
      flex-shrink: 0;
    }

    .scale-stepper {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .scale-stepper .range-input { flex: 1; min-width: 80px; }
    .scale-step-btn {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-surface-2);
      color: var(--rx-fg-strong);
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }
    .scale-step-btn:hover { border-color: var(--rx-accent-border); background: var(--rx-hover); }
    .scale-pct-btn {
      min-width: 48px;
      height: 26px;
      padding: 0 8px;
      border-radius: 6px;
      border: 1px solid var(--rx-border);
      background: var(--rx-bg);
      color: var(--rx-fg-strong);
      font-family: var(--rx-font-mono);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }
    .scale-pct-btn:hover { border-color: var(--rx-accent-border); }

    /* === Collapsible Disclosure === */
    .rx-details {
      border-radius: 9px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      overflow: hidden;
      flex-shrink: 0;
    }
    .rx-details > summary {
      list-style: none;
      cursor: pointer;
      padding: 9px 13px;
      font-size: 12px;
      font-weight: 550;
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
      padding: 11px 13px 13px;
      border-top: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* === Monitor Tab (Unified Instrument Strip) === */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      overflow: hidden;
      flex-shrink: 0;
    }
    .kpi-card {
      padding: 13px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .kpi-card + .kpi-card {
      border-left: 1px solid var(--rx-border);
    }
    .kpi-label {
      font-size: 10.5px;
      font-weight: 550;
      color: var(--rx-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .kpi-val {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-size: 21px;
      font-weight: 650;
      letter-spacing: -0.025em;
      color: var(--rx-fg-strong);
      line-height: 1.15;
      white-space: nowrap;
    }
    .kpi-unit { font-size: 11px; font-weight: 550; color: var(--rx-muted); }
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
    .spark-meta { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; overflow: hidden; }
    .spark-model-inline {
      font-size: 11.5px;
      color: var(--rx-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    .modal-spark-box {
      height: 114px;
      border-radius: 7px;
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
      padding: 10px 14px;
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      flex-shrink: 0;
    }

    /* === Appearance Drawer & Minimal Layer Summary === */
    .drawer-sticky-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 22px;
      border-top: 1px solid var(--rx-border);
      background: var(--rx-sidebar-bg);
      flex-shrink: 0;
    }
    .modal-shell.is-appearance-live .drawer-sticky-footer {
      padding: 10px 16px;
      background: var(--rx-glass-strong);
    }
    .layer-summary-strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 2px;
      font-size: 11px;
      color: var(--rx-muted);
      flex-shrink: 0;
    }
    .layer-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      max-width: 210px;
      padding: 3px 7px;
      border-radius: 5px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--rx-muted);
      font-family: inherit;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .layer-pill:hover { background: var(--rx-hover); color: var(--rx-fg-strong); }
    .layer-pill.is-active {
      background: var(--rx-surface-2);
      color: var(--rx-fg-strong);
      border-color: var(--rx-border);
    }
    .layer-sep { color: var(--rx-border-strong); user-select: none; }
    .layer-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* === Claude Code Quick Suite Banner === */
    .claude-spotlight {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 11px 13px;
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border-strong);
      border-left: 3px solid #d97757;
    }
    .claude-spot-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 180px;
      flex: 1;
    }
    .claude-spot-title {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--rx-fg-strong);
    }
    .claude-spot-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: #d97757;
      flex-shrink: 0;
    }
    .claude-spot-desc {
      font-size: 11px;
      color: var(--rx-muted);
      line-height: 1.35;
    }
    .claude-spot-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .claude-preset-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5.5px 10px;
      border-radius: 6px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      color: var(--rx-fg-strong);
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 550;
      cursor: pointer;
      transition: border-color 0.12s ease, background 0.12s ease;
    }
    .claude-preset-btn:hover { border-color: #d97757; background: rgba(217, 119, 87, 0.10); }
    .claude-preset-btn.is-active { border-color: #d97757; background: rgba(217, 119, 87, 0.16); }
    .claude-chip-swatch {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      border: 1px solid rgba(128, 128, 128, 0.35);
      display: inline-block;
      flex-shrink: 0;
    }

    /* === Theme Grid with Mini Interface Swatches === */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }
    .theme-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg-strong);
      font-family: inherit;
      font-size: 12px;
      font-weight: 550;
      cursor: pointer;
      text-align: left;
      transition: border-color 0.12s ease, background 0.12s ease;
    }
    .theme-card:hover { border-color: var(--rx-border-strong); background: var(--rx-surface-2); }
    .theme-card.is-selected {
      border-color: var(--rx-accent);
      background: var(--rx-accent-soft);
    }
    .theme-swatch-mini {
      width: 34px;
      height: 24px;
      border-radius: 5px;
      border: 1px solid rgba(128, 128, 128, 0.28);
      display: flex;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
    }
    .theme-swatch-side { width: 10px; height: 100%; }
    .theme-swatch-body {
      flex: 1;
      height: 100%;
      padding: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .theme-swatch-card { height: 7px; border-radius: 2px; }
    .theme-swatch-accent { height: 3px; width: 11px; border-radius: 1.5px; }
    .theme-card-meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .theme-card-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      font-weight: 550;
      color: var(--rx-fg-strong);
    }
    .theme-card-tag {
      font-size: 10px;
      color: var(--rx-muted);
      font-weight: 450;
    }
    .theme-check {
      color: var(--rx-accent);
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }
    .modal-shell.is-appearance-live .theme-card { padding: 7px 9px; gap: 8px; }

    /* === Typography Studio Preview & Pairs === */
    .typo-preview-card {
      padding: 14px 15px;
      border-radius: 9px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border-strong);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .typo-preview-head {
      font-weight: 600;
      color: var(--rx-fg-strong);
      letter-spacing: -0.015em;
    }
    .typo-preview-body {
      color: var(--rx-fg);
      margin: 0;
    }
    .typo-preview-code {
      padding: 8px 10px;
      border-radius: 6px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      color: var(--rx-fg-strong);
      font-size: 11.5px;
      line-height: 1.45;
      overflow-x: auto;
      white-space: pre;
    }
    .font-pair-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }
    .font-pair-btn {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg-strong);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.12s ease, background 0.12s ease;
    }
    .font-pair-btn:hover { border-color: var(--rx-border-strong); background: var(--rx-surface-2); }
    .font-pair-btn.is-selected { border-color: var(--rx-accent); background: var(--rx-accent-soft); }
    .font-pair-title { font-size: 12px; font-weight: 600; color: var(--rx-fg-strong); }
    .font-pair-sub { font-size: 10.5px; color: var(--rx-muted); }

    .accent-row {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
    }
    .accent-dot-btn {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
      transition: transform 0.12s ease, border-color 0.12s ease;
    }
    .accent-dot-btn:hover { transform: scale(1.06); }
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
      border-radius: 8px;
      background: var(--rx-surface);
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
    .slider-head b { color: var(--rx-fg-strong); font-weight: 600; font-family: var(--rx-font-mono); font-size: 11px; }
    .range-input {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 3px;
      border-radius: 999px;
      background: var(--rx-border-strong);
      accent-color: var(--rx-accent);
      cursor: pointer;
      margin: 6px 0 3px;
      outline: none;
    }
    .range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: var(--rx-fg-strong);
      border: 2px solid var(--rx-accent);
      cursor: pointer;
      transition: transform 0.12s ease;
    }
    .range-input::-webkit-slider-thumb:hover { transform: scale(1.12); }

    .color-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 6px 9px;
      border-radius: 7px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 11px;
      color: var(--rx-muted);
    }
    .color-input {
      width: 24px;
      height: 19px;
      border: 1px solid var(--rx-border-strong);
      border-radius: 4px;
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
      border-radius: 7px;
      border: 1px solid var(--rx-border-strong);
      color: #ffffff;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
      cursor: pointer;
      transition: border-color 0.12s ease;
    }
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
      border-radius: 8px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
    }

    /* === Greeting Studio === */
    .greeting-preview-card {
      padding: 16px 15px;
      border-radius: 9px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border-strong);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .greeting-preview-title {
      font-size: 17px;
      font-weight: 600;
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
      border-radius: 7px;
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
      border-radius: 5px;
      padding: 3px 7px;
      font-size: 11px;
      font-family: var(--rx-font-mono);
      cursor: pointer;
    }
    .token-chip:hover { border-color: var(--rx-accent-border); color: var(--rx-fg-strong); }

    .profile-strip { display: flex; flex-wrap: wrap; gap: 6px; }
    .profile-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 9px;
      border-radius: 6px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 11.5px;
      color: var(--rx-fg-strong);
      cursor: pointer;
    }
    .profile-chip:hover { border-color: var(--rx-accent-border); }

    /* === Widget Preview Stage (Architectural Grid, Zero 2021 Rainbow Slop) === */
    .preview-stage {
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 26px 16px;
      border-radius: 10px;
      background:
        radial-gradient(360px circle at 50% 0%, color-mix(in srgb, var(--rx-accent) 12%, transparent), transparent 72%),
        var(--rx-bg);
      border: 1px solid var(--rx-border-strong);
      flex-shrink: 0;
    }
    .preview-stage::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: radial-gradient(var(--rx-border-strong) 1px, transparent 1px);
      background-size: 16px 16px;
      opacity: 0.65;
    }

    .segmented-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .choice-card {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      font-family: inherit;
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
      border-radius: 7px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      font-family: inherit;
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
    .persona-scope-bar {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11.5px;
      color: var(--rx-muted);
    }
    .persona-scope-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }
    .editor-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
    }
    .editor-box {
      width: 100%;
      min-height: 154px;
      resize: vertical;
      border-radius: 8px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      color: var(--rx-fg-strong);
      padding: 11px 13px;
      font-family: var(--rx-font-mono);
      font-size: 12px;
      line-height: 1.55;
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
      gap: 2px;
      padding: 9px 11px;
      border-radius: 8px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      cursor: pointer;
      transition: border-color 0.12s ease, background 0.12s ease;
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
      border-radius: 7px;
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
      border-radius: 8px;
      background: var(--rx-success-soft);
      border: 1px solid color-mix(in srgb, var(--rx-success) 30%, transparent);
    }

    .quota-fam-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }
    .quota-fam-card {
      padding: 12px 13px;
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .quota-fam-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .quota-bar-row { display: flex; flex-direction: column; gap: 4px; font-size: 11px; }
    .quota-bar-labels { display: flex; justify-content: space-between; color: var(--rx-muted); gap: 8px; }
    .quota-bar-labels b { color: var(--rx-fg-strong); }
    .quota-bar-track { height: 4px; border-radius: 999px; background: var(--rx-surface-2); overflow: hidden; }
    .quota-bar-fill { height: 100%; border-radius: 999px; background: var(--rx-accent); }

    .quota-table-wrap {
      border-radius: 9px;
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
      padding: 8px 13px;
      font-size: 11.5px;
    }
    .quota-table-row.is-head {
      background: var(--rx-sidebar-bg);
      color: var(--rx-muted);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .quota-table-row + .quota-table-row { border-top: 1px solid var(--rx-border); }
    .quota-table-row.is-active { background: var(--rx-accent-soft); }
    .quota-chat-name { font-weight: 550; color: var(--rx-fg-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* === Supplements Popover & Feed (Backwards-compat classes) === */
    .le-popover-mount {
      position: fixed;
      z-index: 2147483400;
      pointer-events: none;
    }
    .live-edit-popover {
      pointer-events: auto;
      width: min(378px, calc(100vw - 24px));
      border-radius: 12px;
      background: var(--rx-glass-strong);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
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
    .le-title { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--rx-fg-strong); }
    .le-sub { font-size: 11px; color: var(--rx-muted); }
    .le-body { padding: 11px 13px; display: flex; flex-direction: column; gap: 9px; }
    .le-textarea {
      width: 100%;
      min-height: 68px;
      max-height: 150px;
      resize: vertical;
      border-radius: 7px;
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
      border-radius: 6px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      font-size: 11px;
      color: var(--rx-fg-strong);
      max-width: 156px;
    }
    .le-thumb-img { width: 22px; height: 22px; border-radius: 4px; object-fit: cover; }
    .le-thumb-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .le-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .le-feed { display: flex; flex-direction: column; gap: 6px; max-height: 190px; overflow-y: auto; }
    .le-item {
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11.5px;
    }
    .le-item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 10.5px; color: var(--rx-muted); }
    .le-status-pill { padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
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

    /* === Dynamic Skill Update Notification === */
    @keyframes rxUpdateBar {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(260%); }
    }
    .update-toast-mount {
      position: fixed;
      right: 16px;
      top: 52px;
      z-index: 2147483180;
      pointer-events: none;
    }
    .update-toast-mount.is-preview { z-index: 2147483500; }
    .update-toast-mount.is-bottom { top: auto; bottom: 16px; }
    .update-toast-mount.is-bottom-high { top: auto; bottom: 68px; }
    .update-toast-mount.is-left-bottom { left: 16px; right: auto; top: auto; bottom: 16px; }
    .update-toast {
      pointer-events: auto;
      width: min(356px, calc(100vw - 24px));
      padding: 13px 15px;
      border-radius: 11px;
      background: var(--rx-glass-strong);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: rxModalIn 0.15s ease-out;
    }
    .update-toast-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .update-toast-title-wrap { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .update-toast-title { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--rx-fg-strong); }
    .update-toast-ver { font-family: var(--rx-font-mono); font-size: 11px; color: var(--rx-accent); font-weight: 600; }
    .update-toast-msg { font-size: 11.5px; color: var(--rx-muted); line-height: 1.4; word-break: break-word; }
    .update-toast-progress { width: 100%; height: 3px; border-radius: 999px; background: var(--rx-surface-2); overflow: hidden; }
    .update-toast-bar { width: 42%; height: 100%; border-radius: 999px; background: var(--rx-accent); animation: rxUpdateBar 1.2s ease-in-out infinite; }
    .update-toast-actions { display: flex; align-items: center; justify-content: flex-end; gap: 7px; margin-top: 2px; }

    /* === Interactive Wallpaper Studio === */
    .wp-stage-wrap {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 118px;
      gap: 10px;
      align-items: stretch;
    }
    .modal-shell.is-appearance-live .wp-stage-wrap { grid-template-columns: 1fr; }
    .wp-stage-canvas {
      position: relative;
      height: 192px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--rx-border-strong);
      background: #07080c;
      cursor: grab;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .wp-stage-canvas.is-dragging { cursor: grabbing; }
    .wp-stage-canvas.is-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      border-style: dashed;
      background: var(--rx-surface);
    }
    .wp-stage-media { position: absolute; inset: 0; width: 100%; height: 100%; min-width: 100%; min-height: 100%; max-width: none; max-height: none; display: block; pointer-events: none; }
    .wp-stage-tint, .wp-stage-vignette, .wp-stage-scrim { position: absolute; inset: 0; pointer-events: none; }
    .wp-stage-grid {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.14) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.14) 1px, transparent 1px);
      background-size: 33.333% 33.333%;
      opacity: 0.24;
      transition: opacity 0.14s ease;
    }
    .wp-stage-canvas:hover .wp-stage-grid,
    .wp-stage-canvas.is-dragging .wp-stage-grid { opacity: 0.55; }
    .wp-focus-dot {
      position: absolute;
      width: 12px;
      height: 12px;
      margin: -6px 0 0 -6px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      background: var(--rx-accent);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.45);
      pointer-events: none;
    }
    .wp-stage-hud {
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      pointer-events: none;
    }
    .wp-hud-pill {
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 5px;
      background: rgba(12, 12, 14, 0.80);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #f4f5f8;
      font-family: var(--rx-font-mono);
      font-size: 10px;
      font-weight: 500;
    }
    .wp-hud-btn {
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(12, 12, 14, 0.82);
      color: #f4f5f8;
      border-radius: 5px;
      padding: 3px 8px;
      font-size: 10.5px;
      font-weight: 550;
      cursor: pointer;
    }
    .wp-hud-btn.is-active { background: var(--rx-accent); border-color: var(--rx-accent); color: var(--rx-accent-fg); }

    .wp-side-controls {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      padding: 9px;
      border-radius: 9px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
    }
    .modal-shell.is-appearance-live .wp-side-controls {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .wp-anchor-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
    .wp-anchor-dot {
      height: 22px;
      min-width: 24px;
      border-radius: 5px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .wp-anchor-dot::after { content: ""; width: 4px; height: 4px; border-radius: 50%; background: var(--rx-muted); }
    .wp-anchor-dot.is-active { background: var(--rx-accent-soft); border-color: var(--rx-accent); }
    .wp-anchor-dot.is-active::after { background: var(--rx-accent); width: 6px; height: 6px; }
    .wp-tool-row { display: flex; flex-wrap: wrap; gap: 4px; }
    .wp-tool-btn {
      flex: 1 1 28px;
      height: 26px;
      border-radius: 6px;
      border: 1px solid var(--rx-border);
      background: var(--rx-bg);
      color: var(--rx-fg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 10.5px;
      font-weight: 550;
      padding: 0 5px;
    }
    .wp-tool-btn:hover { border-color: var(--rx-border-strong); color: var(--rx-fg-strong); }
    .wp-tool-btn.is-active { background: var(--rx-accent-soft); border-color: var(--rx-accent); color: var(--rx-fg-strong); }

    .wp-gallery-strip { display: flex; align-items: center; gap: 7px; overflow-x: auto; padding-bottom: 2px; }
    .wp-gallery-thumb {
      position: relative;
      width: 56px;
      height: 40px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--rx-muted);
    }
    .wp-gallery-thumb img, .wp-gallery-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .wp-gallery-thumb.is-selected { border-color: var(--rx-accent); box-shadow: 0 0 0 2px var(--rx-accent-soft); }
    .wp-atmos-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }

    /* === Interactive Corners Preview & Controls === */
    .corners-preview-stage {
      display: grid;
      grid-template-columns: 76px minmax(0, 1fr);
      gap: 10px;
      padding: 12px;
      border-radius: 9px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border-strong);
    }
    .cp-sidebar {
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .cp-nav-item { height: 16px; background: var(--rx-surface-2); border: 1px solid var(--rx-border); }
    .cp-nav-item.is-on { background: var(--rx-accent-soft); border-color: var(--rx-accent-border); }
    .cp-main { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
    .cp-top-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .cp-badge { padding: 2px 8px; font-size: 10px; font-weight: 600; background: var(--rx-surface); border: 1px solid var(--rx-border-strong); color: var(--rx-fg); }
    .cp-popup { padding: 3px 8px; font-size: 10px; background: var(--rx-surface-2); border: 1px solid var(--rx-border-strong); color: var(--rx-muted); }
    .cp-bubble { padding: 8px 10px; background: var(--rx-surface); border: 1px solid var(--rx-border-strong); display: flex; flex-direction: column; gap: 6px; }
    .cp-card { padding: 6px 8px; background: var(--rx-surface-2); border: 1px solid var(--rx-border); font-size: 10.5px; color: var(--rx-muted); }
    .cp-code { padding: 6px 8px; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--rx-border); font-family: var(--rx-font-mono); font-size: 10px; color: var(--rx-fg); }
    .studio-root[data-theme="light"] .cp-code,
    .studio-root[data-studio-theme="claude-light"] .cp-code { background: rgba(20, 20, 19, 0.06); }
    .cp-composer { padding: 6px 8px; background: var(--rx-surface); border: 1px solid var(--rx-border-strong); display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .cp-input { flex: 1; height: 22px; background: var(--rx-bg); border: 1px solid var(--rx-border); padding: 0 7px; font-size: 10px; color: var(--rx-muted); display: flex; align-items: center; }
    .cp-btn { padding: 4px 10px; background: var(--rx-accent); color: var(--rx-accent-fg); font-size: 10.5px; font-weight: 600; border: none; }

    .corner-preset-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
    .corner-preset-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 7px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg-strong);
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 550;
      cursor: pointer;
      text-align: left;
    }
    .corner-preset-btn:hover { border-color: var(--rx-border-strong); }
    .corner-preset-btn.is-selected { border-color: var(--rx-accent); background: var(--rx-accent-soft); }
    .corner-swatch { width: 16px; height: 16px; border: 1.5px solid var(--rx-accent); background: var(--rx-accent-soft); flex-shrink: 0; }

    /* === Studio & Widget Design Selector Cards === */
    .design-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .design-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 11px;
      border-radius: 8px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: border-color 0.12s ease, background 0.12s ease;
    }
    .design-card:hover { border-color: var(--rx-border-strong); }
    .design-card.is-selected { border-color: var(--rx-accent); background: var(--rx-accent-soft); }
    .design-thumb {
      width: 42px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid var(--rx-border-strong);
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      display: flex;
      padding: 3px;
      gap: 3px;
    }
    .design-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
    .design-title { font-size: 12px; font-weight: 600; color: var(--rx-fg-strong); }
    .design-desc { font-size: 10.5px; color: var(--rx-muted); line-height: 1.3; }

    /* === UI Style Platform Presets & Live Specimen === */
    .uistyle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .uistyle-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      border-radius: 9px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: border-color 0.14s ease, background 0.14s ease, transform 0.12s ease;
    }
    .uistyle-card:hover { border-color: var(--rx-border-strong); background: var(--rx-surface-2); }
    .uistyle-card.is-selected {
      border-color: var(--rx-accent);
      background: var(--rx-accent-soft);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--rx-accent) 30%, transparent);
    }
    .uistyle-mini-mock {
      width: 100%;
      height: 62px;
      border-radius: 7px;
      border: 1px solid var(--rx-border);
      background: var(--rx-bg);
      padding: 6px 7px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      overflow: hidden;
    }
    .uistyle-mock-msg {
      height: 10px;
      width: 56%;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border-strong);
      border-radius: 6px;
      align-self: flex-end;
    }
    .uistyle-mock-agent {
      height: 7px;
      width: 74%;
      border-radius: 3px;
      background: color-mix(in srgb, var(--rx-fg) 18%, transparent);
      align-self: flex-start;
    }
    .uistyle-mock-comp {
      height: 20px;
      width: 100%;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border-strong);
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 5px;
      gap: 4px;
    }
    .uistyle-mock-model {
      height: 9px;
      width: 34px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--rx-fg) 22%, transparent);
    }
    .uistyle-mock-send {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: var(--rx-accent);
      flex-shrink: 0;
    }
    /* Claude Code wireframe — true split Reply box + external bottom bar */
    .uistyle-mini-mock.is-claude-code { gap: 3px; padding: 5px 7px; }
    .uistyle-mini-mock.is-claude-code .uistyle-mock-msg { border-radius: 7px; width: 46%; height: 9px; background: color-mix(in srgb, #d97757 18%, var(--rx-surface-2)); border-color: color-mix(in srgb, #d97757 32%, var(--rx-border)); }
    .uistyle-mini-mock.is-claude-code .uistyle-mock-comp { height: 15px; border-radius: 7px; border-color: color-mix(in srgb, var(--rx-fg) 20%, transparent); background: var(--rx-surface); }
    .uistyle-mini-mock.is-claude-code .uistyle-mock-model { background: transparent; width: 22px; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--rx-fg) 22%, transparent); }
    .uistyle-mini-mock.is-claude-code .uistyle-mock-send { width: 9px; height: 9px; border-radius: 2px; background: transparent; border-right: 1.5px solid var(--rx-muted); border-bottom: 1.5px solid var(--rx-muted); }
    .uistyle-mock-extbar { display: none; align-items: center; justify-content: space-between; padding: 0 2px; height: 7px; }
    .uistyle-mini-mock.is-claude-code .uistyle-mock-extbar { display: flex; }
    .uistyle-mock-ext-l { display: inline-flex; gap: 3px; }
    .uistyle-mock-ext-dot { width: 5px; height: 5px; border-radius: 50%; background: color-mix(in srgb, var(--rx-fg) 35%, transparent); }
    .uistyle-mock-ext-r { width: 34px; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--rx-fg) 42%, transparent); }
    /* Codex wireframe */
    .uistyle-mini-mock.is-codex .uistyle-mock-msg { border-radius: 9px; width: 58%; }
    .uistyle-mini-mock.is-codex .uistyle-mock-comp { border-radius: 10px; border-width: 1.5px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.28); }
    .uistyle-mini-mock.is-codex .uistyle-mock-model { border-radius: 999px; border: 1px solid var(--rx-border-strong); background: var(--rx-surface-2); width: 38px; height: 11px; }
    .uistyle-mini-mock.is-codex .uistyle-mock-send { border-radius: 50%; background: var(--rx-fg-strong); }
    /* OpenCode wireframe */
    .uistyle-mini-mock.is-opencode .uistyle-mock-msg { width: 100%; align-self: stretch; border-radius: 3px; border-left: 2.5px solid var(--rx-accent); }
    .uistyle-mini-mock.is-opencode .uistyle-mock-agent { border-left: 2px solid color-mix(in srgb, var(--rx-accent) 60%, transparent); padding-left: 4px; border-radius: 1px; }
    .uistyle-mini-mock.is-opencode .uistyle-mock-comp { border-radius: 3px; border-left: 2.5px solid var(--rx-accent); }
    .uistyle-mini-mock.is-opencode .uistyle-mock-model { border-radius: 3px; border: 1px solid var(--rx-border-strong); border-left: 2px solid var(--rx-accent); width: 40px; height: 10px; background: transparent; }
    .uistyle-mini-mock.is-opencode .uistyle-mock-send { border-radius: 3px; }

    .uistyle-live-composer-wrap { display: flex; flex-direction: column; gap: 0; transition: all 0.14s ease; }
    .uistyle-live-input-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; transition: all 0.14s ease; }
    .uistyle-live-chevron { display: none; font-family: var(--rx-font-mono); font-weight: 700; font-size: 11px; color: var(--rx-accent); flex-shrink: 0; }
    .uistyle-live-composer-wrap.is-opencode .uistyle-live-chevron { display: inline; }
    .uistyle-live-cc-enter { display: none; font-size: 13px; color: var(--rx-muted); line-height: 1; flex-shrink: 0; }
    .uistyle-live-composer-wrap.is-claude-code .uistyle-live-cc-enter { display: inline-flex; }
    .uistyle-live-composer-wrap.is-claude-code .uistyle-live-send { display: none; }
    .uistyle-live-tools-l { display: inline-flex; align-items: center; gap: 6px; color: var(--rx-muted); font-size: 11px; }
    .uistyle-live-tools-r { display: inline-flex; align-items: center; gap: 7px; }
    .uistyle-live-mode { font-size: 10.5px; font-weight: 600; color: var(--rx-fg); }

    .uistyle-card-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .uistyle-card-name { font-size: 12px; font-weight: 650; color: var(--rx-fg-strong); }
    .uistyle-card-badge { font-size: 9.5px; font-weight: 600; padding: 1px 6px; border-radius: 4px; background: var(--rx-surface-2); color: var(--rx-muted); border: 1px solid var(--rx-border); }
    .uistyle-card.is-selected .uistyle-card-badge { color: var(--rx-accent); border-color: color-mix(in srgb, var(--rx-accent) 42%, transparent); }
    .uistyle-card-desc { font-size: 10.5px; color: var(--rx-muted); line-height: 1.32; }

    .uistyle-live-stage {
      padding: 12px;
      border-radius: 10px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .uistyle-live-chat {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .uistyle-live-user {
      padding: 6px 10px;
      font-size: 11px;
      color: var(--rx-fg-strong);
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border-strong);
      border-radius: 10px;
      max-width: 78%;
      align-self: flex-end;
      transition: all 0.14s ease;
    }
    .uistyle-live-agent {
      font-size: 11px;
      color: var(--rx-fg);
      line-height: 1.48;
      padding: 2px 0;
      transition: all 0.14s ease;
    }
    .uistyle-live-agent-meta { font-size: 9.5px; color: var(--rx-muted); margin-bottom: 2px; }
    .uistyle-live-composer {
      background: var(--rx-surface);
      border: 1px solid var(--rx-border-strong);
      border-radius: 12px;
      padding: 8px 11px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      transition: all 0.14s ease;
    }
    .uistyle-live-placeholder { font-size: 11px; color: var(--rx-muted); }
    .uistyle-live-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .uistyle-live-model {
      font-size: 10.5px;
      font-weight: 550;
      color: var(--rx-fg-strong);
      padding: 2px 7px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.14s ease;
    }
    .uistyle-live-send {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: var(--rx-accent);
      color: var(--rx-accent-fg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      transition: all 0.14s ease;
    }
    .uistyle-zone-row {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
    }
    .uistyle-zone-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--rx-fg-strong);
    }
    .uistyle-zone-cur { font-size: 10px; font-weight: 550; color: var(--rx-accent); }
    .uistyle-opt-strip { display: flex; flex-wrap: wrap; gap: 4px; }
    .uistyle-opt-btn {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--rx-border);
      background: var(--rx-bg);
      color: var(--rx-muted);
      font-family: inherit;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: border-color 0.12s ease, color 0.12s ease, background 0.12s ease;
    }
    .uistyle-opt-btn:hover { border-color: var(--rx-border-strong); color: var(--rx-fg-strong); }
    .uistyle-opt-btn.is-active {
      border-color: var(--rx-accent);
      background: var(--rx-accent-soft);
      color: var(--rx-fg-strong);
      font-weight: 600;
    }

    .studio-toast-pill {
      font-size: 11px;
      font-weight: 550;
      color: var(--rx-success);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .studio-toast-pill.is-err { color: var(--rx-danger); }
    .studio-dirty-pill {
      font-size: 10.5px;
      font-weight: 550;
      padding: 2px 7px;
      border-radius: 4px;
      background: var(--rx-warning-soft);
      color: var(--rx-warning);
    }

    @media (max-width: 700px) {
      .modal-shell {
        flex-direction: column;
        height: min(640px, calc((100vh - 24px) / var(--rx-studio-zoom)));
      }
      .modal-shell[data-studio-layout] .modal-sidebar {
        width: 100%;
        flex-direction: column;
        border-right: none;
        border-bottom: 1px solid var(--rx-border);
        padding: 10px;
      }
      .nav-list { flex-direction: row; overflow-x: auto; gap: 4px; }
      .nav-group-label { display: none; }
      .nav-item { width: auto; padding: 6px 10px; flex-shrink: 0; }
      .sidebar-foot { padding: 6px 2px 0; }
      .sidebar-foot .kbd { display: none; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .kpi-card:nth-child(3) { border-left: none; border-top: 1px solid var(--rx-border); }
      .kpi-card:nth-child(4) { border-top: 1px solid var(--rx-border); }
      .control-grid-2, .control-grid-3, .theme-grid, .uistyle-grid, .suite-quick-grid, .segmented-2, .quota-fam-grid, .export-checks, .design-card-grid, .corner-preset-grid, .font-pair-grid { grid-template-columns: 1fr; }
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
