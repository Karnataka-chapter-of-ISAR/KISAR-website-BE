import { verifyAdminAccessToken } from '../services/adminAuth.service.js';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';
import logger from '../utils/logger.js';
import { getAllowedOrigins } from '../utils/allowedOrigins.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function authenticateAdmin(req, res, next) {
  // CSRF guard for the SameSite=None admin cookie: browsers always send Origin on
  // cross-site writes, so a write from a site we don't list is rejected.
  const { origin } = req.headers;
  if (!SAFE_METHODS.has(req.method) && origin && !getAllowedOrigins().includes(origin)) {
    logger.warn(`[authenticateAdmin] Rejected ${req.method} from disallowed origin: ${origin}`);
    return sendError(res, { message: MESSAGES.ADMIN.UNAUTHORIZED, statusCode: 403 });
  }

  const token = req.cookies?.admin_token;

  if (!token) {
    logger.warn('[authenticateAdmin] No admin_token cookie present');
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
