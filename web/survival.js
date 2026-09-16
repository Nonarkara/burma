// Pirchchat — survival.js
// The "sense of home + how to survive" knowledge core.
// Static, curated, Thai-side only. No PII. No Myanmar-state sources.
// Loaded before dashboard.js / chat-client.js; exposes window.PirchSurvival.

(function () {
'use strict';

const GUIDE = [
  {
    id: 'visa-renewal',
    topic: 'jobs',
    icon: '▤',
    title_my: 'အလုပ်ခွန်း သက်တမ်းတိုးခြင်း — တစ်နှစ်',
    title_en: 'Work-permit renewal — one year window',
    body_my: 'ရှိပြီးသား အလုပ်သမား ခွန်းပေါ် မှီရသူများ e-WorkPermit portal မှ နိုဝင်ဘာ ၃၀ ရက်နေ့ မတိုင်မီ လျောက်ပါ။ အလုပ်ရှင် ထောက်ခံစာ လိုသည်။ ခွန်းအသစ် မဟုတ်ပါ။',
    body_en: 'Renewals for existing employer-sponsored permits via the e-WorkPermit portal. Closes 30 November. You need your employer letter. This is NOT a new-permit window.',
    where: 'e-WorkPermit portal · Phra Khanong immigration Sat 09:00–15:00',
    cost: 'Official fee only · no broker · no money to middlemen',
    ask_in: 'bkk-burmese',
  },
  {
    id: 'visa-saturday',
    topic: 'jobs',
    icon: '◷',
    title_my: 'စနေနေ့ တစ်ဆိုင်ပြီးသုံး ဗီဇာစင်တာ — ဖရာခဏောင်',
    title_en: 'Saturday one-stop visa desk — Phra Khanong',
    body_my: 'စနေနေ့ နံနက် ၀၉:၀၀–၁၅:၀၀ လူကိုယ်တိုင် လာရောက် ၉၀ ရက် အစီရင်ခံခြင်း၊ အလုပ်ခွန်းသက်တမ်းတိုးခြင်းလုပ်နိုင်သည်။ အလုပ်ချိန်ရှိသူများ အတွက် အရေးကြီးသည်။',
    body_en: 'Walk-in 90-day reporting + work-permit renewal every Saturday 09:00–15:00 at Phra Khanong immigration. Built for weekday-shift workers.',
    where: 'Phra Khanong immigration, Bangkok · Sat 09:00–15:00',
    cost: 'Official fee only',
    ask_in: 'bkk-burmese',
  },
  {
    id: 'clinic-maesot',
    topic: 'sharing',
    icon: '＋',
    title_my: 'မဲဆောက် — မဲတောင်ဆေးခန်း',
    title_en: 'Mae Sot — Mae Tao Clinic',
    body_my: 'စာရွက်ပြတ် အလုပ်သမားများ အခမဲ့ ကုသနိုင်သည်။ ဇူလိုင်နောက်ပိုင်း လူလာ နှစ်ဆ မြင့်တက်နေသည်။ စောစောသွားပါ။ မြန်မာဘာသာ ပြောနိုင်သည်။',
    body_en: 'Free care including undocumented workers. Foot traffic doubled since July — go early. Burmese spoken.',
    where: 'Mae Tao Clinic, Mae Sot, Tak',
    cost: 'Free',
    ask_in: 'monastic-youth',
  },
  {
    id: 'clinic-bkk',
    topic: 'sharing',
    icon: '＋',
    title_my: 'ဘန်ကောက် — ဖဟုင်ယဉ် စေတနာဆေးခန်း + ၂၄ နာရီ ဟိုက်လိုင်း',
    title_en: 'Bangkok — Phahon Yothin volunteer clinic + 24h hotline',
    body_my: 'စေတနာဆေးခန်းက အခမဲ့ အဓိကကုသမှု၊ မြန်မာဘာသာ ခွဲခြားခြင်း ပေးသည်။ ၂၄ နာရီ မြန်မာဘာသာ ကျန်းမာရေး ဟိုက်လိုင်း ဖွင့်ထားသည်။',
    body_en: 'Volunteer clinic: free primary care + Burmese triage, referrals to Thai public hospitals. Plus a 24-hour Burmese health hotline.',
    where: 'Phahon Yothin, Bangkok · 24h hotline',
    cost: 'Free',
    ask_in: 'bkk-burmese',
  },
  {
    id: 'dengue-haze',
    topic: 'learning',
    icon: '☔',
    title_my: 'မိုးရာသီ — ငှက်ဖျား + လေထုညစ်ညမ်းမှု',
    title_en: 'Rainy season — dengue + haze',
    body_my: 'ချင်းမိုင်တွင် ငှက်ဖျား ဆေးရုံတက် ၂၂% မြင့်တက်။ မြန်မာ အလုပ်သားများ အများအပြား ပါဝင်သည်။ ရေအိုးဖုံး၊ ဆေးလိပ်တို နေ့တိုင်းရှင်း။ AQI ၁၅၀ ကျော်လျှင် အပြင်အလုပ် mask တပ်ပါ။',
    body_en: 'Dengue admissions up 22% in Chiang Mai, Burmese workers overrepresented. Cover water jars, clear stagnant water daily. Above AQI 150, mask for outdoor work.',
    where: 'Dormitory · worksite · market',
    cost: 'Prevention is free',
    ask_in: 'cm-burmese',
  },
  {
    id: 'kyat-baht',
    topic: 'ideas',
    icon: '◈',
    title_my: 'ကျပ်–ဘတ် နှုန်း — နေ့စဉ် ကြည့်ရမည့်ကိန်း',
    title_en: 'Kyat–baht rate — the daily number',
    body_my: 'ကျပ် ၄% ကျလျှင် အိမ်ပို့ငွေ ၄% လျော့သည်။ တရားဝင်ရည်ညွှန်းနှုန်းထက် မဲဆောက်/မယ်ဆိုင် ကြားဝယ်နှုန်းကို ကြည့်ပါ။ အောက်ပါ ဂဏန်းတွက်စက်သုံးပါ။',
    body_en: 'A 4% kyat drop means 4% less arrives home. Watch the Mae Sot / Mae Sai broker rate, not the official reference rate. Use the calculator below.',
    where: 'Mae Sot · Mae Sai brokers',
    cost: 'CALCULATOR',
    ask_in: 'digest-today',
  },
  {
    id: 'housing-split',
    topic: 'housing',
    icon: '⌂',
    title_my: 'အခန်းဖော် — ချင်းမိုင် ฿၃၅၀၀ ခွဲ',
    title_en: 'Roommate split — Chiang Mai ฿3,500',
    body_my: 'ချင်းမိုင်တွင် အခန်းလခ ခွဲဝေလေ့ရှိသည်။ စပေါ် + ပထမလ စုစုပေါင်း ကြိုမေးပါ။ စာချုပ်ကို ဓာတ်ပုံရိုက်သိမ်းပါ။ မိဘနာများ #cm-burmese တွင် မေးပါ။',
    body_en: 'Splitting ~฿3,500/month is normal in Chiang Mai. Ask the deposit + first-month total up front. Photograph the contract. Ask in #cm-burmese.',
    where: '#cm-burmese · Tha Pae Gate meetups Sat 16:00',
    cost: '~฿3,500/month split',
    ask_in: 'cm-burmese',
  },
  {
    id: 'training-bakery',
    topic: 'learning',
    icon: '✎',
    title_my: 'ခြောက်လ မုန့်ဖုတ်သင်တန်း — ချင်းမိုင်',
    title_en: 'Six-month bakery training — Chiang Mai',
    body_my: 'မြန်မာ အမျိုးသမီးများကို ထိုင်း မုန့်ဖုတ်ခေါင်းဆောင်များနှင့် တွဲဖက်သင်ပေးသည်။ အပြီးတွင် ကိရိယာသေတ္တာငယ် + အလုပ်ခန့်စာ ရသည်။',
    body_en: 'Pairs Burmese women with Thai head bakers for six months. Graduates get a toolkit + placement letter. Small, dignified, with a credential.',
    where: 'Chiang Mai bakery collective',
    cost: 'Free training',
    ask_in: 'cm-burmese',
  },
  {
    id: 'monastery-maesot',
    topic: 'learning',
    icon: '☸',
    title_my: 'မဲဆောက် ဘုန်းကြီးကျောင်း — သာမဏယာ မလို',
    title_en: 'Mae Sot monastery — no thamanya needed',
    body_my: 'သာမဏယာ မလိုအပ်ပါ။ သင်္ကန်း + ဘုန်းမည်း (thadowint) လိုသည်။ ဆရာတော်ထံ ဖုန်းဖြင့် ဆက်သွယ်မေးမြန်းနိုင်သည်။',
    body_en: 'No thamanya required — you need robes + monastic name (thadowint). The abbot accepts phone references.',
    where: 'Mae Sot monastery · ask #monastic-youth',
    cost: 'Free · bring robes',
    ask_in: 'monastic-youth',
  },
  {
    id: 'crossing-maesai',
    topic: 'ideas',
    icon: '→',
    title_my: 'မယ်ဆိုင် ဖြတ်သန်းမှု ၄ ဆ — ဘာကိုဆိုလိုသလဲ',
    title_en: 'Mae Sai crossings 4x — what it means',
    body_my: 'နေ့စဉ် ဖြတ်သန်းမှု ၄ ဆ တိုးခြင်းသည် ၃၀ ရက်အတွင်း ချင်းရိုင် ကျောင်းအပ်နှံ မြင့်တက်ခြင်း၊ ဘန်ကောက် NGO မှတ်ပုံတင်ခြင်းတို့ကို ကြိုပြသည်။',
    body_en: 'A 4x jump in daily crossings predicts school-enrolment surges in Chiang Rai and NGO registrations in Bangkok within 30 days. Plan ahead.',
    where: 'Mae Sai checkpoint',
    cost: 'Information only',
    ask_in: 'listening-club',
  },
];

const PHRASES = [
  { my: 'ကူညီပါ', th: 'ช่วยด้วย (chûai dûai)', en: 'Help me', use: 'Emergency' },
  { my: 'ဆေးခန်းဘယ်မှာလဲ', th: 'คลินิกอยู่ที่ไหน (khlí-ník yùu thîi-nǎi)', en: 'Where is the clinic?', use: 'Health' },
  { my: 'အလုပ်ခွန်းသက်တမ်းတိုးချင်တယ်', th: 'อยากต่อใบอนุญาตทำงาน (yàak dtò bai à-nú-yâat tham-ngaan)', en: 'I want to renew my work permit', use: 'Visa' },
  { my: 'လစာဘယ်လောက်လဲ', th: 'เงินเดือนเท่าไหร่ (ngern-deuan thâo-rài)', en: 'What is the salary?', use: 'Jobs' },
  { my: 'အခန်းလခဘယ်လောက်လဲ', th: 'ค่าห้องเท่าไหร่ (khâa-hông thâo-rài)', en: 'How much is the rent?', use: 'Housing' },
  { my: 'ကျေးဇူးတင်ပါတယ်', th: 'ขอบคุณ (khòp-khun)', en: 'Thank you', use: 'Every day' },
  { my: 'မင်္ဂလာပါ', th: 'สวัสดี (sà-wàt-dii)', en: 'Hello', use: 'Every day' },
  { my: 'နားမလည်ဘူး', th: 'ไม่เข้าใจ (mâi khâo-jai)', en: "I don't understand", use: 'Every day' },
];

const HOTLINES = [
  { name: 'လူမှုကူညီရေး · Thailand social assistance', num: '1300', lang: 'Thai · 24 hours', note: 'Ask for Burmese-language support; availability is not confirmed. Source checked 16 September 2026.', source: 'https://trang.m-society.go.th/e-service/e-service/' },
  { name: 'Burmese health hotline (Bangkok)', num: '', lang: 'Unverified referral', note: 'No verified telephone number. Do not rely on this listing in an emergency.' },
  { name: 'Mae Tao Clinic (Mae Sot)', num: '', lang: 'Mae Sot', note: 'Check services and opening hours directly with the clinic. This is not a verified emergency contact.' },
  { name: 'Phahon Yothin volunteer clinic', num: '', lang: 'Unverified referral', note: 'Location and services require confirmation. Do not rely on this listing in an emergency.' },
];

// Crisis keywords → in-session banner with real humans (AGENTS.md §10).
// NOT model refusal. Real referral numbers.
const CRISIS_RE = /(suicide|kill myself|self[- ]?harm|ฆ่าตัวตาย|မိမိကိုယ်|traffick|exploit|ကုန်ကူး|ล่อลวง|deport|เนรเทศ|နေရပ်ပြန်.*အတင်း|rape|ข่มขืน|မုဒိမ်း|abuse|ทำร้าย|အနိုင်ကျင့်)/i;

function checkCrisis(text) {
  return CRISIS_RE.test(String(text || ''));
}

// Job boards that actually list work a Burmese worker in Thailand can take.
// Every URL below returned HTTP 200 to a live check in Sept 2026, except
// where marked "search" (a Facebook/portal search that always resolves).
// Links move — each card carries a "discuss" button so the room keeps the
// list honest month to month.
const JOBS = [
  {
    name: 'Sabai Job',
    url: 'https://www.facebook.com/search/top?q=sabai%20job',
    url_label: 'Facebook search: sabai job',
    langs: 'Burmese · Thai · English',
    note_my: 'မြန်မာ အလုပ်သမားများအတွက် အခမဲ့။ လုပ်ငန်း ၁၈ မျိုး။ အသိုင်းအဝိုင်း ၂၂,၀၀၀။',
    note_en: 'Free for workers. 18 industries. 22,000-member community. Verified blue-collar placements for Myanmar workers in Thailand.',
    ask_in: 'bkk-burmese',
  },
  {
    name: 'Thai Department of Employment (DOE)',
    url: 'https://www.doe.go.th/',
    url_label: 'doe.go.th',
    langs: 'Thai',
    note_my: 'အလုပ်ခွန်း၊ သက်တမ်းတိုးခြင်း တရားဝင်သတင်း။ ထိုင်းဘာသာဖြင့် ဖတ်ရမည်။',
    note_en: 'Official source for permits and renewals. Thai-language. If a broker contradicts DOE, DOE wins.',
    ask_in: 'bkk-burmese',
  },
  {
    name: 'JobThai',
    url: 'https://www.jobthai.com/',
    url_label: 'jobthai.com',
    langs: 'Thai',
    note_my: 'ဘန်ကောက်၊ စမွတ်ပရာကန်၊ ချင်းမိုင် စစ်ထုတ်ရှာပါ။ ထိုင်းစာ အကူအညီလိုလျှင် အခန်းတွင် မေးပါ။',
    note_en: 'Largest Thai-language board. Filter Bangkok / Samut Prakan / Chiang Mai. Ask the room for help reading Thai listings.',
    ask_in: 'bkk-burmese',
  },
  {
    name: 'JobsDB Thailand',
    url: 'https://th.jobsdb.com/',
    url_label: 'th.jobsdb.com',
    langs: 'English · Thai',
    note_my: 'အင်္ဂလိပ်ဘာသာဖြင့် ရှာနိုင်သည်။ ဟိုတယ်၊ စက်ရုံ၊ လုံခြုံရေး အလုပ်များ များသည်။',
    note_en: 'English-friendly listings. Hotels, factories, services. Compare the salary against the checklist below before applying.',
    ask_in: 'bkk-burmese',
  },
  {
    name: 'MAP Foundation (Chiang Mai)',
    url: 'https://mapfoundationcm.org/en/',
    url_label: 'mapfoundationcm.org',
    langs: 'Burmese · English',
    note_my: 'ရွှေ့ပြောင်း အလုပ်သမား အခွင့်အရေး အကူအညီ။ အလုပ်ရှင်နှင့် ပြဿနာရှိလျှင် ဤနေရာတွင် အရင်မေးပါ။',
    note_en: 'Migrant worker rights support. If an employer withholds wages or documents, ask here before you act alone.',
    ask_in: 'cm-burmese',
  },
];

// "Is this job good?" — the room's shared checklist. A job that fails any
// line is discussed in #bkk-burmese before anyone signs.
const GOOD_JOB = [
  { my: 'စာချုပ် ရေးထားပြီး သင်ဖတ်တတ်သော ဘာသာဖြင့် ဖြစ်ရမည်', en: 'Written contract in a language you read — before you start' },
  { my: 'အလုပ်ရှင်က အလုပ်ခွန်းထောက်ပံ့ရမည်', en: 'Employer sponsors your work permit (their name on the permit)' },
  { my: 'အလုပ်ရဖို့ ကြားဝယ်ခ မပေးရပါ', en: 'No broker fee taken from your wages; official fees have receipts' },
  { my: 'တစ်ပတ် တစ်ရက် နားရက် + အချိန်ပို လုပ်ခ', en: 'One rest day per week, overtime paid' },
  { my: 'ပတ်စပို့/မှတ်ပုံတင် မူရင်း ကိုယ်တိုင်သိမ်းရမည်', en: 'You keep your own passport and ID — never surrender originals' },
  { my: 'နေမကောင်း + ထိခိုက်မှု အာမခံ', en: 'Sick leave and accident coverage (Social Security Fund after registration)' },
];

const RED_FLAGS = [
  { my: 'အလုပ်ရဖို့ စပေါ်ပေးရမည် ဆိုလျှင်', en: '"Pay a deposit to secure the job"' },
  { my: 'ပတ်စပို့ အလုပ်ရှင်/ကြားဝယ် သိမ်းထားလျှင်', en: 'Passport held by employer or broker' },
  { my: '၃ လ စမ်းသပ်ကာလ လစာနောက်မှပေးမည်ဟု စာရွက်မပါဘဲ ပြောလျှင်', en: '"Wages after 3 months probation" with no paperwork' },
  { my: 'လိပ်စာ၊ ကုမ္ပဏီအမည် မရှိ၊ ချတ်အက်ပ်ဖြင့်သာ ဆက်သွယ်လျှင်', en: 'No address, no company name, contact only via chat app' },
  { my: 'ခွန်း မလိုဘူးဟု စက်ရုံ/ဆောက်လုပ်ရေး အလုပ်တွင် ပြောလျှင်', en: '"No permit needed" for factory or construction work' },
];

window.PirchSurvival = { GUIDE, PHRASES, HOTLINES, JOBS, GOOD_JOB, RED_FLAGS, checkCrisis, CRISIS_RE };

})();
