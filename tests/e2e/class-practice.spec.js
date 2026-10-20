// Отчёт учителя: тренировки ученика из его аккаунта («Практика» на телефоне) — отдельным блоком.
import { test, expect } from '@playwright/test';

test('student report shows practice from the student account, without changing topic status', async ({ page }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('BA2_lang', '"ru"');
    const now = Date.now();
    // Урок на доске (чтобы ученик был в списке) и тренировки из облака (core/cloud.js → class_practice)
    localStorage.setItem('BA2_lessons', JSON.stringify([{ v: 2, id: 'l1', at: now - 86400000, endedAt: now - 86400000, subject: 'math', topic: 'math-6-fractions',
      mode: 'lesson', stages: [], answered: 2, correct: 1, bySkill: {}, students: { 'айбек': { name: 'Айбек', answered: 2, correct: 1, score: 10, bySkill: { 'math-6-fractions::compare': { ok: 1, total: 2 } }, wrong: [] } } }]));
    localStorage.setItem('BA2_class_practice', JSON.stringify({ u1: { name: 'Айбек', classId: 'c1', at: now,
      topics: { 'math-6-fractions': { answered: 12, correct: 9, lastAt: now }, 'chemistry-8-basics': { answered: 4, correct: 4, lastAt: now - 3600000 } },
      checks: { 'math-6-fractions': [{ at: now, correct: 5, total: 6 }] } } }));
  });
  await page.goto('/reports.html?view=students');
  await page.locator('#studentList .rep-row', { hasText: 'Айбек' }).click();
  const detail = page.locator('#studentDetail');
  await expect(detail).toContainText('Тренировки на телефоне');
  const table = detail.locator('h3:has-text("Тренировки на телефоне") + p + .rep-table-wrap');
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await expect(table.locator('tbody tr').first()).toContainText('Дроби');
  await expect(table.locator('tbody tr').first()).toContainText('75%');
  await expect(table.locator('tbody tr').first()).toContainText('83%');
  // Статус темы по-прежнему ставят только проверки учителя: «Изучено» из-за тренировок не появилось
  await expect(detail.locator('table').first()).not.toContainText('Изучено');
  expect(problems).toEqual([]);
});
