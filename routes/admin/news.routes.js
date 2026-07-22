import { Router } from 'express';
import { getAdminNewsController, createNewsController, updateNewsController, deleteNewsController } from '../../controllers/news.controller.js';
import { uploadNewsBannerImage } from '../../middleware/uploadNewsBannerImage.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/', authenticateAdmin, getAdminNewsController);
router.post('/', authenticateAdmin, uploadNewsBannerImage, createNewsController);
router.put('/:id', authenticateAdmin, uploadNewsBannerImage, updateNewsController);
router.delete('/:id', authenticateAdmin, deleteNewsController);

export default router;
