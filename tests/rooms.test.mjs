// node --test tests/rooms.test.mjs — вход учеников в комнату при сбоях сети.
// PeerJS заменён моделью: два сервера знакомства (свой и общий), которые можно
// «замедлить», «уронить» или отключить от них доску. Сроки уменьшены в 100 раз.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ─── Модель сети ──────────────────────────────────────────────────────────────
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

class Emitter {
  constructor() { this.h = {}; }
  on(ev, fn) { (this.h[ev] ||= []).push(fn); return this; }
  emit(ev, ...a) { (this.h[ev] || []).slice().forEach((fn) => fn(...a)); }
}

const net = {
  servers: {},
  reset() {
    this.servers = {
      own: { down: false, delay: 1, ids: new Map() },
      public: { down: false, delay: 1, ids: new Map() }
    };
  }
};
const serverOf = (options) => net.servers[options.host ? 'own' : 'public'];

class FakeConn extends Emitter {
  constructor(peer, remoteId) { super(); this.peer = peer; this.peer_ = remoteId; this.open = false; }
  send(msg) { if (!this.open) throw new Error('not open'); const o = this.other; setTimeout(() => o.open && o.emit('data', structuredClone(msg)), 1); }
  close() {
    if (!this.open) return;
    this.open = false; this.emit('close');
    const o = this.other; if (o?.open) { o.open = false; o.emit('close'); }
  }
}

let seq = 0;
class FakePeer extends Emitter {
  constructor(id, options) {
    super();
    this.server = serverOf(options);
    this.id = null; this.wanted = id || `phone${++seq}`; this.token = options.token || `t${seq}`;
    this.disconnected = false; this.destroyed = false; this.open = false;
    this._register();
  }
  _register() {
    const srv = this.server;
    setTimeout(() => {
      if (this.destroyed || srv.down) return; // сервер молчит — сработает таймер вызывающего
      const holder = srv.ids.get(this.wanted);
      // Свой сервер: тот же токен — это переподключение той же доски
      if (holder && holder !== this && !holder.destroyed && srv === net.servers.own && holder.token === this.token) holder.destroy();
      else if (holder && holder !== this && !holder.destroyed) {
        this.emit('error', { type: 'unavailable-id' });
        this.disconnected = true; this.emit('disconnected');
        return;
      }
      srv.ids.set(this.wanted, this);
      this.id = this.wanted; this.open = true; this.disconnected = false;
      this.emit('open', this.id);
    }, srv.delay);
  }
  /** Сервер «забыл» доску (обрыв Wi-Fi, вкладка в фоне) */
  drop() {
    if (this.server.ids.get(this.wanted) === this) this.server.ids.delete(this.wanted);
    this.open = false; this.disconnected = true;
    this.emit('error', { type: 'network' });
    this.emit('disconnected', this.wanted);
  }
  disconnect() {
    if (this.disconnected) return;
    if (this.server.ids.get(this.wanted) === this) this.server.ids.delete(this.wanted);
    this.open = false; this.disconnected = true;
    this.emit('disconnected', this.wanted);
  }
  reconnect() {
    if (this.destroyed) throw new Error('destroyed');
    if (!this.disconnected) return;
    this.disconnected = false;
    this._register();
  }
  connect(target) {
    const conn = new FakeConn(this, target);
    const srv = this.server;
    setTimeout(() => {
      if (this.destroyed || srv.down) return;
      const host = srv.ids.get(target);
      if (!host || host.destroyed || host.disconnected) { this.emit('error', { type: 'peer-unavailable' }); return; }
      conn.emit('iceStateChanged', 'checking');
      const remote = new FakeConn(host, this.id);
      conn.other = remote; remote.other = conn;
      host.emit('connection', remote);
      setTimeout(() => { remote.open = true; conn.open = true; remote.emit('open'); conn.emit('open'); }, 1);
    }, srv.delay);
    return conn;
  }
  destroy() {
    if (this.destroyed) return;
    const was = this.disconnected;
    this.destroyed = true; this.open = false; this.disconnected = true;
    if (this.server.ids.get(this.wanted) === this) this.server.ids.delete(this.wanted);
    if (!was) this.emit('disconnected', this.wanted); // как в PeerJS: destroy → disconnect
  }
}

// ─── Окружение браузера ───────────────────────────────────────────────────────
globalThis.window = { Peer: FakePeer, location: { search: '', href: 'https://site.test/board.html' }, addEventListener() {}, removeEventListener() {} };
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
globalThis.fetch = async () => ({ ok: false });

const rt = await import('../core/realtime.js');
const { createRoom, joinRoom, normalizeRoomCode, TIMING } = rt;
for (const k of Object.keys(TIMING)) TIMING[k] = Math.max(5, Math.round(TIMING[k] / 100));

beforeEach(() => net.reset());

async function lesson() {
  const joined = [];
  const room = await createRoom({ onJoin: (p) => joined.push(p.name) });
  return { room, joined };
}
const phone = (code, name, extra = {}) => joinRoom({ code, name, onMessage() {}, onStatus() {}, ...extra });

// ─── Проверки ─────────────────────────────────────────────────────────────────

test('room code typed on a Cyrillic keyboard still works', () => {
  assert.equal(normalizeRoomCode('к7ма'), 'K7MA');
  assert.equal(normalizeRoomCode(' Х3-ВЕ '), 'X3BE');
  assert.equal(normalizeRoomCode('рзту'), 'P3TY');
  assert.equal(normalizeRoomCode(null), '');
});

test('the board registers the room on both servers; a Cyrillic code joins', async () => {
  const { room, joined } = await lesson();
  await wait(30);
  assert.deepEqual(room.servers.sort(), ['own', 'public']);
  const cyr = room.code.replace(/[ABEKMHOPCTYX]/g, (c) => ({ A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х' })[c]).toLowerCase();
  const p = await phone(cyr, 'Айбек');
  await wait(10);
  assert.deepEqual(joined, ['Айбек']);
  p.close(); room.close();
});

test('the board lost its own server: a new phone still finds it through the other one', async () => {
  const { room, joined } = await lesson();
  await wait(30);
  net.servers.own.ids.get(`bilimarena-room-${room.code}`).drop();
  net.servers.own.down = true; // и переподключиться пока нельзя
  await wait(20);
  assert.equal(room.reachable, true);
  assert.deepEqual(room.servers, ['public']);
  const p = await phone(room.code, 'Нурай');
  await wait(10);
  assert.deepEqual(joined, ['Нурай']);
  // Связь вернулась — доска снова на своём сервере
  net.servers.own.down = false;
  await wait(TIMING.rejoin * 3);
  assert.deepEqual(room.servers.sort(), ['own', 'public']);
  p.close(); room.close();
});

test('slow phone internet: the own server answers late, the phone still joins (not "room not found")', async () => {
  // Сервер общий недоступен, доска только на своём
  net.servers.public.down = true;
  const { room, joined } = await lesson();
  await wait(30);
  assert.deepEqual(room.servers, ['own']);
  // Телефону свой сервер отвечает дольше быстрого ожидания, но в пределах терпеливого
  net.servers.own.delay = TIMING.phoneQuick + 20;
  const p = await phone(room.code, 'Бекзат');
  await wait(10);
  assert.deepEqual(joined, ['Бекзат']);
  p.close(); room.close();
});

test('the room was only on the own server and the phone cannot reach it: an honest "check the internet"', async () => {
  net.servers.public.down = true;
  const heal = TIMING.heal;
  TIMING.heal = 60_000; // доска не успеет повторно зарегистрироваться на общем
  const { room } = await lesson();
  await wait(30);
  net.servers.public.down = false; // общий сервер жив, но комнаты на нём нет
  net.servers.own.down = true;
  await assert.rejects(phone(room.code, 'Азат'), /room-not-found-or-network/);
  room.close();
  TIMING.heal = heal;
});

test('a really wrong code is "room not found"', async () => {
  const { room } = await lesson();
  await wait(30);
  await assert.rejects(phone('ZZZZ', 'Азат'), /^Error: room-not-found$/);
  room.close();
});

test('board: no server answers → a clear error, no endless waiting', async () => {
  net.servers.own.down = true; net.servers.public.down = true;
  await assert.rejects(createRoom({}), /timeout/);
});

test('the code is taken on the public server by another class: the room lives on the own server', async () => {
  const orig = crypto.getRandomValues;
  crypto.getRandomValues = (arr) => arr.fill(0); // код всегда «22222»
  const other = new FakePeer('bilimarena-room-22222', {});  // чужой класс на общем сервере
  await wait(5);
  try {
    const { room, joined } = await lesson();
    await wait(30);
    assert.equal(room.code, '22222');
    assert.deepEqual(room.servers, ['own']);
    const p = await phone('22222', 'Айбек');
    await wait(10);
    assert.deepEqual(joined, ['Айбек']);
    p.close(); room.close();
  } finally { crypto.getRandomValues = orig; other.destroy(); }
});

test('reconnect that hangs is replaced by a fresh registration with the same token', async () => {
  const { room } = await lesson();
  await wait(30);
  const id = `bilimarena-room-${room.code}`;
  net.servers.own.down = true;
  net.servers.own.ids.get(id).drop();            // обрыв, переподключение «висит»
  await wait(TIMING.ownOpen * 2);
  net.servers.own.down = false;
  await wait(TIMING.ownOpen + TIMING.rejoin * 3);
  assert.ok(room.servers.includes('own'));
  room.close();
  await wait(5);
  assert.equal(net.servers.own.ids.size + net.servers.public.ids.size, 0, 'closing the lesson frees the code everywhere');
});

test('recovering the server connection never kicks students who are already playing', async () => {
  const got = [];
  const room = await createRoom({ onMessage: (id, msg) => got.push(msg.value) });
  await wait(30);
  const p = await phone(room.code, 'Айбек');
  await wait(10);
  for (const name of ['own', 'public']) {
    net.servers[name].ids.get(`bilimarena-room-${room.code}`).drop();
  }
  await wait(TIMING.rejoin * 3);
  assert.equal(room.online(p.playerId), true);
  p.send({ type: 'answer', value: 42 });
  await wait(10);
  assert.deepEqual(got, [42]);
  assert.deepEqual(room.servers.sort(), ['own', 'public']);
  p.close(); room.close();
});
