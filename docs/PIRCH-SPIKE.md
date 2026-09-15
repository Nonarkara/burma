# PIRCH Revival — Technical Spike Plan

**Origin:** Dr Non met 2 long-term friends through PIRCH (an IRC client popular in Thailand 1990s-2000s, now discontinued). He wants the small, persistent, community-channel feeling revived for Burmese youth. MIT license required.

**Date:** 2026-09-15

---

## 1. What PIRCH was

- Windows IRC client (proprietary, never open-sourced)
- Popular in Thailand through late 1990s and 2000s
- Pantip thread "Why can't I play Pirch anymore?" exists — clear Thai-user nostalgia
- Listed on Wikipedia under "Discontinued software"
- The feeling it gave: leave the client running in the background, join a #channel, type, meet someone

**What we are reviving:** the *feeling* — small persistent room, low-friction join, persistent scrollback, mobile-usable, MIT-licensed, Burmese-language capable. Not the literal binary.

## 2. The three candidates

| Option | License | Backend | Mobile UX | Active? | Burmese UI |
|---|---|---|---|---|---|
| **The Lounge** (`thelounge/thelounge`) | **MIT** ✓ | Node.js + Vue.js | PWA-installable on iOS/Android/desktop | Yes (Mar 2025) | Locale data present |
| **Convos** (`convos-chat/convos`) | Artistic-2.0 (not MIT) | Perl Mojolicious + Svelte | Responsive web | Yes (2026-07) | Locale data present |
| **Element + Matrix (Synapse homeserver)** | Synapse: AGPL or commercial. Element: AGPL-3.0-or-later | Synapse (Python/Twisted + Rust) + Postgres | Native iOS/Android apps | Yes | Burmese UI supported |

**Recommendation: The Lounge.** Reasons:
1. **MIT license** matches Dr Non's stated preference and is the simplest legal posture for the Burma project (no AGPL contagion, no commercial-license ambiguity).
2. **Smallest deploy** — single Node.js process + ~30MB memory baseline. Survives on a $5 VPS.
3. **Built-in bouncer** — the client holds a persistent connection to IRC servers, preserving scrollback across disconnects. This is the PIRCH-feel preserved exactly.
4. **PWA install** — Burmese youth install it from the browser to their home screen. Behaves like a native app without the App Store / Play Store review cycle.
5. **IRCv3 spec compliant** — future-proof if we bridge to existing IRC networks later.
6. **Active maintenance** — last release March 2025, 5.8k stars, 250 forks, 53 contributors.

## 3. Deploy target

- **Host:** Hetzner Cloud CX22 (2 vCPU, 4GB RAM, 40GB SSD) — €4.35/month ≈ ฿160
- **Alternative:** DigitalOcean Basic Droplet $6/month — same ballpark
- **Region:** Singapore (closest to Myanmar + Thailand latency profile)
- **Reverse proxy:** Caddy with automatic Let's Encrypt
- **IRC backend:** Ergo IRCd (modern Go-based IRC server, MIT) — runs alongside The Lounge on the same VPS
- **Why self-host IRC vs. join a public network:** Burmese-language channels on public IRC networks get spammed, abandoned, or taken over. We run our own network. Joining existing networks later is one config change.

## 4. Spike deliverables (1-2 days, single engineer)

1. ✅ Pick The Lounge, deploy on a Hetzner CX22
2. ✅ Configure with Burmese locale (`mm`) at the top of the language selector
3. ✅ Custom theme — saffron accent on warm paper (matches AGENTS.md §5 house), zero rounded corners, no shadow, hairline borders
4. ✅ Set up 3 starter channels:
   - `#monastic-youth` — for monks and monastery-educated youth (relevant given our sample scenario)
   - `#bkk-burmese` — Bangkok diaspora general
   - `#cm-burmese` — Chiang Mai
5. ✅ Provision 3 IRC operators (moderators) — Burmese-speaking volunteers
6. ✅ PWA manifest + icons (Burmese-script-friendly)
7. ✅ Smoke test: open from iOS Safari, Android Chrome, Redmi A03 (low-end Android) — confirm Burmese renders, PWA installs, scrollback persists

**Theme file:** `docs/pirch-theme.css` — drop into The Lounge at `public/themes/burma.css`, enable with `/msg Theme Burma`.

**Aesthetic reference:** `docs/reference-pirch98.png` + `docs/PIRCH-AESTHETIC.md`. The theme keeps PIRCH98's information density, member lists, multi-channel view, status line, and system-message semantics — and cuts the 1990s chrome (3D bevels, gray borders, Windows menu bar).

## 5. Burmese rendering — known risks

Burmese script rendering is renderer-sensitive. Specifically:
- Older Android WebView (pre-Chromium 90) drops dotted consonants
- iOS Safari is generally reliable but uses Myanmar Text by default; we override with Noto Sans Myanmar via `@font-face`
- Line-height: Burmese script needs ~1.6 leading minimum (Latin is fine at 1.4)
- The Lounge uses a CSS-respecting theme system, so we can ship a custom `burma.css` to ensure rendering

## 6. What this surface gives the Burma project

In the user journey (AGENTS.md §3), the persistent community channel sits at step 5 — after quest completion, after atlas lookup, after mentor reflection. It is not the entry point. It is the place where Burmese youth keep talking to each other about what they chose.

This is the missing layer. Quests surface strengths. Atlas surfaces paths. Mentor reflects. But peer-to-peer conversation is what converts a discovery moment into a sustained direction. PIRCH was that for Dr Non in the 2000s. The Lounge + Burmese PWA can be that for Burmese youth in 2027.

## 7. Open risks

1. **Spam and moderation.** IRC has no built-in content moderation. We need Burmese-speaking operators active 12+ hours/day. Si Thu Maung's Sabai Job team likely has moderation capacity we can leverage.
2. **Sanctions.** A community where Burmese users discuss emigration plans, work permits, and job brokers is exactly the kind of surface that draws scrutiny from Myanmar's military intelligence. The platform must be **Thai-resident** (server in Singapore/Hetzner Singapore, domain hosted via Thai or international registrar, no Myanmar-state contracts).
3. **Mobile data costs.** Burmese workers in Thailand often use prepaid SIMs with tight data budgets. The PWA must load on a 3G connection in under 3 seconds with the first scrollback already rendered. The Lounge ships with ~50KB first-load — well within budget.
4. **Liveness without creep.** Persistent channels can become dead channels. PIRCH's original feel required a critical mass of lurkers + a few regulars. We need a 100-200 user launch cohort, not 5,000 on day one.

## 8. Cost

- VPS: ~฿160/month (฿1,920/year)
- Domain: ~฿600/year for `.org` or `.net`
- Email + DNS: ~฿0 (use existing Axiom Cloudflare)
- Total: **~฿2,500/year** to keep a small community running

This is the cheapest piece of the entire Burma project. Build the rest; this slot fits the spare change.

---

*Status: not deployed. Awaiting Dr Non's call to provision Hetzner + pick domain. Then 1-2 day spike can complete.*