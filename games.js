/**
 * Bilim Arena — каталог игр.
 *
 * Разделы (?cat=languages|logic|team|camera), поиск, фильтры по предмету,
 * типу, сложности, числу игроков и устройству, сортировка.
 * Всё состояние — в адресе страницы: ссылкой на раздел можно поделиться,
 * кнопка «Назад» возвращает прежние фильтры.
 */

import { bootstrap, mountHeader, el, $ } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { icon } from './core/icons.js';
import { cover } from './core/art.js';
import { getProgress } from './core/progress.js';
import { gameCard, matches, sortGames } from './core/catalog.js';
import { GAMES, CATEGORIES, SUBJECT_FILTERS, TYPES, DIFFICULTY, PLAYERS, DEVICES, getCategory } from './data/games.js';

/** Группы фильтров: ключ в адресе, варианты, проверка игры */
const GROUPS = [
  { key: 'subject', label: 'f_subject', options: SUBJECT_FILTERS.map((s) => [s.id, s.title]),
    test: (g, set) => g.subjects.includes('any') ? g.subjects.length > 0 : g.subjects.some((s) => set.has(s)) },
  { key: 'type', label: 'f_type', options: Object.entries(TYPES), test: (g, set) => set.has(g.type) },
  { key: 'diff', label: 'f_difficulty', options: Object.entries(DIFFICULTY), test: (g, set) => set.has(String(g.difficulty)) },
  { key: 'players', label: 'f_players', options: Object.entries(PLAYERS), test: (g, set) => set.has(g.players) },
  { key: 'device', label: 'f_device', options: Object.entries(DEVICES), test: (g, set) => g.devices.some((d) => set.has(d)) }
];
const SORTS = [['popular', 'sort_popular'], ['new', 'sort_new'], ['name', 'sort_name']];

const state = { cat: '', q: '', sort: 'popular', filters: {}, plays: {} };

// ─── Адрес страницы ⇄ состояние ───────────────────────────────────────────────

function readUrl() {
  const p = new URLSearchParams(location.search);
  state.cat = getCategory(p.get('cat')) ? p.get('cat') : '';
  state.q = p.get('q') || '';
  state.sort = SORTS.some(([id]) => id === p.get('sort')) ? p.get('sort') : 'popular';
  state.filters = {};
  GROUPS.forEach((g) => {
    const allowed = new Set(g.options.map(([id]) => String(id)));
    const values = (p.get(g.key) || '').split(',').filter((v) => allowed.has(v));
    if (values.length) state.filters[g.key] = new Set(values);
  });
}

function writeUrl(replace = true) {
  const p = new URLSearchParams();
  if (state.cat) p.set('cat', state.cat);
  if (state.q) p.set('q', state.q);
  if (state.sort !== 'popular') p.set('sort', state.sort);
  Object.entries(state.filters).forEach(([k, set]) => { if (set.size) p.set(k, [...set].join(',')); });
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

  const tabs = [{ id: '', title: null, art: { icon: 'grid' } }, ...CATEGORIES];
  $('#catTabs').replaceChildren(...tabs.map((c) => el('a', {
    class: 'cat-tab', href: c.id ? `?cat=${c.id}` : '?',
    ...(c.id === state.cat ? { 'aria-current': 'page' } : {}),
    onclick: (e) => { e.preventDefault(); state.cat = c.id; writeUrl(false); render(); }
  }, icon(c.art.icon, { size: 18 }), c.id ? pick(c.title, lang) : t('cat_all'),
  el('span', { class: 'cat-tab-count' }, String(c.id ? GAMES.filter((g) => g.category === c.id).length : GAMES.length)))));
}

function renderFilters() {
  const lang = getLang();
  $('#filterGroups').replaceChildren(...GROUPS.map((g) => {
    const set = state.filters[g.key] || new Set();
    return el('fieldset', { class: 'filter-group' },
      el('legend', {}, t(g.label)),
      ...g.options.map(([id, title]) => el('label', { class: 'check' },
        el('input', {
          type: 'checkbox', value: String(id), ...(set.has(String(id)) ? { checked: true } : {}),
          onchange: (e) => {
            const s = state.filters[g.key] || (state.filters[g.key] = new Set());
            if (e.target.checked) s.add(String(id)); else s.delete(String(id));
            if (!s.size) delete state.filters[g.key];
            writeUrl();
            renderResults();
          }
        }),
        el('span', {}, pick(title, lang))
      ))
    );
  }));
}

function filtered() {
  return GAMES.filter((g) =>
    (!state.cat || g.category === state.cat)
    && matches(g, state.q)
    && GROUPS.every((grp) => !state.filters[grp.key] || grp.test(g, state.filters[grp.key])));
}

function activeFilterCount() {
  return Object.values(state.filters).reduce((n, s) => n + s.size, 0);
}

function renderResults() {
  const list = sortGames(filtered(), state.sort, state.plays);
  $('#resultCount').textContent = t('cat_found', { n: list.length });
  $('#gameGrid').replaceChildren(...list.map((g) => gameCard(g)));
  $('#gameGrid').classList.toggle('hidden', !list.length);
  $('#emptyState').classList.toggle('hidden', list.length > 0);

  const n = activeFilterCount();
  $('#filterToggle').replaceChildren(...[icon('filter', { size: 18 }), el('span', {}, t('cat_filters')),
    n ? el('span', { class: 'filter-badge', 'aria-label': t('cat_active_filters', { n }) }, String(n)) : null].filter(Boolean));
  $('#resetBtn').disabled = !n;
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
  writeUrl();
  render();
  $('#searchInput').focus();
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'games.html' });

  $('#catTabs').setAttribute('aria-label', t('cat_sections'));
  $('#filterPanel').setAttribute('aria-label', t('cat_filters'));
  const search = $('#searchInput');
  search.placeholder = t('cat_search_ph');
  search.before(icon('search', { size: 20 }));
  $('#sortSelect').replaceChildren(...SORTS.map(([id, key]) => el('option', { value: id }, t(key))));
  $('.empty-art').replaceChildren(cover(icon('search', { size: 48 }), 'violet'));

  try { state.plays = (await getProgress()).games || {}; } catch { state.plays = {}; }

  readUrl();
  render();

  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = search.value.trim(); writeUrl(); renderResults(); }, 150);
  });
  $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; writeUrl(); renderResults(); });
  $('#resetBtn').addEventListener('click', () => { state.filters = {}; writeUrl(); renderFilters(); renderResults(); });
  $('#emptyResetBtn').addEventListener('click', resetAll);

  // Фильтры на телефоне и планшете раскрываются по кнопке
  $('#filterToggle').addEventListener('click', (e) => {
    const open = !document.body.classList.contains('filters-open');
    document.body.classList.toggle('filters-open', open);
    e.currentTarget.setAttribute('aria-expanded', String(open));
    if (open) $('#filterPanel input')?.focus();
  });

  window.addEventListener('popstate', () => { readUrl(); render(); });
})();
