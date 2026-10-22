/**
 * Bilim Arena — админ-панель (ТЗ docs/TZ-ADMIN-2026-10.md).
 *
 * Страница не в меню: ссылка появляется на «Аккаунте» только у администратора.
 * Права проверяет база (is_admin и функции admin_*): без них запросы возвращают
 * ошибку, а страница показывает «Нет доступа». Статистика обезличена.
 */

import { bootstrap, mountHeader, el, $, $$, toast } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { SUPABASE } from './core/config.js';
import { TOPICS, getTopic, findQuestion } from './core/curriculum.js';
import { toEngineQuestion } from './core/questions.js';
import { getGame } from './data/games.js';

let admin = null;
const state = { days: 30, status: 'pending', tab: 'overview' };

// ─── Вход ─────────────────────────────────────────────────────────────────────

function gate(key, { signIn = false, vars } = {}) {
  $('#gateText').removeAttribute('data-i18n');
  $('#gateText').textContent = t(key, vars);
  $('#gateActions').classList.toggle('hidden', !signIn);
  $('#gate').classList.remove('hidden');
  $('#panel').classList.add('hidden');
}

async function checkAccess() {
  if (!SUPABASE.url || !SUPABASE.anonKey) return gate('adm_no_cloud');
  try {
    const cloud = await import('./core/cloud.js');
    admin = await import('./core/admin.js');
    const user = await cloud.currentUser();
    if (!user || user.is_anonymous) return gate('adm_need_teacher', { signIn: true });
    let ok = false;
    try {
      const c = await cloud.getClient();
      const { data, error } = await c.rpc('is_admin');
      if (error) {
        if (admin.notMigrated(error)) return gate('adm_not_migrated');
        throw error;
      }
      ok = data === true;
    } catch (e) {
      console.warn('[admin]', e);
      return gate('acc_err_network');
    }
    if (!ok) return gate('adm_denied', { vars: { email: user.email || '' } });
    $('#gate').classList.add('hidden');
    $('#panel').classList.remove('hidden');
    return true;
  } catch (e) {
    console.warn('[admin]', e);
    return gate('acc_err_network');
  }
}

// ─── Подписи ──────────────────────────────────────────────────────────────────

const SPECIAL_GAMES = { practice: 'adm_game_practice', homework: 'adm_game_homework' };
const gameName = (id) => {
  const g = getGame(id);
  if (g) return pick(g.title);
  return SPECIAL_GAMES[id] ? t(SPECIAL_GAMES[id]) : id;
};
const topicName = (id) => (getTopic(id) ? pick(getTopic(id).title) : id || '—');
const fmt = (n) => Number(n || 0).toLocaleString(getLang() === 'en' ? 'en-US' : 'ru-RU');
const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
const dateText = (iso) => (iso ? new Date(iso).toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'ru-RU') : '');

// ─── Схемы (HTML, без библиотек; подсказка — при наведении и для экранного диктора) ─────

/** Столбики по дням: пропущенные дни — нули, подписи — первый, средний и последний день */
function dayColumns(rows, since, days, unit) {
  const byDay = new Map(rows.map((r) => [String(r.day).slice(0, 10), Number(r.n) || 0]));
  const start = new Date(`${since}T00:00:00Z`);
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    return { day: d, n: byDay.get(d) || 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.n));
  const total = series.reduce((a, s) => a + s.n, 0);
  if (!total) return el('p', { class: 'muted small' }, t('adm_no_data'));
  const label = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return el('figure', { class: 'adm-days' },
    el('div', { class: 'adm-days-top small muted' }, `${t('adm_total')}: ${fmt(total)} · ${t('adm_max')}: ${fmt(max)}`),
    el('div', { class: 'adm-cols', role: 'list' },
      series.map((s) => el('div', {
        class: 'adm-col', role: 'listitem', tabindex: '0',
        title: `${label(s.day)}: ${fmt(s.n)} ${unit}`, 'aria-label': `${label(s.day)}: ${fmt(s.n)} ${unit}`
      }, el('span', { style: `height:${s.n ? Math.max(3, (s.n / max) * 100) : 0}%` })))),
    el('figcaption', { class: 'adm-days-axis small muted' },
      el('span', {}, label(series[0].day)),
      el('span', {}, label(series[Math.floor(series.length / 2)].day)),
      el('span', {}, label(series[series.length - 1].day))));
}

/** Горизонтальные полосы с подписью и числом */
function hBars(items, { max = null, suffix = '' } = {}) {
  if (!items.length) return el('p', { class: 'muted small' }, t('adm_no_data'));
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return el('ol', { class: 'adm-bars' }, items.map((i) =>
    el('li', { title: i.note || '' },
      el('span', { class: 'adm-bar-label' }, i.label),
      el('span', { class: 'adm-bar-track' }, el('span', { style: `width:${Math.max(2, (i.value / top) * 100)}%` })),
      el('b', { class: 'adm-bar-value' }, `${fmt(i.value)}${suffix}`),
      i.note ? el('span', { class: 'adm-bar-note small muted' }, i.note) : '')));
}

function kpi(value, label, hint = '') {
  return el('div', { class: 'adm-kpi card' }, el('b', {}, value), el('span', { class: 'small muted' }, label), hint ? el('span', { class: 'small muted' }, hint) : '');
}

// ─── Обзор ────────────────────────────────────────────────────────────────────

async function renderOverview() {
  $('#kpis').replaceChildren(el('p', { class: 'muted' }, t('loading')));
  let o;
  try {
    o = await admin.overview(state.days);
  } catch (e) {
    console.warn('[admin]', e);
    $('#kpis').replaceChildren(el('p', { class: 'muted' }, t('acc_err_network')));
    return;
  }
  const tot = o.totals || {};
  const users = o.users || {};
  $('#pendingBadge').textContent = o.bank?.pending ? `(${o.bank.pending})` : '';
  $('#kpis').replaceChildren(
    kpi(fmt(tot.visits_today), t('adm_kpi_visits_today')),
    kpi(fmt(tot.plays_today), t('adm_kpi_plays_today')),
    kpi(fmt(tot.visits), t('adm_kpi_visits')),
    kpi(fmt(tot.plays), t('adm_kpi_plays')),
    kpi(fmt(tot.players), t('adm_kpi_players')),
    kpi(`${pct(tot.correct, tot.answers)}%`, t('adm_kpi_accuracy'), `${fmt(tot.answers)} ${t('adm_answers')}`),
    kpi(fmt(users.teachers), t('adm_kpi_teachers')),
    kpi(fmt(users.students_in_classes), t('adm_kpi_students'), `${fmt(users.classes)} ${t('adm_classes')}`),
    kpi(fmt(o.bank?.public_active), t('adm_kpi_public'))
  );
  const days = state.days;
  $('#chartVisits').replaceChildren(dayColumns(o.visits_by_day || [], o.since, days, t('adm_unit_visits')));
  $('#chartPlays').replaceChildren(dayColumns(o.plays_by_day || [], o.since, days, t('adm_unit_plays')));
  $('#chartGames').replaceChildren(hBars((o.games || []).slice(0, 12).map((g) => ({
    label: gameName(g.game), value: Number(g.plays) || 0,
    note: `${fmt(g.players)} ${t('adm_players')} · ${pct(g.correct, g.answers)}% ${t('adm_correct')}`
  }))));
  const topics = (o.topics || []).filter((x) => Number(x.answers) >= 10)
    .map((x) => ({ ...x, err: 100 - pct(x.correct, x.answers) }))
    .sort((a, b) => b.err - a.err).slice(0, 12);
  $('#chartTopics').replaceChildren(hBars(topics.map((x) => ({
    label: topicName(x.topic), value: x.err,
    note: `${fmt(x.answers)} ${t('adm_answers')} · ${fmt(x.plays)} ${t('adm_unit_plays')}`
  })), { max: 100, suffix: '%' }));
  await renderHard(o.hard_questions || []);
}

async function renderHard(list) {
  if (!list.length) return $('#hardQuestions').replaceChildren(el('p', { class: 'muted small' }, t('adm_no_data')));
  const rows = await Promise.all(list.map(async (h) => {
    const q = await findQuestion(h.topic, h.id).catch(() => null);
    return el('tr', {},
      el('td', {}, q ? pick(q.prompt) : h.id),
      el('td', {}, topicName(h.topic)),
      el('td', { class: 'num' }, fmt(h.answers)),
      el('td', { class: 'num' }, `${pct(h.wrong, h.answers)}%`));
  }));
  $('#hardQuestions').replaceChildren(el('div', { class: 'adm-table-wrap' }, el('table', { class: 'adm-table' },
    el('thead', {}, el('tr', {},
      el('th', { scope: 'col' }, t('adm_col_question')), el('th', { scope: 'col' }, t('adm_col_topic')),
      el('th', { scope: 'col', class: 'num' }, t('adm_col_answers')), el('th', { scope: 'col', class: 'num' }, t('adm_col_wrong')))),
    el('tbody', {}, rows))));
}

// ─── Просмотр вопроса ─────────────────────────────────────────────────────────

const safeImage = (src) => (typeof src === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(src) ? src : null);

function questionPreview(raw, topic) {
  let q;
  try { q = toEngineQuestion({ ...raw, id: 'preview', topic }); } catch { q = null; }
  if (!q) return el('pre', { class: 'small' }, JSON.stringify(raw).slice(0, 500));
  const parts = [el('p', { class: 'adm-q-prompt' }, pick(q.prompt) || '—')];
  const img = safeImage(raw.image);
  if (img) parts.push(el('img', { class: 'adm-q-img', src: img, alt: '' }));
  const correct = new Set([].concat(q.correct ?? []).map(Number));
  if (q.options?.length) {
    parts.push(el('ol', { class: 'adm-q-options' }, q.options.map((o, i) =>
      el('li', { class: correct.has(i) ? 'ok' : '' }, pick(o), correct.has(i) ? ' ✓' : ''))));
  }
  if (q.answer?.length) parts.push(el('p', { class: 'small' }, `${t('adm_answer')}: `, el('b', {}, q.answer.map((a) => pick(a)).join(' | '))));
  if (q.pairs?.length) parts.push(el('ul', { class: 'small' }, q.pairs.map((p) => el('li', {}, `${pick(p?.[0])} — ${pick(p?.[1])}`))));
  if (q.items?.length) parts.push(el('ol', { class: 'small' }, q.items.map((x) => el('li', {}, pick(x)))));
  if (q.explain) parts.push(el('p', { class: 'small muted' }, `${t('adm_explain')}: ${pick(q.explain)}`));
  return el('div', { class: 'stack adm-q' }, parts);
}

function topicSelect(value) {
  const sel = el('select', { class: 'input', 'aria-label': t('adm_col_topic') });
  TOPICS.filter((x) => x.skills?.length).forEach((x) => {
    const o = el('option', { value: x.id }, pick(x.title));
    if (x.id === value) o.selected = true;
    sel.append(o);
  });
  if (!TOPICS.some((x) => x.id === value)) sel.prepend(el('option', { value, selected: 'selected' }, value));
  return sel;
}

// ─── Заявки ───────────────────────────────────────────────────────────────────

async function renderSubmissions() {
  const box = $('#submissionList');
  box.replaceChildren(el('p', { class: 'muted' }, t('loading')));
  let list;
  try { list = await admin.listSubmissions(state.status); } catch (e) {
    console.warn('[admin]', e);
    return box.replaceChildren(el('p', { class: 'muted' }, t('acc_err_network')));
  }
  if (!list.length) return box.replaceChildren(el('div', { class: 'card center muted' }, t('adm_sub_empty')));
  box.replaceChildren(...list.map(submissionCard));
}

function submissionCard(s) {
  const card = el('article', { class: 'card stack adm-sub' });
  const head = el('div', { class: 'row between' },
    el('div', {}, el('b', {}, s.author_name || t('adm_unknown_author')), el('span', { class: 'muted small' }, ` · ${topicName(s.topic)} · ${dateText(s.created_at)}`)),
    s.status !== 'pending' ? el('span', { class: `chip small adm-st-${s.status}` }, t('adm_st_' + s.status)) : '');
  card.append(head, questionPreview(s.question, s.topic));
  if (s.admin_note) card.append(el('p', { class: 'small' }, `${t('adm_note')}: ${s.admin_note}`));
  if (s.status !== 'pending') return card;

  const topic = topicSelect(s.topic);
  const editor = el('textarea', { class: 'input adm-json hidden', rows: '10', spellcheck: 'false', 'aria-label': t('adm_edit') });
  editor.value = JSON.stringify(s.question, null, 2);
  const approveBtn = el('button', { class: 'btn primary', type: 'button' }, t('adm_approve'));
  const rejectBtn = el('button', { class: 'btn danger', type: 'button' }, t('adm_reject'));
  const editBtn = el('button', { class: 'btn ghost', type: 'button', 'aria-expanded': 'false' }, t('adm_edit'));
  editBtn.addEventListener('click', () => {
    const open = editor.classList.toggle('hidden') === false;
    editBtn.setAttribute('aria-expanded', String(open));
  });
  approveBtn.addEventListener('click', async () => {
    let edited = null;
    if (!editor.classList.contains('hidden')) {
      try {
        edited = JSON.parse(editor.value);
        if (!edited || typeof edited !== 'object' || Array.isArray(edited)) throw new Error('not object');
      } catch {
        return toast(t('adm_bad_json'), { icon: '⚠️', ms: 5000 });
      }
    }
    approveBtn.disabled = true;
    try {
      await admin.approve(s.id, { question: edited, topic: topic.value !== s.topic ? topic.value : null });
      toast(t('adm_approved'), { icon: '✅' });
      card.remove();
      refreshBadge();
    } catch (e) {
      console.warn('[admin]', e);
      toast(t('acc_err_network'), { icon: '⚠️' });
      approveBtn.disabled = false;
    }
  });
  rejectBtn.addEventListener('click', async () => {
    const note = prompt(t('adm_reject_note'), '');
    if (note === null) return;
    rejectBtn.disabled = true;
    try {
      await admin.reject(s.id, note.trim().slice(0, 500));
      toast(t('adm_rejected'), { icon: '🗑️' });
      card.remove();
      refreshBadge();
    } catch (e) {
      console.warn('[admin]', e);
      toast(t('acc_err_network'), { icon: '⚠️' });
      rejectBtn.disabled = false;
    }
  });
  card.append(el('label', { class: 'field' }, el('span', { class: 'label' }, t('adm_col_topic')), topic), editor,
    el('div', { class: 'row' }, approveBtn, rejectBtn, editBtn));
  return card;
}

async function refreshBadge() {
  try {
    const pending = await admin.listSubmissions('pending', 200);
    $('#pendingBadge').textContent = pending.length ? `(${pending.length})` : '';
  } catch { /* бейдж необязателен */ }
}

// ─── Общий банк ───────────────────────────────────────────────────────────────

async function renderBank() {
  const box = $('#bankList');
  box.replaceChildren(el('p', { class: 'muted' }, t('loading')));
  let list;
  try { list = await admin.listPublic(); } catch (e) {
    console.warn('[admin]', e);
    return box.replaceChildren(el('p', { class: 'muted' }, t('acc_err_network')));
  }
  if (!list.length) return box.replaceChildren(el('div', { class: 'card center muted' }, t('adm_bank_empty')));
  box.replaceChildren(...list.map((q) => {
    const btn = el('button', { class: 'btn ghost', type: 'button' }, t(q.active ? 'adm_hide' : 'adm_show'));
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await admin.setPublicActive(q.id, !q.active);
        q.active = !q.active;
        btn.textContent = t(q.active ? 'adm_hide' : 'adm_show');
        btn.closest('.adm-sub').classList.toggle('off', !q.active);
      } catch (e) {
        console.warn('[admin]', e);
        toast(t('acc_err_network'), { icon: '⚠️' });
      } finally { btn.disabled = false; }
    });
    return el('article', { class: `card stack adm-sub ${q.active ? '' : 'off'}` },
      el('div', { class: 'row between' },
        el('span', { class: 'muted small' }, `${topicName(q.topic)} · ${q.author_name || t('adm_unknown_author')} · ${dateText(q.created_at)}`), btn),
      questionPreview(q.question, q.topic));
  }));
}

// ─── Обслуживание ─────────────────────────────────────────────────────────────

const anonDays = () => Math.min(365, Math.max(14, Number($('#anonDays').value) || 60));

async function checkAnon() {
  try {
    const n = await admin.staleAnonymous(anonDays());
    $('#anonCount').textContent = t('adm_anon_found', { n: fmt(n) });
    return n;
  } catch (e) {
    console.warn('[admin]', e);
    $('#anonCount').textContent = t('acc_err_network');
    return 0;
  }
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

function showTab(tab) {
  state.tab = tab;
  $$('[data-tab]').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
  });
  ['overview', 'submissions', 'bank', 'service'].forEach((id) => $('#tab-' + id).classList.toggle('hidden', id !== tab));
  if (tab === 'overview') renderOverview();
  if (tab === 'submissions') renderSubmissions();
  if (tab === 'bank') renderBank();
  if (tab === 'service') checkAnon();
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'teacher', active: '' });
  if (!(await checkAccess())) return;

  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $$('[data-days]').forEach((b) => b.addEventListener('click', () => {
    state.days = Number(b.dataset.days);
    $$('[data-days]').forEach((x) => x.classList.toggle('on', x === b));
    renderOverview();
  }));
  $$('[data-status]').forEach((b) => b.addEventListener('click', () => {
    state.status = b.dataset.status;
    $$('[data-status]').forEach((x) => x.classList.toggle('on', x === b));
    renderSubmissions();
  }));
  $('#anonCheckBtn').addEventListener('click', checkAnon);
  $('#anonCleanBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const n = await checkAnon();
    if (!n) return toast(t('adm_anon_none'), { icon: '✅' });
    if (!confirm(t('adm_anon_confirm', { n: fmt(n) }))) return;
    btn.disabled = true;
    try {
      const removed = await admin.cleanupAnonymous(anonDays());
      toast(t('adm_anon_removed', { n: fmt(removed) }), { icon: '🗑️', ms: 5000 });
      await checkAnon();
    } catch (err) {
      console.warn('[admin]', err);
      toast(t('acc_err_network'), { icon: '⚠️' });
    } finally { btn.disabled = false; }
  });

  showTab('overview');
})();
