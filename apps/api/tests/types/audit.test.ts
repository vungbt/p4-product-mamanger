import type { AuditAction, RouteAuditPolicy } from '../../src/shared/audit/types.js';

const update: AuditAction = 'update';
const policy: RouteAuditPolicy = { action: update, resourceType: 'category' };
void policy;

// @ts-expect-error Broad mutation labels must be replaced with an explicit action.
const mutation: AuditAction = 'mutation';
void mutation;

// @ts-expect-error Misspelled actions must be rejected.
const misspelled: RouteAuditPolicy = { action: 'udpate', resourceType: 'category' };
void misspelled;
