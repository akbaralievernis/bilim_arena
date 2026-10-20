// Урок целиком: доска создаёт комнату на своём сервере знакомства (signal/),
// три телефона входят по ссылке из QR, отвечают, итог попадает в отчёты.
import { test, expect } from '@playwright/test';

const SIG = process.env.E2E_SIGNAL || 'local';
const PHONES = ['Айбек', 'Нурай', 'Бекзат'];

async function answerOnce(page) {
  const box = page.locator('#optionsBox:not(.hidden)');
  if (!(await box.isVisible().catch(() => false))) return false;
  // Вопрос с вводом: поле и кнопка внутри #optionsBox
  const input = box.locator('input:visible').first();
  if (await input.count()) {
    await input.fill('1');
    await box.locator('button:visible').last().click();
    return true;
  }
  const option = box.locator('button:not([disabled]):visible').first();
  if (await option.count()) { await option.click(); return true; }
  return false;
}

test('board + 3 phones: join, play a stage, lesson appears in reports', async ({ browser }) => {
  const boardCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await boardCtx.addInitScript(() => localStorage.setItem('BA2_lang', '"ky"'));
  const board = await boardCtx.newPage();
  await board.goto('/board.html?subject=math&topic=math-5-numbers&signal=' + SIG);
  await board.getByRole('button', { name: 'Сабакты баштоо' }).first().click();

  const codeEl = board.locator('#roomCode');
  await expect(codeEl).toHaveText(/^[A-Z0-9]{4}$/, { timeout: 30_000 });
  const code = await codeEl.textContent();
  const joinLink = await board.locator('#joinUrlText').textContent();
  expect(joinLink).toContain('signal=' + SIG);

  // Телефоны — отдельные браузеры (свои localStorage, как у разных учеников)
  const phones = [];
  for (const name of PHONES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(`/play.html?room=${code}&signal=${SIG}`);
    await page.locator('#nameInput').fill(name);
    await page.locator('#joinBtn').click();
    phones.push({ ctx, page });
  }
  for (const { page } of phones) await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 30_000 });
  await expect(board.locator('#playerCount')).toHaveText(String(PHONES.length), { timeout: 30_000 });

  // Первый этап: телефоны отвечают, пока доска не покажет итог этапа
  await board.getByRole('button', { name: 'Оюнду баштоо' }).click();
  const result = board.locator('#resultScreen');
  for (let i = 0; i < 60 && !(await result.isVisible()); i++) {
    for (const { page } of phones) await answerOnce(page);
    await board.waitForTimeout(700);
  }
  if (!(await result.isVisible())) {
    for (const { page } of phones) console.log('PHONE:', (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 200), await page.locator('#connDot').getAttribute('class'));
  }
  await expect(result).toBeVisible();

  // Журнал урока: все три ученика с ответами
  const lesson = await board.evaluate(() => JSON.parse(localStorage.getItem('BA2_lessons') || '[]')[0]);
  expect(Object.keys(lesson.students).length).toBe(PHONES.length);
  expect(lesson.answered).toBeGreaterThan(0);

  const reports = await boardCtx.newPage();
  await reports.goto('/reports.html?view=students');
  for (const name of PHONES) await expect(reports.getByRole('button', { name: new RegExp(name) })).toBeVisible();

  for (const { ctx } of phones) await ctx.close();
  await boardCtx.close();
});

test('a wrong room code is reported quickly as "room not found"', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await page.goto('/play.html?room=ZZZZ&signal=' + SIG);
  await page.locator('#nameInput').fill('Тест');
  const started = Date.now();
  await page.locator('#joinBtn').click();
  await expect(page.locator('#joinError')).toContainText(/не найдена|найдена/i, { timeout: 40_000 });
  expect(Date.now() - started).toBeLessThan(40_000);
});

test('code typed on a Cyrillic keyboard joins; the board warns while it is offline and recovers', async ({ browser }) => {
  test.setTimeout(150_000);
  const boardCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await boardCtx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  const board = await boardCtx.newPage();
  await board.goto('/board.html?subject=math&topic=math-5-numbers&signal=' + SIG);
  await board.getByRole('button', { name: 'Начать урок' }).first().click();
  const codeEl = board.locator('#roomCode');
  await expect(codeEl).toHaveText(/^[A-Z0-9]{4}$/, { timeout: 30_000 });
  const code = await codeEl.textContent();
  const LAT = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х' };
  const cyrillic = [...code].map((c) => LAT[c] || c).join('').toLowerCase();

  const join = async (name, typed) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
    const page = await ctx.newPage();
    await page.goto('/play.html?signal=' + SIG);
    await page.locator('#codeInput').pressSequentially(typed);
    await expect(page.locator('#codeInput')).toHaveValue(code); // кириллица превратилась в латиницу
    await page.locator('#nameInput').fill(name);
    await page.locator('#joinBtn').click();
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 40_000 });
    return ctx;
  };
  const first = await join('Айбек', cyrillic);
  await expect(board.locator('#playerCount')).toHaveText('1', { timeout: 20_000 });

  // У доски пропал интернет: учитель видит, что новые ученики сейчас не войдут
  await boardCtx.setOffline(true);
  await expect(board.locator('#roomWarn')).toBeVisible({ timeout: 30_000 });
  await expect(board.locator('#roomWarn')).toContainText('новые ученики пока не смогут войти');
  // Интернет вернулся: предупреждение пропадает, новый ученик входит с тем же кодом
  await boardCtx.setOffline(false);
  await expect(board.locator('#roomWarn')).toBeHidden({ timeout: 40_000 });
  const second = await join('Нурай', code);
  await expect(board.locator('#playerCount')).toHaveText('2', { timeout: 20_000 });

  await first.close(); await second.close(); await boardCtx.close();
});
