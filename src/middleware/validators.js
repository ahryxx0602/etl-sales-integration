import { query, validationResult } from 'express-validator';
import { ETL_STATUS } from '../constants/etlConstants.js';

/**
 * Validation middleware cho logs query params
 * 
 * @returns {Array} Express-validator middleware array
 */
export const logsValidation = [
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
  query('status')
    .optional()
    .isIn(Object.values(ETL_STATUS))
    .withMessage(`status must be one of: ${Object.values(ETL_STATUS).join(', ')}`),
];

/**
 * Generic validation result handler
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export function validateRequest(req, res, next) {
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

