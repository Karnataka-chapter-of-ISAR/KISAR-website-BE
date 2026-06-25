import multer from 'multer';
import * as XLSX from 'xlsx';
import Member from '../models/Member.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter(_, file, cb) {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error(MESSAGES.MEMBERS.INVALID_FILE_TYPE));
  },
});

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

export const uploadMiddleware = upload.single('file');

export async function importMembers(req, res) {
  if (!req.file) {
    return sendError(res, { message: MESSAGES.MEMBERS.NO_FILE, statusCode: 400 });
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  let rows;
  try {
    rows = parseSheet(req.file.buffer);
  } catch {
    return sendError(res, { message: MESSAGES.MEMBERS.PARSE_ERROR, statusCode: 422 });
  }

  if (rows.length === 0) {
    return sendError(res, { message: MESSAGES.MEMBERS.EMPTY_SHEET, statusCode: 422 });
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
    return sendError(res, {
      message: MESSAGES.MEMBERS.MISSING_REQUIRED_FIELDS,
      statusCode: 422,
      data: { rows: invalidRows },
    });
  }

  // ── Detect duplicates within the sheet itself ───────────────────────────────
  const seen = new Set();
  const intraSheetDupes = [];
  for (const email of sheetEmails) {
    if (seen.has(email)) intraSheetDupes.push(email);
    else seen.add(email);
  }
  if (intraSheetDupes.length > 0) {
    return sendError(res, {
      message: MESSAGES.MEMBERS.DUPLICATE_IN_SHEET,
      statusCode: 409,
      data: { duplicateEmails: [...new Set(intraSheetDupes)] },
    });
  }

  // ── Check against existing DB records ──────────────────────────────────────
  const existing = await Member.find(
    { email: { $in: sheetEmails } },
    { email: 1, _id: 0 },
  ).lean();

  if (existing.length > 0) {
    return sendError(res, {
      message: MESSAGES.MEMBERS.DUPLICATE_EMAILS,
      statusCode: 409,
      data: { duplicateEmails: existing.map(m => m.email) },
    });
  }

  // ── All clear — insert ──────────────────────────────────────────────────────
  await Member.insertMany(rows);

  return sendSuccess(res, {
    message: MESSAGES.MEMBERS.IMPORT_SUCCESS,
    statusCode: 201,
    data: { imported: rows.length },
  });
}
