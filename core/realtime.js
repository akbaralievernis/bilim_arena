/**
 * Bilim Arena — связь «интерактивная доска телефоны учеников».
 *
 * Сейчас: прямое соединение браузеров (WebRTC через PeerJS). Сервер не нужен,
 * аккаунты не нужны, данные класса никуда не уходят.
 *
 * Когда появится backend: достаточно написать другой транспорт с теми же
 * методами createRoom/joinRoom — код доски и контроллера менять не придётся.
 *
 * Библиотека подгружается только при реальном подключении учеников,
 * чтобы не тормозить обычные страницы сайта.
 */

import { iceServers } from './turn.js';
import { SIGNAL } from './config.js';

// Библиотеки лежат на самом сайте (vendor/): школьная сеть может резать или
// тормозить CDN, а сайт уже открылся — значит, и они загрузятся (и есть в офлайн-кэше).
// Файлы байт в байт совпадают с npm-пакетами peerjs@1.5.5 и qrcode-generator@1.4.4 (SRI).
// (адрес модуля — через переменную: так сборщик «Мафии» не копирует эти файлы к себе,
// там PeerJS уже встроен и передаётся через window.Peer)
const HERE = import.meta.url;
const PEER_SRC = new URL('../vendor/peerjs-1.5.5.min.js', HERE).href;
const PEER_SRI = 'sha384-x0YgkOr/3UOZP2CRDxGW9e0Q+2Qjyr3uJrm4xU32Y7ZCNAo7Cc7bjhrZMi/dwczu';
const QR_SRC = new URL('../vendor/qrcode-generator-1.4.4.js', HERE).href;
const QR_SRI = 'sha384-8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k';

/** Сроки ожидания, мс (в тестах уменьшаются) */
export const TIMING = {
  ownOpen: 8000,      // свой сервер знакомства отвечает быстро
  publicOpen: 15000,  // общий PeerJS бывает медленным
  phoneQuick: 8000,   // телефон: есть запасной сервер — долго не ждём
  phoneOpen: 20000,   // телефон: последний шанс или повторная попытка
  connect: 25000,     // канал доска ↔ телефон (через TURN дольше)
  retry: 4000,        // телефон: повтор, пока доска не найдена
  rejoin: 3000,       // доска: переподключение к серверу знакомства
  heal: 20000,        // доска: повторная регистрация на сервере, который не ответил
  stale: 16000,       // доска: свой сервер отвечает на пинг каждые 5 с; молчит дольше — связь мертва
  script: 20000       // загрузка библиотеки
};
const ROOM_PREFIX = 'bilimarena-room-';
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // без похожих 0/O, 1/I

/**
 * Настройки PeerJS: STUN всегда, TURN — если задан в core/config.js (core/turn.js).
 * ?relay=1 в адресе доски или телефона — только через TURN: проверка, что связь
 * пройдёт и в сети, где прямое соединение заблокировано.
 */
async function peerOptions() {
  const relayOnly = new URLSearchParams(window.location.search).get('relay') === '1';
  return {
    debug: 0,
    config: { iceServers: await iceServers(), ...(relayOnly ? { iceTransportPolicy: 'relay' } : {}) }
  };
}

/**
 * Серверы знакомства по порядку: свой (core/config.js → SIGNAL), затем общий
 * PeerJS. Для проверки: ?signal=public — только общий, ?signal=own — только
 * свой, ?signal=local — сервер из signal/, запущенный на этом компьютере.
 */
const PUBLIC_SIGNAL = { name: 'public', options: {} };
export function signalServers(search = window.location.search, config = SIGNAL) {
  const mode = new URLSearchParams(search).get('signal');
  const own = config?.host
    ? { name: 'own', options: { host: config.host, port: config.port || 443, path: config.path || '/', secure: config.secure !== false, key: config.key || 'bilimarena' } }
    : null;
  if (mode === 'local') return [{ name: 'local', options: { host: '127.0.0.1', port: 8787, path: '/', secure: false, key: config?.key || 'bilimarena' } }];
  if (mode === 'public') return [PUBLIC_SIGNAL];
  if (mode === 'own') return [own || PUBLIC_SIGNAL];
  return own ? [own, PUBLIC_SIGNAL] : [PUBLIC_SIGNAL];
}

// Похожие кириллические буквы → латиница: ученик набирает код на русской или
// кыргызской раскладке («К7МА»), а коды комнат — латинские
const LOOKALIKE = { А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', У: 'Y', Ү: 'Y', Х: 'X', З: '3' };

/** Код комнаты из того, что ввёл ученик: верхний регистр, латиница, только буквы и цифры */
export function normalizeRoomCode(value) {
  return [...String(value ?? '').toUpperCase()].map((ch) => LOOKALIKE[ch] || ch).join('').replace(/[^A-Z0-9]/g, '');
}

/** Скрипт с проверкой SRI и ограничением по времени (иначе «Загрузка…» могла висеть вечно) */
function loadScript(src, integrity) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    const timer = setTimeout(() => { s.remove(); reject(new Error('script-timeout')); }, TIMING.script);
    s.src = src;
    s.integrity = integrity;
    s.onload = () => { clearTimeout(timer); resolve(); };
    s.onerror = () => { clearTimeout(timer); s.remove(); reject(new Error('peer-load-failed')); };
    document.head.appendChild(s);
  });
}

let peerLib = null;

/** Подгружает PeerJS один раз по требованию */
async function loadPeer() {
  if (peerLib) return peerLib;
  if (!window.Peer) await loadScript(PEER_SRC, PEER_SRI);
  peerLib = window.Peer;
  if (!peerLib) throw new Error('peer-load-failed');
  return peerLib;
}

// ─── Защита доски от лишних и поддельных сообщений ──────────────────────────
// Подключиться к комнате может любой, кто знает код, поэтому доска не доверяет
// телефонам: ограничивает размер и частоту сообщений, проверяет, что ответ
// пришёл именно по соединению этого игрока, и не даёт занять чужое место.

const MAX_PLAYERS = 200;
const MAX_MESSAGE_CHARS = 8000;
const RATE_WINDOW_MS = 10000;
const RATE_LIMIT = 60;        // сообщений за 10 с — с большим запасом для любой игры
const RATE_HARD_LIMIT = 300;  // заведомый спам — соединение закрывается
const PLAYER_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Имя ученика: без управляющих символов, без лишних пробелов, до 20 символов. */
export function cleanPlayerName(value) {
  const name = String(value ?? '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ').trim();
  return [...name].slice(0, 20).join('') || '?';
}

/** Сообщение телефона, которое доска готова обработать; null — отбросить. */
export function acceptMessage(msg, maxChars = MAX_MESSAGE_CHARS) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return null;
  if (typeof msg.type !== 'string' || msg.type.length > 40) return null;
  if (typeof msg.playerId !== 'string' || !PLAYER_ID.test(msg.playerId)) return null;
  let size = 0;
  try { size = JSON.stringify(msg).length; } catch { return null; }
  return size <= maxChars ? msg : null;
}

/** Счётчик сообщений одного соединения: 'ok' | 'drop' | 'close'. */
export function rateLimiter(now = () => Date.now()) {
  let windowStart = now();
  let count = 0;
  return () => {
    const t = now();
    if (t - windowStart > RATE_WINDOW_MS) { windowStart = t; count = 0; }
    count += 1;
    if (count > RATE_HARD_LIMIT) return 'close';
    return count > RATE_LIMIT ? 'drop' : 'ok';
  };
}

const randomSecret = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const roomCode = (len = 4) =>
  Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

const peerIdFor = (code, prefix = ROOM_PREFIX) => prefix + String(code).toUpperCase();

/** Ссылка для QR-кода: открывает контроллер с уже вписанным кодом */
export function joinUrl(code, server = null) {
  const base = window.location.href.replace(/[^/]*$/, '');
  const params = new URLSearchParams({ room: String(code).toUpperCase() });
  // Комната на общем сервере (свой не ответил) — телефон сразу идёт туда
  if (server === 'public' && SIGNAL?.host) params.set('s', 'public');
  // Режимы проверки переходят на телефон вместе со ссылкой
  const here = new URLSearchParams(window.location.search);
  for (const k of ['signal', 'relay']) if (here.get(k)) params.set(k, here.get(k));
  return `${base}play.html?${params}`;
}

// ─── Доска (хост) ─────────────────────────────────────────────────────────────

/** Первая открывшаяся регистрация или null, если не открылась ни одна */
function firstOpen(regs) {
  return new Promise((resolve) => {
    let left = regs.length;
    if (!left) resolve(null);
    regs.forEach((r) => r.ready.then((ok) => {
      if (ok) resolve(r);
      else if (--left === 0) resolve(null);
    }));
  });
}

/**
 * Создаёт комнату. Возвращает объект с кодом и методами отправки.
 * @param {object} handlers
 * @param {(player:{id,name})=>void} handlers.onJoin
 * @param {(playerId:string)=>void} handlers.onLeave
 * @param {(playerId:string, msg:object)=>void} handlers.onMessage
 */
export async function createRoom({ onJoin, onLeave, onMessage, prefix = ROOM_PREFIX, maxMessage = MAX_MESSAGE_CHARS } = {}) {
  const [Peer, baseOptions] = await Promise.all([loadPeer(), peerOptions()]);
  const conns = new Map();   // playerId -> connection
  const players = new Map(); // playerId -> { id, name }
  const secrets = new Map(); // playerId -> секрет телефона, занявшего это место

  let closed = false;
  let regs = [];

  // Комната регистрируется сразу на всех серверах знакомства (свой + общий).
  // Телефон найдёт доску на любом из них: если один сервер моргнул или телефон
  // до него не достучался, есть второй. Комнате хватает одного сервера.
  let code = null;
  let lastError = null;
  for (let attempt = 0; attempt < 5 && !closed; attempt++) {
    code = roomCode();
    const tries = signalServers().map((candidate) => register(candidate, code));
    const first = await firstOpen(tries);
    if (first) { regs = tries; break; }
    tries.forEach((r) => r.stop());
    lastError = tries.find((r) => r.error)?.error || null;
    // Код занят другим классом — пробуем другой; иначе ни один сервер не ответил
    if (!tries.some((r) => r.taken)) break;
  }
  if (!regs.length) throw lastError || new Error('room-create-failed');
  const server = regs.find((r) => r.reachable())?.name || null;

  /**
   * Регистрация кода на одном сервере. Сервер знакомства нужен только НОВЫМ
   * телефонам: по нему они находят доску. Если доска потеряла с ним связь
   * (вкладка ушла в фон, моргнул Wi-Fi), уже подключённые играют дальше, а
   * доска сама переподключается с тем же кодом. Сервер, не ответивший при
   * создании комнаты, пробуется снова каждые TIMING.heal.
   */
  function register(candidate, roomId) {
    const reg = { name: candidate.name, peer: null, ever: false, taken: false, error: null, settled: false, stopped: false };
    let settle = () => {};
    reg.ready = new Promise((resolve) => { settle = (ok) => { if (!reg.settled) { reg.settled = true; resolve(ok); } }; });
    // Свой токен на всё время урока: сервер узнаёт доску и пускает её обратно
    // на тот же код (иначе после обрыва код мог считаться «занятым»)
    const token = randomSecret();
    const limit = candidate.name === 'public' ? TIMING.publicOpen : TIMING.ownOpen;
    let watch = null;
    let heal = null;
    let since = 0;

    // Свой сервер отвечает на каждый пинг PeerJS (signal/: HEARTBEAT → PONG), поэтому
    // молчание означает «зависшее» соединение: после обрыва Wi-Fi сокет часто
    // не закрывается сам, и доска иначе долго считала бы себя доступной.
    const pongs = candidate.name !== 'public';
    const alive = (p) => !pongs || !p._baSeen || Date.now() - p._baSeen < TIMING.stale;
    const online = () => globalThis.navigator?.onLine !== false;
    const reachable = () => !!reg.peer && reg.peer.open && !reg.peer.disconnected && !reg.peer.destroyed && alive(reg.peer) && online();
    const watchSocket = (p) => {
      const ws = p.socket?._socket;
      if (!pongs || typeof ws?.addEventListener !== 'function') return; // другая версия PeerJS — без проверки
      p._baSeen = Date.now();
      ws.addEventListener('message', () => { p._baSeen = Date.now(); });
    };
    const stopWatch = () => { if (watch) clearInterval(watch); watch = null; };
    const drop = (p) => {
      if (reg.peer === p) reg.peer = null; // до destroy: его событие «disconnected» уже не наше
      try { p.destroy(); } catch { /* закрыт */ }
    };

    const start = () => {
      if (closed || reg.stopped) return;
      since = Date.now();
      const p = new Peer(peerIdFor(roomId, prefix), { ...baseOptions, ...candidate.options, token });
      reg.peer = p;
      let opened = false;
      const timer = setTimeout(() => { if (!opened && reg.peer === p) lost(p, new Error('timeout')); }, limit);
      p.on('open', () => {
        clearTimeout(timer);
        if (reg.peer !== p) return;
        opened = true;
        watchSocket(p);
        reg.ever = true;
        reg.error = null;
        settle(true);
      });
      p.on('connection', onConnection);
      p.on('disconnected', () => { if (reg.peer === p && opened) guard(); });
      p.on('error', (err) => {
        if (reg.peer !== p) return;
        if (!opened) {
          clearTimeout(timer);
          // Код занят другим классом (до первой регистрации) — на этом сервере комнаты не будет
          if (!reg.ever && err?.type === 'unavailable-id') reg.taken = true;
          lost(p, new Error(err?.type === 'unavailable-id' ? 'code-taken' : (err?.type || 'peer-error')));
          return;
        }
        console.warn('[room]', candidate.name, err?.type || err);
        guard();
      });
    };

    /** Регистрация не открылась */
    function lost(p, err) {
      reg.error = err;
      drop(p);
      settle(false);
      if (reg.taken || closed || reg.stopped) return;
      if (reg.ever) guard();                       // была — восстанавливаем
      else { clearTimeout(heal); heal = setTimeout(start, TIMING.heal); } // не было — пробуем изредка
    }

    /** Доска была на сервере и потеряла его: переподключение, а если «зависло» — новая регистрация */
    // Только disconnect/reconnect: destroy() разорвал бы связь с уже подключёнными телефонами
    function check() {
      if (closed || reg.stopped || reachable()) { stopWatch(); return; }
      if (!online()) return; // ждём сеть
      const p = reg.peer;
      if (!p || p.destroyed) { start(); return; }
      const hung = !p.disconnected && (p.open ? !alive(p) : Date.now() - since > limit);
      if (!p.disconnected && !hung) return; // ещё подключаемся
      since = Date.now();
      try {
        if (!p.disconnected) p.disconnect();
        p.reconnect();
      } catch { drop(p); start(); }
    }
    function guard() {
      if (watch || closed || reg.stopped) return;
      check();
      if (!reachable()) watch = setInterval(check, TIMING.rejoin);
    }

    reg.keep = () => { if (reg.ever) guard(); };
    /** Сеть вернулась: сокет мог «зависнуть» — регистрируемся заново (те же код и токен) */
    reg.refresh = () => {
      const p = reg.peer;
      if (!reg.ever || closed || reg.stopped || !p || p.destroyed) return;
      since = Date.now();
      try { if (!p.disconnected) p.disconnect(); p.reconnect(); } catch { /* сторож повторит */ }
      guard();
    };
    reg.stop = () => {
      reg.stopped = true;
      clearTimeout(heal);
      stopWatch();
      if (reg.peer) drop(reg.peer);
    };
    reg.reachable = reachable;
    start();
    return reg;
  }

  const keepAll = () => regs.forEach((r) => r.keep?.());
  const refreshAll = () => regs.forEach((r) => r.refresh?.());
  const onVisible = () => { if (document.visibilityState === 'visible') keepAll(); };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', refreshAll);
  // Сторож комнаты: тихо «умершая» регистрация (без события disconnected) тоже восстанавливается
  const patrol = setInterval(keepAll, TIMING.rejoin);

  function onConnection(conn) {
    const limit = rateLimiter();
    conn.on('data', (raw) => {
      const verdict = limit();
      if (verdict === 'close') { try { conn.close(); } catch { /* закрыт */ } return; }
      if (verdict === 'drop') return;
      const msg = acceptMessage(raw, maxMessage);
      if (!msg) return;
      const id = msg.playerId;

      if (msg.type === 'join') {
        const secret = typeof msg.secret === 'string' ? msg.secret.slice(0, 64) : '';
        // Место уже занято другим телефоном — без его секрета не пускаем
        if (secrets.has(id) && secrets.get(id) !== secret) { try { conn.close(); } catch { /* закрыт */ } return; }
        if (!players.has(id) && players.size >= MAX_PLAYERS) { try { conn.close(); } catch { /* закрыт */ } return; }
        // Одно соединение — один игрок: сменить имя игрока на чужое нельзя
        if (conn._playerId && conn._playerId !== id) return;
        secrets.set(id, secret);
        const prev = conns.get(id);
        if (prev && prev !== conn) { try { prev.close(); } catch { /* закрыт */ } }
        conns.set(id, conn);
        conn._playerId = id;
        const player = { id, name: cleanPlayerName(msg.name) };
        players.set(id, player);
        onJoin?.(player);
        return;
      }
      // Ответ засчитывается, только если пришёл по соединению этого игрока
      if (conn._playerId !== id || conns.get(id) !== conn) return;
      onMessage?.(id, msg);
    });

    conn.on('close', () => {
      const id = conn._playerId;
      if (id && conns.get(id) === conn) {
        conns.delete(id);
        onLeave?.(id);
      }
    });
    conn.on('error', (e) => console.warn('[room conn]', e?.type || e));
  }

  return {
    code,
    /** Какой сервер знакомства у комнаты: 'own' | 'public' | 'local' */
    server,
    get playerCount() { return players.size; },
    players: () => [...players.values()],
    online: (id) => !!conns.get(id)?.open,

    /** playerId === null → всем ученикам */
    send(playerId, msg) {
      if (playerId) {
        const c = conns.get(playerId);
        if (c?.open) safeSend(c, msg);
        return;
      }
      conns.forEach((c) => { if (c.open) safeSend(c, msg); });
    },

    /** Каждому своё сообщение (например, персональный экран) */
    sendEach(builder) {
      conns.forEach((c, id) => {
        if (!c.open) return;
        const msg = builder(id);
        if (msg) safeSend(c, msg);
      });
    },

    /** true, пока новые телефоны могут найти доску (хотя бы на одном сервере) */
    get reachable() { return regs.some((r) => r.reachable()); },
    /** На каких серверах знакомства доску сейчас можно найти */
    get servers() { return regs.filter((r) => r.reachable()).map((r) => r.name); },

    close() {
      closed = true;
      clearInterval(patrol);
      regs.forEach((r) => r.stop());
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', refreshAll);
      conns.forEach((c) => { try { c.close(); } catch { /* закрыт */ } });
      conns.clear();
      players.clear();
    }
  };
}

// ─── Телефон ученика (гость) ──────────────────────────────────────────────────

/**
 * Подключение к комнате. Сам переподключается, если связь оборвалась
 * (телефон заблокировался, Wi-Fi моргнул).
 */
export async function joinRoom({ code, name, playerId, secret, onMessage, onStatus, server = null, prefix = ROOM_PREFIX } = {}) {
  const [Peer, baseOptions] = await Promise.all([loadPeer(), peerOptions()]);
  let servers = signalServers();
  // Подсказка из QR: комната на общем сервере — начинаем с него
  if (server) servers = [...servers.filter((s) => s.name === server), ...servers.filter((s) => s.name !== server)];
  const room = normalizeRoomCode(code);
  const opts = { code: room, name, playerId, secret, onMessage, onStatus, prefix };

  // Первый проход — быстрый: есть запасной сервер, долго не ждём.
  // Второй — терпеливый, только к серверам, до которых телефон не достучался:
  // медленный интернет не должен превращаться в «комната не найдена».
  const misses = new Map(); // сервер → причина
  const attempt = async (candidate, patient) => {
    try {
      const last = patient || candidate === servers[servers.length - 1];
      return await joinVia(Peer, { ...baseOptions, ...candidate.options }, {
        ...opts, quickMiss: !last, openTimeout: last ? TIMING.phoneOpen : TIMING.phoneQuick
      });
    } catch (err) {
      // Доска нашлась, но канал не открылся — другой сервер не поможет
      if (err.message === 'connect-timeout') throw err;
      misses.set(candidate.name, err.message);
      console.warn('[join] не получилось через', candidate.name, err.message);
      return null;
    }
  };

  for (const candidate of servers) {
    onStatus?.('searching');
    const joined = await attempt(candidate, false);
    if (joined) return joined;
  }
  for (const candidate of servers.filter((c) => misses.get(c.name) !== 'room-not-found')) {
    onStatus?.('retrying');
    const joined = await attempt(candidate, true);
    if (joined) return joined;
  }
  // «Комнаты нет» — только если каждый сервер ответил, что её нет
  if ([...misses.values()].every((m) => m === 'room-not-found')) throw new Error('room-not-found');
  if ([...misses.values()].some((m) => m === 'room-not-found')) throw new Error('room-not-found-or-network');
  throw new Error('no-connection');
}

/**
 * Подключение через один сервер знакомства.
 * quickMiss — есть запасной сервер: если комнаты здесь нет (два ответа
 * «адресата нет» подряд), сразу сдаёмся, чтобы проверить следующий.
 */
async function joinVia(Peer, options, { code, name, playerId, secret, onMessage, onStatus, quickMiss = false, openTimeout = TIMING.phoneOpen, prefix = ROOM_PREFIX }) {
  const id = playerId || `s_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  // Секрет телефона: только он может вернуться на это место после обрыва
  const key = typeof secret === 'string' && secret ? secret : randomSecret();
  const target = peerIdFor(code, prefix);

  let conn = null;
  let lastOpen = null; // последнее соединение, которое действительно открылось
  let retry = null;
  let destroyed = false;
  const live = () => (conn?.open ? conn : lastOpen?.open ? lastOpen : null);

  const peer = await new Promise((resolve, reject) => {
    const p = new Peer(undefined, options);
    // Свой сервер отвечает быстро; если молчит — не держим ученика, есть запасной
    const timer = setTimeout(() => { try { p.destroy(); } catch { /* закрыт */ } reject(new Error('timeout')); }, openTimeout);
    p.on('open', () => { clearTimeout(timer); resolve(p); });
    p.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(err?.type === 'peer-unavailable' ? 'room-not-found' : (err?.type || 'peer-error')));
    });
  });

  // «Комнаты нет» — только если сервер знакомства ни разу не нашёл доску.
  // Если доска нашлась, но канал не успел открыться — это плохая связь.
  let boardFound = false;
  let unavailable = 0;
  let missNow = null; // быстрый отказ: комнаты на этом сервере нет

  peer.on('disconnected', () => { if (!destroyed) { try { peer.reconnect(); } catch { /* закрыт */ } } });
  peer.on('error', (err) => {
    if (err?.type === 'peer-unavailable') {
      unavailable += 1;
      if (quickMiss && !boardFound && unavailable >= 2 && missNow) { missNow(); return; }
      scheduleRetry();
    }
    else console.warn('[join]', err?.type || err);
  });

  function hello() {
    safeSend(conn, { type: 'join', playerId: id, name, secret: key });
  }

  function bind(c, onOpen) {
    conn = c;
    // Сервер передал предложение доске — значит, комната существует
    c.on('iceStateChanged', () => { boardFound = true; });
    c.on('open', () => {
      lastOpen = c;
      if (retry) { clearInterval(retry); retry = null; }
      hello(); // сначала представиться: иначе доска не примет сообщения, отправленные в onStatus
      onStatus?.('online');
      onOpen?.();
    });
    c.on('data', (msg) => { if (msg && typeof msg === 'object') onMessage?.(msg); });
    // Закрылось старое соединение, а живое ещё есть — статус не трогаем
    c.on('close', () => { if (live()) return; onStatus?.('offline'); scheduleRetry(); });
    c.on('error', (e) => console.warn('[join conn]', e?.type || e));
  }

  function scheduleRetry() {
    if (destroyed || retry) return;
    retry = setInterval(() => {
      if (destroyed || live()) { if (live()) { clearInterval(retry); retry = null; onStatus?.('online'); } return; }
      try { bind(peer.connect(target, { reliable: true })); } catch (e) { console.warn('[join retry]', e); }
    }, TIMING.retry);
  }

  try {
    await new Promise((resolve, reject) => {
      // 25 с: через TURN в строгой сети соединение открывается дольше
      const timer = setTimeout(
        () => reject(new Error(boardFound || unavailable === 0 ? 'connect-timeout' : 'room-not-found')),
        TIMING.connect
      );
      missNow = () => { clearTimeout(timer); reject(new Error('room-not-found')); };
      bind(peer.connect(target, { reliable: true }), () => { clearTimeout(timer); resolve(); });
    });
  } catch (err) {
    destroyed = true;
    if (retry) clearInterval(retry);
    try { peer.destroy(); } catch { /* закрыт */ }
    throw err;
  }

  return {
    playerId: id,
    secret: key,
    send(msg) {
      const c = live();
      if (!c) return false;
      return safeSend(c, { ...msg, playerId: id });
    },
    close() {
      destroyed = true;
      if (retry) clearInterval(retry);
      try { conn?.close(); } catch { /* закрыт */ }
      try { peer.destroy(); } catch { /* закрыт */ }
    }
  };
}

function safeSend(conn, msg) {
  try { conn.send(msg); return true; } catch (e) { console.warn('[realtime] send', e); return false; }
}

// ─── QR-код (без внешних сервисов, работает офлайн) ───────────────────────────

/**
 * Рисует QR-код ссылки. Использует библиотеку qrcode-generator (vendor/),
 * а если её нет — показывает крупный код комнаты, чтобы урок не сорвался.
 */
export async function renderQR(el, text, size = 260) {
  try {
    if (!window.qrcode) await loadScript(QR_SRC, QR_SRI);
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    const svg = el.querySelector('svg');
    if (svg) {
      svg.style.width = size + 'px';
      svg.style.height = size + 'px';
      svg.style.display = 'block';
    }
    return true;
  } catch {
    el.innerHTML = '';
    return false;
  }
}
