import express from 'express';
import {
  getAdminStats,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users/:id', getAdminUserById);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);

export default router;
