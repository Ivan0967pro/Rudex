"use strict";

const BUILTIN_PERSONA_PRESETS = [];

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
  archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
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
    sidebarSectionStudio: "Студия",
    modalTitleMonitor: "Монитор генерации",
    modalSubMonitor: "Живая оценка скорости (TPS) и расхода токенов в активном чате",
    modalTitleWidget: "Виджет на экране",
    modalSubWidget: "Настройте компактную капсулу, поля и привязку к краю окна",
    modalTitlePersona: "Характер агента",
    modalSubPersona: "Индивидуальная инструкция для активного чата (со следующего сообщения)",
    modalTitleLanguage: "Язык и перевод",
    modalSubLanguage: "Переключение интерфейса Antigravity без перезапуска и горячие клавиши",
    modalTitleAppearance: "Оформление (Студия)",
    modalSubAppearance: "Темы интерфейса, статичные и видео-обои с предпросмотром, шрифты и профили",
    modalTitleExport: "Экспорт и лимиты",
    modalSubExport: "Выгрузка всего контекста чата в ZIP и динамический учёт лимитов 5ч / Неделя",
    navMonitor: "Монитор",
    navWidget: "Виджет",
    navPersona: "Характер агента",
    navLanguage: "Язык и перевод",
    navAppearance: "Оформление",
    navExport: "Экспорт и лимиты",
    fieldQuota: "Расход лимитов (5ч / Нед.)",
    fieldQuotaDesc: "Показывать оценку расхода 5-часового и недельного лимита текущего чата",
    quota5hShort: "5ч",
    quotaWeekShort: "Нед.",
    appPreviewTitle: "Живой предпросмотр стиля до сохранения",
    appLivePreviewToggle: "Предпросмотр на всём окне",
    appThemesTitle: "Тема и стеклянные поверхности",
    appPolishLabel: "Улучшенная полировка интерфейса (скроллбары и фокус)",
    appCustomColorsTitle: "Тонкая настройка цветов и стекла",
    appAccentColor: "Акцентный цвет",
    appCanvasColor: "Фон окна",
    appCardColor: "Фон карточек",
    appGlassOpacity: "Плотность стекла",
    appGlassBlur: "Размытие (Blur)",
    appRadius: "Скругление",
    appWallpaperTitle: "Студия обоев для чатов",
    appWpNone: "Без обоев",
    appWpGradient: "Градиент",
    appWpImage: "Картинка",
    appWpVideo: "Видео (MP4/WebM)",
    appWpPickImage: "Выбрать фото...",
    appWpPickVideo: "Выбрать видео...",
    appWpClearMedia: "Убрать файл",
    appWpAnimated: "Плавная анимация градиента",
    appWpSpeed: "Скорость цикла",
    appWpAngle: "Угол",
    appWpDim: "Затемнение фона",
    appWpBlur: "Размытие обоев",
    appWpOpacity: "Яркость обоев",
    appWpScale: "Масштаб",
    appWpAutoPause: "Пауза видео при скрытии окна",
    appWpNoFileHint: "Выберите локальное изображение (PNG/JPG/WebP) или зацикленное видео (MP4/WebM)",
    appTypoTitle: "Типографика и плотность чата",
    appUiFont: "Шрифт интерфейса",
    appMonoFont: "Шрифт кода",
    appFontSize: "Размер текста",
    appLineHeight: "Межстрочный интервал",
    appChatWidth: "Ширина ленты чата",
    appChatWidthAuto: "Авто",
    appDensity: "Плотность отступов",
    appDensityCompact: "Компактно",
    appDensityComfort: "Обычно",
    appDensitySpacious: "Просторно",
    appProfilesTitle: "Сохранённые профили вида",
    appProfilePlaceholder: "Название профиля вида...",
    appSaveProfile: "Сохранить профиль",
    appApplyBtn: "Применить оформление",
    appCancelBtn: "Отменить",
    appResetBtn: "Сбросить к стандарту",
    appAppliedMsg: "Оформление применено ко всему окну",
    appResetMsg: "Возвращён стандартный вид Antigravity",
    appMediaPickedMsg: "Файл загружен в студию",
    appMediaErrMsg: "Не удалось загрузить файл",
    appProfileSavedMsg: "Профиль сохранён",
    appProfileDeletedMsg: "Профиль удалён",
    quotaSectionTitle: "Лимиты моделей (5ч / Неделя)",
    quotaChatUsed: "Расход этого чата",
    quotaCalibratedBadge: "Откалибровано по Antigravity",
    quotaEstimatedBadge: "Динамическая оценка",
    quotaCalibrateTip: "Откройте Настройки -> Модели в Antigravity раз в сессию, чтобы автоматически откалибровать точный остаток %.",
    quotaRemShort: "Остаток аккаунта:",
    quotaOpenLimitsLink: "Все чаты и детали ->",
    quotaTableTitle: "Расход лимитов по чатам (5ч / Неделя)",
    quotaColChat: "Чат",
    quotaColModel: "Модель",
    quotaCol5h: "5ч окно / всего",
    quotaColWeek: "Неделя",
    quotaColTurns: "Ходы",
    quotaTableEmpty: "Пока нет учтённых ходов. Отправьте запрос в любом чате, чтобы отслеживать его вклад в лимиты.",
    quotaResetBtn: "Сбросить счётчики",
    quotaResetDone: "Счётчики расхода лимитов сброшены",
    quotaNoData: "нет снимка",
    exportTitle: "Экспорт всего контекста чата в ZIP",
    exportDesc: "Упаковывает диалог, прикреплённые фото/файлы, артефакты из brain/, характер агента и статистику лимитов в стандартный ZIP.",
    exportOptAttachments: "Фото и вложения (.user_uploaded)",
    exportOptArtifacts: "Артефакты и файлы (scratch / brain)",
    exportOptPersona: "Характер и инструкция агента",
    exportOptFullLog: "Полный сырой лог (transcript_full.jsonl)",
    exportBtnDownloads: "Скачать ZIP в Загрузки",
    exportBtnSaveAs: "Сохранить как...",
    exportBusy: "Упаковка архива...",
    exportSuccess: "Архив сохранён:",
    exportErr: "Ошибка экспорта:",
    exportRevealBtn: "Показать в папке",
    exportSummaryMsgs: "сообщений",
    exportSummaryAttach: "вложений",
    exportSummaryArtifacts: "артефактов",
    exportSourceDisk: "полный архив с диска",
    exportSourceDom: "снимок открытого чата",
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
    secUnit: "с",
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
    personaPresetsLabel: "Мои шаблоны",
    personaCustomLabel: "Сохранённый шаблон",
    personaEditorLabel: "Инструкция характера (Markdown)",
    personaEditorPlaceholder: "Например: Отвечай как опытный тимлид, кратко, сразу к коду и без лишних вступлений...",
    personaBytes: "байт",
    personaSavePresetPlaceholder: "Название нового шаблона...",
    personaAddPresetBtn: "Сохранить шаблон",
    personaApplyBtn: "Применить для этого чата",
    personaClearBtn: "Очистить",
    personaRulePathLabel: "Файл правила:",
    personaSavedMsg: "Применено · правило активно (со следующего сообщения)",
    personaDisabledMsg: "Характер отключён (текст сохранён)",
    personaEmptyWarn: "Сначала введите текст инструкции",
    personaWriteErr: "Не удалось записать файл правила",
    personaTooLargeErr: "Превышен лимит размера правила (23 000 байт)",
    personaClearedMsg: "Инструкция очищена",
    personaDeletedPreset: "Шаблон удалён",
    personaLimitWarn: "Близко к лимиту правила (23 000 байт)",
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
    sidebarSectionStudio: "Studio",
    modalTitleMonitor: "Generation Monitor",
    modalSubMonitor: "Live token throughput (TPS) and context size estimation",
    modalTitleWidget: "Floating Widget",
    modalSubWidget: "Configure compact capsule fields, mode, and edge docking",
    modalTitlePersona: "Agent Persona",
    modalSubPersona: "Per-chat agent persona instruction (active from next message in this chat)",
    modalTitleLanguage: "Language & UI",
    modalSubLanguage: "Switch Antigravity localization live without restarting",
    modalTitleAppearance: "Appearance Studio",
    modalSubAppearance: "UI themes, static/gradient/video chat wallpapers with live preview, fonts and profiles",
    modalTitleExport: "Export & Limits",
    modalSubExport: "Export full chat context to ZIP and track per-chat 5-hour / weekly quota usage",
    navMonitor: "Monitor",
    navWidget: "Widget",
    navPersona: "Agent Persona",
    navLanguage: "Language & UI",
    navAppearance: "Appearance",
    navExport: "Export & Limits",
    fieldQuota: "Quota usage (5h / Week)",
    fieldQuotaDesc: "Show estimated 5-hour and weekly limit usage for the active chat",
    quota5hShort: "5h",
    quotaWeekShort: "Wk",
    appPreviewTitle: "Interactive style preview before applying",
    appLivePreviewToggle: "Preview across entire window",
    appThemesTitle: "Theme presets & glass surfaces",
    appPolishLabel: "Visual UI polish (refined scrollbars & composer focus)",
    appCustomColorsTitle: "Custom colors & glass tuning",
    appAccentColor: "Accent color",
    appCanvasColor: "Window background",
    appCardColor: "Card background",
    appGlassOpacity: "Glass opacity",
    appGlassBlur: "Backdrop blur",
    appRadius: "Corner radius",
    appWallpaperTitle: "Chat Wallpaper Studio",
    appWpNone: "None",
    appWpGradient: "Gradient",
    appWpImage: "Image",
    appWpVideo: "Video (MP4/WebM)",
    appWpPickImage: "Choose image...",
    appWpPickVideo: "Choose video...",
    appWpClearMedia: "Remove file",
    appWpAnimated: "Animate gradient flow",
    appWpSpeed: "Cycle duration",
    appWpAngle: "Angle",
    appWpDim: "Background dim",
    appWpBlur: "Wallpaper blur",
    appWpOpacity: "Wallpaper opacity",
    appWpScale: "Scale",
    appWpAutoPause: "Pause video when hidden",
    appWpNoFileHint: "Pick a local image (PNG/JPG/WebP) or looping video (MP4/WebM)",
    appTypoTitle: "Typography & Chat Density",
    appUiFont: "UI font",
    appMonoFont: "Code font",
    appFontSize: "Message font size",
    appLineHeight: "Line height",
    appChatWidth: "Feed max width",
    appChatWidthAuto: "Auto",
    appDensity: "Message spacing",
    appDensityCompact: "Compact",
    appDensityComfort: "Default",
    appDensitySpacious: "Spacious",
    appProfilesTitle: "Saved appearance profiles",
    appProfilePlaceholder: "New profile name...",
    appSaveProfile: "Save profile",
    appApplyBtn: "Apply appearance",
    appCancelBtn: "Discard",
    appResetBtn: "Reset to Native",
    appAppliedMsg: "Appearance applied to window",
    appResetMsg: "Restored native Antigravity appearance",
    appMediaPickedMsg: "Media added to Studio",
    appMediaErrMsg: "Failed to load media file",
    appProfileSavedMsg: "Profile saved",
    appProfileDeletedMsg: "Profile removed",
    quotaSectionTitle: "Model Quotas (5h / Weekly)",
    quotaChatUsed: "Used in this chat",
    quotaCalibratedBadge: "Calibrated from Antigravity",
    quotaEstimatedBadge: "Dynamic estimate",
    quotaCalibrateTip: "Open Settings -> Models in Antigravity once per session to auto-calibrate exact remaining %.",
    quotaRemShort: "Account left:",
    quotaOpenLimitsLink: "All chats & details ->",
    quotaTableTitle: "Per-Chat Quota Breakdown (5h / Weekly)",
    quotaColChat: "Chat",
    quotaColModel: "Model",
    quotaCol5h: "5h win / total",
    quotaColWeek: "Weekly",
    quotaColTurns: "Turns",
    quotaTableEmpty: "No turns recorded yet. Send a message in any chat to track its quota impact.",
    quotaResetBtn: "Reset counters",
    quotaResetDone: "Quota counters reset",
    quotaNoData: "no snapshot",
    exportTitle: "Export Full Chat Context to ZIP",
    exportDesc: "Packages conversation log, uploaded photos/files, brain artifacts, active persona prompt, and quota telemetry into a standard ZIP archive.",
    exportOptAttachments: "Uploaded photos & files (.user_uploaded)",
    exportOptArtifacts: "Artifacts & scratch files (brain)",
    exportOptPersona: "Agent persona instruction",
    exportOptFullLog: "Raw full log (transcript_full.jsonl)",
    exportBtnDownloads: "Save ZIP to Downloads",
    exportBtnSaveAs: "Save As...",
    exportBusy: "Building ZIP archive...",
    exportSuccess: "Archive saved:",
    exportErr: "Export failed:",
    exportRevealBtn: "Show in folder",
    exportSummaryMsgs: "messages",
    exportSummaryAttach: "attachments",
    exportSummaryArtifacts: "artifacts",
    exportSourceDisk: "full disk archive",
    exportSourceDom: "DOM chat snapshot",
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
    secUnit: "s",
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
    personaPresetsLabel: "My templates",
    personaCustomLabel: "Saved template",
    personaEditorLabel: "Persona instruction (Markdown)",
    personaEditorPlaceholder: "Example: Answer like a concise senior engineer, straight to the solution...",
    personaBytes: "bytes",
    personaSavePresetPlaceholder: "New template name...",
    personaAddPresetBtn: "Save template",
    personaApplyBtn: "Apply to this chat",
    personaClearBtn: "Clear",
    personaRulePathLabel: "Rule file:",
    personaSavedMsg: "Applied · rule active (from next message)",
    personaDisabledMsg: "Persona disabled (draft kept)",
    personaEmptyWarn: "Enter a persona instruction first",
    personaWriteErr: "Failed to write rule file",
    personaTooLargeErr: "Rule size exceeds 23,000 bytes limit",
    personaClearedMsg: "Cleared",
    personaDeletedPreset: "Template removed",
    personaLimitWarn: "Approaching rule size cap (23,000 bytes)",
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

function estimateTokensFloat(text) {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  let nonAscii = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    if (trimmed.charCodeAt(i) > 127) nonAscii += 1;
  }
  const ascii = trimmed.length - nonAscii;
  return ascii / 3.5 + nonAscii / 2.1;
}

function estimateTokens(text) {
  const f = estimateTokensFloat(text);
  return f > 0 ? Math.max(1, Math.round(f)) : 0;
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
    lastDurSec: 0,
    lastThinkingSec: 0,
    respTokens: 0,
    chatTokens: 0,
    contextLabel: "",
    modelName: "",
    samples: [],
    history: [],
    turnStartMs: 0,
    firstGrowthAt: 0,
    lastGrowthAt: 0,
    preTokenAt: 0,
    activeStreamMs: 0,
    turnStartFloatTok: 0,
    prevFloatTok: 0,
    activeRespEl: null,
    prevRespCount: 0,
    prevUserCount: 0,
    tpsBuckets: [],
    wasGenerating: false,
    dirty: false,
  };
}

const SP_FALLBACK_APPEARANCE = {
  presetId: "native",
  uiPolish: true,
  accentColor: "#3b82f6",
  canvasBg: "#09090b",
  cardBg: "#131316",
  glassOpacity: 78,
  glassBlur: 12,
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

const SP_FALLBACK_THEME_PRESETS = [
  { id: "native", nameRu: "Стандартная Antigravity", nameEn: "Native Antigravity", descRu: "Оригинальная палитра без переопределений", descEn: "Original palette without overrides", mode: "native", vars: { accentColor: "#2563eb", canvasBg: "#0c0c0e", cardBg: "#131316", sidebarBg: "#0f0f12", fgColor: "#ececef", mutedColor: "#9a9aa6", borderColor: "#27272e", glassOpacity: 82, glassBlur: 12, radius: 12 } },
  { id: "obsidian-glass", nameRu: "Обсидиановое стекло", nameEn: "Obsidian Glass", descRu: "Глубокий тёмный неон и матовые карточки", descEn: "Deep obsidian tones with frosted glass cards", mode: "dark", vars: { accentColor: "#3b82f6", canvasBg: "#09090b", cardBg: "#121216", sidebarBg: "#0d0d11", fgColor: "#f1f2f6", mutedColor: "#9aa0b0", borderColor: "#262833", glassOpacity: 74, glassBlur: 14, radius: 12 } },
  { id: "midnight-neon", nameRu: "Полуночный неон", nameEn: "Midnight Neon", descRu: "Индиго-палитра с мягким акцентом", descEn: "Deep indigo glass with luminous focus ring", mode: "dark", vars: { accentColor: "#6366f1", canvasBg: "#070814", cardBg: "#0f1224", sidebarBg: "#0b0d1b", fgColor: "#eef2ff", mutedColor: "#94a3b8", borderColor: "#232949", glassOpacity: 76, glassBlur: 16, radius: 14 } },
  { id: "warm-contrast", nameRu: "Тёплый графит", nameEn: "Warm Contrast", descRu: "Мягкий тёмно-янтарный графит", descEn: "Warm charcoal surfaces with crisp contrast", mode: "dark", vars: { accentColor: "#f59e0b", canvasBg: "#12100e", cardBg: "#1b1815", sidebarBg: "#161310", fgColor: "#f5f1ea", mutedColor: "#a89f94", borderColor: "#312b24", glassOpacity: 82, glassBlur: 12, radius: 10 } },
  { id: "light-paper", nameRu: "Светлая бумага", nameEn: "Light Paper", descRu: "Светлые бумажные поверхности", descEn: "Crisp light paper surfaces with ink typography", mode: "light", vars: { accentColor: "#2563eb", canvasBg: "#f8f7f4", cardBg: "#ffffff", sidebarBg: "#f1efe9", fgColor: "#141418", mutedColor: "#5c5c66", borderColor: "#e2dfd7", glassOpacity: 86, glassBlur: 10, radius: 12 } },
  { id: "custom", nameRu: "Своя тема", nameEn: "Custom Theme", descRu: "Полный ручной подбор цветов и стекла", descEn: "Manual control over colors and glass", mode: "dark", vars: { accentColor: "#3b82f6", canvasBg: "#09090b", cardBg: "#131316", sidebarBg: "#0f0f12", fgColor: "#f1f2f6", mutedColor: "#9a9aa6", borderColor: "#272730", glassOpacity: 78, glassBlur: 12, radius: 12 } },
];

const SP_FALLBACK_GRADIENT_PRESETS = [
  { id: "aurora", nameRu: "Аврора", nameEn: "Aurora", colors: ["#0f172a", "#1e1b4b", "#09090b"], angle: 135 },
  { id: "cosmic", nameRu: "Космос", nameEn: "Cosmic", colors: ["#090d1e", "#311042", "#0d1b2a"], angle: 125 },
  { id: "sunset", nameRu: "Закат", nameEn: "Sunset", colors: ["#1f121b", "#4a1c2d", "#171426"], angle: 145 },
  { id: "emerald", nameRu: "Изумруд", nameEn: "Emerald", colors: ["#071714", "#0d3b32", "#091015"], angle: 135 },
  { id: "cyber", nameRu: "Киберпанк", nameEn: "Cyber", colors: ["#090b1a", "#172554", "#3b0764"], angle: 120 },
  { id: "silk", nameRu: "Тёплый шёлк", nameEn: "Warm Silk", colors: ["#1a1715", "#2d241c", "#141210"], angle: 140 },
];

const SP_FALLBACK_FONT_PRESETS = {
  ui: [
    { id: "system", label: "Системный (Default)", labelEn: "System Default", stack: "" },
    { id: "segoe", label: "Segoe UI", labelEn: "Segoe UI", stack: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif' },
    { id: "inter", label: "Inter", labelEn: "Inter", stack: '"Inter", "Segoe UI", system-ui, sans-serif' },
    { id: "rubik", label: "Rubik", labelEn: "Rubik", stack: '"Rubik", "Segoe UI", system-ui, sans-serif' },
    { id: "ibm-plex", label: "IBM Plex Sans", labelEn: "IBM Plex Sans", stack: '"IBM Plex Sans", "Segoe UI", sans-serif' },
    { id: "georgia", label: "Georgia (Serif)", labelEn: "Georgia (Serif)", stack: 'Georgia, "Times New Roman", serif' },
  ],
  mono: [
    { id: "system", label: "Стандартный (Default)", labelEn: "System Mono", stack: "" },
    { id: "cascadia", label: "Cascadia Code", labelEn: "Cascadia Code", stack: '"Cascadia Code", Consolas, monospace' },
    { id: "jetbrains", label: "JetBrains Mono", labelEn: "JetBrains Mono", stack: '"JetBrains Mono", Consolas, monospace' },
    { id: "consolas", label: "Consolas", labelEn: "Consolas", stack: 'Consolas, "Courier New", monospace' },
    { id: "fira", label: "Fira Code", labelEn: "Fira Code", stack: '"Fira Code", Consolas, monospace' },
  ],
};

function spGetThemePresets() {
  return typeof THEME_PRESETS !== "undefined" ? THEME_PRESETS : SP_FALLBACK_THEME_PRESETS;
}

function spGetGradientPresets() {
  return typeof GRADIENT_PRESETS !== "undefined" ? GRADIENT_PRESETS : SP_FALLBACK_GRADIENT_PRESETS;
}

function spGetFontPresets() {
  return typeof FONT_PRESETS !== "undefined" ? FONT_PRESETS : SP_FALLBACK_FONT_PRESETS;
}

function spNormalizeAppearance(raw) {
  if (typeof normalizeAppearance === "function") {
    return normalizeAppearance(raw);
  }
  const src = raw && typeof raw === "object" ? raw : {};
  const wpSrc = src.wallpaper && typeof src.wallpaper === "object" ? src.wallpaper : {};
  const tySrc = src.typography && typeof src.typography === "object" ? src.typography : {};
  return {
    presetId: typeof src.presetId === "string" ? src.presetId : "native",
    uiPolish: src.uiPolish !== false,
    accentColor: typeof src.accentColor === "string" ? src.accentColor : "#3b82f6",
    canvasBg: typeof src.canvasBg === "string" ? src.canvasBg : "#09090b",
    cardBg: typeof src.cardBg === "string" ? src.cardBg : "#131316",
    glassOpacity: Number.isFinite(Number(src.glassOpacity)) ? Number(src.glassOpacity) : 78,
    glassBlur: Number.isFinite(Number(src.glassBlur)) ? Number(src.glassBlur) : 12,
    radius: Number.isFinite(Number(src.radius)) ? Number(src.radius) : 12,
    wallpaper: Object.assign({}, SP_FALLBACK_APPEARANCE.wallpaper, wpSrc, {
      gradColors: Array.isArray(wpSrc.gradColors) ? wpSrc.gradColors.slice(0, 3) : SP_FALLBACK_APPEARANCE.wallpaper.gradColors.slice(),
    }),
    typography: Object.assign({}, SP_FALLBACK_APPEARANCE.typography, tySrc),
  };
}

function spCloneAppearance(raw) {
  const n = spNormalizeAppearance(raw);
  return {
    presetId: n.presetId,
    uiPolish: n.uiPolish,
    accentColor: n.accentColor,
    canvasBg: n.canvasBg,
    cardBg: n.cardBg,
    glassOpacity: n.glassOpacity,
    glassBlur: n.glassBlur,
    radius: n.radius,
    wallpaper: Object.assign({}, n.wallpaper, {
      gradColors: Array.isArray(n.wallpaper.gradColors) ? n.wallpaper.gradColors.slice(0, 3) : ["#0f172a", "#1e1b4b", "#09090b"],
    }),
    typography: Object.assign({}, n.typography),
  };
}

function spFindThemePreset(id) {
  const list = spGetThemePresets();
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i];
  }
  return list[0];
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

function parseQuotaSectionFromSlice(slice) {
  if (!slice) return null;
  let weeklyRem = null;
  let fiveHourRem = null;
  let weeklyReset = "";
  let fiveHourReset = "";

  const wkRe = /(?:weekly\s+limit(?:\s+remaining)?|остаток\s+недельн[а-яё]*\s+лимит[а-яё]*|недельн[а-яё]*\s+лимит(?:\s+осталось)?|осталось\s+за\s+недел[а-яё]*)[\s\S]{0,180}?(\d{1,3}(?:[.,]\d+)?)\s*%/i;
  const wkM = wkRe.exec(slice);
  if (wkM) {
    const val = parseFloat(wkM[1].replace(",", "."));
    if (Number.isFinite(val) && val >= 0 && val <= 100) weeklyRem = val;
    const afterWk = slice.slice(wkM.index + wkM[0].length, wkM.index + wkM[0].length + 120);
    const rM = /(?:refresh(?:ed)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·]{2,48})/i.exec(afterWk);
    if (rM) weeklyReset = rM[1].trim();
  }

  const fhRe = /(?:(?:five\s*hour|5[-\s]*hour)\s+limit(?:\s+remaining)?|остаток\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит[а-яё]*|(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит(?:\s+осталось)?|осталось\s+за\s+5\s*ч[а-яё]*)[\s\S]{0,180}?(\d{1,3}(?:[.,]\d+)?)\s*%/i;
  const fhM = fhRe.exec(slice);
  if (fhM) {
    const val = parseFloat(fhM[1].replace(",", "."));
    if (Number.isFinite(val) && val >= 0 && val <= 100) fiveHourRem = val;
    const afterFh = slice.slice(fhM.index + fhM[0].length, fhM.index + fhM[0].length + 120);
    const rM2 = /(?:refresh(?:ed)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·]{2,48})/i.exec(afterFh);
    if (rM2) fiveHourReset = rM2[1].trim();
  }

  if (weeklyRem === null && fiveHourRem === null) return null;
  return { weeklyRem, fiveHourRem, weeklyReset, fiveHourReset };
}

function parseQuotaFromDocumentText(fullText) {
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
    while ((m = re.exec(txt)) !== null) {
      res.push(m.index);
    }
    return res;
  };

  const gemIdxs = findAllIndices(gemHeadRe);
  const claIdxs = findAllIndices(claHeadRe);

  let gemini = null;
  for (let i = gemIdxs.length - 1; i >= 0; i -= 1) {
    const start = gemIdxs[i];
    const nextCla = claIdxs.find((c) => c > start && c - start < 800);
    const end = nextCla ? nextCla : start + 560;
    const parsed = parseQuotaSectionFromSlice(txt.slice(start, end));
    if (parsed) {
      gemini = parsed;
      break;
    }
  }

  let claudeGpt = null;
  for (let i = claIdxs.length - 1; i >= 0; i -= 1) {
    const start = claIdxs[i];
    const nextGem = gemIdxs.find((g) => g > start && g - start < 800);
    const end = nextGem ? nextGem : start + 560;
    const parsed = parseQuotaSectionFromSlice(txt.slice(start, end));
    if (parsed) {
      claudeGpt = parsed;
      break;
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
      --st-bg: var(--background, #0c0c0e);
      --st-sidebar: var(--sidebar, #131316);
      --st-nav-active: #222328;
      --st-nav-hover: rgba(255, 255, 255, 0.05);
      --st-card: var(--card, #161619);
      --st-card-hover: #1e1f24;
      --st-glass: rgba(20, 20, 24, 0.86);
      --st-glass-strong: rgba(16, 16, 20, 0.94);
      --st-fg: var(--foreground, #d4d4d8);
      --st-fg-strong: #f4f4f6;
      --st-muted: var(--muted-foreground, #8b8e98);
      --st-border: rgba(255, 255, 255, 0.075);
      --st-border-strong: rgba(255, 255, 255, 0.14);
      --st-accent: var(--primary, #2563eb);
      --st-accent-hover: #3b82f6;
      --st-accent-soft: rgba(37, 99, 235, 0.16);
      --st-accent-border: rgba(37, 99, 235, 0.44);
      --st-success: var(--success, #6db875);
      --st-success-soft: rgba(109, 184, 117, 0.14);
      --st-warning: var(--warning, #e8975f);
      --st-error: var(--error, #e05d5d);
      --st-shadow: 0 12px 34px rgba(0, 0, 0, 0.52), 0 1px 0 rgba(255, 255, 255, 0.04) inset;
      --st-modal-shadow: 0 30px 90px rgba(0, 0, 0, 0.78), 0 0 0 1px rgba(255, 255, 255, 0.07);
      font-family: var(--st-font);
      color-scheme: dark;
    }

    .studio-root[data-theme="light"] {
      --st-bg: #f7f8fa;
      --st-sidebar: #eef0f4;
      --st-nav-active: #ffffff;
      --st-nav-hover: rgba(15, 23, 42, 0.05);
      --st-card: #ffffff;
      --st-card-hover: #f2f4f8;
      --st-glass: rgba(255, 255, 255, 0.88);
      --st-glass-strong: rgba(255, 255, 255, 0.96);
      --st-fg: #27272a;
      --st-fg-strong: #09090b;
      --st-muted: #646973;
      --st-border: rgba(15, 23, 42, 0.09);
      --st-border-strong: rgba(15, 23, 42, 0.16);
      --st-accent: #2563eb;
      --st-accent-hover: #1d4ed8;
      --st-accent-soft: rgba(37, 99, 235, 0.11);
      --st-accent-border: rgba(37, 99, 235, 0.40);
      --st-success: #2e7d32;
      --st-success-soft: rgba(46, 125, 50, 0.12);
      --st-shadow: 0 10px 28px rgba(15, 23, 42, 0.15), 0 1px 0 rgba(255, 255, 255, 0.85) inset;
      --st-modal-shadow: 0 28px 76px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.09);
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
    .widget-wrap.is-dragging { transition: none !important; opacity: 0.97; }

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

    @keyframes agyWidgetIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .mini-pill {
      display: inline-flex;
      align-items: center;
      height: 32px;
      gap: 6px;
      padding: 3px 5px 3px 8px;
      border-radius: 999px;
      background: var(--st-glass);
      backdrop-filter: blur(22px) saturate(150%);
      -webkit-backdrop-filter: blur(22px) saturate(150%);
      border: 1px solid var(--st-border-strong);
      box-shadow: var(--st-shadow);
      color: var(--st-fg);
      font-size: 12px;
      line-height: 1;
      max-width: calc(100vw - 24px);
      animation: agyWidgetIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
      width: 292px;
      border-radius: 12px;
      background: var(--st-glass-strong);
      backdrop-filter: blur(22px) saturate(155%);
      -webkit-backdrop-filter: blur(22px) saturate(155%);
      border: 1px solid var(--st-border-strong);
      box-shadow: var(--st-shadow);
      color: var(--st-fg);
      overflow: hidden;
      animation: agyWidgetIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
    @keyframes agyModalIn {
      from { opacity: 0; transform: scale(0.985) translateY(4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes agy-ru-grad-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .modal-shell {
      width: min(920px, calc(100vw - 44px));
      height: min(660px, calc(100vh - 56px));
      border-radius: 12px;
      background: var(--st-bg);
      color: var(--st-fg);
      box-shadow: var(--st-modal-shadow);
      display: flex;
      flex-direction: row;
      overflow: hidden;
      border: 1px solid var(--st-border-strong);
      -webkit-font-smoothing: antialiased;
      animation: agyModalIn 0.16s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Sidebar */
    .modal-sidebar {
      width: 222px;
      flex-shrink: 0;
      background: var(--st-sidebar);
      border-right: 1px solid var(--st-border);
      display: flex;
      flex-direction: column;
      padding: 16px 12px 14px;
    }
    .sidebar-section-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--st-muted);
      padding: 2px 10px 8px;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 4px 10px 10px;
    }
    .brand-title {
      font-size: 13.5px;
      font-weight: 600;
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
      gap: 2px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--st-muted);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: background 0.13s ease, color 0.13s ease;
    }
    .nav-item:hover {
      background: var(--st-nav-hover);
      color: var(--st-fg-strong);
    }
    .nav-item.is-active {
      background: var(--st-nav-active);
      color: var(--st-fg-strong);
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
      font-size: 13px;
      font-weight: 600;
      color: var(--st-fg-strong);
      letter-spacing: -0.005em;
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
      padding: 12px 16px;
      border-bottom: 1px solid var(--st-border);
    }
    .row-item:last-child { border-bottom: none; }
    .row-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .row-title { font-size: 13px; font-weight: 600; color: var(--st-fg-strong); }
    .row-desc { font-size: 11.5px; color: var(--st-muted); }

    /* Antigravity Native Switch */
    .switch {
      position: relative;
      width: 38px;
      height: 21px;
      border-radius: 999px;
      background: rgba(128, 134, 145, 0.34);
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
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.38);
      transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .switch.is-on {
      background: var(--st-accent);
      border-color: var(--st-accent);
    }
    .switch.is-on .switch-thumb { transform: translateX(17px); }

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
      min-height: 205px;
      resize: vertical;
      padding: 12px 14px;
      border-radius: 9px;
      border: 1px solid var(--st-border-strong);
      background: var(--st-sidebar);
      color: var(--st-fg-strong);
      font-family: var(--st-mono);
      font-size: 12.5px;
      line-height: 1.55;
      outline: none;
      transition: border-color 0.14s ease;
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

    /* Visual Studio (Appearance Tab) */
    .studio-preview-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .theme-preset-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .theme-card {
      padding: 9px 10px;
      border-radius: 9px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      color: var(--st-fg);
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 5px;
      transition: border-color 0.14s ease, background 0.14s ease;
    }
    .theme-card:hover { background: var(--st-card-hover); border-color: var(--st-border-strong); }
    .theme-card.is-selected { border-color: var(--st-accent); background: var(--st-accent-soft); }
    .theme-swatch-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .theme-swatch {
      display: inline-flex;
      width: 34px;
      height: 16px;
      border-radius: 5px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.16);
    }
    .wp-mode-tabs {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
    }
    .grad-chips {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 6px;
    }
    .grad-chip {
      height: 30px;
      border-radius: 7px;
      border: 1px solid var(--st-border-strong);
      cursor: pointer;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 2px 4px;
      font-size: 9.5px;
      font-weight: 600;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }
    .grad-chip.is-selected { outline: 2px solid var(--st-accent); outline-offset: 1px; }
    .control-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .control-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .slider-box {
      padding: 9px 11px;
      border-radius: 8px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .slider-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
      color: var(--st-fg);
    }
    .slider-head b { font-weight: 600; color: var(--st-accent); }
    .range-input {
      width: 100%;
      accent-color: var(--st-accent);
      cursor: pointer;
    }
    .color-box {
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11.5px;
    }
    .color-input {
      width: 32px;
      height: 22px;
      border: 1px solid var(--st-border-strong);
      border-radius: 5px;
      padding: 0;
      background: transparent;
      cursor: pointer;
    }
    .select-input {
      width: 100%;
      height: 30px;
      padding: 0 8px;
      border-radius: 7px;
      border: 1px solid var(--st-border-strong);
      background: var(--st-sidebar);
      color: var(--st-fg-strong);
      font-size: 12px;
      outline: none;
    }
    .media-file-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px dashed var(--st-border-strong);
      background: var(--st-sidebar);
      font-size: 12px;
    }
    .profile-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .profile-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 9px;
      border-radius: 999px;
      border: 1px solid var(--st-border-strong);
      background: var(--st-card);
      color: var(--st-fg);
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .profile-chip:hover { background: var(--st-card-hover); border-color: var(--st-accent-border); }

    /* Quota & Export Tab */
    .quota-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--st-card);
      border: 1px solid var(--st-border);
    }
    .quota-fam-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .quota-fam-card {
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .quota-fam-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .quota-bar-row { display: flex; flex-direction: column; gap: 3px; }
    .quota-bar-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--st-muted); }
    .quota-bar-labels b { color: var(--st-fg-strong); }
    .quota-bar-track {
      height: 6px;
      border-radius: 999px;
      background: rgba(128, 134, 145, 0.22);
      overflow: hidden;
    }
    .quota-bar-fill {
      height: 100%;
      border-radius: 999px;
      background: var(--st-accent);
      transition: width 0.2s ease;
    }
    .quota-table-wrap {
      border: 1px solid var(--st-border);
      border-radius: 10px;
      background: var(--st-card);
      overflow: hidden;
    }
    .quota-table-row {
      display: grid;
      grid-template-columns: minmax(120px, 1.5fr) minmax(90px, 1fr) 92px 68px 46px;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--st-border);
      font-size: 11.5px;
    }
    .quota-table-row:last-child { border-bottom: none; }
    .quota-table-row.is-head {
      background: var(--st-sidebar);
      color: var(--st-muted);
      font-weight: 600;
      font-size: 11px;
    }
    .quota-table-row.is-active { background: var(--st-accent-soft); }
    .quota-chat-name {
      font-weight: 600;
      color: var(--st-fg-strong);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .export-checks {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .export-check-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--st-border);
      background: var(--st-card);
      font-size: 12px;
      cursor: pointer;
    }
    .export-check-item input { accent-color: var(--st-accent); cursor: pointer; }
    .export-result-card {
      padding: 11px 13px;
      border-radius: 9px;
      border: 1px solid var(--st-accent-border);
      background: var(--st-accent-soft);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 12px;
    }

    @media (max-width: 720px) {
      .modal-shell { flex-direction: column; height: min(660px, calc(100vh - 24px)); }
      .modal-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--st-border); padding: 10px; }
      .nav-list { flex-direction: row; overflow-x: auto; gap: 4px; }
      .sidebar-foot { display: none; }
      .kpi-grid, .control-grid-2, .quota-fam-grid, .export-checks { grid-template-columns: 1fr; }
      .theme-preset-grid, .control-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grad-chips { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
    : { version: "3.0.0", dictEntries: 4017, dynamicRulesCount: 471 };
  const themeEngine = opts.themeEngine || (typeof createThemeEngine === "function" ? createThemeEngine({ document: doc, window: win }) : null);

  const state = {
    initialized: false,
    mounted: false,
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
      appearance: spCloneAppearance(SP_FALLBACK_APPEARANCE),
      appearanceProfiles: [],
    },
    appearanceDraft: spCloneAppearance(SP_FALLBACK_APPEARANCE),
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
      includeFullLog: false,
    },
    exportBusy: false,
    exportResult: null,
    exportError: "",
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
  let repaintTimer = null;
  let readyTimer = null;
  let settleTimer = null;
  let readyObserver = null;
  let domObserver = null;
  let themeObserver = null;
  let toastTimer = null;
  let keydownHandler = null;
  let resizeHandler = null;
  let dragState = null;
  let lastBodyClickAt = 0;
  let lastDragEndedAt = 0;

  function nowHiRes() {
    try {
      if (win && win.performance && typeof win.performance.now === "function") {
        return win.performance.now();
      }
      if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
      }
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

  function applyThemeToHost(appCfg) {
    if (!themeEngine || typeof themeEngine.apply !== "function") return;
    try {
      themeEngine.apply(appCfg || state.settings.appearance);
    } catch (_e) {}
  }

  function buildAppearancePreviewHtml(appCfg) {
    const cfg = spNormalizeAppearance(appCfg || state.appearanceDraft);
    if (themeEngine && typeof themeEngine.buildPreviewMarkup === "function") {
      return themeEngine.buildPreviewMarkup(cfg, state.locale);
    }
    const preset = spFindThemePreset(cfg.presetId);
    const v = cfg.presetId === "custom" ? { accentColor: cfg.accentColor, canvasBg: cfg.canvasBg, cardBg: cfg.cardBg } : preset.vars;
    const isRu = state.locale !== "en";
    return `<div style="padding:12px;border-radius:10px;background:${escAttr(v.canvasBg)};border:1px solid ${escAttr(v.accentColor)};color:#f1f2f6;font-size:12px">${escHtml(isRu ? preset.nameRu : preset.nameEn)} · ${escHtml(cfg.wallpaper.type)}</div>`;
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
    if (patch.appearance) {
      state.settings.appearance = spCloneAppearance(patch.appearance);
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.appearanceDirty = false;
      applyThemeToHost(state.settings.appearance);
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
      return { isGenerating: false, isThinking: false, thinkingSec: 0, respFloatTok: 0, respTokens: 0, chatTokens: 0, userMsgCount: 0, respCount: 0, lastResp: null, firstUserNorm: "", modelName: "", contextLabel: "" };
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
      const respFloatTok = estimateTokensFloat(visibleRespText);
      const respTokens = respFloatTok > 0 ? Math.max(1, Math.round(respFloatTok)) : 0;
      let thinkingSec = 0;
      if (lastResp && lastResp.textContent) {
        const tm = /(?:Thought|Thinking|Думал|Думает)[^0-9]{0,12}(\d+(?:[.,]\d+)?)\s*(?:s|с)/i.exec(lastResp.textContent);
        if (tm) thinkingSec = parseFloat(tm[1].replace(",", ".")) || 0;
      }
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
      return { isGenerating: false, isThinking: false, thinkingSec: 0, respFloatTok: 0, respTokens: 0, chatTokens: 0, userMsgCount: 0, respCount: 0, lastResp: null, firstUserNorm: "", modelName: "", contextLabel: "" };
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
        tel.prevFloatTok = snap.respFloatTok;
        tel.turnStartFloatTok = snap.respFloatTok;
      }
      state.newChatDraftPersona = null;
    } else {
      state.newChatDraftPersona = null;
      const freshTel = createEmptyTelemetry();
      freshTel.respTokens = snap.respTokens;
      freshTel.chatTokens = snap.chatTokens;
      freshTel.prevFloatTok = snap.respFloatTok;
      freshTel.turnStartFloatTok = snap.respFloatTok;
      freshTel.preTokenAt = nowHiRes();
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
        curTel.lastDurSec = rt.lastDurSec || 0;
        curTel.lastThinkingSec = rt.lastThinkingSec || 0;
        if (!curTel.modelName && rt.modelName) curTel.modelName = rt.modelName;
        if (Array.isArray(rt.samples) && rt.samples.length > 0) curTel.samples = rt.samples.slice(-24);
        if (Array.isArray(rt.history) && rt.history.length > 0) curTel.history = rt.history.slice(0, 8);
      }
      if (res.quotaSummary && typeof res.quotaSummary === "object") {
        state.quotaSummary = res.quotaSummary;
      }
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
        if (state.isOpen && state.activeTab === "export") {
          renderStructure();
        }
      }
    });
  }

  function finalizeTurn(tel, snap, hiNow) {
    const gainedFloat = Math.max(0, snap.respFloatTok - tel.turnStartFloatTok);
    if (gainedFloat >= 1.5) {
      let durMs = 0;
      if (tel.activeStreamMs > 40) {
        const initSlice = tel.preTokenAt > 0 && tel.firstGrowthAt > tel.preTokenAt
          ? Math.min(200, Math.max(60, tel.firstGrowthAt - tel.preTokenAt))
          : 90;
        durMs = tel.activeStreamMs + initSlice;
      } else if (tel.preTokenAt > 0 && tel.lastGrowthAt > tel.preTokenAt) {
        durMs = Math.min(400, Math.max(85, tel.lastGrowthAt - tel.preTokenAt));
      } else {
        durMs = 120;
      }
      const durSec = Math.max(0.08, durMs / 1000);
      const avgTps = Math.min(999, Math.max(1, Math.round(gainedFloat / durSec)));
      tel.lastAvgTps = avgTps;
      tel.lastDurSec = Number(durSec.toFixed(2));
      tel.lastThinkingSec = snap.thinkingSec || (tel.firstGrowthAt > tel.turnStartMs ? Number(((tel.firstGrowthAt - tel.turnStartMs) / 1000).toFixed(2)) : 0);
      tel.peakTps = Math.max(tel.peakTps, avgTps);
      if (state.settings.trackHistory !== false) {
        tel.history.unshift({
          model: tel.modelName || t().modelUnknown,
          tokens: Math.max(1, Math.round(gainedFloat)),
          durSec: tel.lastDurSec,
          avgTps,
          peakTps: tel.peakTps,
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (tel.history.length > 8) tel.history.length = 8;
        if (state.isOpen && state.activeTab === "monitor") {
          updateHistoryDom();
        }
      }
      tel.dirty = true;
      recordTurnQuotaImpact(gainedFloat, snap.chatTokens, tel.modelName || snap.modelName || "");
    }
    tel.currentTps = 0;
    tel.tpsBuckets = [];
    tel.phase = "idle";
    tel.lastGrowthAt = 0;
    tel.firstGrowthAt = 0;
    tel.activeStreamMs = 0;
    tel.preTokenAt = hiNow;
    tel.prevFloatTok = snap.respFloatTok;
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

    if (!sw.switched) {
      const sameConvGrowth = snap.userMsgCount <= tel.prevUserCount + 1;
      const newRespAppeared = Boolean(
        snap.lastResp &&
        tel.activeRespEl &&
        snap.lastResp !== tel.activeRespEl &&
        (snap.respCount !== tel.prevRespCount || snap.respFloatTok + 2 < tel.prevFloatTok)
      );
      if (newRespAppeared) {
        if (tel.wasGenerating) {
          finalizeTurn(tel, Object.assign({}, snap, { respFloatTok: tel.prevFloatTok }), hiNow);
          if (tel.dirty && state.activeChatKey !== "__new__") {
            flushChatTelemetry(state.activeChatKey, state.activeChatTitle, tel);
          }
        }
        tel.activeRespEl = snap.lastResp;
        tel.turnStartFloatTok = 0;
        tel.prevFloatTok = 0;
        tel.firstGrowthAt = 0;
        tel.lastGrowthAt = 0;
        tel.preTokenAt = hiNow;
        tel.activeStreamMs = 0;
        tel.turnStartMs = hiNow;
        tel.tpsBuckets = [];
        tel.currentTps = 0;
      } else if (snap.lastResp) {
        tel.activeRespEl = snap.lastResp;
      }

      const rawDeltaFloat = snap.respFloatTok - tel.prevFloatTok;
      const deltaFloat = sameConvGrowth && rawDeltaFloat > 0 ? rawDeltaFloat : 0;
      let seedMs = 120;

      if (deltaFloat > 0) {
        if (!tel.firstGrowthAt) {
          tel.firstGrowthAt = hiNow;
          tel.activeStreamMs = 0;
          seedMs = tel.preTokenAt > 0 ? Math.min(260, Math.max(40, hiNow - tel.preTokenAt)) : 120;
        } else if (tel.lastGrowthAt > 0) {
          const gap = hiNow - tel.lastGrowthAt;
          if (gap > 0 && gap <= 650) {
            tel.activeStreamMs += gap;
          }
        }
        tel.lastGrowthAt = hiNow;
      } else if (!tel.firstGrowthAt) {
        tel.preTokenAt = hiNow;
      }

      const idleSinceGrowth = tel.lastGrowthAt > 0 ? (hiNow - tel.lastGrowthAt) : Infinity;
      const graceMs = snap.isGenerating ? 900 : 240;
      const recentlyGrew = tel.lastGrowthAt > 0 && idleSinceGrowth <= graceMs;
      const effectiveGenerating = Boolean(snap.isGenerating || recentlyGrew);

      if (effectiveGenerating && !tel.wasGenerating) {
        tel.turnStartMs = hiNow;
        tel.turnStartFloatTok = newRespAppeared ? 0 : tel.prevFloatTok;
        tel.tpsBuckets = [];
        tel.peakTps = 0;
        tel.currentTps = 0;
      }

      if (effectiveGenerating) {
        if (deltaFloat > 0) {
          tel.tpsBuckets.push({ t: hiNow, d: deltaFloat });
          tel.tpsBuckets = tel.tpsBuckets.filter((b) => hiNow - b.t <= 1400);
          let sumD = 0;
          for (let i = 0; i < tel.tpsBuckets.length; i += 1) sumD += tel.tpsBuckets[i].d;
          const winSpanMs = tel.tpsBuckets.length >= 2 ? (hiNow - tel.tpsBuckets[0].t) : 0;
          const rawTps = winSpanMs >= 60
            ? (sumD / Math.max(0.08, winSpanMs / 1000))
            : (deltaFloat / Math.max(0.08, seedMs / 1000));
          const clampedRaw = Math.min(999, Math.max(0, rawTps));
          const smoothed = tel.currentTps > 0
            ? Math.round(tel.currentTps * 0.30 + clampedRaw * 0.70)
            : Math.round(clampedRaw);
          tel.currentTps = Math.min(999, Math.max(0, smoothed));
          const gainedFloat = Math.max(0, snap.respFloatTok - tel.turnStartFloatTok);
          if (gainedFloat >= 1.5 && tel.currentTps > tel.peakTps) {
            tel.peakTps = tel.currentTps;
          }
          if (tel.currentTps > 0) {
            tel.samples.push(tel.currentTps);
            if (tel.samples.length > 24) tel.samples.shift();
          }
          tel.dirty = true;
        }
        tel.phase = (tel.firstGrowthAt && idleSinceGrowth <= 650) ? "streaming" : "thinking";
        tel.prevFloatTok = snap.respFloatTok;
      } else if (tel.wasGenerating) {
        finalizeTurn(tel, snap, hiNow);
        if (tel.dirty && state.activeChatKey !== "__new__") {
          flushChatTelemetry(state.activeChatKey, state.activeChatTitle, tel);
        }
      } else {
        tel.phase = "idle";
        tel.prevFloatTok = snap.respFloatTok;
      }

      tel.isGenerating = effectiveGenerating;
      tel.wasGenerating = effectiveGenerating;
    } else if (sw.promoted && (snap.isGenerating || snap.respFloatTok > tel.prevFloatTok)) {
      const gained = Math.max(0, snap.respFloatTok - tel.prevFloatTok);
      if (gained > 0) {
        const seedMs = tel.preTokenAt > 0 ? Math.min(260, Math.max(40, hiNow - tel.preTokenAt)) : 120;
        tel.lastGrowthAt = hiNow;
        if (!tel.firstGrowthAt) tel.firstGrowthAt = hiNow;
        if (!tel.turnStartMs) tel.turnStartMs = hiNow;
        tel.tpsBuckets.push({ t: hiNow, d: gained });
        const rawTps = Math.min(999, Math.round(gained / Math.max(0.08, seedMs / 1000)));
        tel.currentTps = rawTps;
        if (snap.respFloatTok >= 1.5) tel.peakTps = Math.max(tel.peakTps, rawTps);
        if (rawTps > 0) {
          tel.samples.push(rawTps);
          if (tel.samples.length > 24) tel.samples.shift();
        }
        tel.dirty = true;
      } else {
        tel.preTokenAt = hiNow;
        if (!tel.turnStartMs) tel.turnStartMs = hiNow;
      }
      tel.prevFloatTok = snap.respFloatTok;
      tel.isGenerating = Boolean(snap.isGenerating || gained > 0);
      tel.wasGenerating = tel.isGenerating;
      tel.phase = tel.isGenerating ? (tel.firstGrowthAt ? "streaming" : "thinking") : "idle";
    }

    tel.prevRespCount = snap.respCount;
    tel.prevUserCount = snap.userMsgCount;
    tel.respTokens = snap.respTokens;
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
    }, 75);
  }

  function scrapeDomQuotaSnapshot(force) {
    if (!doc || !doc.body) return;
    const now = Date.now();
    if (!force && now - state.lastQuotaScrapeAt < 2500) return;
    state.lastQuotaScrapeAt = now;
    try {
      const txt = doc.body.innerText || doc.body.textContent || "";
      if (!txt || txt.length < 30) return;
      const parsed = parseQuotaFromDocumentText(txt);
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
          if (state.isOpen && (state.activeTab === "export" || state.activeTab === "monitor")) {
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
        const text = isUser ? (el.textContent || "").trim() : extractVisibleText(el).trim();
        if (text) {
          out.push({ role: isUser ? "user" : "agent", text });
        }
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
    if (mf.quota) {
      const qd = getActiveChatQuotaDisplay();
      chips.push(`<span class="metric-chip is-muted num" data-live="quotaMini">${escHtml(qd.miniText)}</span>`);
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
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:10.5px;color:var(--st-muted);padding:0 2px">
            <span>${escHtml(tr.quotaSectionTitle)}</span>
            <span class="num" style="color:var(--st-fg)" data-live="quotaMed">${escHtml(getActiveChatQuotaDisplay().miniText)}</span>
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

      <div class="quota-strip">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="row-title" style="font-size:12px">${escHtml(tr.quotaSectionTitle)}:</span>
          <span class="status-pill num" data-live="quotaMed">${escHtml(getActiveChatQuotaDisplay().miniText)}</span>
        </div>
        <button type="button" class="btn btn-sm" data-action="switch-tab" data-tab="export">${escHtml(tr.quotaOpenLimitsLink)}</button>
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
    return list.map((item) => {
      const durPart = item.durSec ? ` · ${item.durSec}${escHtml(tr.secUnit)}` : "";
      return `
      <div class="history-row">
        <span class="history-model">${escHtml(item.model)}</span>
        <span class="history-meta num">${escHtml(item.at)}${durPart} · ~${formatCompact(item.tokens)} ${escHtml(tr.tokShort)}</span>
        <span class="history-tps num">${item.avgTps} TPS (${escHtml(tr.peakLabel)} ${item.peakTps})</span>
      </div>
    `;
    }).join("");
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
      { key: "quota", title: tr.fieldQuota, desc: tr.fieldQuotaDesc },
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
    const estTok = estimateTokens(state.draftPersonaText);
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
        <div class="editor-meta-row">
          <span class="section-label">${escHtml(tr.personaEditorLabel)}</span>
          <span class="num" data-role="byteCounter" style="color:${overWarn ? "var(--st-warning)" : "var(--st-muted)"}">${bytes.toLocaleString()} / ${MAX_PERSONA_BODY_BYTES.toLocaleString()} ${escHtml(tr.personaBytes)} · ~${estTok.toLocaleString()} ${escHtml(tr.tokShort)}${overWarn ? " · " + escHtml(tr.personaLimitWarn) : ""}</span>
        </div>
        <textarea class="editor-box" data-role="personaEditor" spellcheck="false" placeholder="${escAttr(tr.personaEditorPlaceholder)}">${escHtml(state.draftPersonaText)}</textarea>
      </div>

      <div class="action-bar">
        <div class="action-btns">
          <button type="button" class="btn btn-primary" data-action="save-persona">${iconSvg("check", 14)}${escHtml(tr.personaApplyBtn)}</button>
          <button type="button" class="btn" data-action="clear-persona">${escHtml(tr.personaClearBtn)}</button>
        </div>
        <span class="toast-text${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.personaPresetsLabel)}</span>
        ${customs.length > 0 ? `
        <div class="preset-strip">
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
        ` : ""}
        <div class="preset-add-row">
          <input type="text" class="text-input" data-role="newPresetInput" maxlength="44" value="${escAttr(state.newPresetName)}" placeholder="${escAttr(tr.personaSavePresetPlaceholder)}"/>
          <button type="button" class="btn btn-sm" data-action="save-custom-preset">${iconSvg("plus", 13)}${escHtml(tr.personaAddPresetBtn)}</button>
        </div>
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
    const ver = pluginMeta.version || "3.0.0";
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
    const isRu = state.locale !== "en";
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const presets = spGetThemePresets();
    const grads = spGetGradientPresets();
    const fonts = spGetFontPresets();
    const wp = draft.wallpaper;
    const ty = draft.typography;
    const profiles = state.settings.appearanceProfiles || [];

    const wpModes = [
      { id: "none", label: tr.appWpNone },
      { id: "gradient", label: tr.appWpGradient },
      { id: "image", label: tr.appWpImage },
      { id: "video", label: tr.appWpVideo },
    ];
    const densities = [
      { id: "compact", label: tr.appDensityCompact },
      { id: "comfortable", label: tr.appDensityComfort },
      { id: "spacious", label: tr.appDensitySpacious },
    ];

    let wpDetailsHtml = "";
    if (wp.type === "gradient") {
      wpDetailsHtml = `
        <div class="grad-chips">
          ${grads.map((g) => `
            <button type="button" class="grad-chip${wp.gradientPreset === g.id ? " is-selected" : ""}" data-action="select-gradient-preset" data-id="${escAttr(g.id)}" style="background:linear-gradient(${g.angle}deg, ${escAttr(g.colors[0])}, ${escAttr(g.colors[1])}, ${escAttr(g.colors[2])})">${escHtml(isRu ? g.nameRu : g.nameEn)}</button>
          `).join("")}
        </div>
        <div class="control-grid-3">
          <div class="color-box"><span>Color 1</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor0" value="${escAttr(wp.gradColors[0])}"/></div>
          <div class="color-box"><span>Color 2</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor1" value="${escAttr(wp.gradColors[1])}"/></div>
          <div class="color-box"><span>Color 3</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor2" value="${escAttr(wp.gradColors[2])}"/></div>
        </div>
        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpAngle)}</span><b class="num" data-live-app-val="wallpaper.gradAngle">${wp.gradAngle}deg</b></div>
            <input type="range" class="range-input" min="0" max="360" step="5" data-app-field="wallpaper.gradAngle" value="${wp.gradAngle}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpSpeed)}</span><b class="num" data-live-app-val="wallpaper.gradSpeed">${wp.gradSpeed}s</b></div>
            <input type="range" class="range-input" min="6" max="40" step="1" data-app-field="wallpaper.gradSpeed" value="${wp.gradSpeed}"/>
          </div>
        </div>
        <div class="card">
          <div class="row-item">
            <span class="row-title">${escHtml(tr.appWpAnimated)}</span>
            <button type="button" class="switch${wp.gradAnimated ? " is-on" : ""}" role="switch" aria-checked="${wp.gradAnimated ? "true" : "false"}" data-action="toggle-wallpaper-animated"><span class="switch-thumb"></span></button>
          </div>
        </div>
      `;
    } else if (wp.type === "image" || wp.type === "video") {
      const isVid = wp.type === "video";
      wpDetailsHtml = `
        <div class="media-file-bar">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
            <button type="button" class="btn btn-sm btn-primary" data-action="pick-media" data-kind="${isVid ? "video" : "image"}">${iconSvg("upload", 13)}${escHtml(isVid ? tr.appWpPickVideo : tr.appWpPickImage)}</button>
            <span style="font-size:11.5px;color:${wp.mediaFile ? "var(--st-fg-strong)" : "var(--st-muted)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(wp.mediaFile || tr.appWpNoFileHint)}</span>
          </div>
          ${wp.mediaUrl ? `<button type="button" class="btn btn-sm" data-action="clear-wallpaper-media">${escHtml(tr.appWpClearMedia)}</button>` : ""}
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

    const wpSlidersHtml = wp.type !== "none" ? `
      <div class="control-grid-2">
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appWpDim)}</span><b class="num" data-live-app-val="wallpaper.dim">${wp.dim}%</b></div>
          <input type="range" class="range-input" min="0" max="85" step="1" data-app-field="wallpaper.dim" value="${wp.dim}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appWpBlur)}</span><b class="num" data-live-app-val="wallpaper.blur">${wp.blur}px</b></div>
          <input type="range" class="range-input" min="0" max="24" step="1" data-app-field="wallpaper.blur" value="${wp.blur}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appWpOpacity)}</span><b class="num" data-live-app-val="wallpaper.opacity">${wp.opacity}%</b></div>
          <input type="range" class="range-input" min="15" max="100" step="1" data-app-field="wallpaper.opacity" value="${wp.opacity}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appWpScale)}</span><b class="num" data-live-app-val="wallpaper.scale">${wp.scale}%</b></div>
          <input type="range" class="range-input" min="100" max="130" step="1" data-app-field="wallpaper.scale" value="${wp.scale}"/>
        </div>
      </div>
    ` : "";

    return `
      <div class="section-group">
        <div class="studio-preview-head">
          <span class="section-label">${escHtml(tr.appPreviewTitle)}</span>
          <label style="display:inline-flex;align-items:center;gap:8px;font-size:11.5px;color:var(--st-muted);cursor:pointer">
            <span>${escHtml(tr.appLivePreviewToggle)}</span>
            <button type="button" class="switch${state.appearanceLivePreview ? " is-on" : ""}" role="switch" aria-checked="${state.appearanceLivePreview ? "true" : "false"}" data-action="toggle-appearance-live-preview"><span class="switch-thumb"></span></button>
          </label>
        </div>
        <div data-live="appearancePreview">${buildAppearancePreviewHtml(draft)}</div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appThemesTitle)}</span>
        <div class="theme-preset-grid">
          ${presets.map((pr) => {
            const sel = draft.presetId === pr.id;
            const sw = pr.vars;
            return `
              <button type="button" class="theme-card${sel ? " is-selected" : ""}" data-action="select-theme-preset" data-id="${escAttr(pr.id)}">
                <div class="theme-swatch-row">
                  <span class="row-title" style="font-size:12px">${escHtml(isRu ? pr.nameRu : pr.nameEn)}</span>
                  <span class="theme-swatch">
                    <span style="flex:1;background:${escAttr(sw.canvasBg)}"></span>
                    <span style="flex:1;background:${escAttr(sw.cardBg)}"></span>
                    <span style="flex:1;background:${escAttr(sw.accentColor)}"></span>
                  </span>
                </div>
                <span class="choice-desc">${escHtml(isRu ? pr.descRu : pr.descEn)}</span>
              </button>
            `;
          }).join("")}
        </div>
        <div class="card">
          <div class="row-item">
            <span class="row-title">${escHtml(tr.appPolishLabel)}</span>
            <button type="button" class="switch${draft.uiPolish ? " is-on" : ""}" role="switch" aria-checked="${draft.uiPolish ? "true" : "false"}" data-action="toggle-appearance-polish"><span class="switch-thumb"></span></button>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appCustomColorsTitle)}</span>
        <div class="control-grid-3">
          <div class="color-box"><span>${escHtml(tr.appAccentColor)}</span><input type="color" class="color-input" data-app-field="accentColor" value="${escAttr(draft.accentColor)}"/></div>
          <div class="color-box"><span>${escHtml(tr.appCanvasColor)}</span><input type="color" class="color-input" data-app-field="canvasBg" value="${escAttr(draft.canvasBg)}"/></div>
          <div class="color-box"><span>${escHtml(tr.appCardColor)}</span><input type="color" class="color-input" data-app-field="cardBg" value="${escAttr(draft.cardBg)}"/></div>
        </div>
        <div class="control-grid-3">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appGlassOpacity)}</span><b class="num" data-live-app-val="glassOpacity">${draft.glassOpacity}%</b></div>
            <input type="range" class="range-input" min="25" max="100" step="1" data-app-field="glassOpacity" value="${draft.glassOpacity}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appGlassBlur)}</span><b class="num" data-live-app-val="glassBlur">${draft.glassBlur}px</b></div>
            <input type="range" class="range-input" min="0" max="24" step="1" data-app-field="glassBlur" value="${draft.glassBlur}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appRadius)}</span><b class="num" data-live-app-val="radius">${draft.radius}px</b></div>
            <input type="range" class="range-input" min="4" max="20" step="1" data-app-field="radius" value="${draft.radius}"/>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appWallpaperTitle)}</span>
        <div class="wp-mode-tabs">
          ${wpModes.map((m) => `
            <button type="button" class="dock-btn${wp.type === m.id ? " is-selected" : ""}" data-action="set-wallpaper-type" data-val="${m.id}">${escHtml(m.label)}</button>
          `).join("")}
        </div>
        ${wpDetailsHtml}
        ${wpSlidersHtml}
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appTypoTitle)}</span>
        <div class="control-grid-2">
          <div class="slider-box">
            <span class="slider-head"><span>${escHtml(tr.appUiFont)}</span></span>
            <select class="select-input" data-app-field="typography.uiFont">
              ${fonts.ui.map((f) => `<option value="${escAttr(f.id)}"${ty.uiFont === f.id ? " selected" : ""}>${escHtml(isRu ? f.label : f.labelEn)}</option>`).join("")}
            </select>
          </div>
          <div class="slider-box">
            <span class="slider-head"><span>${escHtml(tr.appMonoFont)}</span></span>
            <select class="select-input" data-app-field="typography.monoFont">
              ${fonts.mono.map((f) => `<option value="${escAttr(f.id)}"${ty.monoFont === f.id ? " selected" : ""}>${escHtml(isRu ? f.label : f.labelEn)}</option>`).join("")}
            </select>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appFontSize)}</span><b class="num" data-live-app-val="typography.fontSize">${ty.fontSize}px</b></div>
            <input type="range" class="range-input" min="12" max="18" step="1" data-app-field="typography.fontSize" value="${ty.fontSize}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appLineHeight)}</span><b class="num" data-live-app-val="typography.lineHeight">${ty.lineHeight}</b></div>
            <input type="range" class="range-input" min="1.25" max="1.85" step="0.05" data-app-field="typography.lineHeight" value="${ty.lineHeight}"/>
          </div>
        </div>
        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appChatWidth)}</span><b class="num" data-live-app-val="typography.chatMaxWidth">${ty.chatMaxWidth >= 680 ? ty.chatMaxWidth + "px" : tr.appChatWidthAuto}</b></div>
            <input type="range" class="range-input" min="640" max="1200" step="40" data-app-field="typography.chatMaxWidth" value="${ty.chatMaxWidth >= 680 ? ty.chatMaxWidth : 640}"/>
          </div>
          <div class="slider-box">
            <span class="slider-head"><span>${escHtml(tr.appDensity)}</span></span>
            <div class="control-grid-3">
              ${densities.map((d) => `
                <button type="button" class="dock-btn${ty.density === d.id ? " is-selected" : ""}" style="padding:5px 4px;font-size:11px" data-action="set-density" data-val="${d.id}">${escHtml(d.label)}</button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.appProfilesTitle)}</span>
        ${profiles.length > 0 ? `
          <div class="profile-strip">
            ${profiles.map((prof) => `
              <div class="profile-chip" data-action="apply-appearance-profile" data-id="${escAttr(prof.id)}">
                <span>${escHtml(prof.name)}</span>
                <button type="button" class="preset-del-btn" data-action="delete-appearance-profile" data-id="${escAttr(prof.id)}" title="Delete">${iconSvg("trash", 11)}</button>
              </div>
            `).join("")}
          </div>
        ` : ""}
        <div class="preset-add-row">
          <input type="text" class="text-input" data-role="newProfileInput" maxlength="44" value="${escAttr(state.newProfileName)}" placeholder="${escAttr(tr.appProfilePlaceholder)}"/>
          <button type="button" class="btn btn-sm" data-action="save-appearance-profile">${iconSvg("plus", 13)}${escHtml(tr.appSaveProfile)}</button>
        </div>
      </div>

      <div class="action-bar">
        <div class="action-btns" style="flex-wrap:wrap">
          <button type="button" class="btn btn-primary" data-action="apply-appearance">${iconSvg("check", 14)}${escHtml(tr.appApplyBtn)}</button>
          <button type="button" class="btn" data-action="discard-appearance">${escHtml(tr.appCancelBtn)}</button>
          <button type="button" class="btn" data-action="reset-appearance">${iconSvg("reset", 13)}${escHtml(tr.appResetBtn)}</button>
        </div>
        <span class="toast-text${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>
      </div>
    `;
  }

  function renderExportAndLimitsTab() {
    const tr = t();
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
      const rem5Pct = rem5 !== null ? rem5 : 100;
      const remWPct = remW !== null ? remW : 100;
      return `
        <div class="quota-fam-card">
          <div class="quota-fam-head">
            <span class="row-title" style="font-size:12.5px">${escHtml(title)}</span>
            <span class="${famData.calibrated ? "badge-active" : "nav-badge"}">${escHtml(badge)}</span>
          </div>
          <div class="quota-bar-row">
            <div class="quota-bar-labels">
              <span>${escHtml(tr.quota5hShort)} ${escHtml(tr.quotaRemShort)} ${famData.fiveHourReset ? "(" + escHtml(famData.fiveHourReset) + ")" : ""}</span>
              <b class="num">${rem5 !== null ? rem5 + "%" : tr.quotaNoData}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${rem5 !== null ? rem5Pct : 0}%"></div></div>
          </div>
          <div class="quota-bar-row">
            <div class="quota-bar-labels">
              <span>${escHtml(tr.quotaWeekShort)} ${escHtml(tr.quotaRemShort)} ${famData.weeklyReset ? "(" + escHtml(famData.weeklyReset) + ")" : ""}</span>
              <b class="num">${remW !== null ? remW + "%" : tr.quotaNoData}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${remW !== null ? remWPct : 0}%;background:var(--st-success)"></div></div>
          </div>
        </div>
      `;
    };

    const optSpecs = [
      { key: "includeAttachments", label: tr.exportOptAttachments },
      { key: "includeArtifacts", label: tr.exportOptArtifacts },
      { key: "includePersona", label: tr.exportOptPersona },
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
            <button type="button" class="btn btn-primary" ${state.exportBusy ? "disabled" : ""} data-action="export-chat-zip" data-choose="0">${iconSvg("download", 14)}${escHtml(state.exportBusy ? tr.exportBusy : tr.exportBtnDownloads)}</button>
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
            <button type="button" class="btn btn-sm" data-action="reveal-export-file" data-path="${escAttr(er.zipPath)}">${iconSvg("folder", 13)}${escHtml(tr.exportRevealBtn)}</button>
          </div>
        ` : ""}
      </div>

      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <span class="section-label">${escHtml(tr.quotaTableTitle)}</span>
          <button type="button" class="btn btn-sm" data-action="reset-quota-stats">${iconSvg("reset", 12)}${escHtml(tr.quotaResetBtn)}</button>
        </div>
        <div class="quota-fam-grid">
          ${renderFamCard("Gemini Models", gem)}
          ${renderFamCard("Claude & GPT Models", cla)}
        </div>
        <span class="row-desc">${escHtml(tr.quotaCalibrateTip)}</span>
        <div class="quota-table-wrap">
          ${rows.length === 0 ? `<div class="card-pad" style="font-size:12px;color:var(--st-muted)">${escHtml(tr.quotaTableEmpty)}</div>` : `
            <div class="quota-table-row is-head">
              <span>${escHtml(tr.quotaColChat)}</span>
              <span>${escHtml(tr.quotaColModel)}</span>
              <span>${escHtml(tr.quotaCol5h)}</span>
              <span>${escHtml(tr.quotaColWeek)}</span>
              <span>${escHtml(tr.quotaColTurns)}</span>
            </div>
            ${rows.map((r) => {
              const isCur = r.chatKey === state.activeChatKey;
              return `
                <div class="quota-table-row${isCur ? " is-active" : ""}">
                  <span class="quota-chat-name" title="${escAttr(r.title)}">${escHtml(r.title)}</span>
                  <span class="quota-chat-name" style="font-weight:400;color:var(--st-muted)" title="${escAttr(r.modelName)}">${escHtml(r.modelName || r.primaryFamily)}</span>
                  <span class="num">${escHtml(formatQuotaPct(r.fiveHourWindowPct))} / ${escHtml(formatQuotaPct(r.fiveHourPct))}</span>
                  <span class="num">${escHtml(formatQuotaPct(r.weeklyPct))}</span>
                  <span class="num">${r.turns || 0}</span>
                </div>
              `;
            }).join("")}
          `}
        </div>
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
      { id: "appearance", label: tr.navAppearance, ic: "palette", title: tr.modalTitleAppearance, sub: tr.modalSubAppearance },
      { id: "export", label: tr.navExport, ic: "archive", title: tr.modalTitleExport, sub: tr.modalSubExport },
      { id: "language", label: tr.navLanguage, ic: "globe", title: tr.modalTitleLanguage, sub: tr.modalSubLanguage },
    ];
    const current = tabs.find((x) => x.id === state.activeTab) || tabs[0];
    let bodyHtml = "";
    if (current.id === "monitor") bodyHtml = renderMonitorTab();
    else if (current.id === "widget") bodyHtml = renderWidgetTab();
    else if (current.id === "persona") bodyHtml = renderPersonaTab();
    else if (current.id === "appearance") bodyHtml = renderAppearanceTab();
    else if (current.id === "export") bodyHtml = renderExportAndLimitsTab();
    else bodyHtml = renderLanguageTab();

    return `
      <div class="modal-backdrop" data-action="backdrop-close">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${escAttr(tr.brandTitle)}">
          <aside class="modal-sidebar">
            <div class="sidebar-brand">
              <span class="brand-title">${escHtml(tr.brandTitle)}</span>
              <span class="brand-ver num">v${escHtml(pluginMeta.version || "3.0.0")}</span>
            </div>
            <span class="sidebar-section-label">${escHtml(tr.sidebarSectionStudio)}</span>
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
      const qMini = getActiveChatQuotaDisplay();
      setLiveSlot(widgetMountEl, '[data-live="quotaMini"]', qMini.miniText, false);
      setLiveSlot(widgetMountEl, '[data-live="quotaMed"]', qMini.miniText, false);
    }

    if (modalMountEl && state.isOpen) {
      setLiveSlot(modalMountEl, '[data-live="resp"]', respText, false);
      setLiveSlot(modalMountEl, '[data-live="chat"]', fullChatText, false);
      setLiveSlot(modalMountEl, '[data-live="model"]', modelText, false);
      setLiveSlot(modalMountEl, '[data-live="sparkModal"]', buildSparklineMarkup(tel.samples, 520, 92, "modal"), true);
      setLiveSlot(modalMountEl, '[data-live="quotaMed"]', getActiveChatQuotaDisplay().miniText, false);
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
      if (tab === "appearance" && !state.appearanceDirty) {
        state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      }
      if (tab === "export") {
        invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__" }).then((qs) => {
          if (!state.destroyed && qs) {
            state.quotaSummary = qs;
            if (state.isOpen && state.activeTab === "export") renderStructure();
          }
        });
      }
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
      return;
    }
    if (action === "toggle-appearance-live-preview") {
      state.appearanceLivePreview = !state.appearanceLivePreview;
      applyThemeToHost(state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance);
      renderStructure();
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
      state.appearanceDirty = true;
      if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "toggle-appearance-polish") {
      state.appearanceDraft.uiPolish = !state.appearanceDraft.uiPolish;
      state.appearanceDirty = true;
      if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "set-wallpaper-type") {
      const val = actionEl.getAttribute("data-val");
      state.appearanceDraft.wallpaper.type = val === "gradient" || val === "image" || val === "video" ? val : "none";
      state.appearanceDirty = true;
      if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "select-gradient-preset") {
      const gid = actionEl.getAttribute("data-id");
      const grads = spGetGradientPresets();
      let found = grads[0];
      for (let i = 0; i < grads.length; i += 1) {
        if (grads[i].id === gid) { found = grads[i]; break; }
      }
      state.appearanceDraft.wallpaper.type = "gradient";
      state.appearanceDraft.wallpaper.gradientPreset = found.id;
      state.appearanceDraft.wallpaper.gradColors = found.colors.slice(0, 3);
      state.appearanceDraft.wallpaper.gradAngle = found.angle;
      state.appearanceDirty = true;
      if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "toggle-wallpaper-animated") {
      state.appearanceDraft.wallpaper.gradAnimated = !state.appearanceDraft.wallpaper.gradAnimated;
      state.appearanceDirty = true;
      if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "toggle-wallpaper-autopause") {
      state.appearanceDraft.wallpaper.pauseWhenHidden = !state.appearanceDraft.wallpaper.pauseWhenHidden;
      state.appearanceDirty = true;
      if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "pick-media") {
      const kind = actionEl.getAttribute("data-kind") === "video" ? "video" : "image";
      invokeIpc("agy-studio:pick-media", { kind }).then((res) => {
        if (state.destroyed) return;
        if (res && res.ok && res.mediaUrl) {
          state.appearanceDraft.wallpaper.type = kind;
          state.appearanceDraft.wallpaper.mediaFile = res.fileName || "";
          state.appearanceDraft.wallpaper.mediaUrl = res.mediaUrl;
          state.appearanceDraft.wallpaper.mediaMime = res.mime || "";
          state.appearanceDirty = true;
          if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
          setToast(tr.appMediaPickedMsg, false);
          renderStructure();
        } else if (res && !res.canceled) {
          setToast(tr.appMediaErrMsg + (res.error ? ` (${res.error})` : ""), true);
        }
      });
      return;
    }
    if (action === "clear-wallpaper-media") {
      state.appearanceDraft.wallpaper.mediaFile = "";
      state.appearanceDraft.wallpaper.mediaUrl = "";
      state.appearanceDraft.wallpaper.mediaMime = "";
      state.appearanceDraft.wallpaper.type = "none";
      state.appearanceDirty = true;
      if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "set-density") {
      const d = actionEl.getAttribute("data-val");
      state.appearanceDraft.typography.density = d === "compact" || d === "spacious" ? d : "comfortable";
      state.appearanceDirty = true;
      if (state.appearanceLivePreview) applyThemeToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "apply-appearance-profile") {
      if (targetEl.closest && targetEl.closest('[data-action="delete-appearance-profile"]')) return;
      const pid = actionEl.getAttribute("data-id");
      const profs = state.settings.appearanceProfiles || [];
      for (let i = 0; i < profs.length; i += 1) {
        if (profs[i].id === pid && profs[i].appearance) {
          state.appearanceDraft = spCloneAppearance(profs[i].appearance);
          state.appearanceDirty = false;
          saveSettingsPatch({ appearance: spCloneAppearance(profs[i].appearance) });
          setToast(tr.appAppliedMsg, false);
          return;
        }
      }
      return;
    }
    if (action === "delete-appearance-profile") {
      const pid = actionEl.getAttribute("data-id");
      const next = (state.settings.appearanceProfiles || []).filter((p) => p.id !== pid);
      saveSettingsPatch({ appearanceProfiles: next });
      setToast(tr.appProfileDeletedMsg, false);
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
      setToast(tr.appProfileSavedMsg, false);
      return;
    }
    if (action === "apply-appearance") {
      const toSave = spCloneAppearance(state.appearanceDraft);
      state.appearanceDirty = false;
      saveSettingsPatch({ appearance: toSave });
      setToast(tr.appAppliedMsg, false);
      return;
    }
    if (action === "discard-appearance") {
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.appearanceDirty = false;
      applyThemeToHost(state.settings.appearance);
      renderStructure();
      return;
    }
    if (action === "reset-appearance") {
      const def = spCloneAppearance(SP_FALLBACK_APPEARANCE);
      state.appearanceDraft = spCloneAppearance(def);
      state.appearanceDirty = false;
      state.appearanceLivePreview = false;
      saveSettingsPatch({ appearance: def });
      setToast(tr.appResetMsg, false);
      return;
    }
    if (action === "toggle-export-opt") {
      const key = actionEl.getAttribute("data-key");
      if (key && key in state.exportOpts) {
        state.exportOpts[key] = !state.exportOpts[key];
      }
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
        setToast(tr.quotaResetDone, false);
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

    if (field === "accentColor" || field === "canvasBg" || field === "cardBg") {
      draft[field] = String(rawVal || "#09090b").toLowerCase();
      draft.presetId = "custom";
    } else if (field === "glassOpacity" || field === "glassBlur" || field === "radius") {
      const n = Math.round(Number(rawVal) || 0);
      draft[field] = n;
      if (draft.presetId === "native") draft.presetId = "custom";
      labelText = field === "glassOpacity" ? `${n}%` : `${n}px`;
    } else if (field === "wallpaper.gradColor0" || field === "wallpaper.gradColor1" || field === "wallpaper.gradColor2") {
      const idx = parseInt(field.slice(-1), 10);
      draft.wallpaper.type = "gradient";
      draft.wallpaper.gradColors[idx] = String(rawVal || "#0f172a").toLowerCase();
    } else if (field === "wallpaper.gradAngle") {
      const n = Math.round(Number(rawVal) || 0);
      draft.wallpaper.gradAngle = n;
      labelText = `${n}deg`;
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

    state.appearanceDirty = true;
    if (labelText !== null && modalMountEl) {
      setLiveSlot(modalMountEl, `[data-live-app-val="${field}"]`, labelText, false);
    }
    if (modalMountEl) {
      setLiveSlot(modalMountEl, '[data-live="appearancePreview"]', buildAppearancePreviewHtml(draft), true);
    }
    if (state.appearanceLivePreview) {
      applyThemeToHost(draft);
    }
    return true;
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
      if (handleAppearanceFieldInput(target)) return;
      const role = target.getAttribute("data-role");
      if (role === "personaEditor") {
        state.draftPersonaText = target.value || "";
        state.draftDirty = true;
        const counter = modalMountEl ? modalMountEl.querySelector('[data-role="byteCounter"]') : null;
        if (counter) {
          const bytes = utf8ByteLength(state.draftPersonaText);
          const estTok = estimateTokens(state.draftPersonaText);
          const warn = bytes >= 20000;
          const tr = t();
          counter.textContent = `${bytes.toLocaleString()} / ${MAX_PERSONA_BODY_BYTES.toLocaleString()} ${tr.personaBytes} · ~${estTok.toLocaleString()} ${tr.tokShort}${warn ? " · " + tr.personaLimitWarn : ""}`;
          counter.style.color = warn ? "var(--st-warning)" : "var(--st-muted)";
        }
      } else if (role === "newPresetInput") {
        state.newPresetName = target.value || "";
      } else if (role === "newProfileInput") {
        state.newProfileName = target.value || "";
      }
    });
    rootEl.addEventListener("change", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.getAttribute !== "function") return;
      if (target.tagName === "SELECT" && target.getAttribute("data-app-field")) {
        handleAppearanceFieldInput(target);
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

  function mountStudioUi() {
    if (state.mounted || state.destroyed || !doc) return;
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
    state.mounted = true;
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
          sampleStreamTick();
          scheduleRepaint();
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
          if (isAntigravityUiReady()) {
            scheduleMountAfterSettle();
          }
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
        if (Date.now() - startAt >= 10000) {
          const bodyText = doc.body ? ((doc.body.innerText || doc.body.textContent || "").trim()) : "";
          if (bodyText.length > 80) {
            scheduleMountAfterSettle();
          }
        }
      }, 180);
    }
  }

  function setOpen(nextOpen) {
    const next = Boolean(nextOpen);
    if (!next && state.appearanceLivePreview) {
      state.appearanceLivePreview = false;
      applyThemeToHost(state.settings.appearance);
    }
    state.isOpen = next;
    if (next && state.activeTab === "export") {
      invokeIpc("agy-studio:get-quota-summary", { chatKey: state.activeChatKey || "__new__" }).then((qs) => {
        if (!state.destroyed && qs) {
          state.quotaSummary = qs;
          if (state.isOpen && state.activeTab === "export") renderStructure();
        }
      });
    }
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
    clearReadinessWatchers();
    if (settleTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(settleTimer);
      settleTimer = null;
    }
    if (pollTimer && win && typeof win.clearInterval === "function") {
      win.clearInterval(pollTimer);
      pollTimer = null;
    }
    if (repaintTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(repaintTimer);
      repaintTimer = null;
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
    if (themeEngine && typeof themeEngine.destroy === "function") {
      try { themeEngine.destroy(); } catch (_e) {}
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
    estimateTokensFloat,
    parseQuotaFromDocumentText,
    BUILTIN_PERSONA_PRESETS,
  };
}
