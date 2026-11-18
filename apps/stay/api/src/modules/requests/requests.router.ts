import {
  applyAuditPolicies,
  currentUser,
  queryText,
  type RouteAuditPolicies,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { INBOX_KINDS, INBOX_STATUSES } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import {
  acceptRequest,
  confirmClaim,
  type InboxListQuery,
  type InboxSortField,
  listInbox,
  rejectClaim,
  rejectRequest,
  replyRequest,
} from './requests.inbox.js';
import {
  readAcceptInput,
  readClaimConfirmInput,
  readRejectInput,
  readReplyInput,
} from './requests.input.js';

const router = Router();
const sortFields: InboxSortField[] = ['createdAt'];
const inboxQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    buildingId: uuidQueryRule,
    contractId: uuidQueryRule,
    kind: `sometimes|required|in:${INBOX_KINDS.join(',')}`,
    status: `sometimes|required|in:${INBOX_STATUSES.join(',')}`,
  }),
  normalize: (query, base): InboxListQuery => ({
    ...base,
    buildingId: queryText(query, 'buildingId'),
    contractId: queryText(query, 'contractId'),
    kind: INBOX_KINDS.find((kind) => kind === queryText(query, 'kind')),
    status: INBOX_STATUSES.find((status) => status === queryText(query, 'status')),
  }),
});

// O-26 inbox. Maintenance reports and requests: `Maintenance` (managers in assigned buildings);
// payment claims: `Payment` (`create`, as recording a payment). Out of scope → 404.
router.get(
  '/requests',
  authRequired,
  requireScopedAbility('read', 'Maintenance'),
  inboxQuery,
  listHandler((req, query: InboxListQuery) => listInbox(currentUser(req), query)),
);
router.post(
  '/requests/:id/accept',
  authRequired,
  requireScopedAbility('update', 'Maintenance'),
  apiHandler((req) =>
    acceptRequest(currentUser(req), uuidRouteId(req), readAcceptInput(formBody(req))),
  ),
);
router.post(
  '/requests/:id/reject',
  authRequired,
  requireScopedAbility('update', 'Maintenance'),
  apiHandler((req) =>
    rejectRequest(currentUser(req), uuidRouteId(req), readRejectInput(formBody(req))),
  ),
);
router.post(
  '/requests/:id/reply',
  authRequired,
  requireScopedAbility('update', 'Maintenance'),
  apiHandler((req) =>
    replyRequest(currentUser(req), uuidRouteId(req), readReplyInput(formBody(req))),
  ),
);
router.post(
  '/payment-claims/:id/confirm',
  authRequired,
  requireScopedAbility('create', 'Payment'),
  apiHandler((req) =>
    confirmClaim(currentUser(req), uuidRouteId(req), readClaimConfirmInput(formBody(req))),
  ),
);
router.post(
  '/payment-claims/:id/reject',
  authRequired,
  requireScopedAbility('create', 'Payment'),
  apiHandler((req) =>
    rejectClaim(currentUser(req), uuidRouteId(req), readRejectInput(formBody(req))),
  ),
);

/** Reads record nothing; every write records `<kind>.<action>` rows with ids and statuses only. */
const auditPolicies = {
  'GET /requests': { action: 'read', resourceType: 'request' },
  'POST /requests/:id/accept': { action: 'accept', resourceType: 'request' },
  'POST /requests/:id/reject': { action: 'reject', resourceType: 'request' },
  'POST /requests/:id/reply': { action: 'reply', resourceType: 'request' },
  'POST /payment-claims/:id/confirm': { action: 'confirm', resourceType: 'payment_claim' },
  'POST /payment-claims/:id/reject': { action: 'reject', resourceType: 'payment_claim' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
