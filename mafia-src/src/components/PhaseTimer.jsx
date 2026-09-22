import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../utils/i18n';

/**
 * Изолированный компонент таймера.
 * Слушает события 'timer_update' и обновляется независимо, 
 * не вызывая перерисовку всей сетки игроков.
 */
const PhaseTimer = ({ socket, initialTime = null }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isTransition, setIsTransition] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleTimer = (data) => {
      setTimeLeft(data.timeLeft);
      setIsTransition(data.isTransition || false);
    };

    socket.on('timer_update', handleTimer);

    return () => {
      socket.off('timer_update', handleTimer);
    };
  }, [socket]);

  if (timeLeft === null) return null;

  const isLowTime = timeLeft <= 5;
  const timerColor = isTransition 
    ? 'var(--accent-purple)' 
    : isLowTime ? 'var(--accent-red)' : 'var(--accent-blue)';

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ 
        marginTop: '0.3rem', 
        fontSize: '1rem', 
        fontWeight: 'bold', 
        color: timerColor,
        transition: 'color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>
            {isTransition ? t('transition_in') : t('time_left')}
        </span>
        <span style={{ fontSize: '1.4rem' }}>{timeLeft}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{t('sec')}</span>
      </p>
      {isTransition && (
        <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: '100%' }} 
            transition={{ duration: timeLeft, ease: 'linear' }}
            style={{ height: '2px', background: 'var(--accent-purple)', marginTop: '4px' }} 
        />
      )}
    </div>
  );
};

export default React.memo(PhaseTimer);
