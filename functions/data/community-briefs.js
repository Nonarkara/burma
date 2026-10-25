// Editorial source checks, not scraped headlines or personalised eligibility.
// Burmese copy is a draft pending native review. Never collect applications here.
const BRIEFS = [
  {
    id: 'unesco-tak-learning-2027', kind: 'opportunity', source: 'UNESCO Core Data Portal',
    title: 'Tak migrant learning · project through March 2027', title_my: 'တက်ခရိုင် ရွှေ့ပြောင်းကလေး ပညာရေး · ၂၀၂၇ မတ်အထိ အစီအစဉ်',
    text: 'UNESCO project 567THA1001 supports Thai-language learning and migrant learning centres in Tak. Its Q2 2026 record lists 10 February 2026–31 March 2027. This is a published project record, not a public enrolment or job call; ask the provider about current participation routes.',
    text_my: 'UNESCO အစီအစဉ် 567THA1001 သည် တက်ခရိုင်ရှိ ရွှေ့ပြောင်းကလေးများအတွက် ထိုင်းဘာသာနှင့် သင်ယူရေးစင်တာများကို ပံ့ပိုးသည်။ ၂၀၂၆ ဒုတိယသုံးလပတ် မှတ်တမ်းတွင် ၂၀၂၆ ဖေဖော်ဝါရီ ၁၀ မှ ၂၀၂၇ မတ် ၃၁ အထိဟု ဖော်ပြထားသည်။ အများလျှောက်ထားနိုင်သော ကျောင်းဝင်ခွင့် သို့မဟုတ် အလုပ်ခေါ်စာ မဟုတ်ပါ။ လက်ရှိ ပါဝင်နိုင်မှုကို စီစဉ်သူထံ မေးပါ။',
    url: 'https://core.unesco.org/en/project/567THA1001', deadline: null, projectEnd: '2027-03-31', status: 'project_record', reviewed: '2026-10-25',
  },
  {
    id: 'afmam-eas-2026', kind: 'opportunity', source: 'ASEAN Foundation',
    title: 'AFMAM EAS 2026 · application call', title_my: 'AFMAM EAS 2026 · လျှောက်လွှာခေါ်ယူမှု',
    text: 'For eligible diploma/undergraduate students aged 18–26 with English proficiency. Deadline: 30 October 2026, 23:59 GMT+7. Travel support is described from the home country; Myanmar citizens living in Thailand should ask the organiser how that applies. Apply with the provider, never in public chat.',
    text_my: 'သတ်မှတ်နိုင်ငံများမှ ဒီပလိုမာ သို့မဟုတ် ဘွဲ့ကြိုကျောင်းသား၊ အသက် ၁၈–၂၆ နှစ်နှင့် အင်္ဂလိပ်စာ အရည်အချင်း လိုအပ်သည်။ နောက်ဆုံးရက် ၂၀၂၆ အောက်တိုဘာ ၃၀၊ ည ၁၁:၅၉ GMT+7 ဖြစ်သည်။ ထိုင်းတွင်နေသော မြန်မာနိုင်ငံသားအတွက် ခရီးစရိတ် စည်းကမ်းကို စီစဉ်သူထံ မေးပါ။ ကိုယ်ရေးစာရွက်စာတမ်းကို စကားဝိုင်းတွင် မတင်ပါနှင့်။',
    url: 'https://aseanfoundation.org/call-for-application/asean-foundation-model-east-asia-summit-2026-marking-50-years-of-the-treaty-of-amity-and-cooperation/',
    deadline: '2026-10-30T23:59:00+07:00', status: 'source_checked', reviewed: '2026-10-25',
  },
  {
    id: 'cetana-2027-28', kind: 'opportunity', source: 'Cetana Educational Foundation',
    title: 'Cetana scholarship · 2027/28', title_my: 'Cetana ပညာသင်ဆု · ၂၀၂၇/၂၈',
    text: 'A teaching-related master’s pathway in Thailand for Myanmar nationals with a bachelor’s degree and English proficiency. It requires three years of service to Myanmar communities after study. The provider lists 1 December 2026 but an inconsistent February 2026 notification date. Confirm the cycle and deadline directly; this is not a confirmed open call.',
    text_my: 'မြန်မာနိုင်ငံသား၊ ဘွဲ့ရနှင့် အင်္ဂလိပ်စာ အရည်အချင်းရှိသူများအတွက် ထိုင်းတွင် သင်ကြားရေးဆိုင်ရာ မဟာဘွဲ့ လမ်းကြောင်းဖြစ်သည်။ ဘွဲ့ရပြီးနောက် မြန်မာအသိုင်းအဝိုင်းအတွက် သုံးနှစ် လုပ်ဆောင်ရမည့် စည်းကမ်းရှိသည်။ ရင်းမြစ်ရှိ ၂၀၂၆ ဒီဇင်ဘာ ၁ နောက်ဆုံးရက်နှင့် ၂၀၂၆ ဖေဖော်ဝါရီ အကြောင်းကြားရက်တို့ မကိုက်ညီပါ။ လျှောက်ထားမီ စီစဉ်သူထံ နှစ်နှင့် နောက်ဆုံးရက်ကို အတည်ပြုပါ။',
    url: 'https://cetana.org/', deadline: null, status: 'needs_confirmation', reviewed: '2026-10-25',
  },
  {
    id: 'childs-dream-thailand', kind: 'opportunity', source: 'Child’s Dream',
    title: 'Child’s Dream · university study in Thailand', title_my: 'Child’s Dream · ထိုင်းတွင် တက္ကသိုလ်ပညာသင်ယူမှု',
    text: 'Provider information for students from Myanmar and Cambodia pursuing a bachelor’s degree in Thailand. The page gives a December–January application period, not a confirmed 2027 deadline. Read the current provider guidelines before planning an application.',
    text_my: 'မြန်မာနှင့် ကမ္ဘောဒီးယားမှ ကျောင်းသားများ ထိုင်းတွင် ဘွဲ့ကြိုပညာသင်ယူရန် ရင်းမြစ်ဖြစ်သည်။ စာမျက်နှာတွင် ဒီဇင်ဘာ–ဇန်နဝါရီ လျှောက်လွှာကာလကို ဖော်ပြထားသော်လည်း ၂၀၂၇ နောက်ဆုံးရက် အတည်မပြုရသေးပါ။ လက်ရှိ လမ်းညွှန်ကို ရင်းမြစ်တွင် စစ်ဆေးပါ။',
    url: 'https://childsdream.org/engage/apply-for-scholarships/university-scholarships-international-bachelors/',
    deadline: null, status: 'programme_reference', reviewed: '2026-10-25',
  },
  {
    id: 'thai-prd-worker-extension-2027', kind: 'action', source: 'Thailand PRD',
    title: 'Registered-worker extension · cohort matters', title_my: 'စာရင်းသွင်း အလုပ်သမားများ · သက်ဆိုင်သူကို စစ်ပါ',
    text: 'The 20 July 2026 announcement describes an extension to December 2027 for specified already-registered workers, not new registration. Detailed procedures and individual eligibility require current Department of Employment confirmation. This is an announcement reference, not permission to work or travel.',
    text_my: '၂၀၂၆ ဇူလိုင် ၂၀ ကြေညာချက်သည် သတ်မှတ်ထားသော စာရင်းသွင်းပြီး အလုပ်သမားများအတွက် ၂၀၂၇ ဒီဇင်ဘာအထိ တိုးမြှင့်မှု ဖြစ်သည်။ အသစ်စာရင်းသွင်းခွင့် မဟုတ်ပါ။ မိမိနှင့် သက်ဆိုင်မှု၊ လက်ရှိလုပ်ထုံးလုပ်နည်းကို ထိုင်းအလုပ်အကိုင်ဌာနထံ အတည်ပြုပါ။ ဤအချက်အလက်သည် အလုပ်လုပ်ခွင့် သို့မဟုတ် ခရီးသွားခွင့် မဟုတ်ပါ။',
    url: 'https://thailand.prd.go.th/en/content/category/detail/id/52/iid/524032',
    deadline: null, status: 'announcement', reviewed: '2026-10-25',
  },
];

export function communityBriefs(now = Date.now()) {
  return BRIEFS.map((brief) => {
    let status = brief.status;
    if (brief.deadline && now > Date.parse(brief.deadline)) status = 'closed';
    else if (status === 'source_checked' && now - Date.parse(brief.reviewed + 'T00:00:00+07:00') > 7 * 86400000) status = 'review_due';
    return { ...brief, status, copyReview: 'Burmese draft; native review pending' };
  });
}
