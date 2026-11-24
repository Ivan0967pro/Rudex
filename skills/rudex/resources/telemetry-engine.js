"use strict";

/**
 * Rudex Pure Telemetry & Token Estimation Engine (browser-safe & Node-testable).
 * Zero Node.js imports so it runs directly inside Electron's sandboxed preload.js
 * as well as under Node unit tests.
 */

const TEL_CODE_PUNCT_CHARS = "{}[]()=<>:;,./\\|+-*&^%$#@!~`";
const TEL_CODE_PUNCT_TABLE = new Uint8Array(128);
for (let i = 0; i < TEL_CODE_PUNCT_CHARS.length; i += 1) {
  const code = TEL_CODE_PUNCT_CHARS.charCodeAt(i);
  if (code < 128) TEL_CODE_PUNCT_TABLE[code] = 1;
}

const TEL_SKIPPED_TAGS = new Set([
  "DETAILS",
  "BUTTON",
  "SVG",
  "STYLE",
  "SCRIPT",
  "NOSCRIPT",
]);

const TEL_THINKING_RE = /(?:Thought|Thinking|Думал|Думает)[^0-9]{0,12}(\d+(?:[.,]\d+)?)\s*(?:s|с)/i;

/**
 * Fast single-pass O(n) char-code token estimator with script/code buckets.
 */
function estimateTokensFloat(text) {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;

  let cjkCount = 0;
  let cyrCount = 0;
  let otherNonAscii = 0;
  let codePunctCount = 0;
  let digitCount = 0;
  let asciiOtherCount = 0;

  for (let i = 0; i < trimmed.length; i += 1) {
    const c = trimmed.charCodeAt(i);
    if (c > 127) {
      if (
        (c >= 0x3000 && c <= 0x9fff) ||
        (c >= 0xac00 && c <= 0xd7af) ||
        (c >= 0xf900 && c <= 0xfaff)
      ) {
        cjkCount += 1;
      } else if (c >= 0x0400 && c <= 0x04ff) {
        cyrCount += 1;
      } else {
        otherNonAscii += 1;
      }
    } else if (c >= 48 && c <= 57) {
      digitCount += 1;
    } else if (TEL_CODE_PUNCT_TABLE[c] === 1) {
      codePunctCount += 1;
    } else {
      asciiOtherCount += 1;
    }
  }

  return (
    cjkCount / 1.5 +
    cyrCount / 3.0 +
    otherNonAscii / 2.2 +
    codePunctCount / 2.4 +
    digitCount / 2.5 +
    asciiOtherCount / 4.0
  );
}

/**
 * Integer token estimate rounded from float estimate (>= 1 when non-empty).
 */
function estimateTokens(text) {
  const f = estimateTokensFloat(text);
  return f > 0 ? Math.max(1, Math.round(f)) : 0;
}

function telGetAttr(node, name) {
  if (!node || typeof node.getAttribute !== "function") return null;
  try {
    return node.getAttribute(name);
  } catch (_e) {
    return null;
  }
}

function telHasAttr(node, name) {
  if (!node) return false;
  if (typeof node.hasAttribute === "function") {
    try {
      return Boolean(node.hasAttribute(name));
    } catch (_e) {
      return false;
    }
  }
  return telGetAttr(node, name) !== null;
}

function telIsElementNode(node) {
  if (!node) return false;
  if (node.nodeType === 1) return true;
  return node.nodeType == null && typeof node.tagName === "string";
}

function telIsSkippedElement(node) {
  if (!telIsElementNode(node)) return false;
  const tag = String(node.tagName || "").toUpperCase();
  if (TEL_SKIPPED_TAGS.has(tag)) return true;
  const role = telGetAttr(node, "role");
  if (role && String(role).toLowerCase() === "button") return true;
  if (telHasAttr(node, "hidden") || node.hidden === true) return true;
  if (telGetAttr(node, "aria-hidden") === "true") return true;
  if (telGetAttr(node, "data-rudex-ignore") === "1") return true;
  if (telGetAttr(node, "data-agy-ru-ignore") === "1") return true;
  return false;
}

function telHasSkippedAncestor(node, stopAt) {
  let cur = node;
  while (cur && cur !== stopAt) {
    if (telIsElementNode(cur) && telIsSkippedElement(cur)) return true;
    cur = cur.parentNode;
  }
  return false;
}

function telHasMarkdownRootAncestor(node, stopAt) {
  let cur = node;
  while (cur && cur !== stopAt) {
    if (telIsElementNode(cur) && telHasAttr(cur, "data-markdown-root")) return true;
    cur = cur.parentNode;
  }
  return false;
}

function telCollectVisibleText(node, chunks) {
  if (!node) return;
  if (node.nodeType === 3) {
    const val = node.nodeValue;
    if (val) chunks.push(val);
    return;
  }
  if (telIsElementNode(node)) {
    if (telIsSkippedElement(node)) return;
    const children = node.childNodes;
    if (children && typeof children.length === "number") {
      for (let i = 0; i < children.length; i += 1) {
        telCollectVisibleText(children[i], chunks);
      }
    } else if (typeof node.textContent === "string") {
      chunks.push(node.textContent);
    }
    return;
  }
  if (node.nodeType === 11 && node.childNodes) {
    const children = node.childNodes;
    for (let i = 0; i < children.length; i += 1) {
      telCollectVisibleText(children[i], chunks);
    }
  }
}

/**
 * Layout-free visible response text extractor (never reads layout-triggering properties).
 */
function extractVisibleResponseText(el) {
  if (!el) return "";
  if (telIsSkippedElement(el)) return "";
  try {
    const mdRoots = typeof el.querySelectorAll === "function"
      ? el.querySelectorAll("[data-markdown-root]")
      : null;
    if (mdRoots && mdRoots.length > 0) {
      const parts = [];
      for (let i = 0; i < mdRoots.length; i += 1) {
        const md = mdRoots[i];
        if (!md || telHasSkippedAncestor(md, el) || telHasMarkdownRootAncestor(md.parentNode, el)) {
          continue;
        }
        const chunks = [];
        telCollectVisibleText(md, chunks);
        const txt = chunks.join("");
        if (txt) parts.push(txt);
      }
      return parts.join("\n");
    }
  } catch (_e) {
    // Fall back to direct subtree walk below
  }
  if (el.nodeType == null && !el.childNodes && typeof el.textContent === "string") {
    return el.textContent;
  }
  const chunks = [];
  telCollectVisibleText(el, chunks);
  return chunks.join("");
}

function telGetRawNodeText(node) {
  if (!node) return "";
  if (typeof node.textContent === "string") return node.textContent;
  if (node.nodeType === 3) return node.nodeValue || "";
  const children = node.childNodes;
  if (!children || typeof children.length !== "number") return "";
  let out = "";
  for (let i = 0; i < children.length; i += 1) {
    out += telGetRawNodeText(children[i]);
  }
  return out;
}

/**
 * Extracts reported thinking duration (seconds) only from summary/h6 chrome outside markdown roots.
 */
function extractThinkingSeconds(lastRespEl) {
  if (!lastRespEl || typeof lastRespEl.querySelectorAll !== "function") return 0;
  try {
    const nodes = lastRespEl.querySelectorAll("summary, h6");
    if (!nodes || nodes.length === 0) return 0;
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (!node || telHasMarkdownRootAncestor(node, lastRespEl)) continue;
      const txt = telGetRawNodeText(node);
      if (!txt) continue;
      const m = TEL_THINKING_RE.exec(txt);
      if (m) {
        const sec = parseFloat(m[1].replace(",", "."));
        if (Number.isFinite(sec) && sec > 0) return sec;
      }
    }
    return 0;
  } catch (_e) {
    return 0;
  }
}

function telToNonNegInt(val) {
  return typeof val === "number" && Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
}

function telToNonNegFloat(val) {
  return typeof val === "number" && Number.isFinite(val) && val > 0
    ? Math.round(val * 100) / 100
    : 0;
}

function telIsBogusSpikeEntry(h) {
  if (!h) return false;
  if (h.avgTps >= 500 || h.peakTps >= 900) return true;
  if (h.durSec <= 0.3 && h.tokens <= 10 && h.avgTps >= 20) return true;
  return false;
}

/**
 * Creates a fresh runtime telemetry state object.
 */
function createEmptyTelemetry() {
  return {
    isGenerating: false,
    phase: "idle",
    currentTps: 0,
    lastAvgTps: 0,
    peakTps: 0,
    lastDurSec: 0,
    lastThinkingSec: 0,
    respTokens: 0,
    chatTokens: 0,
    exactRespTokens: 0,
    exactContextTokens: 0,
    exactCacheTokens: 0,
    contextLabel: "",
    modelName: "",
    samples: [],
    history: [],
    turnStartMs: 0,
    firstGrowthAt: 0,
    lastGrowthAt: 0,
    preTokenAt: 0,
    seedSliceMs: 0,
    activeStreamMs: 0,
    lastSparkAt: 0,
    turnStartFloatTok: 0,
    prevFloatTok: 0,
    highWaterBubbleTok: 0,
    bankedTurnTokens: 0,
    activeRespEl: null,
    prevRespCount: 0,
    prevUserCount: 0,
    firstUserNorm: "",
    unconfirmedGrowthTicks: 0,
    unconfirmedFirstTok: 0,
    growthTicks: 0,
    tpsWindow: [],
    wasGenerating: false,
    dirty: false,
  };
}

/**
 * Sanitizes a persisted telemetry record and strips bogus legacy hydration spikes.
 */
function sanitizeTelemetryRecord(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  let samples = Array.isArray(src.samples)
    ? src.samples
        .filter((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n < 900)
        .slice(-24)
        .map((n) => Math.round(n))
    : [];

  const history = Array.isArray(src.history)
    ? src.history
        .filter((h) => h && typeof h === "object")
        .map((h) => {
          const avgTps = telToNonNegInt(h.avgTps);
          const peakTps = telToNonNegInt(h.peakTps);
          return {
            model: typeof h.model === "string" ? h.model.slice(0, 96) : "",
            tokens: telToNonNegInt(h.tokens),
            exactOutputTokens: telToNonNegInt(h.exactOutputTokens),
            exact: Boolean(h.exact),
            durSec: telToNonNegFloat(h.durSec),
            avgTps,
            peakTps,
            at: typeof h.at === "string" ? h.at.slice(0, 20) : "",
          };
        })
        .filter((h) => !telIsBogusSpikeEntry(h))
        .slice(0, 8)
        .map((h) => {
          h.peakTps = Math.max(h.peakTps, h.avgTps);
          return h;
        })
    : [];

  let lastAvgTps = telToNonNegInt(src.lastAvgTps);
  let peakTps = telToNonNegInt(src.peakTps);
  let lastDurSec = telToNonNegFloat(src.lastDurSec);
  const respTokens = telToNonNegInt(src.respTokens);

  const hasBogusMetric =
    lastAvgTps >= 500 ||
    peakTps >= 900 ||
    (lastDurSec > 0 && lastDurSec <= 0.3 && respTokens <= 10 && lastAvgTps >= 20);

  if (hasBogusMetric) {
    lastAvgTps = history[0] ? history[0].avgTps : 0;
    lastDurSec = history[0] ? history[0].durSec : 0;
    peakTps = history.reduce((mx, it) => Math.max(mx, it.peakTps || 0), 0);
    samples = samples.filter((n) => n < 500);
    if (samples.length === 0 && lastAvgTps > 0) {
      samples = [lastAvgTps];
    }
  }

  peakTps = Math.max(peakTps, lastAvgTps);

  return {
    lastAvgTps,
    peakTps,
    lastDurSec,
    lastThinkingSec: telToNonNegFloat(src.lastThinkingSec),
    respTokens,
    chatTokens: telToNonNegInt(src.chatTokens),
    exactRespTokens: telToNonNegInt(src.exactRespTokens),
    exactContextTokens: telToNonNegInt(src.exactContextTokens),
    exactCacheTokens: telToNonNegInt(src.exactCacheTokens),
    contextLabel: typeof src.contextLabel === "string" ? src.contextLabel.slice(0, 48) : "",
    modelName: typeof src.modelName === "string" ? src.modelName.slice(0, 96) : "",
    samples,
    history,
  };
}

function telNowHiRes() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function telFormatTimeAt(nowFn) {
  const ts = typeof nowFn === "function" ? nowFn() : Date.now();
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).slice(0, 20);
  } catch (_e) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
}

function telEnsureArrays(tel) {
  if (!Array.isArray(tel.samples)) tel.samples = [];
  if (!Array.isArray(tel.history)) tel.history = [];
  if (!Array.isArray(tel.tpsWindow)) tel.tpsWindow = [];
}

function telSyncMetadataFromSnap(tel, snap) {
  if (snap.modelName) tel.modelName = snap.modelName;
  if (snap.contextLabel) tel.contextLabel = snap.contextLabel;
  if (typeof snap.chatTokens === "number" && Number.isFinite(snap.chatTokens)) {
    tel.chatTokens = Math.max(0, Math.round(snap.chatTokens));
  }
  if (snap.firstUserNorm) tel.firstUserNorm = snap.firstUserNorm;
}

function telPushSparkSample(tel, val, hiNow) {
  tel.samples.push(Math.max(0, Math.round(val)));
  if (tel.samples.length > 24) tel.samples.shift();
  tel.lastSparkAt = hiNow;
}

function telResetTurnAccumulators(tel, baselineTok, hiNow) {
  tel.currentTps = 0;
  tel.tpsWindow = [];
  tel.phase = "idle";
  tel.isGenerating = false;
  tel.wasGenerating = false;
  tel.turnStartMs = 0;
  tel.firstGrowthAt = 0;
  tel.lastGrowthAt = 0;
  tel.seedSliceMs = 0;
  tel.activeStreamMs = 0;
  tel.lastSparkAt = 0;
  tel.growthTicks = 0;
  tel.bankedTurnTokens = 0;
  tel.unconfirmedGrowthTicks = 0;
  tel.unconfirmedFirstTok = 0;
  tel.preTokenAt = hiNow;
  tel.prevFloatTok = baselineTok;
  tel.turnStartFloatTok = baselineTok;
  tel.highWaterBubbleTok = baselineTok;
}

/**
 * Stateful telemetry engine with WeakMap message-token cache, rolling-window TPS,
 * multi-bubble banking, hydration/2-step guards, and exact transcript reconciliation.
 */
function createTelemetryEngine(options = {}) {
  const opts = options && typeof options === "object" ? options : {};
  const userMsgCache = new WeakMap();
  const completedRespCache = new WeakMap();

  function countSingleUserMsg(u) {
    if (!u) return 0;
    if (typeof u === "object") {
      const cached = userMsgCache.get(u);
      if (cached !== undefined) return cached;
      const text = telIsElementNode(u)
        ? extractVisibleResponseText(u)
        : (typeof u.textContent === "string" ? u.textContent : "");
      const tok = estimateTokens(text);
      userMsgCache.set(u, tok);
      return tok;
    }
    return 0;
  }

  function countSingleResponse(r, activeLast) {
    if (!r) return 0;
    if (r === activeLast) {
      return estimateTokens(extractVisibleResponseText(r));
    }
    if (typeof r === "object") {
      const cached = completedRespCache.get(r);
      if (cached !== undefined) return cached;
      const tok = estimateTokens(extractVisibleResponseText(r));
      completedRespCache.set(r, tok);
      return tok;
    }
    return 0;
  }

  function countChatTokens(userMsgs, responses, lastResp) {
    let total = 0;
    if (userMsgs && typeof userMsgs.length === "number") {
      for (let i = 0; i < userMsgs.length; i += 1) {
        total += countSingleUserMsg(userMsgs[i]);
      }
    }
    if (responses && typeof responses.length === "number") {
      const activeLast = lastResp === undefined && responses.length > 0
        ? responses[responses.length - 1]
        : lastResp;
      for (let i = 0; i < responses.length; i += 1) {
        total += countSingleResponse(responses[i], activeLast);
      }
    }
    return total;
  }

  function finalizeTurn(tel, effectiveTok, snap, hiNow, unknownModelLabel, trackHistory) {
    const banked = tel.bankedTurnTokens > 0 ? tel.bankedTurnTokens : 0;
    const totalGained = banked + Math.max(0, effectiveTok - (tel.turnStartFloatTok || 0));

    let entry = null;
    if (totalGained >= 2 && (tel.growthTicks >= 2 || totalGained >= 6)) {
      const singleTick = (tel.growthTicks || 0) <= 1;
      const rawSec = ((tel.activeStreamMs || 0) + (tel.seedSliceMs || 0)) / 1000;
      const durSec = Math.max(singleTick ? 0.45 : 0.15, rawSec);
      const avgTps = Math.max(1, Math.round(totalGained / durSec));
      const isHydrationSpike = singleTick && avgTps > 200;

      if (!isHydrationSpike) {
        const durRounded = Number(durSec.toFixed(2));
        const snapThinking =
          typeof snap.thinkingSec === "number" && Number.isFinite(snap.thinkingSec) && snap.thinkingSec > 0
            ? snap.thinkingSec
            : 0;
        const elapsedThinking =
          tel.firstGrowthAt > tel.turnStartMs && tel.turnStartMs > 0
            ? Number(((tel.firstGrowthAt - tel.turnStartMs) / 1000).toFixed(2))
            : 0;

        tel.lastAvgTps = avgTps;
        tel.lastDurSec = durRounded;
        tel.lastThinkingSec = snapThinking || elapsedThinking;
        if (!singleTick) {
          tel.peakTps = Math.max(tel.peakTps || 0, avgTps);
        }
        if (tel.samples.length === 0 && avgTps > 0) {
          tel.samples.push(avgTps);
        }

        entry = {
          model: tel.modelName || snap.modelName || unknownModelLabel || "Unknown",
          tokens: Math.max(1, Math.round(totalGained)),
          exactOutputTokens: 0,
          exact: false,
          durSec: durRounded,
          avgTps,
          peakTps: tel.peakTps,
          at: typeof opts.formatTime === "function" ? opts.formatTime() : telFormatTimeAt(opts.now),
        };

        if (trackHistory !== false) {
          tel.history.unshift(entry);
          if (tel.history.length > 8) tel.history.length = 8;
        }
        tel.dirty = true;
      }
    }

    telResetTurnAccumulators(tel, effectiveTok, hiNow);
    return entry;
  }

  function updateStreamingMetrics(tel, effectiveTok, delta, idleSinceGrowth, hiNow) {
    const totalGained = (tel.bankedTurnTokens || 0) + Math.max(0, effectiveTok - (tel.turnStartFloatTok || 0));

    if (delta > 0) {
      tel.tpsWindow.push({ t: hiNow, tok: totalGained });
      tel.tpsWindow = tel.tpsWindow.filter((entry) => hiNow - entry.t <= 1800);

      const winLen = tel.tpsWindow.length;
      const spanMs = winLen >= 2 ? (tel.tpsWindow[winLen - 1].t - tel.tpsWindow[0].t) : 0;
      const activeSec = Math.max(0.25, ((tel.activeStreamMs || 0) + (tel.seedSliceMs || 0)) / 1000);
      const cumTps = totalGained / activeSec;

      let instTps;
      if (spanMs >= 180) {
        const first = tel.tpsWindow[0];
        const last = tel.tpsWindow[winLen - 1];
        const windowTps = Math.max(0, (last.tok - first.tok) / (spanMs / 1000));
        instTps = windowTps * 0.72 + cumTps * 0.28;
      } else {
        instTps = Math.min(320, cumTps);
      }

      const prevTps = tel.currentTps > 0 ? tel.currentTps : 0;
      const smoothed = prevTps > 0 ? Math.round(prevTps * 0.35 + instTps * 0.65) : Math.round(instTps);
      tel.currentTps = Math.max(0, smoothed);

      if (tel.growthTicks >= 2 && totalGained >= 4) {
        tel.peakTps = Math.max(tel.peakTps || 0, tel.currentTps);
      }
      if (!tel.lastSparkAt || hiNow - tel.lastSparkAt >= 350) {
        telPushSparkSample(tel, tel.currentTps, hiNow);
      }
      tel.dirty = true;
    } else if (tel.currentTps > 0 && idleSinceGrowth > 450) {
      const decayed = Math.round(tel.currentTps * Math.exp(-(idleSinceGrowth - 450) / 1400));
      tel.currentTps = decayed < 1 ? 0 : decayed;
      if (tel.firstGrowthAt && (!tel.lastSparkAt || hiNow - tel.lastSparkAt >= 350)) {
        telPushSparkSample(tel, tel.currentTps, hiNow);
      }
    }

    tel.phase = tel.firstGrowthAt && idleSinceGrowth <= 1100 ? "streaming" : "thinking";
    tel.prevFloatTok = effectiveTok;
  }

  function commitSnapCounters(tel, snap, snapRespCount, snapUserCount, snapRespTokens) {
    tel.activeRespEl = snap.lastResp || null;
    tel.prevRespCount = snapRespCount;
    tel.prevUserCount = snapUserCount;
    tel.respTokens = snapRespTokens;
  }

  function handleIdleGrowthGuard(tel, snap, effectiveTok, hiNow, hydrationIgnoreUntil, counts) {
    if (snap.isGenerating || tel.wasGenerating) {
      tel.unconfirmedGrowthTicks = 0;
      tel.unconfirmedFirstTok = 0;
      return false;
    }

    const rawDelta = effectiveTok - (tel.prevFloatTok || 0);
    if (rawDelta > 0) {
      const isHydrationDump =
        hiNow < hydrationIgnoreUntil ||
        (tel.prevRespCount === 0 && effectiveTok > 12) ||
        rawDelta > 50;
      if (isHydrationDump) {
        tel.prevFloatTok = effectiveTok;
        tel.highWaterBubbleTok = effectiveTok;
        tel.turnStartFloatTok = effectiveTok;
        tel.preTokenAt = hiNow;
        tel.unconfirmedGrowthTicks = 0;
        tel.unconfirmedFirstTok = 0;
        tel.phase = "idle";
        tel.isGenerating = false;
        tel.wasGenerating = false;
        commitSnapCounters(tel, snap, counts.resp, counts.user, counts.respTok);
        return true;
      }

      if ((tel.unconfirmedGrowthTicks || 0) === 0) {
        tel.unconfirmedGrowthTicks = 1;
        tel.unconfirmedFirstTok = effectiveTok;
        tel.prevFloatTok = effectiveTok;
        tel.preTokenAt = hiNow;
        tel.phase = "idle";
        commitSnapCounters(tel, snap, counts.resp, counts.user, counts.respTok);
        return true;
      }

      if (effectiveTok <= (tel.unconfirmedFirstTok || 0)) {
        tel.unconfirmedGrowthTicks = 0;
        tel.unconfirmedFirstTok = 0;
        tel.turnStartFloatTok = effectiveTok;
        tel.prevFloatTok = effectiveTok;
        tel.phase = "idle";
        commitSnapCounters(tel, snap, counts.resp, counts.user, counts.respTok);
        return true;
      }

      tel.unconfirmedGrowthTicks = 0;
      tel.unconfirmedFirstTok = 0;
      tel.turnStartFloatTok = tel.prevFloatTok;
      return false;
    }

    if ((tel.unconfirmedGrowthTicks || 0) > 0 && effectiveTok <= (tel.unconfirmedFirstTok || 0)) {
      tel.unconfirmedGrowthTicks = 0;
      tel.unconfirmedFirstTok = 0;
      tel.turnStartFloatTok = effectiveTok;
      tel.prevFloatTok = effectiveTok;
      tel.phase = "idle";
      commitSnapCounters(tel, snap, counts.resp, counts.user, counts.respTok);
      return true;
    }

    tel.unconfirmedGrowthTicks = 0;
    tel.unconfirmedFirstTok = 0;
    return false;
  }

  function processTick(params) {
    const p = params && typeof params === "object" ? params : {};
    const tel = p.tel;
    if (!tel || typeof tel !== "object") {
      return { canceled: false, finalizedTurn: null, flushNeeded: false };
    }
    telEnsureArrays(tel);

    const snap = p.snap && typeof p.snap === "object" ? p.snap : {};
    const hiNow = typeof p.hiNow === "number" && Number.isFinite(p.hiNow) ? p.hiNow : telNowHiRes();
    const hydrationIgnoreUntil =
      typeof p.hydrationIgnoreUntil === "number" && Number.isFinite(p.hydrationIgnoreUntil)
        ? p.hydrationIgnoreUntil
        : 0;
    const lastCancelClickAt =
      typeof p.lastCancelClickAt === "number" && Number.isFinite(p.lastCancelClickAt)
        ? p.lastCancelClickAt
        : 0;
    const unknownModelLabel =
      typeof p.unknownModelLabel === "string" && p.unknownModelLabel ? p.unknownModelLabel : "Unknown";
    const trackHistory = p.trackHistory !== false;

    const snapFloatTok =
      typeof snap.respFloatTok === "number" && Number.isFinite(snap.respFloatTok) && snap.respFloatTok > 0
        ? snap.respFloatTok
        : 0;
    const snapRespCount =
      typeof snap.respCount === "number" && Number.isFinite(snap.respCount) ? Math.max(0, snap.respCount) : 0;
    const snapUserCount =
      typeof snap.userMsgCount === "number" && Number.isFinite(snap.userMsgCount) ? Math.max(0, snap.userMsgCount) : 0;
    const snapRespTokens =
      typeof snap.respTokens === "number" && Number.isFinite(snap.respTokens)
        ? Math.max(0, Math.round(snap.respTokens))
        : (snapFloatTok > 0 ? Math.max(1, Math.round(snapFloatTok)) : 0);
    const counts = { resp: snapRespCount, user: snapUserCount, respTok: snapRespTokens };

    telSyncMetadataFromSnap(tel, snap);

    // 1. Cancel detection (explicit cancel click while generating, or DOM conversation shrink)
    const cancelClicked =
      (tel.wasGenerating || tel.isGenerating) &&
      lastCancelClickAt > 0 &&
      hiNow >= lastCancelClickAt &&
      hiNow - lastCancelClickAt < 2500;
    const wasCanceled =
      cancelClicked ||
      snapRespCount < (tel.prevRespCount || 0) ||
      snapUserCount < (tel.prevUserCount || 0);

    if (wasCanceled) {
      telResetTurnAccumulators(tel, snapFloatTok, hiNow);
      commitSnapCounters(tel, snap, snapRespCount, snapUserCount, snapRespTokens);
      return { canceled: true, finalizedTurn: null, flushNeeded: false };
    }

    // 2. New response bubble detection (turn boundary vs active multi-bubble tool-call turn)
    let pendingFinalizedTurn = null;
    const newRespAppeared = Boolean(
      snap.lastResp &&
      tel.activeRespEl &&
      snap.lastResp !== tel.activeRespEl &&
      (snapRespCount !== (tel.prevRespCount || 0) || snapFloatTok + 2 < (tel.prevFloatTok || 0))
    );

    if (newRespAppeared) {
      if (!tel.wasGenerating || (!snap.hasCancelBtn && !snap.isGenerating && tel.activeStreamMs > 0)) {
        if (tel.wasGenerating) {
          pendingFinalizedTurn = finalizeTurn(
            tel,
            tel.highWaterBubbleTok || 0,
            snap,
            hiNow,
            unknownModelLabel,
            trackHistory
          );
        }
        telResetTurnAccumulators(tel, 0, hiNow);
      } else {
        tel.bankedTurnTokens =
          (tel.bankedTurnTokens || 0) +
          Math.max(0, (tel.highWaterBubbleTok || 0) - (tel.turnStartFloatTok || 0));
        tel.prevFloatTok = 0;
        tel.turnStartFloatTok = 0;
        tel.highWaterBubbleTok = 0;
        tel.wasGenerating = true;
      }
      tel.activeRespEl = snap.lastResp;
    } else if (snap.lastResp) {
      tel.activeRespEl = snap.lastResp;
    }

    // 3. High-water mark guards against minor markdown-collapse token dips
    const effectiveTok = Math.max(tel.highWaterBubbleTok || 0, snapFloatTok);
    tel.highWaterBubbleTok = effectiveTok;

    // 4. Hydration & unconfirmed 2-step growth guard when idle
    if (handleIdleGrowthGuard(tel, snap, effectiveTok, hiNow, hydrationIgnoreUntil, counts)) {
      return {
        canceled: false,
        finalizedTurn: pendingFinalizedTurn,
        flushNeeded: Boolean(pendingFinalizedTurn),
      };
    }

    // 5. Active timing & rolling window TPS
    const delta = snapUserCount <= (tel.prevUserCount || 0) + 1
      ? Math.max(0, effectiveTok - (tel.prevFloatTok || 0))
      : 0;

    if (delta > 0) {
      if (!tel.firstGrowthAt) {
        tel.firstGrowthAt = hiNow;
        tel.seedSliceMs = Math.min(320, Math.max(80, tel.preTokenAt > 0 ? hiNow - tel.preTokenAt : 160));
        tel.activeStreamMs = 0;
        tel.samples = [];
      } else if (tel.lastGrowthAt > 0) {
        const gap = hiNow - tel.lastGrowthAt;
        if (gap > 0 && gap <= 2200) {
          tel.activeStreamMs += gap;
        } else if (gap > 2200) {
          tel.activeStreamMs += 120;
        }
      }
      tel.lastGrowthAt = hiNow;
      tel.growthTicks = (tel.growthTicks || 0) + 1;
    } else if (!tel.firstGrowthAt) {
      tel.preTokenAt = hiNow;
    }

    const idleSinceGrowth = tel.lastGrowthAt > 0 ? hiNow - tel.lastGrowthAt : Infinity;
    const graceMs = snap.hasCancelBtn ? 1500 : (snap.isGenerating ? 900 : 320);
    const effectiveGenerating =
      !snap.hasCancelBtn && tel.lastGrowthAt > 0 && idleSinceGrowth > 2200
        ? false
        : Boolean(snap.isGenerating || (tel.lastGrowthAt > 0 && idleSinceGrowth <= graceMs));

    if (effectiveGenerating && !tel.wasGenerating) {
      tel.turnStartMs = hiNow;
      tel.turnStartFloatTok = newRespAppeared ? 0 : (tel.prevFloatTok || 0);
      tel.bankedTurnTokens = 0;
      tel.tpsWindow = [];
      tel.peakTps = 0;
      tel.currentTps = 0;
      tel.exactRespTokens = 0;
      tel.exactContextTokens = 0;
      tel.exactCacheTokens = 0;
      tel.lastSparkAt = 0;
      tel.growthTicks = delta > 0 ? 1 : 0;
    }

    let finalizedTurn = pendingFinalizedTurn;
    if (effectiveGenerating) {
      if (typeof snap.thinkingSec === "number" && Number.isFinite(snap.thinkingSec) && snap.thinkingSec > 0) {
        tel.lastThinkingSec = snap.thinkingSec;
      }
      updateStreamingMetrics(tel, effectiveTok, delta, idleSinceGrowth, hiNow);
    } else if (tel.wasGenerating) {
      finalizedTurn = finalizeTurn(
        tel,
        effectiveTok,
        snap,
        hiNow,
        unknownModelLabel,
        trackHistory
      );
    } else {
      tel.phase = "idle";
      tel.currentTps = 0;
      tel.prevFloatTok = effectiveTok;
      tel.turnStartFloatTok = effectiveTok;
    }

    tel.isGenerating = effectiveGenerating;
    tel.wasGenerating = effectiveGenerating;
    commitSnapCounters(tel, snap, snapRespCount, snapUserCount, snapRespTokens);

    return {
      canceled: false,
      finalizedTurn,
      flushNeeded: Boolean(finalizedTurn),
    };
  }

  function applyExactTranscriptMetrics(tel, exact) {
    if (!tel || typeof tel !== "object" || !exact || typeof exact !== "object") {
      return false;
    }
    const outTok = telToNonNegInt(
      exact.outputTokens != null ? exact.outputTokens : exact.exactRespTokens
    );
    const ctxTok = telToNonNegInt(
      exact.contextTokens != null
        ? exact.contextTokens
        : (exact.inputTokens != null ? exact.inputTokens : exact.exactContextTokens)
    );
    const cacheTok = telToNonNegInt(
      exact.cacheTokens != null
        ? exact.cacheTokens
        : (exact.cacheReadTokens != null ? exact.cacheReadTokens : exact.exactCacheTokens)
    );

    tel.exactRespTokens = outTok;
    tel.exactContextTokens = ctxTok;
    tel.exactCacheTokens = cacheTok;

    const rawTs =
      typeof exact.ts === "number"
        ? exact.ts
        : (typeof exact.timestampMs === "number"
            ? exact.timestampMs
            : (typeof exact.atMs === "number"
                ? exact.atMs
                : (typeof exact.createdAtMs === "number" ? exact.createdAtMs : 0)));
    const nowMs =
      typeof exact.nowMs === "number" && Number.isFinite(exact.nowMs)
        ? exact.nowMs
        : (typeof opts.now === "function" ? opts.now() : Date.now());
    const ageStale =
      typeof exact.ageMs === "number" && Number.isFinite(exact.ageMs) && exact.ageMs > 120000;
    const tsStale = rawTs > 0 && Number.isFinite(rawTs) && nowMs - rawTs > 120000;
    const isRecent =
      !tel.isGenerating &&
      exact.recent !== false &&
      exact.isRecent !== false &&
      !ageStale &&
      !tsStale;

    if (isRecent && outTok > 0 && Array.isArray(tel.history) && tel.history.length > 0 && tel.history[0]) {
      tel.history[0].exact = true;
      tel.history[0].exactOutputTokens = outTok;
    }

    tel.dirty = true;
    return true;
  }

  return {
    countChatTokens,
    processTick,
    applyExactTranscriptMetrics,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    estimateTokensFloat,
    estimateTokens,
    extractVisibleResponseText,
    extractThinkingSeconds,
    createEmptyTelemetry,
    sanitizeTelemetryRecord,
    createTelemetryEngine,
  };
}
