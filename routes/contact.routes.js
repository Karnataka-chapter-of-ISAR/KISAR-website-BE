import { Router } from 'express';
import { submitContactController } from '../controllers/contact.controller.js';
import { contactLimiter } from '../middleware/otpRequestLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/', contactLimiter, asyncHandler(submitContactController));

export default router;
