import rateLimit from 'express-rate-limit';
import { MESSAGES } from '../constants/messages.js';

export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: MESSAGES.OTP.RATE_LIMITED, data: null },
});

// Member login code verification. Looser than the request limit (people mistype),
// but stops an attacker cycling through fresh codes with 5 guesses each.
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: MESSAGES.OTP.VERIFY_RATE_LIMITED, data: null },
});

export const adminOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: MESSAGES.OTP.RATE_LIMITED, data: null },
});

// Separate instance (own counter) so event-registration codes and login codes
// don't eat into each other's per-IP allowance.
export const registrationOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: MESSAGES.OTP.RATE_LIMITED, data: null },
});

// Public contact form: keeps it from being used to flood the KISAR inbox.
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: MESSAGES.CONTACT.RATE_LIMITED, data: null },
});
