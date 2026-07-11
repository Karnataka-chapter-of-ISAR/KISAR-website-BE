import { validateSendOtpRequest } from '../dto/auth/sendOtp.request.dto.js';
import { validateVerifyOtpRequest } from '../dto/auth/verifyOtp.request.dto.js';
import { toAuthResponseDto } from '../dto/auth/auth.response.dto.js';
import { requestOtp, verifyOtp, refreshSession, logout } from '../services/auth.service.js';
import { setAuthCookies, clearAuthCookies } from '../utils/authCookies.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function sendOtpController(req, res) {
  const { valid, data } = validateSendOtpRequest(req.body);
  if (!valid) return sendError(res, { message: MESSAGES.OTP.INVALID_EMAIL, statusCode: 400 });

  try {
    await requestOtp(data.email);
    return sendSuccess(res, { message: MESSAGES.OTP.SENT });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function verifyOtpController(req, res) {
  const { valid, data } = validateVerifyOtpRequest(req.body);
  if (!valid) return sendError(res, { message: MESSAGES.OTP.INVALID_OR_EXPIRED, statusCode: 400 });

  try {
    const { email, accessToken, refreshToken } = await verifyOtp(data.email, data.otp);
    setAuthCookies(res, { accessToken, refreshToken });
    return sendSuccess(res, { message: MESSAGES.AUTH.LOGIN_SUCCESS, data: toAuthResponseDto({ email }) });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function refreshAccessTokenController(req, res) {
  try {
    const { accessToken, refreshToken } = await refreshSession(req.cookies.refresh_token);
    setAuthCookies(res, { accessToken, refreshToken });
    return sendSuccess(res, { message: MESSAGES.TOKEN.REFRESHED });
  } catch (err) {
    if (err instanceof AppError) {
      clearAuthCookies(res);
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function logoutController(req, res) {
  await logout({ token: req.token, user: req.user, refreshToken: req.cookies.refresh_token });
  clearAuthCookies(res);
  return sendSuccess(res, { message: MESSAGES.AUTH.LOGOUT_SUCCESS });
}
