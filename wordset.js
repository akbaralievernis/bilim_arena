/**
 * Bilim Arena — свои слова учителя для языковых игр (wordset.html).
 *
 * Учитель вписывает слова строками «кыргызча — орусча — англисче» и получает ссылку и
 * QR-код для каждой игры. Набор лежит в самой ссылке после «#w=» (shared/vocab.js
 * читает его и подменяет общий словарь), поэтому не нужен ни аккаунт, ни сервер:
 * ученик открывает ссылку на любом устройстве. Наборы можно сохранить на этом устройстве.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { t } from './core/i18n.js';
import { store } from './core/store.js';
import { setRole } from './core/profile.js';

const SAVED = 'wordsets';
const MAX_WORDS = 80;
/** Игры, которые берут слова из общего словаря (shared/vocab.js) */
const GAMES = [
  { id: 'flashcards', path: 'games/flashcards/index.html', key: 'ws_game_flashcards' },
  { id: 'word-match', path: 'games/word-match/index.html', key: 'ws_game_match' },
  { id: 'word-rain', path: 'games/word-rain/index.html', key: 'ws_game_rain' },
  { id: 'balloons', path: 'games/balloons/index.html', key: 'ws_game_balloons' },
  { id: 'eagle', path: 'games/eagle/index.html', key: 'ws_game_eagle' }
];

/** Строки → [[ky, ru, en]]; разделитель — тире, «=», «|», табуляция или точка с запятой */
export function parseWords(text) {
  const rows = [];
  const bad = [];
  String(text || '').split(/\r?\n/).forEach((line, i) => {
    const raw = line.trim();
    if (!raw) return;
    const parts = raw.split(/\s+[—–-]\s+|\s*[=|;\t]\s*/).map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) { bad.push(i + 1); return; }
    rows.push(parts.slice(0, 3).map((x) => x.slice(0, 40)));
  });
  return { rows: rows.slice(0, MAX_WORDS), bad, tooMany: rows.length > MAX_WORDS };
}

const b64url = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function setLink(path, name, rows) {
  const url = new URL(path, location.href);
  url.hash = 'w=' + b64url(JSON.stringify({ n: name.slice(0, 40), w: rows.map(([ky, ru, en]) => [ky, ru || '', en || '']) }));
  return url.href;
}

function current() {
  const name = $('#wsName').value.trim() || t('ws_default_name');
  const parsed = parseWords($('#wsWords').value);
  return { name, ...parsed };
}

function showStatus({ rows, bad, tooMany }) {
  const parts = [t('ws_count', { n: rows.length })];
  if (bad.length) parts.push(t('ws_bad', { list: bad.slice(0, 8).join(', ') }));
  if (tooMany) parts.push(t('ws_too_many', { n: MAX_WORDS }));
  $('#wsStatus').textContent = parts.join(' · ');
}

function renderQr(game, url) {
  $('#wsQrBox').classList.remove('hidden');
  $('#wsQrTitle').textContent = t(game.key);
  $('#wsUrl').value = url;
  $('#wsOpen').href = url;
  const qr = window.qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  $('#wsQr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

function make() {
  const set = current();
  showStatus(set);
  if (set.rows.length < 2) { toast(t('ws_need_two'), { icon: '⚠️' }); $('#wsWords').focus(); return; }
  const links = GAMES.map((g) => ({ ...g, url: setLink(g.path, set.name, set.rows) }));
  $('#wsGames').replaceChildren(...links.map((g) => el('button', {
    class: 'card card-link ws-game', type: 'button',
    onclick: () => renderQr(g, g.url)
  }, el('b', {}, t(g.key)), el('span', { class: 'small muted' }, t('ws_show_qr')))));
  $('#wsLinks').classList.remove('hidden');
  renderQr(links[0], links[0].url);
}

async function renderSaved() {
  const list = (await store.get(SAVED, [])) || [];
  $('#wsSaved').classList.toggle('hidden', !list.length);
  $('#wsSavedList').replaceChildren(...list.map((s) => el('div', { class: 'row between card plain' },
    el('span', {}, el('b', {}, s.name), ' · ', t('ws_count', { n: s.rows.length })),
    el('div', { class: 'row', style: 'gap:6px' },
      el('button', { class: 'btn soft', type: 'button', onclick: () => {
        $('#wsName').value = s.name;
        $('#wsWords').value = s.rows.map((r) => r.filter(Boolean).join(' — ')).join('\n');
        make();
        window.scrollTo({ top: 0 });
      } }, t('ws_load')),
      el('button', { class: 'btn danger', type: 'button', 'aria-label': `${t('delete')}: ${s.name}`, onclick: async () => {
        if (!confirm(t('ws_delete_confirm', { name: s.name }))) return;
        await store.set(SAVED, list.filter((x) => x.id !== s.id));
        renderSaved();
      } }, t('delete')))
  )));
}

async function save() {
  const set = current();
  if (set.rows.length < 2) { toast(t('ws_need_two'), { icon: '⚠️' }); return; }
  const list = ((await store.get(SAVED, [])) || []).filter((x) => x.name !== set.name);
  list.unshift({ id: `ws_${Date.now().toString(36)}`, name: set.name, rows: set.rows, at: Date.now() });
  await store.set(SAVED, list.slice(0, 30));
  toast(t('ws_saved_ok'), { icon: '✅' });
  renderSaved();
}

(async function init() {
  await bootstrap();
  await setRole('teacher');
  mountHeader($('#header'), { role: 'teacher', active: 'wordset.html' });
  $('#wsWords').addEventListener('input', () => showStatus(current()));
  $('#wsMake').addEventListener('click', make);
  $('#wsSave').addEventListener('click', save);
  $('#wsCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#wsUrl').value); toast(t('ws_copied'), { icon: '✅' }); }
    catch { $('#wsUrl').select(); }
  });
  showStatus(current());
  renderSaved();
})();
