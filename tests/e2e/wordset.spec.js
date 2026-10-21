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

// Ссылку с набором слов может собрать кто угодно: текст не должен превращаться в разметку
test('teacher words: a crafted link cannot inject markup or script into the games', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { errors.push('dialog: ' + d.message()); d.dismiss(); });
  // Озвучка «есть» — тогда карточка рисует кнопку с data-t (там была дыра)
  await page.addInitScript(() => {
    localStorage.setItem('BA2_lang', '"ru"');
    window.speechSynthesis.getVoices = () => [{ lang: 'ru-RU', name: 'ru' }, { lang: 'en-US', name: 'en' }];
  });
  const evil = ['"onpointerover=alert(1) x="', '<img src=x onerror=alert(2)>', "it's"];
  const data = { n: '<b>x</b>', w: [['алма', evil[0], evil[0]], ['алмурут', evil[1], evil[2]]] };
  const b64 = Buffer.from(JSON.stringify(data)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  for (const game of ['flashcards', 'word-match', 'word-rain']) {
    await page.goto(`/games/${game}/index.html#w=${b64}`);
    const words = await page.evaluate(() => window.BA_VOCAB.words('x').map((w) => [w.ru, w.en]).flat());
    for (const w of words) expect(w).not.toMatch(/[<>"&]/);
    expect(words).toContain('it’s');
  }
  await page.goto(`/games/flashcards/index.html#w=${b64}`);
  await page.locator('#startBtn, button:has-text("Баштоо"), button:has-text("Начать")').first().click().catch(() => {});
  await page.locator('#card').click().catch(() => {});
  await page.locator('#bTr').hover().catch(() => {});
  expect(await page.locator('[onpointerover], [onerror], img[src="x"]').count()).toBe(0);
  // Путь с кнопкой озвучки действительно проверен: кнопки есть, текст в data-t целый
  expect(await page.locator('#bTr .say').count()).toBeGreaterThan(0);
  const said = await page.locator('#bTr .say').evaluateAll((els) => els.map((e) => e.dataset.t));
  expect(said.some((t) => t.includes('onpointerover=alert(1)'))).toBe(true);
  // Поддельные голоса теста браузер не может озвучить — эта ошибка к проверке не относится
  expect(errors.filter((e) => !/SpeechSynthesis/.test(e))).toEqual([]);
});
