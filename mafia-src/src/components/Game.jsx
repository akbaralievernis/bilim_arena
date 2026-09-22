import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, ShieldAlert } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useTranslation, roleName as tRole } from '../utils/i18n';
import PhaseTimer from './PhaseTimer';
import PlayerCard from './PlayerCard';

const ROLE_EMOJI = {
  don: '🕴️', mafia: '🔪', doctor: '💊', detective: '🔍',
  maniac: '🩸', putana: '💫', bodyguard: '🛡️', citizen: '🏠', spectator: '👁️'
};

const Game = React.memo(({ gameState, myId, onAction, isHost }) => {
  const { t } = useTranslation();
  const { socket, leaveRoom } = useSocket();

  const [selectedId, setSelectedId] = useState(null);
  const [hasActed, setHasActed] = useState(false);
  const [currentVotes, setCurrentVotes] = useState({});
  const [revoteData, setRevoteData] = useState(null);
  const [privateMsg, setPrivateMsg] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [events, setEvents] = useState([]);
  const [showRoleReveal, setShowRoleReveal] = useState(true);
  const chatEndRef = useRef(null);

  const { phase, round, roles, gameOverData, subPhase } = gameState || {};
  const alivePlayers = useMemo(() => gameState?.alivePlayers || [], [gameState?.alivePlayers]);
  const players = useMemo(() => gameState?.players || [], [gameState?.players]);
  const myRole = roles?.[myId] || 'citizen';
  const amIAlive = alivePlayers.includes(myId);
  const isNight = phase === 'night';
  const isVoting = phase === 'vote';

  const nameOf = useCallback(
    (id) => players.find((p) => p.id === id)?.name || '—',
    [players]
  );

  useEffect(() => {
    const timer = setTimeout(() => setShowRoleReveal(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ── Сброс выбора при смене фазы (подстройка состояния во время рендера) ────
  const [prevPhase, setPrevPhase] = useState(phase);
  if (phase !== prevPhase) {
    setPrevPhase(phase);
    setHasActed(false);
    setSelectedId(null);
    setCurrentVotes({});
    setRevoteData(null);
  }

  useEffect(() => {
    document.body.classList.toggle('night-mode', phase === 'night');
    return () => document.body.classList.remove('night-mode');
  }, [phase]);

  // ── События сервера ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const addEvent = (text) => setEvents((prev) => [...prev.slice(-5), { id: Date.now() + Math.random(), text }]);

    const onVotes = (votes) => {
      const counts = {};
      Object.values(votes).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
      setCurrentVotes(counts);
    };
    const onRevote = (data) => {
      setRevoteData(data);
      setCurrentVotes({});
      setHasActed(false);
      setSelectedId(null);
      addEvent(`🔁 ${t('revote')}`);
    };
    const onDay = (data) => {
      const killed = data?.multipleKills?.length ? data.multipleKills : (data?.killedPlayerId ? [data.killedPlayerId] : []);
      addEvent(killed.length
        ? `${t('killed_players')} ${killed.map(nameOf).join(', ')}`
        : t('nobody_died'));
    };
    const onVotingResult = (data) => {
      addEvent(data?.exiledPlayerId ? `${t('exiled_player')} ${nameOf(data.exiledPlayerId)}` : t('nobody_exiled'));
    };
    const onDetectiveResult = (data) => setPrivateMsg({ type: 'detective', ...data });
    const onDonResult = (data) => setPrivateMsg({ type: 'don', ...data });
    const onChat = (data) => setChatMessages((prev) => [...prev.slice(-49), data]);
    const onBlocked = (data) => setPrivateMsg({ type: 'blocked', ...data });

    socket.on('votes_updated', onVotes);
    socket.on('revote_started', onRevote);
    socket.on('day_started', onDay);
    socket.on('voting_result', onVotingResult);
    socket.on('detective_result', onDetectiveResult);
    socket.on('don_result', onDonResult);
    socket.on('chat_message', onChat);
    socket.on('action_blocked', onBlocked);

    return () => {
      socket.off('votes_updated', onVotes);
      socket.off('revote_started', onRevote);
      socket.off('day_started', onDay);
      socket.off('voting_result', onVotingResult);
      socket.off('detective_result', onDetectiveResult);
      socket.off('don_result', onDonResult);
      socket.off('chat_message', onChat);
      socket.off('action_blocked', onBlocked);
    };
  }, [socket, t, nameOf]);

  useEffect(() => {
    if (!privateMsg) return;
    const timer = setTimeout(() => setPrivateMsg(null), 8000);
    return () => clearTimeout(timer);
  }, [privateMsg]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [chatMessages]);

  const canSelect = useMemo(() => {
    if (!amIAlive) return false;
    if (isVoting) return true;
    if (isNight && subPhase) {
      if (subPhase === 'mafia') return myRole === 'mafia' || myRole === 'don';
      return subPhase === myRole;
    }
    return false;
  }, [amIAlive, isVoting, isNight, subPhase, myRole]);

  const handleSelect = useCallback((targetId) => {
    if (!canSelect || hasActed) return;
    if (isVoting && targetId === myId) return;          // за себя голосовать нельзя
    if (!alivePlayers.includes(targetId)) return;
    if (revoteData && !revoteData.candidates?.includes(targetId)) return;
    setSelectedId(targetId);
  }, [canSelect, hasActed, myId, isVoting, alivePlayers, revoteData]);

  const confirmAction = useCallback(() => {
    if (!selectedId) return;
    onAction(selectedId);
    setHasActed(true);
  }, [selectedId, onAction]);

  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !socket) return;
    socket.emit('send_chat_message', { message: text.slice(0, 200) });
    setChatInput('');
  }, [chatInput, socket]);

  if (!gameState || !roles) return null;

  // ── Показ роли в начале игры ───────────────────────────────────────────────
  if (showRoleReveal && round === 1 && phase !== 'end') {
    return (
      <div className="role-reveal-overlay">
        <motion.div initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }} transition={{ duration: 0.8, type: 'spring' }}>
          <div className="role-card">
            <h1 style={{ color: 'var(--accent-purple)', fontSize: '1.6rem', marginBottom: '1rem' }}>{t('your_role')}</h1>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{ROLE_EMOJI[myRole] || '🏠'}</div>
            <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase' }}>{tRole(myRole)}</h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '1rem', lineHeight: 1.4 }}>
              {t(`desc_${myRole}`)}
            </p>
          </div>
        </motion.div>
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="btn-primary" style={{ marginTop: '1.5rem' }}
          onClick={() => setShowRoleReveal(false)}
        >
          ✅ OK
        </motion.button>
      </div>
    );
  }

  // ── Экран конца игры ───────────────────────────────────────────────────────
  if (phase === 'end') {
    const winners = gameOverData?.winners;
    const isMafiaWin = winners === 'mafia';
    const isManiacWin = winners === 'maniac';
    const themeColor = isMafiaWin || isManiacWin ? 'var(--accent-red)' : 'var(--accent-blue)';
    const winTitle = isMafiaWin ? t('winners_mafia') : isManiacWin ? t('winners_maniac') : t('winners_citizens');
    const winText = isMafiaWin ? t('msg_win_mafia') : isManiacWin ? t('msg_win_maniac') : t('msg_win_citizens');

    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="end-screen"
        style={{
          background: isMafiaWin || isManiacWin
            ? 'radial-gradient(circle at center, #300 0%, #000 100%)'
            : 'radial-gradient(circle at center, #001a33 0%, #000 100%)'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="glass-panel end-card"
          style={{ border: `1px solid ${themeColor}`, boxShadow: `0 0 40px ${themeColor}33` }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
            {isMafiaWin ? '💀' : isManiacWin ? '🔪' : '🏆'}
          </div>

          <h1 style={{ fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', fontWeight: 900, color: themeColor, textShadow: `0 0 20px ${themeColor}` }}>
            {t('game_over')}
          </h1>
          <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', margin: '0.5rem 0 1rem' }}>{winTitle}</h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.4 }}>{winText}</p>

          <h3 style={{ fontSize: '0.8rem', color: themeColor, textTransform: 'uppercase', marginBottom: '0.8rem' }}>{t('roles_summary')}</h3>
          <div className="roles-summary">
            {players.filter((p) => !p.isHost).map((p) => (
              <div key={p.id} className="roles-summary__row">
                <span style={{ fontSize: '0.85rem' }}>{p.name}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 'bold' }}>{tRole(roles[p.id])}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button className="btn-ghost" onClick={leaveRoom}>{t('home')}</button>
            {isHost && (
              <button
                className="btn-primary"
                onClick={() => socket.emit('reset_game', {})}
                style={{ background: `linear-gradient(45deg, ${themeColor}, var(--accent-purple))` }}
              >
                {t('return_to_lobby')}
              </button>
            )}
          </div>
          {!isHost && (
            <p style={{ marginTop: '1.2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{t('waiting_host_lobby')}</p>
          )}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="game-container">
      <div className="glass-panel game-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isNight ? <Moon size={22} color="var(--accent-purple)" /> : <Sun size={22} color="#FFD700" />}
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {isNight ? t('phase_night') : isVoting ? t('phase_vote') : t('phase_day')}
            </h2>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.75rem' }}>{t('round')} {round}</p>
          <PhaseTimer socket={socket} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-secondary" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{t('your_role')}</p>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
            {ROLE_EMOJI[myRole]} {tRole(myRole)}
          </h3>
          {!amIAlive && <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>{t('dead')}</span>}
        </div>
      </div>

      <div className="role-hint">{t(`desc_${myRole}`)}</div>

      {!amIAlive && <div className="role-hint" style={{ borderColor: 'var(--accent-red)' }}>💀 {t('you_are_dead')}</div>}

      {events.length > 0 && (
        <div className="events-box">
          <div className="events-box__title">{t('events_title')}</div>
          {events.slice(-3).map((e) => <div key={e.id} className="events-box__row">{e.text}</div>)}
        </div>
      )}

      <AnimatePresence>
        {privateMsg && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="private-msg"
          >
            {privateMsg.type === 'detective'
              ? `🔍 ${nameOf(privateMsg.targetId)} — ${privateMsg.isMafia ? '🔴 ' + tRole('mafia') : '🟢 ' + tRole('citizen')}`
              : privateMsg.type === 'don'
                ? `🕴️ ${nameOf(privateMsg.targetId)} — ${privateMsg.isDetective ? '🔵 ' + tRole('detective') : '🟢 —'}`
                : '🚫 ' + t('desc_putana')}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {canSelect && !hasActed && (
          <motion.div
            key="actionBanner" transition={{ type: 'tween' }}
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel action-banner"
          >
            <ShieldAlert size={20} color="var(--accent-red)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t('action_required')}</p>
              <p className="text-secondary" style={{ fontSize: '0.75rem' }}>{isNight ? t('action_night') : t('action_vote')}</p>
            </div>
          </motion.div>
        )}
        {canSelect && hasActed && (
          <motion.div key="acted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="waiting-box">
            ✅ {t('action_accepted')}
          </motion.div>
        )}
        {isNight && !canSelect && amIAlive && (
          <motion.div key="sleeping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="waiting-box">
            {subPhase ? `${ROLE_EMOJI[subPhase] || '🌙'} ${tRole(subPhase)}...` : t('city_sleeps')}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid-players">
        {players.filter((p) => !p.isHost).map((p, index) => {
          const shownRole = roles[p.id];
          return (
            <PlayerCard
              key={p.id}
              player={p}
              index={index}
              isDead={!alivePlayers.includes(p.id)}
              isSelected={selectedId === p.id}
              onSelect={handleSelect}
              canSelect={canSelect && !hasActed}
              roleName={shownRole ? tRole(shownRole) : null}
              roleKey={shownRole}
              votes={currentVotes[p.id] || 0}
              isVoting={isVoting}
            />
          );
        })}
      </div>

      {(phase === 'day' || phase === 'vote') && amIAlive && (
        <div className="glass-panel chat-box">
          <div className="chat-box__list">
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: 'var(--accent-purple)' }}>{msg.senderName}:</strong> {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder={t('chat_placeholder')}
              className="input-glass"
              maxLength={200}
              style={{ flex: 1, padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            />
            <button className="btn-primary" onClick={sendChat} style={{ padding: '0.5rem 1rem' }}>➤</button>
          </div>
        </div>
      )}

      {selectedId && canSelect && !hasActed && (
        <div className="confirm-bar">
          <button className="btn-primary" onClick={confirmAction}>
            {t('confirm_prefix')} {nameOf(selectedId)}
          </button>
        </div>
      )}
    </div>
  );
});

export default Game;
