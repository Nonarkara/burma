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

const POWER_AT_THE_MONASTERY = {
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
};

const RICE_MILL_DECISION = {
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
};

const MONASTIC_TECH_BRIDGE = {
  id: 'mm-monastic-tech-bridge',
  version: 1,
  locale: 'my',
  title: { my: 'ဘုန်းတော်ကြီးကျောင်း နည်းပညာ တံတား', en: 'The Monastery Tech Bridge' },
  role: { my: '', en: 'You help a monk teach novices basic computer skills.' },
  premise: { my: '', en: 'A monk wants to teach novices basic computer skills using only one donated laptop and intermittent Wi-Fi. You design a 12-week plan.' },
  constraints: { my: [], en: ['One laptop shared by 12 novices', 'Wi-Fi works 2 hours per day', 'Timeline: 12 weeks'] },
  choices: [
    { id: 'a-rotating', label: { my: '', en: 'Rotating schedule — each novice gets 30 minutes per day' }, tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 0 } },
    { id: 'b-projects', label: { my: '', en: 'Project-based — novices work in pairs on one shared task per week' }, tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 1, collaboration: 2 } },
    { id: 'c-offline', label: { my: '', en: 'Offline-first — pre-download lessons, use Wi-Fi only for uploads' }, tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: 0 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You plan around the constraint of intermittent Wi-Fi.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You make sure every novice gets hands-on time.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You stick with the problem despite limited resources.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You have novices learn together instead of alone.' } },
  ],
  estimatedMinutes: 4,
  tags: ['education', 'technology', 'rural', 'systems'],
};

const BORDER_ROUTE = {
  id: 'mm-border-route',
  version: 1,
  locale: 'my',
  title: { my: 'နယ်စပ် ခရီးသွား လမ်းကြောင်း', en: 'The Border Route' },
  role: { my: '', en: 'You advise a young person recruited by a broker for work across the border.' },
  premise: { my: '', en: 'A young person is being recruited by a broker for work across the border. The player must weigh: legitimate channels, costs, and family pressure.' },
  constraints: { my: [], en: ['Timeline: decision needed in 2 weeks', 'Budget: family can cover partial costs', 'People: the youth, parents, one aunt in Thailand'] },
  choices: [
    { id: 'a-legitimate', label: { my: '', en: 'Use legal channels — higher cost, slower, safer' }, tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 1, collaboration: 1 } },
    { id: 'b-broker', label: { my: '', en: 'Use the broker — faster, cheaper, higher risk' }, tradeoffs: { systems_thinking: 0, empathy: -1, analytical_grit: -1, collaboration: 0 } },
    { id: 'c-wait', label: { my: '', en: 'Wait and save more — delays work, reduces risk' }, tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 0, collaboration: 0 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You compare cost, speed, and risk across options.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You consider the familys anxiety and the youths safety.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You stay with a difficult decision without rushing.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You involve the family and the aunt in Thailand.' } },
  ],
  estimatedMinutes: 4,
  tags: ['migration', 'border', 'safety', 'decision'],
};

const COOPERATIVE_SPLIT = {
  id: 'mm-cooperative-split',
  version: 1,
  locale: 'my',
  title: { my: 'ပူးသင်းအဖွဲ့ ကွဲထွက်ခြင်း', en: 'The Cooperative Split' },
  role: { my: '', en: 'You mediate a weaving cooperative splitting over a wholesale contract.' },
  premise: { my: '', en: 'A weaving cooperative is splitting over a wholesale contract. The player must mediate between the elder weavers and the younger members.' },
  constraints: { my: [], en: ['Timeline: contract decision in 1 month', 'Budget: cooperative funds only', 'People: 8 elder weavers, 6 younger members'] },
  choices: [
    { id: 'a-sign', label: { my: '', en: 'Sign the wholesale contract — steady income, less creative control' }, tradeoffs: { systems_thinking: 0, empathy: 1, analytical_grit: 0, collaboration: 1 } },
    { id: 'b-split', label: { my: '', en: 'Split the cooperative — each group sets its own terms' }, tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: -1 } },
    { id: 'c-negotiate', label: { my: '', en: 'Renegotiate — better terms but risks losing the buyer' }, tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 1, collaboration: 2 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You model how the contract affects every member.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You listen to both elders and younger members.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You stay with a tense mediation until it resolves.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You build a solution the whole cooperative can accept.' } },
  ],
  estimatedMinutes: 5,
  tags: ['cooperative', 'crafts', 'mediation', 'business'],
};

const DIGITAL_ARTISAN = {
  id: 'mm-digital-artisan',
  version: 1,
  locale: 'my',
  title: { my: 'ဒီဂျစ်တယ် လက်မှုပညာရှင်', en: 'The Digital Artisan' },
  role: { my: '', en: 'You help a lacquerware maker sell online without photography skills.' },
  premise: { my: '', en: 'A traditional lacquerware maker can sell online but cannot photograph her own work. The player designs a low-cost digital sales workflow.' },
  constraints: { my: [], en: ['Budget: under $50', 'Timeline: launch in 4 weeks', 'Tools: one smartphone, no camera'] },
  choices: [
    { id: 'a-smartphone', label: { my: '', en: 'Learn smartphone photography — free, takes time to learn' }, tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 1, collaboration: 0 } },
    { id: 'b-partner', label: { my: '', en: 'Partner with a student photographer — credit shared, cost split' }, tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 2 } },
    { id: 'c-text-only', label: { my: '', en: 'Text-only listings — no photos, trust-based sales' }, tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 0, collaboration: -1 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You design a workflow that fits the available tools.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You consider the artisans comfort with technology.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You keep trying until the online shop works.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You bring in a partner instead of working alone.' } },
  ],
  estimatedMinutes: 4,
  tags: ['crafts', 'e-commerce', 'digital-skills', 'collaboration'],
};

const FLOOD_RESPONSE = {
  id: 'mm-flood-response',
  version: 1,
  locale: 'my',
  title: { my: 'ရေကြီးခြင်း တုံ့ပြန်ရေး', en: 'The Flood Response' },
  role: { my: '', en: 'You coordinate flood response in a township with limited official support.' },
  premise: { my: '', en: 'A township faces seasonal flooding. The player coordinates evacuation, livestock, and school continuity with limited official support.' },
  constraints: { my: [], en: ['Timeline: flood crest in 72 hours', 'Budget: community donations only', 'People: township committee, 3 volunteers, 40 households'] },
  choices: [
    { id: 'a-evacuate', label: { my: '', en: 'Prioritize evacuation — save people, leave property behind' }, tradeoffs: { systems_thinking: 0, empathy: 2, analytical_grit: 0, collaboration: 1 } },
    { id: 'b-protect', label: { my: '', en: 'Protect livestock and property — slower evacuation, fewer losses' }, tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: 0 } },
    { id: 'b-school', label: { my: '', en: 'Keep school running — use it as shelter, classes paused' }, tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 2 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You coordinate evacuation, livestock, and school together.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You put peoples safety above property.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You keep coordinating through the crisis.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You mobilize the whole township committee.' } },
  ],
  estimatedMinutes: 4,
  tags: ['flood', 'emergency', 'community', 'crisis'],
};

const APPRENTICE_NEGOTIATION = {
  id: 'mm-apprentice-negotiation',
  version: 1,
  locale: 'my',
  title: { my: 'အလုပ်သင် ညှိနှိုင်းခြင်း', en: 'The Apprentice Negotiation' },
  role: { my: '', en: 'You negotiate apprenticeship terms with a motorcycle mechanic.' },
  premise: { my: '', en: 'A motorcycle mechanic offers an apprenticeship but expects unpaid labor for six months. The player negotiates terms with the family.' },
  constraints: { my: [], en: ['Timeline: answer needed this week', 'Budget: family can cover small costs', 'People: you, the mechanic, your parents'] },
  choices: [
    { id: 'a-accept', label: { my: '', en: 'Accept unpaid apprenticeship — learn skills, no income for 6 months' }, tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: -1, collaboration: 0 } },
    { id: 'b-negotiate', label: { my: '', en: 'Negotiate partial pay — modest stipend, shorter unpaid period' }, tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 1, collaboration: 1 } },
    { id: 'c-decline', label: { my: '', en: 'Decline — find paid work instead, lose the apprenticeship' }, tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: -1 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You compare long-term skill gain against short-term income.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You consider your familys financial situation.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You negotiate firmly for fair terms.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You negotiate with the mechanic rather than accepting or rejecting.' } },
  ],
  estimatedMinutes: 4,
  tags: ['apprenticeship', 'labor', 'negotiation', 'skills'],
};

const LANGUAGE_BARRIER = {
  id: 'mm-language-barrier',
  version: 1,
  locale: 'my',
  title: { my: 'ဘာသာစကား အတားအဆီး', en: 'The Language Barrier' },
  role: { my: '', en: 'You plan language + work for a Burmese youth in Chiang Mai with a Thai job offer.' },
  premise: { my: '', en: 'A Burmese youth in Chiang Mai gets a job offer at a Thai company but does not speak Thai. The player plans a 90-day language + work plan.' },
  constraints: { my: [], en: ['Timeline: 90 days before start date', 'Budget: limited savings for classes', 'Tools: smartphone, free community resources'] },
  choices: [
    { id: 'a-classes', label: { my: '', en: 'Enroll in Thai language classes — structured, costs money' }, tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 1, collaboration: 0 } },
    { id: 'b-self-study', label: { my: '', en: 'Self-study with apps — free, slower progress' }, tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: 0 } },
    { id: 'c-community', label: { my: '', en: 'Learn from Burmese-Thai community — free, informal, variable quality' }, tradeoffs: { systems_thinking: 0, empathy: 1, analytical_grit: 0, collaboration: 2 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You plan 90 days of language and work steps.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You consider the youths comfort and confidence.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You commit to daily language practice.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You learn with the community instead of alone.' } },
  ],
  estimatedMinutes: 4,
  tags: ['language', 'migration', 'work', 'skills'],
};

const SCHOLARSHIP_TRADE_OFF = {
  id: 'mm-scholarship-trade-off',
  version: 1,
  locale: 'my',
  title: { my: 'ပညာသင်ဆု ရွေးချယ်ခြင်း', en: 'The Scholarship Trade-off' },
  role: { my: '', en: 'You choose between two scholarship offers.' },
  premise: { my: '', en: 'Two scholarship offers arrive: one prestigious abroad with long family separation, one local with lower pay but you can stay home.' },
  constraints: { my: [], en: ['Timeline: decision needed in 2 weeks', 'Budget: scholarship covers tuition either way', 'People: you, parents, younger sibling'] },
  choices: [
    { id: 'a-abroad', label: { my: '', en: 'Prestigious abroad scholarship — better credential, long separation' }, tradeoffs: { systems_thinking: 1, empathy: -1, analytical_grit: 1, collaboration: 0 } },
    { id: 'b-local', label: { my: '', en: 'Local scholarship — stay home, lower stipend, family together' }, tradeoffs: { systems_thinking: 0, empathy: 2, analytical_grit: 0, collaboration: 1 } },
  ],
  outcomes: [
    { id: 'o-systems', trait: 'systems_thinking', reflection: { my: '', en: 'You weigh credential value against family separation.' } },
    { id: 'o-empathy', trait: 'empathy', reflection: { my: '', en: 'You put family closeness first.' } },
    { id: 'o-grit', trait: 'analytical_grit', reflection: { my: '', en: 'You accept hardship for a longer-term goal.' } },
    { id: 'o-collab', trait: 'collaboration', reflection: { my: '', en: 'You decide with your family, not alone.' } },
  ],
  estimatedMinutes: 4,
  tags: ['scholarship', 'education', 'family', 'decision'],
};

const SCENARIOS = [POWER_AT_THE_MONASTERY, RICE_MILL_DECISION, MONASTIC_TECH_BRIDGE, BORDER_ROUTE, COOPERATIVE_SPLIT, DIGITAL_ARTISAN, FLOOD_RESPONSE, APPRENTICE_NEGOTIATION, LANGUAGE_BARRIER, SCHOLARSHIP_TRADE_OFF];

window.PirchQuest = {
  SCENARIOS: SCENARIOS,
  scenarioById: function (id) { return SCENARIOS.find((s) => s.id === id); },
  TRAITS: TRADEOFF_KEYS,
  scoreQuest,
  dominantOutcome,
};

})();
