"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const https = require("https");
const { execFileSync, spawnSync } = require("child_process");
const { URL } = require("url");

const REPO_OWNER = "Ivan0967pro";
const REPO_NAME = "Rudex";
const DEFAULT_BRANCH = "main";
const RAW_MANIFEST_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${DEFAULT_BRANCH}/plugin.json`;
const API_COMMIT_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${DEFAULT_BRANCH}`;
const ATOM_FEED_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/commits/${DEFAULT_BRANCH}.atom`;
const ARCHIVE_ZIP_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${DEFAULT_BRANCH}.zip`;
const DEFAULT_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const DEFAULT_SNOOZE_MS = 6 * 60 * 60 * 1000;
const MAX_ZIP_BYTES = 50 * 1024 * 1024;

function compareSemver(a, b) {
  const parse = (v) => {
    const clean = String(v || "").trim().replace(/^v/i, "").split(/[-+]/)[0];
    const parts = clean.split(".").map((p) => {
      const n = parseInt(p, 10);
      return Number.isFinite(n) ? n : 0;
    });
    while (parts.length < 3) parts.push(0);
    return parts;
  };
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da - db;
  }
  return String(a || "").localeCompare(String(b || ""));
}

function extractCommitShaFromText(str) {
  const m = /\b([0-9a-f]{40})\b/i.exec(String(str || ""));
  return m ? m[1].toLowerCase() : "";
}

function readZipEocdComment(zipPath) {
  let fd = null;
  try {
    if (!zipPath || !fs.existsSync(zipPath)) return "";
    const st = fs.statSync(zipPath);
    if (!st.isFile() || st.size < 22) return "";
    const tailLen = Math.min(st.size, 65560);
    const startOffset = st.size - tailLen;
    const buf = Buffer.allocUnsafe(tailLen);
    fd = fs.openSync(zipPath, "r");
    let total = 0;
    while (total < tailLen) {
      const n = fs.readSync(fd, buf, total, tailLen - total, startOffset + total);
      if (n <= 0) break;
      total += n;
    }
    const view = total === tailLen ? buf : buf.subarray(0, total);
    for (let pos = view.length - 22; pos >= 0; pos -= 1) {
      if (
        view[pos] === 0x50 &&
        view[pos + 1] === 0x4b &&
        view[pos + 2] === 0x05 &&
        view[pos + 3] === 0x06
      ) {
        const commentLen = view.readUInt16LE(pos + 20);
        if (pos + 22 + commentLen <= view.length) {
          return view.subarray(pos + 22, pos + 22 + commentLen).toString("utf8").trim();
        }
      }
    }
    return "";
  } catch (_e) {
    return "";
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (_e) {}
    }
  }
}

function readGitHeadMeta(repoRoot) {
  const empty = { commitSha: "", commitShort: "", commitDate: "" };
  try {
    if (!repoRoot) return empty;
    const gitDir = path.join(repoRoot, ".git");
    if (!fs.existsSync(gitDir)) return empty;
    const headPath = path.join(gitDir, "HEAD");
    if (!fs.existsSync(headPath)) return empty;
    const headText = fs.readFileSync(headPath, "utf8").trim();
    let commitSha = "";
    if (/^[0-9a-f]{40}$/i.test(headText)) {
      commitSha = headText.toLowerCase();
    } else if (/^ref:\s*(.+)$/i.test(headText)) {
      const refRel = RegExp.$1.trim();
      const looseRefPath = path.join(gitDir, ...refRel.split("/"));
      if (fs.existsSync(looseRefPath)) {
        const val = fs.readFileSync(looseRefPath, "utf8").trim();
        if (/^[0-9a-f]{40}$/i.test(val)) commitSha = val.toLowerCase();
      } else {
        const packedPath = path.join(gitDir, "packed-refs");
        if (fs.existsSync(packedPath)) {
          const lines = fs.readFileSync(packedPath, "utf8").split(/\r?\n/);
          for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i].trim();
            if (!line || line.startsWith("#") || line.startsWith("^")) continue;
            const parts = line.split(/\s+/);
            if (parts.length >= 2 && parts[1] === refRel && /^[0-9a-f]{40}$/i.test(parts[0])) {
              commitSha = parts[0].toLowerCase();
              break;
            }
          }
        }
      }
    }
    if (!commitSha) return empty;
    let commitDate = "";
    try {
      const iso = execFileSync("git", ["show", "-s", "--format=%cI", "HEAD"], {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: 1500,
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"],
      });
      if (iso && iso.trim()) commitDate = iso.trim();
    } catch (_e) {}
    return {
      commitSha,
      commitShort: commitSha.slice(0, 7),
      commitDate,
    };
  } catch (_e) {
    return empty;
  }
}

function evaluateUpdateAvailability(installed, remote) {
  const inst = installed && typeof installed === "object" ? installed : {};
  const rem = remote && typeof remote === "object" ? remote : {};
  const instVer = String(inst.version || "0.0.0").trim() || "0.0.0";
  const remVer = String(rem.version || "").trim();
  const remSha = String(rem.commitSha || "").trim().toLowerCase();
  const instSha = String(inst.commitSha || "").trim().toLowerCase();
  const updateKey = `${remVer || instVer}:${remSha ? remSha.slice(0, 12) : "release"}`;

  const verCmp = remVer ? compareSemver(remVer, instVer) : 0;
  if (verCmp > 0) {
    return { available: true, reason: "version", updateKey };
  }
  if (verCmp < 0) {
    return { available: false, reason: "ahead-version", updateKey };
  }

  if (remSha && instSha) {
    if (remSha === instSha) {
      return { available: false, reason: "up-to-date", updateKey };
    }
    const remMs = Date.parse(rem.commitDate || "") || 0;
    const instMs = Date.parse(inst.commitDate || "") || Date.parse(inst.patchedAt || "") || 0;
    if (remMs > 0 && instMs > 0 && remMs < instMs - 60000) {
      return { available: false, reason: "local-newer", updateKey };
    }
    return { available: true, reason: "commit", updateKey };
  }

  if (remSha && !instSha) {
    const remMs = Date.parse(rem.commitDate || "") || 0;
    const patchMs = Date.parse(inst.patchedAt || "") || 0;
    if (remMs > 0 && patchMs > 0 && remMs > patchMs + 120000) {
      return { available: true, reason: "newer-commit-time", updateKey };
    }
    return { available: false, reason: "up-to-date-no-sha", updateKey };
  }

  return { available: false, reason: "up-to-date", updateKey };
}

function httpGetBuffer(targetUrl, opts = {}, redirectCount = 0) {
  const maxRedirects = typeof opts.maxRedirects === "number" ? opts.maxRedirects : 6;
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 15000;
  const maxBytes = typeof opts.maxBytes === "number" ? opts.maxBytes : MAX_ZIP_BYTES;

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
      parsed = new URL(targetUrl);
    } catch (err) {
      done(new Error(`Invalid URL: ${targetUrl}`));
      return;
    }

    const client = parsed.protocol === "http:" ? http : https;
    const headers = Object.assign(
      {
        "User-Agent": "Rudex-Updater",
      },
      opts.headers || {}
    );
    if (opts.accept) headers.Accept = opts.accept;
    if (opts.ifNoneMatch) headers["If-None-Match"] = opts.ifNoneMatch;

    const req = client.request(
      parsed,
      {
        method: "GET",
        headers,
      },
      (res) => {
        const status = res.statusCode || 0;
        const loc = res.headers && res.headers.location;
        if (loc && [301, 302, 303, 307, 308].includes(status)) {
          res.resume();
          if (redirectCount >= maxRedirects) {
            done(new Error("Too many HTTP redirects"));
            return;
          }
          let nextUrl;
          try {
            nextUrl = new URL(loc, parsed).toString();
          } catch (err) {
            done(new Error("Invalid redirect location"));
            return;
          }
          httpGetBuffer(nextUrl, opts, redirectCount + 1).then(
            (v) => done(null, v),
            (e) => done(e)
          );
          return;
        }

        if (status === 304) {
          res.resume();
          done(null, { status: 304, headers: res.headers || {}, body: Buffer.alloc(0) });
          return;
        }

        const chunks = [];
        let totalBytes = 0;
        res.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > maxBytes) {
            req.destroy();
            res.destroy();
            done(new Error(`Response exceeded max size (${maxBytes} bytes)`));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          done(null, {
            status,
            headers: res.headers || {},
            body: Buffer.concat(chunks),
          });
        });
        res.on("error", (err) => done(err));
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    });
    req.on("error", (err) => done(err));
    req.end();
  });
}

function httpDownloadToFile(targetUrl, destPath, opts = {}, redirectCount = 0) {
  const maxRedirects = typeof opts.maxRedirects === "number" ? opts.maxRedirects : 6;
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 60000;
  const maxBytes = typeof opts.maxBytes === "number" ? opts.maxBytes : MAX_ZIP_BYTES;

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanupPartial = () => {
      try {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      } catch (_e) {}
    };
    const done = (err, val) => {
      if (settled) return;
      settled = true;
      if (err) {
        cleanupPartial();
        reject(err);
      } else {
        resolve(val);
      }
    };

    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (_err) {
      done(new Error(`Invalid URL: ${targetUrl}`));
      return;
    }

    const client = parsed.protocol === "http:" ? http : https;
    const headers = Object.assign({ "User-Agent": "Rudex-Updater" }, opts.headers || {});
    const req = client.request(parsed, { method: "GET", headers }, (res) => {
      const status = res.statusCode || 0;
      const loc = res.headers && res.headers.location;
      if (loc && [301, 302, 303, 307, 308].includes(status)) {
        res.resume();
        if (redirectCount >= maxRedirects) {
          done(new Error("Too many HTTP redirects"));
          return;
        }
        let nextUrl;
        try {
          nextUrl = new URL(loc, parsed).toString();
        } catch (_err) {
          done(new Error("Invalid redirect location"));
          return;
        }
        httpDownloadToFile(nextUrl, destPath, opts, redirectCount + 1).then(
          (v) => done(null, v),
          (e) => done(e)
        );
        return;
      }

      if (status < 200 || status >= 300) {
        res.resume();
        done(new Error(`HTTP ${status} while downloading update archive`));
        return;
      }

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      const ws = fs.createWriteStream(destPath);
      let totalBytes = 0;

      res.on("data", (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          req.destroy();
          res.destroy();
          ws.destroy();
          done(new Error(`Archive exceeded max allowed size (${maxBytes} bytes)`));
        }
      });
      res.on("error", (err) => {
        ws.destroy();
        done(err);
      });
      ws.on("error", (err) => {
        req.destroy();
        done(err);
      });
      ws.on("finish", () => {
        done(null, { path: destPath, sizeBytes: totalBytes });
      });
      res.pipe(ws);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Download timeout after ${timeoutMs}ms`));
    });
    req.on("error", (err) => done(err));
    req.end();
  });
}

function decodeXmlEntities(str) {
  return String(str || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseGithubAtomFeed(xmlText) {
  const xml = String(xmlText || "");
  const entryM = /<entry\b[^>]*>([\s\S]*?)<\/entry>/i.exec(xml);
  if (!entryM) return null;
  const entry = entryM[1];
  const linkM = /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i.exec(entry);
  const idM = /<id\b[^>]*>([\s\S]*?)<\/id>/i.exec(entry);
  const updatedM = /<updated\b[^>]*>([\s\S]*?)<\/updated>/i.exec(entry);
  const titleM = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(entry);

  const htmlUrl = linkM ? decodeXmlEntities(linkM[1].trim()) : "";
  const commitSha = extractCommitShaFromText(htmlUrl) || extractCommitShaFromText(idM ? idM[1] : "");
  if (!commitSha) return null;

  const rawTitle = titleM ? decodeXmlEntities(titleM[1]) : "";
  const commitMessage = rawTitle.split(/\r?\n/).map((s) => s.trim()).find(Boolean) || "";
  return {
    commitSha,
    commitShort: commitSha.slice(0, 7),
    commitDate: updatedM ? updatedM[1].trim() : "",
    commitMessage: commitMessage.slice(0, 120),
    htmlUrl,
  };
}

async function checkRemoteRelease(opts = {}) {
  const bypassCache = Boolean(opts.bypassCache);
  const rawManifestUrl = opts.manifestUrl || RAW_MANIFEST_URL;
  const manifestUrl = bypassCache
    ? `${rawManifestUrl}${rawManifestUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
    : rawManifestUrl;
  const commitApiUrl = opts.commitApiUrl || API_COMMIT_URL;
  const atomFeedUrl = typeof opts.atomFeedUrl === "string"
    ? opts.atomFeedUrl
    : (commitApiUrl === API_COMMIT_URL ? ATOM_FEED_URL : "");
  const prevEtag = !bypassCache && typeof opts.prevEtag === "string" ? opts.prevEtag : "";
  const prevRemote = opts.prevRemote && typeof opts.prevRemote === "object" ? opts.prevRemote : null;
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 15000;

  const [manSettled, apiSettled] = await Promise.allSettled([
    httpGetBuffer(manifestUrl, { timeoutMs, accept: "application/json", maxBytes: 1024 * 1024 }),
    httpGetBuffer(commitApiUrl, {
      timeoutMs,
      accept: "application/vnd.github+json",
      ifNoneMatch: prevEtag || undefined,
      maxBytes: 2 * 1024 * 1024,
    }),
  ]);

  let manifestOk = false;
  let remoteVersion = "";
  let manifestErr = "";

  if (manSettled.status === "fulfilled" && manSettled.value.status >= 200 && manSettled.value.status < 300) {
    try {
      const pkg = JSON.parse(manSettled.value.body.toString("utf8"));
      if (pkg && typeof pkg.version === "string" && pkg.version.trim()) {
        remoteVersion = pkg.version.trim();
        manifestOk = true;
      } else {
        manifestErr = "Manifest missing version field";
      }
    } catch (err) {
      manifestErr = err && err.message ? err.message : "Invalid manifest JSON";
    }
  } else if (manSettled.status === "fulfilled") {
    manifestErr = `HTTP ${manSettled.value.status}`;
  } else {
    manifestErr = manSettled.reason && manSettled.reason.message ? manSettled.reason.message : String(manSettled.reason);
  }

  let apiOk = false;
  let nextEtag = prevEtag;
  let commitSha = "";
  let commitDate = "";
  let commitMessage = "";
  let htmlUrl = "";
  let apiErr = "";

  if (apiSettled.status === "fulfilled") {
    const res = apiSettled.value;
    if (res.status === 304 && prevRemote) {
      apiOk = true;
      nextEtag = (res.headers && res.headers.etag) || prevEtag;
      commitSha = String(prevRemote.commitSha || "");
      commitDate = String(prevRemote.commitDate || "");
      commitMessage = String(prevRemote.commitMessage || "");
      htmlUrl = String(prevRemote.htmlUrl || "");
    } else if (res.status >= 200 && res.status < 300) {
      try {
        const data = JSON.parse(res.body.toString("utf8"));
        if (data && typeof data.sha === "string" && data.sha.trim()) {
          apiOk = true;
          nextEtag = (res.headers && res.headers.etag) || "";
          commitSha = data.sha.trim().toLowerCase();
          const cObj = data.commit && typeof data.commit === "object" ? data.commit : {};
          const committer = cObj.committer && typeof cObj.committer === "object" ? cObj.committer : {};
          const author = cObj.author && typeof cObj.author === "object" ? cObj.author : {};
          commitDate = String(committer.date || author.date || "");
          const rawMsg = String(cObj.message || "");
          const firstLine = rawMsg.split(/\r?\n/).map((s) => s.trim()).find(Boolean) || "";
          commitMessage = firstLine.slice(0, 120);
          htmlUrl = typeof data.html_url === "string" ? data.html_url : "";
        } else {
          apiErr = "Commit API response missing sha";
        }
      } catch (err) {
        apiErr = err && err.message ? err.message : "Invalid commit API JSON";
      }
    } else {
      apiErr = `HTTP ${res.status}`;
    }
  } else {
    apiErr = apiSettled.reason && apiSettled.reason.message ? apiSettled.reason.message : String(apiSettled.reason);
  }

  if (!apiOk && atomFeedUrl) {
    try {
      const feedRes = await httpGetBuffer(atomFeedUrl, {
        timeoutMs,
        accept: "application/atom+xml, application/xml, text/xml",
        maxBytes: 2 * 1024 * 1024,
      });
      if (feedRes && feedRes.status >= 200 && feedRes.status < 300) {
        const parsedFeed = parseGithubAtomFeed(feedRes.body.toString("utf8"));
        if (parsedFeed && parsedFeed.commitSha) {
          apiOk = true;
          nextEtag = "";
          commitSha = parsedFeed.commitSha;
          commitDate = parsedFeed.commitDate;
          commitMessage = parsedFeed.commitMessage;
          htmlUrl = parsedFeed.htmlUrl;
        }
      }
    } catch (_e) {}
  }

  if (!manifestOk && !apiOk) {
    return { ok: false, error: apiErr || manifestErr || "Failed to reach update endpoints" };
  }

  if (manifestOk && !apiOk && prevRemote && prevRemote.version === remoteVersion && prevRemote.commitSha) {
    commitSha = String(prevRemote.commitSha || "");
    commitDate = String(prevRemote.commitDate || "");
    commitMessage = String(prevRemote.commitMessage || "");
    htmlUrl = String(prevRemote.htmlUrl || "");
  }

  const finalVersion = remoteVersion || (prevRemote && prevRemote.version) || "";
  return {
    ok: true,
    etag: apiOk ? nextEtag : "",
    remote: {
      version: finalVersion,
      commitSha,
      commitShort: commitSha ? commitSha.slice(0, 7) : "",
      commitDate,
      commitMessage,
      htmlUrl,
    },
  };
}

function findPluginRootInDir(rootDir, maxDepth = 2) {
  const queue = [{ dir: rootDir, depth: 0 }];
  while (queue.length > 0) {
    const cur = queue.shift();
    const manifestPath = path.join(cur.dir, "plugin.json");
    const installJsPath = path.join(cur.dir, "skills", "rudex", "scripts", "install.js");
    if (fs.existsSync(manifestPath) && fs.existsSync(installJsPath)) {
      try {
        const pluginJson = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        if (pluginJson && pluginJson.name === "rudex") {
          return { sourceDir: cur.dir, installJsPath, pluginJson };
        }
      } catch (_e) {}
    }
    if (cur.depth < maxDepth) {
      try {
        const ents = fs.readdirSync(cur.dir, { withFileTypes: true });
        for (let i = 0; i < ents.length; i += 1) {
          if (ents[i].isDirectory()) {
            queue.push({ dir: path.join(cur.dir, ents[i].name), depth: cur.depth + 1 });
          }
        }
      } catch (_e) {}
    }
  }
  return null;
}

function extractZipArchive(zipPath, destDir) {
  if (!zipPath || !fs.existsSync(zipPath)) {
    throw new Error("Update archive file not found");
  }
  const fd = fs.openSync(zipPath, "r");
  try {
    const magic = Buffer.allocUnsafe(4);
    const n = fs.readSync(fd, magic, 0, 4, 0);
    if (n < 4 || magic[0] !== 0x50 || magic[1] !== 0x4b || magic[2] !== 0x03 || magic[3] !== 0x04) {
      throw new Error("Downloaded file is not a valid ZIP archive");
    }
  } finally {
    fs.closeSync(fd);
  }

  const resolvedZip = path.resolve(zipPath);
  const resolvedDest = path.resolve(destDir);
  if (fs.existsSync(resolvedDest)) {
    fs.rmSync(resolvedDest, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(resolvedDest), { recursive: true });

  if (process.platform === "win32") {
    const psCmd =
      "Add-Type -AssemblyName System.IO.Compression.FileSystem; " +
      "[System.IO.Compression.ZipFile]::ExtractToDirectory($env:RUDEX_ZIP, $env:RUDEX_DEST)";
    const res = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psCmd], {
      env: Object.assign({}, process.env, { RUDEX_ZIP: resolvedZip, RUDEX_DEST: resolvedDest }),
      encoding: "utf8",
      timeout: 60000,
      windowsHide: true,
    });
    if (res.status !== 0) {
      const msg = (res.stderr || res.stdout || "").trim() || `PowerShell exit ${res.status}`;
      throw new Error(`Failed to extract update ZIP: ${msg}`);
    }
  } else {
    fs.mkdirSync(resolvedDest, { recursive: true });
    let res = spawnSync("unzip", ["-qo", resolvedZip, "-d", resolvedDest], {
      encoding: "utf8",
      timeout: 60000,
    });
    if (res.error || res.status !== 0) {
      res = spawnSync("tar", ["-xf", resolvedZip, "-C", resolvedDest], {
        encoding: "utf8",
        timeout: 60000,
      });
    }
    if (res.status !== 0) {
      const msg = (res.stderr || res.stdout || "").trim() || `Extractor exit ${res.status}`;
      throw new Error(`Failed to extract update ZIP: ${msg}`);
    }
  }

  const found = findPluginRootInDir(resolvedDest, 2);
  if (!found) {
    throw new Error("Rudex plugin manifest and installer not found inside extracted archive");
  }
  return found;
}

function writeUpdaterRestartScript(exePath, opts = {}) {
  if (process.platform !== "win32" || !exePath) return "";
  const outPath = opts.outPath || path.join(os.tmpdir(), `rudex-update-restart-${Date.now()}.cmd`);
  const removeAsar = Boolean(opts.removeAsar && opts.resourcesDir);
  const lines = [
    "@echo off",
    "chcp 65001 >nul",
    `set "AGY_EXE=${exePath}"`,
  ];
  if (removeAsar) {
    lines.push(`set "RES_DIR=${opts.resourcesDir}"`);
  }
  lines.push(
    "setlocal EnableDelayedExpansion",
    "timeout /t 1 /nobreak >nul",
    "taskkill /IM Antigravity.exe >nul 2>&1",
    "timeout /t 2 /nobreak >nul",
    "taskkill /F /T /IM Antigravity.exe >nul 2>&1",
    "for /L %%I in (1,1,10) do (",
    '  tasklist /FI "IMAGENAME eq Antigravity.exe" 2>nul | find /I "Antigravity.exe" >nul',
    "  if errorlevel 1 goto launch",
    "  timeout /t 1 /nobreak >nul",
    ")",
    ":launch"
  );
  if (removeAsar) {
    lines.push(
      'if exist "!RES_DIR!\\app.asar.orig-*" if exist "!RES_DIR!\\app" (',
      '  del /F /Q "!RES_DIR!\\app.asar" >nul 2>&1',
      ")"
    );
  }
  lines.push(
    'start "" "!AGY_EXE!"',
    'del "%~f0" >nul 2>&1',
    ""
  );
  fs.writeFileSync(outPath, lines.join("\r\n"), "utf8");
  return outPath;
}

function parseInstallerKeyValues(stdoutText) {
  const out = { status: "", activatorPath: "", exePath: "" };
  const lines = String(stdoutText || "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith("STATUS=")) out.status = line.slice("STATUS=".length).trim();
    else if (line.startsWith("ACTIVATOR_PATH=")) out.activatorPath = line.slice("ACTIVATOR_PATH=".length).trim();
    else if (line.startsWith("AGY_EXE=")) out.exePath = line.slice("AGY_EXE=".length).trim();
  }
  return out;
}

async function installUpdateFromZip(opts = {}) {
  const archiveUrl = opts.archiveUrl || ARCHIVE_ZIP_URL;
  const onProgress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  const tempRoot = path.join(os.tmpdir(), `rudex-update-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const zipPath = path.join(tempRoot, "rudex-update.zip");
  const extractDir = path.join(tempRoot, "extracted");

  try {
    fs.mkdirSync(tempRoot, { recursive: true });
    onProgress("downloading");
    await httpDownloadToFile(archiveUrl, zipPath, {
      timeoutMs: typeof opts.downloadTimeoutMs === "number" ? opts.downloadTimeoutMs : 60000,
      maxBytes: MAX_ZIP_BYTES,
    });

    const remoteMeta = opts.remote && typeof opts.remote === "object" ? opts.remote : {};
    const zipSha = extractCommitShaFromText(readZipEocdComment(zipPath)) || String(remoteMeta.commitSha || "");

    onProgress("extracting");
    const { installJsPath, pluginJson } = extractZipArchive(zipPath, extractDir);

    onProgress("installing");
    const runtimePath = opts.runtimePath || process.execPath;
    const childEnv = Object.assign({}, process.env);
    if (!opts.useSystemNode) {
      childEnv.ELECTRON_RUN_AS_NODE = "1";
    }
    if (zipSha) childEnv.RUDEX_COMMIT_SHA = zipSha;
    if (remoteMeta.commitDate) childEnv.RUDEX_COMMIT_DATE = String(remoteMeta.commitDate);
    childEnv.RUDEX_ZIP_PATH = zipPath;

    const runRes = spawnSync(runtimePath, [installJsPath, "--sync-plugin"], {
      env: childEnv,
      encoding: "utf8",
      timeout: 90000,
      windowsHide: true,
    });
    if (runRes.status !== 0) {
      const errOut = (runRes.stderr || runRes.stdout || "").trim();
      throw new Error(errOut || `Installer exited with code ${runRes.status}`);
    }

    const parsed = parseInstallerKeyValues(runRes.stdout);
    return {
      ok: true,
      status: parsed.status || "ACTIVATED",
      activatorPath: parsed.activatorPath,
      exePath: parsed.exePath,
      installedVersion: String((pluginJson && pluginJson.version) || remoteMeta.version || ""),
      installedCommitSha: zipSha,
    };
  } finally {
    try {
      if (fs.existsSync(tempRoot)) {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    } catch (_e) {}
  }
}

module.exports = {
  REPO_OWNER,
  REPO_NAME,
  DEFAULT_BRANCH,
  RAW_MANIFEST_URL,
  API_COMMIT_URL,
  ATOM_FEED_URL,
  ARCHIVE_ZIP_URL,
  DEFAULT_CHECK_INTERVAL_MS,
  DEFAULT_SNOOZE_MS,
  MAX_ZIP_BYTES,
  compareSemver,
  extractCommitShaFromText,
  parseGithubAtomFeed,
  readZipEocdComment,
  readGitHeadMeta,
  evaluateUpdateAvailability,
  httpGetBuffer,
  httpDownloadToFile,
  checkRemoteRelease,
  extractZipArchive,
  writeUpdaterRestartScript,
  installUpdateFromZip,
};
