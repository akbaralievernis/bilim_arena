/**
 * Bilim Arena — журнал уроков и отчёты по ученикам.
 *
 * Доска после каждого этапа сохраняет, кто как ответил (по навыкам и по
 * вопросам). Из этих записей и из домашних заданий строятся:
 *   • история уроков — что проходили, сколько верных, кто ошибался;
 *   • отчёт по ученику — все его уроки и задания, слабые навыки.
 *
 * Ученик на доске — это имя, с которым он вошёл с телефона (аккаунтов у
 * учеников нет), поэтому отчёты объединяют записи по имени без учёта
 * регистра и лишних пробелов.
 */

import { store, KEYS } from './store.js';
import { allAssignments, allSubmissions } from './assignments.js';
import { masteryStatus, masterySettings } from './mastery.js';

const LIMIT = 100;           // уроков в журнале (старые удаляются)
const WEAK = 0.7;            // меньше 70% верных — навык нужно повторить

const newId = () => `l_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

/** Ключ ученика: «  Айбек  Асанов » и «айбек асанов» — один ученик */
export const studentKey = (name) => String(name ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

const skillKey = (topic, skill) => `${topic || ''}::${skill || ''}`;
export const splitSkillKey = (key) => {
  const [topic, skill] = String(key).split('::');
  return { topic: topic || null, skill: skill || null };
};

const addStat = (map, key, ok) => {
  const s = map[key] || (map[key] = { ok: 0, total: 0 });
  s.total += 1;
  if (ok) s.ok += 1;
};

/** Только записи уроков с результатами (в старом журнале был лишь факт запуска) */
async function readLessons() {
  const list = await store.get(KEYS.lessons, []);
  return Array.isArray(list) ? list.filter((l) => l && l.v === 2) : [];
}

/**
 * Записать итог этапа урока.
 * @param {object} p { lessonId?, subject, topic, mode, gameId, log, players }
 *   log — game.log движка: [{ playerId, playerName, skill, correct, questionId }]
 *   players — results.players: [{ id, name, score }]
 * @returns {string} id урока (передавайте его в следующие этапы)
 */
export async function recordStage({ lessonId, subject, topic, mode, gameId, log, players = [] }) {
  const entries = Array.isArray(log) ? log.filter((e) => e && e.playerId) : [];
  if (!entries.length) return lessonId || null;

  const all = await store.get(KEYS.lessons, []);
  const list = Array.isArray(all) ? all : [];
  let lesson = lessonId ? list.find((l) => l && l.id === lessonId) : null;
  if (!lesson) {
    lesson = {
      v: 2, id: lessonId || newId(), at: Date.now(), subject: subject || null, topic: topic || null,
      mode: mode || 'lesson', stages: [], answered: 0, correct: 0, bySkill: {}, students: {}
    };
    list.push(lesson);
  }

  const scores = new Map(players.map((p) => [p.id, p]));
  let correct = 0;
  entries.forEach((e) => {
    const name = e.playerName || scores.get(e.playerId)?.name || '?';
    const key = studentKey(name);
    const st = lesson.students[key] || (lesson.students[key] = { name, answered: 0, correct: 0, score: 0, bySkill: {}, wrong: [] });
    st.name = name;
    st.answered += 1;
    if (e.correct) { st.correct += 1; correct += 1; }
    else if (e.questionId && !st.wrong.includes(e.questionId)) st.wrong.push(e.questionId);
    addStat(st.bySkill, skillKey(e.topic || topic, e.skill), e.correct);
    addStat(lesson.bySkill, skillKey(e.topic || topic, e.skill), e.correct);
  });
  // Очки этапа — по игрокам, а не по ответам
  players.forEach((p) => {
    const st = lesson.students[studentKey(p.name)];
    if (st) st.score += Number(p.score) || 0;
  });

  lesson.answered += entries.length;
  lesson.correct += correct;
  lesson.endedAt = Date.now();
  lesson.stages.push({ gameId: gameId || null, topic: topic || null, at: Date.now(), answered: entries.length, correct });

  // Журнал не растёт бесконечно: остаются последние LIMIT уроков
  const v2 = list.filter((l) => l && l.v === 2);
  const keep = new Set(v2.slice(-LIMIT).map((l) => l.id));
  await store.set(KEYS.lessons, v2.filter((l) => keep.has(l.id)));
  return lesson.id;
}

/** История уроков: новые сверху */
export async function lessonHistory() {
  return (await readLessons()).sort((a, b) => b.at - a.at);
}

export async function getLesson(id) {
  return (await readLessons()).find((l) => l.id === id) || null;
}

export async function deleteLesson(id) {
  const list = await readLessons();
  await store.set(KEYS.lessons, list.filter((l) => l.id !== id));
}

/** Ответы проверки по темам: «тема::навык» → тема; навык без темы — тема задания */
function checkParts(bySkill, fallbackTopic) {
  const parts = new Map();
  Object.entries(bySkill || {}).forEach(([k, v]) => {
    const topic = k.includes('::') ? splitSkillKey(k).topic : fallbackTopic;
    const total = Number(v?.total) || 0;
    if (!topic || !total) return;
    const p = parts.get(topic) || { ok: 0, total: 0 };
    p.ok += Number(v?.ok) || 0;
    p.total += total;
    parts.set(topic, p);
  });
  return parts;
}

/** Навыки ниже порога — самые слабые первыми */
export function weakFrom(bySkill, limit = 5) {
  return Object.entries(bySkill || {})
    .map(([key, s]) => ({ key, ...splitSkillKey(key), ok: s.ok, total: s.total, pct: s.total ? Math.round((s.ok / s.total) * 100) : 0 }))
    .filter((s) => s.total > 0 && s.ok / s.total < WEAK)
    .sort((a, b) => a.pct - b.pct || b.total - a.total)
    .slice(0, limit);
}

const pct = (ok, total) => (total ? Math.round((ok / total) * 100) : null);

/**
 * Сводка по всем ученикам: уроки на доске + домашние задания.
 * @returns {Array<{ key, name, lessons, answered, correct, pct, homework, homeworkPct, lastAt, bySkill, weak }>}
 */
export async function studentSummaries() {
  const map = new Map();
  const get = (name) => {
    const key = studentKey(name);
    if (!key || key === '?') return null;
    if (!map.has(key)) map.set(key, { key, name: String(name).trim(), lessons: 0, answered: 0, correct: 0, homework: 0, homeworkSum: 0, lastAt: 0, bySkill: {} });
    return map.get(key);
  };

  for (const lesson of await readLessons()) {
    Object.values(lesson.students || {}).forEach((st) => {
      const s = get(st.name);
      if (!s) return;
      s.lessons += 1;
      s.answered += st.answered;
      s.correct += st.correct;
      s.lastAt = Math.max(s.lastAt, lesson.endedAt || lesson.at);
      Object.entries(st.bySkill || {}).forEach(([k, v]) => {
        const acc = s.bySkill[k] || (s.bySkill[k] = { ok: 0, total: 0 });
        acc.ok += v.ok; acc.total += v.total;
      });
    });
  }

  const assignments = new Map((await allAssignments()).map((a) => [a.id, a]));
  for (const sub of await allSubmissions()) {
    const s = get(sub.studentName);
    if (!s) continue;
    s.homework += 1;
    s.homeworkSum += Number(sub.best) || 0;
    s.lastAt = Math.max(s.lastAt, sub.lastAt || 0);
    const topic = assignments.get(sub.assignmentId)?.topic || null;
    Object.entries(sub.skillStats || {}).forEach(([skill, v]) => {
      const k = skill.includes('::') ? skill : skillKey(topic, skill); // задание из нескольких тем
      const acc = s.bySkill[k] || (s.bySkill[k] = { ok: 0, total: 0 });
      acc.ok += Number(v.ok) || 0; acc.total += Number(v.total) || 0;
    });
  }

  return [...map.values()]
    .map((s) => ({
      ...s,
      pct: pct(s.correct, s.answered),
      homeworkPct: s.homework ? Math.round(s.homeworkSum / s.homework) : null,
      weak: weakFrom(s.bySkill, 3)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Подробный отчёт по одному ученику */
export async function studentReport(key) {
  const summary = (await studentSummaries()).find((s) => s.key === key);
  if (!summary) return null;

  const lessons = (await lessonHistory())
    .filter((l) => l.students?.[key])
    .map((l) => {
      const st = l.students[key];
      return { id: l.id, at: l.at, subject: l.subject, topic: l.topic, answered: st.answered, correct: st.correct, pct: pct(st.correct, st.answered), score: st.score };
    });

  const assignments = new Map((await allAssignments()).map((a) => [a.id, a]));
  const homework = (await allSubmissions())
    .filter((s) => studentKey(s.studentName) === key)
    .map((s) => {
      const a = assignments.get(s.assignmentId);
      return { id: s.assignmentId, title: a?.title || null, topic: a?.topic || null, best: s.best, attempts: s.attempts, lastAt: s.lastAt, late: !!s.late };
    })
    .sort((a, b) => b.lastAt - a.lastAt);

  // Темы: все ответы (уроки + задания) и итоговые проверки (задания в режиме «Проверка»)
  const settings = await masterySettings();
  const byTopic = new Map();
  const topicOf = (id) => {
    if (!byTopic.has(id)) byTopic.set(id, { topic: id, answered: 0, correct: 0, checks: [] });
    return byTopic.get(id);
  };
  Object.entries(summary.bySkill).forEach(([k, v]) => {
    const { topic } = splitSkillKey(k);
    if (!topic) return;
    const row = topicOf(topic);
    row.answered += v.total;
    row.correct += v.ok;
  });
  // Проверка по нескольким темам засчитывается каждой теме своей частью (по навыкам), как в
  // отчёте цикла; без навыков (старые записи) — целиком теме проверки
  const addChecks = (at, bySkill, fallbackTopic, correct, total) => {
    const parts = checkParts(bySkill, fallbackTopic);
    if (parts.size) parts.forEach((p, topic) => topicOf(topic).checks.push({ at, correct: p.ok, total: p.total }));
    else if (fallbackTopic) topicOf(fallbackTopic).checks.push({ at, correct, total });
  };
  (await readLessons()).filter((l) => l.mode === 'paper-check' && l.topic && l.students?.[key]).forEach((l) => {
    const st = l.students[key];
    addChecks(l.at, st.bySkill, l.topic, st.correct, st.answered);
  });
  (await allSubmissions()).filter((s) => studentKey(s.studentName) === key).forEach((s) => {
    const a = assignments.get(s.assignmentId);
    if (!a?.check || !a.topic) return;
    (s.history || []).forEach((h) => addChecks(h.at, h.bySkill, a.topic, h.correct, h.total));
  });
  const topicRows = [...byTopic.values()].map((row) => {
    row.checks.sort((a, b) => a.at - b.at);
    return { ...row, ...masteryStatus(row, settings) };
  });

  return { ...summary, weak: weakFrom(summary.bySkill, 6), lessonRows: lessons, homeworkRows: homework, topicRows, settings };
}

/**
 * Тренировки ученика из его аккаунта (core/cloud.js → 'class_practice'), по темам.
 * Только для учеников, вошедших в класс по коду; сопоставление — по имени, как и во всём отчёте.
 * @returns {{ at: number, rows: Array<{ topic, answered, pct, lastAt, checkPct, checkAt }> } | null}
 */
export async function studentPractice(key) {
  const all = await store.get('class_practice', {});
  const mine = Object.values(all && typeof all === 'object' ? all : {}).filter((p) => studentKey(p?.name) === key);
  if (!mine.length) return null;
  const byTopic = new Map();
  for (const p of mine) {
    Object.entries(p.topics || {}).forEach(([topic, v]) => {
      const row = byTopic.get(topic) || { topic, answered: 0, correct: 0, lastAt: 0, checkPct: null, checkAt: 0 };
      row.answered += Number(v?.answered) || 0;
      row.correct += Number(v?.correct) || 0;
      row.lastAt = Math.max(row.lastAt, Number(v?.lastAt) || 0);
      byTopic.set(topic, row);
    });
    Object.entries(p.checks || {}).forEach(([topic, list]) => {
      const row = byTopic.get(topic) || { topic, answered: 0, correct: 0, lastAt: 0, checkPct: null, checkAt: 0 };
      (Array.isArray(list) ? list : []).forEach((c) => {
        if (c && Number(c.at) > row.checkAt && Number(c.total) > 0) { row.checkAt = Number(c.at); row.checkPct = pct(Number(c.correct) || 0, Number(c.total)); }
      });
      byTopic.set(topic, row);
    });
  }
  const rows = [...byTopic.values()]
    .filter((r) => r.answered > 0 || r.checkPct !== null)
    .map((r) => ({ ...r, pct: pct(r.correct, r.answered) }))
    .sort((a, b) => Math.max(b.lastAt, b.checkAt) - Math.max(a.lastAt, a.checkAt));
  return rows.length ? { at: Math.max(...mine.map((p) => Number(p.at) || 0)), rows } : null;
}
