/**
 * Main Validation Service - Facade pattern để orchestrate các validation services con
 * 
 * Lưu ý: TransformService đã sử dụng Joi schema trực tiếp để validate order data.
 * Các methods trong ValidationService được giữ lại cho backward compatibility
 * và các validation đơn giản khác.
 * 
 * @class ValidationService
 */
import { OrderValidationService } from './OrderValidationService.js';
import { ProductValidationService } from './ProductValidationService.js';
import { CustomerValidationService } from './CustomerValidationService.js';
import { StoreValidationService } from './StoreValidationService.js';

export class ValidationService {
  /**
   * Tạo instance ValidationService
   */
  constructor() {
    // Tạo các sub-services
    this.orderValidation = new OrderValidationService();
    this.productValidation = new ProductValidationService();
    this.customerValidation = new CustomerValidationService();
    this.storeValidation = new StoreValidationService();
  }

  /**
   * Validate store code
   * @param {string} storeCode - Store code cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validateStoreCode(storeCode) {
    return this.storeValidation.validateStoreCode(storeCode);
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validatePhone(phone) {
    return this.customerValidation.validatePhone(phone);
  }

  /**
   * Validate email
   * @param {string} email - Email cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validateEmail(email) {
    return this.customerValidation.validateEmail(email);
  }

  /**
   * Validate SKU
   * @param {string} sku - SKU cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validateSku(sku) {
    return this.productValidation.validateSku(sku);
  }

  /**
   * Validate quantity
   * @param {number} qty - Quantity cần validate
   * @returns {{valid: boolean, value?: number, error?: string}}
   */
  validateQty(qty) {
    return this.productValidation.validateQty(qty);
  }

  /**
   * Validate price
   * @param {number} price - Price cần validate
   * @returns {{valid: boolean, value?: number, error?: string}}
   */
  validatePrice(price) {
    return this.productValidation.validatePrice(price);
  }

  /**
   * Validate order code
   * @param {string} orderCode - Order code cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validateOrderCode(orderCode) {
    return this.orderValidation.validateOrderCode(orderCode);
  }

  /**
   * Validate date time
   * @param {string} dateTimeStr - Date time string cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validateDateTime(dateTimeStr) {
    return this.orderValidation.validateDateTime(dateTimeStr);
  }

  /**
   * Validate product name
   * @param {string} productName - Product name cần validate
   * @returns {{valid: boolean, value?: string, error?: string}}
   */
  validateProductName(productName) {
    return this.productValidation.validateProductName(productName);
  }
}

