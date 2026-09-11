import { Router } from 'express';
import { listMembersController, filterMembersController, getOwnProfileController, listSpecializationsController } from '../controllers/members.controller.js';
import { submitProfileEditController, listOwnEditRequestsController, listOwnNotificationsController } from '../controllers/memberEditRequest.controller.js';
import { authenticateToken } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/me', authenticateToken, asyncHandler(getOwnProfileController));
router.patch('/me', authenticateToken, asyncHandler(submitProfileEditController));
router.get('/me/edit-requests', authenticateToken, asyncHandler(listOwnEditRequestsController));
router.get('/me/notifications', authenticateToken, asyncHandler(listOwnNotificationsController));
router.get('/filter', authenticateToken, asyncHandler(filterMembersController));
router.get('/specializations', asyncHandler(listSpecializationsController));
router.get('/', authenticateToken, asyncHandler(listMembersController));

export default router;
