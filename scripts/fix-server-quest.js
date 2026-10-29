const fs = require('fs');
let s = fs.readFileSync('functions/data/quest-scenarios.js', 'utf8');
// Replace lines 19-20 (the garbled grit and collab reflections)
s = s.replace(
  /      \{ id: 'o-grit', trait: 'analytical_grit', reflection: \{ my: '[^']*', en: 'You do not abandon[^}]*\} \},\n      \{ id: 'o-collab', trait: 'collaboration', reflection: \{ my: '[^']*', en: 'You build on others[^}]*\} \},/,
  "      { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You do not abandon a hard problem. You wait for the right time and the right conditions.' } },\n      { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You build on others. You do not solve alone — you bring in the village headman.' } },"
);
fs.writeFileSync('functions/data/quest-scenarios.js', s);
console.log('Fixed');
