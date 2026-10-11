import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import {
  isValidEmail,
  isValidPassword,
  checkRequiredFields,
} from '../utils/validators.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, confirmPassword, role, phone, address } = req.body;

  // Validate required fields
  const missing = checkRequiredFields(['name', 'email', 'password', 'confirmPassword'], req.body);
  if (missing.length > 0) {
    return next(new ApiError(400, `Missing required fields: ${missing.join(', ')}`));
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return next(new ApiError(400, 'Invalid email format'));
  }

  // Validate password length
  if (!isValidPassword(password)) {
    return next(new ApiError(400, 'Password must be at least 8 characters long'));
  }

  // Validate password match
  if (password !== confirmPassword) {
    return next(new ApiError(400, 'Passwords do not match'));
  }

  // Role check: admin cannot be registered via public endpoint
  if (role === 'admin') {
    return next(new ApiError(403, 'Admin registration is not allowed'));
  }

  if (role && role !== 'farmer' && role !== 'buyer') {
    return next(new ApiError(400, 'Role must be either farmer or buyer'));
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check existing user to return 409
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(new ApiError(409, 'Email is already registered'));
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: role || 'farmer',
    phone: phone ? phone.trim() : undefined,
    address: address ? address.trim() : undefined,
  });

  const token = generateToken(user._id, user.role);

  const userObj = user.toObject();
  delete userObj.password;

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      token,
      user: userObj,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, 'Please provide email and password'));
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  // Identical 401 error message for unknown email or wrong password
  if (!user || !(await user.comparePassword(password))) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  const token = generateToken(user._id, user.role);

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({
    success: true,
    data: {
      token,
      user: userObj,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Protected
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return next(new ApiError(401, 'User no longer exists'));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update current logged in user profile
// @route   PUT /api/auth/me
// @access  Protected
export const updateMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return next(new ApiError(401, 'User no longer exists'));
  }

  const { name, phone, address } = req.body;

  // Only update name, phone, address. Role and email are ignored.
  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({
    success: true,
    data: userObj,
  });
});

export default {
  register,
  login,
  getMe,
  updateMe,
};
