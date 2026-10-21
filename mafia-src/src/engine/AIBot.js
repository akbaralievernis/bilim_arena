class AIBot {
  /**
   * @param {string[]} takenNames имена, которые уже есть в комнате: бот не должен совпасть с живым игроком
   *   (в классе почти всегда есть Айбек или Нурай — иначе в игре появлялись два одинаковых имени)
   */
  static generateBots(currentCount, minRequired = 4, takenNames = []) {
    // Имена не повторяются: иначе двух «Алекс (Бот)» невозможно различить
    // Что это бот, видно по значку рядом с именем (player.isBot)
    const key = (n) => String(n).trim().toLowerCase();
    const taken = new Set(takenNames.map(key));
    const names = ['Айбек', 'Айпери', 'Бекзат', 'Нурай', 'Эрлан', 'Жамиля', 'Т-800', 'HAL 9000'];
    const pool = names.filter((n) => !taken.has(key(n)));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const needed = Math.max(0, minRequired - currentCount);
    const bots = [];
    let spare = 1;
    const nextSpare = () => {
      while (taken.has(key(`Bot ${spare}`))) spare++;
      return `Bot ${spare++}`;
    };
    for (let i = 0; i < needed; i++) {
      bots.push({
        id: `bot_${Date.now()}_${i}`,
        name: pool[i] || nextSpare(),
        isBot: true,
        avatar: null
      });
    }
    return bots;
  }

  static makeRandomAction(botId, role, phase, alivePlayers) {
    const thinkingTime = Math.floor(Math.random() * 8000) + 2000;
    const possibleTargets = alivePlayers.filter(id => id !== botId);
    if (possibleTargets.length === 0) return null;
    const randomTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
    return {
      delay: thinkingTime,
      targetId: randomTarget
    };
  }
}

export default AIBot;
