import * as XLSX from 'xlsx';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';
import * as memberRepository from '../repositories/member.repository.js';

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

export async function importMembersFromSheet(buffer) {
  let rows;
  try {
    rows = parseSheet(buffer);
  } catch {
    throw new AppError(MESSAGES.MEMBERS.PARSE_ERROR, 422);
  }

  if (rows.length === 0) {
    throw new AppError(MESSAGES.MEMBERS.EMPTY_SHEET, 422);
  }

  // ── Validate required fields & collect emails ───────────────────────────────
  const invalidRows = [];
  const sheetEmails = [];

  rows.forEach((row, idx) => {
    if (!row.name || !row.email) {
      invalidRows.push(idx + 2); // +2 = 1-based + header row
    } else {
      sheetEmails.push(row.email.toString().toLowerCase().trim());
    }
  });

  if (invalidRows.length > 0) {
    throw new AppError(MESSAGES.MEMBERS.MISSING_REQUIRED_FIELDS, 422, { rows: invalidRows });
  }

  // ── Detect duplicates within the sheet itself ───────────────────────────────
  const seen = new Set();
  const intraSheetDupes = [];
  for (const email of sheetEmails) {
    if (seen.has(email)) intraSheetDupes.push(email);
    else seen.add(email);
  }
  if (intraSheetDupes.length > 0) {
    throw new AppError(MESSAGES.MEMBERS.DUPLICATE_IN_SHEET, 409, { duplicateEmails: [...new Set(intraSheetDupes)] });
  }

  // ── Check against existing DB records ──────────────────────────────────────
  const existing = await memberRepository.findMemberEmails(sheetEmails);
  if (existing.length > 0) {
    throw new AppError(MESSAGES.MEMBERS.DUPLICATE_EMAILS, 409, { duplicateEmails: existing.map(m => m.email) });
  }

  // ── All clear — insert ──────────────────────────────────────────────────────
  await memberRepository.insertMembers(rows);
  return rows.length;
}
