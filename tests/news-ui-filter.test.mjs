import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual dashboard predicate while leaving DOM startup dormant.
const source = fs.readFileSync('web/dashboard.js', 'utf8')
  .replace(/\}\)\(\);\s*$/, 'window.testApi={matchesNewsFilter};})();');
const context = { window: {}, document: { addEventListener() {} }, console };
vm.runInNewContext(source, context);
const matches = context.window.testApi.matchesNewsFilter;

test('Jobs/Visa accepts rights and learning regardless of the geographic region', () => {
  assert.equal(matches({ region: 'diaspora', topics: ['rights'] }, 'visa-jobs'), true);
  assert.equal(matches({ region: 'mm', topics: ['learning'] }, 'visa-jobs'), true);
  assert.equal(matches({ region: 'mm', topics: ['live'] }, 'visa-jobs'), false);
});

test('geographic news filters remain independent of topic filters', () => {
  assert.equal(matches({ region: 'diaspora', topics: ['employment'] }, 'mm'), false);
  assert.equal(matches({ region: 'diaspora', topics: ['rights'] }, 'diaspora'), true);
  assert.equal(matches({ region: 'world', topics: [] }, 'all'), true);
});
