/**
 * ChatRoomDO — Durable Object class for Pirchchat.
 *
 * One instance per room (created via idFromName(roomId)). Holds the
 * live WebSocket fan-out and writes through to D1 for persistence.
 *
 * WebSockets use the Hibernation API (`ctx.acceptWebSocket`). The object
 * can be evicted while clients stay connected, so billable duration does
 * not accrue between messages. In-memory fields reset on wake. Per-socket
 * identity lives on the socket attachment. The room-row flag and the
 * message rate window live in DO storage.
 *
 * Endpoints:
 *   WS /            — upgrade to WebSocket, send/receive live messages
 *   GET /history    — return last N messages from D1 (or in-memory cache)
 *   POST /message   — body: {author_name, body_text, image_url?, link_preview?, topics?}
 *                      verifies spam, persists, broadcasts
 */

export const HISTORY_LIMIT = 50;
export const RATE_LIMIT_PER_MIN = 12;
export const MAX_ROOM_SESSIONS = 200;
export const MAX_SESSIONS_PER_IP = 5;

const ROOM_ROW_KEY = 'ensured_room';
const RATE_WINDOW_KEY = 'message_times';

export class ChatRoomDO {
  constructor(ctx, env) {
    // `ctx` is the DurableObjectState. Kept under this name so hibernation
    // calls match `this.ctx.acceptWebSocket()`.
    this.ctx = ctx;
    this.env = env;
    this.history = [];
    this.messageTimes = new Map();
    this.rateWindowLoaded = false;
    this.ensuredRoom = null;
    this.started = false;
  }

  storageApi() {
    const storage = this.ctx && this.ctx.storage;
    if (!storage || typeof storage.get !== 'function' || typeof storage.put !== 'function') return null;
    return storage;
  }

  openSockets(except) {
    if (!this.ctx || typeof this.ctx.getWebSockets !== 'function') return [];
    return this.ctx.getWebSockets().filter((ws) => ws && ws !== except);
  }

  async ensureStarted() {
    if (this.started) return;
    if (this.starting) return this.starting;
    this.starting = (async () => {
    try {
      // Preload recent messages from D1.
      const roomId = this.ctx.id.toString();
      const rows = await this.env.DB.prepare(
        'SELECT id, author_name, author_pubkey, body_html, image_url, link_preview_json, topics, ts FROM messages WHERE room_id = ? ORDER BY ts DESC LIMIT ?'
      ).bind(roomId, HISTORY_LIMIT).all();
      this.history = (rows.results || []).reverse();
      this.started = true;
    } finally { this.starting = null; }
    })();
    return this.starting;
  }

  // One D1 INSERT OR IGNORE per room, then a DO-storage flag. Later connects
  // and wakes read storage instead of writing to D1 again.
  async ensureRoomRow(slug) {
    if (!slug) return;
    slug = String(slug).slice(0, 64);
    if (this.ensuredRoom === slug) return;
    const storage = this.storageApi();
    if (storage) {
      try {
        const cached = await storage.get(ROOM_ROW_KEY);
        if (cached === slug) {
          this.ensuredRoom = slug;
          return;
        }
      } catch (e) {}
    }
    try {
      await this.env.DB.prepare(
        'INSERT OR IGNORE INTO rooms (id, title) VALUES (?, ?)'
      ).bind(slug, '#' + slug).run();
    } catch (e) {
      return;
    }
    this.ensuredRoom = slug;
    if (storage) {
      try { await storage.put(ROOM_ROW_KEY, slug); } catch (e) {}
    }
  }

  sessionCapResponse(request) {
    const rateKey = request.headers.get('CF-Connecting-IP') || 'anonymous';
    const open = this.openSockets();
    if (open.length >= MAX_ROOM_SESSIONS) {
      return jsonResponse({ ok: false, error: 'room_full', limit: MAX_ROOM_SESSIONS }, 429);
    }
    const ipSessions = open.filter((ws) => attachmentOf(ws).rateKey === rateKey).length;
    if (ipSessions >= MAX_SESSIONS_PER_IP) {
      return jsonResponse({ ok: false, error: 'ip_session_cap', limit: MAX_SESSIONS_PER_IP }, 429);
    }
    return null;
  }

  async fetch(request) {
    await this.ensureRoomRow(request.headers.get('x-pirchchat-room'));
    const url = new URL(request.url);
    const path = url.pathname;

    // Refuse a full room before the D1 history read. A rejected upgrade
    // should not keep the object busy loading messages it will not send.
    if (path === '/' || path === '') {
      if (request.headers.get('upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }
      const capped = this.sessionCapResponse(request);
      if (capped) return capped;
    }

    try { await this.ensureStarted(); }
    catch (e) { return jsonResponse({ ok: false, error: 'storage_unavailable' }, 503); }

    if (path === '/' || path === '') {
      return this.handleWebSocket(request);
    }

    if (path.endsWith('/history')) {
      const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || HISTORY_LIMIT, HISTORY_LIMIT));
      // Always read fresh from D1 for the GET endpoint, so a fresh tab on another device sees the latest.
      try {
        const roomId = this.ctx.id.toString();
        const rows = await this.env.DB.prepare(
          'SELECT id, author_name, author_pubkey, body_html, image_url, link_preview_json, topics, ts FROM messages WHERE room_id = ? ORDER BY ts DESC LIMIT ?'
        ).bind(roomId, limit).all();
        const history = (rows.results || []).reverse();
        return jsonResponse({ ok: true, room: roomId, messages: history });
      } catch (e) {
        return jsonResponse({ ok: false, error: String(e && e.message || e), messages: this.history.slice(-limit) }, 500);
      }
    }

    if (path.endsWith('/message') && request.method === 'POST') {
      try {
        const body = await request.json();
        const msg = await this.handlePost(body, request.headers.get('CF-Connecting-IP') || request.headers.get('x-pirchchat-identity') || 'anonymous');
        if (!msg) return jsonResponse({ ok: false, error: 'rate_limited' }, 429);
        return jsonResponse({ ok: true, id: msg.id, ts: msg.ts, message: msg });
      } catch (e) {
        return jsonResponse({ ok: false, error: e.status ? e.message : 'storage_unavailable' }, e.status || 503);
      }
    }

    if (path.endsWith('/pin') && request.method === 'POST') {
      try {
        const body = await request.json();
        const id = crypto.randomUUID();
        const ts = Date.now();
        await this.env.DB.prepare(
          'INSERT INTO pinned_locations (id, pubkey, lat, lng, note, ts) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, body.pubkey || 'anon', body.lat, body.lng, body.note || '', ts).run();
        return jsonResponse({ ok: true, id });
      } catch (e) {
        return jsonResponse({ ok: false, error: String(e && e.message || e) }, 400);
      }
    }

    if (path.endsWith('/pins')) {
      try {
        const rows = await this.env.DB.prepare(
          'SELECT id, pubkey, lat, lng, note, ts FROM pinned_locations ORDER BY ts DESC LIMIT 200'
        ).all();
        return jsonResponse({ ok: true, pins: rows.results || [] });
      } catch (e) {
        return jsonResponse({ ok: false, error: String(e && e.message || e) }, 500);
      }
    }

    return new Response('Not found', { status: 404 });
  }

  handleWebSocket(request) {
    const identity = (new URL(request.url).searchParams.get('nick') || 'guest').slice(0, 32);
    const rateKey = request.headers.get('CF-Connecting-IP') || 'anonymous';
    const roomId = this.ctx.id.toString();

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const sessionId = crypto.randomUUID();

    // Hibernation API. Calling accept() on the server socket would pin the
    // object in memory for the life of the socket and bill duration.
    server.serializeAttachment({
      sessionId,
      identity,
      rateKey,
      joinedAt: Date.now(),
    });
    this.ctx.acceptWebSocket(server);
    const response = new Response(null, { status: 101, webSocket: client });

    try {
      server.send(JSON.stringify({ type: 'history', room: roomId, messages: this.history }));
      this.broadcastPresence();
      this.broadcast({
        type: 'event',
        event: 'join',
        id: crypto.randomUUID(),
        room: roomId,
        identity,
        ts: Date.now(),
      });
    } catch (e) {}

    return response;
  }

  async webSocketMessage(ws, raw) {
    const session = Object.assign({ ws }, attachmentOf(ws));
    try {
      await this.handleWsMessage(session, wsDataToString(raw));
    } catch (e) {
      try { ws.send(JSON.stringify({ type: 'error', error: 'message_not_saved' })); } catch (err) {}
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    const att = attachmentOf(ws);
    try { ws.close(code || 1000, reason || 'Closed'); } catch (e) {}
    this.broadcastPresence(ws);
    try {
      this.broadcast({
        type: 'event',
        event: 'leave',
        id: crypto.randomUUID(),
        room: this.ctx.id.toString(),
        identity: att.identity || 'guest',
        ts: Date.now(),
      }, ws);
    } catch (e) {}
    void wasClean;
  }

  async webSocketError(ws, error) {
    // Close handling reports the departure. Do not schedule timers here;
    // a timer would keep the object awake.
    void ws;
    void error;
  }

  async handleWsMessage(session, raw) {
    let data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || typeof data !== 'object') return;
    if (data.type !== 'message') return;
    const message = await this.handlePost({ ...data, author_name: session.identity }, session.rateKey);
    if (!message) session.ws.send(JSON.stringify({ type: 'error', error: 'rate_limited' }));
  }

  async loadRateWindow() {
    if (this.rateWindowLoaded) return;
    this.rateWindowLoaded = true;
    const storage = this.storageApi();
    if (!storage) return;
    try {
      const stored = await storage.get(RATE_WINDOW_KEY);
      if (!stored || typeof stored !== 'object') return;
      this.messageTimes = new Map(
        Object.entries(stored).map(([key, stamps]) => [key, Array.isArray(stamps) ? stamps.slice() : []])
      );
    } catch (e) {}
  }

  async saveRateWindow() {
    const storage = this.storageApi();
    if (!storage) return;
    const plain = {};
    for (const [key, stamps] of this.messageTimes) plain[key] = stamps.slice();
    try { await storage.put(RATE_WINDOW_KEY, plain); } catch (e) {}
  }

  async handlePost(body, rateKey) {
    if (!body || typeof body !== 'object') throw Object.assign(new Error('invalid_message'), {status:400});
    const roomId = this.ctx.id.toString();
    const now = Date.now();

    const author = (body.author_name || '').toString().slice(0, 32) || 'guest';
    const pubkey = (body.author_pubkey || '').toString().slice(0, 128) || 'anon';

    rateKey = rateKey || pubkey;
    await this.loadRateWindow();
    for (const [key, entries] of this.messageTimes) {
      const fresh = entries.filter((t) => now - t < 60000);
      if (fresh.length === 0) this.messageTimes.delete(key);
      else if (fresh.length !== entries.length) this.messageTimes.set(key, fresh);
    }
    // Per-user rate limit (12/min per network ID — one spammer no longer
    // throttles the whole room). The window is in DO storage so a hibernation
    // wake does not hand the sender a fresh budget.
    let times = this.messageTimes.get(rateKey) || [];
    times = times.filter((t) => now - t < 60000);
    if (times.length >= RATE_LIMIT_PER_MIN) {
      this.messageTimes.set(rateKey, times);
      await this.saveRateWindow();
      return null;
    }
    times.push(now);
    this.messageTimes.set(rateKey, times);
    await this.saveRateWindow();
    const bodyHtml = (body.body_html || body.body_text || '').toString().slice(0, 4000);
    const imageUrl = body.image_url ? String(body.image_url).slice(0, 600) : '';
    const linkPreview = body.link_preview ? JSON.stringify(body.link_preview).slice(0, 4000) : '';
    const topics = (body.topics || '').toString().slice(0, 200);
    const id = crypto.randomUUID();
    const ts = now;

    if (!bodyHtml && !imageUrl) throw Object.assign(new Error('empty_message'), {status:400});
    if (imageUrl && !/^https?:\/\/[^/]+\/cdn\/uploads\//.test(imageUrl) && !imageUrl.startsWith('/cdn/uploads/')) {
      throw Object.assign(new Error('invalid_image'), {status:400});
    }

    // Persist
    try {
      await this.env.DB.prepare(
        'INSERT INTO messages (id, room_id, author_name, author_pubkey, body_html, image_url, link_preview_json, topics, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, roomId, author, pubkey, bodyHtml, imageUrl, linkPreview, topics, ts).run();
    } catch (e) {
      // An acknowledgement promises durable storage. Never fan out an unsaved post.
      throw e;
    }

    const msg = { id, room: roomId, author_name: author, author_pubkey: pubkey, body_html: bodyHtml, image_url: imageUrl, link_preview_json: linkPreview, topics, ts };
    this.history.push(msg);
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
    this.broadcast({ type: 'message', message: msg });
    return msg;
  }

  broadcastPresence(except) {
    const members = this.openSockets(except).map((ws) => ({ nick: attachmentOf(ws).identity || 'guest', role: '' }));
    this.broadcast({ type: 'presence', members }, except);
  }

  broadcast(payload, except) {
    const data = JSON.stringify(payload);
    for (const ws of this.openSockets(except)) {
      try { ws.send(data); } catch (e) {}
    }
  }
}

function attachmentOf(ws) {
  if (!ws || typeof ws.deserializeAttachment !== 'function') return {};
  const value = ws.deserializeAttachment();
  if (!value || typeof value !== 'object') return {};
  return value;
}

function wsDataToString(raw) {
  if (typeof raw === 'string') return raw;
  if (raw instanceof ArrayBuffer) return new TextDecoder().decode(raw);
  if (ArrayBuffer.isView(raw)) return new TextDecoder().decode(raw);
  return '';
}

function jsonResponse(obj, status) {
  status = status || 200;
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    },
  });
}
