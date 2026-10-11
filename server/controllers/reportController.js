import Farm from '../models/Farm.js';
import Planting from '../models/Planting.js';
import PhReading from '../models/PhReading.js';
import Alert from '../models/Alert.js';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import { getFarmForUser } from '../utils/farmAccess.js';
import { evaluatePh } from '../utils/phStatus.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get summary report for a specific farm
// @route   GET /api/reports/farm-summary?farmId=&days=30
// @access  Protected / Farmer (own farm)
export const getFarmSummary = asyncHandler(async (req, res, next) => {
  const { farmId, days = 30 } = req.query;

  if (!farmId) {
    return next(new ApiError(400, 'Farm ID is required'));
  }

  // Authorize and load farm (farmer, own farm only)
  const farm = await getFarmForUser(req.user, farmId);
  await farm.populate('mainCrop', 'name type phMin phMax');

  const daysNum = Math.max(1, parseInt(days, 10) || 30);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysNum);

  // 1. Plantings summary
  const plantingsDocs = await Planting.find({
    farm: farm._id,
    status: 'growing',
  }).populate('crop', 'name type phMin phMax');

  const now = new Date();
  const plantings = plantingsDocs.map((p) => {
    let daysToHarvest = null;
    if (p.expectedHarvestDate) {
      const diffTime = new Date(p.expectedHarvestDate).getTime() - now.getTime();
      daysToHarvest = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      _id: p._id,
      cropName: p.crop ? p.crop.name : null,
      variety: p.variety,
      plantedDate: p.plantedDate,
      expectedHarvestDate: p.expectedHarvestDate,
      daysToHarvest,
      status: p.status,
    };
  });

  // 2. pH Statistics over the days window
  const readings = await PhReading.find({
    farm: farm._id,
    recordedAt: { $gte: cutoffDate },
  }).sort({ recordedAt: 1 });

  let ph = {
    min: null,
    max: null,
    avg: null,
    outOfRangeCount: 0,
    inRangePercent: 0,
    count: readings.length,
  };

  if (readings.length > 0) {
    let sum = 0;
    let min = readings[0].value;
    let max = readings[0].value;
    let outOfRange = 0;

    for (const r of readings) {
      const val = r.value;
      sum += val;
      if (val < min) min = val;
      if (val > max) max = val;

      // Evaluation against farm's mainCrop range
      const evaluation = evaluatePh(val, farm.mainCrop);
      if (evaluation.status === 'too_acidic' || evaluation.status === 'too_alkaline') {
        outOfRange++;
      }
    }

    const inRangeCount = readings.length - outOfRange;
    ph = {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round((sum / readings.length) * 100) / 100,
      outOfRangeCount: outOfRange,
      inRangePercent: Math.round((inRangeCount / readings.length) * 100 * 10) / 10,
      count: readings.length,
    };
  }

  // 3. Alerts counts on this farm
  const alertsCount = await Alert.countDocuments({ farm: farm._id });
  const unreadAlerts = await Alert.countDocuments({ farm: farm._id, isRead: false });

  // 4. Bookings total spent by this farmer (product bookings that are confirmed or delivered)
  const bookingsSpentAgg = await Booking.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'product',
        status: { $in: ['confirmed', 'delivered'] },
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$totalAmount' },
      },
    },
  ]);

  const bookingsTotalSpent = bookingsSpentAgg.length > 0 ? bookingsSpentAgg[0].totalSpent : 0;

  res.status(200).json({
    success: true,
    data: {
      farm,
      plantings,
      ph,
      alertsCount,
      unreadAlerts,
      bookingsTotalSpent,
    },
  });
});

// @desc    Get sales report for the farmer
// @route   GET /api/reports/sales
// @access  Protected / Farmer
export const getSalesReport = asyncHandler(async (req, res, next) => {
  const listings = await Listing.find({ seller: req.user._id });

  // Initial buckets for each status
  const summaryByStatus = {
    available: { count: 0, totalQuantityKg: 0, estimatedValue: 0 },
    reserved: { count: 0, totalQuantityKg: 0, estimatedValue: 0 },
    sold: { count: 0, totalQuantityKg: 0, estimatedValue: 0 },
  };

  let overallTotalQuantityKg = 0;
  let overallEstimatedValue = 0;

  for (const item of listings) {
    const status = item.status;
    if (!summaryByStatus[status]) {
      summaryByStatus[status] = { count: 0, totalQuantityKg: 0, estimatedValue: 0 };
    }

    const qty = Number(item.quantity) || 0;
    const unit = item.unit;
    const pricePerUnit = Number(item.pricePerUnit) || 0;

    // Convert quantity to kg: 1 ton = 1000 kg
    const qtyInKg = unit === 'ton' ? qty * 1000 : qty;

    // Price per kg: if unit is ton, pricePerUnit is price per ton -> price per kg = pricePerUnit / 1000
    const pricePerKg = unit === 'ton' ? pricePerUnit / 1000 : pricePerUnit;

    const value = qtyInKg * pricePerKg;

    summaryByStatus[status].count += 1;
    summaryByStatus[status].totalQuantityKg += qtyInKg;

    // estimatedValue is quantity in kg x price per kg for sold listings
    if (status === 'sold') {
      summaryByStatus[status].estimatedValue += value;
      overallEstimatedValue += value;
    }

    overallTotalQuantityKg += qtyInKg;
  }

  res.status(200).json({
    success: true,
    data: {
      byStatus: summaryByStatus,
      totalListings: listings.length,
      totalQuantityKg: overallTotalQuantityKg,
      estimatedValue: overallEstimatedValue,
    },
  });
});

export default {
  getFarmSummary,
  getSalesReport,
};
