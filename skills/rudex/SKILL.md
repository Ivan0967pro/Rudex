---
name: rudex
description: >-
  Устанавливает, обновляет, проверяет или удаляет Rudex 5.5 — студию кастомизации
  и русификатор для Google Antigravity 2.0 на Windows, macOS и Linux (стили UI, 15 тем,
  «Прицел» с выделением области и расположением, реальные лимиты моделей, моментальные
  бессрочные черновики, офлайн-диктовка Sherpa-ONNX, правки на лету и перевод интерфейса,
  мыслей и шагов работы агента). Используйте, когда просят установить/обновить Rudex,
  перевести Antigravity на русский, проверить статус или вернуть оригинал.
---

# Rudex 5.5 — кастомизация, стили UI, реальные лимиты, офлайн-голос и русификация Antigravity 2.0

Ставит панель **Rudex Studio** и русификацию в **Google Antigravity 2.0** (Windows 10/11, macOS, Linux) через [install.js](./scripts/install.js) и полностью удаляет её через [uninstall.js](./scripts/uninstall.js).

## Основные функции скилла

- **Русификация, перевод мыслей и хода работы** — 4068+ строк словаря, 485 динамических правил, мгновенное переключение `RU ↔ EN` (`Ctrl+Alt+L`), 0-кадровый старт темы без мерцания и раздельные опциональные тумблеры перевода мыслей (`thinkingInRussian`) и шагов работы «Работал …» (`workLogInRussian`) без траты токенов (Google Translate или локальный LibreTranslate на `127.0.0.1`).
- **Стили UI, 15 тем и «Прицел» v5.5** — стили **Antigravity**, **Claude Code**, **OpenAI Codex**, **OpenCode**, 15 тем, 4 слота шрифтов, студия обоев и визуальный «Прицел» (`Ctrl+Alt+E`) без утечки стилей на соседние элементы, с выделением области рамкой (синхронная правка 2+ окон), живой подсветкой всех совпадений и точным блоком «Расположение» (D-pad, выравнивание и перетаскивание мышью).
- **Точные лимиты Antigravity и уведомления** — виджет реальных квот напрямую из RPC/Настроек Antigravity (Неделя выше / 5ч ниже + таймер сброса, без локальных догадок и `~`), уведомления на рабочий стол о восстановлении квот (опционально и при закрытом приложении) и автопродолжение.
- **Моментальные бессрочные черновики, правки на лету и аннотатор** — мгновенное (0 мс) восстановление текста и прикреплённых файлов/скриншотов после перезапуска или принудительного закрытия Antigravity (бессрочно, до 500 чатов), история 20 сообщений, правки на лету без остановки агента и аннотатор скриншотов с визуальным сопоставлением миниатюр.
- **Пульт агента, Мастерская AGY и защита патчей** — управление Rules / Skills / MCP / Hooks, 18 хоткеев (включая `Ctrl+Alt+V` для диктовки), нулевой оверхед динамического `PreToolUse`, проверка SHA-256 релизов и автовосстановление после обновлений Antigravity и сторонних патчеров `app.asar`.
- **Голосовой ввод (Voice Dictation Pro + Local Instant Sherpa-ONNX)** — встроенный локальный потоковый движок **Sherpa-ONNX** (C++ WebSocket-сервер на `127.0.0.1`, модели от 23 МБ: `ru-fast`, `ru-hq`, `multi-ru-en`, `en-fast`), который печатает слова прямо в процессе речи (~100 мс) и финализирует запись за **~8–50 мс** без облачного ожидания и «анализа услышанного», плюс кэшированный DSP AudioWorklet (HPF 80 Гц + Butterworth LPF 7.2 кГц + AGC), фикс Windows WASAPI, хоткей `Ctrl+Alt+V` и fallback в улучшенный облачный режим с `languageCodes`.
- **Ускорение агентов Gemini, файлов ПК и кэша** — снятие лимита 4 потоков у `language_server` (автоподбор `GOMAXPROCS`, `file_watch_max_dir_count=32768`, `max_num_tracked_workspaces=24`, `GOMEMLIMIT`, `UV_THREADPOOL_SIZE`), кэш-стабильный `SessionStart`-протокол работы с файлами и Prompt Cache, RAM-кэш `StorageManager`, лимит HTTP-кэша Chromium (100 МБ), живая метрика Prompt Cache Hit % и безопасная очистка кэшей / сжатие `app_storage.json`.
- **Плавные GPU-анимации 60–144 FPS** — 4 режима кривых (`smooth`/`snappy`/`reduced`/`native`), замена `transition: all` на безопасные GPU-свойства, изоляция слоёв чата (`contain: layout style`), пауза фоновых анимаций при свёрнутом окне и GPU-растеризация Electron.

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
