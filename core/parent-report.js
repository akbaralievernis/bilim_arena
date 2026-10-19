/**
 * Bilim Arena — отчёт для ученика и родителей (report.html).
 *
 * Данные отчёта кладутся в ссылку после «#» (report.html#d=…). Эта часть ссылки
 * не уходит на сервер: отчёт ни где не хранится, родителям не нужен вход.
 * В ссылке — только id тем и навыков, проценты и статусы: названия рисуются
 * на языке того, кто открыл ссылку. Всё, что приходит из ссылки, проверяется
 * и показывается как текст (никакого HTML).
 */

import { getTopic } from './curriculum.js';
import { masteryStatus } from './mastery.js';

export const REPORT_VERSION = 1;
const STATUSES = ['new', 'insufficient', 'learning', 'ready', 'mastered'];
const KINDS = ['lesson', 'hw', 'paper', 'practice'];
const LIMITS = { name: 40, note: 600, by: 40, topics: 30, weak: 8, recent: 12 };

// ─── Кодирование ссылки ──────────────────────────────────────────────────────

const toB64url = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s) => {
  const bin = atob(String(s).replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export const encodeReport = (data) => toB64url(JSON.stringify({ ...data, v: REPORT_VERSION }));

// null/пусто — «нет данных», а не ноль (иначе тема без проверки покажет «проверка 0 %»)
const num = (v, min, max) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Math.min(max, Math.max(min, Math.round(Number(v)))));
const str = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const knownTopic = (id) => typeof id === 'string' && !!getTopic(id);
const knownSkill = (topic, skill) => !!getTopic(topic)?.skills?.some((s) => s.id === skill);

/** Разбор и проверка: неизвестные темы, лишние поля и огромные строки отбрасываются */
export function decodeReport(hash) {
  try {
    const raw = JSON.parse(fromB64url(String(hash).replace(/^#?d=/, '')));
    if (!raw || raw.v !== REPORT_VERSION) return null;
    return {
      v: REPORT_VERSION,
      name: str(raw.name, LIMITS.name),
      by: raw.by === 'teacher' ? 'teacher' : 'self',
      teacher: str(raw.teacher, LIMITS.by),
      at: num(raw.at, 0, 4102444800000) || Date.now(),
      note: str(raw.note, LIMITS.note),
      threshold: num(raw.threshold, 50, 100) ?? 80,
      topics: (Array.isArray(raw.topics) ? raw.topics : []).filter((x) => knownTopic(x?.t)).slice(0, LIMITS.topics).map((x) => ({
        t: x.t, s: STATUSES.includes(x.s) ? x.s : 'new', p: num(x.p, 0, 100), c: num(x.c, 0, 100), n: num(x.n, 0, 100000) || 0
      })),
      weak: (Array.isArray(raw.weak) ? raw.weak : []).filter((x) => knownSkill(x?.t, x?.k)).slice(0, LIMITS.weak).map((x) => ({ t: x.t, k: x.k, p: num(x.p, 0, 100) })),
      recent: (Array.isArray(raw.recent) ? raw.recent : []).filter((x) => !x?.t || knownTopic(x.t)).slice(0, LIMITS.recent).map((x) => ({
        d: num(x.d, 0, 4102444800000) || 0, t: x.t || null, k: KINDS.includes(x.k) ? x.k : 'practice', p: num(x.p, 0, 100)
      }))
    };
  } catch {
    return null;
  }
}

export const reportLink = (data) => `${new URL('./report.html', location.href).href}#d=${encodeReport(data)}`;

// ─── Сборка данных ───────────────────────────────────────────────────────────

/** От учителя: studentReport() из core/lessons.js */
export function fromTeacher(r, { note = '', teacher = '' } = {}) {
  return {
    by: 'teacher', name: r.name, teacher, note, at: Date.now(), threshold: r.settings?.threshold,
    topics: r.topicRows.map((x) => ({ t: x.topic, s: x.status, p: x.pct, c: x.checkPct, n: x.answered })),
    weak: r.weak.map((w) => ({ t: w.topic, k: w.skill, p: w.pct })),
    recent: [
      ...r.lessonRows.map((l) => ({ d: l.at, t: l.topic, k: 'lesson', p: l.pct })),
      ...r.homeworkRows.map((h) => ({ d: h.lastAt, t: h.topic, k: 'hw', p: h.best }))
    ].sort((a, b) => b.d - a.d).slice(0, LIMITS.recent)
  };
}

/** От самого ученика: его прогресс на устройстве */
export function fromStudent({ name, progress, weak, history, settings }) {
  const topics = Object.entries(progress.topics || {}).map(([id, rec]) => {
    const m = masteryStatus({ answered: rec.answered, correct: rec.correct, checks: progress.checks?.[id] || [] }, settings);
    return { t: id, s: m.status, p: m.pct, c: m.checkPct, n: rec.answered };
  });
  return {
    by: 'self', name, at: Date.now(), threshold: settings?.threshold,
    topics,
    weak: (weak || []).map((w) => ({ t: w.topic, k: w.skill, p: null })),
    recent: (history || []).map((h) => ({ d: h.at, t: h.topic, k: 'practice', p: h.total ? Math.round((h.correct / h.total) * 100) : null }))
  };
}
