/**
 * Bilim Arena — хранилище данных.
 *
 * Весь код платформы работает только через этот адаптер и никогда не трогает
 * localStorage напрямую. Когда появится сервер, достаточно подменить
 * реализацию (RemoteStore) — остальной код менять не придётся.
 *
 * API асинхронный специально: серверные запросы тоже будут возвращать Promise.
 */

const PREFIX = 'BA2_';

/** Локальное хранилище (браузер). Работает офлайн, привязано к устройству. */
export class LocalStore {
  constructor(prefix = PREFIX) {
    this.prefix = prefix;
    this.available = this._check();
  }

  _check() {
    try {
      const k = this.prefix + '__test';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch {
      return false; // приватный режим или переполнение
    }
  }

  async get(key, fallback = null) {
    if (!this.available) return fallback;
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  /**
   * @param {object} opts.silent — не сообщать о записи (данные пришли из облака)
   */
  async set(key, value, { silent = false } = {}) {
    if (!this.available) return false;
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      return false; // место кончилось
    }
    if (!silent) this.onWrite?.(key, value);
    return true;
  }

  async remove(key) {
    if (!this.available) return;
    try { localStorage.removeItem(this.prefix + key); } catch { /* недоступно */ }
  }

  async keys() {
    if (!this.available) return [];
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.slice(this.prefix.length));
  }

  /** Добавить запись в список (история игр, журнал ошибок и т.п.) */
  async push(key, item, limit = 500) {
    const list = await this.get(key, []);
    list.push(item);
    if (list.length > limit) list.splice(0, list.length - limit);
    await this.set(key, list);
    return list.length;
  }
}

/**
 * Серверное хранилище. Пока не подключено — заготовка с тем же API.
 * Когда появится backend: new RemoteStore({ baseUrl, token }) и всё заработает.
 */
export class RemoteStore {
  constructor({ baseUrl, token, fallback }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.fallback = fallback || new LocalStore(); // офлайн-запас
  }

  async _fetch(path, options = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers
      }
    });
    if (!res.ok) throw new Error(`store: ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  async get(key, fallback = null) {
    try {
      const data = await this._fetch(`/kv/${encodeURIComponent(key)}`);
      return data ?? fallback;
    } catch {
      return this.fallback.get(key, fallback); // сервер недоступен — берём локальное
    }
  }

  async set(key, value) {
    try {
      await this._fetch(`/kv/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) });
      await this.fallback.set(key, value); // дублируем локально для офлайна
      return true;
    } catch {
      return this.fallback.set(key, value);
    }
  }

  async remove(key) {
    try { await this._fetch(`/kv/${encodeURIComponent(key)}`, { method: 'DELETE' }); } catch { /* офлайн */ }
    return this.fallback.remove(key);
  }

  async keys() {
    try { return await this._fetch('/kv'); } catch { return this.fallback.keys(); }
  }

  async push(key, item, limit = 500) {
    const list = await this.get(key, []);
    list.push(item);
    if (list.length > limit) list.splice(0, list.length - limit);
    await this.set(key, list);
    return list.length;
  }
}

/**
 * Текущее хранилище платформы. Все данные читаются и пишутся локально
 * (быстро и офлайн), а core/cloud.js через store.onWrite отправляет
 * изменения в Supabase, когда облако подключено и пользователь вошёл.
 */
export const store = new LocalStore();

/** Ключи — в одном месте, чтобы не искать строки по всему проекту */
export const KEYS = {
  profile: 'profile',
  progress: 'progress',
  errors: 'errors',
  history: 'history',
  classes: 'classes',
  assignments: 'assignments',
  lessons: 'lessons',
  settings: 'settings',
  results: 'results'
};
