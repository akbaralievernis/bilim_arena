/**
 * Picture Detective — проверка описания картинки по рубрике (без DOM, проверяется тестами).
 *
 * Это НЕ проверка грамматики искусственным интеллектом. Что реально делается:
 *  1) текст делится на предложения и слова (регистр, пунктуация, лишние пробелы не важны);
 *  2) смысловой элемент рубрики засчитан, если в ОДНОМ предложении есть слово из каждой
 *     группы need (с синонимами и простыми окончаниями -s/-es/-ing/-ed);
 *  3) слова extra того же предложения — «точность» (цвет, число, место);
 *  4) несколько заранее подготовленных подсказок: заглавная буква, точка в конце,
 *     «is/are + -ing», «a/an», число предложений.
 */

export const LEVELS = ['beginner', 'intermediate', 'advanced'];

/** Предложения и слова; апострофы убираются (it's → its), пунктуация — граница слова */
export function sentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => /[a-z]/i.test(s));
}

export const words = (s) => String(s || '').toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter(Boolean);

/** Слово подходит к варианту: точное совпадение или вариант + простое окончание */
export function wordMatches(word, variant) {
  if (word === variant) return true;
  if (variant.includes(' ')) return false;
  const stem = variant.endsWith('e') && variant.length > 3 ? variant.slice(0, -1) : variant;
  return [`${variant}s`, `${variant}es`, `${stem}ing`, `${variant}ing`, `${stem}ed`, `${variant}ed`, `${variant}d`].includes(word)
    || (variant.endsWith('y') && word === `${variant.slice(0, -1)}ies`)
    // удвоение согласной: run → running, sit → sitting, swim → swimming
    || (/[^aeiou][aeiou][bdgmnprt]$/.test(variant) && (word === `${variant}${variant.at(-1)}ing` || word === `${variant}${variant.at(-1)}ed`));
}

/** Группа слов есть в предложении (варианты из нескольких слов — по фразе) */
function groupFound(sentenceWords, sentenceText, group) {
  return group.some((v) => (v.includes(' ')
    ? ` ${sentenceWords.join(' ')} `.includes(` ${v} `)
    : sentenceWords.some((w) => wordMatches(w, v))));
}

/**
 * Оценка ответа.
 * @returns {{ score, sentences, required, found:[id], missed:[id], precision:[word], hints:[key], tooShort }}
 */
export function evaluate(task, text) {
  const list = sentences(text);
  const sentWords = list.map(words);
  const total = task.elements.reduce((s, e) => s + (e.weight || 1), 0);
  const found = [];
  const precision = new Set();
  let got = 0;
  task.elements.forEach((e) => {
    const hit = sentWords.findIndex((ws, i) => e.need.every((g) => groupFound(ws, list[i], g)));
    if (hit >= 0) {
      found.push(e.id);
      got += e.weight || 1;
      (e.extra || []).forEach((g) => g.forEach((v) => { if (groupFound(sentWords[hit], list[hit], [v])) precision.add(v); }));
    }
  });
  const missed = task.elements.filter((e) => !found.includes(e.id)).map((e) => e.id);
  const tooShort = list.length < (task.minSentences || 1);
  // Точность не заменяет содержание: короткий ответ теряет до 20 % от полноты
  const base = total ? (got / total) * 100 : 0;
  const score = Math.round(tooShort ? base * (0.8 + 0.2 * (list.length / (task.minSentences || 1))) : base);
  return { score, sentences: list.length, required: task.minSentences || 1, found, missed, precision: [...precision], hints: grammarHints(list), tooShort };
}

const SUBJECTS = ['he', 'she', 'it', 'they', 'boy', 'girl', 'man', 'woman', 'teacher', 'dog', 'cat', 'children', 'people', 'mother', 'father', 'family', 'waiter', 'student', 'kids'];

/** Простые подсказки — каждая проверка действительно реализована здесь */
export function grammarHints(list) {
  const hints = new Set();
  list.forEach((s) => {
    if (/^[a-z]/.test(s)) hints.add('capital');
    if (!/[.!?]$/.test(s)) hints.add('period');
    const ws = words(s);
    ws.forEach((w, i) => {
      // «The boy reading» → «The boy is reading»
      if (/ing$/.test(w) && w.length > 4 && i > 0 && SUBJECTS.includes(ws[i - 1])) hints.add('be-ing');
      // «a apple» → «an apple»
      if (w === 'a' && /^[aeio]/.test(ws[i + 1] || '')) hints.add('a-an');
    });
  });
  return [...hints];
}

/** Итог по заданиям: лучшая попытка каждого задания, средняя полнота */
export function summary(results) {
  const best = results.map((r) => Math.max(r.first?.score ?? 0, r.retry?.score ?? 0));
  const avg = best.length ? Math.round(best.reduce((s, x) => s + x, 0) / best.length) : 0;
  return { tasks: results.length, average: avg, passed: best.filter((x) => x >= 70).length, improved: results.filter((r) => r.retry && r.retry.score > r.first.score).length };
}

/** Проверка рубрик (тесты): каждый пример из рубрики находит свои элементы */
export function validateTask(task) {
  const errors = [];
  if (!task.prompt || !task.elements?.length) errors.push(`${task.id}: no prompt or elements`);
  if (!task.examples?.length) errors.push(`${task.id}: no example answers`);
  const r = evaluate(task, (task.examples || []).join(' '));
  if (r.score < 100) errors.push(`${task.id}: the model answer scores ${r.score} (missed: ${r.missed.join(', ')})`);
  return errors;
}
