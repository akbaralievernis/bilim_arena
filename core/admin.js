/**
 * Bilim Arena — общий банк вопросов и админ-панель (Supabase, ТЗ docs/TZ-ADMIN-2026-10.md).
 *
 * Учитель: предложить свой вопрос в общий банк и видеть решение по своим заявкам.
 * Администратор: обзор статистики, заявки, общий банк, очистка анонимных аккаунтов.
 * Права проверяет база (RLS и функции is_admin/admin_*): страница только показывает то,
 * что база разрешила. Секретных ключей здесь нет.
 */

import { getClient, currentUser } from './cloud.js';
import { getProfile } from './profile.js';

async function client() {
  return getClient();
}

const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};

/** Таблиц ещё нет (миграция 2026-10-23 не выполнена) */
export const notMigrated = (e) => /does not exist|schema cache|PGRST20[0-9]|42P01|42883/i.test(String(e?.message || e?.code || e));

// ─── Учитель ─────────────────────────────────────────────────────────────────

/** Вопрос учителя для заявки: без служебных полей устройства */
export function submissionQuestion(q) {
  const copy = { ...q };
  for (const k of ['id', 'createdAt', 'updatedAt', 'cloudAt']) delete copy[k];
  return copy;
}

/** Предложить вопрос в общий банк. Бросает 'not_teacher', 'no_topic', 'already_sent' */
export async function submitToBank(q) {
  const user = await currentUser();
  if (!user || user.is_anonymous) throw new Error('not_teacher');
  if (!q?.topic) throw new Error('no_topic');
  const profile = await getProfile();
  const c = await client();
  const { error } = await c.from('question_submissions').insert({
    author_name: String(profile.name || user.user_metadata?.name || '').slice(0, 60),
    topic: q.topic,
    source_id: String(q.id || '').slice(0, 80) || null,
    question: submissionQuestion(q)
  });
  if (error) {
    if (error.code === '23505') throw new Error('already_sent');
    if (/too_many_submissions/.test(error.message)) throw new Error('too_many');
    throw error;
  }
}

/** Мои заявки: Map source_id → { status, note } (последняя по времени) */
export async function mySubmissions() {
  const user = await currentUser();
  if (!user || user.is_anonymous) return new Map();
  const c = await client();
  const rows = check(await c.from('question_submissions')
    .select('source_id,status,admin_note,created_at').eq('author_id', user.id).order('created_at'));
  return new Map((rows || []).filter((r) => r.source_id).map((r) => [r.source_id, { status: r.status, note: r.admin_note }]));
}

// ─── Администратор ───────────────────────────────────────────────────────────

export async function isAdmin() {
  const user = await currentUser();
  if (!user || user.is_anonymous) return false;
  const c = await client();
  const { data, error } = await c.rpc('is_admin');
  if (error) { if (notMigrated(error)) return false; throw error; }
  return data === true;
}

export async function overview(days = 30) {
  const c = await client();
  return check(await c.rpc('admin_overview', { days }));
}

export async function listSubmissions(status = 'pending', limit = 100) {
  const c = await client();
  return check(await c.from('question_submissions')
    .select('id,author_name,topic,question,status,admin_note,created_at,reviewed_at')
    .eq('status', status).order('created_at', { ascending: status === 'pending' }).limit(limit)) || [];
}

export async function approve(id, { question = null, topic = null } = {}) {
  const c = await client();
  return check(await c.rpc('admin_approve_submission', { sid: id, edited: question, new_topic: topic }));
}

export async function reject(id, note = '') {
  const c = await client();
  check(await c.rpc('admin_reject_submission', { sid: id, note: note || null }));
}

export async function listPublic(limit = 500) {
  const c = await client();
  return check(await c.from('public_questions')
    .select('id,topic,question,author_name,active,created_at').order('created_at', { ascending: false }).limit(limit)) || [];
}

export async function setPublicActive(id, active) {
  const c = await client();
  check(await c.from('public_questions').update({ active: !!active, updated_at: new Date().toISOString() }).eq('id', id));
}

export async function staleAnonymous(days = 60) {
  const c = await client();
  return check(await c.rpc('admin_stale_anonymous', { days }));
}

export async function cleanupAnonymous(days = 60) {
  const c = await client();
  return check(await c.rpc('admin_cleanup_anonymous', { days }));
}
