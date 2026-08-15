import { Router } from 'express';
import { validateMembersImportController, confirmMembersImportController, createMemberController, updateMemberController, exportMembersController, listMembersAdminController } from '../../controllers/members.controller.js';
import { uploadMembersSheet } from '../../middleware/uploadMembersSheet.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { membersExportImportLimiter } from '../../middleware/membersExportImportLimiter.js';

const router = Router();

router.get('/', authenticateAdmin, listMembersAdminController);
router.post('/', authenticateAdmin, createMemberController);
router.patch('/:id', authenticateAdmin, updateMemberController);
router.get('/export', authenticateAdmin, membersExportImportLimiter, exportMembersController);
router.post('/import/validate', authenticateAdmin, membersExportImportLimiter, uploadMembersSheet, validateMembersImportController);
router.post('/import/:batchId/confirm', authenticateAdmin, membersExportImportLimiter, confirmMembersImportController);

export default router;
