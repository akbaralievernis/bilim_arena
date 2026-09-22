import GameState from './GameState.js';
import NightPhase from './NightPhase.js';
import DayPhase from './DayPhase.js';
import GameLog from './GameLog.js';
import RoleDistributor from './RoleDistributor.js';
import WinChecker from './WinChecker.js';

class GameEngine {
  constructor(roomId, players, io) {
    this.roomId = roomId;
    this.io = io;
    this.state = new GameState(roomId);
    this.log = new GameLog();
    
    players.forEach(p => this.state.addPlayer(p));

    this.nightPhase = null;
    this.dayPhase = null;
  }

  start() {
    try {
      const assignedRoles = RoleDistributor.assignRoles(this.state.players);
      this.state.startGame(assignedRoles);
      
      this.state.players.forEach(p => {
        this.io.to(p.id).emit('game_started', this.state.getSanitizedState(p.id));
      });

      this.log.addEvent('system', 'Игра началась', {}, true);
      this.startNight();
    } catch (e) {
      console.error(`Ошибка старта игры ${this.roomId}:`, e);
      this.io.to(this.roomId).emit('error', { message: e.message });
    }
  }

  startNight() {
    if (this.stopped) return;
    if (this.state.phase === 'end' || WinChecker.checkWin(this.state, this.io)) return;

    if (this.dayPhase && this.dayPhase.timer) clearInterval(this.dayPhase.timer);
    this.dayPhase = null;

    this.nightPhase = new NightPhase(this.state, this.io, (results) => {
      this.log.addEvent('phase_change', 'Ночь закончилась', results, true);
      this.startDay(results);
    });

    this.nightPhase.start();
  }

  startDay(nightResults) {
    if (this.stopped) return;
    if (this.state.phase === 'end' || WinChecker.checkWin(this.state, this.io)) return;

    if (this.nightPhase && this.nightPhase.timer) clearInterval(this.nightPhase.timer);
    this.nightPhase = null;

    this.dayPhase = new DayPhase(this.state, this.io, (results) => {
      this.log.addEvent('phase_change', 'День закончился', results, true);
      this.startNight();
    });

    this.dayPhase.start(nightResults);
  }

  /** Полная остановка: гасим все таймеры (возврат в лобби, выход ведущего) */
  stop() {
    this.stopped = true;
    if (this.nightPhase?.timer) clearInterval(this.nightPhase.timer);
    if (this.dayPhase?.timer) clearInterval(this.dayPhase.timer);
    this.nightPhase = null;
    this.dayPhase = null;
    this.state.phase = 'end';
  }

  handleNightAction(playerId, targetId) {
    if (this.state.phase === 'night' && this.nightPhase) {
      return this.nightPhase.handleAction(playerId, targetId);
    }
    return { error: 'Действие недоступно в текущей фазе' };
  }

  handleDayVote(playerId, targetId) {
    if (this.state.phase === 'vote' && this.dayPhase) {
      return this.dayPhase.handleVote(playerId, targetId);
    }
    return { error: 'Голосование недоступно' };
  }

  handleChatMessage(playerId, message) {
    if ((this.state.phase === 'day' || this.state.phase === 'vote') && this.dayPhase) {
      return this.dayPhase.handleChatMessage(playerId, message);
    }
    return { error: 'Чат недоступен в текущей фазе' };
  }

  handleHostAdvanceNight() {
    if (this.state.phase === 'night' && this.nightPhase) {
      clearInterval(this.nightPhase.timer);
      this.nightPhase.nextSubPhase();
      return { success: true };
    }
    return { error: 'Невозможно переключить фазу сейчас' };
  }

  handleHostStartVoting() {
    if (this.state.phase === 'day' && this.dayPhase) {
      this.dayPhase.forceStartVoting();
      return { success: true };
    }
    return { error: 'Невозможно начать голосование сейчас' };
  }

  handleHostEndDay() {
    if ((this.state.phase === 'day' || this.state.phase === 'vote') && this.dayPhase) {
      this.dayPhase.forceEndDay();
      return { success: true };
    }
    return { error: 'Невозможно завершить день сейчас' };
  }
}

export default GameEngine;
