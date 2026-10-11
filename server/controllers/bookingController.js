import Booking from '../models/Booking.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Create a new booking (farmer only)
// @route   POST /api/bookings
// @access  Protected / Farmer
export const createBooking = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'farmer') {
    return next(new ApiError(403, 'Forbidden: Only farmers can create bookings'));
  }

  const { type, product: productId, quantity, scheduledAt, notes } = req.body;

  if (!type || (type !== 'product' && type !== 'consultation')) {
    return next(new ApiError(400, 'Booking type must be "product" or "consultation"'));
  }

  if (type === 'product') {
    if (!productId) {
      return next(new ApiError(400, 'Product ID is required for product bookings'));
    }

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 1) {
      return next(new ApiError(400, 'Quantity must be an integer greater than or equal to 1'));
    }

    // Decrease stock atomically
    const product = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: parsedQty } },
      { $inc: { stock: -parsedQty } },
      { returnDocument: 'after' }
    );

    if (!product) {
      // Check if product exists to distinguish 404 from 409
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return next(new ApiError(404, 'Product not found'));
      }
      return next(new ApiError(409, 'Not enough stock'));
    }

    const computedTotal = product.price * parsedQty;

    let booking;
    try {
      booking = await Booking.create({
        user: req.user._id,
        type: 'product',
        product: product._id,
        quantity: parsedQty,
        totalAmount: computedTotal,
        productName: product.name,
        unitPrice: product.price,
        notes: notes ? notes.trim() : undefined,
        status: 'pending',
      });
    } catch (createErr) {
      // If creating the booking fails, restore the stock
      await Product.findByIdAndUpdate(productId, { $inc: { stock: parsedQty } });
      throw createErr;
    }

    return res.status(201).json({
      success: true,
      data: booking,
    });
  }

  if (type === 'consultation') {
    if (!scheduledAt) {
      return next(new ApiError(400, 'Scheduled date and time is required for consultation'));
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return next(new ApiError(400, 'Invalid scheduledAt date format'));
    }

    if (scheduledDate <= new Date()) {
      return next(new ApiError(400, 'Scheduled date must be in the future'));
    }

    const booking = await Booking.create({
      user: req.user._id,
      type: 'consultation',
      scheduledAt: scheduledDate,
      totalAmount: 0,
      notes: notes ? notes.trim() : undefined,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      data: booking,
    });
  }
});

// @desc    Get bookings (farmer -> own; admin -> all with user name and email)
// @route   GET /api/bookings
// @access  Protected / Farmer or Admin
export const getBookings = asyncHandler(async (req, res, next) => {
  const { type, status } = req.query;
  const filter = {};

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (req.user.role === 'farmer') {
    filter.user = req.user._id;
  } else if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Forbidden: Access denied'));
  }

  let query = Booking.find(filter).sort({ createdAt: -1 });

  if (req.user.role === 'admin') {
    query = query.populate('user', 'name email');
  }

  const bookings = await query;

  res.status(200).json({
    success: true,
    data: bookings,
  });
});

// @desc    Cancel a booking (owner only, only while pending)
// @route   PUT /api/bookings/:id/cancel
// @access  Protected / Owner
export const cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new ApiError(404, 'Booking not found'));
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Forbidden: You can only cancel your own bookings'));
  }

  if (booking.status !== 'pending') {
    return next(new ApiError(409, 'Only pending bookings can be cancelled'));
  }

  booking.status = 'cancelled';
  await booking.save();

  if (booking.type === 'product' && booking.product && booking.quantity > 0) {
    await Product.findByIdAndUpdate(booking.product, {
      $inc: { stock: booking.quantity },
    });
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// @desc    Update booking status (admin only)
// @route   PUT /api/bookings/:id/status
// @access  Protected / Admin
export const updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ApiError(400, 'Status is required'));
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new ApiError(404, 'Booking not found'));
  }

  const currentStatus = booking.status;
  const allowed =
    (currentStatus === 'pending' && status === 'confirmed') ||
    (currentStatus === 'confirmed' && status === 'delivered') ||
    ((currentStatus === 'pending' || currentStatus === 'confirmed') && status === 'cancelled');

  if (!allowed) {
    return next(new ApiError(409, `Cannot transition status from ${currentStatus} to ${status}`));
  }

  booking.status = status;
  await booking.save();

  if (status === 'cancelled' && booking.type === 'product' && booking.product && booking.quantity > 0) {
    await Product.findByIdAndUpdate(booking.product, {
      $inc: { stock: booking.quantity },
    });
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

export default {
  createBooking,
  getBookings,
  cancelBooking,
  updateBookingStatus,
};
