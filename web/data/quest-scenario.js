(function () {
'use strict';

const TRADEOFF_KEYS = [
  'systems_thinking',
  'empathy',
  'analytical_grit',
  'collaboration',
];

function defaultWeights() {
  const w = {};
  for (const k of TRADEOFF_KEYS) w[k] = 0;
  return w;
}

function scoreQuest(quest, selectionPath) {
  const weights = defaultWeights();
  const finalChoiceId = selectionPath[selectionPath.length - 1];
  const choice = quest.choices.find((c) => c.id === finalChoiceId);
  if (choice && choice.tradeoffs) {
    for (const k of TRADEOFF_KEYS) {
      weights[k] += (choice.tradeoffs[k] || 0);
    }
  }
  let dominant = TRADEOFF_KEYS[0];
  for (const k of TRADEOFF_KEYS) {
    if (weights[k] > weights[dominant]) dominant = k;
  }
  return { weights, dominant, choice };
}

function dominantOutcome(quest, dominantTrait) {
  return quest.outcomes.find((o) => o.trait === dominantTrait) || quest.outcomes[0];
}

export const POWER_AT_THE_MONASTERY: Quest = {
  id: 'mm-power-at-the-monastery',
  version: 1,
  locale: 'my',
  title: {
    my: 'ဘုန်းတော်ကြီးကျောင်းရှိ မီးစက်',
    en: 'Power at the Monastery',
  },
  role: {
    my: 'သင်သည် ရွာငယ်လေးတစ်ရွာရှိ ဘုန်းတော်ကြီးကျောင်း၏ လျှပ်စစ်စနစ်ကို စီမံရသော ကျောင်းထိန်းတစ်ယောက်ဖြစ်သည်။',
    en: 'You are the steward of the electrical system at a small village monastery.',
  },
  premise: {
    my: 'ရွာဘုန်းတော်ကြီးကျောင်းတွင် လျှပ်စစ်မီး မရရှိခြင်း သို့မဟုတ် မတည်ငြိမ်ခြင်းများ ရှိနေသည်။ ညဉ့်သုံးချက်တလင်းနှင့် ဖုန်းအားသွင်းစခန်း ရှိသော်လည်း လျှပ်စစ်မီး ပုံမှန်မရှိပါ။ ဘုန်းတော်ကြီးက သင့်ကို ရင်းနှီးမြှုပ်နှံမှု အစီအစဉ်တစ်ခု ရေးဆွဲရန် မှာထားသည်။',
    en: 'The village monastery has unreliable electricity. There is a small scripture-reading room and a phone-charging station for villagers, but power is inconsistent. The head monk has asked you to plan a modest upgrade.',
  },
  constraints: {
    my: [
      'ဘတ်ဂျတ် - ကျပ် ၈ သိန်း (ခန့်) — နေရောင်ခံအင်ဗာတာနှင့် ဘက်ထရီ',
    'or ထိန်းသိမ်းမှုအတွက် ထပ်ဆောင်းအကြံပြုချက်',
      'ဆယ်ကြိမ် - သုံးလ — အခြေခံမိုးလွန်ကာလ (မိုးတွင် နေရောင်ခံ ထိရောက်မှု နည်းသည်)',
      'အသုံးပြုသူ - သံဃာ ၁၅ ပါး၊ ကျောင်းသား ၄၀ ခန့်၊ ရွာသူရွာသား ၂၀၀ ခန့် (ဖုန်းအားသွင်း)',
    ],
    en: [
      'Budget: ~800,000 MMK — covers inverter + battery + solar panels',
    'or follow-up maintenance advice',
      'Timeline: 3 months — monsoon season overlap (solar yield drops ~40%)',
      'Users: ~15 monks, ~40 students, ~200 villagers (phone charging)',
    ],
  },
  choices: [
    {
      id: 'a-equal-shares',
      label: {
        my: 'နေရောင်ခံအင်ဗာတာ နှင့် ဘက်ထရီ ကို တန်းတူ ခွဲဝေပါ။ ညဉ့်သုံးချက်တလင်း ညဉ့် ၆ နာရီ၊ ဖုန်းအားသွင်းစခန်း ၄ နာရီ ထားပါ။',
        en: 'Equal split: 6 hours of evening study hall, 4 hours of phone-charging station.',
      },
      tradeoffs: {
        systems_thinking: 1,
        empathy: 1,
        analytical_grit: 0,
        collaboration: 1,
      },
    },
    {
      id: 'b-prioritize-students',
      label: {
        my: 'ကျောင်းသားများ အတွက် ပိုမိုများပြားစွာ ထားပါ — ညဉ့်သုံးချက်တလင်း ၈ နာရီ၊ ဖုန်းအားသွင်း ၂ နာရီ။ မိုးရာသီ၌ ဖုန်းအားသွင်း ပိတ်ထားပါ။',
        en: 'Prioritize students: 8 hours study hall, 2 hours phone charging. Cut phone charging entirely during monsoon.',
      },
      tradeoffs: {
        systems_thinking: 0,
        empathy: -1,
        analytical_grit: 1,
        collaboration: 0,
      },
    },
    {
      id: 'c-share-with-school',
      label: {
        my: 'ရွာအုပ်ချုပ်ရေးမှူး နှင့် ညှိနှိုင်းပါ — စာသင်ကျောင်းနှင့် ဘုန်းတော်ကြီးကျောင်း မျှဝေသုံးစွဲရန် စီစဉ်ပါ။',
        en: 'Negotiate with the village headman to share with the public school.',
      },
      tradeoffs: {
        systems_thinking: 1,
        empathy: 1,
        analytical_grit: 0,
        collaboration: 2,
      },
    },
    {
      id: 'd-defer-all',
      label: {
        my: 'ဘတ်ဂျတ် မလုံလောက်သေးဟု ဆိုကာ ရင်းနှီးမြှုပ်နှံမှု ရွှေ့ဆိုင်းပါ။ ဆယ်ကြိမ် ပိုရှည်သော အစီအစဉ် ရှာပါ။',
        en: 'Defer the upgrade — budget is too tight. Look for a longer timeline or outside funding.',
      },
      tradeoffs: {
        systems_thinking: 0,
        empathy: 0,
        analytical_grit: 1,
        collaboration: -1,
      },
    },
  ],
  outcomes: [
    {
      id: 'o-systems',
      trait: 'systems_thinking',
      reflection: {
        my: 'သင်သည် တစ်စိတ်တစ်ပိုင်းကို ကြည့်ပြီး တစ်ခုလုံးကို တွေးတတ်သည်။ ဘက်ထရီကုန်ခြင်း၊ မိုးရာသီအကျိုးသက်ရောက်မှုများကို ကြိုတွေ့သည်။',
        en: 'You see the parts and the whole at the same time. You anticipate battery drain and monsoon drop-off.',
      },
    },
    {
      id: 'o-empathy',
      trait: 'empathy',
      reflection: {
        my: 'သင်သည် မပြောသောသူများ၏ လိုအပ်ချက်ကို ကြားတတ်သည်။ ရွာသူရွာသား ဖုန်းအားသွင်း လိုအပ်ချက်ကို မမေ့ပါ။',
        en: 'You hear the people who do not speak first. You do not forget the villagers who need a charged phone.',
      },
    },
    {
      id: 'o-grit',
      trait: 'analytical_grit',
      reflection: {
        my: 'သင်သည် မဖြေရှင်းနိုင်သော ပြဿနာကို မပစ်ပယ်ပါ။ မှန်ကန်သော အချိန်ကို စောင့်တတ်သည်။',
        en: 'You do not abandon a hard problem. You wait for the right time and the right conditions.',
      },
    },
    {
      id: 'o-collab',
      trait: 'collaboration',
      reflection: {
        my: 'သင်သည် အခြားသူများနှင့် အတူတကွ တွေးတတ်သည်။ တစ်ဦးတည်း မဖြေရှင်းဘဲ ရွာအုပ်ချုပ်ရေးမှူးကို ပူးပေါင်းသည်။',
        en: 'You build on others. You do not solve alone — you bring in the village headman.',
      },
    },
  ],
  estimatedMinutes: 4,
  tags: ['energy', 'rural-electrification', 'community', 'systems'],

window.PirchQuest = {
  SCENARIO: POWER_AT_THE_MONASTERY,
  TRAITS: TRADEOFF_KEYS,
  scoreQuest,
  dominantOutcome,
};

})();
