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

export function findPending({ section } = {}) {
  return MemberEditRequest.find({ status: 'pending', ...(section ? { section } : {}) })
    .sort({ submittedAt: 1 })
    .populate('memberId', 'name email memberId')
    .lean();
}
