import { applyAuditPolicies, currentUser, queryText, uuidRouteId } from '@p4/server-core';
import {
  DOCUMENT_KINDS,
  DOCUMENT_SCAN_MAX_BYTES,
  DOCX_IMPORT_MAX_BYTES,
  TEMPLATE_VARIABLES,
  type TemplateVariable,
} from '@stay/shared';
import { type Request, Router } from 'express';
import { requireAbility, requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { auditedTransaction } from '@/shared/audit.js';
import { formBody } from '@/shared/input.js';
import { documentAuditPolicies } from './documents.audit.js';
import type { EventActor } from './documents.events.js';
import { importDocx } from './documents.html.js';
import {
  cancelDocument,
  createDocument,
  getDocument,
  listDocuments,
  markPaperSigned,
  ownerSign,
  readCreateDocumentInput,
  readOwnerSignInput,
  readPaperInput,
  readReasonInput,
  readSendInput,
  readUpdateDocumentInput,
  sendDocument,
  staffDocumentPdf,
  staffDocumentScan,
  supersedeDocument,
  updateDocument,
} from './documents.service.js';
import { receiveFile, sendFile } from './documents.upload.js';
import {
  getLandlordProfile,
  readLandlordInput,
  updateLandlordProfile,
} from './landlord.service.js';
import {
  createTemplate,
  getTemplate,
  getTemplateVersion,
  listTemplates,
  previewTemplate,
  readNewTemplateInput,
  readTemplateUpdateInput,
  readVersionInput,
  saveTemplateVersion,
  updateTemplate,
} from './templates.service.js';

const router = Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Who acts and from where, for the evidence log (never stored in audit rows). */
export function actorOf(req: Request): EventActor {
  const user = currentUser(req);

  return {
    userId: user.id,
    name: user.displayName,
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  };
}

/* ------------------------------ O-35 landlord ------------------------------ */

router.get(
  '/settings/landlord',
  authRequired,
  requireAbility('manage', 'Settings'),
  apiHandler((req) => getLandlordProfile(currentUser(req))),
);
router.put(
  '/settings/landlord',
  authRequired,
  requireAbility('manage', 'Settings'),
  apiHandler((req) =>
    auditedTransaction((transaction) =>
      updateLandlordProfile(currentUser(req), readLandlordInput(formBody(req)), transaction),
    ),
  ),
);

/* ------------------------------ O-36/O-37 templates ------------------------ */

router.get(
  '/contract-template-variables',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler(async (): Promise<TemplateVariable[]> => [...TEMPLATE_VARIABLES]),
);
router.get(
  '/contract-templates',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => {
    const buildingId = queryText(req.query, 'buildingId');
    const kind = DOCUMENT_KINDS.find((value) => value === queryText(req.query, 'kind'));

    return listTemplates(currentUser(req), {
      buildingId: buildingId && UUID.test(buildingId) ? buildingId : undefined,
      kind,
    });
  }),
);
router.post(
  '/contract-templates',
  authRequired,
  requireAbility('manage', 'Settings'),
  apiHandler(
    (req) =>
      auditedTransaction((transaction) =>
        createTemplate(currentUser(req), readNewTemplateInput(formBody(req)), transaction),
      ),
    201,
  ),
);
router.post(
  '/contract-templates/import-docx',
  authRequired,
  requireAbility('manage', 'Settings'),
  rateLimit('stay-template-import', 20),
  receiveFile(DOCX_IMPORT_MAX_BYTES),
  apiHandler((req) => importDocx(req.file?.buffer)),
);
router.get(
  '/contract-templates/:id',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => getTemplate(currentUser(req), uuidRouteId(req))),
);
router.put(
  '/contract-templates/:id',
  authRequired,
  requireAbility('manage', 'Settings'),
  apiHandler((req) =>
    auditedTransaction((transaction) =>
      updateTemplate(
        currentUser(req),
        uuidRouteId(req),
        readTemplateUpdateInput(formBody(req)),
        transaction,
      ),
    ),
  ),
);
router.post(
  '/contract-templates/:id/versions',
  authRequired,
  requireAbility('manage', 'Settings'),
  apiHandler(
    (req) =>
      auditedTransaction((transaction) =>
        saveTemplateVersion(
          currentUser(req),
          uuidRouteId(req),
          readVersionInput(formBody(req)),
          transaction,
        ),
      ),
    201,
  ),
);
router.post(
  '/contract-templates/:id/preview',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => previewTemplate(currentUser(req), uuidRouteId(req), formBody(req))),
);
router.get(
  '/contract-template-versions/:id',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => getTemplateVersion(currentUser(req), uuidRouteId(req))),
);

/* ------------------------------ Documents (O-17, O-38) --------------------- */

router.get(
  '/contracts/:id/documents',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => listDocuments(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/contracts/:id/documents',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler(
    (req) =>
      auditedTransaction((transaction) =>
        createDocument(
          currentUser(req),
          uuidRouteId(req),
          readCreateDocumentInput(formBody(req)),
          actorOf(req),
          transaction,
        ),
      ),
    201,
  ),
);
router.get(
  '/documents/:id',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => getDocument(currentUser(req), uuidRouteId(req))),
);
router.put(
  '/documents/:id',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    auditedTransaction((transaction) =>
      updateDocument(
        currentUser(req),
        uuidRouteId(req),
        readUpdateDocumentInput(formBody(req)),
        actorOf(req),
        transaction,
      ),
    ),
  ),
);
router.post(
  '/documents/:id/send',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    auditedTransaction((transaction) =>
      sendDocument(
        currentUser(req),
        uuidRouteId(req),
        readSendInput(formBody(req)),
        actorOf(req),
        transaction,
      ),
    ),
  ),
);
router.post(
  '/documents/:id/owner-sign',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  rateLimit('stay-document-owner-sign', 10),
  apiHandler((req) =>
    auditedTransaction((transaction) =>
      ownerSign(
        currentUser(req),
        uuidRouteId(req),
        readOwnerSignInput(formBody(req)),
        actorOf(req),
        transaction,
      ),
    ),
  ),
);
router.post(
  '/documents/:id/cancel',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    auditedTransaction((transaction) =>
      cancelDocument(
        currentUser(req),
        uuidRouteId(req),
        readReasonInput(formBody(req)),
        actorOf(req),
        transaction,
      ),
    ),
  ),
);
router.post(
  '/documents/:id/paper',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  receiveFile(DOCUMENT_SCAN_MAX_BYTES),
  apiHandler((req) =>
    auditedTransaction((transaction) =>
      markPaperSigned(
        currentUser(req),
        uuidRouteId(req),
        readPaperInput(formBody(req), req.file?.buffer),
        actorOf(req),
        transaction,
      ),
    ),
  ),
);
router.post(
  '/documents/:id/supersede',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler(
    (req) =>
      auditedTransaction((transaction) =>
        supersedeDocument(currentUser(req), uuidRouteId(req), actorOf(req), transaction),
      ),
    201,
  ),
);
router.get(
  '/documents/:id/pdf',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  (req, res, next) => {
    staffDocumentPdf(currentUser(req), uuidRouteId(req), actorOf(req))
      .then(({ bytes, filename }) => sendFile(res, bytes, filename))
      .catch(next);
  },
);
router.get(
  '/documents/:id/scan',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  (req, res, next) => {
    staffDocumentScan(currentUser(req), uuidRouteId(req))
      .then(({ bytes, format, filename }) =>
        sendFile(
          res,
          bytes,
          filename,
          format === 'pdf' ? 'application/pdf' : format === 'png' ? 'image/png' : 'image/jpeg',
        ),
      )
      .catch(next);
  },
);

export default applyAuditPolicies(router, documentAuditPolicies);
