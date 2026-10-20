// Картинка в вопросе учителя: загрузка (со сжатием) → домашнее задание → печать.
import { test, expect } from '@playwright/test';

test('a teacher adds a picture to a question; it shows in homework and in print', async ({ page, browser }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });

  // «Фото с телефона»: большой снимок 2400×1800
  const ctx = await browser.newContext({ viewport: { width: 2400, height: 1800 } });
  const studio = await ctx.newPage();
  await studio.setContent('<body style="margin:0;background:linear-gradient(135deg,#D91E18,#21b8a6)"><div style="font:bold 300px Arial;color:#fff;padding:200px">1/2 + 1/4</div></body>');
  const photo = await studio.screenshot({ type: 'png' });
  await ctx.close();
  expect(photo.length).toBeGreaterThan(200_000);

  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await page.goto('/questions.html');
  await page.locator('#createBtn').click();
  await page.locator('#fSubject').selectOption('math');
  await page.locator('#fTopic').selectOption('math-6-fractions');
  await page.locator('#fQuestion').fill('Сколько будет на картинке?');
  const opts = page.locator('#answerFields input[type="text"], #answerFields input:not([type])');
  await opts.nth(0).fill('3/4');
  await opts.nth(1).fill('2/6');
  await page.locator('#fImage').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: photo });
  await expect(page.locator('#fImagePreview img')).toBeVisible();
  const kb = Number((await page.locator('#fImageNote').textContent()).match(/(\d+)\s*КБ/)[1]);
  expect(kb).toBeLessThanOrEqual(180);
  await page.locator('#saveBtn').click();
  await expect(page.locator('#questionList')).toContainText('📷');

  const q = await page.evaluate(() => JSON.parse(localStorage.getItem('BA2_questions')).find((x) => x.image));
  expect(q.image.startsWith('data:image/')).toBe(true);

  // Домашнее задание из этого вопроса → у ученика картинка над вопросом
  await page.evaluate((id) => {
    const now = Date.now();
    localStorage.setItem('BA2_assignments', JSON.stringify([{ id: 'a_img', title: 'Картинка', subject: 'math', grade: 6, topic: 'math-6-fractions',
      count: 1, questionIds: [id], classId: null, assignedAt: now - 1000, dueAt: now + 86400000, attempts: 2, xp: 10, createdAt: now }]));
  }, q.id);
  await page.goto('/tasks.html?id=a_img');
  await page.locator('#startBtn').click();
  await expect(page.locator('#promptImage img')).toBeVisible();
  const natural = await page.locator('#promptImage img').evaluate((img) => img.naturalWidth);
  expect(natural).toBeLessThanOrEqual(800);

  // Печать теста с этим вопросом
  await page.evaluate((id) => localStorage.setItem('BA2_tests', JSON.stringify([{ id: 't_img', title: 'С картинкой', subject: 'math', grade: 6, topic: 'math-6-fractions', questionIds: [id, 'f01'], createdAt: 1, updatedAt: 2 }])), q.id);
  await page.goto('/print.html?test=t_img');
  await expect(page.locator('.p-sheet').first().locator('.p-img')).toBeVisible();
  expect(problems).toEqual([]);
});
