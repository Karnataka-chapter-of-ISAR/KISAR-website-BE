import Member from '../models/Member.js';

export function findMemberEmails(emails) {
  return Member.find({ email: { $in: emails } }, { email: 1, _id: 0 }).lean();
}

export function insertMembers(rows) {
  return Member.insertMany(rows);
}
