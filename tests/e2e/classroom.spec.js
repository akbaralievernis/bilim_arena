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
  await expect(codeEl).toHaveText(/^[A-Z0-9]{5}$/, { timeout: 30_000 });
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
  await expect(codeEl).toHaveText(/^[A-Z0-9]{5}$/, { timeout: 30_000 });
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

test('two phones with the same name get different names, so their answers do not merge', async ({ browser }) => {
  const boardCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await boardCtx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  const board = await boardCtx.newPage();
  await board.goto('/board.html?subject=math&topic=math-5-numbers&signal=' + SIG);
  await board.getByRole('button', { name: 'Начать урок' }).first().click();
  const codeEl = board.locator('#roomCode');
  await expect(codeEl).toHaveText(/^[A-Z0-9]{5}$/, { timeout: 30_000 });
  const code = await codeEl.textContent();

  const join = async (name) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
    const page = await ctx.newPage();
    await page.goto(`/play.html?room=${code}&signal=${SIG}`);
    await page.locator('#nameInput').fill(name);
    await page.locator('#joinBtn').click();
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 40_000 });
    return { ctx, page };
  };
  const a = await join('Айбек');
  await expect(board.locator('#playerCount')).toHaveText('1', { timeout: 20_000 });
  const b = await join('  айбек ');
  await expect(board.locator('#playerCount')).toHaveText('2', { timeout: 20_000 });
  await expect(a.page.locator('#playerName')).toHaveText('Айбек');
  await expect(b.page.locator('#playerName')).toHaveText('айбек 2');
  await expect(b.page.locator('#toasts')).toContainText('войдите заново с фамилией');
  await expect(board.locator('body')).toContainText('айбек 2');

  // Тот же телефон переподключился — имя прежнее, нового игрока нет
  await b.page.reload();
  // Код в ссылке и имя в профиле — телефон входит сам
  await expect(b.page.locator('#gameScreen')).toBeVisible({ timeout: 40_000 });
  await expect(b.page.locator('#playerName')).toHaveText('айбек 2', { timeout: 40_000 });
  await expect(board.locator('#playerCount')).toHaveText('2');

  await a.ctx.close(); await b.ctx.close(); await boardCtx.close();
});

test('teacher closes joining: a new phone is turned away, an old one still reconnects', async ({ browser }) => {
  const boardCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await boardCtx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  const board = await boardCtx.newPage();
  await board.goto('/board.html?subject=math&topic=math-5-numbers&signal=' + SIG);
  await board.locator('#startLessonBtn, button').filter({ hasText: /Начать урок|Сабакты баштоо/ }).first().click();
  const codeEl = board.locator('#roomCode');
  await expect(codeEl).toHaveText(/^[A-Z0-9]{5}$/, { timeout: 30_000 });
  const code = await codeEl.textContent();

  const join = async (name) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
    const page = await ctx.newPage();
    await page.goto(`/play.html?room=${code}&signal=${SIG}`);
    await page.locator('#nameInput').fill(name);
    await page.locator('#joinBtn').click();
    return { ctx, page };
  };
  const first = await join('Айбек');
  await expect(first.page.locator('#gameScreen')).toBeVisible({ timeout: 30_000 });
  await expect(board.locator('#playerCount')).toHaveText('1', { timeout: 30_000 });

  await board.locator('#lockBtn').click();
  await expect(board.locator('#lockBtn')).toHaveAttribute('aria-pressed', 'true');

  const late = await join('Посторонний');
  await expect(late.page.locator('#toasts')).toContainText('закрыл вход', { timeout: 30_000 });
  await board.waitForTimeout(1500);
  await expect(board.locator('#playerCount')).toHaveText('1');

  // Свой телефон перезагрузился — его пускают (тот же секрет)
  await first.page.reload(); // ссылка с кодом и сохранённое имя — телефон входит сам
  await expect(first.page.locator('#gameScreen')).toBeVisible({ timeout: 30_000 });

  await board.locator('#lockBtn').click();
  await expect(board.locator('#lockBtn')).toHaveAttribute('aria-pressed', 'false');
  await late.ctx.close(); await first.ctx.close(); await boardCtx.close();
});

test('leaving the tab during a game: warning, the teacher sees it, removed after 3 times', async ({ browser }) => {
  const boardCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await boardCtx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  const board = await boardCtx.newPage();
  await board.goto('/board.html?subject=math&topic=math-5-numbers&signal=' + SIG);
  await board.locator('button').filter({ hasText: /Начать урок|Сабакты баштоо/ }).first().click();
  await expect(board.locator('#roomCode')).toHaveText(/^[A-Z0-9]{5}$/, { timeout: 30_000 });
  const code = await board.locator('#roomCode').textContent();

  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  const phone = await ctx.newPage();
  await phone.goto(`/play.html?room=${code}&signal=${SIG}`);
  await phone.locator('#nameInput').fill('Айбек');
  await phone.locator('#joinBtn').click();
  await expect(phone.locator('#gameScreen')).toBeVisible({ timeout: 30_000 });
  await expect(board.locator('#playerCount')).toHaveText('1', { timeout: 30_000 });

  // Вне игры (ожидание) выход не считается
  const leaveAndReturn = () => phone.evaluate(async () => {
    const set = (v) => Object.defineProperty(document, 'hidden', { configurable: true, get: () => v });
    set(true); document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 300));
    set(false); document.dispatchEvent(new Event('visibilitychange'));
  });
  await leaveAndReturn();
  await expect(phone.locator('#leaveWarn')).toBeHidden();

  await board.getByRole('button', { name: /Начать игру|Оюнду баштоо/ }).click();
  await expect(phone.locator('#optionsBox:not(.hidden)')).toBeVisible({ timeout: 30_000 });

  await leaveAndReturn();
  await expect(phone.locator('#leaveWarn')).toBeVisible();
  await expect(phone.locator('#leaveWarnText')).toContainText('1 из 3');
  await expect(board.locator('.leave-badge')).toHaveText('⚠ 1', { timeout: 10_000 });
  await phone.locator('#leaveWarnOk').click();

  await leaveAndReturn();
  await expect(board.locator('.leave-badge')).toHaveText('⚠ 2', { timeout: 10_000 });
  await phone.locator('#leaveWarnOk').click();

  await leaveAndReturn();
  await expect(phone.locator('#statusBox')).toContainText('удалены из игры', { timeout: 10_000 });
  await expect(board.locator('#toasts')).toContainText('удалён', { timeout: 10_000 });

  // Перезагрузка не возвращает в урок
  await phone.reload();
  await expect(phone.locator('#statusBox')).toContainText('удалены из игры', { timeout: 30_000 });
  await ctx.close(); await boardCtx.close();
});
