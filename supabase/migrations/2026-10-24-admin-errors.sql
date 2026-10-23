-- ─── 2026-10-24: журнал ошибок сайта в админ-панели ──
-- Раньше client_errors читался только в Table Editor. Теперь его читает и чистит администратор (is_admin()).
-- Гость, ученик и учитель по-прежнему могут только добавить запись. Выполнять после 2026-10-23-admin-stats.sql.
-- Откат: drop policy client_errors_admin_read on public.client_errors;
--   drop policy client_errors_admin_delete on public.client_errors;
drop policy if exists client_errors_admin_read on public.client_errors;
drop policy if exists client_errors_admin_delete on public.client_errors;
create policy client_errors_admin_read on public.client_errors for select to authenticated
  using (public.is_admin());
create policy client_errors_admin_delete on public.client_errors for delete to authenticated
  using (public.is_admin());
