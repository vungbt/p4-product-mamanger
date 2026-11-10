import {
  applyAuditPolicies,
  currentUser,
  InputValidError,
  queryText,
  uuidRouteId,
} from '@p4/server-core';
import { STAY_UPLOAD_MAX_BYTES, STAY_UPLOAD_PURPOSES } from '@stay/shared';
import { type NextFunction, type Request, type Response, Router } from 'express';
import multer from 'multer';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { auditPolicies } from './uploads.audit.js';
import {
  completeUpload,
  createUpload,
  getUpload,
  readStubFile,
  storeStubUpload,
} from './uploads.service.js';
import { mimeTypeOf } from './uploads.storage.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const stubUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: STAY_UPLOAD_MAX_BYTES, files: 1, fields: 5, parts: 6 },
}).single('file');

function receiveStubFile(req: Request, res: Response, next: NextFunction) {
  stubUpload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) return next(new InputValidError('upload_too_large'));
    next(error);
  });
}

router.post(
  '/uploads',
  authRequired,
  apiHandler(async (req) => {
    const body = formBody(req);
    const purpose = body.enum('purpose', STAY_UPLOAD_PURPOSES);
    const buildingId = body.text('buildingId', 36);

    if (!body.errors.buildingId) body.check('buildingId', UUID_PATTERN.test(buildingId));
    body.assertValid();
    return createUpload(currentUser(req), purpose, buildingId);
  }, 201),
);
router.get(
  '/uploads/:id',
  authRequired,
  apiHandler((req) => getUpload(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/uploads/:id/complete',
  authRequired,
  apiHandler((req) => completeUpload(currentUser(req), uuidRouteId(req))),
);
// Stub storage only (no Cloudinary outside production): the signed URL authorises the upload.
router.post(
  '/uploads/:id/stub',
  receiveStubFile,
  apiHandler((req) =>
    storeStubUpload(
      uuidRouteId(req),
      {
        expires: queryText(req.query, 'expires'),
        signature: queryText(req.query, 'signature'),
      },
      req.file?.buffer,
    ),
  ),
);
router.get('/files/:id/stub', (req, res, next) => {
  readStubFile(uuidRouteId(req), {
    expires: queryText(req.query, 'expires'),
    signature: queryText(req.query, 'signature'),
  })
    .then(({ bytes, format }) => {
      res.set({
        'Content-Type': mimeTypeOf(format),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.send(bytes);
    })
    .catch(next);
});

export default applyAuditPolicies(router, auditPolicies);
