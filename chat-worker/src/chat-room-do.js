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
const MAX_JSON_BYTES = 16 * 1024;

// Enforce actual streamed bytes; Content-Length alone is not trustworthy.
export async function readLimitedBody(request, maxBytes) {
  if (Number(request.headers.get('content-length')) > maxBytes) {
    throw Object.assign(new Error('payload_too_large'), { status: 413 });
  }
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw Object.assign(new Error('payload_too_large'), { status: 413 });
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

async function readJson(request) {
  const bytes = await readLimitedBody(request, MAX_JSON_BYTES);
  try {
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw Object.assign(new Error('invalid_json'), { status: 400 }); }
}

function publicWatchUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.href.length > 2048) throw new Error();
    return u.href;
  } catch { throw Object.assign(new Error('invalid_watch_url'), { status: 400 }); }
}

/**
 * sanitizeBody — the stored message is TEXT, never HTML.
 * Decode entities, strip tags, re-escape, then wrap Burmese-script runs in
 * our own span for rendering. Kills the &-entity bypass (<img onerror>
 * decodes to a live tag if stored verbatim) at the source, for all viewers.
 */
function sanitizeBody(value) {
  const text = String(value || '')
    .replace(/&#0*39;|'/gi, "'")
    .replace(/\u0026lt;/gi, '<')
    .replace(/\u0026gt;/gi, '>')
    .replace(/\u0026quot;/gi, '"')
    .replace(/\u0026amp;/gi, '&')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  const escaped = text
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;');
  return escaped
    .replace(/[\u1000-\u109F][\u1000-\u109F\s]*/g, '<span lang="my">$&</span>')
    .replace(/\n/g, '<br>');
}

export class ChatRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.history = [];           // rolling in-memory cache
    this.messageTimes = new Map(); // pubkey -> ms timestamps in last 60s (per-user rate limit)
    this.started = false;
    this.watchState = null;      // {url, kind, name, by_name, by_pubkey, ts}
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
    const roomId = this.state.id.toString();

    if (path === '/' || path === '') {
      return this.handleWebSocket(request);
    }

    if (path === '/history' && request.method === 'GET') {
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
        return jsonResponse({ ok: false, error: 'storage_unavailable', messages: this.history.slice(-limit) }, 503);
      }
    }

    if (path === '/message' && request.method === 'POST') {
      try {
        const body = await readJson(request);
        const identity = String(body.author_pubkey || request.headers.get('x-pirchchat-identity') || '').slice(0, 128);
        if (identity && (await this.isBanned(identity))) {
          return jsonResponse({ ok: false, error: 'banned' }, 403);
        }
        const msg = await this.handlePost(body, request.headers.get('CF-Connecting-IP') || request.headers.get('x-pirchchat-identity') || 'anonymous');
        if (!msg) return jsonResponse({ ok: false, error: 'rate_limited' }, 429);
        return jsonResponse({ ok: true, id: msg.id, ts: msg.ts, message: msg });
      } catch (e) {
        return jsonResponse({ ok: false, error: e.status ? e.message : 'storage_unavailable' }, e.status || 503);
      }
    }

    if (path === '/pin' && request.method === 'POST') {
      try {
        const body = await readJson(request);
        if (!Number.isFinite(body.lat) || !Number.isFinite(body.lng) ||
            Math.abs(body.lat) > 90 || Math.abs(body.lng) > 180 ||
            (body.note != null && (typeof body.note !== 'string' || body.note.length > 500))) {
          return jsonResponse({ ok: false, error: 'invalid_pin' }, 400);
        }
        if (!this.allowMutation(request.headers.get('CF-Connecting-IP') || 'anonymous')) return jsonResponse({ ok: false, error: 'rate_limited' }, 429);
        const id = crypto.randomUUID();
        const ts = Date.now();
        await this.env.DB.prepare(
          'INSERT INTO pinned_locations (id, pubkey, lat, lng, note, ts) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, String(body.pubkey || 'anon').slice(0, 128), body.lat, body.lng, body.note || '', ts).run();
        return jsonResponse({ ok: true, id });
      } catch (e) {
        return jsonResponse({ ok: false, error: e.status ? e.message : 'storage_unavailable' }, e.status || 503);
      }
    }

    if (path === '/pins' && request.method === 'GET') {
      try {
        const rows = await this.env.DB.prepare(
          'SELECT id, pubkey, lat, lng, note, ts FROM pinned_locations ORDER BY ts DESC LIMIT 200'
        ).all();
        return jsonResponse({ ok: true, pins: rows.results || [] });
      } catch (e) {
        return jsonResponse({ ok: false, error: 'storage_unavailable' }, 503);
      }
    }

    // ---- watch-together endpoints ----
    if (path === '/watch' && request.method === 'GET') {
      try {
        // Ensure table exists
        await this.env.DB.prepare(
          'CREATE TABLE IF NOT EXISTS watch_state (room_id TEXT PRIMARY KEY, url TEXT, kind TEXT, name TEXT, by_name TEXT, by_pubkey TEXT, ts TEXT)'
        ).run();
        const row = await this.env.DB.prepare(
          'SELECT url, kind, name, by_name, by_pubkey, ts FROM watch_state WHERE room_id = ?'
        ).bind(roomId).first();
        return jsonResponse({ ok: true, state: row || null });
      } catch (e) {
        return jsonResponse({ ok: false, error: 'storage_unavailable' }, 503);
      }
    }

    if (path === '/watch' && request.method === 'POST') {
      try {
        const body = await readJson(request);
        if (body.stop !== true) publicWatchUrl(body.url);
        if (!this.allowMutation(request.headers.get('CF-Connecting-IP') || 'anonymous')) return jsonResponse({ ok: false, error: 'rate_limited' }, 429);
        // Ensure table exists
        await this.env.DB.prepare(
          'CREATE TABLE IF NOT EXISTS watch_state (room_id TEXT PRIMARY KEY, url TEXT, kind TEXT, name TEXT, by_name TEXT, by_pubkey TEXT, ts TEXT)'
        ).run();
        const stop = body.stop === true;
        if (stop) {
          // Clear watch state
          await this.env.DB.prepare(
            'DELETE FROM watch_state WHERE room_id = ?'
          ).bind(roomId).run();
          this.watchState = null;
          this.broadcast({ type: 'watch', state: null });
          return jsonResponse({ ok: true, stopped: true });
        }
        const url = publicWatchUrl(body.url);
        const kind = body.kind === 'hls' ? 'hls' : 'link';
        const name = String(body.name || 'Watch together').slice(0, 160);
        const { by_name, by_pubkey } = body;
        const identity = (by_name || by_pubkey || 'anon').toString().slice(0, 32);
        const ts = Date.now().toString();
        await this.env.DB.prepare(
          'INSERT OR REPLACE INTO watch_state (room_id, url, kind, name, by_name, by_pubkey, ts) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(roomId, url, kind || 'hls', name || 'Watch together', identity, identity, ts).run();
        this.watchState = { url, kind: kind || 'hls', name: name || 'Watch together', by_name: identity, by_pubkey: identity, ts };
        this.broadcast({ type: 'watch', state: this.watchState });
        return jsonResponse({ ok: true, state: this.watchState });
      } catch (e) {
        return jsonResponse({ ok: false, error: e.status ? e.message : 'storage_unavailable' }, e.status || 503);
      }
    }

    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request) {
    const upgrade = request.headers.get('upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }
    if (this.sessions.length >= 200) return jsonResponse({ ok: false, error: 'room_capacity' }, 429);
    const url = new URL(request.url);
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const sessionId = crypto.randomUUID();
    const identity = (url.searchParams.get('nick') || 'guest').slice(0, 32);
    const silent = url.searchParams.get('silent') === '1';
    const rateKey = request.headers.get('CF-Connecting-IP') || 'anonymous';
    const roomId = this.state.id.toString();

    // Standard Workers/DO WebSocket pattern: accept, then return a real
    // 101 Response carrying the client end. No subprotocol header — the
    // browser never negotiates one, and sending it breaks the handshake.
    server.accept();
    const response = new Response(null, { status: 101, webSocket: client });

    // Silent sessions listen for unread badges only: no join/leave noise to
    // other users, no presence entry, no history payload.
    const session = { sessionId, identity, rateKey, ws: server, joinedAt: Date.now(), silent };
    this.sessions.push(session);
    if (!silent) this.broadcastPresence();

    if (!silent) {
      try {
        // Fresh from D1 (not the in-memory cache) so a purge or another
        // device's writes are reflected on the next connection.
        const rows = await this.env.DB.prepare(
          'SELECT id, author_name, author_pubkey, body_html, image_url, link_preview_json, topics, ts FROM messages WHERE room_id = ? ORDER BY ts DESC LIMIT ?'
        ).bind(roomId, HISTORY_LIMIT).all();
        this.history = (rows.results || []).reverse();
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
    }

    server.addEventListener('message', (event) => {
      this.handleWsMessage(session, event.data || event).catch(() => {
        try { server.send(JSON.stringify({ type: 'error', error: 'message_not_saved' })); } catch (e) {}
      });
    });
    server.addEventListener('close', () => {
      try { server.close(1000, 'Closed'); } catch (e) {}
      this.sessions = this.sessions.filter((s) => s.sessionId !== sessionId);
      if (!silent) {
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
      }
    });
    server.addEventListener('error', () => {});

    return response;
  }

  async handleWsMessage(session, raw) {
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > MAX_JSON_BYTES) {
      session.ws.send(JSON.stringify({ type: 'error', error: 'payload_too_large' }));
      return;
    }
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

    if (!this.allowMutation(rateKey || pubkey)) return null;
    const bodyHtml = sanitizeBody(body.body_html || body.body_text || '').slice(0, 4000);
    const imageUrl = body.image_url ? String(body.image_url).slice(0, 600) : '';
    const linkPreview = body.link_preview ? JSON.stringify(body.link_preview).slice(0, 4000) : '';
    const topics = (body.topics || '').toString().slice(0, 200);
    const id = crypto.randomUUID();
    const ts = now;

    if (!bodyHtml && !imageUrl) throw Object.assign(new Error('empty_message'), {status:400});
    if (imageUrl && !/^https?:\/\/[^/]+\/cdn\/uploads\//.test(imageUrl) && !imageUrl.startsWith('/cdn/uploads/')) {
      throw Object.assign(new Error('invalid_image'), {status:400});
    }

    // Persist before acknowledgement or broadcast.
    await this.env.DB.prepare(
      'INSERT INTO messages (id, room_id, author_name, author_pubkey, body_html, image_url, link_preview_json, topics, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, roomId, author, pubkey, bodyHtml, imageUrl, linkPreview, topics, ts).run();

    const msg = { id, room: roomId, author_name: author, author_pubkey: pubkey, body_html: bodyHtml, image_url: imageUrl, link_preview_json: linkPreview, topics, ts };
    this.history.push(msg);
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
    this.broadcast({ type: 'message', message: msg });
    return msg;
  }

  allowMutation(rateKey) {
    const now = Date.now();
    for (const [key, entries] of this.messageTimes) {
      if (!entries.some((t) => now - t < 60000)) this.messageTimes.delete(key);
    }
    // Per-user rate limit (12/min per network ID — one spammer no longer
    // throttles the whole room).
    let times = this.messageTimes.get(rateKey) || [];
    times = times.filter((t) => now - t < 60000);
    if (times.length >= RATE_LIMIT_PER_MIN) return false;
    times.push(now);
    this.messageTimes.set(rateKey, times);
    return true;
  }

  // Moderation ban list. Cached per-instance for 30 s so message
  // rate doesn't translate to a D1 query per keystroke.
  async isBanned(pubkey) {
    if (!pubkey) return false;
    const now = Date.now();
    if (this._banCacheAt && now - this._banCacheAt < 30000 && this._banCache) {
      return this._banCache.has(pubkey);
    }
    try {
      const rows = await this.env.DB.prepare(
        'SELECT pubkey, expires_at FROM bans WHERE pubkey = ?'
      ).bind(pubkey).all();
      const active = (rows.results || []).some((r) => !r.expires_at || r.expires_at > now);
      if (!this._banCache) this._banCache = new Set();
      if (active) this._banCache.add(pubkey);
      this._banCacheAt = now;
      return active;
    } catch (e) {
      // Fail open: if the bans table isn't reachable, do not block messages.
      return false;
    }
  }

  broadcastPresence() {
    // Silent badge sockets are not members — only real sessions appear.
    this.broadcast({ type: 'presence', members: this.sessions.filter((s) => !s.silent).map((s) => ({ nick: s.identity, role: '' })) });
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
