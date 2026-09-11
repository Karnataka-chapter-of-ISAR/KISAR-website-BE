import { Router } from 'express';
import { sendOtpController, verifyOtpController, refreshAccessTokenController, logoutController } from '../controllers/auth.controller.js';
import { otpRequestLimiter } from '../middleware/otpRequestLimiter.js';
import { authenticateToken } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/send-otp',   otpRequestLimiter, asyncHandler(sendOtpController));
router.post('/verify-otp', asyncHandler(verifyOtpController));
router.post('/refresh',    asyncHandler(refreshAccessTokenController));
router.post('/logout',     authenticateToken, asyncHandler(logoutController));

export default router;
