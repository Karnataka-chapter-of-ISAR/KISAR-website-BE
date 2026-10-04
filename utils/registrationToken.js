import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { REGISTRATION_VERIFICATION_TTL } from '../constants/events.js';

const PURPOSE = 'event_registration';

// Signed with a key derived from JWT_SECRET rather than JWT_SECRET itself, so a
// registration token can never be replayed as a login access token (both are JWTs).
const signingKey = () => crypto
  .createHmac('sha256', process.env.JWT_SECRET)
  .update('event-registration-verification')
  .digest('hex');

// Proof that `email` completed the registration OTP check for one event.
export function signRegistrationToken({ email, eventId }) {
  return jwt.sign({ email, eventId: String(eventId), purpose: PURPOSE }, signingKey(), {
    expiresIn: REGISTRATION_VERIFICATION_TTL,
  });
}

// Returns the payload, or null if the token is invalid, expired or for another purpose.
export function readRegistrationToken(token) {
  try {
    const payload = jwt.verify(token, signingKey());
    return payload.purpose === PURPOSE ? payload : null;
  } catch {
    return null;
  }
}
