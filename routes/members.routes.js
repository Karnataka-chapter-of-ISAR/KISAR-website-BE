import { Router } from 'express';
import { listMembersController, getOwnProfileController } from '../controllers/members.controller.js';
import { submitProfileEditController, listOwnEditRequestsController, listOwnNotificationsController } from '../controllers/memberEditRequest.controller.js';
import { authenticateToken } from '../middleware/authenticate.js';

const router = Router();

router.get('/me', authenticateToken, getOwnProfileController);
router.patch('/me', authenticateToken, submitProfileEditController);
router.get('/me/edit-requests', authenticateToken, listOwnEditRequestsController);
router.get('/me/notifications', authenticateToken, listOwnNotificationsController);
router.get('/', authenticateToken, listMembersController);

export default router;
