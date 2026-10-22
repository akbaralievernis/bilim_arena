/**
 * Bilim Arena — проверка вопросов банка учителем.
 *
 * Встроенный банк написан с помощью ИИ и человеком не проверялся. Учитель
 * просматривает вопросы темы и отмечает: «Верно» или «Есть ошибка» (с
 * комментарием). Вопрос с отметкой «Есть ошибка» не попадает в уроки, тесты и
 * задания на этом устройстве, пока отметку не снимут.
 */

import { store } from './store.js';
import { pick } from './i18n.js';

export const REVIEW_KEY = 'qreview';
const NOTE_MAX = 300;
const refOf = (topic, id) => `${topic}::${id}`;

export async function allReviews() {
  const r = await store.get(REVIEW_KEY, {});
  return r && typeof r === 'object' && !Array.isArray(r) ? r : {};
}

/** status: 'ok' | 'issue' | null (снять отметку) */
export async function setReview(topic, id, status, note = '') {
  const all = await allReviews();
  const ref = refOf(topic, id);
  if (!status) delete all[ref];
  else all[ref] = { s: status === 'issue' ? 'issue' : 'ok', note: String(note || '').trim().slice(0, NOTE_MAX), at: Date.now() };
  if (!(await store.set(REVIEW_KEY, all))) throw new Error('storage');
  return all[ref] || null;
}

/** Отметки «есть ошибка» учителя класса — приходят ученику вместе с заданиями (core/sync.js) */
export const CLASS_FLAGS_KEY = 'class_flags';

/** «тема::id» вопросов, где этот учитель нашёл ошибку */
export async function ownFlaggedRefs() {
  const all = await allReviews();
  return Object.entries(all).filter(([, v]) => v?.s === 'issue').map(([k]) => k);
}

/** «тема::id» вопросов с ошибкой: свои отметки и отметки учителя класса (на устройстве ученика) */
export async function flaggedRefs() {
  const fromTeacher = await store.get(CLASS_FLAGS_KEY, []);
  return new Set([...(await ownFlaggedRefs()), ...(Array.isArray(fromTeacher) ? fromTeacher : [])]);
}

/** Ученик: отметки учителя из последних полученных заданий (заменяют прежние — снятые отметки уходят) */
export async function setClassFlags(refs) {
  const clean = (Array.isArray(refs) ? refs : []).filter((r) => typeof r === 'string' && r.length <= 120).slice(0, 2000);
  await store.set(CLASS_FLAGS_KEY, [...new Set(clean)], { silent: true });
}

/** Сколько вопросов темы проверено и сколько с ошибкой */
export function reviewCounts(questions, reviews) {
  let ok = 0;
  let issue = 0;
  questions.forEach((q) => {
    const r = reviews[refOf(q.topic, q.id)];
    if (r?.s === 'ok') ok += 1;
    else if (r?.s === 'issue') issue += 1;
  });
  return { ok, issue, total: questions.length, left: questions.length - ok - issue };
}

/** Правильный ответ вопроса банка текстом — чтобы учитель видел, что проверяет */
export function answerText(q, lang) {
  const P = (x) => pick(x, lang);
  switch (q.type) {
    case 'input': return (q.answer || []).map(P).join(' / ');
    case 'multiple': return (q.correct || []).map((i) => P(q.options?.[i])).join(', ');
    case 'match': return (q.pairs || []).map(([l, r]) => `${P(l)} → ${P(r)}`).join('; ');
    case 'sort': return (q.items || []).map(P).join(' → ');
    default: return P(q.options?.[q.correct]) ?? '';
  }
}
