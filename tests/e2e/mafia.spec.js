// «Мафия»: ведущий создаёт комнату, игроки входят (один — кодом на кириллице),
// игра начинается, у каждого своя роль.
import { test, expect } from '@playwright/test';

const SIG = process.env.E2E_SIGNAL || 'local';
const URL = `/games/mafia/index.html?signal=${SIG}`;
const LAT = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х' };

async function open(browser, lang = 'ru') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((l) => { localStorage.setItem('mafia_lang', l); localStorage.setItem('BA2_lang', JSON.stringify(l)); }, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

test('host + 3 players: Cyrillic code works, the game starts with roles', async ({ browser }) => {
  test.setTimeout(150_000);
  const host = await open(browser);
  await host.page.goto(URL);
  await host.page.getByPlaceholder(/имя|Атыңыз|name/i).fill('Ведущий');
  await host.page.getByRole('button', { name: /Создать|түзүү|Create/i }).click();
  const codeEl = host.page.locator('span', { hasText: /^[A-Z0-9]{4}$/ }).first();
  await expect(codeEl).toBeVisible({ timeout: 40_000 });
  const code = (await codeEl.textContent()).trim();

  const players = [];
  for (const [i, name] of ['Айбек', 'Нурай', 'Бекзат'].entries()) {
    const p = await open(browser);
    await p.page.goto(URL);
    await p.page.getByPlaceholder(/имя|Атыңыз|name/i).fill(name);
    const typed = i === 0 ? [...code].map((c) => LAT[c] || c).join('').toLowerCase() : code;
    await p.page.getByPlaceholder(/M4FA/).pressSequentially(typed);
    await expect(p.page.getByPlaceholder(/M4FA/)).toHaveValue(code);
    await p.page.getByRole('button', { name: /Присоединиться|кошулуу|Join/i }).click();
    await expect(p.page.getByText(/Ждём|күтүңүз|Waiting/i).first()).toBeVisible({ timeout: 40_000 });
    players.push(p);
  }
  for (const name of ['Айбек', 'Нурай', 'Бекзат']) await expect(host.page.getByText(name).first()).toBeVisible({ timeout: 20_000 });

  await host.page.getByRole('button', { name: /Начать игру|Оюнду баштоо|Start/i }).click();
  // У каждого игрока появилась роль
  for (const p of players) await expect(p.page.locator('body')).toContainText(/Мафия|Дон|Доктор|Врач|Комиссар|Маньяк|Мирный|житель/i, { timeout: 40_000 });

  for (const x of [host, ...players]) expect(x.errors, 'page errors').toEqual([]);
  for (const x of [host, ...players]) await x.ctx.close();
});
