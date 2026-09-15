# Pirchchat — A-Lin-Ein (အလင်းအိမ် — The Lighthouse)

A Burmese-language community platform with five surfaces: persistent chat rooms, news digest, social listening, world atlas, and a career navigator for youth.

**Brand**: Pirchchat (Dr Non's spelling — community-facing)
**Codename**: A-Lin-Ein (အလင်းအိမ် — *The Lighthouse*, IP + contracts + governance)
**Aesthetic**: 16-bit / Chicago design language (Win95 / Mac System 7-9 era), anti-slop rules applied — see `docs/16BIT-AESTHETIC.md`
**Co-proposers**: Si Thu Maung (GovTech Youth Initiative) · Dr. Non Arkaraprasertkul (Axiom Decision Systems)
**Cohort**: Burmese youth (16–28) + Burmese-speaking diaspora in Thailand + globally
**Pilot launch**: February 2027

---

## 1. Hard boundaries (read first, every session)

These are pre-committed. Do not cross them without an explicit decision from Dr Non.

1. **Thai-side data + Burmese diaspora only.** No Myanmar-state data contracts (no Customs, no Ministry of Labour, no GAD, no Ministry of Culture). The platform serves Burmese youth *in Thailand* and *aspirationally in Myanmar* — but data, compute, and contractual touchpoints stay on the Thai side unless a sanctions-cleared review explicitly opens the Myanmar side.
2. **No junta ministry partnerships.** Any Myanmar-government counterpart must come with a written sanctions opinion (EU + US + UK) attached to the contract, before integration work begins.
3. **Burmese-script-first UX.** Burmese (Unicode) is the primary language. English is secondary toggle. Do not translate Burmese into English-only UI and call it bilingual.
4. **Discovery, not diagnosis.** No clinical or psychometric framing. Youth explore problem-solving strengths via quests; the AI mentor reflects, never labels.
6. **No "AI mentor" without escalation.** Any LLM response that touches crisis (mental health, displacement, exploitation, exploitation risk) must route to a real human referral partner. No model-only safety string.

## 2. Stack (pin these)

- **Framework**: Next.js 16.2.1 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind v4 (inline `@theme` tokens, no `tailwind.config.ts` needed)
- **i18n**: `next-intl` (locale routing, Burmese Unicode native)
- **PWA**: `@ducanh2912/next-pwa` or hand-rolled `manifest.webmanifest` + service worker
- **Telegram Mini-App**: `@telegram-apps/sdk` + `@telegram-apps/react-router`
- **AI mentor**: provider TBD (Llama 3.1 70B fine-tune, or Claude/GPT with Burmese system prompt + RAG over local content)
- **DB**: Postgres (Neon) + Drizzle ORM
- **Auth**: Telegram Mini-App initData signature for Telegram users; magic link for PWA users
- **Hosting**: TBD (Vercel/Cloudflare/your own VPS — see hosting note in §11)

## 3. Anti-slop (binding)

The 27 tells from `slop-detect` apply. Specifically for this project, plus the 16-bit / Chicago-era discipline:

- **No rounded corners.** House radius = 0. The 1990s era had sharp edges and so do we.
- **No purple/violet/indigo.** Single accent only (saffron). Excluded from palette.
- **No glassmorphism.** Solid surfaces only — the era was honest about what a computer was.
- **No emoji as design elements.** Labels only.
- **No "empathetic AI" copy.** Mentor voice is calm, plain, Burmese-script-natural. No exclamation marks. No "I'm here to help you discover…" openers.
- **No AI sparkle / glow.** Text + Burmese script + data, not animation.
- **No gradient text.** Emphasis via weight or letter-spacing.
- **No gradients anywhere.** Chicago-era chrome is flat. `background-image: none` on chrome elements.
- **No drop shadows.** `box-shadow: none` globally.
- **Real Burmese content.** Sample names, monasteries, townships, commodities — not lorem ipsum in Burmese Unicode.

## 4. Typography

- **Display (titles, headings)**: `Noto Serif Myanmar` (or `Myanmar Text` if Serif unavailable). Sharp, traditional, readable at large size.
- **Body (paragraphs, UI)**: `Noto Sans Myanmar` (or `Pyidaungsu`). Designed for on-screen reading.
- **Numerals / code**: `IBM Plex Mono` (matches your TKC stack).
- **Never** Inter, Roboto, system-ui, or Sarabun as the primary face. Burmese fallback chain is `Noto Sans Myanmar, Pyidaungsu, Myanmar Text, sans-serif`.

Burmese script rendering is renderer-sensitive. Always test on iOS Safari, Android Chrome, and a low-end Android device (Redmi/A03 class) before declaring a layout done.

## 5. House colors (locked — see `docs/16BIT-AESTHETIC.md` for full palette)

```css
/* Surfaces */
--paper:         #faf9f7;
--chrome:        #e8e3d8;
--chrome-dark:   #d4ccba;
--ink:           #102a43;
--ink-muted:     #486581;
--rule:          #8b7d5e;

/* Accent — saffron (Chicago-yellow + Burmese monk robe) */
--accent:        #d4a017;
--accent-soft:   #f6e9c4;

/* Semantic */
--positive:      #2e7d32;
--negative:      #a51931;
--notice:        #b45309;
--server:        #1d4e89;

/* Reserved */
--highlight:     #f0c800;
```

12 colors total. Saffron is the single accent. Decision locked.

**Historical note:** Earlier versions of this document offered "saffron OR Thailand flag blue" as a choice. That ambiguity is closed. The 16-bit / Chicago-era discipline + the Burmese cultural specificity both point to saffron. Thailand flag blue remains available for cross-project Axiom touchpoints (footer, attribution) but is not the surface accent.

## 6. Directory layout

```
Burma/
├── AGENTS.md                    # this file
├── README.md                    # project overview, status
├── package.json
├── tsconfig.json
├── next.config.ts
├── docs/                        # project specs (committed, versioned)
│   ├── PIRCHCHAT-PLATFORM.md    # 5-surface architecture spec
│   ├── PIRCH-AESTHETIC.md       # PIRCH98 DNA + house translation
│   ├── 16BIT-AESTHETIC.md       # Chicago-era house tokens
│   ├── PIRCH-SPIKE.md           # The Lounge deploy plan
│   ├── pirch-theme.css          # The Lounge CSS theme (drop-in)
│   ├── SABAI-AUDIT.md           # Sabai Job tech audit + integration shapes
│   └── reference-pirch98.png    # Wikipedia screenshot, CC-licensed
├── messages/                    # i18n message catalogs
│   ├── en.json
│   └── my.json
├── src/
│   ├── app/                     # Pirchchat web (Svelte or Next)
│   │   ├── layout.tsx
│   │   ├── page.tsx             # landing — room list + surfaces
│   │   ├── [locale]/
│   │   │   ├── rooms/                      # Surface 1: Rooms
│   │   │   │   └── [channel]/page.tsx
│   │   │   ├── digest/page.tsx             # Surface 2: Digest
│   │   │   ├── listening/page.tsx          # Surface 3: Listening
│   │   │   ├── atlas/page.tsx              # Surface 4: Atlas
│   │   │   ├── quest/[id]/page.tsx         # Surface 5: Career Navigator
│   │   │   ├── mentor/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── api/
│   │   │   ├── mentor/route.ts
│   │   │   ├── quest/[id]/submit/route.ts
│   │   │   ├── atlas/courses/route.ts
│   │   │   ├── digest/today/route.ts
│   │   │   └── listening/trends/route.ts
│   │   └── telegram/page.tsx
│   ├── components/
│   │   └── chrome/              # titlebar, menubar, statusbar, window
│   ├── lib/
│   │   ├── quest/
│   │   ├── mentor/
│   │   ├── atlas/                # career navigator atlas
│   │   ├── digest/               # Surface 2
│   │   ├── listening/            # Surface 3
│   │   ├── map/                  # Surface 4 (MapLibre + PMTiles + Esri)
│   │   ├── i18n/
│   │   └── telegram/
│   └── styles/
│       └── tokens.css
└── public/
    ├── manifest.webmanifest
    └── icons/
```

The IRC deployment (Surface 1: Rooms) lives on a separate Hetzner CX22 VPS, not in this repo. The web app surfaces (Rooms landing + Digest + Listening + Atlas + Career Navigator) live here.

## 7. Data models (initial)

### Quest
```ts
type Quest = {
  id: string;
  version: number;
  locale: 'my' | 'en';
  title: string;
  premise: string;             // 2-3 sentences setting the scene
  constraints: string[];       // explicit limits (budget, time, people)
  choices: Choice[];
  outcomes: Outcome[];         // per-trait rubric mapping
  estimatedMinutes: number;
};
type Choice = {
  id: string;
  label: string;
  rationale?: string;          // optional explainer
  tradeoffs: Record<Trait, number>; // -2..+2 weights
};
type Trait = 'systems_thinking' | 'empathy' | 'analytical_grit' | 'collaboration';
```

### Course / Scholarship / Job (atlas row)
```ts
type AtlasEntry = {
  id: string;
  type: 'course' | 'scholarship' | 'job' | 'apprenticeship';
  title: { my: string; en: string };
  provider: string;
  accreditedBy?: string | null;  // 'TVET', 'depa', 'ASEAN Skills', null
  location: { country: 'MM' | 'TH' | 'other'; city?: string; remote?: boolean };
  languages: Array<'my' | 'en' | 'th'>;
  cost: { amount: number | null; currency: 'THB' | 'MMK' | 'USD' | null; free: boolean };
  durationWeeks?: number | null;
  tags: string[];              // maps to Quest Trait outcomes
  applyUrl: string;
  verifiedAt: string;          // ISO date — last source-check
  source: string;              // 'ilo_isco', 'depa_thailand', 'unesco_bangkok', etc.
};
```

## 8. IP + governance

- Axiom owns the **quest authoring template + scoring rubric** (TKCX lineage). Adaptations for Myanmar context = derivative of Axiom IP, with GovTech Youth Initiative licensed for non-commercial pilot use.
- GovTech Youth Initiative owns the **Burmese LLM pipeline, atlas data ingestion, and employer/scholarship relationships** they bring.
- Joint: pilot telemetry (anonymized, for the whitepaper).
- Axiom retains the right to reuse quest library + scenario adaptations for other humanitarian or ASEAN contexts (e.g., Lao PDR, Cambodia).

This is the position to take on the first call. Do not concede it.

## 9. Pilot KPIs (downgraded from pitch)

The pitch's KPIs are aspirational. Axiom's actual measurement surface:

- Quest **completion velocity** (% who finish a quest once started)
- Quest **scoring distribution** (any clustering that suggests rubric bias)
- Mentor **escalation rate** (% of conversations routed to human)
- Mentor **safety incident count** (target: 0)
- Atlas **click-through rate** by entry type (course / scholarship / job)
- PWA **load budget** on 3G (target: <15MB first-load, <3s LCP on Redmi-class)

The pitch's KPIs (3,000 active, 78% completion, 100 verified placements in 60 days) belong on the **GovTech team's dashboard**, not Axiom's. Don't accept joint accountability for their KPIs.

## 10. Safety + PDPA (binding)

- **No PII collection by default.** All five surfaces (Rooms, Digest, Listening, Atlas, Career Navigator) collect aggregate-only data. Profile creation is opt-in, gated to verified Burmese speakers, stored encrypted. This is the technical meaning of "zero-knowledge architecture" — not a marketing phrase.
- **Minors (16-18 in Thailand)**: parental consent flow before any data collection. Telegram Mini-App users under 18 must complete a guardian attestation step before profile creation.
- **Listening surface**: aggregate-only. No individual posts stored. No usernames. No Myanmar-state-collected data.
- **Crisis escalation**: keyword triggers (self-harm, exploitation, trafficking, deportation fear) → in-session banner with local Burmese-language hotline numbers (Thailand: 1300 Prachabun, Burmese community orgs). NOT model refusal. Real humans.

## 11. Hosting + data residency (TBD)

Axiom default is Cloudflare Workers + R2 (no Mapbox/HERE bills). For Burma:

- App hosting: TBD between Cloudflare Pages (cheap, no Node API) and Vercel (Node API, PWA friendly).
- Data: Postgres on Neon (Thai region if available).
- AI mentor: Anthropic or OpenAI API (no on-prem Burmese LLM capability yet — note this limitation in pilot reports).

**Open question**: Vercel or Cloudflare? Affects the `next.config.ts` shape.

## 12. Si Thu Maung — relationship note (added 2026-09-15)

Dr Non mentored Si Thu Maung at EDA (Thailand) Co., Ltd. for a period before this pitch. Si Thu Maung is also:

- **Product Manager @ EDA (Thailand) Co., Ltd.** (current — Dr Non's paying client)
- **Co-founder & CSO** of Sabai Job (Aug 2023–) — verified blue-collar job platform for Myanmar workers in Thailand. 3,000+ verified workers, 22,000-member Facebook community, Thai-Burmese-English app, free for workers, 18 industries. Already doing the job-placement layer this project needs.
- **AI Master Trainer** at ASEAN Youth Organization
- **Executive Program Director** at HARBOUR.SPACE@UTCC (also a visiting lecturer)
- **MBA, High-Tech Entrepreneurship** — Harbour.Space@UTCC
- **Diploma, Management Studies** — SIM Global Education (Singapore)

Profile inference: British-accent English consistent with SIM Singapore + Harbour.Space + likely elite Burmese private school (Yangon Academy / Yangon International School / equivalent). High-trust background for the Burmese diaspora in Thailand.

**Sabai ↔ Burma project relationship is currently unclarified by Si Thu Maung.** The counter-proposal must ask explicitly.

## 13. Open items for Dr Non

1. **Color accent**: saffron (locked). Cross-project Axiom touchpoints may use Thailand flag blue.
2. **Hosting**: Vercel + Cloudflare + Hetzner CX22 (per-surface) — see `docs/PIRCHCHAT-PLATFORM.md` §4.
3. **AI mentor provider**: TBD. Anthropic / OpenAI / Burmese fine-tune — Phase 2 decision.
4. **Counter-proposal to Si Thu Maung**: draft now. Needs to cover: Sabai ↔ Pirchchat relationship (clarify with him), 5-surface architecture, boundaries, IP.
5. **Sabai ↔ Pirchchat architecture**: clarify with Si Thu Maung. Recommend Option B (separate TKCX-Youth surface that deep-links to Sabai Job for placement) — see `docs/SABAI-AUDIT.md` §4.
6. **Surface sequence**: which surface ships first? Recommended: Surface 1 (Rooms, via The Lounge on Hetzner) as closed alpha. Then Digest, Listening, Atlas, Career Navigator in sequence.
7. **Brand name**: Pirchchat (user-facing) + A-Lin-Ein (IP / contracts). Confirm.
8. **Domain**: `pirchchat.org` if available, else `a-lin-ein.org` or `lighthouse.community`.
9. **Burmese NLP work for Digest**: budget and reviewers. The Dr Non digest was English-language; Burmese needs its own pipeline.
10. **Sample scenarios**: review `src/lib/quest/scenarios.ts` for cultural grounding accuracy. (Monastic solar scenario drafted as starting point — get a Burmese-native review before publishing.)

---

## 14. Status (2026-09-15)

- [x] Boundaries set
- [x] Stack pinned
- [x] Directory layout sketched
- [x] Data models drafted
- [x] AGENTS.md governance
- [x] Pirchchat brand + A-Lin-Ein codename decision
- [x] 5-surface architecture spec (`docs/PIRCHCHAT-PLATFORM.md`)
- [x] 16-bit / Chicago-era aesthetic decision (`docs/16BIT-AESTHETIC.md`)
- [x] PIRCH98 DNA translated (`docs/PIRCH-AESTHETIC.md`)
- [x] The Lounge theme CSS drafted (`docs/pirch-theme.css`)
- [x] Sabai Job audit + 3 integration shapes (`docs/SABAI-AUDIT.md`)
- [ ] Counter-proposal to Si Thu Maung (drafted but not sent)
- [ ] Sanctions opinion (Thai-side only, low urgency)
- [ ] Atlas data source agreements (ILO, depa, UNESCO Bangkok, ASEAN Skills)
- [ ] Hosting picked (per-surface)
- [ ] Domain picked
- [ ] Surface 1 (Rooms) deployed to Hetzner CX22
- [ ] Surface 2 (Digest) Burmese NLP pipeline built
- [ ] Surface 3 (Listening) data ingestion sources confirmed (Thai-side diaspora + diaspora social)
- [ ] Surface 4 (Atlas) PMTiles archive built
- [ ] Surface 5 (Career Navigator) quest authoring template imported from TKCX
- [ ] AI mentor pipeline safety review
- [ ] Burmese-native cultural check (1-2 reviewers) on all surfaces

---

*Owner: Dr Non (Axiom Decision Systems). Updates require explicit decision.*