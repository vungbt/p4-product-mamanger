FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.9 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/stay/api/package.json ./apps/stay/api/
COPY libs/ability/package.json ./libs/ability/
COPY libs/server-core/package.json ./libs/server-core/
COPY libs/shared/package.json ./libs/shared/
COPY libs/stay/shared/package.json ./libs/stay/shared/
COPY libs/stay/billing/package.json ./libs/stay/billing/
RUN pnpm install --frozen-lockfile --filter @stay/api...

COPY tsconfig.base.json ./
COPY apps/stay/api ./apps/stay/api
COPY libs/ability ./libs/ability
COPY libs/server-core ./libs/server-core
COPY libs/shared ./libs/shared
COPY libs/stay/shared ./libs/stay/shared
COPY libs/stay/billing ./libs/stay/billing
RUN pnpm --filter @stay/api build

# Production dependencies in the workspace layout (workspace libs resolve through symlinks).
FROM base AS prod-deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/stay/api/package.json ./apps/stay/api/
COPY libs/ability/package.json ./libs/ability/
COPY libs/server-core/package.json ./libs/server-core/
COPY libs/shared/package.json ./libs/shared/
COPY libs/stay/shared/package.json ./libs/stay/shared/
COPY libs/stay/billing/package.json ./libs/stay/billing/
RUN pnpm install --frozen-lockfile --filter @stay/api... --prod --ignore-scripts

# Runtime: Node only — no pnpm, corepack, store or build cache.
FROM node:22-alpine AS production
ENV NODE_ENV=production
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=prod-deps /app ./
COPY --from=build /app/apps/stay/api/dist ./apps/stay/api/dist
COPY --from=build /app/apps/stay/api/openapi.yaml /app/apps/stay/api/.sequelizerc ./apps/stay/api/
COPY --from=build /app/apps/stay/api/src/sequelize/config ./apps/stay/api/src/sequelize/config
COPY --from=build /app/apps/stay/api/src/sequelize/migrations ./apps/stay/api/src/sequelize/migrations
COPY --from=build /app/apps/stay/api/docker-entrypoint.sh ./apps/stay/api/docker-entrypoint.sh
COPY --from=build /app/apps/stay/api/scripts/create-owner.cjs ./apps/stay/api/scripts/create-owner.cjs
COPY --from=build /app/libs/ability/dist ./libs/ability/dist
COPY --from=build /app/libs/server-core/dist ./libs/server-core/dist
COPY --from=build /app/libs/stay/shared/dist ./libs/stay/shared/dist
COPY --from=build /app/libs/stay/billing/dist ./libs/stay/billing/dist
COPY --from=build /app/libs/shared/src ./libs/shared/src

WORKDIR /app/apps/stay/api
RUN chmod +x docker-entrypoint.sh
EXPOSE 3011
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:${STAY_PORT:-3011}/health/live || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
