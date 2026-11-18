import { applyAuditPolicies, uuidRouteId } from '@p4/server-core';
import { PORTAL_DAILY_SUBMISSIONS, PORTAL_UPLOAD_PURPOSES } from '@stay/shared';
import { Router } from 'express';
import { apiHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import {
  optionalIdempotencyKey,
  readMaintenanceInput,
  readPaymentClaimInput,
  readTenantRequestInput,
} from '../requests/requests.input.js';
import {
  cancelPaymentClaim,
  cancelPortalMaintenance,
  cancelPortalRequest,
  createPaymentClaim,
  createPortalMaintenance,
  createPortalRequest,
  listPortalMaintenance,
  listPortalRequests,
} from '../requests/requests.portal.js';
import { completePortalUpload, createPortalUpload } from '../uploads/uploads.service.js';
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
  portalContractLimit,
  portalLookupIpLimit,
  portalOf,
  portalSessionIpLimit,
  portalSessionRequired,
  portalSessionTokenLimit,
} from './portal.session.js';

const router = Router();
const DAY_MS = 86_400_000;
const maintenanceLimit = portalContractLimit(
  'stay-portal-maintenance',
  PORTAL_DAILY_SUBMISSIONS,
  DAY_MS,
);
const requestLimit = portalContractLimit('stay-portal-request', PORTAL_DAILY_SUBMISSIONS, DAY_MS);
/** Receipt and maintenance photos (≤ 5 per report): generous, still bounded per contract. */
const uploadLimit = portalContractLimit('stay-portal-upload', 60, DAY_MS);

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

// Part B: tenants only propose; staff accept in the inbox (`/api/requests`, `/payment-claims`).
router.post(
  '/portal/invoices/:id/payment-claims',
  portalSessionRequired,
  apiHandler(
    (req) =>
      createPaymentClaim(
        portalOf(req),
        uuidRouteId(req),
        readPaymentClaimInput(formBody(req)),
        optionalIdempotencyKey(req),
      ),
    201,
  ),
);
router.post(
  '/portal/payment-claims/:id/cancel',
  portalSessionRequired,
  apiHandler((req) => cancelPaymentClaim(portalOf(req), uuidRouteId(req))),
);
router.get(
  '/portal/maintenance',
  portalSessionRequired,
  apiHandler((req) => listPortalMaintenance(portalOf(req))),
);
router.post(
  '/portal/maintenance',
  portalSessionRequired,
  maintenanceLimit,
  apiHandler(
    (req) => createPortalMaintenance(portalOf(req), readMaintenanceInput(formBody(req))),
    201,
  ),
);
router.post(
  '/portal/maintenance/:id/cancel',
  portalSessionRequired,
  apiHandler((req) => cancelPortalMaintenance(portalOf(req), uuidRouteId(req))),
);
router.get(
  '/portal/requests',
  portalSessionRequired,
  apiHandler((req) => listPortalRequests(portalOf(req))),
);
router.post(
  '/portal/requests',
  portalSessionRequired,
  requestLimit,
  apiHandler((req) => createPortalRequest(portalOf(req), readTenantRequestInput(req)), 201),
);
router.post(
  '/portal/requests/:id/cancel',
  portalSessionRequired,
  apiHandler((req) => cancelPortalRequest(portalOf(req), uuidRouteId(req))),
);
router.post(
  '/portal/uploads',
  portalSessionRequired,
  uploadLimit,
  apiHandler((req) => {
    const body = formBody(req);
    const purpose = body.enum('purpose', PORTAL_UPLOAD_PURPOSES);

    body.assertValid();
    return createPortalUpload(portalOf(req), purpose);
  }, 201),
);
router.post(
  '/portal/uploads/:id/complete',
  portalSessionRequired,
  apiHandler((req) => completePortalUpload(portalOf(req), uuidRouteId(req))),
);

export default applyAuditPolicies(router, portalAuditPolicies);
