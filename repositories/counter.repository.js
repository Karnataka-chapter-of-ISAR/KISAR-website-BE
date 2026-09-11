import Counter from '../models/Counter.js';

// Atomically reserves `count` consecutive sequence numbers and returns the
// first one in the reserved range, e.g. reserving 3 from seq=5 returns 6
// and leaves the counter at 8.
export async function reserveSequenceRange(name, count, session) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: count } },
    { new: true, upsert: true, session },
  );
  return counter.seq - count + 1;
}
