# `@p4/ui`

Shared UI components ported from [enterprise-platform](https://github.com/vungbt/enterprise-platform) (`libs/ui`).

## Usage

```tsx
import { Button, Input } from '@p4/ui';
```

Theme CSS (import once in `apps/web`):

```ts
import '@p4/ui/theme/tokens.css';
import '@p4/ui/theme/themes.css';
```

Tailwind preset: `@p4/ui/tailwind.preset` (wired in `apps/web/tailwind.config.js`).

## Layout modules

`modules/header`, `modules/admin-header`, `modules/sidebar`, `modules/footer` are ported and React-Router-agnostic — they take `href`/`onClick`/`active` on each nav item instead of routing directly, so `apps/web` maps its own `RouteConfigs` (react-router-dom) into those props (see `apps/web/src/modules/*/layout/sidebar.tsx`). `Sidebar` supports nested submenus (`SidebarNavItem.children`) and a `collapsed` icon-only mode.

The old p4 `MenuLayout` (`apps/web/src/libraries/menu/menu.layout.tsx`) has been fully replaced by `Sidebar` and removed — don't reintroduce it.
