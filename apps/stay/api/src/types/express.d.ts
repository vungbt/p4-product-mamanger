import type { StayUser } from '@stay/shared';

// `req.user`, `req.requestId` and `res.jsonApi` are declared by @p4/server-core.
declare global {
  namespace Express {
    interface User extends StayUser {}
  }
}
