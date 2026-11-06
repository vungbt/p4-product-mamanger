import { AsyncLocalStorage } from 'node:async_hooks';
import type { User } from '@p4/shared';
import type { AuditRouteContext } from './audit/context.js';
import type { AuditAction } from './audit/types.js';

export interface RequestContext {
  requestId: string;
  correlationId?: string;
  user?: User;
  actorId?: string;
  authAction?: AuditAction;
  source?: 'http' | 'worker' | 'auth';
  audit?: AuditRouteContext;
  route?: string;
}

export const requestStore = new AsyncLocalStorage<RequestContext>();
