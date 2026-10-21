// «Мафия»: ведущий создаёт комнату, игроки входят (один — кодом на кириллице),
// игра начинается, у каждого своя роль; на экране ведущего (он на интерактивной доске) ролей нет, звучит голос.
import { test, expect } from '@playwright/test';

const SIG = process.env.E2E_SIGNAL || 'local';
const PAGE = `/games/mafia/index.html?signal=${SIG}`;
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
  // Готовая запись ElevenLabs есть только для фразы «ночь» (ru) — её и должна сыграть игра;
  // для фразы с другим текстом (устаревшая запись) — нет
  const voiceRequests = [];
  await host.page.route('**/voice/manifest.json', (r) => r.fulfill({ json: {
    ru: { night_start: { file: 'ru/night_start.mp3', text: 'Наступает ночь. Весь город засыпает.' },
      mafia: { file: 'ru/mafia.mp3', text: 'старый текст' } }
  } }));
  await host.page.route('**/voice/**/*.mp3', (r) => { voiceRequests.push(new URL(r.request().url()).pathname); return r.fulfill({ status: 404 }); });
  await host.page.goto(PAGE);
  await host.page.getByPlaceholder(/имя|Атыңыз|name/i).fill('Ведущий');
  await host.page.getByRole('button', { name: /Создать|түзүү|Create/i }).click();
  const codeEl = host.page.locator('span', { hasText: /^[A-Z0-9]{5}$/ }).first();
  await expect(codeEl).toBeVisible({ timeout: 40_000 });
  const code = (await codeEl.textContent()).trim();

  const players = [];
  for (const [i, name] of ['Айбек', 'Нурай', 'Бекзат'].entries()) {
    const p = await open(browser);
    await p.page.goto(PAGE);
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

  await expect.poll(() => voiceRequests.some((u) => u.endsWith('/voice/ru/night_start.mp3')), { timeout: 15_000 }).toBe(true);
  expect(voiceRequests.some((u) => u.endsWith('/ru/mafia.mp3'))).toBe(false);
  // Экран ведущего видит весь класс (интерактивная доска): ролей живых игроков на нём нет — ни подписей, ни значков
  const ROLE = /Мафия|Дон|Доктор|Комиссар|Маньяк|Мирный|житель|Гипн|Телохран/i;
  await expect(host.page.locator('.host-view-head')).toBeVisible();
  for (const card of await host.page.locator('.player-card').all()) await expect(card).not.toContainText(ROLE);
  // В «Статусе игроков» у живых нет значков ролей (щит, прицел, сердце…)
  await expect(host.page.locator('div:has(> span.status-alive)').first()).toBeVisible();
  expect(await host.page.locator('div:has(> span.status-alive) svg').count()).toBe(0);
  // А игрок — только свою: у второго игрока в карточке первого роли нет
  await expect(players[1].page.locator('.player-card', { hasText: 'Айбек' })).not.toContainText(/Мафия|Дон|Доктор|Комиссар|Маньяк|Мирный|Гипн|Телохран/i);

  for (const x of [host, ...players]) expect(x.errors, 'page errors').toEqual([]);
  for (const x of [host, ...players]) await x.ctx.close();
});

test('a whole game from the first night to the final screen, without page errors', async ({ browser }) => {
  // Случайные ходы: партия иногда длится дольше 5 минут на загруженной машине
  test.setTimeout(600_000);
  const host = await open(browser, 'ky');
  await host.page.goto(PAGE);
  await host.page.getByPlaceholder(/Атыңыз/).fill('Мугалим');
  await host.page.getByRole('button', { name: /түзүү/ }).click();
  const codeEl = host.page.locator('span', { hasText: /^[A-Z0-9]{5}$/ }).first();
  await expect(codeEl).toBeVisible({ timeout: 40_000 });
  const code = (await codeEl.textContent()).trim();
  const players = [];
  for (const name of ['Айбек', 'Нурай', 'Бекзат', 'Айпери', 'Нурлан']) {
    const p = await open(browser, 'ky');
    await p.page.goto(`${PAGE}&room=${code}`);
    await p.page.getByPlaceholder(/Атыңыз/).fill(name);
    await p.page.getByRole('button', { name: /кошулуу/ }).click();
    await expect(p.page.getByText(/күтүңүз/).first()).toBeVisible({ timeout: 40_000 });
    players.push(p);
  }
  await host.page.getByRole('button', { name: /Оюнду баштоо/ }).click();
  for (const p of players) await p.page.getByRole('button', { name: 'OK' }).click({ timeout: 20_000 }).catch(() => {});

  const end = host.page.locator('.end-screen');
  const seen = new Set();
  for (let i = 0; i < 400 && !(await end.isVisible()); i++) {
    // Игроки: кто может выбрать — выбирает первого доступного и подтверждает
    for (const p of players) {
      const card = p.page.locator('.player-card.can-select:not(.dead)');
      if (await card.count()) {
        await card.last().click({ timeout: 2000 }).catch(() => {});
        await p.page.locator('.confirm-bar button').click({ timeout: 1000 }).catch(() => {});
      }
    }
    // Ограничение по времени: в части фаз заголовка нет, и без него тест ждал бы до конца лимита
    seen.add(await host.page.locator('.host-view-head h3').textContent({ timeout: 1000 }).catch(() => ''));
    // Ведущий двигает игру дальше
    await host.page.locator('.host-advance').click({ timeout: 1000 }).catch(() => {});
    await host.page.waitForTimeout(600);
  }
  await expect(end).toBeVisible();
  await expect(end).toContainText(/оюн бүттү/i);
  // Итоги ролей: все пять игроков (и боты, если были)
  expect(await end.locator('.roles-summary__row').count()).toBeGreaterThanOrEqual(players.length);
  for (const p of players) await expect(p.page.locator('.end-screen')).toBeVisible({ timeout: 20_000 });
  expect([...seen].join(' | ')).toMatch(/Түн/);
  expect([...seen].join(' | ')).toMatch(/Добуш|Күн/);

  // Ведущий возвращает всех в лобби — игра готова к новому кругу
  await host.page.getByRole('button', { name: /Лоббиге/ }).click();
  await expect(host.page.getByRole('button', { name: /Оюнду баштоо/ })).toBeVisible({ timeout: 20_000 });
  for (const x of [host, ...players]) expect(x.errors, 'page errors').toEqual([]);
  for (const x of [host, ...players]) await x.ctx.close();
});
