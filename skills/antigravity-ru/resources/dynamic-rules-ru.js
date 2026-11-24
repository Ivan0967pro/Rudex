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
    re: /^Resets in (.+)$/,
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
    fn: (_, n) => `Показать ${n} ${ruPlural(n, "разбивку", "разбивки", "разбивок")}`,
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
