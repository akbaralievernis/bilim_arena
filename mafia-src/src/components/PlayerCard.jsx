import React from 'react';
import { motion } from 'framer-motion';
import { Check, User, Skull, Bot } from 'lucide-react';

const getRoleColor = (role) => {
  switch (role) {
    case 'mafia': case 'don': return 'var(--accent-red)';
    case 'doctor': case 'detective': return 'var(--accent-blue)';
    case 'maniac': return '#B54708';
    case 'putana': return 'var(--accent-purple)';
    case 'bodyguard': return '#0E7A4E';
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
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: isDead ? 0.55 : 1 }}
      transition={{ duration: 0.15, type: 'tween' }}
      className={`player-card ${isSelected ? 'selected' : ''} ${isDead ? 'dead' : ''} ${canSelect && !isDead ? 'can-select' : ''} ${isHostView ? 'host-view' : ''}`}
      onClick={() => !isDead && canSelect && onSelect && onSelect(player.id)}
      disabled={isDead || !canSelect}
      aria-pressed={canSelect ? isSelected : undefined}
      aria-label={[`${index + 1}. ${player.name}`, roleName, isDead ? '✝' : null, isVoting && votes ? `${votes}` : null].filter(Boolean).join(', ')}
      whileTap={{ scale: canSelect && !isDead ? 0.98 : 1 }}
      style={{ minWidth: isHostView ? '100px' : '120px' }}
    >
      <span className="player-number" aria-hidden="true">{index + 1}</span>
      
      <span style={{ 
        width: isHostView ? '45px' : '60px', 
        height: isHostView ? '45px' : '60px', 
        borderRadius: '50%', 
        background: 'var(--surface-2)',
        margin: '0 auto 0.5rem auto',
        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--line)',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        transform: 'translateZ(0)'
      }}>
        {player.avatar ? (
          <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDead ? 0.4 : 1 }} />
        ) : (
          <User size={isHostView ? 16 : 22} style={{ opacity: 0.5 }} aria-hidden="true" />
        )}
      </span>
      
      <span style={{ display: 'block', 
        fontWeight: 600, 
        fontSize: isHostView ? '0.8rem' : '0.9rem', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        marginBottom: '2px'
      }}>
        {player.name}{player.isBot && <Bot size={12} style={{ marginLeft: 4, verticalAlign: '-1px', opacity: 0.7 }} aria-label="bot" />}
      </span>
      
      {roleName && (
        <span style={{ 
          display: 'block',
          fontSize: '0.7rem', 
          color: getRoleColor(roleKey), 
          marginTop: '0.2rem', 
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {roleName}
        </span>
      )}

      {isDead && !roleName && (
         <Skull size={14} color="var(--primary-ink)" style={{ marginTop: '0.2rem' }} aria-hidden="true" />
      )}

      {isVoting && votes > 0 && (
        <motion.span 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: 'tween', duration: 0.1 }}
          style={{ 
            display: 'inline-block',
            marginTop: '0.4rem', 
            background: 'var(--primary-soft)',
            padding: '2px 8px', 
            borderRadius: '10px', 
            fontSize: '0.75rem', 
            color: 'var(--primary-ink)',
            fontWeight: 'bold',
            border: '1px solid #F2B8BF'
          }}
        >
          {votes}
        </motion.span>
      )}

      {isSelected && (
        <motion.span 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          style={{ position: 'absolute', top: 5, right: 5, background: 'var(--primary)', borderRadius: '50%', padding: '3px', lineHeight: 0 }}
        >
          <Check size={10} color="#fff" strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
};

export default React.memo(PlayerCard);
