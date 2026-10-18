// Тест учителя: собрать из банка → распечатать с ключом → ввести бумажные ответы → увидеть в отчёте.
import { test, expect } from '@playwright/test';

test('teacher test: build, print with a key, enter paper results, see them in reports', async ({ page }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));

  await page.goto('/tests.html');
  await page.locator('#createBtn').click();
  await page.locator('#tSubject').selectOption('math');
  await page.locator('#tTopic').selectOption('math-6-fractions');
  await page.locator('#tName').fill('Контрольная по дробям');
  await page.locator('#randomN').fill('6');
  await page.locator('#randomBtn').click();
  await expect(page.locator('#selList > li')).toHaveCount(6);
  await page.locator('#saveBtn').click();
  await expect(page.locator('#testList')).toContainText('Контрольная по дробям');

  // Печать: два варианта, бланк и ключ
  await page.locator('#testList a', { hasText: 'Распечатать' }).click();
  await expect(page.locator('.p-sheet')).toHaveCount(3);
  await expect(page.locator('.p-sheet').first().locator('.p-q')).toHaveCount(6);
  await expect(page.locator('.p-key')).toContainText('Вариант B');
  const keyA = await page.locator('.p-key-table').first().locator('td').allInnerTexts();
  expect(keyA).toHaveLength(6);

  // Ввод результатов: один ученик всё верно по ключу варианта A
  await page.goto('/tests.html');
  await page.locator('#testList button', { hasText: 'Ввести результаты' }).click();
  const row = page.locator('#resultRows .tst-result-row').first();
  await row.locator('input').first().fill('Айбек');
  await row.locator('input').nth(1).fill(keyA.join(' '));
  await expect(row.locator('.tst-score')).toHaveText('6/6');
  await page.locator('#isCheck').check();
  await page.locator('#saveResultsBtn').click();

  await expect(page).toHaveURL(/reports\.html/);
  await expect(page.locator('#lessonList')).toContainText('Бумажная проверка');
  await page.locator('#tabStudents').click();
  await page.locator('#studentList .rep-row', { hasText: 'Айбек' }).click();
  await expect(page.locator('#studentDetail')).toContainText('Изучено');
  expect(problems).toEqual([]);
});
