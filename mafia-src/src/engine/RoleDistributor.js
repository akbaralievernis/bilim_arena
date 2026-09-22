class RoleDistributor {
  static assignRoles(players) {
    const validPlayers = players.filter(p => p !== null && p !== undefined);
    const hostPlayer = validPlayers.find(p => p.isHost);
    const activePlayers = validPlayers.filter(p => !p.isHost);
    
    const count = activePlayers.length;
    if (count < 4) throw new Error("Недостаточно игроков для старта игры (минимум 4 помимо создателя)");

    const rolesArray = [];
    let mafiaCount = 1;
    
    if (count >= 5 && count <= 8) mafiaCount = 1;
    if (count >= 9 && count <= 12) mafiaCount = 2;
    if (count >= 13) mafiaCount = 3;

    // Спец роли для мафии
    if (count >= 7) {
      rolesArray.push('don'); 
      mafiaCount = Math.max(1, mafiaCount - 1);
    }

    for (let i = 0; i < mafiaCount; i++) rolesArray.push('mafia');
    
    // Спец роли для мирных
    rolesArray.push('doctor');
    rolesArray.push('detective'); 

    if (count >= 10) {
      rolesArray.push('maniac'); 
    }

    if (count >= 12) {
      rolesArray.push('putana'); // Блокирует действия
    }

    if (count >= 14) {
      rolesArray.push('bodyguard'); // Защищает ценой жизни
    }

    const citizensCount = count - rolesArray.length;
    for (let i = 0; i < citizensCount; i++) rolesArray.push('citizen');

    for (let i = rolesArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesArray[i], rolesArray[j]] = [rolesArray[j], rolesArray[i]];
    }

    const assignedRoles = {};
    if (hostPlayer) assignedRoles[hostPlayer.id] = 'spectator';
    activePlayers.forEach((player, index) => {
      assignedRoles[player.id] = rolesArray[index];
    });

    return assignedRoles;
  }
}

export default RoleDistributor;
