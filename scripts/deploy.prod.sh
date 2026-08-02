#!/bin/bash
set -e

# ===========================================
# Deploy P4 Product Manager API — PRODUCTION
# (FE trên Vercel — chỉ deploy postgres + api)
# ===========================================

SERVER="${SERVER:-p4-api}"
REMOTE_DIR="${REMOTE_DIR:-/root/apps/p4-product-manager}"
ENV_FILE=".env.prod"
PROJECT_NAME="p4-prod"
COMPOSE_FILES="-f docker-compose.yml"

while [[ $# -gt 0 ]]; do
  case $1 in
    --server) SERVER="$2"; shift 2 ;;
    --)       shift ;;
    --help)
      echo "Usage: ./scripts/deploy.prod.sh [--server user@host]"
      echo ""
      echo "Requires: .env.prod, SSH host alias or user@ip"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "========================================"
echo "  PRODUCTION Deploy (API + Postgres)"
echo "  Server:  $SERVER"
echo "========================================"
echo ""

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy from .env.example and fill production values."
  exit 1
fi

ssh "$SERVER" "mkdir -p $REMOTE_DIR"

echo "==> Building API image (linux/amd64)..."
docker build --platform linux/amd64 -f apps/api/Dockerfile -t p4-api:latest .
docker save p4-api:latest | gzip > p4-api.tar.gz

echo "==> Uploading to $SERVER..."
scp p4-api.tar.gz docker-compose.yml "$ENV_FILE" "$SERVER:$REMOTE_DIR/"

echo "==> Loading image and restarting..."
ssh "$SERVER" bash -s <<EOF
  set -e
  cd $REMOTE_DIR
  echo "  Loading p4-api.tar.gz..."
  docker load < p4-api.tar.gz
  rm -f p4-api.tar.gz
  docker compose $COMPOSE_FILES --env-file $ENV_FILE -p $PROJECT_NAME up -d postgres api
  docker image prune -f
  echo ""
  docker compose -p $PROJECT_NAME ps
EOF

rm -f p4-api.tar.gz

echo ""
echo "==> PRODUCTION deploy complete!"
echo "    API should be on port 3001 — point Vercel VITE_API_URL to this host."
