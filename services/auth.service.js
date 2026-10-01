import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { hashToken } from '../utils/tokenHash.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../utils/mailer.js';
import logger from '../utils/logger.js';
import { MESSAGES } from '../constants/messages.js';
import * as otpRepository from '../repositories/otp.repository.js';
import * as refreshTokenRepository from '../repositories/refreshToken.repository.js';
import * as blacklistedTokenRepository from '../repositories/blacklistedToken.repository.js';
import * as memberRepository from '../repositories/member.repository.js';

const ACCESS_TOKEN_JWT_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const DEV_EMAIL = 'test@gmail.com';
const DEV_OTP   = '948260';

const MEMBER_ROLE = 'member';
const ADMIN_ROLE = 'admin';

// test@gmail.com is a dev-only login bypass (see DEV_EMAIL/DEV_OTP above); we
// treat it as the admin account so the admin UI can be exercised without Netlify Identity.
function resolveRole(email) {
  return process.env.NODE_ENV !== 'production' && email === DEV_EMAIL ? ADMIN_ROLE : MEMBER_ROLE;
}

// Dropping the old refresh token(s) and issuing the new one must succeed or
// fail together — otherwise a crash between the two leaves the caller with
// an access token but no matching refresh token to renew it with later.
async function issueTokenPair(email, role) {
  const accessToken = jwt.sign({ email, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_JWT_TTL });
  const refreshToken = crypto.randomBytes(64).toString('hex');

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await refreshTokenRepository.deleteRefreshTokensForEmail(email, session);
      await refreshTokenRepository.createRefreshToken({
        email,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      }, session);
    });
  } finally {
    await session.endSession();
  }

  return { accessToken, refreshToken };
}

export async function requestOtp(email) {
  if (process.env.NODE_ENV !== 'production' && email === DEV_EMAIL) return;

  const member = await memberRepository.findMemberByEmail(email.toLowerCase());
  if (!member) throw new AppError(MESSAGES.OTP.NOT_A_MEMBER, 403);

  const otp     = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await otpRepository.deleteOtpsForEmail(email);
  await otpRepository.createOtp({ email, otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

  try {
    await sendEmail({
      to: email,
      subject: 'Your login code',
      text: `Your login code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it.`,
    });
  } catch (err) {
    logger.error(`[requestOtp] SES send failed for ${email}: ${err.name}: ${err.message}`);
    await otpRepository.deleteOtpsForEmail(email);
    throw new AppError(MESSAGES.OTP.SEND_FAILED, 502);
  }
}

export async function verifyOtp(email, otp) {
  if (process.env.NODE_ENV !== 'production' && email === DEV_EMAIL && otp === DEV_OTP) {
    const tokens = await issueTokenPair(email, ADMIN_ROLE);
    return { email, role: ADMIN_ROLE, ...tokens };
  }

  const role = resolveRole(email);

  const record = await otpRepository.findActiveOtpByEmail(email);
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

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) throw new AppError(MESSAGES.OTP.INVALID_OR_EXPIRED, 400);

  record.used = true;
  await record.save();

  const tokens = await issueTokenPair(email, role);
  return { email, role, ...tokens };
}

export async function refreshSession(rawRefreshToken) {
  if (!rawRefreshToken) throw new AppError(MESSAGES.TOKEN.MISSING, 401);

  const tokenHash = hashToken(rawRefreshToken);
  const record = await refreshTokenRepository.findRefreshTokenByHash(tokenHash);

  if (!record || record.expiresAt < new Date()) {
    await refreshTokenRepository.deleteRefreshTokenByHash(tokenHash);
    throw new AppError(MESSAGES.TOKEN.INVALID_OR_EXPIRED, 401);
  }

  const { email } = record;
  await record.deleteOne();

  const role = resolveRole(email);
  const tokens = await issueTokenPair(email, role);
  return { email, role, ...tokens };
}

export async function logout({ token, user, refreshToken }) {
  await blacklistedTokenRepository.createBlacklistedToken({ token, expiresAt: new Date(user.exp * 1000) });

  if (refreshToken) {
    await refreshTokenRepository.deleteRefreshTokenByHash(hashToken(refreshToken));
  }
}
