import { validateMembersSheet, confirmMembersImport } from '../services/members.service.js';
import { toValidateImportResponseDto } from '../dto/members/validateImport.response.dto.js';
import { toImportMembersResponseDto } from '../dto/members/importMembers.response.dto.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function validateMembersImportController(req, res) {
  if (!req.file) {
    return sendError(res, { message: MESSAGES.MEMBERS.NO_FILE, statusCode: 400 });
  }

  try {
    const result = await validateMembersSheet(req.file.buffer, req.admin._id);
    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.VALIDATION_PASSED,
      statusCode: 200,
      data: toValidateImportResponseDto(result),
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function confirmMembersImportController(req, res) {
  try {
    const imported = await confirmMembersImport(req.params.batchId);
    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.IMPORT_SUCCESS,
      statusCode: 201,
      data: toImportMembersResponseDto(imported),
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
