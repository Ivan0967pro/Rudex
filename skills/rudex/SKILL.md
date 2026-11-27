---
name: rudex
description: >-
  Устанавливает, обновляет, проверяет или удаляет Rudex — кастомизацию интерфейса
  (обои, темы, «Прицел»), быстрый офлайн-голос, реальные лимиты, черновики и русификацию
  Google Antigravity 2.0 (Windows/macOS/Linux).
---

# Rudex — кастомизация, быстрый голос, лимиты и русификация Antigravity 2.0

Ставит панель **Rudex Studio** и русификацию в **Google Antigravity 2.0** (Windows 10/11, macOS, Linux) через [install.js](./scripts/install.js) и полностью удаляет её через [uninstall.js](./scripts/uninstall.js).

## Основные функции скилла

- **Кастомизация всего интерфейса под себя** — любые обои (фото, видео, градиенты), 15 тем, 4 слота шрифтов, скругления и «Прицел» (`Ctrl+Alt+E`), которым можно перекрасить, скрыть, переименовать или сдвинуть любой элемент прямо на экране (включая выделение области рамкой для нескольких окон сразу). Как бонус — готовые стили под Claude Code, Codex и OpenCode.
- **Русский язык везде** — полный перевод интерфейса (`4068+` строк и `485` правил), мгновенное переключение `RU ↔ EN` (`Ctrl+Alt+L`) и отдельные опциональные тумблеры перевода мыслей и шагов работы агента («Работал …») без траты токенов.
- **Исправленный быстрый голосовой ввод** — чинит багованную и медленную штатную диктовку: встроенная локальная офлайн-диктовка (**Sherpa-ONNX**, модели от 23 МБ включая `RU T-one Pro`) печатает слова сразу во время речи без зависаний на «анализе услышанного» (`Ctrl+Alt+V`).
- **Реальные лимиты на экране и уведомления** — настоящие проценты квот напрямую из Antigravity (Неделя / 5ч и таймер сброса, без догадок и `~`), уведомления на рабочий стол о восстановлении лимитов и опциональное автопродолжение чата.
- **Бессрочные черновики, правки на лету и скриншоты** — введённый текст и прикреплённые файлы сохраняются навсегда (не теряются даже при принудительном закрытии Antigravity и восстанавливаются мгновенно), история 20 сообщений, правки агенту без остановки его ответа и рисование прямо на скриншотах.
- **Пульт агента, Мастерская и ускорение ПК** — управление Rules / Skills / MCP / Hooks, 18 хоткеев, опциональное ускорение `language_server` / кэша и плавные анимации, плюс автовосстановление патча после обновлений Antigravity.

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

### 2b. Performance, Cache Diagnostics & Safe Cleanup

- Run [install.js](./scripts/install.js) with `--diagnostics` to report `language_server` CPU threads, Prompt Cache Hit Rate %, Chromium/Partitions cache sizes, `app_storage.json` stale layout keys, and Local Instant Voice readiness.
- Run [install.js](./scripts/install.js) with `--clean-cache` to safely purge regenerable temp caches and compact stale layout entries in `app_storage.json` (never deletes chats, cookies, or credentials).
- Run [install.js](./scripts/install.js) with `--install-voice` (or `--install-voice=ru-tone` / `ru-hq` / `multi-ru-en` / `en-fast`) to pre-install the local Sherpa-ONNX instant streaming voice engine (~52 MB for `ru-fast`, ~152 MB for `ru-tone` T-one Pro 80Kh Russian).

### 3. Remove Rudex / Restore English

Run [uninstall.js](./scripts/uninstall.js). It restores `app.asar.orig-*` -> `app.asar` first, cleans active runtime flags/rules, and then removes `resources/app`.
If `STATUS=LOCKED_NEEDS_CLOSE` is reported because Antigravity is currently running on Windows, guide the user to close Antigravity and run [Uninstall-Rudex.cmd](../../Uninstall-Rudex.cmd) (give them a clickable `file://` link).

## Switching Language Live (RU <-> EN)

Once installed, users can switch between Russian and English at any time without restarting:
- Hotkey: `Ctrl+Alt+L`
- Top menu: **Вид -> Язык интерфейса** (**View -> Interface Language**)
- System tray icon context menu
- Rudex Studio widget pill (`RU` / `EN`)
