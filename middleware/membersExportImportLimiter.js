import rateLimit from 'express-rate-limit';
import { MESSAGES } from '../constants/messages.js';

// Export/import run a worker thread per request, but repeated back-to-back
// triggers (e.g. two admins, or a retry loop) still add up — this bounds how
// often any single admin can kick one off.
export const membersExportImportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: MESSAGES.MEMBERS.EXPORT_IMPORT_RATE_LIMITED, data: null },
});
