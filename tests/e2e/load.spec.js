// Нагрузка: класс входит одновременно. По умолчанию 20 телефонов (E2E_PHONES=40 — больше).
// Запуск: npx playwright test tests/e2e/load.spec.js --project=load
import { test, expect } from '@playwright/test';

const N = Number(process.env.E2E_PHONES || 20);
const STAGGER = Number(process.env.E2E_STAGGER || 0);
const SIG = process.env.E2E_SIGNAL || 'local';

test(`${N} phones join at once`, async ({ browser }, info) => {
  // Только по явному запросу: npx playwright test --project=load
  test.skip(info.project.name !== 'load', 'нагрузочный тест запускается отдельно');
  test.setTimeout(240_000);
  const boardCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await boardCtx.addInitScript(() => localStorage.setItem('BA2_lang', '"ky"'));
  const board = await boardCtx.newPage();
  await board.goto(`/board.html?subject=math&topic=math-5-numbers&signal=${SIG}`);
  await board.getByRole('button', { name: 'Сабакты баштоо' }).first().click();
  await expect(board.locator('#roomCode')).toHaveText(/^[A-Z0-9]{4}$/, { timeout: 30_000 });
  const code = await board.locator('#roomCode').textContent();

  // Все телефоны в одном браузере (так легче компьютеру), у каждого своё хранилище
  const phones = await Promise.all(Array.from({ length: N }, async (_, i) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 700 } });
    const page = await ctx.newPage();
    const log = [];
    page.on('console', (m) => log.push(m.type() + ': ' + m.text()));
    page.on('pageerror', (e) => log.push('pageerror: ' + e.message));
    page.on('requestfailed', (r) => log.push('failed: ' + r.url()));
    await page.goto(`/play.html?room=${code}&signal=${SIG}`);
    if (!(await page.locator('#joinBtn').isEnabled({ timeout: 30_000 }).catch(() => false))) {
      await page.waitForTimeout(30_000).catch(() => {});
      console.log(`STUCK phone ${i + 1}:`, await page.locator('#joinBtn').isEnabled(), log.slice(-8).join(' | '));
    }
    await expect(page.locator('#joinBtn')).toBeEnabled({ timeout: 30_000 });
    await page.locator('#nameInput').fill(`Окуучу ${i + 1}`);
    return { ctx, page };
  }));

  // Время меряет сама страница: от нажатия «Кирүү» до игрового экрана
  // (замеры Playwright включали бы его собственную очередь команд)
  await Promise.all(phones.map(({ page }) => page.evaluate(() => {
    window.__join = {};
    document.getElementById('joinBtn').addEventListener('click', () => { window.__join.t0 = performance.now(); }, { capture: true });
    new MutationObserver(() => {
      if (!document.getElementById('gameScreen').classList.contains('hidden') && !window.__join.t1) window.__join.t1 = performance.now();
    }).observe(document.getElementById('gameScreen'), { attributes: true });
  })));
  const started = Date.now();
  // E2E_STAGGER=15000 — ученики входят не одновременно, а в течение 15 с, как в классе
  const stagger = Number(process.env.E2E_STAGGER || 0);
  await Promise.all(phones.map(({ page }) => page.evaluate((delay) => setTimeout(() => document.getElementById('joinBtn').click(), delay), Math.random() * stagger)));
  await Promise.all(phones.map(({ page }) => expect(page.locator('#gameScreen')).toBeVisible({ timeout: 120_000 })));
  const times = await Promise.all(phones.map(({ page }) => page.evaluate(() => Math.round(window.__join.t1 - window.__join.t0))));
  await expect(board.locator('#playerCount')).toHaveText(String(N), { timeout: 60_000 });
  const all = Date.now() - started;

  times.sort((a, b) => a - b);
  const p = (q) => times[Math.min(times.length - 1, Math.floor(q * times.length))];
  console.log(`JOIN ${N} phones${STAGGER ? ` over ${STAGGER / 1000} s` : ' at once'}: median ${p(0.5)} ms, p90 ${p(0.9)} ms, slowest ${times.at(-1)} ms, whole class ${all} ms`);
  expect(p(0.9)).toBeLessThan(30_000);

  for (const { ctx } of phones) await ctx.close();
  await boardCtx.close();
});
