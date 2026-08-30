import crypto from 'crypto';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';
import { EMAIL_REGEX, PHONE_REGEX } from '../constants/members.js';
import * as memberRepository from '../repositories/member.repository.js';
import * as pendingMemberImportRepository from '../repositories/pendingMemberImport.repository.js';
import * as memberEditRequestRepository from '../repositories/memberEditRequest.repository.js';
import * as counterRepository from '../repositories/counter.repository.js';
import { formatMemberId } from '../utils/memberId.js';
import { sendWelcomeEmail } from './notifications.service.js';
import { runWorker } from '../utils/runWorker.js';

const MEMBER_ID_COUNTER = 'memberId';

const BATCH_TTL_MS = 30 * 60 * 1000; // 30 minutes

const REQUIRED_FIELDS = ['name', 'email', 'ISARMemberID'];

// XLSX parsing/building is synchronous and CPU-heavy — offloaded to worker
// threads (see workers/) so it doesn't stall the event loop for other requests.
const PARSE_WORKER_URL = new URL('../workers/xlsxParse.worker.js', import.meta.url);
const EXPORT_WORKER_URL = new URL('../workers/xlsxExport.worker.js', import.meta.url);

// Runs the per-row checks that don't require a DB round-trip, in priority
// order. Returns { row, name, email, issue, type } for the first problem
// found, or null if the row is clean so far.
function checkRowFormat(row, rowNumber) {
  const missing = REQUIRED_FIELDS.filter(field => !row[field]);
  if (missing.length > 0) {
    return { row: rowNumber, name: row.name ?? null, email: row.email ?? null, issue: `Missing required field(s): ${missing.join(', ')}`, type: 'Conflict' };
  }

  const email = row.email.toString().trim();
  if (!EMAIL_REGEX.test(email)) {
    return { row: rowNumber, name: row.name, email: row.email, issue: 'Invalid email format', type: 'Conflict' };
  }

  if (row.phone && !PHONE_REGEX.test(row.phone.toString().trim())) {
    return { row: rowNumber, name: row.name, email: row.email, issue: 'Invalid phone number format', type: 'Conflict' };
  }

  return null;
}

export async function validateMembersSheet(buffer, adminId) {
  let rows;
  try {
    rows = await runWorker(PARSE_WORKER_URL, { buffer });
  } catch {
    throw new AppError(MESSAGES.MEMBERS.PARSE_ERROR, 422);
  }

  if (rows.length === 0) {
    throw new AppError(MESSAGES.MEMBERS.EMPTY_SHEET, 422);
  }

  const rowNumbers = rows.map((_, idx) => idx + 2); // +2 = 1-based + header row

  // ── Format / required-field checks ──────────────────────────────────────────
  const formatIssueByIndex = new Map();
  rows.forEach((row, idx) => {
    const issue = checkRowFormat(row, rowNumbers[idx]);
    if (issue) formatIssueByIndex.set(idx, issue);
  });

  // ── Intra-sheet duplicates (email checked first, then ISAR member ID) ───────
  const emailToIndices = new Map();
  const isarMemberIdToIndices = new Map();
  rows.forEach((row, idx) => {
    if (formatIssueByIndex.has(idx)) return;

    const email = row.email.toString().toLowerCase().trim();
    if (!emailToIndices.has(email)) emailToIndices.set(email, []);
    emailToIndices.get(email).push(idx);

    const isarMemberId = row.ISARMemberID.toString().trim();
    if (!isarMemberIdToIndices.has(isarMemberId)) isarMemberIdToIndices.set(isarMemberId, []);
    isarMemberIdToIndices.get(isarMemberId).push(idx);
  });

  const duplicateIssueByIndex = new Map();
  for (const indices of emailToIndices.values()) {
    if (indices.length < 2) continue;
    for (const idx of indices) {
      const otherRows = indices.filter(i => i !== idx).map(i => rowNumbers[i]);
      duplicateIssueByIndex.set(idx, {
        row: rowNumbers[idx],
        name: rows[idx].name,
        email: rows[idx].email,
        issue: `Duplicate email within this upload (also Row ${otherRows.join(', ')})`,
        type: 'Duplicate',
      });
    }
  }
  for (const indices of isarMemberIdToIndices.values()) {
    if (indices.length < 2) continue;
    for (const idx of indices) {
      if (duplicateIssueByIndex.has(idx)) continue; // email duplicate already flagged
      const otherRows = indices.filter(i => i !== idx).map(i => rowNumbers[i]);
      duplicateIssueByIndex.set(idx, {
        row: rowNumbers[idx],
        name: rows[idx].name,
        email: rows[idx].email,
        issue: `Duplicate ISAR member ID within this upload (also Row ${otherRows.join(', ')})`,
        type: 'Duplicate',
      });
    }
  }

  // ── DB conflicts (only among rows clean of the above) ───────────────────────
  const candidateIndices = rows
    .map((_, idx) => idx)
    .filter(idx => !formatIssueByIndex.has(idx) && !duplicateIssueByIndex.has(idx));
  const candidateEmails = candidateIndices.map(idx => rows[idx].email.toString().toLowerCase().trim());
  const candidateIsarMemberIds = candidateIndices.map(idx => rows[idx].ISARMemberID.toString().trim());

  const existing = candidateIndices.length > 0
    ? await memberRepository.findConflictingMembers({ emails: candidateEmails, isarMemberIds: candidateIsarMemberIds })
    : [];
  const existingEmails = new Set(existing.map(m => m.email?.toLowerCase()).filter(Boolean));
  const existingIsarMemberIds = new Set(existing.map(m => m.ISARMemberID).filter(Boolean));

  const dbConflictIssueByIndex = new Map();
  candidateIndices.forEach(idx => {
    const email = rows[idx].email.toString().toLowerCase().trim();
    const isarMemberId = rows[idx].ISARMemberID.toString().trim();
    if (existingEmails.has(email)) {
      dbConflictIssueByIndex.set(idx, { row: rowNumbers[idx], name: rows[idx].name, email: rows[idx].email, issue: 'Email already exists in member records', type: 'Conflict' });
    } else if (existingIsarMemberIds.has(isarMemberId)) {
      dbConflictIssueByIndex.set(idx, { row: rowNumbers[idx], name: rows[idx].name, email: rows[idx].email, issue: 'ISAR member ID already exists in member records', type: 'Conflict' });
    }
  });

  const errorRows = [];
  rows.forEach((_, idx) => {
    const issue = formatIssueByIndex.get(idx) ?? duplicateIssueByIndex.get(idx) ?? dbConflictIssueByIndex.get(idx);
    if (issue) errorRows.push(issue);
  });
  errorRows.sort((a, b) => a.row - b.row);

  if (errorRows.length > 0) {
    throw new AppError(MESSAGES.MEMBERS.VALIDATION_REJECTED, 422, {
      totalRows: rows.length,
      validCount: rows.length - errorRows.length,
      errorCount: errorRows.length,
      errors: errorRows,
    });
  }

  const batchId = crypto.randomUUID();
  await pendingMemberImportRepository.createBatch({
    batchId,
    rows,
    createdBy: adminId,
    expiresAt: new Date(Date.now() + BATCH_TTL_MS),
  });

  return {
    batchId,
    totalRows: rows.length,
    validCount: rows.length,
    welcomeEmailsQueued: rows.length,
  };
}

export async function confirmMembersImport(batchId) {
  const batch = await pendingMemberImportRepository.findActiveBatch(batchId);
  if (!batch) {
    throw new AppError(MESSAGES.MEMBERS.BATCH_NOT_FOUND_OR_EXPIRED, 410);
  }

  const { rows } = batch;
  const emails = rows.map(row => row.email.toString().toLowerCase().trim());
  const isarMemberIds = rows.map(row => row.ISARMemberID.toString().trim());
  const existing = await memberRepository.findConflictingMembers({ emails, isarMemberIds });

  if (existing.length > 0) {
    await pendingMemberImportRepository.deleteBatch(batchId);
    const existingEmails = new Set(existing.map(m => m.email?.toLowerCase()).filter(Boolean));
    const existingIsarMemberIds = new Set(existing.map(m => m.ISARMemberID).filter(Boolean));
    const errors = rows
      .map((row, idx) => {
        const email = row.email.toString().toLowerCase().trim();
        const isarMemberId = row.ISARMemberID.toString().trim();
        if (existingEmails.has(email)) {
          return { row: idx + 2, name: row.name, email: row.email, issue: 'Email already exists in member records', type: 'Conflict' };
        }
        if (existingIsarMemberIds.has(isarMemberId)) {
          return { row: idx + 2, name: row.name, email: row.email, issue: 'ISAR member ID already exists in member records', type: 'Conflict' };
        }
        return null;
      })
      .filter(Boolean);
    throw new AppError(MESSAGES.MEMBERS.BATCH_CONFLICT_ON_CONFIRM, 409, { errors });
  }

  const startSeq = await counterRepository.reserveSequenceRange(MEMBER_ID_COUNTER, rows.length);
  rows.forEach((row, idx) => {
    row.memberId = formatMemberId(startSeq + idx);
  });

  const inserted = await memberRepository.insertMembers(rows);
  await pendingMemberImportRepository.deleteBatch(batchId);

  await Promise.allSettled(inserted.map(member => sendWelcomeEmail(member)));

  return inserted.length;
}

export async function createMember(data) {
  const email = data.email.toLowerCase();
  const isarMemberId = data.ISARMemberID;

  const existing = await memberRepository.findConflictingMembers({ emails: [email], isarMemberIds: [isarMemberId] });
  if (existing.length > 0) {
    const emailTaken = existing.some(m => m.email?.toLowerCase() === email);
    throw new AppError(
      emailTaken ? MESSAGES.MEMBERS.EMAIL_ALREADY_EXISTS : MESSAGES.MEMBERS.ISAR_MEMBER_ID_ALREADY_EXISTS,
      409,
    );
  }

  const seq = await counterRepository.reserveSequenceRange(MEMBER_ID_COUNTER, 1);
  const member = await memberRepository.createMember({ ...data, memberId: formatMemberId(seq) });
  await sendWelcomeEmail(member);

  return member;
}

// Partial update from the admin grid (AG-Grid sends one or a few changed
// cells per call). `data` only contains fields the admin actually changed.
export async function updateMember(memberId, data) {
  if (!mongoose.Types.ObjectId.isValid(memberId)) throw new AppError(MESSAGES.MEMBERS.NOT_FOUND, 404);

  const existingMember = await memberRepository.findMemberById(memberId);
  if (!existingMember) throw new AppError(MESSAGES.MEMBERS.NOT_FOUND, 404);

  // A field with a pending member-submitted edit request can't be overwritten
  // here — otherwise a later approval would silently stomp this admin edit
  // with the older proposed value. Admin must resolve the pending request first.
  const lockedFieldsBeingEdited = Object.keys(data).filter(field => existingMember.lockedFields?.includes(field));
  if (lockedFieldsBeingEdited.length > 0) {
    throw new AppError(MESSAGES.MEMBERS.EDIT_FIELDS_LOCKED, 409, { fields: lockedFieldsBeingEdited });
  }

  if (data.email || data.ISARMemberID) {
    const email = data.email ?? existingMember.email;
    const isarMemberId = data.ISARMemberID ?? existingMember.ISARMemberID;

    const existing = await memberRepository.findConflictingMembers({
      emails: [email],
      isarMemberIds: [isarMemberId],
      excludeId: memberId,
    });
    if (existing.length > 0) {
      const emailTaken = existing.some(m => m.email?.toLowerCase() === email);
      throw new AppError(
        emailTaken ? MESSAGES.MEMBERS.EMAIL_ALREADY_EXISTS : MESSAGES.MEMBERS.ISAR_MEMBER_ID_ALREADY_EXISTS,
        409,
      );
    }
  }

  const member = await memberRepository.updateMemberById(memberId, data);
  if (!member) throw new AppError(MESSAGES.MEMBERS.NOT_FOUND, 404);

  return member;
}

// Exports every member as an .xlsx workbook buffer, using the same field set/order
// exposed to admins in the members table (see member.response.dto.js).
export async function exportMembersToExcel() {
  const members = await memberRepository.findAllMembersSorted();

  const rows = members.map(m => ({
    'Member ID':           m.memberId,
    'ISAR Member ID':      m.ISARMemberID,
    'Name':                m.name,
    'Title':               m.title,
    'Membership Category': m.membershipCategory,
    'Email':                m.email,
    'Alternate Email':     m.alternateEmail,
    'Phone':               m.phone,
    'Alternate Phone':     m.alternatePhone,
    'Designation':         m.designation,
    'Specialization':      m.specialization,
    'Institution':         m.institution,
    'Address':             m.address,
    'City':                m.city,
    'District':            m.district,
    'State':               m.state,
    'Pincode':             m.pincode,
    'Country':             m.country,
    'Zone':                m.zone,
    'Chapter':             m.chapter,
    'LinkedIn':            m.linkedin,
    'Joined':              m.joined,
    'Privacy':             m.privacy,
  }));

  return runWorker(EXPORT_WORKER_URL, { rows });
}

export async function listMembers({ skip, limit }) {
  const [members, totalCount] = await Promise.all([
    memberRepository.findMembersPaginated({ skip, limit }),
    memberRepository.countMembers(),
  ]);
  return { members, totalCount };
}

// Always returns a district -> member count breakdown, optionally narrowed
// by speciality and/or district. `speciality` is the public-facing name for
// the `specialization` field.
export async function getMemberCountsByDistrict({ speciality, district } = {}) {
  const counts = await memberRepository.countMembersGroupedByDistrict({ specialization: speciality, district });
  return counts.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
}

// The member list itself, optionally narrowed by speciality and/or district.
export async function filterMembers({ skip, limit, speciality, district }) {
  const [members, totalCount] = await Promise.all([
    memberRepository.findMembersByCategory({ skip, limit, specialization: speciality, district }),
    memberRepository.countMembersByCategory({ specialization: speciality, district }),
  ]);
  return { members, totalCount };
}

// Attaches per-field pending-review detail (proposed value, previous value,
// when it was submitted) to each member so callers can flag exactly which
// fields are awaiting approval and show what was proposed.
async function attachPendingChanges(members) {
  const memberIds = members.map(m => m._id);
  const pendingRequests = memberIds.length > 0
    ? await memberEditRequestRepository.findPendingByMemberIds(memberIds)
    : [];

  const pendingChangesByMemberId = new Map();
  for (const request of pendingRequests) {
    const key = request.memberId.toString();
    const bucket = pendingChangesByMemberId.get(key) ?? {};
    for (const field of request.fields) {
      bucket[field] = {
        requestId:     request._id,
        proposedValue: request.proposedChanges[field],
        previousValue: request.previousValues[field],
        submittedAt:   request.submittedAt,
      };
    }
    pendingChangesByMemberId.set(key, bucket);
  }

  return members.map(member => ({
    ...member,
    pendingChanges: pendingChangesByMemberId.get(member._id.toString()) ?? {},
  }));
}

// Same as listMembers, but flags which fields are pending review (see
// attachPendingChanges) and supports `search` — a case-insensitive substring
// match across every member field, admin-only (see MEMBER_SEARCHABLE_STRING_FIELDS).
export async function listMembersForAdmin({ skip, limit, search }) {
  const [members, totalCount] = await Promise.all([
    memberRepository.findMembersPaginated({ skip, limit, search }),
    memberRepository.countMembers(search),
  ]);
  return { members: await attachPendingChanges(members), totalCount };
}

export async function getOwnProfile(email) {
  const member = await memberRepository.findMemberByEmail(email);
  if (!member) {
    throw new AppError(MESSAGES.MEMBERS.SESSION_MEMBER_NOT_FOUND, 401);
  }
  const [withPendingChanges] = await attachPendingChanges([member]);
  return withPendingChanges;
}
