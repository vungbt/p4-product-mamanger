#!/bin/sh
set -e
cd /app/apps/api
./node_modules/.bin/sequelize-cli db:migrate
if [ "$RUN_SEED" = "true" ]; then
  ./node_modules/.bin/sequelize-cli db:seed:all || true
fi
if [ "$#" -gt 0 ]; then
  exec "$@"
fi
exec node dist/index.js
