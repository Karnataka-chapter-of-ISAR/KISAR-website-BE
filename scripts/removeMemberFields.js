// One-off migration: permanently deletes fields that were dropped from the
// Member schema from every existing member document. Irreversible — back up
// first if the data matters.
// Run with: node scripts/removeMemberFields.js
import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from '../models/Member.js';

dotenv.config();

// Same local-only workaround as app.js: avoids `querySrv ECONNREFUSED` on mongodb+srv:// URIs.
if (process.env.NODE_ENV !== 'production') dns.setServers(['8.8.8.8', '1.1.1.1']);

const REMOVED_FIELDS = ['institution', 'privacy', 'lat', 'lng'];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Raw collection: the fields are no longer in the schema, so a Mongoose update would strip the $unset.
  const result = await Member.collection.updateMany(
    { $or: REMOVED_FIELDS.map((field) => ({ [field]: { $exists: true } })) },
    { $unset: Object.fromEntries(REMOVED_FIELDS.map((field) => [field, ''])) },
  );

  console.log(`Removed ${REMOVED_FIELDS.join(', ')} from ${result.modifiedCount} member(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Removal failed:', err);
  process.exit(1);
});
