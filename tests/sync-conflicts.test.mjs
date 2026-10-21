// Конфликтные сценарии синхронизации (аудит 21.10.2026, группа F).
// Каждый тест падал на коде до исправления.
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

// Две вкладки = два экземпляра модуля прогресса с общим localStorage
const tab1 = await import('../core/progress.js?tab=1');
const tab2 = await import('../core/progress.js?tab=2');
const { mergeSubmissions } = await import('../core/sync.js');
const { allSubmissions } = await import('../core/assignments.js');
const { store } = await import('../core/store.js');

test('two tabs: an answer in one tab is not wiped by the other tab', async () => {
  tab1.invalidateProgress(); tab2.invalidateProgress();
  await tab1.getProgress(); await tab2.getProgress(); // обе вкладки открыты и прочитали прогресс
  await tab1.recordAnswer({ topic: 'A', skill: 's', correct: true, questionId: 'q1', gameId: 'practice' });
  await tab1.recordAnswer({ topic: 'A', skill: 's', correct: true, questionId: 'q2', gameId: 'practice' });
  await tab2.recordAnswer({ topic: 'B', skill: 's', correct: true, questionId: 'q3', gameId: 'practice' });
  const stored = await store.get('progress');
  assert.deepEqual(Object.keys(stored.topics).sort(), ['A', 'B']);
  assert.equal(stored.topics.A.answered, 2);
});

const sub = (attempts, lastAt, best, history) => ({ assignmentId: 'a1', studentId: 's1', studentName: 'Айбек', attempts, best, lastAt, history });

test('merge: attempts from two devices are all kept', async () => {
  await store.set('submissions', [sub(1, 1000, 60, [{ at: 1000, percent: 60 }])]);
  await mergeSubmissions([sub(1, 2000, 80, [{ at: 2000, percent: 80 }])]);
  const [s] = await allSubmissions();
  assert.deepEqual(s.history.map((h) => h.at), [1000, 2000]);
  assert.equal(s.attempts, 2);
  assert.equal(s.best, 80);
});

test('merge: an attempt made on a phone with a slow clock is still accepted', async () => {
  await store.set('submissions', [sub(2, 5000, 90, [{ at: 4000, percent: 70 }, { at: 5000, percent: 90 }])]);
  // Телефон: те же две попытки и третья, но часы отстают — lastAt меньше
  await mergeSubmissions([sub(3, 4500, 100, [{ at: 4000, percent: 70 }, { at: 5000, percent: 90 }, { at: 4500, percent: 100 }])]);
  const [s] = await allSubmissions();
  assert.equal(s.attempts, 3);
  assert.equal(s.best, 100);
  assert.equal(s.history.length, 3);
});

test('merge: the same packet twice is not counted twice, an old packet changes nothing', async () => {
  const packet = sub(2, 2000, 80, [{ at: 1000, percent: 60 }, { at: 2000, percent: 80 }]);
  await mergeSubmissions([packet]);
  assert.equal(await mergeSubmissions([packet]), 0);
  assert.equal(await mergeSubmissions([sub(1, 1000, 60, [{ at: 1000, percent: 60 }])]), 0);
  const [s] = await allSubmissions();
  assert.equal(s.attempts, 2);
  assert.equal(s.history.length, 2);
  assert.equal(s.best, 80);
});
