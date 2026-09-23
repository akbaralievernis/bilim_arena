/**
 * Bilim Arena — учебная структура.
 *
 *   Предмет → Класс → Раздел → Тема → Навык → Вопросы
 *
 * Новый предмет или тему можно добавить, не трогая игровой движок:
 * игры получают вопросы только через getQuestions() и ничего не знают
 * о том, откуда они взялись — из файла, с сервера или от AI.
 */

import { pick } from './i18n.js';

/** Предметы платформы. `bank` — есть ли уже банк вопросов. */
export const SUBJECTS = [
  { id: 'math', icon: '🔢', color: '#6366f1', title: { ky: 'Математика', ru: 'Математика', en: 'Mathematics' } },
  { id: 'kyrgyz', icon: '🇰🇬', color: '#22c55e', title: { ky: 'Кыргыз тили', ru: 'Кыргызский язык', en: 'Kyrgyz language' } },
  { id: 'kyrgyz-lit', icon: '📖', color: '#16a34a', title: { ky: 'Кыргыз адабияты', ru: 'Кыргызская литература', en: 'Kyrgyz literature' } },
  { id: 'russian', icon: '🇷🇺', color: '#0ea5e9', title: { ky: 'Орус тили', ru: 'Русский язык', en: 'Russian language' } },
  { id: 'russian-lit', icon: '📚', color: '#0284c7', title: { ky: 'Орус адабияты', ru: 'Русская литература', en: 'Russian literature' } },
  { id: 'english', icon: '🇬🇧', color: '#8b5cf6', title: { ky: 'Англис тили', ru: 'Английский язык', en: 'English' } },
  { id: 'informatics', icon: '💻', color: '#06b6d4', title: { ky: 'Информатика', ru: 'Информатика', en: 'Computer science' } },
  { id: 'physics', icon: '⚛️', color: '#f59e0b', title: { ky: 'Физика', ru: 'Физика', en: 'Physics' } },
  { id: 'chemistry', icon: '🧪', color: '#ec4899', title: { ky: 'Химия', ru: 'Химия', en: 'Chemistry' } },
  { id: 'biology', icon: '🌿', color: '#10b981', title: { ky: 'Биология', ru: 'Биология', en: 'Biology' } },
  { id: 'geography', icon: '🗺️', color: '#14b8a6', title: { ky: 'География', ru: 'География', en: 'Geography' } },
  { id: 'kg-history', icon: '🏔️', color: '#ef4444', title: { ky: 'Кыргызстан тарыхы', ru: 'История Кыргызстана', en: 'History of Kyrgyzstan' } },
  { id: 'world-history', icon: '🌍', color: '#f97316', title: { ky: 'Дүйнө тарыхы', ru: 'Всемирная история', en: 'World history' } },
  { id: 'social', icon: '⚖️', color: '#a855f7', title: { ky: 'Коомдук таануу', ru: 'Обществознание', en: 'Social studies' } },
  { id: 'economics', icon: '📈', color: '#84cc16', title: { ky: 'Экономика', ru: 'Экономика', en: 'Economics' } },
  { id: 'finance', icon: '💰', color: '#eab308', title: { ky: 'Финансылык сабаттуулук', ru: 'Финансовая грамотность', en: 'Financial literacy' } }
];

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * Темы. Каждая тема описывает навыки (skills) — именно по ним
 * разбираются ошибки: «Дроби: 2 ошибки, Проценты: 0 ошибок».
 */
export const TOPICS = [
  {
    id: 'math-6-fractions',
    subject: 'math', grade: 6, section: { ky: 'Сандар', ru: 'Числа', en: 'Numbers' },
    title: { ky: 'Бөлчөктөр', ru: 'Дроби', en: 'Fractions' },
    skills: [
      { id: 'compare', title: { ky: 'Бөлчөктөрдү салыштыруу', ru: 'Сравнение дробей', en: 'Comparing fractions' } },
      { id: 'common-denominator', title: { ky: 'Жалпы бөлүмгө келтирүү', ru: 'Приведение к общему знаменателю', en: 'Common denominator' } },
      { id: 'add-sub', title: { ky: 'Кошуу жана кемитүү', ru: 'Сложение и вычитание', en: 'Adding and subtracting' } },
      { id: 'multiply-divide', title: { ky: 'Көбөйтүү жана бөлүү', ru: 'Умножение и деление', en: 'Multiplying and dividing' } }
    ],
    bank: () => import('../data/questions/math-6-fractions.js')
  },
  {
    id: 'kyrgyz-6-parts-of-speech',
    subject: 'kyrgyz', grade: 6, section: { ky: 'Морфология', ru: 'Морфология', en: 'Morphology' },
    title: { ky: 'Сөз түркүмдөрү', ru: 'Части речи', en: 'Parts of speech' },
    skills: [
      { id: 'noun', title: { ky: 'Зат атооч', ru: 'Имя существительное', en: 'Noun' } },
      { id: 'adjective', title: { ky: 'Сын атооч', ru: 'Имя прилагательное', en: 'Adjective' } },
      { id: 'verb', title: { ky: 'Этиш', ru: 'Глагол', en: 'Verb' } },
      { id: 'numeral', title: { ky: 'Сан атооч', ru: 'Имя числительное', en: 'Numeral' } }
    ],
    bank: () => import('../data/questions/kyrgyz-6-parts-of-speech.js')
  },
  {
    id: 'english-5-basics',
    subject: 'english', grade: 5, section: { ky: 'Негизги сөздүк', ru: 'Базовая лексика', en: 'Core vocabulary' },
    title: { ky: 'Күнүмдүк сөздөр', ru: 'Повседневные слова', en: 'Everyday words' },
    skills: [
      { id: 'animals', title: { ky: 'Жаныбарлар', ru: 'Животные', en: 'Animals' } },
      { id: 'food', title: { ky: 'Тамак-аш', ru: 'Еда', en: 'Food' } },
      { id: 'school', title: { ky: 'Мектеп', ru: 'Школа', en: 'School' } },
      { id: 'verbs', title: { ky: 'Этиштер', ru: 'Глаголы', en: 'Verbs' } }
    ],
    bank: () => import('../data/questions/english-5-basics.js')
  },
  {
    id: 'kg-history-8-independence',
    subject: 'kg-history', grade: 8, section: { ky: 'Жаңы тарых', ru: 'Новейшая история', en: 'Modern history' },
    title: { ky: 'Эгемендүүлүк жылдары', ru: 'Годы независимости', en: 'Years of independence' },
    skills: [
      { id: 'dates', title: { ky: 'Даталар', ru: 'Даты', en: 'Dates' } },
      { id: 'symbols', title: { ky: 'Мамлекеттик символдор', ru: 'Государственные символы', en: 'State symbols' } },
      { id: 'people', title: { ky: 'Тарыхый инсандар', ru: 'Исторические личности', en: 'Historical figures' } }
    ],
    bank: () => import('../data/questions/kg-history-8-independence.js')
  },
  {
    id: 'informatics-7-algorithms',
    subject: 'informatics', grade: 7, section: { ky: 'Алгоритмдер', ru: 'Алгоритмы', en: 'Algorithms' },
    title: { ky: 'Алгоритмдин негиздери', ru: 'Основы алгоритмов', en: 'Algorithm basics' },
    skills: [
      { id: 'sequence', title: { ky: 'Кадамдардын ырааттуулугу', ru: 'Последовательность шагов', en: 'Sequence of steps' } },
      { id: 'condition', title: { ky: 'Шарттар', ru: 'Условия', en: 'Conditions' } },
      { id: 'loop', title: { ky: 'Циклдер', ru: 'Циклы', en: 'Loops' } }
    ],
    bank: () => import('../data/questions/informatics-7-algorithms.js')
  }
];

// ─── Выборки ──────────────────────────────────────────────────────────────────

export const getSubject = (id) => SUBJECTS.find((s) => s.id === id);
export const getTopic = (id) => TOPICS.find((t) => t.id === id);

export const topicsOf = (subjectId, grade) => TOPICS.filter(
  (t) => (!subjectId || t.subject === subjectId) && (!grade || t.grade === grade)
);

/** Предметы, у которых уже есть хотя бы одна тема с вопросами */
export const subjectsWithContent = () => {
  const ids = new Set(TOPICS.map((t) => t.subject));
  return SUBJECTS.filter((s) => ids.has(s.id));
};

export const gradesOf = (subjectId) => [
  ...new Set(TOPICS.filter((t) => t.subject === subjectId).map((t) => t.grade))
].sort((a, b) => a - b);

export const skillTitle = (topicId, skillId, lang) => {
  const topic = getTopic(topicId);
  const skill = topic?.skills.find((s) => s.id === skillId);
  return skill ? pick(skill.title, lang) : skillId;
};

// ─── Вопросы ──────────────────────────────────────────────────────────────────

const cache = new Map();

/** Загружает банк вопросов темы (по требованию, с кешем) */
export async function loadBank(topicId) {
  if (cache.has(topicId)) return cache.get(topicId);
  const topic = getTopic(topicId);
  if (!topic?.bank) return [];
  try {
    const mod = await topic.bank();
    const list = (mod.default || []).map((q) => ({ ...q, topic: topicId }));
    cache.set(topicId, list);
    return list;
  } catch (e) {
    console.warn('[curriculum] банк вопросов не загрузился:', topicId, e);
    cache.set(topicId, []);
    return [];
  }
}

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Главный вход для игр.
 * @param {object} opts
 * @param {string} opts.topic     — id темы
 * @param {number} opts.count     — сколько вопросов нужно
 * @param {string[]} opts.skills  — только эти навыки (для повторения ошибок)
 * @param {number[]} opts.difficulty — например [1,2]
 * @param {string[]} opts.types   — 'choice' | 'input' | 'order' | 'truefalse'
 */
export async function getQuestions({ topic, count = 10, skills, difficulty, types } = {}) {
  let list = await loadBank(topic);
  if (skills?.length) list = list.filter((q) => skills.includes(q.skill));
  if (difficulty?.length) list = list.filter((q) => difficulty.includes(q.difficulty ?? 1));
  if (types?.length) list = list.filter((q) => types.includes(q.type || 'choice'));

  // Если отфильтровали слишком сильно — добираем из общего банка темы
  if (list.length < count) {
    const rest = (await loadBank(topic)).filter((q) => !list.includes(q));
    list = list.concat(shuffle(rest).slice(0, count - list.length));
  }
  return shuffle(list).slice(0, count);
}

/** Варианты ответа в перемешанном порядке (правильный не всегда первый) */
export function shuffleOptions(question, lang) {
  const opts = (question.options || []).map((o, i) => ({ text: pick(o, lang), index: i }));
  const mixed = shuffle(opts);
  return {
    options: mixed,
    correctIndex: mixed.findIndex((o) => o.index === (question.correct ?? 0))
  };
}
