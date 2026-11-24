# Antigravity RU — полный перевод интерфейса Antigravity 2.0

Полная качественная русификация **Antigravity 2.0** (более **4 017** переведённых строк интерфейса, **471** динамическое правило со склонениями, перевод нативного верхнего меню, трея, контекстных меню по правому клику и системных диалогов) с переключением **RU ↔ EN на лету** по `Ctrl+Alt+L` и безопасным откатом в 1 клик.

### Что нового в v2.1.0
- Переведён раздел **Модели и использование**: квоты, остатки лимитов (`Weekly Limit Remaining`, `Five Hour Limit Remaining` и таймеры обновления со склонениями), перерасход AI-кредитов, уведомления об обновлении тарифа.
- Переведены настройки чатов вне проектов, все оставшиеся шаблоны React UI и выбор усилий моделей в нижней панели (`Gemini 4 Neon Сверхвысокий`).
- Исправлена защита от избыточного перевода: корректное определение `[data-markdown-root]` (ответы агента и артефакты не искажаются) и защита технических идентификаторов навыков (`automation`, `plugin`, `browser` и др.).
- Добавлена локализация оставшихся диалогов Electron (сведения о сертификате и подключении, выбор Passkey, диалоги SSH-подключения).

---

## Быстрая установка

### Способ 1 — Автоматическая установка в 1 команду (рекомендуется, Git и Node.js не нужны)

Откройте PowerShell на Windows и выполните:

```powershell
irm https://raw.githubusercontent.com/Ivan0967pro/antigravity-ru/main/install.ps1 | iex
```

Скрипт сам скачает плагин, зарегистрирует его в `%USERPROFILE%\.gemini\config\plugins\antigravity-ru`, переведёт интерфейс Antigravity и перезапустит приложение сразу на русском языке.

> Если хотите только установить плагин без немедленного патча интерфейса, перед запуском выполните:
> ```powershell
> $env:AGY_RU_PLUGIN_ONLY = '1'; irm https://raw.githubusercontent.com/Ivan0967pro/antigravity-ru/main/install.ps1 | iex
> ```

### Способ 2 — Через Antigravity CLI (`agy`)

```bash
agy plugin install https://github.com/Ivan0967pro/antigravity-ru
```

После установки откройте Antigravity, выберите плагин **Antigravity RU** в **Customizations → Installed** (или напишите в чат):
> **Переведи интерфейс Antigravity на русский язык**

### Способ 3 — Вручную (архив ZIP / в 1 клик)

1. Скачайте репозиторий как ZIP (**Code → Download ZIP**) и распакуйте в любую папку.
2. Дважды нажмите **`Install-Antigravity-RU.cmd`**.
3. Скрипт сам найдёт установленный Antigravity, переведёт интерфейс, зарегистрирует плагин в `%USERPROFILE%\.gemini\config\plugins\antigravity-ru` и перезапустит Antigravity сразу на русском языке.

> *Примечание:* если запускаете перевод через чат внутри уже открытого Antigravity на Windows, файл `resources\app.asar` занят системой — агент создаст скрипт активации и даст на него ссылку, чтобы завершить применение перевода и перезапустить приложение.

---

## Переключение языка RU ↔ EN и откат

- **На лету (без перезапуска)**: `Ctrl+Alt+L`, пункт **Язык интерфейса: Русский (RU / EN)** в верхнем меню **Вид**, либо в меню значка в трее.
- **Полный откат на оригинальный английский**: дважды нажмите **`Uninstall-Antigravity-RU.cmd`** или попросите агента Antigravity *«Удали русификацию Antigravity»*.

---

## Структура плагина

- `install.ps1` — PowerShell-установщик в 1 команду для Windows.
- `plugin.json` — манифест плагина Antigravity 2.0 с логотипом `assets/logo.svg`, метаданными и быстрыми подсказками.
- `LICENSE` — лицензия MIT.
- `Install-Antigravity-RU.cmd` / `Uninstall-Antigravity-RU.cmd` — локальные установщик и деинсталлятор в 1 клик.
- `skills/antigravity-ru/SKILL.md` — инструкция навыка для агента Antigravity.
- `skills/antigravity-ru/resources/` — словарь (`dictionary-ru.json`), правила динамического форматирования (`dynamic-rules-ru.js`) и DOM-локализатор (`dom-translator.js`).
- `skills/antigravity-ru/scripts/` — автономные скрипты установки (`install-ru.js`), удаления (`uninstall-ru.js`) и патчер Electron-оболочки (`electron-shell-ru.js`).
