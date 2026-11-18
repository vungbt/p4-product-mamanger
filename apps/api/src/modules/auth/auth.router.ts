import { applyAuditPolicies } from '@p4/server-core';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { auditPolicies } from './auth.audit.js';
import * as authController from './auth.controller.js';
import {
  validateGoogleLoginBody,
  validateLoginBody,
  validateRefreshBody,
  validateUpdatePasswordBody,
  validateUpdateProfileBody,
} from './auth.validation.js';

const router = Router();

router.post('/login', rateLimit('login', 60), validateLoginBody, authController.login);
router.post(
  '/google',
  rateLimit('google-login', 30),
  validateGoogleLoginBody,
  authController.loginGoogle,
);
router.post('/refresh', rateLimit('refresh', 60), validateRefreshBody, authController.refresh);
router.get('/me', authRequired, authController.me);
router.patch('/me', authRequired, validateUpdateProfileBody, authController.updateMe);
router.patch('/password', authRequired, validateUpdatePasswordBody, authController.updatePassword);
router.post('/logout', authController.logout);

export default applyAuditPolicies(router, auditPolicies);
