// Creates (or updates) the Atlas Search index the member directory search
// depends on — see repositories/member.repository.js searchMembersForAdmin
// and constants/members.js MEMBER_SEARCH_INDEX_DEFINITION.
//
// Atlas Search indexes live per-cluster, so this must be run once against
// every environment (dev, prod, ...) that serves the admin members search.
// Index builds happen asynchronously in Atlas — give it a few minutes before
// relying on it, and check status in Atlas UI (Search tab) or via
// `listSearchIndexes()`.
//
// Run with:      node scripts/createMemberSearchIndex.js
// Against prod:  ENV_FILE=.env.prod node scripts/createMemberSearchIndex.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MEMBER_SEARCH_INDEX_NAME, MEMBER_SEARCH_INDEX_DEFINITION } from '../constants/members.js';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.collection('members');

  const existing = await collection.listSearchIndexes(MEMBER_SEARCH_INDEX_NAME).toArray();

  if (existing.length > 0) {
    console.log(`Search index "${MEMBER_SEARCH_INDEX_NAME}" already exists — updating its definition.`);
    await collection.updateSearchIndex(MEMBER_SEARCH_INDEX_NAME, MEMBER_SEARCH_INDEX_DEFINITION);
  } else {
    console.log(`Creating search index "${MEMBER_SEARCH_INDEX_NAME}"...`);
    await collection.createSearchIndex({ name: MEMBER_SEARCH_INDEX_NAME, definition: MEMBER_SEARCH_INDEX_DEFINITION });
  }

  console.log('Requested. Index build/update happens asynchronously on Atlas — check the Search tab for status.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to create/update search index:', err);
  process.exit(1);
});
