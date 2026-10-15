import { validateMembersSheet, confirmMembersImport, createMember, updateMember, streamMembersToExcel, listMembers, listMembersForAdmin, getMemberCountsByCity, filterMembers, getOwnProfile } from '../services/members.service.js';
import { recordActivity } from '../services/activity.service.js';
import { ACTIVITY_TYPES } from '../constants/activity.js';
import { validateCreateMemberRequest } from '../dto/members/createMember.request.dto.js';
import { validatePatchMemberRequest } from '../dto/members/patchMember.request.dto.js';
import { toValidateImportResponseDto } from '../dto/members/validateImport.response.dto.js';
import { toImportMembersResponseDto } from '../dto/members/importMembers.response.dto.js';
import { toAdminMemberResponseDto, toPublicMemberResponseDto, toSelfMemberResponseDto } from '../dto/members/member.response.dto.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
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
    await recordActivity({
      type: ACTIVITY_TYPES.MEMBERS_BULK_UPLOADED,
      admin: req.admin,
      metadata: { count: imported },
    });
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

export async function createMemberController(req, res) {
  const { valid, errors, data } = validateCreateMemberRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.MEMBERS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  try {
    const member = await createMember(data);
    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.CREATE_SUCCESS,
      statusCode: 201,
      data: { member: toAdminMemberResponseDto(member) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function updateMemberController(req, res) {
  const { valid, errors, data } = validatePatchMemberRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.MEMBERS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  try {
    const member = await updateMember(req.params.id, data);
    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.UPDATE_SUCCESS,
      data: { member: toAdminMemberResponseDto(member) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function exportMembersController(req, res) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="members.xlsx"');
  await streamMembersToExcel(res);
}

export async function listMembersAdminController(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { members, totalCount } = await listMembersForAdmin({ skip, limit, search: req.query.search });

  return sendSuccess(res, {
    message: MESSAGES.MEMBERS.FETCH_SUCCESS,
    data: {
      members: members.map(toAdminMemberResponseDto),
      pagination: buildPaginationMeta({ page, limit, totalCount }),
    },
  });
}

export async function listMembersController(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { members, totalCount } = await listMembers({ skip, limit });

  return sendSuccess(res, {
    message: MESSAGES.MEMBERS.FETCH_SUCCESS,
    data: {
      members: members.map(toPublicMemberResponseDto),
      pagination: buildPaginationMeta({ page, limit, totalCount }),
    },
  });
}

// GET /api/v1/members/filter?membershipCategory=&city=
// Always returns both: the (paginated) matching member list, and a
// city -> count breakdown of those same matches — narrowed by whichever
// of membershipCategory/city was given. With both given, the breakdown
// collapses to a single city entry.
export async function filterMembersController(req, res) {
  const { membershipCategory, city } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const [cities, { members, totalCount }] = await Promise.all([
    getMemberCountsByCity({ membershipCategory, city }),
    filterMembers({ skip, limit, membershipCategory, city }),
  ]);

  return sendSuccess(res, {
    message: MESSAGES.MEMBERS.FETCH_SUCCESS,
    data: {
      members: members.map(toPublicMemberResponseDto),
      pagination: buildPaginationMeta({ page, limit, totalCount }),
      cities,
    },
  });
}

export async function getOwnProfileController(req, res) {
  try {
    const member = await getOwnProfile(req.user.email);

    return sendSuccess(res, {
      message: MESSAGES.MEMBERS.PROFILE_FETCH_SUCCESS,
      data: { member: toSelfMemberResponseDto(member) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
