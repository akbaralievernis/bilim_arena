/**
 * Bilim Arena — общий банк: вопросы учителей, одобренные администратором (Supabase → public_questions).
 *
 * Загружаются одним REST-запросом (без библиотеки облака) не чаще раза в 6 часов и хранятся
 * на устройстве — работают и офлайн. Игры получают их через curriculum.getQuestions() вместе
 * с файловым банком темы. Процент освоения темы по-прежнему считается только по файловому
 * банку (core/progress.js): одобрение нового вопроса не меняет прогресс учеников задним числом.
 * Нет облака, таблицы или сети — список пуст, игры работают как раньше.
 */

import { SUPABASE } from './config.js';
import { store } from './store.js';
import { toEngineQuestion } from './questions.js';

const KEY = 'public_bank';
const FRESH_MS = 6 * 60 * 60 * 1000;
const PREFIX = 'pub_';

let memo = null;      // { at, rows } — последнее, что знаем
let loading = null;
let forcedForIds = false; // обновление ради недостающего id — не больше раза за загрузку страницы

const configured = () => !!(SUPABASE.url && SUPABASE.anonKey);
// На localhost не загружаем (автотесты не должны зависеть от базы), включить: ?shared=1
const local = () => typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
  && new URLSearchParams(location.search).get('shared') !== '1';

/** Вопрос годится для игры: есть текст и, для выбора, хотя бы два варианта */
function playable(q) {
  if (!q || typeof q !== 'object' || !q.prompt) return false;
  if (q.type === 'choice' || q.type === 'multiple') return Array.isArray(q.options) && q.options.length >= 2;
  if (q.type === 'input') return Array.isArray(q.answer) && q.answer.length > 0;
  if (q.type === 'match') return Array.isArray(q.pairs) && q.pairs.length >= 2;
  if (q.type === 'sort') return Array.isArray(q.items) && q.items.length >= 2;
  return false;
}

/** Строка public_questions → вопрос движка (id с префиксом pub_, не пересекается с банком и учителем) */
export function toPublicQuestion(row) {
  if (!row?.id || !row.topic || !row.question || typeof row.question !== 'object') return null;
  try {
    const q = { ...toEngineQuestion({ ...row.question, id: PREFIX + row.id, topic: row.topic }), custom: false, shared: true };
    if (row.author_name) q.author = String(row.author_name).slice(0, 60);
    return playable(q) ? q : null;
  } catch {
    return null;
  }
}

async function cached() {
  if (memo) return memo;
  const saved = await store.get(KEY, null);
  memo = saved && Array.isArray(saved.rows) ? saved : { at: 0, rows: [] };
  return memo;
}

/** Загрузить свежий список (не чаще раза в 6 часов, если не force) */
export async function refreshPublicBank({ force = false } = {}) {
  if (!configured() || local()) return (await cached()).rows;
  const current = await cached();
  if (!force && Date.now() - current.at < FRESH_MS) return current.rows;
  if (loading) return loading;
  loading = (async () => {
    try {
      const res = await fetch(`${SUPABASE.url}/rest/v1/public_questions?select=id,topic,question,author_name&active=eq.true&order=created_at`, {
        headers: { apikey: SUPABASE.anonKey, Authorization: `Bearer ${SUPABASE.anonKey}` }
      });
      if (!res.ok) throw new Error(`public_bank ${res.status}`);
      const rows = await res.json();
      memo = { at: Date.now(), rows: Array.isArray(rows) ? rows : [] };
      // Место в браузере могло кончиться (картинки) — тогда список живёт только до перезагрузки
      await store.set(KEY, memo, { silent: true });
    } catch {
      // Нет сети или таблицы ещё нет (миграция не выполнена) — остаёмся с тем, что было
      memo = { ...current, at: current.at || Date.now() - FRESH_MS + 10 * 60 * 1000 };
    } finally {
      loading = null;
    }
    return memo.rows;
  })();
  return loading;
}

/** Вопросы общего банка в формате движка — с теми же фильтрами, что у вопросов учителя */
export async function publicQuestions({ topic, skills, difficulty } = {}) {
  const { rows } = await cached();
  let list = rows.filter((r) => !topic || r.topic === topic).map(toPublicQuestion).filter(Boolean);
  if (skills?.length) list = list.filter((q) => skills.includes(q.skill));
  if (difficulty?.length) list = list.filter((q) => difficulty.includes(q.difficulty ?? 1));
  return list;
}

/** Конкретные вопросы по id (pub_…) — для заданий с ручным выбором */
export async function publicQuestionsByIds(ids = []) {
  const wanted = new Set(ids.filter((id) => String(id).startsWith(PREFIX)));
  if (!wanted.size) return [];
  let { rows } = await cached();
  // Задание учителя ссылается на вопрос, которого на этом устройстве ещё нет — один раз обновить список
  if (!forcedForIds && [...wanted].some((id) => !rows.some((r) => PREFIX + r.id === id))) {
    forcedForIds = true;
    rows = await refreshPublicBank({ force: true });
  }
  return rows.filter((r) => wanted.has(PREFIX + r.id)).map(toPublicQuestion).filter(Boolean);
}

export const isPublicId = (id) => String(id || '').startsWith(PREFIX);

/** Для тестов: забыть кэш в памяти */
export function _resetPublicBank() { memo = null; loading = null; forcedForIds = false; }
