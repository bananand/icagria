import express from 'express';
import { getFarmSummary, getSalesReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('farmer'));

router.get('/farm-summary', getFarmSummary);
router.get('/sales', getSalesReport);

export default router;
