import { Router } from 'express';
import { listPendingEditRequestsAdminController, approveEditRequestController, rejectEditRequestController } from '../../controllers/memberEditRequest.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/', authenticateAdmin, listPendingEditRequestsAdminController);
router.post('/:id/approve', authenticateAdmin, approveEditRequestController);
router.post('/:id/reject', authenticateAdmin, rejectEditRequestController);

export default router;
