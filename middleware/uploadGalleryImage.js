import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// NOTE: local disk storage is temporary for dev/demo purposes — Render's free tier
// wipes this on every redeploy/restart. Swap for Cloudflare R2 (or similar) before prod.
export const GALLERY_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'gallery');
fs.mkdirSync(GALLERY_UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, GALLERY_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadGalleryImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type. Please upload a JPEG, PNG, WEBP, or GIF image.'));
  },
}).single('image');
