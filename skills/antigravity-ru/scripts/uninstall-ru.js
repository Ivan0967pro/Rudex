"use strict";

const fs = require("fs");
const path = require("path");
const { detectAntigravity } = require("./install-ru");

function parseArgs(argv) {
  let appDir = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--app-dir" && i + 1 < argv.length) appDir = argv[++i];
    else if (a.startsWith("--app-dir=")) appDir = a.slice("--app-dir=".length);
  }
  return { appDir };
}

function main() {
  const { appDir } = parseArgs(process.argv.slice(2));
  const envInfo = detectAntigravity(appDir);

  if (envInfo.exePath) {
    console.log(`AGY_EXE=${envInfo.exePath}`);
  }

  if (!fs.existsSync(envInfo.asarPath)) {
    if (!envInfo.latestBackupPath) {
      console.error(`ERROR: Neither app.asar nor app.asar.orig-* found in ${envInfo.resourcesDir}`);
      process.exit(1);
    }
    fs.renameSync(envInfo.latestBackupPath, envInfo.asarPath);
    console.log(`Restored original app.asar from: ${envInfo.latestBackupPath}`);
  }

  if (!fs.existsSync(envInfo.asarPath)) {
    console.error("ERROR: Original app.asar is missing; refusing to delete localized app folder.");
    process.exit(1);
  }

  let removedAny = false;
  if (fs.existsSync(envInfo.appDir)) {
    try {
      fs.rmSync(envInfo.appDir, { recursive: true, force: true });
      console.log(`Removed localized app directory: ${envInfo.appDir}`);
      removedAny = true;
    } catch (err) {
      if (err && (err.code === "EBUSY" || err.code === "EPERM" || err.code === "ENOTEMPTY")) {
        console.log(`STATUS=LOCKED_NEEDS_CLOSE`);
        console.error(`Could not remove resources\\app while Antigravity is running (${err.code}). Close Antigravity and re-run uninstall.`);
        process.exit(2);
      }
      throw err;
    }
  }

  for (const entry of fs.readdirSync(envInfo.resourcesDir)) {
    if (entry.startsWith("app.ru-outdated-") || entry.startsWith("app.ru-backup-")) {
      try {
        const target = path.join(envInfo.resourcesDir, entry);
        fs.rmSync(target, { recursive: true, force: true });
        console.log(`Removed stale backup directory: ${target}`);
        removedAny = true;
      } catch {}
    }
  }

  console.log(removedAny ? "Uninstall complete. Stock English UI restored." : "Nothing to remove: stock app.asar is active.");
  console.log("STATUS=UNINSTALLED");
}

main();
