import type { Quest } from './types';

/**
 * Sample Myanmar-grounded scenarios.
 *
 * CULTURAL NOTE: These need a Burmese-native review before publication.
 * Names, monastery hierarchy, township references, and idiom choices should
 * be checked by Si Thu Maung's team + at least one Burmese-speaking youth
 * reviewer under 25.
 *
 * Scenario 1 ("Power at the Monastery") is drafted as the working sample.
 * Scenarios 2-10 are title + premise stubs to be authored after the
 * Burmese-native review cycle.
 */

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
};

// Additional scenarios — title + premise stubs only.
// Author full Burmese text after cultural review.

export const SCENARIO_STUBS = [
  {
    id: 'mm-rice-mill-decision',
    title: { my: 'ဆန်စက်ရုံ ဆုံးဖြတ်ချက်', en: 'The Rice Mill Decision' },
    premise_short: 'A family rice mill is losing money. The player must decide: pivot to organic, hold price, or close the mill and migrate for work.',
  },
  {
    id: 'mm-monastic-tech-bridge',
    title: { my: 'ဘုန်းတော်ကြီးကျောင်း နည်းပညာ တံတား', en: 'The Monastery Tech Bridge' },
    premise_short: 'A monk wants to teach novices basic computer skills. The player designs a 12-week plan using only a donated laptop and intermittent Wi-Fi.',
  },
  {
    id: 'mm-border-route',
    title: { my: 'နယ်စပ် ခရီးသွား လမ်းကြောင်း', en: 'The Border Route' },
    premise_short: 'A young person is being recruited by a broker for work across the border. The player must weigh: legitimate channels, costs, and family pressure.',
  },
  {
    id: 'mm-cooperative-split',
    title: { my: 'ပူးသင်းအဖွဲ့ ကွဲထွက်ခြင်း', en: 'The Cooperative Split' },
    premise_short: 'A weaving cooperative is splitting over a wholesale contract. The player must mediate between the elder weavers and the younger members.',
  },
  {
    id: 'mm-digital-artisan',
    title: { my: 'ဒီဂျစ်တယ် လက်မှုပညာရှင်', en: 'The Digital Artisan' },
    premise_short: 'A traditional lacquerware maker can sell online but cannot photograph her own work. The player designs a low-cost digital sales workflow.',
  },
  {
    id: 'mm-flood-response',
    title: { my: 'ရေကြီးခြင်း တုံ့ပြန်ရေး', en: 'The Flood Response' },
    premise_short: 'A township faces seasonal flooding. The player coordinates evacuation, livestock, and school continuity with limited official support.',
  },
  {
    id: 'mm-apprentice-negotiation',
    title: { my: 'အလုပ်သင် ညှိနှိုင်းခြင်း', en: 'The Apprentice Negotiation' },
    premise_short: 'A motorcycle mechanic offers an apprenticeship but expects unpaid labor for six months. The player negotiates terms with the family.',
  },
  {
    id: 'mm-language-barrier',
    title: { my: 'ဘာသာစကား အတားအဆီး', en: 'The Language Barrier' },
    premise_short: 'A Burmese youth in Chiang Mai gets a job offer at a Thai company but does not speak Thai. The player plans a 90-day language + work plan.',
  },
  {
    id: 'mm-scholarship-trade-off',
    title: { my: 'ပညာသင်ဆု ရွေးချယ်ခြင်း', en: 'The Scholarship Trade-off' },
    premise_short: 'Two scholarship offers arrive: one prestigious abroad with a long family separation, one local with lower pay but the player can stay home.',
  },
];

export const SAMPLE_SCENARIOS = [POWER_AT_THE_MONASTERY];