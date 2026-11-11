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

`src/modules/buildings/buildings.usage.ts` gom các truy vấn dùng chung (thống kê, chặn lưu trữ, khoá mã toà khi đã có hoá đơn phát hành, khoá lịch sử giá đã được hoá đơn phát hành dùng). Giá theo ngày dùng `resolveBuildingPrice` (bọc `resolvePrice` của `@stay/billing`).

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
| `STAY_WEB_URL` | trống | Origin web dùng trong link chia sẻ hoá đơn (`/i/:token`); trống: origin web của request nếu được tin cậy, ngược lại origin đầu tiên của `STAY_CORS_ORIGIN` |
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
Since ST-14, activation also creates a **draft move-in invoice** with the same computation
(`computeMoveInDraft` in `modules/invoices/invoices.billing.ts`, also used by the preview). It
records a single positive `received` deposit entry when collected, with its method, date and
optional note. Initial readings and optional private
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
- ST-14 is implemented: move-in drafts on activation, invoice usage guards and the
  `deposit_entries.invoice_id` foreign key (see "Period invoices (ST-14)").
- ST-17 is implemented: notice (`ending`), cancel-notice/renew, settlement (`ended`), see
  "Move-out and settlement (ST-17)".

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

ST-14 (implemented) uses `periodMeterUsage` in `modules/readings/readings.service.ts` (the same
segment computation as `periodMeter`, plus the readings used); the issue transaction locks the
room rows first and sets the readings to `locked`; void unlocks them. Earlier edits are blocked
when a later reading is locked. CI integration coverage is in
`tests/readings.integration.test.mjs`; real-API browser coverage is in `e2e/readings.spec.ts`.

### ST-12 contract changes / ST-14 and ST-17 integration

Run migration `20261116000100-contract-changes.cjs` before deploying ST-12. It adds
`stay_contract_room_at(contract_uuid, business_date)` for room status/filter queries;
no background scheduler is needed for future moves. The latest destination is held
against other commands immediately; room/tenant views switch on the Vietnam effective date.
Room changes must be recorded in increasing effective-date order to preserve the meter chain.

All seven change routes accept `version`, `effectiveDate`, optional `Idempotency-Key`,
and `preview: true` for validation without business mutations (the request audit remains). Responses contain `{ impact,
contract }` (`contract: null` for previews). `impact.period` is the effective month;
`firstIssuePeriod` uses the building/system issue day, and `utilityPeriod` is the next
month for a room move. Counts and rent are resolved at the actual **issue date**;
there is no automatic rent split for a mid-month change. A room move's rent difference
needs a manual surcharge/discount. `toDate` is exclusive: someone leaving on D is
no longer counted on D. Contract start/end dates themselves remain inclusive.

`src/modules/contracts/contracts.resolvers.ts` exports:

- `contractOccupantsAt`, `contractVehiclesAt`, `contractServicesAt(contractId, date, tx?)`:
  dated registration rows (including tenant/service/vehicle IDs); use their lengths for counts.
- `contractRentAt(contractId, date, tx?)`: rent history replayed by effective date,
  creation order breaking same-date ties, with the ST-10 activation event as baseline.
- `contractFactsAt`: room, rent and initial meter readings at a business date, for
  settlement (ST-17), tenancy views and invoice snapshots.
- `contractRoomClosingsForPeriod(contractId, period, tx?)`: old-room utility segments
  for ST-14, with event ID, old/new room IDs, old initial and closing readings,
  new initial readings and effective date. Bill each old-room segment separately;
  use ST-13's most recent billed/read baseline when computing consumption to avoid
  rebilling prior months. Snapshot rates and source event IDs in invoice lines.
- `periodIsInvoiced(contractId, period)`: true when the period has an issued, non-void
  monthly or move-in invoice (ST-14). The preview then warns about void/reissue for unpaid
  invoices or a correction line next period when paid.
- `contractRoomEntryDate(contractId, date)`: the start date or the last room move ≤ `date`;
  readings of the room before it belong to someone else.

Events retain actor ID, effective date and structured payload; history DTOs resolve
actor display names. Audit rows contain only building/contract IDs, version and date,
never names, phones, plates or free text. ST-17 must keep dated history/events intact
and close registrations when settling; deposit application continues through ST-11.

Integration coverage is in `tests/contract-changes.integration.test.mjs` and runs
only through the existing CI Postgres/API runner. Web E2E fixtures create uniquely
coded rooms only in building A and require the real migrated API.

### Period invoices (ST-14)

Run migration `20261122000100-invoices.cjs`: `invoices`, `invoice_lines` (full snapshot: type,
service, description i18n key + params, period, quantity, unit, unit price, day ratio, amount,
`manual`, `meta` with start/end readings and meter segments), `invoice_sequences`
(`building_id, period, last_number`) and `invoice_meter_readings` (readings a draft used, with
the value used). Monthly invoices are unique per `(contract_id, period, kind)` while not void;
move-in invoices are unique per contract while not void. Money is BIGINT VND and
`total = subtotal + rounding = sum(lines)`.

| Method/path (prefix `/api`) | Quyền | Ghi chú |
| --- | --- | --- |
| GET `/buildings/:buildingId/billing/:period/preview` | read `Invoice` | `period` = M. Eligible contracts with expected totals; excluded ones with `reason` (`missing_reading`, `missing_meter`, `negative_consumption`, `already_issued`, `move_in_invoice`, `no_occupancy`, `invalid_data`) and `reasonDetail` |
| POST `/buildings/:buildingId/billing/:period/drafts` | create `Invoice` | Required `Idempotency-Key`. Creates/refreshes drafts; refresh keeps manual lines; issued invoices are never recomputed. Returns the preview + `created`, `refreshed`, `replayed` |
| GET `/invoices` | read `Invoice` | Standard list (`page/pageSize/q/sortBy/sortOrder` → `{ data, meta }`); `buildingId`, `period`, `kind`, `status`, `overdue=true\|false`, `roomId`, `contractId`; `q` = invoice or room code |
| GET `/invoices/:id` | read `Invoice` | With snapshot lines |
| POST `/invoices/:id/lines` | update `Invoice` | Draft only: `{ type: surcharge\|discount, amount > 0, reason, version? }` |
| DELETE `/invoices/:id/lines/:lineId` | update `Invoice` | Draft and `manual` lines only |
| POST `/invoices/issue` | issue `Invoice` | `{ ids }` (≤ 400 drafts), one transaction |
| POST `/invoices/:id/void` | void `Invoice` (owner) | Draft or issued with `paidTotal = 0`; `{ reason, version? }` |
| POST `/contracts/:id/move-in-invoice` | create `Invoice` | Active/ending contract without a non-void move-in invoice or a monthly invoice of its start month |

Rules (`documents/stay/rules.md`):

- Every amount comes from `@stay/billing` (`computeMonthlyInvoice`, `computeMoveInInvoice`,
  `invoiceTotals`, `invoiceSchedule`, `invoiceCodePeriod`); `modules/invoices/invoices.billing.ts`
  only loads dated inputs. Rent, occupants, vehicles, fixed services and **prices** are taken at
  the issue date of M (building/system `issueDay`); electricity/water are the consumption of
  M−1 from `periodMeterUsage` (readings service), registered at the end of M−1.
- A room move effective in M−1 bills the old room as separate metered lines in M
  (`meta.roomId`, `meta.sourceEventId`), from the last reading since the contract entered the
  old room to the closing readings of the move; the new room starts at its move-in readings.
- A contract with a non-void move-in invoice for M gets no monthly invoice for M.
- Issue locks room rows (ids sorted; the same serialization point as reading saves and meter
  replacement), then the invoice rows, then `invoice_sequences` rows (`INSERT … ON CONFLICT DO
  NOTHING` + `SELECT … FOR UPDATE`), so concurrent issues never duplicate codes
  `{building}-{YYYYMM}-{nnn}` (≤ 999 per building and period). Monthly codes use M; move-in and
  settlement codes use the issue-date period. `issuedOn`/`dueOn`: monthly = issue/due day of M;
  move-in = today (Asia/Ho_Chi_Minh), due on the later of today and the start date. Issue locks
  the readings used and refuses a draft whose readings changed since it was computed
  (409 `invoice_readings_changed`: refresh first).
- Void sets `status = void`, `voidReason`, `voidedAt`; readings no other issued invoice uses go
  back to `draft`, and the period can be drafted again.
- Overdue is derived: `issued`/`partially_paid`, `dueOn` < today (Asia/Ho_Chi_Minh) and
  `total − paidTotal > 0`. Tenants see only issued invoices of their contracts. Managers are
  scoped to assigned buildings (inaccessible → 404); `void` stays with the owner.
- Audit rows (`invoice.draft_created`, `draft_refreshed`, `line_added`, `line_deleted`,
  `issued`, `voided`) contain ids, kind, period, status, code, total and version only — never
  reasons or names.
- Room usage: `roomDebts` and `roomRecentInvoices` (`rooms.usage.ts`) read invoices; the
  building code is locked once an invoice was issued; a price override dated on/before an
  issued invoice that used it returns 409 `price_history_locked`.

Extension points:

- ST-15 payments (done, see below): `modules/payments` locks the invoice row, sums non-reversed
  payments and calls `applyInvoicePaidTotal(row, paidTotal, tx)`; the status is recomputed by
  `invoicePaymentStatus` (`@stay/billing`). Void refuses `paidTotal > 0`; paid invoices are
  corrected with an `adjustment` line on the next period (`manualLines` supports it with
  `referenceInvoiceId`).
- ST-16 share link (done, see "Invoice sharing and VietQR (ST-16)").
- ST-17 settlement (done, see "Move-out and settlement (ST-17)"): compute with `computeSettlement`, persist with
  `saveInvoiceDraft(contract, { invoice, roomId, readings, schedule }, null, tx)` (kind
  `settlement`, unique per contract is up to ST-17) and issue through `issueInvoices` (codes use
  the issue-date period). Apply the deposit with `applyDepositForSettlement` (its
  `invoice_id` now references `invoices`).
- ST-18 debt/reports: `GET /invoices?overdue=true`, `roomDebts`, and the `(status, due_on)` index.

Integration coverage: `tests/invoices.integration.test.mjs` (CI Postgres/API runner only).

### Payments (ST-15)

Run migration `20261123000100-payments.cjs`: `payments` (`invoice_id`, `building_id`, `amount`
BIGINT > 0, `method` `cash|bank_transfer|other`, `paid_on`, `reference`, `note`, `reversed_at`,
`reverse_reason`, `reversed_by`, `actor_id`, `created_at`). Payments are never edited or
deleted: a mistake is reversed once with a reason. `invoices.paid_total` is always the sum of
non-reversed payments, written in the same transaction as the payment/reversal.

| Method/path (prefix `/api`) | Quyền | Ghi chú |
| --- | --- | --- |
| POST `/invoices/:id/payments` | create `Payment` | Required `Idempotency-Key` (same key + body → the same payment, `idempotency_conflict` for another body). `{ amount, method, paidOn, reference?, note? }`; returns `{ payment, invoice }` (201) |
| POST `/payments/:id/reverse` | void `Payment` (owner) | `{ reason }`; once only (409 `payment_already_reversed`); returns `{ payment, invoice }` |
| GET `/payments` | read `Payment` | Standard list (`page/pageSize/q/sortBy=paidOn\|amount\|createdAt/sortOrder`), `buildingId`, `dateFrom`/`dateTo` (inclusive `paidOn`), `method`, `invoiceId`, `includeReversed=true\|false` (default false); `q` = invoice code, room code or reference. `meta.totals` (`{ method, amount, count }` for every method) and `meta.totalAmount` cover the whole filter and never include reversed payments |
| GET `/invoices/:id` | read `Invoice` | Now includes `payments` (newest first, reversed included) |

Rules (`documents/stay/rules.md` "Hoá đơn", "Thanh toán"):

- Recording locks the invoice row (`SELECT … FOR UPDATE`), so concurrent payments never exceed
  the total; reversal locks the invoice, then the payment. Only `issued`/`partially_paid`
  invoices take payments: draft → 409 `invoice_not_issued`, void → 409 `invoice_void`, paid →
  409 `invoice_already_paid`. `amount` > remaining → 422 `payment_exceeds_remaining` with
  `extensions.remaining` (never recorded as an overpayment). `paidOn` is not after today
  (Asia/Ho_Chi_Minh).
- Status: `issued` → `partially_paid` → `paid`, recomputed after every payment or reversal.
  Void is allowed again once every payment is reversed (`paidTotal = 0`, "chưa có thanh toán").
- Managers record payments and read the ledger of assigned buildings (kit rules: read/create
  `Payment`); reversal needs `void Payment`, which the kit keeps with the owner. Inaccessible
  invoices, payments and `buildingId` filters are 404.
- Audit rows `payment.recorded` / `payment.reversed` contain ids, amount, method, `paidOn`,
  paid total and status before/after only — never the reference, note or reason.

Extension points:

- ST-16 tenant payment claims: confirming a claim creates the payment with
  `insertPayment(user, invoiceId, input, tx)` (`payments.service.ts`) inside the claim's audited
  transaction (same locks and checks; store the returned id in `payment_claims.payment_id`;
  use the claim id for idempotency instead of a header).
- ST-18 receivables: `invoices.paid_total`/`status` are current after every write; use
  `GET /invoices?overdue=true`, `roomDebts`, and `GET /payments` (date range + totals per method)
  for collections. The receivables screen opens the same "Thu tiền" dialog
  (`apps/stay/web/src/modules/payments/payment-dialog.tsx`).

Integration coverage: `tests/payments.integration.test.mjs` (CI Postgres/API only).

### Invoice sharing and VietQR (ST-16)

Run migration `20261124000100-invoice-shares.cjs`: `invoices.share_expires_at` (paired with the
ST-14 `share_token_hash` by a check constraint) and a unique partial index on the hash. Only the
SHA-256 hash of a token is stored, so a link is shown **once**: refreshing creates a new token and
the previous link stops working. Sharing does not bump the invoice `version`.

| Method/path (prefix `/api`) | Quyền | Ghi chú |
| --- | --- | --- |
| POST `/invoices/:id/share` | update `Invoice` | Issued/partially paid/paid only (draft/void → 409 `invoice_not_shareable`). New random token (32 bytes, base64url), 60 days (`INVOICE_SHARE_TTL_DAYS`); returns `{ invoiceId, token, path: '/i/{token}', url, expiresAt }` |
| DELETE `/invoices/:id/share` | update `Invoice` | Revokes (idempotent): `{ invoiceId, revoked }` |
| POST `/buildings/:buildingId/billing/:period/shares` | update `Invoice` | Required `Idempotency-Key`. Creates/refreshes the links of every issued/partially paid/paid invoice of the period; `{ links: [{ invoiceId, roomCode, code, status, total, remaining, path, url, expiresAt }], count, replayed }` sorted by room |
| GET `/public/invoices/:token` | **public** | No session, cookie or origin check; `rateLimit('stay-public-invoice', 60/min per IP)`. Unknown, malformed, expired, revoked/refreshed or void → 404 |

`manage Invoice` in the spec maps to `update Invoice`: the kit gives managers
read/create/update/delete in assigned buildings and keeps `manage` (wildcard) with the owner.
Inaccessible invoices/buildings are 404. Summaries (`GET /invoices`, `GET /invoices/:id`) expose
only `shareExpiresAt` (expiry of the active link, `null` when none/expired), never the token.

Public DTO (`PublicInvoice` in `@stay/shared`): building name/address, room code, kind, period,
code, status, issue/due dates, overdue, lines (i18n description, quantity/unit/price/ratio,
amount, readings and covered dates only), subtotal, rounding, total, paid total, remaining, the
representative's abbreviated name (`abbreviatePersonName`: "N. V. An"), the payee
(`bankBin`, bank short/full name from the shared `VIETQR_BANKS` directory, account number and
holder) and `vietQrPayload` built server-side with `buildVietQrPayload` for the **remaining**
amount (`null` when nothing is left or the building has no complete bank account). The transfer
content is the system `transferContentTemplate` with `{invoiceCode}` replaced (the code is
appended when the template has no placeholder), as ASCII via `toTransferText`, ≤ 50 characters.
No phones, ID numbers, notes, full names or internal ids. The public route records no audit
changes (`setAuditChanges` is never called on reads) and the token is not a resource-id param.

Links use `STAY_WEB_URL`, else the caller's `Origin` when it is a trusted web origin, else the
first configured web origin. Bulk links are `HMAC-SHA256(STAY_BETTER_AUTH_SECRET, nonce)` of a
random 32-byte nonce: the idempotency record stores only the nonce, so a replay returns the same
links without storing tokens; a replay skips links refreshed or revoked since. Audit rows
`invoice.share_created` / `invoice.share_revoked` contain ids, code, period, status, expiry and
whether an active link was replaced — never the token or its hash.

Web: "Chia sẻ" on O-22 (`modules/invoices/share/share-dialog.tsx`: create/refresh, copy with a
clipboard fallback, Web Share, PNG image rendered client-side from `InvoiceCard` with
`html-to-image`, print page, revoke with confirmation, expiry), `/invoices/share?period=` for
bulk sharing (linked from O-20 after issuing and from O-21 when a period is filtered), and the
public page `/i/:token` outside the signed-in shell (`share/public-page.tsx`: VietQR via
`qrcode.react`, copy buttons, print CSS, generic title/`og:*`, `noindex`, `no-referrer`).

Integration coverage: `tests/invoice-share.integration.test.mjs` (CI Postgres/API only);
browser coverage: `apps/stay/web/e2e/invoice-share.spec.ts`.

### Receivables (ST-18)

No migration: receivables are read from `invoices` (`total`, `paid_total`, `status`, `due_on`),
which ST-15 keeps current after every payment or reversal.

| Method/path (prefix `/api`) | Quyền | Ghi chú |
| --- | --- | --- |
| GET `/buildings/:buildingId/receivables` | read `Invoice` | Standard list (`page/pageSize/q/sortBy=remaining\|overdueDays\|roomCode/sortOrder`, default `remaining desc`), `bucket=not_due\|1_7\|8_30\|over_30`; `q` = room code, contract code, occupant name or phone |

Each row is a **contract** with unpaid invoices (`issued`/`partially_paid` with
`total − paid_total > 0`; drafts and void never count): `contractId/contractCode/contractStatus`,
the contract's room today (`stay_contract_room_at`), the current representative's full name,
`representativePhone` (only when the user may read the building's tenants: owner, its managers),
`invoiceCount`, `remaining`, `overdueRemaining`, `oldestDueOn`, `overdueDays` (max over its
invoices: `today − dueOn` in Asia/Ho_Chi_Minh, 0 when not due) and `bucket` (`not_due` = 0,
`1_7`, `8_30`, `over_30` > 30 days; `receivableBucket` in `@stay/shared`), plus those invoices
(oldest due first: id, code, kind, period, status, total, paid total, remaining, due date,
overdue days, `shareExpiresAt`).

`meta` (besides pagination): `totalRemaining`, `overdueRemaining` and `invoiceCount` over the
whole filter (`q` + `bucket`), always equal to `sum(total − paid_total)` of the included invoices;
`buckets` (`{ bucket, count, remaining }` for every bucket, zeros included) matches `q` but not
`bucket`, for the chips. Rows, totals and bucket counts come from SQL aggregation (one CTE grouped
by contract, `GROUP BY bucket` for meta, one `IN` query for the page's invoices — no N+1) in one
REPEATABLE READ snapshot, so `meta` matches the rows. Filtering uses the ST-14 `(status, due_on)`
and `(building_id, period)` indexes. Inaccessible or unknown buildings are 404; the route is
read-only and records no audit changes.

Web: `/receivables` (O-25, menu "Công nợ", `modules/receivables`): building total and overdue
total, bucket chips with counts, search and sort on the URL, table (desktop) / cards (mobile),
"Thu tiền" (`InvoicesPaymentDialog`: the row's invoices, oldest preselected; per invoice from the
expanded row), "Gọi" (`tel:`), "Gửi lại link" (the ST-16 share dialog). SDK: `useReceivables`,
`receivableKeys`; invoice, payment and share mutations invalidate `['stay', 'receivables']`, so
a row updates or disappears right after a payment.

Integration coverage: `tests/receivables.integration.test.mjs` (CI Postgres/API only);
browser coverage: `apps/stay/web/e2e/receivables.spec.ts`.

### Move-out and settlement (ST-17)

Run migration `20261125000100-settlement.cjs`: `payments.method` accepts `deposit` (written only
by settlement) and `invoices_settlement_contract_key` allows one non-void settlement invoice per
contract.

| Method/path (prefix `/api`) | Quyền | Ghi chú |
| --- | --- | --- |
| POST `/contracts/:id/notice` | update `Contract` | `{ version, expectedMoveOutDate, note? }`; date ≥ today (Asia/Ho_Chi_Minh), ≥ start, ≤ end (when set). active → ending (or a new date while ending); stored in `contracts.notice_date` |
| POST `/contracts/:id/cancel-notice` | update `Contract` | `{ version }`; ending → active, `noticeDate = null` (409 `contract_not_ending` otherwise). `POST /renew` also withdraws the notice |
| POST `/contracts/:id/settlement-preview` | read `Contract` | `ContractSettlementInput` (`moveOutDate`, `finalElectric`, `finalWater`, optional photo ids, `surcharges: [{ amount, reason }]` ≤ 20). No write; returns `ContractSettlementPreview` |
| POST `/contracts/:id/settle` | `settle` `Contract` (owner) | Required `Idempotency-Key`; body = preview input + `version` + `refundMethod` (`cash`/`bank_transfer`/`other`, default `cash`). Returns `ContractSettlementResult` (`contract`, issued `invoice`, deposit numbers, `replayed`) |

`StayContract` now has `noticeDate`, `movedOutAt` and `settlementInvoiceId`. Managers preview
and give notice in assigned buildings; `settle` stays with the owner (CASL kit), so managers get
403 on `/settle` and inaccessible contracts are 404 on the other routes.

Computation (`modules/contracts/contracts.settlement.ts`, `settlementPlan`, shared by preview and
settle so both return the same numbers; all money from `@stay/billing`):

- `moveOutDate` D: not after today, not before the start; the contract must be `active`/`ending`
  (409 `contract_not_active`), without a room change after D (409
  `contract_has_future_room_change`) and **without draft invoices** (409
  `contract_has_draft_invoices`, `extensions.invoices: [{ invoiceId, kind, period }]`).
- Final utilities per registered metered service: from the latest **locked** reading (used by an
  issued invoice) of the room since the contract entered it, else the move-in/room-change reading
  (ST-13 rule for meters installed later), to the final reading; a meter replaced after that adds
  its closed segment. A reading recorded after D → 409 `reading_after_move_out`. Missing or lower
  final readings → 400 with `finalElectric`/`finalWater`. Prices, rent, occupants, vehicles and
  services are taken at D.
- `computeSettlement` adds rent/services of stayed days in periods without an issued
  monthly/move-in invoice, refunds prepaid days after D from issued invoices of D's month or later
  when the building's `refundUnusedRent` (else the system setting) is on, surcharges (each with a
  reason, stored as manual surcharge lines with `meta.reason`) and rounds the total with the
  building `roundingUnit`. Earlier issued invoices with something left are listed only
  (`outstandingInvoices`, oldest period first).
- `allocateSettlementDeposit` (new in `@stay/billing`) splits the deposit: earlier invoices first,
  then the settlement invoice; the rest is refunded. A negative settlement total (refunds larger
  than the charges) is a credit paid out with the refund, never paid from the deposit. The net
  always equals `computeSettlement`: `ownerRefunds − tenantPays = depositHeld − amountDue`.

Settle runs in **one** audited transaction: lock the contract, its room (same serialization point
as reading saves and invoice issue) and its invoices; recompute the plan; verify photos
(`contract_meter` uploads of the building); `saveInvoiceDraft` (kind `settlement`, period of D,
`invoice_meter_readings` = the locked baseline and the draft readings it supersedes) and
`issueInvoices` (code from the issue-date period; those readings become `locked`); a total ≤ 0 is
`paid` at once. For each allocation: `insertPayment` with method `deposit` and `paidOn` = today on
the invoice it pays (earlier invoices keep their own payments) and `applyDepositForSettlement`
(`applied` entry with that `invoice_id`; ledger method `other`). The remainder is a `refunded`
entry (`refundMethod`, today); an insufficient deposit leaves the rest due on the invoices (the
settlement invoice is `partially_paid`/`issued`). Occupants, services and vehicles get
`toDate = D + 1` (present on D; later registrations collapse to `from = to`), the contract becomes
`ended` with `moved_out_at = D`, so the room is vacant and tenants have no current room. Events:
`notice`, `notice_cancelled` (payload: expected date, note) and `ended` (final readings, photo ids,
invoice id and the settlement numbers). Audit rows `contract.notice`, `contract.notice_cancelled`,
`contract.settled` (plus the invoice/payment/deposit rows) contain ids, dates, statuses and money
only, never notes or reasons. The final readings are kept in the `ended` event and the invoice
line snapshot (like room-change closings), not as `meter_readings`, so a next tenant moving in the
same month keeps its own monthly closing.

The idempotency record stores the invoice id and numbers; the same key and body replays them
(`replayed: true`), another body is 409 `idempotency_conflict`, and settling an ended contract
with a new key is 409 `contract_not_active`. A settlement invoice cannot be voided (409
`settlement_invoice_not_voidable`) and `deposit` payments cannot be reversed (409
`deposit_payment_not_reversible`); manual payments still use `cash`/`bank_transfer`/`other`
(`MANUAL_PAYMENT_METHODS`), while `GET /payments` totals list every method including `deposit`.

Web: "Báo trả phòng"/"Huỷ báo trả phòng"/"Thanh lý" in the contract "Thay đổi" menu, notice and
ended banners on O-17, O-24 `/contracts/:id/settle` (readings + photos → surcharges → API summary
"Chủ trọ hoàn X"/"Người thuê trả thêm Y" → confirmation → invoice link and ST-16 share), "Thanh lý"
on occupied rooms (map menu and room detail, owner only) and the expected move-out date in the
contract list status.

Integration coverage: `tests/settlement.integration.test.mjs` (CI Postgres/API runner only);
browser coverage: `apps/stay/web/e2e/settlement.spec.ts`.

### Monthly overview (ST-19)

No migration: the overview is read from `invoices`, `payments`, `rooms`, `contracts`, `meters`
and `meter_readings`.

| Method/path (prefix `/api`) | Quyền | Ghi chú |
| --- | --- | --- |
| GET `/buildings/:buildingId/overview?period=YYYY-MM` | read `Report` | `period` = billing period M; malformed → 400, outside 2000–2099 → 422 `period_out_of_range` |

Without `period` the **current billing period** is the latest period whose issue date (the
building's `issueDay`, else the system default) is on or before today (Asia/Ho_Chi_Minh):
`currentBillingPeriod` in `@stay/shared` (with the default issue day 1, the current month).

Figures (`StayOverview` in `@stay/shared`, `modules/overview/overview.service.ts`):

- `current` / `previous` / `series` (the last 6 periods ending with M, oldest first, from one
  `GROUP BY period` query): `billed` = sum of `total` of the period's **issued** invoices
  (`issued`, `partially_paid`, `paid`) of **every kind** (`monthly`, `move_in`, `settlement`:
  the period's invoices, as `GET /invoices?period=` lists them); drafts and void never count.
  `collected` = the non-reversed payments of those same invoices, whenever they were paid (equal
  to the sum of their `paidTotal`); `remaining = billed − collected`.
- `collectedInMonth` (cash basis): non-reversed payments with `paidOn` in calendar month M, any
  invoice period (equals `GET /payments?dateFrom&dateTo` `meta.totalAmount`).
- `receivables`: `buildingReceivableTotals` from `modules/receivables/receivables.service.ts`,
  the same SQL as the ST-18 list `meta` without filters, so the totals always match `/receivables`;
  plus the overdue invoice count.
- `rooms`: non-archived rooms by today's status (the room map derivation: holding contract
  started → occupied, not started → reserved, else maintenance/vacant).
- `occupancy` / `previousOccupancy`: rooms occupied on the period's last day (today while the
  period runs) over the rooms that existed and were not archived then; `rate` from
  `occupancyRate` (`@stay/shared`, 0–1, four decimals, `null` without rooms). Ended contracts
  count until `moved_out_at` (else `end_date`).
- `todos`: always the 7 kinds of `OVERVIEW_TODO_KINDS`, in monthly calendar order, with `count`
  and a `link` `{ path, query }`; the web hides zero counts.

| Kind | Count | Link |
| --- | --- | --- |
| `readings` | Rooms of the ST-13 grid for consumption month M−1 (active/ending contracts started by then) whose current electricity and water meters do not both have a reading; `total` = rooms in the grid | `/readings?period=M−1` |
| `invoices_to_create` | Active/ending contracts overlapping M (the ST-14 preview selection) with no non-void `monthly` or `move_in` invoice of M | `/invoices/run?period=M` |
| `draft_invoices` | Draft invoices of M | `/invoices?period=M&status=draft` |
| `unshared_invoices` | `issued`/`partially_paid` invoices of M with something left and no active share link | `/invoices/share?period=M` |
| `overdue_invoices` | Overdue invoices of every period (`amount` = overdue remaining) | `/receivables?bucket=` the most severe non-empty overdue bucket |
| `expiring_contracts` | Active/ending contracts with `end_date` from today to today + 30 (the contract list `expiring=true`) | `/contracts?expiring=true` |
| `ending_contracts` | Contracts in status `ending` (move-out notice, ST-17) | `/contracts?status=ending` |

Everything is aggregated in SQL (seven statements including the building lookup, no per-row
queries) in one REPEATABLE READ snapshot. Managers of other buildings and unknown buildings get 404; the route is read-only and
records no audit changes. SDK: `useBuildingOverview(buildingId, period?)`, `overviewKeys`;
invoice, payment, reading, contract and room mutations invalidate `['stay', 'overview']`.

Web: `/` (O-01, `apps/stay/web/src/modules/overview`): period picker on `?period=`, stat cards
with the change against M−1, the to-do list, a six-period bar chart (`@itclabs/react-ui/chart`,
billed vs collected, with its screen-reader table), and the setup steps (first when the building
has no rooms).

Integration coverage: `tests/overview.integration.test.mjs` (CI Postgres/API only); browser
coverage: `apps/stay/web/e2e/overview.spec.ts`.
