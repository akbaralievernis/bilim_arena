// Лимиты сервера знакомства по IP (signal/src/limits.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IP_LIMITS, clientIp, perMinute } from '../signal/src/limits.js';

const req = (headers) => ({ headers: new Headers(headers) });

test('client IP comes only from CF-Connecting-IP, never from X-Forwarded-For', () => {
  assert.equal(clientIp(req({ 'CF-Connecting-IP': '198.51.100.7', 'X-Forwarded-For': '10.0.0.1' })), '198.51.100.7');
  assert.equal(clientIp(req({ 'X-Forwarded-For': '10.0.0.1' })), 'unknown');
  assert.equal(clientIp(req({ 'CF-Connecting-IP': '2001:db8::1' })), '2001:db8::1');
  assert.equal(clientIp(req({ 'CF-Connecting-IP': '<script>' })), 'unknown');
});

test('per-minute limit: counts per address and resets after a minute', () => {
  let now = 0;
  const lim = perMinute(3, () => now);
  assert.deepEqual([lim.hit('a'), lim.hit('a'), lim.hit('a'), lim.hit('a')], [false, false, false, true]);
  assert.equal(lim.hit('b'), false, 'another address is not affected');
  now = 60_000;
  assert.equal(lim.hit('a'), false, 'new minute');
});

test('memory stays bounded under many addresses', () => {
  let now = 0;
  const lim = perMinute(5, () => now);
  for (let i = 0; i < 10_001; i++) lim.hit(`ip${i}`);
  now = 61_000;
  lim.hit('fresh');
  assert.ok(lim.size <= 2, `old windows dropped, size ${lim.size}`);
});

test('limits leave room for a whole school behind one NAT', () => {
  assert.ok(IP_LIMITS.socketsPerIp >= 300, 'ten classes of 30 phones');
  assert.ok(IP_LIMITS.connectsPerMinute >= IP_LIMITS.socketsPerIp, 'everyone may reconnect at once');
  assert.ok(IP_LIMITS.missesPerMinute >= 20, 'a few typos per class');
});
