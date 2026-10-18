// Офлайн: сайт открыли один раз с интернетом → интернет пропал → всё нужное работает.
import { test, expect } from '@playwright/test';

/** Первый заход: ждём, пока офлайн-кэш заполнится */
async function warmUp(page) {
  await page.goto('/index.html');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const deadline = Date.now() + 60_000;
    for (;;) {
      const name = (await caches.keys()).find((k) => k.startsWith('ba-v'));
      const n = name ? (await (await caches.open(name)).keys()).length : 0;
      if (n >= 150 || Date.now() > deadline) return n;
      await new Promise((r) => setTimeout(r, 300));
    }
  });
  await page.reload(); // теперь страница под управлением service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test('without internet: practice, tests, print, scanner and reports work; the board explains', async ({ page, context }) => {
  test.setTimeout(150_000);
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await warmUp(page);

  const t0 = Date.now();
  const lap = (what) => console.log(`offline: ${what} at ${Date.now() - t0} ms`);
  await context.setOffline(true);
  await page.goto('/index.html');
  lap('index');
  await expect(page.locator('#offlineBar')).toBeVisible();
  await expect(page.locator('#offlineBar')).toContainText('Нет интернета');

  // Практика: раунд целиком без сети, ответ сохраняется на устройстве
  await page.goto('/practice.html?topic=math-6-fractions');
  await page.locator('#startBtn').click();
  await expect(page.locator('#counter')).toHaveText('1 / 10');
  await page.locator('#options .option').first().click();
  await expect(page.locator('#counter')).toHaveText('2 / 10', { timeout: 10_000 });

  lap('practice');
  // Тест учителя → печать → сканер
  await page.goto('/tests.html');
  await page.locator('#createBtn').click();
  await page.locator('#tSubject').selectOption('math');
  await page.locator('#tTopic').selectOption('math-6-fractions');
  await page.locator('#randomBtn').click();
  await page.locator('#saveBtn').click();
  await page.locator('#testList a', { hasText: 'Распечатать' }).click();
  await expect(page.locator('.p-omr svg').first()).toBeVisible();
  await page.goto('/scan.html');
  await expect(page.locator('#camBtn')).toBeVisible();

  lap('tests, print, scan');
  for (const p of ['/teacher.html', '/reports.html', '/progress.html', '/games/wordle/index.html?lang=ru']) {
    await page.goto(p);
    await expect(page.locator('body')).not.toBeEmpty();
  }

  lap('other pages');
  // Урок с телефонами без интернета невозможен — доска говорит это сразу
  await page.goto('/board.html?subject=math&topic=math-5-numbers');
  await page.locator('#startLessonBtn').click();
  await expect(page.locator('#toasts')).toContainText('нужен интернет');

  await context.setOffline(false);
  await page.goto('/index.html');
  await expect(page.locator('#offlineBar')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('very slow internet: pages open from the cache instead of hanging', async ({ page, context }) => {
  test.setTimeout(120_000);
  await warmUp(page);
  // Каждый запрос к сайту «висит» 8 секунд
  await context.route('**/*', async (route) => {
    if (new URL(route.request().url()).hostname === 'localhost') await new Promise((r) => setTimeout(r, 8000));
    await route.continue().catch(() => {});
  });
  const t0 = Date.now();
  await page.goto('/practice.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#subjectChips .chip').first()).toBeVisible({ timeout: 30_000 });
  const ms = Date.now() - t0;
  console.log(`slow network: practice.html usable after ${ms} ms`);
  expect(ms).toBeLessThan(16_000);
});
