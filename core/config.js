/**
 * Bilim Arena — подключение к Supabase.
 *
 * Пусто — платформа работает как раньше: всё хранится на устройстве.
 * Заполнено — появляются аккаунты, классы по коду и общие данные.
 *
 * Сюда вставляются ТОЛЬКО Project URL и публичный ключ
 * (Supabase → Project Settings → API Keys: publishable «sb_publishable_…»
 * или прежний anon). Они и должны быть видны в браузере: доступ к данным
 * защищают правила RLS из supabase/schema.sql.
 * Секретный ключ («sb_secret_…» / service_role) сюда вставлять НЕЛЬЗЯ —
 * он обходит все правила.
 */
export const SUPABASE = {
  url: 'https://jednsvhglrbxvvtlwsyp.supabase.co',
  anonKey: 'sb_publishable_QUB8TZWyDmTTEi0lfQTryg_MhxQF73w'
};
