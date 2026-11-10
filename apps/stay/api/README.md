# @stay/api — Stay (quản lý nhà trọ) API

Express + Sequelize + Better Auth, dựng trên `@p4/server-core` (request context, lỗi, audit, rate limit, CSRF origin, production checks) và CASL `stayAbilityKit` của `@stay/shared`. Cổng mặc định **3011**, prefix `/api`. Database riêng `p4_stay` trong cùng Postgres với P4 (không dùng chung bảng `users`, migration hay session).

## Chạy local

```bash
cp .env.example .env              # nếu chưa có; nhóm STAY_* ở cuối file
pnpm docker:dev                   # Postgres của P4; healthcheck tự tạo database p4_stay nếu thiếu
pnpm --filter @stay/api db:migrate
pnpm --filter @stay/api db:seed   # idempotent, chỉ local/CI
pnpm dev:stay                     # = pnpm --filter @stay/api dev → http://localhost:3011
```

Tài khoản seed (chỉ local/CI, **bị chặn ở production** bởi `isBlockedPassword` trong `src/configs/production.ts`):

| Email | Mật khẩu | Vai trò |
| --- | --- | --- |
| `owner@stay.local` | `stay-owner-123` | `owner` |

Seed cũng tạo toà `A`. Seeder từ chối chạy khi `NODE_ENV=production`; image Docker chỉ chạy migration.

## Endpoint nền

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET | `/health/live` | Process sống |
| GET | `/health` | Kiểm tra DB; 503 khi DB không sẵn sàng |
| * | `/api/auth/*` | Better Auth (`sign-in/email`, `sign-out`, `get-session`…). Không có đăng ký công khai |
| GET | `/api/me` | Người dùng hiện tại (`StayMe`) |
| GET | `/api/me/capabilities` | `{ contractVersion, rules }` — rule CASL cho `stayAbilityKit` |
| GET | `/api/docs` | Scalar; spec ở `/api/openapi.json`, `/api/openapi.yaml` |

```bash
curl -i -c /tmp/stay.jar -H 'content-type: application/json' -H 'origin: http://localhost:5174' \
  -d '{"email":"owner@stay.local","password":"stay-owner-123"}' \
  http://127.0.0.1:3011/api/auth/sign-in/email
curl -b /tmp/stay.jar http://127.0.0.1:3011/api/me/capabilities
```

## Cấu hình và toà nhà (ST-06, ST-07)

| Method | Path | Quyền | Ghi chú |
| --- | --- | --- | --- |
| GET/PUT | `/api/settings` | read/manage `Settings` | Kỳ thu mặc định; ngày `1`–`28` hoặc `31` = cuối tháng; PUT có `version` |
| GET/POST | `/api/services` | read/manage `Settings` | Dịch vụ mặc định tạo trong migration; một `electricity` và một `water` đang bật |
| PUT | `/api/services/:id` | manage `Settings` | Không có DELETE, chỉ tắt; `kind`, `code` không đổi |
| GET/POST | `/api/buildings` | read (theo toà)/manage `Building` | List chuẩn, `status=active\|archived\|all` |
| GET/PUT | `/api/buildings/:id` | read (theo toà)/manage `Building` | Ngoài phạm vi → 404; PUT gửi đủ trường + `version` |
| POST | `/api/buildings/:id/archive` | manage `Building` | 409 kèm danh sách phòng khi còn hợp đồng hiệu lực |
| GET/PUT | `/api/buildings/:id/prices` | read (theo toà)/manage `Building` | `?date=`; PUT `{ serviceId, effectiveFrom, price \| null }` |

Phòng, hợp đồng, hoá đơn chưa có: `src/modules/buildings/buildings.usage.ts` gom các truy vấn ST-08/ST-10/ST-14 sẽ bổ sung (thống kê, chặn lưu trữ, khoá mã toà, khoá lịch sử giá). Giá theo ngày dùng `resolveBuildingPrice` (bọc `resolvePrice` của `@stay/billing`).

## Người thuê, ảnh CCCD và import (ST-09)

| Method | Path | Quyền | Ghi chú |
| --- | --- | --- | --- |
| GET/POST | `/api/tenants` | read/create `Tenant` (theo toà) | List chuẩn, `buildingId`, `status=all\|living\|left\|no_contract\|archived`, `q` theo tên/SĐT/4 số cuối CCCD; tạo chỉ cần `fullName` + `phone` |
| GET/PUT | `/api/tenants/:id` | read/update `Tenant` | CCCD luôn che giữa; PUT có `version`, không gửi `idNumber` = giữ nguyên |
| POST | `/api/tenants/:id/reveal-id` | read `Tenant` | Số CCCD đầy đủ, mỗi lần ghi audit `tenant.reveal_id_number` (không chứa số) |
| POST | `/api/tenants/:id/archive` | delete `Tenant` | 409 khi còn ở hợp đồng hiệu lực (ST-10) |
| POST | `/api/tenants/:id/documents` | update `Tenant` | Gắn `fileId` đã upload (`id_front`/`id_back`/`other`) |
| POST/PUT/DELETE | `/api/tenants/:id/vehicles[/:vehicleId]` | update `Tenant` | Biển số viết hoa, không trùng trong xe của người thuê |
| GET | `/api/tenants/import/template?format=xlsx\|csv` | manage `Tenant` (chủ trọ) | File mẫu, chỉ dòng tiêu đề |
| POST | `/api/tenants/import/preview?buildingId=` | manage `Tenant` | Multipart `file` CSV/XLSX ≤ 2 MB, ≤ 1.000 dòng; lỗi theo dòng/cột, trùng SĐT (trong toà)/CCCD; không ghi DB |
| POST | `/api/tenants/import` | manage `Tenant` | `Idempotency-Key`; gửi lại `values` đã xem trước, kiểm tra lại, chỉ tạo dòng hợp lệ |
| POST | `/api/uploads` → `/api/uploads/:id/complete` | create/update `Tenant` ở toà | Ticket 10 phút, ảnh JPG/PNG/WEBP ≤ 10 MB |

- Trạng thái đang ở/đã rời/chưa có hợp đồng và phòng hiện tại suy ra trong `src/modules/tenants/tenants.occupancy.ts` (từ `contract_occupants` và trạng thái hợp đồng).
- Dữ liệu cá nhân: audit chỉ ghi id, toà, `version` và danh sách trường đã điền/đổi; không ghi tên, SĐT, CCCD, ngày, địa chỉ, URL hay `storageId`.
- Ảnh private: trình duyệt gửi file thẳng tới `uploadUrl` của ticket (Cloudinary `authenticated` khi có `STAY_CLOUDINARY_*`), API kiểm tra lại ảnh khi `complete`, hồ sơ trả URL ký hết hạn sau 5 phút. Không cấu hình Cloudinary thì ngoài production dùng **kho stub** (file trong `STAY_UPLOAD_STUB_DIR`, upload/xem qua `/api/uploads/:id/stub` và `/api/files/:id/stub` có chữ ký HMAC, không có đường dẫn công khai); production không có Cloudinary thì upload trả 503.
- Seed local/CI: 15 người thuê hư cấu ở toà A (SĐT `091100xxxx`, CCCD tiền tố `000`) và vài xe.

## Xác thực và phân quyền

- Better Auth với `cookiePrefix: 'stay'`: cookie là `stay.session_token` (production: `__Secure-stay.*`), không đè cookie `better-auth.*` của P4 dù cùng `localhost`. Client không dùng cookie gửi `Authorization: Bearer <token>`.
- Tài khoản do chủ trọ tạo; `/sign-up/email` bị tắt. Google tuỳ chọn (`STAY_GOOGLE_CLIENT_ID`) chỉ cho tài khoản đã tồn tại và bị chặn với `owner`/`manager`.
- Route nghiệp vụ: `authRequired` rồi `requireAbility(action, subject)` (`src/middlewares/ability.middleware.ts`); bản ghi cụ thể dùng `canAccessRecord(user, action, subject, { buildingId, contractId })`. Không so sánh `userId`/`buildingId` trực tiếp.
- Người quản lý lấy danh sách toà từ `building_members`; owner không cần dòng ở đó.

## Quy ước module

- Mỗi router kết thúc bằng `applyAuditPolicies(router, auditPolicies)`; route thiếu policy làm app **không khởi động**. Mount bằng `apiRouter.use(...)` trong `src/modules/index.ts`.
- Ghi nghiệp vụ qua `apiHandler` (audited transaction) hoặc `auditedCommand`/`auditedTransaction` (`src/shared/audit.ts`); outbox và idempotency ở `src/shared/persistence.ts`.
- Migration viết tay (không `sync()`), tên cột theo `documents/stay/data-model.md`.

## OpenAPI và SDK

`openapi.yaml` sinh tự động bằng generator dùng chung với P4 (`apps/api/scripts/openapi/generate.mjs --config scripts/openapi/config.mjs`). Generator đọc schema Better Auth từ database, nên cần DB đã migrate:

```bash
pnpm --filter @stay/api openapi:generate   # hoặc openapi:check
pnpm --filter @stay/sdk generate           # libs/stay/sdk/src/shared/generated.ts
```

Summary/mô tả operation khai báo trong `scripts/openapi/config.mjs`; `tests/openapi.test.mjs` fail khi spec lệch source.

## Kiểm thử

```bash
pnpm --filter @stay/api typecheck
pnpm --filter @stay/api lint
bash scripts/test-stay-api-integration.sh   # cần STAY_DATABASE_* trỏ tới DB dùng thử; CI dùng Postgres trống
```

Script build, migrate, seed hai lần (kiểm tra idempotent), chạy API rồi toàn bộ `tests/*.test.mjs`; suite nào bị skip thì fail.

## Biến môi trường

| Biến | Mặc định | Ghi chú |
| --- | --- | --- |
| `STAY_PORT` | `3011` | |
| `STAY_DATABASE_HOST/PORT/NAME/USERNAME/PASSWORD` | `localhost`/`5432`/`p4_stay`/`postgres`/`postgres` | Production: mật khẩu ≥ 12 ký tự |
| `STAY_BETTER_AUTH_URL` | `http://127.0.0.1:3011` | Origin public của API; production phải HTTPS |
| `STAY_BETTER_AUTH_SECRET` | secret dev | Production: ≥ 32 ký tự, không phải placeholder |
| `STAY_CORS_ORIGIN` | `http://localhost:5174` | Danh sách origin web, cách nhau bởi dấu phẩy; production không được `*` |
| `STAY_GOOGLE_CLIENT_ID`, `STAY_GOOGLE_CLIENT_SECRET` | trống | Tuỳ chọn |
| `STAY_PUBLIC_API_URL` | trống | Server hiển thị trong `/api/docs` |
| `STAY_CLOUDINARY_CLOUD_NAME`, `STAY_CLOUDINARY_API_KEY`, `STAY_CLOUDINARY_API_SECRET` | trống | Ảnh private (CCCD). Thiếu một giá trị: ngoài production dùng kho stub, production từ chối upload |
| `STAY_CLOUDINARY_FOLDER` | `stay` | Thư mục gốc trên Cloudinary |
| `STAY_UPLOAD_STUB_DIR` | thư mục tạm của hệ điều hành | Nơi kho stub lưu file (dev/test/CI) |

Gửi email (đặt lại mật khẩu, xác minh) chưa có: ngoài production link được ghi log, production trả `mail_unavailable`.

### Rental contracts (ST-10)

`GET/POST /api/contracts`, `GET/PUT /api/contracts/:id`,
`POST /api/contracts/:id/activate`, `POST /api/contracts/:id/cancel`, and
`GET /api/contracts/:id/move-in-preview` are available. Lists use the standard pagination,
search and sorting query, with `buildingId`, `roomId`, `status`, and `expiring=true` filters.
Managers use building-scoped `create`/`update` permissions for the management actions.
Draft updates require `version`; creation accepts an optional `Idempotency-Key`.
Activation serializes on the room row and is backed by `contracts_one_holding_room`.

Move-in amounts come from `computeMoveInInvoice`, resolving building prices on the start date.
Activation **does not create an invoice**. It records a single positive `received` deposit entry
when collected, with its method, date and optional note. Initial readings and optional private
meter photos remain on the contract (`contract_meter` upload purpose).

The local/CI seed adds nine active contracts in building A and is idempotent. The contract
integration suite runs under `scripts/test-stay-api-integration.sh`; browser coverage is in
`apps/stay/web/e2e/contracts.spec.ts`. Both require the CI/live API database.

Without a database, regenerate the business contract with the committed Better Auth section:

```sh
pnpm --filter @stay/api openapi:generate:offline
pnpm --filter @stay/sdk generate
```

Extension points:

- ST-11: deposit ledger commands/screens, balance enforcement for deductions; activation already
  writes received entries. `invoice_id` gets its foreign key when invoices exist.
- ST-12: dated occupant/service/vehicle registrations, contract terms and change event payloads.
  Only drafts can be edited by ST-10.
- ST-13 is implemented: `meter_readings`, closing/replacement commands and `latestMeterReadings`
  now use recorded readings. Move-in readings/photos remain the contract baseline.
- ST-14: persist/issue move-in invoices, implement invoice-dependent usage guards, and add the
  deposit invoice foreign key. Reuse the same preview computation and start-date prices.
- ST-17: ending/ended transitions and settlement; room/tenant derivation already understands
  holding and ended contracts.

### Meter closing (ST-13)

- `GET /api/buildings/:buildingId/readings?period=YYYY-MM`: all rooms with active/ending
  contracts started by the closing month; previous/current readings, segment consumption,
  average over available readings in the preceding three calendar months, warnings and lock state.
  Here `period` is the **consumption month**; the invoice period is the following month.
- `PUT /api/buildings/:buildingId/readings`: `{ rows: MeterReadingInput[] }` (1–400).
  Results preserve input order, with data or an error for each row. Each row runs in a savepoint.
  `version: 0` creates, positive versions update. Validation errors do not roll back valid rows.
- `PUT /api/readings/:id`: the same full row input, immutable meter/period, stale version = 409.
- `POST /api/meters/:id/replace`: `{ finalReading, initialReading, replacedOn, serial? }`.
  Optional `Idempotency-Key` safely replays replacement. Replacement closes the old meter,
  opens a new one and preserves both consumption segments. Existing draft closing in the
  replacement month becomes the old meter's final reading; a locked closing blocks replacement.

Readings are whole non-negative numbers, with the room meter limit 999,999,999. Consumption
uses `meterConsumption` from `@stay/billing`. High consumption (> 2 × available average,
including a zero average) requires `confirmHighConsumption: true`; no history means no high
consumption warning. Zero consumption is a soft warning. Photos reuse private `contract_meter`
upload tickets, verified for uploader, building and purpose. Managers use scoped `read`/`update`
MeterReading rules; inaccessible records return 404 and unavailable actions return 403.

O-19 `/readings` provides autosave, per-room status, offline localStorage drafts scoped to
account/building/period/room, floor and period URL filters, photos and replacement. Stored drafts
retain the original version; conflicts require explicit reload rather than silent overwrites.

The local/CI seed adds the last three completed months for the nine fixture contracts. On the
first historical seed only, untouched fixture contracts/meters move back to the history start;
existing readings are preserved. Production seeding is prohibited.

ST-14 extension points: use `periodMeter` in `modules/readings/readings.service.ts` for the same
segment computation; set `MeterReadingModel.status` to `locked` in the invoice issue transaction,
locking the room row first (the same serialization point used for saves/replacements). Void must
unlock the readings in its transaction. Earlier edits are blocked when a later reading is locked.
Invoice creation remains disabled on O-19 until ST-14. CI integration coverage is in
`tests/readings.integration.test.mjs`; real-API browser coverage is in `e2e/readings.spec.ts`.
