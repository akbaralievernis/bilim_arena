/**
 * Bilim Arena — синхронизация через урок (без сервера).
 *
 * Пока backend нет, данные между устройствами передаются по тому же
 * каналу «доска телефоны», что и игра:
 *   доска → телефон: активные задания и вопросы учителя, нужные для них
 *   телефон → доска: результаты выполненной домашки
 *
 * Когда появится сервер, этот модуль станет не нужен — store будет общим.
 */

import { store, KEYS } from './store.js';
import { allAssignments, allSubmissions } from './assignments.js';
import { allQuestions } from './questions.js';

const SUBMISSIONS = 'submissions';
const QUESTIONS = 'questions';

// ─── Сторона учителя ──────────────────────────────────────────────────────────

/** Что отправить ученику: актуальные задания + вопросы учителя для них */
export async function packAssignments() {
  const now = Date.now();
  const assignments = (await allAssignments())
    .filter((a) => a.assignedAt <= now && a.dueAt >= now - 30 * 86400000);

  const needed = new Set(assignments.flatMap((a) => a.questionIds || []));
  const topics = new Set(assignments.filter((a) => !a.questionIds?.length).map((a) => a.topic));
  const questions = (await allQuestions())
    .filter((q) => needed.has(q.id) || topics.has(q.topic));

  return { assignments, questions };
}

/**
 * Одна запись результата с двух устройств. Попытки не теряются: история — объединение
 * (одна попытка = одно время `at`), число попыток — по истории, лучший результат — максимум.
 * Последние поля (процент, ошибки) — от более свежей записи. Раньше более свежая по lastAt
 * запись заменяла другую целиком: пропадали попытки, а при отстающих часах телефона —
 * и новая попытка (аудит 21.10). null — ничего нового.
 */
function mergeSubmission(have, incoming) {
  const key = (h) => `${h.at}`;
  const history = [...(have.history || [])];
  const known = new Set(history.map(key));
  const fresh = (incoming.history || []).filter((h) => h && !known.has(key(h)));
  const newer = (incoming.lastAt || 0) > (have.lastAt || 0);
  if (!fresh.length && !newer) return null;
  history.push(...fresh);
  history.sort((a, b) => (a.at || 0) - (b.at || 0));
  const base = newer ? { ...have, ...incoming } : { ...incoming, ...have };
  return {
    ...base,
    history,
    attempts: Math.max(have.attempts || 0, incoming.attempts || 0, history.length),
    best: Math.max(have.best || 0, incoming.best || 0),
    lastAt: Math.max(have.lastAt || 0, incoming.lastAt || 0)
  };
}

/** Результаты от ученика объединяются с уже имеющимися */
export async function mergeSubmissions(incoming = []) {
  const list = await allSubmissions();
  let added = 0;

  incoming.forEach((sub) => {
    if (!sub?.assignmentId || !sub?.studentId) return;
    const i = list.findIndex((s) => s.assignmentId === sub.assignmentId && s.studentId === sub.studentId);
    if (i < 0) {
      list.push(sub);
      added += 1;
    } else {
      const merged = mergeSubmission(list[i], sub);
      if (merged) { list[i] = merged; added += 1; }
    }
  });

  await store.set(SUBMISSIONS, list);
  return added;
}

// ─── Сторона ученика ──────────────────────────────────────────────────────────

/** Задания и вопросы от учителя сохраняются на телефоне */
export async function mergeAssignments({ assignments = [], questions = [] } = {}) {
  const list = await allAssignments();
  let added = 0;
  assignments.forEach((a) => {
    const i = list.findIndex((x) => x.id === a.id);
    if (i < 0) { list.push(a); added += 1; } else list[i] = a;
  });
  await store.set(KEYS.assignments, list);

  const qs = await allQuestions();
  questions.forEach((q) => {
    const i = qs.findIndex((x) => x.id === q.id);
    if (i < 0) qs.push(q); else qs[i] = q;
  });
  await store.set(QUESTIONS, qs);

  return added;
}

/** Результаты этого ученика — для отправки учителю */
export async function packSubmissions(studentId) {
  return (await allSubmissions()).filter((s) => s.studentId === studentId);
}
