import OTP from '../models/OTP.js';

export function deleteOtpsForEmail(email) {
  return OTP.deleteMany({ email });
}

export function createOtp(data) {
  return OTP.create(data);
}

export function findActiveOtpByEmail(email) {
  return OTP.findOne({ email, used: false });
}
