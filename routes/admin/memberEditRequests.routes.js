import { Router } from 'express';
import { listEditRequestsAdminController, approveEditRequestController, rejectEditRequestController } from '../../controllers/memberEditRequest.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/', authenticateAdmin, listEditRequestsAdminController);
router.post('/:id/approve', authenticateAdmin, approveEditRequestController);
router.post('/:id/reject', authenticateAdmin, rejectEditRequestController);

export default router;
