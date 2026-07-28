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
