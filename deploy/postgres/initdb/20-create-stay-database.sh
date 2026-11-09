#!/bin/sh
# Creates the Stay database next to P4's in the same Postgres server when it is missing.
# Runs on first init (docker-entrypoint-initdb.d) and from the dev healthcheck, so existing
# volumes get it too. Idempotent; tolerates a concurrent run.
set -eu

db="${STAY_DATABASE_NAME:-p4_stay}"
user="${POSTGRES_USER:-postgres}"

exists() {
  psql -U "$user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1
}

exists || createdb -U "$user" "$db" 2>/dev/null || exists
