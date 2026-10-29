// Cloudflare Pages Function — measured media catalogue.
//
// Every entry in the catalogue is probed before it is reported. A stream that
// answers with audio bytes or an HLS manifest is reported 'live'; one that
// does not is reported with the reason and the date. Nothing is claimed from
// a listing site alone.
//
// The browser never calls radio-browser directly: that host is flaky and it
// leaks the user's IP to a third party on every page load. The probe runs
// here, once, and the result is cached for half an hour.
//
// Response shape:
//   { ok, checkedAt, source, radio: [...], tv: [...], unreachable: [...] }
//
// Each station carries its measured `status` and the `checked` date. When the
// probe itself cannot run (edge network failure, all hosts down), the
// catalogue's own recorded status is returned with source='catalogue' so the
// panel degrades to the last known truth instead of to nothing.

import { MEDIA_CATALOG, UNREACHABLE_ORIGINS } from '../data/stations.js';

const CACHE_MS = 30 * 60 * 1000;
const PROBE_TIMEOUT_MS = 4500;
const MAX_BYTES = 2048;

let cached = null;
let cachedAt = 0;

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=1800',
    },
  });
}

// Read at most MAX_BYTES so a live audio stream cannot pull the whole
// response into memory, then cancel the body.
async function readHead(res) {
  if (!res.body) return new Uint8Array(0);
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
  } finally {
    try { await reader.cancel(); } catch (e) {}
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

async function probe(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Pirchchat/0.9 (+burma.nonarkara.org) media-probe',
        'range': 'bytes=0-2047',
        'accept': '*/*',
      },
    });
    const bytes = await readHead(res);
    const head = new TextDecoder().decode(bytes.slice(0, 96));
    const ctype = (res.headers.get('content-type') || '').toLowerCase();

    if (res.status === 401 || res.status === 403) {
      return { status: 'blocked', detail: 'host answered ' + res.status };
    }
    if (res.status >= 400) {
      return { status: 'down', detail: 'host answered ' + res.status };
    }
    if (head.includes('#EXTM3U')) {
      return { status: 'live', detail: 'HLS manifest', bytes: bytes.length };
    }
    if (/audio|mpegurl|octet-stream/.test(ctype)) {
      return { status: 'live', detail: ctype.split(';')[0], bytes: bytes.length };
    }
    if (/text\/html/.test(ctype) || head.trimStart().startsWith('<')) {
      return { status: 'down', detail: 'returned a web page, not a stream' };
    }
    if (bytes.length > 0) {
      return { status: 'live', detail: ctype || 'stream', bytes: bytes.length };
    }
    return { status: 'down', detail: 'empty response' };
  } catch (e) {
    const aborted = e && e.name === 'AbortError';
    return { status: 'unreachable', detail: aborted ? 'no answer in 4.5s' : 'connection failed' };
  } finally {
    clearTimeout(timer);
  }
}

async function measure(entry) {
  const out = { ...entry };
  delete out.source;

  if (entry.url) {
    const p = await probe(entry.url);
    out.status = p.status;
    out.statusDetail = p.detail;
    out.probedAt = new Date().toISOString();
    if (p.bytes) out.probeBytes = p.bytes;
  } else if (entry.watch) {
    const p = await probe(entry.watch);
    // A portal that answers is a working way to watch; one that does not is
    // reported as such rather than shown as a live row.
    out.status = p.status === 'live' ? 'portal' : p.status;
    out.statusDetail = p.detail;
    out.probedAt = new Date().toISOString();
  } else {
    out.status = 'unreachable';
    out.statusDetail = 'no stream and no portal listed';
    out.probedAt = new Date().toISOString();
  }

  out.source = entry.source;
  out.checked = entry.checked;
  return out;
}

async function buildCatalogue() {
  const measured = await Promise.all(MEDIA_CATALOG.map(measure));
  const anyProbed = measured.some((m) => m.probedAt && m.statusDetail !== 'connection failed');
  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    source: anyProbed ? 'measured' : 'catalogue',
    radio: measured.filter((m) => m.kind === 'radio'),
    tv: measured.filter((m) => m.kind === 'tv'),
    unreachable: UNREACHABLE_ORIGINS,
    count: measured.length,
  };
}

export async function onRequestGet() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) {
    return json(cached);
  }
  try {
    const result = await buildCatalogue();
    cached = result;
    cachedAt = now;
    return json(result);
  } catch (e) {
    // The probe failed wholesale. Return the last recorded catalogue truth
    // rather than an empty panel or an invented one.
    const fallback = {
      ok: true,
      checkedAt: new Date().toISOString(),
      source: 'catalogue',
      radio: MEDIA_CATALOG.filter((m) => m.kind === 'radio'),
      tv: MEDIA_CATALOG.filter((m) => m.kind === 'tv'),
      unreachable: UNREACHABLE_ORIGINS,
      count: MEDIA_CATALOG.length,
      degraded: 'probe failed; showing last recorded status',
    };
    return json(fallback);
  }
}
