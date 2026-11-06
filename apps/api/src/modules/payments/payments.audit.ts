import type { RouteAuditPolicies } from '@/shared/audit/types.js';
import * as paymentsController from './payments.controller.js';

export const auditPolicies = {
  'POST /:id/mock-pay': {
    auditedHandler: paymentsController.mockPay,
    action: 'pay',
    resourceType: 'payment_attempt',
  },
} satisfies RouteAuditPolicies;
