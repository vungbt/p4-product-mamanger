import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { validateAddressesListQuery } from '@/modules/addresses/addresses.validation.js';
import { apiHandler } from '@/shared/api-handler.js';
import { currentUser, uuidRouteId } from '@/shared/http-input.js';
import * as addressesController from './addresses.controller.js';
import { updateAddress } from './addresses.service.js';
import { validateAddressBody, validateUpdateAddressBody } from './addresses.validation.js';

const router = Router();

router.use(authRequired, requireRole('user', 'admin'));

router.patch(
  '/:id/default',
  apiHandler(async (req) =>
    updateAddress(currentUser(req).id, uuidRouteId(req), { isDefault: true }),
  ),
);

router.get('/', validateAddressesListQuery, addressesController.list);
router.post('/', validateAddressBody, addressesController.create);
router.put('/:id', validateUpdateAddressBody, addressesController.update);
router.delete('/:id', addressesController.remove);

export default router;
