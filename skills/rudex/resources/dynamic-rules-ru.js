"use strict";

/**
 * Dynamic UI string localization rules + Russian pluralization helper.
 * Must stay pure browser-compatible JS (no Node requires) so it can be
 * inlined into Electron's sandboxed preload.js as well as tested in Node.
 */

function ruPlural(n, one, few, many) {
  const num = Number(n);
  if (!Number.isFinite(num)) return many;
  if (!Number.isInteger(num)) return few;
  const abs = Math.abs(Math.trunc(num));
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function translateCompactDuration(str) {
  return String(str)
    .replace(/<1m\b/g, "<1 мин")
    .replace(/(\d+)\s*d\b/g, "$1 д")
    .replace(/(\d+)\s*h\b/g, "$1 ч")
    .replace(/(\d+)\s*m\b/g, "$1 мин")
    .replace(/(\d+)\s*s\b/g, "$1 с");
}

function translateTimeUnit(n, unit, accusative) {
  const u = unit.toLowerCase();
  if (u === "second") return accusative ? ruPlural(n, "секунду", "секунды", "секунд") : ruPlural(n, "секунда", "секунды", "секунд");
  if (u === "minute") return accusative ? ruPlural(n, "минуту", "минуты", "минут") : ruPlural(n, "минута", "минуты", "минут");
  if (u === "hour") return ruPlural(n, "час", "часа", "часов");
  if (u === "day") return ruPlural(n, "день", "дня", "дней");
  if (u === "week") return accusative ? ruPlural(n, "неделю", "недели", "недель") : ruPlural(n, "неделя", "недели", "недель");
  if (u === "month") return ruPlural(n, "месяц", "месяца", "месяцев");
  if (u === "year") return ruPlural(n, "год", "года", "лет");
  return unit;
}

function translateGenitiveTimeUnit(n, unit) {
  const u = unit.toLowerCase();
  if (u === "second") return ruPlural(n, "секунды", "секунд", "секунд");
  if (u === "minute") return ruPlural(n, "минуты", "минут", "минут");
  if (u === "hour") return ruPlural(n, "часа", "часов", "часов");
  if (u === "day") return ruPlural(n, "дня", "дней", "дней");
  if (u === "week") return ruPlural(n, "недели", "недель", "недель");
  if (u === "month") return ruPlural(n, "месяца", "месяцев", "месяцев");
  if (u === "year") return ruPlural(n, "года", "лет", "лет");
  return unit;
}

function translateEnglishDurationList(str, accusative) {
  let s = String(str || "").trim();
  if (/^less than a minute$/i.test(s)) return "менее минуты";
  if (/^less than a second$/i.test(s)) return "менее секунды";
  s = s.replace(/^less than (\d+)\s+(second|minute|hour|day|week|month|year)s?$/i, (_, n, u) => {
    return `менее ${n} ${translateGenitiveTimeUnit(n, u)}`;
  });
  s = s.replace(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\b/gi, (_, n, u) => {
    return `${n} ${translateTimeUnit(n, u, Boolean(accusative))}`;
  });
  return s.replace(/\s*,\s*/g, " ").replace(/\s+and\s+/gi, " ").replace(/\s+/g, " ").trim();
}

function translateQuotaWindow(windowStr, caseForm) {
  const w = String(windowStr || "").trim().toLowerCase();
  const isGen = caseForm === "gen";
  if (w === "weekly") return isGen ? "недельного" : "недельный";
  if (w === "daily") return isGen ? "дневного" : "дневной";
  if (w === "monthly") return isGen ? "месячного" : "месячный";
  if (w === "hourly") return isGen ? "часового" : "часовой";
  if (w === "5-hour" || w === "five-hour" || w === "five hour") return isGen ? "5-часового" : "5-часовой";
  const m = /^(\d+)[- ](hour|day|minute)$/.exec(w);
  if (m) {
    const n = m[1];
    const u = m[2];
    if (u === "hour") return isGen ? `${n}-часового` : `${n}-часовой`;
    if (u === "day") return isGen ? `${n}-дневного` : `${n}-дневной`;
    if (u === "minute") return isGen ? `${n}-минутного` : `${n}-минутный`;
  }
  return windowStr;
}

function translateLimitLabelRu(label) {
  const s = String(label || "").trim().toLowerCase();
  const isRem = /\bremaining\b/.test(s);
  if (s.startsWith("weekly")) return isRem ? "Остаток недельного лимита" : "Недельный лимит";
  if (s.startsWith("daily")) return isRem ? "Остаток дневного лимита" : "Дневной лимит";
  if (s.startsWith("hourly")) return isRem ? "Остаток часового лимита" : "Часовой лимит";
  if (s.startsWith("monthly")) return isRem ? "Остаток месячного лимита" : "Месячный лимит";
  if (s.startsWith("5-hour") || s.startsWith("5 hour") || s.startsWith("five-hour") || s.startsWith("five hour")) {
    return isRem ? "Остаток 5-часового лимита" : "5-часовой лимит";
  }
  const compactM = /^(\d+)([smhd])\s+limit$/i.exec(s);
  if (compactM) {
    const unitRu = { s: "с", m: "мин", h: "ч", d: "д" }[compactM[2]] || compactM[2];
    return `Лимит (${compactM[1]} ${unitRu})`;
  }
  return label;
}

function translatePlanBenefit(str) {
  const s = String(str || "").trim().toLowerCase();
  if (s === "higher rate limits") return "более высокие лимиты";
  if (s === "higher quotas") return "более высокие квоты";
  if (s === "more ai credits") return "больше AI-кредитов";
  return str;
}

function translateConvVerb(verb) {
  return (
    {
      archive: "архивировать",
      unarchive: "разархивировать",
      delete: "удалить",
      rename: "переименовать",
      pin: "закрепить",
      unpin: "открепить",
      move: "переместить",
      fork: "ответвить",
      duplicate: "дублировать",
    }[String(verb || "").toLowerCase()] || verb
  );
}

function translateEntityType(word, caseForm) {
  const w = word.trim().toLowerCase();
  const map = {
    conversation: { nom: "чат", gen: "чата", acc: "чат", prep: "чате", plGen: "чатов" },
    conversations: { nom: "чаты", gen: "чатов", acc: "чаты", prep: "чатах", plGen: "чатов" },
    project: { nom: "проект", gen: "проекта", acc: "проект", prep: "проекте", plGen: "проектов" },
    projects: { nom: "проекты", gen: "проектов", acc: "проекты", prep: "проектах", plGen: "проектов" },
    workspace: { nom: "рабочая область", gen: "рабочей области", acc: "рабочую область", prep: "рабочей области", plGen: "рабочих областей" },
    workspaces: { nom: "рабочие области", gen: "рабочих областей", acc: "рабочие области", prep: "рабочих областях", plGen: "рабочих областей" },
    plugin: { nom: "плагин", gen: "плагина", acc: "плагин", prep: "плагине", plGen: "плагинов" },
    plugins: { nom: "плагины", gen: "плагинов", acc: "плагины", prep: "плагинах", plGen: "плагинов" },
    skill: { nom: "навык", gen: "навыка", acc: "навык", prep: "навыке", plGen: "навыков" },
    skills: { nom: "навыки", gen: "навыков", acc: "навыки", prep: "навыках", plGen: "навыков" },
    rule: { nom: "правило", gen: "правила", acc: "правило", prep: "правиле", plGen: "правил" },
    rules: { nom: "правила", gen: "правил", acc: "правила", prep: "правилах", plGen: "правил" },
    agent: { nom: "агент", gen: "агента", acc: "агента", prep: "агенте", plGen: "агентов" },
    agents: { nom: "агенты", gen: "агентов", acc: "агентов", prep: "агентах", plGen: "агентов" },
    subagent: { nom: "субагент", gen: "субагента", acc: "субагента", prep: "субагенте", plGen: "субагентов" },
    subagents: { nom: "субагенты", gen: "субагентов", acc: "субагентов", prep: "субагентах", plGen: "субагентов" },
    hook: { nom: "хук", gen: "хука", acc: "хук", prep: "хуке", plGen: "хуков" },
    hooks: { nom: "хуки", gen: "хуков", acc: "хуки", prep: "хуках", plGen: "хуков" },
    server: { nom: "сервер", gen: "сервера", acc: "сервер", prep: "сервере", plGen: "серверов" },
    servers: { nom: "серверы", gen: "серверов", acc: "серверы", prep: "серверах", plGen: "серверов" },
    recording: { nom: "запись", gen: "записи", acc: "запись", prep: "записи", plGen: "записей" },
    recordings: { nom: "записи", gen: "записей", acc: "записи", prep: "записях", plGen: "записей" },
    device: { nom: "устройство", gen: "устройства", acc: "устройство", prep: "устройстве", plGen: "устройств" },
    automation: { nom: "автоматизация", gen: "автоматизации", acc: "автоматизацию", prep: "автоматизации", plGen: "автоматизаций" },
    automations: { nom: "автоматизации", gen: "автоматизаций", acc: "автоматизации", prep: "автоматизациях", plGen: "автоматизаций" },
    folder: { nom: "папка", gen: "папки", acc: "папку", prep: "папке", plGen: "папок" },
    folders: { nom: "папки", gen: "папок", acc: "папки", prep: "папках", plGen: "папок" },
    resource: { nom: "ресурс", gen: "ресурса", acc: "ресурс", prep: "ресурсе", plGen: "ресурсов" },
    resources: { nom: "ресурсы", gen: "ресурсов", acc: "ресурсы", prep: "ресурсах", plGen: "ресурсов" },
    general: { nom: "основные", gen: "основных", acc: "основные", prep: "основных", plGen: "основных" },
    global: { nom: "глобальные", gen: "глобальных", acc: "глобальные", prep: "глобальных", plGen: "глобальных" },
    "side panel": { nom: "боковая панель", gen: "боковой панели", acc: "боковую панель", prep: "боковой панели", plGen: "боковых панелей" },
    "built-in browser": { nom: "встроенный браузер", gen: "встроенного браузера", acc: "встроенный браузер", prep: "встроенном браузере", plGen: "встроенных браузеров" },
    "new tab": { nom: "новая вкладка", gen: "новой вкладки", acc: "новую вкладку", prep: "новой вкладке", plGen: "новых вкладок" },
    "external browser": { nom: "внешний браузер", gen: "внешнего браузера", acc: "внешний браузер", prep: "внешнем браузере", plGen: "внешних браузеров" },
  };
  return (map[w] && map[w][caseForm]) || word;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

const EFFORT_RU = {
  "extra high": "Сверхвысокий",
  extra: "Сверхвыс.",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
  max: "Макс.",
  minimal: "Минимальный",
};

const DYNAMIC_RULES = [
  // 1. Thinking & working timers
  {
    re: /^Thought for (\d+)s$/,
    fn: (_, n) => `Думал ${n} с`,
  },
  {
    re: /^Thinking \((\d+)s\)(?:…|\.\.\.)$/,
    fn: (_, n) => `Думаю (${n} с)…`,
  },
  {
    re: /^Thinking for (\d+)s$/,
    fn: (_, n) => `Думает ${n} с`,
  },
  {
    re: /^Still thinking, (\d+) seconds?$/,
    fn: (_, n) => `Всё ещё думаю (${n} с)`,
  },
  {
    re: /^Working · (\d+)s$/,
    fn: (_, n) => `Работает · ${n} с`,
  },
  {
    re: /^Worked for ([0-9d hms<>]+?) · (.+)$/,
    fn: (_, dur, rest) => `Работал ${translateCompactDuration(dur)} · ${rest}`,
  },
  {
    re: /^Worked for ([0-9d hms<>]+)$/,
    fn: (_, dur) => `Работал ${translateCompactDuration(dur)}`,
  },
  {
    re: /^Using browser \((\d+)s\)$/,
    fn: (_, n) => `Браузер (${n} с)`,
  },
  {
    re: /^Using browser · (.+?) \((\d+)s\)$/,
    fn: (_, status, n) => `Браузер · ${status} (${n} с)`,
  },
  {
    re: /^Using browser · (.+)$/,
    fn: (_, status) => `Браузер · ${status}`,
  },
  {
    re: /^Model unavailable, retrying in (\d+)s(.*)$/,
    fn: (_, n, rest) => `Модель недоступна, повтор через ${n} с${rest.replace(/\(attempt (\d+)\/(\d+)\)/, "(попытка $1/$2)")}`,
  },
  {
    re: /^Model unavailable, retrying(.*)$/,
    fn: (_, rest) => `Модель недоступна, повтор${rest.replace(/\(attempt (\d+)\/(\d+)\)/, "(попытка $1/$2)")}`,
  },
  {
    re: /^\(attempt (\d+)\/(\d+)\)$/,
    fn: (_, a, b) => `(попытка ${a}/${b})`,
  },
  {
    re: /^Retrying transcription \(attempt (\d+)\)(?:…|\.\.\.)$/,
    fn: (_, n) => `Повтор распознавания (попытка ${n})…`,
  },

  // 2. Remaining time / reset countdowns / relative time
  {
    re: /^(\d+)d (\d+)h (\d+)m left$/,
    fn: (_, d, h, m) => `Осталось ${d} д ${h} ч ${m} мин`,
  },
  {
    re: /^(\d+)h (\d+)m left$/,
    fn: (_, h, m) => `Осталось ${h} ч ${m} мин`,
  },
  {
    re: /^(\d+)d left$/,
    fn: (_, d) => `Осталось ${d} д`,
  },
  {
    re: /^(\d+)h left$/,
    fn: (_, h) => `Осталось ${h} ч`,
  },
  {
    re: /^(\d+)m left$/,
    fn: (_, m) => `Осталось ${m} мин`,
  },
  {
    re: /^(\d+)s left$/,
    fn: (_, s) => `Осталось ${s} с`,
  },
  {
    re: /^Resets in (.+)$/i,
    fn: (_, dur) => `Сбросится через ${translateCompactDuration(dur)}`,
  },
  {
    re: /^just now$/i,
    fn: () => "только что",
  },
  {
    re: /^(\d+)(s|m|h|d|w|mo|y) ago$/,
    fn: (_, n, unit) => {
      const u = { s: "с", m: "мин", h: "ч", d: "д", w: "нед", mo: "мес", y: "г" }[unit] || unit;
      return `${n} ${u} назад`;
    },
  },
  {
    re: /^(\d+)(s|m|h|d|w|mo|y)$/,
    fn: (_, n, unit) => {
      const u = { s: "с", m: "м", h: "ч", d: "д", w: "нед", mo: "мес", y: "г" }[unit] || unit;
      return `${n}${u}`;
    },
  },
  {
    re: /^less than a second( ago)?$/i,
    fn: (_, ago) => (ago ? "менее секунды назад" : "менее секунды"),
  },
  {
    re: /^less than (\d+) seconds?( ago)?$/i,
    fn: (_, n, ago) => `менее ${n} ${ruPlural(n, "секунды", "секунд", "секунд")}${ago ? " назад" : ""}`,
  },
  {
    re: /^half a minute( ago)?$/i,
    fn: (_, ago) => (ago ? "полминуты назад" : "полминуты"),
  },
  {
    re: /^less than a minute( ago)?$/i,
    fn: (_, ago) => (ago ? "менее минуты назад" : "менее минуты"),
  },
  {
    re: /^less than (\d+) minutes?( ago)?$/i,
    fn: (_, n, ago) => `менее ${n} ${ruPlural(n, "минуты", "минут", "минут")}${ago ? " назад" : ""}`,
  },
  {
    re: /^(about |almost |over )?(\d+) (second|minute|hour|day|week|month|year)s?( ago)?$/i,
    fn: (_, prefix, n, unit, ago) => {
      const p = prefix ? prefix.trim().toLowerCase() : "";
      if (p === "about") return `около ${n} ${translateGenitiveTimeUnit(n, unit)}${ago ? " назад" : ""}`;
      if (p === "almost") return `почти ${n} ${translateTimeUnit(n, unit, Boolean(ago))}${ago ? " назад" : ""}`;
      if (p === "over") return `более ${n} ${translateGenitiveTimeUnit(n, unit)}${ago ? " назад" : ""}`;
      return `${n} ${translateTimeUnit(n, unit, Boolean(ago))}${ago ? " назад" : ""}`;
    },
  },
  {
    re: /^in (\d+) (second|minute|hour|day|week|month|year)s?$/i,
    fn: (_, n, unit) => `через ${n} ${translateTimeUnit(n, unit, true)}`,
  },
  {
    re: /^Daily at (.+)$/,
    fn: (_, t) => `Ежедневно в ${t}`,
  },
  {
    re: /^Every (\d+) minutes?(.*)$/,
    fn: (_, n, rest) => `Каждые ${n} ${ruPlural(n, "минуту", "минуты", "минут")}${rest}`,
  },
  {
    re: /^Every (\d+) hours?(.*)$/,
    fn: (_, n, rest) => `Каждые ${n} ${ruPlural(n, "час", "часа", "часов")}${rest}`,
  },

  // 3. Counts, plurals, pagination & counters
  {
    re: /^(\d+) results?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "результат", "результата", "результатов")}`,
  },
  {
    re: /^(\d+) comments?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "комментарий", "комментария", "комментариев")}`,
  },
  {
    re: /^(\d+) comments? in (.+)$/,
    fn: (_, n, target) => `${n} ${ruPlural(n, "комментарий", "комментария", "комментариев")} в ${target}`,
  },
  {
    re: /^(\d+) Drafts?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "черновик", "черновика", "черновиков")}`,
  },
  {
    re: /^(\d+) hidden hosts?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "скрытый хост", "скрытых хоста", "скрытых хостов")}`,
  },
  {
    re: /^(\d+) active conversations?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "активный чат", "активных чата", "активных чатов")}`,
  },
  {
    re: /^(\d+) archived conversations?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "архивный чат", "архивных чата", "архивных чатов")}`,
  },
  {
    re: /^(\d+) browser steps?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "шаг браузера", "шага браузера", "шагов браузера")}`,
  },
  {
    re: /^\((\d+) steps?\)$/,
    fn: (_, n) => `(${n} ${ruPlural(n, "шаг", "шага", "шагов")})`,
  },
  {
    re: /^(\d+) tasks? running$/,
    fn: (_, n) => `${ruPlural(n, "Выполняется", "Выполняются", "Выполняются")} ${n} ${ruPlural(n, "задача", "задачи", "задач")}`,
  },
  {
    re: /^(\d+) agents? working, live preview unavailable$/,
    fn: (_, n) => `${ruPlural(n, "Работает", "Работают", "Работают")} ${n} ${ruPlural(n, "агент", "агента", "агентов")}, предпросмотр недоступен`,
  },
  {
    re: /^(\d+) tools? disabled$/,
    fn: (_, n) => `${n} ${ruPlural(n, "инструмент отключён", "инструмента отключены", "инструментов отключено")}`,
  },
  {
    re: /^(\d+) tools? enabled$/,
    fn: (_, n) => `${n} ${ruPlural(n, "инструмент включён", "инструмента включены", "инструментов включено")}`,
  },
  {
    re: /^(\d+) Files? With Changes$/,
    fn: (_, n) => `${n} ${ruPlural(n, "изменённый файл", "изменённых файла", "изменённых файлов")}`,
  },
  {
    re: /^(\d+) lines? added, (\d+) lines? removed$/,
    fn: (_, a, b) =>
      `${a} ${ruPlural(a, "строка добавлена", "строки добавлены", "строк добавлено")}, ${b} ${ruPlural(b, "строка удалена", "строки удалены", "строк удалено")}`,
  },
  {
    re: /^(\d+) models? selected$/,
    fn: (_, n) => `${ruPlural(n, "Выбрана", "Выбраны", "Выбрано")} ${n} ${ruPlural(n, "модель", "модели", "моделей")}`,
  },
  {
    re: /^(\d+) plugins?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "плагин", "плагина", "плагинов")}`,
  },
  {
    re: /^(\d+) calls?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "звонок", "звонка", "звонков")}`,
  },
  {
    re: /^(\d+) recordings?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "запись", "записи", "записей")}`,
  },
  {
    re: /^(\d+) audio attachments?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "аудиовложение", "аудиовложения", "аудиовложений")}`,
  },
  {
    re: /^(\d+) image attachments?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "изображение", "изображения", "изображений")}`,
  },
  {
    re: /^(\d+) video attachments?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "видеовложение", "видеовложения", "видеовложений")}`,
  },
  {
    re: /^(\d+) Side Questions?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "доп. вопрос", "доп. вопроса", "доп. вопросов")}`,
  },
  {
    re: /^(\d+) Help · (\d+) Side Questions?$/,
    fn: (_, h, q) => `${h} ${ruPlural(h, "подсказка", "подсказки", "подсказок")} · ${q} ${ruPlural(q, "доп. вопрос", "доп. вопроса", "доп. вопросов")}`,
  },
  {
    re: /^View (\d+) help(?: items?)? and (\d+) side questions?$/,
    fn: (_, h, q) => `Показать: ${h} ${ruPlural(h, "подсказку", "подсказки", "подсказок")} и ${q} ${ruPlural(q, "доп. вопрос", "доп. вопроса", "доп. вопросов")}`,
  },
  {
    re: /^View (\d+) help(?: items?)?$/,
    fn: (_, h) => `Показать ${h} ${ruPlural(h, "подсказку", "подсказки", "подсказок")}`,
  },
  {
    re: /^View (\d+) side questions?$/,
    fn: (_, q) => `Показать ${q} ${ruPlural(q, "доп. вопрос", "доп. вопроса", "доп. вопросов")}`,
  },
  {
    re: /^(\d+) of (\d+\+?)$/,
    fn: (_, a, b) => `${a} из ${b}`,
  },
  {
    re: /^Step (\d+) of (\d+)$/,
    fn: (_, a, b) => `Шаг ${a} из ${b}`,
  },
  {
    re: /^Turn (\d+) of (\d+)$/,
    fn: (_, a, b) => `Ход ${a} из ${b}`,
  },
  {
    re: /^Turns (\d+)–(\d+)$/,
    fn: (_, a, b) => `Ходы ${a}–${b}`,
  },
  {
    re: /^Question (\d+) of (\d+)$/,
    fn: (_, a, b) => `Вопрос ${a} из ${b}`,
  },
  {
    re: /^Plan, (\d+) of (\d+) steps done$/,
    fn: (_, a, b) => `План: выполнено ${a} из ${b} ${ruPlural(b, "шага", "шагов", "шагов")}`,
  },
  {
    re: /^Proceed with implementation plan and (\d+) comments?$/,
    fn: (_, n) => `Выполнить план реализации с ${n} ${ruPlural(n, "комментарием", "комментариями", "комментариями")}`,
  },
  {
    re: /^Open image (\d+) of (\d+)$/,
    fn: (_, a, b) => `Открыть изображение ${a} из ${b}`,
  },
  {
    re: /^Go to page (\d+)$/,
    fn: (_, n) => `Перейти на страницу ${n}`,
  },
  {
    re: /^Go to slide (\d+)$/,
    fn: (_, n) => `Перейти к слайду ${n}`,
  },
  {
    re: /^Go to turn (\d+) of (\d+)$/,
    fn: (_, a, b) => `Перейти к ходу ${a} из ${b}`,
  },
  {
    re: /^See (\d+) more (.+)$/,
    fn: (_, n, what) => `Показать ещё ${n} ${translateEntityType(what, "plGen")}`,
  },
  {
    re: /^See (\d+) more$/,
    fn: (_, n) => `Показать ещё ${n}`,
  },
  {
    re: /^Show (\d+) More$/i,
    fn: (_, n) => `Показать ещё ${n}`,
  },
  {
    re: /^Show (\d+) more subagents?$/,
    fn: (_, n) => `Показать ещё ${n} ${ruPlural(n, "субагента", "субагентов", "субагентов")}`,
  },
  {
    re: /^Show (\d+) earlier steps?$/,
    fn: (_, n) => `Показать ${n} ${ruPlural(n, "предыдущий шаг", "предыдущих шага", "предыдущих шагов")}`,
  },
  {
    re: /^Show (\d+) breakdowns?$/,
    fn: (_, n) => `Показать детализацию (${n})`,
  },
  {
    re: /^Showing first (\d+) references$/,
    fn: (_, n) => `Показаны первые ${n} ${ruPlural(n, "упоминание", "упоминания", "упоминаний")}`,
  },
  {
    re: /^Showing latest (\d+) browser steps$/,
    fn: (_, n) => `Показаны последние ${n} ${ruPlural(n, "шаг браузера", "шага браузера", "шагов браузера")}`,
  },
  {
    re: /^See all \((\d+)\)$/,
    fn: (_, n) => `Показать все (${n})`,
  },
  {
    re: /^See more in (.+)$/,
    fn: (_, x) => `Ещё в «${x}»`,
  },
  {
    re: /^See less in (.+)$/,
    fn: (_, x) => `Свернуть «${x}»`,
  },
  {
    re: /^See more (.+)$/,
    fn: (_, what) => `Ещё ${translateEntityType(what, "plGen")}`,
  },
  {
    re: /^No messages in last (\d+) steps [·—,-]\s*[Ll]oad (?:more|older)$/,
    fn: (_, n) => `Нет сообщений за последние ${n} ${ruPlural(n, "шаг", "шага", "шагов")} · Загрузить ранние`,
  },
  {
    re: /^No visible messages in last (\d+) steps\. Activate Load older messages to continue\.$/,
    fn: (_, n) => `Нет видимых сообщений за последние ${n} ${ruPlural(n, "шаг", "шага", "шагов")}. Нажмите «Загрузить ранние сообщения», чтобы продолжить.`,
  },
  {
    re: /^Waiting for (\d+) timers?$/,
    fn: (_, n) => `Ожидание ${n} ${ruPlural(n, "таймера", "таймеров", "таймеров")}`,
  },
  {
    re: /^Waiting for command completion \(up to (\d+) seconds?\)$/,
    fn: (_, n) => `Ожидание завершения команды (до ${n} ${ruPlural(n, "секунды", "секунд", "секунд")})`,
  },
  {
    re: /^Waiting for (.+)$/,
    fn: (_, x) => `Ожидание: ${x}`,
  },

  // 4. Queued messages / git / terminal / editor / playback
  {
    re: /^Message queued\.(?: (\d+) messages in queue\.)? Sends after agent finishes working\. Actions available: Send Now, Edit, Delete\.$/,
    fn: (_, n) =>
      n
        ? `Сообщение в очереди (всего в очереди: ${n}). Будет отправлено после завершения работы агента. Действия: Отправить сейчас, Изменить, Удалить.`
        : `Сообщение в очереди. Будет отправлено после завершения работы агента. Действия: Отправить сейчас, Изменить, Удалить.`,
  },
  {
    re: /^Sort and filter conversations \((\d+) active\)$/,
    fn: (_, n) => `Сортировка и фильтрация чатов (активно: ${n})`,
  },
  {
    re: /^Marked (\d+) conversations as read$/,
    fn: (_, n) => `${ruPlural(n, "Отмечен", "Отмечено", "Отмечено")} ${n} ${ruPlural(n, "чат", "чата", "чатов")} как прочитанные`,
  },
  {
    re: /^Push (\d+) commits? to (.+)$/,
    fn: (_, n, target) => `Отправить ${n} ${ruPlural(n, "коммит", "коммита", "коммитов")} в ${target}`,
  },
  {
    re: /^Pushed (\d+) commits? to (.+)\.$/,
    fn: (_, n, target) => `Отправлено ${n} ${ruPlural(n, "коммит", "коммита", "коммитов")} в ${target}.`,
  },
  {
    re: /^Pushed to (.+)\.$/,
    fn: (_, target) => `Отправлено в ${target}.`,
  },
  {
    re: /^Committed to (.+)\.$/,
    fn: (_, target) => `Закоммичено в ${target}.`,
  },
  {
    re: /^Amended commit on (.+)\.$/,
    fn: (_, target) => `Коммит дополнен в ${target}.`,
  },
  {
    re: /^Publish (.+) to origin$/,
    fn: (_, ref) => `Опубликовать ${ref} в origin`,
  },
  {
    re: /^Published (.+) to origin\.$/,
    fn: (_, ref) => `Ветка ${ref} опубликована в origin.`,
  },
  {
    re: /^Fold lines (\d+)-(\d+)$/,
    fn: (_, a, b) => `Свернуть строки ${a}–${b}`,
  },
  {
    re: /^Unfold lines (\d+)-(\d+)$/,
    fn: (_, a, b) => `Развернуть строки ${a}–${b}`,
  },
  {
    re: /^Playback speed ([\d.]+)x$/,
    fn: (_, s) => `Скорость воспроизведения ${s}x`,
  },
  {
    re: /^Voice [Ss]peed, ([\d.]+x)$/,
    fn: (_, s) => `Скорость голоса: ${s}`,
  },
  {
    re: /^Zoom (\d+)%, reset to fit$/,
    fn: (_, p) => `Масштаб ${p}%, сбросить по размеру`,
  },
  {
    re: /^Stop (\d+) selected$/,
    fn: (_, n) => `Остановить выбранные (${n})`,
  },
  {
    re: /^Stop (\d+) ([^?]+)\?$/,
    fn: (_, n, what) => `Остановить ${n} ${translateEntityType(what.replace(/s$/, ""), "acc")}?`,
  },

  // 5. Selectors / current value / accessibility labels
  {
    re: /^Select model, current: (.+)$/,
    fn: (_, cur) => `Выбор модели, текущая: ${cur}`,
  },
  {
    re: /^Select project, current: (.+)$/,
    fn: (_, cur) => `Выбор проекта, текущий: ${cur}`,
  },
  {
    re: /^Where the agent runs, current: (.+)$/,
    fn: (_, cur) => `Среда выполнения агента, текущая: ${cur}`,
  },
  {
    re: /^Agent permissions preset selector, current: (.+)$/,
    fn: (_, cur) => `Выбор профиля разрешений агента, текущий: ${cur}`,
  },
  {
    re: /^Agent permissions preset: (.+)$/,
    fn: (_, cur) => `Профиль разрешений агента: ${cur}`,
  },
  {
    re: /^Branch, current: (.+)$/,
    fn: (_, cur) => `Ветка, текущая: ${cur}`,
  },
  {
    re: /^Branch (.+) no longer exists$/,
    fn: (_, b) => `Ветка ${b} больше не существует`,
  },

  // 6. Common actions / menus / dialogs / buttons
  {
    re: /^Open in (.+)$/,
    fn: (_, target) => `Открыть в ${target}`,
  },
  {
    re: /^Open Subagent: (.+)$/,
    fn: (_, name) => `Открыть субагента: ${name}`,
  },
  {
    re: /^Open (.+) skill$/,
    fn: (_, name) => `Открыть навык «${name}»`,
  },
  {
    re: /^Open (.+) settings$/,
    fn: (_, name) => `Открыть настройки: ${translateEntityType(name, "nom")}`,
  },
  {
    re: /^Reopen (.+) settings$/,
    fn: (_, name) => `Снова открыть настройки: ${translateEntityType(name, "nom")}`,
  },
  {
    re: /^Open conversation (.+)$/,
    fn: (_, name) => `Открыть чат: ${name}`,
  },
  {
    re: /^Open the (.+) plugin$/,
    fn: (_, name) => `Открыть плагин «${name}»`,
  },
  {
    re: /^Open URL in system browser: (.+)$/,
    fn: (_, u) => `Открыть URL в системном браузере: ${u}`,
  },
  {
    re: /^Open (.+) link\?$/,
    fn: (_, x) => `Открыть ссылку ${x}?`,
  },
  {
    re: /^Opens the New Conversation screen for this (.+)$/,
    fn: (_, t) => `Открывает экран нового чата для этого объекта (${translateEntityType(t, "nom")})`,
  },
  {
    re: /^More actions for (.+)$/,
    fn: (_, name) => `Дополнительные действия: ${name}`,
  },
  {
    re: /^More options for (.+)$/,
    fn: (_, name) => `Дополнительные параметры: ${name}`,
  },
  {
    re: /^More for (.+)$/,
    fn: (_, name) => `Ещё для ${name}`,
  },
  {
    re: /^Details for (.+)$/,
    fn: (_, name) => `Подробности: ${name}`,
  },
  {
    re: /^Back to (.+)$/,
    fn: (_, name) => `Назад к «${name}»`,
  },
  {
    re: /^Enable Word Wrap(.*)$/,
    fn: (_, rest) => `Включить перенос строк${rest}`,
  },
  {
    re: /^Disable Word Wrap(.*)$/,
    fn: (_, rest) => `Отключить перенос строк${rest}`,
  },
  {
    re: /^Toggle Word Wrap(.*)$/,
    fn: (_, rest) => `Переключить перенос строк${rest}`,
  },
  {
    re: /^Enable (.+) tool for (.+)$/,
    fn: (_, tool, target) => `Включить инструмент «${tool}» для ${target}`,
  },
  {
    re: /^Disable (.+) tool for (.+)$/,
    fn: (_, tool, target) => `Отключить инструмент «${tool}» для ${target}`,
  },
  {
    re: /^Continue \((.+)\)$/,
    fn: (_, key) => `Продолжить (${key})`,
  },
  {
    re: /^Cancel \((.+)\)$/,
    fn: (_, key) => `Отмена (${key})`,
  },
  {
    re: /^Submit \((.+)\)$/,
    fn: (_, key) => `Отправить (${key})`,
  },
  {
    re: /^Send Message \((.+)\)$/,
    fn: (_, key) => `Отправить сообщение (${key})`,
  },
  {
    re: /^Send now: (.+)$/,
    fn: (_, text) => `Отправить сейчас: ${text}`,
  },
  {
    re: /^Skip \((.+)\), Skip All \((.+)\)$/,
    fn: (_, k1, k2) => `Пропустить (${k1}), Пропустить всё (${k2})`,
  },
  {
    re: /^Cancel Questionnaire and Stop the Agent \((.+)\)$/,
    fn: (_, k) => `Отменить опрос и остановить агента (${k})`,
  },
  {
    re: /^Recording shortcut for (.+)\. Press keys to bind, Enter to save, Escape to cancel\.$/,
    fn: (_, name) => `Запись сочетания клавиш для «${name}». Нажмите клавиши, Enter — сохранить, Esc — отмена.`,
  },
  {
    re: /^Shortcut (.+) for (.+)$/,
    fn: (_, sc, name) => `Сочетание ${sc} для «${name}»`,
  },
  {
    re: /^Add shortcut for (.+)$/,
    fn: (_, name) => `Добавить сочетание клавиш для «${name}»`,
  },
  {
    re: /^Remove shortcut (.+) for (.+)$/,
    fn: (_, sc, name) => `Удалить сочетание ${sc} для «${name}»`,
  },
  {
    re: /^Conflicts with "(.+)" \(press Enter to replace\)$/,
    fn: (_, name) => `Конфликтует с «${name}» (нажмите Enter для замены)`,
  },
  {
    re: /^Conflicts with "(.+)" \((.+)\)$/,
    fn: (_, a, b) => `Конфликтует с «${a}» (${b})`,
  },
  {
    re: /^Conflicts with "(.+)"$/,
    fn: (_, name) => `Конфликтует с «${name}»`,
  },
  {
    re: /^Conflict: also assigned to (.+)$/,
    fn: (_, name) => `Конфликт: также назначено для «${name}»`,
  },

  // 7. Permissions & approval dialogs
  {
    re: /^An (.+?) with the ID [“"](.+?)[”"] already exists\.$/,
    fn: (_, t, id) => `${capitalize(translateEntityType(t, "nom"))} с ID «${id}» уже существует.`,
  },
  {
    re: /^An (.+?) with this name already exists on this computer\. Run it remotely, or go back and rename it\.$/,
    fn: (_, t) => `${capitalize(translateEntityType(t, "nom"))} с таким именем уже существует на этом компьютере. Запустите удалённо или вернитесь назад и переименуйте.`,
  },
  {
    re: /^Are you sure you want to delete the hook "(.+)"\?$/,
    fn: (_, name) => `Вы уверены, что хотите удалить хук «${name}»?`,
  },
  {
    re: /^Allow (.+)\?$/,
    fn: (_, target) => `Разрешить ${target}?`,
  },
  {
    re: /^Save rule to always allow (.+)\?$/,
    fn: (_, target) => `Сохранить правило, чтобы всегда разрешать ${target}?`,
  },
  {
    re: /^Yes, allow downloads from (.+) for this run$/,
    fn: (_, origin) => `Да, разрешить загрузки с ${origin} для этого запуска`,
  },
  {
    re: /^Yes, allow downloads from (.+) in this conversation$/,
    fn: (_, origin) => `Да, разрешить загрузки с ${origin} в этом чате`,
  },
  {
    re: /^Yes, always allow downloads from (.+)$/,
    fn: (_, origin) => `Да, всегда разрешать загрузки с ${origin}`,
  },
  {
    re: /^Yes, allow (.+) in this conversation$/,
    fn: (_, target) => `Да, разрешить ${target} в этом чате`,
  },
  {
    re: /^Yes, always allow (.+)$/,
    fn: (_, target) => `Да, всегда разрешать ${target}`,
  },
  {
    re: /^Yes, and always allow '(.+)' in this conversation$/,
    fn: (_, target) => `Да, и всегда разрешать «${target}» в этом чате`,
  },
  {
    re: /^Yes, and always allow '(.+)'$/,
    fn: (_, target) => `Да, и всегда разрешать «${target}»`,
  },
  {
    re: /^Yes, save rule for '(.+)' globally$/,
    fn: (_, target) => `Да, сохранить правило для «${target}» глобально`,
  },
  {
    re: /^Yes, save rule for '(.+)' in this conversation$/,
    fn: (_, target) => `Да, сохранить правило для «${target}» в этом чате`,
  },
  {
    re: /^Requesting permission to (access|read|write|execute|run|modify|delete|create|open|connect to|download|upload) (.+)$/i,
    fn: (_, act, target) => {
      const m = {
        access: "доступ к",
        read: "чтение",
        write: "запись в",
        execute: "выполнение",
        run: "запуск",
        modify: "изменение",
        delete: "удаление",
        create: "создание",
        open: "открытие",
        "connect to": "подключение к",
        download: "загрузку",
        upload: "отправку",
      };
      return `Запрос разрешения на ${m[act.toLowerCase()] || act} ${target}`;
    },
  },
  {
    re: /^Requires manual confirmation: (.+)$/,
    fn: (_, detail) => `Требует ручного подтверждения: ${detail}`,
  },
  {
    re: /^Conflicts with your configured Ask permission: (.+)$/,
    fn: (_, detail) => `Конфликтует с настроенным разрешением «Спрашивать»: ${detail}`,
  },
  {
    re: /^Wants to run: (.+)$/,
    fn: (_, cmd) => `Хочет выполнить: ${cmd}`,
  },

  // 8. Budget / quota / credits / accounts / greetings
  {
    re: /^(\d+) items? in (.+) exceeded the customization budget and (?:was|were) excluded from context\.$/,
    fn: (_, n, label) => `${n} ${ruPlural(n, "элемент", "элемента", "элементов")} в «${label}» ${ruPlural(n, "превысил", "превысили", "превысили")} бюджет кастомизации и ${ruPlural(n, "был исключён", "были исключены", "были исключены")} из контекста.`,
  },
  {
    re: /^(\d+) rules? exceeded the rules budget and (?:was|were) demoted from full inline content to a file-path pointer\.$/,
    fn: (_, n) => `${n} ${ruPlural(n, "правило превысило", "правила превысили", "правил превысили")} бюджет правил, поэтому вместо полного текста в контекст передана ссылка на файл.`,
  },
  {
    re: /^(\d+) tools? in this MCP server \((.+?) tokens\) exceeded the customization budget and were excluded from context\.$/,
    fn: (_, n, tok) => `${n} ${ruPlural(n, "инструмент", "инструмента", "инструментов")} этого MCP-сервера (${tok} токенов) превысили бюджет кастомизации и были исключены из контекста.`,
  },
  {
    re: /^All tools in this MCP server \((.+?) tokens\) exceeded the customization budget and were excluded from context\.$/,
    fn: (_, tok) => `Все инструменты этого MCP-сервера (${tok} токенов) превысили бюджет кастомизации и были исключены из контекста.`,
  },
  {
    re: /^Exceeded the customization token budget \((.+?) tokens\) and was excluded from context\.$/,
    fn: (_, tok) => `Превышен бюджет токенов кастомизации (${tok} токенов), элемент исключён из контекста.`,
  },
  {
    re: /^Exceeded the rules token budget\. Full rule content \((.+?) tokens\) was replaced with a lightweight file-path pointer in context\.$/,
    fn: (_, tok) => `Превышен бюджет токенов правил. Полный текст правила (${tok} токенов) заменён в контексте лёгкой ссылкой на файл.`,
  },
  {
    re: /^Available AI Credits: (.+)$/,
    fn: (_, n) => `Доступно AI Credits: ${n}`,
  },
  {
    re: /^You need (at least .+|more) AI Credits to send messages\. To continue using (.+) now, purchase more AI Credits\.$/,
    fn: (_, amt, model) => `Для отправки сообщений нужно ${amt === "more" ? "больше" : amt.replace("at least ", "минимум ")} AI Credits. Чтобы продолжить использовать ${model === "this model" ? "эту модель" : model} сейчас, докупите AI Credits.`,
  },
  {
    re: /^Your quota for (.+) has been reached\. Switch to another available model to continue\.$/,
    fn: (_, model) => `Квота для ${model} исчерпана. Переключитесь на другую доступную модель, чтобы продолжить.`,
  },
  {
    re: /^Your quota for (.+) will reset on (.+)\. Switch to another available model to continue\.$/,
    fn: (_, model, dt) => `Квота для ${model} обновится ${dt}. Переключитесь на другую доступную модель, чтобы продолжить.`,
  },
  {
    re: /^Your plan's baseline quota will refresh on (.+)\.$/,
    fn: (_, dt) => `Базовая квота вашего тарифа обновится ${dt}.`,
  },
  {
    re: /^You have (\d+) conversations in progress\. Updating will cancel them and you'll need to manually restart them\.$/,
    fn: (_, n) => `У вас сейчас ${n} ${ruPlural(n, "активный чат", "активных чата", "активных чатов")}. Обновление прервёт их, и вам придётся перезапустить их вручную.`,
  },
  {
    re: /^Welcome back, (.+)\. Where should we pick up\?$/,
    fn: (_, name) => `С возвращением, ${name}. На чём мы остановились?`,
  },
  {
    re: /^Welcome to (.+)!$/,
    fn: (_, name) => `Добро пожаловать в ${name}!`,
  },
  {
    re: /^Good to see you, (.+)\. What's next\?$/,
    fn: (_, name) => `Рады видеть вас, ${name}. Чем займёмся?`,
  },
  {
    re: /^Hey (.+), what should we build today\?$/,
    fn: (_, name) => `Привет, ${name}! Что создадим сегодня?`,
  },
  {
    re: /^Hey (.+)!$/,
    fn: (_, name) => `Привет, ${name}!`,
  },
  {
    re: /^Hello, (.+)!$/,
    fn: (_, name) => `Здравствуйте, ${name}!`,
  },
  {
    re: /^Help us improve (.+)\.$/,
    fn: (_, name) => `Помогите нам улучшить ${name}.`,
  },

  // 9. Browser / agent step titles & statuses
  {
    re: /^Typed '([\s\S]*)' in Browser$/,
    fn: (_, t) => `Введено «${t}» в браузере`,
  },
  {
    re: /^Typing '([\s\S]*)' in Browser$/,
    fn: (_, t) => `Ввод «${t}» в браузере`,
  },
  {
    re: /^Ran command: (.+)$/,
    fn: (_, c) => `Выполнена команда: ${c}`,
  },
  {
    re: /^Read URL: (.+)$/,
    fn: (_, u) => `Прочитан URL: ${u}`,
  },
  {
    re: /^Opened browser: (.+)$/,
    fn: (_, u) => `Открыт браузер: ${u}`,
  },
  {
    re: /^Searched for "(.+)"$/,
    fn: (_, q) => `Поиск: «${q}»`,
  },
  {
    re: /^Searched for files: (.+)$/,
    fn: (_, p) => `Поиск файлов: ${p}`,
  },
  {
    re: /^Searched web: "(.+)"$/,
    fn: (_, q) => `Поиск в интернете: «${q}»`,
  },
  {
    re: /^Code search: "(.+)"$/,
    fn: (_, q) => `Поиск по коду: «${q}»`,
  },
  {
    re: /^Internal search: "(.+)"$/,
    fn: (_, q) => `Внутренний поиск: «${q}»`,
  },
  {
    re: /^Listed directory (.+)$/,
    fn: (_, d) => `Просмотр папки ${d}`,
  },
  {
    re: /^Viewed (.+)$/,
    fn: (_, f) => `Просмотрено: ${f}`,
  },
  {
    re: /^Used MCP tool: (.+)$/,
    fn: (_, t) => `Использован MCP-инструмент: ${t}`,
  },
  {
    re: /^Invoked subagent: (.+)$/,
    fn: (_, s) => `Запущен субагент: ${s}`,
  },
  {
    re: /^Agent finished: (.+)$/,
    fn: (_, s) => `Агент завершил: ${s}`,
  },
  {
    re: /^Browser task: "(.+)"$/,
    fn: (_, t) => `Задача браузера: «${t}»`,
  },
  {
    re: /^Forked from (.+)$/,
    fn: (_, p) => `Ответвлено от ${p}`,
  },
  {
    re: /^Generated image: "(.+)"$/,
    fn: (_, p) => `Создано изображение: «${p}»`,
  },
  {
    re: /^Generated with (.+)$/,
    fn: (_, g) => `Создано с помощью ${g}`,
  },
  {
    re: /^Generating with (.+)$/,
    fn: (_, g) => `Генерация с помощью ${g}`,
  },
  {
    re: /^Generate with (.+)$/,
    fn: (_, g) => `Создать с помощью ${g}`,
  },

  // 10. Settings / permissions / accounts / plugins / errors / connections
  {
    re: /^(\d+) Queues after the turn$/,
    fn: (_, k) => `${k} — в очередь после хода`,
  },
  {
    re: /^(\d+) Sends immediately$/,
    fn: (_, k) => `${k} — отправить сразу`,
  },
  {
    re: /^(\d+) On empty prompt, sends next in queue$/,
    fn: (_, k) => `${k} — при пустом поле отправляет следующее из очереди`,
  },
  {
    re: /^(.+) \(disabled by admin\)$/,
    fn: (_, x) => `${x} (отключено администратором)`,
  },
  {
    re: /^(.+) needs you to sign in before it can be used\.$/,
    fn: (_, x) => `Чтобы использовать ${x}, необходимо войти в аккаунт.`,
  },
  {
    re: /^(.+) is no longer available\. Runs will fail until you pick another model\.$/,
    fn: (_, m) => `Модель ${m} больше недоступна. Запуски будут завершаться с ошибкой, пока вы не выберете другую модель.`,
  },
  {
    re: /^(.+) is no longer available\. Runs use (.+) instead\.$/,
    fn: (_, m1, m2) => `Модель ${m1} больше недоступна. Вместо неё используется ${m2}.`,
  },
  {
    re: /^(.+) wants to connect to (.+)$/,
    fn: (_, a, b) => `${a} запрашивает подключение к ${b}`,
  },
  {
    re: /^An embedded page at (.+) wants to connect to (.+)$/,
    fn: (_, a, b) => `Встроенная страница (${a}) запрашивает подключение к ${b}`,
  },
  {
    re: /^An embedded page on this page wants to connect to (.+)$/,
    fn: (_, b) => `Встроенная страница запрашивает подключение к ${b}`,
  },
  {
    re: /^This page wants to connect to (.+)$/,
    fn: (_, b) => `Эта страница запрашивает подключение к ${b}`,
  },
  {
    re: /^An embedded page at (.+) says$/,
    fn: (_, a) => `Сообщение со встроенной страницы (${a})`,
  },
  {
    re: /^Connect an account for (.+) so the agent can run automations\.$/,
    fn: (_, c) => `Подключите аккаунт для ${c}, чтобы агент мог запускать автоматизации.`,
  },
  {
    re: /^Sign in to (.+) remotely$/,
    fn: (_, a) => `Удалённый вход в ${a}`,
  },
  {
    re: /^Sign in to use (.+)!$/,
    fn: (_, x) => `Войдите, чтобы использовать ${x}!`,
  },
  {
    re: /^Sign in to (.+)$/,
    fn: (_, x) => `Войти в ${x}`,
  },
  {
    re: /^Sign in from the (.+) panel\.$/,
    fn: (_, x) => `Войдите на панели «${x}».`,
  },
  {
    re: /^Signed in: (.+)$/,
    fn: (_, x) => `Вы вошли: ${x}`,
  },
  {
    re: /^You're signing in on (.+)\. Your sign-in stays on that machine\.$/,
    fn: (_, x) => `Вы выполняете вход на ${x}. Данные входа останутся на этой машине.`,
  },
  {
    re: /^Account this MCP server uses: (.+)$/,
    fn: (_, x) => `Аккаунт, который использует этот MCP-сервер: ${x}`,
  },
  {
    re: /^MCP server (.+) requires authentication$/,
    fn: (_, g) => `MCP-сервер «${g}» требует аутентификации`,
  },
  {
    re: /^MCP server (.+) requires authentication: sign in to "(.+)" in the Accounts section of plugin "(.+)"$/,
    fn: (_, g, g2, p) => `MCP-сервер «${g}» требует аутентификации: войдите в «${g2}» в разделе «Аккаунты» плагина «${p}».`,
  },
  {
    re: /^The (.+) MCP server requires configuration parameters before it can be started\.$/,
    fn: (_, s) => `Перед запуском MCP-сервера «${s}» необходимо задать параметры конфигурации.`,
  },
  {
    re: /^Connected to (.+)$/,
    fn: (_, x) => `Подключено к ${x}`,
  },
  {
    re: /^Connecting to (.+)(?:…|\.\.\.)$/,
    fn: (_, x) => `Подключение к ${x}…`,
  },
  {
    re: /^Couldn't connect to (.+)$/,
    fn: (_, x) => `Не удалось подключиться к ${x}`,
  },
  {
    re: /^This window's agents, files, and terminals are on (.+)\.$/,
    fn: (_, f) => `Агенты, файлы и терминалы этого окна находятся на ${f}.`,
  },
  {
    re: /^Switch environment \((.+)\)$/,
    fn: (_, a) => `Сменить среду (${a})`,
  },
  {
    re: /^System default \((.+)\)$/,
    fn: (_, c) => `По умолчанию в системе (${c})`,
  },
  {
    re: /^Release channel: (.+)$/,
    fn: (_, c) => `Канал обновлений: ${c}`,
  },
  {
    re: /^Language server: (.+)$/,
    fn: (_, b) => `Языковой сервер: ${b}`,
  },
  {
    re: /^Search for "(.+)" in the Marketplace$/,
    fn: (_, b) => `Искать «${b}» в Маркетплейсе`,
  },
  {
    re: /^Search Google for "(.+)"$/,
    fn: (_, c) => `Искать «${c}» в Google`,
  },
  {
    re: /^No plugins found for "(.+)"\.$/,
    fn: (_, b) => `По запросу «${b}» плагины не найдены.`,
  },
  {
    re: /^No apps found for "(.+)"\.$/,
    fn: (_, l) => `По запросу «${l}» приложения не найдены.`,
  },
  {
    re: /^No matching (.+)$/,
    fn: (_, b) => `Нет подходящих: ${translateEntityType(b, "plGen")}`,
  },
  {
    re: /^No remote (.+)$/,
    fn: (_, b) => `Нет удалённых: ${translateEntityType(b, "plGen")}`,
  },
  {
    re: /^Plugins in (.+)$/,
    fn: (_, c) => `Плагины в «${c}»`,
  },
  {
    re: /^Add bundle (.+)$/,
    fn: (_, b) => `Добавить набор «${b}»`,
  },
  {
    re: /^Added (.+)\.$/,
    fn: (_, u) => `Добавлено: ${u}.`,
  },
  {
    re: /^Adding plugins from (.+)$/,
    fn: (_, v) => `Добавление плагинов из ${v}`,
  },
  {
    re: /^Review (.+) before installing$/,
    fn: (_, k) => `Проверьте «${k}» перед установкой`,
  },
  {
    re: /^Review permissions for (.+)$/,
    fn: (_, i) => `Проверить разрешения для ${i}`,
  },
  {
    re: /^Set up (.+)$/,
    fn: (_, i) => `Настроить ${i}`,
  },
  {
    re: /^Deleted "(.+)"\.$/,
    fn: (_, x) => `Удалено: «${x}».`,
  },
  {
    re: /^Removed (.+)\.$/,
    fn: (_, x) => `Удалено: ${x}.`,
  },
  {
    re: /^Enabled "(.+)"\.$/,
    fn: (_, x) => `Включено: «${x}».`,
  },
  {
    re: /^Started "(.+)"\.$/,
    fn: (_, x) => `Запущено: «${x}».`,
  },
  {
    re: /^Restarted "(.+)"\.$/,
    fn: (_, x) => `Перезапущено: «${x}».`,
  },
  {
    re: /^Run (.+) now$/,
    fn: (_, x) => `Запустить «${x}» сейчас`,
  },
  {
    re: /^Delete cookies for (.+)$/,
    fn: (_, s) => `Удалить файлы cookie для ${s}`,
  },
  {
    re: /^Remove (.+) from list$/,
    fn: (_, a) => `Удалить ${a} из списка`,
  },
  {
    re: /^Remove (.+) from Recent$/,
    fn: (_, h) => `Удалить ${h} из недавних`,
  },
  {
    re: /^Removed (.+) from Recent$/,
    fn: (_, h) => `${h} удалён из недавних`,
  },
  {
    re: /^Hide (.+) from this list$/,
    fn: (_, h) => `Скрыть ${h} из этого списка`,
  },
  {
    re: /^Show (.+) in the list again$/,
    fn: (_, h) => `Снова показывать ${h} в списке`,
  },
  {
    re: /^Showing (.+) again$/,
    fn: (_, h) => `${h} снова отображается`,
  },
  {
    re: /^Enter (.+) name\.\.\.$/,
    fn: (_, d) => `Введите название (${translateEntityType(d, "gen")})…`,
  },
  {
    re: /^Enter (.+)\.\.\.$/,
    fn: (_, d) => `Введите ${d}…`,
  },
  {
    re: /^Filter skills and rules: (.+)$/,
    fn: (_, f) => `Фильтр навыков и правил: ${f}`,
  },
  {
    re: /^Side panel (.+)$/,
    fn: (_, b) => `Боковая панель: ${b}`,
  },
  {
    re: /^Aux pane (.+)$/,
    fn: (_, b) => `Доп. панель: ${b}`,
  },
  {
    re: /^Pin Entire (.+)$/,
    fn: (_, t) => `Закрепить весь ${translateEntityType(t, "acc")}`,
  },
  {
    re: /^Copy (.+) Name$/,
    fn: (_, t) => `Копировать название (${translateEntityType(t, "gen")})`,
  },
  {
    re: /^Edit (.+) name$/,
    fn: (_, t) => `Изменить название (${translateEntityType(t, "gen")})`,
  },
  {
    re: /^Edit comment: (.+)$/,
    fn: (_, c) => `Изменить комментарий: ${c}`,
  },
  {
    re: /^Edit side question title: (.+)$/,
    fn: (_, a) => `Изменить заголовок доп. вопроса: ${a}`,
  },
  {
    re: /^Delete side question: (.+)$/,
    fn: (_, a) => `Удалить доп. вопрос: ${a}`,
  },
  {
    re: /^Side Question: (.+)$/,
    fn: (_, a) => `Доп. вопрос: ${a}`,
  },
  {
    re: /^Move to Group: (.+)$/,
    fn: (_, g) => `Переместить в группу: ${g}`,
  },
  {
    re: /^Moved conversation (.+)$/,
    fn: (_, c) => `Чат ${c} перемещён`,
  },
  {
    re: /^Creating (.+)(?:…|\.\.\.)$/,
    fn: (_, x) => `Создание (${translateEntityType(x, "gen")})…`,
  },
  {
    re: /^Creating (.+)$/,
    fn: (_, x) => `Создание: ${x}`,
  },
  {
    re: /^Version (.+)$/,
    fn: (_, v) => `Версия ${v}`,
  },
  {
    re: /^(.+?) \((Extra High|High|Medium|Low|Max|Minimal)(?: thinking)?\)$/i,
    fn: (_, model, eff) => `${model} (${EFFORT_RU[eff.toLowerCase()] || eff})`,
  },
  {
    re: /^Orchestrator (.+?) (Extra High|High|Medium|Low|Max|Minimal)$/i,
    fn: (_, model, eff) => `Оркестратор ${model} ${EFFORT_RU[eff.toLowerCase()] || eff}`,
  },
  {
    re: /^Orchestrator (.+)$/,
    fn: (_, model) => `Оркестратор ${model}`,
  },
  {
    re: /^((?:Gemini|Claude|GPT|o1|o3|o4|Gemma|Llama|DeepSeek|Qwen|Mistral)[^\n]*?) (Extra High|High|Medium|Low|Max|Minimal)$/i,
    fn: (_, model, eff) => `${model} ${EFFORT_RU[eff.toLowerCase()] || eff}`,
  },
  {
    re: /^(\d+) (files?|items?|steps?|tasks?|agents?|conversations?|projects?|rules?|skills?|plugins?|errors?|warnings?|matches?)$/i,
    fn: (_, n, unit) => {
      const low = unit.toLowerCase();
      const u = low === "matches" ? "match" : low.replace(/s$/, "");
      const m = {
        file: ["файл", "файла", "файлов"],
        item: ["элемент", "элемента", "элементов"],
        step: ["шаг", "шага", "шагов"],
        task: ["задача", "задачи", "задач"],
        agent: ["агент", "агента", "агентов"],
        conversation: ["чат", "чата", "чатов"],
        project: ["проект", "проекта", "проектов"],
        rule: ["правило", "правила", "правил"],
        skill: ["навык", "навыка", "навыков"],
        plugin: ["плагин", "плагина", "плагинов"],
        error: ["ошибка", "ошибки", "ошибок"],
        warning: ["предупреждение", "предупреждения", "предупреждений"],
        match: ["совпадение", "совпадения", "совпадений"],
      }[u];
      return m ? `${n} ${ruPlural(n, m[0], m[1], m[2])}` : `${n} ${unit}`;
    },
  },
  {
    re: /^Unnamed Agent (\d+)$/,
    fn: (_, n) => `Агент без названия ${n}`,
  },
  {
    re: /^Unnamed skill (\d+)$/,
    fn: (_, n) => `Навык без названия ${n}`,
  },
  {
    re: /^UI Plugin (\d+)$/,
    fn: (_, n) => `UI-плагин ${n}`,
  },
  {
    re: /^Loading (.+?)(\.\.\.|…)$/,
    fn: (_, what, ell) => `Загрузка: ${what}${ell}`,
  },
  {
    re: /^No server is listening on port (\d+) inside the remote workspace\. Start it, or ask the agent to, then retry\.$/,
    fn: (_, p) => `В удалённой рабочей области ни один сервер не слушает порт ${p}. Запустите его (или попросите агента) и повторите попытку.`,
  },
  {
    re: /^Nothing is running on port (\d+)$/,
    fn: (_, p) => `На порту ${p} ничего не запущено`,
  },
  {
    re: /^The preview did not respond on port (\d+)\.$/,
    fn: (_, p) => `Предпросмотр не ответил на порту ${p}.`,
  },
  {
    re: /^Preview unavailable — (.+)$/,
    fn: (_, h) => `Предпросмотр недоступен — ${h}`,
  },
  {
    re: /^Live preview unavailable · (.+)$/,
    fn: (_, d) => `Интерактивный предпросмотр недоступен · ${d}`,
  },
  {
    re: /^Environment paused\. Click to resume it and load the (.+)\.$/,
    fn: (_, f) => `Среда приостановлена. Нажмите, чтобы возобновить её и загрузить ${f}.`,
  },
  {
    re: /^Managed by the (.+) automation$/,
    fn: (_, x) => `Управляется автоматизацией «${x}»`,
  },
  {
    re: /^Managed by the (.+) plugin$/,
    fn: (_, x) => `Управляется плагином «${x}»`,
  },
  {
    re: /^Inherits your Global Permissions when working (.+)\.$/,
    fn: (_, w) => `Наследует ваши глобальные разрешения при работе ${w}.`,
  },
  {
    re: /^This (.+) overrides your global permission settings\.$/,
    fn: (_, t) => `Этот объект (${translateEntityType(t, "nom")}) переопределяет ваши глобальные настройки разрешений.`,
  },
  {
    re: /^Failed to delete "(.+)"$/,
    fn: (_, x) => `Не удалось удалить «${x}»`,
  },
  {
    re: /^Failed to save "(.+)"$/,
    fn: (_, x) => `Не удалось сохранить «${x}»`,
  },
  {
    re: /^Failed to update "(.+)"$/,
    fn: (_, x) => `Не удалось обновить «${x}»`,
  },
  {
    re: /^Failed to start "(.+)"\.$/,
    fn: (_, x) => `Не удалось запустить «${x}».`,
  },
  {
    re: /^Failed to save project settings: (.+)$/,
    fn: (_, e) => `Не удалось сохранить настройки проекта: ${e}`,
  },
  {
    re: /^Failed to save settings: (.+)$/,
    fn: (_, e) => `Не удалось сохранить настройки: ${e}`,
  },
  {
    re: /^Failed to create project: (.+)$/,
    fn: (_, e) => `Не удалось создать проект: ${e}`,
  },
  {
    re: /^Failed to save project: (.+)$/,
    fn: (_, e) => `Не удалось сохранить проект: ${e}`,
  },
  {
    re: /^Failed to select workspace: (.+)$/,
    fn: (_, e) => `Не удалось выбрать рабочую область: ${e}`,
  },
  {
    re: /^Error while running: (.+)$/,
    fn: (_, e) => `Ошибка при выполнении: ${e}`,
  },
  {
    re: /^Exited with code (\d+)\.$/,
    fn: (_, c) => `Завершено с кодом ${c}.`,
  },
  {
    re: /^(\d+) folders in this project could not be loaded because their locations are invalid\.$/,
    fn: (_, n) => `Не удалось загрузить ${n} ${ruPlural(n, "папку", "папки", "папок")} этого проекта из-за некорректного пути.`,
  },
  {
    re: /^Cannot add folder: "(.+)" is not a valid folder location\.$/,
    fn: (_, p) => `Невозможно добавить папку: «${p}» не является допустимым путём.`,
  },
  {
    re: /^All changes since (.+)$/,
    fn: (_, b) => `Все изменения с ${b}`,
  },
  {
    re: /^View Diff for (.+)$/,
    fn: (_, f) => `Открыть изменения для ${f}`,
  },
  {
    re: /^Show (.+) in folder$/,
    fn: (_, f) => `Показать ${f} в папке`,
  },
  {
    re: /^Uses your local clone, (.+)$/,
    fn: (_, p) => `Использует ваш локальный клон: ${p}`,
  },
  {
    re: /^Work in (.+)$/,
    fn: (_, w) => `Работать в ${w}`,
  },
  {
    re: /^Work locally on (.+)$/,
    fn: (_, f) => `Работать локально в ${f}`,
  },
  {
    re: /^Worktree from (.+)$/,
    fn: (_, m) => `Worktree из ${m}`,
  },
  {
    re: /^Automatically create a new (.+) workspace when the conversation starts$/,
    fn: (_, b) => `Автоматически создавать новую рабочую область (${b}) при запуске чата`,
  },
  {
    re: /^Created automation "(.+)"\.$/,
    fn: (_, a) => `Автоматизация «${a}» создана.`,
  },
  {
    re: /^Make (.+) the default (.+) account$/,
    fn: (_, who, prov) => `Сделать ${who} аккаунтом ${prov} по умолчанию`,
  },
  {
    re: /^Blocked popup navigation to unapproved domain: (.+)$/,
    fn: (_, d) => `Заблокирован переход во всплывающем окне на неразрешённый домен: ${d}`,
  },
  {
    re: /^Blocked origin "(.+)"$/,
    fn: (_, o) => `Источник «${o}» заблокирован`,
  },
  {
    re: /^Blocked URL "(.+)"$/,
    fn: (_, u) => `URL «${u}» заблокирован`,
  },
  {
    re: /^The browser blocked the download of (.+)$/,
    fn: (_, d) => `Браузер заблокировал загрузку ${d}`,
  },
  {
    re: /^Microphone access for (.+) was denied\. Quit and reopen the app to be asked again\.$/,
    fn: (_, a) => `Доступ к микрофону для ${a} запрещён. Закройте и снова откройте приложение, чтобы запросить доступ повторно.`,
  },
  {
    re: /^Microphone access for (.+) wasn't allowed\.$/,
    fn: (_, a) => `Доступ к микрофону для ${a} не был разрешён.`,
  },
  {
    re: /^Microphone blocked\. Allow in (.+)\.$/,
    fn: (_, b) => `Микрофон заблокирован. Разрешите доступ в ${b}.`,
  },
  {
    re: /^Please fill in all required fields: (.+)$/,
    fn: (_, f) => `Пожалуйста, заполните все обязательные поля: ${f}`,
  },
  {
    re: /^Please retry: (.+)$/,
    fn: (_, t) => `Повторите попытку: ${t}`,
  },
  {
    re: /^Comment \((.+)\)$/,
    fn: (_, b) => `Комментарий (${b})`,
  },
  {
    re: /^Comment on page (\d+)$/,
    fn: (_, p) => `Комментарий на странице ${p}`,
  },
  {
    re: /^Search match on page (\d+)$/,
    fn: (_, p) => `Совпадение поиска на странице ${p}`,
  },
  {
    re: /^Downloads, (\d+)% complete$/,
    fn: (_, p) => `Загрузки: выполнено ${p}%`,
  },
  {
    re: /^(.+) download progress$/,
    fn: (_, a) => `Прогресс загрузки: ${a}`,
  },
  {
    re: /^(.+) color picker$/,
    fn: (_, a) => `Палитра цветов: ${a}`,
  },

  // 11. Models, quota, credits, plan & usage messages
  {
    re: /^You have used some of your (weekly|daily|monthly|hourly|5-hour|five[- ]hour|\d+[- ](?:hour|day|minute)) limit,\s*it will fully refresh in (.+?)\.?$/i,
    fn: (_, w, dur) =>
      `Вы израсходовали часть ${translateQuotaWindow(w, "gen")} лимита — полное обновление через ${translateEnglishDurationList(dur, true)}.`,
  },
  {
    re: /^You have (?:used all of|reached|exhausted) your (weekly|daily|monthly|hourly|5-hour|five[- ]hour|\d+[- ](?:hour|day|minute)) limit[,.;]?\s*(?:it will (?:fully )?refresh|refreshing|resets?) in (.+?)\.?$/i,
    fn: (_, w, dur) =>
      `Вы исчерпали ${translateQuotaWindow(w, "acc")} лимит — обновление через ${translateEnglishDurationList(dur, true)}.`,
  },
  {
    re: /^You have (?:used all of|reached|exhausted) your (weekly|daily|monthly|hourly|5-hour|five[- ]hour|\d+[- ](?:hour|day|minute)) limit\.?$/i,
    fn: (_, w) => `Вы исчерпали ${translateQuotaWindow(w, "acc")} лимит.`,
  },
  {
    re: /^You have not used any of your (weekly|daily|monthly|hourly|5-hour|five[- ]hour|\d+[- ](?:hour|day|minute)) limit\.?$/i,
    fn: (_, w) => `Вы ещё не расходовали ${translateQuotaWindow(w, "acc")} лимит.`,
  },
  {
    re: /^(?:It will )?(?:fully )?refresh(?:es)? in (.+?)\.?$/i,
    fn: (_, dur) => `Полное обновление через ${translateEnglishDurationList(dur, true)}.`,
  },
  {
    re: /^((?:Daily|Weekly|Hourly|Monthly|5-?hour|Five[- ]hour|\d+[smhd])\s+limit(?:\s+remaining)?),\s*resets in (.+)$/i,
    fn: (_, label, dur) => `${translateLimitLabelRu(label)}, сбросится через ${translateCompactDuration(dur)}`,
  },
  {
    re: /^(\d+(?:[.,]\d+)?)%\s*left$/i,
    fn: (_, pct) => `${pct}% осталось`,
  },
  {
    re: /^(\d+)([smhd]) limit$/i,
    fn: (_, n, u) => {
      const unitRu = { s: "с", m: "мин", h: "ч", d: "д" }[u.toLowerCase()] || u;
      return `Лимит (${n} ${unitRu})`;
    },
  },
  {
    re: /^You can upgrade to (?:a|an) (.+?) plan to receive (.+?)\.?$/i,
    fn: (_, plan, benefit) => `Вы можете перейти на тариф ${plan}, чтобы получить ${translatePlanBenefit(benefit)}.`,
  },
  {
    re: /^When toggled on, (.+?) will use your AI credits to fulfill model requests once you're out of model quota\. \1 will always use your model quota first before using AI credits\.$/,
    fn: (_, app) =>
      `Если включено, ${app} будет использовать ваши AI-кредиты для запросов к моделям после исчерпания квоты. Сначала всегда расходуется основная квота моделей.`,
  },
  {
    re: /^When toggled on, (.+?) collects usage data to help Google enhance performance and features\.$/,
    fn: (_, app) =>
      `Если включено, ${app} собирает данные об использовании, чтобы помогать Google улучшать производительность и функции.`,
  },
  {
    re: /^Your Plan: (.+)$/,
    fn: (_, p) => `Ваш тариф: ${p}`,
  },

  // 12. Conversations / projects / workspaces settings & management
  {
    re: /^Settings for conversations outside of (.+?)\.$/,
    fn: (_, what) => `Настройки для чатов вне ${translateEntityType(what, "plGen")}.`,
  },
  {
    re: /^Agent settings and permissions for conversations outside of (.+?)\.$/,
    fn: (_, what) => `Настройки агента и разрешения для чатов вне ${translateEntityType(what, "plGen")}.`,
  },
  {
    re: /^Manage (.+?) (resources|folders), agent settings, and permissions\.$/,
    fn: (_, entity, what) =>
      `Управление ${what === "resources" ? "ресурсами" : "папками"} ${translateEntityType(entity, "gen")}, настройками агента и разрешениями.`,
  },
  {
    re: /^Manage (.+?) (resources|folders) and settings\.$/,
    fn: (_, entity, what) =>
      `Управление ${what === "resources" ? "ресурсами" : "папками"} ${translateEntityType(entity, "gen")} и настройками.`,
  },
  {
    re: /^Manage (.+?) app settings\.$/,
    fn: (_, app) => `Управление настройками приложения ${app}.`,
  },
  {
    re: /^A (.+?) with this name already exists\.$/,
    fn: (_, entity) => `${capitalize(translateEntityType(entity, "nom"))} с таким именем уже существует.`,
  },
  {
    re: /^Duplicate (.+?) name$/,
    fn: (_, entity) => `Дублирующееся название (${translateEntityType(entity, "gen")})`,
  },
  {
    re: /^(Project|Workspace|Conversation) (archived|deleted)$/i,
    fn: (_, ent, act) => {
      const e = ent.toLowerCase();
      const isArch = act.toLowerCase() === "archived";
      if (e === "workspace") return `Рабочая область ${isArch ? "архивирована" : "удалена"}`;
      if (e === "project") return `Проект ${isArch ? "архивирован" : "удалён"}`;
      return `Чат ${isArch ? "архивирован" : "удалён"}`;
    },
  },
  {
    re: /^(Delete|Archive|Unarchive) (project|projects|workspace|workspaces|conversation|conversations|skill|rule|plugin|agent|hook|automation|folder)$/i,
    fn: (_, act, ent) => {
      const v = { delete: "Удалить", archive: "Архивировать", unarchive: "Разархивировать" }[act.toLowerCase()] || act;
      return `${v} ${translateEntityType(ent, "acc")}`;
    },
  },

  // 13. Additional UI templates & toast/dialog messages
  {
    re: /^\+(\d+) more \(Show all\)$/,
    fn: (_, n) => `+${n} ещё (показать все)`,
  },
  {
    re: /^\+(\d+) more$/,
    fn: (_, n) => `+${n} ещё`,
  },
  {
    re: /^(\d+) files? changed$/,
    fn: (_, n) => `${n} ${ruPlural(n, "файл изменён", "файла изменены", "файлов изменено")}`,
  },
  {
    re: /^(\d+) tools?$/,
    fn: (_, n) => `${n} ${ruPlural(n, "инструмент", "инструмента", "инструментов")}`,
  },
  {
    re: /^(\d+) customizations? failed to load$/,
    fn: (_, n) => `Не удалось загрузить ${n} ${ruPlural(n, "элемент", "элемента", "элементов")} кастомизации`,
  },
  {
    re: /^(\d+) MCP servers? failed to start$/,
    fn: (_, n) => `Не удалось запустить ${n} ${ruPlural(n, "MCP-сервер", "MCP-сервера", "MCP-серверов")}`,
  },
  {
    re: /^(.+?) · sign in for more$/,
    fn: (_, a) => `${a} · войдите, чтобы увидеть больше`,
  },
  {
    re: /^(.+?) · This computer$/,
    fn: (_, a) => `${a} · Этот компьютер`,
  },
  {
    re: /^(.+?)\. Starting in local workspace\.$/,
    fn: (_, a) => `${a}. Запуск в локальной рабочей области.`,
  },
  {
    re: /^(.+?), showing (\d+) of (\d+)$/,
    fn: (_, t, a, b) => `${t}, показано ${a} из ${b}`,
  },
  {
    re: /^(.+?), setup required$/,
    fn: (_, l) => `${l}, требуется настройка`,
  },
  {
    re: /^(.+?), voice (\d+) of (\d+)$/,
    fn: (_, name, a, b) => `${name}, голос ${a} из ${b}`,
  },
  {
    re: /^(.+?)\. (Hide|Show) plan$/,
    fn: (_, a, act) => `${a}. ${act === "Hide" ? "Скрыть" : "Показать"} план`,
  },
  {
    re: /^(.+?)\. Switch (?:mic|microphone)\.?$/,
    fn: (_, a) => `${a}. Сменить микрофон`,
  },
  {
    re: /^(.+?)\. Show in (.+)$/,
    fn: (_, a, k) => `${a}. Показать в ${k}`,
  },
  {
    re: /^(.+?)\. View site information$/,
    fn: (_, a) => `${a}. Информация о сайте`,
  },
  {
    re: /^(.+?)[’']s server IP address could not be found\.$/,
    fn: (_, d) => `Не удалось найти IP-адрес сервера ${d}.`,
  },
  {
    re: /^(.+?) could not find the requested page\.$/,
    fn: (_, d) => `Сервер ${d} не нашёл запрошенную страницу.`,
  },
  {
    re: /^(.+?) is currently unable to handle this request\.$/,
    fn: (_, d) => `Сервер ${d} сейчас не может обработать этот запрос.`,
  },
  {
    re: /^(.+?) took too long to respond\.$/,
    fn: (_, d) => `Превышено время ожидания ответа от ${d}.`,
  },
  {
    re: /^Check if there is a typo in (.+?), or open the page in your external browser\.$/,
    fn: (_, a) => `Проверьте, нет ли опечатки в ${a === "the address" ? "адресе" : a}, или откройте страницу во внешнем браузере.`,
  },
  {
    re: /^The certificate was rejected \((.+)\)\.$/,
    fn: (_, a) => `Сертификат был отклонён (${a}).`,
  },
  {
    re: /^The folder [“"](.+?)[”"] does not exist\. Would you like to create it\?$/,
    fn: (_, o) => `Папка «${o}» не существует. Создать её?`,
  },
  {
    re: /^[“"](.+?)[”"] isn[’']t a valid folder name\.$/,
    fn: (_, o) => `«${o}» — недопустимое имя папки.`,
  },
  {
    re: /^Can[’']t create this path — [“"](.+?)[”"] is a file, not a folder\.$/,
    fn: (_, o) => `Невозможно создать путь — «${o}» является файлом, а не папкой.`,
  },
  {
    re: /^A file already exists at (.+)\.$/,
    fn: (_, p) => `Файл уже существует по пути ${p}.`,
  },
  {
    re: /^Choose (.+?)'s Voice$/,
    fn: (_, app) => `Выберите голос ${app}`,
  },
  {
    re: /^Select (.+?) Theme$/,
    fn: (_, a) => `Выбрать тему: ${a}`,
  },
  {
    re: /^Reset (.+?) to default$/,
    fn: (_, b) => `Сбросить «${b}» по умолчанию`,
  },
  {
    re: /^Reset (\d+) overrides?$/,
    fn: (_, n) => `Сбросить ${n} ${ruPlural(n, "переопределение", "переопределения", "переопределений")}`,
  },
  {
    re: /^Send all \((\d+)\)$/,
    fn: (_, n) => `Отправить все (${n})`,
  },
  {
    re: /^Running for (.+)$/,
    fn: (_, d) => `Выполняется ${translateCompactDuration(d)}`,
  },
  {
    re: /^Stopped voice chat · (.+)$/,
    fn: (_, d) => `Голосовой чат остановлен · ${translateCompactDuration(d)}`,
  },
  {
    re: /^Runs even when your computer is off\. (Schedules and events\.|Schedules only\.)$/,
    fn: (_, m) => `Работает даже при выключенном компьютере. ${m === "Schedules and events." ? "Расписания и события." : "Только расписания."}`,
  },
  {
    re: /^Credentials expire in (.+?)\. Refresh credentials to keep this automation running$/,
    fn: (_, b) => `Срок действия учётных данных истекает через ${translateCompactDuration(translateEnglishDurationList(b, true))}. Обновите их, чтобы автоматизация продолжала работать.`,
  },
  {
    re: /^Compare responses from (\d+) models side-by-side to find the best result\.$/,
    fn: (_, n) => `Сравните ответы от ${n} моделей рядом, чтобы выбрать лучший результат.`,
  },
  {
    re: /^You have (\d+) conversations in progress\. Updating will interrupt them, and they will automatically resume once the update completes\.$/,
    fn: (_, n) =>
      `У вас сейчас ${n} ${ruPlural(n, "активный чат", "активных чата", "активных чатов")}. Обновление временно прервёт их, и они автоматически возобновятся после завершения.`,
  },
  {
    re: /^Receive product updates, tips, and promotions from Google (.+?) via email\.$/,
    fn: (_, p) => `Получать новости о продукте, советы и предложения от Google ${p} по электронной почте.`,
  },
  {
    re: /^File exceeds the ([\d.]+)MB display limit \(([\d.]+)MB\), so it can't be opened or downloaded here\.$/,
    fn: (_, lim, sz) => `Файл превышает лимит отображения ${lim} МБ (${sz} МБ) — его нельзя открыть или скачать здесь.`,
  },
  {
    re: /^Recording exceeds 15MB limit \(([\d.]+)MB\)$/,
    fn: (_, sz) => `Запись превышает лимит 15 МБ (${sz} МБ)`,
  },
  {
    re: /^Total media size exceeds (\d+)MB limit$/,
    fn: (_, n) => `Общий размер медиафайлов превышает лимит ${n} МБ`,
  },
  {
    re: /^Configure (.+?), values missing$/,
    fn: (_, g) => `Настроить ${g}: не хватает параметров`,
  },
  {
    re: /^Configure (.+)$/,
    fn: (_, g) => `Настроить ${g}`,
  },
  {
    re: /^Auth(?:orization)? code for (.+)$/,
    fn: (_, g) => `Код авторизации для ${g}`,
  },
  {
    re: /^Cost summary: (.+)$/,
    fn: (_, n) => `Сводка расходов: ${n}`,
  },
  {
    re: /^Detached at ([0-9a-f]{6,12})$/i,
    fn: (_, h) => `Отделённый HEAD (${h})`,
  },
  {
    re: /^Checked out in (.+)$/,
    fn: (_, p) => `Открыто в ${p}`,
  },
  {
    re: /^Fix with Agent: (.+)$/,
    fn: (_, c) => `Исправить с агентом: ${c}`,
  },
  {
    re: /^Deleted cookies for (.+)$/,
    fn: (_, d) => `Файлы cookie для ${d} удалены`,
  },
  {
    re: /^Disconnected from logs for (.+)$/,
    fn: (_, b) => `Отключено от журналов ${b}`,
  },
  {
    re: /^No MCP servers found for "(.+)"$/,
    fn: (_, f) => `MCP-серверы по запросу «${f}» не найдены`,
  },
  {
    re: /^No connectors match [“"](.+?)[”"]$/,
    fn: (_, a) => `Нет коннекторов по запросу «${a}»`,
  },
  {
    re: /^Searching as (.+)$/,
    fn: (_, a) => `Поиск от имени ${a}`,
  },
  {
    re: /^New secret for (.+)$/,
    fn: (_, p) => `Новый секрет для ${p}`,
  },
  {
    re: /^Secret for a new (.+?) account$/,
    fn: (_, p) => `Секрет для нового аккаунта ${p}`,
  },
  {
    re: /^Secret for (.+)$/,
    fn: (_, p) => `Секрет для ${p}`,
  },
  {
    re: /^Select at least (\d+) items?$/,
    fn: (_, n) => `Выберите минимум ${n} ${ruPlural(n, "элемент", "элемента", "элементов")}`,
  },
  {
    re: /^Select at most (\d+) items?$/,
    fn: (_, n) => `Выберите максимум ${n} ${ruPlural(n, "элемент", "элемента", "элементов")}`,
  },
  {
    re: /^Minimum length is (\d+)$/,
    fn: (_, n) => `Минимальная длина: ${n}`,
  },
  {
    re: /^Maximum length is (\d+)$/,
    fn: (_, n) => `Максимальная длина: ${n}`,
  },
  {
    re: /^Minimum value is (.+)$/,
    fn: (_, n) => `Минимальное значение: ${n}`,
  },
  {
    re: /^Maximum value is (.+)$/,
    fn: (_, n) => `Максимальное значение: ${n}`,
  },
  {
    re: /^Relaunch (.+?) to finish Screen Recording\.$/,
    fn: (_, n) => `Перезапустите ${n}, чтобы завершить настройку записи экрана.`,
  },
  {
    re: /^Open Google Chrome on (.+?)\.$/,
    fn: (_, b) => `Откройте Google Chrome на ${b}.`,
  },
  {
    re: /^Hidden by policy \((.+)\)\.$/,
    fn: (_, g) => `Скрыто политикой (${g}).`,
  },
  {
    re: /^Low contrast ratio \((.+?)\)\. Text may be hard to read\.$/,
    fn: (_, r) => `Низкая контрастность (${r}). Текст может плохо читаться.`,
  },
  {
    re: /^Install folder "(.+)" is already in use$/,
    fn: (_, d) => `Папка установки «${d}» уже используется`,
  },
  {
    re: /^Agents created by this (.+?) run in a dedicated (.+?) with its own permissions\. You can change the permissions in the \2 settings page\.$/,
    fn: (_, k, d) =>
      `Агенты, созданные этим объектом (${translateEntityType(k, "nom")}), работают в выделенном окружении (${translateEntityType(d, "nom")}) со своими разрешениями. Их можно изменить на странице настроек.`,
  },
  {
    re: /^The selected (.+?) can't be found\. Pick another \1 from the \1 selector to send\.$/,
    fn: (_, u) =>
      `Выбранный объект (${translateEntityType(u, "nom")}) не найден. Выберите другой в меню выбора, чтобы отправить сообщение.`,
  },
  {
    re: /^Sign-ins to (.+?) are kept in the cloud with your account\.$/,
    fn: (_, c) => `Авторизации в ${c} хранятся в облаке вместе с вашим аккаунтом.`,
  },
  {
    re: /^Sorry, this account is ineligible to use (.+)$/,
    fn: (_, a) => `К сожалению, этот аккаунт не имеет доступа к ${a}`,
  },
  {
    re: /^Used tool: (.+)$/,
    fn: (_, a) => `Использован инструмент: ${a}`,
  },
  {
    re: /^Web app: (.+)$/,
    fn: (_, a) => `Веб-приложение: ${a}`,
  },
  {
    re: /^(Reading|Read) terminal:$/,
    fn: (_, a) => (a === "Reading" ? "Чтение терминала:" : "Прочитан терминал:"),
  },
  {
    re: /^(Failed to execute|Executing|Executed) notebook cells$/,
    fn: (_, a) =>
      a === "Executing"
        ? "Выполнение ячеек блокнота"
        : a === "Executed"
          ? "Ячейки блокнота выполнены"
          : "Ошибка выполнения ячеек блокнота",
  },
  {
    re: /^(.+?): ([\d,.\s]+) tokens$/,
    fn: (_, l, tok) => `${l}: ${tok} токенов`,
  },
  {
    re: /^Page (\d+) failed to load$/,
    fn: (_, p) => `Не удалось загрузить страницу ${p}`,
  },
  {
    re: /^Render error on page (\d+):$/,
    fn: (_, p) => `Ошибка отображения на странице ${p}:`,
  },
  {
    re: /^Scroll to: (.+) on page (\d+)$/,
    fn: (_, b, p) => `Прокрутить к «${b}» на странице ${p}`,
  },
  {
    re: /^Multiple (?:markers|search matches) near page (\d+)$/,
    fn: (_, p) => `Несколько совпадений около страницы ${p}`,
  },
  {
    re: /^Select model with (.+)$/,
    fn: (_, c) => `Выбрать модель (${c})`,
  },
  {
    re: /^Send Message (.+)$/,
    fn: (_, n) => `Отправить сообщение (${n})`,
  },
  {
    re: /^Remove context from (.+)$/,
    fn: (_, f) => `Удалить контекст из ${f}`,
  },
  {
    re: /^App view for (.+)$/,
    fn: (_, g) => `Представление приложения: ${g}`,
  },
  {
    re: /^Artifact image (.+)$/,
    fn: (_, a) => `Изображение артефакта: ${a}`,
  },
  {
    re: /^Attachment error: (.+)$/,
    fn: (_, e) => `Ошибка вложения: ${e}`,
  },
  {
    re: /^Upload error: (.+)$/,
    fn: (_, e) => `Ошибка загрузки: ${e}`,
  },
  {
    re: /^(?:Couldn't|Failed to) (archive|unarchive|delete|rename|pin|unpin|move|fork|duplicate) conversation$/i,
    fn: (_, v) => `Не удалось ${translateConvVerb(v)} чат`,
  },
  {
    re: /^Couldn't remove (.+) from Recent$/,
    fn: (_, h) => `Не удалось удалить ${h} из недавних`,
  },
  {
    re: /^Couldn't save base branch: (.+)$/,
    fn: (_, e) => `Не удалось сохранить базовую ветку: ${e}`,
  },
  {
    re: /^Couldn't load apps: (.+)$/,
    fn: (_, e) => `Не удалось загрузить приложения: ${e}`,
  },
  {
    re: /^Couldn't disconnect (.+?): (.+)$/,
    fn: (_, a, e) => `Не удалось отключить ${a}: ${e}`,
  },
  {
    re: /^Could not open folder: (.+)$/,
    fn: (_, e) => `Не удалось открыть папку: ${e}`,
  },
  {
    re: /^Could not read (.+?)\.$/,
    fn: (_, p) => `Не удалось прочитать ${p}.`,
  },
  {
    re: /^Could not attach image: (.+)$/,
    fn: (_, e) => `Не удалось прикрепить изображение: ${e}`,
  },
  {
    re: /^Could not attach folder "(.+)": (.+)$/,
    fn: (_, d, e) => `Не удалось прикрепить папку «${d}»: ${e}`,
  },
  {
    re: /^Could not apply the selected permissions: (.+)$/,
    fn: (_, e) => `Не удалось применить выбранные разрешения: ${e}`,
  },
  {
    re: /^Failed to (archive|delete) (project|workspace|conversation|skill|rule|plugin|agent)(?:: (.+))?$/i,
    fn: (_, act, ent, err) => {
      const v = act.toLowerCase() === "archive" ? "архивировать" : "удалить";
      return `Не удалось ${v} ${translateEntityType(ent, "acc")}${err ? `: ${err}` : ""}`;
    },
  },
  {
    re: /^Failed to save (cloud permission settings|project permissions|configuration|project Google3 configuration): (.+)$/i,
    fn: (_, what, err) => {
      const m = {
        "cloud permission settings": "облачные настройки разрешений",
        "project permissions": "разрешения проекта",
        configuration: "конфигурацию",
        "project google3 configuration": "конфигурацию Google3 проекта",
      }[what.toLowerCase()] || what;
      return `Не удалось сохранить ${m}: ${err}`;
    },
  },
  {
    re: /^Failed to (remove|toggle|update|enable) (agent|plugin)(?: ([^:]+))?(?:: (.+))?$/i,
    fn: (_, act, ent, name, err) => {
      const v = { remove: "удалить", toggle: "переключить", update: "обновить", enable: "включить" }[act.toLowerCase()] || act;
      const e = ent.toLowerCase() === "agent" ? "агента" : "плагин";
      return `Не удалось ${v} ${e}${name ? ` «${name}»` : ""}${err ? `: ${err}` : ""}`;
    },
  },
  {
    re: /^Failed to unarchive project: (.+)$/,
    fn: (_, e) => `Не удалось разархивировать проект: ${e}`,
  },
  {
    re: /^Failed to delete recordings: (.+)$/,
    fn: (_, e) => `Не удалось удалить записи: ${e}`,
  },
  {
    re: /^Failed to open workspace: (.+)$/,
    fn: (_, e) => `Не удалось открыть рабочую область: ${e}`,
  },
  {
    re: /^Failed to load (PDF|page (\d+)): (.+)$/i,
    fn: (_, target, pageNum, err) =>
      pageNum ? `Не удалось загрузить страницу ${pageNum}: ${err}` : `Не удалось загрузить PDF: ${err}`,
  },
  {
    re: /^Honors standard VS Code shortcuts without collisions \(e\.g\. (.+)\)\.$/,
    fn: (_, s) => `Сохраняет стандартные сочетания клавиш VS Code без конфликтов (например, ${s}).`,
  },
  {
    re: /^Build with (.+) Plugins$/,
    fn: (_, a) => `Разработка с плагинами ${a}`,
  },
  {
    re: /^Browser tools run on (.+?), the SSH host this window is connected to, and Chrome there isn't accepting remote debugging\. Complete these steps on \1, not on this computer:$/,
    fn: (_, f) =>
      `Инструменты браузера работают на SSH-хосте ${f}, к которому подключено это окно, и Chrome там не принимает удалённую отладку. Выполните эти шаги на ${f}, а не на этом компьютере:`,
  },
  {
    re: /^(This plugin|These plugins) in (.+?) may have looser code review\. Review (?:its|their) contents before adding the bundle\.$/,
    fn: (_, who, f) =>
      `${who === "This plugin" ? "Этот плагин" : "Эти плагины"} в ${f} ${who === "This plugin" ? "может" : "могут"} проходить менее строгую проверку кода. Проверьте содержимое перед добавлением.`,
  },
  {
    re: /^(.+?), all already installed\. Adding the bundle installs plugins it gains later\.$/,
    fn: (_, d) => `${d} — все уже установлены. Добавление набора будет устанавливать новые плагины по мере их появления.`,
  },
  {
    re: /^(.+?)\. Add bundle installs (all of them|it)\.$/,
    fn: (_, d, what) => `${d}. Добавление набора установит ${what === "it" ? "его" : "их все"}.`,
  },
  {
    re: /^(.+?)\. Adding the bundle installs plugins it gains later\.$/,
    fn: (_, d) => `${d}. Добавление набора будет устанавливать новые плагины по мере их появления.`,
  },
  {
    re: /^(.+?)\. Add bundle installs (.+?); the ones you already have stay as they are\.$/,
    fn: (_, d, b) => `${d}. Добавление набора установит ${b}; уже установленные останутся без изменений.`,
  },
  {
    re: /^Can[’']t access "(.+?)"\. macOS privacy settings are blocking Antigravity from this location\. Allow Antigravity in System Settings > Privacy & Security > Files and Folders \(or Full Disk Access\)\.$/,
    fn: (_, p) =>
      `Нет доступа к «${p}». Настройки конфиденциальности macOS блокируют доступ Antigravity. Разрешите доступ в «Системные настройки → Конфиденциальность и безопасность → Файлы и папки» (или «Полный доступ к диску»).`,
  },
  {
    re: /^Do you want to navigate to (.+?)\?\s*WARNING: This link could potentially be dangerous$/,
    fn: (_, t) => `Перейти по ссылке ${t}?\n\nВНИМАНИЕ: эта ссылка может быть потенциально опасной`,
  },
  {
    re: /^"(.+?)" not found on page (\d+)$/,
    fn: (_, d, p) => `«${d}» не найдено на странице ${p}`,
  },
  {
    re: /^Added MCP server "(.+?)", but it failed to start: (.+)$/,
    fn: (_, n, e) => `MCP-сервер «${n}» добавлен, но не удалось его запустить: ${e}`,
  },
];

function applyDynamicRules(text) {
  for (let i = 0; i < DYNAMIC_RULES.length; i++) {
    const rule = DYNAMIC_RULES[i];
    const m = rule.re.exec(text);
    if (m) {
      return rule.fn(...m);
    }
  }
  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ruPlural, DYNAMIC_RULES, applyDynamicRules, translateCompactDuration };
}
