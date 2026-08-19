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
│   ├── shared/      ← Types (@p4/shared)
│   ├── ui/          ← Design system (@p4/ui)
│   ├── auth/        ← Auth (@p4/auth)
│   └── api-client/  ← Axios + TanStack Query (@p4/api-client)
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

Login hiện gọi API thật, lưu access/refresh token và tự refresh session trước khi access token hết hạn.

## 5. API docs

- OpenAPI UI (Scalar): http://localhost:3001/api/docs · prod https://p4-api.couponlinkh.com/api/docs
- Spec: [apps/api/openapi.yaml](./apps/api/openapi.yaml)
- Chi tiết envelope/paging: [apps/api/README.md](./apps/api/README.md)

## 6. Gọi API từ web

- Local: `API_BASE_URL = '/api'` (Vite proxy)
- Prod Vercel: set `VITE_API_URL=https://p4-api.couponlinkh.com` (không trailing slash, **không** thêm `/api`)

```typescript
const res = await fetch(`${API_BASE_URL}/products?page=1&pageSize=10`);
const { data, meta } = await res.json();
```

Trong source ứng dụng, ưu tiên `@p4/api-client` thay vì gọi `fetch` trực tiếp. Tổ chức page theo feature:

```text
apps/web/src/modules/{portal}/{feature}/
├── page.tsx
├── use-feature.ts        # chỉ tạo khi feature cần
└── feature-component.tsx # component nội bộ
```

Hook chỉ dùng trong feature đặt cạnh `page.tsx`; chỉ hook dùng chung từ hai feature trở lên mới đặt trong `apps/web/src/hooks`.

## 7. Deploy (mentor)

| Layer | Cách |
|-------|------|
| **Postgres + API** | Cùng VPS coupon-linkh — `cp .env.prod.example .env.prod` rồi `./scripts/deploy.prod.sh` (SSH `couponlinkh`, API `:3001`, PG host `:5433`) |
| **FE** | Vercel — Root `apps/web`, Build `pnpm --filter @p4/web build`, Output `dist`, env `VITE_API_URL=https://p4-api.couponlinkh.com` |

SPA rewrite: [apps/web/vercel.json](./apps/web/vercel.json)

## 8. Hỏi agent

`@apps/web/README.md` — **không sửa `apps/api`**, chỉ gợi ý FE.
