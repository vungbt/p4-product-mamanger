import { applyAuditPolicies, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { apiHandler } from '@/shared/api-handler.js';
import { portalAuditPolicies } from './portal.audit.js';
import {
  portalContractView,
  portalInvoice,
  portalInvoices,
  portalMe,
  portalNotices,
  portalUsage,
} from './portal.service.js';
import {
  createPortalSession,
  deletePortalSession,
  lookupPortalLink,
  portalLookupIpLimit,
  portalOf,
  portalSessionIpLimit,
  portalSessionRequired,
  portalSessionTokenLimit,
} from './portal.session.js';

const router = Router();

// ST-25 tenant portal: never behind the staff `authRequired`. Public routes are rate limited;
// the others need the portal session cookie (`portalSessionRequired`), scoped to one contract.
router.post(
  '/portal/links/lookup',
  portalLookupIpLimit,
  apiHandler((req) => lookupPortalLink(req)),
);
router.post(
  '/portal/sessions',
  portalSessionIpLimit,
  portalSessionTokenLimit,
  apiHandler((req) => createPortalSession(req), 201),
);
router.delete(
  '/portal/sessions',
  portalSessionRequired,
  apiHandler((req) => deletePortalSession(req)),
);
router.get(
  '/portal/me',
  portalSessionRequired,
  apiHandler((req) => portalMe(portalOf(req))),
);
router.get(
  '/portal/invoices',
  portalSessionRequired,
  apiHandler((req) => portalInvoices(portalOf(req))),
);
router.get(
  '/portal/invoices/:id',
  portalSessionRequired,
  apiHandler((req) => portalInvoice(portalOf(req), uuidRouteId(req))),
);
router.get(
  '/portal/contract',
  portalSessionRequired,
  apiHandler((req) => portalContractView(portalOf(req))),
);
router.get(
  '/portal/usage',
  portalSessionRequired,
  apiHandler((req) => portalUsage(portalOf(req))),
);
router.get(
  '/portal/notices',
  portalSessionRequired,
  apiHandler((req) => portalNotices(portalOf(req))),
);

export default applyAuditPolicies(router, portalAuditPolicies);
