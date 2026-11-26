---
name: rudex
description: >-
  Устанавливает, обновляет, проверяет или удаляет Rudex 5.0 — студию кастомизации и апгрейд
  Google Antigravity 2.0 (стили интерфейса Claude Code / Codex / OpenCode, обновлённая 6-раздельная
  Studio с живым предпросмотром, темы, шрифты, обои, живые лимиты, TPS и индикатор контекста модели,
  правки на лету с карандашом, черновики, Пульт агента, Мастерская AGY, а также полная русификация
  и бесплатный перевод мыслей). Используйте, когда просят установить или обновить Rudex, перевести
  Antigravity на русский, проверить статус или вернуть оригинал.
---

# Rudex 5.0 — студия кастомизации, стили UI, живые лимиты и русификация Antigravity 2.0

Ставит панель **Rudex Studio** и русификацию в **Google Antigravity 2.0** через [install.js](./scripts/install.js) и полностью удаляет её через [uninstall.js](./scripts/uninstall.js).

## Основные функции скилла

- **4 стиля UI, темы, 4 слота шрифтов, обои и «Прицел»** — структурные стили платформ (**Antigravity**, **Claude Code**, **OpenAI Codex**, **OpenCode**) с Mix & Match и пресетами в 1 клик, 14+ светлых и тёмных тем, синхронизация кнопок окна Windows, 4 слота шрифтов (+ системные шрифты Windows), студия обоев (фото/видео/градиенты, пресет «Оригинал» с полным сбросом кадрирования) и «Прицел» (`Ctrl+Alt+E`) для настройки и переименования любых элементов.
- **Динамические лимиты Antigravity, TPS и контекст модели** — встроенное или плавающее окно квот (`5ч / Неделя` + тикающий таймер сброса + автообновление по шагам чата), просмотр лимитов по клику на модель даже во время работы агента, опциональный индикатор контекстного окна выбранной модели прямо в чате (выключен по умолчанию) и экспорт чата в ZIP.
- **Черновики, история 20 сообщений и правки на лету с карандашом** — автосохранение текста и прикреплённых файлов по чатам, история последних 20 сообщений с копированием текста и файлов, отправка правок агенту без остановки генерации и аннотатор скриншотов.
- **Обновлённая Rudex Studio, «Пульт агента» и «Мастерская AGY»** — 6 логических разделов с неблокирующей живой боковой панелью, контрастный чип инструментов над чатом, пресеты возможностей, визуальный менеджер Rules / Skills / MCP / Hooks, 16 настраиваемых хоткеев, JSON-бекап профиля и пункт Rudex прямо в основных настройках Antigravity.
- **Полный русский интерфейс и бесплатный перевод мыслей** — 4065+ записей словаря и 479 динамических правил, мгновенное переключение `RU ↔ EN` по `Ctrl+Alt+L` без перезапуска и бесплатный перевод размышлений агента без расхода токенов и лимитов моделей.
- **Автообновления** — сам находит новую версию на GitHub (включая плавный переход с v4.x на v5.0.0 с сохранением всех настроек), не слетает после обновления Antigravity, а при удалении возвращает всё как было.

## Critical Safety Rules

1. **NEVER terminate or kill `Antigravity.exe` during an agent turn** — doing so kills the active conversation before you can reply.
2. When running from a script that creates an activator (e.g. `Rudex-Apply-Restart.cmd`), present a clickable `file://` link so the user can double-click it after reading your reply.

## Choosing the JS Runtime

Check if `node` is available on `PATH`. If Node.js is **not** installed, Antigravity's own binary supports `ELECTRON_RUN_AS_NODE=1`:

- **With Node.js:**
  `node "<skill_dir>/scripts/install.js"`
- **Without Node.js (Windows PowerShell / cmd):**
  Always redirect output to a log file so `cmd` waits synchronously for the GUI binary:
  `cmd /c "set ELECTRON_RUN_AS_NODE=1 && ""%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"" ""<skill_dir>/scripts/install.js"" > ""%TEMP%\rudex_op.log"" 2>&1" && type "%TEMP%\rudex_op.log"`

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
