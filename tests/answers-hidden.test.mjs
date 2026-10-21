// Телефон ученика не получает правильный ответ вместе с вопросом.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); }, key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; }
};
const { BaseGame } = await import('../core/engine.js');

const L = (ky, ru, en) => ({ ky, ru, en });
const QUESTIONS = [
  { id: 'c1', skill: 's', type: 'choice', prompt: L('a', 'a', 'a'), options: [L('верно', 'верно', 'right'), L('нет', 'нет', 'no'), L('нет2', 'нет2', 'no2')], correct: 0 },
  { id: 'm1', skill: 's', type: 'match', prompt: L('m', 'm', 'm'), pairs: [[L('A', 'A', 'A'), L('1', '1', '1')], [L('B', 'B', 'B'), L('2', '2', '2')], [L('C', 'C', 'C'), L('3', '3', '3')]] },
  { id: 's1', skill: 's', type: 'sort', prompt: L('s', 's', 's'), items: [L('1', '1', '1'), L('2', '2', '2'), L('3', '3', '3')] },
  { id: 'x1', skill: 's', type: 'multiple', prompt: L('x', 'x', 'x'), options: [L('a', 'a', 'a'), L('b', 'b', 'b'), L('c', 'c', 'c')], correct: [0, 2] },
  { id: 'i1', skill: 's', type: 'input', prompt: L('i', 'i', 'i'), answer: ['42'] }
];

test('the answer screen sent to a phone carries no correct answer for any question type', async () => {
  const game = new BaseGame({ questions: QUESTIONS, topic: 't', lang: 'ru', perQuestionSec: 60 });
  game.addPlayer({ id: 'p1', name: 'Айбек' });
  await game.start();
  for (let i = 0; i < QUESTIONS.length; i++) {
    const spec = game.controllerSpec('p1');
    assert.equal(spec.screen, 'answer');
    const json = JSON.stringify(spec);
    assert.ok(!/"index"|correct|answer"/.test(json.replace('"screen":"answer"', '')), `${QUESTIONS[i].type}: ${json}`);
    // Ответ всё равно проверяется доской
    game._stopTimer();
    await game.nextQuestion();
  }
  game._stopTimer();
});
