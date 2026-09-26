/**
 * Bilim Arena — общий экран «Оюн аяктады».
 *
 * Один вид для тренировки, домашних заданий и «Айт!»:
 * результат, XP, верные ответы, время, навыки; разбор ошибок —
 * только если они были; кнопки «Кайра ойноо», «Башка оюн», «Прогресс».
 */

import { el, fmtTime } from './ui.js';
import { t } from './i18n.js';
import { icon } from './icons.js';

/**
 * @param {object} o
 * @param {number} o.accuracy     процент верных
 * @param {number} [o.xp]         реально начисленный XP (null — не показывать)
 * @param {number} o.correct      верных ответов
 * @param {number} o.total        всего ответов
 * @param {number} [o.timeSec]    длительность
 * @param {Array}  [o.skills]     [{ title, ok, total }]
 * @param {Array}  [o.mistakes]   [{ prompt, explain, extra }] или готовые элементы
 * @param {Function} [o.onRepeatMistakes]  «только ошибки» — кнопка в разборе
 * @param {Function} [o.onAgain]  «Кайра ойноо» (null — кнопку не показывать)
 * @param {object} [o.other]      { label, href } или { label, onClick } — вместо «Башка оюн»
 * @param {Node}   [o.extra]      дополнительный блок под заголовком
 */
export function resultView(o) {
  const verdict = o.accuracy >= 80 ? 'res_great' : o.accuracy >= 50 ? 'res_good' : 'res_try';
  const mistakes = o.mistakes || [];

  const stat = (ic, value, label, tone = '') => el('li', { class: `res-stat ${tone}` },
    el('span', { class: 'res-stat-icon' }, icon(ic, { size: 20 })),
    el('b', {}, value), el('span', {}, label));

  const stats = el('ul', { class: 'res-stats' }, ...[
    stat('target', `${o.accuracy}%`, t('res_result')),
    o.xp != null ? stat('star', `+${o.xp}`, 'XP', 'violet') : null,
    stat('check', `${o.correct}/${o.total}`, t('res_correct'), 'teal'),
    o.timeSec != null ? stat('clock', fmtTime(o.timeSec), t('game_time'), 'amber') : null
  ].filter(Boolean));

  const skills = (o.skills || []).length ? el('section', { class: 'res-block' },
    el('h2', {}, t('res_skills')),
    ...o.skills.map((s) => {
      const pct = s.total ? Math.round((s.ok / s.total) * 100) : 0;
      const weak = pct < 70;
      return el('div', { class: 'res-skill' },
        el('div', { class: 'row between' },
          el('b', {}, s.title),
          el('span', { class: `state ${weak ? 'review' : 'learned'}` }, icon(weak ? 'warn' : 'check', { size: 16 }), `${s.ok}/${s.total}`)),
        el('div', { class: `bar ${weak ? '' : 'ok'}`, role: 'progressbar', 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': s.title },
          el('i', { style: `width:${pct}%` }))
      );
    })) : null;

  // Разбор ошибок: скрыт, пока ученик сам не откроет
  let review = null;
  if (mistakes.length) {
    const panelId = `resMistakes${Date.now()}`;
    const panel = el('div', { class: 'res-mistakes', id: panelId, hidden: true },
      ...mistakes.map((m) => (m.nodeType ? m : el('div', { class: 'card plain res-mistake' },
        el('b', {}, m.prompt || ''),
        m.extra || null,
        m.explain ? el('p', { class: 'small mistake-explain' }, icon('info', { size: 16 }), el('span', {}, m.explain)) : null))),
      o.onRepeatMistakes ? el('button', { class: 'btn soft', type: 'button', onclick: o.onRepeatMistakes },
        icon('refresh', { size: 18 }), el('span', {}, t('res_repeat_mistakes'))) : null
    );
    const toggle = el('button', {
      class: 'btn res-review-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId,
      onclick: () => {
        const open = panel.hidden;
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.classList.toggle('open', open);
      }
    }, icon('lens', { size: 18 }), el('span', {}, t('res_review_mistakes', { n: mistakes.length })), icon('chevron', { size: 16, cls: 'res-chevron' }));
    review = el('section', { class: 'res-block' }, toggle, panel);
  }

  const other = o.other || { label: t('res_other_game'), href: './games.html' };
  const actions = el('div', { class: 'res-actions' }, ...[
    o.onAgain ? el('button', { class: 'btn primary', type: 'button', onclick: o.onAgain }, icon('refresh', { size: 18 }), el('span', {}, t('res_play_again'))) : null,
    other.href
      ? el('a', { class: 'btn', href: other.href }, icon('games', { size: 18 }), el('span', {}, other.label))
      : el('button', { class: 'btn', type: 'button', onclick: other.onClick }, icon('games', { size: 18 }), el('span', {}, other.label)),
    el('a', { class: 'btn', href: './progress.html' }, icon('progress', { size: 18 }), el('span', {}, t('nav_progress')))
  ].filter(Boolean));

  return el('div', { class: 'result-view' },
    el('div', { class: 'res-head' },
      el('span', { class: `res-badge ${o.accuracy >= 80 ? 'win' : ''}` }, icon(o.accuracy >= 80 ? 'trophy' : o.accuracy >= 50 ? 'star' : 'target', { size: 32 })),
      el('h1', { tabindex: '-1' }, t('res_title')),
      el('p', { class: 'muted' }, t(verdict))
    ),
    o.extra || null,
    stats,
    skills,
    review,
    actions
  );
}
