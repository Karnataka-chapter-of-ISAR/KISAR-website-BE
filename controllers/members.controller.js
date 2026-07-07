import { importMembersFromSheet } from '../services/members.service.js';
import { toImportMembersResponseDto } from '../dto/members/importMembers.response.dto.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function importMembersController(req, res) {
  if (!req.file) {
    return sendError(res, { message: MESSAGES.MEMBERS.NO_FILE, statusCode: 400 });
  }

  try {
    const imported = await importMembersFromSheet(req.file.buffer);
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
