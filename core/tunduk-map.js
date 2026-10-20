/**
 * Bilim Arena — «Билим түндүгү»: карта знаний ученика в виде түндүка
 * (купол юрты, как на флаге). Один луч — одна тема.
 *
 *   mastered     — тема освоена (итоговая проверка не ниже порога): луч горит
 *   ready        — на тренировках выше порога, пора на проверку: золотой
 *   learning     — нужно повторить: бледно-красный
 *   insufficient — данных мало / new — ещё не начата: серый
 *
 * Статус берётся из core/mastery.js — тот же, что видит учитель. Лучи — ссылки
 * на тренировку по теме (клавиатура, экранный диктор), рядом — обычный список.
 */

import { el } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...children) => {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => { if (v !== null && v !== undefined) node.setAttribute(k, String(v)); });
  children.forEach((c) => c && node.append(c));
  return node;
};

export const RAY_ORDER = ['mastered', 'ready', 'learning', 'insufficient', 'new'];

/** Геометрия луча: узкий треугольник от круга наружу */
export function rayPath(i, n, { cx = 200, cy = 200, r0 = 116, r1 = 186 } = {}) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const half = Math.min(0.11, (Math.PI / n) * 0.62);
  const p = (ang, r) => `${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)}`;
  return `M${p(a - half, r0)} L${p(a, r1)} L${p(a + half, r0)} Z`;
}

/**
 * @param {Array<{ id, title, status, href }>} items — темы по порядку (по предметам)
 * @param {{ centerTitle:string, centerSub:string, statusLabel:(s)=>string }} text
 */
export function tundukMap(items, text) {
  const n = Math.max(items.length, 1);
  const done = items.filter((x) => x.status === 'mastered').length;
  const center = el('div', { class: 'tm-center', 'aria-hidden': 'true' },
    el('b', { class: 'tm-big' }, `${done}/${items.length}`),
    el('span', { class: 'tm-sub' }, text.centerSub));
  const showDefault = () => center.replaceChildren(el('b', { class: 'tm-big' }, `${done}/${items.length}`), el('span', { class: 'tm-sub' }, text.centerSub));
  const showTopic = (it) => center.replaceChildren(el('b', { class: 'tm-topic' }, it.title), el('span', { class: `tm-sub tm-${it.status}` }, text.statusLabel(it.status)));

  const rays = items.map((it, i) => {
    const link = svg('a', { href: it.href, class: `tm-ray tm-${it.status}`, 'aria-label': `${it.title} — ${text.statusLabel(it.status)}`, style: `--i:${i}` },
      svg('title', {}, document.createTextNode(`${it.title} — ${text.statusLabel(it.status)}`)),
      svg('path', { d: rayPath(i, n, it.status === 'mastered' ? { r1: 196 } : {}) }));
    link.addEventListener('mouseenter', () => showTopic(it));
    link.addEventListener('focus', () => showTopic(it));
    link.addEventListener('mouseleave', showDefault);
    link.addEventListener('blur', showDefault);
    return link;
  });

  // Купол: круг и перекрещённые планки, как на флаге
  const crown = svg('g', { class: 'tm-crown', 'aria-hidden': 'true' },
    svg('circle', { cx: 200, cy: 200, r: 102, class: 'tm-ring' }),
    ...['M136 128 C176 176 176 224 136 272', 'M168 108 C200 160 200 240 168 292', 'M200 100 C228 160 228 240 200 300',
      'M264 128 C224 176 224 224 264 272', 'M232 108 C200 160 200 240 232 292', 'M200 100 C172 160 172 240 200 300']
      .map((d) => svg('path', { d, class: 'tm-bar' })));

  const figure = el('div', { class: 'tm-figure' },
    svg('svg', { viewBox: '0 0 400 400', class: 'tm-svg', role: 'group', 'aria-label': text.centerTitle }, crown, ...rays),
    center);
  return figure;
}
