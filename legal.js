/**
 * Bilim Arena — страницы «Купуялык» и «Колдонуу шарттары» (privacy.html, terms.html).
 * Текст — в data/legal.js; на странице «Купуялык» есть удаление данных этого устройства.
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { t, pick, getLang } from './core/i18n.js';
import { PRIVACY, TERMS, UPDATED, CONTACT_URL } from './data/legal.js';

const DOC = document.body.dataset.doc === 'terms' ? TERMS : PRIVACY;

function paragraph(item, lang) {
  if (item.list) return el('ul', { class: 'legal-list' }, ...item.list.map((li) => el('li', {}, pick(li, lang))));
  return el('p', {}, pick(item, lang));
}

/** Всё, что сайт хранит в этом браузере: прогресс, профиль, игры, вход в облако, офлайн-кэш */
const OWN_KEYS = /^(BA2_|BA_|ba-|focus_duel_|mafia_|ld_lang$|playerName$|playerAvatar$|kgPinchRecords$|sb-|play_)/;

async function deleteLocalData() {
  if (!confirm(t('legal_delete_confirm'))) return;
  // Сначала выход из облака: иначе данные снова скачаются при следующей синхронизации
  try {
    const cloud = await import('./core/cloud.js');
    await cloud.signOut?.({ force: true });
  } catch { /* облако не подключено */ }
  try {
    Object.keys(localStorage).filter((k) => OWN_KEYS.test(k)).forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch { /* хранилище недоступно */ }
  try {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('ba-')).map((n) => caches.delete(n)));
  } catch { /* кэша нет */ }
  toast(t('legal_deleted'), { icon: '✅', ms: 4000 });
  setTimeout(() => location.replace('./index.html'), 1500);
}

function render() {
  const lang = getLang();
  document.title = `${pick(DOC.title, lang)} — ${t('app_name')}`;
  const [y, m, d] = UPDATED.split('-');

  const body = [
    el('h1', {}, pick(DOC.title, lang)),
    el('p', { class: 'small muted' }, t('legal_updated', { date: `${d}.${m}.${y}` })),
    el('p', { class: 'lead' }, pick(DOC.intro, lang)),
    ...DOC.sections.map((s) => el('section', { class: 'legal-section' },
      el('h2', {}, pick(s.title, lang)),
      ...s.body.map((item) => paragraph(item, lang)),
      ...(s.link ? [el('p', {}, el('a', { href: s.link.href }, pick(s.link.text, lang)))] : [])
    ))
  ];

  if (DOC === PRIVACY) {
    body.push(el('section', { class: 'legal-section card plain stack' },
      el('h2', {}, t('legal_delete_title')),
      el('p', {}, t('legal_delete_text')),
      el('div', {}, el('button', { class: 'btn danger', type: 'button', onclick: deleteLocalData }, t('legal_delete_btn')))
    ));
  }

  body.push(el('section', { class: 'legal-section' },
    el('h2', {}, t('legal_contact_title')),
    el('p', {}, t('legal_contact_text')),
    el('p', {}, el('a', { href: CONTACT_URL, target: '_blank', rel: 'noopener' }, CONTACT_URL.replace(/^https:\/\//, '')))
  ));
  body.push(el('p', { class: 'small muted' },
    el('a', { href: DOC === PRIVACY ? './terms.html' : './privacy.html' }, DOC === PRIVACY ? t('legal_terms') : t('legal_privacy'))));

  $('#legal').replaceChildren(...body);
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: '' });
  render();
})();
