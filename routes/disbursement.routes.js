import express from 'express';
import controller from '../controllers/disbursement.controller.js';
import allowRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/', allowRoles('manager', 'admin'), controller.getAllDisbursements);
router.get('/export', allowRoles('manager', 'admin'), controller.exportDisbursement);

export default router;