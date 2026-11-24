#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { detectAntigravity, getUserDataDir } = require("./install.js");

function safeRemove(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) return false;
  fs.rmSync(targetPath, { recursive: true, force: true });
  return true;
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
      fs.copyFileSync(info.backups[0].path, info.asarPath);
      restored = true;
    }

    // Remove patched appDir and backups only when stock app.asar is verified on disk
    if (fs.existsSync(info.asarPath) && fs.statSync(info.asarPath).size > 0) {
      if (fs.existsSync(info.appDir)) {
        safeRemove(info.appDir);
        console.log(`Removed patched app dir: ${info.appDir}`);
      }
      if (fs.existsSync(info.resourcesDir)) {
        for (const name of fs.readdirSync(info.resourcesDir)) {
          if (/^app\.(rudex|ru)-(outdated|prev)-/.test(name)) {
            safeRemove(path.join(info.resourcesDir, name));
            console.log(`Removed stale dir: ${name}`);
          }
        }
        for (const b of info.backups) {
          safeRemove(b.path);
          console.log(`Removed backup: ${b.name}`);
        }
      }
    } else if (fs.existsSync(info.appDir)) {
      console.warn("Skipped removing resources/app because stock app.asar could not be verified.");
    }
    if (restored) console.log(`Restored stock app.asar: ${info.asarPath}`);
  } else {
    console.warn("Antigravity installation directory not detected; cleaning flags & rules only.");
  }

  // Clean transient persona flags & pending live-edit flags
  const runtimeFlags = [
    path.join(userDataDir, "agy_studio_persona_active.flag"),
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
