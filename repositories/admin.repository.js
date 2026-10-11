import Admin from '../models/Admin.js';

export function findAdminByEmail(email) {
  return Admin.findOne({ email: email.toLowerCase().trim() }).lean();
}

export function listAdmins() {
  return Admin.find().sort({ createdAt: -1 }).lean();
}

export async function createAdmin({ name, email }) {
  const admin = await Admin.create({ name, email });
  return admin.toObject();
}

export function upsertAdmin({ name, email }) {
  return Admin.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $setOnInsert: { name } },
    { upsert: true, new: true },
  ).lean();
}
