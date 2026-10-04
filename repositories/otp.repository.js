import OTP from '../models/OTP.js';

export const OTP_PURPOSE_EVENT_REGISTRATION = 'event_registration';

// Login codes predate the `purpose` field, so "login" means "anything that
// isn't an event-registration code".
function purposeFilter(purpose) {
  return purpose === OTP_PURPOSE_EVENT_REGISTRATION ? { purpose } : { purpose: { $ne: OTP_PURPOSE_EVENT_REGISTRATION } };
}

export function deleteOtpsForEmail(email, purpose) {
  return OTP.deleteMany({ email, ...purposeFilter(purpose) });
}

export function createOtp(data) {
  return OTP.create(data);
}

export function findActiveOtpByEmail(email, purpose) {
  return OTP.findOne({ email, used: false, ...purposeFilter(purpose) });
}
