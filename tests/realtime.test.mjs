// node --test tests/realtime.test.mjs — защита доски от лишних и поддельных сообщений.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptMessage, cleanPlayerName, connectionGuard, rateLimiter } from '../core/realtime.js';

test('names: no control or invisible characters, at most 20 letters', () => {
  assert.equal(cleanPlayerName('  Эрнис\n  А. '), 'Эрнис А.');
  assert.equal(cleanPlayerName('a‮evil​'), 'aevil');
  assert.equal(cleanPlayerName('x'.repeat(50)), 'x'.repeat(20));
  assert.equal(cleanPlayerName(''), '?');
  assert.equal(cleanPlayerName(null), '?');
});

test('messages: a type, a sane player id and a limited size', () => {
  assert.ok(acceptMessage({ type: 'answer', playerId: 's_1_2', value: 3 }));
  assert.equal(acceptMessage(null), null);
  assert.equal(acceptMessage([1, 2]), null);
  assert.equal(acceptMessage({ type: 'answer' }), null);
  assert.equal(acceptMessage({ type: 'answer', playerId: '<img src=x>' }), null);
  assert.equal(acceptMessage({ type: 'x'.repeat(41), playerId: 'p' }), null);
  assert.equal(acceptMessage({ type: 'answer', playerId: 'p', value: 'x'.repeat(9000) }), null);
});

test('rate limit: normal play passes, floods are dropped, then closed', () => {
  let t = 0;
  const limit = rateLimiter(() => t);
  for (let i = 0; i < 60; i++) assert.equal(limit(), 'ok');
  assert.equal(limit(), 'drop');
  for (let i = 0; i < 239; i++) limit(); // 300 messages in the window
  assert.equal(limit(), 'close');
  t = 11000; // a new 10-second window
  assert.equal(limit(), 'ok');
});

test('signalling servers: own first, public as backup, test overrides', async () => {
  const { signalServers } = await import('../core/realtime.js');
  const own = { host: 'sig.example.workers.dev', key: 'bilimarena' };
  assert.deepEqual(signalServers('', own).map((s) => s.name), ['own', 'public']);
  assert.equal(signalServers('', own)[0].options.secure, true);
  assert.equal(signalServers('', own)[0].options.port, 443);
  assert.deepEqual(signalServers('', { host: '' }).map((s) => s.name), ['public']);
  assert.deepEqual(signalServers('?signal=public', own).map((s) => s.name), ['public']);
  assert.deepEqual(signalServers('?signal=own', own).map((s) => s.name), ['own']);
  assert.equal(signalServers('?signal=local', own)[0].options.port, 8787);
});

test('error reports: no URL parameters, noise ignored', async () => {
  const { buildReport } = await import('../core/errors.js');
  const err = new Error('boom at https://site.test/play.html?room=ABCD&name=Айбек');
  err.stack = 'Error: boom\n    at render (https://site.test/play.js?v=15:10:5)';
  const r = buildReport(err, { page: 'https://site.test/play.html?room=ABCD', lang: 'ky', ua: 'Chrome' });
  assert.equal(r.page, '/play.html');
  assert.ok(!r.message.includes('ABCD') && !r.message.includes('Айбек'));
  assert.ok(!r.stack.includes('?v=15'));
  assert.equal(buildReport(new Error('ResizeObserver loop limit exceeded')), null);
  assert.equal(buildReport('Script error.'), null);
  assert.equal(buildReport(new Error('NotAllowedError: Permission denied')), null);
  assert.equal(buildReport(''), null);
});

test('board: extra connections are closed, silent ones are dropped after a timeout', () => {
  const timers = [];
  const guard = connectionGuard({ max: 3, joinTimeout: 20000, later: (fn) => timers.push(fn) && timers.length, cancel: () => {} });
  const conn = () => ({ closed: false, close() { this.closed = true; } });
  const [a, b, c, d] = [conn(), conn(), conn(), conn()];
  assert.equal(guard.admit(a), true);
  assert.equal(guard.admit(b), true);
  assert.equal(guard.admit(c), true);
  assert.equal(guard.admit(d), false, 'the fourth is refused');
  assert.equal(d.closed, true);
  guard.joined(a);
  timers.forEach((fire) => fire());
  assert.equal(a.closed, false, 'a joined student stays');
  assert.equal(b.closed, true, 'a silent connection is dropped');
  guard.closed(b); guard.closed(c);
  assert.equal(guard.size, 1, 'closed connections free their places');
  assert.equal(guard.admit(conn()), true);
});
