// Учитель проверяет вопросы банка: «Верно» / «Есть ошибка»; вопрос с ошибкой не выдаётся.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('teacher checks bank questions; a question with a mistake is no longer used', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await page.goto('/questions.html');
  await page.locator('#tabReady').click();
  await expect(page.locator('#readyScreen')).toContainText('написаны с помощью ИИ');
  const card = page.locator('.ready-card', { hasText: 'Дроби' }).first();
  await expect(card).toContainText(/Проверено учителем: 0 из \d+/);
  await card.getByRole('button', { name: 'Проверить вопросы' }).click();

  const first = page.locator('.rv-card').first();
  await expect(first).toContainText('Правильный ответ:');
  const prompt = (await first.locator('b').first().textContent()).replace(/^\d+\.\s*/, '');
  // «Есть ошибка» без комментария не принимается
  await first.getByRole('button', { name: 'Есть ошибка' }).click();
  await expect(first).not.toHaveClass(/rv-issue/);
  await first.locator('textarea').fill('Неверный правильный ответ');
  await first.getByRole('button', { name: 'Есть ошибка' }).click();
  await expect(page.locator('.rv-card').first()).toHaveClass(/rv-issue/);
  await page.locator('.rv-card').nth(1).getByRole('button', { name: 'Верно' }).click();
  await expect(page.locator('#reviewCount')).toContainText('Проверено учителем: 1 из');
  await expect(page.locator('#reviewCount')).toContainText('с ошибкой: 1');

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

  // Только непроверенные
  await page.locator('#reviewOnlyLeft').check();
  await expect(page.locator('.rv-card', { hasText: prompt })).toHaveCount(0);

  // Вопрос с ошибкой не попадает в выдачу
  const ids = await page.evaluate(async () => {
    const m = await import('/core/curriculum.js');
    const all = await m.loadBank('math-6-fractions');
    const given = await m.getQuestions({ topic: 'math-6-fractions', count: 999 });
    const reviews = JSON.parse(localStorage.getItem('BA2_qreview'));
    const flagged = Object.entries(reviews).filter(([, v]) => v.s === 'issue').map(([k]) => k.split('::')[1]);
    return { all: all.length, given: given.length, flaggedGiven: given.filter((q) => flagged.includes(q.id)).length };
  });
  expect(ids.given).toBe(ids.all - 1);
  expect(ids.flaggedGiven).toBe(0);

  await page.locator('#reviewBackBtn').click();
  await expect(page.locator('.ready-card', { hasText: 'Дроби' }).first()).toContainText('с ошибкой: 1');
  expect(errors).toEqual([]);
});
