/**
 * Bilim Arena — список ICE-серверов для WebRTC (доска ↔ телефоны).
 *
 * STUN помогает телефону узнать свой внешний адрес — его хватает в обычных
 * сетях. TURN (core/config.js → TURN) пересылает трафик, когда прямое
 * соединение невозможно. Временные пароли TURN кэшируются на час, чтобы не
 * спрашивать сервис при каждом подключении; любой сбой — не ошибка, а просто
 * работа без TURN.
 */

import { TURN } from './config.js';

export const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

const CACHE_KEY = 'ba-turn-servers';
const CACHE_TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;

/** Сервер ICE: urls — строка или массив строк, у TURN есть username и credential. */
export function isIceServer(value) {
  if (!value || typeof value !== 'object') return false;
  const urls = Array.isArray(value.urls) ? value.urls : [value.urls];
  if (urls.length === 0 || !urls.every((u) => typeof u === 'string' && /^(stun|stuns|turn|turns):/.test(u))) return false;
  const needsAuth = urls.some((u) => u.startsWith('turn'));
  return !needsAuth || (typeof value.username === 'string' && typeof value.credential === 'string');
}

export const isTurnConfigured = (config = TURN) =>
  Boolean(config?.credentialsUrl) || (Array.isArray(config?.servers) && config.servers.some(isIceServer));

function readCache(storage, now) {
  try {
    const cached = JSON.parse(storage?.getItem(CACHE_KEY) || 'null');
    if (cached && cached.until > now && Array.isArray(cached.servers)) return cached.servers.filter(isIceServer);
  } catch { /* повреждённый кэш — запросим заново */ }
  return null;
}

function writeCache(storage, servers, now) {
  try { storage?.setItem(CACHE_KEY, JSON.stringify({ until: now + CACHE_TTL_MS, servers })); } catch { /* приватный режим */ }
}

async function fetchCredentials(url, fetchFn) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetchFn(url, { signal: controller?.signal, cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return (Array.isArray(data) ? data : data?.iceServers || []).filter(isIceServer);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * STUN + TURN для PeerJS. Зависимости передаются для тестов.
 * @returns {Promise<RTCIceServer[]>}
 */
export async function iceServers({
  config = TURN,
  fetchFn = globalThis.fetch?.bind(globalThis),
  storage = globalThis.sessionStorage,
  now = Date.now()
} = {}) {
  const servers = [...STUN_SERVERS];
  if (Array.isArray(config?.servers)) servers.push(...config.servers.filter(isIceServer));

  if (config?.credentialsUrl && fetchFn) {
    let turn = readCache(storage, now);
    if (!turn) {
      turn = await fetchCredentials(config.credentialsUrl, fetchFn);
      if (turn.length > 0) writeCache(storage, turn, now);
    }
    servers.push(...turn);
  }
  return servers;
}
