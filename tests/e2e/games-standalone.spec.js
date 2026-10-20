// Отдельные игры: ошибки, найденные при проверке каждой игры, и общий прогон.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ky"'));
});

test('odd one out: leaving to the menu mid-round really stops the game', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/games/odd-one-out/index.html');
  await page.locator('#btnStartSingle').click();
  await expect(page.locator('#screenGame')).toBeVisible();
  // Ответ (верный или нет) запускает переход к следующему раунду через 1–2,4 с
  await page.locator('#gridSingle .cardBtn').first().click();
  await page.locator('#btnBackToMenu').click();
  await expect(page.locator('#screenStart')).toBeVisible();
  // Раньше игра продолжалась невидимо и через ~100 с выскакивал экран «Конец игры»;
  // проверяем, что раунды больше не идут: номер раунда не меняется
  const round = await page.locator('#roundNow').textContent();
  await page.waitForTimeout(3500);
  await expect(page.locator('#roundNow')).toHaveText(round);
  await expect(page.locator('#screenEnd')).toBeHidden();
  await expect(page.locator('#screenStart')).toBeVisible();
  expect(errors).toEqual([]);
});

test('odd one out: teams with more rounds than the test has get an honest warning', async ({ page }) => {
  await page.goto('/games/odd-one-out/index.html');
  await page.locator('#inpRoundsTeams').fill('40');
  await page.locator('#btnStartTeams').click();
  await expect(page.locator('#toast')).toContainText(/30 гана раунд/);
});

test('sentence: pausing right after a team finishes a sentence does not freeze that team', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/games/sentence/index.html');
  // Панель настроек: готовый набор уже подставлен — подтверждаем и начинаем
  await expect(page.locator('#textInput')).not.toHaveValue('');
  await page.locator('#applyBtn').click();
  await page.locator('#startBtn').click();
  // Ждём, пока слова «пролетят» и появятся карточки команды A
  await expect(page.locator('#tilesA .tile').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#roundA')).toHaveText(/^1\//);
  // Собираем предложение (пробуем карточки по очереди) и в ту же секунду жмём «Тыным»
  await page.evaluate(() => {
    const tiles = () => [...document.querySelectorAll('#tilesA .tile')];
    for (let guard = 0; guard < 200 && tiles().length; guard++) {
      for (const tile of tiles()) tile.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    }
    document.getElementById('pauseBtn').click();
  });
  await page.waitForTimeout(400);
  await page.locator('#pauseBtn').click(); // продолжить
  // Раньше команда A навсегда оставалась на собранном предложении
  await expect(page.locator('#roundA')).toHaveText(/^2\//, { timeout: 5000 });
  expect(errors).toEqual([]);
});

test('sentence: confirming an empty text keeps the panel open with a hint', async ({ page }) => {
  await page.goto('/games/sentence/index.html');
  await page.locator('#presetSelect').selectOption('custom');
  await page.locator('#textInput').fill('');
  await page.locator('#applyBtn').click();
  await expect(page.locator('#setupOverlay')).toHaveClass(/show/);
  await expect(page.locator('#textInput')).toHaveAttribute('aria-invalid', 'true');
});
