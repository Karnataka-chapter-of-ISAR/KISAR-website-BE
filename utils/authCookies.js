export const ACCESS_TOKEN_COOKIE_MAX_AGE_MS  = 15 * 60 * 1000;
export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOpts(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
  };
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie('auth_token',    accessToken,  cookieOpts(ACCESS_TOKEN_COOKIE_MAX_AGE_MS));
  res.cookie('refresh_token', refreshToken, { ...cookieOpts(REFRESH_TOKEN_COOKIE_MAX_AGE_MS), path: '/auth' });
}

export function clearAuthCookies(res) {
  res.clearCookie('auth_token',    cookieOpts(0));
  res.clearCookie('refresh_token', { ...cookieOpts(0), path: '/auth' });
}
