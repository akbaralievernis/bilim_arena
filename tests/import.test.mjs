import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestions, IMPORT_EXAMPLE } from '../core/import.js';

const NL = String.fromCharCode(10);
const lines = (...rows) => rows.join(NL);
const ok = (q) => assert.deepEqual(q.errors, [], `line ${q.line}: ${q.errors}`);

test('example text is understood in all three languages', () => {
  for (const lang of ['ky', 'ru', 'en']) {
    const { questions } = parseQuestions(IMPORT_EXAMPLE[lang]);
    assert.equal(questions.length, 4, lang);
    questions.forEach(ok);
    assert.deepEqual(questions.map((q) => q.type), ['single', 'single', 'text', 'number'], lang);
    assert.equal(questions[0].correctAnswer, 1);
    assert.equal(questions[1].correctAnswer, 1);
    assert.equal(questions[1].explanation, '7 × 8 = 56');
    assert.deepEqual(questions[3].correctAnswer, ['42']);
    assert.equal(questions[3].question, '12 + 30 = ?');
  }
});

test('star or plus marks the right option, at the start or the end', () => {
  const { questions } = parseQuestions(lines('Кайсы сан жуп?', 'a) 3', '* b) 4', 'c) 5 +'));
  ok(questions[0]);
  assert.equal(questions[0].type, 'multiple');
  assert.deepEqual(questions[0].correctAnswer, [1, 2]);
});

test('answer line by letter, by several letters and by option text', () => {
  const byLetters = parseQuestions(lines('1. Выберите простые числа', 'А) 2', 'Б) 4', 'В) 7', 'Ответ: А, В')).questions[0];
  ok(byLetters);
  assert.deepEqual(byLetters.correctAnswer, [0, 2]);

  const byText = parseQuestions(lines('Capital of France?', '- Rome', '- Paris', 'Answer: Paris')).questions[0];
  ok(byText);
  assert.equal(byText.correctAnswer, 1);
});

test('questions numbered with ")" and options numbered with ")" stay apart', () => {
  const { questions } = parseQuestions(lines(
    '1) 2 + 2 = ?', '1) 3', '2) 4 *', '3) 5',
    '2) 3 + 3 = ?', 'а) 6 *', 'б) 7'
  ));
  assert.equal(questions.length, 2);
  questions.forEach(ok);
  assert.deepEqual(questions[0].options, ['3', '4', '5']);
  assert.equal(questions[0].correctAnswer, 1);
  assert.equal(questions[1].correctAnswer, 0);
});

test('questions without blank lines between them', () => {
  const { questions } = parseQuestions(lines('1. Q one', 'a) x *', 'b) y', '2. Q two', 'a) x', 'b) y *', '3. Q three', 'Жооп: 10 | он'));
  assert.equal(questions.length, 3);
  questions.forEach(ok);
  assert.deepEqual(questions[2].correctAnswer, ['10', 'он']);
  assert.equal(questions[2].type, 'text');
});

test('long question on two lines and Word bullets', () => {
  const { questions } = parseQuestions(lines('Суроо 1: Бул суроо узун', 'жана эки сапка жазылган', '• биринчи', '• экинчи ✓'));
  ok(questions[0]);
  assert.equal(questions[0].question, 'Бул суроо узун жана эки сапка жазылган');
  assert.equal(questions[0].correctAnswer, 1);
});

test('problems are reported, not guessed', () => {
  const { questions } = parseQuestions(lines('1. Нет правильного', 'а) раз', 'б) два', '', '2. Только вопрос', '', '3. Ответ не из списка', 'a) x', 'b) y', 'Answer: z'));
  assert.deepEqual(questions.map((q) => q.errors[0]), ['no_correct', 'no_answer', 'answer_not_option']);
});

test('numeric answers accept a comma', () => {
  const q = parseQuestions('3,5 + 1 = 4,5').questions[0];
  ok(q);
  assert.equal(q.type, 'number');
  assert.deepEqual(q.correctAnswer, ['4.5']);
});
