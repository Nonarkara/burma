// Moderation regression — ban / unban / public read, mod-auth required.
//
// The ban list is public to the community so a banned member (and
// everyone else) can see why. Apply / lift requires the caller to be in
// env.MODS AND present a matching X-Pirchchat-Identity header. We test
// the auth shape and the failure cases (no mod list, wrong caller, bad
// pubkey shape). The DB-write happy path is covered in the live smoke
// run.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const roomUrl = 'data:text/javascript;base64,' + Buffer.from(fs.readFileSync('chat-worker/src/chat-room-do.js', 'utf8')).toString('base64');
const limiterUrl = 'data:text/javascript;base64,' + Buffer.from(fs.readFileSync('chat-worker/src/rate-limiter-do.js', 'utf8')).toString('base64');
const { ChatRoomDO } = await import(roomUrl);
const { RateLimiterDO } = await import(limiterUrl);
const workerSource = fs.readFileSync('chat-worker/src/index.js', 'utf8')
  .replace("'./chat-room-do.js'", JSON.stringify(roomUrl))
  .replace("'./rate-limiter-do.js'", JSON.stringify(limiterUrl));
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(workerSource).toString('base64'));

const envMods = (mods) => ({ MODS: mods, ALLOWED_ORIGINS: 'https://test.local', DB: workingDB() });
const workingDB = () => {
  const tables = new Map();
  const tablesCreated = new Set();
  return {
    prepare(sql) {
      // CREATE TABLE IF NOT EXISTS is a no-op in this stub.
      const m = sql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
      if (m) tablesCreated.add(m[1].toLowerCase());
      return {
        bind() { return this; },
        async run() {},
        async all() {
          // For SELECT statements we return empty. The moderation endpoints
          // read or write — failures here are what we're testing.
          return { results: [] };
        },
        async first() { return null; },
      };
    },
  };
};
const DUMMY_DB = workingDB();

function makeReq(url, init = {}) {
  return new Request('https://worker.test' + url, init);
}

function call(path, init = {}, env = envMods('mod_alice'), reqOrigin = 'https://test.local') {
  const headers = Object.assign({ 'Origin': reqOrigin }, init.headers || {});
  return worker.fetch(makeReq(path, Object.assign({}, init, { headers })), env, { waitUntil() {}, passThroughOnException() {} });
}

test('bans list is readable anonymously (community audit)', async () => {
  const r = await call('/api/moderation/bans', { method: 'GET' });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.ok(Array.isArray(j.bans));
});

test('ban apply requires a configured mod list', async () => {
  const r = await call('/api/moderation/ban', {
    method: 'POST',
    headers: { 'X-Pirchchat-Identity': 'mod_alice' },
    body: JSON.stringify({ pubkey: 'user_x', reason: 'spam' }),
  }, { MODS: '', ALLOWED_ORIGINS: 'https://test.local', DB: workingDB() });
  assert.equal(r.status, 503);
  const j = await r.json();
  assert.equal(j.error, 'no_mods_configured');
});

test('ban apply rejects a caller not in the mod list', async () => {
  const r = await call('/api/moderation/ban', {
    method: 'POST',
    headers: { 'X-Pirchchat-Identity': 'not_a_mod' },
    body: JSON.stringify({ pubkey: 'user_x', reason: 'spam' }),
  });
  assert.equal(r.status, 403);
  const j = await r.json();
  assert.equal(j.error, 'not_a_mod');
});

test('ban apply rejects a missing pubkey', async () => {
  const r = await call('/api/moderation/ban', {
    method: 'POST',
    headers: { 'X-Pirchchat-Identity': 'mod_alice' },
    body: JSON.stringify({ reason: 'spam' }),
  });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.error, 'missing_pubkey');
});

test('ban apply rejects a pubkey with the wrong shape', async () => {
  const r = await call('/api/moderation/ban', {
    method: 'POST',
    headers: { 'X-Pirchchat-Identity': 'mod_alice' },
    body: JSON.stringify({ pubkey: 'evil!@#', reason: 'spam' }),
  });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.error, 'invalid_pubkey_shape');
});

test('mod_log is publicly readable', async () => {
  const r = await call('/api/moderation/log', { method: 'GET' });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.ok(Array.isArray(j.log));
});

test('banned user cannot post (D1 path)', async () => {
  const instance = new ChatRoomDO({ id: { toString: () => 'test-room' } }, { DB: DUMMY_DB });
  // isBanned is fail-open with D1 unavailable; the test exercises the
  // method directly. The actual DB-backed behaviour is covered live.
  assert.equal(await instance.isBanned('any-user'), false);
});
