"use strict";

process.noAsar = true;

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,60}$/i;
const SAFE_RULE_FILE_RE = /^[a-zA-Z0-9._-]{1,80}$/;

let cachedSystemFonts = null;
let cachedSystemFontsAt = 0;

function getGlobalConfigDir() {
  if (process.env.RUDEX_AGY_CONFIG_DIR && process.env.RUDEX_AGY_CONFIG_DIR.trim()) {
    return path.resolve(process.env.RUDEX_AGY_CONFIG_DIR.trim());
  }
  return path.join(os.homedir(), ".gemini", "config");
}

function readTextSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
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

function writeFileAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 7)}`;
  fs.writeFileSync(tmpPath, content, "utf8");
  try {
    fs.renameSync(tmpPath, filePath);
  } catch {
    fs.writeFileSync(filePath, content, "utf8");
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

function isPathInside(candidatePath, allowedRoots) {
  const resolved = path.resolve(candidatePath);
  const normCand = process.platform === "win32" ? resolved.toLowerCase() : resolved;
  for (let i = 0; i < allowedRoots.length; i += 1) {
    const root = allowedRoots[i];
    if (!root) continue;
    const r = path.resolve(root);
    const normRoot = process.platform === "win32" ? r.toLowerCase() : r;
    if (normCand === normRoot || normCand.startsWith(normRoot + path.sep)) {
      return true;
    }
  }
  return false;
}

function getAllowedRoots(workspacePath) {
  const roots = [getGlobalConfigDir()];
  if (workspacePath && typeof workspacePath === "string" && workspacePath.trim()) {
    const wp = path.resolve(workspacePath.trim());
    if (fs.existsSync(wp)) {
      roots.push(wp);
    }
  }
  return roots;
}

function resolveWorkspaceAgentsDir(workspacePath) {
  if (!workspacePath || typeof workspacePath !== "string" || !workspacePath.trim()) return "";
  const wp = path.resolve(workspacePath.trim());
  if (!fs.existsSync(wp)) return "";
  for (const cand of [".agents", ".agent", "_agents", "_agent"]) {
    const full = path.join(wp, cand);
    if (fs.existsSync(full)) return full;
  }
  return path.join(wp, ".agents");
}

function parseMarkdownFrontmatter(raw) {
  const text = String(raw || "");
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) {
    return { meta: {}, body: text };
  }
  const meta = {};
  const lines = m[1].split(/\r?\n/);
  let curKey = "";
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const kv = /^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (kv) {
      curKey = kv[1].trim();
      const val = kv[2].trim();
      if (val === ">" || val === ">-" || val === "|" || val === "|-") {
        meta[curKey] = "";
      } else {
        meta[curKey] = val.replace(/^["']|["']$/g, "");
      }
    } else if (curKey && /^\s+/.test(line)) {
      meta[curKey] = (meta[curKey] ? meta[curKey] + " " : "") + line.trim();
    }
  }
  return { meta, body: m[2] || "" };
}

function buildMarkdownWithFrontmatter(metaObj, body) {
  const entries = Object.entries(metaObj || {}).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
  if (entries.length === 0) return String(body || "");
  const fmLines = ["---"];
  for (const [k, v] of entries) {
    const s = String(v).replace(/\r?\n/g, " ").trim();
    if (/[:#"'{}[\],&*!?|<>=%@`]/.test(s) || s.length > 80) {
      fmLines.push(`${k}: ${JSON.stringify(s)}`);
    } else {
      fmLines.push(`${k}: ${s}`);
    }
  }
  fmLines.push("---", "");
  return fmLines.join("\n") + String(body || "").replace(/^\r?\n+/, "");
}

function scanRulesInDir(dirPath, scope, priority, out) {
  if (!dirPath || !fs.existsSync(dirPath)) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const name = ent.name;
    const isEnabledMd = /\.md$/i.test(name);
    const isDisabledMd = /\.md\.disabled$/i.test(name);
    if (!isEnabledMd && !isDisabledMd) continue;
    const full = path.join(dirPath, name);
    const raw = readTextSafe(full);
    const { meta, body } = parseMarkdownFrontmatter(raw);
    out.push({
      id: `${scope}:${full}`,
      scope,
      priority,
      fileName: name.replace(/\.disabled$/i, ""),
      name: meta.name || name.replace(/\.md(?:\.disabled)?$/i, ""),
      description: meta.description || "",
      trigger: meta.trigger || "always_on",
      enabled: isEnabledMd,
      path: full,
      content: raw,
      body,
    });
  }
}

function scanSkillsInDir(skillsRoot, scope, pluginName, out) {
  if (!skillsRoot || !fs.existsSync(skillsRoot)) return;
  let entries = [];
  try {
    entries = fs.readdirSync(skillsRoot, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const skillDir = path.join(skillsRoot, ent.name);
    const skillMd = path.join(skillDir, "SKILL.md");
    const disabledMd = path.join(skillDir, "SKILL.md.disabled");
    const enabled = fs.existsSync(skillMd);
    const actualPath = enabled ? skillMd : (fs.existsSync(disabledMd) ? disabledMd : "");
    if (!actualPath) continue;
    const raw = readTextSafe(actualPath);
    const { meta, body } = parseMarkdownFrontmatter(raw);
    out.push({
      id: `${scope}:${pluginName || "local"}:${ent.name}`,
      slug: ent.name,
      name: meta.name || ent.name,
      description: meta.description || "",
      scope,
      plugin: pluginName || "",
      enabled,
      dir: skillDir,
      path: actualPath,
      body,
      content: raw,
    });
  }
}

function readMcpServersFromFile(filePath, scope, out) {
  const data = readJsonSafe(filePath);
  if (!data || typeof data !== "object") return;
  const map = data.mcpServers && typeof data.mcpServers === "object" ? data.mcpServers : data;
  for (const [name, cfg] of Object.entries(map)) {
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) continue;
    if (!cfg.command && !cfg.url && !cfg.serverUrl && !cfg.httpUrl) continue;
    out.push({
      id: `${scope}:${name}`,
      name,
      scope,
      path: filePath,
      command: typeof cfg.command === "string" ? cfg.command : "",
      args: Array.isArray(cfg.args) ? cfg.args.map(String) : [],
      url: typeof cfg.url === "string" ? cfg.url : (typeof cfg.serverUrl === "string" ? cfg.serverUrl : (typeof cfg.httpUrl === "string" ? cfg.httpUrl : "")),
      env: cfg.env && typeof cfg.env === "object" ? cfg.env : {},
      disabled: Boolean(cfg.disabled),
    });
  }
}

function listCustomizations(options = {}) {
  const globalDir = getGlobalConfigDir();
  const workspacePath = typeof options.workspacePath === "string" && options.workspacePath.trim()
    ? path.resolve(options.workspacePath.trim())
    : "";
  const wsAgentsDir = resolveWorkspaceAgentsDir(workspacePath);

  const rules = [];
  const skills = [];
  const mcpServers = [];
  const plugins = [];
  const hooks = [];

  // 1. Rules
  if (workspacePath && fs.existsSync(workspacePath)) {
    for (const rootFile of ["AGENTS.md", "GEMINI.md"]) {
      const fp = path.join(workspacePath, rootFile);
      if (fs.existsSync(fp)) {
        const raw = readTextSafe(fp);
        const { meta, body } = parseMarkdownFrontmatter(raw);
        rules.push({
          id: `workspace:${fp}`,
          scope: "workspace",
          priority: 1,
          fileName: rootFile,
          name: rootFile,
          description: meta.description || "Корневое правило проекта",
          trigger: meta.trigger || "always_on",
          enabled: true,
          path: fp,
          content: raw,
          body,
        });
      }
    }
    if (wsAgentsDir) {
      scanRulesInDir(path.join(wsAgentsDir, "rules"), "workspace", 1, rules);
    }
  }
  scanRulesInDir(path.join(globalDir, "rules"), "global", 2, rules);
  for (const gRoot of ["AGENTS.md", "GEMINI.md"]) {
    const fp = path.join(globalDir, gRoot);
    if (fs.existsSync(fp)) {
      const raw = readTextSafe(fp);
      const { meta, body } = parseMarkdownFrontmatter(raw);
      rules.push({
        id: `global:${fp}`,
        scope: "global",
        priority: 2,
        fileName: gRoot,
        name: `${gRoot} (Глобально)`,
        description: meta.description || "Глобальное корневое правило",
        trigger: meta.trigger || "always_on",
        enabled: true,
        path: fp,
        content: raw,
        body,
      });
    }
  }

  // 2. Skills (workspace, global, and plugins)
  if (wsAgentsDir) {
    scanSkillsInDir(path.join(wsAgentsDir, "skills"), "workspace", "", skills);
  }
  scanSkillsInDir(path.join(globalDir, "skills"), "global", "", skills);

  // 3. Plugins & plugin hooks/skills
  const pluginsDir = path.join(globalDir, "plugins");
  if (fs.existsSync(pluginsDir)) {
    let pEntries = [];
    try { pEntries = fs.readdirSync(pluginsDir, { withFileTypes: true }); } catch {}
    for (const ent of pEntries) {
      if (!ent.isDirectory()) continue;
      const pDir = path.join(pluginsDir, ent.name);
      const pJson = readJsonSafe(path.join(pDir, "plugin.json"));
      const pName = (pJson && (pJson.displayName || pJson.name)) || ent.name;
      plugins.push({
        id: ent.name,
        name: pName,
        version: (pJson && pJson.version) || "",
        description: (pJson && pJson.description) || "",
        dir: pDir,
        hasHooks: fs.existsSync(path.join(pDir, "hooks.json")),
      });
      scanSkillsInDir(path.join(pDir, "skills"), "plugin", pName, skills);
      const pHooks = readJsonSafe(path.join(pDir, "hooks.json"));
      if (pHooks && typeof pHooks === "object") {
        for (const [hName, hCfg] of Object.entries(pHooks)) {
          if (!hCfg || typeof hCfg !== "object") continue;
          const events = Object.keys(hCfg).filter((k) => k !== "enabled");
          hooks.push({
            id: `plugin:${ent.name}:${hName}`,
            name: hName,
            scope: "plugin",
            source: pName,
            path: path.join(pDir, "hooks.json"),
            enabled: hCfg.enabled !== false,
            events,
          });
        }
      }
    }
  }

  // 4. Hooks (global & workspace)
  const hookLocations = [
    { scope: "global", file: path.join(globalDir, "hooks.json") },
  ];
  if (wsAgentsDir) {
    hookLocations.push({ scope: "workspace", file: path.join(wsAgentsDir, "hooks.json") });
  }
  for (const loc of hookLocations) {
    const hData = readJsonSafe(loc.file);
    if (!hData || typeof hData !== "object") continue;
    for (const [hName, hCfg] of Object.entries(hData)) {
      if (!hCfg || typeof hCfg !== "object") continue;
      const events = Object.keys(hCfg).filter((k) => k !== "enabled");
      hooks.push({
        id: `${loc.scope}:${hName}`,
        name: hName,
        scope: loc.scope,
        source: loc.scope === "workspace" ? "Проект" : "Глобально",
        path: loc.file,
        enabled: hCfg.enabled !== false,
        events,
      });
    }
  }

  // 5. MCP servers
  if (wsAgentsDir) {
    readMcpServersFromFile(path.join(wsAgentsDir, "mcp_config.json"), "workspace", mcpServers);
  }
  readMcpServersFromFile(path.join(globalDir, "mcp_config.json"), "global", mcpServers);

  return {
    ok: true,
    globalDir,
    workspacePath,
    wsAgentsDir,
    rules,
    skills,
    mcpServers,
    plugins,
    hooks,
  };
}

function saveRule(payload = {}) {
  const scope = payload.scope === "workspace" ? "workspace" : "global";
  const workspacePath = typeof payload.workspacePath === "string" ? payload.workspacePath.trim() : "";
  const allowedRoots = getAllowedRoots(workspacePath);
  let targetPath = typeof payload.path === "string" && payload.path.trim() ? path.resolve(payload.path.trim()) : "";

  if (!targetPath) {
    const rawFile = typeof payload.fileName === "string" ? payload.fileName.trim() : "custom-rule.md";
    let cleanFile = rawFile.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+/, "");
    if (!cleanFile) cleanFile = "custom-rule.md";
    if (!/\.md$/i.test(cleanFile)) cleanFile += ".md";
    if (!SAFE_RULE_FILE_RE.test(cleanFile)) {
      return { ok: false, error: "INVALID_FILENAME" };
    }
    if (scope === "workspace") {
      const wsAgents = resolveWorkspaceAgentsDir(workspacePath);
      if (!wsAgents) return { ok: false, error: "NO_WORKSPACE" };
      targetPath = path.join(wsAgents, "rules", cleanFile);
    } else {
      targetPath = path.join(getGlobalConfigDir(), "rules", cleanFile);
    }
  }

  if (!isPathInside(targetPath, allowedRoots)) {
    return { ok: false, error: "PATH_NOT_ALLOWED" };
  }

  const enabled = payload.enabled !== false;
  const baseNoDisabled = targetPath.replace(/\.disabled$/i, "");
  const finalPath = enabled ? baseNoDisabled : `${baseNoDisabled}.disabled`;

  if (typeof payload.content === "string") {
    writeFileAtomic(finalPath, payload.content);
  } else if (typeof payload.body === "string") {
    const meta = {};
    if (payload.description) meta.description = String(payload.description).slice(0, 200);
    if (payload.trigger && payload.trigger !== "always_on") meta.trigger = String(payload.trigger).slice(0, 40);
    writeFileAtomic(finalPath, buildMarkdownWithFrontmatter(meta, payload.body));
  } else if (fs.existsSync(targetPath) && targetPath !== finalPath) {
    fs.renameSync(targetPath, finalPath);
  }

  if (targetPath !== finalPath && fs.existsSync(targetPath)) {
    try { fs.unlinkSync(targetPath); } catch {}
  }

  return { ok: true, path: finalPath, enabled };
}

function deleteRule(payload = {}) {
  const workspacePath = typeof payload.workspacePath === "string" ? payload.workspacePath.trim() : "";
  const filePath = typeof payload.path === "string" ? path.resolve(payload.path.trim()) : "";
  if (!filePath || !isPathInside(filePath, getAllowedRoots(workspacePath))) {
    return { ok: false, error: "PATH_NOT_ALLOWED" };
  }
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return { ok: true };
}

function saveSkill(payload = {}) {
  const scope = payload.scope === "workspace" ? "workspace" : "global";
  const workspacePath = typeof payload.workspacePath === "string" ? payload.workspacePath.trim() : "";
  const rawSlug = typeof payload.slug === "string" && payload.slug.trim()
    ? payload.slug.trim()
    : String(payload.name || "custom-skill").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  const slug = rawSlug.slice(0, 56);
  if (!slug || !SAFE_SLUG_RE.test(slug)) {
    return { ok: false, error: "INVALID_SKILL_SLUG" };
  }
  let baseDir = "";
  if (scope === "workspace") {
    const wsAgents = resolveWorkspaceAgentsDir(workspacePath);
    if (!wsAgents) return { ok: false, error: "NO_WORKSPACE" };
    baseDir = path.join(wsAgents, "skills", slug);
  } else {
    baseDir = path.join(getGlobalConfigDir(), "skills", slug);
  }
  if (!isPathInside(baseDir, getAllowedRoots(workspacePath))) {
    return { ok: false, error: "PATH_NOT_ALLOWED" };
  }

  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim().slice(0, 80) : slug;
  const description = typeof payload.description === "string" ? payload.description.trim().slice(0, 400) : "";
  const body = typeof payload.body === "string" ? payload.body : "";
  const enabled = payload.enabled !== false;
  const targetPath = path.join(baseDir, enabled ? "SKILL.md" : "SKILL.md.disabled");
  const otherPath = path.join(baseDir, enabled ? "SKILL.md.disabled" : "SKILL.md");

  const content = typeof payload.content === "string" && payload.content.trim()
    ? payload.content
    : buildMarkdownWithFrontmatter({ name, description }, body || `# ${name}\n\nОпишите инструкцию для агента...\n`);

  writeFileAtomic(targetPath, content);
  if (fs.existsSync(otherPath)) {
    try { fs.unlinkSync(otherPath); } catch {}
  }
  return { ok: true, slug, path: targetPath, dir: baseDir, enabled };
}

function resolveMcpConfigPath(scope, workspacePath) {
  if (scope === "workspace") {
    const wsAgents = resolveWorkspaceAgentsDir(workspacePath);
    if (!wsAgents) return "";
    return path.join(wsAgents, "mcp_config.json");
  }
  return path.join(getGlobalConfigDir(), "mcp_config.json");
}

function saveMcpServer(payload = {}) {
  const scope = payload.scope === "workspace" ? "workspace" : "global";
  const workspacePath = typeof payload.workspacePath === "string" ? payload.workspacePath.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 80) : "";
  if (!name || /[^a-zA-Z0-9._-]/.test(name)) {
    return { ok: false, error: "INVALID_MCP_NAME" };
  }
  const cfgPath = resolveMcpConfigPath(scope, workspacePath);
  if (!cfgPath || !isPathInside(cfgPath, getAllowedRoots(workspacePath))) {
    return { ok: false, error: "PATH_NOT_ALLOWED" };
  }
  const existing = readJsonSafe(cfgPath);
  const rootObj = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  if (!rootObj.mcpServers || typeof rootObj.mcpServers !== "object") {
    rootObj.mcpServers = {};
  }

  const prev = rootObj.mcpServers[name] && typeof rootObj.mcpServers[name] === "object"
    ? Object.assign({}, rootObj.mcpServers[name])
    : {};
  const next = Object.assign({}, prev);

  if (typeof payload.command === "string") {
    if (payload.command.trim()) next.command = payload.command.trim();
    else delete next.command;
  }
  if (Array.isArray(payload.args)) {
    next.args = payload.args.map((a) => String(a)).filter(Boolean);
  } else if (typeof payload.argsText === "string") {
    const parsedArgs = payload.argsText.trim() ? payload.argsText.trim().split(/\s+/) : [];
    if (parsedArgs.length > 0) next.args = parsedArgs;
    else delete next.args;
  }
  if (typeof payload.url === "string") {
    if (payload.url.trim()) next.url = payload.url.trim();
    else delete next.url;
  }
  if (payload.env && typeof payload.env === "object") {
    const cleanEnv = {};
    for (const [k, v] of Object.entries(payload.env)) {
      if (k && String(k).trim()) cleanEnv[String(k).trim()] = String(v || "");
    }
    if (Object.keys(cleanEnv).length > 0) next.env = cleanEnv;
    else delete next.env;
  }
  if (typeof payload.disabled === "boolean") {
    if (payload.disabled) next.disabled = true;
    else delete next.disabled;
  }

  if (!next.command && !next.url && !next.serverUrl && !next.httpUrl) {
    return { ok: false, error: "MCP_MISSING_COMMAND_OR_URL" };
  }

  rootObj.mcpServers[name] = next;
  writeFileAtomic(cfgPath, JSON.stringify(rootObj, null, 2) + "\n");
  return { ok: true, name, path: cfgPath, server: next };
}

function deleteMcpServer(payload = {}) {
  const scope = payload.scope === "workspace" ? "workspace" : "global";
  const workspacePath = typeof payload.workspacePath === "string" ? payload.workspacePath.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const cfgPath = resolveMcpConfigPath(scope, workspacePath);
  if (!name || !cfgPath || !isPathInside(cfgPath, getAllowedRoots(workspacePath))) {
    return { ok: false, error: "PATH_NOT_ALLOWED" };
  }
  const existing = readJsonSafe(cfgPath);
  if (existing && existing.mcpServers && Object.prototype.hasOwnProperty.call(existing.mcpServers, name)) {
    delete existing.mcpServers[name];
    writeFileAtomic(cfgPath, JSON.stringify(existing, null, 2) + "\n");
  }
  return { ok: true };
}

function listSystemFonts() {
  const now = Date.now();
  if (cachedSystemFonts && now - cachedSystemFontsAt < 5 * 60 * 1000) {
    return cachedSystemFonts;
  }
  const found = new Set([
    "Segoe UI",
    "Segoe UI Variable",
    "Arial",
    "Calibri",
    "Cambria",
    "Candara",
    "Consolas",
    "Cascadia Code",
    "Cascadia Mono",
    "Georgia",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "JetBrains Mono",
    "Fira Code",
    "Inter",
    "Roboto",
    "Ubuntu",
    "SF Pro Display",
    "SF Mono",
  ]);
  if (process.platform === "win32") {
    try {
      const out = execFileSync(
        "reg.exe",
        ["query", "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"],
        { encoding: "utf8", timeout: 2500, windowsHide: true, maxBuffer: 2 * 1024 * 1024 }
      );
      const lines = String(out || "").split(/\r?\n/);
      for (let i = 0; i < lines.length; i += 1) {
        const m = /^\s+(.+?)\s+(?:\([^)]+\)\s+)?REG_SZ\s+/i.exec(lines[i]);
        if (!m) continue;
        let name = m[1].replace(/\s*\((?:TrueType|OpenType|All res)\)\s*$/i, "").trim();
        name = name.replace(/\s+(?:Bold|Italic|Regular|Light|Medium|SemiBold|Black|Thin|Condensed|Oblique)(?:\s+(?:Italic|Oblique))?$/i, "").trim();
        if (name && name.length >= 2 && name.length <= 56 && !name.startsWith("@")) {
          found.add(name);
        }
      }
    } catch {}
  }
  cachedSystemFonts = Array.from(found).sort((a, b) => a.localeCompare(b));
  cachedSystemFontsAt = now;
  return cachedSystemFonts;
}

module.exports = {
  getGlobalConfigDir,
  listCustomizations,
  saveRule,
  deleteRule,
  saveSkill,
  saveMcpServer,
  deleteMcpServer,
  listSystemFonts,
  parseMarkdownFrontmatter,
  buildMarkdownWithFrontmatter,
};
