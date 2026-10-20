/**
 * Протокол сервера знакомства. Нужен запущенный сервер:
 *   npm run dev            (в другом окне)
 *   SIGNAL_URL=http://127.0.0.1:8787 npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.SIGNAL_URL || 'http://127.0.0.1:8787';
const ORIGIN = 'http://localhost:8765';
const WS = BASE.replace(/^http/, 'ws');

/** Клиент PeerJS-протокола: ждёт сообщения по типу */
function client(id, token, { key = 'bilimarena', origin = ORIGIN, ip = null } = {}) {
  // Локально (wrangler dev) CF-Connecting-IP можно задать самому — так тесты лимитов по IP
  // не мешают друг другу. В Cloudflare этот заголовок ставит сеть и подменить его нельзя.
  const headers = { Origin: origin, ...(ip ? { 'CF-Connecting-IP': ip } : {}) };
  const ws = new WebSocket(`${WS}/peerjs?key=${key}&id=${id}&token=${token}&version=1.5.5`, { headers });
  const inbox = [];
  const waiters = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    const i = waiters.findIndex((w) => w.type === msg.type);
    if (i >= 0) waiters.splice(i, 1)[0].resolve(msg); else inbox.push(msg);
  });
  const closed = new Promise((resolve) => ws.addEventListener('close', (e) => resolve(e.code)));
  return {
    ws, closed,
    next(type, ms = 3000) {
      const i = inbox.findIndex((m) => m.type === type);
      if (i >= 0) return Promise.resolve(inbox.splice(i, 1)[0]);
      return new Promise((resolve, reject) => {
        const w = { type, resolve };
        waiters.push(w);
        setTimeout(() => reject(new Error(`no ${type} for ${id}`)), ms);
      });
    },
    send: (m) => ws.send(JSON.stringify(m)),
    close: () => ws.close()
  };
}

const uid = (p) => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

test('health and id endpoint', async () => {
  const health = await (await fetch(`${BASE}/health`)).json();
  assert.equal(health.ok, true);
  const res = await fetch(`${BASE}/bilimarena/id?ts=1`, { headers: { Origin: ORIGIN } });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /^p[0-9a-f]{24}$/);
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
});

test('foreign sites are refused', async () => {
  const res = await fetch(`${BASE}/bilimarena/id`, { headers: { Origin: 'https://evil.example' } });
  assert.equal(res.status, 403);
});

test('OPEN, then offer/answer/candidate are forwarded with src', async () => {
  const boardId = uid('bilimarena-room-T');
  const board = client(boardId, 'tokA');
  const phone = client(uid('phone'), 'tokB');
  await board.next('OPEN');
  await phone.next('OPEN');

  phone.send({ type: 'OFFER', dst: boardId, payload: { sdp: 'x' } });
  const offer = await board.next('OFFER');
  assert.equal(offer.payload.sdp, 'x');
  assert.match(offer.src, /^phone-/);

  board.send({ type: 'ANSWER', dst: offer.src, payload: { sdp: 'y' } });
  assert.equal((await phone.next('ANSWER')).src, boardId);
  board.close(); phone.close();
});

test('unknown destination answers EXPIRE (phone sees "room not found")', async () => {
  const phone = client(uid('phone'), 'tok1');
  await phone.next('OPEN');
  phone.send({ type: 'OFFER', dst: 'bilimarena-room-NOPE', payload: {} });
  const exp = await phone.next('EXPIRE');
  assert.equal(exp.src, 'bilimarena-room-NOPE');
  phone.close();
});

test('same id: other token is ID-TAKEN, same token reconnects', async () => {
  const id = uid('bilimarena-room-D');
  const a = client(id, 'tokenA');
  await a.next('OPEN');
  const b = client(id, 'tokenB');
  assert.equal((await b.next('ID-TAKEN')).type, 'ID-TAKEN');
  const again = client(id, 'tokenA');
  await again.next('OPEN');
  assert.equal(await a.closed, 1000);
  again.close();
});

test('wrong key is refused', async () => {
  const c = client(uid('x'), 'tok', { key: 'peerjs' });
  assert.equal((await c.next('INVALID-KEY')).type, 'INVALID-KEY');
});

test('heartbeat is answered without breaking the connection', async () => {
  const c = client(uid('hb'), 'tok');
  await c.next('OPEN');
  c.send({ type: 'HEARTBEAT' });
  assert.equal((await c.next('PONG')).type, 'PONG');
  c.close();
});

test('malformed messages are ignored and the connection stays usable', async () => {
  const c = client(uid('bad'), 'tok');
  await c.next('OPEN');
  for (const raw of ['not json', '{"type":"OFFER"}', '{"type":"OFFER","dst":"../../x"}', '{"type":"EVIL","dst":"a"}',
    '[]', 'null', '{"type":"OFFER","dst":{"$ne":1}}', JSON.stringify({ type: 'OFFER', dst: 'a', payload: 'x'.repeat(40 * 1024) })]) {
    c.ws.send(raw);
  }
  c.send({ type: 'HEARTBEAT' });
  assert.equal((await c.next('PONG')).type, 'PONG');
  c.close();
});

test('one wrong room code is a single miss, even with many candidates', async () => {
  const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  const phone = client(uid('phone'), 'tok', { ip });
  await phone.next('OPEN');
  for (let i = 0; i < 80; i++) phone.send({ type: i ? 'CANDIDATE' : 'OFFER', dst: 'bilimarena-room-MISS', payload: {} });
  phone.send({ type: 'HEARTBEAT' });
  assert.equal((await phone.next('PONG')).type, 'PONG');
  phone.close();
});

test('guessing many room codes from one address closes the connection', async () => {
  const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
  const phone = client(uid('guess'), 'tok', { ip });
  await phone.next('OPEN');
  for (let i = 0; i < 70; i++) phone.send({ type: 'OFFER', dst: `bilimarena-room-G${i}`, payload: {} });
  assert.equal(await phone.closed, 1008);
});
