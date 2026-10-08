import { Router } from 'express';
import { sendBulkMailController } from '../../controllers/mail.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/send', authenticateAdmin, asyncHandler(sendBulkMailController));

export default router;
