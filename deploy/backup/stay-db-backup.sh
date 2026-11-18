#!/bin/sh
# Daily compressed dump of the Stay database; keeps 7 days. Installed by scripts/deploy.stay.sh.
# Restore: gunzip -c FILE | docker compose -p stay exec -T postgres psql -U "$USER" -d "$DB"
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$DIR/backups/daily"
# shellcheck disable=SC1091
. "$DIR/.env.stay.prod"
DB="${STAY_DATABASE_NAME:-p4_stay}"
USER="${STAY_DATABASE_USERNAME:-stay}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$DIR/backups" "$BACKUP_DIR"
FILE="$BACKUP_DIR/$DB-$(date -u +%Y%m%d-%H%M%S).sql.gz"

docker compose -f "$DIR/docker-compose.stay.yml" -p stay exec -T postgres \
  pg_dump -U "$USER" -d "$DB" --no-owner | gzip -9 > "$FILE"
chmod 600 "$FILE"
find "$BACKUP_DIR" -name '*.sql.gz' -mtime +7 -delete
echo "$(date -u +%FT%TZ) backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
