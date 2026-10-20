import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; }
};

const { buildCycleReport, cleanCycle, saveCycle, allCycles, deleteCycle, cycleReport } = await import('../core/cycles.js');
const { recordStage } = await import('../core/lessons.js');
const { store, KEYS } = await import('../core/store.js');

beforeEach(() => mem.clear());

const T = 'math-6-fractions';
const DAY = 86400000;
const START = new Date(2026, 9, 1).getTime();
const cycle = { id: 'c1', topic: T, from: START, to: START + 30 * DAY - 1, threshold: 80, classId: null };

/** Урок с ответами: rows = [[имя, навык, верно, тема?]] */
const lesson = (at, mode, rows) => {
  const students = {};
  rows.forEach(([name, skill, ok, topic = T, qid]) => {
    const st = students[name] || (students[name] = { name, answered: 0, correct: 0, bySkill: {}, wrong: [] });
    const k = `${topic}::${skill}`;
    const s = st.bySkill[k] || (st.bySkill[k] = { ok: 0, total: 0 });
    s.total += 1; st.answered += 1;
    if (ok) { s.ok += 1; st.correct += 1; } else if (qid) st.wrong.push(qid);
  });
  return { v: 2, id: `l${at}`, at, mode, topic: T, students };
};
const answers = (name, skill, ok, bad, topic = T) => [
  ...Array.from({ length: ok }, () => [name, skill, true, topic]),
  ...Array.from({ length: bad }, (_, i) => [name, skill, false, topic, `${skill}-q${i}`])
];

test('first and last check give the change in points; practice does not change the status', () => {
  const r = buildCycleReport(cycle, {
    lessons: [
      lesson(START + DAY, 'paper-check', [...answers('Айбек', 'add', 2, 3), ...answers('Айбек', 'compare', 1, 2)]),   // 3/8
      lesson(START + 5 * DAY, 'lesson', answers('Айбек', 'add', 20, 0)),                                                  // тренировка
      lesson(START + 20 * DAY, 'paper-check', [...answers('Айбек', 'add', 4, 0), ...answers('Айбек', 'compare', 3, 1)]) // 7/8
    ]
  });
  const [a] = r.rows;
  assert.equal(a.checks, 2);
  assert.equal(a.first.pct, 38);
  assert.equal(a.last.pct, 88);
  assert.equal(a.delta, 50);
  assert.equal(a.practice, 20);
  assert.equal(a.status, 'reached');
  assert.equal(a.skills.add.state, 'mastered');
  assert.equal(a.skills.compare.state, 'gap'); // 3/4 = 75 % < 80 %
  assert.deepEqual(r.gaps, ['compare']);
  assert.equal(r.summary.deltaAvg, 50);
});

test('practice alone is never "reached"; one check gives no change; short checks are not counted', () => {
  const r = buildCycleReport(cycle, {
    lessons: [
      lesson(START + DAY, 'lesson', answers('Нурай', 'add', 30, 0)),
      lesson(START + 2 * DAY, 'paper-check', answers('Азат', 'add', 5, 0)),
      lesson(START + 3 * DAY, 'paper-check', answers('Бакыт', 'add', 3, 0)) // 3 < CHECK_MIN
    ]
  });
  const by = Object.fromEntries(r.rows.map((x) => [x.name, x]));
  assert.equal(by['Нурай'].status, 'no_check');
  assert.equal(by['Азат'].status, 'reached');
  assert.equal(by['Азат'].delta, null);
  assert.equal(by['Бакыт'].status, 'no_check');
  assert.equal(by['Бакыт'].shortChecks, 1);
  assert.equal(r.summary.paired, 0);
  assert.equal(r.summary.deltaAvg, null); // не выдумываем среднее изменение
});

test('only the cycle topic and period count; other topics in a mixed test are ignored', () => {
  const r = buildCycleReport(cycle, {
    lessons: [
      lesson(START - DAY, 'paper-check', answers('Айбек', 'add', 0, 6)),           // до цикла
      lesson(START + 40 * DAY, 'paper-check', answers('Айбек', 'add', 6, 0)),      // после
      lesson(START + 2 * DAY, 'paper-check', [...answers('Айбек', 'add', 5, 1), ...answers('Айбек', 'x', 0, 9, 'geo-7-maps')])
    ]
  });
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].checks, 1);
  assert.equal(r.rows[0].first.total, 6);
  assert.equal(r.rows[0].first.pct, 83);
});

test('a class roster limits students and lists those without any check', () => {
  const r = buildCycleReport({ ...cycle, classId: 'k6' }, {
    classes: [{ id: 'k6', name: '6-А', students: ['Айбек', 'Нурай'] }],
    lessons: [lesson(START + DAY, 'paper-check', [...answers('айбек ', 'add', 5, 0), ...answers('Чужой', 'add', 5, 0)])]
  });
  assert.deepEqual(r.rows.map((x) => [x.name, x.status]), [['Айбек', 'reached'], ['Нурай', 'no_check']]);
  assert.equal(r.className, '6-А');
  assert.equal(r.summary.noCheck, 1);
});

test('homework in check mode counts as a check with skills; ordinary homework is practice', () => {
  const r = buildCycleReport(cycle, {
    assignments: [{ id: 'h1', topic: T, check: true }, { id: 'h2', topic: T }],
    submissions: [
      { assignmentId: 'h1', studentName: 'Нурай', history: [
        { at: START + DAY, correct: 2, total: 6, bySkill: { add: { ok: 2, total: 6 } } },
        { at: START + 9 * DAY, correct: 6, total: 6, bySkill: { add: { ok: 6, total: 6 } } }] },
      { assignmentId: 'h2', studentName: 'Нурай', history: [{ at: START + 3 * DAY, correct: 9, total: 10 }] }
    ]
  });
  const [n] = r.rows;
  assert.equal(n.checks, 2);
  assert.equal(n.delta, 100 - 33);
  assert.equal(n.practice, 10);
  assert.equal(r.skills[0].firstPct, 33);
  assert.equal(r.skills[0].lastPct, 100);
});

test('cycle fields are validated and stored; works end-to-end with the lesson journal', async () => {
  assert.throws(() => cleanCycle({ topic: T, from: START, to: START - 2 * DAY }), /dates/);
  assert.throws(() => cleanCycle({ from: START, to: START }), /topic/);
  const c = cleanCycle({ topic: T, from: START, to: START, threshold: 500, title: '  a   b ', goal: 'x'.repeat(999) });
  assert.equal(c.threshold, 100);
  assert.equal(c.title, 'a b');
  assert.equal(c.goal.length, 300);

  const saved = await saveCycle({ topic: T, subject: 'math', from: Date.now() - DAY, to: Date.now() + DAY, threshold: 70 });
  await recordStage({ subject: 'math', topic: T, mode: 'paper-check', gameId: 'paper',
    log: Array.from({ length: 5 }, (_, i) => ({ playerId: 'p', playerName: 'Айбек', topic: T, skill: 'add', correct: i < 4, questionId: `q${i}` })),
    players: [{ id: 'p', name: 'Айбек', score: 4 }] });
  const rep = await cycleReport(saved.id);
  assert.equal(rep.rows[0].last.pct, 80);
  assert.equal(rep.rows[0].status, 'reached');
  assert.deepEqual(rep.frequentWrong, [{ id: 'q4', n: 1 }]);
  await deleteCycle(saved.id);
  assert.equal((await allCycles()).length, 0);
  assert.ok(KEYS && store);
});
