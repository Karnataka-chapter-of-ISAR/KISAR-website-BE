import { Router } from 'express';
import { getGalleryController } from '../controllers/publicGallery.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getGalleryController));

export default router;
