# Bắt đầu — P4 Product Manager

## 1. Clone & cài

```bash
git clone git@gitlab.com:training2312930/p4-product-manager.git
cd p4-product-manager
pnpm install
cp .env.example .env
pnpm docker:dev          # Postgres
pnpm --filter @p4/api db:migrate && pnpm --filter @p4/api db:seed
pnpm dev
```

Mở http://localhost:5173

## 2. Cấu trúc monorepo

```
p4-product-manager/
├── apps/
│   ├── api/     ← Mentor maintain (Express + Sequelize) — KHÔNG SỬA
│   └── web/     ← Học viên code ở đây
├── libs/
│   └── shared/  ← Types dùng chung (@p4/shared)
├── docker-compose.yml / docker-compose.dev.yml
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

**Web structure:** [apps/web/README.md](./apps/web/README.md)

## 3. Làm việc hàng ngày

```bash
pnpm docker:dev   # nếu Postgres chưa chạy
pnpm dev          # API + Web
# hoặc
pnpm dev:api      # :3001
pnpm dev:web      # :5173
```

### Lint & commit

```bash
pnpm lint
pnpm format
```

Commit theo [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md).

## 4. Demo login

| Portal | URL | Email (API) | Password |
|--------|-----|-------------|----------|
| Storefront | `/login` | user@demo.com | user123 |
| Admin | `/admin/login` | admin@demo.com | admin123 |

Scaffold còn fake username `user`/`admin` — học viên thay bằng API login thật.

## 5. API docs

[apps/api/README.md](./apps/api/README.md) — envelope `{ data, meta }`, paging, Docker.

## 6. Gọi API từ web

- Local: `API_BASE_URL = '/api'` (Vite proxy)
- Prod Vercel: set `VITE_API_URL=https://your-api-host` (không trailing slash)

```typescript
const res = await fetch(`${API_BASE_URL}/products?page=1&pageSize=10`);
const { data, meta } = await res.json();
```

## 7. Deploy (mentor)

| Layer | Cách |
|-------|------|
| **Postgres + API** | Docker — `pnpm docker:build` / `pnpm deploy:prod` |
| **FE** | Vercel — Root `apps/web`, Build `pnpm --filter @p4/web build`, Output `dist`, env `VITE_API_URL` |

SPA rewrite: [apps/web/vercel.json](./apps/web/vercel.json)

## 8. Hỏi agent

`@apps/web/README.md` — **không sửa `apps/api`**, chỉ gợi ý FE.
