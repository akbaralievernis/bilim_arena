/**
 * Bilim Arena — регистрация офлайн-кэша (sw.js) на страницах игр.
 * Страницы платформы регистрируют его в core/ui.js; здесь — для отдельных игр,
 * чтобы ученик, открывший игру по прямой ссылке, тоже получал свежие файлы.
 */
(function () {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  const s = document.currentScript;
  const url = s ? new URL('../sw.js', s.src) : null; // shared/sw-register.js → корень сайта
  if (url) navigator.serviceWorker.register(url.href, { updateViaCache: 'none' }).catch(() => {});
})();
