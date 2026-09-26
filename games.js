/**
 * Bilim Arena — каталог игр.
 *
 * Разделы (?category=languages|logic|team|camera), поиск, фильтры
 * (предмет, тип, сложность, игроки, устройство — в каждом «Баары»),
 * сортировка. Всё состояние — в адресе страницы: ссылкой можно поделиться,
 * после перезагрузки и по кнопке «Назад» фильтры остаются прежними.
 * На экранах уже 1024px фильтры открываются в выдвижной панели.
 */

import { bootstrap, mountHeader, el, $, $$ } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { icon } from './core/icons.js';
import { cover } from './core/art.js';
import { getProgress } from './core/progress.js';
import { gameCard, matches, sortGames } from './core/catalog.js';
import {
  GAMES, CATEGORIES, SUBJECT_FILTERS, TYPES, DIFFICULTY, PLAYER_RANGES, DEVICES, fitsPlayers, getCategory
} from './data/games.js';

/** Группы фильтров: ключ в адресе, варианты, проверка игры. Выбор — один вариант или «Баары». */
const GROUPS = [
  { key: 'subject', label: 'f_subject', options: SUBJECT_FILTERS.map((s) => [s.id, s.title]),
    test: (g, v) => g.subjects.includes(v) || g.subjects.includes('any') },
  { key: 'type', label: 'f_type', options: Object.entries(TYPES), test: (g, v) => g.type === v },
  { key: 'difficulty', label: 'f_difficulty', options: Object.entries(DIFFICULTY), test: (g, v) => String(g.difficulty) === v },
  { key: 'players', label: 'f_players', options: Object.entries(PLAYER_RANGES).map(([id, r]) => [id, r.title]), test: fitsPlayers },
  { key: 'device', label: 'f_device', options: ['phone', 'computer', 'camera'].map((id) => [id, DEVICES[id]]),
    test: (g, v) => g.devices.includes(v) }
];
const SORTS = [['popular', 'sort_popular'], ['new', 'sort_new'], ['name', 'sort_name']];

const state = { cat: '', q: '', sort: 'popular', filters: {}, plays: {} };
const drawerQuery = matchMedia('(max-width: 1023px)');

// ─── Адрес страницы ⇄ состояние ───────────────────────────────────────────────

function readUrl() {
  const p = new URLSearchParams(location.search);
  const cat = p.get('category') || p.get('cat'); // «cat» — старые ссылки
  state.cat = getCategory(cat) ? cat : '';
  state.q = p.get('q') || '';
  state.sort = SORTS.some(([id]) => id === p.get('sort')) ? p.get('sort') : 'popular';
  state.filters = {};
  GROUPS.forEach((g) => {
    const v = p.get(g.key) || (g.key === 'difficulty' ? p.get('diff') : null);
    if (v && g.options.some(([id]) => String(id) === v)) state.filters[g.key] = v;
  });
}

function writeUrl(replace = true) {
  const p = new URLSearchParams();
  if (state.cat) p.set('category', state.cat);
  if (state.q) p.set('q', state.q);
  GROUPS.forEach((g) => { if (state.filters[g.key]) p.set(g.key, state.filters[g.key]); });
  if (state.sort !== 'popular') p.set('sort', state.sort);
  const url = `${location.pathname}${p.toString() ? '?' + p : ''}`;
  history[replace ? 'replaceState' : 'pushState'](null, '', url);
}

// ─── Отрисовка ────────────────────────────────────────────────────────────────

function renderHead() {
  const lang = getLang();
  const cat = getCategory(state.cat);
  $('#pageTitle').textContent = cat ? pick(cat.title, lang) : t('cat_all_games');
  $('#pageDesc').textContent = cat ? pick(cat.desc, lang) : t('cat_all_desc');
  document.title = `${$('#pageTitle').textContent} — ${t('app_name')}`;

  const tabs = [{ id: '', art: { icon: 'grid' } }, ...CATEGORIES];
  $('#catTabs').replaceChildren(...tabs.map((c) => el('a', {
    class: 'cat-tab', href: c.id ? `?category=${c.id}` : '?',
    ...(c.id === state.cat ? { 'aria-current': 'page' } : {}),
    onclick: (e) => { e.preventDefault(); state.cat = c.id; writeUrl(false); render(); }
  }, icon(c.art.icon, { size: 18 }), c.id ? pick(c.title, lang) : t('cat_all'))));
}

/** Каждая группа — набор «таблеток»-переключателей; стрелки двигают выбор внутри группы */
function renderFilters() {
  const lang = getLang();
  $('#filterGroups').replaceChildren(...GROUPS.map((g) => {
    const current = state.filters[g.key] || '';
    const option = (value, title) => el('label', { class: 'pill-option' },
      el('input', {
        type: 'radio', name: `f-${g.key}`, value, ...(value === current ? { checked: true } : {}),
        onchange: () => {
          if (value) state.filters[g.key] = value; else delete state.filters[g.key];
          writeUrl();
          renderResults();
        }
      }),
      el('span', {}, title)
    );
    return el('fieldset', { class: 'filter-group' },
      el('legend', {}, t(g.label)),
      el('div', { class: 'pill-options' },
        option('', t('cat_all')),
        ...g.options.map(([id, title]) => option(String(id), pick(title, lang))))
    );
  }));
}

function filtered() {
  return GAMES.filter((g) =>
    (!state.cat || g.category === state.cat)
    && matches(g, state.q)
    && GROUPS.every((grp) => !state.filters[grp.key] || grp.test(g, state.filters[grp.key])));
}

const activeFilterCount = () => Object.keys(state.filters).length;

function renderResults() {
  const list = sortGames(filtered(), state.sort, state.plays);
  $('#resultCount').textContent = t('games_n', { n: list.length });
  $('#gameGrid').replaceChildren(...list.map((g) => gameCard(g)));
  $('#gameGrid').classList.toggle('hidden', !list.length);
  $('#emptyState').classList.toggle('hidden', list.length > 0);

  const n = activeFilterCount();
  $('#filterToggle').replaceChildren(...[icon('filter', { size: 18 }), el('span', {}, t('cat_filters')),
    n ? el('span', { class: 'filter-badge', 'aria-label': t('cat_active_filters', { n }) }, String(n)) : null].filter(Boolean));
  $('#resetBtn').disabled = !n;
  $('#drawerApply').textContent = t('cat_show_n', { n: list.length });
}

function render() {
  renderHead();
  renderFilters();
  $('#searchInput').value = state.q;
  $('#sortSelect').value = state.sort;
  renderResults();
}

function resetAll() {
  state.filters = {};
  state.q = '';
  state.cat = '';
  writeUrl();
  render();
  $('#searchInput').focus();
}

// ─── Выдвижная панель фильтров (планшет и телефон) ────────────────────────────

let lastFocus = null;

function openDrawer() {
  lastFocus = document.activeElement;
  document.body.classList.add('filters-open');
  $('#drawerOverlay').hidden = false;
  $('#filterToggle').setAttribute('aria-expanded', 'true');
  const panel = $('#filterPanel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  ($('#filterPanel input:checked') || $('#drawerClose')).focus();
}

function closeDrawer() {
  if (!document.body.classList.contains('filters-open')) return;
  document.body.classList.remove('filters-open');
  $('#drawerOverlay').hidden = true;
  $('#filterToggle').setAttribute('aria-expanded', 'false');
  $('#filterPanel').removeAttribute('role');
  $('#filterPanel').removeAttribute('aria-modal');
  (lastFocus && lastFocus !== document.body ? lastFocus : $('#filterToggle')).focus();
}

/** Tab не уходит из открытой панели за её пределы */
function trapFocus(e) {
  if (e.key !== 'Tab' || !document.body.classList.contains('filters-open')) return;
  const items = $$('#filterPanel button:not([disabled]), #filterPanel input:checked')
    .filter((n) => n.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'games.html' });

  $('#catTabs').setAttribute('aria-label', t('cat_sections'));
  const search = $('#searchInput');
  search.placeholder = t('cat_search_ph');
  search.before(icon('search', { size: 20 }));
  $('#sortSelect').replaceChildren(...SORTS.map(([id, key]) => el('option', { value: id }, t(key))));
  $('.empty-art').replaceChildren(cover(icon('search', { size: 48 }), 'violet'));
  $('#drawerClose').replaceChildren(icon('close', { size: 22 }));
  $('#drawerClose').setAttribute('aria-label', t('close'));

  try { state.plays = (await getProgress()).games || {}; } catch { state.plays = {}; }

  readUrl();
  render();

  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = search.value.trim(); writeUrl(); renderResults(); }, 150);
  });
  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); search.blur(); });
  $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; writeUrl(); renderResults(); });
  $('#resetBtn').addEventListener('click', () => { state.filters = {}; writeUrl(); renderFilters(); renderResults(); });
  $('#emptyResetBtn').addEventListener('click', resetAll);

  $('#filterToggle').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawerApply').addEventListener('click', closeDrawer);
  $('#drawerOverlay').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); trapFocus(e); });
  // Экран стал шире — панель снова обычная колонка
  drawerQuery.addEventListener('change', (e) => { if (!e.matches) closeDrawer(); });

  window.addEventListener('popstate', () => { readUrl(); render(); });
})();
