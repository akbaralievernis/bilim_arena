/**
 * Автотесты интерфейса в настоящем браузере (Chrome, установленный на компьютере).
 *   npm run test:e2e
 * Сайт поднимается на :8766 (tests/e2e/serve.mjs), сервер знакомства (signal/) — на :8787.
 */
import { defineConfig } from '@playwright/test';

// Обычно — Chrome, установленный на компьютере. В облачной среде без него:
// PW_CHROME_PATH=/путь/к/chromium npm run test:e2e
const chrome = process.env.PW_CHROME_PATH
  ? { launchOptions: { executablePath: process.env.PW_CHROME_PATH } }
  : { channel: 'chrome' };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8766',
    headless: true,
    serviceWorkers: 'block',  // кэш офлайн-режима не должен подменять свежие файлы
    trace: 'retain-on-failure' // запись шагов упавшего теста: npx playwright show-trace test-results/…/trace.zip
  },
  projects: [
    // Страницы — с настоящей Content-Security-Policy
    { name: 'pages', testMatch: /(pages|learning|teacher-tests|omr|scan-page|excel|images|parent-report|multi-topic|cycles|a11y|a11y-games)\.spec\.js/, use: { ...chrome } },
    // Урок и конструктор: телефоны говорят с локальным сервером знакомства,
    // которого нет в CSP сайта, поэтому CSP здесь отключена
    { name: 'classroom', testMatch: /(classroom|import|mafia|games-board)\.spec\.js/, use: { ...chrome, bypassCSP: true } },
    // Офлайн: здесь service worker включён (в остальных проектах он выключен)
    { name: 'offline', testMatch: /offline\.spec\.js/, use: { ...chrome, serviceWorkers: 'allow' } },
    // Те же страницы в движках Safari и Firefox — по явному запросу:
    // npx playwright test --project=webkit --project=firefox
    { name: 'webkit', testMatch: /(pages|learning|teacher-tests|omr|scan-page|excel|images|parent-report|multi-topic)\.spec\.js/, use: { browserName: 'webkit' } },
    { name: 'firefox', testMatch: /(pages|learning|teacher-tests|omr|scan-page|excel|images|parent-report|multi-topic)\.spec\.js/, use: { browserName: 'firefox' } },
    // Скорость на слабом телефоне и 3G — только по явному запросу: npx playwright test --project=perf
    { name: 'perf', testMatch: /perf\.spec\.js/, use: { ...chrome } },
    // Нагрузка — только по явному запросу: npx playwright test --project=load
    { name: 'load', testMatch: /load\.spec\.js/, use: { ...chrome, bypassCSP: true } }
  ],
  webServer: [
    { command: 'node tests/e2e/serve.mjs . 8766', url: 'http://localhost:8766/index.html', reuseExistingServer: true, timeout: 30_000 },
    { command: 'npm --prefix signal run dev', url: 'http://127.0.0.1:8787/health', reuseExistingServer: true, timeout: 120_000 }
  ]
});
