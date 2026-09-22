class WinChecker {
  static checkWin(gameState, io) {
    if (gameState.phase === 'end' || gameState.isEnding) return true;

    let mafiaCount = 0;
    let peacefulCount = 0; 
    let maniacCount = 0;

    gameState.alivePlayers.forEach(playerId => {
      const r = gameState.roles[playerId];
      if (r === 'mafia' || r === 'don') {
        mafiaCount++;
      } else if (r === 'maniac') {
        maniacCount++;
      } else {
        peacefulCount++;
      }
    });

    let winners = null;
    let winMessage = "";

    if (mafiaCount === 0 && maniacCount === 0) {
      winners = 'citizens';
      winMessage = "Все злодеи уничтожены! Мирные жители спасли свой город.";
    } else if (mafiaCount >= peacefulCount + maniacCount) {
      winners = 'mafia';
      winMessage = "Мафия захватила контроль над городом. Оставшихся слишком мало для сопротивления.";
    } else if (maniacCount > 0 && mafiaCount === 0 && peacefulCount <= 1) {
      winners = 'maniac';
      winMessage = "Маньяк остался последним выжившим злодеем и закончил свою охоту. Победа Маньяка!";
    }

    if (winners) {
      gameState.isEnding = true;
      setTimeout(() => {
        this._endGame(gameState, io, winners, winMessage);
      }, 6000); 
      return true;
    }
    return false;
  }

  static _endGame(gameState, io, winners, winMessage) {
    gameState.setPhase('end');
    console.log(`[Комната ${gameState.id}] ИГРА ОКОНЧЕНА. Победили: ${winners}`);

    gameState.players.forEach(p => {
      const finalState = gameState.getSanitizedState(p.id);
      io.to(p.id).emit('game_over', {
        winners: winners,
        message: winMessage,
        finalState: finalState  
      });
    });
  }
}

export default WinChecker;
