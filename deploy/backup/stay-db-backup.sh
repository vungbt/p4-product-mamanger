#!/usr/bin/env bash
# Compressed dump of the Stay database; keeps KEEP_DAYS (7) days in BACKUP_DIR (backups/daily).
# Installed by scripts/deploy.stay.sh, which also runs it into backups/predeploy before each API deploy.
# Restore: gunzip -c FILE | docker compose -p stay exec -T postgres psql -U "$USER" -d "$DB"
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$DIR/backups/daily}"
KEEP_DAYS="${KEEP_DAYS:-7}"
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
find "$BACKUP_DIR" -name '*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
