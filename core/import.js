/**
 * Bilim Arena — вопросы из вставленного текста.
 *
 * Учитель копирует тест откуда угодно (Word, Google Docs, чат) и вставляет.
 * Понятные форматы:
 *
 *   1. Кыргызстандын борбору?
 *   а) Ош
 *   б) Бишкек *
 *   в) Нарын
 *
 *   2. 7 × 8 = ?
 *   A. 54
 *   B. 56
 *   Жооп: B
 *   Түшүндүрмө: 7 × 8 = 56
 *
 *   3. Манастын атасы ким?
 *   Жооп: Жакып
 *
 *   4. 12 + 30 = 42
 *
 * Правильный вариант отмечается * или + (в начале или в конце строки)
 * либо строкой «Жооп / Ответ / Answer: б». Несколько правильных — тип
 * «несколько ответов». Без вариантов — ввод ответа (число или текст),
 * несколько допустимых ответов пишутся через |.
 */

const ANSWER = /^\s*(?:туура\s+жооп|жооп|правильный\s+ответ|ответ|correct\s+answer|answer|correct)\s*[:：\-–—]\s*(.+)$/i;
const EXPLAIN = /^\s*(?:түшүндүрмө|түшүндүрүү|объяснение|пояснение|explanation|explain)\s*[:：\-–—]\s*(.+)$/i;
// «1.», «12)», «№3», «Вопрос 4:», «Суроо 5.»
const NUMBERED = /^\s*(?:(?:суроо|вопрос|question)\s*)?(?:№\s*)?\d{1,3}\s*[.)]\s*(.+)$/i;
const NUMBERED_WORD = /^\s*(?:суроо|вопрос|question)\s*№?\s*\d{1,3}\s*[:.)]?\s*(.+)$/i;
// Варианты: «а)», «Б.», «c)», «(d)», «1)», «- текст», «• текст»
const OPTION = /^\s*\(?([A-Za-zА-Яа-яЁёӨөҮүҢң]|\d{1,2})\)\s*(.+)$/;
const OPTION_DOT = /^\s*([A-Za-zА-Яа-яЁёӨөҮүҢң])\.\s+(.+)$/;
const BULLET = /^\s*[-•–▪●○◦]\s+(.+)$/;
const MARK_END = /\s*(?:\*|\+|✓|✔|\((?:туура|верно|правильно|correct)\))\s*$/i;
const MARK_START = /^\s*(?:\*|\+|✓|✔)\s*/;

const LIMITS = { questions: 200, question: 500, option: 200, options: 8 };

const clean = (s) => String(s ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const norm = (s) => clean(s).toLowerCase().replace(/ё/g, 'е');

/** Число из ответа («56», «3,5», «-2») или null */
function asNumber(s) {
  const v = clean(s).replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(v) ? v : null;
}

function readOption(raw) {
  // Отметка может стоять и перед буквой: «* б) Бишкек»
  let correct = MARK_START.test(raw) && (OPTION.test(raw.replace(MARK_START, '')) || OPTION_DOT.test(raw.replace(MARK_START, '')));
  const line = correct ? raw.replace(MARK_START, '') : raw;
  let m = line.match(OPTION) || line.match(OPTION_DOT);
  let label = null;
  let text;
  if (m) { label = m[1]; text = m[2]; } else {
    m = line.match(BULLET);
    if (!m) return null;
    text = m[1];
  }
  if (MARK_START.test(text)) { correct = true; text = text.replace(MARK_START, ''); }
  if (MARK_END.test(text)) { correct = true; text = text.replace(MARK_END, ''); }
  text = clean(text).slice(0, LIMITS.option);
  return text ? { label, text, correct } : null;
}

/** Ответ «б», «B, D», «2» или текстом варианта → номера вариантов */
function answerToIndexes(answer, options) {
  const parts = clean(answer).split(/\s*(?:,|;|\band\b|\bи\b|\bжана\b)\s*/i).filter(Boolean);
  const out = [];
  for (const part of parts) {
    const key = norm(part).replace(/[).]$/, '');
    let i = options.findIndex((o) => o.label && norm(o.label) === key);
    if (i < 0) i = options.findIndex((o) => norm(o.text) === key);
    if (i < 0 && /^\d{1,2}$/.test(key) && !options.some((o) => o.label)) i = Number(key) - 1;
    if (i < 0 || i >= options.length) return null;
    if (!out.includes(i)) out.push(i);
  }
  return out.length ? out : null;
}

function finish(block) {
  const errors = [];
  let question = clean(block.question).slice(0, LIMITS.question);
  const options = block.options.slice(0, LIMITS.options);
  const explanation = clean(block.explanation);
  let answer = block.answer;

  // «12 + 30 = 42» без вариантов и без строки ответа — ответ после последнего «=»
  if (!options.length && !answer) {
    const eq = question.lastIndexOf('=');
    if (eq > 0 && clean(question.slice(eq + 1)) && !/\?\s*$/.test(question.slice(eq + 1))) {
      answer = clean(question.slice(eq + 1));
      question = clean(question.slice(0, eq + 1)) + ' ?';
    }
  }

  if (!question) errors.push('no_question');

  let result = null;
  if (options.length === 1) errors.push('one_option');
  else if (options.length >= 2) {
    let correct = options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
    if (answer) {
      const fromAnswer = answerToIndexes(answer, options);
      if (fromAnswer) correct = fromAnswer;
      else if (!correct.length) errors.push('answer_not_option');
    }
    if (!correct.length && !errors.length) errors.push('no_correct');
    if (!errors.length) {
      result = correct.length > 1
        ? { type: 'multiple', options: options.map((o) => o.text), correctAnswer: correct }
        : { type: 'single', options: options.map((o) => o.text), correctAnswer: correct[0] };
    }
  } else if (answer) {
    const answers = clean(answer).split('|').map(clean).filter(Boolean);
    const numeric = answers.every((a) => asNumber(a) !== null);
    result = { type: numeric ? 'number' : 'text', options: null, correctAnswer: numeric ? answers.map(asNumber) : answers };
  } else if (!errors.length) {
    errors.push('no_answer');
  }

  return {
    line: block.line,
    question,
    explanation,
    ...(result || { type: null, options: options.map((o) => o.text), correctAnswer: null }),
    errors
  };
}

/**
 * Разбор текста.
 * @returns {{ questions: Array<{line, question, type, options, correctAnswer, explanation, errors}> }}
 * Вопрос с непустым errors сохранять нельзя — интерфейс показывает причину.
 */
export function parseQuestions(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let cur = null;
  let lastField = null; // куда дописывать продолжение строки

  const start = (line, question) => {
    cur = { line, question, options: [], answer: '', explanation: '' };
    blocks.push(cur);
    lastField = 'question';
  };

  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.replace(/ /g, ' ');
    if (!line.trim()) {
      // Пустая строка закрывает вопрос, если у него уже есть варианты или ответ
      if (cur && (cur.options.length || cur.answer)) cur = null;
      lastField = null;
      return;
    }

    let m = line.match(ANSWER);
    if (m && cur) { cur.answer = m[1]; lastField = 'answer'; return; }
    m = line.match(EXPLAIN);
    if (m && cur) { cur.explanation = m[1]; lastField = 'explanation'; return; }

    // «Суроо 3: …» и «3. …» всегда начинают новый вопрос
    const byWord = line.match(NUMBERED_WORD);
    if (byWord) { start(lineNo, byWord[1]); return; }
    if (/^\s*(?:№\s*)?\d{1,3}\.\s*\S/.test(line)) { start(lineNo, line.match(NUMBERED)[1]); return; }

    const option = readOption(line);
    // «2) …» — вариант, только если варианты этого вопроса тоже нумеруются
    // цифрами по порядку (или это самый первый вариант «1)»); иначе новый вопрос
    const digit = line.match(/^\s*\(?(\d{1,3})\)/);
    if (digit) {
      const n = Number(digit[1]);
      const prev = cur?.options[cur.options.length - 1];
      const isOption = cur && !cur.answer && option &&
        (cur.options.length === 0 ? n === 1 : prev?.label && /^\d+$/.test(prev.label) && n === Number(prev.label) + 1);
      if (isOption) { cur.options.push(option); lastField = 'option'; return; }
      start(lineNo, line.match(NUMBERED)?.[1] || line);
      return;
    }
    if (option) {
      if (!cur || cur.answer) { start(lineNo, option.text); return; }
      cur.options.push(option);
      lastField = 'option';
      return;
    }
    if (!cur) { start(lineNo, line); return; }

    // Продолжение предыдущей строки (длинный вопрос или вариант на две строки)
    if (lastField === 'question') cur.question += ' ' + line;
    else if (lastField === 'option') cur.options[cur.options.length - 1].text = clean(cur.options[cur.options.length - 1].text + ' ' + line);
    else if (lastField === 'explanation') cur.explanation += ' ' + line;
    else if (lastField === 'answer') cur.answer += ' ' + line;
    else start(lineNo, line);
  });

  return { questions: blocks.slice(0, LIMITS.questions).map(finish) };
}

/** Пример для кнопки «Үлгү» — на языке интерфейса */
export const IMPORT_EXAMPLE = {
  ky: '1. Кыргызстандын борбору кайсы шаар?\nа) Ош\nб) Бишкек *\nв) Нарын\n\n2. 7 × 8 = ?\nA) 54\nB) 56\nC) 64\nЖооп: B\nТүшүндүрмө: 7 × 8 = 56\n\n3. Манастын атасы ким?\nЖооп: Жакып\n\n4. 12 + 30 = 42',
  ru: '1. Какой город — столица Кыргызстана?\nа) Ош\nб) Бишкек *\nв) Нарын\n\n2. 7 × 8 = ?\nA) 54\nB) 56\nC) 64\nОтвет: B\nОбъяснение: 7 × 8 = 56\n\n3. Как звали отца Манаса?\nОтвет: Жакып\n\n4. 12 + 30 = 42',
  en: '1. What is the capital of Kyrgyzstan?\na) Osh\nb) Bishkek *\nc) Naryn\n\n2. 7 × 8 = ?\nA) 54\nB) 56\nC) 64\nAnswer: B\nExplanation: 7 × 8 = 56\n\n3. Who was the father of Manas?\nAnswer: Jakyp\n\n4. 12 + 30 = 42'
};
