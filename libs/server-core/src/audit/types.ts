import type { JsonValue } from '@p4/shared';
import type { RequestHandler } from 'express';
import type { TransactionOptions } from 'sequelize';

export const AUDIT_ACTIONS = {
  read: { changesData: false },
  moderate: { changesData: true },
  ready: { changesData: true },
  dispatch: { changesData: true },
  pay: { changesData: true },
  refresh_session: { changesData: true },
  request_verification: { changesData: true },
  request_password_reset: { changesData: true },
  mark_read: { changesData: true },
  receipt: { changesData: true },
  accept: { changesData: true },
  reply: { changesData: true },
  process: { changesData: true },
  close: { changesData: true },
  assign: { changesData: true },
  collect_payment: { changesData: true },
  create: { changesData: true },
  update: { changesData: true },
  delete: { changesData: true },
  approve: { changesData: true },
  reject: { changesData: true },
  submit: { changesData: true },
  cancel: { changesData: true },
  confirm: { changesData: true },
  publish: { changesData: true },
  archive: { changesData: true },
  restore: { changesData: true },
  receive: { changesData: true },
  inspect: { changesData: true },
  complete: { changesData: true },
  pack: { changesData: true },
  handover: { changesData: true },
  deliver: { changesData: true },
  fail: { changesData: true },
  return: { changesData: true },
  lose: { changesData: true },
  refund: { changesData: true },
  reconcile: { changesData: true },
  retry: { changesData: true },
  import: { changesData: true },
  export: { changesData: true },
  merge: { changesData: true },
  adjust: { changesData: true },
  login: { changesData: true },
  logout: { changesData: true },
  verify: { changesData: true },
  reset_password: { changesData: true },
  change_password: { changesData: true },
  change_email: { changesData: true },
  revoke_session: { changesData: true },
};

export type AuditAction = keyof typeof AUDIT_ACTIONS;
export type RouteAuditPolicy = {
  action: AuditAction;
  resourceType: string;
  auditedHandler?: RequestHandler;
  transaction?: Pick<TransactionOptions, 'isolationLevel'>;
};
export type RouteAuditPolicies = Record<string, RouteAuditPolicy>;

export interface AuditInput {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: JsonValue;
  requestId?: string;
  reason?: string;
  source?: 'http' | 'worker' | 'auth' | 'system';
  outcome?: 'success' | 'failure';
}
