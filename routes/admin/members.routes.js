import { Router } from 'express';
import { validateMembersImportController, confirmMembersImportController, createMemberController, updateMemberController, exportMembersController, listMembersAdminController } from '../../controllers/members.controller.js';
import { uploadMembersSheet } from '../../middleware/uploadMembersSheet.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';

const router = Router();

router.get('/', authenticateAdmin, listMembersAdminController);
router.post('/', authenticateAdmin, createMemberController);
router.put('/:id', authenticateAdmin, updateMemberController);
router.get('/export', authenticateAdmin, exportMembersController);
router.post('/import/validate', authenticateAdmin, uploadMembersSheet, validateMembersImportController);
router.post('/import/:batchId/confirm', authenticateAdmin, confirmMembersImportController);

export default router;
