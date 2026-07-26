import Member from '../models/Member.js';

export function findConflictingMembers({ emails, isarMemberIds }) {
  return Member.find(
    { $or: [{ email: { $in: emails } }, { ISARMemberID: { $in: isarMemberIds } }] },
    { email: 1, ISARMemberID: 1, _id: 0 },
  ).lean();
}

export function findMemberByEmail(email) {
  return Member.findOne({ email }).lean();
}

export function insertMembers(rows) {
  return Member.insertMany(rows);
}

export function findMembersPaginated({ skip, limit }) {
  return Member.find().sort({ name: 1 }).skip(skip).limit(limit).lean();
}

export function countMembers() {
  return Member.countDocuments();
}
