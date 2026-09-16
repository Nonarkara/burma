// Cloudflare Pages Function — link preview (OpenGraph) fetcher.
// Best-effort, 4-second timeout. Returns minimal metadata for chat link cards.

function publicHttpUrl(value) {
  const u = new URL(value);
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!/^https?:$/.test(u.protocol) || u.username || u.password ||
      !host.includes('.') || host.endsWith('.localhost') || host.endsWith('.local') ||
      host.startsWith('[') || /^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host)) {
    throw new Error('URL must be a public HTTP(S) website');
  }
  return u;
}

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
    parsed = publicHttpUrl(target);
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
    let res;
    for (let redirects = 0; redirects <= 3; redirects++) {
      res = await fetch(parsed.toString(), {
        redirect: 'manual', signal: abort,
        headers: { 'user-agent': 'Pirchchat/0.1 (+link-preview)' },
      });
      if (![301, 302, 303, 307, 308].includes(res.status)) break;
      if (redirects === 3) throw new Error('too_many_redirects');
      const next = res.headers.get('location');
      if (!next) throw new Error('missing_redirect');
      await res.body?.cancel();
      parsed = publicHttpUrl(new URL(next, parsed).href);
    }
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
    const reader = res.body.getReader();
    const chunks = []; let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 512 * 1024) throw new Error('page_too_large');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const html = new TextDecoder().decode(bytes);
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
