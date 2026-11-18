import { AsyncLocalStorage } from 'node:async_hooks';
import type { AuditRouteContext } from './audit/context.js';
import type { AuditAction } from './audit/types.js';
import './express.js';

/** Per-request (or per-job) context read by audit, logging and the outbox. */
export interface RequestContext {
  requestId: string;
  correlationId?: string;
  user?: Express.User;
  actorId?: string;
  authAction?: AuditAction;
  source?: 'http' | 'worker' | 'auth';
  audit?: AuditRouteContext;
  route?: string;
}

export const requestStore = new AsyncLocalStorage<RequestContext>();
