export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;
export const MEMBER_PRIVACY_OPTIONS = ['public', 'limited', 'private'];

// Fields a member may submit for self-service edit, grouped by profile tab.
// email/ISARMemberID/memberId are deliberately excluded — email is the login
// identifier, and the ID fields are admin-only.
export const MEMBER_EDIT_SECTION_FIELDS = {
  details: [
    'name', 'title', 'phone', 'alternatePhone', 'alternateEmail',
    'institution', 'address', 'city', 'district', 'state',
    'pincode', 'country', 'linkedin', 'experience',
  ],
  membership: ['membershipCategory', 'zone', 'chapter', 'joined', 'privacy'],
};

export const MEMBER_EDIT_REQUEST_STATUS = ['pending', 'approved', 'rejected'];

export const MEMBER_EDIT_FIELDS = Object.values(MEMBER_EDIT_SECTION_FIELDS).flat();

// Which tab a field belongs to — used only to tag/group MemberEditRequest
// docs for the admin queue. The two lists above never overlap.
export function getMemberFieldSection(field) {
  for (const [section, fields] of Object.entries(MEMBER_EDIT_SECTION_FIELDS)) {
    if (fields.includes(field)) return section;
  }
  return null;
}

// Fields an admin may PATCH via the members grid. Excludes memberId (system-
// generated sequence ID) and lockedFields (managed only by the edit-request flow).
export const ADMIN_EDITABLE_MEMBER_FIELDS = [
  'ISARMemberID', 'name', 'title', 'membershipCategory', 'email', 'alternateEmail',
  'phone', 'alternatePhone', 'institution', 'address',
  'city', 'district', 'state', 'pincode', 'country', 'zone', 'chapter', 'linkedin',
  'joined', 'privacy', 'lat', 'lng', 'colorIndex',
];

// Every string-valued Member field, searched together for the admin grid's
// search box. Excludes lat/lng/colorIndex (internal, not identity/contact
// data) — joined (year) is handled separately since it's numeric.
export const MEMBER_SEARCHABLE_STRING_FIELDS = [
  'memberId', 'ISARMemberID', 'name', 'title', 'membershipCategory', 'email',
  'alternateEmail', 'phone', 'alternatePhone',
  'institution', 'address', 'city', 'district', 'state', 'pincode', 'country',
  'zone', 'chapter', 'linkedin', 'privacy',
];

// Name of the Atlas Search index the admin directory search runs against
// (see repositories/member.repository.js searchMembersForAdmin). Must exist
// on the target cluster before that code path runs — create/update it with
// `node scripts/createMemberSearchIndex.js` (point at a specific environment
// via `ENV_FILE=.env.prod`).
export const MEMBER_SEARCH_INDEX_NAME = 'members_search';

// nGram autocomplete mirrors the old regex's "substring anywhere, case-
// insensitive" behavior for every searchable string field. `joined` gets a
// plain number mapping so it can be matched exactly instead.
const MEMBER_AUTOCOMPLETE_FIELD = {
  type: 'autocomplete',
  tokenization: 'nGram',
  minGrams: 2,
  maxGrams: 15,
  foldDiacritics: false,
};

export const MEMBER_SEARCH_INDEX_DEFINITION = {
  mappings: {
    dynamic: false,
    fields: {
      ...Object.fromEntries(MEMBER_SEARCHABLE_STRING_FIELDS.map(field => [field, MEMBER_AUTOCOMPLETE_FIELD])),
      joined: { type: 'number' },
    },
  },
};
