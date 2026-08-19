import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import * as filesController from './files.controller.js';

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
