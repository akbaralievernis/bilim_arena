/**
 * Bilim Arena — лимиты сервера знакомства по IP (signal/src/index.js).
 *
 * IP берётся только из CF-Connecting-IP: его ставит сама сеть Cloudflare,
 * клиент подменить его не может (X-Forwarded-For не используется).
 * Пределы с запасом на школьный NAT: весь класс, а то и вся школа выходит
 * в интернет с одного адреса, поэтому лимит одного IP — сотни соединений.
 *
 * Счётчики живут в памяти Durable Object и сбрасываются, когда он засыпает:
 * это защита от перебора и наплыва с одного адреса, а не от распределённой
 * атаки — от неё защищает сеть Cloudflare.
 */

export const IP_LIMITS = {
  socketsPerIp: 400,        // одновременно открытых соединений с одного IP
  connectsPerMinute: 600,   // новых соединений с одного IP за минуту
  missesPerMinute: 60       // обращений к несуществующей комнате с одного IP за минуту
};

/** Адрес клиента — только из заголовка, который ставит Cloudflare */
export function clientIp(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  return /^[0-9A-Fa-f:.]{2,45}$/.test(ip) ? ip : 'unknown';
}

/** Окно в минуту на каждый IP: hit() → true, если предел превышен */
export function perMinute(limit, now = () => Date.now()) {
  const map = new Map(); // ip -> { start, count }
  return {
    hit(ip) {
      const t = now();
      let r = map.get(ip);
      if (!r || t - r.start >= 60_000) { r = { start: t, count: 0 }; map.set(ip, r); }
      r.count += 1;
      // Память не растёт бесконечно: старые окна убираются, когда записей много
      if (map.size > 10_000) for (const [k, v] of map) if (t - v.start >= 60_000) map.delete(k);
      return r.count > limit;
    },
    get size() { return map.size; }
  };
}
