"use strict";

// Disable Electron's virtual ASAR fs wrapper so fs.existsSync/statSync treat app.asar as a regular file
process.noAsar = true;

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const MAX_ITEM_AGE_MS = 10 * 60 * 1000;
const FALLBACK_MAX_AGE_MS = 90 * 1000;

function getUserDataDir() {
  if (process.env.AGY_STUDIO_USER_DATA && process.env.AGY_STUDIO_USER_DATA.trim()) {
    return path.resolve(process.env.AGY_STUDIO_USER_DATA.trim());
  }
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Antigravity");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Antigravity");
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "Antigravity");
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeWriteJsonAtomic(filePath, obj) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 7)}`;
  const data = JSON.stringify(obj, null, 2) + "\n";
  fs.writeFileSync(tmpPath, data, "utf8");
  try {
    fs.renameSync(tmpPath, filePath);
  } catch {
    fs.writeFileSync(filePath, data, "utf8");
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

function readStdinSyncSafe() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function outAndExit(obj) {
  process.stdout.write(JSON.stringify(obj || {}));
  process.exit(0);
}

function pruneAnchors(anchorsObj) {
  const entries = Object.entries(anchorsObj || {});
  if (entries.length <= 80) return anchorsObj || {};
  entries.sort((a, b) => ((b[1] && b[1].updatedAt) || 0) - ((a[1] && a[1].updatedAt) || 0));
  const next = {};
  for (const [k, v] of entries.slice(0, 80)) {
    next[k] = v;
  }
  return next;
}

function buildFullPersonaProtocol(text, strict) {
  const lines = [
    "[Rudex · Стиль общения для этого чата]",
    "Веди диалог в манере, описанной внутри <user_persona>, с первого слова до последней строки — включая короткие статусы и ответы после вызовов инструментов.",
    "",
    "<user_persona>",
    text,
    "</user_persona>",
    "",
    "Правила подачи:",
    "1. Выдерживай запрошенные тон, лексику, подачу и длину ответов естественно, без сухого шаблонного канцелярита.",
    "2. Все технические факты, пути к файлам, имена символов, код и результаты команд сохраняй абсолютно точными.",
    "3. В допустимых рамках полностью раскрывай образ; если отдельная деталь выходит за встроенные ограничения безопасности модели, спокойно пропусти её без лишних нотаций и продолжи в том же стиле.",
  ];
  if (strict) {
    lines.push("4. Сохраняй этот же голос <user_persona> при переключении между планированием, выполнением и ответами субагентов.");
  }
  return lines.join("\n");
}

function buildRecencyAnchor(text) {
  return [
    "[Rudex · Напоминание о стиле чата]",
    "<user_persona>",
    text,
    "</user_persona>",
    "Сохраняй этот голос и стиль речи в следующем ответе, оставляя технические детали и код точными.",
  ].join("\n");
}

function loadChatsStore(userDataDir) {
  const chatsPath = path.join(userDataDir, "agy_studio_chats.json");
  const storeRaw = readJsonSafe(chatsPath);
  const store = storeRaw && typeof storeRaw === "object"
    ? Object.assign({ version: 1, chats: {}, pendingNewChatPersona: null, activeAgentsMdChatKey: "" }, storeRaw)
    : { version: 1, chats: {}, pendingNewChatPersona: null, activeAgentsMdChatKey: "" };
  if (!store.chats || typeof store.chats !== "object") store.chats = {};
  return { chatsPath, store };
}

function runPersonaEngine(userDataDir, payload, injectSteps) {
  const eventName = String(payload.hookEventName || "");
  if (eventName !== "SessionStart" && eventName !== "PreInvocation") {
    return;
  }

  const personaFlagPath = path.join(userDataDir, "agy_studio_persona_active.flag");
  if (!fs.existsSync(personaFlagPath)) {
    return;
  }

  const { chatsPath, store } = loadChatsStore(userDataDir);
  const anchorsPath = path.join(userDataDir, "studio_persona_anchors.json");

  const convId = typeof payload.conversationId === "string" ? payload.conversationId.trim().toLowerCase() : "";
  const now = Date.now();
  let storeDirty = false;

  let rec = convId ? (store.chats[convId] || null) : null;
  const pending = store.pendingNewChatPersona && typeof store.pendingNewChatPersona === "object"
    ? store.pendingNewChatPersona
    : null;
  if (
    convId &&
    !rec &&
    pending &&
    pending.enabled === true &&
    typeof pending.text === "string" &&
    pending.text.trim() &&
    now - (Number(pending.updatedAt) || 0) < MAX_ITEM_AGE_MS &&
    (!pending.claimedBy || String(pending.claimedBy).trim().toLowerCase() === convId)
  ) {
    rec = {
      title: "",
      personaEnabled: true,
      personaActivePreset: pending.activePreset || "custom",
      personaText: pending.text.trim(),
      personaStrict: pending.strict !== false,
      updatedAt: now,
    };
    store.chats[convId] = rec;
    store.pendingNewChatPersona.claimedBy = convId;
    storeDirty = true;
  }
  if (storeDirty) {
    try { safeWriteJsonAtomic(chatsPath, store); } catch {}
  }

  const anchorsRaw = readJsonSafe(anchorsPath);
  const anchorsStore = anchorsRaw && typeof anchorsRaw === "object" && anchorsRaw.anchors && typeof anchorsRaw.anchors === "object"
    ? anchorsRaw
    : { version: 1, anchors: {} };
  const anchors = anchorsStore.anchors;

  const enabled = Boolean(rec && rec.personaEnabled && typeof rec.personaText === "string" && rec.personaText.trim());
  const text = enabled ? rec.personaText.trim() : "";
  const strict = rec ? rec.personaStrict !== false : true;
  const curHash = enabled
    ? crypto.createHash("sha1").update((strict ? "1:" : "0:") + text).digest("hex").slice(0, 16)
    : "OFF";

  const prev = convId ? (anchors[convId] || null) : null;
  const stepNum = Number(payload.initialNumSteps) || 0;
  const invNum = Number(payload.invocationNum) || 1;
  let anchorsDirty = false;

  if (enabled && (!prev || prev.hash !== curHash)) {
    injectSteps.push({
      systemMessage: {
        systemMessage: buildFullPersonaProtocol(text, strict),
        metadata: { user_markdown: "🎭 *Характер чата активен*" },
      },
    });
    if (convId) {
      anchors[convId] = { hash: curHash, enabled: true, stepCount: stepNum, updatedAt: now };
      anchorsDirty = true;
    }
  } else if (
    enabled &&
    strict &&
    prev &&
    prev.hash === curHash &&
    eventName === "PreInvocation" &&
    (stepNum - (Number(prev.stepCount) || 0) >= 4 || (invNum === 1 && stepNum > (Number(prev.stepCount) || 0) + 2))
  ) {
    injectSteps.push({
      systemMessage: {
        systemMessage: buildRecencyAnchor(text),
        metadata: { user_markdown: "\u200B" },
      },
    });
    if (convId) {
      anchors[convId] = Object.assign({}, prev, { stepCount: stepNum, updatedAt: now });
      anchorsDirty = true;
    }
  } else if (!enabled && prev && prev.enabled === true) {
    injectSteps.push({
      systemMessage: {
        systemMessage: "The user disabled the chat persona. Immediately drop the previous persona voice and return to your default neutral style for all upcoming responses.",
        metadata: { user_markdown: "🎭 *Характер чата отключён*" },
      },
    });
    if (convId) {
      anchors[convId] = { hash: "OFF", enabled: false, stepCount: stepNum, updatedAt: now };
      anchorsDirty = true;
    }
  } else {
    const activeAgentsOwner = typeof store.activeAgentsMdChatKey === "string"
      ? store.activeAgentsMdChatKey.trim().toLowerCase()
      : "";
    if (
      !enabled &&
      (!prev || !prev.enabled) &&
      activeAgentsOwner &&
      convId &&
      activeAgentsOwner !== convId &&
      (!prev || prev.neutralizedFor !== activeAgentsOwner)
    ) {
      injectSteps.push({
        systemMessage: {
          systemMessage: "Ignore any <user_persona> block in rules/AGENTS.md for this conversation — custom persona is OFF for this chat. Respond in your normal style.",
          metadata: { user_markdown: "\u200B" },
        },
      });
      anchors[convId] = { hash: "OFF", enabled: false, neutralizedFor: activeAgentsOwner, stepCount: stepNum, updatedAt: now };
      anchorsDirty = true;
    }
  }

  if (anchorsDirty) {
    anchorsStore.anchors = pruneAnchors(anchors);
    try { safeWriteJsonAtomic(anchorsPath, anchorsStore); } catch {}
  }
}

function buildThinkingRuDirective() {
  return [
    "[Rudex · Язык внутренних размышлений / Thinking Language]",
    "MANDATORY: Write ALL internal reasoning / thinking / chain-of-thought exclusively in Russian (на русском языке).",
    "Веди ВСЁ внутреннее рассуждение (thinking / chain-of-thought / этап размышления) исключительно на русском языке.",
    "Preserve file paths, code identifiers, symbols, and terminal commands verbatim (в точном оригинальном виде).",
  ].join("\n");
}

function buildThinkingRuRecency() {
  return "[Rudex · Reminder] Keep ALL internal reasoning / thinking strictly in Russian (веди внутреннее рассуждение целиком на русском языке), keeping file paths, code, and commands verbatim.";
}

function runThinkingLanguageEngine(userDataDir, payload, injectSteps) {
  const eventName = String(payload.hookEventName || "");
  if (eventName !== "SessionStart" && eventName !== "PreInvocation") {
    return;
  }

  const thinkingFlagPath = path.join(userDataDir, "agy_studio_thinking_ru.flag");
  if (!fs.existsSync(thinkingFlagPath)) {
    return;
  }

  const settings = readJsonSafe(path.join(userDataDir, "agy_studio_settings.json"));
  const enabled = Boolean(settings && settings.thinkingInRussian === true);

  const anchorsPath = path.join(userDataDir, "studio_thinking_anchors.json");
  const anchorsRaw = readJsonSafe(anchorsPath);
  const anchorsStore = anchorsRaw && typeof anchorsRaw === "object" && anchorsRaw.anchors && typeof anchorsRaw.anchors === "object"
    ? anchorsRaw
    : { version: 1, anchors: {} };
  const anchors = anchorsStore.anchors;

  const convId = typeof payload.conversationId === "string" ? payload.conversationId.trim().toLowerCase() : "";
  const prev = convId ? (anchors[convId] || null) : null;
  const stepNum = Number(payload.initialNumSteps) || 0;
  const now = Date.now();
  let anchorsDirty = false;

  if (enabled && (!prev || prev.enabled !== true)) {
    injectSteps.push({
      systemMessage: {
        systemMessage: buildThinkingRuDirective(),
        metadata: { user_markdown: "\u200B" },
      },
    });
    if (convId) {
      anchors[convId] = { enabled: true, stepCount: stepNum, updatedAt: now };
      anchorsDirty = true;
    }
  } else if (
    enabled &&
    prev &&
    prev.enabled === true &&
    eventName === "PreInvocation" &&
    (stepNum - (Number(prev.stepCount) || 0) >= 6)
  ) {
    injectSteps.push({
      systemMessage: {
        systemMessage: buildThinkingRuRecency(),
        metadata: { user_markdown: "\u200B" },
      },
    });
    if (convId) {
      anchors[convId] = Object.assign({}, prev, { stepCount: stepNum, updatedAt: now });
      anchorsDirty = true;
    }
  } else if (!enabled && prev && prev.enabled === true) {
    injectSteps.push({
      systemMessage: {
        systemMessage: "The user reset the agent thinking language back to default. Return to your default internal reasoning language for upcoming turns.",
        metadata: { user_markdown: "\u200B" },
      },
    });
    if (convId) {
      anchors[convId] = { enabled: false, stepCount: stepNum, updatedAt: now };
      anchorsDirty = true;
    }
  }

  if (anchorsDirty) {
    anchorsStore.anchors = pruneAnchors(anchors);
    try { safeWriteJsonAtomic(anchorsPath, anchorsStore); } catch {}
  }

  if (!enabled) {
    const anyActive = Object.values(anchorsStore.anchors || {}).some((a) => a && a.enabled === true);
    if (!anyActive) {
      try { if (fs.existsSync(thinkingFlagPath)) fs.unlinkSync(thinkingFlagPath); } catch {}
    }
  }
}

function formatSupplementInstruction(matched) {
  const blocks = [];
  for (let i = 0; i < matched.length; i += 1) {
    const it = matched[i];
    const parts = [`[Дополнение #${i + 1} · id=${it.id}]`];
    if (it.text && String(it.text).trim()) {
      parts.push(String(it.text).trim());
    }
    const imgs = Array.isArray(it.images) ? it.images : [];
    if (imgs.length > 0) {
      parts.push("Прикреплённые фото (обязательно изучи через read_file):");
      for (let j = 0; j < imgs.length; j += 1) {
        const imgPath = imgs[j] && imgs[j].path ? String(imgs[j].path) : "";
        if (imgPath) parts.push(`- ${imgPath}`);
      }
    }
    blocks.push(parts.join("\n"));
  }

  return [
    "Пользователь прислал ДОПОЛНЕНИЕ к текущей задаче во время выполнения:",
    "",
    blocks.join("\n\n"),
    "",
    "Правила обработки дополнения:",
    "1. НЕ прерывай, НЕ отменяй и НЕ забрасывай основную выполняемую задачу.",
    "2. Коротко подтверди получение дополнения (1–2 предложения), изучи все прикреплённые фото через read_file и сразу учти указания в текущей работе.",
    "3. Если дополнение независимо от текущего шага — можешь делегировать его субагенту (invoke_subagent) параллельно, продолжая основную задачу без остановки.",
  ].join("\n");
}

function buildUserMarkdownSummary(matched) {
  const parts = matched.map((it) => {
    const t = String(it.text || "").replace(/\s+/g, " ").trim();
    const imgCount = Array.isArray(it.images) ? it.images.length : 0;
    const textPart = t ? t.slice(0, 120) : "";
    const photoPart = imgCount > 0 ? (textPart ? ` (+${imgCount} фото)` : `${imgCount} фото`) : "";
    return textPart + photoPart;
  }).filter(Boolean);
  return `⚡ **Дополнение передано агенту:** ${parts.join(" | ") || "новое указание"}`;
}

function moveQueueFileTo(srcPath, destDir, fileName, mutatorFn) {
  const claimPath = `${srcPath}.claim-${process.pid}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    fs.renameSync(srcPath, claimPath);
  } catch {
    return null;
  }
  let parsed = null;
  try {
    const raw = fs.readFileSync(claimPath, "utf8");
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  const nextObj = typeof mutatorFn === "function" && parsed ? mutatorFn(parsed) : parsed;
  if (destDir && nextObj) {
    try {
      fs.mkdirSync(destDir, { recursive: true });
      safeWriteJsonAtomic(path.join(destDir, fileName), nextObj);
    } catch {}
  }
  try { fs.unlinkSync(claimPath); } catch {}
  return nextObj;
}

function runLiveEditsEngine(userDataDir, payload, injectSteps) {
  const eventName = String(payload.hookEventName || "");
  if (eventName !== "PreInvocation" && eventName !== "Stop") {
    return null;
  }

  const leDir = path.join(userDataDir, "studio_live_edits");
  const flagPath = path.join(leDir, "pending.flag");
  const queueDir = path.join(leDir, "queue");
  const deliveredDir = path.join(leDir, "delivered");
  const expiredDir = path.join(leDir, "expired");

  if (!fs.existsSync(flagPath)) return null;

  if (eventName === "Stop") {
    const term = String(payload.terminationReason || "");
    if (term && term !== "NO_TOOL_CALL") {
      return null;
    }
  }

  if (!fs.existsSync(queueDir)) {
    try { if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath); } catch {}
    return null;
  }

  let files = [];
  try {
    files = fs.readdirSync(queueDir)
      .filter((name) => name.endsWith(".json") && !name.includes(".tmp-"))
      .sort();
  } catch {
    files = [];
  }

  if (files.length === 0) {
    try { if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath); } catch {}
    return null;
  }

  const convId = typeof payload.conversationId === "string" ? payload.conversationId.trim().toLowerCase() : "";
  const isSubagent = Boolean(payload.isSubagent || payload.parentConversationId);
  const stepNum = Number(payload.initialNumSteps) || 0;
  const now = Date.now();
  let chatsMap = null;
  const getChatsMap = () => {
    if (chatsMap !== null) return chatsMap;
    chatsMap = loadChatsStore(userDataDir).store.chats || {};
    return chatsMap;
  };

  const matched = [];

  for (let i = 0; i < files.length; i += 1) {
    const fileName = files[i];
    const fullPath = path.join(queueDir, fileName);
    const it = readJsonSafe(fullPath);
    if (!it || typeof it !== "object") {
      moveQueueFileTo(fullPath, expiredDir, fileName, () => ({ id: fileName, status: "expired", expiredAt: now }));
      continue;
    }

    const createdAt = Number(it.createdAt) || 0;
    const age = createdAt > 0 ? Math.max(0, now - createdAt) : 0;
    if (it.status && it.status !== "pending") {
      const targetDir = it.status === "expired" ? expiredDir : deliveredDir;
      moveQueueFileTo(fullPath, targetDir, fileName);
      continue;
    }

    const itemChat = typeof it.chatKey === "string" ? it.chatKey.trim().toLowerCase() : "";
    const exactMatch = Boolean(convId && itemChat && itemChat === convId);
    const isUnpromotedKey = !itemChat || itemChat === "__new__" || itemChat.startsWith("chat-");

    if (age > MAX_ITEM_AGE_MS || (!exactMatch && it.fallbackAny === true && isUnpromotedKey && age > FALLBACK_MAX_AGE_MS)) {
      moveQueueFileTo(fullPath, expiredDir, fileName, (obj) => Object.assign({}, obj, {
        status: "expired",
        expiredAt: now,
      }));
      continue;
    }

    let fallbackMatch = false;
    if (!exactMatch && it.fallbackAny === true && age <= FALLBACK_MAX_AGE_MS && !isSubagent && stepNum <= 6) {
      const map = getChatsMap();
      const isExistingOtherChat = Boolean(convId && map[convId] && itemChat && itemChat !== convId);
      if (!isExistingOtherChat) {
        fallbackMatch = true;
      }
    }

    if (exactMatch || fallbackMatch) {
      const claimed = moveQueueFileTo(fullPath, deliveredDir, fileName, (obj) => Object.assign({}, obj, {
        status: "delivered",
        deliveredAt: now,
        deliveredConversationId: convId || itemChat,
        deliveredVia: eventName,
      }));
      if (claimed) {
        matched.push(claimed);
      }
    }
  }

  let remainingCount = 0;
  try {
    remainingCount = fs.readdirSync(queueDir).filter((n) => n.endsWith(".json") && !n.includes(".tmp-")).length;
  } catch {}
  if (remainingCount === 0) {
    try { if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath); } catch {}
  }

  if (matched.length === 0) {
    return null;
  }

  const instruction = formatSupplementInstruction(matched);
  if (eventName === "Stop") {
    return {
      decision: "continue",
      reason: instruction,
    };
  }

  injectSteps.push({
    systemMessage: {
      systemMessage: instruction,
      metadata: {
        user_markdown: buildUserMarkdownSummary(matched),
      },
    },
  });
  return { injectedPre: true };
}

function detectAntigravityResourcesFast() {
  const candidates = [];
  if (process.env.ANTIGRAVITY_RESOURCES_DIR && process.env.ANTIGRAVITY_RESOURCES_DIR.trim()) {
    candidates.push(path.resolve(process.env.ANTIGRAVITY_RESOURCES_DIR.trim()));
  }
  if (process.platform === "win32") {
    const localApp = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const progFiles = process.env.ProgramFiles || "C:\\Program Files";
    const progFiles86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    candidates.push(
      path.join(localApp, "Programs", "antigravity", "resources"),
      path.join(localApp, "Programs", "Antigravity", "resources"),
      path.join(localApp, "Antigravity", "resources"),
      path.join(progFiles, "antigravity", "resources"),
      path.join(progFiles, "Antigravity", "resources"),
      path.join(progFiles86, "antigravity", "resources")
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Antigravity.app/Contents/Resources",
      path.join(os.homedir(), "Applications", "Antigravity.app", "Contents", "Resources")
    );
  } else {
    candidates.push(
      "/usr/share/antigravity/resources",
      "/opt/Antigravity/resources",
      "/opt/antigravity/resources",
      path.join(os.homedir(), ".local", "share", "antigravity", "resources")
    );
  }
  const seen = new Set();
  for (let i = 0; i < candidates.length; i += 1) {
    const raw = candidates[i];
    if (!raw) continue;
    const resolved = path.resolve(raw);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    if (!fs.existsSync(resolved)) continue;
    const asarPath = path.join(resolved, "app.asar");
    const appDir = path.join(resolved, "app");
    if (!fs.existsSync(asarPath) && !fs.existsSync(appDir)) continue;
    return {
      resourcesDir: resolved,
      asarPath,
      appDir,
      versionPath: path.join(path.dirname(resolved), "version"),
    };
  }
  return null;
}

function runAutoRepatchGuard(userDataDir, payload, injectSteps) {
  if (process.env.RUDEX_SKIP_AUTO_REPATCH === "1") return;
  const eventName = String(payload && payload.hookEventName ? payload.hookEventName : "");
  if (eventName !== "SessionStart" && eventName !== "PreInvocation") return;

  const rudexDir = process.env.RUDEX_PLUGIN_DIR && process.env.RUDEX_PLUGIN_DIR.trim()
    ? path.resolve(process.env.RUDEX_PLUGIN_DIR.trim())
    : path.join(os.homedir(), ".gemini", "config", "plugins", "rudex");
  const pluginJsonPath = path.join(rudexDir, "plugin.json");
  const installJsPath = path.join(rudexDir, "skills", "rudex", "scripts", "install.js");
  if (!fs.existsSync(pluginJsonPath) || !fs.existsSync(installJsPath)) return;

  const info = detectAntigravityResourcesFast();
  // On Electron, if resources/app.asar exists it ALWAYS takes precedence over resources/app,
  // meaning Rudex is currently shadowed/inactive — even if resources/app/rudex-patch-meta.json exists.
  if (!info || !fs.existsSync(info.asarPath)) return;

  let curVer = "unknown";
  try {
    if (fs.existsSync(info.versionPath)) {
      const txt = fs.readFileSync(info.versionPath, "utf8").trim();
      if (txt) curVer = txt;
    }
  } catch {}

  let asarSize = 0;
  try {
    asarSize = fs.statSync(info.asarPath).size || 0;
  } catch {}
  if (!asarSize) return;

  const sig = `${curVer}:${asarSize}`;
  const cooldownPath = path.join(userDataDir, "rudex_auto_repatch.json");
  const prev = readJsonSafe(cooldownPath);
  const now = Date.now();
  if (prev && prev.sig === sig && now - (Number(prev.at) || 0) < 10 * 60 * 1000) {
    return;
  }
  try {
    safeWriteJsonAtomic(cooldownPath, { sig, at: now, version: curVer });
  } catch {}

  try {
    const child = spawn(process.execPath, [installJsPath, "--no-sync-plugin", "--on-exit-activate"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: "1", ELECTRON_NO_ASAR: "1" }),
    });
    if (child && typeof child.unref === "function") child.unref();
    injectSteps.push({
      systemMessage: {
        systemMessage: "[Rudex · Восстановление после обновления Antigravity] Переустановка патча Rudex запущена автоматически в фоне (--on-exit-activate).",
        metadata: {
          user_markdown: "🔄 *После обновления Antigravity Rudex автоматически восстановил интерфейс и хотбар — перезапустите Antigravity для применения*",
        },
      },
    });
  } catch {}
}

function buildAgentProfileDirective(prof) {
  const lines = [
    "[Rudex · Профиль возможностей агента]",
    "Следуй активной конфигурации инструментов и стратегии для этого чата с первого шага:",
  ];
  if (prof.subagents === "parallel") {
    lines.push("- СУБАГЕНТЫ (АКТИВНО): сразу разбивай сложные и многокомпонентные задачи на независимые потоки и параллельно делегируй их через invoke_subagent (research / self), не откладывая.");
  } else if (prof.subagents === "off") {
    lines.push("- СУБАГЕНТЫ (ВЫКЛ): выполняй задачу самостоятельно без запуска субагентов.");
  }
  if (prof.webSearch === "always") {
    lines.push("- ВЕБ-ПОИСК (АКТИВНО): проверяй актуальную документацию, версии и факты через search_web перед принятием решений.");
  } else if (prof.webSearch === "off") {
    lines.push("- ВЕБ-ПОИСК (ВЫКЛ): работай строго офлайн, не используй search_web.");
  }
  if (prof.browser === "verify") {
    lines.push("- БРАУЗЕР (АВТОПРОВЕРКА): после изменений в UI/веб-страницах проверяй визуальный результат через браузерного субагента или Chrome DevTools.");
  } else if (prof.browser === "off") {
    lines.push("- БРАУЗЕР (ВЫКЛ): не используй браузерного субагента и Chrome DevTools.");
  }
  if (prof.planFirst === "strict") {
    lines.push("- ПЛАНИРОВАНИЕ: перед правками обязательно составь краткий чёткий план и веди живой чеклист через update_steps.");
  } else if (prof.planFirst === "skip") {
    lines.push("- БЫСТРЫЙ СТАРТ: без длинных планов и лишних вступлений сразу переходи к действиям и решению.");
  }
  if (prof.autoVerify) {
    lines.push("- АВТОПРОВЕРКА: перед завершением ответа обязательно запускай релевантные тесты, сборку или проверку синтаксиса.");
  }
  if (prof.deepMode) {
    lines.push("- РЕЖИМ «ДО КОНЦА»: не останавливайся на полпути и не задавай лишних вопросов на очевидных шагах — доводи задачу до полностью готового рабочего состояния.");
  }
  if (prof.conciseness === "short") {
    lines.push("- ФОРМАТ ОТВЕТА: отвечай максимально кратко, сжато и по делу.");
  } else if (prof.conciseness === "detailed") {
    lines.push("- ФОРМАТ ОТВЕТА: давай подробные, структурированные объяснения решений и компромиссов.");
  }
  if (prof.safetyMode === "readonly") {
    lines.push("- РЕЖИМ ТОЛЬКО ЧТЕНИЕ: изменение файлов и выполнение команд терминала запрещены политикой чата. Проводи только анализ, поиск и аудит.");
  } else if (prof.safetyMode === "cautious") {
    lines.push("- ОСТОРОЖНЫЙ РЕЖИМ: объясняй каждый запуск команды терминала и избегай рискованных операций без явной причины.");
  }
  if (Array.isArray(prof.pinnedSkills) && prof.pinnedSkills.length > 0) {
    lines.push(`- ПРИОРИТЕТНЫЕ СКИЛЛЫ/ИНСТРУМЕНТЫ ЧАТА: обязательно опирайся на ${prof.pinnedSkills.join(", ")}.`);
  }
  if (Array.isArray(prof.disabledTools) && prof.disabledTools.length > 0) {
    lines.push(`- ОТКЛЮЧЁННЫЕ ИНСТРУМЕНТЫ: не пытайся вызывать ${prof.disabledTools.join(", ")}.`);
  }
  return lines.join("\n");
}

function resolveEffectiveAgentProfile(userDataDir, convId) {
  const { chatsPath, store } = loadChatsStore(userDataDir);
  const settings = readJsonSafe(path.join(userDataDir, "agy_studio_settings.json"));
  const defaultProf = settings && settings.agentProfileDefault && typeof settings.agentProfileDefault === "object"
    ? settings.agentProfileDefault
    : null;
  let rec = convId ? (store.chats[convId] || null) : null;
  let prof = rec && rec.agentProfile && typeof rec.agentProfile === "object" ? rec.agentProfile : null;
  if (!prof && defaultProf && defaultProf.applyToNewChats === true && defaultProf.enabled === true) {
    prof = Object.assign({}, defaultProf);
    if (convId) {
      store.chats[convId] = Object.assign({}, rec || { title: "" }, {
        agentProfile: prof,
        updatedAt: Date.now(),
      });
      try { safeWriteJsonAtomic(chatsPath, store); } catch {}
    }
  }
  if (!prof || prof.enabled !== true) return null;
  return prof;
}

function runAgentProfileEngine(userDataDir, payload, injectSteps) {
  const eventName = String(payload.hookEventName || "");
  if (eventName !== "SessionStart" && eventName !== "PreInvocation") return;
  const flagPath = path.join(userDataDir, "agy_studio_agent_profile.flag");
  if (!fs.existsSync(flagPath)) return;

  const convId = typeof payload.conversationId === "string" ? payload.conversationId.trim().toLowerCase() : "";
  const prof = resolveEffectiveAgentProfile(userDataDir, convId);
  const anchorsPath = path.join(userDataDir, "studio_agent_anchors.json");
  const anchorsRaw = readJsonSafe(anchorsPath);
  const anchorsStore = anchorsRaw && typeof anchorsRaw === "object" && anchorsRaw.anchors && typeof anchorsRaw.anchors === "object"
    ? anchorsRaw
    : { version: 1, anchors: {} };
  const anchors = anchorsStore.anchors;
  const prev = convId ? (anchors[convId] || null) : null;
  const stepNum = Number(payload.initialNumSteps) || 0;
  const now = Date.now();
  let dirty = false;

  if (prof) {
    const directive = buildAgentProfileDirective(prof);
    const curHash = crypto.createHash("sha1").update(directive).digest("hex").slice(0, 16);
    if (!prev || prev.hash !== curHash) {
      injectSteps.push({
        systemMessage: {
          systemMessage: directive,
          metadata: { user_markdown: `⚡ *Профиль агента активен${prof.presetLabel ? `: ${prof.presetLabel}` : ""}*` },
        },
      });
      if (convId) {
        anchors[convId] = { hash: curHash, enabled: true, stepCount: stepNum, updatedAt: now };
        dirty = true;
      }
    } else if (eventName === "PreInvocation" && (stepNum - (Number(prev.stepCount) || 0) >= 6)) {
      injectSteps.push({
        systemMessage: {
          systemMessage: `[Rudex · Напоминание профиля агента]\n${directive}`,
          metadata: { user_markdown: "\u200B" },
        },
      });
      if (convId) {
        anchors[convId] = Object.assign({}, prev, { stepCount: stepNum, updatedAt: now });
        dirty = true;
      }
    }
  } else if (prev && prev.enabled === true) {
    injectSteps.push({
      systemMessage: {
        systemMessage: "The user disabled the custom Rudex agent profile for this chat. Return to standard tool and workflow behavior.",
        metadata: { user_markdown: "⚡ *Профиль агента отключён*" },
      },
    });
    if (convId) {
      anchors[convId] = { hash: "OFF", enabled: false, stepCount: stepNum, updatedAt: now };
      dirty = true;
    }
  }

  if (dirty) {
    anchorsStore.anchors = pruneAnchors(anchors);
    try { safeWriteJsonAtomic(anchorsPath, anchorsStore); } catch {}
  }
}

const MUTATING_TOOLS = new Set([
  "write_file",
  "edit_file",
  "run_command",
  "replace_file_content",
  "multi_replace_file_content",
  "write_to_file",
]);

function claimUrgentLiveEditsForTool(userDataDir, payload) {
  const leDir = path.join(userDataDir, "studio_live_edits");
  const flagPath = path.join(leDir, "pending.flag");
  const queueDir = path.join(leDir, "queue");
  const deliveredDir = path.join(leDir, "delivered");
  if (!fs.existsSync(flagPath) || !fs.existsSync(queueDir)) return [];
  const convId = typeof payload.conversationId === "string" ? payload.conversationId.trim().toLowerCase() : "";
  const now = Date.now();
  let files = [];
  try {
    files = fs.readdirSync(queueDir).filter((n) => n.endsWith(".json") && !n.includes(".tmp-")).sort();
  } catch {
    return [];
  }
  const matched = [];
  for (let i = 0; i < files.length; i += 1) {
    const fn = files[i];
    const full = path.join(queueDir, fn);
    const it = readJsonSafe(full);
    if (!it || it.urgent !== true || (it.status && it.status !== "pending")) continue;
    const itemChat = typeof it.chatKey === "string" ? it.chatKey.trim().toLowerCase() : "";
    if ((convId && itemChat && itemChat === convId) || (!itemChat && it.fallbackAny === true)) {
      const claimed = moveQueueFileTo(full, deliveredDir, fn, (obj) => Object.assign({}, obj, {
        status: "delivered",
        deliveredAt: now,
        deliveredConversationId: convId || itemChat,
        deliveredVia: "PreToolUse",
      }));
      if (claimed) matched.push(claimed);
    }
  }
  try {
    const rem = fs.readdirSync(queueDir).filter((n) => n.endsWith(".json") && !n.includes(".tmp-")).length;
    if (rem === 0 && fs.existsSync(flagPath)) fs.unlinkSync(flagPath);
  } catch {}
  return matched;
}

function runPreToolUseEngine(userDataDir, payload) {
  const tc = payload && payload.toolCall && typeof payload.toolCall === "object" ? payload.toolCall : null;
  const toolName = tc && typeof tc.name === "string" ? tc.name.trim() : "";
  const toolArgs = tc && tc.args && typeof tc.args === "object" ? tc.args : {};
  if (!toolName) return null;

  // 1. Urgent live edit intercept before mutating tool call
  if (MUTATING_TOOLS.has(toolName)) {
    const urgentEdits = claimUrgentLiveEditsForTool(userDataDir, payload);
    if (urgentEdits.length > 0) {
      return {
        decision: "deny",
        reason: `⚡ СРОЧНАЯ ПРАВКА НА ЛЕТУ (НЕ прерывай задачу — сразу учти правку и скорректируй действие):\n\n${formatSupplementInstruction(urgentEdits)}`,
      };
    }
  }

  // 2. Agent profile tool policies (fast-path guarded by flag file)
  const policyFlagPath = path.join(userDataDir, "agy_studio_tool_policy.flag");
  if (!fs.existsSync(policyFlagPath)) return null;

  const convId = typeof payload.conversationId === "string" ? payload.conversationId.trim().toLowerCase() : "";
  const prof = resolveEffectiveAgentProfile(userDataDir, convId);
  if (!prof) return null;

  if (prof.safetyMode === "readonly" && MUTATING_TOOLS.has(toolName)) {
    return {
      decision: "deny",
      reason: `[Rudex · Read-Only] Инструмент "${toolName}" заблокирован: в профиле этого чата включён режим «Только чтение».`,
    };
  }
  if (prof.safetyMode === "cautious" && toolName === "run_command") {
    return {
      decision: "force_ask",
      reason: "[Rudex · Осторожный режим] Требуется подтверждение пользователя перед запуском команды терминала.",
    };
  }
  if (prof.webSearch === "off" && (toolName === "search_web" || toolName === "read_url_content")) {
    return {
      decision: "deny",
      reason: `[Rudex] Инструмент "${toolName}" отключён в профиле этого чата (Веб-поиск выключен).`,
    };
  }
  if (prof.browser === "off") {
    const isBrowserSub = toolName === "invoke_subagent" && String(toolArgs.TypeName || "").toLowerCase() === "browser";
    const isDevtoolsMcp = toolName === "call_mcp_tool" && String(toolArgs.ServerName || "").toLowerCase().includes("chrome-devtools");
    if (isBrowserSub || isDevtoolsMcp || toolName.startsWith("browser_")) {
      return {
        decision: "deny",
        reason: "[Rudex] Браузер и Chrome DevTools отключены в профиле этого чата.",
      };
    }
  }
  if (prof.subagents === "off" && toolName === "invoke_subagent") {
    const isBrowserSub = String(toolArgs.TypeName || "").toLowerCase() === "browser";
    if (!isBrowserSub || prof.browser === "off") {
      return {
        decision: "deny",
        reason: "[Rudex] Запуск субагентов отключён в профиле этого чата.",
      };
    }
  }
  if (Array.isArray(prof.disabledTools) && prof.disabledTools.length > 0) {
    const mcpKey = toolName === "call_mcp_tool" && toolArgs.ServerName ? `mcp:${String(toolArgs.ServerName)}` : "";
    if (prof.disabledTools.includes(toolName) || (mcpKey && prof.disabledTools.includes(mcpKey))) {
      return {
        decision: "deny",
        reason: `[Rudex] Инструмент "${mcpKey || toolName}" отключён в настройках чата.`,
      };
    }
  }
  return null;
}

function main() {
  const userDataDir = getUserDataDir();
  const leFlagPath = path.join(userDataDir, "studio_live_edits", "pending.flag");
  const personaFlagPath = path.join(userDataDir, "agy_studio_persona_active.flag");
  const thinkingFlagPath = path.join(userDataDir, "agy_studio_thinking_ru.flag");
  const agentFlagPath = path.join(userDataDir, "agy_studio_agent_profile.flag");
  const toolPolicyFlagPath = path.join(userDataDir, "agy_studio_tool_policy.flag");

  const payload = readStdinSyncSafe();
  const eventName = String(payload.hookEventName || "");

  if (eventName === "PreToolUse") {
    if (!fs.existsSync(toolPolicyFlagPath) && !fs.existsSync(leFlagPath)) {
      outAndExit({});
    }
    const toolRes = runPreToolUseEngine(userDataDir, payload);
    outAndExit(toolRes || {});
  }

  if (eventName === "Stop") {
    if (!fs.existsSync(leFlagPath)) {
      outAndExit({});
    }
    const term = String(payload.terminationReason || "");
    if (term && term !== "NO_TOOL_CALL") {
      outAndExit({});
    }
    const stopRes = runLiveEditsEngine(userDataDir, payload, []);
    outAndExit(stopRes || {});
  }

  const injectSteps = [];
  runAutoRepatchGuard(userDataDir, payload, injectSteps);

  if (
    injectSteps.length === 0 &&
    !fs.existsSync(leFlagPath) &&
    !fs.existsSync(personaFlagPath) &&
    !fs.existsSync(thinkingFlagPath) &&
    !fs.existsSync(agentFlagPath)
  ) {
    outAndExit({});
  }

  runPersonaEngine(userDataDir, payload, injectSteps);
  runThinkingLanguageEngine(userDataDir, payload, injectSteps);
  runAgentProfileEngine(userDataDir, payload, injectSteps);
  runLiveEditsEngine(userDataDir, payload, injectSteps);

  if (injectSteps.length > 0) {
    outAndExit({
      injectSteps,
      terminationBehavior: "",
    });
  }

  outAndExit({});
}

try {
  main();
} catch {
  try {
    process.stdout.write("{}");
  } catch {}
  process.exit(0);
}
