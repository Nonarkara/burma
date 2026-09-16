#!/bin/bash
# pirchchat-archive.sh — daily download of all chat messages to a local mirror.
#
# Runs on the M3 Mac under launchd. Each day produces:
#   ~/pirchchat-archive/YYYY-MM-DD/<room>.json
#   ~/pirchchat-archive/YYYY-MM-DD/rooms.json
#   ~/pirchchat-archive/YYYY-MM-DD/uploads.json    (R2 bucket key list)
#
# Install:
#   mkdir -p ~/pirchchat-archive
#   cp mirror.sh ~/pirchchat-archive/mirror.sh
#   chmod +x ~/pirchchat-archive/mirror.sh
#   # launchd plist in ~/Library/LaunchAgents/com.drnon.pirchchat.archive.plist
#   launchctl load ~/Library/LaunchAgents/com.drnon.pirchchat.archive.plist

set -euo pipefail

API_BASE="${PIRCHCHAT_API_BASE:-https://pirchchat-chat.drnon.workers.dev}"
ARCHIVE_DIR="${PIRCHCHAT_ARCHIVE:-$HOME/pirchchat-archive}"
RETENTION_DAYS="${PIRCHCHAT_RETENTION_DAYS:-30}"

TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
DAY=$(date -u +"%Y-%m-%d")
OUT="$ARCHIVE_DIR/$DAY"

mkdir -p "$OUT"

ROOMS=(monastic-youth bkk-burmese cm-burmese digest-today listening-club)

echo "[pirchchat-archive] $TS starting"

for room in "${ROOMS[@]}"; do
  of="$OUT/${room}.json"
  if ! curl -sLf --max-time 30 "$API_BASE/api/rooms/${room}/history?limit=200" -o "$of"; then
    echo "  ! room fetch failed: $room"
    continue
  fi
  size=$(wc -c < "$of" | tr -d ' ')
  echo "  - $room $size bytes"
done

if ! curl -sLf --max-time 10 "$API_BASE/api/rooms" -o "$OUT/rooms.json"; then
  echo "  ! rooms fetch failed"
fi

echo "[pirchchat-archive] wrote $OUT"

# Sweep old days
if [ "$RETENTION_DAYS" -gt 0 ]; then
  find "$ARCHIVE_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$RETENTION_DAYS" -print -exec rm -rf {} \; 2>/dev/null || true
fi

echo "[pirchchat-archive] done"
