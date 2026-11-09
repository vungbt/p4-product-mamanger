#!/usr/bin/env bash
# Run every API test, including the integration suites that need a live API, worker and seeded DB.
# CI provides an empty Postgres and sets SEED=1. Locally, point DATABASE_* at a disposable database.
set -euo pipefail

cd "$(dirname "$0")/../apps/api"

export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3001}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://127.0.0.1:$PORT}"
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-ci-only-better-auth-secret-0123456789abcdef}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:5173}"
export P4_TEST_API_URL="http://127.0.0.1:$PORT/api"
export P4_TEST_DATABASE=local

pnpm build
if [[ "${SEED:-0}" == "1" ]]; then
  # Seeders target the August schema; later migrations backfill seeded rows (slugs, variants,
  # Better Auth accounts…), the same order existing databases went through.
  pnpm exec sequelize-cli db:migrate --to "${SEED_SCHEMA:-20260804150000-user-profile-fields.cjs}"
  pnpm db:seed
fi
pnpm db:migrate

node dist/index.js > api.log 2>&1 &
api_pid=$!
node dist/worker.js > worker.log 2>&1 &
worker_pid=$!
trap 'kill "$api_pid" "$worker_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  node -e "fetch('http://127.0.0.1:$PORT/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))" && break
  sleep 1
done

status=0
node --test --test-concurrency=1 --test-reporter=spec tests/*.test.mjs 2>&1 | tee test-output.log || status=$?

if grep -q '# SKIP' test-output.log; then
  echo "Integration suites were skipped; the API or database is not reachable." >&2
  status=1
fi
if [[ $status -ne 0 ]]; then
  echo "--- api.log"; tail -n 80 api.log
  echo "--- worker.log"; tail -n 40 worker.log
fi
exit "$status"
