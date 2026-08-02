import { Router } from 'express';
import * as filesController from '@/controllers/files.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';

const router = Router();

router.get(
  '/sign-upload-url',
  authRequired,
  requireRole('admin'),
  filesController.getSignUploadUrl,
);

router.get(
  '/sign-upload-urls',
  authRequired,
  requireRole('admin'),
  filesController.getSignUploadUrls,
);

export default router;
