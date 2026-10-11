import express from 'express';
import {
  getAlerts,
  getUnreadAlertsCount,
  markAllAlertsRead,
  markAlertRead,
  deleteAlert,
  scanAlerts,
} from '../controllers/alertController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAlerts);
router.get('/unread-count', getUnreadAlertsCount);
router.put('/read-all', markAllAlertsRead);
router.put('/:id/read', markAlertRead);
router.delete('/:id', deleteAlert);
router.post('/scan', scanAlerts);

export default router;
