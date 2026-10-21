/**
 * Bilim Arena — свой сервер знакомства для доски и телефонов.
 *
 * Говорит на протоколе PeerJS-сервера, поэтому браузеры работают с ним через
 * ту же библиотеку PeerJS. Сервер только передаёт короткие служебные сообщения
 * (OFFER / ANSWER / CANDIDATE), пока телефон и доска договариваются о прямом
 * соединении. Сами ответы учеников через сервер не идут.
 *
 * Все соединения живут в одном Durable Object («hub»): так телефон всегда
 * находит доску. WebSocket Hibernation — пока все молчат, объект спит и не
 * тратит время; пинги PeerJS (HEARTBEAT) отвечаются без пробуждения.
 */

const KEY_DEFAULT = 'bilimarena';
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const TOKEN = /^[A-Za-z0-9]{1,64}$/;
const MAX_MESSAGE = 32 * 1024;       // SDP с кандидатами — несколько КБ
const MAX_SOCKETS = 5000;            // защита от наплыва чужих клиентов
// С одного адреса: школа за одним NAT — это несколько классов (~400 телефонов хватит),
// а один скрипт больше не может занять все 5000 мест
const MAX_PER_IP = 400;               // можно изменить переменной MAX_PER_IP
const RATE_WINDOW_MS = 10_000;
const RATE_LIMIT = 200;              // сообщений за 10 с на одно соединение
const FORWARD = new Set(['OFFER', 'ANSWER', 'CANDIDATE', 'LEAVE', 'EXPIRE']);

const allowedOrigins = (env) => String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

/** Пускаем только наш сайт (и localhost для разработки), если список задан */
function originAllowed(request, env) {
  const list = allowedOrigins(env);
  if (!list.length) return true;
  const origin = request.headers.get('Origin');
  return !!origin && list.includes(origin);
}

function cors(request, env) {
  const origin = request.headers.get('Origin');
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (origin && originAllowed(request, env)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  return headers;
}

const randomId = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return 'p' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = env.PEER_KEY || KEY_DEFAULT;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors(request, env), 'Access-Control-Allow-Methods': 'GET' } });

    // PeerJS просит id для телефона: GET /<key>/id
    if (url.pathname === `/${key}/id`) {
      if (!originAllowed(request, env)) return new Response('Forbidden', { status: 403 });
      return new Response(randomId(), { headers: { ...cors(request, env), 'Content-Type': 'text/plain' } });
    }

    // WebSocket PeerJS: /peerjs?key=…&id=…&token=…
    if (url.pathname === '/peerjs') {
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 });
      if (!originAllowed(request, env)) return new Response('Forbidden', { status: 403 });
      const hub = env.HUB.get(env.HUB.idFromName('hub'));
      return hub.fetch(request);
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return Response.json({ name: 'Bilim Arena signal', ok: true }, { headers: cors(request, env) });
    }
    return new Response('Not found', { status: 404 });
  }
};

export class SignalHub {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.rate = new Map(); // ws -> { start, count } (после сна счёт начинается заново)
    // Пинг PeerJS отвечается самой платформой — объект не просыпается каждые 5 с
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"HEARTBEAT"}', '{"type":"PONG"}'));
  }

  async fetch(request) {
    const url = new URL(request.url);
    const key = this.env.PEER_KEY || KEY_DEFAULT;
    const id = url.searchParams.get('id') || '';
    const token = url.searchParams.get('token') || '';

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const reject = (type, msg) => {
      server.accept();
      server.send(JSON.stringify({ type, payload: { msg } }));
      server.close(1008, msg);
      return new Response(null, { status: 101, webSocket: client });
    };

    if (url.searchParams.get('key') !== key) return reject('INVALID-KEY', 'Invalid key provided');
    if (!ID.test(id) || !TOKEN.test(token)) return reject('ERROR', 'Invalid id or token');
    if (this.ctx.getWebSockets().length >= MAX_SOCKETS) return reject('ERROR', 'Server is busy');
    // Адрес клиента от Cloudflare; метка соединения — по ней считаем без пробуждения объекта
    const ipTag = 'ip:' + (request.headers.get('CF-Connecting-IP') || 'local').slice(0, 64);
    const perIp = Number(this.env.MAX_PER_IP) || MAX_PER_IP;
    const reconnect = this.ctx.getWebSockets(id).some((ws) => ws.deserializeAttachment()?.token === token);
    if (!reconnect && this.ctx.getWebSockets(ipTag).length >= perIp) return reject('ERROR', 'Too many connections from this address');

    // Тот же id: тот же токен — это переподключение (старое соединение закрываем),
    // другой токен — id занят (например, код комнаты уже у другого класса)
    for (const ws of this.ctx.getWebSockets(id)) {
      const att = ws.deserializeAttachment();
      if (att?.token !== token) return reject('ID-TAKEN', `ID "${id}" is taken`);
      try { ws.close(1000, 'Reconnected'); } catch { /* уже закрыт */ }
    }

    this.ctx.acceptWebSocket(server, [id, ipTag]);
    server.serializeAttachment({ id, token });
    server.send(JSON.stringify({ type: 'OPEN' }));
    return new Response(null, { status: 101, webSocket: client });
  }

  limited(ws) {
    const now = Date.now();
    let r = this.rate.get(ws);
    if (!r || now - r.start > RATE_WINDOW_MS) { r = { start: now, count: 0 }; this.rate.set(ws, r); }
    r.count += 1;
    return r.count > RATE_LIMIT;
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > MAX_MESSAGE) return;
    if (this.limited(ws)) { try { ws.close(1008, 'Too many messages'); } catch { /* закрыт */ } return; }
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== 'object' || !FORWARD.has(msg.type)) return;

    const src = ws.deserializeAttachment()?.id;
    const dst = typeof msg.dst === 'string' ? msg.dst : '';
    if (!src || !ID.test(dst)) return;

    const targets = this.ctx.getWebSockets(dst);
    if (targets.length) {
      const out = JSON.stringify({ type: msg.type, src, dst, payload: msg.payload });
      for (const t of targets) { try { t.send(out); } catch { /* закрыт */ } }
    } else if (msg.type !== 'LEAVE' && msg.type !== 'EXPIRE') {
      // Адресата нет — PeerJS покажет «peer-unavailable» (для телефона: «комната не найдена»)
      ws.send(JSON.stringify({ type: 'EXPIRE', src: dst, dst: src }));
    }
  }

  async webSocketClose(ws) {
    this.rate.delete(ws);
    try { ws.close(1000, 'Bye'); } catch { /* уже закрыт */ }
  }

  async webSocketError(ws) {
    this.rate.delete(ws);
  }
}
