import React, {
  createContext, useContext, useEffect,
  useState, useRef, useCallback, useMemo
} from 'react';
import GameEngine from '../engine/GameEngine';
import TransportIO from '../engine/TransportIO';
import AIBot from '../engine/AIBot.js';
import { HostTransport, GuestTransport } from '../net/Transport';

const SocketContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

const MIN_PLAYERS = 4;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const generateId = () => `p_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
const generateRoomCode = () => {
  // Буквы, которые трудно перепутать (без O/0, I/1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const store = {
  get(key, def = null) {
    try { return JSON.parse(sessionStorage.getItem(key)) ?? def; } catch { return def; }
  },
  set(key, val) {
    try { sessionStorage.setItem(key, JSON.stringify(val)); } catch { /* приватный режим */ }
  },
  del(key) {
    try { sessionStorage.removeItem(key); } catch { /* приватный режим */ }
  }
};

/** Постоянный id игрока в рамках вкладки — нужен для переподключения */
const getPersistentId = () => {
  let id = store.get('mafia_player_id');
  if (!id) { id = generateId(); store.set('mafia_player_id', id); }
  return id;
};

/** Аватарки тяжёлые — в игровых обновлениях они не нужны (клиент помнит их из лобби) */
const stripAvatars = (state) => {
  if (!state?.players) return state;
  return { ...state, players: state.players.map(({ avatar, ...rest }) => rest) };
};

/** Объединяем новых игроков со старыми, сохраняя ранее полученные аватарки */
const mergePlayers = (prevPlayers = [], nextPlayers = []) => {
  const byId = new Map(prevPlayers.map((p) => [p.id, p]));
  return nextPlayers.map((p) => (p.avatar ? p : { ...p, avatar: byId.get(p.id)?.avatar || null }));
};

const mergeState = (prev, next) => {
  if (!prev) return next;
  const merged = { ...prev, ...next };
  if (next.players) merged.players = mergePlayers(prev.players, next.players);
  return merged;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const SocketProvider = ({ children }) => {
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState('idle'); // idle | connecting | online | offline
  const [myPlayerId, setMyPlayerId] = useState(getPersistentId);
  const [isHostPlayer, setIsHostPlayer] = useState(false);

  const myId = useRef(myPlayerId);
  const isHost = useRef(false);
  const transportRef = useRef(null);
  const hostRoomRef = useRef(null);
  const engineRef = useRef(null);
  const pendingCb = useRef(null);

  const listenersRef = useRef({});
  const eventBus = useRef({
    on: (event, cb) => {
      if (!listenersRef.current[event]) listenersRef.current[event] = new Set();
      listenersRef.current[event].add(cb);
    },
    off: (event, cb) => {
      listenersRef.current[event]?.delete(cb);
    },
    emit: (event, data) => {
      listenersRef.current[event]?.forEach((cb) => cb(data));
    }
  });

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }, []);

  // ── ВЕДУЩИЙ: обработка сообщений от игроков ─────────────────────────────────
  const handleClientMsg = useCallback((payload) => {
    if (!isHost.current || !hostRoomRef.current) return;
    const { event, data = {}, replyId } = payload;
    const senderId = payload.playerId || data.senderId;
    const room = hostRoomRef.current;
    const transport = transportRef.current;

    const respond = (resp) => {
      if (!replyId) return;
      transport?.send(senderId, { event: 'callback_reply', data: resp });
    };

    const pushRoomUpdate = () => {
      setRoomData({ ...room });
      transport?.send(null, { event: 'room_updated', data: room });
    };

    // ── Вход в комнату (и возвращение после обрыва связи) ─────────────────────
    if (event === 'join_room') {
      const existing = room.players.find((p) => p.id === data.playerId);

      // Игрок вернулся после обрыва связи — отдаём ему текущее состояние
      if (existing) {
        existing.name = data.playerName || existing.name;
        respond({ success: true, room });
        pushRoomUpdate();
        if (engineRef.current) {
          transport?.send(existing.id, {
            event: 'state_update',
            data: stripAvatars(engineRef.current.state.getSanitizedState(existing.id))
          });
        }
        return;
      }

      if (room.status !== 'lobby') return respond({ success: false, error: 'game_started' });
      if (room.players.length >= room.maxPlayers) return respond({ success: false, error: 'room_full' });
      if (room.players.find((p) => p.name.toLowerCase() === String(data.playerName).toLowerCase())) {
        return respond({ success: false, error: 'name_taken' });
      }

      room.players.push({
        id: data.playerId,
        socketId: data.playerId,
        name: data.playerName,
        avatar: data.avatar || null,
        isHost: false
      });
      respond({ success: true, room });
      pushRoomUpdate();
      return;
    }

    // ── Ведущий удаляет игрока из лобби ───────────────────────────────────────
    if (event === 'kick_player') {
      if (room.status !== 'lobby') return;
      room.players = room.players.filter((p) => p.id !== data.targetId);
      transport?.send(data.targetId, { event: 'kicked', data: {} });
      pushRoomUpdate();
      return;
    }

    if (event === 'leave_room') {
      if (room.status === 'lobby') {
        room.players = room.players.filter((p) => p.id !== senderId);
        pushRoomUpdate();
      }
      return;
    }

    // ── Старт игры ────────────────────────────────────────────────────────────
    if (event === 'start_game') {
      if (room.status !== 'lobby') return;
      room.status = 'playing';

      const humanCount = room.players.filter((p) => !p.isHost).length;
      if (humanCount < MIN_PLAYERS) {
        room.players.push(...AIBot.generateBots(humanCount, MIN_PLAYERS));
      }

      pushRoomUpdate();

      const io = new TransportIO(transport, eventBus.current, myId.current, room.id);
      engineRef.current = new GameEngine(room.id, room.players, io);
      engineRef.current.start();
      return;
    }

    if (!engineRef.current) return;

    if (event === 'night_action') engineRef.current.handleNightAction(senderId, data.targetId);
    else if (event === 'day_vote') engineRef.current.handleDayVote(senderId, data.targetId);
    else if (event === 'send_chat_message') engineRef.current.handleChatMessage(senderId, data.message);
    else if (event === 'host_advance_night') engineRef.current.handleHostAdvanceNight();
    else if (event === 'host_start_voting') engineRef.current.handleHostStartVoting();
    else if (event === 'host_end_day') engineRef.current.handleHostEndDay();
    else if (event === 'reset_game') {
      engineRef.current.stop();          // гасим все таймеры прошлой игры
      engineRef.current = null;
      room.status = 'lobby';
      room.phase = 'lobby';
      room.subPhase = null;
      room.round = 0;
      room.gameOverData = null;
      room.roles = {};
      room.alivePlayers = [];
      room.votes = {};
      room.players = room.players
        .filter((p) => !p.isBot)          // боты набираются заново при старте
        .map((p) => ({ ...p, isAlive: true, role: null }));
      pushRoomUpdate();
    }
  }, []);

  // ── ИГРОК: обработка сообщений от ведущего ───────────────────────────────────
  const handleHostMsg = useCallback((payload) => {
    const { event, data } = payload;

    if (event === 'callback_reply') {
      const cb = pendingCb.current;
      pendingCb.current = null;
      cb?.(data);
      return;
    }

    if (event === 'room_updated') {
      setRoomData((prev) => mergeState(prev, data));
      return;
    }

    if (event === 'kicked') {
      store.del('mafia_session');
      setRoomData(null);
      showError('kicked');
      return;
    }

    if (event === 'error') {
      showError(data?.message || String(data));
      return;
    }

    eventBus.current.emit(event, data);

    switch (event) {
      case 'game_started':
      case 'state_update':
        setRoomData((prev) => mergeState(prev, data));
        break;
      case 'night_subphase_started':
        setRoomData((prev) => (prev ? { ...prev, phase: 'night', subPhase: data.subPhase } : prev));
        break;
      case 'day_started':
        setRoomData((prev) => (prev ? { ...prev, ...data, phase: 'day', subPhase: null } : prev));
        break;
      case 'voting_started':
        setRoomData((prev) => (prev ? { ...prev, phase: 'vote' } : prev));
        break;
      case 'game_over':
        setRoomData((prev) => mergeState(prev, { ...data.finalState, phase: 'end', gameOverData: data }));
        break;
      default:
        break;
    }
  }, [showError]);

  // ── Создание комнаты (ведущий) ───────────────────────────────────────────────
  const createRoom = useCallback(async (data, callback) => {
    setConnection('connecting');
    let lastErr = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode();
      const transport = new HostTransport({
        code,
        onMessage: (payload) => handleClientMsg(payload),
        onGuestLeft: () => { /* в лобби игрок остаётся: он может вернуться */ }
      });

      try {
        await transport.start();
        transportRef.current = transport;
        isHost.current = true;
        setIsHostPlayer(true);
        setConnection('online');

        const room = {
          id: code,
          players: [{
            id: myId.current, socketId: myId.current,
            name: data.playerName, avatar: data.avatar || null, isHost: true
          }],
          status: 'lobby',
          phase: 'lobby',
          maxPlayers: data.maxPlayers || 16
        };
        hostRoomRef.current = room;
        setRoomData({ ...room });
        store.set('mafia_session', { code, isHost: true, name: data.playerName });
        callback?.({ success: true, room });
        return;
      } catch (err) {
        lastErr = err;
        transport.destroy();
        if (err?.message !== 'code-taken') break; // другая ошибка — не перебираем коды
      }
    }

    setConnection('offline');
    callback?.({ success: false, error: lastErr?.message === 'timeout' ? 'no_connection' : 'create_failed' });
  }, [handleClientMsg]);

  // ── Вход в комнату (игрок) ───────────────────────────────────────────────────
  const joinRoom = useCallback(async (data, callback) => {
    const code = String(data.roomCode || '').toUpperCase().trim();
    setConnection('connecting');

    const transport = new GuestTransport({
      code,
      playerId: myId.current,
      onMessage: handleHostMsg,
      onStatus: (s) => setConnection(s),
      onReconnect: () => ({
        event: 'join_room',
        data: { playerName: data.playerName, avatar: data.avatar, playerId: myId.current },
        replyId: myId.current
      })
    });

    try {
      await transport.connect();
    } catch (err) {
      transport.destroy();
      setConnection('offline');
      callback?.({ success: false, error: err?.message === 'room-not-found' ? 'room_not_found' : 'no_connection' });
      return;
    }

    transportRef.current = transport;
    isHost.current = false;
    setIsHostPlayer(false);

    // Ждём ответ ведущего, но не вечно
    let answered = false;
    const timer = setTimeout(() => {
      if (answered) return;
      answered = true;
      pendingCb.current = null;
      callback?.({ success: false, error: 'host_no_answer' });
    }, 12000);

    pendingCb.current = (resp) => {
      if (answered) return;
      answered = true;
      clearTimeout(timer);
      if (resp?.success) {
        setConnection('online');
        store.set('mafia_session', { code, isHost: false, name: data.playerName });
      }
      callback?.(resp);
    };

    transport.send({
      event: 'join_room',
      data: { playerName: data.playerName, avatar: data.avatar, playerId: myId.current },
      replyId: myId.current
    });
  }, [handleHostMsg]);

  // ── Публичный «socket» (компоненты используют его как socket.io) ─────────────
  const socket = useMemo(() => ({
    id: myPlayerId,
    on: (event, cb) => eventBus.current.on(event, cb),
    off: (event, cb) => eventBus.current.off(event, cb),
    emit: (event, data = {}, callback) => {
      if (event === 'create_room') return createRoom(data, callback);
      if (event === 'join_room') return joinRoom(data, callback);

      if (isHost.current) {
        handleClientMsg({ event, data, playerId: myId.current });
      } else {
        const ok = transportRef.current?.send({ event, data });
        if (!ok) showError('no_connection');
      }
    }
  }), [createRoom, joinRoom, handleClientMsg, showError, myPlayerId]);

  // ─── ВЕДУЩИЙ: отражаем события движка в состоянии React ──────────────────────
  useEffect(() => {
    const bus = eventBus.current;

    const onMerge = (data) => setRoomData((prev) => mergeState(prev, data));
    const onNightSubphase = (data) => setRoomData((prev) => (prev ? { ...prev, phase: 'night', subPhase: data.subPhase } : prev));
    const onDayStarted = (data) => setRoomData((prev) => (prev ? { ...prev, ...data, phase: 'day', subPhase: null } : prev));
    const onVotingStarted = () => setRoomData((prev) => (prev ? { ...prev, phase: 'vote' } : prev));
    const onGameOver = (data) => setRoomData((prev) => mergeState(prev, { ...data.finalState, phase: 'end', gameOverData: data }));

    bus.on('state_update', onMerge);
    bus.on('game_started', onMerge);
    bus.on('night_subphase_started', onNightSubphase);
    bus.on('day_started', onDayStarted);
    bus.on('voting_started', onVotingStarted);
    bus.on('game_over', onGameOver);

    return () => {
      bus.off('state_update', onMerge);
      bus.off('game_started', onMerge);
      bus.off('night_subphase_started', onNightSubphase);
      bus.off('day_started', onDayStarted);
      bus.off('voting_started', onVotingStarted);
      bus.off('game_over', onGameOver);
    };
  }, []);

  // ─── Ведущий не должен закрыть вкладку случайно: игра живёт в его браузере ───
  useEffect(() => {
    const warn = (e) => {
      if (!isHost.current || !hostRoomRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  // ─── Уборка ──────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    engineRef.current?.stop();
    transportRef.current?.destroy();
  }, []);

  const leaveRoom = useCallback(() => {
    if (!isHost.current) transportRef.current?.send({ event: 'leave_room', data: {} });
    engineRef.current?.stop();
    engineRef.current = null;
    transportRef.current?.destroy();
    transportRef.current = null;
    hostRoomRef.current = null;
    isHost.current = false;
    setIsHostPlayer(false);
    setRoomData(null);
    setConnection('idle');
    store.del('mafia_session');
    // новый id — чтобы следующая игра началась «с чистого листа»
    const fresh = generateId();
    myId.current = fresh;
    setMyPlayerId(fresh);
    store.set('mafia_player_id', fresh);
  }, []);

  const value = useMemo(() => ({
    socket, roomData, setRoomData, error, connection,
    myPlayerId, isHostPlayer, leaveRoom,
    savedSession: store.get('mafia_session')
  }), [socket, roomData, error, connection, myPlayerId, isHostPlayer, leaveRoom]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
