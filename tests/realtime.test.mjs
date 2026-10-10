// node --test tests/realtime.test.mjs — защита доски от лишних и поддельных сообщений.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptMessage, cleanPlayerName, rateLimiter } from '../core/realtime.js';

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
