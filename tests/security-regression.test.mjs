import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sourceUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const roomUrl = sourceUrl(fs.readFileSync('chat-worker/src/chat-room-do.js', 'utf8'));
const limiterUrl = sourceUrl(fs.readFileSync('chat-worker/src/rate-limiter-do.js', 'utf8'));
const { ChatRoomDO, readLimitedBody } = await import(roomUrl);
const { RateLimiterDO } = await import(limiterUrl);
const workerSource = fs.readFileSync('chat-worker/src/index.js', 'utf8')
  .replace("'./chat-room-do.js'", JSON.stringify(roomUrl))
  .replace("'./rate-limiter-do.js'", JSON.stringify(limiterUrl));
const { default: worker } = await import(sourceUrl(workerSource));
const { onRequestGet: preview } = await import(sourceUrl(fs.readFileSync('functions/api/preview.js', 'utf8')));

function room() {
  const calls = [];
  const DB = { prepare(sql) {
    const query = { bind(...args) { calls.push({ sql, args }); return query; },
      async run() {}, async all() { return { results: [] }; }, async first() { return null; } };
    return query;
  } };
  const instance = new ChatRoomDO({ id: { toString: () => 'test-room' } }, { DB });
  return { instance, calls };
}
const post = (path, body) => new Request('https://worker.test/' + path, { method: 'POST', body: JSON.stringify(body) });

test('streamed body limits cannot be bypassed with missing or understated Content-Length', async () => {
  for (const headers of [{}, { 'content-length': '1' }]) {
    const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(20)); c.close(); } });
    const request = new Request('https://worker.test', { method: 'POST', headers, body: stream, duplex: 'half' });
    await assert.rejects(readLimitedBody(request, 10), { status: 413 });
  }
});

test('malformed and oversized JSON fail before database writes', async () => {
  const { instance, calls } = room();
  for (const [body, status] of [['{', 400], ['[]', 400], ['x'.repeat(17000), 413]]) {
    const result = await instance.fetch(new Request('https://worker.test/message', { method: 'POST', body }));
    assert.equal(result.status, status);
  }
  assert.equal(calls.filter((c) => /INSERT/.test(c.sql)).length, 0);
});

test('pins reject impossible coordinates and oversized notes', async () => {
  const { instance, calls } = room();
  for (const body of [{ lat: 91, lng: 0 }, { lat: '13', lng: 100 }, { lat: 13, lng: 181 }, { lat: 13, lng: 100, note: 'x'.repeat(501) }]) {
    assert.equal((await instance.fetch(post('pin', body))).status, 400);
  }
  assert.equal(calls.filter((c) => /INSERT/.test(c.sql)).length, 0);
});

test('watch create, read and stop bind the actual room; unsafe URLs never persist', async () => {
  const { instance, calls } = room();
  for (const url of ['javascript:alert(1)', 'http://site.test/video', 'https://user:pass@site.test/']) {
    assert.equal((await instance.fetch(post('watch', { url }))).status, 400);
  }
  const created = await instance.fetch(post('watch', { url: 'https://video.example.org/live.m3u8', kind: 'hls' }));
  assert.equal(created.status, 200);
  assert.equal((await created.json()).state.kind, 'hls');
  assert.equal((await instance.fetch(new Request('https://worker.test/watch'))).status, 200);
  assert.equal((await instance.fetch(post('watch', { stop: true }))).status, 200);
  for (const c of calls.filter((c) => /watch_state/.test(c.sql))) assert.equal(c.args[0], 'test-room');
});

test('pin and watch writes share the room mutation budget', async () => {
  const { instance } = room();
  for (let i = 0; i < 12; i++) assert.equal((await instance.fetch(post('pin', { lat: 13, lng: 100 }))).status, 200);
  assert.equal((await instance.fetch(post('watch', { stop: true }))).status, 429);
});

test('unexpected browser origins are rejected before storage or DO access', async () => {
  for (const origin of ['null', 'https://attacker.example', 'https://burma-a3k.pages.dev.attacker.example']) {
    const result = await worker.fetch(new Request('https://worker.test/api/rooms', { headers: { Origin: origin } }), {});
    assert.equal(result.status, 403);
    assert.equal(result.headers.get('access-control-allow-origin'), null);
  }
  assert.equal((await worker.fetch(new Request('https://worker.test/api/rooms', { headers: { Origin: 'https://burma-a3k.pages.dev' } }), {})).status, 200);
});

test('uploads fail closed when the durable limiter is unavailable', async () => {
  const result = await worker.fetch(post('api/upload', {}), {});
  assert.equal(result.status, 503);
  assert.equal((await result.json()).error, 'rate_limiter_unavailable');
});

test('declared image MIME cannot disguise HTML as an image', async () => {
  const form = new FormData();
  form.append('file', new Blob(['<html>not a PNG</html>'], { type: 'image/png' }), 'fake.png');
  const env = { RATE_LIMITER: { idFromName: () => 'id', get: () => ({ fetch: async () => new Response('', { status: 200 }) }) } };
  const result = await worker.fetch(new Request('https://worker.test/api/upload', { method: 'POST', body: form }), env);
  assert.equal(result.status, 415);
  assert.equal((await result.json()).error, 'invalid_image_content');
});

test('CDN rejects malformed paths rather than crashing or reading unrelated keys', async () => {
  for (const path of ['%ZZ', 'private/record', 'uploads/id/nested/file']) {
    assert.equal((await worker.fetch(new Request('https://worker.test/cdn/' + path), {})).status, 400);
  }
});

test('preview blocks alternate literal IPs, internal hosts, credentials and unusual ports', async () => {
  for (const url of ['http://2130706433/', 'http://0x7f000001/', 'http://100.64.0.1/', 'http://198.18.0.1/', 'https://service.internal/', 'https://public.example:8080/', 'https://user:pass@public.example/']) {
    assert.equal((await preview({ request: new Request('https://site.test/api/preview?url=' + encodeURIComponent(url)) })).status, 400, url);
  }
});

test('preview validates redirect destinations and strips unsafe OpenGraph images', async () => {
  const original = globalThis.fetch;
  const request = new Request('https://site.test/api/preview?url=https://public.example.org/');
  let fetches = 0;
  try {
    globalThis.fetch = async () => { fetches++; return new Response('', { status: 302, headers: { location: 'http://100.64.0.1/' } }); };
    assert.equal((await preview({ request })).status, 504);
    assert.equal(fetches, 1);
    globalThis.fetch = async () => new Response('<meta property="og:image" content="javascript:alert(1)"><title>Safe title</title>', { headers: { 'content-type': 'text/html' } });
    const result = await (await preview({ request })).json();
    assert.equal(result.ok, true); assert.equal(result.image, '');
  } finally { globalThis.fetch = original; }
});

test('durable upload counters enforce the budget atomically and expire inactive keys', async () => {
  const data = new Map(); let alarm = null; let queue = Promise.resolve();
  const storage = {
    get: async (key) => structuredClone(data.get(key)), put: async (key, value) => data.set(key, structuredClone(value)),
    getAlarm: async () => alarm, setAlarm: async (value) => { alarm = value; },
    list: async ({ startAfter }) => new Map([...data].filter(([key]) => !startAfter || key > startAfter).slice(0, 128)),
    delete: async (key) => data.delete(key),
    transaction(fn) { const result = queue.then(() => fn(storage)); queue = result.catch(() => {}); return result; },
  };
  const limiter = new RateLimiterDO({ storage }, {});
  const request = new Request('https://limiter/?key=test&max=2');
  const results = await Promise.all(Array.from({ length: 5 }, () => limiter.fetch(request)));
  assert.equal(results.filter((r) => r.status === 200).length, 2);
  assert.ok(alarm);
  data.set('t:expired', [Date.now() - 3600001]);
  await limiter.alarm();
  assert.equal(data.has('t:expired'), false);
  assert.equal(data.has('t:test'), true);
});
