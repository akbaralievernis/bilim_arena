// Отчёт для родителей: учитель (с комментарием) и ученик (свой прогресс).
import { test, expect } from '@playwright/test';

const T = 'math-6-fractions';
const lesson = { v: 2, id: 'l1', at: 1792300000000, endedAt: 1792300000000, subject: 'math', topic: T, mode: 'paper-check', stages: [{ gameId: 'paper', at: 1, answered: 10, correct: 9 }], answered: 10, correct: 9,
  bySkill: { [`${T}::compare`]: { ok: 4, total: 5 } }, students: { 'айбек': { name: 'Айбек', answered: 10, correct: 9, score: 9, bySkill: { [`${T}::compare`]: { ok: 4, total: 5 }, [`${T}::add-sub`]: { ok: 5, total: 5 } }, wrong: ['f01'] } } };

test('teacher opens a parent report with a note; the link works on its own', async ({ page, context }) => {
  await page.addInitScript((l) => { localStorage.setItem('BA2_lang', '"ru"'); localStorage.setItem('BA2_lessons', JSON.stringify([l])); }, lesson);
  await page.goto('/reports.html?view=students');
  await page.locator('#studentList .rep-row', { hasText: 'Айбек' }).click();
  await page.locator('#studentDetail summary', { hasText: 'Отчёт для родителей' }).click();
  await page.locator('#studentDetail textarea').fill('Молодец, <b>так держать</b>!');
  const [report] = await Promise.all([context.waitForEvent('page'), page.locator('#studentDetail button', { hasText: 'Открыть отчёт' }).click()]);
  await report.waitForLoadState();
  await expect(report.locator('#report h1')).toContainText('Айбек');
  await expect(report.locator('#report')).toContainText('Дроби');
  await expect(report.locator('#report')).toContainText('Изучено');
  await expect(report.locator('.pr-note')).toContainText('Молодец, <b>так держать</b>!'); // как текст, не HTML
  expect(await report.locator('.pr-note b').count()).toBe(1);

  // Та же ссылка в «чистом» браузере родителя — без данных сайта
  const url = report.url();
  const parent = await (await page.context().browser().newContext()).newPage();
  await parent.goto(url);
  await expect(parent.locator('#report h1')).toContainText('Айбек');
});

test('student shows own progress to parents; a broken link is explained', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('BA2_lang', '"ky"');
    localStorage.setItem('BA2_profile', JSON.stringify({ id: 'u1', name: 'Нурай', role: 'student', grade: 6 }));
    localStorage.setItem('BA2_progress', JSON.stringify({ xp: 120, topics: { 'math-6-fractions': { answered: 12, correct: 10, lastAt: 1, games: 1 } }, checks: {}, qs: {}, skills: {}, games: { practice: { plays: 1, best: 10, xp: 0 } } }));
  });
  await page.goto('/progress.html');
  await page.locator('#parentReportBtn').click();
  await expect(page).toHaveURL(/report\.html#d=/);
  await expect(page.locator('#report h1')).toContainText('Нурай');
  await expect(page.locator('#report')).toContainText('Текшерүүгө даяр');
  await page.goto('/report.html#d=broken');
  await expect(page.locator('#report h1')).toContainText('Отчет ачылган жок');
});
