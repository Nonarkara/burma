// Cloudflare Pages Function — media-volume trend for Myanmar coverage.
// NON-SCRAPE: GDELT 2.0 doc API (timelinevol, no key, public). Returns a
// 14-day daily volume series for sparkline rendering.
//
// GDELT enforces 1 request / 5 s globally for anonymous traffic. We do two
// things about that:
//   1. Cache successful responses 10 min via the Cache API (s-maxage honored
//      by Cloudflare's edge).
//   2. Detect GDELT's rate-limit response (HTTP 200 with a plain-text body
//      that starts with "Please limit requests…") and back off for 5 min by
//      caching the failure. Without that, every call from a fresh page load
//      spams GDELT and never gets data.
// On failure the client hides the spark (honest absence).

const GDELT = 'https://api.gdeltproject.org/api/v2/doc/doc?query=Myanmar&mode=timelinevol&timespan=14d&format=json';
const CACHE_OK = 'public, max-age=600, s-maxage=600';
const CACHE_HOLD = 'public, max-age=300, s-maxage=300';

export async function onRequestGet({ request, cache }) {
  const cacheKey = new Request(request.url, { method: 'GET' });
  const cached = cacheKey.url && await caches.match(cacheKey);
  if (cached) {
    return new Response(await cached.text(), {
      status: cached.status,
      headers: new Headers(cached.headers),
    });
  }

  const baseHeaders = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
  };

  let gdeltRes;
  try {
    gdeltRes = await fetch(GDELT, {
      signal: AbortSignal.timeout(8000),
      headers: { 'user-agent': 'Pirchchat/0.1 (+burma.nonarkara.org)' },
    });
  } catch (e) {
    return await failAndCache(cacheKey, baseHeaders, 'upstream_timeout', CACHE_HOLD);
  }

  if (!gdeltRes.ok) {
    return await failAndCache(cacheKey, baseHeaders, 'gdelt_http_' + gdeltRes.status, CACHE_HOLD);
  }

  // GDELT returns HTTP 200 with plain-text rate-limit body when blocked. Detect
  // before JSON parsing crashes.
  const text = await gdeltRes.text();
  if (text.trim().toLowerCase().startsWith('please limit requests')) {
    return await failAndCache(cacheKey, baseHeaders, 'gdelt_rate_limited', CACHE_HOLD);
  }

  let j;
  try { j = JSON.parse(text); } catch (e) {
    return await failAndCache(cacheKey, baseHeaders, 'gdelt_non_json', CACHE_HOLD);
  }

  const raw = j && j.timeline && j.timeline[0] && j.timeline[0].data;
  if (!Array.isArray(raw) || !raw.length) {
    return await failAndCache(cacheKey, baseHeaders, 'no_timeline', CACHE_HOLD);
  }

  const series = raw.map((d) => ({
    date: String(d.date || '').slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
    value: Number(d.value) || 0,
  })).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date));

  const body = JSON.stringify({
    ok: true,
    source: 'GDELT 2.0',
    metric: 'Myanmar media volume (share of global coverage)',
    spanDays: series.length,
    updatedAt: new Date().toISOString(),
    series,
  });
  const okHeaders = new Headers(baseHeaders);
  okHeaders.set('cache-control', CACHE_OK);
  const okResponse = new Response(body, { status: 200, headers: okHeaders });
  if (cache) cache.put(cacheKey, okResponse.clone());
  return okResponse;
}

async function failAndCache(cacheKey, baseHeaders, error, cacheControl) {
  const body = JSON.stringify({
    ok: false,
    error,
    hint: 'GDELT anonymous traffic is rate-limited at 1 req / 5 s. The sparkline is hidden client-side while we wait out the hold.',
  });
  const failHeaders = new Headers(baseHeaders);
  failHeaders.set('cache-control', cacheControl);
  const failResponse = new Response(body, { status: 502, headers: failHeaders });
  if (cache) cache.put(cacheKey, failResponse.clone());
  return failResponse;
}
