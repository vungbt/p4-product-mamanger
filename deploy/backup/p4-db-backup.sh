#!/bin/bash
# Daily custom-format pg_dump of the production database, installed by scripts/deploy.prod.sh.
# Restore: docker exec -i p4-prod-postgres-1 sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < FILE
set -euo pipefail

CONTAINER="${CONTAINER:-p4-prod-postgres-1}"
BACKUP_DIR="${BACKUP_DIR:-/root/apps/p4-product-manager/backups/daily}"
KEEP_DAYS="${KEEP_DAYS:-7}"

umask 077
mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/p4-$(date -u +%Y%m%dT%H%M%SZ).dump"

docker exec "$CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$file.partial"
mv "$file.partial" "$file"
find "$BACKUP_DIR" -name 'p4-*.dump' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'p4-*.dump.partial' -delete

echo "$(date -u +%FT%TZ) backup ok: $file ($(du -h "$file" | cut -f1))"
