import { Router } from 'express';
import { validateMembersImportController, confirmMembersImportController } from '../../controllers/members.controller.js';
import { uploadMembersSheet } from '../../middleware/uploadMembersSheet.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.post('/import/validate', authenticateAdmin, uploadMembersSheet, validateMembersImportController);
router.post('/import/:batchId/confirm', authenticateAdmin, confirmMembersImportController);

export default router;
