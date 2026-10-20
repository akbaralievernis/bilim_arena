// Каждая игра на доске: доска + 2 телефона проходят этап до экрана итогов.
// Ловим ошибки страниц (доска и телефоны), «зависание» и пустые экраны.
import { test, expect } from '@playwright/test';

const SIG = process.env.E2E_SIGNAL || 'local';
const GAMES = [
  ['quickvote', 'subject=math&topic=math-5-numbers'],
  ['errorhunt', 'game=errorhunt&subject=math&topic=math-6-fractions'],
  ['timeline', 'game=timeline&subject=kg-history&topic=kg-history-8-independence'],
  ['formula', 'game=formula&subject=math&topic=math-5-numbers'],
  ['codelock', 'game=codelock'],
  ['city', 'game=city&subject=economics&topic=economics-10-basics'],
  ['lab', 'lab=lab-ice'],
  ['investigation', 'case=case-001-museum']
];

/** Бланк обвинения: подозреваемый + нужное число улик + «Подтвердить» */
async function accuse(page) {
  const box = page.locator('#optionsBox');
  const opts = box.locator('button.option');
  if (!(await opts.count())) return false;
  const labels = box.locator('.label');
  if ((await labels.count()) < 2) return false;
  await opts.first().click();
  const hint = await page.locator('#statusBox').textContent();
  const need = Number((hint.match(/\d+/) || [3])[0]);
  const all = await opts.count();
  // Улики идут после подозреваемых: берём последние
  for (let i = all - 1, n = 0; i >= 0 && n < need; i--, n++) await opts.nth(i).click();
  await box.locator('button.primary').click();
  return true;
}

async function phoneAct(page) {
  if (await page.locator('#optionsBox .label').count() >= 2) { await accuse(page); return; }
  // Ответ: поле ввода, кнопки вариантов, обвинение — что прислала доска
  const box = page.locator('#optionsBox');
  const input = page.locator('#inputBox:not(.hidden) #answerInput');
  if (await input.count()) { await input.fill('1'); await page.locator('#sendAnswerBtn').click().catch(() => {}); return; }
  const buttons = box.locator('button:not([disabled]):visible');
  const n = await buttons.count();
  if (n) await buttons.nth(Math.floor(Math.random() * n)).click().catch(() => {});
}

for (const [id, query] of GAMES) {
  test(`board game works end to end: ${id}`, async ({ browser }) => {
    test.setTimeout(240_000);
    const errors = [];
    const watch = (page, who) => {
      page.on('pageerror', (e) => errors.push(`${who}: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) errors.push(`${who} console: ${m.text()}`); });
    };
    const boardCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await boardCtx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
    const board = await boardCtx.newPage();
    watch(board, 'board');
    await board.goto(`/board.html?${query}&signal=${SIG}`);
    await board.locator('#startLessonBtn').click();
    await expect(board.locator('#roomCode')).toHaveText(/^[A-Z0-9]{4}$/, { timeout: 30_000 });
    const code = await board.locator('#roomCode').textContent();

    const phones = [];
    for (const name of ['Айбек', 'Нурай']) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
      await ctx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
      const page = await ctx.newPage();
      watch(page, name);
      await page.goto(`/play.html?room=${code}&signal=${SIG}`);
      await page.locator('#nameInput').fill(name);
      await page.locator('#joinBtn').click();
      await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 30_000 });
      phones.push({ ctx, page });
    }
    await expect(board.locator('#playerCount')).toHaveText('2', { timeout: 20_000 });
    await board.locator('#startGameBtn').click();

    const result = board.locator('#resultScreen');
    let rounds = 0;
    for (; rounds < 150 && !(await result.isVisible()); rounds++) {
      for (const { page } of phones) await phoneAct(page);
      // Доска: кнопки хода игры (дальше / показать ответ), если игра их ждёт
      if (rounds % 6 === 5) await board.locator('#skipBtn:visible').click({ timeout: 500 }).catch(() => {});
      // Расследование: учитель начинает дело кнопкой на доске
      await board.locator('#options button.btn:visible').click({ timeout: 300 }).catch(() => {});
      await board.waitForTimeout(500);
    }
    if (!(await result.isVisible())) {
      // Не дошли — завершить вручную: кнопка должна работать
      await board.locator('#finishBtn').click({ timeout: 2000 }).catch(() => {});
    }
    await expect(result).toBeVisible({ timeout: 20_000 });
    await expect(board.locator('#resultScreen')).not.toBeEmpty();
    for (const { page } of phones) await expect(page.locator('#statusBox')).not.toBeEmpty();
    console.log(`${id}: rounds=${rounds}`);
    expect(errors).toEqual([]);
    for (const { ctx } of phones) await ctx.close();
    await boardCtx.close();
  });
}

test('investigation: a half-filled accusation is not reset when another student sends theirs', async ({ browser }) => {
  test.setTimeout(240_000);
  const boardCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await boardCtx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  const board = await boardCtx.newPage();
  await board.goto(`/board.html?case=case-001-museum&signal=${SIG}`);
  await board.locator('#startLessonBtn').click();
  await expect(board.locator('#roomCode')).toHaveText(/^[A-Z0-9]{4}$/, { timeout: 30_000 });
  const code = await board.locator('#roomCode').textContent();
  const phones = [];
  for (const name of ['Айбек', 'Нурай']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
    const page = await ctx.newPage();
    await page.goto(`/play.html?room=${code}&signal=${SIG}`);
    await page.locator('#nameInput').fill(name);
    await page.locator('#joinBtn').click();
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 30_000 });
    phones.push(page);
  }
  await board.locator('#startGameBtn').click();
  await board.locator('#options button.btn').click();
  // Все улики: телефоны отвечают, доска переходит дальше
  const form = (p) => p.locator('#optionsBox .label');
  for (let i = 0; i < 120 && (await form(phones[0]).count()) < 2; i++) {
    for (const p of phones) {
      const b = p.locator('#optionsBox button:not([disabled]):visible');
      if (await b.count()) await b.first().click().catch(() => {});
    }
    await board.locator('#skipBtn:visible').click({ timeout: 300 }).catch(() => {});
    await board.waitForTimeout(400);
  }
  await expect(form(phones[0])).toHaveCount(2, { timeout: 20_000 });
  // Айбек выбрал подозреваемого и одну улику, но ещё не отправил
  const a = phones[0].locator('#optionsBox button.option');
  await a.first().click();
  await a.last().click();
  await expect(a.first()).toHaveAttribute('aria-pressed', 'true');
  // Нурай отправляет своё обвинение — доска рассылает обновление
  await accuse(phones[1]);
  await expect(board.locator('#answeredCount')).toContainText('1', { timeout: 10_000 });
  await phones[0].waitForTimeout(1500);
  // Выбор Айбека на месте
  await expect(a.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(a.last()).toHaveAttribute('aria-pressed', 'true');
  await boardCtx.close();
});
