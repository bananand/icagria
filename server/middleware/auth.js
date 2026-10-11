import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ApiError(401, 'Not authorized, user no longer exists'));
    }

    // Assign full user document loaded from database
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Not authorized, invalid token'));
    }
    return next(error);
  }
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    // Always check the role loaded from the database record
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: Access denied'));
    }
    next();
  };
};

export default { protect, authorize };
