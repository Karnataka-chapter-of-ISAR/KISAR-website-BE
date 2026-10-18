// One-off migration: renames Member.linkedin to Member.socialMedia on existing documents.
// Run with: node scripts/renameLinkedinToSocialMedia.js
// Afterwards re-run `npm run search:index` so the search index picks up the new field.
import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from '../models/Member.js';

dotenv.config();

// Same local-only workaround as app.js: avoids `querySrv ECONNREFUSED` on mongodb+srv:// URIs.
if (process.env.NODE_ENV !== 'production') dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Raw collection: `linkedin` is no longer in the schema, so a Mongoose update would strip the $rename.
  const result = await Member.collection.updateMany(
    { linkedin: { $exists: true } },
    { $rename: { linkedin: 'socialMedia' } },
  );

  console.log(`Renamed linkedin to socialMedia on ${result.modifiedCount} member(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Rename failed:', err);
  process.exit(1);
});
