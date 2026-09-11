import { Router } from 'express';
import { getDashboardKpisController } from '../../controllers/dashboard.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/kpis', authenticateAdmin, asyncHandler(getDashboardKpisController));

export default router;
