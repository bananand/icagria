import Alert from '../models/Alert.js';
import Farm from '../models/Farm.js';
import PhReading from '../models/PhReading.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getFarmForUser } from '../utils/farmAccess.js';
import { evaluatePh } from '../utils/phStatus.js';
import { createPhAlertIfNeeded } from '../utils/alertService.js';

// @desc    Get user's alerts
// @route   GET /api/alerts
// @access  Protected
export const getAlerts = asyncHandler(async (req, res) => {
  const { unread, farmId, limit = 50 } = req.query;

  const filter = { user: req.user._id };

  if (unread === 'true') {
    filter.isRead = false;
  }

  if (farmId) {
    filter.farm = farmId;
  }

  const maxLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

  const alerts = await Alert.find(filter)
    .sort({ createdAt: -1 })
    .limit(maxLimit)
    .populate('farm', 'name')
    .populate('reading', 'value recordedAt');

  res.status(200).json({
    success: true,
    data: alerts,
  });
});

// @desc    Get count of unread alerts
// @route   GET /api/alerts/unread-count
// @access  Protected
export const getUnreadAlertsCount = asyncHandler(async (req, res) => {
  const count = await Alert.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    data: {
      count,
    },
  });
});

// @desc    Mark all user's alerts as read
// @route   PUT /api/alerts/read-all
// @access  Protected
export const markAllAlertsRead = asyncHandler(async (req, res) => {
  await Alert.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: 'All alerts marked as read',
  });
});

// @desc    Mark single alert as read
// @route   PUT /api/alerts/:id/read
// @access  Protected
export const markAlertRead = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!alert) {
    return next(new ApiError(404, 'Alert not found'));
  }

  alert.isRead = true;
  await alert.save();

  res.status(200).json({
    success: true,
    data: alert,
  });
});

// @desc    Delete single alert
// @route   DELETE /api/alerts/:id
// @access  Protected
export const deleteAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!alert) {
    return next(new ApiError(404, 'Alert not found'));
  }

  await alert.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Alert deleted successfully',
  });
});

// @desc    Scan readings and create alerts for out-of-range readings
// @route   POST /api/alerts/scan
// @access  Protected/Farmer
export const scanAlerts = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'farmer') {
    return next(new ApiError(403, 'Forbidden: Only farmers can trigger alert scans'));
  }

  const { farmId, days = 7 } = req.body;

  if (!farmId) {
    return next(new ApiError(400, 'farmId is required'));
  }

  const farm = await getFarmForUser(req.user, farmId, { write: true });
  await farm.populate('mainCrop');

  if (!farm.mainCrop) {
    return next(new ApiError(400, 'Farm must have a main crop configured to scan for alerts'));
  }

  const numDays = Math.min(90, Math.max(1, parseInt(days, 10) || 7));
  const sinceDate = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000);

  const readings = await PhReading.find({
    farm: farm._id,
    recordedAt: { $gte: sinceDate },
  });

  let created = 0;
  let alreadyAlerted = 0;

  for (const reading of readings) {
    const evaluation = evaluatePh(reading.value, farm.mainCrop);
    if (evaluation.status === 'too_acidic' || evaluation.status === 'too_alkaline') {
      const existingAlert = await Alert.findOne({ reading: reading._id });
      if (existingAlert) {
        alreadyAlerted++;
      } else {
        await createPhAlertIfNeeded(farm, reading);
        created++;
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      created,
      alreadyAlerted,
    },
  });
});
