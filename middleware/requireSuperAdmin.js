import { sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';
import { isSuperAdmin } from '../constants/admin.js';

// Must run after authenticateAdmin, which populates req.admin.
export function requireSuperAdmin(req, res, next) {
  if (!isSuperAdmin(req.admin)) {
    return sendError(res, { message: MESSAGES.ADMIN.SUPER_ADMIN_REQUIRED, statusCode: 403 });
  }
  next();
}
