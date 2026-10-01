// Creates (or leaves untouched) an Admin record. The email must match the
// Netlify Identity login used on the admin UI, since admin access is checked
// against this collection after Netlify verifies the token.
// Run with: node scripts/createAdmin.js "Full Name" admin@example.com
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const [name, email] = process.argv.slice(2);

if (!name || !email) {
  console.error('Usage: node scripts/createAdmin.js "Full Name" admin@example.com');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.log(`Admin already exists: ${existing.email}`);
  } else {
    const admin = await Admin.create({ name, email });
    console.log(`Created admin: ${admin.email}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Create admin failed:', err);
  process.exit(1);
});
