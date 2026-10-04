import { toRegistrationResponseDto } from '../dto/events/registration.response.dto.js';
import { initiateEventRefunds, getEventRefundSummary, refundRegistration } from '../services/refund.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

function sendAppError(res, err) {
  return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
}

export async function initiateEventRefundsController(req, res) {
  try {
    const refunds = await initiateEventRefunds({ eventId: req.params.id });
    return sendSuccess(res, { message: MESSAGES.REFUNDS.INITIATED, data: { refunds } });
  } catch (err) {
    if (err instanceof AppError) return sendAppError(res, err);
    throw err;
  }
}

// ?sync=true re-checks still-pending refunds with the gateway before answering.
export async function getEventRefundsController(req, res) {
  try {
    const refunds = await getEventRefundSummary({ eventId: req.params.id, sync: req.query.sync === 'true' });
    return sendSuccess(res, { message: MESSAGES.REFUNDS.STATUS_FETCH_SUCCESS, data: { refunds } });
  } catch (err) {
    if (err instanceof AppError) return sendAppError(res, err);
    throw err;
  }
}

export async function refundRegistrationController(req, res) {
  try {
    const registration = await refundRegistration({ registrationId: req.params.id });
    return sendSuccess(res, {
      message: MESSAGES.REFUNDS.SINGLE_INITIATED,
      data: { registration: toRegistrationResponseDto(registration) },
    });
  } catch (err) {
    if (err instanceof AppError) return sendAppError(res, err);
    throw err;
  }
}
