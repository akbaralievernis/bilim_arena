/**
 * Bilim Arena — общие компоненты каталога игр.
 *
 * Карточка игры, карточка категории, поиск и сортировка используются
 * и на главной, и в каталоге (games.html) — один код, один вид.
 */

import { el } from './ui.js';
import { t, pick, getLang } from './i18n.js';
import { icon } from './icons.js';
import { cover } from './art.js';
import { CATEGORIES, DIFFICULTY, playersLabel, getCategory } from '../data/games.js';

/** Игра идёт на доске с классом — ученик сам её не запустит */
export const needsTeacher = (g) => g.devices.includes('board') && !g.devices.includes('computer');

/** Популярность: редакционная оценка + сыгранные на этом устройстве игры */
export const popularity = (g, plays = {}) => g.rank + Math.min(40, (plays[g.id]?.plays || 0) * 4);

/** Поиск по названию, описанию, категории (на всех трёх языках) и латинскому имени игры */
export function matches(g, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const cat = getCategory(g.category);
  const hay = [g.title, g.desc, cat?.title]
    .flatMap((x) => (x ? Object.values(x) : []))
    .concat(g.id.replace(/-/g, ' '))
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => hay.includes(word));
}

export function sortGames(list, sort, plays = {}) {
  const lang = getLang();
  const arr = list.slice();
  if (sort === 'new') arr.sort((a, b) => b.added.localeCompare(a.added) || b.rank - a.rank);
  else if (sort === 'name') arr.sort((a, b) => pick(a.title, lang).localeCompare(pick(b.title, lang), lang));
  else arr.sort((a, b) => popularity(b, plays) - popularity(a, plays));
  return arr;
}

/** Строка «Орто · 2–10 · 10 мүн» с понятными подписями для экранного диктора */
export function metaLine(g) {
  const lang = getLang();
  return el('p', { class: 'gc-meta' },
    el('span', {}, el('span', { class: 'sr-only' }, `${t('f_difficulty')}: `), pick(DIFFICULTY[g.difficulty], lang)),
    el('span', {}, el('span', { class: 'sr-only' }, `${t('f_players')}: `), icon('users', { size: 15 }), playersLabel(g.players)),
    el('span', {}, icon('clock', { size: 15 }), t('minutes_n', { n: g.minutes }))
  );
}

/**
 * Карточка игры: обложка 16:9, категория, название (до 2 строк),
 * описание (до 3 строк), «сложность · игроки · время», кнопка «Ойноо».
 */
export function gameCard(g, { headingLevel = 3 } = {}) {
  const lang = getLang();
  const cat = getCategory(g.category);
  const title = pick(g.title, lang);
  const H = `h${headingLevel}`;
  const teacher = needsTeacher(g);

  return el('a', { class: 'game-card card card-link', href: g.href, dataset: { game: g.id } },
    el('div', { class: 'gc-art' }, cover(icon(g.art.icon, { size: 48 }), g.art.tone)),
    el('div', { class: 'gc-body' },
      el('span', { class: 'gc-cat' }, pick(cat?.title, lang), teacher ? el('span', { class: 'gc-teacher' }, ` · ${t('with_teacher_short')}`) : null),
      el(H, { class: 'gc-title' }, title),
      el('p', { class: 'gc-desc' }, pick(g.desc, lang)),
      metaLine(g),
      el('span', { class: 'btn primary gc-play', 'aria-hidden': 'true' }, icon('play', { size: 16 }), t('play'))
    )
  );
}

/** Карточка категории: иллюстрация, название, подпись, число игр */
export function categoryCard(cat, count) {
  const lang = getLang();
  return el('a', { class: 'cat-card card card-link', href: `./games.html?category=${cat.id}` },
    el('div', { class: 'cat-art' }, cover(icon(cat.art.icon, { size: 48 }), cat.art.tone)),
    el('div', { class: 'cat-body' },
      el('h3', {}, pick(cat.title, lang)),
      el('p', { class: 'small muted' }, pick(cat.desc, lang)),
      el('span', { class: 'cat-count' }, t('games_n', { n: count }), icon('chevron', { size: 16 }))
    )
  );
}

export { CATEGORIES };
