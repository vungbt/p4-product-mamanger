# @p4/web — Frontend (Học viên)

> **Structure expect** — bám pattern production repos của mentor.

## Reference repos

| Pattern | Repo |
|---------|------|
| Monorepo `apps/` + `libs/` | [smart-connection-monorepo](https://github.com/vungbt/smart-connection-monorepo) |
| Routing `config.route` + `master.route` | [base-react-antd](https://gitlab.com/vungbt1999/base-react-antd) |
| Menu submenu + protected | [cms-do-an](https://gitlab.com/vungbt1999/cms-do-an) |
| Icons `@itclabs/react-ui` | [React UI](https://react-ui-one-rose.vercel.app/) semantic icon names |
| UI + auth libs | npm `@itclabs/react-ui` + workspace → `@itclabs/react-ui`, `@p4/auth` |

---

## Shared libs

```tsx
import { Button, Input } from '@itclabs/react-ui';
import { AuthProvider, useAuth } from '@p4/auth';
import { useApiQuery, productKeys, ApiQueryProvider } from '@p4/api-client';
```

- `@itclabs/react-ui` — Tailwind CSS 4 components (kit CSS import trong `styles/tailwind.css`)
- `@p4/auth` — `AuthProvider` / `useAuth` (hooks/contexts trong web chỉ re-export)
- `@p4/api-client` — Axios + TanStack Query (`ApiQueryProvider` trong `app.tsx`)
- SCSS Modules vẫn dùng được song song Tailwind
- **i18n:** `react-i18next` — locales `src/i18n/locales/{vi,en}/common.json`, mặc định `vi`, switcher trên layout/login

```tsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
t('auth.loginSuccess');
```

---

## Cấu trúc `apps/web/src/` (expect)

```
src/
├── app.tsx
├── main.tsx
├── constants/constants.ts
├── types/types.ts              ← re-export @p4/shared
├── contexts/auth-context.tsx   ← re-export @p4/auth
├── hooks/
│   ├── use-auth.ts             ← re-export @p4/auth
│   └── use-products.ts         ← dùng chung storefront + admin
├── services/
│   ├── api-service.ts
│   └── category-service.ts      ← HTTP API danh mục, dùng chung giữa các feature
├── routing/                    ← KHÔNG dùng folder routes/ rải file
│   ├── route.types.ts          # IRoute: authority, existSubMenu, iconName…
│   ├── config.route.tsx        # RouteConfigs — 1 nguồn route + menu
│   ├── master.route.tsx        # render IRoute → React Router v7
│   ├── route-guards.tsx        # ProtectedRoute + GuestRoute
│   └── routes/
│       ├── admin.routes.tsx    # export IRoute[] admin portal
│       └── storefront.routes.tsx
├── i18n/
│   ├── index.ts
│   └── locales/{vi,en}/common.json
├── libraries/
│   ├── language-switcher.tsx
│   ├── user-account-menu.tsx
│   └── brand-logo.tsx
├── modules/
│   ├── admin/
│   │   ├── layout/             # layout.tsx, header.tsx, sidebar.tsx, use-admin-breadcrumbs.ts
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── products/page.tsx
│   │   └── orders/page.tsx
│   └── storefront/
│       ├── layout/             # layout.tsx, header.tsx, footer.tsx
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── password/page.tsx
│       ├── home/page.tsx       # route `/` — tách riêng khỏi shop
│       ├── shop/page.tsx       # route `/shop`
│       └── cart/
│           ├── page.tsx
│           └── use-cart.ts     # chỉ cart dùng nên đặt cạnh page
├── styles/
│   ├── global.scss
│   └── tailwind.css
```

---

## Naming convention

- **Kebab-case** mọi file/folder: `order-detail`, `use-cart.ts`
- **Module pages:** `modules/{portal}/{feature}/page.tsx`
- Hook/component chỉ dùng trong một feature phải đặt cạnh `page.tsx`
- `src/hooks` chỉ chứa hook dùng chung từ hai feature/portal trở lên
- **Import alias:** `@/constants/constants`, `@/types/types`, `@/hooks/use-auth`

Ví dụ feature có logic riêng:

```text
modules/storefront/cart/
├── page.tsx              # route entry của feature
├── use-cart.ts           # state/hook chỉ cart sử dụng
├── cart-item.tsx         # component chỉ cart sử dụng
└── cart.types.ts         # type nội bộ nếu cần
```

Không tạo barrel `index.ts` chỉ để re-export page. Route lazy-import trực tiếp `.../{feature}/page` để dependency rõ ràng và giữ code splitting theo page.

---

## IRoute — protected + submenu + icon

```typescript
{
  path: ROUTES.admin.products,
  name: 'admin-products',
  label: 'Products',
  iconName: 'grid',           // @itclabs/react-ui IconName
  existSubMenu: true,
  authority: ['admin'],        // portal/leaf — không set = public (shop/cart)
  loginPath: '/admin/login',
  routes: [
    { label: 'Danh sách', iconName: 'grid', ... },
    { label: 'Thêm mới', iconName: 'plus', ... },
    { hideInMenu: true, ... }, // edit — không hiện menu
  ],
}
```

Login page: `guestOnly` + `guestAuthority` + `guestRedirect`.

---

## Thêm feature mới (checklist)

1. Page → `modules/{portal}/{feature}/page.tsx`
2. Hook/component riêng → đặt trong cùng feature folder
3. Route → `routing/routes/{portal}.routes.tsx` (IRoute)
4. Menu tự sync nếu có `label` + không `hideInMenu`
5. Icon mới → thêm named glyph import và đăng ký trong `src/libraries/ui-theme.ts`
6. Hook gọi API chỉ đưa vào `src/hooks` khi thật sự được nhiều feature sử dụng

Khi một hook từ feature bắt đầu được feature thứ hai sử dụng, mới chuyển nó lên `src/hooks` và cập nhật import. Không đưa hook lên global trước chỉ vì có thể sẽ tái sử dụng.

---

## Không làm

- ❌ Sửa `apps/api/`
- ❌ Hardcode nav trong layout — dùng `Sidebar`/`Navbar` (`@itclabs/react-ui`) + `RouteConfigs` (map `RouteConfigs` → props của module, xem `modules/*/layout/sidebar.tsx`)
- ❌ Tách routing thành nhiều file rời (page-suspense, lazy-pages riêng…)

Xem [GETTING-STARTED.md](../../GETTING-STARTED.md) · API: [../api/README.md](../api/README.md)

### UI integration

`app.tsx` cấu hình `UIProvider` (`link`, `image`, locale) và `ToastProvider`.
Import `toast` từ `@itclabs/react-ui/toast`; dùng `toast.success/error/info`.
Import `* as v` từ `valibot` cho form schema. `FormField` tự bind controls;
`Button type="submit"` nhận trạng thái submit từ `Form`. Button variants:
`primary`, `secondary`, `ghost`, `danger`; sizes: `sm`, `md`, `lg`.

Theme P4 Ember (cam + xanh xám nhạt) được map sang semantic tokens trong `styles/p4-theme.css`, import sau kit CSS trên `:root` để bao gồm portal.
Giữ typography Be Vietnam Pro, kích thước, khoảng cách và cấu trúc component của lib. Không phục hồi font/typography hoặc dark mode cũ.
Admin dùng `WorkspaceShell` inset mặc định; nút thu gọn do `Sidebar` cung cấp.

Sidebar items đặt trong entry `type: 'group'` theo mẫu Storybook: khoảng cách giữa
các group khác khoảng cách giữa item trong group. Không đưa từng link lên cấp group.
Menu tài khoản dùng module `UserMenu` của lib; wrapper ứng dụng chỉ nối user/actions.
Ở sidebar, dùng classNames theo mẫu Sidebar/RailExample để ẩn details khi collapsed.

Các block nghiệp vụ dùng `@p4/blocks`: ProductCard, OrderSummaryCard, StatCard…
Xem [danh sách và cách dùng](../../libs/blocks/README.md). `styles/tailwind.css` đã import
`@p4/blocks/styles.css`; i18n đã đăng ký namespace `blocks` cho vi/en.
Button, Input, Avatar, Rating, Progress và control chung vẫn import trực tiếp từ kit.

Theme hiện tại: [P4 Ember](../../docs/design/p4-theme.md). Header ứng dụng dùng
`bg-surface`; DataTable dùng `classNames.thead: 'bg-table-header text-ink'` để tách
header bảng khỏi canvas. Sidebar dùng variant `bar` có sẵn của kit.

### Danh mục sản phẩm — API

`modules/admin/categories` dùng `Category` / `CategoryInput` từ `@p4/shared`.
`src/services/category-service.ts` gọi `/categories` qua `axiosClient`; hook dùng TanStack Query và
`categoryKeys` của `@p4/api-client`, invalidate danh sách/chi tiết sau mutation.
GET danh sách và chi tiết; POST thêm, PUT sửa, DELETE xóa (admin token theo client chung).

API hiện trả `id`, `name`, `slug`, `description`; không có `visible` hay số sản phẩm.
UI dùng đúng các trường này, lọc mô tả/tìm kiếm/sắp xếp/phân trang phía client;
API đang deploy trả cả danh sách. Backend local đã bổ sung query sort/filter/phân trang
và metadata (xem `apps/api/README.md`); chưa deploy. Chỉ chuyển DataTable sang
server mode sau khi endpoint đích hỗ trợ contract mới.
Mặc định 10 dòng/trang; các lựa chọn 10/20/50. Thêm/sửa/xóa lưu thật vào API.

Search danh mục dùng `useDebouncedCallback` của kit (300ms), ô nhập cập nhật ngay.
Xóa search/reset hủy callback đang chờ; Select lọc mô tả dùng `clearable` với giá trị
`null` khi không lọc. Đây là lọc phía client, không gửi request tìm kiếm theo từng ký tự.


### Cấu trúc feature danh mục

```text
modules/admin/categories/
├── page.tsx                    # Render UI và gọi hook, entry cho route
├── components/                 # Form và dialog chi tiết
└── hooks/                      # State, debounce, validation, query/mutation, handlers
```

Component chỉ render và gọi handler từ hooks. Service HTTP đặt tại `src/services`
để tái sử dụng giữa các feature. Component và hook riêng của category giữ trong feature này; không đưa vào `src/hooks` hay `src/libraries` toàn ứng dụng.

Props/type riêng của component khai báo cạnh component; hook import type khi dùng chung.

Lỗi validation API trả `{ message, code: 'input_valid_error', extensions: { field: string[] } }`.
Client giữ envelope lỗi trong `error.data`; hook editor map `name`/`slug`/`description`
vào `onServer` error của FormField, xóa lỗi field khi chỉnh giá trị. Lỗi chung hoặc
field không nhận diện vẫn hiện Alert. API local map lỗi unique slug của Sequelize
sang HTTP 400, `code: 'input_valid_error'`, `extensions.slug` với thông báo theo locale;
form hiển thị lỗi ngay tại Slug. Cần deploy BE để môi trường remote có hành vi này.
