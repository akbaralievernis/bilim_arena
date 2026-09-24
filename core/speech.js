/**
 * Bilim Arena — речь: озвучка образца и распознавание ответа ученика.
 *
 * Используются встроенные возможности браузера (Web Speech API),
 * ничего не отправляется на наши серверы и не требует ключей.
 * Распознавание есть не везде (Chrome, Edge, Android, частично Safari) —
 * поэтому страница всегда проверяет canListen() и умеет работать без него.
 */

const Recognition = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const canListen = () => !!Recognition();
export const canSpeak = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

/** Произнести образец. rate < 1 — медленнее, чтобы расслышать звуки */
export function speak(text, lang = 'en-US', rate = 0.85) {
  if (!canSpeak()) return Promise.resolve(false);
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const voice = speechSynthesis.getVoices().find((v) => v.lang?.replace('_', '-').startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.speak(u);
  });
}

/**
 * Послушать ученика. Возвращает варианты распознанного текста.
 * Ошибки: { code: 'not-allowed' | 'no-speech' | 'unsupported' | 'network' | ... }
 */
export function listen(lang = 'en-US', { timeoutMs = 8000 } = {}) {
  const R = Recognition();
  if (!R) return Promise.reject({ code: 'unsupported' });

  return new Promise((resolve, reject) => {
    const rec = new R();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.continuous = false;

    let done = false;
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { rec.abort(); } catch { /* уже остановлено */ }
      fn(value);
    };
    const timer = setTimeout(() => finish(reject, { code: 'no-speech' }), timeoutMs);

    rec.onresult = (e) => {
      const res = e.results?.[0];
      const alternatives = res ? [...res].map((a) => a.transcript) : [];
      finish(resolve, { alternatives });
    };
    rec.onerror = (e) => finish(reject, { code: e.error || 'error' });
    rec.onend = () => finish(reject, { code: 'no-speech' });

    try { rec.start(); } catch { finish(reject, { code: 'error' }); }
  });
}

// ─── Сравнение сказанного с образцом ─────────────────────────────────────────

export const normalize = (s) => String(s || '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function levenshtein(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Похожесть строк 0…1 */
export function similarity(a, b) {
  const x = normalize(a), y = normalize(b);
  if (!x && !y) return 1;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

/**
 * Лучшее совпадение среди вариантов распознавания.
 * Слово, сказанное внутри фразы («a cat» вместо «cat»), тоже засчитывается.
 * accept — омофоны, которые распознавание подставляет вместо верного слова.
 */
export function bestMatch(target, alternatives = [], accept = []) {
  const goals = [target, ...accept].map(normalize);
  let best = { score: 0, heard: alternatives[0] || '' };
  alternatives.forEach((alt) => {
    const heard = normalize(alt);
    const words = heard.split(' ');
    // Одно слово внутри фразы или омофон («right» вместо «write») — засчитывается
    const exact = goals.some((g) => g === heard || (!g.includes(' ') && words.includes(g)));
    const score = exact ? 1 : similarity(goals[0], heard);
    if (score > best.score) best = { score, heard: alt };
  });
  return best;
}

/** Порог: с ним «почти правильно» засчитывается, но ученик видит разницу */
export const PASS_SCORE = 0.8;
