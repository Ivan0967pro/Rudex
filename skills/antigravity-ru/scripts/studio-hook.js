"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

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
  const tmpPath = filePath + ".tmp-" + process.pid + "-" + Math.random().toString(36).slice(2, 6);
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
    "[Antigravity Studio · Active Per-Chat Persona Protocol]",
    "You MUST follow every stylistic, tonal, roleplay, formatting, and language directive inside <user_persona> for THIS conversation across 100% of every user-facing response:",
    "",
    "<user_persona>",
    text,
    "</user_persona>",
    "",
    "Behavioral Execution Protocol:",
    "1. **First-word-to-last lock:** Apply this exact voice/tone/mannerism from your opening word through the final line—even in short status updates, error explanations, and final summaries.",
    "2. **Zero drift after tools & code:** Calling tools, running terminal commands, reading/editing files, hitting errors, or writing fenced code blocks MUST NOT reset your prose into bland corporate assistant phrasing.",
    "3. **Planner, Executor & Subagent continuity:** Follow this persona across plan updates, execution progress lines, and user-facing summaries (and instruct any spawned subagents if their prose surfaces to the user).",
    "4. **Pre-reply self-check:** Before emitting ANY text to the user, verify the opening, middle transitions, and closing match <user_persona>. Keep code snippets, file paths, command flags, and verified tool outcomes 100% factual.",
  ];
  if (strict) {
    lines.push("5. **Built-in guardrails note:** Preserve factual truthfulness and platform safety boundaries at all times; never claim to bypass safety limits, while delivering all permissible requests strictly in the requested <user_persona> style.");
  }
  return lines.join("\n");
}

function buildRecencyAnchor(text) {
  return [
    "[Persona Recency Reminder — Strict Anti-Drift]",
    "<user_persona>",
    text,
    "</user_persona>",
    "Re-check that every user-facing sentence in this next reply strictly follows the style and voice above while keeping all technical facts accurate.",
  ].join("\n");
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

  const chatsPath = path.join(userDataDir, "agy_studio_chats.json");
  const anchorsPath = path.join(userDataDir, "studio_persona_anchors.json");
  const storeRaw = readJsonSafe(chatsPath);
  const store = storeRaw && typeof storeRaw === "object"
    ? Object.assign({ version: 1, chats: {}, pendingNewChatPersona: null, activeAgentsMdChatKey: "" }, storeRaw)
    : { version: 1, chats: {}, pendingNewChatPersona: null, activeAgentsMdChatKey: "" };
  if (!store.chats || typeof store.chats !== "object") store.chats = {};

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
    now - (Number(pending.updatedAt) || 0) < 600000 &&
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
    (stepNum - (Number(prev.stepCount) || 0) >= 8 || (invNum === 1 && stepNum > (Number(prev.stepCount) || 0) + 2))
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

function formatEditInstruction(matched, inboxPath) {
  const blocks = [];
  let hasPivot = false;
  for (let i = 0; i < matched.length; i += 1) {
    const it = matched[i];
    if (it.mode === "pivot") hasPivot = true;
    const modeTag = it.mode === "pivot" ? "PIVOT / МГНОВЕННАЯ ПЕРЕСТРОЙКА" : "LIVE EDIT / БЕЗ ОТМЕНЫ ЗАДАЧИ";
    const parts = [`[Живая правка #${i + 1} · id=${it.id} · ${modeTag}]`];
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

  if (hasPivot) {
    return [
      "Пользователь ОСТАНОВИЛ предыдущий поток и прислал ПРАВКУ для немедленной перестройки ответа:",
      "",
      blocks.join("\n\n"),
      "",
      "Правила обработки правки:",
      "1. Немедленно примени указанную правку и изучи все прикреплённые фото через read_file.",
      "2. НЕ повторяй длинное вступление или устаревшую часть прерванного ответа — сразу продолжай/перестрой ответ с учётом правки.",
      `3. (Опционально) Краткий статус можно записать в ${inboxPath} (status: "applied", agentReply).`,
    ].join("\n");
  }

  return [
    "Пользователь прислал ЖИВУЮ ПРАВКУ во время выполнения текущей задачи:",
    "",
    blocks.join("\n\n"),
    "",
    "Правила обработки живой правки:",
    "1. НЕ прерывай, НЕ отменяй и НЕ забрасывай основную выполняемую задачу.",
    "2. Коротко подтверди получение правки (1-2 предложения), изучи все прикреплённые фото через read_file и сразу учти правку в текущей работе.",
    "3. Если правка независима от текущего шага — можешь запустить для неё отдельного субагента (invoke_subagent) параллельно, продолжая основную задачу без остановки.",
    `4. (Опционально) Статус/краткий ответ можно записать в ${inboxPath} (status: "applied", agentReply).`,
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
  return `**Живая правка принята:** ${parts.join(" | ") || "новое указание"}`;
}

function runLiveEditsEngine(userDataDir, payload, injectSteps) {
  const eventName = String(payload.hookEventName || "");
  if (eventName !== "PreInvocation" && eventName !== "PostInvocation" && eventName !== "Stop") {
    return null;
  }

  const leDir = path.join(userDataDir, "studio_live_edits");
  const flagPath = path.join(leDir, "pending.flag");
  const inboxPath = path.join(leDir, "inbox.json");
  if (!fs.existsSync(flagPath)) return null;

  if (eventName === "Stop") {
    const term = String(payload.terminationReason || "");
    if (term && term !== "NO_TOOL_CALL") {
      return null;
    }
  }

  const inboxRaw = readJsonSafe(inboxPath);
  const inbox = inboxRaw && Array.isArray(inboxRaw.items) ? inboxRaw : { version: 1, items: [] };
  const convId = typeof payload.conversationId === "string" ? payload.conversationId.trim().toLowerCase() : "";
  const now = Date.now();
  const matched = [];
  let remainingPending = 0;

  for (let i = 0; i < inbox.items.length; i += 1) {
    const it = inbox.items[i];
    if (!it || typeof it !== "object" || it.status !== "pending") continue;
    const itemChat = typeof it.chatKey === "string" ? it.chatKey.trim().toLowerCase() : "";
    const exactMatch = Boolean(convId && itemChat && itemChat === convId);
    const fallbackMatch = Boolean(
      (it.fallbackAny === true || !itemChat || itemChat === "__new__" || itemChat.startsWith("chat-")) &&
      now - (Number(it.createdAt) || 0) < 180000
    );
    if (exactMatch || fallbackMatch) {
      matched.push(it);
    } else {
      remainingPending += 1;
    }
  }

  if (matched.length === 0) {
    if (remainingPending === 0) {
      try { if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath); } catch {}
    }
    return null;
  }

  for (let i = 0; i < matched.length; i += 1) {
    matched[i].status = "delivered";
    matched[i].deliveredAt = now;
    if (convId) matched[i].deliveredConversationId = convId;
  }

  safeWriteJsonAtomic(inboxPath, inbox);
  if (remainingPending === 0) {
    try { if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath); } catch {}
  }

  const instruction = formatEditInstruction(matched, inboxPath);
  const stepObj = {
    systemMessage: {
      systemMessage: instruction,
      metadata: {
        user_markdown: buildUserMarkdownSummary(matched),
      },
    },
  };

  if (eventName === "Stop") {
    return {
      decision: "continue",
      reason: instruction,
    };
  }

  if (eventName === "PostInvocation") {
    return {
      injectSteps: [stepObj],
      terminationBehavior: "force_continue",
    };
  }

  injectSteps.push(stepObj);
  return { injectedPre: true };
}

function main() {
  const userDataDir = getUserDataDir();
  const leFlagPath = path.join(userDataDir, "studio_live_edits", "pending.flag");
  const personaFlagPath = path.join(userDataDir, "agy_studio_persona_active.flag");

  if (!fs.existsSync(leFlagPath) && !fs.existsSync(personaFlagPath)) {
    outAndExit({});
  }

  const payload = readStdinSyncSafe();
  const eventName = String(payload.hookEventName || "");

  if (eventName === "PostInvocation" || eventName === "Stop") {
    if (!fs.existsSync(leFlagPath)) {
      outAndExit({});
    }
    if (eventName === "Stop") {
      const term = String(payload.terminationReason || "");
      if (term && term !== "NO_TOOL_CALL") {
        outAndExit({});
      }
    }
  }

  const injectSteps = [];
  runPersonaEngine(userDataDir, payload, injectSteps);
  const leRes = runLiveEditsEngine(userDataDir, payload, injectSteps);

  if (eventName === "PostInvocation" || eventName === "Stop") {
    outAndExit(leRes || {});
  }

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
