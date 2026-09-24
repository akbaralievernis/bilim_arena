/**
 * Bilim Arena — библиотека вопросов учителя.
 *
 * Вопросы НИКОГДА не хранятся внутри кода игр. Здесь лежат вопросы,
 * созданные учителем в конструкторе; готовые банки предметов лежат в data/.
 * Игровой движок получает и те и другие через curriculum.getQuestions().
 *
 * Формат хранения (как в техзадании):
 *   question, options, correctAnswer, explanation,
 *   subject, grade, section, topic, skill, difficulty, xp, type
 */

import { store } from './store.js';

const KEY = 'questions';

/** Типы заданий, которые понимает движок */
export const QUESTION_TYPES = [
  { id: 'single', icon: '🔘', title: { ky: 'Бир туура жооп', ru: 'Один правильный ответ', en: 'Single choice' } },
  { id: 'multiple', icon: '☑️', title: { ky: 'Бир нече туура жооп', ru: 'Несколько правильных', en: 'Multiple choice' } },
  { id: 'truefalse', icon: '✅', title: { ky: 'Ооба / Жок', ru: 'Да / Нет', en: 'True / False' } },
  { id: 'number', icon: '🔢', title: { ky: 'Сан киргизүү', ru: 'Ввод числа', en: 'Number input' } },
  { id: 'text', icon: '⌨️', title: { ky: 'Текст киргизүү', ru: 'Ввод текста', en: 'Text input' } },
  { id: 'match', icon: '🔗', title: { ky: 'Дал келтирүү', ru: 'Сопоставление', en: 'Matching' } },
  { id: 'sort', icon: '↕️', title: { ky: 'Иреттөө', ru: 'Сортировка', en: 'Sorting' } },
  { id: 'sequence', icon: '🔢', title: { ky: 'Ырааттуулук', ru: 'Последовательность', en: 'Sequence' } },
  { id: 'error', icon: '🔍', title: { ky: 'Катаны тап', ru: 'Поиск ошибки', en: 'Find the mistake' } }
];

export const typeMeta = (id) => QUESTION_TYPES.find((x) => x.id === id) || QUESTION_TYPES[0];

const newId = () => `q_${Date.now()}_${Math.floor(Math.random() * 9999)}`;

/** Все вопросы учителя */
export async function allQuestions() {
  return store.get(KEY, []);
}

/**
 * Поиск с фильтрами — используется в библиотеке «Мои вопросы».
 * @param {object} f { subject, grade, topic, skill, difficulty, type, search }
 */
export async function findQuestions(f = {}) {
  const list = await allQuestions();
  const needle = (f.search || '').trim().toLowerCase();

  return list.filter((q) => {
    if (f.subject && q.subject !== f.subject) return false;
    if (f.grade && Number(q.grade) !== Number(f.grade)) return false;
    if (f.topic && q.topic !== f.topic) return false;
    if (f.skill && q.skill !== f.skill) return false;
    if (f.difficulty && Number(q.difficulty) !== Number(f.difficulty)) return false;
    if (f.type && q.type !== f.type) return false;
    if (needle) {
      const hay = [
        textOf(q.question),
        ...(q.options || []).map(textOf),
        textOf(q.explanation)
      ].join(' ').toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

const textOf = (v) => (v && typeof v === 'object' ? Object.values(v).join(' ') : String(v ?? ''));

export async function getQuestion(id) {
  const list = await allQuestions();
  return list.find((q) => q.id === id) || null;
}

/** Создать или обновить вопрос */
export async function saveQuestion(data) {
  const list = await allQuestions();
  const now = Date.now();

  if (data.id) {
    const i = list.findIndex((q) => q.id === data.id);
    if (i >= 0) {
      list[i] = { ...list[i], ...data, updatedAt: now };
      await store.set(KEY, list);
      return list[i];
    }
  }

  const clean = { ...data };
  delete clean.id;          // иначе id: undefined затрёт сгенерированный
  delete clean.createdAt;

  const question = {
    type: 'single',
    difficulty: 1,
    xp: 10,
    ...clean,
    id: newId(),
    createdAt: now,
    updatedAt: now
  };
  list.push(question);
  await store.set(KEY, list);
  return question;
}

/** Копия вопроса — удобно делать похожие задания */
export async function duplicateQuestion(id) {
  const q = await getQuestion(id);
  if (!q) return null;
  const copy = { ...q };
  delete copy.id;
  delete copy.createdAt;
  return saveQuestion(copy);
}

export async function deleteQuestion(id) {
  const list = await allQuestions();
  await store.set(KEY, list.filter((q) => q.id !== id));
}

export async function deleteMany(ids) {
  const set = new Set(ids);
  const list = await allQuestions();
  await store.set(KEY, list.filter((q) => !set.has(q.id)));
}

// ─── Перевод в формат игрового движка ─────────────────────────────────────────

/**
 * Движок работает с полями prompt/options/correct/answer/explain.
 * Здесь вопрос учителя превращается в вопрос движка — логика игр
 * не знает, откуда пришёл вопрос: из файла предмета или из конструктора.
 */
export function toEngineQuestion(q) {
  const base = {
    id: q.id,
    topic: q.topic,
    skill: q.skill,
    difficulty: Number(q.difficulty) || 1,
    xp: Number(q.xp) || 10,
    prompt: q.question,
    explain: q.explanation,
    custom: true
  };

  switch (q.type) {
    case 'truefalse':
      return {
        ...base, type: 'choice',
        options: [
          { ky: 'Ооба', ru: 'Да', en: 'Yes' },
          { ky: 'Жок', ru: 'Нет', en: 'No' }
        ],
        correct: q.correctAnswer === true || q.correctAnswer === 'true' || Number(q.correctAnswer) === 0 ? 0 : 1
      };

    case 'multiple':
      return {
        ...base, type: 'multiple',
        options: q.options || [],
        correct: Array.isArray(q.correctAnswer) ? q.correctAnswer.map(Number) : [Number(q.correctAnswer)]
      };

    case 'number':
      return { ...base, type: 'input', numeric: true, answer: toAnswerList(q.correctAnswer) };

    case 'text':
      return { ...base, type: 'input', answer: toAnswerList(q.correctAnswer) };

    case 'match':
      // correctAnswer: [[левое, правое], ...]
      return { ...base, type: 'match', pairs: q.correctAnswer || [] };

    case 'sort':
    case 'sequence':
      // correctAnswer: массив элементов в правильном порядке
      return { ...base, type: 'sort', items: q.correctAnswer || q.options || [] };

    case 'error':
      // options — строки решения/кода, correctAnswer — номер строки с ошибкой
      return { ...base, type: 'choice', options: q.options || [], correct: Number(q.correctAnswer) || 0, errorHunt: true };

    case 'single':
    default:
      return { ...base, type: 'choice', options: q.options || [], correct: Number(q.correctAnswer) || 0 };
  }
}

const toAnswerList = (v) => (Array.isArray(v) ? v : String(v ?? '').split('|')).map((x) => String(x).trim()).filter(Boolean);

/** Вопросы учителя в формате движка — с теми же фильтрами, что и в банках */
export async function engineQuestions({ topic, skills, difficulty, types } = {}) {
  let list = await allQuestions();
  if (topic) list = list.filter((q) => q.topic === topic);
  if (skills?.length) list = list.filter((q) => skills.includes(q.skill));
  if (difficulty?.length) list = list.filter((q) => difficulty.includes(Number(q.difficulty) || 1));
  if (types?.length) list = list.filter((q) => types.includes(q.type));
  return list.map(toEngineQuestion);
}

/** Получить конкретные вопросы по id (для заданий с ручным выбором) */
export async function engineQuestionsByIds(ids = []) {
  const list = await allQuestions();
  const byId = new Map(list.map((q) => [q.id, q]));
  return ids.map((id) => byId.get(id)).filter(Boolean).map(toEngineQuestion);
}
