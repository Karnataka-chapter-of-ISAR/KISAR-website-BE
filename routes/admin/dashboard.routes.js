import { Router } from 'express';
import { getDashboardKpisController, getDashboardOverviewController } from '../../controllers/dashboard.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/kpis', authenticateAdmin, getDashboardKpisController);
router.get('/overview', getDashboardOverviewController);

export default router;
