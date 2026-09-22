import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../utils/i18n';
import { useSocket } from '../context/SocketContext';

const MIN_PLAYERS = 4;

export default function Lobby({ roomData, onStart, isHost, socket }) {
  const { t } = useTranslation();
  const { leaveRoom } = useSocket();
  const [copied, setCopied] = useState(false);

  // Ссылка работает и на GitHub Pages в подпапке, и локально
  const joinUrl = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?room=${roomData?.id}`;
  }, [roomData?.id]);

  if (!roomData) return null;

  const hostPlayer = roomData.players.find((p) => p.isHost);
  const normalPlayers = roomData.players.filter((p) => !p.isHost);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t('copy_link'), joinUrl);
    }
  };

  const row = {
    padding: '0.8rem 1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const avatarBox = {
    width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 'none'
  };

  return (
    <div className="container-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '520px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('lobby_title')}{' '}
            <span style={{ color: 'var(--accent-red)', letterSpacing: '0.2em', fontSize: '1.8rem' }}>{roomData.id}</span>
          </h2>

          <div style={{ margin: '1.2rem 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', lineHeight: 0 }}>
              <QRCodeSVG value={joinUrl} size={150} level="M" />
            </div>
          </div>

          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{t('invite_friends')}</p>
          <button className="btn-ghost" onClick={copyLink} style={{ marginTop: '0.6rem' }}>
            {copied ? `✅ ${t('link_copied')}` : t('copy_link')}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {hostPlayer && (
            <div style={{ ...row, border: '1px solid var(--accent-purple)', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={avatarBox}>
                  {hostPlayer.avatar
                    ? <img src={hostPlayer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '👤'}
                </div>
                <span style={{ fontWeight: 600 }}>{hostPlayer.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>{t('host_badge')}</span>
            </div>
          )}

          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {t('players')} ({normalPlayers.length})
          </h3>

          <AnimatePresence>
            {normalPlayers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
                style={row}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
                  <div style={avatarBox}>
                    {p.avatar
                      ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '👤'}
                  </div>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                {isHost && (
                  <button
                    className="btn-ghost danger"
                    onClick={() => socket.emit('kick_player', { targetId: p.id })}
                    title={t('kick')}
                    aria-label={`${t('kick')}: ${p.name}`}
                  >
                    ✕
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {normalPlayers.length === 0 && (
            <p className="text-secondary" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
              {t('invite_friends')}
            </p>
          )}
        </div>

        {isHost ? (
          <>
            <button className="btn-primary" style={{ width: '100%' }} onClick={onStart}>
              {t('start_game')}
            </button>
            {normalPlayers.length < MIN_PLAYERS && (
              <p className="text-secondary" style={{ fontSize: '0.78rem', textAlign: 'center', marginTop: '0.6rem' }}>
                {t('need_players')}
              </p>
            )}
          </>
        ) : (
          <p className="text-secondary" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            {t('waiting_host')}
          </p>
        )}

        <button
          className="btn-ghost"
          style={{ width: '100%', marginTop: '0.8rem' }}
          onClick={() => { if (window.confirm(t('leave_confirm'))) leaveRoom(); }}
        >
          {t('home')}
        </button>
      </motion.div>
    </div>
  );
}
