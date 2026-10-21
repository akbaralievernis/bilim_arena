// Свои слова учителя: wordset.html → ссылка/QR → языковая игра открывается с этими словами.
import { test, expect } from '@playwright/test';

test('teacher words: links and QR, a game opens with exactly those words', async ({ page, browser }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await page.goto('/wordset.html');
  await page.locator('#wsName').fill('Фрукты');
  await page.locator('#wsWords').fill('алма — яблоко — apple\nалмурут — груша — pear\nжүзүм = виноград = grapes\nкаун | дыня | melon\nплохая строка');
  await expect(page.locator('#wsStatus')).toContainText('слов: 4');
  await expect(page.locator('#wsStatus')).toContainText('5');
  await page.locator('#wsMake').click();
  await expect(page.locator('#wsGames .ws-game')).toHaveCount(5);
  await expect(page.locator('#wsQr svg')).toBeVisible();
  await page.locator('#wsGames .ws-game', { hasText: 'Найди пару' }).click();
  const url = await page.locator('#wsUrl').inputValue();
  expect(url).toContain('games/word-match/index.html#w=');
  await page.locator('#wsSave').click();
  await expect(page.locator('#wsSavedList')).toContainText('Фрукты');

  // Ученик открывает ссылку на своём телефоне
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
  const phone = await ctx.newPage();
  const phoneErrors = [];
  phone.on('pageerror', (e) => phoneErrors.push(e.message));
  await phone.goto(url);
  await expect(phone.locator('#baTeacherSet')).toContainText('Фрукты');
  const words = await phone.evaluate(() => window.BA_VOCAB.words('animals').map((w) => w.ky));
  expect(words.sort()).toEqual(['алма', 'алмурут', 'жүзүм', 'каун']);
  await ctx.close();
  expect([...errors, ...phoneErrors]).toEqual([]);
});
