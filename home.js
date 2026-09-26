/**
 * Bilim Arena — главная страница.
 *
 * Порядок: приветствие → поиск → «Оюнду танда» (категории) → популярные →
 * «Продолжить» → «Сенин прогрессиң» → блок для учителя → подвал.
 * Всё, что показано о прогрессе, — реальные данные с этого устройства
 * (или из облака, если оно подключено).
 */

import { bootstrap, mountHeader, el, $ } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { icon } from './core/icons.js';
import { cover, avatar } from './core/art.js';
import { getProgress, history, migrateLegacy } from './core/progress.js';
import { getProfile } from './core/profile.js';
import { getTopic } from './core/curriculum.js';
import { gameCard, categoryCard, sortGames, metaLine } from './core/catalog.js';
import { GAMES, CATEGORIES, getGame, getCategory } from './data/games.js';

function renderHero(profile) {
  $('#heroKicker').textContent = profile.name ? t('home_hello', { name: profile.name }) : t('home_hello_guest');
  $('#heroGames').replaceChildren(icon('games', { size: 20 }), el('span', {}, t('home_see_games')));
  $('#heroProgress').replaceChildren(icon('progress', { size: 20 }), el('span', {}, t('nav_progress')));

  // Иллюстрация: обложки трёх разделов, без постоянного движения
  $('#heroArt').replaceChildren(...CATEGORIES.slice(0, 3).map((c, i) =>
    el('div', { class: `hero-tile hero-tile-${i + 1}` }, cover(icon(c.art.icon, { size: 48 }), c.art.tone))));
}

function renderSearch() {
  const input = $('#homeSearchInput');
  input.placeholder = t('cat_search_ph');
  input.before(icon('search', { size: 22 }));
  $('#homeSearchBtn').replaceChildren(el('span', {}, t('search_btn')));
  // Пустой запрос — просто открыть каталог
  $('#homeSearch').addEventListener('submit', (e) => {
    if (!input.value.trim()) { e.preventDefault(); location.href = './games.html'; }
  });
}

function renderCategories() {
  $('#catGrid').replaceChildren(...CATEGORIES.map((c) => categoryCard(c, GAMES.filter((g) => g.category === c.id).length)));
}

function renderPopular(plays) {
  $('#popAll').replaceChildren(el('span', {}, t('home_see_all')), icon('chevron', { size: 16 }));
  $('#popularGrid').replaceChildren(...sortGames(GAMES, 'popular', plays).slice(0, 4).map((g) => gameCard(g)));
}

// ─── «Продолжить» ─────────────────────────────────────────────────────────────

/**
 * Последняя игра ученика: по времени из прогресса, иначе по истории.
 * Тренировка и домашнее задание ведут на свои страницы.
 */
async function lastActivity(pr) {
  const lang = getLang();
  const recent = await history(1);
  const byTime = Object.entries(pr.games || {})
    .filter(([id, g]) => g.lastAt && getGame(id))
    .sort((a, b) => b[1].lastAt - a[1].lastAt)[0];
  const h = recent[0];

  if (h && (!byTime || h.at >= byTime[1].lastAt)) {
    const game = getGame(h.gameId);
    if (game) return { game };
    const topic = getTopic(h.topic);
    if (h.gameId === 'homework') return { title: topic ? pick(topic.title, lang) : t('nav_tasks'), sub: t('nav_tasks'), href: './tasks.html', art: ['tasks', 'amber'] };
    return {
      title: topic ? pick(topic.title, lang) : t('home_practice_title'), sub: t('home_practice_title'),
      href: topic ? `./practice.html?topic=${topic.id}` : './practice.html', art: ['target', 'teal']
    };
  }
  if (byTime) return { game: getGame(byTime[0]) };
  // Старые записи без времени: самая сыгранная игра
  const most = Object.entries(pr.games || {}).filter(([id, g]) => g.plays && getGame(id)).sort((a, b) => b[1].plays - a[1].plays)[0];
  return most ? { game: getGame(most[0]) } : null;
}

async function renderContinue(pr) {
  const lang = getLang();
  const card = $('#continueCard');
  const last = await lastActivity(pr);

  if (!last) {
    card.classList.add('is-empty');
    card.replaceChildren(
      el('div', { class: 'cont-art' }, cover(icon('play', { size: 48 }), 'violet')),
      el('div', { class: 'cont-body' },
        el('h2', { id: 'contTitle' }, t('home_start_title')),
        el('p', { class: 'muted' }, t('home_start_text')),
        el('a', { class: 'btn primary', href: './games.html' }, icon('games', { size: 18 }), el('span', {}, t('home_see_games')))
      )
    );
    return;
  }

  const g = last.game;
  const title = g ? pick(g.title, lang) : last.title;
  const art = g ? cover(icon(g.art.icon, { size: 48 }), g.art.tone) : cover(icon(last.art[0], { size: 48 }), last.art[1]);
  card.classList.remove('is-empty');
  card.replaceChildren(
    el('h2', { id: 'contTitle' }, t('home_continue_title')),
    el('a', { class: 'cont-game', href: g ? g.href : last.href },
      el('div', { class: 'cont-art' }, art),
      el('div', { class: 'cont-body' },
        el('span', { class: 'gc-cat' }, g ? pick(getCategory(g.category)?.title, lang) : last.sub),
        el('b', { class: 'cont-title' }, title),
        el('span', { class: 'small muted' }, t('home_continue_text')),
        g ? metaLine(g) : null
      )
    ),
    el('a', { class: 'btn primary', href: g ? g.href : last.href }, icon('play', { size: 18 }), el('span', {}, t('home_continue_btn')))
  );
}

// ─── «Сенин прогрессиң» ───────────────────────────────────────────────────────

function renderProgress(profile, pr) {
  const lang = getLang();
  const card = $('#progressCard');
  const left = pr.levelNeed - pr.levelInto;

  const facts = [
    el('li', {}, icon('star', { size: 18, cls: 'ic-primary' }), el('span', {}, el('b', {}, `${pr.xp}`), ' XP')),
    pr.streak > 0 ? el('li', {}, icon('flame', { size: 18, cls: 'ic-reward' }), el('span', {}, t('home_streak', { n: pr.streak }))) : null,
    pr.badges.length ? el('li', {}, icon('trophy', { size: 18, cls: 'ic-reward' }), el('span', {}, t('home_badges', { n: pr.badges.length }))) : null
  ].filter(Boolean);

  card.replaceChildren(
    el('h2', { id: 'progTitle' }, t('home_progress_title')),
    el('div', { class: 'prog-head' },
      avatar(profile.avatar, { size: 64 }),
      el('div', {},
        el('b', { class: 'prog-level' }, t('home_level', { n: pr.level })),
        el('span', { class: 'small muted' }, pick(pr.title, lang))
      )
    ),
    el('div', { class: 'xp-line' },
      el('div', { class: 'bar thick', role: 'progressbar', 'aria-valuenow': String(pr.levelPct), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': t('home_level', { n: pr.level }) },
        el('i', { style: `width:${pr.levelPct}%` })),
      el('span', { class: 'small muted' }, t('home_xp_next', { n: left }))
    ),
    el('ul', { class: 'prog-facts' }, facts),
    el('a', { class: 'btn soft', href: './progress.html' }, icon('progress', { size: 18 }), el('span', {}, t('home_see_progress')))
  );
}

function renderTeacher() {
  $('#teacherArt').replaceChildren(cover(icon('teacher', { size: 48 }), 'teal'));
  $('#teacherBtn').replaceChildren(icon('teacher', { size: 18 }), el('span', {}, t('home_teacher_cta')));
}

function renderFooter() {
  const links = [['games.html', 'nav_games'], ['progress.html', 'nav_progress'], ['profile.html', 'nav_profile'], ['play.html', 'nav_join'], ['teacher.html', 'nav_teacher']];
  $('#footerLinks').setAttribute('aria-label', t('nav_main'));
  $('#footerLinks').replaceChildren(...links.map(([href, key]) => el('a', { href: `./${href}` }, t(key))));
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'index.html' });
  await migrateLegacy(); // XP старых языковых игр — в общий профиль

  const [profile, pr] = await Promise.all([getProfile(), getProgress()]);
  const plays = pr.games || {};

  renderHero(profile);
  renderSearch();
  renderCategories();
  renderPopular(plays);
  await renderContinue(pr);
  renderProgress(profile, pr);
  renderTeacher();
  renderFooter();
  document.querySelector('.two-col').setAttribute('aria-label', t('home_progress_title'));

  // Данные пришли из облака — обновить блоки прогресса
  window.addEventListener('ba:synced', async () => {
    const [p2, pr2] = await Promise.all([getProfile(), getProgress()]);
    await renderContinue(pr2);
    renderProgress(p2, pr2);
  });

  // Офлайн-режим: страницы и игры открываются без интернета
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
