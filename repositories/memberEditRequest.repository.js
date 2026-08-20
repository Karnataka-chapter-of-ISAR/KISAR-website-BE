import MemberEditRequest from '../models/MemberEditRequest.js';

export async function createEditRequest(data, session) {
  const [request] = await MemberEditRequest.create([data], { session });
  return request;
}

// Not .lean() — approve/reject mutate and .save() this document within a transaction.
export function findById(id, session) {
  return MemberEditRequest.findById(id).session(session);
}

export function findByMemberSorted(memberId) {
  return MemberEditRequest.find({ memberId }).sort({ submittedAt: -1 }).lean();
}

export function findPendingByMemberIds(memberIds) {
  return MemberEditRequest.find({ memberId: { $in: memberIds }, status: 'pending' }).lean();
}

export function findRecentByMember(memberId, limit = 20) {
  return MemberEditRequest.find({ memberId }).sort({ submittedAt: -1 }).limit(limit).lean();
}

export function findRecentForAdmin({ status, limit = 10 } = {}) {
  const query = status ? { status } : {};
  return MemberEditRequest.find(query)
    .sort({ submittedAt: -1 })
    .limit(limit)
    .populate('memberId', 'name email memberId')
    .lean();
}

export function findEditRequests({ status, section, skip, limit }) {
  return MemberEditRequest.find({ status, ...(section ? { section } : {}) })
    .sort({ submittedAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('memberId', 'name email memberId')
    .lean();
}

export function countEditRequests({ status, section }) {
  return MemberEditRequest.countDocuments({ status, ...(section ? { section } : {}) });
}
