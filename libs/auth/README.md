# `@p4/auth`

Auth provider cho p4.

```tsx
import { AuthProvider, useAuth, AUTH_STORAGE_KEY } from '@p4/auth';

<AuthProvider
  onLogin={async (email, password) => {
    // POST /api/auth/login → { token, refreshToken, user }
    return session;
  }}
  onGoogleLogin={async (credential) => {
    // POST /api/auth/google
    return session;
  }}
>
  {children}
</AuthProvider>
```

Password login dùng **email** (khớp API). Portal check: admin chỉ `role=admin`, storefront chỉ `role=user`.

Seed demo API:
- `admin@demo.com` / `admin123`
- `user@demo.com` / `user123`
