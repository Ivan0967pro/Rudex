---
name: rudex
description: >-
  Устанавливает, обновляет, проверяет статус или удаляет Rudex — полную русификацию
  интерфейса Google Antigravity 2.0 (RU <-> EN) и встроенную панель Rudex Studio:
  темы оформления (включая Жидкое стекло), интерактивную студию фото/видео/градиентных
  обоев, конструктор скругления углов, кастомное приветствие нового чата, переключение
  мыслей агента на русский язык, характер чата, монитор TPS и квот, экспорт диалогов
  в ZIP и автообновления. Используйте при запросах на перевод Antigravity на русский,
  проверку статуса Rudex или возврат английского интерфейса.
---

# Rudex (Русификация и Студия оформления для Antigravity 2.0)

Устанавливает русификацию и панель **Rudex Studio** в клиент **Google Antigravity 2.0** с помощью [install.js](./scripts/install.js), а также чисто удаляет патч через [uninstall.js](./scripts/uninstall.js).

## Основные функции скилла

- **Полная русификация интерфейса (`RU <-> EN`)** — перевод меню, боковой панели, контекстных меню, трея и системных диалогов по словарю (4 000+ записей) и 474 динамическим правилам с мгновенным переключением без перезапуска.
- **Темы оформления и стекло** — 11+ готовых тем (включая *Жидкое стекло*, *Обсидиановое стекло*, *Полуночный неон*, *Токийская ночь*, *Светлая бумага* и *Своя тема*), независимый выбор акцента, настройка прозрачности панелей/сайдбара, размытия и режима живого предпросмотра **«Справа · Обзор»**.
- **Интерактивная студия обоев и конструктор углов** — фото, видео (MP4/WebM) и анимированные линейные/радиальные/меш-градиенты с живым кадрированием мышкой, зумом, цветокоррекцией и пресетами атмосферы; раздельная или единая настройка скругления углов (`0–28px`) для всех элементов интерфейса.
- **Кастомизация Rudex Studio и виджета** — мини-капсула (S) и карточка телеметрии (M), 5 дизайнов виджета (*Жидкое стекло*, *Dynamic Island*, *Неоновый HUD*, *Невесомый*, *Контрастный монолит*), 5 тем и 4 раскладки окна Студии, а также конструктор приветствия нового чата (`{name}`, `{time}`, `{date}`, `{weekday}`).
- **Мысли агента на русском** — живой перевод блоков размышлений (`thinking`) в интерфейсе и переключение внутреннего потока рассуждений агента на русский язык.
- **Характер чата (Per-Chat Persona)** — независимые правила стиля общения для каждого диалога через хуки `SessionStart` / `PreInvocation` и `AGENTS.md`.
- **Монитор TPS, квоты и экспорт в ZIP** — точный замер скорости генерации и контекста, учёт 5-часовых и недельных лимитов моделей (Gemini / Claude / GPT) и выгрузка чата с вложениями и артефактами в ZIP.
- **Автообновления и защита от апдейтов Antigravity** — проверка обновлений на GitHub с резервным Atom-фидом, установка в 1 клик, автоматическое восстановление патча после обновлений самого Antigravity и автооткат при удалении плагина.

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
