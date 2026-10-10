/**
 * Bilim Arena — запуск камеры в играх с руками (MediaPipe).
 *
 * MediaPipe при отказе показывает техническое окно alert на английском.
 * Здесь доступ проверяется заранее, а при ошибке ученик видит понятное
 * сообщение: что случилось, что сделать, и кнопки «Кайра аракет» / «Оюндар».
 *
 * BACamera.start(camera, { onReady, withoutCamera })
 *   camera        — объект Camera из @mediapipe/camera_utils
 *   onReady       — вызывается, когда камера заработала
 *   withoutCamera — { label, onClick }: если игру можно продолжить без камеры
 */
(function () {
  'use strict';

  const MESSAGES = {
    denied: ['Камерага уруксат берилген жок',
      'Оюн колуңду камера аркылуу көрөт. Дарек тилкесиндеги камера белгисин басып, «Уруксат берүү» тандаңыз, анан «Кайра аракет» баскычын басыңыз.'],
    notfound: ['Камера табылган жок', 'Түзмөктө камера бар экенин жана ал туташтырылганын текшериңиз.'],
    busy: ['Камера бош эмес', 'Камераны башка программа (Zoom, Teams ж.б.) же башка өтмөк колдонуп жатат. Аны жаап, кайра аракет кылыңыз.'],
    insecure: ['Камера коопсуз байланышта гана иштейт', 'Сайтты https:// аркылуу ачыңыз.'],
    unsupported: ['Бул браузер камераны колдобойт', 'Chrome, Edge же Safari браузеринин жаңы версиясын колдонуңуз.'],
    other: ['Камера иштеген жок', 'Баракты жаңыртып, кайра аракет кылыңыз.']
  };

  function reasonOf(err) {
    const name = (err && err.name) || '';
    if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
    if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') return 'notfound';
    if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
    return 'other';
  }

  const CAMERA_OFF = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M9.5 6H14l1.5 2H19a2 2 0 0 1 2 2v7M17 19H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1"/><circle cx="12" cy="13" r="3"/></svg>';

  function backHref() {
    const a = document.querySelector('a.ba-back, a[href$="games.html"]');
    return a ? a.getAttribute('href') : '../../games.html';
  }

  const L = window.BALang;
  if (L) L.add({
    'Камерага уруксат берилген жок': ['Нет доступа к камере', 'Camera access was not allowed'],
    'Оюн колуңду камера аркылуу көрөт. Дарек тилкесиндеги камера белгисин басып, «Уруксат берүү» тандаңыз, анан «Кайра аракет» баскычын басыңыз.':
      ['Игра видит руку через камеру. Нажмите значок камеры в адресной строке, выберите «Разрешить», затем нажмите «Ещё раз».',
       'The game sees your hand through the camera. Click the camera icon in the address bar, choose “Allow”, then press “Try again”.'],
    'Камера табылган жок': ['Камера не найдена', 'No camera found'],
    'Түзмөктө камера бар экенин жана ал туташтырылганын текшериңиз.': ['Проверьте, что у устройства есть камера и она подключена.', 'Check that the device has a camera and that it is connected.'],
    'Камера бош эмес': ['Камера занята', 'The camera is busy'],
    'Камераны башка программа (Zoom, Teams ж.б.) же башка өтмөк колдонуп жатат. Аны жаап, кайра аракет кылыңыз.':
      ['Камеру использует другая программа (Zoom, Teams и т. п.) или другая вкладка. Закройте её и попробуйте ещё раз.',
       'Another program (Zoom, Teams, etc.) or another tab is using the camera. Close it and try again.'],
    'Камера коопсуз байланышта гана иштейт': ['Камера работает только по защищённому соединению', 'The camera works only over a secure connection'],
    'Сайтты https:// аркылуу ачыңыз.': ['Откройте сайт через https://.', 'Open the site over https://.'],
    'Бул браузер камераны колдобойт': ['Этот браузер не поддерживает камеру', 'This browser does not support the camera'],
    'Chrome, Edge же Safari браузеринин жаңы версиясын колдонуңуз.': ['Используйте свежую версию Chrome, Edge или Safari.', 'Use a recent version of Chrome, Edge or Safari.'],
    'Камера иштеген жок': ['Камера не заработала', 'The camera did not start'],
    'Баракты жаңыртып, кайра аракет кылыңыз.': ['Обновите страницу и попробуйте ещё раз.', 'Reload the page and try again.'],
    'Кайра аракет': ['Ещё раз', 'Try again'],
    'Оюндар': ['Игры', 'Games']
  });
  const T = (s) => (L ? L.t(s) : s);

  function showError(reason, retry, withoutCamera) {
    hideError();
    const [title, text] = (MESSAGES[reason] || MESSAGES.other).map(T);
    const box = document.createElement('div');
    box.id = 'ba-camera-error';
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'ba-cam-title');
    box.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(16,24,40,.55);font-family:Inter,system-ui,sans-serif';
    const btn = 'min-height:48px;padding:0 18px;border-radius:14px;font:700 15px/1 Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center';
    box.innerHTML =
      '<div style="max-width:420px;width:100%;background:#fff;color:#202B46;border-radius:20px;padding:24px;box-shadow:0 12px 24px rgba(16,24,40,.18);text-align:center">' +
        '<div style="width:64px;height:64px;margin:0 auto 12px;border-radius:18px;display:grid;place-items:center;background:#FDECEC;color:#C62828">' + CAMERA_OFF + '</div>' +
        '<h2 id="ba-cam-title" style="margin:0 0 8px;font-size:20px;font-weight:800;line-height:1.3">' + title + '</h2>' +
        '<p style="margin:0 0 20px;color:#667085;font-size:15px;line-height:1.5">' + text + '</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">' +
          '<button type="button" data-act="retry" style="' + btn + ';border:0;background:#635BFF;color:#fff">' + T('Кайра аракет') + '</button>' +
          (withoutCamera ? '<button type="button" data-act="without" style="' + btn + ';border:1px solid #E4E7EC;background:#fff;color:#202B46">' + T(withoutCamera.label) + '</button>' : '') +
          '<a href="' + backHref() + '" style="' + btn + ';border:1px solid #E4E7EC;background:#fff;color:#202B46">' + T('Оюндар') + '</a>' +
        '</div>' +
      '</div>';
    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'retry') { hideError(); retry(); }
      if (act === 'without') { hideError(); withoutCamera.onClick(); }
    });
    document.body.appendChild(box);
    box.querySelector('[data-act="retry"]').focus();
  }

  function hideError() {
    const old = document.getElementById('ba-camera-error');
    if (old) old.remove();
  }

  async function start(camera, opts) {
    const o = opts || {};
    const retry = () => start(camera, o);

    if (!window.isSecureContext) return showError('insecure', retry, o.withoutCamera);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return showError('unsupported', retry, o.withoutCamera);

    // Сначала спрашиваем доступ сами: так причина отказа известна точно
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.warn('[camera]', err && err.name);
      return showError(reasonOf(err), retry, o.withoutCamera);
    }

    // MediaPipe при сбое вызывает alert — на время запуска заменяем его тихой записью в консоль
    const nativeAlert = window.alert;
    window.alert = (msg) => console.warn('[camera]', msg);
    try {
      await camera.start();
      if (o.onReady) o.onReady();
    } catch (err) {
      console.warn('[camera]', err && (err.name || err));
      showError(reasonOf(err), retry, o.withoutCamera);
    } finally {
      window.alert = nativeAlert;
    }
  }

  window.BACamera = { start, showError, hideError };
})();
