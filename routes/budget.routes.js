import express from 'express';
import controller from '../controllers/budget.controller.js';
import allowRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/', controller.createBudget);
router.get('/', allowRoles('manager', 'admin'), controller.getAllBudgets);
router.get('/me', controller.getMyBudgets);

router.patch('/:id/status', allowRoles('manager', 'admin'), controller.updateBudgetStatus);
router.patch('/:id/settle', allowRoles('manager', 'admin'), controller.markBudgetSettled);

router.patch('/:id', controller.updateBudget);
router.delete('/:id', controller.deleteBudget);

export default router;