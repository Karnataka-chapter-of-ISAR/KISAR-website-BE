import { Router } from 'express';
import { getDashboardKpisController, getRecentActivityController } from '../../controllers/dashboard.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/kpis', authenticateAdmin, asyncHandler(getDashboardKpisController));
router.get('/activity', authenticateAdmin, asyncHandler(getRecentActivityController));

export default router;
