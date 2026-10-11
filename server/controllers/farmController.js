import Farm from '../models/Farm.js';
import Crop from '../models/Crop.js';
import Planting from '../models/Planting.js';
import Device from '../models/Device.js';
import PhReading from '../models/PhReading.js';
import Alert from '../models/Alert.js';
import { deleteFarmCascade } from '../utils/cascade.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper to validate farm location coordinates
const validateCoordinates = (location) => {
  if (!location) return null;
  const { lat, lng } = location;

  if (lat !== undefined && lat !== null && lat !== '') {
    const numLat = Number(lat);
    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      return 'Latitude must be between -90 and 90';
    }
  }

  if (lng !== undefined && lng !== null && lng !== '') {
    const numLng = Number(lng);
    if (isNaN(numLng) || numLng < -180 || numLng > 180) {
      return 'Longitude must be between -180 and 180';
    }
  }

  return null;
};

// @desc    Create a new farm
// @route   POST /api/farms
// @access  Protected/Farmer
export const createFarm = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'farmer') {
    return next(new ApiError(403, 'Forbidden: Only farmers can create farms'));
  }

  const { name, location, areaSize, mainCrop, establishedDate } = req.body;

  if (!name || !name.trim()) {
    return next(new ApiError(400, 'Farm name is required'));
  }

  if (!location || !location.text || !location.text.trim()) {
    return next(new ApiError(400, 'Location text is required'));
  }

  const coordError = validateCoordinates(location);
  if (coordError) {
    return next(new ApiError(400, coordError));
  }

  if (areaSize === undefined || Number(areaSize) <= 0) {
    return next(new ApiError(400, 'Area size must be greater than 0'));
  }

  if (mainCrop) {
    const cropExists = await Crop.findById(mainCrop);
    if (!cropExists) {
      return next(new ApiError(400, 'Invalid mainCrop id'));
    }
  }

  // Owner is always taken from authenticated user
  const farm = await Farm.create({
    owner: req.user._id,
    name: name.trim(),
    location: {
      text: location.text.trim(),
      lat: location.lat !== undefined && location.lat !== '' ? Number(location.lat) : undefined,
      lng: location.lng !== undefined && location.lng !== '' ? Number(location.lng) : undefined,
    },
    areaSize: Number(areaSize),
    mainCrop: mainCrop || undefined,
    establishedDate: establishedDate || undefined,
  });

  await farm.populate('mainCrop', 'name type phMin phMax');

  res.status(201).json({
    success: true,
    data: farm,
  });
});

// @desc    Get farms (own for farmer, all for admin)
// @route   GET /api/farms
// @access  Protected (Farmer/Admin)
export const getFarms = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'buyer') {
    return next(new ApiError(403, 'Forbidden: Buyers cannot access farm resources'));
  }

  let query = Farm.find();

  if (req.user.role === 'farmer') {
    query = query.where({ owner: req.user._id });
  } else if (req.user.role === 'admin') {
    query = query.populate('owner', 'name email');
  }

  const farms = await query
    .populate('mainCrop', 'name type phMin phMax')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: farms,
  });
});

// @desc    Get farm by id
// @route   GET /api/farms/:id
// @access  Protected (Owner/Admin)
export const getFarmById = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'buyer') {
    return next(new ApiError(403, 'Forbidden: Buyers cannot access farm resources'));
  }

  const farm = await Farm.findById(req.params.id);
  if (!farm) {
    return next(new ApiError(404, 'Farm not found'));
  }

  // Access allowed only for owner or admin
  const isOwner = farm.owner.toString() === req.user._id.toString();
  if (req.user.role !== 'admin' && !isOwner) {
    return next(new ApiError(403, 'Forbidden: You do not have permission to view this farm'));
  }

  await farm.populate('mainCrop', 'name type phMin phMax');
  if (req.user.role === 'admin') {
    await farm.populate('owner', 'name email');
  }

  res.status(200).json({
    success: true,
    data: farm,
  });
});

// @desc    Update a farm
// @route   PUT /api/farms/:id
// @access  Protected (Owner only)
export const updateFarm = asyncHandler(async (req, res, next) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) {
    return next(new ApiError(404, 'Farm not found'));
  }

  // Owner only (admins may not edit)
  if (farm.owner.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: Only the farm owner can edit this farm'));
  }

  const { name, location, areaSize, mainCrop, establishedDate } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      return next(new ApiError(400, 'Farm name cannot be empty'));
    }
    farm.name = name.trim();
  }

  if (areaSize !== undefined) {
    if (Number(areaSize) <= 0) {
      return next(new ApiError(400, 'Area size must be greater than 0'));
    }
    farm.areaSize = Number(areaSize);
  }

  if (location) {
    const coordError = validateCoordinates(location);
    if (coordError) {
      return next(new ApiError(400, coordError));
    }

    farm.location = {
      text: location.text !== undefined ? location.text.trim() : farm.location?.text,
      lat: location.lat !== undefined && location.lat !== '' ? Number(location.lat) : farm.location?.lat,
      lng: location.lng !== undefined && location.lng !== '' ? Number(location.lng) : farm.location?.lng,
    };
  }

  if (mainCrop !== undefined) {
    if (mainCrop) {
      const cropExists = await Crop.findById(mainCrop);
      if (!cropExists) {
        return next(new ApiError(400, 'Invalid mainCrop id'));
      }
      farm.mainCrop = mainCrop;
    } else {
      farm.mainCrop = undefined;
    }
  }

  if (establishedDate !== undefined) {
    farm.establishedDate = establishedDate;
  }

  await farm.save();
  await farm.populate('mainCrop', 'name type phMin phMax');

  res.status(200).json({
    success: true,
    data: farm,
  });
});

// @desc    Delete a farm and related data
// @route   DELETE /api/farms/:id
// @access  Protected (Owner only)
export const deleteFarm = asyncHandler(async (req, res, next) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) {
    return next(new ApiError(404, 'Farm not found'));
  }

  // Owner only (admins may not delete)
  if (farm.owner.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: Only the farm owner can delete this farm'));
  }

  // Delete all farm-related plantings, devices, readings, alerts, and farm
  await deleteFarmCascade(farm._id);

  res.status(200).json({
    success: true,
    message: 'Farm and associated data deleted successfully',
  });
});
