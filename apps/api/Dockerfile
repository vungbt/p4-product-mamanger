FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY libs/shared/package.json ./libs/shared/
RUN pnpm install --filter @p4/api... --filter @p4/shared...

FROM base AS build
COPY --from=deps /app ./
COPY apps/api ./apps/api
COPY libs/shared ./libs/shared
COPY tsconfig.base.json ./
RUN pnpm --filter @p4/api build

FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/libs/shared/package.json ./libs/shared/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/.sequelizerc ./apps/api/
COPY --from=build /app/apps/api/src/sequelize ./apps/api/src/sequelize
COPY --from=build /app/apps/api/src/language ./apps/api/src/language
COPY --from=build /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
COPY --from=build /app/libs/shared ./libs/shared

RUN pnpm install --filter @p4/api... --prod --ignore-scripts \
  && chmod +x /app/apps/api/docker-entrypoint.sh \
  && apk add --no-cache wget

WORKDIR /app/apps/api
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
