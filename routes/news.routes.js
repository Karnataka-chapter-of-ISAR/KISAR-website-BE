import { Router } from 'express';
import { getNewsController, getNewsByIdController } from '../controllers/publicNews.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getNewsController));
router.get('/:id', asyncHandler(getNewsByIdController));

export default router;
