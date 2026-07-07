import Admin from '../models/Admin.js';

export function findAdminByEmail(email) {
  return Admin.findOne({ email: email.toLowerCase().trim() }).lean();
}
