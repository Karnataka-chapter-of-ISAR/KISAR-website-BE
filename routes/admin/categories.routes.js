import { Router } from 'express';
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
} from '../../controllers/category.controller.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/', authenticateAdmin, getCategoriesController);
router.post('/', authenticateAdmin, createCategoryController);
router.delete('/:id', authenticateAdmin, deleteCategoryController);

export default router;
