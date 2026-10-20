// Проверка supabase/schema.sql на настоящем Postgres (PGlite) с заглушкой Supabase auth
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const db = new PGlite();

// ── То, что в Supabase уже есть: схема auth, роли, функции uid()/jwt()
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
  -- Права по умолчанию, как в Supabase: выдаются при создании таблицы,
  -- поэтому revoke/grant внутри schema.sql действуют поверх них
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
`);

await db.exec(schema);
await db.exec(schema); // повторный запуск не должен падать

// RLS решает, что на самом деле видно
await db.exec(`
  grant execute on function public.is_class_teacher(uuid), public.is_class_member(uuid),
    public.teaches_student(uuid), public.is_full_account(), public.gen_join_code() to anon, authenticated;
`);

const ids = {
  T1: '11111111-1111-1111-1111-111111111111', T2: '22222222-2222-2222-2222-222222222222',
  S1: '33333333-3333-3333-3333-333333333333', S2: '44444444-4444-4444-4444-444444444444'
};
for (const id of Object.values(ids)) await db.query('insert into auth.users (id) values ($1)', [id]);

async function as(who, anonymous, fn) {
  await db.exec('reset role');
  const claims = JSON.stringify({ sub: ids[who], is_anonymous: anonymous, role: 'authenticated' });
  await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [ids[who], claims]);
  await db.exec('set role authenticated');
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function asAnonRole(fn) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '{}', false)`);
  await db.exec('set role anon');
  try { return await fn(); } finally { await db.exec('reset role'); }
}

let pass = 0, fail = 0;
async function expectOk(name, fn, check = () => true) {
  try {
    const r = await fn();
    if (check(r)) { pass++; console.log('  ok   ', name); } else { fail++; console.log('  FAIL ', name, '→ неожиданный результат', JSON.stringify(r?.rows ?? r)); }
  } catch (e) { fail++; console.log('  FAIL ', name, '→', e.message); }
}
async function expectDenied(name, fn) {
  try {
    const r = await fn();
    const n = r?.affectedRows ?? r?.rows?.length ?? 0;
    if (n === 0) { pass++; console.log('  ok   ', name, '(0 строк)'); } else { fail++; console.log('  FAIL ', name, '→ ПРОШЛО', n); }
  } catch (e) { pass++; console.log('  ok   ', name, '→', e.message.split('\n')[0]); }
}
const rows = (n) => (r) => r.rows.length === n;

console.log('Классы');
let classId, code;
await expectOk('учитель создаёт класс', () => as('T1', false, () =>
  db.query(`insert into classes (name, grade) values ('6-А', 6) returning id, join_code`)), (r) => {
  classId = r.rows[0].id; code = r.rows[0].join_code; return /^[2-9A-HJ-NP-Z]{6}$/.test(code);
});
await expectDenied('ученик (анонимный) не может создать класс', () => as('S1', true, () =>
  db.query(`insert into classes (name, grade) values ('Взлом', 6)`)));
await expectDenied('учитель не может создать класс от чужого имени', () => as('T1', false, () =>
  db.query(`insert into classes (name, grade, teacher_id) values ('Чужой', 6, $1)`, [ids.T2])));
await expectDenied('чужой учитель не видит класс', () => as('T2', false, () => db.query('select * from classes')));
await expectDenied('ученик не видит класс до вступления', () => as('S1', true, () => db.query('select * from classes')));

console.log('Вступление в класс');
await expectOk('ученик входит по коду (в другом регистре)', () => as('S1', true, () =>
  db.query('select * from join_class($1, $2)', [code.toLowerCase(), '  Айбек  '])), (r) => r.rows[0]?.class_id === classId);
await expectOk('имя очищено от пробелов', () => as('T1', false, () => db.query('select name from class_members')), (r) => r.rows[0]?.name === 'Айбек');
await expectOk('повторный вход не дублирует ученика', () => as('S1', true, () =>
  db.query('select * from join_class($1, $2)', [code, 'Айбек'])), () => true);
await expectOk('в классе один ученик', () => as('T1', false, () => db.query('select * from class_members')), rows(1));
await expectDenied('неверный код', () => as('S2', true, () => db.query('select * from join_class($1, $2)', ['ZZZZZZ', 'X'])));
await expectDenied('пустое имя', () => as('S2', true, () => db.query('select * from join_class($1, $2)', [code, '   '])));
await expectDenied('без входа (роль anon) вступить нельзя', () => asAnonRole(() => db.query('select * from join_class($1, $2)', [code, 'X'])));
await expectDenied('в обход функции вступить нельзя', () => as('S2', true, () =>
  db.query('insert into class_members (class_id, user_id, name) values ($1, $2, $3)', [classId, ids.S2, 'Хакер'])));
await expectOk('ученик видит свой класс', () => as('S1', true, () => db.query('select * from classes')), rows(1));

console.log('Запись ученика в классе (UPDATE)');
let otherClassId;
await expectOk('второй учитель создаёт свой класс', () => as('T2', false, () =>
  db.query(`insert into classes (name, grade) values ('7-Б', 7) returning id`)), (r) => { otherClassId = r.rows[0]?.id; return !!otherClassId; });
const membership = () => db.query('select class_id, user_id, name from class_members where user_id = $1', [ids.S1]);
const stillInOwnClass = (r) => r.rows.length === 1 && r.rows[0].class_id === classId && r.rows[0].user_id === ids.S1;
await expectDenied('ученик не переносит свою запись в чужой класс', () => as('S1', true, () =>
  db.query('update class_members set class_id = $1 where user_id = $2', [otherClassId, ids.S1])));
await expectDenied('ученик не меняет user_id своей записи', () => as('S1', true, () =>
  db.query('update class_members set user_id = $1 where user_id = $2', [ids.S2, ids.S1])));
await expectDenied('учитель не правит запись ученика', () => as('T1', false, () =>
  db.query(`update class_members set name = 'Чужое' where user_id = $1`, [ids.S1])));
await expectOk('запись ученика осталась в его классе', () => membership(), stillInOwnClass);
await expectDenied('чужой учитель не видит ученика', () => as('T2', false, () => db.query('select * from class_members')));
await expectOk('ученик меняет своё имя', () => as('S1', true, () =>
  db.query(`update class_members set name = 'Айбек Т.' where user_id = $1`, [ids.S1])), (r) => r.affectedRows === 1);
await expectOk('новое имя сохранено, класс тот же', () => membership(),
  (r) => stillInOwnClass(r) && r.rows[0].name === 'Айбек Т.');
await expectOk('join_class по-прежнему обновляет имя', () => as('S1', true, () =>
  db.query('select * from join_class($1, $2)', [code, 'Айбек'])), (r) => r.rows[0]?.class_id === classId);
await expectOk('имя из join_class сохранено', () => membership(), (r) => stillInOwnClass(r) && r.rows[0].name === 'Айбек');
// Второй рубеж: даже если права на UPDATE снова выдадут на всю таблицу
// (например, «grant all» из панели Supabase), перенос блокирует триггер
await db.exec('grant update on public.class_members to authenticated');
await expectOk('перенос в чужой класс запрещён и при полном праве UPDATE', () => as('S1', true, () =>
  db.query('update class_members set class_id = $1 where user_id = $2', [otherClassId, ids.S1])
    .then(() => 'прошло', (e) => e.message)), (m) => m === 'class_members_keys_immutable');
await db.exec('revoke update on public.class_members from authenticated; grant update (name) on public.class_members to authenticated');
await expectOk('запись ученика по-прежнему в его классе', () => membership(), stillInOwnClass);
await expectDenied('ученик не видит одноклассников', () => as('S1', true, () =>
  db.query('select * from class_members where user_id <> $1', [ids.S1])));

console.log('Задания');
await expectOk('учитель публикует задание', () => as('T1', false, () =>
  db.query(`insert into assignments (id, class_id, data) values ('a_1', $1, '{"title":"ДЗ"}')`, [classId])), () => true);
await expectDenied('чужой учитель не публикует в чужой класс', () => as('T2', false, () =>
  db.query(`insert into assignments (id, class_id, data) values ('a_x', $1, '{}')`, [classId])));
await expectDenied('ученик не публикует задания', () => as('S1', true, () =>
  db.query(`insert into assignments (id, class_id, data, teacher_id) values ('a_s', $1, '{}', $2)`, [classId, ids.S1])));
await expectOk('ученик класса видит задание', () => as('S1', true, () => db.query('select * from assignments')), rows(1));
await expectDenied('посторонний ученик не видит задание', () => as('S2', true, () => db.query('select * from assignments')));
await expectDenied('ученик не может изменить задание', () => as('S1', true, () =>
  db.query(`update assignments set data = '{"hack":1}'`)));

console.log('Результаты');
await expectOk('ученик сдаёт результат', () => as('S1', true, () =>
  db.query(`insert into submissions (assignment_id, class_id, data) values ('a_1', $1, '{"best":80}')`, [classId])), () => true);
await expectOk('ученик обновляет свой результат (upsert)', () => as('S1', true, () =>
  db.query(`insert into submissions (assignment_id, class_id, data) values ('a_1', $1, '{"best":90}')
            on conflict (assignment_id, student_id) do update set data = excluded.data`, [classId])), () => true);
await expectDenied('ученик не сдаёт за другого', () => as('S1', true, () =>
  db.query(`insert into submissions (assignment_id, class_id, data, student_id) values ('a_1', $1, '{}', $2)`, [classId, ids.S2])));
await expectDenied('посторонний не сдаёт в чужой класс', () => as('S2', true, () =>
  db.query(`insert into submissions (assignment_id, class_id, data) values ('a_1', $1, '{}')`, [classId])));
await expectOk('учитель видит результат', () => as('T1', false, () => db.query('select data from submissions')), (r) => r.rows[0]?.data?.best === 90);
await expectDenied('чужой учитель не видит результат', () => as('T2', false, () => db.query('select * from submissions')));

console.log('Личные данные');
await expectOk('ученик сохраняет прогресс', () => as('S1', true, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('progress', '{"xp":10}', 1),
            ('profile', '{"name":"Айбек"}', 1)`)), () => true);
await expectDenied('недопустимый ключ', () => as('S1', true, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('secret', '{}', 1)`)));
await expectOk('учитель видит прогресс своего ученика', () => as('T1', false, () =>
  db.query(`select * from user_data where user_id = $1 and key = 'progress'`, [ids.S1])), rows(1));
await expectDenied('учитель не видит профиль ученика', () => as('T1', false, () =>
  db.query(`select * from user_data where key = 'profile'`)));
await expectDenied('чужой учитель не видит прогресс', () => as('T2', false, () => db.query('select * from user_data')));
await expectDenied('другой ученик не видит прогресс', () => as('S2', true, () => db.query('select * from user_data')));
await expectDenied('роль anon не видит ничего', () => asAnonRole(() => db.query('select * from user_data')));
await expectOk('учитель сохраняет свои тесты', () => as('T1', false, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('tests', '[{"id":"t1"}]', 1)`)), () => true);
await expectDenied('чужой учитель не видит тесты', () => as('T2', false, () =>
  db.query(`select * from user_data where key = 'tests'`)));
await expectDenied('ученик не видит тесты учителя', () => as('S1', true, () =>
  db.query(`select * from user_data where key = 'tests'`)));

console.log('Удаление');
await expectOk('учитель удаляет ученика из класса', () => as('T1', false, () =>
  db.query('delete from class_members where user_id = $1', [ids.S1])), (r) => r.affectedRows === 1);
await expectDenied('после удаления ученик не видит задания', () => as('S1', true, () => db.query('select * from assignments')));
await expectOk('удаление класса удаляет задания (cascade)', () => as('T1', false, async () => {
  await db.query('delete from classes where id = $1', [classId]);
  return db.query('select * from assignments');
}), rows(0));

console.log('Журнал ошибок');
const report = (msg = 'TypeError: x is undefined') => db.query(
  'insert into client_errors (page, message, stack, lang, ua, version) values ($1, $2, $3, $4, $5, $6)',
  ['/board.html', msg, 'at board.js:10', 'ky', 'Chrome', 'ba-v29']);
await expectOk('посетитель без входа сообщает об ошибке', () => asAnonRole(() => report()), (r) => r.affectedRows === 1);
await expectOk('ученик тоже может сообщить', () => as('S2', true, () => report()), (r) => r.affectedRows === 1);
await expectDenied('журнал не читается без входа', () => asAnonRole(() => db.query('select * from client_errors')));
await expectDenied('журнал не читает даже учитель', () => as('T1', false, () => db.query('select * from client_errors')));
await expectDenied('стереть журнал нельзя', () => asAnonRole(() => db.query('delete from client_errors')));
await expectDenied('слишком длинное сообщение отклоняется', () => asAnonRole(() => report('x'.repeat(600))));
await expectOk('после 300 отчётов за 10 минут новые отклоняются', () => asAnonRole(async () => {
  for (let i = 0; i < 300; i++) { try { await report(); } catch { /* сработала защита */ } }
  try { await report(); return false; } catch (e) { return /too many/.test(e.message); }
}), (r) => r === true);

console.log(`\nИтог: ${pass} ok, ${fail} ошибок`);
process.exit(fail ? 1 : 0);
