import { test } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); }, key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; }
};
const { topicJourney } = await import('../core/progress.js');

const T = 'math-6-fractions';
const base = () => ({ topics: {}, checks: {}, path: {}, qs: {} });

test('diagnostic → latest check gives the change; unseen questions are counted', () => {
  const d = base();
  d.path[T] = { diagAt: 1, diag: { add: { ok: 1, total: 4 }, compare: { ok: 1, total: 4 } } }; // 25 %
  d.checks[T] = [{ at: 5, correct: 4, total: 5 }, { at: 9, correct: 9, total: 10 }];        // 80 %, 90 %
  d.topics[T] = { answered: 30, correct: 24, lastAt: 7 };
  d.qs = { [`${T}::q1`]: {}, [`${T}::q2`]: {}, ['other::q3']: {} };
  const j = topicJourney(d, T, ['q1', 'q2', 'q3', 'q4']);
  assert.equal(j.baseline.source, 'diag');
  assert.equal(j.baseline.pct, 25);
  assert.equal(j.latest.pct, 90);
  assert.equal(j.delta, 65);
  assert.equal(j.unseen, 2);
  assert.equal(j.status, 'mastered');
  assert.equal(j.lastCheckAt, 9);
});

test('one check and no diagnostic: no change is invented', () => {
  const d = base();
  d.checks[T] = [{ at: 5, correct: 3, total: 5 }];
  const j = topicJourney(d, T, []);
  assert.equal(j.baseline.pct, 60);
  assert.equal(j.latest, null);
  assert.equal(j.delta, null);
});

test('practice only: no baseline, no latest, status from practice; short checks ignored', () => {
  const d = base();
  d.topics[T] = { answered: 3, correct: 3, lastAt: 2 };
  d.checks[T] = [{ at: 4, correct: 2, total: 2 }]; // короче CHECK_MIN
  const j = topicJourney(d, T, ['q1']);
  assert.equal(j.baseline, null);
  assert.equal(j.latest, null);
  assert.equal(j.status, 'insufficient');
  assert.equal(j.checks, 0);
});

test('a broken check list does not break the topic journey (audit 21.10)', async () => {
  const j = topicJourney({ topics: {}, checks: { 'math-6-fractions': {} }, path: {} }, 'math-6-fractions');
  assert.equal(j.checks, 0);
});
