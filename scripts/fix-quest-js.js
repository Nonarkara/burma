const fs = require('fs');
let s = fs.readFileSync('web/data/quest-scenario.js', 'utf8');

// Fix garbled role.my
s = s.replace(/my: '[\u1000-\u109F�][^']*'/, "my: ''");
// Fix garbled premise.my
s = s.replace(/my: '[\u1000-\u109F�][^']*'\n    en: 'The family rice mill/, "my: '',\n    en: 'The family rice mill");
// Fix garbled constraints.my
s = s.replace(/my: \[[\s\S]*?\],\n    en: \[/, 'my: [],\n    en: [');
// Fix garbled choice labels.my
s = s.replace(/label: \{ my: '[^']*', en:/g, "label: { my: '', en:");
// Fix garbled outcome reflections.my
s = s.replace(/reflection: \{ my: '[^']*', en:/g, "reflection: { my: '', en:");

fs.writeFileSync('web/data/quest-scenario.js', s);
console.log('Fixed');
