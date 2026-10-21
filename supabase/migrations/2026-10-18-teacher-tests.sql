-- Bilim Arena: разрешить синхронизацию тестов учителя (ключ 'tests' в user_data).
-- Выполнить один раз в Supabase → SQL Editor. Повторный запуск безопасен.
-- Пока не выполнено, тесты хранятся только на устройстве учителя, остальное синхронизируется как раньше.

alter table public.user_data drop constraint if exists user_data_key_check;
alter table public.user_data add constraint user_data_key_check
  check (key in ('profile', 'progress', 'errors', 'history', 'questions', 'lessons', 'tests', 'cycles', 'dup_reviewed', 'qreview'));
