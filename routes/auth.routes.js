import { Router } from 'express';
import { sendOtpController, verifyOtpController, refreshAccessTokenController, logoutController } from '../controllers/auth.controller.js';
import { otpRequestLimiter } from '../middleware/otpRequestLimiter.js';
import { authenticateToken } from '../middleware/authenticate.js';

const router = Router();

router.post('/send-otp',   otpRequestLimiter, sendOtpController);
router.post('/verify-otp', verifyOtpController);
router.post('/refresh',    refreshAccessTokenController);
router.post('/logout',     authenticateToken, logoutController);

export default router;
