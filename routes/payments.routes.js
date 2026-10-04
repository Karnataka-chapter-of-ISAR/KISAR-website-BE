import { Router } from 'express';
import { cashfreeWebhookController } from '../controllers/registration.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Signature verification needs the exact raw bytes — app.js captures them as req.rawBody.
router.post('/cashfree/webhook', asyncHandler(cashfreeWebhookController));

export default router;
