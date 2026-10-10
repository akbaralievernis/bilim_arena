// node --test tests/ — проверка core/turn.js без браузера.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iceServers, isIceServer, isTurnConfigured, STUN_SERVERS } from '../core/turn.js';

const TURN_REPLY = [
  { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'turn:global.relay.metered.ca:80', username: 'u', credential: 'p' },
  { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'u', credential: 'p' }
];

const memoryStorage = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};
const okFetch = (body) => {
  const calls = [];
  const fn = async (url) => { calls.push(url); return { ok: true, json: async () => body }; };
  return Object.assign(fn, { calls });
};

test('without TURN only STUN is used and nothing is fetched', async () => {
  const fetchFn = okFetch(TURN_REPLY);
  const servers = await iceServers({ config: { credentialsUrl: '', servers: [] }, fetchFn, storage: memoryStorage() });
  assert.deepEqual(servers, STUN_SERVERS);
  assert.equal(fetchFn.calls.length, 0);
  assert.equal(isTurnConfigured({ credentialsUrl: '', servers: [] }), false);
});

test('Metered credentials are fetched once and cached for an hour', async () => {
  const fetchFn = okFetch(TURN_REPLY);
  const storage = memoryStorage();
  const config = { credentialsUrl: 'https://x.metered.live/api/v1/turn/credentials?apiKey=k', servers: [] };
  const first = await iceServers({ config, fetchFn, storage, now: 1000 });
  const second = await iceServers({ config, fetchFn, storage, now: 1000 + 30 * 60 * 1000 });
  assert.deepEqual(first, [...STUN_SERVERS, ...TURN_REPLY]);
  assert.deepEqual(second, first);
  assert.equal(fetchFn.calls.length, 1);
  await iceServers({ config, fetchFn, storage, now: 1000 + 61 * 60 * 1000 });
  assert.equal(fetchFn.calls.length, 2);
});

test('a failing or slow TURN service never breaks the lesson', async () => {
  const config = { credentialsUrl: 'https://x/creds', servers: [] };
  const failing = async () => { throw new Error('offline'); };
  assert.deepEqual(await iceServers({ config, fetchFn: failing, storage: memoryStorage() }), STUN_SERVERS);
  const notOk = async () => ({ ok: false, json: async () => ({}) });
  assert.deepEqual(await iceServers({ config, fetchFn: notOk, storage: memoryStorage() }), STUN_SERVERS);
});

test('static servers are added; malformed entries are dropped', async () => {
  const config = {
    credentialsUrl: '',
    servers: [
      { urls: 'turn:turn.example.org:3478', username: 'a', credential: 'b' },
      { urls: 'turn:no-password.example.org' },
      { urls: 'http://not-ice' }
    ]
  };
  const servers = await iceServers({ config, fetchFn: okFetch([]), storage: memoryStorage() });
  assert.deepEqual(servers, [...STUN_SERVERS, config.servers[0]]);
  assert.equal(isTurnConfigured(config), true);
  assert.equal(isIceServer({ urls: ['turn:a', 'turns:b'], username: 'u', credential: 'c' }), true);
});
