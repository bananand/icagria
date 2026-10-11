import express from 'express';
import {
  createInquiry,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
} from '../controllers/inquiryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createInquiry);
router.get('/', getInquiries);
router.put('/:id/status', updateInquiryStatus);
router.delete('/:id', deleteInquiry);

export default router;
