import { applyAuditPolicies, type RouteAuditPolicies } from '@p4/server-core';
import { Router } from 'express';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { publicInvoice } from './invoices.share.js';

/** Requests per minute and client IP for public invoice links (token guessing protection). */
const PUBLIC_INVOICE_RATE_LIMIT = 60;

const router = Router();

// ST-16: no `authRequired` (works signed out, no cookie/origin check); read-only, rate limited.
router.get(
  '/public/invoices/:token',
  rateLimit('stay-public-invoice', PUBLIC_INVOICE_RATE_LIMIT),
  apiHandler((req) => publicInvoice(String(req.params.token ?? ''))),
);

const auditPolicies = {
  // `token` is not a resource id parameter: the token never reaches request audit context.
  'GET /public/invoices/:token': { action: 'read', resourceType: 'invoice_share' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
