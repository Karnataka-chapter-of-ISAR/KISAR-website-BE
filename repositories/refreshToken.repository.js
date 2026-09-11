import RefreshToken from '../models/RefreshToken.js';

export function deleteRefreshTokensForEmail(email, session) {
  return RefreshToken.deleteMany({ email }, { session });
}

export async function createRefreshToken(data, session) {
  const [record] = await RefreshToken.create([data], { session });
  return record;
}

export function findRefreshTokenByHash(tokenHash) {
  return RefreshToken.findOne({ tokenHash });
}

export function deleteRefreshTokenByHash(tokenHash) {
  return RefreshToken.deleteOne({ tokenHash });
}
