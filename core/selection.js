/**
 * Bilim Arena — выбор вопросов для тренировки и итоговой проверки.
 *
 * Память ученика о вопросах: { 'тема::id': { n, ok, miss, at, box, due } }
 *   n / ok / miss — сколько раз отвечал, верно, неверно; at — когда последний раз;
 *   box — «коробка» интервального повторения (1…5), due — когда вопрос пора повторить.
 *
 * Тренировка: сначала ошибки, которые пора повторить, потом новые вопросы,
 * потом давно не виденные. Итоговая проверка: только вопросы, которых ученик
 * ещё не видел. Примерно треть банка (по id, одинаково на всех устройствах)
 * тренировка бережёт для проверки и берёт её только в самом конце.
 */

const DAY = 86400000;
/** Через сколько дней повторять вопрос в коробке 1…5 */
export const INTERVAL_DAYS = [1, 3, 7, 14, 30];
export const TOP_BOX = INTERVAL_DAYS.length;
/** Меньше новых вопросов — проверка не будет честной */
export const CHECK_MIN = 5;

export const memKey = (topic, id) => `${topic}::${id}`;

/** Новая запись памяти после ответа */
export function schedule(rec, correct, now = Date.now()) {
  const r = { n: 0, ok: 0, miss: 0, box: 0, ...rec };
  r.n += 1;
  if (correct) r.ok += 1; else r.miss += 1;
  r.at = now;
  r.box = correct ? Math.min(r.box + 1, TOP_BOX) : 1;
  r.due = now + INTERVAL_DAYS[r.box - 1] * DAY;
  return r;
}

/** Ошибка, которую пора повторить (вопрос, освоенный до последней коробки, не возвращается) */
export const isDue = (rec, now = Date.now()) => !!rec && rec.miss > 0 && rec.box < TOP_BOX && rec.due <= now;

/** Стабильная доля банка для итоговых проверок */
export function reservedForCheck(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 3 === 0;
}

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Сколько ошибок темы пора повторить */
export function dueCount(pool, mem, topic, now = Date.now()) {
  return pool.filter((q) => isDue(mem[memKey(topic, q.id)], now)).length;
}

/** Сколько вопросов темы ученик ещё не видел */
export const unseenCount = (pool, mem, topic) => pool.filter((q) => !mem[memKey(topic, q.id)]).length;

/**
 * Тренировка.
 * @returns {{ questions, review, fresh }} review — сколько ошибок на повторение, fresh — сколько новых
 */
export function pickPractice(pool, mem, topic, { count = 10, now = Date.now(), maxReview = Math.ceil(count * 0.4), focus = [] } = {}) {
  const rec = (q) => mem[memKey(topic, q.id)];
  const due = pool.filter((q) => isDue(rec(q), now)).sort((a, b) => rec(a).due - rec(b).due);
  // Слабые навыки (по диагностике) — первыми среди новых вопросов
  const weakFirst = (arr) => [...arr.filter((q) => focus.includes(q.skill)), ...arr.filter((q) => !focus.includes(q.skill))];
  const unseen = weakFirst(shuffle(pool.filter((q) => !rec(q))));
  const seen = pool.filter((q) => rec(q) && !isDue(rec(q), now)).sort((a, b) => rec(a).at - rec(b).at);

  const review = due.slice(0, maxReview);
  const order = [
    ...review,
    ...unseen.filter((q) => !reservedForCheck(q.id)),
    ...seen,
    ...due.slice(maxReview),
    ...shuffle(unseen.filter((q) => reservedForCheck(q.id)))
  ];
  const questions = shuffle(order.slice(0, count));
  return { questions, review: review.length, fresh: questions.filter((q) => !rec(q)).length };
}

/**
 * Итоговая проверка: только невиданные вопросы.
 * @returns {{ questions, available, enough }} available — сколько новых есть всего
 */
export function pickCheck(pool, mem, topic, { count = 10, min = CHECK_MIN } = {}) {
  const unseen = pool.filter((q) => !mem[memKey(topic, q.id)]);
  const order = [...shuffle(unseen.filter((q) => reservedForCheck(q.id))), ...shuffle(unseen.filter((q) => !reservedForCheck(q.id)))];
  return { questions: shuffle(order.slice(0, count)), available: unseen.length, enough: unseen.length >= min };
}

/** id вопросов темы, которые ученик уже видел — для getQuestions({ avoid }) */
export function seenIds(mem, topic) {
  const prefix = `${topic}::`;
  return Object.keys(mem).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
}

/**
 * Диагностика: по 1–2 новых вопроса на каждый навык темы, сначала лёгкие.
 * Запас итоговой проверки берётся, только если у навыка других новых нет.
 */
export function pickDiagnostic(pool, mem, topic, skills, { perSkill = 2, max = 8 } = {}) {
  const fresh = pool.filter((q) => !mem[memKey(topic, q.id)]);
  const easyFirst = (arr) => shuffle(arr).sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
  const out = [];
  for (let round = 0; round < perSkill; round++) {
    for (const skill of skills) {
      if (out.length >= max) break;
      const left = fresh.filter((q) => q.skill === skill && !out.includes(q));
      const pickFrom = [...easyFirst(left.filter((q) => !reservedForCheck(q.id))), ...(round === 0 ? easyFirst(left.filter((q) => reservedForCheck(q.id))) : [])];
      if (pickFrom[0]) out.push(pickFrom[0]);
    }
  }
  return shuffle(out);
}

/** Навыки, где диагностика показала меньше 70 % */
export const weakSkillsOf = (bySkill = {}) =>
  Object.entries(bySkill).filter(([, s]) => s.total && s.ok / s.total < 0.7).map(([skill]) => skill);

/**
 * Примеры для разбора: сначала вопросы, где ученик ошибся, затем новые
 * (не из запаса проверки). Показанный с ответом вопрос больше не «новый».
 */
export function pickExamples(pool, mem, topic, skills, mistakeIds = [], { perSkill = 2 } = {}) {
  const out = [];
  for (const skill of skills) {
    const ofSkill = pool.filter((q) => q.skill === skill);
    const missed = ofSkill.filter((q) => mistakeIds.includes(q.id));
    const fresh = shuffle(ofSkill.filter((q) => !mem[memKey(topic, q.id)] && !reservedForCheck(q.id)));
    out.push({ skill, questions: [...missed, ...fresh].slice(0, perSkill) });
  }
  return out;
}

/** Запись «вопрос показан с ответом» — не ошибка и не повторение, но уже не новый */
export const shownRecord = (rec, now = Date.now()) => ({ n: 0, ok: 0, miss: 0, box: 0, due: 0, ...rec, shown: true, at: rec?.at || now });
