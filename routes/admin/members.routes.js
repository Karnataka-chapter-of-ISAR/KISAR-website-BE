import { Router } from 'express';
import { validateMembersImportController, confirmMembersImportController, createMemberController, updateMemberController, exportMembersController, listMembersAdminController, listSpecializationsController } from '../../controllers/members.controller.js';
import { uploadMembersSheet } from '../../middleware/uploadMembersSheet.js';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.js';
import { membersExportImportLimiter } from '../../middleware/membersExportImportLimiter.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticateAdmin, asyncHandler(listMembersAdminController));
router.get('/specializations', authenticateAdmin, asyncHandler(listSpecializationsController));
router.post('/', authenticateAdmin, asyncHandler(createMemberController));
router.patch('/:id', authenticateAdmin, asyncHandler(updateMemberController));
router.get('/export', authenticateAdmin, membersExportImportLimiter, asyncHandler(exportMembersController));
router.post('/import/validate', authenticateAdmin, membersExportImportLimiter, uploadMembersSheet, asyncHandler(validateMembersImportController));
router.post('/import/:batchId/confirm', authenticateAdmin, membersExportImportLimiter, asyncHandler(confirmMembersImportController));

export default router;
