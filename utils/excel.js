const MAX_EXPORT_NUMBER_DIGITS = 11;

// Digit-only values (pincode, phone, ISAR ID) are better written as real
// numbers — stored as text, Excel flags every such cell with a "number stored
// as text" warning. Returned unchanged when that would alter the value: a
// leading zero or "+91" would be lost, and General format shows 12+ digits in
// scientific notation.
export function digitsToNumber(value) {
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value) && value.length <= MAX_EXPORT_NUMBER_DIGITS) {
    return Number(value);
  }
  return value;
}
