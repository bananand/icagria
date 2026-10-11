import ApiError from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Custom ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }
  // Mongoose duplicate key error (code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    if (fields.includes('email')) {
      message = 'Email is already registered';
    } else {
      const field = fields[0] || 'Field';
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }
  }
  // Mongoose CastError (e.g., invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }
  // Explicit statusCode attached to error
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message || 'Error occurred';
  }

  // Response with no stack trace
  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;
