import OtpThrottle from '../models/OtpThrottle.js';

// Atomically takes one request slot for `key`. Resolves with `{ allowed: true }`,
// or `{ allowed: false, reason: 'cooldown' | 'limit', retryAfterMs }`.
// A slot is only taken when the cooldown has passed and the window's cap is not
// reached, all in one conditional update, so concurrent requests can't both slip through.
export async function takeSlot({ key, cooldownMs, maxPerWindow, windowMs }) {
  const now = new Date();

  const updated = await OtpThrottle.findOneAndUpdate(
    {
      key,
      windowEndsAt: { $gt: now },
      lastSentAt: { $lte: new Date(now.getTime() - cooldownMs) },
      count: { $lt: maxPerWindow },
    },
    { $inc: { count: 1 }, $set: { lastSentAt: now } },
    { new: true },
  );
  if (updated) return { allowed: true };

  const existing = await OtpThrottle.findOne({ key, windowEndsAt: { $gt: now } });
  if (existing) {
    if (existing.count >= maxPerWindow) {
      return { allowed: false, reason: 'limit', retryAfterMs: existing.windowEndsAt - now };
    }
    return { allowed: false, reason: 'cooldown', retryAfterMs: Math.max(existing.lastSentAt.getTime() + cooldownMs - now.getTime(), 1000) };
  }

  // No active window (first request, or the old one ended): start a new one.
  try {
    await OtpThrottle.findOneAndUpdate(
      // Only an expired window may be reset; an active one makes this an insert that hits the unique key.
      { key, windowEndsAt: { $lte: now } },
      { $set: { count: 1, lastSentAt: now, windowEndsAt: new Date(now.getTime() + windowMs) } },
      { upsert: true },
    );
    return { allowed: true };
  } catch (err) {
    // Another request started the window first (or just took the slot): this one is too soon.
    if (err.code === 11000) return { allowed: false, reason: 'cooldown', retryAfterMs: cooldownMs };
    throw err;
  }
}

// Gives the slot back when the code could not be delivered, so the person can retry straight away.
export function releaseSlot(key) {
  return OtpThrottle.updateOne({ key }, { $inc: { count: -1 }, $set: { lastSentAt: new Date(0) } });
}
