/**
 * Bilim Arena — поиск повторяющихся вопросов.
 *
 * Точный дубль: тот же текст вопроса (после нормализации) и тот же
 * правильный ответ. Вероятный дубль: тексты похожи (общие слова ≥ 80 %)
 * в одной теме. Функция ничего не удаляет — она только показывает пары,
 * решение принимает человек.
 */

const text = (v, lang) => (v && typeof v === 'object' ? (v[lang] ?? v.ky ?? Object.values(v)[0] ?? '') : String(v ?? ''));

/** Нормализация: регистр, ё/е, знаки препинания, лишние пробелы */
export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"“”'’`.,!?;:()[\]{}—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Правильный ответ вопроса в виде строки (для любого типа) */
export function answerKey(q, lang = 'ky') {
  if (q.type === 'input') return (q.answer || []).map((a) => normalize(a)).sort().join('|');
  if (q.type === 'multiple') return (q.correct || []).map((i) => normalize(text(q.options?.[i], lang))).sort().join('|');
  if (q.type === 'match') return (q.pairs || []).map(([a, b]) => normalize(`${text(a, lang)}=${text(b, lang)}`)).sort().join('|');
  if (q.type === 'sort') return (q.items || []).map((x) => normalize(text(x, lang))).join('>');
  return normalize(text(q.options?.[q.correct ?? 0], lang));
}

const words = (s) => new Set(normalize(s).split(' ').filter((w) => w.length > 1));

function similarity(a, b) {
  const A = words(a);
  const B = words(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  A.forEach((w) => { if (B.has(w)) common += 1; });
  return common / Math.max(A.size, B.size);
}

/**
 * @param {Array} questions — вопросы в формате движка (prompt, options, correct…)
 * @param {object} opts { lang, threshold }
 * @returns {{ exact: Array<[a,b]>, probable: Array<{a,b,score}> }}
 */
export function findDuplicates(questions, { lang = 'ky', threshold = 0.8 } = {}) {
  const exact = [];
  const probable = [];
  const byKey = new Map();
  for (const q of questions) {
    const key = `${normalize(text(q.prompt, lang))}#${answerKey(q, lang)}`;
    if (byKey.has(key)) exact.push([byKey.get(key), q]);
    else byKey.set(key, q);
  }
  const exactPairs = new Set(exact.map(([a, b]) => `${a.id}|${b.id}`));
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const a = questions[i];
      const b = questions[j];
      if (a.topic && b.topic && a.topic !== b.topic) continue;
      if (exactPairs.has(`${a.id}|${b.id}`)) continue;
      const score = similarity(text(a.prompt, lang), text(b.prompt, lang));
      // Похожий текст и тот же ответ — почти наверняка один вопрос.
      // Похожий текст с разными ответами (например «2 + 3» и «2 + 4») — не дубль.
      if (score >= threshold && answerKey(a, lang) === answerKey(b, lang)) probable.push({ a, b, score: Math.round(score * 100) / 100 });
    }
  }
  return { exact, probable };
}
