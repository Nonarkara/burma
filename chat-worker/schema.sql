-- Pirchchat — D1 schema
-- Run with:
--   wrangler d1 execute pirchchat --file=schema.sql --remote

CREATE TABLE IF NOT EXISTS rooms (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  topic       TEXT,
  created_at  INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS members (
  room_id     TEXT NOT NULL,
  nick        TEXT NOT NULL,
  role        TEXT DEFAULT '',
  since       INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (room_id, nick)
);

CREATE TABLE IF NOT EXISTS messages (
  id                  TEXT PRIMARY KEY,
  room_id             TEXT NOT NULL,
  author_name         TEXT NOT NULL,
  author_pubkey       TEXT NOT NULL,
  body_html           TEXT,
  image_url           TEXT,
  link_preview_json   TEXT,
  topics              TEXT,
  ts                  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_room_ts ON messages(room_id, ts DESC);

CREATE TABLE IF NOT EXISTS identities (
  pubkey      TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT,
  first_seen  INTEGER DEFAULT (unixepoch()),
  last_seen   INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS uploads (
  id                  TEXT PRIMARY KEY,
  r2_key              TEXT NOT NULL,
  uploaded_by_pubkey  TEXT NOT NULL,
  uploaded_at         INTEGER NOT NULL,
  size_bytes          INTEGER,
  content_type        TEXT,
  url                 TEXT
);

CREATE INDEX IF NOT EXISTS idx_uploads_pubkey ON uploads(uploaded_by_pubkey);

CREATE TABLE IF NOT EXISTS pinned_locations (
  id        TEXT PRIMARY KEY,
  pubkey    TEXT NOT NULL,
  lat       REAL NOT NULL,
  lng       REAL NOT NULL,
  note      TEXT,
  ts        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pins_ts ON pinned_locations(ts DESC);

-- Bans — pubkey-level blocks managed by human moderators.
-- A mod pubkey records who applied the ban; reason is plain text, not
-- structured, so a native reviewer can keep it short and unambiguous.
CREATE TABLE IF NOT EXISTS bans (
  pubkey      TEXT PRIMARY KEY,
  reason      TEXT,
  banned_by   TEXT NOT NULL,
  banned_at   INTEGER NOT NULL,
  expires_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_bans_expires ON bans(expires_at);

-- Moderation log — append-only audit trail. Every ban / unban / room
-- action is recorded so the community can see who did what.
CREATE TABLE IF NOT EXISTS mod_log (
  id          TEXT PRIMARY KEY,
  ts          INTEGER NOT NULL,
  mod_pubkey  TEXT NOT NULL,
  action      TEXT NOT NULL,
  target      TEXT,
  room_id     TEXT,
  note        TEXT
);

CREATE INDEX IF NOT EXISTS idx_mod_log_ts ON mod_log(ts DESC);
