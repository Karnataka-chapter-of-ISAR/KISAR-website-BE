export function validateVerifyOtpRequest(body = {}) {
  const { email, otp } = body;

  if (!email || !otp) {
    return { valid: false };
  }

  return { valid: true, data: { email, otp } };
}
