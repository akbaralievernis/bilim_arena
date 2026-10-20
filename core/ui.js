/**
 * Bilim Arena — общие элементы интерфейса: шапка, навигация, уведомления,
 * тема оформления и переключатель языка. Используются всеми страницами.
 */

import { t, LANGS, getLang, setLang, initI18n } from './i18n.js';
import { SUPABASE } from './config.js';
import { icon } from './icons.js';
import { avatar } from './art.js';
import { getProfile } from './profile.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Создание элемента: el('div', { class:'card' }, 'текст') */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  });
  children.flat().forEach((c) => {
    if (c === null || c === undefined || c === false) return;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  });
  return node;
}

// ─── Уведомления ──────────────────────────────────────────────────────────────

/** Страницы передают значок символом — показываем его иконкой из общего набора */
const TOAST_ICONS = {
  '⚠️': 'warn', '✅': 'check', '🔁': 'refresh', '☁️': 'cloud', '📧': 'info', '👋': 'logout',
  '🎤': 'mic', '🎉': 'sparkle', '✨': 'sparkle', '🏆': 'trophy', '🔍': 'lens', '📝': 'tasks',
  '📥': 'inbox', '🔌': 'wifiOff', '🗑️': 'trash', '📋': 'copy'
};

export function toast(message, { icon: mark = '', ms = 2600 } = {}) {
  let host = $('#toasts');
  if (!host) {
    host = el('div', { id: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(host);
  }
  const name = mark ? (TOAST_ICONS[mark] || 'info') : null;
  const node = el('div', { class: `toast ${name === 'warn' ? 'warn' : ''}` }, name ? icon(name, { size: 18 }) : null, el('span', {}, message));
  host.append(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 300);
  }, ms);
}

// ─── Тема оформления ──────────────────────────────────────────────────────────
// Платформа использует один светлый интерфейс. Функции оставлены для совместимости.

export async function initTheme() {
  document.documentElement.dataset.theme = 'light';
  return 'light';
}

export async function toggleTheme() {
  return initTheme();
}

// ─── Звук (лёгкий, без файлов) ────────────────────────────────────────────────

let actx = null;
function tone(freq, dur = 0.12, type = 'sine', vol = 0.06, delay = 0) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime + delay;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch { /* звук недоступен */ }
}
export const sfx = {
  tap: () => tone(520, 0.05, 'sine', 0.04),
  ok: () => { tone(660, 0.1, 'triangle'); tone(880, 0.12, 'triangle', 0.06, 0.08); },
  bad: () => tone(200, 0.18, 'sawtooth', 0.05),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.06, i * 0.1)),
  tick: () => tone(880, 0.04, 'sine', 0.03)
};

// ─── Шапка страницы ───────────────────────────────────────────────────────────

/** Навигация ученика: четыре раздела и на компьютере, и на телефоне */
const STUDENT_NAV = [
  { href: 'index.html', key: 'nav_home', tab: 'tab_home', icon: 'home' },
  { href: 'games.html', key: 'nav_games', icon: 'games' },
  // Задания учителя — отдельный раздел: раньше они были спрятаны в профиле
  { href: 'tasks.html', key: 'nav_tasks', icon: 'tasks', badge: 'tasks' },
  { href: 'progress.html', key: 'nav_progress', icon: 'progress' },
  { href: 'profile.html', key: 'nav_profile', icon: 'profile' }
];
/** Страницы, которые относятся к одному из разделов меню */
const SECTION = {
  'practice.html': 'games.html', 'speak.html': 'games.html',
  'account.html': 'profile.html',
  'tests.html': 'questions.html', 'print.html': 'questions.html', 'scan.html': 'questions.html'
};

const TEACHER_NAV = [
  { href: 'teacher.html', key: 'nav_dashboard', icon: 'teacher' },
  { href: 'homework.html', key: 'nav_assignments', tab: 'tab_tasks', icon: 'tasks' },
  { href: 'questions.html', key: 'nav_builder', tab: 'tab_questions', icon: 'pen' },
  { href: 'board.html', key: 'board_mode', tab: 'tab_board', icon: 'board' },
  { href: 'reports.html', key: 'nav_reports', icon: 'progress', noTab: true },
  { href: 'index.html', key: 'nav_student_view', tab: 'tab_student', icon: 'home' }
];

/** Ссылка меню: текущая страница — aria-current, страница раздела — подсветка */
const navLink = (it, active, { tab = false } = {}) => el('a', {
  href: it.href,
  ...(tab ? {} : { title: t(it.key) }),
  ...(active === it.href ? { 'aria-current': 'page' } : {}),
  ...(SECTION[active] === it.href ? { class: 'active' } : {})
}, icon(it.icon, { size: tab ? 24 : 20 }), el('span', { class: 'nav-label' }, t(tab ? it.tab || it.key : it.key)),
  it.badge ? el('span', { class: 'nav-badge hidden', 'data-badge': it.badge }) : null);

/** Сколько заданий ученику ещё нужно сделать — число на пункте «Задания» */
async function updateTaskBadge(profile) {
  try {
    const { studentAssignments, STATUS } = await import('./assignments.js');
    const list = await studentAssignments({ studentId: profile.id || 'me', classId: profile.classId, grade: profile.grade });
    const n = list.filter((x) => x.status !== STATUS.DONE && x.attemptsLeft > 0).length;
    document.querySelectorAll('[data-badge="tasks"]').forEach((b) => {
      b.textContent = n > 9 ? '9+' : String(n);
      b.classList.toggle('hidden', !n);
      b.setAttribute('aria-label', t('nav_tasks_pending', { n }));
    });
  } catch { /* без числа — не страшно */ }
}

/**
 * Рисует шапку с навигацией, выбором языка и профилем.
 * Компьютер: логотип · Башкы бет / Оюндар / Прогресс / Профиль · язык, «Мугалим», профиль.
 * Телефон: логотип слева, профиль справа, меню из четырёх пунктов внизу экрана.
 * @param {object} opts { role:'student'|'teacher', active:'index.html' }
 */
export function mountHeader(target, { role = 'student', active = '' } = {}) {
  const teacher = role === 'teacher';
  const items = teacher ? TEACHER_NAV : STUDENT_NAV;

  const nav = el('nav', { class: 'nav', 'aria-label': t('nav_main') }, items.map((it) => navLink(it, active)));

  // Язык — обычный список: понятен и с клавиатуры, и на телефоне
  const langSelect = el('select', {
    class: 'lang-select', 'aria-label': 'Тил / Язык / Language',
    onchange: async (e) => { await setLang(e.target.value); location.reload(); }
  }, LANGS.map((l) => el('option', { value: l.code, ...(l.code === getLang() ? { selected: true } : {}) }, l.code.toUpperCase())));

  const actions = el('div', { class: 'topbar-actions' },
    langSelect,
    // Облако — только когда подключено
    SUPABASE.url ? el('a', {
      class: 'icon-link', href: 'account.html', id: 'cloudBtn',
      title: t('acc_title'), 'aria-label': t('acc_title')
    }, icon('cloud')) : null
  );

  if (!teacher) {
    // Режим учителя — отдельной кнопкой, не среди разделов ученика
    actions.append(el('a', { class: 'teacher-link', href: 'teacher.html', title: t('home_teacher_cta') }, icon('teacher', { size: 18 }), el('span', {}, t('nav_teacher'))));

    // Профиль ученика: иллюстрация и имя (подгружаются из профиля)
    const link = el('a', {
      class: 'profile-link', href: 'profile.html', 'aria-label': t('nav_profile'),
      ...(active === 'profile.html' ? { 'aria-current': 'page' } : {})
    }, avatar(null, { size: 34, animated: false }), el('span', { class: 'profile-name' }, t('nav_profile')));
    actions.append(link);
    getProfile().then((p) => {
      updateTaskBadge(p);
      link.replaceChildren(avatar(p.avatar, { size: 34, animated: false }), el('span', { class: 'profile-name' }, p.name || t('nav_profile')));
      link.setAttribute('aria-label', `${t('nav_profile')}: ${p.name || t('role_student')}`);
    }).catch(() => {});
  }

  const header = el('header', { class: 'topbar' },
    el('a', { class: 'brand', href: teacher ? 'teacher.html' : 'index.html', 'aria-label': t('app_name') },
      el('img', { class: 'logo', src: 'assets/logo.svg', alt: '', width: 36, height: 36 }),
      el('span', { class: 'brand-name' }, t('app_name'))
    ),
    nav,
    actions
  );
  target.replaceWith(header);

  // Нижняя панель для телефона
  const tabbar = el('nav', { class: `tabbar ${items.filter((it) => !it.noTab).length >= 5 ? 'tabbar-5' : ''}`, 'aria-label': t('nav_main') },
    items.filter((it) => !it.noTab).map((it) => navLink(it, active, { tab: true })));
  document.body.append(tabbar);
  document.body.classList.add('has-tabbar');
  document.body.classList.toggle('teacher-mode', teacher);
  watchScroll(header);
  return header;
}

/**
 * Прокрутка: тень у шапки, когда страница сдвинута, и кнопка «Наверх» на длинных страницах.
 * Выбранный чип в ряду, который на телефоне прокручивается вбок, сам оказывается на виду.
 */
function watchScroll(header) {
  const toTop = el('button', { class: 'to-top', type: 'button', 'aria-label': t('to_top'), title: t('to_top'), tabindex: '-1',
    onclick: () => { window.scrollTo({ top: 0 }); header.querySelector('a, button')?.focus({ preventScroll: true }); } }, icon('up', { size: 22 }));
  document.body.append(toTop);
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 4);
    const show = y > window.innerHeight * 1.5;
    toTop.classList.toggle('show', show);
    toTop.tabIndex = show ? 0 : -1;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
  // Ряды-прокрутки: после перерисовки показать выбранный чип (а не оставить его за краем экрана)
  const reveal = (row) => {
    const on = row.querySelector('[aria-pressed="true"], .on');
    if (!on || row.scrollWidth <= row.clientWidth) return;
    const left = on.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    // По центру; широкий чип — от начала, чтобы надпись не обрезалась
    row.scrollTo({ left: Math.max(0, Math.min(left - 16, left - (row.clientWidth - on.offsetWidth) / 2)), behavior: 'instant' });
  };
  const rows = () => document.querySelectorAll('.scroll-x, .row.tabs');
  const mo = new MutationObserver((list) => list.forEach((m) => {
    const row = m.target.closest?.('.scroll-x, .row.tabs');
    if (row) reveal(row);
  }));
  rows().forEach((r) => { mo.observe(r, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class'] }); reveal(r); });
}

/**
 * Офлайн-кэш и свежие файлы (sw.js) — на каждой странице, а не только на главной:
 * ученик может открыть каталог или игру по прямой ссылке.
 * updateViaCache: 'none' — браузер проверяет новую версию sw.js в обход HTTP-кэша.
 */
function registerOffline() {
  watchOnline();
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  navigator.serviceWorker.register(new URL('../sw.js', import.meta.url).href, { updateViaCache: 'none' }).catch(() => {});
}

/** Плашка «нет интернета»: сайт работает, результаты сохраняются и уйдут в облако позже */
function watchOnline() {
  const update = () => {
    let bar = document.getElementById('offlineBar');
    if (navigator.onLine !== false) { bar?.remove(); return; }
    if (bar) return;
    bar = el('div', { id: 'offlineBar', class: 'offline-bar', role: 'status' }, icon('offline', { size: 16 }), el('span', {}, t('offline_banner')));
    document.body.append(bar);
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

/** Был ли вход в облако на этом устройстве (сессия Supabase) или это возврат по ссылке из письма */
function cloudNeeded() {
  if (/[#&?](access_token|refresh_token|code|token_hash|error_description)=/.test(location.href)) return true;
  try { return Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k)); } catch { return true; }
}

/** Стартовая подготовка страницы: язык + тема. Вызывается первой. */
export async function bootstrap() {
  // Журнал сбоев (core/errors.js) — подгружается отдельно и ничего не задерживает
  import('./errors.js').then((m) => m.startErrorReporting()).catch(() => {});
  await initTheme();
  await initI18n();
  document.body.classList.remove('boot');
  registerOffline();
  // Облако подгружается, только если настроено и на устройстве уже был вход:
  // ученикам без аккаунта библиотека облака (~100 КБ) не нужна — страница легче на 3G
  if (SUPABASE.url && SUPABASE.anonKey && cloudNeeded()) {
    import('./cloud.js').then((m) => m.initCloud()).catch((e) => console.warn('[cloud]', e));
    window.addEventListener('ba:cloud-status', (e) => {
      const btn = document.getElementById('cloudBtn');
      if (!btn) return;
      const state = e.detail.state;
      btn.dataset.state = state;
      btn.replaceChildren(icon({ syncing: 'sync', error: 'warn', offline: 'offline' }[state] || 'cloud'));
      btn.title = `${t('acc_title')}: ${t('acc_state_' + state)}`;
      btn.setAttribute('aria-label', btn.title);
    });
  }
  return { lang: getLang() };
}

// ─── Мелкие помощники ─────────────────────────────────────────────────────────

export const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, '0')}`;

export function confetti(count = 90) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = el('canvas', { style: 'position:fixed;inset:0;pointer-events:none;z-index:999' });
  c.width = innerWidth; c.height = innerHeight;
  document.body.append(c);
  const g = c.getContext('2d');
  const colors = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#06b6d4'];
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 240, y: innerHeight / 3,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4,
    s: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0]
  }));
  let frame = 0;
  (function loop() {
    g.clearRect(0, 0, c.width, c.height);
    parts.forEach((p) => {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
      g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
    });
    if (++frame < 150) requestAnimationFrame(loop); else c.remove();
  })();
}
