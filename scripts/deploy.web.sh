#!/usr/bin/env bash
# SSH command arguments intentionally expand locally before transmission.
# shellcheck disable=SC2029
set -euo pipefail

# Nginx serves /var/www/p4/current; provision deploy/nginx/p4.conf, p4-api.conf and TLS first.
SERVER="${SERVER:-couponlinkh}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/p4}"
cd "$(dirname "$0")/.."
# shellcheck source=scripts/lib/deploy.sh
source scripts/lib/deploy.sh
GIT_SHA="$(git rev-parse HEAD)"
RELEASE="$GIT_SHA-$(date -u +%Y%m%d%H%M%S)"

# Use the same-origin /api reverse proxy so browser sessions do not require third-party cookies.
VITE_API_URL='' pnpm --filter @p4/web build
stamp_web_release apps/web/dist/index.html "$GIT_SHA"
ssh "$SERVER" "mkdir -p '$REMOTE_ROOT/releases/$RELEASE'"
rsync -az apps/web/dist/ "$SERVER:$REMOTE_ROOT/releases/$RELEASE/"
run_remote_script web.sh "$REMOTE_ROOT" "$RELEASE"
verify_release web "${P4_WEB_URL:-https://p4.itclabs.site}/index.html?version=$GIT_SHA" "$GIT_SHA"
