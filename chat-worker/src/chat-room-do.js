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
    this.messageTimes = [];      // for rate-limit (ms timestamps in last 60s)
    this.started = false;
  }

  async ensureStarted() {
    if (this.started) return;
    this.started = true;
    try {
      // Preload recent messages from D1.
      const roomId = this.state.id.toString();
      const rows = await this.env.DB.prepare(
        'SELECT id, author_name, author_pubkey, body_html, image_url, link_preview_json, topics, ts FROM messages WHERE room_id = ? ORDER BY ts DESC LIMIT ?'
      ).bind(roomId, HISTORY_LIMIT).all();
      this.history = (rows.results || []).reverse();
    } catch (e) {
      this.history = [];
    }
  }

  async fetch(request) {
    await this.ensureStarted();
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/' || path === '') {
      return this.handleWebSocket(request);
    }

    if (path.endsWith('/history')) {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || String(HISTORY_LIMIT), 10), HISTORY_LIMIT);
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
        const msg = await this.handlePost(body);
        if (!msg) return jsonResponse({ ok: false, error: 'rate_limited' }, 429);
        return jsonResponse({ ok: true, id: msg.id, ts: msg.ts });
      } catch (e) {
        return jsonResponse({ ok: false, error: String(e && e.message || e) }, 400);
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
    const identity = request.headers.get('x-pirchchat-identity') || 'anon-' + sessionId.slice(0, 6);
    const roomId = this.state.id.toString();

    // The DO accepts the socket via the Response-side object.
    const response = { status: 101, webSocket: client, headers: { 'sec-websocket-protocol': 'pirchchat-v1' } };
    const accept = (server.accept ? server : { accept: () => {} });
    // Use the standard pattern in Workers/DOs.
    server.accept();

    const session = { sessionId, identity, ws: server, joinedAt: Date.now() };
    this.sessions.push(session);

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
      this.handleWsMessage(session, event.data || event);
    });
    server.addEventListener('close', () => {
      this.sessions = this.sessions.filter((s) => s.sessionId !== sessionId);
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
    await this.handlePost(data);
  }

  async handlePost(body) {
    const roomId = this.state.id.toString();
    const now = Date.now();
    // Rate limit
    this.messageTimes = this.messageTimes.filter((t) => now - t < 60000);
    if (this.messageTimes.length >= RATE_LIMIT_PER_MIN) return null;
    this.messageTimes.push(now);

    const author = (body.author_name || '').toString().slice(0, 32) || 'guest';
    const pubkey = (body.author_pubkey || '').toString().slice(0, 128) || 'anon';
    const bodyHtml = (body.body_html || body.body_text || '').toString().slice(0, 4000);
    const imageUrl = body.image_url ? String(body.image_url).slice(0, 600) : '';
    const linkPreview = body.link_preview ? JSON.stringify(body.link_preview).slice(0, 4000) : '';
    const topics = (body.topics || '').toString().slice(0, 200);
    const id = crypto.randomUUID();
    const ts = now;

    if (!bodyHtml && !imageUrl) return null;

    // Persist
    try {
      await this.env.DB.prepare(
        'INSERT INTO messages (id, room_id, author_name, author_pubkey, body_html, image_url, link_preview_json, topics, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, roomId, author, pubkey, bodyHtml, imageUrl, linkPreview, topics, ts).run();
    } catch (e) {
      // Soft-fail persistence; still push to live subscribers
    }

    const msg = { id, room: roomId, author_name: author, author_pubkey: pubkey, body_html: bodyHtml, image_url: imageUrl, link_preview_json: linkPreview, topics, ts };
    this.history.push(msg);
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
    this.broadcast({ type: 'message', message: msg });
    return msg;
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
