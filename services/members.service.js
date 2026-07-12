import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';
import * as memberRepository from '../repositories/member.repository.js';
import * as pendingMemberImportRepository from '../repositories/pendingMemberImport.repository.js';
import { sendWelcomeEmail } from './notifications.service.js';

const BATCH_TTL_MS = 30 * 60 * 1000; // 30 minutes

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;

// Maps normalised Excel header → schema field name
const HEADER_MAP = {
  name:           'name',
  email:          'email',
  designation:    'designation',
  specialization: 'specialization',
  institution:    'institution',
  city:           'city',
  district:       'district',
  phone:          'phone',
  linkedin:       'linkedin',
  joined:         'joined',
  privacy:        'privacy',
  lat:            'lat',
  lng:            'lng',
  colorindex:     'colorIndex',
};

function parseSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json(sheet, { defval: null });

  return rows.map(raw => {
    const member = {};
    for (const [rawKey, value] of Object.entries(raw)) {
      const mapped = HEADER_MAP[rawKey.trim().toLowerCase()];
      if (mapped) member[mapped] = value === '' ? null : value;
    }
    return member;
  });
}

// Runs the per-row checks that don't require a DB round-trip, in priority
// order. Returns { row, name, email, issue, type } for the first problem
// found, or null if the row is clean so far.
function checkRowFormat(row, rowNumber) {
  const missing = ['name', 'email'].filter(field => !row[field]);
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
    rows = parseSheet(buffer);
  } catch {
    throw new AppError(MESSAGES.MEMBERS.PARSE_ERROR, 422);
  }

  if (rows.length === 0) {
    throw new AppError(MESSAGES.MEMBERS.EMPTY_SHEET, 422);
  }

  const errorRows = [];
  const rowNumbers = rows.map((_, idx) => idx + 2); // +2 = 1-based + header row

  // ── Format / required-field checks ──────────────────────────────────────────
  const formatIssueByIndex = new Map();
  rows.forEach((row, idx) => {
    const issue = checkRowFormat(row, rowNumbers[idx]);
    if (issue) formatIssueByIndex.set(idx, issue);
  });

  // ── Intra-sheet duplicate emails (only among rows that passed format checks) ─
  const emailToIndices = new Map();
  rows.forEach((row, idx) => {
    if (formatIssueByIndex.has(idx)) return;
    const email = row.email.toString().toLowerCase().trim();
    if (!emailToIndices.has(email)) emailToIndices.set(email, []);
    emailToIndices.get(email).push(idx);
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
        issue: `Duplicate entry within this upload (also Row ${otherRows.join(', ')})`,
        type: 'Duplicate',
      });
    }
  }

  // ── DB conflicts (only among rows clean of the above) ───────────────────────
  const candidateIndices = rows
    .map((_, idx) => idx)
    .filter(idx => !formatIssueByIndex.has(idx) && !duplicateIssueByIndex.has(idx));
  const candidateEmails = candidateIndices.map(idx => rows[idx].email.toString().toLowerCase().trim());

  const existing = candidateEmails.length > 0 ? await memberRepository.findMemberEmails(candidateEmails) : [];
  const existingEmails = new Set(existing.map(m => m.email.toLowerCase()));

  const dbConflictIssueByIndex = new Map();
  candidateIndices.forEach(idx => {
    const email = rows[idx].email.toString().toLowerCase().trim();
    if (existingEmails.has(email)) {
      dbConflictIssueByIndex.set(idx, {
        row: rowNumbers[idx],
        name: rows[idx].name,
        email: rows[idx].email,
        issue: 'Email already exists in member records',
        type: 'Conflict',
      });
    }
  });

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
  const existing = await memberRepository.findMemberEmails(emails);

  if (existing.length > 0) {
    await pendingMemberImportRepository.deleteBatch(batchId);
    const existingEmails = new Set(existing.map(m => m.email.toLowerCase()));
    const errors = rows
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => existingEmails.has(row.email.toString().toLowerCase().trim()))
      .map(({ row, idx }) => ({
        row: idx + 2,
        name: row.name,
        email: row.email,
        issue: 'Email already exists in member records',
        type: 'Conflict',
      }));
    throw new AppError(MESSAGES.MEMBERS.BATCH_CONFLICT_ON_CONFIRM, 409, { errors });
  }

  const inserted = await memberRepository.insertMembers(rows);
  await pendingMemberImportRepository.deleteBatch(batchId);

  await Promise.allSettled(inserted.map(member => sendWelcomeEmail(member)));

  return inserted.length;
}
