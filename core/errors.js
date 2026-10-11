/**
 * Bilim Arena — сообщения о сбоях в журнал ошибок (Supabase → client_errors).
 *
 * Что уходит: страница без параметров адреса, текст ошибки и начало стека,
 * язык и браузер. Имён, кодов комнат, ответов и id пользователей нет.
 * Не больше 5 отчётов за загрузку страницы, одинаковые не повторяются.
 * На localhost не работает (ошибки разработки не нужны), включить: ?report=1.
 */

import { SUPABASE } from './config.js';

const MAX_PER_PAGE = 5;
// Шум, который не говорит о поломке сайта
const IGNORE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,                 // чужой скрипт, подробностей браузер не даёт
  /NotAllowedError|Permission denied/i, // пользователь не дал камеру или микрофон
  /AbortError/i,
  /chrome-extension:|moz-extension:|safari-extension:/i,
  /Failed to fetch|NetworkError|Load failed/i  // пропал интернет
];

/** Адрес без параметров и якоря: в них бывают коды комнат */
const stripUrl = (s) => String(s ?? '').replace(/(https?:\/\/[^\s?#)]+)[?#][^\s)]*/g, '$1');

/** Готовый отчёт или null, если отправлять не нужно */
export function buildReport(error, { page = '/', lang = '', ua = '' } = {}) {
  const message = String(error?.message ?? error ?? '').replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!message || IGNORE.some((re) => re.test(message))) return null;
  const stack = stripUrl(error?.stack || '').slice(0, 2000) || null;
  if (stack && IGNORE.some((re) => re.test(stack))) return null;
  return {
    page: stripUrl(page).replace(/^https?:\/\/[^/]+/, '').slice(0, 200) || '/',
    message: stripUrl(message),
    stack,
    lang: String(lang).slice(0, 5),
    ua: String(ua).slice(0, 300)
  };
}

let sent = 0;
const seen = new Set();

async function send(report) {
  if (!report || sent >= MAX_PER_PAGE) return;
  const key = `${report.message}|${(report.stack || '').slice(0, 120)}`;
  if (seen.has(key)) return;
  seen.add(key);
  sent += 1;
  try {
    await fetch(`${SUPABASE.url}/rest/v1/client_errors`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE.anonKey,
        Authorization: `Bearer ${SUPABASE.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(report)
    });
  } catch { /* журнал недоступен — сайт работает дальше */ }
}

let started = false;

export function startErrorReporting() {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (!SUPABASE?.url || !SUPABASE?.anonKey) return;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (local && new URLSearchParams(location.search).get('report') !== '1') return;

  const context = () => ({ page: location.pathname, lang: document.documentElement.lang, ua: navigator.userAgent });
  window.addEventListener('error', (e) => {
    // Ошибка загрузки картинки или скрипта приходит без error — это не сбой кода
    if (!e.error && !e.message) return;
    send(buildReport(e.error || e.message, context()));
  });
  window.addEventListener('unhandledrejection', (e) => send(buildReport(e.reason, context())));
}
