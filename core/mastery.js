/**
 * Bilim Arena — освоена ли тема.
 *
 * «Изучено» ставится только по итоговой проверке (новые вопросы, без подсказок),
 * а не по тренировкам: на тренировке ученик видит объяснения и повторяет вопросы.
 * Пока ответов мало, честно пишем «мало данных», а не делаем вывод.
 *
 * Статусы:
 *   new          — по теме ещё ничего нет
 *   insufficient — ответов меньше минимума, вывод делать рано
 *   learning     — ниже порога (или последняя проверка не сдана)
 *   ready        — на тренировках выше порога, пора на итоговую проверку
 *   mastered     — итоговая проверка сдана не ниже порога
 */

import { store, KEYS } from './store.js';
import { CHECK_MIN } from './selection.js';

export const MASTERY_DEFAULTS = { threshold: 80, minAnswers: 8 };
export const STATUSES = ['new', 'insufficient', 'learning', 'ready', 'mastered'];

const pct = (ok, total) => (total ? Math.round((ok / total) * 100) : null);

/**
 * @param {{ answered?:number, correct?:number, checks?:Array<{correct:number,total:number,at:number}> }} data
 * @param {{ threshold:number, minAnswers:number }} settings
 * @returns {{ status:string, pct:number|null, checkPct:number|null, need:number }}
 *   need — сколько ещё ответов нужно, чтобы делать вывод
 */
export function masteryStatus(data = {}, settings = MASTERY_DEFAULTS) {
  const { threshold, minAnswers } = { ...MASTERY_DEFAULTS, ...settings };
  // Повреждённые данные (не число, не массив) — не ошибка отчёта, а «нет данных» (аудит 21.10)
  const answered = Number(data?.answered) || 0;
  const correct = Number(data?.correct) || 0;
  const checks = (Array.isArray(data?.checks) ? data.checks : []).filter((c) => c && Number.isFinite(Number(c.total)));
  const last = [...checks].reverse().find((c) => c.total >= CHECK_MIN);
  const base = { pct: pct(correct, answered), checkPct: last ? pct(last.correct, last.total) : null, need: 0 };

  if (last) return { ...base, status: base.checkPct >= threshold ? 'mastered' : 'learning' };
  if (!answered) return { ...base, status: 'new' };
  if (answered < minAnswers) return { ...base, status: 'insufficient', need: minAnswers - answered };
  return { ...base, status: base.pct >= threshold ? 'ready' : 'learning' };
}

/** Настройки порога (учитель меняет в «Отчётах»; ученик видит те же значения на своём устройстве) */
export async function masterySettings() {
  const s = await store.get(KEYS.settings, {});
  return { ...MASTERY_DEFAULTS, ...(s?.mastery || {}) };
}

export async function saveMasterySettings({ threshold, minAnswers }) {
  const s = (await store.get(KEYS.settings, {})) || {};
  const clean = {
    threshold: Math.min(100, Math.max(50, Math.round(Number(threshold) || MASTERY_DEFAULTS.threshold))),
    minAnswers: Math.min(50, Math.max(3, Math.round(Number(minAnswers) || MASTERY_DEFAULTS.minAnswers)))
  };
  await store.set(KEYS.settings, { ...s, mastery: clean });
  return clean;
}
