/**
 * Pirchchat Chat Worker — REST + Durable Object WebSocket fan-out.
 *
 * Deployed as a separate Worker project (chat-worker/). The dashboard
 * static site calls this via fetch and WebSocket. CORS is wide-open in
 * alpha; a credentialled auth layer comes in Phase 2.
 */

import { ChatRoomDO } from './chat-room-do.js';

export { ChatRoomDO };

const ROOMS = [
  'monastic-youth',
  'bkk-burmese',
  'cm-burmese',
  'digest-today',
  'listening-club',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  const allowOrigin = origin === 'null' ? '*' : origin;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Pirchchat-Identity, X-Pirchchat-Signature',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(obj, status, extraHeaders) {
  status = status || 200;
  const headers = Object.assign({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  }, extraHeaders || {});
  return new Response(JSON.stringify(obj), { status, headers });
}

async function readRooms(env) {
  try {
    const rows = await env.DB.prepare(
      'SELECT id, title, topic, created_at FROM rooms ORDER BY id'
    ).all();
    return rows.results || [];
  } catch (e) {
    return ROOMS.map((r) => ({ id: r, title: '#' + r, topic: '' }));
  }
}

async function readRoomMembers(env, roomId) {
  try {
    const rows = await env.DB.prepare(
      'SELECT nick, role FROM members WHERE room_id = ? ORDER BY role DESC, nick ASC'
    ).bind(roomId).all();
    return rows.results || [];
  } catch (e) {
    return [];
  }
}

async function ensureRoom(env, roomId) {
  try {
    await env.DB.prepare('INSERT OR IGNORE INTO rooms (id, title) VALUES (?, ?)').bind(roomId, '#' + roomId).run();
  } catch (e) {}
}

async function seedMembersIfEmpty(env) {
  const seeds = {
    'monastic-youth': [
      ['aung_myo', 'op'], ['nilar', ''], ['kyaw_zin', ''], ['thazin', 'voice'],
      ['min_thu', ''], ['phyo', 'away'], ['htun', 'away'],
    ],
    'bkk-burmese': [['admin', 'op'], ['yamin', ''], ['thiri', ''], ['aung_khant', ''], ['su_myat', '']],
    'cm-burmese': [['admin', 'op'], ['thazin', 'voice'], ['htun', ''], ['may', '']],
    'digest-today': [['digest-bot', 'op'], ['aung_myo', ''], ['thiri', ''], ['min_thu', '']],
    'listening-club': [['listening-bot', 'op'], ['thiri', ''], ['kyaw_zin', '']],
  };
  for (const roomId of Object.keys(seeds)) {
    await ensureRoom(env, roomId);
    for (const [nick, role] of seeds[roomId]) {
      try {
        await env.DB.prepare('INSERT OR IGNORE INTO members (room_id, nick, role) VALUES (?, ?, ?)').bind(roomId, nick, role).run();
      } catch (e) {}
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const ch = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: ch });
    }

    // Warm up — seed rooms/members if empty
    await seedMembersIfEmpty(env);

    if (path === '/api/rooms' || path === '/api/rooms/') {
      const rooms = await readRooms(env);
      const result = await Promise.all(rooms.map(async (r) => {
        const members = await readRoomMembers(env, r.id);
        return { id: r.id, title: r.title || ('#' + r.id), topic: r.topic || '', members };
      }));
      return json({ ok: true, rooms: result }, 200, ch);
    }

    // /api/rooms/[id]/* → forward to the Durable Object
    const roomMatch = path.match(/^\/api\/rooms\/([^\/]+)(?:\/(.*))?$/);
    if (roomMatch) {
      const roomId = roomMatch[1];
      if (!ROOMS.includes(roomId)) {
        return json({ ok: false, error: 'unknown_room' }, 400, ch);
      }
      await ensureRoom(env, roomId);
      const doId = env.CHAT_ROOM.idFromName(roomId);
      const stub = env.CHAT_ROOM.get(doId);
      // Forward with empty Origin so DO doesn't get confused
      const fwdHeaders = new Headers(request.headers);
      fwdHeaders.delete('Origin');
      const fwd = new Request(new URL(roomMatch[2] ? '/' + roomMatch[2] : '/', request.url), {
        method: request.method,
        headers: fwdHeaders,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      });
      const resp = await stub.fetch(fwd);
      // Re-apply CORS
      const newHeaders = new Headers(resp.headers);
      for (const k of Object.keys(ch)) newHeaders.set(k, ch[k]);
      newHeaders.set('cache-control', 'no-store');
      return new Response(resp.body, { status: resp.status, headers: newHeaders, webSocket: resp.webSocket });
    }

    // /api/upload (POST multipart) → R2
    if (path === '/api/upload' && request.method === 'POST') {
      try {
        const form = await request.formData();
        const file = form.get('file');
        const pubkey = String(form.get('pubkey') || 'anon');
        if (!file) return json({ ok: false, error: 'missing_file' }, 400, ch);
        const id = crypto.randomUUID();
        const safeName = (file.name || 'image.bin').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
        const key = `uploads/${id}/${safeName}`;
        await env.UPLOADS.put(key, file.stream(), {
          httpMetadata: { contentType: file.type || 'application/octet-stream' },
          customMetadata: { pubkey: pubkey.slice(0, 120) },
        });
        const ts = Date.now();
        await env.DB.prepare('INSERT INTO uploads (id, r2_key, uploaded_by_pubkey, uploaded_at, size_bytes, content_type, url) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(
          id, key, pubkey, ts, file.size || 0, file.type || '', key,
        ).run();
        const url = '/cdn/' + key;
        return json({ ok: true, id, key, url }, 200, ch);
      } catch (e) {
        return json({ ok: false, error: String(e && e.message || e) }, 500, ch);
      }
    }

    // /cdn/* (GET) → serve R2 objects publicly
    const cdnMatch = path.match(/^\/cdn\/(.+)$/);
    if (cdnMatch && request.method === 'GET') {
      const key = decodeURIComponent(cdnMatch[1]);
      const obj = await env.UPLOADS.get(key);
      if (!obj) return new Response('Not found', { status: 404, headers: ch });
      const headers = new Headers();
      if (obj.httpMetadata && obj.httpMetadata.contentType) headers.set('content-type', obj.httpMetadata.contentType);
      headers.set('cache-control', 'public, max-age=86400');
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(obj.body, { status: 200, headers });
    }

    // /api/health
    if (path === '/api/health') {
      return json({ ok: true, ts: Date.now(), rooms: ROOMS }, 200, ch);
    }

    return json({ ok: false, error: 'not_found', path }, 404, ch);
  },
};
