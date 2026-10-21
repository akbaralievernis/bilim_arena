/**
 * Bilim Arena — профиль пользователя.
 *
 * Для школьной игры не нужна сложная регистрация: ученик просто вводит имя.
 * Персональных данных собираем минимум — имя, класс, выбранный аватар.
 * Когда появится сервер, здесь же появится вход в аккаунт и синхронизация.
 */

import { store, KEYS } from './store.js';

export const AVATARS = ['🦊', '🐨', '🐼', '🦁', '🐯', '🦉', '🐧', '🐝', '🦅', '🐺', '🐴', '🦋'];

const blank = () => ({
  id: null,
  name: '',
  role: 'student',      // 'student' | 'teacher'
  grade: 6,
  avatar: '🦊',
  classId: null,
  createdAt: null
});

let cached = null;

// Случайная часть — криптостойкая: по id ученика нельзя угадать id одноклассника
const newId = () => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `u_${Date.now()}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
};

export async function getProfile() {
  if (cached) return cached;
  const saved = await store.get(KEYS.profile);
  cached = saved ? { ...blank(), ...saved } : blank();
  return cached;
}

export async function saveProfile(patch) {
  const current = await getProfile();
  const next = { ...current, ...patch };
  if (!next.id) next.id = newId();
  if (!next.createdAt) next.createdAt = Date.now();
  if (next.name) next.name = String(next.name).slice(0, 20).trim();
  cached = next;
  await store.set(KEYS.profile, next);
  return next;
}

export async function isRegistered() {
  const p = await getProfile();
  return !!p.name;
}

export async function setRole(role) {
  return saveProfile({ role: role === 'teacher' ? 'teacher' : 'student' });
}

/** Быстрый вход в игру по QR: имя запоминается, аккаунт не требуется */
export async function quickJoinProfile(name) {
  const p = await getProfile();
  if (p.name) return p;
  return saveProfile({ name, role: 'student' });
}

/** Сбросить кеш — после загрузки профиля из облака */
export function invalidateProfile() { cached = null; }

export async function clearProfile() {
  cached = null;
  await store.remove(KEYS.profile);
}
