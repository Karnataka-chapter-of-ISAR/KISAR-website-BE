import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../repositories/blacklistedToken.repository.js';
import { sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function authenticateToken(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) return sendError(res, { message: MESSAGES.TOKEN.MISSING, statusCode: 401 });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return sendError(res, { message: MESSAGES.TOKEN.INVALID_OR_EXPIRED, statusCode: 401 });
  }

  const isBlacklisted = await isTokenBlacklisted(token);
  if (isBlacklisted) return sendError(res, { message: MESSAGES.TOKEN.REVOKED, statusCode: 401 });

  req.token = token;
  next();
}
