-- Bilim Arena: разрешить синхронизацию учебных циклов учителя (ключ 'cycles' в user_data).
-- Включает и ключ 'tests' (миграция 2026-10-18), поэтому её можно выполнить вместо неё.
-- Выполнить один раз в Supabase → SQL Editor. Повторный запуск безопасен, данные не меняются.
-- Пока не выполнено, циклы хранятся только на устройстве учителя, остальное синхронизируется как раньше.
-- Откат: та же команда без 'cycles' (строки с key = 'cycles' перед этим удалить).

alter table public.user_data drop constraint if exists user_data_key_check;
alter table public.user_data add constraint user_data_key_check
  check (key in ('profile', 'progress', 'errors', 'history', 'questions', 'lessons', 'tests', 'cycles'));
