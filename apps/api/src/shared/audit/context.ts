import { AsyncLocalStorage } from 'node:async_hooks';
import type { JsonValue } from '@p4/shared';
import type { Transaction, TransactionOptions } from 'sequelize';
import type { RouteAuditPolicy } from './types.js';

export interface AuditScope {
  transaction: Transaction;
  resources: Set<string>;
  replayed: boolean;
  facts?: JsonValue;
  isolationLevel?: TransactionOptions['isolationLevel'];
}

export const auditScope = new AsyncLocalStorage<AuditScope>();

export interface AuditRouteContext extends RouteAuditPolicy {
  resourceId?: string;
}
