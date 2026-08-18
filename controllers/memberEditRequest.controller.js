import { validateMemberEditRequest } from '../dto/members/memberEditRequest.request.dto.js';
import { toSelfEditRequestResponseDto, toAdminEditRequestResponseDto } from '../dto/members/memberEditRequest.response.dto.js';
import { toSelfMemberResponseDto } from '../dto/members/member.response.dto.js';
import { submitEditRequest, listOwnEditRequests, listEditRequests, approveEditRequest, rejectEditRequest, getMemberNotifications, getAdminNotifications } from '../services/memberEditRequest.service.js';
import { getOwnProfile } from '../services/members.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
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

export async function listEditRequestsAdminController(req, res) {
  const { page, limit, skip } = parsePagination(req.query);

  try {
    const { requests, totalCount } = await listEditRequests({ status: req.query.status, section: req.query.section, skip, limit });
    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.FETCH_SUCCESS,
      data: {
        editRequests: requests.map(toAdminEditRequestResponseDto),
        pagination: buildPaginationMeta({ page, limit, totalCount }),
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function listOwnNotificationsController(req, res) {
  try {
    const notifications = await getMemberNotifications({ email: req.user.email, limit: Number(req.query.limit || 20) });
    return sendSuccess(res, {
      message: 'Notifications fetched successfully',
      data: { notifications },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function listAdminNotificationsController(req, res) {
  try {
    const limit = Number(req.query.limit || 10);
    const notifications = await getAdminNotifications({ status: req.query.status, limit });
    return sendSuccess(res, {
      message: 'Notifications fetched successfully',
      data: { notifications },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
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
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!reason) {
    return sendError(res, { message: MESSAGES.MEMBERS.REJECTION_REASON_REQUIRED, statusCode: 422 });
  }

  try {
    const request = await rejectEditRequest({ requestId: req.params.id, adminId: req.admin._id, reason });
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
