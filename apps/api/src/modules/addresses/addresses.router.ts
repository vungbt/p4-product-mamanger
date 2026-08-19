import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import * as addressesController from './addresses.controller.js';
import { validateAddressBody, validateUpdateAddressBody } from './addresses.validation.js';

const router = Router();

router.use(authRequired, requireRole('user', 'admin'));

router.get('/', addressesController.list);
router.post('/', validateAddressBody, addressesController.create);
router.put('/:id', validateUpdateAddressBody, addressesController.update);
router.delete('/:id', addressesController.remove);

export default router;
