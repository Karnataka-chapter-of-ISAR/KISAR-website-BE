import { Router } from 'express';
import { getEventsController } from '../controllers/publicEvents.controller.js';
import { getMyEventsController, registerForEventController } from '../controllers/events.controller.js';
import { authenticateToken } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getEventsController));
router.get('/me', authenticateToken, asyncHandler(getMyEventsController));
router.post('/:id/register', authenticateToken, asyncHandler(registerForEventController));

export default router;
