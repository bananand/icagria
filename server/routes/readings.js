import express from 'express';
import {
  createDeviceReading,
  simulateReading,
  getReadings,
  getLatestReading,
  getReadingsSummary,
  deleteReading,
} from '../controllers/readingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Hardware device ingestion (authenticated via x-device-key header, no JWT)
router.post('/', createDeviceReading);

// User-authenticated endpoints
router.post('/simulate', protect, simulateReading);
router.get('/', protect, getReadings);
router.get('/latest', protect, getLatestReading);
router.get('/summary', protect, getReadingsSummary);
router.delete('/:id', protect, deleteReading);

export default router;
