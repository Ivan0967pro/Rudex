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

const CURATED_ACCENTS = ["#3b82f6", "#6366f1", "#8b5cf6", "#10b981", "#14b8a6", "#f59e0b", "#ec4899", "#ef4444"];

const DEFAULT_STUDIO_UI = {
  windowTheme: "obsidian",
  windowLayout: "sidebar",
  widgetTheme: "glass",
  widgetScale: "md",
  widgetRadius: 999,
  widgetOpacity: 88,
  studioRadius: 16,
  studioBlur: 20,
};

const STUDIO_WINDOW_THEMES = [
  { id: "obsidian", nameRu: "Обсидиан", nameEn: "Obsidian", descRu: "Глубокий графит и мягкое акцентное свечение", descEn: "Deep graphite with subtle accent glow", bg: "#0c0c0f", side: "#131318" },
  { id: "frosted", nameRu: "Матовое стекло", nameEn: "Frosted Glass", descRu: "Полупрозрачный акрил поверх обоев", descEn: "Translucent acrylic glass over wallpaper", bg: "rgba(18,20,28,0.7)", side: "rgba(24,26,36,0.78)" },
  { id: "neon-cyber", nameRu: "Кибер-неон", nameEn: "Cyber Neon", descRu: "Светящаяся рамка и контрастный HUD", descEn: "Luminous accent border and cyber HUD", bg: "#080912", side: "#0b0e1a" },
  { id: "minimal-mono", nameRu: "Минимализм", nameEn: "Minimal Mono", descRu: "Чистые линии без теней и лишнего шума", descEn: "Crisp hairline borders without visual noise", bg: "#0c0c0f", side: "#0c0c0f" },
  { id: "aurora", nameRu: "Аврора", nameEn: "Aurora", descRu: "Бархатный градиент и мягкая аура", descEn: "Velvet gradient backdrop with soft aura", bg: "#0a0c14", side: "#12162b" },
];

const STUDIO_WINDOW_LAYOUTS = [
  { id: "sidebar", nameRu: "Классический сайдбар", nameEn: "Classic Sidebar", descRu: "Боковое меню с подписями и статусом", descEn: "Full left sidebar with labels & status" },
  { id: "rail", nameRu: "Компактный рейл", nameEn: "Compact Rail", descRu: "Узкая полоса иконок — максимум пространства", descEn: "Slim icon rail for maximum workspace" },
  { id: "topbar", nameRu: "Верхняя панель", nameEn: "Top Bar", descRu: "Горизонтальная навигация сверху окна", descEn: "Horizontal tab bar across the top" },
  { id: "floating-glass", nameRu: "Парящие карточки", nameEn: "Floating Glass", descRu: "Две раздельные стеклянные панели", descEn: "Detached floating sidebar & content cards" },
];

const WIDGET_DESIGN_THEMES = [
  { id: "glass", nameRu: "Жидкое стекло", nameEn: "Liquid Glass", descRu: "Мягкий блюр и верхний стеклянный блик", descEn: "Frosted blur with crisp top sheen" },
  { id: "island", nameRu: "Dynamic Island", nameEn: "Dynamic Island", descRu: "Глубокий чёрный остров с яркой телеметрией", descEn: "Deep dark capsule with bold metrics" },
  { id: "neon", nameRu: "Неоновый HUD", nameEn: "Neon HUD", descRu: "Акцентная подсветка рамки и цифр TPS", descEn: "Luminous accent ring and glowing TPS" },
  { id: "minimal", nameRu: "Невесомый", nameEn: "Minimal", descRu: "Ультра-лёгкая прозрачная рамка", descEn: "Featherweight ultra-clean frame" },
  { id: "solid", nameRu: "Контрастный монолит", nameEn: "Solid Contrast", descRu: "Плотный фон для ярких обоев", descEn: "Solid surface for bright wallpapers" },
];

const WALLPAPER_ATMOS_PRESETS = [
  { id: "original", nameRu: "Оригинал", nameEn: "Original", dim: 35, blur: 0, brightness: 100, contrast: 100, saturate: 100, hue: 0, vignette: 0 },
  { id: "cinema", nameRu: "Кино", nameEn: "Cinema", dim: 48, blur: 2, brightness: 92, contrast: 118, saturate: 110, hue: 0, vignette: 55 },
  { id: "soft-blur", nameRu: "Нежный блюр", nameEn: "Soft Blur", dim: 42, blur: 10, brightness: 96, contrast: 96, saturate: 120, hue: 0, vignette: 20 },
  { id: "noir", nameRu: "Нуар Ч/Б", nameEn: "Noir B&W", dim: 50, blur: 0, brightness: 94, contrast: 126, saturate: 0, hue: 0, vignette: 65 },
  { id: "neon-pop", nameRu: "Неон поп", nameEn: "Neon Pop", dim: 40, blur: 0, brightness: 104, contrast: 116, saturate: 155, hue: 14, vignette: 35 },
  { id: "airy", nameRu: "Лёгкая дымка", nameEn: "Airy Haze", dim: 58, blur: 6, brightness: 86, contrast: 90, saturate: 85, hue: 0, vignette: 15 },
];

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
  panelRight: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/>',
  panelCenter: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  corners: '<path d="M3 9V6a3 3 0 0 1 3-3h3"/><path d="M15 3h3a3 3 0 0 1 3 3v3"/><path d="M21 15v3a3 3 0 0 1-3 3h-3"/><path d="M9 21H6a3 3 0 0 1-3-3v-3"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="9" y1="9" x2="21" y2="9"/>',
  rotateLeft: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/>',
  rotateRight: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><polyline points="21 3 21 8 16 8"/>',
  flipH: '<path d="M12 3v18"/><polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/>',
  flipV: '<path d="M3 12h18"/><polyline points="7 8 12 3 17 8"/><polyline points="7 16 12 21 17 16"/>',
  wand: '<path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>',
  move: '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
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
    modalSubAppearance: "Комбинация темы, акцента, обоев и стекла",
    appDockRightBtn: "Справа · Обзор",
    appDockCenterBtn: "В центр",
    appLayerTheme: "Тема",
    appLayerAccent: "Акцент",
    appLayerWallpaper: "Обои",
    appLayerSurface: "Стекло",
    appLayerGreeting: "Приветствие",
    modalTitlePersona: "Характер агента",
    modalSubPersona: "Персональная инструкция для текущего чата",
    modalTitleSupplements: "Дополнения агенту",
    modalSubSupplements: "Указания и фото во время работы без отмены задачи",
    modalTitleSettings: "Настройки",
    modalSubSettings: "Виджет, экспорт чата в ZIP, лимиты и язык",
    backToSettings: "Назад",
    appSubTheme: "Тема",
    appSubWallpaper: "Обои",
    appSubCorners: "Углы",
    appSubSurface: "Стекло",
    appSubGreeting: "Приветствие",
    appSubText: "Текст",
    setSubWidget: "Мини-окно",
    setSubStudio: "Дизайн окна",
    setSubExport: "Экспорт и лимиты",
    setSubSystem: "Язык и система",
    appLayerCorners: "Углы",
    appGradFineTitle: "Цвета и движение градиента",
    appGradStyleLabel: "Тип градиента",
    appGradLinear: "Линейный",
    appGradRadial: "Радиальный",
    appGradMesh: "Меш-аврора",
    appWpStageTitle: "Кадр и позиция обоев",
    appWpStageEmptyHint: "Выберите фото или видео, чтобы двигать и кадрировать обои мышкой",
    appWpDragCrop: "Кадр",
    appWpDragOffset: "Сдвиг",
    appWpDragHint: "Тяни мышкой · Колёсико — зум",
    appWpFitCover: "Заполнить",
    appWpFitContain: "Вписать",
    appWpFitFill: "Растянуть",
    appWpAnchorTitle: "Якорь",
    appWpResetFrame: "Сброс",
    appWpGalleryTitle: "Недавние обои",
    appWpAtmosTitle: "Атмосфера и пресеты",
    appWpGeoTitle: "Геометрия и кадрирование",
    appWpColorTitle: "Цветокоррекция",
    appWpPosX: "Позиция X",
    appWpPosY: "Позиция Y",
    appWpOffsetX: "Сдвиг X",
    appWpOffsetY: "Сдвиг Y",
    appWpRotate: "Поворот",
    appWpBrightness: "Яркость света",
    appWpContrast: "Контраст",
    appWpHue: "Оттенок",
    appWpVignette: "Виньетка",
    appWpPlaybackRate: "Скорость видео",
    appWpTintBlend: "Наложение",
    appWpBlendNormal: "Обычный",
    appWpBlendMultiply: "Умножение",
    appWpBlendScreen: "Экран",
    appWpBlendOverlay: "Перекрытие",
    appWpBlendSoftLight: "Мягкий свет",
    cornersTitle: "Скругление углов Antigravity",
    cornersModeLinked: "Все элементы вместе",
    cornersModeCustom: "Отдельно по элементам",
    cornersPresetsTitle: "Готовые формы углов",
    cornersAllLabel: "Общий радиус всех элементов",
    cornersSwitchCustomBtn: "Настроить элементы отдельно →",
    cornersSyncAllBtn: "Выровнять все по общему",
    cornersPreviewLabel: "Живой макет интерфейса",
    cornersMsgLabel: "Сообщения чата",
    cornersComposerLabel: "Поле ввода (Composer)",
    cornersButtonsLabel: "Кнопки и триггеры",
    cornersCardsLabel: "Карточки, мысли и инструменты",
    cornersCodeLabel: "Блоки кода",
    cornersSidebarLabel: "Сайдбар, чаты и вкладки",
    cornersOverlaysLabel: "Меню, диалоги и поповеры",
    cornersInputsLabel: "Поля ввода и бейджи",
    cornersStudioQuickLabel: "Скругление окна Rudex Studio",
    studioDesignTitle: "Стиль окна Rudex Studio",
    studioLayoutTitle: "Навигация и макет окна",
    studioWindowSliders: "Геометрия и стекло окна Studio",
    studioRadiusLabel: "Скругление углов Studio",
    studioBlurLabel: "Размытие стекла Studio",
    studioResetBtn: "Сбросить дизайн окна",
    studioThemeCycleTip: "Сменить стиль окна Rudex",
    studioDesignQuickBtn: "Окно",
    widgetThemeTitle: "Дизайн мини-окна",
    widgetScaleTitle: "Масштаб виджета",
    widgetScaleSm: "Компактный (S)",
    widgetScaleMd: "Обычный (M)",
    widgetScaleLg: "Крупный (L)",
    widgetOpacityLabel: "Прозрачность мини-окна",
    widgetRadiusLabel: "Скругление мини-окна",
    widgetRadiusPill: "Капсула",
    widgetPreviewMiniBtn: "Капсула (S)",
    widgetPreviewMedBtn: "Карточка (M)",
    appDirtyBadge: "Черновик",
    thinkUnit: "мысль",
    appThemesTitle: "Палитра",
    appAccentQuick: "Независимый акцент",
    appAccentReset: "Как в теме",
    appCustomColor: "Свой",
    appFineTune: "Тонкие цвета и скроллбары",
    appCanvasColor: "Фон окна",
    appCardColor: "Фон карточек",
    appRadius: "Скругление",
    appBorderStrength: "Чёткость рамок",
    appPolishLabel: "Мягкие скроллбары и фокус",
    appWpNone: "Нет",
    appWpGradient: "Градиент",
    appWpImage: "Фото",
    appWpVideo: "Видео",
    appWpNoneHint: "Чистый фон темы без обоев. При желании выберите градиент, фото или видео — их можно сочетать с любой темой и акцентом.",
    appWpPickImage: "Выбрать фото…",
    appWpPickVideo: "Выбрать видео…",
    appWpClearMedia: "Убрать",
    appWpNoFileHint: "PNG, JPG, WebP или зацикленное видео MP4/WebM",
    appWpAnimated: "Плавная анимация",
    appWpDim: "Затемнение",
    appWpBlur: "Размытие",
    appWpOpacity: "Яркость",
    appWpSaturate: "Насыщенность",
    appWpScale: "Масштаб",
    appWpSpeed: "Скорость",
    appWpAngle: "Угол",
    appWpAutoPause: "Пауза видео в фоне",
    appWpTintTitle: "Градиентная вуаль поверх обоев",
    appWpTintDesc: "Накладывает цветовой градиент поверх фото или видео для тонировки и глубины",
    appWpTintOpacity: "Плотность вуали",
    appWpReadability: "Читаемость и стекло",
    appGlassOpacity: "Плотность панелей",
    appSidebarOpacity: "Стекло сайдбара",
    appGlassBlur: "Размытие стекла",
    appMessageCardOpacity: "Подложка сообщений",
    appMsgStyleLabel: "Карточки сообщений",
    appMsgStyleGlass: "Стекло",
    appMsgStyleSolid: "Чёткие",
    appMsgStyleMinimal: "Без рамок",
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
    quotaCalibrateTip: "Откройте «Посмотреть использование» или Настройки → Модели и использование в Antigravity для точной калибровки %.",
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
    pinLockDesc: "Фиксирует позицию; клик по мини-капсуле всегда открывает Rudex",
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
    thinkingRuGlobalDesc: "Действует глобально для всех чатов. При отключении возвращается режим по умолчанию.",
    thinkingRuOn: "Русский",
    thinkingRuDefault: "По умолчанию",
    updateSectionTitle: "Обновления Rudex",
    updateBadgeNew: "Есть обновление",
    updateAutoTitle: "Автопроверка обновлений",
    updateAutoDesc: "Фоновая проверка новых версий на GitHub с уведомлением «Обновить»",
    updateStatusLabel: "Статус",
    updateStatusIdle: "Автопроверка включена",
    updateStatusChecking: "Проверяем GitHub…",
    updateStatusUpToDate: "Установлена последняя версия",
    updateStatusAvailable: "Доступна новая версия",
    updateStatusDownloading: "Скачивание архива…",
    updateStatusExtracting: "Распаковка архива…",
    updateStatusInstalling: "Установка обновления…",
    updateStatusRestarting: "Перезапуск Antigravity…",
    updateStatusError: "Ошибка обновления",
    updateBtnCheck: "Проверить",
    updateBtnNow: "Обновить",
    updateBtnInstallRestart: "Обновить и перезапустить",
    updateBtnLater: "Позже",
    updateBtnRetry: "Повторить",
    updateToastTitle: "Доступно обновление Rudex",
    updateToastBusyTitle: "Обновление Rudex",
    updateToastDesc: "Нажмите «Обновить» — Antigravity перезапустится с новой версией скилла.",
    hotkeysTitle: "Горячие клавиши",
    hkToggleLang: "Переключить язык RU / EN",
    hkToggleModal: "Открыть / закрыть Rudex",
    hkDoubleClick: "Открыть настройки по виджету",
    hkDoubleClickKey: "1 клик",
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
    modalSubAppearance: "Mix and combine themes, accent, wallpaper, glass, and greeting",
    appDockRightBtn: "Dock right",
    appDockCenterBtn: "Center view",
    appLayerTheme: "Theme",
    appLayerAccent: "Accent",
    appLayerWallpaper: "Wallpaper",
    appLayerSurface: "Glass",
    appLayerGreeting: "Greeting",
    modalTitlePersona: "Agent Persona",
    modalSubPersona: "Per-chat persona instruction (active from next reply)",
    modalTitleSupplements: "Agent Supplements",
    modalSubSupplements: "Send instructions or images mid-task without canceling",
    modalTitleSettings: "Settings",
    modalSubSettings: "Floating widget, ZIP export, quotas, and UI language",
    backToSettings: "Back",
    appSubTheme: "Theme",
    appSubWallpaper: "Wallpaper",
    appSubCorners: "Corners",
    appSubSurface: "Glass",
    appSubGreeting: "Greeting",
    appSubText: "Text",
    setSubWidget: "Mini Window",
    setSubStudio: "Window Design",
    setSubExport: "Export & Limits",
    setSubSystem: "Language & System",
    appLayerCorners: "Corners",
    appGradFineTitle: "Gradient colors & motion",
    appGradStyleLabel: "Gradient style",
    appGradLinear: "Linear",
    appGradRadial: "Radial",
    appGradMesh: "Mesh Aura",
    appWpStageTitle: "Wallpaper frame & position",
    appWpStageEmptyHint: "Choose an image or video to drag, pan, and zoom live",
    appWpDragCrop: "Frame",
    appWpDragOffset: "Offset",
    appWpDragHint: "Drag to move · Scroll to zoom",
    appWpFitCover: "Cover",
    appWpFitContain: "Contain",
    appWpFitFill: "Stretch",
    appWpAnchorTitle: "Anchor",
    appWpResetFrame: "Reset",
    appWpGalleryTitle: "Recent wallpapers",
    appWpAtmosTitle: "Atmosphere presets",
    appWpGeoTitle: "Geometry & framing",
    appWpColorTitle: "Color grading",
    appWpPosX: "Position X",
    appWpPosY: "Position Y",
    appWpOffsetX: "Offset X",
    appWpOffsetY: "Offset Y",
    appWpRotate: "Rotate",
    appWpBrightness: "Brightness",
    appWpContrast: "Contrast",
    appWpHue: "Hue shift",
    appWpVignette: "Vignette",
    appWpPlaybackRate: "Video speed",
    appWpTintBlend: "Blend mode",
    appWpBlendNormal: "Normal",
    appWpBlendMultiply: "Multiply",
    appWpBlendScreen: "Screen",
    appWpBlendOverlay: "Overlay",
    appWpBlendSoftLight: "Soft Light",
    cornersTitle: "Antigravity Corner Radii",
    cornersModeLinked: "All elements together",
    cornersModeCustom: "Per-element control",
    cornersPresetsTitle: "Corner shape presets",
    cornersAllLabel: "Global radius for all elements",
    cornersSwitchCustomBtn: "Customize elements individually →",
    cornersSyncAllBtn: "Sync all to global",
    cornersPreviewLabel: "Live UI wireframe",
    cornersMsgLabel: "Chat messages",
    cornersComposerLabel: "Input composer",
    cornersButtonsLabel: "Buttons & triggers",
    cornersCardsLabel: "Cards, thinking & tools",
    cornersCodeLabel: "Code blocks",
    cornersSidebarLabel: "Sidebar, chats & tabs",
    cornersOverlaysLabel: "Menus, dialogs & popovers",
    cornersInputsLabel: "Inputs & badges",
    cornersStudioQuickLabel: "Rudex Studio window radius",
    studioDesignTitle: "Rudex Studio Window Style",
    studioLayoutTitle: "Navigation & Window Layout",
    studioWindowSliders: "Studio Geometry & Glass",
    studioRadiusLabel: "Studio corner radius",
    studioBlurLabel: "Studio backdrop blur",
    studioResetBtn: "Reset window design",
    studioThemeCycleTip: "Cycle Rudex window theme",
    studioDesignQuickBtn: "Window",
    widgetThemeTitle: "Mini Window Design",
    widgetScaleTitle: "Widget scale",
    widgetScaleSm: "Compact (S)",
    widgetScaleMd: "Regular (M)",
    widgetScaleLg: "Large (L)",
    widgetOpacityLabel: "Mini window opacity",
    widgetRadiusLabel: "Mini window radius",
    widgetRadiusPill: "Capsule",
    widgetPreviewMiniBtn: "Capsule (S)",
    widgetPreviewMedBtn: "Card (M)",
    appDirtyBadge: "Draft",
    thinkUnit: "think",
    appThemesTitle: "Palette",
    appAccentQuick: "Independent Accent",
    appAccentReset: "Use theme default",
    appCustomColor: "Custom",
    appFineTune: "Fine colors & scrollbars",
    appCanvasColor: "Window background",
    appCardColor: "Card background",
    appRadius: "Corner radius",
    appBorderStrength: "Border sharpness",
    appPolishLabel: "Refined scrollbars & focus ring",
    appWpNone: "None",
    appWpGradient: "Gradient",
    appWpImage: "Image",
    appWpVideo: "Video",
    appWpNoneHint: "Clean theme background with no wallpaper. You can freely mix a gradient, image, or video with any theme and accent.",
    appWpPickImage: "Choose image…",
    appWpPickVideo: "Choose video…",
    appWpClearMedia: "Clear",
    appWpNoFileHint: "PNG, JPG, WebP or looping MP4/WebM video",
    appWpAnimated: "Smooth animation",
    appWpDim: "Dim",
    appWpBlur: "Blur",
    appWpOpacity: "Opacity",
    appWpSaturate: "Saturation",
    appWpScale: "Scale",
    appWpSpeed: "Cycle",
    appWpAngle: "Angle",
    appWpAutoPause: "Pause video when hidden",
    appWpTintTitle: "Gradient tint overlay",
    appWpTintDesc: "Blends a gradient wash over image or video wallpapers",
    appWpTintOpacity: "Tint opacity",
    appWpReadability: "Readability & glass",
    appGlassOpacity: "Panel opacity",
    appSidebarOpacity: "Sidebar glass",
    appGlassBlur: "Glass blur",
    appMessageCardOpacity: "Message backing",
    appMsgStyleLabel: "Message card style",
    appMsgStyleGlass: "Glass",
    appMsgStyleSolid: "Solid",
    appMsgStyleMinimal: "Borderless",
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
    quotaCalibrateTip: "Open View Usage or Settings → Models & Usage in Antigravity to calibrate exact %.",
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
    pinLockDesc: "Locks position; clicking the mini pill always opens Rudex",
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
    thinkingRuGlobalDesc: "Applies globally across all chats. Turn off to restore default behavior.",
    thinkingRuOn: "Russian",
    thinkingRuDefault: "Default",
    updateSectionTitle: "Rudex Updates",
    updateBadgeNew: "Update available",
    updateAutoTitle: "Auto-check updates",
    updateAutoDesc: "Periodically checks GitHub for updates and prompts to restart",
    updateStatusLabel: "Status",
    updateStatusIdle: "Auto-check enabled",
    updateStatusChecking: "Checking GitHub…",
    updateStatusUpToDate: "Up to date",
    updateStatusAvailable: "New version available",
    updateStatusDownloading: "Downloading archive…",
    updateStatusExtracting: "Extracting package…",
    updateStatusInstalling: "Installing update…",
    updateStatusRestarting: "Restarting Antigravity…",
    updateStatusError: "Update failed",
    updateBtnCheck: "Check now",
    updateBtnNow: "Update",
    updateBtnInstallRestart: "Update & Restart",
    updateBtnLater: "Later",
    updateBtnRetry: "Retry",
    updateToastTitle: "Rudex Update Available",
    updateToastBusyTitle: "Updating Rudex",
    updateToastDesc: "Click Update to install the latest skill release and restart Antigravity.",
    hotkeysTitle: "Shortcuts",
    hkToggleLang: "Toggle RU / EN localization",
    hkToggleModal: "Toggle Rudex Studio",
    hkDoubleClick: "Open Rudex from widget",
    hkDoubleClickKey: "1 click",
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
    customAccent: false,
    accentColor: "#3b82f6",
    canvasBg: "#09090b",
    cardBg: "#131316",
    glassOpacity: 78,
    sidebarOpacity: 72,
    glassBlur: 12,
    messageCardOpacity: 74,
    messageStyle: "glass",
    borderStrength: 50,
    highContrastText: true,
    radius: 12,
    corners: {
      mode: "linked",
      all: 12,
      messages: 12,
      composer: 12,
      buttons: 10,
      cards: 12,
      code: 10,
      sidebar: 10,
      overlays: 14,
      inputs: 10,
    },
    wallpaper: {
      type: "none",
      gradientPreset: "aurora",
      gradStyle: "linear",
      gradColors: ["#0f172a", "#1e1b4b", "#09090b"],
      gradAngle: 135,
      gradAnimated: true,
      gradSpeed: 18,
      mediaFile: "",
      mediaUrl: "",
      mediaMime: "",
      fit: "cover",
      posX: 50,
      posY: 50,
      offsetX: 0,
      offsetY: 0,
      dim: 45,
      blur: 0,
      opacity: 85,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      hue: 0,
      scale: 100,
      rotate: 0,
      flipX: false,
      flipY: false,
      vignette: 0,
      tintEnabled: false,
      tintOpacity: 35,
      tintBlend: "normal",
      playbackRate: 1,
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
    corners: Object.assign({}, def.corners, src.corners || {}),
    wallpaper: Object.assign({}, def.wallpaper, src.wallpaper || {}),
    typography: Object.assign({}, def.typography, src.typography || {}),
  });
}

function spNormalizeStudioUi(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const clampInt = (v, min, max, fb) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fb;
  };
  const winThemes = STUDIO_WINDOW_THEMES.map((x) => x.id);
  const winLayouts = STUDIO_WINDOW_LAYOUTS.map((x) => x.id);
  const widThemes = WIDGET_DESIGN_THEMES.map((x) => x.id);
  const rawWrad = Number(src.widgetRadius);
  const widgetRadius = Number.isFinite(rawWrad) && rawWrad < 50 ? clampInt(rawWrad, 4, 24, 999) : 999;
  return {
    windowTheme: winThemes.indexOf(src.windowTheme) >= 0 ? src.windowTheme : DEFAULT_STUDIO_UI.windowTheme,
    windowLayout: winLayouts.indexOf(src.windowLayout) >= 0 ? src.windowLayout : DEFAULT_STUDIO_UI.windowLayout,
    widgetTheme: widThemes.indexOf(src.widgetTheme) >= 0 ? src.widgetTheme : DEFAULT_STUDIO_UI.widgetTheme,
    widgetScale: src.widgetScale === "sm" || src.widgetScale === "lg" ? src.widgetScale : "md",
    widgetRadius,
    widgetOpacity: clampInt(src.widgetOpacity, 45, 100, DEFAULT_STUDIO_UI.widgetOpacity),
    studioRadius: clampInt(src.studioRadius, 8, 26, DEFAULT_STUDIO_UI.studioRadius),
    studioBlur: clampInt(src.studioBlur, 0, 32, DEFAULT_STUDIO_UI.studioBlur),
  };
}

function spGetCornerPresets() {
  if (typeof CORNER_PRESETS !== "undefined" && Array.isArray(CORNER_PRESETS)) return CORNER_PRESETS;
  return [
    { id: "sharp", nameRu: "Острые", nameEn: "Sharp", mode: "linked", all: 0 },
    { id: "crisp", nameRu: "Чёткие", nameEn: "Crisp", mode: "linked", all: 6 },
    { id: "balanced", nameRu: "Баланс", nameEn: "Balanced", mode: "linked", all: 12 },
    { id: "soft", nameRu: "Мягкие", nameEn: "Soft", mode: "linked", all: 18 },
    { id: "pill", nameRu: "Капсулы", nameEn: "Pill", mode: "linked", all: 24 },
    { id: "editorial", nameRu: "Контраст", nameEn: "Editorial", mode: "custom", all: 12, messages: 18, composer: 22, buttons: 8, cards: 14, code: 6, sidebar: 8, overlays: 20, inputs: 10 },
  ];
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

const QUOTA_RESET_RE = /(?:refresh(?:ed|ing|es)?\s+in|reset[a-z]*\s+in|обнов[а-яё]*\s+через|сброс[а-яё]*\s+через)\s+([^\n\r•·,;]{2,48})/i;

function cleanQuotaResetText(raw) {
  return String(raw || "")
    .replace(/[.,;\s]+$/, "")
    .replace(/^\s+/, "")
    .trim()
    .slice(0, 80);
}

function extractBoundedReset(textSlice, crossBoundaryRe) {
  if (!textSlice) return "";
  let chunk = String(textSlice);
  if (crossBoundaryRe) {
    const boundM = crossBoundaryRe.exec(chunk);
    if (boundM) chunk = chunk.slice(0, boundM.index);
  }
  const rM = QUOTA_RESET_RE.exec(chunk);
  return rM ? cleanQuotaResetText(rM[1]) : "";
}

function extractPctForLabel(slice, labelRe, crossBoundaryRe) {
  let m;
  const globalLabel = new RegExp(labelRe.source, "gi");
  while ((m = globalLabel.exec(slice)) !== null) {
    const startIdx = m.index;
    const afterLabel = slice.slice(m.index + m[0].length, m.index + m[0].length + 260);
    const beforeSlice = slice.slice(Math.max(0, startIdx - 140), startIdx);
    const pctM = /(\d{1,3}(?:[.,]\d+)?)\s*%/.exec(afterLabel);
    const betweenAfter = pctM ? afterLabel.slice(0, pctM.index) : "";
    const afterHasPct = Boolean(pctM && !crossBoundaryRe.test(betweenAfter));
    const sameLineAfter = Boolean(afterHasPct && !/[\r\n]/.test(betweenAfter));

    const revMatches = [];
    const pctGlobal = /(\d{1,3}(?:[.,]\d+)?)\s*%/g;
    let pm;
    while ((pm = pctGlobal.exec(beforeSlice)) !== null) revMatches.push(pm);
    const lastPm = revMatches.length > 0 ? revMatches[revMatches.length - 1] : null;
    const gapBefore = lastPm ? beforeSlice.slice(lastPm.index + lastPm[0].length) : "";
    const beforeHasPct = Boolean(lastPm && !crossBoundaryRe.test(gapBefore));
    const sameLineBefore = Boolean(beforeHasPct && !/[\r\n]/.test(gapBefore));

    const readAfterMatch = () => {
      const val = parseFloat(pctM[1].replace(",", "."));
      if (!Number.isFinite(val) || val < 0 || val > 100) return null;
      const resetFromBetween = extractBoundedReset(betweenAfter, crossBoundaryRe);
      const resetFromAfterPct = extractBoundedReset(
        afterLabel.slice(pctM.index + pctM[0].length, pctM.index + pctM[0].length + 140),
        crossBoundaryRe
      );
      return { val, reset: resetFromBetween || resetFromAfterPct };
    };

    const readBeforeMatch = () => {
      const val = parseFloat(lastPm[1].replace(",", "."));
      if (!Number.isFinite(val) || val < 0 || val > 100) return null;
      const reset = extractBoundedReset(afterLabel.slice(0, 140), crossBoundaryRe);
      return { val, reset };
    };

    if (sameLineAfter) {
      const hit = readAfterMatch();
      if (hit) return hit;
    }
    if (sameLineBefore) {
      const hit = readBeforeMatch();
      if (hit) return hit;
    }
    if (afterHasPct) {
      const hit = readAfterMatch();
      if (hit) return hit;
    }
    if (beforeHasPct) {
      const hit = readBeforeMatch();
      if (hit) return hit;
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

  const headerCrossPattern =
    "(?:gemini(?:\\s+(?:pro|flash))?\\s+models?|модели\\s+gemini|(?:claude|anthropic|gpt|openai)(?:\\s*(?:and|&|и|\\/|,)\\s*(?:claude|anthropic|gpt|openai|other))*\\s+models?|(?:claude|anthropic)\\s*(?:and|&|и|\\/)\\s*(?:gpt|openai)|(?:gpt|openai)\\s*(?:and|&|и|\\/)\\s*(?:claude|anthropic)|модели\\s+(?:claude|anthropic|gpt|openai))";
  const wkLabelRe = /(?:weekly\s+limit(?:\s+remaining)?|остаток\s+недельн[а-яё]*\s+лимит[а-яё]*|недельн[а-яё]*\s+лимит(?:\s+осталось|\s+исчерпан)?|осталось\s+за\s+недел[а-яё]*)/i;
  const fhLabelPart = "(?:(?:five[- ]?hour|5[-\\s]*hour|5\\s*h)\\s+limit(?:\\s+remaining)?|лимит\\s*\\(\\s*5\\s*ч\\s*\\)|остаток\\s+(?:5|пяти)[-\\s]*часов[а-яё]*\\s+лимит[а-яё]*|(?:5|пяти)[-\\s]*часов[а-яё]*\\s+лимит(?:\\s+осталось|\\s+исчерпан)?|осталось\\s+за\\s+5\\s*ч[а-яё]*|\\b5\\s*ч\\s+лимит)";
  const wkCrossRe = new RegExp(`(?:${fhLabelPart}|daily\\s+limit|дневн[а-яё]*\\s+лимит|${headerCrossPattern})`, "i");
  const fhLabelRe = new RegExp(fhLabelPart, "i");
  const fhCrossRe = new RegExp(`(?:weekly\\s+limit|остаток\\s+недельн[а-яё]*\\s+лимит|недельн[а-яё]*\\s+лимит|daily\\s+limit|дневн[а-яё]*\\s+лимит|${headerCrossPattern})`, "i");

  const wkUnusedM = /(?:not\s+used\s+any\s+of\s+your\s+weekly\s+limit|ещё\s+не\s+расходовали\s+недельн[а-яё]*\s+лимит)[\s\S]{0,140}/i.exec(slice);
  if (wkUnusedM) {
    weeklyRem = 100;
    weeklyReset = extractBoundedReset(wkUnusedM[0], wkCrossRe);
  } else {
    const wkHit = extractPctForLabel(slice, wkLabelRe, wkCrossRe);
    if (wkHit) {
      weeklyRem = wkHit.val;
      weeklyReset = wkHit.reset;
    } else if (/(?:used\s+all\s+of|reached|exhausted)\s+your\s+weekly\s+limit|исчерпали\s+недельн[а-яё]*\s+лимит|недельн[а-яё]*\s+лимит\s+исчерпан/i.test(slice)) {
      weeklyRem = 0;
      weeklyReset = extractBoundedReset(slice, wkCrossRe);
    }
  }

  const fhUnusedM = /(?:not\s+used\s+any\s+of\s+your\s+(?:5-hour|five[- ]hour)\s+limit|ещё\s+не\s+расходовали\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит)[\s\S]{0,140}/i.exec(slice);
  if (fhUnusedM) {
    fiveHourRem = 100;
    fiveHourReset = extractBoundedReset(fhUnusedM[0], fhCrossRe);
  } else {
    const fhHit = extractPctForLabel(slice, fhLabelRe, fhCrossRe);
    if (fhHit) {
      fiveHourRem = fhHit.val;
      fiveHourReset = fhHit.reset;
    } else if (/(?:used\s+all\s+of|reached|exhausted)\s+your\s+(?:5-hour|five[- ]hour)\s+limit|исчерпали\s+(?:5|пяти)[-\s]*часов[а-яё]*\s+лимит|лимит\s*\(\s*5\s*ч\s*\)\s+исчерпан/i.test(slice)) {
      fiveHourRem = 0;
      fiveHourReset = extractBoundedReset(slice, fhCrossRe);
    }
  }

  if (weeklyRem === null && fiveHourRem === null) return null;
  return { weeklyRem, fiveHourRem, weeklyReset, fiveHourReset };
}

function mergeParsedQuotaFamily(prev, next) {
  if (!next) return prev;
  if (!prev) return next;
  return {
    weeklyRem: next.weeklyRem !== null ? next.weeklyRem : prev.weeklyRem,
    fiveHourRem: next.fiveHourRem !== null ? next.fiveHourRem : prev.fiveHourRem,
    weeklyReset: next.weeklyReset || prev.weeklyReset || "",
    fiveHourReset: next.fiveHourReset || prev.fiveHourReset || "",
  };
}

function parseQuotaFromDocumentText(fullText, activeModelName) {
  const txt = String(fullText || "");
  if (!txt || txt.length < 20) return null;
  if (!/limit\s+remaining|weekly\s+limit|five\s*hour|5[-\s]*hour|5h\s+limit|лимит\s*\(\s*5\s*ч\s*\)|остаток\s+(?:недельн|5|пяти)|недельн[а-яё]*\s+лимит|пятичас|5[-\s]*часов/i.test(txt)) {
    return null;
  }
  const gemHeadRe = /(?:gemini(?:\s+(?:pro|flash))?\s+models?|модели\s+gemini(?:\s+(?:pro|flash))?)/gi;
  const claHeadRe = /(?:(?:claude|anthropic|gpt|openai)(?:\s*(?:and|&|и|\/|,)\s*(?:claude|anthropic|gpt|openai|other))*\s+models?|(?:claude|anthropic)\s*(?:and|&|и|\/)\s*(?:gpt|openai)|(?:gpt|openai)\s*(?:and|&|и|\/)\s*(?:claude|anthropic)|модели\s+(?:claude|anthropic|gpt|openai)(?:\s*(?:и|and|&|\/|,)\s*(?:claude|anthropic|gpt|openai))*)/gi;

  const findAllIndices = (re, fam) => {
    const res = [];
    let m;
    while ((m = re.exec(txt)) !== null) res.push({ fam, index: m.index, end: m.index + m[0].length });
    return res;
  };

  const gemIdxs = findAllIndices(gemHeadRe, "gemini");
  const claIdxs = findAllIndices(claHeadRe, "claudeGpt");
  const rawHeaders = gemIdxs.concat(claIdxs).sort((a, b) => a.index - b.index || b.end - a.end);
  const allHeaders = [];
  for (let i = 0; i < rawHeaders.length; i += 1) {
    const cur = rawHeaders[i];
    const prev = allHeaders.length > 0 ? allHeaders[allHeaders.length - 1] : null;
    if (prev && cur.index < prev.end) continue;
    allHeaders.push(cur);
  }

  let gemini = null;
  let claudeGpt = null;
  for (let i = 0; i < allHeaders.length; i += 1) {
    const cur = allHeaders[i];
    const next = allHeaders[i + 1];
    const sliceEnd = next ? Math.min(cur.index + 2400, next.index) : cur.index + 2400;
    const parsed = parseQuotaSectionFromSlice(txt.slice(cur.index, sliceEnd));
    if (!parsed) continue;
    if (cur.fam === "gemini") gemini = mergeParsedQuotaFamily(gemini, parsed);
    else claudeGpt = mergeParsedQuotaFamily(claudeGpt, parsed);
  }

  if (!gemini && !claudeGpt) {
    const fallbackParsed = parseQuotaSectionFromSlice(txt.slice(-3000));
    if (fallbackParsed) {
      const isCla = /claude|sonnet|opus|haiku|anthropic|gpt|openai|chatgpt|\bo[134](?:[-_\s]|$)/i.test(String(activeModelName || ""));
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
    prevRawFloatTok: 0,
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
    : { version: "4.1.2", dictEntries: 4048, dynamicRulesCount: 474 };

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
    if (s.startsWith("rudex-media://local/")) {
      try { return decodeURIComponent(s.slice("rudex-media://local/".length)); } catch (_e) {}
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
    settingsSubTab: "system",
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
      autoCheckUpdates: true,
      customPresets: [],
      appearance: spCloneAppearance(spDefaultAppearance()),
      appearanceProfiles: [],
      greeting: spCloneGreeting(null),
      studioUi: Object.assign({}, DEFAULT_STUDIO_UI),
    },
    appearanceDraft: spCloneAppearance(spDefaultAppearance()),
    greetingDraft: spCloneGreeting(null),
    appearanceDirty: false,
    appearanceLivePreview: false,
    appearanceDockedRight: false,
    mediaLibrary: [],
    tempUploadedMediaFiles: [],
    wpDragMode: "crop",
    widgetPreviewMode: "mini",
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
    update: {
      status: "idle",
      available: false,
      dismissed: false,
      reason: "",
      updateKey: "",
      lastCheckedAt: 0,
      error: "",
      installed: null,
      remote: null,
    },
    telemetry: spEmptyTelemetry(),
  };

  let hostEl = null;
  let shadowRoot = null;
  let styleEl = null;
  let rootEl = null;
  let widgetMountEl = null;
  let popoverMountEl = null;
  let updateToastMountEl = null;
  let modalMountEl = null;
  let thinkingScanTimer = null;
  let isApplyingThinkingTranslation = false;
  const thinkingNodeMap = new WeakMap();
  const trackedThinkingNodes = new Set();
  const thinkingCache = new Map();
  const thinkingInflight = new Set();
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
  let wpDragState = null;
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
    if (activeApp && activeApp.presetId === "custom") {
      const customL = parseColorLightness(activeApp.canvasBg);
      if (customL !== null) return customL > 0.58 ? "light" : "dark";
    }
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
      const sui = spNormalizeStudioUi(state.settings.studioUi);
      rootEl.setAttribute("data-theme", next);
      rootEl.setAttribute("data-studio-theme", sui.windowTheme);
      rootEl.style.setProperty("--rx-studio-radius", `${sui.studioRadius}px`);
      rootEl.style.setProperty("--rx-studio-blur", `${sui.studioBlur}px`);
      rootEl.style.setProperty("--rx-widget-opacity", (sui.widgetOpacity / 100).toFixed(2));
      rootEl.style.setProperty("--rx-widget-radius", sui.widgetRadius >= 999 ? "999px" : `${sui.widgetRadius}px`);
      const activeApp = state.appearanceLivePreview ? state.appearanceDraft : state.settings.appearance;
      const preset = spFindThemePreset(activeApp && activeApp.presetId);
      const accent = (activeApp && (activeApp.customAccent || activeApp.presetId === "custom"))
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
    const prevThinkRu = Boolean(state.settings.thinkingInRussian);
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
    if (patch.studioUi) {
      state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, patch.studioUi));
    }
    renderStructure();
    if (typeof patch.thinkingInRussian === "boolean" && patch.thinkingInRussian !== prevThinkRu) {
      if (state.settings.thinkingInRussian) scanThinkingBlocks(true);
      else restoreAllThinkingNodes();
    }
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

    const prevThinkRu = Boolean(state.settings.thinkingInRussian);
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
      if (typeof rawSettings.autoCheckUpdates === "boolean") state.settings.autoCheckUpdates = rawSettings.autoCheckUpdates;
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
      if (rawSettings.studioUi && typeof rawSettings.studioUi === "object") {
        state.settings.studioUi = spNormalizeStudioUi(rawSettings.studioUi);
      }
    }
    if (remote.quotaSummary && typeof remote.quotaSummary === "object") {
      state.quotaSummary = remote.quotaSummary;
    }
    if (typeof remote.personaFilePath === "string" && remote.personaFilePath) state.personaFilePath = remote.personaFilePath;
    renderStructure();
    if (state.settings.thinkingInRussian !== prevThinkRu) {
      if (state.settings.thinkingInRussian) scanThinkingBlocks(true);
      else restoreAllThinkingNodes();
    }
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

    if (state.hasActivatedChat && state.activeChatKey && state.activeChatKey !== "__new__" && (snap.userMsgCount > 0 || snap.respCount > 0)) {
      if (snap.isGenerating || state.telemetry.isGenerating) {
        return { key: state.activeChatKey, isNew: false, title: title || state.activeChatTitle || "" };
      }
      if (
        UUID_RE.test(state.activeChatKey) &&
        (!title || !state.activeChatTitle || cleanTitleStr(title) === cleanTitleStr(state.activeChatTitle))
      ) {
        return { key: state.activeChatKey, isNew: false, title: title || state.activeChatTitle || "" };
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
      const rawResponses = doc.querySelectorAll('[data-testid="agent-response"]');
      const rawUserMsgs = doc.querySelectorAll('[data-testid="user-message-content"]');
      const responses = [];
      for (let i = 0; rawResponses && i < rawResponses.length; i += 1) {
        const r = rawResponses[i];
        if (!r || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(r))) continue;
        if (isHiddenAncestor(r, doc.body)) continue;
        responses.push(r);
      }
      const userMsgs = [];
      for (let i = 0; rawUserMsgs && i < rawUserMsgs.length; i += 1) {
        const u = rawUserMsgs[i];
        if (!u || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(u))) continue;
        if (isHiddenAncestor(u, doc.body)) continue;
        userMsgs.push(u);
      }
      const respCount = responses.length;
      const userMsgCount = userMsgs.length;
      const lastResp = respCount > 0 ? responses[respCount - 1] : null;

      let hasCancelBtn = false;
      if (typeof doc.querySelectorAll === "function") {
        const cancelEls = doc.querySelectorAll('[data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"]');
        for (let i = 0; cancelEls && i < cancelEls.length; i += 1) {
          const cb = cancelEls[i];
          if (!cb || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(cb))) continue;
          if (!isHiddenAncestor(cb, doc.body)) {
            hasCancelBtn = true;
            break;
          }
        }
      }
      let isGenerating = hasCancelBtn;
      if (!isGenerating && typeof doc.querySelectorAll === "function") {
        const pendingBtns = doc.querySelectorAll('[data-testid="send-button-loading"], [data-testid="send-button-pending"]');
        for (let i = 0; pendingBtns && i < pendingBtns.length; i += 1) {
          const pb = pendingBtns[i];
          if (!pb || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(pb))) continue;
          if (!isHiddenAncestor(pb, doc.body)) {
            isGenerating = true;
            break;
          }
        }
      }
      let isThinking = false;
      if (lastResp) {
        const h6List = typeof lastResp.querySelectorAll === "function"
          ? lastResp.querySelectorAll("h6")
          : (typeof lastResp.querySelector === "function" && lastResp.querySelector("h6") ? [lastResp.querySelector("h6")] : []);
        for (let i = 0; h6List && i < h6List.length; i += 1) {
          if (!h6List[i] || hasMarkdownRootAncestor(h6List[i], lastResp)) continue;
          const txt = (h6List[i].textContent || "").replace(/\s+/g, " ").trim();
          if (!txt || txt.length > 48) continue;
          if (/agent\s+working|агент\s+работает|\bworking\b|\bgenerating\b|\bthinking\b|\bstreaming\b|работает|думает|генерац|выполня|пишет/i.test(txt)) {
            isGenerating = true;
            if (/thinking|думает/i.test(txt)) isThinking = true;
            break;
          }
        }
      }
      if (!isGenerating) {
        const composerBtns = doc.querySelectorAll('form button[aria-label], [data-testid="composer"] button[aria-label], .composer-container button[aria-label], button[data-testid="input-cancel-button"]');
        for (let i = 0; composerBtns && i < composerBtns.length; i += 1) {
          const b = composerBtns[i];
          if (!b || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(b))) continue;
          if (isHiddenAncestor(b, doc.body)) continue;
          const lbl = typeof b.getAttribute === "function" ? (b.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim() : "";
          if (/^(?:stop\s+(?:generat|respond|stream|agent)|cancel(?:\s*\(|$|\s+(?:invoc|generat|request))|остановить\s+(?:генерац|ответ|агент)|прервать\s+(?:генерац|ответ)|отмен(?:а|ить)(?:\s*\(|$|\s+(?:генерац|запрос)))/i.test(lbl)) {
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
        ? telemetryEngine.countChatTokens(userMsgs, responses, lastResp, respTokens)
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
      freshTel.prevRawFloatTok = snap.respFloatTok;
      freshTel.turnStartFloatTok = snap.respFloatTok;
      freshTel.highWaterBubbleTok = snap.respFloatTok;
      freshTel.preTokenAt = nowHiRes();
      freshTel.activeRespEl = snap.lastResp;
      freshTel.prevRespCount = snap.respCount;
      freshTel.prevUserCount = snap.userMsgCount;
      freshTel.firstUserNorm = snap.firstUserNorm;
      freshTel.modelName = snap.modelName;
      freshTel.contextLabel = detected.isNew ? "" : snap.contextLabel;
      if (!detected.isNew && snap.isGenerating) {
        freshTel.isGenerating = true;
        freshTel.phase = "thinking";
      }
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

  function formatUpdateVersionBadge(u) {
    const inst = u && u.installed ? u.installed : null;
    const rem = u && u.remote ? u.remote : null;
    const instVer = (inst && inst.version) || pluginMeta.version || "4.1.2";
    const remVer = (rem && rem.version) || "";
    const remShort = (rem && rem.commitShort) || "";
    if (remVer && remVer !== instVer) {
      return `v${instVer} → v${remVer}`;
    }
    if (remVer && remShort) {
      return `v${remVer} · #${remShort}`;
    }
    return remVer ? `v${remVer}` : `v${instVer}`;
  }

  function formatUpdateStatusLabel(u, tr) {
    const st = u && u.status ? u.status : "idle";
    if (st === "checking") return tr.updateStatusChecking;
    if (st === "downloading") return tr.updateStatusDownloading;
    if (st === "extracting") return tr.updateStatusExtracting;
    if (st === "installing") return tr.updateStatusInstalling;
    if (st === "restarting") return tr.updateStatusRestarting;
    if (st === "error") return `${tr.updateStatusError}${u.error ? ": " + u.error : ""}`;
    if (u && u.available) return tr.updateStatusAvailable;
    if (st === "up-to-date") return tr.updateStatusUpToDate;
    return tr.updateStatusIdle;
  }

  function renderUpdateToast() {
    if (!updateToastMountEl || state.destroyed) return;
    const u = state.update || {};
    const st = u.status || "idle";
    const isBusyStage = st === "downloading" || st === "extracting" || st === "installing" || st === "restarting";
    const hasErrOnToast = st === "error" && Boolean(u.available) && !u.dismissed;
    const shouldShow = isBusyStage || hasErrOnToast || (Boolean(u.available) && !u.dismissed);

    if (!shouldShow) {
      updateToastMountEl.innerHTML = "";
      return;
    }

    const tr = t();
    const isTopRightDocked = state.settings.layoutMode === "docked" && state.settings.dockPosition === "top-right";
    updateToastMountEl.className = "update-toast-mount" + (isTopRightDocked ? " is-bottom" : "");

    const verLabel = formatUpdateVersionBadge(u);
    const stageText = formatUpdateStatusLabel(u, tr);
    const commitMsg = u.remote && u.remote.commitMessage ? u.remote.commitMessage : "";
    const title = isBusyStage ? tr.updateToastBusyTitle : tr.updateToastTitle;
    const bodyMsg = isBusyStage ? stageText : (st === "error" ? stageText : (commitMsg ? `${commitMsg} — ${tr.updateToastDesc}` : tr.updateToastDesc));

    updateToastMountEl.innerHTML = `
      <div class="update-toast" role="status" aria-live="polite">
        <div class="update-toast-head">
          <div class="update-toast-title-wrap">
            <span class="update-toast-title">${iconSvg("download", 13)}<span>${escHtml(title)}</span></span>
            <span class="update-toast-ver num">${escHtml(verLabel)}</span>
          </div>
          ${isBusyStage ? "" : `<button type="button" class="icon-btn" data-action="dismiss-update" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 13)}</button>`}
        </div>
        <div class="update-toast-msg">${escHtml(bodyMsg)}</div>
        ${isBusyStage ? `<div class="update-toast-progress"><div class="update-toast-bar"></div></div>` : ""}
        ${isBusyStage ? "" : `
          <div class="update-toast-actions">
            <button type="button" class="btn btn-sm" data-action="dismiss-update">${escHtml(tr.updateBtnLater)}</button>
            <button type="button" class="btn btn-sm btn-primary" data-action="install-update">${iconSvg("download", 12)}${escHtml(st === "error" ? tr.updateBtnRetry : tr.updateBtnNow)}</button>
          </div>
        `}
      </div>
    `;
  }

  function applyUpdateStatus(payload) {
    if (!payload || typeof payload !== "object" || state.destroyed) return;
    const prevAvailable = Boolean(state.update && state.update.available);
    state.update = {
      status: typeof payload.status === "string" ? payload.status : "idle",
      available: Boolean(payload.available),
      dismissed: Boolean(payload.dismissed),
      reason: typeof payload.reason === "string" ? payload.reason : "",
      updateKey: typeof payload.updateKey === "string" ? payload.updateKey : "",
      lastCheckedAt: typeof payload.lastCheckedAt === "number" ? payload.lastCheckedAt : 0,
      error: typeof payload.error === "string" ? payload.error : "",
      installed: payload.installed && typeof payload.installed === "object" ? payload.installed : state.update.installed,
      remote: payload.remote && typeof payload.remote === "object" ? payload.remote : state.update.remote,
    };
    renderUpdateToast();
    if (state.isOpen && ((state.activeTab === "settings" && state.settingsSubTab === "system") || prevAvailable !== state.update.available)) {
      renderStructure();
    }
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

  function isQuotaHiddenEl(el) {
    if (!el || el.nodeType !== 1) return false;
    if (hostEl && (el === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(el)))) return true;
    const tag = String(el.tagName || "").toUpperCase();
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "NOSCRIPT") return true;
    if (typeof el.hasAttribute === "function" && el.hasAttribute("hidden")) return true;
    if (el.hidden === true) return true;
    if (typeof el.getAttribute === "function" && el.getAttribute("aria-hidden") === "true") return true;
    const cls = typeof el.getAttribute === "function"
      ? (el.getAttribute("class") || "")
      : (typeof el.className === "string" ? el.className : "");
    if (cls && /\binvisible\b/.test(cls)) return true;
    if (el.style && (el.style.display === "none" || el.style.visibility === "hidden" || el.style.opacity === "0")) {
      return true;
    }
    return false;
  }

  function collectVisibleQuotaText(node, chunks) {
    if (!node) return;
    if (node.nodeType === 3) {
      const val = node.nodeValue;
      if (val) chunks.push(val);
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    if (node.nodeType === 1 && isQuotaHiddenEl(node)) return;
    const tag = node.nodeType === 1 ? String(node.tagName || "").toUpperCase() : "";
    const cls = node.nodeType === 1
      ? (typeof node.getAttribute === "function" ? (node.getAttribute("class") || "") : (typeof node.className === "string" ? node.className : ""))
      : "";
    const isBlock =
      tag === "DIV" ||
      tag === "P" ||
      tag === "LI" ||
      tag === "SECTION" ||
      tag === "ARTICLE" ||
      tag === "TR" ||
      /^H[1-6]$/.test(tag) ||
      /\b(?:col-span-|block)\b/.test(cls);
    const children = node.childNodes;
    if (children && typeof children.length === "number") {
      for (let i = 0; i < children.length; i += 1) {
        collectVisibleQuotaText(children[i], chunks);
      }
    } else if (typeof node.textContent === "string") {
      chunks.push(node.textContent);
    }
    if (isBlock) {
      chunks.push("\n");
    } else if (tag === "SPAN") {
      chunks.push(" ");
    }
  }

  function findQuotaCirclesContainer(circles) {
    if (!circles || circles.length === 0) return null;
    const ancLists = [];
    for (let i = 0; i < circles.length; i += 1) {
      const c = circles[i];
      if (!c || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(c))) continue;
      if (typeof c.closest === "function") {
        const directBox = c.closest('.agy-overlay, [role="dialog"], [role="menu"]');
        if (directBox && !(hostEl && typeof hostEl.contains === "function" && hostEl.contains(directBox))) {
          return directBox;
        }
      }
      const chain = [];
      let cur = c.parentNode;
      while (cur && cur !== doc) {
        chain.push(cur);
        cur = cur.parentNode;
      }
      ancLists.push(chain);
    }
    if (ancLists.length === 0) return null;
    if (ancLists.length === 1) {
      let cur = ancLists[0][0] || null;
      for (let step = 0; step < 5 && cur && cur.parentNode && cur.parentNode !== doc.body && cur.parentNode !== doc; step += 1) {
        cur = cur.parentNode;
      }
      return cur;
    }
    const first = ancLists[0];
    for (let i = 0; i < first.length; i += 1) {
      const candidate = first[i];
      if (!candidate || candidate === doc.body || candidate === doc.documentElement) continue;
      if (ancLists.every((lst) => lst.indexOf(candidate) !== -1)) {
        return candidate;
      }
    }
    return doc.body;
  }

  function scrapeDomQuotaSnapshot(force) {
    if (!doc || !doc.body) return;
    const now = Date.now();
    try {
      const circles = typeof doc.querySelectorAll === "function"
        ? doc.querySelectorAll('[data-testid="quota-progress-circle"]')
        : null;
      const hasCircles = Boolean(circles && circles.length > 0);
      const minInterval = hasCircles ? 600 : 4000;
      if (!force && now - state.lastQuotaScrapeAt < minInterval) return;
      state.lastQuotaScrapeAt = now;

      let txt = "";
      if (hasCircles) {
        const box = findQuotaCirclesContainer(circles);
        if (box) {
          const chunks = [];
          collectVisibleQuotaText(box, chunks);
          txt = chunks.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
        }
      } else if (typeof doc.querySelectorAll === "function") {
        const overlays = doc.querySelectorAll('[role="dialog"], .agy-overlay');
        for (let i = 0; overlays && i < overlays.length; i += 1) {
          const ov = overlays[i];
          if (!ov || (hostEl && typeof hostEl.contains === "function" && hostEl.contains(ov))) continue;
          const chunks = [];
          collectVisibleQuotaText(ov, chunks);
          const candidateTxt = chunks.join("").replace(/[ \t]+\n/g, "\n").trim();
          if (candidateTxt && /limit\s*remaining|weekly\s*limit|five\s*hour|5[-\s]*hour|5h\s+limit|лимит\s*\(\s*5\s*ч\s*\)|остаток\s*(?:недельн|5|пяти)|недельн[а-яё]*\s*лимит|5[-\s]*часов|%\s*(?:left|осталось)/i.test(candidateTxt)) {
            txt = candidateTxt;
            break;
          }
        }
      }

      if (!txt || txt.length < 20) return;
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

  function spNeedsRuThinking(str) {
    const s = String(str || "").trim();
    if (s.length < 3 || s.length > 6000) return false;
    if (/^https?:\/\/\S+$/i.test(s)) return false;
    if (/^[A-Za-z]:\\[^\s]+$/i.test(s) || /^\/[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/.test(s)) return false;
    if (!/\s/.test(s) && /[\\/_=()[\]{}<>`]/.test(s)) return false;
    const latin = s.match(/[A-Za-z]/g);
    const latinCount = latin ? latin.length : 0;
    if (latinCount < 3) return false;
    const cyr = s.match(/[\u0410-\u042f\u0430-\u044f\u0401\u0451]/g);
    const cyrCount = cyr ? cyr.length : 0;
    return cyrCount / (latinCount + cyrCount) < 0.35;
  }

  function wrapEdgeSpaces(orig, translated) {
    const raw = String(orig || "");
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
    if (!m) return String(translated || "");
    return m[1] + String(translated || "").trim() + m[3];
  }

  function setThinkingCacheEntry(key, val) {
    if (thinkingCache.has(key)) thinkingCache.delete(key);
    thinkingCache.set(key, val);
    while (thinkingCache.size > 500) {
      const oldest = thinkingCache.keys().next().value;
      thinkingCache.delete(oldest);
    }
  }

  function applyThinkingNodeValue(node, nextVal) {
    if (!node || node.nodeValue === nextVal) return;
    isApplyingThinkingTranslation = true;
    try {
      node.nodeValue = nextVal;
    } finally {
      isApplyingThinkingTranslation = false;
    }
    if (!state.telemetry.isGenerating) {
      state.hydrationIgnoreUntil = Math.max(state.hydrationIgnoreUntil || 0, nowHiRes() + 700);
    }
  }

  function findThinkingContentSibling(container, afterEl) {
    if (!container || !container.children || typeof container.children.length !== "number") return null;
    const children = container.children;
    let startIdx = -1;
    for (let i = 0; i < children.length; i += 1) {
      if (children[i] === afterEl) {
        startIdx = i + 1;
        break;
      }
    }
    if (startIdx < 0 || startIdx >= children.length) return null;

    for (let i = startIdx; i < children.length; i += 1) {
      const ch = children[i];
      if (!ch || (hostEl && (ch === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(ch))))) continue;
      const tag = String(ch.tagName || "").toUpperCase();
      if (tag === "BUTTON" || tag === "SVG" || tag === "STYLE") continue;
      const cls = typeof ch.getAttribute === "function" ? (ch.getAttribute("class") || "") : (typeof ch.className === "string" ? ch.className : "");
      if (/\b(?:overflow-y-auto|bleed-contain)\b/.test(cls)) return ch;
    }

    for (let i = startIdx; i < children.length; i += 1) {
      const ch = children[i];
      if (!ch || (hostEl && (ch === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(ch))))) continue;
      if (typeof ch.getAttribute === "function" && ch.getAttribute("data-rudex-ignore")) continue;
      const tag = String(ch.tagName || "").toUpperCase();
      if (tag === "BUTTON" || tag === "SVG" || tag === "STYLE" || tag === "INPUT" || tag === "TEXTAREA") continue;
      if (ch.childNodes && ch.childNodes.length > 0) return ch;
    }
    return null;
  }

  function findExpandedThinkingPanels() {
    if (!doc || typeof doc.querySelectorAll !== "function") return [];
    const panels = [];
    const seen = new Set();
    try {
      const triggers = doc.querySelectorAll(
        'button[data-testid="thinking-collapsible-trigger"][aria-expanded="true"], button[aria-expanded="true"][aria-label]'
      );
      for (let i = 0; triggers && i < triggers.length; i += 1) {
        const btn = triggers[i];
        if (!btn || (hostEl && (btn === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(btn))))) continue;
        const testId = typeof btn.getAttribute === "function" ? (btn.getAttribute("data-testid") || "") : "";
        if (testId !== "thinking-collapsible-trigger") {
          const aria = typeof btn.getAttribute === "function" ? (btn.getAttribute("aria-label") || "").trim() : "";
          if (!/^(?:Thought\s+for\b|Thought\s+Process\b|Thinking\b|Думал\b|Размышлял\b|Процесс\s+мышления\b|Размышлени)/i.test(aria)) {
            continue;
          }
        }
        const parent = btn.parentNode;
        let panel = findThinkingContentSibling(parent, btn);
        if (!panel && parent && parent !== doc.body && parent !== doc.documentElement && parent.parentNode) {
          panel = findThinkingContentSibling(parent.parentNode, parent);
        }
        if (panel && !seen.has(panel)) {
          seen.add(panel);
          panels.push(panel);
        }
      }
    } catch (_e) {}
    return panels;
  }

  function collectTranslatableThinkingNodes(node, out) {
    if (!node) return;
    if (node.nodeType === 3) {
      const val = node.nodeValue || "";
      if (val.trim()) out.push(node);
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    if (node.nodeType === 1) {
      if (hostEl && (node === hostEl || (typeof hostEl.contains === "function" && hostEl.contains(node)))) return;
      if (typeof node.getAttribute === "function" && node.getAttribute("data-rudex-ignore")) return;
      const tag = String(node.tagName || "").toUpperCase();
      if (
        tag === "CODE" ||
        tag === "PRE" ||
        tag === "KBD" ||
        tag === "SAMP" ||
        tag === "SCRIPT" ||
        tag === "STYLE" ||
        tag === "SVG" ||
        tag === "NOSCRIPT" ||
        tag === "BUTTON" ||
        tag === "TEXTAREA" ||
        tag === "INPUT"
      ) {
        return;
      }
    }
    const children = node.childNodes;
    if (children && typeof children.length === "number") {
      for (let i = 0; i < children.length; i += 1) {
        collectTranslatableThinkingNodes(children[i], out);
      }
    }
  }

  function restoreAllThinkingNodes() {
    if (thinkingScanTimer && win && typeof win.clearTimeout === "function") {
      win.clearTimeout(thinkingScanTimer);
      thinkingScanTimer = null;
    }
    if (trackedThinkingNodes.size === 0) return;
    isApplyingThinkingTranslation = true;
    try {
      trackedThinkingNodes.forEach((tn) => {
        const rec = thinkingNodeMap.get(tn);
        if (rec && rec.translated && tn.nodeValue === rec.translated) {
          tn.nodeValue = rec.orig;
          rec.translated = "";
        }
      });
      trackedThinkingNodes.clear();
    } finally {
      isApplyingThinkingTranslation = false;
    }
  }

  function scheduleThinkingScan(delayMs) {
    if (state.destroyed || !state.mounted || !state.settings.thinkingInRussian) return;
    if (!win || typeof win.setTimeout !== "function") {
      scanThinkingBlocks(false);
      return;
    }
    if (thinkingScanTimer) return;
    thinkingScanTimer = win.setTimeout(() => {
      thinkingScanTimer = null;
      if (!state.destroyed && state.mounted) scanThinkingBlocks(false);
    }, typeof delayMs === "number" ? delayMs : 140);
  }

  function scanThinkingBlocks(immediate) {
    if (state.destroyed || !doc) return;
    if (!state.settings.thinkingInRussian) {
      restoreAllThinkingNodes();
      return;
    }
    const panels = findExpandedThinkingPanels();
    if (panels.length === 0) return;

    const nodes = [];
    for (let i = 0; i < panels.length; i += 1) {
      collectTranslatableThinkingNodes(panels[i], nodes);
    }
    if (nodes.length === 0) return;

    const now = Date.now();
    const isGen = Boolean(state.telemetry && state.telemetry.isGenerating);
    const activeRespEl = state.telemetry ? state.telemetry.activeRespEl : null;
    const batch = [];
    const nodeGroups = new Map();
    let needsFollowup = false;
    let remainingReady = false;

    for (let i = 0; i < nodes.length; i += 1) {
      const tn = nodes[i];
      const curVal = tn.nodeValue || "";
      let rec = thinkingNodeMap.get(tn);
      if (rec && rec.translated && curVal === rec.translated) {
        continue;
      }
      if (!rec || curVal !== rec.orig) {
        rec = { orig: curVal, translated: "", stableSince: now };
        thinkingNodeMap.set(tn, rec);
      }
      const core = curVal.trim();
      if (!spNeedsRuThinking(core)) continue;

      if (thinkingCache.has(core)) {
        const cached = thinkingCache.get(core);
        setThinkingCacheEntry(core, cached);
        const full = wrapEdgeSpaces(curVal, cached);
        applyThinkingNodeValue(tn, full);
        rec.translated = full;
        trackedThinkingNodes.add(tn);
        continue;
      }

      if (thinkingInflight.has(core)) continue;

      const insideActiveResp = Boolean(
        activeRespEl && typeof activeRespEl.contains === "function" && activeRespEl.contains(tn)
      );
      const isReady = Boolean(immediate || !isGen || !insideActiveResp || now - rec.stableSince >= 420);
      if (!isReady) {
        needsFollowup = true;
        continue;
      }

      if (!nodeGroups.has(core)) {
        if (batch.length >= 10) {
          remainingReady = true;
          continue;
        }
        batch.push(core);
        nodeGroups.set(core, []);
      }
      nodeGroups.get(core).push(tn);
    }

    if (batch.length > 0) {
      for (let i = 0; i < batch.length; i += 1) thinkingInflight.add(batch[i]);
      invokeIpc("agy-studio:translate-thinking-batch", { texts: batch }).then((res) => {
        for (let i = 0; i < batch.length; i += 1) thinkingInflight.delete(batch[i]);
        if (state.destroyed || !state.settings.thinkingInRussian) return;
        const map = res && res.translations && typeof res.translations === "object" ? res.translations : null;
        if (map) {
          for (let i = 0; i < batch.length; i += 1) {
            const core = batch[i];
            const trText = map[core];
            if (typeof trText !== "string" || !trText.trim()) continue;
            setThinkingCacheEntry(core, trText);
            const list = nodeGroups.get(core) || [];
            for (let j = 0; j < list.length; j += 1) {
              const tn = list[j];
              const rec = thinkingNodeMap.get(tn);
              if (!rec) continue;
              if ((tn.nodeValue || "") !== rec.orig) continue;
              const full = wrapEdgeSpaces(rec.orig, trText);
              applyThinkingNodeValue(tn, full);
              rec.translated = full;
              trackedThinkingNodes.add(tn);
            }
          }
        }
        if (remainingReady) scheduleThinkingScan(60);
      });
    } else if (needsFollowup) {
      scheduleThinkingScan(460);
    }
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
    if (state.settings.thinkingInRussian) scanThinkingBlocks(false);
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

  function refreshMediaLibrary() {
    return invokeIpc("agy-studio:list-media").then((res) => {
      if (state.destroyed) return;
      if (res && res.ok && Array.isArray(res.items)) {
        state.mediaLibrary = res.items.slice(0, 20);
        if (state.isOpen && state.activeTab === "appearance" && state.appearanceSubTab === "wallpaper") {
          renderStructure();
        }
      }
    });
  }

  function cleanupTempUploadedMedia() {
    if (!Array.isArray(state.tempUploadedMediaFiles) || state.tempUploadedMediaFiles.length === 0) return;
    const savedFile = state.settings.appearance && state.settings.appearance.wallpaper ? state.settings.appearance.wallpaper.mediaFile : "";
    const list = state.tempUploadedMediaFiles.slice();
    state.tempUploadedMediaFiles = [];
    for (let i = 0; i < list.length; i += 1) {
      const f = list[i];
      if (f && f !== savedFile) {
        invokeIpc("agy-studio:delete-media", { fileName: f });
      }
    }
  }

  function spBuildWallpaperFilterCss(wp) {
    const parts = [];
    if (wp.blur > 0) parts.push(`blur(${wp.blur}px)`);
    if (wp.brightness !== 100) parts.push(`brightness(${wp.brightness}%)`);
    if (wp.contrast !== 100) parts.push(`contrast(${wp.contrast}%)`);
    if (wp.saturate !== 100) parts.push(`saturate(${wp.saturate}%)`);
    if (wp.hue !== 0) parts.push(`hue-rotate(${wp.hue}deg)`);
    return parts.length > 0 ? parts.join(" ") : "none";
  }

  function spBuildWallpaperTransformCss(wp) {
    const effScale = wp.blur > 0 ? Math.max(wp.scale / 100, 1.06) : (wp.scale / 100);
    const parts = [];
    if (wp.offsetX !== 0 || wp.offsetY !== 0) parts.push(`translate3d(${wp.offsetX}%, ${wp.offsetY}%, 0)`);
    if (wp.rotate !== 0) parts.push(`rotate(${wp.rotate}deg)`);
    if (wp.flipX || wp.flipY) {
      const sx = wp.flipX ? -effScale : effScale;
      const sy = wp.flipY ? -effScale : effScale;
      parts.push(`scale(${sx.toFixed(2)}, ${sy.toFixed(2)})`);
    } else if (Math.abs(effScale - 1) > 0.001) {
      parts.push(`scale(${effScale.toFixed(2)})`);
    }
    return parts.length > 0 ? parts.join(" ") : "none";
  }

  function spBuildGradientPreviewCss(wp) {
    const c1 = (wp.gradColors && wp.gradColors[0]) || "#0f172a";
    const c2 = (wp.gradColors && wp.gradColors[1]) || "#1e1b4b";
    const c3 = (wp.gradColors && wp.gradColors[2]) || "#09090b";
    if (wp.gradStyle === "radial") return `radial-gradient(circle at ${wp.posX}% ${wp.posY}%, ${c1} 0%, ${c2} 52%, ${c3} 100%)`;
    if (wp.gradStyle === "mesh") return `radial-gradient(at 25% 25%, ${c1} 0px, transparent 58%), radial-gradient(at 78% 72%, ${c2} 0px, transparent 60%), radial-gradient(at 50% 90%, ${c1} 0px, ${c3} 72%)`;
    return `linear-gradient(${wp.gradAngle}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`;
  }

  function updateLiveWallpaperPreviewDom() {
    if (!modalMountEl) return;
    const wp = spNormalizeAppearance(state.appearanceDraft).wallpaper;
    const mediaEl = modalMountEl.querySelector('[data-wp-role="media"]');
    if (mediaEl) {
      const posStr = `${wp.posX}% ${wp.posY}%`;
      mediaEl.style.objectFit = wp.fit || "cover";
      mediaEl.style.objectPosition = posStr;
      mediaEl.style.transformOrigin = posStr;
      mediaEl.style.filter = spBuildWallpaperFilterCss(wp);
      mediaEl.style.opacity = String(wp.opacity / 100);
      mediaEl.style.transform = spBuildWallpaperTransformCss(wp);
      if (mediaEl.tagName === "VIDEO") {
        try { mediaEl.playbackRate = wp.playbackRate || 1; } catch (_e) {}
      }
    }
    const dot = modalMountEl.querySelector('[data-wp-role="focusDot"]');
    if (dot) {
      dot.style.left = `${wp.posX}%`;
      dot.style.top = `${wp.posY}%`;
    }
    const scrim = modalMountEl.querySelector('[data-wp-role="scrim"]');
    if (scrim) {
      scrim.style.backgroundColor = `rgba(6, 7, 10, ${wp.dim / 100})`;
    }
    const vig = modalMountEl.querySelector('[data-wp-role="vignette"]');
    if (vig) {
      const innerStop = Math.max(15, 65 - Math.round(wp.vignette * 0.45));
      vig.style.backgroundImage = wp.vignette > 0
        ? `radial-gradient(ellipse at center, transparent ${innerStop}%, rgba(0, 0, 0, ${(wp.vignette / 100).toFixed(2)}) 100%)`
        : "none";
    }
    const tint = modalMountEl.querySelector('[data-wp-role="tint"]');
    if (tint) {
      tint.style.backgroundImage = wp.tintEnabled ? spBuildGradientPreviewCss(wp) : "none";
      tint.style.opacity = wp.tintEnabled ? String(wp.tintOpacity / 100) : "0";
      tint.style.mixBlendMode = wp.tintBlend || "normal";
    }
    const hud = modalMountEl.querySelector('[data-wp-role="hudCoords"]');
    if (hud) {
      hud.textContent = state.wpDragMode === "offset"
        ? `dX:${wp.offsetX}% · dY:${wp.offsetY}% · ${wp.scale}%`
        : `X:${wp.posX}% · Y:${wp.posY}% · ${wp.scale}%`;
    }
  }

  function updateLiveCornersPreviewDom() {
    if (!modalMountEl) return;
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const c = typeof teResolveCornerRadii === "function"
      ? teResolveCornerRadii(draft)
      : {
          messages: draft.corners.mode === "custom" ? draft.corners.messages : draft.corners.all,
          composer: draft.corners.mode === "custom" ? draft.corners.composer : draft.corners.all,
          buttons: draft.corners.mode === "custom" ? draft.corners.buttons : draft.corners.all,
          cards: draft.corners.mode === "custom" ? draft.corners.cards : draft.corners.all,
          code: draft.corners.mode === "custom" ? draft.corners.code : draft.corners.all,
          sidebar: draft.corners.mode === "custom" ? draft.corners.sidebar : draft.corners.all,
          overlays: draft.corners.mode === "custom" ? draft.corners.overlays : draft.corners.all,
          inputs: draft.corners.mode === "custom" ? draft.corners.inputs : draft.corners.all,
        };
    const setRad = (sel, val) => {
      const list = modalMountEl.querySelectorAll(sel);
      for (let i = 0; i < list.length; i += 1) list[i].style.borderRadius = `${val}px`;
    };
    setRad('[data-cp-role="sidebar"]', Math.min(18, c.sidebar));
    setRad('[data-cp-role="nav"]', Math.max(0, c.sidebar - 2));
    setRad('[data-cp-role="bubble"]', c.messages);
    setRad('[data-cp-role="card"]', c.cards);
    setRad('[data-cp-role="code"]', c.code);
    setRad('[data-cp-role="composer"]', c.composer);
    setRad('[data-cp-role="btn"]', c.buttons);
    setRad('[data-cp-role="popup"]', c.overlays);
    setRad('[data-cp-role="input"]', c.inputs);
  }

  function formatSparkFootMeta(tel, tr) {
    const parts = [];
    if (tel.exactCacheTokens > 0) parts.push(`${tr.cacheLabel}: ${formatCompact(tel.exactCacheTokens)}`);
    if (tel.lastDurSec > 0) parts.push(`${tel.lastDurSec}${tr.secUnit}`);
    if (tel.lastThinkingSec > 0) parts.push(`${tel.lastThinkingSec}${tr.secUnit} ${tr.thinkUnit}`);
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
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const gd = spNormalizeGreeting(state.greetingDraft);
    const presetObj = spFindThemePreset(draft.presetId);
    const wp = draft.wallpaper;
    const grads = spGetGradientPresets();
    const cRadii = typeof teResolveCornerRadii === "function" ? teResolveCornerRadii(draft) : draft.corners;

    const subTabs = [
      { id: "theme", label: tr.appSubTheme },
      { id: "wallpaper", label: tr.appSubWallpaper },
      { id: "corners", label: tr.appSubCorners },
      { id: "surface", label: tr.appSubSurface },
      { id: "greeting", label: tr.appSubGreeting },
      { id: "text", label: tr.appSubText },
    ];

    const themeLabel = presetObj ? (isRu ? presetObj.nameRu : presetObj.nameEn) : draft.presetId;
    const effAccent = draft.customAccent ? draft.accentColor : ((presetObj && presetObj.vars && presetObj.vars.accentColor) || draft.accentColor);
    const wpMap = { none: tr.appWpNone, gradient: tr.appWpGradient, image: tr.appWpImage, video: tr.appWpVideo };
    let wpLabel = wpMap[wp.type] || tr.appWpNone;
    if (wp.type === "gradient") {
      const gp = grads.find((g) => g.id === wp.gradientPreset);
      if (gp) wpLabel = isRu ? gp.nameRu : gp.nameEn;
    } else if ((wp.type === "image" || wp.type === "video") && wp.tintEnabled) {
      wpLabel += ` + ${tr.appWpGradient}`;
    }
    const cornersLabel = draft.corners.mode === "custom" ? tr.cornersModeCustom.split(" ")[0] : `${cRadii.base}px`;
    const styleLabelMap = { glass: tr.appMsgStyleGlass, solid: tr.appMsgStyleSolid, minimal: tr.appMsgStyleMinimal };
    const surfaceLabel = `${styleLabelMap[draft.messageStyle] || tr.appMsgStyleGlass} · ${draft.glassOpacity}%`;

    let inner = "";
    if (sub === "theme") inner = renderAppearanceThemeSub(tr, isRu);
    else if (sub === "wallpaper") inner = renderAppearanceWallpaperSub(tr, isRu);
    else if (sub === "corners") inner = renderAppearanceCornersSub(tr, isRu);
    else if (sub === "surface") inner = renderAppearanceSurfaceSub(tr, isRu);
    else if (sub === "greeting") inner = renderAppearanceGreetingSub(tr, isRu);
    else inner = renderAppearanceTextSub(tr, isRu);

    return `
      <div class="layer-summary-strip">
        <button type="button" class="layer-pill${sub === "theme" ? " is-active" : ""}" data-action="set-app-subtab" data-val="theme">
          <span class="layer-dot" style="background:${escAttr(effAccent)}"></span>
          <span>${escHtml(tr.appLayerTheme)}: ${escHtml(themeLabel)}</span>
        </button>
        <button type="button" class="layer-pill${sub === "wallpaper" ? " is-active" : ""}" data-action="set-app-subtab" data-val="wallpaper">
          <span>${escHtml(tr.appLayerWallpaper)}: ${escHtml(wpLabel)}</span>
        </button>
        <button type="button" class="layer-pill${sub === "corners" ? " is-active" : ""}" data-action="set-app-subtab" data-val="corners">
          <span>${escHtml(tr.appLayerCorners)}: ${escHtml(cornersLabel)}</span>
        </button>
        <button type="button" class="layer-pill${sub === "surface" ? " is-active" : ""}" data-action="set-app-subtab" data-val="surface">
          <span>${escHtml(tr.appLayerSurface)}: ${escHtml(surfaceLabel)}</span>
        </button>
        <button type="button" class="layer-pill${sub === "greeting" ? " is-active" : ""}" data-action="set-app-subtab" data-val="greeting">
          <span>${escHtml(tr.appLayerGreeting)}: ${escHtml(gd.enabled ? tr.personaActiveTag : tr.personaOffTag)}</span>
        </button>
      </div>
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
    const curPreset = spFindThemePreset(draft.presetId);
    const effAccent = draft.customAccent
      ? draft.accentColor
      : ((curPreset && curPreset.vars && curPreset.vars.accentColor) || draft.accentColor);
    const fineOpen = Boolean(state.openDisclosures.themeFine);
    const profiles = state.settings.appearanceProfiles || [];

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
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span class="section-label">${escHtml(tr.appAccentQuick)}</span>
          ${draft.customAccent ? `<button type="button" class="btn btn-sm btn-ghost" style="padding:2px 7px;font-size:11px" data-action="reset-custom-accent">${escHtml(tr.appAccentReset)}</button>` : ""}
        </div>
        <div class="accent-row">
          ${CURATED_ACCENTS.map((hex) => `
            <button type="button" class="accent-dot-btn${effAccent.toLowerCase() === hex ? " is-selected" : ""}" data-action="pick-accent-dot" data-val="${hex}" style="background:${hex}" aria-label="${hex}"></button>
          `).join("")}
          <label class="color-box" style="margin-left:auto">
            <span>${escHtml(tr.appCustomColor)}</span>
            <input type="color" class="color-input" data-app-field="accentColor" value="${escAttr(effAccent)}"/>
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
          <div class="card">
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appPolishLabel)}</span>
              <button type="button" class="switch${draft.uiPolish ? " is-on" : ""}" role="switch" aria-checked="${draft.uiPolish ? "true" : "false"}" data-action="toggle-appearance-polish"><span class="switch-thumb"></span></button>
            </div>
          </div>
        </div>
      </details>

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
    const gradFineOpen = Boolean(state.openDisclosures.gradFine);
    const colorOpen = state.openDisclosures.wpColor !== false;

    let modeBody = "";
    if (wp.type === "none") {
      modeBody = `<div class="empty-msg">${escHtml(tr.appWpNoneHint)}</div>`;
    } else if (wp.type === "gradient") {
      const gradStyles = [
        { id: "linear", label: tr.appGradLinear },
        { id: "radial", label: tr.appGradRadial },
        { id: "mesh", label: tr.appGradMesh },
      ];
      modeBody = `
        <div class="section-group">
          <span class="section-label">${escHtml(tr.appGradStyleLabel)}</span>
          <div class="subtab-bar">
            ${gradStyles.map((gs) => `
              <button type="button" class="subtab-btn${wp.gradStyle === gs.id ? " is-active" : ""}" data-action="set-wallpaper-grad-style" data-val="${gs.id}">${escHtml(gs.label)}</button>
            `).join("")}
          </div>
        </div>
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
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpSaturate)}</span><b class="num" data-live-app-val="wallpaper.saturate">${wp.saturate}%</b></div>
            <input type="range" class="range-input" min="0" max="200" step="5" data-app-field="wallpaper.saturate" value="${wp.saturate}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpVignette)}</span><b class="num" data-live-app-val="wallpaper.vignette">${wp.vignette}%</b></div>
            <input type="range" class="range-input" min="0" max="90" step="5" data-app-field="wallpaper.vignette" value="${wp.vignette}"/>
          </div>
        </div>
        <details class="rx-details" data-disc="gradFine"${gradFineOpen ? " open" : ""}>
          <summary>${escHtml(tr.appGradFineTitle)}</summary>
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
      const resolvedUrl = wp.mediaUrl ? resolveStudioMediaUrl(wp.mediaFile, wp.mediaUrl) : "";
      const filterCss = spBuildWallpaperFilterCss(wp);
      const transformCss = spBuildWallpaperTransformCss(wp);
      const posStr = `${wp.posX}% ${wp.posY}%`;
      const anchors = [
        [0, 0], [50, 0], [100, 0],
        [0, 50], [50, 50], [100, 50],
        [0, 100], [50, 100], [100, 100],
      ];
      const fits = [
        { id: "cover", label: tr.appWpFitCover },
        { id: "contain", label: tr.appWpFitContain },
        { id: "fill", label: tr.appWpFitFill },
      ];
      const blends = [
        { id: "normal", label: tr.appWpBlendNormal },
        { id: "multiply", label: tr.appWpBlendMultiply },
        { id: "screen", label: tr.appWpBlendScreen },
        { id: "overlay", label: tr.appWpBlendOverlay },
        { id: "soft-light", label: tr.appWpBlendSoftLight },
      ];
      const mediaItems = (state.mediaLibrary || []).filter((m) => (isVid ? m.kind === "video" : m.kind === "image"));
      const vigInner = Math.max(15, 65 - Math.round(wp.vignette * 0.45));
      const hudTxt = state.wpDragMode === "offset"
        ? `dX:${wp.offsetX}% · dY:${wp.offsetY}% · ${wp.scale}%`
        : `X:${wp.posX}% · Y:${wp.posY}% · ${wp.scale}%`;

      modeBody = `
        <div class="media-file-bar">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
            <button type="button" class="btn btn-sm btn-primary" data-action="pick-media" data-kind="${isVid ? "video" : "image"}">${iconSvg("upload", 12)}${escHtml(isVid ? tr.appWpPickVideo : tr.appWpPickImage)}</button>
            <span style="font-size:11px;color:${wp.mediaFile ? "var(--rx-fg-strong)" : "var(--rx-muted)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(wp.mediaFile || tr.appWpNoFileHint)}</span>
          </div>
          ${wp.mediaUrl ? `<button type="button" class="btn btn-sm" data-action="clear-wallpaper-media">${escHtml(tr.appWpClearMedia)}</button>` : ""}
        </div>

        ${resolvedUrl ? `
          <div class="wp-stage-wrap">
            <div class="wp-stage-canvas" data-wp-stage="1" title="${escAttr(tr.appWpDragHint)}">
              ${isVid
                ? `<video class="wp-stage-media" data-wp-role="media" src="${escAttr(resolvedUrl)}" autoplay muted loop playsinline style="object-fit:${escAttr(wp.fit)};object-position:${posStr};transform-origin:${posStr};filter:${escAttr(filterCss)};opacity:${wp.opacity / 100};transform:${escAttr(transformCss)}"></video>`
                : `<img class="wp-stage-media" data-wp-role="media" src="${escAttr(resolvedUrl)}" alt="" style="object-fit:${escAttr(wp.fit)};object-position:${posStr};transform-origin:${posStr};filter:${escAttr(filterCss)};opacity:${wp.opacity / 100};transform:${escAttr(transformCss)}"/>`}
              <div class="wp-stage-tint" data-wp-role="tint" style="background-image:${wp.tintEnabled ? escAttr(spBuildGradientPreviewCss(wp)) : "none"};opacity:${wp.tintEnabled ? wp.tintOpacity / 100 : 0};mix-blend-mode:${escAttr(wp.tintBlend || "normal")}"></div>
              <div class="wp-stage-vignette" data-wp-role="vignette" style="background-image:${wp.vignette > 0 ? `radial-gradient(ellipse at center, transparent ${vigInner}%, rgba(0, 0, 0, ${(wp.vignette / 100).toFixed(2)}) 100%)` : "none"}"></div>
              <div class="wp-stage-scrim" data-wp-role="scrim" style="background-color:rgba(6, 7, 10, ${wp.dim / 100})"></div>
              <div class="wp-stage-grid"></div>
              <div class="wp-focus-dot" data-wp-role="focusDot" style="left:${wp.posX}%;top:${wp.posY}%"></div>
              <div class="wp-stage-hud">
                <span class="wp-hud-pill num" data-wp-role="hudCoords">${escHtml(hudTxt)}</span>
                <div style="display:flex;gap:4px">
                  <button type="button" class="wp-hud-btn${state.wpDragMode === "crop" ? " is-active" : ""}" data-action="set-wp-drag-mode" data-val="crop">${escHtml(tr.appWpDragCrop)}</button>
                  <button type="button" class="wp-hud-btn${state.wpDragMode === "offset" ? " is-active" : ""}" data-action="set-wp-drag-mode" data-val="offset">${escHtml(tr.appWpDragOffset)}</button>
                </div>
              </div>
            </div>
            <div class="wp-side-controls">
              <div>
                <div class="section-label" style="margin-bottom:5px">${escHtml(tr.appWpAnchorTitle)}</div>
                <div class="wp-anchor-grid">
                  ${anchors.map(([ax, ay]) => `
                    <button type="button" class="wp-anchor-dot${wp.posX === ax && wp.posY === ay ? " is-active" : ""}" data-action="set-wp-anchor" data-x="${ax}" data-y="${ay}" aria-label="${ax}% ${ay}%"></button>
                  `).join("")}
                </div>
              </div>
              <div class="wp-tool-row">
                <button type="button" class="wp-tool-btn" data-action="wp-rotate-step" data-delta="-90" title="-90°">${iconSvg("rotateLeft", 12)}</button>
                <button type="button" class="wp-tool-btn" data-action="wp-rotate-step" data-delta="90" title="+90°">${iconSvg("rotateRight", 12)}</button>
                <button type="button" class="wp-tool-btn${wp.flipX ? " is-active" : ""}" data-action="wp-toggle-flip" data-axis="x" title="Flip X">${iconSvg("flipH", 12)}</button>
                <button type="button" class="wp-tool-btn${wp.flipY ? " is-active" : ""}" data-action="wp-toggle-flip" data-axis="y" title="Flip Y">${iconSvg("flipV", 12)}</button>
                <button type="button" class="wp-tool-btn" style="flex-basis:100%" data-action="wp-reset-transform">${escHtml(tr.appWpResetFrame)}</button>
              </div>
            </div>
          </div>
        ` : `
          <div class="wp-stage-canvas is-empty" data-action="pick-media" data-kind="${isVid ? "video" : "image"}">
            ${iconSvg("image", 24)}
            <span class="row-desc" style="text-align:center;max-width:260px">${escHtml(tr.appWpStageEmptyHint)}</span>
          </div>
        `}

        ${mediaItems.length > 0 ? `
          <div class="section-group">
            <span class="section-label">${escHtml(tr.appWpGalleryTitle)}</span>
            <div class="wp-gallery-strip">
              ${mediaItems.map((it) => `
                <button type="button" class="wp-gallery-thumb${wp.mediaFile === it.fileName ? " is-selected" : ""}" data-action="select-library-media" data-file="${escAttr(it.fileName)}" data-url="${escAttr(it.mediaUrl)}" data-mime="${escAttr(it.mime)}" data-kind="${escAttr(it.kind)}" title="${escAttr(it.fileName)}">
                  ${it.kind === "video"
                    ? iconSvg("upload", 14)
                    : `<img src="${escAttr(resolveStudioMediaUrl(it.fileName, it.mediaUrl))}" alt=""/>`}
                </button>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <div class="subtab-bar">
          ${fits.map((ft) => `
            <button type="button" class="subtab-btn${wp.fit === ft.id ? " is-active" : ""}" data-action="set-wp-fit" data-val="${ft.id}">${escHtml(ft.label)}</button>
          `).join("")}
        </div>

        <div class="section-group">
          <span class="section-label">${escHtml(tr.appWpAtmosTitle)}</span>
          <div class="wp-atmos-grid">
            ${WALLPAPER_ATMOS_PRESETS.map((ap) => `
              <button type="button" class="btn btn-sm" data-action="apply-wp-atmos" data-id="${escAttr(ap.id)}">${escHtml(isRu ? ap.nameRu : ap.nameEn)}</button>
            `).join("")}
          </div>
        </div>

        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpScale)}</span><b class="num" data-live-app-val="wallpaper.scale">${wp.scale}%</b></div>
            <input type="range" class="range-input" min="50" max="250" step="1" data-app-field="wallpaper.scale" value="${wp.scale}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpRotate)}</span><b class="num" data-live-app-val="wallpaper.rotate">${wp.rotate}°</b></div>
            <input type="range" class="range-input" min="-180" max="180" step="1" data-app-field="wallpaper.rotate" value="${wp.rotate}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpPosX)}</span><b class="num" data-live-app-val="wallpaper.posX">${wp.posX}%</b></div>
            <input type="range" class="range-input" min="0" max="100" step="1" data-app-field="wallpaper.posX" value="${wp.posX}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpPosY)}</span><b class="num" data-live-app-val="wallpaper.posY">${wp.posY}%</b></div>
            <input type="range" class="range-input" min="0" max="100" step="1" data-app-field="wallpaper.posY" value="${wp.posY}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpOffsetX)}</span><b class="num" data-live-app-val="wallpaper.offsetX">${wp.offsetX}%</b></div>
            <input type="range" class="range-input" min="-50" max="50" step="1" data-app-field="wallpaper.offsetX" value="${wp.offsetX}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.appWpOffsetY)}</span><b class="num" data-live-app-val="wallpaper.offsetY">${wp.offsetY}%</b></div>
            <input type="range" class="range-input" min="-50" max="50" step="1" data-app-field="wallpaper.offsetY" value="${wp.offsetY}"/>
          </div>
        </div>

        <details class="rx-details" data-disc="wpColor"${colorOpen ? " open" : ""}>
          <summary>${escHtml(tr.appWpColorTitle)}</summary>
          <div class="rx-details-body">
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
                <div class="slider-head"><span>${escHtml(tr.appWpVignette)}</span><b class="num" data-live-app-val="wallpaper.vignette">${wp.vignette}%</b></div>
                <input type="range" class="range-input" min="0" max="90" step="2" data-app-field="wallpaper.vignette" value="${wp.vignette}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpBrightness)}</span><b class="num" data-live-app-val="wallpaper.brightness">${wp.brightness}%</b></div>
                <input type="range" class="range-input" min="40" max="160" step="2" data-app-field="wallpaper.brightness" value="${wp.brightness}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpContrast)}</span><b class="num" data-live-app-val="wallpaper.contrast">${wp.contrast}%</b></div>
                <input type="range" class="range-input" min="50" max="160" step="2" data-app-field="wallpaper.contrast" value="${wp.contrast}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpSaturate)}</span><b class="num" data-live-app-val="wallpaper.saturate">${wp.saturate}%</b></div>
                <input type="range" class="range-input" min="0" max="200" step="5" data-app-field="wallpaper.saturate" value="${wp.saturate}"/>
              </div>
              <div class="slider-box">
                <div class="slider-head"><span>${escHtml(tr.appWpHue)}</span><b class="num" data-live-app-val="wallpaper.hue">${wp.hue}°</b></div>
                <input type="range" class="range-input" min="-180" max="180" step="5" data-app-field="wallpaper.hue" value="${wp.hue}"/>
              </div>
            </div>
          </div>
        </details>

        ${isVid ? `
          <div class="card">
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appWpPlaybackRate)}</span>
              <b class="num" data-live-app-val="wallpaper.playbackRate">${wp.playbackRate}x</b>
            </div>
            <div style="padding:0 13px 10px">
              <input type="range" class="range-input" min="0.25" max="2" step="0.25" data-app-field="wallpaper.playbackRate" value="${wp.playbackRate}"/>
            </div>
            <div class="row-item">
              <span class="row-title">${escHtml(tr.appWpAutoPause)}</span>
              <button type="button" class="switch${wp.pauseWhenHidden ? " is-on" : ""}" role="switch" aria-checked="${wp.pauseWhenHidden ? "true" : "false"}" data-action="toggle-wallpaper-autopause"><span class="switch-thumb"></span></button>
            </div>
          </div>
        ` : ""}

        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.appWpTintTitle)}</span>
              <span class="row-desc">${escHtml(tr.appWpTintDesc)}</span>
            </div>
            <button type="button" class="switch${wp.tintEnabled ? " is-on" : ""}" role="switch" aria-checked="${wp.tintEnabled ? "true" : "false"}" data-action="toggle-wallpaper-tint"><span class="switch-thumb"></span></button>
          </div>
          ${wp.tintEnabled ? `
            <div style="padding:10px 13px;border-top:1px solid var(--rx-border);display:flex;flex-direction:column;gap:9px">
              <div class="control-grid-2">
                <div class="slider-box">
                  <div class="slider-head"><span>${escHtml(tr.appWpTintOpacity)}</span><b class="num" data-live-app-val="wallpaper.tintOpacity">${wp.tintOpacity}%</b></div>
                  <input type="range" class="range-input" min="5" max="75" step="1" data-app-field="wallpaper.tintOpacity" value="${wp.tintOpacity}"/>
                </div>
                <div class="slider-box">
                  <div class="slider-head"><span>${escHtml(tr.appWpTintBlend)}</span></div>
                  <select class="select-input" style="padding:4px 8px;font-size:11px" data-app-field="wallpaper.tintBlend">
                    ${blends.map((b) => `<option value="${b.id}"${wp.tintBlend === b.id ? " selected" : ""}>${escHtml(b.label)}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="control-grid-3">
                <div class="color-box"><span>${escHtml(tr.appColorLabels[0])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor0" value="${escAttr(wp.gradColors[0])}"/></div>
                <div class="color-box"><span>${escHtml(tr.appColorLabels[1])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor1" value="${escAttr(wp.gradColors[1])}"/></div>
                <div class="color-box"><span>${escHtml(tr.appColorLabels[2])}</span><input type="color" class="color-input" data-app-field="wallpaper.gradColor2" value="${escAttr(wp.gradColors[2])}"/></div>
              </div>
              <div class="grad-chips">
                ${grads.map((g) => `
                  <button type="button" class="grad-chip${wp.gradientPreset === g.id ? " is-selected" : ""}" data-action="select-gradient-preset" data-id="${escAttr(g.id)}" style="background:linear-gradient(${g.angle}deg, ${escAttr(g.colors[0])}, ${escAttr(g.colors[1])}, ${escAttr(g.colors[2])})">${escHtml(isRu ? g.nameRu : g.nameEn)}</button>
                `).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }

    return `
      <div class="subtab-bar">
        ${modes.map((m) => `
          <button type="button" class="subtab-btn${wp.type === m.id ? " is-active" : ""}" data-action="set-wallpaper-type" data-val="${m.id}">${escHtml(m.label)}</button>
        `).join("")}
      </div>
      ${modeBody}
    `;
  }

  function renderAppearanceCornersSub(tr, isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const c = draft.corners;
    const eff = typeof teResolveCornerRadii === "function"
      ? teResolveCornerRadii(draft)
      : { messages: c.all, composer: c.all, buttons: c.all, cards: c.all, code: c.all, sidebar: c.all, overlays: c.all, inputs: c.all };
    const presets = spGetCornerPresets();
    const sui = spNormalizeStudioUi(state.settings.studioUi);

    const isPresetSelected = (pr) => {
      if (pr.mode !== c.mode) return false;
      if (pr.mode === "linked") return c.all === pr.all;
      return c.messages === pr.messages && c.composer === pr.composer && c.buttons === pr.buttons && c.code === pr.code;
    };

    const categories = [
      { key: "corners.messages", label: tr.cornersMsgLabel, val: c.messages, max: 28 },
      { key: "corners.composer", label: tr.cornersComposerLabel, val: c.composer, max: 28 },
      { key: "corners.buttons", label: tr.cornersButtonsLabel, val: c.buttons, max: 28 },
      { key: "corners.cards", label: tr.cornersCardsLabel, val: c.cards, max: 28 },
      { key: "corners.code", label: tr.cornersCodeLabel, val: c.code, max: 24 },
      { key: "corners.sidebar", label: tr.cornersSidebarLabel, val: c.sidebar, max: 24 },
      { key: "corners.overlays", label: tr.cornersOverlaysLabel, val: c.overlays, max: 28 },
      { key: "corners.inputs", label: tr.cornersInputsLabel, val: c.inputs, max: 24 },
    ];

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.cornersPreviewLabel)}</span>
        <div class="corners-preview-stage">
          <div class="cp-sidebar" data-cp-role="sidebar" style="border-radius:${Math.min(18, eff.sidebar)}px">
            <div class="cp-nav-item is-on" data-cp-role="nav" style="border-radius:${Math.max(0, eff.sidebar - 2)}px"></div>
            <div class="cp-nav-item" data-cp-role="nav" style="border-radius:${Math.max(0, eff.sidebar - 2)}px"></div>
            <div class="cp-nav-item" data-cp-role="nav" style="border-radius:${Math.max(0, eff.sidebar - 2)}px"></div>
          </div>
          <div class="cp-main">
            <div class="cp-top-row">
              <span class="cp-badge" data-cp-role="input" style="border-radius:${eff.inputs}px">Gemini</span>
              <span class="cp-popup" data-cp-role="popup" style="border-radius:${eff.overlays}px">Menu / Dialog</span>
            </div>
            <div class="cp-bubble" data-cp-role="bubble" style="border-radius:${eff.messages}px">
              <div class="cp-card" data-cp-role="card" style="border-radius:${eff.cards}px">Thinking · Tool call</div>
              <div class="cp-code" data-cp-role="code" style="border-radius:${eff.code}px">const radius = "${eff.code}px";</div>
            </div>
            <div class="cp-composer" data-cp-role="composer" style="border-radius:${eff.composer}px">
              <div class="cp-input" data-cp-role="input" style="border-radius:${eff.inputs}px">Ask anything…</div>
              <button type="button" class="cp-btn" data-cp-role="btn" style="border-radius:${eff.buttons}px">Send</button>
            </div>
          </div>
        </div>
      </div>

      <div class="subtab-bar">
        <button type="button" class="subtab-btn${c.mode === "linked" ? " is-active" : ""}" data-action="set-corners-mode" data-val="linked">${escHtml(tr.cornersModeLinked)}</button>
        <button type="button" class="subtab-btn${c.mode === "custom" ? " is-active" : ""}" data-action="set-corners-mode" data-val="custom">${escHtml(tr.cornersModeCustom)}</button>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.cornersPresetsTitle)}</span>
        <div class="corner-preset-grid">
          ${presets.map((pr) => `
            <button type="button" class="corner-preset-btn${isPresetSelected(pr) ? " is-selected" : ""}" data-action="apply-corner-preset" data-id="${escAttr(pr.id)}">
              <span class="corner-swatch" style="border-radius:${pr.mode === "custom" ? "9px 3px 9px 3px" : Math.min(10, Math.round(pr.all * 0.45)) + "px"}"></span>
              <span>${escHtml(isRu ? pr.nameRu : pr.nameEn)}</span>
            </button>
          `).join("")}
        </div>
      </div>

      ${c.mode === "linked" ? `
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.cornersAllLabel)}</span><b class="num" data-live-app-val="corners.all">${c.all}px</b></div>
          <input type="range" class="range-input" min="0" max="28" step="1" data-app-field="corners.all" value="${c.all}"/>
        </div>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm" data-action="set-corners-mode" data-val="custom">${escHtml(tr.cornersSwitchCustomBtn)}</button>
        </div>
      ` : `
        <div class="control-grid-2">
          ${categories.map((cat) => `
            <div class="slider-box">
              <div class="slider-head"><span>${escHtml(cat.label)}</span><b class="num" data-live-app-val="${cat.key}">${cat.val}px</b></div>
              <input type="range" class="range-input" min="0" max="${cat.max}" step="1" data-app-field="${cat.key}" value="${cat.val}"/>
            </div>
          `).join("")}
        </div>
        <div style="display:flex;justify-content:flex-end">
          <button type="button" class="btn btn-sm" data-action="sync-all-corners">${escHtml(tr.cornersSyncAllBtn)}</button>
        </div>
      `}

      <div class="slider-box">
        <div class="slider-head"><span>${escHtml(tr.cornersStudioQuickLabel)}</span><b class="num" data-live-app-val="studioUi.studioRadius">${sui.studioRadius}px</b></div>
        <input type="range" class="range-input" min="8" max="26" step="1" data-app-field="studioUi.studioRadius" value="${sui.studioRadius}"/>
      </div>
    `;
  }

  function renderAppearanceSurfaceSub(tr, _isRu) {
    const draft = spNormalizeAppearance(state.appearanceDraft);
    const styles = [
      { id: "glass", label: tr.appMsgStyleGlass },
      { id: "solid", label: tr.appMsgStyleSolid },
      { id: "minimal", label: tr.appMsgStyleMinimal },
    ];

    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.appMsgStyleLabel)}</span>
        <div class="subtab-bar">
          ${styles.map((st) => `
            <button type="button" class="subtab-btn${draft.messageStyle === st.id ? " is-active" : ""}" data-action="set-message-style" data-val="${st.id}">${escHtml(st.label)}</button>
          `).join("")}
        </div>
      </div>

      <div class="control-grid-2">
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appGlassOpacity)}</span><b class="num" data-live-app-val="glassOpacity">${draft.glassOpacity}%</b></div>
          <input type="range" class="range-input" min="25" max="100" step="1" data-app-field="glassOpacity" value="${draft.glassOpacity}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appSidebarOpacity)}</span><b class="num" data-live-app-val="sidebarOpacity">${draft.sidebarOpacity}%</b></div>
          <input type="range" class="range-input" min="20" max="100" step="1" data-app-field="sidebarOpacity" value="${draft.sidebarOpacity}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appGlassBlur)}</span><b class="num" data-live-app-val="glassBlur">${draft.glassBlur}px</b></div>
          <input type="range" class="range-input" min="0" max="24" step="1" data-app-field="glassBlur" value="${draft.glassBlur}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.appMessageCardOpacity)}</span><b class="num" data-live-app-val="messageCardOpacity">${draft.messageCardOpacity}%</b></div>
          <input type="range" class="range-input" min="0" max="96" step="2" data-app-field="messageCardOpacity" value="${draft.messageCardOpacity}"/>
        </div>
      </div>

      <div class="slider-box">
        <div class="slider-head"><span>${escHtml(tr.appBorderStrength)}</span><b class="num" data-live-app-val="borderStrength">${draft.borderStrength}%</b></div>
        <input type="range" class="range-input" min="0" max="100" step="5" data-app-field="borderStrength" value="${draft.borderStrength}"/>
      </div>

      <div class="card">
        <div class="row-item">
          <span class="row-title">${escHtml(tr.appHighContrastText)}</span>
          <button type="button" class="switch${draft.highContrastText !== false ? " is-on" : ""}" role="switch" aria-checked="${draft.highContrastText !== false ? "true" : "false"}" data-action="toggle-appearance-contrast"><span class="switch-thumb"></span></button>
        </div>
      </div>
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
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.thinkingRuTitle)}</span>
              <span class="row-desc">${escHtml(tr.thinkingRuGlobalDesc)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span class="${state.settings.thinkingInRussian ? "badge-active" : "nav-badge"}">${escHtml(state.settings.thinkingInRussian ? tr.thinkingRuOn : tr.thinkingRuDefault)}</span>
              <button type="button" class="switch${state.settings.thinkingInRussian ? " is-on" : ""}" role="switch" aria-checked="${state.settings.thinkingInRussian ? "true" : "false"}" data-action="toggle-thinking-ru" aria-label="${escAttr(tr.thinkingRuTitle)}"><span class="switch-thumb"></span></button>
            </div>
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
    const isRu = state.locale !== "en";
    const sub = state.settingsSubTab || "system";
    const subTabs = [
      { id: "system", label: tr.setSubSystem },
      { id: "studio", label: tr.setSubStudio },
      { id: "widget", label: tr.setSubWidget },
      { id: "export", label: tr.setSubExport },
    ];
    let body = "";
    if (sub === "studio") body = renderStudioDesignSub(tr, isRu);
    else if (sub === "widget") body = renderWidgetSub(tr, isRu);
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

  function renderStudioDesignSub(tr, isRu) {
    const sui = spNormalizeStudioUi(state.settings.studioUi);
    return `
      <div class="section-group">
        <span class="section-label">${escHtml(tr.studioDesignTitle)}</span>
        <div class="design-card-grid">
          ${STUDIO_WINDOW_THEMES.map((wt) => {
            const sel = sui.windowTheme === wt.id;
            return `
              <button type="button" class="design-card${sel ? " is-selected" : ""}" data-action="set-studio-theme" data-val="${wt.id}">
                <span class="design-thumb" style="background:${escAttr(wt.bg)};${wt.id === "neon-cyber" ? "border-color:var(--rx-accent)" : ""}">
                  <span style="width:12px;height:100%;border-radius:3px;background:${escAttr(wt.side)}"></span>
                  <span style="flex:1;height:100%;border-radius:3px;background:rgba(255,255,255,0.06)"></span>
                </span>
                <span class="design-meta">
                  <span class="design-title">${escHtml(isRu ? wt.nameRu : wt.nameEn)}</span>
                  <span class="design-desc">${escHtml(isRu ? wt.descRu : wt.descEn)}</span>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.studioLayoutTitle)}</span>
        <div class="design-card-grid">
          ${STUDIO_WINDOW_LAYOUTS.map((wl) => {
            const sel = sui.windowLayout === wl.id;
            let thumbInner = '<span style="width:12px;height:100%;border-radius:3px;background:var(--rx-accent-soft)"></span><span style="flex:1;height:100%;border-radius:3px;background:var(--rx-surface-2)"></span>';
            if (wl.id === "rail") thumbInner = '<span style="width:6px;height:100%;border-radius:2px;background:var(--rx-accent-soft)"></span><span style="flex:1;height:100%;border-radius:3px;background:var(--rx-surface-2)"></span>';
            else if (wl.id === "topbar") thumbInner = '<span style="width:100%;height:7px;border-radius:2px;background:var(--rx-accent-soft)"></span><span style="width:100%;flex:1;border-radius:3px;background:var(--rx-surface-2)"></span>';
            else if (wl.id === "floating-glass") thumbInner = '<span style="width:11px;height:100%;border-radius:4px;border:1px solid var(--rx-accent-border);background:var(--rx-surface-2)"></span><span style="flex:1;height:100%;border-radius:4px;border:1px solid var(--rx-border-strong);background:var(--rx-surface-2)"></span>';
            return `
              <button type="button" class="design-card${sel ? " is-selected" : ""}" data-action="set-studio-layout" data-val="${wl.id}">
                <span class="design-thumb" style="background:var(--rx-bg);${wl.id === "topbar" ? "flex-direction:column" : ""}">${thumbInner}</span>
                <span class="design-meta">
                  <span class="design-title">${escHtml(isRu ? wl.nameRu : wl.nameEn)}</span>
                  <span class="design-desc">${escHtml(isRu ? wl.descRu : wl.descEn)}</span>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.studioWindowSliders)}</span>
        <div class="control-grid-2">
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.studioRadiusLabel)}</span><b class="num" data-live-app-val="studioUi.studioRadius">${sui.studioRadius}px</b></div>
            <input type="range" class="range-input" min="8" max="26" step="1" data-app-field="studioUi.studioRadius" value="${sui.studioRadius}"/>
          </div>
          <div class="slider-box">
            <div class="slider-head"><span>${escHtml(tr.studioBlurLabel)}</span><b class="num" data-live-app-val="studioUi.studioBlur">${sui.studioBlur}px</b></div>
            <input type="range" class="range-input" min="0" max="32" step="1" data-app-field="studioUi.studioBlur" value="${sui.studioBlur}"/>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button type="button" class="btn btn-sm" data-action="reset-studio-ui">${iconSvg("reset", 12)}${escHtml(tr.studioResetBtn)}</button>
      </div>
    `;
  }

  function renderWidgetSub(tr, isRu) {
    const s = state.settings;
    const sui = spNormalizeStudioUi(s.studioUi);
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
    const scales = [
      { id: "sm", label: tr.widgetScaleSm },
      { id: "md", label: tr.widgetScaleMd },
      { id: "lg", label: tr.widgetScaleLg },
    ];
    const isMedPrev = state.widgetPreviewMode === "medium";
    const previewMarkup = isMedPrev ? renderMediumCardMarkup() : renderMiniCapsuleMarkup(true);
    state.lastPreviewCapsuleHtml = previewMarkup;

    return `
      <div class="section-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span class="section-label">${escHtml(tr.previewTitle)}</span>
          <div style="display:flex;gap:4px">
            <button type="button" class="btn btn-sm${!isMedPrev ? " btn-primary" : ""}" data-action="set-widget-preview-mode" data-val="mini">${escHtml(tr.widgetPreviewMiniBtn)}</button>
            <button type="button" class="btn btn-sm${isMedPrev ? " btn-primary" : ""}" data-action="set-widget-preview-mode" data-val="medium">${escHtml(tr.widgetPreviewMedBtn)}</button>
          </div>
        </div>
        <div class="preview-stage" data-widget-theme="${escAttr(sui.widgetTheme)}" data-widget-scale="${escAttr(sui.widgetScale)}" data-live="previewCapsule">${previewMarkup}</div>
      </div>

      <div class="section-group">
        <span class="section-label">${escHtml(tr.widgetThemeTitle)}</span>
        <div class="design-card-grid">
          ${WIDGET_DESIGN_THEMES.map((wt) => {
            const sel = sui.widgetTheme === wt.id;
            const thumbStyle = wt.id === "island"
              ? "background:#08090d;border-color:rgba(255,255,255,0.22)"
              : (wt.id === "neon"
                  ? "background:#0a0c16;border-color:var(--rx-accent);box-shadow:0 0 8px var(--rx-accent-soft)"
                  : (wt.id === "solid" ? "background:var(--rx-surface-2)" : "background:var(--rx-glass)"));
            return `
              <button type="button" class="design-card${sel ? " is-selected" : ""}" data-action="set-widget-theme" data-val="${wt.id}">
                <span class="design-thumb" style="align-items:center;justify-content:center;${thumbStyle}">
                  <span style="width:26px;height:10px;border-radius:999px;background:var(--rx-accent-soft);border:1px solid var(--rx-accent-border)"></span>
                </span>
                <span class="design-meta">
                  <span class="design-title">${escHtml(isRu ? wt.nameRu : wt.nameEn)}</span>
                  <span class="design-desc">${escHtml(isRu ? wt.descRu : wt.descEn)}</span>
                </span>
              </button>
            `;
          }).join("")}
        </div>
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
        <span class="section-label">${escHtml(tr.widgetScaleTitle)}</span>
        <div class="subtab-bar">
          ${scales.map((sc) => `
            <button type="button" class="subtab-btn${sui.widgetScale === sc.id ? " is-active" : ""}" data-action="set-widget-scale" data-val="${sc.id}">${escHtml(sc.label)}</button>
          `).join("")}
        </div>
      </div>

      <div class="control-grid-2">
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.widgetOpacityLabel)}</span><b class="num" data-live-app-val="studioUi.widgetOpacity">${sui.widgetOpacity}%</b></div>
          <input type="range" class="range-input" min="45" max="100" step="1" data-app-field="studioUi.widgetOpacity" value="${sui.widgetOpacity}"/>
        </div>
        <div class="slider-box">
          <div class="slider-head"><span>${escHtml(tr.widgetRadiusLabel)}</span><b class="num" data-live-app-val="studioUi.widgetRadius">${sui.widgetRadius >= 999 ? tr.widgetRadiusPill : sui.widgetRadius + "px"}</b></div>
          <input type="range" class="range-input" min="4" max="25" step="1" data-app-field="studioUi.widgetRadius" value="${sui.widgetRadius >= 999 ? 25 : sui.widgetRadius}"/>
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
      const hasFamSnapshot = Boolean((famData.updatedAt && famData.updatedAt > 0) || rem5 !== null || remW !== null);
      const missing5hLabel = hasFamSnapshot ? "—" : tr.quotaNoData;
      const missingWkLabel = hasFamSnapshot ? "—" : tr.quotaNoData;
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
              <b class="num">${rem5 !== null ? rem5 + "%" : escHtml(missing5hLabel)}</b>
            </div>
            <div class="quota-bar-track"><div class="quota-bar-fill" style="width:${rem5 !== null ? rem5 : 0}%"></div></div>
          </div>
          <div class="quota-bar-row">
            <div class="quota-bar-labels">
              <span>${escHtml(tr.quotaWeekShort)} ${escHtml(tr.quotaRemShort)} ${famData.weeklyReset ? "(" + escHtml(famData.weeklyReset) + ")" : ""}</span>
              <b class="num">${remW !== null ? remW + "%" : escHtml(missingWkLabel)}</b>
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
    const autoUpdates = state.settings.autoCheckUpdates !== false;
    const u = state.update || {};
    const uStatus = u.status || "idle";
    const uBusy = uStatus === "checking" || uStatus === "downloading" || uStatus === "extracting" || uStatus === "installing" || uStatus === "restarting";
    const inst = u.installed || {};
    const ver = inst.version || pluginMeta.version || "4.1.2";
    const verDisplay = inst.commitShort ? `v${ver} · #${inst.commitShort}` : `v${ver}`;
    const dictCount = pluginMeta.dictEntries || 4048;
    const dynCount = pluginMeta.dynamicRulesCount || 474;

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
        <span class="section-label">${escHtml(tr.updateSectionTitle)}</span>
        <div class="card">
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.updateAutoTitle)}</span>
              <span class="row-desc">${escHtml(tr.updateAutoDesc)}</span>
            </div>
            <button type="button" class="switch${autoUpdates ? " is-on" : ""}" role="switch" aria-checked="${autoUpdates ? "true" : "false"}" data-action="toggle-auto-updates" aria-label="${escAttr(tr.updateAutoTitle)}"><span class="switch-thumb"></span></button>
          </div>
          <div class="row-item">
            <div class="row-info">
              <span class="row-title">${escHtml(tr.updateStatusLabel)}</span>
              <span class="row-desc num">${escHtml(formatUpdateStatusLabel(u, tr))}${u.available && u.remote ? ` (${escHtml(formatUpdateVersionBadge(u))})` : ""}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              ${u.available ? `<span class="badge-active">${escHtml(tr.updateBadgeNew)}</span>` : ""}
              <button type="button" class="btn btn-sm" ${uBusy ? "disabled" : ""} data-action="check-updates">${iconSvg("reset", 12)}${escHtml(tr.updateBtnCheck)}</button>
              ${u.available ? `<button type="button" class="btn btn-sm btn-primary" ${uBusy ? "disabled" : ""} data-action="install-update">${iconSvg("download", 12)}${escHtml(tr.updateBtnInstallRestart)}</button>` : ""}
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
          <div class="row-item"><span class="row-title">${escHtml(tr.pluginVersion)}</span><span class="kbd num">${escHtml(verDisplay)}</span></div>
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
    const sui = spNormalizeStudioUi(state.settings.studioUi);
    const pendingLe = countPendingLiveEdits();
    const tabs = [
      { id: "monitor", label: tr.navMonitor, ic: "activity", title: tr.modalTitleMonitor, sub: tr.modalSubMonitor },
      { id: "appearance", label: tr.navAppearance, ic: "palette", title: tr.modalTitleAppearance, sub: tr.modalSubAppearance },
      { id: "persona", label: tr.navPersona, ic: "sparkles", title: tr.modalTitlePersona, sub: tr.modalSubPersona, dot: state.chatPersona.enabled },
      { id: "live-edits", label: tr.navSupplements, ic: "bolt", title: tr.modalTitleSupplements, sub: tr.modalSubSupplements, dot: pendingLe > 0, badge: pendingLe > 0 ? String(pendingLe) : "" },
      { id: "settings", label: tr.navSettings, ic: "gear", title: tr.modalTitleSettings, sub: tr.modalSubSettings, dot: Boolean(state.update && state.update.available) },
    ];
    const current = tabs.find((x) => x.id === state.activeTab) || tabs[0];
    const isAppearanceTab = current.id === "appearance";
    const isAppearanceDrawer = isAppearanceTab && Boolean(state.appearanceDockedRight);
    let bodyHtml = "";
    if (current.id === "monitor") bodyHtml = renderMonitorTab();
    else if (current.id === "appearance") bodyHtml = renderAppearanceDrawerBody();
    else if (current.id === "persona") bodyHtml = renderPersonaTab();
    else if (current.id === "live-edits") bodyHtml = renderSupplementsTab();
    else bodyHtml = renderSettingsTab();

    return `
      <div class="modal-backdrop${isAppearanceDrawer ? " is-appearance-live" : ""}" data-action="backdrop-close">
        <div class="modal-shell${isAppearanceDrawer ? " is-appearance-live" : ""}" data-studio-layout="${isAppearanceDrawer ? "drawer" : escAttr(sui.windowLayout)}" role="dialog" aria-modal="${isAppearanceDrawer ? "false" : "true"}" aria-label="${escAttr(tr.brandTitle)}">
          ${isAppearanceDrawer ? "" : `
            <aside class="modal-sidebar">
              <div class="sidebar-brand">
                <span class="brand-title-wrap">
                  <span class="brand-logo-dot">${iconSvg("sparkles", 12)}</span>
                  <span class="brand-title">${escHtml(tr.brandTitle)}</span>
                </span>
                <span class="brand-ver num">v${escHtml(pluginMeta.version || "4.1.2")}</span>
              </div>
              <nav class="nav-list">
                ${tabs.map((tb) => `
                  <button type="button" class="nav-item${tb.id === current.id ? " is-active" : ""}" data-action="switch-tab" data-tab="${tb.id}" title="${escAttr(tb.label)}">
                    <span class="nav-ic">${iconSvg(tb.ic, 15)}</span>
                    <span class="nav-label">${escHtml(tb.label)}</span>
                    ${tb.dot ? '<span class="nav-dot"></span>' : ""}
                    ${tb.badge ? `<span class="nav-badge">${escHtml(tb.badge)}</span>` : ""}
                  </button>
                `).join("")}
              </nav>
              <div class="sidebar-foot">
                <div class="sidebar-foot-row">
                  <span class="sidebar-foot-hint">${escHtml(tr.sidebarFooterHint)}</span>
                  <span class="kbd">Ctrl+Alt+P</span>
                </div>
                <div class="sidebar-foot-row">
                  <div class="sidebar-quick-actions">
                    <button type="button" class="lang-pill-btn" data-action="toggle-locale" title="${escAttr(tr.tooltipLang)}">${state.locale === "en" ? "EN" : "RU"}</button>
                    <button type="button" class="icon-btn" data-action="cycle-studio-theme" title="${escAttr(tr.studioThemeCycleTip)}">${iconSvg("wand", 12)}</button>
                    <button type="button" class="icon-btn" data-action="open-studio-design" title="${escAttr(tr.setSubStudio)}">${iconSvg("layout", 12)}</button>
                  </div>
                  <span class="nav-badge" style="font-size:9.5px">${escHtml(sui.windowTheme)}</span>
                </div>
              </div>
            </aside>
          `}
          <section class="modal-main">
            <header class="modal-header">
              <div style="display:flex;align-items:center;gap:8px;min-width:0">
                ${isAppearanceDrawer ? `<button type="button" class="icon-btn" data-action="toggle-appearance-dock" title="${escAttr(tr.appDockCenterBtn)}">${iconSvg("back", 15)}</button>` : ""}
                <div style="min-width:0">
                  <h2 class="modal-title">${escHtml(current.title)}</h2>
                  <p class="modal-sub">${escHtml(current.sub)}</p>
                </div>
              </div>
              <div class="modal-header-actions">
                ${isAppearanceTab ? `
                  <button type="button" class="btn btn-sm" data-action="toggle-appearance-dock">
                    ${iconSvg(isAppearanceDrawer ? "panelCenter" : "panelRight", 13)}
                    <span>${escHtml(isAppearanceDrawer ? tr.appDockCenterBtn : tr.appDockRightBtn)}</span>
                  </button>
                ` : `
                  <button type="button" class="btn btn-sm btn-ghost" data-action="open-studio-design" title="${escAttr(tr.setSubStudio)}">
                    ${iconSvg("layout", 13)}
                    <span>${escHtml(tr.studioDesignQuickBtn)}</span>
                  </button>
                `}
                <button type="button" class="icon-btn" data-action="close-modal" title="${escAttr(tr.tooltipClose)}">${iconSvg("close", 15)}</button>
              </div>
            </header>
            <div class="modal-body">${bodyHtml}</div>
            ${isAppearanceTab ? `
              <footer class="drawer-sticky-footer">
                <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
                  <button type="button" class="btn btn-sm btn-ghost" data-action="reset-appearance">${escHtml(tr.appResetBtn)}</button>
                  ${state.toastMsg
                    ? `<span class="studio-toast-pill${state.toastError ? " is-err" : ""}" data-role="toast">${escHtml(state.toastMsg)}</span>`
                    : (state.appearanceDirty ? `<span class="studio-dirty-pill" data-role="toast">${escHtml(tr.appDirtyBadge)}</span>` : `<span class="studio-toast-pill" data-role="toast"></span>`)}
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
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
    const sui = spNormalizeStudioUi(s.studioUi);
    const dock = normalizeDockPosition(s.dockPosition);
    const shouldHide = dock === "hidden";
    const lockedCls = s.pinned ? " is-locked" : "";
    widgetMountEl.setAttribute("data-widget-theme", sui.widgetTheme);
    widgetMountEl.setAttribute("data-widget-scale", sui.widgetScale);
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
    if (updateToastMountEl) {
      renderUpdateToast();
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
        cleanupTempUploadedMedia();
        state.appearanceLivePreview = false;
        state.appearanceDockedRight = false;
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
        if (state.appearanceSubTab === "wallpaper") refreshMediaLibrary();
      }
      if (tab === "live-edits") refreshLiveEdits();
      renderStructure();
      return;
    }
    if (action === "open-studio-design") {
      if (state.activeTab === "appearance") {
        cleanupTempUploadedMedia();
        state.appearanceLivePreview = false;
        state.appearanceDockedRight = false;
        state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        state.greetingDraft = spCloneGreeting(state.settings.greeting);
        state.appearanceDirty = false;
        applyThemeToHost(state.settings.appearance);
      }
      state.activeTab = "settings";
      state.settingsSubTab = "studio";
      setOpen(true);
      return;
    }
    if (action === "cycle-studio-theme") {
      const cur = spNormalizeStudioUi(state.settings.studioUi).windowTheme;
      const idx = STUDIO_WINDOW_THEMES.findIndex((x) => x.id === cur);
      const nextTheme = STUDIO_WINDOW_THEMES[(idx + 1) % STUDIO_WINDOW_THEMES.length].id;
      saveSettingsPatch({ studioUi: { windowTheme: nextTheme } });
      return;
    }
    if (action === "set-studio-theme") {
      saveSettingsPatch({ studioUi: { windowTheme: actionEl.getAttribute("data-val") || "obsidian" } });
      return;
    }
    if (action === "set-studio-layout") {
      saveSettingsPatch({ studioUi: { windowLayout: actionEl.getAttribute("data-val") || "sidebar" } });
      return;
    }
    if (action === "set-widget-theme") {
      saveSettingsPatch({ studioUi: { widgetTheme: actionEl.getAttribute("data-val") || "glass" } });
      return;
    }
    if (action === "set-widget-scale") {
      saveSettingsPatch({ studioUi: { widgetScale: actionEl.getAttribute("data-val") || "md" } });
      return;
    }
    if (action === "set-widget-preview-mode") {
      state.widgetPreviewMode = actionEl.getAttribute("data-val") === "medium" ? "medium" : "mini";
      renderStructure();
      return;
    }
    if (action === "reset-studio-ui") {
      saveSettingsPatch({ studioUi: Object.assign({}, DEFAULT_STUDIO_UI) });
      return;
    }
    if (action === "toggle-appearance-dock") {
      state.appearanceDockedRight = !state.appearanceDockedRight;
      state.appearanceLivePreview = true;
      applyThemeFastToHost(state.appearanceDraft);
      renderStructure();
      return;
    }
    if (action === "set-app-subtab") {
      const sub = actionEl.getAttribute("data-val") || "theme";
      state.appearanceSubTab = sub;
      if (sub === "wallpaper") refreshMediaLibrary();
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
    if (action === "toggle-auto-updates") {
      saveSettingsPatch({ autoCheckUpdates: state.settings.autoCheckUpdates === false });
      return;
    }
    if (action === "check-updates") {
      const curSt = state.update && state.update.status;
      if (curSt === "checking" || curSt === "downloading" || curSt === "extracting" || curSt === "installing" || curSt === "restarting") return;
      state.update.status = "checking";
      state.update.error = "";
      renderStructure();
      invokeIpc("agy-studio:check-updates", { manual: true }).then((res) => {
        if (!state.destroyed && res) applyUpdateStatus(res);
      });
      return;
    }
    if (action === "dismiss-update") {
      state.update.dismissed = true;
      renderUpdateToast();
      invokeIpc("agy-studio:dismiss-update", { key: state.update.updateKey || "" }).then((res) => {
        if (!state.destroyed && res) applyUpdateStatus(res);
      });
      return;
    }
    if (action === "install-update") {
      const curSt = state.update && state.update.status;
      if (curSt === "downloading" || curSt === "extracting" || curSt === "installing" || curSt === "restarting") return;
      state.update.status = "downloading";
      state.update.error = "";
      state.update.dismissed = false;
      renderUpdateToast();
      if (state.isOpen && state.activeTab === "settings" && state.settingsSubTab === "system") {
        renderStructure();
      }
      invokeIpc("agy-studio:install-update", {}).then((res) => {
        if (state.destroyed || !res) return;
        if (res.state) applyUpdateStatus(res.state);
        else if (res.ok === false) {
          applyUpdateStatus(Object.assign({}, state.update, { status: "error", error: res.error || tr.updateStatusError }));
        }
      });
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
        if (!state.appearanceDraft.customAccent) {
          state.appearanceDraft.accentColor = pr.vars.accentColor;
        }
        state.appearanceDraft.canvasBg = pr.vars.canvasBg;
        state.appearanceDraft.cardBg = pr.vars.cardBg;
      }
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "pick-accent-dot") {
      const hex = actionEl.getAttribute("data-val") || "#3b82f6";
      state.appearanceDraft.accentColor = hex.toLowerCase();
      state.appearanceDraft.customAccent = true;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "reset-custom-accent") {
      const pr = spFindThemePreset(state.appearanceDraft.presetId || "native");
      state.appearanceDraft.customAccent = false;
      state.appearanceDraft.accentColor = (pr && pr.vars && pr.vars.accentColor) || "#3b82f6";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-message-style") {
      const val = actionEl.getAttribute("data-val");
      state.appearanceDraft.messageStyle = val === "solid" || val === "minimal" ? val : "glass";
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
      if (val === "image" || val === "video") refreshMediaLibrary();
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-wallpaper-grad-style") {
      const val = actionEl.getAttribute("data-val");
      state.appearanceDraft.wallpaper.gradStyle = val === "radial" || val === "mesh" ? val : "linear";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-wp-drag-mode") {
      state.wpDragMode = actionEl.getAttribute("data-val") === "offset" ? "offset" : "crop";
      renderStructure();
      return;
    }
    if (action === "set-wp-fit") {
      const val = actionEl.getAttribute("data-val");
      state.appearanceDraft.wallpaper.fit = val === "contain" || val === "fill" ? val : "cover";
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "set-wp-anchor") {
      const ax = Math.max(0, Math.min(100, Math.round(Number(actionEl.getAttribute("data-x")) || 50)));
      const ay = Math.max(0, Math.min(100, Math.round(Number(actionEl.getAttribute("data-y")) || 50)));
      state.appearanceDraft.wallpaper.posX = ax;
      state.appearanceDraft.wallpaper.posY = ay;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "wp-rotate-step") {
      const delta = Number(actionEl.getAttribute("data-delta")) || 0;
      let nextRot = (Number(state.appearanceDraft.wallpaper.rotate) || 0) + delta;
      if (nextRot > 180) nextRot -= 360;
      if (nextRot < -180) nextRot += 360;
      state.appearanceDraft.wallpaper.rotate = nextRot;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "wp-toggle-flip") {
      const axis = actionEl.getAttribute("data-axis");
      if (axis === "y") state.appearanceDraft.wallpaper.flipY = !state.appearanceDraft.wallpaper.flipY;
      else state.appearanceDraft.wallpaper.flipX = !state.appearanceDraft.wallpaper.flipX;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "wp-reset-transform") {
      const wp = state.appearanceDraft.wallpaper;
      wp.fit = "cover";
      wp.posX = 50;
      wp.posY = 50;
      wp.offsetX = 0;
      wp.offsetY = 0;
      wp.scale = 100;
      wp.rotate = 0;
      wp.flipX = false;
      wp.flipY = false;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "apply-wp-atmos") {
      const pid = actionEl.getAttribute("data-id");
      const found = WALLPAPER_ATMOS_PRESETS.find((x) => x.id === pid);
      if (found) {
        const wp = state.appearanceDraft.wallpaper;
        wp.dim = found.dim;
        wp.blur = found.blur;
        wp.brightness = found.brightness;
        wp.contrast = found.contrast;
        wp.saturate = found.saturate;
        wp.hue = found.hue;
        wp.vignette = found.vignette;
        markAppearanceDirty();
        renderStructure();
      }
      return;
    }
    if (action === "select-library-media") {
      const fn = actionEl.getAttribute("data-file") || "";
      const url = actionEl.getAttribute("data-url") || "";
      const mime = actionEl.getAttribute("data-mime") || "";
      const kind = actionEl.getAttribute("data-kind") === "video" ? "video" : "image";
      if (url) {
        state.appearanceDraft.wallpaper.type = kind;
        state.appearanceDraft.wallpaper.mediaFile = fn;
        state.appearanceDraft.wallpaper.mediaUrl = url;
        state.appearanceDraft.wallpaper.mediaMime = mime;
        markAppearanceDirty();
        renderStructure();
      }
      return;
    }
    if (action === "set-corners-mode") {
      const mode = actionEl.getAttribute("data-val") === "custom" ? "custom" : "linked";
      const c = state.appearanceDraft.corners;
      if (mode === "custom" && c.mode === "linked") {
        const v = c.all;
        c.messages = v;
        c.composer = v;
        c.buttons = v;
        c.cards = v;
        c.code = Math.min(24, v);
        c.sidebar = Math.min(24, v);
        c.overlays = v;
        c.inputs = Math.min(24, v);
      }
      c.mode = mode;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "apply-corner-preset") {
      const pid = actionEl.getAttribute("data-id");
      const pr = spGetCornerPresets().find((x) => x.id === pid);
      if (pr) {
        const c = state.appearanceDraft.corners;
        c.mode = pr.mode === "custom" ? "custom" : "linked";
        c.all = pr.all;
        state.appearanceDraft.radius = pr.all;
        if (pr.mode === "custom") {
          c.messages = pr.messages;
          c.composer = pr.composer;
          c.buttons = pr.buttons;
          c.cards = pr.cards;
          c.code = pr.code;
          c.sidebar = pr.sidebar;
          c.overlays = pr.overlays;
          c.inputs = pr.inputs;
        } else {
          c.messages = pr.all;
          c.composer = pr.all;
          c.buttons = pr.all;
          c.cards = pr.all;
          c.code = Math.min(24, pr.all);
          c.sidebar = Math.min(24, pr.all);
          c.overlays = pr.all;
          c.inputs = Math.min(24, pr.all);
        }
        markAppearanceDirty();
        renderStructure();
      }
      return;
    }
    if (action === "sync-all-corners") {
      const c = state.appearanceDraft.corners;
      const v = c.all;
      c.messages = v;
      c.composer = v;
      c.buttons = v;
      c.cards = v;
      c.code = Math.min(24, v);
      c.sidebar = Math.min(24, v);
      c.overlays = v;
      c.inputs = Math.min(24, v);
      state.appearanceDraft.radius = v;
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "select-gradient-preset") {
      const gid = actionEl.getAttribute("data-id");
      const grads = spGetGradientPresets();
      const found = grads.find((g) => g.id === gid) || grads[0];
      if (found) {
        if (state.appearanceDraft.wallpaper.type === "image" || state.appearanceDraft.wallpaper.type === "video") {
          state.appearanceDraft.wallpaper.tintEnabled = true;
        } else {
          state.appearanceDraft.wallpaper.type = "gradient";
        }
        state.appearanceDraft.wallpaper.gradientPreset = found.id;
        state.appearanceDraft.wallpaper.gradColors = found.colors.slice(0, 3);
        state.appearanceDraft.wallpaper.gradAngle = found.angle;
      }
      markAppearanceDirty();
      renderStructure();
      return;
    }
    if (action === "toggle-wallpaper-tint") {
      state.appearanceDraft.wallpaper.tintEnabled = !state.appearanceDraft.wallpaper.tintEnabled;
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
      invokeIpc("agy-studio:pick-media", { kind }).then((res) => {
        if (state.destroyed) return;
        if (res && res.ok && res.mediaUrl) {
          if (res.fileName && state.tempUploadedMediaFiles.indexOf(res.fileName) === -1) {
            state.tempUploadedMediaFiles.push(res.fileName);
          }
          state.appearanceDraft.wallpaper.type = kind;
          state.appearanceDraft.wallpaper.mediaFile = res.fileName || "";
          state.appearanceDraft.wallpaper.mediaUrl = res.mediaUrl;
          state.appearanceDraft.wallpaper.mediaMime = res.mime || "";
          markAppearanceDirty();
          refreshMediaLibrary();
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
      const inp = modalMountEl ? modalMountEl.querySelector('[data-greet-field="title"]') : null;
      const cur = state.greetingDraft.title || "";
      if (inp && typeof inp.selectionStart === "number" && typeof inp.selectionEnd === "number") {
        const sPos = inp.selectionStart;
        const ePos = inp.selectionEnd;
        const prefix = cur.slice(0, sPos);
        const suffix = cur.slice(ePos);
        const spacer = prefix && !/\s$/.test(prefix) ? " " : "";
        state.greetingDraft.title = (prefix + spacer + tok + suffix).slice(0, 160);
      } else {
        state.greetingDraft.title = ((cur ? cur + " " : "") + tok).slice(0, 160);
      }
      state.greetingDraft.enabled = true;
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
        const nextPatch = { appearance: spCloneAppearance(prof.appearance) };
        if (prof.greeting && typeof prof.greeting === "object") {
          state.greetingDraft = spCloneGreeting(prof.greeting);
          nextPatch.greeting = spCloneGreeting(prof.greeting);
        }
        state.appearanceDirty = false;
        saveSettingsPatch(nextPatch);
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
        greeting: spCloneGreeting(state.greetingDraft),
        createdAt: Date.now(),
      }]).slice(-12);
      state.newProfileName = "";
      saveSettingsPatch({ appearanceProfiles: next });
      return;
    }
    if (action === "apply-appearance") {
      const newSavedFile = state.appearanceDraft.wallpaper && state.appearanceDraft.wallpaper.mediaFile;
      state.tempUploadedMediaFiles = (state.tempUploadedMediaFiles || []).filter((f) => f === newSavedFile);
      cleanupTempUploadedMedia();
      state.tempUploadedMediaFiles = [];
      state.appearanceDirty = false;
      state.appearanceLivePreview = state.isOpen && state.activeTab === "appearance";
      saveSettingsPatch({
        appearance: spCloneAppearance(state.appearanceDraft),
        greeting: spCloneGreeting(state.greetingDraft),
      });
      setToast(tr.appAppliedMsg, false);
      return;
    }
    if (action === "discard-appearance") {
      cleanupTempUploadedMedia();
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
      cleanupTempUploadedMedia();
      const defApp = spCloneAppearance(spDefaultAppearance());
      const defGreet = spCloneGreeting(null);
      state.appearanceDraft = spCloneAppearance(defApp);
      state.greetingDraft = spCloneGreeting(defGreet);
      state.appearanceDirty = false;
      state.appearanceLivePreview = state.isOpen && state.activeTab === "appearance";
      saveSettingsPatch({ appearance: defApp, greeting: defGreet });
      setToast(tr.appResetMsg, false);
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

    if (field === "accentColor") {
      draft.accentColor = String(rawVal || "#3b82f6").toLowerCase();
      draft.customAccent = true;
      needsRerenderDots = true;
    } else if (field === "canvasBg" || field === "cardBg") {
      draft[field] = String(rawVal || "#09090b").toLowerCase();
      draft.presetId = "custom";
      needsRerenderDots = true;
    } else if (field === "glassOpacity" || field === "sidebarOpacity" || field === "glassBlur" || field === "radius" || field === "messageCardOpacity" || field === "borderStrength") {
      const n = Math.round(Number(rawVal) || 0);
      draft[field] = n;
      if (field === "radius" && draft.corners) draft.corners.all = n;
      labelText = (field === "glassBlur" || field === "radius") ? `${n}px` : `${n}%`;
    } else if (field.startsWith("corners.")) {
      const sub = field.split(".")[1];
      const n = Math.round(Number(rawVal) || 0);
      if (!draft.corners) draft.corners = spDefaultAppearance().corners;
      draft.corners[sub] = n;
      if (sub === "all") draft.radius = n;
      labelText = `${n}px`;
      updateLiveCornersPreviewDom();
    } else if (field.startsWith("studioUi.")) {
      const sub = field.split(".")[1];
      const rawNum = Number(rawVal) || 0;
      const val = sub === "widgetRadius" && rawNum >= 25 ? 999 : Math.round(rawNum);
      state.settings.studioUi = spNormalizeStudioUi(Object.assign({}, state.settings.studioUi, { [sub]: val }));
      syncTheme();
      const suiLabel = sub === "widgetOpacity"
        ? `${val}%`
        : (sub === "widgetRadius" && val >= 999 ? tr.widgetRadiusPill : `${val}px`);
      if (modalMountEl) {
        setLiveSlot(modalMountEl, `[data-live-app-val="${field}"]`, suiLabel, false);
      }
      invokeIpc("agy-studio:save-settings", { studioUi: { [sub]: val } });
      return true;
    } else if (field === "wallpaper.gradColor0" || field === "wallpaper.gradColor1" || field === "wallpaper.gradColor2") {
      const idx = parseInt(field.slice(-1), 10);
      if (draft.wallpaper.type === "image" || draft.wallpaper.type === "video") {
        draft.wallpaper.tintEnabled = true;
      } else {
        draft.wallpaper.type = "gradient";
      }
      draft.wallpaper.gradColors[idx] = String(rawVal || "#0f172a").toLowerCase();
      updateLiveWallpaperPreviewDom();
    } else if (field === "wallpaper.tintBlend") {
      draft.wallpaper.tintBlend = String(rawVal || "normal");
      updateLiveWallpaperPreviewDom();
    } else if (field === "wallpaper.gradAngle") {
      const n = Math.round(Number(rawVal) || 0);
      draft.wallpaper.gradAngle = n;
      labelText = `${n}°`;
    } else if (field === "wallpaper.gradSpeed") {
      const n = Math.round(Number(rawVal) || 18);
      draft.wallpaper.gradSpeed = n;
      labelText = `${n}s`;
    } else if (field === "wallpaper.playbackRate") {
      const n = Math.round((Number(rawVal) || 1) * 100) / 100;
      draft.wallpaper.playbackRate = n;
      labelText = `${n}x`;
      updateLiveWallpaperPreviewDom();
    } else if (
      field === "wallpaper.dim" ||
      field === "wallpaper.blur" ||
      field === "wallpaper.opacity" ||
      field === "wallpaper.brightness" ||
      field === "wallpaper.contrast" ||
      field === "wallpaper.saturate" ||
      field === "wallpaper.hue" ||
      field === "wallpaper.scale" ||
      field === "wallpaper.rotate" ||
      field === "wallpaper.posX" ||
      field === "wallpaper.posY" ||
      field === "wallpaper.offsetX" ||
      field === "wallpaper.offsetY" ||
      field === "wallpaper.vignette" ||
      field === "wallpaper.tintOpacity"
    ) {
      const sub = field.split(".")[1];
      const n = Math.round(Number(rawVal) || 0);
      draft.wallpaper[sub] = n;
      if (sub === "blur") labelText = `${n}px`;
      else if (sub === "rotate" || sub === "hue") labelText = `${n}°`;
      else labelText = `${n}%`;
      updateLiveWallpaperPreviewDom();
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
    if (wpDragState && modalMountEl) {
      const wp = state.appearanceDraft.wallpaper;
      const dxPct = ((e.clientX - wpDragState.startX) / Math.max(40, wpDragState.width)) * 100;
      const dyPct = ((e.clientY - wpDragState.startY) / Math.max(40, wpDragState.height)) * 100;
      if (state.wpDragMode === "offset") {
        wp.offsetX = Math.max(-50, Math.min(50, Math.round(wpDragState.startOffX + dxPct)));
        wp.offsetY = Math.max(-50, Math.min(50, Math.round(wpDragState.startOffY + dyPct)));
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.offsetX"]', `${wp.offsetX}%`, false);
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.offsetY"]', `${wp.offsetY}%`, false);
        const rx = modalMountEl.querySelector('[data-app-field="wallpaper.offsetX"]');
        const ry = modalMountEl.querySelector('[data-app-field="wallpaper.offsetY"]');
        if (rx) rx.value = String(wp.offsetX);
        if (ry) ry.value = String(wp.offsetY);
      } else {
        wp.posX = Math.max(0, Math.min(100, Math.round(wpDragState.startPosX - dxPct)));
        wp.posY = Math.max(0, Math.min(100, Math.round(wpDragState.startPosY - dyPct)));
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.posX"]', `${wp.posX}%`, false);
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.posY"]', `${wp.posY}%`, false);
        const rx = modalMountEl.querySelector('[data-app-field="wallpaper.posX"]');
        const ry = modalMountEl.querySelector('[data-app-field="wallpaper.posY"]');
        if (rx) rx.value = String(wp.posX);
        if (ry) ry.value = String(wp.posY);
      }
      markAppearanceDirty();
      updateLiveWallpaperPreviewDom();
      return;
    }
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
    if (wpDragState) {
      const stageEl = wpDragState.stageEl;
      const pid = wpDragState.pointerId;
      wpDragState = null;
      if (stageEl) {
        if (stageEl.classList && typeof stageEl.classList.remove === "function") stageEl.classList.remove("is-dragging");
        if (typeof stageEl.releasePointerCapture === "function" && pid !== undefined) {
          try { stageEl.releasePointerCapture(pid); } catch (_e) {}
        }
      }
    }
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
          lastBodyClickAt = 0;
          setOpen(true);
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
        const wasOff = !state.greetingDraft.enabled;
        state.greetingDraft[gf] = target.value || "";
        state.greetingDraft.enabled = true;
        state.appearanceDirty = true;
        syncTranslatorGreeting(state.greetingDraft);
        updateGreetingLivePreview();
        if (wasOff && modalMountEl) {
          const sw = modalMountEl.querySelector('[data-action="toggle-greeting-enabled"]');
          if (sw) {
            sw.className = "switch is-on";
            sw.setAttribute("aria-checked", "true");
          }
        }
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

    rootEl.addEventListener("pointerdown", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.closest !== "function" || (typeof e.button === "number" && e.button !== 0)) return;
      if (target.closest("button") || target.closest("[data-action]")) return;
      const stage = target.closest('[data-wp-stage="1"]');
      if (!stage || (stage.classList && stage.classList.contains("is-empty"))) return;
      const rect = typeof stage.getBoundingClientRect === "function"
        ? stage.getBoundingClientRect()
        : { width: 320, height: 196 };
      const wp = state.appearanceDraft.wallpaper;
      wpDragState = {
        stageEl: stage,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        width: rect.width || 320,
        height: rect.height || 196,
        startPosX: wp.posX,
        startPosY: wp.posY,
        startOffX: wp.offsetX,
        startOffY: wp.offsetY,
      };
      if (stage.classList && typeof stage.classList.add === "function") stage.classList.add("is-dragging");
      if (typeof stage.setPointerCapture === "function" && e.pointerId !== undefined) {
        try { stage.setPointerCapture(e.pointerId); } catch (_e) {}
      }
    });

    rootEl.addEventListener("wheel", (e) => {
      const target = e ? e.target : null;
      if (!target || typeof target.closest !== "function") return;
      const stage = target.closest('[data-wp-stage="1"]');
      if (!stage || (stage.classList && stage.classList.contains("is-empty"))) return;
      if (typeof e.preventDefault === "function") e.preventDefault();
      const wp = state.appearanceDraft.wallpaper;
      const step = (e.deltaY || 0) < 0 ? 5 : -5;
      wp.scale = Math.max(50, Math.min(250, (Number(wp.scale) || 100) + step));
      markAppearanceDirty();
      updateLiveWallpaperPreviewDom();
      if (modalMountEl) {
        setLiveSlot(modalMountEl, '[data-live-app-val="wallpaper.scale"]', `${wp.scale}%`, false);
        const rScale = modalMountEl.querySelector('[data-app-field="wallpaper.scale"]');
        if (rScale) rScale.value = String(wp.scale);
      }
    }, { passive: false });

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
        if (tEl.closest('[data-testid="input-cancel-button"], [data-testid="cancel-invocation-button"]')) {
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
    updateToastMountEl = doc.createElement("div");
    updateToastMountEl.className = "update-toast-mount";
    modalMountEl = doc.createElement("div");
    modalMountEl.className = "modal-mount";

    rootEl.appendChild(widgetMountEl);
    rootEl.appendChild(popoverMountEl);
    rootEl.appendChild(updateToastMountEl);
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
          if (state.destroyed || isApplyingThinkingTranslation) return;
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
          if (state.settings.thinkingInRussian) scheduleThinkingScan(160);
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
    invokeIpc("agy-studio:get-update-state").then((upd) => {
      if (!state.destroyed && upd) applyUpdateStatus(upd);
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
      if (opts.appSubTab) state.appearanceSubTab = String(opts.appSubTab);
      if (typeof opts.dockedRight === "boolean") state.appearanceDockedRight = opts.dockedRight;
    }
    if (!next && (state.appearanceLivePreview || state.activeTab === "appearance")) {
      cleanupTempUploadedMedia();
      state.appearanceLivePreview = false;
      state.appearanceDockedRight = false;
      state.appearanceDraft = spCloneAppearance(state.settings.appearance);
      state.greetingDraft = spCloneGreeting(state.settings.greeting);
      state.appearanceDirty = false;
      applyThemeToHost(state.settings.appearance);
      syncTranslatorGreeting(state.settings.greeting);
    } else if (!next) {
      state.appearanceDockedRight = false;
    }
    state.isOpen = next;
    if (next && state.activeTab === "appearance") {
      state.appearanceLivePreview = true;
      if (!state.appearanceDirty) {
        state.appearanceDraft = spCloneAppearance(state.settings.appearance);
        state.greetingDraft = spCloneGreeting(state.settings.greeting);
      }
      applyThemeFastToHost(state.appearanceDraft);
      if (state.appearanceSubTab === "wallpaper") refreshMediaLibrary();
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
    for (const timer of [settleTimer, repaintTimer, streamSampleTimer, turnSyncTimer, toastTimer, thinkingScanTimer]) {
      if (timer && win && typeof win.clearTimeout === "function") win.clearTimeout(timer);
    }
    settleTimer = repaintTimer = streamSampleTimer = turnSyncTimer = toastTimer = thinkingScanTimer = null;
    restoreAllThinkingNodes();
    thinkingCache.clear();
    thinkingInflight.clear();
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
    hostEl = shadowRoot = rootEl = widgetMountEl = popoverMountEl = updateToastMountEl = modalMountEl = null;
  }

  return {
    init,
    destroy,
    setOpen,
    toggleOpen,
    toggleLiveEditPopover,
    applyLiveEditsUpdate,
    applyUpdateStatus,
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
