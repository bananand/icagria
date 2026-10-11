import crypto from 'crypto';
import Device from '../models/Device.js';
import PhReading from '../models/PhReading.js';
import Alert from '../models/Alert.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getFarmForUser } from '../utils/farmAccess.js';

// @desc    Register a new device
// @route   POST /api/devices
// @access  Protected/Farmer
export const createDevice = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'farmer') {
    return next(new ApiError(403, 'Forbidden: Only farmers can register devices'));
  }

  const { farm, name, source } = req.body;

  if (!farm || !name || !name.trim()) {
    return next(new ApiError(400, 'Please provide farm ID and device name'));
  }

  // Ensure farm belongs to the user
  await getFarmForUser(req.user, farm, { write: true });

  const apiKey = crypto.randomBytes(16).toString('hex');

  const device = await Device.create({
    farm,
    name: name.trim(),
    source: source === 'hardware' ? 'hardware' : 'simulated',
    type: 'soil-ph',
    status: 'active',
    apiKey,
  });

  const deviceData = device.toObject();
  deviceData.apiKey = apiKey; // Expose apiKey in creation response only

  res.status(201).json({
    success: true,
    data: deviceData,
  });
});

// @desc    Get devices
// @route   GET /api/devices
// @access  Protected (Farmer/Admin)
export const getDevices = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'buyer') {
    return next(new ApiError(403, 'Forbidden: Buyers cannot access devices'));
  }

  const { farmId } = req.query;
  let filter = {};

  if (farmId) {
    await getFarmForUser(req.user, farmId, { write: false });
    filter.farm = farmId;
  } else if (req.user.role === 'farmer') {
    const { default: Farm } = await import('../models/Farm.js');
    const myFarms = await Farm.find({ owner: req.user._id }).select('_id');
    const myFarmIds = myFarms.map((f) => f._id);
    filter.farm = { $in: myFarmIds };
  }

  const devices = await Device.find(filter)
    .populate('farm', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: devices,
  });
});

// @desc    Update device (name and status)
// @route   PUT /api/devices/:id
// @access  Protected (Owner only)
export const updateDevice = asyncHandler(async (req, res, next) => {
  const device = await Device.findById(req.params.id);
  if (!device) {
    return next(new ApiError(404, 'Device not found'));
  }

  // Owner check
  await getFarmForUser(req.user, device.farm, { write: true });

  const { name, status } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      return next(new ApiError(400, 'Device name cannot be empty'));
    }
    device.name = name.trim();
  }

  if (status !== undefined) {
    if (!['active', 'inactive'].includes(status)) {
      return next(new ApiError(400, 'Status must be active or inactive'));
    }
    device.status = status;
  }

  await device.save();

  res.status(200).json({
    success: true,
    data: device,
  });
});

// @desc    Regenerate API key for hardware device
// @route   POST /api/devices/:id/regenerate-key
// @access  Protected (Owner only)
export const regenerateApiKey = asyncHandler(async (req, res, next) => {
  const device = await Device.findById(req.params.id);
  if (!device) {
    return next(new ApiError(404, 'Device not found'));
  }

  // Owner check
  await getFarmForUser(req.user, device.farm, { write: true });

  const newApiKey = crypto.randomBytes(16).toString('hex');
  device.apiKey = newApiKey;
  await device.save();

  res.status(200).json({
    success: true,
    data: {
      apiKey: newApiKey,
    },
  });
});

// @desc    Delete a device and cascade delete readings and alerts
// @route   DELETE /api/devices/:id
// @access  Protected (Owner only)
export const deleteDevice = asyncHandler(async (req, res, next) => {
  const device = await Device.findById(req.params.id);
  if (!device) {
    return next(new ApiError(404, 'Device not found'));
  }

  // Owner check
  await getFarmForUser(req.user, device.farm, { write: true });

  // Delete readings and their alerts
  const readings = await PhReading.find({ device: device._id }).select('_id');
  const readingIds = readings.map((r) => r._id);

  if (readingIds.length > 0) {
    await Alert.deleteMany({ reading: { $in: readingIds } });
    await PhReading.deleteMany({ device: device._id });
  }

  await device.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Device and associated readings deleted successfully',
  });
});
