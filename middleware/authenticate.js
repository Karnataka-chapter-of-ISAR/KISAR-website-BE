import jwt from 'jsonwebtoken';
import BlacklistedToken from '../models/BlacklistedToken.js';
import { sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return sendError(res, { message: MESSAGES.TOKEN.MISSING, statusCode: 401 });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return sendError(res, { message: MESSAGES.TOKEN.INVALID_OR_EXPIRED, statusCode: 401 });
  }

  const isBlacklisted = await BlacklistedToken.exists({ token });
  if (isBlacklisted) return sendError(res, { message: MESSAGES.TOKEN.REVOKED, statusCode: 401 });

  req.token = token;
  next();
}
