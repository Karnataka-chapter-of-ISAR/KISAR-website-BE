import crypto from 'crypto';

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
