// Career Navigator regression — the quest player must actually work, and the
// browser and the server must never hold different scenarios.
//
// What this guards:
//   1. The canonical catalogue (functions/data/quest-scenarios.js) has ten
//      complete scenarios with unique ids.
//   2. No scenario ships with an empty Burmese field. Burmese is the primary
//      language; an empty `my` silently falls back to English and turns a
//      Burmese-first product into an English-only one.
//   3. The Burmese text is actually Burmese script, not English pasted into
//      a `my` field.
//   4. There is exactly ONE scenario catalogue. A second copy in web/ is how
//      the browser got 10 quests while the server had 1 — nine of ten
//      quests 404'd on submit.
//   5. The client fetches the catalogue and does not score on its own. A
//      trait verdict is only ever shown when the server returned it.
//   6. The submit endpoint scores against the same canonical catalogue.
//   7. Only one owner for the quest panel. Two scripts toggling #questPanel
//      cancel each other out, so the button appears dead.
//   8. The Atlas diaspora layer is not advertised: no toolbar toggle, no
//      legend dot, no PMTiles source, because there is no archive behind them.
//   9. "Browse without a name" is remembered, so the identity gate does not
//      re-ask on every reload.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('..', import.meta.url);
const catalogue = await import(new URL('functions/data/quest-scenarios.js', root).href);
const { SCENARIOS, TRAITS, TRAIT_LABELS, scoreQuest, dominantOutcome, scenarioById } = catalogue;

const questJs = fs.readFileSync(new URL('web/quest.js', root), 'utf8');
const chatClientJs = fs.readFileSync(new URL('web/chat-client.js', root), 'utf8');
const dashboardJs = fs.readFileSync(new URL('web/dashboard.js', root), 'utf8');
const dashboardHtml = fs.readFileSync(new URL('web/dashboard.html', root), 'utf8');
const dashboardCss = fs.readFileSync(new URL('web/dashboard.css', root), 'utf8');
const submitRoute = fs.readFileSync(new URL('functions/api/quest/[id]/submit.js', root), 'utf8');
const scenariosRoute = fs.readFileSync(new URL('functions/api/quest/scenarios.js', root), 'utf8');

const MYANMAR = /[\u1000-\u109F\uAA60-\uAA7F]/;

function localised(value, where) {
  assert.ok(value, `${where}: missing`);
  assert.equal(typeof value, 'string', `${where}: must be a string`);
  assert.ok(value.trim().length > 0, `${where}: empty`);
}

test('the canonical catalogue holds ten complete scenarios', () => {
  assert.equal(SCENARIOS.length, 10, 'expected ten quest scenarios');
  const ids = SCENARIOS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'scenario ids must be unique');
  for (const id of ids) assert.match(id, /^mm-[a-z-]+$/, `bad scenario id: ${id}`);
});

test('every scenario ships complete Burmese and English copy', () => {
  for (const s of SCENARIOS) {
    localised(s.title.my, `${s.id}.title.my`);
    localised(s.title.en, `${s.id}.title.en`);
    localised(s.premise.my, `${s.id}.premise.my`);
    localised(s.premise.en, `${s.id}.premise.en`);
    localised(s.role.my, `${s.id}.role.my`);
    localised(s.role.en, `${s.id}.role.en`);
    assert.ok(MYANMAR.test(s.title.my), `${s.id}.title.my is not Burmese script`);
    assert.ok(MYANMAR.test(s.premise.my), `${s.id}.premise.my is not Burmese script`);
    assert.ok(MYANMAR.test(s.role.my), `${s.id}.role.my is not Burmese script`);

    assert.ok(Array.isArray(s.constraints.my) && s.constraints.my.length, `${s.id}.constraints.my`);
    assert.ok(Array.isArray(s.constraints.en) && s.constraints.en.length, `${s.id}.constraints.en`);
    assert.equal(s.constraints.my.length, s.constraints.en.length, `${s.id}: constraint count drift`);
    for (const c of s.constraints.my) localised(c, `${s.id}.constraints.my[]`);

    assert.ok(s.choices.length >= 2, `${s.id}: needs at least two choices`);
    for (const c of s.choices) {
      localised(c.label.my, `${s.id}.${c.id}.label.my`);
      localised(c.label.en, `${s.id}.${c.id}.label.en`);
      assert.ok(MYANMAR.test(c.label.my), `${s.id}.${c.id}.label.my is not Burmese script`);
      for (const t of TRAITS) {
        const w = c.tradeoffs[t];
        assert.equal(typeof w, 'number', `${s.id}.${c.id}.tradeoffs.${t} must be a number`);
        assert.ok(w >= -2 && w <= 2, `${s.id}.${c.id}.tradeoffs.${t} out of range`);
      }
    }

    const traits = s.outcomes.map((o) => o.trait);
    assert.deepEqual([...traits].sort(), [...TRAITS].sort(), `${s.id}: one outcome per trait`);
    for (const o of s.outcomes) {
      localised(o.reflection.my, `${s.id}.${o.id}.reflection.my`);
      localised(o.reflection.en, `${s.id}.${o.id}.reflection.en`);
      assert.ok(MYANMAR.test(o.reflection.my), `${s.id}.${o.id}.reflection.my is not Burmese script`);
    }
  }
});

test('the catalogue carries no leftover English in a Burmese field', () => {
  // A stray Latin word in a Burmese string is the fingerprint of a machine
  // draft that was never reviewed. One title shipped as "ဆန်စက်ရုံ ဆုံးဖြ Tasks".
  const strayLatin = /[A-Za-z]{3,}/;
  for (const s of SCENARIOS) {
    for (const c of s.choices) {
      assert.ok(!strayLatin.test(c.label.my), `${s.id}.${c.id}.label.my contains Latin text`);
    }
  }
});

test('there is exactly one scenario catalogue', () => {
  const duplicate = new URL('web/data/quest-scenario.js', root);
  assert.ok(!fs.existsSync(duplicate), 'web/data/quest-scenario.js must not come back');
  // No scenario-shaped data may be hard-coded in the browser bundle.
  assert.ok(!/SCENARIOS\s*[:=]\s*\[/.test(questJs), 'web/quest.js must not inline scenarios');
  assert.ok(!/SCENARIOS\s*[:=]\s*\[/.test(chatClientJs), 'web/chat-client.js must not inline scenarios');
  assert.ok(!/SCENARIOS\s*[:=]\s*\[/.test(dashboardJs), 'web/dashboard.js must not inline scenarios');
});

test('the client fetches the catalogue from the server', () => {
  assert.ok(questJs.includes('/api/quest/scenarios'), 'the client must fetch /api/quest/scenarios');
  assert.ok(scenariosRoute.includes('quest-scenarios.js'), 'the endpoint must serve the canonical file');
  // The client must never score on its own — a local score would drift from
  // the server's and would show a verdict the server never agreed to.
  assert.ok(!/scoreQuest/.test(questJs), 'web/quest.js must not score locally');
  assert.ok(!/dominantOutcome/.test(questJs), 'web/quest.js must not resolve outcomes locally');
});

test('the submit endpoint scores against the canonical catalogue', () => {
  assert.ok(submitRoute.includes('data/quest-scenarios.js'), 'the endpoint must import the canonical file');
  assert.ok(!/SCENARIOS\s*=\s*\[/.test(submitRoute), 'the endpoint must not hold its own list');
});

test('every catalogue scenario can be submitted and scored', () => {
  for (const s of SCENARIOS) {
    for (const c of s.choices) {
      const result = scoreQuest(s, [c.id]);
      assert.equal(result.choice.id, c.id);
      assert.ok(typeof result.dominant === 'string');
      const outcome = dominantOutcome(s, result.dominant);
      assert.ok(outcome && outcome.reflection.my, `${s.id}.${c.id}: no reflection`);
      assert.equal(scenarioById(s.id).id, s.id);
    }
  }
});

test('one panel, one owner — no second quest toggle', () => {
  const questToggles = (chatClientJs.match(/questToggle/g) || []).length;
  // chat-client.js may only reference the quest toggle to close the panel
  // when the peer-exchange panel opens. It must not bind its own click.
  assert.ok(!/quest\.addEventListener/.test(chatClientJs), 'chat-client.js must not bind the quest toggle');
  assert.ok(!/MICRO_QUEST/.test(chatClientJs), 'the old 3-minute micro quest must be gone');
  assert.ok(!/function renderQuest/.test(chatClientJs), 'chat-client.js must not own the quest panel');
  assert.ok(questJs.includes('questToggle'), 'web/quest.js must own the quest toggle');
  assert.ok(dashboardHtml.includes('id="questToggle"'), 'the toggle must exist in the markup');
});

test('the Atlas does not advertise a layer it cannot draw', () => {
  assert.ok(!/data-layer-toggle="diaspora"/.test(dashboardHtml), 'no diaspora toolbar button');
  assert.ok(!/legend__dot--diaspora/.test(dashboardHtml), 'no diaspora legend dot');
  assert.ok(!/legend__dot--diaspora/.test(dashboardCss), 'no diaspora legend style');
  assert.ok(!/diaspora-pmtiles/.test(dashboardJs), 'no diaspora PMTiles source');
  assert.ok(!/pmtiles/i.test(dashboardHtml), 'no PMTiles dependency without an archive');
  assert.ok(!/toggleDiaspora/.test(dashboardJs), 'no diaspora toggle handler');
});

test('the identity gate remembers a browse-without-a-name choice', () => {
  assert.ok(dashboardJs.includes('pirchchat.identitySkipped'), 'the skip must be stored');
  assert.ok(/rememberIdentitySkip\(\)/.test(dashboardJs), 'the skip button must remember');
  assert.ok(/identitySkipped\(\)/.test(dashboardJs), 'the gate must read the stored skip');
});

test('trait labels name a practice, never a person', () => {
  for (const t of TRAITS) {
    localised(TRAIT_LABELS[t].my, `traitLabels.${t}.my`);
    localised(TRAIT_LABELS[t].en, `traitLabels.${t}.en`);
    assert.ok(MYANMAR.test(TRAIT_LABELS[t].my), `traitLabels.${t}.my is not Burmese script`);
  }
});
