import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Protected/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: users,
  });
});

export default {
  getUsers,
};
