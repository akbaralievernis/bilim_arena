/* Билим Арена — офлайн кэш. Файлдар өзгөргөндө VERSION'ду көбөйтүңүз.
 *
 * Стратегия: «сначала сеть». Каждый запрос к сайту идёт на сервер с проверкой
 * свежести (cache: 'no-cache'), кэш — запасной вариант без интернета.
 * Поэтому после обновления сайта ученик сразу получает новые файлы.
 * Медленная сеть (есть связь, но ответа нет дольше NET_TIMEOUT) — отдаём кэш,
 * а свежий файл докачивается в фоне и пригодится в следующий раз.
 * Прогресс, XP и данные Supabase хранятся в localStorage/облаке — кэш их не трогает.
 */
const PREFIX = 'ba-';
const VERSION = 'ba-v51';
const CORE = [
  './', './index.html', './home.css', './home.js',
  './board.html', './board.js', './play.html', './play.js',
  './teacher.html', './teacher.js', './progress.html', './progress.js',
  './practice.html', './practice.js',
  './tasks.html', './tasks.js', './homework.html', './homework.js',
  './questions.html', './questions.js', './speak.html', './speak.js', './account.html', './account.js', './games.html', './games.js', './profile.html', './profile.js', './race.html', './race.js', './reports.html', './reports.js', './reports.css', './privacy.html', './terms.html', './legal.js', './data/legal.js', './tests.html', './tests.js', './print.html', './print.js', './print.css', './scan.html', './scan.js', './scan.css', './report.html', './report.js',
  './manifest.webmanifest', './assets/logo.svg', './assets/icon-192.png', './assets/icon-512.png',
  './assets/icon-maskable-512.png', './assets/apple-touch-icon.png',
  // Шрифты сайта (раньше — Google Fonts)
  './assets/fonts/fonts.css',
  './assets/fonts/inter-latin.woff2', './assets/fonts/inter-latin-ext.woff2', './assets/fonts/inter-cyrillic.woff2', './assets/fonts/inter-cyrillic-ext.woff2',
  './assets/fonts/montserrat-latin.woff2', './assets/fonts/montserrat-latin-ext.woff2', './assets/fonts/montserrat-cyrillic.woff2', './assets/fonts/montserrat-cyrillic-ext.woff2',
  './assets/fonts/jetbrains-mono-latin.woff2', './assets/fonts/jetbrains-mono-latin-ext.woff2', './assets/fonts/jetbrains-mono-cyrillic.woff2', './assets/fonts/jetbrains-mono-cyrillic-ext.woff2',
  // Ядро платформы
  './core/ui.css', './core/board.css', './core/ui.js', './core/i18n.js',
  './core/store.js', './core/profile.js', './core/curriculum.js',
  './core/progress.js', './core/engine.js', './core/realtime.js',
  './core/questions.js', './core/assignments.js', './core/quiz-ui.js', './core/sync.js', './core/speech.js', './core/config.js', './core/cloud.js', './core/icons.js', './core/art.js', './core/catalog.js', './core/results.js', './core/race.js', './core/turn.js', './core/import.js', './core/lessons.js', './core/merge.js', './core/errors.js', './core/selection.js', './core/duplicates.js', './core/mastery.js', './core/tests.js', './core/omr.js', './core/xlsx.js', './core/images.js', './core/parent-report.js', './core/report-export.js', './core/cycles.js', './core/fx.js',
  // Оюндардын иллюстрациялары
  './assets/art/games/balloons.svg', './assets/art/games/build-3d.svg', './assets/art/games/citadel.svg', './assets/art/games/city.svg', './assets/art/games/codelock.svg', './assets/art/games/eagle.svg', './assets/art/games/errorhunt.svg', './assets/art/games/flashcards.svg', './assets/art/games/focus.svg', './assets/art/games/formula.svg', './assets/art/games/hand-shooter.svg', './assets/art/games/investigation.svg', './assets/art/games/lab.svg', './assets/art/games/mafia.svg', './assets/art/games/neon-draw.svg', './assets/art/games/odd.svg', './assets/art/games/quickvote.svg', './assets/art/games/race.svg', './assets/art/games/reaction.svg', './assets/art/games/sentence.svg', './assets/art/games/speak.svg', './assets/art/games/territory.svg', './assets/art/games/timeline.svg', './assets/art/games/word-match.svg', './assets/art/games/word-rain.svg', './assets/art/games/wordle.svg', './assets/art/cat/camera.svg', './assets/art/cat/languages.svg', './assets/art/cat/logic.svg', './assets/art/cat/team.svg',
  './vendor/peerjs-1.5.5.min.js', './vendor/qrcode-generator-1.4.4.js', './vendor/supabase-js-2.117.3.js', './vendor/canvas-confetti-1.6.0.js',
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
  './games/balloons/index.html', './games/mafia/index.html', './games/mafia/favicon.svg',
  './games/citadel/index.html', './games/citadel/app.js', './games/citadel/style.css', './games/citadel/data.js', './games/citadel/i18n.js',
  './games/eagle/index.html', './games/reaction/index.html',
  './games/focus-duel/index.html', './games/focus-duel/focus-duel.js', './games/focus-duel/data.js', './games/focus-duel/style.css', './games/focus-duel/i18n.js',
  './games/odd-one-out/index.html', './games/odd-one-out/app.js', './games/odd-one-out/style.css', './games/odd-one-out/data.js', './games/odd-one-out/i18n.js',
  './games/sentence/index.html', './games/sentence/app.js', './games/sentence/style.css',
  // Переводы отдельных игр и игры с камерой
  './shared/lang.js', './games/flashcards/i18n.js', './games/word-match/i18n.js', './games/wordle/i18n.js', './games/word-rain/i18n.js', './games/balloons/i18n.js', './games/sentence/i18n.js', './games/eagle/i18n.js', './games/reaction/i18n.js', './web/neon-draw.html', './web/neon-draw.i18n.js', './web/hand-shooter.html', './web/hand-shooter.i18n.js', './web/build-3d.html', './web/build-3d.i18n.js'
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

const NET_TIMEOUT = 3500;
/** После первого «зависания» сети несколько минут отвечаем из кэша сразу (сеть обновляет его в фоне) */
const SLOW_MODE_MS = 3 * 60 * 1000;
let slowUntil = 0;

// Тармак биринчи, болбосо кэштен (жаңы версиялар дароо көрүнөт)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return; // MediaPipe, CDN ж.б. — браузердин өзүнө калтырабыз (шрифты теперь свои)

  // no-cache: браузердин HTTP кэшин айланып өтүп, серверден жаңы версияны текшерет
  const net = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
    .then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    });
  const fallback = () => caches.match(req, { ignoreSearch: true })
    .then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));

  e.respondWith((async () => {
    try {
      if (Date.now() < slowUntil) {
        // Режим медленной сети: страница не ждёт каждый файл по несколько секунд
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
      }
      const started = Date.now();
      const first = await Promise.race([net, new Promise((r) => setTimeout(r, NET_TIMEOUT, 'slow'))]);
      if (first !== 'slow') {
        if (Date.now() - started < 1500) slowUntil = 0; // сеть снова быстрая
        return first;
      }
      // Связь есть, но очень медленная: кэш сейчас, сеть обновит его в фоне
      slowUntil = Date.now() + SLOW_MODE_MS;
      const cached = await caches.match(req, { ignoreSearch: true });
      return cached || await net;
    } catch {
      return fallback();
    }
  })());
  e.waitUntil(net.catch(() => {}));
});
