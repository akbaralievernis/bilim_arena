/**
 * Bilim Arena — языки интерфейса.
 *
 * Основной язык — кыргызский. Интерфейс никогда не смешивает языки:
 * если перевода нет, строка берётся из кыргызского, а не подставляется
 * случайный другой язык.
 *
 * Новый язык добавляется одним файлом в locales/ и одной строкой в LANGS.
 */

import { store } from './store.js';

export const LANGS = [
  { code: 'ky', label: 'Кыргызча', flag: '🇰🇬', speech: 'ky-KG' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', speech: 'ru-RU' },
  { code: 'en', label: 'English', flag: '🇬🇧', speech: 'en-US' }
];

const FALLBACK = 'ky';
const dictionaries = {};
let current = FALLBACK;
const listeners = new Set();

/** Достаёт из объекта {ky, ru, en} строку на текущем языке */
export function pick(value, lang = current) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value[FALLBACK] ?? Object.values(value)[0] ?? '';
}

/**
 * Перевод по ключу. Поддерживает подстановки: t('xp_earned', { xp: 20 })
 * В строке пишется так: 'Сиз {xp} XP алдыңыз'
 */
export function t(key, vars) {
  const dict = dictionaries[current] || {};
  const base = dictionaries[FALLBACK] || {};
  let str = dict[key] ?? base[key] ?? key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? vars[name] : m));
  }
  return str;
}

export const getLang = () => current;
export const langMeta = (code = current) => LANGS.find((l) => l.code === code) || LANGS[0];

async function loadDictionary(code) {
  if (dictionaries[code]) return dictionaries[code];
  try {
    const mod = await import(`../locales/${code}.js`);
    dictionaries[code] = mod.default;
  } catch (e) {
    console.warn('[i18n] не удалось загрузить язык', code, e);
    dictionaries[code] = {};
  }
  return dictionaries[code];
}

/** Устанавливает язык и обновляет страницу (data-i18n элементы + слушатели) */
export async function setLang(code) {
  const lang = LANGS.some((l) => l.code === code) ? code : FALLBACK;
  await loadDictionary(FALLBACK);
  if (lang !== FALLBACK) await loadDictionary(lang);
  current = lang;
  document.documentElement.lang = lang;
  await store.set('lang', lang);
  applyToDom();
  listeners.forEach((cb) => cb(lang));
  return lang;
}

/** Вызывается один раз при старте страницы */
export async function initI18n() {
  // Основной язык платформы — кыргызский. Другой язык включается только
  // по явному выбору пользователя и запоминается.
  const saved = await store.get('lang');
  return setLang(saved || FALLBACK);
}

export function onLangChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Переводит статическую разметку:
 *   <h1 data-i18n="nav_learn"></h1>
 *   <input data-i18n-attr="placeholder:search_hint">
 */
export function applyToDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}
