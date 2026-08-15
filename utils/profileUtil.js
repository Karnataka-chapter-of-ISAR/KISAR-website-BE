export const APPROVAL_REQUIRED_FIELDS = ['phone', 'address', 'name', 'membershipCategory', 'joined', 'zone', 'chapter'];

export const DIRECT_EDIT_FIELDS = [
  'district',
  'linkedin',
  'experience',
];

// Never editable at all — no edit affordance, no approval flow, always just displays
// the live value.
export const DISABLED_FIELDS = [
  'email',
];

// Single source of truth for how a field behaves. Checked in this priority order, so
// moving a key between the arrays above changes its behavior everywhere this is used —
// no other code changes needed.
export function getFieldMode(key) {
  if (DISABLED_FIELDS.includes(key)) return 'disabled';
  if (APPROVAL_REQUIRED_FIELDS.includes(key)) return 'approval';
  if (DIRECT_EDIT_FIELDS.includes(key)) return 'direct';
  return 'direct';
}
