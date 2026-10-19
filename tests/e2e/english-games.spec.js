// Три игры по английскому в браузере: каталог, полный цикл, клавиатура/мышь/касание,
// режимы без звука и без микрофона, три языка интерфейса, прогресс без двойного начисления.
import { test, expect } from '@playwright/test';

const progress = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('BA2_progress') || '{}'));
const lang = (l) => (page) => page.addInitScript((x) => localStorage.setItem('BA2_lang', JSON.stringify(x)), l);

test('catalog: the three games are listed for English and found by search', async ({ page }) => {
  await lang('ru')(page);
  await page.goto('/games.html');
  for (const name of ['English City', 'Story Lab', 'Picture Detective']) {
    await expect(page.getByRole('link', { name: new RegExp(name) }).first()).toBeVisible();
  }
  const href = await page.getByRole('link', { name: /Story Lab/ }).first().getAttribute('href');
  expect(href).toContain('games/story-lab/index.html');
});

test('English City: keyboard, mouse drag and touch; result saved once; works without audio', async ({ page, browser }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => { localStorage.setItem('BA2_lang', '"ru"'); delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; });
  await page.goto('/games/english-city/index.html');
  await expect(page.locator('#listenMode')).toBeDisabled(); // без озвучки режим «на слух» недоступен, игра — текстом
  await page.locator('#sceneList button', { hasText: 'Класс' }).click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#instruction')).toHaveText('Put the red book on the desk.');

  // 1) Клавиатура: фокус на предмете → Enter, фокус на месте → Enter
  await page.locator('[data-obj="book-red"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-zone="desk"] .ec-drop').focus();
  await page.keyboard.press('Enter');
  await page.locator('#checkBtn').click();
  await expect(page.locator('#instruction')).toHaveText('Put the blue bag on the chair.', { timeout: 5000 });

  // 2) Мышь: перетаскивание
  const bag = await page.locator('[data-obj="bag-blue"]').boundingBox();
  const chair = await page.locator('[data-zone="chair"]').boundingBox();
  await page.mouse.move(bag.x + bag.width / 2, bag.y + bag.height / 2);
  await page.mouse.down();
  await page.mouse.move(chair.x + chair.width / 2, chair.y + chair.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('[data-zone="chair"] [data-obj="bag-blue"]')).toBeVisible();
  await page.locator('#checkBtn').click();
  await expect(page.locator('#instruction')).toHaveText('Give the teacher a pencil.', { timeout: 5000 });

  // 3) Ошибка → названа часть инструкции → исправление
  await page.locator('#checkBtn').click();
  await expect(page.locator('#feedback')).toContainText('a pencil for the teacher');
  await page.locator('[data-obj="pencil-red"]').click();
  await page.locator('[data-zone="teacher"] .ec-drop').click();
  await page.locator('#checkBtn').click();
  await expect(page.locator('#instruction')).toHaveText('Put the green ruler on the shelf.', { timeout: 5000 });
  await page.locator('[data-obj="ruler-green"]').click();
  await page.locator('[data-zone="shelf"] .ec-drop').click();
  await page.locator('#checkBtn').click();

  await expect(page.locator('#resultScreen')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#resultScreen')).toContainText('75%'); // 3 из 4 с первой попытки
  let p = await progress(page);
  expect(p.games['english-city'].plays).toBe(1);
  expect(p.skills['english-5-basics::listening'].total).toBe(4);
  await page.waitForTimeout(500);
  p = await progress(page);
  expect(p.games['english-city'].plays).toBe(1); // итог не записан второй раз
  expect(problems).toEqual([]);

  // 4) Касание на телефоне
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true });
  const phone = await ctx.newPage();
  await phone.addInitScript(() => localStorage.setItem('BA2_lang', '"ky"'));
  await phone.goto('/games/english-city/index.html');
  await phone.locator('#startBtn').tap();
  await phone.locator('[data-obj="book-red"]').tap();
  await phone.locator('[data-zone="desk"] .ec-drop').tap();
  await expect(phone.locator('[data-zone="desk"] [data-obj="book-red"]')).toBeVisible();
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await ctx.close();
});

test('Story Lab: choices change the story, translation on request, ending saved once, restart is clean', async ({ page }) => {
  await lang('en')(page);
  await page.goto('/games/story-lab/index.html');
  await page.locator('#storyList button', { hasText: 'First Day at School' }).click();
  await expect(page.locator('#scene .sl-line')).toHaveText('“Hi! Is this seat taken?”');
  await expect(page.locator('.sl-translation')).toBeHidden(); // перевод — только по запросу
  await page.getByRole('button', { name: 'Translation' }).click();
  await expect(page.locator('.sl-translation')).toBeVisible();

  // Грубый ответ — другая сцена (учитель вместо Аиды)
  await page.locator('.sl-choice', { hasText: 'Go away.' }).click();
  await expect(page.locator('#feedback')).toContainText('does not fit');
  await expect(page.locator('#feedback')).toContainText('different path');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#scene .sl-speaker')).toHaveText('Mr. Brown');

  // Дальше — лучшие ответы до концовки
  for (const text of ['Yes, please. Where is room 12?', "No, I don't. Can I borrow one, please?", "It's Monday.", "Yes, I'd love to! Thank you."]) {
    await page.locator('.sl-choice', { hasText: text }).click();
    await page.locator('#feedback button.primary').click();
  }
  await expect(page.locator('#resultScreen')).toContainText('New friends');
  let p = await progress(page);
  expect(p.games['story-lab'].plays).toBe(1);
  expect(p.skills['english-5-basics::dialogue'].total).toBe(5);
  const endings = await page.evaluate(() => JSON.parse(localStorage.getItem('BA2_story_lab_endings')));
  expect(endings['first-day']).toEqual(['friends']);

  // «Сыграть ещё» — история с начала
  await page.locator('#resultScreen button', { hasText: /again/i }).first().click();
  await expect(page.locator('#scene .sl-line')).toHaveText('“Hi! Is this seat taken?”');
  await expect(page.locator('#stepLabel')).toHaveText('Step 1');
  p = await progress(page);
  expect(p.games['story-lab'].plays).toBe(1);
});

test('Picture Detective: text mode without a microphone, retry improves the score, examples after the last try', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('BA2_lang', '"ru"'); delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
  await page.goto('/games/picture-detective/index.html');
  await page.locator('#startBtn').click();
  await expect(page.locator('#micBtn')).toBeHidden();
  await expect(page.locator('#micNote')).toContainText('нет распознавания');
  await page.locator('#answer').fill('the blue backpack is below the desk');
  await page.locator('#checkBtn').click();
  await expect(page.locator('.pd-score')).toHaveText('45%');
  await expect(page.locator('#feedback')).toContainText('что делает мальчик');
  await expect(page.locator('#feedback')).not.toContainText('Примеры ответов'); // образцы не показаны до конца попыток
  await page.getByRole('button', { name: 'Дополнить ответ' }).click();
  await page.locator('#answer').press('End');
  await page.locator('#answer').pressSequentially('. The boy is reading a book.');
  await page.locator('#checkBtn').click();
  await expect(page.locator('.pd-score')).toHaveText('100%');
  await expect(page.locator('#feedback')).toContainText('45% → сейчас: 100%');
  await expect(page.locator('#feedback')).toContainText('Примеры ответов');
  const p = await progress(page);
  expect(p.skills['english-5-basics::describing']).toMatchObject({ ok: 1, total: 2 });
});

test('Picture Detective: voice mode puts the recognised text into the box before sending', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('BA2_lang', '"ky"');
    // Имитация распознавания речи браузером (настоящий микрофон в автотесте недоступен)
    class FakeRecognition {
      start() { setTimeout(() => this.onresult?.({ results: [[{ transcript: 'the boy is reading a book' }]] }), 50); }
      abort() {}
    }
    window.SpeechRecognition = FakeRecognition;
    navigator.mediaDevices.getUserMedia = async () => ({ getTracks: () => [{ stop() {} }] });
  });
  await page.goto('/games/picture-detective/index.html');
  await page.locator('#startBtn').click();
  await page.locator('#micBtn').click();
  await expect(page.locator('#answer')).toHaveValue('The boy is reading a book.');
  await expect(page.locator('#feedback')).toBeHidden(); // ничего не отправлено само
});

test('the three games keep one interface language per screen', async ({ page }) => {
  const checks = { ky: 'Деңгээл', ru: 'Уровень', en: 'Level' };
  for (const [l, word] of Object.entries(checks)) {
    await lang(l)(page);
    for (const g of ['english-city', 'story-lab', 'picture-detective']) {
      await page.goto(`/games/${g}/index.html`);
      await expect(page.locator('html')).toHaveAttribute('lang', l);
      await expect(page.locator('#startScreen')).toContainText(word);
      const others = Object.entries(checks).filter(([k]) => k !== l).map(([, w]) => w);
      for (const w of others) await expect(page.locator('#startScreen')).not.toContainText(w);
    }
  }
});
