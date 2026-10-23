// Админ-панель: проверка вопроса перед одобрением, понятные ошибки базы, журнал ошибок (core/admin.js).
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
globalThis.location = new URL('https://akbaralievernis.github.io/bilim_arena/admin.html');
// core/cloud.js при загрузке подписывается на события вкладки
globalThis.window = globalThis.document = { addEventListener() {} };

const { questionProblem, errorKey, groupErrors } = await import('../core/admin.js');

test('a correct question passes; a broken one is caught before it reaches every game', () => {
  const ok = { type: 'single', question: { ru: '2 + 2?' }, options: ['4', '5'], correctAnswer: 0 };
  assert.equal(questionProblem(ok), null);
  assert.equal(questionProblem({ type: 'truefalse', question: 'Земля круглая?', correctAnswer: true }), null);
  assert.equal(questionProblem({ type: 'text', question: 'Столица?', correctAnswer: 'Бишкек' }), null);
  assert.equal(questionProblem(null), 'adm_q_broken');
  assert.equal(questionProblem([1, 2]), 'adm_q_broken');
  assert.equal(questionProblem({ ...ok, question: { ru: '  ', ky: '' } }), 'adm_q_no_prompt');
  assert.equal(questionProblem({ ...ok, options: ['4'] }), 'adm_q_options');
  assert.equal(questionProblem({ ...ok, options: ['4', ''] }), 'adm_q_options');
  assert.equal(questionProblem({ ...ok, correctAnswer: 5 }), 'adm_q_correct');
  assert.equal(questionProblem({ type: 'multiple', question: 'x', options: ['a', 'b'], correctAnswer: [0, 3] }), 'adm_q_correct');
  assert.equal(questionProblem({ type: 'text', question: 'x', correctAnswer: ' ' }), 'adm_q_answer');
  assert.equal(questionProblem({ type: 'match', question: 'x', correctAnswer: [['a', 'b']] }), 'adm_q_pairs');
  assert.equal(questionProblem({ type: 'sort', question: 'x', correctAnswer: ['a'] }), 'adm_q_items');
});

test('database errors become messages that say what happened', () => {
  assert.equal(errorKey({ code: '42501', message: 'forbidden' }), 'adm_err_forbidden');
  assert.equal(errorKey({ code: 'P0001', message: 'already_reviewed' }), 'adm_err_stale');
  assert.equal(errorKey({ code: 'P0002', message: 'not_found' }), 'adm_err_stale');
  assert.equal(errorKey({ code: '42883', message: 'function public.admin_overview does not exist' }), 'adm_not_migrated');
  assert.equal(errorKey(new TypeError('Failed to fetch')), 'acc_err_network');
});

test('identical errors are grouped, most frequent first, with their pages', () => {
  const groups = groupErrors([
    { message: 'A is undefined', page: '/board.html', created_at: '2026-10-20T10:00:00Z', stack: 's1' },
    { message: 'B failed', page: '/play.html', created_at: '2026-10-22T10:00:00Z' },
    { message: 'A is undefined', page: '/play.html', created_at: '2026-10-21T10:00:00Z' },
    { message: 'A is undefined', page: '/board.html', created_at: '2026-10-19T10:00:00Z' }
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].message, 'A is undefined');
  assert.equal(groups[0].count, 3);
  assert.equal(groups[0].last, '2026-10-21T10:00:00Z');
  assert.deepEqual(groups[0].pages.sort(), ['/board.html', '/play.html']);
  assert.equal(groups[1].count, 1);
});
