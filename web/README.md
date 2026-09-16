# `web/` — Static site (deployed)

This is the only deployable surface today, at `https://burma-a3k.pages.dev`. The custom hostname is awaiting its DNS CNAME.

## Files

- **`index.html`** — landing page. MoMA-discipline composition: one dominant typographic statement, asymmetric balance, generous whitespace, single saffron accent. IBM Plex Serif for display, IBM Plex Sans for body, IBM Plex Mono for technical.
- **`style.css`** — landing page styles.
- **`room.html`** — chat room interior. Authentic Windows 95 / PIRCH98 chrome. 2-tone bevel borders, gray chrome, monospace messages, member list on the right, ch chunky scrollbars, status bar at the bottom.
- **`room.css`** — chat room styles.
- **`room.js`** — standalone room logic: nickname prompt, /nick /me /help /clear /channels, toolbar (connect/mode/channels/favorites/timestamps/beep/events/greeting/file-send/chat/link) and menubar dropdowns. Server is not real — this is an honest demo until Surface 1 (Hetzner CX22) ships.
- **`survival.js`** — curated Thai-side survival knowledge (visa renewal, Saturday desk, Mae Tao + Phahon Yothin clinics, dengue/haze, kyat–baht, housing split, bakery training, monastery, Mae Sai). Plus phrasebook (Burmese/Thai/English), human hotlines, crisis keyword matcher.
- **`chrome.js`** — every button does something: Win95 dropdown menus (File/View/Layers/Tools), titlebar minimize/maximize/close, Guide + Hotlines toolbar buttons, news export, chat help, crisis banner wiring, mention beep, keyboard shortcuts (G guide, B basemap, F fit, W weather-pick).
- **TV panel** — DVB TV plays inline via its own public HLS (`live-stream.dvb.no`, verified live Sept 2026, hls.js for non-Safari). YouTube channels disallow embedding, so Mizzima / Irrawaddy / Khit Thit / Frontier are Watch cards that open the live search page — no dead iframes.
- **Map evidence layers** — NASA GIBS MODIS Terra true-color (yesterday, no key), USGS earthquakes M4.5+ 30d (click for depth/time/tsunami flag), click-anywhere weather via Open-Meteo (no key), RainViewer rain. JMA Himawari-9 + NASA FIRMS fires as link-outs under Layers.
- **Jobs tab (Guide)** — verified job boards (Sabai Job, DOE, JobThai, JobsDB, MAP Foundation), a 6-line good-job checklist, 5 walk-away red flags, per-board Discuss buttons that drop the question into #bkk-burmese.

## Floors

- No build step, no JS framework, no dependencies.
- Cloudflare Pages serves the directory directly. `web/README.md` is not deployed (the audited deployment staging excludes README files; `_headers` controls response headers, not file inclusion).

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

## Audit repair (16 September 2026)

The dashboard uses `chat-client.js` and the real chat Worker. `room.html` remains a historical local demo; the landing page now links directly to live dashboard chat. Desktop shows map + news/chat, while widths up to 920px use full-width tabs. News is a static, unverified preview. Presence comes from sockets, and nicknames are unverified. See `../docs/AUDIT-2026-09-16.md`.
