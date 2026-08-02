import { Router } from 'express';
import * as paymentsController from '@/controllers/payments.controller.js';

const router = Router();

router.get('/:id/mock-pay', paymentsController.mockPay);
router.post('/:id/mock-pay', paymentsController.mockPay);
router.post('/webhook/mock', paymentsController.mockWebhook);

export default router;
