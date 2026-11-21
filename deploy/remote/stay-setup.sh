#!/usr/bin/env bash
set -euo pipefail
REMOTE_DIR="$1"
WEB_HOST="$2"
API_HOST="$3"
CERT_EMAIL="$4"
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

mkdir -p "$REMOTE_DIR" /var/www/stay/acme /var/www/stay/releases
# HTTP-only config first so certbot can answer the challenge.
cat > /etc/nginx/sites-available/stay.conf <<NGINX
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
for host in "$WEB_HOST" "$API_HOST"; do
  certbot certonly --webroot -w /var/www/stay/acme -d "$host" \
    --non-interactive --agree-tos -m "$CERT_EMAIL" --keep-until-expiring
done
# Reload nginx after automatic renewals.
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
printf '#!/bin/sh\nsystemctl reload nginx\n' > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
