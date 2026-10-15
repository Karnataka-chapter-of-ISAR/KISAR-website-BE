import { sendBulkMail } from '../services/bulkMail.service.js';
import { recordActivity } from '../services/activity.service.js';
import { ACTIVITY_TYPES } from '../constants/activity.js';
import { validateSendBulkMailRequest } from '../dto/mails/sendBulkMail.request.dto.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

// POST /api/v1/admin/mails/send
// Body: { recipientIds: string[], subject: string, html: string, text?: string }
export async function sendBulkMailController(req, res) {
  const { valid, errors, data } = validateSendBulkMailRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.MAILS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  try {
    const result = await sendBulkMail(data);
    await recordActivity({
      type: ACTIVITY_TYPES.BULK_MAIL_SENT,
      admin: req.admin,
      metadata: {
        subject: data.subject,
        sentCount: result.sent.length,
        failedCount: result.failed.length + result.notFound.length,
      },
    });
    const summary = {
      sentCount: result.sent.length,
      failedCount: result.failed.length,
      notFoundCount: result.notFound.length,
      failed: result.failed,
      notFound: result.notFound,
    };

    if (result.sent.length === 0) {
      return sendError(res, { message: MESSAGES.MAILS.SEND_FAILED, statusCode: 502, data: summary });
    }

    const allDelivered = result.failed.length === 0 && result.notFound.length === 0;
    return sendSuccess(res, {
      message: allDelivered ? MESSAGES.MAILS.SEND_SUCCESS : MESSAGES.MAILS.SEND_PARTIAL,
      data: summary,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
