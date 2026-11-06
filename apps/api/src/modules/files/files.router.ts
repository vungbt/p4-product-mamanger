import { UPLOAD_PURPOSES } from '@p4/shared';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { UploadTicketModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { NotFound } from '@/utils/errors/index.js';
import { privateDownloadUrl } from './cloudinary.service.js';
import { auditPolicies } from './files.audit.js';
import * as filesController from './files.controller.js';
import * as files from './files.service.js';
import * as uploads from './uploads.service.js';

const router = Router();

router.get(
  '/sign-upload-url',
  authRequired,
  requirePermission('catalog:write'),
  filesController.getSignUploadUrl,
);

router.get(
  '/sign-upload-urls',
  authRequired,
  requirePermission('catalog:write'),
  filesController.getSignUploadUrls,
);

router.post(
  '/uploads',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    return uploads.createUpload(
      currentUser(req),
      body.enum('purpose', UPLOAD_PURPOSES),
      body.optionalText('resourceId', 128) ?? null,
    );
  }, 201),
);
router.post(
  '/uploads/:id/complete',
  authRequired,
  apiHandler(async (req) => uploads.completeUpload(currentUser(req).id, uuidRouteId(req))),
);
router.get(
  '/uploads/:id',
  authRequired,
  apiHandler(async (req) => {
    const row = await UploadTicketModel.findOne({
      where: { id: uuidRouteId(req), ownerId: currentUser(req).id },
    });
    if (!row) throw new NotFound();
    return uploads.uploadDto(row);
  }),
);
router.get(
  '/:id/download',
  authRequired,
  apiHandler(async (req) => {
    const file = await uploads.ownedFile(currentUser(req), uuidRouteId(req));
    const format = file.metadata?.format;
    if (file.metadata?.private !== true || typeof format !== 'string') throw new NotFound();
    return { url: privateDownloadUrl(file.storageId, format), expiresIn: 60 };
  }),
);
router.delete(
  '/:id',
  authRequired,
  apiHandler(async (req) => {
    const file = await uploads.ownedFile(currentUser(req), uuidRouteId(req));
    return files.deleteFile(file.id);
  }),
);
export default applyAuditPolicies(router, auditPolicies);
