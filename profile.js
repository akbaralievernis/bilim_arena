/**
 * Bilim Arena — профиль ученика.
 *
 * Имя и иллюстрация, язык интерфейса, домашние задания, вход на урок,
 * аккаунт (если подключено облако) и переход в режим учителя.
 * Статистика и достижения — на странице прогресса (progress.html).
 */

import { bootstrap, mountHeader, el, $, toast } from './core/ui.js';
import { t, pick, getLang, setLang, LANGS } from './core/i18n.js';
import { icon } from './core/icons.js';
import { avatar, AVATAR_VARIANTS, avatarVariant } from './core/art.js';
import { SUPABASE } from './core/config.js';
import { getProgress, migrateLegacy } from './core/progress.js';
import { getProfile, saveProfile } from './core/profile.js';
import { studentAssignments, STATUS } from './core/assignments.js';

const LANG_NAMES = { ky: 'Кыргызча', ru: 'Русский', en: 'English' };
let draftAvatar = null;

function renderHead(p, pr) {
  const lang = getLang();
  $('#avatar').replaceChildren(avatar(draftAvatar || p.avatar, { size: 104 }));
  $('#profileName').textContent = p.name || t('role_student');
  $('#levelLine').textContent = `${t('home_level', { n: pr.level })} · ${pick(pr.title, lang)} · ${pr.xp} XP`;
  $('#xpBar').style.width = `${pr.levelPct}%`;
  $('#xpBarWrap').setAttribute('aria-valuenow', String(pr.levelPct));
  $('#xpBarWrap').setAttribute('aria-label', t('home_level', { n: pr.level }));
  $('#xpNote').textContent = t('home_xp_next', { n: pr.levelNeed - pr.levelInto });
  $('#progressLink').replaceChildren(icon('progress', { size: 18 }), el('span', {}, t('home_see_progress')));
}

function renderEditor(p) {
  $('#nameInput').value = p.name || '';
  draftAvatar = avatarVariant(p.avatar);
  const draw = () => $('#avatarPicker').replaceChildren(...AVATAR_VARIANTS.map((v, i) => el('button', {
    class: 'avatar-option', type: 'button', 'aria-pressed': String(v === draftAvatar),
    'aria-label': `${t('profile_avatar')} ${i + 1}`,
    onclick: () => { draftAvatar = v; draw(); $('#avatar').replaceChildren(avatar(v, { size: 104 })); }
  }, avatar(v, { size: 52, animated: false }))));
  draw();
}

/** Строка-ссылка: иконка, название, подпись, стрелка */
const linkRow = ({ href, ic, title, note, badge }) => el('a', { class: 'link-row', href },
  el('span', { class: 'link-icon' }, icon(ic, { size: 20 })),
  el('span', { class: 'link-text' }, el('b', {}, title), note ? el('span', { class: 'small muted' }, note) : null),
  badge ? el('span', { class: 'tag amber' }, badge) : null,
  icon('chevron', { size: 18, cls: 'link-go' })
);

async function renderLinks(p) {
  let active = 0;
  try {
    const list = await studentAssignments({ studentId: p.id || 'me', classId: p.classId, grade: p.grade });
    active = list.filter((x) => x.status !== STATUS.DONE).length;
  } catch { /* задания недоступны — ссылка остаётся */ }

  $('#studyLinks').replaceChildren(
    linkRow({ href: './tasks.html', ic: 'tasks', title: t('nav_tasks'), note: t('profile_tasks_note'), badge: active ? String(active) : null }),
    linkRow({ href: './play.html', ic: 'join', title: t('nav_join'), note: t('home_join_sub') }),
    linkRow({ href: './practice.html', ic: 'target', title: t('home_practice_title'), note: t('profile_practice_note') })
  );
  $('#settingsLinks').replaceChildren(...[
    SUPABASE.url ? linkRow({ href: './account.html', ic: 'cloud', title: t('acc_title'), note: t('profile_account_note') }) : null,
    linkRow({ href: './teacher.html', ic: 'teacher', title: t('home_teacher_cta'), note: t('profile_teacher_note') })
  ].filter(Boolean));
}

function renderLang() {
  const current = getLang();
  $('#langOptions').replaceChildren(...LANGS.map((l) => el('label', { class: 'pill-option' },
    el('input', {
      type: 'radio', name: 'lang', value: l.code, ...(l.code === current ? { checked: true } : {}),
      onchange: async () => { await setLang(l.code); location.reload(); }
    }),
    el('span', { lang: l.code }, LANG_NAMES[l.code] || l.code.toUpperCase())
  )));
}

(async function init() {
  await bootstrap();
  mountHeader($('#header'), { role: 'student', active: 'profile.html' });
  await migrateLegacy();

  const render = async () => {
    const [p, pr] = await Promise.all([getProfile(), getProgress()]);
    renderEditor(p);
    renderHead(p, pr);
    await renderLinks(p);
  };
  renderLang();
  await render();
  window.addEventListener('ba:synced', render);

  $('#saveProfileBtn').addEventListener('click', async () => {
    const name = $('#nameInput').value.trim();
    if (!name) { $('#nameInput').focus(); return toast(t('err_enter_name'), { icon: '⚠️' }); }
    await saveProfile({ name, avatar: draftAvatar });
    toast(t('profile_saved'), { icon: '✅' });
    await render();
    // Имя в шапке — тоже новое
    const link = document.querySelector('.profile-link');
    if (link) link.replaceChildren(avatar(draftAvatar, { size: 34, animated: false }), el('span', { class: 'profile-name' }, name));
  });
})();
