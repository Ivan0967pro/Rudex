"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync, execFileSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const SKILL_DIR = path.join(REPO_ROOT, "skills", "rudex");
const RES_DIR = path.join(SKILL_DIR, "resources");
const SCRIPTS_DIR = path.join(SKILL_DIR, "scripts");

const dictionary = require(path.join(RES_DIR, "dictionary-ru.json"));
const { DYNAMIC_RULES, applyDynamicRules } = require(path.join(RES_DIR, "dynamic-rules-ru.js"));
const {
  createDomTranslator,
  DEFAULT_GREETING_CONFIG,
  normalizeGreetingConfig,
} = require(path.join(RES_DIR, "dom-translator.js"));
const {
  estimateTokensFloat,
  estimateTokens,
  extractVisibleResponseText,
  extractThinkingSeconds,
  createEmptyTelemetry,
  sanitizeTelemetryRecord,
  createTelemetryEngine,
} = require(path.join(RES_DIR, "telemetry-engine.js"));
const {
  THEME_PRESETS,
  GRADIENT_PRESETS,
  CORNER_PRESETS,
  FONT_PRESETS,
  DEFAULT_APPEARANCE,
  normalizeAppearance,
  isAppearanceNativeDefault,
  teResolveCornerRadii,
  teFindFont,
  teBuildWebFontUrl,
  detectHostIsLight,
  buildThemeCss,
  createThemeEngine,
} = require(path.join(RES_DIR, "theme-engine.js"));
const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
const { createStudioPanel, parseQuotaFromDocumentText } = require(path.join(RES_DIR, "studio-panel.js"));
const {
  compareSemver,
  stripCjsPrologueEpilogue,
  buildPreloadSnippet,
  writeOnExitActivateCmd,
} = require(path.join(SCRIPTS_DIR, "install.js"));
const { patchMainJs, patchUpdaterJs } = require(path.join(SCRIPTS_DIR, "electron-shell.js"));
const {
  evaluateUpdateAvailability,
  parseGithubAtomFeed,
  readZipEocdComment,
  extractCommitShaFromText,
  checkRemoteRelease,
  readGitHeadMeta,
} = require(path.join(SCRIPTS_DIR, "updater-core.js"));
const {
  needsRussianTranslation,
  protectInlineTokens,
  restoreInlineTokens,
  createThinkingTranslator,
} = require(path.join(SCRIPTS_DIR, "thinking-translator.js"));
const {
  crc32,
  createZipBuffer,
  writeZipFile,
  findBrainDirForChat,
  buildChatExportArchive,
} = require(path.join(SCRIPTS_DIR, "zip-builder.js"));

// =============================================================================
// Minimal, deterministic mock DOM for headless Node testing
// =============================================================================
function createMockDom() {
  function matchSingleSelector(el, rawSel) {
    if (!el || el.nodeType !== 1) return false;
    let sel = String(rawSel || "").trim();
    if (!sel) return false;

    const attrMatches = [];
    sel = sel.replace(/\[([^\]]+)\]/g, (_m, inner) => {
      attrMatches.push(inner);
      return "";
    });

    const idMatches = [];
    sel = sel.replace(/#([a-zA-Z0-9_-]+)/g, (_m, id) => {
      idMatches.push(id);
      return "";
    });

    const classMatches = [];
    sel = sel.replace(/\.([a-zA-Z0-9_-]+)/g, (_m, cls) => {
      classMatches.push(cls);
      return "";
    });

    const tagPart = sel.trim();
    if (tagPart && tagPart !== "*" && el.tagName !== tagPart.toUpperCase()) return false;
    for (const id of idMatches) {
      if (el.getAttribute("id") !== id) return false;
    }
    for (const cls of classMatches) {
      if (!el.classList.contains(cls)) return false;
    }
    for (const expr of attrMatches) {
      const eqIdx = expr.indexOf("=");
      if (eqIdx === -1) {
        if (!el.hasAttribute(expr.trim())) return false;
      } else {
        let name = expr.slice(0, eqIdx).trim();
        let val = expr.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        const actual = el.getAttribute(name);
        if (name.endsWith("*")) {
          name = name.slice(0, -1).trim();
          const a = el.getAttribute(name);
          if (a === null || !a.includes(val)) return false;
        } else if (actual !== val) {
          return false;
        }
      }
    }
    return true;
  }

  function matchesSelectorList(el, selector) {
    const parts = String(selector || "").split(",");
    for (const part of parts) {
      const tokens = part.trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0) continue;
      if (tokens.length === 1) {
        if (matchSingleSelector(el, tokens[0])) return true;
      } else {
        if (!matchSingleSelector(el, tokens[tokens.length - 1])) continue;
        let cur = el.parentElement;
        let idx = tokens.length - 2;
        while (cur && idx >= 0) {
          if (matchSingleSelector(cur, tokens[idx])) idx -= 1;
          cur = cur.parentElement;
        }
        if (idx < 0) return true;
      }
    }
    return false;
  }

  function collectElements(root, selector, firstOnly) {
    const out = [];
    const walk = (node) => {
      if (!node || !node.childNodes) return false;
      for (const ch of node.childNodes) {
        if (ch.nodeType === 1) {
          if (matchesSelectorList(ch, selector)) {
            out.push(ch);
            if (firstOnly) return true;
          }
          if (walk(ch) && firstOnly) return true;
        }
      }
      return false;
    };
    walk(root);
    return firstOnly ? (out[0] || null) : out;
  }

  function createStyleObj() {
    const props = new Map();
    const s = {
      cssText: "",
      setProperty(k, v) { props.set(String(k), String(v)); },
      getPropertyValue(k) { return props.get(String(k)) || ""; },
      removeProperty(k) { props.delete(String(k)); },
    };
    return new Proxy(s, {
      get(target, prop) {
        if (prop in target) return target[prop];
        return props.get(String(prop)) || "";
      },
      set(target, prop, val) {
        if (prop === "cssText") { target.cssText = String(val || ""); return true; }
        props.set(String(prop), String(val || ""));
        return true;
      },
    });
  }

  function attachContainerMethods(node) {
    node.childNodes = [];
    node.listeners = new Map();
    Object.defineProperty(node, "children", {
      get() { return node.childNodes.filter((c) => c.nodeType === 1); },
    });
    Object.defineProperty(node, "textContent", {
      get() {
        return node.childNodes.map((c) => (c.nodeType === 3 ? c.nodeValue : c.textContent)).join("");
      },
      set(val) {
        node.childNodes = [];
        if (val !== null && val !== undefined && String(val) !== "") {
          node.appendChild(doc.createTextNode(String(val)));
        }
      },
    });
    Object.defineProperty(node, "innerHTML", {
      get() { return node._innerHtml || ""; },
      set(val) {
        node._innerHtml = String(val || "");
        if (!node._innerHtml) node.childNodes = [];
      },
    });
    node.appendChild = (ch) => {
      if (ch.parentNode && ch.parentNode !== node) {
        const idx = ch.parentNode.childNodes.indexOf(ch);
        if (idx !== -1) ch.parentNode.childNodes.splice(idx, 1);
      }
      ch.parentNode = node;
      ch.parentElement = node.nodeType === 1 ? node : null;
      node.childNodes.push(ch);
      return ch;
    };
    node.insertBefore = (ch, ref) => {
      if (!ref) return node.appendChild(ch);
      const idx = node.childNodes.indexOf(ref);
      ch.parentNode = node;
      ch.parentElement = node.nodeType === 1 ? node : null;
      if (idx === -1) node.childNodes.push(ch);
      else node.childNodes.splice(idx, 0, ch);
      return ch;
    };
    node.removeChild = (ch) => {
      const idx = node.childNodes.indexOf(ch);
      if (idx !== -1) node.childNodes.splice(idx, 1);
      ch.parentNode = null;
      ch.parentElement = null;
      return ch;
    };
    node.remove = () => {
      if (node.parentNode) node.parentNode.removeChild(node);
    };
    node.contains = (other) => {
      let cur = other;
      while (cur) {
        if (cur === node) return true;
        cur = cur.parentNode;
      }
      return false;
    };
    node.querySelector = (sel) => collectElements(node, sel, true);
    node.querySelectorAll = (sel) => collectElements(node, sel, false);
    node.getElementById = (id) => collectElements(node, `#${id}`, true);
    node.addEventListener = (type, fn) => {
      if (!node.listeners.has(type)) node.listeners.set(type, new Set());
      node.listeners.get(type).add(fn);
    };
    node.removeEventListener = (type, fn) => {
      if (node.listeners.has(type)) node.listeners.get(type).delete(fn);
    };
    node.dispatchEvent = (ev) => {
      const set = node.listeners.get(ev && ev.type);
      if (set) for (const fn of set) fn(ev);
      return true;
    };
    return node;
  }

  const doc = {
    readyState: "complete",
    title: "Antigravity — Workspace",
    visibilityState: "visible",
    listeners: new Map(),
    createTextNode(val) {
      return { nodeType: 3, nodeValue: String(val), parentNode: null, parentElement: null };
    },
    createElement(tag) {
      const attrs = new Map();
      const el = attachContainerMethods({
        nodeType: 1,
        tagName: String(tag).toUpperCase(),
        style: createStyleObj(),
        parentNode: null,
        parentElement: null,
        value: "",
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
        get ownerDocument() { return doc; },
        get id() { return attrs.get("id") || ""; },
        set id(v) { if (v) attrs.set("id", String(v)); else attrs.delete("id"); },
        get className() { return attrs.get("class") || ""; },
        set className(v) { attrs.set("class", String(v || "")); },
        classList: {
          add(...cls) {
            const set = new Set((attrs.get("class") || "").split(/\s+/).filter(Boolean));
            for (const c of cls) if (c) set.add(c);
            attrs.set("class", Array.from(set).join(" "));
          },
          remove(...cls) {
            const set = new Set((attrs.get("class") || "").split(/\s+/).filter(Boolean));
            for (const c of cls) set.delete(c);
            attrs.set("class", Array.from(set).join(" "));
          },
          contains(c) {
            return (attrs.get("class") || "").split(/\s+/).includes(c);
          },
          toggle(c, force) {
            const has = this.contains(c);
            const next = force !== undefined ? Boolean(force) : !has;
            if (next) this.add(c); else this.remove(c);
            return next;
          },
        },
        setAttribute(k, v) { attrs.set(String(k), String(v)); },
        getAttribute(k) { return attrs.has(String(k)) ? attrs.get(String(k)) : null; },
        removeAttribute(k) { attrs.delete(String(k)); },
        hasAttribute(k) { return attrs.has(String(k)); },
        getBoundingClientRect() { return { left: 0, top: 0, right: 120, bottom: 40, width: 120, height: 40 }; },
        closest(sel) {
          let cur = el;
          while (cur && cur.nodeType === 1) {
            if (matchesSelectorList(cur, sel)) return cur;
            cur = cur.parentElement;
          }
          return null;
        },
        matches(sel) { return matchesSelectorList(el, sel); },
        attachShadow({ mode }) {
          const shadow = attachContainerMethods({ nodeType: 11, mode, host: el });
          el.shadowRoot = shadow;
          return shadow;
        },
      });
      return el;
    },
    getElementById(id) {
      return collectElements(doc.documentElement, `#${id}`, true);
    },
    querySelector(sel) { return collectElements(doc.documentElement, sel, true); },
    querySelectorAll(sel) { return collectElements(doc.documentElement, sel, false); },
    addEventListener(type, fn) {
      if (!doc.listeners.has(type)) doc.listeners.set(type, new Set());
      doc.listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      if (doc.listeners.has(type)) doc.listeners.get(type).delete(fn);
    },
  };

  doc.documentElement = doc.createElement("html");
  doc.head = doc.createElement("head");
  doc.body = doc.createElement("body");
  doc.documentElement.appendChild(doc.head);
  doc.documentElement.appendChild(doc.body);

  const win = {
    document: doc,
    location: { protocol: "vscode-file:", href: "vscode-file://workbench/index.html" },
    innerWidth: 1400,
    innerHeight: 900,
    performance: { now: () => Date.now() },
    getComputedStyle(el) {
      return {
        backgroundColor: (el && el.style && el.style.backgroundColor) || "rgba(0, 0, 0, 0)",
        color: (el && el.style && el.style.color) || "rgb(236, 236, 239)",
        display: (el && el.style && el.style.display) || "block",
        visibility: (el && el.style && el.style.visibility) || "visible",
        opacity: (el && el.style && el.style.opacity) || "1",
        position: (el && el.style && el.style.position) || "static",
        overflowY: (el && el.style && el.style.overflowY) || "visible",
        zIndex: (el && el.style && el.style.zIndex) || "auto",
        getPropertyValue: (k) => (el && el.style ? el.style.getPropertyValue(k) : ""),
      };
    },
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    setTimeout: global.setTimeout.bind(global),
    clearTimeout: global.clearTimeout.bind(global),
    setInterval: global.setInterval.bind(global),
    clearInterval: global.clearInterval.bind(global),
    requestAnimationFrame: (fn) => setTimeout(() => fn(Date.now()), 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  doc.defaultView = win;
  return { doc, win };
}

// =============================================================================
// 1. Metadata, Hooks Schema & Installer Helpers
// =============================================================================
test("Manifest & hooks.json follow Rudex v5.0 safe hook architecture (no global PreToolUse / no PostInvocation)", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "plugin.json"), "utf8"));
  assert.equal(pkg.name, "rudex");
  assert.equal(pkg.displayName, "Rudex");
  assert.equal(pkg.version, "5.0.0");
  assert.ok(fs.existsSync(path.join(SCRIPTS_DIR, "updater-core.js")), "updater-core.js must exist");
  assert.ok(fs.existsSync(path.join(SCRIPTS_DIR, "thinking-translator.js")), "thinking-translator.js must exist");
  assert.ok(fs.existsSync(path.join(SCRIPTS_DIR, "agy-workshop.js")), "agy-workshop.js must exist");
  assert.ok(fs.existsSync(path.join(RES_DIR, "rudex-annotator.js")), "rudex-annotator.js must exist");
  assert.equal(typeof dictionary, "object");
  assert.ok(Object.keys(dictionary).length >= 4000);
  assert.equal(DYNAMIC_RULES.length, 479);

  const hooks = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "hooks.json"), "utf8"));
  const group = hooks["rudex-studio"];
  assert.ok(group, "rudex-studio hook group missing");
  assert.ok(Array.isArray(group.SessionStart) && group.SessionStart.length === 1);
  assert.ok(Array.isArray(group.PreInvocation) && group.PreInvocation.length === 1);
  assert.ok(Array.isArray(group.PreToolUse) && group.PreToolUse.length === 1);
  assert.notEqual(group.PreToolUse[0].matcher, "*", "PreToolUse must use a targeted matcher, never global '*'");
  assert.ok(group.PreToolUse[0].matcher.includes("search_web"), "Targeted PreToolUse matcher must gate search_web");
  assert.equal(group.PreToolUse[0].matcher.includes("run_command"), false, "PreToolUse matcher must NOT intercept native run_command prompts");
  assert.ok(Array.isArray(group.Stop) && group.Stop.length === 1);
  assert.equal(group.PostInvocation, undefined, "PostInvocation must NOT exist (causes silent live-edit loss)");

  const ps1Text = fs.readFileSync(path.join(REPO_ROOT, "install.ps1"), "utf8");
  assert.ok(ps1Text.includes('$RepoName = "Rudex"'), "install.ps1 must target Ivan0967pro/Rudex");
  assert.ok(ps1Text.includes("archive/refs/heads/"), "install.ps1 must support 1-line remote archive installation");
  assert.ok(ps1Text.includes("LOCKED_NEEDS_ACTIVATOR"), "install.ps1 must support detached activator when app.asar is locked");

  const readmeText = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
  assert.ok(
    readmeText.includes("irm https://raw.githubusercontent.com/Ivan0967pro/Rudex/main/install.ps1 | iex"),
    "README.md must feature the 1-line PowerShell skill installer command"
  );
});

test("Installer semver comparison, EOF module stripping, and preload bundle syntax", () => {
  assert.ok(compareSemver("2.10.0", "2.9.0") > 0);
  assert.ok(compareSemver("44.9.1", "44.10.0") < 0);
  assert.equal(compareSemver("44.9.1", "44.9.1"), 0);

  const midCheckSrc = `"use strict";\nconst note = "keep this";\nfunction f() { return 1; }\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = { f };\n}\n`;
  const stripped = stripCjsPrologueEpilogue(midCheckSrc);
  assert.ok(stripped.includes("function f() { return 1; }"));
  assert.ok(!stripped.includes("module.exports"));

  const bundle = buildPreloadSnippet(RES_DIR);
  assert.ok(bundle.includes("// === RUDEX_I18N_START ==="));
  assert.ok(bundle.includes("// === RUDEX_I18N_END ==="));
  assert.ok(bundle.includes("DOMContentLoaded"));
  assert.ok(bundle.includes("agy-studio:update-status"));
  assert.doesNotThrow(() => new vm.Script(bundle, { filename: "test-bundle.js" }));
});

// =============================================================================
// 2. Telemetry & Token Engine Tests
// =============================================================================
test("Telemetry engine estimates multilingual tokens accurately and avoids phantom TPS spikes", () => {
  const en = "Hello world testing token speed measurement.";
  const ru = "Привет мир проверяем точность расчёта токенов и скорости генерации.";
  const cjk = "你好世界测试令牌速度计算";
  assert.ok(estimateTokens(en) >= 8 && estimateTokens(en) <= 15);
  // Cyrillic should NOT be bloated by +45% (legacy BUG used /1.9 or /2.1 instead of /3.0)
  const ruRatio = estimateTokensFloat(ru) / ru.length;
  assert.ok(ruRatio > 0.25 && ruRatio < 0.42, `unexpected Cyrillic token density ${ruRatio}`);
  assert.ok(estimateTokens(cjk) >= 6);

  const { doc } = createMockDom();
  const bubble = doc.createElement("div");
  const details = doc.createElement("details");
  const summary = doc.createElement("summary");
  summary.textContent = "Thought for 2.4s hidden chain";
  details.appendChild(summary);
  const p = doc.createElement("p");
  p.textContent = "Visible answer output";
  bubble.appendChild(details);
  bubble.appendChild(p);
  assert.equal(extractVisibleResponseText(bubble), "Visible answer output");
  assert.equal(extractThinkingSeconds(bubble), 2.4);

  const engine = createTelemetryEngine();
  const tel = createEmptyTelemetry();

  // Idle jitter should NOT trigger fake 0.3s ghost turn
  let res = engine.processTick({
    tel,
    snap: { respFloatTok: 5, respCount: 1, userMsgCount: 1, isGenerating: false, lastResp: bubble, modelName: "Gemini 3 Flash" },
    hiNow: 1000,
  });
  assert.equal(res.finalizedTurn, null);
  assert.equal(tel.history.length, 0);

  // Realistic multi-tick stream across a multi-bubble tool turn
  const telStream = createEmptyTelemetry();
  const b1 = doc.createElement("div");
  const b2 = doc.createElement("div");
  engine.processTick({
    tel: telStream,
    snap: { respFloatTok: 0, respCount: 1, userMsgCount: 1, isGenerating: true, hasCancelBtn: true, lastResp: b1, modelName: "Claude Sonnet 4.6" },
    hiNow: 1000,
  });
  for (let i = 1; i <= 5; i += 1) {
    engine.processTick({
      tel: telStream,
      snap: { respFloatTok: i * 18, respCount: 1, userMsgCount: 1, isGenerating: true, hasCancelBtn: true, lastResp: b1 },
      hiNow: 1000 + i * 250,
    });
  }
  assert.ok(telStream.currentTps > 15 && telStream.currentTps < 200, `unexpected live TPS ${telStream.currentTps}`);

  // Second bubble in the SAME generating turn (banks bubble 1 tokens instead of dropping or finalizing early)
  engine.processTick({
    tel: telStream,
    snap: { respFloatTok: 30, respCount: 2, userMsgCount: 1, isGenerating: true, hasCancelBtn: true, lastResp: b2 },
    hiNow: 2600,
  });
  assert.ok(telStream.bankedTurnTokens >= 85, `expected banked tokens >= 85, got ${telStream.bankedTurnTokens}`);
  assert.equal(telStream.history.length, 0);

  // Trailing token flush then settle (>320ms grace after last growth)
  engine.processTick({
    tel: telStream,
    snap: { respFloatTok: 55, respCount: 2, userMsgCount: 1, isGenerating: false, hasCancelBtn: false, lastResp: b2 },
    hiNow: 3100,
  });
  const doneRes = engine.processTick({
    tel: telStream,
    snap: { respFloatTok: 55, respCount: 2, userMsgCount: 1, isGenerating: false, hasCancelBtn: false, lastResp: b2 },
    hiNow: 3500,
  });
  assert.ok(doneRes.finalizedTurn);
  assert.ok(doneRes.finalizedTurn.tokens >= 140);
  assert.equal(telStream.history.length, 1);

  // Exact transcript reconciliation
  const okExact = engine.applyExactTranscriptMetrics(telStream, {
    outputTokens: 152,
    inputTokens: 1200,
    cacheReadTokens: 800,
    contextTokens: 2152,
  });
  assert.equal(okExact, true);
  assert.equal(telStream.exactRespTokens, 152);
  assert.equal(telStream.exactContextTokens, 2152);
  assert.equal(telStream.history[0].exact, true);
  assert.equal(telStream.history[0].exactOutputTokens, 152);

  // Normal short 1-tick reply (e.g. 46 tok in 0.15s, floored to 0.45s -> ~102 TPS) MUST sync peakTps with lastAvgTps
  const telShort = createEmptyTelemetry();
  engine.processTick({
    tel: telShort,
    snap: { respFloatTok: 0, respCount: 1, userMsgCount: 1, isGenerating: true, hasCancelBtn: true, lastResp: b1 },
    hiNow: 1000,
  });
  engine.processTick({
    tel: telShort,
    snap: { respFloatTok: 46, respCount: 1, userMsgCount: 1, isGenerating: false, hasCancelBtn: false, lastResp: b1 },
    hiNow: 1150,
  });
  engine.processTick({
    tel: telShort,
    snap: { respFloatTok: 46, respCount: 1, userMsgCount: 1, isGenerating: false, hasCancelBtn: false, lastResp: b1 },
    hiNow: 1600,
  });
  assert.ok(telShort.lastAvgTps > 0 && telShort.lastAvgTps <= 200, `Expected bounded short-turn TPS, got ${telShort.lastAvgTps}`);
  assert.ok(telShort.peakTps >= telShort.lastAvgTps && telShort.peakTps > 0, `peakTps (${telShort.peakTps}) must equal or exceed lastAvgTps (${telShort.lastAvgTps})`);

  // Fake huge 1-tick hydration dump (150 tok in 0.15s -> >200 TPS even floored to 0.45s) MUST be rejected completely
  const telHydrateDump = createEmptyTelemetry();
  engine.processTick({
    tel: telHydrateDump,
    snap: { respFloatTok: 0, respCount: 1, userMsgCount: 1, isGenerating: true, hasCancelBtn: true, lastResp: b2 },
    hiNow: 1000,
  });
  engine.processTick({
    tel: telHydrateDump,
    snap: { respFloatTok: 150, respCount: 1, userMsgCount: 1, isGenerating: false, hasCancelBtn: false, lastResp: b2 },
    hiNow: 1150,
  });
  engine.processTick({
    tel: telHydrateDump,
    snap: { respFloatTok: 150, respCount: 1, userMsgCount: 1, isGenerating: false, hasCancelBtn: false, lastResp: b2 },
    hiNow: 1600,
  });
  assert.equal(telHydrateDump.lastAvgTps, 0);
  assert.equal(telHydrateDump.peakTps, 0);
});

// =============================================================================
// 3. DOM Translator & Custom Greeting Tests
// =============================================================================
test("DOM translator translates RU cleanly, restores EN losslessly, and customizes greeting + placeholder", () => {
  const { doc, win } = createMockDom();
  const h1 = doc.createElement("h1");
  const greetText = doc.createTextNode("Good to see you, Иван. What's next?");
  h1.appendChild(greetText);

  const btn = doc.createElement("button");
  btn.textContent = "New Conversation";

  const textarea = doc.createElement("textarea");
  textarea.setAttribute("placeholder", "Ask anything, @ to mention, / for workflows");

  doc.body.appendChild(h1);
  doc.body.appendChild(btn);
  doc.body.appendChild(textarea);

  const translator = createDomTranslator({
    document: doc,
    window: win,
    dictionary,
    applyDynamicRules,
    initialLocale: "ru",
    initialGreeting: normalizeGreetingConfig({
      enabled: true,
      mode: "custom",
      title: "Привет, {name}! Сегодня {weekday}",
      subtitle: "Готов к задачам Rudex",
      displayName: "",
      placeholder: "Напиши задачу или @файл...",
    }),
  });

  translator.init();
  assert.equal(translator.getCapturedUserName(), "Иван");
  assert.ok(h1.textContent.startsWith("Привет, Иван! Сегодня "), `got greeting: ${h1.textContent}`);
  assert.equal(h1.getAttribute("data-rudex-greeting"), "1");
  assert.equal(h1.getAttribute("data-rudex-subtitle"), "Готов к задачам Rudex");
  assert.equal(h1.childNodes.length, 1, "Must NOT insert extra child nodes under React H1");
  assert.ok(doc.getElementById("rudex-greeting-style"), "Subtitle CSS <style> should be injected");
  assert.equal(textarea.getAttribute("placeholder"), "Напиши задачу или @файл...");
  assert.equal(btn.textContent, "Новый чат");

  // Empty name punctuation cleanup
  const resolvedEmpty = translator.resolveGreetingTemplate("С возвращением, {name}!", "", "ru", new Date(2026, 10, 24, 15, 0));
  assert.equal(resolvedEmpty, "С возвращением!");

  // Minimal mode works even when switched to EN locale
  translator.setLocale("en");
  assert.equal(btn.textContent, "New Conversation");
  translator.setGreetingConfig({
    enabled: true,
    mode: "minimal",
    title: "",
    subtitle: "",
    displayName: "",
    placeholder: "",
  });
  assert.equal(h1.textContent, "Ready.");
  assert.equal(h1.getAttribute("data-rudex-subtitle"), null);

  // Disabling restores stock text and clears greeting attributes
  translator.setGreetingConfig(DEFAULT_GREETING_CONFIG);
  assert.equal(h1.textContent, "Good to see you, Иван. What's next?");
  assert.equal(h1.getAttribute("data-rudex-greeting"), null);
  assert.equal(textarea.getAttribute("placeholder"), "Ask anything, @ to mention, / for workflows");
  translator.destroy();
});

// =============================================================================
// 4. Theme Engine & Styles & Studio Panel Tests
// =============================================================================
test("Theme engine handles native light/dark, oklch, contrast, blur overscan, and media protocols", () => {
  const { doc, win } = createMockDom();
  doc.body.style.backgroundColor = "oklch(0.96 0.01 90)";
  assert.equal(detectHostIsLight(doc, win), true);

  const nativeDefault = normalizeAppearance(DEFAULT_APPEARANCE);
  assert.equal(isAppearanceNativeDefault(nativeDefault), true);
  assert.equal(isAppearanceNativeDefault({ presetId: "native", uiPolish: false }), false);
  assert.equal(isAppearanceNativeDefault({ presetId: "native", customAccent: true }), false);

  const accentOnlyCss = buildThemeCss({
    presetId: "native",
    customAccent: true,
    accentColor: "#f59e0b",
  }, { hostIsLight: false });
  assert.ok(accentOnlyCss.includes("--primary: #f59e0b"));
  assert.equal(accentOnlyCss.includes("background-color"), false, "Accent-only mode must not override native canvas");

  const combinedCss = buildThemeCss({
    presetId: "emerald-void",
    customAccent: true,
    accentColor: "#f59e0b",
    sidebarOpacity: 40,
    borderStrength: 80,
    messageStyle: "solid",
    radius: 16,
    wallpaper: {
      type: "image",
      mediaUrl: "rudex-media://local/wp.jpg",
    },
  }, { hostIsLight: false });
  assert.ok(combinedCss.includes("--primary: #f59e0b"));
  assert.ok(combinedCss.includes("--sidebar: rgba(10, 22, 20, 0.4)"));
  assert.ok(combinedCss.includes("border-radius: 16px !important"));

  const css = buildThemeCss({
    presetId: "custom",
    accentColor: "#f8fafc",
    canvasBg: "#0b0d13",
    cardBg: "#151822",
    uiPolish: true,
    wallpaper: {
      type: "image",
      mediaUrl: "agy-media://local/bg.png",
      opacity: 40,
      blur: 14,
      dim: 30,
    },
  }, { hostIsLight: false });

  assert.ok(css.includes("--primary-foreground: #111216"), "Bright accent must get dark foreground");
  assert.ok(!css.includes("blur(0px)"));
  assert.ok(css.includes("#rudex-bg"), "Background layer selector must be #rudex-bg");

  const gradCss = buildThemeCss({
    presetId: "midnight-neon",
    wallpaper: {
      type: "gradient",
      gradColors: ["#0f172a", "#1e1b4b", "#09090b"],
      gradAnimated: true,
    },
  }, { hostIsLight: false });
  assert.ok(gradCss.includes("rudex-grad-flow"));
  assert.ok(gradCss.includes("translate3d"));

  const te = createThemeEngine({ document: doc, window: win });
  te.apply({
    presetId: "obsidian-glass",
    wallpaper: {
      type: "image",
      mediaUrl: "rudex-media://local/wp.jpg",
      blur: 12,
      opacity: 35,
      saturate: 140,
      tintEnabled: true,
      tintOpacity: 40,
    },
  });
  const bg = doc.getElementById("rudex-bg");
  assert.ok(bg, "#rudex-bg node should mount");
  assert.equal(bg.style.zIndex, "-1");
  const img = bg.querySelector("img");
  assert.ok(img && img.style.transform.includes("scale("), "Blurred image should get scale overscan");
  assert.ok(img.style.filter.includes("saturate(140%)"), "Combined saturate filter should be applied");
  const tint = bg.querySelector('[data-role="bg-tint"]');
  assert.ok(tint && tint.style.opacity === "0.4", "Gradient tint veil should combine over photo wallpaper");
  te.destroy();
});

test("Wallpaper shell scan unmasks deep semi-opaque wrappers, prunes sidebar rows, and spares overlays", () => {
  const { doc, win } = createMockDom();
  const makeSizedEl = (tag, rect, bgCol) => {
    const el = doc.createElement(tag);
    el.getBoundingClientRect = () => rect;
    if (bgCol) el.style.backgroundColor = bgCol;
    return el;
  };

  const root = makeSizedEl("div", { left: 0, top: 0, right: 1400, bottom: 900, width: 1400, height: 900 });
  root.id = "root";
  doc.body.appendChild(root);

  const sidebar = makeSizedEl("aside", { left: 0, top: 0, right: 260, bottom: 900, width: 260, height: 900 }, "rgb(14, 14, 18)");
  const rows = [];
  for (let i = 0; i < 40; i += 1) {
    const r = makeSizedEl("div", { left: 8, top: 40 + i * 34, right: 248, bottom: 72 + i * 34, width: 240, height: 32 }, "rgb(20, 20, 24)");
    rows.push(r);
    sidebar.appendChild(r);
  }
  root.appendChild(sidebar);

  // Build 10 nested wrappers inside main viewport
  let deepParent = makeSizedEl("div", { left: 260, top: 0, right: 1400, bottom: 900, width: 1140, height: 900 });
  root.appendChild(deepParent);
  for (let d = 1; d < 10; d += 1) {
    const next = makeSizedEl("div", { left: 260, top: 0, right: 1400, bottom: 900, width: 1140, height: 900 });
    deepParent.appendChild(next);
    deepParent = next;
  }
  const chatPaneDepth10 = makeSizedEl("div", { left: 260, top: 32, right: 1400, bottom: 900, width: 1140, height: 868 }, "rgba(19, 19, 22, 0.82)");
  deepParent.appendChild(chatPaneDepth10);

  // Protected overlays & message bubbles must NEVER be stripped of background
  const agentMsg = makeSizedEl("div", { left: 300, top: 100, right: 1000, bottom: 550, width: 700, height: 450 }, "rgba(12, 13, 18, 0.90)");
  agentMsg.setAttribute("data-testid", "agent-response");
  chatPaneDepth10.appendChild(agentMsg);

  const dialog = makeSizedEl("div", { left: 400, top: 200, right: 1000, bottom: 700, width: 600, height: 500 }, "rgb(22, 22, 28)");
  dialog.setAttribute("role", "dialog");
  const dialogChild = makeSizedEl("div", { left: 400, top: 200, right: 1000, bottom: 700, width: 600, height: 500 }, "rgb(24, 24, 30)");
  dialog.appendChild(dialogChild);
  chatPaneDepth10.appendChild(dialog);

  // Depth-25 opaque wrapper detected only via elementsFromPoint safety net
  const depth25Wrapper = makeSizedEl("div", { left: 260, top: 32, right: 1400, bottom: 900, width: 1140, height: 868 }, "rgb(18, 18, 20)");
  doc.elementsFromPoint = () => [dialogChild, dialog, agentMsg, depth25Wrapper, chatPaneDepth10, root, doc.body, doc.documentElement];

  const te = createThemeEngine({ document: doc, window: win });
  te.apply({
    presetId: "custom",
    glassOpacity: 82,
    wallpaper: { type: "image", mediaUrl: "agy-media://local/wp.jpg", blur: 0, dim: 45, opacity: 85 },
  });

  assert.equal(sidebar.getAttribute("data-rudex-bg-sidebar"), "1");
  assert.equal(rows[0].getAttribute("data-rudex-bg-shell"), null, "Sidebar rows should be pruned");
  assert.equal(chatPaneDepth10.getAttribute("data-rudex-bg-shell"), "1", "0.82-alpha depth-10 chat pane must become transparent shell");
  assert.equal(depth25Wrapper.getAttribute("data-rudex-bg-shell"), "1", "elementsFromPoint depth-25 wrapper must become transparent shell");
  assert.equal(agentMsg.getAttribute("data-rudex-bg-shell"), null, "Agent response bubble must stay intact");
  assert.equal(dialog.getAttribute("data-rudex-bg-shell"), null, "Dialog overlay must stay intact");
  assert.equal(dialogChild.getAttribute("data-rudex-bg-shell"), null, "Dialog descendants must stay intact");

  const cssText = doc.getElementById("rudex-studio-theme").textContent;
  assert.ok(cssText.includes("backdrop-filter: none !important"), "Shell CSS must clear backdrop-filter");

  te.destroy();
  assert.equal(chatPaneDepth10.getAttribute("data-rudex-bg-shell"), null, "destroy() must clean shell attributes");
});

test("Studio styles and panel UI render without layout/CSS regressions and sync greeting live", () => {
  const css = buildStudioStyles();
  for (const requiredClass of [
    "--rx-accent",
    ".rx-details",
    ".subtab-bar",
    ".greeting-preview-card",
    ".hint-banner",
    ".empty-msg",
    ".quota-table-wrap",
    ".modal-shell.is-appearance-live",
    ".drawer-sticky-footer",
    ".modal-body > *",
    "min-height: 0",
    "flex-shrink: 0",
    ".kpi-unit",
    ".spark-card-foot",
  ]) {
    assert.ok(css.includes(requiredClass), `Missing CSS rule/token: ${requiredClass}`);
  }
  assert.equal(css.includes(".history-row"), false, "TPS history CSS should be removed");

  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, dictionary, applyDynamicRules, initialLocale: "ru" });
  translator.init();

  const ipcMock = {
    invoke: async (ch) => {
      if (ch === "agy-studio:get-state") {
        return {
          locale: "ru",
          settings: {
            viewMode: "mini",
            greeting: { enabled: true, mode: "custom", title: "Салют, {name}!", subtitle: "Rudex готов" },
          },
          chats: {},
          quota: { byModel: {} },
          liveEdits: [],
        };
      }
      if (ch === "agy-studio:list-media") return { ok: true, items: [] };
      if (ch === "agy-studio:get-quota-summary") return { ok: true, quota: { byModel: {} } };
      return { ok: true };
    },
  };

  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: ipcMock,
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: createThemeEngine({ document: doc, window: win }),
  });

  try {
    panel.init();
    panel.setOpen(true, { tab: "settings", subTab: "export" });
    const host = doc.getElementById("rudex-studio-host");
    const modalMount = host && host.shadowRoot ? host.shadowRoot.querySelector(".modal-mount") : null;
    const modalHtml = modalMount ? modalMount.innerHTML : "";
    assert.ok(modalHtml.includes('data-live="respNum"'), "Monitor should render clean respNum KPI slot");
    assert.ok(modalHtml.includes('data-live="chatNum"'), "Monitor should render clean chatNum KPI slot");
    assert.ok(modalHtml.includes('data-live="sparkFootMeta"'), "Monitor should render sparkline footer slot");
    assert.equal(modalHtml.includes("historyList"), false, "TPS history section must be removed");
    assert.equal(modalHtml.includes("История ответов"), false, "TPS history heading must be removed");

    panel.setLocale("en");
    panel.applyRemoteState({
      locale: "ru",
      settings: {
        thinkingInRussian: false,
        greeting: { enabled: true, mode: "custom", title: "Привет от панели!", subtitle: "" },
      },
    });
    assert.equal(translator.getGreetingConfig().title, "Привет от панели!");

    // Verify Persona tab does NOT duplicate thinkingInRussian toggle while Settings -> Language & System exposes it once
    panel.setOpen(true, { tab: "persona" });
    const personaHtml = modalMount ? modalMount.innerHTML : "";
    assert.equal(personaHtml.includes('data-action="toggle-thinking-ru"'), false, "Persona tab must NOT duplicate thinkingInRussian toggle");

    panel.setOpen(true, { tab: "settings", subTab: "system" });
    const sysHtmlOff = modalMount ? modalMount.innerHTML : "";
    assert.ok(sysHtmlOff.includes('data-action="toggle-thinking-ru"'), "Settings default subtab (Language & System) must render thinkingInRussian toggle");
    assert.ok(sysHtmlOff.includes('data-action="toggle-auto-updates"'), "Settings -> Language & System must render autoCheckUpdates toggle");
    assert.ok(sysHtmlOff.includes("По умолчанию"), "Disabled thinkingInRussian must show default badge");

    panel.applyRemoteState({
      locale: "ru",
      settings: { thinkingInRussian: true },
    });
    const sysHtmlOn = modalMount ? modalMount.innerHTML : "";
    assert.ok(sysHtmlOn.includes('class="switch is-on" role="switch" aria-checked="true" data-action="toggle-thinking-ru"'));
    assert.ok(sysHtmlOn.includes("Русский"), "Enabled thinkingInRussian must show Russian badge");

    // Mini widget exposes expand-to-medium button, Settings -> Widget exposes size selector, and S <-> M toggle works
    const widgetMount = host && host.shadowRoot ? host.shadowRoot.querySelector(".widget-wrap") : null;
    const widgetHtml = widgetMount ? widgetMount.innerHTML : "";
    assert.ok(widgetHtml.includes('data-action="to-medium"'), "Mini pill must include expand-to-medium button");
    panel.setOpen(true, { tab: "settings", subTab: "widget" });
    const widgetTabHtml = modalMount ? modalMount.innerHTML : "";
    assert.ok(widgetTabHtml.includes("Размер виджета"), "Settings -> Widget must expose widget size selector");
    assert.ok(widgetTabHtml.includes('data-action="set-view-mode"'), "Settings -> Widget must expose S/M view mode buttons");

    panel.setViewMode("medium");
    const medHtml = widgetMount ? widgetMount.innerHTML : "";
    assert.ok(medHtml.includes("med-card"), "Setting viewMode=medium must render medium card");
    assert.ok(medHtml.includes('data-action="to-mini"'), "Medium card must include collapse-to-mini button");

    panel.setViewMode("mini");
    assert.ok((widgetMount ? widgetMount.innerHTML : "").includes("mini-pill"), "Setting viewMode=mini must restore mini pill");

    // Appearance opens centered inside monolithic Studio by default, with optional right-dock button
    panel.setOpen(true, { tab: "appearance", appSubTab: "theme", dockedRight: false });
    const appCenteredHtml = modalMount ? modalMount.innerHTML : "";
    assert.equal(appCenteredHtml.includes("is-appearance-live"), false, "Appearance must open centered monolithically by default");
    assert.ok(appCenteredHtml.includes("modal-sidebar"), "Centered Appearance keeps main navigation sidebar");
    assert.ok(appCenteredHtml.includes('data-action="toggle-appearance-dock"'), "Centered Appearance offers optional dock-right button");
    assert.ok(appCenteredHtml.includes("layer-summary-strip"), "Combinable layer summary strip must render");
    assert.ok(appCenteredHtml.includes('data-action="set-app-subtab" data-val="surface"'), "Combinable Surface subtab must render");

    // Optional right-side live preview mode
    panel.setOpen(true, { tab: "appearance", appSubTab: "surface", dockedRight: true });
    const appDockedHtml = modalMount ? modalMount.innerHTML : "";
    assert.ok(appDockedHtml.includes("is-appearance-live"), "Docked Appearance enables right-side live drawer");
    assert.equal(appDockedHtml.includes("modal-sidebar"), false, "Docked drawer hides left sidebar for live canvas view");
    assert.ok(appDockedHtml.includes('data-action="set-message-style"'), "Surface subtab must expose message card style options");

    // Single click on unpinned mini pill opens Studio immediately (no double-click required)
    panel.setOpen(false);
    assert.equal(modalMount.innerHTML, "");
    const fakePillTarget = doc.createElement("div");
    fakePillTarget.setAttribute("data-widget-body", "1");
    const rootEl = host && host.shadowRoot ? host.shadowRoot.querySelector(".studio-root") : null;
    rootEl.appendChild(fakePillTarget);
    rootEl.dispatchEvent({ type: "click", target: fakePillTarget });
    assert.ok(modalMount.innerHTML.includes("modal-shell"), "Single click on unpinned mini pill must immediately open Rudex modal");
  } finally {
    panel.destroy();
    translator.destroy();
  }
});

// =============================================================================
// 5. Rudex Hook Subprocess Tests (atomic live-edits & anti-subagent guards)
// =============================================================================
test("rudex-hook.js atomically claims supplements, blocks subagent stealing, and respects Stop contract", () => {
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-hook-test-"));
  const hookScript = path.join(SCRIPTS_DIR, "rudex-hook.js");
  try {
    const leDir = path.join(tmpUserData, "studio_live_edits");
    const queueDir = path.join(leDir, "queue");
    const deliveredDir = path.join(leDir, "delivered");
    const expiredDir = path.join(leDir, "expired");
    fs.mkdirSync(queueDir, { recursive: true });
    fs.writeFileSync(path.join(leDir, "pending.flag"), "1\n", "utf8");

    const now = Date.now();
    // 1. Fresh fallback item from __new__ chat
    fs.writeFileSync(path.join(queueDir, "1000-item1.json"), JSON.stringify({
      id: "item1",
      chatKey: "__new__",
      text: "Добавь светлую шапку",
      createdAt: now,
      fallbackAny: true,
      status: "pending",
    }), "utf8");

    // 2. Expired item (>10m old)
    fs.writeFileSync(path.join(queueDir, "0001-stale.json"), JSON.stringify({
      id: "stale",
      chatKey: "aaaa1111-1111-4111-8111-111111111111",
      text: "Просроченное дополнение",
      createdAt: now - 12 * 60 * 1000,
      status: "pending",
    }), "utf8");

    const runHook = (payload) => {
      const r = spawnSync(process.execPath, [hookScript], {
        input: JSON.stringify(payload),
        env: Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: tmpUserData, RUDEX_SKIP_AUTO_REPATCH: "1" }),
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse((r.stdout || "{}").trim() || "{}");
    };

    // Subagent on PreInvocation must NOT steal fallbackAny item from main chat!
    const subOut = runHook({
      hookEventName: "PreInvocation",
      conversationId: "bbbb2222-2222-4222-8222-222222222222",
      isSubagent: true,
      initialNumSteps: 1,
    });
    assert.deepEqual(subOut, {});
    assert.ok(fs.existsSync(path.join(queueDir, "1000-item1.json")), "Subagent must leave item1 in queue/");
    assert.ok(fs.existsSync(path.join(expiredDir, "0001-stale.json")), "Stale item should move to expired/");

    // Non-NO_TOOL_CALL Stop must do nothing
    const stopToolOut = runHook({
      hookEventName: "Stop",
      conversationId: "cccc3333-3333-4333-8333-333333333333",
      terminationReason: "MAX_TOKENS",
    });
    assert.deepEqual(stopToolOut, {});

    // Main chat Stop (NO_TOOL_CALL) claims fallbackAny item cleanly
    const stopOkOut = runHook({
      hookEventName: "Stop",
      conversationId: "cccc3333-3333-4333-8333-333333333333",
      terminationReason: "NO_TOOL_CALL",
      initialNumSteps: 2,
    });
    assert.equal(stopOkOut.decision, "continue");
    assert.ok(stopOkOut.reason.includes("Добавь светлую шапку"));
    assert.ok(!fs.existsSync(path.join(queueDir, "1000-item1.json")));
    assert.ok(fs.existsSync(path.join(deliveredDir, "1000-item1.json")));
    assert.equal(fs.existsSync(path.join(leDir, "pending.flag")), false, "Empty queue must unlink pending.flag");

    // Second Stop sees nothing (no infinite loop)
    const stopAgainOut = runHook({
      hookEventName: "Stop",
      conversationId: "cccc3333-3333-4333-8333-333333333333",
      terminationReason: "NO_TOOL_CALL",
    });
    assert.deepEqual(stopAgainOut, {});
  } finally {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

test("rudex-hook.js injects concise persona style protocol cleanly and refreshes anchor after 4 steps", () => {
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-persona-hook-"));
  const hookScript = path.join(SCRIPTS_DIR, "rudex-hook.js");
  try {
    const convId = "dddd4444-4444-4444-8444-444444444444";
    fs.writeFileSync(path.join(tmpUserData, "agy_studio_persona_active.flag"), "1\n", "utf8");
    fs.writeFileSync(path.join(tmpUserData, "agy_studio_chats.json"), JSON.stringify({
      version: 1,
      chats: {
        [convId]: {
          title: "Test Chat",
          personaEnabled: true,
          personaActivePreset: "custom",
          personaText: "Отвечай кратко, по делу и дружелюбно",
          personaStrict: true,
          updatedAt: Date.now(),
        },
      },
    }), "utf8");

    const runHook = (payload) => {
      const r = spawnSync(process.execPath, [hookScript], {
        input: JSON.stringify(payload),
        env: Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: tmpUserData, RUDEX_SKIP_AUTO_REPATCH: "1" }),
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse((r.stdout || "{}").trim() || "{}");
    };

    const startOut = runHook({
      hookEventName: "SessionStart",
      conversationId: convId,
      initialNumSteps: 0,
    });
    assert.ok(Array.isArray(startOut.injectSteps) && startOut.injectSteps.length === 1);
    const msg = startOut.injectSteps[0].systemMessage.systemMessage;
    assert.ok(msg.includes("<user_persona>\nОтвечай кратко, по делу и дружелюбно\n</user_persona>"));
    assert.equal(msg.includes("bypass safety limits"), false);
    assert.equal(msg.includes("Mandatory Compliance Check"), false);

    // Step +4 triggers concise recency reminder under strict mode
    const midOut = runHook({
      hookEventName: "PreInvocation",
      conversationId: convId,
      initialNumSteps: 4,
      invocationNum: 1,
    });
    assert.ok(Array.isArray(midOut.injectSteps) && midOut.injectSteps.length === 1);
    assert.ok(midOut.injectSteps[0].systemMessage.systemMessage.includes("Напоминание о стиле"));
  } finally {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

test("rudex-hook.js does not inject thinking-language prompts (0 token cost) and cleans up legacy thinking flags", () => {
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-thinking-hook-"));
  const hookScript = path.join(SCRIPTS_DIR, "rudex-hook.js");
  try {
    const convId = "eeee5555-5555-4555-8555-555555555555";
    const flagPath = path.join(tmpUserData, "agy_studio_thinking_ru.flag");
    const anchorsPath = path.join(tmpUserData, "studio_thinking_anchors.json");
    const settingsPath = path.join(tmpUserData, "agy_studio_settings.json");

    fs.writeFileSync(flagPath, "1\n", "utf8");
    fs.writeFileSync(anchorsPath, JSON.stringify({ version: 1, anchors: { [convId]: { enabled: true, stepCount: 0 } } }), "utf8");
    fs.writeFileSync(settingsPath, JSON.stringify({ thinkingInRussian: true }), "utf8");

    const runHook = (payload) => {
      const r = spawnSync(process.execPath, [hookScript], {
        input: JSON.stringify(payload),
        env: Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: tmpUserData, RUDEX_SKIP_AUTO_REPATCH: "1" }),
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse((r.stdout || "{}").trim() || "{}");
    };

    const startOut = runHook({
      hookEventName: "SessionStart",
      conversationId: convId,
      initialNumSteps: 0,
    });
    assert.deepEqual(startOut, {}, "Thinking translation must run client-side without injecting prompt tokens");
    assert.equal(fs.existsSync(flagPath), false, "Legacy agy_studio_thinking_ru.flag must be cleaned up automatically");
    assert.equal(fs.existsSync(anchorsPath), false, "Legacy studio_thinking_anchors.json must be cleaned up automatically");

    const nextOut = runHook({
      hookEventName: "PreInvocation",
      conversationId: convId,
      initialNumSteps: 6,
    });
    assert.deepEqual(nextOut, {}, "PreInvocation must not inject thinking reminders");
  } finally {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

// =============================================================================
// 6. Async Streaming ZIP Builder Tests
// =============================================================================
test("zip-builder writes valid UTF-8 Cyrillic & POSIX ZIP archives and builds localized exports", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-zip-test-"));
  try {
    const zipPath = path.join(tmpDir, "export.zip");
    const sampleFile = path.join(tmpDir, "cyrillic-source.txt");
    fs.writeFileSync(sampleFile, "Привет из Rudex ZIP!\n", "utf8");

    const bytes = await writeZipFile(zipPath, [
      { name: "отчёт/readme.txt", data: "Тест кириллицы и дубликатов" },
      { name: "отчёт/README.txt", data: "Второй файл с тем же регистром" },
      { name: "logs/from-disk.txt", filePath: sampleFile, size: fs.statSync(sampleFile).size },
    ]);
    assert.ok(bytes > 0);
    const zipBuf = fs.readFileSync(zipPath);
    assert.equal(zipBuf.readUInt32LE(0), 0x04034b50);

    if (process.platform === "win32") {
      const extractDir = path.join(tmpDir, "unzipped");
      execFileSync("powershell", [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${extractDir}' -Force`,
      ], { windowsHide: true });
      assert.ok(fs.existsSync(path.join(extractDir, "отчёт", "readme.txt")));
      assert.equal(fs.readFileSync(path.join(extractDir, "logs", "from-disk.txt"), "utf8"), "Привет из Rudex ZIP!\n");
    }

    // Export archive test with skipped oversized file + EN locale
    const chatId = crypto.randomUUID();
    const outExport = path.join(tmpDir, "chat-export.zip");
    const exportRes = await buildChatExportArchive({
      outPath: outExport,
      chatKey: chatId,
      chatTitle: "Тестовый чат",
      locale: "en",
      includeThinking: false,
      domMessages: [
        { role: "user", text: "Check status" },
        { role: "assistant", text: "All green" },
      ],
      persona: { enabled: true, text: "Concise engineer", strict: false },
    });
    assert.equal(exportRes.ok, true);
    assert.ok(fs.existsSync(outExport));
    assert.ok(createZipBuffer([{ name: "a.txt", data: "123" }]).length > 20);
    assert.ok(crc32(Buffer.from("rudex")) !== 0);
    assert.equal(findBrainDirForChat({ homeDir: tmpDir, firstUserText: "hello" }), null);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// =============================================================================
// 7. Plugin-Removal Auto-Rollback Guard Tests
// =============================================================================
test("patchMainJs startup guard auto-restores stock app.asar when Rudex plugin/skill is removed and never bricks", () => {
  const minimalMainSrc = [
    `"use strict";`,
    `const menu_1 = require("./menu");`,
    `const electron_1 = require("electron");`,
    `    const ipc = (0, ipcHandlers_1.registerIpcHandlers)(storageManager, {`,
    `electron_1.app.on('web-contents-created', (_event, contents) => {`,
  ].join("\n");
  const patchedMain = patchMainJs(minimalMainSrc, "44.10.0", []);
  const cut = patchedMain.indexOf("\nconst menu_1");
  assert.ok(cut > 0);
  const guardCode = patchedMain.slice(0, cut);

  const runGuardScenario = ({ withPlugin, withSkill, backups, hasPreAsar }) => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-rollback-"));
    try {
      const homeDir = path.join(tmpRoot, "home");
      const userDataDir = path.join(tmpRoot, "userData");
      const appRoot = path.join(tmpRoot, "antigravity");
      const resDir = path.join(appRoot, "resources");
      const appDir = path.join(resDir, "app");
      const distDir = path.join(appDir, "dist");
      fs.mkdirSync(distDir, { recursive: true });
      fs.mkdirSync(path.join(userDataDir, "studio_live_edits"), { recursive: true });
      fs.writeFileSync(path.join(appRoot, "version"), "44.10.0\n", "utf8");
      fs.writeFileSync(path.join(appDir, "rudex-patch-meta.json"), JSON.stringify({ managedByPlugin: true }), "utf8");
      fs.writeFileSync(path.join(userDataDir, "agy_studio_persona_active.flag"), "1\n", "utf8");
      fs.writeFileSync(path.join(userDataDir, "agy_studio_thinking_ru.flag"), "1\n", "utf8");
      fs.writeFileSync(path.join(userDataDir, "studio_live_edits", "pending.flag"), "1\n", "utf8");

      const legacyGlobalRule = path.join(homeDir, ".gemini", "config", "rules", "antigravity-ru-persona.md");
      fs.mkdirSync(path.dirname(legacyGlobalRule), { recursive: true });
      fs.writeFileSync(legacyGlobalRule, "stale", "utf8");

      const rudexPluginDir = path.join(homeDir, ".gemini", "config", "plugins", "rudex");
      if (withPlugin) {
        fs.mkdirSync(rudexPluginDir, { recursive: true });
        fs.writeFileSync(path.join(rudexPluginDir, "plugin.json"), '{"name":"rudex"}', "utf8");
      }
      if (withSkill) {
        fs.mkdirSync(path.join(rudexPluginDir, "skills", "rudex"), { recursive: true });
        fs.writeFileSync(path.join(rudexPluginDir, "skills", "rudex", "SKILL.md"), "# Rudex\n", "utf8");
      }

      for (const b of backups) {
        fs.writeFileSync(path.join(resDir, `app.asar.orig-${b.ver}`), b.content, "utf8");
      }
      if (hasPreAsar) {
        fs.writeFileSync(path.join(resDir, "app.asar"), "EXISTING_ASAR", "utf8");
      }

      let relaunchCalls = 0;
      let exitCode = null;
      const sandbox = {
        process: { resourcesPath: resDir },
        __dirname: distDir,
        require: (mod) => {
          if (mod === "fs") return fs;
          if (mod === "path") return path;
          if (mod === "os") return Object.assign({}, os, { homedir: () => homeDir });
          if (mod === "electron") {
            return {
              app: {
                getPath: () => userDataDir,
                relaunch: () => { relaunchCalls += 1; },
                exit: (c) => { exitCode = c; },
              },
            };
          }
          throw new Error(`Unexpected require: ${mod}`);
        },
      };
      sandbox.globalThis = sandbox;
      vm.runInNewContext(guardCode, sandbox);

      const asarPath = path.join(resDir, "app.asar");
      return {
        relaunchCalls,
        exitCode,
        disabled: Boolean(sandbox.__RUDEX_DISABLED__),
        appDirExists: fs.existsSync(appDir),
        asarContent: fs.existsSync(asarPath) ? fs.readFileSync(asarPath, "utf8") : "",
        remainingBackups: fs.readdirSync(resDir).filter((n) => n.startsWith("app.asar.orig-")),
        personaFlagExists: fs.existsSync(path.join(userDataDir, "agy_studio_persona_active.flag")),
        thinkingFlagExists: fs.existsSync(path.join(userDataDir, "agy_studio_thinking_ru.flag")),
        liveEditFlagExists: fs.existsSync(path.join(userDataDir, "studio_live_edits", "pending.flag")),
        legacyRuleExists: fs.existsSync(legacyGlobalRule),
      };
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  };

  // Case 1: Both plugin.json and SKILL.md present -> keep Rudex active untouched
  const active = runGuardScenario({
    withPlugin: true,
    withSkill: true,
    backups: [{ ver: "44.10.0", content: "STOCK_44_10" }],
    hasPreAsar: false,
  });
  assert.equal(active.relaunchCalls, 0);
  assert.equal(active.exitCode, null);
  assert.equal(active.disabled, false);
  assert.equal(active.appDirExists, true);
  assert.equal(active.personaFlagExists, true);
  assert.equal(active.thinkingFlagExists, true);

  // Case 2: User removed plugin/skill -> restores newest semver backup (44.10.0 > 44.9.1), cleans flags, relaunches
  const rolledBack = runGuardScenario({
    withPlugin: false,
    withSkill: false,
    backups: [
      { ver: "44.9.1", content: "OLD_44_9_1" },
      { ver: "44.10.0", content: "NEWEST_STOCK_44_10_0" },
    ],
    hasPreAsar: false,
  });
  assert.equal(rolledBack.relaunchCalls, 1);
  assert.equal(rolledBack.exitCode, 0);
  assert.equal(rolledBack.appDirExists, false);
  assert.equal(rolledBack.asarContent, "NEWEST_STOCK_44_10_0");
  assert.deepEqual(rolledBack.remainingBackups, []);
  assert.equal(rolledBack.personaFlagExists, false);
  assert.equal(rolledBack.thinkingFlagExists, false);
  assert.equal(rolledBack.liveEditFlagExists, false);
  assert.equal(rolledBack.legacyRuleExists, false);

  // Case 3: User removed only SKILL.md and NO backups/app.asar exist -> NEVER brick; enter dormant mode cleanly
  const dormant = runGuardScenario({
    withPlugin: true,
    withSkill: false,
    backups: [],
    hasPreAsar: false,
  });
  assert.equal(dormant.relaunchCalls, 0);
  assert.equal(dormant.appDirExists, true, "Must NEVER delete resources/app when no valid app.asar exists");
  assert.equal(dormant.disabled, true);
  assert.equal(dormant.personaFlagExists, false);
  assert.equal(dormant.thinkingFlagExists, false);
});

// =============================================================================
// 8. PowerShell Installer AST Safety Check (Windows)
// =============================================================================
test("install.ps1 parses cleanly and never assigns to any [switch] parameter variable", { skip: process.platform !== "win32" }, () => {
  const ps1Path = path.join(REPO_ROOT, "install.ps1");
  const psScript = [
    `$errs = $null`,
    `$raw = Get-Content -LiteralPath '${ps1Path.replace(/'/g, "''")}' -Raw -Encoding UTF8`,
    `$ast = [System.Management.Automation.Language.Parser]::ParseInput($raw, [ref]$null, [ref]$errs)`,
    `if ($errs -and $errs.Count -gt 0) { throw ("PS1 parse errors: " + (($errs | ForEach-Object { $_.Message }) -join "; ")) }`,
    `$switchNames = @()`,
    `if ($ast.ParamBlock) {`,
    `  foreach ($p in $ast.ParamBlock.Parameters) {`,
    `    $isSwitch = $false`,
    `    foreach ($attr in $p.Attributes) {`,
    `      if ($attr -is [System.Management.Automation.Language.TypeConstraintAst] -and $attr.TypeName.Name -ieq 'switch') { $isSwitch = $true }`,
    `    }`,
    `    if ($isSwitch) { $switchNames += $p.Name.VariablePath.UserPath.ToLowerInvariant() }`,
    `  }`,
    `}`,
    `$assigns = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.AssignmentStatementAst] }, $true)`,
    `foreach ($a in $assigns) {`,
    `  if ($a.Left -is [System.Management.Automation.Language.VariableExpressionAst]) {`,
    `    $v = $a.Left.VariablePath.UserPath.ToLowerInvariant()`,
    `    if ($switchNames -contains $v) { throw ("Collision with switch param: $" + $v) }`,
    `  }`,
    `}`,
    `Write-Output "AST_OK"`,
  ].join("\n");
  const encoded = Buffer.from(psScript, "utf16le").toString("base64");
  const out = execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert.ok(out.includes("AST_OK"), `Unexpected PowerShell AST check output: ${out}`);
});

// =============================================================================
// 9. Long-Conversation Dynamic TPS & View Usage / GPT & Anthropic Quota Tests
// =============================================================================
test("Long-conversation live TPS stays dynamic across input-cancel-button, Copy buttons, virtualization, segment collapses, and Load Older", () => {
  const engine = createTelemetryEngine();
  const { doc, win } = createMockDom();

  // Part A: Pure telemetry-engine resilience on long conversations
  const tel = createEmptyTelemetry();
  const oldB1 = doc.createElement("div");
  const oldB2 = doc.createElement("div");
  const activeBubble = doc.createElement("div");

  // Warm start of turn 6 in a long chat (5 user msgs, 5 resp bubbles)
  engine.processTick({
    tel,
    snap: { respFloatTok: 0, respCount: 5, userMsgCount: 5, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble, modelName: "Gemini 4 Neon" },
    hiNow: 1000,
  });
  for (let i = 1; i <= 4; i += 1) {
    engine.processTick({
      tel,
      snap: { respFloatTok: i * 40, respCount: 5, userMsgCount: 5, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble },
      hiNow: 1000 + i * 250,
    });
  }
  assert.equal(tel.isGenerating, true);
  assert.ok(tel.currentTps > 15, `expected live TPS > 15, got ${tel.currentTps}`);

  // 1) Virtualized DOM drops earlier bubbles mid-stream (respCount 5 -> 2, userMsgCount 5 -> 2)
  const virtRes = engine.processTick({
    tel,
    snap: { respFloatTok: 190, respCount: 2, userMsgCount: 2, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble },
    hiNow: 2250,
  });
  assert.equal(virtRes.canceled, false, "Virtualized DOM shrink during active generation must NOT cancel turn");
  assert.equal(tel.isGenerating, true);
  assert.ok(tel.currentTps > 15, `expected live TPS > 15 after virtualization, got ${tel.currentTps}`);

  // 2) Ephemeral/thinking segment collapses inside same bubble (190 -> 18) then new answer streams (18 -> 55 -> 95)
  engine.processTick({
    tel,
    snap: { respFloatTok: 18, respCount: 2, userMsgCount: 2, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble },
    hiNow: 2500,
  });
  assert.ok(tel.bankedTurnTokens >= 185, `expected collapsed segment banked >= 185 tokens, got ${tel.bankedTurnTokens}`);
  engine.processTick({
    tel,
    snap: { respFloatTok: 55, respCount: 2, userMsgCount: 2, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble },
    hiNow: 2750,
  });
  assert.ok(tel.currentTps > 15, `TPS must update immediately after segment collapse (not freeze at highWaterBubbleTok), got ${tel.currentTps}`);
  engine.processTick({
    tel,
    snap: { respFloatTok: 95, respCount: 2, userMsgCount: 2, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble },
    hiNow: 3000,
  });
  assert.ok(tel.currentTps > 15);

  // 3) User triggers "Load older messages" while streaming (userMsgCount jumps 2 -> 14 on same activeBubble)
  engine.processTick({
    tel,
    snap: { respFloatTok: 135, respCount: 14, userMsgCount: 14, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble },
    hiNow: 3250,
  });
  assert.ok(tel.currentTps > 15, `Load older messages jump must NOT zero delta, got ${tel.currentTps}`);

  // 4) Pause > 2.3s (e.g., long tool call) while hasCancelBtn stays true, then resume streaming
  engine.processTick({
    tel,
    snap: { respFloatTok: 135, respCount: 14, userMsgCount: 14, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble },
    hiNow: 6000,
  });
  assert.equal(tel.isGenerating, true);
  engine.processTick({
    tel,
    snap: { respFloatTok: 165, respCount: 14, userMsgCount: 14, isGenerating: true, hasCancelBtn: true, lastResp: activeBubble },
    hiNow: 6250,
  });
  assert.ok(tel.currentTps > 15, `TPS must resume dynamically after long tool wait, got ${tel.currentTps}`);

  // 5) Explicit cancel click cancels cleanly
  const cancelRes = engine.processTick({
    tel,
    snap: { respFloatTok: 165, respCount: 14, userMsgCount: 14, isGenerating: false, hasCancelBtn: false, lastResp: activeBubble },
    hiNow: 6500,
    lastCancelClickAt: 6450,
  });
  assert.equal(cancelRes.canceled, true);
  assert.equal(tel.currentTps, 0);

  // Part B: Studio panel DOM integration with real Antigravity selectors (`input-cancel-button` + internal `Copy` button + `<h6>Агент работает</h6>`)
  const main = doc.createElement("main");
  const u1 = doc.createElement("div");
  u1.setAttribute("data-testid", "user-message-content");
  u1.textContent = "Напиши длинный код";
  main.appendChild(u1);

  const prevResp = doc.createElement("div");
  prevResp.setAttribute("data-testid", "agent-response");
  prevResp.textContent = "Первый шаг ответа.";
  main.appendChild(prevResp);

  const liveResp = doc.createElement("div");
  liveResp.setAttribute("data-testid", "agent-response");
  const h6 = doc.createElement("h6");
  h6.textContent = "Агент работает";
  const copyBtn = doc.createElement("button");
  copyBtn.setAttribute("aria-label", "Copy");
  copyBtn.textContent = "Copy";
  const mdRoot = doc.createElement("div");
  mdRoot.setAttribute("data-markdown-root", "");
  mdRoot.textContent = "Начальный фрагмент ответа.";
  liveResp.appendChild(h6);
  liveResp.appendChild(copyBtn);
  liveResp.appendChild(mdRoot);
  main.appendChild(liveResp);

  const cancelBtn = doc.createElement("button");
  cancelBtn.setAttribute("data-testid", "input-cancel-button");
  cancelBtn.setAttribute("aria-label", "Cancel (Ctrl+D)");
  doc.body.appendChild(main);
  doc.body.appendChild(cancelBtn);

  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: { invoke: async () => ({ ok: true }) },
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });
  panel.init();
  panel.pollStream();

  mdRoot.textContent = "Начальный фрагмент ответа. Продолжаем потоковую генерацию кода и объяснений для длинного диалога в Rudex Studio, проверяем живой TPS без зависаний и сбросов.";
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  return wait(160).then(() => {
    panel.pollStream();
    mdRoot.textContent += " Добавляем ещё один абзац текста, чтобы убедиться, что счетчик TPS в мини-виджете обновляется динамически в длинной переписке.";
    return wait(160);
  }).then(() => {
    panel.pollStream();
    panel.setOpen(true);
    const host = doc.getElementById("rudex-studio-host");
    const widgetWrap = host && host.shadowRoot ? host.shadowRoot.querySelector(".widget-wrap") : null;
    const html = widgetWrap ? widgetWrap.innerHTML : "";
    const m = /data-live="tps">(\d+)<\/b>/.exec(html);
    assert.ok(m && Number(m[1]) > 0, `Expected dynamic live TPS > 0 in widget, got HTML: ${html.slice(0, 300)}`);
    assert.ok(html.includes("Генерация"), `Expected live Генерация status in widget, got HTML: ${html.slice(0, 300)}`);
  }).finally(() => {
    panel.destroy();
  });
});

test("View Usage localization, GPT/Anthropic quota parsing, and live overlay scraping work accurately", async () => {
  const { doc, win } = createMockDom();

  // 1) Translator & dynamic rules on split React % node + 1-bucket / 2-bucket View Usage + provider headers
  assert.equal(applyDynamicRules("Weekly limit, resets in 6d 9h"), "Недельный лимит, сбросится через 6 д 9 ч");
  assert.equal(applyDynamicRules("5h limit, resets in 2h 15m"), "Лимит (5 ч), сбросится через 2 ч 15 мин");
  assert.equal(applyDynamicRules("Daily limit, resets in <1m"), "Дневной лимит, сбросится через <1 мин");
  assert.equal(applyDynamicRules("resets in 4h 10m"), "Сбросится через 4 ч 10 мин");
  assert.equal(applyDynamicRules("50% left"), "50% осталось");
  assert.equal(applyDynamicRules("Cancel (Ctrl+D)"), "Отмена (Ctrl+D)");
  assert.equal(dictionary["GPT and Anthropic Models"], "Модели GPT и Anthropic");
  assert.equal(dictionary["Anthropic and GPT Models"], "Модели Anthropic и GPT");
  assert.equal(dictionary["5-Hour Limit"], "5-часовой лимит");

  const splitPctSpan = doc.createElement("span");
  const numNode = doc.createTextNode("50");
  const leftNode = doc.createTextNode("% left");
  splitPctSpan.appendChild(numNode);
  splitPctSpan.appendChild(leftNode);
  const singleDetail = doc.createElement("span");
  singleDetail.textContent = "Weekly limit, resets in 6d 9h";
  const gptHeader = doc.createElement("div");
  gptHeader.textContent = "GPT and Anthropic Models";
  doc.body.appendChild(gptHeader);
  doc.body.appendChild(splitPctSpan);
  doc.body.appendChild(singleDetail);

  const translator = createDomTranslator({ document: doc, window: win, dictionary, applyDynamicRules, initialLocale: "ru" });
  translator.init();
  assert.equal(gptHeader.textContent, "Модели GPT и Anthropic");
  assert.equal(splitPctSpan.textContent, "50% осталось");
  assert.equal(singleDetail.textContent, "Недельный лимит, сбросится через 6 д 9 ч");

  // Simulate React updating live percentage node from 50 -> 42, then toggling EN -> RU
  numNode.nodeValue = "42";
  translator.translateDocument();
  assert.equal(splitPctSpan.textContent, "42% осталось");
  translator.setLocale("en");
  assert.equal(splitPctSpan.textContent, "42% left", "Locale restore must keep live 42% instead of stale initial 50%");
  translator.setLocale("ru");
  assert.equal(splitPctSpan.textContent, "42% осталось");

  // 2) parseQuotaFromDocumentText on View Usage & Settings layouts
  const vuRu1Bucket = parseQuotaFromDocumentText([
    "Использование",
    "Модели Gemini",
    "Лимит (5 ч) 80% осталось",
    "Сбросится через 2 ч 15 мин",
    "Недельный лимит 32% осталось",
    "Сбросится через 6 д 5 ч",
    "Модели Claude и GPT 50% осталось",
    "Недельный лимит, сбросится через 6 д 9 ч",
  ].join("\n"), "Gemini 4 Neon");
  assert.deepEqual(vuRu1Bucket, {
    gemini: { fiveHourRem: 80, weeklyRem: 32, fiveHourReset: "2 ч 15 мин", weeklyReset: "6 д 5 ч" },
    claudeGpt: { fiveHourRem: null, weeklyRem: 50, fiveHourReset: "", weeklyReset: "6 д 9 ч" },
  });

  const vuRu2BucketGptAnthropic = parseQuotaFromDocumentText([
    "Usage",
    "Gemini Models",
    "5h limit 90% left",
    "Resets in 4h 30m",
    "Weekly limit 60% left",
    "Resets in 5d 2h",
    "GPT and Anthropic Models",
    "5h limit 75% left",
    "Resets in 3h 10m",
    "Weekly limit 48% left",
    "Resets in 6d 1h",
  ].join("\n"), "Claude Opus");
  assert.deepEqual(vuRu2BucketGptAnthropic, {
    gemini: { fiveHourRem: 90, weeklyRem: 60, fiveHourReset: "4h 30m", weeklyReset: "5d 2h" },
    claudeGpt: { fiveHourRem: 75, weeklyRem: 48, fiveHourReset: "3h 10m", weeklyReset: "6d 1h" },
  });

  // Regression check: "через 6 дней 5 часов" inside weekly sentence must NOT trigger 5-hour boundary and steal 80%!
  const settingsRu = parseQuotaFromDocumentText([
    "Модели и использование",
    "Модели Gemini",
    "Остаток 5-часового лимита",
    "Вы израсходовали часть 5-часового лимита — полное обновление через 2 часа 15 минут.",
    "80%",
    "Остаток недельного лимита",
    "Вы израсходовали часть недельного лимита — полное обновление через 6 дней 5 часов.",
    "32%",
    "Модели Claude и GPT",
    "Остаток недельного лимита",
    "Вы израсходовали часть недельного лимита — полное обновление через 6 дней 9 часов.",
    "50%",
  ].join("\n"), "Gemini 4");
  assert.deepEqual(settingsRu, {
    gemini: { fiveHourRem: 80, weeklyRem: 32, fiveHourReset: "2 часа 15 минут", weeklyReset: "6 дней 5 часов" },
    claudeGpt: { fiveHourRem: null, weeklyRem: 50, fiveHourReset: "", weeklyReset: "6 дней 9 часов" },
  });

  // 3) Live .agy-overlay DOM scraping in studio-panel + protection in theme-engine
  const overlay = doc.createElement("div");
  overlay.setAttribute("class", "agy-overlay surface-glass bg-card");
  overlay.getBoundingClientRect = () => ({ left: 400, top: 120, right: 720, bottom: 420, width: 320, height: 300 });

  const gHead = doc.createElement("div");
  gHead.textContent = "Модели Gemini";
  const gRow5 = doc.createElement("div");
  const gLbl5 = doc.createElement("span");
  gLbl5.textContent = "Лимит (5 ч)";
  const gVal5 = doc.createElement("span");
  gVal5.textContent = "85% осталось";
  const gCircle5 = doc.createElement("div");
  gCircle5.setAttribute("data-testid", "quota-progress-circle");
  const gRes5 = doc.createElement("span");
  gRes5.setAttribute("class", "col-span-2");
  gRes5.textContent = "Сбросится через 1 ч 20 мин";
  gRow5.appendChild(gLbl5);
  gRow5.appendChild(gVal5);
  gRow5.appendChild(gCircle5);
  gRow5.appendChild(gRes5);

  const cHead = doc.createElement("div");
  cHead.textContent = "Модели Claude и GPT";
  const cRow = doc.createElement("div");
  const cVal = doc.createElement("span");
  cVal.textContent = "44% осталось";
  const cDisabledZero = doc.createElement("span");
  cDisabledZero.setAttribute("class", "font-semibold invisible");
  cDisabledZero.textContent = "0%";
  const cCircle = doc.createElement("div");
  cCircle.setAttribute("data-testid", "quota-progress-circle");
  const cDet = doc.createElement("span");
  cDet.setAttribute("class", "col-span-2");
  cDet.textContent = "Недельный лимит, сбросится через 5 д 4 ч";
  cRow.appendChild(cVal);
  cRow.appendChild(cDisabledZero);
  cRow.appendChild(cCircle);
  cRow.appendChild(cDet);

  overlay.appendChild(gHead);
  overlay.appendChild(gRow5);
  overlay.appendChild(cHead);
  overlay.appendChild(cRow);
  doc.body.appendChild(overlay);

  const te = createThemeEngine({ document: doc, window: win });
  te.apply({ presetId: "obsidian-glass", wallpaper: { type: "image", mediaUrl: "rudex-media://local/bg.jpg" } });
  assert.equal(overlay.getAttribute("data-rudex-bg-shell"), null, "Theme engine must never strip .agy-overlay background");

  let syncedPayload = null;
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      invoke: async (ch, payload) => {
        if (ch === "agy-studio:sync-quota-snapshot") {
          syncedPayload = payload;
          return { ok: true, summary: { families: { gemini: payload.gemini, claudeGpt: payload.claudeGpt }, chats: [] } };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: te,
  });
  try {
    panel.init();
    panel.pollStream();
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(syncedPayload, "View Usage .agy-overlay must be scraped automatically on pollStream()");
    assert.equal(syncedPayload.gemini.fiveHourRem, 85);
    assert.equal(syncedPayload.gemini.fiveHourReset, "1 ч 20 мин");
    assert.equal(syncedPayload.claudeGpt.weeklyRem, 44);
    assert.equal(syncedPayload.claudeGpt.weeklyReset, "5 д 4 ч");
  } finally {
    panel.destroy();
    te.destroy();
    translator.destroy();
  }
});

// =============================================================================
// 11. Dynamic Skill Auto-Updater Core & UI Tests
// =============================================================================
test("Updater core evaluates semver/commit updates, reads ZIP EOCD SHA comments, and checks releases with ETag 304 + fallback", async () => {
  // 1) Version & commit comparisons
  const rSemver = evaluateUpdateAvailability(
    { version: "4.0.0", commitSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    { version: "4.1.0", commitSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }
  );
  assert.equal(rSemver.available, true);
  assert.equal(rSemver.reason, "version");

  const rCommitNewer = evaluateUpdateAvailability(
    { version: "4.1.0", commitSha: "1111111111111111111111111111111111111111", commitDate: "2026-11-24T17:00:00Z" },
    { version: "4.1.0", commitSha: "2222222222222222222222222222222222222222", commitDate: "2026-11-24T18:00:00Z" }
  );
  assert.equal(rCommitNewer.available, true);
  assert.equal(rCommitNewer.reason, "commit");

  const rSame = evaluateUpdateAvailability(
    { version: "4.1.0", commitSha: "2222222222222222222222222222222222222222" },
    { version: "4.1.0", commitSha: "2222222222222222222222222222222222222222" }
  );
  assert.equal(rSame.available, false);
  assert.equal(rSame.reason, "up-to-date");

  const rLocalAhead = evaluateUpdateAvailability(
    { version: "4.1.0", commitSha: "3333333333333333333333333333333333333333", commitDate: "2026-11-24T20:00:00Z" },
    { version: "4.1.0", commitSha: "2222222222222222222222222222222222222222", commitDate: "2026-11-24T18:00:00Z" }
  );
  assert.equal(rLocalAhead.available, false);
  assert.equal(rLocalAhead.reason, "local-newer");

  // 2) Git HEAD metadata helper reads real repo HEAD
  const gitMeta = readGitHeadMeta(REPO_ROOT);
  assert.match(gitMeta.commitSha, /^[0-9a-f]{40}$/);

  // 3) ZIP EOCD comment SHA extraction
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-zip-comment-"));
  try {
    const zipPath = path.join(tmpDir, "archive.zip");
    const baseZip = createZipBuffer([{ name: "README.md", data: Buffer.from("# Rudex\n", "utf8") }]);
    const commentSha = "46e3eae414b1caa07842250fc9fb207a358a569e";
    const commentBuf = Buffer.from(commentSha, "utf8");
    const eocdIdx = baseZip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    assert.ok(eocdIdx >= 0);
    const outZip = Buffer.concat([baseZip.subarray(0, eocdIdx + 20), Buffer.alloc(2), commentBuf]);
    outZip.writeUInt16LE(commentBuf.length, eocdIdx + 20);
    fs.writeFileSync(zipPath, outZip);

    const extracted = readZipEocdComment(zipPath);
    assert.equal(extracted, commentSha);
    assert.equal(extractCommitShaFromText(extracted), commentSha);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 4) HTTP mock server: 200 -> 304 ETag reuse -> 403 commit API fallback to manifest
  let mode = "ok";
  const srv = http.createServer((req, res) => {
    if (req.url === "/plugin.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ name: "rudex", version: mode === "fallback" ? "4.2.0" : "4.1.0" }));
      return;
    }
    if (req.url === "/commit") {
      if (mode === "fallback") {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "API rate limit exceeded" }));
        return;
      }
      if (req.headers["if-none-match"] === '"etag-v1"') {
        res.writeHead(304, { ETag: '"etag-v1"' });
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json", ETag: '"etag-v1"' });
      res.end(JSON.stringify({
        sha: "abcdef0123456789abcdef0123456789abcdef01",
        html_url: "https://github.com/Ivan0967pro/Rudex/commit/abcdef0",
        commit: {
          message: "feat: dynamic updater\n\nbody line",
          committer: { date: "2026-11-24T20:00:00Z" },
        },
      }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
  try {
    const port = srv.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    const r1 = await checkRemoteRelease({ manifestUrl: `${baseUrl}/plugin.json`, commitApiUrl: `${baseUrl}/commit` });
    assert.equal(r1.ok, true);
    assert.equal(r1.etag, '"etag-v1"');
    assert.equal(r1.remote.version, "4.1.0");
    assert.equal(r1.remote.commitShort, "abcdef0");
    assert.equal(r1.remote.commitMessage, "feat: dynamic updater");

    const r2 = await checkRemoteRelease({
      manifestUrl: `${baseUrl}/plugin.json`,
      commitApiUrl: `${baseUrl}/commit`,
      prevEtag: r1.etag,
      prevRemote: r1.remote,
    });
    assert.equal(r2.ok, true);
    assert.equal(r2.remote.commitSha, r1.remote.commitSha);

    mode = "fallback";
    const r3 = await checkRemoteRelease({
      manifestUrl: `${baseUrl}/plugin.json`,
      commitApiUrl: `${baseUrl}/commit`,
      prevEtag: r1.etag,
      prevRemote: r1.remote,
    });
    assert.equal(r3.ok, true);
    assert.equal(r3.remote.version, "4.2.0");
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
});

test("Studio update popup and Settings -> Language & System update controls handle available, dismiss, progress, and install flows", async () => {
  const { doc, win } = createMockDom();
  const translator = createDomTranslator({
    document: doc,
    window: win,
    dictionary,
    applyDynamicRules,
    initialLocale: "ru",
  });
  translator.init();

  const ipcCalls = [];
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      invoke: async (ch, payload) => {
        ipcCalls.push({ ch, payload });
        if (ch === "agy-studio:get-state") {
          return { locale: "ru", settings: { autoCheckUpdates: true, thinkingInRussian: false } };
        }
        if (ch === "agy-studio:get-update-state") {
          return {
            status: "idle",
            available: false,
            dismissed: false,
            installed: { version: "4.0.0", commitSha: "1111111", commitShort: "1111111" },
            remote: null,
          };
        }
        if (ch === "agy-studio:install-update") {
          return { ok: true };
        }
        if (ch === "agy-studio:dismiss-update") {
          return {
            status: "available",
            available: true,
            dismissed: true,
            updateKey: "4.1.0:2222222",
            installed: { version: "4.0.0", commitShort: "1111111" },
            remote: { version: "4.1.0", commitShort: "2222222", commitMessage: "Новый автообновлятор" },
          };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: createThemeEngine({ document: doc, window: win }),
  });

  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 20));

    const host = doc.getElementById("rudex-studio-host");
    const rootEl = host.shadowRoot.querySelector(".studio-root");
    const toastMount = host.shadowRoot.querySelector(".update-toast-mount");
    assert.ok(toastMount, "Update toast mount must exist inside Studio shadowRoot");
    assert.equal(toastMount.innerHTML, "", "Toast must remain hidden when no update is available");

    panel.applyUpdateStatus({
      status: "available",
      available: true,
      dismissed: false,
      updateKey: "4.1.0:2222222",
      installed: { version: "4.0.0", commitShort: "1111111" },
      remote: { version: "4.1.0", commitShort: "2222222", commitMessage: "Новый автообновлятор" },
    });

    assert.ok(toastMount.innerHTML.includes("update-toast"));
    assert.ok(toastMount.innerHTML.includes("v4.0.0 → v4.1.0"));
    assert.ok(toastMount.innerHTML.includes("Обновить"));
    assert.ok(toastMount.innerHTML.includes("Позже"));
    assert.ok(toastMount.innerHTML.includes("Новый автообновлятор"));

    // Open Settings -> Language & System -> verify update card & install button exist
    panel.setOpen(true, { tab: "settings" });
    const modalMount = host.shadowRoot.querySelector(".modal-mount");
    assert.ok(modalMount.innerHTML.includes("Обновления Rudex"));
    assert.ok(modalMount.innerHTML.includes("Обновить и перезапустить"));

    // Click "Позже" -> dismisses toast while Settings still retains update button
    const dismissBtn = doc.createElement("button");
    dismissBtn.setAttribute("data-action", "dismiss-update");
    toastMount.appendChild(dismissBtn);
    rootEl.dispatchEvent({ type: "click", target: dismissBtn });
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(ipcCalls.some((c) => c.ch === "agy-studio:dismiss-update"));
    assert.equal(toastMount.innerHTML, "", "Dismissed toast must hide floating notification");
    assert.ok(modalMount.innerHTML.includes("Обновить и перезапустить"), "Settings still allows installing dismissed update");

    // Re-surface update & click "Обновить"
    panel.applyUpdateStatus({
      status: "available",
      available: true,
      dismissed: false,
      updateKey: "4.1.0:2222222",
      installed: { version: "4.0.0", commitShort: "1111111" },
      remote: { version: "4.1.0", commitShort: "2222222", commitMessage: "Новый автообновлятор" },
    });
    const installBtn = doc.createElement("button");
    installBtn.setAttribute("data-action", "install-update");
    toastMount.appendChild(installBtn);
    rootEl.dispatchEvent({ type: "click", target: installBtn });
    assert.ok(toastMount.innerHTML.includes("update-toast-progress"), "Clicking Update must immediately display download progress");
    assert.ok(ipcCalls.some((c) => c.ch === "agy-studio:install-update"));
  } finally {
    panel.destroy();
    translator.destroy();
  }
});

// =============================================================================
// 12. Live Thinking-Block Translation Engine & DOM Integration Tests
// =============================================================================
test("Thinking translator protects inline code/paths, skips Russian, falls back cleanly, and live-translates/restores Antigravity thinking DOM", async () => {
  assert.equal(needsRussianTranslation("I'm thinking through how to approach this."), true);
  assert.equal(needsRussianTranslation("Я думаю, как решить эту задачу."), false);
  assert.equal(needsRussianTranslation("C:\\Users\\ivanp\\app.js"), false);
  assert.equal(needsRussianTranslation("https://github.com/Ivan0967pro/Rudex"), false);

  const srcLine = "Inspect `studio-panel.js` via `--dry-run` before editing app_config_path.";
  const maskedObj = protectInlineTokens(srcLine);
  assert.equal(maskedObj.tokens.length, 3);
  assert.ok(!maskedObj.masked.includes("studio-panel.js"));
  assert.ok(!maskedObj.masked.includes("--dry-run"));
  assert.ok(!maskedObj.masked.includes("app_config_path"));
  const restored = restoreInlineTokens("Проверьте RUDX0Z через RUDX1Z перед правкой RUDX2Z.", maskedObj.tokens);
  assert.equal(restored, "Проверьте `studio-panel.js` через `--dry-run` перед правкой app_config_path.");

  let mode = "clients5";
  let hits = 0;
  const srv = http.createServer((req, res) => {
    hits += 1;
    const u = new URL(req.url, "http://127.0.0.1");
    if (u.pathname === "/clients5") {
      if (mode === "fallback") {
        res.writeHead(500);
        res.end("ERR");
        return;
      }
      const q = u.searchParams.get("q") || "";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([`RU:${q}`]));
      return;
    }
    if (u.pathname === "/mymemory") {
      const q = u.searchParams.get("q") || "";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ responseStatus: 200, responseData: { translatedText: `MM:${q}` } }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
  try {
    const port = srv.address().port;
    const tt = createThinkingTranslator({
      clients5Url: `http://127.0.0.1:${port}/clients5`,
      myMemoryUrl: `http://127.0.0.1:${port}/mymemory`,
    });

    const b1 = await tt.translateBatch(["Inspect `studio-panel.js` first.", "Уже на русском языке."]);
    assert.ok(b1.translations["Inspect `studio-panel.js` first."].includes("`studio-panel.js`"));
    assert.ok(b1.translations["Inspect `studio-panel.js` first."].startsWith("RU:"));
    assert.equal(b1.translations["Уже на русском языке."], undefined);
    const hitsAfterFirst = hits;

    // Repeated text must be served from LRU cache with 0 extra HTTP requests
    const b2 = await tt.translateBatch(["Inspect `studio-panel.js` first."]);
    assert.equal(hits, hitsAfterFirst);
    assert.equal(b2.translations["Inspect `studio-panel.js` first."], b1.translations["Inspect `studio-panel.js` first."]);

    // When clients5 returns 500, translator falls back seamlessly to MyMemory
    mode = "fallback";
    const b3 = await tt.translateBatch(["Fallback test sentence."]);
    assert.equal(b3.translations["Fallback test sentence."], "MM:Fallback test sentence.");
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }

  // Test DOM scanner + lossless rollback in Antigravity l2 collapsible structure
  const { doc, win } = createMockDom();
  const translator = createDomTranslator({
    document: doc,
    window: win,
    dictionary,
    applyDynamicRules,
    initialLocale: "ru",
  });
  translator.init();

  const resp = doc.createElement("div");
  resp.setAttribute("data-testid", "agent-response");
  const wrap = doc.createElement("div");
  wrap.setAttribute("class", "relative");
  const headerRow = doc.createElement("div");
  headerRow.setAttribute("class", "flex min-w-0 items-center");
  const trigger = doc.createElement("button");
  trigger.setAttribute("type", "button");
  trigger.setAttribute("data-testid", "thinking-collapsible-trigger");
  trigger.setAttribute("aria-expanded", "true");
  trigger.setAttribute("aria-label", "Thought for 6s");
  headerRow.appendChild(trigger);

  const panelBox = doc.createElement("div");
  panelBox.setAttribute("class", "overflow-y-auto bleed-contain pl-3 pt-0.5");
  const para = doc.createElement("p");
  const enNode = doc.createTextNode("I'm thinking through how to approach ");
  const codeEl = doc.createElement("code");
  codeEl.textContent = "studio-panel.js";
  const tailNode = doc.createTextNode(" and keep latency low.");
  para.appendChild(enNode);
  para.appendChild(codeEl);
  para.appendChild(tailNode);
  panelBox.appendChild(para);
  wrap.appendChild(headerRow);
  wrap.appendChild(panelBox);
  resp.appendChild(wrap);
  doc.body.appendChild(resp);

  const translateCalls = [];
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      invoke: async (ch, payload) => {
        if (ch === "agy-studio:get-state") {
          return { locale: "ru", settings: { thinkingInRussian: true } };
        }
        if (ch === "agy-studio:translate-thinking-batch") {
          translateCalls.push(payload.texts);
          const map = {};
          for (const txt of payload.texts) {
            if (txt.includes("thinking through")) map[txt] = "Я обдумываю, как подойти к задаче";
            else if (txt.includes("keep latency low")) map[txt] = "и сохранить низкую задержку.";
          }
          return { ok: true, translations: map };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: createThemeEngine({ document: doc, window: win }),
  });

  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 40));

    assert.ok(translateCalls.length >= 1, "Live DOM scanner must batch-translate expanded thinking block");
    assert.equal(enNode.nodeValue, "Я обдумываю, как подойти к задаче ");
    assert.equal(codeEl.textContent, "studio-panel.js", "Inline <code> tags inside thinking block must remain untouched");
    assert.equal(tailNode.nodeValue, " и сохранить низкую задержку.");

    // Turn thinkingInRussian OFF -> losslessly restores original English text nodes
    panel.applyRemoteState({ locale: "ru", settings: { thinkingInRussian: false } }, false);
    assert.equal(enNode.nodeValue, "I'm thinking through how to approach ");
    assert.equal(tailNode.nodeValue, " and keep latency low.");
  } finally {
    panel.destroy();
    translator.destroy();
  }
});

// =============================================================================
// 13. Antigravity Update Survival (3-Layer Auto-Repatch & On-Exit Activator)
// =============================================================================
test("Antigravity update survival: versionGuard auto-repatches, updater.js hooks quitAndInstall, and rudex-hook.js auto-recovers stripped resources/app", async () => {
  // 1) patchMainJs emits synchronous spawnSync auto-repatch in versionGuard with .rudex-outdated-* fallback
  const minMain = [
    `"use strict";`,
    `const menu_1 = require("./menu");`,
    `const electron_1 = require("electron");`,
    `    const ipc = (0, ipcHandlers_1.registerIpcHandlers)(storageManager, {`,
  ].join("\n");
  const patchedMain = patchMainJs(minMain, "44.9.1", []);
  assert.ok(patchedMain.includes('"--no-sync-plugin"'), "versionGuard must auto-repatch with --no-sync-plugin when app version changes");
  assert.ok(patchedMain.includes(".rudex-outdated-"), "versionGuard must retain safe fallback if auto-repatch cannot complete");

  // 2) patchUpdaterJs wires schedulePostAppUpdateRepatch() into both quitAndInstall branches cleanly with 0 warnings
  const mockUpdaterSrc = [
    `const utils_1 = require("./utils");`,
    `exports.updateActions = {`,
    `    [MenuUpdateStep.CheckForUpdates]: () => checkForUpdates(true),`,
    `    [MenuUpdateStep.CheckingForUpdates]: undefined,`,
    `    [MenuUpdateStep.DownloadingUpdate]: undefined,`,
    `    [MenuUpdateStep.RestartToUpdate]: () => void quitAndInstall(),`,
    `};`,
    `function updateMenuState(step) {`,
    `    const menu = electron_1.Menu.getApplicationMenu();`,
    `    if (menu) {`,
    `        const item = menu.getMenuItemById('check-for-updates');`,
    `        if (item) {`,
    `            item.label = step;`,
    `            item.enabled = exports.updateActions[step] !== undefined;`,
    `        }`,
    `    }`,
    `}`,
    `function showNoUpdates() {`,
    `            const options = {`,
    `                type: 'info',`,
    `                title: 'Check for Updates',`,
    `                message: 'No updates available',`,
    `                buttons: ['OK'],`,
    `            };`,
    `}`,
    `async function quitAndInstall(isSilent = false) {`,
    `    if (process.platform === 'win32' && updater.installerPath) {`,
    `        try {`,
    `            const { killLanguageServer } = await Promise.resolve().then(() => __importStar(require('./languageServer')));`,
    `            await killLanguageServer();`,
    `            electron_updater_1.autoUpdater.quitAndInstall(isSilent, true);`,
    `        } finally {}`,
    `        return;`,
    `    }`,
    `    electron_updater_1.autoUpdater.quitAndInstall(isSilent, true);`,
    `}`,
    `exports.applyHostUpdate = applyHostUpdate;`,
  ].join("\n");
  const updWarnings = [];
  const patchedUpd = patchUpdaterJs(mockUpdaterSrc, updWarnings);
  assert.equal(updWarnings.length, 0, "patchUpdaterJs must succeed with 0 warnings: " + updWarnings.join("; "));
  const hookMatches = patchedUpd.match(/schedulePostAppUpdateRepatch/g) || [];
  assert.ok(hookMatches.length >= 2, "Both quitAndInstall paths must invoke schedulePostAppUpdateRepatch()");

  // 3) writeOnExitActivateCmd generates a safe passive watcher (never taskkill, guarded before deleting app.asar)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-survive-test-"));
  try {
    const mockResDir = path.join(tmpDir, "antigravity", "resources");
    const mockAppRoot = path.dirname(mockResDir);
    const mockPluginDir = path.join(tmpDir, "plugin-rudex");
    const mockUserData = path.join(tmpDir, "userData");
    const markerFile = path.join(tmpDir, "repatch-called.txt");
    fs.mkdirSync(mockResDir, { recursive: true });
    fs.mkdirSync(path.join(mockPluginDir, "skills", "rudex", "scripts"), { recursive: true });
    fs.mkdirSync(mockUserData, { recursive: true });

    if (process.platform === "win32") {
      const cmdPath = path.join(tmpDir, "on-exit.cmd");
      const lockPath = path.join(tmpDir, "on-exit.lock");
      const out = writeOnExitActivateCmd({ resourcesDir: mockResDir }, { outPath: cmdPath, lockPath });
      assert.equal(out, cmdPath);
      const bat = fs.readFileSync(cmdPath, "utf8");
      assert.equal(/taskkill/i.test(bat), false, "Passive on-exit activator must NEVER invoke taskkill");
      assert.ok(bat.includes("rudex-patch-meta.json"), "On-exit activator must verify staged rudex-patch-meta.json");
      assert.ok(bat.includes("app.asar.orig-*"), "On-exit activator must verify clean backup exists before unlinking app.asar");
    }

    // 4) rudex-hook.js auto-repatch recovers stripped resources/app even when all 3 feature flags are OFF
    fs.writeFileSync(path.join(mockAppRoot, "version"), "44.10.0\n", "utf8");
    fs.writeFileSync(path.join(mockResDir, "app.asar"), "STOCK_44_10_ASAR", "utf8");
    fs.writeFileSync(path.join(mockPluginDir, "plugin.json"), '{"name":"rudex","version":"4.3.0"}', "utf8");
    fs.writeFileSync(
      path.join(mockPluginDir, "skills", "rudex", "scripts", "install.js"),
      `"use strict";\nconst fs = require("fs");\nfs.writeFileSync(${JSON.stringify(markerFile)}, JSON.stringify(process.argv.slice(2)), "utf8");\n`,
      "utf8"
    );

    const hookScript = path.join(SCRIPTS_DIR, "rudex-hook.js");
    const r1 = spawnSync(process.execPath, [hookScript], {
      input: JSON.stringify({ hookEventName: "SessionStart", conversationId: "ffff1111-1111-4111-8111-111111111111" }),
      env: Object.assign({}, process.env, {
        AGY_STUDIO_USER_DATA: mockUserData,
        ANTIGRAVITY_RESOURCES_DIR: mockResDir,
        RUDEX_PLUGIN_DIR: mockPluginDir,
        RUDEX_SKIP_AUTO_REPATCH: "0",
      }),
      encoding: "utf8",
    });
    assert.equal(r1.status, 0, r1.stderr);
    const out1 = JSON.parse((r1.stdout || "{}").trim() || "{}");
    assert.ok(Array.isArray(out1.injectSteps) && out1.injectSteps.length === 1, "Hook must report background recovery step");
    assert.ok(out1.injectSteps[0].systemMessage.systemMessage.includes("Восстановление после обновления Antigravity"));
    assert.equal("metadata" in out1.injectSteps[0].systemMessage, false, "Hook injectSteps must stay strict protojson without snake_case metadata");

    // Wait briefly for detached stub installer to write marker file
    for (let i = 0; i < 40 && !fs.existsSync(markerFile); i += 1) {
      await new Promise((r) => setTimeout(r, 25));
    }
    assert.ok(fs.existsSync(markerFile), "Hook must spawn install.js automatically in background");
    const argvRecorded = JSON.parse(fs.readFileSync(markerFile, "utf8"));
    assert.deepEqual(argvRecorded, ["--no-sync-plugin", "--on-exit-activate"]);

    // Second invocation within 10-min cooldown must NOT re-trigger
    fs.unlinkSync(markerFile);
    const r2 = spawnSync(process.execPath, [hookScript], {
      input: JSON.stringify({ hookEventName: "PreInvocation", conversationId: "ffff1111-1111-4111-8111-111111111111" }),
      env: Object.assign({}, process.env, {
        AGY_STUDIO_USER_DATA: mockUserData,
        ANTIGRAVITY_RESOURCES_DIR: mockResDir,
        RUDEX_PLUGIN_DIR: mockPluginDir,
        RUDEX_SKIP_AUTO_REPATCH: "0",
      }),
      encoding: "utf8",
    });
    assert.equal(r2.status, 0, r2.stderr);
    assert.deepEqual(JSON.parse((r2.stdout || "{}").trim() || "{}"), {});
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(fs.existsSync(markerFile), false, "Cooldown must prevent duplicate repatch spawns");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// =============================================================================
// 11. Corner Radii Builder, Advanced Wallpaper Studio & Studio UI Design Tests
// =============================================================================
test("Corner builder supports linked 0px sharp mode, custom per-element radii, and backwards compatibility", () => {
  assert.ok(Array.isArray(CORNER_PRESETS) && CORNER_PRESETS.length >= 6);
  assert.equal(isAppearanceNativeDefault({ radius: 12 }), true);
  assert.equal(isAppearanceNativeDefault({ corners: { mode: "linked", all: 0 } }), false);
  assert.equal(isAppearanceNativeDefault({ corners: { mode: "custom", messages: 18 } }), false);

  const compat = normalizeAppearance({ radius: 16 });
  assert.equal(compat.corners.mode, "linked");
  assert.equal(compat.corners.all, 16);
  assert.equal(compat.corners.messages, 16);

  const sharpCss = buildThemeCss({
    presetId: "native",
    corners: { mode: "linked", all: 0 },
  }, { hostIsLight: false });
  assert.ok(sharpCss.includes("--radius: 0px !important;"));
  assert.ok(sharpCss.includes("--radius-lg: 0px !important;"));
  assert.ok(sharpCss.includes("border-radius: 0px !important;"));
  assert.ok(sharpCss.includes(':not([role="switch"])'), "Must protect switches from radius override");

  const customCss = buildThemeCss({
    presetId: "tokyo-night",
    corners: {
      mode: "custom",
      all: 12,
      messages: 22,
      composer: 24,
      buttons: 4,
      cards: 16,
      code: 2,
      sidebar: 8,
      overlays: 20,
      inputs: 6,
    },
  }, { hostIsLight: false });
  assert.ok(customCss.includes('[data-testid="user-message-bubble"]'));
  assert.ok(customCss.includes("border-radius: 22px !important;"));
  assert.ok(customCss.includes("border-radius: 24px !important;"));
  assert.ok(customCss.includes("border-radius: 4px !important;"));
  assert.ok(customCss.includes("border-radius: 16px !important;"));
  assert.ok(customCss.includes("border-radius: 2px !important;"));
  assert.ok(customCss.includes("border-radius: 8px !important;"));
  assert.ok(customCss.includes("border-radius: 20px !important;"));
  assert.ok(customCss.includes("border-radius: 6px !important;"));
  const resolved = teResolveCornerRadii({ corners: { mode: "custom", code: 10 } });
  assert.equal(resolved.inlineCode, 5);
});

test("Advanced wallpaper studio applies framing, transforms, grading, vignette, mesh gradient and spares browser hole", () => {
  const { doc, win } = createMockDom();
  const hole = doc.createElement("div");
  hole.setAttribute("data-browser-hole", "true");
  hole.getBoundingClientRect = () => ({ left: 300, top: 80, right: 1100, bottom: 780, width: 800, height: 700 });
  hole.style.backgroundColor = "rgb(10, 10, 14)";
  doc.body.appendChild(hole);

  const te = createThemeEngine({ document: doc, window: win });
  try {
    te.apply({
      presetId: "sakura-dusk",
      wallpaper: {
        type: "image",
        mediaUrl: "agy-media://local/sakura.png",
        fit: "contain",
        posX: 25,
        posY: 75,
        offsetX: 12,
        offsetY: -8,
        scale: 150,
        rotate: 90,
        flipX: true,
        flipY: false,
        brightness: 112,
        contrast: 120,
        saturate: 135,
        hue: 15,
        blur: 6,
        vignette: 45,
        tintEnabled: true,
        tintOpacity: 30,
        tintBlend: "soft-light",
      },
    });

    assert.equal(hole.getAttribute("data-rudex-bg-shell"), null, "[data-browser-hole] must never be masked as wallpaper shell");
    const bg = doc.getElementById("rudex-bg");
    assert.ok(bg);
    const img = bg.querySelector("img");
    assert.equal(img.style.objectFit, "contain");
    assert.equal(img.style.objectPosition, "25% 75%");
    assert.ok(img.style.transform.includes("translate3d(12%, -8%, 0)"));
    assert.ok(img.style.transform.includes("rotate(90deg)"));
    assert.ok(img.style.transform.includes("scale(-1.50, 1.50)"));
    assert.ok(img.style.filter.includes("brightness(112%)"));
    assert.ok(img.style.filter.includes("contrast(120%)"));
    assert.ok(img.style.filter.includes("hue-rotate(15deg)"));
    const tint = bg.querySelector('[data-role="bg-tint"]');
    assert.equal(tint.style.mixBlendMode, "soft-light");
    const vig = bg.querySelector('[data-role="bg-vignette"]');
    assert.ok(vig && vig.style.backgroundImage.includes("radial-gradient"));

    te.apply({
      presetId: "native",
      wallpaper: {
        type: "video",
        mediaUrl: "agy-media://local/loop.mp4",
        playbackRate: 0.5,
        scale: 80,
      },
    });
    const vid = doc.getElementById("rudex-bg").querySelector("video");
    assert.ok(vid);
    assert.equal(vid.playbackRate, 0.5);
    assert.ok(vid.style.transform.includes("scale(0.80)"));

    const meshCss = te.apply({
      presetId: "native",
      wallpaper: {
        type: "gradient",
        gradStyle: "mesh",
        gradColors: ["#111111", "#222222", "#333333"],
      },
    });
    assert.equal(meshCss.wallpaper.gradStyle, "mesh");
  } finally {
    te.destroy();
  }
});

test("Redesigned Studio UI exposes window themes/layouts, mini widget designs, wallpaper stage, corners builder, and backend sanitizer", () => {
  const css = buildStudioStyles();
  for (const tok of [
    '[data-studio-theme="frosted"]',
    '[data-studio-theme="neon-cyber"]',
    '[data-studio-theme="minimal-mono"]',
    '[data-studio-theme="aurora"]',
    '[data-studio-layout="rail"]',
    '[data-studio-layout="topbar"]',
    '[data-studio-layout="floating-glass"]',
    '[data-widget-theme="island"]',
    '[data-widget-theme="neon"]',
    '[data-widget-theme="minimal"]',
    '[data-widget-theme="solid"]',
    ".wp-stage-canvas",
    ".corners-preview-stage",
  ]) {
    assert.ok(css.includes(tok), `Missing Studio design token/selector: ${tok}`);
  }

  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, dictionary, applyDynamicRules, initialLocale: "ru" });
  translator.init();

  const savedPatches = [];
  const ipcMock = {
    invoke: async (ch, payload) => {
      if (ch === "agy-studio:get-state") {
        return {
          locale: "ru",
          settings: {
            viewMode: "mini",
            studioUi: { windowTheme: "neon-cyber", windowLayout: "topbar", widgetTheme: "island", widgetScale: "lg", studioRadius: 20 },
          },
        };
      }
      if (ch === "agy-studio:save-settings") {
        savedPatches.push(payload);
        return { ok: true, settings: payload };
      }
      if (ch === "agy-studio:list-media") {
        return { ok: true, items: [{ fileName: "bg.png", mediaUrl: "agy-media://local/bg.png", mime: "image/png", kind: "image", sizeBytes: 1024 }] };
      }
      return { ok: true };
    },
  };

  const te = createThemeEngine({ document: doc, window: win });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: ipcMock,
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: te,
  });

  try {
    panel.init();
    panel.setOpen(true, { tab: "appearance", appSubTab: "corners", dockedRight: false });
    const host = doc.getElementById("rudex-studio-host");
    const root = host.shadowRoot.querySelector(".studio-root");
    const modalMount = host.shadowRoot.querySelector(".modal-mount");
    assert.ok(modalMount.innerHTML.includes("corners-preview-stage"), "Appearance -> Corners must render interactive preview stage");
    assert.ok(modalMount.innerHTML.includes('data-action="set-corners-mode"'), "Appearance -> Corners must allow linked vs custom mode");

    panel.setOpen(true, { tab: "appearance", appSubTab: "wallpaper", dockedRight: false });
    const wpHtml = modalMount.innerHTML;
    assert.ok(wpHtml.includes('data-action="set-wallpaper-type"'), "Appearance -> Wallpaper must render mode switcher");

    panel.setOpen(true, { tab: "settings", subTab: "studio" });
    const studioHtml = modalMount.innerHTML;
    assert.ok(studioHtml.includes('data-action="set-studio-theme"'), "Settings -> Window Design must expose studio themes");
    assert.ok(studioHtml.includes('data-action="set-studio-layout"'), "Settings -> Window Design must expose studio layouts");

    // Switch studio theme and layout via UI click (createMockDom stores innerHTML as string)
    const neonBtn = doc.createElement("button");
    neonBtn.setAttribute("data-action", "set-studio-theme");
    neonBtn.setAttribute("data-val", "aurora");
    root.appendChild(neonBtn);
    root.dispatchEvent({ type: "click", target: neonBtn });
    assert.equal(root.getAttribute("data-studio-theme"), "aurora");
    assert.ok(savedPatches.some((p) => p.studioUi && p.studioUi.windowTheme === "aurora"));

    const railBtn = doc.createElement("button");
    railBtn.setAttribute("data-action", "set-studio-layout");
    railBtn.setAttribute("data-val", "rail");
    root.appendChild(railBtn);
    root.dispatchEvent({ type: "click", target: railBtn });
    assert.ok(modalMount.innerHTML.includes('data-studio-layout="rail"'));

    panel.setOpen(true, { tab: "settings", subTab: "widget" });
    const widHtml = modalMount.innerHTML;
    assert.ok(widHtml.includes('data-action="set-widget-theme"'), "Settings -> Mini Window must expose widget themes");
    assert.ok(widHtml.includes('data-action="set-widget-scale"'), "Settings -> Mini Window must expose widget scales");

    // Verify i18n-main.js contains sanitizer tokens for new fields
    const i18nMainText = fs.readFileSync(path.join(SCRIPTS_DIR, "i18n-main.js"), "utf8");
    assert.ok(i18nMainText.includes("VALID_STUDIO_THEMES"));
    assert.ok(i18nMainText.includes("sanitizeStudioUi"));
    assert.ok(i18nMainText.includes("liquid-glass"));
    assert.ok(i18nMainText.includes("tokyo-night"));
    assert.ok(i18nMainText.includes("corners:"));
  } finally {
    panel.destroy();
    te.destroy();
    translator.destroy();
  }
});

// =============================================================================
// 14. Apple Liquid Glass & Resilient Updater Tests (v4.2.0)
// =============================================================================
test("Apple Liquid Glass preset, optical theme CSS, smooth sparkline, and Studio preview-update-toast work cleanly", async () => {
  const lgPreset = THEME_PRESETS.find((p) => p.id === "liquid-glass");
  assert.ok(lgPreset, "liquid-glass preset must exist in THEME_PRESETS");

  const norm = normalizeAppearance({ presetId: "liquid-glass", glassOpacity: 15, sidebarOpacity: 15, glassBlur: 36 });
  assert.equal(norm.glassOpacity, 15);
  assert.equal(norm.sidebarOpacity, 15);
  assert.equal(norm.glassBlur, 36);

  const lgCss = buildThemeCss({ presetId: "liquid-glass", glassOpacity: 38, glassBlur: 28 }, { hostIsLight: false });
  assert.ok(lgCss.includes("saturate(195%)"), "Liquid Glass theme CSS must emit high-saturation optical backdrop-filter");
  assert.ok(lgCss.includes("linear-gradient(155deg,"), "Liquid Glass theme CSS must emit specular lens gradient");
  assert.ok(lgCss.includes("radial-gradient("), "Liquid Glass theme without wallpaper must supply deep ambient backdrop");

  const studioCss = buildStudioStyles();
  for (const tok of [
    "#070708",
    "#15151a",
    "#252527",
    ".med-telemetry-stage",
    ".med-quota-card",
    ".med-status-badge",
    ".pill-actions",
    ".preview-stage",
  ]) {
    assert.ok(studioCss.includes(tok), `Missing refined Studio CSS token: ${tok}`);
  }
  assert.equal(GRADIENT_PRESETS[0].id, "antigravity", "Default gradient preset must be native Antigravity");
  assert.deepEqual(GRADIENT_PRESETS[0].colors, ["#15151a", "#0d0d11", "#070708"]);
  assert.equal(studioCss.includes(".mini-pill::before"), false, "White pseudo-border on mini-pill must be removed");
  assert.equal(studioCss.includes(".med-card::before"), false, "White pseudo-border on med-card must be removed");

  const skillMdText = fs.readFileSync(path.join(SKILL_DIR, "SKILL.md"), "utf8");
  assert.ok(skillMdText.includes("Основные функции скилла"), "SKILL.md must include core features overview");
  assert.equal(skillMdText.includes("live agent supplements"), false, "SKILL.md must not mention removed supplements feature");

  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, dictionary, applyDynamicRules, initialLocale: "ru" });
  translator.init();
  const ipcCalls = [];
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      invoke: async (ch) => {
        ipcCalls.push(ch);
        if (ch === "agy-studio:get-state") return { locale: "ru", settings: { viewMode: "medium" } };
        if (ch === "agy-studio:get-update-state") {
          return { status: "up-to-date", available: false, dismissed: false, installed: { version: "4.3.0", commitShort: "abcdef1" }, remote: null };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: createThemeEngine({ document: doc, window: win }),
  });

  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 20));
    const host = doc.getElementById("rudex-studio-host");
    const root = host.shadowRoot.querySelector(".studio-root");
    const widgetWrap = host.shadowRoot.querySelector(".widget-wrap");
    assert.ok(widgetWrap.innerHTML.includes("med-telemetry-stage"), "Medium card must render unified telemetry stage");
    assert.ok(widgetWrap.innerHTML.includes("med-quota-card"), "Medium card must render glass quota card");
    assert.ok(widgetWrap.innerHTML.includes("pill-actions"), "Widget must retain clean pill-actions separation");
    assert.equal(widgetWrap.innerHTML.includes("toggle-live-edit"), false, "Supplements bolt button must be removed from widget");
    assert.ok(widgetWrap.innerHTML.includes(" C"), "Sparkline SVG must use smooth cubic Bezier curves");

    panel.setOpen(true, { tab: "settings", subTab: "system" });
    const modalMount = host.shadowRoot.querySelector(".modal-mount");
    assert.equal(modalMount.innerHTML.includes('data-tab="live-edits"'), false, "Supplements tab must be removed from Studio sidebar");
    assert.equal(modalMount.innerHTML.includes("Ctrl + Alt + E"), false, "Supplements hotkey must be removed from System settings");
    assert.ok(modalMount.innerHTML.includes('data-action="preview-update-toast"'), "System settings must expose update toast preview button");

    const prevBtn = doc.createElement("button");
    prevBtn.setAttribute("data-action", "preview-update-toast");
    root.appendChild(prevBtn);
    root.dispatchEvent({ type: "click", target: prevBtn });

    const toastMount = host.shadowRoot.querySelector(".update-toast-mount");
    assert.ok(toastMount.innerHTML.includes("update-toast"), "Test toast button must display Liquid Glass update toast preview");

    const closeBtn = doc.createElement("button");
    closeBtn.setAttribute("data-action", "dismiss-update");
    toastMount.appendChild(closeBtn);
    root.dispatchEvent({ type: "click", target: closeBtn });
    assert.equal(toastMount.innerHTML, "", "Dismissing preview toast must hide it cleanly");
    assert.equal(ipcCalls.includes("agy-studio:dismiss-update"), false, "Dismissing preview toast must NOT persist snooze to disk");
  } finally {
    panel.destroy();
    translator.destroy();
  }
});

test("Updater core parses GitHub Atom feed, bypasses cache on force check, and falls back to Atom on API 403", async () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <entry>
      <id>tag:github.com,2008:Grit::Commit/99887766554433221100ffeeddccbbaa11223344</id>
      <link type="text/html" rel="alternate" href="https://github.com/Ivan0967pro/Rudex/commit/99887766554433221100ffeeddccbbaa11223344"/>
      <title>feat(ui): Liquid Glass &amp; Atom fallback</title>
      <updated>2026-11-24T22:30:00Z</updated>
    </entry>
  </feed>`;
  const parsed = parseGithubAtomFeed(sampleXml);
  assert.ok(parsed);
  assert.equal(parsed.commitSha, "99887766554433221100ffeeddccbbaa11223344");
  assert.equal(parsed.commitShort, "9988776");
  assert.equal(parsed.commitMessage, "feat(ui): Liquid Glass & Atom fallback");
  assert.equal(parsed.commitDate, "2026-11-24T22:30:00Z");

  let sawCacheBust = false;
  let sawEtagHeaderOnBypass = false;
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, "http://127.0.0.1");
    if (u.pathname === "/plugin.json") {
      if (u.searchParams.has("t")) sawCacheBust = true;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ name: "rudex", version: "4.2.0" }));
      return;
    }
    if (u.pathname === "/commit") {
      if (req.headers["if-none-match"]) sawEtagHeaderOnBypass = true;
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "API rate limit exceeded" }));
      return;
    }
    if (u.pathname === "/commits.atom") {
      res.writeHead(200, { "Content-Type": "application/atom+xml" });
      res.end(sampleXml);
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
  try {
    const port = srv.address().port;
    const base = `http://127.0.0.1:${port}`;
    const res = await checkRemoteRelease({
      manifestUrl: `${base}/plugin.json`,
      commitApiUrl: `${base}/commit`,
      atomFeedUrl: `${base}/commits.atom`,
      prevEtag: '"old-etag"',
      bypassCache: true,
    });
    assert.equal(res.ok, true);
    assert.equal(sawCacheBust, true, "bypassCache must append cache-busting query param to manifestUrl");
    assert.equal(sawEtagHeaderOnBypass, false, "bypassCache must not send stale If-None-Match");
    assert.equal(res.remote.version, "4.2.0");
    assert.equal(res.remote.commitSha, "99887766554433221100ffeeddccbbaa11223344");
    assert.equal(res.remote.commitMessage, "feat(ui): Liquid Glass & Atom fallback");
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
});

// =============================================================================
// 16. Independent App/Studio/Widget Scaling, Pinned Hold-Resize & Deduplication (v4.3.0)
// =============================================================================
test("Independent app/studio/widget scaling, pinned hold-to-resize, zoom compensation, and deduplicated settings work cleanly", async () => {
  const { doc, win } = createMockDom();
  const winListeners = new Map();
  win.addEventListener = (type, fn) => {
    if (!winListeners.has(type)) winListeners.set(type, new Set());
    winListeners.get(type).add(fn);
  };
  win.removeEventListener = (type, fn) => {
    if (winListeners.has(type)) winListeners.get(type).delete(fn);
  };
  win.dispatchEvent = (ev) => {
    const set = winListeners.get(ev && ev.type);
    if (set) for (const fn of set) fn(ev);
    return true;
  };

  const translator = createDomTranslator({ document: doc, window: win, dictionary, applyDynamicRules, initialLocale: "ru" });
  translator.init();

  const savedPatches = [];
  const ipcMock = {
    invoke: async (ch, payload) => {
      if (ch === "agy-studio:get-state") {
        return {
          locale: "ru",
          appZoomSupported: true,
          settings: {
            pinned: false,
            viewMode: "mini",
            studioUi: { appScale: 125, studioScale: 100, widgetZoom: 100, widgetScale: "md" },
          },
        };
      }
      if (ch === "agy-studio:save-settings") {
        savedPatches.push(payload);
        return { ok: true, appZoomSupported: true, settings: payload };
      }
      return { ok: true };
    },
  };

  const te = createThemeEngine({ document: doc, window: win });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: ipcMock,
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: te,
  });

  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 10));

    const host = doc.getElementById("rudex-studio-host");
    const root = host.shadowRoot.querySelector(".studio-root");
    const widgetMount = host.shadowRoot.querySelector(".widget-wrap");
    const modalMount = host.shadowRoot.querySelector(".modal-mount");

    // Verify zoom compensation when appZoomSupported=true & appScale=125: studioZoom = 1/1.25 = 0.8
    assert.equal(root.style.getPropertyValue("--rx-studio-zoom"), "0.8000");
    assert.equal(root.style.getPropertyValue("--rx-widget-zoom"), "0.8000");

    // Verify Appearance -> Corners does NOT duplicate studioRadius, while Settings -> Window Design exposes both studioRadius & studioScale
    panel.setOpen(true, { tab: "appearance", appSubTab: "corners", dockedRight: false });
    assert.equal(modalMount.innerHTML.includes('data-app-field="studioUi.studioRadius"'), false, "Corners must NOT duplicate studioUi.studioRadius");
    assert.ok(modalMount.innerHTML.includes('data-studio-resize="1"'), "Studio modal must render corner resize grip");

    panel.setOpen(true, { tab: "settings", subTab: "studio" });
    assert.ok(modalMount.innerHTML.includes('data-app-field="studioUi.studioRadius"'), "Studio Design must expose studioRadius");
    assert.ok(modalMount.innerHTML.includes('data-app-field="studioUi.studioScale"'), "Studio Design must expose studioScale");
    assert.equal(modalMount.innerHTML.includes('btn-ghost" data-action="open-studio-design"'), false, "Settings header must not duplicate open-studio-design button");

    panel.setOpen(true, { tab: "settings", subTab: "system" });
    assert.ok(modalMount.innerHTML.includes('data-app-field="studioUi.appScale"'), "System settings must expose appScale slider");
    assert.ok(modalMount.innerHTML.includes('data-action="set-app-scale"'), "System settings must expose appScale presets");

    panel.setOpen(true, { tab: "settings", subTab: "widget" });
    assert.ok(modalMount.innerHTML.includes('data-app-field="studioUi.widgetZoom"'), "Widget settings must expose smooth widgetZoom slider");

    // Verify step-scale works for studioScale & appScale & widgetZoom
    const stepStudio = doc.createElement("button");
    stepStudio.setAttribute("data-action", "step-scale");
    stepStudio.setAttribute("data-target", "studioScale");
    stepStudio.setAttribute("data-delta", "5");
    root.appendChild(stepStudio);
    root.dispatchEvent({ type: "click", target: stepStudio });
    assert.ok(savedPatches.some((p) => p.studioUi && p.studioUi.studioScale === 105));

    const stepApp = doc.createElement("button");
    stepApp.setAttribute("data-action", "step-scale");
    stepApp.setAttribute("data-target", "appScale");
    stepApp.setAttribute("data-delta", "reset");
    root.appendChild(stepApp);
    root.dispatchEvent({ type: "click", target: stepApp });
    assert.ok(savedPatches.some((p) => p.studioUi && p.studioUi.appScale === 100));

    // Close modal to test long-press-only pinned resize vs quick drag vs viewport bounds
    panel.setOpen(false);
    panel.applyRemoteState({
      locale: "ru",
      appZoomSupported: true,
      settings: { pinned: true, viewMode: "mini", studioUi: { appScale: 100, studioScale: 100, widgetZoom: 100 } },
    }, true);

    // Idle hover cursor on pinned widget & Studio grip must NOT be nwse-resize (only when .is-resizing is active)
    const stCss = buildStudioStyles();
    assert.ok(stCss.includes(".widget-wrap.is-locked .mini-pill,\n    .widget-wrap.is-locked .med-card { cursor: pointer; }"));
    assert.ok(stCss.includes(".widget-wrap.is-resizing .mini-pill,\n    .widget-wrap.is-resizing .med-card {\n      cursor: nwse-resize;"));
    assert.ok(stCss.includes(".modal-shell.is-resizing .modal-resize-grip { cursor: nwse-resize;"));

    widgetMount.getBoundingClientRect = () => ({ left: 1100, top: 740, right: 1260, bottom: 780, width: 160, height: 40 });
    const pinnedBody = doc.createElement("div");
    pinnedBody.setAttribute("data-widget-body", "1");
    widgetMount.appendChild(pinnedBody);

    // Quick drag WITHOUT long-press must NOT resize the pinned widget
    savedPatches.length = 0;
    widgetMount.dispatchEvent({ type: "mousedown", button: 0, clientX: 1200, clientY: 760, target: pinnedBody });
    win.dispatchEvent({ type: "mousemove", clientX: 1120, clientY: 700 });
    win.dispatchEvent({ type: "mouseup" });
    assert.equal(savedPatches.some((p) => p.studioUi && p.studioUi.widgetZoom !== undefined), false, "Quick drag without long-press must NOT resize pinned widget");

    // Sustained long-press (>= 450ms) arms resize and scales widget smoothly without overflowing viewport
    savedPatches.length = 0;
    widgetMount.dispatchEvent({ type: "mousedown", button: 0, clientX: 1200, clientY: 760, target: pinnedBody });
    await new Promise((r) => setTimeout(r, 490));
    assert.ok(widgetMount.classList.contains("is-resizing"), "Long-press >= 450ms must arm .is-resizing on pinned widget");
    win.dispatchEvent({ type: "mousemove", clientX: 1120, clientY: 700 });
    win.dispatchEvent({ type: "mouseup" });

    assert.ok(savedPatches.some((p) => p.studioUi && p.studioUi.widgetZoom > 100), "Long-press & drag on pinned widget inward must increase widgetZoom");
    assert.equal(modalMount.innerHTML, "", "Releasing long-press resize on pinned widget must NOT open the Studio modal");

    // Viewport clamping: shrink viewport to 720x500 and verify Studio & widget zoom clamp strictly inside screen bounds
    win.innerWidth = 720;
    win.innerHeight = 500;
    panel.applyRemoteState({
      locale: "ru",
      appZoomSupported: true,
      settings: { pinned: true, viewMode: "medium", studioUi: { appScale: 100, studioScale: 140, widgetZoom: 160 } },
    }, true);
    const effStudioZoom = parseFloat(root.style.getPropertyValue("--rx-studio-zoom"));
    const effWidgetZoom = parseFloat(root.style.getPropertyValue("--rx-widget-zoom"));
    assert.ok(effStudioZoom * 920 <= 720 - 30 && effStudioZoom * 648 <= 500 - 30, `Studio zoom (${effStudioZoom}) must clamp inside 720x500 viewport`);
    assert.ok(effWidgetZoom * 318 <= 720 - 20 && effWidgetZoom * 310 <= 500 - 20, `Widget zoom (${effWidgetZoom}) must clamp inside 720x500 viewport`);

    // Restore viewport and verify unpinned drag still moves floating position
    win.innerWidth = 1280;
    win.innerHeight = 800;
    panel.applyRemoteState({ locale: "ru", settings: { pinned: false, viewMode: "mini" } }, true);
    const dragBody = doc.createElement("div");
    dragBody.setAttribute("data-widget-body", "1");
    dragBody.setAttribute("data-drag-handle", "1");
    widgetMount.appendChild(dragBody);
    savedPatches.length = 0;
    widgetMount.dispatchEvent({ type: "mousedown", button: 0, clientX: 1200, clientY: 760, target: dragBody });
    win.dispatchEvent({ type: "mousemove", clientX: 1000, clientY: 660 });
    win.dispatchEvent({ type: "mouseup" });
    assert.ok(savedPatches.some((p) => p.layoutMode === "floating" && typeof p.floatX === "number"), "Unpinned drag must move floating position");

    // Verify backend scaling & sanitization in i18n-main.js
    const i18nMainText = fs.readFileSync(path.join(SCRIPTS_DIR, "i18n-main.js"), "utf8");
    assert.ok(i18nMainText.includes("applyAppScaleToWindows"), "i18n-main.js must implement applyAppScaleToWindows");
    assert.ok(i18nMainText.includes("applyThemeCurtainToWindows"), "i18n-main.js must implement applyThemeCurtainToWindows");
    assert.ok(i18nMainText.includes("appZoomSupported: true"), "i18n-main.js must report appZoomSupported: true");
  } finally {
    panel.destroy();
    te.destroy();
    translator.destroy();
  }
});

// =============================================================================
// 17. Claude Code Palettes, Fonts, WebFont Injection & Full UI Theme Coverage (v4.4.1)
// =============================================================================
test("Claude Code themes, fonts, Google Fonts loader, one-click suite, full UI coverage, and Studio sync work cleanly", async () => {
  // 1) Theme presets & gradients
  const ccDark = THEME_PRESETS.find((p) => p.id === "claude-code-dark");
  const ccLight = THEME_PRESETS.find((p) => p.id === "claude-code-light");
  const ccTerm = THEME_PRESETS.find((p) => p.id === "claude-terminal");
  assert.ok(ccDark && ccDark.vars.accentColor === "#d97757" && ccDark.vars.canvasBg === "#1f1e1d");
  assert.ok(ccLight && ccLight.vars.accentColor === "#c15f3c" && ccLight.vars.canvasBg === "#f5f3ec" && ccLight.mode === "light");
  assert.ok(ccTerm && ccTerm.vars.canvasBg === "#141413");
  assert.ok(GRADIENT_PRESETS.some((g) => g.id === "claude-ember"));
  assert.ok(GRADIENT_PRESETS.some((g) => g.id === "claude-parchment"));

  // 2) Claude Code font stacks & web font URL generation
  assert.ok(FONT_PRESETS.ui.some((f) => f.id === "claude-sans"));
  assert.ok(FONT_PRESETS.ui.some((f) => f.id === "claude-serif"));
  assert.ok(FONT_PRESETS.ui.some((f) => f.id === "claude-lora"));
  assert.ok(FONT_PRESETS.ui.some((f) => f.id === "claude-mono-ui"));
  assert.ok(FONT_PRESETS.mono.some((f) => f.id === "claude-mono"));
  assert.ok(FONT_PRESETS.mono.some((f) => f.id === "geist-mono"));

  const wfUrl = teBuildWebFontUrl({ typography: { uiFont: "claude-sans", monoFont: "claude-mono" } });
  assert.ok(wfUrl.startsWith("https://fonts.googleapis.com/css2?"));
  assert.ok(wfUrl.includes("Plus+Jakarta+Sans") && wfUrl.includes("JetBrains+Mono"));
  assert.equal(teBuildWebFontUrl({ typography: { uiFont: "system", monoFont: "system" } }), "");

  const ccCss = buildThemeCss({
    presetId: "claude-code-dark",
    typography: { uiFont: "claude-serif", monoFont: "claude-mono" },
  }, { hostIsLight: false });
  assert.ok(ccCss.includes("--background: #1f1e1d !important;"));
  assert.ok(ccCss.includes("--primary: #d97757 !important;"));
  assert.ok(ccCss.includes("--card: #262624 !important;"));
  assert.ok(ccCss.includes("--sidebar-background: #1a1918 !important;"));
  assert.ok(ccCss.includes('[data-rudex-bg-sidebar="1"]'));
  assert.ok(ccCss.includes('[data-rudex-bg-header="1"]'));
  assert.ok(ccCss.includes('[data-rudex-theme-composer="1"]'));
  assert.ok(ccCss.includes('[data-rudex-theme-accent-dot="1"]'));
  assert.ok(ccCss.includes("Anthropic Serif"));
  assert.ok(ccCss.includes("JetBrains Mono"));
  assert.ok(ccCss.includes("optimizeLegibility"));

  // 2b) Non-wallpaper theme DOM scanner marks sidebar, header, composer, and blue unread dots, then clears on native
  {
    const { doc: tDoc, win: tWin } = createMockDom();
    tWin.innerWidth = 1440;
    tWin.innerHeight = 900;
    const appRoot = tDoc.createElement("div");
    appRoot.id = "root";
    appRoot.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1440, height: 900 });
    tDoc.body.appendChild(appRoot);

    const sidebarWrap = tDoc.createElement("div");
    sidebarWrap.getBoundingClientRect = () => ({ left: 0, top: 32, width: 240, height: 868 });
    sidebarWrap.style.backgroundColor = "rgb(13, 13, 17)";
    const unreadDot = tDoc.createElement("span");
    unreadDot.getBoundingClientRect = () => ({ left: 210, top: 180, width: 8, height: 8 });
    unreadDot.style.backgroundColor = "rgb(59, 130, 246)";
    sidebarWrap.appendChild(unreadDot);
    appRoot.appendChild(sidebarWrap);

    const topBar = tDoc.createElement("div");
    topBar.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1440, height: 32 });
    topBar.style.backgroundColor = "rgb(13, 13, 17)";
    appRoot.appendChild(topBar);

    const composerBox = tDoc.createElement("div");
    composerBox.getBoundingClientRect = () => ({ left: 420, top: 760, width: 640, height: 92 });
    composerBox.style.backgroundColor = "rgb(21, 21, 26)";
    const composerInput = tDoc.createElement("textarea");
    composerBox.appendChild(composerInput);
    appRoot.appendChild(composerBox);

    tWin.getComputedStyle = (el) => ({
      backgroundColor: (el && el.style && el.style.backgroundColor) || "rgba(0, 0, 0, 0)",
      backgroundImage: "none",
      borderTopWidth: "0px",
      borderTopColor: "transparent",
      getPropertyValue: () => "",
    });

    const scanEngine = createThemeEngine({ document: tDoc, window: tWin });
    try {
      scanEngine.apply({ presetId: "claude-code-dark", wallpaper: { type: "none" } });
      assert.equal(sidebarWrap.getAttribute("data-rudex-bg-sidebar"), "1", "Theme scanner must mark opaque sidebar without wallpaper");
      assert.equal(topBar.getAttribute("data-rudex-bg-header"), "1", "Theme scanner must mark top titlebar without wallpaper");
      assert.equal(composerBox.getAttribute("data-rudex-theme-composer"), "1", "Theme scanner must mark composer container");
      assert.equal(unreadDot.getAttribute("data-rudex-theme-accent-dot"), "1", "Theme scanner must mark blue unread dots in sidebar");

      scanEngine.apply({ presetId: "native", wallpaper: { type: "none" } });
      assert.equal(sidebarWrap.getAttribute("data-rudex-bg-sidebar"), null);
      assert.equal(topBar.getAttribute("data-rudex-bg-header"), null);
      assert.equal(composerBox.getAttribute("data-rudex-theme-composer"), null);
      assert.equal(unreadDot.getAttribute("data-rudex-theme-accent-dot"), null);
    } finally {
      scanEngine.destroy();
    }
  }

  // 3) Studio CSS exposes Claude Code window/widget themes and editorial redesign tokens
  const studioCss = buildStudioStyles();
  for (const tok of [
    '[data-studio-theme="claude-dark"]',
    '[data-studio-theme="claude-light"]',
    '[data-widget-theme="claude"]',
    ".claude-spotlight",
    ".theme-swatch-mini",
    ".typo-preview-card",
    ".font-pair-grid",
    "--rx-font-ui",
    "--rx-font-mono",
  ]) {
    assert.ok(studioCss.includes(tok), `Missing redesigned Studio CSS selector/token: ${tok}`);
  }

  // 4) Interactive Studio Panel: one-click Claude Code suite + font pairing syncs host & Studio
  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, dictionary, applyDynamicRules, initialLocale: "ru" });
  translator.init();
  const savedPatches = [];
  const te = createThemeEngine({ document: doc, window: win });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      invoke: async (ch, payload) => {
        if (ch === "agy-studio:get-state") return { locale: "ru", settings: { viewMode: "mini" } };
        if (ch === "agy-studio:save-settings") {
          savedPatches.push(payload);
          return { ok: true, settings: payload };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: te,
  });

  try {
    panel.init();
    panel.setOpen(true, { tab: "appearance", appSubTab: "theme", dockedRight: false });
    const host = doc.getElementById("rudex-studio-host");
    const root = host.shadowRoot.querySelector(".studio-root");
    const modalMount = host.shadowRoot.querySelector(".modal-mount");

    assert.ok(modalMount.innerHTML.includes("claude-spotlight"), "Appearance -> Theme must show Claude Code quick suite");
    assert.ok(modalMount.innerHTML.includes("theme-swatch-mini"), "Theme cards must render visual mini swatches");
    assert.equal(modalMount.innerHTML.includes("m12 3-1.9 5.8"), false, "Brand & nav must not use AI sparkle icon");

    // Click one-click Claude Code Dark suite
    const ccDarkBtn = doc.createElement("button");
    ccDarkBtn.setAttribute("data-action", "apply-claude-suite");
    ccDarkBtn.setAttribute("data-val", "dark");
    root.appendChild(ccDarkBtn);
    root.dispatchEvent({ type: "click", target: ccDarkBtn });

    assert.equal(root.getAttribute("data-studio-theme"), "claude-dark");
    assert.equal(root.style.getPropertyValue("--rx-accent"), "#d97757");
    assert.equal(root.style.getPropertyValue("--rx-theme-bg"), "#1f1e1d");
    assert.ok(root.style.getPropertyValue("--rx-font-ui").includes("Anthropic Sans"), "Studio UI must inherit Claude Sans font");
    assert.ok(root.style.getPropertyValue("--rx-font-mono").includes("JetBrains Mono"), "Studio mono must inherit Claude Code Mono font");
    assert.ok(savedPatches.some((p) => p.studioUi && p.studioUi.windowTheme === "claude-dark" && p.studioUi.widgetTheme === "claude"));
    const fontLink = doc.getElementById("rudex-studio-fonts");
    assert.ok(fontLink && fontLink.getAttribute("href").includes("fonts.googleapis.com"), "WebFont <link> must be injected into host document");

    // Click one-click Claude Code Light suite
    const ccLightBtn = doc.createElement("button");
    ccLightBtn.setAttribute("data-action", "apply-claude-suite");
    ccLightBtn.setAttribute("data-val", "light");
    root.appendChild(ccLightBtn);
    root.dispatchEvent({ type: "click", target: ccLightBtn });
    assert.equal(root.getAttribute("data-theme"), "light");
    assert.equal(root.getAttribute("data-studio-theme"), "claude-light");
    assert.equal(root.style.getPropertyValue("--rx-accent"), "#c15f3c");
    assert.equal(root.style.getPropertyValue("--rx-theme-bg"), "#f5f3ec");

    // Switch to Appearance -> Text and click Claude Editorial font pairing
    panel.setOpen(true, { tab: "appearance", appSubTab: "text", dockedRight: false });
    assert.ok(modalMount.innerHTML.includes("typo-preview-card"), "Text tab must render live typography preview card");
    const pairBtn = doc.createElement("button");
    pairBtn.setAttribute("data-action", "apply-font-pair");
    pairBtn.setAttribute("data-id", "claude-editorial");
    root.appendChild(pairBtn);
    root.dispatchEvent({ type: "click", target: pairBtn });
    assert.ok(root.style.getPropertyValue("--rx-font-ui").includes("Source Serif 4"), "Editorial pair must apply Claude Serif font to Studio");

    // Verify backend sanitizer whitelists all new Claude Code IDs
    const i18nMainText = fs.readFileSync(path.join(SCRIPTS_DIR, "i18n-main.js"), "utf8");
    for (const id of ["claude-code-dark", "claude-code-light", "claude-terminal", "claude-sans", "claude-serif", "claude-mono", "claude-dark", "claude-light"]) {
      assert.ok(i18nMainText.includes(`"${id}"`), `i18n-main.js sanitizer must whitelist ${id}`);
    }
  } finally {
    panel.destroy();
    te.destroy();
    translator.destroy();
  }
});

// =============================================================================
// 18. Windows 10 EPERM-Safe Sync & Bulletproof Post-Update Survival (v4.4.7)
// =============================================================================
test("Installer syncs plugin in-place (Win10 EPERM fix), never uses timeout /t in detached cmd scripts, and recovers shadowed app.asar", async () => {
  const installJsText = fs.readFileSync(path.join(SCRIPTS_DIR, "install.js"), "utf8");
  const i18nMainText = fs.readFileSync(path.join(SCRIPTS_DIR, "i18n-main.js"), "utf8");
  const updaterCoreText = fs.readFileSync(path.join(SCRIPTS_DIR, "updater-core.js"), "utf8");
  const ps1Text = fs.readFileSync(path.join(REPO_ROOT, "install.ps1"), "utf8");

  assert.equal(
    installJsText.includes("fs.rmSync(targetSkillsDir"),
    false,
    "syncPluginToGlobalConfig must NEVER rmSync targetSkillsDir before copying (causes Win10 DELETE_PENDING EPERM)"
  );
  assert.ok(installJsText.includes("function ensureDirSafe("), "install.js must define retry-safe ensureDirSafe");
  assert.ok(installJsText.includes("function copyFileSafe("), "install.js must define retry-safe copyFileSafe");
  assert.ok(installJsText.includes("function pruneObsoleteEntries("), "install.js must prune obsolete files after in-place copy");

  // Detached Windows .cmd scripts with stdio:"ignore" MUST NEVER use `timeout /t` (fails immediately with input redirection error)
  for (const [label, src] of [
    ["install.js", installJsText],
    ["i18n-main.js", i18nMainText],
    ["updater-core.js", updaterCoreText],
    ["install.ps1", ps1Text],
  ]) {
    assert.equal(/timeout\s+\/t/i.test(src), false, `${label} must NOT use 'timeout /t' in detached cmd scripts (use ping -n instead)`);
    assert.ok(src.includes("ping -n "), `${label} must use ping -n delay in detached cmd scripts`);
  }

  // Post-app-update watcher must trigger whenever app.asar reappears (even if resources/app/rudex-patch-meta.json remained)
  assert.ok(i18nMainText.includes('if exist "!RES_DIR!\\\\app.asar" goto repatch'), "Post-update watcher must trigger on app.asar presence alone");
  assert.equal(i18nMainText.includes('if not exist "!RES_DIR!\\\\app\\\\rudex-patch-meta.json" goto repatch'), false);

  assert.ok(ps1Text.includes("Rudex v4.4.7"), "install.ps1 banner must show v4.4.7");
  assert.ok(ps1Text.includes("Test-InsideAntigravityProcess"), "install.ps1 must detect if running inside Antigravity");
  assert.ok(ps1Text.includes("Closing Antigravity briefly so Windows releases file locks"), "Remote PS1 mode must stop Antigravity before --sync-plugin when safe");

  // Disable Electron ASAR interception everywhere scripts run under ELECTRON_RUN_AS_NODE=1
  const uninstallJsText = fs.readFileSync(path.join(SCRIPTS_DIR, "uninstall.js"), "utf8");
  const hookJsText = fs.readFileSync(path.join(SCRIPTS_DIR, "rudex-hook.js"), "utf8");
  const hookRunnerText = fs.readFileSync(path.join(SCRIPTS_DIR, "hook-runner.cmd"), "utf8");
  const shellJsText = fs.readFileSync(path.join(SCRIPTS_DIR, "electron-shell.js"), "utf8");
  const installCmdText = fs.readFileSync(path.join(REPO_ROOT, "Install-Rudex.cmd"), "utf8");
  const uninstallCmdText = fs.readFileSync(path.join(REPO_ROOT, "Uninstall-Rudex.cmd"), "utf8");
  for (const [label, src] of [
    ["install.js", installJsText],
    ["uninstall.js", uninstallJsText],
    ["rudex-hook.js", hookJsText],
  ]) {
    assert.ok(src.includes("process.noAsar = true;"), `${label} must set process.noAsar = true for ELECTRON_RUN_AS_NODE=1 compatibility`);
  }
  for (const [label, src] of [
    ["install.ps1", ps1Text],
    ["hook-runner.cmd", hookRunnerText],
    ["i18n-main.js", i18nMainText],
    ["updater-core.js", updaterCoreText],
    ["electron-shell.js", shellJsText],
    ["rudex-hook.js", hookJsText],
    ["Install-Rudex.cmd", installCmdText],
    ["Uninstall-Rudex.cmd", uninstallCmdText],
  ]) {
    assert.ok(src.includes("ELECTRON_NO_ASAR"), `${label} must set ELECTRON_NO_ASAR=1 alongside ELECTRON_RUN_AS_NODE=1`);
  }

  // rudex-hook.js must still arm recovery if app.asar shadows an already-patched resources/app of the SAME version
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-shadow-asar-"));
  try {
    const mockResDir = path.join(tmpDir, "antigravity", "resources");
    const mockAppRoot = path.dirname(mockResDir);
    const mockAppDir = path.join(mockResDir, "app");
    const mockPluginDir = path.join(tmpDir, "plugin-rudex");
    const mockUserData = path.join(tmpDir, "userData");
    const markerFile = path.join(tmpDir, "shadow-repatch.txt");
    fs.mkdirSync(mockAppDir, { recursive: true });
    fs.mkdirSync(path.join(mockPluginDir, "skills", "rudex", "scripts"), { recursive: true });
    fs.mkdirSync(mockUserData, { recursive: true });

    fs.writeFileSync(path.join(mockAppRoot, "version"), "44.9.1\n", "utf8");
    fs.writeFileSync(path.join(mockResDir, "app.asar"), "SHADOWING_ASAR_BYTES", "utf8");
    fs.writeFileSync(path.join(mockAppDir, "rudex-patch-meta.json"), JSON.stringify({ stampVersion: "44.9.1", version: "4.4.7" }), "utf8");
    fs.writeFileSync(path.join(mockPluginDir, "plugin.json"), '{"name":"rudex","version":"4.4.7"}', "utf8");
    fs.writeFileSync(
      path.join(mockPluginDir, "skills", "rudex", "scripts", "install.js"),
      `"use strict";\nconst fs = require("fs");\nfs.writeFileSync(${JSON.stringify(markerFile)}, JSON.stringify(process.argv.slice(2)), "utf8");\n`,
      "utf8"
    );

    const r = spawnSync(process.execPath, [path.join(SCRIPTS_DIR, "rudex-hook.js")], {
      input: JSON.stringify({ hookEventName: "SessionStart", conversationId: "eeee2222-2222-4222-8222-222222222222" }),
      env: Object.assign({}, process.env, {
        AGY_STUDIO_USER_DATA: mockUserData,
        ANTIGRAVITY_RESOURCES_DIR: mockResDir,
        RUDEX_PLUGIN_DIR: mockPluginDir,
        RUDEX_SKIP_AUTO_REPATCH: "0",
      }),
      encoding: "utf8",
    });
    assert.equal(r.status, 0, r.stderr);
    for (let i = 0; i < 40 && !fs.existsSync(markerFile); i += 1) {
      await new Promise((res) => setTimeout(res, 25));
    }
    assert.ok(fs.existsSync(markerFile), "rudex-hook.js must trigger recovery even when stampVersion matches if app.asar still shadows resources/app");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// =============================================================================
// 19. Wallpaper Persistence, Header/Fade/Composer UI Integrity & Broken Media Fallback (v4.4.7)
// =============================================================================
test("Wallpaper persistence: apply-appearance never deletes the newly applied mediaFile and backend guards active wallpaper", () => {
  const studioPanelText = fs.readFileSync(path.join(RES_DIR, "studio-panel.js"), "utf8");
  const i18nMainText = fs.readFileSync(path.join(SCRIPTS_DIR, "i18n-main.js"), "utf8");

  // Regression guard against the inverted filter bug that deleted the newly saved wallpaper on Apply
  assert.equal(
    studioPanelText.includes("tempUploadedMediaFiles.filter((f) => f === newSavedFile)"),
    false,
    "apply-appearance must NOT filter tempUploadedMediaFiles with === newSavedFile (that deleted the active wallpaper!)"
  );
  assert.ok(
    studioPanelText.includes("(state.tempUploadedMediaFiles || []).filter((f) => f && f !== newSavedFile)"),
    "apply-appearance must keep only unused temp uploads (!== newSavedFile) for cleanup"
  );
  assert.ok(
    i18nMainText.includes("keptForActive: true"),
    "i18n-main.js agy-studio:delete-media must refuse deleting the currently active wallpaper mediaFile"
  );
  assert.ok(
    studioPanelText.includes("const protectedFiles = new Set()"),
    "cleanupTempUploadedMedia must protect saved, draft, and profile wallpaper files"
  );
});

test("Theme engine v4.4.7: wallpaper + Claude Code preserves terracotta accents, clears black fade bars, elevates header, styles composer, and recovers from 404 media", () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const cfg = te.normalizeAppearance({
    presetId: "claude-terminal",
    glassOpacity: 100,
    sidebarOpacity: 100,
    wallpaper: {
      type: "image",
      mediaFile: "image-test-wallpaper.jpg",
      mediaUrl: "rudex-media://local/image-test-wallpaper.jpg",
    },
  });

  const css = te.buildThemeCss(cfg, { hostIsLight: false });
  assert.ok(
    /:root,\s*:root\.dark,\s*:root\.light,[\s\S]*?\.dark,\s*\.light\s*\{\s*--background:\s*transparent\s*!important;/.test(css),
    "Wallpaper mode must override --background on .dark with equal specificity so bottom scroll-fade does not turn black"
  );
  assert.ok(css.includes('[data-rudex-bg-fade="1"]'), "Wallpaper CSS must clear [data-rudex-bg-fade='1'] fade bars");
  assert.ok(css.includes('[data-rudex-theme-composer="1"]'), "Wallpaper CSS must style [data-rudex-theme-composer='1']");
  assert.ok(css.includes("z-index: 30 !important;"), "Header must stay elevated above scrolling agent responses");
  assert.ok(css.includes("color: #da7756 !important;"), "Claude Terminal links under wallpaper must remain terracotta (#da7756)");
  assert.equal(css.includes("color: #7cb3ff !important;"), false, "Claude Terminal under wallpaper must not revert links to blue #7cb3ff");
  assert.equal(css.includes("color: #f8fafc !important;"), false, "Claude Terminal under wallpaper must preserve terracotta inline code");

  // Mock DOM to verify Pass A/B/C scanning while wallpaperActive === true AND img.onerror recovery
  function makeEl(tag, opts = {}) {
    const attrs = new Map(Object.entries(opts.attrs || {}));
    const el = {
      nodeType: 1,
      tagName: tag.toUpperCase(),
      id: opts.id || "",
      className: opts.className || "",
      style: {},
      children: [],
      childNodes: [],
      parentNode: null,
      parentElement: null,
      textContent: opts.textContent || "",
      _rect: opts.rect || { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 },
      _cs: opts.cs || { backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "none", position: "static", pointerEvents: "auto" },
      getAttribute(k) { return attrs.has(k) ? attrs.get(k) : null; },
      setAttribute(k, v) { attrs.set(k, String(v)); if (k === "id") el.id = String(v); },
      removeAttribute(k) { attrs.delete(k); },
      hasAttribute(k) { return attrs.has(k); },
      appendChild(child) {
        child.parentNode = el;
        child.parentElement = el;
        el.children.push(child);
        el.childNodes.push(child);
        return child;
      },
      insertBefore(child, ref) {
        child.parentNode = el;
        child.parentElement = el;
        const idx = el.children.indexOf(ref);
        if (idx >= 0) {
          el.children.splice(idx, 0, child);
          el.childNodes.splice(idx, 0, child);
        } else {
          el.children.push(child);
          el.childNodes.push(child);
        }
        return child;
      },
      removeChild(child) {
        const idx = el.children.indexOf(child);
        if (idx >= 0) el.children.splice(idx, 1);
        const idx2 = el.childNodes.indexOf(child);
        if (idx2 >= 0) el.childNodes.splice(idx2, 1);
        child.parentNode = null;
        child.parentElement = null;
        return child;
      },
      getBoundingClientRect() { return el._rect; },
      contains(other) {
        let c = other;
        while (c) {
          if (c === el) return true;
          c = c.parentNode;
        }
        return false;
      },
      closest() { return null; },
      querySelector(sel) { return el.querySelectorAll(sel)[0] || null; },
      querySelectorAll(sel) {
        const res = [];
        const parts = sel.split(",").map((s) => s.trim());
        const matchOne = (node, p) => {
          if (p === 'textarea') return node.tagName === "TEXTAREA";
          if (p === '[contenteditable="true"]') return node.getAttribute("contenteditable") === "true";
          if (p === 'div' || p === 'section' || p === 'footer' || p === 'span' || p === 'aside' || p === 'nav' || p === 'button' || p === 'a') {
            return node.tagName === p.toUpperCase();
          }
          if (p === '[data-testid="sidebar"]') return node.getAttribute("data-testid") === "sidebar";
          if (p === '[data-rudex-bg-sidebar="1"]') return node.getAttribute("data-rudex-bg-sidebar") === "1";
          if (p === '[data-testid="agent-response"]') return node.getAttribute("data-testid") === "agent-response";
          if (p === '[data-testid="user-message-content"]') return node.getAttribute("data-testid") === "user-message-content";
          const attrMatch = /^\[([a-z0-9-]+)\]$/.exec(p);
          if (attrMatch) return node.hasAttribute(attrMatch[1]);
          return false;
        };
        const walk = (node) => {
          for (const ch of node.children) {
            if (parts.some((p) => matchOne(ch, p))) res.push(ch);
            walk(ch);
          }
        };
        walk(el);
        return res;
      },
    };
    return el;
  }

  const head = makeEl("head");
  const body = makeEl("body", { rect: { left: 0, top: 0, width: 1440, height: 900 } });
  const root = makeEl("div", { id: "root", rect: { left: 0, top: 0, width: 1440, height: 900 }, cs: { backgroundColor: "rgb(20, 20, 19)", backgroundImage: "none" } });
  const sidebar = makeEl("aside", { rect: { left: 0, top: 32, width: 240, height: 868 }, cs: { backgroundColor: "rgb(18, 18, 17)", backgroundImage: "none" } });
  const blueDot = makeEl("span", { rect: { left: 215, top: 210, width: 6, height: 6 }, cs: { backgroundColor: "rgb(59, 130, 246)", backgroundImage: "none" } });
  sidebar.appendChild(blueDot);

  const chatHeader = makeEl("div", {
    rect: { left: 240, top: 32, width: 1200, height: 42 },
    cs: { backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "none", position: "sticky", borderBottomWidth: "1px", borderBottomColor: "rgba(255,255,255,0.08)" },
    textContent: "antigravity-ru / Session",
  });
  const fadeBar = makeEl("div", {
    rect: { left: 240, top: 720, width: 1200, height: 48 },
    cs: { backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "linear-gradient(to top, rgb(0, 0, 0), transparent)", pointerEvents: "none" },
  });
  const composerCard = makeEl("div", {
    rect: { left: 460, top: 772, width: 720, height: 96 },
    cs: { backgroundColor: "rgb(18, 18, 22)", backgroundImage: "none", borderTopWidth: "1px", borderTopColor: "rgba(255,255,255,0.12)", borderTopLeftRadius: "16px" },
  });
  const composerInput = makeEl("div", {
    attrs: { contenteditable: "true" },
    rect: { left: 476, top: 784, width: 688, height: 40 },
    cs: { backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "none" },
  });
  composerCard.appendChild(composerInput);

  root.appendChild(sidebar);
  root.appendChild(chatHeader);
  root.appendChild(fadeBar);
  root.appendChild(composerCard);
  body.appendChild(root);

  const mockDoc = {
    head,
    body,
    documentElement: makeEl("html"),
    readyState: "complete",
    hidden: false,
    createElement: (tag) => makeEl(tag),
    getElementById(id) {
      const search = (n) => {
        if (n.id === id) return n;
        for (const ch of n.children) {
          const found = search(ch);
          if (found) return found;
        }
        return null;
      };
      return search(head) || search(body);
    },
    querySelector(sel) {
      if (sel === "#root, #app") return root;
      return body.querySelector(sel);
    },
    querySelectorAll(sel) { return body.querySelectorAll(sel); },
    addEventListener() {},
    removeEventListener() {},
  };
  const mockWin = {
    innerWidth: 1440,
    innerHeight: 900,
    getComputedStyle: (el) => el._cs || { backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "none" },
    addEventListener() {},
    removeEventListener() {},
  };

  const engine = te.createThemeEngine({
    document: mockDoc,
    window: mockWin,
    resolveMediaUrl: (f) => (f ? `rudex-media://${f}` : ""),
  });

  try {
    engine.apply(cfg);
    assert.ok(mockDoc.getElementById("rudex-bg"), "Wallpaper layer #rudex-bg must be mounted initially");
    assert.equal(chatHeader.getAttribute("data-rudex-bg-header"), "1", "Transparent sticky chat header must still be marked data-rudex-bg-header='1' under wallpaper");
    assert.equal(fadeBar.getAttribute("data-rudex-bg-fade"), "1", "Bottom black gradient fade bar must be marked data-rudex-bg-fade='1'");
    assert.equal(composerCard.getAttribute("data-rudex-theme-composer"), "1", "Composer card must be marked data-rudex-theme-composer='1' even when wallpaper is active");
    assert.equal(blueDot.getAttribute("data-rudex-theme-accent-dot"), "1", "Sidebar blue unread dot must still be recolored under wallpaper");

    // Simulate 404 / deleted wallpaper file on restart: img.onerror must clean up #rudex-bg (no black scrim!)
    const bgLayer = mockDoc.getElementById("rudex-bg");
    const bgImg = bgLayer.children.find((c) => c.tagName === "IMG");
    assert.ok(bgImg && typeof bgImg.onerror === "function", "Background img must attach an onerror fallback handler");
    bgImg.onerror();

    assert.equal(mockDoc.getElementById("rudex-bg"), null, "Broken 404 wallpaper must remove #rudex-bg instead of leaving a black scrim screen");
    const fallbackStyle = mockDoc.getElementById("rudex-studio-theme");
    assert.ok(fallbackStyle && fallbackStyle.textContent.includes("--background: #141413 !important;"), "Fallback CSS must restore clean Claude Terminal canvas");

    // Selecting a new valid wallpaper must clear failedMediaUrl and restore #rudex-bg
    engine.apply(Object.assign({}, cfg, {
      wallpaper: Object.assign({}, cfg.wallpaper, { mediaFile: "image-fresh-ok.jpg" }),
    }));
    assert.ok(mockDoc.getElementById("rudex-bg"), "New valid wallpaper must re-mount #rudex-bg after previous 404");
  } finally {
    engine.destroy();
  }
});

// =============================================================================
// 20. Single-Frame User Bubble, Single-Ring Composer, and Transparent Sidebar Borders (v4.4.7)
// =============================================================================
test("Theme engine v4.4.7: no double border on nested user-message-content, no double composer focus ring, and border-transparent stays transparent", () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));

  const wpCss = te.buildThemeCss(
    te.normalizeAppearance({
      presetId: "claude-terminal",
      wallpaper: { type: "image", mediaFile: "wp.jpg", mediaUrl: "rudex-media://local/wp.jpg" },
    }),
    { hostIsLight: false }
  );
  assert.ok(
    wpCss.includes('[data-testid="user-message-bubble"] [data-testid="user-message-content"]'),
    "Nested user-message-content inside user-message-bubble must be explicitly reset to transparent/borderless"
  );
  assert.ok(
    wpCss.includes('[data-testid="user-message-content"]:not([data-testid="user-message-bubble"] *)'),
    "Standalone user-message-content styling must exclude nodes nested inside user-message-bubble"
  );
  assert.ok(
    wpCss.includes(':not([data-rudex-theme-composer="1"] *):not(:has([data-rudex-theme-composer="1"]))'),
    "Fallback composer selectors must not double-style inner or outer wrappers when data-rudex-theme-composer='1' is active"
  );
  assert.equal(
    wpCss.includes("0 0 0 1px color-mix"),
    false,
    "Composer focus-within must not draw an extra 1px outer ring on top of border-color"
  );

  const solidCss = te.buildThemeCss(
    te.normalizeAppearance({ presetId: "claude-terminal", wallpaper: { type: "none" } }),
    { hostIsLight: false }
  );
  assert.equal(
    solidCss.includes('[class*="border"]:not('),
    false,
    "Border recoloring must never use broad [class*='border'] that turns Tailwind border-transparent into visible sidebar borders"
  );
  assert.ok(
    solidCss.includes(':not([class~="border-transparent"]):not([class~="border-none"]):not([class~="border-0"])'),
    "Border recoloring must explicitly spare border-transparent, border-none, and border-0"
  );
  for (const forbiddenSubstr of [
    '[class*="bg-muted"]',
    '[class*="bg-secondary"]',
    '[class*="bg-card"]',
    '[class*="bg-zinc-900"]',
    '[class*="bg-neutral-900"]',
    '[class*="bg-zinc-800"]',
  ]) {
    assert.equal(
      solidCss.includes(forbiddenSubstr),
      false,
      `Theme CSS must never use substring selector ${forbiddenSubstr} (matches Tailwind modifiers like hover:bg-muted and prose-code:bg-muted at rest)`
    );
  }
  assert.ok(
    solidCss.includes('[data-testid="agent-response"],\n[data-testid="agent-response"] :where([data-markdown-root], div:has(> [data-markdown-root])),\n[data-markdown-root] {\n  background-color: transparent !important;'),
    "Agent response markdown root must stay transparent on canvas when wallpaper is off and style is not solid"
  );
  assert.equal(
    solidCss.includes('[data-slot="card"], [data-slot="collapsible"]'),
    false,
    "Logical [data-slot='collapsible'] containers inside agent replies must NOT be filled with cardBg without padding"
  );

  const solidCardNoBorderCss = te.buildThemeCss(
    te.normalizeAppearance({
      presetId: "claude-terminal",
      messageStyle: "solid",
      borderStrength: 0,
      wallpaper: { type: "none" },
    }),
    { hostIsLight: false }
  );
  assert.ok(
    solidCardNoBorderCss.includes("padding: 14px 18px !important;"),
    "Solid agent-response cards without wallpaper must still get breathing padding even when borderStrength is 0"
  );
});

// =============================================================================
// 31–35. Rudex 5.0 Comprehensive Feature Tests
// =============================================================================
test("Rudex 5.0 translations: running tooltips, 2m 10s compact durations, and customLabels with chat protection", () => {
  assert.equal(
    dictionary["Model cannot be changed while the agent is running"],
    "Нельзя сменить модель, пока агент работает"
  );
  assert.equal(applyDynamicRules("2m 10s"), "2 мин 10 с");
  assert.equal(applyDynamicRules("Проверка CSS 2m 10s"), "Проверка CSS 2 мин 10 с");
  assert.equal(applyDynamicRules("Reasoning effort cannot be changed while the agent is running"), "Нельзя изменить глубину рассуждений, пока агент работает");

  const { doc, win } = createMockDom();
  const btn = doc.createElement("button");
  btn.textContent = "New Conversation";
  const tip = doc.createElement("div");
  tip.setAttribute("role", "tooltip");
  tip.textContent = "Model cannot be changed while the agent is running";
  const dur = doc.createElement("span");
  dur.textContent = "2m 10s";
  const userMsg = doc.createElement("div");
  userMsg.setAttribute("data-testid", "user-message-content");
  userMsg.textContent = "New Conversation";
  doc.body.appendChild(btn);
  doc.body.appendChild(tip);
  doc.body.appendChild(dur);
  doc.body.appendChild(userMsg);

  const tr = createDomTranslator({
    document: doc,
    window: win,
    dictionary,
    applyDynamicRules,
    initialLocale: "ru",
  });
  tr.init();
  assert.equal(tip.textContent, "Нельзя сменить модель, пока агент работает");
  assert.equal(dur.textContent, "2 мин 10 с");

  // Custom rename overrides UI chrome but never modifies user chat messages
  tr.setCustomLabels([{ id: "l1", matchType: "exact", match: "New Conversation", label: "🚀 Новая миссия", enabled: true }]);
  assert.equal(btn.textContent, "🚀 Новая миссия");
  assert.equal(userMsg.textContent, "New Conversation");

  // Removing custom label restores Russian translation cleanly
  tr.setCustomLabels([]);
  assert.equal(btn.textContent, dictionary["New Conversation"]);
  tr.destroy();
});

test("Rudex 5.0 typography (4 font slots + custom system fonts), crisp borders by default, and elementOverrides", () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const cfg = te.normalizeAppearance({
    presetId: "claude-code-dark",
    borderPreset: "crisp",
    typography: {
      uiFont: "claude-sans",
      inputFont: "claude-mono",
      agentFont: "claude-serif",
      thinkingFont: "claude-lora",
      monoFont: "custom",
      monoFontCustom: "Cascadia Code",
      uiFontSize: 13,
      inputFontSize: 15,
      agentFontSize: 16,
      codeFontSize: 12,
    },
    elementOverrides: [
      {
        id: "ov-1",
        name: "Sidebar",
        selector: '[data-testid="sidebar"]',
        enabled: true,
        styles: { width: 280, bgColor: "#112233", color: "#eeeeee", borderRadius: 8 },
      },
    ],
  });
  const css = te.buildThemeCss(cfg, { hostIsLight: false });
  assert.ok(css.includes("--default-font-family:"), "UI font must override Tailwind v4 --default-font-family");
  assert.ok(css.includes('[data-rudex-theme-composer="1"] :where(button, span, div, p, label)'), "UI font must reach composer bottom toolbar");
  assert.ok(css.includes('font-size: 15px !important;'), "Input font size slot must emit CSS");
  assert.ok(css.includes('font-size: 16px !important;'), "Agent font size slot must emit CSS");
  assert.ok(css.includes('"Cascadia Code"'), "Custom system font must be quoted safely");
  assert.ok(css.includes('[data-rudex-zone="steps"]'), "Crisp structural borders for steps/thinking must be present by default");
  assert.ok(css.includes('[data-testid="sidebar"]') && css.includes("width: 280px !important;"), "Element overrides CSS must be emitted");

  const pausedCss = te.buildThemeCss(Object.assign({}, cfg, { overridesPaused: true }), { hostIsLight: false });
  assert.equal(pausedCss.includes("width: 280px !important;"), false, "Paused element overrides must immediately stop emitting CSS");

  const wfUrl = te.teBuildWebFontUrl(cfg);
  assert.ok(wfUrl.includes("JetBrains+Mono") && wfUrl.includes("Source+Serif+4") && wfUrl.includes("Lora"), "Web font URL must include all active font slots");
});

test("Rudex 5.0 standalone Limits Widget, Keybinding matcher/formatter, and Studio 4-section layout", () => {
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));

  // Load i18n-main.js with lightweight Electron stub to exercise real sanitizers & hotkey matcher
  const Module = require("node:module");
  const origLoad = Module._load;
  let i18nMain;
  try {
    Module._load = function (req, parent, isMain) {
      if (req === "electron") {
        return {
          app: { getPath: () => os.tmpdir(), on: () => {} },
          ipcMain: { handle: () => {}, on: () => {} },
          webContents: { getAllWebContents: () => [] },
          dialog: {},
          shell: {},
          protocol: {},
          BrowserWindow: { getAllWindows: () => [] },
        };
      }
      return origLoad.apply(this, arguments);
    };
    const resolvedPath = require.resolve(path.join(SCRIPTS_DIR, "i18n-main.js"));
    delete require.cache[resolvedPath];
    i18nMain = require(resolvedPath);
  } finally {
    Module._load = origLoad;
  }

  const { matchInputToCombo, sanitizeLimitsWidget, sanitizeKeybindings } = i18nMain;

  // Keybindings matching & formatting
  assert.equal(matchInputToCombo({ control: true, alt: true, shift: false, code: "KeyW", key: "w" }, "Ctrl+Alt+W"), true);
  assert.equal(matchInputToCombo({ control: true, alt: true, shift: true, code: "KeyW", key: "w" }, "Ctrl+Alt+W"), false);
  assert.equal(v5Core.rv5FormatKeyboardEvent({ ctrlKey: true, altKey: true, shiftKey: false, code: "KeyQ", key: "q" }), "Ctrl+Alt+Q");
  assert.equal(v5Core.rv5FormatKeyboardEvent({ key: "Escape" }), "__CANCEL__");
  assert.equal(v5Core.rv5FormatKeyboardEvent({ key: "Backspace" }), "__CLEAR__");

  const cleanKb = sanitizeKeybindings({ toggleStudio: "ctrl+shift+k", cycleWallpaper: "" });
  assert.equal(cleanKb.toggleStudio, "Ctrl+Shift+K");
  assert.equal(cleanKb.cycleWallpaper, "");

  // Limits widget rendering (pill & bars with custom font & traffic light)
  const lw = sanitizeLimitsWidget({ enabled: true, onlyLimitsMode: true, layout: "bars", fontSize: 13, bgColor: "#1a1a1a", families: "both" });
  const html = v5Core.rv5BuildLimitsWidgetHtml(lw, {
    families: {
      gemini: { fiveHourRem: 78, weeklyRem: 91, fiveHourReset: "3ч 10м" },
      claudeGpt: { fiveHourRem: 14, weeklyRem: 60, fiveHourReset: "1ч 20м" },
    },
  }, "Gemini 4 Neon", true);
  assert.ok(html.includes("Лимиты Antigravity"));
  assert.ok(html.includes("78%") && html.includes("14%") && html.includes("#ef4444"), "Low quota must render red traffic-light bar");
  assert.ok(html.includes("3ч 10м"), "Reset timer must be displayed");

  // Native settings & customization entry injection (must inject AT MOST ONCE even with nested dialog wrappers & repeated ticks)
  const { doc } = createMockDom();
  const dlg = doc.createElement("div");
  dlg.setAttribute("role", "dialog");
  const outerWrap = doc.createElement("div");
  const nav = doc.createElement("div");
  const b1 = doc.createElement("button");
  b1.textContent = "Основные";
  const b2 = doc.createElement("button");
  b2.textContent = "Модели";
  const b3 = doc.createElement("button");
  b3.textContent = "Браузер";
  nav.appendChild(b1);
  nav.appendChild(b2);
  nav.appendChild(b3);
  const footerWrap = doc.createElement("div");
  const b4 = doc.createElement("button");
  b4.textContent = "Оставить отзыв";
  footerWrap.appendChild(b4);
  outerWrap.appendChild(nav);
  outerWrap.appendChild(footerWrap);
  dlg.appendChild(outerWrap);
  doc.body.appendChild(dlg);
  let openedTab = "";
  v5Ui.rv5InjectNativeSettingsEntries(doc, true, (tab) => { openedTab = tab; });
  v5Ui.rv5InjectNativeSettingsEntries(doc, true, (tab) => { openedTab = tab; });
  v5Ui.rv5InjectNativeSettingsEntries(doc, true, (tab) => { openedTab = tab; });
  const allInjected = doc.querySelectorAll('[data-rudex-native-entry="settings"]');
  assert.equal(allInjected.length, 1, "Rudex Studio entry must be injected strictly ONCE inside native Settings");
  assert.equal(allInjected[0].parentNode, nav, "Rudex Studio entry must be placed inside the deepest settings nav list");
  allInjected[0].dispatchEvent({ type: "click", target: allInjected[0], preventDefault() {}, stopPropagation() {} });
  assert.equal(openedTab, "appearance");
});

test("Rudex 5.0 rudex-hook.js: Agent Profile default for new chats, PreToolUse hardware gating, and urgent live-edit intercept", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-v5-hook-"));
  try {
    const hookScript = path.join(SCRIPTS_DIR, "rudex-hook.js");
    const runHook = (payload) => {
      const res = spawnSync(process.execPath, [hookScript], {
        input: JSON.stringify(payload),
        encoding: "utf8",
        env: Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: tmpDir, RUDEX_SKIP_AUTO_REPATCH: "1" }),
      });
      assert.equal(res.status, 0, res.stderr);
      return JSON.parse(res.stdout || "{}");
    };

    // Configure default profile for all new chats: Read-Only + Parallel subagents + Offline web
    fs.writeFileSync(path.join(tmpDir, "agy_studio_settings.json"), JSON.stringify({
      agentProfileDefault: {
        presetId: "architect-ro",
        presetLabel: "Архитектор (Read-Only)",
        enabled: true,
        applyToNewChats: true,
        subagents: "parallel",
        webSearch: "off",
        browser: "off",
        planFirst: "strict",
        autoVerify: true,
        deepMode: true,
        safetyMode: "readonly",
        pinnedSkills: ["rudex"],
        disabledTools: ["mcp:custom-db"],
      },
    }));
    fs.writeFileSync(path.join(tmpDir, "agy_studio_agent_profile.flag"), "1\n");
    fs.writeFileSync(path.join(tmpDir, "agy_studio_tool_policy.flag"), "1\n");

    // 1. SessionStart auto-claims default profile for new chat and injects directive
    const sRes = runHook({ hookEventName: "SessionStart", conversationId: "conv-new-1", initialNumSteps: 0 });
    assert.ok(Array.isArray(sRes.injectSteps) && sRes.injectSteps.length === 1);
    assert.ok(sRes.injectSteps[0].systemMessage.systemMessage.includes("СУБАГЕНТЫ (ВКЛ)"));
    assert.ok(sRes.injectSteps[0].systemMessage.systemMessage.includes("РЕЖИМ ТОЛЬКО ЧТЕНИЕ"));
    assert.ok(sRes.injectSteps[0].systemMessage.systemMessage.includes("rudex"));

    // 1b. Pending profile configured in brand-new chat ("__new__") WITHOUT applyToNewChats is claimed on first turn & blocks search_web
    fs.writeFileSync(path.join(tmpDir, "agy_studio_settings.json"), JSON.stringify({ agentProfileDefault: { enabled: false, applyToNewChats: false } }));
    fs.writeFileSync(path.join(tmpDir, "agy_studio_chats.json"), JSON.stringify({
      version: 1,
      chats: {},
      pendingNewChatAgentProfile: {
        profile: { enabled: true, subagents: "parallel", webSearch: "off", browser: "auto", planFirst: "auto", safetyMode: "normal" },
        updatedAt: Date.now(),
        claimedBy: "",
      },
    }));
    const pendingSession = runHook({ hookEventName: "SessionStart", conversationId: "conv-brand-new-99", initialNumSteps: 0 });
    assert.ok(Array.isArray(pendingSession.injectSteps) && pendingSession.injectSteps.length === 1);
    assert.ok(pendingSession.injectSteps[0].systemMessage.systemMessage.includes("ВЕБ-ПОИСК (СТРОГО ВЫКЛ)"));
    const pendingDenyWeb = runHook({ hookEventName: "PreToolUse", conversationId: "conv-brand-new-99", toolCall: { name: "search_web", args: { query: "test" } } });
    assert.equal(pendingDenyWeb.decision, "deny", "search_web must be hardware-blocked when user toggled Web Search OFF in a new chat");
    const pendingSubagentDenyWeb = runHook({ hookEventName: "PreToolUse", conversationId: "sub-1", parentConversationId: "conv-brand-new-99", isSubagent: true, toolCall: { name: "search_web", args: { query: "test" } } });
    assert.equal(pendingSubagentDenyWeb.decision, "deny", "Subagents must also inherit parent chat's Web Search OFF policy");
    const pendingAllowSub = runHook({ hookEventName: "PreToolUse", conversationId: "conv-brand-new-99", toolCall: { name: "invoke_subagent", args: { TypeName: "research" } } });
    assert.equal(pendingAllowSub.decision, "allow", "Permitted tools must always receive explicit decision: allow");

    // Restore conv-new-1 profile for remaining checks
    fs.writeFileSync(path.join(tmpDir, "agy_studio_chats.json"), JSON.stringify({
      version: 1,
      chats: {
        "conv-new-1": {
          agentProfile: {
            enabled: true,
            subagents: "parallel",
            webSearch: "off",
            browser: "off",
            planFirst: "strict",
            autoVerify: true,
            deepMode: true,
            safetyMode: "readonly",
            pinnedSkills: ["rudex"],
            disabledTools: ["mcp:custom-db"],
          },
        },
      },
    }));

    // 2. PreToolUse fallback safety: returns explicit "allow" when no block rule matches (never {}!)
    const denyWrite = runHook({ hookEventName: "PreToolUse", conversationId: "conv-new-1", toolCall: { name: "write_file", args: {} } });
    assert.equal(denyWrite.decision, "deny");
    const allowRead = runHook({ hookEventName: "PreToolUse", conversationId: "conv-new-1", toolCall: { name: "read_file", args: {} } });
    assert.equal(allowRead.decision, "allow", "PreToolUse must always return explicit decision: allow when permitting a tool");
    const denyWeb = runHook({ hookEventName: "PreToolUse", conversationId: "conv-new-1", toolCall: { name: "search_web", args: {} } });
    assert.equal(denyWeb.decision, "deny");
    const denyBrowser = runHook({ hookEventName: "PreToolUse", conversationId: "conv-new-1", toolCall: { name: "invoke_subagent", args: { TypeName: "browser" } } });
    assert.equal(denyBrowser.decision, "deny");
    const denyMcp = runHook({ hookEventName: "PreToolUse", conversationId: "conv-new-1", toolCall: { name: "call_mcp_tool", args: { ServerName: "custom-db" } } });
    assert.equal(denyMcp.decision, "deny");

    // 3. Urgent live edit intercepts mutating tool call immediately and delivers instruction
    const qDir = path.join(tmpDir, "studio_live_edits", "queue");
    fs.mkdirSync(qDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "studio_live_edits", "pending.flag"), "1\n");
    fs.writeFileSync(path.join(qDir, "le-urgent-1.json"), JSON.stringify({
      id: "le-urgent-1",
      chatKey: "conv-urgent-2",
      text: "Стой, не меняй CSS, сделай через переменную!",
      urgent: true,
      status: "pending",
      createdAt: Date.now(),
    }));
    const urgentRes = runHook({ hookEventName: "PreToolUse", conversationId: "conv-urgent-2", toolCall: { name: "edit_file", args: {} } });
    assert.equal(urgentRes.decision, "deny");
    assert.ok(urgentRes.reason.includes("СРОЧНАЯ ПРАВКА НА ЛЕТУ"));
    assert.ok(urgentRes.reason.includes("не меняй CSS"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Rudex 5.0 AGY Workshop safely manages Rules, Skills, MCP servers, and blocks path traversal", () => {
  const ws = require(path.join(SCRIPTS_DIR, "agy-workshop.js"));
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-v5-ws-"));
  const fakeGlobal = path.join(tmpRoot, "global-config");
  const fakeWorkspace = path.join(tmpRoot, "my-project");
  fs.mkdirSync(fakeGlobal, { recursive: true });
  fs.mkdirSync(fakeWorkspace, { recursive: true });
  const prevEnv = process.env.RUDEX_AGY_CONFIG_DIR;
  process.env.RUDEX_AGY_CONFIG_DIR = fakeGlobal;
  try {
    // Save, toggle off, toggle on, and list Rule
    const r1 = ws.saveRule({ scope: "global", fileName: "russian-style.md", body: "Отвечай кратко и по делу." });
    assert.equal(r1.ok, true);
    assert.ok(fs.existsSync(r1.path));

    const rOff = ws.saveRule({ path: r1.path, enabled: false });
    assert.equal(rOff.ok, true);
    assert.ok(rOff.path.endsWith(".md.disabled"));

    // Create Skill with YAML frontmatter
    const s1 = ws.saveSkill({ scope: "workspace", workspacePath: fakeWorkspace, name: "Deploy Helper", description: "Deploys app cleanly", body: "# Steps\n1. Run build" });
    assert.equal(s1.ok, true);
    const skillText = fs.readFileSync(s1.path, "utf8");
    assert.ok(skillText.includes("name: Deploy Helper") && skillText.includes("description: Deploys app cleanly"));

    // Save, disable, and delete MCP server
    const m1 = ws.saveMcpServer({ scope: "global", name: "demo-mcp", command: "npx", argsText: "-y demo-server" });
    assert.equal(m1.ok, true);
    const listed = ws.listCustomizations({ workspacePath: fakeWorkspace });
    assert.equal(listed.ok, true);
    assert.ok(listed.rules.some((r) => r.fileName === "russian-style.md" && r.enabled === false));
    assert.ok(listed.skills.some((s) => s.name === "Deploy Helper" && s.scope === "workspace"));
    assert.ok(listed.mcpServers.some((m) => m.name === "demo-mcp" && m.command === "npx"));

    // Security: block path traversal outside config/workspace roots
    const badDel = ws.deleteRule({ path: path.join(os.tmpdir(), "outside-file.md"), workspacePath: fakeWorkspace });
    assert.equal(badDel.ok, false);
    assert.equal(badDel.error, "PATH_NOT_ALLOWED");
  } finally {
    if (prevEnv === undefined) delete process.env.RUDEX_AGY_CONFIG_DIR;
    else process.env.RUDEX_AGY_CONFIG_DIR = prevEnv;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("Rudex 5.0 polish: Auto-default toggles, clean single borders, valid Studio CSS tokens, and Screenshot Pencil Annotator", () => {
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const ann = require(path.join(RES_DIR, "rudex-annotator.js"));
  const te = require(path.join(RES_DIR, "theme-engine.js"));

  // 1. Extra Shadow CSS must never reference undefined --rx-bg-elev token
  const extraCss = v5Core.rv5BuildExtraShadowCss();
  assert.equal(extraCss.includes("--rx-bg-elev"), false, "Must use real studio-styles.js tokens, never nonexistent --rx-bg-elev");
  assert.ok(extraCss.includes(".rx-annotator-shell"), "Must include Screenshot Annotator CSS");

  // 2. No confusing "Full Turbo" default; all toggles default to Auto
  assert.equal(v5Core.RUDEX_AGENT_PROFILE_DEFAULTS.enabled, false);
  assert.equal(v5Core.RUDEX_AGENT_PROFILE_DEFAULTS.subagents, "auto");
  assert.equal(v5Core.RUDEX_AGENT_PRESETS.some((p) => p.id === "turbo"), false, "Legacy 'turbo' preset must not exist");
  const dockHtml = v5Ui.rv5BuildChatDockHtml({
    agentProfile: v5Core.RUDEX_AGENT_PROFILE_DEFAULTS,
    defaultProfile: v5Core.RUDEX_AGENT_PROFILE_DEFAULTS,
    liveEdits: [{ id: "le-q1", text: "Проверь цвета", status: "pending", createdAt: Date.now() }],
    isGenerating: true,
    hasComposerText: true,
    liveEditInline: { enabled: true, showChatDock: true, showInChat: true, showQueueStrip: false },
    popoverOpen: false,
    isRu: true,
  });
  assert.ok(dockHtml.includes("Инструменты · Авто"), "Default dock chip must show Auto cleanly");
  assert.equal(dockHtml.includes('data-action="open-annotator"'), false, "Chat dock must NOT render a standalone Screen button");
  assert.equal(dockHtml.includes('data-action="send-inline-live-edit"'), false, "Chat dock must NOT render a standalone Live Edit button");
  assert.equal(dockHtml.includes("rx-live-queue-strip"), false, "Weird queue strip above composer must stay hidden by default when showQueueStrip is false");

  // 2a. Live edits stay anchored right next to the user's preceding message by default (and optionally after agent reply)
  const { doc: chatDoc } = createMockDom();
  const chatMain = chatDoc.createElement("main");
  const user0 = chatDoc.createElement("div");
  user0.setAttribute("data-testid", "user-message-bubble");
  user0.textContent = "Первый запрос пользователя";
  const resp0 = chatDoc.createElement("div");
  resp0.setAttribute("data-testid", "agent-response");
  const user1 = chatDoc.createElement("div");
  user1.setAttribute("data-testid", "user-message-bubble");
  user1.textContent = "Второй запрос пользователя";
  const resp1 = chatDoc.createElement("div");
  resp1.setAttribute("data-testid", "agent-response");
  chatMain.appendChild(user0);
  chatMain.appendChild(resp0);
  chatMain.appendChild(user1);
  chatMain.appendChild(resp1);
  chatDoc.body.appendChild(chatMain);
  let canceledLiveId = "";
  const sampleLiveEdits = [
    { id: "le-legacy", text: "Старое без якоря", status: "delivered", deliveredAt: Date.now() },
    { id: "le-c0", text: "Дополнение к первому сообщению", status: "delivered", anchorUserCount: 1, anchorUserText: "Первый запрос пользователя", anchorRespIdx: 0, deliveredAt: Date.now() },
    { id: "le-c1", text: "Сделай красиво в чате", images: [{ name: "shot.png", previewDataUrl: "data:image/png;base64,AA==" }], files: [{ name: "spec.pdf" }], status: "pending", anchorUserCount: 2, anchorUserText: "Второй запрос пользователя", anchorRespIdx: 1, createdAt: Date.now() },
  ];
  v5Ui.rv5SyncLiveChatBubbles(chatDoc, {
    liveEdits: sampleLiveEdits,
    liveEditInline: { enabled: true, showInChat: true, chatBubbleStyle: "accent", chatBubblePos: "after-user" },
    isRu: true,
    isLight: false,
    accentColor: "#d97757",
    onCancel: (id) => { canceledLiveId = id; },
  });
  const slotU0 = chatDoc.querySelector('[data-rudex-live-slot="user-0"]');
  const slotU1 = chatDoc.querySelector('[data-rudex-live-slot="user-1"]');
  assert.ok(slotU0 && slotU1, "Each user message with a live edit must get its own adjacent slot");
  assert.ok(slotU0.innerHTML.includes("Дополнение к первому сообщению") && slotU0.innerHTML.includes("Учтено агентом"));
  assert.equal(slotU0.innerHTML.includes('data-rx-cb-act="dismiss"'), false, "Delivered live edits must not show a close cross button");
  assert.equal(slotU0.innerHTML.includes("Старое без якоря"), false, "Unanchored legacy delivered items must never appear");
  assert.ok(slotU1.innerHTML.includes("Сделай красиво в чате") && slotU1.innerHTML.includes("is-accent"));
  assert.ok(slotU1.innerHTML.includes("rx-cb-img") && slotU1.innerHTML.includes("spec.pdf"), "Live bubble must render both attached image previews and file chips");

  // Disabling showDeliveredBadge hides "Учтено агентом" on delivered edits while keeping pending queue controls
  v5Ui.rv5SyncLiveChatBubbles(chatDoc, {
    liveEdits: sampleLiveEdits,
    liveEditInline: { enabled: true, showInChat: true, showDeliveredBadge: false, chatBubbleStyle: "native", chatBubblePos: "after-user" },
    isRu: true,
  });
  assert.equal(chatDoc.querySelector('[data-rudex-live-slot="user-0"]').innerHTML.includes("Учтено агентом"), false, "Disabling showDeliveredBadge must hide delivered status text");
  assert.ok(chatDoc.querySelector('[data-rudex-live-slot="user-1"]').innerHTML.includes("Отменить"), "Pending edit must still keep Cancel button");
  assert.equal(chatMain.children[0], user0);
  assert.equal(chatMain.children[1], slotU0, "Live edit must appear right under user0 (before resp0)");
  assert.equal(chatMain.children[2], resp0);
  assert.equal(chatMain.children[3], user1);
  assert.equal(chatMain.children[4], slotU1, "Second live edit must appear right under user1 (before resp1)");
  v5Ui.rv5SyncLiveChatBubbles(chatDoc, {
    liveEdits: sampleLiveEdits,
    liveEditInline: { enabled: true, showInChat: false },
    isRu: true,
  });
  assert.equal(chatDoc.querySelector('[data-rudex-live-slot]'), null, "Disabling showInChat must remove all anchored live slots");
  assert.equal(canceledLiveId, "");

  // 2b. Contextual image pencil edit triggers appear directly on opened image dialog & composer thumbnails
  const { doc: imgDoc } = createMockDom();
  const dlg = imgDoc.createElement("div");
  dlg.setAttribute("role", "dialog");
  const bigImg = imgDoc.createElement("img");
  bigImg.setAttribute("src", "data:image/png;base64,iVBORw0KGgo=");
  bigImg.getBoundingClientRect = () => ({ left: 100, top: 80, width: 640, height: 360, right: 740, bottom: 440 });
  dlg.appendChild(bigImg);
  imgDoc.body.appendChild(dlg);

  const comp = imgDoc.createElement("div");
  comp.setAttribute("data-rudex-theme-composer", "1");
  const thumbWrap = imgDoc.createElement("div");
  const thumbImg = imgDoc.createElement("img");
  thumbImg.setAttribute("src", "data:image/png;base64,iVBORw0KGgo=");
  thumbImg.getBoundingClientRect = () => ({ left: 20, top: 600, width: 48, height: 48, right: 68, bottom: 648 });
  thumbWrap.appendChild(thumbImg);
  comp.appendChild(thumbWrap);
  imgDoc.body.appendChild(comp);

  const editedCalls = [];
  v5Ui.rv5InjectImageEditTriggers(imgDoc, true, (info) => editedCalls.push(info));
  const lbBtn = dlg.querySelector('[data-rudex-img-edit-btn="lightbox"]');
  const thBtn = thumbWrap.querySelector('[data-rudex-img-edit-btn="thumb"]');
  assert.ok(lbBtn, "Opened screenshot dialog must receive contextual Edit button");
  assert.ok(thBtn, "Composer attached image thumbnail must receive contextual pencil trigger");
  lbBtn.dispatchEvent({ type: "click", target: lbBtn, preventDefault() {}, stopPropagation() {} });
  thBtn.dispatchEvent({ type: "click", target: thBtn, preventDefault() {}, stopPropagation() {} });
  assert.equal(editedCalls.length, 2);
  assert.equal(editedCalls[0].fromLightbox, true);
  assert.equal(editedCalls[1].fromLightbox, false);

  // 3. Theme CSS prevents protruding sidebar border, double composer border/ring, opaque Radix Dialog backdrops, and layout shift on collapsibles
  const claudeCss = te.buildThemeCss(te.normalizeAppearance({ presetId: "claude-code-dark", borderPreset: "crisp", typography: { uiFont: "claude-mono-ui" } }), { hostIsLight: false });
  assert.equal(claudeCss.includes('[data-rudex-bg-sidebar="1"]:not([data-rudex-bg-sidebar="1"] *)'), false, "Must not add redundant protruding sidebar border-right");
  assert.ok(claudeCss.includes(':not([data-state]):not([aria-hidden="true"]):not([role="dialog"]):not([role="alertdialog"])'), "bg-shell CSS must guard against modal overlays/backdrops");
  assert.ok(claudeCss.includes("--tw-ring-shadow: 0 0 #0000 !important;"), "Inner composer wrappers must strip Tailwind focus rings");
  assert.ok(claudeCss.includes('[data-rudex-theme-composer="1"] *:not(code):not(pre)'), "UI font must apply across entire composer bottom bar");
  assert.equal(claudeCss.includes('[data-slot="collapsible"]:has(> button)'), false, "Must not apply layout-shifting rules to generic collapsibles on Cancel");

  // 3a. Radix Dialog portal backdrop mounted under body outside #root must NEVER get data-rudex-bg-shell="1"
  const { doc: portalDoc, win: portalWin } = createMockDom();
  const appRoot = portalDoc.createElement("div");
  appRoot.id = "root";
  appRoot.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1400, bottom: 900, width: 1400, height: 900 });
  portalDoc.body.appendChild(appRoot);
  const radixBackdrop = portalDoc.createElement("div");
  radixBackdrop.setAttribute("data-state", "open");
  radixBackdrop.className = "fixed inset-0 z-50 bg-black/50";
  radixBackdrop.style.position = "fixed";
  radixBackdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  radixBackdrop.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1400, bottom: 900, width: 1400, height: 900 });
  portalDoc.body.appendChild(radixBackdrop);
  portalDoc.elementsFromPoint = () => [radixBackdrop, appRoot, portalDoc.body];
  const portalTe = te.createThemeEngine({ document: portalDoc, window: portalWin });
  portalTe.apply({ presetId: "claude-code-dark", borderPreset: "crisp" });
  assert.equal(radixBackdrop.getAttribute("data-rudex-bg-shell"), null, "Radix Dialog backdrop must NEVER be marked as opaque bg-shell");
  portalTe.destroy();

  // 3b. PreInvocation live-edit hook emits strict protojson without snake_case metadata.user_markdown
  const tmpHookDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-protojson-"));
  try {
    const qDir = path.join(tmpHookDir, "studio_live_edits", "queue");
    fs.mkdirSync(qDir, { recursive: true });
    fs.writeFileSync(path.join(tmpHookDir, "studio_live_edits", "pending.flag"), "1\n");
    fs.writeFileSync(path.join(qDir, "le-1.json"), JSON.stringify({
      id: "le-1",
      chatKey: "conv-live-1",
      text: "Сделай шрифт крупнее",
      images: [{ name: "shot.png", path: "C:/tmp/shot.png" }],
      files: [{ name: "brief.pdf", path: "C:/tmp/brief.pdf" }],
      status: "pending",
      createdAt: Date.now(),
    }));
    const r = spawnSync(process.execPath, [path.join(SCRIPTS_DIR, "rudex-hook.js")], {
      input: JSON.stringify({ hookEventName: "PreInvocation", conversationId: "conv-live-1", initialNumSteps: 2 }),
      encoding: "utf8",
      env: Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: tmpHookDir, RUDEX_SKIP_AUTO_REPATCH: "1" }),
    });
    assert.equal(r.status, 0, r.stderr);
    const parsed = JSON.parse(r.stdout || "{}");
    assert.ok(Array.isArray(parsed.injectSteps) && parsed.injectSteps.length === 1);
    assert.ok(parsed.injectSteps[0].systemMessage.systemMessage.includes("Сделай шрифт крупнее"));
    assert.ok(parsed.injectSteps[0].systemMessage.systemMessage.includes("C:/tmp/shot.png"), "PreInvocation must include attached screenshots");
    assert.ok(parsed.injectSteps[0].systemMessage.systemMessage.includes("C:/tmp/brief.pdf"), "PreInvocation must include attached files");
    assert.equal("metadata" in parsed.injectSteps[0].systemMessage, false, "PreInvocation systemMessage must not include snake_case metadata that breaks protojson unmarshal");
    assert.equal("terminationBehavior" in parsed, false, "PreInvocation should omit empty terminationBehavior");
  } finally {
    fs.rmSync(tmpHookDir, { recursive: true, force: true });
  }

  // 4. Screenshot Pencil Annotator module & drawing primitives
  assert.ok(ann.RUDEX_ANNOTATOR_TOOLS.some((t) => t.id === "pencil"));
  assert.ok(ann.RUDEX_ANNOTATOR_TOOLS.some((t) => t.id === "arrow"));
  const { doc, win } = createMockDom();
  const mount = doc.createElement("div");
  const ctrl = ann.createScreenshotAnnotator({
    mountEl: mount,
    doc,
    win,
    invokeIpc: async () => ({ ok: false }),
    getLocale: () => "ru",
    isGenerating: () => false,
  });
  ctrl.open({ dataUrl: "data:image/png;base64,iVBORw0KGgo=" });
  assert.equal(ctrl.isOpen(), true);
  assert.ok(mount.innerHTML.includes("Карандаш") && mount.innerHTML.includes("Вставить в чат"));
  ctrl.handleKeydown({ key: "Escape" });
  assert.equal(ctrl.isOpen(), false);

  // 5. Chat dock hides when overlapped by native Radix menu/popover & Agent Tools never auto-closes on stream tick
  const spSrc = fs.readFileSync(path.join(RES_DIR, "studio-panel.js"), "utf8");
  assert.ok(spSrc.includes("function hasOverlappingNativePopover("), "studio-panel.js must detect overlapping native popovers/menus");
  assert.equal(spSrc.includes("if (!wasGenBeforeTick && (tel.isGenerating || snap.isGenerating) && state.agentPopoverOpen)"), false, "sampleStreamTick must not auto-close Agent Tools popover mid-reading");
});

test("Rudex 5.0 composer drafts (per-chat & new chat text+files) and last-20 user input history", () => {
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const Module = require("module");
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-drafts-hist-"));
  const origLoad = Module._load;
  const mockClipboard = { text: "", image: null };
  const fakeElectron = {
    app: {
      getPath: (k) => (k === "userData" ? tmpUserData : tmpUserData),
      on: () => {},
    },
    ipcMain: { handle: () => {}, on: () => {} },
    webContents: { getAllWebContents: () => [] },
    dialog: {},
    shell: { showItemInFolder: () => {} },
    protocol: {},
    BrowserWindow: { getAllWindows: () => [] },
    clipboard: {
      writeText: (t) => { mockClipboard.text = t; },
      writeImage: (im) => { mockClipboard.image = im; },
    },
    nativeImage: {
      createFromPath: () => ({ isEmpty: () => true }),
    },
  };
  try {
    Module._load = function (req, parent, isMain) {
      if (req === "electron") return fakeElectron;
      return origLoad.apply(this, arguments);
    };
    const mainModPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainModPath)];
    const i18nMain = require(mainModPath);

    // 1. Composer drafts: save text + screenshot + PDF for both a chat & __new__ (enabled by default)
    const pngDataUrl = "data:image/png;base64," + Buffer.from("PNGDATA123456").toString("base64");
    const pdfDataUrl = "data:application/pdf;base64," + Buffer.from("%PDF-1.4 sample").toString("base64");
    const savedChat = i18nMain.saveComposerDraft({
      chatKey: "chat-draft-1",
      title: "Мой чат",
      text: "Долгий недописанный промпт\nсо второй строкой",
      attachments: [
        { name: "screen.png", mime: "image/png", isImage: true, dataUrl: pngDataUrl },
        { name: "doc.pdf", mime: "application/pdf", isImage: false, dataUrl: pdfDataUrl },
      ],
    });
    assert.equal(savedChat.ok, true);
    assert.equal(savedChat.draft.attachments.length, 2);
    const savedNew = i18nMain.saveComposerDraft({
      chatKey: "__new__",
      text: "Черновик нового чата",
      attachments: [],
    });
    assert.equal(savedNew.ok, true);

    // Re-saving draft reusing existing fileName preserves the persisted file without losing data
    const reused = i18nMain.saveComposerDraft({
      chatKey: "chat-draft-1",
      title: "Мой чат",
      text: "Долгий недописанный промпт — обновил!",
      attachments: [
        { name: "screen.png", mime: "image/png", isImage: true, fileName: savedChat.draft.attachments[0].fileName },
      ],
    });
    assert.equal(reused.ok, true);
    assert.equal(reused.draft.attachments.length, 1);

    const restored = i18nMain.getComposerDraftWithData("chat-draft-1");
    assert.equal(restored.ok, true);
    assert.equal(restored.draft.text, "Долгий недописанный промпт — обновил!");
    assert.equal(restored.draft.attachments.length, 1);
    assert.equal(restored.draft.attachments[0].dataUrl, pngDataUrl);

    const restoredNew = i18nMain.getComposerDraftWithData("__new__");
    assert.equal(restoredNew.draft.text, "Черновик нового чата");

    // Orphaned PDF file must be pruned after being removed from draft
    const draftMediaFiles = fs.readdirSync(path.join(tmpUserData, "studio_drafts_media"));
    assert.equal(draftMediaFiles.length, 1, "Orphaned draft attachment files must be pruned automatically");

    // Clearing draft removes it and cleans up disk media
    i18nMain.clearComposerDraft({ chatKey: "chat-draft-1" });
    assert.equal(i18nMain.getComposerDraftWithData("chat-draft-1").draft, null);
    assert.equal(fs.readdirSync(path.join(tmpUserData, "studio_drafts_media")).length, 0);

    // 2. Last-20 input history: record 24 items -> capped strictly at 20, newest first, old media pruned
    for (let i = 1; i <= 24; i += 1) {
      const rec = i18nMain.recordInputHistoryItem({
        chatKey: "chat-hist-1",
        title: "Рабочий чат",
        text: `Сообщение номер ${i}`,
        source: i % 5 === 0 ? "live-edit" : "chat",
        attachments: i <= 2 || i === 24
          ? [{ name: `file-${i}.pdf`, mime: "application/pdf", isImage: false, dataUrl: pdfDataUrl }]
          : [],
      });
      assert.equal(rec.ok, true);
    }
    const histUi = i18nMain.getInputHistoryForUi();
    assert.equal(histUi.enabled, true, "Input history must be enabled by default");
    assert.equal(histUi.draftsEnabled, true, "Composer drafts must be enabled by default");
    assert.equal(histUi.items.length, 20, "Input history must cap strictly at 20 messages");
    assert.equal(histUi.items[0].text, "Сообщение номер 24");
    assert.equal(histUi.items[19].text, "Сообщение номер 5");
    assert.equal(histUi.items[0].attachments.length, 1);
    assert.equal(histUi.items[0].attachments[0].exists, true);
    // Files from evicted items #1 and #2 must have been pruned, leaving only file-24.pdf
    const histMediaFiles = fs.readdirSync(path.join(tmpUserData, "studio_history_media"));
    assert.equal(histMediaFiles.length, 1, "Evicted history item files must be pruned from disk");

    // Delete single item & clear all
    const afterDel = i18nMain.deleteInputHistoryItem(histUi.items[1].id);
    assert.equal(afterDel.items.length, 19);

    // 3. UI renderer for Settings -> Input History & Drafts
    const uiHtml = v5Ui.rv5RenderInputHistoryHtml({
      isRu: true,
      composerDraftsEnabled: true,
      inputHistoryEnabled: true,
      draftCount: 1,
      items: histUi.items,
      loading: false,
    });
    assert.ok(uiHtml.includes("Автосохранение черновиков (текст и файлы)"));
    assert.ok(uiHtml.includes("История последних 20 сообщений и файлов"));
    assert.ok(uiHtml.includes("Сообщение номер 24"));
    assert.ok(uiHtml.includes('data-action="copy-history-text"'));
    assert.ok(uiHtml.includes('data-action="copy-history-file"'));
    assert.ok(uiHtml.includes('data-action="toggle-composer-drafts"'));
    assert.ok(uiHtml.includes('data-action="toggle-input-history"'));

    const afterClear = i18nMain.clearInputHistory();
    assert.equal(afterClear.items.length, 0);
    assert.equal(fs.readdirSync(path.join(tmpUserData, "studio_history_media")).length, 0);
  } finally {
    Module._load = origLoad;
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

test("Element inspector displays real computed values with sliders/reset and all 13 themes style highlights & light mode cleanly", () => {
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  Object.assign(global, v5Core);
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));

  // 1. elementOverrides normalization must NOT coerce "" into 0px, and supports opacity + expanded bounds
  const normOvs = normalizeAppearance({
    elementOverrides: [
      {
        id: "ov-test",
        name: "Композер",
        selector: '[data-rudex-theme-composer="1"]',
        styles: {
          borderRadius: "",
          padding: "",
          borderWidth: "",
          fontSize: "16",
          opacity: "85",
        },
      },
    ],
  }).elementOverrides;
  assert.equal(normOvs.length, 1);
  assert.equal(normOvs[0].styles.borderRadius, -1, "Empty borderRadius must stay unset (-1), not 0");
  assert.equal(normOvs[0].styles.padding, -1, "Empty padding must stay unset (-1), not 0");
  assert.equal(normOvs[0].styles.borderWidth, -1, "Empty borderWidth must stay unset (-1), not 0");
  assert.equal(normOvs[0].styles.fontSize, 16);
  assert.equal(normOvs[0].styles.opacity, 85);

  const ovCss = buildThemeCss({ presetId: "claude-code-dark", elementOverrides: normOvs });
  assert.ok(ovCss.includes("font-size: 16px !important;"));
  assert.ok(ovCss.includes("opacity: 0.85 !important;"));
  assert.equal(ovCss.includes("border-radius: 0px !important;"), false, "Unset borderRadius must not emit 0px");

  // 2. Element Inspector HTML shows live computed numbers, paired range+number controls, per-field reset & sticky full reset
  const inspHtml = v5Ui.rv5BuildElementInspectorHtml(
    {
      name: "Поле ввода",
      selector: '[data-rudex-theme-composer="1"]',
      scope: "exact",
      canToggleScope: true,
      computed: {
        fontSize: 14,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        width: 720,
        minHeight: 84,
        opacity: 100,
        bgOpacity: 100,
        color: "#faf9f5",
        bgColor: "#262624",
        borderColor: "#3a3935",
      },
    },
    { elementOverrides: [{ id: "ov-1", selector: '[data-rudex-theme-composer="1"]', styles: { borderRadius: 22 } }] },
    [],
    [],
    true
  );
  assert.equal(inspHtml.includes('placeholder="auto"'), false, "Inspector must never show empty 'auto' placeholders");
  assert.ok(inspHtml.includes("сейчас 14px"), "Inspector must display live computed fontSize");
  assert.ok(inspHtml.includes("сейчас 12px"), "Inspector must display live computed padding");
  assert.ok(inspHtml.includes("сейчас 720px"), "Inspector must display live computed width");
  assert.ok(inspHtml.includes('data-insp-range="borderRadius"') && inspHtml.includes('data-insp-num="borderRadius"'));
  assert.ok(inspHtml.includes('value="22"'), "Inspector must display custom overridden borderRadius");
  assert.ok(inspHtml.includes('data-action="inspector-clear-style" data-prop="borderRadius"'));
  assert.ok(inspHtml.includes('data-action="inspector-reset-element"'));
  assert.ok(inspHtml.includes("rx-insp-footer"));

  // 3. Light themes: glare-free non-#ffffff surfaces, dark-class neutralization, tablist & border fixes
  for (const lightId of ["claude-code-light", "light-paper", "nordic-frost"]) {
    const preset = THEME_PRESETS.find((p) => p.id === lightId);
    assert.ok(preset && preset.mode === "light");
    assert.notEqual(preset.vars.canvasBg.toLowerCase(), "#ffffff", `${lightId} canvasBg must not be blinding #ffffff`);
    assert.notEqual(preset.vars.cardBg.toLowerCase(), "#ffffff", `${lightId} cardBg must not be blinding #ffffff`);
    const css = buildThemeCss({ presetId: lightId }, { hostIsLight: true });
    assert.ok(css.includes("color-scheme: light !important;"), `${lightId} must force light color-scheme`);
    assert.ok(css.includes('[role="tablist"]'), `${lightId} must style [role="tablist"] so tabs never stay black`);
    assert.ok(css.includes('[class~="text-white/80"]'), `${lightId} must neutralize dark-mode text-white/* utility classes`);
    assert.ok(css.includes('[class~="bg-white/10"]'), `${lightId} must neutralize bg-white/10 surfaces`);
    assert.ok(css.includes('[data-rudex-theme-composer="1"] button:where([class~="bg-white"]'), `${lightId} must theme composer send button`);
  }

  // 4. Glass themes without wallpaper: transparent #root over radial ambient backdrop + padded glass cards
  for (const glassId of ["liquid-glass", "obsidian-glass", "midnight-neon"]) {
    const css = buildThemeCss({ presetId: glassId });
    assert.ok(css.includes("radial-gradient("), `${glassId} must render ambient radial backdrop without wallpaper`);
    assert.ok(css.includes("#root, #app {\n  background-color: transparent !important;"), `${glassId} must keep #root transparent over backdrop`);
    assert.ok(css.includes("padding: 16px 18px !important;"), `${glassId} agent card must have comfortable vertical & horizontal padding`);
  }

  // 5. All non-native themes unify accent highlights (switches, tabs, menus, tinted badges, send button)
  for (const preset of THEME_PRESETS) {
    if (preset.id === "native" || preset.id === "custom") continue;
    const css = buildThemeCss({ presetId: preset.id });
    assert.ok(css.includes('[role="switch"][data-state="checked"]'), `${preset.id} must theme checked switches`);
    assert.ok(css.includes('[role="menuitem"]'), `${preset.id} must theme menu highlights`);
    assert.ok(css.includes('[class~="bg-blue-500/10"]'), `${preset.id} must re-tint blue utility badges`);
    assert.ok(css.includes(`accent-color: ${preset.vars.accentColor} !important;`), `${preset.id} must set accent-color`);
  }
});

test("Docked-by-default mini-widget & limits widget, floating switch, corner/font controls, and accurate live quota calculation", () => {
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  Object.assign(global, v5Core);
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const Module = require("module");
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-widgets-quota-"));
  const origLoad = Module._load;
  const ipcHandlers = {};
  const sentMessages = [];
  const fakeWc = { isDestroyed: () => false, send: (ch, data) => sentMessages.push({ ch, data }) };
  const fakeElectron = {
    app: { getPath: () => tmpUserData, on: () => {} },
    ipcMain: { handle: (ch, fn) => { ipcHandlers[ch] = fn; }, on: () => {} },
    webContents: { getAllWebContents: () => [fakeWc] },
    dialog: {},
    shell: { showItemInFolder: () => {} },
    protocol: {},
    BrowserWindow: { getAllWindows: () => [] },
    clipboard: { writeText: () => {}, writeImage: () => {} },
    nativeImage: { createFromPath: () => ({ isEmpty: () => true }) },
  };
  try {
    Module._load = function (req) {
      if (req === "electron") return fakeElectron;
      return origLoad.apply(this, arguments);
    };
    const mainModPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainModPath)];
    const i18nMain = require(mainModPath);
    if (typeof i18nMain.registerI18nIpc === "function") i18nMain.registerI18nIpc();

    // 1. Mini-widget & Limits widget default to pinned=true (docked UI) and support all corner/UI slots + font/width controls
    const defSettings = i18nMain.sanitizeStudioSettings({});
    assert.equal(defSettings.pinned, true, "Mini-widget must default to pinned (part of UI)");
    assert.equal(defSettings.layoutMode, "docked");
    assert.equal(defSettings.studioUi.widgetFont, "inherit");
    assert.equal(defSettings.studioUi.widgetFontSize, 12);
    assert.equal(defSettings.limitsWidget.pinned, true, "Limits widget must default to pinned (part of UI)");

    const headerDock = i18nMain.sanitizeStudioSettings({ dockPosition: "inline-header", studioUi: { widgetFont: "jetbrains", widgetFontSize: 15 } });
    assert.equal(headerDock.dockPosition, "inline-header");
    assert.equal(headerDock.studioUi.widgetFont, "jetbrains");
    assert.equal(headerDock.studioUi.widgetFontSize, 15);
    assert.equal(i18nMain.sanitizeStudioSettings({ dockPosition: "top-left" }).dockPosition, "top-left");

    const customLim = i18nMain.sanitizeLimitsWidget({ enabled: true, position: "sidebar-bottom", width: 260, fontSize: 15, scale: 115, pinned: false });
    assert.equal(customLim.position, "top-right", "Deprecated sidebar-bottom must auto-migrate to safe top-right");
    assert.equal(customLim.width, 260);
    assert.equal(customLim.fontSize, 15);
    assert.equal(customLim.scale, 115);
    assert.equal(customLim.pinned, false);

    // 2. Limits widget HTML adapts to theme surface, omits manual refresh button, shows docked vs floating classes & pin toggle
    const dockedLimHtml = v5Core.rv5BuildLimitsWidgetHtml(
      { enabled: true, pinned: true, position: "top-right", layout: "bars", fontSize: 14, width: 250, bgOpacity: 92 },
      { families: { gemini: { fiveHourRem: 74, weeklyRem: 23, fiveHourEstimated: true, fiveHourReset: "2ч 10м", weeklyReset: "5 д" }, claudeGpt: { fiveHourRem: null, weeklyRem: 68, weeklyReset: "6 д" } } },
      "Gemini 4 Neon",
      true,
      false
    );
    assert.ok(dockedLimHtml.includes("is-docked-ui"), "Pinned limits widget must render with is-docked-ui class");
    assert.ok(dockedLimHtml.includes("var(--rx-theme-surface"), "Limits widget must adapt background to active theme surface");
    assert.ok(dockedLimHtml.includes('data-action="toggle-limits-pin"'), "Limits widget must expose quick dock/float pin button");
    assert.equal(dockedLimHtml.includes('data-action="sync-limits-now"'), false, "Limits widget must NOT show manual refresh button (auto-syncs)");
    assert.ok(dockedLimHtml.includes("~74%"), "Estimated live 5h drop must render with ~ prefix");
    assert.ok(dockedLimHtml.includes("68%") && !dockedLimHtml.includes("100%"), "1-bucket family must not render fake 100% for absent 5h bucket");

    // 3. Limits settings UI exposes docked/floating mode switcher, safe corners (no sidebar-bottom), font, size, width & auto-sync badge
    const limTabHtml = v5Ui.rv5RenderLimitsTabHtml({
      limitsWidget: customLim,
      quotaSummary: {},
      activeModelName: "Gemini 4 Neon",
      systemFonts: [],
      monitorHtml: "",
      exportHtml: "",
      isRu: true,
      isLight: true,
    });
    assert.ok(limTabHtml.includes('data-action="set-limits-window-mode"'));
    assert.equal(limTabHtml.includes('data-val="sidebar-bottom"'), false, "Sidebar-overlapping position must not be offered");
    assert.ok(limTabHtml.includes('data-action="set-limits-position" data-val="top-right"'));
    assert.ok(limTabHtml.includes('data-limits-field="width"'));
    assert.ok(limTabHtml.includes('data-limits-field="fontSize"'));
    assert.ok(limTabHtml.includes("Автосинхронизация"));

    // 3b. Live-edit chat bubbles MUST match by anchorUserText and NEVER attach past delivered edits to a new message under DOM virtualization
    const { doc: leDoc } = createMockDom();
    const leMain = leDoc.createElement("main");
    const newUserBubble = leDoc.createElement("div");
    newUserBubble.setAttribute("data-testid", "user-message-bubble");
    const newUserContent = leDoc.createElement("div");
    newUserContent.setAttribute("data-testid", "user-message-content");
    newUserContent.textContent = "Совершенно новое сообщение пользователя";
    newUserBubble.appendChild(newUserContent);
    leMain.appendChild(newUserBubble);
    leDoc.body.appendChild(leMain);
    v5Ui.rv5SyncLiveChatBubbles(leDoc, {
      liveEdits: [
        { id: "old-legacy", text: "Старая правка без текста якоря", status: "delivered", anchorUserCount: 1 },
        { id: "old-past", text: "Правка к прошлому ушедшему сообщению", status: "delivered", anchorUserCount: 1, anchorUserText: "Старый запрос час назад" },
        { id: "cur-match", text: "Правка именно к новому сообщению", status: "delivered", anchorUserCount: 1, anchorUserText: "Совершенно новое сообщение пользователя" },
      ],
      liveEditInline: { enabled: true, showInChat: true },
      isRu: true,
    });
    const renderedSlots = leDoc.querySelectorAll("[data-rudex-live-slot]");
    const slotText = renderedSlots.length > 0 ? renderedSlots[0].innerHTML : "";
    assert.ok(slotText.includes("Правка именно к новому сообщению"), "Matching anchorUserText edit must render under its exact user message");
    assert.equal(slotText.includes("Старая правка без текста якоря"), false, "Legacy delivered edit without anchorUserText must NOT leak onto a new message");
    assert.equal(slotText.includes("Правка к прошлому ушедшему сообщению"), false, "Past virtualized turn edit must NOT attach to a newer user message");

    // 3c. Studio subtab-bar wraps cleanly so right-edge tabs never clip without a scrollbar
    const stCss = buildStudioStyles();
    assert.ok(/\.subtab-bar\s*\{[^}]*flex-wrap:\s*wrap/.test(stCss), ".subtab-bar must wrap cleanly instead of clipping tabs off-screen");

    // 4. Quota parser inverts "% used" / "% использовано" into remaining %
    const usedParsed = parseQuotaFromDocumentText("Usage\nGemini Models\n5h limit 35% used\nResets in 3h 20m\nWeekly limit 77% used\nResets in 5d", "Gemini 4");
    assert.equal(usedParsed.gemini.fiveHourRem, 65, "35% used must convert to 65% remaining");
    assert.equal(usedParsed.gemini.weeklyRem, 23, "77% used must convert to 23% remaining");

    // 5. Live quota sync: pending turns decrement displayed 5h/weekly remaining & 1-bucket sync clears stale 5h=100%
    if (ipcHandlers["agy-studio:sync-quota-snapshot"] && ipcHandlers["agy-studio:record-quota-turn"]) {
      const s1 = ipcHandlers["agy-studio:sync-quota-snapshot"]({}, {
        activeChatKey: "chat-q1",
        gemini: { fiveHourRem: 100, weeklyRem: 30, fiveHourReset: "4ч", weeklyReset: "5 д" },
      });
      assert.equal(s1.summary.families.gemini.fiveHourRem, 100);
      assert.ok(sentMessages.some((m) => m.ch === "agy-studio:quota-updated"), "Quota sync must broadcast agy-studio:quota-updated");

      // Record heavy turn -> displayed 5h remaining must drop below 100% live without waiting for manual refresh
      const afterTurn = ipcHandlers["agy-studio:record-quota-turn"]({}, {
        chatKey: "chat-q1",
        title: "Heavy chat",
        modelName: "Gemini 4 Neon",
        outputTokens: 60000,
        contextTokens: 200000,
      });
      assert.ok(afterTurn.summary.families.gemini.fiveHourRem < 100, `Expected live 5h remaining < 100 after turn, got ${afterTurn.summary.families.gemini.fiveHourRem}`);
      assert.equal(afterTurn.summary.families.gemini.fiveHourEstimated, true);

      // 1-bucket snapshot (only weekly, fiveHourRem: null) must clear stale 5h bucket instead of keeping 100%
      const s2 = ipcHandlers["agy-studio:sync-quota-snapshot"]({}, {
        activeChatKey: "chat-q1",
        gemini: { fiveHourRem: null, weeklyRem: 23, fiveHourReset: "", weeklyReset: "5 д" },
      });
      assert.equal(s2.summary.families.gemini.fiveHourRem, null, "1-bucket weekly-only snapshot must clear stale 5h remaining");
      assert.equal(s2.summary.families.gemini.weeklyRem, 23);
    }
  } finally {
    Module._load = origLoad;
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

test("Modal dimming z-index, right appearance drawer offset, light-theme live edits, popular fonts, synced card limits, and busy model-selector usage popover", async () => {
  const v5Core = require("../skills/rudex/resources/rudex-v5-core.js");
  const v5Ui = require("../skills/rudex/resources/rudex-v5-ui.js");
  const stCss = buildStudioStyles();
  const extraCss = v5Core.rv5BuildExtraShadowCss();

  // 1. Limits widget & chat dock z-index MUST stay strictly below modal backdrop (2147483200) so they dim cleanly behind Studio modal
  const backdropZ = Number((/\.modal-backdrop\s*\{[^}]*z-index:\s*(\d+)/.exec(stCss) || [])[1] || 0);
  const limitsZ = Number((/\.rx-limits-mount\s*\{[^}]*z-index:\s*(\d+)/.exec(extraCss) || [])[1] || 0);
  const dockZ = Number((/\.rx-chat-dock\s*\{[^}]*z-index:\s*(\d+)/.exec(extraCss) || [])[1] || 0);
  assert.ok(backdropZ > 0 && limitsZ > 0 && dockZ > 0, "Expected valid z-index tokens");
  assert.ok(limitsZ < backdropZ, `Limits mount z-index (${limitsZ}) must be strictly below modal backdrop (${backdropZ})`);
  assert.ok(dockZ < backdropZ, `Chat dock z-index (${dockZ}) must be strictly below modal backdrop (${backdropZ})`);

  // 2. Popular fonts (ChatGPT, OpenCode, Cyrillic Pro Golos/Onest, Manrope, Space Mono) exist and build valid Google Font URLs
  const uiFontIds = new Set(FONT_PRESETS.ui.map((f) => f.id));
  const monoFontIds = new Set(FONT_PRESETS.mono.map((f) => f.id));
  for (const id of ["chatgpt-sans", "opencode-mono", "golos", "onest", "manrope"]) {
    assert.ok(uiFontIds.has(id), `Expected popular UI font preset: ${id}`);
  }
  for (const id of ["opencode-mono", "fira", "space-mono", "source-code-pro", "ubuntu-mono"]) {
    assert.ok(monoFontIds.has(id), `Expected popular mono font preset: ${id}`);
  }
  const chatGptFontUrl = teBuildWebFontUrl({ typography: { uiFont: "chatgpt-sans", monoFont: "fira" } });
  assert.ok(chatGptFontUrl.includes("Inter") && chatGptFontUrl.includes("Fira+Code"));

  // 3. Panel integration: light app theme under dark studio windowTheme, synced M-card limits, right drawer clearance, and busy model-selector usage popover
  const { doc, win } = createMockDom();
  const docPointerDownFns = [];
  const origDocAddEvt = doc.addEventListener ? doc.addEventListener.bind(doc) : null;
  doc.addEventListener = (type, fn, cap) => {
    if (type === "pointerdown" && typeof fn === "function") docPointerDownFns.push(fn);
    if (origDocAddEvt) origDocAddEvt(type, fn, cap);
  };
  win.innerWidth = 1600;
  win.innerHeight = 900;
  const mainEl = doc.createElement("main");
  const uBubble = doc.createElement("div");
  uBubble.setAttribute("data-testid", "user-message-bubble");
  const uContent = doc.createElement("div");
  uContent.setAttribute("data-testid", "user-message-content");
  uContent.textContent = "проверь светлую тему и лимиты";
  uBubble.appendChild(uContent);
  mainEl.appendChild(uBubble);

  const modelBtn = doc.createElement("button");
  modelBtn.setAttribute("data-testid", "model-selector-trigger");
  modelBtn.setAttribute("disabled", "");
  modelBtn.disabled = true;
  modelBtn.textContent = "Gemini 4 Neon Сверхвысокий";
  modelBtn.getBoundingClientRect = () => ({ left: 420, top: 820, right: 620, bottom: 850, width: 200, height: 30 });
  mainEl.appendChild(modelBtn);
  doc.body.appendChild(mainEl);

  const titleBarCalls = [];
  win.electronNativeAPI = { setTitleBarOverlay: (o) => titleBarCalls.push(o) };

  const quotaSnap = {
    families: {
      gemini: { fiveHourRem: 57, weeklyRem: 12, fiveHourReset: "3 ч 43 мин", weeklyReset: "5 д 3 ч", calibrated: true },
      claudeGpt: { fiveHourRem: 100, weeklyRem: 100, fiveHourReset: "", weeklyReset: "", calibrated: true },
    },
    activeChat: { chatKey: "c1", fiveHourWindowPct: 43, fiveHourPct: 43, weeklyPct: 30, turns: 12 },
    chats: [],
  };

  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      invoke: async (ch) => {
        if (ch === "agy-studio:get-quota-summary") return quotaSnap;
        if (ch === "agy-studio:get-state") {
          return {
            locale: "ru",
            settings: {
              pinned: true,
              layoutMode: "docked",
              viewMode: "medium",
              dockPosition: "bottom-right",
              studioUi: { windowTheme: "claude-dark", widgetTheme: "claude", widgetScale: "md", widgetZoom: 100 },
              appearance: { presetId: "claude-code-light" },
              limitsWidget: { enabled: true, layout: "bars", position: "top-right", pinned: true },
              liveEditInline: { enabled: true, showInChat: true, showDeliveredBadge: true, chatBubbleStyle: "native" },
            },
            quotaSummary: quotaSnap,
            chat: { personaEnabled: false },
          };
        }
        return { ok: true };
      },
    },
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    themeEngine: createThemeEngine({ document: doc, window: win }),
  });

  const prevSyncLive = global.rv5SyncLiveChatBubbles;
  const prevBuildDock = global.rv5BuildChatDockHtml;
  const prevBuildLimits = global.rv5BuildLimitsWidgetHtml;
  const prevNormLimits = global.rv5NormalizeLimitsWidget;
  const prevLiveDefaults = global.RUDEX_LIVE_EDIT_DEFAULTS;
  global.rv5SyncLiveChatBubbles = v5Ui.rv5SyncLiveChatBubbles;
  global.rv5BuildChatDockHtml = v5Ui.rv5BuildChatDockHtml;
  global.rv5BuildLimitsWidgetHtml = v5Core.rv5BuildLimitsWidgetHtml;
  global.rv5NormalizeLimitsWidget = v5Core.rv5NormalizeLimitsWidget;
  global.RUDEX_LIVE_EDIT_DEFAULTS = v5Core.RUDEX_LIVE_EDIT_DEFAULTS;
  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 20));
    panel.applyQuotaSummary(quotaSnap);
    panel.applyLiveEditsUpdate({
      items: [{ id: "le-1", chatKey: "__new__", fallbackAny: true, status: "pending", text: "Сообщение правки в светлой теме", anchorUserText: "проверь светлую тему и лимиты" }],
    });

    const host = doc.getElementById("rudex-studio-host");
    const rootEl = host.shadowRoot.querySelector(".studio-root");
    assert.equal(rootEl.getAttribute("data-app-theme"), "light", "data-app-theme must be 'light' for claude-code-light even when Studio windowTheme is claude-dark");

    // Live-edit bubble must use light theme so text is dark & readable on light backgrounds
    const liveSlot = doc.querySelector("[data-rudex-live-slot]");
    assert.ok(liveSlot, "Live edit slot must render");
    assert.equal(liveSlot.getAttribute("data-theme"), "light", "Live-edit bubble must follow app light theme");

    // TitleBar overlay synced to light parchment chrome
    assert.ok(titleBarCalls.some((c) => c && c.color === "#ebe8de" && c.symbolColor === "#1b1a18"), "Window caption buttons must sync to light theme palette");

    // Medium card widget & standalone limits widget must display synchronized 57% / 12% remaining (not mismatched -43% / -30%)
    const widgetHtml = host.shadowRoot.querySelector(".widget-wrap").innerHTML;
    const limitsHtml = host.shadowRoot.querySelector(".rx-limits-mount").innerHTML;
    assert.ok(widgetHtml.includes("5ч 57%") && (widgetHtml.includes("Нед. 12%") || widgetHtml.includes("Нед 12%")), `Expected synced 57% / 12% in medium card, got: ${widgetHtml.slice(-400)}`);
    assert.ok(limitsHtml.includes("57%") && limitsHtml.includes("12%"), "Standalone limits widget must display exact 57% / 12%");

    // Right appearance drawer cleanly hides right-side widgets so they NEVER overlap the drawer OR chat text, and restores them on close
    panel.setOpen(true, { tab: "appearance", dockedRight: true });
    const limMount = host.shadowRoot.querySelector(".rx-limits-mount");
    assert.ok(limMount.className.includes("rx-zen-hidden"), `Expected right-side limits mount to yield cleanly while right appearance drawer is open, got class: ${limMount.className}`);
    panel.setOpen(false);
    assert.equal(limMount.className.includes("rx-zen-hidden"), false, "Limits mount must reappear immediately when right appearance drawer closes");

    // Clicking disabled model-selector-trigger while agent is running opens Usage popover with live limits
    const pdEvt = {
      type: "pointerdown",
      button: 0,
      target: modelBtn,
      clientX: 460,
      clientY: 835,
      preventDefault() {},
      stopPropagation() {},
      stopImmediatePropagation() {},
    };
    for (const fn of docPointerDownFns) fn(pdEvt);
    const usageMount = host.shadowRoot.querySelector(".rx-usage-pop-mount");
    assert.ok(usageMount && usageMount.innerHTML.includes("Использование"), "Clicking disabled model selector must open Usage popover");
    assert.ok(usageMount.innerHTML.includes("57%") && usageMount.innerHTML.includes("12%"), "Usage popover must show live Gemini 57% / 12% limits");
  } finally {
    panel.destroy();
    global.rv5SyncLiveChatBubbles = prevSyncLive;
    global.rv5BuildChatDockHtml = prevBuildDock;
    global.rv5BuildLimitsWidgetHtml = prevBuildLimits;
    global.rv5NormalizeLimitsWidget = prevNormLimits;
    global.RUDEX_LIVE_EDIT_DEFAULTS = prevLiveDefaults;
  }
});

test("UI styles (Antigravity, Claude Code, Codex, OpenCode): Mix & Match, granular overrides, native-preset scan, backend persistence, and Studio UI tab", async () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  assert.ok(Array.isArray(te.UI_STYLE_PRESETS) && te.UI_STYLE_PRESETS.length === 4, "Must expose 4 platform UI style presets");
  assert.deepEqual(te.UI_STYLE_PRESETS.map((p) => p.id), ["antigravity", "claude-code", "codex", "opencode"]);

  // Default appearance must stay native default
  assert.equal(te.isAppearanceNativeDefault({}), true);
  assert.equal(te.isAppearanceNativeDefault({ uiStyle: { preset: "claude-code" } }), false);
  assert.equal(te.isAppearanceNativeDefault({ uiStyle: { composerRadius: 22 } }), false);

  // Mix & Match normalization derives preset="custom" when zones differ
  const mixed = te.teNormalizeUiStyle({
    composer: "codex",
    chat: "opencode",
    modelSelector: "claude-code",
    composerRadius: 26,
    composerMaxWidth: 860,
    userBubbleAlign: "left",
    agentAccentBar: "on",
    modelBtnStyle: "mono",
    modelMenuDensity: "compact",
  });
  assert.equal(mixed.preset, "custom");
  assert.equal(mixed.composer, "codex");
  assert.equal(mixed.chat, "opencode");
  assert.equal(mixed.modelSelector, "claude-code");
  assert.equal(mixed.composerRadius, 26);
  assert.equal(mixed.composerMaxWidth, 860);
  assert.equal(mixed.userBubbleAlign, "left");
  assert.equal(mixed.agentAccentBar, "on");
  assert.equal(mixed.modelBtnStyle, "mono");
  assert.equal(mixed.modelMenuDensity, "compact");

  // CSS generation for each of the 3 non-default platforms + granular overrides works even on presetId: "native"
  const claudeCss = te.buildThemeCss({ presetId: "native", uiStyle: { preset: "claude-code" } }, { hostIsLight: false });
  assert.ok(claudeCss.includes("border-radius: 14px !important;"), "Claude Code input box must apply 14px editorial radius");
  assert.ok(claudeCss.includes('[data-rudex-comp-input-row="1"]'), "Claude Code must style separated top Reply bar");
  assert.ok(claudeCss.includes('[data-rudex-comp-toolbar="1"]'), "Claude Code must place toolbar outside Reply bar");
  assert.ok(claudeCss.includes("margin-left: auto !important;"), "Claude Code must align model selector to right of bottom bar");
  assert.ok(claudeCss.includes("--rudex-cc-send-top"), "Claude Code must position inline return arrow inside Reply bar");
  assert.ok(claudeCss.includes("background-color: transparent !important;"), "Claude Code model selector must be quiet borderless ghost trigger");

  const codexCss = te.buildThemeCss({ presetId: "native", uiStyle: { preset: "codex" } }, { hostIsLight: false });
  assert.ok(codexCss.includes("border-radius: 22px !important;"), "Codex composer must apply 22px elevated command capsule");
  assert.ok(codexCss.includes("border-top: 1px solid"), "Codex composer must separate bottom footer bar");
  assert.ok(codexCss.includes("border-radius: 999px !important;"), "Codex model button and send button must be pill/circular");

  const opencodeCss = te.buildThemeCss({ presetId: "claude-code-light", uiStyle: { preset: "opencode" } }, { hostIsLight: true });
  assert.ok(opencodeCss.includes("border-radius: 6px !important;"), "OpenCode must apply crisp 6px terminal corners");
  assert.ok(opencodeCss.includes('content: "❯";'), "OpenCode must render terminal prompt chevron inside input row");
  assert.ok(opencodeCss.includes("border-left: 3px solid"), "OpenCode must apply left accent stripe to composer & user bubbles");
  assert.ok(opencodeCss.includes("width: 100% !important;"), "OpenCode user bubble must stretch full timeline width");

  const customCss = te.buildThemeCss({ presetId: "native", uiStyle: mixed }, { hostIsLight: false });
  assert.ok(customCss.includes("border-radius: 26px !important;"));
  assert.ok(customCss.includes("max-width: min(100%, 860px) !important;"));
  assert.ok(customCss.includes("margin-right: auto !important;"));
  assert.ok(customCss.includes("min-height: 26px !important;"));

  // Studio Panel renders Appearance -> UI Style tab and updates appearanceDraft live on clicks & range inputs
  const { doc, win } = createMockDom();
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: { invoke: async () => ({ ok: true }) },
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    themeEngine: te.createThemeEngine({ document: doc, window: win }),
  });
  try {
    panel.init();
    panel.setOpen(true, { tab: "appearance", appSubTab: "uistyle", dockedRight: true });
    const host = doc.getElementById("rudex-studio-host");
    const root = host.shadowRoot.querySelector(".studio-root");
    const modalMount = host.shadowRoot.querySelector(".modal-mount");
    assert.ok(modalMount.innerHTML.includes("uistyle-grid"), "Appearance -> UI Style must render platform cards grid");
    assert.ok(modalMount.innerHTML.includes('data-action="set-uistyle-preset"'), "Must expose 1-click platform preset cards");
    assert.ok(modalMount.innerHTML.includes('data-action="set-uistyle-part"'), "Must expose per-zone Mix & Match buttons");
    assert.ok(modalMount.innerHTML.includes('data-app-field="uiStyle.composerRadius"'), "Must expose granular fine-tuning sliders");

    const codexBtn = doc.createElement("button");
    codexBtn.setAttribute("data-action", "set-uistyle-preset");
    codexBtn.setAttribute("data-id", "codex");
    root.appendChild(codexBtn);
    root.dispatchEvent({ type: "click", target: codexBtn });
    await new Promise((r) => setTimeout(r, 30));
    const injectedStyle = doc.getElementById("rudex-studio-theme");
    assert.ok(injectedStyle && injectedStyle.textContent.includes("border-radius: 22px !important;"), "Selecting Codex preset must immediately apply Codex CSS live");
  } finally {
    panel.destroy();
  }
});

test("Dynamic auto-updating limits: post-snapshot transcript steps decrement remaining %, reset timers tick live, expired 5h window auto-resets, and backend sanitizes uiStyle", async () => {
  const Module = require("module");
  const origLoad = Module._load;
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-dyn-quota-"));
  const fakeElectron = {
    app: { getPath: () => tmpUserData, isReady: () => true, on: () => {}, whenReady: () => Promise.resolve() },
    ipcMain: { handle: () => {}, removeHandler: () => {} },
    webContents: { getAllWebContents: () => [] },
    dialog: {},
    shell: {},
    protocol: {},
    BrowserWindow: { getAllWindows: () => [] },
    clipboard: { writeText: () => {}, writeImage: () => {} },
    nativeImage: { createFromPath: () => ({ isEmpty: () => true }) },
  };
  try {
    Module._load = function (req) {
      if (req === "electron") return fakeElectron;
      return origLoad.apply(this, arguments);
    };
    const mainModPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainModPath)];
    const i18nMain = require(mainModPath);

    // 1) uiStyle persistence sanitizer
    const sanitizedApp = i18nMain.sanitizeAppearance({
      presetId: "claude-code-dark",
      uiStyle: {
        composer: "codex",
        chat: "opencode",
        modelSelector: "claude-code",
        composerRadius: 24,
        composerMaxWidth: 920,
        userBubbleAlign: "full",
        modelBtnStyle: "mono",
      },
    });
    assert.equal(sanitizedApp.uiStyle.preset, "custom");
    assert.equal(sanitizedApp.uiStyle.composer, "codex");
    assert.equal(sanitizedApp.uiStyle.chat, "opencode");
    assert.equal(sanitizedApp.uiStyle.modelSelector, "claude-code");
    assert.equal(sanitizedApp.uiStyle.composerRadius, 24);
    assert.equal(sanitizedApp.uiStyle.composerMaxWidth, 920);
    assert.equal(sanitizedApp.uiStyle.userBubbleAlign, "full");
    assert.equal(sanitizedApp.uiStyle.modelBtnStyle, "mono");

    // 2) Live reset countdown formatting & expiry detection
    const t0 = Date.UTC(2026, 10, 25, 12, 0, 0);
    const ticked = i18nMain.formatLiveResetRemaining("3 ч 43 мин", t0, t0 + 30 * 60 * 1000, "ru");
    assert.equal(ticked.expired, false);
    assert.equal(ticked.text, "3 ч 13 мин");
    const expired = i18nMain.formatLiveResetRemaining("1 ч 0 мин", t0, t0 + 65 * 60 * 1000, "ru");
    assert.equal(expired.expired, true);
    assert.equal(expired.text, "");

    // 3) Post-snapshot transcript steps dynamically lower live 5h & weekly % without re-opening official View Usage
    i18nMain.saveQuotaStore({
      version: 1,
      resetAt: 0,
      families: {
        gemini: {
          fiveHourRem: 70,
          weeklyRem: 20,
          fiveHourReset: "3 ч 0 мин",
          weeklyReset: "5 д 0 ч",
          updatedAt: t0,
          calibrated: true,
          tokensPer1Pct5h: 25000,
          tokensPer1PctWeekly: 100000,
          pending5hByChat: {},
          pendingWeeklyByChat: {},
        },
        claudeGpt: {
          fiveHourRem: 100,
          weeklyRem: 100,
          fiveHourReset: "",
          weeklyReset: "",
          updatedAt: t0,
          calibrated: false,
        },
      },
    });

    const chatUuid = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const diskMap = new Map([
      [
        chatUuid,
        {
          chatKey: chatUuid,
          titleGuess: "Active coding chat",
          lastModel: "Gemini 4 Neon",
          lastTs: t0 + 20 * 60 * 1000,
          steps: [
            // Historical steps before snapshot (t0 - 1h): 30% used = 750k units -> calibrates to ~25k/1%
            { ts: t0 - 60 * 60 * 1000, units: 555000, family: "gemini" },
            // New steps AFTER snapshot (t0 + 15m): 250k raw * 1.35 weight = 337.5k units -> ~13.5% live drop!
            { ts: t0 + 15 * 60 * 1000, units: 250000, family: "gemini" },
          ],
        },
      ],
    ]);

    const liveSum = i18nMain.buildQuotaSummary(chatUuid, true, { nowMs: t0 + 30 * 60 * 1000, diskByChat: diskMap });
    assert.ok(liveSum.families.gemini.fiveHourRem < 70, `Expected live 5h remaining to drop below 70 after post-snapshot transcript steps, got ${liveSum.families.gemini.fiveHourRem}`);
    assert.equal(liveSum.families.gemini.fiveHourEstimated, true);
    assert.equal(liveSum.families.gemini.fiveHourReset, "2 ч 30 мин", "Reset timer must dynamically tick down from 3h 0m -> 2h 30m");
    assert.ok(liveSum.families.gemini.weeklyRem < 20, `Expected live weekly remaining to drop below 20, got ${liveSum.families.gemini.weeklyRem}`);

    // 4) Once 5h timer expires (t0 + 3h 10m), 5h window auto-resets toward 100% (counting only steps after resetAtMs)
    const afterResetSum = i18nMain.buildQuotaSummary(chatUuid, true, { nowMs: t0 + 190 * 60 * 1000, diskByChat: diskMap });
    assert.equal(afterResetSum.families.gemini.fiveHourWindowResetDetected, true);
    assert.equal(afterResetSum.families.gemini.fiveHourRem, 100, "Expired 5h window with no post-reset steps must auto-reset to 100%");
    assert.equal(afterResetSum.families.gemini.fiveHourReset, "");

    // 5) Estimated drop must NEVER falsely floor a >0% snapshot all the way down to 0%
    const hugeMap = new Map([
      [
        chatUuid,
        {
          chatKey: chatUuid,
          titleGuess: "Heavy chat",
          lastModel: "Gemini 4 Neon",
          lastTs: t0 + 25 * 60 * 1000,
          steps: [
            { ts: t0 - 30 * 60 * 1000, units: 1200000, family: "gemini" },
            { ts: t0 + 15 * 60 * 1000, units: 5000000, family: "gemini" },
          ],
        },
      ],
    ]);
    const heavySum = i18nMain.buildQuotaSummary(chatUuid, true, { nowMs: t0 + 30 * 60 * 1000, diskByChat: hugeMap });
    assert.equal(heavySum.families.gemini.fiveHourRem, 1, "Estimated drop from >0% official snapshot must stop at ~1% instead of lying ~0%");
    assert.equal(heavySum.families.gemini.weeklyRem, 1, "Estimated weekly drop from >0% official snapshot must stop at ~1% instead of lying ~0%");
  } finally {
    Module._load = origLoad;
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

test("Final polish: live-edit bubble matches native user bubble style, Claude Code neutralizes bg-white voice icon, busy usage popover closes cleanly, and auth screen hides widgets", async () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));

  // 1) Claude Code CSS: vertical input-row stacking + transparent non-send toolbar button rule
  const ccCss = te.buildThemeCss({ presetId: "claude-code-dark", uiStyle: { preset: "claude-code" } });
  assert.ok(ccCss.includes("flex-direction: column !important;"), "Claude Code input-row must stack attachments vertically");
  assert.ok(
    ccCss.includes(':not([data-rudex-comp-send="1"]):not([data-testid="model-selector-trigger"]):not([data-rudex-comp-mode="1"]):not(#rudex-studio-host):not(#rudex-studio-host *)'),
    "Claude Code toolbar must neutralize stray bg-white icon buttons with high specificity"
  );

  // 2) Live-edit chat bubble copies exact computed color/border/radius from native user-message-bubble
  const { doc, win } = createMockDom();
  const chatWrap = doc.createElement("div");
  const userBubble = doc.createElement("div");
  userBubble.setAttribute("data-testid", "user-message-bubble");
  userBubble.textContent = "Привет, сделай релиз";
  chatWrap.appendChild(userBubble);
  doc.body.appendChild(chatWrap);
  const origGcs = win.getComputedStyle;
  win.getComputedStyle = (el) => {
    const base = origGcs ? origGcs(el) : {};
    if (el === userBubble) {
      return Object.assign({}, base, {
        backgroundColor: "rgb(47, 46, 43)",
        color: "rgb(250, 249, 245)",
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: "rgba(250, 249, 245, 0.1)",
        borderLeftWidth: "1px",
        borderLeftStyle: "solid",
        borderLeftColor: "rgba(250, 249, 245, 0.1)",
        borderRadius: "14px",
        boxShadow: "none",
      });
    }
    return base;
  };
  v5Ui.rv5SyncLiveChatBubbles(doc, {
    liveEdits: [{ id: "le-1", text: "Дополнение в тон", status: "pending", anchorUserText: "Привет, сделай релиз" }],
    liveEditInline: { enabled: true, showInChat: true, chatBubbleStyle: "native" },
    isRu: true,
    isLight: false,
    accentColor: "#d97757",
  });
  const slot = doc.querySelector('[data-rudex-live-bubbles="1"]');
  assert.ok(slot, "Live-edit bubble slot must mount after user bubble");
  assert.equal(slot.style.getPropertyValue("--rx-cb-bg"), "rgb(47, 46, 43)", "Live-edit bubble must inherit exact backgroundColor of native user bubble");
  assert.equal(slot.style.getPropertyValue("--rx-cb-radius"), "14px", "Live-edit bubble must inherit exact borderRadius of native user bubble");

  // 3) Busy usage popover: stable DOM across ticks (✕ click works), tooltip guard active, no Limits Widget button
  const { doc: pDoc, win: pWin } = createMockDom();
  const docPointerDownFns = [];
  const origDocAddEvt = pDoc.addEventListener.bind(pDoc);
  pDoc.addEventListener = (type, fn, cap) => {
    if (type === "pointerdown") docPointerDownFns.push(fn);
    origDocAddEvt(type, fn, cap);
  };
  const trig = pDoc.createElement("button");
  trig.setAttribute("data-testid", "model-selector-trigger");
  trig.setAttribute("disabled", "");
  trig.disabled = true;
  trig.textContent = "Gemini 4 Neon";
  trig.getBoundingClientRect = () => ({ left: 820, top: 760, right: 1020, bottom: 788, width: 200, height: 28 });
  pDoc.body.appendChild(trig);

  const panel = createStudioPanel({
    document: pDoc,
    window: pWin,
    ipcRenderer: { invoke: async () => ({ ok: true, families: { gemini: { fiveHourRem: 55, weeklyRem: 40 }, claudeGpt: { fiveHourRem: 100, weeklyRem: 100 } } }) },
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });
  try {
    panel.init();
    const host = pDoc.getElementById("rudex-studio-host");
    const root = host.shadowRoot ? host.shadowRoot.querySelector(".studio-root") : host.querySelector(".studio-root");
    const pdEvt = { type: "pointerdown", button: 0, target: trig, clientX: 860, clientY: 774, composedPath: () => [trig, pDoc.body], preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} };
    for (const fn of docPointerDownFns) fn(pdEvt);
    assert.equal(pDoc.documentElement.getAttribute("data-rudex-usage-pop-open"), "1", "Opening usage popover must activate native tooltip guard");
    const usageMount = root.querySelector(".rx-usage-pop-mount");
    assert.ok(usageMount && usageMount.innerHTML.includes('data-action="close-model-usage-pop"'), "Usage popover must render ✕ close button");
    assert.equal(usageMount.innerHTML.includes("open-limits-from-usage-pop"), false, "Usage popover must NOT render redundant Limits Widget button");

    // Repeated pollStream ticks must NOT overwrite unchanged innerHTML (which previously broke clicking ✕!)
    const sentinel = pDoc.createElement("span");
    sentinel.setAttribute("data-sentinel", "1");
    usageMount.appendChild(sentinel);
    panel.pollStream();
    assert.ok(usageMount.contains(sentinel), "Repeated pollStream ticks must NOT re-write unchanged usage popover innerHTML");

    // Simulate clicking ✕ close button on root click handler
    const closeTarget = {
      closest: (sel) => (sel === "[data-action]" || sel === "button" ? { getAttribute: (a) => (a === "data-action" ? "close-model-usage-pop" : null) } : null),
    };
    const rootClickFns = Array.from((root.listeners && root.listeners.get("click")) || []);
    assert.ok(rootClickFns.length > 0, "rootEl must have click handler attached");
    for (const fn of rootClickFns) fn({ type: "click", target: closeTarget });
    assert.equal(pDoc.documentElement.getAttribute("data-rudex-usage-pop-open"), null, "Closing usage popover via ✕ must clear tooltip guard");
    assert.equal(usageMount.style.display, "none", "Clicking ✕ must close usage popover");

    // 4) Auth / Sign-in screen hides mini-widget & limits widget automatically
    pDoc.body.removeChild(trig);
    const h1 = pDoc.createElement("h1");
    h1.textContent = "Добро пожаловать в Antigravity!";
    const loginBtn = pDoc.createElement("button");
    loginBtn.textContent = "Продолжить через Google";
    pDoc.body.appendChild(h1);
    pDoc.body.appendChild(loginBtn);
    await new Promise((r) => setTimeout(r, 700));
    panel.pollStream();
    assert.ok(root.classList.contains("is-auth-screen"), "Sign-in / account-switch screen must add is-auth-screen class to hide widgets");

    // Restoring workspace element brings widgets back immediately
    pDoc.body.appendChild(trig);
    await new Promise((r) => setTimeout(r, 700));
    panel.pollStream();
    assert.ok(!root.classList.contains("is-auth-screen"), "Returning to workspace must remove is-auth-screen class");

    // 5) Update toast yields cleanly whenever Settings modal / right Appearance drawer is open or top-right corner is occupied
    panel.applyUpdateStatus({
      status: "available",
      available: true,
      dismissed: false,
      installed: { version: "5.0.0" },
      remote: { version: "5.0.1", commitMessage: "Update" },
    });
    const toastMount = root.querySelector(".update-toast-mount");
    assert.ok(toastMount && toastMount.innerHTML.includes("5.0.1"), "Update toast must show when Settings is closed");
    panel.setOpen(true, { tab: "settings", subTab: "system" });
    assert.equal(toastMount.innerHTML, "", "Update toast must NOT overlap Rudex Studio Settings modal");
    panel.setOpen(false);
    assert.ok(toastMount.innerHTML.includes("5.0.1"), "Update toast must reappear after closing Settings modal");
    panel.setOpen(true, { tab: "appearance", dockedRight: true });
    assert.equal(toastMount.innerHTML, "", "Update toast must NOT overlap right-docked Appearance drawer");
    panel.setOpen(false);
  } finally {
    panel.destroy();
  }

  // 6) New Chat Claude Code composer: intermediate inner card gets data-rudex-comp-stack, Voice Mode gets data-rudex-comp-voice (position: static, order: -8), and sendBtn stays centered inside Reply box
  const { doc: ncDoc, win: ncWin } = createMockDom();
  ncWin.innerWidth = 1400;
  ncWin.innerHeight = 900;
  const outerComp = ncDoc.createElement("div");
  outerComp.style.borderRadius = "16px";
  outerComp.style.backgroundColor = "rgb(30, 30, 28)";
  outerComp.getBoundingClientRect = () => ({ left: 260, top: 600, right: 1060, bottom: 740, width: 800, height: 140 });
  const topBar = ncDoc.createElement("div");
  topBar.textContent = "Этот компьютер antigravity-ru main";
  topBar.getBoundingClientRect = () => ({ left: 260, top: 600, right: 1060, bottom: 632, width: 800, height: 32 });
  const innerCard = ncDoc.createElement("div");
  innerCard.style.backgroundColor = "rgb(38, 38, 36)";
  innerCard.style.borderRadius = "14px";
  innerCard.getBoundingClientRect = () => ({ left: 260, top: 638, right: 1060, bottom: 740, width: 800, height: 102 });
  const stackDiv = ncDoc.createElement("div");
  stackDiv.getBoundingClientRect = () => ({ left: 260, top: 638, right: 1060, bottom: 740, width: 800, height: 102 });
  const inRow = ncDoc.createElement("div");
  inRow.getBoundingClientRect = () => ({ left: 260, top: 638, right: 1060, bottom: 696, width: 800, height: 58 });
  const ce = ncDoc.createElement("div");
  ce.setAttribute("contenteditable", "true");
  ce.getBoundingClientRect = () => ({ left: 276, top: 652, right: 1000, bottom: 680, width: 724, height: 28 });
  inRow.appendChild(ce);
  const tBar = ncDoc.createElement("div");
  tBar.getBoundingClientRect = () => ({ left: 260, top: 696, right: 1060, bottom: 740, width: 800, height: 44 });
  const bPlus = ncDoc.createElement("button");
  bPlus.textContent = "+";
  bPlus.getBoundingClientRect = () => ({ left: 270, top: 704, right: 298, bottom: 732, width: 28, height: 28 });
  const bModel = ncDoc.createElement("button");
  bModel.setAttribute("data-testid", "model-selector-trigger");
  bModel.textContent = "Gemini 4 Neon";
  bModel.getBoundingClientRect = () => ({ left: 310, top: 704, right: 470, bottom: 732, width: 160, height: 28 });
  const bMode = ncDoc.createElement("button");
  bMode.textContent = "Турбо";
  bMode.getBoundingClientRect = () => ({ left: 840, top: 704, right: 900, bottom: 732, width: 60, height: 28 });
  const bMic = ncDoc.createElement("button");
  bMic.setAttribute("aria-label", "Dictate");
  bMic.getBoundingClientRect = () => ({ left: 910, top: 704, right: 938, bottom: 732, width: 28, height: 28 });
  const bVoice = ncDoc.createElement("button");
  bVoice.setAttribute("aria-label", "Start voice mode");
  bVoice.setAttribute("class", "bg-white text-black rounded-full");
  bVoice.getBoundingClientRect = () => ({ left: 950, top: 704, right: 978, bottom: 732, width: 28, height: 28 });
  const bSend = ncDoc.createElement("button");
  bSend.setAttribute("type", "submit");
  bSend.setAttribute("aria-label", "Send");
  bSend.getBoundingClientRect = () => ({ left: 990, top: 704, right: 1018, bottom: 732, width: 28, height: 28 });
  tBar.appendChild(bPlus);
  tBar.appendChild(bModel);
  tBar.appendChild(bMode);
  tBar.appendChild(bMic);
  tBar.appendChild(bVoice);
  tBar.appendChild(bSend);
  stackDiv.appendChild(inRow);
  stackDiv.appendChild(tBar);
  innerCard.appendChild(stackDiv);
  outerComp.appendChild(topBar);
  outerComp.appendChild(innerCard);
  ncDoc.body.appendChild(outerComp);

  const ncTe = te.createThemeEngine({ document: ncDoc, window: ncWin });
  try {
    ncTe.apply({ presetId: "claude-code-dark", uiStyle: { preset: "claude-code" } });
    assert.equal(outerComp.getAttribute("data-rudex-theme-composer"), "1");
    assert.equal(innerCard.getAttribute("data-rudex-comp-stack"), "1", "Intermediate innerCard wrapper on New Chat must receive data-rudex-comp-stack");
    assert.equal(stackDiv.getAttribute("data-rudex-comp-stack"), "1");
    assert.equal(bVoice.getAttribute("data-rudex-comp-voice"), "1", "Voice mode button must receive data-rudex-comp-voice (not send!)");
    assert.equal(bVoice.getAttribute("data-rudex-comp-send"), null, "Voice mode button must never be marked as send");
    assert.equal(bSend.getAttribute("data-rudex-comp-send"), "1", "Submit send button must receive data-rudex-comp-send");
    assert.equal(bMic.getAttribute("data-rudex-comp-mic"), "1");
    assert.equal(bPlus.getAttribute("data-rudex-comp-plus"), "1");
    assert.equal(bMode.getAttribute("data-rudex-comp-mode"), "1");
    // topPx must center send inside Reply text line (ce center 666) relative to outerComp (top 600) => 666 - 600 - 14 = 52px
    assert.equal(outerComp.style.getPropertyValue("--rudex-cc-send-top"), "52px", "Send arrow must center inside Reply box below New Chat top-bar");
  } finally {
    ncTe.destroy();
  }
});

test("Light theme Pass D2 preserves data-rudex-light-text and data-rudex-light-fix across repeated scanWallpaperShells passes", () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const { doc, win } = createMockDom();
  win.innerWidth = 1600;
  win.innerHeight = 900;
  const aside = doc.createElement("aside");
  aside.setAttribute("data-testid", "sidebar");
  aside.getBoundingClientRect = () => ({ left: 0, top: 30, right: 240, bottom: 900, width: 240, height: 870 });
  const navBtn = doc.createElement("div");
  navBtn.textContent = "+ Новый чат";
  navBtn.style.color = "rgb(236, 236, 239)";
  navBtn.getBoundingClientRect = () => ({ left: 10, top: 44, right: 220, bottom: 72, width: 210, height: 28 });
  aside.appendChild(navBtn);
  doc.body.appendChild(aside);

  // Simulate browser computed style reflecting [data-rudex-light-text="1"] turning text dark on the 2nd scan
  const origGcs = win.getComputedStyle;
  win.getComputedStyle = (el) => {
    const base = origGcs ? origGcs(el) : {};
    if (el === navBtn) {
      return Object.assign({}, base, {
        backgroundColor: "rgba(0, 0, 0, 0)",
        color: el.getAttribute("data-rudex-light-text") === "1" ? "rgb(28, 28, 32)" : "rgb(236, 236, 239)",
      });
    }
    return base;
  };

  const engine = te.createThemeEngine({ document: doc, window: win });
  try {
    engine.apply({ presetId: "light-paper" });
    assert.equal(navBtn.getAttribute("data-rudex-light-text"), "1", "1st scan must mark hardcoded light sidebar text");

    // 2nd scan (triggered e.g. when opening Appearance drawer or DOM mutation) MUST preserve the attribute!
    engine.scanWallpaperShells();
    assert.equal(navBtn.getAttribute("data-rudex-light-text"), "1", "2nd scan must NOT strip data-rudex-light-text after text turns dark");

    // Switching back to a dark theme MUST cleanly strip data-rudex-light-text
    engine.apply({ presetId: "claude-code-dark" });
    assert.equal(navBtn.getAttribute("data-rudex-light-text"), null, "Switching to dark theme must remove data-rudex-light-text");
  } finally {
    engine.destroy();
  }
});
