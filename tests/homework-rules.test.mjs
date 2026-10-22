// Правила домашних заданий (аудит 21.10, P2).
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
beforeEach(() => mem.clear());

const { saveAssignment, saveSubmission } = await import('../core/assignments.js');

test('a homework "check" shorter than 5 questions is refused (mastery would ignore it silently)', async () => {
  await assert.rejects(saveAssignment({ title: 'x', topic: 'math-6-fractions', check: true, count: 3 }), /check_too_short/);
  await assert.rejects(saveAssignment({ title: 'x', topic: 'math-6-fractions', check: true, questionIds: ['f01', 'f02'], count: 2 }), /check_too_short/);
  const ok = await saveAssignment({ title: 'x', topic: 'math-6-fractions', check: true, count: 5 });
  assert.equal(ok.check, true);
  const practice = await saveAssignment({ title: 'y', topic: 'math-6-fractions', check: false, count: 3 });
  assert.equal(practice.count, 3, 'a practice homework may be short');
});

test('an on-time submission stays on time after a retry past the deadline', async () => {
  const a = await saveAssignment({ title: 'x', topic: 'math-6-fractions', count: 5, dueAt: Date.now() + 60_000 });
  const first = await saveSubmission({ assignmentId: a.id, studentId: 's', studentName: 'Айбек', correct: 3, total: 5 });
  assert.equal(first.late, false);
  // срок прошёл, ученик пересдаёт
  const list = JSON.parse(mem.get('BA2_assignments'));
  list[0].dueAt = Date.now() - 1000;
  mem.set('BA2_assignments', JSON.stringify(list));
  const retry = await saveSubmission({ assignmentId: a.id, studentId: 's', studentName: 'Айбек', correct: 5, total: 5 });
  assert.equal(retry.late, false, 'the work was handed in on time');
  // а первая сдача после срока — опоздание
  const b = await saveAssignment({ title: 'z', topic: 'math-6-fractions', count: 5, dueAt: Date.now() - 1000 });
  assert.equal((await saveSubmission({ assignmentId: b.id, studentId: 's', studentName: 'Айбек', correct: 1, total: 5 })).late, true);
});
