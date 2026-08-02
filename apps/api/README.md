# @p4/api — Express Backend (Mentor maintain)

> **Học viên không sửa folder này.** Chỉ gọi API từ `apps/web`.

Base URL (dev): `http://localhost:3001`  
Web proxy: `/api` → API (cấu hình trong `apps/web/vite.config.ts`)

---

## Structure

```
src/
├── index.ts
├── configs/          # env (DATABASE_*, CORS, PORT)
├── constants/
├── routers/
├── controllers/
├── services/
├── middlewares/      # base (jsonApi), auth, pagination, error
├── validation/
├── sequelize/        # models, migrations, seeders
├── utils/            # errors, pagination
└── types/
```

Flow: `Router → baseMiddleware (res.jsonApi) → Middleware → Validation → Controller → Service → Sequelize/Postgres`

Import alias: `@/*` → `src/*`.

Controller gọi:

```ts
res.jsonApi(200, { data: product });
res.jsonApi(200, { data: items, meta });
res.jsonApi(201, { data: product, message: 'Product created' });
```

---

## Database (Sequelize + Postgres)

```bash
# Terminal 1 — Postgres
pnpm docker:dev

# Copy env
cp .env.example .env

# Migrate + seed
pnpm --filter @p4/api db:migrate
pnpm --filter @p4/api db:seed

# API
pnpm dev:api
```

Scripts: `db:migrate` · `db:seed` · `db:reset`

---

## i18n & validation

- Header `Accept-Language: vi|en` (hoặc `?lang=vi`)
- Body validate bằng **validatorjs** (`validation/*.ts`)
- Error validation:

```json
{
  "message": "Dữ liệu không hợp lệ",
  "code": "input_valid_error",
  "extensions": { "email": ["..."] }
}
```

Success message key: `message:product_created` → dịch theo locale.

Mọi endpoint dưới `/api/*` trả về envelope chuẩn (types trong `@p4/shared`).

**Success (item / object):**

```json
{
  "data": { },
  "message": "optional"
}
```

**Success (list có paging):**

```json
{
  "data": [ ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 12,
    "totalPages": 2
  }
}
```

**Error:**

```json
{ "message": "...", "code": "unauthorized" }
```

Codes thường gặp: `bad_request`, `unauthorized`, `forbidden`, `not_found`, `server_error`.

### Query list (products, orders)

| Param | Default | Mô tả |
|-------|---------|--------|
| `page` | `1` | Trang (≥ 1) |
| `pageSize` | `10` | Số item / trang (max 100) |
| `q` | `""` | Search (name/description products; email/id/productName orders) |

Ví dụ: `GET /api/products?page=1&pageSize=5&q=ao`

---

## Auth

### POST `/api/auth/login`

```json
{ "email": "admin@demo.com", "password": "admin123" }
```

Response:

```json
{
  "data": {
    "token": "<access JWT>",
    "refreshToken": "<opaque refresh>",
    "user": { "id": "1", "email": "admin@demo.com", "role": "admin" }
  }
}
```

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | admin |
| user@demo.com | user123 | user |

Gửi access: `Authorization: Bearer <token>`

- Access JWT: `JWT_SECRET` / `JWT_EXPIRES_IN` (mặc định `15m`)
- Refresh: opaque, hash lưu DB, TTL `REFRESH_TOKEN_EXPIRES_IN` (mặc định `7d`), **rotation** mỗi lần refresh

### POST `/api/auth/refresh`

```json
{ "refreshToken": "<refresh>" }
```

→ `{ data: { token, refreshToken, user } }` (cặp mới; token cũ bị revoke)

### GET `/api/auth/me` — auth required → `{ data: { user } }`

### POST `/api/auth/logout`

Body (khuyến nghị): `{ "refreshToken": "<refresh>" }` — revoke token đó.

Nếu kèm `Authorization: Bearer <access>` → revoke **toàn bộ** refresh của user.

FE: lưu `token` + `refreshToken`; khi 401 gọi refresh một lần rồi retry; fail → login lại.

---

## Products

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/products` | — | public (paginated) |
| GET | `/api/products/:id` | — | public |
| POST | `/api/products` | ✅ | admin |
| PUT | `/api/products/:id` | ✅ | admin |
| DELETE | `/api/products/:id` | ✅ | admin |

Body create/update:

```json
{
  "name": "string",
  "price": 100000,
  "description": "string",
  "imageStorageId": "p4-product-manager/temp/20260802-ao-thun",
  "stock": 10
}
```

`imageStorageId` = Cloudinary `public_id` sau khi FE upload qua signed URL (optional). Response Product có `imageUrl` + `imageId` (join bảng `files`).

Create/update/delete trả `{ data: Product, message }`.

---

## Orders

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/orders` | ✅ | admin (paginated) |
| POST | `/api/orders` | ✅ | user |

Checkout body (user):

```json
{
  "items": [
    { "productId": "p1", "quantity": 2 }
  ]
}
```

→ Trừ stock, tạo order, trả `{ data: Order, message }`.

---

## Files (admin — Cloudinary signed upload)

Flow giống next-chapter:

1. `GET /api/files/sign-upload-url?name=ao-thun` → `{ data: { uploadUrl, publicId } }`
2. FE `POST` file lên `uploadUrl` (thẳng Cloudinary, không qua API)
3. Tạo/sửa product với `imageStorageId: publicId` → API rename `temp` → `assets`, lưu bảng `files`, gán `products.image_id`

Batch: `GET /api/files/sign-upload-urls?names=a,b` → `{ data: [{ uploadUrl, publicId }, ...] }`

Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (root; dùng `{folder}/temp` và `{folder}/assets`), optional `CLOUDINARY_DOMAIN`.

---

## Dashboard (admin)

### GET `/api/dashboard/stats`

```json
{
  "data": {
    "totalRevenue": 0,
    "orderCount": 0,
    "lowStockProducts": []
  }
}
```

---

## Health

`GET /health` → `{ "status": "ok" }` (không dùng envelope — probe)

---

## Types

Xem `libs/shared/src/index.ts` — FE import `@p4/shared` (`ApiSuccess`, `ApiPaginatedSuccess`, `PaginationMeta`, …).

---

## Docker & deploy (mentor)

Pattern giống coupon-linkh — **chỉ postgres + api** (FE trên Vercel).

```bash
pnpm docker:dev          # Postgres local
pnpm docker:build        # Build image p4-api:latest
pnpm docker:up           # Prod-like compose (cần .env / image)
pnpm deploy:prod         # Build + scp + remote up (cần .env.prod + SSH)
```

Env: [.env.example](../../.env.example). Production: `.env.prod` (không commit).

Entrypoint container: migrate → (optional `RUN_SEED=true`) → `node dist/index.js`.
