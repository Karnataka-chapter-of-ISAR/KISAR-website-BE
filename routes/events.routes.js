import { Router } from 'express';
import { getEventsController } from '../controllers/events.controller.js';
import { authenticateToken } from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticateToken, getEventsController);

export default router;
