import { Router } from 'express';
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
} from '../../controllers/category.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticateAdmin, asyncHandler(getCategoriesController));
router.post('/', authenticateAdmin, asyncHandler(createCategoryController));
router.delete('/:id', authenticateAdmin, asyncHandler(deleteCategoryController));

export default router;
