/**
 * Bilim Arena — набор иконок.
 *
 * Один стиль на всю платформу: контур 2px, скруглённые концы, сетка 24×24.
 * Иконки рисуются из простых фигур, без внешних библиотек и эмодзи.
 * icon('games') → <svg>; цвет берётся из currentColor.
 */

const P = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  games: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="15.5" cy="11.5" r="1"/><circle cx="17.5" cy="13.5" r="1"/>',
  tasks: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  profile: '<circle cx="12" cy="8.5" r="4"/><path d="M4 20.5c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  teacher: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 9v6"/>',
  join: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/><path d="M9 9l3 3-3 3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5l-4.8-4.8"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 18.5z"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1"/><path d="M18.5 3v4.5H14M5.5 21v-4.5H10"/>',
  offline: '<path d="M3 3l18 18"/><path d="M7 18.5h10M6.5 10.5A5.5 5.5 0 0 1 16 8"/>',
  warn: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
  flame: '<path d="M12 21c-4 0-6.5-2.7-6.5-6.3C5.5 10.5 9 8.5 9.5 4.5c2.8 1.8 4.2 4 4.3 6.3.9-.8 1.5-1.9 1.7-3 2 1.7 3 4.2 3 6.8 0 3.6-2.5 6.4-6.5 6.4z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  trophy: '<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4v1.5A3.5 3.5 0 0 0 7.7 11M16.5 6H20v1.5a3.5 3.5 0 0 1-3.7 3.5"/><path d="M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 19.5c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.5 14.5c2.2.2 4 1.6 5 4.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M5 20c1.2-3.5 3.8-5.3 7-5.3s5.8 1.8 7 5.3"/>',
  level: '<path d="M4 20h16"/><path d="M7 20v-5M12 20V9M17 20V4"/>',
  device: '<rect x="3" y="4.5" width="13" height="10" rx="2"/><path d="M7 18.5h5"/><rect x="17" y="8.5" width="4.5" height="10" rx="1.5"/>',
  board: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
  camera: '<rect x="3" y="7" width="18" height="12.5" rx="3"/><path d="M8.5 7l1.5-2.5h4L15.5 7"/><circle cx="12" cy="13.2" r="3.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
  sound: '<path d="M4 9.5h4l5-4v13l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  language: '<path d="M4 5h9M8.5 3v2M6 5c.6 3.5 2.8 6 6 7.5M11 5c-.8 4-3.5 7-7 8.5"/><path d="M13 20l4-9 4 9M14.5 17h5"/>',
  logic: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
  team: '<circle cx="7" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 19c.8-3.2 2.8-5 5-5s4.2 1.8 5 5c.8-3.2 2.8-5 5-5s4.2 1.8 5 5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  cards: '<rect x="3" y="6" width="12" height="15" rx="2.5"/><path d="M8 3.5h10.5A2.5 2.5 0 0 1 21 6v11"/>',
  puzzle: '<path d="M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4H5v-4a2 2 0 1 0 0-4z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  letters: '<path d="M3.5 18l4-11 4 11M5 14h5"/><path d="M14 7h4a2.5 2.5 0 0 1 0 5h-4zM14 12h4.5a3 3 0 0 1 0 6H14z"/>',
  rain: '<path d="M7 14.5h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6.9 8 3.3 3.3 0 0 0 7 14.5z"/><path d="M8 18l-1 2.5M12.5 18l-1 2.5M17 18l-1 2.5"/>',
  balloon: '<path d="M12 15.5c-3.3 0-6-3-6-6.5a6 6 0 0 1 12 0c0 3.5-2.7 6.5-6 6.5z"/><path d="M11 15.5l-.5 1.5h3l-.5-1.5M12 17c0 2 1.5 2.5 1 4.5"/>',
  sentence: '<rect x="3" y="5" width="8" height="5" rx="1.5"/><rect x="13" y="5" width="8" height="5" rx="1.5"/><rect x="3" y="14" width="18" height="5" rx="1.5"/>',
  odd: '<circle cx="6.5" cy="7" r="3"/><circle cx="17.5" cy="7" r="3"/><circle cx="6.5" cy="17" r="3"/><rect x="14.5" y="14" width="6" height="6" rx="1"/>',
  castle: '<path d="M4 21V9h3V6h3v3h4V6h3v3h3v12z"/><path d="M10 21v-5h4v5"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  mask: '<path d="M3 7c3-1.5 6-1.5 9 0 3-1.5 6-1.5 9 0-.3 6.5-3.5 10.5-9 11C6.5 17.5 3.3 13.5 3 7z"/><path d="M7 10.5l2.5 1M17 10.5l-2.5 1"/>',
  bird: '<path d="M3 14c3.5 0 6-1.5 7.5-5 1.5 3.5 4 5 7.5 5-2 2.5-4.5 4-7.5 4S5 16.5 3 14z"/><path d="M15 7.5l3.5-2.5L21 7"/>',
  pointer: '<path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l6 1.5c1 .3 1.5 1.2 1.3 2.2L18 20H10l-4-5c-.6-.8-.4-2 .5-2.4.7-.4 1.6-.2 2.1.4z"/>',
  brush: '<path d="M20 4L10 14"/><path d="M10 14c-3 0-4 2-4 4s-1.5 2.5-3 2.5c1.5 1 4 1.5 6 0s2.5-3.5 1-6.5z"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/>',
  chart: '<path d="M4 20V4M4 20h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="10" width="3" height="7"/>',
  map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  lens: '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20.5 20.5"/><path d="M7.5 10a2.5 2.5 0 0 1 2.5-2.5"/>',
  pen: '<path d="M4 20l1-4.5L16 4.5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M14 7l3 3"/>',
  hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2"/>',
  swords: '<path d="M4 4l9 9M20 4l-9 9"/><path d="M4 4h4M4 4v4M20 4h-4M20 4v4"/><path d="M7.5 16.5l-3 3M16.5 16.5l3 3M6 15l3 3M18 15l-3 3"/>',
  flask: '<path d="M9.5 3h5M10.5 3v6L5 18.5A1.8 1.8 0 0 0 6.6 21h10.8a1.8 1.8 0 0 0 1.6-2.5L13.5 9V3"/><path d="M7.5 15h9"/>',
  city: '<path d="M3 21h18"/><rect x="4.5" y="10" width="6" height="11"/><rect x="13.5" y="4" width="6" height="17"/><path d="M7 13.5h1M7 16.5h1M16 7.5h1M16 10.5h1M16 13.5h1"/>',
  quiz: '<rect x="3.5" y="4" width="17" height="13" rx="3"/><path d="M9.8 8.5a2.3 2.3 0 1 1 3 2.2c-.6.2-.8.6-.8 1.3M12 14v.3"/><path d="M8 20.5h8"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>',
  logout: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4.5h-4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.5"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
  unlock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/><circle cx="12" cy="15.5" r="1.2"/>',
  pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/>',
  skip: '<path d="M5.5 5.5v13l9-6.5z"/><path d="M18.5 5.5v13"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4.5h11l-2 4 2 4H5"/>',
  school: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5M12 5V2.5h3"/>',
  hospital: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M12 8v6M9 11h6M9.5 21v-3h5v3"/>',
  tree: '<path d="M12 21v-5"/><path d="M12 3c3.3 0 6 2.6 6 5.8 0 1-.3 2-.8 2.8A4.5 4.5 0 0 1 14 16H10a4.5 4.5 0 0 1-3.2-4.4c-.5-.8-.8-1.8-.8-2.8C6 5.6 8.7 3 12 3z"/>',
  factory: '<path d="M3 21V11l5 3V11l5 3V7h3l1 7h3v7z"/><path d="M7 18h2M12 18h2"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2 0 2.8 5 1.4 5 4 0 1.2-1 2-2.5 2-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5"/>',
  smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5c1.8 2 5.2 2 7 0M9 9.5v.5M15 9.5v.5"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l7-7"/>',
  medal: '<path d="M8 3h8l-2 6h-4z"/><circle cx="12" cy="15" r="5.5"/><path d="M12 12.5v5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  wifiOff: '<path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 6.5-.4M5 12.5a10 10 0 0 1 4-2.2M12 20h.01"/>',
  inbox: '<path d="M3 13l2.5-8h13L21 13v6H3z"/><path d="M3 13h5l1 2.5h6l1-2.5h5"/>',
  hourglassEnd: '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/><path d="M9 19h6"/>'
};

export const ICON_NAMES = Object.keys(P);

/** SVG-иконка. label — если иконка несёт смысл без подписи */
export function icon(name, { size = 20, label = null, cls = '' } = {}) {
  const body = P[name] || P.info;
  const aria = label ? `role="img" aria-label="${String(label).replace(/"/g, '&quot;')}"` : 'aria-hidden="true" focusable="false"';
  const tpl = document.createElement('template');
  tpl.innerHTML = `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${aria}>${body}</svg>`;
  return tpl.content.firstChild;
}
