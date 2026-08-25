# @p4/web — Frontend (Học viên)

> **Structure expect** — bám pattern production repos của mentor.

## Reference repos

| Pattern | Repo |
|---------|------|
| Monorepo `apps/` + `libs/` | [smart-connection-monorepo](https://github.com/vungbt/smart-connection-monorepo) |
| Routing `config.route` + `master.route` | [base-react-antd](https://gitlab.com/vungbt1999/base-react-antd) |
| Menu submenu + protected | [cms-do-an](https://gitlab.com/vungbt1999/cms-do-an) |
| Icons `@p4/ui` | [enterprise-platform](https://github.com/vungbt/enterprise-platform) Lucide map |
| UI + auth libs | [enterprise-platform](https://github.com/vungbt/enterprise-platform) → `@p4/ui`, `@p4/auth` |

---

## Shared libs

```tsx
import { Button, Input } from '@p4/ui';
import { AuthProvider, useAuth } from '@p4/auth';
import { useApiQuery, productKeys, ApiQueryProvider } from '@p4/api-client';
```

- `@p4/ui` — Tailwind components (theme CSS đã import trong `main.tsx`)
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
├── services/api-service.ts
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
  iconName: 'frame',           // @p4/ui IconName
  existSubMenu: true,
  authority: ['admin'],        // portal/leaf — không set = public (shop/cart)
  loginPath: '/admin/login',
  routes: [
    { label: 'Danh sách', iconName: 'frame', ... },
    { label: 'Thêm mới', iconName: 'add', ... },
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
5. Icon mới → đăng ký alias trong `libs/ui/components/icons/index.tsx` (`@p4/ui`)
6. Hook gọi API chỉ đưa vào `src/hooks` khi thật sự được nhiều feature sử dụng

Khi một hook từ feature bắt đầu được feature thứ hai sử dụng, mới chuyển nó lên `src/hooks` và cập nhật import. Không đưa hook lên global trước chỉ vì có thể sẽ tái sử dụng.

---

## Không làm

- ❌ Sửa `apps/api/`
- ❌ Hardcode nav trong layout — dùng `Sidebar`/`Header` (`@p4/ui`) + `RouteConfigs` (map `RouteConfigs` → props của module, xem `modules/*/layout/sidebar.tsx`)
- ❌ Tách routing thành nhiều file rời (page-suspense, lazy-pages riêng…)

Xem [GETTING-STARTED.md](../../GETTING-STARTED.md) · API: [../api/README.md](../api/README.md)
