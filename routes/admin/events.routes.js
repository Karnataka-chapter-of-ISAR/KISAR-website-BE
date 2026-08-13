import { Router } from 'express';
import { createEventController, updateEventController, deleteEventController, getEventAttendeesController } from '../../controllers/events.controller.js';
import { getEventsController } from '../../controllers/publicEvents.controller.js';
import { uploadBannerImage } from '../../middleware/uploadBannerImage.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/', authenticateAdmin, getEventsController);
router.post('/', authenticateAdmin, uploadBannerImage, createEventController);
router.patch('/:id', authenticateAdmin, uploadBannerImage, updateEventController);
router.delete('/:id', authenticateAdmin, deleteEventController);
router.get('/:id/attendees', authenticateAdmin, getEventAttendeesController);

export default router;
