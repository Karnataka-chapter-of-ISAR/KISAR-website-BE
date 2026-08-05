import { Router } from 'express';
import { getGalleryController } from '../controllers/publicGallery.controller.js';

const router = Router();

router.get('/', getGalleryController);

export default router;
