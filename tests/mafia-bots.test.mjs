// Мафия: имена ботов не совпадают с именами игроков (в классе почти всегда есть Айбек или Нурай).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import AIBot from '../mafia-src/src/engine/AIBot.js';

test('bots never take a name that a player already has', () => {
  for (let run = 0; run < 200; run++) {
    const players = ['Айбек', 'нурай ', 'Бекзат'];
    const bots = AIBot.generateBots(players.length, 8, players);
    const all = [...players, ...bots.map((b) => b.name)].map((n) => n.trim().toLowerCase());
    assert.equal(new Set(all).size, all.length, all.join(', '));
  }
});

test('when the name list runs out, spare bot names are still unique', () => {
  const players = ['Айбек', 'Айпери', 'Бекзат', 'Нурай', 'Эрлан', 'Жамиля', 'Т-800', 'HAL 9000', 'Bot 1'];
  const bots = AIBot.generateBots(1, 4, players);
  const names = bots.map((b) => b.name);
  assert.deepEqual(names, ['Bot 2', 'Bot 3', 'Bot 4']);
});
