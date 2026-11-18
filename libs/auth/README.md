# `@p4/auth`

React auth context for the P4 web app. Better Auth owns the session (HttpOnly cookie); this package only mirrors the current user in memory for the UI.

```tsx
import {
  loginAuthSession,
  loginGoogleAuthSession,
  refreshAuthSession,
  revokeAuthSession,
} from '@p4/api-client';
import { AuthProvider, useAuth } from '@p4/auth';

<AuthProvider
  onLogin={loginAuthSession}
  onGoogleLogin={loginGoogleAuthSession}
  onRefresh={refreshAuthSession}
  onLogout={revokeAuthSession}
>
  {children}
</AuthProvider>
```

- Sessions live in memory only (`session-store.ts`). Never write tokens to `localStorage`; `clearAuthSession` removes keys left by releases before Better Auth.
- Password login uses **email**. Portal check: admin requires `role=admin`, storefront requires `role=user`.
- The provider restores the cookie session on mount, on focus, every 5 minutes and when another tab signs in or out (`BroadcastChannel`).
- Use `@p4/ability/browser` for permissions; `useAuth` only reports the role.

Demo accounts come from the API seeders (`apps/api/src/sequelize/seeders`).
