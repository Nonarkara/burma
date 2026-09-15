# 16-bit / Chicago-Era Aesthetic — Pirchchat House Tokens

**Date:** 2026-09-15
**Owner:** Dr Non (Axiom Decision Systems)
**Status:** Decision locked. This is the visual register for every Pirchchat surface.

---

## 1. The era we are borrowing from

Dr Non asked for **16-bit computer aesthetics, around Windows 95**. Quick historical clarification:

- **Windows 3.1 (1992)** — 16-bit. The last "old-school" Windows.
- **Windows 95 (1995)** — mostly 32-bit but visually straddles 16-bit and 32-bit. The Chicago design language.
- **Windows 98 / 98SE (1998)** — fully 32-bit. End of the era.

The **aesthetic Dr Non actually remembers** is the Chicago design language as it appeared on Win95 and System 7 / 8 / 9 on the Mac side. That visual register is what we adopt — not the literal OS architecture.

Reference points:
- Chicago design language (Windows 95/96): titlebars, gray chrome, bevels, status bar
- Mac System 7-9: system fonts, menus, control panels
- SNES-era color palette (16-bit color depth = 65,536 colors)
- The "personal computer felt personal" feeling of mid-1990s computing

## 2. What we copy from the era

These are the visual primitives of the era that hold up:

| Element | Why it works |
|---|---|
| Titlebar at the top of every window | Clear orientation — you always know what window you're in |
| Menubar under the titlebar | Affordance for actions, keyboard navigable |
| Statusbar at the bottom | Connection / state / progress always visible |
| Multiple windows tiled on a desktop | Multiple contexts at once — chat + digest + atlas side by side |
| Limited color palette (12 named colors) | Restraint. No decoration. Function over form. |
| System font feel | IBM Plex Sans + Mono + Noto Sans Myanmar = the modern analog |
| Tight 8px grid | Pixel alignment, predictable spacing |
| Sharp edges | `border-radius: 0` always |
| Hairline 1px borders | Visible structure without weight |
| Window chrome (close, minimize, maximize) | Recognizable affordances |
| Tab strips | Multiple documents within one window — modern equivalent of MDI |

## 3. What we reject from the era

These are the 1990s specifics that hurt the 2026 version:

| Reject | Why |
|---|---|
| Skeuomorphic 3D bevels (raised buttons, sunken inputs) | Dated visual language. Anti-slop rule. |
| Drop shadows | Anti-slop rule. |
| Gradients (titlebar gradients, button gradients) | Anti-slop rule. |
| Pixel-art / bitmap icons (16×16 icon style) | Cute, but reads as "retro game" not "tool". Modern outline icons. |
| Heavy gray 3D borders | Replaced by hairline borders. |
| Windows 9x chrome (title bar gradient, menu bar 3D) | Replaced by flat 1px borders. |
| Animated cursors, animated toolbar buttons | Static is the discipline. |
| Tiny icons with no labels | Accessibility rule. |
| Italicized system fonts | Anti-slop. Use weight + letter-spacing. |
| Tile background patterns | Anti-slop. Solid only. |
| Cyan / magenta / lime accents | Excluded. Saffron or Thailand flag blue only. |

## 4. The palette (12 colors, semantic only)

```css
/* Surfaces */
--paper:         #faf9f7;   /* warm off-white, primary background */
--chrome:        #e8e3d8;   /* titlebar / menubar / statusbar */
--chrome-dark:   #d4ccba;   /* window frame, disabled state */
--ink:           #102a43;   /* primary text */
--ink-muted:     #486581;   /* secondary text */
--rule:          #8b7d5e;   /* hairline borders */

/* Accent */
--accent:        #d4a017;   /* saffron — single accent, Chicago yellow */
--accent-soft:   #f6e9c4;   /* hover / active background */

/* Semantic */
--positive:      #2e7d32;   /* join / connect / verified */
--negative:      #a51931;   /* part / kick / error / warning */
--notice:        #b45309;   /* topic change / mode change */
--server:        #1d4e89;   /* server notice — deep blue, not gradient */

/* Reserved */
--highlight:     #f0c800;   /* text selection highlight (Chicago-yellow tint) */
```

12 colors total. No room for purple. No room for gradients. No room for decoration.

## 5. Typography

| Use | Font | Size | Weight |
|---|---|---|---|
| Window titlebar | IBM Plex Sans | 12px | 700 |
| Menubar | IBM Plex Sans | 12px | 500 |
| Statusbar | IBM Plex Mono | 11px | 400 |
| Body text | IBM Plex Sans | 14px | 400 |
| Body text (Burmese) | Noto Sans Myanmar | 15px | 400 |
| Message text (chat) | IBM Plex Mono | 13px | 400 |
| Message text (Burmese chat) | Noto Sans Myanmar | 14px | 400 |
| Headings | IBM Plex Sans | 18-32px | 700 |
| Numerals | IBM Plex Mono | 12-14px | 500 |
| Labels | IBM Plex Sans | 11px | 500, uppercase, letter-spacing 0.04em |

No italics. No gradient text. No font-weights below 400.

## 6. Geometry

- `--radius: 0` — sharp edges. Global.
- `--border-hair: 1px solid var(--rule)` — visible structure without weight
- `--border-strong: 2px solid var(--ink)` — focused state
- `--grid-unit: 8px` — all padding/margins/gaps are multiples of 8
- `--padding-pane: 8px` — internal window padding
- `--padding-control: 4px 8px` — button / input padding
- `--titlebar-height: 28px` — standard window titlebar
- `--menubar-height: 22px` — standard menubar
- `--statusbar-height: 22px` — standard statusbar

## 7. Layout — the "Chicago desktop" pattern

Each surface is a window. Multiple windows tile on a desktop. Within a window:

```
┌──────────────────────────────────────────────────┐
│ ●  Pirchchat — #monastic-youth           — □ × │   ← titlebar (28px)
├──────────────────────────────────────────────────┤
│ File  View  Room  Help                          │   ← menubar (22px)
├──────────────────────────────────────────────────┤
│                                                  │
│           [ work area, scrollable ]              │
│                                                  │
├──────────────────────────────────────────────────┤
│ Connected • 47 users online • Thai/EN/MM         │   ← statusbar (22px)
└──────────────────────────────────────────────────┘
```

Multi-window layouts on the desktop:

```
┌────────────────────┐ ┌────────────────────┐
│ #monastic-youth    │ │ #bkk-burmese       │
│                    │ │                    │
│                    │ │                    │
└────────────────────┘ └────────────────────┘
┌─────────────────────────────────────────────┐
│ Atlas — Burmese diaspora, last 7 days       │
│                                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Digest — Today                               │
│                                             │
└─────────────────────────────────────────────┘
```

Mobile (PWA): windows stack vertically. No desktop drag-and-drop on mobile. The desktop metaphor is desktop-only.

## 8. Anti-slop enforcement (re-asserted for this aesthetic)

These are project-wide rules. They are not negotiable for the 16-bit aesthetic.

1. **No rounded corners.** Anywhere. `border-radius: 0` globally.
2. **No drop shadows.** `box-shadow: none` globally.
3. **No gradients.** `background-image: none` on chrome elements.
4. **No purple, violet, indigo.** Palette excludes these. Period.
5. **No emoji as design elements.** Labels only.
6. **No "AI sparkle" or "AI glow".** Static surfaces.
7. **No emoji in copy.** Plain Burmese-script-natural text.
8. **No glassmorphism.** Solid surfaces only.
9. **No AI default fonts.** System-feel fonts only.
10. **No centering for body text density.** Left-aligned.

The 16-bit aesthetic is **inherently aligned** with most of these rules. The era had sharp edges, no shadows, no gradients, limited colors. The era was honest about what a computer was. Modern flat design's anti-slop rules are partly a return to that honesty.

## 9. Accessibility

- WCAG AA contrast on all text (`--ink` on `--paper` is 12.7:1, well above 7:1 AAA)
- Status text uses `--ink-muted` on `--paper` — 6.4:1, AA pass
- All interactive elements have visible focus state (`--accent` border on focus)
- Burmese script line-height minimum 1.7 (vs Latin 1.55) — accommodates stacked diacritics
- No color-only signaling. System messages use color + text prefix.

## 10. Implementation plan

1. **Tokens** — copy this palette into `src/styles/tokens.css` (Burma project) and as CSS custom properties in `docs/pirch-theme.css` (already drafted)
2. **Components** — titlebar, menubar, statusbar, window — built once in `src/components/chrome/`
3. **Per-surface themes** — each surface (Rooms, Digest, Listening, Atlas, Career Navigator) inherits the chrome tokens and adds surface-specific overrides
4. **Theme file** — `docs/pirch-theme.css` for The Lounge deployment is the first concrete surface

---

*Owner: Dr Non (Axiom). Reviewer: a Burmese-speaking moderator + a Western Burmese-speaker under 25 before each surface ships.*