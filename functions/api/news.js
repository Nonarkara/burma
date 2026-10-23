// Cloudflare Pages Function — news aggregation endpoint.
// NON-SCRAPE: live RSS feeds from independent Myanmar-focused broadcasters
// (DVB English, The Irrawaddy English + Burmese edition — verified Sept 2026;
// Burmese feed re-verified live 2026-10-23), parsed server-side, geocoded by
// keyword in English and Burmese (inferred, not verified locations).
// Illustrative data remains accessible only with demo=1; a feed failure never
// becomes fake news. No HTML scraping, no Myanmar-state sources, no PII.

import { CURATED_NEWS } from '../data/news.js';

const FEEDS = [
  { url: 'https://english.dvb.no/feed', source: 'DVB', sourceLabel: 'DVB English', sourceShort: 'DVB', lang: 'en' },
  { url: 'https://irrawaddy.com/feed', source: 'Irrawaddy', sourceLabel: 'The Irrawaddy', sourceShort: 'Irrawaddy', lang: 'en' },
  { url: 'https://burma.irrawaddy.com/feed', source: 'IrrawaddyBurmese', sourceLabel: 'ဧရာဝတ — Irrawaddy Burmese', sourceShort: 'ဧရာဝတ', lang: 'my' },
];

// Geocode by place-name keyword, English + Burmese (Thai-side + Myanmar
// borderlands only). Burmese spellings need native review — flagged in the
// cultural-review packet (docs/REVIEW-PACKET.md).
const GEO = [
  [/(mae ?hong ?son)/i, 19.3023, 97.8327, 'Mae Hong Son', 'TH'],
  [/(mae ?sot|myawaddy|မဲဆောက်|မြဝတီ)/i, 16.7456, 98.5473, 'Mae Sot', 'TH'],
  [/(mae ?sai|tachileik|တာချီလိတ်)/i, 20.4267, 99.8817, 'Mae Sai', 'TH'],
  [/(kawthaung|ကော့သောင်း)/i, 11.015, 98.493, 'Kawthaung', 'MM'],
  [/(chiang ?rai)/i, 19.9105, 99.8406, 'Chiang Rai', 'TH'],
  [/(chiang ?mai)/i, 18.7883, 98.9853, 'Chiang Mai', 'TH'],
  [/(bangkok|pathum ?thani|samut ?prakan|ဗန်ကောက်)/i, 13.7563, 100.5018, 'Bangkok', 'TH'],
  [/(hpakant|ဖာကန့်)/i, 25.6367, 96.4289, 'Hpakant', 'MM'],
  [/(myitkyina|kachin|မြစ်ကြီးနား|ကချင်)/i, 25.3867, 97.395, 'Myitkyina', 'MM'],
  [/(taunggyi|shan state|shan|တောင်ကြီး|ရှမ်း)/i, 20.7825, 97.0367, 'Taunggyi', 'MM'],
  [/(rakhine|arakan|sittwe|ရခိုင်|စစ်တွေ)/i, 20.1464, 92.8939, 'Sittwe', 'MM'],
  [/(naypyidaw|nay pyi taw|နေပြည်တော်)/i, 19.7633, 96.0785, 'Naypyidaw', 'MM'],
  [/(mandalay|မန္တလေး)/i, 21.9747, 96.0839, 'Mandalay', 'MM'],
  [/(sagaing|monywa|စစ်ကိုင်း|မုံရွာ)/i, 22.1083, 95.1354, 'Monywa', 'MM'],
  [/(pathein|ayeyarwaddy|irrawaddy delta|ပုသိမ်)/i, 16.7833, 94.7333, 'Pathein', 'MM'],
  [/(bagan|pagan|ပုဂံ)/i, 21.1717, 94.8583, 'Bagan', 'MM'],
  [/(myawaddy|three pagodas|မြဝတီ)/i, 16.6067, 98.5128, 'Myawaddy', 'MM'],
  [/(yangon|ရန်ကုန်)/i, 16.8409, 96.1735, 'Yangon', 'MM'],
  [/(mawlamyine|moulmein|မော်လမြိုင်)/i, 16.4847, 97.6228, 'Mawlamyine', 'MM'],
];

function decodeCdata(s) {
  if (!s) return '';
  const m = String(s).match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (m ? m[1] : s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
    .replace(/&#0*39;|'/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&/g, '&')
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
    // Field by language, honestly: a Burmese title is title_my, never
    // title_en wearing a Burmese script. Empty fields stay empty.
    const isMy = feed.lang === 'my';
    out.push({
      id: 'live-' + feed.source.toLowerCase() + '-' + Math.abs([...link].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)).toString(36).slice(0, 10),
      ts,
      lang: feed.lang || 'en',
      region: loc.country === 'TH' ? 'diaspora' : 'mm',
      source: feed.source, sourceLabel: feed.sourceLabel, sourceShort: feed.sourceShort,
      topics: ['live'],
      location: loc,
      title_en: isMy ? '' : title,
      title_my: isMy ? title : '',
      body_en: isMy ? '' : desc.slice(0, 400),
      body_my: isMy ? desc.slice(0, 400) : '',
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
  const demonstration = url.searchParams.get('demo') === '1';

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
  } catch (e) { /* Return unavailable rather than illustrative replacements. */ }

  // Dedupe live by normalized title. Unicode-aware: the old ASCII `\W+`
  // regex collapsed every Burmese title to whitespace, wrongly deduping
  // distinct Burmese items against each other.
  const seen = new Set();
  live = live.filter((it) => {
    const words = (it.title_en + ' ' + it.title_my).match(/[\p{L}\p{N}]+/gu) || [];
    const key = words.join(' ').toLowerCase() + '|' + it.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Preserve illustrative material for explicit demos, never as real news.
  const corpus = CURATED_NEWS.map((it) => ({ ...it, tier: 'demonstration', verification: 'illustrative-not-verified' }));
  let items = demonstration ? corpus : live;

  const mode = demonstration ? 'demonstration' : !live.length ? 'unavailable' : feedsOk === FEEDS.length ? 'live' : 'partial-live';

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
      corpusDate: demonstration ? '2026-09-14' : null,
      count: items.length,
      generatedAt: new Date().toISOString(),
      items,
    }),
    { status: 200, headers },
  );
}
