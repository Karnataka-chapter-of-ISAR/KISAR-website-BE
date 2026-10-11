import { Router } from 'express';
import { listAdminsController, createAdminController } from '../../controllers/admins.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticateAdmin, asyncHandler(listAdminsController));
router.post('/', authenticateAdmin, asyncHandler(createAdminController));

export default router;
