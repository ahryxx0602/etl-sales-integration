import { addVietnameseAccentsToName, fixProductName } from '../utils/vietnameseUtils.js';
import { DEFAULT_CURRENCY, SOURCE_TYPE } from '../constants/etlConstants.js';
import { validateOrderData } from '../schemas/orderSchema.js';

/**
 * @typedef {import('../types/etlTypes.js').RawOrderData} RawOrderData
 * @typedef {import('../types/etlTypes.js').TransformedOrderData} TransformedOrderData
 * @typedef {import('../types/etlTypes.js').TransformResult} TransformResult
 */

/**
 * Service xử lý transform và chuẩn hóa dữ liệu đơn hàng
 * 
 * Chịu trách nhiệm:
 * - Chuẩn hóa format dữ liệu (ngày tháng, tiền tệ, SKU)
 * - Sửa dấu tiếng Việt cho tên sản phẩm, khách hàng, cửa hàng
 * - Validate dữ liệu thông qua ValidationService
 * 
 * @class TransformService
 */
export class TransformService {
  /**
   * Tạo instance TransformService
   * @param {ValidationService} validationService - Service để validate dữ liệu
   */
  constructor(validationService) {
    this.validationService = validationService;
  }

  /**
   * Chuẩn hóa tên sản phẩm
   * - Viết hoa chữ cái đầu mỗi từ
   * - Áp dụng mappings cho các từ khóa phổ biến
   * 
   * @param {string|null|undefined} productName - Tên sản phẩm cần chuẩn hóa
   * @returns {string|null} Tên sản phẩm đã chuẩn hóa, hoặc null nếu input rỗng
   * 
   * @example
   * normalizeProductName('laptop dell') // => 'Laptop Dell'
   * normalizeProductName('điện thoại samsung') // => 'Điện Thoại Samsung'
   * normalizeProductName(null) // => null
   */
  normalizeProductName(productName) {
    if (!productName) return null;
    let name = String(productName).trim();
    
    // Chuẩn hóa tên sản phẩm
    const mappings = {
      'laptop': 'Laptop',
      'điện thoại': 'Điện thoại',
      'tai nghe': 'Tai nghe',
      'bluetooth': 'Bluetooth',
      'dell': 'Dell',
      'samsung': 'Samsung',
    };
    
    // Viết hoa chữ cái đầu
    name = name.replace(/\b\w/g, (char) => char.toUpperCase());
    
    return name;
  }

  /**
   * Transform và chuẩn hóa dữ liệu đơn hàng từ raw data
   * 
   * Quy trình:
   * 1. Chuẩn bị dữ liệu cho validation (map các field names khác nhau)
   * 2. Validate với Joi schema (thay thế validation từng field)
   * 3. Transform dữ liệu đã validate (sửa dấu tiếng Việt, format)
   * 4. Trả về kết quả với danh sách lỗi (nếu có)
   * 
   * @param {RawOrderData} rawData - Dữ liệu thô từ extract
   * @param {string} [sourceType='old_db'] - Loại nguồn dữ liệu: 'old_db', 'csv', 'raw_orders'
   * @returns {TransformResult} Kết quả transform với valid flag, data và errors
   * 
   * @example
   * const transformService = new TransformService(validationService);
   * const result = transformService.transformOrderData({
   *   order_code: 'ORD001',
   *   store_code: 'STORE01',
   *   customer_phone: '0912345678',
   *   order_date: '2024-01-15 10:30:00',
   *   item_sku: 'SKU001',
   *   item_name: 'Lap top Dell',
   *   qty: 2,
   *   unit_price: 15000000,
   *   currency: 'vnd'
   * }, 'csv');
   * 
   * if (result.valid) {
   *   console.log('Transformed data:', result.data);
   * } else {
   *   console.error('Validation errors:', result.errors);
   * }
   */
  transformOrderData(rawData, sourceType = SOURCE_TYPE.OLD_DB) {
    // Chuẩn bị dữ liệu cho validation (map các field names khác nhau)
    const dataToValidate = {
      order_code: rawData.order_code || rawData.order_id,
      store_code: rawData.store_code,
      customer_phone: rawData.customer_phone,
      customer_email: rawData.customer_email,
      order_date: rawData.order_date,
      item_sku: rawData.item_sku || rawData.sku,
      item_name: rawData.item_name || rawData.product_name,
      qty: rawData.qty,
      unit_price: rawData.unit_price,
      currency: rawData.currency || DEFAULT_CURRENCY,
      store_name: rawData.store_name,
      customer_name: rawData.customer_name,
      product_name: rawData.product_name,
      category: rawData.category,
      record_id: rawData.record_id,
      source_file: rawData.source_file,
      source_type: sourceType,
    };

    // Validate với Joi schema (thay thế validation từng field)
    const validationResult = validateOrderData(dataToValidate);
    
    if (!validationResult.valid) {
      return {
        valid: false,
        errors: validationResult.errors,
      };
    }

    // Transform dữ liệu đã validate
    const transformed = {
      ...validationResult.data,
      // Đổi order_date thành order_datetime (đã được format bởi dayjs)
      order_datetime: validationResult.data.order_date,
      // Sửa dấu tiếng Việt
      item_name: fixProductName(validationResult.data.item_name),
      store_name: validationResult.data.store_name 
        ? addVietnameseAccentsToName(validationResult.data.store_name) 
        : null,
      customer_name: validationResult.data.customer_name
        ? addVietnameseAccentsToName(validationResult.data.customer_name)
        : null,
      product_name: validationResult.data.product_name
        ? fixProductName(validationResult.data.product_name)
        : null,
      category: validationResult.data.category
        ? addVietnameseAccentsToName(validationResult.data.category)
        : null,
    };

    // Xóa order_date vì đã có order_datetime
    delete transformed.order_date;

    return {
      valid: true,
      data: transformed,
    };
  }
}
