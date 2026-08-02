# @p4/shared

Types dùng chung giữa `apps/api` và `apps/web`.

```typescript
import type {
  Product,
  User,
  Order,
  ApiSuccess,
  ApiPaginatedSuccess,
  PaginationMeta,
} from '@p4/shared';
```

API response: `ApiSuccess<T>` / `ApiPaginatedSuccess<T>` — xem `apps/api/README.md`.
