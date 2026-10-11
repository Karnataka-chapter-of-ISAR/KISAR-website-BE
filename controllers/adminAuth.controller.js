import { validateSendOtpRequest } from '../dto/auth/sendOtp.request.dto.js';
import { validateVerifyOtpRequest } from '../dto/auth/verifyOtp.request.dto.js';
import { requestAdminOtp, verifyAdminOtp, logoutAdmin } from '../services/adminAuth.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function sendAdminOtpController(req, res) {
  const { valid, data } = validateSendOtpRequest(req.body);
  if (!valid) return sendError(res, { message: MESSAGES.OTP.INVALID_EMAIL, statusCode: 400 });

  try {
    await requestAdminOtp(data.email);
    return sendSuccess(res, { message: MESSAGES.ADMIN.OTP_SENT_IF_ADMIN });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function verifyAdminOtpController(req, res) {
  const { valid, data } = validateVerifyOtpRequest(req.body);
  if (!valid) return sendError(res, { message: MESSAGES.OTP.INVALID_OR_EXPIRED, statusCode: 400 });

  try {
    const { admin, accessToken } = await verifyAdminOtp(data.email, data.otp);
    return sendSuccess(res, {
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      data: { accessToken, admin: { name: admin.name, email: admin.email, role: 'admin' } },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export function getAdminMeController(req, res) {
  return sendSuccess(res, { data: { name: req.admin.name, email: req.admin.email, role: 'admin' } });
}

export async function logoutAdminController(req, res) {
  await logoutAdmin({ token: req.token, exp: req.tokenExp });
  return sendSuccess(res, { message: MESSAGES.AUTH.LOGOUT_SUCCESS });
}
