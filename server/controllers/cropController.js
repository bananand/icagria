import Crop from '../models/Crop.js';
import Planting from '../models/Planting.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all crops with optional type and search filters
// @route   GET /api/crops
// @access  Public
export const getCrops = asyncHandler(async (req, res) => {
  const { type, search } = req.query;
  const filter = {};

  if (type) {
    filter.type = type;
  }

  if (search) {
    filter.name = { $regex: search.trim(), $options: 'i' };
  }

  const crops = await Crop.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: crops,
  });
});

// @desc    Get crop by id
// @route   GET /api/crops/:id
// @access  Public
export const getCropById = asyncHandler(async (req, res, next) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    return next(new ApiError(404, 'Crop not found'));
  }

  res.status(200).json({
    success: true,
    data: crop,
  });
});

// @desc    Create a new crop
// @route   POST /api/crops
// @access  Protected/Admin
export const createCrop = asyncHandler(async (req, res, next) => {
  const {
    name,
    type,
    scientificName,
    phMin,
    phMax,
    growthDays,
    growthPeriod,
    season,
    sowingTime,
    harvestTime,
    climate,
    soilType,
    pests,
    fertilizers,
    pesticides,
    imageUrl,
  } = req.body;

  if (!name || !type || phMin === undefined || phMax === undefined) {
    return next(new ApiError(400, 'Please provide name, type, phMin, and phMax'));
  }

  if (Number(phMin) > Number(phMax)) {
    return next(new ApiError(400, 'phMin must be less than or equal to phMax'));
  }

  const crop = await Crop.create({
    name: name.trim(),
    type,
    scientificName,
    phMin,
    phMax,
    growthDays,
    growthPeriod,
    season,
    sowingTime,
    harvestTime,
    climate,
    soilType,
    pests,
    fertilizers,
    pesticides,
    imageUrl,
  });

  res.status(201).json({
    success: true,
    data: crop,
  });
});

// @desc    Update a crop
// @route   PUT /api/crops/:id
// @access  Protected/Admin
export const updateCrop = asyncHandler(async (req, res, next) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    return next(new ApiError(404, 'Crop not found'));
  }

  const effectivePhMin = req.body.phMin !== undefined ? Number(req.body.phMin) : crop.phMin;
  const effectivePhMax = req.body.phMax !== undefined ? Number(req.body.phMax) : crop.phMax;

  if (effectivePhMin > effectivePhMax) {
    return next(new ApiError(400, 'phMin must be less than or equal to phMax'));
  }

  Object.assign(crop, req.body);
  await crop.save();

  res.status(200).json({
    success: true,
    data: crop,
  });
});

// @desc    Delete a crop
// @route   DELETE /api/crops/:id
// @access  Protected/Admin
export const deleteCrop = asyncHandler(async (req, res, next) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    return next(new ApiError(404, 'Crop not found'));
  }

  const referencedPlantings = await Planting.countDocuments({ crop: crop._id });
  if (referencedPlantings > 0) {
    return next(
      new ApiError(409, 'Cannot delete crop: it is referenced by existing plantings')
    );
  }

  await crop.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Crop deleted successfully',
  });
});
