-- Bilim Arena: защита от злоупотреблений — лимиты частоты, размера и количества,
-- перебор кодов классов, права на функции, search_path, индексы.
-- Выполнить один раз в Supabase → SQL Editor (после 2026-10-20-class-members-keys.sql).
-- Повторный запуск безопасен. То же самое уже есть в schema.sql.
-- Подробности и проверка: docs/SECURITY-INFRA.md

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

-- search_path у существующих функций: pg_temp — последним
alter function public.is_class_teacher(uuid) set search_path = public, pg_temp;
alter function public.is_class_member(uuid) set search_path = public, pg_temp;
alter function public.teaches_student(uuid) set search_path = public, pg_temp;
alter function public.client_errors_guard() set search_path = public, pg_temp;
alter function public.class_members_keep_keys() set search_path = public, pg_temp;

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

-- Проверка после запуска:
-- 1) триггеры на месте (ожидается ba_rate, ba_size, ba_count):
--    select tgrelid::regclass, tgname from pg_trigger where tgname like 'ba\_%' order by 1, 2;
-- 2) у anon нет служебных функций (ожидается false):
--    select has_function_privilege('anon', 'public.is_class_teacher(uuid)', 'execute');
-- 3) счётчики не видны через API (ожидается false):
--    select has_schema_privilege('authenticated', 'ba_private', 'usage');
