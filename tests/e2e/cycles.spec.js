// Учебный цикл по теме: учитель создаёт цикл, видит первую и последнюю проверку,
// изменение в п.п., пробелы по навыкам и честные предупреждения.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const T = 'math-6-fractions';
const DAY = 86400000;
const now = Date.now();

/** Бумажная проверка: { имя: [[навык, верно, всего], …] } */
const check = (id, at, students) => ({
  v: 2, id, at, endedAt: at, subject: 'math', topic: T, mode: 'paper-check', stages: [{ gameId: 'paper', at, answered: 1, correct: 1 }],
  answered: 1, correct: 1, bySkill: {},
  students: Object.fromEntries(Object.entries(students).map(([name, skills]) => [name.toLowerCase(), {
    name, score: 0,
    answered: skills.reduce((s, x) => s + x[2], 0), correct: skills.reduce((s, x) => s + x[1], 0),
    bySkill: Object.fromEntries(skills.map(([sk, ok, total]) => [`${T}::${sk}`, { ok, total }])),
    wrong: ['f01']
  }]))
});

test('teacher creates a topic cycle and sees first vs latest check, gaps and warnings', async ({ page }) => {
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('BA2_lang', '"ru"');
    localStorage.setItem('BA2_lessons', JSON.stringify(data.lessons));
    localStorage.setItem('BA2_classes', JSON.stringify([{ id: 'k6', name: '6-А', grade: 6, students: ['Айбек', 'Нурай', 'Азат'] }]));
  }, {
    lessons: [
      check('l1', now - 3 * DAY, { 'Айбек': [['compare', 1, 4], ['add', 1, 4]], 'Нурай': [['compare', 3, 4], ['add', 2, 4]] }),
      check('l2', now - DAY, { 'Айбек': [['compare', 4, 4], ['add', 2, 4]] })
    ]
  });

  await page.goto('/reports.html?view=cycles');
  await expect(page.locator('#cycleList')).toContainText('Циклов пока нет');
  await page.locator('#cycleNewBtn').click();
  await page.locator('#cySubject').selectOption('math');
  await page.locator('#cyTopic').selectOption(T);
  await page.locator('#cyClass').selectOption('k6');
  await page.locator('#cyThreshold').fill('70');

  // Неверные даты — понятная ошибка, ничего не сохраняется
  await page.locator('#cyTo').fill('2020-01-01');
  await page.locator('#cySaveBtn').click();
  await expect(page.locator('#cyFormError')).toContainText('конец не может быть раньше начала');

  const d = new Date(now - 10 * DAY);
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  await page.locator('#cyFrom').fill(iso(d));
  await page.locator('#cyTo').fill(iso(new Date(now + 20 * DAY)));
  await page.locator('#cyGoal').fill('Сравнивает и складывает дроби');
  await page.locator('#cySaveBtn').click();

  const detail = page.locator('#cycleDetail');
  await expect(detail).toContainText('Сравнивает и складывает дроби');
  await expect(detail).toContainText('6-А');
  // Айбек: 2/8 = 25 % → 6/8 = 75 %, +50 п.п.; Нурай — одна проверка; Азат — без проверки
  const aibek = detail.locator('tr', { hasText: 'Айбек' });
  await expect(aibek).toContainText('25%');
  await expect(aibek).toContainText('75%');
  await expect(aibek).toContainText('+50 п.п.');
  await expect(aibek).toContainText('Порог достигнут');
  await expect(detail.locator('tr', { hasText: 'Нурай' })).toContainText('Пока не достигнут');
  await expect(detail.locator('tr', { hasText: 'Азат' })).toContainText('Нет проверки');
  await expect(detail).toContainText('1 учеников ещё не прошли проверку');
  await expect(detail).toContainText('только одна проверка');
  await expect(detail).toContainText('не доказывает');
  // Навык «сложение» у Айбека 2/4 — ниже порога: рекомендация и кнопка повторения на доске
  await expect(detail.locator('.cy-list').first()).toContainText('Объясните ещё раз');
  await expect(detail.locator('a', { hasText: 'Повторить на доске' })).toHaveAttribute('href', /mode=review/);
  await expect(detail.locator('a', { hasText: 'Итоговая проверка' })).toHaveAttribute('href', /check=1/);

  // Доступность и телефон 360 px: нет серьёзных нарушений и горизонтальной прокрутки страницы
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
  await page.setViewportSize({ width: 360, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 1280, height: 720 });

  // После перезагрузки цикл на месте; удаление — с подтверждением, результаты остаются
  await page.reload();
  await page.locator('#tabCycles').click();
  await expect(page.locator('#cycleList .rep-row')).toHaveCount(1);
  await page.locator('#cycleList .rep-row').click();
  page.once('dialog', (dlg) => dlg.accept());
  await page.locator('#cycleDetail button', { hasText: 'Удалить' }).click();
  await expect(page.locator('#cycleList')).toContainText('Циклов пока нет');
  await page.locator('#tabLessons').click();
  await expect(page.locator('#lessonList .rep-row')).toHaveCount(2);
});

for (const lang of ['ky', 'en']) {
  test(`topic cycle tab is translated (${lang})`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('BA2_lang', JSON.stringify(l)), lang);
    await page.goto('/reports.html?view=cycles');
    await expect(page.locator('#tabCycles')).toHaveText(lang === 'ky' ? 'Тема боюнча цикл' : 'Topic cycle');
    await page.locator('#cycleNewBtn').click();
    await expect(page.locator('#cyGoal')).toHaveAttribute('placeholder', lang === 'ky' ? /бөлчөктөрдү/ : /fractions/);
  });
}
