import multer from 'multer';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf'];

export const uploadNewsBannerImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB cap for banner + attachment
  fileFilter(_req, file, cb) {
    const allowedTypes = file.fieldname === 'attachment' ? ALLOWED_ATTACHMENT_TYPES : ALLOWED_IMAGE_TYPES;
    if (allowedTypes.includes(file.mimetype)) return cb(null, true);

    const message = file.fieldname === 'attachment'
      ? 'Invalid file type. Please upload a PDF document.'
      : 'Invalid file type. Please upload a JPEG, PNG, WEBP, or GIF image.';

    cb(new Error(message));
  },
}).fields([
  { name: 'bannerImage', maxCount: 1 },
  { name: 'attachment', maxCount: 1 },
]);
