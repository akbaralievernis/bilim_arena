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

const { saveTest, getTest, testQuestions, buildVariant, checkPaperAnswer, parseAnswers, scorePaper, LETTERS } = await import('../core/tests.js');
const { recordStage, studentReport } = await import('../core/lessons.js');

beforeEach(() => mem.clear());

const T = { id: 't_demo', updatedAt: 1 };
const Q = [
  { id: 'c1', skill: 's', type: 'choice', prompt: { ky: 'Эки', ru: 'Два', en: 'Two' }, options: ['1', '2', '3', '4'], correct: 1 },
  { id: 'm1', skill: 's', type: 'multiple', prompt: 'Жуп сандар', options: ['2', '3', '4', '5'], correct: [0, 2] },
  { id: 'i1', skill: 's', type: 'input', numeric: true, prompt: '1/2 = ?', answer: ['0.5'] },
  { id: 't1', skill: 's', type: 'input', prompt: 'Борбор?', answer: ['Бишкек'] },
  { id: 'p1', skill: 's', type: 'match', prompt: 'Жупта', pairs: [['O', 'Кычкылтек'], ['Fe', 'Темир'], ['Na', 'Натрий']] },
  { id: 's1', skill: 's', type: 'sort', prompt: 'Иретте', items: ['1', '2', '3', '4'] },
  { id: 'e1', skill: 's', type: 'choice', errorHunt: true, prompt: 'Ката?', options: ['a', 'b', 'c'], correct: 2 },
  { id: 'v1', skill: 's', type: 'choice', vote: true, prompt: 'Пикир', options: ['x', 'y'] }
];

test('a variant prints the same way every time; variant A keeps the teacher order', () => {
  const a1 = buildVariant(T, Q, 0, 'ru');
  const a2 = buildVariant(T, Q, 0, 'ky');
  assert.deepEqual(a1.map((x) => x.key), a2.map((x) => x.key), 'the key does not depend on the language');
  assert.deepEqual(a1.map((x) => x.q.id), ['c1', 'm1', 'i1', 't1', 'p1', 's1', 'e1'], 'polls without a right answer are left out');
  const b = buildVariant(T, Q, 1, 'ru');
  assert.equal(b.length, 7);
  assert.deepEqual(buildVariant(T, Q, 1, 'ru').map((x) => x.key), b.map((x) => x.key));
  assert.notDeepEqual(b.map((x) => x.q.id).join(), a1.map((x) => x.q.id).join(), 'variant B has another order');
});

test('the key points at the right answer for every question type', () => {
  for (const v of [0, 1, 2, 3]) {
    for (const it of buildVariant(T, Q, v, 'ru')) {
      const q = it.q;
      if (q.type === 'choice') assert.equal(it.options[LETTERS.indexOf(it.key)].index, q.correct);
      if (q.type === 'multiple') assert.deepEqual(it.key.split('').map((l) => it.options[LETTERS.indexOf(l)].index).sort(), [0, 2]);
      if (q.type === 'match') it.left.forEach((l, k) => assert.equal(it.right[LETTERS.indexOf(it.key[k])].index, l.index));
      if (q.type === 'sort') assert.deepEqual(it.key.split('').map((l) => it.items[LETTERS.indexOf(l)].index), [0, 1, 2, 3]);
      if (q.errorHunt) assert.deepEqual(it.options.map((o) => o.index), [0, 1, 2], 'solution lines stay in order');
      assert.ok(checkPaperAnswer(it, it.key), `${q.id}: the key itself is accepted`);
    }
  }
});

test('answers: Cyrillic letters, any order for multiple, numbers with a comma, text case', () => {
  const items = buildVariant(T, Q, 0, 'ru');
  const by = (id) => items.find((x) => x.q.id === id);
  const c = by('c1');
  assert.ok(checkPaperAnswer(c, c.key.toLowerCase()));
  const cyr = { A: 'А', B: 'В', C: 'С' }[c.key];
  if (cyr) assert.ok(checkPaperAnswer(c, cyr), 'Cyrillic look-alike letter');
  const m = by('m1');
  assert.ok(checkPaperAnswer(m, m.key.split('').reverse().join('')));
  assert.ok(!checkPaperAnswer(m, m.key[0]), 'half of a multiple answer is wrong');
  assert.ok(checkPaperAnswer(by('i1'), '0,5'));
  assert.ok(!checkPaperAnswer(by('i1'), '5'));
  assert.ok(checkPaperAnswer(by('t1'), ' бишкек '));
  assert.ok(!checkPaperAnswer(c, ''), 'an empty answer is wrong');
  assert.ok(!checkPaperAnswer(c, '-'));
});

test('parsing a row of answers: spaced or written together', () => {
  const choiceOnly = buildVariant(T, Q.filter((q) => q.type === 'choice' && !q.vote), 0, 'ru');
  assert.deepEqual(parseAnswers('BC', choiceOnly), ['B', 'C']);
  const items = buildVariant(T, Q, 0, 'ru');
  const keys = items.map((x) => x.key);
  const r = scorePaper(items, parseAnswers(keys.join(' '), items));
  assert.equal(r.correct, items.length);
  const wrong = scorePaper(items, parseAnswers(keys.slice(0, 3).join(', '), items));
  assert.equal(wrong.correct, 3, 'missing answers count as wrong');
});

test('a saved test keeps its question order; a paper check marks the topic in the report', async () => {
  const saved = await saveTest({ title: ' Дроби ', subject: 'math', topic: 'math-6-fractions', questionIds: ['f05', 'f01', 'f05', 'f03'] });
  assert.equal(saved.title, 'Дроби');
  assert.deepEqual(saved.questionIds, ['f05', 'f01', 'f03'], 'no repeated question in one test');
  const qs = await testQuestions(await getTest(saved.id));
  assert.deepEqual(qs.map((q) => q.id), ['f05', 'f01', 'f03']);

  const items = buildVariant(saved, qs, 0, 'ru');
  const log = items.map((it, i) => ({ playerId: 'paper:айбек', playerName: 'Айбек', skill: it.q.skill, correct: i < 2, questionId: it.q.id }));
  await recordStage({ subject: 'math', topic: 'math-6-fractions', mode: 'paper-check', gameId: 'paper', log, players: [{ id: 'paper:айбек', name: 'Айбек', score: 2 }] });
  let r = await studentReport('айбек');
  const row = r.topicRows.find((x) => x.topic === 'math-6-fractions');
  // Проверка из 3 вопросов короче минимума (5) — вывод не делается
  assert.equal(row.checks.length, 1);
  assert.notEqual(row.status, 'mastered');

  const five = Array.from({ length: 5 }, (_, i) => ({ playerId: 'paper:айбек', playerName: 'Айбек', skill: 'compare', correct: true, questionId: `f0${i + 1}` }));
  await recordStage({ subject: 'math', topic: 'math-6-fractions', mode: 'paper-check', gameId: 'paper', log: five, players: [] });
  r = await studentReport('айбек');
  assert.equal(r.topicRows.find((x) => x.topic === 'math-6-fractions').status, 'mastered');
});

test('export to Race: choice and short answer only, at most 20 checkpoints, safe cells', async () => {
  const { toRaceTable } = await import('../core/tests.js');
  const qs = [
    { id: 'a', type: 'choice', prompt: { ru: 'Два "плюс"\tдва?' }, options: ['3', '4', '5'], correct: 1 },
    { id: 'b', type: 'input', prompt: 'Столица?', answer: ['Бишкек', 'Bishkek'] },
    { id: 'c', type: 'match', prompt: 'Пары', pairs: [['a', 'b']] },
    { id: 'd', type: 'choice', vote: true, prompt: 'Мнение', options: ['x', 'y'] },
    ...Array.from({ length: 25 }, (_, i) => ({ id: `n${i}`, type: 'input', prompt: `${i} + 1 = ?`, answer: [String(i + 1)] }))
  ];
  const r = toRaceTable({ id: 't' }, qs, 'ru', (n) => `CP ${n}`);
  assert.equal(r.used, 20);
  assert.equal(r.skippedTypes, 1, 'matching is not a Race task');
  assert.equal(r.cut, 7);
  const [first, second] = r.text.split('\n');
  assert.equal(first, 'CP 1\t"Два ""плюс""\tдва?"\t4\t3\t5');
  assert.equal(second, 'CP 2\tСтолица?\tБишкек');
});

test('multi-topic test: refs only when needed, questions in order, report per topic', async () => {
  const { normalizeRefs, saveTest, testQuestions } = await import('../core/tests.js');
  // Одна тема — как раньше: просто id (уже распечатанные бланки не «устаревают»)
  assert.deepEqual(normalizeRefs(['math-6-fractions::f01', 'f02'], 'math-6-fractions'), { topic: 'math-6-fractions', topics: ['math-6-fractions'], questionIds: ['f01', 'f02'] });
  const multi = normalizeRefs(['math-6-fractions::f01', 'chemistry-8-basics::ch01', 'math-6-fractions::f03'], 'math-6-fractions');
  assert.equal(multi.topic, 'math-6-fractions', 'main topic has most questions');
  assert.deepEqual(multi.topics, ['math-6-fractions', 'chemistry-8-basics']);
  assert.deepEqual(multi.questionIds, ['math-6-fractions::f01', 'chemistry-8-basics::ch01', 'math-6-fractions::f03']);

  const saved = await saveTest({ title: 'Аралаш', topic: 'math-6-fractions', questionIds: multi.questionIds });
  const qs = await testQuestions(saved);
  assert.deepEqual(qs.map((q) => `${q.topic}/${q.id}`), ['math-6-fractions/f01', 'chemistry-8-basics/ch01', 'math-6-fractions/f03']);

  // Ответы урока записываются по теме самого вопроса
  const log = qs.map((q, i) => ({ playerId: 'p:a', playerName: 'Азат', topic: q.topic, skill: q.skill, correct: i !== 1, questionId: q.id }));
  await recordStage({ subject: 'math', topic: 'math-6-fractions', mode: 'paper', gameId: 'paper', log, players: [] });
  const r = await studentReport('азат');
  const rows = Object.fromEntries(r.topicRows.map((x) => [x.topic, x]));
  assert.equal(rows['math-6-fractions'].answered, 2);
  assert.equal(rows['chemistry-8-basics'].answered, 1);
  assert.equal(rows['chemistry-8-basics'].correct, 0);
});
