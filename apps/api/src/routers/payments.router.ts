import { Router } from 'express';
import * as paymentsController from '@/controllers/payments.controller.js';

const router = Router();

router.get('/:id/mock-pay', paymentsController.mockPay);
router.post('/:id/mock-pay', paymentsController.mockPay);
router.post('/webhook/mock', paymentsController.mockWebhook);
// Stripe webhook mounted in index.ts with raw body (not here)

export default router;
