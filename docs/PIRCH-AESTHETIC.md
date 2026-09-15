# PIRCH Aesthetic — Spec for the Burma Community Channel

**Reference:** `reference-pirch98.png` (PIRCH98, Northwest Computer Services, 1998 — CC-licensed screenshot from Wikipedia).
**Date:** 2026-09-15
**Purpose:** Translate the PIRCH98 visual DNA into a modern theme for The Lounge deployment serving Burmese youth. Keep what works; cut the dated 1990s chrome.

---

## 1. What we are copying

The aesthetic principles that made PIRCH98 feel right in 1998 — and still feel right in 2026 — are these:

### Information density
At any moment, the user sees: the server connection, the active channels, the people in each channel, the recent messages, and the connection status. Nothing is hidden behind a hamburger menu. Nothing requires a tap to reveal. The screen is always full of information, and the user scans it the way they scan a newspaper.

**Translation to The Lounge:** keep the default multi-pane layout — sidebar (channel list + user list), main chat area, input box at the bottom. Do not collapse to single-pane on desktop.

### Visible peer presence
Every channel pane has a member list on the right. You can see who is in the room without typing. This is the heart of the PIRCH feeling: someone is *there*, even when no one is talking.

**Translation to The Lounge:** keep the right-side member list, do not hide it. Make online users visually distinct from away users (a hairline, not a color — see tokens).

### Multi-channel simultaneous view
PIRCH98 showed two chat windows stacked by default. You could be in #mp3pedia and #wikipedia at the same time, watching both.

**Translation to The Lounge:** keep the tabbed channel switcher at the top, plus the sidebar list. Two visible channels on desktop if the window is wide enough.

### Status line at the bottom
"irc.americas.org.au: Connected" — the connection state is always visible. You never wonder if you are connected.

**Translation to The Lounge:** keep the status bar visible at the bottom, with server name, nickname, and connection indicator.

### Topic line at the top of each channel
"#wikipedia Topic set by..." — every channel declares what it is for. This is the orientation principle.

**Translation to The Lounge:** keep the topic banner. Make it more legible than the default theme.

### System message semantics
- Green = join / connect
- Red = part / kick / disconnect
- Yellow = mode change / topic change
- Blue = notice from server

These colors carry information. They are not decoration. A reader who knows the convention can scan the scrollback and read the lifecycle of the room in three seconds.

**Translation to The Lounge:** keep system messages in semantic colors. Bind them to our house tokens, not to the IRC client's default palette.

### Monospace messages
Chat text is monospace. Burmese script renders cleanly in monospace (Noto Sans Myanmar handles it). Spacing, indentation, ASCII art, and Burmese line-breaks all align.

**Translation to The Lounge:** set chat font to `IBM Plex Mono` (Latin) with `Noto Sans Myanmar` fallback for Burmese ranges.

---

## 2. What we are rejecting

These are 1990s specifics that hurt the 2026 version:

| Reject | Why |
|---|---|
| Skeuomorphic 3D bevels (raised buttons, sunken input boxes) | Dated visual language. Flat surfaces read cleaner and age better. |
| Tiny icons with no labels | Modern accessibility rules require icon labels or visible tooltips. |
| Heavy gray 3D borders | Replaced by hairline borders (`1px solid var(--color-rule)`). |
| Windows 9x chrome (title bar, menu bar) | Replaced by modern browser chrome. |
| Italic system fonts | Slop. We use weight + letter-spacing for emphasis. |
| Pastel highlight colors | Use saffron (`#d4a017`) as single accent. No purple, no blue gradients. |

---

## 3. The modern translation — house tokens for The Lounge

### Color tokens (matching AGENTS.md §5)

```css
--paper:        #faf9f7;   /* warm paper background */
--ink:          #102a43;   /* deep blue-gray text */
--ink-muted:    #486581;   /* secondary text */
--rule:         #cfd8dc;   /* hairline borders, inactive chrome */

--accent:       #d4a017;   /* saffron — active channel, selected nick */
--accent-soft:  #f6e9c4;   /* active channel background, hover */

--positive:     #2e7d32;   /* join / connect (Burmese-friendly green) */
--negative:     #a51931;   /* part / kick (flag red) */
--notice:       #b45309;   /* topic / mode (amber) */
--server:       #1d4e89;   /* server notice (deep blue, not gradient) */

--burma-font:   'Noto Sans Myanmar', 'Pyidaungsu', sans-serif;
--mono:         'IBM Plex Mono', monospace;
```

### Geometry

```css
--radius: 0;                  /* zero. everything sharp. */
--border-hair: 1px solid var(--rule);
--border-strong: 2px solid var(--ink);
--padding-pane: 0.75rem;
--line-height-message: 1.55;  /* Burmese needs slightly more leading */
```

### Layout proportions

| Element | Proportion |
|---|---|
| Sidebar (channel list) | 180px fixed |
| Member list per channel | 140px fixed |
| Main chat area | Remaining width |
| Tab strip height | 36px |
| Status bar height | 24px |
| Input box height | 64px (2 lines visible) |

### Typography rules

- **Channel name (active):** `var(--mono)` 13px, weight 700, saffron
- **Channel name (idle):** `var(--mono)` 13px, weight 400, ink-muted
- **Username (regular):** `var(--mono)` 12px, weight 500
- **Username (operator):** saffron
- **Username (voiced):** notice color
- **Message body:** `var(--mono)` 13px, ink, line-height 1.55
- **Burmese fallback:** `var(--burma-font)` for any character in Myanmar Unicode block (U+1000–U+109F, U+AA60–U+AA7F, U+A9E0–U+A9FF)
- **Topic:** `var(--mono)` 12px, ink-muted
- **Status bar:** `var(--mono)` 11px, ink-muted

### System message semantics (the part that matters)

```css
.message--join    { color: var(--positive); }
.message--part    { color: var(--negative); }
.message--kick    { color: var(--negative); font-weight: 700; }
.message--mode    { color: var(--notice); }
.message--topic   { color: var(--notice); }
.message--server  { color: var(--server); }
.message--error   { color: var(--negative); background: var(--accent-soft); }
```

These are not decorative. They are functional. A Burmese user who arrives mid-conversation can scroll back and read the room's history without parsing each message.

---

## 4. What this gets us

A community surface that feels like:

- **PIRCH98** for the information density, member lists, multi-channel view, status line
- **Burma project house style** for the typography, color, and anti-slop rules
- **2026 web standards** for accessibility, mobile-first PWA, low-bandwidth

The aesthetic test: if a Burmese youth opens the channel on a 3G connection in Mae Sot and sees the active member list, the topic line, and recent messages within 3 seconds — the design has done its job. Everything else is decoration.

---

## 5. Reference image

`reference-pirch98.png` (CC-licensed screenshot from Wikipedia, 367×271 px, 1998). Saved alongside this document for comparison during theme development.

---

*Owner: Dr Non (Axiom). Reviewer: a Burmese-speaking moderator before the spike ships.*