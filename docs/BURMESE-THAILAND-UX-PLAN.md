# Burmese-in-Thailand design core and implementation plan

Prepared 2 October 2026. Status: concrete proposal; UI changes await alignment and permission to incorporate existing uncommitted work. Research documents are new standalone files. The production browser could not be opened because the in-app browser was unavailable; findings below are source inspection, not a live visual audit.

## Decision to align

Interpret “Palette design core” provisionally as the Axiom design core applied through the project's locked saffron palette. No separate Palette design-system reference was found. Confirm that interpretation before changing the UI. Keep the existing flat, sharp, Burmese-specific 16-bit identity; usability does not require a template re-theme.

The running architecture is static `web/` with Cloudflare Pages Functions and a separate chat Worker. Do not migrate the unused Next.js scaffold as part of this redesign.

## What the audit found

| Finding | User consequence | Proposed correction |
| --- | --- | --- |
| Dense toolbar, many layers and 10–13px controls | Harder phone navigation and Burmese reading | Task-led entry, larger reading text and targets; advanced layers behind a named control |
| English action briefs and partly untranslated labels | Primary users cannot follow a complete task in Burmese | End-to-end Burmese copy with English toggle; native review gate |
| Historical sample news mixes with live RSS | Readers may mistake illustrative policy/salary claims for current news | Separate and clearly label demonstration material; publish current source-backed briefs only |
| Border GeoJSON uses unsourced active/watch states and a fallback to active | Implied operational confidence without evidence | Keep corridor geography; show unconfirmed status unless timestamped evidence exists |
| Clinic/map coordinates are not independently geocoded | A user may navigate to the wrong place | Distinguish area marker from verified entrance; list address and public contact |
| ASEAN programme announcement labelled open | Wasted applications or false hope | Separate announced, open individual call, organisation call and expired |
| News geocoding relies on keywords and fallback coordinates | Inferred map position appears precise | Mark inferred region; omit a pin when location is unknown |
| WIP research page is largely English/Thai despite `lang=my` | Language semantics and audience mismatch | Keep proposal research separate from a Burmese public help flow |
| Service/guide examples lack operational verification | Costly trips or inappropriate referrals | Source/eligibility/date fields; quarantine transactional claims pending checking |

These findings require no removal of live map, radar, media, chart, room or existing content. Preserve material with appropriate provenance and historical/demo states. No file may shrink by more than 30% without the project's explicit approval.

## Proposed experience

The first screen should ask a practical question through four Burmese-first destinations: work and documents; healthcare and trusted help; learning and opportunities; community and skills. Draft Burmese labels must be reviewed before public release. Do not force immigration-status selection. Let users choose an area manually and continue without a profile.

Show a compact “today” strip only for applicable, fresh items. Keep Map, News and Chat as direct routes to the existing surfaces. Weather, radar, quake, media and other atlas controls remain available in the map workspace. TV should remain accessible without competing with the first practical action; any change to its default visibility needs alignment.

### Services and map

List/map switch; equal information in both views. Filters for task, area and confirmed language. Each card shows public address, eligibility, appointment requirement, cost status, source date and coordinate precision. Provide a Thai address to show locally, public telephone action where sourced, and official/provider source. Never expose protected shelters. Do not describe directory entries as referral partners without agreement.

### News and opportunities

Three-part brief: who is affected, what to do, deadline/cost or unknown. Evidence link visible on the card. Burmese draft and original accessible side by side; no invented details from headlines. Filters distinguish current calls, announcements, expired policies and unresolved claims. Signal-vs-rumor status applies to a specific claim, with corrective evidence, not the entire publisher.

Current opportunities need audience, nationality/residence rules, age, language, funding coverage, costs not covered, deadline/timezone and official application URL. Missing eligibility must never become “all youth.” Preserve closed calls in an archive.

### Chat, micro-quest and exchange

Preserve persistent rooms and current connection/retry behaviour. Add a compact three-dilemma quest with progress, back, restart and optional exit. Result: approaches reflected from choices and three relevant pathways, without diagnosis or job guarantees. No profile required.

Exchange uses “I can teach” / “I am looking for,” skill/topic, area/remote and availability. Do not collect exact homes, passports or off-platform contact details by default. Include reporting, clear moderation status and rules. Before adding shared posting, confirm moderation and backend ownership; do not quietly substitute local-only storage while calling it a peer board.

Human help is accessible from every surface. Crisis triggers must show real referrals; a future LLM pipeline cannot ship without escalation testing and partner confirmation.

## Palette and component contract

Use the exact AGENTS.md palette. Surfaces: paper `#faf9f7`, chrome `#e8e3d8`, chrome-dark `#d4ccba`. Text: ink `#102a43`, muted `#486581`. Rules `#8b7d5e`. Accent `#d4a017`, soft `#f6e9c4`. Semantic colours stay semantic. No extra decorative colours, gradients, radii, shadows, glass or emoji ornament.

Use ink on saffron for primary buttons; do not assume white on saffron passes contrast. Measure every interactive/text pair. Status must include words or shapes as well as colour. Display Noto Serif Myanmar, body Noto Sans Myanmar with project fallbacks, numerals IBM Plex Mono. Starting proposal: 16–18px reading text, Myanmar line height around 1.8, controls at least 44px high; tune through native/device tests rather than freezing a Latin-derived metric.

Calculated from the locked sRGB tokens: ink on saffron is 6.16:1; white on saffron is 2.38:1 and fails normal-text AA; muted ink on paper is 5.78:1. These token checks do not establish whole-interface conformance.

Keyboard order, visible focus, labelled controls, semantic headings, announced loading/error states and 200% zoom are required. WCAG 2.2 AA uses a 24px target-size minimum with exceptions; the proposed 44px controls are a stronger product target, not a misquotation of AA. Test reflow at 320 CSS pixels. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

Use progressive disclosure for advanced tools, not for essential costs/eligibility. The [GOV.UK multiple-task pattern](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/) is useful prior art for longer checklists. Reuse its task clarity, not its styling or framework. [Google Myanmar Tools](https://github.com/google/myanmar-tools) is possible encoding prior art; conversion remains optional and tested against minority-script text.

## Implementation sequence and blast radius

1. **Trust corrections:** `web/data/opportunity-safety.js`, `web/data/frontier_gates.geojson`, `web/dashboard.js`, `functions/api/news.js`, `functions/data/news.js`, `web/survival.js`. Separate demo corpus, fix scoped statuses, dates and coordinate precision. Keep existing content available in the appropriate context. No invented live feed.
2. **Design core and entry:** `web/dashboard.css`, `web/dashboard.html`, `web/dashboard.js`, `web/chrome.js`. Add consistent tokens, reading scale, touch/keyboard behaviour, task destinations and progressive layer controls. Preserve map panes and earned chrome/menu behaviour.
3. **Complete Burmese journeys:** the same dashboard files plus `web/room.html`, `web/room.css`, `web/room.js`, `web/chat-client.js`. Audit every label, error and loading state. Keep chat transport intact.
4. **Source-backed components:** opportunity/service cards and quest/exchange presentation. Add new modules only where separation helps maintenance. Shared exchange backend work is a separately specified increment; chat Worker WIP is preserved.
5. **Validation and release:** tests appropriate to data freshness and status classification, existing chat regression suite, local Pages API checks, screenshots and keyboard/phone-size walkthroughs. Commit only reviewed task changes, push and deploy the applicable surface, then verify live bytes and representative journeys.

Existing uncommitted files span all the above surfaces and Worker code. Their ownership/permission must be resolved before editing. Do not stash, discard, replace or deploy that work implicitly.

## Acceptance criteria

- A Burmese reader can identify the next step for five representative tasks without English, login, GPS permission or a chat post.
- No expired item appears in open opportunities; no announced programme is presented as a confirmed application call.
- Unknown border status never becomes active by default. Unknown location never becomes a precise service pin.
- Every actionable service/policy card exposes eligibility, provenance, date and uncertainty; full costs are never invented.
- Existing map layers, radar/media, room connection and menu interactions still work.
- No clipping at 320px, 200% zoom or larger Burmese text; keyboard users can reach all actions and recover from errors.
- Native Burmese review and physical iOS Safari, Android Chrome and low-end Android testing are recorded before declaring layout complete. Desktop emulation alone is insufficient.
- Human referral details are operationally checked before claiming a referral partnership or supported language.

## Approval scope

Approve the palette interpretation, this staged scope, and incorporation of current uncommitted work. This approval would authorise implementation while retaining the existing architecture and project boundaries. It does not approve Myanmar-state contracts, fabricated verification, a new AI provider, unreviewed minor-data collection, or protected shelter mapping.
