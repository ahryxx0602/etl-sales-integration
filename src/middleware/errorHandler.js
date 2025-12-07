import createError from 'http-errors';

/**
 * Error handler middleware cho Express
 * 
 * Xử lý các loại lỗi khác nhau và trả về response JSON phù hợp.
 * 
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  // Nếu response đã được gửi, delegate cho default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Nếu là http-errors, sử dụng status code và message từ đó
  if (err.status || err.statusCode) {
    const status = err.status || err.statusCode;
    return res.status(status).json({
      success: false,
      message: err.message || 'An error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Nếu là ValidationError từ Joi
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Validation error',
      errors: err.errors || err.details,
    });
  }

  // Default: 500 Internal Server Error
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Async handler wrapper để tự động catch errors
 * 
 * Giúp giảm code lặp lại try-catch trong controllers.
 * 
 * @param {Function} fn - Async function handler
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/endpoint', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json({ success: true, data });
 * }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Tạo http-errors từ các loại lỗi thông thường
 * 
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {import('http-errors').HttpError}
 */
export function createHttpError(status, message) {
  return createError(status, message);
}

