/**
 * Bilim Arena — обезличенная статистика сайта (Supabase → stats_daily, question_stats).
 *
 * Что уходит: «сегодня с устройства был заход» (один раз в день) и итог игры на движке —
 * игра, тема, сколько игроков, ответов и верных, сколько раз ошиблись на каждом вопросе.
 * Имён, кодов комнат, id пользователей и адресов нет. На доске итог отправляет доска
 * за весь класс, телефоны учеников ничего не отправляют — двойного счёта нет.
 * Нет облака, сети или таблиц (миграция не выполнена) — молча ничего не делаем.
 * На localhost выключено (тесты и разработка не должны попадать в цифры), включить: ?stats=1.
 */

import { SUPABASE } from './config.js';

const VISIT_KEY = 'BA2_visit_day';
const MAX_QUESTIONS = 60;
const ID = /^[A-Za-z0-9_.:-]{1,80}$/;
const SLUG = /^[a-z0-9_-]{1,40}$/;

function enabled() {
  if (!SUPABASE?.url || !SUPABASE?.anonKey || typeof location === 'undefined') return false;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  return !local || new URLSearchParams(location.search).get('stats') === '1';
}

async function rpc(name, body) {
  try {
    await fetch(`${SUPABASE.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE.anonKey,
        Authorization: `Bearer ${SUPABASE.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(body)
    });
  } catch { /* статистика необязательна */ }
}

const today = () => new Date().toISOString().slice(0, 10);

/** Отметить заход: не чаще раза в день с устройства */
export function recordVisit() {
  if (!enabled()) return;
  try {
    if (localStorage.getItem(VISIT_KEY) === today()) return;
    localStorage.setItem(VISIT_KEY, today());
  } catch { return; } // без хранилища не отличить повторный заход — не считаем
  rpc('record_visit', {});
}

/**
 * Итог игры в форме для record_play. log — ответы движка ({ questionId, correct, playerId }).
 * Вопросы учителя (q_…) личные — по ним статистику не собираем.
 */
export function playSummary({ gameId, topic, log = [], players = 0 }) {
  if (!SLUG.test(String(gameId || ''))) return null;
  const byQ = new Map();
  for (const e of log) {
    const id = String(e?.questionId ?? '');
    if (!ID.test(id) || id.startsWith('q_')) continue;
    const s = byQ.get(id) || { id, n: 0, wrong: 0 };
    s.n += 1;
    if (!e.correct) s.wrong += 1;
    byQ.set(id, s);
  }
  const answers = log.length;
  const correct = log.filter((e) => e?.correct).length;
  const people = players || new Set(log.map((e) => e?.playerId).filter(Boolean)).size || (answers ? 1 : 0);
  return {
    game: gameId,
    topic: /^[a-z0-9_-]{1,60}$/.test(String(topic || '')) ? topic : '',
    players: people,
    answers,
    correct,
    questions: [...byQ.values()].slice(0, MAX_QUESTIONS)
  };
}

/** Отправить итог игры (только если в игре были ответы) */
export function recordPlay(args) {
  if (!enabled()) return;
  const body = playSummary(args);
  if (body && body.answers > 0) rpc('record_play', body);
}

/** Суммы для главной: { plays, visits, questions } или null */
export async function publicCounters() {
  if (!enabled()) return null;
  try {
    const res = await fetch(`${SUPABASE.url}/rest/v1/rpc/public_counters`, {
      method: 'POST',
      headers: { apikey: SUPABASE.anonKey, Authorization: `Bearer ${SUPABASE.anonKey}`, 'Content-Type': 'application/json' },
      body: '{}'
    });
    if (!res.ok) return null;
    const c = await res.json();
    return c && typeof c === 'object' ? { plays: Number(c.plays) || 0, visits: Number(c.visits) || 0, questions: Number(c.questions) || 0 } : null;
  } catch {
    return null;
  }
}
