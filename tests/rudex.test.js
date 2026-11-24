"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
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
  DEFAULT_APPEARANCE,
  normalizeAppearance,
  isAppearanceNativeDefault,
  detectHostIsLight,
  buildThemeCss,
  createThemeEngine,
} = require(path.join(RES_DIR, "theme-engine.js"));
const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
const {
  compareSemver,
  stripCjsPrologueEpilogue,
  buildPreloadSnippet,
} = require(path.join(SCRIPTS_DIR, "install.js"));
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
test("Manifest & hooks.json follow Rudex v4.0.0 architecture without PostInvocation", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "plugin.json"), "utf8"));
  assert.equal(pkg.name, "rudex");
  assert.equal(pkg.displayName, "Rudex");
  assert.equal(pkg.version, "4.0.0");
  assert.equal(typeof dictionary, "object");
  assert.ok(Object.keys(dictionary).length >= 4000);
  assert.equal(DYNAMIC_RULES.length, 471);

  const hooks = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "hooks.json"), "utf8"));
  const group = hooks["rudex-studio"];
  assert.ok(group, "rudex-studio hook group missing");
  assert.ok(Array.isArray(group.SessionStart) && group.SessionStart.length === 1);
  assert.ok(Array.isArray(group.PreInvocation) && group.PreInvocation.length === 1);
  assert.ok(Array.isArray(group.Stop) && group.Stop.length === 1);
  assert.equal(group.PostInvocation, undefined, "PostInvocation must NOT exist (causes silent live-edit loss)");
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
    wallpaper: { type: "image", mediaUrl: "rudex-media://local/wp.jpg", blur: 12, opacity: 35 },
  });
  const bg = doc.getElementById("rudex-bg");
  assert.ok(bg, "#rudex-bg node should mount");
  assert.equal(bg.style.zIndex, "-1");
  const img = bg.querySelector("img");
  assert.ok(img && img.style.transform.includes("scale("), "Blurred image should get scale overscan");
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

  panel.init();
  panel.setOpen(true);
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
      greeting: { enabled: true, mode: "custom", title: "Привет от панели!", subtitle: "" },
    },
  });
  assert.equal(translator.getGreetingConfig().title, "Привет от панели!");
  panel.destroy();
  translator.destroy();
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
        env: Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: tmpUserData }),
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
        env: Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: tmpUserData }),
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
