// Поддельный supabase-js: те же вызовы, что использует core/cloud.js,
// но запросы выполняются на PGlite (globalThis.__pg) с настоящими RLS-правилами.
const PK = {
  classes: ['id'], class_members: ['class_id', 'user_id'], assignments: ['id'],
  submissions: ['assignment_id', 'student_id'], user_data: ['user_id', 'key']
};
const EMBED = { classes: { class_members: 'class_id' } };

let lock = Promise.resolve();
function serial(fn) { const run = lock.then(fn, fn); lock = run.catch(() => {}); return run; }

async function asUser(session, fn) {
  const db = globalThis.__pg;
  return serial(async () => {
    await db.exec('reset role');
    const u = session?.user;
    await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`,
      [u?.id || '', JSON.stringify(u ? { sub: u.id, is_anonymous: !!u.is_anonymous, role: 'authenticated' } : {})]);
    await db.exec(u ? 'set role authenticated' : 'set role anon');
    try { return await fn(db); } finally { await db.exec('reset role'); }
  });
}

function splitCols(cols) {
  const out = []; let depth = 0, cur = '';
  for (const ch of cols) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

class Query {
  constructor(client, table) { Object.assign(this, { client, table, op: 'select', cols: '*', filters: [], orderBy: null, rows: null }); }
  select(cols = '*') { if (this.op === 'select') this.cols = cols; return this; }
  insert(rows) { this.op = 'insert'; this.rows = [].concat(rows); return this; }
  upsert(rows) { this.op = 'upsert'; this.rows = [].concat(rows); return this; }
  delete() { this.op = 'delete'; return this; }
  eq(col, v) { this.filters.push([col, '=', v]); return this; }
  in(col, vals) { this.filters.push([col, 'in', vals]); return this; }
  order(col) { this.orderBy = col; return this; }
  then(res, rej) { return this.exec().then(res, rej); }

  where(params) {
    if (!this.filters.length) return '';
    return ' where ' + this.filters.map(([c, op, v]) => {
      params.push(v);
      return op === 'in' ? `${c}::text = any($${params.length}::text[])` : `${c}::text = $${params.length}::text`;
    }).join(' and ');
  }

  async exec() {
    const session = this.client._session();
    try {
      const data = await asUser(session, async (db) => {
        const params = [];
        if (this.op === 'select') {
          const parts = splitCols(this.cols);
          const plain = parts.filter((p) => !p.includes('('));
          const embeds = parts.filter((p) => p.includes('('));
          let sql = `select ${plain.join(', ')} from public.${this.table}` + this.where(params);
          if (this.orderBy) sql += ` order by ${this.orderBy}`;
          const rows = (await db.query(sql, params)).rows;
          for (const e of embeds) {
            const [, t, c] = e.match(/^(\w+)\((.*)\)$/);
            const fk = EMBED[this.table][t];
            for (const r of rows) r[t] = (await db.query(`select ${c} from public.${t} where ${fk} = $1`, [r.id])).rows;
          }
          return rows;
        }
        if (this.op === 'delete') {
          await db.query(`delete from public.${this.table}` + this.where(params), params);
          return null;
        }
        for (const row of this.rows) {
          const cols = Object.keys(row);
          const vals = cols.map((c) => (row[c] !== null && typeof row[c] === 'object' ? JSON.stringify(row[c]) : row[c]));
          let sql = `insert into public.${this.table} (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')})`;
          if (this.op === 'upsert') {
            const pk = PK[this.table];
            const upd = cols.filter((c) => !pk.includes(c));
            sql += ` on conflict (${pk.join(', ')}) do ` + (upd.length ? `update set ${upd.map((c) => `${c} = excluded.${c}`).join(', ')}` : 'nothing');
          }
          await db.query(sql, vals);
        }
        return null;
      });
      return { data, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }
}

export function createClient() {
  const KEY = 'mock-session';
  const users = (globalThis.__users ||= new Map()); // email -> { id, password, name }
  const client = {
    _session: () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
    _setSession: (s) => (s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY)),
    from: (t) => new Query(client, t),
    async rpc(fn, args) {
      try {
        const names = Object.keys(args);
        const data = await asUser(client._session(), (db) =>
          db.query(`select * from public.${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')})`, names.map((n) => args[n])).then((r) => r.rows));
        return { data, error: null };
      } catch (e) { return { data: null, error: { message: e.message } }; }
    },
    auth: {
      async getSession() { return { data: { session: client._session() } }; },
      async signInAnonymously() {
        const id = crypto.randomUUID();
        await serial(() => globalThis.__pg.query('insert into auth.users (id) values ($1)', [id]));
        client._setSession({ user: { id, is_anonymous: true, user_metadata: {} } });
        return { data: {}, error: null };
      },
      async signUp({ email, password, options }) {
        if (users.has(email)) return { data: {}, error: { message: 'User already registered' } };
        const id = crypto.randomUUID();
        await serial(() => globalThis.__pg.query('insert into auth.users (id) values ($1)', [id]));
        users.set(email, { id, password, name: options?.data?.name });
        const session = { user: { id, email, is_anonymous: false, user_metadata: options?.data || {} } };
        client._setSession(session);
        return { data: { session, user: session.user }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const u = users.get(email);
        if (!u || u.password !== password) return { data: {}, error: { message: 'Invalid login credentials' } };
        client._setSession({ user: { id: u.id, email, is_anonymous: false, user_metadata: { name: u.name } } });
        return { data: {}, error: null };
      },
      async signOut() { client._setSession(null); return { error: null }; }
    }
  };
  return client;
}
