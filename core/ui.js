/**
 * Bilim Arena — общие элементы интерфейса: шапка, навигация, уведомления,
 * тема оформления и переключатель языка. Используются всеми страницами.
 */

import { t, LANGS, getLang, setLang, initI18n } from './i18n.js';
import { store } from './store.js';
import { SUPABASE } from './config.js';

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

export function toast(message, { icon = '', ms = 2600 } = {}) {
  let host = $('#toasts');
  if (!host) {
    host = el('div', { id: 'toasts' });
    document.body.append(host);
  }
  const node = el('div', { class: 'toast' }, icon ? `${icon} ${message}` : message);
  host.append(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 300);
  }, ms);
}

// ─── Тема оформления ──────────────────────────────────────────────────────────

export async function initTheme() {
  const saved = await store.get('theme');
  const theme = saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = theme;
  return theme;
}

export async function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  await store.set('theme', next);
  return next;
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

const STUDENT_NAV = [
  { href: 'index.html', key: 'nav_home', icon: '🏠' },
  { href: 'speak.html', key: 'nav_speak', icon: '🎤' },
  { href: 'practice.html', key: 'nav_practice', icon: '🎯' },
  { href: 'play.html', key: 'join_title', icon: '🎮' },
  { href: 'tasks.html', key: 'nav_tasks', icon: '📝' },
  { href: 'progress.html', key: 'nav_progress', icon: '📈' }
];

const TEACHER_NAV = [
  { href: 'teacher.html', key: 'nav_dashboard', icon: '🧭' },
  { href: 'homework.html', key: 'nav_assignments', icon: '📝' },
  { href: 'questions.html', key: 'nav_builder', icon: '🛠️' },
  { href: 'teacher.html#classes', key: 'nav_classes', icon: '👥' },
  { href: 'teacher.html#results', key: 'nav_results', icon: '📊' }
];

/**
 * Рисует шапку с навигацией и переключателями языка и темы.
 * @param {object} opts { role:'student'|'teacher', active:'index.html' }
 */
export function mountHeader(target, { role = 'student', active = '' } = {}) {
  const items = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;

  // На планшете подписи прячутся, остаются иконки — меню помещается целиком
  const nav = el('nav', { class: 'nav', 'aria-label': t('nav_home') },
    items.map((it) => el('a', {
      href: it.href,
      title: t(it.key),
      ...(active === it.href ? { 'aria-current': 'page' } : {})
    },
      el('span', { class: 'nav-icon', 'aria-hidden': 'true' }, it.icon),
      el('span', { class: 'nav-label' }, t(it.key))
    ))
  );

  const langBtn = el('button', {
    class: 'btn ghost', type: 'button', 'aria-label': 'Тил / Язык / Language',
    onclick: async () => {
      const codes = LANGS.map((l) => l.code);
      const next = codes[(codes.indexOf(getLang()) + 1) % codes.length];
      await setLang(next);
      location.reload();
    }
  }, LANGS.find((l) => l.code === getLang())?.flag || '🌐');

  const themeBtn = el('button', {
    class: 'btn ghost', type: 'button', 'aria-label': 'Тема',
    onclick: async (e) => {
      const next = await toggleTheme();
      e.currentTarget.textContent = next === 'light' ? '☀️' : '🌙';
    }
  }, document.documentElement.dataset.theme === 'light' ? '☀️' : '🌙');

  const header = el('header', { class: 'topbar' },
    el('a', { class: 'brand', href: 'index.html' },
      el('span', { class: 'logo', 'aria-hidden': 'true' }, '🚀'),
      el('span', {}, t('app_name'))
    ),
    nav,
    el('span', { class: 'spacer' }),
    // Аккаунт появляется, только когда подключено облако
    SUPABASE.url ? el('a', {
      class: 'btn ghost cloud-btn', href: 'account.html', id: 'cloudBtn',
      title: t('acc_title'), 'aria-label': t('acc_title')
    }, '☁️') : null,
    langBtn,
    themeBtn
  );

  target.replaceWith(header);

  // Нижняя панель для телефона
  const tabbar = el('nav', { class: 'tabbar', 'aria-label': t('nav_home') },
    items.slice(0, 5).map((it) => el('a', {
      href: it.href,
      ...(active === it.href ? { 'aria-current': 'page' } : {})
    }, el('span', { 'aria-hidden': 'true' }, it.icon), t(it.key)))
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
      const icon = { syncing: '🔄', ok: '☁️', error: '⚠️', offline: '📴' }[e.detail.state] || '☁️';
      btn.textContent = icon;
      btn.title = `${t('acc_title')}: ${t('acc_state_' + e.detail.state)}`;
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
