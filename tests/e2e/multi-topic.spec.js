// Тест из нескольких тем: собрать в конструкторе → печать → результаты → отчёт по каждой теме.
import { test, expect } from '@playwright/test';

test('a test built from two topics prints and reports per topic', async ({ page }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await page.goto('/tests.html');
  await page.locator('#createBtn').click();
  await page.locator('#tName').fill('Смешанный тест');
  await page.locator('#tSubject').selectOption('math');
  await page.locator('#tTopic').selectOption('math-6-fractions');
  await page.locator('#randomN').fill('3');
  await page.locator('#randomBtn').click();
  await expect(page.locator('#selList > li')).toHaveCount(3);
  // Другая тема: выбранные вопросы дробей не пропадают
  await page.locator('#tSubject').selectOption('chemistry');
  await page.locator('#randomN').fill('2');
  await page.locator('#randomBtn').click();
  await expect(page.locator('#selList > li')).toHaveCount(5);
  await expect(page.locator('#selCount')).toContainText('2 темы');
  await expect(page.locator('#selList')).toContainText('Дроби');
  await page.locator('#saveBtn').click();
  await expect(page.locator('#testList')).toContainText('Дроби');
  await expect(page.locator('#testList')).toContainText('химические понятия');

  // Домашнее задание из этого теста: все 5 вопросов из обеих тем
  const refs = await page.evaluate(() => JSON.parse(localStorage.getItem('BA2_tests'))[0].questionIds);
  expect(refs.every((r) => r.includes('::'))).toBe(true);
  await page.evaluate((ids) => {
    const now = Date.now();
    localStorage.setItem('BA2_assignments', JSON.stringify([{ id: 'a_mix', title: 'Смешанный', subject: 'math', grade: 6, topic: 'math-6-fractions',
      count: ids.length, questionIds: ids, classId: null, assignedAt: now - 1000, dueAt: now + 86400000, attempts: 2, xp: 10, createdAt: now }]));
  }, refs);
  await page.goto('/tasks.html?id=a_mix');
  await page.locator('#startBtn').click();
  await expect(page.locator('#counter')).toHaveText('1 / 5');
  await page.goto('/tests.html');

  await page.locator('#testList a', { hasText: 'Распечатать' }).click();
  await expect(page.locator('.p-sheet').first().locator('.p-q')).toHaveCount(5);
  await expect(page.locator('.p-meta').first()).toContainText('Дроби');
  // Строка для ввода — первое слово в клетке ключа («BA (1–B, 2–A)» → «BA»)
  const keyA = (await page.locator('.p-key-table').first().locator('td').allInnerTexts()).map((s) => s.trim().split(/\s+/)[0]);

  await page.goto('/tests.html');
  await page.locator('#testList button', { hasText: 'Ввести результаты' }).click();
  const row = page.locator('#resultRows .tst-result-row').first();
  await row.locator('input').first().fill('Азат');
  await row.locator('input').nth(1).fill(keyA.join(' '));
  await expect(row.locator('.tst-score')).toHaveText('5/5');
  await page.locator('#saveResultsBtn').click();
  await expect(page).toHaveURL(/reports\.html/);
  await page.locator('#tabStudents').click();
  await page.locator('#studentList .rep-row', { hasText: 'Азат' }).click();
  const topics = page.locator('#studentDetail tbody').first();
  await expect(topics).toContainText('Дроби');
  await expect(topics).toContainText('химические понятия');
  expect(problems).toEqual([]);
});
