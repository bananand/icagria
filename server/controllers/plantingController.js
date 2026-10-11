import Planting from '../models/Planting.js';
import Farm from '../models/Farm.js';
import Crop from '../models/Crop.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Create a new planting
// @route   POST /api/plantings
// @access  Protected/Farmer
export const createPlanting = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'farmer') {
    return next(new ApiError(403, 'Forbidden: Only farmers can create plantings'));
  }

  const { farm, crop, variety, quantity, plantedDate, expectedHarvestDate } = req.body;

  if (!farm || !crop) {
    return next(new ApiError(400, 'Please provide both farm and crop'));
  }

  const farmDoc = await Farm.findById(farm);
  if (!farmDoc) {
    return next(new ApiError(404, 'Farm not found'));
  }

  // Farm must belong to current user
  if (farmDoc.owner.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: Farm does not belong to you'));
  }

  const cropDoc = await Crop.findById(crop);
  if (!cropDoc) {
    return next(new ApiError(404, 'Crop not found'));
  }

  // Planted date defaults to today
  const finalPlantedDate = plantedDate ? new Date(plantedDate) : new Date();

  // If expectedHarvestDate is not provided and crop has growthDays, compute it
  let finalExpectedHarvestDate = expectedHarvestDate ? new Date(expectedHarvestDate) : undefined;
  if (!finalExpectedHarvestDate && cropDoc.growthDays) {
    const computedDate = new Date(finalPlantedDate);
    computedDate.setDate(computedDate.getDate() + cropDoc.growthDays);
    finalExpectedHarvestDate = computedDate;
  }

  const planting = await Planting.create({
    farm: farmDoc._id,
    crop: cropDoc._id,
    variety: variety ? variety.trim() : undefined,
    quantity: quantity !== undefined ? Number(quantity) : undefined,
    plantedDate: finalPlantedDate,
    expectedHarvestDate: finalExpectedHarvestDate,
  });

  await planting.populate('crop', 'name type phMin phMax');
  await planting.populate('farm', 'name');

  res.status(201).json({
    success: true,
    data: planting,
  });
});

// @desc    Get plantings (own for farmer, all for admin, optional ?farmId=)
// @route   GET /api/plantings
// @access  Protected (Farmer/Admin)
export const getPlantings = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'buyer') {
    return next(new ApiError(403, 'Forbidden: Buyers cannot access plantings'));
  }

  const { farmId } = req.query;
  const filter = {};

  if (req.user.role === 'farmer') {
    if (farmId) {
      const farmDoc = await Farm.findById(farmId);
      if (!farmDoc) {
        return next(new ApiError(404, 'Farm not found'));
      }
      if (farmDoc.owner.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, 'Forbidden: Farm does not belong to you'));
      }
      filter.farm = farmId;
    } else {
      const myFarms = await Farm.find({ owner: req.user._id }).select('_id');
      const farmIds = myFarms.map((f) => f._id);
      filter.farm = { $in: farmIds };
    }
  } else if (req.user.role === 'admin') {
    if (farmId) {
      filter.farm = farmId;
    }
  }

  const plantings = await Planting.find(filter)
    .populate('crop', 'name type phMin phMax')
    .populate('farm', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: plantings,
  });
});

// @desc    Get planting by id
// @route   GET /api/plantings/:id
// @access  Protected (Owner/Admin)
export const getPlantingById = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'buyer') {
    return next(new ApiError(403, 'Forbidden: Buyers cannot access plantings'));
  }

  const planting = await Planting.findById(req.params.id);
  if (!planting) {
    return next(new ApiError(404, 'Planting not found'));
  }

  const farmDoc = await Farm.findById(planting.farm);
  const isOwner = farmDoc && farmDoc.owner.toString() === req.user._id.toString();

  if (req.user.role !== 'admin' && !isOwner) {
    return next(new ApiError(403, 'Forbidden: You do not have permission to view this planting'));
  }

  await planting.populate('crop', 'name type phMin phMax');
  await planting.populate('farm', 'name');

  res.status(200).json({
    success: true,
    data: planting,
  });
});

// @desc    Update a planting
// @route   PUT /api/plantings/:id
// @access  Protected (Owner only)
export const updatePlanting = asyncHandler(async (req, res, next) => {
  const planting = await Planting.findById(req.params.id);
  if (!planting) {
    return next(new ApiError(404, 'Planting not found'));
  }

  const farmDoc = await Farm.findById(planting.farm);
  if (!farmDoc || farmDoc.owner.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: Only the farm owner can update this planting'));
  }

  const { variety, quantity, plantedDate, expectedHarvestDate, status } = req.body;

  if (variety !== undefined) planting.variety = variety.trim();
  if (quantity !== undefined) planting.quantity = Number(quantity);
  if (plantedDate !== undefined) planting.plantedDate = new Date(plantedDate);
  if (expectedHarvestDate !== undefined) planting.expectedHarvestDate = new Date(expectedHarvestDate);
  if (status !== undefined) planting.status = status;

  await planting.save();

  await planting.populate('crop', 'name type phMin phMax');
  await planting.populate('farm', 'name');

  res.status(200).json({
    success: true,
    data: planting,
  });
});

// @desc    Delete a planting
// @route   DELETE /api/plantings/:id
// @access  Protected (Owner only)
export const deletePlanting = asyncHandler(async (req, res, next) => {
  const planting = await Planting.findById(req.params.id);
  if (!planting) {
    return next(new ApiError(404, 'Planting not found'));
  }

  const farmDoc = await Farm.findById(planting.farm);
  if (!farmDoc || farmDoc.owner.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: Only the farm owner can delete this planting'));
  }

  await planting.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Planting deleted successfully',
  });
});
