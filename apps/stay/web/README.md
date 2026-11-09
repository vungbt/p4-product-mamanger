# @stay/web — Stay (quản lý nhà trọ) web

Vite + React 19 + `@itclabs/react-ui` 0.13.0 + Tailwind 4, cổng **5174**, proxy `/api` → `@stay/api` (`http://localhost:3011`, đổi bằng `STAY_API_PROXY_TARGET`). Mobile-first: bottom nav dưới `lg`, sidebar từ `lg` (1024px).

## Chạy local

```bash
pnpm dev:stay        # @stay/api (xem apps/stay/api/README.md: migrate + seed trước)
pnpm dev:stay-web    # http://localhost:5174 — đăng nhập owner@stay.local / stay-owner-123
pnpm --filter @stay/web build && pnpm --filter @stay/web preview   # bản build, cùng proxy
```

`pnpm dev` ở root không chạy app Stay (`--filter=!./apps/stay/*`).

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `src/brand.tsx` | Tên "Stay" và chữ logo; favicon/theme-color sinh từ token lúc khởi động |
| `src/styles/stay-theme.css` | Palette Stay (teal + xám lạnh, chỉ light) trên `:root`, import sau CSS kit |
| `src/libraries/session` | Phiên Better Auth (`@stay/sdk/auth`), React Query, `StaySdkProvider` |
| `src/libraries/ability.tsx` | `createAbilityReact(stayAbilityKit)` + rule từ `GET /api/me/capabilities` |
| `src/libraries/buildings` | `BuildingProvider` (`useBuildings`), `BuildingSelector` |
| `src/routing` | `appRoutes` (route có `ability`, menu sinh từ đây), guard, `AppRoutes` |
| `src/modules` | Màn: login (C-01), layout (C-02), errors (C-03), overview (O-01 giữ chỗ), placeholder "Sắp có" |

## Phiên đăng nhập

Giống `@p4/api-client`: Better Auth giữ phiên trong cookie HttpOnly `stay.session_token`; web chỉ giữ user trong bộ nhớ, **không lưu token** vào storage. Khôi phục khi tải trang, khi tab được focus, mỗi 5 phút (khi tab hiển thị) và khi tab khác đăng nhập/đăng xuất (`BroadcastChannel`). SDK nhận 401 → đồng bộ lại; phiên hết hạn thì về `/login` kèm thông báo. Đổi user thì xoá cache React Query. "Ghi nhớ email" chỉ lưu email (`localStorage`, có try/catch).

## Phân quyền và menu

Mỗi route trong `src/routing/route-configs.ts` có `ability: { action, subject }` theo `documents/stay/screens.md` (Chốt số và Yêu cầu dùng `update` vì người quản lý có create/read/update/delete chứ không có `manage`). `canOpen` (`src/libraries/ability.tsx`): Settings và Member cần quyền không điều kiện (`canAccess`); các subject theo toà mở khi có quyền trên ít nhất một bản ghi (`canAccessSome`, ví dụ quản lý toà A) — API đã lọc dữ liệu theo toà. `RequireAbility`, sidebar và bottom nav dùng cùng kiểm tra; thiếu quyền → trang 403. Chưa đăng nhập → `/login`, đăng nhập xong quay lại đúng URL.

## Toà nhà

`BuildingProvider` (mount trong `AppLayout`, chỉ khi đã đăng nhập) đọc `useBuildings({ pageSize: 100 })` của `@stay/sdk/react` — `GET /api/buildings` đã lọc theo toà người dùng được xem và ẩn toà lưu trữ. Toà chọn gần nhất lưu ở `localStorage` (`stay_building_id`, có try/catch); nếu toà đó không còn trong danh sách thì dùng toà đầu tiên và ghi lại lựa chọn. Màn nhận 404 từ `GET /api/buildings/:id` gọi `reportMissingBuilding(id)` để bỏ toà đó và tải lại danh sách. Bộ chọn ẩn khi có dưới 2 toà (chỉ hiện tên toà đang dùng từ `sm`). Màn theo toà dùng `useActiveBuilding().buildingId` trong query key để đổi toà thì tải lại.

## Kiểm thử

```bash
pnpm --filter @stay/web typecheck
pnpm --filter @stay/web build
pnpm lint
bash scripts/test-stay-web-e2e.sh   # cần STAY_DATABASE_* trỏ tới DB dùng thử + `pnpm --filter @stay/web exec playwright install chromium`
```

E2E (Playwright, Chromium, `e2e/`) build + migrate + seed + chạy `@stay/api`, build web, chạy `vite preview` rồi test: đăng nhập, reload giữ phiên (cookie HttpOnly, không token trong storage), URL bảo vệ → login → quay lại, lỗi field + lỗi chung khi sai mật khẩu, đăng xuất, mất phiên khi focus, ghi nhớ email, toà A là toà đang dùng (và fallback khi toà nhớ không còn), quản lý toà A (`e2e/seed-manager.mjs`, chỉ local/CI) thấy menu theo toà nhưng không thấy Cài đặt và nhận 403 ở `/settings`, bottom nav ở 375px, bàn phím + focus, 404, banner mất mạng. Test bị skip thì script fail. CI: job `stay-web-e2e` (GitHub `web.yml`, GitLab `.gitlab-ci.yml`); ảnh `test-results/screenshots/*.png` luôn được upload.
