// Админ-панель и «Предложить в общий банк» (ТЗ docs/TZ-ADMIN-2026-10.md).
// База подменяется: запросы к Supabase перехватываются, сессия кладётся в localStorage, как после входа.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const REF = 'udkxmgflbxetfzziftla';
const USER = { id: '0f0f0f0f-0000-4000-8000-000000000001', email: 'owner@school.kg', is_anonymous: false, aud: 'authenticated', role: 'authenticated', user_metadata: { name: 'Владелец' }, app_metadata: {} };

/** Вошедший учитель: сессия supabase-js, как её сохраняет библиотека */
async function signedIn(page) {
  await page.addInitScript(({ key, user }) => {
    localStorage.setItem('BA2_lang', '"ru"');
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem(key, JSON.stringify({ access_token: 'test-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'r', user }));
  }, { key: `sb-${REF}-auth-token`, user: USER });
}

/** Подменная база: handlers[путь] → ответ; остальное — пустые списки */
async function fakeDb(page, handlers = {}) {
  const calls = [];
  await page.route(/supabase\.co\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/(rest|auth)\/v1\//, '');
    calls.push({ method: req.method(), path, search: url.search, body: req.postData() });
    const h = handlers[`${req.method()} ${path}`] ?? handlers[path];
    if (h !== undefined) {
      const value = typeof h === 'function' ? h(req) : h;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
    }
    if (req.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    if (path.startsWith('rpc/')) return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    return route.fulfill({ status: 201, body: '' });
  });
  return calls;
}

const today = new Date();
const day = (back) => new Date(today.getTime() - back * 86_400_000).toISOString().slice(0, 10);
const OVERVIEW = {
  since: day(29),
  visits_by_day: [{ day: day(2), n: 40 }, { day: day(1), n: 55 }, { day: day(0), n: 12 }],
  plays_by_day: [{ day: day(1), n: 9, players: 120 }, { day: day(0), n: 3, players: 31 }],
  games: [{ game: 'race', plays: 8, players: 110, answers: 900, correct: 600 }, { game: 'practice', plays: 4, players: 4, answers: 40, correct: 30 }],
  topics: [{ topic: 'math-6-fractions', plays: 7, answers: 500, correct: 300 }, { topic: 'english-5-basics', plays: 5, answers: 440, correct: 330 }],
  hard_questions: [{ topic: 'math-6-fractions', id: 'f01', answers: 20, wrong: 15 }],
  totals: { visits: 107, plays: 12, players: 151, answers: 940, correct: 630, visits_today: 12, plays_today: 3 },
  users: { teachers: 4, anonymous: 60, students_in_classes: 52, classes: 3, stale_anonymous: 5 },
  bank: { pending: 1, approved: 0, rejected: 0, public_active: 0 }
};
const SUBMISSION = {
  id: '5ab5ab5a-0000-4000-8000-000000000009', author_name: 'Асанова', topic: 'math-6-fractions', status: 'pending',
  created_at: new Date().toISOString(), admin_note: null, reviewed_at: null,
  question: { type: 'single', question: { ru: 'Сколько будет 1/2 + 1/4?' }, options: ['3/4', '2/6'], correctAnswer: 0, explanation: { ru: '2/4 + 1/4 = 3/4' } }
};

test('admin page asks to sign in when nobody is signed in', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('BA2_lang', '"ru"'));
  await page.goto('/admin.html');
  await expect(page.locator('#gateText')).toContainText('войдите аккаунтом учителя');
  await expect(page.locator('#gateActions a')).toHaveAttribute('href', './account.html');
  await expect(page.locator('#panel')).toBeHidden();
});

test('a teacher who is not an administrator gets no access', async ({ page }) => {
  await signedIn(page);
  await fakeDb(page, { 'rpc/is_admin': false });
  await page.goto('/admin.html');
  await expect(page.locator('#gateText')).toContainText('owner@school.kg не администратор');
  // Готовая команда, чтобы владелец выдал себе права, — с id именно этого аккаунта
  await expect(page.locator('#gateSql')).toHaveText(`insert into public.admins (user_id) values ('${USER.id}') on conflict do nothing;`);
  await expect(page.locator('#panel')).toBeHidden();
});

test('without the migration the page says which SQL to run', async ({ page }) => {
  await signedIn(page);
  await fakeDb(page);
  // Позже зарегистрированный перехват проверяется первым
  await page.route(/supabase\.co\/rest\/v1\/rpc\/is_admin/, (r) => r.fulfill({ status: 404, contentType: 'application/json',
    body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function public.is_admin without parameters in the schema cache' }) }));
  await page.goto('/admin.html');
  await expect(page.locator('#gateText')).toContainText('2026-10-23-admin-stats.sql');
});

test('administrator sees statistics charts and approves a teacher question', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await signedIn(page);
  const calls = await fakeDb(page, {
    'rpc/is_admin': true,
    'rpc/admin_overview': (req) => ({ ...OVERVIEW, since: day(JSON.parse(req.postData()).days - 1) }),
    'GET question_submissions': (req) => (new URL(req.url()).searchParams.get('status') === 'eq.pending' ? [SUBMISSION] : []),
    'rpc/admin_approve_submission': '7e7e7e7e-0000-4000-8000-000000000010',
    'rpc/admin_stale_anonymous': 5
  });
  await page.goto('/admin.html');
  await expect(page.locator('#panel')).toBeVisible();
  await expect(page.locator('#kpis')).toContainText('107');
  await expect(page.locator('#kpis')).toContainText('67%'); // 630 из 940 верных
  await expect(page.locator('#chartVisits .adm-col')).toHaveCount(30);
  await expect(page.locator('#chartVisits')).toContainText('Всего: 107');
  await expect(page.locator('#chartGames li')).toHaveCount(2);
  await expect(page.locator('#chartGames li').nth(1)).toContainText('Практика');
  // Доля ошибок: дроби 40%, английский 25% — сначала самая трудная тема
  await expect(page.locator('#chartTopics li').first()).toContainText('40%');
  await expect(page.locator('#hardQuestions tbody tr')).toHaveCount(1);
  await expect(page.locator('#hardQuestions tbody tr')).toContainText('75%');
  await expect(page.locator('#pendingBadge')).toHaveText('(1)');

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

  // Период 7 дней — новый запрос и 7 столбиков
  await page.locator('[data-days="7"]').click();
  await expect(page.locator('#chartVisits .adm-col')).toHaveCount(7);
  expect(calls.some((c) => c.path === 'rpc/admin_overview' && JSON.parse(c.body).days === 7)).toBe(true);

  await page.locator('[data-tab="submissions"]').click();
  const card = page.locator('#submissionList .adm-sub');
  await expect(card).toContainText('Сколько будет 1/2 + 1/4?');
  await expect(card.locator('.adm-q-options li.ok')).toContainText('3/4');
  await card.getByRole('button', { name: 'Одобрить' }).click();
  await expect(page.locator('#submissionList .adm-sub')).toHaveCount(0);
  const approve = calls.find((c) => c.path === 'rpc/admin_approve_submission');
  expect(JSON.parse(approve.body)).toEqual({ sid: SUBMISSION.id, edited: null, new_topic: null });

  await page.locator('[data-tab="service"]').click();
  await expect(page.locator('#anonCount')).toContainText('Можно удалить: 5');

  // Узкий экран: ничего не вылезает
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator('[data-tab="overview"]').click();
  await expect(page.locator('#chartVisits .adm-col').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('a teacher suggests a question for the shared bank and sees its status', async ({ page }) => {
  await signedIn(page);
  await page.addInitScript(() => {
    localStorage.setItem('BA2_questions', JSON.stringify([{ id: 'q_1_1', topic: 'math-6-fractions', skill: 'add-sub', subject: 'math', grade: 6,
      type: 'single', question: { ru: 'Мой вопрос про дроби' }, options: ['1', '2'], correctAnswer: 0, difficulty: 1, xp: 10 }]));
  });
  const calls = await fakeDb(page);
  page.on('dialog', (d) => d.accept());
  await page.goto('/questions.html');
  const row = page.locator('.q-row', { hasText: 'Мой вопрос про дроби' });
  await row.getByRole('button', { name: 'Предложить в общий банк' }).click();
  await expect(page.locator('#toasts')).toContainText('Заявка отправлена');
  await expect(row).toContainText('Общий банк: на рассмотрении');
  await expect(row.getByRole('button', { name: 'Предложить в общий банк' })).toBeDisabled();
  const insert = calls.find((c) => c.method === 'POST' && c.path === 'question_submissions');
  const body = JSON.parse(insert.body);
  expect(body.topic).toBe('math-6-fractions');
  expect(body.source_id).toBe('q_1_1');
  expect(body.question.question.ru).toBe('Мой вопрос про дроби');
  expect(body.question.id).toBeUndefined();
});

test('without signing in the share button explains how to sign in', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('BA2_lang', '"ru"');
    localStorage.setItem('BA2_questions', JSON.stringify([{ id: 'q_2_2', topic: 'math-6-fractions', skill: 'add-sub', type: 'single',
      question: { ru: 'Гостевой вопрос' }, options: ['1', '2'], correctAnswer: 0 }]));
  });
  page.on('dialog', (d) => d.accept());
  await page.goto('/questions.html');
  await page.locator('.q-row', { hasText: 'Гостевой вопрос' }).getByRole('button', { name: 'Предложить в общий банк' }).click();
  await expect(page.locator('#toasts')).toContainText('войдите как учитель');
});

test('a broken question cannot be approved, and the error log groups identical errors', async ({ page }) => {
  await signedIn(page);
  const broken = { ...SUBMISSION, question: { ...SUBMISSION.question, options: ['3/4'] } };
  const calls = await fakeDb(page, {
    'rpc/is_admin': true,
    'rpc/admin_overview': OVERVIEW,
    'GET question_submissions': (req) => (new URL(req.url()).searchParams.get('status') === 'eq.pending' ? [broken] : []),
    'GET client_errors': [
      { id: 3, created_at: new Date().toISOString(), page: '/board.html', message: 'x is undefined', stack: 'at board.js:10', ua: 'Chrome' },
      { id: 2, created_at: new Date().toISOString(), page: '/play.html', message: 'x is undefined' },
      { id: 1, created_at: new Date().toISOString(), page: '/play.html', message: 'Failed to load' }
    ]
  });
  await page.goto('/admin.html');
  await expect(page.locator('#kpis')).toContainText('Анонимных аккаунтов');

  await page.locator('[data-tab="submissions"]').click();
  const card = page.locator('#submissionList .adm-sub');
  await expect(card).toContainText('хотя бы 2 непустых варианта');
  await card.getByRole('button', { name: 'Одобрить' }).click();
  await expect(page.locator('#toasts')).toContainText('хотя бы 2 непустых варианта');
  await expect(card).toHaveCount(1);
  expect(calls.some((c) => c.path === 'rpc/admin_approve_submission')).toBe(false);

  await page.locator('[data-tab="errors"]').click();
  const items = page.locator('#errorList .adm-err');
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText('x is undefined');
  await expect(items.first()).toContainText('2 раз');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Очистить журнал' }).click();
  await expect(page.locator('#toasts')).toContainText('Журнал очищен');
  expect(calls.some((c) => c.method === 'DELETE' && c.path === 'client_errors')).toBe(true);
});
