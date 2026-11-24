"use strict";

const MAX_PERSONA_BODY_BYTES = 23000;
const DOCK_POSITIONS = ["bottom-right", "top-right", "middle-right", "bottom-left", "hidden"];
const MINI_FIELD_KEYS = ["status", "lang", "tps", "respTokens", "chatTokens", "model", "quota"];
const DEFAULT_MINI_FIELDS = {
  status: true,
  lang: true,
  tps: true,
  respTokens: false,
  chatTokens: false,
  model: false,
  quota: false,
};

const CURATED_ACCENTS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#ef4444"];

const GREETING_QUICK_PRESETS = {
  ru: [
    { id: "time", label: "По времени", mode: "time-of-day", title: "{time}, {name}", subtitle: "" },
    { id: "short", label: "Коротко", mode: "custom", title: "Привет, {name}", subtitle: "" },
    { id: "focus", label: "Фокус", mode: "custom", title: "{weekday} · В работе", subtitle: "{date}" },
    { id: "zen", label: "Минимализм", mode: "minimal", title: "Готов.", subtitle: "" },
  ],
  en: [
    { id: "time", label: "Time of day", mode: "time-of-day", title: "{time}, {name}", subtitle: "" },
    { id: "short", label: "Short", mode: "custom", title: "Hey, {name}", subtitle: "" },
    { id: "focus", label: "Focus", mode: "custom", title: "{weekday} · Ready", subtitle: "{date}" },
    { id: "zen", label: "Minimal", mode: "minimal", title: "Ready.", subtitle: "" },
  ],
};

const ICON_PATHS = {
  grip: '<circle cx="9" cy="6" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.15" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.15" fill="currentColor" stroke="none"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  expand: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
  minimize: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  back: '<polyline points="15 18 9 12 15 6"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".75" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".75" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".75" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".75" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
};

const TEXT = {
  ru: {
    brandTitle: "Rudex",
    navMonitor: "Монитор",
    navAppearance: "Оформление",
    navPersona: "Характер",
    navSupplements: "Дополнения",
    navSettings: "Настройки",
    modalTitleMonitor: "Монитор генерации",
    modalSubMonitor: "Скорость потока (TPS) и объём контекста в активном чате",
    modalTitleAppearance: "Оформление",
    modalSubAppearance: "Живой предпросмотр прямо на чате",
    modalTitlePersona: "Характер агента",
    modalSubPersona: "Персональная инструкция для текущего чата",
    modalTitleSupplements: "Дополнения агенту",
    modalSubSupplements: "Указания и фото во время работы без отмены задачи",
    modalTitleSettings: "Настройки",
    modalSubSettings: "Виджет, экспорт чата в ZIP, лимиты и язык",
    backToSettings: "Назад",
    appSubTheme: "Тема",
    appSubWallpaper: "Обои",
    appSubGreeting: "Приветствие",
    appSubText: "Текст",
    setSubWidget: "Виджет",
    setSubExport: "Экспорт и лимиты",
    setSubSystem: "Система",
    appThemesTitle: "Палитра",
    appAccentQuick: "Акцент",
    appCustomColor: "Свой",
    appFineTune: "Тонкая настройка",
    appCanvasColor: "Фон окна",
    appCardColor: "Фон карточек",
    appRadius: "Скругление",
    appPolishLabel: "Мягкие скроллбары и фокус",
    appWpNone: "Нет",
    appWpGradient: "Градиент",
    appWpImage: "Фото",
    appWpVideo: "Видео",
    appWpNoneHint: "Используется чистый фон выбранной темы без подложки.",
    appWpPickImage: "Выбрать фото…",
    appWpPickVideo: "Выбрать видео…",
    appWpClearMedia: "Убрать",
    appWpNoFileHint: "PNG, JPG, WebP или зацикленное видео MP4/WebM",
    appWpAnimated: "Плавная анимация",
    appWpDim: "Затемнение",
    appWpBlur: "Размытие",
    appWpOpacity: "Яркость",
    appWpScale: "Масштаб",
    appWpSpeed: "Скорость",
    appWpAngle: "Угол",
    appWpAutoPause: "Пауза видео в фоне",
    appWpReadability: "Читаемость и стекло",
    appGlassOpacity: "Плотность стекла",
    appGlassBlur: "Размытие стекла",
    appMessageCardOpacity: "Подложка сообщений",
    appHighContrastText: "Высокий контраст текста",
    appColorLabels: ["Цвет 1", "Цвет 2", "Цвет 3"],
    greetMasterTitle: "Своё приветствие на главном экране",
    greetMasterDesc: "Заменяет стандартную фразу нового чата и (опционально) подсказку ввода",
    greetModeTime: "По времени суток",
    greetModeCustom: "Свой текст",
    greetModeMinimal: "Минимализм",
    greetPresetsLabel: "Быстрые варианты",
    greetTitleLabel: "Заголовок",
    greetTitlePlaceholder: "Например: {time}, {name}",
    greetSubtitleLabel: "Подзаголовок (необязательно)",
    greetSubtitlePlaceholder: "Например: {weekday}, {date}",
    greetNameLabel: "Имя для {name}",
    greetNameAutoPrefix: "Авто:",
    greetPlaceholderLabel: "Подсказка в поле ввода",
    greetPlaceholderDefault: "Спросите что угодно… (оставьте пустым для стандарта)",
    greetPreviewLabel: "Предпросмотр нового чата",
    greetPreviewInputFallback: "Спросите что угодно, @ — упомянуть",
    appUiFont: "Шрифт интерфейса",
    appMonoFont: "Шрифт кода",
    appFontSize: "Размер текста",
    appLineHeight: "Интервал строк",
    appChatWidth: "Ширина ленты",
    appChatWidthAuto: "Авто",
    appDensity: "Плотность отступов",
    appDensityCompact: "Компактно",
    appDensityComfort: "Обычно",
    appDensitySpacious: "Просторно",
    appProfilesTitle: "Профили вида",
    appProfilePlaceholder: "Название профиля…",
    appSaveProfile: "Сохранить",
    appApplyBtn: "Применить",
    appCancelBtn: "Отмена",
    appResetBtn: "Сброс",
    appAppliedMsg: "Оформление сохранено",
    appResetMsg: "Возвращён стандартный вид",
    appMediaPickedMsg: "Файл загружен",
    appMediaErrMsg: "Не удалось загрузить файл",
    appProfileSavedMsg: "Профиль сохранён",
    appProfileDeletedMsg: "Профиль удалён",
    suppTitle: "Дополнение агенту",
    suppActiveHint: "Агент работает — дополнение вклинится на следующем шаге или продолжит ответ.",
    suppIdleHint: "Агент сейчас свободен — можете вставить текст сразу в чат или оставить в очереди.",
    suppPlaceholder: "Дополнение или Ctrl+V фото… Enter — отправить",
    suppPickPhoto: "Фото",
    suppSendBtn: "Отправить",
    suppInsertChatBtn: "В чат",
    suppInsertedToast: "Вставлено в поле чата",
    suppClearBtn: "Очистить",
    suppEmpty: "Очередь дополнений пуста. Прикрепите текст или скриншот во время ответа агента.",
    suppStatusPending: "В очереди",
    suppStatusDelivered: "Передано",
    suppStatusExpired: "Истекло",
    suppPhotoCount: "фото",
    tooltipSupplement: "Отправить дополнение агенту (Ctrl+Alt+E)",
    hkSupplement: "Открыть панель дополнений",
    personaStrictLabel: "100% удержание характера (PreInvocation + анти-дрифт)",
    personaStrictDesc: "Якорь на старте, освежение на длинных цепочках шагов и изоляция соседних чатов",
    personaHookBadge: "Hook + AGENTS.md",
    quotaSectionTitle: "Лимиты моделей (5ч / Неделя)",
    quotaGeminiLabel: "Модели Gemini",
    quotaClaudeLabel: "Модели Claude и GPT",
    quotaCalibratedBadge: "Откалибровано",
    quotaEstimatedBadge: "Оценка",
    quotaCalibrateTip: "Откройте Настройки → Модели в Antigravity раз в сессию для точной калибровки %.",
    quotaRemShort: "Осталось:",
    quotaOpenLimitsLink: "Детали лимитов →",
    quotaTableTitle: "Расход по чатам (5ч / Неделя)",
    quotaColChat: "Чат",
    quotaColModel: "Модель",
    quotaCol5h: "5ч",
    quotaColWeek: "Неделя",
    quotaColTurns: "Ходы",
    quotaTableEmpty: "Пока нет учтённых ходов.",
    quotaResetBtn: "Сбросить",
    quotaResetDone: "Счётчики лимитов сброшены",
    quotaNoData: "нет снимка",
    exportTitle: "Экспорт чата в ZIP",
    exportDesc: "Упаковывает диалог, вложения, артефакты, характер и статистику чата в стандартный ZIP.",
    exportOptAttachments: "Фото и вложения",
    exportOptArtifacts: "Артефакты и scratch",
    exportOptPersona: "Характер агента",
    exportOptThinking: "Размышления (<details>)",
    exportOptFullLog: "Сырой лог transcript_full",
    exportBtnDownloads: "В Загрузки (ZIP)",
    exportBtnSaveAs: "Сохранить как…",
    exportBusy: "Упаковка…",
    exportSuccess: "Сохранено:",
    exportErr: "Ошибка экспорта:",
    exportRevealBtn: "Открыть папку",
    exportSummaryMsgs: "сообщ.",
    exportSummaryAttach: "влож.",
    exportSummaryArtifacts: "артеф.",
    exportSourceDisk: "полный архив с диска",
    exportSourceDom: "снимок открытого чата",
    statusReady: "Готов",
    statusWriting: "Генерация",
    phaseThinking: "Думает…",
    phaseIdle: "Ожидание",
    phaseLive: "Идёт генерация",
    kpiTps: "Скорость потока",
    kpiPeak: "Пиковая",
    kpiResp: "Последний ответ",
    kpiChat: "Контекст чата",
    kpiSubLive: "поток",
    kpiSubReady: "готов",
    kpiSubPeak: "макс. TPS",
    kpiSubExact: "точно по логу",
    kpiSubEst: "оценка",
    tpsUnit: "TPS",
    avgPrefix: "ср.",
    secUnit: "с",
    chatScopeNew: "Новый чат",
    chatScopeNamed: "Чат:",
    chatScopeHint: "Характер и статистика сохраняются отдельно для каждого чата.",
    tokShort: "ток.",
    peakLabel: "Пик",
    respLabel: "Ответ",
    chatLabel: "Чат",
    modelUnknown: "Модель не определена",
    resetStats: "Сбросить",
    cacheLabel: "Кэш",
    quota5hShort: "5ч",
    quotaWeekShort: "Нед.",
    previewTitle: "Живой вид мини-капсулы",
    modeTitle: "Размер виджета",
    modeMiniTitle: "Мини-капсула (S)",
    modeMiniDesc: "Компактная строка статуса и скорости",
    modeMedTitle: "Карточка (M)",
    modeMedDesc: "График TPS, токены, лимиты и характер",
    fieldsTitle: "Поля мини-капсулы",
    fieldStatus: "Индикатор состояния",
    fieldLang: "Кнопка RU / EN",
    fieldTps: "Скорость (TPS)",
    fieldResp: "Токены ответа",
    fieldChat: "Контекст чата",
    fieldModel: "Название модели",
    fieldQuota: "Лимиты (5ч / Нед.)",
    dockTitle: "Позиция на экране",
    pinLockLabel: "Закрепить виджет",
    pinLockDesc: "Фиксирует позицию; 1 клик открывает настройки",
    dockResetBtn: "К якорю",
    dockBottomRight: "Правый низ",
    dockTopRight: "Правый верх",
    dockMiddleRight: "Справа по центру",
    dockBottomLeft: "Левый низ",
    dockHidden: "Скрыт",
    dockHiddenHint: "При скрытом виджете панель всегда открывается по Ctrl+Alt+P.",
    personaMasterTitle: "Характер активен в этом чате",
    personaMasterDesc: "Автоматически переключается при смене чата",
    personaActiveTag: "Активен",
    personaUnsavedTag: "Не применено",
    personaOffTag: "Выкл",
    personaPresetsLabel: "Мои шаблоны",
    personaCustomLabel: "Шаблон",
    personaEditorLabel: "Инструкция (Markdown)",
    personaEditorPlaceholder: "Например: Отвечай кратко, структурно и сразу переходи к решению…",
    personaBytes: "байт",
    personaSavePresetPlaceholder: "Название шаблона…",
    personaAddPresetBtn: "Сохранить",
    personaApplyBtn: "Применить для чата",
    personaClearBtn: "Очистить",
    personaRulePathLabel: "Файл правила:",
    personaSavedMsg: "Применено для текущего чата",
    personaDisabledMsg: "Характер отключён (текст сохранён)",
    personaEmptyWarn: "Введите текст инструкции",
    personaPresetEmptyWarn: "Укажите название шаблона и текст",
    personaWriteErr: "Ошибка записи файла правила",
    personaTooLargeErr: "Превышен лимит (23 000 байт)",
    personaClearedMsg: "Очищено",
    personaDeletedPreset: "Шаблон удалён",
    personaSavedPreset: "Шаблон сохранён",
    personaLimitWarn: "Близко к лимиту",
    langCardsTitle: "Язык интерфейса Antigravity",
    langRuTitle: "Русский (RU)",
    langRuDesc: "Полный перевод меню, диалогов и настроек",
    langEnTitle: "English (EN)",
    langEnDesc: "Оригинальный английский интерфейс",
    langActiveBadge: "Активен",
    thinkingRuTitle: "Мысли агента на русском",
    thinkingRuDesc: "Переключает внутренние размышления (thinking) агента на русский язык. При отключении возвращается режим по умолчанию.",
    thinkingRuOn: "Русский",
    thinkingRuDefault: "По умолчанию",
    hotkeysTitle: "Горячие клавиши",
    hkToggleLang: "Переключить язык RU / EN",
    hkToggleModal: "Открыть / закрыть Rudex",
    hkDoubleClick: "Открыть настройки по виджету",
    hkDoubleClickKey: "1 клик (закреплён) / 2 клика",
    hkEsc: "Закрыть окно",
    pluginInfoTitle: "О плагине Rudex",
    pluginVersion: "Версия",
    pluginDict: "Строк в словаре",
    pluginRules: "Динамических правил",
    pluginRepo: "Репозиторий",
    tooltipExpand: "Карточка (M)",
    tooltipMini: "Мини-капсула (S)",
    tooltipSettings: "Настройки Rudex (Ctrl+Alt+P)",
    tooltipPinLock: "Закрепить",
    tooltipPinUnlock: "Открепить",
    tooltipLang: "RU / EN",
    tooltipClose: "Закрыть (Esc)",
    tooltipRemove: "Убрать",
    tooltipDelete: "Удалить",
    sidebarFooterHint: "Открыть Rudex",
    personaBadgeOn: "Характер:",
    personaBadgeOff: "Без характера",
    customPresetTitle: "Свой",
  },
  en: {
    brandTitle: "Rudex",
    navMonitor: "Monitor",
    navAppearance: "Appearance",
    navPersona: "Persona",
    navSupplements: "Supplements",
    navSettings: "Settings",
    modalTitleMonitor: "Generation Monitor",
    modalSubMonitor: "Live token throughput (TPS) and active chat context",
    modalTitleAppearance: "Appearance",
    modalSubAppearance: "Instant live preview on your real chat",
    modalTitlePersona: "Agent Persona",
    modalSubPersona: "Per-chat persona instruction (active from next reply)",
    modalTitleSupplements: "Agent Supplements",
    modalSubSupplements: "Send instructions or images mid-task without canceling",
    modalTitleSettings: "Settings",
    modalSubSettings: "Floating widget, ZIP export, quotas, and UI language",
    backToSettings: "Back",
    appSubTheme: "Theme",
    appSubWallpaper: "Wallpaper",
    appSubGreeting: "Greeting",
    appSubText: "Text",
    setSubWidget: "Widget",
    setSubExport: "Export & Limits",
    setSubSystem: "System",
    appThemesTitle: "Palette",
    appAccentQuick: "Accent",
    appCustomColor: "Custom",
    appFineTune: "Fine-tune",
    appCanvasColor: "Window background",
    appCardColor: "Card background",
    appRadius: "Corner radius",
    appPolishLabel: "Refined scrollbars & focus ring",
    appWpNone: "None",
    appWpGradient: "Gradient",
    appWpImage: "Image",
    appWpVideo: "Video",
    appWpNoneHint: "Clean theme background with no wallpaper overlay.",
    appWpPickImage: "Choose image…",
    appWpPickVideo: "Choose video…",
    appWpClearMedia: "Clear",
    appWpNoFileHint: "PNG, JPG, WebP or looping MP4/WebM video",
    appWpAnimated: "Smooth animation",
    appWpDim: "Dim",
    appWpBlur: "Blur",
    appWpOpacity: "Opacity",
    appWpScale: "Scale",
    appWpSpeed: "Cycle",
    appWpAngle: "Angle",
    appWpAutoPause: "Pause video when hidden",
    appWpReadability: "Readability & glass",
    appGlassOpacity: "Glass opacity",
    appGlassBlur: "Glass blur",
    appMessageCardOpacity: "Message backing",
    appHighContrastText: "High-contrast message text",
    appColorLabels: ["Color 1", "Color 2", "Color 3"],
    greetMasterTitle: "Custom new-chat greeting",
    greetMasterDesc: "Replaces the default new-chat headline and optional composer hint",
    greetModeTime: "Time of day",
    greetModeCustom: "Custom",
    greetModeMinimal: "Minimal",
    greetPresetsLabel: "Quick presets",
    greetTitleLabel: "Headline",
    greetTitlePlaceholder: "Example: {time}, {name}",
    greetSubtitleLabel: "Subtitle (optional)",
    greetSubtitlePlaceholder: "Example: {weekday}, {date}",
    greetNameLabel: "Name for {name}",
    greetNameAutoPrefix: "Auto:",
    greetPlaceholderLabel: "Composer placeholder",
    greetPlaceholderDefault: "Ask anything… (leave blank for default)",
    greetPreviewLabel: "New chat preview",
    greetPreviewInputFallback: "Ask anything, @ to mention",
    appUiFont: "UI font",
    appMonoFont: "Code font",
    appFontSize: "Font size",
    appLineHeight: "Line height",
    appChatWidth: "Feed width",
    appChatWidthAuto: "Auto",
    appDensity: "Spacing density",
    appDensityCompact: "Compact",
    appDensityComfort: "Default",
    appDensitySpacious: "Spacious",
    appProfilesTitle: "Appearance profiles",
    appProfilePlaceholder: "Profile name…",
    appSaveProfile: "Save",
    appApplyBtn: "Apply",
    appCancelBtn: "Discard",
    appResetBtn: "Reset",
    appAppliedMsg: "Appearance saved",
    appResetMsg: "Restored native Antigravity appearance",
    appMediaPickedMsg: "Media loaded",
    appMediaErrMsg: "Failed to load media",
    appProfileSavedMsg: "Profile saved",
    appProfileDeletedMsg: "Profile removed",
    suppTitle: "Agent Supplement",
    suppActiveHint: "Agent is busy — delivered on the next step or right when the turn wraps.",
    suppIdleHint: "Agent is idle — insert directly into the chat box or queue for the next turn.",
    suppPlaceholder: "Instruction or Ctrl+V image… Enter to send",
    suppPickPhoto: "Photo",
    suppSendBtn: "Send",
    suppInsertChatBtn: "To chat",
    suppInsertedToast: "Inserted into chat input",
    suppClearBtn: "Clear",
    suppEmpty: "No supplements queued. Attach text or a screenshot anytime.",
    suppStatusPending: "Queued",
    suppStatusDelivered: "Delivered",
    suppStatusExpired: "Expired",
    suppPhotoCount: "photos",
    tooltipSupplement: "Send supplement to agent (Ctrl+Alt+E)",
    hkSupplement: "Toggle supplements popover",
    personaStrictLabel: "100% Persona Lock (PreInvocation + Anti-Drift)",
    personaStrictDesc: "Anchors turn 1, refreshes across long tool chains, isolates sibling chats",
    personaHookBadge: "Hook + AGENTS.md",
    quotaSectionTitle: "Model Quotas (5h / Weekly)",
    quotaGeminiLabel: "Gemini Models",
    quotaClaudeLabel: "Claude & GPT Models",
    quotaCalibratedBadge: "Calibrated",
    quotaEstimatedBadge: "Estimated",
    quotaCalibrateTip: "Open Settings → Models in Antigravity once per session to calibrate exact %.",
    quotaRemShort: "Remaining:",
    quotaOpenLimitsLink: "Quota details →",
    quotaTableTitle: "Per-Chat Quota Breakdown (5h / Weekly)",
    quotaColChat: "Chat",
    quotaColModel: "Model",
    quotaCol5h: "5h",
    quotaColWeek: "Weekly",
    quotaColTurns: "Turns",
    quotaTableEmpty: "No turns recorded yet.",
    quotaResetBtn: "Reset",
    quotaResetDone: "Quota counters reset",
    quotaNoData: "no snapshot",
    exportTitle: "Export Chat to ZIP",
    exportDesc: "Packages conversation markdown, attachments, artifacts, persona, and telemetry into a ZIP.",
    exportOptAttachments: "Uploaded files",
    exportOptArtifacts: "Artifacts & scratch",
    exportOptPersona: "Agent persona",
    exportOptThinking: "Thinking (<details>)",
    exportOptFullLog: "Raw transcript_full log",
    exportBtnDownloads: "Save to Downloads",
    exportBtnSaveAs: "Save As…",
    exportBusy: "Packaging…",
    exportSuccess: "Saved:",
    exportErr: "Export failed:",
    exportRevealBtn: "Open folder",
    exportSummaryMsgs: "msgs",
    exportSummaryAttach: "files",
    exportSummaryArtifacts: "artifacts",
    exportSourceDisk: "full disk archive",
    exportSourceDom: "DOM chat snapshot",
    statusReady: "Ready",
    statusWriting: "Writing",
    phaseThinking: "Thinking…",
    phaseIdle: "Idle",
    phaseLive: "Streaming",
    kpiTps: "Stream speed",
    kpiPeak: "Peak",
    kpiResp: "Latest reply",
    kpiChat: "Chat context",
    kpiSubLive: "streaming",
    kpiSubReady: "ready",
    kpiSubPeak: "max TPS",
    kpiSubExact: "exact log",
    kpiSubEst: "estimate",
    tpsUnit: "TPS",
    avgPrefix: "avg",
    secUnit: "s",
    chatScopeNew: "New chat",
    chatScopeNamed: "Chat:",
    chatScopeHint: "Persona and TPS stats are stored independently per chat.",
    tokShort: "tok",
    peakLabel: "Peak",
    respLabel: "Reply",
    chatLabel: "Chat",
    modelUnknown: "Model not detected",
    resetStats: "Reset",
    cacheLabel: "Cache",
    quota5hShort: "5h",
    quotaWeekShort: "Wk",
    previewTitle: "Mini capsule preview",
    modeTitle: "Widget size",
    modeMiniTitle: "Mini Capsule (S)",
    modeMiniDesc: "Slim status & speed pill",
    modeMedTitle: "Telemetry Card (M)",
    modeMedDesc: "TPS sparkline, tokens, limits & persona",
    fieldsTitle: "Mini capsule fields",
    fieldStatus: "Status dot",
    fieldLang: "RU / EN switch",
    fieldTps: "Speed (TPS)",
    fieldResp: "Reply tokens",
    fieldChat: "Chat context",
    fieldModel: "Model name",
    fieldQuota: "Quota (5h / Wk)",
    dockTitle: "Position",
    pinLockLabel: "Lock widget in place",
    pinLockDesc: "Locks position; 1 click opens Rudex",
    dockResetBtn: "Snap to anchor",
    dockBottomRight: "Bottom right",
    dockTopRight: "Top right",
    dockMiddleRight: "Middle right",
    dockBottomLeft: "Bottom left",
    dockHidden: "Hidden",
    dockHiddenHint: "Press Ctrl+Alt+P anytime to open Rudex even when hidden.",
    personaMasterTitle: "Persona enabled in this chat",
    personaMasterDesc: "Automatically switches per chat",
    personaActiveTag: "Active",
    personaUnsavedTag: "Unsaved",
    personaOffTag: "Off",
    personaPresetsLabel: "My templates",
    personaCustomLabel: "Template",
    personaEditorLabel: "Instruction (Markdown)",
    personaEditorPlaceholder: "Example: Reply concisely, focus on code and avoid filler…",
    personaBytes: "bytes",
    personaSavePresetPlaceholder: "Template name…",
    personaAddPresetBtn: "Save",
    personaApplyBtn: "Apply to chat",
    personaClearBtn: "Clear",
    personaRulePathLabel: "Rule file:",
    personaSavedMsg: "Applied to active chat",
    personaDisabledMsg: "Persona disabled (draft kept)",
    personaEmptyWarn: "Enter a persona instruction first",
    personaPresetEmptyWarn: "Provide both template title and instruction text",
    personaWriteErr: "Failed to write rule file",
    personaTooLargeErr: "Rule exceeds 23,000 bytes",
    personaClearedMsg: "Cleared",
    personaDeletedPreset: "Template deleted",
    personaSavedPreset: "Template saved",
    personaLimitWarn: "Near limit",
    langCardsTitle: "Antigravity Interface Language",
    langRuTitle: "Русский (RU)",
    langRuDesc: "Complete Russian UI localization",
    langEnTitle: "English (EN)",
    langEnDesc: "Native English Antigravity UI",
    langActiveBadge: "Active",
    thinkingRuTitle: "Agent thinking in Russian",
    thinkingRuDesc: "Switches agent internal reasoning (thinking) to Russian. Turn off to restore default behavior.",
    thinkingRuOn: "Russian",
    thinkingRuDefault: "Default",
    hotkeysTitle: "Shortcuts",
    hkToggleLang: "Toggle RU / EN localization",
    hkToggleModal: "Toggle Rudex Studio",
    hkDoubleClick: "Open Rudex from widget",
    hkDoubleClickKey: "1 click (pinned) / 2 clicks",
    hkEsc: "Close dialog",
    pluginInfoTitle: "About Rudex",
    pluginVersion: "Version",
    pluginDict: "Dictionary entries",
    pluginRules: "Dynamic rules",
    pluginRepo: "Repository",
    tooltipExpand: "Card (M)",
    tooltipMini: "Mini pill (S)",
    tooltipSettings: "Open Rudex Settings (Ctrl+Alt+P)",
    tooltipPinLock: "Lock",
    tooltipPinUnlock: "Unlock",
    tooltipLang: "RU / EN",
    tooltipClose: "Close (Esc)",
    tooltipRemove: "Remove",
    tooltipDelete: "Delete",
    sidebarFooterHint: "Open Rudex",
    personaBadgeOn: "Persona:",
    personaBadgeOff: "Persona off",
    customPresetTitle: "Custom",
  },
};

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

function truncateToUtf8Bytes(str, maxBytes) {
  const text = String(str || "");
  if (utf8ByteLength(text) <= maxBytes) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (utf8ByteLength(text.slice(0, mid)) <= maxBytes) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo);
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
    quota: src.quota === true,
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
    const body = truncateToUtf8Bytes(rawBody, MAX_PERSONA_BODY_BYTES);
    if (!id || !title || !body.trim()) continue;
    out.push({ id, title: title.slice(0, 60), body });
  }
  return out;
}

function spNormalizeGreeting(raw) {
  if (typeof normalizeGreetingConfig === "function") return normalizeGreetingConfig(raw);
  const src = raw && typeof raw === "object" ? raw : {};
  const mode = src.mode === "custom" || src.mode === "minimal" ? src.mode : "time-of-day";
  return {
    enabled: Boolean(src.enabled),
    mode,
    title: typeof src.title === "string" ? src.title.slice(0, 160) : "",
    subtitle: typeof src.subtitle === "string" ? src.subtitle.slice(0, 180) : "",
    displayName: typeof src.displayName === "string" ? src.displayName.slice(0, 60) : "",
    placeholder: typeof src.placeholder === "string" ? src.placeholder.slice(0, 140) : "",
  };
}

function spCloneGreeting(raw) {
  return Object.assign({}, spNormalizeGreeting(raw));
}

function spDefaultAppearance() {
  if (typeof DEFAULT_APPEARANCE !== "undefined") return JSON.parse(JSON.stringify(DEFAULT_APPEARANCE));
  return {
    presetId: "native",
    uiPolish: true,
    accentColor: "#3b82f6",
    canvasBg: "#09090b",
    cardBg: "#131316",
    glassOpacity: 78,
    glassBlur: 12,
    messageCardOpacity: 74,
    highContrastText: true,
    radius: 12,
    wallpaper: {
      type: "none",
      gradientPreset: "aurora",
      gradColors: ["#0f172a", "#1e1b4b", "#09090b"],
      gradAngle: 135,
      gradAnimated: true,
      gradSpeed: 18,
      mediaFile: "",
      mediaUrl: "",
      mediaMime: "",
      dim: 45,
      blur: 0,
      opacity: 85,
      scale: 100,
      pauseWhenHidden: true,
    },
    typography: {
      uiFont: "system",
      monoFont: "system",
      fontSize: 14,
      lineHeight: 1.55,
      chatMaxWidth: 0,
      density: "comfortable",
    },
  };
}

function spNormalizeAppearance(raw) {
  if (typeof normalizeAppearance === "function") return normalizeAppearance(raw);
  const def = spDefaultAppearance();
  const src = raw && typeof raw === "object" ? raw : {};
  return Object.assign({}, def, src, {
    wallpaper: Object.assign({}, def.wallpaper, src.wallpaper || {}),
    typography: Object.assign({}, def.typography, src.typography || {}),
  });
}

function spCloneAppearance(raw) {
  return JSON.parse(JSON.stringify(spNormalizeAppearance(raw)));
}

function spGetThemePresets() {
  return typeof THEME_PRESETS !== "undefined" && Array.isArray(THEME_PRESETS) ? THEME_PRESETS : [];
}

function spGetGradientPresets() {
  return typeof GRADIENT_PRESETS !== "undefined" && Array.isArray(GRADIENT_PRESETS) ? GRADIENT_PRESETS : [];
}

function spGetFontPresets() {
  return typeof FONT_PRESETS !== "undefined" && FONT_PRESETS ? FONT_PRESETS : { ui: [{ id: "system", label: "System", labelEn: "System" }], mono: [{ id: "system", label: "System Mono", labelEn: "System Mono" }] };
}

function spFindThemePreset(id) {
  const list = spGetThemePresets();
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i];
  }
  return list[0] || { id: "native", vars: spDefaultAppearance() };
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

function hasMarkdownRootAncestor(el, stopAt) {
  let cur = el;
  while (cur && cur !== stopAt) {
    if (cur.nodeType === 1 && typeof cur.hasAttribute === "function" && cur.hasAttribute("data-markdown-root")) {
      return true;
    }
    cur = cur.parentNode;
  }
  return false;
}

function formatQuotaPct(val) {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return "0%";
  if (n < 0.1) return n.toFixed(2) + "%";
  if (n < 10) return n.toFixed(1) + "%";
  return Math.round(n) + "%";
}

function formatBytesCompact(bytes) {
  const b = Math.max(0, Number(bytes) || 0);
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + " MB";
  if (b >= 1024) return Math.round(b / 1024) + " KB";
  return b + " B";
}

function extractPctForLabel(slice, labelRe, crossBoundaryRe) {
  let m;
  const globalLabel = new RegExp(labelRe.source, "gi");
  while ((m = globalLabel.exec(slice)) !== null) {
    const startIdx = m.index;
    const afterLabel = slice.slice(m.index + m[0].length, m.index + m[0].length + 240);
    const beforeSlice = slice.slice(Math.max(0, startIdx - 140), startIdx);
    const pctM = /(\d{1,3}(?:[.,]\d+)?)\s*%/.exec(afterLabel);
    const sameLineAfter = pctM && !/[\r\n]/.test(afterLabel.slice(0, pctM.index)) && !crossBoundaryRe.test(afterLabel.slice(0, pctM.index));

    const revMatches = [];
    const pctGlobal = /(\d{1,3}(?:[.,]\d+)?)\s*%/g;
    let pm;
    while ((pm = pctGlobal.exec(beforeSlice)) !== null) revMatches.push(pm);
    const lastPm = revMatches.length > 0 ? revMatches[revMatches.length - 1] : null;
    const gapBefore = lastPm ? beforeSlice.slice(lastPm.index + lastPm[0].length) : "";
    const sameLineBefore = lastPm && !/[\r\n]/.test(gapBefore) && !crossBoundaryRe.test(gapBefore);

    if (sameLineAfter) {
      const val = parseFloat(pctM[1].replace(",", "."));
      if (Number.isFinite(val) && val >= 0 && val <= 100) {
        const resetSlice = afterLabel.slice(pctM.index, pctM.index + pctM[0].length + 120);
        const rM = /(?:refresh(?:ed|ing)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·]{2,48})/i.exec(resetSlice);
        return { val, reset: rM ? rM[1].trim() : "" };
      }
    }
    if (sameLineBefore) {
      const val = parseFloat(lastPm[1].replace(",", "."));
      if (Number.isFinite(val) && val >= 0 && val <= 100) {
        const resetAfter = afterLabel.slice(0, 120);
        const rM2 = /(?:refresh(?:ed|ing)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·]{2,48})/i.exec(resetAfter);
        return { val, reset: rM2 ? rM2[1].trim() : "" };
      }
    }
    if (pctM && !crossBoundaryRe.test(afterLabel.slice(0, pctM.index))) {
      const val = parseFloat(pctM[1].replace(",", "."));
      if (Number.isFinite(val) && val >= 0 && val <= 100) {
        const resetSlice = afterLabel.slice(pctM.index, pctM.index + pctM[0].length + 120);
        const rM = /(?:refresh(?:ed|ing)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·]{2,48})/i.exec(resetSlice);
        return { val, reset: rM ? rM[1].trim() : "" };
      }
    }
    if (lastPm && !crossBoundaryRe.test(gapBefore)) {
      const val = parseFloat(lastPm[1].replace(",", "."));
      if (Number.isFinite(val) && val >= 0 && val <= 100) {
        const resetAfter = afterLabel.slice(0, 120);
        const rM2 = /(?:refresh(?:ed|ing)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·]{2,48})/i.exec(resetAfter);
        return { val, reset: rM2 ? rM2[1].trim() : "" };
      }
    }
  }
  return null;
}

function parseQuotaSectionFromSlice(slice) {
  if (!slice) return null;
  let weeklyRem = null;
  let fiveHourRem = null;
  let weeklyReset = "";
  let fiveHourReset = "";

  const wkLabelRe = /(?:weekly\s+limit(?:\s+remaining)?|остаток\s+недельн[а-яё]*\s+лимит[а-яё]*|недельн[а-яё]*\s+лимит(?:\s+осталось|\s+исчерпан)?|осталось\s+за\s+недел[а-яё]*)/i;
  const wkCrossRe = /(?:five\s*hour|5[-\s]*hour|5[-\s]*часов|пяти[-\s]*часов|gemini\s+models|claude\s*(?:and|и)\s*gpt)/i;
  const wkUnusedM = /(?:not\s+used\s+any\s+of\s+your\s+weekly\s+limit|ещё\s+не\s+расходовали\s+недельн[а-яё]*\s+лимит)[\s\S]{0,120}/i.exec(slice);
  if (wkUnusedM) {
    weeklyRem = 100;
    const rM = /(?:refresh(?:ed|ing)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·]{2,48})/i.exec(wkUnusedM[0]);
    if (rM) weeklyReset = rM[1].trim();
  } else {
    const wkHit = extractPctForLabel(slice, wkLabelRe, wkCrossRe);
    if (wkHit) {
      weeklyRem = wkHit.val;
      weeklyReset = wkHit.reset;
    } else if (/(?:used\s+all\s+of|reached|exhausted)\s+your\s+weekly\s+limit|исчерпали\s+недельн[а-яё]*\s+лимит/i.test(slice)) {
      weeklyRem = 0;
    }
  }

  const fhLabelRe = /(?:(?:five\s*hour|5[-\s]*hour)\s+limit(?:\s+remaining)?|остаток\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит[а-яё]*|(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит(?:\s+осталось|\s+исчерпан)?|осталось\s+за\s+5\s*ч[а-яё]*|\b5ч\s+лимит)/i;
  const fhCrossRe = /(?:weekly\s+limit|недельн[а-яё]*\s+лимит|gemini\s+models|claude\s*(?:and|и)\s*gpt)/i;
  const fhUnusedM = /(?:not\s+used\s+any\s+of\s+your\s+(?:5-hour|five[- ]hour)\s+limit|ещё\s+не\s+расходовали\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит)[\s\S]{0,120}/i.exec(slice);
  if (fhUnusedM) {
    fiveHourRem = 100;
    const rM2 = /(?:refresh(?:ed|ing)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·]{2,48})/i.exec(fhUnusedM[0]);
    if (rM2) fiveHourReset = rM2[1].trim();
  } else {
    const fhHit = extractPctForLabel(slice, fhLabelRe, fhCrossRe);
    if (fhHit) {
      fiveHourRem = fhHit.val;
      fiveHourReset = fhHit.reset;
    } else if (/(?:used\s+all\s+of|reached|exhausted)\s+your\s+(?:5-hour|five[- ]hour)\s+limit|исчерпали\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит/i.test(slice)) {
      fiveHourRem = 0;
    }
  }

  if (weeklyRem === null && fiveHourRem === null) return null;
  return { weeklyRem, fiveHourRem, weeklyReset, fiveHourReset };
}

function parseQuotaFromDocumentText(fullText, activeModelName) {
  const txt = String(fullText || "");
  if (!txt || txt.length < 20) return null;
  if (!/limit\s+remaining|weekly\s+limit|five\s*hour|5[-\s]*hour|остаток\s+(?:недельн|5|пяти)|недельн[а-яё]*\s+лимит|пятичас|5[-\s]*часов/i.test(txt)) {
    return null;
  }
  const gemHeadRe = /(?:gemini\s+models|модели\s+gemini)/gi;
  const claHeadRe = /(?:claude\s*(?:and|и|&)\s*gpt\s*models|модели\s+claude(?:\s*(?:и|and|&)\s*gpt)?)/gi;

  const findAllIndices = (re) => {
    const res = [];
    let m;
    while ((m = re.exec(txt)) !== null) res.push(m.index);
    return res;
  };

  const gemIdxs = findAllIndices(gemHeadRe);
  const claIdxs = findAllIndices(claHeadRe);

  let gemini = null;
  for (let i = gemIdxs.length - 1; i >= 0; i -= 1) {
    const start = gemIdxs[i];
    const nextCla = claIdxs.find((c) => c > start && c - start < 2400);
    const end = nextCla ? nextCla : start + 2400;
    const parsed = parseQuotaSectionFromSlice(txt.slice(start, end));
    if (parsed) {
      gemini = parsed;
      break;
    }
  }

  let claudeGpt = null;
  for (let i = claIdxs.length - 1; i >= 0; i -= 1) {
    const start = claIdxs[i];
    const nextGem = gemIdxs.find((g) => g > start && g - start < 2400);
    const end = nextGem ? nextGem : start + 2400;
    const parsed = parseQuotaSectionFromSlice(txt.slice(start, end));
    if (parsed) {
      claudeGpt = parsed;
      break;
    }
  }

  if (!gemini && !claudeGpt) {
    const fallbackParsed = parseQuotaSectionFromSlice(txt.slice(-3000));
    if (fallbackParsed) {
      const isCla = /claude|sonnet|opus|haiku|gpt|openai/i.test(String(activeModelName || ""));
      if (isCla) claudeGpt = fallbackParsed;
      else gemini = fallbackParsed;
    }
  }

  if (!gemini && !claudeGpt) return null;
  return { gemini, claudeGpt };
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
  const gradId = `rxSparkGrad_${idPrefix}`;
  const midY = (padY + innerH * 0.5).toFixed(1);
  return `<svg class="spark-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--rx-accent)" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="var(--rx-accent)" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <line x1="${padX}" y1="${midY}" x2="${width - padX}" y2="${midY}" stroke="var(--rx-border-strong)" stroke-dasharray="2.5 3" stroke-width="1"/>
    <path d="${areaD}" fill="url(#${gradId})"/>
    <path d="${lineD}" fill="none" stroke="var(--rx-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="var(--rx-accent)"/>
  </svg>`;
}

function spTokenEstFloat(text) {
  return typeof estimateTokensFloat === "function" ? estimateTokensFloat(text) : Math.max(0, String(text || "").trim().length / 3.5);
}

function spTokenEst(text) {
  return typeof estimateTokens === "function" ? estimateTokens(text) : Math.round(spTokenEstFloat(text));
}

function spEmptyTelemetry() {
  if (typeof createEmptyTelemetry === "function") return createEmptyTelemetry();
  return {
    isGenerating: false,
    phase: "idle",
    currentTps: 0,
    lastAvgTps: 0,
    peakTps: 0,
    lastDurSec: 0,
    lastThinkingSec: 0,
    respTokens: 0,
    chatTokens: 0,
    exactRespTokens: 0,
    exactContextTokens: 0,
    exactCacheTokens: 0,
    contextLabel: "",
    modelName: "",
    samples: [],
    history: [],
    turnStartMs: 0,
    firstGrowthAt: 0,
    lastGrowthAt: 0,
    preTokenAt: 0,
    seedSliceMs: 160,
    activeStreamMs: 0,
    lastSparkAt: 0,
    turnStartFloatTok: 0,
    prevFloatTok: 0,
    highWaterBubbleTok: 0,
    bankedTurnTokens: 0,
    activeRespEl: null,
    prevRespCount: 0,
    prevUserCount: 0,
    firstUserNorm: "",
    unconfirmedGrowthTicks: 0,
    unconfirmedFirstTok: 0,
    growthTicks: 0,
    tpsWindow: [],
    wasGenerating: false,
    dirty: false,
  };
}

function createStudioPanel(options) {
  const opts = options && typeof options === "object" ? options : {};
  const doc = opts.document || (typeof document !== "undefined" ? document : null);
  const win = opts.window || (typeof window !== "undefined" ? window : null);
  const ipc = opts.ipcRenderer || null;
  const translator = opts.translator || null;
  const stylesFn = typeof opts.buildStyles === "function"
    ? opts.buildStyles
    : (typeof buildStudioStyles === "function" ? buildStudioStyles : () => "");
  const pluginMeta = opts.pluginMeta && typeof opts.pluginMeta === "object"
    ? opts.pluginMeta
    : { version: "4.0.0", dictEntries: 4017, dynamicRulesCount: 471 };

  const telemetryEngine = opts.telemetryEngine || (typeof createTelemetryEngine === "function" ? createTelemetryEngine() : null);

  const mediaBlobCache = new Map();
  const mediaLoadInflight = new Set();

  function invokeIpc(channel, payload) {
    if (!ipc || typeof ipc.invoke !== "function") return Promise.resolve(null);
    try {
      return Promise.resolve(ipc.invoke(channel, payload)).catch(() => null);
    } catch (_e) {
      return Promise.resolve(null);
    }
  }

  function extractMediaFileName(fileName, mediaUrl) {
    if (typeof fileName === "string" && fileName.trim()) return fileName.trim();
    const s = String(mediaUrl || "").trim();
    if (s.startsWith("agy-media://local/")) {
      try { return decodeURIComponent(s.slice("agy-media://local/".length)); } catch (_e) {}
    }
    return "";
  }

  function revokeCachedMedia(keepKey) {
    const revokeApi = win && win.URL && typeof win.URL.revokeObjectURL === "function"
      ? win.URL
      : (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function" ? URL : null);
    mediaBlobCache.forEach((blobUrl, key) => {
      if (keepKey && key === keepKey) return;
      if (revokeApi) {
        try { revokeApi.revokeObjectURL(blobUrl); } catch (_e) {}
      }
      mediaBlobCache.delete(key);
    });
  }

  function resolveStudioMediaUrl(fileName, mediaUrl) {
    const key = extractMediaFileName(fileName, mediaUrl);
    if (!key) return mediaUrl || "";
    const cached = mediaBlobCache.get(key);
    if (cached) return cached;
    if (mediaUrl && mediaUrl.startsWith("agy-media://local/")) {
      return mediaUrl;
    }
    const BlobCtor = win && typeof win.Blob === "function" ? win.Blob : (typeof Blob === "function" ? Blob : null);
    const UrlApi = win && win.URL && typeof win.URL.createObjectURL === "function" ? win.URL : (typeof URL !== "undefined" && typeof URL.createObjectURL === "function" ? URL : null);
    if (!mediaLoadInflight.has(key) && ipc && BlobCtor && UrlApi) {
      mediaLoadInflight.add(key);
      invokeIpc("agy-studio:read-media", { fileName: key, mediaUrl }).then((res) => {
        mediaLoadInflight.delete(key);
        if (state.destroyed || !res || !res.ok || !res.bytes) return;
        try {
          revokeCachedMedia(key);
          const blob = new BlobCtor([res.bytes], { type: res.mime || "application/octet-stream" });
          const blobUrl = UrlApi.createObjectURL(blob);
          mediaBlobCache.set(key, blobUrl);
          if (state.mounted) {
            applyThemeToHost(state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance);
          }
        } catch (_e) {}
      });
    }
    return mediaUrl || "";
  }

  const themeEngine = opts.themeEngine || (typeof createThemeEngine === "function" ? createThemeEngine({ document: doc, window: win, resolveMediaUrl: resolveStudioMediaUrl }) : null);

  const state = {
    initialized: false,
    mounted: false,
    destroyed: false,
    locale: opts.initialLocale === "en" ? "en" : "ru",
    isOpen: false,
    activeTab: "monitor",
    appearanceSubTab: "theme",
    settingsSubTab: "widget",
    openDisclosures: {},
    theme: "dark",
    activeChatKey: "__new__",
    activeChatTitle: "",
    activeChatSwitchSeq: 0,
    personaSaveSeq: 0,
    settingsSaveSeq: 0,
    lastRemoteStateSig: "",
    hasActivatedChat: false,
    hydrationIgnoreUntil: 0,
    pendingNewSendAt: 0,
    lastCancelClickAt: 0,
    lastPromotedPersona: null,
    lastTempKey: "",
    lastTempKeyAt: 0,
    lastTempFirstUserNorm: "",
    lastFocusSyncAt: 0,
    lastPollAt: 0,
    lastDomMutationAt: 0,
    lastPreviewCapsuleHtml: "",
    lastSparkMedSig: "",
    lastSparkModalSig: "",
    lastSupplementSendAt: 0,
    lastSupplementSendSig: "",
    chatPersona: {
      enabled: false,
      activePreset: "custom",
      text: "",
      strict: true,
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
      trackHistory: true,
      personaStrictMode: true,
      thinkingInRussian: false,
      customPresets: [],
      appearance: spCloneAppearance(spDefaultAppearance()),
      appearanceProfiles: [],
      greeting: spCloneGreeting(null),
    },
    appearanceDraft: spCloneAppearance(spDefaultAppearance()),
    greetingDraft: spCloneGreeting(null),
    appearanceDirty: false,
    appearanceLivePreview: false,
    newProfileName: "",
    quotaSummary: null,
    lastQuotaScrapeAt: 0,
    lastQuotaScrapeSig: "",
    lastQuotaSyncAt: 0,
    exportOpts: {
      includeAttachments: true,
      includeArtifacts: true,
      includePersona: true,
      includeThinking: false,
      includeFullLog: false,
    },
    exportBusy: false,
    exportResult: null,
    exportError: "",
    draftPersonaText: "",
    draftDirty: false,
    newPresetName: "",
    personaFilePath: "~/.gemini/config/plugins/rudex/rules/AGENTS.md",
    toastMsg: "",
    toastError: false,
    liveEditOpen: false,
    liveEditDraftText: "",
    liveEditDraftImages: [],
    liveEditBusy: false,
    liveEditError: "",
    liveEdits: [],
    telemetry: spEmptyTelemetry(),
  };

  let hostEl = null;
  let shadowRoot = null;
  let styleEl = null;
  let rootEl = null;
  let widgetMountEl = null;
  let popoverMountEl = null;
  let modalMountEl = null;
  let pollTimer = null;
  let repaintTimer = null;
  let streamSampleTimer = null;
  let turnSyncTimer = null;
  let readyTimer = null;
  let settleTimer = null;
  let readyObserver = null;
  let domObserver = null;
  let themeObserver = null;
  let toastTimer = null;
  let keydownHandler = null;
  let cancelClickHandler = null;
  let resizeHandler = null;
  let focusSyncHandler = null;
  let blurDragHandler = null;
  let visChangeHandler = null;
  let pointerMoveHandler = null;
  let pointerUpHandler = null;
  let dragState = null;
  let lastBodyClickAt = 0;
  let lastDragEndedAt = 0;

  function nowHiRes() {
    try {
      if (win && win.performance && typeof win.performance.now === "function") return win.performance.now();
      if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
    } catch (_e) {}
    return Date.now();
  }

  function isRealHttpPage() {
    try {
      return Boolean(win && win.location && typeof win.location.protocol === "string" && /^https?:$/i.test(win.location.protocol));
    } catch (_e) {
      return false;
    }
  }

  function isAntigravityUiReady() {
    if (!doc || typeof doc.querySelector !== "function") return true;
    if (!isRealHttpPage()) return true;
    try {
      if (doc.querySelector('[data-testid="model-selector-trigger"], [data-testid="user-message-content"], [data-testid="agent-response"]')) {
        return true;
      }
      if (doc.querySelector('textarea, [contenteditable="true"]') && doc.querySelector("nav, aside")) {
        return true;
      }
    } catch (_e) {}
    return false;
  }

  function t() {
    return TEXT[state.locale] || TEXT.ru;
  }

  function parseColorLightness(raw) {
    const s = String(raw || "").trim().toLowerCase();
    if (!s || s === "transparent" || s === "none") return null;
    const hexM = /^#([0-9a-f]{6})$/i.exec(s);
    if (hexM) {
      const h = hexM[1];
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 / 255;
    }
    const rgbM = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+%?))?/.exec(s);
    if (rgbM) {
      if (rgbM[4] !== undefined) {
        const a = rgbM[4].endsWith("%") ? parseFloat(rgbM[4]) / 100 : parseFloat(rgbM[4]);
        if (Number.isFinite(a) && a < 0.25) return null;
      }
      return (parseFloat(rgbM[1]) * 299 + parseFloat(rgbM[2]) * 587 + parseFloat(rgbM[3]) * 114) / 1000 / 255;
    }
    const okM = /^oklch\(\s*([\d.]+%?)/.exec(s);
    if (okM) {
      const l = okM[1].endsWith("%") ? parseFloat(okM[1]) / 100 : parseFloat(okM[1]);
      return Number.isFinite(l) ? l : null;
    }
    return null;
  }

  function detectTheme() {
    const activeApp = state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance;
    if (activeApp && activeApp.presetId === "light-paper") return "light";
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
        const cs = win.getComputedStyle(htmlEl);
        const l1 = parseColorLightness(cs.getPropertyValue("--background"));
        if (l1 !== null) return l1 > 0.58 ? "light" : "dark";
        const l2 = parseColorLightness(cs.backgroundColor);
        if (l2 !== null) return l2 > 0.58 ? "light" : "dark";
      }
      if (htmlEl && htmlEl.classList && htmlEl.classList.contains("dark")) return "dark";
      if (typeof win.matchMedia === "function" && win.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    } catch (_e) {}
    return "dark";
  }

  function syncTheme() {
    const next = detectTheme();
    state.theme = next;
    if (rootEl) {
      rootEl.setAttribute("data-theme", next);
      const activeApp = state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance;
      const preset = spFindThemePreset(activeApp && activeApp.presetId);
      const accent = (activeApp && activeApp.presetId === "custom")
        ? (activeApp.accentColor || "#3b82f6")
        : ((preset && preset.vars && preset.vars.accentColor) || (activeApp && activeApp.accentColor) || "#3b82f6");
      rootEl.style.setProperty("--rx-accent", accent);
      const l = parseColorLightness(accent);
      rootEl.style.setProperty("--rx-accent-fg", l !== null && l > 0.62 ? "#111216" : "#ffffff");
    }
  }

  function syncTranslatorGreeting(cfg) {
    if (translator && typeof translator.setGreetingConfig === "function") {
      try { translator.setGreetingConfig(spNormalizeGreeting(cfg)); } catch (_e) {}
    }
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

  function computeSettingsStateSig(remote) {
    try {
      const s = remote && remote.settings ? remote.settings : remote;
      return JSON.stringify({ l: remote && remote.locale, s });
    } catch (_e) {
      return "";
    }
  }

  function saveSettingsPatch(patch) {
    const seq = ++state.settingsSaveSeq;
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
    if (patch.greeting) {
      state.settings.greeting = spCloneGreeting(patch.greeting);
      state.greetingDraft = spCloneGreeting(state.settings.greeting);
      syncTranslatorGreeting(state.settings.greeting);
    }
    if (patch.appearance) {
      state.settings.appearance = spCloneAppearance(patch.appearance);
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.appearanceDirty = false;
      applyThemeToHost(state.settings.appearance);
    }
    renderStructure();
    return invokeIpc("agy-studio:save-settings", patch).then((res) => {
      if (state.destroyed || seq !== state.settingsSaveSeq) return res;
      if (res && res.settings) {
        const sig = computeSettingsStateSig(res);
        if (sig && sig !== state.lastRemoteStateSig) {
          applyRemoteState(res, false);
        }
      }
      return res;
    });
  }

  function applyRemoteState(remote, forceRender) {
    if (!remote || typeof remote !== "object") return;
    const sig = computeSettingsStateSig(remote);
    if (!forceRender && sig && sig === state.lastRemoteStateSig) return;
    if (sig) state.lastRemoteStateSig = sig;

    if (remote.locale === "ru" || remote.locale === "en") {
      state.locale = remote.locale;
    }
    const rawSettings = remote.settings && typeof remote.settings === "object" ? remote.settings : remote;
    if (rawSettings && typeof rawSettings === "object") {
      if (typeof rawSettings.panelEnabled === "boolean") state.settings.panelEnabled = rawSettings.panelEnabled;
      if (typeof rawSettings.pinned === "boolean") state.settings.pinned = rawSettings.pinned;
      if (rawSettings.viewMode) state.settings.viewMode = normalizeViewMode(rawSettings.viewMode);
      if (rawSettings.layoutMode === "floating" || rawSettings.layoutMode === "docked") {
        state.settings.layoutMode = rawSettings.layoutMode;
      }
      if (rawSettings.dockPosition) state.settings.dockPosition = normalizeDockPosition(rawSettings.dockPosition);
      if ("floatX" in rawSettings) {
        state.settings.floatX = typeof rawSettings.floatX === "number" && Number.isFinite(rawSettings.floatX) ? rawSettings.floatX : null;
      }
      if ("floatY" in rawSettings) {
        state.settings.floatY = typeof rawSettings.floatY === "number" && Number.isFinite(rawSettings.floatY) ? rawSettings.floatY : null;
      }
      if (rawSettings.miniFields) state.settings.miniFields = normalizeMiniFields(rawSettings.miniFields);
      if (typeof rawSettings.trackHistory === "boolean") state.settings.trackHistory = rawSettings.trackHistory;
      if (typeof rawSettings.personaStrictMode === "boolean") state.settings.personaStrictMode = rawSettings.personaStrictMode;
      if (typeof rawSettings.thinkingInRussian === "boolean") state.settings.thinkingInRussian = rawSettings.thinkingInRussian;
      if (Array.isArray(rawSettings.customPresets)) state.settings.customPresets = normalizeCustomPresets(rawSettings.customPresets);
      if (rawSettings.greeting && typeof rawSettings.greeting === "object") {
        state.settings.greeting = spCloneGreeting(rawSettings.greeting);
        if (!state.appearanceDirty) {
          state.greetingDraft = spCloneGreeting(state.settings.greeting);
          syncTranslatorGreeting(state.settings.greeting);
        }
      }
      if (rawSettings.appearance && typeof rawSettings.appearance === "object") {
        state.settings.appearance = spCloneAppearance(rawSettings.appearance);
        if (!state.appearanceDirty) {
          state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        }
        if (!state.appearanceLivePreview) {
          applyThemeToHost(state.settings.appearance);
        }
      }
      if (Array.isArray(rawSettings.appearanceProfiles)) {
        state.settings.appearanceProfiles = rawSettings.appearanceProfiles.slice(0, 12);
      }
    }
    if (remote.quotaSummary && typeof remote.quotaSummary === "object") {
      state.quotaSummary = remote.quotaSummary;
    }
    if (typeof remote.personaFilePath === "string" && remote.personaFilePath) state.personaFilePath = remote.personaFilePath;
    renderStructure();
  }

  function serializeChatTelemetry(tel) {
    return {
      lastAvgTps: Math.max(0, Math.round(Number(tel.lastAvgTps) || 0)),
      peakTps: Math.max(0, Math.round(Number(tel.peakTps) || 0)),
      lastDurSec: typeof tel.lastDurSec === "number" && Number.isFinite(tel.lastDurSec) && tel.lastDurSec > 0 ? Math.round(tel.lastDurSec * 100) / 100 : 0,
      lastThinkingSec: typeof tel.lastThinkingSec === "number" && Number.isFinite(tel.lastThinkingSec) && tel.lastThinkingSec > 0 ? Math.round(tel.lastThinkingSec * 100) / 100 : 0,
      respTokens: Math.max(0, Math.round(Number(tel.respTokens) || 0)),
      chatTokens: Math.max(0, Math.round(Number(tel.chatTokens) || 0)),
      exactRespTokens: Math.max(0, Math.round(Number(tel.exactRespTokens) || 0)),
      exactContextTokens: Math.max(0, Math.round(Number(tel.exactContextTokens) || 0)),
      exactCacheTokens: Math.max(0, Math.round(Number(tel.exactCacheTokens) || 0)),
      modelName: String(tel.modelName || "").slice(0, 96),
      samples: Array.isArray(tel.samples) ? tel.samples.slice(-24) : [],
      history: Array.isArray(tel.history) ? tel.history.slice(0, 8) : [],
    };
  }

  function cleanTitleStr(raw) {
    return String(raw || "")
      .replace(/\s*[-—|]\s*Antigravity.*$/i, "")
      .replace(/\s*[-—|·]\s*(?:Outside of Project|Вне проекта)\b.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectChatTitle() {
    if (!doc) return "";
    try {
      const ignored = /^(antigravity|new chat|новый чат|untitled)$/i;
      if (typeof doc.querySelector === "function") {
        const titleEl = doc.querySelector('[data-testid="conversation-title"], [data-testid="chat-title"], main header h1, main header h2');
        const t1 = titleEl && titleEl.textContent ? cleanTitleStr(titleEl.textContent) : "";
        if (t1 && !ignored.test(t1)) return t1.slice(0, 60);
        const navEl = doc.querySelector('[aria-current="page"], [aria-selected="true"], [data-active="true"], [data-state="active"]');
        if (navEl && typeof navEl.getAttribute === "function" && (!hostEl || (typeof hostEl.contains !== "function" || !hostEl.contains(navEl)))) {
          const t2 = cleanTitleStr(navEl.getAttribute("title") || navEl.textContent || "");
          if (t2 && !ignored.test(t2)) return t2.slice(0, 60);
        }
      }
      const dt = cleanTitleStr(doc.title || "");
      if (dt && !ignored.test(dt)) return dt.slice(0, 60);
    } catch (_e) {}
    return "";
  }

  function extractKeyPartsFromEl(el) {
    if (!el || typeof el.getAttribute !== "function") return { uuid: "", stable: "" };
    const attrs = ["data-conversation-id", "data-cascade-id", "data-session-id", "data-chat-id", "href", "id", "data-testid"];
    let stable = "";
    for (let a = 0; a < attrs.length; a += 1) {
      const v = el.getAttribute(attrs[a]) || "";
      if (!v) continue;
      const u = extractUuid(v);
      if (u) return { uuid: u, stable: u };
      if (!stable && (attrs[a] === "href" || attrs[a] === "id" || attrs[a].startsWith("data-"))) {
        stable = attrs[a] + "=" + v;
      }
    }
    return { uuid: "", stable };
  }

  function isUiOverlayNode(el) {
    if (!el) return false;
    if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) return true;
    if (typeof el.closest === "function" && el.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="tablist"]')) {
      return true;
    }
    return false;
  }

  function findActiveSidebarKeyParts(activeTitle) {
    if (!doc || typeof doc.querySelectorAll !== "function") return { uuid: "", stable: "" };
    try {
      const activeNodes = doc.querySelectorAll('[aria-current="page"], [aria-current="true"], [aria-selected="true"], [data-active="true"], [data-selected="true"], [data-state="active"]');
      let stable = "";
      for (let i = 0; activeNodes && i < activeNodes.length; i += 1) {
        const el = activeNodes[i];
        if (!el || isUiOverlayNode(el)) continue;
        const pSelf = extractKeyPartsFromEl(el);
        if (pSelf.uuid) return pSelf;
        if (!stable && pSelf.stable) stable = pSelf.stable;
        if (typeof el.closest === "function") {
          const anc = el.closest('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id], a[href]');
          if (anc && !isUiOverlayNode(anc)) {
            const pAnc = extractKeyPartsFromEl(anc);
            if (pAnc.uuid) return pAnc;
            if (!stable && pAnc.stable) stable = pAnc.stable;
          }
        }
        if (typeof el.querySelector === "function") {
          const desc = el.querySelector('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id], a[href]');
          if (desc && !isUiOverlayNode(desc)) {
            const pDesc = extractKeyPartsFromEl(desc);
            if (pDesc.uuid) return pDesc;
          }
        }
      }

      const mainArea = typeof doc.querySelector === "function"
        ? doc.querySelector('main, [data-testid="chat-container"], [data-testid="conversation-view"]')
        : null;
      if (mainArea && typeof mainArea.querySelector === "function") {
        const mainConv = mainArea.querySelector('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id]');
        if (mainConv && !isUiOverlayNode(mainConv)) {
          const pMain = extractKeyPartsFromEl(mainConv);
          if (pMain.uuid) return pMain;
          if (!stable && pMain.stable) stable = pMain.stable;
        }
      }

      const rows = doc.querySelectorAll('[data-conversation-id], [data-cascade-id], [data-session-id], [data-chat-id]');
      if (rows && rows.length > 0) {
        for (let i = 0; i < rows.length; i += 1) {
          const r = rows[i];
          if (!r || isUiOverlayNode(r)) continue;
          const cls = typeof r.className === "string" ? r.className : "";
          const ariaSel = typeof r.getAttribute === "function" ? (r.getAttribute("aria-selected") || r.getAttribute("data-active") || r.getAttribute("data-state") || "") : "";
          if (/\b(?:active|selected|current)\b/i.test(cls) || ariaSel === "true" || ariaSel === "active") {
            const pCls = extractKeyPartsFromEl(r);
            if (pCls.uuid) return pCls;
          }
        }
        if (activeTitle) {
          const normActiveTitle = cleanTitleStr(activeTitle).toLowerCase();
          if (normActiveTitle) {
            const titleMatches = [];
            for (let i = 0; i < Math.min(rows.length, 40); i += 1) {
              const r = rows[i];
              if (!r || isUiOverlayNode(r)) continue;
              const rawTxt = (r.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
              if (rawTxt && rawTxt.includes(normActiveTitle)) titleMatches.push({ r, rawTxt });
            }
            if (titleMatches.length === 1) {
              const pTm = extractKeyPartsFromEl(titleMatches[0].r);
              if (pTm.uuid) return pTm;
            } else if (titleMatches.length > 1) {
              const justNowMatch = titleMatches.find((m) => /\b(?:just now|now)\b|сейчас/i.test(m.rawTxt));
              if (justNowMatch) {
                const pJn = extractKeyPartsFromEl(justNowMatch.r);
                if (pJn.uuid) return pJn;
              }
            }
          }
        }
        if (win && typeof win.getComputedStyle === "function" && rows.length >= 2) {
          const bgCounts = new Map();
          const rowStyles = [];
          for (let i = 0; i < Math.min(rows.length, 25); i += 1) {
            const r = rows[i];
            if (!r || isUiOverlayNode(r)) continue;
            const bg = String(win.getComputedStyle(r).backgroundColor || "").trim();
            rowStyles.push({ r, bg });
            bgCounts.set(bg, (bgCounts.get(bg) || 0) + 1);
          }
          let majorityBg = "";
          let majorityCnt = 0;
          bgCounts.forEach((cnt, bg) => {
            if (cnt > majorityCnt) { majorityCnt = cnt; majorityBg = bg; }
          });
          const distinctActive = [];
          for (let i = 0; i < rowStyles.length; i += 1) {
            const bg = rowStyles[i].bg;
            if (!bg || bg === majorityBg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") continue;
            distinctActive.push(rowStyles[i].r);
          }
          if (distinctActive.length === 1) {
            const pBg = extractKeyPartsFromEl(distinctActive[0]);
            if (pBg.uuid) return pBg;
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
    if (urlUuid) return { key: urlUuid, isNew: false, title };

    if (snap.userMsgCount === 0 && snap.respCount === 0) {
      state.pendingNewSendAt = 0;
      return { key: "__new__", isNew: true, title: "" };
    }

    const domParts = findActiveSidebarKeyParts(title);
    if (domParts.uuid) return { key: domParts.uuid, isNew: false, title };

    if (state.hasActivatedChat && state.activeChatKey === "__new__" && snap.userMsgCount <= 1) {
      const now = Date.now();
      if (!state.pendingNewSendAt) state.pendingNewSendAt = now;
      if (now - state.pendingNewSendAt < 2500) {
        return { key: "__new__", isNew: true, title };
      }
    }

    const cleanPath = cleanUrl.split(/[?#]/)[0] || "/";
    const fpSource = `${cleanPath}||${domParts.stable}||${snap.firstUserNorm}`;
    return { key: "chat-" + hashDjb2(fpSource), isNew: false, title };
  }

  function detectModelName() {
    if (!doc || typeof doc.querySelector !== "function") return "";
    try {
      const el = doc.querySelector('[data-testid="model-selector-trigger"]');
      const raw = el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim() : "";
      return raw.slice(0, 96);
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
      return { isGenerating: false, hasCancelBtn: false, isThinking: false, thinkingSec: 0, respFloatTok: 0, respTokens: 0, chatTokens: 0, userMsgCount: 0, respCount: 0, lastResp: null, firstUserNorm: "", modelName: "", contextLabel: "" };
    }
    try {
      const responses = doc.querySelectorAll('[data-testid="agent-response"]');
      const userMsgs = doc.querySelectorAll('[data-testid="user-message-content"]');
      const respCount = responses ? responses.length : 0;
      const userMsgCount = userMsgs ? userMsgs.length : 0;
      const lastResp = respCount > 0 ? responses[respCount - 1] : null;

      const hasCancelBtn = Boolean(typeof doc.querySelector === "function" && doc.querySelector('[data-testid="cancel-invocation-button"]'));
      let isGenerating = hasCancelBtn;
      let isThinking = false;
      if (lastResp) {
        let hasCompletedActions = false;
        if (typeof lastResp.querySelectorAll === "function") {
          const actBtns = lastResp.querySelectorAll("button[aria-label]");
          for (let i = 0; actBtns && i < actBtns.length; i += 1) {
            const al = typeof actBtns[i].getAttribute === "function" ? (actBtns[i].getAttribute("aria-label") || "") : "";
            if (/copy|копир|good|bad|like|dislike|thumb|upvote|downvote|нрав|полез|retry|повтор|regenerate/i.test(al)) {
              hasCompletedActions = true;
              break;
            }
          }
        }
        if (hasCancelBtn || !hasCompletedActions) {
          const h6List = typeof lastResp.querySelectorAll === "function"
            ? lastResp.querySelectorAll("h6")
            : (typeof lastResp.querySelector === "function" && lastResp.querySelector("h6") ? [lastResp.querySelector("h6")] : []);
          for (let i = 0; h6List && i < h6List.length; i += 1) {
            if (!h6List[i] || hasMarkdownRootAncestor(h6List[i], lastResp)) continue;
            const txt = (h6List[i].textContent || "").replace(/\s+/g, " ").trim();
            if (!txt || txt.length > 48) continue;
            if (/working|generating|thinking|streaming|работает|думает|генерац|выполня|пишет/i.test(txt)) {
              isGenerating = true;
              if (/thinking|думает/i.test(txt)) isThinking = true;
              break;
            }
          }
        }
      }
      if (!isGenerating) {
        const composerBtns = doc.querySelectorAll('form button[aria-label], [data-testid="composer"] button[aria-label], .composer-container button[aria-label]');
        for (let i = 0; composerBtns && i < composerBtns.length; i += 1) {
          const b = composerBtns[i];
          if (!b || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(b))) continue;
          if (isHiddenAncestor(b, doc.body)) continue;
          const lbl = typeof b.getAttribute === "function" ? (b.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim() : "";
          if (/^(?:stop\s+(?:generat|respond|stream|agent)|cancel\s+(?:invoc|generat|request)|остановить\s+(?:генерац|ответ|агент)|прервать\s+(?:генерац|ответ)|отменить\s+(?:генерац|запрос))/i.test(lbl)) {
            isGenerating = true;
            break;
          }
        }
      }

      const visibleRespText = lastResp
        ? (typeof extractVisibleResponseText === "function" ? extractVisibleResponseText(lastResp) : (lastResp.textContent || ""))
        : "";
      const respFloatTok = spTokenEstFloat(visibleRespText);
      const respTokens = respFloatTok > 0 ? Math.max(1, Math.round(respFloatTok)) : 0;
      const thinkingSec = lastResp && typeof extractThinkingSeconds === "function" ? extractThinkingSeconds(lastResp) : 0;
      const chatTokens = telemetryEngine && typeof telemetryEngine.countChatTokens === "function"
        ? telemetryEngine.countChatTokens(userMsgs, responses, lastResp)
        : respTokens;
      const firstUserNorm = userMsgCount > 0 ? (userMsgs[0].textContent || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 120) : "";

      return {
        isGenerating,
        hasCancelBtn,
        isThinking,
        thinkingSec,
        respFloatTok,
        respTokens,
        chatTokens,
        userMsgCount,
        respCount,
        lastResp,
        firstUserNorm,
        modelName: detectModelName(),
        contextLabel: detectContextLabel(),
      };
    } catch (_e) {
      return { isGenerating: false, hasCancelBtn: false, isThinking: false, thinkingSec: 0, respFloatTok: 0, respTokens: 0, chatTokens: 0, userMsgCount: 0, respCount: 0, lastResp: null, firstUserNorm: "", modelName: "", contextLabel: "" };
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

  function scheduleTurnTranscriptSync(chatKey, title) {
    if (!UUID_RE.test(String(chatKey || "")) || !win || typeof win.setTimeout !== "function") return;
    if (turnSyncTimer && typeof win.clearTimeout === "function") win.clearTimeout(turnSyncTimer);
    turnSyncTimer = win.setTimeout(() => {
      turnSyncTimer = null;
      if (state.destroyed || state.activeChatKey !== chatKey) return;
      invokeIpc("agy-studio:get-turn-metrics", { chatKey }).then((res) => {
        if (state.destroyed || !res || !res.ok || state.activeChatKey !== chatKey) return;
        if (telemetryEngine && typeof telemetryEngine.applyExactTranscriptMetrics === "function") {
          telemetryEngine.applyExactTranscriptMetrics(state.telemetry, res);
          flushChatTelemetry(chatKey, title, state.telemetry);
          updateLiveDom();
        }
      });
    }, 550);
  }

  function switchChatIfNeeded(detected, snap) {
    const needActivate = !state.hasActivatedChat || detected.key !== state.activeChatKey;
    if (!needActivate) {
      if (detected.title && !state.activeChatTitle) {
        state.activeChatTitle = detected.title;
        updateLiveDom();
      }
      return { switched: false, promoted: false };
    }

    const prevKey = state.activeChatKey;
    const prevTitle = state.activeChatTitle;
    const wasActivated = state.hasActivatedChat;
    const tel = state.telemetry;

    const isPromotion = wasActivated && prevKey === "__new__" && detected.key !== "__new__" && snap.userMsgCount <= 1 && (state.newChatDraftPersona !== null || snap.isGenerating || tel.isGenerating || state.pendingNewSendAt > 0);
    state.pendingNewSendAt = 0;

    if (wasActivated && prevKey.startsWith("chat-")) {
      state.lastTempKey = prevKey;
      state.lastTempKeyAt = Date.now();
      state.lastTempFirstUserNorm = tel.firstUserNorm || snap.firstUserNorm || "";
    }

    let migrateFromKey = "";
    if (!isPromotion && !detected.isNew && UUID_RE.test(detected.key) && state.lastTempKey && (Date.now() - state.lastTempKeyAt < 15000)) {
      if (!state.lastTempFirstUserNorm || !snap.firstUserNorm || state.lastTempFirstUserNorm === snap.firstUserNorm) {
        migrateFromKey = state.lastTempKey;
        state.lastTempKey = "";
      }
    }

    if (wasActivated && prevKey !== "__new__" && tel.dirty && !migrateFromKey) {
      flushChatTelemetry(prevKey, prevTitle, tel);
    }

    let promoPayload = null;
    let fallbackPersona = null;
    if (isPromotion) {
      const draft = state.newChatDraftPersona || (state.chatPersona.enabled && state.chatPersona.text.trim()
        ? { personaEnabled: true, personaActivePreset: state.chatPersona.activePreset || "custom", personaText: state.chatPersona.text, personaStrict: state.chatPersona.strict !== false }
        : null);
      promoPayload = {
        title: detected.title,
        personaEnabled: Boolean(draft && draft.personaEnabled),
        personaActivePreset: draft && draft.personaActivePreset ? draft.personaActivePreset : state.chatPersona.activePreset || "custom",
        personaText: draft && typeof draft.personaText === "string" ? draft.personaText : "",
        personaStrict: draft ? draft.personaStrict !== false : state.chatPersona.strict !== false,
        telemetry: serializeChatTelemetry(tel),
      };
      if (promoPayload.personaEnabled && promoPayload.personaText.trim()) {
        state.lastPromotedPersona = {
          personaEnabled: true,
          personaActivePreset: promoPayload.personaActivePreset,
          personaText: promoPayload.personaText,
          personaStrict: promoPayload.personaStrict !== false,
          at: Date.now(),
        };
        fallbackPersona = {
          personaEnabled: true,
          personaActivePreset: promoPayload.personaActivePreset,
          personaText: promoPayload.personaText,
          personaStrict: promoPayload.personaStrict !== false,
        };
      }
      if (!snap.isGenerating && !tel.isGenerating && snap.respCount >= 1 && tel.prevRespCount === 0) {
        tel.prevFloatTok = snap.respFloatTok;
        tel.turnStartFloatTok = snap.respFloatTok;
        tel.highWaterBubbleTok = snap.respFloatTok;
      }
      state.newChatDraftPersona = null;
    } else if (migrateFromKey) {
      if (state.chatPersona.enabled && state.chatPersona.text.trim()) {
        fallbackPersona = {
          personaEnabled: true,
          personaActivePreset: state.chatPersona.activePreset || "custom",
          personaText: state.chatPersona.text,
          personaStrict: state.chatPersona.strict !== false,
        };
      } else if (state.lastPromotedPersona && Date.now() - state.lastPromotedPersona.at < 20000) {
        fallbackPersona = {
          personaEnabled: true,
          personaActivePreset: state.lastPromotedPersona.personaActivePreset || "custom",
          personaText: state.lastPromotedPersona.personaText,
          personaStrict: state.lastPromotedPersona.personaStrict !== false,
        };
      }
    } else {
      state.newChatDraftPersona = null;
      state.lastPromotedPersona = null;
      state.hydrationIgnoreUntil = nowHiRes() + 2000;
      const freshTel = spEmptyTelemetry();
      freshTel.respTokens = detected.isNew ? 0 : snap.respTokens;
      freshTel.chatTokens = detected.isNew ? 0 : snap.chatTokens;
      freshTel.prevFloatTok = snap.respFloatTok;
      freshTel.turnStartFloatTok = snap.respFloatTok;
      freshTel.highWaterBubbleTok = snap.respFloatTok;
      freshTel.preTokenAt = nowHiRes();
      freshTel.activeRespEl = snap.lastResp;
      freshTel.prevRespCount = snap.respCount;
      freshTel.prevUserCount = snap.userMsgCount;
      freshTel.firstUserNorm = snap.firstUserNorm;
      freshTel.modelName = snap.modelName;
      freshTel.contextLabel = detected.isNew ? "" : snap.contextLabel;
      state.telemetry = freshTel;
      state.chatPersona = { enabled: false, activePreset: "custom", text: "", strict: state.settings.personaStrictMode !== false };
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
    updateLiveDom();

    invokeIpc("agy-studio:activate-chat", {
      chatKey: detected.key,
      title: detected.title,
      promoteFromNew: promoPayload,
      migrateFromKey,
      fallbackPersona,
      draftPersona: detected.isNew ? state.newChatDraftPersona : null,
    }).then((res) => {
      if (state.destroyed || seq !== state.activeChatSwitchSeq || !res || !res.chat) return;
      const rec = res.chat;
      if (typeof res.personaFilePath === "string" && res.personaFilePath) state.personaFilePath = res.personaFilePath;
      if (rec.title && !state.activeChatTitle) state.activeChatTitle = rec.title;
      state.chatPersona = {
        enabled: Boolean(rec.personaEnabled),
        activePreset: rec.personaActivePreset || "custom",
        text: typeof rec.personaText === "string" ? rec.personaText : "",
        strict: typeof rec.personaStrict === "boolean" ? rec.personaStrict : state.settings.personaStrictMode !== false,
      };
      if (!state.draftDirty) {
        state.draftPersonaText = state.chatPersona.text;
      }
      const rt = typeof sanitizeTelemetryRecord === "function" ? sanitizeTelemetryRecord(rec.telemetry) : rec.telemetry;
      const curTel = state.telemetry;
      if (detected.isNew) {
        if (!curTel.isGenerating) {
          curTel.lastAvgTps = 0;
          curTel.peakTps = 0;
          curTel.currentTps = 0;
          curTel.lastDurSec = 0;
          curTel.lastThinkingSec = 0;
          curTel.exactCacheTokens = 0;
          curTel.samples = [];
          curTel.history = [];
        }
      } else if (rt && !curTel.isGenerating && !curTel.wasGenerating && (rt.lastAvgTps > 0 || rt.peakTps > 0 || rt.exactRespTokens > 0)) {
        curTel.lastAvgTps = rt.lastAvgTps || 0;
        curTel.peakTps = Math.max(rt.peakTps || 0, rt.lastAvgTps || 0);
        curTel.lastDurSec = rt.lastDurSec || 0;
        curTel.lastThinkingSec = rt.lastThinkingSec || 0;
        curTel.exactRespTokens = rt.exactRespTokens || 0;
        curTel.exactContextTokens = rt.exactContextTokens || 0;
        curTel.exactCacheTokens = rt.exactCacheTokens || 0;
        if (!curTel.modelName && rt.modelName) curTel.modelName = rt.modelName;
        if (Array.isArray(rt.samples) && rt.samples.length > 0) curTel.samples = rt.samples.slice(-24);
      }
      if (res.quotaSummary && typeof res.quotaSummary === "object") {
        state.quotaSummary = res.quotaSummary;
      }
      refreshLiveEdits();
      renderStructure();
      updateLiveDom();
    });

    return { switched: true, promoted: isPromotion };
  }

  function recordTurnQuotaImpact(outputTokens, contextTokens, modelName) {
    if (!state.activeChatKey || state.activeChatKey === "__new__") return;
    invokeIpc("agy-studio:record-quota-turn", {
      chatKey: state.activeChatKey,
      title: state.activeChatTitle || "",
      modelName: modelName || "",
      outputTokens: Math.max(1, Math.round(outputTokens || 1)),
      contextTokens: Math.max(0, Math.round(contextTokens || 0)),
    }).then((res) => {
      if (!state.destroyed && res && res.summary) {
        state.quotaSummary = res.summary;
        updateLiveDom();
        if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "export") {
          renderStructure();
        }
      }
    });
  }

  function sampleStreamTick() {
    if (state.destroyed) return;
    const hiNow = nowHiRes();
    const snap = collectDomTelemetry();
    const detected = detectChatIdentity(snap);
    const sw = switchChatIfNeeded(detected, snap);
    const tel = state.telemetry;

    if (snap.modelName) tel.modelName = snap.modelName;
    if (snap.contextLabel) tel.contextLabel = snap.contextLabel;
    tel.chatTokens = snap.chatTokens;

    if (!sw.switched && telemetryEngine && typeof telemetryEngine.processTick === "function") {
      const outcome = telemetryEngine.processTick({
        tel,
        snap,
        hiNow,
        hydrationIgnoreUntil: state.hydrationIgnoreUntil,
        lastCancelClickAt: state.lastCancelClickAt,
        unknownModelLabel: t().modelUnknown,
        trackHistory: false,
      });
      if (outcome && outcome.finalizedTurn) {
        recordTurnQuotaImpact(outcome.finalizedTurn.tokens, snap.chatTokens, tel.modelName || snap.modelName || "");
        scheduleTurnTranscriptSync(state.activeChatKey, state.activeChatTitle);
      }
      if (outcome && outcome.flushNeeded && state.activeChatKey !== "__new__") {
        flushChatTelemetry(state.activeChatKey, state.activeChatTitle, tel);
      }
    } else if (sw.promoted && (snap.isGenerating || snap.respFloatTok > tel.prevFloatTok)) {
      const gained = Math.max(0, snap.respFloatTok - tel.prevFloatTok);
      if (gained > 0) {
        const seedSec = Math.max(0.35, (tel.preTokenAt > 0 ? Math.min(800, hiNow - tel.preTokenAt) : 450) / 1000);
        tel.lastGrowthAt = hiNow;
        if (!tel.firstGrowthAt) tel.firstGrowthAt = hiNow;
        if (!tel.turnStartMs) tel.turnStartMs = hiNow;
        tel.growthTicks = (tel.growthTicks || 0) + 1;
        const rawTps = Math.min(350, Math.max(1, Math.round(gained / seedSec)));
        tel.currentTps = rawTps;
        if (tel.growthTicks >= 2 && snap.respFloatTok >= 4) {
          tel.peakTps = Math.max(tel.peakTps, rawTps);
          tel.samples.push(rawTps);
          if (tel.samples.length > 24) tel.samples.shift();
        }
        tel.dirty = true;
      } else {
        tel.preTokenAt = hiNow;
        if (!tel.turnStartMs) tel.turnStartMs = hiNow;
      }
      tel.prevFloatTok = snap.respFloatTok;
      tel.highWaterBubbleTok = snap.respFloatTok;
      tel.isGenerating = Boolean(snap.isGenerating || gained > 0);
      tel.wasGenerating = tel.isGenerating;
      tel.phase = tel.isGenerating ? (tel.firstGrowthAt ? "streaming" : "thinking") : "idle";
      tel.prevRespCount = snap.respCount;
      tel.prevUserCount = snap.userMsgCount;
      tel.respTokens = snap.respTokens;
    }
  }

  function scheduleStreamSample() {
    if (state.destroyed || !state.mounted) return;
    state.lastDomMutationAt = Date.now();
    if (!win || typeof win.setTimeout !== "function") {
      sampleStreamTick();
      scheduleRepaint();
      return;
    }
    if (streamSampleTimer) return;
    streamSampleTimer = win.setTimeout(() => {
      streamSampleTimer = null;
      if (state.destroyed || !state.mounted) return;
      sampleStreamTick();
      scheduleRepaint();
    }, 95);
  }

  function scheduleRepaint() {
    if (state.destroyed || !state.mounted) return;
    if (repaintTimer || !win || typeof win.setTimeout !== "function") {
      if (!repaintTimer) updateLiveDom();
      return;
    }
    repaintTimer = win.setTimeout(() => {
      repaintTimer = null;
      if (!state.destroyed && state.mounted) updateLiveDom();
    }, 95);
  }

  function applyThemeToHost(appCfg) {
    if (!themeEngine || typeof themeEngine.apply !== "function") return;
    try { themeEngine.apply(appCfg || state.settings.appearance); } catch (_e) {}
    syncTheme();
  }

  function applyThemeFastToHost(appCfg) {
    if (!themeEngine) return;
    try {
      if (typeof themeEngine.applyFast === "function") themeEngine.applyFast(appCfg || state.appearanceDraft);
      else if (typeof themeEngine.apply === "function") themeEngine.apply(appCfg || state.appearanceDraft);
    } catch (_e) {}
    syncTheme();
  }

  function applyLiveEditsPayload(payload) {
    if (!payload || typeof payload !== "object") return;
    const all = Array.isArray(payload.allItems) ? payload.allItems : (Array.isArray(payload.items) ? payload.items : []);
    const curKey = state.activeChatKey || "__new__";
    state.liveEdits = all.filter((x) => {
      if (!x) return false;
      if (curKey === "__new__") return x.chatKey === "__new__" || x.fallbackAny;
      return x.chatKey === curKey || x.deliveredConversationId === curKey || (x.fallbackAny && x.status === "pending");
    }).slice(-20);
  }

  function countPendingLiveEdits() {
    let n = 0;
    for (let i = 0; i < state.liveEdits.length; i += 1) {
      if (state.liveEdits[i] && state.liveEdits[i].status === "pending") n += 1;
    }
    return n;
  }

  function refreshLiveEdits() {
    return invokeIpc("agy-studio:get-live-edits", { chatKey: state.activeChatKey || "__new__" }).then((res) => {
      if (state.destroyed || !res || !res.ok) return res;
      applyLiveEditsPayload(res);
      renderPopoverStructure();
      updateLiveDom();
      if (state.isOpen && state.activeTab === "live-edits") {
        renderStructure();
      }
      return res;
    });
  }

  function insertTextIntoMainComposer(rawText) {
    const text = String(rawText || "").trim();
    if (!text || !doc || typeof doc.querySelector !== "function") return false;
    const candidates = doc.querySelectorAll('textarea, [contenteditable="true"]');
    for (let i = 0; i < candidates.length; i += 1) {
      const el = candidates[i];
      if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
      if (isHiddenAncestor(el, doc.body)) continue;
      try {
        el.focus();
        if (el.tagName === "TEXTAREA") {
          const proto = win && win.HTMLTextAreaElement && win.HTMLTextAreaElement.prototype;
          const desc = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
          if (desc && typeof desc.set === "function") desc.set.call(el, text);
          else el.value = text;
          const Evt = win && typeof win.Event === "function" ? win.Event : Event;
          el.dispatchEvent(new Evt("input", { bubbles: true }));
          return true;
        }
        el.textContent = text;
        const Evt = win && typeof win.Event === "function" ? win.Event : Event;
        el.dispatchEvent(new Evt("input", { bubbles: true }));
        return true;
      } catch (_e) {}
    }
    return false;
  }

  function sendLiveEditFromDraft() {
    if (state.liveEditBusy) return;
    const text = String(state.liveEditDraftText || "").trim();
    const imgs = Array.isArray(state.liveEditDraftImages) ? state.liveEditDraftImages.slice(0, 4) : [];
    if (!text && imgs.length === 0) return;

    const now = Date.now();
    const sig = text + "|" + imgs.map((x) => x.name).join(",");
    if (sig === state.lastSupplementSendSig && now - state.lastSupplementSendAt < 1500) {
      return;
    }
    state.lastSupplementSendSig = sig;
    state.lastSupplementSendAt = now;

    state.liveEditBusy = true;
    state.liveEditError = "";
    renderPopoverStructure();
    if (state.isOpen && state.activeTab === "live-edits") renderStructure();
    invokeIpc("agy-studio:send-live-edit", {
      chatKey: state.activeChatKey || "__new__",
      title: state.activeChatTitle || "",
      text,
      images: imgs.map((im) => ({ name: im.name, sourcePath: im.sourcePath || "", dataUrl: im.dataUrl || "" })),
      fallbackAny: !UUID_RE.test(String(state.activeChatKey || "")),
    }).then((res) => {
      if (state.destroyed) return;
      state.liveEditBusy = false;
      if (res && res.ok) {
        state.liveEditDraftText = "";
        state.liveEditDraftImages = [];
        state.liveEditError = "";
        applyLiveEditsPayload(res);
      } else {
        state.liveEditError = (res && res.error) || "SEND_FAILED";
      }
      renderPopoverStructure();
      updateLiveDom();
      if (state.isOpen && state.activeTab === "live-edits") renderStructure();
    });
  }

  function formatLiveEditStatus(status, tr) {
    if (status === "delivered" || status === "applied") return { label: tr.suppStatusDelivered, cls: "is-delivered" };
    if (status === "expired") return { label: tr.suppStatusExpired, cls: "is-expired" };
    return { label: tr.suppStatusPending, cls: "is-pending" };
  }

  function positionPopover() {
    if (!popoverMountEl || !win) return;
    if (!state.liveEditOpen) {
      popoverMountEl.style.left = "";
      popoverMountEl.style.top = "";
      popoverMountEl.style.right = "";
      popoverMountEl.style.bottom = "";
      return;
    }
    const vw = Number(win.innerWidth) || 1280;
    const vh = Number(win.innerHeight) || 800;
    const popW = Math.min(372, vw - 24);
    const popH = Math.min(360, vh - 24);
    let left = vw - popW - 16;
    let top = vh - popH - 64;

    if (widgetMountEl && state.settings.dockPosition !== "hidden" && typeof widgetMountEl.getBoundingClientRect === "function") {
      const r = widgetMountEl.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        if (r.top >= popH + 20) {
          top = r.top - popH - 10;
          left = r.right - popW;
        } else if (vh - r.bottom >= popH + 20) {
          top = r.bottom + 10;
          left = r.right - popW;
        } else if (r.left >= popW + 20) {
          left = r.left - popW - 10;
          top = r.top;
        } else {
          left = r.right + 10;
          top = r.top;
        }
      }
    }
    left = Math.max(12, Math.min(vw - popW - 12, Math.round(left)));
    top = Math.max(12, Math.min(vh - popH - 12, Math.round(top)));
    popoverMountEl.style.right = "";
    popoverMountEl.style.bottom = "";
    popoverMountEl.style.left = `${left}px`;
    popoverMountEl.style.top = `${top}px`;
  }

  function renderLiveEditPopoverMarkup() {
    if (!state.liveEditOpen) return "";
    const tr = t();
    const list = state.liveEdits || [];
    const draftImgs = state.liveEditDraftImages || [];
    const canSend = Boolean((state.liveEditDraftText && state.liveEditDraftText.trim()) || draftImgs.length > 0) && !state.liveEditBusy;
    const isBusy = state.telemetry.isGenerating;

    return `
      <div class="live-edit-popover" role="dialog" aria-label="${escAttr(tr.suppTitle)}">
        <div class="le-head">
          <div class="le-title-col">
            <span class="le-title">${iconSvg("bolt", 13)}<span>${escHtml(tr.suppTitle)}</span></span>
            <span class="le-sub">${escHtml(isBusy ? tr.suppActiveHint : tr.suppIdleHint)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <button type="button" class="icon-btn" data-action="open-live-edits-tab" title="${escAttr(tr.modalTitleSupplements)}">${iconSvg("expand", 12)}</button>
            <button type="button" class="icon-btn" data-action="close-live-edit" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 13)}</button>
          </div>
        </div>
        <div class="le-body">
          <textarea class="le-textarea" data-role="liveEditInput" placeholder="${escAttr(tr.suppPlaceholder)}">${escHtml(state.liveEditDraftText)}</textarea>
          ${draftImgs.length > 0 ? `
            <div class="le-thumbs">
              ${draftImgs.map((im, idx) => `
                <div class="le-thumb-chip">
                  ${im.previewDataUrl ? `<img class="le-thumb-img" src="${escAttr(im.previewDataUrl)}" alt=""/>` : iconSvg("image", 14)}
                  <span class="le-thumb-name">${escHtml(im.name || ("img-" + (idx + 1)))}</span>
                  <button type="button" class="preset-del-btn" data-action="remove-live-edit-img" data-idx="${idx}" title="${escAttr(tr.tooltipRemove)}">${iconSvg("close", 11)}</button>
                </div>
              `).join("")}
            </div>
          ` : ""}
          ${state.liveEditError ? `<span class="toast-text is-err" style="font-size:11px">${escHtml(state.liveEditError)}</span>` : ""}
          <div class="le-actions">
            <button type="button" class="btn btn-sm" data-action="pick-live-edit-images">${iconSvg("image", 12)}${escHtml(tr.suppPickPhoto)}</button>
            <div style="display:flex;align-items:center;gap:6px">
              ${list.length > 0 ? `<button type="button" class="btn btn-sm" data-action="clear-live-edits" title="${escAttr(tr.suppClearBtn)}">${iconSvg("trash", 12)}</button>` : ""}
              ${!isBusy && state.liveEditDraftText.trim() ? `<button type="button" class="btn btn-sm" data-action="insert-supplement-to-chat">${escHtml(tr.suppInsertChatBtn)}</button>` : ""}
              <button type="button" class="btn btn-sm btn-primary" ${canSend ? "" : "disabled"} data-action="send-live-edit">${iconSvg("send", 12)}${escHtml(tr.suppSendBtn)}</button>
            </div>
          </div>
          ${list.length > 0 ? renderLiveEditFeedHtml(list.slice().reverse().slice(0, 5), tr) : ""}
        </div>
      </div>
    `;
  }

  function renderLiveEditFeedHtml(items, tr) {
    return `
      <div class="le-feed" data-live="leFeed">
        ${items.map((it) => {
          const st = formatLiveEditStatus(it.status, tr);
          const tStr = new Date(it.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const imgCount = Array.isArray(it.images) ? it.images.length : 0;
          return `
            <div class="le-item">
              <div class="le-item-top">
                <span class="num">${escHtml(tStr)}${imgCount > 0 ? ` · ${imgCount} ${escHtml(tr.suppPhotoCount)}` : ""}</span>
                <span class="le-status-pill ${st.cls}">${escHtml(st.label)}</span>
              </div>
              ${it.text ? `<span style="color:var(--rx-fg-strong);word-break:break-word">${escHtml(it.text.slice(0, 140))}</span>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderPopoverStructure() {
    if (!popoverMountEl || state.destroyed) return;
    const tr = t();
    if (state.liveEditOpen && shadowRoot && shadowRoot.activeElement && popoverMountEl.contains(shadowRoot.activeElement) && shadowRoot.activeElement.getAttribute("data-role") === "liveEditInput") {
      const feedEl = popoverMountEl.querySelector('[data-live="leFeed"]');
      if (feedEl && state.liveEdits.length > 0) {
        const tmp = doc.createElement("div");
        tmp.innerHTML = renderLiveEditFeedHtml(state.liveEdits.slice().reverse().slice(0, 5), tr);
        if (tmp.firstElementChild) feedEl.replaceWith(tmp.firstElementChild);
      }
      positionPopover();
      return;
    }
    popoverMountEl.innerHTML = renderLiveEditPopoverMarkup();
    positionPopover();
  }

  function extractClipboardImages(clipboardData, onComplete) {
    const items = clipboardData && clipboardData.items ? clipboardData.items : null;
    if (!items || typeof items.length !== "number") return false;
    const files = [];
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      if (it && typeof it.type === "string" && it.type.indexOf("image/") === 0 && typeof it.getAsFile === "function") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length === 0) return false;
    const ReaderCtor = win && typeof win.FileReader === "function" ? win.FileReader : (typeof FileReader === "function" ? FileReader : null);
    if (!ReaderCtor) return false;
    files.forEach((file, idx) => {
      if (!Array.isArray(state.liveEditDraftImages)) state.liveEditDraftImages = [];
      if (state.liveEditDraftImages.length >= 4) return;
      const reader = new ReaderCtor();
      reader.onload = () => {
        if (state.destroyed || typeof reader.result !== "string") return;
        if (state.liveEditDraftImages.length >= 4) return;
        const rawExt = file.type && file.type.split("/")[1] ? file.type.split("/")[1].replace(/[^a-z0-9]/gi, "") : "png";
        state.liveEditDraftImages.push({
          name: file.name || `clipboard-${Date.now()}-${idx + 1}.${rawExt || "png"}`,
          sourcePath: "",
          dataUrl: reader.result,
          previewDataUrl: reader.result,
        });
        if (typeof onComplete === "function") onComplete();
      };
      try { reader.readAsDataURL(file); } catch (_err) {}
    });
    return true;
  }

  function scrapeDomQuotaSnapshot(force) {
    if (!doc || !doc.body) return;
    const now = Date.now();
    if (!force && now - state.lastQuotaScrapeAt < 4000) return;
    state.lastQuotaScrapeAt = now;
    try {
      const rawCheap = doc.body.textContent || "";
      if (!rawCheap || rawCheap.length < 30) return;
      if (!/limit\s*remaining|weekly\s*limit|five\s*hour|5[-\s]*hour|остаток\s*(?:недельн|5|пяти)|недельн[а-яё]*\s*лимит|5[-\s]*часов/i.test(rawCheap)) {
        return;
      }
      const container = (typeof doc.querySelector === "function" && (doc.querySelector('[role="dialog"]') || doc.querySelector("main"))) || doc.body;
      const txt = container.innerText || container.textContent || "";
      if (!txt || txt.length < 30) return;
      const parsed = parseQuotaFromDocumentText(txt, state.telemetry.modelName);
      if (!parsed) return;
      const sig = JSON.stringify(parsed);
      if (sig === state.lastQuotaScrapeSig && now - state.lastQuotaSyncAt < 30000) return;
      state.lastQuotaScrapeSig = sig;
      state.lastQuotaSyncAt = now;
      invokeIpc("agy-studio:sync-quota-snapshot", {
        gemini: parsed.gemini,
        claudeGpt: parsed.claudeGpt,
        activeChatKey: state.activeChatKey || "__new__",
      }).then((res) => {
        if (!state.destroyed && res && res.summary) {
          state.quotaSummary = res.summary;
          updateLiveDom();
          if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "export") {
            renderStructure();
          }
        }
      });
    } catch (_e) {}
  }

  function collectDomConversation() {
    if (!doc || typeof doc.querySelectorAll !== "function") return [];
    const out = [];
    try {
      const nodes = doc.querySelectorAll('[data-testid="user-message-content"], [data-testid="agent-response"]');
      for (let i = 0; nodes && i < nodes.length; i += 1) {
        const el = nodes[i];
        if (!el || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(el))) continue;
        const tid = typeof el.getAttribute === "function" ? el.getAttribute("data-testid") : "";
        const isUser = tid === "user-message-content";
        const text = isUser
          ? (el.textContent || "").trim()
          : (typeof extractVisibleResponseText === "function" ? extractVisibleResponseText(el) : (el.textContent || "")).trim();
        if (text) out.push({ role: isUser ? "user" : "agent", text });
      }
    } catch (_e) {}
    return out;
  }

  function getActiveChatQuotaDisplay() {
    const tr = t();
    const qs = state.quotaSummary;
    const ac = qs && qs.activeChat ? qs.activeChat : null;
    const fiveHour = ac ? formatQuotaPct(ac.fiveHourWindowPct || ac.fiveHourPct) : "0%";
    const week = ac ? formatQuotaPct(ac.weeklyPct) : "0%";
    const miniText = `${tr.quota5hShort} -${fiveHour} · ${tr.quotaWeekShort} -${week}`;
    return { fiveHour, week, miniText, activeChat: ac };
  }

  function pollStream() {
    if (state.destroyed) return;
    if (doc && doc.hidden) return;
    const now = Date.now();
    const isBusy = state.telemetry.isGenerating || (now - state.lastDomMutationAt < 3000);
    if (!isBusy && now - state.lastPollAt < 650) return;
    state.lastPollAt = now;

    sampleStreamTick();
    scrapeDomQuotaSnapshot(false);
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

  function getDisplayedPeakTps(tel) {
    return Math.max(tel.peakTps || 0, getDisplayedTps(tel) || 0);
  }

  function getDisplayedTpsUnit(tel, tr) {
    return !tel.isGenerating && tel.lastAvgTps > 0 ? `${tr.avgPrefix} ${tr.tpsUnit}` : tr.tpsUnit;
  }

  function findActivePresetLabel() {
    const id = state.chatPersona.activePreset;
    const customs = state.settings.customPresets || [];
    for (let i = 0; i < customs.length; i += 1) {
      if (customs[i].id === id) return customs[i].title;
    }
    return t().customPresetTitle;
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
      const rStr = tel.exactRespTokens > 0 ? formatCompact(tel.exactRespTokens) : `~${formatCompact(tel.respTokens)}`;
      chips.push(`<span class="metric-chip is-muted num">${escHtml(tr.respLabel)}: <b data-live="resp">${escHtml(rStr)}</b></span>`);
    }
    if (mf.chatTokens) {
      const chatText = tel.contextLabel || (tel.exactContextTokens > 0 ? formatCompact(tel.exactContextTokens) : `~${formatCompact(tel.chatTokens)}`);
      chips.push(`<span class="metric-chip is-muted num">${escHtml(tr.chatLabel)}: <b data-live="chat">${escHtml(chatText)}</b></span>`);
    }
    if (mf.model) {
      const modelTxt = tel.modelName || "AI";
      chips.push(`<span class="model-badge" data-live="model" title="${escAttr(modelTxt)}">${escHtml(modelTxt)}</span>`);
    }
    if (mf.quota) {
      const qd = getActiveChatQuotaDisplay();
      chips.push(`<span class="metric-chip is-muted num" data-live="quotaMini">${escHtml(qd.miniText)}</span>`);
    }

    if (chips.length === 0) {
      chips.push(`<span class="status-chip"><span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>Rudex</span>`);
    }

    const isPinned = Boolean(state.settings.pinned);
    const joined = chips.join('<span class="pill-sep"></span>');
    const hasPendingLe = countPendingLiveEdits() > 0;
    const grip = `<span class="drag-grip">${iconSvg("grip", 12)}</span>`;
    const btns = isPreview
      ? `<span class="icon-btn">${iconSvg("bolt", 12)}</span><span class="icon-btn">${iconSvg("expand", 12)}</span><span class="icon-btn${isPinned ? " is-pinned" : ""}">${iconSvg("pin", 12)}</span><span class="icon-btn is-primary">${iconSvg("gear", 12)}</span>`
      : `<button type="button" class="icon-btn" data-action="toggle-live-edit" data-no-drag="1" title="${escAttr(tr.tooltipSupplement)}">${iconSvg("bolt", 12)}<span class="le-dot-ind" data-live="liveEditDot"${hasPendingLe ? "" : ' style="display:none"'}></span></button><button type="button" class="icon-btn" data-action="to-medium" data-no-drag="1" title="${escAttr(tr.tooltipExpand)}">${iconSvg("expand", 12)}</button><button type="button" class="icon-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-no-drag="1" title="${escAttr(isPinned ? tr.tooltipPinUnlock : tr.tooltipPinLock)}">${iconSvg("pin", 12)}</button><button type="button" class="icon-btn is-primary" data-action="open-settings" data-no-drag="1" title="${escAttr(tr.tooltipSettings)}">${iconSvg("gear", 12)}</button>`;

    const bodyAttrs = isPreview ? "" : ` data-widget-body="1"${isPinned ? "" : ' data-drag-handle="1"'}`;
    return `<div class="mini-pill"${bodyAttrs}>${grip}${joined}<span class="pill-sep"></span>${btns}</div>`;
  }

  function renderMediumCardMarkup() {
    const tr = t();
    const tel = state.telemetry;
    const isPinned = Boolean(state.settings.pinned);
    const phase = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const chatVal = tel.contextLabel || (tel.exactContextTokens > 0 ? `${formatCompact(tel.exactContextTokens)} ${tr.tokShort}` : `~${formatCompact(tel.chatTokens)} ${tr.tokShort}`);
    const respVal = tel.exactRespTokens > 0 ? `${formatCompact(tel.exactRespTokens)} ${tr.tokShort}` : `~${formatCompact(tel.respTokens)} ${tr.tokShort}`;
    const personaName = findActivePresetLabel();
    const personaLabel = state.chatPersona.enabled ? `${tr.personaBadgeOn} ${personaName}` : tr.personaBadgeOff;
    const langText = state.locale === "en" ? "EN" : "RU";
    const shownTps = getDisplayedTps(tel);
    const shownUnit = getDisplayedTpsUnit(tel, tr);

    return `
      <div class="med-card" data-widget-body="1"${isPinned ? "" : ' data-drag-handle="1"'}>
        <div class="med-header">
          <div class="med-head-left">
            <span class="drag-grip">${iconSvg("grip", 12)}</span>
            <span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>
            <span class="med-phase" data-live="phase">${escHtml(phase)}</span>
          </div>
          <div class="med-head-actions">
            <button type="button" class="lang-pill-btn" data-action="toggle-locale" data-no-drag="1" title="${escAttr(tr.tooltipLang)}">${langText}</button>
            <button type="button" class="icon-btn" data-action="toggle-live-edit" data-no-drag="1" title="${escAttr(tr.tooltipSupplement)}">${iconSvg("bolt", 12)}<span class="le-dot-ind" data-live="liveEditDot"${countPendingLiveEdits() > 0 ? "" : ' style="display:none"'}></span></button>
            <button type="button" class="icon-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-no-drag="1" title="${escAttr(isPinned ? tr.tooltipPinUnlock : tr.tooltipPinLock)}">${iconSvg("pin", 12)}</button>
            <button type="button" class="icon-btn" data-action="to-mini" data-no-drag="1" title="${escAttr(tr.tooltipMini)}">${iconSvg("minimize", 12)}</button>
            <button type="button" class="icon-btn is-primary" data-action="open-settings" data-no-drag="1" title="${escAttr(tr.tooltipSettings)}">${iconSvg("gear", 12)}</button>
          </div>
        </div>
        <div class="med-body">
          <div class="med-tps-row">
            <div class="med-tps-hero">
              <span class="med-tps-num num" data-live="tps">${shownTps}</span>
              <span class="med-tps-unit" data-live="tpsUnit">${escHtml(shownUnit)}</span>
            </div>
            <span class="med-peak num">${escHtml(tr.peakLabel)}: <b data-live="peak">${getDisplayedPeakTps(tel)}</b></span>
          </div>
          <div class="med-spark-box" data-live="sparkMed">${buildSparklineMarkup(tel.samples, 260, 38, "med")}</div>
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
          <div class="med-quota-row">
            <span>${escHtml(tr.quotaSectionTitle)}</span>
            <span class="num" style="color:var(--rx-fg-strong)" data-live="quotaMed">${escHtml(getActiveChatQuotaDisplay().miniText)}</span>
          </div>
          <div class="med-footer">
            <span class="med-model-tag" data-live="model" title="${escAttr(tel.modelName || tr.modelUnknown)}">${escHtml(tel.modelName || "—")}</span>
            <button type="button" class="med-persona-pill" data-action="open-persona-tab" data-no-drag="1">
              <span class="status-dot" style="background:${state.chatPersona.enabled ? "var(--rx-success)" : "var(--rx-muted)"}"></span>
              <span>${escHtml(personaLabel)}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function formatSparkFootMeta(tel, tr) {
    const parts = [];
    if (tel.exactCacheTokens > 0) parts.push(`${tr.cacheLabel}: ${formatCompact(tel.exactCacheTokens)}`);
    if (tel.lastDurSec > 0) parts.push(`${tel.lastDurSec}${tr.secUnit}`);
    if (tel.lastThinkingSec > 0) parts.push(`${tel.lastThinkingSec}${tr.secUnit} think`);
    return parts.join(" · ");
  }

  function renderMonitorTab() {
    const tr = t();
    const tel = state.telemetry;
    const chatNum = tel.contextLabel || (tel.exactContextTokens > 0 ? formatCompact(tel.exactContextTokens) : `~${formatCompact(tel.chatTokens)}`);
    const respNum = tel.exactRespTokens > 0 ? formatCompact(tel.exactRespTokens) : `~${formatCompact(tel.respTokens)}`;
    const phase = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const shownTps = getDisplayedTps(tel);
    const shownUnit = getDisplayedTpsUnit(tel, tr);
    const footMeta = formatSparkFootMeta(tel, tr);
    return `
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiTps)}</span>
          <span class="kpi-val num"><span data-live="tps">${shownTps}</span><span class="kpi-unit is-accent" data-live="tpsUnit">${escHtml(shownUnit)}</span></span>
          <span class="kpi-sub" data-live="kpiState">${escHtml(tel.isGenerating ? tr.kpiSubLive : tr.kpiSubReady)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiPeak)}</span>
          <span class="kpi-val num"><span data-live="peak">${getDisplayedPeakTps(tel)}</span><span class="kpi-unit">TPS</span></span>
          <span class="kpi-sub">${escHtml(tr.kpiSubPeak)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiResp)}</span>
          <span class="kpi-val num"><span data-live="respNum">${escHtml(respNum)}</span><span class="kpi-unit">${escHtml(tr.tokShort)}</span></span>
          <span class="kpi-sub" data-live="respSub">${escHtml(tel.exactRespTokens > 0 ? tr.kpiSubExact : tr.kpiSubEst)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${escHtml(tr.kpiChat)}</span>
          <span class="kpi-val num"><span data-live="chatNum">${escHtml(chatNum)}</span><span class="kpi-unit" data-live="chatUnit" style="${tel.contextLabel ? "display:none" : ""}">${escHtml(tr.tokShort)}</span></span>
          <span class="kpi-sub" data-live="chatSub">${escHtml(tel.exactContextTokens > 0 ? tr.kpiSubExact : tr.kpiSubEst)}</span>
        </div>
      </div>

      <div class="card card-pad">
        <div class="spark-panel-head">
          <div class="spark-meta">
            <span class="status-pill" style="flex-shrink:0">
              <span class="status-dot${tel.isGenerating ? " is-live" : ""}" data-live="dot"></span>
              <span data-live="phase">${escHtml(phase)}</span>
            </span>
            <span class="status-pill" style="color:var(--rx-muted)" title="${escAttr(tel.modelName || tr.modelUnknown)}"><span class="status-pill-text" data-live="model">${escHtml(tel.modelName || tr.modelUnknown)}</span></span>
          </div>
          <button type="button" class="btn btn-sm" data-action="reset-telemetry">${iconSvg("reset", 13)}${escHtml(tr.resetStats)}</button>
        </div>
        <div class="modal-spark-box" data-live="sparkModal">${buildSparklineMarkup(tel.samples, 560, 102, "modal")}</div>
        <div class="spark-card-foot">
          <span class="spark-chat-label" data-live="chatBadge">${escHtml(formatChatBadgeLabel())}</span>
          <span class="num" style="flex-shrink:0" data-live="sparkFootMeta">${escHtml(footMeta)}</span>
        </div>
      </div>

      <div class="quota-strip">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="row-title" style="font-size:12px">${escHtml(tr.quotaSectionTitle)}:</span>
          <span class="status-pill num" data-live="quotaMed">${escHtml(getActiveChatQuotaDisplay().miniText)}</span>
        </div>
        <button type="button" class="btn btn-sm" data-action="open-export-limits">${escHtml(tr.quotaOpenLimitsLink)}</button>
      </div>
    `;
  }

  function renderAppearanceDrawerBody() {
    const tr = t();
    const isRu = state.locale !== "en";
    const sub = state.appearanceSubTab || "theme";
    const subTabs = [
      { id: "theme", label: tr.appSubTheme },
      { id: "wallpaper", label: tr.appSubWallpaper },
      { id: "greeting", label: tr.appSubGreeting },
      { id: "text", label: tr.appSubText },
    ];

    let inner = "";
    if (sub === "theme") inner = renderAppearanceThemeSub(tr, isRu);
    else if (sub === "wallpaper") inner = renderAppearanceWallpaperSub(tr, isRu);
    else if (sub === "greeting") inner = renderAppearanceGreetingSub(tr, isRu);
    else inner = renderAppearanceTextSub(tr, isRu);

    return `
      <div class="subtab-bar">
        ${subTabs.map((st) => `
          <button type="button" class="subtab-btn${st.id === sub ? " is-active" : ""}" data-action="set-app-subtab" data-val="${st.id}">${escHtml(st.label)}</button>
        `).join("")}
      </div>
      ${inner}
    `;
  }

  function renderAppearanceThemeSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const presets = spGetThemePresets();
    const fineOpen = Boolean(state.openDisclosures.themeFine);

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.appThemesTitle)}</span>
        <div class="theme-grid">
          ${presets.map((pr) => {
            const sel = draft.presetId === pr.id;
            const sw = pr.vars;
            return `
              <button type="button" class="theme-card${sel ? " is-selected" : ""}" data-action="select-theme-preset" data-id="${escAttr(pr.id)}">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(isRu ? pr.nameRu : pr.nameEn)}</span>
                <span class="theme-dots">
                  <span class="theme-dot" style="background:${escAttr(sw.canvasBg)}"></span>
                  <span class="theme-dot" style="background:${escAttr(sw.cardBg)}"></span>
                  <span class="theme-dot" style="background:${escAttr(sw.accentColor)}"></span>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appAccentQuick)}</span>
        <div class="accent-row">
          ${CURATED_ACCENTS.map((hex) => `
            <button type="button" class="accent-dot-btn${draft.accentColor.toLowerCase() === hex ? " is-selected" : ""}" data-action="pick-accent-dot" data-val="${hex}" style="background:${hex}" aria-label="${hex}"></button>
          `).join("")}
          <label class="color-box" style="margin-left:auto">
            <span>${escHtml(tr.appCustomColor)}</span>
            <input type="color" class="color-input" data-app-field="accentColor" value="${escAttr(draft.accentColor)}"/>
          </label>
        </div>
      </div>

      <details class="rx-details" data-disc="themeFine"${fineOpen ? " open" : ""}>
        <summary>${escHtml(tr.appFineTune)}</summary>
        <div class="rx-details-body">
          <div class="control-grid-2">
            <div class="color-box"><span>${escHtml(tr.appCanvasColor)}</span><input type="color" class="color-input" data-app-field="canvasBg" value="${escAttr(draft.canvasBg)}"/></div>
            <div class="color-box"><span>${escHtml(tr.appCardColor)}</span><input type="color" class="color-input" data-app-field="cardBg" value="${escAttr(draft.cardBg)}"/></div>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appRadius)}</span><b class="num" data-live-app-val="radius">${draft.radius}px</b></div>
            <input type="range" class="range-input" min="4" max="20" step="1" data-app-field="radius" value="${draft.radius}"/>
          </div>
          <div class="card">
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appPolishLabel)}</span>
              <button type="button" class="switch${draft.uiPolish ? " is-on" : ""}" role="switch" aria-checked="${draft.uiPolish ? "true" : "false"}" data-action="toggle-appearance-polish"><span class="switch-thumb"></span></button>
            </div>
          </div>
        </div>
      </details>
    `;
  }

  function renderAppearanceWallpaperSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const wp = draft.wallpaper;
    const grads = spGetGradientPresets();
    const modes = [
      { id: "none", label: tr.appWpNone },
      { id: "gradient", label: tr.appWpGradient },
      { id: "image", label: tr.appWpImage },
      { id: "video", label: tr.appWpVideo },
    ];
    const readOpen = Boolean(state.openDisclosures.wpReadability);
    const gradFineOpen = Boolean(state.openDisclosures.gradFine);

    let modeBody = "";
    if (wp.type === "none") {
      modeBody = `<div class="empty-msg">${escHtml(tr.appWpNoneHint)}</div>`;
    } else if (wp.type === "gradient") {
      modeBody = `
        <div class="grad-chips">
          ${grads.map((g) => `
            <button type="button" class="grad-chip${wp.gradientPreset === g.id ? " is-selected" : ""}" data-action="select-gradient-preset" data-id="${escAttr(g.id)}" style="background:linear-gradient(${g.angle}deg, ${escAttr(g.colors[0])}, ${escAttr(g.colors[1])}, ${escAttr(g.colors[2])})">${escHtml(isRu ? g.nameRu : g.nameEn)}</button>
          `).join("")}
        </div>
        <div class="card">
          <div class="row-item">
            <span class="row-title">${escHtml(tr.appWpAnimated)}</span>
            <button type="button" class="switch${wp.gradAnimated ? " is-on" : ""}" role="switch" aria-checked="${wp.gradAnimated ? "true" : "false"}" data-action="toggle-wallpaper-animated"><span class="switch-thumb"></span></button>
          </div>
        </div>
        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpDim)}</span><b class="num" data-live-app-val="wallpaper.dim">${wp.dim}%</b></div>
            <input type="range" class="range-input" min="0" max="85" step="1" data-app-field="wallpaper.dim" value="${wp.dim}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpOpacity)}</span><b class="num" data-live-app-val="wallpaper.opacity">${wp.opacity}%</b></div>
            <input type="range" class="range-input" min="15" max="100" step="1" data-app-field="wallpaper.opacity" value="${wp.opacity}"/>
          </div>
        </div>
        <details class="rx-details" data-disc="gradFine"${gradFineOpen ? " open" : ""}>
          <summary>${escHtml(tr.appFineTune)}</summary>
          <div class="rx-details-body">
            <div class="control-grid-3">
              <div class="color-box"><span>${escHtml(tr.appColorLabels[0])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor0" value="${escAttr(wp.gradColors[0])}"/></div>
              <div class="color-box"><span>${escHtml(tr.appColorLabels[1])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor1" value="${escAttr(wp.gradColors[1])}"/></div>
              <div class="color-box"><span>${escHtml(tr.appColorLabels[2])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor2" value="${escAttr(wp.gradColors[2])}"/></div>
            </div>
            <div class="control-grid-2">
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpAngle)}</span><b class="num" data-live-app-val="wallpaper.gradAngle">${wp.gradAngle}°</b></div>
                <input type="range" class="range-input" min="0" max="360" step="5" data-app-field="wallpaper.gradAngle" value="${wp.gradAngle}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpSpeed)}</span><b class="num" data-live-app-val="wallpaper.gradSpeed">${wp.gradSpeed}s</b></div>
                <input type="range" class="range-input" min="6" max="40" step="1" data-app-field="wallpaper.gradSpeed" value="${wp.gradSpeed}"/>
              </div>
            </div>
          </div>
        </details>
      `;
    } else {
      const isVid = wp.type === "video";
      modeBody = `
        <div class="media-file-bar">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
            <button type="button" class="btn btn-sm btn-primary" data-action="pick-media" data-kind="${isVid ? "video" : "image"}">${iconSvg("upload", 12)}${escHtml(isVid ? tr.appWpPickVideo : tr.appWpPickImage)}</button>
            <span style="font-size:11px;color:${wp.mediaFile ? "var(--rx-fg-strong)" : "var(--rx-muted)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(wp.mediaFile || tr.appWpNoFileHint)}</span>
          </div>
          ${wp.mediaUrl ? `<button type="button" class="btn btn-sm" data-action="clear-wallpaper-media">${escHtml(tr.appWpClearMedia)}</button>` : ""}
        </div>
        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpDim)}</span><b class="num" data-live-app-val="wallpaper.dim">${wp.dim}%</b></div>
            <input type="range" class="range-input" min="0" max="85" step="1" data-app-field="wallpaper.dim" value="${wp.dim}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpBlur)}</span><b class="num" data-live-app-val="wallpaper.blur">${wp.blur}px</b></div>
            <input type="range" class="range-input" min="0" max="24" step="1" data-app-field="wallpaper.blur" value="${wp.blur}"/>
          </div>
        </div>
        ${isVid ? `
          <div class="card">
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appWpAutoPause)}</span>
              <button type="button" class="switch${wp.pauseWhenHidden ? " is-on" : ""}" role="switch" aria-checked="${wp.pauseWhenHidden ? "true" : "false"}" data-action="toggle-wallpaper-autopause"><span class="switch-thumb"></span></button>
            </div>
          </div>
        ` : ""}
      `;
    }

    const readabilitySection = wp.type !== "none" ? `
      <details class="rx-details" data-disc="wpReadability"${readOpen ? " open" : ""}>
        <summary>${escHtml(tr.appWpReadability)}</summary>
        <div class="rx-details-body">
          <div class="control-grid-2">
            <div class="slider-box">
              <div class="slider-head"><span>${escHtml(tr.appMessageCardOpacity)}</span><b class="num" data-live-app-val="messageCardOpacity">${draft.messageCardOpacity}%</b></div>
              <input type="range" class="range-input" min="0" max="96" step="2" data-app-field="messageCardOpacity" value="${draft.messageCardOpacity}"/>
            </div>
            <div class="slider-box">
              <div class="slider-head"><span>${escHtml(tr.appGlassOpacity)}</span><b class="num" data-live-app-val="glassOpacity">${draft.glassOpacity}%</b></div>
              <input type="range" class="range-input" min="25" max="100" step="1" data-app-field="glassOpacity" value="${draft.glassOpacity}"/>
            </div>
            <div class="slider-box">
              <div class="slider-head"><span>${escHtml(tr.appGlassBlur)}</span><b class="num" data-live-app-val="glassBlur">${draft.glassBlur}px</b></div>
              <input type="range" class="range-input" min="0" max="24" step="1" data-app-field="glassBlur" value="${draft.glassBlur}"/>
            </div>
            ${wp.type !== "gradient" ? `
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpOpacity)}</span><b class="num" data-live-app-val="wallpaper.opacity">${wp.opacity}%</b></div>
                <input type="range" class="range-input" min="15" max="100" step="1" data-app-field="wallpaper.opacity" value="${wp.opacity}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpScale)}</span><b class="num" data-live-app-val="wallpaper.scale">${wp.scale}%</b></div>
                <input type="range" class="range-input" min="100" max="130" step="1" data-app-field="wallpaper.scale" value="${wp.scale}"/>
              </div>
            ` : ""}
          </div>
          <div class="card">
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appHighContrastText)}</span>
              <button type="button" class="switch${draft.highContrastText !== false ? " is-on" : ""}" role="switch" aria-checked="${draft.highContrastText !== false ? "true" : "false"}" data-action="toggle-appearance-contrast"><span class="switch-thumb"></span></button>
            </div>
          </div>
        </div>
      </details>
    ` : "";

    return `
      <div class="subtab-bar">
        ${modes.map((m) => `
          <button type="button" class="subtab-btn${wp.type === m.id ? " is-active" : ""}" data-action="set-wallpaper-type" data-val="${m.id}">${escHtml(m.label)}</button>
        `).join("")}
      </div>
      ${modeBody}
      ${readabilitySection}
    `;
  }

  function resolvePreviewGreeting(gd) {
    const captured = translator && typeof translator.getCapturedUserName === "function" ? translator.getCapturedUserName() : "";
    const nameVal = (gd.displayName || "").trim() || captured || (state.locale === "en" ? "Ivan" : "Иван");
    let rawTitle = (gd.title || "").trim();
    if (!rawTitle) {
      rawTitle = gd.mode === "minimal"
        ? (state.locale === "en" ? "Ready." : "Готов к работе.")
        : "{time}, {name}";
    }
    if (translator && typeof translator.resolveGreetingTemplate === "function") {
      return {
        title: translator.resolveGreetingTemplate(rawTitle, nameVal, state.locale, new Date()),
        subtitle: gd.subtitle.trim() ? translator.resolveGreetingTemplate(gd.subtitle.trim(), nameVal, state.locale, new Date()) : "",
      };
    }
    return { title: rawTitle.replace(/\{name\}/gi, nameVal), subtitle: gd.subtitle || "" };
  }

  function renderAppearanceGreetingSub(tr, isRu) {
    const gd = spNormalizeGreeting(state.greetingDraft);
    const presets = isRu ? GREETING_QUICK_PRESETS.ru : GREETING_QUICK_PRESETS.en;
    const modes = [
      { id: "time-of-day", label: tr.greetModeTime },
      { id: "custom", label: tr.greetModeCustom },
      { id: "minimal", label: tr.greetModeMinimal },
    ];
    const autoName = (translator && typeof translator.getCapturedUserName === "function" ? translator.getCapturedUserName() : "") || (isRu ? "Иван" : "Ivan");
    const preview = resolvePreviewGreeting(gd);

    return `
      <div class="card">
        <div class="row-item">
          <div class="row-info">
            <span class="row-title">${escHtml(tr.greetMasterTitle)}</span>
            <span class="row-desc">${escHtml(tr.greetMasterDesc)}</span>
          </div>
          <button type="button" class="switch${gd.enabled ? " is-on" : ""}" role="switch" aria-checked="${gd.enabled ? "true" : "false"}" data-action="toggle-greeting-enabled"><span class="switch-thumb"></span></button>
        </div>
      </div>

      <div class="subtab-bar">
        ${modes.map((m) => `
          <button type="button" class="subtab-btn${gd.mode === m.id ? " is-active" : ""}" data-action="set-greeting-mode" data-val="${m.id}">${escHtml(m.label)}</button>
        `).join("")}
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.greetPresetsLabel)}</span>
        <div class="token-chips">
          ${presets.map((p) => `
            <button type="button" class="btn btn-sm" data-action="apply-greeting-preset" data-id="${escAttr(p.id)}">${escHtml(p.label)}</button>
          `).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.greetTitleLabel)}</span>
        <input type="text" class="text-input" data-greet-field="title" maxlength="160" value="${escAttr(gd.title)}" placeholder="${escAttr(tr.greetTitlePlaceholder)}"/>
        <div class="token-chips">
          ${["{name}", "{time}", "{weekday}", "{date}"].map((tok) => `
            <button type="button" class="token-chip" data-action="insert-greeting-token" data-val="${tok}">${tok}</button>
          `).join("")}
        </div>
      </div>

      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${escHtml(tr.greetNameLabel)}</span>
          <input type="text" class="text-input" data-greet-field="displayName" maxlength="60" value="${escAttr(gd.displayName)}" placeholder="${escAttr(tr.greetNameAutoPrefix + " " + autoName)}"/>
        </div>
        <div class="section-group">
          <span class="section-label">${escHtml(tr.greetSubtitleLabel)}</span>
          <input type="text" class="text-input" data-greet-field="subtitle" maxlength="180" value="${escAttr(gd.subtitle)}" placeholder="${escAttr(tr.greetSubtitlePlaceholder)}"/>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.greetPlaceholderLabel)}</span>
        <input type="text" class="text-input" data-greet-field="placeholder" maxlength="140" value="${escAttr(gd.placeholder)}" placeholder="${escAttr(tr.greetPlaceholderDefault)}"/>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.greetPreviewLabel)}</span>
        <div class="greeting-preview-card">
          <div class="greeting-preview-title" data-live="greetPreviewTitle">${escHtml(gd.enabled ? preview.title : (isRu ? `Привет, ${autoName}! Что создадим сегодня?` : `Hey ${autoName}, what should we build today?`))}</div>
          <div class="greeting-preview-sub" data-live="greetPreviewSub" style="${gd.enabled && preview.subtitle ? "" : "display:none"}">${escHtml(preview.subtitle)}</div>
          <div class="greeting-preview-composer" data-live="greetPreviewComposer">${escHtml(gd.enabled && gd.placeholder.trim() ? gd.placeholder.trim() : tr.greetPreviewInputFallback)}</div>
        </div>
      </div>
    `;
  }

  function renderAppearanceTextSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const ty = draft.typography;
    const fonts = spGetFontPresets();
    const profiles = state.settings.appearanceProfiles || [];
    const densities = [
      { id: "compact", label: tr.appDensityCompact },
      { id: "comfortable", label: tr.appDensityComfort },
      { id: "spacious", label: tr.appDensitySpacious },
    ];

    return `
      <div class="control-grid-2">
        <div class="section-group">
          <span class="section-label">${escHtml(tr.appUiFont)}</span>
          <select class="select-input" data-app-field="typography.uiFont">
            ${(fonts.ui || []).map((f) => `<option value="${escAttr(f.id)}"${ty.uiFont === f.id ? " selected" : ""}>${escHtml(isRu ? f.label : (f.labelEn || f.label))}</option>`).join("")}
          </select>
        </div>
        <div class="section-group">
          <span class="section-label">${escHtml(tr.appMonoFont)}</span>
          <select class="select-input" data-app-field="typography.monoFont">
            ${(fonts.mono || []).map((f) => `<option value="${escAttr(f.id)}"${ty.monoFont === f.id ? " selected" : ""}>${escHtml(isRu ? f.label : (f.labelEn || f.label))}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="control-grid-2">
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appFontSize)}</span><b class="num" data-live-app-val="typography.fontSize">${ty.fontSize}px</b></div>
          <input type="range" class="range-input" min="12" max="18" step="1" data-app-field="typography.fontSize" value="${ty.fontSize}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appLineHeight)}</span><b class="num" data-live-app-val="typography.lineHeight">${ty.lineHeight}</b></div>
          <input type="range" class="range-input" min="1.25" max="1.9" step="0.05" data-app-field="typography.lineHeight" value="${ty.lineHeight}"/>
        </div>
      </div>

      <div class="slider-box">
        <div class="slider-head"><span>${escHtml(tr.appChatWidth)}</span><b class="num" data-live-app-val="typography.chatMaxWidth">${ty.chatMaxWidth >= 680 ? ty.chatMaxWidth + "px" : tr.appChatWidthAuto}</b></div>
        <input type="range" class="range-input" min="640" max="1180" step="20" data-app-field="typography.chatMaxWidth" value="${ty.chatMaxWidth >= 680 ? ty.chatMaxWidth : 640}"/>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appDensity)}</span>
        <div class="subtab-bar">
          ${densities.map((d) => `
            <button type="button" class="subtab-btn${ty.density === d.id ? " is-active" : ""}" data-action="set-density" data-val="${d.id}">${escHtml(d.label)}</button>
          `).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appProfilesTitle)}</span>
        ${profiles.length > 0 ? `
          <div class="profile-strip">
            ${profiles.map((prof) => `
              <div class="profile-chip" role="button" tabindex="0" data-action="apply-appearance-profile" data-id="${escAttr(prof.id)}">
                <span>${escHtml(prof.name)}</span>
                <button type="button" class="preset-del-btn" data-action="delete-appearance-profile" data-id="${escAttr(prof.id)}" title="${escAttr(tr.tooltipDelete)}">${iconSvg("trash", 11)}</button>
              </div>
            `).join("")}
          </div>
        ` : ""}
        <div class="preset-add-row">
          <input type="text" class="text-input" data-role="newProfileInput" maxlength="44" value="${escAttr(state.newProfileName)}" placeholder="${escAttr(tr.appProfilePlaceholder)}"/>
          <button type="button" class="btn btn-sm" data-action="save-appearance-profile">${iconSvg("plus", 12)}${escHtml(tr.appSaveProfile)}</button>
        </div>
      </div>
    `;
  }

  function renderPersonaTab() {
    const tr = t();
    const s = state.settings;
    const cp = state.chatPersona;
    const bytes = utf8ByteLength(state.draftPersonaText);
    const estTok = spTokenEst(state.draftPersonaText);
    const overWarn = bytes >= 20000;
    const customs = s.customPresets || [];
    const hasUnsaved = Boolean(state.draftDirty && state.draftPersonaText.trim() !== (cp.text || "").trim());
    const strictOn = cp.strict !== false;

    return `
      <div class="persona-stack">
        <div class="spark-meta">
          <span class="status-pill" data-live="chatBadge">
            <span class="status-dot" style="background:${state.activeChatKey === "__new__" ? "var(--rx-muted)" : "var(--rx-accent)"}"></span>
            <span>${escHtml(formatChatBadgeLabel())}</span>
          </span>
          <span class="nav-badge">${iconSvg("bolt", 11)} ${escHtml(tr.personaHookBadge)}</span>
          <span class="row-desc" style="flex-basis:100%">${escHtml(tr.chatScopeHint)}</span>
        </div>

        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.personaMasterTitle)}</span>
              <span class="row-desc">${escHtml(tr.personaMasterDesc)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end">
              ${hasUnsaved ? `<span class="nav-badge" style="color:var(--rx-warning);border-color:var(--rx-warning)">${escHtml(tr.personaUnsavedTag)}</span>` : ""}
              <span class="${cp.enabled ? "badge-active" : "nav-badge"}">${escHtml(cp.enabled ? tr.personaActiveTag : tr.personaOffTag)}</span>
              <button type="button" class="switch${cp.enabled ? " is-on" : ""}" role="switch" aria-checked="${cp.enabled ? "true" : "false"}" data-action="toggle-persona-enabled"><span class="switch-thumb"></span></button>
            </div>
          </div>
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.personaStrictLabel)}</span>
              <span class="row-desc">${escHtml(tr.personaStrictDesc)}</span>
            </div>
            <button type="button" class="switch${strictOn ? " is-on" : ""}" role="switch" aria-checked="${strictOn ? "true" : "false"}" data-action="toggle-persona-strict"><span class="switch-thumb"></span></button>
          </div>
        </div>

        <div class="section-group">
          <div class="editor-meta-row">
            <span class="section-label">${escHtml(tr.personaEditorLabel)}</span>
            <span class="num" data-role="byteCounter" style="color:${overWarn ? "var(--rx-warning)" : "var(--rx-muted)"}">${bytes.toLocaleString()} / ${MAX_PERSONA_BODY_BYTES.toLocaleString()} ${escHtml(tr.personaBytes)} · ~${estTok.toLocaleString()} ${escHtml(tr.tokShort)}${overWarn ? " · " + escHtml(tr.personaLimitWarn) : ""}</span>
          </div>
          <textarea class="editor-box" data-role="personaEditor" spellcheck="false" placeholder="${escAttr(tr.personaEditorPlaceholder)}">${escHtml(state.draftPersonaText)}</textarea>
        </div>

        <div class="action-bar">
          <div class="action-btns">
            <button type="button" class="btn btn-primary" data-action="save-persona">${iconSvg("check", 13)}${escHtml(tr.personaApplyBtn)}</button>
            <button type="button" class="btn" data-action="clear-persona">${escHtml(tr.personaClearBtn)}</button>
          </div>
          <span class="toast-text${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>
        </div>

        <div class="section-group">
          <span class="section-label">${escHtml(tr.personaPresetsLabel)}</span>
          ${customs.length > 0 ? `
            <div class="preset-strip">
              ${customs.map((item) => `
                <div class="preset-card${cp.activePreset === item.id ? " is-selected" : ""}" role="button" tabindex="0" data-action="select-preset" data-id="${escAttr(item.id)}">
                  <div class="preset-head">
                    <span class="preset-name">${escHtml(item.title)}</span>
                    <button type="button" class="preset-del-btn" data-action="delete-custom-preset" data-id="${escAttr(item.id)}" title="${escAttr(tr.tooltipDelete)}">${iconSvg("trash", 12)}</button>
                  </div>
                  <span class="choice-desc">${escHtml(tr.personaCustomLabel)}</span>
                </div>
              `).join("")}
            </div>
          ` : ""}
          <div class="preset-add-row">
            <input type="text" class="text-input" data-role="newPresetInput" maxlength="44" value="${escAttr(state.newPresetName)}" placeholder="${escAttr(tr.personaSavePresetPlaceholder)}"/>
            <button type="button" class="btn btn-sm" data-action="save-custom-preset">${iconSvg("plus", 12)}${escHtml(tr.personaAddPresetBtn)}</button>
          </div>
        </div>

        <div class="row-desc" style="font-family:var(--rx-mono);font-size:11px;word-break:break-all">
          ${escHtml(tr.personaRulePathLabel)} ${escHtml(state.personaFilePath)}
        </div>
      </div>
    `;
  }

  function renderSupplementsTab() {
    const tr = t();
    const list = state.liveEdits || [];
    const draftImgs = state.liveEditDraftImages || [];
    const isBusy = state.telemetry.isGenerating;
    const canSend = Boolean((state.liveEditDraftText && state.liveEditDraftText.trim()) || draftImgs.length > 0) && !state.liveEditBusy;

    return `
      <div class="hint-banner">${iconSvg("bolt", 14)}<span>${escHtml(isBusy ? tr.suppActiveHint : tr.suppIdleHint)}</span></div>

      <div class="section-group">
        <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px">
          <textarea class="le-textarea" style="min-height:92px" data-role="liveEditInput" placeholder="${escAttr(tr.suppPlaceholder)}">${escHtml(state.liveEditDraftText)}</textarea>
          ${draftImgs.length > 0 ? `
            <div class="le-thumbs">
              ${draftImgs.map((im, idx) => `
                <div class="le-thumb-chip">
                  ${im.previewDataUrl ? `<img class="le-thumb-img" src="${escAttr(im.previewDataUrl)}" alt=""/>` : iconSvg("image", 14)}
                  <span class="le-thumb-name">${escHtml(im.name || ("img-" + (idx + 1)))}</span>
                  <button type="button" class="preset-del-btn" data-action="remove-live-edit-img" data-idx="${idx}" title="${escAttr(tr.tooltipRemove)}">${iconSvg("close", 11)}</button>
                </div>
              `).join("")}
            </div>
          ` : ""}
          ${state.liveEditError ? `<span class="toast-text is-err">${escHtml(state.liveEditError)}</span>` : ""}
          <div class="le-actions">
            <button type="button" class="btn btn-sm" data-action="pick-live-edit-images">${iconSvg("image", 13)}${escHtml(tr.suppPickPhoto)}</button>
            <div style="display:flex;align-items:center;gap:8px">
              ${list.length > 0 ? `<button type="button" class="btn btn-sm" data-action="clear-live-edits">${iconSvg("trash", 12)}${escHtml(tr.suppClearBtn)}</button>` : ""}
              ${!isBusy && state.liveEditDraftText.trim() ? `<button type="button" class="btn btn-sm" data-action="insert-supplement-to-chat">${escHtml(tr.suppInsertChatBtn)}</button>` : ""}
              <button type="button" class="btn btn-sm btn-primary" ${canSend ? "" : "disabled"} data-action="send-live-edit">${iconSvg("send", 12)}${escHtml(tr.suppSendBtn)}</button>
            </div>
          </div>
        </div>
        <span class="toast-text${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>
      </div>

      <div class="section-group">
        ${list.length === 0 ? `<div class="empty-msg">${escHtml(tr.suppEmpty)}</div>` : `
          <div class="le-feed" style="max-height:260px">
            ${list.slice().reverse().map((it) => {
              const st = formatLiveEditStatus(it.status, tr);
              const tStr = new Date(it.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const imgs = Array.isArray(it.images) ? it.images : [];
              return `
                <div class="le-item">
                  <div class="le-item-top">
                    <span class="num">${escHtml(tStr)}${imgs.length > 0 ? ` · ${imgs.length} ${escHtml(tr.suppPhotoCount)}` : ""}</span>
                    <span class="le-status-pill ${st.cls}">${escHtml(st.label)}</span>
                  </div>
                  ${it.text ? `<span style="color:var(--rx-fg-strong);word-break:break-word;white-space:pre-wrap">${escHtml(it.text)}</span>` : ""}
                  ${imgs.length > 0 ? `
                    <div class="le-thumbs">
                      ${imgs.map((im) => `<span class="le-thumb-chip">${iconSvg("image", 12)}<span class="le-thumb-name">${escHtml(im.name || "image")}</span></span>`).join("")}
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    `;
  }

  function renderSettingsTab() {
    const tr = t();
    const sub = state.settingsSubTab || "widget";
    const subTabs = [
      { id: "widget", label: tr.setSubWidget },
      { id: "export", label: tr.setSubExport },
      { id: "system", label: tr.setSubSystem },
    ];
    let body = "";
    if (sub === "widget") body = renderWidgetSub(tr);
    else if (sub === "export") body = renderExportSub(tr);
    else body = renderSystemSub(tr);

    return `
      <div class="subtab-bar">
        ${subTabs.map((st) => `
          <button type="button" class="subtab-btn${st.id === sub ? " is-active" : ""}" data-action="set-settings-subtab" data-val="${st.id}">${escHtml(st.label)}</button>
        `).join("")}
      </div>
      ${body}
    `;
  }

  function renderWidgetSub(tr) {
    const s = state.settings;
    const mf = s.miniFields;
    const fieldSpecs = [
      { key: "status", title: tr.fieldStatus },
      { key: "lang", title: tr.fieldLang },
      { key: "tps", title: tr.fieldTps },
      { key: "respTokens", title: tr.fieldResp },
      { key: "chatTokens", title: tr.fieldChat },
      { key: "model", title: tr.fieldModel },
      { key: "quota", title: tr.fieldQuota },
    ];
    const docks = [
      { id: "bottom-right", label: tr.dockBottomRight },
      { id: "top-right", label: tr.dockTopRight },
      { id: "middle-right", label: tr.dockMiddleRight },
      { id: "bottom-left", label: tr.dockBottomLeft },
      { id: "hidden", label: tr.dockHidden },
    ];
    const previewMarkup = renderMiniCapsuleMarkup(true);
    state.lastPreviewCapsuleHtml = previewMarkup;

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.previewTitle)}</span>
        <div class="preview-stage" data-live="previewCapsule">${previewMarkup}</div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.modeTitle)}</span>
        <div class="segmented-2">
          <button type="button" class="choice-card${s.viewMode === "mini" ? " is-selected" : ""}" data-action="set-view-mode" data-val="mini">
            <span class="choice-title"><span>${escHtml(tr.modeMiniTitle)}</span>${s.viewMode === "mini" ? iconSvg("check", 13) : ""}</span>
            <span class="choice-desc">${escHtml(tr.modeMiniDesc)}</span>
          </button>
          <button type="button" class="choice-card${s.viewMode === "medium" ? " is-selected" : ""}" data-action="set-view-mode" data-val="medium">
            <span class="choice-title"><span>${escHtml(tr.modeMedTitle)}</span>${s.viewMode === "medium" ? iconSvg("check", 13) : ""}</span>
            <span class="choice-desc">${escHtml(tr.modeMedDesc)}</span>
          </button>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.fieldsTitle)}</span>
        <div class="control-grid-2">
          ${fieldSpecs.map((f) => `
            <div class="card" style="padding:8px 11px;display:flex;align-items:center;justify-content:space-between;gap:8px">
              <span class="row-title" style="font-size:12px">${escHtml(f.title)}</span>
              <button type="button" class="switch${mf[f.key] ? " is-on" : ""}" role="switch" aria-checked="${mf[f.key] ? "true" : "false"}" data-action="toggle-mini-field" data-key="${f.key}"><span class="switch-thumb"></span></button>
            </div>
          `).join("")}
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
            <button type="button" class="switch${s.pinned ? " is-on" : ""}" role="switch" aria-checked="${s.pinned ? "true" : "false"}" data-action="toggle-pin"><span class="switch-thumb"></span></button>
          </div>
        </div>
        <div class="dock-grid">
          ${docks.map((d) => `
            <button type="button" class="dock-btn${s.dockPosition === d.id && s.layoutMode !== "floating" ? " is-selected" : ""}" data-action="set-dock" data-val="${d.id}">${escHtml(d.label)}</button>
          `).join("")}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span class="row-desc">${escHtml(tr.dockHiddenHint)}</span>
          ${s.layoutMode === "floating" ? `<button type="button" class="btn btn-sm" data-action="reset-position">${iconSvg("reset", 12)}${escHtml(tr.dockResetBtn)}</button>` : ""}
        </div>
      </div>
    `;
  }

  function renderExportSub(tr) {
    const qs = state.quotaSummary || {};
    const fams = qs.families || {};
    const gem = fams.gemini || {};
    const cla = fams.claudeGpt || {};
    const rows = Array.isArray(qs.chats) ? qs.chats : [];
    const eo = state.exportOpts;

    const renderFamCard = (title, famData) => {
      const rem5 = typeof famData.fiveHourRem === "number" ? famData.fiveHourRem : null;
      const remW = typeof famData.weeklyRem === "number" ? famData.weeklyRem : null;
      const badge = famData.calibrated ? tr.quotaCalibratedBadge : tr.quotaEstimatedBadge;
      return `
        <div class="quota-fam-card">
          <div class="quota-fam-head">
            <span class="row-title" style="font-size:12px">${escHtml(title)}</span>
            <span class="${famData.calibrated ? "badge-active" : "nav-badge"}">${escHtml(badge)}</span>
          </div>
          <div class="quota-bar-row">
            <div class="quota-bar-labels">
              <span>${escHtml(tr.quota5hShort)} ${escHtml(tr.quotaRemShort)} ${famData.fiveHourReset ? "(" + escHtml(famData.fiveHourReset) + ")" : ""}</span>
              <b class="num">${rem5 !== null ? rem5 + "%" : tr.quotaNoData}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${rem5 !== null ? rem5 : 0}%"></div></div>
          </div>
          <div class="quota-bar-row">
            <div class="quota-bar-labels">
              <span>${escHtml(tr.quotaWeekShort)} ${escHtml(tr.quotaRemShort)} ${famData.weeklyReset ? "(" + escHtml(famData.weeklyReset) + ")" : ""}</span>
              <b class="num">${remW !== null ? remW + "%" : tr.quotaNoData}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${remW !== null ? remW : 0}%;background:var(--rx-success)"></div></div>
          </div>
        </div>
      `;
    };

    const optSpecs = [
      { key: "includeAttachments", label: tr.exportOptAttachments },
      { key: "includeArtifacts", label: tr.exportOptArtifacts },
      { key: "includePersona", label: tr.exportOptPersona },
      { key: "includeThinking", label: tr.exportOptThinking },
      { key: "includeFullLog", label: tr.exportOptFullLog },
    ];
    const er = state.exportResult;

    return `
      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <span class="section-label">${escHtml(tr.exportTitle)}</span>
          <span class="status-pill" data-live="chatBadge">${escHtml(formatChatBadgeLabel())}</span>
        </div>
        <span class="row-desc">${escHtml(tr.exportDesc)}</span>
        <div class="export-checks">
          ${optSpecs.map((op) => `
            <label class="export-check-item">
              <input type="checkbox" ${eo[op.key] ? "checked" : ""} data-action="toggle-export-opt" data-key="${op.key}"/>
              <span>${escHtml(op.label)}</span>
            </label>
          `).join("")}
        </div>
        <div class="action-bar">
          <div class="action-btns">
            <button type="button" class="btn btn-primary" ${state.exportBusy ? "disabled" : ""} data-action="export-chat-zip" data-choose="0">${iconSvg("download", 13)}${escHtml(state.exportBusy ? tr.exportBusy : tr.exportBtnDownloads)}</button>
            <button type="button" class="btn" ${state.exportBusy ? "disabled" : ""} data-action="export-chat-zip" data-choose="1">${escHtml(tr.exportBtnSaveAs)}</button>
          </div>
          ${state.exportError ? `<span class="toast-text is-err">${escHtml(tr.exportErr)} ${escHtml(state.exportError)}</span>` : ""}
        </div>
        ${er && er.ok ? `
          <div class="export-result-card">
            <div class="row-info">
              <span class="row-title" style="font-size:12px">${escHtml(tr.exportSuccess)} <span class="num">${escHtml(er.fileName)}</span> (${escHtml(formatBytesCompact(er.sizeBytes))})</span>
              <span class="row-desc num">${er.counts ? `${er.counts.messages || 0} ${escHtml(tr.exportSummaryMsgs)} · ${er.counts.attachments || 0} ${escHtml(tr.exportSummaryAttach)} · ${er.counts.artifacts || 0} ${escHtml(tr.exportSummaryArtifacts)}` : ""} · ${escHtml(er.source === "disk" ? tr.exportSourceDisk : tr.exportSourceDom)}</span>
            </div>
            <button type="button" class="btn btn-sm" data-action="reveal-export-file" data-path="${escAttr(er.zipPath)}">${iconSvg("folder", 12)}${escHtml(tr.exportRevealBtn)}</button>
          </div>
        ` : ""}
      </div>

      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <span class="section-label">${escHtml(tr.quotaTableTitle)}</span>
          <button type="button" class="btn btn-sm" data-action="reset-quota-stats">${iconSvg("reset", 12)}${escHtml(tr.quotaResetBtn)}</button>
        </div>
        <div class="quota-fam-grid">
          ${renderFamCard(tr.quotaGeminiLabel, gem)}
          ${renderFamCard(tr.quotaClaudeLabel, cla)}
        </div>
        <span class="row-desc">${escHtml(tr.quotaCalibrateTip)}</span>
        <div class="quota-table-wrap">
          ${rows.length === 0 ? `<div class="card-pad" style="font-size:12px;color:var(--rx-muted)">${escHtml(tr.quotaTableEmpty)}</div>` : `
            <div class="quota-table-row is-head">
              <span>${escHtml(tr.quotaColChat)}</span>
              <span>${escHtml(tr.quotaColModel)}</span>
              <span>${escHtml(tr.quotaCol5h)}</span>
              <span>${escHtml(tr.quotaColWeek)}</span>
              <span>${escHtml(tr.quotaColTurns)}</span>
            </div>
            ${rows.map((r) => `
              <div class="quota-table-row${r.chatKey === state.activeChatKey ? " is-active" : ""}">
                <span class="quota-chat-name" title="${escAttr(r.title)}">${escHtml(r.title)}</span>
                <span class="quota-chat-name" style="font-weight:400;color:var(--rx-muted)" title="${escAttr(r.modelName)}">${escHtml(r.modelName || r.primaryFamily)}</span>
                <span class="num">${escHtml(formatQuotaPct(r.fiveHourWindowPct))} / ${escHtml(formatQuotaPct(r.fiveHourPct))}</span>
                <span class="num">${escHtml(formatQuotaPct(r.weeklyPct))}</span>
                <span class="num">${r.turns || 0}</span>
              </div>
            `).join("")}
          `}
        </div>
      </div>
    `;
  }

  function renderSystemSub(tr) {
    const isRu = state.locale !== "en";
    const thinkingRu = Boolean(state.settings.thinkingInRussian);
    const ver = pluginMeta.version || "4.0.0";
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
        <div class="card" style="margin-top:8px">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.thinkingRuTitle)}</span>
              <span class="row-desc">${escHtml(tr.thinkingRuDesc)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span class="${thinkingRu ? "badge-active" : "nav-badge"}">${escHtml(thinkingRu ? tr.thinkingRuOn : tr.thinkingRuDefault)}</span>
              <button type="button" class="switch${thinkingRu ? " is-on" : ""}" role="switch" aria-checked="${thinkingRu ? "true" : "false"}" data-action="toggle-thinking-ru" aria-label="${escAttr(tr.thinkingRuTitle)}"><span class="switch-thumb"></span></button>
            </div>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.hotkeysTitle)}</span>
        <div class="card">
          <div class="row-item"><span class="row-title">${escHtml(tr.hkToggleLang)}</span><span class="kbd">Ctrl + Alt + L</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkToggleModal)}</span><span class="kbd">Ctrl + Alt + P</span></div>
          <div class="row-item"><span class="row-title">${escHtml(tr.hkSupplement)}</span><span class="kbd">Ctrl + Alt + E</span></div>
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
            <a class="repo-link" href="https://github.com/Ivan0967pro/Rudex" target="_blank" rel="noopener noreferrer">Rudex (GitHub) ${iconSvg("external", 12)}</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderModalShell() {
    if (!state.isOpen) return "";
    const tr = t();
    const pendingLe = countPendingLiveEdits();
    const tabs = [
      { id: "monitor", label: tr.navMonitor, ic: "activity", title: tr.modalTitleMonitor, sub: tr.modalSubMonitor },
      { id: "appearance", label: tr.navAppearance, ic: "palette", title: tr.modalTitleAppearance, sub: tr.modalSubAppearance },
      { id: "persona", label: tr.navPersona, ic: "sparkles", title: tr.modalTitlePersona, sub: tr.modalSubPersona, dot: state.chatPersona.enabled },
      { id: "live-edits", label: tr.navSupplements, ic: "bolt", title: tr.modalTitleSupplements, sub: tr.modalSubSupplements, dot: pendingLe > 0, badge: pendingLe > 0 ? String(pendingLe) : "" },
      { id: "settings", label: tr.navSettings, ic: "gear", title: tr.modalTitleSettings, sub: tr.modalSubSettings },
    ];
    const current = tabs.find((x) => x.id === state.activeTab) || tabs[0];
    const isAppearanceLive = current.id === "appearance";
    let bodyHtml = "";
    if (current.id === "monitor") bodyHtml = renderMonitorTab();
    else if (current.id === "appearance") bodyHtml = renderAppearanceDrawerBody();
    else if (current.id === "persona") bodyHtml = renderPersonaTab();
    else if (current.id === "live-edits") bodyHtml = renderSupplementsTab();
    else bodyHtml = renderSettingsTab();

    return `
      <div class="modal-backdrop${isAppearanceLive ? " is-appearance-live" : ""}" data-action="backdrop-close">
        <div class="modal-shell${isAppearanceLive ? " is-appearance-live" : ""}" role="dialog" aria-modal="${isAppearanceLive ? "false" : "true"}" aria-label="${escAttr(tr.brandTitle)}">
          ${isAppearanceLive ? "" : `
            <aside class="modal-sidebar">
              <div class="sidebar-brand">
                <span class="brand-title">${escHtml(tr.brandTitle)}</span>
                <span class="brand-ver num">v${escHtml(pluginMeta.version || "4.0.0")}</span>
              </div>
              <nav class="nav-list">
                ${tabs.map((tb) => `
                  <button type="button" class="nav-item${tb.id === current.id ? " is-active" : ""}" data-action="switch-tab" data-tab="${tb.id}">
                    <span class="nav-ic">${iconSvg(tb.ic, 14)}</span>
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
          `}
          <section class="modal-main">
            <header class="modal-header">
              <div style="display:flex;align-items:center;gap:8px;min-width:0">
                ${isAppearanceLive ? `<button type="button" class="icon-btn" data-action="switch-tab" data-tab="monitor" title="${escAttr(tr.backToSettings)}">${iconSvg("back", 15)}</button>` : ""}
                <div style="min-width:0">
                  <h2 class="modal-title">${escHtml(current.title)}</h2>
                  <p class="modal-sub">${escHtml(current.sub)}</p>
                </div>
              </div>
              <button type="button" class="icon-btn" data-action="close-modal" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 15)}</button>
            </header>
            <div class="modal-body">${bodyHtml}</div>
            ${isAppearanceLive ? `
              <footer class="drawer-sticky-footer">
                <button type="button" class="btn btn-sm btn-ghost" data-action="reset-appearance">${escHtml(tr.appResetBtn)}</button>
                <div style="display:flex;align-items:center;gap:6px">
                  <button type="button" class="btn btn-sm" data-action="discard-appearance">${escHtml(tr.appCancelBtn)}</button>
                  <button type="button" class="btn btn-sm${state.appearanceDirty ? " btn-primary" : ""}" data-action="apply-appearance">${iconSvg("check", 12)}${escHtml(tr.appApplyBtn)}</button>
                </div>
              </footer>
            ` : ""}
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
      const rect = typeof widgetMountEl.getBoundingClientRect === "function" ? widgetMountEl.getBoundingClientRect() : null;
      const w = rect && rect.width ? rect.width : 240;
      const h = rect && rect.height ? rect.height : 40;
      const maxX = Math.max(8, vw - w - 8);
      const maxY = Math.max(8, vh - h - 8);
      const curX = typeof state.settings.floatX === "number" ? state.settings.floatX : 18;
      const curY = typeof state.settings.floatY === "number" ? state.settings.floatY : 18;
      const nextX = Math.min(maxX, Math.max(8, Math.round(curX)));
      const nextY = Math.min(maxY, Math.max(8, Math.round(curY)));
      widgetMountEl.style.left = `${nextX}px`;
      widgetMountEl.style.top = `${nextY}px`;
    } catch (_e) {}
  }

  function setLiveSlot(container, selector, val, isHtml) {
    if (!container || typeof container.querySelectorAll !== "function") return;
    const els = container.querySelectorAll(selector);
    for (let i = 0; i < els.length; i += 1) {
      if (isHtml) {
        if (els[i].innerHTML !== val) els[i].innerHTML = val;
      } else if (els[i].textContent !== val) {
        els[i].textContent = val;
      }
    }
  }

  function updateLiveDom() {
    const tr = t();
    const tel = state.telemetry;
    const tpsText = String(getDisplayedTps(tel));
    const tpsUnitText = getDisplayedTpsUnit(tel, tr);
    const hasExactR = tel.exactRespTokens > 0;
    const hasExactC = tel.exactContextTokens > 0;
    const respCountVal = hasExactR ? tel.exactRespTokens : tel.respTokens;
    const respNumText = `${hasExactR ? "" : "~"}${formatCompact(respCountVal)}`;
    const respText = `${respNumText} ${tr.tokShort}`;
    const miniRespText = respNumText;
    const chatCountVal = hasExactC ? tel.exactContextTokens : tel.chatTokens;
    const chatNumText = tel.contextLabel || `${hasExactC ? "" : "~"}${formatCompact(chatCountVal)}`;
    const chatText = chatNumText;
    const fullChatText = tel.contextLabel || `${chatNumText} ${tr.tokShort}`;
    const statusText = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.statusWriting : tr.statusReady);
    const phaseText = tel.phase === "thinking" ? tr.phaseThinking : (tel.isGenerating ? tr.phaseLive : tr.phaseIdle);
    const modelText = tel.modelName || tr.modelUnknown;
    const chatBadgeText = formatChatBadgeLabel();
    const qMiniText = getActiveChatQuotaDisplay().miniText;

    const hasPendingLe = countPendingLiveEdits() > 0;
    const containers = [widgetMountEl, modalMountEl].filter(Boolean);
    for (let i = 0; i < containers.length; i += 1) {
      const box = containers[i];
      if (typeof box.querySelectorAll !== "function") continue;
      const dots = box.querySelectorAll('[data-live="dot"]');
      for (let d = 0; d < dots.length; d += 1) {
        const cls = "status-dot" + (tel.isGenerating ? " is-live" : "");
        if (dots[d].className !== cls) dots[d].className = cls;
      }
      const leDots = box.querySelectorAll('[data-live="liveEditDot"]');
      for (let ld = 0; ld < leDots.length; ld += 1) {
        leDots[ld].style.display = hasPendingLe ? "" : "none";
      }
      setLiveSlot(box, '[data-live="tps"]', tpsText, false);
      setLiveSlot(box, '[data-live="tpsUnit"]', tpsUnitText, false);
      setLiveSlot(box, '[data-live="statusText"]', statusText, false);
      setLiveSlot(box, '[data-live="phase"]', phaseText, false);
      setLiveSlot(box, '[data-live="peak"]', String(getDisplayedPeakTps(tel)), false);
      setLiveSlot(box, '[data-live="chatBadge"]', chatBadgeText, false);
    }

    if (widgetMountEl) {
      setLiveSlot(widgetMountEl, '[data-live="resp"]', state.settings.viewMode === "mini" ? miniRespText : respText, false);
      setLiveSlot(widgetMountEl, '[data-live="chat"]', state.settings.viewMode === "mini" ? chatText : fullChatText, false);
      setLiveSlot(widgetMountEl, '[data-live="model"]', tel.modelName || (state.settings.viewMode === "mini" ? "AI" : "—"), false);
      const sparkSig = (tel.samples || []).join(",");
      if (sparkSig !== state.lastSparkMedSig) {
        state.lastSparkMedSig = sparkSig;
        setLiveSlot(widgetMountEl, '[data-live="sparkMed"]', buildSparklineMarkup(tel.samples, 260, 38, "med"), true);
      }
      setLiveSlot(widgetMountEl, '[data-live="quotaMini"]', qMiniText, false);
      setLiveSlot(widgetMountEl, '[data-live="quotaMed"]', qMiniText, false);
    }

    if (modalMountEl && state.isOpen) {
      setLiveSlot(modalMountEl, '[data-live="resp"]', respText, false);
      setLiveSlot(modalMountEl, '[data-live="respNum"]', respNumText, false);
      setLiveSlot(modalMountEl, '[data-live="respSub"]', hasExactR ? tr.kpiSubExact : tr.kpiSubEst, false);
      setLiveSlot(modalMountEl, '[data-live="chat"]', fullChatText, false);
      setLiveSlot(modalMountEl, '[data-live="chatNum"]', chatNumText, false);
      if (typeof modalMountEl.querySelectorAll === "function") {
        const unitEls = modalMountEl.querySelectorAll('[data-live="chatUnit"]');
        for (let u = 0; u < unitEls.length; u += 1) {
          unitEls[u].style.display = tel.contextLabel ? "none" : "";
        }
      }
      setLiveSlot(modalMountEl, '[data-live="chatSub"]', hasExactC ? tr.kpiSubExact : tr.kpiSubEst, false);
      setLiveSlot(modalMountEl, '[data-live="kpiState"]', tel.isGenerating ? tr.kpiSubLive : tr.kpiSubReady, false);
      setLiveSlot(modalMountEl, '[data-live="model"]', modelText, false);
      setLiveSlot(modalMountEl, '[data-live="sparkFootMeta"]', formatSparkFootMeta(tel, tr), false);
      const sparkModalSig = (tel.samples || []).join(",");
      if (sparkModalSig !== state.lastSparkModalSig) {
        state.lastSparkModalSig = sparkModalSig;
        setLiveSlot(modalMountEl, '[data-live="sparkModal"]', buildSparklineMarkup(tel.samples, 560, 102, "modal"), true);
      }
      setLiveSlot(modalMountEl, '[data-live="quotaMed"]', qMiniText, false);
      if (state.activeTab === "settings" && state.settingsSubTab === "widget") {
        const nextPreview = renderMiniCapsuleMarkup(true);
        if (nextPreview !== state.lastPreviewCapsuleHtml) {
          state.lastPreviewCapsuleHtml = nextPreview;
          setLiveSlot(modalMountEl, '[data-live="previewCapsule"]', nextPreview, true);
        }
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
      state.lastSparkMedSig = (state.telemetry.samples || []).join(",");
      applyWidgetPosition();
    }
    if (modalMountEl) {
      let prevScrollTop = 0;
      let focusedSel = "";
      let selStart = null;
      let selEnd = null;
      const oldBody = modalMountEl.querySelector(".modal-body");
      if (oldBody) prevScrollTop = oldBody.scrollTop || 0;

      const activeEl = shadowRoot && shadowRoot.activeElement;
      if (activeEl && modalMountEl.contains(activeEl)) {
        const tag = String(activeEl.tagName || "").toUpperCase();
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
          const role = activeEl.getAttribute("data-role");
          const gf = activeEl.getAttribute("data-greet-field");
          const af = activeEl.getAttribute("data-app-field");
          if (role) focusedSel = `[data-role="${role}"]`;
          else if (gf) focusedSel = `[data-greet-field="${gf}"]`;
          else if (af) focusedSel = `[data-app-field="${af}"]`;
          if (typeof activeEl.selectionStart === "number") {
            selStart = activeEl.selectionStart;
            selEnd = activeEl.selectionEnd;
          }
        }
      }

      modalMountEl.innerHTML = state.isOpen ? renderModalShell() : "";
      state.lastSparkModalSig = (state.telemetry.samples || []).join(",");

      if (state.isOpen && prevScrollTop > 0) {
        const newBody = modalMountEl.querySelector(".modal-body");
        if (newBody) newBody.scrollTop = prevScrollTop;
      }
      if (state.isOpen && focusedSel) {
        const restored = modalMountEl.querySelector(focusedSel);
        if (restored && typeof restored.focus === "function") {
          try {
            restored.focus({ preventScroll: true });
            if (selStart !== null && typeof restored.setSelectionRange === "function") {
              restored.setSelectionRange(selStart, selEnd !== null ? selEnd : selStart);
            }
          } catch (_e) {}
        }
      }
    }
    if (popoverMountEl) {
      renderPopoverStructure();
    }
  }

  function selectPreset(id) {
    let body = null;
    const customs = state.settings.customPresets || [];
    for (let i = 0; i < customs.length; i += 1) {
      if (customs[i].id === id) { body = customs[i].body; break; }
    }
    if (body === null) return;
    state.chatPersona.activePreset = id;
    state.draftPersonaText = body;
    if (state.chatPersona.enabled && body.trim()) {
      persistPersona(true);
    } else {
      state.draftDirty = true;
      renderStructure();
    }
  }

  function persistPersona(enabledOverride) {
    const nextEnabled = typeof enabledOverride === "boolean" ? enabledOverride : state.chatPersona.enabled;
    const presetId = state.chatPersona.activePreset || "custom";
    const textVal = state.draftPersonaText;
    const targetChatKey = state.activeChatKey || "__new__";
    const targetChatTitle = state.activeChatTitle || "";
    const tr = t();
    const saveSeq = ++state.personaSaveSeq;

    if (targetChatKey === "__new__") {
      state.newChatDraftPersona = nextEnabled && textVal.trim()
        ? { personaEnabled: true, personaActivePreset: presetId, personaText: textVal, personaStrict: state.chatPersona.strict !== false }
        : null;
    }

    return invokeIpc("agy-studio:save-persona", {
      chatKey: targetChatKey,
      title: targetChatTitle,
      personaEnabled: nextEnabled,
      personaText: textVal,
      personaActivePreset: presetId,
      strict: state.chatPersona.strict !== false,
      customPresets: state.settings.customPresets || [],
    }).then((res) => {
      if (state.destroyed) return res;
      if (saveSeq === state.personaSaveSeq) {
        state.draftDirty = false;
      }
      if (res && res.state) applyRemoteState(res.state, false);
      if (res && res.chat && targetChatKey === state.activeChatKey && saveSeq === state.personaSaveSeq) {
        state.chatPersona = {
          enabled: Boolean(res.chat.personaEnabled),
          activePreset: res.chat.personaActivePreset || presetId,
          text: typeof res.chat.personaText === "string" ? res.chat.personaText : textVal,
          strict: typeof res.chat.personaStrict === "boolean" ? res.chat.personaStrict : state.chatPersona.strict !== false,
        };
        if (typeof res.rulePath === "string" && res.rulePath) state.personaFilePath = res.rulePath;
        renderStructure();
      }
      if (res && res.ok === false) {
        setToast(res.error === "EXCEEDS_BYTE_LIMIT" ? tr.personaTooLargeErr : (res.error || tr.personaWriteErr), true);
      } else if (nextEnabled) {
        setToast(res && res.exists ? tr.personaSavedMsg : tr.personaWriteErr, !(res && res.exists));
      } else {
        setToast(textVal.trim() ? tr.personaDisabledMsg : tr.personaClearedMsg, false);
      }
      return res;
    });
  }

  function markAppearanceDirty() {
    state.appearanceDirty = true;
    state.appearanceLivePreview = true;
    applyThemeFastToHost(state.appearanceDraft);
  }

  function updateGreetingLivePreview() {
    if (!modalMountEl) return;
    const tr = t();
    const isRu = state.locale !== "en";
    const gd = spNormalizeGreeting(state.greetingDraft);
    const autoName = (translator && typeof translator.getCapturedUserName === "function" ? translator.getCapturedUserName() : "") || (isRu ? "Иван" : "Ivan");
    const preview = resolvePreviewGreeting(gd);
    setLiveSlot(modalMountEl, '[data-live="greetPreviewTitle"]', gd.enabled ? preview.title : (isRu ? `Привет, ${autoName}! Что создадим сегодня?` : `Hey ${autoName}, what should we build today?`), false);
    const subEl = modalMountEl.querySelector('[data-live="greetPreviewSub"]');
    if (subEl) {
      subEl.textContent = preview.subtitle;
      subEl.style.display = gd.enabled && preview.subtitle ? "" : "none";
    }
    setLiveSlot(modalMountEl, '[data-live="greetPreviewComposer"]', gd.enabled && gd.placeholder.trim() ? gd.placeholder.trim() : tr.greetPreviewInputFallback, false);
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
    if (action === "close-modal") { setOpen(false); return; }
    if (action === "open-settings") { setOpen(true); return; }
    if (action === "open-persona-tab") { state.activeTab = "persona"; setOpen(true); return; }
    if (action === "open-export-limits") {
      state.activeTab = "settings";
      state.settingsSubTab = "export";
      invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__" }).then((qs) => {
        if (!state.destroyed && qs) {
          state.quotaSummary = qs;
          if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "export") renderStructure();
        }
      });
      setOpen(true);
      return;
    }
    if (action === "switch-tab") {
      const prevTab = state.activeTab;
      const tab = actionEl.getAttribute("data-tab") || "monitor";
      state.activeTab = tab;
      if (prevTab === "appearance" && tab !== "appearance") {
        state.appearanceLivePreview = false;
        state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        state.greetingDraft = spCloneGreeting(state.settings.greeting);
        state.appearanceDirty = false;
        applyThemeToHost(state.settings.appearance);
        syncTranslatorGreeting(state.settings.greeting);
      }
      if (tab === "appearance") {
        state.appearanceLivePreview = true;
        if (!state.appearanceDirty) {
          state.appearanceDraft = spCloneAppearance(state.settings.appearance);
          state.greetingDraft = spCloneGreeting(state.settings.greeting);
        }
        applyThemeFastToHost(state.appearanceDraft);
      }
      if (tab === "live-edits") refreshLiveEdits();
      renderStructure();
      return;
    }
    if (action === "set-app-subtab") {
      state.appearanceSubTab = actionEl.getAttribute("data-val") || "theme";
      renderStructure();
      return;
    }
    if (action === "set-settings-subtab") {
      const sub = actionEl.getAttribute("data-val") || "widget";
      state.settingsSubTab = sub;
      if (sub === "export") {
        invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__" }).then((qs) => {
          if (!state.destroyed && qs) {
            state.quotaSummary = qs;
            if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "export") renderStructure();
          }
        });
      }
      renderStructure();
      return;
    }
    if (action === "to-medium") { setViewMode("medium"); return; }
    if (action === "to-mini") { setViewMode("mini"); return; }
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
    if (action === "toggle-thinking-ru") {
      saveSettingsPatch({ thinkingInRussian: !state.settings.thinkingInRussian });
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
      state.telemetry.lastDurSec = 0;
      state.telemetry.lastThinkingSec = 0;
      state.telemetry.exactRespTokens = 0;
      state.telemetry.exactContextTokens = 0;
      state.telemetry.exactCacheTokens = 0;
      state.telemetry.samples = [];
      state.telemetry.history = [];
      state.telemetry.dirty = false;
      updateLiveDom();
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
    if (action === "toggle-persona-strict") {
      const nextStrict = state.chatPersona.strict === false;
      state.chatPersona.strict = nextStrict;
      saveSettingsPatch({ personaStrictMode: nextStrict });
      if (state.chatPersona.enabled && state.draftPersonaText.trim()) persistPersona(true);
      else renderStructure();
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
      const rawBody = String(state.draftPersonaText || "").trim();
      if (!title || !rawBody) {
        setToast(tr.personaPresetEmptyWarn, true);
        return;
      }
      if (utf8ByteLength(rawBody) > MAX_PERSONA_BODY_BYTES) {
        setToast(tr.personaTooLargeErr, true);
        return;
      }
      const id = "custom-" + Date.now();
      const next = (state.settings.customPresets || []).concat([{ id, title, body: rawBody }]).slice(-20);
      state.newPresetName = "";
      state.chatPersona.activePreset = id;
      saveSettingsPatch({ customPresets: next });
      setToast(tr.personaSavedPreset, false);
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
      return;
    }
    if (action === "toggle-live-edit") {
      toggleLiveEditPopover();
      return;
    }
    if (action === "close-live-edit") {
      state.liveEditOpen = false;
      renderPopoverStructure();
      return;
    }
    if (action === "open-live-edits-tab") {
      state.liveEditOpen = false;
      state.activeTab = "live-edits";
      renderPopoverStructure();
      setOpen(true);
      return;
    }
    if (action === "pick-live-edit-images") {
      invokeIpc("agy-studio:pick-live-edit-images").then((res) => {
        if (state.destroyed || !res || !res.ok || !Array.isArray(res.items)) return;
        const cur = Array.isArray(state.liveEditDraftImages) ? state.liveEditDraftImages.slice() : [];
        for (let i = 0; i < res.items.length && cur.length < 4; i += 1) {
          const it = res.items[i];
          if (!it) continue;
          cur.push({
            name: it.name || ("img-" + (cur.length + 1)),
            sourcePath: it.sourcePath || "",
            dataUrl: it.sourcePath ? "" : (it.previewDataUrl || ""),
            previewDataUrl: it.previewDataUrl || "",
          });
        }
        state.liveEditDraftImages = cur;
        renderPopoverStructure();
        if (state.isOpen && state.activeTab === "live-edits") renderStructure();
      });
      return;
    }
    if (action === "remove-live-edit-img") {
      const idx = parseInt(actionEl.getAttribute("data-idx"), 10);
      if (!isNaN(idx) && idx >= 0 && Array.isArray(state.liveEditDraftImages)) {
        state.liveEditDraftImages.splice(idx, 1);
        renderPopoverStructure();
        if (state.isOpen && state.activeTab === "live-edits") renderStructure();
      }
      return;
    }
    if (action === "insert-supplement-to-chat") {
      if (insertTextIntoMainComposer(state.liveEditDraftText)) {
        state.liveEditDraftText = "";
        renderPopoverStructure();
        if (state.isOpen && state.activeTab === "live-edits") {
          renderStructure();
          setToast(tr.suppInsertedToast, false);
        }
      }
      return;
    }
    if (action === "send-live-edit") {
      sendLiveEditFromDraft();
      return;
    }
    if (action === "clear-live-edits") {
      invokeIpc("agy-studio:clear-live-edits", { chatKey: state.activeChatKey || "__new__" }).then((res) => {
        if (state.destroyed || !res) return;
        applyLiveEditsPayload(res);
        renderPopoverStructure();
        updateLiveDom();
        if (state.isOpen && state.activeTab === "live-edits") renderStructure();
      });
      return;
    }
    if (action === "select-theme-preset") {
      const pid = actionEl.getAttribute("data-id") || "native";
      const pr = spFindThemePreset(pid);
      state.appearanceDraft.presetId = pr.id;
      if (pr.id !== "custom" && pr.vars) {
        state.appearanceDraft.accentColor = pr.vars.accentColor;
        state.appearanceDraft.canvasBg = pr.vars.canvasBg;
        state.appearanceDraft.cardBg = pr.vars.cardBg;
        state.appearanceDraft.glassOpacity = pr.vars.glassOpacity;
        state.appearanceDraft.glassBlur = pr.vars.glassBlur;
        state.appearanceDraft.radius = pr.vars.radius;
      }
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "pick-accent-dot") {
      const hex = actionEl.getAttribute("data-val") || "#3b82f6";
      state.appearanceDraft.accentColor = hex.toLowerCase();
      state.appearanceDraft.presetId = "custom";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-appearance-polish") {
      state.appearanceDraft.uiPolish = !state.appearanceDraft.uiPolish;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-appearance-contrast") {
      state.appearanceDraft.highContrastText = state.appearanceDraft.highContrastText === false;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-wallpaper-type") {
      const val = actionEl.getAttribute("data-val");
      state.appearanceDraft.wallpaper.type = val === "gradient" || val === "image" || val === "video" ? val : "none";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "select-gradient-preset") {
      const gid = actionEl.getAttribute("data-id");
      const grads = spGetGradientPresets();
      const found = grads.find((g) => g.id === gid) || grads[0];
      if (found) {
        state.appearanceDraft.wallpaper.type = "gradient";
        state.appearanceDraft.wallpaper.gradientPreset = found.id;
        state.appearanceDraft.wallpaper.gradColors = found.colors.slice(0, 3);
        state.appearanceDraft.wallpaper.gradAngle = found.angle;
      }
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-wallpaper-animated") {
      state.appearanceDraft.wallpaper.gradAnimated = !state.appearanceDraft.wallpaper.gradAnimated;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-wallpaper-autopause") {
      state.appearanceDraft.wallpaper.pauseWhenHidden = !state.appearanceDraft.wallpaper.pauseWhenHidden;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "pick-media") {
      const kind = actionEl.getAttribute("data-kind") === "video" ? "video" : "image";
      const oldMediaFile = state.appearanceDraft.wallpaper.mediaFile;
      invokeIpc("agy-studio:pick-media", { kind }).then((res) => {
        if (state.destroyed) return;
        if (res && res.ok && res.mediaUrl) {
          if (oldMediaFile && oldMediaFile !== res.fileName && oldMediaFile !== (state.settings.appearance.wallpaper && state.settings.appearance.wallpaper.mediaFile)) {
            invokeIpc("agy-studio:delete-media", { fileName: oldMediaFile });
          }
          state.appearanceDraft.wallpaper.type = kind;
          state.appearanceDraft.wallpaper.mediaFile = res.fileName || "";
          state.appearanceDraft.wallpaper.mediaUrl = res.mediaUrl;
          state.appearanceDraft.wallpaper.mediaMime = res.mime || "";
          markAppearanceDirty();
          renderStructure();
        } else if (res && !res.canceled) {
          setToast(tr.appMediaErrMsg + (res.error ? ` (${res.error})` : ""), true);
        }
      });
      return;
    }
    if (action === "clear-wallpaper-media") {
      const oldFile = state.appearanceDraft.wallpaper.mediaFile;
      if (oldFile && oldFile !== (state.settings.appearance.wallpaper && state.settings.appearance.wallpaper.mediaFile)) {
        invokeIpc("agy-studio:delete-media", { fileName: oldFile });
      }
      state.appearanceDraft.wallpaper.mediaFile = "";
      state.appearanceDraft.wallpaper.mediaUrl = "";
      state.appearanceDraft.wallpaper.mediaMime = "";
      state.appearanceDraft.wallpaper.type = "none";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-greeting-enabled") {
      state.greetingDraft.enabled = !state.greetingDraft.enabled;
      state.appearanceDirty = true;
      syncTranslatorGreeting(state.greetingDraft);
      renderStructure();
      return;
    }
    if (action === "set-greeting-mode") {
      const mode = actionEl.getAttribute("data-val");
      state.greetingDraft.mode = mode === "custom" || mode === "minimal" ? mode : "time-of-day";
      state.greetingDraft.enabled = true;
      state.appearanceDirty = true;
      syncTranslatorGreeting(state.greetingDraft);
      renderStructure();
      return;
    }
    if (action === "apply-greeting-preset") {
      const pid = actionEl.getAttribute("data-id");
      const list = state.locale === "en" ? GREETING_QUICK_PRESETS.en : GREETING_QUICK_PRESETS.ru;
      const found = list.find((p) => p.id === pid);
      if (found) {
        state.greetingDraft.enabled = true;
        state.greetingDraft.mode = found.mode;
        state.greetingDraft.title = found.title;
        state.greetingDraft.subtitle = found.subtitle;
        state.appearanceDirty = true;
        syncTranslatorGreeting(state.greetingDraft);
        renderStructure();
      }
      return;
    }
    if (action === "insert-greeting-token") {
      const tok = actionEl.getAttribute("data-val") || "{name}";
      state.greetingDraft.enabled = true;
      state.greetingDraft.title = (state.greetingDraft.title ? state.greetingDraft.title + " " : "") + tok;
      state.appearanceDirty = true;
      syncTranslatorGreeting(state.greetingDraft);
      renderStructure();
      return;
    }
    if (action === "set-density") {
      const d = actionEl.getAttribute("data-val");
      state.appearanceDraft.typography.density = d === "compact" || d === "spacious" ? d : "comfortable";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "apply-appearance-profile") {
      if (targetEl.closest && targetEl.closest('[data-action="delete-appearance-profile"]')) return;
      const pid = actionEl.getAttribute("data-id");
      const prof = (state.settings.appearanceProfiles || []).find((p) => p.id === pid);
      if (prof && prof.appearance) {
        state.appearanceDraft = spCloneAppearance(prof.appearance);
        state.appearanceDirty = false;
        saveSettingsPatch({ appearance: spCloneAppearance(prof.appearance) });
      }
      return;
    }
    if (action === "delete-appearance-profile") {
      const pid = actionEl.getAttribute("data-id");
      const next = (state.settings.appearanceProfiles || []).filter((p) => p.id !== pid);
      saveSettingsPatch({ appearanceProfiles: next });
      return;
    }
    if (action === "save-appearance-profile") {
      const name = String(state.newProfileName || "").trim().slice(0, 44);
      if (!name) return;
      const id = "prof-" + Date.now();
      const next = (state.settings.appearanceProfiles || []).concat([{
        id,
        name,
        appearance: spCloneAppearance(state.appearanceDraft),
        createdAt: Date.now(),
      }]).slice(-12);
      state.newProfileName = "";
      saveSettingsPatch({ appearanceProfiles: next });
      return;
    }
    if (action === "apply-appearance") {
      const oldSavedFile = state.settings.appearance && state.settings.appearance.wallpaper && state.settings.appearance.wallpaper.mediaFile;
      const newSavedFile = state.appearanceDraft.wallpaper && state.appearanceDraft.wallpaper.mediaFile;
      if (oldSavedFile && oldSavedFile !== newSavedFile) {
        invokeIpc("agy-studio:delete-media", { fileName: oldSavedFile });
      }
      state.appearanceDirty = false;
      state.appearanceLivePreview = state.isOpen && state.activeTab === "appearance";
      saveSettingsPatch({
        appearance: spCloneAppearance(state.appearanceDraft),
        greeting: spCloneGreeting(state.greetingDraft),
      });
      return;
    }
    if (action === "discard-appearance") {
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.greetingDraft = spCloneGreeting(state.settings.greeting);
      state.appearanceDirty = false;
      state.appearanceLivePreview = state.isOpen && state.activeTab === "appearance";
      applyThemeFastToHost(state.settings.appearance);
      syncTranslatorGreeting(state.settings.greeting);
      renderStructure();
      return;
    }
    if (action === "reset-appearance") {
      const defApp = spCloneAppearance(spDefaultAppearance());
      const defGreet = spCloneGreeting(null);
      state.appearanceDraft = spCloneAppearance(defApp);
      state.greetingDraft = spCloneGreeting(defGreet);
      state.appearanceDirty = false;
      state.appearanceLivePreview = state.isOpen && state.activeTab === "appearance";
      saveSettingsPatch({ appearance: defApp, greeting: defGreet });
      return;
    }
    if (action === "toggle-export-opt") {
      const key = actionEl.getAttribute("data-key");
      if (key && key in state.exportOpts) state.exportOpts[key] = !state.exportOpts[key];
      return;
    }
    if (action === "export-chat-zip") {
      if (state.exportBusy) return;
      const choosePath = actionEl.getAttribute("data-choose") === "1";
      state.exportBusy = true;
      state.exportError = "";
      renderStructure();
      invokeIpc("agy-studio:export-chat-zip", Object.assign({
        chatKey: state.activeChatKey || "__new__",
        title: state.activeChatTitle || "",
        modelName: state.telemetry.modelName || "",
        choosePath,
        domMessages: collectDomConversation(),
      }, state.exportOpts)).then((res) => {
        if (state.destroyed) return;
        state.exportBusy = false;
        if (res && res.ok) {
          state.exportResult = res;
          state.exportError = "";
        } else if (!res || !res.canceled) {
          state.exportError = (res && res.error) || "EXPORT_FAILED";
        }
        renderStructure();
      });
      return;
    }
    if (action === "reveal-export-file") {
      const fp = actionEl.getAttribute("data-path");
      if (fp) invokeIpc("agy-studio:reveal-file", { filePath: fp });
      return;
    }
    if (action === "reset-quota-stats") {
      invokeIpc("agy-studio:reset-quota-stats", { chatKey: state.activeChatKey || "__new__" }).then((res) => {
        if (state.destroyed) return;
        if (res && res.summary) state.quotaSummary = res.summary;
        updateLiveDom();
        renderStructure();
      });
    }
  }

  function handleAppearanceFieldInput(target) {
    const field = target.getAttribute("data-app-field");
    if (!field) return false;
    const rawVal = target.value;
    const tr = t();
    const draft = state.appearanceDraft;
    let labelText = null;
    let needsRerenderDots = false;

    if (field === "accentColor" || field === "canvasBg" || field === "cardBg") {
      draft[field] = String(rawVal || "#09090b").toLowerCase();
      draft.presetId = "custom";
      needsRerenderDots = true;
    } else if (field === "glassOpacity" || field === "glassBlur" || field === "radius" || field === "messageCardOpacity") {
      const n = Math.round(Number(rawVal) || 0);
      draft[field] = n;
      if (draft.presetId === "native") draft.presetId = "custom";
      labelText = (field === "glassOpacity" || field === "messageCardOpacity") ? `${n}%` : `${n}px`;
    } else if (field === "wallpaper.gradColor0" || field === "wallpaper.gradColor1" || field === "wallpaper.gradColor2") {
      const idx = parseInt(field.slice(-1), 10);
      draft.wallpaper.type = "gradient";
      draft.wallpaper.gradColors[idx] = String(rawVal || "#0f172a").toLowerCase();
    } else if (field === "wallpaper.gradAngle") {
      const n = Math.round(Number(rawVal) || 0);
      draft.wallpaper.gradAngle = n;
      labelText = `${n}°`;
    } else if (field === "wallpaper.gradSpeed") {
      const n = Math.round(Number(rawVal) || 18);
      draft.wallpaper.gradSpeed = n;
      labelText = `${n}s`;
    } else if (field === "wallpaper.dim" || field === "wallpaper.blur" || field === "wallpaper.opacity" || field === "wallpaper.scale") {
      const sub = field.split(".")[1];
      const n = Math.round(Number(rawVal) || 0);
      draft.wallpaper[sub] = n;
      labelText = sub === "blur" ? `${n}px` : `${n}%`;
    } else if (field === "typography.uiFont" || field === "typography.monoFont") {
      const sub = field.split(".")[1];
      draft.typography[sub] = String(rawVal || "system");
    } else if (field === "typography.fontSize") {
      const n = Math.round(Number(rawVal) || 14);
      draft.typography.fontSize = n;
      labelText = `${n}px`;
    } else if (field === "typography.lineHeight") {
      const n = Math.round((Number(rawVal) || 1.55) * 100) / 100;
      draft.typography.lineHeight = n;
      labelText = String(n);
    } else if (field === "typography.chatMaxWidth") {
      const n = Math.round(Number(rawVal) || 0);
      draft.typography.chatMaxWidth = n < 680 ? 0 : n;
      labelText = draft.typography.chatMaxWidth >= 680 ? `${draft.typography.chatMaxWidth}px` : tr.appChatWidthAuto;
    } else {
      return false;
    }

    markAppearanceDirty();
    if (labelText !== null && modalMountEl) {
      setLiveSlot(modalMountEl, `[data-live-app-val="${field}"]`, labelText, false);
    }
    if (needsRerenderDots && modalMountEl) {
      const cards = modalMountEl.querySelectorAll(".theme-card");
      for (let i = 0; i < cards.length; i += 1) {
        cards[i].classList.toggle("is-selected", cards[i].getAttribute("data-id") === draft.presetId);
      }
      const dots = modalMountEl.querySelectorAll(".accent-dot-btn");
      for (let i = 0; i < dots.length; i += 1) {
        dots[i].classList.toggle("is-selected", dots[i].getAttribute("data-val") === draft.accentColor);
      }
    }
    return true;
  }

  function handlePointerDown(e) {
    if (!widgetMountEl || !e || (typeof e.button === "number" && e.button !== 0) || state.settings.pinned) return;
    const tEl = e.target;
    if (!tEl || typeof tEl.closest !== "function") return;
    if (tEl.closest('[data-no-drag="1"]') || tEl.closest("button")) return;
    const handle = tEl.closest('[data-drag-handle="1"]');
    if (!handle) return;

    if (typeof widgetMountEl.setPointerCapture === "function" && e.pointerId !== undefined) {
      try { widgetMountEl.setPointerCapture(e.pointerId); } catch (_e) {}
    }

    const rect = typeof widgetMountEl.getBoundingClientRect === "function"
      ? widgetMountEl.getBoundingClientRect()
      : { left: 16, top: 16, width: 220, height: 36 };
    dragState = {
      pointerId: e.pointerId,
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
    positionPopover();
  }

  function handlePointerUp() {
    if (!dragState) return;
    const wasMoved = dragState.moved;
    const finalX = dragState.lastX;
    const finalY = dragState.lastY;
    const pid = dragState.pointerId;
    dragState = null;
    if (widgetMountEl && typeof widgetMountEl.releasePointerCapture === "function" && pid !== undefined) {
      try { widgetMountEl.releasePointerCapture(pid); } catch (_e) {}
    }
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
    rootEl.addEventListener("toggle", (e) => {
      const target = e && e.target;
      if (!target || typeof target.getAttribute !== "function") return;
      const key = target.getAttribute("data-disc");
      if (key) state.openDisclosures[key] = Boolean(target.open);
    }, true);

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
      if (handleAppearanceFieldInput(target)) return;
      const gf = target.getAttribute("data-greet-field");
      if (gf) {
        state.greetingDraft[gf] = target.value || "";
        state.greetingDraft.enabled = true;
        state.appearanceDirty = true;
        syncTranslatorGreeting(state.greetingDraft);
        updateGreetingLivePreview();
        return;
      }
      const role = target.getAttribute("data-role");
      if (role === "personaEditor") {
        state.draftPersonaText = target.value || "";
        state.draftDirty = true;
        const counter = modalMountEl ? modalMountEl.querySelector('[data-role="byteCounter"]') : null;
        if (counter) {
          const bytes = utf8ByteLength(state.draftPersonaText);
          const estTok = spTokenEst(state.draftPersonaText);
          const warn = bytes >= 20000;
          const tr = t();
          counter.textContent = `${bytes.toLocaleString()} / ${MAX_PERSONA_BODY_BYTES.toLocaleString()} ${tr.personaBytes} · ~${estTok.toLocaleString()} ${tr.tokShort}${warn ? " · " + tr.personaLimitWarn : ""}`;
          counter.style.color = warn ? "var(--rx-warning)" : "var(--rx-muted)";
        }
      } else if (role === "newPresetInput") {
        state.newPresetName = target.value || "";
      } else if (role === "newProfileInput") {
        state.newProfileName = target.value || "";
      } else if (role === "liveEditInput") {
        state.liveEditDraftText = target.value || "";
        const canSend = Boolean(state.liveEditDraftText.trim() || (state.liveEditDraftImages && state.liveEditDraftImages.length > 0)) && !state.liveEditBusy;
        const sendBtns = rootEl.querySelectorAll('[data-action="send-live-edit"]');
        for (let b = 0; b < sendBtns.length; b += 1) {
          sendBtns[b].disabled = !canSend;
        }
      }
    });

    rootEl.addEventListener("keydown", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.getAttribute !== "function") return;
      if (target.getAttribute("data-role") === "liveEditInput" && e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.isComposing) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        sendLiveEditFromDraft();
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && target.getAttribute("role") === "button" && target.hasAttribute("data-action")) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        handleActionClick(target);
      }
    });

    rootEl.addEventListener("paste", (e) => {
      if (!state.liveEditOpen && !(state.isOpen && state.activeTab === "live-edits")) return;
      const handled = extractClipboardImages(e && e.clipboardData, () => {
        renderPopoverStructure();
        if (state.isOpen && state.activeTab === "live-edits") renderStructure();
      });
      if (handled && typeof e.preventDefault === "function") e.preventDefault();
    });

    rootEl.addEventListener("change", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.getAttribute !== "function") return;
      if (target.tagName === "SELECT" && target.getAttribute("data-app-field")) {
        handleAppearanceFieldInput(target);
      }
    });

    if (widgetMountEl) {
      if (win && "PointerEvent" in win) {
        widgetMountEl.addEventListener("pointerdown", handlePointerDown);
      } else {
        widgetMountEl.addEventListener("mousedown", handlePointerDown);
      }
    }

    if (win && typeof win.addEventListener === "function") {
      pointerMoveHandler = handlePointerMove;
      pointerUpHandler = handlePointerUp;
      blurDragHandler = handlePointerUp;
      if ("PointerEvent" in win) {
        win.addEventListener("pointermove", pointerMoveHandler);
        win.addEventListener("pointerup", pointerUpHandler);
        win.addEventListener("pointercancel", pointerUpHandler);
      } else {
        win.addEventListener("mousemove", pointerMoveHandler);
        win.addEventListener("mouseup", pointerUpHandler);
      }
      win.addEventListener("blur", blurDragHandler);

      resizeHandler = () => {
        clampWidgetToViewport();
        positionPopover();
      };
      win.addEventListener("resize", resizeHandler);

      focusSyncHandler = () => {
        if (state.destroyed || !state.hasActivatedChat || state.draftDirty) return;
        const now = Date.now();
        if (now - state.lastFocusSyncAt < 500) return;
        state.lastFocusSyncAt = now;
        invokeIpc("agy-studio:activate-chat", {
          chatKey: state.activeChatKey || "__new__",
          title: state.activeChatTitle || "",
          draftPersona: state.activeChatKey === "__new__" ? state.newChatDraftPersona : null,
        });
      };
      win.addEventListener("focus", focusSyncHandler);
    }

    if (doc && typeof doc.addEventListener === "function") {
      visChangeHandler = () => {
        if (!doc.hidden && !state.destroyed && state.mounted) {
          state.lastPollAt = 0;
          pollStream();
        }
      };
      doc.addEventListener("visibilitychange", visChangeHandler);

      keydownHandler = (e) => {
        if (e && e.key === "Escape") {
          if (state.liveEditOpen) {
            state.liveEditOpen = false;
            renderPopoverStructure();
          } else if (state.isOpen) {
            setOpen(false);
          }
        }
      };
      doc.addEventListener("keydown", keydownHandler, true);

      cancelClickHandler = (e) => {
        const tEl = e && e.target;
        if (!tEl || typeof tEl.closest !== "function") return;
        if (tEl.closest('[data-testid="cancel-invocation-button"]')) {
          state.lastCancelClickAt = nowHiRes();
        }
      };
      doc.addEventListener("click", cancelClickHandler, true);
    }
  }

  function mountStudioUi() {
    if (state.mounted || state.destroyed || !doc) return;
    const mountTarget = doc.body || doc.documentElement;
    if (!mountTarget || typeof doc.createElement !== "function") return;

    for (const oldId of ["rudex-studio-host", "agy-ru-studio-host"]) {
      const existing = typeof doc.getElementById === "function" ? doc.getElementById(oldId) : null;
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }

    hostEl = doc.createElement("div");
    hostEl.id = "rudex-studio-host";
    hostEl.setAttribute("data-rudex-ignore", "1");
    hostEl.setAttribute("data-agy-ru-ignore", "1");
    mountTarget.appendChild(hostEl);

    if (typeof hostEl.attachShadow === "function") {
      shadowRoot = hostEl.attachShadow({ mode: "open" });
    } else {
      shadowRoot = hostEl;
    }

    styleEl = doc.createElement("style");
    styleEl.textContent = stylesFn();
    rootEl = doc.createElement("div");
    rootEl.className = "studio-root";
    widgetMountEl = doc.createElement("div");
    widgetMountEl.className = "widget-wrap";
    popoverMountEl = doc.createElement("div");
    popoverMountEl.className = "le-popover-mount";
    modalMountEl = doc.createElement("div");
    modalMountEl.className = "modal-mount";

    rootEl.appendChild(widgetMountEl);
    rootEl.appendChild(popoverMountEl);
    rootEl.appendChild(modalMountEl);
    shadowRoot.appendChild(styleEl);
    shadowRoot.appendChild(rootEl);

    attachDomEvents();
    state.mounted = true;
    state.hydrationIgnoreUntil = nowHiRes() + 2500;
    renderStructure();
    refreshLiveEdits();
    pollStream();

    if (win && typeof win.setInterval === "function") {
      pollTimer = win.setInterval(() => pollStream(), 120);
    }

    if (typeof win !== "undefined" && typeof win.MutationObserver === "function" && doc.body) {
      try {
        domObserver = new win.MutationObserver((muts) => {
          if (state.destroyed) return;
          if (Array.isArray(muts) && muts.length > 0) {
            let hasExternal = false;
            for (let i = 0; i < muts.length; i += 1) {
              const m = muts[i];
              if (!m) continue;
              const tNode = m.target;
              if (!tNode) continue;
              const tId = tNode.id || "";
              if (tId === "rudex-studio-host" || tId === "rudex-bg" || tId === "rudex-studio-theme" || tId === "rudex-greeting-style" || tId === "agy-ru-studio-host" || tId === "agy-ru-studio-bg" || tId === "agy-ru-studio-theme") continue;
              if (hostEl && (tNode === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(tNode)))) continue;
              hasExternal = true;
              break;
            }
            if (!hasExternal) return;
          }
          scheduleStreamSample();
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

    invokeIpc("agy-studio:get-state", { chatKey: state.activeChatKey || "__new__" }).then((remote) => {
      if (remote) applyRemoteState(remote, true);
    });
  }

  function clearReadinessWatchers() {
    if (readyTimer && win && typeof win.clearInterval === "function") {
      win.clearInterval(readyTimer);
      readyTimer = null;
    }
    if (readyObserver && typeof readyObserver.disconnect === "function") {
      readyObserver.disconnect();
      readyObserver = null;
    }
  }

  function scheduleMountAfterSettle() {
    if (state.mounted || state.destroyed || settleTimer) return;
    clearReadinessWatchers();
    if (win && typeof win.setTimeout === "function") {
      settleTimer = win.setTimeout(() => {
        settleTimer = null;
        mountStudioUi();
      }, 150);
    } else {
      mountStudioUi();
    }
  }

  function init() {
    if (state.initialized || state.destroyed || !doc) return;
    try {
      const proto = win && win.location && typeof win.location.protocol === "string" ? win.location.protocol : "";
      if (/^(data:|about:)$/i.test(proto)) return;
    } catch (_e) {}

    state.initialized = true;
    if (isAntigravityUiReady()) {
      mountStudioUi();
      return;
    }

    const obsTarget = doc.documentElement || doc.body;
    if (typeof win !== "undefined" && typeof win.MutationObserver === "function" && obsTarget) {
      try {
        readyObserver = new win.MutationObserver(() => {
          if (isAntigravityUiReady()) scheduleMountAfterSettle();
        });
        readyObserver.observe(obsTarget, { childList: true, subtree: true });
      } catch (_e) {}
    }

    if (win && typeof win.setInterval === "function") {
      const startAt = Date.now();
      readyTimer = win.setInterval(() => {
        if (state.destroyed || state.mounted) {
          clearReadinessWatchers();
          return;
        }
        if (isAntigravityUiReady()) {
          scheduleMountAfterSettle();
          return;
        }
        const elapsed = Date.now() - startAt;
        if (elapsed >= 12000) {
          clearReadinessWatchers();
          const bodyText = doc.body ? ((doc.body.textContent || "").trim()) : "";
          if (bodyText.length > 80) scheduleMountAfterSettle();
        }
      }, 220);
    }
  }

  function setOpen(nextOpen, opts) {
    const next = Boolean(nextOpen);
    if (next && opts && typeof opts === "object") {
      if (opts.tab) state.activeTab = String(opts.tab);
      if (opts.subTab) state.settingsSubTab = String(opts.subTab);
    }
    if (!next && (state.appearanceLivePreview || state.activeTab === "appearance")) {
      state.appearanceLivePreview = false;
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.greetingDraft = spCloneGreeting(state.settings.greeting);
      state.appearanceDirty = false;
      applyThemeToHost(state.settings.appearance);
      syncTranslatorGreeting(state.settings.greeting);
    }
    state.isOpen = next;
    if (next && state.activeTab === "appearance") {
      state.appearanceLivePreview = true;
      if (!state.appearanceDirty) {
        state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        state.greetingDraft = spCloneGreeting(state.settings.greeting);
      }
      applyThemeFastToHost(state.appearanceDraft);
    }
    if (next && state.activeTab === "live-edits") {
      refreshLiveEdits();
    }
    if (next && state.activeTab === "settings" && state.settingsSubTab === "export") {
      invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__" }).then((qs) => {
        if (!state.destroyed && qs) {
          state.quotaSummary = qs;
          if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "export") renderStructure();
        }
      });
    }
    renderStructure();
  }

  function toggleOpen() {
    setOpen(!state.isOpen);
  }

  function toggleLiveEditPopover() {
    state.liveEditOpen = !state.liveEditOpen;
    state.liveEditError = "";
    renderPopoverStructure();
    if (state.liveEditOpen) {
      refreshLiveEdits();
      if (win && typeof win.setTimeout === "function") {
        win.setTimeout(() => {
          try {
            const inp = popoverMountEl && popoverMountEl.querySelector('[data-role="liveEditInput"]');
            if (inp && typeof inp.focus === "function") inp.focus();
          } catch (_e) {}
        }, 25);
      }
    }
  }

  function applyLiveEditsUpdate(payload) {
    applyLiveEditsPayload(payload);
    renderPopoverStructure();
    updateLiveDom();
    if (state.isOpen && state.activeTab === "live-edits") renderStructure();
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
    clearReadinessWatchers();
    for (const timer of [settleTimer, repaintTimer, streamSampleTimer, turnSyncTimer, toastTimer]) {
      if (timer && win && typeof win.clearTimeout === "function") win.clearTimeout(timer);
    }
    settleTimer = repaintTimer = streamSampleTimer = turnSyncTimer = toastTimer = null;
    if (pollTimer && win && typeof win.clearInterval === "function") {
      win.clearInterval(pollTimer);
      pollTimer = null;
    }
    if (domObserver && typeof domObserver.disconnect === "function") { domObserver.disconnect(); domObserver = null; }
    if (themeObserver && typeof themeObserver.disconnect === "function") { themeObserver.disconnect(); themeObserver = null; }
    if (win && typeof win.removeEventListener === "function") {
      if (pointerMoveHandler) {
        win.removeEventListener("pointermove", pointerMoveHandler);
        win.removeEventListener("mousemove", pointerMoveHandler);
      }
      if (pointerUpHandler) {
        win.removeEventListener("pointerup", pointerUpHandler);
        win.removeEventListener("pointercancel", pointerUpHandler);
        win.removeEventListener("mouseup", pointerUpHandler);
      }
      if (blurDragHandler) win.removeEventListener("blur", blurDragHandler);
      if (resizeHandler) win.removeEventListener("resize", resizeHandler);
      if (focusSyncHandler) win.removeEventListener("focus", focusSyncHandler);
    }
    if (doc && typeof doc.removeEventListener === "function") {
      if (visChangeHandler) doc.removeEventListener("visibilitychange", visChangeHandler);
      if (keydownHandler) doc.removeEventListener("keydown", keydownHandler, true);
      if (cancelClickHandler) doc.removeEventListener("click", cancelClickHandler, true);
    }
    revokeCachedMedia("");
    mediaLoadInflight.clear();
    if (hostEl && hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
    if (themeEngine && typeof themeEngine.destroy === "function") {
      try { themeEngine.destroy(); } catch (_e) {}
    }
    hostEl = shadowRoot = rootEl = widgetMountEl = popoverMountEl = modalMountEl = null;
  }

  return {
    init,
    destroy,
    setOpen,
    toggleOpen,
    toggleLiveEditPopover,
    applyLiveEditsUpdate,
    setViewMode,
    setLocale,
    applyRemoteState,
    estimateTokens: spTokenEst,
    pollStream,
    resolveMediaUrl: resolveStudioMediaUrl,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    createStudioPanel,
    parseQuotaFromDocumentText,
    formatQuotaPct,
    formatBytesCompact,
  };
}
