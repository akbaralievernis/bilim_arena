// «Билим түндүгү» ученика и «Боз үй класса» учителя.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const axeSerious = async (page) => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze())
  .violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);

test('knowledge tunduk: a ray per topic, mastered rays lit, a ray opens practice', async ({ page }) => {
  const T = 'math-6-fractions';
  await page.addInitScript((t) => {
    localStorage.setItem('BA2_lang', '"ru"');
    localStorage.setItem('BA2_progress', JSON.stringify({ xp: 200, topics: { [t]: { answered: 20, correct: 18, lastAt: Date.now() } },
      checks: { [t]: [{ at: Date.now(), correct: 9, total: 10 }] }, games: { quickvote: { plays: 1 } }, skills: {}, qs: {}, path: {}, badges: [] }));
  }, T);
  await page.goto('/progress.html');
  const map = page.locator('#tundukSection');
  await expect(map).toBeVisible();
  await expect(map.locator('.tm-ray')).toHaveCount(17);
  await expect(map.locator('.tm-ray.tm-mastered')).toHaveCount(1);
  await expect(map.locator('.tm-center')).toContainText('1/17');
  const ray = map.locator('.tm-ray.tm-mastered');
  await ray.focus();
  await expect(map.locator('.tm-center')).toContainText('Дроби');
  await expect(ray).toHaveAttribute('href', /practice\.html\?subject=math&topic=math-6-fractions/);
  expect(await axeSerious(page)).toEqual([]);
});

test('class yurt: a topic mastered by the class builds the next part, the rest is planned', async ({ page }) => {
  const T = 'math-6-fractions', H = 'kg-history-8-independence', now = Date.now(), D = 86400000;
  const check = (id, topic, at, results) => ({
    v: 2, id, at, endedAt: at, subject: 'x', topic, mode: 'paper-check', stages: [], answered: 1, correct: 1, bySkill: {},
    students: Object.fromEntries(results.map(([name, ok]) => [name.toLowerCase(), { name, answered: 10, correct: ok, score: 0, bySkill: { [`${topic}::s`]: { ok, total: 10 } }, wrong: [] }]))
  });
  await page.addInitScript((d) => {
    localStorage.setItem('BA2_lang', '"ru"');
    localStorage.setItem('BA2_classes', JSON.stringify([{ id: 'k6', name: '6-А', grade: 6, students: ['Айбек', 'Нурай', 'Азат', 'Бекзат'] }]));
    localStorage.setItem('BA2_cycles', JSON.stringify([
      { id: 'c1', topic: d.T, subject: 'math', classId: 'k6', from: d.now - 20 * d.D, to: d.now + d.D, threshold: 80 },
      { id: 'c2', topic: d.H, subject: 'kg-history', classId: 'k6', from: d.now - 20 * d.D, to: d.now + d.D, threshold: 80 }
    ]));
    localStorage.setItem('BA2_lessons', JSON.stringify(d.lessons));
  }, { T, H, now, D, lessons: [
    check('l1', T, now - 2 * D, [['Айбек', 9], ['Нурай', 8], ['Азат', 10], ['Бекзат', 9]]),   // все сдали — построено
    check('l2', H, now - D, [['Айбек', 9], ['Нурай', 4], ['Азат', 5]])                       // 1 из 4 — строится
  ] });
  await page.goto('/reports.html?view=cycles');
  const card = page.locator('#yurtBox .yurt-card');
  await expect(card).toContainText('Боз үй класса: 6-А');
  await expect(card).toContainText('Тем освоено классом: 1');
  await expect(card.locator('.yurt-parts li').first()).toContainText('Кереге (решётчатые стены) — Дроби');
  await expect(card.locator('.yurt-parts li').nth(1)).toContainText('построится, когда класс освоит следующую тему');
  await expect(card).toContainText('(1/4)');
  await expect(card.locator('.yp-done')).toHaveCount(1);
  await expect(card.locator('.yp-todo')).toHaveCount(7);
  expect(await axeSerious(page)).toEqual([]);

  // На главной учителя — маленькая юрта со ссылкой на цикл
  await page.goto('/teacher.html');
  const mini = page.locator('#yurtMini');
  await expect(mini).toBeVisible();
  await expect(mini).toContainText('Боз үй класса: 6-А');
  await expect(mini.locator('.yp-done')).toHaveCount(1);
  await expect(mini).toHaveAttribute('href', /reports\.html\?view=cycles/);
  expect(await axeSerious(page)).toEqual([]);
});
