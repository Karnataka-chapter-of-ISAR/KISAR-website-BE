import { Router } from 'express';
import { getAdminGalleryController, createGalleryController, updateGalleryController, deleteGalleryController } from '../../controllers/gallery.controller.js';
import { uploadGalleryImage } from '../../middleware/uploadGalleryImage.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticateAdmin, asyncHandler(getAdminGalleryController));
router.post('/', authenticateAdmin, uploadGalleryImage, asyncHandler(createGalleryController));
router.put('/:id', authenticateAdmin, uploadGalleryImage, asyncHandler(updateGalleryController));
router.delete('/:id', authenticateAdmin, asyncHandler(deleteGalleryController));

export default router;
