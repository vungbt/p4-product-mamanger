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
import { isIsoDate, PAYMENT_METHODS } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { requiredIdempotencyKey } from '../invoices/invoices.input.js';
import { readPaymentInput, readPaymentReverseInput } from './payments.input.js';
import {
  listPayments,
  type PaymentListQuery,
  type PaymentSortField,
  recordPayment,
  reversePayment,
} from './payments.service.js';

const router = Router();
const sortFields: PaymentSortField[] = ['paidOn', 'amount', 'createdAt'];
const paymentQuery = validateListQuery({
  sortFields,
  defaultSort: 'paidOn',
  defaultOrder: 'desc',
  rules: () => ({
    buildingId: uuidQueryRule,
    invoiceId: uuidQueryRule,
    method: `sometimes|required|in:${PAYMENT_METHODS.join(',')}`,
    // Dates are checked in normalize (YYYY-MM-DD, from ≤ to).
    dateFrom: 'sometimes|required|string|max:10',
    dateTo: 'sometimes|required|string|max:10',
    includeReversed: 'sometimes|required|in:true,false',
  }),
  normalize: (query, base): PaymentListQuery => {
    const dateFrom = queryText(query, 'dateFrom');
    const dateTo = queryText(query, 'dateTo');
    const errors: Record<string, string[]> = {};

    if (dateFrom !== undefined && !isIsoDate(dateFrom))
      errors.dateFrom = ['Ngày phải có dạng YYYY-MM-DD.'];
    if (dateTo !== undefined && !isIsoDate(dateTo))
      errors.dateTo = ['Ngày phải có dạng YYYY-MM-DD.'];
    if (!errors.dateFrom && !errors.dateTo && dateFrom && dateTo && dateFrom > dateTo)
      errors.dateTo = ['Đến ngày phải bằng hoặc sau từ ngày.'];
    if (Object.keys(errors).length) throw new InputValidError('input_valid_error', errors);
    return {
      ...base,
      buildingId: queryText(query, 'buildingId'),
      invoiceId: queryText(query, 'invoiceId'),
      method: PAYMENT_METHODS.find((method) => method === queryText(query, 'method')),
      dateFrom,
      dateTo,
      includeReversed: queryText(query, 'includeReversed') === 'true',
    };
  },
});

router.get(
  '/payments',
  authRequired,
  requireScopedAbility('read', 'Payment'),
  paymentQuery,
  listHandler((req, query: PaymentListQuery) => listPayments(currentUser(req), query)),
);
router.post(
  '/invoices/:id/payments',
  authRequired,
  requireScopedAbility('create', 'Payment'),
  apiHandler(
    (req) =>
      recordPayment(
        currentUser(req),
        uuidRouteId(req),
        readPaymentInput(formBody(req)),
        requiredIdempotencyKey(req),
      ),
    201,
  ),
);
// Reversal is a money correction like an invoice void: `void Payment` (owner by default).
router.post(
  '/payments/:id/reverse',
  authRequired,
  requireScopedAbility('void', 'Payment'),
  apiHandler((req) =>
    reversePayment(currentUser(req), uuidRouteId(req), readPaymentReverseInput(formBody(req))),
  ),
);

const auditPolicies = {
  'GET /payments': { action: 'read', resourceType: 'payment' },
  'POST /invoices/:id/payments': { action: 'collect_payment', resourceType: 'payment' },
  'POST /payments/:id/reverse': { action: 'cancel', resourceType: 'payment' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
