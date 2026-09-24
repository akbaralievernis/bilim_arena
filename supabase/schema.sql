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
  key         text not null check (key in ('profile', 'progress', 'errors', 'history', 'questions', 'lessons')),
  value       jsonb not null,
  updated_ms  bigint not null,   -- время изменения на устройстве (для «последняя запись побеждает»)
  primary key (user_id, key)
);

create index if not exists class_members_user_idx on public.class_members (user_id);
create index if not exists assignments_class_idx on public.assignments (class_id);
create index if not exists submissions_class_idx on public.submissions (class_id);

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

-- Вход ученика в класс по коду: единственный способ стать участником класса
create or replace function public.join_class(code text, display_name text)
returns table (class_id uuid, class_name text, grade int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  c classes%rowtype;
  clean_name text := left(trim(display_name), 40);
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if clean_name is null or clean_name = '' then
    raise exception 'name_required';
  end if;

  select * into c from classes where join_code = upper(trim(code));
  if not found then
    raise exception 'class_not_found';
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
