import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// localStorage в памяти — store.js работает так же, как в браузере
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; }
};

const { recordStage, lessonHistory, studentSummaries, studentReport, deleteLesson, studentKey } = await import('../core/lessons.js');
const { store, KEYS } = await import('../core/store.js');

beforeEach(() => mem.clear());

const log = (rows) => rows.map(([playerId, playerName, skill, correct, questionId]) => ({ playerId, playerName, skill, correct, questionId }));

test('one lesson keeps every stage and every student', async () => {
  const id = await recordStage({
    subject: 'math', topic: 'math-6-fractions', mode: 'lesson', gameId: 'quickvote',
    log: log([['p1', 'Айбек', 'compare', true, 'q1'], ['p1', 'Айбек', 'add', false, 'q2'], ['p2', 'Нурай', 'compare', true, 'q1']]),
    players: [{ id: 'p1', name: 'Айбек', score: 100 }, { id: 'p2', name: 'Нурай', score: 150 }]
  });
  const same = await recordStage({
    lessonId: id, subject: 'math', topic: 'math-6-fractions', gameId: 'territory',
    log: log([['p1', ' айбек ', 'add', true, 'q3']]), players: [{ id: 'p1', name: ' айбек ', score: 50 }]
  });
  assert.equal(same, id);
  const [lesson] = await lessonHistory();
  assert.equal(lesson.stages.length, 2);
  assert.equal(lesson.answered, 4);
  assert.equal(lesson.correct, 3);
  assert.deepEqual(Object.keys(lesson.students).sort(), ['айбек', 'нурай']);
  assert.equal(lesson.students['айбек'].answered, 3);
  assert.equal(lesson.students['айбек'].score, 150);
  assert.deepEqual(lesson.students['айбек'].wrong, ['q2']);
});

test('old journal entries without results are ignored, empty stages are not saved', async () => {
  await store.set(KEYS.lessons, [{ at: 1, subject: 'math', topic: 'x', duration: 30 }]);
  assert.equal((await lessonHistory()).length, 0);
  assert.equal(await recordStage({ topic: 'x', log: [] }), null);
  assert.equal((await lessonHistory()).length, 0);
});

test('student report joins board lessons and homework, finds weak skills', async () => {
  for (let i = 0; i < 2; i++) {
    await recordStage({
      subject: 'math', topic: 'math-6-fractions', gameId: 'quickvote',
      log: log([['p1', 'Айбек', 'add', false, 'q2'], ['p1', 'Айбек', 'add', false, 'q4'], ['p1', 'Айбек', 'compare', true, 'q1']]),
      players: [{ id: 'p1', name: 'Айбек', score: 10 }]
    });
  }
  await store.set(KEYS.assignments, [{ id: 'a1', title: 'Бөлчөктөр', topic: 'math-6-fractions' }]);
  await store.set('submissions', [{ assignmentId: 'a1', studentId: 's1', studentName: 'АЙБЕК', best: 80, attempts: 2, lastAt: 5, skillStats: { compare: { ok: 4, total: 5 } } }]);

  const [summary] = await studentSummaries();
  assert.equal(summary.key, studentKey('Айбек'));
  assert.equal(summary.lessons, 2);
  assert.equal(summary.homework, 1);
  assert.equal(summary.homeworkPct, 80);
  assert.equal(summary.weak[0].skill, 'add');

  const report = await studentReport('айбек');
  assert.equal(report.lessonRows.length, 2);
  assert.equal(report.homeworkRows[0].title, 'Бөлчөктөр');
  assert.equal(report.weak.find((w) => w.skill === 'compare'), undefined);
});

test('deleting a lesson removes it from history and reports', async () => {
  const id = await recordStage({ topic: 't', log: log([['p1', 'A', 's', true, 'q']]), players: [] });
  await deleteLesson(id);
  assert.equal((await lessonHistory()).length, 0);
  assert.equal((await studentSummaries()).length, 0);
});

test('cloud merge keeps one copy of a lesson — the freshest one', async () => {
  const { mergeLog } = await import('../core/merge.js');
  const old = { id: 'l1', at: 1, endedAt: 2, stages: [1] };
  const fresh = { id: 'l1', at: 1, endedAt: 9, stages: [1, 2] };
  const other = { id: 'l2', at: 5, endedAt: 6 };
  const merged = mergeLog([fresh], [old, other]);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged.find((x) => x.id === 'l1').stages, [1, 2]);
  // Записи без id (журнал ошибок) объединяются как раньше — по содержимому
  assert.equal(mergeLog([{ at: 1, skill: 'a' }], [{ at: 1, skill: 'a' }, { at: 2, skill: 'b' }]).length, 2);
});
