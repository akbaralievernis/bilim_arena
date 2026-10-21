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
function client(id, token, { key = 'bilimarena', origin = ORIGIN } = {}) {
  const ws = new WebSocket(`${WS}/peerjs?key=${key}&id=${id}&token=${token}&version=1.5.5`, { headers: { Origin: origin } });
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

// Лимит соединений с одного адреса. Нужен сервер с маленьким лимитом:
//   npx wrangler dev --port 8788 --var MAX_PER_IP:3
//   SIGNAL_LIMIT_URL=http://127.0.0.1:8788 npm test
test('one address cannot take more than MAX_PER_IP places; a reconnect still works', { skip: !process.env.SIGNAL_LIMIT_URL }, async () => {
  const base = process.env.SIGNAL_LIMIT_URL.replace(/^http/, 'ws');
  const open = (id, token) => {
    const ws = new WebSocket(`${base}/peerjs?key=bilimarena&id=${id}&token=${token}&version=1.5.5`, { headers: { Origin: ORIGIN } });
    return new Promise((resolve) => ws.addEventListener('message', (e) => resolve({ ws, type: JSON.parse(e.data).type, msg: JSON.parse(e.data).payload?.msg })));
  };
  const first = await open(uid('lim'), 'tokA');
  const rest = [await open(uid('lim'), 't'), await open(uid('lim'), 't')];
  assert.deepEqual([first, ...rest].map((r) => r.type), ['OPEN', 'OPEN', 'OPEN']);
  const fourth = await open(uid('lim'), 't');
  assert.equal(fourth.type, 'ERROR');
  assert.match(fourth.msg, /Too many connections/);
  [first, ...rest].forEach((r) => r.ws.close());
});
