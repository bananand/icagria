import express from 'express';
import Planting from '../models/Planting.js';
import { getFarmForUser } from '../utils/farmAccess.js';
import { DISCLAIMER, getTipsForPest } from '../utils/pestTips.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @desc    Get pest tips for crops growing on the farmer's farm
// @route   GET /api/pest-tips?farmId=
// @access  Protected / Farmer (own farm)
router.get(
  '/',
  authorize('farmer'),
  asyncHandler(async (req, res, next) => {
    const { farmId } = req.query;

    if (!farmId) {
      return next(new ApiError(400, 'Farm ID is required'));
    }

    // Verify farm access (farmer, own farm only)
    const farm = await getFarmForUser(req.user, farmId);

    // Find growing plantings on this farm and populate crop
    const plantings = await Planting.find({
      farm: farm._id,
      status: 'growing',
    }).populate('crop');

    // Group by distinct crop
    const cropsMap = new Map();
    for (const planting of plantings) {
      if (planting.crop && planting.crop._id) {
        const cropIdStr = planting.crop._id.toString();
        if (!cropsMap.has(cropIdStr)) {
          cropsMap.set(cropIdStr, planting.crop);
        }
      }
    }

    const cropTips = [];
    for (const crop of cropsMap.values()) {
      const pestList = Array.isArray(crop.pests) ? crop.pests : [];
      const pests = pestList.map((pestName) => ({
        name: pestName,
        tips: getTipsForPest(pestName),
      }));

      cropTips.push({
        cropName: crop.name,
        pests,
      });
    }

    res.status(200).json({
      success: true,
      disclaimer: DISCLAIMER,
      data: cropTips,
    });
  })
);

export default router;
