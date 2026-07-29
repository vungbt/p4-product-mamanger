# @p4/web — Frontend (Học viên)

> **Structure expect** — bám pattern production repos của mentor.

## Reference repos

| Pattern | Repo |
|---------|------|
| Monorepo `apps/` + `libs/` | [smart-connection-monorepo](https://github.com/vungbt/smart-connection-monorepo) |
| Routing `config.route` + `master.route` | [base-react-antd](https://gitlab.com/vungbt1999/base-react-antd) |
| Menu submenu + protected | [cms-do-an](https://gitlab.com/vungbt1999/cms-do-an) |
| Icons `libraries/icons/` | [finder-work-web](https://github.com/vungbt/finder-work-web/tree/develop/src/libraries/icons) |

---

## Cấu trúc `apps/web/src/` (expect)

```
src/
├── app.tsx
├── main.tsx
├── constants/constants.ts
├── types/types.ts              ← re-export @p4/shared
├── contexts/auth-context.tsx
├── hooks/
│   ├── use-auth.ts
│   ├── use-cart.ts
│   └── use-products.ts
├── services/api-service.ts
├── routing/                    ← KHÔNG dùng folder routes/ rải file
│   ├── route.types.ts          # IRoute: authority, existSubMenu, iconName…
│   ├── config.route.tsx        # RouteConfigs — 1 nguồn route + menu
│   ├── master.route.tsx        # render IRoute → React Router v7
│   ├── route-guards.tsx        # ProtectedRoute + GuestRoute
│   └── routes/
│       ├── admin.routes.tsx    # export IRoute[] admin portal
│       └── storefront.routes.tsx
├── libraries/
│   ├── icons/                  # 1 icon = 1 file kebab-case
│   │   ├── index.tsx           # RenderIcon, IconName, Icons
│   │   ├── graph.tsx
│   │   └── ...
│   └── menu/
│       └── menu.layout.tsx     # menu + submenu từ RouteConfigs
├── modules/
│   ├── admin/
│   │   ├── admin-layout.tsx
│   │   ├── admin-login-page.tsx
│   │   ├── admin-dashboard-page.tsx
│   │   └── ...
│   └── storefront/
│       ├── storefront-layout.tsx
│       └── ...
└── styles/global.scss
```

---

## Naming convention

- **Kebab-case** mọi file/folder: `admin-login-page.tsx`, `use-auth.ts`
- **Module pages:** `{feature}-page.tsx` hoặc sau này `{feature}.screen.tsx` khi mentor chuẩn hóa tiếp
- **Import alias:** `@/constants/constants`, `@/types/types`, `@/hooks/use-auth`

---

## IRoute — protected + submenu + icon

```typescript
{
  path: ROUTES.admin.products,
  name: 'admin-products',
  label: 'Products',
  iconName: 'frame',           // libraries/icons
  existSubMenu: true,
  authority: ['admin'],        // portal level — master.route + route-guards
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

1. Page → `modules/{portal}/{name}-page.tsx`
2. Route → `routing/routes/{portal}.routes.tsx` (IRoute)
3. Menu tự sync nếu có `label` + không `hideInMenu`
4. Icon mới → copy vào `libraries/icons/` + đăng ký `index.tsx`
5. API call → `services/api-service.ts` + hook tương ứng

---

## Không làm

- ❌ Sửa `apps/api/`
- ❌ Hardcode nav trong layout — dùng `MenuLayout` + `RouteConfigs`
- ❌ Tách routing thành nhiều file rời (page-suspense, lazy-pages riêng…)

Xem [GETTING-STARTED.md](../../GETTING-STARTED.md) · API: [../api/README.md](../api/README.md)
