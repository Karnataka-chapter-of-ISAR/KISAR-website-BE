import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';
import * as adminRepository from '../repositories/admin.repository.js';
import logger from '../utils/logger.js';

// Must be the Identity endpoint of the Netlify site that serves the admin UI
// (tokens are only valid against the site that issued them).
const NETLIFY_IDENTITY_USER_URL = process.env.NETLIFY_IDENTITY_URL || 'https://kisaradmin.netlify.app/.netlify/identity/user';

// Verifies the admin access token against Netlify Identity, then checks the
// returned email against our own Admin collection — Netlify only proves who
// the user is, our DB decides whether they're allowed into admin endpoints.
export async function verifyAdminAccessToken(token) {
  let response;
  try {
    response = await fetch(NETLIFY_IDENTITY_USER_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    logger.error(`[authenticateAdmin] Netlify Identity request failed: ${err.message}`);
    throw new AppError(MESSAGES.ADMIN.UNAUTHORIZED, 401);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.warn(`[authenticateAdmin] Netlify Identity rejected token: ${response.status} ${response.statusText} ${body}`);
    throw new AppError(MESSAGES.ADMIN.UNAUTHORIZED, 401);
  }

  const identity = await response.json();
  const email = identity?.email;
  if (!email) {
    logger.warn(`[authenticateAdmin] Netlify Identity response had no email: ${JSON.stringify(identity)}`);
    throw new AppError(MESSAGES.ADMIN.UNAUTHORIZED, 401);
  }

  const admin = await adminRepository.findAdminByEmail(email);
  if (!admin) {
    logger.warn(`[authenticateAdmin] No Admin record found for email: ${email}`);
    throw new AppError(MESSAGES.ADMIN.UNAUTHORIZED, 401);
  }

  logger.info(`[authenticateAdmin] Authorized admin: ${email}`);
  return admin;
}
