import { Router } from 'express';
import { getAdminNewsController, createNewsController, updateNewsController, deleteNewsController } from '../../controllers/news.controller.js';
import { uploadNewsBannerImage } from '../../middleware/uploadNewsBannerImage.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticateAdmin, asyncHandler(getAdminNewsController));
router.post('/', authenticateAdmin, uploadNewsBannerImage, asyncHandler(createNewsController));
router.put('/:id', authenticateAdmin, uploadNewsBannerImage, asyncHandler(updateNewsController));
router.delete('/:id', authenticateAdmin, asyncHandler(deleteNewsController));

export default router;
