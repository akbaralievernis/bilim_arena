import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { SocketProvider, useSocket } from './context/SocketContext';
import { useTranslation } from './utils/i18n';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import HostDashboard from './components/HostDashboard';
import './styles/theme.css';

/** Всплывающее сообщение об ошибке + индикатор связи */
const StatusLayer = () => {
  const { error, connection, isHostPlayer, roomData } = useSocket();
  const { t } = useTranslation();
  const text = error ? (t('err_' + error) !== 'err_' + error ? t('err_' + error) : error) : null;

  return (
    <>
      {text && (
        <div className="toast-error" role="alert">⚠️ {text}</div>
      )}
      {!isHostPlayer && roomData && connection === 'offline' && (
        <div className="conn-banner" role="status">🔌 {t('conn_offline')}</div>
      )}
    </>
  );
};

const RoomRouter = () => {
  const { socket, roomData, myPlayerId, isHostPlayer } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomData) navigate('/', { replace: true });
  }, [roomData, navigate]);

  const handleStart = React.useCallback(() => {
    socket?.emit('start_game', {});
  }, [socket]);

  const handleAction = React.useCallback((targetId) => {
    if (!socket || !roomData) return;
    if (roomData.phase === 'night') socket.emit('night_action', { targetId });
    else if (roomData.phase === 'vote') socket.emit('day_vote', { targetId });
  }, [socket, roomData]);

  if (!roomData || !socket) return null;

  if (roomData.status === 'lobby') {
    return <Lobby roomData={roomData} isHost={isHostPlayer} onStart={handleStart} socket={socket} />;
  }

  // Ведущий управляет игрой со своей панели, но финальный экран видят все
  if (isHostPlayer && roomData.phase !== 'lobby' && roomData.phase !== 'end') {
    return <HostDashboard gameState={roomData} socket={socket} />;
  }

  return <Game gameState={roomData} myId={myPlayerId} onAction={handleAction} isHost={isHostPlayer} />;
};

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('mafia_theme');
    if (saved) return saved === 'dark';
    return !window.matchMedia?.('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    // В теме по умолчанию тёмные переменные лежат в :root,
    // поэтому светлый режим включается атрибутом data-theme="light".
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('mafia_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setIsDark((v) => !v)}
      title="Тема"
      aria-label="Тема"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

function App() {
  return (
    <Router>
      <SocketProvider>
        <ThemeToggle />
        <StatusLayer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:id" element={<RoomRouter />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;
