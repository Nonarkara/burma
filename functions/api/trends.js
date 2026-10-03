// Cloudflare Pages Function — media-volume trend for Myanmar coverage.
// NON-SCRAPE: GDELT 2.0 doc API (timelinevol, no key, public). Returns a
// 14-day daily volume series for sparkline rendering. Cached 10 min —
// GDELT asks for 1 request / 5 s; one cached endpoint per surface stays well
// under that. On failure the client hides the spark (honest absence).

const GDELT = 'https://api.gdeltproject.org/api/v2/doc/doc?query=Myanmar&mode=timelinevol&timespan=14d&format=json';

export async function onRequestGet() {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=600, s-maxage=600',
  };
  try {
    const res = await fetch(GDELT, {
      signal: AbortSignal.timeout(8000),
      headers: { 'user-agent': 'Pirchchat/0.1 (+burma.nonarkara.org)' },
    });
    if (!res.ok) throw new Error('gdelt http ' + res.status);
    const j = await res.json();
    const raw = j && j.timeline && j.timeline[0] && j.timeline[0].data;
    if (!Array.isArray(raw) || !raw.length) throw new Error('no timeline');
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
    }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e && e.message || e) }), {
      status: 502,
      headers,
    });
  }
}
