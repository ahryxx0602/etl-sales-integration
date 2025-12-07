import { query, validationResult } from 'express-validator';
import { createHttpError } from './errorHandler.js';

/**
 * Validation middleware cho pagination query params
 * 
 * @returns {Array} Express-validator middleware array
 */
export const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('limit must be between 1 and 1000')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be >= 0')
    .toInt(),
];

/**
 * Parse pagination params từ request
 * 
 * @param {import('express').Request} req - Express request
 * @returns {{limit: number, offset: number}} Pagination params
 */
export function parsePagination(req) {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  return { limit, offset };
}

/**
 * Validate pagination và trả về lỗi nếu không hợp lệ
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export function validatePagination(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
  }
  next();
}

/**
 * Format pagination response
 * 
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 * @returns {Object} Formatted response
 */
export function formatPaginationResponse(data, total, limit, offset) {
  return {
    success: true,
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  };
}

