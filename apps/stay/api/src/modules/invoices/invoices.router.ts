import { applyAuditPolicies, currentUser, InputValidError, queryText, type RouteAuditPolicies, uuidQueryRule, uuidRouteId, validateListQuery } from '@p4/server-core';
import { isPeriod, INVOICE_KINDS, INVOICE_STATUSES } from '@stay/shared';
import { Router, type Request } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { billingPreview, changeManualLine, createDrafts, createMoveInDraft, getInvoice, issueInvoices, listInvoices, voidInvoice, type InvoiceListQuery } from './invoices.service.js';

const router = Router();
const period = (req: Request) => {
  const value = req.params.period;
  if (!isPeriod(value)) throw new InputValidError('input_valid_error', { period: ['Kỳ phải có dạng YYYY-MM.'] });
  return value;
};
const invoiceQuery = validateListQuery({
  sortFields: ['createdAt', 'period', 'code', 'total', 'dueOn'] as const,
  defaultSort: 'createdAt',
  rules: () => ({ buildingId: uuidQueryRule, roomId: uuidQueryRule, contractId: uuidQueryRule,
    period: 'sometimes|required|regex:/^[0-9]{4}-(0[1-9]|1[0-2])$/', kind: `sometimes|required|in:${INVOICE_KINDS.join(',')}`, status: `sometimes|required|in:${INVOICE_STATUSES.join(',')}`, overdue: 'sometimes|in:true,false' }),
  normalize: (query, base): InvoiceListQuery => ({ ...base, buildingId: queryText(query, 'buildingId'), roomId: queryText(query, 'roomId'), contractId: queryText(query, 'contractId'), period: queryText(query, 'period'), kind: INVOICE_KINDS.find(v => v === queryText(query, 'kind')), status: INVOICE_STATUSES.find(v => v === queryText(query, 'status')), overdue: queryText(query, 'overdue') === 'true' }),
});
router.get('/buildings/:buildingId/billing/:period/preview', authRequired, requireScopedAbility('read', 'Invoice'), apiHandler(req => billingPreview(currentUser(req), uuidRouteId(req, 'buildingId'), period(req))));
router.post('/buildings/:buildingId/billing/:period/drafts', authRequired, requireScopedAbility('create', 'Invoice'), apiHandler(req => {
  const key = req.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 128) throw new InputValidError('input_valid_error', { idempotencyKey: ['Idempotency-Key bắt buộc, 8–128 ký tự.'] });
  return createDrafts(currentUser(req), uuidRouteId(req, 'buildingId'), period(req), key);
}));
router.get('/invoices', authRequired, requireScopedAbility('read', 'Invoice'), invoiceQuery, listHandler((req, query: InvoiceListQuery) => listInvoices(currentUser(req), query)));
router.get('/invoices/:id', authRequired, requireScopedAbility('read', 'Invoice'), apiHandler(req => getInvoice(currentUser(req), uuidRouteId(req))));
router.post('/contracts/:id/move-in-invoice', authRequired, requireScopedAbility('create', 'Invoice'), apiHandler(req => createMoveInDraft(currentUser(req), uuidRouteId(req)), 201));
router.post('/invoices/:id/lines', authRequired, requireScopedAbility('update', 'Invoice'), apiHandler(req => {
  const body = formBody(req);
  const input = { type: body.enum('type', ['surcharge', 'discount']), description: body.text('description', 255), amount: body.integer('amount', 1, Number.MAX_SAFE_INTEGER), reason: body.text('reason', 2000) };
  body.assertValid();
  return changeManualLine(currentUser(req), uuidRouteId(req), input);
}));
router.delete('/invoices/:id/lines/:lineId', authRequired, requireScopedAbility('delete', 'Invoice'), apiHandler(req => changeManualLine(currentUser(req), uuidRouteId(req), undefined, uuidRouteId(req, 'lineId'))));
router.post('/invoices/issue', authRequired, requireScopedAbility('issue', 'Invoice'), apiHandler(req => {
  const body = formBody(req);
  const ids = body.strings('ids', 400, 36);
  body.check('ids', ids.length > 0 && Array.isArray(body.data.ids) && ids.length === body.data.ids.length && ids.every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)));
  body.assertValid();
  return issueInvoices(currentUser(req), ids);
}));
router.post('/invoices/:id/void', authRequired, requireScopedAbility('void', 'Invoice'), apiHandler(req => {
  const body = formBody(req);
  const reason = body.text('reason', 2000);
  body.assertValid();
  return voidInvoice(currentUser(req), uuidRouteId(req), reason);
}));
const auditPolicies = {
  'GET /buildings/:buildingId/billing/:period/preview': { action: 'read', resourceType: 'invoice' },
  'POST /buildings/:buildingId/billing/:period/drafts': { action: 'create', resourceType: 'invoice' },
  'GET /invoices': { action: 'read', resourceType: 'invoice' },
  'GET /invoices/:id': { action: 'read', resourceType: 'invoice' },
  'POST /contracts/:id/move-in-invoice': { action: 'create', resourceType: 'invoice' },
  'POST /invoices/:id/lines': { action: 'update', resourceType: 'invoice' },
  'DELETE /invoices/:id/lines/:lineId': { action: 'delete', resourceType: 'invoice' },
  'POST /invoices/issue': { action: 'publish', resourceType: 'invoice' },
  'POST /invoices/:id/void': { action: 'update', resourceType: 'invoice' },
} satisfies RouteAuditPolicies;
export default applyAuditPolicies(router, auditPolicies);
