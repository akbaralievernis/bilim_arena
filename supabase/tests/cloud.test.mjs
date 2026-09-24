// Сквозной тест core/cloud.js: настоящий код синхронизации против схемы с RLS (PGlite)
// Запуск (из supabase/tests): npm install && npm run test:cloud
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url).href;

// ── База: схема Supabase + заглушка auth ─────────────────────────────────────
const db = new PGlite();
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create role anon nologin; create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
`);
await db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
await db.exec(`grant usage on schema public to anon, authenticated;
  grant all on all tables in schema public to anon, authenticated;
  grant execute on function public.is_class_teacher(uuid), public.is_class_member(uuid), public.teaches_student(uuid),
    public.is_full_account(), public.gen_join_code() to anon, authenticated;`);
globalThis.__pg = db;

// ── Окружение браузера: у каждого «устройства» своё localStorage ─────────────
const storages = {};
let current = null;
const mem = () => { const m = new Map(); return {
  getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k),
  clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; }, _m: m }; };
globalThis.localStorage = new Proxy({}, {
  get(_, p) { const s = storages[current]; if (p === Symbol.iterator) return undefined; if (p in s) return typeof s[p] === 'function' ? s[p].bind(s) : s[p]; return s._m.get(p); },
  ownKeys() { return [...storages[current]._m.keys()]; },
  getOwnPropertyDescriptor(_, p) { return storages[current]._m.has(p) ? { enumerable: true, configurable: true, value: storages[current]._m.get(p) } : undefined; }
});
globalThis.window = new EventTarget();
globalThis.document = { addEventListener() {}, visibilityState: 'visible' };
globalThis.location = new URL('https://akbaralievernis.github.io/bilim_arena/account.html');

const devices = {};
async function device(name) {
  current = name;
  if (!devices[name]) {
    storages[name] = mem();
    const q = `?device=${name}`;
    const config = await import(ROOT + 'core/config.js' + q);
    config.SUPABASE.url = 'https://test.supabase.co';
    config.SUPABASE.anonKey = 'anon-test';
    devices[name] = {
      cloud: await import(ROOT + 'core/cloud.js' + q),
      store: await import(ROOT + 'core/store.js' + q),
      profile: await import(ROOT + 'core/profile.js' + q),
      progress: await import(ROOT + 'core/progress.js' + q),
      hw: await import(ROOT + 'core/assignments.js' + q),
      questions: await import(ROOT + 'core/questions.js' + q)
    };
  }
  return devices[name];
}

let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ok   ', name); } else { fail++; console.log('  FAIL ', name, info); }
}

// ── 1. Учитель: регистрация, класс, вопрос, задание ──────────────────────────
console.log('Учитель (устройство T1)');
let T = await device('T1');
await T.cloud.teacherSignUp({ email: 'aigul@school.kg', password: 'secret-123', name: 'Айгүл' });
let p = await T.profile.getProfile();
check('после регистрации профиль учителя', p.role === 'teacher' && p.name === 'Айгүл' && p.id === T.cloud.cloudStatus().user.id);
check('статус синхронизации ok', T.cloud.cloudStatus().state === 'ok', JSON.stringify(T.cloud.cloudStatus()));

await T.cloud.createClass({ name: '6-А', grade: 6 });
let classes = await T.store.store.get('classes', []);
const cls = classes.find((c) => c.cloud);
check('класс создан в облаке и получил код', cls && /^[2-9A-HJ-NP-Z]{6}$/.test(cls.code), JSON.stringify(classes));

const q1 = await T.questions.saveQuestion({ subject: 'math', grade: 6, topic: 'math-6-fractions', skill: 'compare', type: 'single',
  question: '1/2 или 1/3?', options: ['1/2', '1/3'], correctAnswer: 0, explanation: '1/2 больше', difficulty: 1, xp: 10 });
const a1 = await T.hw.saveAssignment({ title: 'ДЗ: дроби', subject: 'math', grade: 6, topic: 'math-6-fractions',
  classId: cls.id, questionIds: [q1.id], count: 1, attempts: 2, xp: 50 });
await T.cloud.flush();
const rowsA = await db.query('select id, class_id, data from assignments');
check('задание ушло в облако вместе с вопросом учителя',
  rowsA.rows.length === 1 && rowsA.rows[0].data.questions?.[0]?.id === q1.id, JSON.stringify(rowsA.rows));

// ── 2. Ученик: локальный прогресс до входа, вход по коду, задание ────────────
console.log('Ученик (устройство S1)');
let S = await device('S1');
await S.progress.recordAnswer({ topic: 'math-6-fractions', skill: 'compare', correct: true, questionId: 'f01', gameId: 'practice' });
const xpBefore = (await S.progress.getProgress()).xp;
const joined = await S.cloud.studentJoin({ code: cls.code.toLowerCase(), name: 'Айбек' });
check('ученик вошёл в класс по коду', joined.class_name === '6-А');
p = await S.profile.getProfile();
check('профиль ученика привязан к классу', p.role === 'student' && p.classId === cls.id && p.id === S.cloud.cloudStatus().user.id);
const list = await S.hw.studentAssignments({ studentId: p.id, classId: p.classId, grade: p.grade });
check('ученик получил задание учителя', list.some((x) => x.assignment?.id === a1.id || x.id === a1.id), JSON.stringify(list).slice(0, 200));
const sq = await S.questions.allQuestions();
check('ученик получил вопрос учителя для задания', sq.some((x) => x.id === q1.id));
const up = await db.query(`select value from user_data where key = 'progress'`);
check('прогресс, набранный до входа, сохранён в аккаунт', up.rows[0]?.value?.xp === xpBefore && xpBefore > 0, JSON.stringify(up.rows));

await S.hw.saveSubmission({ assignmentId: a1.id, studentId: p.id, studentName: 'Айбек', correct: 1, total: 1,
  skillStats: { compare: { ok: 1, total: 1 } }, mistakes: [] });
await S.cloud.flush();
const rowsS = await db.query('select student_id, data from submissions');
check('результат ученика ушёл в облако', rowsS.rows.length === 1 && rowsS.rows[0].data.best === 100, JSON.stringify(rowsS.rows));

// ── 3. Учитель видит ученика и результат ──────────────────────────────────────
console.log('Учитель снова (T1)');
T = await device('T1');
await T.cloud.syncAll();
classes = await T.store.store.get('classes', []);
check('в классе учителя появился ученик', classes.find((c) => c.id === cls.id)?.students?.includes('Айбек'), JSON.stringify(classes));
const stats = await T.hw.assignmentStats(a1.id, 1);
check('аналитика задания видит выполнение', stats.completed === 1 && stats.average === 100, JSON.stringify(stats).slice(0, 200));

// ── 4. Второе устройство учителя ──────────────────────────────────────────────
console.log('Учитель на другом устройстве (T2)');
const T2 = await device('T2');
await T2.cloud.teacherSignIn({ email: 'aigul@school.kg', password: 'secret-123' });
check('на новом устройстве есть класс', (await T2.store.store.get('classes', [])).some((c) => c.id === cls.id));
check('на новом устройстве есть задание', (await T2.hw.allAssignments()).some((a) => a.id === a1.id));
check('на новом устройстве есть вопрос учителя', (await T2.questions.allQuestions()).some((x) => x.id === q1.id));
check('на новом устройстве есть результат ученика', (await T2.hw.allSubmissions()).some((s) => s.studentName === 'Айбек'));
let wrong = false;
try { await T2.cloud.teacherSignIn({ email: 'aigul@school.kg', password: 'nope' }); } catch (e) { wrong = /Invalid login/.test(e.message); }
check('неверный пароль отклонён', wrong);

// ── 5. Удаление задания учителем доходит до ученика ───────────────────────────
console.log('Удаление задания');
T = await device('T1');
await T.hw.deleteAssignment(a1.id);
await T.cloud.flush();
check('задание удалено из облака', (await db.query('select * from assignments')).rows.length === 0);
const T2b = await device('T2');
await T2b.cloud.syncAll();
check('на втором устройстве задание тоже исчезло', !(await T2b.hw.allAssignments()).some((a) => a.id === a1.id));
check('второе устройство не вернуло задание в облако', (await db.query('select * from assignments')).rows.length === 0);

// ── 6. Выход ученика убирает его данные с устройства ─────────────────────────
console.log('Выход ученика (S1)');
S = await device('S1');
await S.cloud.signOut();
check('после выхода на устройстве нет прогресса ученика', (await S.store.store.get('progress', null)) === null);
check('после выхода нет сессии', (await S.cloud.currentUser()) === null);
check('прогресс остался в облаке', (await db.query(`select * from user_data where key = 'progress'`)).rows.length === 1);

console.log(`\nИтог: ${pass} ok, ${fail} ошибок`);
process.exit(fail ? 1 : 0);
