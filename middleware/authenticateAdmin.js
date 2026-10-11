import { verifyAdminAccessToken } from '../services/adminAuth.service.js';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';
import logger from '../utils/logger.js';

export async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    logger.warn('[authenticateAdmin] No Authorization: Bearer <token> header present');
    return sendError(res, { message: MESSAGES.ADMIN.TOKEN_MISSING, statusCode: 401 });
  }

  try {
    const { admin, payload } = await verifyAdminAccessToken(token);
    req.admin = admin;
    req.token = token;
    req.tokenExp = payload.exp;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    logger.error(`[authenticateAdmin] Unexpected error: ${err.stack || err.message}`);
    throw err;
  }
}
