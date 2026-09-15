# Counter-Proposal — Pirchchat (working title: A-Lin-Ein)

**To:** Si Thu Maung, Co-Founder & CSO, Sabai Job; AI Master Trainer, ASEAN Youth Organization; Executive Program Director, HARBOUR.SPACE@UTCC
**From:** Dr Non Arkaraprasertkul, Axiom Decision Systems
**Date:** 2026-09-15
**Re:** Reply to your TKCX-Youth AI Career & Skills Discovery Navigator pilot proposal

---

## 1. What you proposed

A 5-month pilot (Oct 2026 – Apr 2027) for 2,000–5,000 Burmese youth (16–28), building a single AI Career & Skills Discovery Navigator with quest scenario assessments, a Burmese AI mentor, and a verified courses/scholarships/jobs atlas. Co-delivered by GovTech Youth Initiative (you) and Axiom Decision Systems (us). Pilot KPIs: 3,000 active participants, 78% completion velocity, 100 verified placements in 60 days.

## 2. What we are actually building

We've spent the last few weeks auditing what's already in your orbit. **Sabai Job** is a verified blue-collar job platform for Myanmar workers in Thailand, founded by Min Myat Swan Pyae (CEO, from Mawlamyine near the Myanmar-Thailand border) and Jirapat Chaosing, with you as CSO since August 2023. 3,000+ verified workers. 22,000-member Facebook community. 18 industries. Thai / Burmese / English app. Free for workers, always. Plus your network through ASEAN Youth Organization, Harbour.Space@UTCC, and EDA (Thailand) Co., Ltd.

That changes the proposal from "build a new platform" to "add a community + discovery surface to the one you already run."

We are calling the community platform **Pirchchat**. The internal codename is **A-Lin-Ein** (အလင်းအိမ် — The Lighthouse), which is what IP, contracts, and governance docs reference. Pirchchat is the user-facing name.

Five surfaces under one roof:

1. **Rooms** — old-school IRC-style persistent public rooms. Deployed on Hetzner Singapore via The Lounge (MIT). Burmese-speaking IRC operators. PWA-installable on mobile.
2. **Digest** — Dr Non's news digest algorithm, ported to Burmese-language sources. Posted daily at 06:00 ICT in `#digest-today`.
3. **Listening** — social listening trends from Burmese-language sources globally. Aggregated only. No PII. Surfaced in `#listening-club`.
4. **Atlas** — world map of where Burmese are talking from. Diaspora density. Migration corridors. Source map. MapLibre + PMTiles + Esri imagery, same stack as the BKK and HCMC atlases.
5. **Career Navigator** — your original TKCX-Youth proposal, surviving as this surface. Quest engine, AI mentor, training + scholarship + jobs atlas. Embedded as a `#career-navigator` room and a guided web flow.

Aesthetic: 16-bit / Chicago design language. Win95 / System 7-9 era visual register, flattened for 2026. Sharp edges. No shadows. No gradients. Limited palette. Burmese script natural throughout. This is not a Sabai-style app.

## 3. The Sabai ↔ Pirchchat architecture

**Recommendation: Option B. Two surfaces, one journey, deep-link between.**

- Pirchchat owns the quest engine, AI mentor, rooms, listening dashboard, atlas, and the user identity layer.
- Sabai Job owns verified job listings, employer relationships, the placement workflows that already work at 3,000+ verified workers and 22K community members.
- A user finishes a Career Navigator quest, sees a recommended path (e.g., "Renewable Energy Technician near Mae Sot"), taps to view verified Sabai Job listings in that region, and lands in Sabai's app via deep-link.

We do not recommend Option A (re-skin Sabai with a Burmese-youth layer on top). It would keep Sabai's architecture intact at the cost of painting Axiom into a corner if you and Min Myat Swan disagree about roadmaps later.

We do not recommend Option C (parallel projects that share only a brand). Duplicates work and weakens the diaspora narrative.

**Open question for you.** What does the Sabai ↔ Pirchchat hand-off look like in your current roadmap? Have you and Min Myat Swan already modeled the deep-link flow? Is there a Sabai Job API or does one need to be designed?

## 4. Axiom's contribution

- Quest authoring template and TKCX scenario adaptation for Burmese context.
- AI mentor pipeline with safety guardrails. Crisis keywords route to real-human hotline numbers in Burmese. Never model refusal.
- Listening dashboard architecture.
- Atlas PMTiles archive plus MapLibre rendering pipeline.
- Go / no-go decision authority on Axiom surface deliverables.

Axiom does not provide:
- The Burmese NLP pipeline. Dr Non's digest was English. Burmese-language requires its own reviewer budget and pipeline.
- Employer / scholarship / network relationships. Those are GovTech's surface.
- The verified placement of 100 youth in 60 days. That KPI is Sabai's surface, not Axiom's.

## 5. Boundaries — non-negotiable, say these on the first call

1. **Thai-side data and Burmese diaspora only.** No Myanmar-state data contracts. No Customs. No Ministry of Labour. No GAD. No Ministry of Culture data partnerships. The platform serves Burmese youth in Thailand and aspirationally in Myanmar. Data, compute, and contractual touchpoints stay on the Thai side unless a sanctions-cleared review explicitly opens the Myanmar side.
2. **No junta ministry partnerships.** Any Myanmar-government counterpart comes with a written sanctions opinion (EU, US, UK) attached to the contract, before integration work begins.
3. **Burmese-script-first UX.** English is a secondary toggle. Not bilingual as a translated English-first UI.
4. **Discovery, not diagnosis.** Youth explore strengths via quests. The AI mentor reflects. It never labels.
5. **Real-human escalation for crisis.** Self-harm, exploitation, trafficking, deportation-fear keyword triggers route to an in-session banner with Burmese-language hotline numbers. Real humans. Not model refusal.
6. **No PII collection by default across all five surfaces.** Profile creation is opt-in, gated to verified Burmese speakers, stored encrypted.

## 6. IP terms

- Axiom owns the quest library and scoring rubric (TKCX lineage). Burmese-context adaptations are derivative of Axiom IP.
- GovTech Youth Initiative gets a non-commercial pilot license for the Burmese-context quest library, for the duration of the pilot.
- Axiom retains the right to reuse the quest library and scenario adaptations for other humanitarian or ASEAN contexts (Lao PDR, Cambodia, etc.).
- GovTech owns the Burmese LLM pipeline, atlas data ingestion, employer and scholarship relationships, and any product surface unique to this pilot.
- Joint ownership: anonymized pilot telemetry, used for the whitepaper and nothing else.

This is the position Axiom will take on the first call. We will not concede it.

## 7. Pilot success metrics — split

**GovTech measures:**
- 3,000 verified completions across Myanmar and Thailand.
- 78% completion velocity among users who start.
- 40% click-through from atlas entries to applications.
- 100 verified placements in 60 days.

**Axiom measures:**
- Quest scoring distribution. Look for clustering that suggests rubric bias.
- Mentor escalation rate. The target is to escalate when warranted, not to minimize escalations.
- Safety incident count. Target: zero.
- Atlas entry freshness. Target: 90% or more of entries have `verifiedAt` within 60 days.
- PWA load budget on 3G. Target: under 15MB first-load, under 3s LCP on a Redmi-class device.

We will not co-sign the placement KPI. That KPI is Sabai's surface.

## 8. Exit criteria — what happens after the pilot

Whitepaper and state-level pitch in April 2027.

If the state-level pitch does not happen, the platform:
- Continues as a community, closed-alpha only.
- Hands placement-surface continuation to Sabai Job.
- Axiom extracts the reusable Burmese quest library for other contexts.
- Written in the agreement, not implied.

## 9. Cost — Axiom surface only

- Infra (Hetzner + Vercel + Cloudflare + domain): ฿5,000 to ฿8,000 per year.
- Burmese reviewers, one or two: ฿30,000 per year stipend each.
- Burmese NLP pipeline, port of Dr Non's digest algorithm: ฿100,000 one-time development.

GovTech surface costs are yours to model. Total pilot cost is yours to project.

## 10. Next steps

1. **Get Min Myat Swan Pyae on a call.** Tell him what is in Sections 2, 3, and 7 above. The Sabai ↔ Pirchchat architecture is a three-way conversation, not two.
2. **Send Axiom the Sabai deep-link spec** if it exists, or schedule a 30-minute walk-through of the current Sabai Job API surface.
3. **Three working sessions before Phase 1 begins (Oct 1):**
   - Session 1: confirm Sabai ↔ Pirchchat architecture is Option B.
   - Session 2: review Axiom's quest authoring template against your Burmese scenario list.
   - Session 3: sanctions opinion scoping and Burmese reviewer recruitment.
4. **Phase 1 begins Oct 1** with closed-alpha Rooms deployment on Hetzner Singapore.

— Dr Non

---

*Drafted 2026-09-15. Reply to the TKCX-Youth proposal. To be sent via Si Thu Maung's preferred channel (LinkedIn, Telegram, or in person at EDA).*