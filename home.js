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
import { getTopic, getSubject, TOPICS, BANK_QUESTIONS_FLOOR } from './core/curriculum.js';
import { gameCard, categoryCard, sortGames, metaLine, artImage } from './core/catalog.js';
import { waveBand, countUp, parallax, particles, tilt } from './core/fx.js';
import { GAMES, CATEGORIES, getGame, getCategory } from './data/games.js';

function renderHero(profile) {
  const lang = getLang();
  $('#heroKicker').textContent = profile.name ? t('home_hello', { name: profile.name }) : t('home_hello_guest');
  $('#heroGames').replaceChildren(icon('games', { size: 20 }), el('span', {}, t('home_see_games')));
  $('#heroProgress').replaceChildren(icon('progress', { size: 20 }), el('span', {}, t('nav_progress')));

  // Акыркы эки сөз — градиент менен
  const h1 = $('#heroTitle');
  const words = h1.textContent.trim().split(/\s+/);
  if (words.length > 2) {
    const tail = words.splice(-2).join(' ');
    h1.replaceChildren(document.createTextNode(words.join(' ') + ' '), el('span', { class: 'hx-grad' }, tail));
  }

  // Сандар: оюндар, темалар, суроолор, тилдер — баары чыныгы (суроолор ондукка чейин ылдый тегеректелген)
  const stat = ([n, label, ic, suffix = '']) => {
    const b = el('b', {}, `${n}${suffix}`);
    countUp(b, n, { suffix });
    return el('li', {}, el('span', { class: 'hx-stat-ic' }, icon(ic, { size: 18 })), el('span', {}, b, el('small', {}, label)));
  };
  const stats = [[GAMES.length, t('home_stat_games'), 'games'], [TOPICS.length, t('home_stat_topics'), 'book'],
    [BANK_QUESTIONS_FLOOR, t('home_stat_questions'), 'quiz', '+'], [3, t('home_stat_langs'), 'language']];
  const items = stats.map(stat);
  $('#heroStats').replaceChildren(...items);
  // Облактан: жалпы банктын суроолору жана ойнолгон оюндар (500дөн ашканда гана — нөл көрсөтүлбөйт)
  import('./core/stats.js').then((m) => m.publicCounters()).then((c) => {
    if (!c) return;
    const total = Math.floor((BANK_QUESTIONS_FLOOR + c.questions) / 10) * 10;
    if (total > BANK_QUESTIONS_FLOOR) items[2].replaceWith(items[2] = stat([total, t('home_stat_questions'), 'quiz', '+']));
    if (c.plays >= 500) $('#heroStats').append(stat([c.plays, t('home_stat_plays'), 'trophy']));
  }).catch(() => {});

  // Сахна: үч оюндун сүрөтү калкып турат + белгилер
  const pickIds = ['race', 'investigation', 'wordle'];
  const cards = pickIds.map(getGame).filter(Boolean).map((g, i) =>
    el('div', { class: `hx-card hx-card-${i + 1}` },
      el('div', { class: 'hx-card-in' },
        artImage('games', g.id, g.art, { eager: true }),
        el('span', { class: 'hx-card-cap' }, pick(g.title, lang)))));
  $('#heroArt').replaceChildren(
    el('div', { class: 'hx-ring' }),
    ...cards,
    el('div', { class: 'hx-chip hx-chip-xp' }, icon('star', { size: 18 }), el('b', {}, '+50 XP')),
    el('div', { class: 'hx-chip hx-chip-win' }, icon('trophy', { size: 18 }), el('b', {}, t('home_hero_win'))),
    el('div', { class: 'hx-chip hx-chip-ok' }, icon('check', { size: 18 }), el('b', {}, t('home_hero_ok')))
  );

  particles($('#heroParticles'), 26);
  $('#hero').append(waveBand('#F7F8FC', { height: 90 }));
  parallax($('#hero'));
}

/** Бардык оюндардын сүрөттөрү чексиз лента болуп агат (чычкан келгенде токтойт) */
function renderMarquee() {
  const lang = getLang();
  const row = (list, hidden) => el('div', { class: 'mq-row', ...(hidden ? { 'aria-hidden': 'true' } : {}) },
    ...list.map((g) => el('a', { class: 'mq-item', href: g.href, ...(hidden ? { tabindex: '-1' } : {}) },
      artImage('games', g.id, g.art), el('span', {}, pick(g.title, lang)))));
  const half = Math.ceil(GAMES.length / 2);
  const tracks = [GAMES.slice(0, half), GAMES.slice(half)].map((list, i) =>
    el('div', { class: `mq-track ${i ? 'reverse' : ''}` }, row(list, false), row(list, true)));
  $('#marquee').replaceChildren(...tracks);
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
  $('#catGrid').replaceChildren(...CATEGORIES.map((c, i) => categoryCard(c, GAMES.filter((g) => g.category === c.id).length, i)));
}

function renderPopular(plays) {
  $('#popAll').replaceChildren(el('span', {}, t('home_see_all')), icon('chevron', { size: 16 }));
  $('#popularGrid').replaceChildren(...sortGames(GAMES, 'popular', plays).slice(0, 4).map((g, i) => gameCard(g, { index: i })));
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
      el('div', { class: 'cont-art' }, artImage('cat', 'languages', { icon: 'play', tone: 'violet' })),
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
  const art = g ? artImage('games', g.id, g.art) : cover(icon(last.art[0], { size: 48 }), last.art[1]);
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

// ─── Задания учителя: что сделать и до какого числа ──────────────────────────

const two = (n) => String(n).padStart(2, '0');
const fmtDate = (ms) => { const d = new Date(ms); return `${two(d.getDate())}.${two(d.getMonth() + 1)}`; };

async function renderTasks(profile) {
  const lang = getLang();
  const { studentAssignments, STATUS, getRun } = await import('./core/assignments.js');
  const list = (await studentAssignments({ studentId: profile.id || 'me', classId: profile.classId, grade: profile.grade }))
    .filter((x) => x.status !== STATUS.DONE && x.attemptsLeft > 0);
  $('#tasksSection').classList.toggle('hidden', !list.length);
  if (!list.length) return;
  const now = Date.now();
  const rows = await Promise.all(list.slice(0, 3).map(async ({ assignment: a, status }) => {
    const run = await getRun(a.id, profile.id || 'me');
    const late = status === STATUS.LATE || a.dueAt < now;
    const soon = !late && a.dueAt - now < 2 * 86400000;
    return el('a', { class: 'home-task', href: `./tasks.html?id=${encodeURIComponent(a.id)}` },
      el('span', { class: 'home-task-main' },
        el('b', {}, a.title || pick(getTopic(a.topic)?.title, lang) || '—'),
        el('span', { class: 'small muted' }, [pick(getSubject(a.subject)?.title, lang), a.check ? t('hw_mode_check_chip') : null].filter(Boolean).join(' · '))),
      el('span', { class: `home-task-due ${late ? 'late' : soon ? 'soon' : ''}` },
        run ? t('home_task_started', { n: run.log.length, total: run.refs.length })
          : late ? t('home_task_late', { d: fmtDate(a.dueAt) }) : t('home_task_due', { d: fmtDate(a.dueAt) }))
    );
  }));
  $('#tasksHome').replaceChildren(
    el('div', { class: 'row between' },
      el('h2', { id: 'tasksHomeTitle', style: 'margin:0' }, icon('tasks', { size: 22 }), ' ', t('home_tasks_title', { n: list.length })),
      list.length > 3 ? el('a', { class: 'section-link', href: './tasks.html' }, t('home_tasks_all')) : null),
    ...rows
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

function renderRace() {
  $('#raceHomeArt').replaceChildren(artImage('games', 'race', { icon: 'flag', tone: 'violet' }));
  $('#raceHomeBtn').replaceChildren(icon('flag', { size: 18 }), el('span', {}, t('home_race_cta')));
}

function renderTeacher() {
  $('#teacherArt').replaceChildren(artImage('games', 'quickvote', { icon: 'teacher', tone: 'teal' }));
  $('#teacherBtn').replaceChildren(icon('teacher', { size: 18 }), el('span', {}, t('home_teacher_cta')));
}

function renderFooter() {
  const links = [['games.html', 'nav_games'], ['race.html', 'race_join_btn'], ['progress.html', 'nav_progress'], ['profile.html', 'nav_profile'], ['play.html', 'nav_join'], ['teacher.html', 'nav_teacher']];
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
  renderMarquee();
  document.querySelectorAll('.game-card, .cat-card, .teacher-card').forEach((c) => tilt(c, 5));
  renderTasks(profile).catch((e) => console.warn('[tasks]', e));
  await renderContinue(pr);
  renderProgress(profile, pr);
  renderRace();
  renderTeacher();
  renderFooter();
  document.querySelector('.two-col').setAttribute('aria-label', t('home_progress_title'));

  // Данные пришли из облака — обновить блоки прогресса
  window.addEventListener('ba:synced', async () => {
    const [p2, pr2] = await Promise.all([getProfile(), getProgress()]);
    await renderContinue(pr2);
    renderProgress(p2, pr2);
  });

})();
