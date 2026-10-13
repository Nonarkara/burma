import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (rel) => fs.readFileSync(new URL(rel, root), 'utf8');
const sourceUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const limitsUrl = sourceUrl(read('chat-worker/src/limits.js'));
const limiterUrl = sourceUrl(read('chat-worker/src/rate-limiter-do.js').replaceAll("'./limits.js'", JSON.stringify(limitsUrl)));
const roomUrl = sourceUrl(read('chat-worker/src/chat-room-do.js'));
const workerSource = read('chat-worker/src/index.js')
  .replaceAll("'./chat-room-do.js'", JSON.stringify(roomUrl))
  .replaceAll("'./rate-limiter-do.js'", JSON.stringify(limiterUrl))
  .replaceAll("'./limits.js'", JSON.stringify(limitsUrl));
const { default: worker } = await import(sourceUrl(workerSource));
const { RateLimiterDO } = await import(limiterUrl);
const {
  DEFAULT_ALLOWED_ORIGINS,
  DEFAULT_LIMITS,
  DEFAULT_MAX_UPLOAD_BYTES,
  MESSAGES,
  allowedOrigins,
  bangkokDay,
  clientIp,
  consumeLimit,
  emptyLimitState,
  isAllowedSiteRequest,
  readLimits,
  readMaxUploadBytes,
  secondsUntilBangkokMidnight,
} = await import(limitsUrl);

const SITE = 'https://burma-a3k.pages.dev';
const NOON = Date.parse('2026-10-13T05:00:00.000Z');
const JUST_BEFORE_MIDNIGHT = Date.parse('2026-10-13T16:59:59.000Z');
const MIDNIGHT = Date.parse('2026-10-13T17:00:00.000Z');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=', 'base64');
const LIMITS = { ...DEFAULT_LIMITS };

function take(state, ip, now, limits = LIMITS, phase = 'admit', maxTrackedIps) {
  return consumeLimit(state, { ip, now, limits, phase, maxTrackedIps });
}

function memoryStorage() {
  const data = new Map();
  let alarm = null;
  return {
    data,
    async get(key) { return data.has(key) ? structuredClone(data.get(key)) : undefined; },
    async put(key, value) { data.set(key, structuredClone(value)); },
    async delete(key) { data.delete(key); },
    async getAlarm() { return alarm; },
    async setAlarm(value) { alarm = value; },
    async list({ prefix, startAfter, limit } = {}) {
      const entries = [...data].filter(([key]) => (!prefix || key.startsWith(prefix)) && (!startAfter || key > startAfter));
      entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
      return new Map(entries.slice(0, limit || 128));
    },
  };
}

function freshLimiter() {
  const storage = memoryStorage();
  let tail = Promise.resolve();
  const limiter = new RateLimiterDO({
    storage,
    blockConcurrencyWhile(fn) {
      const run = tail.then(() => fn());
      tail = run.then(() => {}, () => {});
      return run;
    },
  });
  return { limiter, storage };
}

function bindingFor(limiter) {
  return {
    idFromName(name) {
      assert.equal(name, 'uploads');
      return 'uploads';
    },
    get() {
      return { fetch: (url, init) => limiter.fetch(new Request(url, init)) };
    },
  };
}

function memoryBackend() {
  const puts = [];
  const rows = [];
  return {
    puts,
    rows,
    UPLOADS: {
      async put(key, value, opts) { puts.push({ key, bytes: value.byteLength, opts }); },
    },
    DB: {
      prepare(sql) {
        const query = {
          bind(...args) { rows.push({ sql, args }); return query; },
          async run() {},
          async all() { return { results: [] }; },
        };
        return query;
      },
    },
  };
}

function uploadRequest({
  bytes = PNG,
  name = 'dot.png',
  type = 'image/png',
  ip = '203.0.113.10',
  origin = SITE,
  referer,
  contentLength,
  forwarded,
} = {}) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), name);
  form.append('pubkey', 'user_test');
  const draft = new Request('https://worker.test/api/upload', { method: 'POST', body: form });
  const headers = new Headers(draft.headers);
  if (ip) headers.set('CF-Connecting-IP', ip);
  if (origin) headers.set('Origin', origin);
  if (referer) headers.set('Referer', referer);
  if (forwarded) headers.set('X-Forwarded-For', forwarded);
  if (contentLength != null) headers.set('content-length', String(contentLength));
  return new Request(draft, { headers });
}

test('defaults are 6/min, 20/day, 100 stored images, and 700 KB', () => {
  assert.deepEqual(DEFAULT_LIMITS, { perIpPerMinute: 6, perIpPerDay: 20, globalPerDay: 100 });
  assert.equal(DEFAULT_MAX_UPLOAD_BYTES, 700 * 1024);
  assert.deepEqual(readLimits({}), DEFAULT_LIMITS);
  assert.deepEqual(readLimits({
    RATE_LIMIT_PER_MINUTE: '4',
    RATE_LIMIT_PER_DAY: '9',
    GLOBAL_DAILY_CAP: '0',
  }), { perIpPerMinute: 4, perIpPerDay: 9, globalPerDay: 0 });
  assert.equal(readLimits({ GLOBAL_DAILY_CAP: '-5' }).globalPerDay, 100);
  assert.equal(readLimits({ GLOBAL_DAILY_CAP: 'nope' }).globalPerDay, 100);
  assert.equal(readMaxUploadBytes({}), 700 * 1024);
  assert.equal(readMaxUploadBytes({ MAX_UPLOAD_BYTES: '1024' }), 1024);
  assert.equal(readMaxUploadBytes({ MAX_UPLOAD_BYTES: '99999999' }), 700 * 1024);
  const toml = read('chat-worker/wrangler.toml');
  assert.match(toml, /RATE_LIMIT_PER_MINUTE = "6"/);
  assert.match(toml, /RATE_LIMIT_PER_DAY = "20"/);
  assert.match(toml, /GLOBAL_DAILY_CAP = "100"/);
  assert.match(toml, /MAX_UPLOAD_BYTES = "716800"/);
  assert.match(toml, /https:\/\/burma\.nonarkara\.org/);
  assert.match(toml, /https:\/\/burma-a3k\.pages\.dev/);
});

test('the upload day follows Asia/Bangkok', () => {
  assert.equal(bangkokDay(JUST_BEFORE_MIDNIGHT), '2026-10-13');
  assert.equal(bangkokDay(MIDNIGHT), '2026-10-14');
  assert.equal(secondsUntilBangkokMidnight(NOON), 12 * 60 * 60);
  assert.equal(secondsUntilBangkokMidnight(MIDNIGHT), 24 * 60 * 60);
});

test('a star origin does not open the guard', () => {
  assert.deepEqual(allowedOrigins({}), DEFAULT_ALLOWED_ORIGINS);
  assert.deepEqual(allowedOrigins({ ALLOWED_ORIGINS: '*' }), DEFAULT_ALLOWED_ORIGINS);
  assert.deepEqual(
    allowedOrigins({ ALLOWED_ORIGINS: 'https://burma-a3k.pages.dev/, http://127.0.0.1:8798' }),
    ['https://burma-a3k.pages.dev', 'http://127.0.0.1:8798'],
  );
});

test('origin is required, and a bad origin is not saved by Referer', () => {
  const site = (headers) => new Request('https://worker.test/api/upload', { headers });
  assert.equal(isAllowedSiteRequest(site({ Origin: SITE }), {}), true);
  assert.equal(isAllowedSiteRequest(site({ Referer: SITE + '/dashboard' }), {}), true);
  assert.equal(isAllowedSiteRequest(site({}), {}), false);
  assert.equal(isAllowedSiteRequest(site({ Origin: 'null' }), {}), false);
  assert.equal(isAllowedSiteRequest(site({ Origin: 'https://evil.example', Referer: SITE + '/' }), {}), false);
  assert.equal(isAllowedSiteRequest(site({ Origin: 'https://burma-a3k.pages.dev.evil.example' }), {}), false);
});

test('CF-Connecting-IP is the bucket key; a forwarded header is ignored', () => {
  const request = new Request('https://worker.test/api/upload', {
    headers: { 'CF-Connecting-IP': '203.0.113.8', 'X-Forwarded-For': '198.51.100.9' },
  });
  assert.equal(clientIp(request), '203.0.113.8');
  assert.equal(clientIp(new Request('https://worker.test/api/upload', {
    headers: { 'X-Forwarded-For': '198.51.100.9' },
  })), 'unknown');
});

test('token bucket allows a burst of 6 and refills one token per 10 seconds', () => {
  let state = emptyLimitState();
  for (let i = 0; i < 6; i += 1) {
    const step = take(state, '203.0.113.1', NOON);
    assert.equal(step.ok, true, `request ${i + 1}`);
    state = step.state;
  }
  const blocked = take(state, '203.0.113.1', NOON);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'per_minute');
  assert.equal(blocked.retryAfter, 10);
  assert.equal(blocked.writes, null);
  assert.equal(blocked.state.globalCount, 0);

  const early = take(state, '203.0.113.1', NOON + 9999);
  assert.equal(early.reason, 'per_minute');
  const refilled = take(state, '203.0.113.1', NOON + 10000);
  assert.equal(refilled.ok, true);
  assert.equal(refilled.state.ips['203.0.113.1'].tokens, 0);
  assert.equal(take(state, '203.0.113.2', NOON).ok, true);
});

test('per-IP day cap is 20 and resets at Bangkok midnight', () => {
  const limits = { perIpPerMinute: 1000, perIpPerDay: 20, globalPerDay: 1000 };
  let state = emptyLimitState();
  for (let i = 0; i < 20; i += 1) state = take(state, '203.0.113.1', NOON, limits).state;
  const blocked = take(state, '203.0.113.1', NOON, limits);
  assert.equal(blocked.reason, 'per_day');
  assert.equal(blocked.writes, null);
  const nextDay = take(state, '203.0.113.1', MIDNIGHT, limits);
  assert.equal(nextDay.ok, true);
  assert.equal(nextDay.state.ips['203.0.113.1'].dayCount, 1);
});

test('a full global cap does not spend the caller token or the commit slot', () => {
  const limits = { perIpPerMinute: 6, perIpPerDay: 20, globalPerDay: 0 };
  const blocked = take(emptyLimitState(), '203.0.113.1', NOON, limits, 'admit');
  assert.equal(blocked.reason, 'global_day');
  assert.equal(blocked.writes, null);
  const committed = take(blocked.state, '203.0.113.1', NOON, limits, 'commit');
  assert.equal(committed.reason, 'global_day');
  assert.equal(committed.writes, null);
  assert.equal(committed.state.globalCount, 0);
});

test('commit stops at 100 and admit refuses once the cap is stored', () => {
  const limits = { perIpPerMinute: 1000, perIpPerDay: 1000, globalPerDay: 100 };
  let state = emptyLimitState();
  for (let i = 0; i < 100; i += 1) {
    const step = take(state, '203.0.113.1', NOON, limits, 'commit');
    assert.equal(step.ok, true, `commit ${i + 1}`);
    state = step.state;
  }
  assert.equal(state.globalCount, 100);
  const blocked = take(state, '203.0.113.250', NOON, limits, 'commit');
  assert.equal(blocked.reason, 'global_day');
  const admitted = take(state, '203.0.113.250', NOON, limits, 'admit');
  assert.equal(admitted.reason, 'global_day');
  assert.equal(admitted.state.ips['203.0.113.250'], undefined);
  const nextDay = take(state, '203.0.113.250', MIDNIGHT, limits, 'commit');
  assert.equal(nextDay.ok, true);
  assert.equal(nextDay.state.globalCount, 1);
});

test('new addresses are refused once the tracked-IP cap is full', () => {
  const limits = { perIpPerMinute: 6, perIpPerDay: 20, globalPerDay: 50 };
  let state = take(emptyLimitState(), '203.0.113.1', NOON, limits, 'admit', 1).state;
  const crowded = take(state, '203.0.113.2', NOON, limits, 'admit', 1);
  assert.equal(crowded.reason, 'crowded');
  assert.equal(take(state, '203.0.113.1', NOON, limits, 'admit', 1).ok, true);
});

test('the durable object does not hand the last daily slot to two callers', async () => {
  const { limiter, storage } = freshLimiter();
  const limits = { perIpPerMinute: 6, perIpPerDay: 20, globalPerDay: 1 };
  const call = (ip) => limiter.fetch(new Request('https://limiter.internal/consume', {
    method: 'POST',
    body: JSON.stringify({ ip, now: NOON, limits, phase: 'commit' }),
  }));
  const [a, b] = await Promise.all([call('aaaa'), call('bbbb')]);
  const bodyA = await a.json();
  const bodyB = await b.json();
  assert.equal([bodyA.ok, bodyB.ok].filter(Boolean).length, 1);
  assert.equal(bodyA.state, undefined);
  assert.equal(storage.data.get('global').count, 1);
});

test('health and room reads stay open without an upload origin', async () => {
  const DB = { prepare() { const q = { bind() { return q; }, async all() { return { results: [] }; }, async run() {} }; return q; } };
  const health = await worker.fetch(new Request('https://worker.test/api/health'), { DB });
  assert.equal(health.status, 200);
  const rooms = await worker.fetch(new Request('https://worker.test/api/rooms'), {});
  assert.equal(rooms.status, 200);
  assert.equal((await worker.fetch(new Request('https://worker.test/api/upload', { method: 'POST' }), {})).status, 403);
});

test('an off-site upload is refused before the limiter or R2', async () => {
  const backend = memoryBackend();
  let reservations = 0;
  const env = {
    ...backend,
    RATE_LIMITER: {
      idFromName() { return 'uploads'; },
      get() { return { fetch() { reservations += 1; return Response.json({ ok: true }); } }; },
    },
  };
  const denied = await worker.fetch(uploadRequest({ origin: 'https://evil.example' }), env);
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error, 'origin_not_allowed');
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const bare = await worker.fetch(uploadRequest({ origin: '' }), env);
  assert.equal(bare.status, 403);
  assert.equal((await bare.json()).message, MESSAGES.origin);
  const spoofed = await worker.fetch(uploadRequest({ origin: 'https://evil.example', referer: SITE + '/dashboard' }), env);
  assert.equal(spoofed.status, 403);
  assert.equal(reservations, 0);
  assert.equal(backend.puts.length, 0);
});

test('Referer from the site is enough when Origin is absent', async () => {
  const { limiter } = freshLimiter();
  const backend = memoryBackend();
  const res = await worker.fetch(uploadRequest({ origin: '', referer: SITE + '/dashboard' }), {
    ...backend,
    RATE_LIMITER: bindingFor(limiter),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.match(body.url, /^https:\/\/worker\.test\/cdn\/uploads\//);
  assert.equal(backend.puts.length, 1);
  assert.equal(backend.puts[0].opts.httpMetadata.contentType, 'image/png');
  assert.equal(backend.rows.length, 1);
});

test('a normal upload still returns the same success body', async () => {
  const { limiter, storage } = freshLimiter();
  const backend = memoryBackend();
  const res = await worker.fetch(uploadRequest(), {
    ...backend,
    RATE_LIMITER: bindingFor(limiter),
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Retry-After'), null);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(typeof body.id, 'string');
  assert.match(body.key, /^uploads\//);
  assert.equal(body.url, 'https://worker.test/cdn/' + body.key);
  const keys = [...storage.data.keys()];
  assert.equal(keys.some((key) => key.includes('203.0.113.10')), false);
  assert.ok(keys.some((key) => /^ip:[0-9a-f]{64}$/.test(key)));
});

test('the 7th image in a minute is a 429 and does not write to R2', async () => {
  const { limiter } = freshLimiter();
  const backend = memoryBackend();
  const env = { ...backend, RATE_LIMITER: bindingFor(limiter) };
  for (let i = 0; i < 6; i += 1) {
    const res = await worker.fetch(uploadRequest({ name: `n${i}.png` }), env);
    assert.equal(res.status, 200, `image ${i + 1}`);
  }
  const blocked = await worker.fetch(uploadRequest({ forwarded: '198.51.100.77' }), env);
  assert.equal(blocked.status, 429);
  const body = await blocked.json();
  assert.equal(body.error, 'rate_limited');
  assert.equal(body.message, MESSAGES.per_minute);
  assert.equal(blocked.headers.get('Retry-After'), String(body.retry_after));
  assert.ok(body.retry_after >= 1 && body.retry_after <= 10);
  const other = await worker.fetch(uploadRequest({ ip: '203.0.113.77' }), env);
  assert.equal(other.status, 200);
  assert.equal(backend.puts.length, 7);
});

test('the per-connection daily cap is enforced', async () => {
  const { limiter } = freshLimiter();
  const backend = memoryBackend();
  const env = {
    ...backend,
    RATE_LIMITER: bindingFor(limiter),
    RATE_LIMIT_PER_MINUTE: '10',
    RATE_LIMIT_PER_DAY: '2',
    GLOBAL_DAILY_CAP: '50',
  };
  assert.equal((await worker.fetch(uploadRequest({ name: 'a.png' }), env)).status, 200);
  assert.equal((await worker.fetch(uploadRequest({ name: 'b.png' }), env)).status, 200);
  const third = await worker.fetch(uploadRequest({ name: 'c.png' }), env);
  assert.equal(third.status, 429);
  assert.equal((await third.json()).message, MESSAGES.per_day);
  assert.equal(backend.puts.length, 2);
});

test('the daily site cap stops further R2 writes', async () => {
  const { limiter } = freshLimiter();
  const backend = memoryBackend();
  const warnings = [];
  const previous = console.warn;
  console.warn = (msg) => warnings.push(String(msg));
  try {
    const env = {
      ...backend,
      RATE_LIMITER: bindingFor(limiter),
      GLOBAL_DAILY_CAP: '1',
      RATE_LIMIT_PER_MINUTE: '10',
      RATE_LIMIT_PER_DAY: '10',
    };
    const first = await worker.fetch(uploadRequest({ ip: '203.0.113.1' }), env);
    const second = await worker.fetch(uploadRequest({ ip: '203.0.113.2', name: 'two.png' }), env);
    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    const body = await second.json();
    assert.equal(body.error, 'daily_cap');
    assert.equal(body.message, MESSAGES.global_day);
    assert.equal(backend.puts.length, 1);
    assert.ok(warnings.some((line) => line.includes('upload_daily_cap')));
    assert.equal(warnings.some((line) => line.includes('203.0.113')), false);
  } finally {
    console.warn = previous;
  }
});

test('an invalid image does not spend the daily site cap', async () => {
  const { limiter } = freshLimiter();
  const backend = memoryBackend();
  const env = {
    ...backend,
    RATE_LIMITER: bindingFor(limiter),
    GLOBAL_DAILY_CAP: '1',
    RATE_LIMIT_PER_MINUTE: '10',
    RATE_LIMIT_PER_DAY: '10',
  };
  const fake = await worker.fetch(uploadRequest({
    bytes: Buffer.from('<html>not a PNG</html>'),
    type: 'image/png',
    name: 'fake.png',
    ip: '203.0.113.3',
  }), env);
  assert.equal(fake.status, 415);
  const real = await worker.fetch(uploadRequest({ ip: '203.0.113.4' }), env);
  assert.equal(real.status, 200);
  assert.equal(backend.puts.length, 1);
});

test('a missing or broken limiter fails closed and does not write to R2', async () => {
  const backend = memoryBackend();
  const missing = await worker.fetch(uploadRequest(), { ...backend });
  assert.equal(missing.status, 503);
  const missingBody = await missing.json();
  assert.equal(missingBody.error, 'rate_limiter_unavailable');
  assert.equal(missingBody.message, MESSAGES.limiter_unavailable);

  const broken = await worker.fetch(uploadRequest(), {
    ...backend,
    RATE_LIMITER: {
      idFromName() { return 'uploads'; },
      get() { return { fetch() { throw new Error('storage down'); } }; },
    },
  });
  assert.equal(broken.status, 503);

  const nonsense = await worker.fetch(uploadRequest(), {
    ...backend,
    RATE_LIMITER: {
      idFromName() { return 'uploads'; },
      get() { return { fetch: async () => new Response('nope', { status: 200 }) }; },
    },
  });
  assert.equal(nonsense.status, 503);
  assert.equal(backend.puts.length, 0);
});

test('an oversized body is refused before the limiter and before R2', async () => {
  const backend = memoryBackend();
  let reservations = 0;
  const env = {
    ...backend,
    RATE_LIMITER: {
      idFromName() { return 'uploads'; },
      get() { return { fetch() { reservations += 1; return Response.json({ ok: true }); } }; },
    },
  };
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(32)); c.close(); } });
  const res = await worker.fetch(new Request('https://worker.test/api/upload', {
    method: 'POST',
    headers: {
      Origin: SITE,
      'content-type': 'multipart/form-data; boundary=x',
      'content-length': String(8 * 1024 * 1024),
    },
    body: stream,
    duplex: 'half',
  }), env);
  assert.equal(res.status, 413);
  assert.match((await res.json()).message, /700 KB/);
  assert.equal(reservations, 0);
  assert.equal(backend.puts.length, 0);
});

test('the configured file cap rejects a larger image before R2', async () => {
  const phases = [];
  const backend = memoryBackend();
  const res = await worker.fetch(uploadRequest(), {
    ...backend,
    MAX_UPLOAD_BYTES: '10',
    RATE_LIMITER: {
      idFromName() { return 'uploads'; },
      get() {
        return { fetch: async (_url, init) => { phases.push(JSON.parse(init.body).phase); return Response.json({ ok: true }); } };
      },
    },
  });
  assert.equal(res.status, 413);
  assert.match((await res.json()).message, /10 bytes/);
  assert.deepEqual(phases, ['admit']);
  assert.equal(backend.puts.length, 0);
});
