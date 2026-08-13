import { Router } from 'express';
import { getDashboardKpisController } from '../../controllers/dashboard.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/kpis', authenticateAdmin, getDashboardKpisController);

export default router;
