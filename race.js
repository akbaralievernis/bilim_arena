/**
 * Bilim Arena — вход в Bilim Arena Race с основного сайта.
 *
 * Сама гонка — отдельный сайт (своя база, свой вход учителя). Эта страница
 * объясняет, что это, и ведёт туда: ученик — по коду гонки, учитель —
 * к созданию гонки. Язык основного сайта передаётся гонке (core/race.js).
 */

import { bootstrap, mountHeader, el, $ } from './core/ui.js';
import { icon } from './core/icons.js';
import { t } from './core/i18n.js';
import { RACE_URL } from './core/config.js';
import { isRaceCode, raceUrl } from './core/race.js';

// Ученики часто набирают код в русской раскладке: похожие буквы → латиница
const LOOKALIKES = { А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X', У: 'Y' };
const normalize = (value) =>
  value.toUpperCase().replace(/[АВЕКМНОРСТХУ]/g, (ch) => LOOKALIKES[ch]).replace(/[^A-Z0-9]/g, '').slice(0, 6);

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'race.html' });

  $('#raceArt').replaceChildren(raceStage());
  $('#raceFeatures').replaceChildren(...['race_f1', 'race_f2', 'race_f3'].map((key) =>
    el('li', {}, el('span', { class: 'rf-ic' }, icon('check', { size: 16 })), el('span', {}, t(key)))));
  $('#raceSteps').replaceChildren(...['race_t1', 'race_t2', 'race_t3'].map((key, i) =>
    el('li', {}, el('b', {}, String(i + 1)), el('span', {}, t(key)))));
  $('#raceTip').replaceChildren(icon('camera', { size: 22 }), el('span', {}, t('race_qr_tip')));
  $('#raceStudentIc').replaceChildren(icon('join', { size: 26 }));
  $('#raceTeacherIc').replaceChildren(icon('teacher', { size: 26 }));

  $('#raceJump').replaceChildren(icon('join', { size: 20 }), el('span', {}, t('race_join_btn')));
  $('#raceJoinBtn').replaceChildren(icon('join', { size: 20 }), el('span', {}, t('race_join_btn')));
  for (const id of ['#raceCreate', '#raceCreateTop']) {
    $(id).replaceChildren(icon('flag', { size: 18 }), el('span', {}, t('race_create_btn')));
    $(id).href = raceUrl('/create');
  }
  $('#raceStatus').replaceChildren(icon('check', { size: 18 }), el('span', {}, t('race_status_link')));
  $('#raceStatus').href = raceUrl('/status');
  $('#raceExternal').textContent = `${t('race_external')}: ${new URL(RACE_URL).host}`;

  const input = $('#raceCode');
  const error = $('#raceCodeError');
  const params = new URLSearchParams(location.search);
  if (params.get('code')) input.value = normalize(params.get('code'));

  // Шесть клеток кода: настоящее поле ввода лежит поверх них (прозрачное)
  const cells = Array.from({ length: 6 }, () => el('span', { class: 'code-cell', 'aria-hidden': 'true' }));
  $('#raceCells').prepend(...cells);
  const paint = () => {
    const focused = document.activeElement === input;
    cells.forEach((cell, i) => {
      cell.textContent = input.value[i] || '';
      cell.classList.toggle('filled', i < input.value.length);
      cell.classList.toggle('active', focused && i === Math.min(input.value.length, 5));
    });
    $('#raceCells').classList.toggle('done', isRaceCode(input.value));
  };
  input.addEventListener('focus', paint);
  input.addEventListener('blur', paint);
  input.addEventListener('input', () => {
    input.value = normalize(input.value);
    error.textContent = '';
    $('#raceCells').classList.remove('bad');
    paint();
  });
  paint();

  $('#raceJoin').addEventListener('submit', (event) => {
    event.preventDefault();
    const code = normalize(input.value);
    if (!isRaceCode(code)) {
      error.textContent = code ? t('race_code_invalid') : t('err_enter_code');
      $('#raceCells').classList.add('bad');
      input.focus();
      return;
    }
    location.href = raceUrl('/join', { code });
  });
})();

/* ─── Сахна: маршрут с чекпоинтами, три команды едут, таблица очков ────────── */
const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => {
  const node = document.createElementNS(SVG, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
};
const ROUTE = 'M40 262 C 110 262 120 196 182 200 S 268 250 312 196 S 340 104 262 100 S 150 92 132 58 S 250 22 366 34';
const TEAMS = [
  { name: 'A', color: '#E0162B', speed: 0.052, start: 0.18 },
  { name: 'B', color: '#0FA595', speed: 0.047, start: 0.1 },
  { name: 'C', color: '#FFB547', speed: 0.043, start: 0.03 }
];

function raceStage() {
  const map = svg('svg', { viewBox: '0 0 400 300', class: 'race-map' });
  const glow = svg('path', { d: ROUTE, class: 'rm-glow' });
  const road = svg('path', { d: ROUTE, class: 'rm-road' });
  const dash = svg('path', { d: ROUTE, class: 'rm-dash' });
  map.append(glow, road, dash);

  const cps = [];
  const tokens = TEAMS.map((team) => {
    const g = svg('g', { class: 'rm-token' });
    g.append(svg('circle', { r: 11, fill: team.color, stroke: '#fff', 'stroke-width': 3 }));
    const label = svg('text', { 'text-anchor': 'middle', dy: '4', class: 'rm-token-t' });
    label.textContent = team.name;
    g.append(label);
    return g;
  });

  const board = el('div', { class: 'race-board' },
    el('div', { class: 'rb-head' }, el('span', { class: 'rb-live' }, el('i'), t('race_live')), el('span', { class: 'rb-time' }, '02:45')));
  const rows = TEAMS.map((team) => {
    const pts = el('b', {}, '0');
    const row = el('div', { class: 'rb-row' },
      el('span', { class: 'rb-place' }), el('span', { class: 'rb-dot', style: `background:${team.color}` }),
      el('span', { class: 'rb-name' }, `${t('race_team')} ${team.name}`), pts);
    return { row, pts };
  });
  board.append(...rows.map((r) => r.row));

  const chip = el('div', { class: 'race-chip' }, icon('flag', { size: 16 }), el('span', {}));
  const stage = el('div', { class: 'race-stage-in' }, map, board, chip);

  // Точки маршрута можно посчитать только когда путь в документе
  requestAnimationFrame(() => {
    const len = road.getTotalLength();
    const CP = 6;
    for (let i = 1; i <= CP; i++) {
      const p = road.getPointAtLength((len * i) / (CP + 0.4));
      const g = svg('g', { class: 'rm-cp', transform: `translate(${p.x} ${p.y})` });
      g.append(svg('circle', { r: 12 }));
      const n = svg('text', { 'text-anchor': 'middle', dy: '4' });
      n.textContent = String(i);
      g.append(n);
      map.insertBefore(g, null);
      cps.push(g);
    }
    const end = road.getPointAtLength(len);
    const finish = svg('g', { class: 'rm-finish', transform: `translate(${end.x - 6} ${end.y - 26})` });
    finish.append(svg('path', { d: 'M0 26V0h20l-4 6 4 6H0' }));
    map.append(finish, ...tokens);

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pos = TEAMS.map((team) => team.start + (still ? 0.35 : 0));
    let seconds = 165;
    let last = performance.now();
    let tick = 0;
    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!still) TEAMS.forEach((team, i) => { pos[i] = (pos[i] + dt * team.speed * (0.8 + 0.4 * Math.sin(now / 900 + i * 2))); });
      if (Math.max(...pos) >= 1) TEAMS.forEach((team, i) => { pos[i] = team.start; }); // финиш — новый заезд
      TEAMS.forEach((team, i) => {
        const p = road.getPointAtLength(len * pos[i]);
        tokens[i].setAttribute('transform', `translate(${p.x} ${p.y})`);
      });
      const lead = Math.max(...pos);
      const reached = Math.min(CP, Math.floor(lead * (CP + 0.4)));
      cps.forEach((g, i) => g.classList.toggle('done', i < reached));
      chip.lastChild.textContent = t('race_cp', { n: `${Math.max(1, reached)}/${CP}` });
      // Очки и места: кто дальше — тот выше
      const order = TEAMS.map((_, i) => i).sort((a, b) => pos[b] - pos[a]);
      order.forEach((idx, place) => {
        const r = rows[idx];
        r.row.style.order = place;
        r.row.firstChild.textContent = String(place + 1);
        r.pts.textContent = String(Math.round(pos[idx] * 1200) * 5);
      });
      if (now - tick > 1000 && !still) {
        tick = now;
        seconds = seconds > 0 ? seconds - 1 : 165;
        board.querySelector('.rb-time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      }
      if (!still) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
  return stage;
}
