import {
  applyAuditPolicies,
  currentUser,
  InputValidError,
  queryText,
  type RouteAuditPolicies,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { INVOICE_KINDS, INVOICE_STATUSES, isPeriod } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import {
  readInvoiceIssueInput,
  readInvoiceLineInput,
  readInvoiceVoidInput,
  requiredIdempotencyKey,
  routePeriod,
} from './invoices.input.js';
import {
  addInvoiceLine,
  billingPreview,
  createDrafts,
  createMoveInInvoice,
  deleteInvoiceLine,
  getInvoice,
  type InvoiceListQuery,
  type InvoiceSortField,
  issueInvoices,
  listInvoices,
  voidInvoice,
} from './invoices.service.js';

const router = Router();
const sortFields: InvoiceSortField[] = [
  'createdAt',
  'period',
  'code',
  'total',
  'dueOn',
  'issuedOn',
];
const invoiceQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  rules: () => ({
    buildingId: uuidQueryRule,
    contractId: uuidQueryRule,
    roomId: uuidQueryRule,
    // Validated in normalize: validatorjs splits string rules on `|`, which breaks a regex rule.
    period: 'sometimes|required|string|max:7',
    kind: `sometimes|required|in:${INVOICE_KINDS.join(',')}`,
    status: `sometimes|required|in:${INVOICE_STATUSES.join(',')}`,
    overdue: 'sometimes|required|in:true,false',
  }),
  normalize: (query, base): InvoiceListQuery => {
    const overdue = queryText(query, 'overdue');
    const period = queryText(query, 'period');

    if (period !== undefined && !isPeriod(period))
      throw new InputValidError('input_valid_error', { period: ['Kỳ phải có dạng YYYY-MM.'] });
    return {
      ...base,
      buildingId: queryText(query, 'buildingId'),
      contractId: queryText(query, 'contractId'),
      roomId: queryText(query, 'roomId'),
      period,
      kind: INVOICE_KINDS.find((kind) => kind === queryText(query, 'kind')),
      status: INVOICE_STATUSES.find((status) => status === queryText(query, 'status')),
      overdue: overdue === undefined ? undefined : overdue === 'true',
    };
  },
});

router.get(
  '/buildings/:buildingId/billing/:period/preview',
  authRequired,
  requireScopedAbility('read', 'Invoice'),
  apiHandler((req) =>
    billingPreview(currentUser(req), uuidRouteId(req, 'buildingId'), routePeriod(req)),
  ),
);
router.post(
  '/buildings/:buildingId/billing/:period/drafts',
  authRequired,
  requireScopedAbility('create', 'Invoice'),
  apiHandler((req) =>
    createDrafts(
      currentUser(req),
      uuidRouteId(req, 'buildingId'),
      routePeriod(req),
      requiredIdempotencyKey(req),
    ),
  ),
);
router.get(
  '/invoices',
  authRequired,
  requireScopedAbility('read', 'Invoice'),
  invoiceQuery,
  listHandler((req, query: InvoiceListQuery) => listInvoices(currentUser(req), query)),
);
// Static path before `/invoices/:id` routes.
router.post(
  '/invoices/issue',
  authRequired,
  requireScopedAbility('issue', 'Invoice'),
  apiHandler((req) => issueInvoices(currentUser(req), readInvoiceIssueInput(formBody(req)).ids)),
);
router.get(
  '/invoices/:id',
  authRequired,
  requireScopedAbility('read', 'Invoice'),
  apiHandler((req) => getInvoice(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/invoices/:id/lines',
  authRequired,
  requireScopedAbility('update', 'Invoice'),
  apiHandler(
    (req) =>
      addInvoiceLine(currentUser(req), uuidRouteId(req), readInvoiceLineInput(formBody(req))),
    201,
  ),
);
router.delete(
  '/invoices/:id/lines/:lineId',
  authRequired,
  requireScopedAbility('update', 'Invoice'),
  apiHandler((req) =>
    deleteInvoiceLine(currentUser(req), uuidRouteId(req), uuidRouteId(req, 'lineId')),
  ),
);
router.post(
  '/invoices/:id/void',
  authRequired,
  requireScopedAbility('void', 'Invoice'),
  apiHandler((req) =>
    voidInvoice(currentUser(req), uuidRouteId(req), readInvoiceVoidInput(formBody(req))),
  ),
);
router.post(
  '/contracts/:id/move-in-invoice',
  authRequired,
  requireScopedAbility('create', 'Invoice'),
  apiHandler((req) => createMoveInInvoice(currentUser(req), uuidRouteId(req)), 201),
);

const auditPolicies = {
  'GET /buildings/:buildingId/billing/:period/preview': { action: 'read', resourceType: 'invoice' },
  'POST /buildings/:buildingId/billing/:period/drafts': {
    action: 'create',
    resourceType: 'invoice',
  },
  'GET /invoices': { action: 'read', resourceType: 'invoice' },
  'POST /invoices/issue': { action: 'publish', resourceType: 'invoice' },
  'GET /invoices/:id': { action: 'read', resourceType: 'invoice' },
  'POST /invoices/:id/lines': { action: 'update', resourceType: 'invoice' },
  'DELETE /invoices/:id/lines/:lineId': { action: 'update', resourceType: 'invoice' },
  'POST /invoices/:id/void': { action: 'cancel', resourceType: 'invoice' },
  'POST /contracts/:id/move-in-invoice': { action: 'create', resourceType: 'invoice' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
