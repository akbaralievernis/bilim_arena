/**
 * Автотесты интерфейса в настоящем браузере (Chrome, установленный на компьютере).
 *   npm run test:e2e
 * Сайт поднимается на :8765, сервер знакомства (signal/) — на :8787.
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8765',
    channel: 'chrome',
    headless: true,
    serviceWorkers: 'block'   // кэш офлайн-режима не должен подменять свежие файлы
  },
  projects: [
    // Страницы — с настоящей Content-Security-Policy
    { name: 'pages', testMatch: /pages\.spec\.js/ },
    // Урок и конструктор: телефоны говорят с локальным сервером знакомства,
    // которого нет в CSP сайта, поэтому CSP здесь отключена
    { name: 'classroom', testMatch: /(classroom|import)\.spec\.js/, use: { bypassCSP: true } }
  ],
  webServer: [
    { command: 'python -m http.server 8765', url: 'http://localhost:8765/index.html', reuseExistingServer: true, timeout: 30_000 },
    { command: 'npm --prefix signal run dev', url: 'http://127.0.0.1:8787/health', reuseExistingServer: true, timeout: 120_000 }
  ]
});
