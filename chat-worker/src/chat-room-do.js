/**
 * ChatRoomDO — Durable Object class for Pirchchat.
 *
 * One instance per room (created via idFromName(roomId)). Holds the
 * live WebSocket fan-out, a small in-memory history for reconnection,
 * and writes through to D1 for persistence.
 *
 * Endpoints:
 *   WS /            — upgrade to WebSocket, send/receive live messages
 *   GET /history    — return last N messages from D1 (or in-memory cache)
 *   POST /message   — body: {author_name, body_text, image_url?, link_preview?, topics?}
 *                      verifies spam, persists, broadcasts
 */

const HISTORY_LIMIT = 50;
const RATE_LIMIT_PER_MIN = 12;

export class ChatRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.history = [];           // rolling in-memory cache
    this.messageTimes = new Map(); // pubkey -> ms timestamps in last 60s (per-user rate limit)
    this.started = false;
  }

  async ensureStarted() {
    if (this.started) return;
    if (this.starting) return this.starting;
    this.starting = (async () => {
    try {
      // Preload recent messages from D1.
      const roomId = this.state.id.toString();
      const rows = await this.env.DB.prepare(
        'SELECT id, author_name, author_pubkey, body_html, image_url, link_preview_json, topics, ts FROM messages WHERE room_id = ? ORDER BY ts DESC LIMIT ?'
      ).bind(roomId, HISTORY_LIMIT).all();
      this.history = (rows.results || []).reverse();
      this.started = true;
    } finally { this.starting = null; }
    })();
    return this.starting;
  }

  async fetch(request) {
    try { await this.ensureStarted(); }
    catch (e) { return jsonResponse({ ok: false, error: 'storage_unavailable' }, 503); }
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/' || path === '') {
      return this.handleWebSocket(request);
    }

    if (path.endsWith('/history')) {
      const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || HISTORY_LIMIT, HISTORY_LIMIT));
      // Always read fresh from D1 for the GET endpoint, so a fresh tab on another device sees the latest.
      try {
        const roomId = this.state.id.toString();
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
    const upgrade = request.headers.get('upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const sessionId = crypto.randomUUID();
    const identity = (new URL(request.url).searchParams.get('nick') || 'guest').slice(0, 32);
    const rateKey = request.headers.get('CF-Connecting-IP') || 'anonymous';
    const roomId = this.state.id.toString();

    // Standard Workers/DO WebSocket pattern: accept, then return a real
    // 101 Response carrying the client end. No subprotocol header — the
    // browser never negotiates one, and sending it breaks the handshake.
    server.accept();
    const response = new Response(null, { status: 101, webSocket: client });

    const session = { sessionId, identity, rateKey, ws: server, joinedAt: Date.now() };
    this.sessions.push(session);
    this.broadcastPresence();

    // Send initial history (newest last) + a join event
    try {
      server.send(JSON.stringify({ type: 'history', room: roomId, messages: this.history }));
      this.broadcast({
        type: 'event',
        event: 'join',
        id: crypto.randomUUID(),
        room: roomId,
        identity,
        ts: Date.now(),
      });
    } catch (e) {}

    server.addEventListener('message', (event) => {
      this.handleWsMessage(session, event.data || event).catch(() => {
        try { server.send(JSON.stringify({ type: 'error', error: 'message_not_saved' })); } catch (e) {}
      });
    });
    server.addEventListener('close', () => {
      try { server.close(1000, 'Closed'); } catch (e) {}
      this.sessions = this.sessions.filter((s) => s.sessionId !== sessionId);
      this.broadcastPresence();
      try {
        this.broadcast({
          type: 'event',
          event: 'leave',
          id: crypto.randomUUID(),
          room: roomId,
          identity,
          ts: Date.now(),
        });
      } catch (e) {}
    });
    server.addEventListener('error', () => {});

    return response;
  }

  async handleWsMessage(session, raw) {
    let data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || typeof data !== 'object') return;
    if (data.type !== 'message') return;
    const message = await this.handlePost({ ...data, author_name: session.identity }, session.rateKey);
    if (!message) session.ws.send(JSON.stringify({ type: 'error', error: 'rate_limited' }));
  }

  async handlePost(body, rateKey) {
    if (!body || typeof body !== 'object') throw Object.assign(new Error('invalid_message'), {status:400});
    const roomId = this.state.id.toString();
    const now = Date.now();

    const author = (body.author_name || '').toString().slice(0, 32) || 'guest';
    const pubkey = (body.author_pubkey || '').toString().slice(0, 128) || 'anon';

    rateKey = rateKey || pubkey;
    for (const [key, entries] of this.messageTimes) {
      if (!entries.some((t) => now - t < 60000)) this.messageTimes.delete(key);
    }
    // Per-user rate limit (12/min per network ID — one spammer no longer
    // throttles the whole room).
    let times = this.messageTimes.get(rateKey) || [];
    times = times.filter((t) => now - t < 60000);
    if (times.length >= RATE_LIMIT_PER_MIN) return null;
    times.push(now);
    this.messageTimes.set(rateKey, times);
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

  broadcastPresence() {
    this.broadcast({ type: 'presence', members: this.sessions.map((s) => ({ nick: s.identity, role: '' })) });
  }

  broadcast(payload) {
    const data = JSON.stringify(payload);
    for (const s of this.sessions) {
      try { s.ws.send(data); } catch (e) {}
    }
  }
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
