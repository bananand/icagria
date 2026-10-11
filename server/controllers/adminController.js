import User from '../models/User.js';
import Farm from '../models/Farm.js';
import Planting from '../models/Planting.js';
import Device from '../models/Device.js';
import PhReading from '../models/PhReading.js';
import Listing from '../models/Listing.js';
import Inquiry from '../models/Inquiry.js';
import Product from '../models/Product.js';
import Booking from '../models/Booking.js';
import Alert from '../models/Alert.js';
import { deleteFarmCascade } from '../utils/cascade.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get system-wide statistics and charts (admin only)
// @route   GET /api/admin/stats
// @access  Protected / Admin
export const getAdminStats = asyncHandler(async (req, res, next) => {
  const [
    totalUsers,
    farmerUsers,
    buyerUsers,
    adminUsers,
    totalFarms,
    totalPlantings,
    totalDevices,
    totalReadings,
    totalListings,
    availableListings,
    reservedListings,
    soldListings,
    totalInquiries,
    pendingInquiries,
    acceptedInquiries,
    rejectedInquiries,
    totalProducts,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    deliveredBookings,
    cancelledBookings,
    recentUsers,
    recentListings,
    recentProducts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'buyer' }),
    User.countDocuments({ role: 'admin' }),
    Farm.countDocuments(),
    Planting.countDocuments(),
    Device.countDocuments(),
    PhReading.countDocuments(),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'available' }),
    Listing.countDocuments({ status: 'reserved' }),
    Listing.countDocuments({ status: 'sold' }),
    Inquiry.countDocuments(),
    Inquiry.countDocuments({ status: 'pending' }),
    Inquiry.countDocuments({ status: 'accepted' }),
    Inquiry.countDocuments({ status: 'rejected' }),
    Product.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'delivered' }),
    Booking.countDocuments({ status: 'cancelled' }),
    User.find().select('-password').sort({ createdAt: -1 }).limit(5),
    Listing.find().populate('seller', 'name email').sort({ createdAt: -1 }).limit(5),
    Product.find().sort({ createdAt: -1 }).limit(5),
  ]);

  const counts = {
    users: {
      total: totalUsers,
      farmer: farmerUsers,
      buyer: buyerUsers,
      admin: adminUsers,
    },
    farms: totalFarms,
    plantings: totalPlantings,
    devices: totalDevices,
    readings: totalReadings,
    listings: {
      total: totalListings,
      available: availableListings,
      reserved: reservedListings,
      sold: soldListings,
    },
    inquiries: {
      total: totalInquiries,
      pending: pendingInquiries,
      accepted: acceptedInquiries,
      rejected: rejectedInquiries,
    },
    products: totalProducts,
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      delivered: deliveredBookings,
      cancelled: cancelledBookings,
    },
  };

  const overview = [
    { name: 'Users', value: totalUsers },
    { name: 'Farms', value: totalFarms },
    { name: 'Products', value: totalProducts },
    { name: 'Listings', value: totalListings },
    { name: 'Bookings', value: totalBookings },
  ];

  res.status(200).json({
    success: true,
    data: {
      counts,
      overview,
      recentUsers,
      recentListings,
      recentProducts,
    },
  });
});

// @desc    Get user by id with activity counts (admin only)
// @route   GET /api/admin/users/:id
// @access  Protected / Admin
export const getAdminUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  const [farmsCount, listingsCount, bookingsCount] = await Promise.all([
    Farm.countDocuments({ owner: user._id }),
    Listing.countDocuments({ seller: user._id }),
    Booking.countDocuments({ user: user._id }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      counts: {
        farms: farmsCount,
        listings: listingsCount,
        bookings: bookingsCount,
      },
    },
  });
});

// @desc    Update user profile and role (admin only)
// @route   PUT /api/admin/users/:id
// @access  Protected / Admin
export const updateAdminUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  const { name, phone, address, role } = req.body;

  if (role !== undefined) {
    if (!['farmer', 'buyer', 'admin'].includes(role)) {
      return next(new ApiError(400, 'Invalid user role'));
    }

    // An admin cannot change their own role
    if (user._id.toString() === req.user._id.toString() && role !== user.role) {
      return next(new ApiError(409, 'Admins cannot change their own role'));
    }

    // The last remaining admin cannot be demoted
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return next(new ApiError(409, 'Cannot demote the last remaining admin'));
      }
    }

    user.role = role;
  }

  if (name !== undefined) {
    if (!name.trim()) {
      return next(new ApiError(400, 'Name cannot be empty'));
    }
    user.name = name.trim();
  }

  if (phone !== undefined) {
    user.phone = phone.trim();
  }

  if (address !== undefined) {
    user.address = address.trim();
  }

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({
    success: true,
    data: userObj,
  });
});

// @desc    Delete user and cascade delete related data (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Protected / Admin
export const deleteAdminUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  // An admin cannot delete themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new ApiError(409, 'Admins cannot delete their own account'));
  }

  // An admin cannot delete another admin
  if (user.role === 'admin') {
    return next(new ApiError(409, 'Admins cannot delete other administrators'));
  }

  const userId = user._id;

  // 1. Delete the user's farms through deleteFarmCascade
  const userFarms = await Farm.find({ owner: userId });
  for (const f of userFarms) {
    await deleteFarmCascade(f._id);
  }

  // 2. Delete their listings together with those listings' inquiries
  const userListings = await Listing.find({ seller: userId });
  const userListingIds = userListings.map((l) => l._id);
  if (userListingIds.length > 0) {
    await Inquiry.deleteMany({ listing: { $in: userListingIds } });
    await Listing.deleteMany({ _id: { $in: userListingIds } });
  }

  // 3. Delete their own inquiries (as a buyer)
  await Inquiry.deleteMany({ buyer: userId });

  // 4. For their pending product bookings restore stock, then delete all their bookings
  const pendingProductBookings = await Booking.find({
    user: userId,
    type: 'product',
    status: 'pending',
  });

  for (const b of pendingProductBookings) {
    if (b.product && b.quantity > 0) {
      await Product.findByIdAndUpdate(b.product, { $inc: { stock: b.quantity } });
    }
  }

  await Booking.deleteMany({ user: userId });

  // 5. Delete their alerts
  await Alert.deleteMany({ user: userId });

  // 6. Delete the user document
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User and all associated data deleted successfully',
  });
});

export default {
  getAdminStats,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
};
