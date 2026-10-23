# Burmese Review Packet — Pirchchat (A-Lin-Ein)

**For:** Burmese-native reviewers (1–2 people). No technical knowledge needed.
**Date prepared:** 2026-10-23. **Version under review:** live at `burma.nonarkara.org`, git `8215cde`.
**Author of packet:** AI coding agent (non-native Burmese writer) + Dr Non. **Every Burmese string below is unreviewed by a native speaker.** That is the point of this packet.

---

## Why this review matters more than anything else in the backlog

The crisis-safety net works like this: a chat message matching certain keywords triggers a banner with real hotline numbers. **If the Burmese keywords are wrong or missing, a person in crisis sees nothing — the failure is silent.** Wrong place names or mistranslated health cards are embarrassing; wrong crisis keywords are dangerous.

**How to review:** read each table row. Mark:
- ✓ correct and natural
- ~ understandable but awkward (suggest better wording if you can)
- ✗ wrong (write the correction — your correction goes straight into the code)

You do not need to understand the technology. Read the Burmese only.

---

## PRIORITY A — Crisis keywords (review these first)

This is the actual trigger list, currently in the code (`web/survival.js:152`):

| # | Keyword in code | Language | Agent's concern |
|---|---|---|---|
| A1 | `suicide`, `kill myself`, `self-harm` | English | Assumed fine |
| A2 | `ฆ่าตัวตาย` | Thai | Assumed fine (suicide) |
| A3 | `မိမိကိုယ်` | Burmese | **Suspect.** Means "one's own body/self" — too broad; innocent phrases like "မိမိကိုယ်ကိုယ် ဂရုစိုက်ပါ" (take care of yourself) would trigger the banner. |
| A4 | `traffick`, `exploit` | English | Assumed fine |
| A5 | `ကုန်ကူး` | Burmese | **Suspect.** Means "trade/commerce". Human trafficking = `လူကုန်ကူး`. As written, ordinary messages about buying and selling trigger the crisis banner. |
| A6 | `ล่อลวง` | Thai | Luring. Assumed plausible — verify. |
| A7 | `deport` | English | Assumed fine |
| A8 | `เนรเทศ` | Thai | **Suspect.** Means "exile/banish". Deportation is usually `ส่งกลับประเทศ` / `ส่งตัวกลับ`. |
| A9 | `နေရပ်ပြန်.*အတင်း` | Burmese | Forced return. Pattern unverified — is this how people actually write it? |
| A10 | `rape`, `ข่มขืน`, `မုဒိမ်း` | En/Th/My | Assumed fine |
| A11 | `abuse`, `ทำร้าย`, `အနိုင်ကျင့်` | En/Th/My | အနိုင်ကျင့် = oppression/bullying — verify it reads naturally for abuse. |

**CRITICAL GAP A12:** There is **no real Burmese term for suicide** in the list. `မိမိကိုယ်` is the closest and it is wrong. A person typing "ကိုယ့်ကိုယ်ကိုယ် သတ်ချင်တယ်" or "အသက်ပေးချင်တယ်" in Burmese gets **no banner**. Reviewer: please provide the natural Burmese terms people actually use (including colloquial spellings), e.g. ကိုယ့်ကိုယ်ကိုယ် သတ်, အသက်စတေး, မသေချင်တော့ဘူး — we need the real ones, not our guesses.

**Also needed:** exploitation/forced-labour terms people use in Thai-Burmese worker communities (`အလုပ်ကျွန်`? `အခမဲ့အလုပ်`?), and deportation-fear terms (`ပြန်ပို့`? `နိုင်ငံစွန့်ခွာ`?). We would rather over-trigger than miss.

---

## PRIORITY B — Hotlines (numbers shown to people in crisis)

From `web/survival.js:143`. Honest design: **no number is shown unless verified.** Empty numbers are labelled "Do not rely on this listing in an emergency."

| Listing | Number shown | What the reviewer should verify |
|---|---|---|
| လူမှုကူညီရေး · Thailand social assistance | `1300` | Is 1300 correct for social assistance? Does Burmese-language support exist? (source: trang.m-society.go.th, checked 16 Sep 2026) |
| Burmese health hotline (Bangkok) | — none | Does this hotline exist? If yes, what is the number? |
| Mae Tao Clinic (Mae Sot) | — none | Current contact + opening hours |
| Phahon Yothin volunteer clinic | — none | Does it exist? Name and location correct? |

If you know verified numbers, we add them with your name recorded as source.

---

## PRIORITY C — Survival guide cards (10 cards, health-critical items first)

### The agent's own suspects — please check these hardest

| # | String in code | Where | Agent's concern |
|---|---|---|---|
| C1 | `ငှက်ဖျား` for "dengue" | dengue-haze card | **Likely wrong disease.** ငှက်ဖျား = malaria. Dengue = ချက်ကျိုးငှက်ဖျား or ဒိုင်ဂျီ? The English says dengue; the Burmese says malaria. One of them is wrong. |
| C2 | `မြန်မာဘာသာ ခွဲခြားခြင်း` for "Burmese triage" | clinic-bkk card | **Suspect wrong word.** ခွဲခြားခြင်း reads as "discrimination/separation". Triage should be something like အရေးပေါ် အလိုက်သင့် စစ်ဆေးပေးခြင်း? |
| C3 | `ဘုန်းမည်း (thadowint)` for monastic name | monastery-maesot card | **Possibly invented.** Is ဘုန်းမည်း a real term? The ordination name is usually ရဟန်းဘွဲ့ / သာမဏေဘွဲ့ / အမည်တော်? |
| C4 | `အလုပ်ခွန်း` for work permit | visa cards, phrases, job checklist (~8 places) | **Suspect.** ခွန်း = "word/speech". Work permit should be အလုပ်လက်မှတ်? If wrong, this error repeats across the whole app. |
| C5 | `မိဘနာများ` | housing card + #monastic-youth room topic | **Garbled?** မိဘနာ is not a word we know. Intended: မိဘများ? ညီအကိုများ? မောင်နှမများ? |
| C6 | `ဟိုက်လိုင်း` vs `ဟိုတ်လိုင်း` for hotline | survival.js vs dashboard.html | Two different transliterations in-tree. Which is right? |
| C7 | `မယ်ဆိုင်` vs `မဲဆိုင်` for Mae Sai | kyat-baht + crossing cards vs geocoder | Two spellings in-tree. Which is the natural one? (မဲဆောက် for Mae Sot — verify too.) |

### All 10 cards, full Burmese, for naturalness review

1. **visa-renewal** — `အလုပ်ခွန်း သက်တမ်းတိုးခြင်း — တစ်နှစ်` / body: `ရှိပြီးသား အလုပ်သမား ခွန်းပေါ် မှီရသူများ e-WorkPermit portal မှ နိုဝင်ဘာ ၃၀ ရက်နေ့ မတိုင်မီ လျောက်ပါ။ အလုပ်ရှင် ထောက်ခံစာ လိုသည်။ ခွန်းအသစ် မဟုတ်ပါ။`
2. **visa-saturday** — `စနေနေ့ တစ်ဆိုင်ပြီးသုံး ဗီဇာစင်တာ — ဖရာခဏောင်` / body: `စနေနေ့ နံနက် ၀၉:၀၀–၁၅:၀၀ လူကိုယ်တိုင် လာရောက် ၉၀ ရက် အစီရင်ခံခြင်း၊ အလုပ်ခွန်းသက်တမ်းတိုးခြင်းလုပ်နိုင်သည်။ အလုပ်ချိန်ရှိသူများ အတွက် အရေးကြီးသည်။`
3. **clinic-maesot** — `မဲဆောက် — မဲတောင်ဆေးခန်း` / body: `စာရွက်ပြတ် အလုပ်သမားများ အခမဲ့ ကုသနိုင်သည်။ ဇူလိုင်နောက်ပိုင်း လူလာ နှစ်ဆ မြင့်တက်နေသည်။ စောစောသွားပါ။ မြန်မာဘာသာ ပြောနိုင်သည်။` — *also:* is the clinic name rendered naturally as မဲတောင်ဆေးခန်း?
4. **clinic-bkk** — see C2, C6 above. Body: `စေတနာဆေးခန်းက အခမဲ့ အဓိကကုသမှု၊ မြန်မာဘာသာ ခွဲခြားခြင်း ပေးသည်။ ၂၄ နာရီ မြန်မာဘာသာ ကျန်းမာရေး ဟိုက်လိုင်း ဖွင့်ထားသည်။`
5. **dengue-haze** — see C1. Body: `ချင်းမိုင်တွင် ငှက်ဖျား ဆေးရုံတက် ၂၂% မြင့်တက်။ မြန်မာ အလုပ်သားများ အများအပြား ပါဝင်သည်။ ရေအိုးဖုံး၊ ဆေးလိပ်တို နေ့တိုင်းရှင်း။ AQI ၁၅၀ ကျော်လျှင် အပြင်အလုပ် mask တပ်ပါ။` — *also:* "ဆေးလိပ်တို နေ့တိုင်းရှင်း" — intended meaning is "clear stagnant water daily"; does ဆေးလိပ်တို confuse (cigarettes)? Suggest clearer wording.
6. **kyat-baht** — `ကျပ်–ဘတ် နှုန်း — နေ့စဉ် ကြည့်ရမည့်ကိန်း` / body: `ကျပ် ၄% ကျလျှင် အိမ်ပို့ငွေ ၄% လျော့သည်။ တရားဝင်ရည်ညွှန်းနှုန်းထက် မဲဆောက်/မယ်ဆိုင် ကြားဝယ်နှုန်းကို ကြည့်ပါ။ အောက်ပါ ဂဏန်းတွက်စက်သုံးပါ။`
7. **housing-split** — see C5. Body: `ချင်းမိုင်တွင် အခန်းလခ ခွဲဝေလေ့ရှိသည်။ စပေါ် + ပထမလ စုစုပေါင်း ကြိုမေးပါ။ စာချုပ်ကို ဓာတ်ပုံရိုက်သိမ်းပါ။ မိဘနာများ #cm-burmese တွင် မေးပါ။` — *also:* စပေါ် (deposit, from Thai มัดจำ?) — natural?
8. **training-bakery** — `ခြောက်လ မုန့်ဖုတ်သင်တန်း — ချင်းမိုင်` / body: `မြန်မာ အမျိုးသမီးများကို ထိုင်း မုန့်ဖုတ်ခေါင်းဆောင်များနှင့် တွဲဖက်သင်ပေးသည်။ အပြီးတွင် ကိရိယာသေတ္တာငယ် + အလုပ်ခန့်စာ ရသည်။`
9. **monastery-maesot** — see C3. Body: `သာမဏယာ မလိုအပ်ပါ။ သင်္ကန်း + ဘုန်းမည်း (thadowint) လိုသည်။ ဆရာတော်ထံ ဖုန်းဖြင့် ဆက်သွယ်မေးမြန်းနိုင်သည်။` — *also:* သာမဏယာ for "no novice ordination needed" — correct term?
10. **crossing-maesai** — `မယ်ဆိုင် ဖြတ်သန်းမှု ၄ ဆ — ဘာကိုဆိုလိုသလဲ` / body: `နေ့စဉ် ဖြတ်သန်းမှု ၄ ဆ တိုးခြင်းသည် ၃၀ ရက်အတွင်း ချင်းရိုင် ကျောင်းအပ်နှံ မြင့်တက်ခြင်း၊ ဘန်ကောက် NGO မှတ်ပုံတင်ခြင်းတို့ကို ကြိုပြသည်။`

---

## PRIORITY D — Phrases, job boards, checklist, red flags

### Phrasebook (8 phrases, Thai transliterations included)

| Burmese | English | Agent's concern |
|---|---|---|
| ကူညီပါ | Help me | Assumed fine |
| ဆေးခန်းဘယ်မှာလဲ | Where is the clinic? | Assumed fine |
| အလုပ်ခွန်းသက်တမ်းတိုးချင်တယ် | I want to renew my work permit | See C4 |
| လစာဘယ်လောက်လဲ | What is the salary? | Assumed fine |
| အခန်းလခဘယ်လောက်လဲ | How much is the rent? | Assumed fine |
| ကျေးဇူးတင်ပါတယ် | Thank you | Assumed fine |
| မင်္ဂလာပါ | Hello | Assumed fine |
| နားမလည်ဘူး | I don't understand | Natural? |

### Job boards — `note_my` fields (6 boards)

1. Sabai Job: `မြန်မာ အလုပ်သမားများအတွက် အခမဲ့။ လုပ်ငန်း ၁၈ မျိုး။ အသိုင်းအဝိုင်း ၂၂,၀၀၀။`
2. DOE: `အလုပ်ခွန်း၊ သက်တမ်းတိုးခြင်း တရားဝင်သတင်း။ ထိုင်းဘာသာဖြင့် ဖတ်ရမည်။`
3. JobThai: `ဘန်ကောက်၊ စမွတ်ပရာကန်၊ ချင်းမိုင် စစ်ထုတ်ရှာပါ။ ထိုင်းစာ အကူအညီလိုလျှင် အခန်းတွင် မေးပါ။`
4. JobsDB: `အင်္ဂလိပ်ဘာသာဖြင့် ရှာနိုင်သည်။ ဟိုတယ်၊ စက်ရုံ၊ လုံခြုံရေး အလုပ်များ များသည်။`
5. MAP Foundation: `ရွှေ့ပြောင်း အလုပ်သမား အခွင့်အရေး အကူအညီ။ အလုပ်ရှင်နှင့် ပြဿနာရှိလျှင် ဤနေရာတွင် အရင်မေးပါ။`
- `စမွတ်ပရာကန်` (Samut Prakan) transliteration natural? `ရွှေ့ပြောင်း` for migrant — natural? (Alternative: ရွှေ့ပြောင်းအလုပ်သမား is the common term — verify.)

### "Is this job good?" checklist (6 lines)

1. `စာချုပ် ရေးထားပြီး သင်ဖတ်တတ်သော ဘာသာဖြင့် ဖြစ်ရမည်`
2. `အလုပ်ရှင်က အလုပ်ခွန်းထောက်ပံ့ရမည်` — see C4
3. `အလုပ်ရဖို့ ကြားဝယ်ခ မပေးရပါ`
4. `တစ်ပတ် တစ်ရက် နားရက် + အချိန်ပို လုပ်ခ`
5. `ပတ်စပို့/မှတ်ပုံတင် မူရင်း ကိုယ်တိုင်သိမ်းရမည်`
6. `နေမကောင်း + ထိခိုက်မှု အာမခံ` — natural for "sick leave + accident coverage"?

### Walk-away red flags (5 lines)

1. `အလုပ်ရဖို့ စပေါ်ပေးရမည် ဆိုလျှင်`
2. `ပတ်စပို့ အလုပ်ရှင်/ကြားဝယ် သိမ်းထားလျှင်`
3. `၃ လ စမ်းသပ်ကာလ လစာနောက်မှပေးမည်ဟု စာရွက်မပါဘဲ ပြောလျှင်`
4. `လိပ်စာ၊ ကုမ္ပဏီအမည် မရှိ၊ ချတ်အက်ပ်ဖြင့်သာ ဆက်သွယ်လျှင်` — ချတ်အက်ပ် for "chat app" natural?
5. `ခွန်း မလိုဘူးဟု စက်ရုံ/ဆောက်လုပ်ရေး အလုပ်တွင် ပြောလျှင်` — see C4

---

## PRIORITY E — Map geocoding keywords (machine-added 2026-10-23, newest and least verified)

These Burmese place-name keywords were added by the AI agent so Burmese news headlines can be located on the map. A wrong spelling simply never matches (harmless), but wrong *matches* put news in the wrong place. Review each spelling:

| Place | Keyword in code | Confidence |
|---|---|---|
| Mae Sot / Myawaddy | `မဲဆောက်` / `မြဝတီ` | မြဝတီ sure; မဲဆောက် verify |
| Tachileik | `တာချီလိတ်` | verify |
| Kawthaung | `ကော့သောင်း` | sure |
| Bangkok | `ဗန်ကောက်` | colloquial — verify written form |
| Hpakant | `ဖာကန့်` | verify |
| Myitkyina / Kachin | `မြစ်ကြီးနား` / `ကချင်` | sure |
| Taunggyi / Shan | `တောင်ကြီး` / `ရှမ်း` | sure |
| Rakhine / Sittwe | `ရခိုင်` / `စစ်တွေ` | sure |
| Naypyidaw | `နေပြည်တော်` | sure |
| Mandalay | `မန္တလေး` | sure |
| Sagaing / Monywa | `စစ်ကိုင်း` / `မုံရွာ` | sure |
| Pathein | `ပုသိမ်` | sure |
| Bagan | `ပုဂံ` | sure |
| Yangon | `ရန်ကုန်` | sure |
| Mawlamyine | `မော်လမြိုင်` | sure |

**Missing and wanted:** Taungoo (တောင်ငူ?), Bago (ပဲခူး), Magway (မကွေး), Mawlamyinegyun, Myeik (မြိတ်), Dawei (ထားဝယ်), Kengtung (ကျိုင်းတုံ), Loikaw (လွိုင်ကော်), Hakha (ဟားခါး), Hpa-an (ဘားအံ) — add any the agent missed, with the spelling people actually use.

---

## PRIORITY F — UI labels (73 in dashboard, 19 in room page)

Every interface label exists twice: `data-my` (Burmese) and `data-en` (English). Reviewer: open `burma.nonarkara.org/dashboard` and toggle မြန်မာ ⇄ English in the status bar. Read the Burmese as a user would and note anything unnatural. The raw strings live in `web/dashboard.html` and `web/room.html` if you prefer reading code.

**Known gap:** the Ground rules and About dialogs are **English-only** (boundary #3 violation — Burmese-first UX). If time permits, please draft natural Burmese for these two dialogs and we will install them verbatim.

---

## Sign-off

Reviewer name (optional) · date · sections reviewed:

- [ ] A — Crisis keywords (highest stakes)
- [ ] B — Hotlines
- [ ] C — Survival cards
- [ ] D — Phrases/jobs/checklist
- [ ] E — Geocoding keywords
- [ ] F — UI labels walk-through

*Corrections go into the code exactly as the reviewer writes them, with the reviewer recorded as the source. Nothing gets paraphrased. If the reviewer's correction changes meaning, the English changes with it.*
