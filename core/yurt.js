/**
 * Bilim Arena — «Боз үй класса»: класс вместе строит юрту знаний.
 *
 * Каждая тема, которую класс освоил по итоговым проверкам (учебный цикл,
 * core/cycles.js), добавляет следующую часть юрты — в настоящем порядке сборки:
 * кереге → эшик → уук → түндүк → туурдук → үзүк → боолор → шырдак.
 * Восемь тем — готовая юрта, дальше начинается следующая.
 *
 * Тема «построена» только по проверкам, не по играм: не меньше SHARE класса
 * сдали итоговую проверку не ниже порога учителя и проверку прошли хотя бы
 * MIN_CHECKED учеников. Если у цикла есть класс, в расчёт идут все ученики
 * класса — кто не проходил проверку, тот пока не сдал.
 */

export const SHARE = 0.75;
export const MIN_CHECKED = 3;

export const YURT_PARTS = [
  { id: 'kerege', name: { ky: 'Кереге', ru: 'Кереге (решётчатые стены)', en: 'Kerege (lattice walls)' } },
  { id: 'eshik', name: { ky: 'Эшик', ru: 'Эшик (дверь)', en: 'Eshik (door)' } },
  { id: 'uuk', name: { ky: 'Уук', ru: 'Уук (жерди купола)', en: 'Uuk (roof poles)' } },
  { id: 'tunduk', name: { ky: 'Түндүк', ru: 'Түндүк (купол)', en: 'Tunduk (crown)' } },
  { id: 'tuurduk', name: { ky: 'Туурдук', ru: 'Туурдук (войлок стен)', en: 'Tuurduk (wall felt)' } },
  { id: 'uzuk', name: { ky: 'Үзүк', ru: 'Үзүк (войлок крыши)', en: 'Uzuk (roof felt)' } },
  { id: 'boo', name: { ky: 'Боолор', ru: 'Боолор (узорные ленты)', en: 'Boo (patterned bands)' } },
  { id: 'shyrdak', name: { ky: 'Шырдак', ru: 'Шырдак (ковёр)', en: 'Shyrdak (felt carpet)' } }
];

/**
 * Освоил ли класс тему по отчёту цикла (core/cycles.js → buildCycleReport)
 * @returns {{ built:boolean, reached:number, base:number, checked:number }}
 */
export function topicBuilt(report) {
  const s = report.summary;
  const base = report.cycle.classId ? s.students : s.checked; // с классом — весь класс
  const built = s.checked >= MIN_CHECKED && base > 0 && s.reached / base >= SHARE;
  return { built, reached: s.reached, base, checked: s.checked };
}

/**
 * Юрта по группам (класс или «все ученики»): какие темы построены и по порядку
 * @param {Array} reports — отчёты циклов
 */
export function classYurts(reports) {
  const groups = new Map();
  reports.forEach((r) => {
    const key = r.cycle.classId || '';
    if (!groups.has(key)) groups.set(key, { classId: r.cycle.classId || null, className: r.className, built: [], pending: [] });
    const g = groups.get(key);
    const state = topicBuilt(r);
    (state.built ? g.built : g.pending).push({ cycleId: r.cycle.id, topic: r.cycle.topic, at: r.summary.lastCheckAt || r.cycle.to, ...state });
  });
  return [...groups.values()].map((g) => {
    g.built.sort((a, b) => a.at - b.at);
    g.built.forEach((b, i) => { b.part = YURT_PARTS[i % YURT_PARTS.length].id; });
    const count = g.built.length;
    return {
      ...g,
      count,
      fullYurts: Math.floor(count / YURT_PARTS.length),
      inCurrent: count % YURT_PARTS.length,
      next: YURT_PARTS[count % YURT_PARTS.length]
    };
  });
}

/** SVG юрты: построенные части — в цвете, остальные — пунктиром (план) */
export function yurtSvg(builtCount, title = '') {
  const idx = (id) => YURT_PARTS.findIndex((p) => p.id === id);
  const g = (id, body) => `<g class="yp ${idx(id) < builtCount ? 'yp-done' : 'yp-todo'}" data-part="${id}" style="--k:${idx(id)}">${body}</g>`;
  // Стена (кереге) — низкая, купол (уук + үзүк) — высокий и круглый, как у настоящей юрты
  const W = { x: 66, y: 166, w: 268, h: 72 };
  const ROOF = 'M54 168 C64 128 132 80 178 72 L222 72 C268 80 336 128 346 168 Z';
  const ROOF_EDGE = 'M60 164 C72 128 136 84 180 77 M220 77 C264 84 328 128 340 164';
  const lattice = [];
  for (let x = W.x - 80; x <= W.x + W.w; x += 16) {
    lattice.push(`<line x1="${x}" y1="${W.y}" x2="${x + W.h}" y2="${W.y + W.h}"/>`, `<line x1="${x}" y1="${W.y + W.h}" x2="${x + W.h}" y2="${W.y}"/>`);
  }
  // Уук: изогнутые жерди от верха стены к түндүку
  const poles = [];
  for (let i = 0; i <= 12; i++) {
    const x = W.x + (i * W.w) / 12;
    const a = Math.PI - (i * Math.PI) / 12;
    const ex = 200 + 22 * Math.cos(a);
    const ey = 64 + 22 * Math.sin(a);
    const cx = x + (ex - x) * 0.25;
    const cy = W.y - 48;
    poles.push(`<path d="M${x.toFixed(1)} ${W.y} Q${cx.toFixed(1)} ${cy} ${ex.toFixed(1)} ${ey.toFixed(1)}"/>`);
  }
  const horn = 'M0 9 V5 M0 5 C0 2 -2.6 0.6 -4.8 1.2 C-6.8 1.8 -7 4.2 -5.4 4.9 C-4.1 5.4 -3 4.4 -3.4 3.3 M0 5 C0 2 2.6 0.6 4.8 1.2 C6.8 1.8 7 4.2 5.4 4.9 C4.1 5.4 3 4.4 3.4 3.3';
  const hornRow = (y, from, to, step) => {
    const out = [];
    for (let x = from; x <= to; x += step) out.push(`<path transform="translate(${x} ${y})" d="${horn}"/>`);
    return out.join('');
  };
  return `<svg class="yurt-svg" viewBox="0 0 400 280" role="img" aria-label="${title.replace(/"/g, '&quot;')}">
  <defs><clipPath id="yurtWall"><rect x="${W.x}" y="${W.y}" width="${W.w}" height="${W.h}"/></clipPath></defs>
  ${g('shyrdak', `<ellipse cx="200" cy="250" rx="180" ry="20" class="y-carpet"/><g class="y-orn">${hornRow(244, 52, 348, 24)}</g>`)}
  ${g('kerege', `<g clip-path="url(#yurtWall)" class="y-wood y-lattice">${lattice.join('')}</g><rect x="${W.x}" y="${W.y}" width="${W.w}" height="${W.h}" class="y-frame"/>`)}
  ${g('uuk', `<g class="y-wood y-poles">${poles.join('')}</g>`)}
  ${g('tuurduk', `<rect x="${W.x}" y="${W.y}" width="${W.w}" height="${W.h}" rx="3" class="y-felt"/>`)}
  ${g('uzuk', `<path d="${ROOF}" class="y-felt y-roof"/>`)}
  ${g('tunduk', `<circle cx="200" cy="62" r="22" class="y-crown"/><path d="M188 47 C195 56 195 68 188 77 M200 41 C205 52 205 72 200 83 M212 47 C205 56 205 68 212 77" class="y-crown-bars"/>`)}
  ${g('boo', `<rect x="${W.x}" y="${W.y - 2}" width="${W.w}" height="10" class="y-band"/><g class="y-orn-light">${hornRow(W.y - 1.5, W.x + 12, W.x + W.w - 10, 20)}</g><path d="${ROOF_EDGE}" class="y-band-line"/>`)}
  ${g('eshik', `<rect x="181" y="186" width="38" height="52" rx="3" class="y-door"/><path d="M200 196 V230 M189 213 H211" class="y-door-orn"/>`)}
</svg>`;
}
