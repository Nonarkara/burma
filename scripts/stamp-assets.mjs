// Stamp local script/style references with a content hash.
//
// Why this exists: Cloudflare Pages forces `Cache-Control: max-age=14400` on
// static assets and ignores `_headers` for it, and these files have plain
// names with no content hash to bust a cache. The project already used
// hand-written `?v=` stamps, and on 2026-10-29 a deploy shipped to the edge
// while a browser kept running the previous `dashboard.js`, because nobody
// bumped the stamp. A stamp that can be forgotten is not a stamp.
//
// Run before every Pages deploy: node scripts/stamp-assets.mjs
// Deterministic: the same file content produces the same query, so an
// unchanged asset leaves the HTML untouched.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const webDir = path.resolve('web');
const htmlFiles = fs.readdirSync(webDir).filter((f) => f.endsWith('.html'));

const REF_RE = /((?:href|src)=")((?![a-z]+:|\/\/)[^"?#]+\.(?:js|css))(?:\?v=[^"]*)?"/gi;

function hashOf(file) {
  const buf = fs.readFileSync(file);
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
}

let changed = 0;
let missing = 0;

for (const html of htmlFiles) {
  const file = path.join(webDir, html);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(REF_RE, (match, attr, ref) => {
    const asset = path.join(webDir, ref.replace(/^\//, ''));
    if (!fs.existsSync(asset)) {
      missing++;
      console.warn(`  ! ${html}: ${ref} not found — left unstamped`);
      return match;
    }
    const stamped = `${attr}${ref}?v=${hashOf(asset)}"`;
    if (stamped !== match) changed++;
    return stamped;
  });
  if (after !== before) fs.writeFileSync(file, after);
}

console.log(`stamp-assets: ${changed} reference(s) updated across ${htmlFiles.length} page(s)` +
  (missing ? `, ${missing} missing` : ''));
