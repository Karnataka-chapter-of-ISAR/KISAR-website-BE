import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { hashToken } from '../utils/tokenHash.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../utils/mailer.js';
import { MESSAGES } from '../constants/messages.js';
import * as otpRepository from '../repositories/otp.repository.js';
import * as refreshTokenRepository from '../repositories/refreshToken.repository.js';
import * as blacklistedTokenRepository from '../repositories/blacklistedToken.repository.js';

const ACCESS_TOKEN_JWT_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const DEV_EMAIL = 'test@gmail.com';
const DEV_OTP   = '948260';

async function issueTokenPair(email) {
  const accessToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_JWT_TTL });
  const refreshToken = crypto.randomBytes(64).toString('hex');

  await refreshTokenRepository.deleteRefreshTokensForEmail(email);
  await refreshTokenRepository.createRefreshToken({
    email,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
}

export async function requestOtp(email) {
  if (process.env.NODE_ENV !== 'production' && email === DEV_EMAIL) return;

  const otp     = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await otpRepository.deleteOtpsForEmail(email);
  await otpRepository.createOtp({ email, otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

  await sendEmail({
    to: email,
    subject: 'Your login code',
    text: `Your login code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it.`,
  });
}

export async function verifyOtp(email, otp) {
  if (process.env.NODE_ENV !== 'production' && email === DEV_EMAIL && otp === DEV_OTP) {
    const tokens = await issueTokenPair(email);
    return { email, ...tokens };
  }

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

  const tokens = await issueTokenPair(email);
  return { email, ...tokens };
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

  const tokens = await issueTokenPair(email);
  return { email, ...tokens };
}

export async function logout({ token, user, refreshToken }) {
  await blacklistedTokenRepository.createBlacklistedToken({ token, expiresAt: new Date(user.exp * 1000) });

  if (refreshToken) {
    await refreshTokenRepository.deleteRefreshTokenByHash(hashToken(refreshToken));
  }
}
