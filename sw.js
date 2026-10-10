/* Билим Арена — офлайн кэш. Файлдар өзгөргөндө VERSION'ду көбөйтүңүз.
 *
 * Стратегия: «сначала сеть». Каждый запрос к сайту идёт на сервер с проверкой
 * свежести (cache: 'no-cache'), кэш — только запасной вариант без интернета.
 * Поэтому после обновления сайта ученик сразу получает новые файлы.
 * Прогресс, XP и данные Supabase хранятся в localStorage/облаке — кэш их не трогает.
 */
const PREFIX = 'ba-';
const VERSION = 'ba-v23';
const CORE = [
  './', './index.html', './home.css', './home.js',
  './board.html', './board.js', './play.html', './play.js',
  './teacher.html', './teacher.js', './progress.html', './progress.js',
  './practice.html', './practice.js',
  './tasks.html', './tasks.js', './homework.html', './homework.js',
  './questions.html', './questions.js', './speak.html', './speak.js', './account.html', './account.js', './games.html', './games.js', './profile.html', './profile.js', './race.html', './race.js',
  './manifest.webmanifest', './assets/logo.svg', './assets/icon-192.png', './assets/icon-512.png',
  './assets/icon-maskable-512.png', './assets/apple-touch-icon.png',
  // Ядро платформы
  './core/ui.css', './core/board.css', './core/ui.js', './core/i18n.js',
  './core/store.js', './core/profile.js', './core/curriculum.js',
  './core/progress.js', './core/engine.js', './core/realtime.js',
  './core/questions.js', './core/assignments.js', './core/quiz-ui.js', './core/sync.js', './core/speech.js', './core/config.js', './core/cloud.js', './core/icons.js', './core/art.js', './core/catalog.js', './core/results.js', './core/race.js', './core/turn.js',
  './locales/ky.js', './locales/ru.js', './locales/en.js',
  './games/quickvote/game.js', './games/territory/game.js',
  './games/investigation/game.js', './games/errorhunt/game.js', './games/timeline/game.js', './games/codelock/game.js', './games/formula/game.js', './games/city/game.js', './games/lab/game.js',
  './data/investigations/index.js', './data/investigations/case-001-museum.js',
  // Банки вопросов
  './data/questions/math-6-fractions.js',
  './data/questions/kyrgyz-6-parts-of-speech.js',
  './data/questions/english-5-basics.js',
  './data/questions/kg-history-8-independence.js',
  './data/questions/informatics-7-algorithms.js',
  './data/questions/math-5-numbers.js',
  './data/questions/geography-7-kyrgyzstan.js',
  './data/speaking/index.js',
  './data/labs/index.js', './data/games.js',
  './data/questions/biology-6-plants.js',
  './data/questions/chemistry-8-basics.js',
  './data/questions/economics-10-basics.js',
  './data/questions/finance-8-budget.js',
  './data/questions/kyrgyz-lit-7-manas.js',
  './data/questions/physics-7-mechanics.js',
  './data/questions/russian-5-noun.js',
  './data/questions/russian-lit-6-classics.js',
  './data/questions/social-9-state.js',
  './data/questions/world-history-5-ancient.js',
  // Прежние игры — продолжают работать офлайн
  './shared/game.css', './shared/vocab.js', './shared/sw-register.js', './shared/camera.js',
  './shared/progress.js', './shared/game-shell.js',
  './games/flashcards/index.html', './games/word-match/index.html',
  './games/wordle/index.html', './games/word-rain/index.html',
  './games/balloons/index.html', './games/mafia/index.html',
  './games/citadel/index.html', './games/citadel/app.js', './games/citadel/style.css',
  './games/eagle/index.html', './games/reaction/index.html',
  './games/focus-duel/index.html', './games/focus-duel/focus-duel.js', './games/focus-duel/data.js', './games/focus-duel/style.css',
  './games/odd-one-out/index.html', './games/odd-one-out/app.js', './games/odd-one-out/style.css', './games/odd-one-out/questions.json',
  './games/sentence/index.html', './games/sentence/app.js', './games/sentence/style.css'
];

self.addEventListener('install', (e) => {
  // cache: 'reload' — берём файлы с сервера, а не из старого кэша браузера.
  // Файлы добавляются по одному: если какого-то нет, новая версия всё равно
  // установится (addAll отменил бы всю установку и оставил старую версию).
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(CORE.map((u) =>
        c.add(new Request(u, { cache: 'reload' })).catch((err) => console.warn('[sw] не закэширован', u, err && err.message)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // Удаляем только свои прошлые версии — чужие кэши и данные ученика не трогаем
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k))))
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
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
