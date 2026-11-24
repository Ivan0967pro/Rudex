---
name: antigravity-ru
description: >-
  Installs, updates, checks status of, or removes full Russian UI localization for
  Antigravity 2.0 (React interface, top bar menus, tray, right-click context menus,
  and system dialogs). Use when the user asks to translate Antigravity to Russian,
  check Russian localization status, or restore the English UI.
---

# Antigravity RU Localization Skill

Translates the Antigravity 2.0 desktop interface into Russian using [install-ru.js](./scripts/install-ru.js) and removes localization cleanly with [uninstall-ru.js](./scripts/uninstall-ru.js).

## Critical Safety Rules

1. **NEVER terminate or kill `Antigravity.exe` during an agent turn** — doing so kills the active conversation before you can reply.
2. When running from a script that creates an activator (e.g. `Apply-Russian-And-Restart.cmd`), present a clickable `file://` link so the user can double-click it after reading your reply.

## Choosing the JS Runtime

Check if `node` is available on `PATH`. If Node.js is **not** installed, Antigravity's own binary supports `ELECTRON_RUN_AS_NODE=1`:

- **With Node.js:**
  `node "<skill_dir>/scripts/install-ru.js"`
- **Without Node.js (Windows PowerShell / cmd):**
  Always redirect output to a log file so `cmd` waits synchronously for the GUI binary:
  `cmd /c "set ELECTRON_RUN_AS_NODE=1 && ""%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"" ""<skill_dir>/scripts/install-ru.js"" > ""%TEMP%\agy_ru_op.log"" 2>&1" && type "%TEMP%\agy_ru_op.log"`

*(Use forward slashes for clickable links shown to the user, and quotes for paths with spaces.)*

## Operations

### 1. Install or Update Russian UI

Run [install-ru.js](./scripts/install-ru.js):

- Look for `STATUS=` in stdout:
  - **`STATUS=ACTIVATED`**: `app.asar` is already backed up and Russian localization is staged/active. Tell the user to simply restart Antigravity once.
  - **`STATUS=LOCKED_NEEDS_ACTIVATOR`**: On Windows, `app.asar` is locked while Antigravity is running. Read `ACTIVATOR_PATH=<path>` from output and give the user a clickable `file://` link to that `.cmd` file explaining that double-clicking it closes Antigravity, activates the Russian UI, and relaunches it.
- Pass `--app-dir <path>` only if Antigravity is installed in a non-standard directory and auto-detection fails.
- To verify without modifying files first, run with `--dry-run`.

### 2. Check Localization Status

Run [install-ru.js](./scripts/install-ru.js) with `--status`. Report `activeMode`, installed version/stamp, dictionary size, and current locale (`ru` or `en` from `localeState`).

### 3. Remove Russian UI / Restore English

Run [uninstall-ru.js](./scripts/uninstall-ru.js). It restores `app.asar.orig-*` -> `app.asar` first and then removes `resources/app`.
If `STATUS=LOCKED_NEEDS_CLOSE` is reported because Antigravity is currently running on Windows, guide the user to close Antigravity and run [Uninstall-Antigravity-RU.cmd](../../Uninstall-Antigravity-RU.cmd) (give them a clickable `file://` link).

## Switching Language Live (RU <-> EN)

Once installed, users can switch between Russian and English at any time without restarting:
- Hotkey: `Ctrl+Alt+L`
- Top menu: **Вид -> Язык интерфейса** (**View -> Interface Language**)
- System tray icon context menu
