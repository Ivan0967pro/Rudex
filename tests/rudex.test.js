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
  teBuildElementOverridesCss,
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

  function splitSelectorTokens(str) {
    const tokens = [];
    let cur = "";
    let inBracket = 0;
    for (let i = 0; i < str.length; i += 1) {
      const ch = str[i];
      if (ch === "[") inBracket += 1;
      else if (ch === "]" && inBracket > 0) inBracket -= 1;
      if (inBracket === 0 && /\s/.test(ch)) {
        if (cur) { tokens.push(cur); cur = ""; }
      } else {
        cur += ch;
      }
    }
    if (cur) tokens.push(cur);
    return tokens;
  }

  function matchesSelectorList(el, selector) {
    const parts = String(selector || "").split(",");
    for (const part of parts) {
      const tokens = splitSelectorTokens(part.trim());
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
  assert.equal(pkg.version, "5.5.2");
  assert.ok(fs.existsSync(path.join(SCRIPTS_DIR, "updater-core.js")), "updater-core.js must exist");
  assert.ok(fs.existsSync(path.join(SCRIPTS_DIR, "thinking-translator.js")), "thinking-translator.js must exist");
  assert.ok(fs.existsSync(path.join(SCRIPTS_DIR, "agy-workshop.js")), "agy-workshop.js must exist");
  assert.ok(fs.existsSync(path.join(RES_DIR, "rudex-annotator.js")), "rudex-annotator.js must exist");
  assert.equal(typeof dictionary, "object");
  assert.ok(Object.keys(dictionary).length >= 4000);
  assert.equal(DYNAMIC_RULES.length, 485);

  const hooks = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "hooks.json"), "utf8"));
  const group = hooks["rudex-studio"];
  assert.ok(group, "rudex-studio hook group missing");
  assert.ok(Array.isArray(group.SessionStart) && group.SessionStart.length === 1);
  assert.ok(Array.isArray(group.PreInvocation) && group.PreInvocation.length === 1);
  assert.equal(group.PreToolUse, undefined, "Stock hooks.json must omit PreToolUse by default (added dynamically only on demand)");
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
    if (u.pathname === "/local-translate" && req.method === "POST") {
      const bodyChunks = [];
      req.on("data", (c) => bodyChunks.push(c));
      req.on("end", () => {
        const parsed = JSON.parse(Buffer.concat(bodyChunks).toString("utf8"));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ translatedText: `LOCAL:${parsed.q || ""}` }));
      });
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

    // When clients5 returns 500, translator fails cleanly without leaking to third-party public APIs (MyMemory removed)
    mode = "fallback";
    const b3 = await tt.translateBatch(["Fallback test sentence."]);
    assert.equal(b3.translations["Fallback test sentence."], undefined);
    assert.equal(b3.results[0].ok, false);

    // Optional 100% local loopback translator works offline without hitting clients5
    const ttLocal = createThinkingTranslator({
      localUrl: `http://127.0.0.1:${port}/local-translate`,
    });
    const bLocal = await ttLocal.translateBatch(["Analyze `app.asar` layout."]);
    assert.equal(bLocal.translations["Analyze `app.asar` layout."], "LOCAL:Analyze `app.asar` layout.");
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

  assert.ok(ps1Text.includes("Rudex v5.5.2"), "install.ps1 banner must show v5.5.2");
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
    assert.ok(dockedLimHtml.includes("74%") && !dockedLimHtml.includes("~74%"), "Limits widget must display strictly real 74% with zero ~ guess prefix");
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

      // Record heavy turn -> official 5h remaining must stay strictly real (100%, zero local guesses) until next official Antigravity sync
      const afterTurn = ipcHandlers["agy-studio:record-quota-turn"]({}, {
        chatKey: "chat-q1",
        title: "Heavy chat",
        modelName: "Gemini 4 Neon",
        outputTokens: 60000,
        contextTokens: 200000,
      });
      assert.equal(afterTurn.summary.families.gemini.fiveHourRem, 100, `Official 5h remaining must stay strictly real 100% without guesses, got ${afterTurn.summary.families.gemini.fiveHourRem}`);
      assert.equal(afterTurn.summary.families.gemini.fiveHourEstimated, false);

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
  assert.ok(limitsZ < 50, `Limits mount z-index (${limitsZ}) must stay below native z-50 tooltips & menus`);
  assert.ok(dockZ < 50, `Chat dock z-index (${dockZ}) must stay below native z-50 tooltips & menus`);
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

    // Right-pane header clearance: when a right side panel (Implementation Plan) is open with a 32px titlebar + 64px top-right [◫] toggle button,
    // Limits widget MUST sit strictly below the top-right button (top >= 78px), NEVER overlapping it!
    const titleBarHdr = doc.createElement("header");
    titleBarHdr.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1600, bottom: 32, width: 1600, height: 32 });
    const rightPaneBtn = doc.createElement("button");
    rightPaneBtn.setAttribute("aria-label", "Переключить боковую панель");
    rightPaneBtn.getBoundingClientRect = () => ({ left: 1554, top: 36, right: 1586, bottom: 64, width: 32, height: 28 });
    doc.body.appendChild(titleBarHdr);
    doc.body.appendChild(rightPaneBtn);
    panel.applyQuotaSummary(quotaSnap);
    const limTopPx = parseInt(limMount.style.top || "0", 10);
    assert.ok(limTopPx >= 78, `Expected top-right Limits widget to sit cleanly below top-right [◫] button (bottom=64), got top=${limMount.style.top}`);

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
    assert.equal(liveSum.families.gemini.fiveHourRem, 70, `Official 5h remaining must stay strictly real (70%, zero local guesses), got ${liveSum.families.gemini.fiveHourRem}`);
    assert.equal(liveSum.families.gemini.fiveHourEstimated, false, "Must NEVER emit fake ~estimated quota guesses");
    assert.equal(liveSum.families.gemini.fiveHourReset, "2 ч 30 мин", "Reset timer must dynamically tick down from 3h 0m -> 2h 30m");
    assert.equal(liveSum.families.gemini.weeklyRem, 20, `Official weekly remaining must stay strictly real (20%, zero local guesses), got ${liveSum.families.gemini.weeklyRem}`);
    assert.equal(liveSum.families.gemini.weeklyEstimated, false);

    // 4) Once 5h timer expires (t0 + 3h 10m), 5h window genuinely resets to 100%
    const afterResetSum = i18nMain.buildQuotaSummary(chatUuid, true, { nowMs: t0 + 190 * 60 * 1000, diskByChat: diskMap });
    assert.equal(afterResetSum.families.gemini.fiveHourWindowResetDetected, true);
    assert.equal(afterResetSum.families.gemini.fiveHourRem, 100, "Expired 5h window must auto-reset to 100%");
    assert.equal(afterResetSum.families.gemini.fiveHourReset, "");

    // 5) Even massive local transcript volume NEVER invents fake drops below real Antigravity percentages
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
    assert.equal(heavySum.families.gemini.fiveHourRem, 70, "Official 5h % must stay exact 70% with zero heuristic guesses");
    assert.equal(heavySum.families.gemini.weeklyRem, 20, "Official weekly % must stay exact 20% with zero heuristic guesses");
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
    ccCss.includes(':where([data-rudex-comp-plus="1"], [data-rudex-comp-mic="1"], [data-rudex-comp-voice="1"]):not([hidden]):not(.hidden):not(#rudex-studio-host):not(#rudex-studio-host *):not(#rudex-bg)'),
    "Claude Code toolbar must neutralize stray bg-white icon buttons & atomic voice wrappers with (3,x,0) specificity"
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
  const bVoiceWrap = ncDoc.createElement("div");
  bVoiceWrap.setAttribute("class", "relative bg-white rounded-full");
  const bVoice = ncDoc.createElement("button");
  bVoice.setAttribute("aria-label", "Включить голосовой режим");
  bVoice.getBoundingClientRect = () => ({ left: 950, top: 704, right: 978, bottom: 732, width: 28, height: 28 });
  const bVoiceSiblingSvg = ncDoc.createElement("svg");
  bVoiceWrap.appendChild(bVoice);
  bVoiceWrap.appendChild(bVoiceSiblingSvg);
  const bSend = ncDoc.createElement("button");
  bSend.setAttribute("type", "submit");
  bSend.setAttribute("aria-label", "Send");
  bSend.getBoundingClientRect = () => ({ left: 990, top: 704, right: 1018, bottom: 732, width: 28, height: 28 });
  tBar.appendChild(bPlus);
  tBar.appendChild(bModel);
  tBar.appendChild(bMode);
  tBar.appendChild(bMic);
  tBar.appendChild(bVoiceWrap);
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
    assert.equal(bVoiceWrap.getAttribute("data-rudex-comp-voice"), "1", "Atomic single-button Voice Mode wrapper (with sibling SVG) must receive data-rudex-comp-voice");
    assert.equal(bVoiceWrap.getAttribute("data-rudex-comp-group"), null, "Atomic single-button Voice Mode wrapper MUST NOT get display:contents (would detach sibling SVG!)");
    assert.equal(bVoice.getAttribute("data-rudex-comp-send"), null, "Voice mode button must never be marked as send");
    assert.equal(bSend.getAttribute("data-rudex-comp-send"), "1", "Submit send button must receive data-rudex-comp-send");
    assert.equal(bMic.getAttribute("data-rudex-comp-mic"), "1");
    assert.equal(bPlus.getAttribute("data-rudex-comp-plus"), "1");
    assert.equal(bMode.getAttribute("data-rudex-comp-mode"), "1");
    // topPx must center send inside Reply text line (ce center 666) relative to outerComp (top 600) => 666 - 600 - 14 = 52px
    assert.equal(outerComp.style.getPropertyValue("--rudex-cc-send-top"), "52px", "Send arrow must center inside Reply box below New Chat top-bar");

    // 7) Empty idle input (NO submit/cancel button in DOM): '+' MUST NEVER be stolen as send, Voice Mode wrapper stays atomic data-rudex-comp-voice!
    tBar.removeChild(bSend);
    ncTe.scanWallpaperShells();
    assert.equal(bPlus.getAttribute("data-rudex-comp-plus"), "1", "Empty idle input must keep '+' as plus");
    assert.equal(bPlus.getAttribute("data-rudex-comp-send"), null, "Empty idle input must NEVER steal '+' as send");
    assert.equal(bMic.getAttribute("data-rudex-comp-mic"), "1", "Empty idle input must keep mic as mic");
    assert.equal(bVoiceWrap.getAttribute("data-rudex-comp-voice"), "1", "Empty idle input must keep Voice Mode wrapper as voice");
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

// =============================================================================
// 26. v5.0 Comprehensive Bugfix & UX Regression Suite
// =============================================================================
test("Claude Code composer: wallpaper effectiveBlurPx, multiline send anchoring, and voice dictation active-mic stability across scans", () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));

  // 1) Wallpaper + Claude Code must NOT throw ReferenceError: effectiveBlurPx is not defined
  const wpCss = te.buildThemeCss({
    presetId: "claude-code-dark",
    uiStyle: { preset: "claude-code" },
    wallpaper: { type: "gradient", gradientPreset: "antigravity" },
    glassBlur: 18,
  }, { hostIsLight: false });
  assert.ok(wpCss.includes("backdrop-filter: blur("), "Wallpaper + Claude Code must emit valid backdrop blur CSS");
  assert.ok(wpCss.includes("padding: 0 36px 0 0 !important;"), "Claude Code textbox must reserve right padding for bottom-right send arrow");
  assert.ok(wpCss.includes("overflow: visible !important;"), "Claude Code inputRow must allow slash/mention popups (overflow: visible)");
  assert.ok(wpCss.includes('[data-rudex-comp-mic-active="1"]'), "Claude Code CSS must include active dictation pill styling");

  // 2) Multiline composer + active dictation ("Stop Voice Recording" / "Остановить запись голоса")
  const { doc, win } = createMockDom();
  win.innerWidth = 1400;
  win.innerHeight = 900;
  const outer = doc.createElement("div");
  outer.style.borderRadius = "16px";
  outer.style.backgroundColor = "rgb(30, 30, 28)";
  outer.getBoundingClientRect = () => ({ left: 260, top: 480, right: 1060, bottom: 740, width: 800, height: 260 });

  const inRow = doc.createElement("div");
  inRow.getBoundingClientRect = () => ({ left: 260, top: 480, right: 1060, bottom: 688, width: 800, height: 208 });
  const ce = doc.createElement("div");
  ce.setAttribute("contenteditable", "true");
  ce.textContent = "Line 1\n\nLine 2\n\nLine 3\n\nLine 4";
  ce.getBoundingClientRect = () => ({ left: 276, top: 494, right: 1020, bottom: 674, width: 744, height: 180 });
  inRow.appendChild(ce);

  const tBar = doc.createElement("div");
  tBar.getBoundingClientRect = () => ({ left: 260, top: 688, right: 1060, bottom: 740, width: 800, height: 52 });

  const bPlus = doc.createElement("button");
  bPlus.textContent = "+";
  bPlus.getBoundingClientRect = () => ({ left: 270, top: 698, right: 298, bottom: 726, width: 28, height: 28 });

  const bModel = doc.createElement("button");
  bModel.setAttribute("data-testid", "model-selector-trigger");
  bModel.textContent = "Gemini 4 Neon";
  // After Claude Code CSS order:-9 moves mic to the left of modelTrig visually, modelTrig.left > mic.left!
  bModel.getBoundingClientRect = () => ({ left: 680, top: 698, right: 860, bottom: 726, width: 180, height: 28 });

  const bMode = doc.createElement("button");
  bMode.textContent = "Турбо";
  bMode.getBoundingClientRect = () => ({ left: 870, top: 698, right: 940, bottom: 726, width: 70, height: 28 });

  // Active dictation button in DOM AFTER modelTrig, but visually positioned LEFT of modelTrig by CSS order:-9
  const bMic = doc.createElement("button");
  bMic.setAttribute("aria-label", "Stop Voice Recording");
  bMic.setAttribute("aria-pressed", "true");
  bMic.getBoundingClientRect = () => ({ left: 304, top: 698, right: 344, bottom: 726, width: 40, height: 28 });

  const bCancelMic = doc.createElement("button");
  bCancelMic.setAttribute("aria-label", "Cancel recording");
  bCancelMic.getBoundingClientRect = () => ({ left: 350, top: 698, right: 378, bottom: 726, width: 28, height: 28 });

  const bSend = doc.createElement("button");
  bSend.setAttribute("type", "submit");
  bSend.setAttribute("aria-label", "Send message");
  bSend.getBoundingClientRect = () => ({ left: 1018, top: 650, right: 1046, bottom: 678, width: 28, height: 28 });

  tBar.appendChild(bPlus);
  tBar.appendChild(bModel);
  tBar.appendChild(bMode);
  tBar.appendChild(bMic);
  tBar.appendChild(bCancelMic);
  tBar.appendChild(bSend);
  outer.appendChild(inRow);
  outer.appendChild(tBar);
  doc.body.appendChild(outer);

  const eng = te.createThemeEngine({ document: doc, window: win });
  try {
    eng.apply({ presetId: "claude-code-dark", uiStyle: { preset: "claude-code" } });
    // Multiline send arrow must anchor near bottom of inRow (inRow.bottom 688 - outer.top 480 - 38 = 170px), NOT middle (~90px)
    const sendTop = parseInt(outer.style.getPropertyValue("--rudex-cc-send-top"), 10);
    assert.ok(sendTop >= 150, `Multiline Claude Code send arrow must anchor near bottom-right (got ${sendTop}px)`);

    // Active recording mic & cancel-recording must NEVER be hijacked as send, and MUST receive data-rudex-comp-mic-active!
    assert.equal(bMic.getAttribute("data-rudex-comp-mic"), "1", "Active Stop Voice Recording button must stay classified as mic");
    assert.equal(bMic.getAttribute("data-rudex-comp-mic-active"), "1", "Active Stop Voice Recording button must get data-rudex-comp-mic-active");
    assert.equal(bMic.getAttribute("data-rudex-comp-send"), null, "Active Stop Voice Recording button must NEVER be hijacked as send");
    assert.equal(bCancelMic.getAttribute("data-rudex-comp-mic"), "1", "Cancel recording button must stay classified as mic");
    assert.equal(bCancelMic.getAttribute("data-rudex-comp-send"), null, "Cancel recording button must NEVER be hijacked as send");
    assert.equal(bSend.getAttribute("data-rudex-comp-send"), "1", "Real Send button must stay classified as send");

    // Repeated scan (simulating typing / dictation text updates while CSS order:-9 keeps mic left of modelTrig)
    eng.scanWallpaperShells();
    assert.equal(bMic.getAttribute("data-rudex-comp-mic"), "1", "2nd scan must keep active mic classified as mic");
    assert.equal(bMic.getAttribute("data-rudex-comp-mic-active"), "1", "2nd scan must preserve data-rudex-comp-mic-active");
    assert.equal(bMic.getAttribute("data-rudex-comp-send"), null, "2nd scan must never steal active mic as send");

    // When recording stops -> idle Start Voice Recording clears active pill while keeping mic icon visible
    bMic.setAttribute("aria-label", "Начать запись голоса");
    bMic.removeAttribute("aria-pressed");
    tBar.removeChild(bCancelMic);
    eng.scanWallpaperShells();
    assert.equal(bMic.getAttribute("data-rudex-comp-mic"), "1", "Idle Russian voice recording button must keep data-rudex-comp-mic");
    assert.equal(bMic.getAttribute("data-rudex-comp-mic-active"), null, "Idle mic must clear data-rudex-comp-mic-active");

    // 3) Lexical absolute placeholder overlay + empty slot inside inputRow must be tagged & aligned at (0,0) with zero double-padding
    const phWrap = doc.createElement("div");
    phWrap.className = "relative min-h-[44px] py-3 px-4";
    const emptySlot = doc.createElement("div");
    emptySlot.className = "attachments-empty";
    const phDiv = doc.createElement("div");
    phDiv.className = "pointer-events-none absolute top-3 left-4 text-muted-foreground";
    const phSpan = doc.createElement("span");
    phSpan.textContent = "Спросите что угодно, @ — упомянуть, / — команды";
    phDiv.appendChild(phSpan);
    inRow.removeChild(ce);
    phWrap.appendChild(ce);
    phWrap.appendChild(phDiv);
    inRow.appendChild(emptySlot);
    inRow.appendChild(phWrap);
    eng.scanWallpaperShells();

    assert.equal(ce.getAttribute("data-rudex-comp-editor"), "1", "Editor inside inputRow must be tagged data-rudex-comp-editor");
    assert.equal(phWrap.getAttribute("data-rudex-comp-editor-wrap"), "1", "Editor wrapper must be tagged data-rudex-comp-editor-wrap");
    assert.equal(phDiv.getAttribute("data-rudex-comp-placeholder"), "wrap", "Lexical placeholder overlay inside editor wrapper must get data-rudex-comp-placeholder='wrap'");
    assert.equal(phSpan.getAttribute("data-rudex-comp-placeholder-inner"), "1", "Inner placeholder span must get data-rudex-comp-placeholder-inner");
    assert.equal(emptySlot.getAttribute("data-rudex-comp-empty-slot"), "1", "Empty sibling container inside inputRow must be hidden via data-rudex-comp-empty-slot");
    assert.ok(wpCss.includes('[data-rudex-comp-placeholder="wrap"]'), "Claude Code CSS must zero-align placeholder overlay inside editor wrapper");
    const codexAlignCss = te.buildThemeCss({ presetId: "native", uiStyle: { preset: "codex" } });
    const ocAlignCss = te.buildThemeCss({ presetId: "native", uiStyle: { preset: "opencode" } });
    assert.ok(codexAlignCss.includes('[data-rudex-comp-placeholder="wrap"]'), "Codex CSS must zero-align placeholder overlay");
    assert.ok(ocAlignCss.includes('[data-rudex-comp-placeholder="wrap"]'), "OpenCode CSS must zero-align placeholder overlay");
  } finally {
    eng.destroy();
  }
});

test("Studio UX redesign: 6 grouped tabs, sticky subtabs, non-blocking live drawer, legacy routing, and platform suites", () => {
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));

  const css = buildStudioStyles();
  assert.ok(css.includes(".modal-backdrop.is-appearance-live") && css.includes("pointer-events: none"), "Live Appearance preview backdrop must be non-blocking");
  assert.ok(css.includes(".modal-sticky-subtabs"), "Studio CSS must style sticky subtabs");
  assert.ok(css.includes(".nav-group-label"), "Studio CSS must style grouped sidebar navigation");

  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, initialLocale: "ru" });
  const engine = te.createThemeEngine({ document: doc, window: win });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      on() {},
      removeListener() {},
      send() {},
      sendSync() { return { ok: true }; },
      async invoke(ch) {
        if (ch === "agy-studio:get-state") return { ok: true, locale: "ru", settings: {} };
        if (ch === "agy-studio:get-workspace-path") return { ok: true, workspacePath: "" };
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: engine,
  });

  try {
    panel.init();
    const host = doc.getElementById("rudex-studio-host");
    assert.equal(host.getAttribute("data-rudex-ignore"), "1", "Studio host must set data-rudex-ignore=1");
    const root = host.shadowRoot.querySelector(".studio-root");
    assert.equal(root.getAttribute("data-rudex-ignore"), "1");
    const modalMount = host.shadowRoot.querySelector(".modal-mount");

    panel.setOpen(true, { tab: "appearance", appSubTab: "theme" });
    assert.ok(modalMount.innerHTML.includes("nav-group-label"), "Redesigned sidebar must group navigation tabs");
    assert.ok(modalMount.innerHTML.includes("modal-sticky-subtabs"), "Modal must render sticky subtabs");
    assert.ok(modalMount.innerHTML.includes('data-action="apply-platform-suite"'), "Theme tab must offer 1-click Codex & OpenCode platform suites");
    assert.ok(modalMount.innerHTML.includes('data-action="set-theme-filter"'), "Theme tab must offer Dark/Light/All filter pills");

    // Backwards-compatible legacy routing
    panel.setOpen(true, { tab: "settings", subTab: "workshop" });
    assert.ok(modalMount.innerHTML.includes("Мастерская AGY"), "Legacy settings->workshop must route to Workshop tab");
    panel.setOpen(true, { tab: "settings", subTab: "history" });
    assert.ok(modalMount.innerHTML.includes("История") || modalMount.innerHTML.includes("Черновик"), "Legacy settings->history must route to History tab");
    panel.setOpen(true, { tab: "live-edits" });
    assert.ok(modalMount.innerHTML.includes("Пульт агента") || modalMount.innerHTML.includes("Правки"), "Legacy live-edits must route to Agent Hub");
  } finally {
    panel.destroy();
    engine.destroy();
    translator.destroy();
  }
});

test("DOM translator protects #rudex-studio-host Shadow DOM and [data-testid='agent-response']", () => {
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const { doc, win } = createMockDom();

  const studioHost = doc.createElement("div");
  studioHost.id = "rudex-studio-host";
  const sr = studioHost.attachShadow({ mode: "open" });
  const studioSpan = doc.createElement("span");
  studioSpan.textContent = "Settings";
  sr.appendChild(studioSpan);
  doc.body.appendChild(studioHost);

  const agentResp = doc.createElement("div");
  agentResp.setAttribute("data-testid", "agent-response");
  const respP = doc.createElement("p");
  respP.textContent = "Settings";
  agentResp.appendChild(respP);
  doc.body.appendChild(agentResp);

  const navBtn = doc.createElement("button");
  navBtn.textContent = "Settings";
  doc.body.appendChild(navBtn);

  const tr = createDomTranslator({
    document: doc,
    window: win,
    dictionary: { Settings: "Настройки" },
    applyDynamicRules,
    initialLocale: "ru",
  });
  try {
    tr.init();
    assert.equal(navBtn.textContent, "Настройки", "Normal UI button must be translated");
    assert.equal(studioSpan.textContent, "Settings", "Studio Shadow DOM must never be walked/translated by dom-translator");
    assert.equal(respP.textContent, "Settings", "Agent response content must never be translated by UI dom-translator");
  } finally {
    tr.destroy();
  }
});

test("Backend v5.0 fixes: keybinding recording pause, uiStyle merge, workshop Cyrillic/malformed MCP, urgent __new__ hook, semver", () => {
  const ws = require(path.join(SCRIPTS_DIR, "agy-workshop.js"));
  const { compareSemver: cmpVer } = require(path.join(SCRIPTS_DIR, "updater-core.js"));

  // 1) updater-core compareSemver with v-prefix and prereleases
  assert.equal(cmpVer("v5.0.0", "5.0.0"), 0, "v5.0.0 must equal 5.0.0");
  assert.ok(cmpVer("5.0.0", "5.0.0-beta.1") > 0, "Release 5.0.0 must be newer than 5.0.0-beta.1");
  assert.ok(cmpVer("5.0.0-beta.1", "5.0.0") < 0);

  // 2) agy-workshop: Cyrillic skill slug, disabled root rules, malformed MCP protection, quoted args, deleteRule guard
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-ws-v5-"));
  const prevCfgEnv = process.env.RUDEX_AGY_CONFIG_DIR;
  try {
    const fakeGlobal = path.join(tmpDir, "global-cfg");
    const fakeWs = path.join(tmpDir, "workspace");
    fs.mkdirSync(fakeGlobal, { recursive: true });
    fs.mkdirSync(fakeWs, { recursive: true });
    process.env.RUDEX_AGY_CONFIG_DIR = fakeGlobal;

    const cyrSkill = ws.saveSkill({ scope: "global", name: "Ревью кода", description: "Проверка PR", body: "Check diff" });
    assert.equal(cyrSkill.ok, true, "Cyrillic skill name must transliterate cleanly");
    assert.equal(cyrSkill.slug, "revyu-koda");

    fs.writeFileSync(path.join(fakeWs, "AGENTS.md.disabled"), "# Disabled root rule\n", "utf8");
    const listed = ws.listCustomizations({ workspacePath: fakeWs });
    const disRoot = listed.rules.find((r) => r.fileName === "AGENTS.md" && r.scope === "workspace");
    assert.ok(disRoot && disRoot.enabled === false, "Disabled root AGENTS.md.disabled must still be listed");

    const nonMdPath = path.join(fakeGlobal, "important.json");
    fs.writeFileSync(nonMdPath, "{}", "utf8");
    const badDel = ws.deleteRule({ path: nonMdPath });
    assert.equal(badDel.ok, false);
    assert.equal(badDel.error, "INVALID_RULE_FILE");
    assert.ok(fs.existsSync(nonMdPath), "deleteRule must never delete non-.md files");

    const mcpSave = ws.saveMcpServer({
      scope: "global",
      name: "quoted-srv",
      command: "node",
      argsText: '--dir "C:\\My Projects\\demo" --flag',
    });
    assert.equal(mcpSave.ok, true);
    assert.deepEqual(mcpSave.server.args, ["--dir", "C:\\My Projects\\demo", "--flag"], "Quoted MCP args must preserve spaces");

    const mcpPath = path.join(fakeGlobal, "mcp_config.json");
    fs.writeFileSync(mcpPath, "{ broken json !!!", "utf8");
    const badMcp = ws.saveMcpServer({ scope: "global", name: "other", command: "npx", argsText: "demo" });
    assert.equal(badMcp.ok, false);
    assert.equal(badMcp.error, "MALFORMED_MCP_CONFIG");
    assert.equal(fs.readFileSync(mcpPath, "utf8"), "{ broken json !!!", "Malformed mcp_config.json must never be overwritten");
  } finally {
    if (prevCfgEnv === undefined) delete process.env.RUDEX_AGY_CONFIG_DIR;
    else process.env.RUDEX_AGY_CONFIG_DIR = prevCfgEnv;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 3) rudex-hook PreToolUse urgent live edit created on "__new__" chat
  const hookTmp = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-hook-urgent-new-"));
  try {
    const queueDir = path.join(hookTmp, "studio_live_edits", "queue");
    fs.mkdirSync(queueDir, { recursive: true });
    fs.writeFileSync(path.join(hookTmp, "studio_live_edits", "pending.flag"), "1", "utf8");
    fs.writeFileSync(
      path.join(queueDir, "le-1.json"),
      JSON.stringify({
        id: "le-1",
        chatKey: "__new__",
        text: "Не трогай конфиг!",
        status: "pending",
        urgent: true,
        fallbackAny: true,
        createdAt: Date.now(),
      }),
      "utf8"
    );
    const proc = spawnSync(process.execPath, [path.join(SCRIPTS_DIR, "rudex-hook.js")], {
      input: JSON.stringify({
        hookEventName: "PreToolUse",
        conversationId: "11111111-2222-3333-4444-555555555555",
        toolCall: { name: "write_file", args: { Path: "a.txt" } },
      }),
      env: Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: hookTmp, RUDEX_SKIP_AUTO_REPATCH: "1" }),
      encoding: "utf8",
    });
    assert.equal(proc.status, 0);
    const out = JSON.parse(proc.stdout.trim());
    assert.equal(out.decision, "deny", "Urgent live edit queued on __new__ chat must intercept mutating PreToolUse");
    assert.ok(String(out.reason || "").includes("Не трогай конфиг!"));
  } finally {
    fs.rmSync(hookTmp, { recursive: true, force: true });
  }

  // 4) i18n-main keybinding recording pause + Ctrl+Plus normalization + uiStyle deep merge
  const NodeModule = require("node:module");
  const mainTmp = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-main-v5-"));
  try {
    const mockElectron = {
      app: { getPath: () => mainTmp, isReady: () => false, on() {} },
      ipcMain: { handle() {}, on() {} },
      BrowserWindow: { getAllWindows: () => [], getFocusedWindow: () => null },
      Menu: { getApplicationMenu: () => null },
      protocol: { handle() {} },
      dialog: {},
      shell: {},
      clipboard: {},
      nativeImage: {},
    };
    const origLoad = NodeModule._load;
    let i18nMain;
    NodeModule._load = function (req, parent, isMain) {
      if (req === "electron") return mockElectron;
      return origLoad.apply(this, arguments);
    };
    try {
      delete require.cache[require.resolve(path.join(SCRIPTS_DIR, "i18n-main.js"))];
      i18nMain = require(path.join(SCRIPTS_DIR, "i18n-main.js"));
    } finally {
      NodeModule._load = origLoad;
    }

    assert.equal(i18nMain.sanitizeKeybindings({ toggleStudio: "Ctrl++" }).toggleStudio, "Ctrl+Plus");
    assert.equal(
      i18nMain.matchInputToCombo({ type: "keyDown", control: true, alt: false, shift: false, key: " ", code: "Space" }, "Ctrl+Space"),
      true
    );

    const fakeContents = { isDestroyed: () => false, send() {} };
    i18nMain.setRecordingKeybinding(true);
    assert.equal(
      i18nMain.handleKeybindingEvent(fakeContents, { type: "keyDown", control: true, alt: true, shift: false, key: "p", code: "KeyP" }),
      false,
      "Active keybinding recording must pause global hotkey interception"
    );
    i18nMain.setRecordingKeybinding(false);
  } finally {
    fs.rmSync(mainTmp, { recursive: true, force: true });
  }
});

test("Chat tools chip visibility, opt-in model context window meter (default OFF), and wallpaper Original preset full-bleed reset", async () => {
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));

  // 1) Default showContextMeter MUST be false (OFF by default)
  assert.equal(v5Core.RUDEX_LIVE_EDIT_DEFAULTS.showContextMeter, false, "showContextMeter must be OFF by default");

  // 2) Model context window resolver handles Claude, Gemini, GPT-5/Codex, and explicit 1M/200K tags
  assert.equal(v5Core.rv5ResolveModelContextWindow("Claude Opus 5.5 Низкий").maxTokens, 200000);
  assert.equal(v5Core.rv5ResolveModelContextWindow("Claude Sonnet 4.6 (1M)").maxTokens, 1000000);
  assert.equal(v5Core.rv5ResolveModelContextWindow("Gemini 4 Neon Сверхвысокий").maxTokens, 1000000);
  assert.equal(v5Core.rv5ResolveModelContextWindow("GPT-5.3 Codex High").maxTokens, 400000);

  // 3) Chat dock omits context pill when showContextMeter=false, and renders crisp fill bar + popover when true
  const dockOff = v5Ui.rv5BuildChatDockHtml({
    agentProfile: {},
    liveEditInline: { showChatDock: true, showContextMeter: false },
    contextInfo: { modelName: "Claude Opus 5.5", usedTokens: 42000, exact: true, chatTitle: "Мой чат" },
    isRu: true,
  });
  assert.ok(dockOff.includes("rx-agent-chip"), "Tools chip must render");
  assert.equal(dockOff.includes("rx-ctx-pill"), false, "Context window pill must NOT render when showContextMeter is false");

  const dockOn = v5Ui.rv5BuildChatDockHtml({
    agentProfile: {},
    liveEditInline: { showChatDock: true, showContextMeter: true },
    contextPopoverOpen: true,
    contextInfo: { modelName: "Claude Opus 5.5 Низкий", usedTokens: 50000, exact: true, chatTitle: "Рефакторинг UI" },
    isRu: true,
  });
  assert.ok(dockOn.includes("rx-ctx-pill"), "Context window pill must render when showContextMeter is true");
  assert.ok(dockOn.includes("50K / 200K") && dockOn.includes("25%"), "Context pill must show exact used/max tokens and % fill");
  assert.ok(dockOn.includes("rx-ctx-popover") && dockOn.includes("Рефакторинг UI"), "Context popover must show active chat name & breakdown");

  // 4) Tools chip CSS inherits exact composer glass/gradient tokens & Claude Code wallpaper adds subtle contrast backdrop to top/bottom bars
  const v5Css = v5Core.rv5BuildExtraShadowCss();
  assert.ok(
    v5Css.includes(".rx-ctx-pill") &&
      v5Css.includes("opacity: 1;") &&
      v5Css.includes("var(--rx-comp-bg") &&
      v5Css.includes("var(--rx-comp-bg-image") &&
      v5Css.includes("var(--rx-comp-border") &&
      v5Css.includes("var(--rx-comp-blur"),
    "Tools & context chips must match composer glass/gradient tokens"
  );
  const ccWpCss = te.buildThemeCss({
    presetId: "custom",
    uiStyle: { preset: "claude-code", composer: "claude-code", chat: "claude-code", modelSelector: "claude-code" },
    wallpaper: { type: "gradient", gradientPreset: "antigravity" },
  });
  assert.ok(
    ccWpCss.includes('[data-rudex-comp-top-row="1"]') &&
      ccWpCss.includes('[data-rudex-comp-toolbar="1"]') &&
      ccWpCss.includes("backdrop-filter: blur("),
    "Claude Code over wallpaper must give top context strip and bottom toolbar a subtle frosted backdrop"
  );

  // 5) Wallpaper 'Оригинал' atmosphere preset resets full-bleed fit='cover', scale=100, offset=0, rotate=0, blur=0
  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, initialLocale: "ru" });
  const engine = te.createThemeEngine({ document: doc, window: win });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      on() {},
      removeListener() {},
      send() {},
      sendSync() { return { ok: true }; },
      async invoke(ch) {
        if (ch === "agy-studio:get-state") {
          return {
            ok: true,
            locale: "ru",
            settings: {
              appearance: {
                wallpaper: {
                  type: "image",
                  mediaUrl: "agy-media://local/bg.png",
                  mediaFile: "bg.png",
                  fit: "contain",
                  scale: 70,
                  blur: 10,
                  dim: 55,
                  offsetX: 15,
                  offsetY: -10,
                  rotate: 90,
                  flipX: true,
                  tintEnabled: true,
                },
              },
            },
          };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: engine,
  });

  try {
    panel.init();
    panel.applyRemoteState({
      locale: "ru",
      settings: {
        appearance: {
          wallpaper: {
            type: "image",
            mediaUrl: "agy-media://local/bg.png",
            mediaFile: "bg.png",
            fit: "contain",
            scale: 70,
            blur: 10,
            dim: 55,
            offsetX: 15,
            offsetY: -10,
            rotate: 90,
            flipX: true,
            tintEnabled: true,
          },
        },
      },
    }, true);
    panel.setOpen(true, { tab: "appearance", appSubTab: "wallpaper" });
    const host = doc.getElementById("rudex-studio-host");
    const root = host.shadowRoot.querySelector(".studio-root");

    // Click "Кино", then click "Оригинал" -> must reset fit="cover", scale=100, offset=0, rotate=0, flipX=false, tintEnabled=false!
    const cineBtn = doc.createElement("button");
    cineBtn.setAttribute("data-action", "apply-wp-atmos");
    cineBtn.setAttribute("data-id", "cinema");
    root.appendChild(cineBtn);
    root.dispatchEvent({ type: "click", target: cineBtn });

    const origBtn = doc.createElement("button");
    origBtn.setAttribute("data-action", "apply-wp-atmos");
    origBtn.setAttribute("data-id", "original");
    root.appendChild(origBtn);
    root.dispatchEvent({ type: "click", target: origBtn });
    await new Promise((r) => setTimeout(r, 25));

    const cur = engine.getCurrent();
    assert.equal(cur.wallpaper.fit, "cover", "Original wallpaper preset must restore fit='cover' (full-bleed stretch)");
    assert.equal(cur.wallpaper.scale, 100, "Original wallpaper preset must restore scale=100%");
    assert.equal(cur.wallpaper.blur, 0);
    assert.equal(cur.wallpaper.offsetX, 0);
    assert.equal(cur.wallpaper.rotate, 0);
    assert.equal(cur.wallpaper.flipX, false);
    assert.equal(cur.wallpaper.tintEnabled, false);

    // Normal scroll wheel (without Ctrl) over wp-stage MUST NOT shrink wp.scale
    const stageEl = doc.createElement("div");
    stageEl.setAttribute("data-wp-stage", "1");
    root.appendChild(stageEl);
    root.dispatchEvent({ type: "wheel", target: stageEl, deltaY: 120, ctrlKey: false, metaKey: false });
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(engine.getCurrent().wallpaper.scale, 100, "Plain wheel scroll over wallpaper preview must NOT change scale");
    root.dispatchEvent({ type: "wheel", target: stageEl, deltaY: -120, ctrlKey: true, metaKey: false });
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(engine.getCurrent().wallpaper.scale, 105, "Ctrl+wheel over wallpaper preview must zoom scale smoothly");
  } finally {
    panel.destroy();
    engine.destroy();
    translator.destroy();
  }
});

test("Silent WSH (zero console popup) update/exit watchers and third-party patcher app.asar preservation", async () => {
  const vm = require("vm");
  const updater = require(path.join(SCRIPTS_DIR, "updater-core.js"));
  const installer = require(path.join(SCRIPTS_DIR, "install.js"));

  // 1) wshEscapeJsString produces pure ASCII even for Cyrillic Windows usernames
  const cyrPath = "C:\\Users\\Иван\\AppData\\Local\\Programs\\antigravity\\resources";
  const escaped = updater.wshEscapeJsString(cyrPath);
  assert.equal(/[^\x20-\x7E]/.test(escaped), false, "WSH escaped string must be pure ASCII for locale-safe WSH parsing");
  assert.equal(JSON.parse(escaped), cyrPath, "Escaped string must decode identically to the original Cyrillic path");

  // 2) patchUpdaterJs hooks before-quit-for-update (NOT generic app.once('will-quit') which misfired on normal quits)
  const shellSrc = fs.readFileSync(path.join(SCRIPTS_DIR, "electron-shell.js"), "utf8");
  assert.ok(shellSrc.includes("before-quit-for-update"), "patchUpdaterJs must hook before-quit-for-update instead of generic will-quit");
  assert.equal(shellSrc.includes("electron_1.app.once('will-quit'"), false, "Must not arm post-update watcher on normal manual quit");

  // 3) All generated WSH scripts parse cleanly as valid JS, stay pure ASCII, and never call taskkill in passive on-exit mode
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-wsh-silent-"));
  try {
    if (process.platform === "win32") {
      const onExitPath = path.join(tmpDir, "on-exit.js");
      const onExitLock = path.join(tmpDir, "on-exit.lock");
      const outOnExit = installer.writeOnExitActivateWsh(
        { resourcesDir: cyrPath, exePath: "C:\\Users\\Иван\\Antigravity.exe" },
        { outPath: onExitPath, lockPath: onExitLock, expectedAsarSize: 12345, expectedAsarMtimeSec: 1700000000 }
      );
      assert.equal(outOnExit, onExitPath);
      const onExitSrc = fs.readFileSync(onExitPath, "utf8");
      assert.equal(/[^\r\n\x20-\x7E]/.test(onExitSrc), false, "on-exit WSH script must be pure ASCII");
      assert.equal(/taskkill/i.test(onExitSrc), false, "Passive WSH on-exit activator must NEVER invoke taskkill");
      assert.ok(onExitSrc.includes("expectedSize = 12345"), "WSH on-exit activator must detect post-staging third-party app.asar changes");
      assert.doesNotThrow(() => new vm.Script(onExitSrc), "WSH on-exit script must be syntactically valid JS");

      const restartPath = path.join(tmpDir, "restart.js");
      const outRestart = updater.writeUpdaterRestartWsh("C:\\Users\\Иван\\Antigravity.exe", {
        outPath: restartPath,
        removeAsar: true,
        resourcesDir: cyrPath,
      });
      assert.equal(outRestart, restartPath);
      const restartSrc = fs.readFileSync(restartPath, "utf8");
      assert.equal(/[^\r\n\x20-\x7E]/.test(restartSrc), false, "Restart WSH script must be pure ASCII");
      assert.doesNotThrow(() => new vm.Script(restartSrc), "WSH restart script must be syntactically valid JS");

      // 4) Live wscript.exe silent runner test: executes node child with envPatch and cleans up its temp wrapper
      const markerOut = path.join(tmpDir, "wsh-ran.json");
      const childScript = path.join(tmpDir, "child.js");
      fs.writeFileSync(
        childScript,
        `const fs = require("fs"); fs.writeFileSync(${JSON.stringify(markerOut)}, JSON.stringify({ argv: process.argv.slice(2), noAsar: process.env.ELECTRON_NO_ASAR }), "utf8");\n`,
        "utf8"
      );
      const okSpawn = updater.spawnSilentWindowsCommand(process.execPath, [childScript, "--silent-ok"], {
        env: process.env,
        envPatch: { ELECTRON_NO_ASAR: "1" },
      });
      assert.equal(okSpawn, true, "spawnSilentWindowsCommand must succeed on Windows");
      for (let i = 0; i < 80 && !fs.existsSync(markerOut); i += 1) {
        await new Promise((r) => setTimeout(r, 25));
      }
      assert.ok(fs.existsSync(markerOut), "Silent wscript.exe runner must execute target command invisibly");
      const resObj = JSON.parse(fs.readFileSync(markerOut, "utf8"));
      assert.deepEqual(resObj.argv, ["--silent-ok"]);
      assert.equal(resObj.noAsar, "1");
    }

    // 5) hashFileSha256 detects even same-byte-length in-place third-party patches on app.asar
    const fA = path.join(tmpDir, "a.asar");
    const fB = path.join(tmpDir, "b.asar");
    fs.writeFileSync(fA, "REGION_BLOCKED_FLAG=1", "utf8");
    fs.writeFileSync(fB, "REGION_BLOCKED_FLAG=0", "utf8");
    assert.equal(fs.statSync(fA).size, fs.statSync(fB).size);
    assert.notEqual(installer.hashFileSha256(fA), installer.hashFileSha256(fB), "SHA-256 must detect same-size in-place third-party patches");

    // 6) rudex-hook.js immediately detects a same-size in-place third-party patch when mtime advances
    const mockResDir = path.join(tmpDir, "agy", "resources");
    const mockAppRoot = path.dirname(mockResDir);
    const mockPluginDir = path.join(tmpDir, "plugin-rudex");
    const mockUserData = path.join(tmpDir, "userData");
    const marker2 = path.join(tmpDir, "third-party-repatch.txt");
    fs.mkdirSync(mockResDir, { recursive: true });
    fs.mkdirSync(path.join(mockPluginDir, "skills", "rudex", "scripts"), { recursive: true });
    fs.mkdirSync(mockUserData, { recursive: true });
    fs.writeFileSync(path.join(mockAppRoot, "version"), "44.9.1\n", "utf8");
    const asarFile = path.join(mockResDir, "app.asar");
    fs.writeFileSync(asarFile, "REGION_BLOCKED_FLAG=1", "utf8");
    fs.writeFileSync(path.join(mockPluginDir, "plugin.json"), '{"name":"rudex","version":"5.0.0"}', "utf8");
    fs.writeFileSync(
      path.join(mockPluginDir, "skills", "rudex", "scripts", "install.js"),
      `"use strict";\nconst fs = require("fs");\nfs.writeFileSync(${JSON.stringify(marker2)}, String(Date.now()), "utf8");\n`,
      "utf8"
    );

    const hookScript = path.join(SCRIPTS_DIR, "rudex-hook.js");
    const baseEnv = Object.assign({}, process.env, {
      AGY_STUDIO_USER_DATA: mockUserData,
      ANTIGRAVITY_RESOURCES_DIR: mockResDir,
      RUDEX_PLUGIN_DIR: mockPluginDir,
      RUDEX_SKIP_AUTO_REPATCH: "0",
    });
    const run1 = spawnSync(process.execPath, [hookScript], {
      input: JSON.stringify({ hookEventName: "SessionStart", conversationId: "12345678-1111-4111-8111-111111111111" }),
      env: baseEnv,
      encoding: "utf8",
    });
    assert.equal(run1.status, 0, run1.stderr);
    for (let i = 0; i < 80 && !fs.existsSync(marker2); i += 1) await new Promise((r) => setTimeout(r, 25));
    assert.ok(fs.existsSync(marker2), "First run must trigger silent recovery");

    // Now simulate a third-party unblocker patching app.asar in-place with the EXACT SAME byte length + newer mtime
    fs.unlinkSync(marker2);
    fs.writeFileSync(asarFile, "REGION_BLOCKED_FLAG=0", "utf8");
    const futureSec = Math.floor(Date.now() / 1000) + 120;
    fs.utimesSync(asarFile, futureSec, futureSec);
    const run2 = spawnSync(process.execPath, [hookScript], {
      input: JSON.stringify({ hookEventName: "PreInvocation", conversationId: "12345678-1111-4111-8111-111111111111" }),
      env: baseEnv,
      encoding: "utf8",
    });
    assert.equal(run2.status, 0, run2.stderr);
    for (let i = 0; i < 80 && !fs.existsSync(marker2); i += 1) await new Promise((r) => setTimeout(r, 25));
    assert.ok(fs.existsSync(marker2), "Same-size in-place third-party patch with new mtime must immediately trigger silent re-layering");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Hideable Tools chip, clickable task/quota notifications (including offline Windows Toast), and opt-in Auto-Continue", async () => {
  const vm = require("vm");
  const Module = require("module");
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { patchIpcHandlersJs } = require(path.join(SCRIPTS_DIR, "electron-shell.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));

  // 1) Defaults: notifyOnReset=true, notifyWhenClosed=false (opt-in OS scheduler), autoContinueEnabled=false
  assert.equal(v5Core.RUDEX_QUOTA_AUTOMATION_DEFAULTS.notifyOnReset, true, "Quota reset notification must be ON by default");
  assert.equal(v5Core.RUDEX_QUOTA_AUTOMATION_DEFAULTS.notifyWhenClosed, false, "Offline quota OS task must be OFF by default (opt-in)");
  assert.equal(v5Core.RUDEX_QUOTA_AUTOMATION_DEFAULTS.autoContinueEnabled, false, "Auto-continue must be OFF by default");

  // 2) Hiding Tools chip (showChatDock=false) hides .rx-agent-chip while keeping independent context meter & waiting badge
  const hiddenBar = v5Ui.rv5BuildChatDockHtml({
    agentProfile: {},
    liveEditInline: { showChatDock: false, showContextMeter: true },
    contextInfo: { modelName: "Claude Opus 5.5", usedTokens: 20000, exact: true, chatTitle: "Чат" },
    waitingEntry: { chatKey: "aaaa1111-1111-4111-8111-111111111111", title: "Чат", family: "claudeGpt" },
    isRu: true,
  });
  assert.equal(hiddenBar.includes("rx-agent-chip"), false, "Tools button must be hidden when showChatDock=false");
  assert.ok(hiddenBar.includes("rx-ctx-pill"), "Context meter must stay visible independently");
  assert.ok(hiddenBar.includes("rx-ac-pill"), "Auto-continue armed pill must show when waiting");

  // 3) Limits settings UI renders notification toggles, Test button, and Auto-Continue scopes when enabled
  const limHtmlOff = v5Ui.rv5RenderLimitsTabHtml({
    limitsWidget: v5Core.RUDEX_LIMITS_DEFAULTS,
    quotaSummary: { chats: [] },
    quotaAutomation: v5Core.RUDEX_QUOTA_AUTOMATION_DEFAULTS,
    quotaAlerts: { waitingChats: {} },
    isRu: true,
  });
  assert.ok(limHtmlOff.includes("test-quota-notification"), "Limits UI must offer Test notification button");
  assert.ok(limHtmlOff.includes("notifyWhenClosed"), "Limits UI must offer offline closed-app notification toggle");
  assert.equal(limHtmlOff.includes("set-quota-auto-scope"), false, "Auto-continue scope options stay hidden while OFF");

  const limHtmlOn = v5Ui.rv5RenderLimitsTabHtml({
    limitsWidget: v5Core.RUDEX_LIMITS_DEFAULTS,
    quotaSummary: { chats: [{ chatKey: "aaaa1111-1111-4111-8111-111111111111", title: "Важный чат" }] },
    quotaAutomation: Object.assign({}, v5Core.RUDEX_QUOTA_AUTOMATION_DEFAULTS, { autoContinueEnabled: true, autoContinueScope: "selected" }),
    quotaAlerts: { waitingChats: {} },
    activeChatKey: "aaaa1111-1111-4111-8111-111111111111",
    activeChatTitle: "Важный чат",
    isRu: true,
  });
  assert.ok(limHtmlOn.includes("set-quota-auto-scope") && limHtmlOn.includes("toggle-quota-auto-chat") && limHtmlOn.includes("Важный чат"));

  // 4) patchIpcHandlersJs wires focusAntigravityWindow into Antigravity's native notification:send click handler
  const mockIpcSrc = [
    `const paths_1 = require("./paths");`,
    `exports.registerIpcHandlers = registerIpcHandlers;`,
    `        notification.on('click', () => {`,
    `            // A remote payload goes only to the window that posted it (if open); a`,
    `            // local one to the first local window.`,
    `            const win = remote`,
    `                ? windowForSender(event?.sender)`,
    `                : (0, utils_1.getLocalHubWindows)()[0];`,
    `            if (win) {`,
    `                if (win.isMinimized()) {`,
    `                    win.restore();`,
    `                }`,
    `                win.show();`,
    `                win.focus();`,
    `                if (options?.payload) {`,
    `                    win.webContents.send('notification:clicked', options.payload);`,
    `                }`,
    `            }`,
    `        });`,
  ].join("\n");
  const ipcPatched = patchIpcHandlersJs(mockIpcSrc, []);
  assert.ok(ipcPatched.includes("focusAntigravityWindow"), "Native Antigravity notifications must call focusAntigravityWindow on click");

  // 5) Backend i18n-main.js: clickable Notification, focusAntigravityWindow, offline WSH notifier, and quota reset transition dedupe
  const mainTmp = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-qauto-main-"));
  const origLoad = Module._load;
  const shownNotifs = [];
  let winRestored = false;
  let winShown = false;
  let winFocused = false;
  const mockWin = {
    isDestroyed: () => false,
    isMinimized: () => true,
    restore: () => { winRestored = true; },
    show: () => { winShown = true; },
    focus: () => { winFocused = true; },
    isAlwaysOnTop: () => false,
    setAlwaysOnTop: () => {},
    webContents: { isDestroyed: () => false, send: () => {} },
  };
  class MockNotification {
    constructor(opts) {
      this.opts = opts;
      this.handlers = {};
    }
    static isSupported() { return true; }
    on(ev, fn) { this.handlers[ev] = fn; }
    show() { shownNotifs.push(this); }
    triggerClick() { if (this.handlers.click) this.handlers.click(); }
  }
  const fakeElectron = {
    app: { getPath: () => mainTmp, on: () => {}, emit: () => {}, focus: () => {} },
    ipcMain: { handle: () => {}, on: () => {} },
    webContents: { getAllWebContents: () => [mockWin.webContents] },
    dialog: {},
    shell: {},
    protocol: {},
    BrowserWindow: { getAllWindows: () => [mockWin] },
    clipboard: {},
    nativeImage: {},
    Notification: MockNotification,
  };
  const i18nMainPath = path.join(SCRIPTS_DIR, "i18n-main.js");
  delete require.cache[i18nMainPath];
  Module._load = function (req, parent, isMain) {
    if (req === "electron") return fakeElectron;
    return origLoad.apply(this, arguments);
  };
  try {
    const i18nMain = require(i18nMainPath);
    const san = i18nMain.sanitizeQuotaAutomation({});
    assert.equal(san.notifyOnReset, true);
    assert.equal(san.notifyWhenClosed, false);
    assert.equal(san.autoContinueEnabled, false);

    // Offline WSH script is pure ASCII, valid JS, checks Antigravity.exe running, and uses Antigravity AUMID
    const wshCode = i18nMain.buildOfflineQuotaNotifierWsh({
      title: "Лимиты Antigravity восстановлены",
      body: "Claude / GPT снова доступны на 100%",
      exePath: "C:\\Users\\Иван\\Antigravity.exe",
      alertsPath: path.join(mainTmp, "agy_studio_quota_alerts.json"),
      cycleKey: "claudeGpt:5h:29999999",
    });
    assert.equal(/[^\r\n\x20-\x7E]/.test(wshCode), false, "Offline quota notifier WSH must be pure ASCII");
    assert.ok(wshCode.includes("electron.app.Antigravity"), "Offline Toast must target Antigravity AUMID");
    assert.doesNotThrow(() => new vm.Script(wshCode), "Offline quota notifier WSH must parse as valid JS");

    // Simulate expired 5h quota window -> fires 1 clickable notification and dedupes on second check
    const nowMs = Date.now();
    i18nMain.saveQuotaStore({
      families: {
        claudeGpt: {
          fiveHourRem: 20,
          fiveHourReset: "1h 0m",
          updatedAt: nowMs - 65 * 60 * 1000,
        },
      },
    });
    const evs1 = i18nMain.evaluateQuotaResetTransitions(nowMs, { skipOfflineSync: true });
    assert.equal(evs1.length, 1, "Expired spent 5h quota window must trigger exactly 1 reset event");
    assert.equal(shownNotifs.length, 1, "Desktop notification must fire by default when limits restore");
    // Clicking the notification must restore, show, and focus Antigravity!
    shownNotifs[0].triggerClick();
    assert.equal(winRestored && winShown && winFocused, true, "Clicking quota notification must restore, show, and focus Antigravity");

    // Second check in same reset cycle must NOT duplicate notification
    const evs2 = i18nMain.evaluateQuotaResetTransitions(nowMs + 5000, { skipOfflineSync: true });
    assert.equal(evs2.length, 0, "Already-notified quota reset cycle must not double-notify");
  } finally {
    Module._load = origLoad;
    delete require.cache[i18nMainPath];
    fs.rmSync(mainTmp, { recursive: true, force: true });
  }

  // 6) Renderer auto-continue: when enabled & scope matches, handleQuotaRestored inserts prompt and clicks Send once
  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, initialLocale: "ru" });
  const compForm = doc.createElement("form");
  compForm.setAttribute("data-testid", "composer");
  const editable = doc.createElement("div");
  editable.setAttribute("contenteditable", "true");
  editable.setAttribute("role", "textbox");
  let sentClicks = 0;
  const sendBtn = doc.createElement("button");
  sendBtn.setAttribute("data-rudex-comp-send", "1");
  sendBtn.click = () => { sentClicks += 1; };
  compForm.appendChild(editable);
  compForm.appendChild(sendBtn);
  const userMsg = doc.createElement("div");
  userMsg.setAttribute("data-testid", "user-message-content");
  userMsg.textContent = "Допиши модуль";
  doc.body.appendChild(userMsg);
  doc.body.appendChild(compForm);
  let markedResumed = 0;
  const chatId = "bbbb2222-2222-4222-8222-222222222222";
  win.location.href = `vscode-file://workbench/chat/${chatId}`;
  win.location.pathname = `/chat/${chatId}`;

  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      on() {},
      removeListener() {},
      send() {},
      sendSync() { return { ok: true }; },
      async invoke(ch) {
        if (ch === "agy-studio:mark-auto-continue-resumed") {
          markedResumed += 1;
          return { ok: true, alreadyResumed: markedResumed > 1, quotaAlerts: { waitingChats: {} } };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });
  try {
    panel.init();
    panel.pollStream();
    panel.applyRemoteState({
      locale: "ru",
      settings: {
        quotaAutomation: {
          notifyOnReset: true,
          notifyWhenClosed: true,
          autoContinueEnabled: true,
          autoContinueScope: "selected",
          autoContinueChatKeys: [chatId],
          autoContinuePrompt: "Продолжи работу пожалуйста",
        },
      },
      quotaAlerts: {
        waitingChats: {
          [chatId]: { chatKey: chatId, title: "Тест", family: "claudeGpt", reason: "limit-error", armedAt: Date.now() },
        },
      },
    }, true);

    panel.handleQuotaRestored({
      family: "claudeGpt",
      window: "5h",
      cycleKey: "claudeGpt:5h:999999",
      waitingChats: {
        [chatId]: { chatKey: chatId, title: "Тест", family: "claudeGpt", reason: "limit-error", armedAt: Date.now() },
      },
    });
    await new Promise((r) => setTimeout(r, 220));
    assert.equal(markedResumed, 1, "Auto-continue must atomically mark chat resumed before sending");
    assert.equal(editable.textContent, "Продолжи работу пожалуйста", "Auto-continue must fill composer with continue prompt");
    assert.equal(sentClicks, 1, "Auto-continue must click Send button to resume task");
  } finally {
    panel.destroy();
    translator.destroy();
  }
});

test("Limits resize stability, Settings trigger, voice dictation mutation filtering, and speech-to-text live-edit clear", async () => {
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const { createThemeEngine } = require(path.join(RES_DIR, "theme-engine.js"));

  // 1) Limits widget preview honors scale AND live widget renders corner resize grip (max-width allows up to 440px)
  const previewScaled = v5Core.rv5BuildLimitsWidgetHtml(
    { enabled: true, layout: "card", scale: 125, width: 390 },
    {},
    "Claude Opus",
    true,
    true
  );
  assert.ok(previewScaled.includes("zoom:1.25"), "Limits preview must reflect scale immediately");
  assert.ok(previewScaled.includes("width:390px"), "Limits widget must honor custom width up to 420px");
  assert.equal(previewScaled.includes("data-limits-resize"), false, "Preview must not render interactive corner resize grip");

  const liveWidgetHtml = v5Core.rv5BuildLimitsWidgetHtml(
    { enabled: true, layout: "card", scale: 115, width: 340 },
    {},
    "Claude Opus",
    true,
    false
  );
  assert.ok(liveWidgetHtml.includes('data-limits-resize="1"'), "Live limits card must expose corner resize grip");

  // 2) rv5ClearEditableText supports skipRawTextFallback so Lexical EditorState isn't prematurely desynced
  const fakeLexical = {
    tagName: "DIV",
    textContent: "диктовка текста",
    innerText: "диктовка текста",
    ownerDocument: {
      execCommand() { return false; },
      createRange() { return { selectNodeContents() {} }; },
    },
    focus() {},
    dispatchEvent() {},
  };
  v5Core.rv5ClearEditableText(fakeLexical, { getSelection: () => ({ removeAllRanges() {}, addRange() {} }) }, { skipRawTextFallback: true });
  assert.equal(fakeLexical.textContent, "диктовка текста", "skipRawTextFallback must preserve DOM until native webContents clear runs");
  v5Core.rv5ClearEditableText(fakeLexical, { getSelection: () => ({ removeAllRanges() {}, addRange() {} }) });
  assert.equal(fakeLexical.textContent, "", "Default clear still falls back when execCommand fails");

  // 3) StudioPanel: (a) Limits slider drag never snaps back when stale applyRemoteState arrives,
  //    (b) "Настройки Antigravity →" finds div-sidebar Settings OR falls back to open-native-settings IPC,
  //    (c) Speech-to-text live-edit clears residual/re-flushed dictated text cleanly!
  const { doc, win } = createMockDom();
  let clearFocusedCalls = 0;
  let openNativeSettingsIpcCalls = 0;
  let liveEditSentCount = 0;
  const savedPatches = [];
  const translator = createDomTranslator({ document: doc, window: win, initialLocale: "ru" });

  // Build composer + running cancel button + sidebar Settings inside a <div> (non-aside)
  const sidebarDiv = doc.createElement("div");
  sidebarDiv.setAttribute("data-rudex-bg-sidebar", "1");
  let settingsBtnClicks = 0;
  const nativeSettingsBtn = doc.createElement("button");
  nativeSettingsBtn.textContent = "Настройки (Ctrl+,)";
  nativeSettingsBtn.click = () => { settingsBtnClicks += 1; };
  sidebarDiv.appendChild(nativeSettingsBtn);
  doc.body.appendChild(sidebarDiv);

  const compForm = doc.createElement("form");
  compForm.setAttribute("data-testid", "composer");
  const editable = doc.createElement("div");
  editable.setAttribute("contenteditable", "true");
  editable.setAttribute("role", "textbox");
  editable.textContent = "привет проверь баги";
  editable.innerText = "привет проверь баги";
  editable.focus = () => { doc.activeElement = editable; };
  const cancelBtn = doc.createElement("button");
  cancelBtn.setAttribute("data-testid", "input-cancel-button");
  const sendBtn = doc.createElement("button");
  sendBtn.setAttribute("data-rudex-comp-send", "1");
  compForm.appendChild(editable);
  compForm.appendChild(cancelBtn);
  compForm.appendChild(sendBtn);
  doc.body.appendChild(compForm);

  // Stub execCommand as no-op to simulate Lexical ignoring non-native execCommand while native IPC clears it
  doc.execCommand = () => false;
  doc.createRange = () => ({ selectNodeContents() {} });
  win.getSelection = () => ({ removeAllRanges() {}, addRange() {} });

  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      on() {},
      removeListener() {},
      send() {},
      sendSync() { return { ok: true }; },
      async invoke(ch, payload) {
        if (ch === "agy-studio:save-settings") {
          savedPatches.push(payload);
          return { ok: true, settings: payload };
        }
        if (ch === "agy-studio:clear-focused-input") {
          clearFocusedCalls += 1;
          // Simulate speech-to-text flushing trailing punctuation after 1st clear, then clearing completely on 2nd clear!
          if (clearFocusedCalls === 1) {
            editable.textContent = "привет проверь баги.";
            editable.innerText = "привет проверь баги.";
          } else {
            editable.textContent = "";
            editable.innerText = "";
          }
          return { ok: true };
        }
        if (ch === "agy-studio:open-native-settings") {
          openNativeSettingsIpcCalls += 1;
          return { ok: true };
        }
        if (ch === "agy-studio:send-live-edit") {
          liveEditSentCount += 1;
          return { ok: true, entry: { id: "le-test-1", status: "pending", text: payload.text }, items: [] };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });

  try {
    panel.init();
    panel.setOpen(true, { tab: "widgets", widgetSub: "limits" });

    // (a) Simulate dragging the Limits Width slider -> stale remote echo arrives mid-drag -> must NOT snap back!
    const rootEl = doc.getElementById("rudex-studio-host").shadowRoot.querySelector(".studio-root");
    const modalMount = rootEl.querySelector(".modal-mount");
    const limitsMount = rootEl.querySelector(".rx-limits-mount");
    assert.ok(modalMount.innerHTML.includes('data-limits-field="width"'), "Limits width slider markup must render in Limits tab");
    const widthSlider = doc.createElement("input");
    widthSlider.type = "range";
    widthSlider.setAttribute("data-limits-field", "width");
    widthSlider.value = "350";
    rootEl.appendChild(widthSlider);
    panel.applyRemoteState({ locale: "ru", settings: { limitsWidget: { enabled: true, layout: "card", width: 220, scale: 100 } } }, true);
    modalMount.innerHTML = "__SENTINEL_MID_DRAG__";
    rootEl.dispatchEvent({ type: "input", target: widthSlider });
    assert.equal(savedPatches.length, 0, "Slider drag must debounce IPC instead of flooding save-settings per pixel");
    assert.ok(limitsMount.innerHTML.includes("width:350px"), "Live limits widget must immediately resize to 350px");

    // Stale broadcast from main process tries to revert width back to 220 mid-drag
    panel.applyRemoteState({ locale: "ru", settings: { limitsWidget: { enabled: true, layout: "card", width: 220, scale: 100 } } }, false);
    assert.equal(modalMount.innerHTML, "__SENTINEL_MID_DRAG__", "applyRemoteState must NOT rebuild modal DOM mid-drag (which kills active range drag)");
    assert.ok(limitsMount.innerHTML.includes("width:350px"), "Limits widget must NOT snap back to 220px on stale remote echo");

    // Release slider (change) -> flushes save immediately with 350px
    rootEl.dispatchEvent({ type: "change", target: widthSlider });
    assert.equal(savedPatches.length, 1, "Releasing Limits slider must flush debounced save immediately");
    assert.equal(savedPatches[0].limitsWidget.width, 350, "Flushed save must persist resized width=350");

    // (b) Clicking "Настройки Antigravity →" finds div-sidebar Settings button (even with shortcut suffix) AND falls back to IPC if missing
    panel.setOpen(false);
    const fakeActionBtn = doc.createElement("button");
    fakeActionBtn.setAttribute("data-action", "open-native-usage-settings");
    rootEl.appendChild(fakeActionBtn);
    rootEl.dispatchEvent({ type: "click", target: fakeActionBtn });
    assert.equal(settingsBtnClicks, 1, "Antigravity Settings button in non-aside div sidebar must be clicked");

    // Remove sidebar button -> fallback must invoke agy-studio:open-native-settings (Ctrl+,)
    sidebarDiv.removeChild(nativeSettingsBtn);
    rootEl.dispatchEvent({ type: "click", target: fakeActionBtn });
    assert.equal(openNativeSettingsIpcCalls, 1, "When sidebar Settings button is hidden/collapsed, fallback IPC must fire");

    // (c) Dictated text sent via live-edit (Enter while agent running) must clear even when STT re-flushes trailing period!
    let prevented = false;
    const kdEvt = {
      type: "keydown",
      key: "Enter",
      target: editable,
      isComposing: false,
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      preventDefault() { prevented = true; },
      stopPropagation() {},
      stopImmediatePropagation() {},
    };
    for (const fn of (doc.listeners.get("keydown") || [])) fn(kdEvt);
    assert.equal(prevented, true, "Inline live-edit Enter while generating must be cleanly intercepted");
    await new Promise((r) => setTimeout(r, 220));
    assert.equal(liveEditSentCount, 1, "Live-edit must be dispatched exactly once");
    assert.ok(clearFocusedCalls >= 2, "Residual dictated text with trailing period must trigger follow-up native clear");
    assert.equal(editable.textContent, "", "Composer must be completely empty after speech-to-text live-edit");

    // (d) dom-translator & theme-engine MutationObserver filter out contenteditable/SVG voice-dictation noise
    let domMoCb = null;
    let flushedCount = 0;
    const { doc: d2, win: w2 } = createMockDom();
    w2.MutationObserver = class {
      constructor(cb) { domMoCb = cb; }
      observe() {}
      disconnect() {}
    };
    const origQm = global.queueMicrotask;
    global.queueMicrotask = (fn) => { flushedCount += 1; fn(); };
    const t2 = createDomTranslator({ document: d2, window: w2, initialLocale: "ru", dictionary: { Settings: "Настройки" } });
    try {
      t2.init();
      const ce = d2.createElement("div");
      ce.setAttribute("contenteditable", "true");
      const tn = d2.createTextNode("speaking fast");
      ce.appendChild(tn);
      d2.body.appendChild(ce);
      flushedCount = 0;
      domMoCb([{ type: "characterData", target: tn }]);
      assert.equal(flushedCount, 0, "dom-translator must ignore characterData inside contenteditable during dictation");
    } finally {
      global.queueMicrotask = origQm;
      t2.destroy();
    }

    // (e) theme-engine ignores SVG waveform mutations inside active mic without scheduling shell scan
    let teMoCb = null;
    let teTimerCount = 0;
    const { doc: d3, win: w3 } = createMockDom();
    w3.MutationObserver = class {
      constructor(cb) { teMoCb = cb; }
      observe() {}
      disconnect() {}
    };
    w3.setTimeout = () => { teTimerCount += 1; return teTimerCount; };
    w3.clearTimeout = () => {};
    const te = createThemeEngine({ document: d3, window: w3 });
    try {
      te.apply({
        presetId: "custom",
        uiStyle: { preset: "claude-code", composer: "claude-code", chat: "claude-code", modelSelector: "claude-code" },
        wallpaper: { type: "gradient", gradientPreset: "antigravity" },
      });
      const micWrap = d3.createElement("div");
      micWrap.setAttribute("data-rudex-comp-mic-active", "1");
      const waveSvg = d3.createElement("svg");
      micWrap.appendChild(waveSvg);
      d3.body.appendChild(micWrap);
      teTimerCount = 0;
      assert.ok(typeof teMoCb === "function", "theme-engine must register shell MutationObserver");
      teMoCb([{ type: "attributes", attributeName: "style", target: waveSvg }]);
      assert.equal(teTimerCount, 0, "theme-engine must skip SVG waveform style mutations during dictation");
    } finally {
      te.destroy();
    }
  } finally {
    panel.destroy();
    translator.destroy();
  }
});

test("Cross-platform installers (macOS, Linux, Windows 10/11), POSIX quoting, paths, and concise description", () => {
  const installJsMod = require(path.join(SCRIPTS_DIR, "install.js"));
  const updaterCoreMod = require(path.join(SCRIPTS_DIR, "updater-core.js"));
  const Module = require("node:module");

  // 1) Shell scripts exist, strictly use LF (no CRLF), safe process matching, and split user/sudo privileges
  for (const rel of ["install.sh", "uninstall.sh", path.join("skills", "rudex", "scripts", "hook-runner.sh")]) {
    const full = path.join(REPO_ROOT, rel);
    assert.ok(fs.existsSync(full), `${rel} must exist`);
    const content = fs.readFileSync(full, "utf8");
    assert.equal(content.includes("\r"), false, `${rel} must use strict LF line endings (no \\r)`);
    assert.ok(content.startsWith("#!/"), `${rel} must start with a shebang`);
    assert.equal(/pkill\s+-f\s+["']?antigravity/i.test(content), false, `${rel} must never use broad 'pkill -f antigravity'`);
    assert.ok(content.includes("ELECTRON_RUN_AS_NODE=1") && content.includes("ELECTRON_NO_ASAR=1"), `${rel} must support ELECTRON_RUN_AS_NODE=1 + ELECTRON_NO_ASAR=1`);
  }
  const installSh = fs.readFileSync(path.join(REPO_ROOT, "install.sh"), "utf8");
  assert.ok(installSh.includes("--plugin-only") && installSh.includes("sudo") && installSh.includes("--no-sync-plugin"), "install.sh must sync plugin as user and use sudo only for system resources");
  const readme = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
  assert.ok(readme.includes("install.ps1 | iex") && readme.includes("install.sh | bash"), "README must expose 1-line installers for Windows and macOS/Linux");

  // 2) plugin.json has a concise, clear mini-description mentioning all 3 OSes
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "plugin.json"), "utf8"));
  assert.ok(pkg.description.length <= 260, `plugin.json description should be concise (got ${pkg.description.length} chars)`);
  assert.ok(pkg.description.includes("Windows") && pkg.description.includes("macOS") && pkg.description.includes("Linux"));

  // 3) posixShellQuote + POSIX watchers safely handle spaces and single quotes
  const oddPath = "/Applications/O'Reilly Google Antigravity.app/Contents/Resources";
  const quoted = updaterCoreMod.posixShellQuote(oddPath);
  assert.equal(quoted, "'/Applications/O'\\''Reilly Google Antigravity.app/Contents/Resources'");

  const tmpPosix = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-posix-test-"));
  try {
    // Mock macOS .app bundle
    const macContents = path.join(tmpPosix, "Google Antigravity.app", "Contents");
    const macRes = path.join(macContents, "Resources");
    const macOsDir = path.join(macContents, "MacOS");
    fs.mkdirSync(macRes, { recursive: true });
    fs.mkdirSync(macOsDir, { recursive: true });
    fs.writeFileSync(path.join(macRes, "app.asar"), "mock-asar", "utf8");
    const macExe = path.join(macOsDir, "Google Antigravity");
    fs.writeFileSync(macExe, "#!/bin/sh\n", "utf8");
    fs.writeFileSync(
      path.join(macContents, "Info.plist"),
      "<plist><dict><key>CFBundleExecutable</key><string>Google Antigravity</string><key>CFBundleShortVersionString</key><string>45.2.0</string></dict></plist>",
      "utf8"
    );

    const macDetected = installJsMod.detectAntigravity({
      platform: "darwin",
      env: { ANTIGRAVITY_RESOURCES_DIR: macRes, HOME: tmpPosix },
      skipPathLookup: true,
    });
    assert.equal(macDetected.found, true);
    assert.equal(macDetected.appVersion, "45.2.0");
    assert.equal(macDetected.exePath, macExe, "macOS exePath must resolve to binary inside Contents/MacOS, not .app directory");
    assert.equal(macDetected.appBundlePath, path.join(tmpPosix, "Google Antigravity.app"));

    // Mock Linux dir
    const linuxRes = path.join(tmpPosix, "opt", "antigravity", "resources");
    fs.mkdirSync(linuxRes, { recursive: true });
    fs.writeFileSync(path.join(linuxRes, "app.asar"), "mock-linux-asar", "utf8");
    fs.writeFileSync(path.join(tmpPosix, "opt", "antigravity", "version"), "45.3.1\n", "utf8");
    const linuxBin = path.join(tmpPosix, "opt", "antigravity", "antigravity");
    fs.writeFileSync(linuxBin, "#!/bin/sh\n", "utf8");

    const linuxDetected = installJsMod.detectAntigravity({
      platform: "linux",
      env: { ANTIGRAVITY_RESOURCES_DIR: linuxRes, HOME: tmpPosix },
      skipPathLookup: true,
    });
    assert.equal(linuxDetected.found, true);
    assert.equal(linuxDetected.appVersion, "45.3.1");
    assert.equal(linuxDetected.exePath, linuxBin);

    // POSIX on-exit activator script generation
    const actSh = path.join(tmpPosix, "on-exit.sh");
    const writtenAct = installJsMod.writeOnExitActivatePosix(macDetected, {
      outPath: actSh,
      lockPath: path.join(tmpPosix, "on-exit.lock"),
      expectedAsarSize: 9,
      expectedAsarMtimeSec: 1700000000,
    });
    assert.equal(writtenAct, actSh);
    const actText = fs.readFileSync(actSh, "utf8");
    assert.equal(actText.includes("\r"), false);
    assert.ok(actText.includes("Google Antigravity.app") && actText.includes("--no-sync-plugin"));

    // POSIX post-app-update watcher & offline quota notifier
    const origLoad = Module._load;
    const i18nMainPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[i18nMainPath];
    Module._load = function (req, parent, isMain) {
      if (req === "electron") {
        return {
          app: { getPath: () => tmpPosix, on: () => {}, emit: () => {} },
          ipcMain: { handle: () => {}, on: () => {} },
          webContents: { getAllWebContents: () => [] },
          BrowserWindow: { getAllWindows: () => [] },
          Notification: class {},
          dialog: {}, shell: {}, protocol: {}, clipboard: {}, nativeImage: {},
        };
      }
      return origLoad.apply(this, arguments);
    };
    try {
      const i18nMainMod = require(i18nMainPath);
      const updSh = path.join(tmpPosix, "post-upd.sh");
      const updRes = i18nMainMod.writePostAppUpdateWatcherPosix({
        resDir: macRes,
        exePath: macExe,
        installJs: path.join(SCRIPTS_DIR, "install.js"),
        outPath: updSh,
        lockPath: path.join(tmpPosix, "post-upd.lock"),
        pid: 999999,
      });
      assert.equal(updRes, updSh);
      const updBody = fs.readFileSync(updSh, "utf8");
      assert.equal(updBody.includes("\r"), false);
      assert.ok(updBody.includes("ANTIGRAVITY_RESOURCES_DIR=") && updBody.includes("--on-exit-activate"));

      const macNotif = i18nMainMod.buildOfflineQuotaNotifierPosix({
        title: "Лимиты восстановлены",
        body: "Gemini 100%",
        alertsPath: path.join(tmpPosix, "alerts.json"),
        cycleKey: "gemini:5h:123",
        platform: "darwin",
      });
      assert.ok(macNotif.includes("osascript") && macNotif.includes("display notification"));
      const linNotif = i18nMainMod.buildOfflineQuotaNotifierPosix({
        title: "Лимиты восстановлены",
        body: "Gemini 100%",
        alertsPath: path.join(tmpPosix, "alerts.json"),
        cycleKey: "gemini:5h:123",
        platform: "linux",
      });
      assert.ok(linNotif.includes("notify-send"));
    } finally {
      Module._load = origLoad;
      delete require.cache[i18nMainPath];
    }
  } finally {
    fs.rmSync(tmpPosix, { recursive: true, force: true });
  }
});

test("Antigravity upgrades and third-party in-place app.asar patchers preserve patches and keep Rudex skill active", () => {
  // Helper to build a minimal valid Electron ASAR archive in memory
  function buildMinimalAsarBuffer(filesMap) {
    const entries = {};
    const chunks = [];
    let offset = 0;
    for (const [relPath, text] of Object.entries(filesMap)) {
      const parts = relPath.split("/");
      let node = entries;
      for (let i = 0; i < parts.length - 1; i += 1) {
        if (!node[parts[i]]) node[parts[i]] = { files: {} };
        node = node[parts[i]].files;
      }
      const buf = Buffer.from(text, "utf8");
      node[parts[parts.length - 1]] = { size: buf.length, offset: String(offset) };
      chunks.push(buf);
      offset += buf.length;
    }
    const headerJson = JSON.stringify({ files: entries });
    const jsonBuf = Buffer.from(headerJson, "utf8");
    const padLen = (4 - (jsonBuf.length % 4)) % 4;
    const paddedJson = Buffer.concat([jsonBuf, Buffer.alloc(padLen)]);
    const headerPickle = Buffer.alloc(16);
    headerPickle.writeUInt32LE(4, 0);
    headerPickle.writeUInt32LE(8 + paddedJson.length, 4);
    headerPickle.writeUInt32LE(4 + paddedJson.length, 8);
    headerPickle.writeUInt32LE(jsonBuf.length, 12);
    return Buffer.concat([headerPickle, paddedJson, ...chunks]);
  }

  // 1) patchMainJs versionGuard checks version, sourceAsarSize, sourceAsarHash, and passes ANTIGRAVITY_RESOURCES_DIR
  const minMain = [
    `"use strict";`,
    `const menu_1 = require("./menu");`,
    `const electron_1 = require("electron");`,
    `    const ipc = (0, ipcHandlers_1.registerIpcHandlers)(storageManager, {`,
  ].join("\n");
  const guardedMain = patchMainJs(minMain, "44.9.1", []);
  assert.ok(guardedMain.includes("sourceAsarHash") && guardedMain.includes("sourceAsarSize"), "versionGuard must detect third-party in-place app.asar patches");
  assert.ok(guardedMain.includes("ANTIGRAVITY_RESOURCES_DIR"), "versionGuard must forward process.resourcesPath to install.js");

  // 2) Full install -> third-party same-length in-place patch -> Antigravity version upgrade
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-e2e-patcher-"));
  try {
    const appRoot = path.join(tmpDir, "Antigravity");
    const resDir = path.join(appRoot, "resources");
    fs.mkdirSync(resDir, { recursive: true });
    fs.writeFileSync(path.join(appRoot, "version"), "44.9.1", "utf8");
    const makeAppFiles = (marker) => ({
      "package.json": JSON.stringify({ name: "antigravity", version: "1.0.0", main: "dist/main.js" }),
      "dist/main.js": [
        `"use strict";`,
        `// MARKER=${marker}`,
        `const menu_1 = require("./menu");`,
        `const electron_1 = require("electron");`,
        `    const ipc = (0, ipcHandlers_1.registerIpcHandlers)(storageManager, {`,
        `    });`,
      ].join("\n"),
      "dist/preload.js": `"use strict";\nconst electron_1 = require("electron");\n`,
    });

    const asarV1 = buildMinimalAsarBuffer(makeAppFiles("STOCK_AAAA"));
    fs.writeFileSync(path.join(resDir, "app.asar"), asarV1);

    const installScript = path.join(SCRIPTS_DIR, "install.js");
    const env = Object.assign({}, process.env, { ANTIGRAVITY_RESOURCES_DIR: resDir });
    const run1 = execFileSync(process.execPath, [installScript, "--no-sync-plugin"], { env, encoding: "utf8" });
    assert.ok(run1.includes("STATUS=ACTIVATED"));
    assert.ok(fs.existsSync(path.join(resDir, "app.asar.orig-44.9.1")), "Stock backup app.asar.orig-44.9.1 must be created");

    // Simulate a third-party unblocker patching app.asar in-place with EXACT same byte length!
    const patchedByOther = buildMinimalAsarBuffer(makeAppFiles("UNBLOCK_OK"));
    assert.equal(patchedByOther.length, asarV1.length, "In-place patch must have identical byte size");
    fs.writeFileSync(path.join(resDir, "app.asar"), patchedByOther);

    const run2 = execFileSync(process.execPath, [installScript, "--no-sync-plugin"], { env, encoding: "utf8" });
    assert.ok(run2.includes("STATUS=ACTIVATED"));
    const mainAfterOtherPatch = fs.readFileSync(path.join(resDir, "app", "dist", "main.js"), "utf8");
    assert.ok(mainAfterOtherPatch.includes("MARKER=UNBLOCK_OK"), "Rudex must layer over third-party app.asar patch without losing it");
    assert.ok(mainAfterOtherPatch.includes("// === RUDEX_MAIN_PATCH ==="), "Rudex patch must remain applied");

    // Simulate official Antigravity upgrade 44.9.1 -> 44.10.0
    fs.writeFileSync(path.join(appRoot, "version"), "44.10.0", "utf8");
    const asarV2 = buildMinimalAsarBuffer(makeAppFiles("AGY_44_10_"));
    fs.writeFileSync(path.join(resDir, "app.asar"), asarV2);

    const run3 = execFileSync(process.execPath, [installScript, "--no-sync-plugin"], { env, encoding: "utf8" });
    assert.ok(run3.includes("STATUS=ACTIVATED"));
    assert.ok(fs.existsSync(path.join(resDir, "app.asar.orig-44.10.0")), "New backup app.asar.orig-44.10.0 must be created");
    assert.equal(fs.existsSync(path.join(resDir, "app.asar.orig-44.9.1")), false, "Obsolete backup app.asar.orig-44.9.1 must be cleaned up");
    const mainAfterUpgrade = fs.readFileSync(path.join(resDir, "app", "dist", "main.js"), "utf8");
    assert.ok(mainAfterUpgrade.includes("MARKER=AGY_44_10_") && mainAfterUpgrade.includes("// === RUDEX_MAIN_PATCH ==="));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Limits widget and Studio quota cards display Weekly limit above 5-hour limit", () => {
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const summary = {
    families: {
      gemini: { fiveHourRem: 87, weeklyRem: 96, fiveHourReset: "4ч 7м", weeklyReset: "6д 22ч" },
      claudeGpt: { fiveHourRem: 100, weeklyRem: 50, fiveHourReset: "5ч", weeklyReset: "6д 13ч" },
    },
  };

  for (const layout of ["bars", "pill"]) {
    const ruHtml = v5Core.rv5BuildLimitsWidgetHtml({ enabled: true, layout, families: "both" }, summary, "Gemini", true, false);
    assert.ok(ruHtml.indexOf("Нед") !== -1 && ruHtml.indexOf("5ч") !== -1);
    assert.ok(ruHtml.indexOf("Нед") < ruHtml.indexOf("5ч"), `RU ${layout} must render Weekly (Нед) above/before 5h (5ч)`);

    const enHtml = v5Core.rv5BuildLimitsWidgetHtml({ enabled: true, layout, families: "both" }, summary, "Gemini", false, false);
    assert.ok(enHtml.indexOf("Wk") !== -1 && enHtml.indexOf("5h") !== -1);
    assert.ok(enHtml.indexOf("Wk") < enHtml.indexOf("5h"), `EN ${layout} must render Weekly (Wk) above/before 5h`);
  }

  const cardRu = v5Core.rv5BuildLimitsWidgetHtml({ enabled: true, layout: "card", families: "gemini" }, summary, "Gemini", true, false);
  assert.ok(cardRu.indexOf("6д 22ч") < cardRu.indexOf("4ч 7м"), "Weekly reset timer must appear before 5h reset timer");

  const limTabHtml = v5Ui.rv5RenderLimitsTabHtml({ limitsWidget: v5Core.RUDEX_LIMITS_DEFAULTS, quotaSummary: summary, activeModelName: "Gemini", isRu: true });
  assert.ok(limTabHtml.indexOf('data-field="showWeekly"') < limTabHtml.indexOf('data-field="show5h"'), "Weekly toggle must precede 5h toggle in Studio");

  // Studio Monitor quota card (renderFamCard) also shows Weekly (Нед.) above 5h (5ч)
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, initialLocale: "ru" });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: { on() {}, removeListener() {}, send() {}, sendSync() { return { ok: true }; }, async invoke() { return { ok: true }; } },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });
  try {
    panel.init();
    panel.applyRemoteState({ locale: "ru", quotaSummary: summary }, true);
    panel.setOpen(true, { tab: "widgets", widgetSub: "monitor" });
    const modalHtml = doc.getElementById("rudex-studio-host").shadowRoot.querySelector(".modal-mount").innerHTML;
    const wkIdx = modalHtml.indexOf("Нед. Осталось:");
    const h5Idx = modalHtml.indexOf("5ч Осталось:");
    assert.ok(wkIdx !== -1 && h5Idx !== -1 && wkIdx < h5Idx, "Studio renderFamCard must render Нед. above 5ч");
  } finally {
    panel.destroy();
    translator.destroy();
  }
});

test("Voice dictation submission stops active mic, sweeps delayed STT text on normal send & live-edit, and keeps manual typing", async () => {
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));

  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, initialLocale: "ru" });

  const compForm = doc.createElement("form");
  compForm.setAttribute("data-testid", "composer");
  const editable = doc.createElement("div");
  editable.setAttribute("contenteditable", "true");
  editable.setAttribute("role", "textbox");
  editable.focus = () => { doc.activeElement = editable; };
  editable.blur = () => { if (doc.activeElement === editable) doc.activeElement = null; };

  let micClicks = 0;
  const micBtn = doc.createElement("button");
  micBtn.setAttribute("aria-label", "Stop Voice Recording");
  micBtn.setAttribute("aria-pressed", "true");
  micBtn.setAttribute("data-rudex-comp-mic-active", "1");
  micBtn.click = () => {
    micClicks += 1;
    micBtn.setAttribute("aria-pressed", "false");
    micBtn.removeAttribute("data-rudex-comp-mic-active");
  };

  const sendBtn = doc.createElement("button");
  sendBtn.setAttribute("data-rudex-comp-send", "1");
  sendBtn.setAttribute("aria-label", "Send voice message");

  compForm.appendChild(editable);
  compForm.appendChild(micBtn);
  compForm.appendChild(sendBtn);
  doc.body.appendChild(compForm);

  doc.execCommand = () => false;
  doc.createRange = () => ({ selectNodeContents() {} });
  win.getSelection = () => ({ removeAllRanges() {}, addRange() {} });

  let clearIpcCalls = 0;
  let liveEditsSent = 0;
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      on() {},
      removeListener() {},
      send() {},
      sendSync() { return { ok: true }; },
      async invoke(ch) {
        if (ch === "agy-studio:clear-focused-input") {
          clearIpcCalls += 1;
          editable.textContent = "";
          editable.innerText = "";
          return { ok: true };
        }
        if (ch === "agy-studio:send-live-edit") {
          liveEditsSent += 1;
          return { ok: true, entry: { id: `le-${liveEditsSent}`, status: "pending", text: "ok" }, items: [] };
        }
        return { ok: true };
      },
    },
    translator,
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });

  try {
    panel.init();

    // 1) Normal chat submission via click on Send button with "voice" in aria-label while mic is active:
    //    Must NOT clear synchronously at t=0, must stop active mic, and after Antigravity renders user message must sweep leftover dictated text!
    editable.textContent = "привет сделай проверку на линукс";
    editable.innerText = "привет сделай проверку на линукс";
    for (const fn of (doc.listeners.get("click") || [])) fn({ target: sendBtn });
    assert.equal(editable.textContent, "привет сделай проверку на линукс", "Normal send must NOT erase text synchronously before native submit runs");

    // Simulate Antigravity accepting the message (appending user bubble) while STT leaves text stuck in composer
    const userMsg = doc.createElement("div");
    userMsg.setAttribute("data-testid", "user-message-content");
    userMsg.textContent = "привет сделай проверку на линукс";
    doc.body.appendChild(userMsg);
    editable.textContent = "Привет, сделай проверку на линукс.";
    editable.innerText = "Привет, сделай проверку на линукс.";

    await new Promise((r) => setTimeout(r, 260));
    assert.ok(micClicks >= 1, "Submitting dictated prompt must stop active voice recording button");
    assert.equal(editable.textContent, "", "Stuck dictated text must be swept clean after normal chat submission");

    // 2) Live-edit submission while agent is running:
    //    Trailing STT punctuation keydown after 40ms must NOT abort residual clear, and duplicate send within 2s is deduplicated
    const cancelBtn = doc.createElement("button");
    cancelBtn.setAttribute("data-testid", "input-cancel-button");
    compForm.appendChild(cancelBtn);
    micBtn.setAttribute("aria-pressed", "true");
    micBtn.setAttribute("data-rudex-comp-mic-active", "1");
    editable.textContent = "добавь ещё тесты";
    editable.innerText = "добавь ещё тесты";

    for (const fn of (doc.listeners.get("click") || [])) {
      fn({ target: sendBtn, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
    }
    // Simulate STT flushing trailing period 40ms later with isTrusted:true
    await new Promise((r) => setTimeout(r, 40));
    editable.textContent = "Добавь ещё тесты.";
    editable.innerText = "Добавь ещё тесты.";
    for (const fn of (doc.listeners.get("keydown") || [])) {
      fn({ type: "keydown", key: ".", target: editable, isTrusted: true, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, isComposing: false });
    }
    await new Promise((r) => setTimeout(r, 260));
    assert.equal(liveEditsSent, 1);
    assert.ok(clearIpcCalls >= 2);
    assert.equal(editable.textContent, "", "Live-edit with voice dictation must clear repunctuated text completely");

    // Duplicate send of the same live-edit text within 2s must be deduplicated
    editable.textContent = "добавь ещё тесты";
    editable.innerText = "добавь ещё тесты";
    for (const fn of (doc.listeners.get("click") || [])) {
      fn({ target: sendBtn, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
    }
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(liveEditsSent, 1, "Duplicate live-edit within 2000ms window must be deduplicated");

    // After >260ms, real manual user typing must cancel remaining clear timers and keep new text intact
    editable.textContent = "новая задача";
    editable.innerText = "новая задача";
    for (const fn of (doc.listeners.get("keydown") || [])) {
      fn({ type: "keydown", key: "н", target: editable, isTrusted: true, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, isComposing: false });
    }
    await new Promise((r) => setTimeout(r, 320));
    assert.equal(editable.textContent, "новая задача", "Manual typing after submission must not be erased by residual sweep timers");
  } finally {
    panel.destroy();
    translator.destroy();
  }
});

test("Audit fixes: font stacks in syncTheme & preview, Codex/OpenCode suites, sharp 0px corners, Limits UX order, typography sliders & zero UI emojis", () => {
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));

  // 1) Sharp 0px corner mode must not leak rounded corners on code blocks or thinking/steps
  const sharpCss = te.buildThemeCss({
    presetId: "obsidian-glass",
    corners: { mode: "linked", all: 0 },
    wallpaper: { type: "gradient" },
  }, { hostIsLight: false });
  assert.equal(sharpCss.includes("border-radius: 6px"), false, "0px Sharp mode must not emit 6px thinking/code fallback");
  assert.equal(sharpCss.includes("border-radius: 5px;"), false, "0px Sharp mode must not emit 5px inline code radius");

  // 2) Detailed typography renders live value bindings & eliminates dead-zone 0..10 range
  const tyHtml = v5Ui.rv5RenderDetailedTypographyHtml({ typography: { uiFontSize: 0, inputFontSize: 0, agentFontSize: 0, codeFontSize: 0 } }, [], true);
  for (const fld of ["typography.uiFontSize", "typography.inputFontSize", "typography.agentFontSize", "typography.codeFontSize"]) {
    assert.ok(tyHtml.includes(`data-live-app-val="${fld}"`), `Missing data-live-app-val for ${fld}`);
  }
  assert.equal(tyHtml.includes('min="0"'), false, "Per-zone font sliders must start at min=10/11 instead of 0..10 dead zone");

  // 3) Limits tab puts Window Mode / Position / Format directly below preview & toggles, before Alerts & Auto-Continue
  const limHtml = v5Ui.rv5RenderLimitsTabHtml({ limitsWidget: v5Core.RUDEX_LIMITS_DEFAULTS, quotaSummary: {}, activeModelName: "Gemini", isRu: true });
  const modeIdx = limHtml.indexOf('data-action="set-limits-window-mode"');
  const posIdx = limHtml.indexOf('data-action="set-limits-position"');
  const alertIdx = limHtml.indexOf('data-action="test-quota-notification"');
  assert.ok(modeIdx > 0 && posIdx > modeIdx && alertIdx > posIdx, "Limits layout controls must appear before alerts/auto-continue");

  // 4) Zero decorative emojis in UI source modules
  const emojiCheckRe = /[\u{1F3AF}\u{1F514}\u{23F3}\u{23F1}\u{1F4F7}\u{1F4CB}\u{1F4C1}\u{1F5D1}\u{1F58D}\u{1F5BC}\u{1F4CE}\u{1F3A4}\u{1F512}\u{1F5A5}]/u;
  for (const rel of ["studio-panel.js", "rudex-v5-ui.js", "rudex-v5-core.js", "rudex-annotator.js"]) {
    const src = fs.readFileSync(path.join(RES_DIR, rel), "utf8");
    assert.equal(emojiCheckRe.test(src), false, `Decorative UI emoji leaked in ${rel}`);
  }

  // 5) Studio panel: teResolveFontStack works in syncTheme & Text preview, and Codex/OpenCode 1-click suites resolve valid presets/fonts
  const prevTeResolve = globalThis.teResolveFontStack;
  const prevNormalizeApp = globalThis.normalizeAppearance;
  globalThis.teResolveFontStack = te.teResolveFontStack;
  globalThis.normalizeAppearance = te.normalizeAppearance;

  const { doc, win } = createMockDom();
  const translator = createDomTranslator({ document: doc, window: win, initialLocale: "ru" });
  let savedPatch = null;
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      on() {},
      removeListener() {},
      send() {},
      sendSync() { return { ok: true }; },
      async invoke(ch, arg) {
        if (ch === "agy-studio:save-settings") savedPatch = arg;
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
    const shadow = doc.getElementById("rudex-studio-host").shadowRoot;
    const rootEl = shadow.querySelector(".studio-root");
    const modalMount = shadow.querySelector(".modal-mount");

    const dispatchClick = (attrs) => {
      const btn = doc.createElement("button");
      for (const [k, v] of Object.entries(attrs)) {
        btn.setAttribute(`data-${k}`, String(v));
      }
      rootEl.appendChild(btn);
      try {
        rootEl.dispatchEvent({ type: "click", target: btn });
      } finally {
        btn.remove();
      }
    };

    // Open Appearance -> Fonts and click Font Pair ("cyrillic-pro" -> golos + jetbrains)
    panel.setOpen(true, { tab: "appearance", appSubTab: "text", dockedRight: false });
    assert.ok(modalMount.innerHTML.includes('data-action="apply-font-pair"') && modalMount.innerHTML.includes('data-id="cyrillic-pro"'), "Font pair button must render");
    dispatchClick({ action: "apply-font-pair", id: "cyrillic-pro" });
    assert.ok(rootEl.style.getPropertyValue("--rx-font-ui").includes("Golos Text"), "syncTheme must resolve --rx-font-ui via teResolveFontStack");
    assert.ok(modalMount.innerHTML.includes('data-live="typoPreviewHead"') && modalMount.innerHTML.includes("Golos Text"), "Font preview head must render selected font stack");

    // Switch to Appearance -> Theme and click Codex and OpenCode 1-click suites
    panel.setOpen(true, { tab: "appearance", appSubTab: "theme", dockedRight: false });
    dispatchClick({ action: "apply-platform-suite", val: "codex" });
    assert.equal(savedPatch && savedPatch.studioUi && savedPatch.studioUi.windowTheme, "obsidian");
    dispatchClick({ action: "apply-appearance" });
    const normCodex = te.normalizeAppearance(savedPatch && savedPatch.appearance);
    assert.equal(normCodex.presetId, "obsidian-glass", "Codex suite must select valid existing preset obsidian-glass");
    assert.equal(normCodex.typography.uiFont, "chatgpt-sans", "Codex suite must select valid uiFont chatgpt-sans");

    dispatchClick({ action: "apply-platform-suite", val: "opencode" });
    assert.equal(savedPatch && savedPatch.studioUi && savedPatch.studioUi.windowTheme, "minimal-mono");
    dispatchClick({ action: "apply-appearance" });
    const normOc = te.normalizeAppearance(savedPatch && savedPatch.appearance);
    assert.equal(normOc.presetId, "claude-terminal", "OpenCode suite must select valid existing preset claude-terminal");
    assert.equal(normOc.typography.uiFont, "opencode-mono", "OpenCode suite must select valid uiFont opencode-mono");
  } finally {
    panel.destroy();
    translator.destroy();
    globalThis.teResolveFontStack = prevTeResolve;
    globalThis.normalizeAppearance = prevNormalizeApp;
  }
});

test("Quota calibration bugfix: immune to DOM-scale poisoning, per-step weights, stable Bayesian priors, 1 день reset, and tooltip", async () => {
  const Module = require("module");
  const origLoad = Module._load;
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-quota-bugfix-"));
  const ipcHandlers = {};
  const fakeElectron = {
    app: { getPath: () => tmpUserData, isReady: () => true, on: () => {}, whenReady: () => Promise.resolve() },
    ipcMain: {
      handle: (ch, fn) => { ipcHandlers[ch] = fn; },
      removeHandler: (ch) => { delete ipcHandlers[ch]; },
    },
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
    if (typeof i18nMain.registerStudioIpcHandlers === "function") {
      i18nMain.registerStudioIpcHandlers();
    } else if (typeof i18nMain.initStudio === "function") {
      i18nMain.initStudio();
    }

    // 1) Legacy poisoned 20000/80000 self-heals to default priors on save/load
    const healed = i18nMain.saveQuotaStore({
      version: 1,
      resetAt: 0,
      families: {
        gemini: {
          fiveHourRem: 50,
          weeklyRem: 70,
          tokensPer1Pct5h: 20000,
          tokensPer1PctWeekly: 80000,
          calibrated: true,
        },
        claudeGpt: {
          fiveHourRem: 100,
          weeklyRem: 90,
          tokensPer1Pct5h: 20000,
          tokensPer1PctWeekly: 80000,
          calibrated: true,
        },
      },
    });
    assert.equal(healed.families.gemini.tokensPer1Pct5h, 60000, "Legacy poisoned gemini 5h floor 20000 must self-heal to 60000");
    assert.equal(healed.families.gemini.tokensPer1PctWeekly, 260000, "Legacy poisoned gemini weekly floor 80000 must self-heal to 260000");
    assert.equal(healed.families.claudeGpt.tokensPer1Pct5h, 45000, "Legacy poisoned claudeGpt 5h floor 20000 must self-heal to 45000");
    assert.equal(healed.families.claudeGpt.tokensPer1PctWeekly, 200000, "Legacy poisoned claudeGpt weekly floor 80000 must self-heal to 200000");

    // 2) Small DOM record-quota-turn + large snapshot drop (90% -> 16%) must NOT drag tokensPer1Pct5h to floor
    if (ipcHandlers["agy-studio:sync-quota-snapshot"] && ipcHandlers["agy-studio:record-quota-turn"]) {
      const chatUuidSync = "11111111-2222-4333-8444-555555555555";
      ipcHandlers["agy-studio:sync-quota-snapshot"]({}, {
        activeChatKey: chatUuidSync,
        gemini: { fiveHourRem: 90, weeklyRem: 85, fiveHourReset: "4 ч 10 мин", weeklyReset: "6 д 20 ч" },
      });
      ipcHandlers["agy-studio:record-quota-turn"]({}, {
        chatKey: chatUuidSync,
        title: "Voice prompt",
        modelName: "Gemini 4 Neon",
        outputTokens: 300,
        contextTokens: 20000,
      });
      const afterSnap = ipcHandlers["agy-studio:sync-quota-snapshot"]({}, {
        activeChatKey: chatUuidSync,
        gemini: { fiveHourRem: 16, weeklyRem: 79, fiveHourReset: "3 ч 13 мин", weeklyReset: "6 д 22 ч" },
      });
      const gemAfter = afterSnap.summary.families.gemini;
      assert.ok(gemAfter.tokensPer1Pct5h >= 25000, `DOM pending must never drag tokensPer1Pct5h below 25000, got ${gemAfter.tokensPer1Pct5h}`);
      assert.ok(gemAfter.tokensPer1PctWeekly >= 100000, `DOM pending must never drag weekly rate below 100000, got ${gemAfter.tokensPer1PctWeekly}`);
    }

    // 3) Mixed-model steps use per-step weight rather than chat lastModel weight
    const t0 = Date.UTC(2026, 10, 26, 12, 0, 0);
    i18nMain.saveQuotaStore({
      version: 1,
      resetAt: 0,
      families: {
        gemini: {
          fiveHourRem: 16,
          weeklyRem: 79,
          fiveHourReset: "3 ч 13 мин",
          weeklyReset: "6 д 22 ч",
          updatedAt: t0,
          calibrated: true,
          tokensPer1Pct5h: 60000,
          tokensPer1PctWeekly: 260000,
        },
        claudeGpt: { fiveHourRem: 100, weeklyRem: 100, updatedAt: t0 },
      },
    });
    const mixUuid = "22222222-3333-4444-8555-666666666666";
    // Flash step: 100,000 * 0.6 = 60,000; Neon step: 100,000 * 1.35 = 135,000 -> total 195,000 (NOT 200k * 1.35 = 270k)
    const mixMap = new Map([[mixUuid, {
      chatKey: mixUuid,
      titleGuess: "Mixed model chat",
      lastModel: "gemini-4-neon-xhigh",
      lastTs: t0 - 10 * 60 * 1000,
      steps: [
        { ts: t0 - 30 * 60 * 1000, units: 100000, weight: 0.6, family: "gemini" },
        { ts: t0 - 10 * 60 * 1000, units: 100000, weight: 1.35, family: "gemini" },
      ],
    }]]);
    const mixSum = i18nMain.buildQuotaSummary(mixUuid, true, { nowMs: t0 + 60 * 1000, diskByChat: mixMap });
    assert.equal(mixSum.chats[0].weightedTokens, 195000, "Per-step weights must yield 60k + 135k = 195k instead of 270k");

    // 4) Incomplete/missing pre-snapshot history does NOT fall back to tot5 or collapse to 1%
    const postOnlyMap = new Map([[mixUuid, {
      chatKey: mixUuid,
      titleGuess: "Post snapshot only",
      lastModel: "gemini-4-neon-xhigh",
      lastTs: t0 + 5 * 60 * 1000,
      steps: [
        // tiny pre-snapshot history -> raw5 << 22000, plus post-snapshot 80k weighted
        { ts: t0 - 20 * 60 * 1000, units: 5000, weight: 1.0, family: "gemini" },
        { ts: t0 + 5 * 60 * 1000, units: 80000, weight: 1.0, family: "gemini" },
      ],
    }]]);
    const postOnlySum = i18nMain.buildQuotaSummary(mixUuid, true, { nowMs: t0 + 6 * 60 * 1000, diskByChat: postOnlyMap });
    assert.equal(postOnlySum.families.gemini.tokensPer1Pct5h, 60000, "Tiny pre-snapshot history must keep prior 60000 instead of collapsing");
    assert.equal(postOnlySum.families.gemini.fiveHourRem, 16, "Official 16% must stay strictly real (zero local guess subtraction)");

    // Also zero pre-snapshot steps + large post-snapshot steps must NOT fall back to tot5 for implied5 or invent fake drops
    const zeroPreMap = new Map([[mixUuid, {
      chatKey: mixUuid,
      titleGuess: "Zero pre-snap",
      lastModel: "gemini-4-neon-xhigh",
      lastTs: t0 + 5 * 60 * 1000,
      steps: [
        { ts: t0 + 5 * 60 * 1000, units: 120000, weight: 1.0, family: "gemini" },
      ],
    }]]);
    const zeroPreSum = i18nMain.buildQuotaSummary(mixUuid, true, { nowMs: t0 + 6 * 60 * 1000, diskByChat: zeroPreMap });
    assert.equal(zeroPreSum.families.gemini.tokensPer1Pct5h, 60000, "Zero pre-snapshot steps must NOT calibrate against tot5");
    assert.equal(zeroPreSum.families.gemini.fiveHourRem, 16, "Official 16% must stay strictly 16% without guesses");

    // 5) Realistic heavy session (used5=84, cal5=3,261,449 -> rate converges accurately to 38,827 while displayed % stays strictly official 16%)
    const heavyRealMap = new Map([[mixUuid, {
      chatKey: mixUuid,
      titleGuess: "Real heavy session",
      lastModel: "gemini-4-neon-xhigh",
      lastTs: t0 + 5 * 60 * 1000,
      steps: [
        { ts: t0 - 30 * 60 * 1000, units: 3261449, weight: 1.0, family: "gemini" },
        { ts: t0 + 5 * 60 * 1000, units: 44143, weight: 1.0, family: "gemini" },
      ],
    }]]);
    const heavyRealSum = i18nMain.buildQuotaSummary(mixUuid, true, { nowMs: t0 + 6 * 60 * 1000, diskByChat: heavyRealMap });
    assert.equal(heavyRealSum.families.gemini.tokensPer1Pct5h, 38827, "Heavy session (conf5=1) must converge accurately to 38827 units per 1%");
    assert.equal(heavyRealSum.families.gemini.fiveHourRem, 16, "Displayed 5h % must stay strictly official 16% (zero local guesses)");

    // 6) parseResetDurationMs("1 день 5 часов") via formatLiveResetRemaining + clean exact value in widget HTML (no ~ tilde)
    const reset1d = i18nMain.formatLiveResetRemaining("1 день 5 часов", t0, t0 + 3600 * 1000, "ru");
    assert.equal(reset1d.remainingMs, 28 * 3600 * 1000, "1 день must be parsed as 24h via parseResetDurationMs");
    assert.equal(reset1d.text, "1 д 4 ч");
    const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
    const estHtml = v5Core.rv5BuildLimitsWidgetHtml({}, heavyRealSum, "gemini-4-neon-xhigh", true, false);
    assert.ok(estHtml.includes("16%") && !estHtml.includes("~16%") && !estHtml.includes("~15%"), "Widget must show strictly real 16% with zero ~ guesses");
  } finally {
    Module._load = origLoad;
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

test("Element Inspector overrides survive > combinators, Claude Code split composer CSS, drag persistence, and 1-click Antigravity suite", async () => {
  const Module = require("module");
  const origLoad = Module._load;
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-insp-suite-"));
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));

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
  let i18nMain;
  try {
    Module._load = function (req) {
      if (req === "electron") return fakeElectron;
      return origLoad.apply(this, arguments);
    };
    const mainModPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainModPath)];
    i18nMain = require(mainModPath);
  } finally {
    Module._load = origLoad;
  }

  try {
    // 1) ">" child-combinator selectors survive both normalizeAppearance & sanitizeElementOverrides while "<", "{", "}" remain blocked
    const childSel = '[data-testid="chat-root"] > div:nth-of-type(2) > form';
    const normTe = te.normalizeAppearance({
      elementOverrides: [
        { id: "ov-child", name: "Child", selector: childSel, styles: { width: 520, bgColor: "#18181b", bgOpacity: 40 } },
        { id: "ov-bad1", selector: "div < span", styles: { width: 100 } },
        { id: "ov-bad2", selector: "div { color: red }", styles: { width: 100 } },
      ],
    });
    assert.equal(normTe.elementOverrides.length, 1, "normalizeAppearance must keep > combinator and reject < / { / }");
    assert.equal(normTe.elementOverrides[0].selector, childSel);

    const normMain = i18nMain.sanitizeAppearance({
      elementOverrides: [
        { id: "ov-child", name: "Child", selector: childSel, styles: { width: 520, bgColor: "#18181b", bgOpacity: 40 } },
        { id: "ov-bad1", selector: "div < span", styles: { width: 100 } },
        { id: "ov-bad2", selector: "div } span", styles: { width: 100 } },
      ],
    });
    assert.equal(normMain.elementOverrides.length, 1, "sanitizeElementOverrides must keep > combinator and reject < / { / }");
    assert.equal(normMain.elementOverrides[0].selector, childSel);

    // 2) buildThemeCss boosts specificity, emits min(100%, width) + margin-inline: auto, and splits Claude Code composer surface onto input row
    const ovCss = te.buildThemeCss({
      presetId: "claude-code-dark",
      uiStyle: { preset: "claude-code", composer: "claude-code" },
      elementOverrides: [
        {
          id: "zone-composer",
          zone: "composer",
          selector: '[data-rudex-theme-composer="1"]',
          enabled: true,
          styles: { bgColor: "#1f1e1d", bgOpacity: 45, borderRadius: 22, width: 600 },
        },
      ],
    });
    assert.ok(ovCss.includes('html:not(#_rx1):not(#_rx2):not(#_rx3):not(#_rx4) [data-rudex-theme-composer="1"]'), "Override CSS must boost specificity above theme rules");
    assert.ok(ovCss.includes("width: 600px !important;") && ovCss.includes("max-width: min(100%, 600px) !important;") && ovCss.includes("margin-inline: auto !important;"), "Width override must center & clamp safely");
    assert.ok(ovCss.includes('[data-rudex-theme-composer="1"] [data-rudex-comp-input-row="1"]'), "Claude Code composer surface override must target inner input-row");
    assert.ok(ovCss.includes("border-radius: 22px !important;"));
    assert.ok(ovCss.includes("rgba(31, 30, 29, 0.45)"), "bgOpacity must apply rgba background to input row");

    // 3) rv5BuildSmartSelector maps inner composer targets to [data-rudex-theme-composer="1"]
    const { doc, win } = createMockDom();
    const fakeComp = doc.createElement("form");
    fakeComp.setAttribute("data-rudex-theme-composer", "1");
    const fakeInputRow = doc.createElement("div");
    fakeInputRow.setAttribute("data-rudex-comp-input-row", "1");
    const fakeEditor = doc.createElement("div");
    fakeEditor.setAttribute("data-rudex-comp-editor", "1");
    fakeComp.appendChild(fakeInputRow);
    fakeInputRow.appendChild(fakeEditor);
    assert.equal(v5Core.rv5BuildSmartSelector(fakeInputRow, "exact"), '[data-rudex-theme-composer="1"]');
    assert.equal(v5Core.rv5BuildSmartSelector(fakeEditor, "similar"), '[data-rudex-theme-composer="1"]');

    // 4) Studio panel: slider input on ">" selector persists cleanly + 1-click Antigravity suite works
    const prevV5Core = {
      rv5BuildElementInspectorHtml: globalThis.rv5BuildElementInspectorHtml,
      rv5BuildSmartSelector: globalThis.rv5BuildSmartSelector,
      rv5DescribeElementFriendly: globalThis.rv5DescribeElementFriendly,
      rv5IsRenameSafeElement: globalThis.rv5IsRenameSafeElement,
      teBuildElementOverridesCss: globalThis.teBuildElementOverridesCss,
      normalizeAppearance: globalThis.normalizeAppearance,
      teResolveFontStack: globalThis.teResolveFontStack,
    };
    globalThis.rv5BuildElementInspectorHtml = v5Ui.rv5BuildElementInspectorHtml;
    globalThis.rv5BuildSmartSelector = v5Core.rv5BuildSmartSelector;
    globalThis.rv5DescribeElementFriendly = v5Core.rv5DescribeElementFriendly;
    globalThis.rv5IsRenameSafeElement = v5Core.rv5IsRenameSafeElement;
    globalThis.teBuildElementOverridesCss = te.teBuildElementOverridesCss;
    globalThis.normalizeAppearance = te.normalizeAppearance;
    globalThis.teResolveFontStack = te.teResolveFontStack;

    const translator = createDomTranslator({ document: doc });
    const themeEngine = te.createThemeEngine({ document: doc, window: win });
    let savedPatch = null;
    const panel = createStudioPanel({
      document: doc,
      window: win,
      translator,
      telemetryEngine: createTelemetryEngine(),
      themeEngine,
      buildStudioStyles,
      ipcRenderer: {
        invoke: async (ch, arg) => {
          if (ch === "agy-studio:save-settings") {
            savedPatch = arg;
            return { ok: true, settings: arg };
          }
          if (ch === "agy-studio:get-state") {
            return {
              locale: "ru",
              settings: {
                viewMode: "mini",
                panelEnabled: true,
                appearance: {
                  presetId: "claude-code-dark",
                  uiStyle: { preset: "claude-code", composer: "claude-code", chat: "claude-code", modelSelector: "claude-code" },
                },
              },
            };
          }
          if (ch === "agy-studio:list-system-fonts") return { ok: true, fonts: [] };
          return { ok: true };
        },
        on: () => {},
        removeListener: () => {},
      },
    });
    try {
      panel.init();
      const shadow = doc.getElementById("rudex-studio-host").shadowRoot;
      const rootEl = shadow.querySelector(".studio-root");
      const modalMount = shadow.querySelector(".modal-mount");
      const dispatchClick = (attrs) => {
        const btn = doc.createElement("button");
        for (const [k, v] of Object.entries(attrs)) btn.setAttribute(`data-${k}`, String(v));
        rootEl.appendChild(btn);
        try { rootEl.dispatchEvent({ type: "click", target: btn }); } finally { btn.remove(); }
      };

      // Open Theme tab -> 1-click Antigravity suite renders & resets presetId/uiStyle/fonts cleanly
      panel.setOpen(true, { tab: "appearance", appSubTab: "theme", dockedRight: false });
      assert.ok(modalMount.innerHTML.includes('data-action="apply-platform-suite" data-val="antigravity"'), "1-click Antigravity suite button must render");
      dispatchClick({ action: "apply-platform-suite", val: "antigravity" });
      dispatchClick({ action: "apply-appearance" });
      assert.equal(savedPatch && savedPatch.appearance && savedPatch.appearance.presetId, "native");
      assert.equal(savedPatch.appearance.uiStyle.preset, "antigravity");
      assert.equal(savedPatch.appearance.typography.uiFont, "system");
      assert.equal(savedPatch.appearance.typography.monoFont, "system");

      // Simulate selecting composer zone & dragging bgOpacity + width sliders without losing override
      dispatchClick({ action: "edit-ui-zone", "zone-id": "composer" });
      const bgOpRange = doc.createElement("input");
      bgOpRange.setAttribute("data-insp-range", "bgOpacity");
      bgOpRange.value = "40";
      rootEl.appendChild(bgOpRange);
      rootEl.dispatchEvent({ type: "input", target: bgOpRange });
      bgOpRange.remove();

      const wRange = doc.createElement("input");
      wRange.setAttribute("data-insp-range", "width");
      wRange.setAttribute("min", "24");
      wRange.setAttribute("max", "1600");
      wRange.value = "540";
      rootEl.appendChild(wRange);
      rootEl.dispatchEvent({ type: "input", target: wRange });
      rootEl.dispatchEvent({ type: "change", target: wRange });
      wRange.remove();

      const ovs = savedPatch && savedPatch.appearance && savedPatch.appearance.elementOverrides;
      assert.ok(Array.isArray(ovs) && ovs.length === 1, "Composer override must persist after inspector slider change");
      assert.equal(ovs[0].styles.bgOpacity, 40);
      assert.equal(ovs[0].styles.width, 540);
    } finally {
      panel.destroy();
      translator.destroy();
      Object.assign(globalThis, prevV5Core);
    }
  } finally {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

test("Inspector v5.0.4: split paddingY/X, offset move/nudge, CSS Color 4/srgb, editable #hex, parent/child tree, slim-rail hit, and 0ms Claude toolbar flash fix", async () => {
  const Module = require("module");
  const origLoad = Module._load;
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-insp-v504-"));
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));

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
  let i18nMain;
  try {
    Module._load = function (req) {
      if (req === "electron") return fakeElectron;
      return origLoad.apply(this, arguments);
    };
    const mainModPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainModPath)];
    i18nMain = require(mainModPath);
  } finally {
    Module._load = origLoad;
  }

  try {
    // 1) paddingY, paddingX, offsetX, offsetY normalization in both theme-engine & i18n-main + CSS emission
    const ovSpec = [{
      id: "ov-rail",
      name: "Timeline Rail",
      selector: "main > div:nth-of-type(1) > div:nth-of-type(1)",
      styles: { paddingY: "14", paddingX: "6", offsetX: "-12", offsetY: "28" },
    }];
    const normTe = te.normalizeAppearance({ elementOverrides: ovSpec });
    const normMain = i18nMain.sanitizeAppearance({ elementOverrides: ovSpec });
    for (const s of [normTe.elementOverrides[0].styles, normMain.elementOverrides[0].styles]) {
      assert.equal(s.paddingY, 14);
      assert.equal(s.paddingX, 6);
      assert.equal(s.offsetX, -12);
      assert.equal(s.offsetY, 28);
    }
    const ovCss = te.buildThemeCss({ presetId: "claude-code-dark", elementOverrides: normTe.elementOverrides });
    assert.ok(ovCss.includes("padding-top: 14px !important;") && ovCss.includes("padding-bottom: 14px !important;"));
    assert.ok(ovCss.includes("padding-left: 6px !important;") && ovCss.includes("padding-right: 6px !important;"));
    assert.ok(ovCss.includes("translate: -12px 28px !important;"));

    // 2) Inspector HTML shows editable #hex inputs + paddingY/X + offsetY/X + nudge + parent/child buttons
    const inspHtml = v5Ui.rv5BuildElementInspectorHtml(
      { name: "Блок", selector: "main > div", canSelectParent: true, canSelectChild: false, computed: { padding: 10, paddingY: 12, paddingX: 6 } },
      { elementOverrides: [] },
      [],
      [],
      true
    );
    assert.ok(inspHtml.includes('data-insp-hex-input="bgColor"') && inspHtml.includes('data-insp-hex-input="color"') && inspHtml.includes('data-insp-hex-input="borderColor"'));
    assert.ok(inspHtml.includes('data-insp-range="paddingY"') && inspHtml.includes('data-insp-range="paddingX"'));
    assert.ok(inspHtml.includes('data-insp-range="offsetY"') && inspHtml.includes('data-insp-range="offsetX"'));
    assert.ok(inspHtml.includes('data-action="inspector-nudge-offset"') && inspHtml.includes('data-action="inspector-select-parent"') && inspHtml.includes('data-action="inspector-select-child"'));

    // 3) Claude Code CSS: 0ms zero-delay voice & send matchers + voice excluded from bg-white accent rule
    const ccCss = te.buildThemeCss({ presetId: "claude-code-dark", uiStyle: { preset: "claude-code" } });
    assert.ok(ccCss.includes('[aria-label*="голосов" i]') && ccCss.includes('button:where([type="submit"]'), "0ms CSS matchers must cover untagged Voice & Send buttons before mutation scan");

    // 4) Studio panel: parseCssColorToHex (srgb + #abc + #rrggbbaa), editable #hex paste, nudge, parent/child tree, slim-rail hit
    const { doc, win } = createMockDom();
    const prevV5 = {
      rv5BuildElementInspectorHtml: globalThis.rv5BuildElementInspectorHtml,
      rv5BuildSmartSelector: globalThis.rv5BuildSmartSelector,
      rv5DescribeElementFriendly: globalThis.rv5DescribeElementFriendly,
      rv5IsRenameSafeElement: globalThis.rv5IsRenameSafeElement,
      teBuildElementOverridesCss: globalThis.teBuildElementOverridesCss,
      normalizeAppearance: globalThis.normalizeAppearance,
      teResolveFontStack: globalThis.teResolveFontStack,
    };
    globalThis.rv5BuildElementInspectorHtml = v5Ui.rv5BuildElementInspectorHtml;
    globalThis.rv5BuildSmartSelector = v5Core.rv5BuildSmartSelector;
    globalThis.rv5DescribeElementFriendly = v5Core.rv5DescribeElementFriendly;
    globalThis.rv5IsRenameSafeElement = v5Core.rv5IsRenameSafeElement;
    globalThis.teBuildElementOverridesCss = te.teBuildElementOverridesCss;
    globalThis.normalizeAppearance = te.normalizeAppearance;
    globalThis.teResolveFontStack = te.teResolveFontStack;

    // Build chat container + slim left vertical rail child (simulating pointer-events: none timeline rail)
    const chatMain = doc.createElement("main");
    const scrollBox = doc.createElement("div");
    scrollBox.getBoundingClientRect = () => ({ left: 220, top: 40, width: 1000, height: 800, right: 1220, bottom: 840 });
    const slimRail = doc.createElement("aside");
    slimRail.setAttribute("data-testid", "chat-timeline-rail");
    slimRail.getBoundingClientRect = () => ({ left: 228, top: 50, width: 32, height: 700, right: 260, bottom: 750 });
    const railDot = doc.createElement("div");
    railDot.getBoundingClientRect = () => ({ left: 238, top: 200, width: 12, height: 12, right: 250, bottom: 212 });
    slimRail.appendChild(railDot);
    scrollBox.appendChild(slimRail);
    chatMain.appendChild(scrollBox);
    doc.body.appendChild(chatMain);

    const translator = createDomTranslator({ document: doc });
    const themeEngine = te.createThemeEngine({ document: doc, window: win });
    let savedPatch = null;
    const panel = createStudioPanel({
      document: doc,
      window: win,
      translator,
      telemetryEngine: createTelemetryEngine(),
      themeEngine,
      buildStudioStyles,
      ipcRenderer: {
        invoke: async (ch, arg) => {
          if (ch === "agy-studio:save-settings") { savedPatch = arg; return { ok: true, settings: arg }; }
          if (ch === "agy-studio:get-state") return { locale: "ru", settings: { viewMode: "mini", panelEnabled: true, appearance: { presetId: "claude-code-dark" } } };
          if (ch === "agy-studio:list-system-fonts") return { ok: true, fonts: [] };
          return { ok: true };
        },
        on: () => {},
        removeListener: () => {},
      },
    });
    try {
      panel.init();
      const shadow = doc.getElementById("rudex-studio-host").shadowRoot;
      const rootEl = shadow.querySelector(".studio-root");
      const pickerMount = shadow.querySelector(".rx-picker-mount");
      const dispatchClick = (attrs) => {
        const btn = doc.createElement("button");
        for (const [k, v] of Object.entries(attrs)) btn.setAttribute(`data-${k}`, String(v));
        rootEl.appendChild(btn);
        try { rootEl.dispatchEvent({ type: "click", target: btn }); } finally { btn.remove(); }
      };

      // Color parsing
      assert.deepEqual(panel.parseCssColorToHex("color(srgb 0.2 0.4 0.6 / 0.5)"), { hex: "#336699", alphaPct: 50 });
      assert.deepEqual(panel.parseCssColorToHex("#abc"), { hex: "#aabbcc", alphaPct: 100 });
      assert.deepEqual(panel.parseUserHexInput("ff00aa80"), { hex: "#ff00aa", alphaPct: 50 });

      // Slim rail hit resolution inside huge scrollBox
      const hitRail = panel.resolvePickerTargetAtPoint({ target: scrollBox, clientX: 244, clientY: 120 });
      assert.equal(hitRail, slimRail, "Picker must resolve slim vertical rail inside huge parent scrollBox");

      // Parent/child stepping & hex paste & offset nudge via Picker click on railDot
      panel.startElementPicker();
      for (const fn of (doc.listeners.get("click") || [])) {
        fn({ type: "click", target: railDot, clientX: 244, clientY: 205 });
      }
      assert.ok(pickerMount.innerHTML.includes("chat-timeline-rail") && pickerMount.innerHTML.includes("div:nth-of-type(1)"), "Initial click must select railDot");
      dispatchClick({ action: "inspector-select-parent" });
      assert.ok(pickerMount.innerHTML.includes("chat-timeline-rail") && !pickerMount.innerHTML.includes("div:nth-of-type(1)"), "Selecting parent must step up from dot to slimRail");
      dispatchClick({ action: "inspector-select-child" });
      assert.ok(pickerMount.innerHTML.includes("div:nth-of-type(1)") && pickerMount.innerHTML.includes('data-action="inspector-select-child" disabled'), "Selecting child must return back down");
      dispatchClick({ action: "inspector-select-parent" });

      // Paste #11223380 into bgColor hex input
      const hexInp = doc.createElement("input");
      hexInp.setAttribute("data-insp-hex-input", "bgColor");
      hexInp.value = "#11223380";
      rootEl.appendChild(hexInp);
      rootEl.dispatchEvent({ type: "change", target: hexInp });
      hexInp.remove();
      let ov = savedPatch.appearance.elementOverrides[0];
      assert.equal(ov.styles.bgColor, "#112233");
      assert.equal(ov.styles.bgOpacity, 50);

      // Nudge Y -4 twice -> -8 (debounced cleanly in v5.5.1 to prevent rapid-click lag/snapback), then reset -> 0
      dispatchClick({ action: "inspector-nudge-offset", axis: "offsetY", delta: "-4" });
      dispatchClick({ action: "inspector-nudge-offset", axis: "offsetY", delta: "-4" });
      await new Promise((r) => setTimeout(r, 260));
      ov = savedPatch.appearance.elementOverrides[0];
      assert.equal(ov.styles.offsetY, -8);
      dispatchClick({ action: "inspector-nudge-offset", axis: "reset", delta: "0" });
      await new Promise((r) => setTimeout(r, 260));
      ov = savedPatch.appearance.elementOverrides[0];
      assert.equal(ov.styles.offsetY, 0);
    } finally {
      panel.destroy();
      translator.destroy();
      Object.assign(globalThis, prevV5);
    }
  } finally {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

// =============================================================================
// 45–48. Voice Dictation Pro, Gemini File/Cache Engine & GPU Animation Optimizer
// =============================================================================
test("Voice Dictation Pro & GPU Animation Optimizer: language hints, DSP AudioWorklet, WS/gRPC patching, text cleanup, and animation CSS", () => {
  const vm = require("vm");
  const opt = require(path.join(RES_DIR, "rudex-optimizer.js"));

  // 1) Sanitization & BCP-47 language resolution (experimental cache/LS/Chromium opts default OFF)
  const def = opt.sanitizeOptimizationSettings({});
  assert.equal(def.voiceEnabled, true);
  assert.equal(def.voiceLangPreset, "auto");
  assert.equal(def.animMode, "smooth");
  assert.equal(def.lsTuningEnabled, false);
  assert.equal(def.geminiFileCacheProtocol, false);
  assert.equal(def.storageRamCache, false);
  assert.equal(def.chromiumCacheCapMb, 0);
  assert.equal(def.gpuAccel, false);
  assert.equal(def.voiceChunkMs, 80);

  assert.deepEqual(opt.resolveVoiceLanguageCodes({ voiceLangPreset: "auto" }, "ru"), ["ru-RU", "en-US"]);
  assert.deepEqual(opt.resolveVoiceLanguageCodes({ voiceLangPreset: "auto" }, "en"), ["en-US", "ru-RU"]);
  assert.deepEqual(opt.resolveVoiceLanguageCodes({ voiceLangPreset: "ru-en" }, "en"), ["ru-RU", "en-US"]);
  assert.deepEqual(opt.resolveVoiceLanguageCodes({ voiceLangPreset: "ru" }, "en"), ["ru-RU"]);
  assert.deepEqual(opt.resolveVoiceLanguageCodes({ voiceLangPreset: "uk-ru-en" }, "ru"), ["uk-UA", "ru-RU", "en-US"]);
  assert.deepEqual(
    opt.resolveVoiceLanguageCodes({ voiceLangPreset: "custom", voiceCustomLangs: "de-DE, EN-us, bad!!, fr-FR" }, "ru"),
    ["de-DE", "en-US", "fr-FR"]
  );

  // 2) Dictation text cleanup
  assert.equal(opt.cleanDictationText("  привет ,   мир !   как   дела ?  "), " привет, мир! как дела? ");
  assert.equal(opt.cleanDictationText("давай давай проверим"), "давай проверим");
  assert.equal(opt.cleanDictationText("привет , мир ."), "привет, мир.");

  // 3) Upgraded AudioWorklet DSP source & main-world injection script syntax validity
  const workletDsp = opt.buildUpgradedAudioWorkletSource(1280, true);
  assert.doesNotThrow(() => new vm.Script(workletDsp), "Upgraded AudioWorklet DSP code must be valid JS");
  assert.ok(workletDsp.includes("CHUNK_SAMPLES = 1280"), "80ms chunking must batch 1280 samples to halve RPC overhead");
  assert.ok(workletDsp.includes("initLpf") && workletDsp.includes("hpY1"), "AudioWorklet must include DC/HPF + Butterworth anti-aliasing LPF");

  const workletStock = opt.buildUpgradedAudioWorkletSource(640, false);
  assert.doesNotThrow(() => new vm.Script(workletStock));
  assert.ok(workletStock.includes("CHUNK_SAMPLES = 640") && workletStock.includes("USE_DSP = false"));

  const mainWorldSrc = opt.buildMainWorldVoicePatchScript({
    voiceEnabled: true,
    languages: ["ru-RU", "en-US"],
    voiceExplicitLang: true,
    voiceChunkMs: 80,
    voiceDspFilter: true,
    voiceDisableWinIsolation: true,
    voiceAutoGain: true,
    voiceTextCleanup: true,
    isWindows: true,
    workletSource: workletDsp,
  });
  assert.doesNotThrow(() => new vm.Script(mainWorldSrc), "Main-world voice patch script must parse cleanly");
  assert.ok(mainWorldSrc.includes("rudex:voice-stream-state") && mainWorldSrc.includes("voiceIsolation") && mainWorldSrc.includes("StreamAudioTranscription"));

  // 4) WebSocket StreamAudioTranscription start-frame patching & incoming transcript cleanup
  const startFrame = JSON.stringify({
    streamId: "s-1",
    type: "start",
    procedure: "/exa.language_server_pb.LanguageServerService/StreamAudioTranscription",
    payload: { sampleRate: 16000 },
  });
  const wsRes = opt.patchWsStreamAudioFrame(startFrame, { voiceEnabled: true, voiceLangPreset: "ru-en" }, "ru");
  assert.equal(wsRes.patched, true);
  const patchedWs = JSON.parse(wsRes.data);
  assert.deepEqual(patchedWs.payload.languageCodes, ["ru-RU", "en-US"]);
  assert.equal(patchedWs.payload.languageCodesExplicit, true);

  // Must preserve caller-supplied explicit languageCodes
  const explicitFrame = JSON.stringify({
    streamId: "s-2",
    type: "start",
    procedure: "/exa.language_server_pb.LanguageServerService/StreamAudioTranscription",
    payload: { languageCodes: ["ja-JP"], languageCodesExplicit: true },
  });
  const preservedWs = opt.patchWsStreamAudioFrame(explicitFrame, { voiceEnabled: true, voiceLangPreset: "ru-en" }, "ru");
  assert.equal(preservedWs.patched, false);
  assert.deepEqual(JSON.parse(preservedWs.data).payload.languageCodes, ["ja-JP"]);

  // Unrelated WS procedure stays untouched
  const otherFrame = JSON.stringify({ streamId: "s-3", type: "start", procedure: "/exa.language_server_pb.LanguageServerService/Heartbeat", payload: {} });
  assert.equal(opt.patchWsStreamAudioFrame(otherFrame, { voiceEnabled: true, voiceLangPreset: "ru-en" }, "ru").patched, false);

  // Incoming transcription frame cleanup
  const incomingMsg = JSON.stringify({
    streamId: "s-1",
    type: "data",
    payload: { transcription: { text: "проверка ,  связи  связи !" } },
  });
  const cleanedIncoming = JSON.parse(opt.cleanIncomingWsTranscriptionFrame(incomingMsg, true));
  assert.equal(cleanedIncoming.payload.transcription.text, "проверка, связи!");
  assert.equal(opt.cleanIncomingWsTranscriptionFrame(incomingMsg, false), incomingMsg);

  // 5) gRPC-Web 5-byte framed JSON body patching
  const rawBodyJson = Buffer.from(JSON.stringify({ sampleRate: 16000 }), "utf8");
  const framed = new Uint8Array(5 + rawBodyJson.length);
  framed[0] = 0;
  new DataView(framed.buffer).setUint32(1, rawBodyJson.length, false);
  framed.set(rawBodyJson, 5);
  const grpcRes = opt.patchGrpcWebStreamAudioBody(framed, { voiceEnabled: true, voiceLangPreset: "en-ru" }, "en");
  assert.equal(grpcRes.patched, true);
  assert.ok(grpcRes.body instanceof Uint8Array);
  const outLen = new DataView(grpcRes.body.buffer, grpcRes.body.byteOffset, grpcRes.body.byteLength).getUint32(1, false);
  assert.equal(outLen, grpcRes.body.byteLength - 5);
  const outObj = JSON.parse(Buffer.from(grpcRes.body.subarray(5)).toString("utf8"));
  assert.deepEqual(outObj.languageCodes, ["en-US", "ru-RU"]);
  assert.equal(outObj.languageCodesExplicit, true);

  // 6) Animation Polish CSS across modes
  const smoothCss = opt.buildAnimationPolishCss(def);
  assert.ok(smoothCss.includes("--sdk-transition-fast: 115ms"), "Smooth mode must upgrade Jetbox transitions");
  assert.ok(smoothCss.includes(".transition-all"), "Must narrow .transition-all away from layout properties");
  assert.ok(smoothCss.includes('[data-rudex-dictating="1"]'), "Must pause heavy composer blur during dictation");
  assert.ok(smoothCss.includes('[data-rudex-window-hidden="1"]'), "Must freeze animations in hidden windows");
  assert.ok(smoothCss.includes("contain: layout style"), "Must apply CSS layout containment");

  const snappyCss = opt.buildAnimationPolishCss({ animMode: "snappy" });
  assert.ok(snappyCss.includes("--sdk-transition-fast: 70ms"));
  const reducedCss = opt.buildAnimationPolishCss({ animMode: "reduced" });
  assert.ok(reducedCss.includes("animation-duration: 1ms !important;"));

  // 7) Native dictation button detector & optimizer controller lifecycle
  const { doc, win } = createMockDom();
  const stopMicBtn = doc.createElement("button");
  stopMicBtn.setAttribute("aria-label", "Stop recording");
  stopMicBtn.className = "rounded-full bg-red-500 text-white";
  doc.body.appendChild(stopMicBtn);
  const detected = opt.findNativeDictationButton(doc);
  assert.ok(detected && detected.active === true && detected.button === stopMicBtn, "Must detect Antigravity native GJ Stop recording button");

  const ctrl = opt.createRudexOptimizer({ document: doc, window: win });
  try {
    ctrl.apply(def, "ru");
    assert.ok(doc.getElementById("rudex-anim-polish"), "Optimizer must mount animation CSS style tag");
    ctrl.setDictating(true);
    assert.equal(doc.documentElement.getAttribute("data-rudex-dictating"), "1");
    const badge = doc.getElementById("rudex-voice-badge");
    assert.ok(badge && /0:0\d/.test(badge.textContent), "Inline voice timer pill must display elapsed timer");
    assert.equal(badge.querySelector("button"), null, "Inline voice pill must NOT render any extra clickable button");
    assert.equal(/[\u{1F300}-\u{1FAFF}]/u.test(badge.textContent), false, "Voice pill must contain zero emojis");
    ctrl.setDictating(false);
    assert.equal(doc.documentElement.getAttribute("data-rudex-dictating"), null);
    assert.equal(doc.getElementById("rudex-voice-badge"), null);
  } finally {
    ctrl.destroy();
  }
  assert.equal(doc.getElementById("rudex-anim-polish"), null, "destroy() must remove injected animation style");
});

test("Perf & Cache Engine: optimal LS tuning, prompt cache metrics, safe cache cleanup (preserves cookies/settings), and app_storage pruning", () => {
  const perf = require(path.join(SCRIPTS_DIR, "perf-cache-engine.js"));

  // 1) Hardware-adaptive LS tuning & Chromium switches
  const tuning12 = perf.computeOptimalLsTuning({ lsTuningEnabled: true }, { cpuCount: 12, totalMemBytes: 32 * 1024 ** 3 });
  assert.equal(tuning12.enabled, true);
  assert.equal(tuning12.summary.maxProcs, 10);
  assert.equal(tuning12.summary.fileWatchMaxDirs, 32768);
  assert.equal(tuning12.summary.maxTrackedWorkspaces, 24);
  assert.equal(tuning12.summary.goMemLimit, "6144MiB");
  assert.equal(tuning12.env.GOGC, "150");
  assert.ok(tuning12.args.includes("--limit_go_max_procs=10"));

  const tuning4 = perf.computeOptimalLsTuning({ lsTuningEnabled: true }, { cpuCount: 4, totalMemBytes: 8 * 1024 ** 3 });
  assert.equal(tuning4.summary.maxProcs, 4);
  assert.equal(tuning4.summary.goMemLimit, "2048MiB");

  const tuningOff = perf.computeOptimalLsTuning({ lsTuningEnabled: false }, { cpuCount: 12, totalMemBytes: 32 * 1024 ** 3 });
  assert.equal(tuningOff.enabled, false);
  assert.deepEqual(tuningOff.args, []);
  assert.equal(perf.computeOptimalLsTuning({}).enabled, false, "LS tuning must default to OFF when omitted");

  const tuningLinuxLowInotify = perf.computeOptimalLsTuning({ lsTuningEnabled: true, lsFileWatchMaxDirs: 32768 }, { cpuCount: 8, totalMemBytes: 16 * 1024 ** 3, platform: "linux", linuxMaxUserWatches: 8192 });
  assert.equal(tuningLinuxLowInotify.summary.fileWatchMaxDirs, 4096, "Linux low inotify limit must cap fileWatchMaxDirs to <=50%");

  assert.deepEqual(perf.computeChromiumPerfSwitches({}), [], "Chromium perf switches must default to empty when opt-in flags are OFF");
  const swOn = perf.computeChromiumPerfSwitches({ gpuAccel: true, chromiumCacheCapMb: 100 });
  assert.ok(swOn.some(([k]) => k === "disk-cache-size") && swOn.some(([k]) => k === "enable-smooth-scrolling"));
  assert.equal(swOn.some(([k]) => k === "enable-zero-copy" || k === "enable-gpu-rasterization"), false, "Must never force risky zero-copy/gpu-rasterization switches that can break Linux/VM/RDP GPUs");
  const swNoGpu = perf.computeChromiumPerfSwitches({ gpuAccel: false, chromiumCacheCapMb: 100 });
  assert.equal(swNoGpu.some(([k]) => k === "enable-smooth-scrolling"), false);

  // 2) Safe cache cleanup, prompt cache sampling, and app_storage.json stale layout pruning
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-perf-cache-"));
  try {
    const userDataDir = path.join(tmpRoot, "Antigravity");
    const geminiDir = path.join(tmpRoot, "gemini-agy");
    const aliveId = "11111111-1111-4111-8111-111111111111";
    const deadId = "22222222-2222-4222-8222-222222222222";

    // Create regenerable caches + critical user data that MUST NOT be deleted
    fs.mkdirSync(path.join(userDataDir, "Cache", "Cache_Data"), { recursive: true });
    fs.mkdirSync(path.join(userDataDir, "Code Cache", "js"), { recursive: true });
    fs.mkdirSync(path.join(userDataDir, "Partitions", "browser_1", "Cache"), { recursive: true });
    fs.mkdirSync(path.join(userDataDir, "studio_live_edits", "expired"), { recursive: true });
    fs.mkdirSync(path.join(userDataDir, "studio_live_edits", "queue"), { recursive: true });
    fs.writeFileSync(path.join(userDataDir, "Cache", "Cache_Data", "f_001"), "x".repeat(4096));
    fs.writeFileSync(path.join(userDataDir, "Code Cache", "js", "bundle.bin"), "y".repeat(2048));
    fs.writeFileSync(path.join(userDataDir, "Partitions", "browser_1", "Cache", "part_01"), "z".repeat(1024));
    fs.writeFileSync(path.join(userDataDir, "Cookies"), "PROTECTED_COOKIES");
    fs.writeFileSync(path.join(userDataDir, "agy_studio_settings.json"), '{"keep":true}');
    const orphanTmp = path.join(userDataDir, "agy_studio_settings.json.tmp-99999");
    fs.writeFileSync(orphanTmp, "orphan-tmp");
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    fs.utimesSync(orphanTmp, tenMinAgo, tenMinAgo);
    const expiredEdit = path.join(userDataDir, "studio_live_edits", "expired", "old.json");
    fs.writeFileSync(expiredEdit, '{"old":1}');
    const activeQueued = path.join(userDataDir, "studio_live_edits", "queue", "live.json");
    fs.writeFileSync(activeQueued, '{"active":1}');

    // Create brain transcript with prompt cache hit rate 80% (800 / (200 + 800))
    const logDir = path.join(geminiDir, "brain", aliveId, ".system_generated", "logs");
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(
      path.join(logDir, "transcript.jsonl"),
      [
        JSON.stringify({ input_tokens: 200, cache_read_tokens: 800, output_tokens: 120 }),
        JSON.stringify({ input_tokens: 100, cache_read_tokens: 400, output_tokens: 60 }),
      ].join("\n") + "\n",
      "utf8"
    );

    // Create app_storage.json with 1 alive layout, 1 dead layout, 1 index, and 1 regular key
    const storagePath = path.join(userDataDir, "app_storage.json");
    fs.writeFileSync(
      storagePath,
      JSON.stringify({
        [`antigravity-multi-conversation-layout-v3-${aliveId}`]: '{"open":true}',
        [`antigravity-multi-conversation-layout-v3-${deadId}`]: '{"stale":true}',
        "antigravity-multi-conversation-layout-v3-index": '[]',
        "antigravity-user-theme": "dark",
      }),
      "utf8"
    );

    const diagBefore = perf.inspectCacheDiagnostics({ userDataDir, geminiDir });
    assert.equal(diagBefore.promptCache.cacheHitRatePct, 80);
    assert.equal(diagBefore.promptCache.turnsSampled, 2);
    assert.equal(diagBefore.appStorage.staleLayoutKeys.length, 1);
    assert.ok(diagBefore.buckets.chromiumCache.bytes >= 6144);
    assert.ok(diagBefore.buckets.partitionsCache.bytes >= 1024);

    // Run safe cache cleanup
    const cleanRes = perf.cleanSafeCaches({ userDataDir });
    assert.ok(cleanRes.ok && cleanRes.removedFiles >= 5 && cleanRes.freedBytes >= 7168);
    assert.equal(fs.existsSync(path.join(userDataDir, "Cookies")), true, "Cookies MUST NEVER be deleted");
    assert.equal(fs.existsSync(path.join(userDataDir, "agy_studio_settings.json")), true, "Studio settings MUST NEVER be deleted");
    assert.equal(fs.existsSync(activeQueued), true, "Active queued live edit MUST NOT be deleted");
    assert.equal(fs.existsSync(expiredEdit), false, "Expired live edit must be purged");
    assert.equal(fs.existsSync(orphanTmp), false, "Orphaned .tmp file must be purged");

    // Run stale app_storage.json pruning
    const pruneRes = perf.pruneStaleAppStorage({ userDataDir, geminiDir });
    assert.equal(pruneRes.ok, true);
    assert.equal(pruneRes.removedKeys, 1);
    assert.equal(fs.existsSync(`${storagePath}.rudex-bak`), true, "Pruner must write .rudex-bak before modifying app_storage.json");
    const afterStorage = JSON.parse(fs.readFileSync(storagePath, "utf8"));
    assert.ok(afterStorage[`antigravity-multi-conversation-layout-v3-${aliveId}`], "Active chat layout key must be preserved");
    assert.equal(afterStorage[`antigravity-multi-conversation-layout-v3-${deadId}`], undefined, "Dead chat layout key must be removed");
    assert.equal(afterStorage["antigravity-multi-conversation-layout-v3-index"], "[]", "Layout index key must be preserved");
    assert.equal(afterStorage["antigravity-user-theme"], "dark", "Unrelated app_storage keys must be preserved");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("Electron shell perf patches (languageServer.js, storage.js RAM cache, main.js GPU switches) and rudex-hook.js SessionStart File/Cache protocol", () => {
  const vm = require("vm");
  const { patchMainJs, patchLanguageServerJs, patchStorageJs } = require(path.join(SCRIPTS_DIR, "electron-shell.js"));

  // 1) patchMainJs injects Chromium GPU/cache switches cleanly & compiles
  const sampleMain = [
    `"use strict";`,
    `const electron_1 = require("electron");`,
    `const menu_1 = require("./menu");`,
    `const HEADLESS = false;`,
    `electron_1.app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');`,
    `function boot(storageManager) {`,
    `    const ipc = (0, ipcHandlers_1.registerIpcHandlers)(storageManager, {});`,
    `    return ipc;`,
    `}`,
  ].join("\n");
  const mainWarnings = [];
  const mainP1 = patchMainJs(sampleMain, "44.9.1", mainWarnings);
  assert.ok(mainP1.includes("computeChromiumPerfSwitches") && mainP1.includes("__RUDEX_STORAGE_CACHE__"));
  assert.doesNotThrow(() => new vm.Script(mainP1));

  // 2) patchLanguageServerJs injects RUDEX_LS_TUNING cleanly & idempotently
  const sampleLs = [
    `"use strict";`,
    `function buildEnv(args, env, wsl) {`,
    `        // Disable implicit cd4a.config.json discovery/watch, usage telemetry, and`,
    `        // detached npm update checks in Hub-spawned chrome-devtools-mcp processes.`,
    `        env['CHROME_DEVTOOLS_MCP_NO_CONFIG_DISCOVERY'] = '1';`,
    `        env['CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS'] = '1';`,
    `        env['CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS'] = '1';`,
    `}`,
  ].join("\n");
  const lsWarns = [];
  const lsP1 = patchLanguageServerJs(sampleLs, lsWarns);
  assert.equal(lsWarns.length, 0);
  assert.ok(lsP1.includes("RUDEX_LS_TUNING") && lsP1.includes("computeOptimalLsTuning"));
  assert.doesNotThrow(() => new vm.Script(lsP1));
  assert.equal(patchLanguageServerJs(lsP1, lsWarns), lsP1, "patchLanguageServerJs must be idempotent");

  // 3) patchStorageJs adds mtime+size RAM cache to StorageManager & invalidates on write
  const sampleStorage = [
    `"use strict";`,
    `const fs_1 = require("fs");`,
    `class StorageManager {`,
    `    constructor(storagePath) {`,
    `        this.storagePath = storagePath;`,
    `        this.emitter = { emit() {} };`,
    `        /** The last rename stayed refused through its retries. */`,
    `        this.renameRefused = false;`,
    `    }`,
    `    withDefaults(o) { return Object.assign({}, o); }`,
    `    getItemsSync() {`,
    `        try {`,
    `            const s = (0, fs_1.existsSync)(this.storagePath)`,
    `                ? (0, fs_1.readFileSync)(this.storagePath, 'utf-8').trim()`,
    `                : '';`,
    `            const p = s ? JSON.parse(s) : null;`,
    `            return this.withDefaults(p && typeof p === 'object' && !Array.isArray(p)`,
    `                ? p`,
    `                : {});`,
    `        }`,
    `        catch (e) {`,
    `            console.error('Error reading storage items synchronously:', e);`,
    `            return this.withDefaults({});`,
    `        }`,
    `    }`,
    `    async readRawItems() {`,
    `        if (!(0, fs_1.existsSync)(this.storagePath)) {`,
    `            return { items: {}, corrupt: false };`,
    `        }`,
    `        let content;`,
    `        try {`,
    `            content = (0, fs_1.readFileSync)(this.storagePath, 'utf-8').trim();`,
    `            const parsed = content ? JSON.parse(content) : null;`,
    `            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {`,
    `                return { items: parsed, corrupt: false };`,
    `            }`,
    `        } catch {}`,
    `        return { items: {}, corrupt: false };`,
    `    }`,
    `    writeItems(nextItems) {`,
    `        const currentItems = nextItems;`,
    `        const changes = nextItems;`,
    `        (0, fs_1.writeFileSync)(this.storagePath, JSON.stringify(currentItems), 'utf-8');`,
    `            this.emitter.emit('changed', changes);`,
    `    }`,
    `}`,
    `module.exports = { StorageManager };`,
  ].join("\n");
  const stWarns = [];
  const stP1 = patchStorageJs(sampleStorage, stWarns);
  assert.equal(stWarns.length, 0, `Unexpected storage warnings: ${stWarns.join(", ")}`);
  assert.ok(stP1.includes("RUDEX_STORAGE_RAM_CACHE"));
  assert.doesNotThrow(() => new vm.Script(stP1));
  assert.equal(patchStorageJs(stP1, stWarns), stP1, "patchStorageJs must be idempotent");

  // Execute patched StorageManager with instrumented fs to verify opt-in OFF vs RAM cache hits + invalidation
  const tmpStDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-storage-cache-"));
  const prevStorageCacheFlag = globalThis.__RUDEX_STORAGE_CACHE__;
  try {
    const stFile = path.join(tmpStDir, "app_storage.json");
    fs.writeFileSync(stFile, JSON.stringify({ a: 1 }), "utf-8");
    let readCount = 0;
    const wrappedFs = Object.assign({}, fs, {
      readFileSync: (...args) => { readCount += 1; return fs.readFileSync(...args); },
    });
    const mod = { exports: {} };
    const fn = new Function("require", "module", "exports", stP1);
    fn((id) => (id === "fs" ? wrappedFs : require(id)), mod, mod.exports);
    const mgr = new mod.exports.StorageManager(stFile);

    // Default/OFF -> stock uncached disk reads
    globalThis.__RUDEX_STORAGE_CACHE__ = false;
    assert.deepEqual(mgr.getItemsSync(), { a: 1 });
    assert.deepEqual(mgr.getItemsSync(), { a: 1 });
    assert.equal(readCount, 2, "When opt-in RAM cache is OFF, StorageManager must perform stock disk reads");

    // Opt-in ON -> hits RAM cache + refreshes immediately on write
    readCount = 0;
    globalThis.__RUDEX_STORAGE_CACHE__ = true;
    assert.deepEqual(mgr.getItemsSync(), { a: 1 });
    assert.deepEqual(mgr.getItemsSync(), { a: 1 });
    assert.deepEqual(mgr.getItemsSync(), { a: 1 });
    assert.equal(readCount, 1, "Repeated getItemsSync() calls with unchanged file must hit RAM cache (only 1 disk read)");
    mgr.writeItems({ a: 1, b: 2 });
    assert.deepEqual(mgr.getItemsSync(), { a: 1, b: 2 }, "Writing storage must immediately refresh RAM cache");
  } finally {
    globalThis.__RUDEX_STORAGE_CACHE__ = prevStorageCacheFlag;
    fs.rmSync(tmpStDir, { recursive: true, force: true });
  }

  // 4) rudex-hook.js SessionStart injects Gemini File & Prompt Cache Protocol only when flag exists
  const tmpHookDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-hook-perf-"));
  try {
    const baseEnv = Object.assign({}, process.env, { AGY_STUDIO_USER_DATA: tmpHookDir, RUDEX_SKIP_AUTO_REPATCH: "1" });
    // Flag OFF -> no injection
    const rOff = spawnSync(process.execPath, [path.join(SCRIPTS_DIR, "rudex-hook.js")], {
      input: JSON.stringify({ hookEventName: "SessionStart", conversationId: "33333333-3333-4333-8333-333333333333" }),
      env: baseEnv,
      encoding: "utf8",
    });
    assert.equal(rOff.status, 0, rOff.stderr);
    assert.equal((rOff.stdout || "").includes("File I/O & Prompt Cache Protocol"), false, "Must not inject protocol when perf flag is absent");

    // Flag ON -> injects once at SessionStart via injectSteps, NOT on PreInvocation
    fs.writeFileSync(path.join(tmpHookDir, "agy_studio_perf_agent.flag"), "1\n", "utf8");
    const rOn = spawnSync(process.execPath, [path.join(SCRIPTS_DIR, "rudex-hook.js")], {
      input: JSON.stringify({ hookEventName: "SessionStart", conversationId: "33333333-3333-4333-8333-333333333333" }),
      env: baseEnv,
      encoding: "utf8",
    });
    assert.equal(rOn.status, 0, rOn.stderr);
    const parsedOn = JSON.parse(rOn.stdout.trim());
    const injectedMsg = Array.isArray(parsedOn.injectSteps)
      ? parsedOn.injectSteps.map((st) => st && st.systemMessage && String(st.systemMessage.systemMessage || "")).find((s) => s && s.includes("File I/O & Prompt Cache Protocol"))
      : "";
    assert.ok(injectedMsg && Buffer.byteLength(injectedMsg, "utf8") < 600, "SessionStart must inject ultra-compact (<600B) Gemini File & Prompt Cache Protocol when flag exists");

    const rPre = spawnSync(process.execPath, [path.join(SCRIPTS_DIR, "rudex-hook.js")], {
      input: JSON.stringify({ hookEventName: "PreInvocation", conversationId: "33333333-3333-4333-8333-333333333333" }),
      env: baseEnv,
      encoding: "utf8",
    });
    assert.equal(rPre.status, 0, rPre.stderr);
    assert.equal((rPre.stdout || "").includes("Протокол быстрой работы с файлами"), false, "PreInvocation must NEVER re-inject the SessionStart protocol");
  } finally {
    fs.rmSync(tmpHookDir, { recursive: true, force: true });
  }
});

test("Studio Panel Optimization & Voice subtab, toggleDictation hotkey, backend flag sync, and zero-emoji UI", async () => {
  const Module = require("module");
  const origLoad = Module._load;
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-opt-studio-"));
  const optMod = require(path.join(RES_DIR, "rudex-optimizer.js"));
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));

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
  let i18nMain;
  try {
    Module._load = function (req) {
      if (req === "electron") return fakeElectron;
      return origLoad.apply(this, arguments);
    };
    const mainModPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainModPath)];
    i18nMain = require(mainModPath);
  } finally {
    Module._load = origLoad;
  }

  try {
    // 1) Backend DEFAULT_KEYBINDINGS, sanitizeOptimization, and perf agent flag sync
    assert.equal(i18nMain.DEFAULT_KEYBINDINGS.toggleDictation, "Ctrl+Alt+V");
    const cleanOpt = i18nMain.sanitizeOptimization({ voiceLangPreset: "ru-en", animMode: "snappy", geminiFileCacheProtocol: false });
    assert.equal(cleanOpt.voiceLangPreset, "ru-en");
    assert.equal(cleanOpt.animMode, "snappy");
    assert.equal(cleanOpt.geminiFileCacheProtocol, false);

    const perfFlag = path.join(tmpUserData, "agy_studio_perf_agent.flag");
    i18nMain.saveStudioSettings({ optimization: { geminiFileCacheProtocol: true } });
    assert.equal(fs.existsSync(perfFlag), true, "Saving geminiFileCacheProtocol=true must create agy_studio_perf_agent.flag");
    i18nMain.saveStudioSettings({ optimization: { geminiFileCacheProtocol: false } });
    assert.equal(fs.existsSync(perfFlag), false, "Saving geminiFileCacheProtocol=false must remove agy_studio_perf_agent.flag");

    // 2) Studio Panel Optimization & Voice subtab + IPC actions + toggleDictation hotkey
    const { doc, win } = createMockDom();
    const prevGlobals = {
      DEFAULT_OPTIMIZATION_SETTINGS: globalThis.DEFAULT_OPTIMIZATION_SETTINGS,
      sanitizeOptimizationSettings: globalThis.sanitizeOptimizationSettings,
      createRudexOptimizer: globalThis.createRudexOptimizer,
      findNativeDictationButton: globalThis.findNativeDictationButton,
    };
    globalThis.DEFAULT_OPTIMIZATION_SETTINGS = optMod.DEFAULT_OPTIMIZATION_SETTINGS;
    globalThis.sanitizeOptimizationSettings = optMod.sanitizeOptimizationSettings;
    globalThis.createRudexOptimizer = optMod.createRudexOptimizer;
    globalThis.findNativeDictationButton = optMod.findNativeDictationButton;

    let micClicked = 0;
    const micBtn = doc.createElement("button");
    micBtn.setAttribute("aria-label", "Record voice memo");
    micBtn.click = () => { micClicked += 1; };
    doc.body.appendChild(micBtn);

    const ipcCalls = [];
    let hotkeyListener = null;
    const translator = createDomTranslator({ document: doc });
    const themeEngine = te.createThemeEngine({ document: doc, window: win });
    const panel = createStudioPanel({
      document: doc,
      window: win,
      translator,
      telemetryEngine: createTelemetryEngine(),
      themeEngine,
      buildStudioStyles,
      ipcRenderer: {
        invoke: async (ch, arg) => {
          ipcCalls.push({ ch, arg });
          if (ch === "agy-studio:get-state") return { locale: "ru", settings: { viewMode: "mini", panelEnabled: true, optimization: optMod.DEFAULT_OPTIMIZATION_SETTINGS } };
          if (ch === "agy-studio:get-cache-diagnostics") {
            return {
              ok: true,
              cleanableTotalBytes: 157286400,
              lsTuning: { maxProcs: 10, cpuCount: 12, fileWatchMaxDirs: 32768, maxTrackedWorkspaces: 24, goMemLimit: "6144MiB" },
              promptCache: { cacheHitRatePct: 91.5, turnsSampled: 42, chatsSampled: 5 },
              buckets: { chromiumCache: { bytes: 104857600, files: 120 }, partitionsCache: { bytes: 52428800, files: 60 }, rudexTemp: { bytes: 0, files: 0 } },
              appStorage: { bytes: 60000, staleLayoutKeys: ["dead-1", "dead-2"] },
            };
          }
          if (ch === "agy-studio:clean-caches") return { ok: true, freedBytes: 157286400, removedFiles: 180 };
          if (ch === "agy-studio:prune-app-storage") return { ok: true, removedKeys: 2, freedBytes: 4096 };
          return { ok: true, settings: arg };
        },
        on: (ch, fn) => { if (ch === "agy-studio:hotkey-action") hotkeyListener = fn; },
        removeListener: () => {},
      },
    });

    try {
      panel.init();
      const shadow = doc.getElementById("rudex-studio-host").shadowRoot;
      const rootEl = shadow.querySelector(".studio-root");
      const modalMount = shadow.querySelector(".modal-mount");
      const dispatchClick = (attrs) => {
        const btn = doc.createElement("button");
        for (const [k, v] of Object.entries(attrs)) btn.setAttribute(`data-${k}`, String(v));
        rootEl.appendChild(btn);
        try { rootEl.dispatchEvent({ type: "click", target: btn }); } finally { btn.remove(); }
      };

      // Open Settings -> Optimization & Voice
      panel.setOpen(true, { tab: "settings", subTab: "optimization" });
      await new Promise((r) => setTimeout(r, 20));
      const optHtml = modalMount.innerHTML;
      assert.ok(optHtml.includes("Voice Dictation Pro"), "Optimization subtab must render Voice Dictation Pro section");
      assert.ok(optHtml.includes("Агенты Gemini, файлы ПК и кэш"), "Optimization subtab must render Gemini Files & Cache section");
      assert.ok(optHtml.includes("Анимации и плавность интерфейса"), "Optimization subtab must render GPU Animations section");
      assert.ok(optHtml.includes("Экспериментально"), "Cache & LS section must clearly badge experimental opt-in status");
      assert.equal(optHtml.includes("toggle-row") || optHtml.includes("seg-btn"), false, "Optimization subtab must use real Studio CSS classes (zero legacy nonexistent .toggle-row/.seg-btn)");
      const switchButtons = optHtml.match(/<button[^>]*class="switch[^"]*"[^>]*>[\s\S]*?<\/button>/g) || [];
      assert.ok(switchButtons.length >= 10, "Optimization subtab must render styled switch controls");
      for (const swHtml of switchButtons) {
        assert.ok(swHtml.includes('class="switch-thumb"'), `Every .switch button must include .switch-thumb: ${swHtml}`);
      }
      assert.ok(optHtml.includes("opt-model-card") && optHtml.includes("RU T-one Pro"), "Voice model selector must render structured .opt-model-card tiles");
      assert.equal(/[\u{1F300}-\u{1FAFF}]/u.test(optHtml), false, "Optimization subtab HTML must contain zero emojis");

      // Toggle voiceDspFilter & switch animMode to snappy
      dispatchClick({ action: "toggle-opt", key: "voiceDspFilter" });
      dispatchClick({ action: "set-opt-val", key: "animMode", val: "snappy" });
      assert.ok(ipcCalls.some((c) => c.ch === "agy-studio:save-settings" && c.arg.optimization && c.arg.optimization.voiceDspFilter === false));
      assert.ok(ipcCalls.some((c) => c.ch === "agy-studio:save-settings" && c.arg.optimization && c.arg.optimization.animMode === "snappy"));

      // Trigger cache cleanup and app_storage pruning actions sequentially (respecting busy guard)
      dispatchClick({ action: "clean-caches" });
      await new Promise((r) => setTimeout(r, 20));
      dispatchClick({ action: "prune-app-storage" });
      await new Promise((r) => setTimeout(r, 20));
      assert.ok(ipcCalls.some((c) => c.ch === "agy-studio:clean-caches"), "clean-caches button must invoke agy-studio:clean-caches");
      assert.ok(ipcCalls.some((c) => c.ch === "agy-studio:prune-app-storage"), "prune-app-storage button must invoke agy-studio:prune-app-storage");

      // Hotkey toggleDictation clicks native mic button (dispatched via preload.js -> panel.handleHotkeyAction)
      assert.equal(typeof panel.handleHotkeyAction, "function", "Studio panel must expose handleHotkeyAction");
      panel.handleHotkeyAction("toggleDictation");
      assert.equal(micClicked, 1, "toggleDictation hotkey must click native Antigravity voice dictation button");

      // DOM translator ignores #rudex-voice-badge and [data-rudex-ignore='1']
      const badgeEl = doc.createElement("div");
      badgeEl.id = "rudex-voice-badge";
      badgeEl.textContent = "Settings";
      doc.body.appendChild(badgeEl);
      translator.init();
      assert.equal(badgeEl.textContent, "Settings", "DOM translator must fast-skip #rudex-voice-badge");
    } finally {
      panel.destroy();
      translator.destroy();
      Object.assign(globalThis, prevGlobals);
    }
  } finally {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  }
});

test("Local Instant Voice Engine (Sherpa-ONNX): PCM conversion, segment accumulator, RFC6455 loopback WS, and E2E virtual StreamAudioTranscription bridge", async () => {
  const vm = require("vm");
  const net = require("net");
  const crypto = require("crypto");
  const lv = require(path.join(SCRIPTS_DIR, "local-voice-engine.js"));
  const opt = require(path.join(RES_DIR, "rudex-optimizer.js"));

  // 1) Int16 LE base64 -> Float32 LE conversion
  const pcm16 = Buffer.alloc(6);
  pcm16.writeInt16LE(0, 0);
  pcm16.writeInt16LE(16384, 2);
  pcm16.writeInt16LE(-32768, 4);
  const f32 = lv.pcm16Base64ToFloat32Buffer(pcm16.toString("base64"));
  assert.equal(f32.length, 12);
  assert.equal(f32.readFloatLE(0), 0);
  assert.equal(f32.readFloatLE(4), 0.5);
  assert.equal(f32.readFloatLE(8), -1);

  // 2) Multi-segment Russian accumulator + capitalization + Cyrillic stutter dedup
  const segs = new Map([
    [1, "тебя тебя люблю ,"],
    [0, "привет"],
    [2, "антигравити !"],
  ]);
  assert.equal(lv.formatAccumulatedSegments(segs, true), "Привет тебя люблю, антигравити!");

  // 3) Model & binary discovery on temp userDataDir
  const tmpVoiceUd = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-local-voice-"));
  try {
    const binSpec = lv.getPlatformBinarySpec();
    const fakeExe = path.join(tmpVoiceUd, "rudex_voice", "bin", binSpec.dirName, binSpec.exeRel);
    fs.mkdirSync(path.dirname(fakeExe), { recursive: true });
    fs.writeFileSync(fakeExe, "mock-exe");
    const modDir = path.join(tmpVoiceUd, "rudex_voice", "models", lv.LOCAL_VOICE_MODELS["ru-fast"].dirName);
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(path.join(modDir, "tokens.txt"), "a\n");
    fs.writeFileSync(path.join(modDir, "encoder.int8.onnx"), "e");
    fs.writeFileSync(path.join(modDir, "decoder.onnx"), "d");
    fs.writeFileSync(path.join(modDir, "joiner.int8.onnx"), "j");

    assert.equal(lv.resolveBinaryPath(tmpVoiceUd), fakeExe);
    const resolvedMod = lv.resolveModelFiles(tmpVoiceUd, "ru-fast");
    assert.ok(resolvedMod && resolvedMod.encoder.endsWith("encoder.int8.onnx"));
    assert.deepEqual(lv.listInstalledModels(tmpVoiceUd), ["ru-fast"]);

    const mgr = lv.createLocalVoiceManager({ userDataDir: tmpVoiceUd });
    const st = mgr.getStatus("ru-fast");
    assert.equal(st.installed, true);
    assert.equal(st.binaryReady, true);
    assert.equal(st.modelReady, true);
  } finally {
    fs.rmSync(tmpVoiceUd, { recursive: true, force: true });
  }

  // 4) Zero-dependency RFC6455 loopback WS client test against mock TCP WS server
  const mockServer = net.createServer((socket) => {
    let upgraded = false;
    let buf = Buffer.alloc(0);
    const sendTextFrame = (str) => {
      const payload = Buffer.from(str, "utf8");
      const hdr = Buffer.alloc(2);
      hdr[0] = 0x81;
      hdr[1] = payload.length;
      socket.write(Buffer.concat([hdr, payload]));
    };
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (!upgraded) {
        const end = buf.indexOf("\r\n\r\n");
        if (end === -1) return;
        const reqStr = buf.subarray(0, end).toString("latin1");
        const m = /Sec-WebSocket-Key:\s*([^\r\n]+)/i.exec(reqStr);
        const accept = crypto.createHash("sha1").update(m[1].trim() + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
        socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
        upgraded = true;
        buf = buf.subarray(end + 4);
      }
      while (buf.length >= 2) {
        const opcode = buf[0] & 0x0f;
        const len = buf[1] & 0x7f;
        if (buf.length < 2 + 4 + len) return;
        const mask = buf.subarray(2, 6);
        const data = Buffer.from(buf.subarray(6, 6 + len));
        for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
        buf = buf.subarray(6 + len);
        if (opcode === 2) {
          sendTextFrame(JSON.stringify({ text: "привет", segment: 0, is_final: false }));
        } else if (opcode === 1 && data.toString("utf8") === "Done") {
          sendTextFrame("Done!");
        }
      }
    });
  });
  await new Promise((res) => mockServer.listen(0, "127.0.0.1", res));
  const mockPort = mockServer.address().port;
  try {
    const ws = await lv.connectLocalWs(mockPort, 2000);
    const msgs = [];
    const doneP = new Promise((res) => {
      ws.onMessage((t) => {
        msgs.push(t);
        if (t === "Done!") res();
      });
    });
    ws.sendBinary(f32);
    ws.sendText("Done");
    await doneP;
    ws.close();
    assert.ok(msgs.some((m) => m.includes("привет")), "Loopback WS client must receive streamed JSON text");
    assert.ok(msgs.includes("Done!"), "Loopback WS client must receive Done! completion frame");
  } finally {
    await new Promise((res) => mockServer.close(res));
  }

  // 5) E2E virtual StreamAudioTranscription main-world interceptor test in vm.Context
  const cloudSent = [];
  const preloadPosted = [];
  const msgListeners = [];
  class MockWebSocket {
    constructor(url) { this.url = url; this._onmsg = null; }
    get onmessage() { return this._onmsg; }
    set onmessage(fn) { this._onmsg = fn; }
    addEventListener() {}
    send(d) { cloudSent.push(d); }
  }
  let vmWinRef = null;
  const sandboxWin = {
    navigator: { userAgent: "Mozilla/5.0 (Windows NT 10.0)" },
    WebSocket: MockWebSocket,
    MessageEvent: class MessageEvent { constructor(_t, init) { this.data = init.data; } },
    CustomEvent: class CustomEvent { constructor(t, init) { this.type = t; this.detail = init && init.detail; } },
    addEventListener(type, fn) { if (type === "message") msgListeners.push(fn); },
    dispatchEvent() {},
    postMessage(data) {
      preloadPosted.push(data);
      for (const fn of msgListeners) fn({ source: vmWinRef || sandboxWin, data });
    },
  };
  sandboxWin.window = sandboxWin;
  const initPayload = opt.buildVoiceMainWorldPayload({ voiceEnabled: true, voiceEngine: "auto", voiceLocalModel: "ru-fast" }, "ru", true);
  assert.equal(initPayload.localVoiceActive, true);
  assert.equal(initPayload.voiceChunkMs, 64, "Local instant mode must use low-latency 64ms chunks");

  const patchCode = opt.buildMainWorldVoicePatchScript(initPayload);
  const vmCtx = vm.createContext(sandboxWin);
  vmWinRef = vm.runInContext("window", vmCtx);
  vm.runInContext(patchCode, vmCtx);

  const clientWs = new sandboxWin.WebSocket("wss://127.0.0.1:5000/connect-websocket");
  const receivedFrames = [];
  clientWs.onmessage = (ev) => { receivedFrames.push(JSON.parse(ev.data)); };

  // Start stream
  clientWs.send(JSON.stringify({
    streamId: "st-1",
    type: "start",
    procedure: "/exa.language_server_pb.LanguageServerService/StreamAudioTranscription",
    payload: { mimeType: "audio/pcm;rate=16000" },
  }));
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(cloudSent.length, 0, "Local instant mode MUST NOT forward StreamAudioTranscription to cloud");
  assert.ok(receivedFrames.some((f) => f.streamId === "st-1" && f.payload && f.payload.ready && f.payload.ready.sessionId === "rudex-local-st-1"));
  assert.ok(preloadPosted.some((p) => p.__rudexVoice === "local-cmd" && p.payload.cmd === "start" && p.payload.sessionId === "rudex-local-st-1"));

  // Send audio chunk
  clientWs.send(JSON.stringify({
    streamId: "u-1",
    type: "start",
    procedure: "/exa.language_server_pb.LanguageServerService/SendAudioChunk",
    payload: { sessionId: "rudex-local-st-1", data: pcm16.toString("base64"), sequenceNumber: 0 },
  }));
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(cloudSent.length, 0, "Local instant mode MUST NOT forward SendAudioChunk to cloud");
  assert.ok(receivedFrames.some((f) => f.streamId === "u-1" && f.type === "end"), "SendAudioChunk unary RPC must resolve immediately");
  assert.ok(preloadPosted.some((p) => p.__rudexVoice === "local-cmd" && p.payload.cmd === "chunk"));

  // Deliver live partial from local Sherpa-ONNX via postMessage reply
  sandboxWin.postMessage({ __rudexVoice: "local-reply", payload: { streamId: "st-1", sessionId: "rudex-local-st-1", type: "partial", text: "Привет , мир мир" } });
  assert.ok(
    receivedFrames.some((f) => f.streamId === "st-1" && f.payload && f.payload.transcription && f.payload.transcription.text === "Привет, мир" && f.payload.transcription.isFinal === false),
    "Partial text must stream directly into Antigravity's WS onmessage with cleanup"
  );

  // End audio session + deliver final from local Sherpa-ONNX
  clientWs.send(JSON.stringify({
    streamId: "u-2",
    type: "start",
    procedure: "/exa.language_server_pb.LanguageServerService/EndAudioSession",
    payload: { sessionId: "rudex-local-st-1" },
  }));
  sandboxWin.postMessage({ __rudexVoice: "local-reply", payload: { streamId: "st-1", sessionId: "rudex-local-st-1", type: "final", text: "Привет, мир!" } });
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(cloudSent.length, 0, "Local instant mode MUST NOT forward EndAudioSession to cloud");
  assert.ok(receivedFrames.some((f) => f.streamId === "st-1" && f.payload && f.payload.transcription && f.payload.transcription.isFinal === true && f.payload.transcription.text === "Привет, мир!"));
  assert.ok(receivedFrames.some((f) => f.streamId === "st-1" && f.payload && f.payload.complete));
  assert.ok(receivedFrames.some((f) => f.streamId === "st-1" && f.type === "end"));

  // 6) Inline voice timer pill sits right next to the red recording button (never above/over textarea)
  const { doc: bDoc, win: bWin } = createMockDom();
  bWin.innerWidth = 1400;
  bWin.innerHeight = 900;
  let compRect = { left: 300, right: 980, top: 760, bottom: 820, width: 680, height: 60 };
  const compEl = bDoc.createElement("div");
  compEl.setAttribute("data-rudex-theme-composer", "1");
  compEl.getBoundingClientRect = () => compRect;
  bDoc.body.appendChild(compEl);
  let micRect = { left: 336, right: 368, top: 830, bottom: 862, width: 32, height: 32 };
  const redMicBtn = bDoc.createElement("button");
  redMicBtn.setAttribute("aria-label", "Stop recording");
  redMicBtn.className = "rounded-full bg-red-500";
  redMicBtn.getBoundingClientRect = () => micRect;
  bDoc.body.appendChild(redMicBtn);
  let roCb = null;
  bWin.ResizeObserver = class { constructor(cb) { roCb = cb; } observe() {} disconnect() { roCb = null; } };
  const badgeCtrl = opt.createRudexOptimizer({ document: bDoc, window: bWin, localVoiceInstalled: true });
  try {
    badgeCtrl.apply(opt.DEFAULT_OPTIMIZATION_SETTINGS, "ru");
    badgeCtrl.setDictating(true, "local");
    const bEl = bDoc.getElementById("rudex-voice-badge");
    assert.ok(bEl && bEl.classList.contains("is-local"), "Local dictation pill must have .is-local class");
    assert.equal(bEl.querySelector("button"), null, "Inline pill must have no extra button");
    assert.equal(bEl.style.left, "376px", "Pill must sit 8px right of red recording circle (368 + 8)");
    assert.equal(bEl.style.top, "846px", "Pill must vertically align with red recording circle center (830 + 16)");
    assert.equal(bEl.style.bottom, "", "Pill must not use floating bottom positioning above composer");

    // Simulate composer expanding upwards while toolbar shifts slightly down
    compRect = { left: 300, right: 980, top: 670, bottom: 830, width: 680, height: 160 };
    micRect = { left: 336, right: 368, top: 840, bottom: 872, width: 32, height: 32 };
    assert.equal(typeof roCb, "function", "Optimizer must attach ResizeObserver to composer");
    roCb();
    assert.equal(bEl.style.left, "376px", "Pill stays locked 8px right of red recording circle");
    assert.equal(bEl.style.top, "856px", "Pill tracks updated vertical center of red recording circle (840 + 16)");
  } finally {
    badgeCtrl.destroy();
  }
});

test("Cross-OS update reliability: pure-Node ZIP extraction (zero PowerShell), Zip-Slip guard, watcher env propagation, relaunch loop guard & Studio update error recovery", async () => {
  const zlib = require("zlib");
  const updaterCore = require(path.join(SCRIPTS_DIR, "updater-core.js"));
  const zipBuilder = require(path.join(SCRIPTS_DIR, "zip-builder.js"));
  const { patchMainJs } = require(path.join(SCRIPTS_DIR, "electron-shell.js"));

  // 1) Pure Node.js ZIP extraction works for STORE & DEFLATE archives without spawning powershell.exe/unzip
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-pure-zip-"));
  try {
    const zipPath = path.join(tmpDir, "update.zip");
    const extractDir = path.join(tmpDir, "out");
    const manifestJson = JSON.stringify({ name: "rudex", version: "5.0.9" });
    const built = zipBuilder.createZipBuffer([
      { name: "Rudex-main/plugin.json", data: Buffer.from(manifestJson, "utf8") },
      { name: "Rudex-main/skills/rudex/scripts/install.js", data: Buffer.from("// ok\n", "utf8") },
      { name: "Rudex-main/nested/readme.txt", data: Buffer.from("Привет мир!\n", "utf8") },
    ]);
    fs.writeFileSync(zipPath, built);

    const count = updaterCore.extractZipPureNode(zipPath, extractDir);
    assert.equal(count, 3, "Pure Node ZIP extractor must extract all 3 files");
    assert.equal(
      fs.readFileSync(path.join(extractDir, "Rudex-main", "nested", "readme.txt"), "utf8"),
      "Привет мир!\n",
      "UTF-8 file contents must survive pure Node extraction intact"
    );

    const found = updaterCore.extractZipArchive(zipPath, path.join(tmpDir, "out2"));
    assert.equal(found.pluginJson.version, "5.0.9", "extractZipArchive must locate plugin.json cleanly");

    // 2) DEFLATE-compressed ZIP entry must also extract cleanly in pure Node.js
    const deflateZipPath = path.join(tmpDir, "deflate.zip");
    const rawPayload = Buffer.from("Rudex DEFLATE test payload ".repeat(40), "utf8");
    const deflated = zlib.deflateRawSync(rawPayload);
    const fname = Buffer.from("Rudex-main/data.txt", "utf8");
    const crc = zipBuilder.crc32(rawPayload);
    const lfh = Buffer.alloc(30 + fname.length);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(8, 8); // DEFLATE
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(deflated.length, 18);
    lfh.writeUInt32LE(rawPayload.length, 22);
    lfh.writeUInt16LE(fname.length, 26);
    fname.copy(lfh, 30);
    const cdOffset = lfh.length + deflated.length;
    const cdh = Buffer.alloc(46 + fname.length);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(8, 10); // DEFLATE
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(deflated.length, 20);
    cdh.writeUInt32LE(rawPayload.length, 24);
    cdh.writeUInt16LE(fname.length, 28);
    cdh.writeUInt32LE(0, 42);
    fname.copy(cdh, 46);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(1, 8);
    eocd.writeUInt16LE(1, 10);
    eocd.writeUInt32LE(cdh.length, 12);
    eocd.writeUInt32LE(cdOffset, 16);
    fs.writeFileSync(deflateZipPath, Buffer.concat([lfh, deflated, cdh, eocd]));

    const deflateOut = path.join(tmpDir, "deflate-out");
    assert.equal(updaterCore.extractZipPureNode(deflateZipPath, deflateOut), 1);
    assert.equal(fs.readFileSync(path.join(deflateOut, "Rudex-main", "data.txt"), "utf8"), rawPayload.toString("utf8"));

    // 3) Zip-Slip traversal entry (raw unsanitized ZIP header) must be blocked
    const evilZipPath = path.join(tmpDir, "evil.zip");
    const evilName = Buffer.from("../../outside.txt", "utf8");
    const evilData = Buffer.from("pwn", "utf8");
    const evilCrc = zipBuilder.crc32(evilData);
    const eLfh = Buffer.alloc(30 + evilName.length);
    eLfh.writeUInt32LE(0x04034b50, 0);
    eLfh.writeUInt16LE(20, 4);
    eLfh.writeUInt32LE(evilCrc, 14);
    eLfh.writeUInt32LE(evilData.length, 18);
    eLfh.writeUInt32LE(evilData.length, 22);
    eLfh.writeUInt16LE(evilName.length, 26);
    evilName.copy(eLfh, 30);
    const eCdh = Buffer.alloc(46 + evilName.length);
    eCdh.writeUInt32LE(0x02014b50, 0);
    eCdh.writeUInt16LE(20, 4);
    eCdh.writeUInt16LE(20, 6);
    eCdh.writeUInt32LE(evilCrc, 16);
    eCdh.writeUInt32LE(evilData.length, 20);
    eCdh.writeUInt32LE(evilData.length, 24);
    eCdh.writeUInt16LE(evilName.length, 28);
    eCdh.writeUInt32LE(0, 42);
    evilName.copy(eCdh, 46);
    const eEocd = Buffer.alloc(22);
    eEocd.writeUInt32LE(0x06054b50, 0);
    eEocd.writeUInt16LE(1, 8);
    eEocd.writeUInt16LE(1, 10);
    eEocd.writeUInt32LE(eCdh.length, 12);
    eEocd.writeUInt32LE(eLfh.length + evilData.length, 16);
    fs.writeFileSync(evilZipPath, Buffer.concat([eLfh, evilData, eCdh, eEocd]));
    assert.throws(
      () => updaterCore.extractZipPureNode(evilZipPath, path.join(tmpDir, "evil-out")),
      /traversal|Unsafe/i,
      "Pure Node ZIP extractor must block path traversal entries"
    );

    // 4) Cross-OS post-update watchers propagate ANTIGRAVITY_RESOURCES_DIR & resolve Node/sherpa cleanup
    const i18nMainPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    const i18nSrc = fs.readFileSync(i18nMainPath, "utf8");
    assert.ok(i18nSrc.includes("env('ANTIGRAVITY_RESOURCES_DIR') = resDir;"), "WSH post-app-update watcher must pass ANTIGRAVITY_RESOURCES_DIR");
    assert.ok(i18nSrc.includes("/opt/homebrew/bin/node"), "POSIX post-app-update watcher must include Homebrew/nvm Node fallback");
    assert.ok(i18nSrc.includes("stopLocalVoiceServer();"), "Self-update & post-app-update paths must stop local Sherpa-ONNX cleanly");

    const installSrc = fs.readFileSync(path.join(SCRIPTS_DIR, "install.js"), "utf8");
    assert.ok(installSrc.includes("env('ANTIGRAVITY_RESOURCES_DIR') = resDir;"), "Windows on-exit WSH watcher must pass ANTIGRAVITY_RESOURCES_DIR");
    assert.ok(installSrc.includes("fs.accessSync(info.resourcesDir, fs.constants.W_OK)"), "Installer must verify resourcesDir write permission before syncing plugin metadata");
    assert.ok(installSrc.includes("process.getuid() === 0 && process.env.SUDO_UID"), "Installer must never create root-owned userData files under sudo");

    const localVoiceSrc = fs.readFileSync(path.join(SCRIPTS_DIR, "local-voice-engine.js"), "utf8");
    assert.ok(localVoiceSrc.includes("LD_LIBRARY_PATH") && localVoiceSrc.includes("DYLD_LIBRARY_PATH"), "Local voice server must wire shared lib search paths on Linux & macOS");
    assert.ok(localVoiceSrc.includes("com.apple.quarantine"), "Local voice installer must clear macOS Gatekeeper quarantine on downloaded binary");

    if (process.platform === "win32") {
      const wshOut = path.join(tmpDir, "restart.js");
      updaterCore.writeUpdaterRestartWsh("C:\\Antigravity\\Antigravity.exe", { outPath: wshOut, removeAsar: true, resourcesDir: "C:\\Antigravity\\resources" });
      const wshText = fs.readFileSync(wshOut, "utf8");
      assert.ok(wshText.includes("sherpa-onnx-online-websocket-server.exe"), "Windows restart helper must clean up any lingering Sherpa-ONNX daemon");
    }

    // 5) main.js version guard normalizes multi-token stamps & guards against relaunch loops
    const mockMain = '"use strict";\nconst electron_1 = require("electron");\n    const ipc = (0, ipcHandlers_1.registerIpcHandlers)(storageManager, {\n';
    const patchedMain = patchMainJs(mockMain, "44.9.1 abcdef", []);
    assert.ok(patchedMain.includes('RUDEX_REPATCH_ATTEMPT === "1"'), "main.js repatch guard must prevent infinite relaunch loops");
    assert.ok(patchedMain.includes("LOCKED_NEEDS_ACTIVATOR"), "main.js repatch guard must verify app.asar was actually unlocked before relaunch");
    assert.ok(patchedMain.includes('.trim().split(/\\s+/)[0]'), "main.js must normalize multi-token stamp version");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 6) Studio update UI recovers cleanly when check-updates or install-update IPC returns null & normalizes stale settingsSubTab
  const { doc: sDoc, win: sWin } = createMockDom();
  const mockIpc = {
    invoke: async (ch) => {
      if (ch === "agy-studio:check-updates" || ch === "agy-studio:install-update") return null;
      if (ch === "agy-studio:get-state") return null;
      if (ch === "agy-studio:get-update-state") return { status: "available", available: true, installed: { version: "5.0.3" }, remote: { version: "5.0.4" } };
      return null;
    },
    on: () => {},
    send: () => {},
  };
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const panel = createStudioPanel({
    document: sDoc,
    window: sWin,
    ipcRenderer: mockIpc,
    initialLocale: "ru",
    pluginMeta: { version: "5.0.3", dictEntries: 10, dynamicRulesCount: 2 },
  });
  try {
    panel.init();
    panel.setOpen(true, { tab: "settings", subTab: "stale-nonexistent-tab" });
    await new Promise((r) => setTimeout(r, 25));
    const host = sDoc.getElementById("rudex-studio-host");
    assert.ok(host && host.shadowRoot, "Studio shadow root must mount");
    const rootEl = host.shadowRoot.querySelector(".studio-root");
    const modalMount = host.shadowRoot.querySelector(".modal-mount");
    assert.ok(
      modalMount && modalMount.innerHTML.includes('class="subtab-btn is-active" data-action="set-settings-subtab" data-val="system"'),
      "Stale settingsSubTab must normalize to 'system' with active highlight"
    );

    const checkBtn = sDoc.createElement("button");
    checkBtn.setAttribute("data-action", "check-updates");
    modalMount.appendChild(checkBtn);
    rootEl.dispatchEvent({ type: "click", target: checkBtn });
    await new Promise((r) => setTimeout(r, 25));
    assert.ok(
      modalMount.innerHTML.includes("Ошибка обновления") && !modalMount.innerHTML.includes('disabled data-action="check-updates"'),
      "Null IPC response on check-updates must recover to error state and re-enable Check button"
    );

    const installBtn = sDoc.createElement("button");
    installBtn.setAttribute("data-action", "install-update");
    modalMount.appendChild(installBtn);
    rootEl.dispatchEvent({ type: "click", target: installBtn });
    await new Promise((r) => setTimeout(r, 25));
    assert.ok(
      modalMount.innerHTML.includes("Ошибка обновления") && !modalMount.innerHTML.includes('disabled data-action="install-update"'),
      "Null IPC response on install-update must recover to error state and allow retry"
    );
  } finally {
    panel.destroy();
  }
});

test("Live Voice Mode isolation (zero AudioWorklet/getUserMedia/WS interference) & Russian STT accuracy upgrades (T-one Pro, BPE hotwords, clean DSP, IT term cleanup)", async () => {
  const vm = require("vm");
  const opt = require(path.join(RES_DIR, "rudex-optimizer.js"));
  const lv = require(path.join(SCRIPTS_DIR, "local-voice-engine.js"));

  // 1) Clean DSP AudioWorklet has NO double-AGC envelope pumping
  const wkSrc = opt.buildUpgradedAudioWorkletSource(1024, true);
  assert.ok(wkSrc.includes("const fc = 7400;"), "Dictation DSP must use 7.4kHz anti-aliasing LPF");
  assert.equal(wkSrc.includes("this.env"), false, "Dictation DSP must NOT run double software AGC on top of WebRTC AGC");

  // 2) Unambiguous Russian dev/Antigravity term cleanup without breaking normal Russian
  assert.equal(
    opt.cleanDictationText("перезапусти антиграете проверь киширования и залей ру декс на гидхаб через пауэр шелл"),
    "перезапусти Antigravity проверь кэширования и залей Rudex на GitHub через PowerShell"
  );
  assert.equal(
    opt.cleanDictationText("обычный русский текст без искажений"),
    "обычный русский текст без искажений"
  );

  // 3) Main-world patch MUST NOT hijack Live Voice Mode's data: AudioWorklet, getUserMedia(autoGainControl:false), or voice relay WS
  const addModuleCalls = [];
  const gumCalls = [];
  const voiceWsSent = [];
  function FakeAudioWorklet() {}
  FakeAudioWorklet.prototype.addModule = async function (url) { addModuleCalls.push(url); return url; };
  function FakeWS(url) { this.url = url; this._onmsg = null; }
  Object.defineProperty(FakeWS.prototype, "onmessage", {
    configurable: true,
    enumerable: true,
    get() { return this._onmsg; },
    set(fn) { this._onmsg = fn; },
  });
  FakeWS.prototype.send = function (d) { voiceWsSent.push({ url: this.url, data: d }); };
  FakeWS.prototype.addEventListener = function () {};

  const listeners = [];
  const sandbox = {
    AudioWorklet: FakeAudioWorklet,
    WebSocket: FakeWS,
    URL: { createObjectURL: () => "blob:rudex-dictation-worklet", revokeObjectURL: () => {} },
    Blob: class { constructor(parts) { this.parts = parts; } },
    MessageEvent: class { constructor(t, o) { this.type = t; this.data = o && o.data; } },
    CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    navigator: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      mediaDevices: {
        getUserMedia: async (c) => { gumCalls.push(c); return { ok: true }; },
      },
    },
    addEventListener: (_t, fn) => listeners.push(fn),
    postMessage: () => {},
    dispatchEvent: () => {},
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
    Promise,
    Object, Array, Map, Set, WeakMap, JSON, String, Number, Boolean, RegExp, Math, Date, Uint8Array, ArrayBuffer, DataView, TextDecoder, TextEncoder,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  const initPayload = opt.buildVoiceMainWorldPayload({ voiceEnabled: true, voiceEngine: "auto", voiceLocalModel: "ru-tone" }, "ru", true);
  vm.runInContext(opt.buildMainWorldVoicePatchScript(initPayload), ctx);

  // 3a) Voice Mode inline data: worklet passes through 100% untouched; Dictation /audio_processor.js IS upgraded
  const aw = new FakeAudioWorklet();
  const voiceModeDataUrl = "data:application/javascript;base64," + Buffer.from("registerProcessor('audio-streaming-processor', P);", "utf8").toString("base64");
  await aw.addModule(voiceModeDataUrl);
  await aw.addModule("https://127.0.0.1:53686/audio_processor.js?v=2.35.2");
  assert.equal(addModuleCalls[0], voiceModeDataUrl, "Live Voice Mode data: worklet MUST remain 100% untouched (native 40ms PCM)");
  assert.equal(addModuleCalls[1], "blob:rudex-dictation-worklet", "Dictation /audio_processor.js must use upgraded cached Blob worklet");

  // 3b) Voice Mode getUserMedia(autoGainControl: false) keeps voiceIsolation: true untouched; Dictation optimizes WASAPI
  await sandbox.navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, voiceIsolation: true, autoGainControl: false },
  });
  await sandbox.navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, voiceIsolation: true },
  });
  assert.equal(gumCalls[0].audio.voiceIsolation, true, "Live Voice Mode must retain native voiceIsolation");
  assert.equal(gumCalls[0].audio.autoGainControl, false, "Live Voice Mode must retain autoGainControl: false");
  assert.equal("voiceIsolation" in gumCalls[1].audio, false, "Dictation on Windows must remove buggy voiceIsolation");
  assert.equal(gumCalls[1].audio.autoGainControl, true, "Dictation must enable autoGainControl");

  // 3c) Voice Mode relay WS is NOT wrapped on onmessage or send
  const voiceWs = new FakeWS("wss://127.0.0.1:53686/voice-relay");
  const rawHandler = () => {};
  voiceWs.onmessage = rawHandler;
  assert.equal(voiceWs._onmsg, rawHandler, "Live Voice Mode relay WebSocket onmessage MUST NOT be wrapped");
  voiceWs.send("StreamAudioTranscription");
  assert.equal(voiceWsSent.length, 1, "Non-/connect-websocket frames must pass directly without interception");

  // 4) T-one RU Pro (t-one-ctc) model resolution & Zipformer BPE hotwords generator
  const tmpUd = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-tone-test-"));
  try {
    const toneDir = path.join(tmpUd, "rudex_voice", "models", lv.LOCAL_VOICE_MODELS["ru-tone"].dirName);
    fs.mkdirSync(toneDir, { recursive: true });
    fs.writeFileSync(path.join(toneDir, "model.onnx"), "fake-ctc");
    fs.writeFileSync(path.join(toneDir, "tokens.txt"), "<blk> 0\nа 1\n");
    const resolvedTone = lv.resolveModelFiles(tmpUd, "ru-tone");
    assert.ok(resolvedTone && resolvedTone.kind === "t-one-ctc" && resolvedTone.sampleRate === 8000, "T-one RU Pro must resolve as 8kHz t-one-ctc model");
    assert.ok(lv.listInstalledModels(tmpUd).includes("ru-tone"));

    const voskDir = path.join(tmpUd, "rudex_voice", "models", lv.LOCAL_VOICE_MODELS["ru-fast"].dirName);
    fs.mkdirSync(voskDir, { recursive: true });
    fs.writeFileSync(path.join(voskDir, "encoder.int8.onnx"), "e");
    fs.writeFileSync(path.join(voskDir, "decoder.onnx"), "d");
    fs.writeFileSync(path.join(voskDir, "joiner.int8.onnx"), "j");
    fs.writeFileSync(path.join(voskDir, "tokens.txt"), "<blk> 0\n<sos/eos> 1\n<unk> 2\n▁анти 3\n");
    const resolvedVosk = lv.resolveModelFiles(tmpUd, "ru-fast");
    const hw = lv.ensureRuHotwordsFiles(tmpUd, resolvedVosk);
    assert.ok(hw && fs.existsSync(hw.vocabPath) && fs.existsSync(hw.hotwordsPath), "BPE Zipformer model must generate bpe.vocab + Russian IT hotwords");
    assert.ok(fs.readFileSync(hw.hotwordsPath, "utf8").includes("антигравити"), "Hotwords must include Russian Antigravity/dev vocabulary");
  } finally {
    fs.rmSync(tmpUd, { recursive: true, force: true });
  }
});

test("Security, Privacy & Supply-Chain Hardening: opt-in defaults, zero MyMemory, dynamic PreToolUse hook, GitHub Release SHA-256 verification", async () => {
  const Module = require("module");
  const http = require("http");
  const crypto = require("crypto");
  const updaterCore = require(path.join(SCRIPTS_DIR, "updater-core.js"));
  const { isLoopbackUrl } = require(path.join(SCRIPTS_DIR, "thinking-translator.js"));

  // 1) Zero MyMemory traces in thinking-translator.js & loopback-only guard
  const ttSrc = fs.readFileSync(path.join(SCRIPTS_DIR, "thinking-translator.js"), "utf8");
  assert.equal(/mymemory/i.test(ttSrc), false, "thinking-translator.js must completely remove MyMemory public translation memory");
  assert.equal(isLoopbackUrl("http://127.0.0.1:5000/translate"), "http://127.0.0.1:5000/translate");
  assert.equal(isLoopbackUrl("http://localhost:5000/translate"), "http://localhost:5000/translate");
  assert.equal(isLoopbackUrl("https://evil.example.com/translate"), "", "Non-loopback local translator URLs must be rejected");

  // 2) Backend opt-in defaults & dynamic PreToolUse hook sync
  const tmpUd = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-sec-hardening-"));
  const origLoad = Module._load;
  const fakeElectron = {
    app: { getPath: () => tmpUd, on: () => {}, emit: () => {} },
    ipcMain: { handle: () => {}, on: () => {} },
    webContents: { getAllWebContents: () => [] },
    dialog: {},
    shell: {},
    protocol: {},
    BrowserWindow: { getAllWindows: () => [] },
    clipboard: {},
    nativeImage: {},
    Notification: { isSupported: () => false },
  };
  const i18nMainPath = path.join(SCRIPTS_DIR, "i18n-main.js");
  delete require.cache[i18nMainPath];
  Module._load = function (req, parent, isMain) {
    if (req === "electron") return fakeElectron;
    return origLoad.apply(this, arguments);
  };
  let i18nMain;
  try {
    i18nMain = require(i18nMainPath);
  } finally {
    Module._load = origLoad;
  }

  try {
    const defSettings = i18nMain.sanitizeStudioSettings({});
    assert.equal(defSettings.thinkingInRussian, false, "thinkingInRussian must default to OFF (opt-in)");
    assert.equal(defSettings.thinkingTranslatorUrl, "");
    assert.equal(defSettings.quotaAutomation.notifyWhenClosed, false, "notifyWhenClosed must default to OFF (opt-in)");
    assert.equal(defSettings.optimization.lsTuningEnabled, false, "lsTuningEnabled must default to OFF (experimental opt-in)");
    assert.equal(defSettings.optimization.storageRamCache, false, "storageRamCache must default to OFF (experimental opt-in)");
    assert.equal(defSettings.optimization.geminiFileCacheProtocol, false, "geminiFileCacheProtocol must default to OFF (experimental opt-in)");
    assert.equal(defSettings.optimization.chromiumCacheCapMb, 0, "chromiumCacheCapMb must default to 0 (stock/off)");
    assert.equal(defSettings.optimization.gpuAccel, false, "gpuAccel smooth-scroll switch must default to OFF");

    // Loopback sanitizer strips external URLs from settings
    assert.equal(i18nMain.sanitizeStudioSettings({ thinkingTranslatorUrl: "https://external.host/api" }).thinkingTranslatorUrl, "");
    assert.equal(i18nMain.sanitizeStudioSettings({ thinkingTranslatorUrl: "http://127.0.0.1:5000/translate" }).thinkingTranslatorUrl, "http://127.0.0.1:5000/translate");

    // Dynamic PreToolUse sync preserves platform runner command (e.g. hook-runner.sh) and toggles cleanly
    const mockHooksPath = path.join(tmpUd, "hooks.json");
    fs.writeFileSync(
      mockHooksPath,
      JSON.stringify({
        "rudex-studio": {
          SessionStart: [{ type: "command", command: "sh ./skills/rudex/scripts/hook-runner.sh", timeout: 5 }],
          PreInvocation: [{ type: "command", command: "sh ./skills/rudex/scripts/hook-runner.sh", timeout: 5 }],
          Stop: [{ type: "command", command: "sh ./skills/rudex/scripts/hook-runner.sh", timeout: 5 }],
        },
      }, null, 2),
      "utf8"
    );
    assert.equal(i18nMain.syncDynamicPreToolUseHook(true, mockHooksPath), true);
    const enabledHooks = JSON.parse(fs.readFileSync(mockHooksPath, "utf8"));
    assert.ok(Array.isArray(enabledHooks["rudex-studio"].PreToolUse) && enabledHooks["rudex-studio"].PreToolUse.length === 1);
    assert.equal(enabledHooks["rudex-studio"].PreToolUse[0].hooks[0].command, "sh ./skills/rudex/scripts/hook-runner.sh", "Dynamic PreToolUse must preserve platform hook runner command");
    assert.equal(enabledHooks["rudex-studio"].PreToolUse[0].matcher.includes("run_command"), false, "Dynamic PreToolUse must never intercept run_command");

    assert.equal(i18nMain.syncDynamicPreToolUseHook(false, mockHooksPath), true);
    const disabledHooks = JSON.parse(fs.readFileSync(mockHooksPath, "utf8"));
    assert.equal(disabledHooks["rudex-studio"].PreToolUse, undefined, "Disabling dynamic PreToolUse must remove it cleanly from hooks.json");

    // Offline scheduler sync is a no-op when notifyWhenClosed is OFF and no prior script exists
    assert.equal(i18nMain.syncWindowsOfflineQuotaTask(false), true);
    assert.equal(fs.existsSync(path.join(tmpUd, "rudex-quota-notify.js")), false);
  } finally {
    fs.rmSync(tmpUd, { recursive: true, force: true });
  }

  // 3) GitHub Release + SHA-256 verification (accepts valid checksum, blocks tampered archive before extraction)
  const zipPayload = Buffer.from("PK\x03\x04fake-release-zip-bytes-for-sha256-test", "binary");
  const validSha256 = crypto.createHash("sha256").update(zipPayload).digest("hex");
  const badSha256 = "0".repeat(64);
  const sumsBody = `# Rudex release checksums\n${validSha256}  Rudex-v5.1.0.zip\n`;
  const parsedSums = updaterCore.parseSha256Sums(sumsBody);
  assert.equal(parsedSums["Rudex-v5.1.0.zip"], validSha256);

  const srv = http.createServer((req, res) => {
    const port = srv.address().port;
    if (req.url === "/releases/latest") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        tag_name: "v5.1.0",
        name: "Rudex v5.1.0",
        draft: false,
        published_at: "2026-11-27T12:00:00Z",
        html_url: "https://github.com/Ivan0967pro/Rudex/releases/tag/v5.1.0",
        assets: [
          { name: "Rudex-v5.1.0.zip", browser_download_url: `http://127.0.0.1:${port}/assets/Rudex-v5.1.0.zip` },
          { name: "SHA256SUMS.txt", browser_download_url: `http://127.0.0.1:${port}/assets/SHA256SUMS.txt` },
        ],
      }));
      return;
    }
    if (req.url === "/assets/SHA256SUMS.txt") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(sumsBody);
      return;
    }
    if (req.url === "/assets/Rudex-v5.1.0.zip") {
      res.writeHead(200, { "Content-Type": "application/zip" });
      res.end(zipPayload);
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
  try {
    const port = srv.address().port;
    const rel = await updaterCore.checkRemoteRelease({
      releaseApiUrl: `http://127.0.0.1:${port}/releases/latest`,
    });
    assert.equal(rel.ok, true);
    assert.equal(rel.remote.source, "release");
    assert.equal(rel.remote.version, "5.1.0");
    assert.equal(rel.remote.sha256, validSha256);
    assert.ok(rel.remote.archiveUrl.endsWith("/assets/Rudex-v5.1.0.zip"));

    // Tampered / mismatched SHA-256 MUST fail before extraction!
    await assert.rejects(
      () => updaterCore.installUpdateFromZip({
        archiveUrl: rel.remote.archiveUrl,
        expectedSha256: badSha256,
      }),
      /SHA-256 checksum mismatch/i,
      "installUpdateFromZip must reject archives whose SHA-256 does not match expectedSha256"
    );

    // requireChecksum without sha256 MUST also fail
    await assert.rejects(
      () => updaterCore.installUpdateFromZip({
        archiveUrl: rel.remote.archiveUrl,
        requireChecksum: true,
      }),
      /Missing SHA-256 checksum/i
    );
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
});

test("Composer UI Style 0-frame anti-flash: synchronous MutationObserver re-tagging on chat switch & message send/typing", () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const { doc, win } = createMockDom();
  win.innerWidth = 1280;
  win.innerHeight = 800;
  const winCaptureMap = new Map();
  const origWinAdd = win.addEventListener;
  const origWinRem = win.removeEventListener;
  win.addEventListener = (type, fn, cap) => {
    if (!winCaptureMap.has(type)) winCaptureMap.set(type, new Set());
    winCaptureMap.get(type).add(fn);
    if (origWinAdd) origWinAdd.call(win, type, fn, cap);
  };
  win.removeEventListener = (type, fn, cap) => {
    if (winCaptureMap.has(type)) winCaptureMap.get(type).delete(fn);
    if (origWinRem) origWinRem.call(win, type, fn, cap);
  };
  win.dispatchEvent = (ev) => {
    const set = winCaptureMap.get(ev && ev.type);
    if (set) {
      for (const fn of Array.from(set)) fn(ev);
    }
  };

  let moCallback = null;
  const scheduledTimers = [];
  win.MutationObserver = class MockMO {
    constructor(cb) { this.cb = cb; }
    observe() { moCallback = this.cb; }
    disconnect() { if (moCallback === this.cb) moCallback = null; }
  };
  win.setTimeout = (fn, ms) => {
    const id = scheduledTimers.length + 1;
    scheduledTimers.push({ id, fn, ms });
    return id;
  };
  win.clearTimeout = () => {};
  win.requestAnimationFrame = () => 1;
  win.cancelAnimationFrame = () => {};
  win.getComputedStyle = (el) => {
    // Simulate compSel stripping background/border off <form data-testid="composer"> before JS runs!
    const isPh = el && typeof el.className === "string" && el.className.includes("pointer-events-none");
    return {
      backgroundColor: "rgba(0, 0, 0, 0)",
      backgroundImage: "none",
      borderTopWidth: "0px",
      borderTopColor: "rgba(0, 0, 0, 0)",
      borderTopLeftRadius: "0px",
      display: "block",
      visibility: "visible",
      opacity: "1",
      position: isPh ? "absolute" : "static",
      pointerEvents: isPh ? "none" : "auto",
    };
  };

  const root = doc.createElement("div");
  root.id = "root";
  const main = doc.createElement("main");
  root.appendChild(main);
  doc.body.appendChild(root);

  const setRect = (el, left, top, width, height) => {
    el.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height });
  };
  setRect(root, 0, 0, 1280, 800);
  setRect(main, 240, 0, 1040, 800);

  const buildComposer = () => {
    const form = doc.createElement("form");
    form.setAttribute("data-testid", "composer");
    setRect(form, 340, 660, 740, 96);
    const stack = doc.createElement("div");
    setRect(stack, 340, 660, 740, 96);
    const inputRow = doc.createElement("div");
    setRect(inputRow, 340, 660, 740, 48);
    const editorWrap = doc.createElement("div");
    setRect(editorWrap, 354, 670, 700, 24);
    const editor = doc.createElement("div");
    editor.setAttribute("contenteditable", "true");
    setRect(editor, 354, 670, 660, 24);
    const ph = doc.createElement("div");
    ph.className = "pointer-events-none";
    ph.textContent = "Ask anything";
    setRect(ph, 354, 670, 200, 22);
    editorWrap.appendChild(editor);
    editorWrap.appendChild(ph);
    inputRow.appendChild(editorWrap);

    const toolbar = doc.createElement("div");
    setRect(toolbar, 340, 712, 740, 36);
    const plusBtn = doc.createElement("button");
    plusBtn.setAttribute("aria-label", "Add context");
    plusBtn.textContent = "+";
    setRect(plusBtn, 344, 716, 28, 28);
    const micBtn = doc.createElement("button");
    micBtn.setAttribute("aria-label", "Record voice memo");
    setRect(micBtn, 376, 716, 28, 28);
    const modelBtn = doc.createElement("button");
    modelBtn.setAttribute("data-testid", "model-selector-trigger");
    modelBtn.textContent = "Gemini 4";
    setRect(modelBtn, 900, 716, 90, 28);
    toolbar.appendChild(plusBtn);
    toolbar.appendChild(micBtn);
    toolbar.appendChild(modelBtn);

    stack.appendChild(inputRow);
    stack.appendChild(toolbar);
    form.appendChild(stack);
    return { form, stack, inputRow, editorWrap, editor, ph, toolbar, plusBtn, micBtn, modelBtn };
  };

  const engine = te.createThemeEngine({ document: doc, window: win });
  try {
    engine.apply({
      presetId: "claude-code-dark",
      uiStyle: { preset: "claude-code", composer: "claude-code", chat: "claude-code", modelSelector: "claude-code" },
    });
    assert.ok(typeof moCallback === "function", "Theme engine must attach shell MutationObserver");

    // 1) Chat switch: brand-new composer mounted under <main> (no timers flushed yet!)
    const c1 = buildComposer();
    main.appendChild(c1.form);
    moCallback([{ type: "childList", target: main, addedNodes: [c1.form] }]);

    assert.equal(c1.form.getAttribute("data-rudex-theme-composer"), "1", "Newly mounted composer must be tagged synchronously on chat switch (0ms flash)");
    assert.equal(c1.inputRow.getAttribute("data-rudex-comp-input-row"), "1", "inputRow must be tagged synchronously before paint");
    assert.equal(c1.toolbar.getAttribute("data-rudex-comp-toolbar"), "1", "toolbar must be tagged synchronously before paint");
    assert.equal(c1.plusBtn.getAttribute("data-rudex-comp-plus"), "1", "plus button must be tagged synchronously before paint");
    assert.equal(c1.micBtn.getAttribute("data-rudex-comp-mic"), "1", "mic button must be tagged synchronously before paint");
    assert.equal(c1.ph.getAttribute("data-rudex-comp-placeholder"), "wrap", "placeholder must be tagged synchronously before paint");

    // 2) Typing / sending message: Send button dynamically mounted into toolbar + placeholder re-mounted in editorWrap
    const sendBtn = doc.createElement("button");
    sendBtn.setAttribute("type", "submit");
    sendBtn.setAttribute("aria-label", "Send");
    setRect(sendBtn, 1044, 716, 28, 28);
    c1.toolbar.appendChild(sendBtn);

    c1.ph.remove();
    const ph2 = doc.createElement("div");
    ph2.className = "pointer-events-none";
    ph2.textContent = "Reply...";
    setRect(ph2, 354, 670, 200, 22);
    c1.editorWrap.appendChild(ph2);

    const timersBefore = scheduledTimers.length;
    moCallback([
      { type: "childList", target: c1.toolbar, addedNodes: [sendBtn] },
      { type: "childList", target: c1.editorWrap, addedNodes: [ph2] },
    ]);

    assert.equal(sendBtn.getAttribute("data-rudex-comp-send"), "1", "Send button must be tagged synchronously on typing/sending (0ms flash)");
    assert.equal(ph2.getAttribute("data-rudex-comp-placeholder"), "wrap", "Re-mounted placeholder after send must be tagged synchronously");
    assert.ok(c1.form.style.getPropertyValue("--rudex-cc-send-top").endsWith("px"), "--rudex-cc-send-top must be aligned synchronously before paint");
    assert.equal(scheduledTimers.length, timersBefore, "Composer-internal mutations must NOT schedule redundant slow full-DOM shell scans");
  } finally {
    engine.destroy();
  }
});

test("Projects two-layer pitch-black sidebar flattening, custom sidebarBg/borderColor palette & backend persistence", () => {
  const Module = require("module");
  const origLoad = Module._load;
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const { doc, win } = createMockDom();
  const root = doc.createElement("div");
  root.id = "root";
  doc.body.appendChild(root);

  const setRect = (el, left, top, width, height) => {
    el.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height });
  };
  setRect(root, 0, 0, 1280, 800);

  // Simulate exact Projects sidebar structure: purple aside -> pitch-black Projects container -> dark-grey row ("среда") + active row
  const sidebar = doc.createElement("aside");
  sidebar.style.backgroundColor = "rgb(36, 20, 48)";
  setRect(sidebar, 0, 0, 260, 800);
  const projectsBox = doc.createElement("div");
  projectsBox.style.backgroundColor = "rgb(8, 8, 10)";
  setRect(projectsBox, 8, 120, 244, 160);
  const projHeader = doc.createElement("div");
  projHeader.textContent = "Проекты";
  setRect(projHeader, 12, 124, 236, 28);
  const projRow = doc.createElement("button");
  projRow.textContent = "среда";
  projRow.style.backgroundColor = "rgb(28, 28, 32)";
  setRect(projRow, 12, 156, 236, 36);
  const activeRow = doc.createElement("a");
  activeRow.textContent = "antigravity-ru";
  activeRow.setAttribute("aria-current", "page");
  activeRow.style.backgroundColor = "rgb(32, 32, 36)";
  setRect(activeRow, 12, 196, 236, 36);
  projectsBox.appendChild(projHeader);
  projectsBox.appendChild(projRow);
  projectsBox.appendChild(activeRow);
  sidebar.appendChild(projectsBox);
  root.appendChild(sidebar);

  const engine = te.createThemeEngine({ document: doc, window: win });
  try {
    // 1) Dark theme (sakura-dusk): Pass D3 flattens pitch-black Projects wrapper to panel (transparent) and items to single clean layer
    engine.apply({ presetId: "sakura-dusk" });
    engine.scanWallpaperShells();
    assert.equal(projectsBox.getAttribute("data-rudex-sidebar-surface"), "panel", "Pitch-black Projects wrapper must be marked as flat panel");
    assert.equal(projRow.getAttribute("data-rudex-sidebar-surface"), "item", "Sidebar project row must be marked as single-layer item");
    assert.equal(activeRow.getAttribute("data-rudex-sidebar-surface"), "active", "Active sidebar row must be marked as active");

    const darkCss = te.buildThemeCss({ presetId: "sakura-dusk" }, { hostIsLight: false });
    assert.ok(darkCss.includes('[data-rudex-sidebar-surface="panel"]'), "Theme CSS must flatten sidebar panels");
    assert.ok(darkCss.includes('[data-rudex-sidebar-surface="item"]'), "Theme CSS must style single-layer sidebar items");
    assert.ok(darkCss.includes("--sidebar-panel: transparent !important;"), "Theme CSS must expose --sidebar-panel variable");
    assert.ok(darkCss.includes("--divider:") && darkCss.includes("--separator:"), "Theme CSS must unify divider/separator variables");
    assert.equal(darkCss.includes('[data-rudex-bg-sidebar="1"]:not([data-rudex-bg-sidebar="1"] *)'), false, "Must never reintroduce forbidden sidebar selector");

    // 2) Wallpaper mode: Pass D3 & wallpaper CSS also flatten Projects box and unify borders/dividers
    engine.apply({ presetId: "sakura-dusk", wallpaper: { type: "gradient", gradientPreset: "aurora" } });
    engine.scanWallpaperShells();
    assert.equal(projectsBox.getAttribute("data-rudex-sidebar-surface"), "panel", "Wallpaper mode must preserve flat panel marker on Projects box");
    const wpCss = te.buildThemeCss({
      presetId: "sakura-dusk",
      customSidebarBg: true,
      sidebarBg: "#2a1638",
      customBorderColor: true,
      borderColor: "#f472b6",
      wallpaper: { type: "gradient", gradientPreset: "aurora" },
    }, { hostIsLight: false });
    assert.ok(wpCss.includes("rgba(42, 22, 56,"), "Wallpaper mode must honor customSidebarBg color");
    assert.ok(wpCss.includes("#f472b6"), "Wallpaper mode must honor customBorderColor");
    assert.ok(wpCss.includes('[data-rudex-sidebar-surface="panel"]'), "Wallpaper CSS must include sidebar panel flattening");

    // 3) Native preset with customSidebarBg & customBorderColor
    assert.equal(te.isAppearanceNativeDefault({ presetId: "native", customSidebarBg: true }), false);
    assert.equal(te.isAppearanceNativeDefault({ presetId: "native", customBorderColor: true }), false);
    const nativeCustomCss = te.buildThemeCss({
      presetId: "native",
      customSidebarBg: true,
      sidebarBg: "#1a2234",
      customBorderColor: true,
      borderColor: "#38bdf8",
    }, { hostIsLight: false });
    assert.ok(nativeCustomCss.includes("--sidebar: #1a2234 !important;"), "Native preset must allow customSidebarBg");
    assert.ok(nativeCustomCss.includes("--border: #38bdf8 !important;"), "Native preset must allow customBorderColor");
  } finally {
    engine.destroy();
  }

  // 4) Backend i18n-main.js sanitizeAppearance preserves customSidebarBg/sidebarBg & customBorderColor/borderColor
  const tmpUd = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-side-palette-"));
  try {
    const fakeElectron = {
      app: { getPath: () => tmpUd, isReady: () => true, on: () => {}, whenReady: () => Promise.resolve() },
      ipcMain: { handle: () => {}, removeHandler: () => {} },
      webContents: { getAllWebContents: () => [] },
      dialog: {}, shell: {}, protocol: {},
      BrowserWindow: { getAllWindows: () => [] },
      clipboard: { writeText: () => {}, writeImage: () => {} },
      nativeImage: { createFromPath: () => ({ isEmpty: () => true }) },
    };
    Module._load = function (req) {
      if (req === "electron") return fakeElectron;
      return origLoad.apply(this, arguments);
    };
    const mainModPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainModPath)];
    const i18nMain = require(mainModPath);
    const clean = i18nMain.sanitizeAppearance({
      presetId: "sakura-dusk",
      customSidebarBg: true,
      sidebarBg: "#28143A",
      customBorderColor: true,
      borderColor: "#E879F9",
    });
    assert.equal(clean.customSidebarBg, true);
    assert.equal(clean.sidebarBg, "#28143a");
    assert.equal(clean.customBorderColor, true);
    assert.equal(clean.borderColor, "#e879f9");
  } finally {
    Module._load = origLoad;
    fs.rmSync(tmpUd, { recursive: true, force: true });
  }
});

test("Full editability, Element Inspector fixes, intuitive navigation, debounced saves & History live filter", async () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));

  // 1) Expanded UI Zones & Smart Selector depth + sidebar surface anchoring
  const zoneIds = v5Core.RUDEX_UI_ZONES.map((z) => z.id);
  assert.ok(zoneIds.includes("sidebar-panels"), "Zones must include sidebar-panels (Projects)");
  assert.ok(zoneIds.includes("sidebar-active"), "Zones must include sidebar-active");
  assert.ok(zoneIds.includes("dividers"), "Zones must include dividers");
  assert.ok(zoneIds.includes("buttons"), "Zones must include buttons");

  const { doc, win } = createMockDom();
  const deepAside = doc.createElement("aside");
  deepAside.setAttribute("data-rudex-bg-sidebar", "1");
  let curParent = deepAside;
  for (let d = 0; d < 7; d += 1) {
    const w = doc.createElement("div");
    curParent.appendChild(w);
    curParent = w;
  }
  const deepProjBtn = doc.createElement("button");
  deepProjBtn.setAttribute("data-rudex-sidebar-surface", "panel");
  deepProjBtn.textContent = "Проекты";
  curParent.appendChild(deepProjBtn);
  doc.body.appendChild(deepAside);

  const exactDeepSel = v5Core.rv5BuildSmartSelector(deepProjBtn, "exact");
  assert.ok(exactDeepSel.startsWith('[data-rudex-bg-sidebar="1"]'), `Deep sidebar selector must anchor at sidebar, got: ${exactDeepSel}`);
  const simDeepSel = v5Core.rv5BuildSmartSelector(deepProjBtn, "similar");
  assert.equal(simDeepSel, '[data-rudex-sidebar-surface="panel"]:not(#rudex-studio-host *)');

  // 2) teBuildElementOverridesCss fixes: background-image: none, expanded descendants (h1/button/a/svg), narrow width no forced auto-center
  const ovCss = te.teBuildElementOverridesCss([{
    id: "ov-proj",
    name: "Projects",
    selector: '[data-rudex-sidebar-surface="panel"]',
    enabled: true,
    styles: { bgColor: "#221133", bgOpacity: 90, color: "#fef3c7", fontWeight: 600, lineHeight: 1.65, width: 180 },
  }], false, {});
  assert.ok(ovCss.includes("background-image: none !important;"), "bgColor override must strip gradient/glass sheen");
  assert.ok(ovCss.includes("h1, h2, h3, h4, h5, h6, li, strong, small, button, a, svg"), "Descendant color/font rule must cover headings, buttons, links & icons");
  assert.equal(ovCss.includes("margin-inline: auto"), false, "Narrow width override (<420px) must not force-center small elements");

  // 3) Studio CSS wraps sticky subtabs cleanly (zero hidden off-screen tabs) & Inspector shifts left of open drawer
  const stCss = buildStudioStyles();
  assert.ok(stCss.includes(".modal-sticky-subtabs .subtab-bar {\n      border-bottom: none;\n      overflow-x: visible;\n      flex-wrap: wrap;"), "Sticky subtabs must wrap instead of silently clipping off-screen");
  const v5Css = v5Core.rv5BuildExtraShadowCss();
  assert.ok(v5Css.includes(".rx-inspector-card.is-drawer-open"), "Inspector must shift cleanly beside open right-docked drawer");

  // 4) Full Studio Panel E2E checks: navigation groups, Workshop sticky subtabs, sidebarBg/borderColor UI, Inspector flush-on-close, debounced saves, History filter, antigravity suite
  const savedPatches = [];
  const translator = createDomTranslator({ document: doc, window: win, initialLocale: "ru" });
  const themeEngine = te.createThemeEngine({ document: doc, window: win });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    translator,
    telemetryEngine: createTelemetryEngine(),
    themeEngine,
    buildStyles: buildStudioStyles,
    ipcRenderer: {
      on() {},
      removeListener() {},
      send() {},
      sendSync() { return { ok: true }; },
      async invoke(ch, arg) {
        if (ch === "agy-studio:save-settings") {
          savedPatches.push(arg);
          return { ok: true };
        }
        if (ch === "agy-studio:get-state") {
          return {
            ok: true,
            locale: "ru",
            settings: {
              thinkingInRussian: true,
              thinkingTranslatorUrl: "",
              optimization: { voiceLangPreset: "custom", voiceCustomLangs: "ru-RU" },
            },
          };
        }
        if (ch === "agy-studio:get-input-history") {
          return {
            ok: true,
            draftCount: 0,
            items: [
              { id: "h1", text: "Поправь меню Проекты", chatTitle: "UI Audit", createdAt: Date.now(), attachments: [] },
              { id: "h2", text: "Настрой деплой Docker", chatTitle: "DevOps", createdAt: Date.now() - 60000, attachments: [] },
            ],
          };
        }
        return { ok: true };
      },
    },
  });

  const prevV5 = {
    RUDEX_UI_ZONES: globalThis.RUDEX_UI_ZONES,
    rv5BuildElementInspectorHtml: globalThis.rv5BuildElementInspectorHtml,
    rv5RenderElementsBuilderHtml: globalThis.rv5RenderElementsBuilderHtml,
    rv5RenderWorkshopHtml: globalThis.rv5RenderWorkshopHtml,
    rv5RenderInputHistoryHtml: globalThis.rv5RenderInputHistoryHtml,
    rv5BuildSmartSelector: globalThis.rv5BuildSmartSelector,
    rv5DescribeElementFriendly: globalThis.rv5DescribeElementFriendly,
  };
  Object.assign(globalThis, {
    RUDEX_UI_ZONES: v5Core.RUDEX_UI_ZONES,
    rv5BuildElementInspectorHtml: v5Ui.rv5BuildElementInspectorHtml,
    rv5RenderElementsBuilderHtml: v5Ui.rv5RenderElementsBuilderHtml,
    rv5RenderWorkshopHtml: v5Ui.rv5RenderWorkshopHtml,
    rv5RenderInputHistoryHtml: v5Ui.rv5RenderInputHistoryHtml,
    rv5BuildSmartSelector: v5Core.rv5BuildSmartSelector,
    rv5DescribeElementFriendly: v5Core.rv5DescribeElementFriendly,
  });

  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 15));
    const shadow = doc.getElementById("rudex-studio-host").shadowRoot;
    const rootEl = shadow.querySelector(".studio-root");
    const modalMount = shadow.querySelector(".modal-mount");
    const pickerMount = shadow.querySelector(".rx-picker-mount");

    const fireClick = (attrs) => {
      const b = doc.createElement("button");
      for (const [k, v] of Object.entries(attrs)) b.setAttribute(`data-${k}`, String(v));
      rootEl.appendChild(b);
      try { rootEl.dispatchEvent({ type: "click", target: b }); } finally { b.remove(); }
    };

    // 4a) 3 intuitive nav groups + Theme palette exposes sidebarBg & borderColor + zero emojis
    panel.setOpen(true, { tab: "appearance", appSubTab: "theme", dockedRight: false });
    const appHtml = modalMount.innerHTML;
    assert.ok(appHtml.includes("Внешний вид") && appHtml.includes("Работа с агентом") && appHtml.includes("Система"), "Sidebar must render 3 clear navigation groups");
    assert.ok(appHtml.includes('data-app-field="sidebarBg"'), "Theme palette must expose editable sidebarBg color");
    assert.ok(appHtml.includes('data-app-field="borderColor"'), "Theme palette must expose editable borderColor");
    assert.equal(/[\u{1F300}-\u{1FAFF}]/u.test(appHtml), false, "Appearance HTML must contain zero emojis");

    // 4b) Typing hex into sidebarBg & borderColor keeps active preset and applies custom colors
    const hexInp = doc.createElement("input");
    hexInp.setAttribute("data-app-hex-field", "sidebarBg");
    hexInp.value = "#221133";
    rootEl.appendChild(hexInp);
    rootEl.dispatchEvent({ type: "input", target: hexInp });
    hexInp.remove();
    const brdInp = doc.createElement("input");
    brdInp.setAttribute("data-app-hex-field", "borderColor");
    brdInp.value = "#ec4899";
    rootEl.appendChild(brdInp);
    rootEl.dispatchEvent({ type: "input", target: brdInp });
    brdInp.remove();
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(themeEngine.getCurrent().customSidebarBg, true);
    assert.equal(themeEngine.getCurrent().sidebarBg, "#221133");
    assert.equal(themeEngine.getCurrent().customBorderColor, true);
    assert.equal(themeEngine.getCurrent().borderColor, "#ec4899");
    fireClick({ action: "reset-custom-sidebar-bg" });
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(themeEngine.getCurrent().customSidebarBg, false);

    // 4c) antigravity 1-click suite saves valid windowTheme 'obsidian' (never invalid 'graphite')
    savedPatches.length = 0;
    fireClick({ action: "apply-platform-suite", val: "antigravity" });
    assert.ok(savedPatches.some((p) => p.studioUi && p.studioUi.windowTheme === "obsidian"), "Antigravity suite must save valid windowTheme='obsidian'");
    assert.equal(savedPatches.some((p) => p.studioUi && p.studioUi.windowTheme === "graphite"), false, "Antigravity suite must never use invalid windowTheme='graphite'");

    // 4d) Workshop renders pinned subtabs inside modal-sticky-subtabs
    panel.setOpen(true, { tab: "workshop" });
    const wsHtml = modalMount.innerHTML;
    assert.ok(wsHtml.includes("modal-sticky-subtabs") && wsHtml.includes('data-action="ws-set-sub"'), "Workshop must render pinned subtabs in modal-sticky-subtabs");

    // 4e) Widgets -> Mini no longer duplicates showChatDock/showContextMeter switches
    panel.setOpen(true, { tab: "widgets", widgetSub: "mini" });
    const miniHtml = modalMount.innerHTML;
    assert.equal(miniHtml.includes('data-action="toggle-live-inline"'), false, "Widgets -> Mini must not duplicate Agent composer toggles");
    assert.ok(miniHtml.includes('data-action="jump-search-hit" data-tab="persona"'), "Widgets -> Mini must cross-link cleanly to Agent");

    // 4f) Inspector opens beside right drawer with fontWeight & lineHeight and flushes pending edits on close (zero 180ms loss)
    panel.setOpen(true, { tab: "appearance", appSubTab: "elements", dockedRight: true });
    fireClick({ action: "edit-ui-zone", "zone-id": "sidebar-panels" });
    assert.ok(pickerMount.innerHTML.includes("is-drawer-open"), "Inspector must dock beside open right Appearance drawer");
    assert.ok(pickerMount.innerHTML.includes('data-insp-range="fontWeight"'), "Inspector must expose fontWeight control");
    assert.ok(pickerMount.innerHTML.includes('data-insp-range="lineHeight"'), "Inspector must expose lineHeight control");
    savedPatches.length = 0;
    const lhInp = doc.createElement("input");
    lhInp.setAttribute("data-insp-range", "lineHeight");
    lhInp.value = "1.65";
    rootEl.appendChild(lhInp);
    rootEl.dispatchEvent({ type: "input", target: lhInp });
    lhInp.remove();
    // Immediately close inspector BEFORE 180ms timer fires — edit MUST flush synchronously!
    fireClick({ action: "close-element-inspector" });
    assert.ok(
      savedPatches.some((p) => p.appearance && Array.isArray(p.appearance.elementOverrides) && p.appearance.elementOverrides.some((o) => o.styles && o.styles.lineHeight === 1.65)),
      "Closing inspector before debounce timeout must flush float lineHeight edit immediately"
    );

    // 4g) Debounced save persists thinkingTranslatorUrl & optVoiceLangs (no silent drop!)
    savedPatches.length = 0;
    const trUrlInp = doc.createElement("input");
    trUrlInp.setAttribute("data-sys-field", "thinkingTranslatorUrl");
    trUrlInp.value = "http://127.0.0.1:5000/translate";
    rootEl.appendChild(trUrlInp);
    rootEl.dispatchEvent({ type: "input", target: trUrlInp });
    const voiceLangInp = doc.createElement("input");
    voiceLangInp.setAttribute("data-opt-field", "voiceCustomLangs");
    voiceLangInp.value = "ru-RU, en-US";
    rootEl.appendChild(voiceLangInp);
    rootEl.dispatchEvent({ type: "input", target: voiceLangInp });
    trUrlInp.remove();
    voiceLangInp.remove();
    panel.setOpen(false);
    assert.ok(savedPatches.some((p) => p.thinkingTranslatorUrl === "http://127.0.0.1:5000/translate"), "thinkingTranslatorUrl must persist via debounced save/flush");
    assert.ok(savedPatches.some((p) => p.optimization && p.optimization.voiceCustomLangs === "ru-RU, en-US"), "optVoiceLangs must persist via debounced save/flush");

    // 4h) History live search filters cards and updates count live
    panel.setOpen(true, { tab: "history" });
    await new Promise((r) => setTimeout(r, 20));
    const histHtml = modalMount.innerHTML;
    assert.ok(histHtml.includes('data-role="historyList"'), "History list must expose data-role='historyList'");
    assert.ok(histHtml.includes('data-hist-search='), "History cards must expose data-hist-search attribute");

    // Verify live filtering DOM behavior directly on real mock nodes
    const histListEl = doc.createElement("div");
    histListEl.setAttribute("data-role", "historyList");
    const c1 = doc.createElement("div");
    c1.className = "rx-hist-card";
    c1.setAttribute("data-hist-search", "поправь меню проекты ui audit");
    const c2 = doc.createElement("div");
    c2.className = "rx-hist-card";
    c2.setAttribute("data-hist-search", "настрой деплой docker devops");
    const cntEl = doc.createElement("span");
    cntEl.setAttribute("data-role", "historyCount");
    cntEl.setAttribute("data-total", "2");
    const emptyEl = doc.createElement("div");
    emptyEl.setAttribute("data-role", "historyFilterEmpty");
    emptyEl.style.display = "none";
    histListEl.appendChild(c1);
    histListEl.appendChild(c2);
    modalMount.appendChild(cntEl);
    modalMount.appendChild(emptyEl);
    modalMount.appendChild(histListEl);

    const histSearchInp = doc.createElement("input");
    histSearchInp.setAttribute("data-role", "historySearch");
    histSearchInp.value = "проекты";
    rootEl.appendChild(histSearchInp);
    rootEl.dispatchEvent({ type: "input", target: histSearchInp });
    assert.equal(c1.style.display, "", "Matching history card must stay visible");
    assert.equal(c2.style.display, "none", "Non-matching history card must hide");
    assert.ok(cntEl.textContent.includes("(1 / 2)"), "History count must update live on filter");
    assert.equal(emptyEl.style.display, "none");

    histSearchInp.value = "несуществующийзапрос";
    rootEl.dispatchEvent({ type: "input", target: histSearchInp });
    assert.equal(emptyEl.style.display, "", "Empty filter state must show when 0 history cards match");
    histSearchInp.remove();
  } finally {
    panel.destroy();
    themeEngine.destroy();
    translator.destroy();
    Object.assign(globalThis, prevV5);
  }
});

test("Bugfixes: zero stuck sidebar strips + clear active pill, Claude Code 0px New/Active jump, reliable mid-turn live-edit interception & dock anti-overlap", async () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));

  // 1) Sidebar CSS uses clean rounded active pill (NO buggy inset 2px 0 0 strip) across dark, light & wallpaper modes
  for (const cfg of [
    { presetId: "claude-terminal" },
    { presetId: "sakura-dusk", wallpaper: { type: "gradient", gradientPreset: "aurora" } },
    { presetId: "light-paper" },
  ]) {
    const css = te.buildThemeCss(cfg, { hostIsLight: cfg.presetId === "light-paper" });
    assert.equal(css.includes("inset 2px 0 0"), false, `Sidebar active CSS for ${cfg.presetId} must NOT emit old buggy 2px left strip`);
    assert.ok(css.includes("inset 0px 0px 0px 1px"), `Sidebar active CSS for ${cfg.presetId} must render crisp rounded pill ring`);
    assert.ok(css.includes('[aria-current="page"]') && css.includes('[data-rudex-sidebar-surface="active"]'), `Sidebar active CSS for ${cfg.presetId} must work in all modes`);
  }

  // 2) Live sidebar chat switching (both aria-current AND React class-based active rows): 0ms switch, ZERO stuck attributes, light Pass D2 never marks non-active dark item as sidebar-active
  {
    const { doc, win } = createMockDom();
    win.innerWidth = 1280;
    win.innerHeight = 800;
    let observerCb = null;
    let observedOpts = null;
    win.MutationObserver = class MockMO {
      constructor(cb) { observerCb = cb; }
      observe(_t, opts) { observedOpts = opts; }
      disconnect() {}
    };
    const root = doc.createElement("div");
    root.id = "root";
    doc.body.appendChild(root);
    const setRect = (el, l, t, w, h) => { el.getBoundingClientRect = () => ({ left: l, top: t, width: w, height: h, right: l + w, bottom: t + h }); };
    setRect(root, 0, 0, 1280, 800);

    const aside = doc.createElement("aside");
    aside.style.backgroundColor = "rgb(20, 20, 22)";
    setRect(aside, 0, 0, 260, 800);
    const chatList = doc.createElement("div");
    setRect(chatList, 8, 80, 244, 240);
    const ch1 = doc.createElement("button");
    ch1.className = "chat-row bg-zinc-800";
    ch1.style.backgroundColor = "rgb(39, 39, 42)";
    ch1.textContent = "Chat 1";
    setRect(ch1, 10, 84, 240, 34);
    const ch2 = doc.createElement("button");
    ch2.className = "chat-row";
    ch2.style.backgroundColor = "rgba(0, 0, 0, 0)";
    ch2.textContent = "Chat 2";
    setRect(ch2, 10, 122, 240, 34);
    const ch3 = doc.createElement("button");
    ch3.className = "chat-row";
    ch3.style.backgroundColor = "rgba(0, 0, 0, 0)";
    ch3.textContent = "Chat 3";
    setRect(ch3, 10, 160, 240, 34);
    chatList.appendChild(ch1);
    chatList.appendChild(ch2);
    chatList.appendChild(ch3);
    aside.appendChild(chatList);
    root.appendChild(aside);

    const eng = te.createThemeEngine({ document: doc, window: win });
    try {
      eng.apply({ presetId: "claude-terminal" });
      assert.ok(observedOpts && observedOpts.attributeFilter.includes("aria-current") && observedOpts.attributeFilter.includes("data-active"), "MutationObserver must watch aria-current/aria-selected/data-active/data-selected");
      assert.equal(ch1.getAttribute("data-rudex-sidebar-surface"), "active", "Class-selected active chat row must receive active highlight");
      assert.equal(ch2.getAttribute("data-rudex-sidebar-surface"), null, "Inactive chat rows must remain unhighlighted");

      // Switch to Chat 2 via React class swap -> synchronous MutationObserver updates in 0ms and clears Chat 1!
      ch1.className = "chat-row";
      ch1.style.backgroundColor = "rgba(0, 0, 0, 0)";
      ch2.className = "chat-row bg-zinc-800";
      ch2.style.backgroundColor = "rgb(39, 39, 42)";
      observerCb([
        { type: "attributes", attributeName: "class", target: ch1 },
        { type: "attributes", attributeName: "class", target: ch2 },
      ]);
      assert.equal(ch1.getAttribute("data-rudex-sidebar-surface"), null, "Previously active Chat 1 must lose active highlight immediately (ZERO stuck strip/highlight)");
      assert.equal(ch2.getAttribute("data-rudex-sidebar-surface"), "active", "Newly clicked Chat 2 must immediately receive active highlight");

      // Switch to New Chat (no chat selected) -> ALL chat rows clear cleanly!
      ch2.className = "chat-row";
      ch2.style.backgroundColor = "rgba(0, 0, 0, 0)";
      observerCb([{ type: "attributes", attributeName: "class", target: ch2 }]);
      assert.equal(ch1.getAttribute("data-rudex-sidebar-surface"), null);
      assert.equal(ch2.getAttribute("data-rudex-sidebar-surface"), null, "Returning to New Chat must clear active highlight from Chat 2");
      assert.equal(ch3.getAttribute("data-rudex-sidebar-surface"), null);

      // Light theme Pass D2 must NOT stamp sidebar-active on non-active dark item (yiq < 45)
      ch3.style.backgroundColor = "rgb(18, 18, 20)";
      eng.apply({ presetId: "light-paper" });
      eng.scanWallpaperShells();
      assert.equal(ch3.getAttribute("data-rudex-light-fix"), "sidebar", "Non-active dark item in light theme must get 'sidebar', NEVER 'sidebar-active'");
    } finally {
      eng.destroy();
    }
  }

  // 3) Claude Code composer: 0px jump metrics (exact 44px box / 24px line / bottom:13px idle arrow / 8px send fallback / empty top sibling hidden)
  {
    const ccCss = te.buildThemeCss({ presetId: "claude-code-dark", uiStyle: { preset: "claude-code" } });
    assert.ok(ccCss.includes("min-height: 44px !important;") && ccCss.includes("margin: 0 !important;"), "Claude Code inputRow must lock 44px min-height and zero margin");
    assert.ok(ccCss.includes("bottom: 13px;"), "Claude Code idle return arrow must sit at bottom: 13px (exact 22px vertical center)");
    assert.ok(ccCss.includes("var(--rudex-cc-send-top, 8px)"), "Claude Code send button fallback must sit at 8px (exact 22px vertical center, 0px jump)");
    assert.ok(ccCss.includes("line-height: 24px !important;"), "Claude Code editor & placeholders must share locked 24px line-height");
    assert.ok(ccCss.includes("height: 32px !important;") && ccCss.includes("max-height: 32px !important;"), "Claude Code toolbar must lock exact 32px height across New Chat & Active Chat");
    assert.ok(ccCss.includes('[data-rudex-comp-wrap="1"]') && ccCss.includes('[data-rudex-comp-dock="1"]'), "Claude Code must normalize depth-independent composer footer dock wrappers");
    assert.ok(ccCss.includes('[data-rudex-comp-top-row="1"]:empty'), "Empty top-row must be collapsed via CSS");

    const { doc, win } = createMockDom();
    win.innerWidth = 1280;
    win.innerHeight = 800;
    const footerDock = doc.createElement("div");
    footerDock.getBoundingClientRect = () => ({ left: 240, top: 670, right: 1040, bottom: 786, width: 800, height: 116 });
    const innerWrap = doc.createElement("div");
    innerWrap.getBoundingClientRect = () => ({ left: 250, top: 676, right: 1030, bottom: 770, width: 780, height: 94 });
    const comp = doc.createElement("div");
    comp.style.borderRadius = "14px";
    comp.style.backgroundColor = "rgb(30, 30, 28)";
    comp.getBoundingClientRect = () => ({ left: 260, top: 680, right: 1020, bottom: 756, width: 760, height: 76 });
    const emptyTopSlot = doc.createElement("div"); // Empty placeholder sibling above inputRow in Active Chat
    emptyTopSlot.getBoundingClientRect = () => ({ left: 260, top: 680, right: 1020, bottom: 680, width: 760, height: 0 });
    const emptyTrailingSlot = doc.createElement("div"); // Empty trailing sibling after toolbar
    emptyTrailingSlot.getBoundingClientRect = () => ({ left: 260, top: 756, right: 1020, bottom: 756, width: 760, height: 0 });
    const inRow = doc.createElement("div");
    inRow.getBoundingClientRect = () => ({ left: 260, top: 680, right: 1020, bottom: 724, width: 760, height: 44 });
    const ce = doc.createElement("div");
    ce.setAttribute("contenteditable", "true");
    ce.getBoundingClientRect = () => ({ left: 274, top: 690, right: 980, bottom: 714, width: 706, height: 24 });
    inRow.appendChild(ce);
    const bar = doc.createElement("div");
    bar.getBoundingClientRect = () => ({ left: 260, top: 724, right: 1020, bottom: 756, width: 760, height: 32 });
    const modelBtn = doc.createElement("button");
    modelBtn.setAttribute("data-testid", "model-selector-trigger");
    modelBtn.textContent = "Claude Sonnet";
    modelBtn.getBoundingClientRect = () => ({ left: 820, top: 726, right: 960, bottom: 754, width: 140, height: 28 });
    bar.appendChild(modelBtn);
    comp.appendChild(emptyTopSlot);
    comp.appendChild(inRow);
    comp.appendChild(bar);
    comp.appendChild(emptyTrailingSlot);
    innerWrap.appendChild(comp);
    footerDock.appendChild(innerWrap);
    doc.body.appendChild(footerDock);

    const eng = te.createThemeEngine({ document: doc, window: win });
    try {
      eng.apply({ presetId: "claude-code-dark", uiStyle: { preset: "claude-code" } });
      assert.equal(innerWrap.getAttribute("data-rudex-comp-wrap"), "1", "Inner composer wrapper must get data-rudex-comp-wrap (pb: 0)");
      assert.equal(footerDock.getAttribute("data-rudex-comp-dock"), "1", "Outermost tight footer dock must get data-rudex-comp-dock (consistent 8px pb)");
      assert.equal(emptyTopSlot.getAttribute("data-rudex-comp-empty-slot"), "1", "Empty top sibling above inputRow must be marked empty-slot, NEVER top-row");
      assert.equal(emptyTrailingSlot.getAttribute("data-rudex-comp-empty-slot"), "1", "Empty trailing sibling after toolbar must also be hidden via empty-slot");
      assert.equal(emptyTopSlot.getAttribute("data-rudex-comp-top-row"), null);
      assert.equal(comp.style.getPropertyValue("--rudex-cc-send-top"), "8px", "Single-line 44px Claude Code Reply box must align send button at exact 8px");
    } finally {
      eng.destroy();
    }
  }

  // 4) Reliable mid-turn live-edit interception (div composer + aria-label Stop button + closed/sidebar listbox + "Add to queue" click) & Tools dock lifting above native queued bar + clean sidebar labels
  const prevV5 = {
    rv5EscapeHtml: globalThis.rv5EscapeHtml,
    rv5BuildSmartSelector: globalThis.rv5BuildSmartSelector,
    rv5DescribeElementFriendly: globalThis.rv5DescribeElementFriendly,
    rv5FindNativeComposer: globalThis.rv5FindNativeComposer,
    rv5ReadEditableText: globalThis.rv5ReadEditableText,
    rv5ClearEditableText: globalThis.rv5ClearEditableText,
    rv5NormalizeAgentProfile: globalThis.rv5NormalizeAgentProfile,
    rv5NormalizeLimitsWidget: globalThis.rv5NormalizeLimitsWidget,
    rv5NormalizeKeybindings: globalThis.rv5NormalizeKeybindings,
    rv5NormalizeQuotaAutomation: globalThis.rv5NormalizeQuotaAutomation,
    rv5CountActiveAgentFeatures: globalThis.rv5CountActiveAgentFeatures,
    rv5SummarizeActiveToggles: globalThis.rv5SummarizeActiveToggles,
    rv5BuildChatDockHtml: globalThis.rv5BuildChatDockHtml,
    rv5RenderAgentHubTabHtml: globalThis.rv5RenderAgentHubTabHtml,
    rv5RenderWorkshopHtml: globalThis.rv5RenderWorkshopHtml,
    rv5RenderElementsTabHtml: globalThis.rv5RenderElementsTabHtml,
    rv5RenderLimitsTabHtml: globalThis.rv5RenderLimitsTabHtml,
    rv5RenderKeybindingsHtml: globalThis.rv5RenderKeybindingsHtml,
    rv5RenderLimitsWidgetHtml: globalThis.rv5RenderLimitsWidgetHtml,
    rv5RenderElementInspectorPopup: globalThis.rv5RenderElementInspectorPopup,
    rv5SyncLiveChatBubbles: globalThis.rv5SyncLiveChatBubbles,
    RUDEX_UI_ZONES: globalThis.RUDEX_UI_ZONES,
    RUDEX_AGENT_PRESETS: globalThis.RUDEX_AGENT_PRESETS,
    RUDEX_AGENT_PROFILE_DEFAULTS: globalThis.RUDEX_AGENT_PROFILE_DEFAULTS,
    RUDEX_LIMITS_DEFAULTS: globalThis.RUDEX_LIMITS_DEFAULTS,
    RUDEX_KEYBINDING_DEFS: globalThis.RUDEX_KEYBINDING_DEFS,
    RUDEX_KEYBINDINGS_DEFAULTS: globalThis.RUDEX_KEYBINDINGS_DEFAULTS,
    RUDEX_LIVE_EDIT_DEFAULTS: globalThis.RUDEX_LIVE_EDIT_DEFAULTS,
    RUDEX_QUOTA_AUTOMATION_DEFAULTS: globalThis.RUDEX_QUOTA_AUTOMATION_DEFAULTS,
    buildStudioStyles: globalThis.buildStudioStyles,
  };
  Object.assign(globalThis, v5Core, v5Ui, { buildStudioStyles });
  const { doc, win } = createMockDom();
  win.innerWidth = 1280;
  win.innerHeight = 800;
  const winCaptureMap = new Map();
  const origWinAdd = win.addEventListener;
  const origWinRem = win.removeEventListener;
  win.addEventListener = (type, fn, cap) => {
    if (!winCaptureMap.has(type)) winCaptureMap.set(type, new Set());
    winCaptureMap.get(type).add(fn);
    if (origWinAdd) origWinAdd.call(win, type, fn, cap);
  };
  win.removeEventListener = (type, fn, cap) => {
    if (winCaptureMap.has(type)) winCaptureMap.get(type).delete(fn);
    if (origWinRem) origWinRem.call(win, type, fn, cap);
  };
  win.dispatchEvent = (ev) => {
    const set = winCaptureMap.get(ev && ev.type);
    if (set) {
      for (const fn of Array.from(set)) fn(ev);
    }
  };

  // Build native Antigravity DOM: div composer (no <form>) + aria-label="Stop generating" + "Add to queue" button + closed listbox + native "Сообщения в очереди" bar above composer
  const mainEl = doc.createElement("main");
  const nativeQueueBar = doc.createElement("div");
  nativeQueueBar.textContent = "Сообщения в очереди 1 Отправится после завершения работы агента";
  nativeQueueBar.getBoundingClientRect = () => ({ left: 260, top: 610, right: 1020, bottom: 682, width: 760, height: 72 });
  const compDiv = doc.createElement("div");
  compDiv.setAttribute("data-rudex-theme-composer", "1");
  compDiv.getBoundingClientRect = () => ({ left: 260, top: 690, right: 1020, bottom: 770, width: 760, height: 80 });
  const ed = doc.createElement("div");
  ed.setAttribute("contenteditable", "true");
  ed.textContent = "учти правку прямо сейчас";
  ed.getBoundingClientRect = () => ({ left: 274, top: 700, right: 960, bottom: 724, width: 686, height: 24 });
  const stopBtn = doc.createElement("button");
  stopBtn.setAttribute("aria-label", "Stop generating");
  const queueBtn = doc.createElement("button");
  queueBtn.setAttribute("aria-label", "Add to queue");
  compDiv.appendChild(ed);
  compDiv.appendChild(stopBtn);
  compDiv.appendChild(queueBtn);
  mainEl.appendChild(nativeQueueBar);
  mainEl.appendChild(compDiv);
  // Closed/sidebar listbox that must NEVER block live-edit Enter interception
  const closedPopup = doc.createElement("div");
  closedPopup.setAttribute("role", "listbox");
  closedPopup.setAttribute("data-state", "closed");
  doc.body.appendChild(closedPopup);
  doc.body.appendChild(mainEl);

  const sentLiveEdits = [];
  const ipc = {
    invoke: async (ch, payload) => {
      if (ch === "agy-studio:send-live-edit") {
        sentLiveEdits.push(payload);
        return { ok: true, entry: { id: "le-test-" + sentLiveEdits.length, text: payload.text, status: "pending" }, items: [] };
      }
      if (ch === "agy-studio:get-state") {
        return {
          locale: "ru",
          settings: { liveEditInline: { enabled: true, sendKey: "enter", showChatDock: true, showInChat: true }, appearance: { presetId: "claude-terminal" } },
          liveEdits: [],
          chats: {},
          inputHistory: [],
        };
      }
      if (ch === "agy-studio:get-live-edits") return { ok: true, items: [] };
      return { ok: true };
    },
    on: () => {},
    removeListener: () => {},
  };
  const themeEngine = te.createThemeEngine({ document: doc, window: win });
  const translator = createDomTranslator({ document: doc, window: win });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: ipc,
    telemetryEngine: createTelemetryEngine(),
    translator,
    themeEngine,
  });
  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 35));

    // A) Enter during generation (with div composer + aria-label Stop button + closed listbox) MUST intercept into Rudex live-edit!
    let enterPrevented = false;
    win.dispatchEvent({
      type: "keydown",
      key: "Enter",
      target: ed,
      preventDefault: () => { enterPrevented = true; },
      stopPropagation: () => {},
      stopImmediatePropagation: () => {},
    });
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(enterPrevented, true, "Enter during generation must be intercepted BEFORE Antigravity native queue");
    assert.equal(sentLiveEdits.length, 1, "Mid-turn Enter must submit Rudex live edit");
    assert.equal(sentLiveEdits[0].text, "учти правку прямо сейчас");

    // B) Clicking "Add to queue" button during generation MUST also intercept into Rudex live-edit (never rejected by /add/ filter!)
    ed.textContent = "вторая правка через кнопку";
    let clickPrevented = false;
    win.dispatchEvent({
      type: "pointerdown",
      button: 0,
      target: queueBtn,
      preventDefault: () => { clickPrevented = true; },
      stopPropagation: () => {},
      stopImmediatePropagation: () => {},
    });
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(clickPrevented, true, "Clicking 'Add to queue' during generation must be intercepted as Rudex live edit");
    assert.equal(sentLiveEdits.length, 2, "Clicking 'Add to queue' must send Rudex live edit");

    // C) Tools dock lifts cleanly ABOVE native "Сообщения в очереди" bar (top 610 => bottom >= 800 - 610 + 6 = 196px, never overlapping 610..682!)
    const dockMount = doc.getElementById("rudex-studio-host").shadowRoot.querySelector(".rx-chat-dock");
    assert.ok(dockMount && parseInt(dockMount.style.bottom, 10) >= 196, `Tools dock must lift above native queued messages bar (got bottom=${dockMount && dockMount.style.bottom})`);

    // D) Clean universal sidebar labels (no awkward «Проекты» wording in Appearance palette)
    panel.setOpen(true, { tab: "appearance", appSub: "theme" });
    await new Promise((r) => setTimeout(r, 25));
    const appHtml = doc.getElementById("rudex-studio-host").shadowRoot.querySelector(".modal-mount").innerHTML;
    assert.ok(appHtml.includes("Цвета фона, карточек, сайдбара и границ"), "Palette section title must use clean sidebar wording");
    assert.equal(appHtml.includes("«Проекты»"), false, "Appearance palette must NOT single out «Проекты»");
    const panelZone = v5Core.RUDEX_UI_ZONES.find((z) => z.id === "sidebar-panels");
    assert.equal(panelZone.nameRu, "Блоки боковой панели");
  } finally {
    panel.destroy();
    themeEngine.destroy();
    translator.destroy();
    Object.assign(globalThis, prevV5);
  }
});

test("Zero hover flicker on '+ Новый чат' & rock-solid composer drafts (no 2x Lexical duplication, no cross-chat leak, New Chat isolation)", async () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));

  // 1) Sidebar "+ Новый чат" MUST NEVER flicker orange/active on hover:bg-* classes, computed hover bg, or Radix tooltip data-state mutations
  {
    const { doc, win } = createMockDom();
    win.innerWidth = 1280;
    win.innerHeight = 800;
    let obsCb = null;
    win.MutationObserver = class MockMO {
      constructor(cb) { obsCb = cb; }
      observe() {}
      disconnect() {}
    };
    const root = doc.createElement("div");
    root.id = "root";
    doc.body.appendChild(root);
    const setRect = (el, l, t, w, h) => { el.getBoundingClientRect = () => ({ left: l, top: t, width: w, height: h, right: l + w, bottom: t + h }); };
    setRect(root, 0, 0, 1280, 800);

    const aside = doc.createElement("aside");
    aside.style.backgroundColor = "rgb(20, 20, 22)";
    setRect(aside, 0, 0, 260, 800);

    // Top nav group: "+ Новый чат" has different font-medium class + hover:bg-white/10 + computed hover bg!
    const topNav = doc.createElement("div");
    setRect(topNav, 8, 12, 244, 110);
    const newChatBtn = doc.createElement("button");
    newChatBtn.textContent = "+ Новый чат";
    newChatBtn.className = "nav-btn hover:bg-white/10 font-medium";
    newChatBtn.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
    setRect(newChatBtn, 10, 14, 240, 32);
    const inboxBtn = doc.createElement("button");
    inboxBtn.textContent = "Входящие";
    inboxBtn.className = "nav-btn hover:bg-white/10";
    inboxBtn.style.backgroundColor = "rgba(0, 0, 0, 0)";
    setRect(inboxBtn, 10, 48, 240, 32);
    const settingsBtn = doc.createElement("button");
    settingsBtn.textContent = "Настройки";
    settingsBtn.className = "nav-btn hover:bg-white/10";
    settingsBtn.style.backgroundColor = "rgba(0, 0, 0, 0)";
    setRect(settingsBtn, 10, 82, 240, 32);
    topNav.appendChild(newChatBtn);
    topNav.appendChild(inboxBtn);
    topNav.appendChild(settingsBtn);

    // Real chat list: Chat A has unprefixed bg-zinc-800, Chat B has hover:bg-white/10 (hovered!)
    const chatList = doc.createElement("div");
    setRect(chatList, 8, 140, 244, 150);
    const chatA = doc.createElement("button");
    chatA.textContent = "Рабочий чат";
    chatA.className = "chat-row hover:bg-white/10 bg-zinc-800";
    chatA.style.backgroundColor = "rgb(39, 39, 42)";
    setRect(chatA, 10, 144, 240, 32);
    const chatB = doc.createElement("button");
    chatB.textContent = "Другой чат";
    chatB.className = "chat-row hover:bg-white/10";
    chatB.style.backgroundColor = "rgba(255, 255, 255, 0.08)"; // simulated CSS :hover bg
    setRect(chatB, 10, 180, 240, 32);
    chatList.appendChild(chatA);
    chatList.appendChild(chatB);

    aside.appendChild(topNav);
    aside.appendChild(chatList);
    root.appendChild(aside);

    const eng = te.createThemeEngine({ document: doc, window: win });
    try {
      eng.apply({ presetId: "claude-terminal" });
      assert.equal(newChatBtn.getAttribute("data-rudex-sidebar-surface"), null, "'+ Новый чат' must NEVER be marked active via hover:bg-* or computed hover bg");
      assert.equal(chatA.getAttribute("data-rudex-sidebar-surface"), "active", "Real active chat with unprefixed bg-zinc-800 must stay active");
      assert.equal(chatB.getAttribute("data-rudex-sidebar-surface"), null, "Hovered inactive chat must NEVER steal active highlight");

      // Simulate Radix tooltip hover data-state="delayed-open" -> "closed" on "+ Новый чат"
      newChatBtn.setAttribute("data-state", "delayed-open");
      obsCb([{ type: "attributes", attributeName: "data-state", target: newChatBtn }]);
      assert.equal(newChatBtn.getAttribute("data-rudex-sidebar-surface"), null, "Radix tooltip delayed-open must NEVER highlight '+ Новый чат'");
      newChatBtn.setAttribute("data-state", "closed");
      obsCb([{ type: "attributes", attributeName: "data-state", target: newChatBtn }]);
      assert.equal(newChatBtn.getAttribute("data-rudex-sidebar-surface"), null);
    } finally {
      eng.destroy();
    }
  }

  // 2) Composer drafts: async Lexical paste does NOT double-insert (no 2x/8x duplication!), rapid typing before switch flushes to OLD chat (never leaks new chat DOM), and clearing text clears disk draft!
  const prevV5 = {
    rv5EscapeHtml: globalThis.rv5EscapeHtml,
    rv5BuildSmartSelector: globalThis.rv5BuildSmartSelector,
    rv5DescribeElementFriendly: globalThis.rv5DescribeElementFriendly,
    rv5FindNativeComposer: globalThis.rv5FindNativeComposer,
    rv5ReadEditableText: globalThis.rv5ReadEditableText,
    rv5ClearEditableText: globalThis.rv5ClearEditableText,
    rv5NormalizeAgentProfile: globalThis.rv5NormalizeAgentProfile,
    rv5NormalizeLimitsWidget: globalThis.rv5NormalizeLimitsWidget,
    rv5NormalizeKeybindings: globalThis.rv5NormalizeKeybindings,
    rv5NormalizeQuotaAutomation: globalThis.rv5NormalizeQuotaAutomation,
    rv5CountActiveAgentFeatures: globalThis.rv5CountActiveAgentFeatures,
    rv5SummarizeActiveToggles: globalThis.rv5SummarizeActiveToggles,
    rv5BuildChatDockHtml: globalThis.rv5BuildChatDockHtml,
    rv5RenderAgentHubTabHtml: globalThis.rv5RenderAgentHubTabHtml,
    rv5RenderWorkshopHtml: globalThis.rv5RenderWorkshopHtml,
    rv5RenderElementsTabHtml: globalThis.rv5RenderElementsTabHtml,
    rv5RenderLimitsTabHtml: globalThis.rv5RenderLimitsTabHtml,
    rv5RenderKeybindingsHtml: globalThis.rv5RenderKeybindingsHtml,
    rv5RenderLimitsWidgetHtml: globalThis.rv5RenderLimitsWidgetHtml,
    rv5RenderElementInspectorPopup: globalThis.rv5RenderElementInspectorPopup,
    rv5SyncLiveChatBubbles: globalThis.rv5SyncLiveChatBubbles,
    RUDEX_UI_ZONES: globalThis.RUDEX_UI_ZONES,
    RUDEX_AGENT_PRESETS: globalThis.RUDEX_AGENT_PRESETS,
    RUDEX_AGENT_PROFILE_DEFAULTS: globalThis.RUDEX_AGENT_PROFILE_DEFAULTS,
    RUDEX_LIMITS_DEFAULTS: globalThis.RUDEX_LIMITS_DEFAULTS,
    RUDEX_KEYBINDING_DEFS: globalThis.RUDEX_KEYBINDING_DEFS,
    RUDEX_KEYBINDINGS_DEFAULTS: globalThis.RUDEX_KEYBINDINGS_DEFAULTS,
    RUDEX_LIVE_EDIT_DEFAULTS: globalThis.RUDEX_LIVE_EDIT_DEFAULTS,
    RUDEX_QUOTA_AUTOMATION_DEFAULTS: globalThis.RUDEX_QUOTA_AUTOMATION_DEFAULTS,
    buildStudioStyles: globalThis.buildStudioStyles,
  };
  Object.assign(globalThis, v5Core, v5Ui, { buildStudioStyles });
  const { doc, win } = createMockDom();
  win.innerWidth = 1280;
  win.innerHeight = 800;
  win.location = { pathname: "/", search: "", hash: "" };
  const docEvMap = new Map();
  const origDocAdd = doc.addEventListener;
  const origDocRem = doc.removeEventListener;
  doc.addEventListener = (type, fn, cap) => {
    if (!docEvMap.has(type)) docEvMap.set(type, new Set());
    docEvMap.get(type).add(fn);
    if (origDocAdd) origDocAdd.call(doc, type, fn, cap);
  };
  doc.removeEventListener = (type, fn, cap) => {
    if (docEvMap.has(type)) docEvMap.get(type).delete(fn);
    if (origDocRem) origDocRem.call(doc, type, fn, cap);
  };
  doc.dispatchEvent = (ev) => {
    const set = docEvMap.get(ev && ev.type);
    if (set) {
      for (const fn of Array.from(set)) fn(ev);
    }
  };
  win.DataTransfer = class MockDT {
    constructor() { this._d = {}; }
    setData(k, v) { this._d[k] = v; }
    getData(k) { return this._d[k] || ""; }
  };
  win.ClipboardEvent = class MockCE {
    constructor(type, opts) { this.type = type; this.clipboardData = opts && opts.clipboardData; }
  };

  const mainEl = doc.createElement("main");
  const compDiv = doc.createElement("div");
  compDiv.setAttribute("data-rudex-theme-composer", "1");
  compDiv.getBoundingClientRect = () => ({ left: 260, top: 690, right: 1020, bottom: 770, width: 760, height: 80 });
  const ed = doc.createElement("div");
  ed.setAttribute("contenteditable", "true");
  ed.getBoundingClientRect = () => ({ left: 274, top: 700, right: 960, bottom: 724, width: 686, height: 24 });
  // Simulate async Lexical paste commit (15ms delay!)
  ed.addEventListener("paste", (ev) => {
    const pasted = ev && ev.clipboardData ? ev.clipboardData.getData("text/plain") : "";
    if (pasted) {
      setTimeout(() => { ed.textContent = (ed.textContent || "") + pasted; }, 15);
    }
  });
  compDiv.appendChild(ed);
  mainEl.appendChild(compDiv);
  doc.body.appendChild(mainEl);

  const chatAId = "11111111-2222-3333-4444-555555555555";
  const chatBId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const draftDisk = {
    [chatAId]: { chatKey: chatAId, title: "Chat A", text: "здарова", attachments: [], updatedAt: Date.now() },
  };
  let insertFocusedCalls = 0;
  const ipc = {
    send: (ch, payload) => {
      if (ch === "agy-studio:save-composer-draft-sync" && payload && payload.chatKey) {
        if (String(payload.text || "").trim()) {
          draftDisk[payload.chatKey] = { chatKey: payload.chatKey, text: payload.text, attachments: payload.attachments || [] };
        } else {
          delete draftDisk[payload.chatKey];
        }
      }
    },
    invoke: async (ch, payload) => {
      if (ch === "agy-studio:get-state") {
        return { locale: "ru", settings: { composerDraftsEnabled: true, appearance: { presetId: "claude-terminal" } }, liveEdits: [], chats: {}, inputHistory: [] };
      }
      if (ch === "agy-studio:get-composer-draft") {
        const d = draftDisk[payload && payload.chatKey] || null;
        return { ok: true, draft: d };
      }
      if (ch === "agy-studio:save-composer-draft") {
        if (payload && payload.chatKey) {
          if (String(payload.text || "").trim()) {
            draftDisk[payload.chatKey] = { chatKey: payload.chatKey, text: payload.text, attachments: payload.attachments || [] };
          } else {
            delete draftDisk[payload.chatKey];
          }
        }
        return { ok: true, draft: draftDisk[payload && payload.chatKey] || null };
      }
      if (ch === "agy-studio:insert-text-into-focused") {
        insertFocusedCalls += 1;
        ed.textContent = (ed.textContent || "") + String((payload && payload.text) || "");
        return { ok: true };
      }
      if (ch === "agy-studio:activate-chat") return { ok: true, chat: { title: "" } };
      if (ch === "agy-studio:get-live-edits") return { ok: true, items: [] };
      return { ok: true };
    },
    on: () => {},
    removeListener: () => {},
  };

  const themeEngine = te.createThemeEngine({ document: doc, window: win });
  const translator = createDomTranslator({ document: doc, window: win });
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: ipc,
    telemetryEngine: createTelemetryEngine(),
    translator,
    themeEngine,
  });
  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 40));

    // A) Type in "__new__" and immediately switch to Chat A (where Chat A DOM resets to empty) -> "__new__" draft MUST be preserved on disk!
    ed.textContent = "черновик нового чата";
    doc.dispatchEvent({ type: "input", target: ed });
    // Antigravity switches URL to Chat A and resets composer DOM BEFORE pollStream runs
    win.location.pathname = "/chat/" + chatAId;
    ed.textContent = "";
    panel.pollStream();
    await new Promise((r) => setTimeout(r, 280));

    assert.equal(draftDisk.__new__ && draftDisk.__new__.text, "черновик нового чата", "Rapidly typed New Chat draft must flush to __new__ before switching chats");
    // B) Async Lexical paste restored "здарова" ONCE (ZERO double-insert via insert-text-into-focused!)
    assert.equal(ed.textContent, "здарова", "Restored draft must appear EXACTLY once (no 'здароваздарова' 2x duplication!)");
    assert.equal(insertFocusedCalls, 0, "Async Lexical paste must NOT trigger duplicate webContents.insertText fallback");

    // Wait for isRestoringDraft release (450ms) then clear text in Chat A and immediately switch to Chat B (whose DOM already shows 'чужой текст B')
    await new Promise((r) => setTimeout(r, 480));
    ed.textContent = "";
    doc.dispatchEvent({ type: "input", target: ed });
    win.location.pathname = "/chat/" + chatBId;
    ed.textContent = "чужой текст B";
    panel.pollStream();
    await new Promise((r) => setTimeout(r, 40));

    assert.equal(draftDisk[chatAId], undefined, "Clearing Chat A text and switching away must delete Chat A draft (no cross-chat leak of 'чужой текст B' and no zombie draft!)");
  } finally {
    panel.destroy();
    themeEngine.destroy();
    translator.destroy();
    Object.assign(globalThis, prevV5);
  }
});

test("Live bugs regression: Claude Code wallpaper toolbar containing block, transparent resize handle & titlebar overlay, sticky folder flatten, 320x36 panoramic full-res annotator, early live-edit capture & live limits sync", async () => {
  const { buildThemeCss, createThemeEngine } = require(path.join(RES_DIR, "theme-engine.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const i18nMain = require(path.join(SCRIPTS_DIR, "i18n-main.js"));

  // 1) Claude Code + Wallpaper: toolbar MUST NOT set backdrop-filter (which traps position:absolute send/cancel button on top of Turbo!)
  const wpCcCss = buildThemeCss({
    presetId: "claude-terminal",
    wallpaper: { type: "image", mediaUrl: "agy-media://local/bg.png" },
    uiStyle: { preset: "claude-code", composer: "claude-code", chat: "claude-code", modelSelector: "claude-code" },
  });
  const tbIdx = wpCcCss.indexOf('[data-rudex-comp-toolbar="1"]:not(#rudex-studio-host)');
  assert.ok(tbIdx !== -1, "Must emit Claude Code toolbar CSS block");
  const tbBlock = wpCcCss.slice(tbIdx, wpCcCss.indexOf("}", tbIdx) + 1);
  assert.ok(tbBlock.includes("backdrop-filter: none !important"), `Toolbar must force backdrop-filter: none so send/stop button never overlaps Turbo; got:\n${tbBlock}`);
  assert.ok(!/backdrop-filter:\s*blur\(/.test(tbBlock), "Toolbar block must NOT contain backdrop-filter: blur(...)");
  assert.ok(wpCcCss.includes("backdrop-filter: blur("), "Input row / top row must still preserve glass blur under wallpaper");
  assert.ok(wpCcCss.includes('[data-testid="input-cancel-button"]'), "Stop/cancel button must be styled in Claude Code send slot");

  // 2) Sidebar resize handle strip & rounded sidebar surfaces
  assert.ok(
    wpCcCss.includes(':not([data-panel-resize-handle-id])') && wpCcCss.includes('[data-panel-resize-handle-id], [data-resize-handle]'),
    "Sidebar resize handle [role=separator] must be excluded from border-fill and forced transparent (no thick vertical strip with dots)"
  );
  assert.ok(
    wpCcCss.includes('[data-rudex-sidebar-surface="item"]') && /\[data-rudex-sidebar-surface="item"\][\s\S]{0,220}border-radius:\s*\d+px\s*!important/.test(wpCcCss),
    "Sidebar items must have explicit border-radius"
  );

  // 3) Sticky folder header ("antigravity-ru") flattens to transparent "panel", NOT sharp rectangular "item"
  const { doc: sDoc, win: sWin } = createMockDom();
  const sRoot = sDoc.createElement("div");
  sRoot.id = "root";
  const sAside = sDoc.createElement("aside");
  sAside.getBoundingClientRect = () => ({ left: 0, top: 0, width: 240, height: 800, right: 240, bottom: 800 });
  const navGroup = sDoc.createElement("div");
  const btnAuto = sDoc.createElement("button");
  btnAuto.textContent = "Автоматизации";
  btnAuto.className = "row hover:bg-white/10";
  const btnCust = sDoc.createElement("button");
  btnCust.textContent = "Кастомизация";
  btnCust.className = "row bg-white/10";
  navGroup.appendChild(btnAuto);
  navGroup.appendChild(btnCust);
  const folderRow = sDoc.createElement("button");
  folderRow.textContent = "antigravity-ru";
  folderRow.setAttribute("aria-expanded", "true");
  folderRow.className = "sticky-folder";
  folderRow.getBoundingClientRect = () => ({ left: 0, top: 120, width: 240, height: 28, right: 240, bottom: 148 });
  sAside.appendChild(navGroup);
  sAside.appendChild(folderRow);
  // Populate >200 sidebar buttons BEFORE header in DOM order to verify Pass D1 NEVER starves top-bar right buttons!
  for (let bi = 0; bi < 210; bi += 1) {
    const sb = sDoc.createElement("button");
    sb.textContent = `Chat ${bi}`;
    sb.getBoundingClientRect = () => ({ left: 8, top: 160 + bi * 28, width: 220, height: 24, right: 228, bottom: 184 + bi * 28 });
    sAside.appendChild(sb);
  }
  // Second header bar ("antigravity-ru / Chat Title" dark #111110 box + right pane toggle [◫] dark #111114 square)
  const hdr2 = sDoc.createElement("div");
  hdr2.getBoundingClientRect = () => ({ left: 240, top: 32, width: 1200, height: 34, right: 1440, bottom: 66 });
  const hdrTitleBox = sDoc.createElement("div");
  hdrTitleBox.textContent = "antigravity-ru / Исправление Навигации";
  hdrTitleBox.getBoundingClientRect = () => ({ left: 256, top: 36, width: 320, height: 26, right: 576, bottom: 62 });
  const rightPaneBtn = sDoc.createElement("button");
  rightPaneBtn.setAttribute("aria-label", "Переключить правую панель");
  rightPaneBtn.getBoundingClientRect = () => ({ left: 1404, top: 36, width: 28, height: 26, right: 1432, bottom: 62 });
  hdr2.appendChild(hdrTitleBox);
  hdr2.appendChild(rightPaneBtn);
  // Narrow 28px x 800px vertical timeline rail inside [data-testid="conversation-view"] with navigation dot
  const convView = sDoc.createElement("div");
  convView.setAttribute("data-testid", "conversation-view");
  convView.getBoundingClientRect = () => ({ left: 240, top: 66, width: 1200, height: 834, right: 1440, bottom: 900 });
  const railDiv = sDoc.createElement("div");
  railDiv.getBoundingClientRect = () => ({ left: 244, top: 70, width: 28, height: 800, right: 272, bottom: 870 });
  const navDot = sDoc.createElement("span");
  navDot.getBoundingClientRect = () => ({ left: 255, top: 180, width: 6, height: 6, right: 261, bottom: 186 });
  railDiv.appendChild(navDot);
  convView.appendChild(railDiv);
  sRoot.appendChild(sAside);
  sRoot.appendChild(hdr2);
  sRoot.appendChild(convView);
  sDoc.body.appendChild(sRoot);
  sWin.innerWidth = 1440;
  sWin.innerHeight = 900;
  sWin.getComputedStyle = (el) => {
    if (el === folderRow) return { backgroundColor: "rgb(17, 17, 16)", position: "sticky", backgroundImage: "none" };
    if (el === sAside) return { backgroundColor: "rgb(17, 17, 16)", position: "relative", backgroundImage: "none" };
    if (el === hdr2) return { backgroundColor: "rgb(20, 20, 19)", position: "relative", backgroundImage: "none" };
    if (el === hdrTitleBox) return { backgroundColor: "rgb(17, 17, 16)", position: "static", backgroundImage: "none" };
    if (el === rightPaneBtn) return { backgroundColor: "rgb(17, 17, 20)", position: "static", backgroundImage: "none" };
    if (el === railDiv) return { backgroundColor: "rgba(17, 17, 16, 0.72)", backdropFilter: "blur(8px)", boxShadow: "none", position: "relative", backgroundImage: "none" };
    if (el === navDot) return { backgroundColor: "rgb(217, 119, 87)", position: "static", backgroundImage: "none" };
    return { backgroundColor: "rgba(0, 0, 0, 0)", position: "static", backgroundImage: "none" };
  };
  const sTe = createThemeEngine({ document: sDoc, window: sWin });
  sTe.apply({ presetId: "claude-terminal" });
  assert.equal(folderRow.getAttribute("data-rudex-sidebar-surface"), "panel", "Sticky/expandable folder header 'antigravity-ru' must flatten to transparent 'panel', never opaque 'item'");
  assert.notEqual(btnCust.getAttribute("data-rudex-sidebar-surface"), "active", "Static nav button 'Кастомизация' must never be highlighted as active chat");
  assert.equal(hdrTitleBox.getAttribute("data-rudex-header-surface"), "clean", "Dark #111110 breadcrumb title box over #141413 header must be cleaned to transparent");
  assert.equal(rightPaneBtn.getAttribute("data-rudex-header-btn-fix"), "1", "Dark #111114 right-pane toggle button [◫] after >200 sidebar buttons must be cleaned to transparent (no black square)");
  assert.equal(railDiv.getAttribute("data-rudex-bg-fade"), "1", "28px vertical timeline rail inside conversation-view must auto-clear murky background/blur");
  assert.notEqual(navDot.getAttribute("data-rudex-bg-fade"), "1", "Navigation dots inside cleared timeline rail must keep 100% contrast");
  sTe.destroy();

  // 3b) Element Inspector overrides: bgOpacity=0 strips bg+blur+shadow WITHOUT dimming child dots; opacity=0 supported end-to-end
  const zeroBgNorm = normalizeAppearance({
    presetId: "claude-terminal",
    elementOverrides: [
      { id: "ov-rail-0", selector: '[data-testid="conversation-view"] > div', enabled: true, styles: { bgOpacity: 0 } },
      { id: "ov-glass-0", selector: ".glass-strip", enabled: true, styles: { bgColor: "#262624", bgOpacity: 0 } },
    ],
  });
  const zeroBgCss = teBuildElementOverridesCss(zeroBgNorm.elementOverrides, false, zeroBgNorm);
  assert.ok(zeroBgCss.includes("background: transparent !important;"), "bgOpacity: 0 (with or without bgColor) must force background: transparent");
  assert.ok(zeroBgCss.includes("backdrop-filter: none !important;"), "bgOpacity: 0 must strip backdrop-filter glass residue");
  assert.ok(zeroBgCss.includes("box-shadow: none !important;"), "bgOpacity: 0 must strip box-shadow residue");
  assert.equal(/\bopacity:\s*/.test(zeroBgCss), false, "bgOpacity: 0 must NOT emit CSS opacity so child dots/icons keep 100% contrast");

  const zeroOpNorm = normalizeAppearance({ elementOverrides: [{ id: "ov-op0", selector: ".ghost-el", enabled: true, styles: { opacity: 0 } }] });
  assert.equal(zeroOpNorm.elementOverrides[0].styles.opacity, 0, "normalizeAppearance must preserve opacity: 0 (not clamp to 5/10)");
  const zeroOpSan = i18nMain.sanitizeAppearance({ elementOverrides: [{ id: "ov-op0", selector: ".ghost-el", enabled: true, styles: { opacity: 0 } }] });
  assert.equal(zeroOpSan.elementOverrides[0].styles.opacity, 0, "i18nMain.sanitizeAppearance must preserve opacity: 0");
  const zeroOpCss = teBuildElementOverridesCss(zeroOpNorm.elementOverrides, false, {});
  assert.ok(zeroOpCss.includes("opacity: 0.00 !important;"), "opacity: 0 must emit opacity: 0.00 !important");

  const inspHtml0 = v5Ui.rv5BuildElementInspectorHtml(
    { selector: '[data-testid="conversation-view"] > div', name: "Timeline Rail", computed: { bgOpacity: 80, opacity: 100 } },
    { elementOverrides: [{ id: "ov-rail-0", selector: '[data-testid="conversation-view"] > div', enabled: true, styles: { bgOpacity: 0 } }] },
    [], [], true, {}
  );
  assert.ok(inspHtml0.includes('data-insp-badge="bgOpacity">0%<'), "Inspector must display 0% bgOpacity even when bgColor is unset");
  assert.ok(inspHtml0.includes('rx-insp-slider-item is-custom" data-insp-wrap="bgOpacity"'), "Inspector must mark bgOpacity=0 slider as custom");
  assert.ok(/min="0"[^>]*data-insp-range="opacity"|data-insp-range="opacity"[^>]*min="0"/.test(inspHtml0), "Inspector element opacity slider must allow min=0");

  // 4) Limits widget stays clean without manual refresh button (auto-syncs live)
  const limCardHtml = v5Core.rv5BuildLimitsWidgetHtml({ enabled: true, layout: "card" }, { families: { gemini: { fiveHourRem: 80, weeklyRem: 90 } } }, "Gemini", true, false);
  assert.equal(limCardHtml.includes('data-action="sync-limits-now"'), false, "Card limits widget must stay clean and auto-sync without manual refresh button");

  // 5) Studio panel integration: early capture BEFORE UI mount + collapsed 0x0 menu guard + transparent titleBarOverlay under wallpaper + panoramic 320x36 full-res annotator + Radix popover quota scrape
  const { doc, win: baseWin } = createMockDom();
  const winListeners = {};
  const docListeners = {};
  const origDocAdd = doc.addEventListener.bind(doc);
  doc.addEventListener = (type, fn, cap) => {
    if (!docListeners[type]) docListeners[type] = [];
    docListeners[type].push({ fn, cap: Boolean(cap) });
    return origDocAdd(type, fn, cap);
  };
  const titleBarCalls = [];
  const sentLiveEdits = [];
  const syncedQuotaPayloads = [];
  const openedAnnotatorUrls = [];
  const FULL_PANO_URL = "data:image/png;base64,FULL_RES_1920x210_PNG_PAYLOAD";
  const TINY_THUMB_URL = "data:image/png;base64,TINY_320x36";

  class FakeImage {
    set src(v) {
      this._src = v;
      if (v === FULL_PANO_URL) {
        this.naturalWidth = 1920;
        this.naturalHeight = 210;
      } else {
        this.naturalWidth = 320;
        this.naturalHeight = 36;
      }
      if (typeof this.onload === "function") this.onload();
    }
    get src() { return this._src || ""; }
  }
  const win = Object.assign(baseWin, {
    innerWidth: 1440,
    innerHeight: 900,
    location: { pathname: "/chat/3f504d90-06d7-45f1-aa66-8de9701d076d", search: "", hash: "", protocol: "http:" },
    Image: FakeImage,
    electronNativeAPI: { setTitleBarOverlay: (o) => titleBarCalls.push(o) },
    getComputedStyle: () => ({ opacity: "1", pointerEvents: "auto", display: "block", visibility: "visible", backgroundColor: "rgba(0,0,0,0)" }),
    addEventListener(type, fn, cap) {
      if (!winListeners[type]) winListeners[type] = [];
      winListeners[type].push({ fn, cap: Boolean(cap) });
    },
    removeEventListener() {},
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval() {},
  });

  // Start with EMPTY doc (UI not ready yet!) to prove early capture registers IMMEDIATELY in init() BEFORE React/Lexical mounts!
  const prevV5 = {};
  for (const k of Object.keys(v5Core)) { prevV5[k] = globalThis[k]; globalThis[k] = v5Core[k]; }
  for (const k of Object.keys(v5Ui)) { prevV5[k] = globalThis[k]; globalThis[k] = v5Ui[k]; }
  const prevAnnot = globalThis.createScreenshotAnnotator;
  globalThis.createScreenshotAnnotator = () => ({
    open: (opts) => { openedAnnotatorUrls.push(opts && opts.dataUrl); },
    close: () => {},
    isOpen: () => false,
    handleKeydown: () => false,
    handlePaste: () => {},
  });

  const ipc = {
    invoke: async (ch, payload) => {
      if (ch === "agy-studio:get-state") {
        return {
          locale: "ru",
          settings: {
            panelEnabled: true,
            liveEditInline: { enabled: true, sendKey: "enter", urgentIntercept: false },
            limitsWidget: { enabled: true, layout: "card" },
            appearance: { presetId: "claude-terminal", wallpaper: { type: "image", mediaUrl: "agy-media://local/rem.jpg" } },
          },
          chat: { personaEnabled: false },
          quotaSummary: { families: { gemini: { fiveHourRem: 70, weeklyRem: 80 } } },
        };
      }
      if (ch === "agy-studio:send-live-edit") {
        sentLiveEdits.push(payload);
        return { ok: true, entry: { id: "le-1", text: payload.text, status: "pending" }, allItems: [] };
      }
      if (ch === "agy-studio:read-clipboard-image") {
        return { ok: true, dataUrl: FULL_PANO_URL };
      }
      if (ch === "agy-studio:sync-quota-snapshot") {
        syncedQuotaPayloads.push(payload);
        return { ok: true, summary: { families: { gemini: { fiveHourRem: 100, weeklyRem: 97 } } } };
      }
      if (ch === "agy-studio:get-quota-summary") {
        return { families: { gemini: { fiveHourRem: 100, weeklyRem: 97 } } };
      }
      return { ok: true };
    },
  };

  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: ipc,
    telemetryEngine: createTelemetryEngine(),
    translator: createDomTranslator({ document: doc, window: win }),
    themeEngine: createThemeEngine({ document: doc, window: win }),
    buildStyles: buildStudioStyles,
  });

  try {
    panel.init();
    // BEFORE React/Antigravity UI even exists, window capture listeners MUST already be registered!
    assert.ok((winListeners.keydown || []).some((x) => x.cap), "Early window keydown capture must register immediately in init() BEFORE React/Lexical mounts");
    assert.ok((winListeners.paste || []).some((x) => x.cap), "Early window paste capture must register immediately in init()");

    // Now build Antigravity DOM and trigger mount
    const main = doc.createElement("main");
    const hdr = doc.createElement("header");
    const hdrMenu = doc.createElement("div");
    hdrMenu.setAttribute("role", "menu");
    hdrMenu.getBoundingClientRect = () => ({ left: 10, top: 0, width: 200, height: 32, right: 210, bottom: 32 });
    hdr.appendChild(hdrMenu);
    doc.body.appendChild(hdr);

    // Collapsed 0x0 menu WITH childElementCount > 0 (previously broke live-edit Enter interception!)
    const collapsedMenu = doc.createElement("div");
    collapsedMenu.setAttribute("role", "listbox");
    collapsedMenu.appendChild(doc.createElement("div"));
    collapsedMenu.getBoundingClientRect = () => ({ left: 300, top: 500, width: 0, height: 0, right: 300, bottom: 500 });
    doc.body.appendChild(collapsedMenu);

    const comp = doc.createElement("form");
    comp.setAttribute("data-rudex-theme-composer", "1");
    comp.getBoundingClientRect = () => ({ left: 300, top: 700, width: 700, height: 90, right: 1000, bottom: 790 });
    const ed = doc.createElement("div");
    ed.setAttribute("contenteditable", "true");
    ed.getBoundingClientRect = () => ({ left: 310, top: 710, width: 660, height: 40, right: 970, bottom: 750 });
    ed.textContent = "правка во время работы";
    const stopBtn = doc.createElement("button");
    stopBtn.setAttribute("data-testid", "input-cancel-button");
    const modelBtn = doc.createElement("button");
    modelBtn.setAttribute("data-testid", "model-selector-trigger");
    modelBtn.textContent = "Gemini 4 Neon";
    const thumbWrap = doc.createElement("div");
    const thumbImg = doc.createElement("img");
    thumbImg.setAttribute("src", TINY_THUMB_URL);
    thumbImg.naturalWidth = 320;
    thumbImg.naturalHeight = 36;
    thumbImg.width = 320;
    thumbImg.height = 36;
    thumbWrap.appendChild(thumbImg);
    comp.appendChild(thumbWrap);
    comp.appendChild(ed);
    comp.appendChild(modelBtn);
    comp.appendChild(stopBtn);
    main.appendChild(comp);
    doc.body.appendChild(main);

    // Wait for early panel or mount readyPanel now that Antigravity UI is ready
    const readyPanel = createStudioPanel({
      document: doc,
      window: win,
      ipcRenderer: ipc,
      telemetryEngine: createTelemetryEngine(),
      translator: createDomTranslator({ document: doc, window: win }),
      themeEngine: createThemeEngine({ document: doc, window: win }),
      buildStyles: buildStudioStyles,
    });
    try {
      readyPanel.init();
      await new Promise((r) => setTimeout(r, 80));

      // A) Wallpaper titleBarOverlay MUST be transparent (#00000000), never opaque #111110 black box!
      assert.ok(titleBarCalls.some((c) => c && c.color === "#00000000"), `Expected transparent #00000000 titleBarOverlay under wallpaper, got: ${JSON.stringify(titleBarCalls)}`);
      assert.equal(i18nMain.sanitizeAppearance({ presetId: "claude-terminal", wallpaper: { type: "image", mediaUrl: "agy-media://local/rem.jpg" } }).wallpaper.type, "image");

      // B) Enter during generation MUST intercept live-edit even with collapsed 0x0 listbox (childElementCount=1) & header menu present!
      let prevented = false;
      const enterEv = {
        type: "keydown",
        key: "Enter",
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        isComposing: false,
        target: ed,
        preventDefault() { prevented = true; },
        stopPropagation() {},
        stopImmediatePropagation() {},
      };
      for (const h of winListeners.keydown || []) h.fn(enterEv);
      await new Promise((r) => setTimeout(r, 40));
      assert.equal(prevented, true, "Enter during agent generation MUST call preventDefault and NOT fall into native Antigravity queue!");
      assert.equal(sentLiveEdits.length, 1, "Live-edit IPC must fire immediately on Enter despite collapsed 0x0 listbox & header menu");
      assert.equal(sentLiveEdits[0].text, "правка во время работы");

      // C) Panoramic 1920x210 screenshot pasted -> tiny 320x36 thumbnail (aspect diff 0.25 > 0.14) MUST still open FULL-RES in annotator!
      const pasteEv = {
        type: "paste",
        target: ed,
        clipboardData: { items: [] }, // Simulate Electron native paste fallback via IPC
      };
      for (const h of winListeners.paste || []) h.fn(pasteEv);
      await new Promise((r) => setTimeout(r, 40));
      // Trigger image edit button injection & click
      readyPanel.pollStream();
      const editBtn = thumbWrap.querySelector("[data-rudex-img-edit-btn]");
      assert.ok(editBtn, "Pencil edit trigger must be injected onto composer thumbnail");
      editBtn.dispatchEvent({ type: "click", target: editBtn, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
      await new Promise((r) => setTimeout(r, 40));
      assert.equal(openedAnnotatorUrls[openedAnnotatorUrls.length - 1], FULL_PANO_URL, "Panoramic 320x36 thumbnail MUST open full-res 1920x210 PNG in annotator, never downscaled thumbnail!");

      // D) Radix popper model menu (without [role=dialog] or quota-progress-circle) MUST sync real-time quota!
      await new Promise((r) => setTimeout(r, 620));
      const popper = doc.createElement("div");
      popper.setAttribute("data-radix-popper-content-wrapper", "");
      popper.textContent = "Модели Gemini\nОстаток недельного лимита 97% · сброс через 6 д 1 ч\nЛимит (5ч) 100%";
      doc.body.appendChild(popper);
      readyPanel.pollStream();
      await new Promise((r) => setTimeout(r, 40));
      assert.ok(syncedQuotaPayloads.length >= 1 && syncedQuotaPayloads[0].gemini && syncedQuotaPayloads[0].gemini.weeklyRem === 97, "Radix popper model menu must sync live 97% quota immediately");

      // E) Element Picker precision: normalizes SVG <path> -> <svg>, reads full elementsFromPoint stack behind large overlay, & supports mouse-wheel parent stepping!
      const pickWrap = doc.createElement("div");
      pickWrap.className = "overlay-wrap";
      pickWrap.getBoundingClientRect = () => ({ left: 200, top: 100, width: 600, height: 400, right: 800, bottom: 500 });
      const pickBtn = doc.createElement("button");
      pickBtn.setAttribute("data-testid", "compact-dot-btn");
      pickBtn.getBoundingClientRect = () => ({ left: 400, top: 300, width: 24, height: 24, right: 424, bottom: 324 });
      const pickSvg = doc.createElement("svg");
      pickSvg.getBoundingClientRect = () => ({ left: 404, top: 304, width: 16, height: 16, right: 420, bottom: 320 });
      const pickPath = doc.createElement("path");
      pickPath.getBoundingClientRect = () => ({ left: 406, top: 306, width: 12, height: 12, right: 418, bottom: 318 });
      pickSvg.appendChild(pickPath);
      pickBtn.appendChild(pickSvg);
      pickWrap.appendChild(pickBtn);
      main.appendChild(pickWrap);
      doc.elementsFromPoint = () => [pickWrap, pickPath, pickSvg, pickBtn, main];

      const hostShadow = doc.getElementById("rudex-studio-host").shadowRoot;
      const studioRoot = hostShadow.querySelector(".studio-root");
      const pickerMount = hostShadow.querySelector(".rx-picker-mount");
      assert.ok(pickerMount, "Expected .rx-picker-mount in Studio shadow root");
      const startBtn = doc.createElement("button");
      startBtn.setAttribute("data-action", "start-element-picker");
      studioRoot.appendChild(startBtn);
      studioRoot.dispatchEvent({ type: "click", target: startBtn });
      startBtn.remove();

      const mmList = docListeners.mousemove || [];
      assert.ok(mmList.length > 0, "Element picker must attach mousemove listener");
      mmList[mmList.length - 1].fn({ target: pickWrap, clientX: 412, clientY: 312 });
      await new Promise((r) => setTimeout(r, 35));
      const hlAfterMove = pickerMount.querySelector('[data-role="pickerHighlight"]');
      const hasSvgWidth = Boolean((hlAfterMove && hlAfterMove.style.width === "16px") || pickerMount.innerHTML.includes("width:16px"));
      assert.ok(hasSvgWidth, `Expected sniper picker to resolve <path> behind large overlay to 16px <svg>, got tail=${pickerMount.innerHTML.slice(-260)}`);

      const whList = docListeners.wheel || [];
      assert.ok(whList.length > 0, "Element picker must attach wheel listener for parent/child stepping");
      whList[whList.length - 1].fn({ target: pickWrap, deltaY: -100, preventDefault() {}, stopPropagation() {} });
      const hlAfterWheel = pickerMount.querySelector('[data-role="pickerHighlight"]');
      const hasBtnWidth = Boolean((hlAfterWheel && hlAfterWheel.style.width === "24px") || pickerMount.innerHTML.includes("width:24px"));
      assert.ok(hasBtnWidth, `Expected wheel-up to step from <svg> to parent 24px <button>, got tail=${pickerMount.innerHTML.slice(-260)}`);

      const clList = docListeners.click || [];
      clList[clList.length - 1].fn({ target: pickWrap, clientX: 412, clientY: 312, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
      assert.ok(pickerMount.innerHTML.includes('compact-dot-btn'), "Clicking after wheel-up must select the stepped parent compact-dot-btn in Element Inspector");
    } finally {
      readyPanel.destroy();
    }
  } finally {
    panel.destroy();
    globalThis.createScreenshotAnnotator = prevAnnot;
    Object.assign(globalThis, prevV5);
  }
});

test("Model notice/deprecation & work-step RU translations, independent workLogInRussian toggle, sleek timeline dot rail, and visual-fingerprint screenshot annotator matching", async () => {
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const i18nMain = require(path.join(SCRIPTS_DIR, "i18n-main.js"));

  // 1) Dictionary & dynamic rules for model selector badges/tooltips + work-step activity summaries
  assert.equal(dictionary["Leaving Soon"], "Скоро уберут");
  assert.equal(dictionary["Notice"], "Важно");
  assert.equal(
    applyDynamicRules("Use Hydrogen for better quality with lower quota usage. Leaving on Nov 30."),
    "Используйте Hydrogen — выше качество при меньшем расходе квоты. Будет убрана 30 нояб."
  );
  assert.equal(
    applyDynamicRules("Explored files, ran commands, edited files"),
    "Изучены файлы, выполнены команды, изменены файлы"
  );
  assert.equal(
    applyDynamicRules("Explored file, ran command, edited file"),
    "Изучен файл, выполнена команда, изменён файл"
  );
  assert.equal(
    applyDynamicRules("Worked for 19m · Explored files, edited 2 files"),
    "Работал 19 мин · Изучены файлы, изменено 2 файла"
  );

  // 2) Sleek timeline dot rail tagging & CSS rules (works even when rail bg is transparent!)
  const { doc: tDoc, win: tWin } = createMockDom();
  const tRoot = tDoc.createElement("div");
  tRoot.id = "root";
  const tConv = tDoc.createElement("div");
  tConv.setAttribute("data-testid", "conversation-view");
  tConv.getBoundingClientRect = () => ({ left: 240, top: 60, width: 1200, height: 840, right: 1440, bottom: 900 });
  const tRail = tDoc.createElement("div");
  tRail.getBoundingClientRect = () => ({ left: 242, top: 70, width: 28, height: 780, right: 270, bottom: 850 });
  for (let d = 0; d < 3; d += 1) {
    const db = tDoc.createElement("button");
    const dotSpan = tDoc.createElement("span");
    db.appendChild(dotSpan);
    tRail.appendChild(db);
  }
  const widePill = tDoc.createElement("div");
  widePill.getBoundingClientRect = () => ({ left: 243, top: 410, width: 26, height: 12, right: 269, bottom: 422 });
  tRail.appendChild(widePill);
  tConv.appendChild(tRail);
  tRoot.appendChild(tConv);
  tDoc.body.appendChild(tRoot);
  tWin.innerWidth = 1440;
  tWin.innerHeight = 900;
  tWin.getComputedStyle = () => ({ backgroundColor: "rgba(0, 0, 0, 0)", position: "relative", backgroundImage: "none" });
  const tTe = createThemeEngine({ document: tDoc, window: tWin });
  tTe.apply({ presetId: "claude-terminal" });
  assert.equal(tRail.getAttribute("data-rudex-timeline-rail"), "1", "Vertical timeline rail with dot buttons must be tagged data-rudex-timeline-rail=1 even with transparent bg");
  assert.equal(widePill.getAttribute("data-rudex-timeline-pill"), "1", "Wide horizontal capsule pill inside timeline rail must be tagged data-rudex-timeline-pill=1");
  const railCss = buildThemeCss({ presetId: "claude-terminal" });
  assert.ok(railCss.includes('html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-timeline-rail="1"] *'), "High-specificity (3,1,1) timeline rail CSS must strip ALL capsule borders, rings, and shadows");
  assert.ok(railCss.includes(':not([data-rudex-timeline-rail="1"] *)'), "Theme bg-primary/border-primary accent rules must exclude timeline rail children");
  tTe.destroy();

  // 3) Independent workLogInRussian setting (opt-in default OFF, translates Worked-for notes without translating Thinking when thinkingInRussian=false)
  assert.equal(i18nMain.sanitizeStudioSettings({}).workLogInRussian, false, "workLogInRussian must default to OFF (opt-in)");
  assert.equal(i18nMain.sanitizeStudioSettings({ workLogInRussian: true }).workLogInRussian, true);

  const { doc, win: baseWin } = createMockDom();
  const winListeners = {};
  const openedAnnotatorUrls = [];
  const translatedBatches = [];
  let savedSettings = { thinkingInRussian: false, workLogInRussian: true, liveEditInline: { enabled: true } };

  const FULL_A = "data:image/png;base64,SCREENSHOT_ALPHA_RED_1920x1080_PAYLOAD_AAAA";
  const FULL_B = "data:image/png;base64,SCREENSHOT_BETA_BLUE_1920x1080_PAYLOAD_BBBB";
  const THUMB_A = "data:image/png;base64,THUMB_ALPHA_RED_320x180_PAYLOAD_AAAA";
  const THUMB_B = "data:image/png;base64,THUMB_BETA_BLUE_320x180_PAYLOAD_BBBB";
  const makeRgbBuf = (r, g, b) => {
    const arr = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < arr.length; i += 4) { arr[i] = r; arr[i + 1] = g; arr[i + 2] = b; arr[i + 3] = 255; }
    return arr;
  };
  const origCreateEl = doc.createElement.bind(doc);
  doc.createElement = (tag) => {
    const el = origCreateEl(tag);
    if (String(tag).toLowerCase() === "canvas") {
      let lastSrc = "";
      el.getContext = () => ({
        drawImage(srcObj) { lastSrc = String((srcObj && (srcObj.src || (srcObj.getAttribute && srcObj.getAttribute("src")))) || ""); },
        getImageData() {
          if (lastSrc.includes("ALPHA_RED")) return { data: makeRgbBuf(220, 30, 30) };
          if (lastSrc.includes("BETA_BLUE")) return { data: makeRgbBuf(25, 60, 230) };
          return { data: makeRgbBuf(128, 128, 128) };
        },
      });
    }
    return el;
  };
  class FakeImg2 {
    set src(v) {
      this._src = v;
      this.naturalWidth = v.includes("1920x1080") ? 1920 : 320;
      this.naturalHeight = v.includes("1920x1080") ? 1080 : 180;
      if (typeof this.onload === "function") this.onload();
    }
    get src() { return this._src || ""; }
  }
  const win = Object.assign(baseWin, {
    innerWidth: 1440,
    innerHeight: 900,
    Image: FakeImg2,
    getComputedStyle: () => ({ opacity: "1", pointerEvents: "auto", display: "block", visibility: "visible", backgroundColor: "rgba(0,0,0,0)" }),
    addEventListener(type, fn, cap) {
      if (!winListeners[type]) winListeners[type] = [];
      winListeners[type].push({ fn, cap: Boolean(cap) });
    },
    removeEventListener() {},
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval() {},
  });

  // Build DOM with expanded "Работал 19 мин" work-log containing a progress note + nested expanded "Думал 12 с" thinking block + 2 composer screenshots
  const main = doc.createElement("main");
  const workWrap = doc.createElement("div");
  const workBtn = doc.createElement("button");
  workBtn.setAttribute("aria-expanded", "true");
  workBtn.textContent = "Работал 19 мин";
  const workPanel = doc.createElement("div");
  const statusP = doc.createElement("p");
  const statusTn = doc.createTextNode("Testing and reinstall task is running; waiting for the result.");
  statusP.appendChild(statusTn);
  const nestedThinkWrap = doc.createElement("div");
  const nestedThinkBtn = doc.createElement("button");
  nestedThinkBtn.setAttribute("data-testid", "thinking-collapsible-trigger");
  nestedThinkBtn.setAttribute("aria-expanded", "true");
  nestedThinkBtn.textContent = "Думал 12 с";
  const nestedThinkPanel = doc.createElement("div");
  const thinkP = doc.createElement("p");
  const thinkTn = doc.createTextNode("Internal chain of thought should stay untouched when thinkingInRussian is OFF.");
  thinkP.appendChild(thinkTn);
  nestedThinkPanel.appendChild(thinkP);
  nestedThinkWrap.appendChild(nestedThinkBtn);
  nestedThinkWrap.appendChild(nestedThinkPanel);
  workPanel.appendChild(statusP);
  workPanel.appendChild(nestedThinkWrap);
  workWrap.appendChild(workBtn);
  workWrap.appendChild(workPanel);
  main.appendChild(workWrap);

  const comp = doc.createElement("div");
  comp.setAttribute("data-testid", "composer");
  const ed = doc.createElement("div");
  ed.setAttribute("contenteditable", "true");
  const wrapA = doc.createElement("div");
  const imgA = doc.createElement("img");
  imgA.setAttribute("src", THUMB_A);
  imgA.naturalWidth = 320;
  imgA.naturalHeight = 180;
  imgA.getBoundingClientRect = () => ({ left: 100, top: 700, width: 48, height: 28, right: 148, bottom: 728 });
  wrapA.appendChild(imgA);
  const wrapB = doc.createElement("div");
  const imgB = doc.createElement("img");
  imgB.setAttribute("src", THUMB_B);
  imgB.naturalWidth = 320;
  imgB.naturalHeight = 180;
  imgB.getBoundingClientRect = () => ({ left: 160, top: 700, width: 48, height: 28, right: 208, bottom: 728 });
  wrapB.appendChild(imgB);
  comp.appendChild(wrapA);
  comp.appendChild(wrapB);
  comp.appendChild(ed);
  main.appendChild(comp);
  doc.body.appendChild(main);

  const prevV5 = {};
  for (const k of Object.keys(v5Core)) { prevV5[k] = globalThis[k]; globalThis[k] = v5Core[k]; }
  for (const k of Object.keys(v5Ui)) { prevV5[k] = globalThis[k]; globalThis[k] = v5Ui[k]; }
  const prevAnnot = globalThis.createScreenshotAnnotator;
  globalThis.createScreenshotAnnotator = () => ({
    open: (opts) => { openedAnnotatorUrls.push(opts && opts.dataUrl); },
    close: () => {},
    isOpen: () => false,
  });

  let clipCall = 0;
  const ipc = {
    invoke: async (ch, payload) => {
      if (ch === "agy-studio:get-state") return { locale: "ru", settings: Object.assign({}, savedSettings) };
      if (ch === "agy-studio:save-settings") {
        savedSettings = Object.assign({}, savedSettings, payload || {});
        return { ok: true, locale: "ru", settings: Object.assign({}, savedSettings) };
      }
      if (ch === "agy-studio:translate-thinking-batch") {
        const texts = (payload && payload.texts) || [];
        translatedBatches.push(texts.slice());
        const out = {};
        for (const t of texts) out[t] = `RU:${t}`;
        return { ok: true, translations: out };
      }
      if (ch === "agy-studio:read-clipboard-image") {
        clipCall += 1;
        return { ok: true, dataUrl: clipCall === 1 ? FULL_A : FULL_B };
      }
      if (ch === "agy-studio:get-quota-summary") return { ok: true, families: {} };
      if (ch === "agy-studio:list-live-edits") return { ok: true, liveEdits: [] };
      return { ok: true };
    },
    on: () => {},
    removeListener: () => {},
  };

  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: ipc,
    telemetryEngine: createTelemetryEngine(),
    translator: createDomTranslator({ document: doc, window: win }),
    themeEngine: createThemeEngine({ document: doc, window: win }),
    buildStyles: buildStudioStyles,
  });
  try {
    panel.init();
    await new Promise((r) => setTimeout(r, 80));

    // A) Settings tab renders independent toggle-worklog-ru & shows thinkingTranslatorUrl when only workLogInRussian=true
    panel.setOpen(true, { tab: "settings" });
    const shadow = doc.getElementById("rudex-studio-host").shadowRoot;
    const modalHtml = shadow.querySelector(".modal-mount").innerHTML;
    assert.ok(modalHtml.includes('data-action="toggle-worklog-ru"'), "Settings must render separate workLogInRussian toggle");
    assert.ok(modalHtml.includes('data-sys-field="thinkingTranslatorUrl"'), "Local translator URL must appear when workLogInRussian is ON");

    // B) workLogInRussian translates work-log progress note WITHOUT translating nested thinking block!
    panel.pollStream();
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(statusTn.nodeValue, "RU:Testing and reinstall task is running; waiting for the result.", "workLogInRussian must translate intermediate progress notes inside Worked-for block");
    assert.equal(thinkTn.nodeValue, "Internal chain of thought should stay untouched when thinkingInRussian is OFF.", "Nested thinking block must stay untouched when thinkingInRussian is OFF");

    // Turn workLogInRussian OFF -> restores original English text cleanly
    panel.applyRemoteState({ locale: "ru", settings: { thinkingInRussian: false, workLogInRussian: false } }, false);
    assert.equal(statusTn.nodeValue, "Testing and reinstall task is running; waiting for the result.", "Disabling workLogInRussian must restore original work-log text");

    // C) Paste TWO identical-aspect 1920x1080 screenshots -> clicking Edit on Thumbnail #1 MUST open FULL_A (NOT FULL_B!)
    for (let p = 0; p < 2; p += 1) {
      for (const h of winListeners.paste || []) h.fn({ type: "paste", target: ed, clipboardData: { items: [] } });
      await new Promise((r) => setTimeout(r, 35));
    }
    panel.pollStream();
    const editBtnA = wrapA.querySelector('[data-rudex-img-edit-btn="thumb"]');
    const editBtnB = wrapB.querySelector('[data-rudex-img-edit-btn="thumb"]');
    assert.ok(editBtnA && editBtnB, "Both thumbnails must have pencil edit buttons");

    editBtnA.dispatchEvent({ type: "click", target: editBtnA, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(openedAnnotatorUrls[openedAnnotatorUrls.length - 1], FULL_A, "Clicking Edit on Screenshot #1 (same 16:9 aspect as #2) MUST open FULL_A, NEVER Screenshot #2!");

    editBtnB.dispatchEvent({ type: "click", target: editBtnB, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(openedAnnotatorUrls[openedAnnotatorUrls.length - 1], FULL_B, "Clicking Edit on Screenshot #2 MUST open FULL_B!");

    // D) If React replaces <img> inside wrapA without recreating editBtnA, clicking editBtnA must resolve the LIVE <img>!
    wrapA.removeChild(imgA);
    const swappedImg = doc.createElement("img");
    swappedImg.setAttribute("src", THUMB_B);
    swappedImg.naturalWidth = 320;
    swappedImg.naturalHeight = 180;
    wrapA.appendChild(swappedImg);
    editBtnA.dispatchEvent({ type: "click", target: editBtnA, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(openedAnnotatorUrls[openedAnnotatorUrls.length - 1], FULL_B, "Reused wrapper's pencil button must read live inner <img>, never stale detached closure");
  } finally {
    panel.destroy();
    globalThis.createScreenshotAnnotator = prevAnnot;
    Object.assign(globalThis, prevV5);
  }
});

test("0-frame startup theme boot (zero stock FOUC), full-sentence word-span thinking translation, and high-specificity wide header breadcrumb box cleanup", async () => {
  const { buildPreloadSnippet } = require(path.join(SCRIPTS_DIR, "install.js"));
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));

  // 1) Preload bundle fetches synchronous boot state and calls bootEarlyTheme() BEFORE DOMContentLoaded
  const preloadCode = buildPreloadSnippet();
  assert.ok(preloadCode.includes('sendSync("agy-studio:get-boot-state-sync")'), "Preload must fetch boot appearance synchronously via IPC sendSync");
  assert.ok(preloadCode.includes("_studioPanel.bootEarlyTheme()"), "Preload must invoke bootEarlyTheme() synchronously at t=0ms before DOMContentLoaded");

  // 2) bootEarlyTheme() injects <style id="rudex-studio-theme"> & zoom synchronously while readyState==="loading" and body===null!
  const { doc: bDoc, win: bWin } = createMockDom();
  const savedBody = bDoc.body;
  bDoc.readyState = "loading";
  bDoc.body = null;
  let zoomSet = null;
  const bootPanel = createStudioPanel({
    document: bDoc,
    window: bWin,
    webFrame: { setZoomFactor: (z) => { zoomSet = z; } },
    ipcRenderer: { invoke: async () => ({ ok: true }), on: () => {}, removeListener: () => {} },
    telemetryEngine: createTelemetryEngine(),
    translator: createDomTranslator({ document: bDoc, window: bWin }),
    themeEngine: createThemeEngine({ document: bDoc, window: bWin }),
    buildStyles: buildStudioStyles,
    initialBoot: {
      appearance: { presetId: "claude-terminal", uiStyle: { preset: "claude-code", composer: "claude-code", chat: "claude-code", modelSelector: "claude-code" } },
      studioUi: { appScale: 110 },
      greeting: { enabled: true, title: "Привет, Иван" },
    },
  });
  try {
    bootPanel.bootEarlyTheme();
    assert.equal(zoomSet, 1.1, "bootEarlyTheme must apply saved appScale synchronously at t=0ms");
    const earlyStyle = bDoc.getElementById("rudex-studio-theme");
    assert.ok(earlyStyle && earlyStyle.textContent.includes("#141413"), "bootEarlyTheme must inject full theme CSS into DOM before document.body or React even exists");
    // Restore body and verify wide >240px dark header breadcrumb <button> gets cleaned & (3,1,1) CSS rules beat bg-black/bg-card
    bDoc.readyState = "interactive";
    bDoc.body = savedBody;
    const wideHdrBtn = bDoc.createElement("button");
    wideHdrBtn.textContent = "antigravity-ru / Исправление Навигации И Интерфейса Проекта";
    wideHdrBtn.getBoundingClientRect = () => ({ left: 260, top: 36, width: 420, height: 26, right: 680, bottom: 62 });
    bDoc.body.appendChild(wideHdrBtn);
    bWin.innerWidth = 1440;
    bWin.innerHeight = 900;
    bWin.getComputedStyle = (el) => el === wideHdrBtn
      ? { backgroundColor: "rgb(17, 17, 16)", position: "static", backgroundImage: "none" }
      : { backgroundColor: "rgba(0, 0, 0, 0)", position: "static", backgroundImage: "none" };
    bootPanel.bootEarlyTheme();
    assert.equal(wideHdrBtn.getAttribute("data-rudex-header-btn-fix"), "1", "Wide (>240px) dark breadcrumb <button> in header row must be cleaned to transparent");
    assert.ok(earlyStyle.textContent.includes('html:not(#rudex-studio-host):not(#rudex-bg):not(#rudex-studio-theme) [data-rudex-header-surface="clean"]'), "Header surface cleanup must have (3,1,1) specificity to beat bg-black/bg-card rules");
    assert.ok(earlyStyle.textContent.includes(':where([data-rudex-bg-header="1"], header:not(#rudex-studio-host *)) :where(div, nav, section, h1, h2, h3, p, span)'), "Pure CSS (3,1,1) rule must clear ALL opaque inner header wrappers (including oklch/Tailwind v4 breadcrumb boxes)");

    // 2b) Tailwind v4 oklch() dark header box must ALSO be detected by Pass D1 parseRgbaColor!
    const oklchTitleDiv = bDoc.createElement("div");
    oklchTitleDiv.textContent = "antigravity-ru / OKLCH Box";
    oklchTitleDiv.getBoundingClientRect = () => ({ left: 260, top: 36, width: 320, height: 26, right: 580, bottom: 62 });
    bDoc.body.appendChild(oklchTitleDiv);
    bWin.getComputedStyle = (el) => {
      if (el === wideHdrBtn) return { backgroundColor: "rgb(17, 17, 16)", position: "static", backgroundImage: "none" };
      if (el === oklchTitleDiv) return { backgroundColor: "oklch(0.145 0 0)", position: "static", backgroundImage: "none" };
      return { backgroundColor: "rgba(0, 0, 0, 0)", position: "static", backgroundImage: "none" };
    };
    bootPanel.bootEarlyTheme();
    assert.equal(oklchTitleDiv.getAttribute("data-rudex-header-surface"), "clean", "Pass D1 must parse Tailwind v4 oklch() dark header boxes and mark them clean");

    // 2c) Element Inspector exact selector MUST verify uniqueness when TWO [data-rudex-bg-header="1"] bars exist
    // (never return '[data-rudex-bg-header="1"] > div:nth-of-type(1)' which hides text in BOTH header bars!)
    const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
    const uRoot = bDoc.createElement("div");
    uRoot.id = "root";
    const hdrBar1 = bDoc.createElement("div");
    hdrBar1.setAttribute("data-rudex-bg-header", "1");
    const hdr1Child = bDoc.createElement("div");
    hdr1Child.textContent = "Antigravity Рабочая область";
    hdrBar1.appendChild(hdr1Child);
    const hdrBar2 = bDoc.createElement("div");
    hdrBar2.setAttribute("data-rudex-bg-header", "1");
    const hdr2Child = bDoc.createElement("div");
    hdr2Child.textContent = "antigravity-ru / Chat Title";
    hdrBar2.appendChild(hdr2Child);
    uRoot.appendChild(hdrBar1);
    uRoot.appendChild(hdrBar2);
    bDoc.body.appendChild(uRoot);
    const exactHdr2Sel = v5Core.rv5BuildSmartSelector(hdr2Child, "exact", bDoc);
    assert.notEqual(exactHdr2Sel, '[data-rudex-bg-header="1"] > div:nth-of-type(1)', "Exact selector must NEVER stop at non-unique [data-rudex-bg-header=1]");
    assert.equal(exactHdr2Sel, "#root > div:nth-of-type(2) > div:nth-of-type(1)", "Exact selector must walk past duplicate [data-rudex-bg-header=1] to unique #root with exact :nth-of-type(2)");
    const exactHdr1Sel = v5Core.rv5BuildSmartSelector(hdr1Child, "exact", bDoc);
    assert.equal(exactHdr1Sel, "#root > div:nth-of-type(1) > div:nth-of-type(1)", "First header bar child must get distinct unique selector from second header bar");
  } finally {
    bootPanel.destroy();
  }

  // 3) Word-by-word streaming <span>s inside thinking block MUST group into ONE full sentence (translating "of", "by", "at", "if" in context!)
  const { doc: wDoc, win: wWin } = createMockDom();
  const thinkWrap = wDoc.createElement("div");
  const thinkBtn = wDoc.createElement("button");
  thinkBtn.setAttribute("data-testid", "thinking-collapsible-trigger");
  thinkBtn.setAttribute("aria-expanded", "true");
  thinkBtn.textContent = "Думает 9 с";
  const thinkBody = wDoc.createElement("div");
  const para = wDoc.createElement("p");
  const wordParts = ["Brief", " ", "flash", " ", "of", " ", "unstyled", " ", "elements", " ", "by", " ", "default."];
  const wordNodes = [];
  for (const w of wordParts) {
    const sp = wDoc.createElement("span");
    const tn = wDoc.createTextNode(w);
    sp.appendChild(tn);
    para.appendChild(sp);
    wordNodes.push(tn);
  }
  thinkBody.appendChild(para);
  thinkWrap.appendChild(thinkBtn);
  thinkWrap.appendChild(thinkBody);
  wDoc.body.appendChild(thinkWrap);

  const sentBatches = [];
  const wPanel = createStudioPanel({
    document: wDoc,
    window: wWin,
    ipcRenderer: {
      invoke: async (ch, payload) => {
        if (ch === "agy-studio:get-state") return { locale: "ru", settings: { thinkingInRussian: true } };
        if (ch === "agy-studio:translate-thinking-batch") {
          sentBatches.push(payload.texts.slice());
          const translations = {};
          for (const t of payload.texts) {
            if (t === "Brief flash of unstyled elements by default.") {
              translations[t] = "Кратковременное мерцание нестилизованных элементов по умолчанию.";
            }
          }
          return { ok: true, translations };
        }
        return { ok: true };
      },
      on: () => {},
      removeListener: () => {},
    },
    telemetryEngine: createTelemetryEngine(),
    translator: createDomTranslator({ document: wDoc, window: wWin }),
    themeEngine: createThemeEngine({ document: wDoc, window: wWin }),
    buildStyles: buildStudioStyles,
  });
  try {
    wPanel.init();
    await new Promise((r) => setTimeout(r, 60));
    assert.ok(sentBatches.length >= 1, "Word-span thinking paragraph must be translated");
    assert.deepEqual(sentBatches[0], ["Brief flash of unstyled elements by default."], "Adjacent word <span>s must be grouped into ONE full sentence (never translated word-by-word skipping 'of'/'by'!)");
    assert.equal(wordNodes[0].nodeValue, "Кратковременное мерцание нестилизованных элементов по умолчанию.");
    assert.equal(wordNodes[4].nodeValue, "", "Follower word spans must be cleared while translated");
    // Turn thinkingInRussian OFF -> EVERY individual word span restores losslessly!
    wPanel.applyRemoteState({ locale: "ru", settings: { thinkingInRussian: false } }, false);
    assert.deepEqual(wordNodes.map((n) => n.nodeValue), wordParts, "Disabling thinkingInRussian must losslessly restore every original word <span>");
  } finally {
    wPanel.destroy();
  }
});

test("Element Picker v5.0.5: zero neighbor CSS leaks, marquee region multi-window sync, group chip removal, and D-pad + alignment + mouse drag positioning", async () => {
  const te = require(path.join(RES_DIR, "theme-engine.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));

  // 1) Sanitizer preserves long multi-element group selectors (up to 1600 chars), scope="group", ±800px offsets, and align
  const longSel = Array.from({ length: 12 }, (_, i) => `#app-shell > div:nth-of-type(${i + 1}) > section:nth-of-type(2) > div:nth-of-type(3)`).join(", ");
  assert.ok(longSel.length > 500, "Test selector must exceed old 260-char truncation cap");
  const sanTe = te.teNormalizeElementOverrides([
    {
      id: "grp-1",
      name: "Группа (2)",
      selector: longSel,
      scope: "group",
      enabled: true,
      styles: { offsetX: -640, offsetY: 520, align: "right", width: 520, opacity: 80 },
    },
  ]);
  assert.equal(sanTe.length, 1);
  assert.equal(sanTe[0].selector, longSel, "Long group selector must NOT be truncated at 260 chars");
  assert.equal(sanTe[0].scope, "group", "scope='group' must be preserved");
  assert.equal(sanTe[0].styles.offsetX, -640, "offsetX up to ±800 must be preserved");
  assert.equal(sanTe[0].styles.offsetY, 520, "offsetY up to ±800 must be preserved");
  assert.equal(sanTe[0].styles.align, "right", "align must be preserved");

  // Also verify backend sanitizer in i18n-main.js mirrors exact same limits
  const Module = require("module");
  const origLoad = Module._load;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-picker-ov-"));
  try {
    Module._load = function (req) {
      if (req === "electron") {
        return {
          app: { getPath: () => tmpDir, isReady: () => true, on: () => {}, whenReady: () => Promise.resolve() },
          ipcMain: { handle: () => {}, removeHandler: () => {} },
          webContents: { getAllWebContents: () => [] },
          BrowserWindow: { getAllWindows: () => [] },
          dialog: {}, shell: {}, protocol: {}, clipboard: {}, nativeImage: {},
        };
      }
      return origLoad.apply(this, arguments);
    };
    const mainPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainPath)];
    const i18nMain = require(mainPath);
    const sanMain = i18nMain.sanitizeAppearance({
      elementOverrides: [
        { id: "grp-1", name: "Group", selector: longSel, scope: "group", enabled: true, styles: { offsetX: 750, offsetY: -450, align: "center" } },
      ],
    });
    assert.equal(sanMain.elementOverrides[0].selector, longSel, "i18n-main must preserve full multi-element selector");
    assert.equal(sanMain.elementOverrides[0].scope, "group");
    assert.equal(sanMain.elementOverrides[0].styles.offsetX, 750);
    assert.equal(sanMain.elementOverrides[0].styles.offsetY, -450);
    assert.equal(sanMain.elementOverrides[0].styles.align, "center");
  } finally {
    Module._load = origLoad;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 2) CSS generator leak fixes: width>=420 on non-zone element MUST NOT auto-inject margin-inline:auto; align & inline translate emit properly
  const leakCss = te.buildThemeCss({
    presetId: "original",
    elementOverrides: [
      { id: "w1", selector: "#side-panel", scope: "exact", enabled: true, styles: { width: 500 } },
      { id: "a1", selector: "#right-box", scope: "exact", enabled: true, styles: { align: "right", offsetX: 40, offsetY: -20 } },
      { id: "sp1", selector: "#hdr > span", scope: "exact", enabled: true, styles: { offsetX: 12, offsetY: 8 } },
    ],
  });
  const sideRule = leakCss.slice(leakCss.indexOf("#side-panel"), leakCss.indexOf("}", leakCss.indexOf("#side-panel")) + 1);
  assert.ok(sideRule.includes("width: 500px !important;"), "Width override must apply");
  assert.ok(!sideRule.includes("margin-inline: auto"), "Non-zone width >= 420 must NOT inject margin-inline: auto (which shifted neighboring flex siblings!)");
  const rightRule = leakCss.slice(leakCss.indexOf("#right-box"), leakCss.indexOf("}", leakCss.indexOf("#right-box")) + 1);
  assert.ok(rightRule.includes("margin-left: auto !important;") && rightRule.includes("align-self: flex-end !important;"), "align='right' must emit right-alignment CSS");
  assert.ok(rightRule.includes("translate: 40px -20px !important;"), "offsetX/offsetY must emit CSS translate");
  assert.ok(!rightRule.includes("display: inline-block"), "Block selector #right-box must NOT emit display: inline-block");
  const spanRule = leakCss.slice(leakCss.indexOf("#hdr > span"), leakCss.indexOf("}", leakCss.indexOf("#hdr > span")) + 1);
  assert.ok(spanRule.includes("display: inline-block;") && spanRule.includes("translate: 12px 8px !important;"), "Inline leaf tag <span> with offset must emit display: inline-block so translate visibly moves it");

  // 3) Live Marquee Region Select over 2 windows synchronously + D-pad + Align + Drag-Move + Group Chip Removal
  const { doc, win } = createMockDom();
  win.innerWidth = 1440;
  win.innerHeight = 900;
  const docListeners = new Map();
  const origDocAdd = doc.addEventListener.bind(doc);
  const origDocRem = doc.removeEventListener.bind(doc);
  doc.addEventListener = (type, fn, cap) => {
    if (!docListeners.has(type)) docListeners.set(type, new Set());
    docListeners.get(type).add(fn);
    origDocAdd(type, fn, cap);
  };
  doc.removeEventListener = (type, fn, cap) => {
    if (docListeners.has(type)) docListeners.get(type).delete(fn);
    origDocRem(type, fn, cap);
  };
  const emitDoc = (type, evt) => {
    const fns = Array.from(docListeners.get(type) || []);
    for (const fn of fns) fn(Object.assign({ type, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} }, evt));
  };

  // Workspace with 2 side-by-side windows inside transparent layout wrapper + 1 unrelated 3rd window outside marquee
  const layoutWrap = doc.createElement("div");
  layoutWrap.getBoundingClientRect = () => ({ left: 20, top: 40, right: 1200, bottom: 700, width: 1180, height: 660 });
  const winLeft = doc.createElement("aside");
  winLeft.id = "left-window";
  winLeft.textContent = "Левое окно";
  winLeft.getBoundingClientRect = () => ({ left: 20, top: 40, right: 320, bottom: 540, width: 300, height: 500 });
  const winRight = doc.createElement("section");
  winRight.id = "right-window";
  winRight.textContent = "Правое окно";
  winRight.getBoundingClientRect = () => ({ left: 340, top: 40, right: 760, bottom: 540, width: 420, height: 500 });
  const winOutside = doc.createElement("section");
  winOutside.id = "third-window";
  winOutside.textContent = "Третье окно";
  winOutside.getBoundingClientRect = () => ({ left: 900, top: 40, right: 1200, bottom: 540, width: 300, height: 500 });
  layoutWrap.appendChild(winLeft);
  layoutWrap.appendChild(winRight);
  layoutWrap.appendChild(winOutside);
  doc.body.appendChild(layoutWrap);

  const savedPatches = [];
  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      invoke: async (ch, payload) => {
        if (ch === "agy-studio:save-settings") savedPatches.push(payload);
        return { ok: true };
      },
      on: () => {},
      removeListener: () => {},
    },
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
    themeEngine: te.createThemeEngine({ document: doc, window: win }),
  });

  try {
    panel.init();
    const host = doc.getElementById("rudex-studio-host");
    const root = host.shadowRoot ? host.shadowRoot.querySelector(".studio-root") : host.querySelector(".studio-root");
    const pickerMount = root.querySelector(".rx-picker-mount");
    const clickAction = (action, attrs) => {
      const btn = doc.createElement("button");
      btn.setAttribute("data-action", action);
      for (const [k, v] of Object.entries(attrs || {})) btn.setAttribute(k, String(v));
      root.appendChild(btn);
      const fns = Array.from((root.listeners && root.listeners.get("click")) || []);
      for (const fn of fns) fn({ type: "click", target: btn, preventDefault() {}, stopPropagation() {} });
      root.removeChild(btn);
    };

    // Start region picker and drag marquee across Left + Right windows (excluding 3rd window at x=900..1200!)
    clickAction("start-region-picker");
    assert.ok(pickerMount.innerHTML.includes("rx-picker-mode-pills"), "Picker banner must expose Single / Region / Group mode pills");
    emitDoc("pointerdown", { button: 0, clientX: 10, clientY: 30, target: layoutWrap });
    emitDoc("mousemove", { clientX: 780, clientY: 560, target: layoutWrap });
    assert.ok(pickerMount.innerHTML.includes('data-role="pickerMarquee"'), "Dragging must render live marquee rectangle");
    emitDoc("pointerup", { button: 0, clientX: 780, clientY: 560, target: layoutWrap });

    // Inspector must open in synchronized group mode targeting BOTH #left-window and #right-window, NEVER #third-window!
    assert.ok(pickerMount.innerHTML.includes('data-role="inspectorGroupBar"'), "Marquee over 2 windows must open Group Inspector bar");
    assert.ok(pickerMount.innerHTML.includes("Синхронно: 2"), "Match badge must display 'Синхронно: 2'");
    assert.ok(pickerMount.innerHTML.includes("#left-window, #right-window"), "Combined selector must contain both selected windows");
    assert.ok(!pickerMount.innerHTML.includes("#third-window"), "Unselected 3rd window outside marquee must NEVER be included");

    // Change D-pad step to 16px, nudge Right (+16) and Down (+16), set align="center"
    clickAction("inspector-set-nudge-step", { "data-val": "16" });
    clickAction("inspector-nudge-offset", { "data-axis": "offsetX", "data-delta": "16" });
    clickAction("inspector-nudge-offset", { "data-axis": "offsetY", "data-delta": "16" });
    clickAction("inspector-set-align", { "data-val": "center" });

    let themeStyle = doc.getElementById("rudex-studio-theme");
    assert.ok(themeStyle && themeStyle.textContent.includes("#left-window"), "Synchronized CSS must target #left-window");
    assert.ok(themeStyle.textContent.includes("#right-window"), "Synchronized CSS must target #right-window");
    assert.ok(themeStyle.textContent.includes("translate: 16px 16px !important;"), "D-pad nudge must emit translate: 16px 16px for both windows");
    assert.ok(themeStyle.textContent.includes("margin-inline: auto !important;"), "Align center must apply to group");
    assert.ok(!themeStyle.textContent.includes("#third-window"), "3rd window must remain completely untouched");

    // Live mouse drag-to-move mode on page (+120px X, -60px Y) -> offsetX=136, offsetY=-44; Escape exits drag-move without closing Inspector
    clickAction("inspector-toggle-drag-move");
    assert.ok(pickerMount.innerHTML.includes("Перетаскивание активно"), "Drag-move toggle must activate live mouse dragging state");
    emitDoc("pointerdown", { button: 0, clientX: 200, clientY: 200, target: winLeft });
    emitDoc("mousemove", { clientX: 320, clientY: 140, target: winLeft });
    emitDoc("pointerup", { button: 0, clientX: 320, clientY: 140, target: winLeft });
    themeStyle = doc.getElementById("rudex-studio-theme");
    assert.ok(themeStyle.textContent.includes("translate: 136px -44px !important;"), "Live mouse drag must update offsetX/offsetY smoothly to 136px, -44px");
    emitDoc("keydown", { key: "Escape" });
    assert.ok(pickerMount.innerHTML.includes('data-role="elementInspectorCard"'), "First Escape must stop drag-move while keeping Inspector open");
    assert.ok(!pickerMount.innerHTML.includes("Перетаскивание активно"), "Drag-move must be deactivated after Escape");

    // Removing 2nd chip (#right-window) narrows the live override to #left-window ONLY!
    clickAction("inspector-remove-group-target", { "data-idx": "1" });
    themeStyle = doc.getElementById("rudex-studio-theme");
    assert.ok(themeStyle.textContent.includes("#left-window"), "Remaining #left-window must keep override");
    assert.ok(!themeStyle.textContent.includes("#right-window"), "Removed #right-window must immediately disappear from live CSS override");
    assert.ok(!pickerMount.innerHTML.includes('data-role="inspectorGroupBar"'), "Downgrading to 1 target must exit group chip bar cleanly");
  } finally {
    panel.destroy();
  }
});

test("Restart-proof composer drafts & exact real-time Antigravity RPC quota sync (zero fake fast-burn)", async () => {
  const vm = require("vm");
  const optMod = require(path.join(RES_DIR, "rudex-optimizer.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));

  // 1) Pure RPC quota extractor handles official Connect-RPC model configs + dual buckets + ISO resetTime
  const nowMs = Date.UTC(2026, 10, 27, 14, 0, 0);
  const rpcPayload = {
    type: "data",
    payload: {
      userStatus: {
        cascadeModelConfigData: {
          clientModelConfigs: [
            {
              label: "Gemini 4 Neon",
              quotaInfo: {
                remainingFraction: 0.74,
                resetTime: new Date(nowMs + 3 * 3600000 + 15 * 60000).toISOString(),
              },
            },
            {
              label: "Claude Opus 5.5",
              quotaInfo: {
                remainingFraction: 0.91,
                resetTime: new Date(nowMs + 4 * 3600000).toISOString(),
              },
            },
          ],
        },
        quotaPools: [
          { family: "gemini", windowType: "WEEKLY", remainingPercentage: 82, resetTime: new Date(nowMs + 5 * 86400000 + 20 * 3600000).toISOString() },
          { family: "claude", windowType: "WEEKLY", remainingPercentage: 100 },
        ],
      },
    },
  };
  const extracted = optMod.extractQuotaFromRpcPayload(rpcPayload, nowMs, "ru");
  assert.ok(extracted && extracted.gemini && extracted.claudeGpt, "RPC extractor must parse both Gemini and Claude/GPT families");
  assert.equal(extracted.gemini.fiveHourRem, 74, "Gemini 5h exact % from remainingFraction");
  assert.equal(extracted.gemini.weeklyRem, 82, "Gemini weekly exact % from quotaPools");
  assert.equal(extracted.gemini.fiveHourReset, "3 ч 15 мин");
  assert.equal(extracted.gemini.weeklyReset, "5 д 20 ч");
  assert.equal(extracted.claudeGpt.fiveHourRem, 91, "Claude/GPT 5h exact % from remainingFraction");
  assert.equal(extracted.claudeGpt.weeklyRem, 100);

  // Main-world injected script compiles cleanly and includes passive WS + fetch quota observers
  const mwSrc = optMod.buildMainWorldVoicePatchScript({ locale: "ru", voiceEnabled: false });
  new vm.Script(mwSrc, { filename: "rudex-mainworld-quota-test.js" });
  assert.ok(mwSrc.includes("observeQuotaJsonText") && mwSrc.includes('postToPreload("quota-rpc"'), "Main-world script must passively observe official quota frames even when voice is disabled");

  // 2) Backend i18n-main.js: auto-heals poisoned 32k 5h rate, honors live RPC exact numbers (zero fake burn), and honors exactOnly toggle
  const Module = require("module");
  const origLoad = Module._load;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudex-exact-quota-"));
  const ipcHandlers = new Map();
  const fakeElectron = {
    app: { getPath: () => tmpDir, isReady: () => true, on: () => {}, whenReady: () => Promise.resolve() },
    ipcMain: {
      handle: (ch, fn) => ipcHandlers.set(ch, fn),
      on: (ch, fn) => ipcHandlers.set(ch, fn),
      removeHandler: () => {},
    },
    webContents: { getAllWebContents: () => [] },
    BrowserWindow: { getAllWindows: () => [] },
    dialog: {}, shell: {}, protocol: {}, clipboard: {}, nativeImage: {},
  };
  try {
    Module._load = function (req) {
      if (req === "electron") return fakeElectron;
      return origLoad.apply(this, arguments);
    };
    const mainPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainPath)];
    const i18nMain = require(mainPath);
    i18nMain.registerIpcHandlers && i18nMain.registerIpcHandlers();
    if (typeof i18nMain.registerI18nIpc === "function") i18nMain.registerI18nIpc();

    // Auto-heal poisoned tokensPer1Pct5h = 32943 when weekly rate is 428413
    const healed = i18nMain.saveQuotaStore({
      version: 1,
      resetAt: 0,
      families: {
        gemini: {
          weeklyRem: 80,
          fiveHourRem: 32,
          weeklyReset: "5 дней 23 часа",
          fiveHourReset: "3 часа 11 минут",
          updatedAt: nowMs,
          calibrated: true,
          tokensPer1Pct5h: 32943,
          tokensPer1PctWeekly: 428413,
        },
        claudeGpt: { weeklyRem: 100, fiveHourRem: 100, updatedAt: nowMs, calibrated: true },
      },
    });
    assert.ok(healed.families.gemini.tokensPer1Pct5h >= 100000, `Poisoned 32,943 5h rate must auto-heal to >=100k, got ${healed.families.gemini.tokensPer1Pct5h}`);

    // Official RPC snapshot sets lastRpcSyncAt -> buildQuotaSummary displays EXACT official % with ZERO fake subtraction!
    const syncFn = ipcHandlers.get("agy-studio:sync-quota-snapshot");
    assert.ok(typeof syncFn === "function", "sync-quota-snapshot handler must be registered");
    const rpcSyncRes = syncFn(null, {
      gemini: { fiveHourRem: 68, weeklyRem: 84, fiveHourReset: "3 ч 0 мин", weeklyReset: "5 д 10 ч" },
      claudeGpt: { fiveHourRem: 95, weeklyRem: 100 },
      source: "official-rpc",
    });
    assert.ok(rpcSyncRes && rpcSyncRes.ok && rpcSyncRes.summary);
    const chatUuid = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
    const heavyDisk = new Map([
      [chatUuid, { chatKey: chatUuid, titleGuess: "Active", lastModel: "Gemini 4 Neon", lastTs: Date.now() + 5000, steps: [{ ts: Date.now() + 5000, units: 900000, family: "gemini" }] }],
    ]);
    const exactSum = i18nMain.buildQuotaSummary(chatUuid, true, { nowMs: Date.now() + 60000, diskByChat: heavyDisk });
    assert.equal(exactSum.families.gemini.fiveHourRem, 68, "With live official-rpc sync active, 5h % must stay exact (68%) with ZERO fake fast-burn");
    assert.equal(exactSum.families.gemini.fiveHourEstimated, false, "Live official-rpc synced quota must NOT show ~estimated tilde");
    assert.equal(exactSum.families.gemini.liveRpcSynced, true);

    // Strict real-only by default (no toggle needed!): even with lastRpcSyncAt=0 and massive transcript steps, official % stays untouched with zero ~ tilde
    i18nMain.saveQuotaStore({
      version: 1,
      resetAt: 0,
      families: {
        gemini: { weeklyRem: 80, fiveHourRem: 55, updatedAt: nowMs, lastRpcSyncAt: 0, calibrated: true, tokensPer1Pct5h: 90000, tokensPer1PctWeekly: 400000 },
        claudeGpt: { weeklyRem: 100, fiveHourRem: 100, updatedAt: nowMs, lastRpcSyncAt: 0 },
      },
    });
    const strictRealSum = i18nMain.buildQuotaSummary(chatUuid, true, { nowMs: nowMs + 60000, diskByChat: heavyDisk });
    assert.equal(strictRealSum.families.gemini.fiveHourRem, 55, "Strict real-only mode must ALWAYS show official 55% with zero guesses");
    assert.equal(strictRealSum.families.gemini.fiveHourEstimated, false);
    assert.equal(strictRealSum.families.gemini.weeklyRem, 80);
    assert.equal(strictRealSum.families.gemini.weeklyEstimated, false);
    const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
    const limHtml = v5Core.rv5BuildLimitsWidgetHtml({ enabled: true, layout: "card" }, strictRealSum, "Gemini 4 Neon", true, false);
    assert.ok(!limHtml.includes("~55%") && !limHtml.includes("~80%") && limHtml.includes("55%") && limHtml.includes("80%"), "Limits widget must NEVER render ~ tilde guesses");
  } finally {
    Module._load = origLoad;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 3) Restart-proof composer draft: beforeunload with unmounted composer MUST NOT wipe disk draft; cold restart with temp chat->UUID migration & React clear re-hydrates draft!
  const { doc, win } = createMockDom();
  const winListeners = new Map();
  const origWinAdd = win.addEventListener.bind(win);
  win.addEventListener = (type, fn, cap) => {
    if (!winListeners.has(type)) winListeners.set(type, new Set());
    winListeners.get(type).add(fn);
    origWinAdd(type, fn, cap);
  };
  const emitWin = (type, evt) => {
    for (const fn of Array.from(winListeners.get(type) || [])) fn(evt);
  };

  const targetUuid = "12345678-1234-4123-8123-123456789abc";
  const draftDb = new Map([[targetUuid, { chatKey: targetUuid, title: "Test Chat", text: "Важный черновик до перезапуска", attachments: [] }]]);
  const syncWrites = [];
  const rpcSyncCalls = [];
  const userMsg = doc.createElement("div");
  userMsg.setAttribute("data-testid", "user-message-content");
  userMsg.textContent = "Первое сообщение";
  doc.body.appendChild(userMsg);
  const compWrap = doc.createElement("div");
  compWrap.setAttribute("data-rudex-theme-composer", "1");
  const editable = doc.createElement("div");
  editable.setAttribute("contenteditable", "true");
  compWrap.appendChild(editable);
  doc.body.appendChild(compWrap);

  const panel = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: {
      invoke: async (ch, payload) => {
        if (ch === "agy-studio:get-composer-draft") {
          const d = draftDb.get(payload.chatKey) || null;
          return { ok: true, draft: d };
        }
        if (ch === "agy-studio:save-composer-draft") {
          if (!String(payload.text || "").trim()) draftDb.delete(payload.chatKey);
          else draftDb.set(payload.chatKey, payload);
          return { ok: true, draft: payload };
        }
        if (ch === "agy-studio:sync-quota-snapshot") {
          rpcSyncCalls.push(payload);
          return { ok: true, summary: { families: { gemini: { fiveHourRem: 74, weeklyRem: 82, fiveHourEstimated: false, weeklyEstimated: false, liveRpcSynced: true }, claudeGpt: { fiveHourRem: 91, weeklyRem: 100, fiveHourEstimated: false, weeklyEstimated: false, liveRpcSynced: true } } } };
        }
        return { ok: true };
      },
      send: (ch, payload) => { if (ch === "agy-studio:save-composer-draft-sync") syncWrites.push(payload); },
      sendSync: (ch, payload) => { if (ch === "agy-studio:save-composer-draft-sync") syncWrites.push(payload); return { ok: true }; },
      on: () => {},
      removeListener: () => {},
    },
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });

  try {
    panel.init();
    // Phase A: Cold boot starts with NO UUID in URL yet -> detects temp chat-<hash>
    panel.pollStream();
    // Phase B: URL hydrates to targetUuid (triggers migrateFromKey!) -> MUST still restore saved targetUuid draft!
    win.location.pathname = `/chat/${targetUuid}`;
    panel.pollStream();
    await new Promise((r) => setTimeout(r, 260));
    assert.equal(editable.textContent, "Важный черновик до перезапуска", "Cold restart chat-<hash> -> UUID migration MUST restore saved draft into empty composer!");

    // Phase C: Simulate React cold-hydration wiping Lexical back to empty without user typing -> stickiness check MUST re-apply it!
    editable.textContent = "";
    await new Promise((r) => setTimeout(r, 650));
    assert.equal(editable.textContent, "Важный черновик до перезапуска", "Post-restore stickiness guard must re-apply draft if React hydration clears Lexical!");
    assert.ok(draftDb.has(targetUuid), "Empty composer during React hydration must NEVER erase disk draft!");

    // Phase D: Simulate Electron shutdown unmounting composer before beforeunload -> MUST NOT flush empty "" overwriting disk draft!
    compWrap.removeChild(editable);
    emitWin("beforeunload", {});
    const emptyOverwrites = syncWrites.filter((w) => w.chatKey === targetUuid && !String(w.text || "").trim());
    assert.equal(emptyOverwrites.length, 0, "beforeunload after composer unmount must NEVER overwrite disk draft with empty string!");

    // Phase E: Main-world passive RPC quota postMessage flows directly into sync-quota-snapshot with source="official-rpc"
    emitWin("message", { source: win, data: { __rudexVoice: "quota-rpc", payload: extracted } });
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(rpcSyncCalls.length, 1, "Passive quota-rpc message must immediately sync via agy-studio:sync-quota-snapshot");
    assert.equal(rpcSyncCalls[0].source, "official-rpc");
    assert.equal(rpcSyncCalls[0].gemini.fiveHourRem, 74);
  } finally {
    panel.destroy();
  }
});

test("Force-close composer drafts: Main-World detached file/drop capture, zero-width & icon safety, periodic flush, and Main-World Lexical/File restore", async () => {
  const vm = require("vm");
  const { rv5ReadEditableText } = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const { buildMainWorldVoicePatchScript } = require(path.join(RES_DIR, "rudex-optimizer.js"));

  // 1) Zero-width Lexical placeholders must read as empty string so restore never aborts
  assert.equal(rv5ReadEditableText({ tagName: "DIV", innerText: "\u200B\uFEFF\n " }), "");
  assert.equal(rv5ReadEditableText({ tagName: "DIV", innerText: "\u200BПривет мир\uFEFF" }), "Привет мир");

  // 2) Main-World patch script compiles cleanly and hooks detached <input type="file"> + paste + drop -> composer-file
  const mwPatch = buildMainWorldVoicePatchScript("ru", { micBoost: false, autoGain: false, agcLevel: 0 });
  assert.doesNotThrow(() => new vm.Script(mwPatch), "Main-World optimizer/file-capture script must be valid JS");
  assert.ok(mwPatch.includes("HTMLInputElement.prototype") && mwPatch.includes("rudexFileInputClick"), "Main-World script must hook detached file inputs");
  assert.ok(mwPatch.includes("composer-file"), "Main-World script must bridge captured files to preload");
  assert.ok(mwPatch.includes("nav-change") && mwPatch.includes("pushState"), "Main-World script must bridge 0ms SPA navigation events");

  // 2b) Permanent drafts check: saved chat drafts NEVER expire after 30 days (even 2 years old!)
  {
    const fsLocal = require("fs");
    const osLocal = require("os");
    const i18nMainSrc = fsLocal.readFileSync(path.join(SCRIPTS_DIR, "i18n-main.js"), "utf8");
    assert.ok(i18nMainSrc.includes("const DRAFT_TTL_MS = 0;"), "Composer drafts must be permanent (DRAFT_TTL_MS = 0)");
    assert.ok(i18nMainSrc.includes("const MAX_COMPOSER_DRAFTS = 500;"), "Composer drafts capacity must allow up to 500 chats");
    const tmpDir = fsLocal.mkdtempSync(path.join(osLocal.tmpdir(), "rudex-perm-draft-"));
    const Module = require("module");
    const origLoad = Module._load;
    const fakeElectron = {
      app: { getPath: () => tmpDir, getVersion: () => "2.0.0", isReady: () => true, whenReady: () => Promise.resolve(), on: () => {} },
      BrowserWindow: { getAllWindows: () => [] },
      ipcMain: { handle: () => {}, on: () => {} },
      Menu: {}, dialog: {}, shell: {}, protocol: {}, clipboard: {}, nativeImage: {},
    };
    try {
      Module._load = function (req) { return req === "electron" ? fakeElectron : origLoad.apply(this, arguments); };
      const mainPath = path.join(SCRIPTS_DIR, "i18n-main.js");
      delete require.cache[require.resolve(mainPath)];
      const i18nMain = require(mainPath);
      const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
      const oldUuid = "aaaaaaaa-1111-4222-8333-bbbbbbbbbbbb";
      fsLocal.writeFileSync(path.join(tmpDir, "agy_studio_drafts.json"), JSON.stringify({
        version: 1,
        drafts: { [oldUuid]: { chatKey: oldUuid, title: "Old Chat", text: "Вечный черновик", attachments: [], updatedAt: twoYearsAgo } },
      }));
      // Trigger persist via saving another draft -> 2-year-old draft MUST remain untouched!
      i18nMain.saveComposerDraft({ chatKey: "cccccccc-1111-4222-8333-dddddddddddd", title: "Newer", text: "Новый", attachments: [] });
      const loadedOld = i18nMain.getComposerDraftWithData(oldUuid);
      assert.equal(loadedOld && loadedOld.draft && loadedOld.draft.text, "Вечный черновик", "2-year-old chat draft must be kept permanently without TTL eviction");
    } finally {
      Module._load = origLoad;
      fsLocal.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  // 3) Simulate typing + attaching file (via Main-World composer-file) + pasted screenshot inside 4-level-nested tray + tiny 16x16 UI avatar, then FORCE-CLOSE (NO beforeunload!)
  const { doc, win } = createMockDom();
  const winListeners = new Map();
  const origWinAdd = win.addEventListener.bind(win);
  win.addEventListener = (type, fn, cap) => {
    if (!winListeners.has(type)) winListeners.set(type, new Set());
    winListeners.get(type).add(fn);
    origWinAdd(type, fn, cap);
  };
  const emitWin = (type, evt) => {
    for (const fn of Array.from(winListeners.get(type) || [])) fn(evt);
  };
  const docListeners = new Map();
  const origDocAdd = doc.addEventListener.bind(doc);
  doc.addEventListener = (type, fn, cap) => {
    if (!docListeners.has(type)) docListeners.set(type, new Set());
    docListeners.get(type).add(fn);
    origDocAdd(type, fn, cap);
  };
  const emitDoc = (type, evt) => {
    for (const fn of Array.from(docListeners.get(type) || [])) fn(evt);
  };

  const targetUuid = "99999999-8888-4777-8666-555555555555";
  win.location.pathname = `/chat/${targetUuid}`;
  const draftDb = new Map();

  // Build 4-level nested composer shell + attachment tray above composer card
  const shell4 = doc.createElement("div");
  const tray = doc.createElement("div");
  const shell3 = doc.createElement("div");
  const shell2 = doc.createElement("div");
  const compWrap = doc.createElement("div");
  compWrap.setAttribute("data-rudex-theme-composer", "1");
  const editable = doc.createElement("div");
  editable.setAttribute("contenteditable", "true");
  // Tiny 16x16 avatar icon inside composer must NEVER be mistaken for an attached photo
  const tinyIcon = doc.createElement("img");
  tinyIcon.setAttribute("src", "https://example.com/avatar.png");
  tinyIcon.setAttribute("alt", "User avatar");
  tinyIcon.naturalWidth = 16;
  tinyIcon.naturalHeight = 16;
  compWrap.appendChild(tinyIcon);
  compWrap.appendChild(editable);
  shell2.appendChild(compWrap);
  shell3.appendChild(shell2);
  shell4.appendChild(tray);
  shell4.appendChild(shell3);
  doc.body.appendChild(shell4);

  const samplePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const samplePdf = "data:application/pdf;base64,JVBERi0xLjQK";

  const makeMockIpc = () => ({
    invoke: async (ch, payload) => {
      if (ch === "agy-studio:get-composer-draft") {
        return { ok: true, draft: draftDb.get(payload.chatKey) || null };
      }
      if (ch === "agy-studio:save-composer-draft") {
        const hasTxt = Boolean(String(payload.text || "").trim());
        const atts = Array.isArray(payload.attachments) ? payload.attachments : [];
        if (!hasTxt && atts.length === 0) {
          draftDb.delete(payload.chatKey);
          return { ok: true, draft: null };
        }
        const saved = {
          chatKey: payload.chatKey,
          title: payload.title || "",
          text: payload.text || "",
          attachments: atts.map((a, idx) => ({
            name: a.name,
            mime: a.mime,
            isImage: Boolean(a.isImage),
            fileName: a.fileName || `dr-${idx + 1}.bin`,
            dataUrl: a.dataUrl || (a.isImage ? samplePng : samplePdf),
          })),
        };
        draftDb.set(payload.chatKey, saved);
        return { ok: true, draft: saved };
      }
      return { ok: true };
    },
    send: () => {},
    sendSync: () => ({ ok: true }),
    on: () => {},
    removeListener: () => {},
  });

  const panel1 = createStudioPanel({
    document: doc,
    window: win,
    ipcRenderer: makeMockIpc(),
    initialLocale: "ru",
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });

  try {
    panel1.init();
    panel1.pollStream();
    await new Promise((r) => setTimeout(r, 60));

    // Attach detached PDF via Main-World composer-file bridge + render truncated chip with title="spec.pdf"
    const pdfChip = doc.createElement("div");
    pdfChip.setAttribute("title", "spec.pdf");
    pdfChip.textContent = "spec…";
    tray.appendChild(pdfChip);
    emitWin("message", {
      source: win,
      data: { __rudexVoice: "composer-file", payload: { name: "spec.pdf", mime: "application/pdf", size: 42, dataUrl: samplePdf } },
    });

    // Attach screenshot image in the nested tray
    const shotImg = doc.createElement("img");
    shotImg.setAttribute("src", samplePng);
    shotImg.naturalWidth = 320;
    shotImg.naturalHeight = 180;
    tray.appendChild(shotImg);

    // Type text into composer and fire input event (NO beforeunload fired afterwards!)
    editable.textContent = "Текст и файлы перед taskkill /F";
    emitDoc("input", { target: editable });

    await new Promise((r) => setTimeout(r, 340));
    const persisted = draftDb.get(targetUuid);
    assert.ok(persisted, "Draft must ALREADY be saved to disk during typing/attaching without beforeunload!");
    assert.equal(persisted.text, "Текст и файлы перед taskkill /F");
    assert.equal(persisted.attachments.length, 2, "Must save both screenshot image and spec.pdf while ignoring 16x16 avatar icon");
    assert.ok(persisted.attachments.some((a) => a.name === "spec.pdf" && !a.isImage), "spec.pdf file attachment must be persisted");
    assert.ok(persisted.attachments.some((a) => a.isImage === true), "Screenshot attachment must be persisted");
  } finally {
    panel1.destroy();
  }

  // 4) Cold reopen AFTER force-close with Electron webFrame.executeJavaScript Main-World injection!
  const { doc: doc2, win: win2 } = createMockDom();
  win2.location.pathname = `/chat/${targetUuid}`;
  const shell2Root = doc2.createElement("div");
  const tray2 = doc2.createElement("div");
  const compWrap2 = doc2.createElement("div");
  compWrap2.setAttribute("data-rudex-theme-composer", "1");
  const editable2 = doc2.createElement("div");
  editable2.setAttribute("contenteditable", "true");
  editable2.innerText = "\u200B"; // Lexical empty zero-width placeholder!
  const tinyIcon2 = doc2.createElement("img");
  tinyIcon2.setAttribute("src", "https://example.com/avatar.png");
  tinyIcon2.setAttribute("alt", "avatar");
  tinyIcon2.naturalWidth = 16;
  tinyIcon2.naturalHeight = 16;
  compWrap2.appendChild(tinyIcon2);
  compWrap2.appendChild(editable2);
  shell2Root.appendChild(tray2);
  shell2Root.appendChild(compWrap2);
  doc2.body.appendChild(shell2Root);

  const mwLog = [];
  const mockWebFrame = {
    executeJavaScript: async (code, userGesture) => {
      assert.equal(userGesture, true, "Main-World composer restore must pass userGesture=true");
      assert.doesNotThrow(() => new vm.Script(code), "Injected Main-World composer script must be syntactically valid JS");
      if (code.includes("new File(")) {
        mwLog.push("attach");
        const restoredChip = doc2.createElement("div");
        restoredChip.setAttribute("title", "spec.pdf");
        restoredChip.textContent = "spec.pdf";
        tray2.appendChild(restoredChip);
        const restoredImg = doc2.createElement("img");
        restoredImg.setAttribute("src", samplePng);
        restoredImg.naturalWidth = 320;
        restoredImg.naturalHeight = 180;
        tray2.appendChild(restoredImg);
        return { ok: true, count: 2 };
      }
      mwLog.push("text");
      editable2.innerText = "Текст и файлы перед taskkill /F";
      editable2.textContent = "Текст и файлы перед taskkill /F";
      return { ok: true, method: "mw-paste" };
    },
  };

  const slowDraftIpc = makeMockIpc();
  const origInvoke2 = slowDraftIpc.invoke;
  slowDraftIpc.invoke = async (ch, payload) => {
    if (ch === "agy-studio:get-composer-draft") {
      await new Promise((r) => setTimeout(r, 120));
    }
    return origInvoke2(ch, payload);
  };

  const panel2 = createStudioPanel({
    document: doc2,
    window: win2,
    webFrame: mockWebFrame,
    ipcRenderer: slowDraftIpc,
    initialLocale: "ru",
    initialBoot: { composerDraftsEnabled: true, draftTexts: { [targetUuid]: "Текст и файлы перед taskkill /F" } },
    buildStyles: buildStudioStyles,
    telemetryEngine: createTelemetryEngine(),
  });

  try {
    panel2.init();
    panel2.pollStream();
    // 0ms INSTANT TEXT: text MUST already be injected BEFORE the 120ms get-composer-draft IPC even finishes!
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(rv5ReadEditableText(editable2), "Текст и файлы перед taskkill /F", "Pre-warmed boot draftTexts must restore text instantaneously (<25ms) before disk IPC resolves!");
    assert.deepEqual(mwLog.slice(0, 1), ["text"], "Text must be injected first at 0ms without waiting for attachments");

    // Once disk IPC resolves, attachments restore right behind text without skipping!
    await new Promise((r) => setTimeout(r, 180));
    assert.deepEqual(mwLog.slice(0, 2), ["text", "attach"], "Main-World restore must inject instant text first, then binary attachments via webFrame.executeJavaScript");
    assert.ok(tray2.textContent.includes("spec.pdf"), "Restored file attachment must appear in composer tray");

    // Simulate React cold-hydration wiping BOTH text and attachments -> stickiness guard must re-apply BOTH quickly!
    editable2.innerText = "\u200B";
    editable2.textContent = "";
    while (tray2.children.length > 0) tray2.removeChild(tray2.children[0]);
    await new Promise((r) => setTimeout(r, 420));
    assert.ok(mwLog.filter((k) => k === "text").length >= 2, "Stickiness guard must re-apply missing text after React hydration wipe");
    assert.ok(mwLog.filter((k) => k === "attach").length >= 2, "Stickiness guard must re-apply missing attachments after React hydration wipe");
    assert.equal(rv5ReadEditableText(editable2), "Текст и файлы перед taskkill /F");
  } finally {
    panel2.destroy();
  }

  // 5) 0ms sidebar active UUID detection BEFORE chat messages finish hydrating (userMsgCount=0, respCount=0, NO URL UUID!) + instant Main-World nav-change
  {
    const { doc: doc3, win: win3 } = createMockDom();
    const win3Listeners = new Map();
    const origW3Add = win3.addEventListener.bind(win3);
    win3.addEventListener = (type, fn, cap) => {
      if (!win3Listeners.has(type)) win3Listeners.set(type, new Set());
      win3Listeners.get(type).add(fn);
      origW3Add(type, fn, cap);
    };
    const emitW3 = (type, evt) => {
      for (const fn of Array.from(win3Listeners.get(type) || [])) fn(evt);
    };

    const sideUuid = "234f6c0b-48ff-413d-bac5-4742bc4c5553";
    const navUuid = "33c7be17-2eb7-43b5-815a-4edc55767259";
    win3.location.pathname = "/"; // NO UUID in URL!
    const aside = doc3.createElement("aside");
    const row1 = doc3.createElement("a");
    row1.setAttribute("data-conversation-id", sideUuid);
    row1.setAttribute("aria-current", "page");
    row1.textContent = "Редизайн Антигравити";
    aside.appendChild(row1);
    doc3.body.appendChild(aside);
    const compWrap3 = doc3.createElement("div");
    compWrap3.setAttribute("data-rudex-theme-composer", "1");
    const ed3 = doc3.createElement("div");
    ed3.setAttribute("contenteditable", "true");
    compWrap3.appendChild(ed3);
    doc3.body.appendChild(compWrap3);

    const p3 = createStudioPanel({
      document: doc3,
      window: win3,
      webFrame: {
        executeJavaScript: async (code) => {
          const m = /const text = ("(?:\\.|[^"\\])*");/.exec(code);
          if (m) {
            const val = JSON.parse(m[1]);
            ed3.innerText = val;
            ed3.textContent = val;
            return { ok: true, method: "mw-exec-sync" };
          }
          return { ok: false };
        },
      },
      ipcRenderer: {
        invoke: async (ch, payload) => {
          if (ch === "agy-studio:get-composer-draft") {
            if (payload.chatKey === sideUuid) return { ok: true, draft: { chatKey: sideUuid, text: "Мгновенно до загрузки сообщений", attachments: [] } };
            if (payload.chatKey === navUuid) return { ok: true, draft: { chatKey: navUuid, text: "Мгновенно после nav-change", attachments: [] } };
            return { ok: true, draft: null };
          }
          return { ok: true };
        },
        send: () => {},
        sendSync: () => ({ ok: true }),
        on: () => {},
        removeListener: () => {},
      },
      initialLocale: "ru",
      initialBoot: {
        composerDraftsEnabled: true,
        draftTexts: { [sideUuid]: "Мгновенно до загрузки сообщений", [navUuid]: "Мгновенно после nav-change" },
      },
      buildStyles: buildStudioStyles,
      telemetryEngine: createTelemetryEngine(),
    });
    try {
      p3.init();
      // Even with 0 messages rendered & no URL UUID, explicit active sidebar row restores draft immediately (<25ms)!
      await new Promise((r) => setTimeout(r, 25));
      assert.equal(rv5ReadEditableText(ed3), "Мгновенно до загрузки сообщений", "Active sidebar UUID must restore draft at 0ms even while chat messages are still loading!");

      // Switch to navUuid via Main-World nav-change message WITHOUT calling pollStream() manually -> instant restore (<25ms)!
      win3.location.pathname = `/chat/${navUuid}`;
      ed3.innerText = "";
      ed3.textContent = "";
      emitW3("message", { source: win3, data: { __rudexVoice: "nav-change", payload: { url: `/chat/${navUuid}` } } });
      await new Promise((r) => setTimeout(r, 25));
      assert.equal(rv5ReadEditableText(ed3), "Мгновенно после nav-change", "Main-World nav-change must trigger immediate 0ms chat switch & draft restore!");
    } finally {
      p3.destroy();
    }
  }
});

test("Upgrade & Migration Safety (v4.x / v5.0.x -> v5.5.2): preserves every user setting, wallpaper, override, hotkey, quota, draft, and AGENTS.md without loss", () => {
  const fsLocal = require("fs");
  const osLocal = require("os");
  const Module = require("module");

  // 1) Version consistency check across plugin.json & installers
  const pkg = JSON.parse(fsLocal.readFileSync(path.join(REPO_ROOT, "plugin.json"), "utf8"));
  assert.equal(pkg.version, "5.5.2", "plugin.json must be bumped to 5.5.2");

  // 2) Full legacy v4.x + v5.0.x settings, quota, and drafts migration test
  const tmpDir = fsLocal.mkdtempSync(path.join(osLocal.tmpdir(), "rudex-upgrade-55-"));
  const origLoad = Module._load;
  const fakeElectron = {
    app: { getPath: () => tmpDir, getVersion: () => "2.0.0", isReady: () => true, whenReady: () => Promise.resolve(), on: () => {} },
    BrowserWindow: { getAllWindows: () => [] },
    ipcMain: { handle: () => {}, on: () => {} },
    Menu: {}, dialog: {}, shell: {}, protocol: {}, clipboard: {}, nativeImage: {},
  };

  try {
    // Seed a realistic legacy v4.4 / v5.0.3 userData directory BEFORE loading v5.5.0 i18n-main.js!
    const mediaDir = path.join(tmpDir, "studio_media");
    fsLocal.mkdirSync(mediaDir, { recursive: true });
    fsLocal.writeFileSync(path.join(mediaDir, "my-wallpaper.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

    const legacySettings = {
      panelEnabled: true,
      pinned: true,
      viewMode: "large", // legacy v4 alias -> "medium"
      dockPosition: "bottom", // legacy v4 alias -> "bottom-right"
      thinkingInRussian: true, // user explicitly enabled in v5.0.x
      // Note: workLogInRussian, optimization missing completely (pre-v5.5 config!)
      customLabels: [{ id: "lbl-1", matchType: "exact", match: "New Chat", label: "Свежий чат", enabled: true }],
      keybindings: { toggleStudio: "Ctrl+Shift+R", toggleLocale: "Alt+L" },
      limitsWidget: {
        enabled: true,
        layout: "card",
        position: "top-right",
        width: 260,
        scale: 110,
        exactOnly: true, // deprecated field from earlier build — MUST NOT break sanitizer!
      },
      appearance: {
        presetId: "claude-code-dark",
        canvasBg: "#191918",
        accent: "#d97757",
        wallpaper: { type: "image", mediaUrl: "agy-media://local/my-wallpaper.jpg", mediaFile: "my-wallpaper.jpg", opacity: 65, blur: 4 },
        uiStyle: { preset: "claude-code", composer: "claude-code", chat: "claude-code", modelSelector: "claude-code" },
        elementOverrides: [
          {
            id: "ov-legacy-1",
            selector: "header",
            label: "Шапка",
            styles: {
              bgColor: "#222222",
              bgOpacity: 80,
              borderRadius: 12,
              // legacy override without offsetX / offsetY / paddingY / paddingX!
            },
          },
        ],
      },
      greeting: { enabled: true, title: "Привет, Иван!", subtitle: "Готов к коду" },
      studioUi: { studioTheme: "claude-dark", widgetTheme: "claude", appScale: 105, studioScale: 95 },
      customPresets: [{ id: "p-1", title: "Строгий ревьюер", body: "Отвечай кратко и по делу." }],
    };
    fsLocal.writeFileSync(path.join(tmpDir, "agy_studio_settings.json"), JSON.stringify(legacySettings, null, 2));

    const legacyQuota = {
      version: 1,
      resetAt: 0,
      families: {
        gemini: { weeklyRem: 88, fiveHourRem: 71, weeklyReset: "4 д 12 ч", fiveHourReset: "2 ч 15 мин", updatedAt: Date.now() - 60000, calibrated: true, tokensPer1Pct5h: 31000, tokensPer1PctWeekly: 420000 },
        claudeGpt: { weeklyRem: 100, fiveHourRem: 94, updatedAt: Date.now() - 60000, calibrated: true },
      },
    };
    fsLocal.writeFileSync(path.join(tmpDir, "agy_studio_quota.json"), JSON.stringify(legacyQuota, null, 2));

    const oldDraftUuid = "11112222-3333-4444-8555-666677778888";
    const legacyDrafts = {
      version: 1,
      drafts: {
        [oldDraftUuid]: {
          chatKey: oldDraftUuid,
          title: "Старый важный чат",
          text: "Сохранённый текст со старой версии 5.0.3",
          attachments: [],
          updatedAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days old (> old 30d TTL!)
        },
      },
    };
    fsLocal.writeFileSync(path.join(tmpDir, "agy_studio_drafts.json"), JSON.stringify(legacyDrafts, null, 2));

    Module._load = function (req) {
      return req === "electron" ? fakeElectron : origLoad.apply(this, arguments);
    };
    const mainPath = path.join(SCRIPTS_DIR, "i18n-main.js");
    delete require.cache[require.resolve(mainPath)];
    const i18nMain = require(mainPath);

    // Load settings under v5.5.0 -> EVERY legacy preference MUST survive intact!
    const migrated = i18nMain.loadStudioSettings();
    assert.equal(migrated.viewMode, "medium", "Legacy viewMode='large' must cleanly map to 'medium'");
    assert.equal(migrated.dockPosition, "bottom-right", "Legacy dockPosition='bottom' must cleanly map to 'bottom-right'");
    assert.equal(migrated.thinkingInRussian, true, "User's enabled thinkingInRussian must NOT be reset on upgrade");
    assert.equal(migrated.workLogInRussian, false, "New v5.5 workLogInRussian must default safely to false (opt-in)");
    assert.equal(migrated.appearance.presetId, "claude-code-dark", "Theme preset must survive upgrade");
    assert.equal(migrated.appearance.wallpaper.mediaFile, "my-wallpaper.jpg", "Custom wallpaper file must survive upgrade");
    assert.equal(migrated.appearance.uiStyle.preset, "claude-code", "UI style preset must survive upgrade");
    assert.equal(migrated.appearance.elementOverrides.length, 1, "Legacy Element Picker overrides must survive upgrade");
    assert.equal(migrated.appearance.elementOverrides[0].styles.bgColor, "#222222");
    assert.equal(migrated.appearance.elementOverrides[0].styles.offsetX, 0, "Missing offsetX on legacy override must normalize cleanly to 0");
    assert.equal(migrated.customLabels.length, 1, "Custom labels must survive upgrade");
    assert.equal(migrated.customLabels[0].label, "Свежий чат");
    assert.equal(migrated.keybindings.toggleStudio, "Ctrl+Shift+R", "Custom keybinding must survive upgrade");
    assert.equal(migrated.keybindings.toggleDictation, "Ctrl+Alt+V", "New v5.5 keybinding must be filled with default without wiping custom ones");
    assert.equal(migrated.limitsWidget.enabled, true, "Limits widget enabled state must survive upgrade");
    assert.equal(migrated.limitsWidget.width, 260, "Limits widget custom width must survive upgrade");
    assert.equal(migrated.studioUi.appScale, 105, "Custom appScale must survive upgrade");
    assert.equal(migrated.greeting.title, "Привет, Иван!", "Custom greeting must survive upgrade");
    assert.equal(migrated.customPresets.length, 1, "Custom persona presets must survive upgrade");
    // Experimental opt-in perf flags must default OFF when upgrading from pre-v5.5
    assert.equal(migrated.optimization.lsTuningEnabled, false);
    assert.equal(migrated.optimization.storageRamCache, false);
    assert.equal(migrated.optimization.geminiFileCacheProtocol, false);

    // Saving a small patch must NEVER wipe wallpaper file or existing overrides/labels
    const afterSave = i18nMain.saveStudioSettings({ workLogInRussian: true });
    assert.equal(afterSave.workLogInRussian, true);
    assert.equal(afterSave.appearance.wallpaper.mediaFile, "my-wallpaper.jpg");
    assert.ok(fsLocal.existsSync(path.join(mediaDir, "my-wallpaper.jpg")), "Wallpaper media file on disk must NEVER be pruned during upgrade save");

    // Legacy quota store loads exact official % cleanly with zero ~ estimates
    const qSum = i18nMain.buildQuotaSummary(oldDraftUuid, true);
    assert.equal(qSum.families.gemini.weeklyRem, 88);
    assert.equal(qSum.families.gemini.fiveHourRem, 71);
    assert.equal(qSum.families.gemini.fiveHourEstimated, false);
    assert.equal(qSum.families.claudeGpt.fiveHourRem, 94);

    // 45-day-old draft from v5.0.3 loads cleanly and survives persist under permanent v5.5 storage!
    const loadedDraft = i18nMain.getComposerDraftWithData(oldDraftUuid);
    assert.equal(loadedDraft && loadedDraft.draft && loadedDraft.draft.text, "Сохранённый текст со старой версии 5.0.3");
  } finally {
    Module._load = origLoad;
    fsLocal.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("v5.5.1 fixes: deferred startup wallpaper (no full-screen boot flash), zero empty agent-response strip, clean voice-send stop/clear, and lag-free non-snapback inspector nudges", async () => {
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const teMod = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const v5Ui = require(path.join(RES_DIR, "rudex-v5-ui.js"));
  const { findNativeDictationButton, buildMainWorldVoicePatchScript } = require(path.join(RES_DIR, "rudex-optimizer.js"));
  const sampleWpDataUrl = "rudex-media://local/rem.png";

  // 1) Startup wallpaper must stay hidden (#rudex-bg[data-boot-hidden="1"]) while React root is empty on HTTP boot,
  //    then reveal atomically once Antigravity's real layout (sidebar + composer) mounts!
  {
    const { doc, win } = createMockDom();
    win.location = { protocol: "http:", href: "http://127.0.0.1:4242/", pathname: "/", search: "", hash: "" };
    const rootDiv = doc.createElement("div");
    rootDiv.id = "root";
    doc.body.appendChild(rootDiv);
    const te = createThemeEngine({ document: doc, window: win });
    const panel = createStudioPanel({
      document: doc,
      window: win,
      ipcRenderer: { invoke: async () => ({ ok: true }), on: () => {}, removeListener: () => {} },
      telemetryEngine: createTelemetryEngine(),
      translator: createDomTranslator({ document: doc, window: win }),
      themeEngine: te,
      buildStyles: buildStudioStyles,
      initialBoot: {
        appearance: {
          presetId: "native",
          wallpaper: { type: "image", mediaUrl: sampleWpDataUrl, dim: 35, opacity: 90 },
        },
      },
    });
    try {
      panel.bootEarlyTheme();
      const styleEl = doc.getElementById("rudex-studio-theme");
      assert.ok(styleEl && styleEl.textContent.includes('#rudex-bg[data-boot-hidden="1"]'), "Wallpaper CSS must include boot-hidden rule");
      const bg = doc.getElementById("rudex-bg");
      assert.ok(bg, "#rudex-bg should preload in DOM");
      assert.equal(bg.getAttribute("data-boot-hidden"), "1", "Wallpaper must stay hidden while Antigravity UI is not yet mounted (prevents full-screen boot flash)");
      assert.equal(te.isBootWallpaperDeferred(), true);

      // Now mount sidebar + composer -> UI becomes ready and init() reveals wallpaper atomically!
      const aside = doc.createElement("aside");
      const ed = doc.createElement("div");
      ed.setAttribute("contenteditable", "true");
      rootDiv.appendChild(aside);
      rootDiv.appendChild(ed);
      panel.init();
      assert.equal(bg.getAttribute("data-boot-hidden"), null, "Wallpaper must reveal immediately once Antigravity UI mounts");
      assert.equal(te.isBootWallpaperDeferred(), false);
    } finally {
      panel.destroy();
    }
  }

  // 2) Empty [data-testid="agent-response"] before agent prints any text must get data-rudex-empty-response="1"
  //    and strip glass card/border/padding CSS; the instant text or an image arrives, attribute clears!
  {
    const { doc, win } = createMockDom();
    const emptyResp = doc.createElement("div");
    emptyResp.setAttribute("data-testid", "agent-response");
    const emptyMd = doc.createElement("div");
    emptyMd.setAttribute("data-markdown-root", "");
    emptyMd.textContent = "   \u200B  ";
    emptyResp.appendChild(emptyMd);
    doc.body.appendChild(emptyResp);

    const imgOnlyResp = doc.createElement("div");
    imgOnlyResp.setAttribute("data-testid", "agent-response");
    const imgNode = doc.createElement("img");
    imgNode.setAttribute("src", sampleWpDataUrl);
    imgOnlyResp.appendChild(imgNode);
    doc.body.appendChild(imgOnlyResp);

    const te = createThemeEngine({ document: doc, window: win });
    try {
      te.apply({
        presetId: "native",
        wallpaper: { type: "image", mediaUrl: sampleWpDataUrl, dim: 35, opacity: 90 },
      });
      const css = doc.getElementById("rudex-studio-theme").textContent;
      assert.ok(css.includes('[data-testid="agent-response"][data-rudex-empty-response="1"]'), "Theme CSS must hide empty agent-response card/border/padding");
      assert.equal(emptyResp.getAttribute("data-rudex-empty-response"), "1", "Whitespace-only pre-output agent-response must be marked empty");
      assert.equal(imgOnlyResp.getAttribute("data-rudex-empty-response"), null, "Image-only agent-response must NOT be marked empty");

      // Agent starts printing text -> card activates cleanly!
      emptyMd.textContent = "Привет!";
      te.syncEmptyAgentResponsesNow();
      assert.equal(emptyResp.getAttribute("data-rudex-empty-response"), null, "Non-empty agent-response must clear data-rudex-empty-response immediately");
    } finally {
      te.destroy();
    }
  }

  // 3) Voice dictation + Send:
  //    3a) "Stop Recording and Send" / "Остановить запись и отправить" must NEVER be matched as active mic button
  //    3b) Main-world abort-on-send cancels Sherpa-ONNX cleanly, delivers complete+end with ZERO re-injected text, and swallows late partial/final replies
  {
    const { doc } = createMockDom();
    const stopAndSendBtn = doc.createElement("button");
    stopAndSendBtn.setAttribute("aria-label", "Остановить запись и отправить");
    doc.body.appendChild(stopAndSendBtn);
    assert.equal(findNativeDictationButton(doc), null, "findNativeDictationButton must NEVER match 'Остановить запись и отправить'");

    const stopAndSendEn = doc.createElement("button");
    stopAndSendEn.setAttribute("aria-label", "Stop Recording and Send");
    doc.body.appendChild(stopAndSendEn);
    assert.equal(findNativeDictationButton(doc), null, "findNativeDictationButton must NEVER match 'Stop Recording and Send'");

    const realStopMic = doc.createElement("button");
    realStopMic.setAttribute("aria-label", "Остановить запись");
    doc.body.appendChild(realStopMic);
    const foundMic = findNativeDictationButton(doc);
    assert.ok(foundMic && foundMic.button === realStopMic && foundMic.active === true, "findNativeDictationButton must return only the genuine stop-recording mic button");

    // Test Main-World abort-on-send protocol in isolated VM sandbox
    const vm = require("vm");
    const msgHandlers = [];
    const postedToPreload = [];
    const wsSentRaw = [];
    class FakeWS {
      constructor(url) {
        this.url = url;
        this._listeners = {};
      }
      addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); }
      send(d) { wsSentRaw.push(d); }
      get onmessage() { return this._onmsg; }
      set onmessage(fn) { this._onmsg = fn; }
    }
    const sandboxWin = {
      WebSocket: FakeWS,
      MessageEvent: function MessageEvent(type, init) { this.type = type; this.data = init && init.data; },
      CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
      dispatchEvent: () => {},
      addEventListener: (t, fn) => { if (t === "message") msgHandlers.push(fn); },
      postMessage: (data) => { postedToPreload.push(data); },
      location: { pathname: "/", search: "", hash: "" },
      navigator: {},
    };
    const vmCtx = vm.createContext(sandboxWin);
    vm.runInContext("this.window = this;", vmCtx);
    const scriptSrc = buildMainWorldVoicePatchScript({
      voiceEnabled: true,
      localVoiceActive: true,
      voiceLocalModel: "ru-fast",
      voiceTextCleanup: true,
      languages: ["ru-RU"],
    });
    vm.runInContext(scriptSrc, vmCtx);

    const ws = new vmCtx.WebSocket("ws://127.0.0.1:4242/connect-websocket");
    const delivered = [];
    ws.onmessage = (ev) => delivered.push(JSON.parse(ev.data));
    // Start local dictation stream
    ws.send(JSON.stringify({ type: "start", streamId: "st-1", procedure: "StreamAudioTranscription", payload: {} }));
    await new Promise((r) => setTimeout(r, 5));
    const startCmd = postedToPreload.find((m) => m.__rudexVoice === "local-cmd" && m.payload && m.payload.cmd === "start");
    assert.ok(startCmd, "Local dictation start must emit local-cmd start");
    const sid = startCmd.payload.sessionId;

    // Trigger abort-on-send!
    for (const h of msgHandlers) h({ source: vmCtx.window, data: { __rudexVoice: "abort-on-send", payload: { ts: Date.now() } } });
    const cancelCmd = postedToPreload.find((m) => m.__rudexVoice === "local-cmd" && m.payload && m.payload.cmd === "cancel" && m.payload.sessionId === sid);
    assert.ok(cancelCmd, "abort-on-send must immediately cancel active Sherpa-ONNX session");
    const completeMsg = delivered.find((m) => m.streamId === "st-1" && m.payload && m.payload.complete);
    const endMsg = delivered.find((m) => m.streamId === "st-1" && m.type === "end");
    const leakedTxt = delivered.find((m) => m.streamId === "st-1" && m.payload && m.payload.transcription);
    assert.ok(completeMsg && endMsg, "abort-on-send must close Antigravity's stream cleanly with complete+end");
    assert.equal(leakedTxt, undefined, "abort-on-send must NOT inject any transcription text back into cleared composer");

    // Late final reply from Sherpa after cancel must be dropped completely
    for (const h of msgHandlers) h({ source: vmCtx.window, data: { __rudexVoice: "local-reply", payload: { type: "final", sessionId: sid, streamId: "st-1", text: "хвост текста" } } });
    assert.equal(delivered.filter((m) => m.payload && m.payload.transcription).length, 0, "Late local-reply after abort-on-send must be dropped");

    // Late EndAudioSession for rudex-local-* after cancel must NOT leak to real backend WebSocket
    const rawCountBefore = wsSentRaw.length;
    ws.send(JSON.stringify({ type: "start", streamId: "st-end", procedure: "EndAudioSession", payload: { sessionId: sid } }));
    assert.equal(wsSentRaw.length, rawCountBefore, "Late EndAudioSession for cancelled rudex-local-* session must stay local and never leak to server");
  }

  // 4) Element Inspector rapid D-pad nudges:
  //    - Zero innerHTML rebuild (inspector DOM preserved across 10 rapid clicks!)
  //    - Debounced IPC (no 10x disk-write flood)
  //    - Stale remote applyRemoteState echo NEVER snaps offsetX backwards!
  {
    const { doc, win } = createMockDom();
    const prevV5 = {
      rv5BuildElementInspectorHtml: globalThis.rv5BuildElementInspectorHtml,
      rv5BuildSmartSelector: globalThis.rv5BuildSmartSelector,
      rv5DescribeElementFriendly: globalThis.rv5DescribeElementFriendly,
      rv5IsRenameSafeElement: globalThis.rv5IsRenameSafeElement,
      teBuildElementOverridesCss: globalThis.teBuildElementOverridesCss,
      normalizeAppearance: globalThis.normalizeAppearance,
      teResolveFontStack: globalThis.teResolveFontStack,
    };
    globalThis.rv5BuildElementInspectorHtml = v5Ui.rv5BuildElementInspectorHtml;
    globalThis.rv5BuildSmartSelector = v5Core.rv5BuildSmartSelector;
    globalThis.rv5DescribeElementFriendly = v5Core.rv5DescribeElementFriendly;
    globalThis.rv5IsRenameSafeElement = v5Core.rv5IsRenameSafeElement;
    globalThis.teBuildElementOverridesCss = teMod.teBuildElementOverridesCss;
    globalThis.normalizeAppearance = teMod.normalizeAppearance;
    globalThis.teResolveFontStack = teMod.teResolveFontStack;

    const targetBox = doc.createElement("div");
    targetBox.id = "demo-move-card";
    targetBox.textContent = "Card";
    doc.body.appendChild(targetBox);

    const saveCalls = [];
    const panel = createStudioPanel({
      document: doc,
      window: win,
      ipcRenderer: {
        invoke: async (ch, payload) => {
          if (ch === "agy-studio:save-settings") {
            saveCalls.push(JSON.parse(JSON.stringify(payload)));
            return { ok: true, settings: payload };
          }
          return { ok: true };
        },
        on: () => {},
        removeListener: () => {},
      },
      telemetryEngine: createTelemetryEngine(),
      translator: createDomTranslator({ document: doc, window: win }),
      themeEngine: createThemeEngine({ document: doc, window: win }),
      buildStyles: buildStudioStyles,
    });
    try {
      panel.init();
      panel.selectElementForInspector(targetBox);
      const shadow = doc.getElementById("rudex-studio-host").shadowRoot;
      const rootEl = shadow.querySelector(".studio-root");
      const pickerMount = shadow.querySelector(".rx-picker-mount");
      assert.ok(pickerMount.innerHTML.includes('data-action="inspector-nudge-offset"'), "Inspector D-pad markup must render");

      const sentinel = doc.createElement("span");
      sentinel.id = "rx-dom-preserve-sentinel";
      pickerMount.appendChild(sentinel);

      const rightBtn = doc.createElement("button");
      rightBtn.setAttribute("data-action", "inspector-nudge-offset");
      rightBtn.setAttribute("data-axis", "offsetX");
      rightBtn.setAttribute("data-delta", "4");
      rootEl.appendChild(rightBtn);

      // Rapidly click right arrow 10 times (4 -> 40px)
      for (let i = 0; i < 10; i += 1) {
        rootEl.dispatchEvent({ type: "click", target: rightBtn });
      }
      assert.ok(pickerMount.children.includes(sentinel), "Rapid D-pad nudges must preserve inspector DOM (zero innerHTML rebuild lag)");
      assert.equal(saveCalls.length, 0, "Rapid D-pad nudges must debounce IPC persistence instead of flooding 10 disk writes");

      // Simulate stale remote broadcast echo with offsetX=4 arriving mid-burst!
      panel.applyRemoteState({
        settings: {
          appearance: {
            presetId: "native",
            elementOverrides: [{ id: "stale", selector: "#demo-move-card", enabled: true, styles: { offsetX: 4, offsetY: 0 } }],
          },
        },
      }, false);

      // Flush debounce timer and verify final persisted offsetX is STILL 40 (never snapped back to 4!)
      await new Promise((r) => setTimeout(r, 270));
      assert.equal(saveCalls.length, 1, "Debounced burst of 10 rapid clicks must coalesce into 1 clean save");
      const savedOv = saveCalls[0].appearance.elementOverrides.find((o) => o.selector === "#demo-move-card");
      assert.ok(savedOv && savedOv.styles.offsetX === 40, `Expected offsetX=40 without snapback, got ${savedOv && savedOv.styles.offsetX}`);
    } finally {
      panel.destroy();
      Object.assign(globalThis, prevV5);
    }
  }
});

test("v5.5.2 fixes: short bubble width ('ку'), typing flicker/seam guard, hidden-toolbar empty response strip, immediate __new__ draft clear + zero duplication, and streaming/silent quota sync", async () => {
  const { createDomTranslator } = require(path.join(RES_DIR, "dom-translator.js"));
  const { createStudioPanel } = require(path.join(RES_DIR, "studio-panel.js"));
  const { createTelemetryEngine } = require(path.join(RES_DIR, "telemetry-engine.js"));
  const { buildStudioStyles } = require(path.join(RES_DIR, "studio-styles.js"));
  const teMod = require(path.join(RES_DIR, "theme-engine.js"));
  const v5Core = require(path.join(RES_DIR, "rudex-v5-core.js"));
  const {
    buildAnimationPolishCss,
    extractQuotaFromRpcPayload,
    buildMainWorldVoicePatchScript,
  } = require(path.join(RES_DIR, "rudex-optimizer.js"));

  // 1) Short user messages like "ку" must NEVER get crushed to 1 char/line under Claude Code, Codex, or custom userBubbleMaxWidth
  {
    const renderStyleCss = (uiStyle) => {
      const { doc, win } = createMockDom();
      const te = createThemeEngine({ document: doc, window: win });
      try {
        te.apply({ presetId: "claude-terminal", uiStyle });
        return doc.getElementById("rudex-studio-theme").textContent;
      } finally {
        te.destroy();
      }
    };
    const claudeCss = renderStyleCss({ preset: "claude-code", composer: "claude-code", chat: "claude-code", modelSelector: "claude-code" });
    assert.ok(claudeCss.includes("max-width: min(100%, max(74%, 180px), 640px) !important"), "Claude Code user bubble must guard against shrink-to-fit parent % collapse");
    assert.ok(claudeCss.includes("width: fit-content !important"), "Claude Code user bubble must use width: fit-content");
    assert.ok(claudeCss.includes("word-break: normal !important"), "User message content must enforce word-break: normal");
    assert.ok(claudeCss.includes(':has(> [data-testid="user-message-bubble"])'), "User bubble wrapper must expand to width: 100%");

    const codexCss = renderStyleCss({ preset: "codex", composer: "codex", chat: "codex", modelSelector: "codex" });
    assert.ok(codexCss.includes("max-width: min(100%, max(80%, 180px), 700px) !important"), "Codex user bubble must guard against shrink-to-fit parent % collapse");

    const customCss = renderStyleCss({ preset: "antigravity", composer: "antigravity", chat: "antigravity", modelSelector: "antigravity", userBubbleMaxWidth: 68 });
    assert.ok(customCss.includes("max-width: min(100%, max(68%, 180px)) !important"), "Custom userBubbleMaxWidth must use min(100%, max(N%, 180px))");
  }

  // 2) Typing flicker + horizontal seam fix: no contain: layout under #rudex-bg, mask-image cleared on fade wrappers, and GPU layer on #rudex-bg
  {
    const smoothCss = buildAnimationPolishCss({ animContainChat: true });
    assert.ok(smoothCss.includes("body:not(:has(#rudex-bg))") && smoothCss.includes("contain: layout style"), "Without wallpaper, contain: layout style stays active");
    assert.ok(smoothCss.includes("body:has(#rudex-bg)") && smoothCss.includes("contain: style;"), "With wallpaper (#rudex-bg), contain: layout must be dropped to avoid Chromium backdrop-filter tile seam flicker");

    const { doc, win } = createMockDom();
    const te = createThemeEngine({ document: doc, window: win });
    try {
      te.apply({
        presetId: "claude-terminal",
        messageStyle: "glass",
        glassBlur: 12,
        wallpaper: { type: "image", mediaUrl: "rudex-media://local/rem.png", dim: 40, opacity: 90 },
      });
      const css = doc.getElementById("rudex-studio-theme").textContent;
      assert.ok(css.includes("transform: translate3d(0, 0, 0)"), "#rudex-bg should sit on its own stable GPU layer");
      assert.ok(css.includes("mask-image: none !important") && css.includes("-webkit-mask-image: none !important"), "Fade wrappers must strip CSS mask-image seams above composer");
    } finally {
      te.destroy();
    }
  }

  // 3) Empty agent-response strip with hidden opacity-0/sr-only/action-toolbar children must STILL be marked empty until real visible output arrives
  {
    const { doc, win } = createMockDom();
    const resp = doc.createElement("div");
    resp.setAttribute("data-testid", "agent-response");
    const srOnly = doc.createElement("span");
    srOnly.className = "sr-only";
    srOnly.textContent = "Agent response";
    const hiddenActions = doc.createElement("div");
    hiddenActions.className = "opacity-0 pointer-events-none";
    hiddenActions.setAttribute("data-testid", "response-actions");
    const copyBtn = doc.createElement("button");
    copyBtn.textContent = "Copy";
    hiddenActions.appendChild(copyBtn);
    const mdRoot = doc.createElement("div");
    mdRoot.setAttribute("data-markdown-root", "");
    mdRoot.textContent = "";
    resp.appendChild(srOnly);
    resp.appendChild(hiddenActions);
    resp.appendChild(mdRoot);
    doc.body.appendChild(resp);

    const te = createThemeEngine({ document: doc, window: win });
    try {
      te.apply({
        presetId: "claude-terminal",
        wallpaper: { type: "image", mediaUrl: "rudex-media://local/rem.png", dim: 35, opacity: 90 },
      });
      assert.equal(resp.getAttribute("data-rudex-empty-response"), "1", "Pre-output agent-response containing only sr-only / opacity-0 action toolbar must stay hidden");

      mdRoot.textContent = "Готово!";
      te.syncEmptyAgentResponsesNow();
      assert.equal(resp.getAttribute("data-rudex-empty-response"), null, "Visible text must immediately unhide agent-response card");
    } finally {
      te.destroy();
    }
  }

  // 4) Drafts:
  //    4a) Trusted user Backspace/input clearing a restored draft in __new__ immediately clears disk (0ms) and NEVER resurrects erased text
  //    4b) Parallel Step 0 cached text + Step 1 IPC draft restore NEVER duplicates text 2x
  {
    const { doc, win } = createMockDom();
    const docListeners = new Map();
    const origDocAdd = doc.addEventListener.bind(doc);
    doc.addEventListener = (type, fn, cap) => {
      if (!docListeners.has(type)) docListeners.set(type, new Set());
      docListeners.get(type).add(fn);
      origDocAdd(type, fn, cap);
    };
    const emitDoc = (type, evt) => {
      for (const fn of Array.from(docListeners.get(type) || [])) fn(evt);
    };
    const winListeners = new Map();
    const origWinAdd = win.addEventListener.bind(win);
    win.addEventListener = (type, fn, cap) => {
      if (!winListeners.has(type)) winListeners.set(type, new Set());
      winListeners.get(type).add(fn);
      origWinAdd(type, fn, cap);
    };
    const emitWin = (type, evt) => {
      for (const fn of Array.from(winListeners.get(type) || [])) fn(evt);
    };

    const prevV5 = {
      rv5FindNativeComposer: globalThis.rv5FindNativeComposer,
      rv5ReadEditableText: globalThis.rv5ReadEditableText,
      rv5InsertTextIntoEditable: globalThis.rv5InsertTextIntoEditable,
    };
    globalThis.rv5FindNativeComposer = v5Core.rv5FindNativeComposer;
    globalThis.rv5ReadEditableText = v5Core.rv5ReadEditableText;
    globalThis.rv5InsertTextIntoEditable = v5Core.rv5InsertTextIntoEditable;

    const form = doc.createElement("div");
    form.setAttribute("data-testid", "composer");
    const ed = doc.createElement("div");
    ed.setAttribute("contenteditable", "true");
    form.appendChild(ed);
    doc.body.appendChild(form);

    const clearedKeys = [];
    const savedDrafts = {
      __new__: { text: "Старый черновик нового чата", attachments: [] },
      "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee": { text: "Ровно один раз", attachments: [] },
    };

    const panel = createStudioPanel({
      document: doc,
      window: win,
      ipcRenderer: {
        invoke: async (ch, payload) => {
          if (ch === "agy-studio:get-composer-draft") {
            await new Promise((r) => setTimeout(r, 15));
            const d = savedDrafts[payload.chatKey];
            return { ok: true, draft: d ? { text: d.text, attachments: d.attachments } : null };
          }
          if (ch === "agy-studio:clear-composer-draft") {
            clearedKeys.push(payload.chatKey);
            delete savedDrafts[payload.chatKey];
            return { ok: true };
          }
          return { ok: true };
        },
        on: () => {},
        removeListener: () => {},
      },
      telemetryEngine: createTelemetryEngine(),
      translator: createDomTranslator({ document: doc, window: win }),
      themeEngine: createThemeEngine({ document: doc, window: win }),
      buildStyles: buildStudioStyles,
      initialBoot: {
        draftTexts: {
          __new__: "Старый черновик нового чата",
          "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee": "Ровно один раз",
        },
      },
    });
    try {
      panel.init();
      await new Promise((r) => setTimeout(r, 40));
      assert.equal(v5Core.rv5ReadEditableText(ed), "Старый черновик нового чата", "Initial __new__ draft must restore once (never 2x)");

      // User erases all text via trusted Backspace + input -> must clear IMMEDIATELY without resurrection!
      emitDoc("keydown", { type: "keydown", key: "Backspace", target: ed, isTrusted: true });
      ed.textContent = "";
      ed.innerText = "";
      emitDoc("input", { type: "input", target: ed, isTrusted: true });
      assert.ok(clearedKeys.includes("__new__"), "Erasing draft to empty must invoke clear-composer-draft immediately (0ms)");
      await new Promise((r) => setTimeout(r, 120));
      assert.equal(v5Core.rv5ReadEditableText(ed), "", "Stickiness must NEVER resurrect erased __new__ draft");

      // Switch to UUID chat where both Step 0 boot cache and Step 1 IPC exist -> text must appear ONCE, never duplicated!
      win.location = { protocol: "http:", href: "http://127.0.0.1:4242/chat/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", pathname: "/chat/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", search: "", hash: "" };
      emitWin("message", { source: win, data: { __rudexVoice: "nav-change", payload: { url: "/chat/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" } } });
      await new Promise((r) => setTimeout(r, 90));
      assert.equal(v5Core.rv5ReadEditableText(ed), "Ровно один раз", "Step 0 + Step 1 draft restore must NEVER duplicate text 2x");
    } finally {
      panel.destroy();
      Object.assign(globalThis, prevV5);
    }
  }

  // 5) Quota accuracy & real-time sync:
  //    5a) extractQuotaFromRpcPayload handles >400-node payloads & binds tighter pool's resetTime
  //    5b) Streaming Connect-RPC fetch + binary Connect WebSocket emit quota-rpc immediately on chunk arrival (before EOF)
  //    5c) Limits widget renders 1-click Refresh (sync-limits-now) button & freshness tooltip
  //    5d) triggerQuotaSyncClick cloaks popover cleanly during sync and restores cleanly
  {
    const now = Date.now();
    const bigPayload = {
      padding: Array.from({ length: 420 }, (_, i) => ({ idx: i, meta: { flag: true } })),
      clientModelConfigs: [
        { label: "Gemini Flash", quotaInfo: { remainingFraction: 1.0, resetTime: new Date(now + 4.9 * 3600000).toISOString() } },
        { label: "Gemini 4 Neon", quotaInfo: { remainingFraction: 0.33, resetTime: new Date(now + 2.5 * 3600000).toISOString() } },
      ],
    };
    const ext = extractQuotaFromRpcPayload(bigPayload, now, "ru");
    assert.ok(ext && ext.gemini && ext.gemini.fiveHourRem === 33, "Large >400-node RPC payload must NOT truncate before reaching quotaInfo");
    assert.ok(ext.gemini.fiveHourReset.includes("2 ч"), `Tighter pool's resetTime must win over earlier 100% pool, got "${ext.gemini.fiveHourReset}"`);

    // Streaming Connect-RPC fetch test in VM sandbox (chunk arrives BEFORE stream finishes!)
    const vm = require("vm");
    const posted = [];
    const quotaJson = JSON.stringify({
      userStatus: {
        clientModelConfigs: [
          { label: "Gemini 4 Neon", quotaInfo: { remainingFraction: 0.31, resetTime: new Date(now + 2 * 3600000).toISOString() } },
        ],
      },
    });
    const enc = new TextEncoder().encode(quotaJson);
    const connectFrame = new Uint8Array(5 + enc.byteLength);
    connectFrame[0] = 0;
    new DataView(connectFrame.buffer).setUint32(1, enc.byteLength, false);
    connectFrame.set(enc, 5);

    let readStep = 0;
    const fakeStreamResp = {
      ok: true,
      headers: { get: (k) => (String(k).toLowerCase() === "content-type" ? "application/connect+json" : "") },
      clone() {
        return {
          body: {
            getReader() {
              return {
                read() {
                  readStep += 1;
                  if (readStep === 1) return Promise.resolve({ done: false, value: connectFrame });
                  // Stream intentionally stays OPEN forever (never resolves done:true!)
                  return new Promise(() => {});
                },
              };
            },
          },
        };
      },
    };
    class FakeQuotaWS {
      constructor(url) { this.url = url; this._l = {}; }
      addEventListener(t, fn) { (this._l[t] = this._l[t] || []).push(fn); }
      send() {}
      emit(t, ev) { for (const fn of this._l[t] || []) fn(ev); }
    }
    const sandbox = {
      WebSocket: FakeQuotaWS,
      fetch: () => Promise.resolve(fakeStreamResp),
      TextDecoder,
      TextEncoder,
      Uint8Array,
      DataView,
      ArrayBuffer,
      addEventListener: () => {},
      dispatchEvent: () => {},
      postMessage: (d) => posted.push(d),
      location: { pathname: "/", search: "", hash: "" },
      navigator: {},
    };
    const ctx = vm.createContext(sandbox);
    vm.runInContext("this.window = this;", ctx);
    vm.runInContext(buildMainWorldVoicePatchScript({ voiceEnabled: false, locale: "ru" }), ctx);

    await ctx.window.fetch("http://127.0.0.1:4242/exa.language_server_pb.LanguageServerService/StreamUserStatus");
    await new Promise((r) => setTimeout(r, 25));
    const streamEvt = posted.find((m) => m.__rudexVoice === "quota-rpc" && m.payload && m.payload.gemini && m.payload.gemini.fiveHourRem === 31);
    assert.ok(streamEvt, "Streaming application/connect+json fetch must emit quota-rpc immediately on chunk arrival without waiting for EOF");

    // Binary Connect frame over WebSocket must also emit quota-rpc
    const ws = new ctx.WebSocket("ws://127.0.0.1:4242/connect-websocket");
    ws.addEventListener("message", () => {});
    const quotaJson2 = JSON.stringify({
      clientModelConfigs: [
        { label: "Gemini 4 Neon", quotaInfo: { remainingFraction: 0.29, resetTime: new Date(now + 1.8 * 3600000).toISOString() } },
      ],
    });
    const enc2 = new TextEncoder().encode(quotaJson2);
    const frame2 = new Uint8Array(5 + enc2.byteLength);
    frame2[0] = 0;
    new DataView(frame2.buffer).setUint32(1, enc2.byteLength, false);
    frame2.set(enc2, 5);
    ws.emit("message", { data: frame2.buffer });
    const wsBinEvt = posted.find((m) => m.__rudexVoice === "quota-rpc" && m.payload && m.payload.gemini && m.payload.gemini.fiveHourRem === 29);
    assert.ok(wsBinEvt, "Binary Connect WebSocket frame on connect-websocket must emit quota-rpc");

    // Limits widget stays clean (no manual refresh button) while showing freshness in tooltip
    const qsSample = { families: { gemini: { fiveHourRem: 33, weeklyRem: 58, fiveHourReset: "2 ч 58 мин", updatedAt: now - 120000 } } };
    const cardHtml = v5Core.rv5BuildLimitsWidgetHtml({ enabled: true, layout: "card" }, qsSample, "Gemini 4 Neon", true, false);
    const pillHtml = v5Core.rv5BuildLimitsWidgetHtml({ enabled: true, layout: "pill" }, qsSample, "Gemini 4 Neon", true, false);
    assert.equal(cardHtml.includes('data-action="sync-limits-now"'), false, "Card limits widget must stay clean without manual refresh button (auto-syncs)");
    assert.equal(pillHtml.includes('data-action="sync-limits-now"'), false, "Pill limits widget must stay clean without manual refresh button (auto-syncs)");
    assert.ok(cardHtml.includes("обновлено 2 мин назад"), "Limits widget tooltip must show snapshot freshness");
  }
});
