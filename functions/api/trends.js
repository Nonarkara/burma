// Cloudflare Pages Functions — media-volume trend for Myanmar coverage.
// NON-SCRAPE: GDELT 2.0 doc API (timelinevol, no key, public). 14-day daily
// volume series for the dashboard sparkline.
//
// GDELT anonymous traffic is rate-limited at 1 req / 5 s globally. Cloudflare
// Pages Functions don't expose the Cache API to user code, so we use two
// strategies to avoid hammering GDELT:
//   1. Response Cache-Control `s-maxage=600` (10 min) — Cloudflare's edge
//      cache absorbs the next ~120 page-loads after the first success.
//   2. A module-level `holdUntil` timestamp — if GDELT just rate-limited us,
//      short-circuit to a cached 200/ok:false for 5 minutes without making an
//      upstream call. Module state is per-isolate, so a fresh isolate can
//      re-try sooner; the edge cache covers that.
// On persistent failure the client hides the spark (honest absence).

const GDELT = 'https://api.gdeltproject.org/api/v2/doc/doc?query=Myanmar&mode=timelinevol&timespan=14d&format=json';
let holdUntil = 0;

const baseHeaders = (cacheControl) => ({
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': cacheControl,
});

export async function onRequestGet() {
  const now = Date.now();
  // Every error path below returns a JSON envelope — nothing here may throw
  // raw, because a raw edge 502 (text/plain) is exactly what we guard against.
  try {
    return await onRequestGetInner();
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'unexpected',
      hint: String(e && e.message ? e.message : e),
    }), {
      status: 200, headers: baseHeaders('public, max-age=60, s-maxage=60'),
    });
  }
}

async function onRequestGetInner() {
  const now = Date.now();
  if (now < holdUntil) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'gdelt_rate_limited_hold',
      hint: 'GDELT anonymous traffic is rate-limited at 1 req / 5 s. Sparkline is hidden until the backoff window clears.',
    }), { status: 200, headers: baseHeaders('public, max-age=60, s-maxage=60') });
  }

  let res;
  try {
    res = await fetch(GDELT, {
      // Cloudflare Pages Functions bound execution time; keep the upstream
      // timeout well under it so a slow GDELT still yields a JSON hold,
      // never a raw edge error.
      signal: AbortSignal.timeout(4000),
      headers: { 'user-agent': 'Pirchchat/0.1 (+burma.nonarkara.org)' },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'upstream_timeout',
      hint: 'GDELT did not respond within 4 s. Sparkline is hidden.',
    }), {
      status: 200, headers: baseHeaders('public, max-age=300, s-maxage=1800'),
    });
  }

  if (!res.ok) {
    holdUntil = now + 5 * 60 * 1000;
    return new Response(JSON.stringify({ ok: false, error: 'gdelt_http_' + res.status }), {
      status: 200, headers: baseHeaders('public, max-age=120, s-maxage=300'),
    });
  }

  let text;
  try {
    text = await res.text();
  } catch (e) {
    // Body stream broke mid-read — same discipline as every other path:
    // JSON envelope + hold, never a raw edge error.
    holdUntil = now + 60 * 1000;
    return new Response(JSON.stringify({ ok: false, error: 'gdelt_body_error' }), {
      status: 200, headers: baseHeaders('public, max-age=60, s-maxage=60'),
    });
  }
  if (text.trim().toLowerCase().startsWith('please limit requests')) {
    holdUntil = now + 5 * 60 * 1000;
    return new Response(JSON.stringify({ ok: false, error: 'gdelt_rate_limited' }), {
      status: 200, headers: baseHeaders('public, max-age=120, s-maxage=300'),
    });
  }

  let j;
  try { j = JSON.parse(text); } catch (e) {
    holdUntil = now + 60 * 1000;
    return new Response(JSON.stringify({ ok: false, error: 'gdelt_non_json' }), {
      status: 200, headers: baseHeaders('public, max-age=60, s-maxage=60'),
    });
  }

  const raw = j && j.timeline && j.timeline[0] && j.timeline[0].data;
  if (!Array.isArray(raw) || !raw.length) {
    return new Response(JSON.stringify({ ok: false, error: 'no_timeline' }), {
      status: 200, headers: baseHeaders('public, max-age=60, s-maxage=60'),
    });
  }

  const series = raw.map((d) => ({
    date: String(d.date || '').slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
    value: Number(d.value) || 0,
  })).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date));

  return new Response(JSON.stringify({
    ok: true,
    source: 'GDELT 2.0',
    metric: 'Myanmar media volume (share of global coverage)',
    spanDays: series.length,
    updatedAt: new Date().toISOString(),
    series,
  }), { status: 200, headers: baseHeaders('public, max-age=600, s-maxage=600') });
}
