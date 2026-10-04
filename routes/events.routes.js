import { Router } from 'express';
import { getEventsController } from '../controllers/publicEvents.controller.js';
import { getMyEventsController } from '../controllers/events.controller.js';
import {
  registerForEventController,
  sendRegistrationOtpController,
  verifyRegistrationEmailController,
} from '../controllers/registration.controller.js';
import { authenticateToken, authenticateOptionalToken } from '../middleware/authenticate.js';
import { registrationOtpLimiter } from '../middleware/otpRequestLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getEventsController));
router.get('/me', authenticateToken, asyncHandler(getMyEventsController));

// Registration is open to non-members on "open" events, so these don't require login;
// a logged-in member's session is picked up (and skips email verification).
router.post('/:id/registration/email-otp', registrationOtpLimiter, asyncHandler(sendRegistrationOtpController));
router.post('/:id/registration/verify-email', asyncHandler(verifyRegistrationEmailController));
router.post('/:id/register', authenticateOptionalToken, asyncHandler(registerForEventController));

export default router;
