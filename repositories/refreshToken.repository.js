import RefreshToken from '../models/RefreshToken.js';

export function deleteRefreshTokensForEmail(email) {
  return RefreshToken.deleteMany({ email });
}

export function createRefreshToken(data) {
  return RefreshToken.create(data);
}

export function findRefreshTokenByHash(tokenHash) {
  return RefreshToken.findOne({ tokenHash });
}

export function deleteRefreshTokenByHash(tokenHash) {
  return RefreshToken.deleteOne({ tokenHash });
}
