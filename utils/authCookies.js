export const ACCESS_TOKEN_COOKIE_MAX_AGE_MS  = 15 * 60 * 1000;
export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOpts(maxAge) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge,
  };
}

const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

// Not httpOnly: the FE reads this cookie directly to know the user's role.
// It carries no secret, just a UI hint, so it mirrors the access token's lifetime.
function roleCookieOpts(maxAge) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    maxAge,
  };
}

export function setAuthCookies(res, { accessToken, refreshToken, role }) {
  res.cookie('auth_token',    accessToken,  cookieOpts(ACCESS_TOKEN_COOKIE_MAX_AGE_MS));
  res.cookie('refresh_token', refreshToken, { ...cookieOpts(REFRESH_TOKEN_COOKIE_MAX_AGE_MS), path: REFRESH_TOKEN_COOKIE_PATH });
  if (role) res.cookie('role', role, roleCookieOpts(ACCESS_TOKEN_COOKIE_MAX_AGE_MS));
}

export function clearAuthCookies(res) {
  res.clearCookie('auth_token',    cookieOpts(0));
  res.clearCookie('refresh_token', { ...cookieOpts(0), path: REFRESH_TOKEN_COOKIE_PATH });
  res.clearCookie('role',          roleCookieOpts(0));
}
