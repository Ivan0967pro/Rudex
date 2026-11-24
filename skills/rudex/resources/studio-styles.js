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
      --rx-bg: #0a0b0f;
      --rx-surface: #11131a;
      --rx-surface-2: #181b25;
      --rx-glass: rgba(14, 16, 22, 0.88);
      --rx-glass-strong: rgba(13, 15, 21, 0.95);
      --rx-fg: #dcdfea;
      --rx-fg-strong: #f6f7fb;
      --rx-muted: #84899e;
      --rx-border: rgba(255, 255, 255, 0.08);
      --rx-border-strong: rgba(255, 255, 255, 0.14);
      --rx-hover: rgba(255, 255, 255, 0.06);
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
      --rx-widget-shadow: 0 10px 28px rgba(0, 0, 0, 0.44);
      --rx-mono: ui-monospace, "Cascadia Code", Consolas, monospace;
      --rx-studio-radius: 16px;
      --rx-studio-blur: 20px;
      --rx-widget-opacity: 0.88;
      --rx-widget-radius: 999px;
      --rx-card-sheen: rgba(255, 255, 255, 0.06);
      --rx-shell-bg: var(--rx-bg);
      --rx-sidebar-bg: var(--rx-surface);
      --rx-main-bg: var(--rx-bg);
      --rx-shell-glow: radial-gradient(640px circle at 12% 0%, color-mix(in srgb, var(--rx-accent) 10%, transparent), transparent 62%);
      color: var(--rx-fg);
      font-size: 13px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }

    .studio-root[data-theme="light"] {
      --rx-bg: #f9fafc;
      --rx-surface: #ffffff;
      --rx-surface-2: #f1f3f8;
      --rx-glass: rgba(252, 253, 255, 0.90);
      --rx-glass-strong: rgba(255, 255, 255, 0.96);
      --rx-fg: #262936;
      --rx-fg-strong: #0e1017;
      --rx-muted: #666c80;
      --rx-border: rgba(15, 23, 42, 0.09);
      --rx-border-strong: rgba(15, 23, 42, 0.15);
      --rx-hover: rgba(15, 23, 42, 0.045);
      --rx-shadow: 0 20px 52px rgba(15, 23, 42, 0.14);
      --rx-widget-shadow: 0 8px 24px rgba(15, 23, 42, 0.10);
      --rx-card-sheen: rgba(255, 255, 255, 0.70);
    }

    /* === Studio Window Themes === */
    .studio-root[data-studio-theme="obsidian"] .modal-shell {
      background: var(--rx-bg);
      background-image: var(--rx-shell-glow);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.62), inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }
    .studio-root[data-studio-theme="obsidian"][data-theme="light"] .modal-shell {
      background: #ffffff;
      box-shadow: 0 22px 56px rgba(15, 23, 42, 0.15);
    }

    .studio-root[data-studio-theme="frosted"] {
      --rx-shell-bg: color-mix(in srgb, var(--rx-bg) 74%, transparent);
      --rx-sidebar-bg: color-mix(in srgb, var(--rx-surface) 64%, transparent);
      --rx-main-bg: color-mix(in srgb, var(--rx-bg) 56%, transparent);
      --rx-surface: color-mix(in srgb, #141722 72%, transparent);
      --rx-surface-2: color-mix(in srgb, #1d2130 78%, transparent);
      --rx-shell-glow: radial-gradient(560px circle at 85% 0%, color-mix(in srgb, var(--rx-accent) 12%, transparent), transparent 65%);
    }
    .studio-root[data-studio-theme="frosted"][data-theme="light"] {
      --rx-shell-bg: rgba(247, 249, 253, 0.76);
      --rx-sidebar-bg: rgba(255, 255, 255, 0.64);
      --rx-main-bg: rgba(250, 251, 255, 0.56);
      --rx-surface: rgba(255, 255, 255, 0.72);
      --rx-surface-2: rgba(241, 244, 250, 0.84);
    }
    .studio-root[data-studio-theme="frosted"] .modal-shell {
      backdrop-filter: blur(var(--rx-studio-blur)) saturate(165%);
      -webkit-backdrop-filter: blur(var(--rx-studio-blur)) saturate(165%);
      box-shadow: var(--rx-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.10);
    }

    .studio-root[data-studio-theme="neon-cyber"] {
      --rx-bg: #070811;
      --rx-surface: #0d101f;
      --rx-surface-2: #141930;
      --rx-shell-bg: #070811;
      --rx-sidebar-bg: #0a0d1a;
      --rx-main-bg: #070914;
      --rx-border: color-mix(in srgb, var(--rx-accent) 20%, rgba(255, 255, 255, 0.06));
      --rx-border-strong: color-mix(in srgb, var(--rx-accent) 38%, rgba(255, 255, 255, 0.12));
      --rx-shell-glow: radial-gradient(520px circle at 0% 0%, color-mix(in srgb, var(--rx-accent) 16%, transparent), transparent 60%);
    }
    .studio-root[data-studio-theme="neon-cyber"][data-theme="light"] {
      --rx-bg: #f6f8ff;
      --rx-surface: #eef2ff;
      --rx-surface-2: #e2e8ff;
      --rx-shell-bg: #f6f8ff;
      --rx-sidebar-bg: #edf1ff;
      --rx-main-bg: #f8faff;
    }
    .studio-root[data-studio-theme="neon-cyber"] .modal-shell {
      border-color: color-mix(in srgb, var(--rx-accent) 46%, transparent);
      box-shadow: 0 24px 68px rgba(0, 0, 0, 0.64), 0 0 30px color-mix(in srgb, var(--rx-accent) 18%, transparent);
    }
    .studio-root[data-studio-theme="neon-cyber"] .nav-item.is-active {
      box-shadow: 0 0 18px color-mix(in srgb, var(--rx-accent) 24%, transparent);
    }

    .studio-root[data-studio-theme="minimal-mono"] {
      --rx-shell-glow: none;
      --rx-sidebar-bg: var(--rx-bg);
      --rx-main-bg: var(--rx-bg);
    }
    .studio-root[data-studio-theme="minimal-mono"] .modal-shell {
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.44);
      border-color: var(--rx-border);
    }
    .studio-root[data-studio-theme="minimal-mono"] .nav-item.is-active {
      background: var(--rx-hover);
      border-color: transparent;
      box-shadow: inset 3px 0 0 var(--rx-accent);
    }

    .studio-root[data-studio-theme="aurora"] {
      --rx-shell-bg: #090b15;
      --rx-sidebar-bg: linear-gradient(180deg, color-mix(in srgb, var(--rx-accent) 14%, var(--rx-surface)) 0%, var(--rx-surface) 100%);
      --rx-main-bg: transparent;
      --rx-shell-glow: radial-gradient(620px circle at 20% 0%, color-mix(in srgb, var(--rx-accent) 18%, transparent), transparent 58%), radial-gradient(500px circle at 92% 95%, rgba(168, 85, 247, 0.14), transparent 60%);
    }
    .studio-root[data-studio-theme="aurora"][data-theme="light"] {
      --rx-shell-bg: #f6f8fd;
    }
    .studio-root[data-studio-theme="aurora"] .modal-shell {
      backdrop-filter: blur(var(--rx-studio-blur)) saturate(155%);
      -webkit-backdrop-filter: blur(var(--rx-studio-blur)) saturate(155%);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.08);
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
      from { opacity: 1; transform: translateY(3px) scale(0.99); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes rxModalIn {
      from { opacity: 1; transform: scale(0.992) translateY(4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes rxDrawerIn {
      from { opacity: 1; transform: translateX(8px); }
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
      height: 36px;
      max-width: min(600px, calc(100vw - 24px));
      padding: 0 5px 0 11px;
      border-radius: var(--rx-widget-radius);
      background: color-mix(in srgb, var(--rx-surface) calc(var(--rx-widget-opacity) * 100%), transparent);
      backdrop-filter: blur(18px) saturate(150%);
      -webkit-backdrop-filter: blur(18px) saturate(150%);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-widget-shadow), inset 0 1px 0 var(--rx-card-sheen);
      color: var(--rx-fg);
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      animation: rxWidgetIn 0.16s ease-out;
      transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    }
    .preview-stage .mini-pill,
    .preview-stage .med-card {
      animation: none !important;
      cursor: default;
    }
    .widget-wrap.is-locked .mini-pill,
    .widget-wrap.is-locked .med-card { cursor: pointer; }
    .widget-wrap.is-dragging .mini-pill,
    .widget-wrap.is-dragging .med-card { cursor: grabbing; }
    .mini-pill:hover { border-color: color-mix(in srgb, var(--rx-fg) 26%, transparent); transform: translateY(-1px); }

    .pill-actions {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid var(--rx-border);
      flex-shrink: 0;
    }
    .studio-root[data-theme="light"] .pill-actions {
      background: rgba(15, 23, 42, 0.045);
      border-color: rgba(15, 23, 42, 0.08);
    }

    /* Widget Themes & Scales */
    [data-widget-scale="sm"] .mini-pill { height: 30px; font-size: 10.5px; gap: 5px; padding: 0 4px 0 9px; }
    [data-widget-scale="sm"] .med-card { width: 296px; }
    [data-widget-scale="lg"] .mini-pill { height: 42px; font-size: 12.5px; gap: 8px; padding: 0 7px 0 13px; }
    [data-widget-scale="lg"] .med-card { width: 368px; }

    /* Glass (refined classic translucent surface) */
    [data-widget-theme="glass"] .mini-pill,
    [data-widget-theme="glass"] .med-card {
      background: color-mix(in srgb, var(--rx-surface) calc(var(--rx-widget-opacity) * 86%), transparent);
      border-color: color-mix(in srgb, var(--rx-accent) 18%, var(--rx-border-strong));
      box-shadow: var(--rx-widget-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    [data-widget-theme="glass"] .med-telemetry-stage,
    [data-widget-theme="glass"] .med-stat-tile,
    [data-widget-theme="glass"] .med-quota-card,
    [data-widget-theme="glass"] .med-persona-pill,
    [data-widget-theme="glass"] .model-badge,
    [data-widget-theme="glass"] .lang-pill-btn {
      background: color-mix(in srgb, var(--rx-surface-2) 70%, transparent);
      border-color: var(--rx-border);
    }
    [data-widget-theme="glass"] .med-spark-box {
      background: color-mix(in srgb, var(--rx-bg) 72%, transparent);
      border-color: var(--rx-border);
    }

    /* Dynamic Island */
    [data-widget-theme="island"] .mini-pill,
    [data-widget-theme="island"] .med-card {
      background: #06070a;
      border-color: rgba(255, 255, 255, 0.13);
      color: #e8ecf6;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.70), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    [data-widget-theme="island"] .med-telemetry-stage,
    [data-widget-theme="island"] .med-stat-tile,
    [data-widget-theme="island"] .med-quota-card,
    [data-widget-theme="island"] .med-spark-box,
    [data-widget-theme="island"] .model-badge,
    [data-widget-theme="island"] .lang-pill-btn,
    [data-widget-theme="island"] .med-persona-pill,
    [data-widget-theme="island"] .pill-actions,
    [data-widget-theme="island"] .med-status-badge,
    [data-widget-theme="island"] .med-peak-pill {
      background: rgba(255, 255, 255, 0.055);
      border-color: rgba(255, 255, 255, 0.09);
      color: #f4f6fb;
    }
    [data-widget-theme="island"] .med-tps-num { color: #ffffff; }

    /* Neon HUD */
    [data-widget-theme="neon"] .mini-pill,
    [data-widget-theme="neon"] .med-card {
      background: color-mix(in srgb, #080b18 calc(var(--rx-widget-opacity) * 94%), transparent);
      border-color: color-mix(in srgb, var(--rx-accent) 56%, transparent);
      box-shadow: 0 0 24px color-mix(in srgb, var(--rx-accent) 24%, transparent), var(--rx-widget-shadow);
    }
    [data-widget-theme="neon"] .med-telemetry-stage,
    [data-widget-theme="neon"] .med-stat-tile,
    [data-widget-theme="neon"] .med-quota-card {
      background: rgba(12, 16, 32, 0.76);
      border-color: color-mix(in srgb, var(--rx-accent) 24%, rgba(255, 255, 255, 0.08));
    }
    [data-widget-theme="neon"] .metric-chip b,
    [data-widget-theme="neon"] .med-tps-num {
      color: #ffffff;
      text-shadow: 0 0 12px color-mix(in srgb, var(--rx-accent) 58%, transparent);
    }

    /* Minimal */
    [data-widget-theme="minimal"] .mini-pill,
    [data-widget-theme="minimal"] .med-card {
      background: color-mix(in srgb, var(--rx-bg) 72%, transparent);
      border-color: var(--rx-border);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
    }
    [data-widget-theme="minimal"] .med-telemetry-stage,
    [data-widget-theme="minimal"] .med-stat-tile,
    [data-widget-theme="minimal"] .med-quota-card,
    [data-widget-theme="minimal"] .med-spark-box,
    [data-widget-theme="minimal"] .pill-actions {
      background: rgba(255, 255, 255, 0.025);
      border-color: var(--rx-border);
    }

    /* Solid Contrast */
    [data-widget-theme="solid"] .mini-pill,
    [data-widget-theme="solid"] .med-card {
      background: linear-gradient(180deg, #171a24 0%, #11131b 100%);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border-color: var(--rx-border-strong);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.07);
    }
    .studio-root[data-theme="light"] [data-widget-theme="solid"] .mini-pill,
    .studio-root[data-theme="light"] [data-widget-theme="solid"] .med-card {
      background: linear-gradient(180deg, #ffffff 0%, #f3f5fa 100%);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
    }

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
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--rx-success);
      box-shadow: 0 0 8px color-mix(in srgb, var(--rx-success) 68%, transparent);
      flex-shrink: 0;
    }
    .status-dot.is-live {
      background: var(--rx-accent);
      box-shadow: 0 0 10px color-mix(in srgb, var(--rx-accent) 75%, transparent);
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
      width: 336px;
      border-radius: min(var(--rx-widget-radius), 22px);
      background: color-mix(in srgb, var(--rx-surface) calc(var(--rx-widget-opacity) * 100%), transparent);
      backdrop-filter: blur(20px) saturate(150%);
      -webkit-backdrop-filter: blur(20px) saturate(150%);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow), inset 0 1px 0 var(--rx-card-sheen);
      overflow: hidden;
      cursor: grab;
      animation: rxWidgetIn 0.16s ease-out;
    }
    .med-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 10px 12px;
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
      padding: 3px 9px 3px 7px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
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
      padding: 11px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .med-telemetry-stage {
      padding: 10px 10px 8px;
      border-radius: 13px;
      background: color-mix(in srgb, var(--rx-bg) 62%, var(--rx-surface));
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .med-tps-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .med-tps-hero {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }
    .med-tps-num {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--rx-fg-strong);
      line-height: 1;
    }
    .med-tps-unit {
      font-size: 11px;
      font-weight: 650;
      color: var(--rx-accent);
    }
    .med-peak,
    .med-peak-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2.5px 8px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      font-size: 10.5px;
      color: var(--rx-muted);
    }
    .med-peak b,
    .med-peak-pill b { color: var(--rx-fg-strong); font-weight: 600; }

    .med-spark-box {
      height: 44px;
      border-radius: 9px;
      background: var(--rx-bg);
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
      padding: 8px 10px;
      border-radius: 11px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .med-stat-label { font-size: 10px; color: var(--rx-muted); }
    .med-stat-val { font-size: 13px; font-weight: 650; color: var(--rx-fg-strong); }

    .med-quota-row,
    .med-quota-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
      color: var(--rx-muted);
      padding: 7px 10px;
      border-radius: 10px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
    }
    .med-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 8px;
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
      font-weight: 500;
    }
    .med-persona-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      border-radius: 999px;
      padding: 3.5px 9px;
      font-size: 10.5px;
      font-weight: 550;
      cursor: pointer;
      max-width: 138px;
      flex-shrink: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: border-color 0.14s ease, background 0.14s ease;
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
      background: rgba(0, 0, 0, 0.04);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      justify-content: flex-end;
      align-items: stretch;
      padding: 14px;
    }

    .modal-shell {
      width: min(940px, calc(100vw - 32px));
      height: min(654px, calc(100vh - 36px));
      border-radius: var(--rx-studio-radius);
      background: var(--rx-shell-bg);
      background-image: var(--rx-shell-glow);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow);
      display: flex;
      overflow: hidden;
      animation: rxModalIn 0.16s ease-out;
    }
    .modal-shell.is-appearance-live {
      width: min(496px, calc(100vw - 24px));
      height: calc(100vh - 28px);
      border-radius: var(--rx-studio-radius);
      background: var(--rx-glass-strong);
      background-image: var(--rx-shell-glow);
      backdrop-filter: blur(var(--rx-studio-blur));
      -webkit-backdrop-filter: blur(var(--rx-studio-blur));
      animation: rxDrawerIn 0.16s ease-out;
    }

    .modal-sidebar {
      width: 214px;
      flex-shrink: 0;
      background: var(--rx-sidebar-bg);
      border-right: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      padding: 14px 11px;
      gap: 6px;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px 12px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--rx-border);
    }
    .brand-title-wrap {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .brand-logo-dot {
      width: 22px;
      height: 22px;
      border-radius: 7px;
      background: linear-gradient(135deg, var(--rx-accent), color-mix(in srgb, var(--rx-accent) 55%, #a855f7));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 12px color-mix(in srgb, var(--rx-accent) 36%, transparent);
      flex-shrink: 0;
    }
    .brand-title {
      font-size: 14.5px;
      font-weight: 750;
      letter-spacing: -0.02em;
      color: var(--rx-fg-strong);
    }
    .brand-ver {
      font-size: 10px;
      color: var(--rx-muted);
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 8.5px 10px;
      border-radius: 9px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--rx-muted);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
    }
    .nav-item:hover { background: var(--rx-hover); color: var(--rx-fg-strong); }
    .nav-item.is-active {
      background: var(--rx-accent-soft);
      border-color: var(--rx-accent-border);
      color: var(--rx-fg-strong);
      font-weight: 600;
    }
    .nav-ic { display: inline-flex; align-items: center; flex-shrink: 0; opacity: 0.92; }
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
      padding: 10px 6px 2px;
      border-top: 1px solid var(--rx-border);
      display: flex;
      flex-direction: column;
      gap: 7px;
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
      width: 74px;
      padding: 12px 7px;
      align-items: center;
    }
    .modal-shell[data-studio-layout="rail"] .sidebar-brand {
      justify-content: center;
      padding: 4px 0 10px;
    }
    .modal-shell[data-studio-layout="rail"] .brand-title,
    .modal-shell[data-studio-layout="rail"] .brand-ver,
    .modal-shell[data-studio-layout="rail"] .sidebar-foot-hint,
    .modal-shell[data-studio-layout="rail"] .nav-dot {
      display: none;
    }
    .modal-shell[data-studio-layout="rail"] .nav-list {
      width: 100%;
      align-items: center;
    }
    .modal-shell[data-studio-layout="rail"] .nav-item {
      flex-direction: column;
      justify-content: center;
      gap: 3px;
      padding: 8px 4px;
      text-align: center;
      position: relative;
    }
    .modal-shell[data-studio-layout="rail"] .nav-label {
      font-size: 9.5px;
      width: 100%;
      text-align: center;
    }
    .modal-shell[data-studio-layout="rail"] .nav-badge {
      position: absolute;
      top: 3px;
      right: 4px;
      padding: 0 4px;
      font-size: 9px;
    }
    .modal-shell[data-studio-layout="rail"] .sidebar-foot {
      width: 100%;
      align-items: center;
    }
    .modal-shell[data-studio-layout="rail"] .sidebar-foot .kbd { display: none; }

    .modal-shell[data-studio-layout="topbar"] {
      flex-direction: column;
    }
    .modal-shell[data-studio-layout="topbar"] .modal-sidebar {
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-right: none;
      border-bottom: 1px solid var(--rx-border);
      padding: 9px 14px;
      gap: 10px;
    }
    .modal-shell[data-studio-layout="topbar"] .sidebar-brand {
      padding: 0;
      margin: 0;
      border-bottom: none;
      gap: 7px;
      flex-shrink: 0;
    }
    .modal-shell[data-studio-layout="topbar"] .nav-list {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 4px;
      overflow-x: auto;
      flex: 1 1 auto;
    }
    .modal-shell[data-studio-layout="topbar"] .nav-item {
      width: auto;
      padding: 6px 10px;
      flex-shrink: 0;
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
      background: color-mix(in srgb, var(--rx-bg) 52%, transparent);
      backdrop-filter: blur(var(--rx-studio-blur));
      -webkit-backdrop-filter: blur(var(--rx-studio-blur));
    }
    .modal-shell[data-studio-layout="floating-glass"] .modal-sidebar {
      border: 1px solid var(--rx-border-strong);
      border-radius: max(8px, calc(var(--rx-studio-radius) - 4px));
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }
    .modal-shell[data-studio-layout="floating-glass"] .modal-main {
      background: color-mix(in srgb, var(--rx-surface) 78%, transparent);
      border: 1px solid var(--rx-border-strong);
      border-radius: max(8px, calc(var(--rx-studio-radius) - 4px));
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--rx-border);
      flex-shrink: 0;
    }
    .modal-header-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
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
      flex: 1 1 auto;
      min-width: 0;
      border: none;
      background: transparent;
      color: var(--rx-muted);
      font-size: 11px;
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
      width: 36px;
      height: 20px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border-strong);
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
      transition: background 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--rx-muted);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
      transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease;
    }
    .switch.is-on {
      background: var(--rx-accent);
      border-color: var(--rx-accent);
      box-shadow: 0 0 14px color-mix(in srgb, var(--rx-accent) 42%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }
    .switch.is-on .switch-thumb {
      transform: translateX(16px);
      background: #ffffff;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 9px;
      border: 1px solid var(--rx-border-strong);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%), var(--rx-surface-2);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      color: var(--rx-fg-strong);
      font-size: 12px;
      font-weight: 550;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.14s ease, border-color 0.14s ease, opacity 0.14s ease, transform 0.1s ease, box-shadow 0.14s ease;
    }
    .btn:hover:not(:disabled) { background: var(--rx-hover); border-color: color-mix(in srgb, var(--rx-fg) 26%, transparent); }
    .btn:active:not(:disabled) { transform: scale(0.98); }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-primary {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 60%), var(--rx-accent);
      border-color: color-mix(in srgb, var(--rx-accent) 85%, #ffffff);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.30), 0 4px 14px color-mix(in srgb, var(--rx-accent) 32%, transparent);
      color: var(--rx-accent-fg);
    }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.09); }
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

    /* === Appearance Drawer & Combinable Layer Strip === */
    .drawer-sticky-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 11px 20px;
      border-top: 1px solid var(--rx-border);
      background: var(--rx-surface);
      flex-shrink: 0;
    }
    .modal-shell.is-appearance-live .drawer-sticky-footer {
      padding: 11px 16px;
      background: var(--rx-glass-strong);
    }
    .layer-summary-strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 5px;
      flex-shrink: 0;
    }
    .layer-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      max-width: 210px;
      padding: 4px 9px;
      border-radius: 999px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
    }
    .layer-pill:hover { border-color: var(--rx-border-strong); color: var(--rx-fg-strong); }
    .layer-pill.is-active {
      border-color: var(--rx-accent-border);
      background: var(--rx-accent-soft);
      color: var(--rx-fg-strong);
    }
    .layer-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.25);
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
    .modal-shell.is-appearance-live .theme-card {
      padding: 8px 10px;
      gap: 6px;
      font-size: 11.5px;
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
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      accent-color: var(--rx-accent);
      cursor: pointer;
      margin: 5px 0 3px;
      outline: none;
    }
    .range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid var(--rx-accent);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(255, 255, 255, 0.08);
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }
    .range-input::-webkit-slider-thumb:hover {
      transform: scale(1.14);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55), 0 0 0 4px color-mix(in srgb, var(--rx-accent) 26%, transparent);
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
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 26px 16px;
      border-radius: 14px;
      background:
        radial-gradient(240px circle at 18% 22%, rgba(56, 189, 248, 0.34), transparent 62%),
        radial-gradient(260px circle at 84% 78%, rgba(168, 85, 247, 0.32), transparent 64%),
        radial-gradient(190px circle at 54% 48%, rgba(59, 130, 246, 0.24), transparent 60%),
        linear-gradient(135deg, #0b1020 0%, #14182e 52%, #1a112a 100%);
      border: 1px solid var(--rx-border-strong);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
      flex-shrink: 0;
    }
    .preview-stage::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 16px 16px;
      opacity: 0.45;
    }
    .studio-root[data-theme="light"] .preview-stage {
      background:
        radial-gradient(240px circle at 18% 22%, rgba(56, 189, 248, 0.32), transparent 64%),
        radial-gradient(260px circle at 84% 78%, rgba(168, 85, 247, 0.28), transparent 66%),
        linear-gradient(135deg, #dce8ff 0%, #eae6ff 55%, #f5e2f8 100%);
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
      width: min(378px, calc(100vw - 24px));
      border-radius: 14px;
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

    /* === Dynamic Skill Update Notification === */
    @keyframes rxUpdateBar {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(260%); }
    }
    .update-toast-mount {
      position: fixed;
      right: 16px;
      top: 52px;
      z-index: 2147483500;
      pointer-events: none;
    }
    .update-toast-mount.is-bottom {
      top: auto;
      bottom: 16px;
    }
    .update-toast {
      pointer-events: auto;
      width: min(364px, calc(100vw - 24px));
      padding: 13px 14px;
      border-radius: 14px;
      background: var(--rx-glass-strong);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--rx-border-strong);
      box-shadow: var(--rx-shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: rxModalIn 0.16s ease-out;
    }
    .update-toast-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .update-toast-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .update-toast-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 650;
      color: var(--rx-fg-strong);
    }
    .update-toast-ver {
      font-size: 11px;
      color: var(--rx-accent);
      font-weight: 600;
    }
    .update-toast-msg {
      font-size: 11.5px;
      color: var(--rx-muted);
      line-height: 1.4;
      word-break: break-word;
    }
    .update-toast-progress {
      width: 100%;
      height: 4px;
      border-radius: 999px;
      background: var(--rx-surface-2);
      overflow: hidden;
    }
    .update-toast-bar {
      width: 42%;
      height: 100%;
      border-radius: 999px;
      background: var(--rx-accent);
      animation: rxUpdateBar 1.2s ease-in-out infinite;
    }
    .update-toast-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 7px;
      margin-top: 2px;
    }

    @media (max-width: 700px) {
      .modal-shell { flex-direction: column; height: min(640px, calc(100vh - 24px)); }
      .modal-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--rx-border); padding: 10px; }
      .nav-list { flex-direction: row; overflow-x: auto; gap: 4px; }
      .nav-item { width: auto; padding: 6px 10px; }
      .sidebar-foot { display: none; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .segmented-2, .quota-fam-grid, .export-checks, .design-card-grid, .corner-preset-grid { grid-template-columns: 1fr; }
      .dock-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    /* === Interactive Wallpaper Studio === */
    .wp-stage-wrap {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 118px;
      gap: 10px;
      align-items: stretch;
    }
    .modal-shell.is-appearance-live .wp-stage-wrap {
      grid-template-columns: 1fr;
    }
    .wp-stage-canvas {
      position: relative;
      height: 196px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--rx-border-strong);
      background: #07080c;
      cursor: grab;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
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
    .wp-stage-media {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .wp-stage-tint,
    .wp-stage-vignette,
    .wp-stage-scrim {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
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
    .wp-stage-canvas.is-dragging .wp-stage-grid { opacity: 0.6; }
    .wp-focus-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      margin: -7px 0 0 -7px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      background: var(--rx-accent);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.55), 0 0 12px var(--rx-accent);
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
      border-radius: 999px;
      background: rgba(8, 9, 13, 0.78);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #f4f5f8;
      font-size: 10.5px;
      font-weight: 550;
    }
    .wp-hud-btn {
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(8, 9, 13, 0.8);
      color: #f4f5f8;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 10.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .wp-hud-btn.is-active {
      background: var(--rx-accent);
      border-color: var(--rx-accent);
      color: var(--rx-accent-fg);
    }

    .wp-side-controls {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      padding: 9px;
      border-radius: 12px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border);
    }
    .modal-shell.is-appearance-live .wp-side-controls {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .wp-anchor-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
    .wp-anchor-dot {
      height: 22px;
      min-width: 24px;
      border-radius: 6px;
      border: 1px solid var(--rx-border-strong);
      background: var(--rx-bg);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .wp-anchor-dot::after {
      content: "";
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--rx-muted);
    }
    .wp-anchor-dot.is-active {
      background: var(--rx-accent-soft);
      border-color: var(--rx-accent);
    }
    .wp-anchor-dot.is-active::after {
      background: var(--rx-accent);
      width: 7px;
      height: 7px;
    }
    .wp-tool-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .wp-tool-btn {
      flex: 1 1 28px;
      height: 26px;
      border-radius: 7px;
      border: 1px solid var(--rx-border);
      background: var(--rx-bg);
      color: var(--rx-fg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 10.5px;
      font-weight: 600;
      padding: 0 5px;
    }
    .wp-tool-btn:hover { border-color: var(--rx-border-strong); color: var(--rx-fg-strong); }
    .wp-tool-btn.is-active { background: var(--rx-accent-soft); border-color: var(--rx-accent); color: var(--rx-fg-strong); }

    .wp-gallery-strip {
      display: flex;
      align-items: center;
      gap: 7px;
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .wp-gallery-thumb {
      position: relative;
      width: 56px;
      height: 40px;
      border-radius: 8px;
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
    .wp-gallery-thumb img,
    .wp-gallery-thumb video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .wp-gallery-thumb.is-selected {
      border-color: var(--rx-accent);
      box-shadow: 0 0 0 2px var(--rx-accent-soft);
    }

    .wp-atmos-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }

    /* === Interactive Corners Preview & Controls === */
    .corners-preview-stage {
      display: grid;
      grid-template-columns: 76px minmax(0, 1fr);
      gap: 10px;
      padding: 12px;
      border-radius: 12px;
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
    .cp-nav-item {
      height: 16px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
    }
    .cp-nav-item.is-on {
      background: var(--rx-accent-soft);
      border-color: var(--rx-accent-border);
    }
    .cp-main {
      display: flex;
      flex-direction: column;
      gap: 7px;
      min-width: 0;
    }
    .cp-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .cp-badge {
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 600;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border-strong);
      color: var(--rx-fg);
    }
    .cp-popup {
      padding: 3px 8px;
      font-size: 10px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border-strong);
      color: var(--rx-muted);
    }
    .cp-bubble {
      padding: 8px 10px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border-strong);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cp-card {
      padding: 6px 8px;
      background: var(--rx-surface-2);
      border: 1px solid var(--rx-border);
      font-size: 10.5px;
      color: var(--rx-muted);
    }
    .cp-code {
      padding: 6px 8px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--rx-border);
      font-family: var(--rx-mono);
      font-size: 10px;
      color: var(--rx-fg);
    }
    .studio-root[data-theme="light"] .cp-code { background: rgba(15, 23, 42, 0.06); }
    .cp-composer {
      padding: 6px 8px;
      background: var(--rx-surface);
      border: 1px solid var(--rx-border-strong);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .cp-input {
      flex: 1;
      height: 22px;
      background: var(--rx-bg);
      border: 1px solid var(--rx-border);
      padding: 0 7px;
      font-size: 10px;
      color: var(--rx-muted);
      display: flex;
      align-items: center;
    }
    .cp-btn {
      padding: 4px 10px;
      background: var(--rx-accent);
      color: var(--rx-accent-fg);
      font-size: 10.5px;
      font-weight: 600;
      border: none;
    }

    .corner-preset-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
    }
    .corner-preset-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 9px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg-strong);
      font-size: 11.5px;
      font-weight: 550;
      cursor: pointer;
      text-align: left;
    }
    .corner-preset-btn:hover { border-color: var(--rx-border-strong); }
    .corner-preset-btn.is-selected { border-color: var(--rx-accent); background: var(--rx-accent-soft); }
    .corner-swatch {
      width: 18px;
      height: 18px;
      border: 2px solid var(--rx-accent);
      background: var(--rx-accent-soft);
      flex-shrink: 0;
    }

    /* === Studio & Widget Design Selector Cards === */
    .design-card-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .design-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 11px;
      border-radius: 10px;
      border: 1px solid var(--rx-border);
      background: var(--rx-surface);
      color: var(--rx-fg);
      cursor: pointer;
      text-align: left;
      transition: border-color 0.14s ease, background 0.14s ease;
    }
    .design-card:hover { border-color: var(--rx-border-strong); }
    .design-card.is-selected {
      border-color: var(--rx-accent);
      background: var(--rx-accent-soft);
    }
    .design-thumb {
      width: 44px;
      height: 32px;
      border-radius: 7px;
      border: 1px solid var(--rx-border-strong);
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      display: flex;
      padding: 3px;
      gap: 3px;
    }
    .design-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .design-title { font-size: 12px; font-weight: 600; color: var(--rx-fg-strong); }
    .design-desc { font-size: 10.5px; color: var(--rx-muted); line-height: 1.3; }

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
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--rx-warning-soft);
      color: var(--rx-warning);
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
