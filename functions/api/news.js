// Cloudflare Pages Function — news aggregation endpoint.
// NON-SCRAPE: live RSS feeds from independent Myanmar-focused broadcasters
// (DVB English, The Irrawaddy English + Burmese edition — verified Sept 2026;
// Burmese feed re-verified live 2026-10-23), parsed server-side, geocoded by
// keyword in English and Burmese (inferred, not verified locations).
// Illustrative data remains accessible only with demo=1; a feed failure never
// becomes fake news. No HTML scraping, no Myanmar-state sources, no PII.

import { CURATED_NEWS } from '../data/news.js';
import { communityBriefs } from '../data/community-briefs.js';

const FEEDS = [
  { url: 'https://english.dvb.no/feed', source: 'DVB', sourceLabel: 'DVB English', sourceShort: 'DVB', lang: 'en' },
  { url: 'https://irrawaddy.com/feed', source: 'Irrawaddy', sourceLabel: 'The Irrawaddy', sourceShort: 'Irrawaddy', lang: 'en' },
  { url: 'https://burma.irrawaddy.com/feed', source: 'IrrawaddyBurmese', sourceLabel: 'ဧရာဝတ — Irrawaddy Burmese', sourceShort: 'ဧရာဝတ', lang: 'my' },
  { url: 'https://hrdfoundation.org/?feed=rss2&lang=en', source: 'HRDF', sourceLabel: 'HRDF · migrant rights', sourceShort: 'HRDF', lang: 'en', region: 'diaspora', topics: ['rights'], headlineOnly: true, sourceType: 'civil-society' },
  { url: 'https://prachataienglish.com/rss.xml', source: 'Prachatai', sourceLabel: 'Prachatai English', sourceShort: 'Prachatai', lang: 'en', region: 'diaspora', relevantOnly: true, headlineOnly: true, sourceType: 'publisher' },
];

// Geocode by place-name keyword, English + Burmese (Thai-side + Myanmar
// borderlands only). Burmese spellings need native review — flagged in the
// cultural-review packet (docs/REVIEW-PACKET.md).
const GEO = [
  [/(mae ?hong ?son)/i, 19.3023, 97.8327, 'Mae Hong Son', 'TH'],
  [/(mae ?sot|မဲဆောက်)/i, 16.7456, 98.5473, 'Mae Sot', 'TH'],
  [/(mae ?sai)/i, 20.4267, 99.8817, 'Mae Sai', 'TH'],
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
  [/(yangon|ရန်ကုန်)/i, 16.8409, 96.1735, 'Yangon', 'MM'],
  [/(mawlamyine|moulmein|မော်လမြိုင်)/i, 16.4847, 97.6228, 'Mawlamyine', 'MM'],
];

function decodeCdata(s) {
  if (!s) return '';
  const m = String(s).match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  let text = m ? m[1] : String(s);
  // Some WordPress feeds escape an entity twice, including query separators.
  for (let pass = 0; pass < 3; pass++) {
    const decoded = text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, value) => {
      if (value[0] !== '#') return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[value.toLowerCase()];
      const number = value[1].toLowerCase() === 'x' ? parseInt(value.slice(2), 16) : Number(value.slice(1));
      return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : '';
    });
    if (decoded === text) break;
    text = decoded;
  }
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function geocode(text) {
  // A cross-border story does not identify a safe or precise Thai-side point.
  if (/myawaddy|tachileik|မြဝတီ|တာချီလိတ်/i.test(text)) return null;
  for (const [re, lat, lng, place, country] of GEO) {
    if (re.test(text)) return { lat, lng, place, country, precision: 'inferred-place' };
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
    let safeUrl;
    try {
      safeUrl = new URL(link);
      if (!/^https?:$/.test(safeUrl.protocol) || safeUrl.username || safeUrl.password) continue;
      if (feed.source === 'HRDF' && /^#0*38;/.test(safeUrl.hash)) {
        // This publisher's language plugin puts the article query in a hash.
        // Its own same-origin WordPress GUID retains the actual article ID.
        const guid = new URL(pick('guid'));
        if (guid.origin !== new URL(feed.url).origin || guid.username || guid.password || guid.pathname !== '/' || guid.hash || !/^\d+$/.test(guid.searchParams.get('p') || '')) continue;
        guid.searchParams.set('lang', 'en');
        safeUrl = guid;
      }
    } catch { continue; }
    const text = title + ' ' + desc;
    if (feed.relevantOnly && !/myanmar|burma|migrant|refugee|stateless|scholarship|မြန်မာ|ရွှေ့ပြောင်း|ပညာသင်/i.test(text)) continue;
    let ts = null;
    const parsed = dateRaw ? Date.parse(dateRaw) : NaN;
    if (!Number.isNaN(parsed)) ts = new Date(parsed).toISOString();
    const loc = geocode(title);
    const diaspora = loc?.country === 'TH' || /thailand|thai |ထိုင်း/i.test(text);
    const topics = new Set(['live', ...(feed.topics || [])]);
    if (/work.?permit|visa|migrant|labou?r|employment|recruit|wage|အလုပ်|ဗီဇာ|ရွှေ့ပြောင်း/i.test(text)) topics.add('employment');
    if (/scholarship|training|education|university|ပညာသင်|သင်တန်း|ပညာရေး/i.test(text)) topics.add('learning');
    if (/clinic|health|medical|ဆေး|ကျန်းမာ/i.test(text)) topics.add('health');
    if (/community|festival|culture|ရပ်ရွာ|ယဉ်ကျေးမှု/i.test(text)) topics.add('community');
    // Field by language, honestly: a Burmese title is title_my, never
    // title_en wearing a Burmese script. Empty fields stay empty.
    const isMy = feed.lang === 'my';
    out.push({
      id: 'live-' + feed.source.toLowerCase() + '-' + Math.abs([...link].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)).toString(36).slice(0, 10),
      ts,
      lang: feed.lang || 'en',
      region: feed.region || (diaspora ? 'diaspora' : loc?.country === 'MM' || /myanmar|burma|မြန်မာ/i.test(text) ? 'mm' : 'world'),
      source: feed.source, sourceLabel: feed.sourceLabel, sourceShort: feed.sourceShort,
      topics: [...topics],
      location: loc,
      title_en: isMy ? '' : title,
      title_my: isMy ? title : '',
      body_en: isMy || feed.headlineOnly ? '' : desc.slice(0, 400),
      body_my: isMy && !feed.headlineOnly ? desc.slice(0, 400) : '',
      digest_en: '', digest_my: '',
      url: safeUrl.href,
      publishedAt: ts,
      sourceType: feed.sourceType || 'publisher',
      tier: 'live-wire',
    });
  }
  return out;
}

async function feedText(response) {
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024 * 1024) throw new Error('feed_too_large');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const xml = new TextDecoder().decode(bytes);
  if (!/<rss[\s>]/i.test(xml) || !/<item[\s>]/i.test(xml)) throw new Error('empty_or_invalid_feed');
  return xml;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const filterRegion = url.searchParams.get('region') || 'all';
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 50, 100));
  const demonstration = url.searchParams.get('demo') === '1';

  // Independent feeds in parallel, bounded to six seconds each.
  let live = [];
  let feedsOk = 0;
  const fetchedAt = new Date().toISOString();
  const sources = FEEDS.map((feed) => ({ id: feed.source, name: feed.sourceLabel, url: feed.url, lang: feed.lang, status: 'unavailable', items: 0, fetchedAt }));
  try {
    const results = await Promise.allSettled(FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'user-agent': 'Pirchchat/0.1 (+burma.nonarkara.org; RSS reader)' },
        cf: { cacheTtl: 900, cacheEverything: true },
      });
      if (!res.ok) throw new Error('http ' + res.status);
      return parseFeed(await feedText(res), feed);
    }));
    for (const [index, r] of results.entries()) {
      if (r.status === 'fulfilled') {
        feedsOk++; live = live.concat(r.value);
        sources[index].status = r.value.length ? 'available' : 'no_matching_items';
        sources[index].items = r.value.length;
        sources[index].newestPublishedAt = r.value.map((item) => item.publishedAt).filter(Boolean).sort().at(-1) || null;
      } else {
        const reason = String(r.reason?.message || '');
        sources[index].error = /^http \d{3}$/.test(reason) ? reason.replace(' ', '_')
          : ['feed_too_large', 'empty_or_invalid_feed'].includes(reason) ? reason
          : /timeout|abort/i.test(reason) ? 'timeout' : 'fetch_or_parse_failed';
      }
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
      ? (it.topics || []).some((topic) => /job|visa|work|employment|migration|rights|learning/.test(topic))
      : it.region === filterRegion);
  }

  items.sort((a, b) => (Date.parse(b.ts) || 0) - (Date.parse(a.ts) || 0));
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
      sourceCount: FEEDS.length,
      sources,
      communityBriefs: communityBriefs(),
      corpusDate: demonstration ? '2026-09-14' : null,
      count: items.length,
      generatedAt: new Date().toISOString(),
      items,
    }),
    { status: 200, headers },
  );
}
