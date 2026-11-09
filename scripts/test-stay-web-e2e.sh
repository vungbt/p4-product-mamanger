#!/usr/bin/env bash
# End-to-end tests of @stay/web against a live @stay/api with a migrated, seeded database.
# CI provides an empty Postgres (STAY_DATABASE_*). Locally, point STAY_DATABASE_* at a disposable
# database (the seed is idempotent; the tests sign in as the seeded owner) and install Chromium
# once with `pnpm --filter @stay/web exec playwright install chromium`.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
api_dir="$root/apps/stay/api"
web_dir="$root/apps/stay/web"

export NODE_ENV="${NODE_ENV:-development}"
export STAY_PORT="${STAY_PORT:-3011}"
export STAY_BETTER_AUTH_URL="${STAY_BETTER_AUTH_URL:-http://127.0.0.1:$STAY_PORT}"
export STAY_BETTER_AUTH_SECRET="${STAY_BETTER_AUTH_SECRET:-ci-only-stay-better-auth-secret-0123456789}"
export STAY_CORS_ORIGIN="${STAY_CORS_ORIGIN:-http://localhost:5174}"
export STAY_API_PROXY_TARGET="http://127.0.0.1:$STAY_PORT"

cd "$api_dir"
pnpm build
pnpm db:migrate
pnpm db:seed
# E2E-only: a manager assigned to building A (manager menu and 403 tests).
node "$web_dir/e2e/seed-manager.mjs"

node dist/index.js > "$web_dir/api.log" 2>&1 &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT

api_ready=0
for _ in $(seq 1 60); do
  if node -e "fetch('http://127.0.0.1:$STAY_PORT/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"; then
    api_ready=1
    break
  fi
  sleep 1
done
if [[ $api_ready -ne 1 ]]; then
  echo "@stay/api did not become healthy." >&2
  tail -n 80 "$web_dir/api.log"
  exit 1
fi

cd "$web_dir"
pnpm build
rm -rf test-results playwright-report

status=0
CI="${CI:-1}" pnpm exec playwright test || status=$?

# Playwright exits 0 when tests are skipped; this suite must run every test.
node -e "
const { stats } = require('./test-results/results.json');
const ran = stats.expected + stats.unexpected + stats.flaky;
if (stats.skipped > 0 || ran === 0) {
  console.error('Stay web e2e: ' + stats.skipped + ' skipped, ' + ran + ' run. Every test must run.');
  process.exit(1);
}
console.log('Stay web e2e: ' + stats.expected + ' passed, ' + stats.unexpected + ' failed, ' + stats.flaky + ' flaky.');
" || status=1

if [[ $status -ne 0 ]]; then
  echo "--- api.log"
  tail -n 80 "$web_dir/api.log"
fi
exit "$status"
