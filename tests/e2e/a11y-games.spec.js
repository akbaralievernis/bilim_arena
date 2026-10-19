// Доступность отдельных игр (axe-core): серьёзные нарушения — в отчёт.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const GAMES = ['flashcards', 'word-match', 'wordle', 'word-rain', 'balloons', 'sentence', 'odd-one-out', 'focus-duel', 'citadel', 'eagle', 'reaction', 'mafia', 'english-city', 'story-lab', 'picture-detective'];

test('standalone games have no serious accessibility problems', async ({ page }) => {
  test.setTimeout(240_000);
  const found = [];
  for (const g of GAMES) {
    await page.goto(`/games/${g}/index.html?lang=ky`);
    await page.waitForTimeout(800);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .forEach((v) => found.push(`${g}: ${v.id} (${v.impact}) × ${v.nodes.length} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`));
  }
  console.log(found.join('\n') || 'no serious issues');
  expect(found).toEqual([]);
});
