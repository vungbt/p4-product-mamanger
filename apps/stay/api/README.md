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

Gửi email (đặt lại mật khẩu, xác minh) chưa có: ngoài production link được ghi log, production trả `mail_unavailable`.
