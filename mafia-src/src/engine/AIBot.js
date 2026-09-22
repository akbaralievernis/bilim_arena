class AIBot {
  static generateBots(currentCount, minRequired = 4) {
    // Имена не повторяются: иначе двух «Алекс (Бот)» невозможно различить
    const names = ['Айбек 🤖', 'Айпери 🤖', 'Бекзат 🤖', 'Нурай 🤖', 'Эрлан 🤖', 'Жамиля 🤖', 'Т-800', 'HAL 9000'];
    const pool = names.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const needed = Math.max(0, minRequired - currentCount);
    const bots = [];
    for (let i = 0; i < needed; i++) {
      bots.push({
        id: `bot_${Date.now()}_${i}`,
        name: pool[i] || `Бот ${i + 1}`,
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
