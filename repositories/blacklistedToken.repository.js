import BlacklistedToken from '../models/BlacklistedToken.js';

export function createBlacklistedToken(data) {
  return BlacklistedToken.create(data);
}

export function isTokenBlacklisted(token) {
  return BlacklistedToken.exists({ token });
}
