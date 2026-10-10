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

/**
 * TURN — запасной ретранслятор для связи доски и телефонов (WebRTC).
 *
 * Обычно телефоны соединяются с доской напрямую. В строгих школьных сетях
 * (изоляция клиентов Wi-Fi, корпоративный файрвол) прямое соединение
 * невозможно — тогда трафик идёт через TURN-сервер. Пусто — работает как
 * раньше (только STUN), просто часть телефонов в таких сетях не подключится.
 *
 * Вариант 1 (рекомендуется) — Metered.ca, бесплатный тариф:
 *   Dashboard → TURN Server → скопировать «Fetch Credentials» URL вида
 *   https://<имя>.metered.live/api/v1/turn/credentials?apiKey=<ключ>
 *   и вставить в credentialsUrl. Ключ виден в браузере — так задумано: по
 *   нему выдаются только временные пароли TURN, а не доступ к аккаунту.
 * Вариант 2 (используется) — готовый список серверов: servers: [{ urls, username, credential }]
 *   из Metered → Credentials → Get credential → Show ICE Servers Array.
 */
// Metered.ca, бесплатный тариф (500 МБ/мес). Логин и пароль TURN по замыслу
// публичны: Metered выдаёт их для вставки в сайт, ими можно только
// пересылать трафик (расходовать квоту), а не войти в аккаунт.
const METERED_USER = '05ec6aa2ac5e8b20dd5f2524';
const METERED_PASS = '/MseDSMRrhdbo2xN';

export const TURN = {
  credentialsUrl: '',
  servers: [
    { urls: 'turn:global.relay.metered.ca:80', username: METERED_USER, credential: METERED_PASS },
    { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: METERED_USER, credential: METERED_PASS },
    { urls: 'turn:global.relay.metered.ca:443', username: METERED_USER, credential: METERED_PASS },
    { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: METERED_USER, credential: METERED_PASS }
  ]
};
