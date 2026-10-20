/**
 * Bilim Arena — обложки игр: у каждой игры своя сцена.
 *
 * Обложка показывает механику игры, а не просто значок: в «Угадай слово» —
 * плитки букв, в «Найди пару» — открытые карточки, в «Захвате территории» —
 * поле двух команд. Общие правила бренда: плоские формы без градиентов,
 * скруглённые углы, одна толщина линий, палитра Bilim Arena + свой тон игры.
 * Подвижная часть сцены (.cv-move) слегка оживает при наведении на карточку.
 *
 * gameCover(id) → SVG-элемент; для неизвестной игры — null (берётся cover()).
 */

const RED = '#D91E18';
const YEL = '#FFCE00';
const INK = '#282828';
const W = '#FFFFFF';

const svgFrom = (html) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstChild;
};

const wrap = (id, bg, body) => `
<svg class="art-cover game-cover" data-cover="${id}" data-bg="${bg}" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <rect width="320" height="200" fill="${bg}"/>${body}
</svg>`;

// Небольшие детали, которые повторяются в сценах
const tile = (x, y, s, fill, ch, color = W, r = 8) =>
  `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${fill}"/>${ch ? `<text x="${x + s / 2}" y="${y + s * 0.68}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="${s * 0.5}" fill="${color}">${ch}</text>` : ''}`;
const chip = (x, y, w, fill, text, color = INK) =>
  `<rect x="${x}" y="${y}" width="${w}" height="30" rx="15" fill="${fill}"/><text x="${x + w / 2}" y="${y + 20}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="14" fill="${color}">${text}</text>`;
const hex = (cx, cy, r, fill) => {
  const p = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; p.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`); }
  return `<polygon points="${p.join(' ')}" fill="${fill}" stroke="${W}" stroke-width="3"/>`;
};
const T = (x, y, s, text, fill = INK, w = 800, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter,system-ui,sans-serif" font-weight="${w}" font-size="${s}" fill="${fill}">${text}</text>`;

const SCENES = {
  // ─── Языки ──────────────────────────────────────────────────────────────
  wordle: () => wrap('wordle', '#F1F3F4', `
    <g>${['К', 'И', 'Т', 'Е', 'П'].map((c, i) => tile(52 + i * 44, 34, 38, ['#6B7280', YEL, '#6B7280', '#1E8E3E', '#6B7280'][i], c, i === 1 ? INK : W)).join('')}</g>
    <g class="cv-move">${['К', 'Ө', 'Ң', 'Ү', 'Л'].map((c, i) => tile(52 + i * 44, 80, 38, '#1E8E3E', c)).join('')}</g>
    <g opacity=".9">${[0, 1, 2, 3, 4].map((i) => `<rect x="${52 + i * 44}" y="126" width="38" height="38" rx="8" fill="none" stroke="#C4C8CE" stroke-width="2.5"/>`).join('')}</g>`),

  flashcards: () => wrap('flashcards', '#FFF7D6', `
    <rect x="70" y="52" width="150" height="100" rx="14" fill="${W}" stroke="#E7D9A0" stroke-width="2" transform="rotate(-8 145 102)"/>
    <g class="cv-move"><rect x="100" y="44" width="150" height="100" rx="14" fill="${RED}" transform="rotate(5 175 94)"/>
    <g transform="rotate(5 175 94)">${T(175, 90, 24, 'алма', W)}${T(175, 116, 15, 'apple · яблоко', '#FFD9D6', 600)}</g></g>
    <path d="M262 140a26 26 0 0 1-30 18" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M234 150l-4 9 9 2" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`),

  'word-match': () => wrap('word-match', '#E6F4EA', `
    ${[0, 1, 2].map((i) => `<rect x="${48 + i * 80}" y="30" width="64" height="64" rx="12" fill="#137A3F"/><path d="M${64 + i * 80} 62h32M${80 + i * 80} 46v32" stroke="#4CAF72" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <rect x="48" y="108" width="64" height="64" rx="12" fill="${W}" stroke="${YEL}" stroke-width="4"/>${T(80, 147, 16, 'ит')}
    <rect x="208" y="108" width="64" height="64" rx="12" fill="${W}" stroke="${YEL}" stroke-width="4"/>${T(240, 147, 16, 'dog')}
    <rect x="128" y="108" width="64" height="64" rx="12" fill="#137A3F"/><path d="M144 140h32M160 124v32" stroke="#4CAF72" stroke-width="3" stroke-linecap="round"/>
    <path class="cv-move" d="M112 128 C150 92 170 92 208 128" fill="none" stroke="${RED}" stroke-width="3.5" stroke-dasharray="7 7" stroke-linecap="round"/>`),

  'word-rain': () => wrap('word-rain', '#DCEBFF', `
    <path d="M70 20v26M190 10v22M262 34v26M120 70v18" stroke="#9DBBF0" stroke-width="3" stroke-linecap="round"/>
    <g class="cv-move">${chip(40, 44, 82, W, 'суу')}${chip(150, 24, 96, W, 'water')}${chip(206, 84, 82, RED, 'тоо', W)}${chip(88, 100, 90, W, 'кийик')}</g>
    <rect x="40" y="150" width="240" height="34" rx="12" fill="${W}" stroke="#3367D6" stroke-width="2.5"/>${T(56, 172, 15, 'тоо|', '#3367D6', 700, 'start')}`),

  balloons: () => wrap('balloons', '#FFF0F3', `
    <g class="cv-move">${[[70, 86, RED, 'А'], [130, 62, YEL, 'Т'], [190, 92, '#3367D6', 'А'], [250, 66, '#1E8E3E', '?']].map(([x, y, c, ch]) =>
      `<path d="M${x} ${y + 34} q-6 30 4 60" fill="none" stroke="#B9B9B9" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="26" ry="32" fill="${c}"/><path d="M${x - 4} ${y + 31} l4 7 4-7z" fill="${c}"/>${T(x, y + 9, 26, ch, c === YEL ? INK : W)}`).join('')}</g>`),

  sentence: () => wrap('sentence', '#F3E8FD', `
    <path d="M36 148h248" stroke="#B794E0" stroke-width="3" stroke-linecap="round"/>
    ${chip(36, 112, 70, W, 'Мен')}${chip(112, 112, 84, W, 'китеп')}
    <g class="cv-move">${chip(176, 50, 96, '#7B3FC4', 'окуйм', W)}<path d="M224 86v16" stroke="#7B3FC4" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 5"/></g>`),

  speak: () => wrap('speak', '#E8F0FE', `
    <rect x="58" y="44" width="52" height="84" rx="26" fill="#3367D6"/><path d="M46 104a38 38 0 0 0 76 0M84 142v22M66 164h36" fill="none" stroke="#3367D6" stroke-width="5" stroke-linecap="round"/>
    <g class="cv-move" fill="${RED}">${[18, 44, 70, 34, 86, 56, 30, 64, 40, 20].map((h, i) => `<rect x="${150 + i * 14}" y="${100 - h / 2}" width="8" height="${h}" rx="4"/>`).join('')}</g>
    ${chip(150, 148, 100, W, 'apple ✓', '#137A3F')}`),

  // ─── Логика ─────────────────────────────────────────────────────────────
  errorhunt: () => wrap('errorhunt', '#FFFDF5', `
    ${[52, 84, 116, 148].map((y) => `<path d="M30 ${y}h260" stroke="#D6E4F5" stroke-width="2"/>`).join('')}<path d="M62 20v180" stroke="#F4B4B0" stroke-width="2"/>
    ${T(80, 76, 20, '3 · 4 = 12', INK, 700, 'start')}${T(80, 140, 20, '½ + ⅓ = ⅖', INK, 700, 'start')}
    <g class="cv-move"><ellipse cx="190" cy="132" rx="46" ry="26" fill="none" stroke="${RED}" stroke-width="4" transform="rotate(-6 190 132)"/>${T(262, 112, 30, '✗', RED)}</g>`),

  investigation: () => wrap('investigation', '#2B2F3A', `
    <rect x="44" y="36" width="70" height="80" rx="4" fill="#F1F3F4" transform="rotate(-6 79 76)"/><rect x="52" y="44" width="54" height="44" fill="#9AA0A6" transform="rotate(-6 79 76)"/>
    <rect x="190" y="30" width="70" height="80" rx="4" fill="#F1F3F4" transform="rotate(5 225 70)"/><rect x="198" y="38" width="54" height="44" fill="#BDC1C6" transform="rotate(5 225 70)"/>
    <rect x="120" y="116" width="74" height="60" rx="4" fill="#FFF7D6" transform="rotate(3 157 146)"/>
    <path d="M86 70 L224 64 L156 140 Z" fill="none" stroke="${RED}" stroke-width="2.5"/>${[[86, 70], [224, 64], [156, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${YEL}"/>`).join('')}
    <g class="cv-move"><circle cx="246" cy="146" r="22" fill="none" stroke="${W}" stroke-width="6"/><path d="M262 162l18 18" stroke="${W}" stroke-width="8" stroke-linecap="round"/></g>`),

  lab: () => wrap('lab', '#E4F4F1', `
    <path d="M128 30h52M140 30v46l-36 74a14 14 0 0 0 13 20h74a14 14 0 0 0 13-20l-36-74V30" fill="${W}" stroke="#0B7A6D" stroke-width="5" stroke-linejoin="round"/>
    <path d="M118 122h72l18 30a12 12 0 0 1-11 18h-86a12 12 0 0 1-11-18z" fill="#26A69A"/>
    <g class="cv-move" fill="${W}"><circle cx="140" cy="146" r="6"/><circle cx="168" cy="136" r="4"/><circle cx="156" cy="104" r="5" fill="#26A69A"/><circle cx="166" cy="76" r="4" fill="#26A69A"/></g>
    <path d="M232 70h40M232 96h28M232 122h40" stroke="#0B7A6D" stroke-width="4" stroke-linecap="round"/>${T(60, 90, 22, 'H₂O', '#0B7A6D')}`),

  timeline: () => wrap('timeline', '#FFF7D6', `
    <path d="M24 112h272" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    ${[[56, '1991'], [128, '1993'], [200, '2005'], [272, '2010']].map(([x, y], i) => `<circle cx="${x}" cy="112" r="10" fill="${i === 0 ? RED : W}" stroke="${INK}" stroke-width="3"/>${T(x, i % 2 ? 150 : 84, 16, y, INK, 800)}`).join('')}
    <g class="cv-move"><rect x="96" y="20" width="78" height="40" rx="10" fill="${RED}"/>${T(135, 47, 22, '?', W, 800)}<path d="M135 60v24" stroke="${RED}" stroke-width="3" stroke-dasharray="3 5" stroke-linecap="round"/></g>`),

  odd: () => wrap('odd', '#E8F0FE', `
    <circle cx="70" cy="70" r="30" fill="#3367D6"/><circle cx="160" cy="70" r="30" fill="#3367D6"/><circle cx="250" cy="70" r="30" fill="#3367D6"/>
    <circle cx="70" cy="150" r="30" fill="#3367D6"/><circle cx="250" cy="150" r="30" fill="#3367D6"/>
    <g class="cv-move"><path d="M160 118l32 56h-64z" fill="${YEL}"/><circle cx="160" cy="152" r="48" fill="none" stroke="${RED}" stroke-width="4" stroke-dasharray="8 6"/></g>`),

  focus: () => wrap('focus', '#FDECEB', `
    <rect width="160" height="200" fill="#E8F0FE"/>
    <circle cx="80" cy="100" r="44" fill="#3367D6"/>${T(80, 112, 34, 'А', W)}
    <circle cx="240" cy="100" r="44" fill="${RED}"/>${T(240, 112, 34, 'Б', W)}
    <path class="cv-move" d="M170 30l-26 70h24l-14 70 40-90h-26l18-50z" fill="${YEL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`),

  // ─── Командные ──────────────────────────────────────────────────────────
  race: () => wrap('race', '#E6F4EA', `
    <path d="M30 170 C90 170 70 110 130 110 S180 50 240 60 290 40 300 30" fill="none" stroke="${W}" stroke-width="18" stroke-linecap="round"/>
    <path d="M30 170 C90 170 70 110 130 110 S180 50 240 60 290 40 300 30" fill="none" stroke="#B7DFC2" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
    ${[[78, 150], [130, 110], [196, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${W}" stroke="${INK}" stroke-width="3"/>`).join('')}
    <path d="M268 50V14l26 9-26 9" fill="${RED}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <g class="cv-move"><circle cx="150" cy="96" r="12" fill="#3367D6" stroke="${W}" stroke-width="3"/><circle cx="104" cy="128" r="12" fill="${RED}" stroke="${W}" stroke-width="3"/></g>`),

  quickvote: () => wrap('quickvote', '#F1F3F4', `
    ${[['A', 70, RED], ['B', 120, '#3367D6'], ['C', 40, YEL], ['D', 92, '#1E8E3E']].map(([l, h, c], i) =>
      `<rect class="cv-bar" x="${44 + i * 62}" y="${160 - h}" width="44" height="${h}" rx="8" fill="${c}"/>${T(66 + i * 62, 184, 16, l, INK)}`).join('')}
    <g class="cv-move"><rect x="236" y="18" width="56" height="96" rx="12" fill="${INK}"/><rect x="242" y="28" width="44" height="72" rx="6" fill="${W}"/><path d="M252 64l8 8 16-18" fill="none" stroke="#1E8E3E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`),

  territory: () => wrap('territory', '#F1F3F4', `
    ${[[64, 52, 'a'], [108, 52, 'a'], [152, 52, 'n'], [196, 52, 'b'], [240, 52, 'b'],
      [86, 100, 'a'], [130, 100, 'a'], [174, 100, 'n'], [218, 100, 'b'], [262, 100, 'b'],
      [64, 148, 'a'], [108, 148, 'n'], [152, 148, 'n'], [196, 148, 'b'], [240, 148, 'b']].map(([x, y, s]) => hex(x, y, 26, s === 'a' ? '#3367D6' : s === 'b' ? RED : '#DADCE0')).join('')}
    <g class="cv-move">${hex(174, 100, 26, YEL)}</g>`),

  formula: () => wrap('formula', '#FFF7D6', `
    <path d="M20 112h280" stroke="#8D6E63" stroke-width="7" stroke-linecap="round"/>
    <circle cx="44" cy="96" r="20" fill="#3367D6"/><circle cx="276" cy="96" r="20" fill="${RED}"/>
    <g class="cv-move"><path d="M160 92v40" stroke="${RED}" stroke-width="5"/><path d="M160 92l16 8-16 8" fill="${RED}"/></g>
    ${chip(70, 140, 80, W, '7 · 8 = ?')}${chip(170, 140, 80, W, '56 ✓', '#137A3F')}
    ${T(160, 56, 22, '3 : 2', INK)}`),

  codelock: () => wrap('codelock', '#2B2F3A', `
    <path d="M126 84V60a34 34 0 0 1 68 0v24" fill="none" stroke="#BDC1C6" stroke-width="12"/>
    <rect x="96" y="80" width="128" height="96" rx="18" fill="${YEL}"/>
    <g class="cv-move">${['4', '7', '?'].map((d, i) => `<rect x="${112 + i * 34}" y="106" width="28" height="44" rx="6" fill="${INK}"/>${T(126 + i * 34, 137, 22, d, i === 2 ? YEL : W)}`).join('')}</g>`),

  city: () => wrap('city', '#E8F0FE', `
    <rect y="168" width="320" height="32" fill="#9AA0A6"/>
    ${[[30, 90, '#3367D6'], [80, 60, RED], [134, 110, '#5F6368'], [186, 76, '#1E8E3E'], [240, 120, '#3367D6']].map(([x, h, c]) =>
      `<rect x="${x}" y="${168 - h}" width="44" height="${h}" rx="4" fill="${c}"/>${Array.from({ length: Math.floor(h / 26) }, (_, r) => `<rect x="${x + 9}" y="${176 - h + r * 26}" width="9" height="11" fill="${W}" opacity=".85"/><rect x="${x + 26}" y="${176 - h + r * 26}" width="9" height="11" fill="${W}" opacity=".85"/>`).join('')}`).join('')}
    <g class="cv-move"><circle cx="270" cy="34" r="18" fill="${YEL}" stroke="#B88A00" stroke-width="3"/>${T(270, 41, 18, '₸', '#7A5A00')}</g>`),

  citadel: () => wrap('citadel', '#E8F0FE', `
    <path d="M60 176V96h22v-14h14v14h20v-14h14v14h20V60h-6l16-26 16 26h-6v36h20v-14h14v14h20v-14h14v14h22v80z" fill="#5F6368"/>
    <rect x="146" y="132" width="28" height="44" rx="14" fill="${INK}"/>
    <g class="cv-move"><path d="M160 34V10l22 8-22 8" fill="${RED}"/></g>
    <path d="M82 82V62l-14 6 14 6" fill="#3367D6"/><path d="M238 82V62l14 6-14 6" fill="${RED}"/>`),

  mafia: () => wrap('mafia', '#1F2433', `
    <circle cx="258" cy="46" r="24" fill="${YEL}"/><circle cx="270" cy="38" r="22" fill="#1F2433"/>
    ${[[40, 30], [96, 18], [150, 40], [200, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${W}"/>`).join('')}
    <g class="cv-move"><path d="M84 92c0-14 26-22 50-12 24-10 50-2 50 12 0 34-22 58-50 58S84 126 84 92z" fill="${RED}"/>
    <path d="M100 98c8-6 18-6 24 0-6 6-16 6-24 0zM144 98c6-6 16-6 24 0-8 6-18 6-24 0z" fill="#1F2433"/></g>
    <path d="M170 104c0-12 22-18 42-10 20-8 42-2 42 10 0 28-18 48-42 48s-42-20-42-48z" fill="${W}" opacity=".92"/>
    <path d="M184 110c6-5 15-5 20 0-5 5-14 5-20 0zM220 110c5-5 14-5 20 0-6 5-15 5-20 0z" fill="#1F2433"/>`),

  // ─── Интерактивные (камера) ─────────────────────────────────────────────
  eagle: () => wrap('eagle', '#DCEBFF', `
    <path d="M0 200 L70 110 L120 160 L190 80 L270 170 L320 130 V200 Z" fill="#7A8CA8"/><path d="M190 80 l-18 22 10 -2 8 10 8-10 10 2z" fill="${W}"/>
    <g class="cv-move"><path d="M120 60 C140 40 160 44 170 60 C180 44 200 40 220 60 C200 56 186 62 170 74 C154 62 140 56 120 60z" fill="${INK}"/><path d="M166 70l4-8 4 8z" fill="${YEL}"/></g>
    <circle cx="262" cy="40" r="16" fill="${YEL}"/>`),

  reaction: () => wrap('reaction', '#FFF7D6', `
    <g class="cv-move">${[[70, 40, RED], [150, 70, '#3367D6'], [240, 34, '#1E8E3E'], [200, 110, RED]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="16" fill="${c}"/><path d="M${x} ${y - 30}v-12" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity=".5"/>`).join('')}</g>
    <circle cx="110" cy="140" r="34" fill="none" stroke="${INK}" stroke-width="4"/><circle cx="110" cy="140" r="6" fill="${RED}"/><path d="M110 96v18M110 166v18M66 140h18M136 140h18" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`),

  'neon-draw': () => wrap('neon-draw', '#16181D', `
    <path class="cv-move" d="M40 140 C70 40 120 40 130 110 S200 170 220 80 S280 40 290 120" fill="none" stroke="${YEL}" stroke-width="7" stroke-linecap="round"/>
    <path d="M40 140 C70 40 120 40 130 110 S200 170 220 80 S280 40 290 120" fill="none" stroke="${YEL}" stroke-width="18" stroke-linecap="round" opacity=".18"/>
    <path d="M60 60 l30 30 M90 60 l-30 30" stroke="#FF6F61" stroke-width="6" stroke-linecap="round"/>
    <circle cx="290" cy="120" r="10" fill="${W}"/>`),

  'hand-shooter': () => wrap('hand-shooter', '#FDECEB', `
    ${[52, 38, 24, 10].map((r, i) => `<circle cx="210" cy="92" r="${r}" fill="${i % 2 ? W : RED}"/>`).join('')}
    <g class="cv-move"><path d="M60 150 h44 l24 -24 a8 8 0 0 1 12 10 l-14 18 h46 a8 8 0 0 1 0 16 H60z" fill="#FFD7B5" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M150 128 L196 102" stroke="${INK}" stroke-width="3" stroke-dasharray="4 6" stroke-linecap="round"/></g>`),

  'build-3d': () => wrap('build-3d', '#E8F0FE', `
    ${[[130, 110, '#3367D6'], [170, 110, RED], [150, 90, YEL]].map(([x, y, c]) =>
      `<path d="M${x} ${y}l30-16 30 16-30 16z" fill="${c}"/><path d="M${x} ${y}v34l30 16v-34z" fill="${c}" opacity=".8"/><path d="M${x + 60} ${y}v34l-30 16v-34z" fill="${c}" opacity=".6"/>`).join('')}
    <g class="cv-move"><path d="M60 70l20-10 20 10-20 10z" fill="#1E8E3E"/><path d="M60 70v22l20 10V80z" fill="#1E8E3E" opacity=".8"/><path d="M100 70v22l-20 10V80z" fill="#1E8E3E" opacity=".6"/></g>`)
};

/** Сцена игры по её id из data/games.js; null — сцены нет */
export function gameCover(id) {
  const scene = SCENES[id];
  return scene ? svgFrom(scene()) : null;
}

export const COVER_IDS = Object.keys(SCENES);
