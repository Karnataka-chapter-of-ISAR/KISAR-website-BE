import { Router } from 'express';
import { getEventsController } from '../controllers/publicEvents.controller.js';
import { getMyEventsController, registerForEventController } from '../controllers/events.controller.js';
import { authenticateToken } from '../middleware/authenticate.js';

const router = Router();

router.get('/', getEventsController);
router.get('/me', authenticateToken, getMyEventsController);
router.post('/:id/register', authenticateToken, registerForEventController);

export default router;
