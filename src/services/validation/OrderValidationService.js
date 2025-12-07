import { validateAndParseDate } from '../../utils/dateUtils.js';

/**
 * Service để validate order data
 * 
 * Sử dụng dayjs cho date parsing để code ngắn gọn và dễ maintain hơn.
 * Giữ lại validateOrderCode cho backward compatibility.
 * 
 * @class OrderValidationService
 */
export class OrderValidationService {
  /**
   * Validate order code
   * @param {string} orderCode - Order code cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validateOrderCode(orderCode) {
    if (!orderCode || typeof orderCode !== 'string') {
      return { valid: false, error: 'Order code is required' };
    }
    const trimmed = orderCode.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      return { valid: false, error: 'Order code must be 1-50 characters' };
    }
    return { valid: true, value: trimmed };
  }

  /**
   * Validate datetime - sử dụng dayjs
   * 
   * Thay thế logic parse thủ công bằng dayjs để code ngắn gọn và dễ maintain.
   * 
   * @param {string} dateTimeStr - Date string cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validateDateTime(dateTimeStr) {
    return validateAndParseDate(dateTimeStr);
  }
}

