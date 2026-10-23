// Проверка supabase/schema.sql на настоящем Postgres (PGlite) с заглушкой Supabase auth
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const db = new PGlite();

// ── То, что в Supabase уже есть: схема auth, роли, функции uid()/jwt()
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key, email text, is_anonymous boolean not null default false,
    created_at timestamptz not null default now());
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
`);

await db.exec(schema);
await db.exec(schema); // повторный запуск не должен падать

// Права по умолчанию, как в Supabase (RLS решает, что на самом деле видно)
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant all on all tables in schema public to anon, authenticated;
  grant execute on function public.is_class_teacher(uuid), public.is_class_member(uuid),
    public.teaches_student(uuid), public.is_full_account(), public.gen_join_code() to anon, authenticated;
  grant execute on all functions in schema public to anon, authenticated;
`);
// Supabase выдаёт новым функциям права anon/authenticated по умолчанию; повторный запуск схемы
// (как повторное выполнение миграции) должен эти права отобрать там, где их быть не должно
await db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));

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
// Аудит 21.10 (P2): подбор кода класса. Неверный код записывается (поэтому — пустой ответ, а не ошибка:
// ошибка откатила бы запись), после 10 неверных за час — отказ даже для верного кода
await expectOk('после 10 неверных кодов за час вход блокируется', async () => {
  for (let i = 0; i < 9; i++) await as('S2', true, () => db.query('select * from join_class($1, $2)', ['ZZZZZ' + i, 'X']));
  try { await as('S2', true, () => db.query('select * from join_class($1, $2)', [code, 'X'])); return false; }
  catch (e) { return /too_many_attempts/.test(e.message); }
}, (r) => r === true);
await db.exec('reset role'); await db.query('delete from join_attempts');
await expectOk('код класса — криптостойкий (без random())', () => db.query(`select pg_get_functiondef('public.gen_join_code()'::regprocedure) d`),
  (r) => !/random\(\)/.test(r.rows[0].d) && /gen_random_uuid/.test(r.rows[0].d));
await expectDenied('журнал попыток не читается', () => as('S2', true, () => db.query('select * from join_attempts')));
await expectDenied('пустое имя', () => as('S2', true, () => db.query('select * from join_class($1, $2)', [code, '   '])));
await expectDenied('без входа (роль anon) вступить нельзя', () => asAnonRole(() => db.query('select * from join_class($1, $2)', [code, 'X'])));
await expectDenied('в обход функции вступить нельзя', () => as('S2', true, () =>
  db.query('insert into class_members (class_id, user_id, name) values ($1, $2, $3)', [classId, ids.S2, 'Хакер'])));
await expectDenied('ученик не может сам сменить имя или класс в своей строке', () => as('S1', true, () =>
  db.query('update class_members set name = $1 where user_id = $2', ['Учитель', ids.S1])));
await expectOk('ученик видит свой класс', () => as('S1', true, () => db.query('select * from classes')), rows(1));
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

// Аудит 21.10 (P1): RLS проверяла строку, но не содержимое — ученик мог вписать в data чужие
// studentId/studentName и попасть в отчёт одноклассника; повторный вход позволял взять чужое имя
console.log('Подделка результатов и имени');
await expectOk('одноклассник с тем же именем получает номер, а не чужое имя', () => as('S2', true, () =>
  db.query('select * from join_class($1, $2)', [code, 'айбек'])), (r) => r.rows[0]?.member_name === 'айбек 2');
await expectOk('повторный вход не даёт взять имя одноклассника', () => as('S2', true, () =>
  db.query('select * from join_class($1, $2)', [code, 'Айбек'])), (r) => r.rows[0]?.member_name !== 'Айбек');
await expectOk('свой повторный вход сохраняет своё имя', () => as('S1', true, () =>
  db.query('select * from join_class($1, $2)', [code, 'Айбек'])), (r) => r.rows[0]?.member_name === 'Айбек');
await expectOk('ученик пишет в data чужие studentId и имя…', () => as('S1', true, () =>
  db.query(`update submissions set data = jsonb_build_object('assignmentId', 'a_x', 'studentId', $1::text, 'studentName', 'айбек 2', 'best', 100)
            where student_id = $2`, [ids.S2, ids.S1])), () => true);
await expectOk('…но в базе остаются его собственные id и имя', () => as('T1', false, () =>
  db.query('select data from submissions where student_id = $1', [ids.S1])),
  (r) => r.rows[0]?.data?.studentId === ids.S1 && r.rows[0]?.data?.studentName === 'Айбек' && r.rows[0]?.data?.assignmentId === 'a_1');


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
await expectOk('учитель сохраняет учебные циклы', () => as('T1', false, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('cycles', '[{"id":"c1"}]', 1)`)), () => true);
await expectDenied('чужой учитель не видит циклы', () => as('T2', false, () =>
  db.query(`select * from user_data where key = 'cycles'`)));
await expectDenied('ученик не видит циклы учителя', () => as('S1', true, () =>
  db.query(`select * from user_data where key = 'cycles'`)));
await expectOk('учитель сохраняет отметки «разные вопросы»', () => as('T1', false, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('dup_reviewed', '["a|b"]', 1)`)), () => true);
await expectDenied('чужой учитель не видит отметки', () => as('T2', false, () =>
  db.query(`select * from user_data where key = 'dup_reviewed'`)));
await expectOk('учитель сохраняет проверку вопросов', () => as('T1', false, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('qreview', '{"math::f01":{"s":"ok"}}', 1)`)), () => true);
await expectDenied('чужой учитель не видит проверку вопросов', () => as('T2', false, () =>
  db.query(`select * from user_data where key = 'qreview'`)));

console.log('Удаление');
await expectOk('учитель удаляет ученика из класса', () => as('T1', false, () =>
  db.query('delete from class_members where user_id = $1', [ids.S1])), (r) => r.affectedRows === 1);
await expectDenied('после удаления ученик не видит задания', () => as('S1', true, () => db.query('select * from assignments')));
await expectOk('удаление класса удаляет задания (cascade)', () => as('T1', false, async () => {
  await db.query('delete from classes where id = $1', [classId]);
  return db.query('select * from assignments');
}), rows(0));

console.log('Размер данных и права функций');
await expectDenied('прогресс больше 8 МБ не записывается', () => as('S1', true, () =>
  db.query(`insert into user_data (key, value, updated_ms) values ('history', jsonb_build_array(repeat(md5(random()::text), 300000)), 1)
            on conflict (user_id, key) do update set value = excluded.value`)));
await expectOk('служебные функции не вызываются без входа', () => db.query(`select
    has_function_privilege('anon', 'public.is_class_teacher(uuid)', 'execute') a,
    has_function_privilege('anon', 'public.teaches_student(uuid)', 'execute') b,
    has_function_privilege('anon', 'public.gen_join_code()', 'execute') c,
    has_function_privilege('authenticated', 'public.is_class_member(uuid)', 'execute') d`),
  (r) => r.rows[0].a === false && r.rows[0].b === false && r.rows[0].c === false && r.rows[0].d === true);

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
// Аудит 21.10 (P1): время записи задавал браузер — «старые» записи не попадали в лимит,
// а записи «из будущего» навсегда блокировали журнал
await expectDenied('пачка «старых» записей не обходит лимит', () => asAnonRole(() => db.query(
  `insert into client_errors (created_at, page, message) select now() - interval '20 days', '/p', 'x' from generate_series(1, 400)`)));
await expectOk('время записи ставит база, а не браузер', async () => {
  await asAnonRole(() => db.query(`insert into client_errors (created_at, page, message) values ('2099-01-01', '/p', 'future')`));
  await db.exec('reset role');
  return db.query(`select created_at < now() + interval '1 minute' as ok from client_errors where message = 'future'`);
}, (r) => r.rows[0]?.ok === true);
await expectOk('после 300 отчётов за 10 минут новые отклоняются', () => asAnonRole(async () => {
  for (let i = 0; i < 300; i++) { try { await report(); } catch { /* сработала защита */ } }
  try { await report(); return false; } catch (e) { return /too many/.test(e.message); }
}), (r) => r === true);

console.log('Администратор и общий банк вопросов');
ids.A = '55555555-5555-5555-5555-555555555555';
await db.query('insert into auth.users (id, email) values ($1, $2)', [ids.A, 'owner@example.com']);
await db.query('update auth.users set is_anonymous = true where id in ($1, $2)', [ids.S1, ids.S2]);
await db.query('insert into admins (user_id) values ($1)', [ids.A]);
const Q = JSON.stringify({ type: 'single', question: { ru: '2 + 2?' }, options: [{ ru: '4' }, { ru: '5' }], correctAnswer: 0 });
const submit = (topic = 'math-6-fractions', source = 'q_1') => db.query(
  `insert into question_submissions (author_name, topic, source_id, question) values ('Асанова', $1, $2, $3) returning id`, [topic, source, Q]);

await expectDenied('список администраторов не читается без входа', () => asAnonRole(() => db.query('select * from admins')));
await expectDenied('учитель не видит список администраторов', () => as('T1', false, () => db.query('select * from admins')));
await expectDenied('учитель не может сделать себя администратором', () => as('T1', false, () =>
  db.query('insert into admins (user_id) values ($1)', [ids.T1])));
await expectOk('is_admin: владелец — да, учитель — нет', async () => [
  (await as('A', false, () => db.query('select public.is_admin() v'))).rows[0].v,
  (await as('T1', false, () => db.query('select public.is_admin() v'))).rows[0].v
], (r) => r[0] === true && r[1] === false);

let subId;
await expectOk('учитель предлагает вопрос в общий банк', () => as('T1', false, () => submit()), (r) => { subId = r.rows[0]?.id; return !!subId; });
await expectDenied('анонимный ученик не может предложить вопрос', () => as('S2', true, () => submit('math-6-fractions', 'q_s')));
await expectDenied('нельзя предложить вопрос от имени другого учителя', () => as('T1', false, () => db.query(
  `insert into question_submissions (author_id, topic, question) values ($1, 'math-6-fractions', $2)`, [ids.T2, Q])));
await expectDenied('нельзя сразу записать заявку одобренной', () => as('T1', false, () => db.query(
  `insert into question_submissions (topic, question, status) values ('math-6-fractions', $1, 'approved')`, [Q])));
await expectDenied('неверный id темы отклоняется', () => as('T1', false, () => submit('../x', 'q_t')));
await expectDenied('тот же вопрос нельзя отправить второй раз, пока он на рассмотрении', () => as('T1', false, () => submit()));
await expectDenied('чужой учитель не видит заявку', () => as('T2', false, () => db.query('select * from question_submissions')));
await expectDenied('учитель не может сам одобрить свою заявку', () => as('T1', false, () => db.query(
  `update question_submissions set status = 'approved' where id = $1`, [subId])));
await expectDenied('учитель не может вызвать одобрение', () => as('T1', false, () => db.query(
  'select public.admin_approve_submission($1)', [subId])));
await expectOk('администратор видит все заявки', () => as('A', false, () => db.query('select * from question_submissions')), rows(1));

let pubId;
const edited = JSON.stringify({ type: 'single', question: { ru: '2 + 2 = ?' }, options: [{ ru: '4' }, { ru: '5' }], correctAnswer: 0 });
await expectOk('администратор одобряет с правкой', () => as('A', false, () => db.query(
  'select public.admin_approve_submission($1, $2) id', [subId, edited])), (r) => { pubId = r.rows[0]?.id; return !!pubId; });
await expectDenied('рассмотренную заявку нельзя одобрить второй раз', () => as('A', false, () => db.query(
  'select public.admin_approve_submission($1)', [subId])));
await expectOk('гость видит одобренный вопрос с правкой и автором', () => asAnonRole(() => db.query(
  'select question, author_name, topic from public_questions')), (r) => r.rows.length === 1
  && r.rows[0].question.question.ru === '2 + 2 = ?' && r.rows[0].author_name === 'Асанова' && r.rows[0].topic === 'math-6-fractions');
await expectOk('автор видит, что заявка одобрена', () => as('T1', false, () => db.query(
  'select status, public_id from question_submissions where id = $1', [subId])), (r) => r.rows[0]?.status === 'approved' && r.rows[0].public_id === pubId);
await expectDenied('гость не может добавить вопрос в общий банк', () => asAnonRole(() => db.query(
  `insert into public_questions (topic, question) values ('math-6-fractions', $1)`, [Q])));
await expectDenied('учитель не может изменить общий вопрос', () => as('T1', false, () => db.query(
  'update public_questions set active = false where id = $1', [pubId])));
await expectDenied('учитель не может удалить общий вопрос', () => as('T1', false, () => db.query('delete from public_questions')));
await expectDenied('автор не может удалить одобренную заявку', () => as('T1', false, () => db.query(
  'delete from question_submissions where id = $1', [subId])));
await expectOk('администратор скрывает вопрос — гость его больше не видит', async () => {
  await as('A', false, () => db.query('update public_questions set active = false where id = $1', [pubId]));
  return asAnonRole(() => db.query('select * from public_questions'));
}, rows(0));
await expectOk('администратор по-прежнему видит скрытый вопрос', () => as('A', false, () => db.query('select * from public_questions')), rows(1));

let sub2;
await expectOk('учитель отправляет ещё один вопрос', () => as('T1', false, () => submit('math-6-fractions', 'q_2')), (r) => { sub2 = r.rows[0]?.id; return !!sub2; });
await expectOk('администратор отклоняет с заметкой, автор видит заметку', async () => {
  await as('A', false, () => db.query('select public.admin_reject_submission($1, $2)', [sub2, 'Нет объяснения']));
  return as('T1', false, () => db.query('select status, admin_note from question_submissions where id = $1', [sub2]));
}, (r) => r.rows[0]?.status === 'rejected' && r.rows[0].admin_note === 'Нет объяснения');
await expectOk('автор может забрать заявку, пока она на рассмотрении', async () => {
  const r = await as('T1', false, () => submit('math-6-fractions', 'q_3'));
  return as('T1', false, () => db.query('delete from question_submissions where id = $1', [r.rows[0].id]));
}, (r) => r.affectedRows === 1);
await expectOk('не больше 100 заявок в сутки', () => as('T2', false, async () => {
  for (let i = 0; i < 100; i++) await submit('math-6-fractions', `bulk_${i}`);
  try { await submit('math-6-fractions', 'bulk_x'); return false; } catch (e) { return /too_many_submissions/.test(e.message); }
}), (r) => r === true);

console.log('Статистика');
await expectOk('гость отмечает посещение', () => asAnonRole(() => db.query('select public.record_visit()')), () => true);
await expectOk('гость отмечает игру с ошибками по вопросам', () => asAnonRole(() => db.query(
  `select public.record_play('race', 'math-6-fractions', 3, 30, 20, $1)`, [JSON.stringify([{ id: 'f01', n: 3, wrong: 2 }, { id: 'bad id!', n: 1, wrong: 1 }])])), () => true);
await expectOk('ошибки по вопросу сложились, мусорный id пропущен', () => db.query('select question_id, answers, wrong from question_stats'),
  (r) => r.rows.length === 1 && r.rows[0].question_id === 'f01' && r.rows[0].answers === 3 && r.rows[0].wrong === 2);
await expectOk('числа обрезаются: игроков ≤ 200, верных ≤ ответов', async () => {
  await asAnonRole(() => db.query(`select public.record_play('quiz', '', 100000, 5, 999)`));
  return db.query(`select players, answers, correct from stats_daily where kind = 'play' and game = 'quiz'`);
}, (r) => r.rows[0]?.players === 200 && r.rows[0].answers === 5 && r.rows[0].correct === 5);
await expectDenied('неверное название игры отклоняется', () => asAnonRole(() => db.query(`select public.record_play('../x', '', 1, 1, 1)`)));
await expectDenied('статистика не читается без входа', () => asAnonRole(() => db.query('select * from stats_daily')));
await expectDenied('статистику не читает даже учитель', () => as('T1', false, () => db.query('select * from question_stats')));
await expectDenied('статистику нельзя подделать напрямую', () => asAnonRole(() => db.query(
  `insert into stats_daily (kind, events) values ('play', 1000000)`)));
await expectOk('главная получает только суммы', () => asAnonRole(() => db.query('select public.public_counters() c')),
  (r) => r.rows[0].c.plays === 2 && r.rows[0].c.visits === 1 && r.rows[0].c.questions === 0);
await expectOk('не больше 600 отметок в час с одного адреса', async () => {
  await db.query(`insert into stat_hits (bucket) select md5('unknown' || salt) from stat_salt, generate_series(1, 600) where day = current_date`);
  try { await asAnonRole(() => db.query('select public.record_visit()')); return false; }
  catch (e) { return /rate_limited/.test(e.message); } finally { await db.query('delete from stat_hits'); }
}, (r) => r === true);
await expectDenied('учитель не получает обзор администратора', () => as('T1', false, () => db.query('select public.admin_overview(30)')));
await expectOk('администратор получает обзор', () => as('A', false, () => db.query('select public.admin_overview(30) o')), (r) => {
  const o = r.rows[0].o;
  return o.totals.plays === 2 && o.totals.visits === 1 && o.games.length === 2 && o.users.teachers === 3
    && o.users.anonymous === 2 && o.bank.pending === 100 && o.bank.rejected === 1 && o.bank.public_active === 0;
});

console.log('Очистка анонимных аккаунтов');
const anonUser = async (id, daysAgo) => db.query(
  `insert into auth.users (id, is_anonymous, created_at) values ($1, true, now() - make_interval(days => $2))`, [id, daysAgo]);
const OLD = '66666666-6666-6666-6666-666666666666', IN_CLASS = '77777777-7777-7777-7777-777777777777',
  ACTIVE = '88888888-8888-8888-8888-888888888888', FRESH = '99999999-9999-9999-9999-999999999999';
await anonUser(OLD, 100); await anonUser(IN_CLASS, 100); await anonUser(ACTIVE, 100); await anonUser(FRESH, 5);
const cls2 = (await db.query(`insert into classes (teacher_id, name) values ($1, '7-Б') returning id`, [ids.T2])).rows[0].id;
await db.query(`insert into class_members (class_id, user_id, name) values ($1, $2, 'Айбек')`, [cls2, IN_CLASS]);
await db.query(`insert into user_data (user_id, key, value, updated_ms) values ($1, 'progress', '{}', $2)`, [ACTIVE, Date.now()]);
await expectOk('администратор видит, сколько аккаунтов лишние', () => as('A', false, () => db.query('select public.admin_stale_anonymous(60) n')),
  (r) => r.rows[0].n === 1);
await expectDenied('учитель не может удалять аккаунты', () => as('T1', false, () => db.query('select public.admin_cleanup_anonymous(60)')));
await expectOk('очистка удаляет только анонимный аккаунт без класса и без активности', async () => {
  await as('A', false, () => db.query('select public.admin_cleanup_anonymous(1)')); // меньше 14 дней нельзя
  return db.query('select id from auth.users where id in ($1, $2, $3, $4)', [OLD, IN_CLASS, ACTIVE, FRESH]);
}, (r) => r.rows.length === 3 && !r.rows.some((x) => x.id === OLD));
await expectOk('функции администратора и очистки не вызываются без входа', () => db.query(`select
    has_function_privilege('anon', 'public.admin_overview(int)', 'execute') a,
    has_function_privilege('anon', 'public.is_admin()', 'execute') b,
    has_function_privilege('authenticated', 'public.cleanup_anonymous(int)', 'execute') c,
    has_function_privilege('authenticated', 'public.stat_guard()', 'execute') d,
    has_function_privilege('anon', 'public.record_play(text, text, int, int, int, jsonb)', 'execute') e`),
  (r) => r.rows[0].a === false && r.rows[0].b === false && r.rows[0].c === false && r.rows[0].d === false && r.rows[0].e === true);

console.log('Журнал ошибок в админ-панели');
await expectDenied('учитель по-прежнему не читает журнал ошибок', () => as('T1', false, () => db.query('select * from client_errors')));
await expectDenied('учитель не может стереть журнал', () => as('T1', false, () => db.query('delete from client_errors')));
await expectOk('администратор читает журнал ошибок', () => as('A', false, () => db.query('select page, message from client_errors')),
  (r) => r.rows.length > 0);
await expectOk('администратор очищает журнал', async () => {
  await as('A', false, () => db.query('delete from client_errors'));
  return db.query('select count(*)::int n from client_errors');
}, (r) => r.rows[0].n === 0);

console.log(`\nИтог: ${pass} ok, ${fail} ошибок`);
process.exit(fail ? 1 : 0);
