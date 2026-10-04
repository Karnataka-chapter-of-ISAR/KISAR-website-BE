import crypto from 'crypto';
import bcrypt from 'bcrypt';
import * as otpRepository from '../repositories/otp.repository.js';
import * as memberRepository from '../repositories/member.repository.js';
import { getRegistrableEvent, isMembersOnly } from './registration.service.js';
import { sendEmail } from '../utils/mailer.js';
import { signRegistrationToken } from '../utils/registrationToken.js';
import { normalisePhone } from '../dto/events/registerForEvent.request.dto.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { renderOtp } from '../templates/emails/otp.js';
import { MESSAGES } from '../constants/messages.js';

const { OTP_PURPOSE_EVENT_REGISTRATION: PURPOSE } = otpRepository;

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// Step 1 of the registration form: email a code to prove the address is the user's.
// Logged-in members skip this — their session already proves it.
export async function sendRegistrationOtp({ eventId, email }) {
  const event = await getRegistrableEvent(eventId);

  if (isMembersOnly(event)) {
    const member = await memberRepository.findMemberByEmail(email);
    if (!member) throw new AppError(MESSAGES.EVENTS.NOT_A_MEMBER, 403);
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await otpRepository.deleteOtpsForEmail(email, PURPOSE);
  await otpRepository.createOtp({ email, otpHash, purpose: PURPOSE, expiresAt: new Date(Date.now() + OTP_TTL_MS) });

  try {
    const { subject, html, text } = renderOtp({ otp, expiresInMinutes: OTP_TTL_MS / 60000, purpose: PURPOSE });
    await sendEmail({ to: email, subject, html, text });
  } catch (err) {
    logger.error(`[sendRegistrationOtp] SES send failed for ${email}: ${err.name}: ${err.message}`);
    await otpRepository.deleteOtpsForEmail(email, PURPOSE);
    throw new AppError(MESSAGES.OTP.SEND_FAILED, 502);
  }
}

export async function verifyRegistrationOtp({ eventId, email, otp }) {
  await getRegistrableEvent(eventId);

  const record = await otpRepository.findActiveOtpByEmail(email, PURPOSE);
  if (!record || record.expiresAt < new Date()) {
    await record?.deleteOne();
    throw new AppError(MESSAGES.OTP.INVALID_OR_EXPIRED, 400);
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    await record.deleteOne();
    throw new AppError(MESSAGES.OTP.TOO_MANY_ATTEMPTS, 429);
  }
  await record.save();

  if (!(await bcrypt.compare(otp, record.otpHash))) throw new AppError(MESSAGES.OTP.INVALID_OR_EXPIRED, 400);

  record.used = true;
  await record.save();

  // A verified member email is treated as the member: member price and prefill.
  const member = await memberRepository.findMemberByEmail(email);

  return {
    emailVerificationToken: signRegistrationToken({ email, eventId }),
    isMember: Boolean(member),
    prefill: member
      ? { name: member.name, phone: normalisePhone(member.phone ?? '') ?? member.phone ?? null, isarMemberId: member.ISARMemberID }
      : null,
  };
}
