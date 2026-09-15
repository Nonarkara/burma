# Pirchchat — Platform Spec

**Codename:** A-Lin-Ein (အလင်းအိမ် — The Lighthouse)
**Brand:** Pirchchat
**Date:** 2026-09-15
**Status:** Architecture decision. Pilot scope expanded from "career navigator with embedded community" to "community platform with embedded career navigator."

---

## 1. What Pirchchat is

A Burmese-language community platform built around persistent public rooms (the IRC-style "Pirchchat" rooms Dr Non remembers from his own introduction to the internet in 1990s Thailand), with three additional surfaces layered on top:

1. **Rooms** — old-school IRC-style public chat. Always-on. Persistent scrollback. Multi-room. Member lists visible. Connection status visible.
2. **Digest** — Dr Non's news-digest algorithm applied to Myanmar + Burmese diaspora sources daily. Burmese-language summary, surfaced inside the room where relevant.
3. **Listening** — social-listening dashboard showing what people are talking about across Burmese-language sources globally. Trend lines, topic clusters, source map.
4. **Atlas** — world map of where Burmese people are talking from. Conversation hotspots. Diaspora geography. Migration corridors (Mae Sot–Myawaddy, Yangon–Bangkok, etc.).

All four surfaces share the same Burmese-script-first UX, the same 16-bit / Chicago-era visual register, the same anti-slop house rules.

The original TKCX-Youth Navigator (quest mechanics, atlas of training/scholarships, AI mentor) becomes the **Career Navigator** surface — a fifth surface under Pirchchat, surfaced as `#career-navigator` room in the chat and as a guided flow accessible from the Atlas.

## 2. Audience

- Burmese youth (16–28) in Myanmar + Thai diaspora (BKK / CM / Pathum Thani) + global Burmese-speaking
- Burmese-speaking professionals, monks, students, migrant workers
- Anyone who wants to know what is happening in Myanmar and Burmese communities worldwide

**Not** Burmese-language journalism consumers. Not just job seekers. Not just youth. The community surface serves anyone who wants to be in a persistent Burmese-language room with peers.

## 3. Surfaces — architecture

### Surface 1: Rooms
- **Engine:** The Lounge (Node.js + Vue.js, MIT)
- **Hosting:** Hetzner CX22 Singapore
- **Backing IRC server:** Ergo IRCd (Go, MIT) — runs alongside The Lounge on the same VPS
- **Mobile:** PWA install via browser, sharp edges, no shadows, saffron accent
- **Aesthetic:** PIRCH98 DNA ported to 2026 — see `PIRCH-AESTHETIC.md`
- **Burmese rendering:** Noto Sans Myanmar fallback via `[lang="my"]` in `pirch-theme.css`
- **Moderation:** Burmese-speaking IRC operators (3 at launch)
- **Sample rooms at launch:**
  - `#monastic-youth` — monks + monastery-educated youth
  - `#bkk-burmese` — Bangkok diaspora general
  - `#cm-burmese` — Chiang Mai
  - `#career-navigator` — links to TKCX-Youth quest engine
  - `#digest-today` — daily news digest discussion
  - `#listening-club` — social listening trend discussion

### Surface 2: Digest
- **Algorithm:** Port Dr Non's `dr-non-digest` skill into a Burmese-language pipeline
- **Sources:** Burmese-language news (DVB, RFA Burmese, Mizzima, The Irrawaddy, Eleven Myanmar), Thai-Burmese community publications, ASEAN region feeds, academic RSS feeds
- **Frequency:** Daily digest at 06:00 ICT (Burmese morning). Weekly digest on Sunday 18:00 ICT.
- **Output:** Burmese-language summary with linked sources. Surface inside `#digest-today` room and as a static page.
- **Moderation:** Human review before posting (model + Burmese reviewer). No model-only output.

### Surface 3: Listening
- **Engine:** Social listening aggregation. Burmese-language sources + diaspora social media (public posts only, no PII collection).
- **Visualization:** Trend lines (topics over time), topic clusters (grouped by embedding similarity), source map (where each post comes from geographically).
- **Refresh cadence:** Every 6 hours. Live updates surfaced in `#listening-club`.
- **Privacy:** Aggregate-only. No usernames. No individual posts. No Myanmar-state-collected data.

### Surface 4: Atlas
- **Engine:** MapLibre GL + PMTiles + Esri imagery basemap. (Same stack as `bkk-3d-atlas` and `hcmc-3d-atlas`.)
- **Layers:**
  - Burmese diaspora density by city (public data: census, UNHCR, Thai Ministry of Labour)
  - Migration corridors (Mae Sot–Myawaddy, Yangon–Bangkok, Yangon–Mandalay, etc.)
  - Live conversation hotspots from Listening (anonymized)
  - Burmese-language community organizations and NGOs
  - News origin markers (where stories broke, last 30 days)
- **Mobile:** Pan + pinch on touch. Tooltips on tap. No popovers, no overlays, no AI glow.
- **Style:** Matches house. Sharp edges. Saffron accents. No gradients.

### Surface 5: Career Navigator (formerly TKCX-Youth)
- **Engine:** TKCX quest mechanics (adapted from Axiom/TKCX lineage)
- **Surfaces:** Quest gameplay (`/quest/[id]`), AI mentor (`/mentor`), training atlas (`/atlas/courses`), profile (`/profile`)
- **Integration:** Embedded into Pirchchat rooms as commands (e.g., `/quest`, `/atlas`) and as standalone web pages accessible from the Atlas surface.
- **Boundaries:** Same as AGENTS.md §1 — Thai-side data only, no Myanmar-state contracts, Burmese-script-first, discovery-not-diagnosis, real-human escalation for crisis.

## 4. Tech stack — pinning

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vanilla JS + Svelte (where it helps) | Cheap. Fast. No React. Burmese Unicode is renderer-native. |
| Build | Vite | Faster than Next.js for a non-SEO surface |
| Map | MapLibre GL + PMTiles + Esri imagery | Proven pattern from BKK/HCMC atlases. No Mapbox bill. |
| IRC | The Lounge + Ergo IRCd | MIT. Persistent scrollback. Multi-user. PWA-installable. |
| Backend | Cloudflare Workers + D1 (KV cache, R2 for static) | Cheap. Fast. Edge-rendered Burmese content. |
| News ingestion | RSS + Burmese-language NLP | Public sources only. No Myanmar-state feeds. |
| Listening | Public social aggregation + Burmese NLP | No PII. Aggregate only. |
| DB | Postgres (Neon) — Singapore region if available | For career navigator profiles + atlas entries. |
| Auth | Telegram Mini-App initData for Telegram users; magic link for PWA users | Telegram Mini-App has huge Burmese diaspora reach. |
| Hosting | Vercel for static, Hetzner CX22 for IRC VPS, Cloudflare for edge | Mixed by surface. |

## 5. Visual register — 16-bit / Chicago-era, anti-slop

See `16BIT-AESTHETIC.md` for full spec. Headlines:

- **Chicago design language (Win95 / System 7-9 era)** — titlebar, menubar, statusbar, work area. Flat rendered.
- **Sharp edges everywhere.** `border-radius: 0` enforced globally.
- **No drop shadows.** `box-shadow: none` enforced globally.
- **No gradients.** `background-image: none` on chrome.
- **Limited color palette.** 12 named colors max, semantic only.
- **System-font feel.** IBM Plex Sans / IBM Plex Mono + Noto Sans Myanmar fallback.
- **Tight grid.** 8px base unit. Pixel-aligned borders.
- **No emoji as design elements.** Labels only.

## 6. Naming — Pirchchat inside A-Lin-Ein

The community brand is **Pirchchat**. The codename is **A-Lin-Ein** (the lighthouse). They are not in conflict:

- **Pirchchat** is what users see and call it.
- **A-Lin-Ein** is what IP, contracts, and governance docs reference.
- The Burmese-language tagline for Pirchchat would translate naturally into something like "ပျော်ရွှင်စရာ ပါတ်ချက်ချတ်" — a light, social chat. But the actual Burmese name needs a native speaker's review before publication.

## 7. Boundaries (binding — unchanged from AGENTS.md §1)

1. Thai-side data + Burmese diaspora only. No Myanmar-state data contracts.
2. No junta ministry partnerships without a written sanctions opinion.
3. Burmese-script-first UX.
4. Discovery, not diagnosis.
5. Real human escalation for crisis.

Pirchchat adds one more boundary specific to its expanded scope:

6. **No PII collection in any surface.** The Lounge, Digest, Listening, Atlas, and Career Navigator all collect aggregate-only data by default. Profile creation is opt-in, gated to verified Burmese speakers, and stored encrypted.

## 8. Cost (annual, rough)

- Hetzner CX22 Singapore (IRC + Ergo): ฿1,920/year
- Vercel Hobby (static surface hosting): ฿0–2,400/year depending on traffic
- Cloudflare Workers free tier: ฿0
- Domain: ฿600/year for `.org` or `.net`
- Postgres Neon (Singapore region): ฿0–2,400/year depending on usage
- Atlas PMTiles archive: ~฿500/year storage

**Total estimate:** ~฿5,000–8,000/year to keep the platform running. The expensive parts are the Burmese reviewers and the Burmese NLP pipeline, which are human-hours not infra.

## 9. What changes from the original Burma proposal

| Original | Now |
|---|---|
| TKCX-Youth Navigator (5-month pilot, 2-5K youth) | Pirchchat platform (chat + digest + listening + atlas + career navigator) |
| Sabai Job unclear relationship | Same — clarify with Si Thu Maung |
| Pilot KPIs (3,000 active, 78% completion, 100 verified placements) | Same targets but redistributed across 5 surfaces |
| HubSpot-style marketing site | Marketing-free PWA, surface 1 is the front door |
| One-room IRC at most | Multi-room IRC with 6+ rooms at launch |

## 10. Open decisions for Dr Non

1. **Surface 1 only first, or all 5 at once?** — recommended: ship Surface 1 (Rooms) as a closed alpha, then add Digest, Listening, Atlas, Career Navigator in sequence over 6 months.
2. **Pirchchat or A-Lin-Ein as the user-facing name?** — recommended: Pirchchat for users, A-Lin-Ein for IP.
3. **Domain.** — recommended: `pirchchat.org` if available, otherwise `a-lin-ein.org` or `lighthouse.community`.
4. **Dr Non's digest algorithm** — port it now or build Burmese-specific version first? — recommended: build Burmese-specific. The Dr Non digest was for English-language general sources; Burmese needs its own NLP work.
5. **Budget approval** — ~฿5,000-8,000/year infra, plus Burmese reviewer hours.

---

*Owner: Dr Non (Axiom Decision Systems). Reviewers: Burmese-speaking moderator, Burmese NLP reviewer, sanctions opinion before any Myanmar-state-adjacent work.*