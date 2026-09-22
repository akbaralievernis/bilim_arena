/**
 * Транспорт для связи между ведущим (host) и игроками (guest).
 *
 * По умолчанию используется PeerJS (WebRTC): браузеры соединяются напрямую,
 * никакой сервер и регистрация не нужны — публичный сигнальный сервер PeerJS
 * нужен только для установки соединения.
 *
 * Важное преимущество перед прежним вариантом (Supabase broadcast):
 * личные сообщения (роль, результат проверки комиссара) уходят ТОЛЬКО нужному
 * игроку, а не всем подряд. Подсмотреть чужую роль через консоль больше нельзя.
 */
import Peer from 'peerjs';

const PREFIX = 'bilimarena-mafia-';
export const peerIdForRoom = (code) => `${PREFIX}${String(code).toUpperCase()}`;

const PEER_OPTIONS = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  }
};

/** Ведущий: принимает подключения игроков */
export class HostTransport {
  /**
   * @param {object} opts
   * @param {string} opts.code            — код комнаты
   * @param {(payload:object)=>void} opts.onMessage  — сообщение от игрока
   * @param {(playerId:string)=>void} opts.onGuestLeft
   */
  constructor({ code, onMessage, onGuestLeft }) {
    this.code = String(code).toUpperCase();
    this.onMessage = onMessage;
    this.onGuestLeft = onGuestLeft || (() => {});
    this.peer = null;
    this.conns = new Map();      // playerId -> DataConnection
    this.destroyed = false;
  }

  start() {
    return new Promise((resolve, reject) => {
      const peer = new Peer(peerIdForRoom(this.code), PEER_OPTIONS);
      this.peer = peer;
      let settled = false;

      const fail = (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      };

      const timeout = setTimeout(() => fail(new Error('timeout')), 15000);

      peer.on('open', () => {
        clearTimeout(timeout);
        if (settled) return;
        settled = true;
        resolve(this.code);
      });

      peer.on('error', (err) => {
        clearTimeout(timeout);
        // Код комнаты уже занят другой игрой — пусть вызывающий возьмёт новый
        if (err?.type === 'unavailable-id') return fail(new Error('code-taken'));
        if (!settled) return fail(err);
        console.warn('[HostTransport]', err?.type || err);
      });

      peer.on('connection', (conn) => {
        conn.on('data', (raw) => {
          const payload = typeof raw === 'string' ? safeParse(raw) : raw;
          if (!payload) return;
          // Первое сообщение связывает соединение с игроком
          if (payload.playerId) {
            const prev = this.conns.get(payload.playerId);
            if (prev && prev !== conn) { try { prev.close(); } catch { /* уже закрыт */ } }
            this.conns.set(payload.playerId, conn);
            conn._playerId = payload.playerId;
          }
          this.onMessage(payload);
        });

        conn.on('close', () => {
          const id = conn._playerId;
          if (id && this.conns.get(id) === conn) {
            this.conns.delete(id);
            this.onGuestLeft(id);
          }
        });

        conn.on('error', (e) => console.warn('[HostTransport conn]', e?.type || e));
      });
    });
  }

  /** targetId === null → всем игрокам; иначе только одному */
  send(targetId, payload) {
    if (this.destroyed) return;
    if (targetId) {
      const conn = this.conns.get(targetId);
      if (conn && conn.open) trySend(conn, payload);
      return;
    }
    this.conns.forEach((conn) => { if (conn.open) trySend(conn, payload); });
  }

  isOnline(playerId) {
    const c = this.conns.get(playerId);
    return !!(c && c.open);
  }

  destroy() {
    this.destroyed = true;
    this.conns.forEach((c) => { try { c.close(); } catch { /* уже закрыт */ } });
    this.conns.clear();
    try { this.peer?.destroy(); } catch { /* уже уничтожен */ }
  }
}

/** Игрок: подключается к ведущему */
export class GuestTransport {
  /**
   * @param {object} opts
   * @param {string} opts.code
   * @param {string} opts.playerId
   * @param {(payload:object)=>void} opts.onMessage
   * @param {(state:'online'|'offline')=>void} opts.onStatus
   * @param {()=>object|null} opts.onReconnect — что отправить после переподключения
   */
  constructor({ code, playerId, onMessage, onStatus, onReconnect }) {
    this.code = String(code).toUpperCase();
    this.playerId = playerId;
    this.onMessage = onMessage;
    this.onStatus = onStatus || (() => {});
    this.onReconnect = onReconnect || (() => null);
    this.peer = null;
    this.conn = null;
    this.destroyed = false;
    this.retryTimer = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const peer = new Peer(undefined, PEER_OPTIONS);
      this.peer = peer;
      let settled = false;

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('timeout'));
      }, 20000);

      peer.on('open', () => {
        const conn = peer.connect(peerIdForRoom(this.code), { reliable: true });
        this._bindConn(conn, () => {
          if (settled) return;
          clearTimeout(timeout);
          settled = true;
          resolve();
        });
      });

      peer.on('error', (err) => {
        // Комнаты с таким кодом нет
        if (err?.type === 'peer-unavailable') {
          if (!settled) { clearTimeout(timeout); settled = true; reject(new Error('room-not-found')); }
          else this._scheduleRetry();
          return;
        }
        if (!settled) { clearTimeout(timeout); settled = true; reject(err); }
        else console.warn('[GuestTransport]', err?.type || err);
      });

      peer.on('disconnected', () => {
        if (!this.destroyed) { try { peer.reconnect(); } catch { /* уже закрыт */ } }
      });
    });
  }

  _bindConn(conn, onOpen) {
    this.conn = conn;
    conn.on('open', () => {
      this.onStatus('online');
      if (this.retryTimer) { clearInterval(this.retryTimer); this.retryTimer = null; }
      onOpen?.();
    });
    conn.on('data', (raw) => {
      const payload = typeof raw === 'string' ? safeParse(raw) : raw;
      if (payload) this.onMessage(payload);
    });
    conn.on('close', () => {
      this.onStatus('offline');
      this._scheduleRetry();
    });
    conn.on('error', (e) => console.warn('[GuestTransport conn]', e?.type || e));
  }

  /** Связь пропала (телефон заблокировался, Wi-Fi моргнул) — пробуем вернуться */
  _scheduleRetry() {
    if (this.destroyed || this.retryTimer) return;
    this.retryTimer = setInterval(() => {
      if (this.destroyed || !this.peer || this.peer.destroyed) return;
      if (this.conn && this.conn.open) return;
      try {
        const conn = this.peer.connect(peerIdForRoom(this.code), { reliable: true });
        this._bindConn(conn, () => {
          const hello = this.onReconnect();
          if (hello) this.send(hello);
        });
      } catch (e) {
        console.warn('[GuestTransport retry]', e);
      }
    }, 4000);
  }

  send(payload) {
    if (this.destroyed) return false;
    if (!this.conn || !this.conn.open) return false;
    return trySend(this.conn, { ...payload, playerId: this.playerId });
  }

  destroy() {
    this.destroyed = true;
    if (this.retryTimer) clearInterval(this.retryTimer);
    try { this.conn?.close(); } catch { /* уже закрыт */ }
    try { this.peer?.destroy(); } catch { /* уже уничтожен */ }
  }
}

function trySend(conn, payload) {
  try {
    conn.send(payload);
    return true;
  } catch (e) {
    console.warn('[Transport] send error', e);
    return false;
  }
}

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}
