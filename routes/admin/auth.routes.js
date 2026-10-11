import { Router } from 'express';
import { sendAdminOtpController, verifyAdminOtpController, getAdminMeController, logoutAdminController } from '../../controllers/adminAuth.controller.js';
import { adminOtpLimiter } from '../../middleware/otpRequestLimiter.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/send-otp',   adminOtpLimiter, asyncHandler(sendAdminOtpController));
router.post('/verify-otp', adminOtpLimiter, asyncHandler(verifyAdminOtpController));
router.get('/me',          authenticateAdmin, asyncHandler(getAdminMeController));
router.post('/logout',     authenticateAdmin, asyncHandler(logoutAdminController));

export default router;
