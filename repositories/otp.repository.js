import OTP from '../models/OTP.js';

export const OTP_PURPOSE_EVENT_REGISTRATION = 'event_registration';
export const OTP_PURPOSE_ADMIN_LOGIN = 'admin_login';

const NON_MEMBER_LOGIN_PURPOSES = [OTP_PURPOSE_EVENT_REGISTRATION, OTP_PURPOSE_ADMIN_LOGIN];

// Member login codes predate the `purpose` field, so "login" means "anything
// that isn't one of the other purposes".
function purposeFilter(purpose) {
  return NON_MEMBER_LOGIN_PURPOSES.includes(purpose) ? { purpose } : { purpose: { $nin: NON_MEMBER_LOGIN_PURPOSES } };
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
