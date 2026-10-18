import { test } from 'node:test';
import assert from 'node:assert/strict';

const { encodeSheet, decodeBits, homography, project, answerRows, MAX_ITEMS, testCode, versionCode, sheetSvg } = await import('../core/omr.js');

test('sheet code: round trip, a single flipped cell is rejected, a blank strip is never valid', () => {
  const bits = encodeSheet({ testId: 't_abc', variant: 2, questionIds: ['f01', 'f02'] });
  assert.equal(bits.length, 34);
  assert.deepEqual(decodeBits(bits), { test: testCode('t_abc'), variant: 2, version: versionCode(['f01', 'f02']) });
  let rejected = 0;
  for (let i = 1; i < 33; i++) {
    const b = bits.slice();
    b[i] ^= 1;
    if (!decodeBits(b)) rejected++;
  }
  assert.equal(rejected, 32, 'CRC catches every single-cell error');
  assert.equal(decodeBits(new Array(34).fill(0)), null);
  assert.equal(decodeBits(new Array(34).fill(1)), null);
});

test('homography maps the four corners exactly and keeps straight lines straight', () => {
  const src = [[0, 0], [170, 0], [170, 250], [0, 250]];
  const dst = [[120, 80], [930, 140], [1010, 1300], [60, 1220]];
  const H = homography(src, dst);
  src.forEach((p, i) => {
    const [x, y] = project(H, ...p);
    assert.ok(Math.abs(x - dst[i][0]) < 1e-6 && Math.abs(y - dst[i][1]) < 1e-6);
  });
  // Середина стороны лежит на отрезке между проекциями концов
  const [ax, ay] = project(H, 0, 0);
  const [bx, by] = project(H, 170, 0);
  const [mx, my] = project(H, 85, 0);
  const cross = (bx - ax) * (my - ay) - (by - ay) * (mx - ax);
  assert.ok(Math.abs(cross) < 1e-6);
});

test('layout: up to 72 rows in three columns, bubbles for choice, a box for written answers', () => {
  const items = Array.from({ length: 80 }, (_, i) => ({ n: i + 1, type: i % 5 === 0 ? 'input' : 'choice', options: i % 5 === 0 ? undefined : ['a', 'b', 'c', 'd'] }));
  const rows = answerRows(items);
  assert.equal(rows.length, MAX_ITEMS);
  assert.ok(rows[0].box && !rows[0].bubbles);
  assert.equal(rows[1].bubbles.length, 4);
  // Ничего не выходит за рамку 170 × 250 мм
  rows.forEach((r) => {
    (r.bubbles || []).forEach((b) => assert.ok(b.x + b.r < 170 && b.y + b.r < 250));
    if (r.box) assert.ok(r.box.x + r.box.w < 170 && r.box.y + r.box.h < 250);
  });
  const svg = sheetSvg({ testId: 't', questionIds: [], variant: 0, variantLabel: 'A', title: '<b>Тест</b>', items: items.slice(0, 3), labels: { name: 'N', number: '#', tens: '10', units: '1', howto: 'h', version: 'v' } });
  assert.ok(svg.includes('&lt;b&gt;Тест'), 'the title is escaped');
});
