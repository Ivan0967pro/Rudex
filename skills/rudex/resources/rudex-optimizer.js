"use strict";

/**
 * Rudex Voice Dictation Pro & GPU Animation Optimizer (browser-safe & Node-testable).
 * Zero Node.js imports so install.js embeds it directly into Electron's sandboxed preload.js.
 */

const VALID_VOICE_LANG_PRESETS = new Set(["auto", "ru-en", "ru", "en-ru", "en", "uk-ru-en", "custom"]);
const VALID_VOICE_ENGINES = new Set(["auto", "local", "cloud"]);
const VALID_VOICE_LOCAL_MODELS = new Set(["ru-tone", "ru-fast", "ru-hq", "multi-ru-en", "en-fast"]);
const VALID_ANIM_MODES = new Set(["smooth", "snappy", "reduced", "native"]);
const VALID_VOICE_CHUNK_MS = new Set([40, 64, 80, 100]);
const BCP47_RE = /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/;

const DEFAULT_OPTIMIZATION_SETTINGS = {
  voiceEnabled: true,
  voiceEngine: "auto",
  voiceLocalModel: "ru-fast",
  voiceLangPreset: "auto",
  voiceCustomLangs: "",
  voiceExplicitLang: true,
  voiceChunkMs: 80,
  voiceDspFilter: true,
  voiceDisableWinIsolation: true,
  voiceAutoGain: true,
  voicePauseHeavyUi: true,
  voiceTextCleanup: true,
  voiceShowBadge: true,
  animMode: "smooth",
  animFixTransitionAll: true,
  animContainChat: true,
  animFreezeHidden: true,
  gpuAccel: false,
  lsTuningEnabled: false,
  lsMaxProcs: 0,
  lsFileWatchMaxDirs: 32768,
  lsMaxTrackedWorkspaces: 24,
  storageRamCache: false,
  chromiumCacheCapMb: 0,
  geminiFileCacheProtocol: false,
};

function rxOptClamp(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeBcp47Tag(tag) {
  const clean = String(tag || "").trim();
  if (!BCP47_RE.test(clean)) return "";
  return clean
    .split("-")
    .map((part, idx) => {
      const lo = part.toLowerCase();
      if (idx === 0) return lo;
      if (part.length === 4) return lo[0].toUpperCase() + lo.slice(1);
      if (part.length === 2) return lo.toUpperCase();
      return lo;
    })
    .join("-");
}

function parseVoiceLangList(raw) {
  const parts = Array.isArray(raw) ? raw : String(raw || "").split(/[,;\s]+/);
  const out = [];
  const seen = new Set();
  for (let i = 0; i < parts.length; i += 1) {
    const norm = normalizeBcp47Tag(parts[i]);
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(norm);
    if (out.length >= 6) break;
  }
  return out;
}

function sanitizeOptimizationSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const chunkRaw = Math.round(rxOptClamp(src.voiceChunkMs, 40, 100, DEFAULT_OPTIMIZATION_SETTINGS.voiceChunkMs));
  const voiceChunkMs = VALID_VOICE_CHUNK_MS.has(chunkRaw) ? chunkRaw : (chunkRaw <= 52 ? 40 : (chunkRaw <= 72 ? 64 : (chunkRaw >= 90 ? 100 : 80)));
  const voiceEngine = VALID_VOICE_ENGINES.has(src.voiceEngine)
    ? src.voiceEngine
    : DEFAULT_OPTIMIZATION_SETTINGS.voiceEngine;
  const voiceLocalModel = VALID_VOICE_LOCAL_MODELS.has(src.voiceLocalModel)
    ? src.voiceLocalModel
    : DEFAULT_OPTIMIZATION_SETTINGS.voiceLocalModel;
  const voiceLangPreset = VALID_VOICE_LANG_PRESETS.has(src.voiceLangPreset)
    ? src.voiceLangPreset
    : DEFAULT_OPTIMIZATION_SETTINGS.voiceLangPreset;
  const animMode = VALID_ANIM_MODES.has(src.animMode)
    ? src.animMode
    : DEFAULT_OPTIMIZATION_SETTINGS.animMode;
  const rawMaxProcs = Number(src.lsMaxProcs);
  const lsMaxProcs = Number.isFinite(rawMaxProcs) && rawMaxProcs > 0
    ? Math.round(rxOptClamp(rawMaxProcs, 2, 32, 0))
    : 0;
  const rawCapMb = src.chromiumCacheCapMb;
  const chromiumCacheCapMb =
    rawCapMb === undefined || rawCapMb === null || rawCapMb === "" || Number(rawCapMb) === 0
      ? 0
      : Math.round(rxOptClamp(rawCapMb, 50, 512, 100));
  return {
    voiceEnabled: src.voiceEnabled !== false,
    voiceEngine,
    voiceLocalModel,
    voiceLangPreset,
    voiceCustomLangs: typeof src.voiceCustomLangs === "string"
      ? parseVoiceLangList(src.voiceCustomLangs).join(", ")
      : "",
    voiceExplicitLang: src.voiceExplicitLang !== false,
    voiceChunkMs,
    voiceDspFilter: src.voiceDspFilter !== false,
    voiceDisableWinIsolation: src.voiceDisableWinIsolation !== false,
    voiceAutoGain: src.voiceAutoGain !== false,
    voicePauseHeavyUi: src.voicePauseHeavyUi !== false,
    voiceTextCleanup: src.voiceTextCleanup !== false,
    voiceShowBadge: src.voiceShowBadge !== false,
    animMode,
    animFixTransitionAll: src.animFixTransitionAll !== false,
    animContainChat: src.animContainChat !== false,
    animFreezeHidden: src.animFreezeHidden !== false,
    gpuAccel: src.gpuAccel === true,
    lsTuningEnabled: src.lsTuningEnabled === true,
    lsMaxProcs,
    lsFileWatchMaxDirs: Math.round(rxOptClamp(src.lsFileWatchMaxDirs, 4096, 131072, DEFAULT_OPTIMIZATION_SETTINGS.lsFileWatchMaxDirs)),
    lsMaxTrackedWorkspaces: Math.round(rxOptClamp(src.lsMaxTrackedWorkspaces, 10, 64, DEFAULT_OPTIMIZATION_SETTINGS.lsMaxTrackedWorkspaces)),
    storageRamCache: src.storageRamCache === true,
    chromiumCacheCapMb,
    geminiFileCacheProtocol: src.geminiFileCacheProtocol === true,
  };
}

function resolveVoiceLanguageCodes(opt, locale) {
  const cfg = sanitizeOptimizationSettings(opt);
  const loc = String(locale || "ru").toLowerCase();
  switch (cfg.voiceLangPreset) {
    case "ru-en":
      return ["ru-RU", "en-US"];
    case "ru":
      return ["ru-RU"];
    case "en-ru":
      return ["en-US", "ru-RU"];
    case "en":
      return ["en-US"];
    case "uk-ru-en":
      return ["uk-UA", "ru-RU", "en-US"];
    case "custom": {
      const parsed = parseVoiceLangList(cfg.voiceCustomLangs);
      if (parsed.length > 0) return parsed;
      return loc === "en" ? ["en-US", "ru-RU"] : ["ru-RU", "en-US"];
    }
    case "auto":
    default:
      return loc === "en" ? ["en-US", "ru-RU"] : ["ru-RU", "en-US"];
  }
}

/**
 * Cleans speech-to-text artifacts: collapses repeated spaces, removes immediate
 * duplicate-word boundary stutters, normalizes unambiguous IT/Antigravity garbles,
 * and fixes misplaced punctuation spacing.
 */
function cleanDictationText(text) {
  if (typeof text !== "string" || !text) return text || "";
  const leadingSpace = /^\s/.test(text);
  const trailingSpace = /\s$/.test(text);
  let out = text.replace(/[ \t]{2,}/g, " ").trim();
  if (!out) return leadingSpace || trailingSpace ? " " : "";
  // Remove space before standard punctuation marks
  out = out.replace(/\s+([.,!?;:])/g, "$1");
  // Normalize unambiguous Russian ASR misrecognitions of Antigravity / Rudex / dev terms (zero Russian homonym risk)
  out = out
    .replace(/(^|[^\p{L}\p{N}_])(?:антигра[еюи]те|анти\s*гравити)(?=$|[^\p{L}\p{N}_])/giu, "$1Antigravity")
    .replace(/(^|[^\p{L}\p{N}_])(?:ру\s+декс|рудекс)(?=$|[^\p{L}\p{N}_])/giu, "$1Rudex")
    .replace(/(^|[^\p{L}\p{N}_])(?:ги[тд]\s*ха[бх]|ги[тд]ха)(?=$|[^\p{L}\p{N}_])/giu, "$1GitHub")
    .replace(/(^|[^\p{L}\p{N}_])кишировани([еяюи]|ем|ям|ями|ях)(?=$|[^\p{L}\p{N}_])/giu, "$1кэшировани$2")
    .replace(/(^|[^\p{L}\p{N}_])пауэр\s+шелл(?=$|[^\p{L}\p{N}_])/giu, "$1PowerShell")
    .replace(/(^|[^\p{L}\p{N}_])тайп\s+скрипт(?=$|[^\p{L}\p{N}_])/giu, "$1TypeScript")
    .replace(/(^|[^\p{L}\p{N}_])джава\s+скрипт(?=$|[^\p{L}\p{N}_])/giu, "$1JavaScript")
    .replace(/(^|[^\p{L}\p{N}_])веб\s+сокет(?=$|[^\p{L}\p{N}_])/giu, "$1WebSocket");
  // Collapse immediate exact word stutter ("привет привет" -> "привет"), skipping numbers/short prepositions
  out = out.replace(/(^|[^\p{L}\p{N}_])([\p{L}]{3,})\s+\2(?=$|[^\p{L}\p{N}_])/giu, "$1$2");
  return (leadingSpace ? " " : "") + out + (trailingSpace ? " " : "");
}

/**
 * Generates an upgraded AudioWorkletProcessor source for 16kHz dictation PCM streaming:
 * - DC-blocker / 65Hz High-Pass Filter (removes mains hum & mic thumps)
 * - 2-pole Butterworth Low-Pass Anti-Aliasing Filter at 7.4kHz before decimation
 * - Smooth linear interpolation resampler (far cleaner Russian sibilants than boxcar avg)
 * - Transparent unity-gain peak soft-limiter above 0.92 (NO double-AGC noise pumping!)
 * - Tunable chunk framing (ONLY used for dictation /audio_processor.js — NEVER Voice Mode!)
 */
function buildUpgradedAudioWorkletSource(chunkSamples, dspFilter) {
  const chunk = Math.max(320, Math.min(3200, Math.round(Number(chunkSamples) || 1280)));
  const useDsp = dspFilter !== false;
  return `/* Rudex Voice Dictation Pro DSP AudioWorklet */
const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = ${chunk};
const USE_DSP = ${useDsp ? "true" : "false"};

class AudioStreamingProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.out = new Int16Array(CHUNK_SAMPLES);
    this.outLen = 0;
    this.stopped = false;
    this.phase = 0;
    this.prevSample = 0;
    this.hasPrev = false;
    // DC-blocker / 65Hz high-pass state
    this.hpX1 = 0;
    this.hpY1 = 0;
    // 2-pole Butterworth anti-aliasing LPF state
    this.lpX1 = 0;
    this.lpX2 = 0;
    this.lpY1 = 0;
    this.lpY2 = 0;
    this.lpfSr = 0;
    this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0;

    this.port.onmessage = (event) => {
      if (event.data === 'stop') {
        this.stopped = true;
        if (this.outLen > 0) {
          const rem = this.out.slice(0, this.outLen);
          this.outLen = 0;
          this.port.postMessage(rem.buffer, [rem.buffer]);
        }
        this.port.postMessage('done');
      }
    };
  }

  initLpf(sr) {
    this.lpfSr = sr;
    if (sr <= TARGET_SAMPLE_RATE * 1.05) {
      this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0;
      return;
    }
    const fc = 7400;
    const w0 = (2 * Math.PI * fc) / sr;
    const cosW = Math.cos(w0);
    const sinW = Math.sin(w0);
    const alpha = sinW / Math.SQRT2;
    const a0 = 1 + alpha;
    this.b0 = ((1 - cosW) / 2) / a0;
    this.b1 = (1 - cosW) / a0;
    this.b2 = ((1 - cosW) / 2) / a0;
    this.a1 = (-2 * cosW) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  shapeSample(x, sr) {
    if (!USE_DSP) return x;
    // 1. Clean 65Hz DC-blocker / high-pass filter (preserves vocal fundamentals & consonants)
    const hpR = sr > 32000 ? 0.9915 : 0.978;
    const yHp = x - this.hpX1 + hpR * this.hpY1;
    this.hpX1 = x;
    this.hpY1 = yHp;

    // 2. Anti-aliasing 2-pole Butterworth LPF when downsampling (48kHz -> 16kHz)
    let y = yHp;
    if (sr > TARGET_SAMPLE_RATE * 1.05) {
      if (this.lpfSr !== sr) this.initLpf(sr);
      y = this.b0 * yHp + this.b1 * this.lpX1 + this.b2 * this.lpX2 - this.a1 * this.lpY1 - this.a2 * this.lpY2;
      this.lpX2 = this.lpX1;
      this.lpX1 = yHp;
      this.lpY2 = this.lpY1;
      this.lpY1 = y;
    }

    // 3. Transparent unity-gain soft peak limiter above 0.92 (no double-AGC noise floor pumping)
    if (y > 0.92) y = 0.92 + 0.08 * Math.tanh((y - 0.92) / 0.08);
    else if (y < -0.92) y = -0.92 + 0.08 * Math.tanh((y + 0.92) / 0.08);
    return y;
  }

  emit(s) {
    const c = s > 1 ? 1 : (s < -1 ? -1 : s);
    this.out[this.outLen++] = Math.round(c < 0 ? c * 0x8000 : c * 0x7fff);
    if (this.outLen >= CHUNK_SAMPLES) {
      const buf = this.out.buffer;
      this.out = new Int16Array(CHUNK_SAMPLES);
      this.outLen = 0;
      this.port.postMessage(buf, [buf]);
    }
  }

  process(inputs) {
    if (this.stopped) return false;
    const ch = inputs && inputs[0] && inputs[0][0];
    if (!ch || ch.length === 0) return true;

    const sr = (typeof sampleRate === 'number' && sampleRate > 0) ? sampleRate : TARGET_SAMPLE_RATE;
    if (sr === TARGET_SAMPLE_RATE) {
      for (let i = 0; i < ch.length; i++) {
        this.emit(this.shapeSample(ch[i], sr));
      }
      return true;
    }

    const step = sr / TARGET_SAMPLE_RATE;
    for (let i = 0; i < ch.length; i++) {
      const cur = this.shapeSample(ch[i], sr);
      if (!this.hasPrev) {
        this.prevSample = cur;
        this.hasPrev = true;
      }
      while (this.phase < 1) {
        this.emit(this.prevSample + (cur - this.prevSample) * this.phase);
        this.phase += step;
      }
      this.phase -= 1;
      this.prevSample = cur;
    }
    return true;
  }
}

registerProcessor('audio-streaming-processor', AudioStreamingProcessor);
`;
}

/**
 * Pure helper: injects configured languageCodes into an outgoing WebSocket
 * /connect-websocket JSON frame when procedure is StreamAudioTranscription.
 */
function patchWsStreamAudioFrame(rawData, cfg, locale) {
  if (typeof rawData !== "string" || rawData.indexOf("StreamAudioTranscription") === -1) {
    return { data: rawData, patched: false };
  }
  try {
    const msg = JSON.parse(rawData);
    if (
      !msg ||
      msg.type !== "start" ||
      typeof msg.procedure !== "string" ||
      !/StreamAudioTranscription$/i.test(msg.procedure) ||
      !msg.payload ||
      typeof msg.payload !== "object"
    ) {
      return { data: rawData, patched: false };
    }
    const existing = Array.isArray(msg.payload.languageCodes) ? msg.payload.languageCodes.filter(Boolean) : [];
    if (existing.length > 0) {
      return { data: rawData, patched: false, languages: existing };
    }
    const langs = resolveVoiceLanguageCodes(cfg, locale);
    if (langs.length === 0) return { data: rawData, patched: false };
    msg.payload.languageCodes = langs;
    msg.payload.languageCodesExplicit = Boolean(cfg && cfg.voiceExplicitLang !== false);
    return { data: JSON.stringify(msg), patched: true, languages: langs };
  } catch (_e) {
    return { data: rawData, patched: false };
  }
}

/**
 * Pure helper: injects languageCodes into gRPC-Web framed JSON (5-byte prefix)
 * or raw JSON body for /StreamAudioTranscription HTTP fallback requests.
 */
function patchGrpcWebStreamAudioBody(body, cfg, locale) {
  if (!body) return { body, patched: false };
  const langs = resolveVoiceLanguageCodes(cfg, locale);
  if (langs.length === 0) return { body, patched: false };

  const mutatePayload = (obj) => {
    if (!obj || typeof obj !== "object") return false;
    const existing = Array.isArray(obj.languageCodes) ? obj.languageCodes.filter(Boolean) : [];
    if (existing.length > 0) return false;
    obj.languageCodes = langs;
    obj.languageCodesExplicit = Boolean(cfg && cfg.voiceExplicitLang !== false);
    return true;
  };

  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (mutatePayload(parsed)) {
        return { body: JSON.stringify(parsed), patched: true, languages: langs };
      }
    } catch (_e) {}
    return { body, patched: false };
  }

  let bytes = null;
  if (body instanceof Uint8Array) bytes = body;
  else if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) bytes = new Uint8Array(body);
  else if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView && ArrayBuffer.isView(body)) {
    bytes = new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }
  if (!bytes || bytes.byteLength < 7) return { body, patched: false };

  try {
    const flags = bytes[0];
    if (flags !== 0) return { body, patched: false };
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const frameLen = view.getUint32(1, false);
    if (frameLen + 5 !== bytes.byteLength) return { body, patched: false };
    const dec = new TextDecoder("utf-8");
    const jsonStr = dec.decode(bytes.subarray(5, 5 + frameLen));
    if (!jsonStr || jsonStr[0] !== "{") return { body, patched: false };
    const parsed = JSON.parse(jsonStr);
    if (!mutatePayload(parsed)) return { body, patched: false };
    const enc = new TextEncoder();
    const nextPayload = enc.encode(JSON.stringify(parsed));
    const out = new Uint8Array(5 + nextPayload.byteLength);
    out[0] = 0;
    const outView = new DataView(out.buffer);
    outView.setUint32(1, nextPayload.byteLength, false);
    out.set(nextPayload, 5);
    return { body: out, patched: true, languages: langs };
  } catch (_e) {
    return { body, patched: false };
  }
}

/**
 * Pure helper: cleans incoming WebSocket /connect-websocket JSON transcription frame text.
 */
function cleanIncomingWsTranscriptionFrame(rawData, enabled) {
  if (!enabled || typeof rawData !== "string" || rawData.indexOf('"transcription"') === -1) {
    return rawData;
  }
  try {
    const msg = JSON.parse(rawData);
    if (msg && msg.type === "data" && msg.payload && msg.payload.transcription && typeof msg.payload.transcription.text === "string") {
      const cleaned = cleanDictationText(msg.payload.transcription.text);
      if (cleaned !== msg.payload.transcription.text) {
        msg.payload.transcription.text = cleaned;
        return JSON.stringify(msg);
      }
    }
  } catch (_e) {}
  return rawData;
}

/**
 * Builds the GPU-composited Animation & Performance Polish stylesheet.
 */
function buildAnimationPolishCss(rawOpt) {
  const opt = sanitizeOptimizationSettings(rawOpt);
  if (opt.animMode === "native" && !opt.animFixTransitionAll && !opt.animContainChat && !opt.animFreezeHidden && !opt.voicePauseHeavyUi) {
    return "";
  }

  const lines = ["/* Rudex Animation & Compositor Polish */"];

  if (opt.animMode === "smooth") {
    lines.push(`
:root {
  --ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);
  --sdk-transition-fast: 115ms cubic-bezier(0.16, 1, 0.3, 1);
  --sdk-transition-normal: 185ms cubic-bezier(0.16, 1, 0.3, 1);
  --sdk-transition-slow: 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes sdk-slide-in-left {
  from { transform: translate3d(-20px, 0, 0); opacity: 0; }
  to { transform: translate3d(0, 0, 0); opacity: 1; }
}
@keyframes sdk-slide-in-right {
  from { transform: translate3d(20px, 0, 0); opacity: 0; }
  to { transform: translate3d(0, 0, 0); opacity: 1; }
}
.animate-slideIn {
  transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1), transform 170ms cubic-bezier(0.16, 1, 0.3, 1) !important;
  will-change: opacity, transform;
}
.animate-overview-panel {
  transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 240ms cubic-bezier(0.16, 1, 0.3, 1) !important;
  will-change: opacity, transform;
}
.agy-overlay, [data-hover-card-popup] {
  backface-visibility: hidden;
}`);
  } else if (opt.animMode === "snappy") {
    lines.push(`
:root {
  --ease-expo-out: cubic-bezier(0.2, 0.9, 0.2, 1);
  --sdk-transition-fast: 70ms cubic-bezier(0.2, 0.9, 0.2, 1);
  --sdk-transition-normal: 110ms cubic-bezier(0.2, 0.9, 0.2, 1);
  --sdk-transition-slow: 150ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.animate-slideIn, .animate-overview-panel {
  transition-duration: 100ms !important;
  will-change: opacity, transform;
}`);
  } else if (opt.animMode === "reduced") {
    lines.push(`
:root {
  --sdk-transition-fast: 1ms linear;
  --sdk-transition-normal: 1ms linear;
  --sdk-transition-slow: 1ms linear;
}
*, *::before, *::after {
  scroll-behavior: auto !important;
}
.animate-slideIn, .animate-overview-panel, .animate-fade-in, .animate-pulse, .animate-pulse-strong {
  animation-duration: 1ms !important;
  transition-duration: 1ms !important;
}`);
  }

  if (opt.animFixTransitionAll) {
    lines.push(`
.transition-all {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform !important;
}
@keyframes skeleton-shimmer {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 0.85; }
}`);
  }

  if (opt.animContainChat) {
    lines.push(`
[data-testid="agent-response"],
[data-testid="user-message-bubble"] {
  contain: layout style;
}
[data-testid="sidebar"] {
  contain: layout style;
}`);
  }

  if (opt.animFreezeHidden) {
    lines.push(`
html[data-rudex-window-hidden="1"] *,
html[data-rudex-window-hidden="1"] *::before,
html[data-rudex-window-hidden="1"] *::after,
html[data-rudex-window-hidden="1"] #rudex-bg {
  animation-play-state: paused !important;
}`);
  }

  if (opt.voicePauseHeavyUi) {
    lines.push(`
html[data-rudex-dictating="1"] [data-rudex-theme-composer="1"],
html[data-rudex-dictating="1"] [data-rudex-comp-toolbar="1"] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transition: none !important;
}`);
  }

  // Minimal inline timer pill parked right next to Antigravity's red recording circle
  lines.push(`
#rudex-voice-badge {
  position: fixed;
  z-index: 2147483420;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: rgba(248, 250, 252, 0.9);
  background: rgba(24, 25, 31, 0.88);
  border: 1px solid rgba(239, 68, 68, 0.42);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
  pointer-events: none;
  user-select: none;
  opacity: 0;
  transform: translate3d(-4px, -50%, 0);
  transition: opacity 140ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}
#rudex-voice-badge.is-visible {
  opacity: 1;
  transform: translate3d(0, -50%, 0);
}
#rudex-voice-badge.is-local {
  border-color: rgba(16, 185, 129, 0.48);
}
#rudex-voice-badge.is-local .rx-vb-dot {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
}
#rudex-voice-badge .rx-vb-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.8);
  animation: rxVoicePulse 1.15s ease-in-out infinite;
}
@keyframes rxVoicePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.75); opacity: 0.48; }
}
#rudex-voice-badge .rx-vb-time {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  color: rgba(248, 250, 252, 0.88);
  font-size: 11px;
}
@media (prefers-reduced-motion: reduce) {
  .animate-slideIn, .animate-overview-panel, #rudex-voice-badge {
    transition-duration: 1ms !important;
  }
  #rudex-voice-badge .rx-vb-dot { animation: none !important; }
}`);

  return lines.join("\n");
}

/**
 * Pure schema-resilient extractor for official Antigravity Connect-RPC / JSON quota responses.
 * Passively parses real server-sent remaining % and reset timestamps without probing or forging requests.
 */
function extractQuotaFromRpcPayload(rawObj, nowMs, locale) {
  if (!rawObj || typeof rawObj !== "object") return null;
  const now = typeof nowMs === "number" && Number.isFinite(nowMs) ? nowMs : Date.now();
  const isRu = locale !== "en";

  const classifyFam = (hint) => {
    const s = String(hint || "").toLowerCase();
    if (!s) return "";
    if (/claude|sonnet|opus|haiku|anthropic|gpt|openai|chatgpt|third[_\s-]*party|partner|\boss\b|\bo[134](?:[-_\s]|$)/.test(s)) return "claudeGpt";
    if (/gemini|neon|carbon|argon|hydrogen|flash|orchestrator|google/.test(s)) return "gemini";
    return "";
  };

  const parseResetMs = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    if (typeof val === "number" && Number.isFinite(val)) {
      if (val > 1e12) return Math.max(0, Math.round(val - now));
      if (val > 1e9) return Math.max(0, Math.round(val * 1000 - now));
      if (val > 60 && val <= 10 * 86400) return Math.round(val * 1000);
      return 0;
    }
    if (typeof val === "object") {
      const sec = Number(val.seconds !== undefined ? val.seconds : val.sec);
      if (Number.isFinite(sec) && sec > 1e9) {
        const nanos = Number(val.nanos) || 0;
        return Math.max(0, Math.round(sec * 1000 + nanos / 1e6 - now));
      }
      return 0;
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return 0;
      const isoMs = Date.parse(trimmed);
      if (Number.isFinite(isoMs) && isoMs > now - 60000) {
        return Math.max(0, Math.round(isoMs - now));
      }
      const secM = /^(\d+(?:\.\d+)?)s$/i.exec(trimmed);
      if (secM) return Math.max(0, Math.round(parseFloat(secM[1]) * 1000));
    }
    return 0;
  };

  const fmtResetMs = (ms) => {
    if (!Number.isFinite(ms) || ms <= 30000) return "";
    const totalMin = Math.max(1, Math.ceil(ms / 60000));
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;
    if (days > 0) {
      return isRu
        ? (hours > 0 ? `${days} д ${hours} ч` : `${days} д`)
        : (hours > 0 ? `${days}d ${hours}h` : `${days}d`);
    }
    if (hours > 0) {
      return isRu
        ? (mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`)
        : (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`);
    }
    return isRu ? `${mins} мин` : `${mins}m`;
  };

  const toPct = (v, isFraction, isUsed) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    let pct = isFraction && n <= 1.0001 ? n * 100 : n;
    if (pct > 100.01) return null;
    if (isUsed) pct = 100 - pct;
    return Math.round(Math.max(0, Math.min(100, pct)) * 10) / 10;
  };

  const inferWindowKind = (hintStr, resetMs, durVal) => {
    const h = String(hintStr || "").toLowerCase();
    if (/five[_\s-]*hour|5[_\s-]*h(?:our|r)?\b|short[_\s-]*term|burst/.test(h)) return "fiveHour";
    if (/week|weekly|7[_\s-]*d(?:ay)?\b|long[_\s-]*term/.test(h)) return "weekly";
    if (durVal !== undefined && durVal !== null) {
      let durSec = 0;
      if (typeof durVal === "number" && Number.isFinite(durVal)) durSec = durVal;
      else if (typeof durVal === "string") {
        const dm = /^(\d+(?:\.\d+)?)s$/i.exec(durVal.trim());
        if (dm) durSec = parseFloat(dm[1]);
      } else if (typeof durVal === "object" && Number.isFinite(Number(durVal.seconds))) {
        durSec = Number(durVal.seconds);
      }
      if (durSec > 0 && durSec <= 8 * 3600) return "fiveHour";
      if (durSec >= 2 * 86400 && durSec <= 10 * 86400) return "weekly";
    }
    if (resetMs > 0 && resetMs <= 6.5 * 3600000) return "fiveHour";
    if (resetMs > 6.5 * 3600000 && resetMs <= 8.5 * 86400000) return "weekly";
    return "";
  };

  const acc = {
    gemini: { fiveHourRem: null, weeklyRem: null, fiveHourReset: "", weeklyReset: "" },
    claudeGpt: { fiveHourRem: null, weeklyRem: null, fiveHourReset: "", weeklyReset: "" },
  };
  let hits = 0;

  const recordSample = (fam, winKind, pct, resetStr) => {
    if (!fam || !winKind || pct === null) return;
    const dst = acc[fam];
    if (!dst) return;
    hits += 1;
    if (winKind === "fiveHour") {
      if (dst.fiveHourRem === null || pct < dst.fiveHourRem) dst.fiveHourRem = pct;
      if (resetStr && !dst.fiveHourReset) dst.fiveHourReset = resetStr;
    } else if (winKind === "weekly") {
      if (dst.weeklyRem === null || pct < dst.weeklyRem) dst.weeklyRem = pct;
      if (resetStr && !dst.weeklyReset) dst.weeklyReset = resetStr;
    }
  };

  const visited = new WeakSet();
  let nodesVisited = 0;

  const walk = (node, ctxFam, ctxWin, ctxHasQuota, depth) => {
    if (!node || typeof node !== "object" || depth > 10 || nodesVisited > 320) return;
    if (visited.has(node)) return;
    visited.add(node);
    nodesVisited += 1;

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length && i < 64; i += 1) {
        walk(node[i], ctxFam, ctxWin, ctxHasQuota, depth + 1);
      }
      return;
    }

    const keys = Object.keys(node);
    let ownFam = ctxFam;
    let ownWin = ctxWin;
    let ownHasQuota = ctxHasQuota;

    // Detect family & window hints on this object before inspecting metrics
    const idFields = ["label", "displayName", "display_name", "modelName", "model_name", "name", "id", "alias", "model", "family", "quotaGroup", "quota_group", "poolName", "pool_name", "groupName", "group_name", "title", "category"];
    for (let i = 0; i < idFields.length; i += 1) {
      const v = node[idFields[i]];
      if (typeof v === "string" && v) {
        const f = classifyFam(v);
        if (f) ownFam = f;
        const w = inferWindowKind(v, 0, null);
        if (w) ownWin = w;
      }
    }
    if (node.modelOrAlias && typeof node.modelOrAlias === "object") {
      const f = classifyFam(node.modelOrAlias.model || node.modelOrAlias.alias || "");
      if (f) ownFam = f;
    }
    if (node.model_or_alias && typeof node.model_or_alias === "object") {
      const f = classifyFam(node.model_or_alias.model || node.model_or_alias.alias || "");
      if (f) ownFam = f;
    }

    // Check if this object itself carries a quota metric
    let pct = null;
    if (node.remainingFraction !== undefined) { pct = toPct(node.remainingFraction, true, false); ownHasQuota = true; }
    else if (node.remaining_fraction !== undefined) { pct = toPct(node.remaining_fraction, true, false); ownHasQuota = true; }
    else if (node.remainingPercentage !== undefined) { pct = toPct(node.remainingPercentage, false, false); ownHasQuota = true; }
    else if (node.remaining_percentage !== undefined) { pct = toPct(node.remaining_percentage, false, false); ownHasQuota = true; }
    else if (node.remainingPercent !== undefined) { pct = toPct(node.remainingPercent, false, false); ownHasQuota = true; }
    else if (node.remaining_percent !== undefined) { pct = toPct(node.remaining_percent, false, false); ownHasQuota = true; }
    else if (node.percentRemaining !== undefined) { pct = toPct(node.percentRemaining, false, false); ownHasQuota = true; }
    else if (node.percent_remaining !== undefined) { pct = toPct(node.percent_remaining, false, false); ownHasQuota = true; }
    else if (node.remainingPct !== undefined) { pct = toPct(node.remainingPct, false, false); ownHasQuota = true; }
    else if (node.remaining_pct !== undefined) { pct = toPct(node.remaining_pct, false, false); ownHasQuota = true; }
    else if (node.remaining !== undefined && ownHasQuota) { pct = toPct(node.remaining, Number(node.remaining) <= 1.0001, false); }
    else if (node.usedFraction !== undefined && ownHasQuota) { pct = toPct(node.usedFraction, true, true); }
    else if (node.used_fraction !== undefined && ownHasQuota) { pct = toPct(node.used_fraction, true, true); }
    else if (node.usedPercentage !== undefined && ownHasQuota) { pct = toPct(node.usedPercentage, false, true); }
    else if (node.used_percentage !== undefined && ownHasQuota) { pct = toPct(node.used_percentage, false, true); }
    else if (node.usedPercent !== undefined && ownHasQuota) { pct = toPct(node.usedPercent, false, true); }
    else if (node.used_percent !== undefined && ownHasQuota) { pct = toPct(node.used_percent, false, true); }

    const rawReset = node.resetTime !== undefined ? node.resetTime
      : (node.reset_time !== undefined ? node.reset_time
      : (node.resetAt !== undefined ? node.resetAt
      : (node.reset_at !== undefined ? node.reset_at
      : (node.nextResetTime !== undefined ? node.nextResetTime
      : (node.next_reset_time !== undefined ? node.next_reset_time
      : (node.resetsAt !== undefined ? node.resetsAt : node.refreshTime))))));
    const resetMs = parseResetMs(rawReset);
    const resetStr = fmtResetMs(resetMs);
    const rawDur = node.windowDuration || node.window_duration || node.windowDurationSeconds || node.window_duration_seconds || node.duration || node.period || node.windowSeconds || node.window_seconds || (node.windowHours ? Number(node.windowHours) * 3600 : null) || null;
    const rawWinHint = node.windowType || node.window_type || node.bucketType || node.bucket_type || node.kind || node.periodType || "";
    const resolvedWin = inferWindowKind(rawWinHint || ownWin, resetMs, rawDur);

    if (pct !== null && ownHasQuota && ownFam) {
      if (resolvedWin) {
        recordSample(ownFam, resolvedWin, pct, resetStr);
      } else if (pct === 100 && !rawReset && (ownWin === "fiveHour" || ownWin === "weekly")) {
        recordSample(ownFam, ownWin, pct, "");
      }
    }

    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      const v = node[k];
      if (!v || typeof v !== "object") continue;
      const kLow = k.toLowerCase();
      const childFam = classifyFam(k) || ownFam;
      const childWin = inferWindowKind(k, 0, null) || ownWin;
      const childQuota = ownHasQuota || /quota|limit|usage|model|bucket|window|pool|credit|status/.test(kLow);
      walk(v, childFam, childWin, childQuota, depth + 1);
    }
  };

  walk(rawObj, "", "", false, 0);
  if (hits === 0) return null;

  const out = { gemini: null, claudeGpt: null };
  if (acc.gemini.fiveHourRem !== null || acc.gemini.weeklyRem !== null) out.gemini = acc.gemini;
  if (acc.claudeGpt.fiveHourRem !== null || acc.claudeGpt.weeklyRem !== null) out.claudeGpt = acc.claudeGpt;
  if (!out.gemini && !out.claudeGpt) return null;
  return out;
}

/**
 * Generates self-contained main-world JS snippet executed via webFrame.executeJavaScript.
 * Upgrades AudioWorklet DSP, getUserMedia constraints, StreamAudioTranscription languageCodes,
 * and passively observes official Connect-RPC / fetch model quota updates cleanly.
 */
function buildMainWorldVoicePatchScript(initialConfig) {
  const safeInit = JSON.stringify(initialConfig || {});
  const quotaExtractorSrc = extractQuotaFromRpcPayload.toString();
  return `(() => {
  "use strict";
  if (window.__RUDEX_VOICE_OPT_INSTALLED__) {
    try {
      window.postMessage({ __rudexVoice: "opt-config", payload: ${safeInit} }, "*");
    } catch (_e) {}
    return;
  }
  window.__RUDEX_VOICE_OPT_INSTALLED__ = true;

  let cfg = Object.assign({
    voiceEnabled: true,
    voiceEngine: "auto",
    voiceLocalModel: "ru-fast",
    localVoiceActive: false,
    languages: ["ru-RU", "en-US"],
    voiceExplicitLang: true,
    voiceChunkMs: 80,
    voiceDspFilter: true,
    voiceDisableWinIsolation: true,
    voiceAutoGain: true,
    voiceTextCleanup: true,
    locale: "ru",
    isWindows: /Windows/i.test(navigator.userAgent || ""),
    workletSource: "",
  }, ${safeInit});

  ${quotaExtractorSrc}

  let lastQuotaRpcSig = "";
  let lastQuotaRpcAt = 0;
  function looksLikeQuotaPayload(str) {
    if (typeof str !== "string" || str.length < 20 || str.length > 900000) return false;
    return (
      str.indexOf("remainingFraction") !== -1 ||
      str.indexOf("remaining_fraction") !== -1 ||
      str.indexOf("remainingPercentage") !== -1 ||
      str.indexOf("remaining_percentage") !== -1 ||
      str.indexOf("remainingPercent") !== -1 ||
      str.indexOf("remaining_percent") !== -1 ||
      str.indexOf("percentRemaining") !== -1 ||
      str.indexOf("usedPercentage") !== -1 ||
      str.indexOf("usedFraction") !== -1 ||
      str.indexOf("quotaInfo") !== -1 ||
      str.indexOf("quota_info") !== -1 ||
      str.indexOf("quotaPools") !== -1 ||
      str.indexOf("quota_pools") !== -1 ||
      str.indexOf("quotaBuckets") !== -1 ||
      str.indexOf("quota_buckets") !== -1 ||
      str.indexOf("modelQuotas") !== -1 ||
      str.indexOf("model_quotas") !== -1 ||
      str.indexOf("clientModelConfigs") !== -1 ||
      str.indexOf("client_model_configs") !== -1 ||
      str.indexOf("usageLimits") !== -1 ||
      str.indexOf("usage_limits") !== -1 ||
      str.indexOf("userStatus") !== -1 ||
      str.indexOf("user_status") !== -1
    );
  }
  function emitExtractedQuota(parsed) {
    const extracted = extractQuotaFromRpcPayload(parsed, Date.now(), cfg.locale || "ru");
    if (!extracted) return;
    const sig = JSON.stringify(extracted);
    const now = Date.now();
    if (sig === lastQuotaRpcSig && now - lastQuotaRpcAt < 1200) return;
    lastQuotaRpcSig = sig;
    lastQuotaRpcAt = now;
    postToPreload("quota-rpc", extracted);
  }
  function observeQuotaJsonText(rawText) {
    if (!looksLikeQuotaPayload(rawText)) return;
    try {
      let jsonStr = rawText;
      if (jsonStr[0] !== "{" && jsonStr[0] !== "[") {
        const firstBrace = jsonStr.indexOf("{");
        if (firstBrace === -1 || firstBrace > 64) return;
        jsonStr = jsonStr.slice(firstBrace);
      }
      emitExtractedQuota(JSON.parse(jsonStr));
    } catch (_e) {}
  }
  function observeQuotaBuffer(buf) {
    try {
      const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      if (!bytes || bytes.byteLength < 12 || bytes.byteLength > 900000) return;
      const dec = new TextDecoder("utf-8");
      // Handle Connect / gRPC-Web 5-byte length-prefixed JSON envelopes ([flags, len32be, payload...])
      if (bytes.byteLength >= 7 && (bytes[0] === 0 || bytes[0] === 2)) {
        const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        let pos = 0;
        let frames = 0;
        while (pos + 5 <= bytes.byteLength && frames < 16) {
          const flags = bytes[pos];
          const len = dv.getUint32(pos + 1, false);
          if (len === 0 || pos + 5 + len > bytes.byteLength) break;
          if ((flags & 1) === 0) {
            const chunkTxt = dec.decode(bytes.subarray(pos + 5, pos + 5 + len));
            observeQuotaJsonText(chunkTxt);
          }
          pos += 5 + len;
          frames += 1;
        }
        if (frames > 0) return;
      }
      observeQuotaJsonText(dec.decode(bytes));
    } catch (_e) {}
  }

  let cachedWorkletBlobUrl = "";
  let cachedWorkletKey = "";

  function getWorkletBlobUrl() {
    const key = String(cfg.localVoiceActive ? 64 : (cfg.voiceChunkMs || 80)) + ":" + (cfg.voiceDspFilter ? "1" : "0");
    if (cachedWorkletBlobUrl && cachedWorkletKey === key) return cachedWorkletBlobUrl;
    if (!cfg.workletSource) return "";
    try {
      const prev = cachedWorkletBlobUrl;
      const blob = new Blob([cfg.workletSource], { type: "application/javascript" });
      cachedWorkletBlobUrl = URL.createObjectURL(blob);
      cachedWorkletKey = key;
      if (prev) {
        try { URL.revokeObjectURL(prev); } catch (_r) {}
      }
      return cachedWorkletBlobUrl;
    } catch (_e) {
      return "";
    }
  }

  function postToPreload(kind, payload) {
    try {
      window.postMessage({ __rudexVoice: kind, payload }, "*");
    } catch (_e) {}
  }

  function emitVoiceState(active, extra) {
    const detail = Object.assign({ active: Boolean(active), languages: cfg.languages || [], mode: cfg.localVoiceActive ? "local" : "cloud", modelId: cfg.voiceLocalModel || "ru-fast" }, extra || {});
    postToPreload("voice-state", detail);
    try {
      window.dispatchEvent(new CustomEvent("rudex:voice-stream-state", { detail }));
    } catch (_e) {}
  }

  function cleanText(text) {
    if (!cfg.voiceTextCleanup || typeof text !== "string" || !text) return text;
    const lead = /^\\s/.test(text);
    const trail = /\\s$/.test(text);
    let out = text.replace(/[ \\t]{2,}/g, " ").trim();
    if (!out) return lead || trail ? " " : "";
    out = out.replace(/\\s+([.,!?;:])/g, "$1");
    out = out
      .replace(/(^|[^\\p{L}\\p{N}_])(?:антигра[еюи]те|анти\\s*гравити)(?=$|[^\\p{L}\\p{N}_])/giu, "$1Antigravity")
      .replace(/(^|[^\\p{L}\\p{N}_])(?:ру\\s+декс|рудекс)(?=$|[^\\p{L}\\p{N}_])/giu, "$1Rudex")
      .replace(/(^|[^\\p{L}\\p{N}_])(?:ги[тд]\\s*ха[бх]|ги[тд]ха)(?=$|[^\\p{L}\\p{N}_])/giu, "$1GitHub")
      .replace(/(^|[^\\p{L}\\p{N}_])кишировани([еяюи]|ем|ям|ями|ях)(?=$|[^\\p{L}\\p{N}_])/giu, "$1кэшировани$2")
      .replace(/(^|[^\\p{L}\\p{N}_])пауэр\\s+шелл(?=$|[^\\p{L}\\p{N}_])/giu, "$1PowerShell")
      .replace(/(^|[^\\p{L}\\p{N}_])тайп\\s+скрипт(?=$|[^\\p{L}\\p{N}_])/giu, "$1TypeScript")
      .replace(/(^|[^\\p{L}\\p{N}_])джава\\s+скрипт(?=$|[^\\p{L}\\p{N}_])/giu, "$1JavaScript")
      .replace(/(^|[^\\p{L}\\p{N}_])веб\\s+сокет(?=$|[^\\p{L}\\p{N}_])/giu, "$1WebSocket");
    out = out.replace(/(^|[^\\p{L}\\p{N}_])([\\p{L}]{3,})\\s+\\2(?=$|[^\\p{L}\\p{N}_])/giu, "$1$2");
    return (lead ? " " : "") + out + (trail ? " " : "");
  }

  // Local virtual StreamAudioTranscription sessions bridged to Electron Main (Sherpa-ONNX)
  const localStreamsById = new Map();
  const localStreamsBySession = new Map();
  const suppressedCloudStreamIds = new Set();
  const wsRawOnMsgMap = new WeakMap();
  let lastAbortOnSendAt = 0;

  function deliverSyntheticToSocket(ws, obj) {
    if (!ws) return;
    const fn = wsRawOnMsgMap.get(ws) || ws.onmessage;
    if (typeof fn !== "function") return;
    try {
      const ev = new MessageEvent("message", { data: JSON.stringify(obj) });
      fn.call(ws, ev);
    } catch (_e) {}
  }

  function abortActiveVoiceStreamsOnSend() {
    lastAbortOnSendAt = Date.now();
    if (localStreamsById.size > 0) {
      const sessions = Array.from(localStreamsById.values());
      localStreamsById.clear();
      localStreamsBySession.clear();
      for (let i = 0; i < sessions.length; i += 1) {
        const sess = sessions[i];
        if (!sess) continue;
        postToPreload("local-cmd", { cmd: "cancel", sessionId: sess.sessionId });
        deliverSyntheticToSocket(sess.ws, {
          streamId: sess.streamId,
          type: "data",
          payload: { complete: {} },
        });
        deliverSyntheticToSocket(sess.ws, {
          streamId: sess.streamId,
          type: "end",
        });
      }
      emitVoiceState(false, { mode: "local", abortedOnSend: true });
    }
    if (activeCloudStreamIds.size > 0) {
      for (const sid of activeCloudStreamIds) {
        suppressedCloudStreamIds.add(sid);
      }
      emitVoiceState(false, { mode: "cloud", abortedOnSend: true });
    }
  }
  const activeCloudStreamIds = new Set();

  window.addEventListener("message", (ev) => {
    if (!ev || ev.source !== window || !ev.data || typeof ev.data !== "object") return;
    const kind = ev.data.__rudexVoice;
    if (kind === "opt-config" && ev.data.payload && typeof ev.data.payload === "object") {
      cfg = Object.assign({}, cfg, ev.data.payload);
      return;
    }
    if (kind === "abort-on-send") {
      abortActiveVoiceStreamsOnSend();
      return;
    }
    if (kind === "local-reply" && ev.data.payload && typeof ev.data.payload === "object") {
      const rep = ev.data.payload;
      const sess = (rep.streamId && localStreamsById.get(rep.streamId)) || (rep.sessionId && localStreamsBySession.get(rep.sessionId));
      if (!sess) return;
      if (rep.type === "partial") {
        const txt = typeof rep.text === "string" ? cleanText(rep.text) : "";
        if (txt) {
          deliverSyntheticToSocket(sess.ws, {
            streamId: sess.streamId,
            type: "data",
            payload: { transcription: { text: txt, isFinal: false } },
          });
        }
      } else if (rep.type === "final") {
        const txt = typeof rep.text === "string" ? cleanText(rep.text) : "";
        deliverSyntheticToSocket(sess.ws, {
          streamId: sess.streamId,
          type: "data",
          payload: { transcription: { text: txt, isFinal: true } },
        });
        deliverSyntheticToSocket(sess.ws, {
          streamId: sess.streamId,
          type: "data",
          payload: { complete: {} },
        });
        deliverSyntheticToSocket(sess.ws, {
          streamId: sess.streamId,
          type: "end",
        });
        localStreamsById.delete(sess.streamId);
        localStreamsBySession.delete(sess.sessionId);
        if (localStreamsById.size === 0) emitVoiceState(false, { mode: "local" });
      } else if (rep.type === "error") {
        deliverSyntheticToSocket(sess.ws, {
          streamId: sess.streamId,
          type: "end",
          statusCode: 13,
          error: rep.error || "Local voice error",
        });
        localStreamsById.delete(sess.streamId);
        localStreamsBySession.delete(sess.sessionId);
        if (localStreamsById.size === 0) emitVoiceState(false, { mode: "local" });
      }
    }
  });

  // 1. Upgrade AudioWorklet.prototype.addModule ONLY for Dictation (/audio_processor.js).
  // NEVER touch inline data:application/javascript;base64 worklets used by Antigravity Live Voice Mode
  // (Voice Mode requires native 40ms/640-sample unmodified PCM frames for low-latency VAD & 120ms barge-in).
  try {
    const AWProto = typeof AudioWorklet !== "undefined" ? AudioWorklet.prototype : null;
    if (AWProto && typeof AWProto.addModule === "function" && !AWProto.__rudexPatched) {
      const origAddModule = AWProto.addModule;
      AWProto.addModule = function rudexAddModule(moduleURL, options) {
        try {
          if (cfg.voiceEnabled && typeof moduleURL === "string" && moduleURL.indexOf("audio_processor.js") !== -1) {
            const blobUrl = getWorkletBlobUrl();
            if (blobUrl) {
              return origAddModule.call(this, blobUrl, options).catch(() => origAddModule.call(this, moduleURL, options));
            }
          }
        } catch (_e) {}
        return origAddModule.call(this, moduleURL, options);
      };
      AWProto.__rudexPatched = true;
    }
  } catch (_e) {}

  // 2. Optimize getUserMedia constraints ONLY for Dictation (skip Live Voice Mode which explicitly sets autoGainControl: false)
  try {
    const md = navigator && navigator.mediaDevices;
    if (md && typeof md.getUserMedia === "function" && !md.__rudexMicPatched) {
      const origGum = md.getUserMedia.bind(md);
      md.getUserMedia = function rudexGetUserMedia(constraints) {
        try {
          const audioObj = constraints && typeof constraints === "object" && constraints.audio && typeof constraints.audio === "object"
            ? constraints.audio
            : null;
          // Live Voice Mode (xYa with deviceId) passes autoGainControl: false and relies on full-duplex AEC + voiceIsolation
          if (cfg.voiceEnabled && audioObj && audioObj.autoGainControl !== false) {
            const nextAudio = Object.assign({}, audioObj);
            const isWinRuntime = Boolean(cfg.isWindows || (typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent || "")));
            if (cfg.voiceDisableWinIsolation && isWinRuntime && "voiceIsolation" in nextAudio) {
              delete nextAudio.voiceIsolation;
            }
            if (cfg.voiceAutoGain && nextAudio.autoGainControl === undefined) {
              nextAudio.autoGainControl = true;
            }
            const nextConstraints = Object.assign({}, constraints, { audio: nextAudio });
            return origGum(nextConstraints).catch((err) => {
              const name = err && err.name ? String(err.name) : "";
              if (name === "OverconstrainedError" || name === "NotFoundError") {
                const relaxed = Object.assign({}, nextAudio);
                delete relaxed.deviceId;
                delete relaxed.voiceIsolation;
                return origGum(Object.assign({}, constraints, { audio: relaxed })).catch(() => origGum(constraints));
              }
              throw err;
            });
          }
        } catch (_e) {}
        return origGum(constraints);
      };
      md.__rudexMicPatched = true;
    }
  } catch (_e) {}

  // 3. Intercept ONLY /connect-websocket for Instant Local Streaming (Sherpa-ONNX) OR Cloud languageCodes + cleanup
  // (Never inspect or wrap Voice Mode's dedicated binary/relay WebSocket!)
  try {
    const WS = window.WebSocket;
    if (typeof WS === "function" && WS.prototype && !WS.prototype.__rudexWsPatched) {
      const origSend = WS.prototype.send;
      const activeAudioStreams = activeCloudStreamIds;
      const isConnectWs = (ws) => {
        try {
          const u = ws && typeof ws.url === "string" ? ws.url : "";
          return !u || u.indexOf("connect-websocket") !== -1;
        } catch (_e) { return true; }
      };

      const wrapOnMessage = (ws) => {
        if (!ws || ws.__rudexMsgWrapped) return;
        ws.__rudexMsgWrapped = true;
        ws.addEventListener("message", (ev) => {
          if (typeof ev.data !== "string" || (activeAudioStreams.size === 0 && suppressedCloudStreamIds.size === 0)) return;
          if (ev.data.indexOf('"end"') !== -1) {
            try {
              const parsed = JSON.parse(ev.data);
              if (parsed && parsed.type === "end" && (activeAudioStreams.has(parsed.streamId) || suppressedCloudStreamIds.has(parsed.streamId))) {
                activeAudioStreams.delete(parsed.streamId);
                suppressedCloudStreamIds.delete(parsed.streamId);
                if (activeAudioStreams.size === 0) emitVoiceState(false, { mode: "cloud" });
              }
            } catch (_e) {}
          }
        });
        ws.addEventListener("close", () => {
          suppressedCloudStreamIds.clear();
          if (activeAudioStreams.size > 0) {
            activeAudioStreams.clear();
            emitVoiceState(false, { mode: "cloud" });
          }
        });
      };

      const origAddEvt = WS.prototype.addEventListener;
      const attachPassiveQuotaListener = (ws) => {
        if (!ws || ws.__rudexQuotaListenerAttached || !isConnectWs(ws)) return;
        ws.__rudexQuotaListenerAttached = true;
        try {
          origAddEvt.call(ws, "message", (ev) => {
            if (ev && typeof ev.data === "string") observeQuotaJsonText(ev.data);
          });
        } catch (_e) {}
      };
      if (typeof origAddEvt === "function") {
        WS.prototype.addEventListener = function rudexWsAddEventListener(type, listener, options) {
          if (type === "message") attachPassiveQuotaListener(this);
          return origAddEvt.call(this, type, listener, options);
        };
      }

      const origOnMsgDesc = Object.getOwnPropertyDescriptor(WS.prototype, "onmessage");
      if (origOnMsgDesc && typeof origOnMsgDesc.set === "function") {
        Object.defineProperty(WS.prototype, "onmessage", {
          configurable: true,
          enumerable: true,
          get() { return origOnMsgDesc.get ? origOnMsgDesc.get.call(this) : undefined; },
          set(fn) {
            if (typeof fn !== "function" || !isConnectWs(this)) {
              wsRawOnMsgMap.delete(this);
              return origOnMsgDesc.set.call(this, fn);
            }
            wsRawOnMsgMap.set(this, fn);
            const wrapped = function rudexOnMessage(ev) {
              try {
                if (ev && typeof ev.data === "string") {
                  observeQuotaJsonText(ev.data);
                  if (cfg.voiceEnabled && ev.data.indexOf('"transcription"') !== -1) {
                    const parsed = JSON.parse(ev.data);
                    if (parsed && parsed.streamId && suppressedCloudStreamIds.has(parsed.streamId) && parsed.type === "data" && parsed.payload && parsed.payload.transcription) {
                      return;
                    }
                    if (cfg.voiceTextCleanup && parsed && parsed.type === "data" && parsed.payload && parsed.payload.transcription && typeof parsed.payload.transcription.text === "string") {
                      const nextTxt = cleanText(parsed.payload.transcription.text);
                      if (nextTxt !== parsed.payload.transcription.text) {
                        parsed.payload.transcription.text = nextTxt;
                        const syntheticEv = new MessageEvent("message", {
                          data: JSON.stringify(parsed),
                          origin: ev.origin,
                          lastEventId: ev.lastEventId,
                        });
                        return fn.call(this, syntheticEv);
                      }
                    }
                  }
                }
              } catch (_e) {}
              return fn.call(this, ev);
            };
            return origOnMsgDesc.set.call(this, wrapped);
          },
        });
      }

      WS.prototype.send = function rudexWsSend(data) {
        attachPassiveQuotaListener(this);
        try {
          if (cfg.voiceEnabled && typeof data === "string" && isConnectWs(this)) {
            // Fast path: local instant Sherpa-ONNX streaming for StreamAudioTranscription / SendAudioChunk / EndAudioSession
            if (data.indexOf("StreamAudioTranscription") !== -1) {
              const msg = JSON.parse(data);
              if (msg && msg.type === "start" && typeof msg.procedure === "string" && /StreamAudioTranscription$/i.test(msg.procedure) && msg.payload && typeof msg.payload === "object") {
                if (cfg.localVoiceActive && (wsRawOnMsgMap.has(this) || typeof this.onmessage === "function")) {
                  const sid = "rudex-local-" + String(msg.streamId || Date.now());
                  const sess = { ws: this, streamId: msg.streamId, sessionId: sid };
                  localStreamsById.set(msg.streamId, sess);
                  localStreamsBySession.set(sid, sess);
                  postToPreload("local-cmd", { cmd: "start", streamId: msg.streamId, sessionId: sid, modelId: cfg.voiceLocalModel || "ru-fast" });
                  Promise.resolve().then(() => {
                    if (localStreamsById.has(msg.streamId)) {
                      deliverSyntheticToSocket(sess.ws, {
                        streamId: sess.streamId,
                        type: "data",
                        payload: { ready: { sessionId: sid } },
                      });
                    }
                  });
                  emitVoiceState(true, { mode: "local", modelId: cfg.voiceLocalModel || "ru-fast" });
                  return;
                }
                // Cloud fallback: inject languageCodes
                wrapOnMessage(this);
                if (msg.streamId) activeAudioStreams.add(msg.streamId);
                const existing = Array.isArray(msg.payload.languageCodes) ? msg.payload.languageCodes.filter(Boolean) : [];
                const langs = Array.isArray(cfg.languages) ? cfg.languages.filter(Boolean) : [];
                if (existing.length === 0 && langs.length > 0) {
                  msg.payload.languageCodes = langs;
                  msg.payload.languageCodesExplicit = Boolean(cfg.voiceExplicitLang !== false);
                  data = JSON.stringify(msg);
                }
                emitVoiceState(true, { mode: "cloud", languages: existing.length > 0 ? existing : langs });
              }
            } else if (data.indexOf("SendAudioChunk") !== -1) {
              const msg = JSON.parse(data);
              const sid = msg && msg.payload && msg.payload.sessionId;
              if (sid && (localStreamsBySession.has(sid) || String(sid).startsWith("rudex-local-"))) {
                const wsRef = this;
                const reqStreamId = msg.streamId;
                if (localStreamsBySession.has(sid)) {
                  postToPreload("local-cmd", { cmd: "chunk", sessionId: sid, data: msg.payload.data || "" });
                }
                Promise.resolve().then(() => {
                  deliverSyntheticToSocket(wsRef, { streamId: reqStreamId, type: "data", payload: {} });
                  deliverSyntheticToSocket(wsRef, { streamId: reqStreamId, type: "end" });
                });
                return;
              }
            } else if (data.indexOf("EndAudioSession") !== -1) {
              const msg = JSON.parse(data);
              const sid = msg && msg.payload && msg.payload.sessionId;
              if (sid && (localStreamsBySession.has(sid) || String(sid).startsWith("rudex-local-"))) {
                const wsRef = this;
                const reqStreamId = msg.streamId;
                if (localStreamsBySession.has(sid)) {
                  postToPreload("local-cmd", { cmd: "end", sessionId: sid });
                }
                Promise.resolve().then(() => {
                  deliverSyntheticToSocket(wsRef, { streamId: reqStreamId, type: "data", payload: {} });
                  deliverSyntheticToSocket(wsRef, { streamId: reqStreamId, type: "end" });
                });
                return;
              }
              emitVoiceState(false, { mode: "cloud" });
            } else if ((activeAudioStreams.size > 0 || localStreamsById.size > 0) && data.indexOf('"cancel"') !== -1) {
              try {
                const msg = JSON.parse(data);
                if (msg && msg.type === "cancel") {
                  if (localStreamsById.has(msg.streamId)) {
                    const sess = localStreamsById.get(msg.streamId);
                    localStreamsById.delete(msg.streamId);
                    localStreamsBySession.delete(sess.sessionId);
                    postToPreload("local-cmd", { cmd: "cancel", sessionId: sess.sessionId });
                    if (localStreamsById.size === 0) emitVoiceState(false, { mode: "local" });
                    return;
                  }
                  if (activeAudioStreams.has(msg.streamId)) {
                    activeAudioStreams.delete(msg.streamId);
                    if (activeAudioStreams.size === 0) emitVoiceState(false, { mode: "cloud" });
                  }
                }
              } catch (_c) {}
            }
          }
        } catch (_e) {}
        return origSend.call(this, data);
      };
      WS.prototype.__rudexWsPatched = true;
    }
  } catch (_e) {}

  // 4. Fallback HTTP gRPC-Web fetch interceptor for StreamAudioTranscription (cloud fallback)
  try {
    if (typeof window.fetch === "function" && !window.fetch.__rudexVoicePatched) {
      const origFetch = window.fetch.bind(window);
      const wrappedFetch = function rudexFetch(input, init) {
        try {
          const url = typeof input === "string" ? input : (input && input.url ? String(input.url) : "");
          if (cfg.voiceEnabled && url.indexOf("StreamAudioTranscription") !== -1 && init && init.body) {
            const langs = Array.isArray(cfg.languages) ? cfg.languages.filter(Boolean) : [];
            if (langs.length > 0) {
              let nextBody = init.body;
              if (typeof nextBody === "string" && nextBody[0] === "{") {
                const obj = JSON.parse(nextBody);
                if (!Array.isArray(obj.languageCodes) || obj.languageCodes.length === 0) {
                  obj.languageCodes = langs;
                  obj.languageCodesExplicit = Boolean(cfg.voiceExplicitLang !== false);
                  nextBody = JSON.stringify(obj);
                }
              } else if (nextBody instanceof Uint8Array || nextBody instanceof ArrayBuffer || (ArrayBuffer.isView && ArrayBuffer.isView(nextBody))) {
                const bytes = nextBody instanceof Uint8Array ? nextBody : (nextBody instanceof ArrayBuffer ? new Uint8Array(nextBody) : new Uint8Array(nextBody.buffer, nextBody.byteOffset, nextBody.byteLength));
                if (bytes.byteLength >= 7 && bytes[0] === 0) {
                  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                  const len = dv.getUint32(1, false);
                  if (len + 5 === bytes.byteLength) {
                    const txt = new TextDecoder("utf-8").decode(bytes.subarray(5, 5 + len));
                    if (txt[0] === "{") {
                      const obj = JSON.parse(txt);
                      if (!Array.isArray(obj.languageCodes) || obj.languageCodes.length === 0) {
                        obj.languageCodes = langs;
                        obj.languageCodesExplicit = Boolean(cfg.voiceExplicitLang !== false);
                        const enc = new TextEncoder().encode(JSON.stringify(obj));
                        const out = new Uint8Array(5 + enc.byteLength);
                        out[0] = 0;
                        new DataView(out.buffer).setUint32(1, enc.byteLength, false);
                        out.set(enc, 5);
                        nextBody = out;
                      }
                    }
                  }
                }
              }
              emitVoiceState(true, { mode: "cloud", languages: langs });
              return origFetch(input, Object.assign({}, init, { body: nextBody }));
            }
          } else if (cfg.voiceEnabled && url.indexOf("EndAudioSession") !== -1) {
            emitVoiceState(false, { mode: "cloud" });
          }
        } catch (_e) {}
        const resPromise = origFetch(input, init);
        try {
          const url = typeof input === "string" ? input : (input && input.url ? String(input.url) : "");
          const isLocalOrigin = !url || url.startsWith("/") || url.indexOf("127.0.0.1") !== -1 || url.indexOf("localhost") !== -1;
          if (isLocalOrigin && resPromise && typeof resPromise.then === "function") {
            resPromise.then((res) => {
              try {
                if (!res || !res.ok || typeof res.clone !== "function") return;
                const ct = res.headers && typeof res.headers.get === "function" ? String(res.headers.get("content-type") || "").toLowerCase() : "";
                if (ct && ct.indexOf("json") === -1 && ct.indexOf("connect") === -1 && ct.indexOf("grpc") === -1 && ct.indexOf("text/") === -1) return;
                const cloned = res.clone();
                if ((ct.indexOf("connect+") !== -1 || ct.indexOf("grpc") !== -1) && typeof cloned.arrayBuffer === "function") {
                  cloned.arrayBuffer().then(observeQuotaBuffer).catch(() => {});
                } else {
                  cloned.text().then(observeQuotaJsonText).catch(() => {});
                }
              } catch (_e2) {}
            }).catch(() => {});
          }
        } catch (_e3) {}
        return resPromise;
      };
      wrappedFetch.__rudexVoicePatched = true;
      window.fetch = wrappedFetch;
    }
  } catch (_e) {}

  // 5. Passive Main-World composer attachment observer (catches detached React <input type="file">, drop & paste files across contextIsolation)
  try {
    if (!window.__RUDEX_FILE_OBS_INSTALLED__) {
      window.__RUDEX_FILE_OBS_INSTALLED__ = true;
      const MAX_DRAFT_FILE_BYTES = 12 * 1024 * 1024;
      const emitComposerFile = (file) => {
        try {
          if (!file || typeof FileReader === "undefined") return;
          const size = Number(file.size) || 0;
          if (size <= 0 || size > MAX_DRAFT_FILE_BYTES) return;
          const name = String(file.name || "").trim() || ("file-" + Date.now());
          const mime = String(file.type || "").toLowerCase();
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string" && reader.result.startsWith("data:")) {
              postToPreload("composer-file", { name, mime, size, dataUrl: reader.result });
            }
          };
          reader.readAsDataURL(file);
        } catch (_e) {}
      };
      const readFileList = (list) => {
        if (!list || !list.length) return;
        for (let i = 0; i < list.length && i < 6; i += 1) {
          if (list[i]) emitComposerFile(list[i]);
        }
      };
      // Hook detached <input type="file"> created via document.createElement("input") without appending to DOM
      const inpProto = typeof HTMLInputElement !== "undefined" ? HTMLInputElement.prototype : null;
      if (inpProto && typeof inpProto.click === "function" && !inpProto.__rudexFileClickPatched) {
        const origInpClick = inpProto.click;
        inpProto.click = function rudexFileInputClick() {
          try {
            const inStudio = this && typeof this.closest === "function" && Boolean(this.closest("#rudex-studio-host"));
            if (this && !inStudio && String(this.type || "").toLowerCase() === "file" && !this.__rudexFileObsBound) {
              this.__rudexFileObsBound = true;
              this.addEventListener("change", () => {
                try {
                  if (this.files && this.files.length > 0) readFileList(this.files);
                } catch (_e) {}
              });
            }
          } catch (_e) {}
          return origInpClick.apply(this, arguments);
        };
        inpProto.__rudexFileClickPatched = true;
      }
      window.addEventListener("drop", (ev) => {
        try {
          if (ev && ev.target && typeof ev.target.closest === "function" && ev.target.closest("#rudex-studio-host")) return;
          if (ev && ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
            readFileList(ev.dataTransfer.files);
          }
        } catch (_e) {}
      }, true);
      window.addEventListener("paste", (ev) => {
        try {
          if (ev && ev.target && typeof ev.target.closest === "function" && ev.target.closest("#rudex-studio-host")) return;
          const items = ev && ev.clipboardData && ev.clipboardData.items;
          if (!items || !items.length) return;
          for (let i = 0; i < items.length && i < 6; i += 1) {
            if (items[i] && items[i].kind === "file" && typeof items[i].getAsFile === "function") {
              const f = items[i].getAsFile();
              if (f) emitComposerFile(f);
            }
          }
        } catch (_e) {}
      }, true);
    }
  } catch (_e) {}

  // 6. Passive Main-World 0ms SPA navigation bridge (notifies preload instantly on pushState/replaceState/popstate)
  try {
    if (!window.__RUDEX_NAV_OBS_INSTALLED__) {
      window.__RUDEX_NAV_OBS_INSTALLED__ = true;
      const emitNav = () => {
        try {
          const url = String(location.pathname || "") + String(location.search || "") + String(location.hash || "");
          postToPreload("nav-change", { url });
        } catch (_e) {}
      };
      if (window.history) {
        ["pushState", "replaceState"].forEach((m) => {
          const orig = window.history[m];
          if (typeof orig === "function" && !orig.__rudexNavPatched) {
            const wrapped = function rudexNavWrap() {
              const res = orig.apply(this, arguments);
              emitNav();
              return res;
            };
            wrapped.__rudexNavPatched = true;
            window.history[m] = wrapped;
          }
        });
      }
      window.addEventListener("popstate", emitNav, true);
      window.addEventListener("hashchange", emitNav, true);
    }
  } catch (_e) {}
})();`;
}

function isSendActionButton(el) {
  if (!el) return false;
  try {
    if (typeof el.getAttribute === "function") {
      if (el.getAttribute("data-rudex-comp-send") === "1") return true;
      const meta = [
        el.getAttribute("data-testid") || "",
        el.getAttribute("aria-label") || "",
        el.getAttribute("title") || "",
      ].join(" ");
      if (/\b(?:send|submit|queue|enqueue)\b|отправ|очеред/i.test(meta)) return true;
    }
  } catch (_e) {}
  return false;
}

/**
 * Finds the native Antigravity dictation toggle button (idle or active recording).
 * Never matches "Stop Recording and Send" / "Остановить запись и отправить" send buttons!
 */
function findNativeDictationButton(doc, hostEl) {
  if (!doc || typeof doc.querySelector !== "function") return null;
  const pickMatch = (sel) => {
    const nodes = typeof doc.querySelectorAll === "function" ? doc.querySelectorAll(sel) : [doc.querySelector(sel)];
    for (let j = 0; nodes && j < nodes.length; j += 1) {
      const el = nodes[j];
      if (!el) continue;
      if (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el)) continue;
      if (isSendActionButton(el)) continue;
      return el;
    }
    return null;
  };
  try {
    // 1. Active recording button first
    const activeSelectors = [
      '[data-rudex-comp-mic-active="1"]',
      'button[aria-label="Stop recording"]',
      'button[aria-label="Остановить запись"]',
      'button[aria-label*="stop record" i]',
      'button[aria-label*="stop dictat" i]',
      'button[aria-label*="остановить запись" i]',
      'button[aria-label*="останов" i][aria-label*="запис" i]',
      'button[aria-pressed="true"][aria-label*="dictat" i]',
      'button[aria-pressed="true"][aria-label*="record" i]',
      'button[data-tooltip-id="input-send-button-record-tooltip"].bg-red-500',
    ];
    for (let i = 0; i < activeSelectors.length; i += 1) {
      const el = pickMatch(activeSelectors[i]);
      if (el) return { button: el, active: true };
    }
    // 2. Idle record button
    const idleSelectors = [
      'button[data-tooltip-id="input-send-button-record-tooltip"]',
      'button[aria-label="Record voice memo"]',
      'button[aria-label*="record voice" i]',
      'button[aria-label*="start dictat" i]',
      'button[aria-label*="записать голосовое" i]',
      'button[aria-label*="диктов" i]',
      '[data-rudex-comp-mic="1"] button',
      'button[data-rudex-comp-mic="1"]',
    ];
    for (let i = 0; i < idleSelectors.length; i += 1) {
      const el = pickMatch(idleSelectors[i]);
      if (el) {
        const cls = typeof el.className === "string" ? el.className : "";
        const isAct = /\bbg-red-500\b/.test(cls) || String(el.getAttribute && el.getAttribute("aria-pressed") || "") === "true";
        return { button: el, active: isAct };
      }
    }
  } catch (_e) {}
  return null;
}

function buildVoiceMainWorldPayload(rawOpt, locale, localVoiceInstalled) {
  const settings = sanitizeOptimizationSettings(rawOpt);
  const localVoiceActive = Boolean(
    settings.voiceEnabled &&
    localVoiceInstalled &&
    settings.voiceEngine !== "cloud"
  );
  const chunkMs = localVoiceActive ? 64 : settings.voiceChunkMs;
  const chunkSamples = Math.round((chunkMs / 1000) * 16000);
  return {
    voiceEnabled: settings.voiceEnabled,
    voiceEngine: settings.voiceEngine,
    voiceLocalModel: settings.voiceLocalModel,
    localVoiceActive,
    languages: resolveVoiceLanguageCodes(settings, locale),
    voiceExplicitLang: settings.voiceExplicitLang,
    voiceChunkMs: chunkMs,
    voiceDspFilter: settings.voiceDspFilter,
    voiceDisableWinIsolation: settings.voiceDisableWinIsolation,
    locale: locale === "en" ? "en" : "ru",
    voiceAutoGain: settings.voiceAutoGain,
    voiceTextCleanup: settings.voiceTextCleanup,
    isWindows: typeof navigator !== "undefined" ? /Windows/i.test(navigator.userAgent || "") : false,
    workletSource: buildUpgradedAudioWorkletSource(chunkSamples, settings.voiceDspFilter),
  };
}

/**
 * Early document_start initializer called at top of preload.js BEFORE Antigravity's
 * /main.js creates its persistent /connect-websocket socket.
 * Wires the contextIsolation-safe window.postMessage <-> Electron IPC bridge for
 * Local Instant Sherpa-ONNX streaming dictation.
 */
function bootMainWorldVoiceEarly(options = {}) {
  const win = options.window || (typeof window !== "undefined" ? window : null);
  const webFrame = options.webFrame || null;
  const ipc = options.ipcRenderer || null;
  const boot = options.boot && typeof options.boot === "object" ? options.boot : {};
  const locale = options.locale === "en" ? "en" : "ru";
  const localVoiceInstalled = Boolean(boot.localVoiceInstalled);
  const payload = buildVoiceMainWorldPayload(boot.optimization, locale, localVoiceInstalled);

  if (win) {
    win.__RUDEX_LOCAL_VOICE_READY__ = localVoiceInstalled;
  }

  if (webFrame && typeof webFrame.executeJavaScript === "function") {
    try {
      const p = webFrame.executeJavaScript(buildMainWorldVoicePatchScript(payload), false);
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_e) {}
  }

  if (win && ipc && !win.__RUDEX_LOCAL_VOICE_BRIDGE_WIRED__) {
    win.__RUDEX_LOCAL_VOICE_BRIDGE_WIRED__ = true;
    try {
      win.addEventListener("message", (ev) => {
        if (!ev || ev.source !== win || !ev.data || typeof ev.data !== "object") return;
        if (ev.data.__rudexVoice === "local-cmd" && ev.data.payload && typeof ipc.send === "function") {
          ipc.send("agy-studio:local-voice-cmd", ev.data.payload);
        }
      });
    } catch (_e) {}
    try {
      if (typeof ipc.on === "function") {
        ipc.on("agy-studio:local-voice-event", (_event, data) => {
          if (data && typeof win.postMessage === "function") {
            try { win.postMessage({ __rudexVoice: "local-reply", payload: data }, "*"); } catch (_e) {}
          }
        });
      }
    } catch (_e) {}
  }

  return payload;
}

/**
 * Runtime controller installed inside preload.js alongside studio-panel.
 */
function createRudexOptimizer(options = {}) {
  const doc = options.document || (typeof document !== "undefined" ? document : null);
  const win = options.window || (typeof window !== "undefined" ? window : null);
  const webFrame = options.webFrame || null;
  const onCycleLangPreset = typeof options.onCycleLangPreset === "function" ? options.onCycleLangPreset : null;

  let settings = sanitizeOptimizationSettings(options.initialSettings);
  let locale = options.initialLocale === "en" ? "en" : "ru";
  let localVoiceInstalled = typeof options.localVoiceInstalled === "boolean"
    ? options.localVoiceInstalled
    : Boolean(win && win.__RUDEX_LOCAL_VOICE_READY__);
  let styleEl = null;
  let badgeEl = null;
  let badgeTimer = null;
  let badgeResizeObs = null;
  let badgeObservedEl = null;
  let dictating = false;
  let dictatingMode = localVoiceInstalled && settings.voiceEngine !== "cloud" ? "local" : "cloud";
  let dictatingStartedAt = 0;
  let mainWorldInjected = Boolean(win && win.__RUDEX_LOCAL_VOICE_BRIDGE_WIRED__);
  let listenersAttached = false;
  let destroyed = false;

  function buildMainWorldConfig() {
    return buildVoiceMainWorldPayload(settings, locale, localVoiceInstalled);
  }

  function syncMainWorldVoiceConfig() {
    if (destroyed || !win) return;
    const payload = buildMainWorldConfig();
    if (!mainWorldInjected && webFrame && typeof webFrame.executeJavaScript === "function") {
      mainWorldInjected = true;
      try {
        const p = webFrame.executeJavaScript(buildMainWorldVoicePatchScript(payload), false);
        if (p && typeof p.catch === "function") p.catch(() => {});
        return;
      } catch (_e) {
        mainWorldInjected = false;
      }
    }
    try {
      if (typeof win.postMessage === "function") {
        win.postMessage({ __rudexVoice: "opt-config", payload }, "*");
      }
    } catch (_e) {}
    try {
      if (typeof win.CustomEvent === "function" && typeof win.dispatchEvent === "function") {
        win.dispatchEvent(new win.CustomEvent("rudex:opt-config", { detail: payload }));
      }
    } catch (_e) {}
  }

  function ensureStyleEl() {
    if (!doc || !doc.head) return null;
    if (styleEl && styleEl.parentNode) return styleEl;
    const existing = typeof doc.getElementById === "function" ? doc.getElementById("rudex-anim-polish") : null;
    if (existing) {
      styleEl = existing;
      return styleEl;
    }
    styleEl = doc.createElement("style");
    styleEl.id = "rudex-anim-polish";
    styleEl.setAttribute("data-rudex-ignore", "1");
    doc.head.appendChild(styleEl);
    return styleEl;
  }

  function applyAnimationCss() {
    if (destroyed || !doc) return;
    const css = buildAnimationPolishCss(settings);
    const el = ensureStyleEl();
    if (el && el.textContent !== css) {
      el.textContent = css;
    }
    if (doc.documentElement && typeof doc.documentElement.setAttribute === "function") {
      doc.documentElement.setAttribute("data-rudex-anim-mode", settings.animMode);
    }
  }

  function formatElapsed(ms) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function findComposerAnchorEl() {
    if (!doc || typeof doc.querySelector !== "function") return null;
    try {
      const themed = doc.querySelector('[data-rudex-theme-composer="1"]');
      if (themed) return themed;
      const ed = doc.querySelector('[contenteditable="true"], textarea');
      if (ed && typeof ed.closest === "function") {
        return ed.closest("form, [class*='rounded-']") || ed.parentElement || ed;
      }
      return ed || null;
    } catch (_e) {
      return null;
    }
  }

  function disconnectBadgeResizeObs() {
    if (badgeResizeObs) {
      try { badgeResizeObs.disconnect(); } catch (_e) {}
      badgeResizeObs = null;
    }
    badgeObservedEl = null;
  }

  function positionBadge() {
    if (!badgeEl || !doc || !win) return;
    const vw = win.innerWidth || 1200;
    const vh = win.innerHeight || 800;
    let leftPx = 96;
    let topPx = Math.max(24, vh - 34);
    let anchoredToMic = false;
    try {
      const micInfo = findNativeDictationButton(doc);
      if (micInfo && micInfo.button && typeof micInfo.button.getBoundingClientRect === "function") {
        const mr = micInfo.button.getBoundingClientRect();
        if (mr && mr.width > 8 && mr.height > 8) {
          leftPx = Math.min(vw - 74, Math.max(12, Math.round(mr.right + 8)));
          topPx = Math.min(vh - 16, Math.max(16, Math.round(mr.top + mr.height / 2)));
          anchoredToMic = true;
        }
      }
      const comp = findComposerAnchorEl();
      if (comp && typeof comp.getBoundingClientRect === "function") {
        if (!anchoredToMic) {
          const r = comp.getBoundingClientRect();
          if (r && r.width > 120 && r.height > 20) {
            leftPx = Math.min(vw - 74, Math.max(12, Math.round(r.left + 58)));
            topPx = Math.min(vh - 16, Math.max(16, Math.round(r.bottom + 18)));
          }
        }
        if (typeof win.ResizeObserver === "function" && badgeObservedEl !== comp) {
          disconnectBadgeResizeObs();
          badgeObservedEl = comp;
          badgeResizeObs = new win.ResizeObserver(() => { positionBadge(); });
          badgeResizeObs.observe(comp);
        }
      }
    } catch (_e) {}
    badgeEl.style.left = `${leftPx}px`;
    badgeEl.style.top = `${topPx}px`;
    badgeEl.style.bottom = "";
  }

  function renderVoiceBadge() {
    if (destroyed || !doc || !doc.body) return;
    if (!dictating || !settings.voiceEnabled || !settings.voiceShowBadge) {
      disconnectBadgeResizeObs();
      if (badgeTimer && win && typeof win.clearInterval === "function") {
        win.clearInterval(badgeTimer);
        badgeTimer = null;
      }
      if (badgeEl) {
        badgeEl.classList.remove("is-visible");
        if (badgeEl.parentNode) badgeEl.parentNode.removeChild(badgeEl);
        badgeEl = null;
      }
      return;
    }
    if (!badgeEl) {
      badgeEl = doc.createElement("div");
      badgeEl.id = "rudex-voice-badge";
      badgeEl.setAttribute("data-rudex-ignore", "1");
      const dot = doc.createElement("span");
      dot.className = "rx-vb-dot";
      const time = doc.createElement("span");
      time.className = "rx-vb-time";
      badgeEl.appendChild(dot);
      badgeEl.appendChild(time);
      doc.body.appendChild(badgeEl);
      if (win && typeof win.requestAnimationFrame === "function") {
        win.requestAnimationFrame(() => { if (badgeEl) badgeEl.classList.add("is-visible"); });
      } else {
        badgeEl.classList.add("is-visible");
      }
    }
    const isLocalNow = dictatingMode === "local" || (localVoiceInstalled && settings.voiceEngine !== "cloud");
    if (badgeEl.classList) {
      if (isLocalNow) badgeEl.classList.add("is-local");
      else badgeEl.classList.remove("is-local");
    }
    const timeEl = badgeEl.querySelector(".rx-vb-time");
    if (timeEl) timeEl.textContent = formatElapsed(Date.now() - (dictatingStartedAt || Date.now()));
    positionBadge();
    if (!badgeTimer && win && typeof win.setInterval === "function") {
      badgeTimer = win.setInterval(() => {
        if (!dictating || !badgeEl) {
          disconnectBadgeResizeObs();
          if (badgeTimer) { win.clearInterval(badgeTimer); badgeTimer = null; }
          return;
        }
        const tEl = badgeEl.querySelector(".rx-vb-time");
        if (tEl) tEl.textContent = formatElapsed(Date.now() - (dictatingStartedAt || Date.now()));
        positionBadge();
      }, 220);
    }
  }

  function setDictating(active, mode) {
    const next = Boolean(active);
    if (mode === "local" || mode === "cloud") {
      dictatingMode = mode;
    } else if (next) {
      dictatingMode = localVoiceInstalled && settings.voiceEngine !== "cloud" ? "local" : "cloud";
    }
    if (next && !dictating) {
      dictatingStartedAt = Date.now();
    } else if (!next) {
      dictatingStartedAt = 0;
    }
    dictating = next;
    if (doc && doc.documentElement && typeof doc.documentElement.setAttribute === "function") {
      if (next) doc.documentElement.setAttribute("data-rudex-dictating", "1");
      else doc.documentElement.removeAttribute("data-rudex-dictating");
    }
    renderVoiceBadge();
  }

  function setLocalVoiceReady(installed) {
    const next = Boolean(installed);
    localVoiceInstalled = next;
    if (win) win.__RUDEX_LOCAL_VOICE_READY__ = next;
    syncMainWorldVoiceConfig();
    if (dictating) renderVoiceBadge();
  }

  function syncHiddenState() {
    if (!doc || !doc.documentElement) return;
    const isHidden = Boolean(doc.hidden);
    if (isHidden && settings.animFreezeHidden) {
      doc.documentElement.setAttribute("data-rudex-window-hidden", "1");
    } else {
      doc.documentElement.removeAttribute("data-rudex-window-hidden");
    }
  }

  function onVoiceStreamEvent(ev) {
    if (destroyed) return;
    const detail = ev && ev.detail ? ev.detail : null;
    if (detail && typeof detail.active === "boolean") {
      setDictating(detail.active, detail.mode);
    }
  }

  function onWindowMessage(ev) {
    if (destroyed || !ev || ev.source !== win || !ev.data || typeof ev.data !== "object") return;
    if (ev.data.__rudexVoice === "voice-state" && ev.data.payload && typeof ev.data.payload.active === "boolean") {
      setDictating(ev.data.payload.active, ev.data.payload.mode);
    } else if (ev.data.__rudexVoice === "local-reply" && dictating && badgeEl) {
      if (win && typeof win.requestAnimationFrame === "function") {
        win.requestAnimationFrame(() => positionBadge());
      } else {
        positionBadge();
      }
    }
  }

  function onWindowResize() {
    if (dictating && badgeEl) positionBadge();
  }

  function attachListeners() {
    if (listenersAttached || !doc || !win) return;
    listenersAttached = true;
    try {
      doc.addEventListener("visibilitychange", syncHiddenState);
      win.addEventListener("rudex:voice-stream-state", onVoiceStreamEvent);
      win.addEventListener("message", onWindowMessage);
      win.addEventListener("resize", onWindowResize);
    } catch (_e) {}
    syncHiddenState();
  }

  function apply(nextSettings, nextLocale) {
    if (destroyed) return;
    if (nextSettings && typeof nextSettings === "object") {
      settings = sanitizeOptimizationSettings(nextSettings);
    }
    if (nextLocale === "en" || nextLocale === "ru") {
      locale = nextLocale;
    }
    attachListeners();
    applyAnimationCss();
    syncMainWorldVoiceConfig();
    syncHiddenState();
    if (dictating) renderVoiceBadge();
  }

  function abortVoiceOnSend() {
    if (destroyed) return;
    if (win && typeof win.postMessage === "function") {
      try {
        win.postMessage({ __rudexVoice: "abort-on-send", payload: { ts: Date.now() } }, "*");
      } catch (_e) {}
    }
    setDictating(false);
  }

  function triggerNativeDictation(hostEl) {
    const found = findNativeDictationButton(doc, hostEl);
    if (found && found.button && typeof found.button.click === "function") {
      try {
        found.button.click();
        return { triggered: true, wasActive: found.active };
      } catch (_e) {}
    }
    return { triggered: false, wasActive: false };
  }

  function destroy() {
    destroyed = true;
    setDictating(false);
    disconnectBadgeResizeObs();
    try {
      if (doc) doc.removeEventListener("visibilitychange", syncHiddenState);
      if (win) {
        win.removeEventListener("rudex:voice-stream-state", onVoiceStreamEvent);
        win.removeEventListener("message", onWindowMessage);
        win.removeEventListener("resize", onWindowResize);
      }
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    } catch (_e) {}
    styleEl = null;
  }

  return {
    apply,
    setDictating,
    abortVoiceOnSend,
    positionBadge,
    setLocalVoiceReady,
    isLocalVoiceReady: () => localVoiceInstalled,
    isDictating: () => dictating,
    triggerNativeDictation,
    getSettings: () => Object.assign({}, settings),
    destroy,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_OPTIMIZATION_SETTINGS,
    VALID_VOICE_LANG_PRESETS,
    VALID_VOICE_ENGINES,
    VALID_VOICE_LOCAL_MODELS,
    VALID_ANIM_MODES,
    normalizeBcp47Tag,
    parseVoiceLangList,
    sanitizeOptimizationSettings,
    resolveVoiceLanguageCodes,
    cleanDictationText,
    buildUpgradedAudioWorkletSource,
    patchWsStreamAudioFrame,
    patchGrpcWebStreamAudioBody,
    cleanIncomingWsTranscriptionFrame,
    buildAnimationPolishCss,
    extractQuotaFromRpcPayload,
    buildMainWorldVoicePatchScript,
    buildVoiceMainWorldPayload,
    bootMainWorldVoiceEarly,
    findNativeDictationButton,
    createRudexOptimizer,
  };
}
