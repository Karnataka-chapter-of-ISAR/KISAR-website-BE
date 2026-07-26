// One-off migration: assigns memberId (KISAR-0001, KISAR-0002, ...) to every
// existing member that doesn't have one yet, ordered by createdAt, then
// advances the shared counter so new imports continue the sequence.
// Run with: node scripts/backfillMemberId.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from '../models/Member.js';
import Counter from '../models/Counter.js';
import { formatMemberId } from '../utils/memberId.js';

dotenv.config();

const MEMBER_ID_COUNTER = 'memberId';
const EXCLUDED_EMAILS = ['test1@gmail.com'];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const members = await Member.find({ memberId: null, email: { $nin: EXCLUDED_EMAILS } }).sort({ createdAt: 1 }).select('_id');

  const startingCounter = await Counter.findById(MEMBER_ID_COUNTER);
  let seq = startingCounter?.seq ?? 0;

  for (const member of members) {
    seq += 1;
    await Member.updateOne({ _id: member._id }, { $set: { memberId: formatMemberId(seq) } });
  }

  await Counter.findByIdAndUpdate(MEMBER_ID_COUNTER, { $set: { seq } }, { upsert: true });

  console.log(`Backfilled ${members.length} member(s). Counter now at ${seq}.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
