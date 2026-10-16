#!/usr/bin/env bash
# Start the promo copy of the site on http://localhost:8018, for recording
# Instagram videos (G:\Repos\promo\darshan\capture.mjs). It starts from the
# newest nightly backup of production's data/ (pulled to "G:\apps backup"
# every day), unpacked into data/promo/, so the show, its description and its
# covers are the real ones; promo/seed.ts then adds demo episodes and
# inquiries, because production has none yet. Production, the dev site (8006)
# and data/podcast.db are never touched.
#   bash promo/up.sh            # restore + seed (only if data/promo is empty), start
#   bash promo/up.sh --fresh    # throw data/promo away and do it again
# Remove everything with: bash promo/down.sh
set -euo pipefail
cd "$(dirname "$0")"
BACKUPS="${BACKUPS:-/g/apps backup}"
DATA=../data/promo
URL=http://localhost:8018

if [ "${1:-}" = "--fresh" ]; then docker compose down 2>/dev/null || true; rm -rf "$DATA"; fi
fresh=no
if [ ! -f "$DATA/podcast.db" ]; then
  latest="$(ls -d "$BACKUPS"/20*/ | sort | tail -1)"
  echo "restoring ${latest}podcast-site.tar.gz"
  mkdir -p "$DATA"
  tar -xzf "${latest}podcast-site.tar.gz" --strip-components=1 -C "$DATA"
  fresh=yes
fi

docker compose up --build -d
for _ in $(seq 60); do
  curl -sf --noproxy '*' --max-time 3 "$URL/robots.txt" >/dev/null && break
  sleep 1
done
if [ "$fresh" = yes ]; then
  docker compose exec -T web npx tsx promo/seed.ts
fi
echo "promo site: $URL"
