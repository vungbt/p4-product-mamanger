#!/bin/bash
# SSH command arguments intentionally expand locally before transmission.
# shellcheck disable=SC2029
# ===========================================
# Deploy Stay (API + Postgres + static web) to a small VPS.
#
#   ./scripts/deploy.stay.sh --setup   # first time: docker, nginx, certbot, swap, firewall, TLS
#   ./scripts/deploy.stay.sh           # API image + web
#   ./scripts/deploy.stay.sh --api     # API only
#   ./scripts/deploy.stay.sh --web     # web only
#   ./scripts/deploy.stay.sh --rollback
#
# Nothing is built on the server: the API image is built here (linux/amd64), gzipped and loaded
# over SSH; the web is a static build copied with rsync. Only stay-api:latest and :previous are kept.
# Secrets: .env.stay.prod on the server (chmod 600), see .env.stay.prod.example.
# ===========================================
set -euo pipefail

SERVER="${STAY_SERVER:-stay-prod}"
REMOTE_DIR="${STAY_REMOTE_DIR:-/root/apps/stay}"
WEB_HOST="${STAY_WEB_HOST:-stay.itclabs.site}"
API_HOST="${STAY_API_HOST:-stay-api.itclabs.site}"
CERT_EMAIL="${STAY_CERT_EMAIL:-}"

DO_SETUP=false
DO_API=true
DO_WEB=true
DO_ROLLBACK=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --server) SERVER="$2"; shift 2 ;;
    --setup) DO_SETUP=true; shift ;;
    --api) DO_WEB=false; shift ;;
    --web) DO_API=false; shift ;;
    --rollback) DO_ROLLBACK=true; shift ;;
    --help)
      sed -n 2,16p "$0"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."
remote() { ssh "$SERVER" "$@"; }
# shellcheck source=scripts/lib/deploy.sh
source scripts/lib/deploy.sh
GIT_SHA="$(git rev-parse HEAD)"
trap 'rm -f stay-api.tar.gz' EXIT

if $DO_ROLLBACK; then
  echo "==> Rolling back stay-api to :previous on $SERVER"
  run_remote_script api.sh stay-api "$REMOTE_DIR" "$GIT_SHA" rollback
  exit 0
fi

# ---------------------------------------------------------------------------
# First-time server setup
# ---------------------------------------------------------------------------
if $DO_SETUP; then
  if [[ -z "$CERT_EMAIL" ]]; then
    echo "Set STAY_CERT_EMAIL (Let's Encrypt expiry notices) for --setup."
    exit 1
  fi
  echo "==> Setting up $SERVER (docker, nginx, certbot, swap, firewall)"
  run_remote_script stay-setup.sh "$REMOTE_DIR" "$WEB_HOST" "$API_HOST" "$CERT_EMAIL"
  echo "==> Installing the HTTPS nginx config"
  sed -e "s/STAY_WEB_HOST/$WEB_HOST/g" -e "s/STAY_API_HOST/$API_HOST/g" deploy/nginx/stay.conf \
    | remote "cat > /etc/nginx/sites-available/stay.conf && nginx -t && systemctl reload nginx"
fi

remote "test -f $REMOTE_DIR/.env.stay.prod" || {
  echo "Missing $REMOTE_DIR/.env.stay.prod on $SERVER — create it from .env.stay.prod.example."
  exit 1
}

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------
if $DO_API; then
  echo "==> Building stay-api (linux/amd64)"
  docker build --build-arg GIT_SHA="$GIT_SHA" --platform linux/amd64 -f apps/stay/api/Dockerfile -t stay-api:latest .
  docker save stay-api:latest | gzip -1 > stay-api.tar.gz
  echo "    image $(du -h stay-api.tar.gz | cut -f1)"

  echo "==> Uploading to $SERVER"
  scp -q stay-api.tar.gz docker-compose.stay.yml deploy/backup/stay-db-backup.sh "$SERVER:$REMOTE_DIR/"
  rm -f stay-api.tar.gz

  run_remote_script api.sh stay-api "$REMOTE_DIR" "$GIT_SHA"
  verify_public_api stay-api "$REMOTE_DIR" "https://$API_HOST/health" "$GIT_SHA"

  echo "==> Cleaning local stay-api images"
  docker images stay-api --format '{{.Repository}}:{{.Tag}}' | grep -vx 'stay-api:latest' \
    | while read -r image; do docker rmi "$image" || true; done || true
  docker image prune -f >/dev/null
fi

# ---------------------------------------------------------------------------
# Web (static)
# ---------------------------------------------------------------------------
if $DO_WEB; then
  echo "==> Building @stay/web"
  pnpm --filter @stay/web build
  RELEASE="$GIT_SHA-$(date -u +%Y%m%d%H%M%S)"
  stamp_web_release apps/stay/web/dist/index.html "$GIT_SHA"
  remote "mkdir -p '/var/www/stay/releases/$RELEASE'"
  rsync -az --delete apps/stay/web/dist/ "$SERVER:/var/www/stay/releases/$RELEASE/"
  run_remote_script web.sh /var/www/stay "$RELEASE"
  verify_release web "https://$WEB_HOST/index.html?version=$GIT_SHA" "$GIT_SHA"
fi

echo ""
echo "==> Done"
echo "    Web: https://$WEB_HOST   API: https://$API_HOST/health"
echo "    Rollback API: ./scripts/deploy.stay.sh --rollback"
