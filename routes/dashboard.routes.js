import { Router } from 'express';
import { getDashboardOverviewController } from '../controllers/dashboard.controller.js';
import { authenticateOptionalToken } from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticateOptionalToken, getDashboardOverviewController);

export default router;
