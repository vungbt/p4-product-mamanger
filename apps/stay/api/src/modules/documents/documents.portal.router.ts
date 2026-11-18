import { applyAuditPolicies, uuidRouteId } from '@p4/server-core';
import { DOCUMENT_SCAN_MAX_BYTES } from '@stay/shared';
import { type Request, Router } from 'express';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { portalContractLimit, portalOf, portalSessionRequired } from '../portal/portal.session.js';
import { documentPortalAuditPolicies } from './documents.audit.js';
import type { EventActor } from './documents.events.js';
import {
  portalDocument,
  portalDocumentPdf,
  portalDocuments,
  readPortalSignInput,
  readRejectInput,
  rejectPortalDocument,
  signPortalDocument,
} from './documents.portal.js';
import { checkDocumentFile, verifyDocument } from './documents.public.js';
import { receiveFile, sendFile } from './documents.upload.js';

const router = Router();
/** Signing attempts per contract (any occupant, any device) per 15 minutes. */
const signLimit = portalContractLimit('stay-portal-document-sign', 30, 15 * 60_000);

const portalActor = (req: Request): EventActor => ({
  ip: req.ip ?? null,
  userAgent: req.get('user-agent') ?? null,
});

// ST-30 T-12/T-13: tenants read and sign inside their ST-25 portal session (one contract only).
router.get(
  '/portal/documents',
  portalSessionRequired,
  apiHandler((req) => portalDocuments(portalOf(req))),
);
router.get(
  '/portal/documents/:id',
  portalSessionRequired,
  apiHandler((req) => portalDocument(portalOf(req), uuidRouteId(req), portalActor(req))),
);
router.post(
  '/portal/documents/:id/sign',
  portalSessionRequired,
  signLimit,
  apiHandler((req) =>
    signPortalDocument(
      portalOf(req),
      uuidRouteId(req),
      readPortalSignInput(formBody(req)),
      portalActor(req),
    ),
  ),
);
router.post(
  '/portal/documents/:id/reject',
  portalSessionRequired,
  signLimit,
  apiHandler((req) =>
    rejectPortalDocument(
      portalOf(req),
      uuidRouteId(req),
      readRejectInput(formBody(req)),
      portalActor(req),
    ),
  ),
);
router.get('/portal/documents/:id/pdf', portalSessionRequired, (req, res, next) => {
  portalDocumentPdf(portalOf(req), uuidRouteId(req), portalActor(req))
    .then(({ bytes, filename }) => sendFile(res, bytes, filename))
    .catch(next);
});

// P-01: public integrity check (no session); never returns content or names.
router.get(
  '/public/documents/verify/:code',
  rateLimit('stay-document-verify', 30),
  apiHandler((req) => verifyDocument(String(req.params.code ?? ''))),
);
router.post(
  '/public/documents/verify/:code',
  rateLimit('stay-document-verify-file', 10),
  receiveFile(DOCUMENT_SCAN_MAX_BYTES),
  apiHandler((req) => checkDocumentFile(String(req.params.code ?? ''), req.file?.buffer)),
);

export default applyAuditPolicies(router, documentPortalAuditPolicies);
