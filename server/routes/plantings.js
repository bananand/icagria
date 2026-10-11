import express from 'express';
import {
  createPlanting,
  getPlantings,
  getPlantingById,
  updatePlanting,
  deletePlanting,
} from '../controllers/plantingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createPlanting);
router.get('/', getPlantings);
router.get('/:id', getPlantingById);
router.put('/:id', updatePlanting);
router.delete('/:id', deletePlanting);

export default router;
