import { Router } from 'express';
import { importMembersController } from '../controllers/members.controller.js';
import { uploadMembersSheet } from '../middleware/uploadMembersSheet.js';
import { authenticateToken } from '../middleware/authenticate.js';

const router = Router();

router.post('/import', authenticateToken, uploadMembersSheet, importMembersController);

export default router;
