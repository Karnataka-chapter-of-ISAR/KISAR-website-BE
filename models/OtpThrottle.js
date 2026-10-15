import mongoose from 'mongoose';

// Per-email limit on how often a login code can be requested. Kept apart from
// the OTP documents because those are deleted and recreated on every request,
// which would reset any counter stored on them.
const otpThrottleSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },
  count:       { type: Number, default: 0 },
  lastSentAt:  { type: Date, required: true },
  windowEndsAt: { type: Date, required: true },
});

// MongoDB auto-deletes documents once the window has ended
otpThrottleSchema.index({ windowEndsAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpThrottle', otpThrottleSchema);
