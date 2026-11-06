# @p4/api — Express Backend (Mentor maintain)

> **Học viên không sửa folder này.** Chỉ gọi API từ `apps/web`.

Base URL (dev): `http://localhost:3001`  
Web proxy: `/api` → API (cấu hình trong `apps/web/vite.config.ts`)

### OpenAPI / docs

- Spec: [`openapi.yaml`](./openapi.yaml) · raw: `GET /api/openapi.yaml`
- UI (Scalar): [http://localhost:3001/api/docs](http://localhost:3001/api/docs) · prod: https://p4-api.couponlinkh.com/api/docs
- Server trong docs theo origin đang chạy, hoặc `PUBLIC_API_URL` nếu có cấu hình. Code sample mặc định là Node.js Axios.
- `openapi.yaml` được **sinh tự động, không sửa tay**. Sau khi thêm hoặc đổi API, chạy:

  ```bash
  pnpm --filter @p4/api openapi:generate
  ```

  Route, quyền và query đọc từ router đã build; schema request/response suy từ TypeScript và validator. Summary và phần không suy ra được (mảng lồng parse thủ công, handler dùng chung nhiều route) khai báo trong [`scripts/openapi/metadata.mjs`](./scripts/openapi/metadata.mjs).
- `pnpm --filter @p4/api openapi:check` fail nếu spec lệch source hoặc endpoint mới thiếu summary; `tests/openapi.test.mjs` cũng chạy kiểm tra này.

---

## Structure

```
src/
├── index.ts          # DB connection, HTTP server, graceful shutdown
├── app.ts            # Express app, global middleware, health/docs/webhook
├── modules/
│   ├── index.ts      # Mount toàn bộ feature router
│   ├── addresses/
│   ├── auth/
│   ├── categories/
│   ├── coupons/
│   ├── dashboard/
│   ├── files/
│   ├── orders/
│   ├── payments/
│   ├── products/
│   ├── refunds/
│   └── reviews/
│
│   # Mỗi feature chứa các file cần thiết:
│   # <feature>.router.ts
│   # <feature>.controller.ts
│   # <feature>.service.ts
│   # <feature>.validation.ts (nếu có request body cần validate)
│
├── shared/
│   └── validation.ts # Validator middleware dùng chung
├── configs/          # env (DATABASE_*, CORS, PORT)
├── constants/
├── middlewares/      # base (jsonApi), auth, pagination, error
├── sequelize/        # models, migrations, seeders
├── utils/            # errors, pagination
└── types/
```

Flow: `app.ts → modules/index.ts → Feature router → Middleware → Feature validation → Feature controller → Feature service → Sequelize/Postgres`

Code được tổ chức theo **feature module**, không chia ngang thành các thư mục controller/service/router dùng chung. Một thay đổi nghiệp vụ nên nằm trong module sở hữu domain đó. Chỉ hạ tầng dùng chung mới đặt ngoài `modules/`.

Import alias: `@/*` → `src/*`.

Controller gọi:

```ts
res.jsonApi(200, { data: product });
res.jsonApi(200, { data: items, meta });
res.jsonApi(201, { data: product, message: 'Product created' });
```

---

## TypeScript và kiểm tra query

API dùng `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`, `noImplicitReturns`, `noImplicitOverride` và
`noFallthroughCasesInSwitch`. Biome báo lỗi với explicit `any`, import/biến thừa
trong source API và các type test.

Type database dùng chung tại `src/types/database.ts`:

- `SortDirection`: chỉ `ASC` hoặc `DESC`, dành cho SQL. HTTP vẫn dùng `asc|desc`.
- `ModelOrder<Attributes>`: cột sort phải là key thật của model.
- `StringField<Attributes>`: chỉ thuộc tính text được dùng trong danh sách search.
- Mỗi điều kiện `WhereOptions` truyền generic attributes của model; không dùng
  `WhereOptions` trần vì Sequelize mặc định về `any`.

```ts
const order: ModelOrder<CategoryAttributes> = [['name', 'ASC'], ['id', 'ASC']];
const searchFields: StringField<CategoryAttributes>[] = ['name', 'slug', 'description'];
const conditions: WhereOptions<CategoryAttributes>[] = [];
```

Không dùng trực tiếp type `Order` của Sequelize cho simple sort: thư viện cho
phép chuỗi tuỳ ý, nên sai tên cột/direction vẫn có thể qua compile. Raw SQL,
`col()` và các biểu thức phức tạp vẫn cần review/runtime test; TypeScript không
xác minh SQL hoặc dữ liệu HTTP. Không dùng ép kiểu để né lỗi compiler.

```bash
pnpm --filter @p4/api typecheck
# Chạy song song với dev server để thấy lỗi type ngay khi sửa:
pnpm --filter @p4/api dev:typecheck
```

`tsx watch` chỉ transpile và chạy server, không typecheck. Pre-commit và CI có
bước typecheck riêng. `tests/types/database.test.ts` kiểm tra các case tên cột,
direction không hợp lệ; nếu type bị nới lỏng khiến các giá trị sai được chấp nhận,
`@ts-expect-error` sẽ trở thành lỗi và chặn typecheck. `test:lists` chạy typecheck
trước build và runtime tests.

---

## Chọn field trả về DTO

Dùng `selectFields` từ `src/utils/select-fields.ts` để chọn thuộc tính trực tiếp
thay vì lặp lại `id: row.id`, `name: row.name` ở các mapper. Helper trả object
thuần, đọc được getter của Sequelize; không gọi `toJSON()` và không lấy toàn bộ
thuộc tính. Đây là chọn field của response, không phải SQL projection.

```ts
export async function getCategoryById(id: string): Promise<Category> {
  const row = await CategoryModel.findByPk(id);
  if (!row) throw new NotFound(errorKeys.categoryNotFound);
  return selectFields(row, categoryFields);
}
```

Gọi helper trực tiếp; không tạo mapper chỉ để bọc `selectFields`. Danh sách field
đặt ngay trong service sở hữu; chỗ chỉ dùng một lần có thể truyền inline. Giữ return type DTO trên
service hoặc mapper có biến đổi dữ liệu thực sự. Tên field sai hoặc thiếu field bắt buộc của DTO
sẽ bị typecheck chặn; literal field list inline được suy luận chính xác, không
cần `as const` hoặc ép kiểu ở nơi gọi. Không truyền danh sách field lấy trực tiếp
từ HTTP vào helper. `Object.fromEntries` cần một type assertion nội bộ để giữ
quan hệ key/value; không dùng assertion tại mapper để né kiểm tra DTO.

Với ngày tháng, giá trị tính toán và quan hệ, spread các field trực tiếp rồi xử
lý các field biến đổi như trước. Không chọn `passwordHash`, token hoặc các field
nội bộ của User vào response. Helper chỉ chọn nông; quan hệ vẫn có mapper riêng.
`tests/types/select-fields.test.ts` kiểm tra tên field, kiểu giá trị và DTO thiếu
field; runtime tests kiểm tra getter, giá trị rỗng và việc không serialize field khác.

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
- Body validate bằng **validatorjs** (`modules/<feature>/<feature>.validation.ts`)
- Router chỉ gắn validation middleware; rule không viết trực tiếp trong router/controller
- Validation middleware dùng chung: `shared/validation.ts`. Mặc định validate body;
  dùng `source: 'query'` cho các query dạng scalar. Query được trim và validate
  mà không ghi đè `req.query` hoặc `req.body`. Module chuẩn hoá kết quả sang type
  nghiệp vụ và truyền cho controller qua `res.locals`.
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

Vi phạm unique constraint trả HTTP 400 với `code: 'input_valid_error'` và lỗi theo
field trong `extensions`. Ví dụ trùng slug: `{ slug: ['Slug đã được sử dụng. Vui lòng chọn giá trị khác.'] }`.
Message theo locale; response không chứa giá trị xung đột hay SQL từ database.

### Query danh sách — search, filter, sort, pagination

Dùng `page` (mặc định 1), `pageSize` (mặc định 10, 1–100), `q` (tối đa 255 ký tự),
`sortBy` và `sortOrder=asc|desc`. Query phải là scalar; array/object, số sai định
dạng, enum lạ và range đảo ngược trả HTTP 400 `input_valid_error` + field errors
vi/en. Không tự sửa `page=2abc` thành 2 hay clamp pageSize sai về 100.

| Resource | Filter riêng | Cột sort | Mặc định |
| --- | --- | --- | --- |
| Products | `categoryId` (UUID), `minPrice`, `maxPrice`, `minStock`, `maxStock` | `name`, `price`, `stock`, `createdAt` | `createdAt asc` |
| Categories | `description=all|has|none` | `name`, `slug`, `description` | `name asc` |
| Orders và `/orders/mine` | `status`, `paymentStatus`, `shipmentStatus`, `minTotal`, `maxTotal`, `createdFrom`, `createdTo` | `id`, `userEmail`, `status`, `total`, `createdAt` | `createdAt desc` |
| Coupons | `type=percent|fixed`, `isActive=true|false` | `code`, `type`, `value`, `usedCount`, `startsAt`, `endsAt`, `createdAt` | `createdAt desc` |
| Refunds | `orderId` (UUID), `status=pending|completed|failed`, `minAmount`, `maxAmount`, `createdFrom`, `createdTo` | `amount`, `status`, `createdAt` | `createdAt desc` |
| Product reviews | `rating=1..5` | `rating`, `createdAt` | `createdAt desc` |
| Addresses | `city` (substring), `isDefault=true|false` | `fullName`, `city`, `isDefault`, `createdAt` | `createdAt desc` trong list mode; legacy ưu tiên địa chỉ mặc định |

- `q` tìm literal substring, không phân biệt hoa thường; `%`, `_` và backslash
  được escape. Products tìm tên/mô tả; orders tìm email, ID, status, tên item;
  coupons tìm code; refunds tìm reason/order ID; reviews tìm comment; addresses
  tìm tên, điện thoại, địa chỉ và thành phố. Category tìm tên/slug/mô tả.
- Các filter số đều inclusive, không âm; stock là số nguyên. Min không được lớn
  hơn max. Ngày nhận `YYYY-MM-DD` hoặc UTC timestamp (đuôi `Z`); ngày kết thúc
  dạng date bao gồm hết ngày UTC. Các enum status theo shared types/OpenAPI.
- Filter/search/sort/count/limit/offset chạy trong DB. ID tăng dần là khóa sort
  phụ để các dòng cùng giá trị không đổi vị trí giữa các trang trên dữ liệu ổn định.
  Gallery sản phẩm và items đơn hàng tải riêng, không làm nhân count hoặc cắt mất
  dữ liệu quan hệ khi phân trang.
- Products và orders luôn trả `{ data, meta }`, kể cả khi không truyền query.
  Categories/coupons/refunds/reviews/addresses giữ `{ data }` khi không có list
  query; truyền ít nhất một tham số list/filter mới sẽ có `{ data, meta }`.
  Riêng `refunds?orderId=...` vẫn giữ danh sách không phân trang để tương thích.
- `/orders/mine` và addresses luôn giới hạn theo user đăng nhập, kể cả khi có
  search/filter; không nhận `userId` để mở rộng phạm vi. Chỉ admin gọi `/orders`.
- Page ngoài phạm vi trả `data: []`, giữ `total` thật. Dataset rỗng có `totalPages: 0`.

Ví dụ:

```text
/api/products?page=1&pageSize=10&q=shirt&categoryId=<uuid>&sortBy=price&sortOrder=desc
/api/orders?status=shipping&paymentStatus=paid&createdFrom=2026-01-01&createdTo=2026-12-31
/api/coupons?isActive=false&sortBy=code&sortOrder=asc
/api/refunds?page=1&status=completed&minAmount=10000
/api/products/<id>/reviews?rating=5&sortBy=createdAt&sortOrder=desc
/api/addresses?city=HCM&isDefault=false&pageSize=10
```

`DescriptionFilter` và `DESCRIPTION_FILTER_VALUES` nằm trong `@p4/shared`, dùng
chung cho API validation và options trên web; không khai báo lại union ở frontend.

Rule/allowlist thuộc từng module trong `<feature>.validation.ts`; middleware
`shared/list-query.ts` dùng chung pagination và validation, normalize ra query
có type cho controller qua `res.locals.listQuery`. Không sửa `req.query`/`req.body`.

Kiểm tra:

```bash
pnpm --filter @p4/api test:lists
# API và DB local đang chạy, có dữ liệu/tài khoản seed password123:
P4_TEST_API_URL=http://127.0.0.1:3001/api pnpm --filter @p4/api test:lists:local
```

`test:lists` không cần DB. Bộ integration local đối chiếu response HTTP với dữ
liệu PostgreSQL thật, chỉ đọc resource (login tạo phiên auth); không tạo/sửa/xoá
sản phẩm, đơn hàng hoặc dữ liệu nghiệp vụ. Chỉ nhận API target localhost và dùng
DB development theo cấu hình hiện tại. Không đặt env thì integration suite được skip.
Các thay đổi này hiện chạy trên API local; deploy riêng trước khi dùng ở remote.

---

## Auth

Auth engine là **Better Auth** với PostgreSQL, bcrypt và bearer plugin. Migration
`20261106000100-better-auth.cjs` giữ user ID/password hash, bổ sung account/session/
verification tables và thu hồi phiên cũ; người dùng cần đăng nhập lại.

- Native endpoints: `/api/auth/sign-in/email`, `/api/auth/sign-out`,
  `/api/auth/get-session`, reset/verify/change password; xem Scalar `/api/docs`.
- FE dùng `createP4AuthClient` từ `@p4/api-sdk/auth`; restore qua cookie HttpOnly.
  Không lưu token/refresh token vào localStorage. Middleware nghiệp vụ nhận cookie
  hoặc `Authorization: Bearer <opaque Better Auth session token>`.
- `BETTER_AUTH_SECRET`: secret đủ ngẫu nhiên, tối thiểu 32 ký tự; production bắt buộc.
  `BETTER_AUTH_URL` là public API origin, phải khớp deployment; `CORS_ORIGIN` chứa
  đúng origin FE. Đặt web/API cùng site hoặc dùng reverse proxy để browser không
  chặn third-party cookie; cross-site cần HTTPS, SameSite=None và credentials.
- Cookie-auth mutation phải có Origin hợp lệ (hoặc request same-origin).
  Bearer clients không chịu kiểm tra CSRF cookie. Native auth tự kiểm tra bằng lib.
- Đăng nhập Google dùng cấu hình `GOOGLE_CLIENT_ID`; bổ sung
  `GOOGLE_CLIENT_SECRET` khi dùng OAuth redirect. Provider thật cần smoke riêng.
- Email xác minh/reset được mã hóa trong outbox; chạy worker để gửi email.

Các endpoint cũ giữ tương thích: `POST /api/auth/login`, `/google`, `/refresh`,
`/logout`, `GET/PATCH /api/auth/me`, `PATCH /api/auth/password`.
Login/refresh trả `{ data: { token, refreshToken, user } }`, hai trường token là
cùng session opaque; không còn JWT hoặc refresh rotation engine riêng.
Đổi mật khẩu qua endpoint cũ trả `{ data: { changed: true } }` và revoke các phiên,
FE quay lại đăng nhập. Endpoint account/invitation nghiệp vụ vẫn được giữ.
Các trigger đồng bộ credential/verification hỗ trợ service account cũ; đây không
phải trigger audit.

## Audit nghiệp vụ

Mỗi router khai báo policy cùng feature (`*.audit.ts`) với action rõ nghĩa:
`read`, `create`, `update`, `delete`, `approve`, `cancel`, `refund`…
Khi đăng ký router, thiếu/thừa policy hoặc mutation thiếu audited handler sẽ fail.
Read chỉ ghi access log; không tạo một bản ghi audit DB cho từng lần đọc.

`apiHandler` và `auditedCommand` chạy mutation cùng audit trong một PostgreSQL
transaction. `auditedTransaction` truyền transaction qua CLS cho ORM; service gọi
trực tiếp cũng dùng command chung. Audit thất bại thì business write rollback.
Service có thể cung cấp snapshot/facts đã redact bằng `setAuditChanges`; category
là ví dụ. Domain events audit hiện có được giữ và tránh ghi fallback trùng resource.

Access log có request ID, actor, route template, action, status và duration, không
log body/token. Worker kế thừa actor/correlation từ outbox do server ghi. Khi thêm
worker handler mới vẫn phải dùng command/service đã audit cho business writes.
Native Better Auth có transaction riêng: hook ghi security observation sau thao tác,
best-effort; không cam kết atomic cùng transaction nội bộ của thư viện.

Xóa file enqueue `file.delete_requested` cùng transaction DB. Worker xóa asset
Cloudinary sau commit và retry khi provider lỗi; không xóa vật lý trước commit.
Cần worker đang chạy để hoàn tất cleanup.

## SDK TypeScript

Xem [@p4/api-sdk](../../libs/api-sdk/README.md). Khi đổi API, chạy
`pnpm --filter @p4/api openapi:generate` rồi `pnpm --filter @p4/api-sdk generate`.
Build SDK kiểm tra contract không bị cũ; Scalar giữ server đúng public URL và
client mặc định Node.js Axios.

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

## Orders & checkout

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/orders` | ✅ | admin |
| GET | `/api/orders/mine` | ✅ | user/admin |
| GET | `/api/orders/:id` | ✅ | owner/admin |
| POST | `/api/orders` | ✅ | user |
| PATCH | `/api/orders/:id/shipment` | ✅ | admin |

Checkout tạo đơn **`pending`** + `payment` theo `PAYMENT_PROVIDER` (`mock` | `stripe`). Stock được **reserve** ngay. Response có `payment.checkoutUrl` để FE redirect.

```json
{
  "items": [{ "productId": "p1", "quantity": 2 }],
  "addressId": "<uuid>",
  "shippingAddress": {
    "fullName": "Nguyen Van A",
    "phone": "0901234567",
    "line1": "123 Nguyen Hue",
    "city": "HCM"
  },
  "shippingFee": 30000,
  "couponCode": "SALE10"
}
```

Cần `addressId` **hoặc** `shippingAddress`. Optional: `couponCode`, `shippingFee`.

- Hủy: `POST /api/orders/:id/cancel` → release stock  
- **Mock** (`PAYMENT_PROVIDER=mock`): mở `payment.checkoutUrl` hoặc `POST /api/payments/webhook/mock` → commit reservation + shipment  
- **Stripe** (`PAYMENT_PROVIDER=stripe`): redirect `payment.checkoutUrl` (Checkout Session); Stripe gọi `POST /api/payments/webhook/stripe` → cùng logic commit  
- Refund admin: `POST /api/orders/:id/refunds` → restock + cancel order (chưa gọi Stripe Refund API)

Admin shipment: `PATCH /api/orders/:id/shipment` `{ "status": "shipped", "trackingCode": "..." }`.

### Stripe (mentor)

Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY` (mặc định `vnd`), `CHECKOUT_SUCCESS_URL` / `CHECKOUT_CANCEL_URL` (placeholder `{ORDER_ID}`).

Local webhook:

```bash
stripe listen --forward-to localhost:3001/api/payments/webhook/stripe
# copy whsec_... → STRIPE_WEBHOOK_SECRET
```

FE: sau `POST /api/orders` → `window.location = data.payment.checkoutUrl`.

### Extensions

| Resource | Endpoints chính |
|----------|-----------------|
| Categories | `GET/POST /api/categories`, admin CUD |
| Product images | `POST/DELETE /api/products/:id/images` |
| Coupons | admin CRUD + `POST /api/coupons/preview` |
| Reviews | `GET/POST /api/products/:id/reviews` |
| Refunds | `POST /api/orders/:id/refunds`, `GET /api/refunds` |

---

## Files (admin — Cloudinary signed upload)

Flow giống next-chapter:

1. `GET /api/files/sign-upload-url?name=ao-thun` → `{ data: { uploadUrl, publicId } }`
2. FE `POST` file lên `uploadUrl` (thẳng Cloudinary, không qua API)
3. Tạo/sửa product với `imageStorageId: publicId` → API rename `temp` → `assets`, lưu bảng `files`, gán `products.image_id`

Batch: `GET /api/files/sign-upload-urls?names=a,b` → `{ data: [{ uploadUrl, publicId }, ...] }`

Xóa file **không** expose API — service `deleteFile` / `deleteFileIfUnreferenced` được gọi nội bộ khi xóa gallery, xóa product, đổi avatar/cover (Cloudinary + DB).

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

Pattern giống coupon-linkh — **chỉ postgres + api** (FE trên Vercel). Cùng VPS (`SSH couponlinkh`), compose project `p4-prod`, Postgres host `127.0.0.1:5433` (tránh đụng coupon `:5432`), API `:3001`.

```bash
cp .env.prod.example .env.prod   # điền secret
pnpm docker:dev                  # Postgres local (dev)
pnpm docker:build                # Build image p4-api:latest
pnpm docker:up                   # Prod-like compose local
pnpm deploy:prod                 # Build + scp + remote up (SSH couponlinkh)
# hoặc: ./scripts/deploy.prod.sh
```

Smoke: `curl https://p4-api.couponlinkh.com/health` (nginx TLS → `127.0.0.1:3001`)

Env: [.env.example](../../.env.example) · production template: [.env.prod.example](../../.env.prod.example). File `.env.prod` không commit.

Entrypoint container: migrate → (optional `RUN_SEED=true`) → `node dist/index.js`.

FE Vercel: `VITE_API_URL=https://p4-api.couponlinkh.com`


### Categories: server list parameters

`GET /api/categories` giữ response `{ data: Category[] }` cho consumer cũ khi không
truyền tham số list. Truyền ít nhất một tham số dưới đây để bật chế độ phân trang:

| Query | Giá trị |
| --- | --- |
| `page` | Số nguyên >= 1, mặc định 1 |
| `pageSize` | 1–100, mặc định 10 |
| `q` | Tối đa 255 ký tự; tìm substring không phân biệt hoa thường trong tên/slug/mô tả |
| `description` | `all`, `has`, `none`; lọc mô tả sau khi trim |
| `sortBy` | `name`, `slug`, `description`; mặc định `name` |
| `sortOrder` | `asc`, `desc`; mặc định `asc` |

Ví dụ: `/api/categories?page=2&pageSize=10&q=shirt&sortBy=slug&sortOrder=desc&description=has`.
Response `{ data, meta: { page, pageSize, total, totalPages } }`; total tính sau
lọc, trước phân trang. Page ngoài phạm vi trả data rỗng và giữ total thực tế.
Search/filter/sort/limit/offset chạy ở PostgreSQL, không tải toàn bộ rồi slice.
ID tăng dần là khóa phụ giúp thứ tự ổn định. Sai tham số trả 400 với `code: 'input_valid_error'` và field errors theo locale
trong `extensions` (cùng envelope với validation body); cột sort chỉ chấp nhận allowlist, `%`/`_` trong search là ký tự thường.

Chạy `pnpm --filter @p4/api test:categories`: kiểm tra parser, controller và query
Sequelize/SQL được sinh (model stub, không kết nối DB). Chưa thay schema/migration.
Thay đổi này chỉ ở local, cần deploy trước khi frontend chuyển sang server mode.
