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
import { CATEGORIES, TYPES, DIFFICULTY, PLAYERS, DEVICES, getCategory } from '../data/games.js';

const DIFF_TONE = { 1: 'teal', 2: 'amber', 3: 'violet' };
const DEVICE_ICON = { phone: 'join', computer: 'device', board: 'board', camera: 'camera' };

/** Игра идёт на доске с классом — ученик сам её не запустит */
export const needsTeacher = (g) => g.players === 'class' && g.devices.includes('board');

/** Популярность: редакционная оценка + сыгранные на этом устройстве игры */
export const popularity = (g, plays = {}) => g.rank + Math.min(40, (plays[g.id]?.plays || 0) * 4);

/** Поиск по названию, описанию и категории — на всех трёх языках */
export function matches(g, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const cat = getCategory(g.category);
  const hay = [g.title, g.desc, cat?.title]
    .flatMap((x) => (x ? Object.values(x) : []))
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

/** Карточка игры: иллюстрация, название, описание, метки, время, игроки, «Ойноо» */
export function gameCard(g, { headingLevel = 3 } = {}) {
  const lang = getLang();
  const cat = getCategory(g.category);
  const title = pick(g.title, lang);
  const H = `h${headingLevel}`;

  return el('a', { class: 'game-card card card-link', href: g.href, 'aria-label': `${title} — ${t('play')}` },
    el('div', { class: 'gc-art' }, cover(icon(g.art.icon, { size: 48 }), g.art.tone)),
    el('div', { class: 'gc-body' },
      el('div', { class: 'gc-tags' },
        el('span', { class: 'tag violet' }, pick(cat?.title, lang)),
        el('span', { class: `tag ${DIFF_TONE[g.difficulty]}` }, icon('level', { size: 14 }), pick(DIFFICULTY[g.difficulty], lang))
      ),
      el(H, { class: 'gc-title' }, title),
      el('p', { class: 'gc-desc' }, pick(g.desc, lang)),
      el('ul', { class: 'gc-meta' },
        el('li', {}, icon('clock', { size: 16 }), t('minutes_n', { n: g.minutes })),
        el('li', {}, icon(g.players === 'solo' ? 'user' : 'users', { size: 16 }), pick(PLAYERS[g.players], lang)),
        el('li', { class: 'gc-devices', title: g.devices.map((d) => pick(DEVICES[d], lang)).join(', ') },
          ...g.devices.map((d) => icon(DEVICE_ICON[d], { size: 16, label: pick(DEVICES[d], lang) })))
      ),
      el('div', { class: 'gc-foot' },
        needsTeacher(g) ? el('span', { class: 'small muted' }, t('with_teacher')) : el('span', { class: 'small muted' }, pick(TYPES[g.type], lang)),
        el('span', { class: 'btn primary gc-play' }, icon('play', { size: 16 }), t('play'))
      )
    )
  );
}

/** Карточка категории с иллюстрацией и числом игр */
export function categoryCard(cat, count) {
  const lang = getLang();
  return el('a', { class: 'cat-card card card-link', href: `./games.html?cat=${cat.id}` },
    el('div', { class: 'cat-art' }, cover(icon(cat.art.icon, { size: 48 }), cat.art.tone)),
    el('div', { class: 'cat-body' },
      el('h3', {}, pick(cat.title, lang)),
      el('p', { class: 'small muted' }, pick(cat.desc, lang)),
      el('span', { class: 'cat-count' }, t('games_n', { n: count }), icon('chevron', { size: 16 }))
    )
  );
}

export { CATEGORIES };
