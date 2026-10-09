# chat-worker — real-time chat backend

A separate Cloudflare Worker project (`pirchchat-chat`) that powers the chat room on the dashboard with real persistence and fan-out.

## What this is

One Worker, deployed at `https://pirchchat-chat.<account>.workers.dev` (currently `pirchchat-chat.drnon.workers.dev`), providing:

- A Durable Object (`ChatRoomDO`) per room — one instance per `monastic-youth`, `bkk-burmese`, etc.
- WebSocket fan-out via the Hibernation API (`ctx.acceptWebSocket`). Idle rooms are evicted from memory; clients stay connected and duration is not billed until the next message.
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
| WS   | `/api/rooms/<id>` | Real-time fan-out. Refused at 200 sockets in the room, or 5 sockets from one `CF-Connecting-IP`, with HTTP 429 (`room_full` / `ip_session_cap`). |

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
- Per-IP message rate limit: 12 messages/minute/room. The window is stored on the room Durable Object so a hibernation wake does not reset it. REST falls back to the `X-Pirchchat-Identity` header when `CF-Connecting-IP` is absent. WebSocket sessions use `CF-Connecting-IP`, or the shared key `anonymous` when that header is missing (local dev).
- Session caps, separate from the message limit: 200 WebSockets per room, 5 per IP in that room.
- Names are chosen freely (collision is cosmetic — same nick across two browsers looks identical).

Phase 2 (next):
- Browser generates an Ed25519 keypair on first visit.
- Public key sent with each message; private key stays in `localStorage`.
- Server verifies each message's signature, so a switched identity cannot pass as the previous one without the private key.
- Email used for account recovery only; never required for posting.

## Billing

`server.accept()` kept `ChatRoomDO` in memory for the whole socket lifetime, so an idle room was billed for duration. `this.ctx.acceptWebSocket()` plus `webSocketMessage` / `webSocketClose` / `webSocketError` lets the runtime hibernate the object. Ping/pong is answered by the platform and does not wake it. Do not add `setTimeout` or `setInterval` inside the class; a pending timer blocks hibernation.

In-memory history and the `started` flag reset when the object is evicted. A new socket loads history from D1 during `fetch`. A connect that is already over the session cap is refused before that read. A message that arrives on a hibernated socket still inserts into D1 before it is broadcast. Socket identity (nick, IP key) is a serialized attachment, which survives hibernation. The `rooms` row flag and the 12/minute window are Durable Object storage keys (`ensured_room`, `message_times`).

The `rooms` INSERT OR IGNORE used to run in the Worker on every room request, including every WebSocket connect. The Worker now forwards the room slug in `x-pirchchat-room`. The Durable Object writes the row once, stores the slug, and skips D1 on later requests and later wakes.

## Production class missing from git: RateLimiterDO

`RateLimiterDO` is not in this repository. It is not in `main` or `claude/review-cleanup-tp961a`, and it does not appear in the chat Worker history. This environment had no Cloudflare API token, so the script deployed as Worker `pirchchat-chat` could not be downloaded and the class was not reconstructed. A guessed class would overwrite whatever production is running the moment someone deploys.

`wrangler.toml` still contains only:

```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["ChatRoomDO"]
```

There is no `deleted_classes` entry. Leave it that way. Deploying this config while production still exports `RateLimiterDO` should be rejected by the Workers API, because the new script would drop a class without a migration that says so. Do not clear that rejection by adding `deleted_classes` unless the class is being retired on purpose.

### Export the deployed script before the next production deploy

`wrangler deploy --dry-run` bundles git. It does not fetch production. From a machine logged into the account that owns `pirchchat-chat`:

```bash
npx wrangler deployments status --name pirchchat-chat --config chat-worker/wrangler.toml
npx wrangler versions list --name pirchchat-chat --config chat-worker/wrangler.toml
```

`versions list` shows version ids, not module source. Download the serving script with the API. A module Worker comes back as `multipart/form-data` (JavaScript files plus a metadata part), not one plain file.

```bash
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/pirchchat-chat/deployments"

curl -sS -D /tmp/pirchchat-chat-headers.txt \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/pirchchat-chat" \
  -o /tmp/pirchchat-chat-deployed.bin

curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/pirchchat-chat/settings"
```

The dashboard path is Workers & Pages → `pirchchat-chat` → the deployment's code view, then save the modules. The account id is the Cloudflare account that owns the Worker (Wrangler prints it from `wrangler whoami`).

If the export's handlers include `RateLimiterDO`:

1. Copy that module into `chat-worker/src/` unchanged.
2. `export { RateLimiterDO }` from `src/index.js` next to `ChatRoomDO`.
3. Copy the binding and the migration tags from the deployed settings exactly. Do not rewrite the existing `v1` tag. If production already applied a later tag for `RateLimiterDO`, put that same tag in `wrangler.toml`. Do not append a second `new_sqlite_classes` / `new_classes` entry for a class that already exists.
4. Deploy only after `npx wrangler deploy --dry-run --config chat-worker/wrangler.toml` reports the same class list as the export.

## Migration and deploy

Hibernation, the session caps, and the room-row cache do not add a migration. `ChatRoomDO` stays the v1 SQLite class. Existing Durable Object storage is kept. No D1 schema change.

Deploying recycles the process. Sockets accepted with `server.accept()` do not move onto the Hibernation API. The dashboard client reconnects with backoff (cap 8 seconds). Expect one disconnect per open room at deploy.

```bash
cd chat-worker
npx wrangler d1 execute pirchchat --file=schema.sql --remote   # one-time; safe to re-run, tables use IF NOT EXISTS
npx wrangler deploy --dry-run --config wrangler.toml           # confirm it does not want to delete a class
npx wrangler deploy --config wrangler.toml                     # only after RateLimiterDO is accounted for
```

The Worker is bound to the `pirchchat` D1 database and the `pirchchat-uploads` R2 bucket. Resource IDs are in `wrangler.toml`; credentials remain in Wrangler authentication storage or environment variables. `compatibility_flags` already includes `web_socket_auto_reply_to_close`. `webSocketClose` still calls `ws.close` so the handshake completes when that flag is off. The compatibility date stays `2025-09-01`.

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

## Repair notes (16 September 2026)

POST success now includes the saved message and only follows a successful D1 insert. Storage failures return an error without broadcasting. Live member lists reflect current socket connections; old seeded database rows are retained but are not presented as online members. Uploads accept PNG/JPEG/GIF/WebP up to 700KB and return an absolute CDN URL. Existing D1 room keys are preserved, avoiding a destructive migration. `/api/health` checks D1 access; local integration tests exercise writes and fan-out.
