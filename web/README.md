# `web/` — Static site (deployed)

This is the only deployable surface today, at `burma.nonarkara.org`.

## Files

- **`index.html`** — landing page. MoMA-discipline composition: one dominant typographic statement, asymmetric balance, generous whitespace, single saffron accent. IBM Plex Serif for display, IBM Plex Sans for body, IBM Plex Mono for technical.
- **`style.css`** — landing page styles.
- **`room.html`** — chat room interior. Authentic Windows 95 / PIRCH98 chrome. 2-tone bevel borders, gray chrome, monospace messages, member list on the right, ch chunky scrollbars, status bar at the bottom.
- **`room.css`** — chat room styles.
- **`room.js`** — small JS that posts user input back to the same scrollback and seeds a few extra messages so visitors see the room "in motion." Server is not real — this is an honest demo until Surface 1 (Hetzner CX22) ships.

## Floors

- No build step, no JS framework, no dependencies.
- Cloudflare Pages serves the directory directly. `web/README.md` is not deployed (Pages serves files listed in `_headers` + matching MIME types).

## Why no build step

The hard rule: "Only the deployed site counts." Static HTML on Cloudflare Pages is the fastest path from "the user said to do it" to "the user can see it." Framework setup can come later for the actual surfaces (Digest, Listening, Atlas, Career Navigator).

## Aesthetic note

The landing page and the chat room page deliberately look like two different designers' work from two different decades. The landing is museum-poster-clean. The room is Win95 chrome.

This is on purpose. The outer surface (how the project presents itself) lives in the design language of 2026. The inner surface (the room the Burmese community actually lives in) lives in the visual register of the late 1990s — because that is what the brief asked for, and because that is what worked once for IRC communities in Thailand.

## Edit

Refreshing house tokens? Update three places simultaneously:
1. `docs/16BIT-AESTHETIC.md` — the spec
2. `src/styles/tokens.css` — implementation (for when the framework ships)
3. `web/style.css` and `web/room.css` — the deployed site

Drift between any two is a bug.
