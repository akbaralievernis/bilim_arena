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

/** Навигация ученика: главная, игры, задания, профиль, раздел для учителей */
const STUDENT_NAV = [
  { href: 'index.html', key: 'nav_home', icon: 'home' },
  { href: 'games.html', key: 'nav_games', icon: 'games' },
  { href: 'tasks.html', key: 'nav_tasks', icon: 'tasks' },
  { href: 'progress.html', key: 'nav_profile', icon: 'profile' },
  { href: 'teacher.html', key: 'nav_for_teachers', icon: 'teacher' }
];
/** На телефоне — вход на урок вместо раздела учителей */
const STUDENT_TABS = [
  { href: 'index.html', key: 'tab_home', icon: 'home' },
  { href: 'games.html', key: 'nav_games', icon: 'games' },
  { href: 'play.html', key: 'tab_join', icon: 'join' },
  { href: 'tasks.html', key: 'tab_tasks', icon: 'tasks' },
  { href: 'progress.html', key: 'nav_profile', icon: 'profile' }
];

const TEACHER_NAV = [
  { href: 'teacher.html', key: 'nav_dashboard', icon: 'teacher' },
  { href: 'homework.html', key: 'nav_assignments', icon: 'tasks' },
  { href: 'questions.html', key: 'nav_builder', icon: 'pen' },
  { href: 'board.html', key: 'board_mode', icon: 'board' },
  { href: 'index.html', key: 'nav_student_view', icon: 'home' }
];

/** Короткие подписи для нижней панели учителя */
const TEACHER_TABS = [
  { href: 'teacher.html', key: 'nav_dashboard', icon: 'teacher' },
  { href: 'homework.html', key: 'tab_tasks', icon: 'tasks' },
  { href: 'questions.html', key: 'tab_questions', icon: 'pen' },
  { href: 'board.html', key: 'tab_board', icon: 'board' },
  { href: 'index.html', key: 'tab_student', icon: 'home' }
];

const navLink = (it, active) => el('a', {
  href: it.href,
  ...(active === it.href ? { 'aria-current': 'page' } : {})
}, icon(it.icon, { size: 20 }), el('span', { class: 'nav-label' }, t(it.key)));

/**
 * Рисует шапку с навигацией, выбором языка и профилем.
 * @param {object} opts { role:'student'|'teacher', active:'index.html' }
 */
export function mountHeader(target, { role = 'student', active = '' } = {}) {
  const items = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const tabs = role === 'teacher' ? TEACHER_TABS : STUDENT_TABS;

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

  // Профиль ученика: иллюстрация и имя (подгружаются из профиля)
  if (role !== 'teacher') {
    const link = el('a', {
      class: 'profile-link', href: 'progress.html', 'aria-label': t('nav_profile'),
      ...(active === 'progress.html' ? { 'aria-current': 'page' } : {})
    }, avatar(null, { size: 34, animated: false }), el('span', { class: 'profile-name' }, t('nav_profile')));
    actions.append(link);
    getProfile().then((p) => {
      link.replaceChildren(avatar(p.avatar, { size: 34, animated: false }), el('span', { class: 'profile-name' }, p.name || t('nav_profile')));
    }).catch(() => {});
  }

  const header = el('header', { class: 'topbar' },
    el('a', { class: 'brand', href: role === 'teacher' ? 'teacher.html' : 'index.html', 'aria-label': t('app_name') },
      el('img', { class: 'logo', src: 'assets/logo.svg', alt: '', width: 36, height: 36 }),
      el('span', { class: 'brand-name' }, t('app_name'))
    ),
    nav,
    actions
  );
  target.replaceWith(header);

  // Нижняя панель для телефона
  const tabbar = el('nav', { class: 'tabbar', 'aria-label': t('nav_main') },
    tabs.slice(0, 5).map((it) => el('a', {
      href: it.href,
      ...(active === it.href ? { 'aria-current': 'page' } : {})
    }, icon(it.icon, { size: 22 }), el('span', {}, t(it.key))))
  );
  document.body.append(tabbar);
  document.body.classList.add('has-tabbar');
  return header;
}

/** Стартовая подготовка страницы: язык + тема. Вызывается первой. */
export async function bootstrap() {
  await initTheme();
  await initI18n();
  document.body.classList.remove('boot');
  // Облако подгружается, только если настроено, и не задерживает страницу
  if (SUPABASE.url && SUPABASE.anonKey) {
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
