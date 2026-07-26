const PREFIX = 'KISAR-';
const PAD_LENGTH = 4;

export function formatMemberId(seq) {
  return `${PREFIX}${String(seq).padStart(PAD_LENGTH, '0')}`;
}
