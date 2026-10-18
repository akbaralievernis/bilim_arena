/**
 * Bilim Arena — тесты учителя: вопросы из банка и свои, в нужном порядке.
 *
 * Тест можно запустить на доске, дать домашним заданием или распечатать.
 * Для бумаги каждый вариант (A, B, …) перемешивает вопросы и варианты ответа
 * детерминированно: один и тот же тест и вариант всегда печатаются одинаково,
 * поэтому ключ ответов совпадает с листом и после перезагрузки страницы.
 *
 * Тесты хранятся на этом устройстве (в облако пока не синхронизируются —
 * для этого в базе нужно разрешить ключ 'tests', см. supabase/migrations).
 */

import { store } from './store.js';
import { pick } from './i18n.js';
import { getQuestions } from './curriculum.js';

const KEY = 'tests';
export const LETTERS = 'ABCDEFGHIJ';
/** Типы, которые можно решить на бумаге и проверить по ключу */
export const PAPER_TYPES = ['choice', 'multiple', 'input', 'match', 'sort'];

const newId = () => `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// ─── Хранение ────────────────────────────────────────────────────────────────

export async function allTests() {
  const list = await store.get(KEY, []);
  return Array.isArray(list) ? list : [];
}

export async function getTest(id) {
  return (await allTests()).find((x) => x.id === id) || null;
}

/** @param {object} data { id?, title, subject, grade, topic, questionIds } */
export async function saveTest(data) {
  const list = await allTests();
  const now = Date.now();
  const clean = {
    title: String(data.title || '').trim().slice(0, 120),
    subject: data.subject || null,
    grade: data.grade ? Number(data.grade) : null,
    topic: data.topic || null,
    questionIds: [...new Set((data.questionIds || []).map(String))]
  };
  const i = data.id ? list.findIndex((x) => x.id === data.id) : -1;
  const test = i >= 0 ? { ...list[i], ...clean, updatedAt: now } : { ...clean, id: newId(), createdAt: now, updatedAt: now };
  if (i >= 0) list[i] = test; else list.push(test);
  await store.set(KEY, list);
  return test;
}

export async function deleteTest(id) {
  await store.set(KEY, (await allTests()).filter((x) => x.id !== id));
}

/** Вопросы теста в формате движка — в порядке, заданном учителем */
export async function testQuestions(test) {
  if (!test?.questionIds?.length) return [];
  const list = await getQuestions({ topic: test.topic, ids: test.questionIds });
  const byId = new Map(list.map((q) => [String(q.id), q]));
  return test.questionIds.map((id) => byId.get(String(id))).filter(Boolean);
}

// ─── Варианты для печати ─────────────────────────────────────────────────────

/** Простой генератор случайных чисел с зерном (mulberry32) */
function seeded(seedText) {
  let h = 1779033703;
  for (const ch of String(seedText)) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353) >>> 0;
  return () => {
    h = (h + 0x6D2B79F5) >>> 0;
    let x = h;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWith(rand, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const variantName = (v) => LETTERS[v] || String(v + 1);

/**
 * Один печатный вариант.
 * @returns {Array<{ n, q, type, prompt, options?, left?, right?, items?, key, keyText }>}
 *   key — что ученик должен написать (буквы или ответ), keyText — то же для учителя
 */
export function buildVariant(test, questions, variant, lang) {
  const rand = seeded(`${test.id}:${variant}`);
  // Первый вариант сохраняет порядок учителя, остальные — перемешаны
  const order = variant === 0 ? questions : shuffleWith(rand, questions);
  return order.filter((q) => PAPER_TYPES.includes(q.type) && !q.vote).map((q, i) => {
    const base = { n: i + 1, q, type: q.type, prompt: pick(q.prompt, lang) };
    const mix = (list) => (q.errorHunt ? list : shuffleWith(rand, list)); // строки «поиска ошибки» не мешаем
    switch (q.type) {
      case 'input': {
        const shown = q.answer?.[0] ?? '';
        return { ...base, key: shown, keyText: (q.answer || []).join(' / ') };
      }
      case 'multiple': {
        const options = mix((q.options || []).map((o, index) => ({ text: pick(o, lang), index })));
        const key = options.map((o, k) => ((q.correct || []).includes(o.index) ? LETTERS[k] : '')).join('');
        return { ...base, options, key, keyText: key.split('').join(', ') };
      }
      case 'match': {
        const pairs = q.pairs || [];
        const left = pairs.map(([a], index) => ({ text: pick(a, lang), index }));
        const right = shuffleWith(rand, pairs.map(([, b], index) => ({ text: pick(b, lang), index })));
        const key = left.map((l) => LETTERS[right.findIndex((r) => r.index === l.index)]).join('');
        return { ...base, left, right, key, keyText: left.map((l, k) => `${k + 1}–${key[k]}`).join(', ') };
      }
      case 'sort': {
        const items = shuffleWith(rand, (q.items || []).map((x, index) => ({ text: pick(x, lang), index })));
        const key = (q.items || []).map((_, idx) => LETTERS[items.findIndex((x) => x.index === idx)]).join('');
        return { ...base, items, key, keyText: key.split('').join(' → ') };
      }
      default: {
        const options = mix((q.options || []).map((o, index) => ({ text: pick(o, lang), index })));
        const key = LETTERS[options.findIndex((o) => o.index === (q.correct ?? 0))];
        return { ...base, options, key, keyText: key };
      }
    }
  });
}

export { variantName };

// ─── Проверка бумажных ответов ───────────────────────────────────────────────

/** Кириллические буквы, похожие на латинские, — учитель может набрать любые */
const HOMO = { 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'а': 'A', 'в': 'B', 'с': 'C', 'е': 'E' };
const letters = (s) => String(s ?? '').split('').map((ch) => HOMO[ch] || ch).join('').toUpperCase().replace(/[^A-J]/g, '');
const normText = (s) => String(s ?? '').trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');

/** Верен ли ответ ученика на пункт варианта */
export function checkPaperAnswer(item, given) {
  if (given == null || String(given).trim() === '' || String(given).trim() === '-') return false;
  switch (item.type) {
    case 'input': {
      const answers = item.q.answer || [];
      if (item.q.numeric) {
        const a = Number(String(given).replace(',', '.'));
        return Number.isFinite(a) && answers.some((x) => Math.abs(Number(String(x).replace(',', '.')) - a) < 1e-9);
      }
      return answers.some((x) => normText(x) === normText(given));
    }
    case 'multiple':
      return letters(given).split('').sort().join('') === item.key.split('').sort().join('');
    default:
      return letters(given) === item.key;
  }
}

/**
 * Разбор строки ответов ученика: «A C B 12 AC» или слитно «ACBDA»
 * (слитно — только если все пункты отвечаются одной буквой).
 */
export function parseAnswers(text, items) {
  const raw = String(text ?? '').trim();
  if (!raw) return [];
  const parts = raw.split(/[\s,;]+/).filter(Boolean);
  const oneLetter = items.every((it) => it.type === 'choice');
  if (parts.length === 1 && oneLetter && letters(raw).length === items.length && items.length > 1) return letters(raw).split('');
  return parts;
}

/** Итог одного листа: по пунктам и всего */
export function scorePaper(items, answers) {
  const rows = items.map((it, i) => ({ item: it, given: answers[i] ?? '', correct: checkPaperAnswer(it, answers[i]) }));
  return { rows, correct: rows.filter((r) => r.correct).length, total: items.length };
}

// ─── Экспорт в Bilim Arena Race ──────────────────────────────────────────────

/** Ограничения Race (lib/race/validation.ts, lib/race/tasks.ts) */
export const RACE_LIMITS = { route: 20, options: 6, title: 60, question: 500, option: 200 };

/** Ячейка таблицы (табуляция): в кавычки, если внутри табуляция, перенос или кавычка */
const tsvCell = (s) => {
  const v = String(s ?? '').trim();
  return /[\t\n\r"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

/**
 * Вопросы теста → строки для «Вставить из Excel» в Race:
 * чекпоинт | вопрос | правильный ответ | неверные варианты…
 * Race понимает только выбор одного ответа и короткий ответ — остальное пропускаем честно.
 * @returns {{ text, used, skippedTypes, cut }}
 */
export function toRaceTable(test, questions, lang, checkpointLabel = (n) => `${n}`) {
  const rows = [];
  let skippedTypes = 0;
  for (const q of questions) {
    if (q.vote) continue;
    const prompt = pick(q.prompt, lang).slice(0, RACE_LIMITS.question);
    let answer = '';
    let wrong = [];
    if (q.type === 'choice' && Array.isArray(q.options)) {
      const opts = q.options.map((o) => pick(o, lang).slice(0, RACE_LIMITS.option));
      answer = opts[q.correct ?? 0];
      wrong = opts.filter((_, i) => i !== (q.correct ?? 0)).slice(0, RACE_LIMITS.options - 1);
    } else if (q.type === 'input' && q.answer?.length) {
      answer = String(q.answer[0]).slice(0, RACE_LIMITS.option);
    } else {
      skippedTypes++;
      continue;
    }
    if (!prompt || !answer) { skippedTypes++; continue; }
    rows.push([checkpointLabel(rows.length + 1).slice(0, RACE_LIMITS.title), prompt, answer, ...wrong]);
  }
  const cut = Math.max(0, rows.length - RACE_LIMITS.route);
  const used = rows.slice(0, RACE_LIMITS.route);
  return { text: used.map((r) => r.map(tsvCell).join('\t')).join('\n'), used: used.length, skippedTypes, cut };
}
