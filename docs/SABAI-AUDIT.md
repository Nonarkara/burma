# Sabai Job — Technical Audit

**Source:** sabaijob.com, LinkedIn, Play Store listing, Sabai Job "Our Story" page
**Date:** 2026-09-15
**Purpose:** Decide if Sabai Job's existing stack is a foundation we can build on, fork, or integrate against — before writing a single line of Burma project code that touches it.

---

## 1. The product

- **What:** Verified blue-collar job marketplace for Myanmar migrant workers in Thailand
- **Reach:** 3,000+ verified workers, 22,000-member Facebook community, 18 industries
- **Languages:** Thai, Burmese, English (in app, listings, and chat)
- **Pricing:** Free for workers, premium placement for employers
- **Founded:** Aug 2023 by Harbour.Space@UTCC students (Min Myat Swan Pyae, Si Thu Maung, Jirapat Chaosing)

## 2. Tech stack — what runs where

### Marketing site (sabaijob.com)
- **CMS:** HubSpot CMS (portal `45375985`, generation tag visible in HTML)
- **Frontend:** HubSpot template engine + hand-rolled CSS in `hubfs/` paths
- **Typography:** Bricolage Grotesque (Google Fonts)
- **Analytics:** GA4 + GTM + BlokId pixel
- **Company registration:** DBD-registered (Thailand), number `0105568235120`
- **No open-source code** — fully proprietary, hosted on HubSpot's infra

### Mobile apps
- **iOS:** App Store ID `6780230431`, native Swift (likely)
- **Android:** Play Store ID `com.sabaijob.th`, native (likely Kotlin)
- **Burmese UI:** Ships with Thai/Burmese/English — proves the Burmese script rendering problem is already solved at native-app level on App Store / Play Store devices

### Backend
- Not directly observable from the public site. Likely Node.js or Python on a managed cloud, behind an API the apps talk to. **No public GitHub repo found** — searched `sabaijob`, `sabai-job`, `sabaijob.th`, and `MinMyat Swan` with no relevant results.

## 3. What this means for the Burma project

### The good
1. **Sabai Job already does the placement layer** — verified workers, Thai-side employers, Burmese-language UI. We do not need to rebuild it.
2. **The Burma-script-native mobile problem is solved.** Their apps prove Burmese Unicode + IBM Plex / Pyidaungsu rendering works on App Store / Play Store. We can study their fonts and layout choices.
3. **The 22K Facebook community is a real distribution channel** — Si Thu Maung can move users, not just build features.
4. **The 18-industry taxonomy is operational data.** We don't need to guess which industries matter; Sabai Job already knows (hospitality, F&B, construction, factory, cleaning, logistics, security, agriculture, retail + 9 more).

### The bad
1. **No open source to fork.** Building on Sabai's backend means either an API integration or a contract. We cannot just clone their code.
2. **Proprietary mobile apps.** We cannot reuse Sabai's iOS/Android binaries. Anything we build mobile-side competes with them rather than complements them.
3. **HubSpot marketing site has slop risks** — Bricolage Grotesque is a trending Google Font, blob shapes in the hero, smiley stickers, gradient pink/yellow accents. This is the visual register we explicitly reject for Burma (AGENTS.md §3). Different house, different standards.
4. **Sabai's verifier logic (worker ID checks, employer business-reg checks) is closed.** We would need to either trust Sabai's API output or duplicate it.

## 4. Three integration shapes

| Option | What Axiom builds | Who owns the data | Risk | Cost (Axiom) |
|---|---|---|---|---|
| **A. Sabai IS the platform** | Re-skin Sabai Job with Burmese youth discovery layer added on top; integrate via Sabai API | Sabai owns core, Axiom owns discovery UI | Lowest technical risk. Highest IP risk — we depend on Sabai's roadmap | ~4-6 weeks of quest engineering |
| **B. Upstream discovery → downstream placement** | Build separate TKCX-Youth Navigator. When a user finishes quests + wants a job, deep-link to Sabai Job app via mobile app install | Two surfaces, two accounts | Clean architecture. Duplicate identity layer | ~8-12 weeks. Worth it. |
| **C. Parallel projects** | Two completely independent platforms | Each owns its data | Highest cost, weakest moat | ~12+ weeks. Avoid. |

**Recommended:** Option B. Reasons:
- Preserves Axiom IP ownership of the quest library
- Preserves Sabai's existing traction and product surface
- Each side does what it's good at
- Users get one coherent journey without a forced merge

## 5. Open questions for Si Thu Maung

1. **Is there a public Sabai Job API?** If yes, what's the auth model and rate limit? Without one, Option B requires negotiation.
2. **Worker verification logic** — is it reusable for youth-discovery? (Probably not directly, but worth knowing what exists.)
3. **The 22K Facebook community** — is there appetite inside it for a separate "discovery first, placement later" flow, or do workers expect instant placement?
4. **Sabai's Burmese localization team** — who did the Burmese script work? Can they review Axiom's quest Burmese content? (Avoids us paying separately for Burmese review.)

## 6. The visual slop test

Sabai Job's marketing site is **visually busy** by Dr Non's house rules. It uses:
- Blob shapes in the hero
- Pink + yellow color accents
- Smiley sticker graphics
- Bricolage Grotesque (a "trending AI default" font)
- Gradient background sections

For **Burma**, we explicitly reject all of the above (AGENTS.md §3). The two platforms should look like they come from different visual philosophies. Sabai is a friendly marketing site for low-friction sign-up. Burma is a sharp, monochrome, Burmese-script-first tool for thinking.

This is not a knock on Sabai. It's a different audience (workers who need to trust a brand fast) versus ours (youth who need to think hard about their future). The registers are correct for each.

---

*Owner: Dr Non (Axiom). Next: decide between Options A and B before scheduling the next conversation with Si Thu Maung.*