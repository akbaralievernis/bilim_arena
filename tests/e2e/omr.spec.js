// Точность сканера: настоящий бланк со страницы печати, «закрашенный ручкой»,
// снятый под углом, в тени, с размытием, вверх ногами и в низком разрешении.
import { test, expect } from '@playwright/test';

const TEST = {
  id: 't_omr_demo', title: 'Сканер текшерүү', subject: 'chemistry', grade: 8, topic: 'chemistry-8-basics',
  questionIds: [], createdAt: 1, updatedAt: 1792300000000
};

const SCENES = [
  { name: 'flat, good light', width: 900, css: '' },
  { name: 'tilted phone, table, shadow', width: 820, css: 'transform: perspective(1400px) rotateX(16deg) rotateY(-9deg) rotateZ(6deg);', bg: '#8a6a49', shadow: true },
  { name: 'upside down, blurred, dim', width: 860, css: 'transform: rotate(177deg); filter: blur(0.8px) brightness(0.82) contrast(0.9);', bg: '#d8d4cc' },
  { name: 'small in the frame', width: 560, css: 'transform: rotate(-4deg);', bg: '#555' },
  { name: 'sideways', width: 760, css: 'transform: rotate(91deg);', bg: '#ccc' },
  { name: 'low resolution', width: 430, css: 'transform: rotate(2deg);', bg: '#999', quality: 60 },
  { name: 'harsh light, strong JPEG', width: 800, css: 'transform: perspective(1200px) rotateX(-12deg) rotateZ(-3deg); filter: contrast(1.25) brightness(1.08);', bg: '#3b3b3b', shadow: true, quality: 45 }
];

test('scanner reads filled sheets from distorted photos', async ({ page, browser }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1200, height: 1700 });
  await page.addInitScript((t) => {
    localStorage.setItem('BA2_lang', '"ky"');
    // Тест из всех вопросов темы (выбор, несколько ответов, сопоставление, порядок)
    if (!localStorage.getItem('BA2_tests')) localStorage.setItem('BA2_tests', JSON.stringify([t]));
  }, TEST);
  await page.goto('/scan.html');
  const ids = await page.evaluate(async () => (await (await import('/core/curriculum.js')).loadBank('chemistry-8-basics')).map((q) => q.id));
  await page.evaluate((t) => localStorage.setItem('BA2_tests', JSON.stringify([t])), { ...TEST, questionIds: ids });

  await page.goto(`/print.html?test=${TEST.id}`);
  await page.locator('#pVariants').selectOption('2');
  await expect(page.locator('.p-omr svg')).toHaveCount(2);
  const svgs = await page.locator('.p-omr svg').evaluateAll((nodes) => nodes.map((n) => n.outerHTML));

  // План «ручки»: для каждого варианта случайные ответы в кружках и номер 23
  const plans = await page.evaluate(async (testId) => {
    const omr = await import('/core/omr.js');
    const tests = await import('/core/tests.js');
    const test = await tests.getTest(testId);
    const qs = await tests.testQuestions(test);
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    return [0, 1].map((v) => {
      const items = tests.buildVariant(test, qs, v, 'ky');
      const rows = omr.answerRows(items);
      const marks = [];
      const expected = rows.map((row, i) => {
        if (!row.bubbles) return null;
        const n = row.bubbles.length;
        let letters;
        if (items[i].type === 'multiple') {
          const a = Math.floor(rnd() * n);
          const b = (a + 1 + Math.floor(rnd() * (n - 1))) % n;
          letters = [a, b].sort().map((k) => 'ABCDEF'[k]).join('');
        } else letters = 'ABCDEF'[Math.floor(rnd() * n)];
        // Каждый пятый вопрос пропущен — пустая строка тоже должна читаться
        if (i % 5 === 4 && items[i].type !== 'multiple') letters = '';
        row.bubbles.forEach((bb) => { if (letters.includes(bb.letter)) marks.push(bb); });
        return letters;
      });
      const [tens, units] = omr.numberBubbles();
      marks.push(tens[2], units[3]);
      return { marks, expected };
    });
  }, TEST.id);

  const ctx = await browser.newContext({ viewport: { width: 1200, height: 1500 } });
  const studio = await ctx.newPage();
  const shots = [];
  for (const [v, svg] of svgs.entries()) {
    // Закрашиваем «ручкой»: синий, чуть неровный, со смещением
    // Ручка, карандаш и неполная закраска вперемешку
    const ink = plans[v].marks.map((b, k) => {
      const dx = ((k * 37) % 7 - 3) * 0.12;
      const dy = ((k * 53) % 7 - 3) * 0.1;
      const style = k % 3;
      const [rx, ry, fill, op] = style === 0 ? [2.25, 2.0, '#1f2d7a', 0.88] : style === 1 ? [2.1, 1.9, '#4a4a4a', 0.62] : [1.6, 1.5, '#111', 0.9];
      return `<ellipse cx="${b.x + dx}" cy="${b.y + dy}" rx="${rx}" ry="${ry}" transform="rotate(${(k * 29) % 40 - 20} ${b.x} ${b.y})" fill="${fill}" fill-opacity="${op}"/>`;
    }).join('');
    const filled = svg.replace('</svg>', `${ink}</svg>`);
    for (const scene of SCENES) {
      await studio.setContent(`<html><body style="margin:0;background:${scene.bg || '#fff'};display:grid;place-items:center;min-height:1500px">
        <div style="position:relative;width:${scene.width}px;background:#fff;${scene.css}">
          ${filled.replace(/width="[^"]+mm" height="[^"]+mm"/, 'width="100%"')}
          ${scene.shadow ? '<div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(0,0,0,.38),rgba(0,0,0,0) 55%)"></div>' : ''}
        </div></body></html>`);
      const png = await studio.screenshot({ type: 'jpeg', quality: scene.quality || 80 });
      shots.push({ v, scene: scene.name, b64: png.toString('base64') });
    }
  }
  await ctx.close();

  // Распознаём каждый «снимок» на странице сайта тем же кодом, что и сканер
  await page.goto('/scan.html');
  const results = await page.evaluate(async ({ shots, testId }) => {
    const omr = await import('/core/omr.js');
    const tests = await import('/core/tests.js');
    const test = await tests.getTest(testId);
    const qs = await tests.testQuestions(test);
    const out = [];
    for (const s of shots) {
      const bin = atob(s.b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/jpeg' });
      const bmp = await createImageBitmap(blob);
      const c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(bmp, 0, 0);
      const t0 = performance.now();
      const det = omr.detectSheet(ctx.getImageData(0, 0, c.width, c.height), { maxSide: 1400 });
      if (!det) { out.push({ scene: s.scene, v: s.v, found: false }); continue; }
      const items = tests.buildVariant(test, qs, det.code.variant, 'ky');
      const read = omr.readSheet(det, items);
      out.push({
        scene: s.scene, v: s.v, found: true, variant: det.code.variant, testOk: det.code.test === omr.testCode(testId),
        number: read.number, letters: read.rows.map((r) => (r.kind === 'bubbles' ? r.letters : null)),
        statuses: read.rows.map((r) => r.status || null), ms: Math.round(performance.now() - t0)
      });
    }
    return out;
  }, { shots, testId: TEST.id });

  for (const r of results) {
    const where = `${r.scene} (вариант ${r.v})`;
    expect(r.found, `${where}: sheet found`).toBe(true);
    expect(r.testOk, `${where}: test code`).toBe(true);
    expect(r.variant, `${where}: variant`).toBe(r.v);
    expect(r.number, `${where}: student number`).toBe(23);
    expect(r.letters, `${where}: answers`).toEqual(plans[r.v].expected);
    expect(r.statuses.filter((s) => s && s !== 'ok' && s !== 'blank'), `${where}: no unclear rows`).toEqual([]);
  }
  console.log('OMR timing, ms:', results.map((r) => `${r.scene}/${r.v}: ${r.ms}`).join(' · '));
});

test('scanner never invents a sheet, ignores an erased smudge, flags two marks in one row', async ({ page, browser }) => {
  await page.addInitScript((t) => localStorage.setItem('BA2_tests', JSON.stringify([t])), { ...TEST, questionIds: ['ch01', 'ch03', 'ch04', 'ch05', 'ch06'] });
  // Обычные страницы сайта (без бланка) — сканер должен сказать «не найдено»
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1300 } });
  const shot = await ctx.newPage();
  const pages = [];
  for (const p of ['/index.html', `/print.html?test=${TEST.id}`]) {
    await shot.addInitScript((t) => localStorage.setItem('BA2_tests', JSON.stringify([t])), { ...TEST, questionIds: ['ch01', 'ch03', 'ch04', 'ch05', 'ch06'] });
    await shot.goto(`http://localhost:8766${p}`);
    if (p.startsWith('/print')) await shot.locator('#pGrid').uncheck();
    await shot.waitForTimeout(500);
    pages.push((await shot.screenshot({ type: 'jpeg', quality: 80 })).toString('base64'));
  }
  // Строка 1: ответ ручкой и рядом слабое пятно (стёртый карандаш) — ответ не меняется.
  // Строка 2: две заметные отметки (ручка и карандаш) — сканер просит учителя проверить.
  await shot.goto(`http://localhost:8766/print.html?test=${TEST.id}`);
  await shot.locator('#pVariants').selectOption('1');
  const svg = await shot.locator('.p-omr svg').first().evaluate((n) => n.outerHTML);
  const rows = await shot.evaluate(async (id) => {
    const omr = await import('/core/omr.js');
    const tests = await import('/core/tests.js');
    const test = await tests.getTest(id);
    return omr.answerRows(tests.buildVariant(test, await tests.testQuestions(test), 0, 'ky'));
  }, TEST.id);
  const [r0, r1] = rows.filter((r) => r.bubbles && r.bubbles.length >= 3);
  const dot = (b, fill, op) => `<ellipse cx="${b.x}" cy="${b.y}" rx="2.2" ry="2" fill="${fill}" fill-opacity="${op}"/>`;
  const ink = dot(r0.bubbles[0], '#1f2d7a', 0.9) + dot(r0.bubbles[1], '#888', 0.32)
    + dot(r1.bubbles[1], '#1f2d7a', 0.9) + dot(r1.bubbles[2], '#4a4a4a', 0.62);
  await shot.setContent(`<body style="margin:0;background:#fff"><div style="width:900px">${svg.replace('</svg>', `${ink}</svg>`).replace(/width="[^"]+mm" height="[^"]+mm"/, 'width="100%"')}</div></body>`);
  const faint = (await shot.screenshot({ type: 'jpeg', quality: 85, fullPage: true })).toString('base64');
  await ctx.close();

  await page.goto('/scan.html');
  const out = await page.evaluate(async ({ pages, faint, id }) => {
    const omr = await import('/core/omr.js');
    const tests = await import('/core/tests.js');
    const load = async (b64) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
      const c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      c.getContext('2d').drawImage(bmp, 0, 0);
      return c.getContext('2d').getImageData(0, 0, c.width, c.height);
    };
    const none = [];
    for (const p of pages) none.push(omr.detectSheet(await load(p)));
    const det = omr.detectSheet(await load(faint));
    const test = await tests.getTest(id);
    const read = omr.readSheet(det, tests.buildVariant(test, await tests.testQuestions(test), 0, 'ky'));
    const [first, second] = read.rows.filter((r) => r.kind === 'bubbles' && r.values.length >= 3);
    const view = (r) => ({ letters: r.letters, status: r.status, values: r.values.map((v) => +v.toFixed(3)) });
    return { none: none.map((d) => d === null), first: view(first), second: view(second) };
  }, { pages, faint, id: TEST.id });

  console.log('darkness — smudge row:', out.first.values.join(' '), '| two marks:', out.second.values.join(' '));
  expect(out.none).toEqual([true, true]);
  expect(out.first).toMatchObject({ letters: 'A', status: 'ok' });
  expect(['multi', 'unsure']).toContain(out.second.status);
});
