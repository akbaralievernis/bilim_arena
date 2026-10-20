/**
 * Голос ведущего.
 *
 * 1. Есть готовая запись (public/voice/<язык>/<ключ>.mp3, сделана заранее
 *    скриптом scripts/make-voice.mjs через ElevenLabs) и её текст совпадает с
 *    текущим — играем запись. Ключа ElevenLabs в браузере нет и не нужно.
 * 2. Иначе — голос браузера (speechSynthesis). Кыргызского голоса в браузерах
 *    почти нет, поэтому для ky берётся русский: он читает кириллицу понятнее всего.
 *
 * Фразы идут по очереди: «Таң атты…», затем итог ночи — не перебивая друг друга.
 */
import { PHRASES } from './phrases.js';

const ENABLED_KEY = 'mafia_host_voice';
let manifest = null;      // { ky: { night_start: { file, text } } }
let manifestLoad = null;
const queue = [];
let playing = null;       // { stop() }

export const voiceEnabled = () => {
  try { return localStorage.getItem(ENABLED_KEY) !== 'off'; } catch { return true; }
};
export function setVoiceEnabled(on) {
  try { localStorage.setItem(ENABLED_KEY, on ? 'on' : 'off'); } catch { /* приватный режим */ }
  if (!on) stopVoice();
}

/** Список готовых записей; нет файла — пустой (тогда голос браузера) */
function loadManifest() {
  if (manifest) return Promise.resolve(manifest);
  if (!manifestLoad) {
    manifestLoad = fetch('./voice/manifest.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((m) => { manifest = m && typeof m === 'object' ? m : {}; return manifest; });
  }
  return manifestLoad;
}

/** Есть ли запись ElevenLabs для фразы (и совпадает ли её текст с текущим) */
export async function hasRecording(key, lang) {
  const m = await loadManifest();
  const entry = m?.[lang]?.[key];
  return !!entry && entry.text === PHRASES[lang]?.[key] && typeof entry.file === 'string';
}

function speakBrowser(text, lang) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return resolve();
    const voices = synth.getVoices();
    const byLang = (code) => voices.find((v) => v.lang?.toLowerCase().startsWith(code));
    const pick = byLang(lang) || (lang === 'en' ? null : byLang('ru') || byLang('tr'));
    const u = new SpeechSynthesisUtterance(text);
    if (pick) { u.voice = pick; u.lang = pick.lang; }
    u.rate = 0.9;
    u.pitch = 0.85;
    const done = () => resolve();
    u.onend = done;
    u.onerror = done;
    playing = { stop: () => { synth.cancel(); done(); } };
    synth.speak(u);
    // Некоторые браузеры не присылают onend — не держим очередь вечно
    setTimeout(done, 4000 + text.length * 120);
  });
}

function playFile(file) {
  return new Promise((resolve) => {
    const audio = new Audio(`./voice/${file}`);
    const done = () => resolve(true);
    audio.onended = done;
    audio.onerror = () => resolve(false);
    playing = { stop: () => { audio.pause(); done(); } };
    audio.play().catch(() => resolve(false)); // автозапуск запрещён — голос браузера
  });
}

async function playNext() {
  if (playing || !queue.length) return;
  const { key, lang } = queue.shift();
  const text = PHRASES[lang]?.[key] || PHRASES.ky[key];
  playing = { stop() {} };
  try {
    const m = await loadManifest();
    const entry = m?.[lang]?.[key];
    const ok = entry && entry.text === text && typeof entry.file === 'string' && /^[a-z]{2}\/[a-z_]+\.mp3$/.test(entry.file)
      ? await playFile(entry.file)
      : false;
    if (!ok && voiceEnabled()) await speakBrowser(text, lang);
  } finally {
    playing = null;
    playNext();
  }
}

/** Сказать фразу (по ключу из PHRASES) после уже начатых */
export function announce(key, lang) {
  if (!voiceEnabled() || !PHRASES.ky[key]) return;
  queue.push({ key, lang: PHRASES[lang] ? lang : 'ky' });
  playNext();
}

/** Новая фаза — старое больше не актуально */
export function announceNow(key, lang) {
  stopVoice();
  announce(key, lang);
}

export function stopVoice() {
  queue.length = 0;
  try { playing?.stop(); } catch { /* уже остановлено */ }
  try { window.speechSynthesis?.cancel(); } catch { /* нет синтеза */ }
}
