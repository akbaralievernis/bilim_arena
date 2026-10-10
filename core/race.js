/**
 * Bilim Arena — переходы в Bilim Arena Race (отдельный сайт командной гонки).
 *
 * Гонка понимает кыргызский и русский: язык основного сайта передаётся
 * параметром ?lang=, гонка запоминает его у себя. Для английского параметр не
 * передаётся — гонка откроется на своём языке по умолчанию (кыргызский).
 */

import { RACE_URL } from './config.js';
import { getLang } from './i18n.js';

// Тот же алфавит, что у кодов гонки: без 0, 1, O и I.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const RACE_CODE = new RegExp(`^[${ALPHABET}]{6}$`);

export const RACE_CODE_LENGTH = 6;

/** Код урока на доске — 4 символа, код гонки — 6 из своего алфавита. */
export const isRaceCode = (code) => RACE_CODE.test(String(code || '').trim().toUpperCase());

/** raceUrl('/join', { code: 'A7K9Q2' }) → https://…/join?code=A7K9Q2&lang=ky */
export function raceUrl(path = '/', params = {}) {
  const url = new URL(path, RACE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  const lang = getLang();
  if (lang === 'ky' || lang === 'ru') url.searchParams.set('lang', lang);
  return url.toString();
}
