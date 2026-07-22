import { Router } from 'express';
import { getNewsController, getNewsByIdController } from '../controllers/publicNews.controller.js';

const router = Router();

router.get('/', getNewsController);
router.get('/:id', getNewsByIdController);

export default router;
