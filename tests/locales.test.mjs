// Переводы интерфейса: ключ есть на трёх языках, подстановки совпадают,
// а все ключи, на которые ссылаются страницы и код, существуют.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const L = {};
for (const l of ['ky', 'ru', 'en']) L[l] = (await import(`../locales/${l}.js`)).default;
const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

test('every key exists in ky, ru and en with the same placeholders', () => {
  const keys = new Set([...Object.keys(L.ky), ...Object.keys(L.ru), ...Object.keys(L.en)]);
  const problems = [];
  for (const k of keys) {
    for (const l of ['ky', 'ru', 'en']) if (!(k in L[l]) || String(L[l][k]).trim() === '' && String(L.ky[k] ?? '').trim() !== '') problems.push(`${l} нет: ${k}`);
    const v = new Set(['ky', 'ru', 'en'].map((l) => vars(L[l][k])));
    if (v.size > 1) problems.push(`разные подстановки: ${k}`);
    if (/[а-яёңөү]/i.test(String(L.en[k] ?? ''))) problems.push(`кириллица в en: ${k}`);
  }
  assert.deepEqual(problems, []);
});

test('keys used by pages and code exist', () => {
  const files = [
    ...readdirSync('.').filter((f) => /\.(html|js)$/.test(f)),
    // core/i18n.js — в нём только примеры в комментариях
    ...readdirSync('core').filter((f) => f.endsWith('.js') && f !== 'i18n.js').map((f) => `core/${f}`)
  ];
  const used = new Map();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/data-i18n="([a-z0-9_]+)"/g)) used.set(m[1], f);
    for (const m of src.matchAll(/data-i18n-attr="[a-z-]+:([a-z0-9_]+)"/g)) used.set(m[1], f);
    for (const m of src.matchAll(/\bt\('([a-z][a-z0-9_]+)'/g)) used.set(m[1], f);
  }
  // 'difficulty_' + n — начало ключа, который собирается в коде
  const missing = [...used].filter(([k]) => !k.endsWith('_') && !(k in L.ky)).map(([k, f]) => `${k} (${f})`);
  assert.deepEqual(missing, []);
});
