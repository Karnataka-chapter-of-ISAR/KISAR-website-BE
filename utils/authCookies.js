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

// Admin sessions use their own httpOnly cookie, scoped to the admin API so the
// browser never sends it to member endpoints (and vice versa).
export const ADMIN_ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const ADMIN_TOKEN_COOKIE_NAME = 'admin_token';
const ADMIN_TOKEN_COOKIE_PATH = '/api/v1/admin';

// The admin portal (netlify.app / office.kisar.org.in) is cross-site to the API, so in
// production the cookie must be SameSite=None; Secure to be sent at all. That drops the
// built-in CSRF protection of 'strict', which is why authenticateAdmin also checks Origin.
function adminCookieOpts(maxAge) {
  const isProd = process.env.NODE_ENV === 'production';
  return { ...cookieOpts(maxAge), sameSite: isProd ? 'none' : 'lax', path: ADMIN_TOKEN_COOKIE_PATH };
}

export function setAdminAuthCookie(res, accessToken) {
  res.cookie(ADMIN_TOKEN_COOKIE_NAME, accessToken, adminCookieOpts(ADMIN_ACCESS_TOKEN_COOKIE_MAX_AGE_MS));
}

// Readable (non-httpOnly) UI hints for the admin portal. They carry no secret and grant
// nothing: every admin request is authorised server-side from the signed admin_token.
// path '/' so the FE can read them from any page. Values are URI-encoded by res.cookie.
const ADMIN_INFO_COOKIES = ['admin_name', 'admin_email', 'admin_role', 'admin_is_super_admin'];

// Host-only cookies are invisible to other subdomains. Set COOKIE_DOMAIN (e.g. ".kisar.org.in")
// in prod so the admin UI on office.kisar.org.in can read cookies set by the API on kisar.org.in.
function adminInfoCookieOpts(maxAge) {
  const domain = process.env.COOKIE_DOMAIN;
  return { ...adminCookieOpts(maxAge), httpOnly: false, path: '/', ...(domain && { domain }) };
}

export function setAdminInfoCookies(res, { name, email, role, isSuperAdmin }) {
  const opts = adminInfoCookieOpts(ADMIN_ACCESS_TOKEN_COOKIE_MAX_AGE_MS);
  res.cookie('admin_name', name, opts);
  res.cookie('admin_email', email, opts);
  res.cookie('admin_role', role, opts);
  res.cookie('admin_is_super_admin', String(Boolean(isSuperAdmin)), opts);
}

export function clearAdminAuthCookie(res) {
  ADMIN_INFO_COOKIES.forEach((name) => res.clearCookie(name, adminInfoCookieOpts(0)));
  res.clearCookie(ADMIN_TOKEN_COOKIE_NAME, adminCookieOpts(0));
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
