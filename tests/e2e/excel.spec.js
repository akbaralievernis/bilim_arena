// Отчёты в Excel: все ученики, один урок, один ученик — настоящие .xlsx файлы.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const T = 'math-6-fractions';
const lesson = (id, at, students) => ({
  v: 2, id, at, endedAt: at, subject: 'math', topic: T, mode: 'lesson', stages: [{ gameId: 'quickvote', at, answered: 1, correct: 1 }],
  answered: students.reduce((s, x) => s + x.answered, 0), correct: students.reduce((s, x) => s + x.correct, 0),
  bySkill: { [`${T}::compare`]: { ok: 3, total: 8 } },
  students: Object.fromEntries(students.map((x) => [x.name.toLowerCase(), { ...x, score: x.correct * 10, bySkill: { [`${T}::compare`]: { ok: x.correct, total: x.answered } }, wrong: ['f01'] }]))
});

/** Текст всех XML внутри .xlsx (метод store — данные лежат как есть) */
const xlsxText = (path) => readFileSync(path).toString('utf8');

test('reports: students, lesson and student export to Excel', async ({ page }) => {
  await page.addInitScript((data) => {
    localStorage.setItem('BA2_lang', '"ru"');
    localStorage.setItem('BA2_lessons', JSON.stringify(data));
  }, [lesson('l1', 1792300000000, [{ name: 'Айбек', answered: 10, correct: 9 }, { name: 'Нурай <Ө>', answered: 10, correct: 4 }])]);

  await page.goto('/reports.html?view=students');
  await expect(page.locator('#studentList')).toContainText('Айбек');
  const [all] = await Promise.all([page.waitForEvent('download'), page.locator('#exportStudentsBtn').click()]);
  expect(all.suggestedFilename()).toMatch(/ученики .*\.xlsx$/);
  const allText = xlsxText(await all.path());
  expect(allText.startsWith('PK')).toBe(true);
  for (const s of ['Ученики', 'Темы', 'Шкала', 'Айбек', 'Нурай &lt;Ө&gt;', 'Оценка (подсказка)', 'Дроби']) expect(allText).toContain(s);

  await page.locator('#studentList .rep-row', { hasText: 'Айбек' }).click();
  const [one] = await Promise.all([page.waitForEvent('download'), page.locator('#studentDetail button', { hasText: 'Excel' }).click()]);
  expect(one.suggestedFilename()).toContain('Айбек');
  expect(xlsxText(await one.path())).toContain('Уроки');

  await page.goto('/reports.html');
  await page.locator('#lessonList .rep-row').first().click();
  const [les] = await Promise.all([page.waitForEvent('download'), page.locator('#lessonDetail button', { hasText: 'Excel' }).click()]);
  expect(les.suggestedFilename()).toMatch(/Дроби .*\.xlsx$/);
  const lt = xlsxText(await les.path());
  expect(lt).toContain('Урок');
  expect(lt).toContain('<v>90</v>'); // Айбек: 9 из 10
  await expect(page.locator('#toasts')).toContainText('Файл Excel скачан');
});
