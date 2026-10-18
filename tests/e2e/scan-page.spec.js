// Страница «Сканер»: фото заполненного бланка → имя из списка класса → учитель
// отмечает письменный ответ → «Сохранить в отчёты» → ученик в отчётах.
import { test, expect } from '@playwright/test';

const T = {
  id: 't_scan_ui', title: 'Бөлчөктөр', subject: 'math', grade: 6, topic: 'math-6-fractions',
  questionIds: ['f01', 'f02', 'f03', 'f04', 'f05', 'f15'], createdAt: 1, updatedAt: 1792300000000
};
const CLASS = { id: 'c_demo', name: '6-А', grade: 6, students: ['Айбек', 'Нурай', 'Азат'] };

test('scan page: upload a photo, confirm, save to reports', async ({ page, browser }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await page.addInitScript(({ t, c }) => {
    localStorage.setItem('BA2_lang', '"ru"');
    if (!localStorage.getItem('BA2_tests')) localStorage.setItem('BA2_tests', JSON.stringify([t]));
    if (!localStorage.getItem('BA2_classes')) localStorage.setItem('BA2_classes', JSON.stringify([c]));
  }, { t: T, c: CLASS });

  // Бланк варианта A: ученик №2, все кружки — по ключу, кроме первого вопроса
  await page.goto(`/print.html?test=${T.id}`);
  await page.locator('#pVariants').selectOption('1');
  const svg = await page.locator('.p-omr svg').first().evaluate((n) => n.outerHTML);
  const plan = await page.evaluate(async (id) => {
    const omr = await import('/core/omr.js');
    const tests = await import('/core/tests.js');
    const test = await tests.getTest(id);
    const items = tests.buildVariant(test, await tests.testQuestions(test), 0, 'ru');
    const rows = omr.answerRows(items);
    const marks = [];
    rows.forEach((row, i) => {
      if (!row.bubbles) return;
      const key = items[i].key;
      const letter = i === 0 ? row.bubbles.find((b) => !key.includes(b.letter)).letter : key;
      row.bubbles.forEach((b) => { if (letter.includes(b.letter)) marks.push(b); });
    });
    const [tens, units] = omr.numberBubbles();
    marks.push(units[2]);
    return { marks, total: items.length };
  }, T.id);
  const ink = plan.marks.map((b) => `<ellipse cx="${b.x}" cy="${b.y}" rx="2.2" ry="2" fill="#1f2d7a" fill-opacity="0.9"/>`).join('');
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
  const studio = await ctx.newPage();
  await studio.setContent(`<body style="margin:0;background:#777;display:grid;place-items:center;min-height:1400px"><div style="width:820px;background:#fff;transform:rotate(-5deg)">${svg.replace('</svg>', `${ink}</svg>`).replace(/width="[^"]+mm" height="[^"]+mm"/, 'width="100%"')}</div></body>`);
  const photo = await studio.screenshot({ type: 'jpeg', quality: 80 });
  await ctx.close();

  await page.goto('/scan.html');
  await page.locator('#classSel').selectOption('c_demo');
  await page.locator('#isCheck').check();
  await page.locator('#fileInput').setInputFiles({ name: 'sheet.jpg', mimeType: 'image/jpeg', buffer: photo });

  await expect(page.locator('#resultCard')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#resNumber')).toHaveValue('2');
  await expect(page.locator('#resName')).toHaveValue('Нурай');
  // Письменный ответ (f15) ждёт решения учителя — до этого сохранить нельзя
  await expect(page.locator('#acceptBtn')).toBeDisabled();
  await page.locator('#resIssues button', { hasText: '✓' }).click();
  await expect(page.locator('#acceptBtn')).toBeEnabled();
  // Первый вопрос отмечен неверно, остальные верно, письменный — верно
  await expect(page.locator('#resScore')).toHaveText(`${plan.total - 1}/${plan.total}`);
  await page.locator('#acceptBtn').click();
  await expect(page.locator('#sessionList')).toContainText('Нурай');

  await page.locator('#finishBtn').click();
  await expect(page).toHaveURL(/reports\.html/);
  await expect(page.locator('#lessonList')).toContainText('Бумажная проверка');
  expect(problems).toEqual([]);
});
