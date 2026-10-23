-- ═══════════════════════════════════════════════════════════════════════════
-- Bilim Arena — схема Supabase.
--
-- Запуск: Supabase → SQL Editor → вставить весь файл → Run.
-- Скрипт можно запускать повторно: он пересоздаёт функции и политики.
--
-- Модель:
--   учитель   — обычный аккаунт (email + пароль)
--   ученик    — анонимный аккаунт, входит по коду класса и имени (без почты)
--   classes / class_members — классы и ученики
--   assignments  — домашние задания класса (задание + нужные вопросы, jsonb)
--   submissions  — результаты учеников
--   user_data    — личные данные пользователя (прогресс, ошибки, профиль…)
--
-- Безопасность держится на Row Level Security: публичный anon-ключ
-- во frontend безопасен, только пока RLS включён на всех таблицах.
-- ═══════════════════════════════════════════════════════════════════════════


-- Код класса: 6 символов без похожих букв и цифр (0/O, 1/I). Случайность — криптостойкая
-- (байты gen_random_uuid; random() предсказуем), 256 делится на 32 — без перекоса (аудит 21.10)
create or replace function public.gen_join_code()
returns text language sql volatile as $$
  select string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + get_byte(b, i) % 32, 1), '' order by i)
  from (select uuid_send(gen_random_uuid()) as b) x, generate_series(0, 5) as i;
$$;

-- ─── Таблицы ────────────────────────────────────────────────────────────────

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  grade       int  check (grade between 1 and 11),
  join_code   text not null unique default public.gen_join_code(),
  created_at  timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id   uuid not null references public.classes(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  joined_at  timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table if not exists public.assignments (
  id          text primary key check (char_length(id) <= 64),
  class_id    uuid not null references public.classes(id) on delete cascade,
  teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.submissions (
  assignment_id  text not null references public.assignments(id) on delete cascade,
  student_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  class_id       uuid not null references public.classes(id) on delete cascade,
  data           jsonb not null,
  updated_at     timestamptz not null default now(),
  primary key (assignment_id, student_id)
);

create table if not exists public.user_data (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key         text not null check (key in ('profile', 'progress', 'errors', 'history', 'questions', 'lessons', 'tests', 'cycles', 'dup_reviewed', 'qreview')),
  value       jsonb not null,
  updated_ms  bigint not null,   -- время изменения на устройстве (для «последняя запись побеждает»)
  primary key (user_id, key)
);

create index if not exists class_members_user_idx on public.class_members (user_id);
create index if not exists assignments_class_idx on public.assignments (class_id);
create index if not exists submissions_class_idx on public.submissions (class_id);

-- Неверные коды класса (для лимита попыток в join_class). Через API недоступна никому.
create table if not exists public.join_attempts (
  user_id      uuid not null,
  attempted_at timestamptz not null default now()
);
create index if not exists join_attempts_user_idx on public.join_attempts (user_id, attempted_at);
alter table public.join_attempts enable row level security;
revoke all on public.join_attempts from anon, authenticated;

-- Размер данных: без лимита один аккаунт мог записать мегабайты в каждую строку (аудит 21.10).
-- С запасом: вопросы учителя с картинками живут в user_data/assignments. not valid — старые
-- строки не проверяются, только новые записи.
alter table public.user_data drop constraint if exists user_data_value_size;
alter table public.user_data add constraint user_data_value_size check (pg_column_size(value) <= 8 * 1024 * 1024) not valid;
alter table public.assignments drop constraint if exists assignments_data_size;
alter table public.assignments add constraint assignments_data_size check (pg_column_size(data) <= 8 * 1024 * 1024) not valid;
alter table public.submissions drop constraint if exists submissions_data_size;
alter table public.submissions add constraint submissions_data_size check (pg_column_size(data) <= 1024 * 1024) not valid;

-- ─── Вспомогательные функции (security definer — без рекурсии в RLS) ────────

create or replace function public.is_class_teacher(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = cid and teacher_id = auth.uid());
$$;

create or replace function public.is_class_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_members where class_id = cid and user_id = auth.uid());
$$;

create or replace function public.teaches_student(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from class_members m join classes c on c.id = m.class_id
    where m.user_id = sid and c.teacher_id = auth.uid()
  );
$$;

-- Анонимный (ученический) аккаунт не может создавать классы
create or replace function public.is_full_account()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

-- Служебные функции: только для вошедших (их используют политики RLS и значение по умолчанию
-- join_code); без входа вызывать их незачем (аудит 21.10)
revoke all on function public.is_class_teacher(uuid), public.is_class_member(uuid), public.teaches_student(uuid),
  public.is_full_account(), public.gen_join_code() from public, anon;
grant execute on function public.is_class_teacher(uuid), public.is_class_member(uuid), public.teaches_student(uuid),
  public.is_full_account(), public.gen_join_code() to authenticated;

-- Вход ученика в класс по коду: единственный способ стать участником класса.
-- Имя уникально в классе: если его уже носит другой ученик, добавляется номер («Айбек 2») —
-- так нельзя взять имя одноклассника и попасть в его отчёт (аудит 21.10).
drop function if exists public.join_class(text, text);
create function public.join_class(code text, display_name text)
returns table (class_id uuid, class_name text, grade int, member_name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  c classes%rowtype;
  clean_name text := left(trim(display_name), 40);
  final_name text;
  n int := 1;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if clean_name is null or clean_name = '' then
    raise exception 'name_required';
  end if;

  -- Подбор кода: не больше 10 неверных кодов за час на пользователя. Неверный код записывается
  -- и даёт пустой ответ (исключение откатило бы запись); сайт показывает «класс не найден»
  if (select count(*) from join_attempts
      where user_id = auth.uid() and attempted_at > now() - interval '1 hour') >= 10 then
    raise exception 'too_many_attempts';
  end if;
  select * into c from classes where join_code = upper(trim(code));
  if not found then
    delete from join_attempts where attempted_at < now() - interval '1 day';
    insert into join_attempts (user_id) values (auth.uid());
    return;
  end if;

  final_name := clean_name;
  while exists (select 1 from class_members m
                where m.class_id = c.id and m.user_id <> auth.uid() and lower(m.name) = lower(final_name)) loop
    n := n + 1;
    final_name := left(clean_name, 36) || ' ' || n;
  end loop;

  insert into class_members (class_id, user_id, name)
  values (c.id, auth.uid(), final_name)
  on conflict on constraint class_members_pkey do update set name = excluded.name;

  return query select c.id, c.name, c.grade, final_name;
end;
$$;

revoke all on function public.join_class(text, text) from public, anon;
grant execute on function public.join_class(text, text) to authenticated;

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.classes       enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments   enable row level security;
alter table public.submissions   enable row level security;
alter table public.user_data     enable row level security;

-- classes
drop policy if exists classes_select on public.classes;
drop policy if exists classes_insert on public.classes;
drop policy if exists classes_update on public.classes;
drop policy if exists classes_delete on public.classes;
create policy classes_select on public.classes for select to authenticated
  using (teacher_id = auth.uid() or public.is_class_member(id));
create policy classes_insert on public.classes for insert to authenticated
  with check (teacher_id = auth.uid() and public.is_full_account());
create policy classes_update on public.classes for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy classes_delete on public.classes for delete to authenticated
  using (teacher_id = auth.uid());

-- class_members: вступить можно только через join_class()
drop policy if exists members_select on public.class_members;
drop policy if exists members_update on public.class_members;
drop policy if exists members_delete on public.class_members;
create policy members_select on public.class_members for select to authenticated
  using (user_id = auth.uid() or public.is_class_teacher(class_id));
-- Изменять строку участника нельзя никому: вступление и имя — только через join_class()
-- (иначе ученик мог бы сам перейти в чужой класс или взять чужое имя)
revoke update on public.class_members from authenticated, anon;
create policy members_delete on public.class_members for delete to authenticated
  using (user_id = auth.uid() or public.is_class_teacher(class_id));

-- assignments
drop policy if exists assignments_select on public.assignments;
drop policy if exists assignments_write on public.assignments;
create policy assignments_select on public.assignments for select to authenticated
  using (teacher_id = auth.uid() or public.is_class_member(class_id));
create policy assignments_write on public.assignments for all to authenticated
  using (teacher_id = auth.uid() and public.is_class_teacher(class_id))
  with check (teacher_id = auth.uid() and public.is_class_teacher(class_id));

-- submissions: ученик пишет только свои результаты и только в своём классе
drop policy if exists submissions_select on public.submissions;
drop policy if exists submissions_insert on public.submissions;
drop policy if exists submissions_update on public.submissions;
create policy submissions_select on public.submissions for select to authenticated
  using (student_id = auth.uid() or public.is_class_teacher(class_id));
create policy submissions_insert on public.submissions for insert to authenticated
  with check (
    student_id = auth.uid() and public.is_class_member(class_id)
    and exists (select 1 from public.assignments a where a.id = assignment_id and a.class_id = submissions.class_id)
  );
create policy submissions_update on public.submissions for update to authenticated
  using (student_id = auth.uid())
  with check (
    student_id = auth.uid() and public.is_class_member(class_id)
    and exists (select 1 from public.assignments a where a.id = assignment_id and a.class_id = submissions.class_id)
  );

-- user_data: свои данные; учитель видит только прогресс и ошибки своих учеников
drop policy if exists user_data_own on public.user_data;
drop policy if exists user_data_teacher on public.user_data;
create policy user_data_own on public.user_data for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_data_teacher on public.user_data for select to authenticated
  using (key in ('progress', 'errors') and public.teaches_student(user_id));

-- Содержимое результата не может спорить со строкой: studentId, assignmentId и имя берутся
-- из самой строки и списка класса, а не из того, что прислал браузер (аудит 21.10)
create or replace function public.submissions_fill()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.data := coalesce(new.data, '{}'::jsonb) || jsonb_build_object(
    'studentId', new.student_id::text,
    'assignmentId', new.assignment_id,
    'studentName', coalesce(
      (select m.name from class_members m where m.class_id = new.class_id and m.user_id = new.student_id),
      new.data ->> 'studentName'));
  return new;
end $$;
revoke all on function public.submissions_fill() from public, anon, authenticated;
drop trigger if exists submissions_fill on public.submissions;
create trigger submissions_fill before insert or update on public.submissions
  for each row execute function public.submissions_fill();

-- ─── Журнал ошибок сайта ────────────────────────────────────────────────────
-- Браузер сообщает о сбоях (core/errors.js): страница без параметров, текст
-- ошибки, язык, браузер. Имён и id пользователей здесь нет. Записать может
-- любой посетитель, прочитать — только владелец проекта (Table Editor).
create table if not exists public.client_errors (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  page        text not null check (char_length(page) <= 200),
  message     text not null check (char_length(message) between 1 and 500),
  stack       text check (char_length(stack) <= 2000),
  lang        text check (char_length(lang) <= 5),
  ua          text check (char_length(ua) <= 300),
  version     text check (char_length(version) <= 20)
);
create index if not exists client_errors_created_idx on public.client_errors (created_at);
alter table public.client_errors enable row level security;

drop policy if exists client_errors_insert on public.client_errors;
create policy client_errors_insert on public.client_errors for insert to anon, authenticated
  with check (true);
-- Политики чтения нет: через API журнал не читается никем

-- Защита от потока: не больше 300 отчётов за 10 минут на весь сайт и не больше 20 000 всего;
-- записи старше 30 дней удаляются. Время записи ставит база: присланное браузером время
-- позволяло обойти лимит («старые» записи) или заблокировать журнал навсегда (аудит 21.10).
create or replace function public.client_errors_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  if (select count(*) from public.client_errors where created_at > now() - interval '10 minutes') >= 300 then
    raise exception 'too many error reports' using errcode = 'P0001';
  end if;
  delete from public.client_errors where created_at < now() - interval '30 days';
  if (select count(*) from public.client_errors) >= 20000 then
    raise exception 'too many error reports' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.client_errors_guard() from public, anon, authenticated;
drop trigger if exists client_errors_guard on public.client_errors;
create trigger client_errors_guard before insert on public.client_errors
  for each row execute function public.client_errors_guard();

-- ─── 2026-10: тесты учителя ('tests'), учебные циклы ('cycles'), отметки «разные вопросы» ('dup_reviewed') — для уже созданной базы ─
alter table public.user_data drop constraint if exists user_data_key_check;
alter table public.user_data add constraint user_data_key_check
  check (key in ('profile', 'progress', 'errors', 'history', 'questions', 'lessons', 'tests', 'cycles', 'dup_reviewed', 'qreview'));

-- ─── 2026-10-23: администратор, общий банк вопросов, статистика, очистка анонимных аккаунтов ──
-- ТЗ: docs/TZ-ADMIN-2026-10.md.
-- 1. admins / is_admin(): кто владелец. Через API таблицу не меняет никто — запись добавляется в SQL Editor.
-- 2. question_submissions: учитель предлагает свой вопрос в общий банк; администратор одобряет или отклоняет.
-- 3. public_questions: одобренные вопросы — их читает любой посетитель, сайт добавляет их в игры.
-- 4. stats_daily / question_stats: посещения и сыгранные игры по дням, ошибки по вопросам. Без имён и id.
-- 5. Очистка анонимных аккаунтов без класса (кнопка в админке или pg_cron).
-- Выполнить один раз в Supabase → SQL Editor (то же есть в schema.sql). Повторный запуск безопасен.
-- Откат: drop function public.admin_overview(int), public.admin_approve_submission(uuid, jsonb, text),
--   public.admin_reject_submission(uuid, text), public.admin_stale_anonymous(int), public.admin_cleanup_anonymous(int),
--   public.cleanup_anonymous(int), public.record_visit(), public.record_play(text, text, int, int, int, jsonb),
--   public.public_counters(), public.stat_guard(), public.is_admin();
--   drop table public.public_questions, public.question_submissions, public.question_stats, public.stats_daily,
--   public.stat_hits, public.stat_salt, public.admins.

-- ── Администратор ──
create table if not exists public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_full_account() and exists (select 1 from admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ── Заявки учителей в общий банк ──
create table if not exists public.question_submissions (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name  text not null default '' check (char_length(author_name) <= 60),
  topic        text not null check (topic ~ '^[a-z0-9_-]{1,60}$'),
  source_id    text check (char_length(source_id) <= 80),   -- id вопроса в конструкторе учителя
  question     jsonb not null check (jsonb_typeof(question) = 'object' and pg_column_size(question) <= 512 * 1024),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note   text check (char_length(admin_note) <= 500),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  public_id    uuid
);
create index if not exists question_submissions_status_idx on public.question_submissions (status, created_at);
create index if not exists question_submissions_author_idx on public.question_submissions (author_id, created_at);
-- Один и тот же вопрос учителя не висит на рассмотрении дважды
create unique index if not exists question_submissions_pending_source
  on public.question_submissions (author_id, source_id) where status = 'pending' and source_id is not null;
alter table public.question_submissions enable row level security;

drop policy if exists submissions_q_select on public.question_submissions;
drop policy if exists submissions_q_insert on public.question_submissions;
drop policy if exists submissions_q_delete on public.question_submissions;
create policy submissions_q_select on public.question_submissions for select to authenticated
  using (author_id = auth.uid() or public.is_admin());
-- Только обычный аккаунт (учитель), только от своего имени и только «на рассмотрении»
create policy submissions_q_insert on public.question_submissions for insert to authenticated
  with check (author_id = auth.uid() and public.is_full_account() and status = 'pending'
    and admin_note is null and reviewed_at is null and public_id is null);
-- Автор может забрать заявку, пока её не рассмотрели
create policy submissions_q_delete on public.question_submissions for delete to authenticated
  using ((author_id = auth.uid() and status = 'pending') or public.is_admin());
-- Политики update нет: решение принимается только функциями администратора ниже
revoke update on public.question_submissions from anon, authenticated;

-- Время ставит база; не больше 100 заявок в сутки на автора
create or replace function public.question_submissions_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  if (select count(*) from question_submissions
      where author_id = new.author_id and created_at > now() - interval '1 day') >= 100 then
    raise exception 'too_many_submissions' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.question_submissions_guard() from public, anon, authenticated;
drop trigger if exists question_submissions_guard on public.question_submissions;
create trigger question_submissions_guard before insert on public.question_submissions
  for each row execute function public.question_submissions_guard();

-- ── Общий банк: одобренные вопросы ──
create table if not exists public.public_questions (
  id             uuid primary key default gen_random_uuid(),
  topic          text not null check (topic ~ '^[a-z0-9_-]{1,60}$'),
  question       jsonb not null check (jsonb_typeof(question) = 'object' and pg_column_size(question) <= 512 * 1024),
  author_name    text not null default '' check (char_length(author_name) <= 60),
  submission_id  uuid references public.question_submissions(id) on delete set null,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists public_questions_topic_idx on public.public_questions (topic) where active;
alter table public.public_questions enable row level security;

drop policy if exists public_q_read_anon on public.public_questions;
drop policy if exists public_q_read on public.public_questions;
drop policy if exists public_q_admin on public.public_questions;
create policy public_q_read_anon on public.public_questions for select to anon using (active);
create policy public_q_read on public.public_questions for select to authenticated using (active or public.is_admin());
create policy public_q_admin on public.public_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── Статистика (без личных данных) ──
create table if not exists public.stats_daily (
  day      date not null default current_date,
  kind     text not null check (kind in ('visit', 'play')),
  game     text not null default '' check (game ~ '^[a-z0-9_-]{0,40}$'),
  topic    text not null default '' check (topic ~ '^[a-z0-9_-]{0,60}$'),
  events   int not null default 0,
  players  int not null default 0,
  answers  int not null default 0,
  correct  int not null default 0,
  primary key (day, kind, game, topic)
);
create table if not exists public.question_stats (
  topic        text not null check (topic ~ '^[a-z0-9_-]{1,60}$'),
  question_id  text not null check (question_id ~ '^[A-Za-z0-9_.:-]{1,80}$'),
  answers      int not null default 0,
  wrong        int not null default 0,
  last_at      timestamptz not null default now(),
  primary key (topic, question_id)
);
-- Лимит частоты: адрес хранится только как хэш с секретной солью дня, записи живут сутки
create table if not exists public.stat_salt (
  day   date primary key,
  salt  text not null default gen_random_uuid()::text
);
create table if not exists public.stat_hits (
  bucket  text not null,
  at      timestamptz not null default now()
);
create index if not exists stat_hits_at_idx on public.stat_hits (at);
create index if not exists stat_hits_bucket_idx on public.stat_hits (bucket, at);
alter table public.stats_daily enable row level security;
alter table public.question_stats enable row level security;
alter table public.stat_salt enable row level security;
alter table public.stat_hits enable row level security;
-- Политик нет: таблицы читают и пишут только функции ниже
revoke all on public.stats_daily, public.question_stats, public.stat_salt, public.stat_hits from anon, authenticated;

-- Не больше 600 отметок в час с одного адреса и 20 000 в час на весь сайт
create or replace function public.stat_guard()
returns void language plpgsql security definer set search_path = public as $$
declare
  headers json := nullif(current_setting('request.headers', true), '')::json;
  ip text := coalesce(nullif(trim(split_part(headers ->> 'x-forwarded-for', ',', 1)), ''), 'unknown');
  s text;
  b text;
begin
  insert into stat_salt (day) values (current_date) on conflict do nothing;
  delete from stat_salt where day < current_date - 1;
  select salt into s from stat_salt where day = current_date;
  b := md5(ip || s);
  if (select count(*) from stat_hits where at > now() - interval '1 hour') >= 20000
     or (select count(*) from stat_hits where bucket = b and at > now() - interval '1 hour') >= 600 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  delete from stat_hits where at < now() - interval '1 day';
  insert into stat_hits (bucket) values (b);
end $$;
revoke all on function public.stat_guard() from public, anon, authenticated;

-- Посещение: сайт вызывает один раз в день с устройства
create or replace function public.record_visit()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform stat_guard();
  insert into stats_daily (day, kind, events) values (current_date, 'visit', 1)
  on conflict on constraint stats_daily_pkey do update set events = stats_daily.events + 1;
end $$;

-- Сыгранная игра: игра, тема, игроки, ответы, верные + до 60 вопросов [{id, n, wrong}]
create or replace function public.record_play(game text, topic text, players int, answers int, correct int, questions jsonb default '[]')
returns void language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare
  g text := coalesce(game, '');
  t text := coalesce(topic, '');
  p int := least(greatest(coalesce(players, 0), 0), 200);
  a int := least(greatest(coalesce(answers, 0), 0), 2000);
  c int := least(greatest(coalesce(correct, 0), 0), least(greatest(coalesce(answers, 0), 0), 2000));
  q jsonb;
  qid text;
  n int;
  w int;
begin
  if g !~ '^[a-z0-9_-]{1,40}$' or t !~ '^[a-z0-9_-]{0,60}$' then
    raise exception 'bad_input' using errcode = 'P0001';
  end if;
  perform stat_guard();
  insert into stats_daily (day, kind, game, topic, events, players, answers, correct)
  values (current_date, 'play', g, t, 1, p, a, c)
  on conflict on constraint stats_daily_pkey do update set
    events = stats_daily.events + 1, players = stats_daily.players + excluded.players,
    answers = stats_daily.answers + excluded.answers, correct = stats_daily.correct + excluded.correct;

  if t = '' or jsonb_typeof(questions) is distinct from 'array' then return; end if;
  for q in select value from jsonb_array_elements(questions) with ordinality as e(value, i) where i <= 60 loop
    qid := q ->> 'id';
    if jsonb_typeof(q) <> 'object' or qid is null or qid !~ '^[A-Za-z0-9_.:-]{1,80}$' then continue; end if;
    n := least(greatest(coalesce((q ->> 'n')::int, 1), 0), 200);
    w := least(greatest(coalesce((q ->> 'wrong')::int, 0), 0), n);
    if n = 0 then continue; end if;
    -- Не больше 50 000 разных вопросов: мусорные id не раздуют таблицу
    if not exists (select 1 from question_stats s where s.topic = t and s.question_id = qid)
       and (select count(*) from question_stats) >= 50000 then continue; end if;
    insert into question_stats (topic, question_id, answers, wrong) values (t, qid, n, w)
    on conflict on constraint question_stats_pkey do update set
      answers = question_stats.answers + excluded.answers, wrong = question_stats.wrong + excluded.wrong, last_at = now();
  end loop;
exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception 'bad_input' using errcode = 'P0001';
end $$;

-- Числа для главной страницы: только суммы
create or replace function public.public_counters()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'plays', coalesce((select sum(events) from stats_daily where kind = 'play'), 0),
    'visits', coalesce((select sum(events) from stats_daily where kind = 'visit'), 0),
    'questions', (select count(*) from public_questions where active));
$$;

revoke all on function public.record_visit(), public.record_play(text, text, int, int, int, jsonb), public.public_counters() from public;
grant execute on function public.record_visit(), public.record_play(text, text, int, int, int, jsonb), public.public_counters() to anon, authenticated;

-- ── Функции администратора ──
create or replace function public.admin_approve_submission(sid uuid, edited jsonb default null, new_topic text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s question_submissions%rowtype;
  pid uuid;
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into s from question_submissions where id = sid for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if s.status <> 'pending' then raise exception 'already_reviewed' using errcode = 'P0001'; end if;
  insert into public_questions (topic, question, author_name, submission_id)
  values (coalesce(nullif(new_topic, ''), s.topic), coalesce(edited, s.question), s.author_name, s.id)
  returning id into pid;
  update question_submissions set status = 'approved', reviewed_at = now(), public_id = pid,
    question = coalesce(edited, question), topic = coalesce(nullif(new_topic, ''), topic)
  where id = sid;
  return pid;
end $$;

create or replace function public.admin_reject_submission(sid uuid, note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update question_submissions set status = 'rejected', reviewed_at = now(), admin_note = left(note, 500)
  where id = sid and status = 'pending';
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
end $$;

-- Лишние анонимные аккаунты: без класса, старше N дней, без изменений данных за N дней
create or replace function public.stale_anonymous_ids(days int)
returns setof uuid language sql stable security definer set search_path = public as $$
  select u.id from auth.users u
  where coalesce(u.is_anonymous, false)
    and u.created_at < now() - make_interval(days => greatest(days, 14))
    and not exists (select 1 from class_members m where m.user_id = u.id)
    and not exists (select 1 from admins a where a.user_id = u.id)
    and not exists (select 1 from user_data d where d.user_id = u.id
      and d.updated_ms > (extract(epoch from now() - make_interval(days => greatest(days, 14))) * 1000)::bigint);
$$;

-- Для pg_cron и для кнопки в админке (через admin_cleanup_anonymous)
create or replace function public.cleanup_anonymous(days int default 60)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from auth.users where id in (select stale_anonymous_ids(days));
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.admin_stale_anonymous(days int default 60)
returns int language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return (select count(*) from stale_anonymous_ids(days));
end $$;

create or replace function public.admin_cleanup_anonymous(days int default 60)
returns int language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return cleanup_anonymous(days);
end $$;

-- Всё для экрана «Обзор» одним запросом
create or replace function public.admin_overview(days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  since date := current_date - (least(greatest(coalesce(days, 30), 1), 365) - 1);
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'since', since,
    'visits_by_day', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'n', n) order by day)
      from (select day, sum(events) n from stats_daily where kind = 'visit' and day >= since group by day) x), '[]'),
    'plays_by_day', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'n', n, 'players', pl) order by day)
      from (select day, sum(events) n, sum(players) pl from stats_daily where kind = 'play' and day >= since group by day) x), '[]'),
    'games', coalesce((select jsonb_agg(jsonb_build_object('game', game, 'plays', n, 'players', pl, 'answers', a, 'correct', c) order by n desc)
      from (select game, sum(events) n, sum(players) pl, sum(answers) a, sum(correct) c
            from stats_daily where kind = 'play' and day >= since group by game) x), '[]'),
    'topics', coalesce((select jsonb_agg(jsonb_build_object('topic', topic, 'plays', n, 'answers', a, 'correct', c) order by n desc)
      from (select topic, sum(events) n, sum(answers) a, sum(correct) c
            from stats_daily where kind = 'play' and day >= since and topic <> '' group by topic) x), '[]'),
    'hard_questions', coalesce((select jsonb_agg(jsonb_build_object('topic', topic, 'id', question_id, 'answers', answers, 'wrong', wrong))
      from (select * from question_stats where answers >= 5
            order by wrong::numeric / answers desc, answers desc limit 15) x), '[]'),
    'totals', jsonb_build_object(
      'visits', coalesce((select sum(events) from stats_daily where kind = 'visit'), 0),
      'plays', coalesce((select sum(events) from stats_daily where kind = 'play'), 0),
      'players', coalesce((select sum(players) from stats_daily where kind = 'play'), 0),
      'answers', coalesce((select sum(answers) from stats_daily where kind = 'play'), 0),
      'correct', coalesce((select sum(correct) from stats_daily where kind = 'play'), 0),
      'visits_today', coalesce((select sum(events) from stats_daily where kind = 'visit' and day = current_date), 0),
      'plays_today', coalesce((select sum(events) from stats_daily where kind = 'play' and day = current_date), 0)),
    'users', jsonb_build_object(
      'teachers', (select count(*) from auth.users where not coalesce(is_anonymous, false)),
      'anonymous', (select count(*) from auth.users where coalesce(is_anonymous, false)),
      'students_in_classes', (select count(distinct user_id) from class_members),
      'classes', (select count(*) from classes),
      'stale_anonymous', (select count(*) from stale_anonymous_ids(60))),
    'bank', jsonb_build_object(
      'pending', (select count(*) from question_submissions where status = 'pending'),
      'approved', (select count(*) from question_submissions where status = 'approved'),
      'rejected', (select count(*) from question_submissions where status = 'rejected'),
      'public_active', (select count(*) from public_questions where active))
  );
end $$;

revoke all on function public.stale_anonymous_ids(int), public.cleanup_anonymous(int) from public, anon, authenticated;
revoke all on function public.admin_approve_submission(uuid, jsonb, text), public.admin_reject_submission(uuid, text),
  public.admin_stale_anonymous(int), public.admin_cleanup_anonymous(int), public.admin_overview(int) from public, anon;
grant execute on function public.admin_approve_submission(uuid, jsonb, text), public.admin_reject_submission(uuid, text),
  public.admin_stale_anonymous(int), public.admin_cleanup_anonymous(int), public.admin_overview(int) to authenticated;

-- ─── 2026-10-24: журнал ошибок сайта в админ-панели ──
-- Раньше client_errors читался только в Table Editor. Теперь его читает и чистит администратор (is_admin()).
-- Гость, ученик и учитель по-прежнему могут только добавить запись. Выполнять после 2026-10-23-admin-stats.sql.
-- Откат: drop policy client_errors_admin_read on public.client_errors;
--   drop policy client_errors_admin_delete on public.client_errors;
drop policy if exists client_errors_admin_read on public.client_errors;
drop policy if exists client_errors_admin_delete on public.client_errors;
create policy client_errors_admin_read on public.client_errors for select to authenticated
  using (public.is_admin());
create policy client_errors_admin_delete on public.client_errors for delete to authenticated
  using (public.is_admin());
