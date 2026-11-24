"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

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

function getLiveEditsDir() {
  return path.join(getUserDataDir(), "studio_live_edits");
}

function safeWriteJsonAtomic(filePath, obj) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = filePath + ".tmp-" + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(obj, null, 2) + "\n", "utf8");
  try {
    fs.renameSync(tmpPath, filePath);
  } catch {
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf8");
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

function formatEditInstruction(matched, inboxPath) {
  const blocks = [];
  for (let i = 0; i < matched.length; i += 1) {
    const it = matched[i];
    const parts = [];
    parts.push(`[Живая правка #${i + 1} · id=${it.id}]`);
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
    "Пользователь прислал ЖИВУЮ ПРАВКУ во время выполнения текущей задачи:",
    "",
    blocks.join("\n\n"),
    "",
    "Правила обработки живой правки:",
    "1. НЕ прерывай, НЕ отменяй и НЕ забрасывай основную выполняемую задачу.",
    "2. Коротко подтверди получение правки (1-2 предложения) и сразу учти её в текущей работе.",
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
  return `**Живая правка принята без остановки:** ${parts.join(" | ") || "новое указание"}`;
}

function outAndExit(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function main() {
  const dir = getLiveEditsDir();
  const flagPath = path.join(dir, "pending.flag");
  const inboxPath = path.join(dir, "inbox.json");

  if (!fs.existsSync(flagPath)) {
    outAndExit({});
  }

  const payload = readStdinSyncSafe();
  const eventName = String(payload.hookEventName || "");
  const conversationId = typeof payload.conversationId === "string" ? payload.conversationId.trim().toLowerCase() : "";

  if (eventName === "Stop") {
    const term = String(payload.terminationReason || "");
    if (term && term !== "NO_TOOL_CALL") {
      outAndExit({});
    }
  }

  let inbox = { version: 1, items: [] };
  try {
    if (fs.existsSync(inboxPath)) {
      const parsed = JSON.parse(fs.readFileSync(inboxPath, "utf8"));
      if (parsed && Array.isArray(parsed.items)) inbox = parsed;
    }
  } catch {
    outAndExit({});
  }

  const now = Date.now();
  const matched = [];
  let remainingPending = 0;

  for (let i = 0; i < inbox.items.length; i += 1) {
    const it = inbox.items[i];
    if (!it || typeof it !== "object" || it.status !== "pending") continue;
    const itemChat = typeof it.chatKey === "string" ? it.chatKey.trim().toLowerCase() : "";
    const exactMatch = Boolean(conversationId && itemChat && itemChat === conversationId);
    const fallbackMatch = Boolean((it.fallbackAny === true || !itemChat || itemChat === "__new__" || itemChat.startsWith("chat-")) && now - (Number(it.createdAt) || 0) < 180000);
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
    outAndExit({});
  }

  for (let i = 0; i < matched.length; i += 1) {
    matched[i].status = "delivered";
    matched[i].deliveredAt = now;
    if (conversationId) matched[i].deliveredConversationId = conversationId;
  }

  safeWriteJsonAtomic(inboxPath, inbox);
  if (remainingPending === 0) {
    try { if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath); } catch {}
  }

  const instruction = formatEditInstruction(matched, inboxPath);
  if (eventName === "Stop") {
    outAndExit({
      decision: "continue",
      reason: instruction,
    });
  }

  outAndExit({
    injectSteps: [
      {
        systemMessage: {
          systemMessage: instruction,
          metadata: {
            user_markdown: buildUserMarkdownSummary(matched),
          },
        },
      },
    ],
    terminationBehavior: "",
  });
}

try {
  main();
} catch {
  try {
    process.stdout.write("{}");
  } catch {}
  process.exit(0);
}
