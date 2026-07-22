import { Router } from 'express';
import { listMembersController } from '../controllers/members.controller.js';
import { authenticateToken } from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticateToken, listMembersController);

export default router;
