/**
 * Транспорт для связи между ведущим (host) и игроками (guest).
 *
 * Использует общий модуль сайта core/realtime.js — тот же, что урок «доска +
 * телефоны». Оттуда «Мафия» получает:
 *   • два сервера знакомства (свой и общий PeerJS) и восстановление связи
 *     ведущего без потери уже подключённых игроков;
 *   • честные ошибки: «комната не найдена» только когда её действительно нет;
 *   • код, набранный кириллицей («К7МА»), работает;
 *   • ведущий знает, по какому соединению пришло сообщение: проголосовать или
 *     сделать ночной ход от имени другого игрока нельзя.
 *
 * Личные сообщения (роль, результат проверки комиссара) уходят только нужному игроку.
 */
import Peer from 'peerjs';
import { createRoom, joinRoom, normalizeRoomCode } from '../../../core/realtime.js';

// PeerJS уже встроен в сборку — общий модуль не будет загружать его отдельно
if (typeof window !== 'undefined' && !window.Peer) window.Peer = Peer;

const PREFIX = 'bilimarena-mafia-';
// Аватарка (JPEG 96 px) в сообщении о входе — несколько КБ
const MAX_MESSAGE = 24000;

export { normalizeRoomCode };

/** Ведущий: принимает подключения игроков */
export class HostTransport {
  /**
   * @param {object} opts
   * @param {(payload:object)=>void} opts.onMessage  — сообщение от игрока (playerId проверен)
   * @param {(playerId:string)=>void} opts.onGuestLeft
   * @param {string} opts.hostId — id ведущего: по сети под ним войти нельзя
   */
  constructor({ onMessage, onGuestLeft, hostId }) {
    this.onMessage = onMessage;
    this.hostId = hostId;
    this.onGuestLeft = onGuestLeft || (() => {});
    this.room = null;
    this.code = null;
    this.destroyed = false;
  }

  /** Создаёт комнату; код выбирается свободный. Возвращает код. */
  async start() {
    this.room = await createRoom({
      prefix: PREFIX,
      maxMessage: MAX_MESSAGE,
      onLeave: (id) => this.onGuestLeft(id),
      // playerId — от соединения игрока, а не из текста сообщения
      onMessage: (playerId, msg) => {
        if (msg.type !== 'm' || !msg.p || typeof msg.p !== 'object') return;
        if (playerId === this.hostId) return; // чужой телефон выдаёт себя за ведущего
        this.onMessage({ ...msg.p, playerId });
      }
    });
    if (this.destroyed) { this.room.close(); throw new Error('closed'); }
    this.code = this.room.code;
    return this.code;
  }

  /** targetId === null → всем игрокам; иначе только одному */
  send(targetId, payload) {
    if (this.destroyed || !this.room) return;
    this.room.send(targetId || null, payload);
  }

  isOnline(playerId) {
    return !!this.room?.online(playerId);
  }

  /** Могут ли новые игроки сейчас найти комнату */
  get reachable() {
    return !!this.room?.reachable;
  }

  destroy() {
    this.destroyed = true;
    this.room?.close();
    this.room = null;
  }
}

/** Игрок: подключается к ведущему */
export class GuestTransport {
  /**
   * @param {object} opts
   * @param {string} opts.code
   * @param {string} opts.playerId
   * @param {string} opts.name
   * @param {string} [opts.secret] — секрет этого телефона (вернуться на своё место после обрыва)
   * @param {(payload:object)=>void} opts.onMessage
   * @param {(state:'online'|'offline'|'searching'|'retrying')=>void} opts.onStatus
   * @param {()=>object|null} opts.onReconnect — что отправить после переподключения
   */
  constructor({ code, playerId, name, secret, onMessage, onStatus, onReconnect }) {
    this.code = normalizeRoomCode(code);
    this.playerId = playerId;
    this.name = name;
    this.secret = secret;
    this.onMessage = onMessage;
    this.onStatus = onStatus || (() => {});
    this.onReconnect = onReconnect || (() => null);
    this.room = null;
    this.destroyed = false;
  }

  async connect() {
    let opened = false;
    this.room = await joinRoom({
      prefix: PREFIX,
      code: this.code,
      name: this.name,
      playerId: this.playerId,
      secret: this.secret,
      onMessage: (payload) => this.onMessage(payload),
      onStatus: (s) => {
        // После обрыва связи — снова представиться ведущему (он вернёт состояние игры)
        if (s === 'online' && opened) {
          const hello = this.onReconnect();
          if (hello) this.send(hello);
        }
        if (s === 'online') opened = true;
        this.onStatus(s);
      }
    });
    if (this.destroyed) { this.room.close(); throw new Error('closed'); }
    this.secret = this.room.secret;
    return this.room;
  }

  send(payload) {
    if (this.destroyed || !this.room) return false;
    return this.room.send({ type: 'm', p: payload });
  }

  destroy() {
    this.destroyed = true;
    this.room?.close();
    this.room = null;
  }
}
