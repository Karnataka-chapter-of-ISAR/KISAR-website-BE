import Member from '../models/Member.js';

export function findConflictingMembers({ emails, isarMemberIds, excludeId }) {
  return Member.find(
    {
      $or: [{ email: { $in: emails } }, { ISARMemberID: { $in: isarMemberIds } }],
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    },
    { email: 1, ISARMemberID: 1, _id: 0 },
  ).lean();
}

export function findMemberByEmail(email) {
  return Member.findOne({ email }).lean();
}

export function findMemberById(id) {
  return Member.findById(id).lean();
}

export function insertMembers(rows) {
  return Member.insertMany(rows);
}

export function createMember(data) {
  return Member.create(data);
}

export function updateMemberById(id, data) {
  return Member.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
}

export function findMembersPaginated({ skip, limit }) {
  return Member.find().sort({ name: 1 }).skip(skip).limit(limit).lean();
}

export function findAllMembersSorted() {
  return Member.find().sort({ name: 1 }).lean();
}

export function countMembers() {
  return Member.countDocuments();
}

export function countDistinctDistricts() {
  return Member.distinct('district', { district: { $nin: [null, ''] } });
}

export function findMembersByIdsPaginated({ ids, skip, limit }) {
  return Member.find({ _id: { $in: ids } }).sort({ name: 1 }).skip(skip).limit(limit).lean();
}

// Separate from ids.length so orphaned refs (e.g. a deleted member left
// behind in Event.registeredMembers) don't inflate the reported total.
export function countMembersByIds(ids) {
  return Member.countDocuments({ _id: { $in: ids } });
}

// Atomically locks `fields` on the member, but only if none of them are
// already locked — prevents two concurrent edit submissions from both
// succeeding on the same field. Returns null if any field was already locked.
export function lockMemberFields({ memberId, fields, session }) {
  return Member.findOneAndUpdate(
    { _id: memberId, lockedFields: { $nin: fields } },
    { $push: { lockedFields: { $each: fields } } },
    { new: true, session },
  ).lean();
}

export function applyApprovedChanges({ memberId, changes, fields, session }) {
  return Member.findByIdAndUpdate(
    memberId,
    { $set: changes, $pull: { lockedFields: { $in: fields } } },
    { new: true, runValidators: true, session },
  ).lean();
}

export function unlockMemberFields({ memberId, fields, session }) {
  return Member.findByIdAndUpdate(
    memberId,
    { $pull: { lockedFields: { $in: fields } } },
    { new: true, session },
  ).lean();
}
