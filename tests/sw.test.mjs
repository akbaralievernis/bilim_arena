// Офлайн-кэш (sw.js) в имитации среды service worker (аудит 21.10, группа H).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SOURCE = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://site.test';

/** Мини-реализация CacheStorage: match с ignoreSearch отдаёт первую подходящую запись, как в браузере */
function makeCaches() {
  const stores = new Map();
  const urlOf = (r) => new URL(typeof r === 'string' ? r : r.url, ORIGIN + '/').href;
  const open = async (name) => {
    if (!stores.has(name)) stores.set(name, []);
    const list = stores.get(name);
    return {
      list,
      async put(req, res) { const u = urlOf(req); const i = list.findIndex((e) => e.url === u); if (i >= 0) list.splice(i, 1); list.push({ url: u, res }); },
      async add(req) { const res = await globalFetch(urlOf(req)); if (!res.ok) throw new Error('bad'); await this.put(req, res); },
      async match(req, opt = {}) {
        const u = new URL(urlOf(req));
        return list.find((e) => (opt.ignoreSearch ? new URL(e.url).pathname === u.pathname : e.url === u.href))?.res;
      }
    };
  };
  return {
    stores,
    open,
    keys: async () => [...stores.keys()],
    delete: async (n) => stores.delete(n),
    async match(req, opt) { for (const n of stores.keys()) { const r = await (await open(n)).match(req, opt); if (r) return r; } return undefined; }
  };
}
let globalFetch;

function boot({ fetch }) {
  const listeners = {};
  const caches = makeCaches();
  globalFetch = fetch;
  const self = {
    location: new URL(ORIGIN + '/sw.js'),
    addEventListener: (t, fn) => { listeners[t] = fn; },
    skipWaiting: async () => { self.skipped = true; },
    clients: { claim: async () => {} },
    skipped: false
  };
  vm.runInNewContext(SOURCE, { self, caches, fetch, Request: class { constructor(u, o) { this.url = new URL(u, ORIGIN + '/').href; this.cache = o?.cache; } }, URL, Response: { error: () => ({ ok: false, error: true }) }, console: { warn() {} }, setTimeout, Promise, Date });
  const fire = (type, extra = {}) => {
    let wait = Promise.resolve();
    let responded;
    listeners[type]({ ...extra, waitUntil: (p) => { wait = p; }, respondWith: (p) => { responded = p; } });
    return { wait, responded };
  };
  return { caches, fire };
}

const ok = (body) => ({ ok: true, body, clone() { return this; } });

test('a failed install keeps the previous complete cache', async () => {
  const sw = boot({ fetch: async (u) => (String(u).includes('physics') ? Promise.reject(new Error('net')) : ok('new')) });
  // Предыдущая версия полностью закэширована
  sw.caches.stores.set('ba-v1', [{ url: ORIGIN + '/data/questions/physics-7-mechanics.js', res: ok('old') }]);
  const { wait } = sw.fire('install');
  await assert.rejects(wait, 'install must fail when a file could not be cached');
  assert.ok(sw.caches.stores.has('ba-v1'), 'old cache untouched');
});

test('a ?v= request is answered by its exact cached copy, not an older one without the query', async () => {
  const sw = boot({ fetch: async () => Promise.reject(new Error('offline')) });
  const VERSION = SOURCE.match(/const VERSION = '([^']+)'/)[1];
  sw.caches.stores.set(VERSION, [
    { url: ORIGIN + '/board.js', res: ok('old precache') },
    { url: ORIGIN + '/board.js?v=24', res: ok('fresh') }
  ]);
  const { responded } = sw.fire('fetch', { request: { method: 'GET', url: ORIGIN + '/board.js?v=24', mode: 'no-cors' } });
  assert.equal((await responded).body, 'fresh');
});

test('slow mode ends as soon as the network is fast again', async () => {
  let delay = 4000; // первая загрузка — «зависшая» сеть
  let n = 0;
  const sw = boot({ fetch: () => { const id = ++n; return new Promise((r) => setTimeout(() => r(ok('net#' + id)), delay)); } });
  const VERSION = SOURCE.match(/const VERSION = '([^']+)'/)[1];
  sw.caches.stores.set(VERSION, [{ url: ORIGIN + '/practice.js', res: ok('cached') }]);
  const get = async () => (await sw.fire('fetch', { request: { method: 'GET', url: ORIGIN + '/practice.js', mode: 'no-cors' } }).responded).body;
  assert.equal(await get(), 'cached', 'hung network: answered from the cache');
  await new Promise((r) => setTimeout(r, 700)); // зависший запрос докачался (и обновил кэш)
  delay = 10;                                    // сеть снова быстрая
  await get();                                   // ещё режим медленной сети: кэш, сеть — в фоне
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(await get(), 'net#3', 'fast network again: straight from the network, not the cache');
});
