import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const getRoleColor = (role) => {
  switch (role) {
    case 'mafia': case 'don': return 'var(--accent-red)';
    case 'doctor': case 'detective': return 'var(--accent-blue)';
    case 'maniac': return '#ff8c00';
    case 'putana': return 'var(--accent-purple)';
    case 'bodyguard': return '#4caf50';
    default: return 'var(--text-secondary)';
  }
};

/**
 * Мемоизированный компонент карточки игрока.
 * Оптимизирован для 60 FPS при 15 игроках.
 */
const PlayerCard = ({ 
  player, 
  index, 
  isDead, 
  isSelected, 
  onSelect, 
  canSelect, 
  roleName,
  roleKey,
  votes, 
  isVoting,
  isHostView = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isDead ? 0.35 : 1 }}
      transition={{ duration: 0.15, type: 'tween' }}
      className={`player-card ${isSelected ? 'selected' : ''} ${isDead ? 'dead' : ''} ${isHostView ? 'host-view' : ''}`}
      onClick={() => !isDead && onSelect && onSelect(player.id)}
      whileTap={{ scale: canSelect && !isDead ? 0.98 : 1 }}
      style={{ 
        transform: 'translateZ(0)',
        padding: '0.8rem 0.5rem',
        minWidth: isHostView ? '100px' : '120px'
      }}
    >
      <div className="player-number">{index + 1}</div>
      
      <div style={{ 
        width: isHostView ? '45px' : '60px', 
        height: isHostView ? '45px' : '60px', 
        borderRadius: '50%', 
        background: isDead ? '#222' : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.2))',
        margin: '0 auto 0.5rem auto',
        border: isSelected ? '2px solid var(--accent-red)' : '1px solid var(--glass-border)',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        transform: 'translateZ(0)'
      }}>
        {player.avatar ? (
          <img src={player.avatar} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDead ? 0.2 : 1 }} />
        ) : (
          <span style={{ fontSize: isHostView ? '1rem' : '1.5rem', opacity: 0.5 }}>👤</span>
        )}
      </div>
      
      <h4 style={{ 
        fontWeight: 600, 
        fontSize: isHostView ? '0.8rem' : '0.9rem', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        marginBottom: '2px'
      }}>
        {player.name}
      </h4>
      
      {roleName && (
        <p style={{ 
          fontSize: '0.65rem', 
          color: getRoleColor(roleKey), 
          marginTop: '0.2rem', 
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {roleName}
        </p>
      )}

      {isDead && !roleName && (
         <p style={{ fontSize: '0.65rem', color: 'var(--accent-red)', marginTop: '0.2rem' }}>💀</p>
      )}

      {isVoting && votes > 0 && (
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: 'tween', duration: 0.1 }}
          style={{ 
            marginTop: '0.4rem', 
            background: 'rgba(255, 42, 95, 0.25)', 
            padding: '2px 8px', 
            borderRadius: '10px', 
            fontSize: '0.75rem', 
            color: 'var(--accent-red)', 
            fontWeight: 'bold',
            border: '1px solid rgba(255, 42, 95, 0.3)'
          }}
        >
          {votes}
        </motion.div>
      )}

      {isSelected && (
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          style={{ position: 'absolute', top: 5, right: 5, background: 'var(--accent-red)', borderRadius: '50%', padding: '3px', boxShadow: '0 0 10px rgba(255,42,95,0.5)' }}
        >
          <Check size={10} color="#fff" strokeWidth={3} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default React.memo(PlayerCard);
