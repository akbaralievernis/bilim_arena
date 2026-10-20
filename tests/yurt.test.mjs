import { test } from 'node:test';
import assert from 'node:assert/strict';
const { topicBuilt, classYurts, yurtSvg, YURT_PARTS } = await import('../core/yurt.js');

const report = (id, topic, classId, { students, checked, reached, at = 1 }) => ({
  cycle: { id, topic, classId, to: at }, className: classId ? '6-А' : null,
  summary: { students, checked, reached, lastCheckAt: at }
});

test('a topic is built only from checks: 75 % of the whole class and at least 3 checked', () => {
  assert.equal(topicBuilt(report('a', 't', 'k', { students: 10, checked: 8, reached: 8 })).built, true);  // 8/10
  assert.equal(topicBuilt(report('a', 't', 'k', { students: 10, checked: 7, reached: 7 })).built, false); // 7/10: не сдавшие тоже в счёте
  assert.equal(topicBuilt(report('a', 't', null, { students: 2, checked: 2, reached: 2 })).built, false); // меньше 3 проверок
  assert.equal(topicBuilt(report('a', 't', null, { students: 4, checked: 4, reached: 3 })).built, true);  // без класса — по прошедшим
});

test('parts follow the real building order; after eight topics a new yurt starts', () => {
  const reps = Array.from({ length: 10 }, (_, i) => report(`c${i}`, `t${i}`, 'k', { students: 4, checked: 4, reached: 4, at: 100 - i }));
  reps.push(report('x', 'tx', 'k', { students: 4, checked: 4, reached: 1 }));
  const [g] = classYurts(reps);
  assert.equal(g.count, 10);
  assert.equal(g.fullYurts, 1);
  assert.equal(g.inCurrent, 2);
  assert.equal(g.next.id, 'uuk');
  assert.equal(g.built[0].topic, 't9'); // самая ранняя проверка — кереге
  assert.equal(g.built[0].part, 'kerege');
  assert.deepEqual(g.pending.map((p) => p.topic), ['tx']);
});

test('the drawing marks built parts and plans the rest', () => {
  const html = yurtSvg(3, '6-А "класс"');
  assert.equal((html.match(/yp-done/g) || []).length, 3);
  assert.equal((html.match(/yp-todo/g) || []).length, YURT_PARTS.length - 3);
  assert.ok(html.includes('6-А &quot;класс&quot;'));
});
