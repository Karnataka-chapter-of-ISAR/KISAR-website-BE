// Escapes a literal string for safe use inside `new RegExp(...)`. A regex
// built purely from escaped literals can't cause ReDoS, regardless of input length.
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
