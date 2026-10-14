import { Router } from 'express';
import { listAdminsController, createAdminController, deleteAdminController } from '../../controllers/admins.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { requireSuperAdmin } from '../../middleware/requireSuperAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticateAdmin, asyncHandler(listAdminsController));
router.post('/', authenticateAdmin, requireSuperAdmin, asyncHandler(createAdminController));
router.delete('/:id', authenticateAdmin, requireSuperAdmin, asyncHandler(deleteAdminController));

export default router;
