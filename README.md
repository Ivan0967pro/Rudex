<div align="center">
  <img src="./assets/logo.svg" alt="Rudex Logo" width="84" height="84" />
  <h1>Rudex</h1>
  <p><strong>Русификатор и настройка внешнего вида для Google Antigravity 2.0</strong></p>

  <p>
    <img src="https://img.shields.io/badge/version-4.2.2-0a84ff?style=flat-square" alt="Version 4.2.2" />
    <img src="https://img.shields.io/badge/Antigravity-2.0-6366f1?style=flat-square" alt="Google Antigravity 2.0" />
    <img src="https://img.shields.io/badge/locale-RU%20%E2%86%94%20EN-22c55e?style=flat-square" alt="RU / EN" />
    <img src="https://img.shields.io/badge/license-MIT-94a3b8?style=flat-square" alt="MIT License" />
  </p>
</div>

---

## Быстрая установка и обновление в 1 команду (Windows PowerShell)

Откройте **Windows PowerShell** и выполните:

```powershell
irm https://raw.githubusercontent.com/Ivan0967pro/Rudex/main/install.ps1 | iex
```

Скрипт сам скачает свежую версию **Rudex**, установит или обновит плагин в `%USERPROFILE%\.gemini\config\plugins\rudex`, пропатчит интерфейс и перезапустит Antigravity. Все ваши настройки, темы, обои, характеры чатов, статистика TPS и квоты сохраняются в `%APPDATA%\Antigravity\`.

---

## Что умеет Rudex

| | Функция | Что даёт |
| :-- | :--- | :--- |
| 🇷🇺 | **Русский интерфейс** | Всё приложение на русском: меню, настройки, диалоги, трей. Переключение `RU ↔ EN` в один клик, без перезапуска. |
| 🧠 | **Мысли агента на русском** | Агент думает и показывает свои размышления на русском языке. |
| 🎨 | **Оформление** | Готовые темы или свои цвета, обои (картинка, видео, градиент), скругление углов, своё приветствие в новом чате. |
| 📊 | **Монитор скорости и квот** | Небольшой виджет в углу: скорость ответа (TPS) и остаток лимитов по моделям Gemini, Claude и GPT. |
| 💬 | **Характер чата** | Для каждого чата свой стиль общения агента, соседние чаты не затрагиваются. |
| 📦 | **Экспорт в ZIP** | Чат вместе с файлами и артефактами одним архивом. |
| 🔄 | **Автообновления** | Rudex сам находит и ставит новую версию, не слетает после обновления Antigravity и полностью откатывается при удалении. |

Все настройки открываются в окне **Rudex Studio** — `Ctrl+Alt+P` или клик по виджету.

---

## Горячие клавиши

| Сочетание | Действие |
| :--- | :--- |
| `Ctrl + Alt + P` | Открыть / закрыть окно **Rudex Studio** |
| `Ctrl + Alt + L` | Мгновенное переключение языка интерфейса (`RU` ↔ `EN`) |
| `Клик по виджету` | Открыть / развернуть **Rudex Studio** |

---

## Локальная установка и удаление

Если репозиторий уже клонирован (`git clone https://github.com/Ivan0967pro/Rudex.git`):

- **Установка / обновление:** запустите **[`Install-Rudex.cmd`](./Install-Rudex.cmd)** или `powershell -ExecutionPolicy Bypass -File .\install.ps1 -RestartApp`.
- **Полное удаление:** удалите плагин **Rudex** в интерфейсе Antigravity и перезапустите приложение, либо запустите **[`Uninstall-Rudex.cmd`](./Uninstall-Rudex.cmd)** / `powershell -ExecutionPolicy Bypass -File .\install.ps1 -Uninstall -RestartApp`.

---

## Что нового в v4.2.2

- Виджет и окно Studio теперь в тех же цветах, что и сам Antigravity.
- Новый градиент обоев «Antigravity» — стоит по умолчанию.
- Описание проекта переписано коротко и по делу.
