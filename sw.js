/* Билим Арена — офлайн кэш. Файлдар өзгөргөндө VERSION'ду көбөйтүңүз. */
const VERSION = 'ba-v6';
const CORE = [
  './', './index.html', './home.css', './home.js',
  './board.html', './board.js', './play.html', './play.js',
  './teacher.html', './teacher.js', './progress.html', './progress.js',
  './practice.html', './practice.js',
  './manifest.webmanifest', './assets/logo.svg',
  // Ядро платформы
  './core/ui.css', './core/board.css', './core/ui.js', './core/i18n.js',
  './core/store.js', './core/profile.js', './core/curriculum.js',
  './core/progress.js', './core/engine.js', './core/realtime.js',
  './locales/ky.js', './locales/ru.js', './locales/en.js',
  './games/quickvote/game.js', './games/territory/game.js',
  // Банки вопросов
  './data/questions/math-6-fractions.js',
  './data/questions/kyrgyz-6-parts-of-speech.js',
  './data/questions/english-5-basics.js',
  './data/questions/kg-history-8-independence.js',
  './data/questions/informatics-7-algorithms.js',
  // Прежние игры — продолжают работать офлайн
  './shared/ui.css', './shared/game.css', './shared/vocab.js',
  './shared/progress.js', './shared/game-shell.js',
  './games/flashcards/index.html', './games/word-match/index.html',
  './games/wordle/index.html', './games/word-rain/index.html',
  './games/balloons/index.html', './games/mafia/index.html'
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
