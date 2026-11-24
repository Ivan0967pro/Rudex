"use strict";

const BUILTIN_PERSONA_PRESETS = [
  {
    id: "concise",
    titleRu: "Лаконичный профи",
    titleEn: "Concise Pro",
    descRu: "Короткие ответы по сути, без воды и лишних вступлений",
    descEn: "Short, direct answers with no filler",
    body: [
      "# Стиль ответа",
      "- Отвечай максимально сжато и по делу, сразу к коду и решению.",
      "- Не повторяй вопрос пользователя и не пиши длинных вступлений.",
      "- Если есть несколько вариантов, назови лучший и кратко обоснуй.",
    ].join("\n"),
  },
  {
    id: "architect",
    titleRu: "Сеньор-архитектор",
    titleEn: "Senior Architect",
    descRu: "Структурный разбор, крайние случаи, надёжность и чистота кода",
    descEn: "Design rigor, edge cases, and clean structure",
    body: [
      "# Инженерный стандарт",
      "- Перед правками оценивай влияние на архитектуру и сопутствующие модули.",
      "- Явно фиксируй допущения, граничные случаи и потенциальные риски.",
      "- Предпочитай простые, поддерживаемые решения без дублирования логики.",
    ].join("\n"),
  },
  {
    id: "mentor",
    titleRu: "Наставник",
    titleEn: "Mentor",
    descRu: "Понятные пошаговые объяснения, чтобы быстро разобраться в теме",
    descEn: "Clear step-by-step explanations and takeaways",
    body: [
      "# Формат наставника",
      "- Объясняй ключевые шаги простым и понятным языком с примерами.",
      "- Поясняй не только что меняется, но и почему выбран такой подход.",
      "- В конце давай краткую сводку, что важно запомнить.",
    ].join("\n"),
  },
  {
    id: "strict-ru",
    titleRu: "Строгий RU",
    titleEn: "Strict Russian",
    descRu: "Вся коммуникация на чистом русском, код и символы в оригинале",
    descEn: "Russian explanations with exact code identifiers",
    body: [
      "# Языковой режим",
      "- Всегда отвечай на грамотном, естественном русском языке.",
      "- Имена файлов, функций, переменных, команд CLI и пути оставляй в точном оригинале.",
      "- Не переводи англоязычные термины неестественными кальками, если в разработке принят оригинал.",
    ].join("\n"),
  },
  {
    id: "qa",
    titleRu: "Критик и ревьюер",
    titleEn: "Strict Reviewer",
    descRu: "Поиск багов, регрессий, слабых мест и обязательная проверка фактов",
    descEn: "Find bugs, regressions, and verify every claim",
    body: [
      "# Фокус на проверке",
      "- Относись к любому решению скептически: ищи регрессии, утечки и ошибки обработки сбоев.",
      "- Проверяй крайние состояния, права доступа, таймауты и пустые входные данные.",
      "- Отделяй подтверждённые тестами факты от предположений.",
    ].join("\n"),
  },
];

const MAX_PERSONA_BODY_BYTES = 23500;
const DOCK_POSITIONS = ["bottom-right", "top-right", "middle-right", "bottom-left", "hidden"];
const MINI_FIELD_KEYS = ["status", "lang", "tps", "respTokens", "chatTokens", "model"];
const DEFAULT_MINI_FIELDS = {
  status: true,
  lang: true,
  tps: true,
  respTokens: false,
  chatTokens: false,
  model: false,
};

const ICON_PATHS = {
  grip: '<circle cx="9" cy="6" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.15" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.15" fill="currentColor" stroke="none"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  expand: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
  minimize: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".75" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".75" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".75" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".75" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
};

const TEXT = {
  ru: {
    brandTitle: "Antigravity Studio",
    brandSub: "Панель управления и телеметрия",
    modalTitleMonitor: "Монитор генерации",
    modalSubMonitor: "Живая оценка скорости (TPS) и расхода токенов в активном чате",
    modalTitleWidget: "Виджет на экране",
    modalSubWidget: "Настройте компактную капсулу, поля и привязку к краю окна",
    modalTitlePersona: "Характер агента",
    modalSubPersona: "Индивидуальная инструкция для активного чата (со следующего сообщения)",
    modalTitleLanguage: "Язык и перевод",
    modalSubLanguage: "Переключение интерфейса Antigravity без перезапуска и горячие клавиши",
    modalTitleAppearance: "Оформление",
    modalSubAppearance: "Предпросмотр возможностей Этапа 2: темы, обои чата и типографика",
    navMonitor: "Монитор",
    navWidget: "Виджет",
    navPersona: "Характер агента",
    navLanguage: "Язык и перевод",
    navAppearance: "Оформление",
    stage2Pill: "Этап 2",
    statusReady: "Готов",
    statusWriting: "Генерация",
    phaseThinking: "Думает...",
    phaseIdle: "Ожидание ответа",
    phaseLive: "Идёт генерация",
    kpiTps: "Скорость потока",
    kpiPeak: "Пиковая скорость",
    kpiResp: "Последний ответ",
    kpiChat: "Объём чата",
    tpsUnit: "TPS",
    avgPrefix: "ср.",
    chatScopeNew: "Новый чат · по умолчанию",
    chatScopeNamed: "Чат:",
    chatScopeHint: "Характер и статистика TPS сохраняются отдельно для этого чата; новые чаты начинаются с чистого листа.",
    tokShort: "ток.",
    peakLabel: "Пик",
    respLabel: "Ответ",
    chatLabel: "Чат",
    modelUnknown: "Модель не определена",
    sparkTitle: "График скорости (последние замеры)",
    resetStats: "Сбросить",
    historyTitle: "История последних ответов",
    historyEmpty: "Пока нет завершённых замеров в этой сессии. Запустите запрос, чтобы увидеть статистику.",
    historyOff: "Запись истории отключена в настройках виджета.",
    turnsCount: "замеров",
    previewTitle: "Живой предпросмотр мини-капсулы",
    previewSub: "Показывает точный вид компактного виджета при текущих переключателях",
    modeTitle: "Формат плавающего виджета",
    modeMiniTitle: "Мини-капсула (S)",
    modeMiniDesc: "Узкая полупрозрачная пилюля без лишнего шума",
    modeMedTitle: "Карточка с графиком (M)",
    modeMedDesc: "TPS-график, счётчики токенов и активный характер",
    fieldsTitle: "Элементы в мини-капсуле",
    fieldStatus: "Индикатор состояния",
    fieldStatusDesc: "Точка активности и фаза работы агента",
    fieldLang: "Кнопка языка RU / EN",
    fieldLangDesc: "Мгновенное переключение перевода в один клик",
    fieldTps: "Скорость (TPS)",
    fieldTpsDesc: "Живая сглаженная скорость токенов в секунду",
    fieldResp: "Токены ответа",
    fieldRespDesc: "Оценка длины последнего ответа модели",
    fieldChat: "Контекст / объём чата",
    fieldChatDesc: "Индикатор контекста или оценка всего диалога",
    fieldModel: "Название модели",
    fieldModelDesc: "Текущая выбранная модель агента",
    trackHistoryLabel: "Сохранять историю замеров",
    trackHistoryDesc: "Фиксировать среднюю и пиковую скорость завершённых ответов",
    dockTitle: "Расположение и перетаскивание",
    pinLockLabel: "Закрепить на месте",
    pinLockDesc: "Запрещает перетаскивание; настройки открываются в 1 клик по виджету",
    dockStateDocked: "Режим: прикреплён к якорю",
    dockStateFloating: "Режим: свободная позиция (X/Y)",
    dockStateLocked: " · зафиксирован на месте",
    dockResetBtn: "Вернуть к якорю",
    dockBottomRight: "Правый низ",
    dockTopRight: "Правый верх",
    dockMiddleRight: "Правая середина",
    dockBottomLeft: "Левый низ",
    dockHidden: "Скрыть виджет",
    dockHiddenHint: "Даже при скрытом виджете окно настроек всегда открывается по Ctrl+Alt+P.",
    personaMasterTitle: "Активировать характер в этом чате",
    personaMasterDesc: "Применяется только в текущем чате (при переходе в другой или новый чат переключается автоматически)",
    personaActiveTag: "Правило активно",
    personaOffTag: "Отключено",
    personaPresetsLabel: "Готовые пресеты и ваши шаблоны",
    personaCustomLabel: "Свой",
    personaEditorLabel: "Текст инструкции (Markdown)",
    personaBytes: "байт",
    personaSavePresetPlaceholder: "Название нового пресета...",
    personaAddPresetBtn: "Сохранить пресет",
    personaApplyBtn: "Применить и сохранить",
    personaClearBtn: "Очистить",
    personaRulePathLabel: "Файл правила:",
    personaSavedMsg: "Применено · правило активно (со следующего сообщения)",
    personaDisabledMsg: "Характер отключён (текст сохранён)",
    personaEmptyWarn: "Сначала введите текст инструкции или выберите пресет",
    personaWriteErr: "Не удалось записать файл правила",
    personaTooLargeErr: "Превышен лимит размера правила (23 500 байт)",
    personaClearedMsg: "Инструкция очищена",
    personaDeletedPreset: "Пресет удалён",
    personaLimitWarn: "Близко к лимиту правила (23 500 байт)",
    langCardsTitle: "Язык интерфейса Antigravity",
    langRuTitle: "Русский (RU)",
    langRuDesc: "Полный перевод меню, диалогов, панелей и настроек",
    langEnTitle: "English (EN)",
    langEnDesc: "Оригинальный англоязычный интерфейс по умолчанию",
    langActiveBadge: "Активен",
    hotkeysTitle: "Горячие клавиши и быстрые жесты",
    hkToggleLang: "Переключить язык интерфейса RU / EN",
    hkToggleModal: "Открыть / закрыть полное окно Studio",
    hkDoubleClick: "Открыть настройки по виджету",
    hkDoubleClickKey: "1 клик (закреплён) / 2 клика",
    hkEsc: "Закрыть окно настроек",
    pluginInfoTitle: "Сведения о плагине",
    pluginVersion: "Версия плагина",
    pluginDict: "Статических фраз в словаре",
    pluginRules: "Динамических правил",
    pluginRepo: "Репозиторий GitHub",
    stage2BannerTitle: "Что появится в Этапе 2 (Визуальная студия)",
    stage2BannerDesc: "Следующий крупный релиз расширит Studio полной кастомизацией внешнего вида всего интерфейса Antigravity с предпросмотром изменений до применения.",
    stage2ThemesTitle: "Темы и поверхности стекла",
    stage2ThemesDesc: "Готовые пресеты (Obsidian Glass, Midnight Neon, Compact Paper, Warm Contrast) и тонкая настройка акцента, прозрачности и рамок.",
    stage2WallsTitle: "Студия обоев для чатов",
    stage2WallsDesc: "Статичные изображения, многослойные анимированные градиенты, настройка размытия/затемнения и динамические видео-обои с превью-окном.",
    stage2FontsTitle: "Типографика и плотность UI",
    stage2FontsDesc: "Выбор шрифтов интерфейса и сообщений, межстрочного интервала и масштаба карточек чата.",
    tooltipExpand: "Развернуть в карточку (M)",
    tooltipMini: "Свернуть в мини-капсулу (S)",
    tooltipSettings: "Открыть полные настройки (Ctrl+Alt+P)",
    tooltipPinLock: "Закрепить на месте (открытие в 1 клик)",
    tooltipPinUnlock: "Открепить (разрешить перетаскивание)",
    tooltipLang: "Переключить RU / EN",
    tooltipClose: "Закрыть (Esc)",
    sidebarFooterHint: "Открыть настройки",
    personaBadgeOn: "Характер:",
    personaBadgeOff: "Характер выкл.",
    customPresetTitle: "Свой текст",
  },
  en: {
    brandTitle: "Antigravity Studio",
    brandSub: "Control center & live telemetry",
    modalTitleMonitor: "Generation Monitor",
    modalSubMonitor: "Live token throughput (TPS) and context size estimation",
    modalTitleWidget: "Floating Widget",
    modalSubWidget: "Configure compact capsule fields, mode, and edge docking",
    modalTitlePersona: "Agent Persona",
    modalSubPersona: "Per-chat agent persona instruction (active from next message in this chat)",
    modalTitleLanguage: "Language & UI",
    modalSubLanguage: "Switch Antigravity localization live without restarting",
    modalTitleAppearance: "Appearance",
    modalSubAppearance: "Stage 2 roadmap preview: UI themes, chat wallpapers, and fonts",
    navMonitor: "Monitor",
    navWidget: "Widget",
    navPersona: "Agent Persona",
    navLanguage: "Language & UI",
    navAppearance: "Appearance",
    stage2Pill: "Stage 2",
    statusReady: "Ready",
    statusWriting: "Writing",
    phaseThinking: "Thinking...",
    phaseIdle: "Idle",
    phaseLive: "Streaming response",
    kpiTps: "Stream speed",
    kpiPeak: "Peak speed",
    kpiResp: "Latest reply",
    kpiChat: "Chat context",
    tpsUnit: "TPS",
    avgPrefix: "avg",
    chatScopeNew: "New chat · default",
    chatScopeNamed: "Chat:",
    chatScopeHint: "Persona and TPS stats are stored per chat; every new chat starts clean at default.",
    tokShort: "tok",
    peakLabel: "Peak",
    respLabel: "Reply",
    chatLabel: "Chat",
    modelUnknown: "Model not detected",
    sparkTitle: "Throughput sparkline (recent ticks)",
    resetStats: "Reset",
    historyTitle: "Recent turn history",
    historyEmpty: "No completed turns recorded in this session yet.",
    historyOff: "Turn history tracking is disabled in Widget settings.",
    turnsCount: "turns",
    previewTitle: "Live Mini Capsule Preview",
    previewSub: "Updates instantaneously as you toggle capsule fields below",
    modeTitle: "Floating widget mode",
    modeMiniTitle: "Mini Capsule (S)",
    modeMiniDesc: "Slim frosted pill with zero visual clutter",
    modeMedTitle: "Telemetry Card (M)",
    modeMedDesc: "TPS sparkline, token estimates, and persona badge",
    fieldsTitle: "Visible Mini Capsule fields",
    fieldStatus: "Activity status",
    fieldStatusDesc: "Live pulse dot and generation state",
    fieldLang: "RU / EN switch",
    fieldLangDesc: "One-click UI language toggle",
    fieldTps: "Speed (TPS)",
    fieldTpsDesc: "Smoothed tokens per second readout",
    fieldResp: "Reply tokens",
    fieldRespDesc: "Estimated token length of latest reply",
    fieldChat: "Chat / context tokens",
    fieldChatDesc: "Context usage indicator or chat estimate",
    fieldModel: "Model name",
    fieldModelDesc: "Active agent model badge",
    trackHistoryLabel: "Record turn history",
    trackHistoryDesc: "Log average and peak TPS for recent completed replies",
    dockTitle: "Position & dragging",
    pinLockLabel: "Lock widget in place",
    pinLockDesc: "Disables dragging; 1 click on the widget opens Settings",
    dockStateDocked: "Layout: edge-docked",
    dockStateFloating: "Layout: free-floating (X/Y)",
    dockStateLocked: " · locked in place",
    dockResetBtn: "Snap to anchor",
    dockBottomRight: "Bottom right",
    dockTopRight: "Top right",
    dockMiddleRight: "Middle right",
    dockBottomLeft: "Bottom left",
    dockHidden: "Hidden",
    dockHiddenHint: "Even when hidden, press Ctrl+Alt+P anytime to open full settings.",
    personaMasterTitle: "Enable persona for this chat",
    personaMasterDesc: "Active only in this chat (switches automatically when changing chats or opening a new chat)",
    personaActiveTag: "Rule active",
    personaOffTag: "Disabled",
    personaPresetsLabel: "Built-in & saved presets",
    personaCustomLabel: "Custom",
    personaEditorLabel: "Instruction body (Markdown)",
    personaBytes: "bytes",
    personaSavePresetPlaceholder: "New preset name...",
    personaAddPresetBtn: "Save preset",
    personaApplyBtn: "Save & Apply",
    personaClearBtn: "Clear",
    personaRulePathLabel: "Rule file:",
    personaSavedMsg: "Applied · rule active (from next message)",
    personaDisabledMsg: "Persona disabled (draft kept)",
    personaEmptyWarn: "Enter an instruction or select a preset first",
    personaWriteErr: "Failed to write rule file",
    personaTooLargeErr: "Rule size exceeds 23,500 bytes limit",
    personaClearedMsg: "Cleared",
    personaDeletedPreset: "Preset removed",
    personaLimitWarn: "Approaching rule size cap (23,500 bytes)",
    langCardsTitle: "Antigravity Interface Language",
    langRuTitle: "Русский (RU)",
    langRuDesc: "Complete Russian localization for menus, dialogs, and workspace",
    langEnTitle: "English (EN)",
    langEnDesc: "Default native English Antigravity interface",
    langActiveBadge: "Active",
    hotkeysTitle: "Shortcuts & quick gestures",
    hkToggleLang: "Toggle RU / EN localization",
    hkToggleModal: "Open / close full Studio settings",
    hkDoubleClick: "Open Settings from widget",
    hkDoubleClickKey: "1 click (pinned) / 2 clicks",
    hkEsc: "Close full settings modal",
    pluginInfoTitle: "Plugin Diagnostics",
    pluginVersion: "Plugin version",
    pluginDict: "Static dictionary entries",
    pluginRules: "Dynamic rules",
    pluginRepo: "GitHub Repository",
    stage2BannerTitle: "Coming in Stage 2 (Visual Studio)",
    stage2BannerDesc: "The next release brings full visual customization of Antigravity with interactive live previews before saving.",
    stage2ThemesTitle: "Themes & Glass Surfaces",
    stage2ThemesDesc: "Curated presets (Obsidian Glass, Midnight Neon, Compact Paper) plus accent color, blur, and border tuning.",
    stage2WallsTitle: "Chat Wallpaper Studio",
    stage2WallsDesc: "Static backgrounds, multi-stop animated gradients, blur/dim sliders, and dynamic video wallpapers.",
    stage2FontsTitle: "Typography & UI Density",
    stage2FontsDesc: "Custom UI and message fonts, line height, and compact/relaxed spacing presets.",
    tooltipExpand: "Expand to card (M)",
    tooltipMini: "Collapse to mini pill (S)",
    tooltipSettings: "Open full settings (Ctrl+Alt+P)",
    tooltipPinLock: "Lock in place (1-click open)",
    tooltipPinUnlock: "Unlock (allow dragging)",
    tooltipLang: "Switch RU / EN",
    tooltipClose: "Close (Esc)",
    sidebarFooterHint: "Open Settings",
    personaBadgeOn: "Persona:",
    personaBadgeOff: "Persona off",
    customPresetTitle: "Custom",
  },
};

function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  let nonAscii = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    if (trimmed.charCodeAt(i) > 127) nonAscii += 1;
  }
  const ascii = trimmed.length - nonAscii;
  return Math.max(1, Math.round(ascii / 3.5 + nonAscii / 2.1));
}

function escHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(str) {
  return escHtml(str).replace(/'/g, "&#39;");
}

function formatCompact(num) {
  const n = Math.max(0, Math.round(Number(num) || 0));
  if (n >= 10000) return (n / 1000).toFixed(0) + "k";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function utf8ByteLength(str) {
  const text = String(str || "");
  if (typeof TextEncoder !== "undefined") {
    try {
      return new TextEncoder().encode(text).length;
    } catch (_e) {}
  }
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      bytes += 4;
      i += 1;
    } else bytes += 3;
  }
  return bytes;
}

function iconSvg(name, size) {
  const s = size || 14;
  const paths = ICON_PATHS[name] || ICON_PATHS.gear;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

function normalizeMiniFields(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    status: src.status !== false,
    lang: src.lang !== false,
    tps: src.tps !== false,
    respTokens: src.respTokens === true,
    chatTokens: src.chatTokens === true,
    model: src.model === true,
  };
}

function normalizeDockPosition(rawDock) {
  if (rawDock === "top") return "top-right";
  if (rawDock === "middle") return "middle-right";
  if (rawDock === "bottom") return "bottom-right";
  return DOCK_POSITIONS.indexOf(rawDock) >= 0 ? rawDock : "bottom-right";
}

function normalizeViewMode(rawMode) {
  return rawMode === "medium" || rawMode === "large" ? "medium" : "mini";
}

function normalizeCustomPresets(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (let i = 0; i < list.length && out.length < 20; i += 1) {
    const p = list[i];
    if (!p || typeof p !== "object") continue;
    const id = String(p.id || "").trim();
    const rawTitle = typeof p.title === "string" ? p.title : (typeof p.name === "string" ? p.name : "");
    const rawBody = typeof p.body === "string" ? p.body : (typeof p.text === "string" ? p.text : "");
    const title = rawTitle.trim();
    if (!id || !title || !rawBody) continue;
    out.push({ id, title: title.slice(0, 60), body: rawBody.slice(0, MAX_PERSONA_BODY_BYTES) });
  }
  return out;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function hashDjb2(str) {
  let h = 5381;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function extractUuid(str) {
  const m = UUID_RE.exec(String(str || ""));
  return m ? m[0].toLowerCase() : "";
}

function isHiddenAncestor(el, stopAt) {
  let cur = el;
  while (cur && cur !== stopAt) {
    if (cur.nodeType === 1) {
      const tag = String(cur.tagName || "").toUpperCase();
      const hasOpen = typeof cur.hasAttribute === "function" ? cur.hasAttribute("open") : Boolean(cur.open);
      if (tag === "DETAILS" && !hasOpen) return true;
      const hasHidden = typeof cur.hasAttribute === "function" ? cur.hasAttribute("hidden") : Boolean(cur.hidden);
      const ariaHidden = typeof cur.getAttribute === "function" ? cur.getAttribute("aria-hidden") : "";
      if (hasHidden || ariaHidden === "true") return true;
    }
    cur = cur.parentNode;
  }
  return false;
}

function extractVisibleText(el) {
  if (!el) return "";
  try {
    const mdRoots = typeof el.querySelectorAll === "function" ? el.querySelectorAll("[data-markdown-root]") : null;
    if (mdRoots && mdRoots.length > 0) {
      let out = "";
      for (let i = 0; i < mdRoots.length; i += 1) {
        const md = mdRoots[i];
        if (!md || isHiddenAncestor(md, el)) continue;
        const txt = typeof md.innerText === "string" && md.innerText.length > 0 ? md.innerText : (md.textContent || "");
        if (txt) out += (out ? "\n" : "") + txt;
      }
      if (out) return out;
    }
    return typeof el.innerText === "string" && el.innerText.length > 0 ? el.innerText : (el.textContent || "");
  } catch (_e) {
    return el.textContent || "";
  }
}

function createEmptyTelemetry() {
  return {
    isGenerating: false,
    phase: "idle",
    currentTps: 0,
    lastAvgTps: 0,
    peakTps: 0,
    respTokens: 0,
    chatTokens: 0,
    contextLabel: "",
    modelName: "",
    samples: [],
    history: [],
    turnStartMs: 0,
    firstTokenMs: 0,
    turnStartTokens: 0,
    prevTokens: 0,
    prevSampleMs: 0,
    lastGrowthAt: 0,
    activeRespEl: null,
    prevRespCount: 0,
    prevUserCount: 0,
    tpsBuckets: [],
    wasGenerating: false,
    dirty: false,
  };
}

function buildSparklineMarkup(samples, width, height, idPrefix) {
  const pts = Array.isArray(samples) && samples.length > 0 ? samples.slice(-24) : [0, 0];
  const padded = pts.length === 1 ? [pts[0], pts[0]] : pts;
  const maxVal = Math.max(12, ...padded);
  const padX = 4;
  const padY = 5;
  const innerW = Math.max(10, width - padX * 2);
  const innerH = Math.max(10, height - padY * 2);
  const coords = padded.map((v, idx) => {
    const x = padX + (idx / Math.max(1, padded.length - 1)) * innerW;
    const y = padY + innerH - (Math.max(0, v) / maxVal) * innerH;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  });
  const lineD = coords.map((c, idx) => `${idx === 0 ? "M" : "L"}${c[0]} ${c[1]}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaD = `${lineD} L${last[0]} ${(height - padY).toFixed(1)} L${first[0]} ${(height - padY).toFixed(1)} Z`;
  const gradId = `agySparkGrad_${idPrefix}`;
  const midY = (padY + innerH * 0.5).toFixed(1);
  return `<svg class="spark-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--st-accent)" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="var(--st-accent)" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <line x1="${padX}" y1="${midY}" x2="${width - padX}" y2="${midY}" stroke="var(--st-border-strong)" stroke-dasharray="2.5 3" stroke-width="1"/>
    <path d="${areaD}" fill="url(#${gradId})"/>
    <path d="${lineD}" fill="none" stroke="var(--st-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="2.8" fill="var(--st-accent)"/>
  </svg>`;
}

function buildStyles() {
  return `
    :host {
      all: initial;
      --st-font: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", system-ui, sans-serif;
      --st-mono: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
      --st-bg: var(--background, #101010);
      --st-sidebar: var(--sidebar, #151515);
      --st-card: var(--card, #18181a);
      --st-card-hover: #222327;
      --st-glass: rgba(20, 20, 23, 0.84);
      --st-glass-strong: rgba(16, 16, 19, 0.94);
      --st-fg: var(--foreground, #d4d4d8);
      --st-fg-strong: #f4f4f5;
      --st-muted: var(--muted-foreground, #8b8d94);
      --st-border: rgba(255, 255, 255, 0.09);
      --st-border-strong: rgba(255, 255, 255, 0.16);
      --st-accent: var(--primary, #007acc);
      --st-accent-soft: rgba(0, 122, 204, 0.16);
      --st-accent-border: rgba(0, 122, 204, 0.45);
      --st-success: var(--success, #7aae66);
      --st-success-soft: rgba(122, 174, 102, 0.15);
      --st-warning: var(--warning, #e8975f);
      --st-error: var(--error, #de5555);
      --st-shadow: 0 12px 32px rgba(0, 0, 0, 0.48), 0 1px 0 rgba(255, 255, 255, 0.04) inset;
      --st-modal-shadow: 0 28px 80px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.08);
      font-family: var(--st-font);
      color-scheme: dark;
    }

    .studio-root[data-theme="light"] {
      --st-bg: #f6f7f9;
      --st-sidebar: #eef0f4;
      --st-card: #ffffff;
      --st-card-hover: #f2f4f8;
      --st-glass: rgba(255, 255, 255, 0.86);
      --st-glass-strong: rgba(255, 255, 255, 0.96);
      --st-fg: #27272a;
      --st-fg-strong: #09090b;
      --st-muted: #646973;
      --st-border: rgba(15, 23, 42, 0.10);
      --st-border-strong: rgba(15, 23, 42, 0.18);
      --st-accent: #006bb3;
      --st-accent-soft: rgba(0, 107, 179, 0.12);
      --st-accent-border: rgba(0, 107, 179, 0.42);
      --st-success: #2f7d32;
      --st-success-soft: rgba(47, 125, 50, 0.12);
      --st-shadow: 0 10px 28px rgba(15, 23, 42, 0.16), 0 1px 0 rgba(255, 255, 255, 0.8) inset;
      --st-modal-shadow: 0 26px 70px rgba(15, 23, 42, 0.24), 0 0 0 1px rgba(15, 23, 42, 0.10);
      color-scheme: light;
    }

    * { box-sizing: border-box; }
    .num { font-variant-numeric: tabular-nums; }
    button, input, textarea { font-family: inherit; }

    /* Floating / Docked Widget */
    .widget-wrap {
      position: fixed;
      z-index: 2147483640;
      user-select: none;
      -webkit-font-smoothing: antialiased;
      transition: opacity 0.16s ease, transform 0.16s ease;
    }
    .widget-wrap.is-hidden { display: none; }
    .widget-wrap.is-dragging { transition: none !important; opacity: 0.96; }

    .widget-wrap.dock-bottom-right { right: 18px; bottom: 18px; }
    .widget-wrap.dock-top-right { right: 18px; top: 52px; }
    .widget-wrap.dock-middle-right { right: 18px; top: 50%; transform: translateY(-50%); }
    .widget-wrap.dock-bottom-left { left: 18px; bottom: 18px; }
    .widget-wrap:not(.is-locked) .mini-pill,
    .widget-wrap:not(.is-locked) .med-card { cursor: grab; }
    .widget-wrap.is-locked .mini-pill,
    .widget-wrap.is-locked .med-card,
    .widget-wrap.is-locked .med-header { cursor: pointer; }
    .widget-wrap.is-locked .drag-grip { opacity: 0.35; cursor: pointer; }
    .widget-wrap.is-dragging .mini-pill,
    .widget-wrap.is-dragging .med-card,
    .widget-wrap.is-dragging .med-header { cursor: grabbing !important; }

    .mini-pill {
      display: inline-flex;
      align-items: center;
      height: 34px;
      gap: 6px;
      padding: 4px 5px 4px 8px;
      border-radius: 999px;
      background: var(--st-glass);
      backdrop-filter: blur(18px) saturate(150%);
      -webkit-backdrop-filter: blur(18px) saturate(150%);
      border: 1px solid var(--st-border-strong);
      box-shadow: var(--st-shadow);
      color: var(--st-fg);
      font-size: 12px;
      line-height: 1;
      max-width: calc(100vw - 24px);
    }

    .drag-grip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--st-muted);
      cursor: grab;
      padding: 2px 1px;
      border-radius: 4px;
      transition: color 0.14s ease;
    }
    .drag-grip:hover { color: var(--st-fg-strong); }
    .widget-wrap.is-dragging .drag-grip { cursor: grabbing; }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: var(--st-fg-strong);
      white-space: nowrap;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--st-success);
      flex-shrink: 0;
    }
    .status-dot.is-live {
      background: var(--st-accent);
      box-shadow: 0 0 0 0 rgba(0, 122, 204, 0.55);
      animation: agyPulse 1.35s infinite;
    }
    @keyframes agyPulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 122, 204, 0.55); }
      70% { box-shadow: 0 0 0 6px rgba(0, 122, 204, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 122, 204, 0); }
    }

    .pill-sep {
      width: 1px;
      height: 14px;
      background: var(--st-border-strong);
      flex-shrink: 0;
    }

    .metric-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--st-fg);
      white-space: nowrap;
      font-weight: 500;
    }
    .metric-chip b { color: var(--st-fg-strong); font-weight: 600; }
    .metric-chip.is-muted { color: var(--st-muted); }
    .model-badge {
      max-width: 112px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--st-muted);
      font-size: 11px;
    }

    .lang-pill-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 22px;
      padding: 0 7px;
      border-radius: 999px;
      border: 1px solid var(--st-border-strong);
      background: var(--st-accent-soft);
      color: var(--st-fg-strong);
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.03em;
      cursor: pointer;
      transition: background 0.14s ease, border-color 0.14s ease;
    }
    .lang-pill-btn:hover {
      border-color: var(--st-accent);
      background: var(--st-accent);
      color: #ffffff;
    }

    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--st-muted);
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
    }
    .icon-btn:hover {
      background: var(--st-card-hover);
      color: var(--st-fg-strong);
      border-color: var(--st-border);
    }
    .icon-btn.is-primary {
      background: var(--st-accent-soft);
      color: var(--st-fg-strong);
      border-color: var(--st-accent-border);
    }
    .icon-btn.is-primary:hover {
      background: var(--st-accent);
      color: #ffffff;
      border-color: var(--st-accent);
    }
    .icon-btn.is-pinned {
      background: var(--st-accent-soft);
      color: var(--st-accent);
      border-color: var(--st-accent-border);
    }
    .icon-btn.is-pinned:hover {
      background: var(--st-accent);
      color: #ffffff;
      border-color: var(--st-accent);
    }

    /* Medium Card */
    .med-card {
      width: 286px;
      border-radius: 12px;
      background: var(--st-glass-strong);
      backdrop-filter: blur(20px) saturate(155%);
      -webkit-backdrop-filter: blur(20px) saturate(155%);
      border: 1px solid var(--st-border-strong);
      box-shadow: var(--st-shadow);
      color: var(--st-fg);
      overflow: hidden;
    }
    .med-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 10px;
      border-bottom: 1px solid var(--st-border);
      cursor: grab;
    }
    .widget-wrap.is-dragging .med-header { cursor: grabbing; }
    .med-head-left {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }
    .med-phase {
      font-size: 12px;
      font-weight: 600;
      color: var(--st-fg-strong);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .med-head-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .med-body { padding: 10px 12px 11px; display: flex; flex-direction: column; gap: 9px; }
    .med-tps-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 10px;
    }
    .med-tps-hero {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }
    .med-tps-num {
      font-size: 27px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--st-fg-strong);
    }
    .med-tps-unit {
      font-size: 11px;
      font-weight: 600;
      color: var(--st-accent);
    }
    .med-peak {
      font-size: 11px;
      color: var(--st-muted);
      white-space: nowrap;
    }
    .med-spark-box { height: 42px; width: 100%; }
    .spark-svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .med-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .med-stat-tile {
      padding: 6px 8px;
      border-radius: 8px;
      background: var(--st-card);
      border: 1px solid var(--st-border);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .med-stat-label { font-size: 10.5px; color: var(--st-muted); }
    .med-stat-val { font-size: 12.5px; font-weight: 600; color: var(--st-fg-strong); }
    .med-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 2px;
    }
    .med-persona-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex: 1;
      padding: 4px 8px;
      border-radius: 7px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      color: var(--st-fg);
      font-size: 11px;
      cursor: pointer;
      text-align: left;
      transition: border-color 0.14s ease, background 0.14s ease;
    }
    .med-persona-pill:hover { border-color: var(--st-accent-border); background: var(--st-card-hover); }
    .med-persona-pill span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .med-model-tag {
      font-size: 10.5px;
      color: var(--st-muted);
      max-width: 96px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Full Settings Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(0, 0, 0, 0.56);
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
      animation: agyFadeIn 0.14s ease-out;
    }
    @keyframes agyFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-shell {
      width: min(800px, calc(100vw - 32px));
      height: min(580px, calc(100vh - 36px));
      border-radius: 12px;
      background: var(--st-bg);
      color: var(--st-fg);
      box-shadow: var(--st-modal-shadow);
      display: flex;
      flex-direction: row;
      overflow: hidden;
      border: 1px solid var(--st-border-strong);
      -webkit-font-smoothing: antialiased;
    }

    /* Sidebar */
    .modal-sidebar {
      width: 214px;
      flex-shrink: 0;
      background: var(--st-sidebar);
      border-right: 1px solid var(--st-border);
      display: flex;
      flex-direction: column;
      padding: 16px 10px 12px;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 4px 8px 14px;
    }
    .brand-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--st-fg-strong);
      letter-spacing: -0.01em;
    }
    .brand-ver {
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 999px;
      background: var(--st-accent-soft);
      color: var(--st-accent);
      border: 1px solid var(--st-accent-border);
    }
    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--st-fg);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: background 0.13s ease, color 0.13s ease, border-color 0.13s ease;
    }
    .nav-item:hover {
      background: var(--st-card-hover);
      color: var(--st-fg-strong);
    }
    .nav-item.is-active {
      background: var(--st-card);
      color: var(--st-fg-strong);
      border-color: var(--st-border-strong);
      font-weight: 600;
    }
    .nav-item .nav-ic {
      display: inline-flex;
      color: var(--st-muted);
      flex-shrink: 0;
    }
    .nav-item.is-active .nav-ic { color: var(--st-accent); }
    .nav-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nav-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--st-success);
      flex-shrink: 0;
    }
    .nav-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--st-card-hover);
      border: 1px solid var(--st-border-strong);
      color: var(--st-muted);
    }
    .sidebar-foot {
      border-top: 1px solid var(--st-border);
      padding: 10px 8px 2px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--st-muted);
    }
    .kbd {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      border-radius: 5px;
      background: var(--st-card);
      border: 1px solid var(--st-border-strong);
      font-family: var(--st-mono);
      font-size: 10.5px;
      color: var(--st-fg);
    }

    /* Right Content Pane */
    .modal-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      background: var(--st-bg);
    }
    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px 14px;
      border-bottom: 1px solid var(--st-border);
    }
    .modal-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--st-fg-strong);
      margin: 0 0 3px;
      letter-spacing: -0.015em;
    }
    .modal-sub {
      font-size: 12.5px;
      color: var(--st-muted);
      margin: 0;
    }
    .modal-close-btn {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--st-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.13s ease, color 0.13s ease, border-color 0.13s ease;
    }
    .modal-close-btn:hover {
      background: var(--st-card-hover);
      color: var(--st-fg-strong);
      border-color: var(--st-border);
    }
    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 18px 24px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-body::-webkit-scrollbar { width: 7px; }
    .modal-body::-webkit-scrollbar-thumb { background: var(--st-border-strong); border-radius: 999px; }

    /* Cards & Groups */
    .section-group { display: flex; flex-direction: column; gap: 8px; }
    .section-label {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--st-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .card {
      background: var(--st-card);
      border: 1px solid var(--st-border);
      border-radius: 10px;
      overflow: hidden;
    }
    .card-pad { padding: 14px 16px; }
    .row-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 11px 15px;
      border-bottom: 1px solid var(--st-border);
    }
    .row-item:last-child { border-bottom: none; }
    .row-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .row-title { font-size: 13px; font-weight: 600; color: var(--st-fg-strong); }
    .row-desc { font-size: 11.5px; color: var(--st-muted); }

    /* Antigravity Native Switch */
    .switch {
      position: relative;
      width: 36px;
      height: 20px;
      border-radius: 999px;
      background: rgba(128, 134, 145, 0.35);
      border: 1px solid var(--st-border-strong);
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      transition: background 0.16s ease, border-color 0.16s ease;
    }
    .switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
      transition: transform 0.16s ease;
    }
    .switch.is-on {
      background: var(--st-accent);
      border-color: var(--st-accent);
    }
    .switch.is-on .switch-thumb { transform: translateX(16px); }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 32px;
      padding: 0 13px;
      border-radius: 7px;
      border: 1px solid var(--st-border-strong);
      background: var(--st-card-hover);
      color: var(--st-fg-strong);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.14s ease, border-color 0.14s ease, opacity 0.14s ease;
    }
    .btn:hover { background: var(--st-border-strong); }
    .btn-primary {
      background: var(--st-accent);
      border-color: var(--st-accent);
      color: #ffffff;
    }
    .btn-primary:hover { filter: brightness(1.1); background: var(--st-accent); }
    .btn-sm { height: 27px; padding: 0 10px; font-size: 11.5px; }

    /* Monitor Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .kpi-card {
      padding: 12px 13px;
      border-radius: 10px;
      background: var(--st-card);
      border: 1px solid var(--st-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kpi-label { font-size: 11.5px; color: var(--st-muted); }
    .kpi-val { font-size: 20px; font-weight: 700; color: var(--st-fg-strong); letter-spacing: -0.02em; }
    .kpi-sub { font-size: 11px; color: var(--st-accent); font-weight: 500; }
    .spark-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    .spark-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--st-card-hover);
      border: 1px solid var(--st-border-strong);
      font-size: 11.5px;
      font-weight: 600;
      color: var(--st-fg-strong);
    }
    .modal-spark-box { height: 92px; width: 100%; }
    .history-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      border-bottom: 1px solid var(--st-border);
      font-size: 12px;
    }
    .history-row:last-child { border-bottom: none; }
    .history-model { font-weight: 600; color: var(--st-fg-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .history-meta { color: var(--st-muted); font-size: 11.5px; }
    .history-tps { font-weight: 700; color: var(--st-accent); }

    /* Widget Preview & Selectors */
    .preview-stage {
      padding: 18px 16px;
      border-radius: 10px;
      background: radial-gradient(circle at top right, var(--st-accent-soft), transparent 60%), var(--st-sidebar);
      border: 1px solid var(--st-border-strong);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 76px;
    }
    .segmented-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .choice-card {
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      color: var(--st-fg);
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: border-color 0.14s ease, background 0.14s ease;
    }
    .choice-card:hover { background: var(--st-card-hover); border-color: var(--st-border-strong); }
    .choice-card.is-selected {
      border-color: var(--st-accent);
      background: var(--st-accent-soft);
    }
    .choice-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
      color: var(--st-fg-strong);
    }
    .choice-desc { font-size: 11.5px; color: var(--st-muted); }

    .dock-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .dock-btn {
      padding: 9px 10px;
      border-radius: 8px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      color: var(--st-fg);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: border-color 0.14s ease, background 0.14s ease;
    }
    .dock-btn:hover { background: var(--st-card-hover); border-color: var(--st-border-strong); }
    .dock-btn.is-selected {
      border-color: var(--st-accent);
      background: var(--st-accent-soft);
      color: var(--st-fg-strong);
    }
    .dock-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 9px;
      background: var(--st-card);
      border: 1px solid var(--st-border);
      font-size: 12px;
    }

    /* Persona Tab */
    .persona-stack {
      display: flex;
      flex-direction: column;
      gap: 11px;
    }
    .preset-strip {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(156px, 1fr));
      gap: 8px;
    }
    .preset-card {
      position: relative;
      padding: 8px 10px;
      border-radius: 9px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      color: var(--st-fg);
      cursor: pointer;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 3px;
      transition: border-color 0.14s ease, background 0.14s ease;
    }
    .preset-card:hover { background: var(--st-card-hover); border-color: var(--st-border-strong); }
    .preset-card.is-selected { border-color: var(--st-accent); background: var(--st-accent-soft); }
    .preset-head { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
    .preset-name { font-size: 12px; font-weight: 700; color: var(--st-fg-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .preset-desc { font-size: 11px; color: var(--st-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .preset-del-btn {
      border: none;
      background: transparent;
      color: var(--st-muted);
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      display: inline-flex;
    }
    .preset-del-btn:hover { color: var(--st-error); background: rgba(222, 85, 85, 0.12); }

    .editor-box {
      width: 100%;
      min-height: 110px;
      resize: vertical;
      padding: 11px 13px;
      border-radius: 9px;
      border: 1px solid var(--st-border-strong);
      background: var(--st-sidebar);
      color: var(--st-fg-strong);
      font-family: var(--st-mono);
      font-size: 12.5px;
      line-height: 1.5;
      outline: none;
    }
    .editor-box:focus { border-color: var(--st-accent); }
    .editor-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 11.5px;
      color: var(--st-muted);
    }
    .preset-add-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .text-input {
      flex: 1;
      height: 30px;
      padding: 0 10px;
      border-radius: 7px;
      border: 1px solid var(--st-border-strong);
      background: var(--st-sidebar);
      color: var(--st-fg-strong);
      font-size: 12px;
      outline: none;
    }
    .text-input:focus { border-color: var(--st-accent); }
    .action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .action-btns { display: flex; align-items: center; gap: 8px; }
    .toast-text { font-size: 12px; font-weight: 600; color: var(--st-success); }
    .toast-text.is-err { color: var(--st-error); }

    /* Language & Appearance */
    .badge-active {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--st-success-soft);
      color: var(--st-success);
    }
    .repo-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--st-accent);
      text-decoration: none;
      font-weight: 600;
      font-size: 12.5px;
    }
    .repo-link:hover { text-decoration: underline; }
    .roadmap-banner {
      padding: 14px 16px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--st-accent-soft), rgba(122, 174, 102, 0.08));
      border: 1px solid var(--st-accent-border);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .roadmap-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .roadmap-card {
      padding: 13px 15px;
      border-radius: 10px;
      background: var(--st-card);
      border: 1px dashed var(--st-border-strong);
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .roadmap-ic {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--st-accent-soft);
      color: var(--st-accent);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    @media (max-width: 720px) {
      .modal-shell { flex-direction: column; height: min(660px, calc(100vh - 24px)); }
      .modal-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--st-border); padding: 10px; }
      .nav-list { flex-direction: row; overflow-x: auto; gap: 4px; }
      .sidebar-foot { display: none; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `;
}

function createStudioPanel(options) {
  const opts = options && typeof options === "object" ? options : {};
  const doc = opts.document || (typeof document !== "undefined" ? document : null);
  const win = opts.window || (typeof window !== "undefined" ? window : null);
  const ipc = opts.ipcRenderer || null;
  const pluginMeta = opts.pluginMeta && typeof opts.pluginMeta === "object"
    ? opts.pluginMeta
    : { version: "2.4.0", dictEntries: 4017, dynamicRulesCount: 471 };

  const state = {
    initialized: false,
    destroyed: false,
    locale: opts.initialLocale === "en" ? "en" : "ru",
    isOpen: false,
    activeTab: "monitor",
    theme: "dark",
    activeChatKey: "__new__",
    activeChatTitle: "",
    activeChatSwitchSeq: 0,
    hasActivatedChat: false,
    chatPersona: {
      enabled: false,
      activePreset: "custom",
      text: "",
    },
    newChatDraftPersona: null,
    settings: {
      panelEnabled: true,
      pinned: false,
      viewMode: "mini",
      layoutMode: "docked",
      dockPosition: "bottom-right",
      floatX: null,
      floatY: null,
      miniFields: Object.assign({}, DEFAULT_MINI_FIELDS),
      showMiniTps: true,
      trackHistory: true,
      customPresets: [],
    },
    draftPersonaText: "",
    draftDirty: false,
    newPresetName: "",
    personaFileExists: false,
    personaFilePath: "~/.gemini/config/plugins/antigravity-ru/rules/AGENTS.md",
    toastMsg: "",
    toastError: false,
    telemetry: createEmptyTelemetry(),
  };

  let hostEl = null;
  let shadowRoot = null;
  let styleEl = null;
  let rootEl = null;
  let widgetMountEl = null;
  let modalMountEl = null;
  let pollTimer = null;
  let throttleTimer = null;
  let domObserver = null;
  let themeObserver = null;
  let toastTimer = null;
  let keydownHandler = null;
  let resizeHandler = null;
  let dragState = null;
  let lastBodyClickAt = 0;
  let lastDragEndedAt = 0;

  function t() {
    return TEXT[state.locale] || TEXT.ru;
  }

  function detectTheme() {
    if (!doc || !win) return "dark";
    try {
      const htmlEl = doc.documentElement;
      const bodyEl = doc.body;
      if (htmlEl && ((htmlEl.classList && htmlEl.classList.contains("light")) || (typeof htmlEl.getAttribute === "function" && htmlEl.getAttribute("data-theme") === "light"))) {
        return "light";
      }
      if (bodyEl && bodyEl.classList && (bodyEl.classList.contains("light") || bodyEl.classList.contains("vscode-light"))) {
        return "light";
      }
      if (typeof win.getComputedStyle === "function" && htmlEl) {
        const bgVar = win.getComputedStyle(htmlEl).getPropertyValue("--background").trim();
        const m = bgVar.match(/^#([0-9a-f]{6})$/i);
        if (m) {
          const hex = m[1];
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          if ((r * 299 + g * 587 + b * 114) / 1000 > 150) return "light";
        }
      }
      if (typeof win.matchMedia === "function" && win.matchMedia("(prefers-color-scheme: light)").matches) {
        if (htmlEl && htmlEl.classList && htmlEl.classList.contains("dark")) return "dark";
      }
    } catch (_e) {}
    return "dark";
  }

  function syncTheme() {
    const next = detectTheme();
    state.theme = next;
    if (rootEl) rootEl.setAttribute("data-theme", next);
  }

  function setToast(msg, isErr) {
    state.toastMsg = msg || "";
    state.toastError = Boolean(isErr);
    if (toastTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(toastTimer);
    }
    const toastEl = modalMountEl ? modalMountEl.querySelector('[data-role="toast"]') : null;
    if (toastEl) {
      toastEl.textContent = state.toastMsg;
      toastEl.className = "toast-text" + (state.toastError ? " is-err" : "");
    }
    if (msg && win && typeof win.setTimeout === "function") {
      toastTimer = win.setTimeout(() => {
        state.toastMsg = "";
        const el = modalMountEl ? modalMountEl.querySelector('[data-role="toast"]') : null;
        if (el) el.textContent = "";
      }, 3200);
    }
  }

  function invokeIpc(channel, payload) {
    if (!ipc || typeof ipc.invoke !== "function") return Promise.resolve(null);
    try {
      return Promise.resolve(ipc.invoke(channel, payload)).catch(() => null);
    } catch (_e) {
      return Promise.resolve(null);
    }
  }

  function saveSettingsPatch(patch) {
    Object.assign(state.settings, patch);
    if (patch.miniFields) {
      state.settings.miniFields = normalizeMiniFields(patch.miniFields);
    }
    if (patch.dockPosition) {
      state.settings.dockPosition = normalizeDockPosition(patch.dockPosition);
    }
    if (patch.viewMode) {
      state.settings.viewMode = normalizeViewMode(patch.viewMode);
    }
    renderStructure();
    return invokeIpc("agy-studio:save-settings", patch).then((res) => {
      if (res && res.settings) applyRemoteState(res, true);
      return res;
    });
  }

  function applyRemoteState(remote, _skipDraftReset) {
    if (!remote || typeof remote !== "object") return;
    if (remote.locale === "ru" || remote.locale === "en") {
      state.locale = remote.locale;
    }
    const rawSettings = remote.settings && typeof remote.settings === "object" ? remote.settings : remote;
    if (rawSettings && typeof rawSettings === "object") {
      if (typeof rawSettings.panelEnabled === "boolean") state.settings.panelEnabled = rawSettings.panelEnabled;
      if (typeof rawSettings.pinned === "boolean") state.settings.pinned = rawSettings.pinned;
      if (rawSettings.viewMode) {
        state.settings.viewMode = normalizeViewMode(rawSettings.viewMode);
      }
      if (rawSettings.layoutMode === "floating" || rawSettings.layoutMode === "docked") {
        state.settings.layoutMode = rawSettings.layoutMode;
      }
      if (rawSettings.dockPosition) {
        state.settings.dockPosition = normalizeDockPosition(rawSettings.dockPosition);
      }
      if ("floatX" in rawSettings) {
        state.settings.floatX = typeof rawSettings.floatX === "number" && Number.isFinite(rawSettings.floatX) ? rawSettings.floatX : null;
      }
      if ("floatY" in rawSettings) {
        state.settings.floatY = typeof rawSettings.floatY === "number" && Number.isFinite(rawSettings.floatY) ? rawSettings.floatY : null;
      }
      if (rawSettings.miniFields) {
        state.settings.miniFields = normalizeMiniFields(rawSettings.miniFields);
      }
      if (typeof rawSettings.showMiniTps === "boolean") state.settings.showMiniTps = rawSettings.showMiniTps;
      if (typeof rawSettings.trackHistory === "boolean") state.settings.trackHistory = rawSettings.trackHistory;
      if (Array.isArray(rawSettings.customPresets)) {
        state.settings.customPresets = normalizeCustomPresets(rawSettings.customPresets);
      }
    }
    if (typeof remote.personaFilePath === "string" && remote.personaFilePath) state.personaFilePath = remote.personaFilePath;
    renderStructure();
  }

  function serializeChatTelemetry(tel) {
    return {
      lastAvgTps: Math.max(0, Math.round(Number(tel.lastAvgTps) || 0)),
      peakTps: Math.max(0, Math.round(Number(tel.peakTps) || 0)),
      respTokens: Math.max(0, Math.round(Number(tel.respTokens) || 0)),
      chatTokens: Math.max(0, Math.round(Number(tel.chatTokens) || 0)),
      modelName: String(tel.modelName || "").slice(0, 60),
      samples: Array.isArray(tel.samples) ? tel.samples.slice(-24) : [],
      history: Array.isArray(tel.history) ? tel.history.slice(0, 8) : [],
    };
  }

  function detectChatTitle() {
    if (!doc) return "";
    try {
      const ignored = /^(antigravity|new chat|новый чат|untitled)$/i;
      if (typeof doc.querySelector === "function") {
        const titleEl = doc.querySelector('[data-testid="conversation-title"], [data-testid="chat-title"], main header h1, main header h2');
        const t1 = titleEl && titleEl.textContent ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
        if (t1 && !ignored.test(t1)) return t1.slice(0, 60);
        const navEl = doc.querySelector('[aria-current="page"], [aria-selected="true"], [data-active="true"], [data-state="active"]');
        if (navEl && typeof navEl.getAttribute === "function" && (!hostEl || (typeof hostEl.contains !== "function" || !hostEl.contains(navEl)))) {
          const t2 = (navEl.getAttribute("title") || navEl.textContent || "").replace(/\s+/g, " ").trim();
          if (t2 && !ignored.test(t2)) return t2.slice(0, 60);
        }
      }
      const dt = String(doc.title || "").replace(/\s*[-—|]\s*Antigravity.*$/i, "").replace(/\s+/g, " ").trim();
      if (dt && !ignored.test(dt)) return dt.slice(0, 60);
    } catch (_e) {}
    return "";
  }

  function findActiveSidebarKeyParts() {
    if (!doc || typeof doc.querySelectorAll !== "function") return { uuid: "", stable: "" };
    try {
      const nodes = doc.querySelectorAll('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id], [aria-current="page"], [aria-selected="true"], [data-active="true"], [data-state="active"]');
      if (!nodes) return { uuid: "", stable: "" };
      let stable = "";
      for (let i = 0; i < nodes.length; i += 1) {
        const el = nodes[i];
        if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
        if (typeof el.getAttribute !== "function") continue;
        const attrs = ["data-conversation-id", "data-cascade-id", "data-session-id", "data-chat-id", "href", "id", "data-testid"];
        for (let a = 0; a < attrs.length; a += 1) {
          const v = el.getAttribute(attrs[a]) || "";
          if (!v) continue;
          const u = extractUuid(v);
          if (u) return { uuid: u, stable: u };
          if (!stable && (attrs[a] === "href" || attrs[a] === "id" || attrs[a].startsWith("data-"))) {
            stable = attrs[a] + "=" + v;
          }
        }
      }
      return { uuid: "", stable };
    } catch (_e) {
      return { uuid: "", stable: "" };
    }
  }

  function detectChatIdentity(snap) {
    let rawUrl = "";
    try {
      if (win && win.location) {
        rawUrl = String(win.location.pathname || "") + String(win.location.search || "") + String(win.location.hash || "");
      }
    } catch (_e) {}
    const cleanUrl = rawUrl.replace(/([?&#](?:token|bootstrap|bootstrapToken)=[^&#]*)/gi, "");
    const title = detectChatTitle();

    const urlUuid = extractUuid(cleanUrl);
    if (urlUuid) {
      return { key: urlUuid, isNew: false, title };
    }

    const domParts = findActiveSidebarKeyParts();
    if (domParts.uuid) {
      return { key: domParts.uuid, isNew: false, title };
    }

    if (snap.userMsgCount === 0 && snap.respCount === 0) {
      return { key: "__new__", isNew: true, title: "" };
    }

    const cleanPath = cleanUrl.split(/[?#]/)[0] || "/";
    const normTitle = /^(new chat|новый чат|antigravity)$/i.test(title) ? "" : title.toLowerCase();
    const fpSource = `${cleanPath}||${domParts.stable}||${snap.firstUserNorm}||${normTitle}`;
    return { key: "chat-" + hashDjb2(fpSource), isNew: false, title };
  }

  function detectModelName() {
    if (!doc || typeof doc.querySelector !== "function") return "";
    try {
      const el = doc.querySelector('[data-testid="model-selector-trigger"]');
      const raw = el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim() : "";
      return raw.slice(0, 40);
    } catch (_e) {
      return "";
    }
  }

  function detectContextLabel() {
    if (!doc || typeof doc.querySelector !== "function") return "";
    try {
      const el = doc.querySelector('[data-testid="context-usage-indicator"]');
      return el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim().slice(0, 28) : "";
    } catch (_e) {
      return "";
    }
  }

  function collectDomTelemetry() {
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return { isGenerating: false, isThinking: false, respTokens: 0, chatTokens: 0, userMsgCount: 0, respCount: 0, lastResp: null, firstUserNorm: "", modelName: "", contextLabel: "" };
    }
    try {
      const responses = doc.querySelectorAll('[data-testid="agent-response"]');
      const userMsgs = doc.querySelectorAll('[data-testid="user-message-content"]');
      const respCount = responses ? responses.length : 0;
      const userMsgCount = userMsgs ? userMsgs.length : 0;
      const lastResp = respCount > 0 ? responses[respCount - 1] : null;

      let isGenerating = Boolean(typeof doc.querySelector === "function" && doc.querySelector('[data-testid="cancel-invocation-button"]'));
      let isThinking = false;
      if (lastResp) {
        const h6List = typeof lastResp.querySelectorAll === "function"
          ? lastResp.querySelectorAll("h6")
          : (typeof lastResp.querySelector === "function" && lastResp.querySelector("h6") ? [lastResp.querySelector("h6")] : []);
        for (let i = 0; h6List && i < h6List.length; i += 1) {
          const txt = h6List[i] && h6List[i].textContent ? h6List[i].textContent : "";
          if (/working|generating|thinking|streaming|работает|думает|генерац|выполня|пишет/i.test(txt)) {
            isGenerating = true;
            if (/thinking|думает/i.test(txt)) isThinking = true;
            break;
          }
        }
      }
      if (!isGenerating) {
        const ariaBtns = doc.querySelectorAll("button[aria-label]");
        for (let i = 0; ariaBtns && i < ariaBtns.length; i += 1) {
          const b = ariaBtns[i];
          if (!b || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(b))) continue;
          const lbl = typeof b.getAttribute === "function" ? (b.getAttribute("aria-label") || "") : "";
          if (/^(stop|cancel|останов|отмен)/i.test(lbl.trim())) {
            isGenerating = true;
            break;
          }
        }
      }

      const visibleRespText = lastResp ? extractVisibleText(lastResp) : "";
      let chatTokens = 0;
      if (userMsgs) {
        for (let i = 0; i < userMsgs.length; i += 1) {
          chatTokens += estimateTokens(userMsgs[i].textContent || "");
        }
      }
      if (responses) {
        for (let i = 0; i < responses.length; i += 1) {
          chatTokens += estimateTokens(extractVisibleText(responses[i]));
        }
      }
      const firstUserNorm = userMsgCount > 0 ? (userMsgs[0].textContent || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 120) : "";
      return {
        isGenerating,
        isThinking,
        respTokens: estimateTokens(visibleRespText),
        chatTokens,
        userMsgCount,
        respCount,
        lastResp,
        firstUserNorm,
        modelName: detectModelName(),
        contextLabel: detectContextLabel(),
      };
    } catch (_e) {
      return { isGenerating: false, isThinking: false, respTokens: 0, chatTokens: 0, userMsgCount: 0, respCount: 0, lastResp: null, firstUserNorm: "", modelName: "", contextLabel: "" };
    }
  }

  function flushChatTelemetry(chatKey, title, tel) {
    if (!chatKey || chatKey === "__new__") return;
    tel.dirty = false;
    invokeIpc("agy-studio:save-chat-telemetry", {
      chatKey,
      title: title || "",
      telemetry: serializeChatTelemetry(tel),
    });
  }

  function switchChatIfNeeded(detected, snap) {
    const needActivate = !state.hasActivatedChat || detected.key !== state.activeChatKey;
    if (!needActivate) {
      if (detected.title && !state.activeChatTitle) state.activeChatTitle = detected.title;
      return { switched: false, promoted: false };
    }

    const prevKey = state.activeChatKey;
    const prevTitle = state.activeChatTitle;
    const wasActivated = state.hasActivatedChat;
    const tel = state.telemetry;

    const isPromotion = wasActivated && prevKey === "__new__" && detected.key !== "__new__" && (state.newChatDraftPersona !== null || snap.isGenerating || tel.isGenerating || tel.prevUserCount === 0 && snap.userMsgCount <= 1);

    if (wasActivated && prevKey !== "__new__" && tel.dirty) {
      flushChatTelemetry(prevKey, prevTitle, tel);
    }

    let promoPayload = null;
    if (isPromotion) {
      const draft = state.newChatDraftPersona;
      promoPayload = {
        title: detected.title,
        personaEnabled: Boolean(draft && draft.personaEnabled),
        personaActivePreset: draft && draft.personaActivePreset ? draft.personaActivePreset : state.chatPersona.activePreset || "custom",
        personaText: draft && typeof draft.personaText === "string" ? draft.personaText : "",
        telemetry: serializeChatTelemetry(tel),
      };
      if (!snap.isGenerating && !tel.isGenerating && snap.respCount >= 1 && tel.prevRespCount === 0) {
        tel.prevTokens = snap.respTokens;
        tel.turnStartTokens = snap.respTokens;
      }
      state.newChatDraftPersona = null;
    } else {
      state.newChatDraftPersona = null;
      const freshTel = createEmptyTelemetry();
      freshTel.respTokens = snap.respTokens;
      freshTel.chatTokens = snap.chatTokens;
      freshTel.prevTokens = snap.respTokens;
      freshTel.turnStartTokens = snap.respTokens;
      freshTel.prevSampleMs = Date.now();
      freshTel.activeRespEl = snap.lastResp;
      freshTel.prevRespCount = snap.respCount;
      freshTel.prevUserCount = snap.userMsgCount;
      freshTel.modelName = snap.modelName;
      freshTel.contextLabel = snap.contextLabel;
      state.telemetry = freshTel;
      state.chatPersona = { enabled: false, activePreset: "custom", text: "" };
      state.draftPersonaText = "";
      state.draftDirty = false;
      state.toastMsg = "";
      state.toastError = false;
    }

    state.hasActivatedChat = true;
    state.activeChatKey = detected.key;
    state.activeChatTitle = detected.title;
    const seq = ++state.activeChatSwitchSeq;
    renderStructure();

    invokeIpc("agy-studio:activate-chat", {
      chatKey: detected.key,
      title: detected.title,
      promoteFromNew: promoPayload,
      draftPersona: detected.isNew ? state.newChatDraftPersona : null,
    }).then((res) => {
      if (state.destroyed || seq !== state.activeChatSwitchSeq || !res || !res.chat) return;
      const rec = res.chat;
      if (typeof res.personaFileExists === "boolean") state.personaFileExists = res.personaFileExists;
      if (typeof res.personaFilePath === "string" && res.personaFilePath) state.personaFilePath = res.personaFilePath;
      if (rec.title && !state.activeChatTitle) state.activeChatTitle = rec.title;
      state.chatPersona = {
        enabled: Boolean(rec.personaEnabled),
        activePreset: rec.personaActivePreset || "custom",
        text: typeof rec.personaText === "string" ? rec.personaText : "",
      };
      if (!state.draftDirty) {
        state.draftPersonaText = state.chatPersona.text;
      }
      const rt = rec.telemetry;
      const curTel = state.telemetry;
      if (rt && !curTel.isGenerating && !curTel.wasGenerating && (rt.lastAvgTps > 0 || rt.peakTps > 0 || (Array.isArray(rt.history) && rt.history.length > 0))) {
        curTel.lastAvgTps = rt.lastAvgTps || 0;
        curTel.peakTps = rt.peakTps || 0;
        if (!curTel.modelName && rt.modelName) curTel.modelName = rt.modelName;
        if (Array.isArray(rt.samples) && rt.samples.length > 0) curTel.samples = rt.samples.slice(-24);
        if (Array.isArray(rt.history) && rt.history.length > 0) curTel.history = rt.history.slice(0, 8);
      }
      renderStructure();
      updateLiveDom();
    });

    return { switched: true, promoted: isPromotion };
  }

  function pollStream() {
    if (state.destroyed) return;
    const now = Date.now();
    const snap = collectDomTelemetry();
    const detected = detectChatIdentity(snap);
    const sw = switchChatIfNeeded(detected, snap);
    const tel = state.telemetry;

    if (snap.modelName) tel.modelName = snap.modelName;
    if (snap.contextLabel) tel.contextLabel = snap.contextLabel;
    tel.chatTokens = snap.chatTokens;

    if (!sw.switched) {
      const sameConvGrowth = snap.userMsgCount <= tel.prevUserCount + 1;
      const newRespAppeared = Boolean(snap.lastResp && tel.activeRespEl && snap.lastResp !== tel.activeRespEl);
      if (newRespAppeared) {
        if (tel.wasGenerating) {
          const prevGained = Math.max(0, tel.respTokens - tel.turnStartTokens);
          if (prevGained >= 2) {
            const durSec = Math.max(0.25, (now - (tel.firstTokenMs || tel.turnStartMs || now)) / 1000);
            const avgTps = Math.round(prevGained / durSec);
            tel.lastAvgTps = avgTps;
            tel.peakTps = Math.max(tel.peakTps, avgTps);
            if (state.settings.trackHistory !== false) {
              tel.history.unshift({
                model: tel.modelName || t().modelUnknown,
                tokens: prevGained,
                avgTps,
                peakTps: Math.max(tel.peakTps, avgTps),
                at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              });
              if (tel.history.length > 8) tel.history.length = 8;
            }
            tel.dirty = true;
          }
        }
        tel.activeRespEl = snap.lastResp;
        tel.turnStartTokens = 0;
        tel.prevTokens = 0;
        tel.firstTokenMs = 0;
        tel.turnStartMs = now;
        tel.tpsBuckets = [];
        tel.currentTps = 0;
      } else if (!tel.activeRespEl && snap.lastResp) {
        tel.activeRespEl = snap.lastResp;
      }

      const rawDelta = snap.respTokens - tel.prevTokens;
      const deltaTok = rawDelta > 0 ? rawDelta : 0;
      if (sameConvGrowth && deltaTok > 0) {
        tel.lastGrowthAt = now;
      }
      const recentlyGrew = tel.lastGrowthAt > 0 && (now - tel.lastGrowthAt) <= 1200;
      const effectiveGenerating = Boolean(snap.isGenerating || recentlyGrew);

      if (effectiveGenerating && !tel.wasGenerating) {
        tel.turnStartMs = now;
        tel.turnStartTokens = newRespAppeared ? 0 : tel.prevTokens;
        tel.firstTokenMs = deltaTok > 0 ? now : 0;
        tel.prevSampleMs = now;
        tel.tpsBuckets = [];
        tel.peakTps = 0;
        tel.currentTps = 0;
      }

      if (effectiveGenerating) {
        if (!tel.firstTokenMs && snap.respTokens > tel.turnStartTokens) {
          tel.firstTokenMs = now;
        }
        if (deltaTok > 0) {
          tel.tpsBuckets.push({ t: now, d: deltaTok });
        }
        tel.tpsBuckets = tel.tpsBuckets.filter((b) => now - b.t <= 1800);
        let sumD = 0;
        for (let i = 0; i < tel.tpsBuckets.length; i += 1) sumD += tel.tpsBuckets[i].d;
        const oldest = tel.tpsBuckets.length > 0 ? tel.tpsBuckets[0].t : now;
        const spanSec = Math.max(0.25, (now - oldest + 200) / 1000);
        const rawTps = sumD / spanSec;
        const smoothed = tel.currentTps > 0
          ? Math.round(tel.currentTps * 0.35 + rawTps * 0.65)
          : Math.round(rawTps);
        tel.currentTps = Math.max(0, smoothed);
        const gainedTotal = Math.max(0, snap.respTokens - tel.turnStartTokens);
        if (gainedTotal >= 2 && tel.currentTps > tel.peakTps) {
          tel.peakTps = tel.currentTps;
        }
        if (deltaTok > 0 || tel.currentTps > 0) {
          tel.samples.push(tel.currentTps);
          if (tel.samples.length > 24) tel.samples.shift();
          tel.dirty = true;
        }
        tel.phase = tel.firstTokenMs ? "streaming" : "thinking";
        tel.prevTokens = snap.respTokens;
        tel.prevSampleMs = now;
      } else if (tel.wasGenerating) {
        const gainedTotal = Math.max(0, snap.respTokens - tel.turnStartTokens);
        if (gainedTotal >= 2) {
          const baseMs = tel.firstTokenMs || tel.turnStartMs || now;
          const durSec = Math.max(0.25, (now - baseMs) / 1000);
          const avgTps = Math.round(gainedTotal / durSec);
          tel.lastAvgTps = avgTps;
          tel.peakTps = Math.max(tel.peakTps, avgTps);
          if (state.settings.trackHistory !== false) {
            tel.history.unshift({
              model: tel.modelName || t().modelUnknown,
              tokens: gainedTotal,
              avgTps,
              peakTps: Math.max(tel.peakTps, avgTps),
              at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });
            if (tel.history.length > 8) tel.history.length = 8;
            if (state.isOpen && state.activeTab === "monitor") {
              updateHistoryDom();
            }
          }
          tel.dirty = true;
        }
        tel.currentTps = 0;
        tel.tpsBuckets = [];
        tel.phase = "idle";
        tel.lastGrowthAt = 0;
        tel.prevTokens = snap.respTokens;
        if (tel.dirty && state.activeChatKey !== "__new__") {
          flushChatTelemetry(state.activeChatKey, state.activeChatTitle, tel);
        }
      } else {
        tel.phase = "idle";
        tel.prevTokens = snap.respTokens;
      }

      tel.isGenerating = effectiveGenerating;
      tel.wasGenerating = effectiveGenerating;
    } else if (sw.promoted && (snap.isGenerating || snap.respTokens > tel.prevTokens)) {
      const gained = Math.max(0, snap.respTokens - tel.prevTokens);
      if (gained > 0) {
        tel.lastGrowthAt = now;
        if (!tel.firstTokenMs) tel.firstTokenMs = now;
        if (!tel.turnStartMs) tel.turnStartMs = now;
        tel.tpsBuckets.push({ t: now, d: gained });
        const rawTps = Math.round(gained / 0.25);
        tel.currentTps = rawTps;
        if (snap.respTokens >= 2) tel.peakTps = Math.max(tel.peakTps, rawTps);
        tel.samples.push(rawTps);
        if (tel.samples.length > 24) tel.samples.shift();
        tel.dirty = true;
      }
      tel.prevTokens = snap.respTokens;
      tel.isGenerating = Boolean(snap.isGenerating || gained > 0);
      tel.wasGenerating = tel.isGenerating;
      tel.phase = tel.isGenerating ? (tel.firstTokenMs ? "streaming" : "thinking") : "idle";
    }

    tel.prevRespCount = snap.respCount;
    tel.prevUserCount = snap.userMsgCount;
    tel.respTokens = snap.respTokens;

    updateLiveDom();
  }

  function formatChatBadgeLabel() {
    const tr = t();
    if (state.activeChatKey === "__new__") return tr.chatScopeNew;
    const label = state.activeChatTitle || state.activeChatKey.slice(0, 12);
    return `${tr.chatScopeNamed} ${label}`;
  }

  function getDisplayedTps(tel) {
    return tel.isGenerating ? tel.currentTps : (tel.lastAvgTps || 0);
  }

  function getDisplayedTpsUnit(tel, tr) {
    return !tel.isGenerating && tel.lastAvgTps > 0 ? `${tr.avgPrefix} ${tr.tpsUnit}` : tr.tpsUnit;
  }

  function renderMiniCapsuleMarkup(isPreview) {
    const tr = t();
    const mf = state.settings.miniFields;
    const tel = state.telemetry;
    const chips = [];

    if (mf.status) {
      const label = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.statusWriting : tr.statusReady);
      chips.push(
        `<span class="status-chip"><span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span><span data-live="statusText">${escHtml(label)}</span></span>`
      );
    }
    if (mf.lang) {
      const langLabel = state.locale === "en" ? "EN" : "RU";
      if (isPreview) {
        chips.push(`<span class="lang-pill-btn">${langLabel}</span>`);
      } else {
        chips.push(
          `<button type="button" class="lang-pill-btn" data-action="toggle-locale" data-no-drag="1" title="${escAttr(tr.tooltipLang)}">${langLabel}</button>`
        );
      }
    }
    if (mf.tps) {
      const val = getDisplayedTps(tel);
      const tag = getDisplayedTpsUnit(tel, tr);
      chips.push(`<span class="metric-chip num"><b data-live="tps">${val}</b> <span data-live="tpsUnit">${escHtml(tag)}</span></span>`);
    }
    if (mf.respTokens) {
      chips.push(`<span class="metric-chip is-muted num">${escHtml(tr.respLabel)}: <b data-live="resp">~${formatCompact(tel.respTokens)}</b></span>`);
    }
    if (mf.chatTokens) {
      const chatText = tel.contextLabel || `~${formatCompact(tel.chatTokens)}`;
      chips.push(`<span class="metric-chip is-muted num">${escHtml(tr.chatLabel)}: <b data-live="chat">${escHtml(chatText)}</b></span>`);
    }
    if (mf.model) {
      const modelTxt = tel.modelName || "AI";
      chips.push(`<span class="model-badge" data-live="model" title="${escAttr(modelTxt)}">${escHtml(modelTxt)}</span>`);
    }

    if (chips.length === 0) {
      chips.push(`<span class="status-chip"><span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>Studio</span>`);
    }

    const isPinned = Boolean(state.settings.pinned);
    const joined = chips.join('<span class="pill-sep"></span>');
    const grip = isPreview
      ? `<span class="drag-grip">${iconSvg("grip", 13)}</span>`
      : `<span class="drag-grip">${iconSvg("grip", 13)}</span>`;
    const btns = isPreview
      ? `<span class="icon-btn">${iconSvg("expand", 13)}</span><span class="icon-btn${isPinned ? " is-pinned" : ""}">${iconSvg("pin", 13)}</span><span class="icon-btn is-primary">${iconSvg("gear", 13)}</span>`
      : `<button type="button" class="icon-btn" data-action="to-medium" data-no-drag="1" title="${escAttr(tr.tooltipExpand)}">${iconSvg("expand", 13)}</button><button type="button" class="icon-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-no-drag="1" title="${escAttr(isPinned ? tr.tooltipPinUnlock : tr.tooltipPinLock)}">${iconSvg("pin", 13)}</button><button type="button" class="icon-btn is-primary" data-action="open-settings" data-no-drag="1" title="${escAttr(tr.tooltipSettings)}">${iconSvg("gear", 13)}</button>`;

    const bodyAttrs = isPreview ? "" : ` data-widget-body="1"${isPinned ? "" : ' data-drag-handle="1"'}`;
    return `<div class="mini-pill"${bodyAttrs}>${grip}${joined}<span class="pill-sep"></span>${btns}</div>`;
  }

  function renderMediumCardMarkup() {
    const tr = t();
    const tel = state.telemetry;
    const isPinned = Boolean(state.settings.pinned);
    const phase = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const chatVal = tel.contextLabel || `~${formatCompact(tel.chatTokens)} ${tr.tokShort}`;
    const respVal = `~${formatCompact(tel.respTokens)} ${tr.tokShort}`;
    const personaName = findActivePresetLabel();
    const personaLabel = state.chatPersona.enabled
      ? `${tr.personaBadgeOn} ${personaName}`
      : tr.personaBadgeOff;
    const langText = state.locale === "en" ? "EN" : "RU";
    const shownTps = getDisplayedTps(tel);
    const shownUnit = getDisplayedTpsUnit(tel, tr);

    return `
      <div class="med-card" data-widget-body="1"${isPinned ? "" : ' data-drag-handle="1"'}>
        <div class="med-header">
          <div class="med-head-left">
            <span class="drag-grip">${iconSvg("grip", 13)}</span>
            <span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>
            <span class="med-phase" data-live="phase">${escHtml(phase)}</span>
          </div>
          <div class="med-head-actions">
            <button type="button" class="lang-pill-btn" data-action="toggle-locale" data-no-drag="1" title="${escAttr(tr.tooltipLang)}">${langText}</button>
            <button type="button" class="icon-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-no-drag="1" title="${escAttr(isPinned ? tr.tooltipPinUnlock : tr.tooltipPinLock)}">${iconSvg("pin", 13)}</button>
            <button type="button" class="icon-btn" data-action="to-mini" data-no-drag="1" title="${escAttr(tr.tooltipMini)}">${iconSvg("minimize", 13)}</button>
            <button type="button" class="icon-btn is-primary" data-action="open-settings" data-no-drag="1" title="${escAttr(tr.tooltipSettings)}">${iconSvg("gear", 13)}</button>
          </div>
        </div>
        <div class="med-body">
          <div class="med-tps-row">
            <div class="med-tps-hero">
              <span class="med-tps-num num" data-live="tps">${shownTps}</span>
              <span class="med-tps-unit" data-live="tpsUnit">${escHtml(shownUnit)}</span>
            </div>
            <span class="med-peak num">${escHtml(tr.peakLabel)}: <b data-live="peak">${tel.peakTps}</b></span>
          </div>
          <div class="med-spark-box" data-live="sparkMed">${buildSparklineMarkup(tel.samples, 260, 42, "med")}</div>
          <div class="med-stats-grid">
            <div class="med-stat-tile">
              <span class="med-stat-label">${escHtml(tr.kpiResp)}</span>
              <span class="med-stat-val num" data-live="resp">${escHtml(respVal)}</span>
            </div>
            <div class="med-stat-tile">
              <span class="med-stat-label">${escHtml(tr.kpiChat)}</span>
              <span class="med-stat-val num" data-live="chat">${escHtml(chatVal)}</span>
            </div>
          </div>
          <div class="med-footer">
            <button type="button" class="med-persona-pill" data-action="open-persona-tab" data-no-drag="1">
              <span class="status-dot" style="background:${state.chatPersona.enabled ? "var(--st-success)" : "var(--st-muted)"}"></span>
              <span>${escHtml(personaLabel)}</span>
            </button>
            <span class="med-model-tag" data-live="model" title="${escAttr(tel.modelName || tr.modelUnknown)}">${escHtml(tel.modelName || "—")}</span>
          </div>
        </div>
      </div>
    `;
  }

  function findActivePresetLabel() {
    const id = state.chatPersona.activePreset;
    for (let i = 0; i < BUILTIN_PERSONA_PRESETS.length; i += 1) {
      if (BUILTIN_PERSONA_PRESETS[i].id === id) {
        return state.locale === "en" ? BUILTIN_PERSONA_PRESETS[i].titleEn : BUILTIN_PERSONA_PRESETS[i].titleRu;
      }
    }
    const customs = state.settings.customPresets || [];
    for (let i = 0; i < customs.length; i += 1) {
      if (customs[i].id === id) return customs[i].title;
    }
    return t().customPresetTitle;
  }

  function renderMonitorTab() {
    const tr = t();
    const tel = state.telemetry;
    const chatVal = tel.contextLabel || `~${formatCompact(tel.chatTokens)} ${tr.tokShort}`;
    const respVal = `~${formatCompact(tel.respTokens)} ${tr.tokShort}`;
    const phase = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const shownTps = getDisplayedTps(tel);
    const shownUnit = getDisplayedTpsUnit(tel, tr);
    return `
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiTps)}</span>
          <span class="kpi-val num"><span data-live="tps">${shownTps}</span> <span style="font-size:12px;color:var(--st-accent)" data-live="tpsUnit">${escHtml(shownUnit)}</span></span>
          <span class="kpi-sub">${escHtml(tel.isGenerating ? tr.statusWriting : tr.statusReady)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiPeak)}</span>
          <span class="kpi-val num" data-live="peak">${tel.peakTps}</span>
          <span class="kpi-sub">TPS max</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiResp)}</span>
          <span class="kpi-val num" data-live="resp">${escHtml(respVal)}</span>
          <span class="kpi-sub">~estimate</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiChat)}</span>
          <span class="kpi-val num" data-live="chat">${escHtml(chatVal)}</span>
          <span class="kpi-sub">context</span>
        </div>
      </div>

      <div class="card card-pad">
        <div class="spark-panel-head">
          <div class="spark-meta">
            <span class="status-pill">
              <span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>
              <span data-live="phase">${escHtml(phase)}</span>
            </span>
            <span class="status-pill" data-live="chatBadge">${escHtml(formatChatBadgeLabel())}</span>
            <span class="status-pill" style="color:var(--st-muted)" data-live="model">${escHtml(tel.modelName || tr.modelUnknown)}</span>
          </div>
          <button type="button" class="btn btn-sm" data-action="reset-telemetry">${iconSvg("reset", 13)}${escHtml(tr.resetStats)}</button>
        </div>
        <div class="modal-spark-box" data-live="sparkModal">${buildSparklineMarkup(tel.samples, 520, 92, "modal")}</div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.historyTitle)}</span>
        <div class="card" data-live="historyList">${renderHistoryInner()}</div>
      </div>
    `;
  }

  function renderHistoryInner() {
    const tr = t();
    if (state.settings.trackHistory === false) {
      return `<div class="card-pad" style="font-size:12.5px;color:var(--st-muted)">${escHtml(tr.historyOff)}</div>`;
    }
    const list = state.telemetry.history || [];
    if (list.length === 0) {
      return `<div class="card-pad" style="font-size:12.5px;color:var(--st-muted)">${escHtml(tr.historyEmpty)}</div>`;
    }
    return list.map((item) => `
      <div class="history-row">
        <span class="history-model">${escHtml(item.model)}</span>
        <span class="history-meta num">${escHtml(item.at)} · ~${formatCompact(item.tokens)} ${escHtml(tr.tokShort)}</span>
        <span class="history-tps num">${item.avgTps} TPS (${escHtml(tr.peakLabel)} ${item.peakTps})</span>
      </div>
    `).join("");
  }

  function renderWidgetTab() {
    const tr = t();
    const s = state.settings;
    const mf = s.miniFields;
    const fieldSpecs = [
      { key: "status", title: tr.fieldStatus, desc: tr.fieldStatusDesc },
      { key: "lang", title: tr.fieldLang, desc: tr.fieldLangDesc },
      { key: "tps", title: tr.fieldTps, desc: tr.fieldTpsDesc },
      { key: "respTokens", title: tr.fieldResp, desc: tr.fieldRespDesc },
      { key: "chatTokens", title: tr.fieldChat, desc: tr.fieldChatDesc },
      { key: "model", title: tr.fieldModel, desc: tr.fieldModelDesc },
    ];
    const docks = [
      { id: "bottom-right", label: tr.dockBottomRight },
      { id: "top-right", label: tr.dockTopRight },
      { id: "middle-right", label: tr.dockMiddleRight },
      { id: "bottom-left", label: tr.dockBottomLeft },
      { id: "hidden", label: tr.dockHidden },
    ];
    const dockStatus = (s.layoutMode === "floating" ? tr.dockStateFloating : tr.dockStateDocked) + (s.pinned ? tr.dockStateLocked : "");

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.previewTitle)}</span>
        <div class="preview-stage" data-live="previewCapsule">${renderMiniCapsuleMarkup(true)}</div>
        <span class="row-desc">${escHtml(tr.previewSub)}</span>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.modeTitle)}</span>
        <div class="segmented-2">
          <button type="button" class="choice-card${s.viewMode === "mini" ? " is-selected" : ""}" data-action="set-view-mode" data-val="mini">
            <span class="choice-title"><span>${escHtml(tr.modeMiniTitle)}</span>${s.viewMode === "mini" ? iconSvg("check", 14) : ""}</span>
            <span class="choice-desc">${escHtml(tr.modeMiniDesc)}</span>
          </button>
          <button type="button" class="choice-card${s.viewMode === "medium" ? " is-selected" : ""}" data-action="set-view-mode" data-val="medium">
            <span class="choice-title"><span>${escHtml(tr.modeMedTitle)}</span>${s.viewMode === "medium" ? iconSvg("check", 14) : ""}</span>
            <span class="choice-desc">${escHtml(tr.modeMedDesc)}</span>
          </button>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.fieldsTitle)}</span>
        <div class="card">
          ${fieldSpecs.map((f) => `
            <div class="row-item">
              <div class="row-info">
                <span class="row-title">${escHtml(f.title)}</span>
                <span class="row-desc">${escHtml(f.desc)}</span>
              </div>
              <button type="button" class="switch${mf[f.key] ? " is-on" : ""}" role="switch" aria-checked="${mf[f.key] ? "true" : "false"}" data-action="toggle-mini-field" data-key="${f.key}">
                <span class="switch-thumb"></span>
              </button>
            </div>
          `).join("")}
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.trackHistoryLabel)}</span>
              <span class="row-desc">${escHtml(tr.trackHistoryDesc)}</span>
            </div>
            <button type="button" class="switch${s.trackHistory !== false ? " is-on" : ""}" role="switch" aria-checked="${s.trackHistory !== false ? "true" : "false"}" data-action="toggle-track-history">
              <span class="switch-thumb"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.dockTitle)}</span>
        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.pinLockLabel)}</span>
              <span class="row-desc">${escHtml(tr.pinLockDesc)}</span>
            </div>
            <button type="button" class="switch${s.pinned ? " is-on" : ""}" role="switch" aria-checked="${s.pinned ? "true" : "false"}" data-action="toggle-pin">
              <span class="switch-thumb"></span>
            </button>
          </div>
        </div>
        <div class="dock-grid">
          ${docks.map((d) => `
            <button type="button" class="dock-btn${s.dockPosition === d.id && s.layoutMode !== "floating" ? " is-selected" : ""}" data-action="set-dock" data-val="${d.id}">${escHtml(d.label)}</button>
          `).join("")}
        </div>
        <div class="dock-bar">
          <span style="color:var(--st-muted)">${escHtml(dockStatus)}</span>
          <button type="button" class="btn btn-sm" data-action="reset-position">${iconSvg("reset", 13)}${escHtml(tr.dockResetBtn)}</button>
        </div>
        <span class="row-desc">${escHtml(tr.dockHiddenHint)}</span>
      </div>
    `;
  }

  function renderPersonaTab() {
    const tr = t();
    const s = state.settings;
    const cp = state.chatPersona;
    const bytes = utf8ByteLength(state.draftPersonaText);
    const overWarn = bytes >= 20000;
    const customs = s.customPresets || [];

    return `
      <div class="persona-stack">
      <div class="spark-meta">
        <span class="status-pill" data-live="chatBadge">
          <span class="status-dot" style="background:${state.activeChatKey === "__new__" ? "var(--st-muted)" : "var(--st-accent)"}"></span>
          <span>${escHtml(formatChatBadgeLabel())}</span>
        </span>
        <span class="row-desc">${escHtml(tr.chatScopeHint)}</span>
      </div>
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${escHtml(tr.personaMasterTitle)}</span>
            <span class="row-desc">${escHtml(tr.personaMasterDesc)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="${cp.enabled ? "badge-active" : "nav-badge"}">${escHtml(cp.enabled ? tr.personaActiveTag : tr.personaOffTag)}</span>
            <button type="button" class="switch${cp.enabled ? " is-on" : ""}" role="switch" aria-checked="${cp.enabled ? "true" : "false"}" data-action="toggle-persona-enabled">
              <span class="switch-thumb"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.personaPresetsLabel)}</span>
        <div class="preset-strip">
          ${BUILTIN_PERSONA_PRESETS.map((p) => {
            const title = state.locale === "en" ? p.titleEn : p.titleRu;
            const desc = state.locale === "en" ? p.descEn : p.descRu;
            const selected = cp.activePreset === p.id;
            return `
              <div class="preset-card${selected ? " is-selected" : ""}" data-action="select-preset" data-id="${escAttr(p.id)}">
                <div class="preset-head"><span class="preset-name">${escHtml(title)}</span>${selected ? iconSvg("check", 13) : ""}</div>
                <span class="preset-desc">${escHtml(desc)}</span>
              </div>
            `;
          }).join("")}
          ${customs.map((item) => {
            const selected = cp.activePreset === item.id;
            return `
              <div class="preset-card${selected ? " is-selected" : ""}" data-action="select-preset" data-id="${escAttr(item.id)}">
                <div class="preset-head">
                  <span class="preset-name">${escHtml(item.title)}</span>
                  <button type="button" class="preset-del-btn" data-action="delete-custom-preset" data-id="${escAttr(item.id)}" title="Delete">${iconSvg("trash", 12)}</button>
                </div>
                <span class="preset-desc">${escHtml(tr.personaCustomLabel)}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <div class="editor-meta-row">
          <span class="section-label">${escHtml(tr.personaEditorLabel)}</span>
          <span class="num" data-role="byteCounter" style="color:${overWarn ? "var(--st-warning)" : "var(--st-muted)"}">${bytes.toLocaleString()} / ${MAX_PERSONA_BODY_BYTES.toLocaleString()} ${escHtml(tr.personaBytes)}${overWarn ? " · " + escHtml(tr.personaLimitWarn) : ""}</span>
        </div>
        <textarea class="editor-box" data-role="personaEditor" spellcheck="false">${escHtml(state.draftPersonaText)}</textarea>
      </div>

      <div class="preset-add-row">
        <input type="text" class="text-input" data-role="newPresetInput" maxlength="44" value="${escAttr(state.newPresetName)}" placeholder="${escAttr(tr.personaSavePresetPlaceholder)}"/>
        <button type="button" class="btn btn-sm" data-action="save-custom-preset">${iconSvg("plus", 13)}${escHtml(tr.personaAddPresetBtn)}</button>
      </div>

      <div class="action-bar">
        <div class="action-btns">
          <button type="button" class="btn btn-primary" data-action="save-persona">${iconSvg("check", 14)}${escHtml(tr.personaApplyBtn)}</button>
          <button type="button" class="btn" data-action="clear-persona">${escHtml(tr.personaClearBtn)}</button>
        </div>
        <span class="toast-text${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>
      </div>

      <div class="row-desc" style="font-family:var(--st-mono);font-size:11px;word-break:break-all">
        ${escHtml(tr.personaRulePathLabel)} ${escHtml(state.personaFilePath)}
      </div>
      </div>
    `;
  }

  function renderLanguageTab() {
    const tr = t();
    const isRu = state.locale !== "en";
    const ver = pluginMeta.version || "2.3.0";
    const dictCount = pluginMeta.dictEntries || 4017;
    const dynCount = pluginMeta.dynamicRulesCount || 471;

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.langCardsTitle)}</span>
        <div class="segmented-2">
          <button type="button" class="choice-card${isRu ? " is-selected" : ""}" data-action="set-locale" data-val="ru">
            <span class="choice-title"><span>${escHtml(tr.langRuTitle)}</span>${isRu ? `<span class="badge-active">${escHtml(tr.langActiveBadge)}</span>` : ""}</span>
            <span class="choice-desc">${escHtml(tr.langRuDesc)}</span>
          </button>
          <button type="button" class="choice-card${!isRu ? " is-selected" : ""}" data-action="set-locale" data-val="en">
            <span class="choice-title"><span>${escHtml(tr.langEnTitle)}</span>${!isRu ? `<span class="badge-active">${escHtml(tr.langActiveBadge)}</span>` : ""}</span>
            <span class="choice-desc">${escHtml(tr.langEnDesc)}</span>
          </button>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.hotkeysTitle)}</span>
        <div class="card">
          <div class="row-item"><span class="row-title">${escHtml(tr.hkToggleLang)}</span><span class="kbd">Ctrl + Alt + L</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkToggleModal)}</span><span class="kbd">Ctrl + Alt + P</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkDoubleClick)}</span><span class="kbd">${escHtml(tr.hkDoubleClickKey)}</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkEsc)}</span><span class="kbd">Esc</span></div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.pluginInfoTitle)}</span>
        <div class="card">
          <div class="row-item"><span class="row-title">${escHtml(tr.pluginVersion)}</span><span class="kbd num">v${escHtml(ver)}</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.pluginDict)}</span><span class="row-title num">${Number(dictCount).toLocaleString()}</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.pluginRules)}</span><span class="row-title num">${Number(dynCount).toLocaleString()}</span></div>
          <div class="row-item">
            <span class="row-title">${escHtml(tr.pluginRepo)}</span>
            <a class="repo-link" href="https://github.com/Ivan0967pro/antigravity-ru" target="_blank" rel="noopener noreferrer">Ivan0967pro/antigravity-ru ${iconSvg("external", 13)}</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderAppearanceTab() {
    const tr = t();
    const cards = [
      { ic: "palette", title: tr.stage2ThemesTitle, desc: tr.stage2ThemesDesc },
      { ic: "sparkles", title: tr.stage2WallsTitle, desc: tr.stage2WallsDesc },
      { ic: "sliders", title: tr.stage2FontsTitle, desc: tr.stage2FontsDesc },
    ];
    return `
      <div class="roadmap-banner">
        <span class="row-title" style="font-size:14px">${escHtml(tr.stage2BannerTitle)}</span>
        <span class="row-desc" style="color:var(--st-fg)">${escHtml(tr.stage2BannerDesc)}</span>
      </div>
      <div class="roadmap-grid">
        ${cards.map((c) => `
          <div class="roadmap-card">
            <span class="roadmap-ic">${iconSvg(c.ic, 16)}</span>
            <div class="row-info">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="row-title">${escHtml(c.title)}</span>
                <span class="nav-badge">${escHtml(tr.stage2Pill)}</span>
              </div>
              <span class="row-desc">${escHtml(c.desc)}</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderModalShell() {
    if (!state.isOpen) return "";
    const tr = t();
    const tabs = [
      { id: "monitor", label: tr.navMonitor, ic: "activity", title: tr.modalTitleMonitor, sub: tr.modalSubMonitor },
      { id: "widget", label: tr.navWidget, ic: "sliders", title: tr.modalTitleWidget, sub: tr.modalSubWidget },
      { id: "persona", label: tr.navPersona, ic: "sparkles", title: tr.modalTitlePersona, sub: tr.modalSubPersona, dot: state.chatPersona.enabled },
      { id: "language", label: tr.navLanguage, ic: "globe", title: tr.modalTitleLanguage, sub: tr.modalSubLanguage },
      { id: "appearance", label: tr.navAppearance, ic: "palette", title: tr.modalTitleAppearance, sub: tr.modalSubAppearance, badge: tr.stage2Pill },
    ];
    const current = tabs.find((x) => x.id === state.activeTab) || tabs[0];
    let bodyHtml = "";
    if (current.id === "monitor") bodyHtml = renderMonitorTab();
    else if (current.id === "widget") bodyHtml = renderWidgetTab();
    else if (current.id === "persona") bodyHtml = renderPersonaTab();
    else if (current.id === "language") bodyHtml = renderLanguageTab();
    else bodyHtml = renderAppearanceTab();

    return `
      <div class="modal-backdrop" data-action="backdrop-close">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${escAttr(tr.brandTitle)}">
          <aside class="modal-sidebar">
            <div class="sidebar-brand">
              <span class="brand-title">${escHtml(tr.brandTitle)}</span>
              <span class="brand-ver num">v${escHtml(pluginMeta.version || "2.3.0")}</span>
            </div>
            <nav class="nav-list">
              ${tabs.map((tb) => `
                <button type="button" class="nav-item${tb.id === current.id ? " is-active" : ""}" data-action="switch-tab" data-tab="${tb.id}">
                  <span class="nav-ic">${iconSvg(tb.ic, 15)}</span>
                  <span class="nav-label">${escHtml(tb.label)}</span>
                  ${tb.dot ? '<span class="nav-dot"></span>' : ""}
                  ${tb.badge ? `<span class="nav-badge">${escHtml(tb.badge)}</span>` : ""}
                </button>
              `).join("")}
            </nav>
            <div class="sidebar-foot">
              <span>${escHtml(tr.sidebarFooterHint)}</span>
              <span class="kbd">Ctrl+Alt+P</span>
            </div>
          </aside>
          <section class="modal-main">
            <header class="modal-header">
              <div>
                <h2 class="modal-title">${escHtml(current.title)}</h2>
                <p class="modal-sub">${escHtml(current.sub)}</p>
              </div>
              <button type="button" class="modal-close-btn" data-action="close-modal" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 16)}</button>
            </header>
            <div class="modal-body">${bodyHtml}</div>
          </section>
        </div>
      </div>
    `;
  }

  function applyWidgetPosition() {
    if (!widgetMountEl) return;
    const s = state.settings;
    const dock = normalizeDockPosition(s.dockPosition);
    const shouldHide = dock === "hidden";
    const lockedCls = s.pinned ? " is-locked" : "";
    widgetMountEl.className = "widget-wrap" + lockedCls + (shouldHide ? " is-hidden" : "");

    if (shouldHide) {
      widgetMountEl.style.left = "";
      widgetMountEl.style.top = "";
      widgetMountEl.style.right = "";
      widgetMountEl.style.bottom = "";
      return;
    }

    if (s.layoutMode === "floating" && typeof s.floatX === "number" && typeof s.floatY === "number") {
      widgetMountEl.style.right = "";
      widgetMountEl.style.bottom = "";
      widgetMountEl.style.left = `${Math.max(8, Math.round(s.floatX))}px`;
      widgetMountEl.style.top = `${Math.max(8, Math.round(s.floatY))}px`;
      clampWidgetToViewport();
    } else {
      widgetMountEl.style.left = "";
      widgetMountEl.style.top = "";
      widgetMountEl.style.right = "";
      widgetMountEl.style.bottom = "";
      widgetMountEl.className = `widget-wrap dock-${dock}${lockedCls}`;
    }
  }

  function clampWidgetToViewport() {
    if (!widgetMountEl || !win || state.settings.layoutMode !== "floating") return;
    try {
      const vw = Number(win.innerWidth) || 0;
      const vh = Number(win.innerHeight) || 0;
      if (vw <= 40 || vh <= 40) return;
      const rect = typeof widgetMountEl.getBoundingClientRect === "function"
        ? widgetMountEl.getBoundingClientRect()
        : null;
      const w = rect && rect.width ? rect.width : 240;
      const h = rect && rect.height ? rect.height : 40;
      const maxX = Math.max(8, vw - w - 8);
      const maxY = Math.max(8, vh - h - 8);
      const curX = typeof state.settings.floatX === "number" ? state.settings.floatX : 18;
      const curY = typeof state.settings.floatY === "number" ? state.settings.floatY : 18;
      const nextX = Math.min(maxX, Math.max(8, Math.round(curX)));
      const nextY = Math.min(maxY, Math.max(8, Math.round(curY)));
      state.settings.floatX = nextX;
      state.settings.floatY = nextY;
      widgetMountEl.style.left = `${nextX}px`;
      widgetMountEl.style.top = `${nextY}px`;
    } catch (_e) {}
  }

  function setLiveSlot(container, selector, val, isHtml) {
    if (!container || typeof container.querySelectorAll !== "function") return;
    const els = container.querySelectorAll(selector);
    for (let i = 0; i < els.length; i += 1) {
      if (isHtml) els[i].innerHTML = val;
      else els[i].textContent = val;
    }
  }

  function updateHistoryDom() {
    if (!modalMountEl) return;
    setLiveSlot(modalMountEl, '[data-live="historyList"]', renderHistoryInner(), true);
  }

  function updateLiveDom() {
    const tr = t();
    const tel = state.telemetry;
    const tpsText = String(getDisplayedTps(tel));
    const tpsUnitText = getDisplayedTpsUnit(tel, tr);
    const respText = `~${formatCompact(tel.respTokens)} ${tr.tokShort}`;
    const miniRespText = `~${formatCompact(tel.respTokens)}`;
    const chatText = tel.contextLabel || `~${formatCompact(tel.chatTokens)}`;
    const fullChatText = tel.contextLabel || `~${formatCompact(tel.chatTokens)} ${tr.tokShort}`;
    const statusText = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.statusWriting : tr.statusReady);
    const phaseText = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const modelText = tel.modelName || tr.modelUnknown;

    const containers = [widgetMountEl, modalMountEl].filter(Boolean);
    for (let i = 0; i < containers.length; i += 1) {
      const box = containers[i];
      if (typeof box.querySelectorAll !== "function") continue;
      const dots = box.querySelectorAll('[data-live="dot"]');
      for (let d = 0; d < dots.length; d += 1) {
        dots[d].className = "status-dot" + (tel.isGenerating ? " is-live" : "");
      }
      setLiveSlot(box, '[data-live="tps"]', tpsText, false);
      setLiveSlot(box, '[data-live="tpsUnit"]', tpsUnitText, false);
      setLiveSlot(box, '[data-live="statusText"]', statusText, false);
      setLiveSlot(box, '[data-live="phase"]', phaseText, false);
      setLiveSlot(box, '[data-live="peak"]', String(tel.peakTps), false);
    }

    if (widgetMountEl) {
      setLiveSlot(widgetMountEl, '[data-live="resp"]', state.settings.viewMode === "mini" ? miniRespText : respText, false);
      setLiveSlot(widgetMountEl, '[data-live="chat"]', state.settings.viewMode === "mini" ? chatText : fullChatText, false);
      setLiveSlot(widgetMountEl, '[data-live="model"]', tel.modelName || (state.settings.viewMode === "mini" ? "AI" : "—"), false);
      setLiveSlot(widgetMountEl, '[data-live="sparkMed"]', buildSparklineMarkup(tel.samples, 260, 42, "med"), true);
    }

    if (modalMountEl && state.isOpen) {
      setLiveSlot(modalMountEl, '[data-live="resp"]', respText, false);
      setLiveSlot(modalMountEl, '[data-live="chat"]', fullChatText, false);
      setLiveSlot(modalMountEl, '[data-live="model"]', modelText, false);
      setLiveSlot(modalMountEl, '[data-live="sparkModal"]', buildSparklineMarkup(tel.samples, 520, 92, "modal"), true);
      if (state.activeTab === "widget") {
        setLiveSlot(modalMountEl, '[data-live="previewCapsule"]', renderMiniCapsuleMarkup(true), true);
      }
    }
  }

  function renderStructure() {
    if (!rootEl || state.destroyed) return;
    syncTheme();
    if (widgetMountEl) {
      widgetMountEl.innerHTML = state.settings.viewMode === "medium"
        ? renderMediumCardMarkup()
        : renderMiniCapsuleMarkup(false);
      applyWidgetPosition();
    }
    if (modalMountEl) {
      modalMountEl.innerHTML = state.isOpen ? renderModalShell() : "";
    }
  }

  function selectPreset(id) {
    let body = null;
    for (let i = 0; i < BUILTIN_PERSONA_PRESETS.length; i += 1) {
      if (BUILTIN_PERSONA_PRESETS[i].id === id) {
        body = BUILTIN_PERSONA_PRESETS[i].body;
        break;
      }
    }
    if (body === null) {
      const customs = state.settings.customPresets || [];
      for (let i = 0; i < customs.length; i += 1) {
        if (customs[i].id === id) {
          body = customs[i].body;
          break;
        }
      }
    }
    if (body === null) return;
    state.chatPersona.activePreset = id;
    state.draftPersonaText = body;
    state.draftDirty = true;
    renderStructure();
  }

  function persistPersona(enabledOverride) {
    const nextEnabled = typeof enabledOverride === "boolean" ? enabledOverride : state.chatPersona.enabled;
    const presetId = state.chatPersona.activePreset || "custom";
    const textVal = state.draftPersonaText;
    const targetChatKey = state.activeChatKey || "__new__";
    const targetChatTitle = state.activeChatTitle || "";
    const tr = t();

    if (targetChatKey === "__new__") {
      state.newChatDraftPersona = nextEnabled && textVal.trim()
        ? { personaEnabled: true, personaActivePreset: presetId, personaText: textVal }
        : null;
    }

    return invokeIpc("agy-studio:save-persona", {
      chatKey: targetChatKey,
      title: targetChatTitle,
      personaEnabled: nextEnabled,
      personaText: textVal,
      personaActivePreset: presetId,
      customPresets: state.settings.customPresets || [],
    }).then((res) => {
      state.draftDirty = false;
      if (res && res.state) applyRemoteState(res.state, true);
      if (res && res.chat && targetChatKey === state.activeChatKey) {
        state.chatPersona = {
          enabled: Boolean(res.chat.personaEnabled),
          activePreset: res.chat.personaActivePreset || presetId,
          text: typeof res.chat.personaText === "string" ? res.chat.personaText : textVal,
        };
        if (typeof res.exists === "boolean") state.personaFileExists = res.exists;
        if (typeof res.rulePath === "string" && res.rulePath) state.personaFilePath = res.rulePath;
        renderStructure();
      }
      if (res && res.ok === false) {
        const errMsg = res.error === "EXCEEDS_BYTE_LIMIT" ? tr.personaTooLargeErr : (res.error || tr.personaWriteErr);
        setToast(errMsg, true);
      } else if (nextEnabled) {
        if (res && res.exists) {
          setToast(tr.personaSavedMsg, false);
        } else {
          setToast(tr.personaWriteErr, true);
        }
      } else {
        setToast(textVal.trim() ? tr.personaDisabledMsg : tr.personaClearedMsg, false);
      }
      return res;
    });
  }

  function handleActionClick(targetEl) {
    if (!targetEl || typeof targetEl.closest !== "function") return;
    const actionEl = targetEl.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-action");
    const tr = t();

    if (action === "backdrop-close") {
      if (targetEl === actionEl) setOpen(false);
      return;
    }
    if (action === "close-modal") {
      setOpen(false);
      return;
    }
    if (action === "open-settings") {
      setOpen(true);
      return;
    }
    if (action === "open-persona-tab") {
      state.activeTab = "persona";
      setOpen(true);
      return;
    }
    if (action === "switch-tab") {
      const tab = actionEl.getAttribute("data-tab") || "monitor";
      state.activeTab = tab;
      renderStructure();
      return;
    }
    if (action === "to-medium") {
      setViewMode("medium");
      return;
    }
    if (action === "to-mini") {
      setViewMode("mini");
      return;
    }
    if (action === "set-view-mode") {
      setViewMode(actionEl.getAttribute("data-val") === "medium" ? "medium" : "mini");
      return;
    }
    if (action === "toggle-locale") {
      const next = state.locale === "ru" ? "en" : "ru";
      setLocale(next);
      invokeIpc("agy-i18n:set-locale", next);
      return;
    }
    if (action === "set-locale") {
      const next = actionEl.getAttribute("data-val") === "en" ? "en" : "ru";
      if (next !== state.locale) {
        setLocale(next);
        invokeIpc("agy-i18n:set-locale", next);
      }
      return;
    }
    if (action === "toggle-mini-field") {
      const key = actionEl.getAttribute("data-key");
      if (MINI_FIELD_KEYS.indexOf(key) >= 0) {
        const nextFields = Object.assign({}, state.settings.miniFields);
        nextFields[key] = !nextFields[key];
        saveSettingsPatch({ miniFields: nextFields });
      }
      return;
    }
    if (action === "toggle-track-history") {
      saveSettingsPatch({ trackHistory: state.settings.trackHistory === false });
      return;
    }
    if (action === "set-dock") {
      const dock = normalizeDockPosition(actionEl.getAttribute("data-val"));
      saveSettingsPatch({ dockPosition: dock, layoutMode: "docked", floatX: null, floatY: null });
      return;
    }
    if (action === "toggle-pin") {
      saveSettingsPatch({ pinned: !state.settings.pinned });
      return;
    }
    if (action === "reset-position") {
      const dock = state.settings.dockPosition === "hidden" ? "bottom-right" : state.settings.dockPosition;
      saveSettingsPatch({ dockPosition: dock, layoutMode: "docked", floatX: null, floatY: null });
      return;
    }
    if (action === "reset-telemetry") {
      state.telemetry.currentTps = 0;
      state.telemetry.lastAvgTps = 0;
      state.telemetry.peakTps = 0;
      state.telemetry.samples = [];
      state.telemetry.history = [];
      state.telemetry.dirty = false;
      updateLiveDom();
      updateHistoryDom();
      if (state.activeChatKey && state.activeChatKey !== "__new__") {
        invokeIpc("agy-studio:reset-chat-telemetry", { chatKey: state.activeChatKey });
      }
      return;
    }
    if (action === "toggle-persona-enabled") {
      const next = !state.chatPersona.enabled;
      if (next && !state.draftPersonaText.trim()) {
        setToast(tr.personaEmptyWarn, true);
        return;
      }
      state.chatPersona.enabled = next;
      renderStructure();
      persistPersona(next);
      return;
    }
    if (action === "select-preset") {
      if (targetEl.closest && targetEl.closest('[data-action="delete-custom-preset"]')) return;
      selectPreset(actionEl.getAttribute("data-id") || "");
      return;
    }
    if (action === "delete-custom-preset") {
      const id = actionEl.getAttribute("data-id");
      const next = (state.settings.customPresets || []).filter((p) => p.id !== id);
      if (state.chatPersona.activePreset === id) state.chatPersona.activePreset = "custom";
      saveSettingsPatch({ customPresets: next });
      setToast(tr.personaDeletedPreset, false);
      return;
    }
    if (action === "save-custom-preset") {
      const title = String(state.newPresetName || "").trim().slice(0, 44);
      const body = String(state.draftPersonaText || "").trim();
      if (!title || !body) return;
      const id = "custom-" + Date.now();
      const next = (state.settings.customPresets || []).concat([{ id, title, body }]).slice(-16);
      state.newPresetName = "";
      state.chatPersona.activePreset = id;
      saveSettingsPatch({ customPresets: next });
      return;
    }
    if (action === "save-persona") {
      const hasText = Boolean(state.draftPersonaText.trim());
      state.chatPersona.enabled = hasText;
      persistPersona(hasText);
      return;
    }
    if (action === "clear-persona") {
      state.draftPersonaText = "";
      state.draftDirty = true;
      state.chatPersona.enabled = false;
      state.chatPersona.activePreset = "custom";
      renderStructure();
      persistPersona(false);
    }
  }

  function handlePointerDown(e) {
    if (!widgetMountEl || !e || e.button !== 0 || state.settings.pinned) return;
    const tEl = e.target;
    if (!tEl || typeof tEl.closest !== "function") return;
    if (tEl.closest('[data-no-drag="1"]') || tEl.closest("button")) return;
    const handle = tEl.closest('[data-drag-handle="1"]');
    if (!handle) return;

    const rect = typeof widgetMountEl.getBoundingClientRect === "function"
      ? widgetMountEl.getBoundingClientRect()
      : { left: 16, top: 16, width: 220, height: 36 };
    dragState = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      width: rect.width || 220,
      height: rect.height || 36,
      lastX: rect.left,
      lastY: rect.top,
      moved: false,
    };
  }

  function handlePointerMove(e) {
    if (!dragState || !widgetMountEl || state.settings.pinned) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) < 6) return;

    if (!dragState.moved) {
      dragState.moved = true;
      widgetMountEl.className = "widget-wrap is-dragging";
      widgetMountEl.style.right = "";
      widgetMountEl.style.bottom = "";
    }
    const vw = win && win.innerWidth ? win.innerWidth : 1280;
    const vh = win && win.innerHeight ? win.innerHeight : 800;
    const maxX = Math.max(8, vw - dragState.width - 8);
    const maxY = Math.max(8, vh - dragState.height - 8);
    const nextX = Math.min(maxX, Math.max(8, Math.round(dragState.origLeft + dx)));
    const nextY = Math.min(maxY, Math.max(8, Math.round(dragState.origTop + dy)));
    dragState.lastX = nextX;
    dragState.lastY = nextY;
    widgetMountEl.style.left = `${nextX}px`;
    widgetMountEl.style.top = `${nextY}px`;
  }

  function handlePointerUp() {
    if (!dragState) return;
    const wasMoved = dragState.moved;
    const finalX = dragState.lastX;
    const finalY = dragState.lastY;
    dragState = null;
    if (wasMoved && widgetMountEl) {
      lastDragEndedAt = Date.now();
      if (widgetMountEl.classList && typeof widgetMountEl.classList.remove === "function") {
        widgetMountEl.classList.remove("is-dragging");
      }
      saveSettingsPatch({ layoutMode: "floating", floatX: finalX, floatY: finalY });
    }
  }

  function attachDomEvents() {
    if (!rootEl) return;
    rootEl.addEventListener("click", (e) => {
      const target = e ? e.target : null;
      if (!target) return;
      if (typeof target.closest === "function") {
        if (target.closest("[data-action]") || target.closest("button") || target.closest('[data-no-drag="1"]')) {
          handleActionClick(target);
          return;
        }
        if (target.closest('[data-widget-body="1"]') && Date.now() - lastDragEndedAt > 250) {
          if (state.settings.pinned) {
            lastBodyClickAt = 0;
            setOpen(true);
          } else {
            const now = Date.now();
            if (now - lastBodyClickAt <= 380) {
              lastBodyClickAt = 0;
              setOpen(true);
            } else {
              lastBodyClickAt = now;
            }
          }
          return;
        }
      }
      handleActionClick(target);
    });
    rootEl.addEventListener("input", (e) => {
      const target = e.target;
      if (!target || typeof target.getAttribute !== "function") return;
      const role = target.getAttribute("data-role");
      if (role === "personaEditor") {
        state.draftPersonaText = target.value || "";
        state.draftDirty = true;
        const counter = modalMountEl ? modalMountEl.querySelector('[data-role="byteCounter"]') : null;
        if (counter) {
          const bytes = utf8ByteLength(state.draftPersonaText);
          const warn = bytes >= 20000;
          const tr = t();
          counter.textContent = `${bytes.toLocaleString()} / ${MAX_PERSONA_BODY_BYTES.toLocaleString()} ${tr.personaBytes}${warn ? " · " + tr.personaLimitWarn : ""}`;
          counter.style.color = warn ? "var(--st-warning)" : "var(--st-muted)";
        }
      } else if (role === "newPresetInput") {
        state.newPresetName = target.value || "";
      }
    });
    if (widgetMountEl) {
      widgetMountEl.addEventListener("mousedown", handlePointerDown);
    }
    if (win && typeof win.addEventListener === "function") {
      win.addEventListener("mousemove", handlePointerMove);
      win.addEventListener("mouseup", handlePointerUp);
      resizeHandler = () => clampWidgetToViewport();
      win.addEventListener("resize", resizeHandler);
    }
    if (doc && typeof doc.addEventListener === "function") {
      keydownHandler = (e) => {
        if (e && e.key === "Escape" && state.isOpen) {
          setOpen(false);
        }
      };
      doc.addEventListener("keydown", keydownHandler, true);
    }
  }

  function init() {
    if (state.initialized || state.destroyed || !doc) return;
    const mountTarget = doc.body || doc.documentElement;
    if (!mountTarget || typeof doc.createElement !== "function") return;

    const existing = typeof doc.getElementById === "function" ? doc.getElementById("agy-ru-studio-host") : null;
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    hostEl = doc.createElement("div");
    hostEl.id = "agy-ru-studio-host";
    hostEl.setAttribute("data-agy-ru-ignore", "1");
    mountTarget.appendChild(hostEl);

    if (typeof hostEl.attachShadow === "function") {
      shadowRoot = hostEl.attachShadow({ mode: "open" });
    } else {
      shadowRoot = hostEl;
    }

    styleEl = doc.createElement("style");
    styleEl.textContent = buildStyles();
    rootEl = doc.createElement("div");
    rootEl.className = "studio-root";
    widgetMountEl = doc.createElement("div");
    widgetMountEl.className = "widget-wrap";
    modalMountEl = doc.createElement("div");
    modalMountEl.className = "modal-mount";

    rootEl.appendChild(widgetMountEl);
    rootEl.appendChild(modalMountEl);
    shadowRoot.appendChild(styleEl);
    shadowRoot.appendChild(rootEl);

    attachDomEvents();
    state.initialized = true;
    renderStructure();
    pollStream();

    if (win && typeof win.setInterval === "function") {
      pollTimer = win.setInterval(() => pollStream(), 200);
    }

    if (typeof win !== "undefined" && typeof win.MutationObserver === "function" && doc.body) {
      try {
        domObserver = new win.MutationObserver((muts) => {
          if (state.destroyed) return;
          if (Array.isArray(muts) && muts.length > 0) {
            let allOwn = true;
            for (let i = 0; i < muts.length; i += 1) {
              const tNode = muts[i] && muts[i].target;
              if (!tNode) continue;
              if (tNode !== hostEl && (!hostEl || typeof hostEl.contains !== "function" || !hostEl.contains(tNode))) {
                allOwn = false;
                break;
              }
            }
            if (allOwn) return;
          }
          if (!throttleTimer && win && typeof win.setTimeout === "function") {
            throttleTimer = win.setTimeout(() => {
              throttleTimer = null;
              pollStream();
            }, 120);
          }
        });
        domObserver.observe(doc.body, { childList: true, subtree: true, characterData: true });
      } catch (_e) {}
    }

    if (typeof win !== "undefined" && typeof win.MutationObserver === "function" && doc.documentElement) {
      try {
        themeObserver = new win.MutationObserver(() => syncTheme());
        themeObserver.observe(doc.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
      } catch (_e) {}
    }

    invokeIpc("agy-studio:get-state").then((remote) => {
      if (remote) applyRemoteState(remote, true);
    });
  }

  function setOpen(nextOpen) {
    state.isOpen = Boolean(nextOpen);
    renderStructure();
  }

  function toggleOpen() {
    setOpen(!state.isOpen);
  }

  function setViewMode(mode) {
    saveSettingsPatch({ viewMode: normalizeViewMode(mode) });
  }

  function setLocale(nextLocale) {
    state.locale = nextLocale === "en" ? "en" : "ru";
    renderStructure();
  }

  function destroy() {
    state.destroyed = true;
    if (pollTimer && win && typeof win.clearInterval === "function") {
      win.clearInterval(pollTimer);
      pollTimer = null;
    }
    if (throttleTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(throttleTimer);
      throttleTimer = null;
    }
    if (toastTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(toastTimer);
      toastTimer = null;
    }
    if (domObserver && typeof domObserver.disconnect === "function") {
      domObserver.disconnect();
      domObserver = null;
    }
    if (themeObserver && typeof themeObserver.disconnect === "function") {
      themeObserver.disconnect();
      themeObserver = null;
    }
    if (win && typeof win.removeEventListener === "function") {
      win.removeEventListener("mousemove", handlePointerMove);
      win.removeEventListener("mouseup", handlePointerUp);
      if (resizeHandler) win.removeEventListener("resize", resizeHandler);
    }
    if (doc && typeof doc.removeEventListener === "function" && keydownHandler) {
      doc.removeEventListener("keydown", keydownHandler, true);
    }
    if (hostEl && hostEl.parentNode) {
      hostEl.parentNode.removeChild(hostEl);
    }
    hostEl = null;
    shadowRoot = null;
    rootEl = null;
    widgetMountEl = null;
    modalMountEl = null;
  }

  return {
    init,
    destroy,
    setOpen,
    toggleOpen,
    setViewMode,
    setLocale,
    applyRemoteState,
    estimateTokens,
    pollStream,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    createStudioPanel,
    estimateTokens,
    BUILTIN_PERSONA_PRESETS,
  };
}
