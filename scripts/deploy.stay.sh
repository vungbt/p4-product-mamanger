#!/bin/bash
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
PROJECT="stay"
COMPOSE="docker compose -f docker-compose.stay.yml --env-file .env.stay.prod -p $PROJECT"

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

if $DO_ROLLBACK; then
  echo "==> Rolling back stay-api to :previous on $SERVER"
  remote bash -s <<EOF
    set -e
    cd $REMOTE_DIR
    docker image inspect stay-api:previous >/dev/null
    docker tag stay-api:previous stay-api:latest
    $COMPOSE up -d api
EOF
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
  remote bash -s <<EOF
    set -e
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl nginx certbot ufw rsync >/dev/null
    if ! command -v docker >/dev/null; then
      curl -fsSL https://get.docker.com | sh >/dev/null
    fi
    systemctl enable --now docker nginx >/dev/null

    # Docker: small logs by default, no leftover build cache.
    mkdir -p /etc/docker
    if [ ! -f /etc/docker/daemon.json ]; then
      printf '{\n  "log-driver": "json-file",\n  "log-opts": { "max-size": "10m", "max-file": "3" }\n}\n' > /etc/docker/daemon.json
      systemctl restart docker
    fi

    # 1 GB swap so a memory spike does not kill Postgres or Node.
    if ! swapon --show | grep -q /swapfile; then
      fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
      grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
      sysctl -q vm.swappiness=10 && echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
    fi

    ufw allow OpenSSH >/dev/null && ufw allow 'Nginx Full' >/dev/null && ufw --force enable >/dev/null

    mkdir -p $REMOTE_DIR /var/www/stay/acme /var/www/stay/releases
    # HTTP-only config first so certbot can answer the challenge.
    cat > /etc/nginx/sites-available/stay.conf <<'NGINX'
server {
    listen 80;
    server_name $WEB_HOST $API_HOST;
    location /.well-known/acme-challenge/ { root /var/www/stay/acme; }
    location / { return 404; }
}
NGINX
    ln -sf /etc/nginx/sites-available/stay.conf /etc/nginx/sites-enabled/stay.conf
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    for host in $WEB_HOST $API_HOST; do
      certbot certonly --webroot -w /var/www/stay/acme -d \$host \
        --non-interactive --agree-tos -m $CERT_EMAIL --keep-until-expiring
    done
    # Reload nginx after automatic renewals.
    mkdir -p /etc/letsencrypt/renewal-hooks/deploy
    printf '#!/bin/sh\nsystemctl reload nginx\n' > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
EOF
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
  docker build --platform linux/amd64 -f apps/stay/api/Dockerfile -t stay-api:latest .
  docker save stay-api:latest | gzip -1 > stay-api.tar.gz
  echo "    image $(du -h stay-api.tar.gz | cut -f1)"

  echo "==> Uploading to $SERVER"
  scp -q stay-api.tar.gz docker-compose.stay.yml deploy/backup/stay-db-backup.sh "$SERVER:$REMOTE_DIR/"
  rm -f stay-api.tar.gz

  remote bash -s <<EOF
    set -e
    cd $REMOTE_DIR
    chmod 600 .env.stay.prod
    if docker image inspect stay-api:latest >/dev/null 2>&1; then
      docker tag stay-api:latest stay-api:previous
    fi
    gunzip -c stay-api.tar.gz | docker load -q
    rm -f stay-api.tar.gz
    $COMPOSE up -d postgres api

    echo "  Waiting for the API..."
    for i in \$(seq 1 30); do
      if curl -fsS http://127.0.0.1:3011/health >/dev/null 2>&1; then echo "  API healthy"; break; fi
      if [ "\$i" = 30 ]; then echo "  API did not become healthy:"; $COMPOSE logs --tail 60 api; exit 1; fi
      sleep 2
    done

    # Keep only :latest and :previous; drop dangling layers and build cache.
    docker images stay-api --format '{{.Repository}}:{{.Tag}}' \
      | grep -vxE 'stay-api:(latest|previous)' | xargs -r docker rmi >/dev/null 2>&1 || true
    docker image prune -f >/dev/null
    docker builder prune -f >/dev/null 2>&1 || true

    chmod 700 stay-db-backup.sh
    echo "15 3 * * * root $REMOTE_DIR/stay-db-backup.sh >> /var/log/stay-db-backup.log 2>&1" > /etc/cron.d/stay-db-backup
    $COMPOSE ps
    echo "  Memory:"; docker stats --no-stream --format '  {{.Name}} {{.MemUsage}}' | grep stay- || true
EOF

  echo "==> Cleaning local stay-api images"
  docker images stay-api --format '{{.Repository}}:{{.Tag}}' | grep -vx 'stay-api:latest' \
    | xargs -r docker rmi >/dev/null 2>&1 || true
  docker image prune -f >/dev/null
fi

# ---------------------------------------------------------------------------
# Web (static)
# ---------------------------------------------------------------------------
if $DO_WEB; then
  echo "==> Building @stay/web"
  pnpm --filter @stay/web build
  RELEASE="$(date -u +%Y%m%d%H%M%S)"
  rsync -az --delete apps/stay/web/dist/ "$SERVER:/var/www/stay/releases/$RELEASE/"
  remote bash -s <<EOF
    set -e
    ln -sfn /var/www/stay/releases/$RELEASE /var/www/stay/current
    # Keep the three newest releases.
    ls -1dt /var/www/stay/releases/* | tail -n +4 | xargs -r rm -rf
    nginx -t >/dev/null 2>&1 && systemctl reload nginx
EOF
fi

echo ""
echo "==> Done"
echo "    Web: https://$WEB_HOST   API: https://$API_HOST/health"
echo "    Rollback API: ./scripts/deploy.stay.sh --rollback"
