import Member from '../models/Member.js';
import { MEMBER_SEARCHABLE_STRING_FIELDS, MEMBER_SEARCH_INDEX_NAME } from '../constants/members.js';
import { escapeRegex } from '../utils/regex.js';

// Atlas Search compound query: autocomplete (nGram) match across every
// searchable field, plus an exact match on `joined` (year) when the term is
// all digits. Requires the `members_search` index — see
// constants/members.js MEMBER_SEARCH_INDEX_DEFINITION and
// scripts/createMemberSearchIndex.js.
function buildMemberSearchStage(term) {
  const should = [
    { autocomplete: { query: term, path: MEMBER_SEARCHABLE_STRING_FIELDS } },
  ];

  if (/^\d+$/.test(term)) {
    should.push({ equals: { path: 'joined', value: Number(term) } });
  }

  return { $search: { index: MEMBER_SEARCH_INDEX_NAME, compound: { should, minimumShouldMatch: 1 } } };
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

export function findMembersByIds(ids) {
  return Member.find({ _id: { $in: ids } }, { name: 1, email: 1 }).lean();
}

export function insertMembers(rows, session) {
  return Member.insertMany(rows, { session });
}

export async function createMember(data, session) {
  const [member] = await Member.create([data], { session });
  return member;
}

export function updateMemberById(id, data) {
  return Member.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
}

export function findMembersPaginated({ skip, limit }) {
  return Member.find().sort({ name: 1 }).skip(skip).limit(limit).lean();
}

// Cursor instead of an array — the export flow streams members out one at a
// time instead of loading the whole collection into memory.
export function getMembersCursor() {
  return Member.find().sort({ name: 1 }).lean().cursor();
}

export function countMembers() {
  return Member.countDocuments();
}

export function countMembersCreatedSince(since) {
  return Member.countDocuments({ createdAt: { $gte: since } });
}

export function countMembersCreatedBefore(before) {
  return Member.countDocuments({ createdAt: { $lt: before } });
}

// New members per calendar month from `since` onwards, as [{ year, month (1-12), count }].
export function countMembersCreatedPerMonthSince(since) {
  return Member.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, year: '$_id.year', month: '$_id.month', count: 1 } },
  ]);
}

// Admin directory search — Atlas Search when a term is given (see
// buildMemberSearchStage), otherwise the same plain paginated list/count
// used everywhere else. Combines the page of results and the total count
// into one aggregation via $facet instead of two separate queries.
export async function searchMembersForAdmin({ skip, limit, search }) {
  const term = search?.trim();
  if (!term) {
    const [members, totalCount] = await Promise.all([
      findMembersPaginated({ skip, limit }),
      countMembers(),
    ]);
    return { members, totalCount };
  }

  const [result = {}] = await Member.aggregate([
    buildMemberSearchStage(term),
    {
      $facet: {
        data: [{ $sort: { name: 1 } }, { $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ]);

  return { members: result.data ?? [], totalCount: result.totalCount?.[0]?.count ?? 0 };
}

// Distinct city count, case/whitespace-normalized so "Bengaluru" and
// "BENGALURU" count as one city instead of two.
export async function countDistinctCities() {
  const cities = await Member.distinct('city', { city: { $nin: [null, ''] } });
  return new Set(cities.map(city => city.trim().toUpperCase())).size;
}

// Case-insensitive exact match — unlike the directory search's substring
// match, these are discrete category values so a partial match would be
// misleading (e.g. "Bengaluru" shouldn't also match "Bengaluru Rural").
// `city` always requires a real value (whether pinned to a specific one or
// just non-empty) — this endpoint excludes members with no city on file
// from every scenario: list, count, and the grouped breakdown alike.
function buildMemberCategoryFilter({ membershipCategory, city }) {
  const filter = {
    city: (city && city.trim())
      ? new RegExp(`^${escapeRegex(city.trim())}$`, 'i')
      : { $nin: [null, ''] },
  };
  if (membershipCategory && membershipCategory.trim()) {
    filter.membershipCategory = new RegExp(`^${escapeRegex(membershipCategory.trim())}$`, 'i');
  }
  return filter;
}

export function findMembersByCategory({ skip, limit, membershipCategory, city }) {
  return Member.find(buildMemberCategoryFilter({ membershipCategory, city })).sort({ name: 1 }).skip(skip).limit(limit).lean();
}

export function countMembersByCategory({ membershipCategory, city }) {
  return Member.countDocuments(buildMemberCategoryFilter({ membershipCategory, city }));
}

// Groups by a case/whitespace-normalized city so "Bengaluru" and "BENGALURU"
// merge into one entry instead of fragmenting the counts (spelling variants
// like "BANGALORE" are a separate, real-world naming difference and are
// deliberately left as their own entry rather than guessed-merged).
export function countMembersGroupedByCity({ membershipCategory, city } = {}) {
  return Member.aggregate([
    { $match: buildMemberCategoryFilter({ membershipCategory, city }) },
    { $group: { _id: { $toUpper: { $trim: { input: '$city' } } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
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
