import express from 'express';
import controller from '../controllers/user.controller.js';
import allowRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/', allowRoles('admin'), controller.register);

router.get('/me', controller.getMyProfile);
router.patch('/me', controller.updateMyProfile);

router.get('/', allowRoles('manager', 'admin'), controller.getAllUsers);
router.get('/role/:role', allowRoles('manager', 'admin'), controller.getUsersByRole);
router.get('/:id', allowRoles('manager', 'admin'), controller.getUserById);

export default router;