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


-- Код класса: 6 символов без похожих букв и цифр (0/O, 1/I)
create or replace function public.gen_join_code()
returns text language sql volatile as $$
  select string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 6);
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
  key         text not null check (key in ('profile', 'progress', 'errors', 'history', 'questions', 'lessons', 'tests', 'cycles', 'dup_reviewed')),
  value       jsonb not null,
  updated_ms  bigint not null,   -- время изменения на устройстве (для «последняя запись побеждает»)
  primary key (user_id, key)
);

create index if not exists class_members_user_idx on public.class_members (user_id);
create index if not exists assignments_class_idx on public.assignments (class_id);
create index if not exists submissions_class_idx on public.submissions (class_id);

-- ─── Вспомогательные функции (security definer — без рекурсии в RLS) ────────

create or replace function public.is_class_teacher(cid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from classes where id = cid and teacher_id = auth.uid());
$$;

create or replace function public.is_class_member(cid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from class_members where class_id = cid and user_id = auth.uid());
$$;

create or replace function public.teaches_student(sid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
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

-- ─── Лимиты частоты (на стороне базы — браузер их не обойдёт) ───────────────
-- Счётчики живут в отдельной схеме, которую API Supabase не открывает.
-- Окно фиксированное: «не больше N действий пользователя за W секунд».
-- Ошибка PT429 — API отвечает HTTP 429. Сервисные запросы (без auth.uid()) не ограничиваются.
create schema if not exists ba_private;
revoke all on schema ba_private from public, anon, authenticated;

create table if not exists ba_private.rate_counters (
  user_id       uuid not null,
  bucket        text not null,
  window_start  timestamptz not null,
  hits          int not null default 0,
  primary key (user_id, bucket, window_start)
);
revoke all on ba_private.rate_counters from public, anon, authenticated;

create or replace function ba_private.hit(p_bucket text, p_max int, p_window int)
returns void language plpgsql security definer set search_path = ba_private, pg_temp as $$
declare
  uid uuid := auth.uid();
  w timestamptz;
  n int;
begin
  if uid is null then return; end if;
  w := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window);
  insert into ba_private.rate_counters as r (user_id, bucket, window_start, hits)
  values (uid, p_bucket, w, 1)
  on conflict (user_id, bucket, window_start) do update set hits = r.hits + 1
  returning r.hits into n;
  if n > p_max then
    raise exception 'rate_limited' using errcode = 'PT429', hint = p_bucket;
  end if;
  -- Старые окна убираются попутно (примерно каждый сотый вызов)
  if random() < 0.01 then
    delete from ba_private.rate_counters where window_start < now() - interval '1 day';
  end if;
end $$;
revoke all on function ba_private.hit(text, int, int) from public, anon, authenticated;

-- Вход ученика в класс по коду: единственный способ стать участником класса.
-- Неверный код — пустой ответ, а не ошибка: так попытка остаётся в счётчике
-- (ошибка откатила бы его) и перебор кодов упирается в лимит.
create or replace function public.join_class(code text, display_name text)
returns table (class_id uuid, class_name text, grade int)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  c classes%rowtype;
  clean_name text := left(trim(display_name), 40);
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  perform ba_private.hit('join_class', 20, 600);  -- 20 попыток за 10 минут
  if clean_name is null or clean_name = '' then
    raise exception 'name_required';
  end if;
  if code is null or char_length(code) > 32 then
    return;
  end if;

  select * into c from classes where join_code = upper(trim(code));
  if not found then
    return;
  end if;

  if not exists (select 1 from class_members m where m.class_id = c.id and m.user_id = auth.uid())
     and (select count(*) from class_members m where m.class_id = c.id) >= 200 then
    raise exception 'class_full';
  end if;

  insert into class_members (class_id, user_id, name)
  values (c.id, auth.uid(), clean_name)
  on conflict on constraint class_members_pkey do update set name = excluded.name;

  return query select c.id, c.name, c.grade;
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
create policy members_update on public.class_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy members_delete on public.class_members for delete to authenticated
  using (user_id = auth.uid() or public.is_class_teacher(class_id));

-- В своей записи ученик меняет только имя. Класс и пользователь записи
-- задаются лишь через join_class(); политика выше старые значения не видит,
-- поэтому без этого блока UPDATE мог перенести запись в чужой класс.
-- 1) Права PostgreSQL: UPDATE только колонки name (Supabase по умолчанию
--    выдаёт anon/authenticated права на всю таблицу — забираем их).
revoke update on public.class_members from anon, authenticated;
grant update (name) on public.class_members to authenticated;

-- 2) Второй рубеж, если права на всю таблицу выдадут снова («grant all»):
--    для ролей сайта class_id и user_id неизменяемы. Владелец базы,
--    service_role и join_class() (security definer) не затронуты.
create or replace function public.class_members_keep_keys()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user in ('anon', 'authenticated')
     and (new.class_id is distinct from old.class_id or new.user_id is distinct from old.user_id) then
    raise exception 'class_members_keys_immutable' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists class_members_keep_keys on public.class_members;
create trigger class_members_keep_keys before update on public.class_members
  for each row execute function public.class_members_keep_keys();

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

-- Защита от потока: не больше 300 отчётов за 10 минут на весь сайт;
-- записи старше 30 дней удаляются
create or replace function public.client_errors_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.client_errors where created_at > now() - interval '10 minutes') >= 300 then
    raise exception 'too many error reports' using errcode = 'P0001';
  end if;
  delete from public.client_errors where created_at < now() - interval '30 days';
  return new;
end $$;
drop trigger if exists client_errors_guard on public.client_errors;
create trigger client_errors_guard before insert on public.client_errors
  for each row execute function public.client_errors_guard();

-- ─── 2026-10: тесты учителя ('tests'), учебные циклы ('cycles'), отметки «разные вопросы» ('dup_reviewed') — для уже созданной базы ─
alter table public.user_data drop constraint if exists user_data_key_check;
alter table public.user_data add constraint user_data_key_check
  check (key in ('profile', 'progress', 'errors', 'history', 'questions', 'lessons', 'tests', 'cycles', 'dup_reviewed'));

-- ═══ Защита от злоупотреблений (2026-10-21) ══════════════════════════════════
-- Всё ниже работает в базе, т.е. на доверенной стороне. Пределы взяты с запасом
-- над обычным уроком: сайт отправляет изменения не чаще раза в 1,5 с.

-- Частота записи: на каждый оператор (upsert = INSERT + UPDATE, это 2 разных счётчика)
create or replace function public.ba_rate_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform ba_private.hit(tg_table_name || ':' || lower(tg_op), tg_argv[0]::int, tg_argv[1]::int);
  return null;
end $$;

drop trigger if exists ba_rate on public.user_data;
create trigger ba_rate before insert or update or delete on public.user_data
  for each statement execute function public.ba_rate_guard('120', '60');
drop trigger if exists ba_rate on public.submissions;
create trigger ba_rate before insert or update or delete on public.submissions
  for each statement execute function public.ba_rate_guard('90', '60');
drop trigger if exists ba_rate on public.assignments;
create trigger ba_rate before insert or update or delete on public.assignments
  for each statement execute function public.ba_rate_guard('90', '60');
drop trigger if exists ba_rate on public.classes;
create trigger ba_rate before insert or update or delete on public.classes
  for each statement execute function public.ba_rate_guard('30', '3600');
drop trigger if exists ba_rate on public.class_members;
create trigger ba_rate before update or delete on public.class_members
  for each statement execute function public.ba_rate_guard('120', '60');

-- Размер и состав данных. Ученик (анонимный аккаунт) хранит только 4 ключа и
-- до 1 млн символов в каждом; учитель — до 5 млн (≈ всё хранилище браузера).
-- Ошибка PT413 — API отвечает HTTP 413.
create or replace function public.ba_size_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  len int;
  cap int;
begin
  if auth.uid() is null then return new; end if;
  if tg_table_name = 'user_data' then
    len := char_length(new.value::text);
    if public.is_full_account() then
      cap := 5000000;
    else
      cap := 1000000;
      if new.key not in ('profile', 'progress', 'errors', 'history') then
        raise exception 'key_not_allowed' using errcode = '42501';
      end if;
    end if;
  elsif tg_table_name = 'assignments' then
    len := char_length(new.data::text); cap := 5000000;
  elsif tg_table_name = 'submissions' then
    len := char_length(new.data::text); cap := 1000000;
  else
    return new;
  end if;
  if len > cap then
    raise exception 'payload_too_large' using errcode = 'PT413', hint = tg_table_name;
  end if;
  return new;
end $$;

drop trigger if exists ba_size on public.user_data;
create trigger ba_size before insert or update on public.user_data
  for each row execute function public.ba_size_guard();
drop trigger if exists ba_size on public.assignments;
create trigger ba_size before insert or update on public.assignments
  for each row execute function public.ba_size_guard();
drop trigger if exists ba_size on public.submissions;
create trigger ba_size before insert or update on public.submissions
  for each row execute function public.ba_size_guard();

-- Количество: классов у учителя и заданий в классе (учеников в классе — в join_class)
create or replace function public.ba_count_classes()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null
     and (select count(*) from classes where teacher_id = new.teacher_id) >= 100 then
    raise exception 'too_many_classes' using errcode = 'PT429';
  end if;
  return new;
end $$;

create or replace function public.ba_count_assignments()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null
     and not exists (select 1 from assignments where id = new.id)
     and (select count(*) from assignments where class_id = new.class_id) >= 500 then
    raise exception 'too_many_assignments' using errcode = 'PT429';
  end if;
  return new;
end $$;

drop trigger if exists ba_count on public.classes;
create trigger ba_count before insert on public.classes
  for each row execute function public.ba_count_classes();
drop trigger if exists ba_count on public.assignments;
create trigger ba_count before insert on public.assignments
  for each row execute function public.ba_count_assignments();

-- Функции: API Supabase открывает каждую функцию схемы public как RPC.
-- Роли anon служебные функции не нужны; триггерные — не нужны никому.
revoke all on function public.is_class_teacher(uuid), public.is_class_member(uuid),
  public.teaches_student(uuid), public.is_full_account(), public.gen_join_code() from public, anon;
grant execute on function public.is_class_teacher(uuid), public.is_class_member(uuid),
  public.teaches_student(uuid), public.is_full_account(), public.gen_join_code() to authenticated;
revoke all on function public.ba_rate_guard(), public.ba_size_guard(), public.ba_count_classes(), public.ba_count_assignments(),
  public.client_errors_guard(), public.class_members_keep_keys() from public, anon, authenticated;

-- Индексы под запросы сайта (core/cloud.js) и проверки RLS
create index if not exists classes_teacher_idx on public.classes (teacher_id);
create index if not exists assignments_teacher_idx on public.assignments (teacher_id);
create index if not exists submissions_student_idx on public.submissions (student_id);
