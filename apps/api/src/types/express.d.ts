import type { User as P4User } from '@p4/shared';

// `req.user`, `req.requestId` and `res.jsonApi` are declared by @p4/server-core.
declare global {
  namespace Express {
    interface User extends P4User {}
  }
}

export type { JsonApiBody } from '@p4/server-core';
export type { PaginationMeta } from '@p4/shared';
