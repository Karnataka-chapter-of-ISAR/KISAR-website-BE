import Admin from '../models/Admin.js';

export function findAdminByEmail(email) {
  return Admin.findOne({ email: email.toLowerCase().trim() }).lean();
}

export function listAdmins() {
  return Admin.find().sort({ createdAt: -1 }).lean();
}

export async function createAdmin({ name, email, isSuperAdmin = false }) {
  const admin = await Admin.create({ name, email, isSuperAdmin });
  return admin.toObject();
}

export function findAdminById(adminId) {
  return Admin.findById(adminId).lean();
}

export function deleteAdmin(adminId) {
  return Admin.findByIdAndDelete(adminId).lean();
}

export function upsertAdmin({ name, email }) {
  return Admin.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $setOnInsert: { name } },
    { upsert: true, new: true },
  ).lean();
}
