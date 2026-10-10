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

const PEER_CDN = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
// SRI: браузер выполнит файл с CDN, только если он байт в байт совпадает с проверенным
const PEER_SRI = 'sha384-x0YgkOr/3UOZP2CRDxGW9e0Q+2Qjyr3uJrm4xU32Y7ZCNAo7Cc7bjhrZMi/dwczu';
const QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
const QR_SRI = 'sha384-8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k';
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

let peerLib = null;

/** Подгружает PeerJS один раз по требованию */
async function loadPeer() {
  if (peerLib) return peerLib;
  if (window.Peer) { peerLib = window.Peer; return peerLib; }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEER_CDN;
    s.integrity = PEER_SRI;
    s.crossOrigin = 'anonymous';
    s.onload = resolve;
    s.onerror = () => reject(new Error('peer-load-failed'));
    document.head.appendChild(s);
  });
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
export function acceptMessage(msg) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return null;
  if (typeof msg.type !== 'string' || msg.type.length > 40) return null;
  if (typeof msg.playerId !== 'string' || !PLAYER_ID.test(msg.playerId)) return null;
  let size = 0;
  try { size = JSON.stringify(msg).length; } catch { return null; }
  return size <= MAX_MESSAGE_CHARS ? msg : null;
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

const peerIdFor = (code) => ROOM_PREFIX + String(code).toUpperCase();

/** Ссылка для QR-кода: открывает контроллер с уже вписанным кодом */
export function joinUrl(code) {
  const base = window.location.href.replace(/[^/]*$/, '');
  return `${base}play.html?room=${String(code).toUpperCase()}`;
}

// ─── Доска (хост) ─────────────────────────────────────────────────────────────

/**
 * Создаёт комнату. Возвращает объект с кодом и методами отправки.
 * @param {object} handlers
 * @param {(player:{id,name})=>void} handlers.onJoin
 * @param {(playerId:string)=>void} handlers.onLeave
 * @param {(playerId:string, msg:object)=>void} handlers.onMessage
 */
export async function createRoom({ onJoin, onLeave, onMessage } = {}) {
  const [Peer, options] = await Promise.all([loadPeer(), peerOptions()]);
  const conns = new Map();   // playerId -> connection
  const players = new Map(); // playerId -> { id, name }
  const secrets = new Map(); // playerId -> секрет телефона, занявшего это место

  let code = null;
  let peer = null;

  // Код может быть занят другим классом — пробуем несколько раз
  for (let attempt = 0; attempt < 5; attempt++) {
    code = roomCode();
    try {
      peer = await new Promise((resolve, reject) => {
        const p = new Peer(peerIdFor(code), options);
        const timer = setTimeout(() => reject(new Error('timeout')), 15000);
        p.on('open', () => { clearTimeout(timer); resolve(p); });
        p.on('error', (err) => {
          clearTimeout(timer);
          reject(new Error(err?.type === 'unavailable-id' ? 'code-taken' : (err?.type || 'peer-error')));
        });
      });
      break;
    } catch (err) {
      try { peer?.destroy(); } catch { /* уже закрыт */ }
      peer = null;
      if (err.message !== 'code-taken') throw err;
    }
  }
  if (!peer) throw new Error('room-create-failed');

  // Сервер знакомства (PeerJS) нужен только НОВЫМ телефонам: по нему они находят
  // доску. Если доска потеряла с ним связь (вкладка ушла в фон, моргнул Wi-Fi),
  // уже подключённые играют дальше, а новые получают «комната не найдена».
  // Поэтому доска сама переподключается — с тем же кодом комнаты.
  let closed = false;
  let rejoin = null;
  const reconnect = () => {
    if (closed || peer.destroyed || !peer.disconnected) return;
    try { peer.reconnect(); } catch (e) { console.warn('[room reconnect]', e); }
  };
  const keepRegistered = () => {
    if (rejoin || closed) return;
    reconnect();
    rejoin = setInterval(() => {
      if (closed || !peer.disconnected) { clearInterval(rejoin); rejoin = null; return; }
      reconnect();
    }, 3000);
  };
  peer.on('disconnected', keepRegistered);
  peer.on('error', (err) => {
    console.warn('[room]', err?.type || err);
    if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err?.type)) keepRegistered();
  });
  const onVisible = () => { if (document.visibilityState === 'visible') keepRegistered(); };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', keepRegistered);

  peer.on('connection', (conn) => {
    const limit = rateLimiter();
    conn.on('data', (raw) => {
      const verdict = limit();
      if (verdict === 'close') { try { conn.close(); } catch { /* закрыт */ } return; }
      if (verdict === 'drop') return;
      const msg = acceptMessage(raw);
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
  });

  return {
    code,
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

    /** true, пока новые телефоны могут найти доску */
    get reachable() { return !peer.disconnected && !peer.destroyed; },

    close() {
      closed = true;
      if (rejoin) clearInterval(rejoin);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', keepRegistered);
      conns.forEach((c) => { try { c.close(); } catch { /* закрыт */ } });
      conns.clear();
      players.clear();
      try { peer.destroy(); } catch { /* закрыт */ }
    }
  };
}

// ─── Телефон ученика (гость) ──────────────────────────────────────────────────

/**
 * Подключение к комнате. Сам переподключается, если связь оборвалась
 * (телефон заблокировался, Wi-Fi моргнул).
 */
export async function joinRoom({ code, name, playerId, secret, onMessage, onStatus } = {}) {
  const [Peer, options] = await Promise.all([loadPeer(), peerOptions()]);
  const id = playerId || `s_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  // Секрет телефона: только он может вернуться на это место после обрыва
  const key = typeof secret === 'string' && secret ? secret : randomSecret();
  const target = peerIdFor(code);

  let conn = null;
  let lastOpen = null; // последнее соединение, которое действительно открылось
  let retry = null;
  let destroyed = false;
  const live = () => (conn?.open ? conn : lastOpen?.open ? lastOpen : null);

  const peer = await new Promise((resolve, reject) => {
    const p = new Peer(undefined, options);
    const timer = setTimeout(() => reject(new Error('timeout')), 20000);
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

  peer.on('disconnected', () => { if (!destroyed) { try { peer.reconnect(); } catch { /* закрыт */ } } });
  peer.on('error', (err) => {
    if (err?.type === 'peer-unavailable') { unavailable += 1; scheduleRetry(); }
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
      onStatus?.('online');
      if (retry) { clearInterval(retry); retry = null; }
      hello();
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
    }, 4000);
  }

  try {
    await new Promise((resolve, reject) => {
      // 25 с: через TURN в строгой сети соединение открывается дольше
      const timer = setTimeout(
        () => reject(new Error(boardFound || unavailable === 0 ? 'connect-timeout' : 'room-not-found')),
        25000
      );
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
 * Рисует QR-код ссылки. Использует библиотеку qrcode-generator с CDN,
 * а если её нет — показывает крупный код комнаты, чтобы урок не сорвался.
 */
export async function renderQR(el, text, size = 260) {
  try {
    if (!window.qrcode) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = QR_CDN;
        s.integrity = QR_SRI;
        s.crossOrigin = 'anonymous';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
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
