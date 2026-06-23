import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import OTP from '../models/OTP.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import { sendEmail } from '../utils/mailer.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: MESSAGES.OTP.RATE_LIMITED,
    data: null,
  },
});

export async function sendOTP(req, res) {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, { message: MESSAGES.OTP.INVALID_EMAIL, statusCode: 400 });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await OTP.deleteMany({ email });
  await OTP.create({
    email,
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmail({
    to: email,
    subject: 'Your login code',
    text: `Your login code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it.`,
  });

  return sendSuccess(res, { message: MESSAGES.OTP.SENT });
}

export async function verifyOTP(req, res) {
  const { email, otp } = req.body;

  const record = await OTP.findOne({ email, used: false });
  if (!record) return sendError(res, { message: MESSAGES.OTP.INVALID_OR_EXPIRED, statusCode: 400 });

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    return sendError(res, { message: MESSAGES.OTP.INVALID_OR_EXPIRED, statusCode: 400 });
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    await record.deleteOne();
    return sendError(res, { message: MESSAGES.OTP.TOO_MANY_ATTEMPTS, statusCode: 429 });
  }
  await record.save();

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) return sendError(res, { message: MESSAGES.OTP.INVALID_OR_EXPIRED, statusCode: 400 });

  record.used = true;
  await record.save();

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return sendSuccess(res, { message: MESSAGES.AUTH.LOGIN_SUCCESS, data: { token } });
}

export async function logout(req, res) {
  const token = req.token;
  const { exp } = req.user;

  await BlacklistedToken.create({
    token,
    expiresAt: new Date(exp * 1000),
  });

  return sendSuccess(res, { message: MESSAGES.AUTH.LOGOUT_SUCCESS });
}
