# `@p4/auth`

Auth provider cho p4 (extract từ `apps/web`, không dùng stub enterprise).

```tsx
import { AuthProvider, useAuth, AUTH_STORAGE_KEY, FAKE_AUTH } from '@p4/auth';
```

Fake login demo: `admin/admin`, `user/user`. Thay bằng `POST /api/auth/login` khi nối API thật.
