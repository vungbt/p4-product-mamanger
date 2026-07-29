# @p4/api — Express Backend (Mentor maintain)

> **Học viên không sửa folder này.** Chỉ gọi API từ `apps/web`.

Base URL (dev): `http://localhost:3001`  
Web proxy: `/api` → API (cấu hình trong `apps/web/vite.config.ts`)

---

## Auth

### POST `/api/auth/login`

```json
{ "email": "admin@demo.com", "password": "admin123" }
```

Response:

```json
{
  "token": "tok_...",
  "user": { "id": "1", "email": "admin@demo.com", "role": "admin" }
}
```

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | admin |
| user@demo.com | user123 | user |

Gửi token: `Authorization: Bearer <token>`

### GET `/api/auth/me` — auth required

### POST `/api/auth/logout` — auth required

---

## Products

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/products` | — | public |
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
  "imageUrl": "https://...",
  "stock": 10
}
```

---

## Orders

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/orders` | ✅ | admin |
| POST | `/api/orders` | ✅ | user |

Checkout body (user):

```json
{
  "items": [
    { "productId": "p1", "quantity": 2 }
  ]
}
```

→ Trừ stock, tạo order, trả về order object.

---

## Dashboard (admin)

### GET `/api/dashboard/stats`

```json
{
  "totalRevenue": 0,
  "orderCount": 0,
  "lowStockProducts": []
}
```

---

## Health

`GET /health` → `{ "status": "ok" }`

---

## Types

Xem `libs/shared/src/index.ts` — FE import `@p4/shared`.
