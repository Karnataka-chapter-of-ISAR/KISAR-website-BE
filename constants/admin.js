// Bootstrap super admin: always a super admin, even if its stored flag is unset,
// so there is always someone who can promote others.
export const SUPER_ADMIN_EMAIL = 'kisar.admin@gmail.com';

// Dev-only login bypass user (see adminAuth.service.js); also a super admin outside production.
const DEV_SUPER_ADMIN_EMAIL = 'test@gmail.com';

// Takes an Admin record: super admins are the bootstrap/dev emails plus anyone
// promoted via the stored isSuperAdmin flag.
export function isSuperAdmin(admin) {
  if (!admin) return false;
  if (admin.isSuperAdmin === true) return true;
  if (typeof admin.email !== 'string') return false;

  const email = admin.email.toLowerCase().trim();
  if (email === SUPER_ADMIN_EMAIL) return true;
  return process.env.NODE_ENV !== 'production' && email === DEV_SUPER_ADMIN_EMAIL;
}
