import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../utils/mailer.js';
import logger from '../utils/logger.js';
import { renderOtp } from '../templates/emails/otp.js';
import { MESSAGES } from '../constants/messages.js';
import * as otpRepository from '../repositories/otp.repository.js';
import * as adminRepository from '../repositories/admin.repository.js';
import * as blacklistedTokenRepository from '../repositories/blacklistedToken.repository.js';

const { OTP_PURPOSE_ADMIN_LOGIN: PURPOSE } = otpRepository;

const ADMIN_ROLE = 'admin';
const OTP_TTL_MS = 10 * 60 * 1000;
const ADMIN_ACCESS_TOKEN_TTL = '8h';

// Dev-only login bypass, mirroring auth.service.js. Never active in production.
const DEV_EMAIL = 'test@gmail.com';
const DEV_OTP   = '948260';

function isDevBypass(email) {
  return process.env.NODE_ENV !== 'production' && email === DEV_EMAIL;
}

function signAdminToken(email) {
  return jwt.sign({ email, role: ADMIN_ROLE }, process.env.JWT_SECRET, { expiresIn: ADMIN_ACCESS_TOKEN_TTL });
}

// Resolves silently for unknown emails so the endpoint can't be used to find
// out which addresses belong to admins.
export async function requestAdminOtp(rawEmail) {
  const email = rawEmail.toLowerCase().trim();
  if (isDevBypass(email)) return;

  const admin = await adminRepository.findAdminByEmail(email);
  if (!admin) {
    logger.warn(`[requestAdminOtp] OTP requested for non-admin email: ${email}`);
    return;
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await otpRepository.deleteOtpsForEmail(email, PURPOSE);
  await otpRepository.createOtp({ email, otpHash, purpose: PURPOSE, expiresAt: new Date(Date.now() + OTP_TTL_MS) });

  try {
    const { subject, html, text } = renderOtp({ otp, expiresInMinutes: OTP_TTL_MS / 60000 });
    await sendEmail({ to: email, subject, html, text });
  } catch (err) {
    logger.error(`[requestAdminOtp] SES send failed for ${email}: ${err.name}: ${err.message}`);
    await otpRepository.deleteOtpsForEmail(email, PURPOSE);
    throw new AppError(MESSAGES.OTP.SEND_FAILED, 502);
  }
}

export async function verifyAdminOtp(rawEmail, otp) {
  const email = rawEmail.toLowerCase().trim();

  // authenticateAdmin requires an Admin document, so the bypass user is
  // created on first use.
  if (isDevBypass(email) && String(otp) === DEV_OTP) {
    const admin = await adminRepository.upsertAdmin({ name: 'Dev Admin', email });
    return { admin, accessToken: signAdminToken(email) };
  }

  const record = await otpRepository.findActiveOtpByEmail(email, PURPOSE);
  if (!record) throw new AppError(MESSAGES.OTP.INVALID_OR_EXPIRED, 400);

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    throw new AppError(MESSAGES.OTP.INVALID_OR_EXPIRED, 400);
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    await record.deleteOne();
    throw new AppError(MESSAGES.OTP.TOO_MANY_ATTEMPTS, 429);
  }
  await record.save();

  const isValid = await bcrypt.compare(String(otp), record.otpHash);
  if (!isValid) throw new AppError(MESSAGES.OTP.INVALID_OR_EXPIRED, 400);

  record.used = true;
  await record.save();

  const admin = await adminRepository.findAdminByEmail(email);
  if (!admin) throw new AppError(MESSAGES.ADMIN.UNAUTHORIZED, 401);

  return { admin, accessToken: signAdminToken(email) };
}

// Verifies our own admin JWT, then re-checks the Admin collection so removing
// an admin takes effect immediately rather than when the token expires.
export async function verifyAdminAccessToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(MESSAGES.ADMIN.UNAUTHORIZED, 401);
  }

  if (payload.role !== ADMIN_ROLE || !payload.email) throw new AppError(MESSAGES.ADMIN.UNAUTHORIZED, 401);

  if (await blacklistedTokenRepository.isTokenBlacklisted(token)) {
    throw new AppError(MESSAGES.TOKEN.REVOKED, 401);
  }

  const admin = await adminRepository.findAdminByEmail(payload.email);
  if (!admin) {
    logger.warn(`[authenticateAdmin] No Admin record found for email: ${payload.email}`);
    throw new AppError(MESSAGES.ADMIN.UNAUTHORIZED, 401);
  }

  return { admin, payload };
}

export async function logoutAdmin({ token, exp }) {
  await blacklistedTokenRepository.createBlacklistedToken({ token, expiresAt: new Date(exp * 1000) });
}
