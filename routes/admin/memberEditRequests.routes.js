import { Router } from 'express';
import { listEditRequestsAdminController, listAdminNotificationsController, approveEditRequestController, rejectEditRequestController } from '../../controllers/memberEditRequest.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/notifications', authenticateAdmin, asyncHandler(listAdminNotificationsController));
router.get('/', authenticateAdmin, asyncHandler(listEditRequestsAdminController));
router.post('/:id/approve', authenticateAdmin, asyncHandler(approveEditRequestController));
router.post('/:id/reject', authenticateAdmin, asyncHandler(rejectEditRequestController));

export default router;
