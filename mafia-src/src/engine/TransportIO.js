/**
 * TransportIO — повторяет знакомый движку API сервера Socket.io
 * (io.to(id).emit(...) / io.emit(...)), но отправляет данные через PeerJS.
 *
 * Личные сообщения (роль, результат проверки) уходят только нужному игроку.
 * Сообщения для ведущего сразу попадают в его локальную шину событий.
 */

/** Аватарки в игровых обновлениях не нужны — клиенты помнят их из лобби */
const light = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data.players)) {
    return { ...data, players: data.players.map(({ avatar, ...rest }) => rest) };
  }
  if (data.finalState?.players) {
    return { ...data, finalState: light(data.finalState) };
  }
  return data;
};

export default class TransportIO {
  /**
   * @param {object} transport — HostTransport
   * @param {object} eventBus  — локальная шина ведущего
   * @param {string} hostId    — id ведущего
   * @param {string} roomId    — код комнаты (io.to(roomId) = всем)
   */
  constructor(transport, eventBus, hostId, roomId) {
    this.transport = transport;
    this.eventBus = eventBus;
    this.hostId = hostId;
    this.roomId = roomId;
  }

  to(targetId) {
    const isBroadcast = !targetId || targetId === this.roomId;
    return {
      emit: (event, data) => {
        const payload = light(data);
        if (isBroadcast || targetId === this.hostId) {
          this.eventBus.emit(event, payload);
        }
        this.transport?.send(isBroadcast ? null : targetId, { event, data: payload });
      }
    };
  }

  emit(event, data) {
    const payload = light(data);
    this.eventBus.emit(event, payload);
    this.transport?.send(null, { event, data: payload });
  }
}
