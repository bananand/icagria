import Listing from '../models/Listing.js';
import Crop from '../models/Crop.js';
import Inquiry from '../models/Inquiry.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const SELLER_PUBLIC_FIELDS = 'name';

const sanitizeListing = (listing) => {
  const obj = listing.toObject ? listing.toObject({ virtuals: true }) : { ...listing };
  if (obj.seller && typeof obj.seller === 'object' && obj.seller !== null) {
    obj.seller = {
      _id: obj.seller._id,
      name: obj.seller.name,
    };
  }
  return obj;
};

const validateUnit = (unit) => unit === 'kg' || unit === 'ton';

// @desc    Create a harvest listing
// @route   POST /api/listings
// @access  Protected / Farmer
export const createListing = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'farmer') {
    return next(new ApiError(403, 'Forbidden: Only farmers can create listings'));
  }

  const { cropName, crop, quantity, unit, pricePerUnit, location, description } = req.body;

  let resolvedCropName = cropName?.trim();
  let cropId;

  if (crop) {
    const cropDoc = await Crop.findById(crop);
    if (!cropDoc) {
      return next(new ApiError(400, 'Invalid crop id'));
    }
    cropId = cropDoc._id;
    if (!resolvedCropName) {
      resolvedCropName = cropDoc.name;
    }
  }

  if (!resolvedCropName) {
    return next(new ApiError(400, 'Crop name is required'));
  }

  if (quantity === undefined || Number(quantity) <= 0) {
    return next(new ApiError(400, 'Quantity must be greater than 0'));
  }

  const resolvedUnit = unit || 'kg';
  if (!validateUnit(resolvedUnit)) {
    return next(new ApiError(400, 'Unit must be kg or ton'));
  }

  if (pricePerUnit === undefined || Number(pricePerUnit) <= 0) {
    return next(new ApiError(400, 'Price per unit must be greater than 0'));
  }

  const listing = await Listing.create({
    seller: req.user._id,
    cropName: resolvedCropName,
    crop: cropId,
    quantity: Number(quantity),
    unit: resolvedUnit,
    pricePerUnit: Number(pricePerUnit),
    location: location?.trim(),
    description: description?.trim(),
  });

  res.status(201).json({
    success: true,
    data: sanitizeListing(listing),
  });
});

// @desc    List harvest listings
// @route   GET /api/listings
// @access  Protected
export const getListings = asyncHandler(async (req, res, next) => {
  const {
    status,
    crop,
    search,
    mine,
    minPrice,
    maxPrice,
    sort,
    page: pageQuery,
    limit: limitQuery,
  } = req.query;

  const filter = {};

  const mineFilter = mine === 'true' || mine === true;
  if (mineFilter) {
    if (req.user.role !== 'farmer') {
      return next(new ApiError(403, 'Forbidden: Only farmers can use mine=true'));
    }
    filter.seller = req.user._id;
  } else {
    filter.status = status || 'available';
  }

  if (crop) {
    filter.crop = crop;
  }

  if (search && String(search).trim()) {
    filter.cropName = { $regex: String(search).trim(), $options: 'i' };
  }

  if (minPrice !== undefined && minPrice !== '') {
    filter.pricePerUnit = { ...filter.pricePerUnit, $gte: Number(minPrice) };
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    filter.pricePerUnit = { ...filter.pricePerUnit, $lte: Number(maxPrice) };
  }

  let sortSpec = { createdAt: -1 };
  if (sort === 'price_asc') {
    sortSpec = { pricePerUnit: 1 };
  } else if (sort === 'price_desc') {
    sortSpec = { pricePerUnit: -1 };
  }

  const page = Math.max(1, parseInt(pageQuery, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(limitQuery, 10) || 12));
  const skip = (page - 1) * limit;

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('seller', SELLER_PUBLIC_FIELDS)
      .sort(sortSpec)
      .skip(skip)
      .limit(limit),
    Listing.countDocuments(filter),
  ]);

  const pages = total === 0 ? 0 : Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    data: {
      listings: listings.map(sanitizeListing),
      page,
      pages,
      total,
    },
  });
});

// @desc    Get listing by id
// @route   GET /api/listings/:id
// @access  Protected
export const getListingById = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id).populate('seller', SELLER_PUBLIC_FIELDS);
  if (!listing) {
    return next(new ApiError(404, 'Listing not found'));
  }

  res.status(200).json({
    success: true,
    data: sanitizeListing(listing),
  });
});

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Protected / Seller
export const updateListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return next(new ApiError(404, 'Listing not found'));
  }

  if (listing.seller.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: Only the seller can edit this listing'));
  }

  if (listing.status === 'sold') {
    return next(new ApiError(409, 'Sold listings cannot be edited'));
  }

  const { cropName, quantity, unit, pricePerUnit, location, description, status } = req.body;

  if (cropName !== undefined) {
    if (!cropName.trim()) {
      return next(new ApiError(400, 'Crop name cannot be empty'));
    }
    listing.cropName = cropName.trim();
  }

  if (quantity !== undefined) {
    if (Number(quantity) <= 0) {
      return next(new ApiError(400, 'Quantity must be greater than 0'));
    }
    listing.quantity = Number(quantity);
  }

  if (unit !== undefined) {
    if (!validateUnit(unit)) {
      return next(new ApiError(400, 'Unit must be kg or ton'));
    }
    listing.unit = unit;
  }

  if (pricePerUnit !== undefined) {
    if (Number(pricePerUnit) <= 0) {
      return next(new ApiError(400, 'Price per unit must be greater than 0'));
    }
    listing.pricePerUnit = Number(pricePerUnit);
  }

  if (location !== undefined) {
    listing.location = location.trim();
  }

  if (description !== undefined) {
    listing.description = description.trim();
  }

  if (status !== undefined) {
    const allowed = ['available', 'reserved', 'sold'];
    if (!allowed.includes(status)) {
      return next(new ApiError(400, 'Invalid listing status'));
    }
    listing.status = status;

    if (status === 'sold') {
      await Inquiry.updateMany(
        { listing: listing._id, status: 'pending' },
        { $set: { status: 'rejected' } }
      );
    }
  }

  await listing.save();
  await listing.populate('seller', SELLER_PUBLIC_FIELDS);

  res.status(200).json({
    success: true,
    data: sanitizeListing(listing),
  });
});

// @desc    Delete a listing and its inquiries
// @route   DELETE /api/listings/:id
// @access  Protected / Seller or Admin
export const deleteListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return next(new ApiError(404, 'Listing not found'));
  }

  const isSeller = listing.seller.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isSeller && !isAdmin) {
    return next(new ApiError(403, 'Forbidden: Only the seller or an admin can delete this listing'));
  }

  await Inquiry.deleteMany({ listing: listing._id });
  await listing.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Listing and associated inquiries deleted successfully',
  });
});

export default {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
};
