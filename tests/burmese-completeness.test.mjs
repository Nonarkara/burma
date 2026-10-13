// Burmese completeness regression — every chrome element with data-en
// must also have a non-empty data-my that contains at least one Burmese
// script character (U+1000–U+109F). This is a guard rail, not a native
// review. Per docs/COMMUNITY-SYSTEM.md and BURMESE-THAILAND-UX-PLAN.md
// a native Burmese reviewer must still sign off on every string before
// treating this as a public Burmese UI.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const webDir = path.resolve('web');
const htmlFiles = ['dashboard.html', 'room.html']
  .map((f) => path.join(webDir, f))
  .filter((p) => fs.existsSync(p));

const ATTR_RE = /\bdata-en="([^"]*)"\s+data-my="([^"]*)"/g;
const BURMESE_RE = /[\u1000-\u109F]/;

// Known untranslated labels: source/model acronyms (NASA, ASEAN, IBM…),
// proper nouns, and other terms that Burmese does not localise. A native
// reviewer can add to this list when a term should be left in English.
const ALLOWLIST = new Set([
  'NASA', 'ASEAN', 'IBM', 'GPS', 'M3', 'HD', 'URL', 'API', 'RSS',
]);

// Strip the leading bullet glyph and check the allowlist. A label whose
// remaining core is an acronym is allowed to have an all-ASCII data-my
// (it stays in English, same as the source name).
function isAllowlisted(en) {
  if (!en) return false;
  const stripped = en.replace(/^[^\w]+/, '').trim();
  return ALLOWLIST.has(stripped);
}

function collectFromFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = [];
  let m;
  while ((m = ATTR_RE.exec(src)) !== null) {
    out.push({ en: m[1], my: m[2], file: path.relative('.', file) });
  }
  ATTR_RE.lastIndex = 0;
  return out;
}

test('every data-en chrome element has a non-empty data-my', () => {
  const all = htmlFiles.flatMap(collectFromFile);
  assert.ok(all.length > 0, 'expected data-en/data-my pairs in chrome HTML');
  const empty = all.filter((p) => !p.my || !p.my.trim());
  assert.deepEqual(
    empty.map((p) => `${p.file}: "${p.en}"`),
    [],
    'data-my must be non-empty for every data-en chrome element',
  );
});

test('every data-my contains at least one Burmese script character', () => {
  const all = htmlFiles.flatMap(collectFromFile);
  const noBurmese = all.filter(
    (p) => p.my && !BURMESE_RE.test(p.my) && !isAllowlisted(p.en),
  );
  assert.deepEqual(
    noBurmese.map((p) => `${p.file}: "${p.en}" → "${p.my}"`),
    [],
    'data-my must include at least one Burmese script character (native review still required)',
  );
});

test('every non-acronym data-my is non-empty (or shares an allowlist term with data-en)', () => {
  const all = htmlFiles.flatMap(collectFromFile);
  const empty = all.filter((p) => !p.my || !p.my.trim());
  assert.deepEqual(
    empty.map((p) => `${p.file}: "${p.en}"`),
    [],
    'data-my must be non-empty for every data-en chrome element',
  );
});

test('data-my and data-en are not identical for non-acronym labels', () => {
  const all = htmlFiles.flatMap(collectFromFile);
  // Strip the leading bullet glyph before checking the allowlist.
  const looksLikeAcronym = (en) => {
    const stripped = en.replace(/^[^\w]+/, '').trim();
    return ALLOWLIST.has(stripped);
  };
  const missing = all.filter(
    (p) => p.en && p.en === p.my && !looksLikeAcronym(p.en),
  );
  assert.deepEqual(
    missing.map((p) => `${p.file}: "${p.en}"`),
    [],
    'data-my and data-en are identical for a non-acronym — translation appears to be missing',
  );
});

test('en-my pair count is plausible (sanity bound)', () => {
  const all = htmlFiles.flatMap(collectFromFile);
  assert.ok(
    all.length >= 30,
    `expected at least 30 en-my pairs across chrome, found ${all.length}`,
  );
});
