import express from 'express';
import controller from '../controllers/reimbursement.controller.js';
import allowRoles from '../middleware/role.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/', upload.single('receipt'), controller.createReimbursement);
router.get('/', allowRoles('manager', 'admin'), controller.getAllReimbursements);
router.get('/me', controller.getMyReimbursements);
router.get('/export', allowRoles('admin', 'manager'), controller.exportReimbursementsRequest);
router.patch('/settle', allowRoles('admin', 'manager'), controller.markReimbursementsSettled);

router.patch('/:id/status', allowRoles('manager', 'admin'), controller.updateReimbursementStatus);
router.patch('/:id/settle', allowRoles('admin', 'manager'), controller.markReimbursementSettled);

router.patch('/:id', upload.single('receipt'), controller.updateReimbursement);
router.delete('/:id', controller.deleteReimbursement);
export default router;