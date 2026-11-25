---
name: rudex
description: >-
  Устанавливает, обновляет, проверяет или удаляет Rudex — русификатор Google Antigravity 2.0
  с панелью настроек Rudex Studio (темы, обои, монитор скорости и квот, экспорт чатов).
  Используйте, когда просят перевести Antigravity на русский, проверить статус Rudex
  или вернуть английский интерфейс.
---

# Rudex — русский язык и оформление для Antigravity 2.0

Ставит русификацию и панель **Rudex Studio** в **Google Antigravity 2.0** через [install.js](./scripts/install.js) и полностью удаляет её через [uninstall.js](./scripts/uninstall.js).

## Основные функции скилла

- **Русский интерфейс** — переводит всё приложение: меню, настройки, тултипы, таймеры, диалоги, трей. Язык переключается на лету (`Ctrl+Alt+L`), без перезапуска.
- **Мысли агента на русском** — агент рассуждает и показывает свои размышления на русском.
- **Оформление, 4 слота шрифтов, обводки и «Прицел»** — готовые темы (включая Claude Code / Anthropic), чёткие границы блоков по умолчанию, раздельные шрифты для интерфейса / ввода / агента / кода + системные шрифты Windows, визуальный выбор любого элемента (`Ctrl+Alt+E`) с изменением размеров, цветов, шрифтов, скрытием и переименованием элементов.
- **Окно «Только лимиты Antigravity» и монитор TPS** — отдельный полностью настраиваемый экранный виджет квот (`5ч / Неделя`), монитор скорости и экспорт чата в ZIP.
- **«Пульт агента» и правки на лету прямо из чата** — пресеты возможностей (субагенты, веб-поиск, браузер, авто-тесты, Read-Only через `PreToolUse`), дефолт для новых чатов, характер чата и отправка правок агенту без прерывания работы прямо из поля ввода.
- **«Мастерская AGY», горячие клавиши и интеграция в Настройки** — визуальный менеджер Rules / Skills / MCP / Hooks, 16 настраиваемых хоткеев, JSON-бекап профиля и пункт Rudex прямо в основных настройках Antigravity.
- **Автообновления** — сам находит новую версию на GitHub, не слетает после обновления Antigravity, а при удалении возвращает всё как было.

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
