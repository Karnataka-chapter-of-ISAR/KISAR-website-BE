import { validateRegisterRequest } from '../dto/events/registerForEvent.request.dto.js';
import { toRegistrationResponseDto } from '../dto/events/registration.response.dto.js';
import { validateSendOtpRequest } from '../dto/auth/sendOtp.request.dto.js';
import { validateVerifyOtpRequest } from '../dto/auth/verifyOtp.request.dto.js';
import { registerForEvent, getRegistrationStatus, handleCashfreeWebhook } from '../services/registration.service.js';
import { sendRegistrationOtp, verifyRegistrationOtp } from '../services/registrationVerification.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

function sendAppError(res, err) {
  return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
}

export async function sendRegistrationOtpController(req, res) {
  const { valid, data } = validateSendOtpRequest(req.body);
  if (!valid) return sendError(res, { message: MESSAGES.OTP.INVALID_EMAIL, statusCode: 400 });

  try {
    await sendRegistrationOtp({ eventId: req.params.id, email: data.email.trim().toLowerCase() });
    return sendSuccess(res, { message: MESSAGES.REGISTRATION.OTP_SENT });
  } catch (err) {
    if (err instanceof AppError) return sendAppError(res, err);
    throw err;
  }
}

export async function verifyRegistrationEmailController(req, res) {
  const { valid, data } = validateVerifyOtpRequest(req.body);
  if (!valid || typeof data.email !== 'string' || typeof data.otp !== 'string') {
    return sendError(res, { message: MESSAGES.OTP.INVALID_OR_EXPIRED, statusCode: 400 });
  }

  try {
    const result = await verifyRegistrationOtp({
      eventId: req.params.id,
      email: data.email.trim().toLowerCase(),
      otp: data.otp,
    });
    return sendSuccess(res, { message: MESSAGES.REGISTRATION.EMAIL_VERIFIED, data: result });
  } catch (err) {
    if (err instanceof AppError) return sendAppError(res, err);
    throw err;
  }
}

export async function registerForEventController(req, res) {
  const { valid, errors, data } = validateRegisterRequest(req.body);
  if (!valid) {
    return sendError(res, { message: MESSAGES.REGISTRATION.VALIDATION_ERROR, statusCode: 422, data: { errors } });
  }

  try {
    const { registration, payment } = await registerForEvent({ eventId: req.params.id, body: data, user: req.user });
    return sendSuccess(res, {
      message: payment ? MESSAGES.REGISTRATION.PAYMENT_REQUIRED : MESSAGES.REGISTRATION.REGISTERED,
      statusCode: 201,
      data: { registration: toRegistrationResponseDto(registration), payment },
    });
  } catch (err) {
    if (err instanceof AppError) return sendAppError(res, err);
    throw err;
  }
}

export async function getRegistrationStatusController(req, res) {
  try {
    const status = await getRegistrationStatus(req.params.orderId);
    return sendSuccess(res, { message: MESSAGES.REGISTRATION.STATUS_FETCH_SUCCESS, data: status });
  } catch (err) {
    if (err instanceof AppError) return sendAppError(res, err);
    throw err;
  }
}

// Cashfree retries any non-2xx, so a valid signature always gets a 200 — even when
// the event itself needed no action (unknown order, already confirmed, ...).
export async function cashfreeWebhookController(req, res) {
  try {
    await handleCashfreeWebhook({
      rawBody: req.rawBody?.toString('utf8'),
      signature: req.get('x-webhook-signature'),
      timestamp: req.get('x-webhook-timestamp'),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof AppError) return sendAppError(res, err);
    throw err;
  }
}
