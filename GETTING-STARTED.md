# Bắt đầu — P4 Product Manager

## 1. Clone & cài

```bash
git clone git@gitlab.com:training2312930/p4-product-manager.git
cd p4-product-manager
pnpm install
pnpm dev
```

Mở http://localhost:5173

## 2. Cấu trúc monorepo

```
p4-product-manager/
├── apps/
│   ├── api/     ← Mentor maintain (Express) — KHÔNG SỬA
│   └── web/     ← Học viên code ở đây
├── libs/
│   └── shared/  ← Types dùng chung (@p4/shared)
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

Pattern tham khảo: [smart-connection-monorepo](https://github.com/vungbt/smart-connection-monorepo) (`apps/` + `libs/`).

**Web structure:** [apps/web/README.md](./apps/web/README.md) — routing, icons, kebab-case naming.

## 3. Làm việc hàng ngày

```bash
# Chạy cả API + Web
pnpm dev

# Chỉ web (cần API đang chạy)
pnpm --filter @p4/web dev
```

Mở Cursor workspace: folder `apps/web/` hoặc root monorepo.

### Lint & commit

```bash
pnpm lint      # kiểm tra biome
pnpm format    # auto-fix format/lint
```

Mỗi commit phải theo [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) — hook Husky sẽ chặn nếu sai format.

## 4. Demo login (fake auth — scaffold)

Trước khi học viên nối API thật, dùng tài khoản fake để xem structure:

| Portal | URL | Username | Password |
|--------|-----|----------|----------|
| Storefront | `/login` | `user` | `user` |
| Admin | `/admin/login` | `admin` | `admin` |

Sau login: nav sidebar/header render từ `*.route-config.ts` (pattern mượn từ cms-do-an).

## 5. API docs

Đọc **[apps/api/README.md](./apps/api/README.md)** — endpoints, auth, body mẫu.

Tài khoản demo:

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | admin |
| user@demo.com | user123 | user |

## 6. Import types

```typescript
import type { Product, User } from '@p4/shared';
// hoặc
import type { Product } from '@/types/types';
```

## 7. Gọi API từ web

Base URL: `/api` (Vite proxy → localhost:3001)

```typescript
fetch('/api/products', {
  headers: { Authorization: `Bearer ${token}` },
});
```

## 8. Hỏi agent

`@apps/web/README.md` hoặc root README + nói rõ portal đang làm.

**Nhắc agent:** không sửa `apps/api`, chỉ gợi ý FE.
