import { Router } from 'express';
import { createEventController, updateEventController, deleteEventController, getEventAttendeesController, exportEventAttendeesController, uploadEventImageController } from '../../controllers/events.controller.js';
import { initiateEventRefundsController, getEventRefundsController } from '../../controllers/refund.controller.js';
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
router.post('/:id/refunds', authenticateAdmin, asyncHandler(initiateEventRefundsController));
router.get('/:id/refunds', authenticateAdmin, asyncHandler(getEventRefundsController));
router.get('/:id/attendees/export', authenticateAdmin, asyncHandler(exportEventAttendeesController));
router.get('/:id/attendees', authenticateAdmin, asyncHandler(getEventAttendeesController));

export default router;
