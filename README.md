# P4 — Product Manager (Monorepo)

> Tuần 5 · React SPA · **Monorepo** (theo pattern [smart-connection-monorepo](https://github.com/vungbt/smart-connection-monorepo)) · Admin + Storefront

Repo: https://gitlab.com/training2312930/p4-product-manager

## Cấu trúc monorepo

```
p4-product-manager/
├── apps/
│   ├── api/          ← Express (mentor maintain — đã implement)
│   └── web/          ← React Vite (học viên code ở đây)
├── libs/
│   ├── shared/       ← Types dùng chung (@p4/shared)
│   ├── ui/           ← Design system (@p4/ui) — Tailwind components
│   ├── auth/         ← AuthProvider / useAuth (@p4/auth)
│   └── api-client/   ← Axios + TanStack Query (@p4/api-client)
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── turbo.json
```

| Package | Path | Ai làm |
|---------|------|--------|
| **API** (Express) | `apps/api` | **Mentor** — đã implement sẵn |
| **Web** (React) | `apps/web` | **Học viên** — chỉ làm FE |
| **Shared types** | `libs/shared` | Dùng chung — không sửa trừ khi mentor cập nhật API |
| **UI** | `libs/ui` | Mentor maintain — import `@p4/ui` |
| **Auth** | `libs/auth` | Mentor maintain — import `@p4/auth` |
| **API client** | `libs/api-client` | Mentor maintain — import `@p4/api-client` |

**Học viên không sửa `apps/api/`.** Đọc [apps/api/README.md](./apps/api/README.md) để biết endpoints.

---

## Tổng quan nghiệp vụ

| Portal | Route | Quyền |
|--------|-------|-------|
| **Storefront** | `/shop`, `/cart` public; `/login` khi checkout | Xem SP không cần login; đặt hàng cần user |
| **Admin** | `/admin/*` | Admin: CRUD SP, dashboard, orders |

End user **không** vào admin, **không** CRUD sản phẩm (API trả 403 nếu user gọi admin endpoints).

---

## Chạy project

```bash
pnpm install
cp .env.example .env
pnpm docker:dev
pnpm --filter @p4/api db:migrate && pnpm --filter @p4/api db:seed
pnpm dev
```

- API: http://localhost:3001 (Postgres + Sequelize)
- Web: http://localhost:5173

Chi tiết: [GETTING-STARTED.md](./GETTING-STARTED.md) · Docker/deploy: [apps/api/README.md](./apps/api/README.md) · OpenAPI UI: `/api/docs`

### Docker (mentor)

```bash
pnpm docker:dev      # Postgres local (host 5432)
pnpm docker:build    # image p4-api
pnpm docker:up       # postgres + api
```

**Deploy production** — cùng VPS coupon-linkh (SSH `couponlinkh`), stack riêng `p4-prod` (Postgres host bind `127.0.0.1:5433`):

```bash
cp .env.prod.example .env.prod   # điền JWT, DB, CORS, Cloudinary…
./scripts/deploy.prod.sh         # hoặc: pnpm deploy:prod
```

Smoke: `curl https://p4-api.couponlinkh.com/health` (nginx → `:3001`)

**Soi DB prod từ máy local** (Postgres chỉ bind `127.0.0.1` trên VPS):

```bash
pnpm db:tunnel   # giữ terminal mở → IDE: 127.0.0.1:5433 + creds .env.prod
```

FE production: **Vercel** — `VITE_API_URL=https://p4-api.couponlinkh.com`

### Lint, format & commit

```bash
pnpm lint              # biome check toàn monorepo
pnpm format            # biome format + fix
```

Pre-commit (Husky): tự format/lint file staged. Commit message theo [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md).

---

## Học viên làm gì? (`apps/web`)

1. `use-auth` — login/logout gọi `/api/auth/login`, lưu token
2. `protected-route` — guard theo role
3. **Admin:** CRUD products, dashboard stats, orders list
4. **Storefront:** shop, cart, checkout → `POST /api/orders`
5. Gọi API qua `services/` — xem [API docs](./apps/api/README.md)

Types: import từ `@p4/shared` hoặc `@/types/types`

**Naming:** kebab-case cho mọi file trong `apps/web/src/`

**Structure expect:** [apps/web/README.md](./apps/web/README.md) — routing, icons, modules (pattern base-react-antd + finder-work-web)

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Monorepo | pnpm workspaces + Turborepo |
| Lint / Format | [Biome](https://biomejs.dev/) |
| Git hooks | Husky + lint-staged + commitlint |
| API | Node.js, Express, TypeScript |
| Web | React, Vite, React Router, Formik, Yup, SCSS modules |

---

## Thứ tự làm (web)

1. Types/constants + đọc API README
2. `services/api-service` + `use-auth`
3. Routes + `protected-route`
4. Admin CRUD + dashboard
5. Storefront shop + cart/checkout
6. Test role guard (user không vào admin)

---

## Quy tắc

- ❌ Sửa `apps/api/`
- ❌ AI làm hộ full solution
- ✅ Commit: `feat(web): admin product list`

---

## P6 Next.js

Tuần 7 port **apps/web** sang Next.js — vẫn dùng cùng Express API.
