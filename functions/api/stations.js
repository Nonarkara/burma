// Cloudflare Pages Function — measured media catalogue.
//
// Two measurements, two different vantage points, and they are NOT the same:
//
//   1. The catalogue records the status seen from a home connection in
//      Thailand on a stated date. That is the vantage point that matters to
//      the person listening — they are on a Thai ISP, not on a datacentre.
//   2. This function probes from Cloudflare's edge. That vantage point is
//      good at catching a station that has gone away, and bad at judging a
//      host that blocks datacentre ranges (Cherry FM answers 401 here and
//      200 from a home connection).
//
// So the edge never overwrites the recorded truth. It is reported alongside
// it. A station whose stream exists stays playable; what changes is the
// badge, which tells the reader when the edge could not confirm it.
//
// Response shape:
//   { ok, checkedAt, radio: [...], tv: [...], unreachable: [...] }
//
// Each station carries:
//   status      — the recorded verdict (live / portal)
//   edgeProbe   — what the edge saw on this run (live / blocked /
//                 unreachable / down), or null when there was nothing to probe
//   playable    — whether there is a stream to play
//   note        — a sentence the reader can act on
//
// When the probe itself cannot run, the recorded catalogue is returned
// unchanged. The panel degrades to the last known truth, never to nothing.

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

// Probe a STREAM: we are looking for audio bytes or an HLS manifest.
async function probeStream(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
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
      return { status: 'live', detail: 'HLS manifest' };
    }
    if (/audio|mpegurl|octet-stream/.test(ctype)) {
      return { status: 'live', detail: ctype.split(';')[0] };
    }
    if (/text\/html/.test(ctype) || head.trimStart().startsWith('<')) {
      return { status: 'down', detail: 'returned a web page, not a stream' };
    }
    if (bytes.length > 0) {
      return { status: 'live', detail: ctype || 'stream' };
    }
    return { status: 'down', detail: 'empty response' };
  } catch (e) {
    const aborted = e && e.name === 'AbortError';
    return { status: 'unreachable', detail: aborted ? 'no answer in 4.5s' : 'connection failed' };
  } finally {
    clearTimeout(timer);
  }
}

// Probe a PAGE: we are looking for the broadcaster's site to answer. An HTML
// page is the success case here — the opposite of a stream probe.
async function probePage(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'accept': 'text/html,*/*',
      },
    });
    await readHead(res);
    if (res.status === 401 || res.status === 403) {
      // The page exists but refuses a bot. It may still open in a browser.
      return { status: 'blocked', detail: 'site answered ' + res.status + ' to our probe' };
    }
    if (res.status >= 500) {
      return { status: 'unreachable', detail: 'site answered ' + res.status };
    }
    if (res.status >= 400) {
      return { status: 'down', detail: 'site answered ' + res.status };
    }
    return { status: 'portal', detail: 'site answered ' + res.status };
  } catch (e) {
    const aborted = e && e.name === 'AbortError';
    return { status: 'unreachable', detail: aborted ? 'no answer in 4.5s' : 'connection failed' };
  } finally {
    clearTimeout(timer);
  }
}

const EDGE_NOTE = {
  blocked: 'Our edge probe was refused by the host (it blocks datacentre ranges) — this is what a home connection hears.',
  unreachable: 'Our edge probe could not reach the host — reachability varies by network.',
  down: 'Our edge probe did not get a stream from the host.',
};

async function measure(entry) {
  const out = { ...entry };
  out.playable = Boolean(entry.url);
  out.edgeProbe = null;

  if (entry.url) {
    const p = await probeStream(entry.url);
    out.edgeProbe = p.status;
    out.edgeDetail = p.detail;
    if (p.status === 'live') {
      out.status = 'live';
      out.note = 'Confirmed by the edge probe just now.';
    } else if (entry.status === 'live') {
      // The recorded verdict stands: the stream was heard from a home
      // connection. The edge result is reported, not substituted.
      out.status = 'live';
      out.note = 'Verified from a home connection on ' + entry.checked + '. ' + (EDGE_NOTE[p.status] || (p.detail + '.'));
    } else {
      out.status = p.status;
      out.note = EDGE_NOTE[p.status] || (p.detail + '.');
    }
  } else if (entry.watch) {
    const p = await probePage(entry.watch);
    out.edgeProbe = p.status;
    out.edgeDetail = p.detail;
    if (entry.status === 'portal') {
      out.status = 'portal';
      out.note = entry.note || ('Open the broadcaster page to watch — ' + p.detail + '.');
    } else {
      out.status = p.status;
      out.note = EDGE_NOTE[p.status] || (p.detail + '.');
    }
  } else {
    out.status = 'unreachable';
    out.note = 'No stream and no page listed.';
  }

  return out;
}

async function buildCatalogue() {
  const measured = await Promise.all(MEDIA_CATALOG.map(measure));
  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    source: 'measured',
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
      radio: MEDIA_CATALOG.filter((m) => m.kind === 'radio').map((m) => ({ ...m, playable: Boolean(m.url), edgeProbe: null })),
      tv: MEDIA_CATALOG.filter((m) => m.kind === 'tv').map((m) => ({ ...m, playable: Boolean(m.url), edgeProbe: null })),
      unreachable: UNREACHABLE_ORIGINS,
      count: MEDIA_CATALOG.length,
      degraded: 'probe failed; showing the recorded catalogue',
    };
    return json(fallback);
  }
}
