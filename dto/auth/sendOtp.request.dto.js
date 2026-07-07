const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSendOtpRequest(body = {}) {
  const { email } = body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return { valid: false };
  }

  return { valid: true, data: { email } };
}
