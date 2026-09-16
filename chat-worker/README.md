# chat-worker — real-time chat backend

A separate Cloudflare Worker project (`pirchchat-chat`) that powers the chat room on the dashboard with real persistence and fan-out.

## What this is

One Worker, deployed at `https://pirchchat-chat.<account>.workers.dev` (currently `pirchchat-chat.drnon.workers.dev`), providing:

- A Durable Object (`ChatRoomDO`) per room — one instance per `monastic-youth`, `bkk-burmese`, etc.
- WebSocket upgrade for live fan-out
- REST history, message-post, and pin endpoints
- R2-backed image uploads
- D1-backed persistent message archive

The dashboard at `burma.nonarkara.org` (or `burma-a3k.pages.dev`) calls this Worker cross-origin via fetch + WebSocket.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/health` | Status, list of rooms |
| GET  | `/api/rooms` | Rooms + member lists |
| GET  | `/api/rooms/<id>/history?limit=50` | Recent messages from D1 |
| POST | `/api/rooms/<id>/message` | Post message (rate-limited 12/min) |
| POST | `/api/rooms/<id>/pin` | Drop a manual pin (geocoded marker) |
| GET  | `/api/rooms/<id>/pins` | List pins |
| POST | `/api/upload` (multipart) | Image upload to R2 |
| GET  | `/cdn/<r2-key>` | Public image fetcher |
| WS   | `/api/rooms/<id>` | Real-time fan-out |

## Data model

D1 tables (see `schema.sql`):

- `rooms` — id, title, topic
- `members` — per-room nicks with role (op / voice / away)
- `messages` — id, room, author, pubkey, body, image_url, link_preview, topics, ts
- `identities` — pubkey → name/email (optional, used for member lookups)
- `uploads` — R2 key → uploader pubkey, size, content type
- `pinned_locations` — manual map pins

R2 bucket: `pirchchat-uploads` — image attachments, served publicly via `/cdn/`.

## Auth model

Phase 1 (now):
- Every browser generates a per-browser random `network_id` (e.g. `user_a7d3c1f0...`).
- Network ID is the "we remember you" identifier.
- Per-IP rate limit: 12 messages/minute/room.
- Names are chosen freely (collision is cosmetic — same nick across two browsers looks identical).

Phase 2 (next):
- Browser generates an Ed25519 keypair on first visit.
- Public key sent with each message; private key stays in `localStorage`.
- Server verifies each message's signature, so a switched identity cannot pass as the previous one without the private key.
- Email used for account recovery only; never required for posting.

## Deploy

```bash
cd chat-worker
wrangler d1 execute pirchchat --file=schema.sql --remote   # one-time
wrangler deploy                                       # every commit
```

The Worker is bound to the `pirchchat` D1 database and the `pirchchat-uploads` R2 bucket. Credentials are in `wrangler.toml`.

## M3 Mac mirror

`archive-mac/mirror.sh` runs nightly under launchd. Pulls the day's messages to `~/pirchchat-archive/YYYY-MM-DD/`. This is an audit mirror — Cloudflare is the primary, the Mac is the backup.

Install on the M3 Mac:

```bash
mkdir -p ~/pirchchat-archive
cp chat-worker/archive-mac/mirror.sh ~/pirchchat-archive/mirror.sh
chmod +x ~/pirchchat-archive/mirror.sh
cp chat-worker/archive-mac/com.drnon.pirchchat.archive.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.drnon.pirchchat.archive.plist
```

The mirror script keeps the last 30 days by default. To recover: read the JSON files directly, or load them into a local SQLite.

## Bound to your dashboard

The dashboard (`web/chat-client.js`) connects to this Worker via:
- REST for history and post
- WebSocket for live updates
- Multipart upload for images

Switching back to "seeded" mode (no backend) is a one-line swap of the script src in `dashboard.html`.
