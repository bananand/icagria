import express from 'express';
import {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
} from '../controllers/cropController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCrops);
router.get('/:id', getCropById);

router.post('/', protect, authorize('admin'), createCrop);
router.put('/:id', protect, authorize('admin'), updateCrop);
router.delete('/:id', protect, authorize('admin'), deleteCrop);

export default router;
