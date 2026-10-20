#!/usr/bin/env node
/**
 * Озвучка ведущего «Мафии» через ElevenLabs — один раз, на компьютере владельца.
 *
 * Ключ ElevenLabs НЕ попадает на сайт: скрипт сохраняет готовые mp3 в
 * public/voice/<язык>/<ключ>.mp3 и список public/voice/manifest.json. Игра
 * просто проигрывает эти файлы (бесплатно, быстро, работает из кэша). Фразы —
 * в src/voice/phrases.js; уже озвученные с тем же текстом повторно не оплачиваются.
 *
 * Запуск (из папки mafia-src):
 *   ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=… npm run voice            # все языки
 *   ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=… npm run voice -- --lang ky
 *   npm run voice -- --dry-run                                           # что и сколько символов
 * Потом: npm run build — файлы попадут в games/mafia/voice/.
 *
 * Необязательно:
 *   ELEVENLABS_VOICE_ID_KY / _RU / _EN — свой голос для языка
 *   ELEVENLABS_MODEL — модель (по умолчанию eleven_v3: в её списке есть кыргызский)
 *   ELEVENLABS_LANGUAGE_CODE=1 — передать код языка явно (если модель это поддерживает)
 *   --force — озвучить заново даже совпадающие фразы
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHRASES } from '../src/voice/phrases.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'voice');
const MANIFEST = join(OUT, 'manifest.json');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

const langs = (option('--lang') || Object.keys(PHRASES).join(',')).split(',').map((s) => s.trim()).filter((l) => PHRASES[l]);
const dryRun = flag('--dry-run');
const force = flag('--force');
const model = process.env.ELEVENLABS_MODEL || 'eleven_v3';
const key = process.env.ELEVENLABS_API_KEY;

async function readManifest() {
  try { return JSON.parse(await readFile(MANIFEST, 'utf8')); } catch { return {}; }
}

function voiceFor(lang) {
  return process.env[`ELEVENLABS_VOICE_ID_${lang.toUpperCase()}`] || process.env.ELEVENLABS_VOICE_ID;
}

async function synthesize(text, lang) {
  const voice = voiceFor(lang);
  const body = {
    text,
    model_id: model,
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    ...(process.env.ELEVENLABS_LANGUAGE_CODE === '1' ? { language_code: lang } : {})
  };
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`ElevenLabs ${res.status}: ${detail}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

const manifest = await readManifest();
const todo = [];
for (const lang of langs) {
  for (const [id, text] of Object.entries(PHRASES[lang])) {
    const entry = manifest[lang]?.[id];
    const file = `${lang}/${id}.mp3`;
    const fresh = entry?.text === text && existsSync(join(OUT, file));
    if (fresh && !force) continue;
    todo.push({ lang, id, text, file });
  }
}

const chars = todo.reduce((n, x) => n + x.text.length, 0);
console.log(`Озвучить: ${todo.length} фраз, ${chars} символов (${langs.join(', ')}), модель ${model}.`);
if (dryRun || !todo.length) {
  todo.forEach((x) => console.log(`  ${x.file}: ${x.text}`));
  process.exit(0);
}
if (!key) { console.error('Нужна переменная ELEVENLABS_API_KEY (ключ из elevenlabs.io → Profile → API keys).'); process.exit(1); }
const missingVoice = langs.filter((l) => !voiceFor(l));
if (missingVoice.length) { console.error(`Нужен ELEVENLABS_VOICE_ID (или ELEVENLABS_VOICE_ID_${missingVoice[0].toUpperCase()}) — id голоса из Voice Library.`); process.exit(1); }

let done = 0;
for (const x of todo) {
  try {
    const audio = await synthesize(x.text, x.lang);
    await mkdir(join(OUT, x.lang), { recursive: true });
    await writeFile(join(OUT, x.file), audio);
    (manifest[x.lang] ||= {})[x.id] = { file: x.file, text: x.text, model, voice: voiceFor(x.lang), at: new Date().toISOString().slice(0, 10) };
    await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
    done += 1;
    console.log(`  ✓ ${x.file} (${Math.round(audio.length / 1024)} КБ)`);
  } catch (e) {
    console.error(`  ✗ ${x.file}: ${e.message}`);
    if (/401|403|quota|payment/i.test(e.message)) break; // ключ или лимит — дальше нет смысла
  }
}
console.log(`Готово: ${done} из ${todo.length}. Теперь: npm run build`);
process.exit(done === todo.length ? 0 : 1);
