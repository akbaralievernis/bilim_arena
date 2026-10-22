// Общий банк (core/publicbank.js) и обезличенная статистика (core/stats.js) — ТЗ docs/TZ-ADMIN-2026-10.md.
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
globalThis.location = new URL('https://akbaralievernis.github.io/bilim_arena/index.html');
const calls = [];
let reply = () => ({ ok: true, json: async () => [] });
globalThis.fetch = async (url, opts = {}) => { calls.push({ url: String(url), opts }); return reply(url, opts); };

const { toPublicQuestion, refreshPublicBank, publicQuestions, _resetPublicBank } = await import('../core/publicbank.js');
const { getQuestions, findQuestion, loadBank } = await import('../core/curriculum.js');
const { topicJourney } = await import('../core/progress.js');
const { playSummary, recordPlay, recordVisit } = await import('../core/stats.js');
const { setReview } = await import('../core/review.js');

const ROW = {
  id: '0b6c1f5e-1111-4222-8333-444455556666', topic: 'math-6-fractions', author_name: 'Асанова',
  question: { type: 'single', question: { ky: '1/2 + 1/2 = ?', ru: '1/2 + 1/2 = ?', en: '1/2 + 1/2 = ?' },
    options: ['1', '2', '1/4'], correctAnswer: 0, skill: 'add-sub', difficulty: 1 }
};

test('an approved row becomes a game question with its own id space', () => {
  const q = toPublicQuestion(ROW);
  assert.equal(q.id, `pub_${ROW.id}`);
  assert.equal(q.type, 'choice');
  assert.equal(q.correct, 0);
  assert.equal(q.author, 'Асанова');
  assert.equal(q.custom, false, 'not treated as the viewer\'s own question');
  assert.equal(toPublicQuestion({ ...ROW, question: { type: 'single', question: 'x', options: ['one'] } }), null, 'needs two options');
  assert.equal(toPublicQuestion({ ...ROW, question: { type: 'text', question: 'x', correctAnswer: '' } }), null, 'needs an answer');
  assert.equal(toPublicQuestion({ id: 'x', topic: 'math-6-fractions', question: null }), null);
});

test('the shared bank loads once, joins the games of its topic and survives a failed refresh', async () => {
  mem.clear(); _resetPublicBank(); calls.length = 0;
  reply = () => ({ ok: true, json: async () => [ROW] });
  await refreshPublicBank();
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/rest\/v1\/public_questions\?select=.*active=eq\.true/);
  await refreshPublicBank();
  assert.equal(calls.length, 1, 'fresh for 6 hours: no second request');

  const pool = await getQuestions({ topic: 'math-6-fractions', count: 500 });
  assert.ok(pool.some((q) => q.id === `pub_${ROW.id}`), 'appears in its topic');
  const other = await getQuestions({ topic: 'english-5-basics', count: 500 });
  assert.ok(!other.some((q) => q.id.startsWith('pub_')), 'not in other topics');
  assert.equal((await findQuestion('math-6-fractions', `pub_${ROW.id}`))?.author, 'Асанова');
  const byIds = await getQuestions({ topic: 'math-6-fractions', ids: [`pub_${ROW.id}`, 'f01'] });
  assert.deepEqual(byIds.map((q) => q.id).sort(), ['f01', `pub_${ROW.id}`].sort());

  // Отказ сети при принудительном обновлении — список остаётся
  reply = () => { throw new Error('offline'); };
  await refreshPublicBank({ force: true });
  assert.equal((await publicQuestions({ topic: 'math-6-fractions' })).length, 1);
  // После перезагрузки страницы — из хранилища устройства
  _resetPublicBank();
  assert.equal((await publicQuestions({ topic: 'math-6-fractions' })).length, 1);
});

test('a teacher can still flag a shared question so students skip it', async () => {
  await setReview('math-6-fractions', `pub_${ROW.id}`, 'issue', 'опечатка');
  const pool = await getQuestions({ topic: 'math-6-fractions', count: 500 });
  assert.ok(!pool.some((q) => q.id === `pub_${ROW.id}`));
});

test('topic mastery is measured on the file bank only', async () => {
  const bankIds = (await loadBank('math-6-fractions')).map((q) => q.id);
  assert.ok(!bankIds.some((id) => id.startsWith('pub_')));
  const before = topicJourney({ qs: {}, checks: {}, path: {}, topics: {} }, 'math-6-fractions', bankIds);
  assert.ok(before, 'journey computed from bank ids as before');
});

test('a missing table (migration not run) leaves games untouched', async () => {
  mem.clear(); _resetPublicBank();
  reply = () => ({ ok: false, status: 404, json: async () => ({}) });
  await refreshPublicBank();
  const pool = await getQuestions({ topic: 'math-6-fractions', count: 500 });
  assert.ok(pool.length > 0 && !pool.some((q) => q.id.startsWith('pub_')));
});

test('a game summary counts answers per question without names or private ids', () => {
  const log = [
    { questionId: 'f01', correct: true, playerId: 'a', playerName: 'Айбек' },
    { questionId: 'f01', correct: false, playerId: 'b', playerName: 'Нурия' },
    { questionId: 'f02', correct: false, playerId: 'a' },
    { questionId: 'q_171_5', correct: false, playerId: 'a' }, // вопрос учителя — личный
    { questionId: 'bad id!', correct: true, playerId: 'b' }
  ];
  const s = playSummary({ gameId: 'race', topic: 'math-6-fractions', log });
  assert.deepEqual(s, {
    game: 'race', topic: 'math-6-fractions', players: 2, answers: 5, correct: 2,
    questions: [{ id: 'f01', n: 2, wrong: 1 }, { id: 'f02', n: 1, wrong: 1 }]
  });
  assert.ok(!JSON.stringify(s).includes('Айбек'));
  assert.equal(playSummary({ gameId: '../x', log }), null);
  assert.equal(playSummary({ gameId: 'quiz', topic: 'Bad Topic', log: [] }).topic, '');
});

test('a visit is counted once a day per device, and nothing is sent from localhost', () => {
  mem.clear(); calls.length = 0;
  reply = () => ({ ok: true, json: async () => ({}) });
  recordVisit(); recordVisit();
  assert.equal(calls.filter((c) => c.url.endsWith('/rpc/record_visit')).length, 1);

  recordPlay({ gameId: 'race', topic: 'math-6-fractions', log: [] });
  assert.equal(calls.filter((c) => c.url.endsWith('/rpc/record_play')).length, 0, 'a game without answers is not sent');
  recordPlay({ gameId: 'race', topic: 'math-6-fractions', log: [{ questionId: 'f01', correct: true, playerId: 'a' }] });
  const play = calls.find((c) => c.url.endsWith('/rpc/record_play'));
  assert.equal(JSON.parse(play.opts.body).answers, 1);

  calls.length = 0; mem.clear();
  globalThis.location = new URL('http://localhost:8766/index.html');
  recordVisit();
  recordPlay({ gameId: 'race', log: [{ questionId: 'f01', correct: true }] });
  assert.equal(calls.length, 0);
});

test('homework that names a shared question the device has not seen yet fetches the list once', async () => {
  globalThis.location = new URL('https://akbaralievernis.github.io/bilim_arena/tasks.html');
  mem.clear(); _resetPublicBank(); calls.length = 0;
  reply = () => ({ ok: true, json: async () => [ROW] });
  // Список на устройстве уже свежий, но без этого вопроса
  localStorage.setItem('BA2_public_bank', JSON.stringify({ at: Date.now(), rows: [] }));
  const got = await getQuestions({ topic: 'math-6-fractions', ids: [`pub_${ROW.id}`] });
  assert.deepEqual(got.map((q) => q.id), [`pub_${ROW.id}`]);
  await getQuestions({ topic: 'math-6-fractions', ids: ['pub_unknown'] });
  assert.equal(calls.length, 1, 'a hidden or unknown id does not refetch on every call');
});
