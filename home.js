/**
 * Bilim Arena — главная страница.
 *
 * Коротко и по делу: приветствие и поиск, категории, популярные игры,
 * прогресс ученика, рекомендации и небольшой блок для учителей.
 * Подробности — в каталоге (games.html), профиле и разделе учителя.
 */

import { bootstrap, mountHeader, el, $ } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { icon } from './core/icons.js';
import { cover, avatar } from './core/art.js';
import { getProgress, migrateLegacy } from './core/progress.js';
import { getProfile } from './core/profile.js';
import { gameCard, categoryCard, sortGames, needsTeacher } from './core/catalog.js';
import { GAMES, CATEGORIES } from './data/games.js';

function renderHero(profile) {
  $('#heroKicker').textContent = profile.name ? t('home_hello', { name: profile.name }) : t('home_hello_guest');
  $('#heroSearchInput').placeholder = t('cat_search_ph');
  $('#heroSearchInput').before(icon('search', { size: 20 }));
  $('#joinBtn').replaceChildren(icon('join', { size: 18 }), el('span', {}, t('home_join_lesson')));
  $('#allGamesBtn').replaceChildren(icon('games', { size: 18 }), el('span', {}, t('home_all_games')));

  // Композиция из обложек трёх разделов
  $('#heroArt').replaceChildren(...CATEGORIES.slice(0, 3).map((c, i) =>
    el('div', { class: `hero-tile hero-tile-${i + 1}` }, cover(icon(c.art.icon, { size: 48 }), c.art.tone))));
}

function renderCategories() {
  $('#catGrid').replaceChildren(...CATEGORIES.map((c) => categoryCard(c, GAMES.filter((g) => g.category === c.id).length)));
}

function renderPopular(plays) {
  $('#popAll').replaceChildren(el('span', {}, t('home_see_all')), icon('chevron', { size: 16 }));
  $('#popularGrid').replaceChildren(...sortGames(GAMES, 'popular', plays).slice(0, 6).map((g) => gameCard(g)));
}

/** Рекомендации: то, во что можно играть самому и что ещё не пробовал */
function renderRecommended(plays) {
  const lang = getLang();
  const popularIds = new Set(sortGames(GAMES, 'popular', plays).slice(0, 6).map((g) => g.id));
  const pickList = sortGames(GAMES.filter((g) => !needsTeacher(g) && !g.devices.includes('camera')), 'popular', plays)
    .sort((a, b) => (plays[a.id]?.plays ? 1 : 0) - (plays[b.id]?.plays ? 1 : 0))
    .filter((g) => !popularIds.has(g.id))
    .slice(0, 4);

  $('#recList').replaceChildren(
    ...pickList.map((g) => el('a', { class: 'rec-item card card-link', href: g.href },
      el('div', { class: 'rec-art' }, cover(icon(g.art.icon, { size: 48 }), g.art.tone)),
      el('div', { class: 'rec-body' },
        el('b', {}, pick(g.title, lang)),
        el('span', { class: 'small muted' }, pick(g.desc, lang))
      ),
      icon('chevron', { size: 18, cls: 'rec-go' })
    )),
    el('a', { class: 'rec-item card card-link rec-practice', href: './practice.html' },
      el('div', { class: 'rec-art' }, cover(icon('target', { size: 48 }), 'teal')),
      el('div', { class: 'rec-body' },
        el('b', {}, t('home_practice_title')),
        el('span', { class: 'small muted' }, t('home_practice_text'))
      ),
      icon('chevron', { size: 18, cls: 'rec-go' })
    )
  );
}

/** Прогресс: уровень и XP; нулевые показатели не выводятся блоками */
function renderProgress(profile, pr) {
  const card = $('#progressCard');
  const head = el('div', { class: 'prog-head' },
    avatar(profile.avatar, { size: 64 }),
    el('div', {},
      el('h2', { id: 'progTitle', style: 'margin:0' }, profile.name || t('home_progress_title')),
      el('span', { class: 'small muted' }, `${t('home_level', { n: pr.level })} · ${pick(pr.title, getLang())}`)
    )
  );

  if (!pr.xp) {
    card.replaceChildren(head,
      el('p', { class: 'muted', style: 'margin:0' }, t('home_progress_empty')),
      el('a', { class: 'btn primary', href: './games.html?cat=languages' }, icon('play', { size: 16 }), t('home_progress_start')));
    return;
  }

  const facts = [
    pr.streak > 1 ? el('li', {}, icon('flame', { size: 18, cls: 'ic-reward' }), t('home_streak', { n: pr.streak })) : null,
    pr.badges.length ? el('li', {}, icon('trophy', { size: 18, cls: 'ic-reward' }), t('home_badges', { n: pr.badges.length })) : null
  ].filter(Boolean);
  const dayPct = Math.min(100, Math.round((pr.dayXP / pr.dailyGoal) * 100));

  card.replaceChildren(...[head,
    el('div', { class: 'xp-line' },
      el('div', { class: 'row between small' },
        el('b', {}, `${pr.xp} XP`),
        el('span', { class: 'muted' }, t('home_xp_next', { n: pr.levelNeed - pr.levelInto }))),
      el('div', { class: 'bar thick' }, el('i', { style: `width:${pr.levelPct}%` }))
    ),
    el('div', { class: 'xp-line' },
      el('div', { class: 'row between small' },
        el('span', {}, t('home_daily_goal')),
        el('b', {}, `${pr.dayXP}/${pr.dailyGoal} XP`)),
      el('div', { class: 'bar reward' }, el('i', { style: `width:${dayPct}%` }))
    ),
    facts.length ? el('ul', { class: 'prog-facts' }, facts) : null,
    el('a', { class: 'section-link', href: './progress.html' }, el('span', {}, t('home_open_profile')), icon('chevron', { size: 16 }))
  ].filter(Boolean));
}

function renderTeacher() {
  $('#teacherArt').replaceChildren(cover(icon('teacher', { size: 48 }), 'teal'));
  $('#teacherPoints').replaceChildren(...['home_teacher_p1', 'home_teacher_p2', 'home_teacher_p3'].map((k) =>
    el('li', {}, icon('check', { size: 18 }), el('span', {}, t(k)))));
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'index.html' });
  await migrateLegacy(); // XP старых языковых игр — в общий профиль

  const [profile, pr] = await Promise.all([getProfile(), getProgress()]);
  const plays = pr.games || {};

  renderHero(profile);
  renderCategories();
  renderPopular(plays);
  renderProgress(profile, pr);
  renderRecommended(plays);
  renderTeacher();

  // Офлайн-режим: страницы и игры открываются без интернета
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
