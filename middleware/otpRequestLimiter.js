import rateLimit from 'express-rate-limit';
import { MESSAGES } from '../constants/messages.js';

export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: MESSAGES.OTP.RATE_LIMITED, data: null },
});
