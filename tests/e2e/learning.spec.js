// Тренировка и итоговая проверка: проверка берёт только невиданные вопросы и не подсказывает.
import { test, expect } from '@playwright/test';

const TOPIC = 'math-6-fractions'; // 25 вопросов в банке

/** Ответить на текущий вопрос (выбор или ввод) */
async function answerOnce(page) {
  const input = page.locator('#options #quizInput');
  if (await input.isVisible().catch(() => false)) {
    await input.fill('1');
    await input.press('Enter');
    return;
  }
  await page.locator('#options .option:not([disabled])').first().click();
}

/** Пройти раунд до экрана результатов */
async function playRound(page, { check = false } = {}) {
  for (let i = 1; i <= 10; i++) {
    await expect(page.locator('#counter')).toHaveText(`${i} / 10`, { timeout: 20_000 });
    await answerOnce(page);
    if (check) {
      // В проверке не видно, верно ли ответил
      await expect(page.locator('#explain')).toBeVisible();
      expect(await page.locator('#options .correct, #options .wrong, #options .answer-review').count()).toBe(0);
    }
  }
  await expect(page.locator('#resultScreen')).toBeVisible({ timeout: 20_000 });
}

const memory = (page) => page.evaluate((topic) => {
  const p = JSON.parse(localStorage.getItem('BA2_progress') || '{}');
  return { seen: Object.keys(p.qs || {}).filter((k) => k.startsWith(topic + '::')), checks: (p.checks || {})[topic] || [] };
}, TOPIC);

test('practice, then a final check with only new questions', async ({ page }) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));

  await page.goto(`/practice.html?topic=${TOPIC}`);
  await expect(page.locator('#checkNote')).toContainText('25');
  await page.locator('#startBtn').click();
  await playRound(page);
  const afterPractice = await memory(page);
  expect(afterPractice.seen.length).toBe(10);

  await page.goto(`/practice.html?topic=${TOPIC}`);
  await expect(page.locator('#checkNote')).toContainText('15');
  await page.locator('#checkBtn').click();
  await playRound(page, { check: true });
  // Разбор ошибок с правильными ответами — только в конце
  const afterCheck = await memory(page);
  expect(afterCheck.seen.length).toBe(20);
  expect(afterCheck.checks.length).toBe(1);
  expect(afterCheck.checks[0].total).toBe(10);

  await page.goto(`/practice.html?topic=${TOPIC}`);
  await expect(page.locator('#checkNote')).toContainText('5');
  await expect(page.locator('#checkNote')).toContainText(/%/);
  await expect(page.locator('#checkBtn')).toBeEnabled();
});

test('final check is refused honestly when new questions run out', async ({ page }) => {
  await page.addInitScript((topic) => {
    localStorage.setItem('BA2_lang', '"ru"');
    // Ученик уже видел 22 из 25 вопросов темы
    const ids = [...Array.from({ length: 20 }, (_, i) => `f${String(i + 1).padStart(2, '0')}`), 'f-err-01', 'f-err-02'];
    const qs = Object.fromEntries(ids.map((id) => [`${topic}::${id}`, { n: 1, ok: 1, miss: 0, at: Date.now(), box: 1, due: Date.now() + 86400000 }]));
    localStorage.setItem('BA2_progress', JSON.stringify({ qs }));
  }, TOPIC);
  await page.goto(`/practice.html?topic=${TOPIC}`);
  await expect(page.locator('#checkBtn')).toBeDisabled();
  await expect(page.locator('#checkNote')).toContainText(/Мало новых вопросов/);
  await expect(page.locator('#startBtn')).toBeEnabled();
});

test('teacher sees a pasted question that repeats the bank and decides', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await page.goto('/questions.html');
  await page.locator('#importBtn').click();
  // Тот же вопрос, что f01 в банке дробей
  await page.locator('#iSubject').selectOption('math');
  await page.locator('#iGrade').selectOption('6');
  await page.locator('#iTopic').selectOption(TOPIC);
  await page.locator('#importText').fill(['1. Какая дробь больше: 3/5 или 2/5?', 'а) 3/5 *', 'б) 2/5', '', '2. Сколько будет 1/7 + 5/7?', 'а) 6/7 *', 'б) 6/14'].join('\n'));
  await page.locator('#importSaveBtn').click();
  await expect(page.locator('#importDoneTitle')).toContainText(/похож/);

  await page.locator('#tabDups').click();
  await expect(page.locator('#dupScreen')).toBeVisible();
  const cards = page.locator('#dupList > .card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Из готового банка');
  await cards.first().getByRole('button', { name: 'Это разные вопросы' }).click();
  await expect(page.locator('#dupList')).toContainText('Похожих вопросов не найдено');
  // Ничего не удалено
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('BA2_questions') || '[]').length)).toBe(2);
});
