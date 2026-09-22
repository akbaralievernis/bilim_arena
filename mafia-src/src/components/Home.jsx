import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useTranslation } from '../utils/i18n';

const LANGS = [
  { code: 'ky', flag: '🇰🇬' },
  { code: 'ru', flag: '🇷🇺' },
  { code: 'de', flag: '🇩🇪' }
];

export default function Home() {
  const [name, setName] = useState(() => localStorage.getItem('playerName') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('playerAvatar') || null);
  const [code, setCode] = useState(() => {
    // Код из ссылки/QR: ?room=ABCD или #/?room=ABCD
    const fromSearch = new URLSearchParams(window.location.search).get('room');
    const hash = window.location.hash;
    const fromHash = hash.includes('?') ? new URLSearchParams(hash.slice(hash.indexOf('?'))).get('room') : null;
    if (fromSearch || fromHash) return (fromSearch || fromHash).toUpperCase();
    // После перезагрузки страницы код прошлой комнаты подставляется сам,
    // чтобы игрок вернулся в игру одним нажатием (ведущий его узнает по id).
    try {
      const saved = JSON.parse(sessionStorage.getItem('mafia_session') || 'null');
      if (saved && !saved.isHost) return String(saved.code).toUpperCase();
    } catch { /* приватный режим */ }
    return '';
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileInputRef = useRef(null);

  const { t, lang, setLanguage } = useTranslation();
  const { socket, roomData } = useSocket();
  const navigate = useNavigate();

  // Уже в комнате — переходим к ней
  useEffect(() => {
    if (roomData?.id) navigate(`/room/${roomData.id}`, { replace: true });
  }, [roomData, navigate]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setMsg(t('file_too_large') || 'Файл өтө чоң!');

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 96;
        let { width, height } = img;
        if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
        else if (height > MAX) { width *= MAX / height; height = MAX; }

        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setAvatar(dataUrl);
        try { localStorage.setItem('playerAvatar', dataUrl); } catch { /* память переполнена */ }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleJoin = () => {
    const playerName = name.trim();
    if (!playerName) return setMsg(t('err_enter_name'));
    if (busy) return;

    localStorage.setItem('playerName', playerName);
    setBusy(true);
    setMsg(null);

    const done = (result) => {
      setBusy(false);
      if (result?.success) {
        navigate(`/room/${result.room.id}`);
      } else {
        const key = 'err_' + (result?.error || 'no_connection');
        setMsg(t(key) !== key ? t(key) : result?.error);
      }
    };

    if (code.trim()) {
      socket.emit('join_room', { roomCode: code.trim().toUpperCase(), playerName, avatar }, done);
    } else {
      socket.emit('create_room', { playerName, avatar }, done);
    }
  };

  return (
    <div className="container-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '420px', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: '8px' }}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              aria-label={l.code}
              style={{ opacity: lang === l.code ? 1 : 0.4, border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              {l.flag}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>МАФИЯ</h1>
          <p className="text-secondary">{t('home_subtitle')}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.2rem' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '80px', height: '80px', borderRadius: '50%', cursor: 'pointer', padding: 0,
              background: avatar ? `url(${avatar}) center/cover` : 'rgba(255,255,255,0.1)',
              border: '2px dashed var(--glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center',
              overflow: 'hidden', color: 'inherit'
            }}
            aria-label={t('avatar_upload')}
          >
            {!avatar && <span style={{ fontSize: '2rem', opacity: 0.5 }}>📸</span>}
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', marginTop: '0.5rem', background: 'none', border: 0, cursor: 'pointer' }}
          >
            {t('avatar_upload')}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <input
            className="input-glass"
            placeholder={t('enter_name')}
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <input
            className="input-glass"
            placeholder={t('enter_code')}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            maxLength={6}
            inputMode="latin"
            autoCapitalize="characters"
          />

          {msg && (
            <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', textAlign: 'center' }}>{msg}</p>
          )}

          <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={handleJoin} disabled={busy}>
            {busy ? t('connecting') : code ? t('join_game') : t('create_room_btn')}
          </button>

          {!code && <p className="text-secondary" style={{ fontSize: '0.75rem', textAlign: 'center' }}>{t('host_hint')}</p>}
        </div>
      </motion.div>

      <a href="../../index.html" className="back-link">← Билим Арена</a>
    </div>
  );
}
