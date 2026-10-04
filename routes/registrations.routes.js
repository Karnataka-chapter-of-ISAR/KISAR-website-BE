import { Router } from 'express';
import { getRegistrationStatusController } from '../controllers/registration.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/:orderId/status', asyncHandler(getRegistrationStatusController));

export default router;
