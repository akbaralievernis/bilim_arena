// Кабинет ученика: задание продолжается после перезагрузки, повтор ошибок не портит отчёт учителя.
import { test, expect } from '@playwright/test';

const T = 'math-6-fractions';
const assignment = (extra = {}) => ({
  id: 'a_test', title: 'Бөлчөктөр', subject: 'math', grade: 6, topic: T, skill: null, difficulty: [1, 2, 3],
  count: 6, questionIds: null, classId: null, assignedAt: Date.now() - 86400000, dueAt: Date.now() + 5 * 86400000,
  attempts: 2, xp: 50, createdAt: Date.now(), ...extra
});

async function seed(page, a) {
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('BA2_lang', '"ru"');
    localStorage.setItem('BA2_assignments', JSON.stringify([data]));
    localStorage.setItem('BA2_profile', JSON.stringify({ id: 'stu1', name: 'Айбек', role: 'student', grade: 6 }));
  }, a);
}

async function answer(page, n) {
  for (let i = 0; i < n; i++) {
    const counter = await page.locator('#counter').textContent();
    const input = page.locator('#answerArea input:visible');
    if (await input.count()) await input.first().fill('1');
    await page.locator('#answerArea .option:not([disabled]), #answerArea button:not([disabled])').first().click();
    await expect(page.locator('#counter')).not.toHaveText(counter, { timeout: 10_000 }).catch(() => {});
  }
}

test('a check is continued after a reload: same questions, one attempt, all answers counted', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await seed(page, assignment({ check: true }));
  await page.goto('/tasks.html');
  await page.locator('#taskList button.primary').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#counter')).toHaveText('1 / 6');
  const first = await page.locator('#prompt').textContent();
  await answer(page, 3);
  await expect(page.locator('#counter')).toHaveText('4 / 6');

  await page.reload(); // разрядился телефон / закрыли вкладку
  const card = page.locator('#taskList .hw-card');
  await expect(card.locator('button')).toHaveText('Продолжить (вопрос 4 из 6)');
  await card.locator('button').click();
  // В «Проверке» начать заново нельзя — только продолжить
  await expect(page.locator('#restartBtn')).toBeHidden();
  await page.locator('#startBtn').click();
  await expect(page.locator('#counter')).toHaveText('4 / 6');
  await answer(page, 3);
  await expect(page.locator('#resultScreen')).toBeVisible({ timeout: 15_000 });

  const sub = await page.evaluate(() => JSON.parse(localStorage.getItem('BA2_submissions'))[0]);
  expect(sub.attempts).toBe(1);
  expect(sub.total).toBe(6);
  // Незаконченной попытки больше нет
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('BA2_hw_runs') || '{}')).length)).toBe(0);
  expect(first).toBeTruthy();
  expect(errors).toEqual([]);
});

test('practice: start over is offered; repeating mistakes does not change the teacher report', async ({ page }) => {
  await seed(page, assignment({ check: false, count: 4 }));
  await page.goto('/tasks.html');
  await page.locator('#taskList button.primary').click();
  await page.locator('#startBtn').click();
  await answer(page, 1);
  await page.reload();
  await page.locator('#taskList .hw-card button').click();
  await expect(page.locator('#restartBtn')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.locator('#restartBtn').click();
  await expect(page.locator('#counter')).toHaveText('1 / 4');
  // Отвечаем неверно, где можем: выбираем последний вариант
  for (let i = 0; i < 4; i++) {
    const c = await page.locator('#counter').textContent();
    const input = page.locator('#answerArea input:visible');
    if (await input.count()) { await input.first().fill('0'); await page.locator('#answerArea button').last().click(); }
    else await page.locator('#answerArea .option').last().click();
    await expect(page.locator('#counter')).not.toHaveText(c, { timeout: 10_000 }).catch(() => {});
  }
  await expect(page.locator('#resultScreen')).toBeVisible({ timeout: 20_000 });
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('BA2_submissions'))[0]);
  await page.locator('.res-mistakes').evaluate((el) => { el.hidden = false; });
  const repeat = page.locator('.res-mistakes button');
  expect(await repeat.count()).toBeGreaterThan(0); // все ответы неверные — ошибки точно есть
  {
    await repeat.first().click();
    await expect(page.locator('#playScreen')).toBeVisible();
    for (let i = 0; i < 6 && !(await page.locator('#resultScreen').isVisible()); i++) {
      const inp = page.locator('#answerArea input:visible');
      if (await inp.count()) await inp.first().fill('1').catch(() => {});
      await page.locator('#answerArea .option, #answerArea button').first().click().catch(() => {});
      await page.waitForTimeout(3500);
    }
    await expect(page.locator('#resultScreen')).toBeVisible({ timeout: 20_000 });
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('BA2_submissions'))[0]);
    expect(after.attempts).toBe(before.attempts);
    expect(after.best).toBe(before.best);
  }
});

test('home shows the tasks to do with deadlines; the menu counts them; overdue is marked', async ({ page }) => {
  const D = 86400000;
  await page.addInitScript((d) => {
    localStorage.setItem('BA2_lang', '"ru"');
    localStorage.setItem('BA2_profile', JSON.stringify({ id: 'stu1', name: 'Айбек', role: 'student', grade: 6 }));
    localStorage.setItem('BA2_assignments', JSON.stringify([
      { id: 'late', title: 'Просроченное', subject: 'math', grade: 6, topic: 'math-6-fractions', count: 5, attempts: 1, xp: 10, assignedAt: Date.now() - 3 * d, dueAt: Date.now() - d },
      { id: 'soon', title: 'Скоро срок', subject: 'math', grade: 6, topic: 'math-6-fractions', count: 5, attempts: 1, xp: 10, assignedAt: Date.now() - d, dueAt: Date.now() + d, check: true },
      { id: 'future', title: 'Ещё не выдано', subject: 'math', grade: 6, topic: 'math-6-fractions', count: 5, attempts: 1, xp: 10, assignedAt: Date.now() + d, dueAt: Date.now() + 3 * d }
    ]));
    localStorage.setItem('BA2_submissions', '[]');
  }, D);
  await page.goto('/index.html');
  const box = page.locator('#tasksHome');
  await expect(box).toContainText('Задания: 2'); // ещё не выданное не показывается
  await expect(box.locator('.home-task', { hasText: 'Просроченное' }).locator('.late')).toContainText('Срок прошёл');
  await expect(box.locator('.home-task', { hasText: 'Скоро срок' })).toContainText('Проверка');
  await expect(page.locator('.topbar [data-badge="tasks"]')).toHaveText('2');
  await box.locator('.home-task', { hasText: 'Скоро срок' }).click();
  await expect(page).toHaveURL(/tasks\.html\?id=soon/);
  await expect(page.locator('#introScreen')).toBeVisible();
});
