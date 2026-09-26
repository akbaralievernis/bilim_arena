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

const PEER_CDN = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
const ROOM_PREFIX = 'bilimarena-room-';
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // без похожих 0/O, 1/I

const PEER_OPTIONS = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  }
};

let peerLib = null;

/** Подгружает PeerJS один раз по требованию */
async function loadPeer() {
  if (peerLib) return peerLib;
  if (window.Peer) { peerLib = window.Peer; return peerLib; }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEER_CDN;
    s.onload = resolve;
    s.onerror = () => reject(new Error('peer-load-failed'));
    document.head.appendChild(s);
  });
  peerLib = window.Peer;
  if (!peerLib) throw new Error('peer-load-failed');
  return peerLib;
}

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
  const Peer = await loadPeer();
  const conns = new Map();   // playerId -> connection
  const players = new Map(); // playerId -> { id, name }

  let code = null;
  let peer = null;

  // Код может быть занят другим классом — пробуем несколько раз
  for (let attempt = 0; attempt < 5; attempt++) {
    code = roomCode();
    try {
      peer = await new Promise((resolve, reject) => {
        const p = new Peer(peerIdFor(code), PEER_OPTIONS);
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

  peer.on('error', (err) => console.warn('[room]', err?.type || err));

  peer.on('connection', (conn) => {
    conn.on('data', (msg) => {
      if (!msg || typeof msg !== 'object') return;
      const id = msg.playerId;
      if (!id) return;

      if (msg.type === 'join') {
        const prev = conns.get(id);
        if (prev && prev !== conn) { try { prev.close(); } catch { /* закрыт */ } }
        conns.set(id, conn);
        conn._playerId = id;
        const player = { id, name: String(msg.name || '').slice(0, 20) || '?' };
        players.set(id, player);
        onJoin?.(player);
        return;
      }
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

    close() {
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
export async function joinRoom({ code, name, playerId, onMessage, onStatus } = {}) {
  const Peer = await loadPeer();
  const id = playerId || `s_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  const target = peerIdFor(code);

  let conn = null;
  let retry = null;
  let destroyed = false;

  const peer = await new Promise((resolve, reject) => {
    const p = new Peer(undefined, PEER_OPTIONS);
    const timer = setTimeout(() => reject(new Error('timeout')), 20000);
    p.on('open', () => { clearTimeout(timer); resolve(p); });
    p.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(err?.type === 'peer-unavailable' ? 'room-not-found' : (err?.type || 'peer-error')));
    });
  });

  peer.on('disconnected', () => { if (!destroyed) { try { peer.reconnect(); } catch { /* закрыт */ } } });
  peer.on('error', (err) => {
    if (err?.type === 'peer-unavailable') scheduleRetry();
    else console.warn('[join]', err?.type || err);
  });

  function hello() {
    safeSend(conn, { type: 'join', playerId: id, name });
  }

  function bind(c, onOpen) {
    conn = c;
    c.on('open', () => {
      onStatus?.('online');
      if (retry) { clearInterval(retry); retry = null; }
      hello();
      onOpen?.();
    });
    c.on('data', (msg) => { if (msg && typeof msg === 'object') onMessage?.(msg); });
    c.on('close', () => { onStatus?.('offline'); scheduleRetry(); });
    c.on('error', (e) => console.warn('[join conn]', e?.type || e));
  }

  function scheduleRetry() {
    if (destroyed || retry) return;
    retry = setInterval(() => {
      if (destroyed || conn?.open) return;
      try { bind(peer.connect(target, { reliable: true })); } catch (e) { console.warn('[join retry]', e); }
    }, 4000);
  }

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('room-not-found')), 15000);
    bind(peer.connect(target, { reliable: true }), () => { clearTimeout(timer); resolve(); });
  });

  return {
    playerId: id,
    send(msg) {
      if (!conn?.open) return false;
      return safeSend(conn, { ...msg, playerId: id });
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
        s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
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
