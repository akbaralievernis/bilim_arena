// Защита базы от злоупотреблений: лимиты частоты, размера и количества,
// инъекции в параметры, подмена ролей и id. Postgres в WebAssembly (PGlite).
// Нагрузки нет: лимиты проверяются заполнением счётчика, а не потоком запросов.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const db = new PGlite();

// То, что в Supabase уже есть: схема auth, роли, права по умолчанию
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
await db.exec(schema);
await db.exec(schema); // повторный запуск не должен падать

const ids = {
  T1: '11111111-1111-1111-1111-111111111111', T2: '22222222-2222-2222-2222-222222222222',
  S1: '33333333-3333-3333-3333-333333333333', S2: '44444444-4444-4444-4444-444444444444',
  S3: '55555555-5555-5555-5555-555555555555'
};
for (const id of Object.values(ids)) await db.query('insert into auth.users (id) values ($1)', [id]);

const claims = (sub, extra = {}) => db.query(
  `select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`,
  [sub, sub ? JSON.stringify({ sub, role: 'authenticated', ...extra }) : '{}']);
async function as(who, anonymous, fn) {
  await db.exec('reset role');
  await claims(ids[who], { is_anonymous: anonymous });
  await db.exec('set role authenticated');
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function asAnonRole(fn) {
  await db.exec('reset role');
  await claims('');
  await db.exec('set role anon');
  try { return await fn(); } finally { await db.exec('reset role'); }
}
/** Владелец базы (как SQL Editor / service_role): без auth.uid(), лимиты не действуют */
async function asAdmin(fn) {
  await db.exec('reset role');
  await claims('');
  return fn();
}
/** Заполнить счётчик текущего окна — вместо потока запросов */
const fillCounter = (who, bucket, windowS, hits) => asAdmin(() => db.query(
  `insert into ba_private.rate_counters (user_id, bucket, window_start, hits)
   values ($1, $2, to_timestamp(floor(extract(epoch from now()) / $3) * $3), $4)
   on conflict (user_id, bucket, window_start) do update set hits = excluded.hits`, [ids[who], bucket, windowS, hits]));
const clearCounters = () => asAdmin(() => db.exec('delete from ba_private.rate_counters'));

let pass = 0, fail = 0;
const ok = (name) => { pass++; console.log('  ok   ', name); };
const bad = (name, why) => { fail++; console.log('  FAIL ', name, '→', why); };
async function expectOk(name, fn, check = () => true) {
  try { const r = await fn(); check(r) ? ok(name) : bad(name, 'неожиданный результат ' + JSON.stringify(r?.rows ?? r).slice(0, 200)); }
  catch (e) { bad(name, e.message); }
}
/** Ожидаем отказ с конкретной ошибкой (code — SQLSTATE или текст сообщения) */
async function expectError(name, fn, expected) {
  try { const r = await fn(); bad(name, 'ПРОШЛО ' + JSON.stringify(r?.rows ?? r).slice(0, 120)); }
  catch (e) {
    const hit = e.code === expected || e.message.includes(expected);
    hit ? ok(`${name} → ${e.code} ${e.message.split('\n')[0]}`) : bad(name, `другая ошибка: ${e.code} ${e.message}`);
  }
}
async function expectNothing(name, fn) {
  try {
    const r = await fn();
    const n = r?.affectedRows ?? r?.rows?.length ?? 0;
    n === 0 ? ok(`${name} (0 строк)`) : bad(name, 'ПРОШЛО ' + n);
  } catch (e) { ok(`${name} → ${e.message.split('\n')[0]}`); }
}
const big = (chars) => JSON.stringify({ blob: 'x'.repeat(chars) });

// ── Подготовка: класс A (T1, ученик S1), класс B (T2, ученик S2)
let classA, codeA, classB, codeB;
await as('T1', false, async () => {
  const r = await db.query(`insert into classes (name, grade) values ('6-А', 6) returning id, join_code`);
  classA = r.rows[0].id; codeA = r.rows[0].join_code;
  await db.query(`insert into assignments (id, class_id, data) values ('a_A', $1, '{"title":"ДЗ A"}')`, [classA]);
});
await as('T2', false, async () => {
  const r = await db.query(`insert into classes (name, grade) values ('7-Б', 7) returning id, join_code`);
  classB = r.rows[0].id; codeB = r.rows[0].join_code;
  await db.query(`insert into assignments (id, class_id, data) values ('a_B', $1, '{"title":"ДЗ B"}')`, [classB]);
});
await as('S1', true, () => db.query('select * from join_class($1, $2)', [codeA, 'Айбек']));
await as('S2', true, () => db.query('select * from join_class($1, $2)', [codeB, 'Нурай']));
await as('S2', true, () => db.query(`insert into submissions (assignment_id, class_id, data) values ('a_B', $1, '{"best":70}')`, [classB]));
await clearCounters();

console.log('Инъекции в параметры');
const payloads = [`' or '1'='1`, `${codeA}' --`, `x'); drop table public.classes; --`, `%`, `_`, `\\`, `$$; select 1; $$`, `${codeA}\u0000`];
for (const p of payloads) {
  await expectNothing(`код класса ${JSON.stringify(p).slice(0, 30)} ничего не находит`, () =>
    as('S3', true, () => db.query('select * from join_class($1, $2)', [p, 'Тест'])));
}
await clearCounters();
const evilName = `Robert'); drop table public.class_members; --`;
await expectOk('имя с SQL сохраняется как обычный текст', () => as('S3', true, async () => {
  await db.query('select * from join_class($1, $2)', [codeA, evilName]);
  return db.query('select name from class_members where user_id = $1', [ids.S3]);
}), (r) => r.rows[0]?.name === evilName.slice(0, 40));
await expectOk('таблицы на месте', () => asAdmin(() => db.query(`select count(*)::int as n from public.class_members`)), (r) => r.rows[0].n === 3);
await expectNothing('огромный код (100 000 символов) отклоняется сразу', () =>
  as('S3', true, () => db.query('select * from join_class($1, $2)', ['A'.repeat(100000), 'Тест'])));
await clearCounters();

console.log('Перебор кодов классов');
await expectOk('20 неверных кодов подряд — обычный ответ «не найдено»', () => as('S3', true, async () => {
  let found = 0;
  for (let i = 0; i < 20; i++) found += (await db.query('select * from join_class($1, $2)', [`ZZZZ${String(i).padStart(2, '0')}`, 'Тест'])).rows.length;
  return found;
}), (n) => n === 0);
await expectError('21-я попытка за 10 минут — лимит (HTTP 429)', () =>
  as('S3', true, () => db.query('select * from join_class($1, $2)', [codeA, 'Тест'])), 'PT429');
await expectOk('лимит одного ученика не мешает другим', () =>
  as('S1', true, () => db.query('select * from join_class($1, $2)', [codeA, 'Айбек'])), (r) => r.rows[0]?.class_id === classA);
await expectError('без входа (anon) join_class недоступен', () =>
  asAnonRole(() => db.query('select * from join_class($1, $2)', [codeA, 'X'])), '42501');
await clearCounters();

console.log('Частота записи');
await expectOk('обычная синхронизация урока: 40 записей за минуту проходят', () => as('S1', true, async () => {
  for (let i = 0; i < 40; i++) {
    await db.query(`insert into user_data (key, value, updated_ms) values ('progress', $1, $2)
                    on conflict (user_id, key) do update set value = excluded.value, updated_ms = excluded.updated_ms`, [JSON.stringify({ xp: i }), i]);
  }
  return true;
}));
await fillCounter('S1', 'user_data:insert', 60, 120);
await expectError('сверх 120 записей в минуту — лимит (HTTP 429)', () => as('S1', true, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('progress', '{"xp":1}', 1)
            on conflict (user_id, key) do update set value = excluded.value`)), 'PT429');
await expectOk('лимит S1 не задевает S2', () => as('S2', true, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('progress', '{"xp":1}', 1)`)), (r) => r.affectedRows === 1);
await fillCounter('S2', 'submissions:insert', 60, 90);
await expectError('поток результатов — лимит', () => as('S2', true, () =>
  db.query(`insert into submissions (assignment_id, class_id, data) values ('a_B', $1, '{"best":71}')
            on conflict (assignment_id, student_id) do update set data = excluded.data`, [classB])), 'PT429');
await fillCounter('T1', 'classes:insert', 3600, 30);
await expectError('массовое создание классов — лимит', () => as('T1', false, () =>
  db.query(`insert into classes (name, grade) values ('Спам', 5)`)), 'PT429');
await expectOk('администратор (SQL Editor) лимитом не ограничен', () => asAdmin(() =>
  db.query(`insert into user_data (user_id, key, value, updated_ms) values ($1, 'history', '[]', 1)`, [ids.S1])), (r) => r.affectedRows === 1);
await clearCounters();

console.log('Повторная отправка');
await expectOk('повтор того же результата не создаёт дубль', () => as('S2', true, async () => {
  for (let i = 0; i < 3; i++) {
    await db.query(`insert into submissions (assignment_id, class_id, data) values ('a_B', $1, '{"best":80}')
                    on conflict (assignment_id, student_id) do update set data = excluded.data`, [classB]);
  }
  return db.query('select count(*)::int as n from submissions where student_id = $1', [ids.S2]);
}), (r) => r.rows[0].n === 1);
await clearCounters();

console.log('Размер данных');
await expectError('ученик: прогресс больше 1 млн символов — HTTP 413', () => as('S1', true, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('errors', $1, 2)
            on conflict (user_id, key) do update set value = excluded.value`, [big(1_000_001)])), 'PT413');
await expectOk('ученик: прогресс 900 тыс. символов сохраняется', () => as('S1', true, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('errors', $1, 2)
            on conflict (user_id, key) do update set value = excluded.value`, [big(900_000)])), (r) => r.affectedRows === 1);
await expectError('ученик не пишет ключи учителя', () => as('S1', true, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('questions', '[]', 1)`)), '42501');
await expectOk('учитель: 4 млн символов (вопросы с картинками) сохраняется', () => as('T1', false, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('questions', $1, 1)`, [big(4_000_000)])), (r) => r.affectedRows === 1);
await expectError('учитель: больше 5 млн — HTTP 413', () => as('T1', false, () =>
  db.query(`update user_data set value = $1 where key = 'questions'`, [big(5_000_001)])), 'PT413');
await expectError('результат больше 1 млн — HTTP 413', () => as('S2', true, () =>
  db.query(`update submissions set data = $1 where student_id = $2`, [big(1_000_001), ids.S2])), 'PT413');
await clearCounters();

console.log('Количество');
await asAdmin(() => db.query(`insert into classes (teacher_id, name) select $1, 'К' || g from generate_series(1, 99) g`, [ids.T2]));
await expectError('сотый класс у учителя — отказ', () => as('T2', false, () =>
  db.query(`insert into classes (name) values ('Лишний')`)), 'too_many_classes');
await asAdmin(() => db.query(`insert into assignments (id, class_id, teacher_id, data) select 'bulk_' || g, $1, $2, '{}' from generate_series(1, 499) g`, [classA, ids.T1]));
await expectError('501-е задание в классе — отказ', () => as('T1', false, () =>
  db.query(`insert into assignments (id, class_id, data) values ('one_more', $1, '{}')`, [classA])), 'too_many_assignments');
await expectOk('обновить существующее задание при полном классе можно', () => as('T1', false, () =>
  db.query(`insert into assignments (id, class_id, data) values ('a_A', $1, '{"title":"новое"}')
            on conflict (id) do update set data = excluded.data`, [classA])), (r) => r.affectedRows === 1);
await clearCounters();
const fakeIds = Array.from({ length: 198 }, (_, i) => `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`);
await asAdmin(async () => {
  for (const u of fakeIds) await db.query('insert into auth.users (id) values ($1)', [u]);
  await db.query(`insert into class_members (class_id, user_id, name) select $1, u::uuid, 'Ф' from unnest($2::text[]) u`, [classA, fakeIds]);
});
await expectError('201-й ученик в классе — «класс заполнен»', () =>
  as('S2', true, () => db.query('select * from join_class($1, $2)', [codeA, 'Нурай'])), 'class_full');
await expectOk('уже состоящий ученик входит снова и при полном классе', () =>
  as('S1', true, () => db.query('select * from join_class($1, $2)', [codeA, 'Айбек'])), (r) => r.rows[0]?.class_id === classA);
await clearCounters();

console.log('Подмена ролей и id (IDOR)');
await expectError('ученик (анонимный) не создаёт класс, подставив учителя', () => as('S1', true, () =>
  db.query(`insert into classes (name, teacher_id) values ('Взлом', $1)`, [ids.T1])), 'row-level security');
await expectNothing('ученик не меняет учителя класса', () => as('S1', true, () =>
  db.query(`update classes set teacher_id = $1 where id = $2`, [ids.S1, classA])));
await expectNothing('учитель не забирает чужой класс', () => as('T1', false, () =>
  db.query(`update classes set teacher_id = $1 where id = $2`, [ids.T1, classB])));
await expectNothing('ученик A не читает задание класса B по id', () => as('S1', true, () =>
  db.query(`select * from assignments where id = 'a_B'`)));
await expectNothing('ученик A не читает результаты класса B', () => as('S1', true, () =>
  db.query('select * from submissions where class_id = $1', [classB])));
await expectError('ученик A не сдаёт в задание класса B, подменив class_id', () => as('S1', true, () =>
  db.query(`insert into submissions (assignment_id, class_id, data) values ('a_B', $1, '{}')`, [classA])), 'row-level security');
await expectNothing('учитель A не читает прогресс ученика B', () => as('T1', false, () =>
  db.query('select * from user_data where user_id = $1', [ids.S2])));
await expectError('ученик не переносит себя в класс B', () => as('S1', true, () =>
  db.query('update class_members set class_id = $1 where user_id = $2', [classB, ids.S1])), '42501');

console.log('Права на функции и служебные данные');
for (const fn of ['is_class_teacher(gen_random_uuid())', 'is_class_member(gen_random_uuid())', 'teaches_student(gen_random_uuid())', 'is_full_account()', 'gen_join_code()']) {
  await expectError(`anon не вызывает ${fn.split('(')[0]}`, () => asAnonRole(() => db.query(`select public.${fn}`)), '42501');
}
await expectError('счётчики лимитов не видны ученику', () => as('S1', true, () =>
  db.query('select * from ba_private.rate_counters')), '42501');
await expectError('ученик не обнуляет свой счётчик', () => as('S1', true, () =>
  db.query('delete from ba_private.rate_counters')), '42501');
await expectError('anon не вызывает ba_private.hit', () => asAnonRole(() =>
  db.query(`select ba_private.hit('x', 1000, 60)`)), '42501');
await expectError('триггерную функцию нельзя вызвать напрямую', () => as('S1', true, () =>
  db.query('select public.ba_size_guard()')), '42501');
await expectOk('учитель по-прежнему создаёт класс (gen_join_code работает)', () => as('T1', false, () =>
  db.query(`insert into classes (name) values ('8-В') returning join_code`)), (r) => /^[2-9A-HJ-NP-Z]{6}$/.test(r.rows[0]?.join_code));
await expectOk('журнал ошибок по-прежнему принимает отчёт без входа', () => asAnonRole(() =>
  db.query(`insert into client_errors (page, message) values ('/x.html', 'TypeError')`)), (r) => r.affectedRows === 1);

console.log('Функции definer: безопасный search_path');
await expectOk('у всех security definer функций задан search_path с pg_temp в конце', () => asAdmin(() => db.query(`
  select p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'ba_private') and p.prosecdef`)),
(r) => r.rows.length >= 8 && r.rows.every((x) => (x.proconfig || []).some((c) => /^search_path=.*pg_temp$/.test(c))));

console.log(`\nИтог: ${pass} ok, ${fail} ошибок`);
process.exit(fail ? 1 : 0);
