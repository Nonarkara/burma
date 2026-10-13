/**
 * Pirchchat Chat Worker — REST + Durable Object WebSocket fan-out.
 *
 * Deployed as a separate Worker project (chat-worker/). The dashboard
 * static site calls this via fetch and WebSocket. Browser origins are
 * restricted, but public alpha nicknames are not authenticated identities.
 */

import { ChatRoomDO, readLimitedBody } from './chat-room-do.js';
import { RateLimiterDO } from './rate-limiter-do.js';
import {
  MESSAGES,
  allowedOrigins,
  clientIp,
  isAllowedSiteRequest,
  normalizeOrigin,
  readLimits,
  readMaxUploadBytes,
  uploadBodyLimit,
  uploadTooLargeMessage,
} from './limits.js';

export { ChatRoomDO, RateLimiterDO };

const ROOMS = [
  'monastic-youth',
  'bkk-burmese',
  'cm-burmese',
  'digest-today',
  'listening-club',
];

async function hashIp(ip) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(ip)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Fail closed: a missing or broken counter store must not reach R2.
async function reserveUpload(env, request, opts) {
  const ns = env && env.RATE_LIMITER;
  if (!ns || typeof ns.idFromName !== 'function' || typeof ns.get !== 'function') {
    return { ok: false, reason: 'limiter_unavailable', retryAfter: 30 };
  }
  try {
    const stub = ns.get(ns.idFromName('uploads'));
    const res = await stub.fetch('https://limiter.internal/consume', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ip: await hashIp(clientIp(request)),
        now: opts.now,
        limits: readLimits(env),
        phase: opts.phase,
      }),
    });
    if (!res.ok) return { ok: false, reason: 'limiter_unavailable', retryAfter: 30 };
    const decision = await res.json();
    if (!decision || typeof decision.ok !== 'boolean') {
      return { ok: false, reason: 'limiter_unavailable', retryAfter: 30 };
    }
    return {
      ok: decision.ok,
      reason: decision.reason || null,
      retryAfter: decision.retryAfter || 0,
    };
  } catch {
    return { ok: false, reason: 'limiter_unavailable', retryAfter: 30 };
  }
}

function limitResponse(decision, cors) {
  const reason = decision.reason || 'limiter_unavailable';
  const status = reason === 'limiter_unavailable' ? 503 : 429;
  const error = reason === 'global_day'
    ? 'daily_cap'
    : reason === 'limiter_unavailable'
      ? 'rate_limiter_unavailable'
      : 'rate_limited';
  const retryAfter = Math.max(1, Number(decision.retryAfter) || 1);
  if (reason === 'global_day') {
    console.warn(JSON.stringify({ event: 'upload_daily_cap' }));
  }
  return json({
    ok: false,
    error,
    message: MESSAGES[reason] || MESSAGES.limiter_unavailable,
    retry_after: retryAfter,
  }, status, Object.assign({}, cors, { 'Retry-After': String(retryAfter) }));
}

async function discardBody(request) {
  try { await request.body?.cancel(); } catch { /* already closed */ }
}

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

function originAllowed(request, env) {
  const origin = (request.headers.get('Origin') || '').trim();
  if (!origin) return true; // Public alpha reads; uploads require Origin or Referer.
  if (origin === 'null') return false;
  return new Set(allowedOrigins(env)).has(normalizeOrigin(origin));
}

function matchesImageType(bytes, type) {
  const at = (...values) => values.every((v, i) => bytes[i] === v);
  if (type === 'image/png') return at(137, 80, 78, 71, 13, 10, 26, 10);
  if (type === 'image/jpeg') return at(255, 216, 255);
  if (type === 'image/gif') return ['GIF87a', 'GIF89a'].includes(new TextDecoder().decode(bytes.slice(0, 6)));
  if (type === 'image/webp') return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  return false;
}

async function handleUpload(request, env, cors) {
  const maxFile = readMaxUploadBytes(env);
  const tooLarge = uploadTooLargeMessage(maxFile);

  if (!isAllowedSiteRequest(request, env)) {
    await discardBody(request);
    return json({ ok: false, error: 'origin_not_allowed', message: MESSAGES.origin }, 403, cors);
  }

  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > uploadBodyLimit(maxFile)) {
    await discardBody(request);
    return json({ ok: false, error: 'image_too_large', message: tooLarge }, 413, cors);
  }

  const now = Date.now();
  const admitted = await reserveUpload(env, request, { phase: 'admit', now });
  if (!admitted.ok) {
    await discardBody(request);
    return limitResponse(admitted, cors);
  }

  let file;
  let imageBytes;
  let pubkey;
  try {
    const bytes = await readLimitedBody(request, uploadBodyLimit(maxFile));
    const form = await new Response(bytes, {
      headers: { 'content-type': request.headers.get('content-type') || '' },
    }).formData();
    file = form.get('file');
    pubkey = String(form.get('pubkey') || 'anon').slice(0, 128);
    if (!file || typeof file.stream !== 'function') {
      return json({ ok: false, error: 'missing_file' }, 400, cors);
    }
    if (file.size > maxFile) {
      return json({ ok: false, error: 'image_too_large', message: tooLarge }, 413, cors);
    }
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
      return json({ ok: false, error: 'unsupported_image_type' }, 415, cors);
    }
    imageBytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesImageType(imageBytes, file.type)) {
      return json({ ok: false, error: 'invalid_image_content' }, 415, cors);
    }
  } catch (e) {
    const status = e.status || 500;
    if (status === 413) return json({ ok: false, error: 'image_too_large', message: tooLarge }, 413, cors);
    return json({ ok: false, error: 'upload_failed' }, status, cors);
  }

  const committed = await reserveUpload(env, request, { phase: 'commit', now });
  if (!committed.ok) return limitResponse(committed, cors);

  try {
    const id = crypto.randomUUID();
    const safeName = (file.name || 'image.bin').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const key = `uploads/${id}/${safeName}`;
    await env.UPLOADS.put(key, imageBytes, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: { pubkey: pubkey.slice(0, 120) },
    });
    const ts = Date.now();
    await env.DB.prepare('INSERT INTO uploads (id, r2_key, uploaded_by_pubkey, uploaded_at, size_bytes, content_type, url) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(
      id, key, pubkey, ts, file.size || 0, file.type || '', key,
    ).run();
    const origin = new URL(request.url).origin;
    return json({ ok: true, id, key, url: origin + '/cdn/' + key }, 200, cors);
  } catch {
    return json({ ok: false, error: 'upload_failed' }, 500, cors);
  }
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

    if (!originAllowed(request, env)) {
      return json({ ok: false, error: 'origin_not_allowed' }, 403);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: ch });
    }

    // Do not fabricate online members. Presence comes from connected sockets.

    if (path === '/api/rooms' || path === '/api/rooms/') {
      const rooms = ROOMS.map((id) => ({ id, title: '#' + id }));
      const result = await Promise.all(rooms.map(async (r) => {
        const members = []; // Actual presence arrives via the room socket.
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
      const fwd = new Request(new URL((roomMatch[2] ? '/' + roomMatch[2] : '/') + url.search, request.url), {
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

    // /api/upload (POST multipart) → R2, after origin and spend guards.
    if (path === '/api/upload' && request.method === 'POST') {
      return handleUpload(request, env, ch);
    }

    // /cdn/* (GET) → serve R2 objects publicly
    const cdnMatch = path.match(/^\/cdn\/(.+)$/);
    if (cdnMatch && request.method === 'GET') {
      let key;
      try { key = decodeURIComponent(cdnMatch[1]); }
      catch { return json({ ok: false, error: 'invalid_path' }, 400, ch); }
      if (!/^uploads\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/.test(key)) {
        return json({ ok: false, error: 'invalid_path' }, 400, ch);
      }
      const obj = await env.UPLOADS.get(key);
      if (!obj) return new Response('Not found', { status: 404, headers: ch });
      const headers = new Headers();
      if (obj.httpMetadata && obj.httpMetadata.contentType) headers.set('content-type', obj.httpMetadata.contentType);
      headers.set('cache-control', 'public, max-age=86400');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(obj.body, { status: 200, headers });
    }

    // /api/health
    if (path === '/api/health') {
      try {
        await env.DB.prepare('SELECT id FROM messages LIMIT 1').all();
        return json({ ok: true, storage: 'reachable', ts: Date.now(), rooms: ROOMS }, 200, ch);
      } catch (e) {
        return json({ ok: false, error: 'storage_unavailable' }, 503, ch);
      }
    }

    return json({ ok: false, error: 'not_found', path }, 404, ch);
  },
};
