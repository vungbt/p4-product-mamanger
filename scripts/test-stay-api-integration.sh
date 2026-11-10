#!/usr/bin/env bash
# Run every @stay/api test against a migrated, seeded database and a live API.
# CI provides an empty Postgres (STAY_DATABASE_*). Locally, point STAY_DATABASE_* at a disposable
# database: the seed is idempotent but the tests sign in as the seeded owner.
set -euo pipefail

cd "$(dirname "$0")/../apps/stay/api"

export NODE_ENV="${NODE_ENV:-development}"
export STAY_PORT="${STAY_PORT:-3011}"
export STAY_BETTER_AUTH_URL="${STAY_BETTER_AUTH_URL:-http://127.0.0.1:$STAY_PORT}"
export STAY_BETTER_AUTH_SECRET="${STAY_BETTER_AUTH_SECRET:-ci-only-stay-better-auth-secret-0123456789}"
export STAY_CORS_ORIGIN="${STAY_CORS_ORIGIN:-http://localhost:5174}"
export STAY_TEST_API_URL="http://127.0.0.1:$STAY_PORT"
# The suites sign in far more than the production limit of 30 per window allows.
export STAY_SIGN_IN_RATE_LIMIT="${STAY_SIGN_IN_RATE_LIMIT:-1000}"

pnpm build
pnpm db:migrate
# Twice: the seed must be idempotent.
pnpm db:seed
pnpm db:seed

node dist/index.js > api.log 2>&1 &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  node -e "fetch('http://127.0.0.1:$STAY_PORT/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))" && break
  sleep 1
done

status=0
node --test --test-concurrency=1 --test-reporter=spec tests/*.test.mjs 2>&1 | tee test-output.log || status=$?

if grep -q '# SKIP' test-output.log; then
  echo "Stay suites were skipped; the API or database is not reachable." >&2
  status=1
fi
if [[ $status -ne 0 ]]; then
  echo "--- api.log errors"
  grep -iE 'error|"status":5' api.log | tail -n 80 || true
  echo "--- api.log"; tail -n 80 api.log
fi
exit "$status"
