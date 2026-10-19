/**
 * Bilim Arena — отчёт для ученика и родителей (report.html#d=…).
 * Данные — в ссылке (core/parent-report.js), здесь только показ: всё как текст.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { icon } from './core/icons.js';
import { t, pick, getLang } from './core/i18n.js';
import { getTopic, getSubject, skillTitle } from './core/curriculum.js';
import { decodeReport } from './core/parent-report.js';

const two = (n) => String(n).padStart(2, '0');
const date = (ms) => { const d = new Date(ms); return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`; };
const topicName = (id) => pick(getTopic(id)?.title, getLang()) || '';
const subjectName = (id) => pick(getSubject(getTopic(id)?.subject)?.title, getLang()) || '';
const STATUS_KEY = { mastered: 'mastery_learned', ready: 'mastery_ready', learning: 'mastery_review', insufficient: 'mastery_insufficient', new: 'mastery_new' };
const STATUS_CLS = { mastered: 'learned', ready: 'ready', learning: 'review', insufficient: 'insufficient', new: 'new' };
const KIND_KEY = { lesson: 'pr_kind_lesson', hw: 'pr_kind_hw', paper: 'pr_kind_paper', practice: 'pr_kind_practice' };

const stat = (value, label) => el('div', { class: 'stat' }, el('b', {}, value), el('span', {}, label));
const pctText = (p) => (p == null ? '—' : `${p}%`);

function render(r) {
  const lang = getLang();
  document.title = `${t('pr_title', { name: r.name || '—' })} — ${t('app_name')}`;
  const withData = r.topics.filter((x) => x.p != null);
  const avg = withData.length ? Math.round(withData.reduce((s, x) => s + (x.c ?? x.p), 0) / withData.length) : null;
  const good = r.topics.filter((x) => x.s === 'mastered' || x.s === 'ready');
  const repeat = r.topics.filter((x) => x.s === 'learning');
  const few = r.topics.filter((x) => x.s === 'insufficient');

  const section = (title, ...children) => el('section', { class: 'stack pr-section' }, el('h2', {}, title), ...children);
  const topicLi = (x) => el('li', {},
    el('b', {}, topicName(x.t)), ` · ${subjectName(x.t)} · `,
    el('span', { class: `state ${STATUS_CLS[x.s]}` }, t(STATUS_KEY[x.s])),
    x.c != null ? ` · ${t('rep_last_check')}: ${x.c}%` : x.p != null ? ` · ${x.p}%` : '');

  $('#report').replaceChildren(...[
    el('header', { class: 'stack', style: 'gap:4px' },
      el('h1', { style: 'margin:0' }, t('pr_title', { name: r.name || '—' })),
      el('p', { class: 'muted', style: 'margin:0' }, [
        date(r.at),
        r.by === 'teacher' ? `${t('pr_by_teacher')}${r.teacher ? `: ${r.teacher}` : ''}` : t('pr_by_self')
      ].join(' · '))),
    el('div', { class: 'stats' },
      stat(`${good.length} / ${r.topics.length}`, t('pr_stat_good')),
      stat(pctText(avg), t('pr_stat_avg')),
      stat(String(r.recent.length), t('pr_stat_recent'))),
    r.note ? el('blockquote', { class: 'card plain pr-note' }, el('b', {}, t('pr_note')), el('p', { style: 'margin:4px 0 0' }, r.note)) : null,
    good.length ? section(t('pr_good'), el('ul', { class: 'pr-list' }, ...good.map(topicLi))) : null,
    repeat.length || r.weak.length ? section(t('pr_repeat'),
      repeat.length ? el('ul', { class: 'pr-list' }, ...repeat.map(topicLi)) : null,
      r.weak.length ? el('p', { class: 'small' }, `${t('rep_weak')}: ${r.weak.map((w) => skillTitle(w.t, w.k, lang)).join(', ')}`) : null,
      el('p', { class: 'small muted' }, t('pr_repeat_tip'))) : null,
    few.length ? section(t('pr_few'), el('p', { class: 'small' }, few.map((x) => topicName(x.t)).join(', ')), el('p', { class: 'small muted' }, t('pr_few_tip'))) : null,
    r.recent.length ? section(t('pr_recent'), el('div', { class: 'rep-table-wrap' }, el('table', { class: 'rep-table' },
      el('thead', {}, el('tr', {}, el('th', {}, t('rep_date')), el('th', {}, t('pr_kind')), el('th', {}, t('rep_topic')), el('th', { class: 'num' }, '%'))),
      el('tbody', {}, ...r.recent.map((x) => el('tr', {},
        el('td', {}, x.d ? date(x.d) : '—'), el('td', {}, t(KIND_KEY[x.k])), el('td', {}, x.t ? topicName(x.t) : '—'), el('td', { class: 'num' }, pctText(x.p)))))))) : null,
    !r.topics.length && !r.recent.length ? el('p', { class: 'muted' }, t('pr_empty')) : null,
    section(t('pr_home'), el('ul', { class: 'pr-list' }, ...['pr_home_1', 'pr_home_2', 'pr_home_3'].map((k) => el('li', {}, t(k))))),
    el('p', { class: 'small muted' }, t('pr_disclaimer', { th: r.threshold }))
  ].filter(Boolean));
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: '' });
  const showFromLink = () => {
    const r = decodeReport(location.hash);
    $('#copyBtn').classList.toggle('hidden', !r);
    $('#printBtn').classList.toggle('hidden', !r);
    if (r) return render(r);
    $('#report').replaceChildren(el('h1', {}, icon('warn', { size: 28 }), ' ', t('pr_bad_link')), el('p', { class: 'muted' }, t('pr_bad_link_hint')));
  };
  $('#printBtn').addEventListener('click', () => window.print());
  $('#copyBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); toast(t('pr_link_copied'), { icon: '🔗' }); } catch { toast(t('pr_link_copy_fail'), { icon: 'ℹ️' }); }
  });
  window.addEventListener('hashchange', showFromLink);
  showFromLink();
})();
