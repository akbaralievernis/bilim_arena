/**
 * Bilim Arena — аккаунт.
 *
 * Ученик: код класса + имя (анонимный вход, почта не нужна).
 * Учитель: почта + пароль. Без настроенного облака страница объясняет,
 * что данные хранятся на этом устройстве.
 */

import { bootstrap, mountHeader, $, toast } from './core/ui.js';
import { t } from './core/i18n.js';
import { getProfile } from './core/profile.js';
import { SUPABASE } from './core/config.js';

let cloud = null;
let signUpMode = false;

const show = (id) => ['localScreen', 'signedOutScreen', 'signedInScreen']
  .forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));

/** Понятные сообщения вместо технических ошибок Supabase */
function errorText(e) {
  const m = String(e?.message || e);
  if (/class_not_found/.test(m)) return t('acc_err_code');
  if (/name_required/.test(m)) return t('err_enter_name');
  if (/Invalid login credentials/i.test(m)) return t('acc_err_login');
  if (/already registered/i.test(m)) return t('acc_err_exists');
  if (/Email not confirmed/i.test(m)) return t('acc_err_confirm');
  if (/Anonymous sign-ins are disabled/i.test(m)) return t('acc_err_anon_off');
  if (/Password should be|password/i.test(m)) return t('acc_err_password');
  if (/teacher_signed_in/.test(m)) return t('acc_err_teacher_session');
  if (/unsynced/.test(m)) return t('acc_err_unsynced');
  if (/fetch|network|Failed to/i.test(m)) return t('acc_err_network');
  return t('acc_err_generic');
}

async function busy(btn, fn) {
  btn.disabled = true;
  try { await fn(); } catch (e) { console.warn('[account]', e); toast(errorText(e), { icon: '⚠️', ms: 5000 }); } finally { btn.disabled = false; }
}

async function render() {
  if (!cloud) return show('localScreen');
  const user = await cloud.currentUser().catch(() => null);
  if (!user) {
    show('signedOutScreen');
    $('#teacherNameField').classList.toggle('hidden', !signUpMode);
    $('#teacherSubmit').textContent = t(signUpMode ? 'acc_sign_up' : 'acc_sign_in');
    $('#toggleSignUp').textContent = t(signUpMode ? 'acc_have_account' : 'acc_no_account');
    $('#passwordInput').autocomplete = signUpMode ? 'new-password' : 'current-password';
    return;
  }

  show('signedInScreen');
  const p = await getProfile();
  const student = user.is_anonymous;
  $('#whoName').textContent = p.name || '—';
  $('#whoRole').textContent = student
    ? `${t('role_student')}${p.className ? ' · ' + p.className : ''}`
    : `${t('role_teacher')} · ${user.email || ''}`;
  $('#joinMoreForm').classList.toggle('hidden', !student);
  renderStatus(cloud.cloudStatus());
}

async function renderStatus(s) {
  $('#syncState').textContent = t('acc_state_' + (s.state || 'idle'));
  const last = await cloud.lastSyncAt();
  $('#lastSync').textContent = last ? t('acc_last_sync', { time: new Date(last).toLocaleString() }) : '';
}

(async function init() {
  await bootstrap();
  const p = await getProfile();
  mountHeader($('#header'), { role: p.role === 'teacher' ? 'teacher' : 'student', active: 'account.html' });

  if (SUPABASE.url && SUPABASE.anonKey) {
    try { cloud = await import('./core/cloud.js'); } catch (e) { console.warn('[account]', e); }
  }

  // Ссылка от учителя: account.html?code=ABC123
  const code = new URLSearchParams(location.search).get('code');
  if (code) $('#codeInput').value = code.toUpperCase().slice(0, 6);
  if (p.name) $('#studentName').value = p.name;

  document.querySelectorAll('.code-input').forEach((input) =>
    input.addEventListener('input', () => { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }));

  $('#studentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    busy(e.submitter || $('#studentForm button'), async () => {
      const cls = await cloud.studentJoin({ code: $('#codeInput').value, name: $('#studentName').value });
      toast(t('acc_joined', { name: cls.class_name }), { icon: '✅' });
      await render();
    });
  });

  $('#toggleSignUp').addEventListener('click', () => { signUpMode = !signUpMode; render(); });

  $('#teacherForm').addEventListener('submit', (e) => {
    e.preventDefault();
    busy($('#teacherSubmit'), async () => {
      const email = $('#emailInput').value.trim();
      const password = $('#passwordInput').value;
      if (signUpMode) {
        const res = await cloud.teacherSignUp({ email, password, name: $('#teacherName').value.trim() });
        if (res.needsConfirmation) return toast(t('acc_check_email'), { icon: '📧', ms: 8000 });
      } else {
        await cloud.teacherSignIn({ email, password });
      }
      $('#passwordInput').value = '';
      toast(t('acc_welcome'), { icon: '✅' });
      await render();
    });
  });

  $('#joinMoreForm').addEventListener('submit', (e) => {
    e.preventDefault();
    busy(e.submitter || $('#joinMoreForm button'), async () => {
      const p2 = await getProfile();
      const cls = await cloud.studentJoin({ code: $('#moreCode').value, name: p2.name });
      $('#moreCode').value = '';
      toast(t('acc_joined', { name: cls.class_name }), { icon: '✅' });
      await render();
    });
  });

  $('#syncBtn').addEventListener('click', (e) => busy(e.currentTarget, async () => {
    await cloud.syncAll();
    const s = cloud.cloudStatus();
    if (s.state === 'error' || s.state === 'offline') throw new Error(s.error || 'network');
    toast(t('acc_state_ok'), { icon: '☁️' });
  }));

  $('#signOutBtn').addEventListener('click', (e) => busy(e.currentTarget, async () => {
    if (!confirm(t('acc_sign_out_confirm'))) return;
    try {
      await cloud.signOut();
    } catch (err) {
      if (!/unsynced/.test(String(err?.message))) throw err;
      if (!confirm(t('acc_err_unsynced'))) return;
      await cloud.signOut({ force: true });
    }
    toast(t('acc_signed_out'), { icon: '👋' });
    await render();
  }));

  window.addEventListener('ba:cloud-status', (e) => { if (!$('#signedInScreen').classList.contains('hidden')) renderStatus(e.detail); });
  window.addEventListener('ba:synced', render);
  await render();
})();
