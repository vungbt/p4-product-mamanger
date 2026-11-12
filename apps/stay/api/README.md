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
| `STAY_PORTAL_SESSION_RATE_LIMIT`, `STAY_PORTAL_TOKEN_RATE_LIMIT`, `STAY_PORTAL_LOOKUP_RATE_LIMIT` | `30`, `5`, `120` / 15 phút | Cổng người thuê (ST-25): vào cổng theo IP, theo token, tra link theo IP. Chỉ đổi được ngoài production (CI nâng lên) |

| `STAY_SMTP_HOST`, `STAY_SMTP_PORT`, `STAY_SMTP_SECURE`, `STAY_SMTP_USER`, `STAY_SMTP_PASSWORD` | trống, `1025`, `false`, trống, trống | Email thông báo (worker). Không có host: tắt email. Local: Mailpit `localhost:1025` |
| `STAY_MAIL_FROM` | `no-reply@stay.local` | Địa chỉ gửi |
| `STAY_VAPID_PUBLIC_KEY`, `STAY_VAPID_PRIVATE_KEY`, `STAY_VAPID_SUBJECT` | trống, trống, `mailto:<STAY_MAIL_FROM>` | Thông báo trình duyệt (Web Push). Thiếu một khoá: tắt. Tạo cặp khoá: `pnpm --filter @stay/api exec web-push generate-vapid-keys` |

Gửi email đặt lại mật khẩu/xác minh tài khoản chưa có: ngoài production link được ghi log, production trả `mail_unavailable`.

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
  building `roundingUnit`. When the body omits `surcharges`, the building's `moveOutFee` (else
  the system setting, default 300.000đ; 0 = off) is added as one "Khấu hao cơ sở vật chất"
  surcharge; an array (even empty) is used as sent, so the owner can edit or remove that line. Earlier issued invoices with something left are listed only
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

### Tenant portal (ST-25, part A)

Run migration `20261126000100-tenant-portal.cjs`: `tenant_portal_links` (`building_id`,
`contract_id`, `tenant_id`, `token_hash` = SHA-256 of the token, `created_by`, `revoked_at`,
`revoked_by`, `failed_attempts`, `locked_until`, `last_opened_at`; one non-revoked link per
`(contract_id, tenant_id)`), `tenant_portal_sessions` (`link_id` ON DELETE CASCADE,
`session_hash` = SHA-256 of the cookie value, `expires_at`, `user_agent`) and `announcements`
(`building_id`, `title`, `body`, `room_ids` null = whole building, `pinned`, `expires_at`,
`created_by`, `version`; read by the portal only, staff writes are part B).

Tenants never get Better Auth accounts. A link token (32 random bytes, base64url) plus the last 4
digits of the occupant's own phone opens a **portal session**: a random 32-byte id in the HttpOnly
cookie `stay_portal_session` (production `__Secure-stay_portal_session` + `Secure`), `SameSite=Lax`,
`Path=/api/portal` (never sent to staff routes), 90 days (`PORTAL_SESSION_TTL_DAYS`).

| Method/path (prefix `/api`) | Auth | Notes |
| --- | --- | --- |
| GET `/contracts/:id/portal-links` | read `Contract` | Every link of the contract, newest first: occupant, `status` (`active`, `locked`, `revoked`, `expired`), `lastOpenedAt`, `lockedUntil`, `activeSessions`. Never the token or its hash |
| POST `/contracts/:id/portal-links` | update `Contract` | `{ tenantId }` of a current occupant (422 `portal_tenant_not_occupant`) of an active/ending contract (409 `contract_not_active`). Returns `{ link, token, path: '/p/{token}', url, replacedLinkId }` once (201); the occupant's previous active link is revoked and its sessions deleted |
| DELETE `/portal-links/:id` | update `Contract` | Revokes (idempotent, `revoked: false` the second time) and deletes every session of the link: all devices are signed out |
| POST `/portal/links/lookup` | public | `{ token }` → `{ roomCode, buildingName, signedIn }` for the T-02 greeting; any invalid link → 404 `portal_link_invalid`. Read-only |
| POST `/portal/sessions` | public | `{ token, phoneLast4 }` → 201 `{ expiresAt }` + cookie. Unknown/revoked/expired link and wrong digits → the same 401 `portal_verification_failed`. The 5th wrong attempt in a row locks the link 15 minutes: 429 `portal_link_locked` (`Retry-After`, `extensions.retryAfterSeconds`) |
| DELETE `/portal/sessions` | portal | Signs this device out (`Max-Age=0` cookie) |
| GET `/portal/me` | portal | T-03: own name, room, building, contact phone, latest issued invoice, `totalDebt`/`previousDebt`/`unpaidInvoiceCount`, pinned unexpired announcements of the building/room |
| GET `/portal/invoices` | portal | Issued/partially paid/paid invoices of the contract, newest first (never drafts or void) |
| GET `/portal/invoices/:id` | portal | `PortalInvoice` = the ST-16 public view (`publicInvoiceView`: lines, totals, payee, `vietQrPayload` for the **remaining** amount) + `id` + non-reversed payments (`id`, `amount`, `method`, `paidOn` only). Another contract's invoice → 404 |
| GET `/portal/contract` | portal | Read-only: rent and services (price in force), deposit held, issue/due day, occupants (own name; others `abbreviatePersonName` only), vehicles (other occupants' plates masked) |
| GET `/portal/usage` | portal | Up to 12 consumption months (oldest first) from issued invoices' electricity/water snapshot lines |
| GET `/portal/notices` | portal | Unexpired announcements (pinned first, then newest), building `rulesText` and `contactPhone` |

Rules (`modules/portal`):

- **Validity** (`portal.access.ts`, `portalOpen`): the link is not revoked; the contract is
  active/ending and the occupant still lives there (`to_date` null or after today/the start date),
  or the contract ended (move-out, else end date) at most 30 days ago (`PORTAL_ENDED_GRACE_DAYS`);
  drafts and cancelled contracts never. Checked on every portal request
  (`portalSessionRequired`), so a revoked link, an expired contract or a removed occupant ends the
  sessions immediately; revoking also deletes the session rows.
- **Scope**: every portal query starts from the session's contract, checked with the CASL `tenant`
  ability `{ id: tenantId, role: 'tenant', contractIds: [contractId] }` (`canAccessRecord` on
  `Contract`/`Invoice`); ids from the URL are always combined with that contract. Staff cookies
  are never read by the portal guard and the portal cookie is not a Better Auth session, so each
  side gets 401 with the other's cookie. Portal writes go through `assertCookieOrigin` (CSRF).
- **Verification**: digits compared in constant time (`timingSafeEqual` over SHA-256). A wrong
  attempt is counted in its own transaction (atomic `UPDATE … RETURNING`) so it survives the failed
  request; the lock resets the counter. Success resets the counter, sets `last_opened_at` and drops
  the link's expired sessions.
- **Rate limits** (`env.portalRateLimits`, window 15 minutes, existing `rateLimit` table):
  sessions 30/IP (`STAY_PORTAL_SESSION_RATE_LIMIT`), 5/token whatever the IP
  (`STAY_PORTAL_TOKEN_RATE_LIMIT`; the limiter is keyed by the token hash), lookups 120/IP
  (`STAY_PORTAL_LOOKUP_RATE_LIMIT`). The variables are honoured outside production only; the CI
  scripts raise them.
- **Audit** (ids, dates and flags only — never tokens, session ids, hashes, digits or names):
  `tenant_portal_link.created` (with `replacedLinkId`, `sessionsRevoked`),
  `tenant_portal_link.revoked`, `tenant_portal.session_created`, `tenant_portal.session_deleted`,
  `tenant_portal.verification_failed` (outcome `failure`, `locked`). Portal reads record nothing.
- Links use `STAY_WEB_URL`, else the trusted caller origin, else the first web origin (as ST-16).

Part B (below) built on these extension points: tenant routes in `portal.router.ts` behind
`portalSessionRequired` reading `portalOf(req)`, policies in `portalAuditPolicies`.

Integration coverage: `tests/portal.integration.test.mjs` (CI Postgres/API only); browser
coverage: `apps/stay/web/e2e/portal.spec.ts`.

### Tenant requests, maintenance, payment claims and announcements (ST-25, part B)

Run migration `20261203000100-portal-requests.cjs`:

- `payment_claims` (`building_id`, `contract_id`, `invoice_id`, `tenant_id`, `portal_link_id`, `amount`
  BIGINT, `paid_on`, `receipt_file_id`, `reference`, `note`, `status`
  `pending|confirmed|rejected|cancelled`, `payment_id`, `reject_reason`, `handled_by/at`,
  `idempotency_key/hash`, `version`). One `pending` claim per invoice (partial unique index); one
  claim per `(tenant_id, idempotency_key)`; a payment belongs to at most one claim.
- `maintenance_requests` (columns of data-model.md: `source` `owner|tenant`, `category`
  `electricity|water|appliance|other`, `severity` `normal|urgent`, `title`, `description`, `status`
  `new|open|in_progress|done|rejected|cancelled`, `reply` + `replied_at/by`, `handled_by/at`,
  `cost_expense_id`, `photos` uuid[] ≤ 5, `created_by`). Tenant rows require contract and tenant;
  ST-22 adds the internal workflow (owner source, costs) on the same table.
- `tenant_requests` (`type` `move_out|add_occupant|remove_occupant|add_vehicle|remove_vehicle|other`,
  `payload` JSONB, `status` `new|accepted|rejected|cancelled`, `reply`, `result` JSONB of ids written
  on accept, `handled_by/at`, `room_id` snapshot).
- Portal uploads: `upload_tickets.owner_id` is nullable with `portal_link_id` (one of them is set);
  `files.portal_link_id`. Purposes `payment_receipt` and `maintenance_photo` exist only for portal
  tickets (`POST /api/uploads` still accepts the three staff purposes, `STAFF_UPLOAD_PURPOSES`).

Shared types: `libs/stay/shared/src/requests.ts`. Tenants only **propose**; contract and ledger
changes happen only when staff accept.

| Method/path (prefix `/api`) | Auth | Notes |
| --- | --- | --- |
| POST `/portal/uploads`, `/portal/uploads/:id/complete` | portal | `{ purpose: payment_receipt\|maintenance_photo }`; ticket owned by the link, building of the contract; 60 tickets/day/contract |
| POST `/portal/invoices/:id/payment-claims` | portal | `PaymentClaimInput` `{ amount 1…remaining, paidOn ≤ today, receiptFileId?, reference?, note? }`, optional `Idempotency-Key` (same key + body → same claim; other body → 409 `idempotency_conflict`). 422 `payment_exceeds_remaining`, 409 `payment_claim_pending` / `invoice_already_paid`; another contract's invoice → 404 |
| POST `/portal/payment-claims/:id/cancel` | portal | Sender only, while `pending` (409 `request_not_pending`) |
| GET/POST `/portal/maintenance` | portal | List of the contract (signed photo URLs, `isOwn`); create `{ title, description, category, severity, photoFileIds ≤ 5 }` (own `maintenance_photo` uploads), active/ending contract, 10/day/contract |
| POST `/portal/maintenance/:id/cancel` | portal | Reporter only, while `new` |
| GET/POST `/portal/requests` | portal | Own requests; create `{ type, payload }` validated per type (field errors `payload.<field>`; dates inside the term, move-out ≥ today), 10/day/contract |
| POST `/portal/requests/:id/cancel` | portal | Own, while `new` |
| GET `/requests` | read `Maintenance` (claims: read `Payment`) | Unified inbox (`InboxItem`): `kind` `maintenance\|tenant_request\|payment_claim`, common `status` `pending\|in_progress\|done\|rejected\|cancelled`, `buildingId`, `contractId`, `q` (room, contract, sender, title, invoice code), newest first; `meta.counts` per status for the filter without `status` |
| POST `/requests/:id/accept` | update `Maintenance` | Maintenance → `in_progress` (`done: true` → `done`). Tenant request (`new`) → runs the contract change in the same transaction (below); optional `reply`, `effectiveDate`, `tenantId`, `newPrimaryTenantId`, `vehicleId` |
| POST `/requests/:id/reject` | update `Maintenance` | `{ reason }` required (stored as the reply the tenant sees) |
| POST `/requests/:id/reply` | update `Maintenance` | `{ message }`; replaces the latest reply, status unchanged |
| POST `/payment-claims/:id/confirm` | create `Payment` | `insertPayment` (ST-15) with method `bank_transfer`, `paidOn`/`amount`/`reference` from the claim unless overridden; claim `confirmed` + `payment_id` |
| POST `/payment-claims/:id/reject` | create `Payment` | `{ reason }`; invoice untouched |
| GET/POST `/announcements`, PUT/DELETE `/announcements/:id`, POST `/announcements/:id/archive` | update `Building` | `AnnouncementInput` `{ buildingId, title, body, roomIds (null/[] = whole building, active rooms of the building), pinned, expiresOn (last day shown, VN; not in the past) }`; PUT with `version`; archive = expires now and unpinned; list `status=active\|expired\|all`, pinned first |

`GET /portal/me` gains `openRequests` (`maintenance` open, own `requests` new, `paymentClaims`
pending); `GET /portal/invoices/:id` gains `claims` (status, reject reason, `isOwn`).

Rules:

- **Accepting a tenant request** (`requests.inbox.ts`, `applyRequest`) calls the existing services
  inside the inbox's audited transaction (nested `auditedTransaction` reuses it), so a validation
  error of ST-12/ST-17 rolls back everything and the request stays `new`: `move_out` →
  `giveNotice` (contract `ending`, `noticeDate`); `add_occupant` → `changeContract('occupants')`
  with the inline name/phone from the effective date; `remove_occupant` → `changeContract('leave')`
  (occupant by `tenantId`, else the unique occupant with that name); `add_vehicle` → the
  requester's vehicle (created when the plate is new) + `changeContract('vehicles', enabled)`;
  `remove_vehicle` → the registered vehicle with that plate (or `vehicleId`); `other` → status
  only. The contract `version` is read in the transaction. Staff need `update Contract` too.
- **Confirming a claim** locks the claim row first: a retry or a concurrent confirm returns the
  same `paymentId` (exactly one payment). `insertPayment` keeps its checks (remaining, void, paid).
- **Scope**: portal queries always combine ids with the session's contract (another contract →
  404; uploads of another link are not attachable). Staff items/filters outside the user's
  buildings → 404; the list is scoped by building in SQL (one UNION query, counts in SQL).
- **Audit**: staff writes record `maintenance_request.*`/`tenant_request.*` (resource `request`),
  `payment_claim.confirmed|rejected`, `announcement.created|updated|archived|deleted`; tenant writes
  record `payment_claim.created|cancelled`, `maintenance_request.created|cancelled`,
  `tenant_request.created|cancelled` with `actorId: null` and the link/tenant ids. Only ids, types,
  statuses, dates, money and counts — never replies, reasons, notes, titles, names or phones.
  Reads never call `setAuditChanges`.
- **Ability kit**: unchanged — `Maintenance`, `Payment` and `Building` already follow the manager
  rules (assigned buildings); "manage Maintenance/Building" in the spec maps to `update`.

Web: tenant `/p/invoices/:id` "Tôi đã chuyển khoản" (amount = remaining, date, receipt photo,
pending/rejected states, cancel), `/p/maintenance` + `/p/maintenance/new`, `/p/requests` +
`/p/requests/new` (type-specific fields), home counts. Staff `/requests` (status chips with
counts, kind filter, search, detail dialog with accept/reject/reply and claim confirmation showing
the receipt), the "Yêu cầu" menu badge (pending of the active building), contract tab "Yêu cầu",
and `/announcements` (from Cài đặt).

Integration coverage: `tests/portal-requests.integration.test.mjs` (CI Postgres/API only);
browser coverage: `apps/stay/web/e2e/portal-requests.spec.ts`.

### Temporary residence / Khai báo tạm trú (ST-28)

Run migration `20261201000100-resident-registration.cjs`. Registration is stored on
`contract_occupants` (`registered_on`, `registration_note`, `registered_by`), per occupant
stay rather than on the tenant: leaving and returning requires a new registration.
A representative-role interval split carries the existing registration forward.
Room changes retain the occupant stay and use `stay_contract_room_at` for the selected date.

| Method/path (prefix `/api`) | Permission | Behavior |
| --- | --- | --- |
| GET `/buildings/:buildingId/residents` | read Tenant | Required `date=YYYY-MM-DD`, `status=all\|unregistered`, `q` (name/room), standard pagination and name sorting |
| POST `/resident-stays/:id/registration` | manage Tenant | `id` = `contract_occupants.id`, `{ registeredOn, note? }`; valid date between arrival and today; note ≤ 2,000 characters |
| DELETE `/resident-stays/:id/registration` | manage Tenant | Clear this stay's registration |
| POST `/buildings/:buildingId/residents/export` | read Tenant | `{ date }`; XLSX attachment; rate limited to 10 requests/minute |

The list uses SQL joins/counts, never per-resident queries. Contracts must be active/ending,
with inclusive start/end dates, occupant `from_date <= date` and exclusive `to_date > date`.
One row per tenant, latest eligible stay wins if legacy data overlaps. Historical ended
contracts are excluded, consistent with the requested active/ending scope. An assigned
manager can read/export; other buildings return 404. `manage Tenant` marking is owner-only
under the existing ability policy. Full CCCD is restricted to staff with building-scoped
read Tenant; the web masks it and uses the existing audited reveal command.

GET is read-only and never calls `setAuditChanges`. Registration audits contain only stay ID,
building ID and marked/unmarked state. Export commits `residents.export` with actor/time,
building, selected date and row count before sending the file; no names, identity numbers,
addresses or free text enter either audit payload. Excel columns: STT, Họ tên, Ngày sinh,
Số CCCD (text, preserving leading zeros), Quê quán/Địa chỉ thường trú, Phòng, Ngày đến,
Đã khai báo (registration date or Chưa khai báo). Export includes the whole selected date,
regardless of the web search/unregistered filter. ExcelJS is pinned to `4.4.0` in @stay/api.

Web `/residents` is beside Người thuê in the menu, with Vietnam-today default date,
URL filters, desktop table/mobile cards, registration dialog, and Excel download.
CI Postgres coverage: `tests/residents.integration.test.mjs`; browser coverage:
`apps/stay/web/e2e/residents.spec.ts` (building A only, desktop and 375px).

### Reports and Excel (ST-21)

All routes require a staff session and scoped `read Report` (owner or the building's manager).
Unknown/inaccessible buildings return 404. Reports are read-only: no `setAuditChanges`.
Each response/export uses a REPEATABLE READ snapshot; aggregation runs in SQL without N+1.

| Method/path (prefix `/api`) | Input | Result |
| --- | --- | --- |
| GET `/reports/revenue` | `buildingId`, `from`, `to` | `months` (zero months included) and `totals`: billed, collected, expenses, profit |
| GET `/reports/rooms` | `buildingId`, `year` (2000–2099) | Every room: billed, collected, occupiedMonths, occupiedDays, availableDays, occupancyRate (0–1 or null) |
| GET `/reports/utilities` | `buildingId`, `from`, `to` | Monthly billed kWh/m³, billed VND, utility expenses VND and loss percentages |
| POST `/reports/exports` | `{buildingId, from, to, sheets: ['invoices','payments','expenses','receivables']}` | XLSX attachment (`stay-from-to.xlsx`); 5 requests/minute |

`from`/`to` are required `YYYY-MM`, inclusive, 2000–2099; reversed ranges and more than
24 months return 422, malformed months 400. Sheets must be nonempty, unique and supported.
Billed = issued/partially_paid/paid invoices by **invoice period**, every invoice kind;
collected = non-reversed payments by **actual paidOn**, including `deposit`. Drafts/void excluded.
Expenses use their expense period; profit = collected − expenses. These match the invoice,
payment and expense list endpoints with equivalent filters (sum their months for a range).

Room amounts use the entire selected calendar year. Occupancy counts distinct occupied days,
including move-in and move-out dates, following `stay_contract_room_at` room-change history;
occupiedMonths counts distinct months with any occupied day. Available days start at the room's
creation date (Asia/Ho_Chi_Minh), end before its archive date, clipped to the selected year.
Future days of a holding contract count as scheduled occupancy; this is a full-year report,
not a year-to-date forecast. Cancelled/draft contracts never count. Rate is occupied/available,
rounded to four decimals, null when no available days. Archived rooms remain in the report.

Utilities use **invoice-line consumption period** (usually M−1), not the invoice's period M.
Quantities and billed VND come from electricity/water line snapshots of issued invoices.
Expense categories are matched by `lower(trim(name))`: `điện tổng` and `nước tổng` respectively.
Create these categories in expense settings to track separate costs. The seeded `Điện nước tổng`
is shown as `combinedExpenses` and is never guessed or split. Renaming a category changes matching;
inactive categories still count. Other categories are excluded. Each loss percentage is
`(expenses − billed) / expenses × 100`, rounded to two decimals; null when expenses = 0.
It measures money shortfall, **not physical consumption loss** (expenses have no kWh/m³ field).
Negative loss means tenant billing exceeds expense. Shared expense is displayed separately.

ExcelJS **4.4.0** writes Vietnamese sheets `Hoá đơn`, `Sổ thu`, `Chi phí`, `Công nợ` with
bold frozen headers, column widths, numeric VND cells and real date cells (`dd/mm/yyyy`).
Invoices use invoice period, payments use paidOn, expenses use expense period. Receivables are
**current** unpaid balances of invoices in the selected periods, not a historical balance as of
`to`. Only issued unpaid invoices count. Export has no pagination/truncation; all selected rows
are read in the same snapshot. No tenant contact details, notes, or formula objects are exported.

Web `/reports`: active building, URL `from`/`to` and `tab`, three tabs, lazy bar chart,
scroll-contained tables on mobile and sheet-selection export dialog. SDK provides `reportKeys`,
`reportQueryOptions`, `useRevenueReport`, `useRoomsReport`, `useUtilitiesReport`, `downloadReport`.
Invoice/payment/expense/room/contract mutations invalidate reports.
CI coverage: `tests/reports.integration.test.mjs`; browser coverage: `apps/stay/web/e2e/reports.spec.ts`.

### Billing automation and reminders (ST-26)

Migration `20261202000100-automation.cjs` adds `building_automations` (five per-building
flags and its own optimistic `version`), `automation_runs` (unique building/period/kind),
`job_leases`, `notifications`, and per-staff `notification_reads`. It reuses the existing
Stay `domain_events` outbox. No portal/payment-claim/request/announcement tables change.

- GET/PUT `/api/buildings/:id/automation`: scoped read Building / manage Building.
  PUT requires `readingReminder`, `createDrafts`, `beforeDue`, `afterDue`,
  `tenantRemindersDisabled`, and `version`; stale writes return 409. Writes are audited.
  Defaults: all automations off, tenant reminders disabled. Owners opt in in the building
  edit page's “Tự động hoá kỳ thu” section. Archived buildings never run.
- GET `/api/notifications`: staff's 50 most recent notifications across accessible buildings,
  plus `unreadCount` across all unread records. POST `/api/notifications/:id/read` marks read
  for that staff member only (idempotent, audited). The header bell polls every 30 seconds.
- Calendar: Asia/Ho_Chi_Minh; reading day in consumption month M−1 reminds for billing M;
  issue day in M calls **the ST-14 `createDrafts` service**, never issues invoices. Its preview
  exclusions identify missing readings/meters and create an owner notification naming rooms.
  Rent/services M and utilities M−1 remain entirely in the existing billing service/library.
  Before/after jobs run exactly due−1/due+3, including adjacent-month boundaries, for unpaid
  issued/partially paid invoices. The current primary occupant receives the email; if missing
  an email (or representative), staff get a notification listing unreached people/invoices.
  ST-16 `shareInvoice` creates a fresh public link in the same transaction as each queued mail;
  refreshing a link invalidates its predecessor, as manual ST-16 sharing does.

Run in production as a **separate process/container command** after migration/build, with
exactly the API's `STAY_DATABASE_*`, auth/web URL and production configuration:

```sh
pnpm --filter @stay/api build
pnpm --filter @stay/api worker
# Container command (image working directory /app/apps/stay/api): node dist/worker.js
```

No HTTP server is started by the worker. It sweeps every 30 seconds and drains only
`stay.automation.mail` outbox events. SIGTERM/SIGINT finish current work and close DB access.
For a worker container, override the image command with `node dist/worker.js` and disable/replace
the image’s API HTTP healthcheck (the worker has no HTTP port). Server-core supplies the outbox
and audited-command helpers; its lease claiming logic lives in P4’s app, so Stay implements that
locally without modifying server-core.
Multiple processes are safe: a committed pending run acquires a 90-second lease with a random
fencing token. The lease row remains locked while drafts, notifications, outbox events and
`done` commit atomically. A crash rolls these effects back; the pending run resumes after
lease expiry, including on a later date. Completed runs never repeat. Disabled/archived pending
runs are completed without effects. Schedules are evaluated for the current Vietnam day;
there is no automatic backfill of days when the worker never ran. Previously pending work
is always retried. Automation audit uses a system actor (`actorId: null`, `source: worker`),
with identifiers/period/kind only. The internal CASL system principal is never an HTTP user.

Reminders and owner notices go through the notification channels below (in-app, email, browser
push). Delivery re-checks automation switches, archived buildings and the unpaid invoice state
(`guard` of the dispatch event) before calling a transport, so queued reminders are suppressed
after opt-out or payment. Legacy `stay.automation.mail` events queued before that change are still
drained (`deliverAutomationMail`, plain text through SMTP when configured, else logged by id).
Mail delivery has a 90-second lease, delayed retries, and dead-letter after five failed attempts
(`domain_events.status = 'dead_letter'`; inspect/requeue operationally after fixing transport).
Outbox payloads contain recipient and invoice links; restrict database access accordingly.

Testing: `tests/automation.integration.test.mjs` runs only with CI and `STAY_TEST_API_URL`,
using a NEW isolated building, lowercase emails, direct calls to `runAutomations(now)` and an
injected fake mailer for `deliverAutomationMail(now, mailer)`. No worker process is needed in
`scripts/test-stay-api-integration.sh`. Internal modules in `dist/modules/automation` expose
these functions for deterministic tests; there is no public trigger endpoint. An operator can
invoke `runAutomations(new Date('...+07:00'))` in an authenticated deployment shell for replay
of a date; treat this as a privileged maintenance action, not a client capability. This can
create drafts and queue reminders; normal opt-in and deduplication still apply.

Browser coverage: `apps/stay/web/e2e/automation.spec.ts`, building A only, restores settings
in `finally`, tests desktop/375px, bell opening and horizontal overflow.

### Notifications: in-app, SSE, email and browser push

Migration `20261206000100-notification-channels.cjs`: `notifications` gains `kind`, `audience`
(`staff` = owner + managers of the building; `tenant` = occupants of `contract_id`, or only
`tenant_id`), `notification_tenant_reads`, `notification_preferences` (per staff user or tenant;
no row = everything on) and `push_subscriptions` (per staff user or tenant portal link).

Events (`modules/notifications/notifications.events.ts`, each inside the business transaction):

| Event | Audience | Kind / group |
| --- | --- | --- |
| Tenant "Báo đã chuyển khoản" | staff of the building ("Phòng X báo đã chuyển Y ₫ cho hoá đơn Z") | `payment_claim.created` / payments |
| Payment recorded or claim confirmed | tenant contract, with the remaining amount | `payment.recorded` / payments |
| Claim rejected | the sender, with the reason | `payment_claim.rejected` / payments |
| Invoice issued | tenant contract: amount, due date; email links to a fresh shared invoice (`/i/:token`) when the primary occupant has an email and SMTP is on | `invoice.issued` / invoices |
| Maintenance report / tenant request | staff | `maintenance.created`, `tenant_request.created` / requests |
| Accept / reject / reply | the tenant who sent it | `request.updated` / requests |
| Announcement created | every active/ending contract of the building (or chosen rooms) | `announcement.created` / announcements |
| Automations (ST-26) | reading/reading_before/drafts → staff; before/after due → tenant contract with the remaining amount | `reading.reminder`, `drafts.ready`, `reminder.unreachable`, `invoice.due_soon`, `invoice.overdue` / reminders |

Flow (no provider call before commit): `publishNotification` inserts the row, enqueues one
`stay.notification.dispatch` outbox event and calls `pg_notify('stay_notifications', ids)`
(delivered by Postgres only on commit). The worker (`deliverNotifications`, same loop as ST-26)
resolves recipients and preferences and queues one `stay.notification.email` per address and one
`stay.notification.push` per browser subscription (deduplicated by `dedupe_key`). Each delivery
re-checks access, preferences and the guard, then calls the transport. Retries: 30 s, 2 min,
10 min, 30 min; the 5th failure, an SMTP 5xx or a push 4xx dead-letters; push 404/410 deletes the
subscription. Email: the addressed tenant, else the contract's primary occupant, only with an
email on file; staff: active owners and assigned managers. Push: subscribed staff browsers, or
subscribed portal links of the contract (revoked links and occupants who left are skipped).
Channels are disabled (nothing queued) without `STAY_SMTP_HOST` / VAPID keys.

| Method/path (prefix `/api`) | Auth | Notes |
| --- | --- | --- |
| GET `/notifications/stream` | staff, read `Building` | SSE: `ready`, `notification` (`NotificationStreamEvent`), `: ping` every 25 s; only buildings the user can read; closes after 10 min (EventSource reconnects and re-checks the session) |
| GET/PUT `/me/notification-settings` | staff | `{ email, push, mutedGroups }`; response adds `emailAvailable`, `hasEmail`, `pushPublicKey`, `pushSubscriptions` |
| POST/DELETE `/me/push-subscriptions` | staff | `PushSubscription.toJSON()`; endpoints must be HTTPS on a browser push service host (no SSRF); delete only own |
| GET `/portal/notifications`, POST `/portal/notifications/:id/read` | portal | Own contract only (whole contract or this occupant) |
| GET `/portal/notifications/stream` | portal | SSE of the session's contract only |
| GET/PUT `/portal/notification-settings`, POST/DELETE `/portal/push-subscriptions` | portal | Per tenant; subscriptions belong to the portal link |

Web: the header bell and the portal bell listen to the stream (toast + live badge), poll every
30 s while it is down; after sign-in (staff) or portal sign-in they ask once for browser
permission (`public/sw.js`, click opens the related screen); a denial is remembered and
"Tài khoản → Cài đặt thông báo" / portal "Thêm → Thông báo của tôi" offer re-enabling and the
channel/group switches.

Tests: `tests/notifications.integration.test.mjs` (fake transports via
`deliverNotifications(now, transports)`), browser: `apps/stay/web/e2e/notifications.spec.ts`.
