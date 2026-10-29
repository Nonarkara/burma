import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../web/survival.js', import.meta.url), 'utf8'), context);
const check = context.window.PirchSurvival.checkCrisis;
test('ordinary commerce and English substrings do not trigger crisis referrals', () => {
  for (const text of ['grape juice', 'scraped news feeds', 'drapes for a shared room', 'grapefruit', 'ကုန်ကူးလုပ်ငန်း']) {
    assert.equal(check(text), false, text);
  }
});
test('explicit harm and human trafficking still offer human referrals', () => {
  for (const text of ['rape', 'RAPED', 'rapist', 'human trafficking', 'trafficked', 'လူကုန်ကူး', 'suicide', 'kill myself', 'self-harm', 'deportation', 'abuse', 'exploitation', 'ฆ่าตัวตาย', 'မုဒိမ်း']) {
    assert.equal(check(text), true, text);
  }
});
