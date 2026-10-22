-- Bilim Arena — аудит 21.10.2026: журнал ошибок нельзя переполнить или отключить.
--
-- Раньше время записи (created_at) присылал браузер: пачка «старых» записей обходила лимит
-- 300 за 10 минут (место в базе можно было исчерпать без входа), а записи «из будущего»
-- навсегда блокировали журнал. Теперь время ставит база, всего не больше 20 000 записей.
-- Выполнить один раз в Supabase → SQL Editor (то же есть в schema.sql). Повторный запуск безопасен.
-- Если журнал уже заблокирован записями «из будущего»:
--   delete from public.client_errors where created_at > now() + interval '1 minute';
-- Откат: прежнее определение client_errors_guard из git (schema.sql до этого коммита).

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
