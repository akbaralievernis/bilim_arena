// Доступность (axe-core): нет серьёзных нарушений на главных страницах и экранах.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['index', 'games', 'practice', 'progress', 'profile', 'tasks', 'speak', 'account', 'race', 'teacher',
  'homework', 'questions', 'reports', 'board', 'play', 'privacy', 'terms', 'tests', 'scan', 'report', 'print', 'wordset'];

/** Только серьёзные и критические нарушения — их нужно исправлять обязательно */
async function audit(page, where) {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return res.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${where}: ${v.id} (${v.impact}) × ${v.nodes.length} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

test('main pages have no serious accessibility problems', async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ky"'));
  const found = [];
  for (const name of PAGES) {
    await page.goto(`/${name}.html`);
    await page.waitForTimeout(500);
    found.push(...await audit(page, name));
  }
  // Экраны внутри страниц: практика (путь по теме и вопрос), конструктор теста
  await page.goto('/practice.html?topic=math-6-fractions');
  await page.waitForTimeout(500);
  found.push(...await audit(page, 'practice: topic path'));
  await page.locator('#startBtn').click();
  await page.waitForTimeout(500);
  found.push(...await audit(page, 'practice: question'));
  await page.goto('/tests.html');
  await page.locator('#createBtn').click();
  await page.waitForTimeout(500);
  found.push(...await audit(page, 'tests: builder'));
  console.log(found.join('\n') || 'no serious issues');
  expect(found).toEqual([]);
});
