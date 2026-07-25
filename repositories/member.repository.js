import Member from '../models/Member.js';

export function findConflictingMembers({ emails, membershipNos }) {
  return Member.find(
    { $or: [{ email: { $in: emails } }, { membershipNo: { $in: membershipNos } }] },
    { email: 1, membershipNo: 1, _id: 0 },
  ).lean();
}

export function findMemberByEmail(email) {
  return Member.findOne({ email }).lean();
}

export function insertMembers(rows) {
  return Member.insertMany(rows);
}

export function createMember(data) {
  return Member.create(data);
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
