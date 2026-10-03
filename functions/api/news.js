// Cloudflare Pages Function — news aggregation endpoint.
// NON-SCRAPE: live RSS feeds from independent Myanmar-focused broadcasters
// (DVB English, The Irrawaddy — both verified Sept 2026), parsed server-side,
// geocoded by keyword, merged with the verified corpus. If a feed is down,
// the corpus stands alone and the response says so (mode: 'corpus-only').
// No HTML scraping, no Myanmar-state sources, no PII.

import { CURATED_NEWS } from '../data/news.js';

const FEEDS = [
  { url: 'https://english.dvb.no/feed', source: 'DVB', sourceLabel: 'DVB English', sourceShort: 'DVB' },
  { url: 'https://irrawaddy.com/feed', source: 'Irrawaddy', sourceLabel: 'The Irrawaddy', sourceShort: 'Irrawaddy' },
];

// Geocode by place-name keyword (Thai-side + Myanmar borderlands only).
const GEO = [
  [/(mae ?hong ?son)/i, 19.3023, 97.8327, 'Mae Hong Son', 'TH'],
  [/(mae ?sot|myawaddy)/i, 16.7456, 98.5473, 'Mae Sot', 'TH'],
  [/(mae ?sai|tachileik)/i, 20.4267, 99.8817, 'Mae Sai', 'TH'],
  [/(kawthaung)/i, 11.015, 98.493, 'Kawthaung', 'MM'],
  [/(chiang ?rai)/i, 19.9105, 99.8406, 'Chiang Rai', 'TH'],
  [/(chiang ?mai)/i, 18.7883, 98.9853, 'Chiang Mai', 'TH'],
  [/(bangkok|pathum ?thani|samut ?prakan)/i, 13.7563, 100.5018, 'Bangkok', 'TH'],
  [/(hpakant)/i, 25.6367, 96.4289, 'Hpakant', 'MM'],
  [/(myitkyina|kachin)/i, 25.3867, 97.395, 'Myitkyina', 'MM'],
  [/(taunggyi|shan state|shan)/i, 20.7825, 97.0367, 'Taunggyi', 'MM'],
  [/(rakhine|arakan|sittwe)/i, 20.1464, 92.8939, 'Sittwe', 'MM'],
  [/(naypyidaw|nay pyi taw)/i, 19.7633, 96.0785, 'Naypyidaw', 'MM'],
  [/(mandalay)/i, 21.9747, 96.0839, 'Mandalay', 'MM'],
  [/(sagaing|monywa)/i, 22.1083, 95.1354, 'Monywa', 'MM'],
  [/(pathein|ayeyarwaddy|irrawaddy delta)/i, 16.7833, 94.7333, 'Pathein', 'MM'],
  [/(bagan|pagan)/i, 21.1717, 94.8583, 'Bagan', 'MM'],
  [/(myawaddy|three pagodas)/i, 16.6067, 98.5128, 'Myawaddy', 'MM'],
];

function decodeCdata(s) {
  if (!s) return '';
  const m = String(s).match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (m ? m[1] : s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
    .replace(/&#0*39;|'/g, "'").replace(/&/g, '&')
    .replace(/\s+/g, ' ').trim();
}

function geocode(text) {
  for (const [re, lat, lng, place, country] of GEO) {
    if (re.test(text)) return { lat, lng, place, country };
  }
  return null;
}

function parseFeed(xml, feed) {
  const out = [];
  const items = String(xml || '').match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  for (const raw of items.slice(0, 15)) {
    const pick = (tag) => {
      const m = raw.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
      return m ? decodeCdata(m[1]) : '';
    };
    const title = pick('title');
    const link = pick('link');
    const desc = pick('description');
    const dateRaw = pick('pubDate');
    if (!title) continue;
    let ts = new Date().toISOString();
    const parsed = dateRaw ? Date.parse(dateRaw) : NaN;
    if (!Number.isNaN(parsed)) ts = new Date(parsed).toISOString();
    const loc = geocode(title + ' ' + desc) || { lat: 21.0, lng: 96.0, place: 'Myanmar — region', country: 'MM' };
    out.push({
      id: 'live-' + feed.source.toLowerCase() + '-' + Math.abs([...link].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)).toString(36).slice(0, 10),
      ts,
      region: loc.country === 'TH' ? 'diaspora' : 'mm',
      source: feed.source, sourceLabel: feed.sourceLabel, sourceShort: feed.sourceShort,
      topics: ['live'],
      location: loc,
      title_en: title,
      title_my: '',
      body_en: desc.slice(0, 400),
      body_my: '',
      digest_en: '', digest_my: '',
      url: link || feed.url,
      tier: 'live-wire',
    });
  }
  return out;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const filterRegion = url.searchParams.get('region') || 'all';
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 50, 100));

  // Live wire — both feeds in parallel, 4s cap each, best-effort.
  let live = [];
  let feedsOk = 0;
  try {
    const results = await Promise.allSettled(FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(4000),
        headers: { 'user-agent': 'Pirchchat/0.1 (+burma.nonarkara.org; RSS reader)' },
      });
      if (!res.ok) throw new Error('http ' + res.status);
      return parseFeed(await res.text(), feed);
    }));
    for (const r of results) {
      if (r.status === 'fulfilled') { feedsOk++; live = live.concat(r.value); }
    }
  } catch (e) { /* corpus fallback below */ }

  // Dedupe live by normalized title.
  const seen = new Set();
  live = live.filter((it) => {
    const key = it.title_en.toLowerCase().replace(/\W+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Merge with the verified corpus (tier-labelled, never mixed silently).
  const corpus = CURATED_NEWS.map((it) => ({ ...it, tier: 'corpus-sept-2026' }));
  let items = live.concat(corpus);

  const mode = feedsOk ? (feedsOk === FEEDS.length ? 'live+corpus' : 'partial-live+corpus') : 'corpus-only';

  if (filterRegion !== 'all') {
    items = items.filter((it) => filterRegion === 'visa-jobs'
      ? (it.topics || []).some((topic) => /job|visa|work|employment|migration/.test(topic))
      : it.region === filterRegion);
  }

  items.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
  items = items.slice(0, limit);

  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=300, s-maxage=300',
  };

  return new Response(
    JSON.stringify({
      ok: true,
      mode,
      liveCount: live.length,
      feedsOk,
      corpusDate: '2026-09-14',
      count: items.length,
      generatedAt: new Date().toISOString(),
      items,
    }),
    { status: 200, headers },
  );
}
