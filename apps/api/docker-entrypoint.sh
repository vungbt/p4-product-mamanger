#!/bin/sh
set -e
cd /app/apps/api
pnpm exec sequelize-cli db:migrate
if [ "$RUN_SEED" = "true" ]; then
  pnpm exec sequelize-cli db:seed:all || true
fi
exec node dist/index.js
