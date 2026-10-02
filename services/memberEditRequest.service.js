import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';
import { getMemberFieldSection, MEMBER_EDIT_REQUEST_STATUS } from '../constants/members.js';
import { getFieldMode } from '../utils/profileUtil.js';
import * as memberRepository from '../repositories/member.repository.js';
import * as memberEditRequestRepository from '../repositories/memberEditRequest.repository.js';

function isSameValue(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  return a === b;
}

// A submission can mix direct-edit fields (e.g. district, linkedin) with
// approval-required ones (e.g. phone, address) in the same request — see
// utils/profileUtil.js for which is which. Direct fields are written to the
// Member doc immediately. Approval fields are grouped by tab (details vs
// membership, via getMemberFieldSection) and each group becomes its own
// MemberEditRequest, so the admin queue still shows "which tab is this from"
// even though there's now a single submit endpoint for both tabs.
// Returns { member, editRequests } — editRequests is [] if nothing needed approval.
export async function submitEditRequest({ email, changes }) {
  const member = await memberRepository.findMemberByEmail(email);
  if (!member) throw new AppError(MESSAGES.MEMBERS.SESSION_MEMBER_NOT_FOUND, 401);

  const directChanges = {};
  const proposedChangesBySection = {};
  const previousValuesBySection = {};
  for (const [field, newValue] of Object.entries(changes)) {
    const oldValue = member[field] ?? null;
    if (isSameValue(newValue, oldValue)) continue; // no-op, skip entirely

    if (getFieldMode(field) === 'direct') {
      directChanges[field] = newValue;
      continue;
    }

    const section = getMemberFieldSection(field);
    proposedChangesBySection[section] ??= {};
    previousValuesBySection[section] ??= {};
    proposedChangesBySection[section][field] = newValue;
    previousValuesBySection[section][field] = oldValue;
  }

  let updatedMember = member;
  if (Object.keys(directChanges).length > 0) {
    updatedMember = await memberRepository.updateMemberById(member._id, directChanges);
  }

  const approvalFields = Object.values(proposedChangesBySection).flatMap(Object.keys);
  if (approvalFields.length === 0) {
    if (Object.keys(directChanges).length === 0) {
      throw new AppError(MESSAGES.MEMBERS.EDIT_NO_CHANGES, 422);
    }
    return { member: updatedMember, editRequests: [] };
  }

  const alreadyLocked = approvalFields.filter(field => member.lockedFields?.includes(field));
  if (alreadyLocked.length > 0) {
    throw new AppError(MESSAGES.MEMBERS.EDIT_FIELDS_LOCKED, 409, { fields: alreadyLocked });
  }

  const session = await mongoose.startSession();
  try {
    const requests = [];
    await session.withTransaction(async () => {
      const locked = await memberRepository.lockMemberFields({ memberId: member._id, fields: approvalFields, session });
      if (!locked) {
        // Another submission locked one of these fields between our check and now.
        throw new AppError(MESSAGES.MEMBERS.EDIT_FIELDS_LOCKED, 409, { fields: approvalFields });
      }

      for (const [section, proposedChanges] of Object.entries(proposedChangesBySection)) {
        const request = await memberEditRequestRepository.createEditRequest({
          memberId: member._id,
          section,
          fields: Object.keys(proposedChanges),
          proposedChanges,
          previousValues: previousValuesBySection[section],
          status: 'pending',
          submittedAt: new Date(),
        }, session);
        requests.push(request);
      }
    });
    return { member: updatedMember, editRequests: requests };
  } finally {
    await session.endSession();
  }
}

export async function listOwnEditRequests(email) {
  const member = await memberRepository.findMemberByEmail(email);
  if (!member) throw new AppError(MESSAGES.MEMBERS.SESSION_MEMBER_NOT_FOUND, 401);

  return memberEditRequestRepository.findByMemberSorted(member._id);
}

export async function listEditRequests({ status, section, skip, limit } = {}) {
  if (status && !MEMBER_EDIT_REQUEST_STATUS.includes(status)) {
    throw new AppError(MESSAGES.MEMBERS.INVALID_EDIT_REQUEST_STATUS, 422);
  }
  const resolvedStatus = status || 'pending';

  const [requests, totalCount] = await Promise.all([
    memberEditRequestRepository.findEditRequests({ status: resolvedStatus, section, skip, limit }),
    memberEditRequestRepository.countEditRequests({ status: resolvedStatus, section }),
  ]);

  return { requests, totalCount };
}

export async function approveEditRequest({ requestId, adminId }) {
  if (!mongoose.Types.ObjectId.isValid(requestId)) throw new AppError(MESSAGES.MEMBERS.EDIT_REQUEST_NOT_FOUND, 404);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const request = await memberEditRequestRepository.findById(requestId, session);
      if (!request || request.status !== 'pending') {
        throw new AppError(MESSAGES.MEMBERS.EDIT_REQUEST_NOT_FOUND, 404);
      }

      const member = await memberRepository.applyApprovedChanges({
        memberId: request.memberId,
        changes: request.proposedChanges,
        fields: request.fields,
        session,
      });
      if (!member) throw new AppError(MESSAGES.MEMBERS.NOT_FOUND, 404);

      request.status = 'approved';
      request.reviewedBy = adminId;
      request.reviewedAt = new Date();
      await request.save({ session });
      result = request;
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function rejectEditRequest({ requestId, adminId, reason }) {
  if (!mongoose.Types.ObjectId.isValid(requestId)) throw new AppError(MESSAGES.MEMBERS.EDIT_REQUEST_NOT_FOUND, 404);
  if (!reason || !reason.trim()) throw new AppError(MESSAGES.MEMBERS.REJECTION_REASON_REQUIRED, 422);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const request = await memberEditRequestRepository.findById(requestId, session);
      if (!request || request.status !== 'pending') {
        throw new AppError(MESSAGES.MEMBERS.EDIT_REQUEST_NOT_FOUND, 404);
      }

      await memberRepository.unlockMemberFields({ memberId: request.memberId, fields: request.fields, session });

      request.status = 'rejected';
      request.reviewedBy = adminId;
      request.reviewedAt = new Date();
      request.rejectionReason = reason || null;
      await request.save({ session });
      result = request;
    });
    return result;
  } finally {
    await session.endSession();
  }
}

function toNotificationSummary(request) {
  const fieldList = request.fields ?? [];
  const fieldsLabel = fieldList.length ? fieldList.join(', ') : 'profile';

  switch (request.status) {
    case 'pending':
      return {
        title: 'Profile update pending',
        message: `Your update to ${fieldsLabel} is waiting for admin review.`,
      };
    case 'approved':
      return {
        title: 'Profile update approved',
        message: `Your update to ${fieldsLabel} was approved by the admin.`,
      };
    case 'rejected':
      return {
        title: 'Profile update rejected',
        message: request.rejectionReason
          ? `Your update to ${fieldsLabel} was rejected: ${request.rejectionReason}.`
          : `Your update to ${fieldsLabel} was rejected.`,
      };
    default:
      return {
        title: 'Profile update',
        message: `Your update to ${fieldsLabel} has an updated status.`,
      };
  }
}

function toAdminNotificationSummary(request) {
  const member = request.memberId ?? {};
  const memberName = member.name || 'A member';
  const fieldList = request.fields ?? [];
  const fieldsLabel = fieldList.length ? fieldList.join(', ') : 'profile';

  switch (request.status) {
    case 'pending':
      return {
        title: 'New profile update request',
        message: `${memberName} submitted a change to ${fieldsLabel}.`,
      };
    case 'approved':
      return {
        title: 'Profile update approved',
        message: `${memberName}'s update to ${fieldsLabel} was approved.`,
      };
    case 'rejected':
      return {
        title: 'Profile update rejected',
        message: `${memberName}'s update to ${fieldsLabel} was rejected.`,
      };
    default:
      return {
        title: 'Profile update activity',
        message: `${memberName} has a new profile update event.`,
      };
  }
}

export async function getMemberNotifications({ email, limit = 20 } = {}) {
  const member = await memberRepository.findMemberByEmail(email);
  if (!member) return [];

  const requests = await memberEditRequestRepository.findRecentByMember(member._id, limit);
  return requests.map(request => {
    const summary = toNotificationSummary(request);
    return {
      id: request._id.toString(),
      title: summary.title,
      message: summary.message,
      type: 'profile_update',
      status: request.status,
      section: request.section,
      fields: request.fields ?? [],
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy ?? null,
      rejectionReason: request.rejectionReason ?? null,
    };
  });
}

export async function getAdminNotifications({ status, limit = 10 } = {}) {
  const requests = await memberEditRequestRepository.findRecentForAdmin({ status, limit });
  return requests.map(request => {
    const summary = toAdminNotificationSummary(request);
    return {
      id: request._id.toString(),
      title: summary.title,
      message: summary.message,
      type: 'profile_update',
      status: request.status,
      section: request.section,
      fields: request.fields ?? [],
      member: request.memberId
        ? {
            id: request.memberId._id?.toString?.() ?? request.memberId.toString(),
            name: request.memberId.name ?? null,
            email: request.memberId.email ?? null,
            memberId: request.memberId.memberId ?? null,
          }
        : null,
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy ?? null,
      rejectionReason: request.rejectionReason ?? null,
    };
  });
}
