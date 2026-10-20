/**
 * Bilim Arena — учебный цикл по теме: диагностика → обучение → итоговая проверка.
 *
 * Учитель задаёт тему, класс (необязательно), срок, цель и порог. Отчёт цикла
 * строится только из подтверждённых проверок за этот срок:
 *   • бумажная проверка (урок «paper-check» — ввод ответов или сканер);
 *   • домашнее задание в режиме «Проверка».
 * Первая проверка ученика в сроке — исходный результат, последняя — текущий.
 * Тренировки и игры считаются отдельно (сколько ответов дано), но на статус
 * не влияют: по количеству игр нельзя сказать, что тема освоена.
 *
 * Изменение в процентных пунктах показывается только при двух и более
 * проверках. Тесты могут быть разной сложности — это не доказательство,
 * что изменение вызвано обучением; отчёт пишет об этом прямо.
 */

import { store, KEYS } from './store.js';
import { allAssignments, allSubmissions } from './assignments.js';
import { studentKey, splitSkillKey } from './lessons.js';
import { masterySettings } from './mastery.js';
import { CHECK_MIN } from './selection.js';

export const CYCLES_KEY = 'cycles';
const SKILL_MIN = 2;         // меньше ответов по навыку в проверке — «мало данных»
const LIMITS = { title: 80, goal: 300 };

const newId = () => `cy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
const pct = (ok, total) => (total ? Math.round((ok / total) * 100) : null);
const dayStart = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dayEnd = (ms) => { const d = new Date(ms); d.setHours(23, 59, 59, 999); return d.getTime(); };
const text = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// ─── Хранение ─────────────────────────────────────────────────────────────────

export async function allCycles() {
  const list = await store.get(CYCLES_KEY, []);
  return Array.isArray(list) ? list.filter((c) => c && c.id && c.topic) : [];
}

export async function getCycle(id) {
  return (await allCycles()).find((c) => c.id === id) || null;
}

/** Проверка и очистка полей цикла. Ошибка — код для перевода (cy_err_*) */
export function cleanCycle(data, settings = { threshold: 80 }) {
  const from = Number(data.from);
  const to = Number(data.to);
  if (!data.topic) throw new Error('topic');
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error('dates');
  if (dayEnd(to) < dayStart(from)) throw new Error('dates');
  const threshold = Math.round(Number(data.threshold));
  return {
    subject: data.subject || null,
    topic: String(data.topic),
    classId: data.classId || null,
    title: text(data.title, LIMITS.title),
    goal: text(data.goal, LIMITS.goal),
    from: dayStart(from),
    to: dayEnd(to),
    threshold: Number.isFinite(threshold) ? Math.min(100, Math.max(50, threshold)) : settings.threshold
  };
}

export async function saveCycle(data) {
  const list = await allCycles();
  const clean = cleanCycle(data, await masterySettings());
  const now = Date.now();
  const i = data.id ? list.findIndex((c) => c.id === data.id) : -1;
  const cycle = i >= 0
    ? { ...list[i], ...clean, updatedAt: now }
    : { ...clean, id: newId(), createdAt: now, updatedAt: now };
  if (i >= 0) list[i] = cycle; else list.push(cycle);
  if (!(await store.set(CYCLES_KEY, list))) throw new Error('storage');
  return cycle;
}

export async function deleteCycle(id) {
  await store.set(CYCLES_KEY, (await allCycles()).filter((c) => c.id !== id));
}

// ─── Отчёт ────────────────────────────────────────────────────────────────────

const addTo = (map, key, ok, total) => {
  const s = map[key] || (map[key] = { ok: 0, total: 0 });
  s.ok += ok; s.total += total;
};

/** Ответы ученика по одной теме из bySkill вида «тема::навык» */
function topicPart(bySkill, topic) {
  const skills = {};
  let ok = 0;
  let total = 0;
  Object.entries(bySkill || {}).forEach(([k, v]) => {
    const { topic: tp, skill } = splitSkillKey(k);
    if (tp !== topic) return;
    const o = Number(v.ok) || 0;
    const n = Number(v.total) || 0;
    ok += o; total += n;
    addTo(skills, skill || '', o, n);
  });
  return { ok, total, skills };
}

/**
 * Чистая функция отчёта — данные передаются явно (удобно для тестов).
 * @param {object} cycle
 * @param {{ lessons:Array, assignments:Array, submissions:Array, classes?:Array }} data
 */
export function buildCycleReport(cycle, { lessons = [], assignments = [], submissions = [], classes = [] }) {
  const { topic, from, to, threshold } = cycle;
  const inRange = (at) => Number(at) >= from && Number(at) <= to;
  const cls = cycle.classId ? classes.find((c) => c.id === cycle.classId) : null;
  const roster = cls ? new Map((cls.students || []).map((n) => [studentKey(n), String(n)])) : null;

  const students = new Map();
  const get = (name) => {
    const key = studentKey(name);
    if (!key || key === '?') return null;
    if (roster && !roster.has(key)) return null; // ученик другого класса
    if (!students.has(key)) {
      students.set(key, { key, name: roster?.get(key) || String(name).trim(), checks: [], shortChecks: 0, practice: 0, attempts: 0, wrong: new Map() });
    }
    return students.get(key);
  };
  roster?.forEach((name) => get(name));

  // Бумажные проверки и уроки на доске
  lessons.filter((l) => l && l.v === 2 && inRange(l.at)).forEach((l) => {
    Object.values(l.students || {}).forEach((st) => {
      const part = topicPart(st.bySkill, topic);
      if (!part.total) return;
      const s = get(st.name);
      if (!s) return;
      if (l.mode === 'paper-check') {
        if (part.total < CHECK_MIN) { s.shortChecks += 1; return; }
        s.checks.push({ at: l.at, ok: part.ok, total: part.total, skills: part.skills, source: 'paper' });
        (st.wrong || []).forEach((id) => s.wrong.set(id, (s.wrong.get(id) || 0) + 1));
      } else {
        s.practice += part.total;
        s.attempts += 1;
      }
    });
  });

  // Домашние задания: «Проверка» — подтверждённая проверка, остальное — тренировка
  const byId = new Map(assignments.map((a) => [a.id, a]));
  submissions.forEach((sub) => {
    const a = byId.get(sub.assignmentId);
    if (!a) return;
    const multi = Object.keys(sub.skillStats || {}).some((k) => k.includes('::'));
    (sub.history || []).filter((h) => inRange(h.at)).forEach((h) => {
      let part;
      if (h.bySkill) {
        part = topicPart(Object.fromEntries(Object.entries(h.bySkill).map(([k, v]) => [k.includes('::') ? k : `${a.topic}::${k}`, v])), topic);
      } else if (a.topic === topic && !multi) {
        part = { ok: Number(h.correct) || 0, total: Number(h.total) || 0, skills: {} }; // старые попытки — без навыков
      } else return;
      if (!part.total) return;
      const s = get(sub.studentName);
      if (!s) return;
      if (a.check) {
        if (part.total < CHECK_MIN) { s.shortChecks += 1; return; }
        s.checks.push({ at: h.at, ok: part.ok, total: part.total, skills: part.skills, source: 'homework' });
      } else {
        s.practice += part.total;
        s.attempts += 1;
      }
    });
  });

  // Ученик: первая и последняя проверка, навыки по последней
  const rows = [...students.values()].map((s) => {
    s.checks.sort((x, y) => x.at - y.at);
    const first = s.checks[0] || null;
    const last = s.checks.length > 1 ? s.checks[s.checks.length - 1] : first;
    const firstPct = first ? pct(first.ok, first.total) : null;
    const lastPct = last ? pct(last.ok, last.total) : null;
    const skills = {};
    if (last) {
      Object.entries(last.skills).forEach(([skill, v]) => {
        const p = v.total >= SKILL_MIN ? pct(v.ok, v.total) : null;
        skills[skill] = { ok: v.ok, total: v.total, pct: p, state: p === null ? 'insufficient' : p >= threshold ? 'mastered' : 'gap' };
      });
    }
    return {
      key: s.key,
      name: s.name,
      checks: s.checks.length,
      shortChecks: s.shortChecks,
      practice: s.practice,
      attempts: s.attempts,
      first: first && { at: first.at, pct: firstPct, ok: first.ok, total: first.total },
      last: last && { at: last.at, pct: lastPct, ok: last.ok, total: last.total },
      delta: s.checks.length > 1 ? lastPct - firstPct : null,
      status: !last ? 'no_check' : lastPct >= threshold ? 'reached' : 'not_yet',
      skills,
      wrong: [...s.wrong.entries()].map(([id, n]) => ({ id, n }))
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Класс: навыки — первая проверка против последней; среднее — только по тем, у кого есть обе
  const skillFirst = {};
  const skillLast = {};
  rows.forEach((r) => {
    const s = students.get(r.key);
    if (!s.checks.length) return;
    Object.entries(s.checks[0].skills).forEach(([k, v]) => addTo(skillFirst, k, v.ok, v.total));
    Object.entries(s.checks[s.checks.length - 1].skills).forEach(([k, v]) => addTo(skillLast, k, v.ok, v.total));
  });
  const skillRows = [...new Set([...Object.keys(skillFirst), ...Object.keys(skillLast)])]
    .filter(Boolean)
    .map((skill) => {
      const f = skillFirst[skill];
      const l = skillLast[skill];
      const lastPct = l && l.total >= SKILL_MIN ? pct(l.ok, l.total) : null;
      const below = rows.filter((r) => r.skills[skill]?.state === 'gap').length;
      return {
        skill,
        firstPct: f && f.total >= SKILL_MIN ? pct(f.ok, f.total) : null,
        lastPct,
        lastTotal: l?.total || 0,
        below,
        state: lastPct === null ? 'insufficient' : lastPct >= threshold ? 'mastered' : 'gap'
      };
    })
    .sort((a, b) => (a.lastPct ?? 101) - (b.lastPct ?? 101));

  const paired = rows.filter((r) => r.delta !== null);
  const avg = (list, f) => (list.length ? Math.round(list.reduce((sum, r) => sum + f(r), 0) / list.length) : null);
  const wrongAll = new Map();
  rows.forEach((r) => r.wrong.forEach(({ id, n }) => wrongAll.set(id, (wrongAll.get(id) || 0) + n)));

  const checked = rows.filter((r) => r.checks);
  return {
    cycle,
    className: cls?.name || null,
    rows,
    skills: skillRows,
    gaps: skillRows.filter((s) => s.state === 'gap').map((s) => s.skill),
    frequentWrong: [...wrongAll.entries()].map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n).slice(0, 8),
    summary: {
      students: rows.length,
      checked: checked.length,
      noCheck: rows.filter((r) => !r.checks).length,
      oneCheck: rows.filter((r) => r.checks === 1).length,
      paired: paired.length,
      reached: rows.filter((r) => r.status === 'reached').length,
      firstAvg: avg(paired, (r) => r.first.pct),
      lastAvg: avg(paired, (r) => r.last.pct),
      deltaAvg: avg(paired, (r) => r.delta),
      shortChecks: rows.reduce((sum, r) => sum + r.shortChecks, 0),
      lastCheckAt: checked.length ? Math.max(...checked.map((r) => r.last.at)) : null
    },
    checkMin: CHECK_MIN,
    skillMin: SKILL_MIN
  };
}

/** Отчёт цикла из данных этого устройства */
export async function cycleReport(cycleOrId) {
  const cycle = typeof cycleOrId === 'string' ? await getCycle(cycleOrId) : cycleOrId;
  if (!cycle) return null;
  const lessons = await store.get(KEYS.lessons, []);
  return buildCycleReport(cycle, {
    lessons: Array.isArray(lessons) ? lessons : [],
    assignments: await allAssignments(),
    submissions: await allSubmissions(),
    classes: await store.get(KEYS.classes, [])
  });
}
