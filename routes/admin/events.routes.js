import { Router } from 'express';
import { createEventController, getEventsController } from '../../controllers/events.controller.js';
import { uploadBannerImage } from '../../middleware/uploadBannerImage.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/', authenticateAdmin, getEventsController);
router.post('/', authenticateAdmin, uploadBannerImage, createEventController);

export default router;
