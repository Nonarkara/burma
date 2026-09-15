import type { Escalation, EscalationReason } from './types';

/**
 * Crisis keyword detection + hotline dispatch.
 *
 * Run BEFORE the model is called. If any keyword matches, return Escalation
 * and DO NOT call the model. The mentor is a thin layer over real humans.
 *
 * Keyword lists must be reviewed by Burmese-native speakers before
 * production. This is a starting sketch — too narrow is better than too
 * broad during development, because false positives block normal
 * conversation flow.
 */

const KEYWORDS: Record<EscalationReason, string[]> = {
  self_harm: [
    'သတ်ကိုယ်သတ်ခြင်း',
    'မိမိကိုယ်ကို ထိခိုက်',
    'မိမိကိုယ်ကို နာကျင်',
    'kill myself',
    'suicide',
    'self harm',
    'want to die',
  ],
  exploitation: [
    'လိမ်လည်ခြင်း',
    'အလုပ်မဆင်မခြင်',
    'အလုပ်မလုပ်ခိုင်းခြင်း',
    'forced labor',
    'exploitation',
    'unpaid',
  ],
  trafficking: [
    'ကူးစက်ရောင်းဝယ်ခြင်း',
    'လူကို ရောင်းခြင်း',
    'လူကို ခေါ်သွားခြင်း',
    'trafficking',
    'sold',
    'forced',
  ],
  deportation_fear: [
    'နှင်ထုတ်ခြင်း',
    'ပြည်ပ ပြန်ပို့',
    'ဘားမယ်ဆိုင်ရာ',
    'deport',
    'expired visa',
    'no documents',
  ],
  other_crisis: [],
};

const HOTLINES: Record<EscalationReason, Escalation['hotlines']> = {
  self_harm: [
    {
      name: 'စိတ်ကျန်းမာရေး အကူအညီ — Thailand',
      contact: '1323',
      language: ['my', 'en', 'th'],
    },
    {
      name: 'Burmese Crisis Support (community-run)',
      contact: 'See Telegram: @burmese_helpline',
      language: ['my'],
    },
  ],
  exploitation: [
    {
      name: 'Thailand Labour Hotline',
      contact: '1506',
      language: ['th', 'en'],
    },
  ],
  trafficking: [
    {
      name: 'Thailand Anti-Trafficking Hotline',
      contact: '1300',
      language: ['th', 'en'],
    },
    {
      name: 'Burma Anti-Trafficking (NGO coalition)',
      contact: 'See Telegram: @antitrafficking_mm',
      language: ['my', 'en'],
    },
  ],
  deportation_fear: [
    {
      name: '၂၆ ခုနစ် UNHCR Thailand',
      contact: '02-696-4299',
      language: ['my', 'en', 'th'],
    },
    {
      name: 'Bangkok Community Help (volunteer legal aid)',
      contact: 'See Telegram: @bkkcommunityhelp',
      language: ['my', 'en'],
    },
  ],
  other_crisis: [
    {
      name: 'Thailand Tourist Police (24h, multilingual)',
      contact: '1155',
      language: ['th', 'en'],
    },
  ],
};

const ESCALATION_MESSAGES: Record<EscalationReason, Escalation['message']> = {
  self_harm: {
    my: 'ဤအကြောင်းအရာသည် ကျွန်ုပ်တစ်ယောက်တည်း ကိုင်တွယ်ဖြေရှင်းရန် မသင့်တော်ပါ။ ဤလူများသည် အခမဲ့ ကူညီပေးနိုင်ပါသည်။ ချက်ချင်း ဆက်သွယ်ပါ။',
    en: 'This is not something I can handle alone. These people can help you for free. Please reach out now.',
  },
  exploitation: {
    my: 'ဤအခြေအနေသည် စိုးရိမ်ဖွယ်ရှိပါသည်။ အောက်ပါလူများသည် အခမဲ့ အကူအညီ ပေးနိုင်ပါသည်။',
    en: 'This sounds serious. The people below can help you for free.',
  },
  trafficking: {
    my: 'သင့်ဘေးကင်းမှုသည် အရေးအကြီးဆုံးဖြစ်ပါသည်။ အောက်ပါလူများကို ချက်ချင်း ဆက်သွယ်ပါ။',
    en: 'Your safety matters most. Please contact the people below now.',
  },
  deportation_fear: {
    my: 'ဤအကြောင်းအရာသည် ဥပဒေ အကူအညီ လိုအပ်ပါသည်။ အောက်ပါလူများသည် ကူညီပေးနိုင်ပါသည်။',
    en: 'This needs legal help. The people below can help.',
  },
  other_crisis: {
    my: 'ဤအကြောင်းအရာသည် အထူးအကူအညီ လိုအပ်ပါသည်။ အောက်ပါလူများကို ဆက်သွယ်ပါ။',
    en: 'This needs special help. Please contact the people below.',
  },
};

export function detectEscalation(text: string): EscalationReason | null {
  const lower = text.toLowerCase();
  for (const [reason, words] of Object.entries(KEYWORDS)) {
    if (reason === 'other_crisis') continue;
    if (words.some((w) => lower.includes(w.toLowerCase()))) {
      return reason as EscalationReason;
    }
  }
  return null;
}

export function buildEscalation(reason: EscalationReason): Escalation {
  return {
    reason,
    hotlines: HOTLINES[reason],
    message: ESCALATION_MESSAGES[reason],
  };
}