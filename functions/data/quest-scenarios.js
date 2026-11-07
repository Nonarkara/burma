// Canonical quest scenario data — the single source of truth.
//
// The Pages Function at /api/quest/scenarios serves these to the client and
// /api/quest/<id>/submit scores against these. There is no second copy in
// web/ — a client-side duplicate is how the server and the browser drifted
// apart before (10 quests in the browser, 1 on the server).
//
// Burmese (my) is the primary text. English (en) is the secondary toggle.
// No field may ship with an empty `my` — tests/quest.test.mjs fails the build
// if one does. Burmese copy is machine-drafted and still needs native review
// (docs/REVIEW-PACKET.md).
//
// No PII. No third-party calls. Pure scenario text and fixed trade-off
// weights.

export const TRAITS = ['systems_thinking', 'empathy', 'analytical_grit', 'collaboration'];

// Human labels for the trait signals. These name a practice, never a
// personality — "discovery, not diagnosis" (AGENTS.md §1.4).
export const TRAIT_LABELS = {
  systems_thinking: { my: 'အလုပ်စဉ် စီမံခြင်း', en: 'Organising a plan' },
  empathy: { my: 'လူတွေ့နားမြင်ခြင်း', en: 'Reading people' },
  analytical_grit: { my: 'အခက်အခဲကို မလျော့ခြင်း', en: 'Staying with a hard problem' },
  collaboration: { my: 'အဖွဲ့နှင့် ညှိနှိုင်းခြင်း', en: 'Negotiating with others' },
};

export const SCENARIOS = [
  {
    id: 'mm-power-at-the-monastery',
    version: 1,
    locale: 'my',
    title: { my: 'ဘုန်းတော်ကြီးကျောင်းရှိ မီးစက်', en: 'Power at the Monastery' },
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
        'ဘတ်ဂျတ် — ကျပ် ၈ သိန်း (ခန့်) — နေရောင်ခံအင်ဗာတာနှင့် ဘက်ထရီ',
        'ထိန်းသိမ်းမှုအတွက် ထပ်ဆောင်းအကြံပြုချက်',
        'ဆယ်ကြိမ် — သုံးလ — အခြေခံမိုးလွန်ကာလ (မိုးတွင် နေရောင်ခံ ထိရောက်မှု နည်းသည်)',
        'အသုံးပြုသူ - သံဃာ ၁၅ ပါး၊ ကျောင်းသား ၄၀ ခန့်၊ ရွာသူရွာသား ၂၀၀ ခန့် (ဖုန်းအားသွင်း)',
      ],
      en: [
        'Budget: ~800,000 MMK — inverter + battery + solar panels',
        'Alternatively — the same budget can fund follow-up maintenance advice',
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
        tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 1 },
      },
      {
        id: 'b-prioritize-students',
        label: {
          my: 'ကျောင်းသားများ အတွက် ပိုမိုများပြားစွာ ထားပါ — ညဉ့်သုံးချက်တလင်း ၈ နာရီ၊ ဖုန်းအားသွင်း ၂ နာရီ။ မိုးရာသီ၌ ဖုန်းအားသွင်း ပိတ်ထားပါ။',
          en: 'Prioritize students: 8 hours study hall, 2 hours phone charging. Cut phone charging entirely during monsoon.',
        },
        tradeoffs: { systems_thinking: 0, empathy: -1, analytical_grit: 1, collaboration: 0 },
      },
      {
        id: 'c-share-with-school',
        label: {
          my: 'ရွာအုပ်ချုပ်ရေးမှူး နှင့် ညှိနှိုင်းပါ — စာသင်ကျောင်းနှင့် ဘုန်းတော်ကြီးကျောင်း မျှဝေသုံးစွဲရန် စီစဉ်ပါ။',
          en: 'Negotiate with the village headman to share with the public school.',
        },
        tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 2 },
      },
      {
        id: 'd-defer-all',
        label: {
          my: 'ဘတ်ဂျတ် မလုံလောက်သေးဟု ဆိုကာ ရင်းနှီးမြှုပ်နှံမှု ရွှေ့ဆိုင်းပါ။ ဆယ်ကြိမ် ပိုရှည်သော အစီအစဉ် ရှာပါ။',
          en: 'Defer the upgrade — budget is too tight. Look for a longer timeline or outside funding.',
        },
        tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 1, collaboration: -1 },
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
  },

  {
    id: 'mm-rice-mill-decision',
    version: 1,
    locale: 'my',
    title: { my: 'ဆန်စက်ရုံ ဆုံးဖြတ်မှု', en: 'The Rice Mill Decision' },
    role: {
      my: 'သင်သည် မိဘကြီးစု၏ ဆန်စက်ရုံကို စီမံနေသူ ဖြစ်သည်။',
      en: 'You run your family\u2019s rice mill.',
    },
    premise: {
      my: 'မိဘကြီးစုရဲ့ ဆန်စက်ရုံက အနောက်ပိုင်းကျလာပါပြီ။ လျှပ်စစ်နဲ့ မီးဖိုချောင်စရိတ်က တက်ကာတွင် ဆန်စပိုင်းဈေးက ကျဆင်းနေသည်။ သင့်ရွေးချယ်ရန် သုံးမျိုး ရှိသည် — သီးစိမ်းဆန်ဘက် ပြောင်းလဲခြင်း၊ လက်ရှိဈေးနှုန်း ထိန်းသိမ်းခြင်း၊ ဒီဂျစ်တယ် အလုပ်အကိုင်းသွားရန် ရုံးပိတ်ခြင်း။',
      en: 'The family rice mill is losing money. Electricity and fuel costs are rising, and paddy prices are falling. You must choose: pivot to organic rice, hold the current price, or close the mill and migrate for work.',
    },
    constraints: {
      my: [
        'ဘတ်ဂျတ် — မိဘကြီးစု ချင်းတိုင်း ကုန်ကြမ်း အကန့်အသတ် ကျပ်သည်',
        'အချိန် — နောက်နှစ်ကာလ ရေစုံချိန်မတိုင်မီ',
        'လူမျိုး — သင်၊ မိဘကြီးစုနှစ်ပါး၊ ညီအစ်ကိုနှစ်ပါး',
      ],
      en: [
        'Budget: limited family savings',
        'Timeline: 6 months before the next harvest',
        'People: you, your parents, two siblings',
      ],
    },
    choices: [
      {
        id: 'a-organic',
        label: {
          my: 'သီးစိမ်းဆန်ဘက် ပြောင်းလဲရန် — ဈေးမြင့်လာသော်လည်း ကုန်ကျစရိတ်များလည်း မြင့်ပြီး လျှပ်တင်ခြင်း ကြာအလွန်ရှည်သည်။',
          en: 'Pivot to organic rice — higher price, higher cost, longer certification',
        },
        tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: 0 },
      },
      {
        id: 'b-hold-price',
        label: {
          my: 'လက်ရှိဈေးကို ထိန်းသိမ်းရန် — ဘယ်တစ်ဝါမဆို အနိုင်သော်လည်း ရောင်းသူအား ဆက်လက် ထိန်းသိမ်းနိုင်သည်။',
          en: 'Hold the current price — lose money per sack, keep customers',
        },
        tradeoffs: { systems_thinking: 0, empathy: 1, analytical_grit: 0, collaboration: 0 },
      },
      {
        id: 'c-close-and-migrate',
        label: {
          my: 'ဆန်စက်ရုံကို ပိတ်ပြီး ထိုင်းနိုင်ငံတွင် စက်ကန့်ရုံအလုပ်အကိုင်းသွားရန်။',
          en: 'Close the mill — migrate to Thailand for factory work',
        },
        tradeoffs: { systems_thinking: 0, empathy: -1, analytical_grit: 0, collaboration: 1 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် ကုန်ကျစရိတ်နှင့် ဝင်ငွေကို ဆုံးဖြတ်ခြင်း မတိုင်မီ တွက်ခွဲသည်။',
          en: 'You model costs and revenues before deciding.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် မိဘကြီးစု၏ လိုအပ်ချက်ကို ကိုယ်ကိုယ်၏ လိုအပ်ချက်နှင့်အတူ ဖြဉ်းစားသည်။',
          en: 'You weigh your family\u2019s needs alongside your own.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် ဖြေရှင်းရလွယ်ကူသော အခက်အခဲကို မနှိုင်ရင်း ဆက်လက်ကြိုးစားသည်။',
          en: 'You stay with a difficult decision without rushing.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် မိဘကြီးစုနှင့် တိုင်ပင်သူတစ်ပါးအား အတူ ဆွေးနွေးသည်။',
          en: 'You involve the family rather than deciding alone.',
        },
      },
    ],
    estimatedMinutes: 4,
    tags: ['business', 'family', 'decision', 'migration'],
  },

  {
    id: 'mm-monastic-tech-bridge',
    version: 1,
    locale: 'my',
    title: { my: 'ဘုန်းတော်ကြီးကျောင်း နည်းပညာ တံတား', en: 'The Monastery Tech Bridge' },
    role: {
      my: 'သင်သည် သာမန်သူဘိုရင်းများအား ကွန်ပျူတာ အခြေခံသင်ခန်းများ သင်ကြားရန် ကူညီပေးနေသူ ဖြစ်သည်။',
      en: 'You help a monk teach novices basic computer skills.',
    },
    premise: {
      my: 'သာမန်တစ်ပါးက သာမန်သူဘိုရင်းများအား ကွန်ပျူတာ အခြေခံသင်ခန်းများ သင်ကြားလိုသည်။ လက်ရှိအရာများက လှူငွေလက်ကွန်းတစ်လုံးနှင့် မသေသပ်တောက်နေသည့် ဝိန်က်ဖိုင်ကျတော့သည်။ ၁၂ ပတ်စာ အစီအစဉ်ကို သင် ရေးဆွဲရသည်။',
      en: 'A monk wants to teach novices basic computer skills using only one donated laptop and intermittent Wi-Fi. You design a 12-week plan.',
    },
    constraints: {
      my: [
        'ကွန်ပျူတာ — သာမန် ၁၂ ပါး တည်းဖြတ်အသုံးပြုရမည်',
        'ဝိန်က်ဖိုင် — နေ့စဉ် ၂ နာရီခွင့်သာ ရနိုင်သည်',
        'အချိန် — ၁၂ ပတ်',
      ],
      en: [
        'One laptop shared by 12 novices',
        'Wi-Fi works 2 hours per day',
        'Timeline: 12 weeks',
      ],
    },
    choices: [
      {
        id: 'a-rotating',
        label: {
          my: 'တစ်လူတစ်နေ့ လှည့်ရှုရန် — သာမန်တစ်ပါးချင်းအတွက် နေ့စဉ် ၃၀ မိနစ်',
          en: 'Rotating schedule — each novice gets 30 minutes per day',
        },
        tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 0 },
      },
      {
        id: 'b-projects',
        label: {
          my: 'အလုပ်တစ်ခုကို အတူလုပ်ရန် — သာမန်နှစ်ပါးစလုံး တစ်ပတ်တွင် အလုပ်တစ်ခုကို အတူလုပ်ရမည်',
          en: 'Project-based — novices work in pairs on one shared task per week',
        },
        tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 1, collaboration: 2 },
      },
      {
        id: 'c-offline',
        label: {
          my: 'အင်တာနက်မလုံး ဦးစားပေးရန် — သင်ခန်းများကို ကြိုတင်ဒေါ်ယူထားပြီး တင်တောက်ချိန်တွင်သာ ဝိန်က်ဖိုင်ကို သုံးသည်',
          en: 'Offline-first — pre-download lessons, use Wi-Fi only for uploads',
        },
        tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: 0 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် မသေသပ်တောက်နေသည့် ဝိန်က်ဖိုင်ကြောင့် အစီအစဉ်ကို ချိန်ညှိသည်။',
          en: 'You plan around the constraint of intermittent Wi-Fi.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် သာမန်တစ်ပါးချင်းစီ ကိုယ်တိုင်လက်နက်မှု ရရှိစေရန် လိမ်မံသည်။',
          en: 'You make sure every novice gets hands-on time.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် အချိန်နည်းသော ပစ္စည်းအခက်အခဲကြား မကျော်တော့ဘဲ ဆက်လုပ်သည်။',
          en: 'You stick with the problem despite limited resources.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် သာမန်များကို တစ်ယောက်တည်းကြိုးစားခြင်းထက် အတူတကွ သင်ယူရန် လုပ်သည်။',
          en: 'You have novices learn together instead of alone.',
        },
      },
    ],
    estimatedMinutes: 4,
    tags: ['education', 'technology', 'rural', 'systems'],
  },

  {
    id: 'mm-border-route',
    version: 1,
    locale: 'my',
    title: { my: 'နယ်စပ် ခရီးသွား လမ်းကြောင်း', en: 'The Border Route' },
    role: {
      my: 'သင်သည် နယ်စပ်တစ်ခုလုပ်ရန် အရောင်းအဝယ်တစ်ပါးက ခေါ်ယူနေသော လူငယ်တစ်ပါးအား တိုင်ပင်းပေးနေသည်။',
      en: 'You advise a young person recruited by a broker for work across the border.',
    },
    premise: {
      my: 'အရောင်းအဝယ်တစ်ပါးက နယ်စပ်ကို ကျော်၍ အလုပ်သွားရန် လူငယ်တစ်ပါးကို ခေါ်ဆွေးနွေးနေသည်။ ဥပဒေလမ်းကြောင်းများ၊ ကုန်ကျစရိတ်များနှင့် မိဘကြီးစု၏ ဖိအားကို သင် တွက်ခွဲရသည်။',
      en: 'A young person is being recruited by a broker for work across the border. You weigh: legitimate channels, costs, and family pressure.',
    },
    constraints: {
      my: [
        'အချိန် — ဆုံးဖြတ်ရန် ၂ ပတ်အတွင်း လိုအပ်သည်',
        'ဘတ်ဂျတ် — မိဘကြီးစုက တစ်စိတ်အပေါင်းကို ထောက်ပံ့နိုင်သည်',
        'လူမျိုး — လူငယ်၊ မိဘကြီးစု၊ ထိုင်းနိုင်ငံရှိ အစ်းအမေတစ်ပါး',
      ],
      en: [
        'Timeline: decision needed in 2 weeks',
        'Budget: family can cover partial costs',
        'People: the youth, parents, one aunt in Thailand',
      ],
    },
    choices: [
      {
        id: 'a-legitimate',
        label: {
          my: 'ဥပဒေလမ်းကြောင်းကို သုံးရန် — ကုန်ကျစရိတ်မြင့်၊ နားနည်း၊ ပိုလုံခြုံ',
          en: 'Use legal channels — higher cost, slower, safer',
        },
        tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 1, collaboration: 1 },
      },
      {
        id: 'b-broker',
        label: {
          my: 'အရောင်းအဝယ်ကို သုံးရန် — မြန်မြန်၊ နည်းသက်၊ အန္တရာယ်များ မြင့်',
          en: 'Use the broker — faster, cheaper, higher risk',
        },
        tradeoffs: { systems_thinking: 0, empathy: -1, analytical_grit: -1, collaboration: 0 },
      },
      {
        id: 'c-wait',
        label: {
          my: 'စောင့်ဆိုင်းရန် ပိုကြေးစည်းရန် — အလုပ်ဝင်ချိန် နောက်ကျသော်လည်း အန္တရာယ် လျော့သည်',
          en: 'Wait and save more — delays work, reduces risk',
        },
        tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 0, collaboration: 0 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် ကုန်ကျစရိတ်၊ မြန်မြန်မှုနှင့် အန္တရာယ်ကို ရွေးချယ်ရိုင်းစဉ် တိုင်ပင်းစားသည်။',
          en: 'You compare cost, speed, and risk across options.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် မိဘကြီးစု၏ စိတ်ပူမှုနှင့် လူငယ်၏ လုံခြုံရေးကို ထည့်သွင်းစဉ်းစားသည်။',
          en: 'You consider the family\u2019s anxiety and the youth\u2019s safety.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် ခက်ခဲသော ဆုံးဖြတ်မှုကို မြန်မြန်ချင်းမကျော်ဘဲ ရပ်နေသည်။',
          en: 'You stay with a difficult decision without rushing.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် မိဘကြီးစုနှင့် ထိုင်းနိုင်ငံရှိ အစ်းအမေတို့နှင့်ပင် ဆွေးနွေးသည်။',
          en: 'You involve the family and the aunt in Thailand.',
        },
      },
    ],
    estimatedMinutes: 4,
    tags: ['migration', 'border', 'safety', 'decision'],
  },

  {
    id: 'mm-cooperative-split',
    version: 1,
    locale: 'my',
    title: { my: 'ပူးသင်းအဖွဲ့ ကွဲထွက်ခြင်း', en: 'The Cooperative Split' },
    role: {
      my: 'သင်သည် ရေဘူးလုပ်သူ ပူးသင်းအဖွဲ့ ကုန်သွယ်ရေးစာချုပ်အတွက် ကွဲထွက်နေသည်ကို ညှိနှိုင်းပေးနေသည်။',
      en: 'You mediate a weaving cooperative splitting over a wholesale contract.',
    },
    premise: {
      my: 'ရေဘူးလုပ်သူ ပူးသင်းအဖွဲ့သည် ကုန်သွယ်ရေးစာချုပ်တစ်ခုအပေါ် ကွဲထွက်နေသည်။ အရွယ်ကျော်ရေဘူးလုပ်သူများနှင့် လူငယ်အဖွဲ့ဝင်များအကြား ညှိနှိုင်းပေးရသည်။',
      en: 'A weaving cooperative is splitting over a wholesale contract. You mediate between the elder weavers and the younger members.',
    },
    constraints: {
      my: [
        'အချိန် — စာချုပ်ဆုံးဖြတ်ရန် ၁ လ',
        'ဘတ်ဂျတ် — အဖွဲ့၏ ရင်းနှီးငွေများသာ',
        'လူမျိုး — အရွယ်ကျော်ရေဘူးလုပ်သူ ၈ ပါး၊ လူငယ်အဖွဲ့ဝင် ၆ ပါး',
      ],
      en: [
        'Timeline: contract decision in 1 month',
        'Budget: cooperative funds only',
        'People: 8 elder weavers, 6 younger members',
      ],
    },
    choices: [
      {
        id: 'a-sign',
        label: {
          my: 'ကုန်သွယ်ရေးစာချုပ်ကို လက်မှတ်ရန် — ဝင်ငွေတည်ကြဲ၊ ဒီဇိုင်းပိုင်စိတ် လျော့သည်',
          en: 'Sign the wholesale contract — steady income, less creative control',
        },
        tradeoffs: { systems_thinking: 0, empathy: 1, analytical_grit: 0, collaboration: 1 },
      },
      {
        id: 'b-split',
        label: {
          my: 'အဖွဲ့ကို ကွဲထွက်ရန် — အုပ်စုတစ်ခုချင်းစီ၏ စည်းချက်အတိုင်း သတ်မှတ်ရမည်',
          en: 'Split the cooperative — each group sets its own terms',
        },
        tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: -1 },
      },
      {
        id: 'c-negotiate',
        label: {
          my: 'စာချုပ်အချက်အလက်ကို ပြန်ညှိနှိုင်းရန် — စည်းချက်ပိုကောင်းသော်လည်း ဝယ်သူကို ဆုံးရှုံးနိုင်သည်',
          en: 'Renegotiate — better terms but risks losing the buyer',
        },
        tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 1, collaboration: 2 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် စာချုပ်က အဖွဲ့ဝင်အားလုံးကို မည်သို့ရောက်ရောက်သည်ကို တွက်ခွဲသည်။',
          en: 'You model how the contract affects every member.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် အရွယ်ကျော်များနှင့် လူငယ်များ နှစ်ဖက်လုံး၏ အသံကို နားထောင်သည်။',
          en: 'You listen to both elders and younger members.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် တင်းလွန်သော ညှိနှိုင်းပေးမှုကို ဖြေရှင်းလိုက်တိုင်း ဆက်လက်လုပ်သည်။',
          en: 'You stay with a tense mediation until it resolves.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် အဖွဲ့လုံး လက်ခံနိုင်သော ဖြေရှင်းချက်ကို တည်ဆောက်သည်။',
          en: 'You build a solution the whole cooperative can accept.',
        },
      },
    ],
    estimatedMinutes: 5,
    tags: ['cooperative', 'crafts', 'mediation', 'business'],
  },

  {
    id: 'mm-digital-artisan',
    version: 1,
    locale: 'my',
    title: { my: 'ဒီဂျစ်တယ် လက်မှုပညာရှင်', en: 'The Digital Artisan' },
    role: {
      my: 'သင်သည် ဓာတ်ပုံရိုက်နည်းမရှိသည့် လက်မှုပညာရှင်တစ်ပါးကို အွန်လိုင်းတွင် ရောင်းချနိုင်ရန် ကူညီပေးနေသူ ဖြစ်သည်။',
      en: 'You help a lacquerware maker sell online without photography skills.',
    },
    premise: {
      my: 'ဓာတ်ပုံရိုက်နည်းမရှိသော လက်မှုပညာရှင်တစ်ပါးသည် အွန်လိုင်းတွင် ရောင်းချနိုင်သော်လည်း ကိုယ်တိုင် ဓာတ်ပုံ မရိုက်နိုင်ပါ။ ကုန်ကျစရိတ်နည်းသော ဒီဂျစ်တယ် ရောင်းသိုးလုပ်နည်းကို သင် ရေးဆွဲရသည်။',
      en: 'A traditional lacquerware maker can sell online but cannot photograph her own work. You design a low-cost digital sales workflow.',
    },
    constraints: {
      my: [
        'ဘတ်ဂျတ် — ၅၀ ဒေါ်လာအောက်',
        'အချိန် — ၄ ပတ်အတွင်း စတင်ရောင်းချရန်',
        'ကိုယ်ကျင့်ကိုင်စိတ်ဖြားစနစ် — စမတ်ဖိုင်တစ်လုံးသာ၊ ကင်းရိုး မရှိ',
      ],
      en: [
        'Budget: under $50',
        'Timeline: launch in 4 weeks',
        'Tools: one smartphone, no camera',
      ],
    },
    choices: [
      {
        id: 'a-smartphone',
        label: {
          my: 'စမတ်ဖိုင်နဲ့ ဓာတ်ပုံရိုက်တတ်ရန် သင်ယူရန် — အခမဲ့၊ သင်ယူရန် အချိန်ပိုကြာသည်',
          en: 'Learn smartphone photography — free, takes time to learn',
        },
        tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 1, collaboration: 0 },
      },
      {
        id: 'b-partner',
        label: {
          my: 'ကျောင်းသား ဓာတ်ပုံရိုက်သူတစ်ပါးနှင့် ပူးပေါင်းရန် — အမှတ်တံဆိုးမှု ဝေမှန်၊ ကုန်ကျစရိတ် ဝေမှန်',
          en: 'Partner with a student photographer — credit shared, cost split',
        },
        tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 2 },
      },
      {
        id: 'c-text-only',
        label: {
          my: 'စာသားသာ ဖြစ်သော စာမျက်နှာများ — ဓာတ်ပုံမရှိ၊ ယုံကြည်မှုအပေါ် အမှီအပေါ်',
          en: 'Text-only listings — no photos, trust-based sales',
        },
        tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 0, collaboration: -1 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် ရှိသည့် ကိုယ်ကျင့်ကိုင်စိတ်ဖြားစနစ်နှင့် ကိုက်ညီသော လုပ်ငန်းစဉ် ရေးဆွဲသည်။',
          en: 'You design a workflow that fits the available tools.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် လက်မှုပညာရှင်ရဲ့ နည်းပညာနဲ့ အမျိုးဟန်ချင်းကို ထည့်သွင်းစဉ်းစားသည်။',
          en: 'You consider the artisan\u2019s comfort with technology.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် အွန်လိုင်းဆိုင်မှု အလုပ်လုပ်နိုင်လောက် ကြိုးစားသည်။',
          en: 'You keep trying until the online shop works.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် တစ်ယောက်တည်းကြိုးစားခြင်းထက် လက်ကူသူတစ်ပါး ဖြစ်ရောက်ရန် ဖိအားပေးသည်။',
          en: 'You bring in a partner instead of working alone.',
        },
      },
    ],
    estimatedMinutes: 4,
    tags: ['crafts', 'e-commerce', 'digital-skills', 'collaboration'],
  },

  {
    id: 'mm-flood-response',
    version: 1,
    locale: 'my',
    title: { my: 'ရေကြီးခြင်း တုံ့ပြန်ရေး', en: 'The Flood Response' },
    role: {
      my: 'သင်သည် အရောက်အနည်း အကူအညီများဖြင့် ရေကြီးခြင်းကို စီမံရေးလုပ်နေရသော မြို့နယ်တစ်ခုမှ ဖြစ်သည်။',
      en: 'You coordinate flood response in a township with limited official support.',
    },
    premise: {
      my: 'မြို့နယ်တစ်ခုသည် ရေကြီးခြင်းကို ရင်းမြစ်ကြီး ကြုံတွင်းနေသည်။ လူများကို ရွှေ့ပြောင်းရေး၊ တို့စားပျော်နေသည့် ကျောင်းကို ဆက်လက် ထိန်းသိမ်းမှုတို့ကို အကျဉ်းချုပ် အားကောင်းရေးကို သင် စီမံရသည်။',
      en: 'A township faces seasonal flooding. You coordinate evacuation, livestock, and school continuity with limited official support.',
    },
    constraints: {
      my: [
        'အချိန် — ရေအနည်းဆုံးရောက်မည့်အထိ ၇၂ နာရီ',
        'ဘတ်ဂျတ် — ရပ်ရွာလူများ၏ လှူငွေများသာ',
        'လူမျိုး — မြို့နယ်ကောင်စီရေးမှု ကောင်စီများ၊ စေတနာသမဂ္ဂီများ ၃ ပါး၊ အိမ်ထိုး ၄၀ ပါး',
      ],
      en: [
        'Timeline: flood crest in 72 hours',
        'Budget: community donations only',
        'People: township committee, 3 volunteers, 40 households',
      ],
    },
    choices: [
      {
        id: 'a-evacuate',
        label: {
          my: 'လူများကို ဦးစားရွှေ့ပြောင်းရေး — လူသူကို ကယ်ကြေးမည်၊ ပစ္စည်းများကို ယာနေရမည်',
          en: 'Prioritize evacuation — save people, leave property behind',
        },
        tradeoffs: { systems_thinking: 0, empathy: 2, analytical_grit: 0, collaboration: 1 },
      },
      {
        id: 'b-protect',
        label: {
          my: 'တို့စားပျော်နေသော အရာများနှင့် ပစ္စည်းများကို ကာကွယ်ရန် — ရွှေ့ပြောင်းရေး နှေးမြန်ပြီး ဆုံးရှုံးမှု လျော့သည်',
          en: 'Protect livestock and property — slower evacuation, fewer losses',
        },
        tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: 0 },
      },
      {
        id: 'c-school',
        label: {
          my: 'ကျောင်းကို ဆက်လက် ဖွင့်ထားရန် — ကျောင်းကို ခိုကလှောင်အဖြစ် သုံးစွာ၊ သင်ခန်းများ ရပ်ဆိုင်း',
          en: 'Keep school running — use it as shelter, classes paused',
        },
        tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 0, collaboration: 2 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် ရွှေ့ပြောင်းရေး၊ တို့စားပျော်နေမှုနှင့် ကျောင်းကို တစ်ပြိုင်ငွေ စီမံသည်။',
          en: 'You coordinate evacuation, livestock, and school together.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် ပစ္စည်းထက် လူများ၏ လုံခြုံရေးကို ဦးစားပေးသည်။',
          en: 'You put people\u2019s safety above property.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် အန္တရာယ်ကြီးအတွင်း စီမံမှုကို မဆိုင်းတာရေး ဆက်လက်လုပ်သည်။',
          en: 'You keep coordinating through the crisis.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် မြို့နယ်ကောင်စီရေးမှု အဖွဲ့တစ်လုံးကို အားပေးသည်။',
          en: 'You mobilise the whole township committee.',
        },
      },
    ],
    estimatedMinutes: 4,
    tags: ['flood', 'emergency', 'community', 'crisis'],
  },

  {
    id: 'mm-apprentice-negotiation',
    version: 1,
    locale: 'my',
    title: { my: 'အလုပ်သင် ညှိနှိုင်းခြင်း', en: 'The Apprentice Negotiation' },
    role: {
      my: 'သင်သည် စက်ယောင်းပြုစုသူတစ်ပါးနှင့် အလုပ်သင် စည်းချက်များကို ညှိနှိုင်းနေသည်။',
      en: 'You negotiate apprenticeship terms with a motorcycle mechanic.',
    },
    premise: {
      my: 'စက်ယောင်းပြုစုသူတစ်ပါးက အလုပ်သင်ကြမ်းပေးရန် ပြောပြသည်သော်လည်း ၆ လ အလုပ်အချင်း မအချင်းအချင်း လုပ်ခပေးရန် တောင်းဆိုသည်။ မိဘကြီးစုနှင့် အတူ စည်းချက်များကို သင် ညှိနှိုင်းရသည်။',
      en: 'A motorcycle mechanic offers an apprenticeship but expects unpaid labor for six months. You negotiate terms with the family.',
    },
    constraints: {
      my: [
        'အချိန် — ဤပတ်အတွင်း အဖြေပေးရန် လိုအပ်သည်',
        'ဘတ်ဂျတ် — မိဘကြီးစုက လေးငွေကို ဖြည့်နိုင်သည်',
        'လူမျိုး — သင်၊ ပြုစုသူ၊ မိဘကြီးစု',
      ],
      en: [
        'Timeline: answer needed this week',
        'Budget: family can cover small costs',
        'People: you, the mechanic, your parents',
      ],
    },
    choices: [
      {
        id: 'a-accept',
        label: {
          my: 'အလုပ်သင်ကို လက်ခံရန် — အချိန်ယူမည်၊ ၆ လ ဝင်ငွေမရှိ',
          en: 'Accept unpaid apprenticeship — learn skills, no income for 6 months',
        },
        tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: -1, collaboration: 0 },
      },
      {
        id: 'b-negotiate',
        label: {
          my: 'တစ်စိတ်ပိုင်း အလုပ်ချင်းကို ညှိနှိုင်းရန် — လေးငွေတစ်စိတ်ပိုင်းနှင့် အလုပ်မလုပ်ချိန် တိုးတိုက်',
          en: 'Negotiate partial pay — modest stipend, shorter unpaid period',
        },
        tradeoffs: { systems_thinking: 1, empathy: 1, analytical_grit: 1, collaboration: 1 },
      },
      {
        id: 'c-decline',
        label: {
          my: 'ငြင်းပတ်ရန် — အလုပ်အချင်းရှိသော အလုပ်ကို ရွေးရန်၊ အလုပ်သင်ခွင့်ကို ဆုံးရှုံးမည်',
          en: 'Decline — find paid work instead, lose the apprenticeship',
        },
        tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: -1 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် ရှည်ကြီးရောက်နေသော အချိန်နှင့် ချက်ချင်းဝင်လာသော ဝင်ငွေကို တိုင်းတနှုိုင်းစားသည်။',
          en: 'You compare long-term skill gain against short-term income.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် မိဘကြီးစု၏ ငွေရေးအခက်အခဲကို ထည့်သွင်းစဉ်းစားသည်။',
          en: 'You consider your family\u2019s financial situation.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် မျှမျှတရား စည်းချက်အတွက် ကြိုတ်တက်စွာ ညှိနှိုင်းသည်။',
          en: 'You negotiate firmly for fair terms.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် လက်ခံရန်သို့မဟုတ် ငြင်းပတ်ရန်သို့ ချိန်ချင်းမလုပ်ဘဲ ပြုစုသူနှင့် ညှိနှိုင်းသည်။',
          en: 'You negotiate with the mechanic rather than accepting or rejecting.',
        },
      },
    ],
    estimatedMinutes: 4,
    tags: ['apprenticeship', 'labor', 'negotiation', 'skills'],
  },

  {
    id: 'mm-language-barrier',
    version: 1,
    locale: 'my',
    title: { my: 'ဘာသာစကား အတားအဆီး', en: 'The Language Barrier' },
    role: {
      my: 'သင်သည် ချမ်းမိဘင်းရှိ မြန်မာ့လူငယ်တစ်ပါးအတွက် ဘာသာစကားနှင့် အလုပ်ကို စီမံရသည်။',
      en: 'You plan language + work for a Burmese youth in Chiang Mai with a Thai job offer.',
    },
    premise: {
      my: 'ချမ်းမိဘင်းရှိ မြန်မာ့လူငယ်တစ်ပါးသည် ထိုင်းကော်ပနီတစ်ခုမှ အလုပ်ခေါ်ချက် ရရှိသော်လည်း ထိုင်းစာ မပြောတတ်ပါ။ ၉၀ နေ့စာ ဘာသာစကားနှင့် အလုပ်အစီအစဉ်ကို သင် ရေးဆွဲရသည်။',
      en: 'A Burmese youth in Chiang Mai gets a job offer at a Thai company but does not speak Thai. You plan a 90-day language + work plan.',
    },
    constraints: {
      my: [
        'အချိန် — အလုပ်စတင်ချိန်မတိုင်မီ ၉၀ နေ့',
        'ဘတ်ဂျတ် — သင်ခန်းအတွက် ကုန်ကျစရိတ် အကန့်အသတ် ကျပ်သည်',
        'ကိုယ်ကျင့်ကိုင်စိတ်ဖြားစနစ် — စမတ်ဖိုင်၊ ရပ်ရွာအသုံးအယာအမြန်များ အခမဲ့',
      ],
      en: [
        'Timeline: 90 days before start date',
        'Budget: limited savings for classes',
        'Tools: smartphone, free community resources',
      ],
    },
    choices: [
      {
        id: 'a-classes',
        label: {
          my: 'ထိုင်းဘာသာစင်များသို့ ဝင်ရောက်ရန် — စနစ်ကနစ်ရှိ၊ ကုန်ကျစရိတ်ကုန်သည်',
          en: 'Enroll in Thai language classes — structured, costs money',
        },
        tradeoffs: { systems_thinking: 0, empathy: 0, analytical_grit: 1, collaboration: 0 },
      },
      {
        id: 'b-self-study',
        label: {
          my: 'အက်ပ်များနှင့် ကိုယ်တိုင်လေ့လာရန် — အခမဲ့၊ တိုးတိုက်မြန်တစ်ချိန်',
          en: 'Self-study with apps — free, slower progress',
        },
        tradeoffs: { systems_thinking: 1, empathy: 0, analytical_grit: 1, collaboration: 0 },
      },
      {
        id: 'c-community',
        label: {
          my: 'မြန်မာ့–ထိုင်း ရပ်ရွာအသုံးအယာအမြန်များမှ သင်ယူရန် — အခမဲ့၊ ပုံစံမသေသပ်မသန့်၊ အရည်အသွေး မျိုးစုံ',
          en: 'Learn from Burmese-Thai community — free, informal, variable quality',
        },
        tradeoffs: { systems_thinking: 0, empathy: 1, analytical_grit: 0, collaboration: 2 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် ၉၀ နေ့တိုင်းအတွက် ဘာသာစကားနှင့် အလုပ် အဆင့်များကို ရေးဆွဲသည်။',
          en: 'You plan 90 days of language and work steps.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် လူငယ်၏ စိတ်ပူမှုနှင့် ရဲရင့်မှုကို ထည့်သွင်းစဉ်းစားသည်။',
          en: 'You consider the youth\u2019s comfort and confidence.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် နေ့တိုင်း ဘာသာစကားလေ့လာရေးကို တက်ကြွစွာ လိုက်ချိန်မှု ထားသည်။',
          en: 'You commit to daily language practice.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် တစ်ယောက်တည်းထက် ရပ်ရွာအနီးချင်းများနှင့်အတူ သင်ယူသည်။',
          en: 'You learn with the community instead of alone.',
        },
      },
    ],
    estimatedMinutes: 4,
    tags: ['language', 'migration', 'work', 'skills'],
  },

  {
    id: 'mm-scholarship-trade-off',
    version: 1,
    locale: 'my',
    title: { my: 'ပညာသင်ဆု ရွေးချယ်ခြင်း', en: 'The Scholarship Trade-off' },
    role: {
      my: 'သင်သည် ပညာသင်ဆု ခွင့်ပြုချက် နှစ်ခုအကြား ရွေးချယ်ရသည်။',
      en: 'You choose between two scholarship offers.',
    },
    premise: {
      my: 'ပညာသင်ဆု ခွင့်ပြုချက် နှစ်ခု ရောက်လာသည် — ပြည်ပတိုင်းပြာသို့ ဂုဏ်ပြုချက်ရှိသော်လည်း မိဘကြီးစုနှင့် ကျော်ရှည်ကြီး ပိတ်ဆိုင်းရမည်။ ဒီတိုင်းရှိ ခွင့်ပြုချက်တစ်ခုက လစ်ငွေနည်းပါသော်လည်း မိဘကြီးစုနှင့်အတူ နေနိုင်သည်။',
      en: 'Two scholarship offers arrive: one prestigious abroad with long family separation, one local with lower pay but you can stay home.',
    },
    constraints: {
      my: [
        'အချိန် — ဆုံးဖြတ်ရန် ၂ ပတ်အတွင်း',
        'ဘတ်ဂျတ် — နှစ်ခုစလုံးတွင် ပညာအပေါင်းအစည်း ပံ့ပိုးပေးမည်',
        'လူမျိုး — သင်၊ မိဘကြီးစု၊ ပြစ်တစ်ပါး',
      ],
      en: [
        'Timeline: decision needed in 2 weeks',
        'Budget: scholarship covers tuition either way',
        'People: you, parents, younger sibling',
      ],
    },
    choices: [
      {
        id: 'a-abroad',
        label: {
          my: 'ပြည်ပတိုင်းပြာသို့ ပညာသင်ဆု — ရည်မှန်ကောင်းပြီး မိဘကြီးစုနှင့် ကျော်ရှည်ကြီး ပိတ်ဆိုင်းမည်',
          en: 'Prestigious abroad scholarship — better credential, long separation',
        },
        tradeoffs: { systems_thinking: 1, empathy: -1, analytical_grit: 1, collaboration: 0 },
      },
      {
        id: 'b-local',
        label: {
          my: 'ဒီတိုင်း ပညာသင်ဆု — မိဘကြီးစုနှင့်အတူ နေနိုင်ပြီး လစ်ငွေနည်းသည်',
          en: 'Local scholarship — stay home, lower stipend, family together',
        },
        tradeoffs: { systems_thinking: 0, empathy: 2, analytical_grit: 0, collaboration: 1 },
      },
    ],
    outcomes: [
      {
        id: 'o-systems',
        trait: 'systems_thinking',
        reflection: {
          my: 'သင်သည် ရည်မှန်၏ တနိုင်ချက်နှင့် မိဘကြီးစုအနောက်နောင်ခြင်းကို တိုင်းတနှုိုင်းစားသည်။',
          en: 'You weigh credential value against family separation.',
        },
      },
      {
        id: 'o-empathy',
        trait: 'empathy',
        reflection: {
          my: 'သင်သည် မိဘကြီးစုနှင့်အတူ ရှိခြင်းကို ဦးစားပေးသည်။',
          en: 'You put family closeness first.',
        },
      },
      {
        id: 'o-grit',
        trait: 'analytical_grit',
        reflection: {
          my: 'သင်သည် ရှည်ရှည်ကြီးသော ရည်မှန်အတွက် ခက်ခဲကို ခံစားသည်။',
          en: 'You accept hardship for a longer-term goal.',
        },
      },
      {
        id: 'o-collab',
        trait: 'collaboration',
        reflection: {
          my: 'သင်သည် တစ်ယောက်တည်းမဟုတ်ဘဲ မိဘကြီးစုနှင့်အတူ ဆုံးဖြတ်သည်။',
          en: 'You decide with your family, not alone.',
        },
      },
    ],
    estimatedMinutes: 4,
    tags: ['scholarship', 'education', 'family', 'decision'],
  },
];

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
