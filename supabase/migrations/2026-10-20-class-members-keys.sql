-- Bilim Arena: ученик не может перенести свою запись class_members в чужой класс.
-- Выполнить один раз в Supabase → SQL Editor. Повторный запуск безопасен.
-- То же самое уже есть в schema.sql (блок после политик class_members).

-- 1) Права PostgreSQL: UPDATE только колонки name
revoke update on public.class_members from anon, authenticated;
grant update (name) on public.class_members to authenticated;

-- 2) Второй рубеж: для ролей сайта class_id и user_id неизменяемы
create or replace function public.class_members_keep_keys()
returns trigger language plpgsql set search_path = public as $$
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

-- 3) Проверка (должно вернуть только name у authenticated, ничего у anon):
-- select grantee, privilege_type, column_name from information_schema.column_privileges
--   where table_schema = 'public' and table_name = 'class_members' and privilege_type = 'UPDATE'
--     and grantee in ('anon', 'authenticated');
