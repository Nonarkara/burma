# THE BOOK
## Non's Design Scripture — Massacre Spatial Hallucination · Anti-Slop · Glance · Kinetic · Spatial Honesty

**Canon. Absolute. Non-negotiable.**  
**Shipability benchmark: no slop.**  
English. Commands. Hardest clear rule wins on conflict. Named `STYLE.md` / Non's product brief win only as *style protect*, never as permission to invent pins, stretch boxes, forever-scroll empty chrome, or self-review.

---

# 0. Opening / Creed

### 0.1 What this book is

This is the single scripture for every agent that designs, builds, reviews, or ships UI, maps, dashboards, decks, or visuals for Non Arkaraprasertkul. It unifies MSH, anti-slop, glance path, kinetic grids, hierarchy, and spatial honesty. Scattered day-to-day sources are superseded by this file for obedience. Load this. Obey this. Do not invent a third law.

### 0.2 Who must obey

Every agent: Grok Bot, Claude, Cursor, Codex, Copilot, CloudAgents, Scrape, Git, Vivian, Space, Voice, Path A/B writers, auditors. Every human on the same products. Builder and auditor alike — auditor walks a different seat.

### 0.3 When to load

Load before: designing, building, reviewing, redesigning any page/site/dashboard/deck/visual; vibecode UI; placing a pin; geocoding; writing map captions; Path A/B posts; pre-merge ship gates. If the task touches layout **or** maps, load the whole book.

### 0.4 Refusal duty

Refuse soft wording. Refuse "consider". Refuse inventing rules this book does not state. Refuse shipping on self-review. Refuse boxed logos, invented lat/lng, forever-scroll of empty space, Title→huge-image→copy when the image outweighs the title. Exact phrases: Surah 10.

### 0.5 Conflict rule

1. Human task + contrast win; decoration loses.  
2. Densest numeric hard limit wins over softer prose.  
3. Layout MSH and Map MSH are both banned; neither excuses the other.  
4. Locked product `STYLE.md` / Non's explicit brief protect deliberate style; they never waive ship basics (contrast, 44px taps, focus, lang, map pin honesty, builder≠auditor).  
5. Do not invent a third rule. File the conflict.

### 0.6 Creed (memorize)

> Compact first. Scroll only for interesting detail. Boxes fit content. Logos never boxed. Something must win. Eye enters on weight — payload on the exit. Name a grid or stay quiet. Never invent lat/lng. Builder ≠ auditor. No slop ships.

---

# 1. Definitions

**MSH — Massacre Spatial Hallucination (layout)**  
Inventing empty space, oversized boxes, stretch-to-fill, forever-scroll chrome. Honest failure: fix the first unnecessary expansion. Do not decorate the consequences.

**Map MSH — Spatial Hallucination (geo)**  
Inventing or rounding lat/lng, centroids, guessed depths, near-miss geocodes, fake precision. Honest failure: leave unpinned / `tip_cm` null / needs-hand-pin.

**Slop**  
A default nobody chose: samey AI UI, equal-weight mush, filler copy, fake stats, decorative gradients/glass, boxed logos, banned font faces used as unexplained primary, stretch-to-fill, dead void. **Style is not slop** — a choice somebody named in `STYLE.md` is protected.

**Glance path**  
The eye's one-glance route: entry = heaviest visual; exit = where headline, key number, and primary action sit (below or beside). Not DOM order.

**Hierarchy**  
Stated 1st / 2nd / 3rd. Real scale step (≥1.5–2× type; posters often 5–10×). Size carries information. Squint must show a winner.

**Kinetic grid**  
Energy from rigidly obeying one named geometric system — `radial` | `axial` | `column` | `modular` — with intentional voids, extreme scale, ≤2 accents. Not floating off-grid.

---

# 2. Hard Commandments

Absolute. Numbered. ≤40. Break none.

1. **Boxes fit content.** Padding ≈ 0.5–1.5× line-height. No fixed/`min-height` void under short text. Control/chip/stat ≤ **2×** content width and ≤ **1.6×** content height.
2. **No void.** No flat empty region over ~⅓ of the first screen. No phone-width column floating on desktop. No blank half while loading — skeleton or last-good data + timestamp.
3. **Compact first.** If the task fits one screen at **390×844** and **1440×900**, make it fit. Scroll is for interesting depth, never recovering from fat chrome.
4. **Massacre the first expansion.** Do not decorate the consequences of MSH.
5. **Something must win.** One focal point. Type step ≥ **1.5–2×**. No equal card grids by default. Squint fail = hierarchy fail.
6. **Logos never boxed.** No border, chip, tile, pill, shadow, or backing panel around a logo. Strip = logos + gap (+ plain text label). Unbox whole strips.
7. **Symbols over prose** when meaning is clear (status dots, gauges, ↑↓, icons with `aria-label`). Never emoji-as-UI-icon.
8. **Subtract before add.** Before a new box/shadow/radius/badge/emoji, remove one. Caps unless `STYLE.md` overrides: ≤**15** cards, ≤**3** shadows, **one** radius (or none), ≤**5** pills, ≤**8** font sizes, **0** decorative gradients/glass, **0** first-load modal, **light by default**.
9. **Map-first surgical table.** On map/data products: map ≥**60%** of first desktop and first phone screen; panels = edge instruments; nothing covers the map on load.
10. **Glance: payload on the exit.** Heaviest visual is entry. Headline + primary action sit immediately below or beside it. Never force an upward climb over a heavy hero.
11. **No leapfrog.** Headline and related copy stay on the same side of the dominant visual.
12. **Reject Title → huge image → copy** when the image outweighs the title. Prefer Image → Headline → Copy. Keep semantic headings; Tab order must match what the eye sees.
13. **Name a grid or stay quiet.** Rotation/overlap/diagonal type only on a named `radial`/`axial`/`column`/`modular`. One grid per first screen unless Non's brief says otherwise. Snap; no arbitrary float.
14. **Intentional voids push.** Empty modules/columns/corners are structural. Do not plug with cards, badges, emoji, or a boxed logo.
15. **Colour: quiet ground + ≤2 saturated accents**, each with a job. A data colour spends an accent. No rainbow.
16. **Motion: snap / skeleton / hard cut.** No floaty morphs, slow crossfades, PowerPoint dissolves. Honour `prefers-reduced-motion`. One moment or none. Ban reflex `transition-all`, hover-scale on cards, idle pulse/ping/float on non-live things.
17. **Banned primary faces:** Inter, Poppins, Montserrat, Roboto, Open Sans, Lato, DM Sans, Space Grotesk, Geist, Plus Jakarta Sans, Manrope, Nunito, naked `system-ui` as the design face — unless `STYLE.md` names them with a reason. Prefer Jost / Josefin / League Spartan; Thai Prompt or Kanit; ≤2 families (third only with a named job).
18. **Prose measure ≤65ch** (~45–75ch; Thai/ZH keep physical A4/A5 measure, ~30–45 Chinese characters). Wide screens get columns or margins.
19. **No filler, no fake numbers.** Ban Unlock / Seamless / Revolutionize / Optimize / Streamline / Boost as decoration. No lorem stats. No greeting titles ("Welcome back… 👋"), UI exclaim, hype badges (New ✨, PRO) as chrome.
20. **Hero without data fails.** No hero over half the screen unless it *is* the map or the number.
21. **Ship basics never waived:** text contrast ≥**4.5:1** (3:1 at ≥24px or ≥18.66px bold); phone taps ≥**44×44** CSS px (inline sentence links exempt); every `<img>` has `alt`; controls named; fields labelled; focus visible; `<html lang>`; viewport `width=device-width`.
22. **Never invent lat/lng.** No vibe pins, no centroids (province/amphoe/tambon), no midpoints, no `0,0`, no silent landmark snap, no neighbour soi.
23. **Never invent `tip_cm` / depth.** Knee/ankle/waist-deep stay text. Rain mm ≠ flood depth. City-wide ranges do not attach to a street pin unless that street is named in the same clause.
24. **No silent geocode swaps.** Wrong name / soi / amphoe / province → reject and log. Prefer null + needs-hand-pin.
25. **Gauges ≠ streets.** Do not relocate a street flood to the nearest gauge. Score ≠ evacuation order. Missing feed ≠ all-clear.
26. **Soft-cite honesty.** Path B only when tip ↔ dashboard agree; soft-cite live FloodDash version; credit source; date-range old tips; never present archive as "now".
27. **Style is not slop.** Before removing: would this make the page more generic? Keep. Clearer/smaller/honest? Remove. `STYLE.md` allowlist is never stripped by a reviewer chasing "less AI".
28. **Off-grid spacing fails.** Every spacing value sits on the 4px / MoMA scale. Arbitrary `mt-[13px]` / `py-[11px]` is a tell.
29. **Never self-review.** Builder ≠ auditor. Independent agent walks Surah 5 + Surah 9.
30. **Preserve the product.** Do not "fix" by deleting features, renaming the product, inventing data, swapping section order, or swapping one trend for another.
31. **MoMA alignment.** No loose near-miss edges. Hairline **1px** without stealing layout. Radius **0** unless `STYLE.md` / product says otherwise. Spacing from a stated scale.
32. **Phone chrome stays thin.** Sticky top+bottom bands fit contents; count sticky offsets. Slim nav ≤**56px** where map-first wins. Build at **390** first; extra width must earn its place.
33. **One primary action per screen**, verb + object, sized to its label. Desktop buttons content-width; full-width only in phone column or narrow side panel.
34. **Stat tiles in a ruled strip**, sized to text — never equal grid tracks; a lone last tile never spans the row.
35. **No first-load modal/wall.** Answer the question first.
36. **Light by default.** Dark only when used in the dark or `STYLE.md` says so — and then no glow/glass command-centre cosplay.
37. **Look → triage → direction → STOP → layers.** Heavy/light/none. Wait for yes unless told "just do it". Geometry/MSH first among fix layers. Before/after at 1440 and 390; ≤3 render rounds.
38. **Template test.** Swap a competitor's name onto the screen; if it still fits with no World/Signature, push further — fail B15.
39. **Real visuals only.** No generated hero images / paid image calls without asking. US$0 default.
40. **When unsure on a pin: null.** A blank pin is honest. A pretty wrong map is a scar.

---

# 3. Hierarchy & Composition

### 3.1 Law

Something must win. State attention order **1 / 2 / 3** before coding. Relationships before rectangles: proximity, scale, empty-space job.

### 3.2 Scale is information

- Prefer **size** over weight for hierarchy.  
- Product UI: real step ≥1.5–2×; never treat 16px→20px as hierarchy. ≤8 sizes unless `STYLE.md` unlocks more.  
- Marketing/posters may use ~5–10× display vs body. Display may break measure; body may not.  
- Micro-copy may be tiny tracked texture.  
- Do not invent a fifth voice ("eyebrow gradient", "caption personality").

### 3.3 Composition

- Deliberate grid. Every mass placed on purpose.  
- Asymmetry allowed and often better (2/3+1/3, off-centre hero, wide margin). What fails is weight nobody decided — one tall column stretching its row and leaving others blank.  
- Related controls grouped; less space inside groups than between (proximity).  
- Squint at 1440 / 1024 / 390: if silhouette could be any SaaS landing page → redesign hierarchy, not colours.  
- Destination / primary fact is the hero. Do not park a slogan above it.

### 3.4 Image / data patterns (choose one; say why)

- Shared scene / editorial spread / reading band under image / task-first instrument.  
- Do not pick "hero" by habit.  
- If API returns `{title, image, body}`, still render **image → title → body** unless the title itself is the dominant visual (unapologetically large display, no competing full-bleed heavier than it).

### 3.5 Concrete card pattern

```html
<article class="card">
  <img alt="…" />   <!-- 1. heavy visual -->
  <h2>…</h2>        <!-- 2. headline on the exit -->
  <p>…</p>          <!-- 3. copy -->
  <a class="action">…</a>
</article>
```

Visual order = source order. Prefer not to `order:`-shuffle unless focus order is fixed too.

### 3.6 Hero with reading band

```text
[ full-bleed image / video ]
[ compact band: headline + one line + primary action ]
```

Band sized to words + action — not a second hero. If overlay contrast fails, put the band **under** the image; do not force a decorative scrim.

---

# 4. Glance Path

### 4.1 One sentence

**The eye enters on visual weight, not DOM order. Put the message where the eye goes next — or the best copy in the world is worthless.**

### 4.2 Do / don't

| Fail (Omega pattern) | Pass (Mustang pattern) |
|---|---|
| Title → huge image → copy | Image → Headline → copy/CTA |
| Eye climbs back up, then leapfrogs | Eye lands, drifts down, reads |

**Reorder. Do not rewrite first.**

### 4.3 Hard rules

1. Entry = heaviest thing on first screen (image, video, saturated card, or **map** on map products).  
2. Payload on natural exit — usually immediately below or beside.  
3. No leapfrog of related copy across a huge visual.  
4. Reject the stack that fights the eye when the image outweighs the title.  
5. Map/ops: map is entry (≥60%); readouts and next actions on its **edge**, not in a dead band above it. No decorative hero stealing the first screen.  
6. Headline may lead **only** when it is itself the dominant visual. Timid scale does not qualify.  
7. Keyboard follows the glance. CSS visual order ≠ Tab order → **FAIL**.

### 4.4 Brief fields (fill before coding)

```text
Reader and task:
Attention order: 1 / 2 / 3
Heaviest visual (entry):
Glance exit (headline / action location):
Image role:
Why this position and scale:
What the empty space does:
Action groups:
Responsive / language / zoom:
Overlay gate (if used): pass / fail / n/a
```

### 4.5 Auto-reject

| Symptom | Repair |
|---|---|
| Headline/CTA above a heavier full-bleed | Move to exit |
| Headline and copy split by huge visual | Join on one side |
| Title 16–20px beside body 14–16px | Real type-scale step |
| Cards/badges/boxed logo filling empty space | Leave the push; unbox logo |
| Visual order ≠ Tab order | Align them |
| Decorative hero pushes only action below first phone screen | Shrink/relocate/kill hero; keep map/data primary |
| Equal-weight card grid | Pick one winner; demote the rest |

---

# 5. Massacre Spatial Hallucination (MSH) + Audit Checklist

### 5.1 Why MSH is the root of design slop

1. Element expands without task reason (fat padding, fixed height, equal tracks, hero void).  
2. Row/header/panel grows to match.  
3. Useful content drops below first screen.  
4. Evidence and actions lose each other.  
5. User scrolls through mostly empty space.  
6. Equal-weight blocks flatten hierarchy → "AI default".

**Massacre the first expansion.**

### 5.2 Two MSHs (both banned)

| Kind | Invents | Honest failure |
|---|---|---|
| Layout MSH | Empty space, oversized boxes, stretch-to-fill, forever-scroll | Fix first unnecessary expansion |
| Map MSH | Fake lat/lng, centroids, guessed depth | Unpinned / `tip_cm` null |

### 5.3 Auditor role

A **different** agent or human walks live UI or PR preview. Any FAIL blocks ship unless Non waives in writing.

### 5.4 Capture

- [ ] Screenshots at **1440**, **1024**, **390** (and **320** if claimed)  
- [ ] Squint / silhouette: any SaaS? → redesign hierarchy  
- [ ] Run `npx github:Nonarkara/Non-Slop scan .` and/or `node tools/slop-lint.mjs <url>` when available  
- [ ] Fix every **SLOP**; explain or fix every **REVIEW**  
- [ ] slop-lint scores: ≥6 SLOP · 3–5 REVIEW · <3 OK (screen, not judge)

### 5.5 Geometry checklist (first screen)

| # | Check | Pass if | Fail if |
|---|---|---|---|
| B1 | First-screen task | Primary info + action visible at 390 and 1440 | Must scroll empty chrome to act |
| B2 | Chrome cost | Top+bottom bands fit; sticky offsets counted | Gigantic stacked identity+title+status |
| B3 | Box fit | Boxes hug text | Text ≪ box → page bleeds |
| B4 | Void | Empty space has a named job (map, measure, pause, push) | Dead thirds, stretch-to-fill, orphan columns |
| B5 | Scroll honesty | Extra screens earn new facts/actions | Forever-scroll of padding / equal cards |
| B6 | Symbols | Compact marks where clear | Long labels where a mark would do |
| B7 | Hierarchy | Obvious 1st/2nd/3rd | Equal-weight mush |
| B8 | Proximity | Related controls grouped | Scattered actions / pager at opposite edges |
| B9 | Map/data | Map ≥60%; panels docked | Map buried / covered on load |
| B10 | Logos | Sit on the surface | Boxed / chipped logos |
| B11 | MoMA | Edges align | Near-miss edges, ragged rows without intent |
| B12 | Language | `lang` set; Thai/ZH room; no filler | Unlock/seamless/revolutionize; fake stats |
| B13 | Access | Focus visible, ≥44px taps, contrast, no clip | Keyboard traps, tiny targets |
| B14 | Preservation | Earned content still works | "Fixed" by deleting the product |
| B15 | Template swap | Competitor name does not still fit | Generic template with no World/Signature |
| B16 | Direction kept | Character/World/Moments/Signature visible; rich only in Moments | Rich colour/motion everywhere |
| B17 | Grid and motion | On-scale spacing; named motion; reduced-motion path | Off-grid; `transition-all`; hover-scale; idle loops |
| B18 | Product kept | Name/features/order/data intact | Renamed, inventing, trend-swap |

### 5.6 Five measurements (per viewport: 390 / 1024 / 1440)

1. Chrome cost — band height share of viewport  
2. Task visibility — evidence + action together?  
3. Geometry failures — voids, inflated boxes, orphans, wrap accidents  
4. Hierarchy — stated 1/2/3 vs screenshot  
5. Preservation — what stayed usable  

### 5.7 Verdict block

```text
Verdict: PASS / REVISE / BLOCK
Auditor (≠ builder):
URL / PR:
Widths / langs checked:
MSH fails (id → element → smallest repair):
Triage (heavy / light / none):
Before / after screenshots:
Scanner: clean / SLOP hits / REVIEW hits:
MoMA / Non-Slop notes:
Kept on purpose:
Unverified:
```

**PASS** = no B-fails, scanner clean or explained, independent auditor named.  
**REVISE** = fixable MSH without product loss.  
**BLOCK** = first-screen void/bleed, self-review only, or map/geo hallucination on a live pin.

### 5.8 Builder procedure

1. Brief: who, one job, hierarchy, constraints, subject-world direction.  
2. Relationships before rectangles.  
3. Real content (long Thai/DE, empty, error, 10× rows).  
4. Compact at 390 + 1440 before adding scroll.  
5. Symbols where clear; prose ≤65ch.  
6. Scan + screenshots + **different** auditor.

### 5.9 Fix order (geometry first)

Look → audit with places (`file:line — what`) → triage heavy/light/none → direction (heavy) → **STOP** → layers: **geometry/MSH → spacing → colour → icons → copy → type → layout within section → details → visuals → motion**.

Direction fields (heavy): Product · Character (never clean/modern/sleek/minimal/premium) · World · Moments (1–2 rich places) · Signature + glance path.

---

# 6. Anti-Slop / Anti-Design

### 6.1 Principle

Empty space is a decision. Subtract before add. Clean apps differ from slop mainly by **what they leave out**.

### 6.2 Hard limits per screen (measured)

| # | Pattern | Hard limit |
|---|---|---|
| 1 | Shadows everywhere | ≤3 drop shadows |
| 2 | Unreadable lines | ≤65ch prose |
| 3 | Radius soup | One radius (or none); used on < half the boxes |
| 4 | No type scale | ≤8 sizes; 1.5–2× steps |
| 5 | Emoji as icons | 0 |
| 6 | Box soup | ≤15 boxes/cards |
| 7 | Pills/badges | ≤5 |
| 8 | Dark command centre default | Light by default |
| 9 | Stretch-to-fill | ≤2× width / ≤1.6× height of content need |
| 10 | First-load wall | None |
| 11 | Gradients / glass | 0 decorative |
| 12 | Dead empty space | No flat >⅓ first screen; no floating phone column; no blank load half |
| 13 | Hero with no data | No hero >½ screen unless map or number |

### 6.3 Style protection

**Slop is a default nobody chose. Style is a choice somebody made.**

- Signature allowlist lives in repo `STYLE.md` (or `## Signature` in AGENTS.md). Reviewers never strip listed items. Real a11y problem → ask owner; do not quiet-delete.  
- Judge the **stack**, not the item. One serif headline / one emoji / one radius is a choice. Inter + purple gradient + three identical cards + "seamlessly transform" is a fingerprint.  
- Minimal is the floor, not the goal. Passing every rule while staying generic still fails — add something specific (named reference, real number, point of view).  
- Never flatten Non's voice to pass a detector.

### 6.4 Ship basics (person + lint; STYLE.md cannot exempt)

| Check | Rule | Level |
|---|---|---|
| contrast | ≥4.5:1 (3:1 large text) | FAIL |
| tap-targets | ≥44×44 CSS px on phone | FAIL |
| img-alt | Every `<img>` has truthful `alt` | FAIL |
| control-names / labels | Named controls; real `<label>` | FAIL |
| focus-visible | Tab shows focus; no naked `outline: none` | FAIL |
| html-lang / viewport | Set | FAIL |
| lcp / cls | LCP ≤4s lab (aim 2.5); CLS <0.25 (aim 0.1) | FAIL/warn |
| image-weight | No image >300KB; ≤2MB first load; ≤2.5× shown width; AVIF/WebP + srcset | warn |
| zoom | Pinch zoom works | warn |
| home-link | Name/logo top-left links home | warn |
| en-th-zh | Public frontends offer EN, TH, ZH | warn |

Person checks: phone-first at 390; five-second first-timer test (different agent); conventions where people look; one primary action; consistency of behaviour; answer-first copy; errors in text beside fields (colour never alone); keyboard + 200% zoom + 320px pass.

### 6.5 More tells to kill

Centre-everything by default · stacked shadows / glass · vague slogan heroes · too many colours without jobs · thick chrome · icons on every line · same small grey everywhere · headings 800–900 by reflex · mixed number formats in one view · off-grid arbitrary spacing.

### 6.6 CSS / React reminders

```css
/* boxes hug content */
.chip { width: max-content; padding: 0.5em 0.75em; /* not min-height: 80px */ }

/* prose measure */
.prose { max-width: 65ch; }

/* no stretch stats */
.stats { display: flex; flex-wrap: wrap; gap: var(--gap); }
.stat { flex: 0 0 auto; } /* never 1 1 0 on equal tracks for lone last tile */

/* buttons desktop */
.btn { width: max-content; }
@media (max-width: 480px) { .btn--block { width: 100%; } }
```

---

# 7. Spatial Honesty (maps / pins / geo)

### 7.1 One-line tests

> If you deleted the source text, would a stranger still know **which street** this pin is? If not, do not pin.  
> If a local from that soi would say "that's not here," delete the coordinates.

### 7.2 Hard bans

1. Never invent coordinates.  
2. Never use administrative centroids for street tips.  
3. Never guess `tip_cm` / depth.  
4. Never upgrade prose ("knee-deep") into numbers.  
5. Never treat rain mm as flood depth.  
6. Never conflate nearby names (wrong soi, resort vs wat, wrong amphoe).  
7. Never move a hillside flash flood onto a river gauge (or reverse).  
8. Never invent media claims you cannot verify.  
9. Never paste a map preview as proof of a geocode you did not get.  
10. Never use `0,0`, null island, or default map centre as a pin.  
11. Never silently "fix" by snapping to a famous landmark.  
12. Never invent fake precision (building numbers, 6-decimal vibes, flood polygons without source).  
13. Never merge multi-site stories into one averaged point.  
14. Never shift event times to fit a post cadence. Timezone-label (Asia/Bangkok = UTC+7).

### 7.3 Allowed pin sources (priority)

1. Coordinates stated in the source (EXIF only if media is clearly of that event).  
2. Official station/gauge id with known station file.  
3. Explicit location attachment (Telegram location, GeoJSON).  
4. OSM / Nominatim / Overpass hit for the **same named feature** in the **same province** (amphoe when ambiguous).  
5. Human hand pin with place name recorded.

Confidence labels: `source_gps` | `station_id` | `osm_named_poi` | `hand_pin` | `null`.

### 7.4 Geocoder checklist (every hit)

1. `display_name` contains same place tokens (soi number, POI, canal)?  
2. Correct province (and amphoe if known)?  
3. OSM type is a real feature — not bare `administrative` boundary for the pin?  
4. Would a local recognise "that place", not "somewhere in the district"?  
5. Tip names Soi X and OSM only has Soi Y → **null** + needs-hand-pin.  
6. Rate-limit Nominatim (~1 req/s); identify User-Agent.  
7. Fuzzy / partial confidence → hand pin, don't import.  
8. Overpass timeout → retry; **never** centroid fallback.

### 7.5 Depths & Path A/B

- `tip_cm` only when source states cm/m **at that spot**; quote the phrase.  
- Ranges belong in notes/sub-sites, not on a different landmark.  
- Gauge levels only from official series.  
- Score ≠ evacuation order; few-gauge provinces: never say "eased" from score alone; point to local/citizen reports.  
- Banner jumps with gauge-count spikes are ingest artefacts until deduped.  
- Path B: tip ↔ dashboard agree; soft-cite live version; credit tip; no invented depth; cite old tips with date range.  
- Include **1784** when directing people to help channels where that standing practice applies.  
- Street tips: "reported at [named place]" + source — never "around [centroid]".

### 7.6 Pre-import checklist

- [ ] Source URL saved  
- [ ] Named place quoted from source  
- [ ] Coords from exact hit **or** explicitly null + hand-pin reason  
- [ ] Admin hierarchy checked  
- [ ] `tip_cm` null unless source number at that spot  
- [ ] Rain/tide/dam/flash-flood labels not confused  
- [ ] Zero centroids, vibe pins, neighbour sois  
- [ ] Rejected geocodes logged with reason  
- [ ] Live window ~14 days unless Non sets otherwise; archive older, don't invent pins to inflate `located_total`

### 7.7 Known scars (do not repeat)

Saphan Mai wrong-pin class · amphoe/province centroids as "close enough" · rain mm as depth · score-only "eased" on few-gauge provinces · first-sighting L5 after ingest expansion treated as real rivers · Pakasai Resort for Wat Pakasai · Soi Na Nai 5/8 auto-pin when missing in OSM.

### 7.8 Registry joins (when mapping admin data)

Join by official codes (TIS-1099, amphoe/khet codes), not fuzzy name geocoding. Reference geometry ≠ live flood state. If precision is tambon-level, say so — do not dress it as a street pin.

---

# 8. Motion & Kinetic

### 8.1 One sentence

**Name a grid. Snap to it. Leave voids on purpose. Make the title unapologetically huge. Keep the palette quiet. Glance path still wins.**

Squint must still show: **biggest header → biggest visual → biggest text**.

### 8.2 Four grids you may name

| Grid | Idea | Product default |
|---|---|---|
| Radial | Rays + concentric circles; voids push to centre | Marketing / locked art only |
| Axial | Strong diagonals / X; mark at crossing | Marketing / locked art only |
| Column | Equal vertical columns; gutters breathe | Default product |
| Modular | Equal modules; whole module may stay blank | Default product / ops |

Ops/map/dashboards: **column or modular instruments around the map**. Dense forms/tables: column/modular only — no diagonal body text. First phone civic screen: prefer quiet column; wild break only if Non asked.

### 8.3 Hard kinetic rules

1. Write the grid name in the brief before coding — or `none`.  
2. CSS Grid (or SVG/canvas guides). Major elements occupy tracks/modules/axes.  
3. `transform: rotate(...)` only when angle matches the named system.  
4. Arbitrary `position: absolute` drift off-grid fails unless a deliberate mark on an axis intersection.  
5. Gutters are breathing room, not filler-chip slots.  
6. Extreme scale; never 16→20 as hierarchy.  
7. ≤2 accents; no decorative gradients/glass.  
8. Glance path overrides "cool grid".  
9. Do not mix two named grids on one first screen unless brief says so.

### 8.4 Motion when UI moves

- Steep ease / snap (house ease-out e.g. `cubic-bezier(0.22, 1, 0.36, 1)` when a default is needed).  
- Skeleton, then content.  
- Hard cuts over dissolves.  
- Named properties only — never reflex `transition-all`.  
- No hover-scale on cards; no idle pulse/ping/float on non-live chrome.  
- Honour `prefers-reduced-motion`. One moment or none.

### 8.5 Patterns

```css
.section {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--gap);
}
/* leave columns empty on purpose */

.board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: var(--gap);
}
.void { /* empty module — do not insert a card */ }
.title { font-size: clamp(2.5rem, 8vw, 6rem); }
```

### 8.6 Auto-reject

Rotation with no named grid · 16→20 hierarchy · every module filled · boxed logo in a gap · rainbow/glass/soft dissolve · radial poster burying FloodDash gauges · glance dead zone (headline above heavier visual).

---

# 9. Ship Gate — Pre-merge Checklist

Run all. Phone **390**, tablet **1024**, desktop **1440** (320 if claimed). Fail any hard row → do not merge.

### 9.1 Capture & independence

- [ ] Screenshots 1440 / 1024 / 390 (+320 if claimed)  
- [ ] Before/after paths saved when this was a fix turn  
- [ ] Auditor named and **≠** builder  
- [ ] `STYLE.md` read; allowlisted items marked ALLOWED, not stripped  

### 9.2 MSH / hierarchy / glance / kinetic

- [ ] B1–B18 walked (Surah 5)  
- [ ] Five measurements recorded per viewport  
- [ ] Glance: entry named; exit holds headline/CTA; no leapfrog; Tab matches eye  
- [ ] If licensed break: grid named; voids intentional; accents ≤2  
- [ ] Map products: map ≥60% first screen; nothing covers map on load  
- [ ] Logos unboxed  
- [ ] Caps: ≤15 cards, ≤3 shadows, one radius, ≤5 pills, ≤8 sizes  

### 9.3 Anti-slop & ship basics

- [ ] slop-lint / Non-Slop scan: no unexplained SLOP  
- [ ] Contrast, 44px taps, alt, labels, focus, lang, viewport PASS  
- [ ] No first-load modal; light default unless justified  
- [ ] No filler copy / fake stats / greeting chrome / hype badges as UI  
- [ ] Banned fonts not primary without STYLE reason  
- [ ] Phone-first: built at 390; real-phone check when possible  
- [ ] One primary action; five-second first-timer pass (other agent)  

### 9.4 Spatial honesty (if map/tips)

- [ ] Every live pin has source URL + place string + geocode display name  
- [ ] Zero centroids / vibe pins / invented tip_cm  
- [ ] Rejects logged; hand-pin queue written  
- [ ] Soft-cite / date honesty in Path A/B copy  

### 9.5 Fail conditions (auto BLOCK)

- First-screen void/bleed or forever-scroll of empty chrome  
- Self-review only  
- Live pin with invented/centroid/near-miss coordinates  
- Boxed logos left in place  
- Title→huge-image→copy with climb/leapfrog unfixed  
- Product deleted/renamed/data invented to "pass"  
- Ship-basics FAIL (contrast / 44px / focus / lang) unfixed  

---

# 10. How to Refuse

Use these short phrases. Do not soften.

1. **Refuse MSH:** "Boxes must fit content. This expands without a task reason — massacre the first expansion."  
2. **Refuse void/scroll:** "Compact first. I will not ship forever-scroll through empty space."  
3. **Refuse boxed logo:** "Logos are never boxed. Remove the chip/border/panel."  
4. **Refuse equal mush:** "Nothing wins. Pick a focal point with a real type step."  
5. **Refuse glance fail:** "Payload must sit on the exit of the heavy visual. Reorder — do not rewrite first."  
6. **Refuse leapfrog:** "Headline and copy stay on the same side of the dominant visual."  
7. **Refuse unnamed kinetic:** "Name `radial`/`axial`/`column`/`modular` or stay orthogonal."  
8. **Refuse slop fonts:** "That face is banned as unexplained primary. Use house face or STYLE.md reason."  
9. **Refuse filler:** "No Unlock/Seamless/Revolutionize. No fake stats."  
10. **Refuse invented pin:** "No lat/lng without a clean geocode of the named place. Null or hand-pin."  
11. **Refuse centroid:** "Administrative centroids are banned as tip pins."  
12. **Refuse guessed depth:** "`tip_cm` stays null unless the source states a number at that spot."  
13. **Refuse self-review:** "Builder ≠ auditor. A different agent must walk the checklist."  
14. **Refuse style-stripping:** "STYLE.md protects that choice. Ask the owner — do not delete to look 'less AI'."  
15. **Refuse map buried:** "Map-first: ≥60% first screen; panels are instruments at the edge."  
16. **Refuse reflex motion:** "No `transition-all`, hover-scale, or idle pulse on non-live chrome."  
17. **Refuse soft maybe:** "This book commands. I will not 'consider' a hard ban."  
18. **Refuse inventing rules:** "Not in the Book. I will not invent a third law — file the gap."  

---

# 11. Lineage

Sources synthesized (not concatenated). Hardest clear rule won on conflict.

**MSH / layout**
- `/workspace/msh-pack/MSH.md`
- `/workspace/msh-pack/AGENTS-MSH-BLOCK.md`
- `/workspace/tkc-ph-msh/MSH.md` (identical to msh-pack MSH)

**Glance / kinetic / hierarchy**
- `/workspace/tkc-ph-msh/glance-path.md`
- `/workspace/tkc-ph-msh/kinetic-grids.md`
- `/workspace/shared-for-you/motion-study-2026-11-03/GLANCE-PATH-FOR-AI.md` (identical to tkc glance)
- `/workspace/shared-for-you/motion-study-2026-11-03/KINETIC-GRIDS-FOR-AI.md` (identical to tkc kinetic)
- `/workspace/anti-slop-style-audit/repos/dr-non-luggage-tag-aesthetic/docs/hierarchy.md` (universal rank/size laws only)

**Anti-slop / style**
- `/workspace/slop-study/ANTI-SLOP.md`
- `/workspace/ruttl-bp/palette/ANTI-SLOP.md` (adds ship basics)
- `/workspace/ruttl-bp/dr-non-vibecoding-skills/ANTI-SLOP.md` (same as palette)
- `/workspace/anti-slop-style-audit/SKILL.proposed.md`
- `/workspace/anti-slop-style-audit/style-protection.md`
- `/home/box/agent-data/workflows/anti-slop-design/SKILL.md`
- `/home/box/agent-data/workflows/msh-auditor/SKILL.md`
- `/workspace/unslop-study-2026-11-03/INTEGRATION.md`
- `/workspace/unslop-study-2026-11-03/COMPARISON.md`  
  Credit within unslop adaptations: **unslop by Damir Sokolovsky (@heydamir)**, https://github.com/heydamir/unslop, CC BY 4.0 — triage/stop/direction/template/B15–B18/layer order adapted; fonts/dark-default/generated heroes/nested radii **skipped** as conflicting with house law.

**Spatial honesty (map)**
- `/workspace/flooddash-guidelines/ANTI-SPATIAL-HALLUCINATION.md`
- `/workspace/flooddash-guidelines/anti-spatial-hallucination.md`
- `/workspace/SPATIAL-HALLUCINATION.md`
- `/workspace/flooddash-docs/SPATIAL-HALLUCINATION-KILL.md`
- `/workspace/SecondBrain/Kit/Anti-MSH.md` (stub; denser FloodDash rules win)
- `/home/box/agent-data/workflows/anti-spatial-hallucination/SKILL.md`
- `/home/box/agent-data/workflows/spatial-hallucination-kill/SKILL.md`

**Study clips (distilled in glance/kinetic sources, 3 Nov 2026 ICT)**  
Poster hierarchy ("The rule every poster should follow" — Omega fail / Mustang pass). Kinetic grids ("Grid Systems every designer should know" — radial/axial/column/modular). No third-party poster artwork reproduced here.

**Evidence**  
Citizen flood-app measurement study (FloodDash About → Citizen-built apps, 18 Oct 2026; 31 labelled apps) grounds numeric anti-slop caps. Ship basics also filtered from ruttl "11 Website Design Best Practices" (Harsh Vijay, 9 Aug 2026) + WCAG 2.2 + Core Web Vitals — house bans win where that article conflicts.

---

# Gaps (sources silent — do not invent)

- Exact MoMA spacing token table lives in `Nonarkara/moma-rules`; this Book states the obedience rule, not every derived number.  
- Product-specific luggage-tag IATA token names are domain packaging, not universal UI law — only size-as-information / four-rank discipline folded.  
- Apify cost caps and archive disk paths are ops; cited only as "do not invent pins to fix chips".  
- Story-video before/after (`story.mjs`) skipped for now per unslop comparison — PNG pair suffices.  
- No separate `*hierarchy*.md` from the glance video beyond the glance-path files and luggage-tag hierarchy doc; hierarchy Surah synthesizes those.

---

*End of Book. Obey. Builder builds. Auditor audits. No slop ships.*
