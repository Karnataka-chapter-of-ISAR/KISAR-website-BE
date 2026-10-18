import { parentPort, workerData } from 'worker_threads';
import * as XLSX from 'xlsx';

// Maps normalised Excel header → schema field name. Covers both the plain
// import template and the ISAR membership-registry export format.
const HEADER_MAP = {
  // plain template
  name:              'name',
  email:             'email',
  city:              'city',
  district:          'district',
  phone:             'phone',
  socialmedia:       'socialMedia',
  'social media':    'socialMedia',
  linkedin:          'socialMedia', // legacy template header
  joined:            'joined',
  colorindex:        'colorIndex',

  // ISAR membership-registry export
  'new membership no':      'ISARMemberID',
  doctor:                    'title',
  'category of membership': 'membershipCategory',
  'full name':               'name',
  state:                     'state',
  pin:                       'pincode',
  'state chapter selected':  'chapter',
  country:                   'country',
  zone:                      'zone',
  mobile1:                   'phone',
  mobile2:                   'alternatePhone',
  'email 1':                 'email',
  'email 2':                 'alternateEmail',
};

const ADDRESS_HEADERS = new Set(['address 1', 'address 2', 'address 3']);
const STRINGIFY_FIELDS = ['phone', 'alternatePhone', 'pincode', 'ISARMemberID'];

function normalizeHeader(key) {
  return key.replace(/\s+/g, ' ').trim().toLowerCase();
}

function parseSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json(sheet, { defval: null });

  return rows.map(raw => {
    const member = {};
    const addressParts = [];

    for (const [rawKey, value] of Object.entries(raw)) {
      const key = normalizeHeader(rawKey);
      const cleaned = value === '' ? null : value;

      if (ADDRESS_HEADERS.has(key)) {
        if (cleaned) addressParts.push(cleaned.toString().trim());
        continue;
      }

      const mapped = HEADER_MAP[key];
      if (mapped) member[mapped] = cleaned;
    }

    if (addressParts.length > 0) member.address = addressParts.join(', ');

    // Excel yields numbers for phone-like/pin/membership-no columns; normalise to strings.
    for (const field of STRINGIFY_FIELDS) {
      if (member[field] != null) member[field] = member[field].toString().trim();
    }

    return member;
  });
}

try {
  const rows = parseSheet(Buffer.from(workerData.buffer));
  parentPort.postMessage({ result: rows });
} catch (err) {
  parentPort.postMessage({ error: err.message });
}
