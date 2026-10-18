import { validateContactRequest } from '../dto/contact/contact.request.dto.js';
import { submitContactEnquiry } from '../services/contact.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

// POST /api/v1/contact
export async function submitContactController(req, res) {
  const { valid, errors, data } = validateContactRequest(req.body);
  if (!valid) {
    return sendError(res, { message: MESSAGES.CONTACT.VALIDATION_ERROR, statusCode: 422, data: { errors } });
  }

  try {
    await submitContactEnquiry(data);
    return sendSuccess(res, { message: MESSAGES.CONTACT.SENT });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
