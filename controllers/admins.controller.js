import { validateCreateAdminRequest } from '../dto/admins/createAdmin.request.dto.js';
import { createAdmin, listAdmins, deleteAdmin } from '../services/admin.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';
import { isSuperAdmin } from '../constants/admin.js';

const toAdminDto = admin => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  createdAt: admin.createdAt,
  isSuperAdmin: isSuperAdmin(admin),
});

export async function listAdminsController(req, res) {
  const admins = await listAdmins();
  return sendSuccess(res, {
    message: MESSAGES.ADMIN.LIST_SUCCESS,
    data: { admins: admins.map(toAdminDto) },
  });
}

export async function deleteAdminController(req, res) {
  try {
    await deleteAdmin(req.params.id, req.admin);
    return sendSuccess(res, { message: MESSAGES.ADMIN.DELETE_SUCCESS });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function createAdminController(req, res) {
  const { valid, errors, data } = validateCreateAdminRequest(req.body);
  if (!valid) {
    return sendError(res, { message: MESSAGES.ADMIN.VALIDATION_ERROR, statusCode: 422, data: { errors } });
  }

  try {
    const { admin, emailSent } = await createAdmin({ ...data, addedBy: req.admin });
    return sendSuccess(res, {
      message: MESSAGES.ADMIN.CREATE_SUCCESS,
      statusCode: 201,
      data: { admin: toAdminDto(admin), emailSent },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
