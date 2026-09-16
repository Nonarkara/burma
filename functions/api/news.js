// Cloudflare Pages Function — news aggregation endpoint.
// Static corpus today. Will accept RSS inputs once Surface 2 (Digest) ships.

import { CURATED_NEWS } from '../data/news.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const filterRegion = url.searchParams.get('region') || 'all';
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 50, 100));

  let items = [...CURATED_NEWS];
  if (filterRegion !== 'all') {
    items = items.filter((it) => filterRegion === 'visa-jobs'
      ? it.topics.some((topic) => /job|visa|work|employment|migration/.test(topic))
      : it.region === filterRegion);
  }

  items.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
  items = items.slice(0, limit);

  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=60, s-maxage=60',
  };

  return new Response(
    JSON.stringify({
      ok: true,
      mode: 'static-unverified',
      corpusDate: '2026-09-14',
      count: items.length,
      generatedAt: new Date().toISOString(),
      items,
    }),
    { status: 200, headers },
  );
}
