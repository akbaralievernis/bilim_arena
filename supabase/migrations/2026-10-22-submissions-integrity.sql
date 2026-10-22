-- Bilim Arena — аудит 21.10.2026: результаты нельзя записать за другого ученика.
--
-- 1. Триггер submissions_fill: studentId, assignmentId и имя в data берутся из самой строки
--    и списка класса — раньше RLS проверяла строку, а отчёты учителя читали подделанный JSON.
-- 2. join_class: имя уникально в классе («Айбек 2»), повторный вход не даёт взять чужое имя.
--    Функция теперь возвращает и member_name (сайт сохраняет его в профиль).
--
-- Выполнить один раз в Supabase → SQL Editor (то же есть в schema.sql). Повторный запуск безопасен.
-- Откат: выполнить прежнее определение join_class из git (schema.sql до этого коммита) и
--   drop trigger if exists submissions_fill on public.submissions;

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

  select * into c from classes where join_code = upper(trim(code));
  if not found then
    raise exception 'class_not_found';
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
