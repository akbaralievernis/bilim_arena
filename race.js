/**
 * Bilim Arena — вход в Bilim Arena Race с основного сайта.
 *
 * Сама гонка — отдельный сайт (своя база, свой вход учителя). Эта страница
 * объясняет, что это, и ведёт туда: ученик — по коду гонки, учитель —
 * к созданию гонки. Язык основного сайта передаётся гонке (core/race.js).
 */

import { bootstrap, mountHeader, el, $ } from './core/ui.js';
import { icon } from './core/icons.js';
import { cover } from './core/art.js';
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

  $('#raceArt').replaceChildren(cover(icon('flag', { size: 64 }), 'violet'));
  $('#raceFeatures').replaceChildren(...['race_f1', 'race_f2', 'race_f3'].map((key) =>
    el('li', {}, icon('check', { size: 18 }), el('span', {}, t(key)))));

  $('#raceJoinBtn').replaceChildren(icon('join', { size: 20 }), el('span', {}, t('race_join_btn')));
  $('#raceCreate').replaceChildren(icon('flag', { size: 18 }), el('span', {}, t('race_create_btn')));
  $('#raceCreate').href = raceUrl('/create');
  $('#raceStatus').replaceChildren(icon('check', { size: 18 }), el('span', {}, t('race_status_link')));
  $('#raceStatus').href = raceUrl('/status');
  $('#raceExternal').textContent = `${t('race_external')}: ${new URL(RACE_URL).host}`;

  const input = $('#raceCode');
  const error = $('#raceCodeError');
  const params = new URLSearchParams(location.search);
  if (params.get('code')) input.value = normalize(params.get('code'));

  input.addEventListener('input', () => {
    input.value = normalize(input.value);
    error.textContent = '';
  });

  $('#raceJoin').addEventListener('submit', (event) => {
    event.preventDefault();
    const code = normalize(input.value);
    if (!isRaceCode(code)) {
      error.textContent = code ? t('race_code_invalid') : t('err_enter_code');
      input.focus();
      return;
    }
    location.href = raceUrl('/join', { code });
  });
})();
