/* Билим Арена — офлайн кэш. Файлдар өзгөргөндө VERSION'ду көбөйтүңүз. */
const VERSION = 'ba-v5';
const CORE = [
  './', './index.html', './portal.css', './portal.js', './manifest.webmanifest',
  './shared/ui.css', './shared/game.css', './shared/vocab.js', './shared/progress.js', './shared/game-shell.js',
  './assets/logo.svg',
  './games/flashcards/index.html', './games/word-match/index.html', './games/wordle/index.html',
  './games/word-rain/index.html', './games/balloons/index.html',
  './games/mafia/index.html'
];

self.addEventListener('install', (e) => {
  // cache: 'reload' — берём файлы с сервера, а не из старого кэша браузера
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Тармак биринчи, болбосо кэштен (жаңы версиялар дароо көрүнөт)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname.includes('fonts.g');
  if (!sameOrigin && !isFont) return; // MediaPipe, CDN ж.б. — браузердин өзүнө калтырабыз

  // no-cache: браузердин HTTP кэшин айланып өтүп, серверден жаңы версияны текшерет
  e.respondWith(
    (sameOrigin ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req))
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
