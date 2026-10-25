import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const moduleUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const dataUrl = moduleUrl(fs.readFileSync('functions/data/news.js', 'utf8'));
const briefsUrl = moduleUrl(fs.readFileSync('functions/data/community-briefs.js', 'utf8'));
const source = fs.readFileSync('functions/api/news.js', 'utf8').replace("'../data/news.js'", JSON.stringify(dataUrl)).replace("'../data/community-briefs.js'", JSON.stringify(briefsUrl));
const { onRequestGet } = await import(moduleUrl(source));
const { communityBriefs } = await import(briefsUrl);

test('feed outage never publishes illustrative policy or job claims as current news', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 503 });
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
    assert.equal(body.mode, 'unavailable');
    assert.deepEqual(body.items, []);
    assert.equal(body.corpusDate, null);
  } finally { globalThis.fetch = original; }
});

test('illustrative content is preserved only in an explicit, labelled demonstration', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 503 });
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news?demo=1') })).json();
    assert.equal(body.mode, 'demonstration');
    assert.ok(body.items.length);
    assert.ok(body.items.every((item) => item.tier === 'demonstration' && item.verification === 'illustrative-not-verified'));
  } finally { globalThis.fetch = original; }
});

test('a successful RSS feed does not silently merge demonstration records', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<rss><channel><item><title>Community learning update</title><link>https://publisher.example.org/update</link><pubDate>Tue, 13 Oct 2026 00:00:00 GMT</pubDate><description>Published report.</description></item></channel></rss>');
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
    assert.equal(body.mode, 'live');
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].title_en, 'Community learning update');
    assert.equal(body.items[0].tier, 'live-wire');
  } finally { globalThis.fetch = original; }
});

test('migrant rights and learning stories reach the Jobs/Visa filter with per-source health', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => String(url).includes('hrdfoundation.org')
      ? new Response('<rss><channel><item><title>Migrant worker legal training in Thailand</title><link>https://hrdfoundation.org/?p=123</link><pubDate>Thu, 22 Oct 2026 00:00:00 GMT</pubDate><description>Long rights case narrative must not be republished.</description></item></channel></rss>')
      : new Response('', { status: 503 });
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news?region=visa-jobs') })).json();
    assert.equal(body.mode, 'partial-live');
    assert.equal(body.sourceCount, 5);
    assert.equal(body.feedsOk, 1);
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].region, 'diaspora');
    assert.ok(body.items[0].topics.includes('employment'));
    assert.ok(body.items[0].topics.includes('learning'));
    assert.equal(body.items[0].body_en, '');
    assert.equal(body.sources.find((s) => s.id === 'HRDF').status, 'available');
    assert.equal(body.sources.find((s) => s.id === 'DVB').status, 'unavailable');
  } finally { globalThis.fetch = original; }
});

test('unknown publication dates and places do not become today or a precise Myanmar pin', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<rss><channel><item><title>Myanmar community update</title><link>https://publisher.example.org/unknown</link></item></channel></rss>');
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
    assert.equal(body.items[0].ts, null);
    assert.equal(body.items[0].publishedAt, null);
    assert.equal(body.items[0].location, null);
  } finally { globalThis.fetch = original; }
});

test('unsafe links are excluded and malformed numeric entities cannot crash an entire feed', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<rss><channel><item><title>Unsafe</title><link>javascript:alert(1)</link></item><item><title>Myanmar &#99999999999999; &amp; community</title><link>https://publisher.example.org/safe</link></item></channel></rss>');
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].title_en, 'Myanmar & community');
  } finally { globalThis.fetch = original; }
});

test('HTML and oversized payloads cannot be counted as healthy RSS', async () => {
  const original = globalThis.fetch;
  try {
    for (const content of ['<html>Blocked by publisher</html>', '<rss>' + 'x'.repeat(1024 * 1024) + '</rss>']) {
      globalThis.fetch = async () => new Response(content);
      const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
      assert.equal(body.mode, 'unavailable');
      assert.equal(body.feedsOk, 0);
      assert.ok(body.sources.every((s) => s.status === 'unavailable'));
    }
  } finally { globalThis.fetch = original; }
});

test('cross-border place names cannot be silently relocated to Thai checkpoints', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<rss><channel><item><title>Myawaddy and Tachileik community update</title><link>https://publisher.example.org/border</link></item></channel></rss>');
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
    assert.equal(body.items[0].location, null);
  } finally { globalThis.fetch = original; }
});

test('double-escaped publisher query strings retain their language parameter', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<rss><channel><item><title>Myanmar worker training</title><link>https://hrdfoundation.org/?p=9408&amp;#038;lang=en</link><description>Publisher office in Bangkok.</description></item></channel></rss>');
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
    assert.equal(body.items[0].url, 'https://hrdfoundation.org/?p=9408&lang=en');
    assert.equal(body.items[0].location, null);
  } finally { globalThis.fetch = original; }
});

test('HRDF malformed hash links use the publisher same-origin article GUID', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => String(url).includes('hrdfoundation.org')
      ? new Response('<rss><channel><item><title>Myanmar worker training</title><link>https://hrdfoundation.org/#038;lang=en?p=9408&#038;</link><guid isPermaLink="false">https://hrdfoundation.org/?p=9408</guid></item></channel></rss>')
      : new Response('', { status: 503 });
    const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
    assert.equal(body.items[0].url, 'https://hrdfoundation.org/?p=9408&lang=en');
    assert.equal(body.items[0].source, 'HRDF');
  } finally { globalThis.fetch = original; }
});

test('HRDF GUID repair cannot bypass credential or off-origin URL rejection', async () => {
  const original = globalThis.fetch;
  try {
    for (const guid of ['https://user:pass@hrdfoundation.org/?p=9408', 'https://attacker.example/?p=9408', 'https://hrdfoundation.org/redirect?p=9408']) {
      globalThis.fetch = async (url) => String(url).includes('hrdfoundation.org')
        ? new Response('<rss><channel><item><title>Myanmar worker training</title><link>https://hrdfoundation.org/#038;lang=en?p=9408&#038;</link><guid>' + guid + '</guid></item></channel></rss>')
        : new Response('', { status: 503 });
      const body = await (await onRequestGet({ request: new Request('https://site.test/api/news') })).json();
      assert.equal(body.items.length, 0);
    }
  } finally { globalThis.fetch = original; }
});

test('dated opportunity cards expire and contradictory provider dates stay unconfirmed', () => {
  const current = communityBriefs(Date.parse('2026-10-25T12:00:00+07:00'));
  assert.equal(current.find((i) => i.id === 'afmam-eas-2026').status, 'source_checked');
  assert.equal(current.find((i) => i.id === 'cetana-2027-28').status, 'needs_confirmation');
  assert.equal(current.find((i) => i.id === 'cetana-2027-28').deadline, null);
  const after = communityBriefs(Date.parse('2026-10-31T00:00:00+07:00'));
  assert.equal(after.find((i) => i.id === 'afmam-eas-2026').status, 'closed');
});
