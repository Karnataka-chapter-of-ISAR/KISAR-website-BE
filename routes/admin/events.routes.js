import { Router } from 'express';
import { createEventController, updateEventController, deleteEventController, getEventAttendeesController, uploadEventImageController } from '../../controllers/events.controller.js';
import { getEventsController } from '../../controllers/publicEvents.controller.js';
import { uploadBannerImage } from '../../middleware/uploadBannerImage.js';
import { uploadEventImage } from '../../middleware/uploadEventImage.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticateAdmin, asyncHandler(getEventsController));
router.post('/', authenticateAdmin, uploadBannerImage, asyncHandler(createEventController));
router.post('/images', authenticateAdmin, uploadEventImage, asyncHandler(uploadEventImageController));
router.patch('/:id', authenticateAdmin, uploadBannerImage, asyncHandler(updateEventController));
router.delete('/:id', authenticateAdmin, asyncHandler(deleteEventController));
router.get('/:id/attendees', authenticateAdmin, asyncHandler(getEventAttendeesController));

export default router;
