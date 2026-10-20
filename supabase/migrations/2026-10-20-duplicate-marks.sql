-- Bilim Arena: синхронизировать отметки учителя «это разные вопросы» (ключ 'dup_reviewed' в user_data).
-- Включает ключи 'tests' (2026-10-18) и 'cycles' (2026-10-20-topic-cycles): достаточно выполнить
-- только этот файл, даже если прежние миграции не выполнялись.
-- Выполнить один раз в Supabase → SQL Editor. Повторный запуск безопасен, данные не меняются.
-- Пока не выполнено, отметки остаются только на устройстве учителя, остальное синхронизируется как раньше.
-- Откат: та же команда без 'dup_reviewed' (строки с key = 'dup_reviewed' перед этим удалить).

alter table public.user_data drop constraint if exists user_data_key_check;
alter table public.user_data add constraint user_data_key_check
  check (key in ('profile', 'progress', 'errors', 'history', 'questions', 'lessons', 'tests', 'cycles', 'dup_reviewed'));
