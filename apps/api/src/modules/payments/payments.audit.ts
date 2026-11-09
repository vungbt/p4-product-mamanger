import type { RouteAuditPolicies } from '@p4/server-core';
import * as paymentsController from './payments.controller.js';

export const auditPolicies = {
  'POST /:id/mock-pay': {
    auditedHandler: paymentsController.mockPay,
    action: 'pay',
    resourceType: 'payment_attempt',
  },
} satisfies RouteAuditPolicies;
