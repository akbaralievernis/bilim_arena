/**
 * Bilim Arena — прогресс ученика.
 *
 * Отличие от прежней версии: XP начисляется за учебную активность
 * (правильные ответы, пройденные темы, задания), а прогресс считается
 * ПО ТЕМАМ И НАВЫКАМ — это позволяет показать «что повторить»,
 * а не просто «7 из 10».
 */

import { store, KEYS } from './store.js';
import { getTopic, skillTitle } from './curriculum.js';

const XP_PER_LEVEL_BASE = 100;
const XP_GROWTH = 1.25;

/** Сколько раз подряд нужно ответить верно, чтобы навык считался освоенным */
const MASTERY_THRESHOLD = 0.8;   // 80% верных ответов
const MASTERY_MIN_ANSWERS = 5;   // и не меньше 5 ответов

const todayKey = () => {
  const d = new Date(); // местное время, не UTC
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

const blank = () => ({
  xp: 0,
  dayXP: 0,
  lastDay: null,
  streak: 0,
  skills: {},   // 'topicId::skillId' -> { ok, total, lastAt }
  topics: {},   // topicId -> { answered, correct, lastAt, games }
  games: {},    // gameId -> { plays, best, xp }
  badges: [],
  dailyGoal: 100
});

let cached = null;

async function read() {
  if (cached) return cached;
  cached = { ...blank(), ...(await store.get(KEYS.progress, {})) };
  return cached;
}

async function write(data) {
  cached = data;
  await store.set(KEYS.progress, data);
  return data;
}

// ─── Уровни ───────────────────────────────────────────────────────────────────

export function levelInfo(xp) {
  let level = 1, need = XP_PER_LEVEL_BASE, rest = xp;
  while (rest >= need) { rest -= need; level++; need = Math.round(need * XP_GROWTH); }
  return { level, into: rest, need, pct: Math.round((rest / need) * 100) };
}

const TITLES = [
  { ky: 'Жаңы окуучу', ru: 'Новичок', en: 'Beginner' },
  { ky: 'Изденүүчү', ru: 'Исследователь', en: 'Explorer' },
  { ky: 'Билимкана', ru: 'Знаток', en: 'Scholar' },
  { ky: 'Акылман', ru: 'Мудрец', en: 'Sage' },
  { ky: 'Устат', ru: 'Мастер', en: 'Master' },
  { ky: 'Билим баатыры', ru: 'Герой знаний', en: 'Knowledge hero' }
];
export const titleFor = (level) => TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))];

// ─── Ежедневная серия ─────────────────────────────────────────────────────────

function touchDay(data) {
  const today = todayKey();
  if (data.lastDay === today) return;
  if (data.lastDay && daysBetween(data.lastDay, today) === 1) data.streak += 1;
  else data.streak = 1;
  data.lastDay = today;
  data.dayXP = 0;
}

// ─── Достижения ───────────────────────────────────────────────────────────────

export const BADGES = [
  { id: 'first-lesson', icon: '🎓', title: { ky: 'Биринчи сабак', ru: 'Первый урок', en: 'First lesson' }, test: (d) => Object.keys(d.topics).length >= 1 },
  { id: 'xp-100', icon: '⭐', title: { ky: '100 XP', ru: '100 XP', en: '100 XP' }, test: (d) => d.xp >= 100 },
  { id: 'xp-1000', icon: '🌟', title: { ky: '1000 XP', ru: '1000 XP', en: '1000 XP' }, test: (d) => d.xp >= 1000 },
  { id: 'streak-7', icon: '🔥', title: { ky: '7 күн катары менен', ru: '7 дней подряд', en: '7-day streak' }, test: (d) => d.streak >= 7 },
  { id: 'ten-correct', icon: '✅', title: { ky: '10 туура жооп', ru: '10 верных ответов', en: '10 correct answers' }, test: (d) => totalCorrect(d) >= 10 },
  { id: 'first-team', icon: '🤝', title: { ky: 'Биринчи командалык оюн', ru: 'Первый командный матч', en: 'First team match' }, test: (d) => !!d.games['team-arena'] },
  { id: 'fractions-master', icon: '🧮', title: { ky: 'Бөлчөктөрдүн устасы', ru: 'Мастер дробей', en: 'Fractions master' }, test: (d) => topicMastery(d, 'math-6-fractions') >= 0.8 },
  { id: 'history-expert', icon: '🏔️', title: { ky: 'Тарыхты билгич', ru: 'Знаток истории', en: 'History expert' }, test: (d) => topicMastery(d, 'kg-history-8-independence') >= 0.8 },
  { id: 'logic-master', icon: '🧠', title: { ky: 'Логиканын устасы', ru: 'Logic Master', en: 'Logic Master' }, test: (d) => topicMastery(d, 'informatics-7-algorithms') >= 0.8 },
  { id: 'english-starter', icon: '🇬🇧', title: { ky: 'English Starter', ru: 'English Starter', en: 'English Starter' }, test: (d) => topicMastery(d, 'english-5-basics') >= 0.6 }
];

const totalCorrect = (d) => Object.values(d.topics).reduce((sum, t) => sum + (t.correct || 0), 0);

function topicMastery(data, topicId) {
  const t = data.topics[topicId];
  if (!t || !t.answered) return 0;
  return t.correct / t.answered;
}

// ─── Основное API ─────────────────────────────────────────────────────────────

/** Полная картина прогресса для интерфейса */
export async function getProgress() {
  const d = await read();
  const lvl = levelInfo(d.xp);
  const today = todayKey();
  const streak = d.lastDay && daysBetween(d.lastDay, today) > 1 ? 0 : d.streak;
  return {
    xp: d.xp,
    dayXP: d.lastDay === today ? d.dayXP : 0,
    dailyGoal: d.dailyGoal,
    streak,
    level: lvl.level,
    levelPct: lvl.pct,
    levelInto: lvl.into,
    levelNeed: lvl.need,
    title: titleFor(lvl.level),
    badges: d.badges,
    topics: d.topics,
    skills: d.skills,
    games: d.games
  };
}

/**
 * Записывает один ответ ученика. Это главный источник и XP, и аналитики.
 * @returns {Promise<{xp:number}>}
 */
export async function recordAnswer({ topic, skill, correct, questionId, timeMs, gameId }) {
  const d = await read();
  touchDay(d);

  const skillKey = `${topic}::${skill}`;
  const s = d.skills[skillKey] || (d.skills[skillKey] = { ok: 0, total: 0, lastAt: 0 });
  s.total += 1;
  if (correct) s.ok += 1;
  s.lastAt = Date.now();

  const t = d.topics[topic] || (d.topics[topic] = { answered: 0, correct: 0, lastAt: 0, games: 0 });
  t.answered += 1;
  if (correct) t.correct += 1;
  t.lastAt = Date.now();

  // XP только за учебную активность: верный ответ даёт больше, попытка — минимум
  const xp = correct ? 10 : 2;
  d.xp += xp;
  d.dayXP += xp;

  // Достижения проверяем и здесь: ученик может играть только на уроке с доски
  const fresh = [];
  BADGES.forEach((b) => {
    if (!d.badges.includes(b.id) && b.test(d)) { d.badges.push(b.id); fresh.push(b); }
  });

  await write(d);

  if (!correct) {
    await store.push(KEYS.errors, {
      at: Date.now(), topic, skill, questionId, gameId, timeMs
    }, 300);
  }
  return { xp, newBadges: fresh };
}

/** Итог игры: рекорд, бонус XP за хорошую работу */
export async function recordGame({ gameId, topic, score, correct = 0, total = 0 }) {
  const d = await read();
  touchDay(d);
  const g = d.games[gameId] || (d.games[gameId] = { plays: 0, best: 0, xp: 0 });
  g.plays += 1;
  const record = score > g.best;
  if (record) g.best = score;

  // Бонус за результат выше 70% — но не за бессмысленные клики
  const ratio = total ? correct / total : 0;
  const bonus = ratio >= 0.7 ? 20 : ratio >= 0.5 ? 10 : 0;
  g.xp += bonus;
  d.xp += bonus;
  d.dayXP += bonus;

  if (topic) {
    const t = d.topics[topic] || (d.topics[topic] = { answered: 0, correct: 0, lastAt: 0, games: 0 });
    t.games += 1;
  }

  const fresh = [];
  BADGES.forEach((b) => {
    if (!d.badges.includes(b.id) && b.test(d)) { d.badges.push(b.id); fresh.push(b); }
  });

  await write(d);
  await store.push(KEYS.history, {
    at: Date.now(), gameId, topic, score, correct, total
  }, 200);

  return { record, bonus, newBadges: fresh };
}

/**
 * Состояние темы: 'learned' | 'review' | 'new'
 * learned — доля верных ответов ≥ 80% при достаточном количестве ответов
 */
export async function topicState(topicId) {
  const d = await read();
  const t = d.topics[topicId];
  if (!t || t.answered < MASTERY_MIN_ANSWERS) return t ? 'review' : 'new';
  return t.correct / t.answered >= MASTERY_THRESHOLD ? 'learned' : 'review';
}

/** Карта знаний по предметам: процент освоения */
export async function knowledgeMap(topicsList) {
  const d = await read();
  const bySubject = {};
  for (const topic of topicsList) {
    const rec = d.topics[topic.id];
    const mastery = rec && rec.answered ? rec.correct / rec.answered : 0;
    const state = !rec ? 'new' : (rec.answered >= MASTERY_MIN_ANSWERS && mastery >= MASTERY_THRESHOLD ? 'learned' : 'review');
    const s = bySubject[topic.subject] || (bySubject[topic.subject] = { total: 0, learned: 0, review: 0, new: 0, sum: 0 });
    s.total += 1;
    s[state] += 1;
    s.sum += mastery;
  }
  Object.values(bySubject).forEach((s) => { s.percent = Math.round((s.sum / s.total) * 100); });
  return bySubject;
}

/**
 * Разбор ошибок: что именно нужно повторить.
 * @returns [{ topic, skill, title, count }]
 */
export async function weakSkills({ topic, limit = 5 } = {}) {
  const errors = await store.get(KEYS.errors, []);
  const counts = {};
  errors.forEach((e) => {
    if (topic && e.topic !== topic) return;
    const key = `${e.topic}::${e.skill}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([key, count]) => {
      const [topicId, skillId] = key.split('::');
      return { topic: topicId, skill: skillId, count, title: skillTitle(topicId, skillId) };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Темы, которые пора повторить (для рекомендаций ученику) */
export async function reviewSuggestions(limit = 3) {
  const d = await read();
  const list = Object.entries(d.topics)
    .map(([id, rec]) => ({
      id,
      topic: getTopic(id),
      mastery: rec.answered ? rec.correct / rec.answered : 0,
      lastAt: rec.lastAt
    }))
    .filter((x) => x.topic && x.mastery < MASTERY_THRESHOLD)
    .sort((a, b) => a.mastery - b.mastery);
  return list.slice(0, limit);
}

export async function history(limit = 20) {
  const list = await store.get(KEYS.history, []);
  return list.slice(-limit).reverse();
}

export async function resetProgress() {
  cached = null;
  await store.set(KEYS.progress, blank());
  await store.set(KEYS.errors, []);
  await store.set(KEYS.history, []);
}

/** Перенос прогресса из старой версии сайта (BA_PROGRESS_V1) */
export async function migrateLegacy() {
  const d = await read();
  if (d.xp > 0) return false;
  try {
    const raw = localStorage.getItem('BA_PROGRESS_V1');
    if (!raw) return false;
    const old = JSON.parse(raw);
    d.xp = old.xp || 0;
    d.streak = old.streak || 0;
    d.lastDay = old.lastDay || null;
    d.dayXP = old.dayXP || 0;
    Object.entries(old.games || {}).forEach(([id, g]) => { d.games[id] = g; });
    await write(d);
    return true;
  } catch {
    return false;
  }
}
