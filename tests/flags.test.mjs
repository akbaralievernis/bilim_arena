// Вопрос, где учитель нашёл ошибку, не доходит до учеников (аудит 21.10, P2).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; }
};

const { setReview } = await import('../core/review.js');
const { packAssignments, mergeAssignments } = await import('../core/sync.js');
const { saveAssignment } = await import('../core/assignments.js');
const { getQuestions, getQuestionsByRefs } = await import('../core/curriculum.js');

test('a flagged question travels with the assignments and is skipped on the student device', async () => {
  // Учитель: отметил f01 как ошибочный и задал домашку с этим вопросом
  await setReview('math-6-fractions', 'f01', 'issue', 'неверный ответ');
  await saveAssignment({ title: 'ДЗ', topic: 'math-6-fractions', count: 5, questionIds: ['f01', 'f02', 'f03', 'f04', 'f05', 'f06'],
    assignedAt: Date.now() - 1000, dueAt: Date.now() + 86400000 });
  const pack = await packAssignments();
  assert.ok(pack.flags.includes('math-6-fractions::f01'));

  // Ученик: другое устройство — своих отметок нет
  mem.clear();
  await mergeAssignments(pack);
  const practice = await getQuestions({ topic: 'math-6-fractions', count: 50 });
  assert.ok(!practice.some((q) => q.id === 'f01'), 'practice skips it');
  const hw = await getQuestionsByRefs(['f01', 'f02'], 'math-6-fractions', { skipFlagged: true });
  assert.deepEqual(hw.map((q) => q.id), ['f02'], 'hand-picked homework skips it');
  // Печатный тест учителя не меняется молча (иначе сдвинулись бы ключи бланков)
  assert.deepEqual((await getQuestionsByRefs(['f01', 'f02'], 'math-6-fractions')).map((q) => q.id), ['f01', 'f02']);
});
