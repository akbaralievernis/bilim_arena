import AIBot from './AIBot.js';

class DayPhase {
  constructor(gameState, io, onDayEndCallback) {
    this.state = gameState;
    this.io = io;
    this.onDayEnd = onDayEndCallback;
    this.timer = null;
    this.timeLeft = 0;
    this.subPhase = 'discussion'; 
    this.isFinishing = false; 
  }

  start(nightResults) {
    this.state.setPhase('day');
    this.subPhase = 'discussion';
    
    console.log(`[Комната ${this.state.id}] Наступил День. Раунд ${this.state.round}. Обсуждение.`);

    let message = "Наступил день. Жители проснулись в целости и сохранности. Доктор кого-то спас, либо злоумышленники промахнулись!";
    let killedNames = [];
    
    if (nightResults.multipleKills && nightResults.multipleKills.length > 0) {
      killedNames = nightResults.multipleKills.map(id => this.state.players.find(p => p.id === id)?.name || "Неизвестный");
      message = `Наступил день. Ночь выдалась кровавой. Убиты: ${killedNames.join(', ')}.`;
    } else if (nightResults.killedPlayerId) {
      let killedPlayerName = this.state.players.find(p => p.id === nightResults.killedPlayerId)?.name || "Неизвестный";
      message = `Наступил день. Сделан страшный выбор. Убит игрок ${killedPlayerName}.`;
    }

    this.io.to(this.state.id).emit('day_started', {
      killedPlayerId: nightResults.killedPlayerId, 
      multipleKills: nightResults.multipleKills,
      message: message
    });

    this._broadcastState();
    
    // Даем больше времени на обсуждение для ведущего
    this._startTimer(120, () => {
      this.startVoting(); 
    });
  }

  forceStartVoting() {
    if (this.subPhase === 'discussion') {
      clearInterval(this.timer);
      this.startVoting();
    }
  }

  forceEndDay() {
    if (this.isFinishing) return;
    if (this.subPhase === 'voting' || this.subPhase === 'revoting') {
      clearInterval(this.timer);
      if (this.subPhase === 'revoting') this.endRevote();
      else this.endDay();
    }
  }

  startVoting() {
    this.state.setPhase('vote'); 
    this.subPhase = 'voting';
    this._broadcastState(); 
    
    console.log(`[Комната ${this.state.id}] Начало голосования.`);
    this.io.to(this.state.id).emit('voting_started', { message: "Время голосования! Выберите, кого посадить в тюрьму." });

    this._scheduleBotVotes(null);

    this._startTimer(30, () => {
      this.endDay(); 
    });
  }

  /** Боты голосуют сами; при переголосовании — только за кандидатов */
  _scheduleBotVotes(candidates) {
    this.state.players.forEach(p => {
      if (!p.isBot || !this.state.alivePlayers.includes(p.id)) return;
      const pool = candidates?.length
        ? candidates.filter(id => this.state.alivePlayers.includes(id))
        : this.state.alivePlayers;
      const action = AIBot.makeRandomAction(p.id, this.state.roles[p.id], 'vote', pool);
      if (!action) return;
      setTimeout(() => {
        if (this.subPhase === 'voting' || this.subPhase === 'revoting') {
          this.handleVote(p.id, action.targetId);
        }
      }, Math.min(action.delay, 12000));
    });
  }

  handleChatMessage(senderId, message) {
    if (this.state.phase !== 'day' && this.state.phase !== 'vote') return { error: "Чат доступен только днем" };
    if (!this.state.alivePlayers.includes(senderId)) return { error: "Мертвые не разговаривают" };

    const sender = this.state.players.find(p => p.id === senderId);
    this.io.to(this.state.id).emit('chat_message', {
      senderId: senderId,
      senderName: sender.name,
      text: message,
      timestamp: Date.now()
    });

    return { success: true };
  }

  handleVote(voterId, suspectId) {
    if (this.subPhase !== 'voting' && this.subPhase !== 'revoting') return { error: "Голосование еще не началось" };
    if (this.subPhase === 'revoting' && this.tiedCandidates && !this.tiedCandidates.includes(suspectId)) return { error: "Можно голосовать только за кандидатов с ничьей!" };
    
    const success = this.state.registerVote(voterId, suspectId);
    if (success) {
      this.io.to(this.state.id).emit('votes_updated', this.state.votes);
      if (Object.keys(this.state.votes).length === this.state.alivePlayers.length) {
        if (this.subPhase === 'revoting') this.endRevote();
        else this.endDay();
      }
      return { success: true };
    }
    return { error: "Голосование отклонено (возможно, вы или цель мертвы)" };
  }

  endDay() {
    if (this.isFinishing) return;
    this.isFinishing = true;
    clearInterval(this.timer);
    this.state.isProcessingPhase = true;

    const voteCounts = {};
    Object.values(this.state.votes).forEach(suspectId => {
      voteCounts[suspectId] = (voteCounts[suspectId] || 0) + 1;
    });

    let maxVotes = 0;
    let isTie = false;
    this.tiedCandidates = [];

    Object.entries(voteCounts).forEach(([suspectId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        isTie = false;
        this.tiedCandidates = [suspectId];
      } else if (count === maxVotes) {
        isTie = true;
        this.tiedCandidates.push(suspectId);
      }
    });

    if (maxVotes === 0) {
      this._finishVotingWithNoOneExiled("Голоса разделились или никто не проголосовал. Город засыпает в страхе.");
    } else if (isTie) {
      this.subPhase = 'revoting';
      this.isFinishing = false; 
      this.state.votes = {}; 
      this.state.isProcessingPhase = false;
      
      this.io.to(this.state.id).emit('revote_started', {
        candidates: this.tiedCandidates,
        message: "Ничья! У вас есть 20 секунд, чтобы переголосовать среди кандидатов."
      });
      this.io.to(this.state.id).emit('votes_updated', {});
      this._scheduleBotVotes(this.tiedCandidates);

      this._startTimer(20, () => {
        this.endRevote();
      });
    } else {
      this._finishVotingExile(this.tiedCandidates[0]);
    }
  }

  endRevote() {
    if (this.isFinishing && this.subPhase !== 'revoting') return;
    this.isFinishing = true;
    clearInterval(this.timer);
    this.state.isProcessingPhase = true;

    const voteCounts = {};
    Object.values(this.state.votes).forEach(suspectId => {
      voteCounts[suspectId] = (voteCounts[suspectId] || 0) + 1;
    });

    let maxVotes = 0;
    let isTie = false;
    let winnerId = null;

    Object.entries(voteCounts).forEach(([suspectId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = suspectId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    if (maxVotes === 0 || isTie) {
      this._finishVotingWithNoOneExiled("Даже переголосование не выявило виновного. Никто не изгнан.");
    } else {
      this._finishVotingExile(winnerId);
    }
  }

  _finishVotingExile(exiledPlayerId) {
    this.subPhase = 'result';   // день уже нельзя завершить повторно
    this.state.killPlayer(exiledPlayerId);
    const exiledName = this.state.players.find(p => p.id === exiledPlayerId)?.name || 'Неизвестный';

    this.io.to(this.state.id).emit('voting_result', {
      exiledPlayerId: exiledPlayerId,
      message: `Город сделал свой суровый выбор. Игрок ${exiledName} изгнан.`
    });

    // Вместо мгновенного завершения даем 5 секунд на осознание
    this._startTimer(5, () => {
      this.state.isProcessingPhase = false;
      if (this.onDayEnd) this.onDayEnd({ exiledPlayerId });
    }, true);
  }

  _finishVotingWithNoOneExiled(msg) {
    this.subPhase = 'result';
    this.io.to(this.state.id).emit('voting_result', {
      exiledPlayerId: null,
      message: msg
    });

    // Даем 5 секунд перед ночью
    this._startTimer(5, () => {
      this.state.isProcessingPhase = false;
      if (this.onDayEnd) this.onDayEnd({ exiledPlayerId: null });
    }, true);
  }

  _startTimer(seconds, onExpireCallback, isTransition = false) {
    if (this.timer) clearInterval(this.timer);
    this.timeLeft = seconds;
    
    this.io.to(this.state.id).emit('timer_update', { 
        timeLeft: this.timeLeft, 
        phase: this.state.phase,
        isTransition: isTransition 
    });

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.io.to(this.state.id).emit('timer_update', { 
          timeLeft: this.timeLeft, 
          phase: this.state.phase,
          isTransition: isTransition 
      });

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        onExpireCallback();
      }
    }, 1000);
  }

  _broadcastState() {
    this.state.players.forEach(p => {
      this.io.to(p.id).emit('state_update', this.state.getSanitizedState(p.id));
    });
  }
}

export default DayPhase;
