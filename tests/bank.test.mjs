import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 };

const { TOPICS, loadBank } = await import('../core/curriculum.js');
const { findDuplicates, normalize } = await import('../core/duplicates.js');

const banks = [];
for (const t of TOPICS) if (t.bank) banks.push({ topic: t, questions: await loadBank(t.id) });
const all = banks.flatMap((b) => b.questions);

// Похожие, но разные вопросы — проверены человеком (пары id через «|»)
const REVIEWED = new Set(['f02|f04']);

test('every question is well formed in all three languages', () => {
  for (const { topic, questions } of banks) {
    const skills = new Set(topic.skills.map((s) => s.id));
    const ids = new Set();
    for (const q of questions) {
      const where = `${topic.id}/${q.id}`;
      assert.ok(!ids.has(q.id), `${where}: id repeats`);
      ids.add(q.id);
      assert.ok(skills.has(q.skill), `${where}: unknown skill ${q.skill}`);
      for (const lang of ['ky', 'ru', 'en']) assert.ok(normalize(q.prompt?.[lang]), `${where}: no prompt in ${lang}`);
      if (q.type === 'choice') {
        assert.ok(q.options.length >= 2 && q.correct >= 0 && q.correct < q.options.length, `${where}: bad correct index`);
        const texts = q.options.map((o) => normalize(typeof o === 'object' ? o.ky : o));
        assert.equal(new Set(texts).size, texts.length, `${where}: options repeat`);
      }
      if (q.type === 'input') assert.ok(q.answer?.length, `${where}: no answer`);
    }
  }
});

test('the bank has no duplicate questions', () => {
  for (const lang of ['ky', 'ru', 'en']) {
    const { exact, probable } = findDuplicates(all, { lang });
    assert.deepEqual(exact.map(([a, b]) => `${a.id}|${b.id}`), [], `exact duplicates (${lang})`);
    const unreviewed = probable.map(({ a, b }) => `${a.id}|${b.id}`).filter((k) => !REVIEWED.has(k));
    assert.deepEqual(unreviewed, [], `probable duplicates (${lang}) — check by hand, then add to REVIEWED`);
  }
});

test('the detector finds a copied question but keeps different numbers apart', () => {
  const q = (id, ky, opts) => ({ id, topic: 't', type: 'choice', prompt: { ky }, options: opts, correct: 0 });
  const { exact, probable } = findDuplicates([
    q('a', 'Канча болот 2 + 3?', ['5', '6']),
    q('b', 'Канча болот: 2 + 3', ['5', '7']),
    q('c', 'Канча болот 2 + 4?', ['6', '5'])
  ]);
  assert.deepEqual(exact.map(([x, y]) => x.id + y.id), ['ab']);
  assert.equal(probable.length, 0);
});

test('getQuestions: shown questions come back only when new ones run out', async () => {
  const { getQuestions } = await import('../core/curriculum.js');
  const topic = banks[0].topic.id;
  const size = banks[0].questions.length;
  const first = await getQuestions({ topic, count: 5, includeCustom: false });
  assert.equal(new Set(first.map((q) => q.id)).size, 5, 'no repeats inside one pick');
  const second = await getQuestions({ topic, count: 5, includeCustom: false, avoid: first.map((q) => q.id) });
  assert.ok(second.every((q) => !first.some((f) => f.id === q.id)), 'second stage has only new questions');
  // Новых не хватает — повторов ровно столько, сколько недостаёт
  const seenAll = banks[0].questions.slice(0, size - 2).map((q) => q.id);
  const third = await getQuestions({ topic, count: 5, includeCustom: false, avoid: seenAll });
  assert.equal(third.length, 5);
  assert.equal(third.filter((q) => seenAll.includes(q.id)).length, 3);
});
