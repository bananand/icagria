import Inquiry from '../models/Inquiry.js';
import Listing from '../models/Listing.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const LISTING_SUMMARY_FIELDS = 'cropName quantity unit pricePerUnit status seller';

const formatInquiryForUser = (inquiry, viewerRole) => {
  const obj = inquiry.toObject ? inquiry.toObject({ virtuals: true }) : { ...inquiry };

  if (obj.listing && typeof obj.listing === 'object') {
    const listing = obj.listing;
    const listingSummary = {
      _id: listing._id,
      cropName: listing.cropName,
      quantity: listing.quantity,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      status: listing.status,
    };

    if (viewerRole === 'buyer' && listing.seller && typeof listing.seller === 'object') {
      const seller = { name: listing.seller.name };
      if (obj.status === 'accepted' && listing.seller.phone) {
        seller.phone = listing.seller.phone;
      }
      obj.seller = seller;
    }

    obj.listing = listingSummary;
  }

  if (obj.buyer && typeof obj.buyer === 'object') {
    obj.buyer = {
      _id: obj.buyer._id,
      name: obj.buyer.name,
      email: obj.buyer.email,
      phone: obj.buyer.phone,
    };
  }

  return obj;
};

// @desc    Create an inquiry on a listing
// @route   POST /api/inquiries
// @access  Protected / Buyer
export const createInquiry = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'buyer') {
    return next(new ApiError(403, 'Forbidden: Only buyers can create inquiries'));
  }

  const { listing: listingId, quantity, message } = req.body;

  if (!listingId) {
    return next(new ApiError(400, 'Listing is required'));
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    return next(new ApiError(404, 'Listing not found'));
  }

  if (listing.status !== 'available') {
    return next(new ApiError(409, 'Inquiries are only allowed on available listings'));
  }

  if (quantity !== undefined && quantity !== null && quantity !== '') {
    const qty = Number(quantity);
    if (qty <= 0) {
      return next(new ApiError(400, 'Quantity must be greater than 0'));
    }
    if (qty > listing.quantity) {
      return next(new ApiError(400, 'Inquiry quantity cannot exceed listing quantity'));
    }
  }

  const existingPending = await Inquiry.findOne({
    listing: listing._id,
    buyer: req.user._id,
    status: 'pending',
  });

  if (existingPending) {
    return next(new ApiError(409, 'You already have a pending inquiry for this listing'));
  }

  const inquiry = await Inquiry.create({
    listing: listing._id,
    buyer: req.user._id,
    quantity: quantity !== undefined && quantity !== null && quantity !== '' ? Number(quantity) : undefined,
    message: message?.trim(),
  });

  await inquiry.populate({
    path: 'listing',
    select: LISTING_SUMMARY_FIELDS,
    populate: { path: 'seller', select: 'name phone' },
  });

  res.status(201).json({
    success: true,
    data: formatInquiryForUser(inquiry, 'buyer'),
  });
});

// @desc    Get inquiries (role-scoped)
// @route   GET /api/inquiries
// @access  Protected
export const getInquiries = asyncHandler(async (req, res, next) => {
  const { status, listingId } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (listingId) {
    filter.listing = listingId;
  }

  if (req.user.role === 'buyer') {
    filter.buyer = req.user._id;
  } else if (req.user.role === 'farmer') {
    const myListingIds = await Listing.find({ seller: req.user._id }).distinct('_id');
    const allowedIds = new Set(myListingIds.map((id) => id.toString()));

    if (listingId) {
      if (!allowedIds.has(String(listingId))) {
        return res.status(200).json({ success: true, data: [] });
      }
      filter.listing = listingId;
    } else {
      filter.listing = { $in: myListingIds };
    }
  }

  let query = Inquiry.find(filter).sort({ createdAt: -1 });

  if (req.user.role === 'farmer' || req.user.role === 'admin') {
    query = query.populate('buyer', 'name email phone');
  }

  query = query.populate({
    path: 'listing',
    select: LISTING_SUMMARY_FIELDS,
    populate: { path: 'seller', select: 'name phone' },
  });

  const inquiries = await query;

  const viewerRole = req.user.role;
  res.status(200).json({
    success: true,
    data: inquiries.map((inquiry) => formatInquiryForUser(inquiry, viewerRole)),
  });
});

// @desc    Accept or reject an inquiry
// @route   PUT /api/inquiries/:id/status
// @access  Protected / Listing seller
export const updateInquiryStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (status !== 'accepted' && status !== 'rejected') {
    return next(new ApiError(400, 'Status must be accepted or rejected'));
  }

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    return next(new ApiError(404, 'Inquiry not found'));
  }

  if (inquiry.status !== 'pending') {
    return next(new ApiError(409, 'Only pending inquiries can be updated'));
  }

  const listing = await Listing.findById(inquiry.listing);
  if (!listing) {
    return next(new ApiError(404, 'Listing not found'));
  }

  if (listing.seller.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: Only the listing seller can update inquiry status'));
  }

  if (status === 'accepted') {
    if (listing.status === 'sold') {
      return next(new ApiError(409, 'Cannot accept inquiries on a sold listing'));
    }
    if (listing.status === 'available') {
      listing.status = 'reserved';
      await listing.save();
    }
  }

  inquiry.status = status;
  await inquiry.save();

  await inquiry.populate('buyer', 'name email phone');
  await inquiry.populate({
    path: 'listing',
    select: LISTING_SUMMARY_FIELDS,
    populate: { path: 'seller', select: 'name phone' },
  });

  res.status(200).json({
    success: true,
    data: formatInquiryForUser(inquiry, req.user.role),
  });
});

// @desc    Delete a pending inquiry (buyer only)
// @route   DELETE /api/inquiries/:id
// @access  Protected / Buyer owner
export const deleteInquiry = asyncHandler(async (req, res, next) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    return next(new ApiError(404, 'Inquiry not found'));
  }

  if (inquiry.buyer.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: Only the inquiry owner can delete it'));
  }

  if (inquiry.status !== 'pending') {
    return next(new ApiError(403, 'Only pending inquiries can be deleted'));
  }

  await inquiry.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Inquiry deleted successfully',
  });
});

export default {
  createInquiry,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
};
