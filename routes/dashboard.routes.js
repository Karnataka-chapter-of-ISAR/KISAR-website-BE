import { Router } from 'express';
import { getDashboardOverviewController } from '../controllers/dashboard.controller.js';
import { authenticateOptionalToken } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticateOptionalToken, asyncHandler(getDashboardOverviewController));

export default router;
