import express from 'express';
import {
  createDevice,
  getDevices,
  updateDevice,
  regenerateApiKey,
  deleteDevice,
} from '../controllers/deviceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createDevice);
router.get('/', getDevices);
router.put('/:id', updateDevice);
router.post('/:id/regenerate-key', regenerateApiKey);
router.delete('/:id', deleteDevice);

export default router;
