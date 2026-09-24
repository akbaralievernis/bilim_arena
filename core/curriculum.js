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
import { engineQuestions as teacherQuestions, engineQuestionsByIds } from './questions.js';

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
    id: 'math-5-numbers',
    subject: 'math', grade: 5, section: { ky: 'Сандар', ru: 'Числа', en: 'Numbers' },
    title: { ky: 'Натурал сандар менен амалдар', ru: 'Действия с натуральными числами', en: 'Operations with whole numbers' },
    skills: [
      { id: 'add-sub', title: { ky: 'Кошуу жана кемитүү', ru: 'Сложение и вычитание', en: 'Adding and subtracting' } },
      { id: 'mul-div', title: { ky: 'Көбөйтүү жана бөлүү', ru: 'Умножение и деление', en: 'Multiplying and dividing' } },
      { id: 'order', title: { ky: 'Амалдардын тартиби', ru: 'Порядок действий', en: 'Order of operations' } },
      { id: 'word', title: { ky: 'Текст маселелер', ru: 'Текстовые задачи', en: 'Word problems' } }
    ],
    bank: () => import('../data/questions/math-5-numbers.js')
  },
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
  },
  {
    id: 'geography-7-kyrgyzstan',
    subject: 'geography', grade: 7, section: { ky: 'Кыргызстандын географиясы', ru: 'География Кыргызстана', en: 'Geography of Kyrgyzstan' },
    title: { ky: 'Кыргызстандын жаратылышы', ru: 'Природа Кыргызстана', en: 'Nature of Kyrgyzstan' },
    skills: [
      { id: 'relief', title: { ky: 'Рельеф', ru: 'Рельеф', en: 'Relief' } },
      { id: 'water', title: { ky: 'Суулар', ru: 'Воды', en: 'Waters' } },
      { id: 'regions', title: { ky: 'Аймактар', ru: 'Регионы', en: 'Regions' } },
      { id: 'nature', title: { ky: 'Жаратылыш', ru: 'Природа', en: 'Nature' } }
    ],
    bank: () => import('../data/questions/geography-7-kyrgyzstan.js')
  },
  {
    id: 'kyrgyz-lit-7-manas',
    subject: 'kyrgyz-lit', grade: 7, section: { ky: 'Эпос', ru: 'Эпос', en: 'Epic' },
    title: { ky: '«Манас» эпосу жана акындар', ru: 'Эпос «Манас» и акыны', en: 'The Manas epic and poets' },
    skills: [
      { id: 'characters', title: { ky: 'Каармандар', ru: 'Герои', en: 'Characters' } },
      { id: 'epic', title: { ky: 'Эпостун түзүлүшү', ru: 'Строение эпоса', en: 'Structure of the epic' } },
      { id: 'narrators', title: { ky: 'Манасчылар', ru: 'Манасчы', en: 'Narrators' } },
      { id: 'poets', title: { ky: 'Акындар', ru: 'Акыны', en: 'Poets' } }
    ],
    bank: () => import('../data/questions/kyrgyz-lit-7-manas.js')
  },
  {
    id: 'russian-5-noun',
    subject: 'russian', grade: 5, section: { ky: 'Морфология', ru: 'Морфология', en: 'Morphology' },
    title: { ky: 'Зат атооч жана жазуу эрежелери', ru: 'Имя существительное и орфография', en: 'Nouns and spelling' },
    skills: [
      { id: 'gender', title: { ky: 'Жыныс', ru: 'Род', en: 'Gender' } },
      { id: 'cases', title: { ky: 'Жөндөмөлөр (падежи)', ru: 'Падежи', en: 'Cases' } },
      { id: 'spelling', title: { ky: 'Жазуу эрежелери', ru: 'Орфография', en: 'Spelling' } }
    ],
    bank: () => import('../data/questions/russian-5-noun.js')
  },
  {
    id: 'russian-lit-6-classics',
    subject: 'russian-lit', grade: 6, section: { ky: 'Классика', ru: 'Классика', en: 'Classics' },
    title: { ky: 'Орус классикасы', ru: 'Русская классика', en: 'Russian classics' },
    skills: [
      { id: 'authors', title: { ky: 'Авторлор', ru: 'Авторы', en: 'Authors' } },
      { id: 'genres', title: { ky: 'Жанрлар', ru: 'Жанры', en: 'Genres' } },
      { id: 'works', title: { ky: 'Чыгармалар', ru: 'Произведения', en: 'Works' } }
    ],
    bank: () => import('../data/questions/russian-lit-6-classics.js')
  },
  {
    id: 'physics-7-mechanics',
    subject: 'physics', grade: 7, section: { ky: 'Механика', ru: 'Механика', en: 'Mechanics' },
    title: { ky: 'Механиканын негиздери', ru: 'Основы механики', en: 'Basics of mechanics' },
    skills: [
      { id: 'motion', title: { ky: 'Кыймыл жана ылдамдык', ru: 'Движение и скорость', en: 'Motion and speed' } },
      { id: 'force', title: { ky: 'Күч жана салмак', ru: 'Сила и вес', en: 'Force and weight' } },
      { id: 'density', title: { ky: 'Тыгыздык', ru: 'Плотность', en: 'Density' } },
      { id: 'units', title: { ky: 'Өлчөө бирдиктери', ru: 'Единицы измерения', en: 'Units' } }
    ],
    bank: () => import('../data/questions/physics-7-mechanics.js')
  },
  {
    id: 'chemistry-8-basics',
    subject: 'chemistry', grade: 8, section: { ky: 'Негизги түшүнүктөр', ru: 'Основные понятия', en: 'Core ideas' },
    title: { ky: 'Химиянын баштапкы түшүнүктөрү', ru: 'Первоначальные химические понятия', en: 'First ideas of chemistry' },
    skills: [
      { id: 'symbols', title: { ky: 'Элементтердин белгилери', ru: 'Знаки элементов', en: 'Element symbols' } },
      { id: 'formulas', title: { ky: 'Формулалар', ru: 'Формулы', en: 'Formulas' } },
      { id: 'phenomena', title: { ky: 'Кубулуштар', ru: 'Явления', en: 'Phenomena' } }
    ],
    bank: () => import('../data/questions/chemistry-8-basics.js')
  },
  {
    id: 'biology-6-plants',
    subject: 'biology', grade: 6, section: { ky: 'Ботаника', ru: 'Ботаника', en: 'Botany' },
    title: { ky: 'Клетка жана өсүмдүктөр', ru: 'Клетка и растения', en: 'Cells and plants' },
    skills: [
      { id: 'cell', title: { ky: 'Клетка', ru: 'Клетка', en: 'The cell' } },
      { id: 'photosynthesis', title: { ky: 'Фотосинтез', ru: 'Фотосинтез', en: 'Photosynthesis' } },
      { id: 'plants', title: { ky: 'Өсүмдүктүн түзүлүшү', ru: 'Строение растения', en: 'Plant structure' } }
    ],
    bank: () => import('../data/questions/biology-6-plants.js')
  },
  {
    id: 'world-history-5-ancient',
    subject: 'world-history', grade: 5, section: { ky: 'Байыркы дүйнө', ru: 'Древний мир', en: 'Ancient world' },
    title: { ky: 'Байыркы цивилизациялар', ru: 'Древние цивилизации', en: 'Ancient civilisations' },
    skills: [
      { id: 'civilizations', title: { ky: 'Цивилизациялар', ru: 'Цивилизации', en: 'Civilisations' } },
      { id: 'culture', title: { ky: 'Маданият', ru: 'Культура', en: 'Culture' } },
      { id: 'dates', title: { ky: 'Даталар', ru: 'Даты', en: 'Dates' } }
    ],
    bank: () => import('../data/questions/world-history-5-ancient.js')
  },
  {
    id: 'social-9-state',
    subject: 'social', grade: 9, section: { ky: 'Укук', ru: 'Право', en: 'Law' },
    title: { ky: 'Мамлекет жана укук', ru: 'Государство и право', en: 'The state and law' },
    skills: [
      { id: 'state', title: { ky: 'Мамлекет', ru: 'Государство', en: 'The state' } },
      { id: 'rights', title: { ky: 'Укуктар', ru: 'Права', en: 'Rights' } },
      { id: 'citizenship', title: { ky: 'Жарандык', ru: 'Гражданство', en: 'Citizenship' } }
    ],
    bank: () => import('../data/questions/social-9-state.js')
  },
  {
    id: 'economics-10-basics',
    subject: 'economics', grade: 10, section: { ky: 'Микроэкономика', ru: 'Микроэкономика', en: 'Microeconomics' },
    title: { ky: 'Экономиканын негиздери', ru: 'Основы экономики', en: 'Basics of economics' },
    skills: [
      { id: 'market', title: { ky: 'Рынок', ru: 'Рынок', en: 'The market' } },
      { id: 'money', title: { ky: 'Акча', ru: 'Деньги', en: 'Money' } },
      { id: 'business', title: { ky: 'Ишкердик', ru: 'Предпринимательство', en: 'Business' } }
    ],
    bank: () => import('../data/questions/economics-10-basics.js')
  },
  {
    id: 'finance-8-budget',
    subject: 'finance', grade: 8, section: { ky: 'Жеке каржы', ru: 'Личные финансы', en: 'Personal finance' },
    title: { ky: 'Жеке бюджет жана коопсуздук', ru: 'Личный бюджет и безопасность', en: 'Personal budget and safety' },
    skills: [
      { id: 'budget', title: { ky: 'Бюджет', ru: 'Бюджет', en: 'Budget' } },
      { id: 'saving', title: { ky: 'Топтоо', ru: 'Сбережения', en: 'Saving' } },
      { id: 'safety', title: { ky: 'Финансылык коопсуздук', ru: 'Финансовая безопасность', en: 'Financial safety' } }
    ],
    bank: () => import('../data/questions/finance-8-budget.js')
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
 * @param {function} opts.filter  — отбор под формат игры (например, только «поиск ошибки»)
 * @param {boolean} opts.strict   — не добирать вопросы другого формата
 */
export async function getQuestions({ topic, count = 10, skills, difficulty, types, ids, filter, strict = false, includeCustom = true } = {}) {
  // Явный список вопросов (домашнее задание с ручным выбором)
  if (ids?.length) {
    const bank = await loadBank(topic);
    const fromBank = bank.filter((q) => ids.includes(q.id));
    const fromTeacher = await engineQuestionsByIds(ids.filter((id) => !fromBank.some((q) => q.id === id)));
    return [...fromBank, ...fromTeacher];
  }

  // Вопросы предмета + вопросы, созданные учителем в конструкторе
  const bank = await loadBank(topic);
  const custom = includeCustom ? await teacherQuestions({ topic }) : [];
  const pool = filter ? [...bank, ...custom].filter(filter) : [...bank, ...custom];

  let list = pool;
  if (skills?.length) list = list.filter((q) => skills.includes(q.skill));
  if (difficulty?.length) list = list.filter((q) => difficulty.includes(q.difficulty ?? 1));
  if (types?.length) list = list.filter((q) => types.includes(q.type || 'choice'));

  // Если отфильтровали слишком сильно — добираем из общего набора темы
  if (list.length < count && !strict) {
    const rest = pool.filter((q) => !list.includes(q));
    list = list.concat(shuffle(rest).slice(0, count - list.length));
  }
  return shuffle(list).slice(0, count);
}

/** Варианты ответа в перемешанном порядке (правильный не всегда первый) */
export function shuffleOptions(question, lang) {
  const opts = (question.options || []).map((o, i) => ({ text: pick(o, lang), index: i }));
  // В «поиске ошибки» варианты — строки решения, их порядок важен
  const mixed = question.errorHunt || question.vote ? opts : shuffle(opts);
  return {
    options: mixed,
    correctIndex: mixed.findIndex((o) => o.index === (question.correct ?? 0))
  };
}

/**
 * Найти вопрос по id — нужен для разбора ошибок с объяснением.
 * Ищет в банке темы и среди вопросов учителя.
 */
export async function findQuestion(topicId, questionId) {
  const bank = await loadBank(topicId);
  const fromBank = bank.find((q) => q.id === questionId);
  if (fromBank) return fromBank;
  const [custom] = await engineQuestionsByIds([questionId]);
  return custom || null;
}
