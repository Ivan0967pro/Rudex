"use strict";

const http = require("http");
const https = require("https");
const { URL } = require("url");

const CLIENTS5_URL = "https://clients5.google.com/translate_a/t";

function isLoopbackUrl(urlStr) {
  const s = String(urlStr || "").trim();
  if (!s || s.length > 300) return "";
  try {
    const parsed = new URL(s);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    const host = String(parsed.hostname || "").toLowerCase();
    if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1" && host !== "[::1]") {
      return "";
    }
    return parsed.toString();
  } catch (_e) {
    return "";
  }
}

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
        const sl = sent.slice(pos, end).trim();
        if (sl) out.push(sl);
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
            done(null, JSON.parse(body));
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

async function translateChunkClients5Single(chunk, opts = {}) {
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

async function translateChunkClients5(chunk, opts = {}) {
  const encoded = encodeURIComponent(chunk);
  if (encoded.length <= 1800) {
    return translateChunkClients5Single(chunk, opts);
  }
  const subChunks = splitForTranslation(chunk, 450);
  const parts = [];
  for (let i = 0; i < subChunks.length; i += 1) {
    parts.push(await translateChunkClients5Single(subChunks[i], opts));
  }
  return parts.join(chunk.includes("\n") ? "\n" : " ");
}

function httpJsonPost(urlStr, payloadObj, timeoutMs = 8000) {
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

    const bodyBuf = Buffer.from(JSON.stringify(payloadObj || {}), "utf8");
    const client = parsed.protocol === "http:" ? http : https;
    const req = client.request(
      parsed,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": bodyBuf.length,
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
            done(null, JSON.parse(body));
          } catch (err) {
            done(new Error(`Invalid JSON from local translator: ${err && err.message ? err.message : err}`));
          }
        });
        res.on("error", (err) => done(err));
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Local translation timeout after ${timeoutMs}ms`));
    });
    req.on("error", (err) => done(err));
    req.write(bodyBuf);
    req.end();
  });
}

async function translateChunkLocal(chunk, opts = {}) {
  const safeUrl = isLoopbackUrl(opts.localUrl);
  if (!safeUrl) {
    throw new Error("Local translator URL must target localhost or 127.0.0.1");
  }
  const data = await httpJsonPost(
    safeUrl,
    { q: chunk, source: "en", target: "ru", format: "text" },
    opts.timeoutMs || 8000
  );
  if (data && typeof data.translatedText === "string") return data.translatedText;
  if (data && typeof data.translation === "string") return data.translation;
  if (Array.isArray(data) && typeof data[0] === "string") return data[0];
  throw new Error("Unexpected local translator response format");
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
        // Group short lines together (joined by \n), while sub-splitting very long lines (joined by space)
        const rawLines = masked.split(/\n/);
        const units = [];
        let acc = "";
        for (let li = 0; li < rawLines.length; li += 1) {
          const ln = rawLines[li];
          if (ln.length > 1200) {
            if (acc) {
              units.push({ joinWith: "\n", parts: [acc] });
              acc = "";
            }
            units.push({ joinWith: " ", parts: splitLongPiece(ln, 1200) });
          } else if (!acc) {
            acc = ln;
          } else if (acc.length + 1 + ln.length <= 1200) {
            acc += "\n" + ln;
          } else {
            units.push({ joinWith: "\n", parts: [acc] });
            acc = ln;
          }
        }
        if (acc) units.push({ joinWith: "\n", parts: [acc] });

        const useLocalOnly = Boolean(opts.localUrl && String(opts.localUrl).trim());
        const outUnits = [];
        for (let u = 0; u < units.length; u += 1) {
          const unit = units[u];
          const outParts = [];
          for (let i = 0; i < unit.parts.length; i += 1) {
            const piece = unit.parts[i];
            const translatedPiece = useLocalOnly
              ? await translateChunkLocal(piece, opts)
              : await translateChunkClients5(piece, opts);
            outParts.push(translatedPiece);
          }
          outUnits.push(outParts.join(unit.joinWith));
        }
        const joined = outUnits.join("\n");
        const restored = restoreInlineTokens(joined, tokens);
        recentErrors.delete(orig);
        setCached(orig, restored);
        return { orig, translated: restored, ok: true };
      } catch (err) {
        if (recentErrors.has(orig)) recentErrors.delete(orig);
        recentErrors.set(orig, Date.now());
        while (recentErrors.size > 500) {
          const oldestErrKey = recentErrors.keys().next().value;
          recentErrors.delete(oldestErrKey);
        }
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
  isLoopbackUrl,
  needsRussianTranslation,
  protectInlineTokens,
  restoreInlineTokens,
  splitForTranslation,
  httpJsonGet,
  httpJsonPost,
  translateChunkClients5,
  translateChunkLocal,
  createThinkingTranslator,
};
