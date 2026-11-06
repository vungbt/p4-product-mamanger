#!/usr/bin/env bash
set -euo pipefail

# Nginx serves /var/www/p4/current; provision deploy/nginx/p4.conf and TLS first.
SERVER="${SERVER:-couponlinkh}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/p4}"
RELEASE="$(git rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)"

# Use the same-origin /api reverse proxy so browser sessions do not require third-party cookies.
VITE_API_URL='' pnpm --filter @p4/web build
ssh "$SERVER" "mkdir -p '$REMOTE_ROOT/releases/$RELEASE'"
rsync -az apps/web/dist/ "$SERVER:$REMOTE_ROOT/releases/$RELEASE/"
ssh "$SERVER" bash -s -- "$REMOTE_ROOT" "$RELEASE" <<'REMOTE'
set -euo pipefail
root="$1"
release="$2"
test -s "$root/releases/$release/index.html"
chmod -R a+rX "$root/releases/$release"
ln -s "$root/releases/$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
echo "Published web release: $release"
REMOTE
