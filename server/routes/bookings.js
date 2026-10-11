import express from 'express';
import {
  createBooking,
  getBookings,
  cancelBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('farmer'), createBooking);
router.get('/', authorize('farmer', 'admin'), getBookings);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/status', authorize('admin'), updateBookingStatus);

export default router;
