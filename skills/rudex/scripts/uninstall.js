#!/usr/bin/env node
"use strict";

// Disable Electron's virtual ASAR fs wrapper when run via ELECTRON_RUN_AS_NODE=1
process.noAsar = true;

const fs = require("fs");
const path = require("path");
const os = require("os");
const { detectAntigravity, getUserDataDir } = require("./install.js");

function safeRemove(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) return false;
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.warn(`Warning: failed to remove ${targetPath}:`, err && err.message ? err.message : err);
    return false;
  }
}

function restoreAsarAtomic(backupPath, asarPath) {
  const tmpPath = `${asarPath}.rudex-restore-${process.pid}-${Date.now()}.tmp`;
  try {
    fs.copyFileSync(backupPath, tmpPath);
    try {
      fs.renameSync(tmpPath, asarPath);
    } catch {
      fs.copyFileSync(tmpPath, asarPath);
      try { fs.unlinkSync(tmpPath); } catch {}
    }
    return true;
  } catch (err) {
    try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
    console.warn(`Warning: failed to restore stock app.asar:`, err && err.message ? err.message : err);
    return false;
  }
}

function runUninstall(options = {}) {
  const info = detectAntigravity();
  const userDataDir = getUserDataDir();
  const geminiConfigDir = path.join(os.homedir(), ".gemini", "config");
  const pluginsBase = path.join(geminiConfigDir, "plugins");

  let restored = false;
  if (info.found) {
    // Ensure stock app.asar exists (restore from newest semver backup if missing or requested)
    if (!fs.existsSync(info.asarPath) && info.backups.length > 0) {
      restored = restoreAsarAtomic(info.backups[0].path, info.asarPath);
    }

    // Remove patched appDir and backups only when stock app.asar is verified on disk
    if (fs.existsSync(info.asarPath) && fs.statSync(info.asarPath).size > 0) {
      if (fs.existsSync(info.appDir)) {
        if (safeRemove(info.appDir)) console.log(`Removed patched app dir: ${info.appDir}`);
      }
      if (fs.existsSync(info.resourcesDir)) {
        for (const name of fs.readdirSync(info.resourcesDir)) {
          if (/^(?:app\.(rudex|ru)-(outdated|prev|removed)-|\.rudex-staging-)/.test(name)) {
            if (safeRemove(path.join(info.resourcesDir, name))) console.log(`Removed stale dir: ${name}`);
          }
        }
        for (const b of info.backups) {
          if (safeRemove(b.path)) console.log(`Removed backup: ${b.name}`);
        }
      }
    } else if (fs.existsSync(info.appDir)) {
      console.warn("Skipped removing resources/app because stock app.asar could not be verified.");
    }
    if (restored) console.log(`Restored stock app.asar: ${info.asarPath}`);
  } else {
    console.warn("Antigravity installation directory not detected; cleaning flags & rules only.");
  }

  // Clean transient persona, agent-profile, tool-policy & pending live-edit flags
  const runtimeFlags = [
    path.join(userDataDir, "agy_studio_persona_active.flag"),
    path.join(userDataDir, "agy_studio_thinking_ru.flag"),
    path.join(userDataDir, "agy_studio_agent_profile.flag"),
    path.join(userDataDir, "agy_studio_tool_policy.flag"),
    path.join(userDataDir, "studio_live_edits", "pending.flag"),
  ];
  for (const f of runtimeFlags) {
    if (safeRemove(f)) console.log(`Removed runtime flag: ${f}`);
  }

  // Clean active persona rule files across Rudex and legacy paths
  const ruleFiles = [
    path.join(pluginsBase, "rudex", "rules", "AGENTS.md"),
    path.join(pluginsBase, "antigravity-ru", "rules", "AGENTS.md"),
    path.join(geminiConfigDir, "rules", "antigravity-ru-persona.md"),
  ];
  for (const r of ruleFiles) {
    if (safeRemove(r)) console.log(`Removed persona rule: ${r}`);
  }

  if (options.removePlugin) {
    for (const name of ["rudex", "antigravity-ru"]) {
      const p = path.join(pluginsBase, name);
      if (safeRemove(p)) console.log(`Removed plugin: ${p}`);
    }
  } else if (safeRemove(path.join(pluginsBase, "antigravity-ru"))) {
    console.log("Removed legacy plugin: antigravity-ru");
  }

  console.log("STATUS=RESTORED_ENGLISH");
}

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  runUninstall({ removePlugin: args.has("--remove-plugin") });
}

module.exports = { runUninstall };
