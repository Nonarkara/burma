import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const moduleUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const dataUrl = moduleUrl(fs.readFileSync('functions/data/news.js', 'utf8'));
const source = fs.readFileSync('functions/api/news.js', 'utf8').replace("'../data/news.js'", JSON.stringify(dataUrl));
const { onRequestGet } = await import(moduleUrl(source));

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
