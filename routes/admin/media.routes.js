import { Router } from 'express';
import { uploadMediaController } from '../../controllers/media.controller.js';
import { uploadMediaImage } from '../../middleware/uploadMediaImage.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/', authenticateAdmin, uploadMediaImage, asyncHandler(uploadMediaController));

export default router;
