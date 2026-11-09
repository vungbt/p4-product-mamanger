FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.9 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY libs/ability/package.json ./libs/ability/
COPY libs/server-core/package.json ./libs/server-core/
COPY libs/shared/package.json ./libs/shared/
COPY libs/processes/package.json ./libs/processes/
COPY libs/realtime/package.json ./libs/realtime/
RUN pnpm install --frozen-lockfile --filter @p4/api...

COPY tsconfig.base.json ./
COPY apps/api ./apps/api
COPY libs/ability ./libs/ability
COPY libs/server-core ./libs/server-core
COPY libs/shared ./libs/shared
COPY libs/processes ./libs/processes
COPY libs/realtime ./libs/realtime
RUN pnpm --filter @p4/api build

# Production dependencies in the workspace layout. @p4/shared ships TypeScript source,
# which Node only strips outside node_modules, so `pnpm deploy` is not an option.
FROM base AS prod-deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY libs/ability/package.json ./libs/ability/
COPY libs/server-core/package.json ./libs/server-core/
COPY libs/shared/package.json ./libs/shared/
COPY libs/processes/package.json ./libs/processes/
COPY libs/realtime/package.json ./libs/realtime/
RUN pnpm install --frozen-lockfile --filter @p4/api... --prod --ignore-scripts

# Runtime: Node only — no pnpm, corepack, store or build cache.
FROM node:22-alpine AS production
ENV NODE_ENV=production
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=prod-deps /app ./
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/openapi.yaml /app/apps/api/.sequelizerc ./apps/api/
COPY --from=build /app/apps/api/src/sequelize ./apps/api/src/sequelize
COPY --from=build /app/apps/api/src/language ./apps/api/src/language
COPY --from=build /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
COPY --from=build /app/libs/ability/dist ./libs/ability/dist
COPY --from=build /app/libs/server-core/dist ./libs/server-core/dist
COPY --from=build /app/libs/processes/dist ./libs/processes/dist
COPY --from=build /app/libs/realtime/dist ./libs/realtime/dist
COPY --from=build /app/libs/shared/src ./libs/shared/src

WORKDIR /app/apps/api
RUN chmod +x docker-entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
