const fs = require('fs');
let s = fs.readFileSync('web/data/quest-scenario.js', 'utf8');

// Find RICE_MILL_DECISION block and replace with clean version
const start = s.indexOf('const RICE_MILL_DECISION = {');
const end = s.indexOf('};', start) + 2;
const cleanBlock = `const RICE_MILL_DECISION = {
  id: 'mm-rice-mill-decision',
  version: 1,
  locale: 'my',
  title: { my: 'ဆန်စက်ရုံ ဆုံးဖြ Tasks', en: 'The Rice Mill Decision' },
  role: { my: '', en: "You run your family's rice mill." },
  premise: { my: '', en: 'The family rice mill is losing money. Electricity and fuel costs are rising, and paddy prices are falling. You must choose: pivot to organic rice, hold the current price, or close the mill and migrate for work.' },
  constraints: { my: [], en: ['Budget: limited family savings', 'Timeline: 6 months before the next harvest', 'People: you, your parents, two siblings'] },
  choices: [
    { id: 'a-organic', label: { my: '', en: 'Pivot to organic rice — higher price, higher cost, longer certification' }, tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: 0 } },
    { id: 'b-hold-price', label: { my: '', en: 'Hold the current price — lose money per sack, keep customers' }, tradeoffs: { systems_thinking: 0, empathy: 1, analytical_grit: 0, collaboration: 0 } },
    { id: 'c-close-and-migrate', label: { my: '', en: 'Close the mill — migrate to Thailand for factory work' }, tradeoffs: { systems_thinking: 0, empathy: -1, analytical_grit: 0, collaboration: 1 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You model costs and revenues before deciding.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You weigh your familys needs alongside your own.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You stay with a hard financial problem instead of looking away.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You bring in the family and the mill workers together.' } },
  ],
  estimatedMinutes: 5,
  tags: ['agriculture', 'small-business', 'migration', 'systems'],
};`;

s = s.slice(0, start) + cleanBlock + s.slice(end);
fs.writeFileSync('web/data/quest-scenario.js', s);
console.log('Replaced RICE_MILL_DECISION block');
