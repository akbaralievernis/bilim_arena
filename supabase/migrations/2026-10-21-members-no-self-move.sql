-- Bilim Arena — безопасность (21.10.2026)
--
-- Раньше ученик мог сам изменить свою строку в class_members: поменять class_id на чужой
-- класс (без кода приглашения) или имя (выдать себя за одноклассника в отчёте учителя).
-- Сайт эту строку никогда не меняет — вступление и имя идут через join_class()
-- (security definer), — поэтому право на изменение просто убираем.
-- Выполнить один раз в Supabase → SQL Editor. Повторный запуск безопасен.

drop policy if exists members_update on public.class_members;
revoke update on public.class_members from authenticated, anon;
