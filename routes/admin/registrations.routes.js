import { Router } from 'express';
import { refundRegistrationController } from '../../controllers/refund.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/:id/refund', authenticateAdmin, asyncHandler(refundRegistrationController));

export default router;
