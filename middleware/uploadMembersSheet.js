import multer from 'multer';
import { MESSAGES } from '../constants/messages.js';

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error(MESSAGES.MEMBERS.INVALID_FILE_TYPE));
  },
});

export const uploadMembersSheet = upload.single('file');
