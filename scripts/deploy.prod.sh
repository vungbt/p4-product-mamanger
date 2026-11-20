#!/bin/bash
# SSH command arguments intentionally expand locally before transmission.
# shellcheck disable=SC2029
set -euo pipefail

# ===========================================
# Deploy P4 Product Manager API — PRODUCTION
# Cùng VPS với coupon-linkh (SSH host: couponlinkh)
# Web deploy riêng bằng scripts/deploy.web.sh — script này deploy API + worker
# ===========================================

SERVER="${SERVER:-couponlinkh}"
REMOTE_DIR="${REMOTE_DIR:-/root/apps/p4-product-manager}"
ENV_FILE=".env.prod"
cd "$(dirname "$0")/.."
# shellcheck source=scripts/lib/deploy.sh
source scripts/lib/deploy.sh
GIT_SHA="$(git rev-parse HEAD)"
trap 'rm -f p4-api.tar.gz' EXIT

while [[ $# -gt 0 ]]; do
  case $1 in
    --server) SERVER="$2"; shift 2 ;;
    --)       shift ;;
    --help)
      echo "Usage: ./scripts/deploy.prod.sh [--server user@host|ssh-alias]"
      echo ""
      echo "Default SSH host: couponlinkh (same VPS as coupon-linkh)"
      echo "Uses local .env.prod when present, otherwise the server copy."
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "========================================"
echo "  PRODUCTION Deploy (API + Postgres)"
echo "  Server:  $SERVER"
echo "  Remote:  $REMOTE_DIR"
echo "========================================"
echo ""

UPLOAD_FILES=(p4-api.tar.gz docker-compose.yml deploy/backup/p4-db-backup.sh)
if [[ -f "$ENV_FILE" ]]; then
  UPLOAD_FILES+=("$ENV_FILE")
elif ssh "$SERVER" "test -f '$REMOTE_DIR/$ENV_FILE'"; then
  echo "==> No local $ENV_FILE — reusing the server copy."
else
  echo "Missing $ENV_FILE locally and on $SERVER — copy from .env.prod.example and fill production values."
  exit 1
fi

ssh "$SERVER" "mkdir -p '$REMOTE_DIR'"

echo "==> Building API image (linux/amd64)..."
docker build --build-arg GIT_SHA="$GIT_SHA" --platform linux/amd64 -f apps/api/Dockerfile -t p4-api:latest .
docker save p4-api:latest | gzip > p4-api.tar.gz

echo "==> Uploading to $SERVER..."
scp "${UPLOAD_FILES[@]}" "$SERVER:$REMOTE_DIR/"

echo "==> Loading image and restarting..."
run_remote_script api.sh p4-api "$REMOTE_DIR" "$GIT_SHA"
verify_public_api p4-api "$REMOTE_DIR" "${P4_API_URL:-https://p4-api.itclabs.site}/health" "$GIT_SHA"

rm -f p4-api.tar.gz

echo "==> Cleaning local p4-api images (keeping p4-api:latest)..."
docker images p4-api --format '{{.Repository}}:{{.Tag}}' \
  | grep -vx 'p4-api:latest' \
  | while read -r image; do docker rmi "$image" || true; done || true
docker image prune -f

echo ""
echo "==> PRODUCTION deploy complete!"
echo "    API: https://p4-api.itclabs.site  (health: /health)"
echo "    API :3001 and Postgres :5433 listen on the server loopback only."
echo "    Rollback: docker tag p4-api:previous p4-api:latest, then compose up -d api worker on $SERVER."
echo "    Web: https://p4.itclabs.site (pnpm deploy:web)"
