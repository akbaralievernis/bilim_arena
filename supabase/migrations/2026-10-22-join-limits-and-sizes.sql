-- Bilim Arena — аудит 21.10.2026 (P2): подбор кода класса, размер данных, права служебных функций.
--
-- 1. Код класса — криптостойкий; не больше 10 неверных кодов за час на пользователя
--    (join_class: неверный код записывается и даёт пустой ответ — сайт пишет «класс не найден»).
-- 2. Размер строк: user_data и assignments до 8 МБ, submissions до 1 МБ (только новые записи).
-- 3. Служебные функции RLS — только для вошедших, без входа (anon) не вызываются.
-- Выполнить один раз в Supabase → SQL Editor (то же есть в schema.sql). Повторный запуск безопасен.
-- Нужна уже выполненная 2026-10-22-submissions-integrity.sql (join_class с member_name).
-- Откат: прежние определения gen_join_code/join_class из git; drop table public.join_attempts;
--   alter table ... drop constraint user_data_value_size / assignments_data_size / submissions_data_size.

-- Код класса: 6 символов без похожих букв и цифр (0/O, 1/I). Случайность — криптостойкая
-- (байты gen_random_uuid; random() предсказуем), 256 делится на 32 — без перекоса (аудит 21.10)
create or replace function public.gen_join_code()
returns text language sql volatile as $$
  select string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + get_byte(b, i) % 32, 1), '' order by i)
  from (select uuid_send(gen_random_uuid()) as b) x, generate_series(0, 5) as i;
$$;

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
