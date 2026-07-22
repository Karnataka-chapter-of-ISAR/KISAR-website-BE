import { Router } from 'express';
import { listMembersController, getOwnProfileController } from '../controllers/members.controller.js';
import { authenticateToken } from '../middleware/authenticate.js';

const router = Router();

router.get('/me', authenticateToken, getOwnProfileController);
router.get('/', authenticateToken, listMembersController);

export default router;
