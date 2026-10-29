// Canonical quest scenario data — shared between client and server.
// Server-side copy for scoring submissions. Client copy lives in
// web/data/quest-scenario.js; both should stay in sync.

export const SCENARIOS = [
  {
    id: 'mm-power-at-the-monastery',
    version: 1,
    title: { my: 'ဘုန်းတော်ကြီးကျောင်းရှိ မီးစက်', en: 'Power at the Monastery' },
    choices: [
      { id: 'a-equal-shares', tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 1 } },
      { id: 'b-prioritize-students', tradeoffs: { systems_thinking: 0, empathy: -1, analytical_grit: 1, collaboration: 0 } },
      { id: 'c-share-with-school', tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 2 } },
      { id: 'd-defer-all', tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 1, collaboration: -1 } },
    ],
    outcomes: [
      { id: 'o-systems', trait: 'systems_thinking', reflection: { my: 'သင်သည် တစ်စိတ်တစ်ပိုင်းကို ကြည့်ပြီး တစ်ခုလုံးကို တွေးတတ်သည်။ ဘက်ထရီကုန်ခြင်း၊ မိုးရာသီအကျိုးသက်ရောက်မှုများကို ကြိုတွေ့သည်။', en: 'You see the parts and the whole at the same time. You anticipate battery drain and monsoon drop-off.' } },
      { id: 'o-empathy', trait: 'empathy', reflection: { my: 'သင်သည် မပြောသောသူများ၏ လိုအပ်ချက်ကို ကြားတတ်သည်။ ရွာသူရွာသား ဖုန်းအားသွင်း လိုအပ်ချက်ကို မမေ့ပါ။', en: 'You hear the people who do not speak first. You do not forget the villagers who need a charged phone.' } },
      { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You do not abandon a hard problem. You wait for the right time and the right conditions.' } },
      { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You build on others. You do not solve alone — you bring in the village headman.' } },
    ],
  },
];

export const TRAITS = ['systems_thinking', 'empathy', 'analytical_grit', 'collaboration'];

export function scoreQuest(quest, selectionPath) {
  const weights = { systems_thinking: 0, empathy: 0, analytical_grit: 0, collaboration: 0 };
  const finalChoiceId = selectionPath[selectionPath.length - 1];
  const choice = quest.choices.find((c) => c.id === finalChoiceId);
  if (choice && choice.tradeoffs) {
    for (const k of TRAITS) weights[k] += (choice.tradeoffs[k] || 0);
  }
  let dominant = TRAITS[0];
  for (const k of TRAITS) if (weights[k] > weights[dominant]) dominant = k;
  return { weights, dominant, choice };
}

export function dominantOutcome(quest, dominantTrait) {
  return quest.outcomes.find((o) => o.trait === dominantTrait) || quest.outcomes[0];
}

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id);
}
