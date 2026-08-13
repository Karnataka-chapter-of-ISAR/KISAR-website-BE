import { validateMemberEditRequest } from '../dto/members/memberEditRequest.request.dto.js';
import { toSelfEditRequestResponseDto, toAdminEditRequestResponseDto } from '../dto/members/memberEditRequest.response.dto.js';
import { toSelfMemberResponseDto } from '../dto/members/member.response.dto.js';
import { submitEditRequest, listOwnEditRequests, listPendingEditRequests, approveEditRequest, rejectEditRequest } from '../services/memberEditRequest.service.js';
import { getOwnProfile } from '../services/members.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function submitProfileEditController(req, res) {
  const { valid, errors, changes } = validateMemberEditRequest(req.body);
  if (!valid) {
    return sendError(res, { message: MESSAGES.MEMBERS.VALIDATION_ERROR, statusCode: 422, data: { errors } });
  }

  try {
    const { editRequests } = await submitEditRequest({ email: req.user.email, changes });
    // Re-fetch via the same path /me uses, so lockedFields/pendingChanges/
    // rejectedChanges reflect this submission's effects, not a stale snapshot.
    const member = await getOwnProfile(req.user.email);
    return sendSuccess(res, {
      // Direct-edit fields (see utils/profileUtil.js) apply immediately; if
      // anything in this submission also required approval, editRequests is non-empty
      // (one entry per tab touched — e.g. details + membership fields in one call).
      message: editRequests.length > 0 ? MESSAGES.MEMBERS.EDIT_REQUEST_SUBMITTED : MESSAGES.MEMBERS.PROFILE_UPDATE_SUCCESS,
      statusCode: editRequests.length > 0 ? 201 : 200,
      data: {
        member: toSelfMemberResponseDto(member),
        editRequests: editRequests.map(toSelfEditRequestResponseDto),
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function listOwnEditRequestsController(req, res) {
  try {
    const requests = await listOwnEditRequests(req.user.email);
    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.FETCH_SUCCESS,
      data: { editRequests: requests.map(toSelfEditRequestResponseDto) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function listPendingEditRequestsAdminController(req, res) {
  const requests = await listPendingEditRequests({ section: req.query.section });
  return sendSuccess(res, {
    message: MESSAGES.MEMBERS.FETCH_SUCCESS,
    data: { editRequests: requests.map(toAdminEditRequestResponseDto) },
  });
}

export async function approveEditRequestController(req, res) {
  try {
    const request = await approveEditRequest({ requestId: req.params.id, adminId: req.admin._id });
    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.EDIT_REQUEST_APPROVED,
      data: { editRequest: toAdminEditRequestResponseDto(request) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function rejectEditRequestController(req, res) {
  try {
    const request = await rejectEditRequest({ requestId: req.params.id, adminId: req.admin._id, reason: req.body?.reason });
    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.EDIT_REQUEST_REJECTED,
      data: { editRequest: toAdminEditRequestResponseDto(request) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
