// Cloudflare Pages Function — link preview (OpenGraph) fetcher.
// Best-effort, 4-second timeout. Returns minimal metadata for chat link cards.

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const target = url.searchParams.get('url');
  if (!target) {
    return new Response(JSON.stringify({ ok: false, error: 'missing url' }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid url' }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return new Response(JSON.stringify({ ok: false, error: 'protocol not allowed' }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }

  const abort = AbortSignal.timeout(4000);
  try {
    const res = await fetch(parsed.toString(), {
      redirect: 'follow',
      signal: abort,
      headers: { 'user-agent': 'Pirchchat/0.1 (+link-preview)' },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'fetch_failed', status: res.status }), {
        status: 502,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      });
    }
    const ct = res.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml/i.test(ct)) {
      return new Response(JSON.stringify({ ok: false, error: 'not_html', contentType: ct }), {
        status: 415,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      });
    }
    const html = await res.text();
    const pick = (re) => { const m = html.match(re); return m ? m[1] : null; };
    const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogDesc = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const twTitle = pick(/<meta[^>]+(?:name|property)=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
    const twDesc = pick(/<meta[^>]+(?:name|property)=["']twitter:description["'][^>]+content=["']([^"']+)["']/i);
    const twImage = pick(/<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    const htmlTitle = pick(/<title[^>]*>([^<]+)<\/title>/i);

    const title = ogTitle || twTitle || htmlTitle || parsed.hostname;
    const description = ogDesc || twDesc || '';
    let image = ogImage || twImage || '';

    if (image && !/^https?:/i.test(image)) {
      try { image = new URL(image, parsed).toString(); } catch (e) { image = ''; }
    }

    return new Response(JSON.stringify({
      ok: true,
      url: parsed.toString(),
      host: parsed.hostname,
      title,
      description,
      image,
      fetchedAt: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=600, s-maxage=600',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'fetch_error', message: String(e && e.message || e) }), {
      status: 504,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }
}
