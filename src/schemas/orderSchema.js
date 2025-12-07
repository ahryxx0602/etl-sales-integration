import Joi from 'joi';
import { VALIDATION_LIMITS, SOURCE_TYPE, DEFAULT_CURRENCY } from '../constants/etlConstants.js';
import { validateAndParseDate } from '../utils/dateUtils.js';

/**
 * Custom Joi extension để validate date với nhiều format
 */
const customDateValidation = (value, helpers) => {
  const result = validateAndParseDate(value);
  if (!result.valid) {
    return helpers.error('date.custom', { message: result.error });
  }
  return result.value;
};

/**
 * Schema validation cho order data
 * 
 * Sử dụng Joi để validate tất cả các trường của order data.
 * Hỗ trợ cả required và optional fields.
 * 
 * @module schemas/orderSchema
 */
export const orderSchema = Joi.object({
  order_code: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Order code is required',
      'string.max': 'Order code must be 1-50 characters',
      'any.required': 'Order code is required',
    }),
  
  store_code: Joi.string()
    .min(1)
    .max(VALIDATION_LIMITS.MAX_STORE_CODE_LENGTH)
    .required()
    .messages({
      'string.empty': 'Store code is required',
      'string.max': `Store code must be 1-${VALIDATION_LIMITS.MAX_STORE_CODE_LENGTH} characters`,
      'any.required': 'Store code is required',
    }),
  
  customer_phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Phone must be 10-11 digits',
    }),
  
  order_date: Joi.string()
    .custom(customDateValidation, 'custom date validation')
    .required()
    .messages({
      'any.required': 'Order date is required',
      'date.custom': 'Invalid date format',
    }),
  
  item_sku: Joi.string()
    .min(1)
    .max(VALIDATION_LIMITS.MAX_SKU_LENGTH)
    .required()
    .messages({
      'string.empty': 'SKU is required',
      'string.max': `SKU must be 1-${VALIDATION_LIMITS.MAX_SKU_LENGTH} characters`,
      'any.required': 'SKU is required',
    }),
  
  item_name: Joi.string()
    .min(1)
    .max(VALIDATION_LIMITS.MAX_PRODUCT_NAME_LENGTH)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.max': `Product name must be 1-${VALIDATION_LIMITS.MAX_PRODUCT_NAME_LENGTH} characters`,
      'any.required': 'Product name is required',
    }),
  
  qty: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.positive': 'Quantity must be greater than 0',
      'number.integer': 'Quantity must be an integer',
      'any.required': 'Quantity is required',
    }),
  
  unit_price: Joi.number()
    .positive()
    .max(VALIDATION_LIMITS.MAX_PRICE)
    .required()
    .messages({
      'number.base': 'Unit price must be a number',
      'number.positive': 'Unit price must be greater than 0',
      'number.max': `Unit price must be less than ${VALIDATION_LIMITS.MAX_PRICE}`,
      'any.required': 'Unit price is required',
    }),
  
  currency: Joi.string()
    .uppercase()
    .default(DEFAULT_CURRENCY)
    .optional(),
  
  // Optional fields
  store_name: Joi.string().allow(null, '').optional(),
  customer_name: Joi.string().allow(null, '').optional(),
  customer_email: Joi.string().email().allow(null, '').optional(),
  product_name: Joi.string().allow(null, '').optional(),
  category: Joi.string().allow(null, '').optional(),
  record_id: Joi.number().optional(),
  source_file: Joi.string().optional(),
  source_type: Joi.string()
    .valid(SOURCE_TYPE.OLD_DB, SOURCE_TYPE.CSV, SOURCE_TYPE.RAW_ORDERS)
    .optional(),
});

/**
 * Validate order data với Joi schema
 * 
 * @param {Object} data - Dữ liệu cần validate
 * @returns {{valid: boolean, data?: Object, errors?: Array<{field: string, error: string}>}}
 *   - `valid`: true nếu validation thành công
 *   - `data`: Dữ liệu đã được validate và normalize (chỉ có nếu valid = true)
 *   - `errors`: Danh sách lỗi validation (chỉ có nếu valid = false)
 * 
 * @example
 * const result = validateOrderData({
 *   order_code: 'ORD001',
 *   store_code: 'STORE01',
 *   order_date: '2024-01-15',
 *   item_sku: 'SKU001',
 *   item_name: 'Product Name',
 *   qty: 2,
 *   unit_price: 1000000
 * });
 * 
 * if (result.valid) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 */
export function validateOrderData(data) {
  const { error, value } = orderSchema.validate(data, {
    abortEarly: false, // Trả về tất cả lỗi, không dừng ở lỗi đầu tiên
    stripUnknown: true, // Loại bỏ fields không có trong schema
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      error: detail.message,
    }));
    
    return {
      valid: false,
      errors,
    };
  }
  
  return {
    valid: true,
    data: value,
  };
}

