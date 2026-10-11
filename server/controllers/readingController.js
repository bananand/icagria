import Device from '../models/Device.js';
import Farm from '../models/Farm.js';
import PhReading from '../models/PhReading.js';
import Planting from '../models/Planting.js';
import Alert from '../models/Alert.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { evaluatePh } from '../utils/phStatus.js';
import { getFarmForUser } from '../utils/farmAccess.js';
import { createPhAlertIfNeeded } from '../utils/alertService.js';

// @desc    Record reading from hardware device (No JWT, x-device-key auth)
// @route   POST /api/readings
// @access  Public (Device API Key authenticated)
export const createDeviceReading = asyncHandler(async (req, res, next) => {
  const deviceKey = req.headers['x-device-key'];

  if (!deviceKey) {
    return next(new ApiError(401, 'Device authentication key is missing'));
  }

  const device = await Device.findOne({ apiKey: deviceKey }).select('+apiKey');
  if (!device) {
    return next(new ApiError(401, 'Invalid device key'));
  }

  if (device.status !== 'active') {
    return next(new ApiError(403, 'Device is inactive'));
  }

  const { value, recordedAt } = req.body;

  if (value === undefined || value === null || isNaN(Number(value)) || !isFinite(Number(value))) {
    return next(new ApiError(400, 'Reading value must be a valid number'));
  }

  const numValue = Number(value);
  if (numValue < 0 || numValue > 14) {
    return next(new ApiError(400, 'pH reading value must be between 0 and 14'));
  }

  const now = Date.now();
  const recDate = recordedAt ? new Date(recordedAt) : new Date(now);

  if (isNaN(recDate.getTime())) {
    return next(new ApiError(400, 'Invalid recordedAt timestamp'));
  }

  // Ensure recordedAt is not more than 5 minutes in the future
  if (recDate.getTime() > now + 5 * 60 * 1000) {
    return next(new ApiError(400, 'recordedAt cannot be more than 5 minutes in the future'));
  }

  const reading = await PhReading.create({
    device: device._id,
    farm: device.farm,
    value: Math.round(numValue * 100) / 100,
    recordedAt: recDate,
    source: 'device',
  });

  device.lastSeenAt = recDate;
  await device.save();

  const farm = await Farm.findById(device.farm).populate('mainCrop');
  await createPhAlertIfNeeded(farm, reading);

  const evaluation = evaluatePh(reading.value, farm.mainCrop);

  res.status(201).json({
    success: true,
    data: {
      reading,
      evaluation,
    },
  });
});

// @desc    Simulate reading for farm device
// @route   POST /api/readings/simulate
// @access  Protected/Farmer
export const simulateReading = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'farmer') {
    return next(new ApiError(403, 'Forbidden: Only farmers can simulate readings'));
  }

  const { deviceId, mode = 'auto' } = req.body;

  if (!deviceId) {
    return next(new ApiError(400, 'deviceId is required'));
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    return next(new ApiError(404, 'Device not found'));
  }

  // Ensure user owns the farm
  const farm = await getFarmForUser(req.user, device.farm, { write: true });
  await farm.populate('mainCrop');

  if (device.status !== 'active') {
    return next(new ApiError(400, 'Device must be active to simulate readings'));
  }

  if (!farm.mainCrop) {
    return next(new ApiError(400, 'Farm must have a main crop configured to simulate readings'));
  }

  const { phMin, phMax } = farm.mainCrop;
  const midpoint = (phMin + phMax) / 2;

  let val;
  if (mode === 'low') {
    // Below phMin by 0.3 to 0.8
    val = phMin - (0.3 + Math.random() * 0.5);
  } else if (mode === 'high') {
    // Above phMax by 0.3 to 0.8
    val = phMax + (0.3 + Math.random() * 0.5);
  } else {
    // Auto mode: last reading or midpoint + pull towards midpoint + uniform noise +/-0.15
    const lastReading = await PhReading.findOne({ device: device._id }).sort({ recordedAt: -1 });
    const base = lastReading ? lastReading.value : midpoint;
    const gap = midpoint - base;
    const pull = 0.15 * gap;
    const noise = (Math.random() * 2 - 1) * 0.15;
    val = base + pull + noise;
  }

  const finalValue = Math.round(Math.min(14, Math.max(0, val)) * 100) / 100;
  const now = new Date();

  const reading = await PhReading.create({
    device: device._id,
    farm: farm._id,
    value: finalValue,
    recordedAt: now,
    source: 'simulated',
  });

  device.lastSeenAt = now;
  await device.save();

  const alert = await createPhAlertIfNeeded(farm, reading);
  const evaluation = evaluatePh(reading.value, farm.mainCrop);

  res.status(201).json({
    success: true,
    data: {
      reading,
      evaluation,
      alert: alert || null,
    },
  });
});

// @desc    Get historical readings
// @route   GET /api/readings
// @access  Protected (Farmer/Admin)
export const getReadings = asyncHandler(async (req, res, next) => {
  const { farmId, deviceId, days = 7, limit = 500 } = req.query;

  if (!farmId) {
    return next(new ApiError(400, 'farmId query parameter is required'));
  }

  const farm = await getFarmForUser(req.user, farmId, { write: false });
  await farm.populate('mainCrop');

  const numDays = Math.min(90, Math.max(1, parseInt(days, 10) || 7));
  const maxLimit = Math.min(2000, Math.max(1, parseInt(limit, 10) || 500));

  const sinceDate = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000);

  const filter = {
    farm: farm._id,
    recordedAt: { $gte: sinceDate },
  };

  if (deviceId) {
    filter.device = deviceId;
  }

  const rawReadings = await PhReading.find(filter)
    .sort({ recordedAt: 1 })
    .limit(maxLimit)
    .populate('device', 'name source status');

  const readings = rawReadings.map((r) => {
    const status = evaluatePh(r.value, farm.mainCrop).status;
    return {
      ...r.toObject(),
      status,
    };
  });

  const range = farm.mainCrop
    ? {
        min: farm.mainCrop.phMin,
        max: farm.mainCrop.phMax,
        cropName: farm.mainCrop.name,
      }
    : null;

  res.status(200).json({
    success: true,
    data: {
      readings,
      count: readings.length,
      range,
    },
  });
});

// @desc    Get latest reading and crop status evaluations
// @route   GET /api/readings/latest
// @access  Protected (Farmer/Admin)
export const getLatestReading = asyncHandler(async (req, res, next) => {
  const { farmId } = req.query;

  if (!farmId) {
    return next(new ApiError(400, 'farmId query parameter is required'));
  }

  const farm = await getFarmForUser(req.user, farmId, { write: false });
  await farm.populate('mainCrop');

  const latestReading = await PhReading.findOne({ farm: farm._id })
    .sort({ recordedAt: -1 })
    .populate('device', 'name source status');

  let evaluation;
  if (!latestReading) {
    evaluation = {
      status: 'no_data',
      label: 'No Data',
      message: 'No pH readings have been recorded for this farm yet.',
      range: farm.mainCrop ? { min: farm.mainCrop.phMin, max: farm.mainCrop.phMax } : null,
      cropName: farm.mainCrop?.name || null,
    };
  } else if (!farm.mainCrop) {
    evaluation = {
      status: 'unknown',
      label: 'Unknown',
      message: 'No main crop configured for this farm.',
      range: null,
      cropName: null,
    };
  } else {
    evaluation = evaluatePh(latestReading.value, farm.mainCrop);
  }

  // Distinct crops from farm's growing plantings
  const plantings = await Planting.find({ farm: farm._id, status: 'growing' }).populate('crop');
  const cropMap = new Map();
  for (const p of plantings) {
    if (p.crop && !cropMap.has(p.crop.name)) {
      cropMap.set(p.crop.name, p.crop);
    }
  }

  const cropStatuses = Array.from(cropMap.values()).map((crop) => ({
    cropName: crop.name,
    status: latestReading ? evaluatePh(latestReading.value, crop).status : 'no_data',
    range: { min: crop.phMin, max: crop.phMax },
  }));

  res.status(200).json({
    success: true,
    data: {
      farmId: farm._id,
      farmName: farm.name,
      reading: latestReading || null,
      evaluation,
      cropStatuses,
    },
  });
});

// @desc    Get reading statistics and daily trends
// @route   GET /api/readings/summary
// @access  Protected (Farmer/Admin)
export const getReadingsSummary = asyncHandler(async (req, res, next) => {
  const { farmId, days = 30, tzOffsetMinutes = 0 } = req.query;

  if (!farmId) {
    return next(new ApiError(400, 'farmId query parameter is required'));
  }

  const farm = await getFarmForUser(req.user, farmId, { write: false });
  await farm.populate('mainCrop');

  const numDays = Math.min(90, Math.max(1, parseInt(days, 10) || 30));
  const sinceDate = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000);

  // Convert tzOffsetMinutes to +HH:MM / -HH:MM
  const offset = Math.max(-840, Math.min(840, parseInt(tzOffsetMinutes, 10) || 0));
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');
  const tzString = `${sign}${hours}:${minutes}`;

  // Aggregation for daily statistics
  const dailyAggregation = await PhReading.aggregate([
    {
      $match: {
        farm: farm._id,
        recordedAt: { $gte: sinceDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$recordedAt',
            timezone: tzString,
          },
        },
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const daily = dailyAggregation.map((d) => ({
    date: d._id,
    avg: Math.round(d.avg * 100) / 100,
    min: Math.round(d.min * 100) / 100,
    max: Math.round(d.max * 100) / 100,
    count: d.count,
  }));

  // Overall stats
  const allReadings = await PhReading.find({
    farm: farm._id,
    recordedAt: { $gte: sinceDate },
  });

  const count = allReadings.length;
  let min = null;
  let max = null;
  let avg = null;
  let outOfRangeCount = 0;
  let inRangePercent = 0;

  if (count > 0) {
    let sum = 0;
    min = allReadings[0].value;
    max = allReadings[0].value;

    const { phMin, phMax } = farm.mainCrop || {};
    const hasRange = phMin !== undefined && phMax !== undefined;

    for (const r of allReadings) {
      sum += r.value;
      if (r.value < min) min = r.value;
      if (r.value > max) max = r.value;

      if (hasRange && (r.value < phMin || r.value > phMax)) {
        outOfRangeCount++;
      }
    }

    avg = Math.round((sum / count) * 100) / 100;
    inRangePercent = Math.round(((count - outOfRangeCount) / count) * 100 * 100) / 100;
  }

  res.status(200).json({
    success: true,
    data: {
      days: numDays,
      count,
      min,
      max,
      avg,
      outOfRangeCount,
      inRangePercent,
      daily,
    },
  });
});

// @desc    Delete a reading and its alert
// @route   DELETE /api/readings/:id
// @access  Protected (Owner only)
export const deleteReading = asyncHandler(async (req, res, next) => {
  const reading = await PhReading.findById(req.params.id);
  if (!reading) {
    return next(new ApiError(404, 'Reading not found'));
  }

  // Ensure caller owns the farm
  await getFarmForUser(req.user, reading.farm, { write: true });

  await Alert.deleteMany({ reading: reading._id });
  await reading.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Reading and associated alert deleted successfully',
  });
});
