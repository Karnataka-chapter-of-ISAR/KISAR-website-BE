import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';
import { uploadBufferToS3, generateObjectKey } from '../utils/s3.js';

// Generic upload for CMS fields that store a plain URL rather than owning a
// DB record (e.g. Decap CMS media fields for Leadership/Presidents/Exec/Subcommittees).
export async function uploadMediaController(req, res) {
  if (!req.file) {
    return sendError(res, {
      message: MESSAGES.UPLOAD.UPLOAD_ERROR,
      statusCode: 422,
      data: { errors: [MESSAGES.UPLOAD.FILE_REQUIRED] },
    });
  }

  const url = await uploadBufferToS3({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    key: generateObjectKey('media', req.file.originalname),
  });

  return sendSuccess(res, {
    message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
    statusCode: 201,
    data: { url },
  });
}
