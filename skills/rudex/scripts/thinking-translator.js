"use strict";

const http = require("http");
const https = require("https");
const { URL } = require("url");

const CLIENTS5_URL = "https://clients5.google.com/translate_a/t";
const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

const TOKEN_PROTECT_RE =
  /`[^`\n]{1,160}`|https?:\/\/[^\s<>)\]]+|[A-Za-z]:\\[^\s"'<>|)\],;]+|(?:^|(?<=[\s(\["']))(?:\.{0,2}\/)?(?:[a-zA-Z0-9._-]+\/){1,}[a-zA-Z0-9._-]+|(?:^|(?<=[\s(\["']))--[a-zA-Z0-9][a-zA-Z0-9_-]*|\b[a-z]+(?:_[a-z0-9]+)+\b|\b[a-z]+[A-Z][A-Za-z0-9]*\b/g;

function needsRussianTranslation(text) {
  const s = String(text || "").trim();
  if (s.length < 3 || s.length > 6000) return false;
  if (/^https?:\/\/\S+$/i.test(s)) return false;
  if (/^[A-Za-z]:\\[^\s]+$/i.test(s) || /^\/[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/.test(s)) return false;
  if (!/\s/.test(s) && /[\\/_=()[\]{}<>`]/.test(s)) return false;

  const latinMatches = s.match(/[A-Za-z]/g);
  const latinCount = latinMatches ? latinMatches.length : 0;
  if (latinCount < 3) return false;

  const cyrMatches = s.match(/[\u0410-\u042f\u0430-\u044f\u0401\u0451]/g);
  const cyrCount = cyrMatches ? cyrMatches.length : 0;
  return cyrCount / (latinCount + cyrCount) < 0.35;
}

function protectInlineTokens(text) {
  const tokens = [];
  const masked = String(text || "").replace(TOKEN_PROTECT_RE, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `RUDX${idx}Z`;
  });
  return { masked, tokens };
}

function restoreInlineTokens(translated, tokens) {
  const list = Array.isArray(tokens) ? tokens : [];
  if (list.length === 0) return String(translated || "");
  return String(translated || "").replace(/\bRUDX(\d+)Z\b/gi, (full, idxStr) => {
    const idx = parseInt(idxStr, 10);
    return Number.isInteger(idx) && idx >= 0 && idx < list.length ? list[idx] : full;
  });
}

function splitLongPiece(piece, maxLen) {
  if (piece.length <= maxLen) return [piece];
  const out = [];
  let sentences;
  try {
    sentences = piece.split(/(?<=[.!?])\s+/);
  } catch (_e) {
    sentences = [piece];
  }
  let cur = "";
  for (let i = 0; i < sentences.length; i += 1) {
    const sent = sentences[i];
    if (!sent) continue;
    if (sent.length > maxLen) {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      let pos = 0;
      while (pos < sent.length) {
        let end = Math.min(sent.length, pos + maxLen);
        if (end < sent.length) {
          const sp = sent.lastIndexOf(" ", end);
          if (sp > pos + Math.floor(maxLen * 0.4)) end = sp + 1;
        }
        out.push(sent.slice(pos, end).trim());
        pos = end;
      }
      continue;
    }
    if (!cur) {
      cur = sent;
    } else if (cur.length + 1 + sent.length <= maxLen) {
      cur += " " + sent;
    } else {
      out.push(cur);
      cur = sent;
    }
  }
  if (cur) out.push(cur);
  return out.length > 0 ? out : [piece];
}

function splitForTranslation(text, maxLen = 1200) {
  const s = String(text || "");
  if (s.length <= maxLen) return [s];
  const lines = s.split(/\n/);
  const chunks = [];
  let cur = "";
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.length > maxLen) {
      if (cur) {
        chunks.push(cur);
        cur = "";
      }
      const subPieces = splitLongPiece(line, maxLen);
      for (let k = 0; k < subPieces.length; k += 1) {
        chunks.push(subPieces[k]);
      }
      continue;
    }
    if (!cur) {
      cur = line;
    } else if (cur.length + 1 + line.length <= maxLen) {
      cur += "\n" + line;
    } else {
      chunks.push(cur);
      cur = line;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length > 0 ? chunks : [s];
}

function httpJsonGet(urlStr, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err, val) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(val);
    };

    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch (_e) {
      done(new Error(`Invalid URL: ${urlStr}`));
      return;
    }

    const client = parsed.protocol === "http:" ? http : https;
    const req = client.request(
      parsed,
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json, text/plain, */*",
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        const chunks = [];
        let total = 0;
        res.on("data", (chunk) => {
          total += chunk.length;
          if (total > 2 * 1024 * 1024) {
            req.destroy();
            res.destroy();
            done(new Error("Translation response exceeded 2MB"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (status < 200 || status >= 300) {
            done(new Error(`HTTP ${status}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            done(new Error(`Invalid JSON from translation endpoint: ${err && err.message ? err.message : err}`));
          }
        });
        res.on("error", (err) => done(err));
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Translation request timeout after ${timeoutMs}ms`));
    });
    req.on("error", (err) => done(err));
    req.end();
  });
}

async function translateChunkClients5(chunk, opts = {}) {
  const base = opts.clients5Url || CLIENTS5_URL;
  const sep = base.includes("?") ? "&" : "?";
  const urlStr = `${base}${sep}client=dict-chrome-ex&sl=en&tl=ru&q=${encodeURIComponent(chunk)}`;
  const data = await httpJsonGet(urlStr, opts.timeoutMs || 8000);
  if (Array.isArray(data)) {
    if (typeof data[0] === "string") {
      return data[0];
    }
    if (Array.isArray(data[0]) && typeof data[0][0] === "string") {
      return data.map((row) => (Array.isArray(row) && typeof row[0] === "string" ? row[0] : "")).join("");
    }
  }
  throw new Error("Unexpected clients5 response format");
}

async function translateChunkMyMemory(chunk, opts = {}) {
  const base = opts.myMemoryUrl || MYMEMORY_URL;
  const sep = base.includes("?") ? "&" : "?";
  const subChunks = splitForTranslation(chunk, 480);
  const parts = [];
  for (let i = 0; i < subChunks.length; i += 1) {
    const urlStr = `${base}${sep}q=${encodeURIComponent(subChunks[i])}&langpair=en%7Cru`;
    const data = await httpJsonGet(urlStr, opts.timeoutMs || 8000);
    const status = data && Number(data.responseStatus);
    const txt = data && data.responseData && typeof data.responseData.translatedText === "string"
      ? data.responseData.translatedText
      : "";
    if (status !== 200 || !txt || /MYMEMORY WARNING/i.test(txt)) {
      throw new Error(`MyMemory translation failed (${status || "unknown"})`);
    }
    parts.push(txt);
  }
  return parts.join(" ");
}

function createThinkingTranslator(opts = {}) {
  const maxCacheSize = typeof opts.maxCacheSize === "number" && opts.maxCacheSize > 0 ? opts.maxCacheSize : 1000;
  const cooldownMs = typeof opts.cooldownMs === "number" && opts.cooldownMs >= 0 ? opts.cooldownMs : 15000;
  const cache = new Map();
  const inflight = new Map();
  const recentErrors = new Map();

  function setCached(key, val) {
    if (cache.has(key)) cache.delete(key);
    cache.set(key, val);
    while (cache.size > maxCacheSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
  }

  async function translateOne(rawText) {
    const orig = String(rawText || "");
    if (!needsRussianTranslation(orig)) {
      return { orig, translated: orig, ok: true, skipped: true };
    }
    if (cache.has(orig)) {
      const cached = cache.get(orig);
      setCached(orig, cached);
      return { orig, translated: cached, ok: true, cached: true };
    }

    const errAt = recentErrors.get(orig);
    if (errAt && Date.now() - errAt < cooldownMs) {
      return { orig, translated: orig, ok: false, error: "COOLDOWN" };
    }

    if (inflight.has(orig)) {
      return inflight.get(orig);
    }

    const promise = (async () => {
      try {
        const { masked, tokens } = protectInlineTokens(orig);
        const chunks = splitForTranslation(masked, 1200);
        const outChunks = [];
        for (let i = 0; i < chunks.length; i += 1) {
          const piece = chunks[i];
          let translatedPiece = "";
          try {
            translatedPiece = await translateChunkClients5(piece, opts);
          } catch (_err1) {
            translatedPiece = await translateChunkMyMemory(piece, opts);
          }
          outChunks.push(translatedPiece);
        }
        const joined = outChunks.join(chunks.length > 1 && orig.includes("\n") ? "\n" : " ");
        const restored = restoreInlineTokens(joined, tokens);
        recentErrors.delete(orig);
        setCached(orig, restored);
        return { orig, translated: restored, ok: true };
      } catch (err) {
        recentErrors.set(orig, Date.now());
        return {
          orig,
          translated: orig,
          ok: false,
          error: err && err.message ? err.message : "TRANSLATE_FAILED",
        };
      } finally {
        inflight.delete(orig);
      }
    })();

    inflight.set(orig, promise);
    return promise;
  }

  async function translateBatch(texts) {
    const arr = Array.isArray(texts) ? texts : [];
    const unique = [];
    const seen = new Set();
    for (let i = 0; i < arr.length && unique.length < 12; i += 1) {
      if (typeof arr[i] !== "string") continue;
      if (!arr[i] || arr[i].length > 6000 || seen.has(arr[i])) continue;
      seen.add(arr[i]);
      unique.push(arr[i]);
    }

    const results = new Array(unique.length);
    const translations = {};
    let nextIdx = 0;
    const workers = Math.min(4, unique.length);

    const runWorker = async () => {
      while (nextIdx < unique.length) {
        const idx = nextIdx;
        nextIdx += 1;
        const r = await translateOne(unique[idx]);
        results[idx] = r;
        if (r && r.ok && !r.skipped && typeof r.translated === "string") {
          translations[r.orig] = r.translated;
        }
      }
    };

    const runners = [];
    for (let w = 0; w < workers; w += 1) runners.push(runWorker());
    await Promise.all(runners);

    return { translations, results };
  }

  return {
    translateOne,
    translateBatch,
    cache,
  };
}

module.exports = {
  CLIENTS5_URL,
  MYMEMORY_URL,
  needsRussianTranslation,
  protectInlineTokens,
  restoreInlineTokens,
  splitForTranslation,
  httpJsonGet,
  translateChunkClients5,
  translateChunkMyMemory,
  createThinkingTranslator,
};
