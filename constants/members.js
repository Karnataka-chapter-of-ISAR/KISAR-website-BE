export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;
export const MEMBER_PRIVACY_OPTIONS = ['public', 'limited', 'private'];

// Fields a member may submit for self-service edit, grouped by profile tab.
// email/ISARMemberID/memberId are deliberately excluded — email is the login
// identifier, and the ID fields are admin-only.
export const MEMBER_EDIT_SECTION_FIELDS = {
  details: [
    'name', 'title', 'phone', 'alternatePhone', 'alternateEmail', 'designation',
    'specialization', 'institution', 'address', 'city', 'district', 'state',
    'pincode', 'country', 'linkedin',
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
  'phone', 'alternatePhone', 'designation', 'specialization', 'institution', 'address',
  'city', 'district', 'state', 'pincode', 'country', 'zone', 'chapter', 'linkedin',
  'joined', 'privacy', 'lat', 'lng', 'colorIndex',
];
