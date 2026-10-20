// Офлайн-кэш (sw.js) содержит всё, что нужно страницам сайта без интернета.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, normalize, relative } from 'node:path';

const ROOT = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const CORE = new Set([...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean));

/** Локальные ссылки файла: import, src, href, динамический import(), а в CSS — @import и url() */
function refs(file) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  const out = new Set();
  const patterns = [
    /\bimport\s+(?:[^'"]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g,
    /\bimport\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
    /\b(?:src|href)=["'](\.{0,2}\/?[^"':#?]+\.(?:js|css|html|webmanifest|svg|png))(?:\?[^"']*)?["']/g,
    /\burl\(\s*['"]?(\.{1,2}\/[^'")?#]+\.(?:css|woff2|svg|png|webp))(?:\?[^'")]*)?['"]?\s*\)/g
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const target = normalize(join(dirname(file), m[1].split('?')[0])).replace(/\\/g, '/');
      if (!target.startsWith('..') && !/^https?:/.test(m[1])) out.add(target);
    }
  }
  return [...out];
}

/** Обход от главных страниц по ссылкам — всё, что реально нужно сайту */
function reachable() {
  // Главные страницы + отдельные игры (на них ссылаются из каталога строками, не тегами)
  const sub = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? sub(`${dir}/${d.name}`) : d.name.endsWith('.html') ? [`${dir}/${d.name}`] : []));
  const pages = [...readdirSync(ROOT).filter((f) => f.endsWith('.html')), ...sub('games'), ...sub('web'), 'locales/ky.js', 'locales/ru.js', 'locales/en.js'];
  const seen = new Set();
  const queue = [...pages];
  while (queue.length) {
    const f = queue.shift();
    if (seen.has(f) || !existsSync(join(ROOT, f))) continue;
    seen.add(f);
    if (/\.(js|html|css)$/.test(f)) refs(f).forEach((r) => queue.push(r));
  }
  return [...seen];
}

test('every file the pages need is in the offline cache', () => {
  const need = reachable()
    // Мафия собирается отдельно (games/mafia/assets) и кэшируется при первом открытии
    .filter((f) => !f.startsWith('games/mafia/assets/') && !f.startsWith('mafia-src/') && !f.startsWith('tests/'));
  const missing = need.filter((f) => !CORE.has(f));
  assert.deepEqual(missing, []);
});

test('the cache list has no files that do not exist', () => {
  const dead = [...CORE].filter((f) => !existsSync(join(ROOT, f)));
  assert.deepEqual(dead, []);
});

test('fonts come from the site itself, not from Google', () => {
  // Школьные сети часто закрывают Google; без интернета чужой шрифт тоже не загрузится
  const files = reachable().filter((f) => /\.(html|css|js)$/.test(f) && !f.startsWith('games/mafia/assets/'));
  const external = files.filter((f) => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(join(ROOT, f), 'utf8')));
  assert.deepEqual(external, []);
  for (const f of ['inter-cyrillic-ext', 'inter-cyrillic', 'inter-latin']) assert.ok(CORE.has(`assets/fonts/${f}.woff2`), f);
});
