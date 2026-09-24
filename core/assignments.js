/**
 * Bilim Arena — домашние задания.
 *
 * Учитель создаёт задание (тема, навык, сложность, срок, попытки, XP),
 * ученик выполняет его тем же игровым движком, а ошибки попадают
 * в уже существующую аналитику по навыкам (core/progress.js).
 *
 * Здесь нет своей системы XP, пользователей или вопросов —
 * используются core/progress.js, core/profile.js и core/curriculum.js.
 */

import { store, KEYS } from './store.js';

const SUBMISSIONS = 'submissions';

export const STATUS = {
  NEW: 'new',
  PROGRESS: 'progress',
  DONE: 'done',
  LATE: 'late'
};

const newId = () => `a_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x.getTime(); };

// ─── Задания (сторона учителя) ────────────────────────────────────────────────

export async function allAssignments() {
  return store.get(KEYS.assignments, []);
}

export async function getAssignment(id) {
  const list = await allAssignments();
  return list.find((a) => a.id === id) || null;
}

/**
 * Создать или обновить задание.
 * @param {object} data { title, subject, grade, section, topic, skill, difficulty,
 *                        count, questionIds, classId, assignedAt, dueAt, attempts, xp }
 */
export async function saveAssignment(data) {
  const list = await allAssignments();

  if (data.id) {
    const i = list.findIndex((a) => a.id === data.id);
    if (i >= 0) {
      list[i] = { ...list[i], ...data, updatedAt: Date.now() };
      await store.set(KEYS.assignments, list);
      return list[i];
    }
  }

  const clean = { ...data };
  delete clean.id;          // иначе id: undefined затрёт сгенерированный
  delete clean.createdAt;

  const assignment = {
    title: '',
    subject: null,
    grade: null,
    section: null,
    topic: null,
    skill: null,          // null = все навыки темы
    difficulty: [1, 2],
    count: 10,
    questionIds: null,    // null = вопросы подбираются автоматически
    classId: null,
    assignedAt: startOfDay(Date.now()),
    dueAt: endOfDay(Date.now() + 7 * 86400000),
    attempts: 2,
    xp: 50,
    ...clean,
    id: newId(),
    createdAt: Date.now()
  };
  list.push(assignment);
  await store.set(KEYS.assignments, list);
  return assignment;
}

export async function deleteAssignment(id) {
  const list = await allAssignments();
  await store.set(KEYS.assignments, list.filter((a) => a.id !== id));
}

// ─── Выполнение (сторона ученика) ─────────────────────────────────────────────

export async function allSubmissions() {
  return store.get(SUBMISSIONS, []);
}

export async function submissionFor(assignmentId, studentId) {
  const list = await allSubmissions();
  return list.find((s) => s.assignmentId === assignmentId && s.studentId === studentId) || null;
}

/**
 * Сохраняет попытку ученика. Ошибки по навыкам в этот момент уже записаны
 * движком через progress.recordAnswer() — здесь хранится только итог попытки.
 */
export async function saveSubmission({ assignmentId, studentId, studentName, correct, total, skillStats, mistakes }) {
  const list = await allSubmissions();
  const assignment = await getAssignment(assignmentId);
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const now = Date.now();

  let sub = list.find((s) => s.assignmentId === assignmentId && s.studentId === studentId);
  if (!sub) {
    sub = { assignmentId, studentId, studentName, attempts: 0, best: 0, lastAt: 0, history: [] };
    list.push(sub);
  }

  sub.studentName = studentName || sub.studentName;
  sub.attempts += 1;
  sub.best = Math.max(sub.best, percent);
  sub.lastAt = now;
  sub.correct = correct;
  sub.total = total;
  sub.skillStats = mergeSkillStats(sub.skillStats, skillStats);
  sub.mistakes = mistakes || [];
  sub.late = assignment ? now > assignment.dueAt : false;
  sub.history.push({ at: now, percent, correct, total });

  await store.set(SUBMISSIONS, list);
  return sub;
}

function mergeSkillStats(a = {}, b = {}) {
  const out = { ...a };
  Object.entries(b).forEach(([skill, s]) => {
    const prev = out[skill] || { ok: 0, total: 0 };
    out[skill] = { ok: prev.ok + s.ok, total: prev.total + s.total };
  });
  return out;
}

/** Статус задания для конкретного ученика */
export function statusOf(assignment, submission, now = Date.now()) {
  if (submission?.attempts > 0) {
    return submission.late ? STATUS.LATE : STATUS.DONE;
  }
  if (now > assignment.dueAt) return STATUS.LATE;
  return STATUS.NEW;
}

/** Остались ли попытки */
export function attemptsLeft(assignment, submission) {
  const used = submission?.attempts || 0;
  return Math.max(0, (assignment.attempts || 1) - used);
}

/**
 * Задания для ученика: его класс + уже выданные (дата выдачи наступила).
 */
export async function studentAssignments({ studentId, classId, grade }) {
  const list = await allAssignments();
  const subs = await allSubmissions();
  const now = Date.now();

  return list
    .filter((a) => a.assignedAt <= now)
    .filter((a) => !a.classId || !classId || a.classId === classId || (!classId && Number(a.grade) === Number(grade)))
    .map((a) => {
      const submission = subs.find((s) => s.assignmentId === a.id && s.studentId === studentId) || null;
      return {
        assignment: a,
        submission,
        status: statusOf(a, submission, now),
        attemptsLeft: attemptsLeft(a, submission),
        percent: submission?.best ?? 0
      };
    })
    .sort((x, y) => x.assignment.dueAt - y.assignment.dueAt);
}

// ─── Аналитика для учителя ────────────────────────────────────────────────────

/**
 * Сводка по заданию: кто выполнил, средний результат, частые ошибки.
 * Возвращает и список навыков, которые стоит повторить.
 */
export async function assignmentStats(assignmentId, classSize = 0) {
  const assignment = await getAssignment(assignmentId);
  const subs = (await allSubmissions()).filter((s) => s.assignmentId === assignmentId);

  const done = subs.filter((s) => s.attempts > 0);
  const avg = done.length
    ? Math.round(done.reduce((sum, s) => sum + s.best, 0) / done.length)
    : 0;

  // Ошибки по навыкам — суммируем по всем ученикам
  const bySkill = {};
  done.forEach((s) => {
    Object.entries(s.skillStats || {}).forEach(([skill, st]) => {
      const acc = bySkill[skill] || (bySkill[skill] = { ok: 0, total: 0, students: 0 });
      acc.ok += st.ok;
      acc.total += st.total;
      if (st.total > 0 && st.ok / st.total < 0.7) acc.students += 1;
    });
  });

  const weakSkills = Object.entries(bySkill)
    .map(([skill, st]) => ({
      skill,
      percent: st.total ? Math.round((st.ok / st.total) * 100) : 0,
      students: st.students,
      total: st.total
    }))
    .filter((x) => x.percent < 70)
    .sort((a, b) => a.percent - b.percent);

  const total = classSize || done.length;

  return {
    assignment,
    submissions: done,
    assigned: total,
    completed: done.length,
    notCompleted: Math.max(0, total - done.length),
    average: avg,
    late: done.filter((s) => s.late).length,
    bySkill,
    weakSkills,
    topMistake: weakSkills[0] || null
  };
}

/** Вопросы, в которых ошибались чаще всего — для повторной игры */
export async function mistakeQuestionIds(assignmentId) {
  const subs = (await allSubmissions()).filter((s) => s.assignmentId === assignmentId);
  const counts = {};
  subs.forEach((s) => (s.mistakes || []).forEach((m) => {
    counts[m.questionId] = (counts[m.questionId] || 0) + 1;
  }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

export async function resetSubmissions(assignmentId) {
  const list = await allSubmissions();
  await store.set(SUBMISSIONS, list.filter((s) => s.assignmentId !== assignmentId));
}
