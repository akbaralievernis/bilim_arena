import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };
const { encodeReport, decodeReport, fromTeacher } = await import('../core/parent-report.js');

const r = {
  name: 'Айбек Ташиев', settings: { threshold: 80 },
  topicRows: [{ topic: 'math-6-fractions', status: 'mastered', pct: 85, checkPct: 90, answered: 20 }],
  weak: [{ topic: 'math-6-fractions', skill: 'compare', pct: 40 }],
  lessonRows: [{ at: 2, topic: 'math-6-fractions', pct: 70 }], homeworkRows: [{ lastAt: 3, topic: 'math-6-fractions', best: 95 }]
};

test('report link: round trip keeps names in Kyrgyz and results', () => {
  const data = fromTeacher(r, { note: 'Жакшы! Ң Ө Ү', teacher: 'Мугалим' });
  const back = decodeReport(`#d=${encodeReport(data)}`);
  assert.equal(back.name, 'Айбек Ташиев');
  assert.equal(back.note, 'Жакшы! Ң Ө Ү');
  assert.equal(back.by, 'teacher');
  assert.deepEqual(back.topics, [{ t: 'math-6-fractions', s: 'mastered', p: 85, c: 90, n: 20 }]);
  assert.deepEqual(back.recent.map((x) => x.k), ['hw', 'lesson'], 'newest first');
  assert.ok(encodeReport(data).length < 1200, 'short enough for a messenger link');
  // Нет итоговой проверки — это «нет данных», а не 0 %
  const noCheck = decodeReport(`#d=${encodeReport({ ...data, topics: [{ t: 'math-6-fractions', s: 'learning', p: 62, c: null, n: 24 }] })}`);
  assert.equal(noCheck.topics[0].c, null);
  assert.equal(noCheck.topics[0].p, 62);
});

test('report link: unknown topics, bad values and huge text are dropped or cut', () => {
  const evil = encodeReport({
    name: '<img src=x onerror=alert(1)>'.repeat(5), note: 'x'.repeat(5000), by: 'admin',
    topics: [{ t: 'no-such-topic', s: 'mastered' }, { t: 'math-6-fractions', s: 'hacked', p: 999, n: -5 }],
    weak: [{ t: 'math-6-fractions', k: 'no-skill' }], recent: [{ t: 'x', k: 'lesson' }]
  });
  const back = decodeReport(`#d=${evil}`);
  assert.equal(back.name.length, 40);
  assert.equal(back.note.length, 600);
  assert.equal(back.by, 'self');
  assert.deepEqual(back.topics, [{ t: 'math-6-fractions', s: 'new', p: 100, c: null, n: 0 }]);
  assert.deepEqual(back.weak, []);
  assert.deepEqual(back.recent, []);
  assert.equal(decodeReport('#d=not-base64!!'), null);
  assert.equal(decodeReport(''), null);
});
