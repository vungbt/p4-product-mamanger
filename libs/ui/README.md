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

## Phase 2

`layout/` (DashboardLayout / Sidebar / Header) was **not** ported — it depends on Next.js + next-auth. Keep p4 `MenuLayout` until adapted to React Router.
