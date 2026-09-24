/**
 * Bilim Arena — облако (Supabase): вход и синхронизация.
 *
 * Принцип: платформа всегда читает и пишет локально (core/store.js),
 * а этот модуль в фоне отправляет изменения в Supabase и забирает чужие:
 *   учитель → классы, задания для класса, свои вопросы
 *   ученик  → свой прогресс и ошибки, результаты домашних заданий
 * Без интернета всё продолжает работать и досинхронизируется позже.
 *
 * Доступ к данным ограничен правилами RLS (supabase/schema.sql).
 */

import { SUPABASE } from './config.js';
import { store, KEYS } from './store.js';
import { getProfile, saveProfile, invalidateProfile } from './profile.js';
import { invalidateProgress } from './progress.js';
import { allAssignments, allSubmissions } from './assignments.js';
import { allQuestions } from './questions.js';
import { mergeAssignments, mergeSubmissions } from './sync.js';

const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/** Какие личные данные синхронизируются у каждой роли */
const PERSONAL = {
  student: [KEYS.profile, KEYS.progress, KEYS.errors, KEYS.history],
  teacher: [KEYS.profile, 'questions', KEYS.lessons]
};
/** Всё, что относится к пользователю на этом устройстве (очищается при смене аккаунта) */
const LOCAL_USER_KEYS = [KEYS.profile, KEYS.progress, KEYS.errors, KEYS.history, 'questions', KEYS.lessons,
  KEYS.assignments, 'submissions', KEYS.classes];

const META = 'sync_meta';     // { key: время последнего изменения на устройстве }
const OWNER = 'sync_owner';   // чьи данные сейчас на устройстве
const LAST = 'sync_last';     // время последней успешной синхронизации
const KNOWN = 'sync_known';   // id заданий учителя, уже синхронизированных с этим устройством

export const cloudConfigured = () => !!(SUPABASE.url && SUPABASE.anonKey);

let clientPromise = null;
let user = null;
let role = null;
const status = { state: 'idle', error: null }; // idle | syncing | ok | error | offline

// ─── Клиент и сессия ──────────────────────────────────────────────────────────

export function getClient() {
  if (!cloudConfigured()) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import(CDN)
      .then(({ createClient }) => createClient(SUPABASE.url, SUPABASE.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      }))
      .catch((e) => { clientPromise = null; throw e; });
  }
  return clientPromise;
}

export async function currentUser() {
  const c = await getClient().catch(() => null);
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session?.user || null;
}

export const cloudStatus = () => ({ ...status, user, role });

function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/**
 * Запуск при открытии любой страницы: восстановить сессию и синхронизироваться.
 * Ничего не делает, если облако не настроено.
 */
export async function initCloud() {
  if (!cloudConfigured()) return;
  try {
    user = await currentUser();
    if (!user) return;
    role = user.is_anonymous ? 'student' : 'teacher';
    await adoptDevice();
    store.onWrite = onLocalWrite;
    await syncAll();
  } catch (e) {
    setStatus(navigator.onLine === false ? 'offline' : 'error', e);
  }
}

function setStatus(state, error = null) {
  status.state = state;
  status.error = error ? String(error.message || error) : null;
  emit('ba:cloud-status', cloudStatus());
}

/**
 * Данные на устройстве принадлежат одному аккаунту.
 * Первый вход — локальный прогресс переносится в аккаунт.
 * Вход другим аккаунтом (общий компьютер в классе) — чужие данные убираются.
 */
async function adoptDevice() {
  const owner = await store.get(OWNER, null);
  if (owner && owner !== user.id) {
    for (const key of LOCAL_USER_KEYS) await store.remove(key);
    await store.remove(META);
    await store.remove(KNOWN);
    invalidateProfile();
    invalidateProgress();
  }
  await store.set(OWNER, user.id, { silent: true });
}

// ─── Вход ─────────────────────────────────────────────────────────────────────

const redirectUrl = () => new URL('./account.html', location.href).href;

export async function teacherSignUp({ email, password, name }) {
  const c = await getClient();
  const { data, error } = await c.auth.signUp({
    email, password,
    options: { data: { name }, emailRedirectTo: redirectUrl() }
  });
  if (error) throw error;
  // Если в проекте включено подтверждение почты — сессии пока нет
  if (!data.session) return { needsConfirmation: true };
  await afterTeacherLogin(name);
  return { needsConfirmation: false };
}

export async function teacherSignIn({ email, password }) {
  const c = await getClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await afterTeacherLogin();
}

async function afterTeacherLogin(name) {
  user = await currentUser();
  if (user?.is_anonymous) throw new Error('anonymous_session');
  role = 'teacher';
  await adoptDevice();
  const profile = await getProfile();
  await saveProfile({
    id: user.id, role: 'teacher',
    name: name || profile.name || user.user_metadata?.name || user.email.split('@')[0]
  });
  store.onWrite = onLocalWrite;
  await syncAll();
}

/** Ученик: анонимный вход + вступление в класс по коду. Почта не нужна. */
export async function studentJoin({ code, name }) {
  const c = await getClient();
  let u = await currentUser();
  if (u && !u.is_anonymous) throw new Error('teacher_signed_in');
  if (!u) {
    const { error } = await c.auth.signInAnonymously();
    if (error) throw error;
    u = await currentUser();
  }
  user = u;
  role = 'student';
  await adoptDevice();

  const { data, error } = await c.rpc('join_class', { code: String(code).trim(), display_name: String(name).trim() });
  if (error) throw error;
  const cls = data?.[0];
  if (!cls) throw new Error('class_not_found');

  await saveProfile({
    id: user.id, role: 'student', name, classId: cls.class_id, className: cls.class_name,
    ...(cls.grade ? { grade: cls.grade } : {})
  });
  store.onWrite = onLocalWrite;
  await syncAll();
  return cls;
}

/**
 * Выход: сначала отправить несохранённое, потом убрать данные с устройства.
 * force — выйти, даже если последние изменения не удалось отправить.
 */
export async function signOut({ force = false } = {}) {
  const c = await getClient();
  await flush();
  if (!force && pending.size) throw new Error('unsynced');
  store.onWrite = null;
  await c.auth.signOut();
  for (const key of LOCAL_USER_KEYS) await store.remove(key);
  for (const key of [META, OWNER, LAST, KNOWN]) await store.remove(key);
  invalidateProfile();
  invalidateProgress();
  user = null;
  role = null;
  setStatus('idle');
}

// ─── Классы (учитель) ─────────────────────────────────────────────────────────

export async function createClass({ name, grade }) {
  const c = await getClient();
  const { error } = await c.from('classes').insert({ name: String(name).slice(0, 40), grade });
  if (error) throw error;
  await pullTeacherClasses();
}

export async function deleteClass(id) {
  const c = await getClient();
  const { error } = await c.from('classes').delete().eq('id', id);
  if (error) throw error;
  await pullTeacherClasses();
}

export async function removeStudent(classId, userId) {
  const c = await getClient();
  const { error } = await c.from('class_members').delete().eq('class_id', classId).eq('user_id', userId);
  if (error) throw error;
  await pullTeacherClasses();
}

/** Облачные классы в том же формате, что и локальные: { id, name, grade, students } */
async function pullTeacherClasses() {
  const c = await getClient();
  const { data: classes, error } = await c.from('classes')
    .select('id, name, grade, join_code, class_members(user_id, name)')
    .eq('teacher_id', user.id)
    .order('created_at');
  if (error) throw error;

  const local = (await store.get(KEYS.classes, [])).filter((x) => !x.cloud);
  const cloud = classes.map((x) => ({
    id: x.id, name: x.name, grade: x.grade, code: x.join_code, cloud: true,
    students: x.class_members.map((m) => m.name),
    members: x.class_members.map((m) => ({ id: m.user_id, name: m.name }))
  }));
  await store.set(KEYS.classes, [...cloud, ...local], { silent: true });
  return cloud;
}

// ─── Синхронизация ────────────────────────────────────────────────────────────

let syncing = null;

/** Полная синхронизация: забрать изменения и отправить свои */
export async function syncAll() {
  if (!user) return;
  if (syncing) return syncing;
  syncing = (async () => {
    setStatus('syncing');
    try {
      const changed = await syncPersonal();
      if (role === 'teacher') {
        const classes = await pullTeacherClasses();
        await syncTeacherAssignments(classes);
        await pullSubmissions(classes.map((x) => x.id));
      } else {
        await pullStudentAssignments();
        await pushSubmissions();
      }
      await store.set(LAST, Date.now(), { silent: true });
      setStatus('ok');
      emit('ba:synced', { changed });
    } catch (e) {
      setStatus(navigator.onLine === false ? 'offline' : 'error', e);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

export const lastSyncAt = () => store.get(LAST, null);

/**
 * Личные данные: «последняя запись побеждает» по времени изменения.
 * Журналы (ошибки, история) — объединяются, чтобы не терять записи с двух устройств.
 */
async function syncPersonal() {
  const c = await getClient();
  const keys = PERSONAL[role];
  const meta = await store.get(META, {});
  const { data: rows, error } = await c.from('user_data').select('key, value, updated_ms').eq('user_id', user.id).in('key', keys);
  if (error) throw error;

  const remote = Object.fromEntries(rows.map((r) => [r.key, r]));
  const changed = [];
  const upserts = [];

  for (const key of keys) {
    const local = await store.get(key, null);
    const r = remote[key];
    const localMs = meta[key] || 0;

    if (r && (local === null || r.updated_ms > localMs)) {
      let value = r.value;
      if (Array.isArray(value) && Array.isArray(local)) value = mergeLog(local, value);
      await store.set(key, value, { silent: true });
      meta[key] = r.updated_ms;
      changed.push(key);
      if (Array.isArray(value) && value.length !== r.value.length) upserts.push({ key, value, updated_ms: Date.now() });
    } else if (local !== null && (!r || localMs > r.updated_ms)) {
      let value = local;
      if (r && Array.isArray(local) && Array.isArray(r.value)) value = mergeLog(local, r.value);
      const ms = localMs || Date.now();
      meta[key] = ms;
      upserts.push({ key, value, updated_ms: ms });
    }
  }

  if (upserts.length) {
    const { error: e2 } = await c.from('user_data').upsert(upserts.map((u) => ({ ...u, user_id: user.id })));
    if (e2) throw e2;
  }
  await store.set(META, meta, { silent: true });
  if (changed.includes(KEYS.profile)) invalidateProfile();
  if (changed.includes(KEYS.progress)) invalidateProgress();
  return changed;
}

/** Объединение журналов без дублей, по времени, не длиннее 500 записей */
function mergeLog(a, b) {
  const seen = new Set();
  const out = [];
  for (const item of [...a, ...b]) {
    const id = JSON.stringify(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  out.sort((x, y) => (x?.at || 0) - (y?.at || 0));
  return out.slice(-500);
}

/**
 * Задания учителя ↔ облако, в обе стороны.
 *
 * Удаление определяется явно: задание, которое уже было синхронизировано
 * с этим устройством (sync_known), а теперь пропало локально, — удалено
 * здесь; пропало из облака — удалено на другом устройстве.
 * Новое устройство (known пуст) ничего не удаляет, только получает.
 */
async function syncTeacherAssignments(classes) {
  const c = await getClient();
  const { data: remoteRows, error } = await c.from('assignments').select('id, data').eq('teacher_id', user.id);
  if (error) throw error;

  let local = await allAssignments();
  const known = new Set(await store.get(KNOWN, []));
  const localIds = new Set(local.map((a) => a.id));
  let remoteIds = new Set(remoteRows.map((r) => r.id));

  // 1. Удалено на этом устройстве → удалить в облаке
  const deletedHere = [...known].filter((id) => !localIds.has(id) && remoteIds.has(id));
  if (deletedHere.length) {
    const { error: e1 } = await c.from('assignments').delete().in('id', deletedHere);
    if (e1) throw e1;
    remoteIds = new Set([...remoteIds].filter((id) => !deletedHere.includes(id)));
  }

  // 2. Удалено на другом устройстве → убрать отсюда
  const deletedThere = new Set([...known].filter((id) => localIds.has(id) && !remoteIds.has(id)));
  let changed = deletedThere.size > 0;
  local = local.filter((a) => !deletedThere.has(a.id));

  // 3. Новое и изменённое в облаке → сюда (побеждает более свежее)
  remoteRows.forEach(({ id, data }) => {
    const a = data?.assignment;
    if (!a?.id || !remoteIds.has(id)) return;
    const i = local.findIndex((x) => x.id === a.id);
    const stamp = (x) => x.updatedAt || x.createdAt || 0;
    if (i < 0) { local.push(a); changed = true; } else if (stamp(a) > stamp(local[i])) { local[i] = a; changed = true; }
  });
  if (changed) await store.set(KEYS.assignments, local, { silent: true });

  // 4. Задания облачных классов → в облако (вместе с нужными вопросами учителя)
  const cloudClassIds = new Set(classes.map((x) => x.id));
  const questions = await allQuestions();
  const rows = local.filter((a) => cloudClassIds.has(a.classId)).map((a) => {
    const needed = a.questionIds?.length
      ? questions.filter((q) => a.questionIds.includes(q.id))
      : questions.filter((q) => q.topic === a.topic);
    return { id: a.id, class_id: a.classId, teacher_id: user.id, data: { assignment: a, questions: needed }, updated_at: new Date().toISOString() };
  });
  if (rows.length) {
    const { error: e2 } = await c.from('assignments').upsert(rows);
    if (e2) throw e2;
  }

  await store.set(KNOWN, [...new Set([...rows.map((r) => r.id), ...remoteIds])], { silent: true });
}

async function pullSubmissions(classIds) {
  if (!classIds.length) return;
  const c = await getClient();
  const { data, error } = await c.from('submissions').select('data').in('class_id', classIds);
  if (error) throw error;
  await mergeSubmissions(data.map((r) => r.data));
}

/** Ученик получает задания своих классов вместе с нужными вопросами учителя */
async function pullStudentAssignments() {
  const c = await getClient();
  const { data, error } = await c.from('assignments').select('data');
  if (error) throw error;
  await mergeAssignments({
    assignments: data.map((r) => r.data?.assignment).filter(Boolean),
    questions: data.flatMap((r) => r.data?.questions || [])
  });
  // и свои результаты — если выполнял на другом устройстве
  const { data: subs, error: e2 } = await c.from('submissions').select('data').eq('student_id', user.id);
  if (e2) throw e2;
  if (subs.length) await mergeSubmissions(subs.map((r) => r.data));
}

async function pushSubmissions() {
  const c = await getClient();
  const assignments = await allAssignments();
  const rows = (await allSubmissions())
    .filter((s) => s.studentId === user.id)
    .map((s) => ({ s, a: assignments.find((a) => a.id === s.assignmentId) }))
    .filter(({ a }) => a?.classId)
    .map(({ s, a }) => ({ assignment_id: s.assignmentId, student_id: user.id, class_id: a.classId, data: s, updated_at: new Date().toISOString() }));
  if (!rows.length) return;
  const { error } = await c.from('submissions').upsert(rows);
  if (error) throw error;
}

// ─── Отправка локальных изменений ─────────────────────────────────────────────

const pending = new Set();
let timer = null;

/** Вызывается хранилищем при каждой локальной записи */
async function onLocalWrite(key) {
  if (!user) return;
  const personal = PERSONAL[role].includes(key);
  const shared = (role === 'teacher' && (key === KEYS.assignments || key === 'questions'))
    || (role === 'student' && key === 'submissions');
  if (!personal && !shared) return;

  if (personal) {
    const meta = await store.get(META, {});
    meta[key] = Date.now();
    await store.set(META, meta, { silent: true });
  }
  pending.add(key);
  clearTimeout(timer);
  timer = setTimeout(flush, 1500); // собираем несколько изменений в одну отправку
}

/** Отправить накопленные изменения сейчас */
export async function flush() {
  clearTimeout(timer);
  if (!user || !pending.size) return;
  const keys = [...pending];
  pending.clear();
  try {
    setStatus('syncing');
    if (keys.some((k) => PERSONAL[role].includes(k))) await syncPersonal();
    if (role === 'teacher' && keys.some((k) => k === KEYS.assignments || k === 'questions')) {
      const classes = (await store.get(KEYS.classes, [])).filter((x) => x.cloud);
      await syncTeacherAssignments(classes);
    }
    if (role === 'student' && keys.includes('submissions')) await pushSubmissions();
    await store.set(LAST, Date.now(), { silent: true });
    setStatus('ok');
  } catch (e) {
    keys.forEach((k) => pending.add(k)); // попробуем в следующий раз
    setStatus(navigator.onLine === false ? 'offline' : 'error', e);
  }
}

// Интернет вернулся — досылаем; вкладку закрывают — пытаемся успеть отправить
window.addEventListener('online', () => { if (user) syncAll(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
