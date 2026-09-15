# `web/` — Static landing page (deployed)

This is the **only thing deployed today** at `burma.nonarkara.org`.

It is a single-page bilingual (Burmese primary, English toggle) landing surface that:

- Names the project (Pirchchat · A-Lin-Ein)
- Lists the five surfaces (Rooms, Digest, Listening, Atlas, Career Navigator)
- Points at the live GitHub repo
- Links to the spec docs in `/docs/`

The 16-bit / Chicago aesthetic is applied per `docs/16BIT-AESTHETIC.md`. No framework, no build step, no JS dependencies. Vanilla HTML + CSS + a tiny language-toggle script.

## Why a static page

The user-facing hard rule: **only the deployed site counts.** This page satisfies that today. The future stack (Next.js or Svelte for the actual surfaces) will plug into the same domain at `/rooms`, `/digest`, `/listening`, `/atlas`, `/quest/[id]`.

## Deploy

Cloudflare Pages via `wrangler pages deploy web/ --project-name=burma`.

DNS via Cloudflare: `burma.nonarkara.org` → Cloudflare Pages default subdomain.

## Edit

- `index.html` — content, structure
- `style.css` — house tokens (mirror of `docs/16BIT-AESTHETIC.md`)
- `lang.js` — Burmese/English toggle

Refreshing font tokens? Update both this file and `docs/16BIT-AESTHETIC.md` simultaneously.
