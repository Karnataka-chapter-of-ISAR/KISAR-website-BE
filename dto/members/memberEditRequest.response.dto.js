export function toSelfEditRequestResponseDto(request) {
  return {
    id:              request._id,
    section:         request.section,
    fields:          request.fields,
    proposedChanges: request.proposedChanges,
    previousValues:  request.previousValues,
    status:          request.status,
    submittedAt:     request.submittedAt,
    reviewedAt:      request.reviewedAt,
    rejectionReason: request.rejectionReason,
  };
}

// Admin queue view — includes the submitting member's identity so requests
// from the same member can be grouped together on screen.
export function toAdminEditRequestResponseDto(request) {
  const member = request.memberId;
  const isPopulated = member && typeof member === 'object';

  return {
    id:              request._id,
    member:          isPopulated
      ? { id: member._id, name: member.name, email: member.email, memberId: member.memberId }
      : { id: member },
    section:         request.section,
    fields:          request.fields,
    proposedChanges: request.proposedChanges,
    previousValues:  request.previousValues,
    status:          request.status,
    submittedAt:     request.submittedAt,
    reviewedBy:      request.reviewedBy,
    reviewedAt:      request.reviewedAt,
    rejectionReason: request.rejectionReason,
  };
}
