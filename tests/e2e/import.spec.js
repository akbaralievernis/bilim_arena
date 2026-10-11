// Учитель вставляет тест текстом — вопросы сохраняются и готовы к уроку.
import { test, expect } from '@playwright/test';

test('paste a test as text, save it, start it on the board', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await page.goto('/questions.html');
  await page.locator('#importBtn').click();
  await page.locator('#importText').fill([
    '1. Столица Кыргызстана?', 'а) Ош', 'б) Бишкек *', '',
    '2. 6 × 7 = ?', 'Ответ: 42', '',
    '3. Без ответа', 'а) да', 'б) нет'
  ].join('\n'));
  await expect(page.locator('#importSummary')).toContainText('3');
  await expect(page.locator('#importSaveBtn')).toHaveText(/2/);
  await page.locator('#importSaveBtn').click();
  await expect(page.locator('#importDone')).toBeVisible();
  await expect(page.locator('#questionList .q-row')).toHaveCount(2);
  await page.locator('#importDoneBoard').click();
  await expect(page).toHaveURL(/board\.html\?.*mode=review/);
});
