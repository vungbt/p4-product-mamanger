# `@p4/auth`

Auth provider cho p4.

```tsx
import { refreshAuthSession, revokeAuthSession } from '@p4/api-client';
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
  onRefresh={refreshAuthSession}
  onLogout={revokeAuthSession}
>
  {children}
</AuthProvider>
```

Password login dùng **email** (khớp API). Portal check: admin chỉ `role=admin`, storefront chỉ `role=user`.

Provider chủ động refresh trước khi access token hết hạn 60 giây và kiểm tra lại khi tab được focus/visible. Interceptor 401 vẫn là fallback; mọi nguồn refresh dùng chung một request đang chạy. Session mới hoặc trạng thái logout được đồng bộ ngay giữa API client và React context.

Seed demo API:
- `admin@demo.com` / `admin123`
- `user@demo.com` / `user123`
