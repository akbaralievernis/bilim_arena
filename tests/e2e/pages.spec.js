// Каждая страница открывается без ошибок и без нарушений CSP — на трёх языках.
import { test, expect } from '@playwright/test';

const PAGES = ['index', 'games', 'practice', 'progress', 'profile', 'tasks', 'speak', 'account', 'race',
  'teacher', 'homework', 'questions', 'reports', 'board', 'play', 'privacy', 'terms'];
const GAMES = ['games/flashcards/index.html', 'games/word-match/index.html', 'games/wordle/index.html', 'games/word-rain/index.html',
  'games/balloons/index.html', 'games/sentence/index.html', 'games/odd-one-out/index.html', 'games/focus-duel/index.html',
  'games/citadel/index.html', 'games/mafia/index.html'];

/** Ошибки страницы: исключения, console.error, нарушения CSP */
function watch(page) {
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Камера в автотесте недоступна — это ожидаемо
    if (/camera|NotAllowedError|Permission/i.test(text)) return;
    problems.push(`console: ${text}`);
  });
  return problems;
}

for (const lang of ['ky', 'ru', 'en']) {
  test(`main pages open cleanly (${lang})`, async ({ page }) => {
    const problems = watch(page);
    await page.addInitScript((l) => localStorage.setItem('BA2_lang', JSON.stringify(l)), lang);
    for (const name of PAGES) {
      await page.goto(`/${name}.html`);
      await expect(page.locator('main, #app, body').first()).toBeVisible();
      await page.waitForTimeout(400);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      // Ничего не вылезает за ширину экрана
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${name}: horizontal overflow`).toBeLessThanOrEqual(1);
    }
    expect(problems).toEqual([]);
  });
}

test('standalone games open in English without errors', async ({ page }) => {
  const problems = watch(page);
  for (const path of GAMES) {
    await page.goto(`/${path}?lang=en`);
    await page.waitForTimeout(600);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  }
  expect(problems).toEqual([]);
});

test('phone layout: home page fits a 360 px screen', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const name of ['index', 'play', 'practice', 'teacher', 'reports']) {
    await page.goto(`/${name}.html`);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${name} at 360px`).toBeLessThanOrEqual(1);
  }
  await ctx.close();
});

test('tablet and small laptop: no horizontal scroll on main pages', async ({ browser }) => {
  for (const width of [768, 1024]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    for (const name of ['index', 'practice', 'teacher', 'board', 'questions', 'homework', 'reports', 'tasks']) {
      await page.goto(`/${name}.html`);
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${name} at ${width}px`).toBeLessThanOrEqual(1);
    }
    await ctx.close();
  }
});
