#!/bin/sh
# Migrations only: the Stay seed (local owner, building A) never runs in production images.
set -e
cd /app/apps/stay/api
./node_modules/.bin/sequelize-cli db:migrate
if [ "$#" -gt 0 ]; then
  exec "$@"
fi
exec node dist/index.js
