/**
 * Bilim Arena — «свежие» вопросы: что уже показывали на этом устройстве.
 *
 * Раньше каждая партия выбирала слова и вопросы заново, случайно, — и одни и те же
 * появлялись снова и снова (в каждой новой партии и в соседних играх). Теперь игры
 * сначала показывают то, чего ещё не было, потом — то, что было давнее всего.
 *
 * Ключ — общий набор: 'words' — общий словарь всех языковых игр (слово, показанное
 * в «Карточках», не вернётся сразу в «Словопаде»), 'sentence:ky:2', 'odd', 'focus' …
 *
 *   BA_FRESH.order(key, items, idOf) — новый массив: невиданные (вперемешку), затем
 *                                       виденные, от самых давних к недавним
 *   BA_FRESH.mark(key, idOrIds)       — отметить показанным сейчас
 *   BA_FRESH.reset(key)               — забыть (например, «начать заново»)
 *
 * Хранится в localStorage (BA2_fresh) только на этом устройстве; без доступа к нему
 * (приватный режим) игры работают как раньше — просто случайный порядок.
 */
(function () {
  'use strict';

  const STORE = 'BA2_fresh';
  const PER_KEY = 1500;     // сколько отметок помнить на набор (самые старые забываются)

  const read = () => {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
  };
  const write = (all) => {
    try { localStorage.setItem(STORE, JSON.stringify(all)); } catch { /* места нет или приватный режим */ }
  };
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function order(key, items, idOf = (x) => x.id) {
    const mem = read()[key] || {};
    const fresh = [];
    const seen = [];
    items.forEach((it) => (mem[idOf(it)] ? seen : fresh).push(it));
    // Виденные — от самых давних; одинаковое время (одна партия) — вперемешку
    const old = shuffle(seen).sort((a, b) => mem[idOf(a)] - mem[idOf(b)]);
    return [...shuffle(fresh), ...old];
  }

  function mark(key, ids) {
    const list = (Array.isArray(ids) ? ids : [ids]).filter((x) => x !== undefined && x !== null && x !== '');
    if (!list.length) return;
    const all = read();
    const mem = all[key] || (all[key] = {});
    const now = Date.now();
    list.forEach((id, i) => { mem[String(id)] = now + i; }); // порядок показа внутри партии сохраняется
    const keys = Object.keys(mem);
    if (keys.length > PER_KEY) {
      keys.sort((a, b) => mem[a] - mem[b]).slice(0, keys.length - PER_KEY).forEach((k) => delete mem[k]);
    }
    write(all);
  }

  function reset(key) {
    const all = read();
    delete all[key];
    write(all);
  }

  /** Сколько из набора ещё ни разу не показывали (для подсказки «новых: 12») */
  function unseenCount(key, items, idOf = (x) => x.id) {
    const mem = read()[key] || {};
    return items.filter((it) => !mem[idOf(it)]).length;
  }

  window.BA_FRESH = { order, mark, reset, unseenCount, shuffle };
})();
