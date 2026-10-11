import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';
import * as adminRepository from '../repositories/admin.repository.js';
import { sendAdminAddedEmail } from './notifications.service.js';

export function listAdmins() {
  return adminRepository.listAdmins();
}

export async function createAdmin({ name, email, addedBy }) {
  if (await adminRepository.findAdminByEmail(email)) {
    throw new AppError(MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS, 409);
  }

  let admin;
  try {
    admin = await adminRepository.createAdmin({ name, email });
  } catch (err) {
    if (err.code === 11000) throw new AppError(MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS, 409);
    throw err;
  }

  const emailSent = await sendAdminAddedEmail({ name, email, addedBy: addedBy?.name });
  return { admin, emailSent };
}
