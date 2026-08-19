import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import * as authController from './auth.controller.js';
import {
  validateGoogleLoginBody,
  validateLoginBody,
  validateRefreshBody,
  validateUpdatePasswordBody,
  validateUpdateProfileBody,
} from './auth.validation.js';

const router = Router();

router.post('/login', validateLoginBody, authController.login);
router.post('/google', validateGoogleLoginBody, authController.loginGoogle);
router.post('/refresh', validateRefreshBody, authController.refresh);
router.get('/me', authRequired, authController.me);
router.patch('/me', authRequired, validateUpdateProfileBody, authController.updateMe);
router.patch('/password', authRequired, validateUpdatePasswordBody, authController.updatePassword);
router.post('/logout', authController.logout);

export default router;
