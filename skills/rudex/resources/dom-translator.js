"use strict";

/**
 * Rudex DOM Localization & Custom Greeting Engine (React-safe, browser-only).
 * Zero Node.js imports so it can run directly inside Electron's sandboxed preload.js
 * as well as under simulated DOM unit tests in Node.
 */
const DEFAULT_GREETING_CONFIG = {
  enabled: false,
  mode: "time-of-day", // "time-of-day" | "custom" | "minimal"
  title: "",
  subtitle: "",
  displayName: "",
  placeholder: "",
};

function normalizeGreetingConfig(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const mode = src.mode === "custom" || src.mode === "minimal" ? src.mode : "time-of-day";
  return {
    enabled: Boolean(src.enabled),
    mode,
    title: typeof src.title === "string" ? src.title.slice(0, 160) : "",
    subtitle: typeof src.subtitle === "string" ? src.subtitle.slice(0, 180) : "",
    displayName: typeof src.displayName === "string" ? src.displayName.slice(0, 60) : "",
    placeholder: typeof src.placeholder === "string" ? src.placeholder.slice(0, 140) : "",
  };
}

function createDomTranslator(options) {
  const doc = options.document;
  const win = options.window || (doc && doc.defaultView) || {};
  const rawDict = options.dictionary || {};
  const applyDynamic = options.applyDynamicRules || (() => null);
  let currentLocale = options.initialLocale === "en" ? "en" : "ru";
  let greetingConfig = normalizeGreetingConfig(options.initialGreeting);
  let capturedUserName = "";

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
    "file-title-name",
    "branch-pill-label",
    "branch-repo-label",
    "ssh-host-label",
    "url-security-host",
    "voice-picker-name",
    "voice-settings-name",
    "plugin-detail-footer-author",
    "plugin-detail-footer-version",
    "automation-name",
    "coordinator-card-title",
    "coordinator-settings-name",
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
  const COMPOSER_PLACEHOLDER_RE = /^Ask anything(?:,\s*@ to mention(?:,\s*\/ for (?:actions|workflows))?)?$/i;

  function getAttrSafe(el, name) {
    if (!el || typeof el.getAttribute !== "function") return null;
    return el.getAttribute(name);
  }

  function setAttrSafe(el, name, val) {
    if (!el || typeof el.setAttribute !== "function") return;
    if (getAttrSafe(el, name) !== val) el.setAttribute(name, val);
  }

  function removeAttrSafe(el, name) {
    if (!el || typeof el.removeAttribute !== "function") return;
    if (typeof el.hasAttribute !== "function" || el.hasAttribute(name)) {
      el.removeAttribute(name);
    }
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
    if (
      el.id === "rudex-studio-host" ||
      el.id === "agy-ru-studio-host" ||
      getAttrSafe(el, "data-rudex-ignore") === "1" ||
      getAttrSafe(el, "data-agy-ru-ignore") === "1"
    ) {
      return true;
    }
    const tag = el.tagName ? el.tagName.toUpperCase() : "";
    if (!skipInputTextareaTagCheck && HARD_EXCLUDED_TAGS.has(tag)) {
      return true;
    }
    if (skipInputTextareaTagCheck && (tag === "CODE" || tag === "PRE" || tag === "KBD" || tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "SVG")) {
      return true;
    }
    const ce = getAttrSafe(el, "contenteditable");
    if (!skipInputTextareaTagCheck && (ce === "true" || ce === "")) return true;
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
    if (hasClassSafe(el, "markdown-root") || getAttrSafe(el, "data-markdown-root") !== null) return true;
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

  function getTimeGreeting(locale, dateObj) {
    const h = (dateObj || new Date()).getHours();
    if (locale === "en") {
      if (h >= 5 && h < 12) return "Good morning";
      if (h >= 12 && h < 18) return "Good afternoon";
      if (h >= 18 && h < 23) return "Good evening";
      return "Good night";
    }
    if (h >= 5 && h < 12) return "Доброе утро";
    if (h >= 12 && h < 18) return "Добрый день";
    if (h >= 18 && h < 23) return "Добрый вечер";
    return "Доброй ночи";
  }

  function resolveGreetingTemplate(template, nameVal, locale, nowDate) {
    const d = nowDate || new Date();
    const locTag = locale === "en" ? "en-US" : "ru-RU";
    const timeStr = getTimeGreeting(locale, d);
    let dateStr = "";
    let weekdayStr = "";
    try {
      dateStr = d.toLocaleDateString(locTag, { day: "numeric", month: "long" });
      weekdayStr = d.toLocaleDateString(locTag, { weekday: "long" });
    } catch (_e) {
      dateStr = d.toISOString().slice(0, 10);
    }

    let out = String(template || "");
    const cleanName = String(nameVal || "").trim();
    if (cleanName) {
      out = out.replace(/\{name\}/gi, cleanName);
    } else {
      out = out
        .replace(/,\s*\{name\}/gi, "")
        .replace(/\s+\{name\}/gi, "")
        .replace(/\{name\}\s*,\s*/gi, "")
        .replace(/\{name\}/gi, "");
    }
    out = out
      .replace(/\{time\}/gi, timeStr)
      .replace(/\{date\}/gi, dateStr)
      .replace(/\{weekday\}/gi, weekdayStr)
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,!?.])/g, "$1")
      .trim();
    return out;
  }

  function matchHeroGreeting(trimmed, parentEl) {
    const norm = normalizePunct(trimmed);
    let m;
    if ((m = /^Hey ([^,\n]+?), what should we build today\?$/i.exec(norm))) {
      const candidate = m[1].trim();
      const name = /^there$/i.test(candidate) ? "" : candidate;
      return { matched: true, name };
    }
    if (/^What should we build today\?$/i.test(norm)) {
      return { matched: true, name: "" };
    }
    if ((m = /^Welcome back,\s*([^.\n]+?)\.\s*Where should we pick up\?$/i.exec(norm))) {
      return { matched: true, name: m[1].trim() };
    }
    if (/^Welcome back\.\s*Where should we pick up\?$/i.test(norm)) {
      return { matched: true, name: "" };
    }
    if ((m = /^Good to see you,\s*([^.\n]+?)\.\s*What's next\?$/i.exec(norm))) {
      return { matched: true, name: m[1].trim() };
    }
    if (/^Good to see you\.\s*What's next\?$/i.test(norm)) {
      return { matched: true, name: "" };
    }
    if (parentEl && parentEl.tagName && /^(H1|H2|H3)$/i.test(parentEl.tagName)) {
      if ((m = /^(?:Hey|Hello),?\s+([^!?\n]{1,48})!$/i.exec(norm))) {
        const candidate = m[1].trim();
        if (!/^(?:there|world)$/i.test(candidate)) {
          return { matched: true, name: candidate };
        }
      }
    }
    return { matched: false, name: "" };
  }

  function ensureGreetingStyleNode(active) {
    if (!doc || typeof doc.getElementById !== "function") return;
    const existing = doc.getElementById("rudex-greeting-style");
    if (!active) {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }
    if (existing) return;
    if (typeof doc.createElement !== "function") return;
    const style = doc.createElement("style");
    style.id = "rudex-greeting-style";
    style.setAttribute("data-rudex-ignore", "1");
    style.textContent = [
      '[data-rudex-greeting="1"][data-rudex-subtitle]::after {',
      "  content: attr(data-rudex-subtitle);",
      "  display: block;",
      "  font-size: 0.44em;",
      "  font-weight: 400;",
      "  opacity: 0.64;",
      "  margin-top: 6px;",
      "  letter-spacing: 0;",
      "  line-height: 1.4;",
      "}",
    ].join("\n");
    const target = doc.head || doc.documentElement || doc.body;
    if (target && typeof target.appendChild === "function") {
      target.appendChild(style);
    }
  }

  function clearAllGreetingAttrs() {
    ensureGreetingStyleNode(false);
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    try {
      const list = doc.querySelectorAll('[data-rudex-greeting="1"]');
      for (let i = 0; i < list.length; i += 1) {
        removeAttrSafe(list[i], "data-rudex-greeting");
        removeAttrSafe(list[i], "data-rudex-subtitle");
      }
    } catch (_e) {}
  }

  function resolveCustomGreetingForMatch(matchInfo) {
    if (matchInfo.name) {
      capturedUserName = matchInfo.name;
    }
    if (!greetingConfig.enabled) return null;
    const nameVal = greetingConfig.displayName.trim() || matchInfo.name || capturedUserName;
    const nowDate = new Date();
    let rawTitle = greetingConfig.title.trim();
    if (!rawTitle) {
      if (greetingConfig.mode === "minimal") {
        rawTitle = currentLocale === "en" ? "Ready." : "Готов к работе.";
      } else {
        rawTitle = nameVal ? "{time}, {name}" : "{time}";
      }
    }
    const titleText = resolveGreetingTemplate(rawTitle, nameVal, currentLocale, nowDate);
    const subRaw = greetingConfig.subtitle.trim();
    const subtitleText = subRaw ? resolveGreetingTemplate(subRaw, nameVal, currentLocale, nowDate) : "";
    return {
      titleText: titleText || rawTitle,
      subtitleText,
    };
  }

  function applyGreetingAttrs(parentEl, greetingRes) {
    if (!parentEl || parentEl.nodeType !== 1) return;
    if (greetingRes && greetingConfig.enabled) {
      setAttrSafe(parentEl, "data-rudex-greeting", "1");
      if (greetingRes.subtitleText) {
        ensureGreetingStyleNode(true);
        setAttrSafe(parentEl, "data-rudex-subtitle", greetingRes.subtitleText);
      } else {
        removeAttrSafe(parentEl, "data-rudex-subtitle");
      }
    } else if (getAttrSafe(parentEl, "data-rudex-greeting") === "1") {
      removeAttrSafe(parentEl, "data-rudex-greeting");
      removeAttrSafe(parentEl, "data-rudex-subtitle");
    }
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
    if (trimmed.length >= 4 && !/^[a-z][a-z0-9_-]*$/.test(trimmed)) {
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

  function wrapWhitespace(raw, nextCore) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
    if (!m) return nextCore;
    return m[1] + nextCore + m[3];
  }

  function getOriginalText(node) {
    const val = node.nodeValue || "";
    const last = textLastWritten.get(node);
    if (!textOriginals.has(node)) {
      textOriginals.set(node, val);
      return val;
    }
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
    const core = joined.trim();
    const gMatch = core ? matchHeroGreeting(core, el) : { matched: false, name: "" };

    if (gMatch.matched) {
      const customRes = resolveCustomGreetingForMatch(gMatch);
      if (customRes && greetingConfig.enabled) {
        applyGreetingAttrs(el, customRes);
        applyTextNodeValue(textNodes[0], wrapWhitespace(joined, customRes.titleText));
        for (let i = 1; i < textNodes.length; i++) applyTextNodeValue(textNodes[i], "");
        return true;
      }
      applyGreetingAttrs(el, null);
    }

    if (currentLocale === "en") {
      for (let i = 0; i < textNodes.length; i++) {
        applyTextNodeValue(textNodes[i], originals[i]);
      }
      return true;
    }

    const translatedJoined = translatePreservingWhitespace(joined);
    if (!translatedJoined) {
      return false;
    }

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
    const core = orig.trim();
    const gMatch = core ? matchHeroGreeting(core, parent) : { matched: false, name: "" };

    if (gMatch.matched) {
      const customRes = resolveCustomGreetingForMatch(gMatch);
      if (customRes && greetingConfig.enabled) {
        applyGreetingAttrs(parent, customRes);
        applyTextNodeValue(node, wrapWhitespace(orig, customRes.titleText));
        return;
      }
      applyGreetingAttrs(parent, null);
    }

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

      if (
        (attr === "placeholder" || attr === "data-placeholder") &&
        greetingConfig.enabled &&
        greetingConfig.placeholder.trim() &&
        COMPOSER_PLACEHOLDER_RE.test(orig.trim())
      ) {
        const nextPh = greetingConfig.placeholder.trim();
        if (cur !== nextPh) {
          lastMap.set(attr, nextPh);
          el.setAttribute(attr, nextPh);
        }
        continue;
      }

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
    if (observer || (typeof win.MutationObserver !== "function" && typeof MutationObserver !== "function")) {
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
    if (!greetingConfig.enabled) {
      clearAllGreetingAttrs();
    }
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

  function setGreetingConfig(nextCfg) {
    greetingConfig = normalizeGreetingConfig(nextCfg);
    if (!greetingConfig.enabled || !greetingConfig.subtitle.trim()) {
      clearAllGreetingAttrs();
    }
    translateDocument();
  }

  function getGreetingConfig() {
    return Object.assign({}, greetingConfig);
  }

  function getCapturedUserName() {
    return capturedUserName;
  }

  function getLocale() {
    return currentLocale;
  }

  function init() {
    translateDocument();
    startObserver();
  }

  function destroy() {
    clearAllGreetingAttrs();
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
    setGreetingConfig,
    getGreetingConfig,
    getCapturedUserName,
    resolveGreetingTemplate,
    getTimeGreeting,
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
  module.exports = {
    createDomTranslator,
    DEFAULT_GREETING_CONFIG,
    normalizeGreetingConfig,
  };
}
