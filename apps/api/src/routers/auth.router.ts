import { Router } from 'express';
import * as authController from '@/controllers/auth.controller.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { validateLoginBody, validateRefreshBody } from '@/validation/auth.validation.js';

const router = Router();

router.post('/login', validateLoginBody, authController.login);
router.post('/refresh', validateRefreshBody, authController.refresh);
router.get('/me', authRequired, authController.me);
router.post('/logout', authController.logout);

export default router;
