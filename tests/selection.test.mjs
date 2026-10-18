import { test } from 'node:test';
import assert from 'node:assert/strict';

const { schedule, isDue, pickPractice, pickCheck, reservedForCheck, seenIds, memKey, dueCount, unseenCount, TOP_BOX } = await import('../core/selection.js');
const { pairsToReview } = await import('../core/duplicates.js');

const DAY = 86400000;
const T = 'topic';
const pool = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}`, topic: T }));
const ids = (list) => list.map((q) => q.id);

test('spaced repetition: a mistake comes back tomorrow, correct answers push it further', () => {
  const now = Date.UTC(2026, 9, 18);
  let r = schedule(undefined, false, now);
  assert.deepEqual({ n: r.n, miss: r.miss, box: r.box }, { n: 1, miss: 1, box: 1 });
  assert.equal(r.due, now + DAY);
  assert.ok(!isDue(r, now + DAY - 1));
  assert.ok(isDue(r, now + DAY));
  r = schedule(r, true, now + DAY);
  assert.equal(r.box, 2);
  assert.equal(r.due, now + DAY + 3 * DAY);
  r = schedule(r, false, now + 5 * DAY);
  assert.equal(r.box, 1, 'a new mistake starts again from the first box');
  // Освоенный до последней коробки вопрос больше не напоминает о себе
  for (let i = 0; i < TOP_BOX; i++) r = schedule(r, true, now);
  assert.equal(r.box, TOP_BOX);
  assert.ok(!isDue(r, now + 365 * DAY));
  // Верно с первого раза — это не ошибка для повторения
  assert.ok(!isDue(schedule(undefined, true, now), now + 365 * DAY));
});

test('about a third of the bank is kept for final checks, the same on every device', () => {
  const share = pool.filter((q) => reservedForCheck(q.id)).length / pool.length;
  assert.ok(share > 0.15 && share < 0.5, `share ${share}`);
  assert.equal(reservedForCheck('q7'), reservedForCheck('q7'));
});

test('practice: due mistakes first, then new questions; check questions are kept back', () => {
  const now = Date.now();
  const mem = {};
  // q0…q2 — ошибки, которые пора повторить; q3 — ошибка, но ещё рано
  for (const id of ['q0', 'q1', 'q2']) mem[memKey(T, id)] = { ...schedule(undefined, false, now - 2 * DAY) };
  mem[memKey(T, 'q3')] = schedule(undefined, false, now);
  assert.equal(dueCount(pool, mem, T, now), 3);

  const { questions, review, fresh } = pickPractice(pool, mem, T, { count: 10, now });
  assert.equal(questions.length, 10);
  assert.equal(new Set(ids(questions)).size, 10, 'no repeats inside a round');
  assert.equal(review, 3);
  assert.ok(['q0', 'q1', 'q2'].every((id) => ids(questions).includes(id)));
  assert.ok(!ids(questions).includes('q3'), 'not due yet');
  assert.equal(fresh, 7);
  assert.ok(questions.filter((q) => !mem[memKey(T, q.id)]).every((q) => !reservedForCheck(q.id)), 'practice does not spend check questions');
});

test('practice repeats the oldest seen questions before touching the check reserve', () => {
  const now = Date.now();
  const mem = {};
  pool.filter((q) => !reservedForCheck(q.id)).forEach((q, i) => { mem[memKey(T, q.id)] = schedule(undefined, true, now - (100 - i) * 1000); });
  const { questions } = pickPractice(pool, mem, T, { count: 5, now });
  assert.ok(questions.every((q) => !reservedForCheck(q.id)));
  assert.equal(unseenCount(pool, mem, T), pool.filter((q) => reservedForCheck(q.id)).length);
});

test('final check: only unseen questions, honest about a shortage', () => {
  const mem = {};
  pool.slice(0, 27).forEach((q) => { mem[memKey(T, q.id)] = schedule(undefined, true); });
  const short = pickCheck(pool, mem, T, { count: 10 });
  assert.equal(short.available, 3);
  assert.equal(short.enough, false);
  assert.ok(short.questions.every((q) => !mem[memKey(T, q.id)]));

  const ok = pickCheck(pool, {}, T, { count: 10 });
  assert.equal(ok.questions.length, 10);
  assert.equal(ok.enough, true);
  assert.equal(new Set(ids(ok.questions)).size, 10);
  // Сначала — отложенные для проверки вопросы
  const reserved = pool.filter((q) => reservedForCheck(q.id)).length;
  assert.equal(ok.questions.filter((q) => reservedForCheck(q.id)).length, Math.min(10, reserved));
});

test('seenIds lists only this topic', () => {
  const mem = { [memKey(T, 'a')]: {}, [memKey('other', 'b')]: {}, [memKey(T, 'c')]: {} };
  assert.deepEqual(seenIds(mem, T).sort(), ['a', 'c']);
});

test('teacher review: only pairs with a teacher question, reviewed pairs are hidden', () => {
  const q = (id, ky, custom = false) => ({ id, topic: T, type: 'choice', prompt: { ky }, options: ['5', '6'], correct: 0, custom });
  const list = [q('b1', 'Канча болот 2 + 3?'), q('b2', 'Канча болот 2 + 3?'), q('m1', 'Канча болот 2 + 3?', true)];
  const pairs = pairsToReview(list);
  // b1 = b2 — пара только из банка, учителю её не показываем
  assert.deepEqual(pairs.map((p) => p.key).sort(), ['b1|m1', 'b2|m1']);
  const after = pairsToReview(list, new Set(pairs.map((p) => p.key)));
  assert.equal(after.length, 0);
});

const { pickDiagnostic, pickExamples, weakSkillsOf } = await import('../core/selection.js');
const { masteryStatus } = await import('../core/mastery.js');

test('mastery: "mastered" only after a final check, "not enough data" when answers are few', () => {
  const s = { threshold: 80, minAnswers: 8 };
  assert.equal(masteryStatus({}, s).status, 'new');
  assert.deepEqual(masteryStatus({ answered: 3, correct: 3 }, s), { status: 'insufficient', pct: 100, checkPct: null, need: 5 });
  assert.equal(masteryStatus({ answered: 20, correct: 19 }, s).status, 'ready', 'great practice is not mastery yet');
  assert.equal(masteryStatus({ answered: 20, correct: 10 }, s).status, 'learning');
  assert.equal(masteryStatus({ answered: 20, correct: 19, checks: [{ at: 1, correct: 6, total: 10 }] }, s).status, 'learning', 'a failed check wins over practice');
  assert.equal(masteryStatus({ answered: 2, correct: 1, checks: [{ at: 1, correct: 8, total: 10 }] }, s).status, 'mastered');
  assert.equal(masteryStatus({ answered: 2, correct: 1, checks: [{ at: 1, correct: 8, total: 10 }] }, { threshold: 90, minAnswers: 8 }).status, 'learning', 'the teacher threshold applies');
  // Слишком короткая «проверка» (меньше 5 вопросов) выводом не считается
  assert.equal(masteryStatus({ answered: 3, correct: 3, checks: [{ at: 1, correct: 3, total: 3 }] }, s).status, 'insufficient');
});

test('diagnostic: every skill covered, check reserve only as a last resort', () => {
  const skills = ['a', 'b', 'c'];
  const bank = Array.from({ length: 30 }, (_, i) => ({ id: `d${i}`, skill: skills[i % 3], difficulty: (i % 3) + 1 }));
  const set = pickDiagnostic(bank, {}, T, skills, { perSkill: 2, max: 8 });
  assert.ok(set.length >= 3 && set.length <= 6);
  assert.equal(new Set(ids(set)).size, set.length);
  skills.forEach((sk) => {
    assert.ok(set.some((q) => q.skill === sk), `skill ${sk} covered`);
    const hasFree = bank.some((q) => q.skill === sk && !reservedForCheck(q.id));
    if (hasFree) assert.ok(set.filter((q) => q.skill === sk).every((q) => !reservedForCheck(q.id)), `skill ${sk} keeps the reserve`);
  });
});

test('weak skills and worked examples: own mistakes first', () => {
  assert.deepEqual(weakSkillsOf({ a: { ok: 2, total: 2 }, b: { ok: 1, total: 2 }, c: { ok: 0, total: 0 } }), ['b']);
  const bank = [{ id: 'x1', skill: 'b' }, { id: 'x2', skill: 'b' }, { id: 'x3', skill: 'b' }, { id: 'y1', skill: 'a' }];
  const mem = { [memKey(T, 'x2')]: schedule(undefined, false) };
  const [group] = pickExamples(bank, mem, T, ['b'], ['x2'], { perSkill: 2 });
  assert.equal(group.questions[0].id, 'x2');
  assert.equal(group.questions.length, 2);
  assert.ok(group.questions.every((q) => q.skill === 'b'));
});

test('practice puts weak skills first among new questions', () => {
  const bank = Array.from({ length: 40 }, (_, i) => ({ id: `w${i}`, skill: i < 30 ? 'strong' : 'weak' }));
  const { questions } = pickPractice(bank, {}, T, { count: 5, focus: ['weak'] });
  const weakFree = bank.filter((q) => q.skill === 'weak' && !reservedForCheck(q.id)).length;
  assert.equal(questions.filter((q) => q.skill === 'weak').length, Math.min(5, weakFree));
});
