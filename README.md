# Pirchchat — A-Lin-Ein (အလင်းအိမ် — The Lighthouse)

A Burmese-language community platform with five surfaces:

1. **Rooms** — persistent IRC-style public chat rooms (old-school Pirchchat-style)
2. **Digest** — daily Burmese-language news digest
3. **Listening** — social listening trends from Burmese-language sources globally
4. **Atlas** — world map of where Burmese people are talking from
5. **Career Navigator** — TKCX-Youth quest scenarios, AI mentor, training atlas

Visual register: 16-bit / Chicago design language (Win95 / Mac System 7-9 era), flattened for 2026. Sharp edges. No shadows. No gradients. Limited palette. Burmese-script-first.

## Architecture

See `docs/PIRCHCHAT-PLATFORM.md` for the full surface breakdown, tech stack, and IP boundaries.

## Boundaries

See `AGENTS.md` §1. Short version:

1. Thai-side data and Burmese diaspora only. No Myanmar-state contracts.
2. No junta ministry partnerships without a written sanctions opinion.
3. Burmese-script-first UX. English is a secondary toggle.
4. Discovery, not diagnosis. No clinical framing.
5. Real-human escalation for crisis. Not model refusal.
6. No PII collection by default across all five surfaces.

## Stack

- Next.js 16 (or Svelte for non-SEO surfaces) + React 19 + TypeScript 5
- Tailwind v4 with inline `@theme` tokens, matching `docs/16BIT-AESTHETIC.md`
- `next-intl` for Burmese Unicode-native locale routing
- The Lounge (MIT) for IRC rooms on Hetzner Singapore
- MapLibre GL + PMTiles + Esri imagery for the Atlas surface
- Cloudflare Workers + D1 for listening and digest edges
- Postgres (Neon) Singapore region for persistent data

## Docs

All project specs live in `docs/`:

- **`PIRCHCHAT-PLATFORM.md`** — five-surface architecture
- **`16BIT-AESTHETIC.md`** — Chicago-era house tokens and visual rules
- **`PIRCH-AESTHETIC.md`** — PIRCH98 DNA translated to 2026
- **`pirch-theme.css`** — drop-in CSS theme for The Lounge deployment
- **`PIRCH-SPIKE.md`** — The Lounge deploy plan
- **`SABAI-AUDIT.md`** — Sabai Job tech audit, three integration shapes
- **`COUNTER-PROPOSAL.md`** — reply to Si Thu Maung's TKCX-Youth proposal
- **`reference-pirch98.png`** — Wikipedia screenshot, CC-licensed

## Status

Pre-pilot. Scaffold only. Architecture decision made; counter-proposal drafted; deployment to Hetzner pending Dr Non's call.

## Co-proposers

- **Si Thu Maung** — GovTech Youth Initiative (Burmese NLP, employer network, atlas data)
- **Dr. Non Arkaraprasertkul (Dr. Non Arkara)** — Axiom Decision Systems (quest design, mentor, advisory, IP)
