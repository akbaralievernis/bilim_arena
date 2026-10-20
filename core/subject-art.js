/**
 * Bilim Arena — знак предмета: плитка с символом и своим тоном.
 *
 * Вместо эмодзи (на разных телефонах выглядят по-разному, флаги на Windows
 * вообще не рисуются) — типографский символ предмета или значок из
 * core/icons.js. Тоны — спокойные, текст на них контрастный (≥ 4.5:1).
 */

import { el } from './ui.js';
import { icon } from './icons.js';

/** [фон, цвет символа, символ | null, значок | null] */
const ART = {
  math: ['#E8F0FE', '#1F4FB0', 'π'],
  kyrgyz: ['#FDECEB', '#A8160F', 'Ө'],
  'kyrgyz-lit': ['#FDECEB', '#A8160F', null, 'book'],
  russian: ['#E8F0FE', '#1F4FB0', 'Ё'],
  'russian-lit': ['#E8F0FE', '#1F4FB0', null, 'book'],
  english: ['#F3E8FD', '#6A2FB0', 'Aa'],
  informatics: ['#E4F4F1', '#0B6B60', '</>'],
  physics: ['#FFF7D6', '#7A5A00', null, 'bolt'],
  chemistry: ['#FCE8F3', '#9C1C66', null, 'flask'],
  biology: ['#E6F4EA', '#137A3F', null, 'leaf'],
  geography: ['#E4F4F1', '#0B6B60', null, 'map'],
  'kg-history': ['#FDECEB', '#A8160F', null, 'hourglass'],
  'world-history': ['#FFF1E5', '#9A4A00', null, 'globe'],
  social: ['#F3E8FD', '#6A2FB0', null, 'users'],
  economics: ['#E6F4EA', '#137A3F', null, 'chart'],
  finance: ['#FFF7D6', '#7A5A00', null, 'coin']
};

/** Плитка-знак предмета (декоративная — название предмета пишется рядом) */
export function subjectMark(id, { size = 48 } = {}) {
  const [bg, ink, glyph, ic] = ART[id] || ['#F1F3F4', '#5F6368', null, 'book'];
  return el('span', {
    class: 'subj-mark', 'aria-hidden': 'true',
    style: `--sm-bg:${bg};--sm-ink:${ink};--sm-size:${size}px`
  }, glyph ? el('span', { class: 'subj-glyph' }, glyph) : icon(ic, { size: Math.round(size * 0.5) }));
}
