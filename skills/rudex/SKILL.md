---
name: rudex
description: >-
  Устанавливает, обновляет, проверяет или удаляет Rudex 5.0 — студию кастомизации
  и русификатор для Google Antigravity 2.0 на Windows, macOS и Linux (стили UI, темы,
  живые лимиты, правки на лету, перевод интерфейса и мыслей). Используйте, когда просят
  установить/обновить Rudex, перевести Antigravity на русский, проверить статус или вернуть оригинал.
---

# Rudex 5.0 — кастомизация, стили UI, живые лимиты и русификация Antigravity 2.0

Ставит панель **Rudex Studio** и русификацию в **Google Antigravity 2.0** (Windows 10/11, macOS, Linux) через [install.js](./scripts/install.js) и полностью удаляет её через [uninstall.js](./scripts/uninstall.js).

## Основные функции скилла

- **Русификация и перевод мыслей** — 4065+ строк словаря, 479 динамических правил, мгновенное переключение `RU ↔ EN` (`Ctrl+Alt+L`) и бесплатный перевод мыслей агента без траты токенов.
- **Стили UI и оформление** — стили **Antigravity**, **Claude Code**, **OpenAI Codex**, **OpenCode**, 14+ тем, 4 слота шрифтов, студия обоев и визуальный редактор «Прицел» (`Ctrl+Alt+E`).
- **Живые лимиты и уведомления** — виджет квот (Неделя выше / 5ч ниже + таймер сброса), уведомления на рабочий стол о восстановлении квот (включая закрытое приложение) и опциональное автопродолжение.
- **Правки на лету и черновики** — отправка дополнений без остановки ответа агента, аннотатор скриншотов, автосохранение черновиков и история 20 сообщений.
- **Пульт агента, Мастерская AGY и защита патчей** — управление Rules / Skills / MCP / Hooks, 16 хоткеев, автовосстановление после обновлений Antigravity и сторонних патчеров `app.asar`.

## Critical Safety Rules

1. **NEVER terminate or kill Antigravity during an agent turn** — doing so kills the active conversation before you can reply.
2. When running on Windows creates an activator (e.g. `Rudex-Apply-Restart.cmd`), present a clickable `file://` link so the user can double-click it after reading your reply.

## Choosing the JS Runtime

Check if `node` is available on `PATH`. If Node.js is **not** installed, Antigravity's own binary supports `ELECTRON_RUN_AS_NODE=1` alongside `ELECTRON_NO_ASAR=1`:

- **With Node.js (Windows / macOS / Linux):**
  `node "<skill_dir>/scripts/install.js"`
- **Without Node.js (Windows PowerShell / cmd):**
  `cmd /c "set ELECTRON_RUN_AS_NODE=1 && set ELECTRON_NO_ASAR=1 && ""%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"" ""<skill_dir>/scripts/install.js"" > ""%TEMP%\rudex_op.log"" 2>&1" && type "%TEMP%\rudex_op.log"`
- **Without Node.js (macOS / Linux):**
  - macOS: `ELECTRON_RUN_AS_NODE=1 ELECTRON_NO_ASAR=1 "/Applications/Antigravity.app/Contents/MacOS/Antigravity" "<skill_dir>/scripts/install.js"`
  - Linux: `ELECTRON_RUN_AS_NODE=1 ELECTRON_NO_ASAR=1 /usr/bin/antigravity "<skill_dir>/scripts/install.js"`
- **One-line shell wrappers:** `install.ps1` (Windows) and `install.sh` / `uninstall.sh` (macOS & Linux, handles `sudo` cleanly while keeping plugin ownership under the user's `$HOME`).

*(Use forward slashes for clickable links shown to the user, and quotes for paths with spaces.)*

## Operations

### 1. Install or Update Rudex

Run [install.js](./scripts/install.js):

- Look for `STATUS=` in stdout:
  - **`STATUS=ACTIVATED`**: `app.asar` is already backed up and Rudex is staged/active. Tell the user to simply restart Antigravity once.
  - **`STATUS=LOCKED_NEEDS_ACTIVATOR`**: On Windows, `app.asar` is locked while Antigravity is running. Read `ACTIVATOR_PATH=<path>` from output and give the user a clickable `file://` link to that `.cmd` file explaining that double-clicking it closes Antigravity, activates Rudex, and relaunches it.
- Pass `--app-dir <path>` only if Antigravity is installed in a non-standard directory and auto-detection fails.
- To verify without modifying files first, run with `--dry-run`.

### 2. Check Localization Status

Run [install.js](./scripts/install.js) with `--status`. Report `activeMode`, installed version/stamp, dictionary size, and current locale (`ru` or `en` from `localeState`).

### 3. Remove Rudex / Restore English

Run [uninstall.js](./scripts/uninstall.js). It restores `app.asar.orig-*` -> `app.asar` first, cleans active runtime flags/rules, and then removes `resources/app`.
If `STATUS=LOCKED_NEEDS_CLOSE` is reported because Antigravity is currently running on Windows, guide the user to close Antigravity and run [Uninstall-Rudex.cmd](../../Uninstall-Rudex.cmd) (give them a clickable `file://` link).

## Switching Language Live (RU <-> EN)

Once installed, users can switch between Russian and English at any time without restarting:
- Hotkey: `Ctrl+Alt+L`
- Top menu: **Вид -> Язык интерфейса** (**View -> Interface Language**)
- System tray icon context menu
- Rudex Studio widget pill (`RU` / `EN`)
