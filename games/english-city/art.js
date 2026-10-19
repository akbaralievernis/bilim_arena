/**
 * English City — лёгкие SVG-рисунки предметов и мест (без картинок-файлов).
 * Возвращают строку SVG; текста пользователя внутри нет — вставка безопасна.
 */

export const COLORS = {
  red: '#D93A3A', blue: '#2F6FDE', green: '#2E9E55', yellow: '#F2C230', white: '#FFFFFF',
  orange: '#F28C28', brown: '#9C6B3C', black: '#2B2B2B'
};

const svg = (body, label = '') => `<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" focusable="false"${label ? ` data-kind="${label}"` : ''}>${body}</svg>`;
const S = 'stroke="#202B46" stroke-width="1.6" stroke-linejoin="round"';

const KINDS = {
  book: (c) => `<rect x="10" y="8" width="26" height="32" rx="3" fill="${c}" ${S}/><rect x="10" y="8" width="6" height="32" fill="#00000022"/><path d="M20 16h11M20 21h11" stroke="#fff" stroke-width="1.6"/>`,
  bag: (c) => `<path d="M17 14a7 7 0 0 1 14 0" fill="none" ${S}/><rect x="9" y="14" width="30" height="26" rx="6" fill="${c}" ${S}/><rect x="17" y="24" width="14" height="9" rx="2" fill="#ffffff55" ${S}/>`,
  pencil: (c) => `<path d="M10 38l4-12 18-18 8 8-18 18z" fill="${c}" ${S}/><path d="M10 38l4-12 8 8z" fill="#F4D9B0" ${S}/><path d="M10 38l2-6 4 4z" fill="#202B46"/>`,
  ruler: (c) => `<rect x="6" y="18" width="36" height="12" rx="2" fill="${c}" ${S}/><path d="M12 18v5M18 18v4M24 18v5M30 18v4M36 18v5" stroke="#202B46" stroke-width="1.4"/>`,
  cup: (c) => `<path d="M11 14h22l-2 24a3 3 0 0 1-3 2H16a3 3 0 0 1-3-2z" fill="${c}" ${S}/><path d="M33 19h3a5 5 0 0 1 0 10h-4" fill="none" ${S}/>`,
  apple: (c) => `<path d="M24 15c-6-5-15-2-15 8 0 9 7 17 15 15 8 2 15-6 15-15 0-10-9-13-15-8z" fill="${c}" ${S}/><path d="M24 15c0-4 2-7 5-8" fill="none" ${S}/><path d="M26 10c3-3 7-2 8 0-3 2-6 2-8 0z" fill="#2E9E55"/>`,
  banana: (c) => `<path d="M9 14c2 14 12 22 28 18 2-1 2-3 0-3-12 1-19-5-22-16-1-3-6-3-6 1z" fill="${c}" ${S}/>`,
  milk: (c) => `<path d="M16 8h16v6l4 6v20H12V20l4-6z" fill="${c}" ${S}/><rect x="16" y="24" width="16" height="9" fill="#2F6FDE"/>`,
  juice: (c) => `<rect x="13" y="12" width="22" height="28" rx="2" fill="${c}" ${S}/><path d="M28 12V5h4" fill="none" ${S}/><circle cx="24" cy="26" r="5" fill="#fff" opacity=".7"/>`,
  bread: (c) => `<path d="M8 22c0-8 32-8 32 0 0 3-2 4-3 4v12H11V26c-1 0-3-1-3-4z" fill="${c}" ${S}/><path d="M17 20l3 4M24 19l3 4M31 20l2 4" stroke="#F4D9B0" stroke-width="1.8"/>`,
  ball: (c) => `<circle cx="24" cy="24" r="15" fill="${c}" ${S}/><path d="M9 24h30M24 9c6 6 6 24 0 30" fill="none" stroke="#fff" stroke-width="1.8"/>`,
  hat: (c) => `<path d="M8 32h32c0 3-4 5-16 5S8 35 8 32z" fill="${c}" ${S}/><path d="M14 32c0-12 4-18 10-18s10 6 10 18" fill="${c}" ${S}/>`,
  sandwich: (c) => `<path d="M8 30l16-16 16 16z" fill="#F4D9B0" ${S}/><path d="M11 27h26" stroke="#2E9E55" stroke-width="3"/><path d="M8 30h32v5H8z" fill="${c}" ${S}/>`,
  water: (c) => `<path d="M19 6h10v6l3 5v23H16V17l3-5z" fill="#D8ECFF" ${S}/><rect x="16" y="22" width="16" height="9" fill="${c}"/>`,
  dog: (c) => `<ellipse cx="24" cy="30" rx="13" ry="9" fill="${c}" ${S}/><circle cx="34" cy="18" r="7" fill="${c}" ${S}/><path d="M37 12l4-4 1 7z" fill="${c}" ${S}/><circle cx="36" cy="17" r="1.2" fill="#202B46"/><path d="M13 36v6M33 36v6M11 28l-5-4" ${S}/>`,
  cat: (c) => `<ellipse cx="22" cy="32" rx="12" ry="8" fill="${c}" ${S}/><circle cx="32" cy="19" r="7" fill="${c}" ${S}/><path d="M27 14l1-7 4 5M33 12l4-5 1 7" fill="${c}" ${S}/><circle cx="34" cy="19" r="1.2" fill="#F2C230"/><path d="M10 32c-5-2-5-9 0-10" fill="none" ${S}/>`,
  car: (c) => `<path d="M6 30v-6l6-8h18l8 8h4v6z" fill="${c}" ${S}/><circle cx="15" cy="32" r="5" fill="#202B46"/><circle cx="35" cy="32" r="5" fill="#202B46"/><path d="M14 22l3-4h7v4z" fill="#D8ECFF"/>`
};

/** Иконка предмета (цвет — по названию цвета) */
export const objectArt = (o) => svg((KINDS[o.kind] || KINDS.ball)(COLORS[o.color] || o.color));

/** Рисунок места (мебель, люди) — небольшой, рядом с подписью */
const ZONES = {
  floor: '<rect x="4" y="30" width="40" height="10" rx="2" fill="#E8DCC6"/>',
  desk: '<rect x="6" y="18" width="36" height="6" rx="1" fill="#B9834F"/><path d="M10 24v16M38 24v16" stroke="#8A5F36" stroke-width="3"/>',
  under: '<rect x="6" y="10" width="36" height="5" rx="1" fill="#B9834F"/><path d="M10 15v26M38 15v26" stroke="#8A5F36" stroke-width="3"/><path d="M16 36h16" stroke="#E0162B" stroke-width="2" stroke-dasharray="3 2"/>',
  next: '<rect x="4" y="18" width="20" height="5" fill="#B9834F"/><path d="M7 23v15M21 23v15" stroke="#8A5F36" stroke-width="3"/><path d="M30 30h12M38 26l4 4-4 4" fill="none" stroke="#E0162B" stroke-width="2"/>',
  chair: '<path d="M14 8v20h20v12M14 28v12" fill="none" stroke="#8A5F36" stroke-width="3"/><rect x="12" y="26" width="24" height="4" fill="#B9834F"/>',
  shelf: '<path d="M6 16h36M6 32h36" stroke="#8A5F36" stroke-width="3"/><path d="M8 16v24M40 16v24" stroke="#B9834F" stroke-width="2"/>',
  teacher: '<circle cx="24" cy="13" r="7" fill="#F4C9A0"/><path d="M12 42c0-10 5-16 12-16s12 6 12 16z" fill="#21B8A6"/>',
  girl: '<circle cx="24" cy="14" r="7" fill="#F4C9A0"/><path d="M17 12c0-8 14-8 14 0" fill="#5A3A22"/><path d="M14 42l4-15h12l4 15z" fill="#F0607E"/>',
  cashier: '<circle cx="24" cy="13" r="7" fill="#E9B98F"/><path d="M12 42c0-10 5-16 12-16s12 6 12 16z" fill="#FFB547"/><rect x="18" y="30" width="12" height="7" rx="1" fill="#fff"/>',
  counter: '<rect x="4" y="22" width="40" height="18" rx="2" fill="#CFD6E4"/><rect x="4" y="20" width="40" height="4" fill="#9AA6BD"/>',
  table: '<rect x="6" y="18" width="36" height="5" rx="2" fill="#C99A6B"/><path d="M12 23v17M36 23v17" stroke="#8A5F36" stroke-width="3"/>',
  plate: '<ellipse cx="24" cy="26" rx="15" ry="7" fill="#fff" stroke="#9AA6BD" stroke-width="2"/><ellipse cx="24" cy="26" rx="8" ry="3.5" fill="none" stroke="#CFD6E4" stroke-width="1.5"/>',
  fridge: '<rect x="12" y="4" width="24" height="40" rx="3" fill="#E8EEF7" stroke="#9AA6BD" stroke-width="2"/><path d="M12 18h24M16 10v4M16 24v6" stroke="#9AA6BD" stroke-width="2"/>',
  sink: '<path d="M8 22h32l-4 12H12z" fill="#D8ECFF" stroke="#9AA6BD" stroke-width="2"/><path d="M24 22v-10h6" fill="none" stroke="#9AA6BD" stroke-width="2.4"/>',
  path: '<path d="M4 40c10-10 30-10 40-24" fill="none" stroke="#E8DCC6" stroke-width="8" stroke-linecap="round"/>',
  bench: '<rect x="6" y="20" width="36" height="5" rx="1" fill="#B9834F"/><rect x="6" y="12" width="36" height="4" rx="1" fill="#B9834F"/><path d="M10 25v12M38 25v12" stroke="#5A3A22" stroke-width="3"/>',
  tree: '<circle cx="24" cy="16" r="12" fill="#2E9E55"/><rect x="21" y="26" width="6" height="16" fill="#8A5F36"/>',
  basket: '<path d="M8 22h32l-4 18H12z" fill="#D9A55B" stroke="#8A5F36" stroke-width="2"/><path d="M14 22c0-10 20-10 20 0" fill="none" stroke="#8A5F36" stroke-width="2.4"/>',
  box: '<path d="M8 18h32v22H8z" fill="#D9A55B" stroke="#8A5F36" stroke-width="2"/><path d="M8 18l6-8h20l6 8" fill="none" stroke="#8A5F36" stroke-width="2"/>'
};
export const zoneArt = (key) => svg(ZONES[key] || ZONES.floor);
