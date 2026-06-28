import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import OTP from '../models/OTP.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import RefreshToken from '../models/RefreshToken.js';
import { sendEmail } from '../utils/mailer.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

const ACCESS_TOKEN_TTL  = '15m';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: MESSAGES.OTP.RATE_LIMITED, data: null },
});

function cookieOpts(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
  };
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function setTokenCookies(res, accessToken, rawRefresh) {
  res.cookie('auth_token',    accessToken, cookieOpts(15 * 60 * 1000));
  res.cookie('refresh_token', rawRefresh,  { ...cookieOpts(REFRESH_TOKEN_TTL), path: '/auth' });
}

function clearTokenCookies(res) {
  res.clearCookie('auth_token',    { ...cookieOpts(0) });
  res.clearCookie('refresh_token', { ...cookieOpts(0), path: '/auth' });
}

async function issueRefreshToken(email) {
  const raw  = crypto.randomBytes(64).toString('hex');
  const hash = hashToken(raw);
  await RefreshToken.deleteMany({ email });
  await RefreshToken.create({ email, tokenHash: hash, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL) });
  return raw;
}

const DEV_EMAIL = 'test@gmail.com';
const DEV_OTP   = '948260';

// ── Send OTP ────────────────────────────────────────────────────────────────

export async function sendOTP(req, res) {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, { message: MESSAGES.OTP.INVALID_EMAIL, statusCode: 400 });
  }

  if (process.env.NODE_ENV !== 'production' && email === DEV_EMAIL) {
    return sendSuccess(res, { message: MESSAGES.OTP.SENT });
  }

  const otp     = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await OTP.deleteMany({ email });
  await OTP.create({ email, otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

  await sendEmail({
    to: email,
    subject: 'Your login code',
    text: `Your login code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it.`,
  });

  return sendSuccess(res, { message: MESSAGES.OTP.SENT });
}

// ── Verify OTP → issue both tokens ──────────────────────────────────────────

export async function verifyOTP(req, res) {
  const { email, otp } = req.body;

  if (process.env.NODE_ENV !== 'production' && email === DEV_EMAIL && otp === DEV_OTP) {
    const accessToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
    const rawRefresh  = await issueRefreshToken(email);
    setTokenCookies(res, accessToken, rawRefresh);
    return sendSuccess(res, { message: MESSAGES.AUTH.LOGIN_SUCCESS, data: { email } });
  }

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

  const accessToken  = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const rawRefresh   = await issueRefreshToken(email);

  setTokenCookies(res, accessToken, rawRefresh);
  return sendSuccess(res, { message: MESSAGES.AUTH.LOGIN_SUCCESS, data: { email } });
}

// ── Refresh access token ─────────────────────────────────────────────────────

export async function refreshAccessToken(req, res) {
  const rawRefresh = req.cookies.refresh_token;
  if (!rawRefresh) return sendError(res, { message: MESSAGES.TOKEN.MISSING, statusCode: 401 });

  const record = await RefreshToken.findOne({ tokenHash: hashToken(rawRefresh) });

  if (!record || record.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(rawRefresh) });
    clearTokenCookies(res);
    return sendError(res, { message: MESSAGES.TOKEN.INVALID_OR_EXPIRED, statusCode: 401 });
  }

  const { email } = record;

  // Rotate: delete old, issue new
  await record.deleteOne();
  const newAccessToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const newRawRefresh  = await issueRefreshToken(email);

  setTokenCookies(res, newAccessToken, newRawRefresh);
  return sendSuccess(res, { message: MESSAGES.TOKEN.REFRESHED });
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function logout(req, res) {
  const { token, user, cookies } = req;

  await BlacklistedToken.create({ token, expiresAt: new Date(user.exp * 1000) });

  if (cookies.refresh_token) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(cookies.refresh_token) });
  }

  clearTokenCookies(res);
  return sendSuccess(res, { message: MESSAGES.AUTH.LOGOUT_SUCCESS });
}
