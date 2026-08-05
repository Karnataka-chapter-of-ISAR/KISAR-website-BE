import { Router } from 'express';
import { getAdminGalleryController, createGalleryController, updateGalleryController, deleteGalleryController } from '../../controllers/gallery.controller.js';
import { uploadGalleryImage } from '../../middleware/uploadGalleryImage.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/', authenticateAdmin, getAdminGalleryController);
router.post('/', authenticateAdmin, uploadGalleryImage, createGalleryController);
router.put('/:id', authenticateAdmin, uploadGalleryImage, updateGalleryController);
router.delete('/:id', authenticateAdmin, deleteGalleryController);

export default router;
