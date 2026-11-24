"use strict";

/**
 * Antigravity Russian DOM Localization Engine (React-safe, browser-only).
 * Zero Node.js imports so it can run directly inside Electron's sandboxed preload.js
 * as well as under simulated DOM unit tests in Node.
 */
function createDomTranslator(options) {
  const doc = options.document;
  const win = options.window || (doc && doc.defaultView) || {};
  const rawDict = options.dictionary || {};
  const applyDynamic = options.applyDynamicRules || (() => null);
  let currentLocale = options.initialLocale === "en" ? "en" : "ru";

  function normalizePunct(str) {
    return String(str)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2026/g, "...")
      .replace(/\s+/g, " ")
      .trim();
  }

  // O(1) lookup maps: exact trimmed string, punctuation/whitespace-normalized, and safe lowercase fallback
  const exactMap = new Map();
  const punctMap = new Map();
  const lowerMap = new Map();
  for (const key in rawDict) {
    if (!Object.prototype.hasOwnProperty.call(rawDict, key)) continue;
    const val = rawDict[key];
    if (typeof val !== "string" || !val || val === "__KEEP__") continue;
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;
    exactMap.set(trimmedKey, val);
    const norm = normalizePunct(trimmedKey);
    if (!punctMap.has(norm)) {
      punctMap.set(norm, val);
    }
    if (trimmedKey.length >= 4) {
      const low = norm.toLowerCase();
      if (!lowerMap.has(low)) {
        lowerMap.set(low, val);
      }
    }
  }

  // Tracking maps for lossless live switching and loop prevention
  const textOriginals = new WeakMap();
  const textLastWritten = new WeakMap();
  const attrOriginals = new WeakMap();
  const attrLastWritten = new WeakMap();

  let originalDocTitle = null;
  let lastWrittenDocTitle = null;

  const HARD_EXCLUDED_TAGS = new Set([
    "CODE",
    "PRE",
    "KBD",
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "SVG",
    "TEXTAREA",
    "INPUT",
  ]);

  const HARD_EXCLUDED_TESTIDS = new Set([
    "code-gutter",
    "code-gutter-diff",
    "diff-gutter-strip",
    "vcs-commit-message",
    "webview-download-filename",
    "webview-prompt-origin",
  ]);

  const CONTENT_CONTAINER_TESTIDS = new Set([
    "user-message-content",
    "user-message-bubble",
  ]);

  const CHROME_INSIDE_CONTENT_TESTIDS = new Set([
    "user-message-actions",
    "markdown-table-menu",
    "markdown-table-copy-markdown",
    "markdown-table-width-toggle",
    "code-block-preview-button",
    "code-block-raw-button",
  ]);

  const TRANSLATABLE_ATTRS = ["placeholder", "data-placeholder", "title", "aria-label", "alt"];

  function getAttrSafe(el, name) {
    if (!el || typeof el.getAttribute !== "function") return null;
    return el.getAttribute(name);
  }

  function hasClassSafe(el, cls) {
    if (!el) return false;
    if (el.classList && typeof el.classList.contains === "function") {
      return el.classList.contains(cls);
    }
    const c = getAttrSafe(el, "class");
    return typeof c === "string" && c.split(/\s+/).includes(cls);
  }

  function isHardExcludedElement(el, skipInputTextareaTagCheck) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName ? el.tagName.toUpperCase() : "";
    if (!skipInputTextareaTagCheck && HARD_EXCLUDED_TAGS.has(tag)) {
      return true;
    }
    if (skipInputTextareaTagCheck && (tag === "CODE" || tag === "PRE" || tag === "KBD" || tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "SVG")) {
      return true;
    }
    const ce = getAttrSafe(el, "contenteditable");
    if (ce === "true" || ce === "") return true;
    if (hasClassSafe(el, "xterm") || hasClassSafe(el, "monaco-editor") || hasClassSafe(el, "katex") || hasClassSafe(el, "mermaid")) {
      return true;
    }
    const tid = getAttrSafe(el, "data-testid");
    if (tid && HARD_EXCLUDED_TESTIDS.has(tid)) return true;
    return false;
  }

  function isChromeInsideContent(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName ? el.tagName.toUpperCase() : "";
    if (tag === "BUTTON") return true;
    const role = getAttrSafe(el, "role");
    if (role === "menuitem" || role === "tooltip") return true;
    const tid = getAttrSafe(el, "data-testid");
    if (tid && CHROME_INSIDE_CONTENT_TESTIDS.has(tid)) return true;
    return false;
  }

  function isContentContainer(el) {
    if (!el || el.nodeType !== 1) return false;
    if (hasClassSafe(el, "markdown-root")) return true;
    const tid = getAttrSafe(el, "data-testid");
    if (tid && CONTENT_CONTAINER_TESTIDS.has(tid)) return true;
    return false;
  }

  function isExcludedForText(node) {
    let el = node.nodeType === 1 ? node : node.parentElement || node.parentNode;
    let sawInteractiveChrome = false;
    while (el && el.nodeType === 1) {
      if (isHardExcludedElement(el, false)) {
        return true;
      }
      if (isChromeInsideContent(el)) {
        sawInteractiveChrome = true;
      }
      if (isContentContainer(el)) {
        if (!sawInteractiveChrome) {
          return true;
        }
      }
      el = el.parentElement || el.parentNode;
    }
    return false;
  }

  function isExcludedForAttributes(el) {
    if (!el || el.nodeType !== 1) return true;
    // Allow INPUT and TEXTAREA themselves to get placeholder/aria-label/title translated,
    // unless nested inside code/editor/terminal/content container.
    let cur = el;
    let sawInteractiveChrome = false;
    let first = true;
    while (cur && cur.nodeType === 1) {
      if (isHardExcludedElement(cur, first)) {
        return true;
      }
      if (isChromeInsideContent(cur)) {
        sawInteractiveChrome = true;
      }
      if (isContentContainer(cur)) {
        if (!sawInteractiveChrome) {
          return true;
        }
      }
      first = false;
      cur = cur.parentElement || cur.parentNode;
    }
    return false;
  }

  function shouldSkipString(trimmed) {
    if (!trimmed || trimmed.length < 2) return true;
    if (!/[A-Za-z]{2,}/.test(trimmed) && !/^\d+(?:s|m|h|d|w|y)$/i.test(trimmed)) return true;
    if (/^(?:https?:|wss?:|ws:|file:|mailto:|data:|blob:)/i.test(trimmed)) return true;
    if (/^[A-Za-z]:\\/.test(trimmed)) return true;
    if (/^\/(?:Users|home|var|etc|tmp|usr|opt|mnt|Volumes|Applications|System|Library)(?:\/|$)/.test(trimmed)) return true;
    if (/^[a-z0-9_.-]+\.(?:js|ts|tsx|jsx|css|html|json|md|py|go|rs|pb|png|svg|exe|dll|sh|ps1|yml|yaml|toml|lock)$/i.test(trimmed)) return true;
    return false;
  }

  function translateTrimmed(trimmed) {
    if (shouldSkipString(trimmed)) return null;
    const direct = exactMap.get(trimmed);
    if (direct !== undefined) return direct;
    const norm = normalizePunct(trimmed);
    const fromPunct = punctMap.get(norm);
    if (fromPunct !== undefined) return fromPunct;
    const dynDirect = applyDynamic(trimmed);
    if (dynDirect) return dynDirect;
    if (norm !== trimmed) {
      const dynNorm = applyDynamic(norm);
      if (dynNorm) return dynNorm;
    }
    if (trimmed.length >= 4) {
      const fromLower = lowerMap.get(norm.toLowerCase());
      if (fromLower !== undefined) return fromLower;
    }
    return null;
  }

  function translatePreservingWhitespace(raw) {
    if (typeof raw !== "string" || !raw) return null;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
    if (!m) return null;
    const lead = m[1];
    const core = m[2];
    const tail = m[3];
    if (!core) return null;
    const translated = translateTrimmed(core);
    if (translated === "__EMPTY__") return "";
    if (!translated || translated === core) return null;
    return lead + translated + tail;
  }

  function getOriginalText(node) {
    const val = node.nodeValue || "";
    const last = textLastWritten.get(node);
    if (!textOriginals.has(node)) {
      textOriginals.set(node, val);
      return val;
    }
    // If React mutated the text node outside our translator, treat new value as fresh original
    if (last !== undefined && val !== last && val !== textOriginals.get(node)) {
      textOriginals.set(node, val);
      return val;
    }
    return textOriginals.get(node);
  }

  function applyTextNodeValue(node, nextVal) {
    if (node.nodeValue !== nextVal) {
      textLastWritten.set(node, nextVal);
      node.nodeValue = nextVal;
    } else {
      textLastWritten.set(node, nextVal);
    }
  }

  function tryTranslateSplitTextElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (!el.childNodes || el.childNodes.length < 2) return false;
    if (isExcludedForText(el)) return false;

    const textNodes = [];
    for (let i = 0; i < el.childNodes.length; i++) {
      const ch = el.childNodes[i];
      if (ch.nodeType !== 3) return false;
      textNodes.push(ch);
    }

    const originals = textNodes.map((n) => getOriginalText(n));
    const joined = originals.join("");
    if (currentLocale === "en") {
      for (let i = 0; i < textNodes.length; i++) {
        applyTextNodeValue(textNodes[i], originals[i]);
      }
      return true;
    }

    const translatedJoined = translatePreservingWhitespace(joined);
    if (!translatedJoined) {
      // Fall back to per-node translation
      return false;
    }

    // Mutate only nodeValue on existing Text nodes; never add/remove nodes
    applyTextNodeValue(textNodes[0], translatedJoined);
    for (let i = 1; i < textNodes.length; i++) {
      applyTextNodeValue(textNodes[i], "");
    }
    return true;
  }

  function processTextNode(node) {
    if (!node || node.nodeType !== 3) return;

    const parent = node.parentElement || node.parentNode;
    if (parent && parent.nodeType === 1 && parent.childNodes && parent.childNodes.length >= 2) {
      if (tryTranslateSplitTextElement(parent)) {
        return;
      }
    }

    if (isExcludedForText(node)) return;
    const orig = getOriginalText(node);
    if (currentLocale === "en") {
      applyTextNodeValue(node, orig);
      return;
    }
    const nextVal = translatePreservingWhitespace(orig);
    if (nextVal !== null) {
      applyTextNodeValue(node, nextVal);
    }
  }

  function processElementAttributes(el) {
    if (!el || el.nodeType !== 1) return;
    if (isExcludedForAttributes(el)) return;

    let origMap = attrOriginals.get(el);
    let lastMap = attrLastWritten.get(el);

    for (let i = 0; i < TRANSLATABLE_ATTRS.length; i++) {
      const attr = TRANSLATABLE_ATTRS[i];
      const cur = getAttrSafe(el, attr);
      if (cur === null || cur === "") continue;

      if (!origMap) {
        origMap = new Map();
        attrOriginals.set(el, origMap);
      }
      if (!lastMap) {
        lastMap = new Map();
        attrLastWritten.set(el, lastMap);
      }

      const prevLast = lastMap.get(attr);
      if (!origMap.has(attr) || (prevLast !== undefined && cur !== prevLast && cur !== origMap.get(attr))) {
        origMap.set(attr, cur);
      }
      const orig = origMap.get(attr);

      if (currentLocale === "en") {
        if (cur !== orig) {
          lastMap.set(attr, orig);
          el.setAttribute(attr, orig);
        }
      } else {
        const nextVal = translatePreservingWhitespace(orig);
        if (nextVal !== null && cur !== nextVal) {
          lastMap.set(attr, nextVal);
          el.setAttribute(attr, nextVal);
        }
      }
    }
  }

  function processDocumentTitle() {
    if (!doc || typeof doc.title !== "string") return;
    const cur = doc.title;
    if (originalDocTitle === null || (lastWrittenDocTitle !== null && cur !== lastWrittenDocTitle && cur !== originalDocTitle)) {
      originalDocTitle = cur;
    }
    if (currentLocale === "en") {
      if (originalDocTitle !== null && cur !== originalDocTitle) {
        lastWrittenDocTitle = originalDocTitle;
        doc.title = originalDocTitle;
      }
      return;
    }
    const nextTitle = translatePreservingWhitespace(originalDocTitle);
    if (nextTitle !== null && cur !== nextTitle) {
      lastWrittenDocTitle = nextTitle;
      doc.title = nextTitle;
    }
  }

  function walkSubtree(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      processTextNode(root);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;

    if (root.nodeType === 1) {
      processElementAttributes(root);
      if (root.shadowRoot) {
        walkSubtree(root.shadowRoot);
      }
      if (root.childNodes && root.childNodes.length >= 2) {
        if (tryTranslateSplitTextElement(root)) {
          return;
        }
      }
    }

    const children = root.childNodes;
    if (!children) return;
    for (let i = 0; i < children.length; i++) {
      walkSubtree(children[i]);
    }
  }

  // Mutation batching queue
  const pendingNodes = new Set();
  const pendingAttrElements = new Set();
  let flushScheduled = false;
  let observer = null;

  function flushPending() {
    flushScheduled = false;
    const nodes = Array.from(pendingNodes);
    const attrs = Array.from(pendingAttrElements);
    pendingNodes.clear();
    pendingAttrElements.clear();

    for (let i = 0; i < attrs.length; i++) {
      processElementAttributes(attrs[i]);
    }
    for (let i = 0; i < nodes.length; i++) {
      walkSubtree(nodes[i]);
    }
    processDocumentTitle();
  }

  function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    if (typeof queueMicrotask === "function") {
      queueMicrotask(flushPending);
    } else {
      Promise.resolve().then(flushPending);
    }
  }

  function startObserver() {
    if (observer || typeof win.MutationObserver !== "function" && typeof MutationObserver !== "function") {
      return;
    }
    const MO = win.MutationObserver || MutationObserver;
    observer = new MO((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === "characterData") {
          const t = m.target;
          if (t && t.nodeType === 3) {
            if (textLastWritten.get(t) === t.nodeValue) continue;
            pendingNodes.add(t);
          }
        } else if (m.type === "attributes") {
          const el = m.target;
          if (el && el.nodeType === 1) {
            const lastMap = attrLastWritten.get(el);
            const attrName = m.attributeName;
            if (lastMap && attrName && lastMap.get(attrName) === getAttrSafe(el, attrName)) {
              continue;
            }
            pendingAttrElements.add(el);
          }
        } else if (m.type === "childList") {
          if (m.target && m.target.nodeType === 1 && m.target.tagName === "TITLE") {
            scheduleFlush();
          }
          if (m.addedNodes) {
            for (let j = 0; j < m.addedNodes.length; j++) {
              pendingNodes.add(m.addedNodes[j]);
            }
          }
          if (m.target && m.target.nodeType === 1 && m.target.childNodes && m.target.childNodes.length >= 2) {
            pendingNodes.add(m.target);
          }
        }
      }
      if (pendingNodes.size > 0 || pendingAttrElements.size > 0) {
        scheduleFlush();
      }
    });

    const target = doc.documentElement || doc.body || doc;
    if (target) {
      observer.observe(target, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: TRANSLATABLE_ATTRS,
      });
    }
  }

  function translateDocument() {
    if (!doc) return;
    if (doc.documentElement && typeof doc.documentElement.setAttribute === "function") {
      doc.documentElement.setAttribute("lang", currentLocale);
    }
    const root = doc.body || doc.documentElement;
    if (root) {
      walkSubtree(root);
    }
    processDocumentTitle();
  }

  function setLocale(nextLocale) {
    const normalized = nextLocale === "en" ? "en" : "ru";
    if (normalized === currentLocale) return;
    currentLocale = normalized;
    if (doc && doc.documentElement && typeof doc.documentElement.setAttribute === "function") {
      doc.documentElement.setAttribute("lang", currentLocale);
    }
    translateDocument();
  }

  function getLocale() {
    return currentLocale;
  }

  function init() {
    translateDocument();
    startObserver();
  }

  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  return {
    init,
    destroy,
    setLocale,
    getLocale,
    translateDocument,
    translatePreservingWhitespace,
    walkSubtree,
    processTextNode,
    processElementAttributes,
    isExcludedForText,
    isExcludedForAttributes,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { createDomTranslator };
}
