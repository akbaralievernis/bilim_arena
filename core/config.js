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
  url: 'https://udkxmgflbxetfzziftla.supabase.co',
  anonKey: 'sb_publishable_0CFwdxcFafATApELLa7DhA_OGYRjgGG'
};

/**
 * Bilim Arena Race — командная гонка по карте, отдельный сайт (Next.js +
 * своя база). Основной сайт только ведёт туда: страница race.html, карточка в
 * каталоге, вход по 6-значному коду на play.html.
 */
export const RACE_URL = 'https://bilimarenarace.vercel.app';
