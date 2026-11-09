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
| `src/libraries/buildings` | `BuildingProvider`, `BuildingSelector`, `loadBuildings` |
| `src/routing` | `appRoutes` (route có `ability`, menu sinh từ đây), guard, `AppRoutes` |
| `src/modules` | Màn: login (C-01), layout (C-02), errors (C-03), overview (O-01 giữ chỗ), placeholder "Sắp có" |

## Phiên đăng nhập

Giống `@p4/api-client`: Better Auth giữ phiên trong cookie HttpOnly `stay.session_token`; web chỉ giữ user trong bộ nhớ, **không lưu token** vào storage. Khôi phục khi tải trang, khi tab được focus, mỗi 5 phút (khi tab hiển thị) và khi tab khác đăng nhập/đăng xuất (`BroadcastChannel`). SDK nhận 401 → đồng bộ lại; phiên hết hạn thì về `/login` kèm thông báo. Đổi user thì xoá cache React Query. "Ghi nhớ email" chỉ lưu email (`localStorage`, có try/catch).

## Phân quyền và menu

Mỗi route trong `src/routing/route-configs.ts` có `ability: { action, subject }` theo `documents/stay/screens.md`. `RequireAbility` dùng `useCanAccess` (quyền không điều kiện); thiếu quyền → trang 403. Sidebar và bottom nav lọc cùng danh sách. Chưa đăng nhập → `/login`, đăng nhập xong quay lại đúng URL.

## Toà nhà (chờ ST-07)

`BuildingProvider` lấy danh sách từ **một** hàm loader truyền qua prop (`app.tsx`: `<BuildingProvider loader={loadBuildings}>`). Hiện chưa có API danh sách toà nên `loadBuildings` (`src/libraries/buildings/load-buildings.ts`) trả về mảng rỗng và bộ chọn toà bị ẩn — không có dữ liệu giả. ST-07 chỉ cần thay thân hàm này bằng `GET /api/buildings`. Bộ chọn ẩn khi có dưới 2 toà; toà chọn gần nhất lưu ở `localStorage` (`stay_building_id`). Màn theo toà dùng `useBuilding().buildingId` trong query key để đổi toà thì tải lại.

## Kiểm thử

```bash
pnpm --filter @stay/web typecheck
pnpm --filter @stay/web build
pnpm lint
bash scripts/test-stay-web-e2e.sh   # cần STAY_DATABASE_* trỏ tới DB dùng thử + `pnpm --filter @stay/web exec playwright install chromium`
```

E2E (Playwright, Chromium, `e2e/`) build + migrate + seed + chạy `@stay/api`, build web, chạy `vite preview` rồi test: đăng nhập, reload giữ phiên (cookie HttpOnly, không token trong storage), URL bảo vệ → login → quay lại, lỗi field + lỗi chung khi sai mật khẩu, đăng xuất, mất phiên khi focus, ghi nhớ email, bottom nav ở 375px, bàn phím + focus, 404, banner mất mạng. Test bị skip thì script fail. CI: job `stay-web-e2e` (GitHub `web.yml`, GitLab `.gitlab-ci.yml`); ảnh `test-results/screenshots/*.png` luôn được upload.
