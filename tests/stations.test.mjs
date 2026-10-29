// Media catalogue regression — the radio/TV panel must never claim a stream
// works without a measurement behind it.
//
// What this guards:
//   1. Catalogue integrity: unique ids, required fields, a date on every entry.
//   2. No entry claims 'live' without a stream URL, and no 'portal' entry
//      without a page to open.
//   3. The /api/stations function reports what the probe actually saw —
//      audio bytes mean live, an HTML page means down, no answer means
//      unreachable. It never invents a status.
//   4. When the probe cannot run at all, the function degrades to the last
//      recorded catalogue status instead of to an empty list.
//   5. The dashboard reads the catalogue through our own function and never
//      calls a third-party radio index from the visitor's browser.
//   6. The radio player lives inside the media panel — the old floating
//      audio box that covered the TV cards is gone.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('..', import.meta.url);
const catalogue = await import(new URL('functions/data/stations.js', root).href);
const { MEDIA_CATALOG, UNREACHABLE_ORIGINS } = catalogue;

const dashboardJs = fs.readFileSync(new URL('web/dashboard.js', root), 'utf8');
const dashboardHtml = fs.readFileSync(new URL('web/dashboard.html', root), 'utf8');
const dashboardCss = fs.readFileSync(new URL('web/dashboard.css', root), 'utf8');

const MYANMAR = /[\u1000-\u109F\uAA60-\uAA7F]/;

test('catalogue entries are complete and uniquely identified', () => {
  assert.ok(MEDIA_CATALOG.length > 0, 'catalogue is empty');
  const ids = new Set();
  for (const e of MEDIA_CATALOG) {
    assert.ok(e.id, 'entry without id');
    assert.ok(!ids.has(e.id), 'duplicate id: ' + e.id);
    ids.add(e.id);
    assert.ok(e.kind === 'radio' || e.kind === 'tv', 'bad kind on ' + e.id);
    assert.ok(e.name, 'no name on ' + e.id);
    assert.ok(e.place, 'no place anchor on ' + e.id);
    assert.ok(e.language, 'no language on ' + e.id);
    assert.ok(e.genre, 'no genre on ' + e.id);
    assert.ok(e.source, 'no provenance on ' + e.id);
    assert.match(e.checked || '', /^\d{4}-\d{2}-\d{2}$/, 'no checked date on ' + e.id);
  }
});

test('a live claim always has a stream, a portal always has a page', () => {
  for (const e of MEDIA_CATALOG) {
    if (e.status === 'live') {
      assert.ok(e.url, 'marked live without a stream url: ' + e.id);
      assert.match(e.url, /^https?:\/\//, 'stream url is not http(s): ' + e.id);
    }
    if (e.status === 'portal') {
      assert.ok(e.watch, 'marked portal without a watch page: ' + e.id);
      assert.match(e.watch, /^https?:\/\//, 'watch url is not http(s): ' + e.id);
    }
    assert.ok(e.url || e.watch, 'entry with neither stream nor page: ' + e.id);
  }
});

test('radio stations carry Burmese names — Burmese-first, not English-first', () => {
  const radio = MEDIA_CATALOG.filter((e) => e.kind === 'radio');
  assert.ok(radio.length >= 4, 'expected at least four Burmese radio stations');
  for (const e of radio) {
    assert.ok(e.nameMy && MYANMAR.test(e.nameMy), 'no Burmese name on ' + e.id);
    assert.ok(e.placeMy && MYANMAR.test(e.placeMy), 'no Burmese place on ' + e.id);
  }
});

test('the unreachable list names its hosts — a gap is reported, not hidden', () => {
  assert.ok(UNREACHABLE_ORIGINS.length > 0);
  for (const u of UNREACHABLE_ORIGINS) {
    assert.ok(u.name && u.host, 'unreachable entry missing name or host');
  }
});

// --- the probe function ---

function fakeResponse({ status = 200, ctype = 'audio/mpeg', text = '' } = {}) {
  const enc = new TextEncoder().encode(text);
  return {
    status,
    headers: { get: (k) => (k.toLowerCase() === 'content-type' ? ctype : null) },
    body: {
      getReader() {
        let sent = false;
        return {
          async read() {
            if (sent) return { done: true, value: undefined };
            sent = true;
            return { done: false, value: enc };
          },
          async cancel() {},
        };
      },
    },
  };
}

async function loadFunction(bust) {
  const url = new URL('functions/api/stations.js', root).href + '?bust=' + bust;
  return import(url);
}

test('the probe reports live only when audio bytes actually arrive', async () => {
  const mod = await loadFunction('live');
  const original = globalThis.fetch;
  globalThis.fetch = async () => fakeResponse({ ctype: 'audio/mpeg', text: 'ID3binary' });
  try {
    const res = await mod.onRequestGet();
    const body = await res.json();
    const station = body.radio.find((r) => r.id === 'cherry-fm');
    assert.equal(station.status, 'live');
    assert.equal(station.edgeProbe, 'live');
    assert.equal(body.source, 'measured');
  } finally {
    globalThis.fetch = original;
  }
});

test('a broadcaster page answering with HTML is a working portal, not a dead stream', async () => {
  const mod = await loadFunction('page');
  const original = globalThis.fetch;
  globalThis.fetch = async () => fakeResponse({ ctype: 'text/html', text: '<html><body>Channel K</body></html>' });
  try {
    const res = await mod.onRequestGet();
    const body = await res.json();
    const station = body.tv.find((t) => t.id === 'channelk');
    assert.equal(station.status, 'portal');
    assert.equal(station.edgeProbe, 'portal');
    assert.equal(station.playable, false, 'a portal has no stream to play');
  } finally {
    globalThis.fetch = original;
  }
});

test('the recorded verdict survives an edge probe that could not confirm it', async () => {
  // Cherry FM answers 200 from a home connection and 401 from datacentre
  // ranges. The edge result is reported alongside the recorded truth, not
  // substituted for it — otherwise a working station disappears.
  const mod = await loadFunction('blocked');
  const original = globalThis.fetch;
  globalThis.fetch = async () => fakeResponse({ status: 401, ctype: 'text/plain', text: 'no' });
  try {
    const res = await mod.onRequestGet();
    const body = await res.json();
    const station = body.radio.find((r) => r.id === 'cherry-fm');
    assert.equal(station.status, 'live', 'a refused edge probe must not unlist a live station');
    assert.equal(station.edgeProbe, 'blocked');
    assert.equal(station.playable, true, 'the play button must stay available');
    assert.match(station.note, /home connection/i);
  } finally {
    globalThis.fetch = original;
  }
});

test('an HTML error page on a stream URL is down, not live', async () => {
  const mod = await loadFunction('html');
  const original = globalThis.fetch;
  globalThis.fetch = async () => fakeResponse({ ctype: 'text/html', text: '<html>error</html>' });
  try {
    const res = await mod.onRequestGet();
    const body = await res.json();
    const station = body.radio.find((r) => r.id === 'cherry-fm');
    assert.equal(station.edgeProbe, 'down');
    assert.match(station.edgeDetail, /web page/);
  } finally {
    globalThis.fetch = original;
  }
});

test('no answer at all is recorded as an unreachable edge probe', async () => {
  const mod = await loadFunction('dead');
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };
  try {
    const res = await mod.onRequestGet();
    const body = await res.json();
    const station = body.radio.find((r) => r.id === 'cherry-fm');
    assert.equal(station.edgeProbe, 'unreachable');
    assert.equal(station.status, 'live', 'the recorded verdict still stands');
  } finally {
    globalThis.fetch = original;
  }
});

test('an entry with no recorded verdict is not promoted to live by a failed probe', async () => {
  const mod = await loadFunction('unpromoted');
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };
  try {
    const res = await mod.onRequestGet();
    const body = await res.json();
    const station = body.radio.find((r) => r.id === 'mrtv-radio');
    assert.notEqual(station.status, 'live');
    assert.equal(station.playable, false);
  } finally {
    globalThis.fetch = original;
  }
});

test('when every probe fails, the panel still shows the recorded catalogue', async () => {
  const mod = await loadFunction('fallback');
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('edge network down'); };
  try {
    const res = await mod.onRequestGet();
    const body = await res.json();
    // Nothing may be lost and nothing may be promoted: the recorded status
    // stands, the failed probe is reported, and every date survives.
    assert.equal(body.radio.length, MEDIA_CATALOG.filter((e) => e.kind === 'radio').length);
    assert.equal(body.tv.length, MEDIA_CATALOG.filter((e) => e.kind === 'tv').length);
    assert.ok(body.radio.every((r) => r.checked), 'a station lost its date');
    assert.ok(body.radio.every((r) => r.edgeProbe === 'unreachable'), 'a failed probe was not reported');
    assert.ok(body.radio.every((r) => r.status !== 'live' || r.playable), 'a live claim without a stream');
  } finally {
    globalThis.fetch = original;
  }
});

test('the catalogue is the floor — a wholesale failure falls back to it', async () => {
  const src = fs.readFileSync(new URL('functions/api/stations.js', root), 'utf8');
  assert.match(src, /source: 'catalogue'/, 'no wholesale fallback to the recorded catalogue');
  assert.match(src, /degraded/, 'a wholesale failure is not reported as degraded');
});

// --- the dashboard surface ---

test('the browser never calls a third-party radio index', () => {
  assert.ok(!/de1\.api\.radio-browser\.info/.test(dashboardJs),
    'dashboard still calls radio-browser directly from the visitor');
  assert.ok(!/radio-browser/.test(dashboardJs),
    'dashboard still references radio-browser');
  assert.match(dashboardJs, /\/api\/stations/, 'dashboard does not read our own catalogue endpoint');
});

test('TV cards come from the measured catalogue, not a hardcoded list', () => {
  assert.ok(!/BURMESE_TV_LIVE/.test(dashboardJs), 'hardcoded TV list is still in the dashboard');
  assert.match(dashboardJs, /mediaCatalogue\.tv/, 'TV cards are not built from the measured catalogue');
});

test('the radio player lives inside the media panel', () => {
  assert.ok(!/class="audioplayer"/.test(dashboardHtml), 'the floating audio box is back');
  assert.ok(!/\.audioplayer\b/.test(dashboardCss), 'the floating audio box styles are back');
  assert.match(dashboardHtml, /id="radioList"/, 'no radio list');
  assert.match(dashboardHtml, /id="radioNow"/, 'no now-playing strip');
  assert.match(dashboardHtml, /id="audioEl"/, 'no audio element');
});

test('no note is a doubled string', () => {
  // An edit that appended a new note onto an old one produced text that
  // read twice. A note is a sentence, not a sentence plus itself.
  for (const e of MEDIA_CATALOG) {
    const v = e.note || '';
    if (!v) continue;
    const n = v.length;
    assert.ok(!(n % 2 === 0 && v.slice(0, n / 2) === v.slice(n / 2)),
      'note on ' + e.id + ' is the same sentence twice: ' + v);
  }
});

test('the media panel offers both TV and radio in one place', () => {
  assert.match(dashboardHtml, /data-media-tab="tv"/);
  assert.match(dashboardHtml, /data-media-tab="radio"/);
  assert.match(dashboardHtml, /id="tvPane"/);
  assert.match(dashboardHtml, /id="radioPane"/);
  assert.match(dashboardCss, /\.mediapanel\b/, 'media panel styles missing');
  assert.match(dashboardCss, /\.radio__row\b/, 'radio row styles missing');
});

test('a language switch re-renders the media rows', () => {
  const chromeJs = fs.readFileSync(new URL('web/chrome.js', root), 'utf8');
  assert.match(chromeJs, /pirch:lang/, 'the language switch does not announce itself');
  assert.match(dashboardJs, /addEventListener\('pirch:lang'/, 'the media panel does not re-render on a language switch');
});

test('the design law holds — no radius, no shadow, no gradient', () => {
  const values = (src, prop) =>
    [...src.matchAll(new RegExp(prop + ':\\s*([^;]+);', 'g'))].map((m) => m[1].trim());

  const radii = values(dashboardCss, 'border-radius');
  assert.ok(radii.length > 0, 'no radius declarations found — the law is not being applied');
  for (const v of radii) {
    assert.match(v, /^0(px|%)?(\s*!important)?$/, 'a rounded corner crept in: ' + v);
  }

  const shadows = values(dashboardCss, 'box-shadow');
  for (const v of shadows) {
    assert.match(v, /^none(\s*!important)?$/, 'a drop shadow crept in: ' + v);
  }

  assert.ok(!/linear-gradient|radial-gradient/.test(dashboardCss), 'a gradient crept in');
});
