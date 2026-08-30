import Member from '../models/Member.js';
import { MEMBER_SEARCHABLE_STRING_FIELDS } from '../constants/members.js';
import { escapeRegex } from '../utils/regex.js';

// Case-insensitive substring match across every searchable string field,
// plus an exact match on `joined` (year) when the term is all digits.
// Regex is built from an escaped literal, so it can't cause ReDoS regardless
// of what the admin types.
function buildMemberSearchFilter(search) {
  if (!search || !search.trim()) return {};

  const term = search.trim();
  const pattern = new RegExp(escapeRegex(term), 'i');
  const or = MEMBER_SEARCHABLE_STRING_FIELDS.map(field => ({ [field]: pattern }));

  if (/^\d+$/.test(term)) {
    or.push({ joined: Number(term) });
  }

  return { $or: or };
}

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

export function findMembersPaginated({ skip, limit, search }) {
  return Member.find(buildMemberSearchFilter(search)).sort({ name: 1 }).skip(skip).limit(limit).lean();
}

export function findAllMembersSorted() {
  return Member.find().sort({ name: 1 }).lean();
}

export function countMembers(search) {
  return Member.countDocuments(buildMemberSearchFilter(search));
}

export function countDistinctDistricts() {
  return Member.distinct('district', { district: { $nin: [null, ''] } });
}

// Case-insensitive exact match — unlike buildMemberSearchFilter's substring
// search, these are discrete category values so a partial match would be
// misleading (e.g. "Bengaluru" shouldn't also match "Bengaluru Rural").
// `district` always requires a real value (whether pinned to a specific one
// or just non-empty) — this endpoint excludes members with no district on
// file from every scenario: list, count, and the grouped breakdown alike.
function buildMemberCategoryFilter({ specialization, district }) {
  const filter = {
    district: (district && district.trim())
      ? new RegExp(`^${escapeRegex(district.trim())}$`, 'i')
      : { $nin: [null, ''] },
  };
  if (specialization && specialization.trim()) {
    filter.specialization = new RegExp(`^${escapeRegex(specialization.trim())}$`, 'i');
  }
  return filter;
}

export function findMembersByCategory({ skip, limit, specialization, district }) {
  return Member.find(buildMemberCategoryFilter({ specialization, district })).sort({ name: 1 }).skip(skip).limit(limit).lean();
}

export function countMembersByCategory({ specialization, district }) {
  return Member.countDocuments(buildMemberCategoryFilter({ specialization, district }));
}

export function countMembersGroupedByDistrict({ specialization, district } = {}) {
  return Member.aggregate([
    { $match: buildMemberCategoryFilter({ specialization, district }) },
    { $group: { _id: '$district', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
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
